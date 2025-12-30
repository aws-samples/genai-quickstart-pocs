# AnalyzeSecurityRequirements

## Overview
The AnalyzeSecurityRequirements function performs AI-powered security analysis of service configurations and generates initial security requirements and recommendations.

## Function Details
- **Name**: `gensec-AnalyzeSecurityRequirements`
- **Runtime**: Python 3.9
- **Memory**: 1024 MB
- **Timeout**: 15 minutes
- **Trigger**: Step Functions workflow

## Purpose
Processes security profiles and service requests to generate comprehensive security analysis using Bedrock AI integration.

## Architecture Role
```
Step Functions → AnalyzeSecurityRequirements → [DynamoDB + S3] → GenerateSecurityControls
```

## Key Features

### 1. AI-Powered Security Analysis
- Bedrock integration with model switching support
- Security requirement analysis based on compliance frameworks
- Risk assessment and threat modeling
- Configuration validation against security best practices

### 2. Multi-Source Data Integration
- Security profile processing
- Service request analysis
- AWS service documentation integration
- Historical analysis data correlation

### 3. Structured Output Generation
- JSON-formatted analysis results
- S3 storage for audit trails
- DynamoDB tracking for workflow coordination

## Input/Output

### Input (Step Functions)
```json
{
  "securityProfile": {
    "profile_id": "PROF-2025-001",
    "security_requirements": {...},
    "compliance_requirements": {...}
  },
  "serviceRequest": {
    "requestId": "REQ-2025-001",
    "serviceId": "ec2",
    "services": [...]
  },
  "serviceDocumentation": {
    "statusCode": 200,
    "body": {
      "service_id": "ec2",
      "actions_count": 245,
      "parameters_count": 89
    }
  }
}
```

### Output
```json
{
  "statusCode": 200,
  "body": {
    "analysis_id": "ANALYSIS-2025-001",
    "security_analysis": {...},
    "recommendations": [...],
    "risk_assessment": {...},
    "s3_location": "s3://bucket/analysis/..."
  }
}
```

## Environment Variables
- `DYNAMODB_TABLE_CONTROL_LIBRARY`: Security control library table
- `DYNAMODB_TABLE_SERVICE_TRACKING`: Service request tracking table
- `DYNAMODB_TABLE_SERVICE_ACTIONS`: Service actions table
- `DYNAMODB_TABLE_SERVICE_PARAMETERS`: Service parameters table
- `S3_OUTPUT_BUCKET`: Output bucket for analysis results
- `USE_STRANDS_AGENT`: Enable/disable Strands Agent
- `STRANDS_AGENT_ID`: Bedrock agent ID
- `STRANDS_AGENT_ALIAS_ID`: Bedrock agent alias ID

## Dependencies
- **Lambda Layers**: common, dynamodb-operations, validation, bedrock
- **AWS Services**: DynamoDB, S3, Bedrock
- **IAM Permissions**: DynamoDB read/write, S3 read/write, Bedrock invoke

## Key Processing Steps
1. **Input Validation**: Validate security profile and service request structure
2. **Data Enrichment**: Combine with service documentation and historical data
3. **AI Analysis**: Process through Bedrock for security analysis
4. **Result Storage**: Store analysis results in S3 and tracking in DynamoDB
5. **Response Generation**: Format structured response for next workflow step

## Monitoring
- CloudWatch Logs: `/aws/lambda/gensec-AnalyzeSecurityRequirements`
- Key metrics: Analysis completion rate, AI processing time, error rates
- Custom dashboards for security analysis trends

## Common Issues
1. **AI timeout**: Large service configurations may require pagination
2. **Data validation errors**: Check input schema compliance
3. **Storage failures**: Monitor S3 and DynamoDB capacity