# AWS Deployment Guide: S3 + CloudFront

Complete step-by-step guide to deploy this React + Vite application to AWS using S3 for storage and CloudFront for global CDN distribution.

---

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- Node.js and npm installed
- Your app built and tested locally
- AWS account with appropriate permissions
- (Optional) A custom domain name

---

## Step 1: Prepare Your Application

Create production environment file:

```bash
# Create .env.production
cat > .env.production << 'EOF'
VITE_API_URL=https://your-backend-api-domain.com/api/v1
VITE_API_TIMEOUT=30000
VITE_APP_NAME=Knowledge Base
EOF
```

Build the application:

```bash
npm run build
```

Verify the `dist/` folder was created with your built files.

---

## Step 2: Create S3 Bucket

Choose a unique bucket name (must be globally unique):

```bash
# Replace 'my-rag-frontend' with your desired name
BUCKET_NAME="aisync-frontend"
REGION="ap-southeast-1"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION
```

---

## Step 3: Configure S3 Bucket for Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html
```

---

## Step 4: Set Bucket Policy (Public Read Access)

Create a policy file:

```bash
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF

# Apply the policy
aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file://bucket-policy.json
```

---

## Step 5: Upload Your Build to S3

```bash
# Upload all files from dist/ to S3
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html separately with no-cache
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

**Note**: This sets long cache for assets (JS/CSS) but no cache for `index.html` to ensure users get updates.

---

## Step 6: Test S3 Website Endpoint

```bash
# Get the website URL
echo "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
```

Open this URL in your browser. Your app should load (but without HTTPS yet).

---

## Step 7: Create CloudFront Distribution

Create CloudFront config file:

```bash
cat > cloudfront-config.json << EOF
{
  "CallerReference": "$(date +%s)",
  "Comment": "RAG Frontend Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$BUCKET_NAME.s3-website-$REGION.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json \
  > cloudfront-output.json

# Extract distribution ID and domain
DISTRIBUTION_ID=$(cat cloudfront-output.json | grep -o '"Id": "[^"]*' | head -1 | cut -d'"' -f4)
CLOUDFRONT_DOMAIN=$(cat cloudfront-output.json | grep -o '"DomainName": "[^"]*' | head -1 | cut -d'"' -f4)

echo "Distribution ID: $DISTRIBUTION_ID"
echo "CloudFront URL: https://$CLOUDFRONT_DOMAIN"
```

**⏳ Wait 10-15 minutes** for CloudFront to deploy globally.

---

## Step 8: Configure Custom Domain (Optional)

If you have a domain:

### 8.1 Request SSL Certificate in ACM

Certificate must be in `us-east-1` region for CloudFront:

```bash
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 8.2 Validate Certificate

1. Go to AWS Certificate Manager console
2. Copy the CNAME record details
3. Add the CNAME record to your DNS provider
4. Wait for validation (5-30 minutes)

### 8.3 Update CloudFront Distribution

1. Go to CloudFront console
2. Edit your distribution
3. Under "Alternate Domain Names (CNAMEs)", add your domain
4. Under "Custom SSL Certificate", select your validated certificate
5. Save changes

### 8.4 Add DNS Record

Add CNAME record in your DNS provider:

```
Type: CNAME
Name: yourdomain.com (or app.yourdomain.com)
Value: [your-cloudfront-domain].cloudfront.net
TTL: 300
```

---

## Step 9: Create Deployment Script

Create `deploy.sh` for future deployments:

```bash
cat > deploy.sh << 'SCRIPT'
#!/bin/bash
set -e

BUCKET_NAME="my-rag-frontend"
DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"  # Replace with actual ID from Step 7

echo "🔨 Building application..."
npm run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 URL: https://[your-cloudfront-domain].cloudfront.net"
SCRIPT

chmod +x deploy.sh
```

**Important**: Update `BUCKET_NAME` and `DISTRIBUTION_ID` in the script with your actual values.

---

## Step 10: Configure Backend CORS

Your backend must allow requests from your CloudFront domain. Update backend CORS settings:

**FastAPI Example**:
```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "https://your-cloudfront-domain.cloudfront.net",
    "https://yourdomain.com",  # if using custom domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Express.js Example**:
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-cloudfront-domain.cloudfront.net',
    'https://yourdomain.com'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

---

## Future Deployments

Simply run:

```bash
./deploy.sh
```

This will:
1. Build the latest version
2. Upload to S3
3. Invalidate CloudFront cache
4. Deploy in ~2-3 minutes

---

## Cost Estimate

- **S3 Storage**: ~$0.023/GB/month
- **S3 Data Transfer**: $0.09/GB (first 1GB free)
- **CloudFront**: First 1TB/month free, then $0.085/GB
- **Typical small app**: $1-5/month

---

## Troubleshooting

### Issue: Blank page after deployment

**Causes**:
- CORS errors from backend
- Wrong API URL in environment variables
- JavaScript errors

**Solutions**:
1. Check browser console for errors
2. Verify `VITE_API_URL` in `.env.production`
3. Check backend CORS configuration
4. Verify backend API is accessible

### Issue: 403 errors on page refresh

**Cause**: CloudFront not configured to handle SPA routing

**Solution**: Verify CloudFront custom error responses (Step 7) redirect 403/404 to `/index.html`

### Issue: Old version still showing after deployment

**Solutions**:
1. Run CloudFront invalidation:
   ```bash
   aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
   ```
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if `index.html` has no-cache headers

### Issue: API requests failing

**Causes**:
- CORS not configured
- Wrong API URL
- Backend not accessible

**Solutions**:
1. Check Network tab in browser DevTools
2. Verify backend is running and accessible
3. Test API directly with curl/Postman
4. Check backend logs for errors

### Issue: CloudFront distribution creation fails

**Cause**: Invalid configuration

**Solution**: Use AWS Console to create distribution manually:
1. Go to CloudFront console
2. Create distribution
3. Origin: S3 website endpoint (not bucket directly)
4. Viewer Protocol Policy: Redirect HTTP to HTTPS
5. Custom Error Responses: 403 → /index.html (200)
6. Custom Error Responses: 404 → /index.html (200)

---

## Security Best Practices

1. **Enable CloudFront access logging**:
   ```bash
   aws cloudfront update-distribution \
     --id $DISTRIBUTION_ID \
     --logging-config Enabled=true,Bucket=logs-bucket.s3.amazonaws.com,Prefix=cloudfront/
   ```

2. **Enable S3 bucket versioning** (for rollback):
   ```bash
   aws s3api put-bucket-versioning \
     --bucket $BUCKET_NAME \
     --versioning-configuration Status=Enabled
   ```

3. **Set up CloudWatch alarms** for monitoring

4. **Use AWS WAF** for DDoS protection (optional, additional cost)

---

## CI/CD with GitHub Actions (Bonus)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_API_TIMEOUT: 30000
          VITE_APP_NAME: Knowledge Base
          
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "index.html"
          aws s3 cp dist/index.html s3://${{ secrets.S3_BUCKET }}/index.html \
            --cache-control "no-cache, no-store, must-revalidate"
            
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

**GitHub Secrets to add**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_URL`

---

## Summary

Your application is now:
- ✅ Hosted on S3 with static website hosting
- ✅ Distributed globally via CloudFront CDN
- ✅ Served over HTTPS
- ✅ Configured for React Router (SPA routing)
- ✅ Optimized with proper caching headers
- ✅ Ready for production traffic

**Access your app at**: `https://[your-cloudfront-domain].cloudfront.net`

---

## Additional Resources

- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review AWS CloudWatch logs
3. Check browser console for errors
4. Verify all environment variables are set correctly
