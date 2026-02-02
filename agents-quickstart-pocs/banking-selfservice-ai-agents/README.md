# Debit Card Workflow API

Backend system for managing debit card operations (lock, unlock, request new card) for a conversational AI banking agent.

## 🚀 Deployment to AWS

### Quick Deploy (Command Line)

**Prerequisites:**
- AWS CLI installed and configured
- Python 3.11+ (for packaging)

**Deploy:**
```bash
# 1. Create Lambda package (tiny - no dependencies!)
./scripts/package.sh

# 2. Deploy to AWS
./scripts/deploy.sh

# 3. Create local python env
./scripts/setup.sh

# 4. Seed database with test data
source venv/bin/activate
python3 scripts/seed_data_aws.py

# 5. Get API endpoint and key from CloudFormation stack outputs
STACK_NAME="banking-selfservice-ai-agents-dev"
REGION="us-east-1"

echo "Getting API endpoint from CloudFormation..."
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)
echo "API Endpoint: $API_ENDPOINT"

echo "Getting API key ID from CloudFormation..."
API_KEY_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiKeyId`].OutputValue' \
  --output text)
echo "API Key ID: $API_KEY_ID"

echo "Retrieving API key value..."
API_KEY=$(aws apigateway get-api-key \
  --api-key "$API_KEY_ID" \
  --include-value \
  --query 'value' \
  --output text)
echo "API Key: $API_KEY"

# 6. Test the API
echo "Testing lock card endpoint..."
curl -X POST "$API_ENDPOINT/cards/lock" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"customer_id": "CUST001", "card_id": "CARD001"}'
```

**Note:** The deployment outputs include the command to retrieve your API key. All API requests require the `x-api-key` header.


### GUI Deployment (AWS Console Only)

**For customers without command-line tools:**

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for complete step-by-step guide:
1. Upload `lambda-deployment.zip` to S3
2. Deploy `template.yaml` via CloudFormation console
3. No CLI tools required!

**Package size:** ~500KB (Lambda runtime includes boto3, no external dependencies!)

---

## 📋 Documentation

**Start here:**
1. [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) - AWS deployment guide (GUI)
2. [`docs/HANDOFF_GUIDE.md`](docs/HANDOFF_GUIDE.md) - Team onboarding
3. [`docs/MCP_SERVER_GUIDE.md`](docs/MCP_SERVER_GUIDE.md) - MCP server integration
4. [`docs/QUICK_REFERENCE.md`](docs/QUICK_REFERENCE.md) - Command reference

---

## 🎯 Project Status

**✅ READY FOR DEPLOYMENT**

### What's Working
- ✅ All 3 card operations (lock, unlock, request new)
- ✅ Authentication and authorization
- ✅ MCP server for AI agent integration
- ✅ CloudFormation deployment
- ✅ All tests passing

### What's Next
- ⏳ Amazon Connect setup
- ⏳ Bedrock Agent (Jeanie) configuration
- ⏳ Guardrails and safety features
- ⏳ Knowledge base integration
- ⏳ Monitoring and logging

---
## API Endpoints

**All endpoints require API key authentication via the `x-api-key` header.**

### Lock Card
```bash
POST /v1/cards/lock
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### Unlock Card
```bash
POST /v1/cards/unlock
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### Request New Card
```bash
POST /v1/cards/request-new
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "customer_id": "CUST001",
  "account_id": "ACC001",
  "reason": "Lost card",
  "delivery_address": "123 Main St, Cincinnati, OH 45202"
}
```

---

## Data Model

### Customer → Accounts → Cards

```
Customer (customer_id)
    ├── Checking Account (account_id, routing_number)
    │   └── Debit Card(s) (card_id, status)
    └── Savings Account (account_id, routing_number)
        └── Debit Card(s) (card_id, status)
```

### Mock Test Data

**Customers:**
- CUST001: John Doe
- CUST002: Jane Smith
- CUST003: Bob Johnson

**Accounts:**
- ACC001: CUST001 Checking (routing: 042000013)
- ACC002: CUST001 Savings (routing: 042000014)
- ACC003: CUST002 Checking (routing: 042000015)
- ACC004: CUST002 Savings (routing: 042000016)
- ACC005: CUST003 Checking (routing: 042000017)

**Cards:**
- CARD001: ACC001 (ending 1234, active)
- CARD002: ACC002 (ending 5678, active)
- CARD003: ACC003 (ending 9012, locked)
- CARD004: ACC004 (ending 3456, active)
- CARD005: ACC005 (ending 7890, active)

---

## Architecture

```
Request → API Gateway → Lambda Handler → Card Operations → Auth → DynamoDB
```

**Flow:**
1. **Authentication**: Validates customer ID exists
2. **Authorization**: Verifies customer owns the card/account
3. **Business Logic**: Executes card operation
4. **Data Persistence**: Updates DynamoDB tables

**Infrastructure (CloudFormation):**
- 4 DynamoDB tables (customers, accounts, cards, card-requests)
- 1 Lambda function (Python 3.11, 512MB, 30s timeout)
- 1 API Gateway (REST API with 3 POST endpoints)
- IAM roles and CloudWatch log groups

---

## Configuration

The application reads configuration from environment variables with sensible defaults.

### Default Configuration (Local Development)
- `DYNAMODB_ENDPOINT`: `None` (uses AWS, set to `http://localhost:8000` for local)
- `CUSTOMERS_TABLE`: `bank-customers`
- `ACCOUNTS_TABLE`: `bank-accounts`
- `CARDS_TABLE`: `bank-cards`
- `CARD_REQUESTS_TABLE`: `bank-card-requests`

### AWS Deployment
Environment variables are automatically set by CloudFormation from `template.yaml`.

### Override Locally
```bash
export DYNAMODB_ENDPOINT=http://localhost:8000
python scripts/test_local.py
```

---

## Local Development (Optional)

### 1. Setup Environment

Run the setup script:
```bash
./scripts/setup.sh
```

Or manually:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start DynamoDB Local

```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

### 3. Create DynamoDB Tables

```bash
python scripts/create_tables.py
```

This creates:
- `bank-customers`
- `bank-accounts`
- `bank-cards`
- `bank-card-requests`

### 4. Seed Mock Data

```bash
python scripts/seed_data.py
```

This creates 3 mock customers, 5 accounts, and 5 debit cards.

### 5. Test Locally

```bash
python scripts/test_local.py
```

This runs integration tests for all card operations.

### 6. Test MCP Server

```bash
python scripts/test_mcp_server.py
```

---

## Running Tests

Run all tests:
```bash
pytest
```

Run only unit tests:
```bash
pytest -m unit
```

Run with coverage:
```bash
pytest --cov=src --cov-report=html
```

---

## Project Structure

```
.
├── src/
│   ├── lambda_handler/     # AWS Lambda function handlers
│   │   └── handler.py      # Main Lambda handler
│   ├── mcp_server/         # MCP server for AI agent integration
│   └── shared/             # Shared utilities
│       ├── auth.py         # Authentication/authorization
│       ├── card_operations.py  # Business logic
│       ├── config.py       # Configuration
│       ├── exceptions.py   # Custom exceptions
│       └── repositories.py # Data access layer
├── scripts/
│   ├── package.sh          # Create Lambda package
│   ├── deploy.sh           # Deploy to AWS
│   ├── setup.sh            # Local setup
│   ├── create_tables.py    # Create DynamoDB tables
│   ├── seed_data.py        # Seed local data
│   └── seed_data_aws.py    # Seed AWS data
├── tests/                  # Test suite
├── docs/                   # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── HANDOFF_GUIDE.md
│   └── MCP_SERVER_GUIDE.md
├── config/                 # Configuration files
├── template.yaml           # CloudFormation template
├── requirements.txt        # Local development dependencies
├── requirements-lambda.txt # Lambda dependencies (empty!)
└── pytest.ini             # Pytest configuration
```

---

## Dependencies

### Lambda (AWS)
**No external dependencies!** Lambda runtime includes:
- boto3 (AWS SDK)
- botocore
- Python 3.11 standard library

See `requirements-lambda.txt` (empty by design).

### Local Development
For local testing and development:
- boto3, botocore (AWS SDK)
- pytest, pytest-cov, hypothesis (testing)
- moto (AWS mocking)
- mcp, requests (MCP server)

See `requirements.txt`.

---

## License

MIT
