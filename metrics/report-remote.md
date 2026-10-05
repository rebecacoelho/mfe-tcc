# Métricas em ambiente real (produção)

_Gerado em 2026-10-05T20:21:07.381Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 86 | 65 |
| first-contentful-paint | 1061 ms | 1135 ms |
| largest-contentful-paint | 1963 ms | 2545 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1061 ms | 1135 ms |
| interactive | 2268 ms | 2552 ms |
| total-byte-weight | 628.7 KB | 661.1 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
