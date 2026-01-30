#!/bin/bash
set -e

STACK_NAME=${1:-bankiq}
REGION=${AWS_DEFAULT_REGION:-${2:-$(aws configure get region 2>/dev/null || echo "us-east-1")}}

echo "=========================================="
echo "Deploy Backend (CodeBuild Version)"
echo "=========================================="

# Get agent ARN from YAML file (AWS pattern)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="${SCRIPT_DIR}/../../backend"
YAML_FILE="$BACKEND_DIR/.bedrock_agentcore.yaml"

if [ ! -f "$YAML_FILE" ]; then
    echo "ERROR: Agent config not found: $YAML_FILE"
    echo "Run phase2-agent.sh first."
    exit 1
fi

# Extract agent ARN from YAML
AGENT_ARN=$(grep "agent_arn:" "$YAML_FILE" | sed 's/.*agent_arn: *\(.*\)/\1/')

if [ -z "$AGENT_ARN" ]; then
    echo "ERROR: No agent_arn found in $YAML_FILE"
    exit 1
fi

echo "✅ Agent ARN from config: $AGENT_ARN"

# Get infrastructure outputs
BACKEND_ECR=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`BackendECRRepositoryUri`].OutputValue' --output text)
echo "Backend ECR: $BACKEND_ECR"

# Create CodeBuild project for backend
echo "🚀 Creating CodeBuild project for backend..."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create CodeBuild project via CloudFormation
# Use portable temp directory (Windows Git Bash compatible)
TEMP_DIR="temp"
mkdir -p "$TEMP_DIR"

# Use relative path for Windows compatibility
cat > "$TEMP_DIR/backend-codebuild.yaml" << EOF
AWSTemplateFormatVersion: '2010-09-09'
Description: 'CodeBuild project for BankIQ+ Backend'

Parameters:
  ProjectName:
    Type: String
    Default: ${STACK_NAME}
  
Resources:
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "\${ProjectName}-backend-cb-role-\${AWS::AccountId}"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:\${AWS::Region}:\${AWS::AccountId}:log-group:/aws/codebuild/*"
              - Effect: Allow
                Action:
                  - ecr:BatchCheckLayerAvailability
                  - ecr:GetDownloadUrlForLayer
                  - ecr:BatchGetImage
                  - ecr:GetAuthorizationToken
                  - ecr:PutImage
                  - ecr:InitiateLayerUpload
                  - ecr:UploadLayerPart
                  - ecr:CompleteLayerUpload
                Resource: "*"
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: "*"

  BackendCodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub "\${ProjectName}-backend-cb-\${AWS::AccountId}"
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: NO_ARTIFACTS
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:5.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: IMAGE_REPO_NAME
            Value: ${STACK_NAME}-backend-prod
          - Name: IMAGE_TAG
            Value: latest
      Source:
        Type: NO_SOURCE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region \$AWS_DEFAULT_REGION | docker login --username AWS --password-stdin \$AWS_ACCOUNT_ID.dkr.ecr.\$AWS_DEFAULT_REGION.amazonaws.com
            build:
              commands:
                - echo Build started on \`date\`
                - echo Building the Docker image...
                - docker build -f Dockerfile.backend -t \$IMAGE_REPO_NAME:\$IMAGE_TAG .
                - docker tag \$IMAGE_REPO_NAME:\$IMAGE_TAG \$AWS_ACCOUNT_ID.dkr.ecr.\$AWS_DEFAULT_REGION.amazonaws.com/\$IMAGE_REPO_NAME:\$IMAGE_TAG
            post_build:
              commands:
                - echo Build completed on \`date\`
                - echo Pushing the Docker image...
                - docker push \$AWS_ACCOUNT_ID.dkr.ecr.\$AWS_DEFAULT_REGION.amazonaws.com/\$IMAGE_REPO_NAME:\$IMAGE_TAG

Outputs:
  CodeBuildProject:
    Description: CodeBuild project name
    Value: !Ref BackendCodeBuildProject
EOF

# Check if CodeBuild stack exists
if aws cloudformation describe-stacks --stack-name ${STACK_NAME}-backend-codebuild --region $REGION >/dev/null 2>&1; then
  echo "📋 CodeBuild stack exists, updating..."
  aws cloudformation update-stack \
    --stack-name ${STACK_NAME}-backend-codebuild \
    --template-body file://"$TEMP_DIR/backend-codebuild.yaml" \
    --parameters ParameterKey=ProjectName,ParameterValue=$STACK_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION
  
  echo "⏳ Waiting for CodeBuild project update..."
  aws cloudformation wait stack-update-complete --stack-name ${STACK_NAME}-backend-codebuild --region $REGION
else
  echo "📋 Creating new CodeBuild stack..."
  aws cloudformation create-stack \
    --stack-name ${STACK_NAME}-backend-codebuild \
    --template-body file://"$TEMP_DIR/backend-codebuild.yaml" \
    --parameters ParameterKey=ProjectName,ParameterValue=$STACK_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION
  
  echo "⏳ Waiting for CodeBuild project creation..."
  aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME}-backend-codebuild --region $REGION
fi

# Upload source to S3
echo "📦 Uploading backend source to S3..."
cd "${SCRIPT_DIR}/../../backend"

# Ensure temp directory exists
mkdir -p "$TEMP_DIR"

# Create source zip
zip -r "$TEMP_DIR/backend-source.zip" . -x "*.git*" "node_modules/*" ".bedrock_agentcore.yaml"

# Upload to S3 (use existing bucket from infrastructure)
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text)
aws s3 cp "$TEMP_DIR/backend-source.zip" s3://$S3_BUCKET/backend-source.zip

# Start CodeBuild
echo "🚀 Starting CodeBuild..."
# Get the actual CodeBuild project name from the stack
CODEBUILD_PROJECT=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-backend-codebuild --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`CodeBuildProject`].OutputValue' --output text)

BUILD_ID=$(aws codebuild start-build \
  --project-name $CODEBUILD_PROJECT \
  --source-type-override S3 \
  --source-location-override $S3_BUCKET/backend-source.zip \
  --query 'build.id' --output text)

echo "📋 CodeBuild started: $BUILD_ID"
echo "⏳ Waiting for build to complete..."

# Wait for build to complete
aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text
while [ "$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text)" = "IN_PROGRESS" ]; do
  echo "Building..."
  sleep 30
done

BUILD_STATUS=$(aws codebuild batch-get-builds --ids $BUILD_ID --query 'builds[0].buildStatus' --output text)
if [ "$BUILD_STATUS" != "SUCCEEDED" ]; then
  echo "❌ CodeBuild failed: $BUILD_STATUS"
  exit 1
fi

echo "✅ Backend image built and pushed via CodeBuild"

# Deploy backend stack (same as original)
echo "🚀 Deploying backend stack..."
# Go to project root directory for Windows compatibility
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$PROJECT_ROOT"
# Get VPC and subnet info from infrastructure stack
VPC_ID=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text)
SUBNET_IDS=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`SubnetIds`].OutputValue' --output text)
# Clean up any extra whitespace
SUBNET_IDS=$(echo "$SUBNET_IDS" | xargs)
echo "DEBUG: VPC_ID=$VPC_ID"
echo "DEBUG: SUBNET_IDS=$SUBNET_IDS"

# Create parameters JSON to avoid CLI parsing issues (Windows compatible)
mkdir -p temp
cat > temp/backend-params.json << EOF
[
  {"ParameterKey": "ProjectName", "ParameterValue": "$STACK_NAME"},
  {"ParameterKey": "Environment", "ParameterValue": "prod"},
  {"ParameterKey": "PrerequisitesStackName", "ParameterValue": "${STACK_NAME}-infra"},
  {"ParameterKey": "AgentArn", "ParameterValue": "$AGENT_ARN"},
  {"ParameterKey": "VpcId", "ParameterValue": "$VPC_ID"},
  {"ParameterKey": "SubnetIds", "ParameterValue": "$SUBNET_IDS"},
  {"ParameterKey": "BackendImageTag", "ParameterValue": "latest"}
]
EOF

aws cloudformation create-stack \
  --stack-name ${STACK_NAME}-backend \
  --template-body file://cfn/templates/backend.yaml \
  --parameters file://temp/backend-params.json \
  --capabilities CAPABILITY_IAM \
  --region $REGION

echo "⏳ Waiting for backend deployment (7-10 minutes)..."
aws cloudformation wait stack-create-complete --stack-name ${STACK_NAME}-backend --region $REGION

# Get backend URL and save for frontend
ALB_URL=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-backend --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`ALBUrl`].OutputValue' --output text)
BACKEND_URL="$ALB_URL"
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name ${STACK_NAME}-infra --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' --output text)

# Save for frontend phase
echo "$ALB_URL" > /tmp/alb_url.txt
echo "$FRONTEND_BUCKET" > /tmp/frontend_bucket.txt

echo ""
echo "✅ PHASE 3 COMPLETE"
echo "Backend URL: $BACKEND_URL"
echo "ALB URL: $ALB_URL"
echo ""
echo "Next: Run phase4-frontend.sh"

# Cleanup temp directory
rm -rf "$TEMP_DIR"