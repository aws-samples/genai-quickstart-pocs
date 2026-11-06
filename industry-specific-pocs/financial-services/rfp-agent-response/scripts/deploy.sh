#!/usr/bin/env bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Deploys the RFP Processing System (macOS and Linux).
# Keep in sync with scripts/deploy.ps1 (Windows). Shared logic lives in
# scripts/deploy_helper.py.
#
# Requires: AWS CLI v2, Python 3.9+ (the .venv is used if present), curl.
# Works with the bash 3.2 that ships with macOS.

set -euo pipefail
export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INFRA_STACK_NAME="terminal-upload"
WEB_STACK_NAME="rfp-web-app"
REGION="us-east-1"
KNOWLEDGE_BASE_ID=""
MODEL_ID="us.anthropic.claude-haiku-5-5"
ADMIN_EMAIL=""
SKIP_PACKAGING=false

usage() {
    cat <<'EOF'
Usage: scripts/deploy.sh [options]

Options:
  --infra-stack-name NAME    Processing stack name (default: terminal-upload)
  --web-stack-name NAME      Web stack name (default: rfp-web-app)
  --region REGION            AWS Region (default: us-east-1)
  --knowledge-base-id ID     Bedrock knowledge base ID (prompted if omitted)
  --model-id ID              Inference profile ID
                             (default: us.anthropic.claude-haiku-5-5)
  --admin-email EMAIL        Create a Cognito user for EMAIL; Cognito emails a
                             temporary password
  --skip-packaging           Reuse build/lambda-function.zip
  -h, --help                 Show this help

Uses the credentials and profile of your AWS CLI (for example AWS_PROFILE).
EOF
}

if [ -t 1 ]; then
    BOLD=$'\033[1m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'
    CYAN=$'\033[36m'; GRAY=$'\033[90m'; RESET=$'\033[0m'
else
    BOLD=""; GREEN=""; YELLOW=""; RED=""; CYAN=""; GRAY=""; RESET=""
fi
step() { printf '\n%s%s%s\n' "$YELLOW" "$*" "$RESET"; }
info() { printf '%s   - %s%s\n' "$GRAY" "$*" "$RESET"; }
ok()   { printf '%s   %s%s\n' "$GREEN" "$*" "$RESET"; }
warn() { printf '%s   %s%s\n' "$YELLOW" "$*" "$RESET"; }
fail() { printf '%s   ERROR: %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

require_value() {
    if [ $# -lt 2 ] || [ -z "$2" ]; then
        echo "Option $1 needs a value" >&2
        usage >&2
        exit 2
    fi
}

while [ $# -gt 0 ]; do
    case "$1" in
        --infra-stack-name) require_value "$@"; INFRA_STACK_NAME="$2"; shift 2 ;;
        --web-stack-name) require_value "$@"; WEB_STACK_NAME="$2"; shift 2 ;;
        --region) require_value "$@"; REGION="$2"; shift 2 ;;
        --knowledge-base-id) require_value "$@"; KNOWLEDGE_BASE_ID="$2"; shift 2 ;;
        --model-id) require_value "$@"; MODEL_ID="$2"; shift 2 ;;
        --admin-email) require_value "$@"; ADMIN_EMAIL="$2"; shift 2 ;;
        --skip-packaging) SKIP_PACKAGING=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
done

cd "$PROJECT_ROOT"

# Prefer the project virtual environment for the shared helper.
if [ -x ".venv/bin/python" ]; then
    PYTHON=".venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON="python3"
else
    PYTHON="python"
fi

for tool in aws curl "$PYTHON"; do
    command -v "$tool" >/dev/null 2>&1 || fail "$tool is required but was not found"
done

stack_output() {
    aws cloudformation describe-stacks --stack-name "$1" --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text
}

update_functions() {
    # $1: comma-separated function names, $2: S3 bucket with the package
    local fn
    for fn in $(printf '%s' "$1" | tr ',' ' '); do
        info "Updating $fn"
        aws lambda update-function-code --function-name "$fn" --region "$REGION" \
            --s3-bucket "$2" --s3-key lambda-function.zip >/dev/null
        aws lambda wait function-updated --function-name "$fn" --region "$REGION"
    done
}

printf '%s========================================\n' "$CYAN"
printf '  RFP Processing System - Full Deploy\n'
printf '========================================%s\n' "$RESET"

step "0. Checking AWS credentials..."
CALLER_ARN="$(aws sts get-caller-identity --query Arn --output text)" \
    || fail "No AWS credentials. Configure the AWS CLI (for example: aws configure sso)."
info "Deploying as $CALLER_ARN"
info "Region: $REGION"

# Step 1: Package the Lambda code
if [ "$SKIP_PACKAGING" = true ]; then
    step "1. Skipping Lambda packaging (using build/lambda-function.zip)..."
    [ -f build/lambda-function.zip ] || fail "build/lambda-function.zip not found; run without --skip-packaging"
else
    step "1. Packaging Lambda functions..."
    "$PYTHON" scripts/deploy_helper.py package --src src --out build/lambda-function.zip \
        || fail "Packaging failed"
    ok "Lambda package created"
fi

# Step 2: Knowledge base ID
step "2. Knowledge Base configuration..."
if [ -z "$KNOWLEDGE_BASE_ID" ]; then
    if [ ! -t 0 ]; then
        fail "--knowledge-base-id is required when not running interactively"
    fi
    info "Enter the 10-character ID of your Bedrock knowledge base (for example ABC123DEF4)"
    read -r -p "   Knowledge Base ID: " KNOWLEDGE_BASE_ID
fi
if ! printf '%s' "$KNOWLEDGE_BASE_ID" | grep -Eq '^[A-Z0-9]{10}$'; then
    fail "Invalid Knowledge Base ID '$KNOWLEDGE_BASE_ID' (expected 10 uppercase letters or digits)"
fi
ok "Using Knowledge Base ID $KNOWLEDGE_BASE_ID and model $MODEL_ID"

# Step 3: Processing stack
step "3. Deploying infrastructure stack ($INFRA_STACK_NAME)..."
aws cloudformation deploy \
    --template-file infrastructure/cloudformation.yaml \
    --stack-name "$INFRA_STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --parameter-overrides "KnowledgeBaseId=$KNOWLEDGE_BASE_ID" "BedrockModelId=$MODEL_ID" \
    --no-fail-on-empty-changeset \
    || fail "Infrastructure deployment failed"
ok "Infrastructure stack deployed"

# Step 4: Pipeline Lambda code
step "4. Deploying pipeline Lambda code..."
DEPLOYMENT_BUCKET="$(stack_output "$INFRA_STACK_NAME" DeploymentBucket)"
BUCKET_NAME="$(stack_output "$INFRA_STACK_NAME" BucketName)"
TABLE_NAME="$(stack_output "$INFRA_STACK_NAME" TableName)"
PIPELINE_FUNCTIONS="$(stack_output "$INFRA_STACK_NAME" LambdaFunctionNames)"
info "Uploading package to s3://$DEPLOYMENT_BUCKET/lambda-function.zip"
aws s3 cp build/lambda-function.zip "s3://$DEPLOYMENT_BUCKET/lambda-function.zip" \
    --region "$REGION" --only-show-errors || fail "Could not upload the Lambda package"
update_functions "$PIPELINE_FUNCTIONS" "$DEPLOYMENT_BUCKET"
ok "Pipeline Lambda functions updated"

# Step 5: Web stack
step "5. Deploying web stack ($WEB_STACK_NAME): Cognito, API Gateway, CloudFront..."
WEB_PARAMS="ProcessingStackName=$INFRA_STACK_NAME"
if [ -n "$ADMIN_EMAIL" ]; then
    WEB_PARAMS="$WEB_PARAMS AdminEmail=$ADMIN_EMAIL"
fi
# shellcheck disable=SC2086 # WEB_PARAMS is a list of Key=Value words
aws cloudformation deploy \
    --template-file infrastructure/web-cloudformation.yaml \
    --stack-name "$WEB_STACK_NAME" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION" \
    --parameter-overrides $WEB_PARAMS \
    --no-fail-on-empty-changeset \
    || fail "Web stack deployment failed"
ok "Web stack deployed"

# Step 6: API Lambda code (same package)
step "6. Deploying API Lambda code..."
update_functions "$(stack_output "$WEB_STACK_NAME" LambdaFunctionNames)" "$DEPLOYMENT_BUCKET"
ok "API Lambda functions updated"

# Step 7: Allow browser uploads and downloads from the CloudFront origin
CLOUDFRONT_URL="$(stack_output "$WEB_STACK_NAME" CloudFrontURL)"
step "7. Allowing browser access to the upload bucket from $CLOUDFRONT_URL..."
aws cloudformation deploy \
    --template-file infrastructure/cloudformation.yaml \
    --stack-name "$INFRA_STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" \
    --parameter-overrides "WebAppOrigin=$CLOUDFRONT_URL" \
    --no-fail-on-empty-changeset \
    || fail "Could not update the upload bucket CORS rule"
ok "Upload bucket CORS rule set"

# Step 8: Static site
step "8. Deploying web interface..."
WEBSITE_BUCKET="$(stack_output "$WEB_STACK_NAME" WebsiteBucket)"
DISTRIBUTION_ID="$(stack_output "$WEB_STACK_NAME" CloudFrontDistributionId)"
API_URL="$(stack_output "$WEB_STACK_NAME" ApiGatewayURL)"
USER_POOL_ID="$(stack_output "$WEB_STACK_NAME" UserPoolId)"
mkdir -p build
aws cloudformation describe-stacks --stack-name "$WEB_STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs" --output json > build/web-outputs.json
"$PYTHON" scripts/deploy_helper.py render-web --outputs build/web-outputs.json \
    --templates web/templates --out build/web || fail "Could not render the web interface"
aws s3 sync build/web/ "s3://$WEBSITE_BUCKET/" --delete --region "$REGION" --only-show-errors \
    || fail "Could not upload the web interface"
INVALIDATION_ID="$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" \
    --paths '/*' --query Invalidation.Id --output text 2>/dev/null || true)"
if [ -n "$INVALIDATION_ID" ]; then
    info "CloudFront invalidation $INVALIDATION_ID created"
else
    warn "CloudFront invalidation failed; changes can take 5-15 minutes to appear"
fi
ok "Web interface deployed"

# Step 9: Verify
step "9. Verifying deployment..."
TABLE_STATUS="$(aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" \
    --query Table.TableStatus --output text 2>/dev/null || echo MISSING)"
info "DynamoDB status table $TABLE_NAME: $TABLE_STATUS"
ACTIVE=0; TOTAL=0
for fn in $(printf '%s,%s' "$PIPELINE_FUNCTIONS" "$(stack_output "$WEB_STACK_NAME" LambdaFunctionNames)" | tr ',' ' '); do
    TOTAL=$((TOTAL + 1))
    STATE="$(aws lambda get-function --function-name "$fn" --region "$REGION" \
        --query Configuration.State --output text 2>/dev/null || echo Unknown)"
    [ "$STATE" = "Active" ] && ACTIVE=$((ACTIVE + 1))
done
info "Lambda functions active: $ACTIVE/$TOTAL"

# Every API route must reject anonymous callers (Cognito authorizer -> 401).
ANONYMOUS_OK=true
for route in "/list-jobs" "/downloads" "/status?fileName=test.txt" "/download/final_responses/test.txt"; do
    CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$API_URL$route" || echo 000)"
    if [ "$CODE" = "401" ]; then
        ok "Anonymous GET $route -> 401 (authentication required)"
    else
        printf '%s   Anonymous GET %s -> %s (expected 401)%s\n' "$RED" "$route" "$CODE" "$RESET"
        ANONYMOUS_OK=false
    fi
done
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -X POST \
    -H 'Content-Type: application/json' -d '{}' "$API_URL/upload" || echo 000)"
if [ "$CODE" = "401" ]; then
    ok "Anonymous POST /upload -> 401 (authentication required)"
else
    printf '%s   Anonymous POST /upload -> %s (expected 401)%s\n' "$RED" "$CODE" "$RESET"
    ANONYMOUS_OK=false
fi
if [ "$ANONYMOUS_OK" != true ]; then
    fail "The API is not rejecting anonymous requests. Do not use this deployment."
fi

printf '\n%s========================================\n' "$GREEN"
printf '       DEPLOYMENT SUCCESSFUL\n'
printf '========================================%s\n\n' "$RESET"
printf '%sWeb app:%s        %s\n' "$BOLD" "$RESET" "$CLOUDFRONT_URL"
printf '%sJob status:%s     %s/status.html\n' "$BOLD" "$RESET" "$CLOUDFRONT_URL"
printf '%sDownloads:%s      %s/downloads.html\n' "$BOLD" "$RESET" "$CLOUDFRONT_URL"
printf '%sAPI:%s            %s\n' "$BOLD" "$RESET" "$API_URL"
printf '%sUpload bucket:%s  %s\n' "$BOLD" "$RESET" "$BUCKET_NAME"
printf '%sStatus table:%s   %s\n' "$BOLD" "$RESET" "$TABLE_NAME"
printf '%sUser pool:%s      %s\n\n' "$BOLD" "$RESET" "$USER_POOL_ID"
if [ -n "$ADMIN_EMAIL" ]; then
    echo "Cognito sent a temporary password to $ADMIN_EMAIL. Sign in at $CLOUDFRONT_URL."
else
    echo "Create a user to sign in (Cognito emails a temporary password):"
    echo "  aws cognito-idp admin-create-user --region $REGION --user-pool-id $USER_POOL_ID \\"
    echo "    --username you@example.com --user-attributes Name=email,Value=you@example.com Name=email_verified,Value=true"
fi
echo ""
echo "Reset demo data: scripts/cleanup.sh --data-only    Remove everything: scripts/cleanup.sh"
