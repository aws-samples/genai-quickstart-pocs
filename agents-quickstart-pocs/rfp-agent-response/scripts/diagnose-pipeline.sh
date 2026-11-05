#!/usr/bin/env bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Read-only health check of the RFP pipeline (macOS and Linux).
# Keep in sync with scripts/diagnose-pipeline.ps1 (Windows).
#
# Requires: AWS CLI v2, curl. Works with the bash 3.2 that ships with macOS.

set -euo pipefail
export AWS_PAGER=""

INFRA_STACK_NAME="terminal-upload"
WEB_STACK_NAME="rfp-web-app"
REGION="us-east-1"

usage() {
    cat <<'EOF'
Usage: scripts/diagnose-pipeline.sh [options]

Options:
  --infra-stack-name NAME   Processing stack name (default: terminal-upload)
  --web-stack-name NAME     Web stack name (default: rfp-web-app)
  --region REGION           AWS Region (default: us-east-1)
  -h, --help                Show this help
EOF
}

if [ -t 1 ]; then
    CYAN=$'\033[36m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; GRAY=$'\033[90m'; RESET=$'\033[0m'
else
    CYAN=""; GREEN=""; YELLOW=""; RED=""; GRAY=""; RESET=""
fi
step()  { printf '\n%s%s%s\n' "$YELLOW" "$*" "$RESET"; }
good()  { printf '%s   - %s%s\n' "$GREEN" "$*" "$RESET"; }
note()  { printf '%s   - %s%s\n' "$YELLOW" "$*" "$RESET"; }
bad()   { printf '%s   - %s%s\n' "$RED" "$*" "$RESET"; }
detail() { printf '%s     * %s%s\n' "$GRAY" "$*" "$RESET"; }

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
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
done

stack_output() {
    local value
    value="$(aws cloudformation describe-stacks --stack-name "$1" --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text 2>/dev/null || true)"
    if [ "$value" != "None" ]; then
        printf '%s' "$value"
    fi
}

printf '%s========================================\n' "$CYAN"
printf '  RFP Pipeline Diagnostics\n'
printf '========================================%s\n' "$RESET"

step "1. Getting infrastructure details..."
BUCKET_NAME="$(stack_output "$INFRA_STACK_NAME" BucketName)"
TABLE_NAME="$(stack_output "$INFRA_STACK_NAME" TableName)"
FUNCTIONS="$(stack_output "$INFRA_STACK_NAME" LambdaFunctionNames)"
if [ -z "$BUCKET_NAME" ] || [ -z "$FUNCTIONS" ]; then
    bad "Could not read stack '$INFRA_STACK_NAME' in $REGION. Deploy with scripts/deploy.sh first."
    exit 1
fi
good "Bucket: $BUCKET_NAME"
good "Status table: $TABLE_NAME"
for fn in $(printf '%s' "$FUNCTIONS" | tr ',' ' '); do
    good "Function: $fn"
done

step "2. Checking S3 bucket structure..."
for prefix in uploaded_rfp_requests formatted_questions completed_responses compliance_reviewed final_responses; do
    COUNT="$(aws s3api list-objects-v2 --bucket "$BUCKET_NAME" --region "$REGION" --prefix "$prefix/" \
        --query 'KeyCount' --output text 2>/dev/null || echo error)"
    if [ "$COUNT" = "error" ]; then
        bad "$prefix/: error checking"
    elif [ "$COUNT" = "0" ]; then
        note "$prefix/: empty"
    else
        good "$prefix/: $COUNT files"
        aws s3api list-objects-v2 --bucket "$BUCKET_NAME" --region "$REGION" --prefix "$prefix/" \
            --query 'reverse(sort_by(Contents, &LastModified))[:3].Key' --output text \
            | tr '\t' '\n' | while read -r key; do
                [ -n "$key" ] && detail "${key#"$prefix"/}"
            done
    fi
done

step "3. Checking S3 event notifications (defined in infrastructure/cloudformation.yaml)..."
TRIGGERS="$(aws s3api get-bucket-notification-configuration --bucket "$BUCKET_NAME" --region "$REGION" \
    --query 'LambdaFunctionConfigurations[].[LambdaFunctionArn, Filter.Key.FilterRules[?Name==`Prefix`].Value | [0], Filter.Key.FilterRules[?Name==`Suffix`].Value | [0]]' \
    --output text 2>/dev/null || true)"
if [ -z "$TRIGGERS" ] || [ "$TRIGGERS" = "None" ]; then
    NO_TRIGGERS=true
    bad "No Lambda triggers configured! Uploaded files will not be processed."
else
    NO_TRIGGERS=false
    good "Lambda triggers:"
    printf '%s\n' "$TRIGGERS" | while IFS="$(printf '\t')" read -r arn prefix suffix; do
        detail "${arn##*:}: ${prefix}*${suffix}"
    done
fi

step "4. Checking Lambda function status..."
for fn in $(printf '%s' "$FUNCTIONS" | tr ',' ' '); do
    STATE="$(aws lambda get-function-configuration --function-name "$fn" --region "$REGION" \
        --query '[State, LastModified]' --output text 2>/dev/null || echo "ERROR")"
    case "$STATE" in
        Active*) good "$fn: $STATE" ;;
        *) note "$fn: $STATE" ;;
    esac
done

step "5. Checking Lambda logs for errors in the last hour..."
START_MS="$(( $(date +%s) - 3600 ))000"
for fn in $(printf '%s' "$FUNCTIONS" | tr ',' ' '); do
    ERRORS="$(aws logs filter-log-events --log-group-name "/aws/lambda/$fn" --region "$REGION" \
        --start-time "$START_MS" --filter-pattern ERROR --max-items 50 \
        --query 'length(events)' --output text 2>/dev/null || echo none)"
    if [ "$ERRORS" = "none" ]; then
        note "$fn: no logs yet"
    elif [ "$ERRORS" = "0" ]; then
        good "$fn: no recent errors"
    else
        bad "$fn: $ERRORS recent errors"
        aws logs filter-log-events --log-group-name "/aws/lambda/$fn" --region "$REGION" \
            --start-time "$START_MS" --filter-pattern ERROR --max-items 2 \
            --query 'events[].message' --output text 2>/dev/null \
            | tr '\t' '\n' | cut -c1-160 | while read -r line; do
                [ -n "$line" ] && detail "$line"
            done
    fi
done

step "6. Checking DynamoDB status table..."
TABLE_STATUS="$(aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" \
    --query Table.TableStatus --output text 2>/dev/null || echo MISSING)"
if [ "$TABLE_STATUS" = "ACTIVE" ]; then
    good "Table status: ACTIVE"
    JOBS="$(aws dynamodb scan --table-name "$TABLE_NAME" --region "$REGION" --max-items 5 \
        --query 'Items[].[file_name.S, overall_status.S, current_stage.S]' --output text 2>/dev/null || true)"
    if [ -n "$JOBS" ] && [ "$JOBS" != "None" ]; then
        good "Recent processing jobs:"
        printf '%s\n' "$JOBS" | while IFS="$(printf '\t')" read -r name status stage; do
            detail "$name: $status (stage: $stage)"
        done
    else
        note "No processing jobs found"
    fi
else
    bad "Table status: $TABLE_STATUS"
fi

step "7. Checking API authentication..."
API_URL="$(stack_output "$WEB_STACK_NAME" ApiGatewayURL)"
if [ -z "$API_URL" ]; then
    note "Web stack '$WEB_STACK_NAME' not found"
else
    CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$API_URL/list-jobs" || echo 000)"
    if [ "$CODE" = "401" ]; then
        good "Anonymous GET /list-jobs -> 401 (authentication required)"
    else
        bad "Anonymous GET /list-jobs -> $CODE (expected 401)"
    fi
fi

printf '\n%s========================================\n' "$CYAN"
printf '  RECOMMENDATIONS\n'
printf '========================================%s\n' "$RESET"
if [ "$NO_TRIGGERS" = true ]; then
    printf '\n%sCRITICAL: No S3 event notifications are configured.%s\n' "$RED" "$RESET"
    echo "Redeploy the infrastructure stack to restore them:"
    echo "  scripts/deploy.sh --skip-packaging --knowledge-base-id <ID>"
fi
echo ""
echo "To test the pipeline:"
echo "  1. Sign in to the web app and upload a PDF or TXT file"
echo "  2. Watch the stages on the Job Status page or in s3://$BUCKET_NAME/"
echo "  3. Check the Lambda logs above (or in CloudWatch) for errors"
