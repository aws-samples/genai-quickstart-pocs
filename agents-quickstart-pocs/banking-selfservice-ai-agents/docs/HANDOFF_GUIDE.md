# Developer Handoff Guide - Card Operations Project

## What's Been Completed ✅

### Backend API & MCP Server (100% Done)
- **Debit card operations**: Lock, unlock, request new card
- **Mock data**: 3 customers, 5 accounts, 5 cards in DynamoDB
- **Authentication & Authorization**: Customer validation and ownership checks
- **MCP Server**: AI agent integration ready
- **Local testing**: All tests passing

**Location:** `src/` directory
- `src/lambda_handler/` - Lambda function handlers
- `src/mcp_server/` - MCP server for AI integration
- `src/shared/` - Business logic and data access

## What Needs to Be Built ❌

### 1. Amazon Connect Setup
**Owner:** [Your collaborator's name]
**Priority:** Critical for demo
**Tasks:**
- Create Amazon Connect instance
- Configure phone number and contact flows
- Set up voice (Amazon Polly) and chat channels
- Enable barge-in capability
- Configure escalation to human agent

**Resources:**
- [Amazon Connect Documentation](https://docs.aws.amazon.com/connect/)

### 2. Bedrock Agent (Jeanie)
**Owner:** [Your collaborator's name]
**Priority:** Critical for demo
**Tasks:**
- Create Bedrock Agent with conversational AI
- Connect to MCP server (already built)
- Configure natural language understanding
- Set up voice synthesis
- Enable message streaming ("Agent is thinking...")

**Integration Point:** MCP server at `src/mcp_server/server.py`

### 3. Guardrails & Safety
**Owner:** [Your collaborator's name]
**Priority:** High
**Tasks:**
- Configure Bedrock Guardrails
- Block non-banking questions
- Prevent hallucinations
- Implement jailbreak prevention
- Content filtering

### 4. Knowledge Base
**Owner:** [Your collaborator's name]
**Priority:** Medium
**Tasks:**
- Create Bedrock Knowledge Base
- Upload product documentation
- Connect to Bedrock Agent
- Test product queries

### 5. Monitoring & Logging
**Owner:** [Your collaborator's name]
**Priority:** Medium
**Tasks:**
- CloudWatch dashboards
- Conversation logging
- API metrics
- Error tracking
- Agent activity monitoring

### 6. AWS Deployment
**Owner:** Either developer
**Priority:** Critical for demo
**Tasks:**
- Deploy Lambda functions
- Create DynamoDB tables in AWS
- Set up API Gateway
- Configure IAM roles

**Note:** CloudFormation template can be created to automate this

## Repository Structure

```
banking-selfservice-ai-agents/
├── src/
│   ├── lambda_handler/      # ✅ Lambda functions (DONE)
│   ├── mcp_server/          # ✅ MCP server (DONE)
│   └── shared/              # ✅ Business logic (DONE)
├── scripts/
│   ├── create_tables.py     # ✅ DynamoDB setup (DONE)
│   ├── seed_data.py         # ✅ Mock data (DONE)
│   ├── test_local.py        # ✅ API tests (DONE)
│   └── test_mcp_server.py   # ✅ MCP tests (DONE)
├── config/
│   ├── api_gateway.yaml     # ✅ API spec (DONE)
│   └── dynamodb_tables.json # ✅ Table schemas (DONE)
├── .kiro/specs/             # Project documentation
└── tests/                   # ❌ Additional tests (TODO)
```

## Getting Started (For Your Collaborator)

### 1. Clone the Repository

```bash
git clone <gitlab-url>
cd banking-selfservice-ai-agents
```

### 2. Set Up Local Environment

```bash
# Install dependencies
./scripts/setup.sh

# Activate virtual environment
source venv/bin/activate

# Create DynamoDB tables (local)
python3 scripts/create_tables.py

# Seed mock data
python3 scripts/seed_data.py
```

### 3. Test Everything Works

```bash
# Test Lambda functions
python3 scripts/test_local.py

# Test MCP server
python3 scripts/test_mcp_server.py
```

All tests should pass ✅

### 4. Review Documentation

- `README.md` - Project overview
- `IMPLEMENTATION_SUMMARY.md` - What's been built
- `MCP_SERVER_GUIDE.md` - MCP server details
- `.kiro/specs/debit-card-workflow/` - Full requirements and design

## Integration Points

### MCP Server Endpoint

Your collaborator needs to connect Bedrock Agent to the MCP server:

**Local Testing:**
```bash
python3 src/mcp_server/server.py
```

**Production:** Will run as a service in AWS

**Available Tools:**
1. `lock_card` - Lock a debit card
2. `unlock_card` - Unlock a debit card
3. `request_new_card` - Request replacement card

**Tool Schemas:** See `src/mcp_server/README.md`

### API Endpoints (Once Deployed)

```
POST /v1/cards/lock
POST /v1/cards/unlock
POST /v1/cards/request-new
```

**Request Format:** See `config/api_gateway.yaml`

### Mock Data Available

**Customers:**
- CUST001: John Doe (john.doe@example.com)
- CUST002: Jane Smith (jane.smith@example.com)
- CUST003: Bob Johnson (bob.johnson@example.com)

**Test Scenarios:**
- CARD001 belongs to CUST001 (for testing lock/unlock)
- CARD003 is pre-locked (for testing unlock)
- CUST002 trying to access CARD001 should fail (authorization test)

## Communication & Coordination

### Division of Work

**You (Backend Developer):**
- ✅ API and business logic (DONE)
- ✅ MCP server (DONE)
- ⏳ AWS deployment (if needed)
- ⏳ Support for integration issues

**Collaborator (Connect/AI Developer):**
- ❌ Amazon Connect setup
- ❌ Bedrock Agent configuration
- ❌ Guardrails and safety
- ❌ Knowledge base
- ❌ Monitoring dashboards

### Integration Testing

Once both parts are ready:
1. Deploy backend to AWS
2. Connect Bedrock Agent to MCP server
3. Test end-to-end flow
4. Verify all safety features
5. Practice demo scenarios

## Demo Day Checklist

- [ ] Backend deployed to AWS
- [ ] Amazon Connect instance configured
- [ ] Bedrock Agent (Jeanie) working
- [ ] Can lock/unlock cards via voice
- [ ] Can request new card via voice
- [ ] Guardrails block non-banking questions
- [ ] Escalation to human works
- [ ] Knowledge base answers product questions
- [ ] Monitoring dashboard shows activity
- [ ] Both voice and text work
- [ ] Message streaming shows "thinking"

## Questions & Support

**Backend/API Questions:** Contact you
**Connect/AI Questions:** Contact collaborator

**Shared Resources:**
- GitLab repository
- AWS account access
- Project documentation in `.kiro/specs/`

## Timeline to Demo

Estimated work remaining: **12-16 hours**
- Connect setup: 3-4 hours
- Bedrock Agent: 2-3 hours
- Guardrails: 2-3 hours
- Knowledge Base: 2-3 hours
- Testing: 2-3 hours

---

**Last Updated:** January 21, 2026
**Backend Status:** ✅ Complete and tested
**Next Step:** Push to GitLab and share with collaborator
