#!/bin/bash
set -e

STACK_NAME=${1:-bankiq}
REGION=${AWS_DEFAULT_REGION:-${2:-$(aws configure get region 2>/dev/null || echo "us-east-1")}}

echo "=========================================="
echo "Deploy Cognito Authentication"
echo "=========================================="

AUTH_STACK_EXISTS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION >/dev/null 2>&1 && echo "yes" || echo "no")

if [ "$AUTH_STACK_EXISTS" = "yes" ]; then
  echo "✅ Auth stack already exists"
else
  echo "⚠️  Auth stack not found - deploying..."
  
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  (cd "${SCRIPT_DIR}/../templates" && \
  aws cloudformation create-stack \
    --stack-name ${STACK_NAME}-auth \
    --template-body file://auth.yaml \
    --parameters \
      ParameterKey=ProjectName,ParameterValue=$STACK_NAME \
      ParameterKey=CallbackURL,ParameterValue=http://localhost:3000 \
      ParameterKey=Environment,ParameterValue=prod \
    --region $REGION)
  
  echo "⏳ Waiting for auth stack creation..."
  aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME}-auth --region $REGION
  echo "✅ Auth stack created"
fi