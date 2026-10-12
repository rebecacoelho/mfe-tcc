# Métricas em ambiente real (produção)

_Gerado em 2026-10-12T20:58:12.728Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 76 | 57 |
| first-contentful-paint | 1108 ms | 1148 ms |
| largest-contentful-paint | 4169 ms | 4458 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1108 ms | 1148 ms |
| interactive | 4206 ms | 4511 ms |
| total-byte-weight | 629.3 KB | 661.8 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
