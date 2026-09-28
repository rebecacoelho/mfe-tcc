# Métricas em ambiente real (produção)

_Gerado em 2026-09-28T19:18:58.156Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 64 | 58 |
| first-contentful-paint | 1077 ms | 1154 ms |
| largest-contentful-paint | 2040 ms | 2658 ms |
| total-blocking-time | 0 ms | 3 ms |
| cumulative-layout-shift | 0.81 | 0.81 |
| speed-index | 1077 ms | 1218 ms |
| interactive | 2055 ms | 2658 ms |
| total-byte-weight | 628.8 KB | 661.3 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
