#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Snowflake Q Business Plugin Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if required parameters are provided
if [ $# -lt 2 ]; then
    echo -e "${RED}[ERROR]${NC} Usage: $0 <SECRETS_MANAGER_ARN> <IDC_INSTANCE_ARN> [APPLICATION_NAME]"
    echo -e "${YELLOW}[INFO]${NC} Example:"
    echo -e "${YELLOW}[INFO]${NC}   $0 arn:aws:secretsmanager:us-west-2:123456789012:secret:snowflake/oauth-abc123 arn:aws:sso:::instance/ssoins-1234567890abcdef"
    exit 1
fi

SECRETS_MANAGER_ARN="$1"
IDC_INSTANCE_ARN="$2"
APPLICATION_NAME="${3:-SnowflakeCortexApp}"
STACK_NAME="snowflake-qbusiness-plugin"
REGION="us-west-2"

echo -e "${GREEN}[INFO]${NC} Configuration:"
echo -e "${GREEN}[INFO]${NC}   Secrets Manager ARN: $SECRETS_MANAGER_ARN"
echo -e "${GREEN}[INFO]${NC}   IDC Instance ARN: $IDC_INSTANCE_ARN"
echo -e "${GREEN}[INFO]${NC}   Application Name: $APPLICATION_NAME"
echo -e "${GREEN}[INFO]${NC}   Stack Name: $STACK_NAME"
echo -e "${GREEN}[INFO]${NC}   Region: $REGION"

# Check if AWS credentials are configured
echo -e "${BLUE}[CHECK]${NC} Verifying AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} AWS credentials not configured. Please run 'aws configure' or set environment variables."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}[INFO]${NC} Using AWS Account: $ACCOUNT_ID"

# Deploy the CloudFormation stack
echo -e "${BLUE}[DEPLOY]${NC} Deploying CloudFormation stack..."

aws cloudformation deploy \
    --template-file snowflake-q-business-final.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        ExistingSecretsManagerArn="$SECRETS_MANAGER_ARN" \
        ExistingIDCInstanceArn="$IDC_INSTANCE_ARN" \
        ApplicationName="$APPLICATION_NAME" \
        CortexSearchServiceName="PUMP_SEARCH_SERVICE" \
        PluginDisplayName="Snowflake-Cortex-Search" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} ✅ Stack deployment completed successfully!"
    
    # Get stack outputs
    echo -e "${BLUE}[INFO]${NC} Retrieving deployment information..."
    
    WEB_URL=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`QBusinessWebExperienceUrl`].OutputValue' \
        --output text)
    
    APPLICATION_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`QBusinessApplicationId`].OutputValue' \
        --output text)
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT SUCCESSFUL! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}[SUCCESS]${NC} Web Experience URL: $WEB_URL"
    echo -e "${GREEN}[SUCCESS]${NC} Application ID: $APPLICATION_ID"
    echo -e ""
    echo -e "${YELLOW}[NEXT STEPS]${NC} Manual Configuration Required:"
    echo -e "${YELLOW}[STEP 1]${NC} Go to: https://console.aws.amazon.com/qbusiness/home?region=$REGION#/applications/$APPLICATION_ID"
    echo -e "${YELLOW}[STEP 2]${NC} Click 'Edit' and enable 'Allow Amazon Q to fall back to LLM knowledge'"
    echo -e "${YELLOW}[STEP 3]${NC} Create users in IAM Identity Center and assign Q Business subscriptions"
    echo -e "${YELLOW}[STEP 4]${NC} Test the application at: $WEB_URL"
    echo -e ""
    echo -e "${BLUE}[INFO]${NC} For detailed outputs, run:"
    echo -e "${BLUE}[INFO]${NC}   aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs'"
    
else
    echo -e "${RED}[ERROR]${NC} ❌ Stack deployment failed!"
    echo -e "${RED}[ERROR]${NC} Check the CloudFormation console for details:"
    echo -e "${RED}[ERROR]${NC} https://console.aws.amazon.com/cloudformation/home?region=$REGION#/stacks"
    exit 1
fi
