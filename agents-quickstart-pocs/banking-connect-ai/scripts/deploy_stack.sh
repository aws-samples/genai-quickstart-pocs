#!/bin/bash
set -e

# Deploy Lambda-based MCP functions for AgentCore Gateway
# Fully private, bank-compliant architecture

ENVIRONMENT=${1:-dev}
REGION=${AWS_REGION:-us-east-1}

echo "========================================="
echo "BetterBank Stack Deployment"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "========================================="

# Deploy CDK stacks
echo ""
echo "Deploying BetterBank stacks..."
cdk deploy --all -c environment="$ENVIRONMENT" --require-approval never

# Get outputs
echo ""
echo "========================================="
echo "✅ Deployment complete!"
echo "========================================="
echo ""
echo "BetterBank stacks deployed successfully!"
echo ""

echo "Gateway Role ARN (use when creating Gateway):"
aws cloudformation describe-stacks \
  --stack-name "betterbank-mcp-lambda-$ENVIRONMENT" \
  --query 'Stacks[0].Outputs[?OutputKey==`GatewayRoleArn`].OutputValue' \
  --output text

echo ""
echo "Lambda ARNs for Gateway targets:"
echo ""

aws cloudformation describe-stacks \
  --stack-name "betterbank-mcp-lambda-$ENVIRONMENT" \
  --query 'Stacks[0].Outputs[?OutputKey==`LockCardLambdaArn`].[OutputKey,OutputValue]' \
  --output text

aws cloudformation describe-stacks \
  --stack-name "betterbank-mcp-lambda-$ENVIRONMENT" \
  --query 'Stacks[0].Outputs[?OutputKey==`UnlockCardLambdaArn`].[OutputKey,OutputValue]' \
  --output text

aws cloudformation describe-stacks \
  --stack-name "betterbank-mcp-lambda-$ENVIRONMENT" \
  --query 'Stacks[0].Outputs[?OutputKey==`RequestNewCardLambdaArn`].[OutputKey,OutputValue]' \
  --output text

echo ""
echo "NEXT STEPS:"
echo ""
echo "Configure AgentCore Gateway via AWS Console:"
echo "1. Go to Bedrock AgentCore Gateway console"
echo "2. Create new Gateway with the Gateway Role ARN above"
echo "3. Add 3 Lambda targets using the Lambda ARNs above"
echo "4. Configure Bedrock Agent to use the Gateway"
echo "5. Test with Amazon Connect"
echo ""
echo "See LAMBDA_MCP_DEPLOYMENT.md for detailed instructions"
echo ""
