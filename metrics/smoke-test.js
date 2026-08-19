/**
 * Smoke test: abre as duas aplicações em um Chromium headless e verifica
 * se as funcionalidades principais renderizam.
 *
 * Pré-requisito: backend (4000), monólito preview (4173) e
 * previews dos MFEs (5000, 5001, 5002) rodando — ou as URLs de produção
 * informadas via variáveis de ambiente.
 *
 * Uso local:      node metrics/smoke-test.js
 * Uso em produção: MONOLITH_URL=https://... SHELL_URL=https://... node metrics/smoke-test.js
 */
import puppeteer from 'puppeteer';

const MONOLITH_URL = (process.env.MONOLITH_URL || 'http://localhost:4173').replace(/\/$/, '');
const SHELL_URL = (process.env.SHELL_URL || 'http://localhost:5000').replace(/\/$/, '');

console.log(`Alvos:\n  Monólito: ${MONOLITH_URL}\n  Shell MFE: ${SHELL_URL}\n`);

const checks = [];
function check(name, ok, extra = '') {
  checks.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
}

// --no-sandbox: necessário em runners de CI (GitHub Actions)
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('   [pageerror]', e.message));

// ---------- Monólito ----------
await page.goto(`${MONOLITH_URL}/`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.card', { timeout: 10000 }).catch(() => {});
const monoCards = await page.$$eval('.card', (els) => els.length);
check('Monólito: lista de produtos renderiza', monoCards === 12, `${monoCards} cards`);

await page.click('.card .btn-primary');
await new Promise((r) => setTimeout(r, 300));
const monoBadge = await page.$eval('.cart-badge', (el) => el.textContent).catch(() => null);
check('Monólito: adicionar ao carrinho atualiza badge', monoBadge === '1');

await page.goto(`${MONOLITH_URL}/cart`, { waitUntil: 'networkidle0' });
const monoCartRows = await page.$$eval('.cart-table tbody tr', (els) => els.length).catch(() => 0);
check('Monólito: carrinho exibe item adicionado', monoCartRows === 1);

// ---------- Microfrontends (shell) ----------
await page.goto(`${SHELL_URL}/`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.card', { timeout: 10000 }).catch(() => {});
const mfeCards = await page.$$eval('.card', (els) => els.length);
check('Shell: products-mfe remoto renderiza', mfeCards === 12, `${mfeCards} cards`);

const remoteFailed = await page.$eval('body', (el) => el.textContent.includes('Microfrontend indisponível'));
check('Shell: nenhum remote falhou', !remoteFailed);

await page.click('.card .btn-primary');
await new Promise((r) => setTimeout(r, 300));
const mfeBadge = await page.$eval('.cart-badge', (el) => el.textContent).catch(() => null);
check('Shell: evento cross-MFE atualiza badge do carrinho', mfeBadge === '1');

await page.goto(`${SHELL_URL}/cart`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.cart-table tbody tr', { timeout: 10000 }).catch(() => {});
const mfeCartRows = await page.$$eval('.cart-table tbody tr', (els) => els.length).catch(() => 0);
check('Shell: cart-mfe remoto exibe item', mfeCartRows === 1);

// checkout end-to-end no shell
await page.click('.cart-footer .btn-primary').catch(() => {});
await page.waitForSelector('.state-msg.success', { timeout: 10000 }).catch(() => {});
const orderOk = await page.$eval('body', (el) => el.textContent.includes('Pedido confirmado'));
check('Shell: checkout end-to-end funciona', orderOk);

// detalhe do produto via remote
await page.goto(`${SHELL_URL}/product/3`, { waitUntil: 'networkidle0' });
const detailOk = await page.$eval('body', (el) => el.textContent.includes('SoundMax')).catch(() => false);
check('Shell: ProductDetail remoto renderiza', detailOk);

// ---------- Isolamento de falha ----------
// Derruba o products-mfe? (teste manual sugerido no README)

await browser.close();

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} verificações passaram`);
process.exit(failed.length ? 1 : 0);
