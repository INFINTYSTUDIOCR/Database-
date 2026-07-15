@echo off
chcp 65001 >nul
title Jill — vista local (sin commit)
cd /d "%~dp0"

echo.
echo ============================================
echo  Jill local — NO necesitas commit ni push
echo ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo Falta Node.js. Instalalo desde https://nodejs.org
  goto FIN
)

powershell -NoProfile -Command "try { (Invoke-WebRequest -Uri 'http://127.0.0.1:8765/' -UseBasicParsing -TimeoutSec 2) ^| Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  echo Iniciando servidor en puerto 8765...
  start "Infinity local 8765" cmd /k "cd /d "%~dp0" && npx --yes http-server -p 8765 -c-1"
  echo Esperando servidor...
  timeout /t 5 /nobreak >nul
) else (
  echo Servidor ya activo en puerto 8765.
)

echo Abriendo Jill en el navegador...
start "" "http://127.0.0.1:8765/Infinity_Student_Portal.html?preview=jill&tab=jill"

echo.
echo URL directa:
echo   http://127.0.0.1:8765/Infinity_Student_Portal.html?preview=jill^&tab=jill
echo.
echo Si la pantalla se ve vieja: Ctrl+Shift+R
echo NO cierres la ventana "Infinity local 8765" mientras pruebas.
echo.

:FIN
pause
