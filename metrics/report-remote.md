# Métricas em ambiente real (produção)

_Gerado em 2026-10-01T22:28:54.834Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 53 | 51 |
| first-contentful-paint | 1069 ms | 1464 ms |
| largest-contentful-paint | 4160 ms | 4453 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0.81 | 0.81 |
| speed-index | 1069 ms | 1464 ms |
| interactive | 4198 ms | 4491 ms |
| total-byte-weight | 628.8 KB | 661.3 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
