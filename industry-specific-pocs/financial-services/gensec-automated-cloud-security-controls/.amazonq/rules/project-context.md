# Security Configuration System Rules

## Working Environment
- **Work locally only** - do not attempt AWS deployments or account changes, unless explicitly asked
- Focus on code development, testing, and local validation
- Use existing test outputs and local files for analysis

## Code Style & Implementation
- Follow minimal implementation principle - write only essential code
- Use existing Lambda layers and shared utilities
- Maintain consistency with current CDK stack structure
- Follow AWS security best practices with least privilege IAM

## Architecture Constraints
- All Lambda functions must use Python 3.10 runtime
- Use existing DynamoDB table naming convention: `gensec-{TableName}`
- S3 buckets follow pattern: `gensec-{purpose}-{account}-{region}`
- Lambda functions use prefix: `gensec-{FunctionName}`

## Development Guidelines
- Test changes in decomposed architecture (current active system)
- Use existing Lambda layers: common, bedrock, dynamodb-operations, validation, requests, web-scraping
- Environment variables must reference CDK-managed resource names
- All resources must include gensec tags

## Output and Testing Standards
- All generated outputs must be saved to `tests/output` directory
- All test files and test data must be placed in `tests/` directory
- Scripts should default to `tests/output` for generated content
- Maintain organized subdirectories within tests for different output types

## Bedrock Integration
- Use Strands Agent (GenSecAgent) when USE_STRANDS_AGENT=true
- Support both direct model calls and agent-based processing
- Implement pagination for large parameter sets
- Log all AI interactions for debugging

## Data Flow Requirements
- Security profiles and service requests trigger Step Functions workflow
- All outputs stored in S3 with structured paths
- DynamoDB used for tracking, validation, and service documentation
- Support both individual file processing and batch operations

## Current Development Priorities
- Implement pagination for Bedrock calls with large parameter sets
- Replace web scraping with MCP server integration
- Develop AgentCore to centralize Bedrock interactions
- Improve validation logic to reduce false positives
- Add SQS integration: S3→SQS→StepFunctions