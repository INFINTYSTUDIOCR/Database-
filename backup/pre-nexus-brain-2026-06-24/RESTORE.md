# Restauración — snapshot pre-Nexus Brain (2026-06-24)

Copia funcional guardada **antes** de implementar Nexus Brain.

## Restaurar archivos manualmente (Windows PowerShell)

Desde la raíz del repo:

```powershell
$src = "backup\pre-nexus-brain-2026-06-24"
Copy-Item "$src\backend\server.js" "backend\server.js" -Force
Copy-Item "$src\Infinity_Student_Portal.html" "Infinity_Student_Portal.html" -Force
Copy-Item "$src\nexora.html" "nexora.html" -Force
Copy-Item "$src\try-alice.html" "try-alice.html" -Force
Copy-Item "$src\try-jill.html" "try-jill.html" -Force
Copy-Item "$src\js\demo-stream.js" "js\demo-stream.js" -Force
Copy-Item "$src\js\demo-voice.js" "js\demo-voice.js" -Force
Copy-Item "$src\js\tts-chunks.js" "js\tts-chunks.js" -Force
Remove-Item "backend\nexus-brain.js" -ErrorAction SilentlyContinue
```

Luego redeploy del backend en Render si aplica.

## Git (si se creó el tag en el futuro)

```bash
git checkout backup/pre-nexus-brain-2026-06-24
```

## Pedir restauración al agente

Decí: **"restaura al backup pre-Nexus Brain"**
