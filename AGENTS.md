# AGENTS.md

## Projeto

Comparativo Monólito x Microfrontends para TCC. E-commerce "MiniShop" implementado
duas vezes sobre o mesmo backend. Node 20+, npm workspaces.

## Estrutura e portas

| Workspace | Papel | Dev | Preview |
|---|---|---|---|
| `backend/` | API REST (Express, dados em memória em `data.js`) | 4000 | — |
| `monolith/` | React + Vite app único | 5173 | 4173 |
| `microfrontends/shell/` | Host Module Federation (header, rotas, CartContext) | 5100 | 5000 |
| `microfrontends/products-mfe/` | Remote: `./ProductList`, `./ProductDetail` | 5101 | 5001 |
| `microfrontends/cart-mfe/` | Remote: `./CartPage` | 5102 | 5002 |
| `metrics/` | `measure.js` (relatório), `smoke-test.js` (E2E) | — | — |

## Comandos (na raiz)

- `npm install` — instala todos os workspaces
- `npm run start:backend` — API
- `npm run dev:monolith` / `npm run preview:monolith`
- `npm run build:all` — build monólito + 3 apps MFE
- `npm run preview:mfe` — sobe products (5001), cart (5002) e shell (5000) juntos
- `npm run metrics` — gera `metrics/report.md` e `metrics/results.json`
- `node metrics/smoke-test.js` — E2E headless (requer backend + previews no ar)

## Convenções

- JS/JSX com ESM (`"type": "module"` em todos os package.json), sem TypeScript.
- React 18 + react-router-dom 6 + Vite 5 em todos os frontends (versões idênticas
  são obrigatórias para o `shared` da Module Federation funcionar).
- MFEs: `@originjs/vite-plugin-federation` com
  `shared: ['react', 'react-dom', 'react-router-dom']` e `build.target: 'esnext'`.
- Comunicação entre MFEs: event bus via `window` CustomEvent `app:add-to-cart`
  (publicado pelo products-mfe, consumido pelo CartContext do shell). O cart-mfe
  recebe dados por props. Não importar código de um MFE dentro de outro.
- Estado do carrinho só existe no shell (ou no App do monólito), persistido em
  localStorage chave `cart`.
- O CSS (`src/styles.css`) é idêntico nos 4 frontends — ao alterar estilo, sincronizar
  as 4 cópias.
- Preços formatados com `toLocaleString('pt-BR', BRL)`.

## Cuidados

- O shell só carrega remotes em runtime: ao mudar um remote, rebuildar e servir
  (`preview`) antes de recarregar o shell.
- Portas são fixas (`strictPort`). URLs da API e dos remotes vêm de env vars
  (`VITE_API_URL`, `VITE_PRODUCTS_MFE_URL`, `VITE_CART_MFE_URL`) com fallback
  para localhost — em produção, defini-las no provedor e rebuildar (ver DEPLOY.md).
- O backend guarda dados em memória; restart reseta pedidos (produtos são estáticos).
- Deploy: backend no Render (`render.yaml`, auto-deploy via GitHub), frontends na
  Vercel (`.github/workflows/deploy.yml` com secret `VERCEL_TOKEN`). Métricas rodam
  no GitHub Actions (`.github/workflows/metrics.yml`, push/manual/semanal).
  Smoke test e Lighthouse aceitam `MONOLITH_URL`/`SHELL_URL` (`metrics/measure-remote.js`).
