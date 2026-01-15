# Configuration Files

This folder contains system-wide configuration files used by the AWS Infrastructure Reverse Engineering system.

## Files

### service-mappings.json

**Purpose:** Maps AWS service IDs to their CloudFormation resource types, IAM service names, and documentation URLs.

**Used By:**
- Lambda: `AWSServiceDocumentationManager` - Loads from S3 to resolve service names and extract documentation
- CDK: Deployed to S3 input bucket at `s3://<bucket>/configuration/service-mappings.json`
- Scripts: Service name resolution and validation

**Structure:**
```json
{
  "metadata": {
    "description": "AWS Service mappings",
    "last_updated": "2025-11-18 18:49:00 UTC",
    "total_services": 272,
    "version": "1.0.0"
  },
  "services": {
    "service-id": {
      "service_id": "service-id",
      "aliases": ["Service Name", "Alternate Name"],
      "iam_service_name": "service",
      "cloudformation_prefix": "AWS::Service::",
      "service_authorization_url": ["https://..."],
      "documentation_urls": ["https://..."],
      "has_iam_actions": true,
      "has_cloudformation_resources": true,
      "resource_types": ["service-resource1", "service-resource2"],
      "action_filter_patterns": ["CreateResource", "UpdateResource"],
      "last_updated": "2025-11-18 18:49:00 UTC"
    }
  }
}
```

**Special Features:**

#### Parent Services (Service Expansion)
Some services are organized as parent services that expand to multiple sub-services:

```json
{
  "bedrock": {
    "is_parent_service": true,
    "expansion_type": "core",
    "sub_services": [
      "bedrock-foundation-models",
      "bedrock-guardrails",
      "bedrock-knowledge-bases"
    ]
  },
  "bedrock-all": {
    "is_parent_service": true,
    "expansion_type": "all",
    "sub_services": [
      "bedrock-foundation-models",
      "bedrock-guardrails",
      "bedrock-knowledge-bases",
      "bedrock-agents",
      "bedrock-flows",
      "bedrock-model-customization",
      "bedrock-prompt-management",
      "bedrock-data-automation"
    ]
  }
}
```

**Customer Request:** `bedrock` → Expands to 3 core sub-services
**Customer Request:** `bedrock-all` → Expands to all 8 sub-services

#### Action Filtering
Sub-services use `action_filter_patterns` to extract only relevant IAM actions:

```json
{
  "bedrock-guardrails": {
    "action_filter_patterns": ["Guardrail", "ApplyGuardrail"]
  }
}
```

This ensures each sub-service only includes actions related to its specific functionality.

#### Resource Type Alignment
Each sub-service has matching CloudFormation `resource_types`:

```json
{
  "bedrock-knowledge-bases": {
    "resource_types": [
      "bedrock-knowledgebase",
      "bedrock-datasource"
    ]
  }
}
```

This maintains coherence between IAM actions and CloudFormation parameters.

## Generation

### Initial Generation
Generate the complete service mappings file:

```bash
python3 scripts/service-mapping/extract_service_mappings.py
```

This script:
1. Scrapes AWS CloudFormation documentation
2. Extracts service IDs, resource types, and documentation URLs
3. Adds Bedrock sub-services automatically
4. Saves to `configuration/service-mappings.json`

### Regenerate Mappings
To regenerate the complete service mappings (including Bedrock split):

```bash
python3 scripts/service-mapping/extract_service_mappings.py
```

This automatically:
1. Extracts all AWS services from CloudFormation docs
2. Adds Bedrock parent services and sub-services
3. Saves to `configuration/service-mappings.json`

**Note:** Bedrock split is integrated into the main extraction script - no separate update script needed.

## Deployment

The service-mappings.json file is automatically deployed to S3 by CDK:

```typescript
new s3deploy.BucketDeployment(this, 'ServiceMappingsDeployment', {
  sources: [s3deploy.Source.asset('../configuration')],
  destinationBucket: inputBucket,
  destinationKeyPrefix: 'configuration/',
  include: ['service-mappings.json'],
  retainOnDelete: false,
});
```

**Deployment Location:** `s3://<input-bucket>/configuration/service-mappings.json`

## Usage in Lambda

The Lambda function loads service mappings from S3:

```python
def _load_service_mappings(self):
    """Load service mappings from S3 configuration file"""
    response = self.s3.get_object(
        Bucket=self.input_bucket,
        Key='configuration/service-mappings.json'
    )
    mappings_data = json.loads(response['Body'].read().decode('utf-8'))
    return mappings_data['services']
```

## Service Organization Examples

### Bedrock Services

| Service ID | Type | Expands To | Actions | Parameters |
|------------|------|------------|---------|------------|
| `bedrock` | Parent (core) | 3 sub-services | ~50-80 | ~15-25 |
| `bedrock-all` | Parent (all) | 8 sub-services | ~150-200 | ~40-60 |
| `bedrock-foundation-models` | Sub-service | - | ~10-15 | ~2-5 |
| `bedrock-guardrails` | Sub-service | - | ~10-15 | ~3-5 |
| `bedrock-knowledge-bases` | Sub-service | - | ~20-30 | ~8-12 |
| `bedrock-agents` | Sub-service | - | ~25-35 | ~8-12 |
| `bedrock-flows` | Sub-service | - | ~15-20 | ~6-10 |
| `bedrock-model-customization` | Sub-service | - | ~20-30 | ~0 |
| `bedrock-prompt-management` | Sub-service | - | ~10-15 | ~3-5 |
| `bedrock-data-automation` | Sub-service | - | ~10-15 | ~0 |

### Future Service Splits

This pattern can be applied to other complex services:

**EC2:**
- `ec2` → Core (instances, networking, storage)
- `ec2-all` → All features
- `ec2-instances`, `ec2-networking`, `ec2-storage`, `ec2-autoscaling`

**RDS:**
- `rds` → Core (instances, clusters)
- `rds-all` → All features
- `rds-instances`, `rds-clusters`, `rds-proxies`, `rds-snapshots`

**ECS:**
- `ecs` → Core (clusters, services, tasks)
- `ecs-all` → All features
- `ecs-clusters`, `ecs-services`, `ecs-tasks`, `ecs-capacity-providers`

## Maintenance

### Adding New Services
1. Run `extract_service_mappings.py` to regenerate from AWS docs
2. Manually add any custom service splits (like Bedrock)
3. Deploy with `cdk deploy`

### Updating Existing Services
1. Edit `configuration/service-mappings.json` directly
2. Update `last_updated` timestamp
3. Deploy with `cdk deploy`

### Validating Changes
```bash
# Check JSON syntax
python3 -m json.tool configuration/service-mappings.json > /dev/null

# Count services
jq '.services | length' configuration/service-mappings.json

# List parent services
jq '.services | to_entries | map(select(.value.is_parent_service == true)) | .[].key' configuration/service-mappings.json

# List Bedrock sub-services
jq '.services | to_entries | map(select(.key | startswith("bedrock-"))) | .[].key' configuration/service-mappings.json
```

## Version History

- **v1.0.0** (2025-11-18): Initial version with Bedrock service split
  - 272 total services
  - 2 parent services (bedrock, bedrock-all)
  - 8 Bedrock sub-services
  - Action filtering support
  - Resource type alignment

## Related Documentation

- [Bedrock Service Organization](../docs/BEDROCK_SERVICE_ORGANIZATION.md) - Detailed Bedrock split design
- [Service Name Resolution](../docs/SERVICE_NAME_RESOLUTION.md) - How service names are resolved
- [Build Time Resource Curation](../docs/BUILD_TIME_RESOURCE_CURATION.md) - Resource type extraction
