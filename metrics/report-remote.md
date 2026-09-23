# Métricas em ambiente real (produção)

_Gerado em 2026-09-23T19:57:42.420Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 52 | 48 |
| first-contentful-paint | 1063 ms | 1463 ms |
| largest-contentful-paint | 4161 ms | 4452 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0.81 | 0.81 |
| speed-index | 1063 ms | 1463 ms |
| interactive | 4198 ms | 4490 ms |
| total-byte-weight | 628.7 KB | 661.2 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
