# Security Configuration System - CDK Infrastructure

This directory contains the AWS CDK infrastructure code for the security configuration system.

## Directory Structure

```
cdk/
├── bin/
│   └── app.ts              # CDK app entry point
├── lib/
│   └── security-system-stack.ts  # Main infrastructure stack
├── test/
│   └── security-system.test.ts   # Infrastructure tests
├── cdk.json               # CDK configuration
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## Prerequisites

- Node.js >= 14.x
- AWS CDK CLI >= 2.x
- TypeScript >= 4.x
- AWS credentials configured

```bash
# Install CDK CLI
npm install -g aws-cdk

# Install project dependencies
npm install
```

## Infrastructure Components

### 1. Lambda Functions

#### Security Configuration Handler
```typescript
new lambda.Function(this, 'SecurityConfigurationHandler', {
  functionName: '2SecurityConfigurationHandler',
  runtime: lambda.Runtime.PYTHON_3_9,
  handler: 'lambda_function.lambda_handler',
  code: lambda.Code.fromAsset('../lambda/2SecurityConfigurationHandler'),
  timeout: Duration.minutes(15),
  memorySize: 1024,
  environment: {
    BEDROCK_AGENT_ID: 'YWZMJLEXED',
    // ... other environment variables
  }
});
```

#### Security Profile Processor
```typescript
new lambda.Function(this, 'SecurityProfileProcessor', {
  functionName: '2SecurityProfileProcessor',
  runtime: lambda.Runtime.PYTHON_3_9,
  handler: 'lambda_function.lambda_handler',
  code: lambda.Code.fromAsset('../lambda/2SecurityProfileProcessor'),
  timeout: Duration.seconds(3),
  memorySize: 128
});
```

### 2. Step Functions Workflow

```typescript
new stepfunctions.StateMachine(this, 'SecurityConfigWorkflow', {
  stateMachineName: '2SecurityConfigWorkflow',
  definition: processSecurityProfileTask
    .addCatch(handleError)
    .next(success),
  logs: {
    destination: stepFunctionsLogGroup,
    level: stepfunctions.LogLevel.ERROR
  }
});
```

### 3. Storage Resources

#### DynamoDB Tables
```typescript
new dynamodb.Table(this, 'SecurityControlLibrary', {
  tableName: '2SecurityControlLibrary',
  partitionKey: { name: 'control_id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED
});
```

#### S3 Buckets
```typescript
new s3.Bucket(this, 'SecurityConfigOutputs', {
  bucketName: '2security-config-outputs',
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  versioned: true
});
```

## Deployment

### Development Environment
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Deploy to AWS
cdk deploy
```

### Production Deployment
```bash
# Deploy with specific context
cdk deploy --context environment=production

# Deploy with approval
cdk deploy --require-approval never
```

### Multiple Environments
```bash
# Deploy to staging
cdk deploy -c environment=staging

# Deploy to production
cdk deploy -c environment=production
```

## Configuration

### Context Variables
```json
{
  "environment": "production",
  "aws-region": "us-east-1",
  "bedrock-agent-id": "YWZMJLEXED"
}
```

### Environment-Specific Configuration
```typescript
const environment = this.node.tryGetContext('environment') || 'development';
const config = require(`../config/${environment}.json`);
```

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test
npm test -- -t 'SecuritySystemStack'
```

### Integration Tests
```bash
# Deploy test stack
cdk deploy --app "npx ts-node test/integ.security-system.ts"
```

## Security Best Practices

1. **IAM Roles**
   - Use least privilege principle
   - Scope permissions to specific resources
   - Use condition statements

2. **Resource Encryption**
   - Enable encryption at rest
   - Use KMS keys where appropriate
   - Enable SSL/TLS for data in transit

3. **Monitoring**
   - Enable CloudWatch logs
   - Set up metric alarms
   - Configure audit logging

## Monitoring and Logging

### CloudWatch Logs
```typescript
new logs.LogGroup(this, 'SecurityConfigHandlerLogs', {
  logGroupName: '/aws/lambda/2SecurityConfigurationHandler',
  retention: logs.RetentionDays.TWO_WEEKS,
  removalPolicy: cdk.RemovalPolicy.DESTROY
});
```

### Metrics and Alarms
```typescript
new cloudwatch.Alarm(this, 'SecurityConfigHandlerErrors', {
  metric: securityConfigHandler.metricErrors(),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: 'Security configuration handler error rate'
});
```

## Cost Optimization

1. **Lambda Configuration**
   - Optimize memory allocation
   - Set appropriate timeouts
   - Use provisioned concurrency when needed

2. **DynamoDB**
   - Use on-demand capacity
   - Enable auto-scaling
   - Implement TTL where appropriate

3. **S3**
   - Configure lifecycle policies
   - Use appropriate storage classes
   - Enable intelligent tiering

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   ```bash
   # Check deployment status
   cdk doctor
   
   # List all resources
   cdk list
   
   # Show differences
   cdk diff
   ```

2. **Runtime Errors**
   - Check CloudWatch logs
   - Verify IAM permissions
   - Validate environment variables

3. **State Machine Issues**
   - Check execution history
   - Verify Lambda permissions
   - Check input/output mapping

## Contributing

1. **Code Style**
   - Follow TypeScript best practices
   - Use meaningful construct IDs
   - Add comments for complex logic

2. **Testing**
   - Write unit tests
   - Add integration tests
   - Test with multiple environments

3. **Documentation**
   - Update README.md
   - Document context parameters
   - Add JSDoc comments

## Useful Commands

```bash
# CDK commands
cdk synth        # Generate CloudFormation template
cdk diff         # Show changes
cdk deploy       # Deploy stack
cdk destroy      # Remove stack

# Development
npm run build    # Compile TypeScript
npm run watch    # Watch for changes
npm run test     # Run tests

# Maintenance
cdk doctor       # Check CDK environment
cdk bootstrap    # Bootstrap environment
```
