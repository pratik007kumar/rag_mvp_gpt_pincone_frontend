#!/bin/bash
set -e

BUCKET_NAME="aisync-frontend"
echo "🔨 Building application..."
npm run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

echo "✅ Deployment complete!"
echo "🌐 S3 URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
echo "⚠️  Configure Cloudflare for HTTPS: https://www.cloudflare.com"
