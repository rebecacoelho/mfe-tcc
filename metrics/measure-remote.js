/**
 * Métricas em ambiente real: roda Lighthouse contra as URLs de produção
 * (monólito e shell MFE) e gera metrics/report-remote.md.
 *
 * Uso:
 *   MONOLITH_URL=https://minishop-monolith.vercel.app \
 *   SHELL_URL=https://minishop-shell.vercel.app \
 *   RUNS=3 \
 *   node metrics/measure-remote.js
 *
 * Dica para o TCC: use RUNS=3 (ou mais) e reporte mediana — redes variam.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  { name: 'Monólito', url: process.env.MONOLITH_URL },
  { name: 'Microfrontends', url: process.env.SHELL_URL },
];
const RUNS = Number(process.env.RUNS || 3);

for (const t of TARGETS) {
  if (!t.url) {
    console.error('Defina MONOLITH_URL e SHELL_URL. Ex.:');
    console.error('  MONOLITH_URL=https://... SHELL_URL=https://... node metrics/measure-remote.js');
    process.exit(1);
  }
  t.url = t.url.replace(/\/$/, '');
}

const { default: lighthouse } = await import('lighthouse');
const chromeLauncher = await import('chrome-launcher');

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

async function runOnce(url) {
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

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const final = {};
for (const t of TARGETS) {
  console.log(`\n${t.name}: ${t.url} (${RUNS} execuções)`);
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await runOnce(t.url);
    runs.push(r);
    console.log(`  run ${i + 1}: score=${r.performanceScore} FCP=${r['first-contentful-paint']}ms LCP=${r['largest-contentful-paint']}ms`);
  }
  final[t.name] = {};
  for (const key of Object.keys(runs[0])) {
    final[t.name][key] = median(runs.map((r) => r[key]).filter((v) => v != null));
  }
}

await chrome.kill();

const kb = (bytes) => (bytes / 1024).toFixed(1);
const lines = [];
lines.push('# Métricas em ambiente real (produção)', '');
lines.push(`_Gerado em ${new Date().toISOString()} — mediana de ${RUNS} execuções_`, '');
lines.push(`- Monólito: ${TARGETS[0].url}`);
lines.push(`- Microfrontends: ${TARGETS[1].url}`, '');
lines.push('| Métrica | Monólito | Microfrontends |', '|---|---:|---:|');
for (const k of Object.keys(final['Monólito'])) {
  const fmt = (v) =>
    v == null ? '—' : k === 'total-byte-weight'
      ? `${kb(v)} KB`
      : k === 'performanceScore' || k === 'cumulative-layout-shift'
        ? String(Math.round(v * 100) / 100)
        : `${Math.round(v)} ms`;
  lines.push(`| ${k} | ${fmt(final['Monólito'][k])} | ${fmt(final['Microfrontends'][k])} |`);
}
lines.push('');
lines.push('## Notas', '');
lines.push('- Mediana de múltiplas execuções (parâmetro RUNS).');
lines.push('- Latência de rede real incluída — compare também com os resultados locais em report.md.');
lines.push('- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).');
lines.push('');

fs.writeFileSync(path.join(ROOT, 'metrics', 'report-remote.md'), lines.join('\n'));
fs.writeFileSync(
  path.join(ROOT, 'metrics', 'results-remote.json'),
  JSON.stringify({ date: new Date().toISOString(), runs: RUNS, targets: TARGETS, median: final }, null, 2)
);
console.log('\n✅ Relatório em metrics/report-remote.md');
