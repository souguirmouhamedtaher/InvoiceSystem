#!/bin/bash

# Test Docker build locally
# Usage: ./test-docker.sh

echo "🧪 Testing Docker build locally..."

# Build
echo "📦 Building..."
docker build -t invoice-be-test .

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Run
echo "🚀 Starting container..."
docker run -d \
  --name invoice-be-test \
  -p 3001:3000 \
  --env-file .env \
  invoice-be-test

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    docker rm -f invoice-be-test 2>/dev/null
    exit 1
fi

echo "⏳ Waiting for application to start (10s)..."
sleep 10

# Test
echo "🔍 Testing health check..."
if curl -f http://localhost:3001/api/docs > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    echo ""
    echo "🎉 Docker container is working!"
    echo "📝 Swagger docs: http://localhost:3001/api/docs"
    echo ""
    echo "To view logs:"
    echo "  docker logs invoice-be-test"
    echo ""
    echo "To stop:"
    echo "  docker stop invoice-be-test"
    echo "  docker rm invoice-be-test"
else
    echo "❌ Health check failed!"
    echo "📋 Container logs:"
    docker logs invoice-be-test
    docker stop invoice-be-test
    docker rm invoice-be-test
    exit 1
fi
