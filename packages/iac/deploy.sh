#!/bin/bash
set -euo pipefail

echo "📦 Building TanStack Start app..."
cd ../app
npm run build
cd ../iac

echo "🚀 Uploading static assets to S3..."
aws s3 sync ../app/.output/public/ s3://nodm-name/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

echo "📋 Deploying infrastructure with Pulumi..."
pulumi up -y

echo "✅ Deployment complete!"
echo "🌐 Visit: https://nodm.name"
