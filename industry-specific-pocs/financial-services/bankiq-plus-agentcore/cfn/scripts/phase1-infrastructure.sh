#!/bin/bash
set -e

STACK_NAME=${1:-bankiq}
REGION=${AWS_DEFAULT_REGION:-${2:-$(aws configure get region 2>/dev/null || echo "us-east-1")}}

echo "=========================================="
echo "Deploy AWS Infrastructure"
echo "=========================================="

# Get script directory and navigate to templates
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${SCRIPT_DIR}/../templates"

# Deploy prerequisites stack
echo "🚀 Deploying infrastructure..."
aws cloudformation create-stack \
  --stack-name ${STACK_NAME}-infra \
  --template-body file://prerequisites.yaml \
  --parameters ParameterKey=ProjectName,ParameterValue=$STACK_NAME ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION

echo "⏳ Waiting for infrastructure creation (5-7 minutes)..."
aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME}-infra --region $REGION

# Get outputs
BACKEND_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`BackendECRRepositoryUri`].OutputValue' --output text)
VPC_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text)
SUBNET_IDS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`SubnetIds`].OutputValue' --output text)
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text)

# Save outputs
echo "$BACKEND_ECR" > /tmp/backend_ecr.txt
echo "$VPC_ID" > /tmp/vpc_id.txt
echo "$SUBNET_IDS" > /tmp/subnet_ids.txt
echo "$FRONTEND_BUCKET" > /tmp/frontend_bucket.txt

echo ""
echo "✅ PHASE 1 COMPLETE"
echo "Backend ECR: $BACKEND_ECR"
echo "VPC ID: $VPC_ID"
echo "Subnet IDs: $SUBNET_IDS"
echo "Frontend Bucket: $FRONTEND_BUCKET"
echo ""
echo "Next: Run phase2-agent.sh"
