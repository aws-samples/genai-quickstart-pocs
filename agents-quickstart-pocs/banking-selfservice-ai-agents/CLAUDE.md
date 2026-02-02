# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backend system for managing debit card operations (lock, unlock, request new card) for the Jeanie conversational AI banking agent. Built with Python 3.11, AWS Lambda, DynamoDB, and Model Context Protocol (MCP).

## Common Commands

### AWS Deployment (Primary Use Case)
```bash
./scripts/package.sh                    # Create Lambda deployment package (12KB!)
./scripts/deploy.sh                     # Deploy to dev (single phase, pure CloudFormation)
./scripts/deploy.sh staging             # Deploy to staging
./scripts/deploy.sh prod                # Deploy to production
python3 scripts/seed_data_aws.py        # Seed AWS database

# View logs
aws logs tail /aws/lambda/banking-selfservice-ai-agents-dev --follow
```

### Local Development Setup (Optional)
```bash
./scripts/setup.sh                      # Create venv and install dependencies
python3 scripts/create_tables.py        # Create DynamoDB Local tables
python3 scripts/seed_data.py            # Seed mock data
```

### Testing (Local)
```bash
python3 scripts/test_local.py           # Integration tests for Lambda handler
python3 scripts/test_mcp_server.py      # Test MCP server tools
pytest                                  # Run all pytest tests
pytest -m unit                          # Unit tests only
pytest --cov=src --cov-report=html      # With coverage report
```

## Architecture

```
Request → API Gateway → Lambda Handler → Card Operations → Auth → DynamoDB
```

### Key Source Files
- `src/lambda_handler/handler.py` - AWS Lambda entry point, routes to `/cards/lock`, `/cards/unlock`, `/cards/request-new`
- `src/shared/card_operations.py` - Business logic for lock_card, unlock_card, request_new_card
- `src/shared/auth.py` - Customer authentication and card/account ownership verification
- `src/shared/repositories.py` - DynamoDB data access layer (Customer, Account, Card, CardRequest repositories)
- `src/mcp_server/server.py` - MCP server exposing tools to AI agents

### Data Model
```
Customer (customer_id)
└── Account (account_id) - checking/savings with routing_number
    └── Card (card_id) - status: active/locked
```

### Mock Test Data
- Customers: CUST001, CUST002, CUST003
- Accounts: ACC001-ACC005 (linked to customers)
- Cards: CARD001-CARD005 (CARD003 is pre-locked for testing)

## API Endpoints

All endpoints accept POST with JSON body containing `customer_id` plus:
- `/v1/cards/lock` - `card_id`
- `/v1/cards/unlock` - `card_id`
- `/v1/cards/request-new` - `account_id`, `reason`, `delivery_address`

## Error Handling

- 401: Invalid customer (authentication failed)
- 403: Customer doesn't own card/account (authorization failed)
- 404: Card or account not found
- 400: Missing required fields or invalid JSON
- 503: Database errors

## Infrastructure

Pure CloudFormation template creates:
- 4 DynamoDB tables (customers, accounts, cards, card-requests)
- Lambda function (Python 3.11) with explicit IAM role
- API Gateway REST API with 3 POST endpoints (/cards/lock, /cards/unlock, /cards/request-new)
- API Key, Usage Plan, and rate limiting (100 burst, 50/sec, 10K/day)
- CloudWatch log group

Configuration files:
- `template.yaml` - Pure CloudFormation template (no SAM)
- `config/api_gateway.yaml` - OpenAPI spec
- `config/dynamodb_tables.json` - Table schemas

Deployment:
- Uses AWS CLI only (no SAM CLI)
- Lambda code packaged via `scripts/package.sh`
- Deployed via `scripts/deploy.sh` or AWS Console
- Single-phase deployment with API key enabled

Dependencies:
- `requirements.txt` - Local development and testing (boto3, pytest, moto, mcp)
- `requirements-lambda.txt` - Lambda dependencies (NONE! Lambda runtime has boto3)
- Package size: ~12KB (no external dependencies)
