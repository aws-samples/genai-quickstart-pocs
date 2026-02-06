# Documentation

Complete documentation for the BetterBank Debit Card Workflow API.

## Quick Start

1. **[Prerequisites](PREREQUISITES.md)** - Check requirements before deploying
2. **[Deployment](DEPLOYMENT.md)** - Deploy Lambda functions and infrastructure
3. **[Configuration](CONFIGURATION.md)** - Configure AgentCore Gateway with MCP schemas

## Documentation

### Deployment
- **[Prerequisites](PREREQUISITES.md)** - IAM permissions, service quotas, software requirements
- **[Deployment](DEPLOYMENT.md)** - Deploy Lambda functions, VPC, and DynamoDB
- **[Configuration](CONFIGURATION.md)** - Configure AgentCore Gateway and Bedrock Agent

### Reference
- **[MCP Protocol](MCP_PROTOCOL.md)** - Model Context Protocol details and schemas
- **[Architecture](ARCHITECTURE.md)** - System design, data model, security, scalability

### Development
- **[Local Development](LOCAL_DEVELOPMENT.md)** - Run locally, test, debug
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## Common Tasks

**Deploy Infrastructure:**
```bash
./scripts/deploy_stack.sh dev
```

**Seed Test Data:**
```bash
python scripts/seed_data_aws.py
```

**Test Locally:**
```bash
python scripts/test_local.py
```

**Test Lambda:**
```bash
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/call\",\"params\":{\"name\":\"lock_card\",\"arguments\":{\"customer_id\":\"CUST001\",\"card_id\":\"CARD001\"}},\"id\":1}"}' \
  response.json
```

## Support

- **Issues**: Check [Troubleshooting](TROUBLESHOOTING.md)
- **Questions**: Review relevant documentation above
- **AWS Support**: For AgentCore Gateway or Bedrock issues
