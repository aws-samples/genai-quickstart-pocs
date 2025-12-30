# AWSServiceDocumentationManager

## Overview
The AWSServiceDocumentationManager collects AWS service documentation from official AWS documentation sources and stores it in DynamoDB and S3 for use by other workflow components.

## Function Details
- **Name**: `gensec-AWSServiceDocumentationManager`
- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 15 minutes
- **Trigger**: Step Functions workflow

## Purpose
Collects and validates AWS service documentation including IAM actions and CloudFormation parameters using AI-powered extraction from official AWS documentation.

## Architecture Role
```
Step Functions → AWSServiceDocumentationManager → [DynamoDB + S3] → Next Step
```

## Key Features

### 1. AI-Powered Documentation Extraction
- Uses Bedrock AI to extract structured data from HTML documentation
- Supports both Claude and Nova Pro models via centralized client
- Intelligent URL pattern generation for service authorization pages
- Robust error handling and retry logic

### 2. Multi-Source Data Collection
- **IAM Actions**: From AWS Service Authorization Reference
- **CloudFormation Parameters**: From AWS CloudFormation Template Reference
- **Service Mappings**: Configurable service-to-URL mappings from S3

### 3. Intelligent Web Scraping
- HTTP request retry with exponential backoff
- Redirect handling
- Content cleaning and optimization for AI processing
- Timeout and error handling

## Input/Output

### Input (Step Functions)
```json
{
  "action": "ValidateAndCollectServiceData",
  "input": {
    "serviceId": "ec2",
    "service": "EC2"
  }
}
```

### Output
```json
{
  "statusCode": 200,
  "body": {
    "service_id": "ec2",
    "actions_count": 245,
    "parameters_count": 89,
    "status": "SUCCESS",
    "s3_locations": {
      "actions": "s3://bucket/ec2/Actions/raw_data_20250101.json",
      "parameters": "s3://bucket/ec2/Parameters/raw_data_20250101.json"
    },
    "warnings": []
  }
}
```

## Environment Variables
- `DOCUMENTATION_BUCKET`: S3 bucket for storing documentation
- `S3_INPUT_BUCKET`: Input bucket for service mappings
- `DYNAMODB_TABLE_SERVICE_ACTIONS`: Actions table name
- `DYNAMODB_TABLE_SERVICE_PARAMETERS`: Parameters table name
- `DYNAMODB_TABLE_SERVICE_INVENTORY`: Inventory table name

## Dependencies
- **Lambda Layers**: common, requests, web-scraping, bedrock
- **AWS Services**: DynamoDB, S3, Bedrock
- **External**: AWS documentation websites
- **IAM Permissions**: DynamoDB read/write, S3 read/write, Bedrock invoke, VPC access

## Key Components

### AWSServiceDocumentationCollector Class
Main class handling all documentation collection logic.

#### Key Methods

##### `collect_service_actions(service_id)`
Collects IAM actions using AI extraction from service authorization pages.

##### `collect_service_parameters(service_id)`
Collects CloudFormation parameters using AI extraction from template reference pages.

##### `store_documentation(service_id, data_type, data)`
Stores collected data in both DynamoDB and S3 with proper formatting.

##### `_extract_actions_with_ai_v2(service_id)`
AI-powered action extraction with intelligent URL pattern generation.

##### `_extract_parameters_with_ai(service_id)`
AI-powered parameter extraction with content optimization.

## Service Mappings Configuration

### Structure
```json
{
  "services": {
    "ec2": {
      "resource_types": ["ec2-instance", "ec2-vpc"],
      "iam_service_name": "ec2",
      "service_authorization_urls": [
        "https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonec2.html"
      ]
    }
  }
}
```

### Loading Priority
1. S3 input bucket (`configuration/service-mappings.json`)
2. S3 documentation bucket
3. Hardcoded fallback mappings

## AI Integration

### Bedrock Client
- Centralized client from bedrock-layer
- Model switching support (Claude/Nova Pro)
- Comprehensive logging and error handling

### Prompt Engineering
- Structured JSON output requirements
- Clear formatting specifications
- Context-aware content extraction

## Data Storage

### DynamoDB Tables
- **Actions**: `gensec-AWSServiceActions`
- **Parameters**: `gensec-AWSServiceParameters`
- **Inventory**: `gensec-AWSServiceInventory`

### S3 Storage
- Raw documentation: `{service_id}/{data_type}/raw_data_{timestamp}.json`
- Versioned by date for historical tracking

## Error Handling
- HTTP request failures with retry logic
- AI parsing errors with detailed logging
- DynamoDB storage errors with item-level recovery
- Comprehensive error reporting in response

## Monitoring
- CloudWatch Logs: `/aws/lambda/gensec-AWSServiceDocumentationManager`
- Key metrics: Processing time, success rate, AI invocations
- Custom log levels via event input

## Common Issues
1. **AI parsing failures**: Check prompt format and response structure
2. **HTTP timeouts**: Verify network connectivity and URL accessibility
3. **DynamoDB throttling**: Monitor write capacity and implement backoff
4. **Service mapping mismatches**: Validate service-mappings.json structure