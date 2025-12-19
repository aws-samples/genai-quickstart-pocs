#!/bin/bash
set -e

STACK_NAME=${1:-bankiq}
REGION=${AWS_DEFAULT_REGION:-${2:-$(aws configure get region 2>/dev/null || echo "us-east-1")}}

echo "=========================================="
echo "Deploy Frontend"
echo "=========================================="

# Load dependencies
FRONTEND_BUCKET=$(cat /tmp/frontend_bucket.txt)
ALB_URL=$(cat /tmp/alb_url.txt)

echo "Frontend Bucket: $FRONTEND_BUCKET"
echo "Backend URL: $ALB_URL"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Deploy frontend stack (CloudFront)
echo "🚀 Deploying frontend stack..."
cd "${SCRIPT_DIR}/../templates"
aws cloudformation create-stack \
  --stack-name ${STACK_NAME}-frontend \
  --template-body file://frontend.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=$STACK_NAME \
    ParameterKey=PrerequisitesStackName,ParameterValue=${STACK_NAME}-infra \
    ParameterKey=BackendStackName,ParameterValue=${STACK_NAME}-backend \
  --region $REGION

echo "⏳ Waiting for CloudFront distribution (10-15 minutes)..."
aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME}-frontend --region $REGION

# Get CloudFront URL
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-frontend --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`ApplicationUrl`].OutputValue' --output text)

# Get Cognito config
COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)
COGNITO_DOMAIN=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`CognitoDomain`].OutputValue' --output text)

# Update frontend config with CloudFront URL and Cognito
echo "🚀 Configuring frontend with CloudFront URL and Cognito..."
cd "${SCRIPT_DIR}/../../frontend"
cat > src/config.js << EOF
// Auto-generated - CloudFront + ECS Backend + Cognito Auth
export const API_URL = '$CLOUDFRONT_URL';
export const ENVIRONMENT = 'production';
export const CLOUDFRONT_URL = '$CLOUDFRONT_URL';

export const cognitoConfig = {
  region: '$REGION',
  userPoolId: '$COGNITO_USER_POOL_ID',
  userPoolWebClientId: '$COGNITO_CLIENT_ID',
  oauth: {
    domain: '$COGNITO_DOMAIN.auth.$REGION.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: '$CLOUDFRONT_URL',
    redirectSignOut: '$CLOUDFRONT_URL',
    responseType: 'code'
  }
};
EOF

# Build and upload frontend
echo "🚀 Installing dependencies..."
npm install
echo "🚀 Building frontend..."
npm run build
echo "🚀 Uploading to S3..."
aws s3 sync build/ s3://$FRONTEND_BUCKET/ --delete

# Get CloudFront URL
CLOUDFRONT_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-frontend --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)
APP_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-frontend --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`ApplicationUrl`].OutputValue' --output text)

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*" --region $REGION

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Application URL: $APP_URL"
echo "Backend API: $ALB_URL"
echo "Agent ARN: $(cat /tmp/agent_arn.txt)"
echo ""
echo "Note: CloudFront may take 5-10 minutes to fully propagate"
