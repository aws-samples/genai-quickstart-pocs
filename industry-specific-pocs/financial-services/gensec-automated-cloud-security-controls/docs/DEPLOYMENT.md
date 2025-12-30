# Deployment Guide

## Prerequisites

### Required Software
- **AWS Account** with appropriate permissions
- **Node.js** ≥ 14.x (for AWS CDK)
- **Python** 3.9 (for Lambda functions)
- **AWS CDK CLI** installed globally
- **AWS CLI** configured with credentials

### AWS Permissions Required
- IAM permissions to create roles and policies
- Lambda function creation and management
- DynamoDB table creation
- S3 bucket creation and management
- Step Functions state machine creation
- CloudWatch Logs access
- Bedrock model access

## Pre-Deployment Steps

### 1. Build Lambda Layers

**Important:** Lambda layers must be built before deployment.

```bash
# Navigate to layers directory
cd layers

# Build all layers
./build-all-layers.sh

# This creates:
# - bedrock-layer
# - common-layer (includes service_name_resolver)
# - dynamodb-operations-layer
# - mcp-tools-layer
# - requests-layer
# - validation-layer
# - web-scraping-layer (includes content_processor)
```

### 2. Install CDK Dependencies

```bash
# Navigate to CDK directory
cd cdk

# Install Node.js dependencies
npm install

# Build TypeScript
npm run build
```

## Deployment

### 1. Bootstrap CDK (First Time Only)

```bash
# Bootstrap CDK in your AWS account and region
cdk bootstrap

# This creates the CDK toolkit stack for deployments
```

### 2. Deploy Infrastructure

```bash
# Deploy to default region (us-east-1)
cdk deploy

# Deploy to specific region
cdk deploy --region us-west-2

# Deploy with approval prompts
cdk deploy --require-approval never
```

### 3. Upload Configuration Files

```bash
# Set environment variables
export ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export REGION=us-east-1  # or your deployment region

# Upload service mappings (required for documentation collection)
# Contains pre-curated core CloudFormation resources for 26 AWS services
aws s3 cp config-example/service-mappings.json \
  s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/configuration/
```

## Post-Deployment Verification

### 1. Verify Stack Creation

```bash
# List CloudFormation stacks
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE \
  --query 'StackSummaries[?StackName==`SecuritySystemStack`]'

# Describe stack resources
aws cloudformation describe-stack-resources \
  --stack-name SecuritySystemStack
```

### 2. Verify Lambda Functions

```bash
# List Lambda functions
aws lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `gensec-`)].[FunctionName,Runtime,MemorySize]' \
  --output table

# Expected functions:
# - gensec-SecurityProfileProcessor
# - gensec-AWSServiceDocumentationManager
# - gensec-AnalyzeSecurityRequirements
# - gensec-GenerateSecurityControls
# - gensec-GenerateIaCTemplate
# - gensec-GenerateIAMModel
# - gensec-GenerateServiceProfile
```

### 3. Verify DynamoDB Tables

```bash
# List DynamoDB tables
aws dynamodb list-tables \
  --query 'TableNames[?starts_with(@, `gensec-`)]' \
  --output table

# Expected tables:
# - gensec-SecurityControlLibrary
# - gensec-ServiceRequestTracking
# - gensec-AWSServiceActions
# - gensec-AWSServiceParameters
# - gensec-AWSServiceInventory
# - gensec-AWSServiceResources
# - gensec-SecurityStandardsLibrary
# - gensec-ServiceProfileLibrary
# - gensec-AWSConfigManagedRules
```

### 4. Verify S3 Buckets

```bash
# List S3 buckets
aws s3 ls | grep gensec

# Expected buckets:
# - gensec-security-input-profiles-${ACCOUNT}-${REGION}
# - gensec-security-config-outputs-${ACCOUNT}-${REGION}
```

### 5. Verify Step Functions

```bash
# List state machines
aws stepfunctions list-state-machines \
  --query 'stateMachines[?name==`gensec-SecurityConfigWorkflow`]'
```

## Testing the Deployment

### 1. Upload Test Security Profile

```bash
# Upload test security profile
aws s3 cp security-profile.json \
  s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/security-profile/

# This triggers the SecurityProfileProcessor Lambda
```

### 2. Monitor Execution

```bash
# List Step Functions executions
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:${REGION}:${ACCOUNT}:stateMachine:gensec-SecurityConfigWorkflow \
  --max-results 10

# Get execution details
aws stepfunctions describe-execution \
  --execution-arn <execution-arn>
```

### 3. Check Results

```bash
# List output files
aws s3 ls s3://gensec-security-config-outputs-${ACCOUNT}-${REGION}/ --recursive

# Download outputs locally
./scripts/download_outputs.py

# Validate outputs for a service
cd scripts/output-validation
./validate_service.sh ACM
```

## Configuration Updates

### Update Service Mappings

```bash
# Regenerate service mappings with latest AWS services
cd scripts/service-mapping
python3 extract_service_mappings.py

# Upload updated mappings
aws s3 cp ../../scripts/aws_service_mappings.json \
  s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/configuration/service-mappings.json
```

### Load AWS Config Rules

```bash
# Load AWS Config managed rules into DynamoDB
cd scripts/config-rules
python3 load_config_rules.py
```

## Troubleshooting

### Lambda Function Errors

```bash
# View Lambda logs
aws logs tail /aws/lambda/gensec-AWSServiceDocumentationManager --follow

# Check Lambda function configuration
aws lambda get-function --function-name gensec-AWSServiceDocumentationManager
```

### Step Functions Failures

```bash
# Get failed executions
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:${REGION}:${ACCOUNT}:stateMachine:gensec-SecurityConfigWorkflow \
  --status-filter FAILED

# Get execution history
aws stepfunctions get-execution-history \
  --execution-arn <execution-arn>
```

### DynamoDB Issues

```bash
# Check table status
aws dynamodb describe-table --table-name gensec-SecurityControlLibrary

# Scan table for data
aws dynamodb scan --table-name gensec-SecurityControlLibrary --max-items 10
```

### S3 Access Issues

```bash
# Check bucket policy
aws s3api get-bucket-policy \
  --bucket gensec-security-input-profiles-${ACCOUNT}-${REGION}

# Check bucket versioning
aws s3api get-bucket-versioning \
  --bucket gensec-security-input-profiles-${ACCOUNT}-${REGION}
```

## Updating the Deployment

### Update Lambda Code

```bash
# Rebuild layers if needed
cd layers
./build-all-layers.sh

# Deploy updates
cd ../cdk
cdk deploy
```

### Update Infrastructure

```bash
# Review changes
cdk diff

# Deploy changes
cdk deploy
```

## Cleanup/Removal

### Delete Stack

```bash
# Delete the CloudFormation stack
cdk destroy

# Confirm deletion when prompted
```

### Manual Cleanup

Some resources may need manual cleanup:

```bash
# Empty and delete S3 buckets
aws s3 rm s3://gensec-security-input-profiles-${ACCOUNT}-${REGION} --recursive
aws s3 rb s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}

aws s3 rm s3://gensec-security-config-outputs-${ACCOUNT}-${REGION} --recursive
aws s3 rb s3://gensec-security-config-outputs-${ACCOUNT}-${REGION}

# Delete CloudWatch log groups
aws logs delete-log-group --log-group-name /aws/lambda/gensec-SecurityProfileProcessor
# Repeat for other Lambda functions
```

## Cost Considerations

### Estimated Monthly Costs

- **Lambda:** Pay per invocation and duration
- **DynamoDB:** On-demand pricing (pay per request)
- **S3:** Storage and request costs
- **Step Functions:** Pay per state transition
- **Bedrock:** Pay per AI model invocation
- **CloudWatch:** Logs storage and metrics

### Cost Optimization Tips

1. Use build-time resource curation (70% reduction in processing)
2. Monitor Lambda execution times
3. Set up CloudWatch alarms for cost thresholds
4. Use S3 lifecycle policies for old outputs
5. Enable DynamoDB auto-scaling if needed

## Security Best Practices

1. **IAM Roles:** Use least privilege permissions
2. **S3 Buckets:** Enable versioning and encryption
3. **Lambda Functions:** Use VPC endpoints if needed
4. **Secrets:** Use AWS Secrets Manager for sensitive data
5. **Monitoring:** Enable CloudTrail for audit logging

## Support

For issues or questions:
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Review [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines
- See [ALL_FIXES_SUMMARY.md](ALL_FIXES_SUMMARY.md) for known issues and fixes
