# Q CLI Project Context Setup

This directory contains configuration files to provide automatic project context for Q CLI sessions.

## Files

- **`project-context.md`** - Comprehensive project overview, architecture, and development guidelines
- **`config.json`** - Q CLI configuration to auto-load project context
- **`README.md`** - This file

## How It Works

When you start a new Q CLI session in this project directory, the configuration will:

1. **Auto-load project context** from `project-context.md`
2. **Set working directory** to the project root
3. **Apply safety guidelines** - Q will not modify files unless explicitly requested
4. **Provide architecture awareness** - Q understands the Step Functions workflow, Lambda functions, and infrastructure

## Usage

Simply run Q CLI from the project root:

```bash
cd /Users/roficas/aws-infrastructure-reverse-engineering
q chat
```

Q will automatically have context about:
- ✅ System architecture (Step Functions, Lambda, DynamoDB, S3)
- ✅ Component relationships and dependencies  
- ✅ Development guidelines and best practices
- ✅ Security considerations and IAM architecture
- ✅ Branch strategy (main vs mcp-server)

## Safety Features

The configuration includes safety instructions:
- 🛡️ **Read-only by default** - Q won't modify files without explicit permission
- 🛡️ **Confirmation required** - Q will ask before making changes
- 🛡️ **Impact explanation** - Q will explain consequences of proposed changes
- 🛡️ **Security focus** - Maintains security best practices for this security system

## Project Overview Reminder

This is a **serverless AWS security configuration analysis system** that:
- Processes security configurations via S3 uploads
- Uses Step Functions to orchestrate AI-powered analysis
- Generates security controls, IAM models, and IaC templates
- Leverages Amazon Bedrock for intelligent recommendations
- Maintains audit trails and compliance mappings

The system is production-ready on the `main` branch, with experimental MCP server integration available on the `mcp-server` branch.
