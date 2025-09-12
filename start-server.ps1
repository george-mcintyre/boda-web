Write-Host "Iniciando servidor de la boda..." -ForegroundColor Green
Write-Host ""

# Cambiar al directorio backend
Set-Location backend
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Instalar dependencias si es necesario
Write-Host "Verificando dependencias..." -ForegroundColor Cyan
npm install
Write-Host ""

# Iniciar el servidor
Write-Host "Iniciando servidor..." -ForegroundColor Green
node server.js



