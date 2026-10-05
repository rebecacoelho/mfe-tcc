# Métricas em ambiente real (produção)

_Gerado em 2026-10-05T22:24:08.596Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 90 | 63 |
| first-contentful-paint | 1085 ms | 1157 ms |
| largest-contentful-paint | 1838 ms | 2678 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1085 ms | 1297 ms |
| interactive | 1838 ms | 2678 ms |
| total-byte-weight | 629.2 KB | 661.6 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
