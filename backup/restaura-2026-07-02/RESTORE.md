# Punto de restauración — `restaura-2026-07-02`

Snapshot completo del proyecto **antes de cambios futuros** (Alice companion, parches TTS, Nexora audio sin cortes, etc.).

- **Fecha:** 2 de julio de 2026  
- **Carpeta mirror:** `backup/restaura-2026-07-02/mirror/` (~1450 archivos, sin `node_modules` ni `.git`)

## Restaurar con una palabra (agente Cursor)

Escribí en el chat:

**`Restaura`**

El agente debe ejecutar `backup/restaura-2026-07-02/restore.ps1` desde la raíz del repo y confirmar qué se restauró.

## Restaurar manualmente (PowerShell)

Desde `C:\Users\ARMANDO\Projects\Database-clone`:

```powershell
powershell -ExecutionPolicy Bypass -File backup\restaura-2026-07-02\restore.ps1
```

## Qué incluye este punto

- `Infinity_Student_Portal.html` — Alice companion + parches voz
- `backend/server.js` — prompts companion
- `js/tts-chunks.js` — unlock audio / playAudioBlob
- `nexora.html` — parche TTS (sin cortes), sin cambios de UI
- Resto del proyecto tal como estaba al crear el backup

## Después de restaurar

1. Recargar el portal en el navegador (Ctrl+F5).
2. Si el backend en Render no coincide con el repo local, redeploy de `server.js`.

## No sobrescribe

- `node_modules/` (no está en el mirror)
- `.git/` (historial git intacto)
- Otras carpetas dentro de `backup/` (snapshots viejos se conservan)
