# Development Guide

## Development Environment Setup

### Prerequisites

- **Python 3.9** - Lambda runtime version
- **Node.js ≥ 14.x** - For AWS CDK
- **AWS CLI** - Configured with credentials
- **Git** - Version control
- **IDE** - VS Code, PyCharm, or your preferred editor

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd security-project

# Install CDK dependencies
cd cdk
npm install
cd ..

# Build Lambda layers
cd layers
./build-all-layers.sh
cd ..

# Install Python dependencies for local development
pip install -r lambda/AWSServiceDocumentationManager/requirements.txt
# Repeat for other Lambda functions as needed
```

## Project Structure

### Directory Organization

```
security-project/
├── cdk/                  # Infrastructure as Code
│   ├── bin/             # CDK app entry point
│   ├── lib/             # Stack definitions
│   └── test/            # Infrastructure tests
├── lambda/              # Lambda function code (decomposed architecture)
│   ├── AWSServiceDocumentationManager/
│   ├── AnalyzeSecurityRequirements/
│   ├── GenerateSecurityControls/
│   ├── GenerateIaCTemplate/
│   ├── GenerateIAMModel/
│   ├── GenerateServiceProfile/
│   └── SecurityProfileProcessor/
├── layers/              # Lambda layers for shared code
│   ├── bedrock-layer/   # Bedrock AI client
│   ├── common-layer/    # Common utilities, service_name_resolver
│   ├── dynamodb-operations-layer/
│   ├── mcp-tools-layer/ # MCP documentation collector
│   ├── requests-layer/
│   ├── validation-layer/
│   └── web-scraping-layer/  # HTML parsing, content_processor
├── scripts/             # Utility scripts (gitignored)
├── config-example/      # Example configurations
├── tests/              # Test implementations
└── docs/               # Documentation
```

### File Organization Rules

1. **Production Code**
   - `lambda/` - Lambda function code
   - `cdk/` - Infrastructure definitions
   - `config-example/` - Sample configurations
   - `layers/` - Shared code libraries

2. **Development Tools**
   - `scripts/` - Development utilities (gitignored)
   - `tests/` - Test implementations
   - `tests/output/` - Downloaded artifacts (gitignored)

3. **Documentation**
   - `docs/` - Permanent project documentation
   - `README.md` - Main project documentation

## Code Organization

### Lambda Functions

Each Lambda function follows this structure:

```
lambda/FunctionName/
├── lambda_function.py    # Main handler
├── requirements.txt      # Python dependencies
└── README.md            # Function-specific documentation
```

**Handler Pattern:**
```python
def lambda_handler(event, context):
    """Lambda handler function"""
    try:
        # Extract input
        action = event.get('action')
        input_data = event.get('input', {})
        
        # Process
        result = process_data(input_data)
        
        # Return response
        return {
            'statusCode': 200,
            'body': result
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': {'error': str(e)}
        }
```

### Lambda Layers

Layers provide shared code across Lambda functions:

1. **bedrock-layer** - Bedrock AI client with logging
2. **common-layer** - boto3, s3_operations, service_name_resolver
3. **dynamodb-operations-layer** - DynamoDB utilities
4. **mcp-tools-layer** - MCP documentation collector
5. **requests-layer** - HTTP operations
6. **validation-layer** - Input validation, JSON/YAML processing
7. **web-scraping-layer** - BeautifulSoup, content_processor

**Layer Structure:**
```
layers/layer-name/
├── python/              # Python code (required path)
│   ├── module.py
│   └── requirements.txt
└── build.sh            # Build script
```

**Building Layers:**
```bash
# Build all layers
cd layers
./build-all-layers.sh

# Build specific layer
cd layers/common-layer
./build.sh
```

## Development Workflow

### 1. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes to code
# Edit lambda/FunctionName/lambda_function.py

# Test locally (if possible)
python lambda/FunctionName/lambda_function.py

# Rebuild layers if needed
cd layers
./build-all-layers.sh
```

### 2. Testing Changes

```bash
# Build CDK
cd cdk
npm run build

# Review changes
cdk diff

# Deploy to test environment
cdk deploy

# Test with sample data
aws s3 cp test-profile.json s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/security-profile/

# Monitor execution
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:${REGION}:${ACCOUNT}:stateMachine:gensec-SecurityConfigWorkflow

# Check logs
aws logs tail /aws/lambda/gensec-FunctionName --follow
```

### 3. Validation

```bash
# Download outputs
./scripts/download_outputs.py

# Validate outputs
cd scripts/output-validation
./validate_service.sh ServiceName
```

### 4. Committing Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add service name resolution for Gateway Load Balancer"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
```

## Coding Standards

### Python Style Guide

Follow PEP 8 with these specifics:

```python
# Imports
import boto3
import json
import logging
from datetime import datetime

# Constants
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

# Logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Functions
def process_data(input_data):
    """
    Process input data and return result.
    
    Args:
        input_data (dict): Input data to process
        
    Returns:
        dict: Processed result
        
    Raises:
        ValueError: If input_data is invalid
    """
    if not input_data:
        raise ValueError("input_data cannot be empty")
    
    # Implementation
    result = {}
    return result

# Classes
class DataProcessor:
    """Process data with specific logic"""
    
    def __init__(self, config):
        """Initialize processor with configuration"""
        self.config = config
    
    def process(self, data):
        """Process data"""
        pass
```

### TypeScript Style Guide (CDK)

```typescript
// Imports
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

// Constants
const LAMBDA_TIMEOUT = cdk.Duration.minutes(15);
const LAMBDA_MEMORY = 1024;

// Stack definition
export class SecuritySystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Resource definitions
    const documentationManager = new lambda.Function(this, 'DocumentationManager', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/AWSServiceDocumentationManager'),
      timeout: LAMBDA_TIMEOUT,
      memorySize: LAMBDA_MEMORY,
    });
  }
}
```

### Documentation Standards

1. **Code Comments**
   - Explain WHY, not WHAT
   - Document complex logic
   - Add TODO/FIXME for future work

2. **Function Documentation**
   - Docstrings for all functions
   - Parameter types and descriptions
   - Return value description
   - Exceptions raised

3. **README Files**
   - Each Lambda function has README.md
   - Explain purpose and usage
   - Document environment variables
   - List dependencies

## Testing Guidelines

### Unit Tests

```python
# tests/test_service_resolver.py
import unittest
from service_name_resolver import ServiceNameResolver

class TestServiceNameResolver(unittest.TestCase):
    def setUp(self):
        self.resolver = ServiceNameResolver({})
    
    def test_resolve_ec2(self):
        result = self.resolver.resolve('EC2')
        self.assertEqual(result, 'ec2')
    
    def test_resolve_gateway_load_balancer(self):
        result = self.resolver.resolve('Gateway Load Balancer')
        self.assertEqual(result, 'elasticloadbalancingv2')

if __name__ == '__main__':
    unittest.main()
```

### Integration Tests

```bash
# Test full workflow
./scripts/test_workflow.sh

# Test specific service
./scripts/output-validation/validate_service.sh DynamoDB
```

### Test Structure

```
tests/
├── test_service_resolver.py
├── test_content_processor.py
├── test_curated_resources.py
└── output/                    # Downloaded artifacts (gitignored)
```

## Common Development Tasks

### Adding a New Lambda Function

1. Create function directory
```bash
mkdir lambda/NewFunction
cd lambda/NewFunction
```

2. Create lambda_function.py
```python
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {event}")
    # Implementation
    return {'statusCode': 200, 'body': {}}
```

3. Create requirements.txt
```
boto3>=1.26.0
```

4. Add to CDK stack
```typescript
const newFunction = new lambda.Function(this, 'NewFunction', {
  runtime: lambda.Runtime.PYTHON_3_9,
  handler: 'lambda_function.lambda_handler',
  code: lambda.Code.fromAsset('../lambda/NewFunction'),
  timeout: cdk.Duration.minutes(15),
  memorySize: 1024,
});
```

### Adding a New Layer

1. Create layer directory
```bash
mkdir -p layers/new-layer/python
cd layers/new-layer
```

2. Create Python module
```python
# layers/new-layer/python/new_module.py
def process_data(data):
    """Process data"""
    return data
```

3. Create requirements.txt
```
# layers/new-layer/python/requirements.txt
requests>=2.28.0
```

4. Create build script
```bash
# layers/new-layer/build.sh
#!/bin/bash
cd python
pip install -r requirements.txt -t .
cd ..
```

5. Add to CDK
```typescript
const newLayer = new lambda.LayerVersion(this, 'NewLayer', {
  code: lambda.Code.fromAsset('../layers/new-layer'),
  compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
});
```

### Updating Service Mappings

```bash
# Edit curation logic
vim scripts/service-mapping/extract_service_mappings.py

# Regenerate mappings
cd scripts/service-mapping
python3 extract_service_mappings.py

# Copy to config
cp ../../scripts/aws_service_mappings.json ../../config-example/service-mappings.json

# Upload to S3
aws s3 cp ../../config-example/service-mappings.json \
  s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/configuration/
```

### Debugging Lambda Functions

```bash
# View recent logs
aws logs tail /aws/lambda/gensec-FunctionName --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/gensec-FunctionName \
  --filter-pattern "ERROR"

# Get specific log stream
aws logs get-log-events \
  --log-group-name /aws/lambda/gensec-FunctionName \
  --log-stream-name <stream-name>
```

## Performance Optimization

### Lambda Optimization

1. **Memory Allocation**
   - Start with 1024 MB
   - Monitor CloudWatch metrics
   - Adjust based on actual usage

2. **Timeout Settings**
   - Documentation Manager: 15 minutes
   - Other functions: 15 minutes
   - Profile Processor: 3 minutes

3. **Cold Start Reduction**
   - Use layers for shared code
   - Minimize dependencies
   - Keep functions focused

### Cost Optimization

1. **Build-Time Curation**
   - Pre-filter resources (70% reduction)
   - Faster execution
   - Lower Bedrock costs

2. **Efficient AI Usage**
   - Smart content chunking
   - Truncation recovery
   - Centralized client

3. **Storage Optimization**
   - S3 lifecycle policies
   - DynamoDB on-demand pricing
   - CloudWatch log retention

## Troubleshooting

### Common Issues

1. **Layer Import Errors**
   ```bash
   # Rebuild layers
   cd layers
   ./build-all-layers.sh
   
   # Redeploy
   cd ../cdk
   cdk deploy
   ```

2. **Service Name Resolution Failures**
   ```python
   # Check service mappings
   with open('config-example/service-mappings.json') as f:
       mappings = json.load(f)
       print(mappings['services'].keys())
   ```

3. **Bedrock Timeout**
   ```python
   # Check content size
   logger.info(f"Content size: {len(content)} chars")
   
   # Use chunking for large content
   if len(content) > 30000:
       use_chunking = True
   ```

## Contributing

1. Review this development guide
2. Follow coding standards
3. Write tests for new features
4. Update documentation
5. Submit pull request

## Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)
- [Python PEP 8 Style Guide](https://pep8.org/)
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
