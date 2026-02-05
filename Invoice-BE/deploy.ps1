# Manual deployment script for Invoice Backend (PowerShell)
# Usage: .\deploy.ps1

Write-Host "🚀 Starting deployment of Invoice Backend..." -ForegroundColor Green

# Configuration
$IMAGE_NAME = "louayelaroui/invoice-be"
$TAG = "prod"
$FULL_IMAGE = "${IMAGE_NAME}:${TAG}"

# Build the image
Write-Host "📦 Building Docker image..." -ForegroundColor Cyan
docker build -t $FULL_IMAGE .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Login to Docker Hub
Write-Host "🔐 Logging in to Docker Hub..." -ForegroundColor Cyan
docker login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    exit 1
}

# Push the image
Write-Host "⬆️  Pushing image to Docker Hub..." -ForegroundColor Cyan
docker push $FULL_IMAGE

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image pushed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps on your server:" -ForegroundColor Yellow
Write-Host "   cd ~/prod/invoice-be/"
Write-Host "   nerdctl pull ${FULL_IMAGE}"
Write-Host "   nerdctl compose down"
Write-Host "   nerdctl compose up -d"
Write-Host ""
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
