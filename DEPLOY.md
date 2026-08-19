# Deploy em ambiente real (gratuito)

Arquitetura de deploy — 6 serviços gratuitos:

```
┌─────────────────────────────┐
│ shell (Vercel, estático)    │  https://minishop-shell.vercel.app
└───────┬─────────────┬───────┘
        │ remoteEntry │ remoteEntry
┌───────▼──────┐  ┌───▼──────────┐      ┌──────────────────────────┐
│ products-mfe │  │ cart-mfe     │      │ monólito (Vercel)        │
│ (Vercel)     │  │ (Vercel)     │      │ https://...-monolith...  │
└───────┬──────┘  └───┬──────────┘      └────────────┬─────────────┘
        └─────────────┴──────────────┬───────────────┘
                                     ▼
                    ┌────────────────────────────────┐
                    │ backend (Render, Node)         │
                    │ https://minishop-api.onrender.com
                    └────────────────────────────────┘
```

| Serviço | Plataforma | Por quê |
|---|---|---|
| backend | **Render** (free web service) | roda Node persistente de graça |
| shell, products-mfe, cart-mfe, monólito | **Vercel** (hobby) | estático grátis com CDN global, ideal p/ Module Federation |

> Alternativas equivalentes: Netlify (estáticos) e Railway/Fly.io (backend).
> O que o código exige é apenas: URLs públicas HTTPS e as env vars abaixo.

## Variáveis de ambiente

| Var | Onde | Exemplo |
|---|---|---|
| `VITE_API_URL` | monólito, products-mfe, cart-mfe | `https://minishop-api.onrender.com/api` |
| `VITE_PRODUCTS_MFE_URL` | shell | `https://minishop-products.vercel.app` |
| `VITE_CART_MFE_URL` | shell | `https://minishop-cart.vercel.app` |

Sem essas vars, o build usa os defaults de localhost (comportamento local inalterado).

## Passo 0 — Subir o código para o GitHub

A pasta `mfe-tcc` ainda não é um repositório próprio. No terminal:

```bash
cd ~/Desktop/mfe-tcc
git init
git add .
git commit -m "E-commerce comparativo: monólito x microfrontends"
# crie um repo vazio em https://github.com/new (ex.: mfe-tcc) e então:
git remote add origin git@github.com:<seu-usuario>/mfe-tcc.git
git push -u origin main
```

## Passo 1 — Backend no Render

1. Em https://dashboard.render.com → **New → Blueprint** → conecte o repo `mfe-tcc`.
   O `render.yaml` na raiz já define o serviço (`rootDir: backend`, health check em `/api/health`, plano free).
2. Deploy e anote a URL: `https://minishop-api.onrender.com`.
3. Teste: `curl https://minishop-api.onrender.com/api/health`.

> ⚠️ **Cold start do plano free**: o serviço "dorme" após 15 min sem tráfego e a
> primeira requisição demora ~30–60 s. Antes de demo ou coleta de métricas,
> aqueça com `curl .../api/health`. Vale citar no TCC como limitação do ambiente.

## Passo 2 — Remotes na Vercel (products-mfe e cart-mfe)

O shell precisa das URLs dos remotes **no momento do build**, então eles sobem primeiro.

Para cada um (`microfrontends/products-mfe`, `microfrontends/cart-mfe`):

1. https://vercel.com/new → importe o repo `mfe-tcc`.
2. Em **Root Directory**, selecione a pasta do app (ex.: `microfrontends/products-mfe`).
   A Vercel detecta Vite automaticamente (build `npm run build`, output `dist`).
   O `vercel.json` da pasta cuida do rewrite de SPA.
3. **Environment Variables**: `VITE_API_URL` = `https://minishop-api.onrender.com/api`.
4. Deploy e anote as URLs (ex.: `https://minishop-products.vercel.app`).

## Passo 3 — Shell na Vercel

1. Novo projeto, mesmo repo, **Root Directory** = `microfrontends/shell`.
2. **Environment Variables**:
   - `VITE_PRODUCTS_MFE_URL` = URL do passo 2 (sem barra final)
   - `VITE_CART_MFE_URL` = URL do passo 2 (sem barra final)
3. Deploy → `https://minishop-shell.vercel.app`.

> Mudou a URL de um remote? Atualize a env var do shell e faça **Redeploy**
> (o endereço do remoteEntry é embutido no build do shell).

## Passo 4 — Monólito na Vercel

1. Novo projeto, **Root Directory** = `monolith`.
2. Env: `VITE_API_URL` = `https://minishop-api.onrender.com/api`.
3. Deploy.

## Passo 5 — Validar em produção

Com backend e os 4 frontends no ar:

```bash
MONOLITH_URL=https://minishop-monolith.vercel.app \
SHELL_URL=https://minishop-shell.vercel.app \
node metrics/smoke-test.js
```

As mesmas 9 verificações do ambiente local rodam contra produção.

## Passo 6 — Métricas em ambiente real

```bash
# aqueça a API primeiro (cold start do Render)
curl https://minishop-api.onrender.com/api/health

MONOLITH_URL=https://minishop-monolith.vercel.app \
SHELL_URL=https://minishop-shell.vercel.app \
RUNS=5 \
node metrics/measure-remote.js
```

Gera `metrics/report-remote.md` com FCP/LCP/TBT/CLS/Speed Index/TTI/bytes
(mediana de N execuções) — pronto para o capítulo de resultados do TCC.
Compare com o `metrics/report.md` local e discuta o efeito da latência real
e do CDN da Vercel (os dois ambientes contam partes diferentes da história).

## Demonstração de deploy independente (ótimo para a banca)

1. Altere algo visual no `products-mfe` (ex.: título "Produtos" → "Catálogo").
2. Commit + push → **somente** o projeto `products-mfe` rebuilda na Vercel (~30 s).
3. Recarregue o shell: mudança no ar, sem redeploy do shell nem do cart-mfe.
4. No monólito, a mesma alteração exigiria rebuild e redeploy da aplicação inteira.

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| "Microfrontend indisponível" no shell | URL do remote errada/ausente nas env vars do shell → corrija e redeploy |
| Produtos não carregam | `VITE_API_URL` errada, ou backend dormindo (cold start) → `curl /api/health` |
| Mudança no remote não aparece | deploy do remote falhou, ou o shell precisa de redeploy (só se mudou a URL do remote) |
| Rota `/cart` dá 404 direto na URL | rewrite de SPA ausente — confira o `vercel.json` na pasta do app |
