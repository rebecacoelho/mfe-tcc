# Métricas em ambiente real (produção)

_Gerado em 2026-08-24T12:48:47.344Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 80 | 76 |
| first-contentful-paint | 1066 ms | 1156 ms |
| largest-contentful-paint | 3158 ms | 3653 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0 |
| speed-index | 1066 ms | 1468 ms |
| interactive | 3158 ms | 3653 ms |
| total-byte-weight | 447.3 KB | 480.3 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
