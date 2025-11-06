# Semantic Grouping Pagination Strategy - Implementation Plan

## Overview
Implement intelligent pagination for SecurityConfigurationHandler Lambda functions to handle large AWS services by grouping related parameters and actions semantically, maintaining context across chunks.

## Core Strategy

### Semantic Grouping Principles
1. **Parameter Grouping**: Group by functional domain (encryption, networking, access control)
2. **Action Grouping**: Group by access level and resource type
3. **Context Preservation**: Maintain cross-chunk relationships
4. **Consistent Output**: Ensure coherent final results

## Implementation Phases

### Phase 0: Lambda Layer Foundation (Week 0.5)

#### 0.1 Create Shared Lambda Layer
**Directory**: `lambda-layers/semantic-pagination/`

```
lambda-layers/
└── semantic-pagination/
    └── python/
        └── lib/
            └── python3.9/
                └── site-packages/
                    ├── semantic_grouping/
                    │   ├── __init__.py
                    │   ├── grouper.py
                    │   └── classifiers.py
                    ├── chunk_processing/
                    │   ├── __init__.py
                    │   ├── processor.py
                    │   └── aggregator.py
                    └── pagination_utils/
                        ├── __init__.py
                        ├── context.py
                        └── validators.py
```

#### 0.2 Layer Module Structure
**semantic_grouping/grouper.py**:
```python
class SemanticGrouper:
    def group_parameters_by_domain(self, parameters):
        """Group parameters by security/functional domain"""
        
    def group_actions_by_context(self, actions):
        """Group actions by access level and resource type"""
```

**chunk_processing/processor.py**:
```python
class ChunkProcessor:
    def process_chunks_sequentially(self, chunks, base_prompt, function_type):
        """Process chunks maintaining context"""
        
    def aggregate_chunk_results(self, chunk_results, function_type):
        """Combine results maintaining consistency"""
```

**pagination_utils/context.py**:
```python
class ChunkContext:
    def create_chunk_context(self, chunk_index, total_chunks, previous_summaries):
        """Generate context for chunk processing"""
```

#### 0.3 CDK Layer Deployment
**File**: `cdk/lib/lambda-layers.ts`

```typescript
const semanticPaginationLayer = new lambda.LayerVersion(this, 'SemanticPaginationLayer', {
  code: lambda.Code.fromAsset('lambda-layers/semantic-pagination'),
  compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
  description: 'Semantic pagination utilities for SecurityConfigurationHandler'
});

// Add layer to existing Lambda functions
const securityConfigHandler = new lambda.Function(this, 'SecurityConfigurationHandler', {
  layers: [semanticPaginationLayer],
  // ... existing config
});
```

#### 0.4 Lambda Function Integration
**Changes to**: `lambda/SecurityConfigurationHandler/lambda_function.py`

```python
# Import from layer
from semantic_grouping import SemanticGrouper
from chunk_processing import ChunkProcessor
from pagination_utils import ChunkContext

# Initialize shared components
semantic_grouper = SemanticGrouper()
chunk_processor = ChunkProcessor()
chunk_context = ChunkContext()
```

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Layer Implementation Details
**Update existing layer modules with full implementation**

**semantic_grouping/classifiers.py**:
```python
PARAMETER_DOMAINS = {
    'encryption': ['encrypt', 'kms', 'ssl', 'tls', 'cipher'],
    'networking': ['vpc', 'subnet', 'security_group', 'endpoint'],
    'access_control': ['iam', 'role', 'policy', 'permission'],
    'monitoring': ['cloudwatch', 'cloudtrail', 'log', 'metric'],
    'backup': ['backup', 'snapshot', 'restore', 'retention'],
    'compliance': ['compliance', 'audit', 'governance']
}

def classify_parameter_domain(parameter_name, description):
    """Classify parameter into semantic domain"""
```

**chunk_processing/aggregator.py**:
```python
def merge_security_recommendations(chunk_results):
    """Merge security recommendations maintaining logical coherence"""
    
def combine_iam_model_chunks(chunk_results):
    """Combine IAM model chunks into comprehensive model"""
    
def merge_service_profile_chunks(chunk_results):
    """Merge service profile chunks into comprehensive profile"""
```

#### 1.2 Lambda Function Refactoring
**Remove inline implementations, use layer imports**:
- Move `SemanticGrouper` logic to layer
- Move `ChunkProcessor` logic to layer  
- Move context management to layer
- Update imports in main Lambda function

### Phase 2: Function-Specific Implementation (Week 2)

#### 2.1 Analyze Security Requirements
**Changes to**: `analyze_security_requirements()`

```python
def analyze_security_requirements_paginated(input_data):
    # Group parameters by security domain
    param_groups = semantic_grouper.group_parameters_by_domain(validated_parameters)
    action_groups = semantic_grouper.group_actions_by_context(validated_actions)
    
    # Process each group with context
    chunk_results = []
    for i, (params, actions) in enumerate(zip(param_groups, action_groups)):
        context = create_analysis_context(i, len(param_groups), chunk_results)
        prompt = create_chunked_analysis_prompt(params, actions, context)
        result = invoke_bedrock_agent(prompt)
        chunk_results.append(result)
    
    # Merge recommendations by security domain
    return merge_security_recommendations(chunk_results)
```

#### 2.2 Generate IAM Model
**Changes to**: `generate_iam_model()`

```python
def generate_iam_model_paginated(input_data):
    # Group actions by access level
    action_groups = semantic_grouper.group_actions_by_access_level(validated_actions)
    
    # Process each access level group
    chunk_results = []
    for i, actions in enumerate(action_groups):
        context = create_iam_context(i, len(action_groups), chunk_results)
        prompt = create_chunked_iam_prompt(actions, context)
        result = invoke_bedrock_agent(prompt)
        chunk_results.append(result)
    
    # Combine all actions into single model
    return combine_iam_model_chunks(chunk_results)
```

#### 2.3 Generate Service Profile
**Changes to**: `generate_service_profile()`

```python
def generate_service_profile_paginated(input_data):
    # Group by service capability areas
    capability_groups = semantic_grouper.group_by_service_capabilities(
        validated_parameters, validated_actions
    )
    
    # Process each capability area
    chunk_results = []
    for i, (params, actions) in enumerate(capability_groups):
        context = create_profile_context(i, len(capability_groups), chunk_results)
        prompt = create_chunked_profile_prompt(params, actions, context)
        result = invoke_bedrock_agent(prompt)
        chunk_results.append(result)
    
    # Merge into comprehensive profile
    return merge_service_profile_chunks(chunk_results)
```

### Phase 3: Semantic Grouping Logic (Week 3)

#### 3.1 Parameter Domain Classification
```python
PARAMETER_DOMAINS = {
    'encryption': ['encrypt', 'kms', 'ssl', 'tls', 'cipher'],
    'networking': ['vpc', 'subnet', 'security_group', 'endpoint'],
    'access_control': ['iam', 'role', 'policy', 'permission'],
    'monitoring': ['cloudwatch', 'cloudtrail', 'log', 'metric'],
    'backup': ['backup', 'snapshot', 'restore', 'retention'],
    'compliance': ['compliance', 'audit', 'governance']
}

def classify_parameter_domain(parameter_name, description):
    """Classify parameter into semantic domain"""
    for domain, keywords in PARAMETER_DOMAINS.items():
        if any(keyword in parameter_name.lower() or keyword in description.lower() 
               for keyword in keywords):
            return domain
    return 'general'
```

#### 3.2 Action Context Classification
```python
ACTION_CONTEXTS = {
    'data_operations': ['Read', 'Write'],
    'management_operations': ['List', 'Permissions Management'],
    'configuration_operations': ['Tagging', 'Write']
}

def classify_action_context(action_name, access_level):
    """Classify action into operational context"""
    for context, levels in ACTION_CONTEXTS.items():
        if access_level in levels:
            return context
    return 'general'
```

### Phase 4: Context Preservation (Week 4)

#### 4.1 Chunk Context Management
```python
class ChunkContext:
    def __init__(self):
        self.previous_summaries = []
        self.global_constraints = {}
        self.cross_chunk_references = {}
    
    def add_chunk_summary(self, chunk_index, summary):
        """Add summary of processed chunk"""
        
    def get_context_for_chunk(self, chunk_index):
        """Get relevant context for current chunk"""
        
    def validate_cross_chunk_consistency(self, final_result):
        """Validate consistency across all chunks"""
```

#### 4.2 Enhanced Prompt Templates
```python
def create_chunked_prompt_template(function_type, chunk_data, context):
    """Create context-aware prompt for specific function type"""
    
    base_templates = {
        'security_analysis': """
        This is chunk {chunk_index} of {total_chunks} for security analysis.
        
        Previous findings: {previous_summaries}
        Current focus: {current_domain}
        
        Maintain consistency with:
        - Configuration ID pattern: CONF-{service}-2025-{chunk_index:03d}XX
        - Priority scale established in previous chunks
        - Cross-references: {cross_references}
        """,
        
        'iam_model': """
        This is chunk {chunk_index} of {total_chunks} for IAM model generation.
        
        Previous actions processed: {previous_action_count}
        Current access level focus: {current_access_level}
        
        Ensure consistency with:
        - Service prefix: {service_prefix}
        - Role naming from previous chunks: {established_roles}
        """,
        
        'service_profile': """
        This is chunk {chunk_index} of {total_chunks} for service profile.
        
        Previous capabilities: {previous_capabilities}
        Current capability area: {current_area}
        
        Build upon:
        - Service description from chunk 1
        - Established feature set: {established_features}
        """
    }
    
    return base_templates[function_type].format(**context)
```

### Phase 5: Result Aggregation (Week 5)

#### 5.1 Security Recommendations Merger
```python
def merge_security_recommendations(chunk_results):
    """Merge security recommendations maintaining logical coherence"""
    
    # Group by security domain
    by_domain = defaultdict(list)
    for chunk in chunk_results:
        for rec in chunk.get('recommendations', []):
            domain = rec['security_domain']
            by_domain[domain].append(rec)
    
    # Merge related recommendations within domains
    merged_recommendations = []
    for domain, recs in by_domain.items():
        if len(recs) > 1:
            merged_rec = merge_domain_recommendations(recs)
            merged_recommendations.append(merged_rec)
        else:
            merged_recommendations.extend(recs)
    
    return {
        'statusCode': 200,
        'analyzedRequirements': merged_recommendations,
        'metadata': create_merged_metadata(chunk_results)
    }
```

#### 5.2 IAM Model Combiner
```python
def combine_iam_model_chunks(chunk_results):
    """Combine IAM model chunks into comprehensive model"""
    
    all_actions = []
    service_info = chunk_results[0]  # Service info from first chunk
    
    for chunk in chunk_results:
        all_actions.extend(chunk.get('actions', []))
    
    # Deduplicate and sort actions
    unique_actions = deduplicate_actions_by_name(all_actions)
    sorted_actions = sort_actions_by_access_level(unique_actions)
    
    return {
        'statusCode': 200,
        'body': {
            'serviceName': service_info['serviceName'],
            'servicePrefix': service_info['servicePrefix'],
            'actions': sorted_actions,
            'metadata': {
                'total_chunks_processed': len(chunk_results),
                'total_actions': len(sorted_actions)
            }
        }
    }
```

#### 5.3 Service Profile Merger
```python
def merge_service_profile_chunks(chunk_results):
    """Merge service profile chunks into comprehensive profile"""
    
    base_profile = chunk_results[0]  # Base structure from first chunk
    
    for chunk in chunk_results[1:]:
        # Merge data protection capabilities
        merge_data_protection_features(base_profile, chunk)
        
        # Merge network controls
        merge_network_capabilities(base_profile, chunk)
        
        # Merge access controls
        merge_access_control_features(base_profile, chunk)
        
        # Merge management operations
        merge_management_capabilities(base_profile, chunk)
    
    # Deduplicate and validate final profile
    final_profile = deduplicate_profile_content(base_profile)
    validation_issues = validate_profile_consistency(final_profile)
    
    if validation_issues:
        logger.warning(f"Profile consistency issues: {validation_issues}")
    
    return {
        'statusCode': 200,
        'body': final_profile
    }
```

## Configuration Changes

### Environment Variables
Add to CDK stack:
```typescript
'ENABLE_SEMANTIC_PAGINATION': 'true',
'MAX_PARAMETERS_PER_CHUNK': '50',
'MAX_ACTIONS_PER_CHUNK': '100',
'CHUNK_OVERLAP_SIZE': '5'
```

### Lambda Function Updates
```python
# Add to lambda_function.py
ENABLE_PAGINATION = os.environ.get('ENABLE_SEMANTIC_PAGINATION', 'false').lower() == 'true'
MAX_PARAMS_PER_CHUNK = int(os.environ.get('MAX_PARAMETERS_PER_CHUNK', '50'))
MAX_ACTIONS_PER_CHUNK = int(os.environ.get('MAX_ACTIONS_PER_CHUNK', '100'))

def should_use_pagination(parameters, actions):
    """Determine if pagination is needed based on size"""
    return (len(parameters) > MAX_PARAMS_PER_CHUNK or 
            len(actions) > MAX_ACTIONS_PER_CHUNK)
```

## Testing Strategy

### Unit Tests
- Test semantic grouping logic
- Test chunk context preservation
- Test result aggregation functions

### Integration Tests
- Test with large AWS services (EC2, S3)
- Test consistency across chunks
- Test error handling in chunk processing

### Performance Tests
- Compare paginated vs non-paginated execution times
- Monitor Bedrock API call patterns
- Validate token usage optimization

## Rollout Plan

### Phase 1: Infrastructure (Week 1)
- Implement core semantic grouping classes
- Add configuration options
- Create unit tests

### Phase 2: Function Integration (Week 2-3)
- Implement paginated versions of each function
- Add feature flags for gradual rollout
- Test with medium-sized services

### Phase 3: Validation & Optimization (Week 4-5)
- Test with large services
- Optimize chunk sizes and grouping logic
- Performance tuning

### Phase 4: Production Deployment (Week 6)
- Deploy with feature flag disabled
- Gradual enablement for specific services
- Monitor and adjust based on results

## Success Metrics

1. **Functionality**: Successfully process services with 200+ parameters/actions
2. **Consistency**: <5% variance in recommendation quality vs single-call
3. **Performance**: <50% increase in total execution time
4. **Cost**: Bedrock API costs remain within 2x of current usage
5. **Reliability**: 99%+ success rate for paginated processing

## Risk Mitigation

1. **Feature Flag**: Easy rollback if issues arise
2. **Gradual Rollout**: Test with specific services first
3. **Fallback Logic**: Automatic fallback to single-call for small datasets
4. **Monitoring**: Comprehensive logging and metrics
5. **Validation**: Extensive consistency checks in aggregation phase
