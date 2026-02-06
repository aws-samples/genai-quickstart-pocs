# Deployment Guide

Deploy the BetterBank Card Operations system with Lambda-based MCP servers for AgentCore Gateway.

## Overview

This deployment creates:
- 3 MCP Lambda functions (lock, unlock, request new card)
- 1 Card Operations Lambda function
- 4 DynamoDB tables
- VPC with private subnets
- NAT Gateway for outbound connectivity
- IAM roles for all components

**No API Gateway** - Uses direct Lambda invocation for security and performance.

---

## Prerequisites

See [Prerequisites](PREREQUISITES.md) for complete requirements.

**Required:**
- AWS CLI configured
- AWS CDK installed: `npm install -g aws-cdk`
- Node.js 18+
- Python 3.11+
- IAM permissions to create Lambda, DynamoDB, VPC, IAM roles

---

## Deployment Steps

### Step 1: Deploy Infrastructure

```bash
# Windows
scripts\deploy_stack.bat dev

# Linux/Mac
./scripts/deploy_stack.sh dev
```

This will:
1. Create VPC with public/private subnets
2. Deploy NAT Gateway
3. Create VPC Gateway Endpoints (DynamoDB and S3)
4. Create DynamoDB tables
5. Create S3 bucket for knowledge base
6. Deploy Card Operations Lambda
7. Deploy 3 MCP Lambda functions
8. Configure IAM roles and permissions
7. Create VPC Gateway Endpoint for DynamoDB

**Deployment time:** ~10 minutes

### Step 2: Note Deployment Outputs

The script displays:
- **Gateway Role ARN**: Use when creating AgentCore Gateway
- **Lambda ARNs**: Use when adding Gateway targets
  - Lock Card Lambda ARN
  - Unlock Card Lambda ARN
  - Request New Card Lambda ARN

**Save these values!** You'll need them for Gateway configuration.

### Step 3: Seed Test Data

```bash
python scripts/seed_data_aws.py
```

This creates:
- 3 customers (CUST001, CUST002, CUST003)
- 5 accounts (ACC001-ACC005)
- 5 cards (CARD001-CARD005)

---

## Configure AgentCore Gateway

After deployment completes, you need to create and configure the AgentCore Gateway.

**See [Configuration Guide](CONFIGURATION.md) for complete step-by-step instructions.**

### Quick Overview

1. **Create Gateway** (see Configuration Guide Step 1)
   - Use the Gateway Role ARN from deployment output
   - Name: `betterbank-card-operations-gateway-dev`

2. **Add Lambda Targets** (see Configuration Guide Step 2)
   - Add 3 Lambda targets with MCP schemas
   - Use Lambda ARNs from deployment output

3. **Connect to Bedrock Agent** (see below)

---

## Configure Bedrock Agent

### Create or Update Agent

```bash
aws bedrock-agent update-agent \
  --agent-id "<YOUR_AGENT_ID>" \
  --agent-name "Jeanie-Card-Operations" \
  --instruction "Help customers with debit card operations" \
  --foundation-model "anthropic.claude-3-sonnet-20240229-v1:0" \
  --action-groups '[{
    "actionGroupName": "CardOperations",
    "actionGroupExecutor": {
      "customControl": "GATEWAY",
      "gatewayId": "<YOUR_GATEWAY_ID>"
    }
  }]'
```

---

## Testing

### Test Lambda Functions Directly

```bash
# Test lock_card Lambda
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/call\",\"params\":{\"name\":\"lock_card\",\"arguments\":{\"customer_id\":\"CUST001\",\"card_id\":\"CARD001\"}},\"id\":1}"}' \
  response.json

cat response.json
```

### Test via AgentCore Gateway

```bash
aws bedrock-agentcore invoke-gateway \
  --gateway-id "<GATEWAY_ID>" \
  --target-name "lock-card-target" \
  --payload '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "lock_card",
      "arguments": {
        "customer_id": "CUST001",
        "card_id": "CARD001"
      }
    },
    "id": 1
  }'
```

### Test with Bedrock Agent

Use Amazon Connect or Bedrock Agent console:
- "I lost my card" → Should lock card
- "I found my card" → Should unlock card
- "I need a new card" → Should request replacement

---

## What Gets Created

### Lambda Functions

| Function | Purpose | Memory | Timeout |
|----------|---------|--------|---------|
| `betterbank-mcp-lock-card-dev` | MCP handler for lock | 256 MB | 30s |
| `betterbank-mcp-unlock-card-dev` | MCP handler for unlock | 256 MB | 30s |
| `betterbank-mcp-request-new-card-dev` | MCP handler for request | 256 MB | 30s |
| `betterbank-card-operations-dev` | Card operations logic | 512 MB | 30s |

### DynamoDB Tables

| Table | Purpose | Billing |
|-------|---------|---------|
| `betterbank-customers-dev` | Customer data | Pay-per-request |
| `betterbank-accounts-dev` | Account data | Pay-per-request |
| `betterbank-cards-dev` | Card data | Pay-per-request |
| `betterbank-card-requests-dev` | Card replacement requests | Pay-per-request |

### S3 Buckets

| Bucket | Purpose | Encryption |
|--------|---------|------------|
| `betterbank-knowledge-base-dev-{account-id}` | Knowledge base documents | S3-managed |

### VPC Resources

| Resource | Configuration |
|----------|---------------|
| VPC | 10.0.0.0/16 CIDR |
| Public Subnets | 2 AZs (10.0.0.0/24, 10.0.1.0/24) |
| Private Subnets | 2 AZs (10.0.2.0/24, 10.0.3.0/24) |
| NAT Gateway | 1 in public subnet |
| VPC Endpoint (DynamoDB) | Gateway endpoint (keeps DynamoDB traffic private) |
| VPC Endpoint (S3) | Gateway endpoint (keeps S3 traffic private) |

### IAM Roles

| Role | Purpose |
|------|---------|
| `betterbank-mcp-lambda-role-dev` | MCP Lambda execution |
| `betterbank-gateway-role-dev` | AgentCore Gateway execution |
| Card Operations Lambda role | Card operations execution |

---

## Monitoring

### CloudWatch Logs

Each Lambda logs to:
- `/aws/lambda/betterbank-mcp-lock-card-dev`
- `/aws/lambda/betterbank-mcp-unlock-card-dev`
- `/aws/lambda/betterbank-mcp-request-new-card-dev`
- `/aws/lambda/betterbank-card-operations-dev`

### CloudWatch Metrics

Monitor:
- Lambda invocations, duration, errors
- DynamoDB read/write operations
- VPC NAT Gateway data transfer

---

## Updating the Deployment

### Update Lambda Code

```bash
# Redeploy with latest code
./scripts/deploy_stack.sh dev
```

CDK will automatically update only changed resources.

### Update Infrastructure

Modify `mcp_stack.py` or `app.py`, then redeploy:

```bash
cdk deploy -c environment=dev
```

---

## Cleanup

To delete all resources:

```bash
# Delete CDK stack
cdk destroy -c environment=dev

# Or via CloudFormation
aws cloudformation delete-stack --stack-name betterbank-mcp-lambda-dev
```

**Warning:** This permanently deletes all data!

---

## Next Steps

- **Configure Gateway**: See [Configuration Guide](CONFIGURATION.md)
- **Understand Architecture**: See [Architecture](ARCHITECTURE.md)
- **Troubleshoot Issues**: See [Troubleshooting](TROUBLESHOOTING.md)
