# Relatório comparativo — Monólito x Microfrontends

_Gerado em 2026-10-05T17:28:48.350Z_

## 1. Tempo de build (sequencial)

| Projeto | Tempo (s) |
|---|---:|
| Monólito | 1.24 |
| shell | 1.07 |
| products-mfe | 0.86 |
| cart-mfe | 0.86 |
| MFEs (soma sequencial) | 2.79 |

## 2. Build paralelo (pipelines de CI independentes)

| Cenário | Tempo (s) |
|---|---:|
| Monólito (sempre sequencial) | 1.24 |
| MFEs em paralelo (wall time) | 1.38 |
| MFEs em sequencial (soma) | 2.79 |

> Na arquitetura de MFEs cada aplicação tem pipeline própria: os builds rodam em paralelo e o tempo total é o do mais lento, não a soma.

## 3. Build incremental — alteração em 1 módulo

Simulação: alterar a listagem de produtos (HomePage no monólito, ProductList no products-mfe).

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| Tempo de rebuild (s) | 0.76 | 0.90 |
| Bytes a republicar | 169.7 KB | 7.2 KB |
| Bytes rebaixados por usuário recorrente | 169.7 KB | 7.2 KB |

### Arquivos alterados (monólito)

| Arquivo | KB |
|---|---:|
| assets/index-D9q1NLPz.js | 169.3 |
| index.html | 0.4 |

### Arquivos alterados (products-mfe)

| Arquivo | KB |
|---|---:|
| assets/__federation_expose_ProductList-B8YtPX_F.js | 2.9 |
| assets/remoteEntry.js | 1.7 |
| assets/index-DagjSaSj.js | 1.6 |
| index.html | 0.9 |

> No monólito, qualquer alteração invalida o bundle inteiro (hash do arquivo muda): todos os usuários rebaixam a aplicação completa. Nos MFEs, só os chunks do módulo alterado são invalidados; shell e demais remotes continuam servidos do cache do navegador.

## 4. Tamanho dos bundles (dist)

| Projeto | Total (KB) |
|---|---:|
| Monólito | 174.6 |
| shell | 238.1 |
| products-mfe | 241.1 |
| cart-mfe | 238.5 |
| MFEs (soma) | 717.8 |

### Maiores arquivos do monólito

| Arquivo | KB |
|---|---:|
| assets/index-D0Kb3uHy.js | 169.3 |
| assets/index-DjNs_GTv.css | 4.9 |
| index.html | 0.4 |

### shell

| Arquivo | KB |
|---|---:|
| assets/index-CbWKq_zB.js | 130.8 |
| assets/__federation_shared_react-router-dom-gBhjiqS8.js | 83.4 |
| assets/index-CtmpQeow.js | 6.7 |
| assets/index-CtldKgz-.js | 6.6 |
| assets/_virtual___federation_fn_import-CdQueNll.js | 4.9 |

### products-mfe

| Arquivo | KB |
|---|---:|
| assets/index-CbWKq_zB.js | 130.8 |
| assets/__federation_shared_react-router-dom-CbdMgeC0.js | 83.4 |
| assets/index-CtmpQeow.js | 6.7 |
| assets/__federation_fn_import-CEuWP9-g.js | 5.0 |
| assets/index-DjNs_GTv.css | 4.9 |

### cart-mfe

| Arquivo | KB |
|---|---:|
| assets/index-CbWKq_zB.js | 130.8 |
| assets/__federation_shared_react-router-dom-CbdMgeC0.js | 83.4 |
| assets/index-CtmpQeow.js | 6.7 |
| assets/__federation_fn_import-CEuWP9-g.js | 5.0 |
| assets/index-DjNs_GTv.css | 4.9 |

## 5. Cold start do dev server (DX)

| Aplicação | Tempo até "ready" (ms) |
|---|---:|
| Monólito | 126 |
| shell | 125 |
| products-mfe | 123 |
| cart-mfe | 123 |

> Times trabalhando em MFEs sobem apenas a aplicação do seu escopo. Com o crescimento do monólito, essa diferença tende a aumentar (mais módulos para transformar).

## 6. Performance em runtime (Lighthouse, desktop)

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 85 | 75 |
| first-contentful-paint | 1208.31 ms | 1888.08 ms |
| largest-contentful-paint | 2256.96 ms | 2796.94 ms |
| total-blocking-time | 13 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.03 |
| speed-index | 1208.31 ms | 1888.08 ms |
| interactive | 2256.96 ms | 2819.46 ms |
| total-byte-weight | 629.8 KB | 663.2 KB |

## 7. Bytes transferidos por rota (mesma origem, cache desabilitado)

| Rota | Monólito | Microfrontends |
|---|---:|---:|
| Home (primeira carga) | 58.0 KB | 91.9 KB |
| + navegação para /cart | 0.0 KB | 8.5 KB |
| + navegação para /product/:id | 0.0 KB | 1.2 KB |

> O monólito carrega o código de todas as features na primeira carga. Nos MFEs, o código de cada módulo só é baixado quando a rota correspondente é acessada. Com apenas 2–3 módulos a diferença é pequena; em aplicações com dezenas de módulos, a primeira carga do monólito cresce linearmente enquanto a do shell permanece ~constante.

## 8. Resiliência — isolamento de falhas

Cenário: **cart-mfe fora do ar** (todas as requisições ao remote bloqueadas).

| Verificação | Resultado |
|---|---|
| Home (products-mfe) continua renderizando | ✅ |
| Adicionar ao carrinho / badge continua funcionando | ✅ |
| Header e navegação íntegros | ✅ |
| Rota /cart degrada graciosamente (error boundary) | ✅ |
| Página continua viva após a falha | ✅ |

> No monólito não existe isolamento equivalente: uma falha de build ou um erro fatal de runtime em qualquer módulo derruba a aplicação inteira. Nos MFEs, a falha fica contida no boundary do módulo.

## 9. Acoplamento entre módulos

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| Imports estáticos cruzando fronteiras de módulos | 7 | 0 |

Detalhe dos imports cruzados no monólito:

- components/Header.jsx → cart/
- components/ProductCard.jsx → cart/
- pages/CartPage.jsx → cart/
- pages/CartPage.jsx → components/
- pages/HomePage.jsx → components/
- pages/ProductPage.jsx → cart/
- pages/ProductPage.jsx → components/

> Nos MFEs a comunicação entre módulos ocorre apenas por contratos explícitos: 3 imports dinâmicos via Module Federation no shell (composição intencional dos remotes), 1 evento de DOM (`app:add-to-cart`) e props. Não há import de código de um MFE dentro de outro.

## Notas metodológicas

- Builds executados na mesma máquina; Vite não cacheia builds de produção entre execuções.
- Build incremental medido com uma alteração trivial (string renderizada) em arquivo equivalente das duas aplicações; "bytes a republicar" = soma dos arquivos do dist cujo hash mudou.
- Tamanhos medidos sobre o diretório `dist/` completo (JS, CSS, HTML, assets).
- Nos MFEs, React/ReactDOM/React Router são compartilhados via Module Federation (`shared`), evitando duplicação em runtime.
- Lighthouse: modo headless contra servidores de preview (builds de produção), categoria Performance, 1 execução por aplicação. **Para o TCC, rode múltiplas vezes e reporte média/mediana.**
- Bytes por rota medidos via CDP (`Network.loadingFinished.encodedDataLength`), apenas requisições da mesma origem, cache desabilitado.
- Este estudo usa 2 remotes; os efeitos de escala (dezenas de módulos/times) são discutidos qualitativamente nas notas de cada seção.
