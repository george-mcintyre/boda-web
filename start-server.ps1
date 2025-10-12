Write-Host "Iniciando servidor de la boda..." -ForegroundColor Green
Write-Host ""

# Cambiar al directorio server
Set-Location server
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Instalar dependencias si es necesario
Write-Host "Verificando dependencias..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
  npm ci
} else {
  npm install --no-audit --no-fund
}
Write-Host ""

# Iniciar el servidor
Write-Host "Iniciando servidor..." -ForegroundColor Green
node server.js



