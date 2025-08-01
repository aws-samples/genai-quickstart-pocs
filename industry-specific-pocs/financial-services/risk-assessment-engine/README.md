# Agentic Customer Risk Assessment Engine

A comprehensive agentic risk assessment system that uses AWS AgentCore and Strands framework to analyze customer financial behavior, communications, and market interactions for accurate risk profiling.

## Features

- **Multi-Agent Collaboration**: Five specialized AI agents working together through Strands orchestration
- **Real-time Analysis**: Continuous monitoring and assessment updates
- **Explainable AI**: Transparent decision-making with AgentCore Observability
- **Secure Processing**: MicroVM isolation through AgentCore Runtime
- **Interactive Dashboard**: React-based interface with real-time agent transparency

## Architecture

- **AWS AgentCore Runtime**: Serverless agent hosting with extended runtime support
- **Strands Framework**: Multi-agent orchestration and autonomous reasoning
- **MCP Servers**: External tool integration via Lambda functions
- **AgentCore Memory**: Cross-agent knowledge sharing and context management
- **AgentCore Identity**: Secure credential management for external APIs
- **AgentCore Observability**: Decision tracing and compliance monitoring

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed globally

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd risk-assessment

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Deploy to development environment
npm run deploy:dev
```

### Development

```bash
# Start frontend development server
npm run dev

# Watch mode for TypeScript compilation
npm run build:watch

# Run tests in watch mode
npm run test:watch

# Lint and format code
npm run lint:fix
npm run format
```

## Project Structure

```
risk-assessment/
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── agents/              # Strands agents for AgentCore
│   ├── mcp-servers/         # MCP servers as Lambda functions
│   ├── api/                 # API Gateway Lambda functions
│   ├── infrastructure/      # AWS CDK infrastructure
│   └── frontend/            # React dashboard application
├── tools/                   # Build and deployment scripts
├── docs/                    # Documentation
└── .github/workflows/       # CI/CD pipelines
```

## Agents

### Behavioral Analysis Agent
- **Model**: Claude 3.5 Haiku
- **Purpose**: Analyzes transaction patterns and investment behavior
- **Tools**: Financial Data MCP server

### Sentiment Analysis Agent
- **Model**: Amazon Nova Micro
- **Purpose**: Processes communications for emotional indicators
- **Tools**: Communication MCP server

### Compliance Agent
- **Model**: Amazon Titan Text Express
- **Purpose**: Validates regulatory requirements and audit trails
- **Tools**: Compliance MCP server

### Predictive Agent
- **Model**: Claude 3.5 Sonnet
- **Purpose**: Forecasts potential risk changes and generates alerts
- **Tools**: Cross-agent memory access

### Market Context Agent
- **Model**: Amazon Nova Lite
- **Purpose**: Adjusts assessments based on current market conditions
- **Tools**: Financial Data MCP server (market tools)

## Deployment

### Environments

- **Development**: `npm run deploy:dev`
- **Staging**: `npm run deploy:staging`
- **Production**: `npm run deploy:prod`

### Environment Variables

Required environment variables for deployment:

```bash
AWS_ACCOUNT_ID=your-aws-account-id
AWS_REGION=your-aws-region
CDK_DEFAULT_ACCOUNT=your-aws-account-id
CDK_DEFAULT_REGION=your-aws-region
```

## Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific package tests
npm run test --workspace=packages/agents
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run linting and tests: `npm run lint && npm run test`
5. Commit changes: `git commit -m 'feat: add my feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support, please refer to the documentation in the `docs/` directory or create an issue in the repository.