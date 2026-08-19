/**
 * Script de coleta de métricas para comparação Monólito x Microfrontends.
 *
 * Coleta:
 *  1. Tempo de build sequencial (monólito vs. cada MFE e soma)
 *  2. Tempo de build paralelo dos MFEs (pipelines independentes)
 *  3. Build incremental: tempo e bytes a republicar ao alterar 1 módulo
 *  4. Tamanho dos bundles (dist)
 *  5. Cold start do dev server (DX)
 *  6. Performance em runtime via Lighthouse (FCP, LCP, TBT, CLS, SI, TTI, bytes)
 *  7. Bytes transferidos por rota (carregamento sob demanda)
 *  8. Resiliência: isolamento de falha com um MFE fora do ar
 *  9. Acoplamento: imports cruzados entre módulos
 *
 * Uso: npm run measure -w metrics   (ou `npm run metrics` na raiz)
 *
 * O script sobe o backend e os servidores de preview automaticamente
 * e os encerra ao final.
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MONOLITH = { name: 'Monólito', dir: path.join(ROOT, 'monolith'), url: 'http://localhost:4173', port: 4173 };
const MFES = [
  { name: 'shell', dir: path.join(ROOT, 'microfrontends', 'shell'), url: 'http://localhost:5000', port: 5000 },
  { name: 'products-mfe', dir: path.join(ROOT, 'microfrontends', 'products-mfe'), url: 'http://localhost:5001', port: 5001 },
  { name: 'cart-mfe', dir: path.join(ROOT, 'microfrontends', 'cart-mfe'), url: 'http://localhost:5002', port: 5002 },
];
const BACKEND_DIR = path.join(ROOT, 'backend');

// ---------- utilidades de processo ----------
const children = [];
function killAll() {
  for (const c of children) {
    try {
      process.kill(-c.pid, 'SIGTERM');
    } catch {
      try { c.kill('SIGTERM'); } catch { /* já morto */ }
    }
  }
}
process.on('exit', killAll);
process.on('SIGINT', () => { killAll(); process.exit(130); });

function sh(cmd, args, cwd) {
  const start = performance.now();
  const result = spawnSync(cmd, args, { cwd, stdio: 'pipe', shell: true });
  const ms = performance.now() - start;
  if (result.status !== 0) {
    throw new Error(
      `Falha ao rodar "${cmd} ${args.join(' ')}" em ${cwd}:\n${result.stderr?.toString()}`
    );
  }
  return { ms, out: result.stdout?.toString() || '' };
}

function start(cmd, args, cwd, opts = {}) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: opts.pipe ? 'pipe' : 'ignore',
    shell: true,
    detached: true,
  });
  children.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch { /* ainda não subiu */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timeout esperando ${url}`);
}

// ---------- utilidades de diretório ----------
function dirStats(dir) {
  let total = 0;
  const files = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const size = fs.statSync(full).size;
        total += size;
        files.push({ file: path.relative(dir, full), bytes: size });
      }
    }
  })(dir);
  files.sort((a, b) => b.bytes - a.bytes);
  return { total, files };
}

function hashDist(dir) {
  const map = {};
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const content = fs.readFileSync(full);
        map[path.relative(dir, full)] = {
          hash: crypto.createHash('md5').update(content).digest('hex'),
          size: content.length,
        };
      }
    }
  })(dir);
  return map;
}

/** Bytes que um usuário/deploy precisa baixar após uma mudança (arquivos novos ou alterados). */
function changedBytes(before, after) {
  let bytes = 0;
  const changed = [];
  for (const [file, info] of Object.entries(after)) {
    if (!before[file] || before[file].hash !== info.hash) {
      bytes += info.size;
      changed.push({ file, bytes: info.size });
    }
  }
  changed.sort((a, b) => b.bytes - a.bytes);
  return { bytes, changed };
}

const kb = (bytes) => (bytes / 1024).toFixed(1);
const sec = (ms) => (ms / 1000).toFixed(2);

// ---------- 1. Build sequencial ----------
console.log('\n=== 1/9 Builds sequenciais ===');
const buildTimes = {};

console.log('Build do monólito…');
buildTimes['Monólito'] = sh('npm', ['run', 'build'], MONOLITH.dir).ms;

let mfeTotal = 0;
for (const mfe of MFES) {
  console.log(`Build de ${mfe.name}…`);
  buildTimes[mfe.name] = sh('npm', ['run', 'build'], mfe.dir).ms;
  mfeTotal += buildTimes[mfe.name];
}
buildTimes['MFEs (soma sequencial)'] = mfeTotal;

// ---------- 2. Build paralelo dos MFEs (pipelines independentes) ----------
console.log('\n=== 2/9 Build paralelo dos MFEs ===');
const parallelStart = performance.now();
await Promise.all(
  MFES.map(
    (mfe) =>
      new Promise((resolve, reject) => {
        const p = spawn('npm', ['run', 'build'], { cwd: mfe.dir, shell: true, stdio: 'pipe' });
        let err = '';
        p.stderr.on('data', (d) => (err += d));
        p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build ${mfe.name}: ${err}`))));
      })
  )
);
const parallelBuildMs = performance.now() - parallelStart;
console.log(`Wall time: ${sec(parallelBuildMs)}s`);

// ---------- 3. Build incremental + custo de redeploy ----------
console.log('\n=== 3/9 Build incremental (alteração em 1 módulo) ===');

function incrementalBuild(app, fileToTouch, searchString) {
  const filePath = path.join(app.dir, fileToTouch);
  const original = fs.readFileSync(filePath, 'utf8');
  if (!original.includes(searchString)) {
    throw new Error(`String "${searchString}" não encontrada em ${filePath}`);
  }
  const before = hashDist(path.join(app.dir, 'dist'));
  try {
    // alteração que sobrevive à minificação (string renderizada)
    fs.writeFileSync(filePath, original.replace(searchString, `${searchString} [touch ${Date.now()}]`));
    const { ms } = sh('npm', ['run', 'build'], app.dir);
    const after = hashDist(path.join(app.dir, 'dist'));
    return { ms, redeploy: changedBytes(before, after) };
  } finally {
    fs.writeFileSync(filePath, original);
  }
}

// Monólito: alterar a HomePage (equivalente ao ProductList dos MFEs)
const incMono = incrementalBuild(MONOLITH, 'src/pages/HomePage.jsx', 'Carregando produtos…');
// MFE: alterar o ProductList — só o products-mfe precisa rebuildar/republicar
const incMfe = incrementalBuild(MFES[1], 'src/ProductList.jsx', 'Carregando produtos…');

// deixa os dists em estado limpo novamente
sh('npm', ['run', 'build'], MONOLITH.dir);
sh('npm', ['run', 'build'], MFES[1].dir);

console.log(`Monólito: rebuild ${sec(incMono.ms)}s, redeploy ${kb(incMono.redeploy.bytes)}KB`);
console.log(`products-mfe: rebuild ${sec(incMfe.ms)}s, redeploy ${kb(incMfe.redeploy.bytes)}KB`);

// ---------- 4. Tamanho dos bundles ----------
console.log('\n=== 4/9 Medindo bundles (dist) ===');
const bundleSizes = {};
bundleSizes['Monólito'] = dirStats(path.join(MONOLITH.dir, 'dist'));
let mfeBytes = 0;
for (const mfe of MFES) {
  bundleSizes[mfe.name] = dirStats(path.join(mfe.dir, 'dist'));
  mfeBytes += bundleSizes[mfe.name].total;
}
bundleSizes['MFEs (soma)'] = { total: mfeBytes, files: [] };

// ---------- 5. Cold start do dev server ----------
console.log('\n=== 5/9 Cold start do dev server ===');

async function devColdStart(app) {
  return new Promise((resolve) => {
    const child = start('npm', ['run', 'dev'], app.dir, { pipe: true });
    let buf = '';
    const timeout = setTimeout(() => {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { /* noop */ }
      resolve(null);
    }, 20000);
    child.stdout.on('data', (d) => {
      buf += d;
      const m = buf.match(/ready in (\d+)\s*ms/);
      if (m) {
        clearTimeout(timeout);
        try { process.kill(-child.pid, 'SIGTERM'); } catch { /* noop */ }
        resolve(Number(m[1]));
      }
    });
  });
}

const devStart = {};
for (const app of [MONOLITH, ...MFES]) {
  devStart[app.name] = await devColdStart(app);
  console.log(`${app.name}: ${devStart[app.name] ?? 'timeout'}ms`);
}

// ---------- Sobe backend + previews para as medições de runtime ----------
console.log('\nSubindo backend e servidores de preview…');
start('node', ['server.js'], BACKEND_DIR);
start('npm', ['run', 'preview'], MONOLITH.dir);
for (const mfe of MFES) start('npm', ['run', 'preview'], mfe.dir);

await waitFor('http://localhost:4000/api/health');
await waitFor(MONOLITH.url);
for (const mfe of MFES) await waitFor(mfe.url);
await new Promise((r) => setTimeout(r, 1500));

// ---------- 6. Lighthouse ----------
console.log('\n=== 6/9 Performance (Lighthouse) ===');
let lighthouseResults = null;
try {
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');

  // Usa o Chrome do sistema se existir; senão, o Chromium do puppeteer
  let chromePath;
  try {
    chromePath = chromeLauncher.getChromePath();
  } catch {
    const { default: puppeteer } = await import('puppeteer');
    chromePath = puppeteer.executablePath();
  }

  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const audits = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'interactive',
  ];

  async function runLighthouse(url) {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['performance'],
      formFactor: 'desktop',
      screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    });
    const a = result.lhr.audits;
    const out = { performanceScore: Math.round(result.lhr.categories.performance.score * 100) };
    for (const key of audits) {
      out[key] = a[key] ? Math.round(a[key].numericValue * 100) / 100 : null;
    }
    out['total-byte-weight'] = a['total-byte-weight']
      ? Math.round(a['total-byte-weight'].numericValue)
      : null;
    return out;
  }

  console.log('Lighthouse: monólito…');
  const mono = await runLighthouse(MONOLITH.url);
  console.log('Lighthouse: microfrontends (shell)…');
  const mfe = await runLighthouse(MFES[0].url);
  await chrome.kill();

  lighthouseResults = { Monólito: mono, Microfrontends: mfe };
} catch (e) {
  console.warn(`\n⚠ Lighthouse indisponível (${e.message}). Métricas de runtime puladas.`);
}

// ---------- 7. Bytes por rota (carregamento sob demanda) ----------
console.log('\n=== 7/9 Bytes por rota (navegação real via puppeteer) ===');
let routeBytes = null;
let resilience = null;
try {
  const { default: puppeteer } = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true });

  async function measureRoutes(baseUrl, origins) {
    const page = await browser.newPage();
    const client = await page.createCDPSession();
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: true });

    const requestUrls = {};
    client.on('Network.requestWillBeSent', (e) => {
      requestUrls[e.requestId] = e.request.url;
    });
    let bytes = 0;
    client.on('Network.loadingFinished', (e) => {
      const url = requestUrls[e.requestId] || '';
      // conta apenas o tráfego da(s) aplicação(ões) — exclui imagens externas e API
      if (origins.some((o) => url.startsWith(o))) bytes += e.encodedDataLength;
    });

    const result = {};
    // home (primeira carga completa)
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.card', { timeout: 15000 }).catch(() => {});
    result.home = bytes;

    // navega para /cart via SPA (sem reload)
    bytes = 0;
    await page.click('a[href="/cart"]');
    await new Promise((r) => setTimeout(r, 2500));
    result.cart = bytes;

    // volta para home e abre um detalhe de produto
    await page.click('a[href="/"]');
    await page.waitForSelector('.card', { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1000));
    bytes = 0;
    await page.click('a[href^="/product/"]');
    await new Promise((r) => setTimeout(r, 2500));
    result.productDetail = bytes;

    await page.close();
    return result;
  }

  routeBytes = {};
  routeBytes['Monólito'] = await measureRoutes(MONOLITH.url, [MONOLITH.url]);
  // nos MFEs, conta o tráfego do shell + remotes (todos fazem parte da aplicação)
  routeBytes['Microfrontends'] = await measureRoutes(
    MFES[0].url,
    MFES.map((m) => m.url)
  );

  // ---------- 8. Resiliência: cart-mfe fora do ar ----------
  console.log('\n=== 8/9 Resiliência (cart-mfe bloqueado) ===');
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().startsWith('http://localhost:5002')) req.abort();
    else req.continue();
  });
  await page.goto(MFES[0].url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.card', { timeout: 15000 }).catch(() => {});
  const productsOk = (await page.$$('.card')).length === 12;
  await page.click('.card .btn-primary').catch(() => {});
  await new Promise((r) => setTimeout(r, 400));
  const badgeOk = (await page.$eval('.cart-badge', (el) => el.textContent).catch(() => null)) === '1';
  const headerOk = await page.$eval('.logo', (el) => el.textContent.includes('MiniShop')).catch(() => false);
  // navega para /cart: deve mostrar o boundary de erro, sem derrubar a página
  await page.click('a[href="/cart"]').catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  const degradedOk = await page
    .$eval('body', (el) => el.textContent.includes('Microfrontend indisponível'))
    .catch(() => false);
  const stillAlive = await page.$eval('.logo', (el) => el.textContent.includes('MiniShop')).catch(() => false);
  resilience = {
    productsOk,
    badgeOk,
    headerOk,
    degradedOk,
    stillAlive,
  };
  await page.close();
  await browser.close();
} catch (e) {
  console.warn(`\n⚠ Testes com puppeteer falharam (${e.message}).`);
}

killAll();

// ---------- 9. Acoplamento entre módulos ----------
console.log('\n=== 9/9 Acoplamento (imports cruzados) ===');

function listSourceFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(full);
    }
  })(dir);
  return out;
}

/** Monólito: imports que cruzam as fronteiras entre módulos de feature (pages/components/cart). */
function countMonolithCrossImports() {
  const src = path.join(MONOLITH.dir, 'src');
  const modules = ['pages', 'components', 'cart'];
  let cross = 0;
  const detail = [];
  for (const file of listSourceFiles(src)) {
    const rel = path.relative(src, file);
    const fromModule = rel.split(path.sep)[0];
    if (!modules.includes(fromModule)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const m of content.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const target = path.relative(src, path.resolve(path.dirname(file), m[1]));
      const toModule = target.split(path.sep)[0];
      if (modules.includes(toModule) && toModule !== fromModule) {
        cross++;
        detail.push(`${rel} → ${toModule}/`);
      }
    }
  }
  return { cross, detail };
}

/** MFEs: imports de um MFE dentro de outro MFE (deve ser 0). Os imports de
 *  federação no shell (composição intencional) são contados separadamente. */
function countMfeCoupling() {
  let crossMfeImports = 0;
  let federationImports = 0;
  for (const mfe of MFES) {
    for (const file of listSourceFiles(path.join(mfe.dir, 'src'))) {
      const content = fs.readFileSync(file, 'utf8');
      for (const m of content.matchAll(/(?:from|import)\s*\(?\s*['"]([\w-]+Mfe)\//g)) {
        if (mfe.name === 'shell') {
          // composição intencional: shell carregando seus remotes via Module Federation
          federationImports++;
        } else {
          crossMfeImports++;
        }
      }
    }
  }
  return { crossMfeImports, federationImports };
}

const couplingMono = countMonolithCrossImports();
const couplingMfe = countMfeCoupling();

// ================= Relatório =================
const date = new Date().toISOString();
const lines = [];
lines.push('# Relatório comparativo — Monólito x Microfrontends', '');
lines.push(`_Gerado em ${date}_`, '');

// --- builds ---
lines.push('## 1. Tempo de build (sequencial)', '');
lines.push('| Projeto | Tempo (s) |', '|---|---:|');
for (const [name, ms] of Object.entries(buildTimes)) {
  lines.push(`| ${name} | ${sec(ms)} |`);
}
lines.push('');
lines.push('## 2. Build paralelo (pipelines de CI independentes)', '');
lines.push('| Cenário | Tempo (s) |', '|---|---:|');
lines.push(`| Monólito (sempre sequencial) | ${sec(buildTimes['Monólito'])} |`);
lines.push(`| MFEs em paralelo (wall time) | ${sec(parallelBuildMs)} |`);
lines.push(`| MFEs em sequencial (soma) | ${sec(mfeTotal)} |`);
lines.push('');
lines.push('> Na arquitetura de MFEs cada aplicação tem pipeline própria: os builds rodam em paralelo e o tempo total é o do mais lento, não a soma.', '');

// --- incremental ---
lines.push('## 3. Build incremental — alteração em 1 módulo', '');
lines.push('Simulação: alterar a listagem de produtos (HomePage no monólito, ProductList no products-mfe).', '');
lines.push('| Métrica | Monólito | Microfrontends |', '|---|---:|---:|');
lines.push(`| Tempo de rebuild (s) | ${sec(incMono.ms)} | ${sec(incMfe.ms)} |`);
lines.push(`| Bytes a republicar | ${kb(incMono.redeploy.bytes)} KB | ${kb(incMfe.redeploy.bytes)} KB |`);
lines.push(`| Bytes rebaixados por usuário recorrente | ${kb(incMono.redeploy.bytes)} KB | ${kb(incMfe.redeploy.bytes)} KB |`);
lines.push('');
lines.push('### Arquivos alterados (monólito)', '', '| Arquivo | KB |', '|---|---:|');
for (const f of incMono.redeploy.changed.slice(0, 5)) lines.push(`| ${f.file} | ${kb(f.bytes)} |`);
lines.push('', '### Arquivos alterados (products-mfe)', '', '| Arquivo | KB |', '|---|---:|');
for (const f of incMfe.redeploy.changed.slice(0, 5)) lines.push(`| ${f.file} | ${kb(f.bytes)} |`);
lines.push('');
lines.push('> No monólito, qualquer alteração invalida o bundle inteiro (hash do arquivo muda): todos os usuários rebaixam a aplicação completa. Nos MFEs, só os chunks do módulo alterado são invalidados; shell e demais remotes continuam servidos do cache do navegador.', '');

// --- bundles ---
lines.push('## 4. Tamanho dos bundles (dist)', '');
lines.push('| Projeto | Total (KB) |', '|---|---:|');
for (const [name, stats] of Object.entries(bundleSizes)) {
  lines.push(`| ${name} | ${kb(stats.total)} |`);
}
lines.push('');
lines.push('### Maiores arquivos do monólito', '', '| Arquivo | KB |', '|---|---:|');
for (const f of bundleSizes['Monólito'].files.slice(0, 5)) lines.push(`| ${f.file} | ${kb(f.bytes)} |`);
for (const mfe of MFES) {
  lines.push('', `### ${mfe.name}`, '', '| Arquivo | KB |', '|---|---:|');
  for (const f of bundleSizes[mfe.name].files.slice(0, 5)) lines.push(`| ${f.file} | ${kb(f.bytes)} |`);
}
lines.push('');

// --- dev server ---
lines.push('## 5. Cold start do dev server (DX)', '');
lines.push('| Aplicação | Tempo até "ready" (ms) |', '|---|---:|');
for (const app of [MONOLITH, ...MFES]) {
  lines.push(`| ${app.name} | ${devStart[app.name] ?? '—'} |`);
}
lines.push('');
lines.push('> Times trabalhando em MFEs sobem apenas a aplicação do seu escopo. Com o crescimento do monólito, essa diferença tende a aumentar (mais módulos para transformar).', '');

// --- lighthouse ---
if (lighthouseResults) {
  lines.push('## 6. Performance em runtime (Lighthouse, desktop)', '');
  const keys = Object.keys(lighthouseResults['Monólito']);
  lines.push('| Métrica | Monólito | Microfrontends |', '|---|---:|---:|');
  for (const k of keys) {
    const mono = lighthouseResults['Monólito'][k];
    const mfe = lighthouseResults['Microfrontends'][k];
    const fmt = (v) =>
      v == null ? '—' : k === 'total-byte-weight'
        ? `${kb(v)} KB`
        : k === 'performanceScore' || k === 'cumulative-layout-shift'
          ? String(v)
          : `${v} ms`;
    lines.push(`| ${k} | ${fmt(mono)} | ${fmt(mfe)} |`);
  }
  lines.push('');
}

// --- bytes por rota ---
if (routeBytes) {
  lines.push('## 7. Bytes transferidos por rota (mesma origem, cache desabilitado)', '');
  lines.push('| Rota | Monólito | Microfrontends |', '|---|---:|---:|');
  lines.push(`| Home (primeira carga) | ${kb(routeBytes['Monólito'].home)} KB | ${kb(routeBytes['Microfrontends'].home)} KB |`);
  lines.push(`| + navegação para /cart | ${kb(routeBytes['Monólito'].cart)} KB | ${kb(routeBytes['Microfrontends'].cart)} KB |`);
  lines.push(`| + navegação para /product/:id | ${kb(routeBytes['Monólito'].productDetail)} KB | ${kb(routeBytes['Microfrontends'].productDetail)} KB |`);
  lines.push('');
  lines.push('> O monólito carrega o código de todas as features na primeira carga. Nos MFEs, o código de cada módulo só é baixado quando a rota correspondente é acessada. Com apenas 2–3 módulos a diferença é pequena; em aplicações com dezenas de módulos, a primeira carga do monólito cresce linearmente enquanto a do shell permanece ~constante.', '');
}

// --- resiliência ---
if (resilience) {
  lines.push('## 8. Resiliência — isolamento de falhas', '');
  lines.push('Cenário: **cart-mfe fora do ar** (todas as requisições ao remote bloqueadas).', '');
  lines.push('| Verificação | Resultado |', '|---|---|');
  lines.push(`| Home (products-mfe) continua renderizando | ${resilience.productsOk ? '✅' : '❌'} |`);
  lines.push(`| Adicionar ao carrinho / badge continua funcionando | ${resilience.badgeOk ? '✅' : '❌'} |`);
  lines.push(`| Header e navegação íntegros | ${resilience.headerOk ? '✅' : '❌'} |`);
  lines.push(`| Rota /cart degrada graciosamente (error boundary) | ${resilience.degradedOk ? '✅' : '❌'} |`);
  lines.push(`| Página continua viva após a falha | ${resilience.stillAlive ? '✅' : '❌'} |`);
  lines.push('');
  lines.push('> No monólito não existe isolamento equivalente: uma falha de build ou um erro fatal de runtime em qualquer módulo derruba a aplicação inteira. Nos MFEs, a falha fica contida no boundary do módulo.', '');
}

// --- acoplamento ---
lines.push('## 9. Acoplamento entre módulos', '');
lines.push('| Métrica | Monólito | Microfrontends |', '|---|---:|---:|');
lines.push(`| Imports estáticos cruzando fronteiras de módulos | ${couplingMono.cross} | ${couplingMfe.crossMfeImports} |`);
lines.push('');
lines.push('Detalhe dos imports cruzados no monólito:', '');
for (const d of couplingMono.detail) lines.push(`- ${d}`);
lines.push('');
lines.push(`> Nos MFEs a comunicação entre módulos ocorre apenas por contratos explícitos: ${couplingMfe.federationImports} imports dinâmicos via Module Federation no shell (composição intencional dos remotes), 1 evento de DOM (\`app:add-to-cart\`) e props. Não há import de código de um MFE dentro de outro.`, '');

// --- notas ---
lines.push('## Notas metodológicas', '');
lines.push('- Builds executados na mesma máquina; Vite não cacheia builds de produção entre execuções.');
lines.push('- Build incremental medido com uma alteração trivial (string renderizada) em arquivo equivalente das duas aplicações; "bytes a republicar" = soma dos arquivos do dist cujo hash mudou.');
lines.push('- Tamanhos medidos sobre o diretório `dist/` completo (JS, CSS, HTML, assets).');
lines.push('- Nos MFEs, React/ReactDOM/React Router são compartilhados via Module Federation (`shared`), evitando duplicação em runtime.');
lines.push('- Lighthouse: modo headless contra servidores de preview (builds de produção), categoria Performance, 1 execução por aplicação. **Para o TCC, rode múltiplas vezes e reporte média/mediana.**');
lines.push('- Bytes por rota medidos via CDP (`Network.loadingFinished.encodedDataLength`), apenas requisições da mesma origem, cache desabilitado.');
lines.push('- Este estudo usa 2 remotes; os efeitos de escala (dezenas de módulos/times) são discutidos qualitativamente nas notas de cada seção.');
lines.push('');

const results = {
  date,
  buildTimesSeconds: Object.fromEntries(Object.entries(buildTimes).map(([k, v]) => [k, Number(sec(v))])),
  parallelBuildSeconds: Number(sec(parallelBuildMs)),
  incremental: {
    monolith: { rebuildSeconds: Number(sec(incMono.ms)), redeployKB: Number(kb(incMono.redeploy.bytes)) },
    mfe: { rebuildSeconds: Number(sec(incMfe.ms)), redeployKB: Number(kb(incMfe.redeploy.bytes)) },
  },
  bundleSizesKB: Object.fromEntries(Object.entries(bundleSizes).map(([k, v]) => [k, Number(kb(v.total))])),
  devServerColdStartMs: devStart,
  lighthouse: lighthouseResults,
  routeBytesKB: routeBytes && Object.fromEntries(
    Object.entries(routeBytes).map(([k, v]) => [
      k,
      Object.fromEntries(Object.entries(v).map(([r, b]) => [r, Number(kb(b))])),
    ])
  ),
  resilience,
  coupling: { monolithCrossImports: couplingMono.cross, mfeCrossImports: couplingMfe.crossMfeImports, shellFederationImports: couplingMfe.federationImports },
};

fs.writeFileSync(path.join(ROOT, 'metrics', 'report.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(ROOT, 'metrics', 'results.json'),
  JSON.stringify(results, null, 2)
);

console.log('\n✅ Relatório gerado em metrics/report.md e metrics/results.json\n');
