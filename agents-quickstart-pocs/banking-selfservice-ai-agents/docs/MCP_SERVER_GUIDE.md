# MCP Server - Quick Start Guide

## What We Built

An **MCP (Model Context Protocol) server** that allows AI agents like Jeanie to perform card operations through natural conversation.

## The 3 Tools Available

1. **lock_card** - Lock a debit card
2. **unlock_card** - Unlock a debit card  
3. **request_new_card** - Request a replacement card

## Testing

All tests passed! ✅

```bash
python3 scripts/test_mcp_server.py
```

Results:
- ✓ List Tools - Shows all 3 available tools
- ✓ Lock Card - Successfully locks CARD001
- ✓ Unlock Card - Successfully unlocks CARD001
- ✓ Request New Card - Creates replacement request
- ✓ Unauthorized Access - Correctly blocks unauthorized attempts

## How to Use with AI Agents

### Option 1: Kiro (This IDE)

Add to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "bank-cards": {
      "command": "python3",
      "args": ["src/mcp_server/server.py"],
      "cwd": "/path/to/banking-selfservice-ai-agents",
      "disabled": false
    }
  }
}
```

Then restart Kiro and the AI will have access to the card operation tools!

### Option 2: Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "bank-cards": {
      "command": "python3",
      "args": ["src/mcp_server/server.py"],
      "cwd": "/path/to/banking-selfservice-ai-agents"
    }
  }
}
```

Restart Claude Desktop and it will have the tools available.

## Example Conversation

**User:** "I lost my debit card ending in 1234, can you lock it?"

**AI Agent:** *Uses lock_card tool*
- customer_id: CUST001
- card_id: CARD001

**Response:** "Your card ending in 1234 has been locked successfully. No transactions can be made with this card."

---

**User:** "I found it! Can you unlock it?"

**AI Agent:** *Uses unlock_card tool*
- customer_id: CUST001
- card_id: CARD001

**Response:** "Your card ending in 1234 has been unlocked. You can now use it for transactions."

---

**User:** "Actually, it's damaged. I need a new one."

**AI Agent:** *Uses request_new_card tool*
- customer_id: CUST001
- account_id: ACC001
- reason: "Damaged card"

**Response:** "I've submitted your card replacement request (REQ123ABC). Your new card will arrive by January 28, 2026."

## Architecture

```
Customer talks to AI Agent (Jeanie)
         ↓
AI Agent calls MCP Server tool
         ↓
MCP Server invokes Lambda Handler
         ↓
Lambda Handler processes with DynamoDB
         ↓
Response flows back to customer
```

## Security Features

- ✅ Authentication required (valid customer_id)
- ✅ Authorization checks (customer must own the card)
- ✅ Structured error messages
- ✅ All operations logged

## Next Steps

1. **Deploy to AWS** (Task 11) - Move from local to cloud
2. **Connect to real Jeanie** - Integrate with Amazon Connect
3. **Add monitoring** - CloudWatch dashboards and alerts

## Files Created

- `src/mcp_server/server.py` - Main MCP server implementation
- `src/mcp_server/README.md` - Detailed documentation
- `scripts/test_mcp_server.py` - Test suite
- `MCP_SERVER_GUIDE.md` - This guide

---

**Status:** ✅ MCP Server is complete and tested!
