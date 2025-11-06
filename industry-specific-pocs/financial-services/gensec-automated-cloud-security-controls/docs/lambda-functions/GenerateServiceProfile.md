# GenerateServiceProfile

## Overview
Documents service capabilities, security features, and configuration guidance for AWS services.

## Function Details
- **Name**: `gensec-GenerateServiceProfile`
- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 15 minutes
- **Trigger**: Step Functions workflow

## Purpose
Creates comprehensive service capability profiles with security feature documentation and configuration guidance.

## Architecture Role
```
GenerateIaCTemplate → GenerateServiceProfile → [S3] → GenerateIAMModel
```

## Environment Variables
- `DYNAMODB_TABLE_SERVICE_ACTIONS`: Service actions table
- `DYNAMODB_TABLE_SERVICE_PARAMETERS`: Service parameters table
- `S3_OUTPUT_BUCKET`: Output bucket for service profiles
- `USE_STRANDS_AGENT`: Enable/disable Strands Agent
- `STRANDS_AGENT_ID`: Bedrock agent ID
- `STRANDS_AGENT_ALIAS_ID`: Bedrock agent alias ID

## Dependencies
- **Lambda Layers**: common, dynamodb-operations, validation, bedrock
- **AWS Services**: DynamoDB, S3, Bedrock
- **IAM Permissions**: DynamoDB read, S3 read/write, Bedrock invoke