# Security Configuration System Guidelines

## 🚨 CRITICAL: READ-ONLY BY DEFAULT
- **DO NOT modify files** unless explicitly requested
- **Ask confirmation** before any changes  
- **Explain impact** of proposed changes
- **Preserve functionality** unless specifically changing it

## Project Context
**Serverless security configuration analysis system** that automates AWS service security recommendations using AI. Processes service configurations and generates security controls, IAM models, and infrastructure templates through Step Functions workflow.

## Architecture Components
- **Workflow**: gensec-SecurityConfigWorkflow (ValidateAndCollectServiceData → AnalyzeSecurityRequirements → GenerateSecurityControls → GenerateIaCTemplate → GenerateServiceProfile → GenerateIAMModel)
- **Lambda Functions**: SecurityProfileProcessor, AWSServiceDocumentationManager, AnalyzeSecurityRequirements, GenerateSecurityControls, GenerateIaCTemplate, GenerateIAMModel, GenerateServiceProfile
- **Storage**: DynamoDB (SecurityControlLibrary, ServiceRequestTracking, AWSService* tables), S3 (input/output/documentation)

## Development Rules
- **scripts/**: Development utilities (gitignored, NOT deployed)
- **tests/output/**: Downloaded S3 artifacts (gitignored)  
- **Production code**: lambda/, cdk/, config-example/
- Use existing Lambda layers: common, bedrock, dynamodb-operations, validation, requests, web-scraping
- All resources use gensec- prefix and tags
- Python 3.9 runtime for all Lambda functions

## Security Requirements
- Follow AWS security best practices with least privilege IAM
- This system processes sensitive security data - prioritize security, auditability, and least-privilege
- Environment variables must reference CDK-managed resource names
- Support both Strands Agent and direct Bedrock model calls