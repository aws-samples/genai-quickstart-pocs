# Deployment Guide

## Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 14+ and npm installed
- Access to AWS services: S3, Lambda, API Gateway, Bedrock

## Frontend Deployment

### Local Development
```bash
npm install
npm start
```

### Production Build
```bash
npm run build
# Deploy build/ directory to S3 static website hosting or CloudFront
```

## Lambda Function Deployment

### 1. Package Dependencies
```bash
cd Lambda/
pip install -r requirements.txt -t .
```

### 2. Create Deployment Packages
```bash
# For each Lambda function
zip -r generateWebFormStream.zip generateWebFormStream.py boto3/ botocore/ other_dependencies/
zip -r getPdfContent.zip getPdfContent.py boto3/ botocore/ other_dependencies/
zip -r listS3Objects.zip listS3Objects.py boto3/ botocore/ other_dependencies/
zip -r getDocumentFields.zip getDocumentFields.py boto3/ botocore/ other_dependencies/
```

### 3. Deploy to AWS Lambda
```bash
# Using AWS CLI
aws lambda create-function \
  --function-name generateWebFormStream \
  --runtime python3.9 \
  --role arn:aws:iam::ACCOUNT:role/lambda-execution-role \
  --handler generateWebFormStream.lambda_handler \
  --zip-file fileb://generateWebFormStream.zip

# Repeat for other functions
```

## API Gateway Configuration

### REST API Endpoints
1. Create REST API in API Gateway
2. Create resources and methods
3. Integrate with Lambda functions
4. Enable CORS
5. Deploy to stage

### WebSocket API
1. Create WebSocket API
2. Configure routes: $connect, $disconnect, generate
3. Integrate with generateWebFormStream Lambda
4. Deploy to stage

## Required IAM Permissions

### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket/*",
        "arn:aws:s3:::your-bucket"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*:*:model/us.anthropic.claude-3-5-sonnet-20241022-v2:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "arn:aws:execute-api:*:*:*/production/POST/@connections/*"
    }
  ]
}
```

## Environment Variables
Set these in Lambda function configuration:
- `WEBSOCKET_ENDPOINT`: WebSocket API Gateway endpoint
- `S3_BUCKET_PREFIX`: Optional bucket name filter

## Testing
1. Test Lambda functions individually
2. Test API Gateway endpoints
3. Test WebSocket connections
4. Test end-to-end workflow

## Monitoring
- CloudWatch Logs for Lambda functions
- API Gateway metrics
- WebSocket connection metrics
- Bedrock usage metrics