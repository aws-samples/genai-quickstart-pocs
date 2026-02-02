# Documentation Index

Complete documentation for the Debit Card Workflow API.

## For Developers

### Getting Started
- **[Main README](../README.md)** - Project overview and quick start guide
- **[HANDOFF_GUIDE.md](HANDOFF_GUIDE.md)** - Complete onboarding guide for new team members

### Development Guides
- **[MCP_SERVER_GUIDE.md](MCP_SERVER_GUIDE.md)** - MCP server setup and integration
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Command reference and cheat sheet
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

## For Deployment

### Deployment Options
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - GUI-based deployment via AWS Console (no CLI tools required)
- **[deploy.sh script](../scripts/deploy.sh)** - Automated deployment via command line
- **[package.sh script](../scripts/package.sh)** - Create Lambda deployment package

### Infrastructure
- **[CLOUDFORMATION_SUMMARY.md](CLOUDFORMATION_SUMMARY.md)** - CloudFormation template overview
- **[template.yaml](../template.yaml)** - CloudFormation infrastructure template

## For Collaboration

- **[GITLAB_SETUP.md](GITLAB_SETUP.md)** - GitLab setup and collaboration workflow

## Quick Links

### Common Tasks
- Local development setup: See [Main README](../README.md#quick-start)
- AWS deployment (GUI): See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- AWS deployment (CLI): Run `./scripts/deploy.sh`
- Test locally: Run `python scripts/test_local.py`
- MCP server setup: See [MCP_SERVER_GUIDE.md](MCP_SERVER_GUIDE.md)

### Architecture Diagrams
- System architecture: See [HANDOFF_GUIDE.md](HANDOFF_GUIDE.md#architecture)
- Data model: See [Main README](../README.md#data-model)
- API flow: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## Documentation Standards

All documentation in this folder follows these principles:
- Clear, step-by-step instructions
- No assumptions about prior knowledge
- Include troubleshooting sections
- Keep examples practical and tested
- Update when code changes

## Contributing

When adding new documentation:
1. Add it to the `docs/` directory
2. Update this README.md index
3. Link to it from the main README.md if relevant
4. Use clear, descriptive filenames
