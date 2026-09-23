# Métricas em ambiente real (produção)

_Gerado em 2026-09-23T19:52:18.121Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 62 | 54 |
| first-contentful-paint | 1112 ms | 1477 ms |
| largest-contentful-paint | 2278 ms | 2938 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0.81 | 0.81 |
| speed-index | 1112 ms | 1477 ms |
| interactive | 2296 ms | 2938 ms |
| total-byte-weight | 628.7 KB | 661.3 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
