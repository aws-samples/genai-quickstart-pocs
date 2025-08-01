# Agentic Customer Risk Assessment Engine Documentation

## Overview

The Agentic Customer Risk Assessment Engine automatically evaluates customer financial risk profiles by analyzing their behavior, communications, and market interactions using AWS AgentCore and Strands framework.

## Architecture

- **AWS AgentCore Runtime**: Hosts Strands agents with microVM isolation
- **Strands Framework**: Multi-agent orchestration and collaboration
- **MCP Servers**: External tool integration via Lambda functions
- **AgentCore Memory**: Cross-agent knowledge sharing
- **AgentCore Identity**: Secure credential management
- **AgentCore Observability**: Decision tracing and explainable AI

## Getting Started

1. Install dependencies: `npm install`
2. Build packages: `npm run build`
3. Run tests: `npm run test`
4. Deploy to dev: `npm run deploy:dev`

## Development

See individual package READMEs for specific development instructions:

- [Shared Types](../packages/shared/README.md)
- [Agents](../packages/agents/README.md)
- [MCP Servers](../packages/mcp-servers/README.md)
- [API](../packages/api/README.md)
- [Infrastructure](../packages/infrastructure/README.md)
- [Frontend](../packages/frontend/README.md)