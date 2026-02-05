# Test Docker build locally (PowerShell)
# Usage: .\test-docker.ps1

Write-Host "🧪 Testing Docker build locally..." -ForegroundColor Green

# Build
Write-Host "📦 Building..." -ForegroundColor Cyan
docker build -t invoice-be-test .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Clean up any existing test container
docker rm -f invoice-be-test 2>$null

# Run
Write-Host "🚀 Starting container..." -ForegroundColor Cyan
docker run -d `
  --name invoice-be-test `
  -p 3001:3000 `
  --env-file .env `
  invoice-be-test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    docker rm -f invoice-be-test 2>$null
    exit 1
}

Write-Host "⏳ Waiting for application to start (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test
Write-Host "🔍 Testing health check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/docs" -Method Get -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Docker container is working!" -ForegroundColor Green
        Write-Host "📝 Swagger docs: http://localhost:3001/api/docs" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To view logs:" -ForegroundColor Yellow
        Write-Host "  docker logs invoice-be-test"
        Write-Host ""
        Write-Host "To stop:" -ForegroundColor Yellow
        Write-Host "  docker stop invoice-be-test"
        Write-Host "  docker rm invoice-be-test"
    }
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "📋 Container logs:" -ForegroundColor Yellow
    docker logs invoice-be-test
    docker stop invoice-be-test
    docker rm invoice-be-test
    exit 1
}
