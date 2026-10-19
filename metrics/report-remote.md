# Métricas em ambiente real (produção)

_Gerado em 2026-10-19T18:24:27.177Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 76 | 60 |
| first-contentful-paint | 1107 ms | 1148 ms |
| largest-contentful-paint | 4156 ms | 3032 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1107 ms | 1199 ms |
| interactive | 4193 ms | 3032 ms |
| total-byte-weight | 632.6 KB | 664.9 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
