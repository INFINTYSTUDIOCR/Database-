@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo  Infinity — configurar WhatsApp automatico
echo ============================================
echo.
echo Necesitas la clave ANALYZE_SECRET de Render.
echo (Render.com → tu servicio → Environment)
echo.

set /p SECRET="Pega la clave aqui y Enter: "
if "%SECRET%"=="" (
  echo No pegaste ninguna clave.
  pause
  exit /b 1
)

(
  echo BACKEND_URL=https://alice-by-infinity.onrender.com
  echo BRIDGE_SECRET=%SECRET%
  echo CLIENT_URL=https://studioinfinitycr.com/try-alice.html
) > .env

echo.
echo Listo. Ahora dale doble clic a: INICIAR.bat
echo.
pause
