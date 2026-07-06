# Activa identidad Git SOLO en este repositorio (no global).
# Johnny (default):  powershell -ExecutionPolicy Bypass -File scripts\activar-git-identidad.ps1
# Jill Pro:          powershell -ExecutionPolicy Bypass -File scripts\activar-git-identidad.ps1 -Profile jill-pro

param(
  [ValidateSet('johnny', 'jill-pro')]
  [string]$Profile = 'johnny'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if ($Profile -eq 'jill-pro') {
  $localFile = Join-Path $root 'scripts\git-identity.jill-pro.local'
  $example = Join-Path $root 'scripts\git-identity.jill-pro.local.example'
} else {
  $localFile = Join-Path $root 'scripts\git-identity.local'
  $example = Join-Path $root 'scripts\git-identity.local.example'
}

if (-not (Test-Path $localFile)) {
  Write-Host "Falta $localFile - copia desde $(Split-Path -Leaf $example) y edita nombre/email." -ForegroundColor Yellow
  exit 1
}

$vars = @{}
Get-Content $localFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
    $vars[$matches[1].Trim()] = $matches[2].Trim()
  }
}

$name = $vars['GIT_USER_NAME']
$email = $vars['GIT_USER_EMAIL']

if (-not $name -or -not $email) {
  Write-Host 'GIT_USER_NAME y GIT_USER_EMAIL son obligatorios.' -ForegroundColor Red
  exit 1
}

Push-Location $root
git config user.name $name
git config user.email $email
Pop-Location

Write-Host "Identidad [$Profile] activada en este repo: $name ($email)" -ForegroundColor Green
Write-Host 'Verificá con: git config user.name ; git config user.email'
Write-Host 'Perfiles: johnny (default) | jill-pro'
