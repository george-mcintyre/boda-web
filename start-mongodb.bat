@echo off
echo Iniciando servidor de la boda con MongoDB Atlas...
echo.
cd server
echo Directorio actual: %CD%
echo.

echo Verificando dependencias...
if exist package-lock.json (
  npm ci
) else (
  npm install --no-audit --no-fund
)

echo.
echo Iniciando servidor con MongoDB Atlas...
node server.js
pause
