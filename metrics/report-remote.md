# Métricas em ambiente real (produção)

_Gerado em 2026-10-26T18:18:26.890Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 87 | 61 |
| first-contentful-paint | 1091 ms | 1183 ms |
| largest-contentful-paint | 2142 ms | 2982 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1091 ms | 1256 ms |
| interactive | 2142 ms | 2982 ms |
| total-byte-weight | 632.8 KB | 665.2 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
