# Bank MCP Server

Model Context Protocol (MCP) server that exposes card operation tools for AI agent integration.

## What is MCP?

MCP (Model Context Protocol) is a standard way for AI agents to interact with external tools and services. This server exposes three card management tools that Jeanie (the AI banking agent) can use to help customers.

## Available Tools

### 1. lock_card
Lock a customer's debit card to prevent transactions.

**Parameters:**
- `customer_id` (required): Customer identifier (e.g., "CUST001")
- `card_id` (required): Card identifier (e.g., "CARD001")

**Example:**
```json
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### 2. unlock_card
Unlock a customer's debit card to restore transaction capability.

**Parameters:**
- `customer_id` (required): Customer identifier
- `card_id` (required): Card identifier

**Example:**
```json
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### 3. request_new_card
Request a replacement debit card for a customer.

**Parameters:**
- `customer_id` (required): Customer identifier
- `account_id` (required): Account identifier (e.g., "ACC001")
- `reason` (optional): Reason for replacement
- `delivery_address` (optional): Delivery address

**Example:**
```json
{
  "customer_id": "CUST001",
  "account_id": "ACC001",
  "reason": "Lost card",
  "delivery_address": "123 Main St, Cincinnati, OH 45202"
}
```

## Running the MCP Server

### Start the server:
```bash
python src/mcp_server/server.py
```

The server runs in stdio mode, communicating via standard input/output.

### Test the server:
```bash
python scripts/test_mcp_server.py
```

## How It Works

```
AI Agent (Jeanie)
    ↓
MCP Server (this)
    ↓
Lambda Handler
    ↓
DynamoDB
```

1. AI agent calls MCP tool (e.g., "lock_card")
2. MCP server validates parameters
3. MCP server invokes Lambda handler
4. Lambda handler processes request
5. Response flows back to AI agent

## Integration with AI Agents

### Kiro Configuration

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "bank-cards": {
      "command": "python",
      "args": ["src/mcp_server/server.py"],
      "cwd": "/path/to/bank-card-operations",
      "disabled": false
    }
  }
}
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bank-cards": {
      "command": "python",
      "args": ["src/mcp_server/server.py"],
      "cwd": "/path/to/bank-card-operations"
    }
  }
}
```

## Error Handling

The MCP server handles all errors gracefully and returns structured error responses:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed. Please verify your credentials."
  }
}
```

## Security

- All operations require valid customer authentication
- Authorization checks ensure customers can only access their own cards
- No sensitive data exposed in error messages
- All operations logged for audit trail

## Development

The MCP server is a thin wrapper around the Lambda handler, making it easy to:
- Test locally without AWS
- Deploy to production with minimal changes
- Maintain consistency between local and cloud environments
