# AI Extraction Methods and Strategies

**Last Updated:** 2024-11-20  
**Component:** AWS Service Documentation Manager Lambda  
**Related Files:**
- `lambda/AWSServiceDocumentationManager/lambda_function.py`
- `configuration/service-mappings.json`

## Overview

The system supports three AI extraction methods with different chunking and pagination strategies optimized for their respective output limits and capabilities.

## Extraction Methods

### 1. Bedrock Agents (Strands Agent)
**Configuration:** `USE_STRANDS_AGENT=true`

**Characteristics:**
- Uses AWS Bedrock Agent framework
- EventStream output limit: **6-7K characters**
- Structured JSON responses through agent framework
- Agent-controlled pagination support

**Best For:**
- Services with moderate action counts (<500 actions)
- When structured agent responses are preferred
- When pagination control is needed

### 2. Direct Model Invocation
**Configuration:** `USE_STRANDS_AGENT=false`

**Characteristics:**
- Direct calls to Bedrock foundation model
- Output limit: **~50K tokens** (~200K characters)
- Raw model responses (may include commentary)
- No pagination framework

**Best For:**
- Large services (EC2, RDS) with 500+ actions
- When verbose descriptions exceed agent limits
- When higher output capacity is needed

### 3. MCP Documentation Collector
**Configuration:** `USE_MCP_DOCUMENTATION=true`

**Characteristics:**
- Uses Model Context Protocol tools
- Fetches documentation directly from AWS docs
- Structured markdown conversion
- No output limits (direct doc access)

**Best For:**
- When official AWS documentation is available
- Parameter extraction from CloudFormation docs
- When highest accuracy is required

## Chunking Strategies

### Agent-Controlled Pagination (Bedrock Agents)

**Thresholds:**
```python
actions_chunk_threshold = 20000   # Trigger chunking above 20K
actions_chunk_size = 25000        # 25K input chunks
params_chunk_threshold = 20000    # Trigger chunking above 20K
params_chunk_size = 30000         # 30K input chunks
```

**How It Works:**
1. Split content into **larger chunks** (25K-30K)
2. Send chunk to agent with pagination instructions
3. Agent returns paginated response:
   ```json
   {
     "actions": [...],      // 20 actions per page
     "has_more": true,      // More pages available
     "page": 1,             // Current page number
     "total_pages": 5       // Total pages (optional)
   }
   ```
4. Lambda requests next page from **same chunk**
5. Repeat until `has_more: false`

**Example Flow:**
```
Input: 100K characters of action documentation

Step 1: Split into chunks
├─ Chunk 1: 25K chars
├─ Chunk 2: 25K chars
├─ Chunk 3: 25K chars
└─ Chunk 4: 25K chars

Step 2: Process Chunk 1 with pagination
├─ Page 1: 20 actions (6K output)
├─ Page 2: 20 actions (6K output)
├─ Page 3: 20 actions (6K output)
├─ Page 4: 20 actions (6K output)
└─ Page 5: 20 actions (6K output)
Result: 100 actions from Chunk 1

Step 3: Process remaining chunks...
```

**Benefits:**
- Stays under 6-7K EventStream limit
- Consistent 20 actions per page
- Agent controls pagination logic
- Handles verbose descriptions

**Drawbacks:**
- Multiple API calls per chunk
- Higher latency
- More complex error handling

### Traditional Pre-Chunking (Direct Invocation)

**Thresholds:**
```python
actions_chunk_threshold = 30000   # Trigger chunking above 30K
actions_chunk_size = 25000        # 25K input chunks
params_chunk_threshold = 50000    # Trigger chunking above 50K
params_chunk_size = 40000         # 40K input chunks
```

**Note:** Prompts include explicit action counting (e.g., "Extract all 50 actions") to ensure complete extraction. The model has 50K token output capacity and can handle large chunks when given clear targets.

**How It Works:**
1. Split content into **smaller chunks** (40K-60K)
2. Send each chunk to model
3. Model returns **all actions** from chunk in one response
4. No pagination - single call per chunk

**Example Flow:**
```
Input: 100K characters of action documentation

Step 1: Split into chunks
├─ Chunk 1: 25K chars (~50 actions) → API Call 1 → 52 actions extracted
├─ Chunk 2: 25K chars (~48 actions) → API Call 2 → 47 actions extracted
├─ Chunk 3: 25K chars (~52 actions) → API Call 3 → 51 actions extracted
└─ Chunk 4: 25K chars (~50 actions) → API Call 4 → 50 actions extracted

Result: 200 actions from 4 API calls (complete extraction with validation)
```

**Benefits:**
- Fewer API calls
- Lower latency
- Simpler logic
- Higher output capacity

**Drawbacks:**
- Model may add commentary after JSON
- Less structured responses
- Requires "Extra data" error handling
- Needs explicit action counting in prompts for complete extraction

## Service-Level Configuration

Services can override the default extraction method using `extraction_config` in `service-mappings.json`:

```json
{
  "ec2": {
    "service_id": "ec2",
    "extraction_config": {
      "use_strands_agent": false,
      "use_mcp": false,
      "reason": "EC2 actions have verbose descriptions that exceed Strands Agent 6K output limit"
    }
  }
}
```

### Configuration Inheritance

Sub-services inherit extraction config from parent services:

```json
{
  "ec2-instances": {
    "service_id": "ec2-instances",
    "parent_service": "ec2",
    // Inherits extraction_config from ec2 parent
  }
}
```

### Override Flow

```
1. Lambda starts with environment variables:
   USE_STRANDS_AGENT=true (default)
   
2. Load service configuration:
   service_id = "ec2-instances"
   
3. Check for extraction_config:
   - Not found at service level
   - Check parent_service = "ec2"
   - Found: use_strands_agent: false
   
4. Apply override:
   Strands Agent: True → False
   
5. Use direct model invocation
```

## Error Handling by Method

### Bedrock Agents Errors

**Truncation (6-7K limit exceeded):**
```
Error: Unterminated string starting at: line X column Y
Strategy: Salvage last complete JSON object
```

**Invalid JSON:**
```
Error: Expecting ',' delimiter: line X column Y
Strategy: Log error, return None
```

### Direct Invocation Errors

**Extra Data (model added commentary):**
```
Error: Extra data: line X column Y (char N)
Strategy: Extract first complete JSON array, ignore extra content
```

**Truncation (50K limit exceeded):**
```
Error: Unterminated string starting at: line X column Y
Strategy: Salvage last complete JSON object
```

**Invalid JSON:**
```
Error: Expecting ',' delimiter: line X column Y
Strategy: Log error, return None
```

## Performance Comparison

### EC2 Service Example (1400+ actions)

**Before Sub-Services (Bedrock Agents):**
- Content size: 500K+ characters
- Chunks: 20 chunks × 25K
- Pages per chunk: 5 pages × 20 actions
- Total API calls: 100+ calls
- Result: **Timeout** (>15 minutes)

**After Sub-Services (Direct Invocation):**
- Split into 6 sub-services
- Average content: 80K characters per sub-service
- Chunks: 2 chunks × 40K
- API calls: 2 calls per sub-service
- Result: **Success** (~2-3 minutes per sub-service)

### Small Service Example (Bedrock - 50 actions)

**Bedrock Agents:**
- Content size: 15K characters
- Chunks: 1 chunk
- Pages: 3 pages × 20 actions
- API calls: 3 calls
- Duration: ~30 seconds

**Direct Invocation:**
- Content size: 15K characters
- Chunks: 0 (below threshold)
- API calls: 1 call
- Duration: ~10 seconds

## Decision Matrix

| Service Size | Action Count | Recommended Method | Reason |
|-------------|--------------|-------------------|---------|
| Small | <100 actions | Bedrock Agents | Structured responses, good performance |
| Medium | 100-500 actions | Bedrock Agents | Pagination handles output well |
| Large | 500-1000 actions | Direct Invocation | Exceeds agent output limits |
| Very Large | 1000+ actions | Sub-Services + Direct | Split into logical groups |

## Configuration Examples

### Default (Bedrock Agents)
```python
# Environment variables
USE_STRANDS_AGENT=true
USE_MCP_DOCUMENTATION=false

# No service-level override needed
```

### Large Service (Direct Invocation)
```json
{
  "rds": {
    "service_id": "rds",
    "extraction_config": {
      "use_strands_agent": false,
      "use_mcp": false,
      "reason": "RDS has 500+ actions with verbose descriptions"
    }
  }
}
```

### Sub-Service Architecture
```json
{
  "ec2": {
    "service_id": "ec2",
    "is_parent_service": true,
    "extraction_config": {
      "use_strands_agent": false,
      "use_mcp": false,
      "reason": "EC2 actions exceed agent output limits"
    },
    "sub_services": [
      "ec2-instances",
      "ec2-vpc",
      "ec2-storage",
      "ec2-networking",
      "ec2-security",
      "ec2-monitoring"
    ]
  },
  "ec2-instances": {
    "service_id": "ec2-instances",
    "parent_service": "ec2",
    "action_filter_patterns": ["Instance", "Reservation", "Host"]
    // Inherits extraction_config from parent
  }
}
```

## Monitoring and Logging

### Key Log Messages

**Configuration Override:**
```
⚙️ Service 'ec2-instances' extraction config override:
   Strands Agent: True → False
   MCP: False → False
   Reason: EC2 actions exceed agent output limits
```

**Chunking Decision:**
```
Content too large (85000 chars > 50000), using chunking approach
Created 3 chunks for traditional chunking
```

**Pagination Progress:**
```
✓ Chunk 1 Page 1: Extracted 20 actions (Total: 20)
✓ Chunk 1 Page 2: Extracted 20 actions (Total: 40)
✓ Chunk 1 Page 3: Extracted 18 actions (Total: 58)
```

**Error Recovery:**
```
⚠️ AI added extra content after JSON. Extracting first valid JSON array...
✓ Successfully extracted 45 items from first JSON array (ignored extra content)
```

## Best Practices

### When to Use Bedrock Agents
1. Service has <500 actions
2. Descriptions are concise
3. Structured pagination is beneficial
4. Consistency is more important than speed

### When to Use Direct Invocation
1. Service has 500+ actions
2. Descriptions are verbose
3. Speed is important
4. Can handle occasional extra content

### When to Split into Sub-Services
1. Service has 1000+ actions
2. Actions have logical groupings
3. Single extraction times out
4. Want parallel processing capability

## Related Documentation

- [EC2 Sub-Service Architecture](./temp-fixes/EC2_SERVICE_GROUPS.md)
- [Service-Level Extraction Config](./temp-fixes/SERVICE_LEVEL_EXTRACTION_CONFIG.md)
- [Pagination Consistency Fix](./temp-fixes/PAGINATION_CONSISTENCY_FIX.md)
- [JSON Extra Data Handling](./temp-fixes/JSON_EXTRA_DATA_HANDLING.md)
- [Chunking Strategy](./temp-fixes/CHUNKING_STRATEGY.md)
