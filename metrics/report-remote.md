# Métricas em ambiente real (produção)

_Gerado em 2026-11-02T21:27:16.266Z — mediana de 3 execuções_

- Monólito: https://monolith-two-delta.vercel.app
- Microfrontends: https://shell-gamma-six.vercel.app

| Métrica | Monólito | Microfrontends |
|---|---:|---:|
| performanceScore | 90 | 64 |
| first-contentful-paint | 1080 ms | 1154 ms |
| largest-contentful-paint | 1833 ms | 2609 ms |
| total-blocking-time | 0 ms | 0 ms |
| cumulative-layout-shift | 0 | 0.39 |
| speed-index | 1080 ms | 1154 ms |
| interactive | 1833 ms | 2609 ms |
| total-byte-weight | 634.7 KB | 667.1 KB |

## Notas

- Mediana de múltiplas execuções (parâmetro RUNS).
- Latência de rede real incluída — compare também com os resultados locais em report.md.
- Se o backend estiver em plano gratuito com cold start (Render), a primeira requisição à API pode adicionar segundos ao LCP; descarte a primeira execução ou aqueça a API antes (`curl <api>/api/health`).
