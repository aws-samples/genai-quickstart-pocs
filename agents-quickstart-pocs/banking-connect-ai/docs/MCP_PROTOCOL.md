# MCP Protocol

Model Context Protocol (MCP) implementation details for BetterBank Card Operations.

## What is MCP?

Model Context Protocol (MCP) is a standard protocol for AI agents to interact with tools and services. It provides:
- **Standardized communication**: Consistent way for AI to call tools
- **Tool discovery**: AI can list available tools
- **Parameter validation**: Ensures correct parameters are passed
- **Error handling**: Structured error responses

## Protocol Methods

### tools/list

Returns list of available tools with their schemas.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "lock_card",
        "description": "Lock a customers debit card...",
        "inputSchema": { ... }
      }
    ]
  },
  "id": 1
}
```

### tools/call

Executes a specific tool with provided arguments.

**Request:**
```json
{
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
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "Card successfully locked",
    "data": {
      "card_id": "CARD001",
      "status": "locked",
      "last_four": "1234"
    }
  },
  "id": 1
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": 403,
    "message": "Authorization failed. Customer does not own this card."
  },
  "id": 1
}
```

---

## Tool Schemas

### lock_card

**Purpose:** Lock a customers debit card to prevent transactions.

**Schema:**
```json
{
  "name": "lock_card",
  "description": "Lock a customers debit card to prevent transactions. Use this when a customer reports their card as lost, stolen, or suspects fraudulent activity. The card can be unlocked later.",
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

**Example Call:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "lock_card",
    "arguments": {
      "customer_id": "CUST001",
      "card_id": "CARD001"
    }
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Card successfully locked",
  "data": {
    "card_id": "CARD001",
    "status": "locked",
    "last_four": "1234",
    "locked_at": "2026-02-05T10:30:00Z"
  }
}
```

---

### unlock_card

**Purpose:** Unlock a customers debit card to restore transaction capability.

**Schema:**
```json
{
  "name": "unlock_card",
  "description": "Unlock a customers debit card to restore transaction capability. Use this when a customer has found their card or resolved the security concern that caused them to lock it.",
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

**Example Call:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "unlock_card",
    "arguments": {
      "customer_id": "CUST001",
      "card_id": "CARD001"
    }
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Card successfully unlocked",
  "data": {
    "card_id": "CARD001",
    "status": "active",
    "last_four": "1234",
    "unlocked_at": "2026-02-05T10:35:00Z"
  }
}
```

---

### request_new_card

**Purpose:** Request a replacement debit card for a customer.

**Schema:**
```json
{
  "name": "request_new_card",
  "description": "Request a replacement debit card for a customer. Use this when a customers card is damaged, permanently lost, stolen, or expired. A new card will be mailed to the customer.",
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

**Example Call:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "request_new_card",
    "arguments": {
      "customer_id": "CUST001",
      "account_id": "ACC001",
      "reason": "Lost card",
      "delivery_address": "123 Main St, City, State 12345"
    }
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Card replacement request created successfully",
  "data": {
    "request_id": "REQ001",
    "customer_id": "CUST001",
    "account_id": "ACC001",
    "reason": "Lost card",
    "delivery_address": "123 Main St, City, State 12345",
    "status": "pending",
    "estimated_delivery": "2026-02-12",
    "created_at": "2026-02-05T10:40:00Z"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_FAILED` | Customer authentication failed |
| `AUTHZ_FAILED` | Customer not authorized for this resource |
| `CARD_NOT_FOUND` | Card does not exist |
| `ACCOUNT_NOT_FOUND` | Account does not exist |
| `INVALID_REQUEST` | Request validation failed |
| `SERVICE_ERROR` | Internal service error |

---

## Implementation

### Lambda Handler Structure

Each MCP Lambda implements this pattern:

```python
def lambda_handler(event, context):
    # Parse MCP request
    body = json.loads(event.get('body', '{}'))
    method = body.get('method')
    params = body.get('params', {})
    request_id = body.get('id')
    
    # Handle tools/list
    if method == 'tools/list':
        return {
            'statusCode': 200,
            'body': json.dumps({
                'jsonrpc': '2.0',
                'result': {'tools': [...]},
                'id': request_id
            })
        }
    
    # Handle tools/call
    elif method == 'tools/call':
        tool_name = params.get('name')
        arguments = params.get('arguments', {})
        
        # Invoke card operations Lambda
        response = lambda_client.invoke(
            FunctionName=CARD_OPS_FUNCTION,
            Payload=json.dumps({
                'httpMethod': 'POST',
                'path': '/v1/cards/lock',
                'body': json.dumps(arguments)
            })
        )
        
        # Return MCP-formatted response
        return format_mcp_response(response, request_id)
```

### Request Flow

1. **AgentCore Gateway** sends MCP request to Lambda
2. **MCP Lambda** parses request and validates
3. **MCP Lambda** invokes Card Operations Lambda
4. **Card Operations Lambda** processes business logic
5. **MCP Lambda** formats response in MCP protocol
6. **AgentCore Gateway** returns response to Bedrock Agent

---

## Testing

### Test tools/list

```bash
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/list\",\"id\":1}"}' \
  response.json

cat response.json
```

### Test tools/call

```bash
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/call\",\"params\":{\"name\":\"lock_card\",\"arguments\":{\"customer_id\":\"CUST001\",\"card_id\":\"CARD001\"}},\"id\":1}"}' \
  response.json

cat response.json
```

---

## Next Steps

- **Configure Gateway**: See [Configuration Guide](CONFIGURATION.md)
- **Deploy**: See [Deployment Guide](DEPLOYMENT.md)
- **Architecture**: See [Architecture](ARCHITECTURE.md)
