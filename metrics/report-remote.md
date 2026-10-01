# Métricas em ambiente real (produção)

_Gerado em 2026-10-01T22:34:09.413Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 63 | 54 |
| first-contentful-paint | 1078 ms | 1484 ms |
| largest-contentful-paint | 2133 ms | 2951 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0.81 | 0.81 |
| speed-index | 1078 ms | 1484 ms |
| interactive | 2133 ms | 2951 ms |
| total-byte-weight | 628.5 KB | 660.7 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
