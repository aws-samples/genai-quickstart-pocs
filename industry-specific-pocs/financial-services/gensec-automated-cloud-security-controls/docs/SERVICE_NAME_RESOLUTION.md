# Service Name Resolution

## Overview

The Service Name Resolution system allows users to specify AWS services using human-readable names instead of requiring exact technical service IDs. This significantly improves usability and reduces errors when requesting security configurations.

## Problem Statement

Previously, the system required users to know the exact AWS service ID (e.g., `elasticloadbalancingv2`) to request security configurations. This caused failures when users provided human-readable names like:
- "Gateway Load Balancer"
- "Application Load Balancer"  
- "ALB"
- "GWLB"

## Solution

The Service Name Resolver provides:

1. **Alias Mapping**: Maps human-readable names to service IDs
2. **Fuzzy Matching**: Handles typos and variations
3. **Helpful Suggestions**: Provides alternatives when resolution fails
4. **Case-Insensitive**: Works with any capitalization

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Input                                │
│  "Gateway Load Balancer" or "ALB" or "elasticloadbalancingv2"│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           SecurityProfileProcessor Lambda                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ServiceNameResolver.resolve()                        │  │
│  │  1. Normalize input (lowercase, trim)                 │  │
│  │  2. Check alias index (direct lookup)                 │  │
│  │  3. Try fuzzy matching (if needed)                    │  │
│  │  4. Return service ID or suggestions                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Step Functions Workflow                         │
│  Uses resolved service ID: "elasticloadbalancingv2"         │
└─────────────────────────────────────────────────────────────┘
```

### Service Mappings Structure

The `service-mappings.json` file contains:

```json
{
  "metadata": {
    "version": "1.0.0",
    "description": "AWS Service mappings...",
    "total_services": 263
  },
  "services": {
    "elasticloadbalancingv2": {
      "service_id": "elasticloadbalancingv2",
      "iam_service_name": "elasticloadbalancing",
      "aliases": [
        "ELBv2",
        "Elastic Load Balancing V2",
        "Application Load Balancer",
        "ALB",
        "Network Load Balancer",
        "NLB",
        "Gateway Load Balancer",
        "GWLB"
      ],
      "service_authorization_url": [...],
      "has_iam_actions": true,
      "has_cloudformation_resources": false
    }
  }
}
```

## Usage

### For End Users

Simply use the service name you're familiar with in your service request:

```json
{
  "requestId": "REQ-2025-001",
  "serviceId": "Gateway Load Balancer",
  "timestamp": "2024-11-07T12:00:00Z",
  "services": [
    {
      "serviceName": "Gateway Load Balancer"
    }
  ]
}
```

The system will automatically resolve it to `elasticloadbalancingv2`.

### Supported Name Formats

All of these work:
- **Human-readable**: "Gateway Load Balancer", "Application Load Balancer"
- **Abbreviations**: "ALB", "NLB", "GWLB", "ELBv2"
- **Service IDs**: "elasticloadbalancingv2", "elasticloadbalancing"
- **Mixed case**: "gateway load balancer", "GATEWAY LOAD BALANCER"
- **Typos** (fuzzy match): "Gateway Loadbalancer", "ApplicationLoadBalancer"

### Common Service Aliases

| Service | Aliases |
|---------|---------|
| **Load Balancers** | |
| elasticloadbalancingv2 | Gateway Load Balancer, Application Load Balancer, Network Load Balancer, ALB, NLB, GWLB, ELBv2 |
| elasticloadbalancing | Classic Load Balancer, ELB, CLB |
| **Compute** | |
| ec2 | EC2, Elastic Compute Cloud, Amazon EC2 |
| lambda | Lambda, AWS Lambda, Lambda Functions |
| ecs | ECS, Elastic Container Service, Amazon ECS |
| eks | EKS, Elastic Kubernetes Service, Amazon EKS |
| **Storage** | |
| s3 | S3, Simple Storage Service, Amazon S3 |
| efs | EFS, Elastic File System, Amazon EFS |
| **Database** | |
| dynamodb | DynamoDB, Amazon DynamoDB |
| rds | RDS, Relational Database Service, Amazon RDS |
| **Security** | |
| iam | IAM, Identity and Access Management, AWS IAM |
| kms | KMS, Key Management Service, AWS KMS |
| **Messaging** | |
| sns | SNS, Simple Notification Service, Amazon SNS |
| sqs | SQS, Simple Queue Service, Amazon SQS |
| **AI/ML** | |
| bedrock | Bedrock, Amazon Bedrock |
| sagemaker | SageMaker, Amazon SageMaker |

See `config-example/service-mappings.json` for the complete list.

## Error Handling

### Invalid Service Name

When a service name cannot be resolved, the system provides helpful suggestions:

**Input**: `"Gateway Load Balancer Service"` (invalid)

**Error Message**:
```
Service 'Gateway Load Balancer Service' not found.

Did you mean one of these?
  - Gateway Load Balancer (service ID: elasticloadbalancingv2)
  - Network Load Balancer (service ID: elasticloadbalancingv2)
  - Classic Load Balancer (service ID: elasticloadbalancing)
```

### Fuzzy Matching

The resolver uses fuzzy string matching to handle typos:

- **Input**: `"Gateway Loadbalancer"` (missing space)
- **Confidence**: 95%
- **Resolved to**: `elasticloadbalancingv2`

Fuzzy matching thresholds:
- **High confidence** (>80%): Automatically resolved
- **Medium confidence** (60-80%): Logged as warning, still resolved
- **Low confidence** (<60%): Not resolved, suggestions provided

## Implementation Details

### ServiceNameResolver Class

Located in: `layers/common-layer/python/service_name_resolver.py`

**Key Methods**:

```python
class ServiceNameResolver:
    def resolve(self, service_name: str) -> Optional[str]:
        """Resolve service name to service ID"""
        
    def get_suggestions(self, service_name: str, limit: int = 5) -> List[Tuple]:
        """Get suggestions for invalid service names"""
        
    def format_error_message(self, service_name: str) -> str:
        """Format helpful error message with suggestions"""
```

### Integration Points

1. **SecurityProfileProcessor** (`lambda/SecurityProfileProcessor/lambda_function.py`)
   - Resolves service names before triggering Step Functions
   - Validates resolution and provides error messages
   - Adds original service name to request for tracking

2. **AWSServiceDocumentationManager** (`lambda/AWSServiceDocumentationManager/lambda_function.py`)
   - Double-checks service name resolution
   - Provides fallback resolution if needed
   - Returns helpful errors for invalid services

## Maintenance

### Adding New Aliases

To add aliases for a service, update the extraction script:

**File**: `scripts/service-mapping/extract_service_mappings.py`

```python
def _get_service_aliases(self, service_id):
    """Get human-readable aliases for service IDs"""
    aliases_map = {
        'your-service-id': [
            'Human Readable Name',
            'Common Abbreviation',
            'Alternative Name'
        ],
        # ... more services
    }
    return aliases_map.get(service_id, [])
```

Then regenerate the mappings:

```bash
python3 scripts/service-mapping/extract_service_mappings.py
cp scripts/aws_service_mappings.json config-example/service-mappings.json
```

### Testing

Run the test suite to validate resolver functionality:

```bash
python3 tests/test_service_resolver.py
```

The test suite validates:
- ✅ Direct service ID lookup
- ✅ Alias resolution
- ✅ Case-insensitive matching
- ✅ Fuzzy matching for typos
- ✅ Error message formatting
- ✅ Suggestion generation

## Performance

- **Alias Index Build**: O(n) where n = total aliases (~1000)
- **Direct Lookup**: O(1) - hash table lookup
- **Fuzzy Matching**: O(m) where m = number of aliases
- **Memory**: ~500KB for alias index

The resolver is initialized once per Lambda cold start and reused across invocations.

## Troubleshooting

### Service Not Resolving

1. **Check the service exists**:
   ```bash
   grep -i "your-service" config-example/service-mappings.json
   ```

2. **Verify aliases are defined**:
   ```python
   python3 -c "
   import json
   with open('config-example/service-mappings.json') as f:
       data = json.load(f)
       print(data['services']['your-service-id'].get('aliases', []))
   "
   ```

3. **Test resolution locally**:
   ```bash
   python3 tests/test_service_resolver.py
   ```

### Adding Missing Service

If a service is missing from the mappings:

1. Check if it's in AWS CloudFormation documentation
2. Add it to the extraction script if needed
3. Regenerate mappings
4. Deploy updated configuration to S3

## Future Enhancements

- [ ] Machine learning-based name resolution
- [ ] Support for service categories (e.g., "compute services")
- [ ] Multi-language support
- [ ] Service name autocomplete API
- [ ] Historical resolution analytics
- [ ] Custom alias definitions per organization

## References

- [AWS Service Authorization Reference](https://docs.aws.amazon.com/service-authorization/latest/reference/)
- [AWS CloudFormation Resource Types](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
- [Python difflib Documentation](https://docs.python.org/3/library/difflib.html)
