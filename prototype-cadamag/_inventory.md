# Infinity Brand Inventory (pre-migration)

- Generated: 2026-09-29T11:48:22.190Z
- Audited files: **1406**
- Files with legacy signals: **78**

## Hit summary

- asset_path_or_filename: 26
- assets_logos_infinity: 19
- legacy_hex: 24
- Space_Grotesk: 6
- og: 8
- Segoe_UI_branding: 5
- favicon_non_brandpack: 4
- theme-color_legacy: 6
- logo_refs: 10
- apple-touch_non_brandpack: 3
- twitter: 3

| ARCHIVO | TIPO | BRANDING LEGACY DETECTADO | ACCIÓN NECESARIA |
|---|---|---|---|
| `assets/logos/alice.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/conversatorio.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/foundations.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/gospanol.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-engine.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-logo-improved.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-logo.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-studio-cr-logo.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-studio-cr-nav.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-studio-cr-nav@2x.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-studio-cr-transparent.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/infinity-studio-cr.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/jill.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/job-finder.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/kamuk-school.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/nexora.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/off-the-clock.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/ort.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `assets/logos/training-book.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `gospanol.html` | html | assets_logos_infinity | migrate_visual |
| `gospanol/css/tb-engine.css` | css | legacy_hex:#5B21B6,#EDE9FE,#7C3AED,#3B0E8C,#F8F8FF | migrate_visual |
| `gospanol/trainer.html` | html | Space_Grotesk | migrate_visual |
| `gospanol/vale.html` | html | Space_Grotesk | migrate_visual |
| `index.html` | html | og:image | migrate_visual |
| `index.legacy-light.html` | html | assets_logos_infinity; og:image | migrate_visual |
| `Infinity_Nexus_Engine.html` | html | assets_logos_infinity | migrate_visual |
| `Infinity_Student_Portal.html` | html | Segoe_UI_branding | migrate_visual |
| `ingles-operacional-latinoamerica.html` | html | og:image | migrate_visual |
| `kamuk/css/kamuk-holdings-crm.css` | css | legacy_hex:#5B21B6,#EDE9FE | migrate_visual |
| `kamuk/games/dark-thief/index.html` | html | favicon_non_brandpack | migrate_visual |
| `kamuk/games/knights-quest/index.html` | html | favicon_non_brandpack | migrate_visual |
| `kamuk/games/modal-battle/index.html` | html | legacy_hex:#7c3aed; theme-color_legacy | migrate_visual |
| `kamuk/games/topic-duel/index.html` | html | legacy_hex:#7c3aed; theme-color_legacy | migrate_visual |
| `kamuk/index.html` | html | legacy_hex:#5b21b6,#7c3aed,#ede9fe,#F8F8FF; logo_refs:assets/logos/infinity-; assets_logos_infinity; apple-touch_non_brandpack; favicon_non_brandpack; theme-color_legacy; Segoe_UI_branding | migrate_visual |
| `kamuk/js/infinity-casino-floor.js` | js | legacy_hex:#5B21B6,#3B0E8C,#7C3AED | migrate_visual |
| `kamuk/js/jill-quiz.js` | js | legacy_hex:#5B21B6,#7C3AED,#5b21b6,#7c3aed | migrate_visual |
| `kamuk/js/live-kpi-charts.js` | js | legacy_hex:#5B21B6,#7C3AED | migrate_visual |
| `kamuk/js/simulation-access.js` | js | legacy_hex:#ede9fe,#5b21b6,#7c3aed | migrate_visual |
| `kamuk/js/simulation-corporate-learn.js` | js | legacy_hex:#5B21B6 | migrate_visual |
| `kamuk/js/simulation-crm-bridge.js` | js | legacy_hex:#5B21B6 | migrate_visual |
| `kamuk/js/simulation-formato-e.js` | js | legacy_hex:#5B21B6 | migrate_visual |
| `kamuk/js/simulation-onboarding.js` | js | legacy_hex:#5B21B6 | migrate_visual |
| `kamuk/js/simulation-prep.js` | js | legacy_hex:#5B21B6 | migrate_visual |
| `kamuk/js/simulation-training.js` | js | legacy_hex:#5B21B6 | migrate_visual |
| `kamuk/Kamuk_Engine.html` | html | legacy_hex:#7C3AED; assets_logos_infinity; apple-touch_non_brandpack; favicon_non_brandpack; theme-color_legacy | migrate_visual |
| `kamuk/kamuk-holdings-crm.html` | html | theme-color_legacy | migrate_visual |
| `kamuk/nexora-legacy.html` | html | legacy_hex:#5B21B6,#7C3AED,#EDE9FE,#F8F8FF; assets_logos_infinity | migrate_visual |
| `kamuk/nexora.html` | html | legacy_hex:#5B21B6,#7C3AED,#EDE9FE,#F8F8FF; assets_logos_infinity | migrate_visual |
| `kamuk/training-book/como-usar/index.html` | html | legacy_hex:#7c3aed,#5b21b6 | migrate_visual |
| `nexora-legacy.html` | html | assets_logos_infinity | migrate_visual |
| `nexora-next/lab.html` | html | assets_logos_infinity | migrate_visual |
| `nexora.html` | html | assets_logos_infinity | migrate_visual |
| `portal-access.html` | html | assets_logos_infinity | migrate_visual |
| `preview-lesson-clip.html` | html | Segoe_UI_branding | migrate_visual |
| `programa-50.html` | html | og:image | migrate_visual |
| `prototype-cadamag/_inventory-raw.json` | json | legacy_hex:#5B21B6,#EDE9FE,#7C3AED,#3B0E8C,#F8F8FF,#7c3aed; logo_refs:assets/logos/infinity-engine.png\|assets/logos/infinity-logo-improved.png\|assets/logos/infinity-logo.png\|assets/logos/infinity-; assets_logos_infinity; og:image; twitter:image; theme-color_legacy | migrate_visual |
| `prototype-cadamag/_migration-pass2.json` | json | logo_refs:assets/logos/infinity-engine.png\|assets/logos/infinity-logo-improved.png\|assets/logos/infinity-logo.png\|assets/logos/infinity-; assets_logos_infinity | migrate_visual |
| `prototype-cadamag/assets/brand/favicon/apple-touch-icon.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/assets/brand/png/infinity-logo-horizontal-dark.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/assets/brand/png/infinity-logo-monochrome-dark.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/assets/brand/png/infinity-logo-monochrome-light.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/assets/brand/png/infinity-logo-stacked-dark.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/portal-access.html` | html | assets_logos_infinity | migrate_visual |
| `prototype-cadamag/public/brand/apple-touch-icon.png` | png | asset_path_or_filename | inspect; replace active refs; keep file until unused |
| `prototype-cadamag/scripts/fix-inventory-and-logos.js` | js | Space_Grotesk; logo_refs:assets/logos/infinity ref\|infinity-studio-cr-nav\|infinity-studio-cr-logo\|infinity-studio-cr\|infinity-engine\.png\|training-book\.png; assets_logos_infinity | migrate_visual |
| `prototype-cadamag/scripts/fix-mangled-srcset.js` | js | logo_refs:infinity-studio-cr-nav@2x/i.te\|infinity-studio-cr-nav@2x | migrate_visual |
| `prototype-cadamag/scripts/inventory-brand-legacy.js` | js | legacy_hex:#5B21B6,#7C3AED,#3B0E8C,#EDE9FE,#F8F8FF,#5b21b6,#7c3aed,#3b0e8c; Space_Grotesk; logo_refs:infinity-studio-cr[^\|infinity-studio-cr\|infinity-engine\|infinity-logo\|og-\|; og:image; twitter:image; apple-touch_non_brandpack | migrate_visual |
| `prototype-cadamag/scripts/migrate-infinity-brand-pass2.js` | js | legacy_hex:#5B21B6,#5b21b6,#7C3AED,#7c3aed,#3B0E8C,#3b0e8c,#EDE9FE,#ede9fe; Space_Grotesk; logo_refs:infinity-studio-cr[^\|infinity-engine\.png\|assets/logos/infinity*; assets_logos_infinity | migrate_visual |
| `prototype-cadamag/scripts/migrate-infinity-brand-pass3.js` | js | legacy_hex:#5B21B6,#5b21b6,#7C3AED,#7c3aed,#3B0E8C,#3b0e8c,#EDE9FE,#ede9fe; Space_Grotesk | migrate_visual |
| `prototype-cadamag/scripts/migrate-infinity-brand.js` | js | legacy_hex:#5B21B6,#5b21b6,#7C3AED,#7c3aed,#3B0E8C,#3b0e8c,#EDE9FE,#ede9fe; logo_refs:infinity-studio-cr-nav\|infinity-studio-cr-logo\|infinity-studio-cr\|infinity-engine\.png\|training-book\.png; og:image; twitter:image | migrate_visual |
| `prototype-cadamag/scripts/validate-brand-pack.js` | js | logo_refs:infinity-studio-cr-nav.png | migrate_visual |
| `scripts/_archive_kamuk/build-kamuk-engine.js` | js | logo_refs:infinity-studio-cr-nav\|infinity-studio-cr; assets_logos_infinity | migrate_visual |
| `sw.js` | js | assets_logos_infinity | migrate_visual |
| `training-book/glosario/index.html` | html | Segoe_UI_branding | migrate_visual |
| `training-book/mac/index.html` | html | Segoe_UI_branding | migrate_visual |
| `try-alice.html` | html | og:image | migrate_visual |
| `try-demo.html` | html | assets_logos_infinity | migrate_visual |
