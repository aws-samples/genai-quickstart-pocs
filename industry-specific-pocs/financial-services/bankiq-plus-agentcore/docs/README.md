# BankIQ+ Documentation

Complete documentation for deploying and developing the BankIQ+ platform.

## 📖 Documentation Index

### Deployment & Operations
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete step-by-step deployment instructions
  - Prerequisites and setup
  - Phase-by-phase deployment
  - Post-deployment configuration
  - Troubleshooting common issues

- **[CloudFormation Guide](CLOUDFORMATION_GUIDE.md)** - Infrastructure as Code details
  - Stack architecture
  - Deployment scripts
  - Resource dependencies
  - Cleanup procedures

### Development
- **[Agent Development](AGENT_DEVELOPMENT.md)** - Building and extending the AI agent
  - AgentCore setup
  - Tool development
  - Testing locally
  - Deployment workflow

## 🏗️ Architecture

Architecture diagrams are available in the `../arch/` folder:
- `bankiq_plus_agentcore_architecture.png` - Complete AWS architecture
- Additional diagrams for specific components

## 🚀 Quick Start

1. Read the [Deployment Guide](DEPLOYMENT_GUIDE.md)
2. Follow the prerequisites section
3. Run the deployment scripts
4. Configure your application

## 🆘 Getting Help

- Check the troubleshooting sections in each guide
- Review CloudWatch logs for runtime issues
- Verify IAM roles and permissions
- Ensure all prerequisites are met

## 📝 Contributing

When adding new documentation:
1. Place it in the `docs/` folder
2. Update this README with a link
3. Follow the existing documentation style
4. Include code examples where relevant
