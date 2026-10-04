# PageSpeed / Lighthouse — comparación (lab)

**Importante:** Google PageSpeed Insights Online API v5 devolvió **HTTP 429**. No hay datos oficiales de PSI ni CrUX de campo (INP no disponible).

| Etiqueta | Origen | URL |
|---|---|---|
| **ANTES** | Lighthouse LOCAL lab | `https://studioinfinitycr.com/` (producción) |
| **DESPUÉS** | Lighthouse LOCAL lab | `http://127.0.0.1:5173/` (código local, sin deploy) |

No son mediciones equivalentes de red/CDN. Los tiempos FCP/LCP locales pueden ser peores por host, cache fría y variabilidad. Tras el deploy, re-ejecutar PSI/Lighthouse contra producción.

## Tabla (móvil)

| Métrica | Antes (prod lab) | Después (local lab) | Diferencia | Estado |
|---|---|---|---|---|
| Performance | 96 | 85 | -11 | Pendiente re-medir en prod |
| Accessibility | 91 | 100 | +9 | Objetivo cumplido (lab) |
| Best Practices | 100 | 100 | 0 | OK |
| SEO | 100 | 100 | 0 | OK |
| FCP | 2.0 s | 3.0 s | +1.0 s | No comparable host |
| LCP | 2.5 s | 3.1 s | +0.6 s | No comparable host |
| Speed Index | 2.4 s | 5.3 s | +2.9 s | No comparable host |
| TBT | 14 ms | 0 ms | -14 ms | OK |
| CLS | 0.011 | 0.000 | -0.011 | OK (≤0.1) |
| Transfer total | 18,114 KiB | 5,446 KiB | **-12,668 KiB** | Mejora fuerte |
| INP (campo) | n/d | n/d | — | Sin datos CrUX |

## Tabla (desktop)

| Métrica | Antes (prod lab) | Después (local lab) | Diferencia | Estado |
|---|---|---|---|---|
| Performance | 93 | 93 | 0 | OK lab local |
| Accessibility | 95 | 100 | +5 | Objetivo cumplido |
| Best Practices | 100 | 100 | 0 | OK |
| SEO | 100 | 100 | 0 | OK |
| FCP | 1.0 s | 1.1 s | +0.1 s | Similar |
| LCP | 1.4 s | 1.1 s | -0.3 s | Mejor en local |
| TBT | 0 ms | 0 ms | 0 | OK |
| CLS | 0.0008 | 0.0012 | +0.0004 | OK (≤0.1) |
| Transfer total | 18,368 KiB | 5,452 KiB | **-12,916 KiB** | Mejora fuerte |

## Problemas → fixes

| Problema | Evidencia | Causa raíz | Archivos | Solución |
|---|---|---|---|---|
| Persona PNG 1024² (~268 KiB) en avatar 74px | `image-delivery-insight` | Formato/tamaño inadecuado | `public/personas/*.webp`, `index.html` | WebP 192px |
| Logo PNG ~105 KiB para ~168×36 | idem | Oversized PNG | `assets/brand/webp/*`, `site-nav.js`, `site-footer.js` | WebP 336/600 |
| Hero video ~17.5 MB | `total-byte-weight`, `cache-insight` | `infinity-welcome-final.webm` | `index.html`, poster webp | Usar `infinity-welcome-web.webm` (~5.2 MB) + poster |
| Contraste Cadamag credit | `color-contrast` | `#6b7289` sobre `#03050c` | `prototype.css` | Texto `#8b93a8`, targets ≥24px |
| Heading order dash `h3` | `heading-order` | Mock UI como heading real | `index.html`, `prototype.css` | `<p class="dash-title">` |
| Contraste footer | `color-contrast` (after) | Footer `rgba` semitransparente | `page-shell.css` | Fondo sólido `#080B0F` |
| CSS below-fold bloqueante | `render-blocking-insight` | Muchos CSS en head | `index.html` | `media=print` + onload en eco/routes/results/avatar |
| Fonts pesos extra | render-blocking fonts | Inter 500 + Sora 600 | `index.html` | Pesos 400/600/700 + 700/800 |
| Cache corta GH Pages | `cache-insight` | Hosting | `_headers` | Headers largos si CDN lo honra |
| CI permanente | requisito | — | `.lighthouserc.cjs`, `lighthouse-ci.yml` | LHCI en PR/push |

## Pendientes

- Re-medir con **PSI/Lighthouse contra producción** tras merge/deploy (única comparación de red justa).
- API PSI sigue en 429 sin API key / cuota.
- Minificar JS (aviso menor, 0 ms savings).
- Comprimir más el webm si se quiere bajar de ~5 MB (trade-off calidad).
- GitHub Pages no aplica `_headers`; útil si hay Cloudflare/Netlify delante.

## Limitaciones

- Lab ≠ field. Sin INP/CrUX.
- ANTES=prod CDN; DESPUÉS=localhost `serve`.
- Variabilidad Lighthouse ± varios puntos entre runs.

## Build / tests

- `npm test` (`scripts/_check-keyword-holo.js`): **ok**
- No hay build bundler (sitio estático)
