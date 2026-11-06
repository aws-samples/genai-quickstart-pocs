#!/usr/bin/env bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# Removes the RFP Processing System, or with --data-only resets its demo data
# (macOS and Linux). Keep in sync with scripts/cleanup.ps1 (Windows).
#
# Requires: AWS CLI v2. Works with the bash 3.2 that ships with macOS.

set -euo pipefail
export AWS_PAGER=""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INFRA_STACK_NAME="terminal-upload"
WEB_STACK_NAME="rfp-web-app"
REGION="us-east-1"
DATA_ONLY=false
FORCE=false

usage() {
    cat <<'EOF'
Usage: scripts/cleanup.sh [options]

Options:
  --infra-stack-name NAME   Processing stack name (default: terminal-upload)
  --web-stack-name NAME     Web stack name (default: rfp-web-app)
  --region REGION           AWS Region (default: us-east-1)
  --data-only               Delete every uploaded file, pipeline output and
                            status record, but keep the stacks deployed
  --force                   Skip the confirmation prompt
  -h, --help                Show this help
EOF
}

if [ -t 1 ]; then
    GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; GRAY=$'\033[90m'; RESET=$'\033[0m'
else
    GREEN=""; YELLOW=""; RED=""; GRAY=""; RESET=""
fi
step() { printf '\n%s%s%s\n' "$YELLOW" "$*" "$RESET"; }
info() { printf '%s   - %s%s\n' "$GRAY" "$*" "$RESET"; }
ok()   { printf '%s   %s%s\n' "$GREEN" "$*" "$RESET"; }
fail() { printf '%sERROR: %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

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
        --data-only) DATA_ONLY=true; shift ;;
        --force) FORCE=true; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
    esac
done

command -v aws >/dev/null 2>&1 || fail "The AWS CLI is required but was not found"

# Prints an output value, or nothing if the stack or output does not exist.
stack_output() {
    local value
    value="$(aws cloudformation describe-stacks --stack-name "$1" --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='$2'].OutputValue" --output text 2>/dev/null || true)"
    if [ "$value" != "None" ]; then
        printf '%s' "$value"
    fi
}

stack_exists() {
    aws cloudformation describe-stacks --stack-name "$1" --region "$REGION" >/dev/null 2>&1
}

# Delete every object version and delete marker in a bucket, in batches.
clear_bucket() {
    local bucket="$1" batch
    [ -n "$bucket" ] || return 0
    info "Emptying s3://$bucket"
    batch="$(mktemp)"
    while true; do
        aws s3api list-object-versions --bucket "$bucket" --region "$REGION" --max-items 500 \
            --query '{Objects: [Versions, DeleteMarkers][][].{Key: Key, VersionId: VersionId}, Quiet: `true`}' \
            --output json > "$batch"
        if grep -Eq '"Objects": (null|\[\])' "$batch"; then
            break
        fi
        aws s3api delete-objects --bucket "$bucket" --region "$REGION" \
            --delete "file://$batch" >/dev/null
    done
    rm -f "$batch"
}

# Delete every item from the status table.
clear_status_table() {
    local table="$1" count=0 key file_name
    [ -n "$table" ] || return 0
    info "Deleting status records from $table"
    key="$(mktemp)"
    for file_name in $(aws dynamodb scan --table-name "$table" --region "$REGION" \
            --projection-expression file_name --query 'Items[].file_name.S' --output text); do
        [ "$file_name" = "None" ] && continue
        # Stored file names only contain [A-Za-z0-9._-], so no JSON escaping is needed.
        printf '{"file_name": {"S": "%s"}}' "$file_name" > "$key"
        aws dynamodb delete-item --table-name "$table" --region "$REGION" --key "file://$key"
        count=$((count + 1))
    done
    rm -f "$key"
    info "Deleted $count status records"
}

if [ "$DATA_ONLY" = true ]; then MODE="DEMO DATA RESET"; else MODE="CLEANUP"; fi
printf '%s========================================\n' "$RED"
printf '  RFP Processing System - %s\n' "$MODE"
printf '========================================%s\n\n' "$RESET"
echo "Region:               $REGION"
echo "Infrastructure stack: $INFRA_STACK_NAME"
[ "$DATA_ONLY" = true ] || echo "Web stack:            $WEB_STACK_NAME"
echo ""

if [ "$FORCE" != true ]; then
    if [ "$DATA_ONLY" = true ]; then
        printf '%sWARNING: This deletes every uploaded RFP, pipeline output and status record.%s\n' "$YELLOW" "$RESET"
        EXPECTED="RESET"
    else
        printf '%sWARNING: This deletes ALL resources, including:\n' "$YELLOW"
        echo "  - All S3 buckets and their contents"
        echo "  - All Lambda functions"
        echo "  - The DynamoDB status table"
        echo "  - The Cognito user pool and its users"
        printf '  - The CloudFront distribution and API Gateway%s\n' "$RESET"
        EXPECTED="DELETE"
    fi
    [ -t 0 ] || fail "Not running interactively; pass --force to confirm"
    read -r -p "Type '$EXPECTED' to confirm: " CONFIRMATION
    if [ "$CONFIRMATION" != "$EXPECTED" ]; then
        printf '%sCancelled.%s\n' "$GREEN" "$RESET"
        exit 0
    fi
fi

step "1. Gathering resource information..."
UPLOAD_BUCKET="$(stack_output "$INFRA_STACK_NAME" BucketName)"
DEPLOY_BUCKET="$(stack_output "$INFRA_STACK_NAME" DeploymentBucket)"
TABLE_NAME="$(stack_output "$INFRA_STACK_NAME" TableName)"
WEBSITE_BUCKET="$(stack_output "$WEB_STACK_NAME" WebsiteBucket)"
info "Upload bucket:     $UPLOAD_BUCKET"
info "Status table:      $TABLE_NAME"
if [ "$DATA_ONLY" != true ]; then
    info "Deployment bucket: $DEPLOY_BUCKET"
    info "Website bucket:    $WEBSITE_BUCKET"
fi

if [ "$DATA_ONLY" = true ]; then
    if [ -z "$UPLOAD_BUCKET" ] || [ -z "$TABLE_NAME" ]; then
        fail "Stack '$INFRA_STACK_NAME' was not found in $REGION."
    fi
    step "2. Deleting demo data..."
    clear_bucket "$UPLOAD_BUCKET"
    clear_status_table "$TABLE_NAME"
    echo ""
    ok "Demo data reset complete. The stacks are still deployed."
    exit 0
fi

step "2. Emptying S3 buckets..."
clear_bucket "$UPLOAD_BUCKET"
clear_bucket "$DEPLOY_BUCKET"
clear_bucket "$WEBSITE_BUCKET"

# The web stack imports values from the infrastructure stack, so delete it first.
STEP=3
for STACK in "$WEB_STACK_NAME" "$INFRA_STACK_NAME"; do
    step "$STEP. Deleting stack $STACK..."
    if stack_exists "$STACK"; then
        aws cloudformation delete-stack --stack-name "$STACK" --region "$REGION"
        if aws cloudformation wait stack-delete-complete --stack-name "$STACK" --region "$REGION"; then
            ok "Stack $STACK deleted"
        else
            printf '%s   Stack %s deletion failed or timed out; check the CloudFormation console%s\n' \
                "$YELLOW" "$STACK" "$RESET"
        fi
    else
        info "Stack not found or already deleted"
    fi
    STEP=$((STEP + 1))
done

step "$STEP. Cleaning up local build files..."
if [ -d "$PROJECT_ROOT/build" ]; then
    rm -rf "$PROJECT_ROOT/build"
    info "Removed build/"
fi

printf '\n%s========================================\n' "$GREEN"
printf '         CLEANUP COMPLETED\n'
printf '========================================%s\n' "$RESET"
echo "Lambda log groups (/aws/lambda/...) are kept; delete them in CloudWatch if you no longer need them."
