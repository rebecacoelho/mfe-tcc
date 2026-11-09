# Métricas em ambiente real (produção)

_Gerado em 2026-11-09T21:58:57.058Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 87 | 62 |
| first-contentful-paint | 1086 ms | 1159 ms |
| largest-contentful-paint | 2087 ms | 2917 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1086 ms | 1159 ms |
| interactive | 2096 ms | 2917 ms |
| total-byte-weight | 634.4 KB | 667.1 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
