#!/bin/bash

# Manual deployment script for Invoice Backend
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment of Invoice Backend..."

# Configuration
IMAGE_NAME="louayelaroui/invoice-be"
TAG="prod"
CONTAINER_NAME="invoice-backend-prod"

# Build the image
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:${TAG} .

# Login to Docker Hub
echo "🔐 Logging in to Docker Hub..."
docker login

# Push the image
echo "⬆️  Pushing image to Docker Hub..."
docker push ${IMAGE_NAME}:${TAG}

echo "✅ Image pushed successfully!"
echo ""
echo "📝 Next steps on your server:"
echo "   cd ~/prod/invoice-be/"
echo "   nerdctl pull ${IMAGE_NAME}:${TAG}"
echo "   nerdctl compose down"
echo "   nerdctl compose up -d"
echo ""
echo "🎉 Deployment preparation complete!"
