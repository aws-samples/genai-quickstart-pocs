# GenerateIAMModel

## Overview
Generates least-privilege IAM permission models and policies based on service actions and security requirements.

## Function Details
- **Name**: `gensec-GenerateIAMModel`
- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 15 minutes
- **Trigger**: Step Functions workflow

## Purpose
Creates optimized IAM policies implementing least privilege principles with service action mappings and permission validation.

## Architecture Role
```
GenerateServiceProfile → GenerateIAMModel → [S3] → Workflow Complete
```

## Environment Variables
- `DYNAMODB_TABLE_SERVICE_ACTIONS`: Service actions table
- `S3_OUTPUT_BUCKET`: Output bucket for IAM models
- `USE_STRANDS_AGENT`: Enable/disable Strands Agent
- `STRANDS_AGENT_ID`: Bedrock agent ID
- `STRANDS_AGENT_ALIAS_ID`: Bedrock agent alias ID

## Dependencies
- **Lambda Layers**: common, dynamodb-operations, validation, bedrock
- **AWS Services**: DynamoDB, S3, Bedrock
- **IAM Permissions**: DynamoDB read, S3 read/write, Bedrock invoke