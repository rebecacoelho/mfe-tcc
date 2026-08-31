# Métricas em ambiente real (produção)

_Gerado em 2026-08-31T18:54:16.394Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 82 | 75 |
| first-contentful-paint | 1077 ms | 1146 ms |
| largest-contentful-paint | 1721 ms | 2492 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0 |
| speed-index | 2059 ms | 4728 ms |
| interactive | 1721 ms | 2492 ms |
| total-byte-weight | 60.0 KB | 92.8 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
