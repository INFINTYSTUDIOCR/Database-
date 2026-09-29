# BRAND-MIGRATION-AUDIT.md

**Generated:** 2026-09-29  
**Scope:** Active Infinity Studio tree (excludes `backup/`)  
**Rule:** Visual / branding only — logic, auth, APIs, KPIs preserved  
**Git:** NO commit / NO push / NO merge

---

## 1. Páginas Infinity detectadas

### Comerciales (root + prototype)
`index.html`, `foundations.html`, `foundations-path.html`, `ort.html`, `ort-path.html`, `advanced-path.html`, `para-quien.html`, `pricing.html`, `hablemos.html`, `casos-de-exito.html`, `ingles-operacional-latinoamerica.html`, `job-finder.html`, `conversatorio.html`, `off-the-clock.html`, `alice.html`, `jill.html`, `claire.html`, `training-book.html`, `nexora.html`, `programa-50.html`, `gospanol.html` (landing Infinity chrome), más equivalentes en `prototype-cadamag/*.html`.

### Herramientas / productos
`Infinity_Diagnostic_Tool (7).html`, `prototype-cadamag/diagnostico.html`, `Infinity_Student_Portal.html`, `portal-access.html`, `Infinity_Nexus_Engine.html`, `Infinity_Scheduler.html`, `Infinity_Training_Book.html`, `Infinity_Training_Book (1).html`, `try-alice.html`, `try-jill.html`, `try-nexora.html`, `try-demo.html`, `activar.html`, `arcade-demo.html`, `infinity-holdings-crm.html`, `nexora-legacy.html`, `nexora-next/lab.html`, training-book hospedaje pages, games Infinity.

---

## 2. Páginas migradas

Todas las comerciales root listadas arriba + suite `prototype-cadamag/` (shell ya nuevo; CTAs/diagnóstico alineados).

Cambios aplicados:
- Favicon / apple-touch → brand pack
- Logos → `prototype-cadamag/assets/brand/png/*`
- Tipografía → Sora + Inter
- `css/infinity-brand-system.css` inyectado
- Hex legacy remapeado
- `theme-color` / OG image / JSON-LD logo
- Firma Cadamag donde faltaba

---

## 3. Herramientas migradas

| Herramienta | Estado visual |
|---|---|
| Diagnostic `(7)` + `diagnostico.html` | Brand system / diagnostic-tool.css |
| Student Portal | brand pack + `student-portal-v2.css` + tokens |
| Nexus Engine | `:root` navy→violet + brand-system + logo/favicon |
| Scheduler / Training Book(s) | brand-system + token remap |
| try-alice / jill / nexora / demo | brand-system + favicons |
| activar / arcade-demo / holdings CRM | brand-system |
| portal-access (root + proto) | shell Infinity; Kamuk/GOSpanol logos preservados |

---

## 4. CSS migrado

**Nuevo:** `css/infinity-brand-system.css`  
**Actualizados (tokens/fonts/hex):** `css/pages.css`, `path-pages.css`, `pricing.css`, `demo.css`, `program-vignettes.css`, `daily-inspiration.css`, `pwa-install.css`, `student-deliverables.css`, `infinity-training-glossary.css`, `student-portal-v2.css`, `prototype-cadamag/css/*` (sistema ya alineado), `nexora-next/css/nexora-desk.css`, `training-book/.../hospedaje.css`.

---

## 5. Logos reemplazados (referencias activas)

Referencias activas a:
- `assets/logos/infinity-studio-cr*`
- `infinity-engine.png`
- `infinity-logo*.png`

→ `prototype-cadamag/assets/brand/png/infinity-logo-horizontal-light.png` / `infinity-symbol.png` / `infinity-logo-stacked-dark.png`

Archivos binarios legacy **no borrados** (historial). Ver `ASSET_REQUIRES_REPLACEMENT.md`.

**Preservados a propósito:** `assets/logos/alice.png`, `jill.png`, `nexora.png`, `kamuk-school.png`, `gospanol.png` (marcas de producto / marcas separadas).

---

## 6. Favicons reemplazados

Brand pack:
`svg/favicon.svg`, `favicon.ico`, `favicon-16/32/48`, `apple-touch-icon`, `icon-192`, `icon-512`

Actualizado en HTML Infinity + `manifest-portal.json`, `manifest-engine.json`, `manifest-alice.json` (`theme_color` / `background_color` `#080B0F`).

---

## 7. Imágenes legacy reemplazadas

- OG / Twitter / JSON-LD logo → brand pack PNG
- Nav / hero / footer Infinity logos en `index.html` (srcset reparado)
- Canon Jill SVGs: hex `#5B21B6` / `#7C3AED` / etc. → nueva paleta

---

## 8. Assets pendientes manualmente

Ver `prototype-cadamag/ASSET_REQUIRES_REPLACEMENT.md`:
- Binarios `assets/logos/infinity-*` aún en disco (sin refs Infinity activas a esos files)
- Product art `alice/jill/nexora.png` (no son logo corporativo; rediseño opcional)
- Screenshots/mockups con branding viejo embebido: no detectados como archivos aparte; si aparecen en marketing, reemplazo manual

---

## 9. Branding legacy todavía encontrado (activo Infinity)

| Señal | Estado |
|---|---|
| Hex `#5B21B6` `#7C3AED` `#3B0E8C` `#EDE9FE` `#F8F8FF` en árbol Infinity activo | **0** (fuera de scripts de auditoría que almacenan patrones) |
| `Space Grotesk` en páginas Infinity | **0** |
| Refs `assets/logos/infinity-*` en HTML/JS activo | **0** |
| Hits de inventario restantes | Casi todos: binarios en disco, Kamuk/GOSpanol (excluibles), `og:image` (ya brand pack), Segoe fallback en arcade/glossary parcial, scripts de migración |

---

## 10. Excepciones justificadas

1. **`backup/`** — no tocado  
2. **Kamuk School** — branding azul propio preservado  
3. **GOSpanol** — logo/producto propio; chrome Infinity en `gospanol.html` sí actualizado  
4. **Arcade pixel skins** — tipografía mono/Segoe de juego, no branding corporativo  
5. **Scripts `migrate-*` / `inventory-*`** — contienen strings legacy como patrones de búsqueda  
6. **Archivos binarios legacy** — retenidos; refs activas remapeadas  

---

## 11. Kamuk / GOSpanol preservados

- `kamuk/**` no migrado a paleta Infinity  
- `gospanol/**` app no forzada a violet Infinity  
- Logos Kamuk/GOSpanol en portal-access intactos  

---

## 12. Estado responsive

No se ejecutó matriz completa 6 viewports en esta pasada. Shell prototype + brand-system usan layout fluid existente. **Pendiente QA visual formal** en 1920 / 1440 / 1024 / 768 / 430 / 390.

---

## 13. Tests ejecutados

| Test | Resultado |
|---|---|
| Inventario pre (`inventory-brand-legacy.js`) | 1394 archivos auditados; 183 hits iniciales |
| Migración bulk pass1–3 | Ejecutada |
| Re-inventario post | 1404 auditados; hex legacy activo Infinity ≈ 0 |
| Spot-check `index` / Engine / portal / diagnóstico | brand CSS + logos brand pack presentes |
| Suite unitaria formal (`npm test`) | No hay suite de producto configurada en root |
| Console/login E2E | No ejecutado (sin commit; QA manual pendiente) |

---

## Inventario

- Pre: `prototype-cadamag/_inventory.md`  
- Raw: `prototype-cadamag/_inventory-raw.json`  
- Assets: `prototype-cadamag/ASSET_REQUIRES_REPLACEMENT.md`

## URL local principal

`http://127.0.0.1:57736/prototype-cadamag/index.html`  
Diagnóstico: `http://127.0.0.1:57736/prototype-cadamag/diagnostico.html`
