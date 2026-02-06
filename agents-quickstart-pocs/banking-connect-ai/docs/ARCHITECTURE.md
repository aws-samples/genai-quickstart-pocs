# Architecture

System design and data model for BetterBank Card Operations with Lambda-based MCP servers.

## System Overview

```
Customer
    ↓
Amazon Connect
    ↓
Bedrock Agent (Jeanie)
    ↓
AgentCore Gateway
    ↓
Lambda Functions (MCP Protocol)
    ├── lock_card
    ├── unlock_card
    └── request_new_card
    ↓
Lambda Function (Card Operations)
    ↓
DynamoDB Tables
    ├── customers
    ├── accounts
    ├── cards
    └── card-requests
```

**No API Gateway** - Uses direct Lambda invocation for maximum security and performance.

---

## Components

### 1. AgentCore Gateway
- **Type**: AWS Bedrock service
- **Purpose**: Routes AI agent requests to Lambda targets
- **Authentication**: IAM-based
- **Targets**: 3 Lambda functions (lock, unlock, request new)
- **Protocol**: MCP (Model Context Protocol)

### 2. MCP Lambda Functions

Three Lambda functions implementing the MCP protocol:

**lock_card Lambda:**
- **Name**: `betterbank-mcp-lock-card-dev`
- **Runtime**: Python 3.11
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **VPC**: Private subnets
- **Purpose**: Handle lock card requests via MCP protocol

**unlock_card Lambda:**
- **Name**: `betterbank-mcp-unlock-card-dev`
- **Runtime**: Python 3.11
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **VPC**: Private subnets
- **Purpose**: Handle unlock card requests via MCP protocol

**request_new_card Lambda:**
- **Name**: `betterbank-mcp-request-new-card-dev`
- **Runtime**: Python 3.11
- **Memory**: 256 MB
- **Timeout**: 30 seconds
- **VPC**: Private subnets
- **Purpose**: Handle new card requests via MCP protocol

### 3. Card Operations Lambda

**Name**: `betterbank-card-operations-dev`
- **Runtime**: Python 3.11
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Dependencies**: None (uses boto3 from runtime)
- **VPC**: Private subnets
- **Purpose**: Business logic for card management

### 4. DynamoDB Tables

**Customers Table:**
- **Name**: `betterbank-customers-dev`
- **Primary Key**: customer_id (String)
- **Attributes**: name, email, phone, address
- **Billing**: Pay-per-request

**Accounts Table:**
- **Name**: `betterbank-accounts-dev`
- **Primary Key**: account_id (String)
- **GSI**: customer_id-index
- **Attributes**: customer_id, account_type, routing_number, balance
- **Billing**: Pay-per-request

**Cards Table:**
- **Name**: `betterbank-cards-dev`
- **Primary Key**: card_id (String)
- **GSI**: account_id-index
- **Attributes**: account_id, card_number, status, expiry_date
- **Billing**: Pay-per-request

**Card Requests Table:**
- **Name**: `betterbank-card-requests-dev`
- **Primary Key**: request_id (String)
- **GSI**: customer_id-index
- **Attributes**: customer_id, account_id, reason, status, delivery_address
- **Billing**: Pay-per-request

### 5. VPC Infrastructure

**VPC:**
- **CIDR**: 10.0.0.0/16
- **DNS**: Enabled

**Subnets:**
- **Public**: 2 AZs (10.0.0.0/24, 10.0.1.0/24)
- **Private**: 2 AZs (10.0.2.0/24, 10.0.3.0/24)

**NAT Gateway:**
- 1 NAT Gateway in public subnet
- Provides internet access for Lambda functions

**VPC Gateway Endpoint:**
- DynamoDB endpoint
- Keeps DynamoDB traffic private (no internet)

---

## Data Model

### Entity Relationships

```
Customer (1) ──→ (N) Accounts
Account (1) ──→ (N) Cards
Customer (1) ──→ (N) Card Requests
```

### Customer
```json
{
  "customer_id": "CUST001",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0100",
  "address": "123 Main St, City, State 12345"
}
```

### Account
```json
{
  "account_id": "ACC001",
  "customer_id": "CUST001",
  "account_type": "checking",
  "routing_number": "042000013",
  "balance": 5000.00,
  "status": "active"
}
```

### Card
```json
{
  "card_id": "CARD001",
  "account_id": "ACC001",
  "card_number": "4532********1234",
  "last_four": "1234",
  "status": "active",
  "expiry_date": "12/2028"
}
```

### Card Request
```json
{
  "request_id": "REQ001",
  "customer_id": "CUST001",
  "account_id": "ACC001",
  "reason": "Lost card",
  "delivery_address": "123 Main St, City, State 12345",
  "status": "pending",
  "estimated_delivery": "2026-02-12",
  "created_at": "2026-02-05T10:40:00Z"
}
```

---

## Request Flow

### 1. Customer Interaction
```
Customer speaks to Amazon Connect → "I lost my card"
```

### 2. AI Agent Processing
```
Bedrock Agent analyzes intent → Selects lock_card tool
```

### 3. Gateway Routing
```
AgentCore Gateway → Validates parameters → Invokes lock_card Lambda
```

### 4. MCP Protocol Processing
```
MCP Lambda → Parses MCP request → Invokes Card Operations Lambda
```

### 5. Business Logic
```
Card Operations Lambda:
  1. Authenticate: Verify customer exists
  2. Authorize: Verify customer owns card
  3. Execute: Update card status to "locked"
  4. Persist: Write to DynamoDB
```

### 6. Response Flow
```
DynamoDB → Card Ops Lambda → MCP Lambda → Gateway → Bedrock Agent → Customer
```

**Customer hears:** "I've locked your card ending in 1234. You can unlock it anytime."

---

## Security

### Authentication
- **Service-to-Service**: IAM roles for all component communication
- **No API Keys**: All authentication via IAM
- **Customer Validation**: Application-level customer ID verification

### Authorization
- Customer ownership verified for all operations
- Prevents cross-customer access
- Enforced at application layer in Card Operations Lambda

### Encryption
- **In Transit**: TLS 1.2+ for all AWS service communication
- **At Rest**: DynamoDB encryption with AWS managed keys
- **Logs**: CloudWatch Logs encrypted

### IAM Roles

**Gateway Role:**
- **Purpose**: Allow AgentCore Gateway to invoke MCP Lambdas
- **Permissions**: `lambda:InvokeFunction` on 3 MCP Lambdas only

**MCP Lambda Role:**
- **Purpose**: Allow MCP Lambdas to invoke Card Operations Lambda
- **Permissions**: `lambda:InvokeFunction` on Card Operations Lambda only

**Card Operations Lambda Role:**
- **Purpose**: Allow Card Operations Lambda to access DynamoDB
- **Permissions**: DynamoDB read/write on 4 tables only

### Network Security
- All Lambda functions in private VPC subnets
- No public IP addresses
- NAT Gateway for outbound only (AWS service calls)
- VPC Gateway Endpoint for DynamoDB (no internet)
- Security groups restrict traffic

---

## Scalability

### Auto-Scaling
- **Lambda**: Automatic (up to 1000 concurrent by default)
- **DynamoDB**: Pay-per-request (auto-scales)
- **AgentCore Gateway**: Managed by AWS

### Performance
- **Lambda Cold Start**: ~500ms (no external dependencies)
- **Lambda Warm**: ~50-100ms
- **DynamoDB**: Single-digit millisecond latency
- **End-to-End**: ~200-500ms typical (via Bedrock Agent)

### Limits
- **Lambda Concurrent Executions**: 1000 (default, can be increased)
- **DynamoDB Throughput**: Unlimited (pay-per-request)
- **AgentCore Gateway**: Service-specific limits

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
- Lambda invocations, duration, errors, throttles
- DynamoDB read/write operations, throttles
- NAT Gateway data transfer, connection errors

### Recommended Alarms
- Lambda error rate > 5%
- Lambda duration > 10 seconds
- DynamoDB throttles > 0
- NAT Gateway connection errors > 0

---

## Cost Optimization

- **Lambda**: No idle costs, pay per invocation
- **DynamoDB**: Pay-per-request (no provisioned capacity)
- **NAT Gateway**: Fixed cost (~$32/month)
- **VPC**: No charge
- **VPC Endpoints**: No charge for Gateway endpoints
- **CloudWatch**: Free tier covers most logging

### Cost Reduction Tips
- Use DynamoDB free tier (25 GB storage)
- Use Lambda free tier (1M requests/month)
- Enable CloudWatch Logs retention (30 days)
- Monitor NAT Gateway data transfer costs

---

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery (optional)
- **Lambda Code**: Stored in CDK/CloudFormation
- **Configuration**: Infrastructure as Code

### Recovery Time Objective (RTO)
- **Infrastructure**: ~10 minutes (redeploy CDK stack)
- **Data**: Depends on backup strategy

### Recovery Point Objective (RPO)
- **DynamoDB**: Near-zero with point-in-time recovery
- **Without backup**: Last deployment

---

## Next Steps

- **Deploy**: See [Deployment Guide](DEPLOYMENT.md)
- **Configure**: See [Configuration Guide](CONFIGURATION.md)
- **Develop Locally**: See [Local Development](LOCAL_DEVELOPMENT.md)
- **Troubleshoot**: See [Troubleshooting](TROUBLESHOOTING.md)
