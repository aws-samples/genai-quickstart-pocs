#!/bin/bash
# Simple packaging script for Lambda deployment
# Creates a zip file that customers can upload to S3

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Creating Lambda Deployment Package"
echo "=========================================="
echo ""

# Clean up previous builds
echo "Cleaning up previous builds..."
rm -rf package
rm -f lambda-deployment.zip
echo -e "${GREEN}✓ Cleaned up${NC}"
echo ""

# Create package directory
echo "Creating package directory..."
mkdir -p package
echo -e "${GREEN}✓ Created package directory${NC}"
echo ""

# Install dependencies (Lambda runtime already has boto3)
echo "Checking Lambda dependencies..."
if [ -s requirements-lambda.txt ] && grep -v '^#' requirements-lambda.txt | grep -v '^[[:space:]]*$' > /dev/null 2>&1; then
    echo "Installing Python dependencies..."
    pip install -r requirements-lambda.txt -t ./package --quiet
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ No external dependencies needed (Lambda runtime has boto3)${NC}"
fi
echo ""

# Copy source code
echo "Copying source code..."
cp -r src package/
echo -e "${GREEN}✓ Source code copied${NC}"
echo ""

# Create zip file
echo "Creating zip file..."
cd package
zip -r ../lambda-deployment.zip . -q
cd ..
echo -e "${GREEN}✓ Zip file created${NC}"
echo ""

# Clean up package directory
rm -rf package

# Get file size
FILE_SIZE=$(du -h lambda-deployment.zip | cut -f1)

echo "=========================================="
echo -e "${GREEN}✓ Package Created Successfully!${NC}"
echo "=========================================="
echo ""
echo "File: lambda-deployment.zip"
echo "Size: $FILE_SIZE"
echo ""
echo -e "${YELLOW}Next Steps for Customer Deployment:${NC}"
echo ""
echo "1. Upload lambda-deployment.zip to S3:"
echo "   - Go to S3 console in AWS"
echo "   - Create or select a bucket"
echo "   - Upload lambda-deployment.zip"
echo "   - Note the bucket name"
echo ""
echo "2. Deploy via CloudFormation Console:"
echo "   - Go to CloudFormation console"
echo "   - Click 'Create Stack' → 'With new resources'"
echo "   - Upload template.yaml"
echo "   - Fill in the S3 bucket name (from step 1)"
echo "   - Click through wizard and Create"
echo ""
