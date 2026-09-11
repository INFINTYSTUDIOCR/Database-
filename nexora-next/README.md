# Nexora Next (sandbox)

Copia aislada del lab + engine de simulaciones de Nexora. **No toca** `nexora.html`, `Infinity_Nexus_Engine.html` ni el portal en producción.

## Abrir

Serví la raíz del repo (o abrí los HTML en local) y entrá a:

| Pieza | URL relativa |
|-------|----------------|
| Engine (programar sim) | [`engine.html`](engine.html) |
| Lab (correr sim) | [`lab.html`](lab.html) |

Flujo: **Engine → Guardar simulación → Abrir lab sandbox**.

## Aislamiento

- Scripts propios bajo `nexora-next/js/` (+ profile/characters en esta carpeta).
- Auth/TTS/mic compartidos solo por lectura: `../infinity-auth.js`, `../js/tts-chunks.js`, `../js/ptt-mic.js`.
- Storage con prefijo `nexora_next_*` (no pisa `nexora_scenario` de prod).

## Qué editar acá

- UI / flujo del lab → `lab.html`
- Programación de escenarios → `engine.html`
- Bancos / industria / rotate → `js/*`
- Voces → `config/nexora-voices.json`

Cuando esta versión reemplace a Nexora, se promociona por separado; hasta entonces prod queda intacta.
