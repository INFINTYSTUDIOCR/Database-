# Restaura — punto de guardado 2026-07-02 (Alice companion + parches TTS)
# Uso: desde la raiz del repo:
#   powershell -ExecutionPolicy Bypass -File backup\restaura-2026-07-02\restore.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $root 'Infinity_Student_Portal.html'))) {
  $root = Get-Location
}
$src = Join-Path $PSScriptRoot 'mirror'
if (-not (Test-Path $src)) {
  Write-Error "No se encontro mirror en $src"
}

Write-Host "Restaurando desde backup restaura-2026-07-02..."
Write-Host "Destino: $root"

$skip = @('node_modules', '.git', 'backup')
Get-ChildItem $src -Force | ForEach-Object {
  $name = $_.Name
  if ($skip -contains $name) { return }
  $target = Join-Path $root $name
  if ($_.PSIsContainer) {
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Copy-Item $_.FullName $target -Recurse -Force
  } else {
    Copy-Item $_.FullName $target -Force
  }
}

Write-Host "Listo. Archivos restaurados al punto del 2026-07-02."
Write-Host "Si usas Render: redeploy del backend despues de restaurar server.js."
