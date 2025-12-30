# GenerateSecurityControls

## Overview
Generates security control recommendations and compliance mappings based on security analysis results.

## Function Details
- **Name**: `gensec-GenerateSecurityControls`
- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 15 minutes
- **Trigger**: Step Functions workflow

## Purpose
Creates comprehensive security control library entries with compliance framework mappings and implementation guidance.

## Architecture Role
```
AnalyzeSecurityRequirements → GenerateSecurityControls → [DynamoDB + S3] → GenerateIaCTemplate
```

## Environment Variables
- `DYNAMODB_TABLE_CONTROL_LIBRARY`: Security control library table
- `DYNAMODB_TABLE_SERVICE_ACTIONS`: Service actions table
- `DYNAMODB_TABLE_SERVICE_PARAMETERS`: Service parameters table
- `DYNAMODB_TABLE_CONFIG_RULES`: AWS Config managed rules table
- `S3_OUTPUT_BUCKET`: Output bucket for control definitions
- `USE_STRANDS_AGENT`: Enable/disable Strands Agent
- `STRANDS_AGENT_ID`: Bedrock agent ID
- `STRANDS_AGENT_ALIAS_ID`: Bedrock agent alias ID

## Dependencies
- **Lambda Layers**: common, dynamodb-operations, validation, bedrock
- **AWS Services**: DynamoDB, S3, Bedrock
- **DynamoDB Tables**: Security Control Library, Service Actions, Service Parameters, AWS Config Managed Rules
- **IAM Permissions**: DynamoDB read/write, S3 read/write, Bedrock invoke