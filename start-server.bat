@echo off
echo Iniciando servidor de la boda...
echo.
cd backend
echo Directorio actual: %CD%
echo.
echo Instalando dependencias...
npm install
echo.
echo Iniciando servidor...
node server.js
pause



