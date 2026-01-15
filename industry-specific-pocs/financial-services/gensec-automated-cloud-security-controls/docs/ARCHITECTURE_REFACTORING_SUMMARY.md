# Architecture Refactoring: Build-Time vs Runtime Resource Curation

## Question
Should the resource type filter be in the Documentation Manager Lambda or in the service mapping script and JSON?

## Answer
**The filter should be in the service mapping script** (build-time), not the Lambda (runtime).

## Why This Matters

### The Problem
Originally, the Lambda function was:
1. Discovering resource types at runtime (HTTP requests to CloudFormation docs)
2. Filtering out sub-resources at runtime (applying exclusion patterns)
3. Processing the filtered resources

This meant:
- Every Lambda execution did discovery + filtering
- Slow performance (HTTP requests + filtering logic)
- Inconsistent results (discovery could fail)
- Mixed concerns (Lambda doing both curation and consumption)

### The Solution
Move resource curation to build-time:
1. **Service Mapping Script** curates core resources once
2. **service-mappings.json** stores pre-curated lists
3. **Lambda** simply reads and uses the curated lists

## Implementation

### Service Mapping Script
**File:** `scripts/service-mapping/extract_service_mappings.py`

**Added:**
- `_get_curated_core_resources()` - Returns manually curated resource lists for 26 common services
- `_should_include_resource_type()` - Filtering logic (for future automated discovery)

**Curates:**
- EC2: 15 core resources (from 50+ total)
- Lambda: 6 core resources
- S3: 5 core resources
- DynamoDB: 2 core resources
- Plus 22 other common services

**Excludes:**
- Sub-resources (ingress, egress, association, attachment)
- Niche features (propagation, cidrblock)
- Linking resources (connections between resources)

### Lambda Function
**File:** `lambda/AWSServiceDocumentationManager/lambda_function.py`

**Removed:**
- `_should_include_resource_type()` - No longer needed (moved to script)
- `_discover_resource_types()` - No longer needed (pre-curated)

**Simplified:**
```python
# Before: Discover + Filter at runtime
resource_types = self._discover_resource_types(service_id)  # HTTP requests
filtered = [rt for rt in resource_types if self._should_include_resource_type(rt)]

# After: Use pre-curated list
resource_types = service_config.get('resource_types', [])  # Already filtered
```

### Service Mappings JSON
**File:** `config-example/service-mappings.json`

**Before:**
```json
"ec2": {
  "resource_types": []  // Empty!
}
```

**After:**
```json
"ec2": {
  "resource_types": [
    "ec2-instance",
    "ec2-vpc",
    "ec2-subnet",
    "ec2-securitygroup",
    ...  // 15 curated core resources
  ]
}
```

## Benefits

### Performance
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| EC2 Resources | 50+ discovered | 15 curated | 70% reduction |
| HTTP Requests | Per execution | None | 100% reduction |
| Filtering Overhead | Per execution | None | 100% reduction |
| Lambda Execution | Slower | Faster | Significant |

### Cost
- **Fewer Bedrock calls** - Only process core resources
- **Smaller DynamoDB** - Only store relevant parameters
- **Lower Lambda time** - No discovery/filtering overhead

### Consistency
- **Same resources every time** - No discovery failures
- **Predictable behavior** - No runtime variations
- **Easier debugging** - Known resource list

### Maintainability
- **Clear separation** - Curation (script) vs. Consumption (Lambda)
- **Easy updates** - Modify script, regenerate mappings
- **Version control** - Curated lists in git
- **Documentation** - Explicit list of what's included

## Architecture Comparison

### Before: Runtime Discovery & Filtering
```
┌─────────────────────────────────────────────────┐
│ Lambda Execution (Every Time)                   │
├─────────────────────────────────────────────────┤
│ 1. Load service-mappings.json                   │
│    └─ resource_types: []  (empty)               │
│                                                  │
│ 2. Discover resources (HTTP requests)           │
│    └─ Fetch CloudFormation docs                 │
│    └─ Parse HTML for resource links             │
│    └─ Extract 50+ resource types                │
│                                                  │
│ 3. Filter resources (runtime logic)             │
│    └─ Apply exclusion patterns                  │
│    └─ Remove sub-resources                      │
│    └─ Result: 15 core resources                 │
│                                                  │
│ 4. Process filtered resources                   │
│    └─ Fetch CloudFormation docs                 │
│    └─ Extract parameters with AI                │
│    └─ Store in DynamoDB                         │
└─────────────────────────────────────────────────┘
```

### After: Build-Time Curation
```
┌─────────────────────────────────────────────────┐
│ Build Time (Once)                               │
├─────────────────────────────────────────────────┤
│ extract_service_mappings.py                     │
│                                                  │
│ 1. Curate core resources                        │
│    └─ Manually defined lists                    │
│    └─ Pre-filtered (no sub-resources)           │
│    └─ 26 common services                        │
│                                                  │
│ 2. Generate service-mappings.json               │
│    └─ resource_types: [15 curated resources]    │
│                                                  │
│ 3. Upload to S3                                 │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ Lambda Execution (Every Time)                   │
├─────────────────────────────────────────────────┤
│ 1. Load service-mappings.json                   │
│    └─ resource_types: [15 curated resources]    │
│                                                  │
│ 2. Use curated resources directly               │
│    └─ No discovery                              │
│    └─ No filtering                              │
│    └─ Just use the list                         │
│                                                  │
│ 3. Process curated resources                    │
│    └─ Fetch CloudFormation docs                 │
│    └─ Extract parameters with AI                │
│    └─ Store in DynamoDB                         │
└─────────────────────────────────────────────────┘
```

## How Sub-Services Are Added

### Build-Time (Recommended)
1. Edit `extract_service_mappings.py`
2. Add service to `_get_curated_core_resources()`
3. List only core resources (no sub-resources)
4. Run script to regenerate mappings
5. Upload to S3

**Example:**
```python
def _get_curated_core_resources(self):
    return {
        'newservice': [
            'newservice-mainresource',
            'newservice-cluster',
            'newservice-policy',
            # Only core resources, no sub-resources
        ]
    }
```

### Runtime (Fallback)
For services without curated resources:
1. Lambda uses service_id as fallback
2. Attempts to fetch single resource page
3. Graceful degradation

## Testing

**Test File:** `tests/test_curated_resources.py`

**Verifies:**
- ✓ EC2 has 15 curated core resources
- ✓ Lambda has 6 curated core resources
- ✓ S3 has 5 curated core resources
- ✓ DynamoDB has 2 curated core resources
- ✓ Sub-resources are excluded
- ✓ All services have resource_types field
- ✓ Lambda uses curated resources correctly

**Run:**
```bash
python3 tests/test_curated_resources.py
```

## Coverage

**26 services with curated resources:**
- Compute: ec2, lambda, ecs, eks
- Storage: s3, dynamodb, rds
- Networking: elasticloadbalancingv2, apigateway, cloudfront
- Security: iam, kms, secretsmanager
- Messaging: sns, sqs, eventbridge
- Monitoring: cloudwatch, logs
- DevOps: codepipeline, codebuild, codecommit, codedeploy
- Orchestration: stepfunctions, cloudformation

**237 other services:**
- Have empty resource_types arrays
- Lambda uses fallback behavior
- Can be added as needed

## Key Takeaways

1. **Separation of Concerns**
   - Script: Curates resources (build-time)
   - Lambda: Consumes resources (runtime)

2. **Performance**
   - No discovery overhead
   - No filtering overhead
   - Faster Lambda execution

3. **Consistency**
   - Same resources every time
   - Predictable behavior
   - Easier debugging

4. **Maintainability**
   - Clear architecture
   - Easy to update
   - Version controlled

5. **Scalability**
   - Add services incrementally
   - Curate as needed
   - Fallback for uncurated services

## Status

✅ **Complete** - Build-time resource curation implemented and tested

## Related Documentation

- `docs/BUILD_TIME_RESOURCE_CURATION.md` - Detailed implementation guide
- `docs/RESOURCE_TYPE_FILTERING.md` - Original filtering approach
- `docs/RESOURCE_TYPE_DISCOVERY_FIX.md` - Discovery implementation
