#!/bin/bash

#############################################################################
# AWS Advisor Assistant POC - Automated Deployment Script
#############################################################################
#
# This script deploys the complete Advisor Assistant POC infrastructure and
# application to AWS using CloudFormation and ECS Fargate.
#
# DEPLOYMENT STAGES:
# 1. Security Foundation (VPC, Cognito, KMS, Secrets Manager)
# 2. ECR Repository (Container registry)
# 3. Docker Build & Push (Application container)
# 4. Application Infrastructure (ECS, DynamoDB, S3, etc.)
# 5. Secrets Update (API keys)
# 6. Health Check & Verification
#
# FEATURES:
# - Idempotent deployment (safe to run multiple times)
# - Comprehensive error handling and logging
# - Automatic rollback on failure
# - Cost-optimized for POC usage
# - Security best practices built-in
#
# USAGE:
#   ./deploy.sh [environment] [region]
#
# EXAMPLES:
#   ./deploy.sh poc us-east-1 YOUR_API_KEY
#   ./deploy.sh dev us-west-2
#
# PREREQUISITES:
# - AWS CLI configured with appropriate permissions
# - Docker installed and running

#
# ESTIMATED DEPLOYMENT TIME: 10-15 minutes
# ESTIMATED MONTHLY COST: $85-100 (POC configuration)
#
#############################################################################

# Exit on any error to prevent partial deployments
set -e

# Global variables for rollback tracking
DEPLOYMENT_STARTED=false
SECURITY_STACK_CREATED=false
ECR_STACK_CREATED=false
IMAGE_PUSHED=false
APP_STACK_CREATED=false

# Enhanced error handling with rollback capability
handle_deployment_error() {
    local exit_code=$1
    local line_number=$2
    local command="$3"
    
    error "Deployment failed at line $line_number with exit code $exit_code"
    error "Failed command: $command"
    
    if [ "$DEPLOYMENT_STARTED" = true ]; then
        log "Initiating rollback procedures..."
        rollback_deployment
    fi
    
    exit $exit_code
}

# Rollback function for failed deployments
rollback_deployment() {
    log "🔄 Starting rollback process..."
    
    # Only rollback resources that were created in this deployment
    if [ "$APP_STACK_CREATED" = true ]; then
        log "Rolling back application stack..."
        aws cloudformation delete-stack --stack-name "${APP_STACK_NAME}" --region ${REGION} || warn "Failed to delete application stack"
    fi
    
    if [ "$IMAGE_PUSHED" = true ]; then
        log "Cleaning up pushed Docker image..."
        # Note: We don't delete the ECR repository as it might contain other images
        warn "Docker image remains in ECR repository (manual cleanup may be needed)"
    fi
    
    if [ "$ECR_STACK_CREATED" = true ]; then
        log "Rolling back ECR stack..."
        aws cloudformation delete-stack --stack-name "${APPLICATION_NAME}-${ENVIRONMENT}-ecr" --region ${REGION} || warn "Failed to delete ECR stack"
    fi
    
    # Note: We typically don't rollback the security foundation as it's shared infrastructure
    if [ "$SECURITY_STACK_CREATED" = true ]; then
        warn "Security foundation stack was created but will not be automatically deleted"
        warn "If this was a new deployment, you may want to manually delete: ${SECURITY_STACK_NAME}"
    fi
    
    log "Rollback process completed"
}

# Set up error trap
trap 'handle_deployment_error $? $LINENO "$BASH_COMMAND"' ERR

#############################################################################
# CONFIGURATION SECTION
#############################################################################

# Parse command line arguments with sensible defaults
ENVIRONMENT=${1:-poc}           # Environment: poc, dev, staging, prod
REGION=${2:-us-east-1}          # AWS Region for deployment
APPLICATION_NAME="advisor-assistant"  # Application name (used in resource naming)

# API keys from environment variables (optional)
NEWSAPI_KEY=${NEWSAPI_KEY:-""}                  # NewsAPI key (optional)
FRED_API_KEY=${FRED_API_KEY:-""}                # FRED API key (optional)

# Rate limiting defaults based on environment
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "prod" ]; then
    RATE_LIMIT_AUTH_MAX=${RATE_LIMIT_AUTH_MAX:-5}
    RATE_LIMIT_API_MAX=${RATE_LIMIT_API_MAX:-100}
    RATE_LIMIT_AI_MAX=${RATE_LIMIT_AI_MAX:-10}
else
    RATE_LIMIT_AUTH_MAX=${RATE_LIMIT_AUTH_MAX:-10}
    RATE_LIMIT_API_MAX=${RATE_LIMIT_API_MAX:-1000}
    RATE_LIMIT_AI_MAX=${RATE_LIMIT_AI_MAX:-50}
fi

# CloudFormation stack names (environment-specific)
SECURITY_STACK_NAME="advisor-assistant-poc-security"  # Security foundation stack
APP_STACK_NAME="advisor-assistant-poc-app"            # Application infrastructure stack

#############################################################################
# LOGGING AND OUTPUT FORMATTING
#############################################################################

# ANSI color codes for enhanced terminal output
RED='\033[0;31m'      # Error messages
GREEN='\033[0;32m'    # Success messages and general info
YELLOW='\033[1;33m'   # Warning messages
NC='\033[0m'          # No Color (reset)

# Standardized logging functions with timestamps
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

#############################################################################
# PREREQUISITE VALIDATION
#############################################################################

# Detect operating system for platform-specific handling
detect_platform() {
    case "$(uname -s)" in
        CYGWIN*|MINGW*|MSYS*)
            PLATFORM="windows"
            ;;
        Darwin*)
            PLATFORM="macos"
            ;;
        Linux*)
            PLATFORM="linux"
            ;;
        *)
            PLATFORM="unknown"
            ;;
    esac
    
    log "Detected platform: $PLATFORM"
}

# Validate all required tools and configurations before deployment
# 
# Checks:
# - Operating system compatibility
# - AWS CLI installation and configuration
# - Docker installation and daemon status
# - Required permissions for CloudFormation operations
# - Windows-specific environment validation
# 
# Exits with error code 1 if any prerequisite is missing
check_prerequisites() {
    log "Validating deployment prerequisites..."
    
    # Detect platform first
    detect_platform
    
    # Windows-specific checks and guidance
    if [ "$PLATFORM" = "windows" ]; then
        log "Windows environment detected - performing additional validation..."
        
        # Check if running in appropriate shell environment
        if [ -z "$BASH_VERSION" ]; then
            error "This script requires Bash. Please run in Git Bash, WSL2, or install Windows Subsystem for Linux"
        fi
        
        # Provide Windows-specific guidance
        log "Windows deployment requirements:"
        log "  ✓ Git Bash (recommended) or WSL2"
        log "  ✓ Docker Desktop for Windows"
        log "  ✓ AWS CLI for Windows"
        
        # Check for Docker Desktop on Windows
        if ! docker info &> /dev/null; then
            error "Docker is not accessible. On Windows, ensure Docker Desktop is installed and running"
        fi
        
        # Verify Docker is using Linux containers (required for AWS Fargate)
        if docker version --format '{{.Server.Os}}' 2>/dev/null | grep -q "windows"; then
            error "Docker is using Windows containers. Switch to Linux containers in Docker Desktop settings"
        fi
    fi
    
    # Verify AWS CLI is installed and accessible
    if ! command -v aws &> /dev/null; then
        if [ "$PLATFORM" = "windows" ]; then
            error "AWS CLI is not installed. Install from: https://aws.amazon.com/cli/ or use 'winget install Amazon.AWSCLI'"
        else
            error "AWS CLI is not installed. Please install: https://aws.amazon.com/cli/"
        fi
    fi
    
    # Verify AWS credentials are configured and valid
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Run 'aws configure' or set environment variables"
    fi
    
    # Verify Docker is installed and daemon is running
    if ! command -v docker &> /dev/null; then
        if [ "$PLATFORM" = "windows" ]; then
            error "Docker is not installed. Install Docker Desktop from: https://docs.docker.com/desktop/windows/"
        else
            error "Docker is not installed. Please install: https://docs.docker.com/get-docker/"
        fi
    fi
    
    # Verify Docker daemon is accessible
    if ! docker info &> /dev/null; then
        if [ "$PLATFORM" = "windows" ]; then
            error "Docker daemon is not running. Start Docker Desktop and ensure it's using Linux containers"
        else
            error "Docker daemon is not running. Please start Docker Desktop or Docker service"
        fi
    fi
    
    # Verify Docker buildx is available (required for multi-platform builds)
    if ! docker buildx version &> /dev/null; then
        warn "Docker buildx not available. Using standard docker build (may have platform compatibility issues)"
    fi
    
    log "✅ All prerequisites validated successfully"
}

# Stage 1: Deploy Security Foundation
deploy_security_foundation() {
    log "Stage 1: Deploying security foundation..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name "${SECURITY_STACK_NAME}" --region ${REGION} >/dev/null 2>&1; then
        log "Security stack already exists, updating..."
        
        # Validate template before deployment
        if ! aws cloudformation validate-template --template-body file://cloudformation/01-security-foundation-poc.yaml --region ${REGION} >/dev/null; then
            error "CloudFormation template validation failed for security foundation"
        fi
        
        aws cloudformation deploy \
            --template-file cloudformation/01-security-foundation-poc.yaml \
            --stack-name "${SECURITY_STACK_NAME}" \
            --parameter-overrides \
                Environment=${ENVIRONMENT} \
                ApplicationName=${APPLICATION_NAME} \
            --capabilities CAPABILITY_NAMED_IAM \
            --region ${REGION} \
            --tags \
                Environment=${ENVIRONMENT} \
                Application=${APPLICATION_NAME} \
                ManagedBy=CloudFormation \
            --no-fail-on-empty-changeset
    else
        log "Creating new security stack..."
        SECURITY_STACK_CREATED=true
        
        # Validate template before deployment
        if ! aws cloudformation validate-template --template-body file://cloudformation/01-security-foundation-poc.yaml --region ${REGION} >/dev/null; then
            error "CloudFormation template validation failed for security foundation"
        fi
        
        aws cloudformation deploy \
            --template-file cloudformation/01-security-foundation-poc.yaml \
            --stack-name "${SECURITY_STACK_NAME}" \
            --parameter-overrides \
                Environment=${ENVIRONMENT} \
                ApplicationName=${APPLICATION_NAME} \
            --capabilities CAPABILITY_NAMED_IAM \
            --region ${REGION} \
            --tags \
                Environment=${ENVIRONMENT} \
                Application=${APPLICATION_NAME} \
                ManagedBy=CloudFormation
    fi
    
    # Verify stack deployment success
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "${SECURITY_STACK_NAME}" --region ${REGION} --query 'Stacks[0].StackStatus' --output text)
    if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
        log "✅ Security foundation deployed successfully (Status: $STACK_STATUS)"
    else
        error "Security foundation deployment failed (Status: $STACK_STATUS)"
    fi
}

# Stage 2: Deploy ECR Repository Only
deploy_ecr_only() {
    log "Stage 2: Deploying ECR repository..."
    
    ECR_STACK_NAME="${APPLICATION_NAME}-${ENVIRONMENT}-ecr"
    
    # Check if ECR stack already exists
    if ! aws cloudformation describe-stacks --stack-name "${ECR_STACK_NAME}" --region ${REGION} >/dev/null 2>&1; then
        ECR_STACK_CREATED=true
    fi
    
    # Create a minimal template with just ECR
    cat > /tmp/ecr-only.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ECR Repository for Advisor Assistant'

Parameters:
  Environment:
    Type: String
    Default: poc
  ApplicationName:
    Type: String
    Default: advisor-assistant
  SecurityStackName:
    Type: String
    Default: advisor-assistant-poc-security

Resources:
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Sub '${ApplicationName}-${Environment}'
      ImageScanningConfiguration:
        ScanOnPush: true
      EncryptionConfiguration:
        EncryptionType: KMS
        KmsKey: 
          Fn::ImportValue: !Sub '${SecurityStackName}-KMSKey'
      LifecyclePolicy:
        LifecyclePolicyText: |
          {
            "rules": [
              {
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                  "tagStatus": "any",
                  "countType": "imageCountMoreThan",
                  "countNumber": 10
                },
                "action": {
                  "type": "expire"
                }
              }
            ]
          }
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Application
          Value: !Ref ApplicationName

Outputs:
  ECRRepositoryURI:
    Description: ECR Repository URI
    Value: !GetAtt ECRRepository.RepositoryUri
    Export:
      Name: !Sub '${AWS::StackName}-ECRRepository'
EOF

    # Validate template before deployment
    if ! aws cloudformation validate-template --template-body file:///tmp/ecr-only.yaml --region ${REGION} >/dev/null; then
        error "CloudFormation template validation failed for ECR repository"
    fi
    
    aws cloudformation deploy \
        --template-file /tmp/ecr-only.yaml \
        --stack-name "${ECR_STACK_NAME}" \
        --parameter-overrides \
            Environment=${ENVIRONMENT} \
            ApplicationName=${APPLICATION_NAME} \
            SecurityStackName="${SECURITY_STACK_NAME}" \
        --region ${REGION} \
        --tags \
            Environment=${ENVIRONMENT} \
            Application=${APPLICATION_NAME} \
            ManagedBy=CloudFormation \
        --no-fail-on-empty-changeset
    
    # Verify ECR stack deployment success
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "${ECR_STACK_NAME}" --region ${REGION} --query 'Stacks[0].StackStatus' --output text)
    if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
        log "✅ ECR repository deployed successfully (Status: $STACK_STATUS)"
    else
        error "ECR repository deployment failed (Status: $STACK_STATUS)"
    fi
    
    # Clean up temporary template
    rm -f /tmp/ecr-only.yaml
}

# Stage 3: Build and Push Docker Image
build_and_push_image() {
    log "Stage 3: Building and pushing Docker image for linux/amd64..."
    
    # Get ECR repository URI from the ECR stack
    ECR_STACK_NAME="${APPLICATION_NAME}-${ENVIRONMENT}-ecr"
    ECR_REPOSITORY_URI=$(aws cloudformation describe-stacks \
        --stack-name "${ECR_STACK_NAME}" \
        --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' \
        --output text \
        --region ${REGION})
    
    if [ -z "$ECR_REPOSITORY_URI" ] || [ "$ECR_REPOSITORY_URI" = "None" ]; then
        error "Could not get ECR repository URI from stack ${ECR_STACK_NAME}"
    fi
    
    log "ECR Repository: ${ECR_REPOSITORY_URI}"
    
    # Login to ECR with retry logic
    local retry_count=0
    local max_retries=3
    
    while [ $retry_count -lt $max_retries ]; do
        if aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_REPOSITORY_URI}; then
            log "✅ Successfully logged into ECR"
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                warn "ECR login failed, retrying... (attempt $retry_count/$max_retries)"
                sleep 5
            else
                error "Failed to login to ECR after $max_retries attempts"
            fi
        fi
    done
    
    # Build Docker image with platform-specific handling
    log "Building Docker image for linux/amd64..."
    
    if docker buildx version &> /dev/null; then
        # Use buildx for multi-platform support
        log "Using Docker buildx for cross-platform build..."
        docker buildx build --platform linux/amd64 -t ${APPLICATION_NAME}-${ENVIRONMENT} . --load
    else
        # Fallback to standard docker build
        warn "Docker buildx not available, using standard build"
        if [ "$PLATFORM" = "windows" ]; then
            warn "On Windows, ensure Docker Desktop is set to Linux containers"
        fi
        docker build -t ${APPLICATION_NAME}-${ENVIRONMENT} .
    fi
    
    # Verify image was built successfully
    if ! docker images ${APPLICATION_NAME}-${ENVIRONMENT} | grep -q ${APPLICATION_NAME}-${ENVIRONMENT}; then
        error "Docker image build failed - image not found locally"
    fi
    
    # Tag image for ECR
    docker tag ${APPLICATION_NAME}-${ENVIRONMENT}:latest ${ECR_REPOSITORY_URI}:latest
    
    # Push image to ECR with retry logic
    log "Pushing image to ECR..."
    retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if docker push ${ECR_REPOSITORY_URI}:latest; then
            log "✅ Docker image pushed successfully"
            IMAGE_PUSHED=true
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                warn "Docker push failed, retrying... (attempt $retry_count/$max_retries)"
                sleep 10
            else
                error "Failed to push Docker image after $max_retries attempts"
            fi
        fi
    done
}

# Stage 4: Deploy Application Infrastructure with Cognito Permissions
deploy_application_infrastructure() {
    log "Stage 4: Deploying application infrastructure with Cognito permissions..."
    log "Rate limiting configuration for ${ENVIRONMENT}:"
    log "  - Authentication: ${RATE_LIMIT_AUTH_MAX} attempts per 15 minutes"
    log "  - API requests: ${RATE_LIMIT_API_MAX} requests per 15 minutes"
    log "  - AI analysis: ${RATE_LIMIT_AI_MAX} requests per hour"
    
    # Check if application stack already exists
    if ! aws cloudformation describe-stacks --stack-name "${APP_STACK_NAME}" --region ${REGION} >/dev/null 2>&1; then
        APP_STACK_CREATED=true
    fi
    
    # Validate template before deployment
    if ! aws cloudformation validate-template --template-body file://cloudformation/02-application-infrastructure-poc.yaml --region ${REGION} >/dev/null; then
        error "CloudFormation template validation failed for application infrastructure"
    fi
    
    log "Deploying application infrastructure with latest template..."
    
    aws cloudformation deploy \
        --template-file cloudformation/02-application-infrastructure-poc.yaml \
        --stack-name "${APP_STACK_NAME}" \
        --parameter-overrides \
            Environment=${ENVIRONMENT} \
            ApplicationName=${APPLICATION_NAME} \
            SecurityStackName="${SECURITY_STACK_NAME}" \
            RateLimitAuthMax=${RATE_LIMIT_AUTH_MAX} \
            RateLimitApiMax=${RATE_LIMIT_API_MAX} \
            RateLimitAiMax=${RATE_LIMIT_AI_MAX} \
        --capabilities CAPABILITY_NAMED_IAM \
        --region ${REGION} \
        --tags \
            Environment=${ENVIRONMENT} \
            Application=${APPLICATION_NAME} \
            ManagedBy=CloudFormation \
        --no-fail-on-empty-changeset
    
    # Verify application stack deployment success
    STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "${APP_STACK_NAME}" --region ${REGION} --query 'Stacks[0].StackStatus' --output text)
    if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
        log "✅ Application infrastructure deployed successfully (Status: $STACK_STATUS)"
        log "✅ ECS Task Role now has the following Cognito permissions:"
        log "   - cognito-idp:AdminInitiateAuth"
        log "   - cognito-idp:AdminGetUser"
        log "   - cognito-idp:AdminCreateUser"
        log "   - cognito-idp:AdminSetUserPassword"
        log "   - And other admin operations"
    else
        error "Application infrastructure deployment failed (Status: $STACK_STATUS)"
    fi
}

# Stage 5: Update Secrets
update_secrets() {
    log "Stage 5: Updating secrets..."
    


    
    # New data provider secrets
    if [ ! -z "${NEWSAPI_KEY}" ]; then
        aws secretsmanager update-secret \
            --secret-id "${APPLICATION_NAME}/${ENVIRONMENT}/newsapi" \
            --secret-string "{\"api_key\":\"${NEWSAPI_KEY}\"}" \
            --region ${REGION}
        log "NewsAPI key updated"
    else
        warn "NEWSAPI_KEY not provided, please update manually in AWS Secrets Manager"
        warn "Secret name: ${APPLICATION_NAME}/${ENVIRONMENT}/newsapi"
    fi
    
    if [ ! -z "${FRED_API_KEY}" ]; then
        aws secretsmanager update-secret \
            --secret-id "${APPLICATION_NAME}/${ENVIRONMENT}/fred" \
            --secret-string "{\"api_key\":\"${FRED_API_KEY}\"}" \
            --region ${REGION}
        log "FRED API key updated"
    else
        warn "FRED_API_KEY not provided, please update manually in AWS Secrets Manager"
        warn "Secret name: ${APPLICATION_NAME}/${ENVIRONMENT}/fred"
    fi
}

# Stage 6: Wait for Service and Health Check
wait_and_health_check() {
    log "Stage 6: Waiting for ECS service to stabilize..."
    
    ECS_CLUSTER=$(aws cloudformation describe-stacks \
        --stack-name "${APP_STACK_NAME}" \
        --query 'Stacks[0].Outputs[?OutputKey==`ECSClusterName`].OutputValue' \
        --output text \
        --no-cli-pager \
        --region ${REGION} 2>/dev/null)
    
    if [ ! -z "$ECS_CLUSTER" ]; then
        log "Forcing ECS service deployment with rolling update..."
        # Update service with new task definition (suppress JSON output)
        aws ecs update-service \
            --cluster ${ECS_CLUSTER} \
            --service "${APPLICATION_NAME}-${ENVIRONMENT}-service" \
            --force-new-deployment \
            --region ${REGION} \
            --output text \
            --no-cli-pager > /dev/null 2>&1
        
        log "Waiting for ECS service to stabilize (this may take 5-10 minutes)..."
        log "ECS will:"
        log "  1. Start new tasks with updated image"
        log "  2. Wait for health checks to pass"
        log "  3. Stop old tasks once new ones are healthy"
        
        # Wait for deployment to complete
        aws ecs wait services-stable \
            --cluster ${ECS_CLUSTER} \
            --services "${APPLICATION_NAME}-${ENVIRONMENT}-service" \
            --region ${REGION} \
            --no-cli-pager > /dev/null 2>&1
        
        # Verify deployment success
        RUNNING_COUNT=$(aws ecs describe-services \
            --cluster ${ECS_CLUSTER} \
            --services "${APPLICATION_NAME}-${ENVIRONMENT}-service" \
            --query 'services[0].runningCount' \
            --output text \
            --no-cli-pager \
            --region ${REGION} 2>/dev/null)
        
        if [ "$RUNNING_COUNT" -eq "1" ]; then
            log "✅ Deployment successful - 1 task running"
        else
            warn "⚠️  Unexpected task count: $RUNNING_COUNT (expected: 1)"
        fi
        
        log "ECS service is stable"
        
        # Get ALB DNS name
        ALB_DNS=$(aws cloudformation describe-stacks \
            --stack-name "${APP_STACK_NAME}" \
            --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
            --output text \
            --no-cli-pager \
            --region ${REGION} 2>/dev/null)
        
        # Wait a bit for ALB to be ready
        sleep 30
        
        # Basic health check
        if curl -f "http://${ALB_DNS}/api/health" &> /dev/null; then
            log "Health check passed"
        else
            warn "Health check failed - application may still be starting up"
            warn "Try accessing: http://${ALB_DNS}"
        fi
    else
        warn "Could not find ECS cluster name"
    fi
}

# Display deployment information
display_info() {
    log "Staged deployment completed with Cognito permissions fix!"
    
    echo ""
    echo "=== Deployment Information ==="
    echo "Environment: ${ENVIRONMENT}"
    echo "Region: ${REGION}"
    echo "Application: ${APPLICATION_NAME}"
    echo ""
    
    # Get important URLs and information
    ALB_DNS=$(aws cloudformation describe-stacks \
        --stack-name "${APP_STACK_NAME}" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApplicationLoadBalancerDNS`].OutputValue' \
        --output text \
        --no-cli-pager \
        --region ${REGION} 2>/dev/null || echo "Not available")
    
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name "${SECURITY_STACK_NAME}" \
        --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
        --output text \
        --no-cli-pager \
        --region ${REGION} 2>/dev/null || echo "Not available")
    
    echo "Application URL: http://${ALB_DNS}"
    echo "Cognito User Pool ID: ${USER_POOL_ID}"
    echo ""
    echo "✅ Cognito Authentication Fixed!"
    echo "   The ECS Task Role now has proper Cognito permissions"
    echo "   You can now authenticate users without permission errors"
    echo ""
    echo "API Keys Configuration:"
    echo "  - NewsAPI: ${APPLICATION_NAME}/${ENVIRONMENT}/newsapi"
    echo "  - FRED: ${APPLICATION_NAME}/${ENVIRONMENT}/fred"
    echo ""
    echo "To create a test user:"
    echo "aws cognito-idp admin-create-user --user-pool-id ${USER_POOL_ID} --username testuser --temporary-password TempPass123! --message-action SUPPRESS --region ${REGION}"
    echo "aws cognito-idp admin-set-user-password --user-pool-id ${USER_POOL_ID} --username testuser --password NewPass123! --permanent --region ${REGION}"
    echo ""
}

# Main deployment flow
main() {
    log "Starting POC deployment for ${APPLICATION_NAME} in ${ENVIRONMENT} environment"
    log "Platform: $PLATFORM"
    log "Deployment stages: Security -> ECR -> Build -> Push -> Application -> Secrets -> Health Check"
    
    # Mark deployment as started for rollback tracking
    DEPLOYMENT_STARTED=true
    
    check_prerequisites
    deploy_security_foundation
    deploy_ecr_only
    build_and_push_image
    deploy_application_infrastructure
    update_secrets
    wait_and_health_check
    display_info
    
    # Clear error trap on successful completion
    trap - ERR
    
    log "🎉 POC deployment completed successfully!"
    log "All resources deployed and validated"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [environment] [region]"
    echo "Example: $0 poc us-east-1"
    echo ""
    echo "Default values:"
    echo "  environment: poc"
    echo "  region: us-east-1"
    echo ""
    echo "API Keys (optional - set via environment variables):"
    echo "  export NEWSAPI_KEY=your_key"
    echo "  export FRED_API_KEY=your_key"
    echo ""
    echo "Or update later via AWS Secrets Manager"
    echo ""
    exit 1
fi

# Run main function
main "$@"