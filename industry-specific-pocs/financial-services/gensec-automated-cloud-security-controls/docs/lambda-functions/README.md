# Lambda Functions Documentation

This directory contains detailed documentation for each Lambda function in the Security Configuration System.

## Function Overview

| Function | Purpose | Memory | Timeout | Key Dependencies |
|----------|---------|--------|---------|------------------|
| [SecurityProfileProcessor](SecurityProfileProcessor.md) | S3 event processing & workflow orchestration | 128 MB | 3 min | common-layer |
| [AWSServiceDocumentationManager](AWSServiceDocumentationManager.md) | AWS service documentation collection | 1024 MB | 15 min | common, requests, web-scraping, bedrock |
| [AnalyzeSecurityRequirements](AnalyzeSecurityRequirements.md) | AI-powered security analysis | 1024 MB | 15 min | common, dynamodb-operations, validation, bedrock |
| [GenerateSecurityControls](GenerateSecurityControls.md) | Security control generation | 1024 MB | 15 min | common, dynamodb-operations, validation, bedrock |
| [GenerateIaCTemplate](GenerateIaCTemplate.md) | Infrastructure template generation | 1024 MB | 15 min | common, dynamodb-operations, validation, bedrock |
| [GenerateIAMModel](GenerateIAMModel.md) | IAM permission model generation | 1024 MB | 15 min | common, dynamodb-operations, validation, bedrock |
| [GenerateServiceProfile](GenerateServiceProfile.md) | Service capability documentation | 1024 MB | 15 min | common, dynamodb-operations, validation, bedrock |

## Architecture Flow

```
S3 Upload → SecurityProfileProcessor → Step Functions → [Documentation Manager → Analysis → Controls → IaC → IAM → Profile] → S3 Output
```

## Common Patterns

- **Error Handling**: All functions use structured error responses with detailed logging
- **Environment Variables**: CDK-managed resource names for DynamoDB tables and S3 buckets
- **Bedrock Integration**: Support for both direct model calls and Strands Agent
- **Layer Usage**: Shared functionality through Lambda layers
- **Tagging**: All resources tagged with `gensec` for identification