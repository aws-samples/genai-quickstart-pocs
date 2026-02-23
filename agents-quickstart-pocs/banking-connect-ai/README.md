# BetterBank - Debit Card Workflow

AI-powered debit card operations (lock, unlock, request new card) for conversational banking through Amazon Bedrock Agent.

## 🚀 Quick Start

### 1. Prerequisites

Complete Amazon Connect setup first (see [Prerequisites](docs/PREREQUISITES.md)):
- Create Amazon Connect instance
- Enable Amazon Q in Connect Assistant
- Deploy Session Update Lambda via CloudFormation template

### 2. Deploy Infrastructure

Deploy Lambda functions as MCP servers for AgentCore Gateway integration:

```bash
# Windows
scripts\deploy_stack.bat dev

# Linux/Mac
./scripts/deploy_stack.sh dev
```

**Architecture:** Bedrock Agent → AgentCore Gateway → Lambda (MCP) → Lambda (Card Ops) → DynamoDB

**Benefits:**
- ✅ Fully private (no public endpoints)
- ✅ Serverless and auto-scaling
- ✅ Bank-compliant security
- ✅ Direct Lambda-to-Lambda invocation

---

## 📋 What You Get

### Infrastructure (CDK Deployment)
- **3 MCP Lambda Functions**: Implement Model Context Protocol for AI agent
- **Card Operations Lambda**: Business logic for card management
- **4 DynamoDB Tables**: Customer, account, card, and request data
- **S3 Bucket**: Knowledge base storage
- **VPC**: Private subnets with NAT gateway for secure networking
- **IAM Roles**: Least-privilege permissions for all components
- **Mock Data**: 3 customers, 5 accounts, 5 cards for testing

### Session Lambda (CloudFormation Template)
- **Session Update Lambda**: Updates Amazon Q in Connect with customer data
- **CloudFormation Template**: `assistant-update-session-data-lambda-customer.yaml`
- **Deployed Separately**: See [Prerequisites](docs/PREREQUISITES.md#step-3-deploy-session-update-lambda)

---

## 🎯 Architecture

```
Amazon Connect
    ↓
Bedrock Agent (BetterBank Assistant)
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
```

**No API Gateway** - Direct Lambda invocation for maximum security and performance.

---

## 📖 Documentation

### Getting Started
- **[Prerequisites](docs/PREREQUISITES.md)** - What you need before deploying
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Configuration](docs/CONFIGURATION.md)** - Configure AgentCore Gateway and Bedrock Agent

### Reference
- **[Architecture](docs/ARCHITECTURE.md)** - System design and data model
- **[MCP Protocol](docs/MCP_PROTOCOL.md)** - Tool schemas and protocol details
- **[Local Development](docs/LOCAL_DEVELOPMENT.md)** - Run and test locally
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🔑 Card Operations

The system provides three card management operations:

### Lock Card
Temporarily block a debit card to prevent transactions.

**Use case:** Customer reports card lost, stolen, or suspects fraud

**Parameters:**
- `customer_id`: Customer identifier (e.g., CUST001)
- `card_id`: Card identifier (e.g., CARD001)

### Unlock Card
Restore transaction capability to a locked card.

**Use case:** Customer found their card or resolved security concern

**Parameters:**
- `customer_id`: Customer identifier
- `card_id`: Card identifier

### Request New Card
Request a replacement debit card.

**Use case:** Card is damaged, permanently lost, stolen, or expired

**Parameters:**
- `customer_id`: Customer identifier
- `account_id`: Account identifier (e.g., ACC001)
- `reason`: Reason for replacement (optional)
- `delivery_address`: Delivery address (optional)

---

## 🧪 Test Data

**Customers:**
- CUST001: John Doe
- CUST002: Jane Smith  
- CUST003: Bob Johnson

**Cards:**
- CARD001: Active (CUST001)
- CARD002: Active (CUST001)
- CARD003: Locked (CUST002) ← Pre-locked for testing unlock
- CARD004: Active (CUST002)
- CARD005: Active (CUST003)

---

## 💰 Cost Estimate

- **MCP Lambda functions**: ~$5/month
- **Card Operations Lambda**: ~$5/month
- **DynamoDB**: ~$5/month (free tier eligible)
- **NAT Gateway**: ~$32/month
- **VPC**: No charge
- **Total: ~$50/month**

---

## 🛠️ Project Structure

```
.
├── src/
│   ├── lambda_handler/         # Card operations Lambda
│   ├── mcp_server/            # MCP protocol handlers
│   ├── session_lambda/        # Session update Lambda code (deployed via CF)
│   └── shared/                # Business logic & data access
├── scripts/
│   ├── deploy_stack.sh        # Deploy infrastructure
│   ├── deploy_stack.bat       # Deploy infrastructure (Windows)
│   └── seed_data_aws.py       # Seed test data
├── docs/                      # All documentation
├── assistant-update-session-data-lambda-customer.yaml  # Session Lambda CF template
├── mcp_stack.py               # CDK stack definition
└── app.py                     # CDK app entry point
```

---

## 🔒 Security

- **No Public Endpoints**: All Lambda functions in private VPC subnets
- **IAM-Based Authentication**: Service-to-service communication via IAM roles
- **Least Privilege**: Each component has minimal required permissions
- **Encryption**: DynamoDB encryption at rest with AWS managed keys
- **VPC Isolation**: Private subnets with controlled egress via NAT Gateway
- **Audit Logging**: All operations logged to CloudWatch

---

## 🚦 Status

**✅ Production Ready**

- All 3 card operations working
- MCP protocol implementation complete
- VPC networking configured
- IAM permissions automated
- CloudWatch logging enabled
- All tests passing

---

## 📞 Support

- **Issues**: Check [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- **Questions**: Review documentation in `docs/` folder
- **AWS Support**: For AgentCore Gateway or Bedrock issues

---

## 📄 License

MIT License
