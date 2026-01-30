#!/bin/bash
set -e

# Get script directory at the very beginning (Windows Git Bash compatible)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -z "$SCRIPT_DIR" ]; then
  SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

STACK_NAME=${1:-bankiq}
REGION=${AWS_DEFAULT_REGION:-${2:-$(aws configure get region 2>/dev/null || echo "us-east-1")}}

echo -e "${PURPLE}"
echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 BankIQ+ FULL DEPLOYMENT WITH COGNITO"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${CYAN}  Stack: ${YELLOW}$STACK_NAME${NC}"
echo -e "${CYAN}  Region: ${YELLOW}$REGION${NC}"
echo -e "${CYAN}  Estimated Time: ${YELLOW}20-25 minutes${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Phase 0: Auth
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GREEN}[0/5]${NC} ${CYAN}Deploying Cognito Authentication...${NC}                ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
${SCRIPT_DIR}/phase0-auth.sh $STACK_NAME $REGION
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Phase 0 failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Phase 0 Complete!${NC}\n"

# Phase 1: Infrastructure (MUST BE FIRST - creates ECR repos)
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GREEN}[1/5]${NC} ${CYAN}Deploying Infrastructure (VPC, ALB, ECS, ECR)...${NC}    ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"

INFRA_EXISTS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION >/dev/null 2>&1 && echo "yes" || echo "no")
if [ "$INFRA_EXISTS" = "yes" ]; then
  echo "✅ Infrastructure stack already exists - skipping"
else
  ${SCRIPT_DIR}/phase1-infrastructure.sh $STACK_NAME $REGION
  if [ $? -ne 0 ]; then
      echo -e "${RED}❌ Phase 1 failed${NC}"
      exit 1
  fi
fi
echo -e "${GREEN}✅ Phase 1 Complete!${NC}\n"

# Phase 2: Agent (needs ECR from infrastructure)
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GREEN}[2/5]${NC} ${CYAN}Deploying AgentCore Agent...${NC}                        ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
${SCRIPT_DIR}/phase2-agent.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Phase 2 failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Phase 2 Complete!${NC}\n"

# Phase 3: Backend
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GREEN}[3/5]${NC} ${CYAN}Building & Deploying Backend Container...${NC}           ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"

# Backend will read agent ARN directly from .bedrock_agentcore.yaml

${SCRIPT_DIR}/phase3-backend-codebuild.sh $STACK_NAME $REGION
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Phase 3 failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Phase 3 Complete!${NC}\n"

# Phase 4: Frontend
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GREEN}[4/5]${NC} ${CYAN}Building & Deploying Frontend (React + S3)...${NC}       ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
${SCRIPT_DIR}/phase4-frontend.sh $STACK_NAME $REGION
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Phase 4 failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Phase 4 Complete!${NC}\n"

# Phase 5: Update Cognito Callback URLs
echo -e "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC} ${GREEN}[5/5]${NC} ${CYAN}Updating Cognito Callback URLs...${NC}                   ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"

CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-frontend --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`ApplicationUrl`].OutputValue' --output text)

if [ -n "$CLOUDFRONT_URL" ]; then
  echo "Updating Cognito callback URLs with: $CLOUDFRONT_URL"
  
  USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
  CLIENT_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)
  
  aws cognito-idp update-user-pool-client \
    --user-pool-id $USER_POOL_ID \
    --client-id $CLIENT_ID \
    --callback-urls "$CLOUDFRONT_URL" "${CLOUDFRONT_URL}/" "http://localhost:3000" \
    --logout-urls "$CLOUDFRONT_URL" "${CLOUDFRONT_URL}/" "http://localhost:3000" \
    --supported-identity-providers "COGNITO" \
    --allowed-o-auth-flows "code" \
    --allowed-o-auth-scopes "email" "openid" "profile" \
    --allowed-o-auth-flows-user-pool-client \
    --region $REGION > /dev/null
  
  echo "✅ Cognito callback URLs updated"
else
  echo "⚠️  Could not get CloudFront URL - skipping callback URL update"
fi
echo ""

echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE WITH COGNITO!"
echo "═══════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo -e "${CYAN}🌐 Application URL: ${YELLOW}$CLOUDFRONT_URL${NC}"
COGNITO_DOMAIN=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-auth --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`CognitoDomain`].OutputValue' --output text 2>/dev/null || echo "bankiq-auth-$(aws sts get-caller-identity --query Account --output text)")
echo -e "${CYAN}🔐 Login URL: ${YELLOW}https://$COGNITO_DOMAIN.auth.$REGION.amazoncognito.com${NC}"
echo -e "${CYAN}📊 View logs: ${YELLOW}aws logs tail /ecs/bankiq-backend --follow${NC}"
echo -e "${CYAN}🔍 Monitor: ${YELLOW}agentcore status${NC}"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "  1. Visit: $CLOUDFRONT_URL"
echo "  2. Click 'Sign In with AWS Cognito'"
echo "  3. Click 'Sign up' to create your account"
echo "  4. Verify your email and log in"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
