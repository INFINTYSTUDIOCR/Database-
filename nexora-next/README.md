# Nexora Next (sandbox)

Copia aislada del lab + engine de simulaciones de Nexora. **No toca** `nexora.html`, `Infinity_Nexus_Engine.html` ni el portal en producción.

## Abrir

| Pieza | URL relativa |
|-------|----------------|
| Engine (programar sim) | [`engine.html`](engine.html) |
| Lab (correr sim) | [`lab.html`](lab.html) |

Flujo: **Engine → Guardar simulación → Abrir lab sandbox**.

## Experiencia de escritorio (v2)

El lab usa skin **Holdings-like** (`css/nexora-desk.css` + `js/nexora-desk-skin.js`):

- Densidad y tipografía tipo Support Desk (Inter, radius 6px, paneles planos)
- Case header + acciones operativas (Verify / Billing / Escalate / Freeze)
- Tabs: Overview · Services · Billing · Payments · Contacts · Activity (+ Security cuando el escenario lo pide)
- Overview muestra métricas, foco del caso y flags alineados al escenario
- Consola de llamada sobria (sin look de juego)

## Aislamiento

- Scripts propios bajo `nexora-next/js/`
- Storage `nexora_next_*`
- Auth/TTS/mic por lectura desde `../`

Cuando esta versión reemplace a Nexora, se promociona por separado.
