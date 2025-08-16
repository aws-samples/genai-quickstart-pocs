# Agent Core Configuration

This folder contains Lambda functions and MCP Gateway configuration for the PE Fund Redemption system. Because AgentCore is still in preview, much of this functionality can not yet be put into a CDK and thus these steps need to be run manually. 

## Automated Deployment

Run the deployment scripts:
```bash
python deploy_lambdas.py      # Creates database-query and fund-documents functions
python create_gateways.py     # Creates MCP Gateway with Lambda targets
```

## Manual Steps Required

### 1. Create MySQL Connector Lambda
The `MSSqlConnect` function must be created manually in the RDS window with a Proxy Connection:

**Easiest Method:**
1. Go to RDS Console → Your Aurora cluster
2. Click **"Set up lambda connection"**
3. Follow wizard to create/configure RDS Proxy
4. This automatically handles VPC, security groups, and Lambda configuration
5. Set up environment vaiables in your lambda function
6. Use the code here and put it into the Lambda: `sql_lambda_connector.ts`

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
