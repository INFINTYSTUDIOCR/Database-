@echo off
cd /d "%~dp0"
echo.
echo  Knight's Quest - Infinity Studio
echo  http://127.0.0.1:8766
echo.
start "" "http://127.0.0.1:8766"
node server.js
pause
