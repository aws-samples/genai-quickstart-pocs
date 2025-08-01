#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STACK_NAME="${1:-snowflake-qbusiness-plugin}"
REGION="${2:-us-west-2}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Snowflake Q Business Plugin Test${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${BLUE}[TEST]${NC} Testing deployment for stack: $STACK_NAME"

# Check if stack exists
echo -e "${BLUE}[CHECK]${NC} Verifying stack status..."
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Stack '$STACK_NAME' not found!"
    exit 1
fi

echo -e "${GREEN}[INFO]${NC} Stack Status: $STACK_STATUS"

if [ "$STACK_STATUS" != "CREATE_COMPLETE" ] && [ "$STACK_STATUS" != "UPDATE_COMPLETE" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Stack is not in a complete state: $STACK_STATUS"
fi

# Get all outputs
echo -e "${BLUE}[INFO]${NC} Retrieving stack outputs..."

OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs' \
    --output json)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[SUCCESS]${NC} Stack outputs retrieved successfully!"
    
    # Parse key outputs
    WEB_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="QBusinessWebExperienceUrl") | .OutputValue')
    APP_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="QBusinessApplicationId") | .OutputValue')
    PLUGIN_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="PluginId") | .OutputValue')
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  DEPLOYMENT TEST RESULTS${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}[✅]${NC} Web Experience URL: $WEB_URL"
    echo -e "${GREEN}[✅]${NC} Application ID: $APP_ID"
    echo -e "${GREEN}[✅]${NC} Plugin ID: $PLUGIN_ID"
    
    # Test web URL accessibility
    echo -e "${BLUE}[TEST]${NC} Testing web experience accessibility..."
    if curl -s --head "$WEB_URL" | head -n 1 | grep -q "200 OK"; then
        echo -e "${GREEN}[✅]${NC} Web experience is accessible"
    else
        echo -e "${YELLOW}[⚠️]${NC} Web experience may not be fully ready yet"
    fi
    
    # Check Q Business application status
    echo -e "${BLUE}[TEST]${NC} Checking Q Business application status..."
    APP_STATUS=$(aws qbusiness get-application \
        --application-id "$APP_ID" \
        --region "$REGION" \
        --query 'status' \
        --output text 2>/dev/null)
    
    if [ "$APP_STATUS" = "ACTIVE" ]; then
        echo -e "${GREEN}[✅]${NC} Q Business application is ACTIVE"
    else
        echo -e "${YELLOW}[⚠️]${NC} Q Business application status: $APP_STATUS"
    fi
    
    # Check plugin status
    echo -e "${BLUE}[TEST]${NC} Checking plugin status..."
    PLUGIN_STATUS=$(aws qbusiness get-plugin \
        --application-id "$APP_ID" \
        --plugin-id "${PLUGIN_ID##*|}" \
        --region "$REGION" \
        --query 'state' \
        --output text 2>/dev/null)
    
    if [ "$PLUGIN_STATUS" = "ENABLED" ]; then
        echo -e "${GREEN}[✅]${NC} Plugin is ENABLED"
    else
        echo -e "${YELLOW}[⚠️]${NC} Plugin status: $PLUGIN_STATUS"
    fi
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  NEXT STEPS${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}[MANUAL]${NC} Enable LLM fallback in console:"
    echo -e "${YELLOW}[MANUAL]${NC}   https://console.aws.amazon.com/qbusiness/home?region=$REGION#/applications/$APP_ID"
    echo -e "${YELLOW}[MANUAL]${NC} Create users in IAM Identity Center and assign subscriptions"
    echo -e "${YELLOW}[MANUAL]${NC} Test the web experience: $WEB_URL"
    
else
    echo -e "${RED}[ERROR]${NC} Failed to retrieve stack outputs!"
    exit 1
fi
