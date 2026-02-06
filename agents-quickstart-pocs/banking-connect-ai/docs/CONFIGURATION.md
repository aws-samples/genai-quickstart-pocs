# Configuration Guide

Configure AgentCore Gateway with Lambda targets and MCP tool schemas.

## Overview

**IMPORTANT: Complete these steps in order:**

1. **Prerequisites**: Amazon Connect instance must be created first (see [Prerequisites](PREREQUISITES.md#amazon-connect-setup))
2. **Step 1**: Create AgentCore Gateway with Discovery URL and add first target
3. **Step 2**: Add remaining Lambda targets to the Gateway
4. **Step 3**: Create MCP server application in Amazon Connect (associates Gateway with Connect)

**Lambda permissions are automatically configured during deployment!**

---

## Prerequisites

Before starting configuration:

✅ **Amazon Connect instance created** - See [Prerequisites](PREREQUISITES.md#amazon-connect-setup)  
✅ **Amazon Q in Connect Assistant enabled**  
✅ **Infrastructure deployed** - Lambda functions, DynamoDB tables, IAM roles  
✅ **Connect Instance ARN saved** - Found in Connect Console → Instance settings  
✅ **Connect Instance Alias known** - The alias you chose during Connect setup (e.g., `betterbank-js-20240115`)

---

## Step 1: Create AgentCore Gateway with Discovery URL

### Get Connect Instance Information

Before creating the Gateway, gather these values from your Amazon Connect instance:

1. **Connect Instance ARN**
   - Go to **Amazon Connect Console** → Select your instance → **Instance settings**
   - Copy the **Instance ARN**
   - Example: `arn:aws:connect:us-east-1:123456789012:instance/abcd-1234-efgh-5678`

2. **Connect Instance Alias**
   - This is the alias you chose when creating the Connect instance
   - Example: `betterbank-js-20240115`

3. **Discovery URL** (construct from alias)
   - Format: `https://[ALIAS].my.connect.aws/.well-known/openid-configuration`
   - Example: `https://betterbank-js-20240115.my.connect.aws/.well-known/openid-configuration`
   - Replace `[ALIAS]` with your actual Connect instance alias

**Save these values** - you'll need them for Gateway creation.

### Create Gateway via AWS Console

1. **Navigate to AgentCore Gateway**
   - Open AWS Console
   - Go to **Amazon Bedrock** → **AgentCore Gateway**
   - Click **Create gateway**

2. **Configure Gateway Details**
   - **Gateway name**: `betterbank-card-operations-gateway-dev`
   - Click **Additional configurations - optional** to expand

3. **Configure Discovery URL** (IMPORTANT!)
   - Under **Additional configurations**, find **Discovery URL**
   - Paste your Discovery URL: `https://[YOUR-ALIAS].my.connect.aws/.well-known/openid-configuration`
   - Example: `https://betterbank-js-20240115.my.connect.aws/.well-known/openid-configuration`

4. **Configure Inbound Auth** (leave default)
   - Select **Use JSON Web Tokens (JWTs)**
   - **JWT schema configuration**: Quick create configuration with Cognito - recommended

5. **Configure Permissions**
   - **IAM Permissions**: Select **Use an existing service role**
   - **Service role name**: Paste the **Gateway Role ARN** from deployment output
     - Example: `arn:aws:iam::123456789012:role/betterbank-gateway-role-dev`

6. **Add First Target** (target-quick-start section at bottom)
   - **Target name**: `lock-card-target`
   - **Target description**: `Lock a customer's debit card to prevent transactions`
   - **Target type**: Select **MCP server**
   - **MCP endpoint**: Paste the **Lambda ARN** for lock_card from deployment output
     - Example: `arn:aws:lambda:us-east-1:123456789012:function:betterbank-mcp-lock-card-dev`
   - **MCP endpoint inline schema**: Copy and paste the schema below:

```json
{
  "name": "lock_card",
  "description": "Lock a customer's debit card to prevent transactions. Use this when a customer reports their card as lost, stolen, or suspects fraudulent activity. The card can be unlocked later.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Unique identifier for the customer (e.g., CUST001)"
      },
      "card_id": {
        "type": "string",
        "description": "Unique identifier for the card to lock (e.g., CARD001)"
      }
    },
    "required": ["customer_id", "card_id"]
  }
}
```

   - **Outbound auth configuration**: Select **IAM (client)**
   - Click **Create gateway**

7. **Save Gateway ID**
   - After creation, note the **Gateway ID** (e.g., `GATEWAY123ABC`)
   - You'll need this for adding remaining targets and connecting to Amazon Connect

### Create Gateway via AWS CLI

```bash
# Set your Connect instance alias
CONNECT_ALIAS="betterbank-js-20240115"  # Replace with your alias

# Construct Discovery URL
DISCOVERY_URL="https://${CONNECT_ALIAS}.my.connect.aws/.well-known/openid-configuration"

# Get Gateway Role ARN from deployment
GATEWAY_ROLE_ARN=$(aws cloudformation describe-stacks \
  --stack-name betterbank-mcp-lambda-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`GatewayRoleArn`].OutputValue' \
  --output text)

# Get Lock Card Lambda ARN
LOCK_ARN=$(aws cloudformation describe-stacks \
  --stack-name betterbank-mcp-lambda-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LockCardLambdaArn`].OutputValue' \
  --output text)

# Create Gateway with Discovery URL and first target
aws bedrock-agentcore create-gateway \
  --name "betterbank-card-operations-gateway-dev" \
  --description "Gateway for BetterBank card operations MCP tools" \
  --execution-role-arn "$GATEWAY_ROLE_ARN" \
  --discovery-url "$DISCOVERY_URL" \
  --targets "[{
    \"name\": \"lock-card-target\",
    \"description\": \"Lock a customer's debit card to prevent transactions\",
    \"targetType\": \"MCP_SERVER\",
    \"mcpEndpoint\": \"$LOCK_ARN\",
    \"authConfiguration\": {\"type\": \"IAM_CLIENT\"}
  }]" \
  --region us-east-1

# Save the Gateway ID from the response
```

**Expected Output:**
```json
{
  "gatewayId": "GATEWAY123ABC",
  "gatewayArn": "arn:aws:bedrock-agentcore:us-east-1:123456789012:gateway/GATEWAY123ABC",
  "name": "betterbank-card-operations-gateway-dev",
  "status": "CREATING"
}
```

Wait 1-2 minutes for status to change to `ACTIVE`.

### Verify Gateway Status

```bash
aws bedrock-agentcore get-gateway \
  --gateway-id "GATEWAY123ABC" \
  --query 'status' \
  --output text
```

Should return: `ACTIVE`

---

## Step 2: Add Remaining Lambda Targets

Now that the gateway is created with the first target, add the remaining two targets.

### Target 2: unlock_card

**Lambda ARN:** Get from deployment output (`UnlockCardLambdaArn`)

**Target Name:** `unlock-card-target`

**Target Description:** `Unlock a customer's debit card to restore transaction capability`

**Inline Schema:**
```json
{
  "name": "unlock_card",
  "description": "Unlock a customer's debit card to restore transaction capability. Use this when a customer has found their card or resolved the security concern that caused them to lock it.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Unique identifier for the customer (e.g., CUST001)"
      },
      "card_id": {
        "type": "string",
        "description": "Unique identifier for the card to unlock (e.g., CARD001)"
      }
    },
    "required": ["customer_id", "card_id"]
  }
}
```

**When AI uses this:** Customer says "I found my card", "Unlock my card", "Restore my card"

---

### Target 3: request_new_card

**Lambda ARN:** Get from deployment output (`RequestNewCardLambdaArn`)

**Target Name:** `request-new-card-target`

**Target Description:** `Request a replacement debit card for a customer`

**Inline Schema:**
```json
{
  "name": "request-new-card",
  "description": "Request a replacement debit card for a customer. Use this when a customer's card is damaged, permanently lost, stolen, or expired. A new card will be mailed to the customer.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "Unique identifier for the customer (e.g., CUST001)"
      },
      "account_id": {
        "type": "string",
        "description": "Unique identifier for the account (e.g., ACC001)"
      },
      "reason": {
        "type": "string",
        "description": "Optional reason for requesting a new card (e.g., 'Lost card', 'Damaged')"
      },
      "delivery_address": {
        "type": "string",
        "description": "Optional delivery address if different from address on file"
      }
    },
    "required": ["customer_id", "account_id"]
  }
}
```

**When AI uses this:** Customer says "I need a new card", "Order replacement card", "Send me a new card"

---

## Adding Targets via Console

### Navigate to Gateway

1. AWS Console → Bedrock → AgentCore Gateway
2. Select your gateway (`betterbank-card-operations-gateway-dev`)
3. Click **Targets** tab
4. Click **Add target**

### Add Each Remaining Target

For unlock_card and request_new_card targets:

1. Click **Add target**
2. **Target name**: Use the name from above (e.g., `unlock-card-target`)
3. **Target description**: Use the description from above
4. **Target type**: Select **MCP server**
5. **MCP endpoint**: Paste the Lambda ARN from deployment output
6. **MCP endpoint inline schema**: Copy and paste the inline schema from above
7. **Outbound auth configuration**: Select **IAM (client)**
8. Click **Add target**

### Verify Targets

After adding all targets, you should see 3 targets:
- `lock-card-target` → `betterbank-mcp-lock-card-dev`
- `unlock-card-target` → `betterbank-mcp-unlock-card-dev`
- `request-new-card-target` → `betterbank-mcp-request-new-card-dev`

---

## Adding Targets via CLI

```bash
# Get Gateway ID (if you didn't save it)
GATEWAY_ID=$(aws bedrock-agentcore list-gateways \
  --query 'gateways[?name==`betterbank-card-operations-gateway-dev`].gatewayId' \
  --output text)

# Get Lambda ARNs from deployment
UNLOCK_ARN=$(aws cloudformation describe-stacks \
  --stack-name betterbank-mcp-lambda-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`UnlockCardLambdaArn`].OutputValue' \
  --output text)

REQUEST_ARN=$(aws cloudformation describe-stacks \
  --stack-name betterbank-mcp-lambda-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`RequestNewCardLambdaArn`].OutputValue' \
  --output text)

# Add unlock_card target
aws bedrock-agentcore create-gateway-target \
  --gateway-id "$GATEWAY_ID" \
  --name "unlock-card-target" \
  --description "Unlock a customer's debit card to restore transaction capability" \
  --target-type "MCP_SERVER" \
  --mcp-endpoint "$UNLOCK_ARN" \
  --auth-configuration '{"type": "IAM_CLIENT"}'

# Add request_new_card target
aws bedrock-agentcore create-gateway-target \
  --gateway-id "$GATEWAY_ID" \
  --name "request-new-card-target" \
  --description "Request a replacement debit card for a customer" \
  --target-type "MCP_SERVER" \
  --mcp-endpoint "$REQUEST_ARN" \
  --auth-configuration '{"type": "IAM_CLIENT"}'
```

---

## MCP Server Configuration

The Lambda functions are already configured as MCP servers. When AgentCore Gateway invokes them, they automatically:

1. **Handle MCP Protocol**: Accept `tools/list` and `tools/call` methods
2. **Validate Input**: Check parameters against schemas
3. **Execute Operations**: Call the Card Operations Lambda
4. **Return Results**: Format responses in MCP protocol

**No additional MCP schema configuration needed!** The Lambda functions handle the MCP protocol internally.

---

## Understanding MCP in This Architecture

### What is MCP?

Model Context Protocol (MCP) is a standard protocol for AI agents to interact with tools. In this architecture:

- **MCP Lambda Functions**: Implement the MCP protocol and act as adapters
- **Card Operations Lambda**: Contains the actual business logic
- **AgentCore Gateway**: Routes requests to MCP Lambda functions

### How It Works

1. **Bedrock Agent** receives customer request
2. **Agent analyzes** intent and selects appropriate tool
3. **AgentCore Gateway** invokes the MCP Lambda target
4. **MCP Lambda** validates parameters and calls Card Operations Lambda
5. **Card Operations Lambda** executes business logic (lock/unlock/request)
6. **Response** flows back through MCP Lambda → Gateway → Agent → Customer

### Target Descriptions

The target descriptions you provide when adding targets help the AI decide when to use each tool:

- **lock-card-target**: "Lock a customer's debit card to prevent transactions"
- **unlock-card-target**: "Unlock a customer's debit card to restore transaction capability"  
- **request-new-card-target**: "Request a replacement debit card for a customer"

Make these descriptions clear and specific so the AI can select the right tool based on customer intent.

---

## Troubleshooting

### Cannot select Connect instance when creating MCP application

**Error**: "You can only select the instance that is configured with the selected Gateway's Discovery URL"

**Solution:** 
- Verify you configured the Discovery URL in Step 1 when creating the Gateway
- The Discovery URL format must be: `https://[ALIAS].my.connect.aws/.well-known/openid-configuration`
- The alias in the Discovery URL must match your Connect instance alias
- If you forgot to add it, edit the Gateway and add the Discovery URL, then try again

### Gateway not appearing in Connect dropdown

**Solution:**
- Verify the Gateway was created successfully and is in ACTIVE status
- Ensure the Gateway has the Discovery URL configured
- Check that you're in the same AWS region for both Connect and the Gateway
- Refresh the Connect console page

### Gateway creation fails

**Solution:** 
- Verify the Gateway Role ARN is correct
- Ensure the role has trust relationship with `bedrock-agentcore.amazonaws.com`
- Check IAM permissions for creating gateways

### Target addition fails

**Solution:**
- Verify Lambda ARN is correct and Lambda exists
- Ensure Gateway is in ACTIVE status
- Check that Lambda has resource-based policy allowing AgentCore Gateway invocation (automatically added during deployment)

### Tool not being called by AI

**Solution:** Make the target description more specific about when to use the tool. The AI uses this to decide which tool to call.

### Lambda invocation fails

**Solution:** 
1. Verify Lambda ARN is correct
2. Check Gateway execution role has `lambda:InvokeFunction` permission
3. Check CloudWatch Logs for errors in both MCP Lambda and Card Operations Lambda

---

## Testing Configuration

### Test via Gateway

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

### Test Lambda Directly

```bash
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/call\",\"params\":{\"name\":\"lock_card\",\"arguments\":{\"customer_id\":\"CUST001\",\"card_id\":\"CARD001\"}},\"id\":1}"}' \
  response.json

cat response.json
```

---

## Step 3: Connect AgentCore Gateway to Amazon Connect

Now that the Gateway is created with the Discovery URL configured, you can create the MCP server application in Amazon Connect.

### Prerequisites

- Amazon Connect instance created
- Amazon Q in Connect Assistant enabled
- AgentCore Gateway created with Discovery URL and all 3 targets added

### Create MCP Server Application in Connect

1. **Navigate to Amazon Connect Console**
   - Open [Amazon Connect Console](https://console.aws.amazon.com/connect/)
   - Select your Connect instance
   - In the left navigation, go to **Third-party applications**
   - Click **Add application**

2. **Configure Basic Information**
   - **Display name**: `BetterBank Card Operations`
   - **Description** (optional): `MCP server for card lock, unlock, and replacement operations`
   - **Application type**: Select **MCP server**

3. **Configure Application Details**
   - **Gateway**: Select your gateway from the dropdown
     - Example: `betterbank-card-operations-gateway-dev`
   - If you don't see your gateway, verify it was created with the correct Discovery URL

4. **Configure Instance Association**
   - **Instance association**: Select your Connect instance
   - Since you configured the Discovery URL in Step 1, you should now be able to select your instance
   - The instance must match the Discovery URL you configured

5. **Create Application**
   - Click **Add application**
   - Wait for status to change to **Active** (1-2 minutes)

6. **Save Application ARN**
   - After creation, note the **Application ARN**
   - You'll need this when configuring Connect contact flows

### Verify MCP Server Application

1. Go to **Amazon Connect** → **Third-party applications**
2. You should see: `BetterBank Card Operations` with status **Active**
3. Click on the application to view details and verify the Gateway is correctly linked

### Configure via AWS CLI

```bash
# Get Gateway ID
GATEWAY_ID=$(aws bedrock-agentcore list-gateways \
  --query 'gateways[?name==`betterbank-card-operations-gateway-dev`].gatewayId' \
  --output text)

# Get Connect Instance ID (replace with your instance ID)
CONNECT_INSTANCE_ID="your-connect-instance-id"

# Create MCP server application in Connect
aws connect create-integration-association \
  --instance-id "$CONNECT_INSTANCE_ID" \
  --integration-type "MCP_SERVER" \
  --integration-arn "arn:aws:bedrock-agentcore:us-east-1:123456789012:gateway/$GATEWAY_ID" \
  --source-application-name "BetterBank Card Operations" \
  --source-application-url "https://betterbank.example.com"
```

### What This Does

Creating the MCP server application in Amazon Connect:
- **Links** your AgentCore Gateway to Amazon Connect
- **Enables** Amazon Q in Connect Assistant to discover and use your MCP tools
- **Allows** agents to invoke card operations during customer interactions
- **Provides** real-time tool execution within Connect contact flows

---

## Next Steps

- **Configure Bedrock Agent** (optional): See [Deployment Guide](DEPLOYMENT.md#configure-bedrock-agent) if you want agent-based interactions
- **Test in Amazon Connect**: Use the Connect Agent Workspace to test card operations
- **Configure Contact Flows**: Add the MCP tools to your Connect contact flows
- **Monitor**: Check CloudWatch Logs for each Lambda
- **Troubleshoot**: See [Troubleshooting Guide](TROUBLESHOOTING.md)

---

## Summary

You've now completed the configuration in the correct order:

✅ **Prerequisites**: Amazon Connect instance created first  
✅ **Step 1**: Created AgentCore Gateway with Discovery URL and first target (lock_card)  
✅ **Step 2**: Added remaining targets (unlock_card, request_new_card)  
✅ **Step 3**: Connected Gateway to Amazon Connect as MCP server application

Your Amazon Q in Connect Assistant can now use these tools to help customers with card operations during live interactions!

**Key Configuration Values to Save:**
- Connect Instance ARN: `arn:aws:connect:region:account:instance/instance-id`
- Connect Instance Alias: `your-alias`
- Discovery URL: `https://your-alias.my.connect.aws/.well-known/openid-configuration`
- Gateway ID: `GATEWAY123ABC`
- MCP Application ARN: `arn:aws:connect:region:account:instance/instance-id/integration-association/association-id`
