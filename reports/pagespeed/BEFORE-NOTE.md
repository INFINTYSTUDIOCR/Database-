# Baseline BEFORE code changes (Phase 1)

- **Date:** 2026-10-04
- **URL:** https://studioinfinitycr.com/
- **Google PageSpeed Insights Online API v5:** HTTP **429 Too Many Requests** (no API key / quota). Official PSI JSON unavailable.
- **Fallback used:** Lighthouse **LOCAL lab** via Playwright Chromium against the public URL.
- **Label:** These are **not** Google PageSpeed Insights UI results and **not** CrUX field data. INP/field CWV were unavailable.

## Lab scores (BEFORE)

| Form factor | Perf | A11y | Best Practices | SEO | FCP | LCP | SI | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| Mobile | 96 | 91 | 100 | 100 | ~2.0s | ~2.5s | ~2.4s | ~10–14ms | ~0.011 |
| Desktop | 93 | 95 | 100 | 100 | ~1.0s | ~1.4s | — | 0ms | ~0.0008 |

## Evidence used for fixes

- `image-delivery-insight` (~368 KiB): persona PNGs 1024² → tiny display; logo PNG oversized
- `render-blocking-insight` (~640 ms): Google Fonts CSS + many stylesheets
- `cache-insight` / `total-byte-weight`: hero `infinity-welcome-final.webm` ~17.5 MB
- A11y: `color-contrast` (cadamag credit), `heading-order` (dash `h3`), `target-size` (credit links)

Artifacts: `lighthouse-mobile-before.report.json`, `lighthouse-desktop-before.report.json`
