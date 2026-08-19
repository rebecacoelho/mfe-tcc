# MiniShop — Monólito x Microfrontends (TCC)

E-commerce mínimo implementado **duas vezes** — como monólito e como microfrontends —
sobre o **mesmo backend**, para comparação de métricas no TCC.

## Estrutura

```
mfe-tcc/
├── backend/                    API REST (Node + Express) — porta 4000
├── monolith/                   Aplicação única React + Vite — preview 4173, dev 5173
├── microfrontends/
│   ├── shell/                  Host: header, rotas, estado do carrinho — preview 5000, dev 5100
│   ├── products-mfe/           Remote: lista e detalhe de produtos — preview 5001, dev 5101
│   └── cart-mfe/               Remote: carrinho e checkout — preview 5002, dev 5102
└── metrics/                    Script de métricas + smoke test + relatório
```

## Arquitetura dos microfrontends

```
                 ┌─────────────────────────────────────────┐
                 │              shell (host :5000)          │
                 │  Header · Rotas · CartContext (dono do   │
                 │  estado do carrinho) · RemoteBoundary    │
                 └───────┬───────────────────┬─────────────┘
        Module Federation│                   │Module Federation
        (remoteEntry.js) │                   │(remoteEntry.js)
                 ┌───────▼───────┐   ┌───────▼───────┐
                 │ products-mfe  │   │   cart-mfe    │
                 │   (:5001)     │   │   (:5002)     │
                 │ ProductList   │   │  CartPage     │
                 │ ProductDetail │   │               │
                 └───────┬───────┘   └───────┬───────┘
                         │                   │
        'app:add-to-cart'│ (CustomEvent)     │ props (items, onUpdateQty…)
                         ▼                   ▼
                 ┌─────────────────────────────────────────┐
                 │         backend API REST (:4000)         │
                 │  /api/products · /api/products/:id ·     │
                 │  /api/categories · /api/checkout         │
                 └─────────────────────────────────────────┘
```

Decisões de arquitetura (boas para citar no TCC):

- **Module Federation** via `@originjs/vite-plugin-federation`: o shell consome os
  remotes em runtime pelos `remoteEntry.js`; cada MFE tem build e deploy independentes.
- **Dependências compartilhadas** (`shared`): react, react-dom e react-router-dom são
  singletons — o `useParams`/`Link` dos remotes funcionam no router do shell.
- **Estado do carrinho pertence ao shell**. O `products-mfe` se comunica por
  **event bus** (`window.dispatchEvent(new CustomEvent('app:add-to-cart'))`), sem
  conhecer o carrinho. O `cart-mfe` recebe o estado **por props** — desacoplado e reutilizável.
- **Isolamento de falhas**: `RemoteBoundary` (Error Boundary + Suspense) garante que,
  se um remote estiver fora do ar, só a área dele mostra erro — o resto da página funciona.
- Cada MFE também **roda standalone** (`npm run dev -w products-mfe`), demonstrando
  desenvolvimento independente.

## Como rodar

```bash
npm install          # instala tudo (npm workspaces)

# 1) Backend
npm run start:backend

# 2a) Monólito (dev)
npm run dev:monolith          # http://localhost:5173

# 2b) Microfrontends (build + preview dos 3)
npm run build -w products-mfe && npm run build -w cart-mfe && npm run build -w shell
npm run preview:mfe           # http://localhost:5000
```

> No modo MFE, os remotes precisam estar **buildados e servidos** (preview) para o
> shell carregá-los — é assim que deploy independente funciona. Para desenvolver um
> MFE isoladamente, use `npm run dev -w products-mfe` (porta 5101) etc.

## Métricas

```bash
npm run metrics     # gera metrics/report.md e metrics/results.json
node metrics/smoke-test.js   # teste E2E headless (precisa dos previews no ar)
```

O script mede automaticamente 9 grupos de métricas:

| # | Métrica | Como é coletada |
|---|---|---|
| 1 | Tempo de build sequencial | cronometrado por projeto (monólito vs. cada MFE e soma) |
| 2 | Build paralelo (CI) | 3 MFEs buildados simultaneamente, wall time |
| 3 | Build incremental | altera 1 módulo → tempo de rebuild + **bytes a republicar** (diff de hash do dist) |
| 4 | Tamanho de bundle | varredura do `dist/` (por arquivo e total) |
| 5 | Cold start do dev server | tempo até o "ready" do Vite em cada app |
| 6 | FCP, LCP, TBT, CLS, Speed Index, TTI | Lighthouse (headless) contra os previews de produção |
| 7 | Bytes por rota | CDP/puppeteer: home, +/cart, +/product/:id (lazy loading) |
| 8 | Resiliência | cart-mfe bloqueado → quanto da página continua funcional |
| 9 | Acoplamento | imports estáticos cruzando fronteiras de módulos |

### Resultados obtidos nesta máquina (1 execução — para o TCC, rode N vezes e use média/mediana)

**Onde o monólito ganha (custo dos MFEs):**

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| Build sequencial | 1.5–1.8 s | ~4 s (soma) |
| Bundle total (dist) | 170.5 KB | 710.2 KB (soma) |
| FCP | ~1.3 s | ~1.9 s |
| LCP | ~3.5 s | ~3.8 s |
| Bytes na home | 57 KB | 91 KB |

**Onde os microfrontends ganham (o payoff da arquitetura):**

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| **Bytes a republicar ao mudar 1 módulo** | **167.3 KB** | **5.5 KB** |
| **Bytes rebaixados por usuário recorrente** | **167.3 KB** | **5.5 KB** |
| Build em pipelines paralelas | 1.5–1.8 s (sempre tudo) | ~2–3 s (wall time) |
| Bytes ao navegar p/ /cart | 0 (já baixou tudo) | 8.5 KB (sob demanda) |
| Imports cruzados entre módulos | 7 | 0 |
| Falha de 1 módulo | derruba o app inteiro | contida no error boundary |

Leituras possíveis para o TCC:

- **Custo**: primeira carga maior nos MFEs (shell + remoteEntry + chunks de
  federação) e build total somado maior (cada app tem seu próprio pipeline).
- **Cache/atualização**: no monólito qualquer mudança invalida o bundle inteiro —
  todos os usuários rebaixam 167 KB. Nos MFEs, só os chunks do módulo alterado
  (~5.5 KB) são rebaixados; o resto vem do cache. É o argumento mais forte dos dados.
- **Carregamento sob demanda**: o código do carrinho só é baixado quando o usuário
  acessa /cart. Com 2–3 módulos o ganho é pequeno, mas a primeira carga do monólito
  cresce linearmente com o nº de módulos, enquanto a do shell permanece ~constante.
- **Resiliência**: derrube o `products-mfe` (`Ctrl+C` no preview dele) e recarregue
  o shell — apenas a área de produtos mostra erro; header e carrinho continuam.
- **Acoplamento/escala de times**: módulos dos MFEs só se comunicam por contratos
  explícitos (federação, evento de DOM, props) — cada um pode ter time, repo e
  pipeline próprios.

## Deploy em ambiente real

Guia completo em **[DEPLOY.md](./DEPLOY.md)**: backend no Render (grátis) e os 4
frontends na Vercel (grátis), com URLs parametrizadas por variáveis de ambiente
(`VITE_API_URL`, `VITE_PRODUCTS_MFE_URL`, `VITE_CART_MFE_URL`). Inclui validação
E2E e coleta de métricas Lighthouse contra produção (`metrics/measure-remote.js`).

## API do backend

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | health check |
| GET | `/api/products?category=&search=` | lista produtos (filtros opcionais) |
| GET | `/api/products/:id` | detalhe do produto |
| GET | `/api/categories` | categorias |
| POST | `/api/checkout` | cria pedido `{ items: [{id, qty}] }` → `{ orderId, total }` |
