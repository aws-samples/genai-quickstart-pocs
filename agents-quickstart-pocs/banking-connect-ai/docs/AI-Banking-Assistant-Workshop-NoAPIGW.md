# BetterBank Assistant Workshop

## Building an AI-Powered Banking Assistant with Amazon Connect and Connect AI Agents

### Workshop Overview

In this workshop, you will build BetterBank Assistant, an AI-powered banking assistant that helps customers manage their debit cards through natural conversation. By the end of this workshop, you'll have a fully functional voice-enabled AI agent that can:

- 🔒 Lock debit cards when customers report them lost or stolen
- 🔓 Unlock cards when customers find them
- 💳 Request replacement cards
- 🤝 Seamlessly escalate to human agents when needed

### Architecture

```
Customer Phone Call
        ↓
Amazon Connect (Voice)
        ↓
Customer Profiles (Lookup by phone)
        ↓
Session Lambda (UpdateSessionData API)
        ↓
Amazon Lex (Speech-to-text)
        ↓
Amazon Q in Connect (AI Agent)
        ↓
AgentCore Gateway (MCP Protocol)
        ↓
MCP Tool Lambdas → Card Operations Lambda → DynamoDB
```

### What Makes This "Agentic AI"?

Unlike traditional IVR systems with rigid menus ("Press 1 for card services…"), agentic AI understands natural language and takes autonomous action:

| Traditional IVR | Agentic AI (This Workshop) |
|-----------------|---------------------------|
| "Press 1 to lock your card" | "I lost my wallet!" → AI understands and locks card |
| Fixed menu options | Natural conversation |
| Can only route calls | Actually performs card operations |
| No context awareness | Remembers full conversation |
| Always transfers complex requests | Knows when to handle vs. escalate |

### Workshop Modules

| Module | Duration | Description |
|--------|----------|-------------|
| Module 1: Deploy Backend | 30 min | Deploy Lambda and DynamoDB |
| Module 2: Configure AgentCore Gateway | 20 min | Set up MCP tools with Lambda targets |
| Module 3: Set Up Amazon Connect | 30 min | Configure contact flows and Lex bot |
| Module 4: Create AI Agent | 20 min | Build the Bedrock AI agent with tools |
| Module 5: Test and Validate | 15 min | End-to-end testing |

**Total Duration: ~2 hours**

### Prerequisites

Before starting this workshop, ensure you have:

**AWS Account Requirements:**
- AWS Account with administrator access
- Amazon Connect instance (or ability to create one)
- Amazon Bedrock access enabled in your region
- Q in Connect enabled on your Connect instance

**Local Development Requirements:**
- AWS CLI installed and configured
- Python 3.9 or higher
- Git installed
- Terminal/Command line access

**Region Selection:**
This workshop is designed for `us-east-1` (N. Virginia). If using a different region, ensure:
- Amazon Bedrock is available
- Amazon Connect is available
- Q in Connect is available

### Cost Estimate

Running this workshop will incur AWS charges. Estimated costs for a 2-hour workshop:

| Service | Estimated Cost |
|---------|---------------|
| Amazon Connect | ~$0.50 (phone calls) |
| AWS Lambda | < $0.01 |
| Amazon DynamoDB | < $0.01 |
| Amazon Bedrock | ~$1-2 (AI inference) |
| **Total** | **~$2-3** |

⚠️ **Important:** Remember to clean up resources after the workshop to avoid ongoing charges.

---

## Amazon Connect Deployment Prerequisites

Before starting the workshop, you'll need to:
1. Create an Amazon Connect instance
2. Enable Amazon Connect Assistant
3. Verify your setup

**Estimated time: 20-25 minutes**

### Step 1: Create Amazon Connect Instance

#### 1.1 Navigate to Amazon Connect Console
- Ensure you're in a supported AWS region (us-east-1 recommended)
- Open the Amazon Connect console
- Click **Add an instance**

#### 1.2 Configure Identity Management
- **Identity management:** Select "Store users within Amazon Connect"
- **Access URL:** Enter a unique alias (e.g., `betterbank-workshop-[your-initials]`)
- Click **Next**

#### 1.3 Configure Administrator
- **Add a new admin:** Select Yes
- Enter username, password, first name, last name, and email
- Click **Next**

#### 1.4 Configure Telephony
- **Incoming calls:** ✅ Enable
- **Outgoing calls:** ✅ Enable
- Click **Next**

#### 1.5 Configure Data Storage
- Accept default settings
- Click **Next**

#### 1.6 Review and Create
- Review your configuration
- Click **Create instance**
- Wait 2-3 minutes for instance creation

### Step 2: Enable Amazon Connect Assistant (Q in Connect)

#### Creating your Knowledge Base
1. Navigate to the Amazon S3 console
2. Create a new bucket for knowledge base content

#### Creating your Connect Assistant
1. Navigate to your Amazon Connect instance
2. In the navigation pane, choose **Connect Assistant** or **Amazon Q**
3. Click **Add domain**
4. Choose **Create a new domain**
5. Enter a domain name (e.g., your organization name)
6. Configure encryption with AWS KMS Key
7. Click **Add domain**

---

## Module 1: Deploy the Backend

In this module, you'll deploy the card operations backend that powers the AI assistant. This includes:
- AWS Lambda function for business logic
- MCP Tool Lambda wrappers
- Amazon DynamoDB tables for data storage
- Test data for demonstration

**Duration: ~30 minutes**

> **Note:** This architecture does NOT use API Gateway. Instead, AgentCore Gateway invokes Lambda functions directly via MCP protocol.

### Step 1.1: Clone the Repository

```bash
git clone https://github.com/your-org/banking-connect-ai.git
cd banking-connect-ai
```

Verify the project structure:
```
├── config/              # Configuration files
├── docs/                # Documentation
├── scripts/             # Deployment scripts
├── src/                 # Source code
│   ├── lambda_handler/  # Lambda handlers
│   ├── mcp_server/      # MCP server code
│   └── shared/          # Shared utilities
├── template.yaml        # CloudFormation template
└── requirements.txt     # Python dependencies
```

### Step 1.2: Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 1.3: Package the Lambda Function

```bash
./scripts/package.sh
```

This creates `lambda-deployment.zip` containing:
- `src/lambda_handler/` - Lambda handler code
- `src/shared/` - Shared utilities (auth, repositories, etc.)

### Step 1.4: Create S3 Bucket for Deployment

```bash
# Set your bucket name (must be globally unique)
BUCKET_NAME="banking-workshop-$(aws sts get-caller-identity --query Account --output text)"
REGION="us-east-1"

# Create the bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Upload the Lambda package
aws s3 cp lambda-deployment.zip s3://$BUCKET_NAME/
```

### Step 1.5: Deploy with CloudFormation

```bash
# Set variables
STACK_NAME="betterbank-card-operations"
REGION="us-east-1"

# Deploy the stack
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name $STACK_NAME \
  --parameter-overrides \
    Environment=dev \
    LambdaCodeBucket=$BUCKET_NAME \
    LambdaCodeKey=lambda-deployment.zip \
  --capabilities CAPABILITY_NAMED_IAM \
  --region $REGION
```

Wait for the deployment to complete (approximately 3-5 minutes).

### Step 1.6: Retrieve Stack Outputs

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
  --output text)

echo "Lambda ARN: $LAMBDA_ARN"
```

📝 **Save this value!** You'll need it in Module 2.

### What This Creates

| Resource | Name | Purpose |
|----------|------|---------|
| Lambda Function | `bank-card-operations-dev` | Core business logic |
| DynamoDB Tables | customers, cards, accounts, card-requests | Data storage |
| IAM Roles | Lambda execution role | Permissions for Lambda |

### Step 1.7: Seed Test Data

```bash
python3 scripts/seed_data_aws.py --stack-name $STACK_NAME --region $REGION
```

This creates the following test data:

**Customers:**
| Customer ID | Name | Phone |
|-------------|------|-------|
| CUST001 | John Doe | +1-555-0101 |
| CUST002 | Jane Smith | +1-555-0102 |
| CUST003 | Bob Johnson | +1-555-0103 |

**Cards:**
| Card ID | Account | Last 4 | Status |
|---------|---------|--------|--------|
| CARD001 | ACC001 | 1234 | active |
| CARD002 | ACC002 | 5678 | active |
| CARD003 | ACC003 | 9012 | locked |
| CARD004 | ACC004 | 3456 | active |

### Module 1 Checkpoint

Before proceeding, verify:
- ✅ CloudFormation stack deployed successfully
- ✅ Lambda function created
- ✅ DynamoDB tables created with test data
- ✅ You have saved the Lambda ARN

---

## Module 2: Configure AgentCore Gateway

In this module, you'll set up Amazon Bedrock AgentCore Gateway to expose your Lambda functions as MCP (Model Context Protocol) tools that the AI agent can use.

**Duration: ~20 minutes**

> **Key Difference:** Unlike the API Gateway approach, we're adding Lambda functions directly as Gateway targets. The Gateway invokes Lambdas using MCP protocol - no REST API needed!

### What is AgentCore Gateway?

AgentCore Gateway acts as a bridge between AI agents and your backend:

```
AI Agent (Q in Connect)
        │
        │ MCP Tool Call: {"tool": "lock_card", "arguments": {...}}
        ▼
AgentCore Gateway
        │
        │ Invokes Lambda directly
        ▼
MCP Tool Lambda (mcp-tool-lock-card-dev)
        │
        │ Translates MCP → REST-style payload
        ▼
Card Operations Lambda (bank-card-operations-dev)
        │
        ▼
DynamoDB
```

### Step 2.1: Navigate to AgentCore Gateway

1. Open **AWS Console** → **Amazon Bedrock** → **AgentCore** → **Gateways**
2. Click **Create gateway**

### Step 2.2: Configure Gateway Settings

| Setting | Value |
|---------|-------|
| Gateway name | `betterbank-card-ops` |
| Description | Card operations gateway for Connect integration |
| Protocol | MCP (Model Context Protocol) |

**Configure Authorizer:**
| Setting | Value |
|---------|-------|
| Type | Custom JWT |
| Identity source | OIDC |
| Discovery URL | `https://<your-connect-instance>.my.connect.aws/.well-known/openid-configuration` |

> 📝 Replace `<your-connect-instance>` with your actual Connect instance alias

Click **Create gateway** and wait for status: **ACTIVE**

### Step 2.3: Deploy MCP Tool Lambdas

Run the deployment script to create the MCP tool wrapper Lambdas:

```bash
# First, update the configuration in the script
# Edit scripts/deploy_mcp_tools.py and set:
# - ACCOUNT_ID = "your-aws-account-id"
# - GATEWAY_ID = "your-gateway-id"
# - CARD_OPS_FUNCTION = "bank-card-operations-dev"

python3 scripts/deploy_mcp_tools.py
```

This script creates 4 Lambda functions that wrap the main card operations Lambda:

| Lambda | Purpose | MCP Tool |
|--------|---------|----------|
| `mcp-tool-get-cards-dev` | Get customer's cards | get_cards |
| `mcp-tool-lock-card-dev` | Lock a card | lock_card |
| `mcp-tool-unlock-card-dev` | Unlock a card | unlock_card |
| `mcp-tool-request-new-card-dev` | Request replacement | request_new_card |

### How MCP Tool Lambdas Work

Each MCP Tool Lambda is a thin wrapper that:
1. Receives MCP-format input from AgentCore Gateway
2. Translates it to REST-style payload
3. Invokes the main card operations Lambda
4. Returns the result

Example `mcp-tool-lock-card-dev` code:
```python
def handler(event, context):
    # event = {"customer_id": "CUST002", "card_id": "CARD003"}
    
    payload = {
        "httpMethod": "POST",
        "path": "/v1/cards/lock",
        "body": json.dumps(event)
    }
    
    response = lambda_client.invoke(
        FunctionName="bank-card-operations-dev",
        Payload=json.dumps(payload)
    )
    
    return json.loads(response["Payload"].read())
```

### Step 2.4: Add Lambda Targets to Gateway

The deployment script automatically adds each Lambda as a Gateway target with MCP tool schema.

If you need to add them manually:

1. Go to **AgentCore** → **Gateways** → Select your gateway
2. Click **Add target**
3. Configure:

**get_cards tool:**
| Setting | Value |
|---------|-------|
| Target type | Lambda |
| Target name | get-cards-tool |
| Lambda ARN | `arn:aws:lambda:us-east-1:{account}:function:mcp-tool-get-cards-dev` |

**Tool Schema:**
```json
{
  "name": "get_cards",
  "description": "Get all debit cards for a customer",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Customer identifier (e.g., CUST001)"
      }
    },
    "required": ["customer_id"]
  }
}
```

Repeat for `lock_card`, `unlock_card`, and `request_new_card`.

### Step 2.5: Update Inbound Audience

1. Copy the **Gateway ID** from the Gateway details
2. Click **Edit** on the Inbound Identity
3. Paste the Gateway ID in the **Audiences** text box
4. Ensure **Allowed clients** is unchecked
5. Save changes

### Step 2.6: Note Gateway URL

Save the Gateway URL:
```
https://{gateway-id}.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
```

### Module 2 Checkpoint

Before proceeding, verify:
- ✅ Gateway created and status is ACTIVE
- ✅ 4 MCP Tool Lambdas deployed
- ✅ 4 Lambda targets added to Gateway (all showing READY)
- ✅ Tools visible: get_cards, lock_card, unlock_card, request_new_card
- ✅ Gateway URL saved

### Troubleshooting

**Target Status Stuck on "CREATING":**
- Check Lambda function exists
- Verify IAM permissions for Gateway to invoke Lambda

**"Permission Denied" errors:**
- Add Lambda invoke permission for AgentCore:
```bash
aws lambda add-permission \
  --function-name mcp-tool-lock-card-dev \
  --statement-id AllowAgentCoreGateway \
  --action lambda:InvokeFunction \
  --principal bedrock-agentcore.amazonaws.com
```

---

## Module 3: Set Up Amazon Connect

In this module, you'll configure Amazon Connect to handle voice calls and integrate with the AI agent.

**Duration: ~30 minutes**

### Architecture Overview

```
Phone Call → Connect → Customer Profiles → Session Lambda → Lex → AI Agent
```

### Step 3.1: Deploy Session Update Lambda

This Lambda passes customer data to the AI session using the UpdateSessionData API:

```bash
python3 scripts/deploy_session_lambda.py
```

Or deploy manually:

1. Create Lambda function: `qconnect-update-session-data`
2. Use code from `src/lambda_handler/update_session_data.py`
3. Set environment variable: `ASSISTANT_ID` = your Q Connect Assistant ID
4. Attach IAM policy with `wisdom:UpdateSessionData` permission

### Step 3.2: Create a Lex Bot

1. Log in to Amazon Connect admin: `https://[your-instance].my.connect.aws/`
2. Navigate to **Routing** → **Flows** → **Bots**
3. Click **Create Conversational AI bot**
4. Configure:
   - **Bot name:** `betterbank_assistant`
   - **Bot description:** Bot for banking AI agent
5. Click **Create**

**Add Language and Intent:**
1. Click **Add language** → Select **English (US)**
2. Navigate to **Configuration** tab
3. Find **Amazon Connect AI agent** toggle → Enable
4. Select your Connect Assistant ARN
5. Click **Build language**
6. Wait for build to complete (~2 minutes)

### Step 3.3: Enable Customer Profiles

1. In Connect Console, go to **Customer Profiles**
2. If not enabled, click **Enable Customer Profiles**
3. Create domain: `amazon-connect-{instance-name}`

**Add Test Customer Profile:**
1. Go to **Customer profiles** → **All profiles**
2. Click **Create profile**
3. Enter:
   - **First name:** Jane
   - **Last name:** Smith
   - **Phone number:** +15550102 (your test phone)
   - **Account Number:** CUST002

> **Important:** The `AccountNumber` field is used to pass customer_id to the AI agent!

### Step 3.4: Create Contact Flow

1. In Connect, go to **Routing** → **Contact flows**
2. Click **Create flow**
3. Name: `BetterBank Main Flow`

**Add these blocks in order:**

#### Block 1: Get Customer Profile
- **Type:** Get customer profile
- **Search by:** Phone = `$.CustomerEndpoint.Address`
- **Response fields:** FirstName, LastName, AccountNumber, EmailAddress

#### Block 2: Invoke AWS Lambda
- **Type:** Invoke AWS Lambda function
- **Function:** `qconnect-update-session-data`
- **Parameters:**
  - `customerId` = `$.Customer.AccountNumber`
  - `firstName` = `$.Customer.FirstName`
  - `lastName` = `$.Customer.LastName`
  - `email` = `$.Customer.EmailAddress`

#### Block 3: Set Voice
- **Voice:** Danielle
- **Engine:** Generative

#### Block 4: Get Customer Input (Lex)
- **Type:** Get customer input
- **Bot:** `betterbank_assistant`
- **Alias:** Select your alias

#### Block 5: Disconnect
- Connect the flow end to Disconnect block

**Publish the flow:**
1. Click **Save**
2. Click **Publish**

### Step 3.5: Assign Phone Number

1. Go to **Channels** → **Phone numbers**
2. Claim a new number or select existing
3. Under **Contact flow / IVR:** Select `BetterBank Main Flow`
4. Click **Save**

📝 Note your phone number for testing!

### Module 3 Checkpoint

Before proceeding, verify:
- ✅ Session Lambda deployed with correct ASSISTANT_ID
- ✅ Lex bot created and built successfully
- ✅ Customer Profiles enabled with test profile
- ✅ Contact flow created with all blocks connected
- ✅ Phone number assigned to contact flow

---

## Module 4: Create the AI Agent

In this module, you'll create the Amazon Bedrock AI agent that powers the intelligent conversation.

**Duration: ~20 minutes**

### Step 4.1: Access AI Agent Designer

1. Open your Amazon Connect instance
2. In the left navigation, go to **Amazon Q** → **AI Agents**
3. Click **Create agent**

### Step 4.2: Configure Basic Settings

| Setting | Value |
|---------|-------|
| Agent name | `BetterBank Assistant` |
| Description | AI assistant for card management operations |
| Agent type | **ORCHESTRATION** |

⚠️ **Important:** Select ORCHESTRATION type, not SELF_SERVICE. Orchestration agents can use external tools.

### Step 4.3: Configure the AI Model

| Setting | Value |
|---------|-------|
| Model | Claude 3 Sonnet (or Nova Pro) |
| Temperature | 0.7 |
| Max tokens | 1024 |

### Step 4.4: Add System Prompt

Enter this system prompt:

```
You are BetterBank Assistant, the AI assistant for BetterBank.

When helping customers with card operations:
- The customer's ID is provided as {{$.Custom.customerId}}
- Use this customer_id when calling get_cards, lock_card, unlock_card, or request_new_card tools
- Do not ask the customer for their customer ID - it is already known

Available tools:
- get_cards: View customer's cards (requires customer_id)
- lock_card: Lock a card (requires customer_id, card_id)
- unlock_card: Unlock a card (requires customer_id, card_id)
- request_new_card: Request replacement (requires customer_id, account_id)

Guidelines:
- Always call get_cards first to find card IDs before locking/unlocking
- Be empathetic when customers report lost or stolen cards
- Confirm actions before and after performing them
- If you cannot help, offer to transfer to a human agent
```

### Step 4.5: Add MCP Tools

1. Click **Add tool**
2. Select **MCP Tool**
3. Choose your gateway: `betterbank-card-ops`
4. Add each tool:

| Tool | Description |
|------|-------------|
| get_cards | Get all debit cards for a customer |
| lock_card | Lock a card to prevent transactions |
| unlock_card | Unlock a previously locked card |
| request_new_card | Request a replacement card |

### Step 4.6: Add Escalate Tool

1. Click **Add tool**
2. Select **Escalate**
3. Configure escalation examples for when to transfer to human agents

### Step 4.7: Set as Default Self-Service Agent

1. Go to **AI Agents** main page
2. Scroll to **Default AI Agent Configurations**
3. In the **Self-service** row, click **Edit**
4. Select your agent: `BetterBank Assistant`
5. Save

### Module 4 Checkpoint

Before proceeding, verify:
- ✅ Agent created with ORCHESTRATION type
- ✅ System prompt configured
- ✅ All 4 MCP tools added
- ✅ Escalate tool configured
- ✅ Agent set as default Self-service agent

---

## Module 5: Test and Validate

In this final module, you'll test the complete end-to-end integration.

**Duration: ~15 minutes**

### Level 1: Agent Testing (Console)

1. Go to **Amazon Q** → **AI Agents**
2. Select your agent: `BetterBank Assistant`
3. Click **Test**

**Test Scenario A: Lock Card**
```
You: I lost my wallet and need to lock my card
```
Expected: Agent calls get_cards, lists cards, asks which to lock, then calls lock_card.

**Test Scenario B: Unlock Card**
```
You: I found my card, can you unlock it?
```
Expected: Agent identifies locked card and calls unlock_card.

**Test Scenario C: Request Replacement**
```
You: My card is damaged, I need a new one
```
Expected: Agent calls request_new_card and provides delivery estimate.

### Level 2: End-to-End Phone Testing

1. Call your Connect phone number
2. Wait for greeting
3. Say: "I need to lock my card"
4. Follow the conversation
5. Verify card status changed in DynamoDB

**Expected Flow:**
```
System: "Hello, welcome to BetterBank. How can I help you today?"
You: "I need to lock my card"
System: "I can help with that. I see you have cards ending in 9012 and 3456..."
You: "Lock the one ending in 3456"
System: "I've locked your card ending in 3456. Is there anything else?"
You: "No, that's all"
System: "Thank you for calling. Goodbye!"
```

### Troubleshooting Common Issues

**"Technical difficulties" message:**
- AI agent not set as default Self-service agent
- Agent type is SELF_SERVICE instead of ORCHESTRATION
- Tools not properly configured
- Gateway not ACTIVE

**Tool calls fail:**
- Check AgentCore Gateway logs in CloudWatch
- Verify Lambda permissions
- Check MCP Tool Lambda is invoking correct function

**Customer not recognized:**
- Verify phone number format (E.164: +15550102)
- Check Customer Profile has AccountNumber field
- Review contact flow Lambda parameters

**Empty customer_id:**
- Ensure Lambda parameter is `$.Customer.AccountNumber`
- Verify Customer Profile has AccountNumber populated
- Check Session Lambda logs

### CloudWatch Log Groups

| Component | Log Group |
|-----------|-----------|
| Session Lambda | `/aws/lambda/qconnect-update-session-data` |
| Card Ops Lambda | `/aws/lambda/bank-card-operations-dev` |
| MCP Tool Lambdas | `/aws/lambda/mcp-tool-*-dev` |
| AgentCore Gateway | `/aws/vendedlogs/bedrock-agentcore/gateway/APPLICATION_LOGS/<gateway-id>` |

---

## 🎉 Congratulations!

You've successfully built an AI-powered banking assistant that can:
- ✅ Handle natural language voice requests
- ✅ Lock and unlock debit cards
- ✅ Request replacement cards
- ✅ Seamlessly escalate to human agents

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    Complete Architecture                         │
│                                                                  │
│  Phone Call                                                      │
│      │                                                           │
│      ▼                                                           │
│  Amazon Connect ──▶ Customer Profiles ──▶ Session Lambda        │
│      │                                                           │
│      ▼                                                           │
│  Lex Bot ──▶ Q in Connect ──▶ AI Agent (BetterBank Assistant)                 │
│      │                                                           │
│      ▼                                                           │
│  AgentCore Gateway                                               │
│      │                                                           │
│      ▼                                                           │
│  MCP Tool Lambdas ──▶ Card Operations Lambda ──▶ DynamoDB       │
└─────────────────────────────────────────────────────────────────┘
```

### Lambda Functions Summary

| Lambda | Purpose |
|--------|---------|
| `qconnect-update-session-data` | Pass customer data to AI session |
| `mcp-tool-get-cards-dev` | MCP wrapper for get_cards |
| `mcp-tool-lock-card-dev` | MCP wrapper for lock_card |
| `mcp-tool-unlock-card-dev` | MCP wrapper for unlock_card |
| `mcp-tool-request-new-card-dev` | MCP wrapper for request_new_card |
| `bank-card-operations-dev` | Core business logic |

### Key Differences from API Gateway Approach

| Aspect | API Gateway Approach | This Approach (No API GW) |
|--------|---------------------|---------------------------|
| Tool invocation | Gateway → API GW → Lambda | Gateway → Lambda directly |
| Authentication | API Key in header | IAM-based |
| Translation layer | OpenAPI spec | MCP Tool Lambdas |
| Cost | API GW charges | No API GW charges |
| Complexity | More components | Fewer components |

---

## Module 6: Clean Up Resources

To avoid ongoing AWS charges:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name betterbank-card-operations

# Delete MCP Tool Lambdas
aws lambda delete-function --function-name mcp-tool-get-cards-dev
aws lambda delete-function --function-name mcp-tool-lock-card-dev
aws lambda delete-function --function-name mcp-tool-unlock-card-dev
aws lambda delete-function --function-name mcp-tool-request-new-card-dev

# Delete Session Lambda
aws lambda delete-function --function-name qconnect-update-session-data

# Delete S3 bucket
aws s3 rb s3://$BUCKET_NAME --force
```

Also delete via console:
- AgentCore Gateway
- Lex Bot
- Connect Contact Flow
- Customer Profiles (optional)

---

## Resources

- [Amazon Connect Documentation](https://docs.aws.amazon.com/connect/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Q in Connect Documentation](https://docs.aws.amazon.com/connect/latest/adminguide/amazon-q-connect.html)
- [AgentCore Gateway Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html)
