# Agent Core Configuration

This folder contains Lambda functions and MCP Gateway configuration for the PE Fund Redemption system.

## Automated Deployment

Run the deployment scripts:
```bash
python deploy_lambdas.py      # Creates database-query and fund-documents functions
python create_gateways.py     # Creates MCP Gateway with Lambda targets
```

## Manual Steps Required

### 1. Create MySQL Connector Lambda
The `MSSqlConnect` function must be created manually:
- **Runtime:** Node.js 18.x
- **Code:** Use `sql_lambda_connector.ts`
- **Dependencies:** Requires `mysql2` and `@aws-sdk/client-secrets-manager` (add as Layer)
- **IAM Permissions:** Secrets Manager read access

### 2. Set Up Database Connection
**Easiest Method:**
1. Go to RDS Console → Your Aurora cluster
2. Click **"Set up lambda connection"**
3. Follow wizard to create/configure RDS Proxy
4. This automatically handles VPC, security groups, and Lambda configuration

**Manual Alternative:**
```bash
# Add Lambda to VPC with auto-created security group
aws lambda update-function-configuration \
  --function-name MSSqlConnect \
  --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-xxxxxxxxx
```

### 3. Update Secrets Manager
Ensure your database secret contains:
- `username`, `password`, `port`, `dbname`
- `proxy`: Your RDS Proxy endpoint

## Architecture
- `database-query/` → Calls `MSSqlConnect` for SQL queries
- `fund-documents/` → Retrieves documents from S3
- MCP Gateway → Exposes Lambda functions as tools for AgentCore
