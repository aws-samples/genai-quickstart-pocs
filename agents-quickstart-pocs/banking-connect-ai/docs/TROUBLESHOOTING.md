# Troubleshooting

Common issues and solutions for the BetterBank Card Operations API.

## Deployment Issues

### CloudFormation Stack Creation Failed

**Symptoms:**
- Stack status shows "CREATE_FAILED" or "ROLLBACK_COMPLETE"

**Diagnosis:**
1. Go to CloudFormation → Your stack → Events tab
2. Look for rows with "Failed" status
3. Read the "Status reason" column

**Common Causes:**

**Wrong S3 bucket name:**
```
Error: S3 bucket does not exist
Solution: Verify bucket name matches exactly
```

**File not found:**
```
Error: Could not find lambda-deployment.zip
Solution: Ensure file is uploaded to S3 bucket
```

**Insufficient permissions:**
```
Error: User is not authorized to perform: iam:CreateRole
Solution: Contact AWS administrator for permissions
```

**Region mismatch:**
```
Error: S3 bucket not found
Solution: Ensure S3 bucket and CloudFormation are in same region
```

**Fix and Retry:**
1. Delete the failed stack
2. Fix the issue
3. Redeploy

---

## API Issues

### API Returns 403 Forbidden

**Symptoms:**
```json
{
  "message": "Forbidden"
}
```

**Causes:**
1. Missing or invalid API key
2. Wrong API key header name
3. API key not associated with usage plan

**Solutions:**

**Check API key:**
```bash
# Get API key from CloudFormation
aws cloudformation describe-stacks \
  --stack-name betterbank-card-operations-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiKeyId`].OutputValue' \
  --output text

# Get key value
aws apigateway get-api-key \
  --api-key <API_KEY_ID> \
  --include-value \
  --query 'value' \
  --output text
```

**Verify header:**
```bash
# Correct
curl -H "x-api-key: YOUR_KEY" ...

# Wrong
curl -H "X-API-Key: YOUR_KEY" ...  # Case sensitive!
curl -H "api-key: YOUR_KEY" ...    # Wrong name
```

---

### API Returns 500 Internal Server Error

**Symptoms:**
```json
{
  "message": "Internal server error"
}
```

**Diagnosis:**

**Check Lambda logs:**
```bash
# Via AWS CLI
aws logs tail /aws/lambda/betterbank-card-operations-dev --follow

# Via Console
CloudWatch → Log groups → /aws/lambda/betterbank-card-operations-dev
```

**Common Causes:**

**Database not seeded:**
```
Error: Customer not found
Solution: Run python scripts/seed_data_aws.py
```

**Lambda permissions issue:**
```
Error: AccessDeniedException
Solution: Check Lambda execution role has DynamoDB permissions
```

**Configuration error:**
```
Error: Table does not exist
Solution: Verify environment variables in Lambda configuration
```

---

### API Returns 401 Unauthorized

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "AUTH_FAILED",
    "message": "Authentication failed. Customer not found."
  }
}
```

**Causes:**
1. Customer ID doesn't exist in database
2. Database not seeded
3. Wrong customer ID in request

**Solutions:**

**Verify customer exists:**
```bash
aws dynamodb get-item \
  --table-name betterbank-customers-dev \
  --key '{"customer_id": {"S": "CUST001"}}'
```

**Seed database:**
```bash
python scripts/seed_data_aws.py
```

**Use valid test IDs:**
- CUST001, CUST002, CUST003

---

### API Returns 404 Not Found

**Symptoms:**
```json
{
  "success": false,
  "error": {
    "code": "CARD_NOT_FOUND",
    "message": "Card not found."
  }
}
```

**Causes:**
1. Card ID doesn't exist
2. Wrong card ID in request

**Solutions:**

**Verify card exists:**
```bash
aws dynamodb get-item \
  --table-name betterbank-cards-dev \
  --key '{"card_id": {"S": "CARD001"}}'
```

**Use valid test IDs:**
- CARD001, CARD002, CARD003, CARD004, CARD005

---

## MCP Layer Issues

### Lambda Invocation Fails

**Symptoms:**
- Gateway returns error when invoking Lambda
- CloudWatch shows no logs

**Diagnosis:**

**Check Gateway role permissions:**
```bash
aws iam get-role-policy \
  --role-name betterbank-gateway-role-dev \
  --policy-name <POLICY_NAME>
```

**Verify Lambda ARNs:**
```bash
aws cloudformation describe-stacks \
  --stack-name betterbank-mcp-lambda-dev \
  --query 'Stacks[0].Outputs'
```

**Solutions:**

**Update Gateway role:**
```json
{
  "Effect": "Allow",
  "Action": "lambda:InvokeFunction",
  "Resource": [
    "arn:aws:lambda:REGION:ACCOUNT:function:betterbank-mcp-lock-card-dev",
    "arn:aws:lambda:REGION:ACCOUNT:function:betterbank-mcp-unlock-card-dev",
    "arn:aws:lambda:REGION:ACCOUNT:function:betterbank-mcp-request-new-card-dev"
  ]
}
```

**Test Lambda directly:**
```bash
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/list\",\"id\":1}"}' \
  response.json
```

---

### Card Operations Fail from MCP Lambda

**Symptoms:**
- MCP Lambda invokes successfully
- But card operations fail

**Diagnosis:**

**Check MCP Lambda logs:**
```bash
aws logs tail /aws/lambda/betterbank-mcp-lock-card-dev --follow
```

**Common errors:**
```
Error: Unable to invoke card operations Lambda
Solution: Check MCP Lambda role has invoke permissions
```

**Solutions:**

**Verify MCP Lambda role:**
```bash
aws iam get-role \
  --role-name betterbank-mcp-lambda-role-dev
```

**Test card operations Lambda:**
```bash
aws lambda invoke \
  --function-name betterbank-card-operations-dev \
  --payload '{"httpMethod":"POST","path":"/v1/cards/lock","body":"{\"customer_id\":\"CUST001\",\"card_id\":\"CARD001\"}"}' \
  response.json
```

---

### VPC Connectivity Issues

**Symptoms:**
- Lambda timeout errors
- Cannot reach DynamoDB

**Diagnosis:**

**Check NAT Gateway:**
```bash
aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available"
```

**Check VPC Endpoints:**
```bash
aws ec2 describe-vpc-endpoints \
  --filters "Name=service-name,Values=com.amazonaws.REGION.dynamodb"
```

**Solutions:**

**Verify NAT Gateway is running:**
- Console → VPC → NAT Gateways
- Status should be "Available"

**Verify VPC Endpoint:**
- Console → VPC → Endpoints
- DynamoDB endpoint should exist

**Check Security Groups:**
- Lambda security group allows outbound traffic
- No inbound rules needed

---

## Local Development Issues

### DynamoDB Connection Error

**Symptoms:**
```
Error: Unable to connect to DynamoDB Local
```

**Solutions:**

**Check if running:**
```bash
docker ps | grep dynamodb
```

**Start DynamoDB Local:**
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

**Verify endpoint:**
```bash
export DYNAMODB_ENDPOINT=http://localhost:8000
```

---

### Import Errors

**Symptoms:**
```
ModuleNotFoundError: No module named 'src'
```

**Solutions:**

**Activate virtual environment:**
```bash
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

**Reinstall dependencies:**
```bash
pip install -r requirements.txt
```

**Add to PYTHONPATH:**
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

---

### Table Already Exists

**Symptoms:**
```
ResourceInUseException: Table already exists
```

**Solutions:**

**Delete tables:**
```bash
# Local
aws dynamodb delete-table \
  --table-name betterbank-customers \
  --endpoint-url http://localhost:8000

# AWS
aws dynamodb delete-table \
  --table-name betterbank-customers-dev
```

**Or use script:**
```bash
python scripts/delete_tables.py
```

---

## Performance Issues

### Slow API Response

**Symptoms:**
- API takes > 1 second to respond

**Diagnosis:**

**Check Lambda duration:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=betterbank-card-operations-dev \
  --start-time 2026-02-05T00:00:00Z \
  --end-time 2026-02-05T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum
```

**Common Causes:**

**Cold start:**
- First invocation takes ~500ms
- Subsequent invocations ~50-100ms
- Solution: Use provisioned concurrency (costs more)

**DynamoDB throttling:**
- Check CloudWatch metrics for throttles
- Solution: Increase capacity or use on-demand

**Large response:**
- Check response size
- Solution: Paginate or reduce data

---

## Monitoring

### Set Up CloudWatch Alarms

**Lambda Errors:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name betterbank-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=betterbank-card-operations-dev
```

**DynamoDB Throttles:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name betterbank-dynamodb-throttles \
  --alarm-description "Alert on DynamoDB throttles" \
  --metric-name UserErrors \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=betterbank-cards-dev
```

---

## Getting Help

### Check Logs

**Lambda:**
```bash
aws logs tail /aws/lambda/betterbank-card-operations-dev --follow
```

**MCP Lambda:**
```bash
aws logs tail /aws/lambda/betterbank-mcp-lock-card-dev --follow
```

### Enable Debug Logging

Add to Lambda environment variables:
```
LOG_LEVEL=DEBUG
```

### Contact Support

- **AWS Support**: For service-specific issues
- **GitHub Issues**: For code-related issues
- **Documentation**: Check all docs in `docs/` folder

---

## Next Steps

- **API Reference**: See [API Reference](API_REFERENCE.md)
- **Architecture**: See [Architecture](ARCHITECTURE.md)
- **Local Development**: See [Local Development](LOCAL_DEVELOPMENT.md)
