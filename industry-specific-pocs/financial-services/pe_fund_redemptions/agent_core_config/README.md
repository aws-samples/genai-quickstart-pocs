# Agent Core Configuration

This folder contains Lambda functions and MCP Gateway configuration for the PE Fund Redemption system. Because AgentCore is still in preview, much of this functionality can not yet be put into a CDK and thus these steps need to be run manually.

## Quick Deployment

### Prerequisites
1. **Deploy CDK changes** first to create S3 bucket with data
2. **Bucket auto-discovery** - Script automatically finds your PE fund documents bucket
3. **Install dependencies** - The `bedrock-agentcore-starter-toolkit` is already added to the uv project

### Automated Deployment
```bash
# Run from the genai directory using uv
cd ../genai

# Deploy unified Lambda function (auto-discovers bucket)
uv run ../agent_core_config/deploy_lambdas.py

# FIRST TIME: Deploy MCP Gateway (creates Cognito resources)
AWS_PROFILE=your-profile uv run ../agent_core_config/gateway_deploy.py

# UPDATES: Update existing gateway targets
AWS_PROFILE=your-profile uv run ../agent_core_config/gateway_update.py

# Test the deployment
AWS_PROFILE=your-profile uv run ../agent_core_config/test_mcp_gateway.py
```

**Gateway Scripts:**
- `gateway_deploy.py` - **First time only** - Creates Cognito, gateway, and initial targets
- `gateway_update.py` - **Ongoing updates** - Updates Lambda targets on existing gateway
- `test_mcp_gateway.py` - Tests the deployed MCP gateway

## Unified Tool Usage

The single `pe_data_service` tool handles all operations:

```python
# Get investors
pe_data_service(operation="get_investors", filters={"investor_name": "Susan"})

# Get investments for specific investor
pe_data_service(operation="get_investments", filters={"investor_id": "CA_1234"})

# Get fund document
pe_data_service(operation="get_fund_document", filters={"fund_name": "FUND001", "investor_class": "ClassA"})

# Get fund mapping/details
pe_data_service(operation="get_fund_mapping", filters={"fund_name": "Strategic Growth"})

# Get redemption history
pe_data_service(operation="get_redemption_requests", filters={"investor_id": "CA_1234"})
```

## Configuration Files

- `pe-data-service/handler.py` - Unified Lambda function code
- `pe-data-service-payload.json` - Lambda deployment configuration
- `deploy_lambdas.py` - Automated Lambda deployment
- `create_gateways.py` - MCP Gateway setup
- `test_mcp_gateway.py` - Test the deployed service

## Data Sources

The unified service reads from S3:
- `s3://bucket/fund_documents/` - Fund documents (`.txt` files)
- `s3://bucket/database/` - CSV data files:
  - `investors.csv` - Investor information
  - `investments.csv` - Investment records
  - `fund_mapping.csv` - Fund details and terms
  - `redemption_requests.csv` - Redemption history

## Benefits of Unified Architecture

1. **Simpler for Agent** - One tool to learn instead of multiple
2. **Consistent Interface** - Same response format for all operations
3. **Easier Maintenance** - One Lambda, one deployment, one gateway
4. **Better Performance** - No routing between multiple services
5. **Unified Error Handling** - Consistent error responses

## Required AWS Permissions

The Lambda execution role needs:
```json
{
  "Effect": "Allow",
  "Actions": [
    "s3:GetObject",
    "s3:ListBucket",
    "logs:CreateLogGroup",
    "logs:CreateLogStream", 
    "logs:PutLogEvents"
  ],
  "Resources": [
    "arn:aws:s3:::pe-fund-documents-*",
    "arn:aws:s3:::pe-fund-documents-*/*",
    "arn:aws:logs:us-east-1:*:*"
  ]
}
```

## Troubleshooting

### Common Issues:
1. **"Could not find fund documents bucket"**
   - Ensure CDK deployment completed successfully
   - Check S3 bucket exists with pattern: `pe-fund-documents-{account}-{region}`
   - Verify you have S3 ListBuckets permissions

2. **"Data file not found in S3"**
   - Ensure CDK deployment completed successfully
   - Check S3 bucket has both `fund_documents/` and `database/` folders

3. **Lambda timeout**
   - Increase timeout in `deploy_lambdas.py` (currently 120 seconds)

### Testing:
```bash
# Test the MCP gateway (run from genai directory)
cd ../genai
uv run ../agent_core_config/test_mcp_gateway.py

# Check Lambda logs
aws logs tail /aws/lambda/pe-data-service --follow
```

## Migration from Old Architecture

If you have old MCP servers running:
1. Old servers are archived in `archived_mcp_tools/`
2. Delete old Lambda functions: `database-query`, `fund-documents`
3. Update any existing MCP gateway configurations
4. Use new unified `pe_data_service` tool

## Architecture Summary
- **Single Lambda**: `pe-data-service` handles all data operations
- **Single MCP Tool**: `pe_data_service` with operation parameter
- **S3 Data Source**: All data stored in S3 (documents + CSV files)
- **Unified Interface**: Consistent API for all operations
