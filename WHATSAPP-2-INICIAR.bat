@echo off
chcp 65001 >nul
title Infinity WhatsApp Automatico
cd /d "%~dp0scripts\wa-bridge"

echo.
echo ============================================
echo  Infinity — WhatsApp automatico
echo  NO CIERRES ESTA VENTANA
echo ============================================
echo.

if not exist .env (
  echo Falta configurar.
  echo Primero dale doble clic a: WHATSAPP-1-CONFIGURAR.bat
  echo.
  goto FIN
)

where node >nul 2>&1
if errorlevel 1 (
  echo No tienes Node.js instalado.
  echo Entra a https://nodejs.org y descarga el boton LTS.
  echo Instala, reinicia la PC, y vuelve a intentar.
  echo.
  goto FIN
)

if not exist node_modules (
  echo Instalando componentes ^(solo primera vez, espera^)...
  call npm install
  if errorlevel 1 (
    echo Fallo la instalacion.
    echo.
    goto FIN
  )
)

echo Iniciando...
echo Si se abre Chrome con un QR, escanalo con el telefono.
echo WhatsApp del telefono: menu - Dispositivos vinculados.
echo.
node index.js
echo.
echo ============================================
echo  Se detuvo el programa.
echo  Si hubo error, esta escrito ARRIBA de este mensaje.
echo ============================================
echo.

:FIN
echo.
echo Esta ventana se queda abierta a proposito.
echo Cuando termines, cierrala con la X.
echo.
pause
cmd /k
