# SecurityProfileProcessor

## Overview
The SecurityProfileProcessor is the entry point Lambda function that processes S3 upload events and orchestrates the security configuration workflow.

## Function Details
- **Name**: `gensec-SecurityProfileProcessor`
- **Runtime**: Python 3.9
- **Memory**: 128 MB
- **Timeout**: 3 minutes
- **Trigger**: S3 Object Created events

## Purpose
Processes uploaded security profiles and service requests, validates their structure, and triggers the Step Functions workflow when both required files are present.

## Architecture Role
```
S3 Upload → SecurityProfileProcessor → Step Functions Workflow
```

## Key Features

### 1. S3 Event Processing
- Parses S3 event notifications
- Extracts bucket name and object key
- Handles multiple file types (security-profile/, service-request/)

### 2. File Validation
- JSON structure validation
- Required field validation
- Content cleaning (BOM removal, comment stripping)
- Error handling with detailed logging

### 3. Workflow Orchestration
- Checks for both required files (security profile + service request)
- Triggers Step Functions when both files are available
- Coordinates multi-file processing

## Input/Output

### Input (S3 Event)
```json
{
  "Records": [{
    "s3": {
      "bucket": {"name": "gensec-security-input-profiles-{account}-{region}"},
      "object": {"key": "security-profile/PROF-2025-001.json"}
    }
  }]
}
```

### Expected File Structures

#### Security Profile
```json
{
  "profile_id": "PROF-2025-001",
  "security_requirements": {...},
  "compliance_requirements": {...}
}
```

#### Service Request
```json
{
  "requestId": "REQ-2025-001",
  "serviceId": "ec2",
  "services": [...]
}
```

### Output
```json
{
  "statusCode": 200,
  "body": "Processing completed successfully"
}
```

## Environment Variables
- `STATE_MACHINE_ARN`: Step Functions state machine ARN for workflow triggering

## Dependencies
- **Lambda Layers**: common-layer
- **AWS Services**: S3, Step Functions
- **IAM Permissions**: S3 read/write, Step Functions execution

## Error Handling
- JSON parsing errors (400 response)
- S3 access errors (logged and re-raised)
- Step Functions execution errors (logged and re-raised)
- General exceptions (500 response)

## Key Functions

### `parse_s3_event(event)`
Extracts bucket name and object key from S3 event notification.

### `read_s3_file(bucket, key)`
Reads and parses JSON content from S3 with content cleaning and validation.

### `validate_file_content(content, file_type)`
Validates required fields based on file type (security_profile or service_request).

### `trigger_step_functions(security_profile, service_request)`
Starts Step Functions execution with combined input data.

## Monitoring
- CloudWatch Logs: `/aws/lambda/gensec-SecurityProfileProcessor`
- Key metrics: Invocations, Errors, Duration
- Custom log messages for debugging file processing

## Common Issues
1. **Invalid JSON format**: Check file encoding and structure
2. **Missing required fields**: Validate input file schema
3. **Step Functions execution failure**: Check IAM permissions and state machine status