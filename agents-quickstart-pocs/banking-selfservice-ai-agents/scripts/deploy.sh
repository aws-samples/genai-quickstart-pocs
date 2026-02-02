#!/bin/bash
# Deployment script for Card Operations API
# Uses AWS CLI only - no SAM CLI required

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="banking-selfservice-ai-agents"
ENVIRONMENT="${1:-dev}"
REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${2}"
LAMBDA_ZIP="lambda-deployment.zip"

echo "=========================================="
echo "Card Operations - Deployment"
echo "=========================================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME-$ENVIRONMENT"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    echo "Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Determine S3 bucket for deployment artifacts
if [ -z "$S3_BUCKET" ]; then
    S3_BUCKET="bank-deployments-${ACCOUNT_ID}-${REGION}"
    echo "No S3 bucket specified, using: $S3_BUCKET"
fi

# Create S3 bucket if it doesn't exist
echo "Checking S3 bucket..."
if ! aws s3 ls "s3://$S3_BUCKET" 2>&1 > /dev/null; then
    echo "Creating S3 bucket: $S3_BUCKET"
    if [ "$REGION" = "us-east-1" ]; then
        aws s3 mb "s3://$S3_BUCKET"
    else
        aws s3 mb "s3://$S3_BUCKET" --region "$REGION"
    fi
    echo -e "${GREEN}✓ S3 bucket created${NC}"
else
    echo -e "${GREEN}✓ S3 bucket exists${NC}"
fi
echo ""

# Build Lambda package if it doesn't exist
if [ ! -f "$LAMBDA_ZIP" ]; then
    echo "Lambda package not found. Building..."
    ./scripts/package.sh
    echo ""
else
    echo -e "${YELLOW}Using existing $LAMBDA_ZIP (run './scripts/package.sh' to rebuild)${NC}"
    echo ""
fi

# Upload Lambda package to S3
echo "Uploading Lambda package to S3..."
aws s3 cp "$LAMBDA_ZIP" "s3://$S3_BUCKET/$LAMBDA_ZIP"
echo -e "${GREEN}✓ Lambda package uploaded${NC}"
echo ""

# Validate CloudFormation template
echo "Validating CloudFormation template..."
if aws cloudformation validate-template --template-body file://template.yaml --region "$REGION" > /dev/null; then
    echo -e "${GREEN}✓ Template is valid${NC}"
else
    echo -e "${RED}✗ Template validation failed${NC}"
    exit 1
fi
echo ""

# Deploy CloudFormation stack
echo "Deploying to AWS..."
echo "This may take a few minutes..."
echo ""

aws cloudformation deploy \
    --template-file template.yaml \
    --stack-name "$STACK_NAME-$ENVIRONMENT" \
    --region "$REGION" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        LambdaCodeBucket="$S3_BUCKET" \
        LambdaCodeKey="$LAMBDA_ZIP" \
    --tags \
        Environment="$ENVIRONMENT" \
        Project="banking-selfservice-ai-agents" \
    --no-fail-on-empty-changeset

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=========================================="
    echo "✓ Deployment Successful!"
    echo "==========================================${NC}"
    echo ""

    # Get stack outputs
    echo "Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME-$ENVIRONMENT" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table

    echo ""
    echo "Next steps:"
    echo "1. Seed the database: python3 scripts/seed_data_aws.py"
    echo "2. Get your API key using the GetApiKeyCommand above"
    echo "3. Test the API using the ApiEndpoint above (remember to include x-api-key header)"
    echo ""
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi
