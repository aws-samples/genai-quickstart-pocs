# GenerateIaCTemplate

## Overview
Generates Infrastructure as Code templates (CloudFormation/Terraform) implementing security controls and configurations.

## Function Details
- **Name**: `gensec-GenerateIaCTemplate`
- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 15 minutes
- **Trigger**: Step Functions workflow

## Purpose
Creates infrastructure templates with embedded security controls, parameter validation, and deployment guidance.

## Architecture Role
```
GenerateSecurityControls → GenerateIaCTemplate → [DynamoDB + S3] → GenerateServiceProfile
```

## Environment Variables
- `DYNAMODB_TABLE_CONTROL_LIBRARY`: Security control library table
- `DYNAMODB_TABLE_SERVICE_PARAMETERS`: Service parameters table
- `S3_OUTPUT_BUCKET`: Output bucket for IaC templates
- `USE_STRANDS_AGENT`: Enable/disable Strands Agent
- `STRANDS_AGENT_ID`: Bedrock agent ID
- `STRANDS_AGENT_ALIAS_ID`: Bedrock agent alias ID

## Dependencies
- **Lambda Layers**: common, dynamodb-operations, validation, bedrock
- **AWS Services**: DynamoDB, S3, Bedrock
- **IAM Permissions**: DynamoDB read/write, S3 read/write, Bedrock invoke