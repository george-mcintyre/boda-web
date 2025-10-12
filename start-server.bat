@echo off
echo Iniciando servidor de la boda...
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
echo Iniciando servidor...
node server.js
pause


