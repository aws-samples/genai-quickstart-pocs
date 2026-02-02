# Quick Reference - Card Operations

## 🚀 Quick Commands

### Local Development
```bash
# Setup
./scripts/setup.sh
python3 scripts/create_tables.py
python3 scripts/seed_data.py

# Test
python3 scripts/test_local.py
python3 scripts/test_mcp_server.py
```

### AWS Deployment
```bash
# Deploy
./scripts/deploy.sh

# Seed AWS database
python3 scripts/seed_data_aws.py

# View logs
sam logs --stack-name banking-selfservice-ai-agents-dev --tail
```

---

## 📁 File Structure

```
src/
├── lambda_handler/handler.py    # Main Lambda function
├── mcp_server/server.py         # MCP server for AI
└── shared/
    ├── auth.py                  # Authentication
    ├── card_operations.py       # Business logic
    └── repositories.py          # Database access

scripts/
├── deploy.sh                    # Deploy to AWS
├── test_local.py               # Test locally
├── test_mcp_server.py          # Test MCP
└── seed_data_aws.py            # Seed AWS DB

config/
├── template.yaml               # CloudFormation template
├── api_gateway.yaml            # API specification
└── dynamodb_tables.json        # Table schemas
```

---

## 🔧 API Endpoints

### Lock Card
```bash
POST /v1/cards/lock
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### Unlock Card
```bash
POST /v1/cards/unlock
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### Request New Card
```bash
POST /v1/cards/request-new
{
  "customer_id": "CUST001",
  "account_id": "ACC001",
  "reason": "Lost card",
  "delivery_address": "123 Main St"
}
```

---

## 🧪 Test Data

### Customers
- **CUST001** - John Doe (john.doe@example.com)
- **CUST002** - Jane Smith (jane.smith@example.com)
- **CUST003** - Bob Johnson (bob.johnson@example.com)

### Accounts
- **ACC001** - CUST001 Checking (routing: 042000013)
- **ACC002** - CUST001 Savings (routing: 042000014)
- **ACC003** - CUST002 Checking (routing: 042000015)
- **ACC004** - CUST002 Savings (routing: 042000016)
- **ACC005** - CUST003 Checking (routing: 042000017)

### Cards
- **CARD001** - ACC001 (ending 1234, active)
- **CARD002** - ACC002 (ending 5678, active)
- **CARD003** - ACC003 (ending 9012, locked) ← Pre-locked for testing
- **CARD004** - ACC004 (ending 3456, active)
- **CARD005** - ACC005 (ending 7890, active)

---

## 🔍 Troubleshooting

### Local Issues

**DynamoDB connection error:**
```bash
# Make sure DynamoDB Local is running
# Or check DYNAMODB_ENDPOINT in .env
```

**Import errors:**
```bash
# Activate virtual environment
source venv/bin/activate
```

### AWS Issues

**Deployment fails:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Validate template
sam validate --template template.yaml
```

**API returns 500:**
```bash
# Check Lambda logs
sam logs --stack-name banking-selfservice-ai-agents-dev --tail
```

**No data in tables:**
```bash
# Seed the database
python3 scripts/seed_data_aws.py
```

---

## 📊 Stack Outputs

After deployment, get important values:

```bash
# Get API endpoint
aws cloudformation describe-stacks \
  --stack-name banking-selfservice-ai-agents-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text

# Get all outputs
aws cloudformation describe-stacks \
  --stack-name banking-selfservice-ai-agents-dev \
  --query 'Stacks[0].Outputs' \
  --output table
```

---

## 🧹 Cleanup

### Delete AWS Resources
```bash
aws cloudformation delete-stack \
  --stack-name banking-selfservice-ai-agents-dev

aws cloudformation wait stack-delete-complete \
  --stack-name banking-selfservice-ai-agents-dev
```

### Clean Local
```bash
# Remove virtual environment
rm -rf venv/

# Remove build artifacts
rm -rf .aws-sam/
```

---

## 📚 Documentation

- **README.md** - Project overview
- **DEPLOYMENT_GUIDE.md** - Full deployment instructions
- **HANDOFF_GUIDE.md** - For collaborators
- **MCP_SERVER_GUIDE.md** - MCP server details
- **GITLAB_SETUP.md** - Git collaboration
- **.kiro/specs/** - Requirements and design

---

## 🎯 Next Steps

1. ✅ Deploy to AWS: `./scripts/deploy.sh`
2. ✅ Seed database: `python3 scripts/seed_data_aws.py`
3. ✅ Test API endpoints
4. ⏳ Configure Amazon Connect
5. ⏳ Set up Bedrock Agent
6. ⏳ Integrate MCP server
7. ⏳ Demo with Jeanie!

---

## 💡 Tips

- Use `dev` environment for testing
- Use `staging` for pre-production
- Use `prod` for production
- Always test locally before deploying
- Check CloudWatch logs for debugging
- Keep mock data for testing
