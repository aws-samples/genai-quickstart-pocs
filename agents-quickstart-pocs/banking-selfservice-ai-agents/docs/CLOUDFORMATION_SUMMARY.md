# CloudFormation Template - Summary

## What We Created

A complete AWS infrastructure-as-code template that deploys your entire backend with one command.

## Files Created

### 1. `template.yaml` - Main CloudFormation Template
**What it does:** Defines all AWS resources

**Creates:**
- 4 DynamoDB tables (customers, accounts, cards, card-requests)
- 1 Lambda function (card operations handler)
- 1 API Gateway (REST API with 3 endpoints)
- IAM roles and permissions
- CloudWatch log groups

**Features:**
- Environment-based naming (dev/staging/prod)
- Pay-per-request billing (cost-effective)
- Automatic permissions setup
- CORS enabled for web access

### 2. `scripts/deploy.sh` - Deployment Script
**What it does:** Automates the deployment process using AWS CLI

**Steps:**
1. Validates AWS credentials
2. Creates S3 bucket for artifacts
3. Builds Lambda package (or uses existing)
4. Uploads package to S3
5. Validates CloudFormation template
6. Deploys stack to AWS
7. Shows stack outputs

**Usage:**
```bash
./scripts/deploy.sh              # Deploy to dev
./scripts/deploy.sh staging      # Deploy to staging
./scripts/deploy.sh prod         # Deploy to production
```

### 3. `scripts/seed_data_aws.py` - AWS Data Seeder
**What it does:** Populates AWS DynamoDB with test data

**Creates:**
- 3 mock customers
- 5 bank accounts
- 5 debit cards

**Usage:**
```bash
python3 scripts/seed_data_aws.py
```

### 4. `scripts/package.sh` - Package Builder
**What it does:** Creates lambda-deployment.zip for deployment

**Steps:**
1. Installs Python dependencies
2. Copies source code
3. Creates deployment package

**Usage:**
```bash
./scripts/package.sh
```

### 5. `DEPLOYMENT_GUIDE.md` - Complete Guide
**What it includes:**
- Prerequisites
- Step-by-step instructions
- Troubleshooting
- Cost estimates
- Monitoring tips

### 6. `QUICK_REFERENCE.md` - Cheat Sheet
**What it includes:**
- Common commands
- API endpoints
- Test data
- Quick troubleshooting

---

## How It Works

### Traditional Way (Manual)
```
1. Log into AWS Console
2. Create DynamoDB table 1 (20 clicks)
3. Create DynamoDB table 2 (20 clicks)
4. Create DynamoDB table 3 (20 clicks)
5. Create DynamoDB table 4 (20 clicks)
6. Create Lambda function (30 clicks)
7. Upload code (10 clicks)
8. Create IAM role (15 clicks)
9. Attach policies (10 clicks)
10. Create API Gateway (40 clicks)
11. Configure endpoints (30 clicks)
12. Deploy API (5 clicks)

Total: ~200 clicks, 2-3 hours, error-prone
```

### CloudFormation Way (Automated)
```bash
./scripts/deploy.sh

Total: 1 command, 5 minutes, repeatable
```

---

## Architecture Deployed

```
┌─────────────────────────────────────────────────────┐
│                   AWS Cloud                          │
│                                                      │
│  ┌──────────────┐                                   │
│  │ API Gateway  │ (REST API)                        │
│  │ /v1/cards/*  │                                   │
│  └──────┬───────┘                                   │
│         │                                            │
│         ▼                                            │
│  ┌──────────────┐                                   │
│  │   Lambda     │ (Python 3.11)                     │
│  │   Function   │ (Card Operations)                 │
│  └──────┬───────┘                                   │
│         │                                            │
│         ▼                                            │
│  ┌──────────────────────────────────────┐          │
│  │         DynamoDB Tables               │          │
│  │  ┌────────────┐  ┌────────────┐     │          │
│  │  │ Customers  │  │  Accounts  │     │          │
│  │  └────────────┘  └────────────┘     │          │
│  │  ┌────────────┐  ┌────────────┐     │          │
│  │  │   Cards    │  │  Requests  │     │          │
│  │  └────────────┘  └────────────┘     │          │
│  └──────────────────────────────────────┘          │
│                                                      │
│  ┌──────────────┐                                   │
│  │ CloudWatch   │ (Logs & Metrics)                  │
│  │    Logs      │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

---

## Deployment Process

```
1. Developer runs: ./scripts/deploy.sh
   ↓
2. Script validates AWS credentials
   ↓
3. Builds Lambda package (if needed)
   ↓
4. Uploads lambda-deployment.zip to S3
   ↓
5. CloudFormation creates/updates stack
   ↓
6. Resources created in order:
   - DynamoDB tables
   - IAM roles
   - Lambda function
   - API Gateway
   - CloudWatch logs
   ↓
7. Stack outputs displayed
   ↓
8. API endpoint ready to use!
```

---

## What Gets Created in AWS

### DynamoDB Tables (4)
```
bank-customers-dev
bank-accounts-dev
bank-cards-dev
bank-card-requests-dev
```

### Lambda Function (1)
```
banking-selfservice-ai-agents-dev
- Runtime: Python 3.11
- Memory: 512 MB
- Timeout: 30 seconds
```

### API Gateway (1)
```
banking-selfservice-ai-agents-dev
- Stage: v1
- Endpoints: /cards/lock, /cards/unlock, /cards/request-new
```

### IAM Roles (2)
```
- Lambda execution role (with DynamoDB permissions)
- MCP server role (with Lambda invoke permissions)
```

### CloudWatch Log Group (1)
```
/aws/lambda/banking-selfservice-ai-agents-dev
- Retention: 30 days
```

---

## Benefits of CloudFormation

### 1. **Repeatability**
- Deploy to multiple environments (dev/staging/prod)
- Same infrastructure every time
- No human error

### 2. **Version Control**
- Infrastructure as code
- Track changes in Git
- Review before deploying

### 3. **Easy Updates**
- Change template
- Run deploy script
- CloudFormation updates only what changed

### 4. **Easy Cleanup**
- Delete entire stack with one command
- No orphaned resources
- Clean AWS account

### 5. **Documentation**
- Template is self-documenting
- Shows exactly what's deployed
- Easy for others to understand

---

## Cost Breakdown

### Development Environment (Low Traffic)

| Resource | Cost |
|----------|------|
| DynamoDB (4 tables, pay-per-request) | ~$1-3/month |
| Lambda (1M requests free tier) | $0-1/month |
| API Gateway (1M requests free tier) | $0-3/month |
| CloudWatch Logs | ~$0.50/month |
| S3 (deployment artifacts) | ~$0.10/month |
| **Total** | **~$2-8/month** |

### Production (Moderate Traffic - 100K requests/day)

| Resource | Cost |
|----------|------|
| DynamoDB | ~$20-50/month |
| Lambda | ~$10-20/month |
| API Gateway | ~$10-15/month |
| CloudWatch | ~$5/month |
| **Total** | **~$45-90/month** |

---

## Deployment Checklist

### Before First Deployment
- [ ] AWS CLI installed
- [ ] Python 3.11+ installed (for building package)
- [ ] AWS credentials configured
- [ ] Reviewed template.yaml
- [ ] Chose environment (dev/staging/prod)

### Deployment
- [ ] Run `./scripts/deploy.sh`
- [ ] Wait for completion (~5 minutes)
- [ ] Note the API endpoint from outputs
- [ ] Run `python3 scripts/seed_data_aws.py`
- [ ] Test API endpoints

### After Deployment
- [ ] Verify all tables created
- [ ] Check Lambda function works
- [ ] Test API Gateway endpoints
- [ ] Review CloudWatch logs
- [ ] Update MCP server with API endpoint

---

## Updating After Code Changes

```bash
# 1. Make code changes
vim src/lambda_handler/handler.py

# 2. Test locally
python3 scripts/test_local.py

# 3. Deploy to AWS
./scripts/deploy.sh

# 4. Test in AWS
curl -X POST "https://your-api/v1/cards/lock" ...
```

CloudFormation will:
- Detect code changes
- Update Lambda function
- Keep everything else unchanged
- Zero downtime deployment

---

## Rollback

If deployment fails or has issues:

```bash
# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name banking-selfservice-ai-agents-dev

# Or delete and redeploy
aws cloudformation delete-stack \
  --stack-name banking-selfservice-ai-agents-dev

./scripts/deploy.sh
```

---

## Multi-Environment Strategy

### Development
```bash
./scripts/deploy.sh dev
```
- For testing
- Frequent updates
- Lower cost

### Staging
```bash
./scripts/deploy.sh staging
```
- Pre-production testing
- Matches production config
- Final validation

### Production
```bash
./scripts/deploy.sh prod
```
- Live customer traffic
- Requires approval
- Monitored closely

Each environment is completely isolated!

---

## Next Steps

1. ✅ **Deploy to dev:** `./scripts/deploy.sh`
2. ✅ **Seed data:** `python3 scripts/seed_data_aws.py`
3. ✅ **Test API:** Use curl or Postman
4. ⏳ **Update MCP server** with API endpoint
5. ⏳ **Configure Amazon Connect**
6. ⏳ **Set up Bedrock Agent**
7. ⏳ **Demo with Jeanie!**

---

## Support

**Questions about CloudFormation?**
- See `DEPLOYMENT_GUIDE.md` for detailed instructions
- See `QUICK_REFERENCE.md` for common commands
- Check AWS CloudFormation documentation

**Deployment issues?**
- Check `./scripts/deploy.sh` output
- View CloudWatch logs
- Review CloudFormation events in AWS Console
