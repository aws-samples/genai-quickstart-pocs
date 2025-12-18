# BankIQ+ Deployment Guide

> Complete guide to deploy BankIQ+ - AI Banking Analytics Platform

## 🎯 What You're Deploying

**BankIQ+** is an AI-powered banking analytics platform that provides:
- Natural language queries for 500+ banks (SEC EDGAR database)
- 12 AI tools for FDIC data, SEC filings, peer comparison, document analysis
- Real-time financial metrics and comprehensive reports
- Document upload and analysis (10-K, 10-Q filings)
- Conversational memory across sessions

## 🏗️ Architecture

```
User (HTTPS) → CloudFront → ALB (HTTP) → ECS Fargate → AgentCore
                    ↓
                S3 (React App)
```

**Key Features:**
- No API Gateway = No 30-second timeout
- ECS Fargate auto-scaling
- AgentCore with Claude Sonnet 4.5
- 300-second timeout for long queries

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS account with admin access
- AWS Bedrock enabled in `us-east-1`
- AWS CLI installed and configured:
  ```bash
  aws configure
  # Enter your AWS Access Key ID, Secret Key, and region (us-east-1)
  ```

### 2. Install Required Tools

**Windows Users:** Use [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for one-command installation

**AgentCore CLI:**
```bash
pip install bedrock-agentcore-starter-toolkit
agentcore --version
```

**Docker:**
```bash
# macOS
brew install docker

# Linux
sudo apt-get install docker.io

# Windows (PowerShell as Admin)
choco install docker-desktop -y

# Verify
docker --version
```

**Node.js 18+:**
```bash
# macOS
brew install node@18

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows (PowerShell as Admin)
choco install nodejs -y

# Verify
node --version  # Should be 18.x or higher
```

### 3. Clone Repository
```bash
git clone <your-repo-url>
cd peer-bank-analytics-agentic
```

## 🚀 One-Command Deployment

```bash
./cfn/scripts/deploy-all.sh
```

**What it does:**
1. ✅ Deploys Cognito User Pool with Hosted UI
2. ✅ Deploys AgentCore agent with 12 tools
3. ✅ Adds S3 permissions to agent role
4. ✅ Creates VPC, ALB, ECS cluster
5. ✅ Builds and deploys backend Docker image with JWT verification
6. ✅ Builds and deploys React frontend with AWS Amplify Auth
7. ✅ Creates CloudFront distribution

**Time:** ~15-20 minutes

## 📝 Step-by-Step Deployment

If you prefer manual control:

### Phase 1: Deploy Agent
```bash
cd backend
agentcore launch -auc
cd ..
```

**Output:** Agent ARN (saved to `/tmp/agent_arn.txt`)

### Phase 2: Deploy Infrastructure
```bash
./cfn/scripts/phase2-infrastructure.sh
```

**Creates:** VPC, subnets, ALB, ECS cluster, S3 bucket

### Phase 3: Deploy Backend
```bash
./cfn/scripts/phase3-backend-codebuild.sh
```

**Creates:** Docker image (via CodeBuild), ECR repository, ECS service

### Phase 4: Deploy Frontend
```bash
./cfn/scripts/phase4-frontend.sh
```

**Creates:** React build, S3 upload, CloudFront distribution

## 🔍 Verify Deployment

### 1. Get CloudFront URL
```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, 'bankiq-frontend')].DomainName" \
  --output text
```

### 2. Test Health Check
```bash
CLOUDFRONT_URL="<your-cloudfront-url>"
curl https://$CLOUDFRONT_URL/api/health
# Expected: {"status":"healthy","service":"BankIQ+ Backend"}
```

### 3. Test Agent Query
```bash
curl -X POST https://$CLOUDFRONT_URL/api/invoke-agent \
  -H "Content-Type: application/json" \
  -d '{"inputText": "What is JPMorgan ticker?", "sessionId": "test-session-12345678901234567890"}'
```

### 4. Open in Browser
```bash
open https://$CLOUDFRONT_URL
```

## 🔐 Authentication

### Cognito User Pool
BankIQ+ uses AWS Cognito for secure authentication:
- **Self-Service Signup** - Users can create accounts via Hosted UI
- **OAuth 2.0 + JWT** - Industry-standard authentication
- **JWT Verification** - Backend validates tokens on every request
- **Session Management** - Automatic token refresh

### First Login
1. Open CloudFront URL
2. Click "Sign In with AWS Cognito"
3. Click "Sign up" on Cognito Hosted UI
4. Enter email and password
5. Verify email (check spam folder)
6. Login with credentials

### Create Additional Users
```bash
aws cognito-idp admin-create-user \
  --user-pool-id $(aws cloudformation describe-stacks --stack-name bankiq-auth --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text) \
  --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --region us-east-1
```

### Authentication Flow
1. User clicks "Sign In with AWS Cognito"
2. Redirects to Cognito Hosted UI
3. User enters credentials
4. Cognito returns authorization code
5. Amplify exchanges code for JWT tokens
6. Frontend stores tokens and includes in API requests
7. Backend verifies JWT signature on each request

## 🎨 Using the Platform

### Home Page
- **500+ Banks Available** - Access to entire SEC EDGAR database
- **12 AI Tools** - Automated tool selection by Claude
- **3 Data Sources** - FDIC, SEC EDGAR, CSV uploads

### Peer Analytics Tab
1. Select base bank (e.g., "JPMorgan Chase")
2. Select peer banks (e.g., "Bank of America", "Wells Fargo")
3. Choose metric (ROA, ROE, NIM, etc.)
4. Click "Analyze" - AI agent fetches FDIC data and generates comparison

### Financial Reports Tab

**Live Mode:**
1. Search for bank (e.g., "Webster")
2. Select from results
3. View 10-K and 10-Q filings
4. Click "Full Analysis" for comprehensive report

**Upload Mode:**
1. Upload PDF (10-K, 10-Q)
2. System extracts metadata (bank name, year, form type)
3. Uploads to S3
4. Click "Full Analysis" for AI-powered analysis

### Chat with Documents
1. Upload document or use live SEC filing
2. Ask questions: "What are the key risks?"
3. Agent reads document and provides specific answers

## 🧪 Testing Memory

Memory allows the agent to remember context across queries:

```bash
# First query
curl -X POST https://$CLOUDFRONT_URL/api/invoke-agent \
  -H "Content-Type: application/json" \
  -d '{"inputText": "What is Webster Financial ticker?", "sessionId": "memory-test-12345678901234567890"}'

# Second query (same sessionId)
curl -X POST https://$CLOUDFRONT_URL/api/invoke-agent \
  -H "Content-Type: application/json" \
  -d '{"inputText": "What is their CIK number?", "sessionId": "memory-test-12345678901234567890"}'
```

The agent remembers "their" = Webster Financial from the first query.

## 🛠️ Configuration

### Environment Variables (ECS Task)
- `AGENTCORE_AGENT_ARN` - Agent runtime ARN
- `UPLOADED_DOCS_BUCKET` - S3 bucket for documents (bankiq-uploaded-docs-prod)
- `REGION` - AWS region (us-east-1)
- `PORT` - Backend port (3001)

### Frontend Configuration
Edit `frontend/src/config.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  'https://your-cloudfront-url.cloudfront.net';
```

## 📊 Monitoring

### View ECS Logs
```bash
aws logs tail /ecs/bankiq-backend --follow
```

### View AgentCore Logs
```bash
aws logs tail /aws/bedrock-agentcore/runtimes/bank_iq_agent_v1-<id>-DEFAULT \
  --log-stream-name-prefix "2025/10/17/[runtime-logs]" --follow
```

### CloudWatch Dashboard
```bash
# Open GenAI Observability Dashboard
open "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#gen-ai-observability/agent-core"
```

## 🔧 Troubleshooting

### Issue: CloudFront returns 502
**Cause:** ECS task not healthy

**Solution:**
```bash
# Check ECS service
aws ecs describe-services --cluster bankiq-cluster --services bankiq-backend-service

# Check task health
aws ecs list-tasks --cluster bankiq-cluster --service-name bankiq-backend-service

# View logs
aws logs tail /ecs/bankiq-backend --follow
```

### Issue: Agent not responding
**Cause:** AgentCore not deployed or wrong ARN

**Solution:**
```bash
# Check agent status
agentcore status

# Verify ARN in ECS task
aws ecs describe-task-definition --task-definition bankiq-backend:latest \
  --query 'taskDefinition.containerDefinitions[0].environment'
```

### Issue: Document upload fails
**Cause:** S3 permissions missing

**Solution:**
```bash
# Add S3 permissions to AgentCore role
./cfn/scripts/add-s3-permissions.sh
```

### Issue: Session ID too short error
**Cause:** Session ID must be 33+ characters

**Solution:** Frontend automatically generates 40+ character session IDs. If testing manually, ensure session ID is at least 33 characters.

## 💰 Cost Estimate

Monthly costs (24/7 operation):

| Service | Cost |
|---------|------|
| ECS Fargate (0.5 vCPU, 1GB) | $15-20 |
| ALB | $16-20 |
| CloudFront | $1-5 |
| S3 | $1-2 |
| ECR | $1 |
| Bedrock (AgentCore + Claude) | $10-30 |
| **Total** | **$50-90/month** |

## 🔄 Update Deployment

### Update Agent Code
```bash
cd backend
# Edit bank_iq_agent_v1.py
agentcore launch -auc
```

### Update Backend
```bash
cd backend
docker build -f Dockerfile.backend -t bankiq-backend .
# Push to ECR (see phase3-backend-codebuild.sh)
# Force new deployment
aws ecs update-service --cluster bankiq-cluster --service bankiq-backend-service --force-new-deployment
```

### Update Frontend
```bash
cd frontend
npm run build
aws s3 sync build/ s3://bankiq-frontend-<account-id>-prod/ --delete
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

## 🧹 Cleanup

To delete all resources:

```bash
./cfn/scripts/cleanup.sh
```

**Deletes:**
- CloudFormation stacks (frontend, backend, infrastructure, auth)
- Cognito User Pool and all users
- ECR images and repositories
- S3 buckets (with all contents)
- ECS cluster and services
- CloudFront distribution
- AgentCore agent
- All associated resources

**⚠️ Warning**: This deletes the Cognito User Pool and all user accounts. Backup users if needed before cleanup.

## 📚 Additional Resources

- **Architecture Details:** [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
- **V2 Architecture:** [docs/V2_ARCHITECTURE_FINAL.md](docs/V2_ARCHITECTURE_FINAL.md)
- **Async Pattern:** [docs/ASYNC_PATTERN.md](docs/ASYNC_PATTERN.md)
- **Agent README:** [backend/README_AGENT.md](backend/README_AGENT.md)

## 🆘 Support

**Common Issues:**
1. Timeout errors → Check CloudFront/ALB timeout settings (should be 300s)
2. 502 errors → Check ECS task health and logs
3. CORS errors → Already configured, check CloudFront cache
4. Memory not working → Ensure consistent sessionId (33+ chars)

**AWS Documentation:**
- [AgentCore](https://aws.amazon.com/bedrock/agentcore/)
- [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Introduction.html)

## ✅ Success Checklist

- [ ] AWS CLI configured
- [ ] AgentCore CLI installed
- [ ] Docker installed
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] `./cfn/scripts/deploy-all.sh` completed
- [ ] CloudFront URL accessible
- [ ] Health check returns 200
- [ ] Agent query works
- [ ] Frontend loads in browser
- [ ] Can search banks
- [ ] Can view SEC filings
- [ ] Can upload documents
- [ ] Memory works across queries

---

**Version:** 1.0  
**Last Updated:** October 17, 2025  
**Status:** ✅ Production Ready
