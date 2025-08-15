# Troubleshooting Guide - Complete Issue Resolution

## 🔍 Overview

This comprehensive troubleshooting guide covers common issues, diagnostic procedures, and recovery steps for the Advisor Assistant POC across different platforms and deployment scenarios.

### Related Documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures and best practices
- **[TESTING.md](TESTING.md)** - Pre-deployment testing and validation
- **[WINDOWS-SETUP.md](WINDOWS-SETUP.md)** - Windows-specific setup and issues
- **[SECURITY.md](SECURITY.md)** - Security configuration and authentication issues
- **[ADMIN-SETUP.md](ADMIN-SETUP.md)** - Admin user and access control issues

## 🚨 Quick Diagnostic Commands

### System Health Check
```bash
# Check application health
curl http://your-alb-dns/api/health

# Check ECS service status
aws ecs describe-services \
  --cluster advisor-assistant-poc-cluster \
  --services advisor-assistant-poc-service \
  --region us-east-1

# Check CloudFormation stacks
aws cloudformation describe-stacks --region us-east-1

# Check Docker status
docker info
```

### Comprehensive Diagnostic Script
```bash
# Run the deployment debug script
./scripts/deployment-debug.sh poc us-east-1
```

## 🏗️ Infrastructure Issues

### CloudFormation Stack Failures

#### Issue: Stack Creation Failed
**Symptoms:**
- CloudFormation stack shows "CREATE_FAILED" status
- Resources not created or partially created
- Error messages in stack events

**Diagnostic Steps:**
```bash
# Check stack events for detailed error messages
aws cloudformation describe-stack-events \
  --stack-name advisor-assistant-poc-security \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Check stack resources
aws cloudformation describe-stack-resources \
  --stack-name advisor-assistant-poc-security \
  --region us-east-1
```

**Common Solutions:**
1. **IAM Permissions**: Ensure deployment role has necessary permissions
2. **Resource Limits**: Check AWS service quotas in target region
3. **Naming Conflicts**: Ensure unique resource names across regions
4. **Parameter Issues**: Verify all required parameters are provided

**Recovery Steps:**
```bash
# Delete failed stack and retry
aws cloudformation delete-stack \
  --stack-name advisor-assistant-poc-security \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name advisor-assistant-poc-security \
  --region us-east-1

# Retry deployment
./deploy-with-tests.sh poc us-east-1
```

#### Issue: Stack Update Failed
**Symptoms:**
- Stack shows "UPDATE_ROLLBACK_COMPLETE" status
- Changes not applied
- Resources in inconsistent state

**Diagnostic Steps:**
```bash
# Check update events
aws cloudformation describe-stack-events \
  --stack-name advisor-assistant-poc-app \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`UPDATE_FAILED`]'
```

**Solutions:**
1. **Resource Dependencies**: Check if resources have dependencies preventing updates
2. **Immutable Resources**: Some resources cannot be updated in-place
3. **Parameter Changes**: Verify parameter changes are valid

### VPC and Networking Issues

#### Issue: No Internet Access from Private Subnets
**Symptoms:**
- ECS tasks cannot pull Docker images
- API calls to external services fail
- Health checks timeout

**Diagnostic Steps:**
```bash
# Check NAT Gateway status
aws ec2 describe-nat-gateways --region us-east-1

# Check route tables
aws ec2 describe-route-tables --region us-east-1

# Check security groups
aws ec2 describe-security-groups --region us-east-1
```

**Solutions:**
1. **NAT Gateway**: Ensure NAT Gateway is running and properly configured
2. **Route Tables**: Verify private subnet routes point to NAT Gateway
3. **Security Groups**: Check outbound rules allow necessary traffic

#### Issue: Load Balancer Health Checks Failing
**Symptoms:**
- ALB shows unhealthy targets
- Application not accessible via load balancer
- 502/503 errors from ALB

**Diagnostic Steps:**
```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn YOUR_TARGET_GROUP_ARN \
  --region us-east-1

# Check ALB configuration
aws elbv2 describe-load-balancers --region us-east-1
```

**Solutions:**
1. **Health Check Path**: Ensure `/api/health` endpoint is working
2. **Security Groups**: Verify ALB can reach ECS tasks on port 3000
3. **Target Registration**: Check if ECS tasks are properly registered

## 🐳 Container and ECS Issues

### ECS Service Deployment Problems

#### Issue: Tasks Keep Failing to Start
**Symptoms:**
- ECS service shows 0 running tasks
- Tasks start but immediately stop
- "STOPPED" tasks in ECS console

**Diagnostic Steps:**
```bash
# Check service events
aws ecs describe-services \
  --cluster advisor-assistant-poc-cluster \
  --services advisor-assistant-poc-service \
  --region us-east-1 \
  --query 'services[0].events[:10]'

# Check task definition
aws ecs describe-task-definition \
  --task-definition advisor-assistant-poc:LATEST

# Check stopped tasks
aws ecs list-tasks \
  --cluster advisor-assistant-poc-cluster \
  --desired-status STOPPED \
  --region us-east-1
```

**Common Causes & Solutions:**
1. **Resource Constraints**: Increase CPU/memory allocation
2. **Environment Variables**: Check required environment variables are set
3. **Image Issues**: Verify Docker image exists and is accessible
4. **IAM Permissions**: Ensure task role has necessary permissions

#### Issue: Container Logs Show Application Errors
**Symptoms:**
- Tasks start but application fails to initialize
- Error messages in CloudWatch logs
- Health checks fail

**Diagnostic Steps:**
```bash
# Check application logs
aws logs tail /ecs/advisor-assistant-poc --follow --region us-east-1

# Check specific log streams
aws logs describe-log-streams \
  --log-group-name /ecs/advisor-assistant-poc \
  --region us-east-1
```

**Common Solutions:**
1. **Database Connectivity**: Check DynamoDB permissions and table existence
2. **Secrets Access**: Verify Secrets Manager permissions
3. **Port Binding**: Ensure application listens on port 3000
4. **Dependencies**: Check all NPM packages are properly installed

### Docker Build and Push Issues

#### Issue: Docker Build Fails
**Symptoms:**
- `docker build` command fails
- Missing dependencies or files
- Build context too large

**Diagnostic Steps:**
```bash
# Check Docker daemon status
docker info

# Check available disk space
df -h

# Check .dockerignore file
cat .dockerignore
```

**Solutions:**
1. **Docker Daemon**: Ensure Docker is running
2. **Disk Space**: Free up disk space if needed
3. **Build Context**: Add unnecessary files to .dockerignore
4. **Base Image**: Verify base image is accessible

#### Issue: ECR Push Fails
**Symptoms:**
- `docker push` fails with authentication errors
- "repository does not exist" errors
- Network timeout during push

**Diagnostic Steps:**
```bash
# Check ECR login status
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URI

# Check repository exists
aws ecr describe-repositories --region us-east-1

# Check image tags
docker images | grep advisor-assistant
```

**Solutions:**
1. **Authentication**: Re-run ECR login command
2. **Repository**: Create ECR repository if it doesn't exist
3. **Image Tags**: Ensure image is properly tagged for ECR
4. **Network**: Check internet connectivity

## 🔐 Authentication and Security Issues

### Cognito Authentication Problems

#### Issue: Users Cannot Log In
**Symptoms:**
- Login form returns authentication errors
- "User not found" messages
- JWT token validation fails

**Diagnostic Steps:**
```bash
# Check Cognito User Pool
aws cognito-idp describe-user-pool --user-pool-id YOUR_POOL_ID

# List users
aws cognito-idp list-users --user-pool-id YOUR_POOL_ID

# Check user pool client configuration
aws cognito-idp describe-user-pool-client \
  --user-pool-id YOUR_POOL_ID \
  --client-id YOUR_CLIENT_ID
```

**Solutions:**
1. **User Creation**: Ensure test users are created in correct User Pool
2. **Password Policy**: Verify passwords meet policy requirements
3. **User Pool Configuration**: Check client settings and OAuth flows
4. **Environment Variables**: Verify Cognito configuration in application

#### Issue: Session Not Persisting
**Symptoms:**
- Users logged out after page refresh
- Session cookies not being set
- Authentication required for every request

**Diagnostic Steps:**
```bash
# Check DynamoDB sessions table
aws dynamodb describe-table --table-name advisor-assistant-poc-sessions --region us-east-1

# Check application logs for session errors
aws logs filter-log-events \
  --log-group-name /ecs/advisor-assistant-poc \
  --filter-pattern "session" \
  --region us-east-1
```

**Solutions:**
1. **Sessions Table**: Ensure DynamoDB sessions table exists
2. **Cookie Configuration**: Check secure cookie settings
3. **Session Store**: Verify session store configuration
4. **HTTPS**: Ensure secure cookies work with HTTPS

### API Security Issues

#### Issue: CORS Errors
**Symptoms:**
- Browser console shows CORS errors
- API calls blocked by browser
- "Access-Control-Allow-Origin" errors

**Diagnostic Steps:**
```bash
# Test API directly (bypasses CORS)
curl -X POST http://your-alb-dns/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"Demo123!"}'

# Check response headers
curl -I http://your-alb-dns/api/health
```

**Solutions:**
1. **CORS Configuration**: Update CORS settings in application
2. **Origin Whitelist**: Add frontend domain to allowed origins
3. **Preflight Requests**: Ensure OPTIONS requests are handled
4. **Headers**: Verify required headers are allowed

## 🔗 External API Integration Issues

### Data Provider Problems

#### Issue: Yahoo Finance API Errors
**Symptoms:**
- Financial data not loading
- API rate limit errors
- Network timeout errors

**Diagnostic Steps:**
```bash
# Test Yahoo Finance API directly
curl "https://query1.finance.yahoo.com/v8/finance/chart/AAPL"

# Check application logs for API errors
aws logs filter-log-events \
  --log-group-name /ecs/advisor-assistant-poc \
  --filter-pattern "Yahoo" \
  --region us-east-1
```

**Solutions:**
1. **Rate Limiting**: Implement proper rate limiting and caching
2. **Error Handling**: Add retry logic with exponential backoff
3. **Alternative Endpoints**: Use different Yahoo Finance endpoints
4. **Caching**: Cache responses to reduce API calls

#### Issue: AWS Bedrock AI Analysis Fails
**Symptoms:**
- AI analysis not generating
- Bedrock API errors
- Model invocation timeouts

**Diagnostic Steps:**
```bash
# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Check Bedrock permissions
aws iam get-role-policy \
  --role-name advisor-assistant-poc-task-role \
  --policy-name BedrockAccess
```

**Solutions:**
1. **Model Access**: Ensure Claude 3.5 Sonnet access is granted in Bedrock console
   ```bash
   # Check if Claude 3.5 Sonnet is accessible
   aws bedrock list-foundation-models --region us-east-1 \
     --query 'modelSummaries[?contains(modelId, `claude-3-5-sonnet`)]'
   ```
2. **Request Model Access**: If not accessible, request access in Bedrock console
   - Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
   - Navigate to "Model access" → "Modify model access"
   - Select "Anthropic Claude 3.5 Sonnet" and submit use case
3. **IAM Permissions**: Verify task role has Bedrock permissions
4. **Region**: Confirm Bedrock is available in deployment region
5. **Quotas**: Check Bedrock service quotas and limits

## 🖥️ Platform-Specific Issues

### Windows-Specific Problems

#### Issue: Line Ending Problems
**Symptoms:**
- Scripts fail with syntax errors
- "command not found" errors in Git Bash
- Unexpected characters in files

**Solutions:**
```bash
# Configure Git line endings
git config --global core.autocrlf true

# Convert existing files
git add --renormalize .

# Use dos2unix if available
dos2unix deploy-with-tests.sh
```

#### Issue: Docker Desktop Not Starting
**Symptoms:**
- "Docker daemon not running" errors
- Docker commands not found
- Container operations fail

**Solutions:**
1. **Restart Docker Desktop**: Close and restart application
2. **Windows Features**: Enable Hyper-V and Containers features
3. **WSL2**: Ensure WSL2 is properly installed and configured
4. **Antivirus**: Add Docker to antivirus exclusions

#### Issue: PowerShell Execution Policy
**Symptoms:**
- PowerShell scripts cannot be executed
- "Execution policy" error messages
- Scripts blocked by security policy

**Solutions:**
```powershell
# Set execution policy for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for single execution
powershell -ExecutionPolicy Bypass -File .\script.ps1
```

### macOS-Specific Problems

#### Issue: Docker Desktop Resource Limits
**Symptoms:**
- Docker build fails with out of memory errors
- Slow Docker performance
- Container startup timeouts

**Solutions:**
1. **Increase Resources**: Allocate more CPU/memory to Docker Desktop
2. **Disk Space**: Ensure sufficient disk space available
3. **Restart Docker**: Restart Docker Desktop to clear cache
4. **Prune Images**: Remove unused Docker images and containers

#### Issue: AWS CLI Installation Issues
**Symptoms:**
- AWS CLI not found in PATH
- Permission errors during installation
- Version conflicts

**Solutions:**
```bash
# Install via Homebrew
brew install awscli

# Or download installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Add to PATH if needed
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
```

## 🔄 Recovery Procedures

### Complete Environment Reset

#### Full Stack Cleanup
```bash
# Delete all CloudFormation stacks
aws cloudformation delete-stack --stack-name advisor-assistant-poc-app --region us-east-1
aws cloudformation delete-stack --stack-name advisor-assistant-poc-security --region us-east-1

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name advisor-assistant-poc-app --region us-east-1
aws cloudformation wait stack-delete-complete --stack-name advisor-assistant-poc-security --region us-east-1

# Delete ECR repository
aws ecr delete-repository --repository-name advisor-assistant-poc --force --region us-east-1

# Clean up local Docker images
docker system prune -a
```

#### Fresh Deployment
```bash
# Start fresh deployment
./deploy-with-tests.sh poc us-east-1
```

### Partial Recovery Procedures

#### ECS Service Reset
```bash
# Scale service to 0
aws ecs update-service \
  --cluster advisor-assistant-poc-cluster \
  --service advisor-assistant-poc-service \
  --desired-count 0 \
  --region us-east-1

# Wait for tasks to stop
aws ecs wait services-stable \
  --cluster advisor-assistant-poc-cluster \
  --services advisor-assistant-poc-service \
  --region us-east-1

# Scale back to 1
aws ecs update-service \
  --cluster advisor-assistant-poc-cluster \
  --service advisor-assistant-poc-service \
  --desired-count 1 \
  --region us-east-1
```

#### Database Reset
```bash
# Clear DynamoDB tables (if needed)
aws dynamodb delete-table --table-name advisor-assistant-poc-companies --region us-east-1
aws dynamodb delete-table --table-name advisor-assistant-poc-earnings-v2 --region us-east-1

# Redeploy application stack to recreate tables
aws cloudformation deploy \
  --template-file cloudformation/02-application-infrastructure-poc.yaml \
  --stack-name advisor-assistant-poc-app \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## 📊 Monitoring and Alerting

### Setting Up Monitoring

#### CloudWatch Alarms
```bash
# Create high error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "advisor-assistant-high-error-rate" \
  --alarm-description "High error rate detected" \
  --metric-name "4XXError" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Sum" \
  --period 300 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --evaluation-periods 2
```

#### Log Monitoring
```bash
# Monitor for specific error patterns
aws logs create-log-group --log-group-name /aws/lambda/error-alerts --region us-east-1

# Set up log filters for critical errors
aws logs put-metric-filter \
  --log-group-name /ecs/advisor-assistant-poc \
  --filter-name "ErrorFilter" \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=ApplicationErrors,metricNamespace=AdvisorAssistant,metricValue=1
```

## 📞 Getting Additional Help

### Diagnostic Information to Collect

When seeking help, collect this information:

1. **System Information**:
   - Operating system and version
   - Docker version
   - AWS CLI version
   - Node.js version

2. **Error Messages**:
   - Complete error messages
   - Stack traces
   - CloudFormation events
   - Application logs

3. **Configuration**:
   - Environment variables (sanitized)
   - CloudFormation parameters
   - Docker configuration

4. **Network Information**:
   - Internet connectivity
   - Firewall/proxy settings
   - DNS resolution

### Useful Commands for Support
```bash
# System information
uname -a                    # System info (Linux/macOS)
docker --version           # Docker version
aws --version              # AWS CLI version
node --version             # Node.js version

# Network diagnostics
ping amazonaws.com          # Internet connectivity
nslookup amazonaws.com      # DNS resolution
curl -I https://aws.amazon.com  # HTTPS connectivity

# AWS diagnostics
aws sts get-caller-identity # AWS credentials
aws configure list          # AWS configuration
aws cloudformation describe-stacks --region us-east-1  # Stack status
```

---

**This troubleshooting guide provides comprehensive solutions for common issues and recovery procedures to ensure reliable operation of the Advisor Assistant POC.**