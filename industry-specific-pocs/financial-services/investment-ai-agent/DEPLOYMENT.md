# Investment AI Agent - Deployment Guide

This document provides comprehensive instructions for deploying the Investment AI Agent to different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Process](#deployment-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Validation](#monitoring-and-validation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js**: Version 18.x or higher
- **AWS CLI**: Version 2.x configured with appropriate credentials
- **AWS CDK**: Version 2.100.0 or higher
- **TypeScript**: Version 5.2.2 or higher
- **Git**: For source code management
- **npm or yarn**: Package manager

### AWS Account Setup

#### Required IAM Permissions

The deployment user needs the following AWS permissions:

- **CloudFormation**: Full access for stack management
- **IAM**: Role creation and management
- **Lambda**: Full access for function deployment
- **API Gateway**: Full access for API management
- **DynamoDB**: Full access for database operations
- **S3**: Full access for storage and artifacts
- **Cognito**: Full access for user management
- **Bedrock**: Model access for AI capabilities
- **CloudWatch**: Full access for monitoring and logging

#### AWS CLI Configuration

```bash
# Configure AWS CLI with your credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and default region
```

#### CDK Bootstrap (First-time setup)

```bash
# Bootstrap CDK in your target region
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### Environment Variables

Set the following environment variables for each environment:

```bash
# Development
export AWS_ACCESS_KEY_ID_DEV=your-dev-access-key
export AWS_SECRET_ACCESS_KEY_DEV=your-dev-secret-key

# Staging
export AWS_ACCESS_KEY_ID_STAGING=your-staging-access-key
export AWS_SECRET_ACCESS_KEY_STAGING=your-staging-secret-key

# Production
export AWS_ACCESS_KEY_ID_PROD=your-prod-access-key
export AWS_SECRET_ACCESS_KEY_PROD=your-prod-secret-key
```

## Environment Configuration

### Configuration Files

Environment-specific configurations are stored in `config/environments/`:

- `dev.json` - Development environment
- `staging.json` - Staging environment
- `prod.json` - Production environment

### Configuration Structure

```json
{
  "environment": "dev",
  "region": "us-east-1",
  "stackName": "InvestmentAiAgentStack-Dev",
  "tags": {
    "Environment": "Development",
    "Project": "InvestmentAiAgent"
  },
  "lambda": {
    "memorySize": 256,
    "timeout": 30
  },
  "apiGateway": {
    "throttling": {
      "rateLimit": 100,
      "burstLimit": 200
    }
  }
}
```

## Deployment Process

### Step-by-Step Deployment Process

#### Step 1: Pre-Deployment Validation

1. **Code Quality Checks**:
   ```bash
   # Run linting
   npm run lint
   
   # Run unit tests
   npm run test:unit
   
   # Run integration tests
   npm run test:integration
   
   # Run security tests
   npm run test:security-all
   ```

2. **Build Validation**:
   ```bash
   # Build TypeScript code
   npm run build
   
   # Validate CDK synthesis
   cdk synth
   ```

3. **Dependency Check**:
   ```bash
   # Check for security vulnerabilities
   npm audit
   
   # Update dependencies if needed
   npm update
   ```

#### Step 2: Environment-Specific Deployment

##### Development Environment

**Purpose**: Local development and testing with minimal AWS resources

```bash
# Set environment variables
export NODE_ENV=development
export AWS_REGION=us-east-1
export DEPLOYMENT_STAGE=dev

# Install dependencies
npm ci

# Run pre-deployment validation
npm run validate:deployment

# Deploy to development
npm run deploy:dev
```

##### Staging Environment

**Purpose**: Pre-production testing with production-like setup

```bash
# Set environment variables
export NODE_ENV=staging
export AWS_REGION=us-east-1
export DEPLOYMENT_STAGE=staging

# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke:staging
```

##### Production Environment

**Purpose**: Live production system with high availability

```bash
# Set environment variables
export NODE_ENV=production
export AWS_REGION=us-east-1
export DEPLOYMENT_STAGE=prod

# Deploy to production (blue-green)
npm run deploy:prod

# Run comprehensive tests
npm run test:smoke:prod
```

#### Step 3: Post-Deployment Validation

1. **Health Checks**:
   ```bash
   # Run health check tests
   curl https://api.investment-ai-agent.com/health
   
   # Run smoke tests
   npm run test:smoke:prod
   ```

2. **Integration Tests**:
   ```bash
   # Run post-deployment tests
   npm run test:deployment:prod
   ```

3. **Performance Validation**:
   ```bash
   # Run performance tests
   npm run test:performance
   ```

### Deployment Scripts

#### Available Scripts

- `npm run validate:deployment` - Validates deployment configuration
- `npm run deploy:dev` - Deploys to development environment
- `npm run deploy:staging` - Deploys to staging environment
- `npm run deploy:prod` - Deploys to production with blue-green strategy
- `npm run test:deployment:dev` - Runs post-deployment tests for dev
- `npm run test:deployment:staging` - Runs post-deployment tests for staging
- `npm run test:deployment:prod` - Runs post-deployment tests for prod

#### Deployment Validation

The deployment validation script checks:

- Environment configuration validity
- AWS credentials and permissions
- CDK bootstrap status
- Build artifacts presence
- Dependencies integrity
- Security configuration
- CDK template synthesis

#### Post-Deployment Testing

Post-deployment tests validate:

- API endpoint availability
- Database connectivity
- S3 bucket access
- Bedrock model access
- Cognito User Pool status
- API Gateway throttling

## CI/CD Pipeline

### GitHub Actions Workflows

#### Continuous Integration (`ci.yml`)

Triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

Pipeline stages:
1. **Test** - Unit tests, integration tests, security tests
2. **Build** - TypeScript compilation and artifact creation
3. **Security Scan** - npm audit and Snyk security scanning
4. **Infrastructure Validation** - CDK template validation and security checks

#### Continuous Deployment (`cd.yml`)

Triggered on:
- Push to `main` branch (auto-deploy to dev)
- Manual workflow dispatch for staging/prod

Pipeline stages:
1. **Deploy Dev** - Automatic deployment to development
2. **Deploy Staging** - Manual approval required
3. **Deploy Prod** - Manual approval required, blue-green deployment

### Environment Promotion

```
Development → Staging → Production
     ↓           ↓          ↓
  Auto-deploy  Manual    Manual
               Approval  Approval
```

### Deployment Strategies

#### Standard Deployment
- Used for development and staging
- Direct replacement of existing resources
- Faster deployment time

#### Blue-Green Deployment

**Used for production deployments to ensure zero downtime**

1. **Prepare Green Environment**:
   ```bash
   # Deploy to green environment
   export DEPLOYMENT_COLOR=green
   cdk deploy --context color=green
   ```

2. **Validate Green Environment**:
   ```bash
   # Run comprehensive tests on green
   npm run test:deployment:green
   ```

3. **Switch Traffic**:
   ```bash
   # Update Route 53 to point to green
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456789 \
     --change-batch file://traffic-switch.json
   ```

4. **Monitor and Validate**:
   ```bash
   # Monitor metrics and logs
   aws logs tail /aws/lambda/InvestmentAiAgentApi --follow
   ```

5. **Finalize Deployment**:
   ```bash
   # Mark deployment as complete
   npm run deployment:finalize
   ```

## Rollback Procedures

### Automatic Rollback

The CI/CD pipeline includes automatic rollback triggers:
- Post-deployment test failures
- Health check failures
- Critical error alerts

### Manual Rollback

#### Using Rollback Script

```bash
# Rollback development
node scripts/rollback.js dev

# Rollback staging
node scripts/rollback.js staging

# Rollback production
node scripts/rollback.js prod
```

#### Rollback Strategies

1. **CDK Rollback** - Uses CDK's built-in rollback capability
2. **Stack Rollback** - CloudFormation stack rollback
3. **Git Rollback** - Rollback to previous successful commit

### Rollback Validation

After rollback:
1. Run post-deployment tests
2. Verify API functionality
3. Check database integrity
4. Validate user authentication

## Monitoring and Validation

### Health Checks and Monitoring

#### API Health Endpoints

```bash
# System health
curl https://api.investment-ai-agent.com/health

# Database connectivity
curl https://api.investment-ai-agent.com/health/database

# External service connectivity
curl https://api.investment-ai-agent.com/health/external

# AI model availability
curl https://api.investment-ai-agent.com/health/models

# Version information
curl https://api.investment-ai-agent.com/version
```

#### Deployment Metrics

Monitor these key metrics during deployment:

- **Lambda Function Errors**: Should be < 1%
- **API Gateway 4xx/5xx Errors**: Should be < 2%
- **DynamoDB Throttling**: Should be 0
- **Response Time**: Should be < 2 seconds (95th percentile)

#### Infrastructure Monitoring

- **CloudWatch**: Real-time metrics and custom dashboards
- **X-Ray**: Distributed tracing (enabled in staging/prod)
- **API Gateway**: Request metrics and throttling
- **Lambda**: Function metrics and cold starts
- **DynamoDB**: Read/write capacity and throttling

#### Log Monitoring

```bash
# View Lambda logs
aws logs tail /aws/lambda/InvestmentAiAgentApi --follow

# View API Gateway logs
aws logs tail /aws/apigateway/InvestmentAiAgentApi --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/InvestmentAiAgentApi \
  --filter-pattern "ERROR"
```

### Deployment Validation

#### Pre-Deployment Checks

- Configuration validation
- AWS credentials verification
- Build artifact validation
- Security configuration review

#### Post-Deployment Validation

- Endpoint availability testing
- Database connectivity verification
- Service integration testing
- Performance baseline validation

### Logging and Auditing

#### Deployment Logs

- Deployment execution logs
- CloudFormation stack events
- CDK deployment logs
- Post-deployment test results

#### Audit Trail

- Deployment records with timestamps
- Git commit information
- User/system that triggered deployment
- Environment-specific deployment history

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Issues

```bash
# Error: CDK bootstrap required
# Solution: Bootstrap CDK in target region
npx cdk bootstrap --context environment=dev
```

#### 2. Permission Errors

```bash
# Error: Access denied
# Solution: Verify AWS credentials and permissions
aws sts get-caller-identity
```

#### 3. Stack Update Failures

```bash
# Error: Stack update failed
# Solution: Check CloudFormation events
aws cloudformation describe-stack-events --stack-name YourStackName
```

#### 4. Lambda Deployment Package Too Large

```bash
# Error: Deployment package too large
# Solution: Optimize dependencies or use Lambda layers
npm run build
du -sh dist/
```

### Debugging Steps

1. **Check Deployment Logs**
   ```bash
   # View recent deployment logs
   tail -f deployment.log
   ```

2. **Validate Configuration**
   ```bash
   # Run deployment validation
   npm run validate:deployment
   ```

3. **Check AWS Resources**
   ```bash
   # List CloudFormation stacks
   aws cloudformation list-stacks
   
   # Describe specific stack
   aws cloudformation describe-stacks --stack-name YourStackName
   ```

4. **Test API Endpoints**
   ```bash
   # Test health endpoint
   curl https://your-api-url/api/v1/health
   ```

### Recovery Procedures

#### 1. Partial Deployment Failure

1. Check CloudFormation stack status
2. Review stack events for error details
3. Fix configuration issues
4. Retry deployment

#### 2. Complete Deployment Failure

1. Initiate rollback procedure
2. Validate rollback success
3. Investigate root cause
4. Fix issues before next deployment

#### 3. Data Loss Prevention

1. Verify backup procedures
2. Check DynamoDB point-in-time recovery
3. Validate S3 versioning
4. Review CloudTrail logs

### Support and Escalation

#### Internal Support

- Development Team: Primary support for deployment issues
- DevOps Team: Infrastructure and pipeline support
- Security Team: Security-related deployment concerns

#### External Support

- AWS Support: Infrastructure and service issues
- Third-party Services: External dependency issues

#### Escalation Matrix

1. **Level 1**: Development team member
2. **Level 2**: Senior developer or team lead
3. **Level 3**: DevOps engineer
4. **Level 4**: AWS support or external consultant

### Best Practices

#### Deployment Best Practices

1. Always run validation before deployment
2. Use feature flags for gradual rollouts
3. Monitor deployments closely
4. Keep rollback procedures tested and ready
5. Document all configuration changes

#### Security Best Practices

1. Use least-privilege IAM policies
2. Enable encryption at rest and in transit
3. Regularly rotate access keys
4. Monitor for security violations
5. Keep dependencies updated

#### Performance Best Practices

1. Monitor deployment times
2. Optimize build processes
3. Use appropriate resource sizing
4. Implement caching strategies
5. Monitor post-deployment performance

---

For additional support or questions, please contact the development team or refer to the project documentation.