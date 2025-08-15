# Troubleshooting Guide

## Overview

This guide provides systematic approaches to diagnosing and resolving common issues in the Investment AI Agent system. It includes step-by-step troubleshooting procedures, common error patterns, and resolution strategies.

## General Troubleshooting Methodology

### Step 1: Problem Identification

1. **Gather Information**:
   - Error messages and stack traces
   - Time of occurrence
   - Affected users or components
   - Recent changes or deployments

2. **Check System Status**:
   ```bash
   # Check overall system health
   curl https://api.investment-ai-agent.com/health
   
   # Check individual components
   curl https://api.investment-ai-agent.com/health/database
   curl https://api.investment-ai-agent.com/health/external
   curl https://api.investment-ai-agent.com/health/models
   ```

3. **Review Monitoring Dashboards**:
   - Operations dashboard for system metrics
   - Error rate and response time trends
   - Resource utilization patterns

### Step 2: Log Analysis

1. **Application Logs**:
   ```bash
   # View recent Lambda logs
   aws logs tail /aws/lambda/InvestmentAiAgentApi --follow
   
   # Search for specific errors
   aws logs filter-log-events \
     --log-group-name /aws/lambda/InvestmentAiAgentApi \
     --filter-pattern "ERROR" \
     --start-time $(date -d '1 hour ago' +%s)000
   ```

2. **CloudWatch Insights Queries**:
   ```sql
   -- Find errors in the last hour
   fields @timestamp, @message, @requestId
   | filter @message like /ERROR/
   | sort @timestamp desc
   | limit 50
   
   -- Analyze response times
   fields @timestamp, @duration, @requestId
   | filter @type = "REPORT"
   | stats avg(@duration), max(@duration) by bin(5m)
   ```

### Step 3: Root Cause Analysis

1. **Check Recent Changes**:
   - Recent deployments
   - Configuration changes
   - External service updates

2. **Analyze Dependencies**:
   - AWS service status
   - External API availability
   - Network connectivity

3. **Review Metrics**:
   - Error patterns and correlations
   - Performance degradation trends
   - Resource exhaustion indicators

## Common Issues and Solutions

### API Gateway Issues

#### Issue: High Latency

**Symptoms**:
- API response times > 5 seconds
- Timeout errors
- User complaints about slow responses

**Diagnosis**:
```bash
# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=InvestmentAiAgentApi \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum
```

**Common Causes and Solutions**:

1. **Lambda Cold Starts**:
   ```bash
   # Check Lambda duration metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Duration \
     --dimensions Name=FunctionName,Value=InvestmentAiAgentApi
   ```
   
   **Solution**: Implement provisioned concurrency or increase memory allocation

2. **Database Query Performance**:
   ```bash
   # Check DynamoDB metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/DynamoDB \
     --metric-name SuccessfulRequestLatency \
     --dimensions Name=TableName,Value=InvestmentIdeas
   ```
   
   **Solution**: Optimize queries, add indexes, or increase read/write capacity

3. **External Service Delays**:
   ```bash
   # Check external service response times in logs
   aws logs filter-log-events \
     --log-group-name /aws/lambda/InvestmentAiAgentApi \
     --filter-pattern "external_service_call"
   ```
   
   **Solution**: Implement caching, circuit breakers, or timeout adjustments

#### Issue: 5xx Errors

**Symptoms**:
- HTTP 500, 502, 503, 504 errors
- Internal server error messages
- Failed API requests

**Diagnosis**:
```bash
# Check error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=InvestmentAiAgentApi
```

**Common Causes and Solutions**:

1. **Lambda Function Errors**:
   ```bash
   # Check Lambda error metrics
   aws logs filter-log-events \
     --log-group-name /aws/lambda/InvestmentAiAgentApi \
     --filter-pattern "ERROR"
   ```
   
   **Solution**: Fix application code, handle exceptions properly

2. **Lambda Timeout**:
   ```bash
   # Check for timeout errors
   aws logs filter-log-events \
     --log-group-name /aws/lambda/InvestmentAiAgentApi \
     --filter-pattern "Task timed out"
   ```
   
   **Solution**: Increase Lambda timeout or optimize code performance

3. **Memory Exhaustion**:
   ```bash
   # Check memory usage
   aws logs filter-log-events \
     --log-group-name /aws/lambda/InvestmentAiAgentApi \
     --filter-pattern "Memory Size"
   ```
   
   **Solution**: Increase Lambda memory allocation

### Lambda Function Issues

#### Issue: Function Timeouts

**Symptoms**:
- "Task timed out after X seconds" errors
- Incomplete request processing
- 504 Gateway Timeout responses

**Diagnosis**:
```bash
# Check function duration
aws lambda get-function-configuration \
  --function-name InvestmentAiAgentApi \
  --query 'Timeout'

# Analyze duration patterns
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "REPORT" | grep Duration
```

**Solutions**:

1. **Increase Timeout**:
   ```bash
   aws lambda update-function-configuration \
     --function-name InvestmentAiAgentApi \
     --timeout 300
   ```

2. **Optimize Code Performance**:
   - Implement connection pooling
   - Cache frequently accessed data
   - Optimize database queries
   - Use async/await properly

3. **Break Down Large Operations**:
   - Implement pagination
   - Use step functions for long workflows
   - Process data in smaller chunks

#### Issue: Memory Errors

**Symptoms**:
- "Runtime exited with error: signal: killed" errors
- Out of memory exceptions
- Incomplete data processing

**Diagnosis**:
```bash
# Check memory usage patterns
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "Max Memory Used"
```

**Solutions**:

1. **Increase Memory Allocation**:
   ```bash
   aws lambda update-function-configuration \
     --function-name InvestmentAiAgentApi \
     --memory-size 1024
   ```

2. **Optimize Memory Usage**:
   - Implement streaming for large data
   - Clear unused variables
   - Use memory-efficient data structures
   - Process data in batches

### Database Issues

#### Issue: DynamoDB Throttling

**Symptoms**:
- "ProvisionedThroughputExceededException" errors
- High latency for database operations
- Failed write operations

**Diagnosis**:
```bash
# Check throttling metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ThrottledRequests \
  --dimensions Name=TableName,Value=InvestmentIdeas
```

**Solutions**:

1. **Enable Auto Scaling**:
   ```bash
   aws application-autoscaling register-scalable-target \
     --service-namespace dynamodb \
     --resource-id table/InvestmentIdeas \
     --scalable-dimension dynamodb:table:WriteCapacityUnits \
     --min-capacity 5 \
     --max-capacity 100
   ```

2. **Optimize Query Patterns**:
   - Use batch operations
   - Implement exponential backoff
   - Distribute load across partition keys

3. **Switch to On-Demand Billing**:
   ```bash
   aws dynamodb modify-table \
     --table-name InvestmentIdeas \
     --billing-mode PAY_PER_REQUEST
   ```

#### Issue: Query Performance

**Symptoms**:
- Slow database queries
- High read latency
- Timeout errors during data retrieval

**Diagnosis**:
```bash
# Check query performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name SuccessfulRequestLatency \
  --dimensions Name=TableName,Value=InvestmentIdeas,Name=Operation,Value=Query
```

**Solutions**:

1. **Add Global Secondary Indexes**:
   ```bash
   aws dynamodb update-table \
     --table-name InvestmentIdeas \
     --attribute-definitions AttributeName=userId,AttributeType=S \
     --global-secondary-index-updates '[{
       "Create": {
         "IndexName": "UserIndex",
         "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
         "Projection": {"ProjectionType": "ALL"},
         "BillingMode": "PAY_PER_REQUEST"
       }
     }]'
   ```

2. **Optimize Query Patterns**:
   - Use appropriate partition keys
   - Implement query result caching
   - Use projection expressions to limit data

### AI Model Issues

#### Issue: Bedrock API Errors

**Symptoms**:
- Model invocation failures
- "ModelNotReadyException" errors
- High model response times

**Diagnosis**:
```bash
# Check Bedrock API calls in logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "bedrock"
```

**Solutions**:

1. **Check Model Availability**:
   ```bash
   aws bedrock list-foundation-models \
     --query 'modelSummaries[?modelId==`anthropic.claude-3-sonnet-20240229-v1:0`]'
   ```

2. **Implement Retry Logic**:
   ```typescript
   const retryConfig = {
     maxRetries: 3,
     retryDelayOptions: {
       base: 300
     }
   };
   ```

3. **Use Alternative Models**:
   - Implement model fallback logic
   - Load balance across multiple models
   - Cache model responses when appropriate

#### Issue: Model Response Quality

**Symptoms**:
- Poor investment recommendations
- Inconsistent analysis results
- Low user satisfaction scores

**Diagnosis**:
```bash
# Check model performance metrics
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "model_performance"
```

**Solutions**:

1. **Improve Prompt Engineering**:
   - Refine prompt templates
   - Add more context and examples
   - Implement prompt versioning

2. **Enhance Input Data Quality**:
   - Validate input data
   - Implement data cleaning
   - Enrich context with additional sources

3. **Model Selection Optimization**:
   - Use appropriate models for specific tasks
   - Implement A/B testing for model performance
   - Monitor and adjust model selection logic

### Authentication Issues

#### Issue: JWT Token Validation Failures

**Symptoms**:
- "Invalid token" errors
- Authentication failures for valid users
- 401 Unauthorized responses

**Diagnosis**:
```bash
# Check authentication errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "authentication"
```

**Solutions**:

1. **Check Token Expiration**:
   ```typescript
   // Verify token expiration
   const decoded = jwt.decode(token);
   if (decoded.exp < Date.now() / 1000) {
     // Token expired
   }
   ```

2. **Validate Cognito Configuration**:
   ```bash
   aws cognito-idp describe-user-pool \
     --user-pool-id us-east-1_XXXXXXXXX
   ```

3. **Check Clock Synchronization**:
   - Ensure server time is synchronized
   - Account for clock skew in token validation

### External Service Issues

#### Issue: Market Data API Failures

**Symptoms**:
- Failed market data retrieval
- Stale or missing price information
- External service timeout errors

**Diagnosis**:
```bash
# Check external service calls
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "external_api"
```

**Solutions**:

1. **Implement Circuit Breaker**:
   ```typescript
   const circuitBreaker = new CircuitBreaker(marketDataAPI, {
     timeout: 5000,
     errorThresholdPercentage: 50,
     resetTimeout: 30000
   });
   ```

2. **Add Fallback Data Sources**:
   - Configure multiple data providers
   - Implement data source failover
   - Cache recent data for fallback

3. **Implement Retry Logic**:
   ```typescript
   const retryOptions = {
     retries: 3,
     factor: 2,
     minTimeout: 1000,
     maxTimeout: 5000
   };
   ```

## Performance Troubleshooting

### High CPU Usage

**Diagnosis**:
```bash
# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=InvestmentAiAgentApi
```

**Solutions**:
1. Profile code for CPU-intensive operations
2. Optimize algorithms and data structures
3. Implement caching for expensive computations
4. Consider increasing Lambda memory (which also increases CPU)

### Memory Leaks

**Diagnosis**:
```bash
# Monitor memory usage patterns
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "Max Memory Used"
```

**Solutions**:
1. Review code for memory leaks
2. Implement proper cleanup of resources
3. Use memory profiling tools
4. Restart Lambda functions periodically

### Network Issues

**Diagnosis**:
```bash
# Check VPC Flow Logs
aws logs filter-log-events \
  --log-group-name VPCFlowLogs \
  --filter-pattern "REJECT"
```

**Solutions**:
1. Review security group rules
2. Check NACL configurations
3. Verify DNS resolution
4. Test network connectivity

## Emergency Procedures

### System Outage Response

1. **Immediate Actions**:
   ```bash
   # Check system status
   curl -I https://api.investment-ai-agent.com/health
   
   # Review recent deployments
   aws cloudformation describe-stacks \
     --stack-name InvestmentAiAgentStack
   ```

2. **Escalation**:
   - Notify on-call engineer
   - Create incident ticket
   - Update status page
   - Communicate with stakeholders

3. **Recovery**:
   ```bash
   # Rollback if needed
   aws lambda update-function-code \
     --function-name InvestmentAiAgentApi \
     --s3-bucket deployment-artifacts \
     --s3-key previous-version.zip
   ```

### Data Corruption Response

1. **Immediate Actions**:
   - Stop write operations
   - Assess scope of corruption
   - Notify stakeholders

2. **Recovery**:
   ```bash
   # Restore from backup
   aws dynamodb restore-table-from-backup \
     --target-table-name InvestmentIdeas \
     --backup-arn arn:aws:dynamodb:region:account:backup/backup-id
   ```

### Security Incident Response

1. **Immediate Actions**:
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Investigation**:
   ```bash
   # Check CloudTrail logs
   aws logs filter-log-events \
     --log-group-name CloudTrail/InvestmentAiAgent \
     --filter-pattern "ERROR"
   ```

## Preventive Measures

### Monitoring Setup

1. **Implement Comprehensive Monitoring**:
   - Set up CloudWatch dashboards
   - Configure meaningful alerts
   - Monitor business metrics

2. **Regular Health Checks**:
   ```bash
   # Automated health check script
   #!/bin/bash
   curl -f https://api.investment-ai-agent.com/health || exit 1
   ```

### Testing Procedures

1. **Regular Load Testing**:
   ```bash
   # Load test with Artillery
   artillery run load-test-config.yml
   ```

2. **Chaos Engineering**:
   - Implement failure injection
   - Test system resilience
   - Validate recovery procedures

### Documentation Maintenance

1. **Keep Runbooks Updated**:
   - Review procedures quarterly
   - Update based on incidents
   - Test procedures regularly

2. **Knowledge Sharing**:
   - Conduct incident post-mortems
   - Share lessons learned
   - Train team members

This troubleshooting guide provides systematic approaches to identifying and resolving issues quickly, minimizing system downtime and user impact.