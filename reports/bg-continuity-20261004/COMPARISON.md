# Background continuity restore — comparison notes

**Reference commit:** `48e0833` (Ship Infinity Studio dark brand shell)  
**Broken in:** `e861476` (pagespeed / a11y / payload pass)  
**Validated:** local vs live `https://studioinfinitycr.com/` at 1440×900 (scene-know viewport)

## Root cause

1. **`prototype-cadamag/css/brand.css`** — `--grad-atmosphere` weakened to a soft wash; `body.background-attachment` changed `fixed` → `scroll`.
2. **Cascade break** — `index.html` critical-path order put `brand.css` *before* `prototype.css`.  
   `prototype.css` still had `body { background: transparent; }` (shorthand), which **cleared** brand atmosphere.  
   Semi-transparent `.scene-*` brand overlays then composited over the default light canvas → large gray/violet wash after the hero.

## Restored values (from `48e0833`)

| Location | Property | Previous (broken) | Restored |
|---|---|---|---|
| `brand.css` `:root` | `--grad-atmosphere` | single soft radial `160% 120% … 0.1` + linear `#0C1018` | 3 deep radials (violet 0.28 / orange 0.1 / violet 0.08) + same linear |
| `brand.css` `body` | `background-attachment` | `scroll` | `fixed` |
| `prototype.css` `body` | `background` | `transparent` (wiped brand) | *(removed — brand owns atmosphere)* |

## Pixel luminance (scene-know, 1440)

| Sample | Local RGB / lum | Production RGB / lum |
|---|---|---|
| center | 20,23,34 / 23.2 | 19,22,34 / 22.2 |
| left atmosphere | 32,29,62 / 32.0 | 32,29,62 / 32.0 |
| right | 21,24,29 / 23.7 | 21,24,29 / 23.7 |
| top | 5,7,18 / 7.4 | 5,7,18 / 7.4 |
| bottom | 13,14,26 / 14.7 | 13,14,26 / 14.7 |

Deep dark + subtle violet — matches production / `48e0833` atmosphere (not a light gray plate).

## Screenshot paths

`reports/bg-continuity-20261004/{390,768,1024,1440,1920}/`

- `01-hero-start.png`
- `02-hero-end.png`
- `03-marquee.png`
- `04-next-section.png`
- `05-mid-scroll.png`

Capture script: `scripts/capture-bg-continuity.cjs`
