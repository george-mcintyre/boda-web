@echo off
echo Iniciando servidor de la boda con MongoDB Atlas...
echo.
cd backend
echo Directorio actual: %CD%
echo.

echo Instalando dependencias de MongoDB...
npm install mongoose

echo.
echo Iniciando servidor con MongoDB Atlas...
node start-mongodb-server.js
pause
