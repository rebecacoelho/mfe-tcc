# Métricas em ambiente real (produção)

_Gerado em 2026-08-19T19:03:29.932Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 74 | 80 |
| first-contentful-paint | 1196 ms | 1396 ms |
| largest-contentful-paint | 3041 ms | 1624 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0 |
| speed-index | 2400 ms | 6208 ms |
| interactive | 3041 ms | 1624 ms |
| total-byte-weight | 447.5 KB | 112.2 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
