@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo  Infinity — WhatsApp automatico
echo ============================================
echo.

if not exist .env (
  echo Primero ejecuta CONFIGURAR.bat una sola vez.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo No tienes Node.js.
  echo Instala desde: https://nodejs.org  ^(boton LTS^)
  echo Luego vuelve a dar doble clic a este archivo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando componentes ^(solo la primera vez^)...
  call npm install
  if errorlevel 1 (
    echo Fallo npm install.
    pause
    exit /b 1
  )
)

echo.
echo Si sale un codigo QR: escanalo con WhatsApp del telefono.
echo Despues deja ESTA ventana abierta todo el dia.
echo.
npm start
pause
