# BankIQ+ CloudFormation Automation

Complete AWS CloudFormation automation for deploying BankIQ+ from scratch.

## 📦 What's Included

- **5 CloudFormation Templates** (nested stacks)
- **Packaging Script** (creates deployment package)
- **Deployment Script** (one-command deployment)
- **All Application Code** (agent, backend, frontend)

## 🏗️ Architecture

```
Phase 1: Prerequisites (ECR, S3, IAM)
   ↓
Phase 2: Agent (AgentCore + Claude Sonnet 4.5)
   ↓
Phase 3: Backend (ECS Fargate + ALB)
   ↓
Phase 4: Frontend (CloudFront + S3)
```

## 🚀 Quick Start

### For You (Package Creator)

```bash
# Create deployment package
cd cfn/scripts
./package.sh

# Share the package
# Output: cfn/bankiq-cfn-package.tar.gz
```

### For Your Friends (Package Users)

**Option 1: CLI Deployment (Easiest)**
```bash
# 1. Extract package
tar -xzf bankiq-cfn-package.tar.gz
cd package

# 2. Deploy (just provide stack name!)
./deploy.sh my-bankiq

# Or run without arguments to be prompted
./deploy.sh

# 3. Wait 15-20 minutes
# 4. Get CloudFront URL from outputs
```

**Option 2: AWS Console Deployment**
```bash
# 1. Extract package
tar -xzf bankiq-cfn-package.tar.gz
cd package

# 2. Setup (uploads artifacts to S3)
./setup-console-deploy.sh

# 3. Follow the instructions to deploy via AWS Console
# Template URL will be provided
```

## 📋 Prerequisites

**For Package Creator:**
- Docker installed
- Node.js 26+
- npm installed
- Project built and tested

**For Package Users:**
- AWS CLI configured
- Docker installed (for ECR push)
- Bedrock model access (Claude Sonnet 4.5)
- VPC with 2+ subnets in different AZs

## 📁 Package Contents

```
package/
├── templates/
│   ├── master.yaml           # Orchestrates all stacks
│   ├── prerequisites.yaml    # ECR, S3, IAM
│   ├── agent.yaml           # AgentCore deployment
│   ├── backend.yaml         # ECS Fargate + ALB
│   └── frontend.yaml        # CloudFront + S3
├── artifacts/
│   ├── agent.zip            # Python agent code
│   ├── backend-image.tar.gz # Docker image
│   └── frontend-build.zip   # React build
├── deploy.sh                # Deployment script
└── README.md               # Instructions
```

## 🎯 Deployment Options

### Basic Deployment (Recommended)
```bash
./deploy.sh my-bankiq
```

### Interactive Mode
```bash
./deploy.sh
# Will prompt for stack name
```

### What Happens Automatically
- ✅ Detects AWS region from your CLI config
- ✅ Creates new VPC with 2 public subnets
- ✅ Uses Claude Sonnet 4.5 by default
- ✅ Deploys everything in ~15-20 minutes

## 📊 What Gets Created

### AWS Resources
- **2 ECR Repositories** (backend, agent)
- **2 S3 Buckets** (frontend, uploaded-docs)
- **4 IAM Roles** (ECS, AgentCore, CodeBuild)
- **1 AgentCore Agent** (Claude Sonnet 4.5)
- **1 ECS Cluster** (Fargate)
- **1 Application Load Balancer**
- **1 CloudFront Distribution**
- **Security Groups, Log Groups, etc.**

### Outputs
- Application URL (CloudFront)
- Backend API URL
- Agent ARN
- All resource identifiers

## ⏱️ Deployment Timeline

- **Phase 1 (Prerequisites):** 2-3 minutes
- **Phase 2 (Agent):** 5-7 minutes
- **Phase 3 (Backend):** 5-7 minutes
- **Phase 4 (Frontend):** 3-5 minutes
- **Total:** 15-20 minutes

## 💰 Cost Estimate

Monthly costs (24/7 operation):
- ECS Fargate: $15-20
- ALB: $16-20
- CloudFront: $1-5
- S3: $1-2
- Bedrock: $10-30
- **Total: ~$50-90/month**

## 🔧 Customization

### Change Model
Edit `master.yaml` parameter `ModelId`

### Change Instance Size
Edit `backend.yaml` task definition CPU/Memory

### Add Custom Domain
Add Route53 + ACM certificate to `frontend.yaml`

## 🗑️ Cleanup

```bash
# Delete everything
./cleanup.sh my-bankiq

# Or interactive mode
./cleanup.sh
```

## 🐛 Troubleshooting

### Stack Creation Failed
```bash
# Check events
aws cloudformation describe-stack-events --stack-name bankiq --region us-east-1

# Check logs
aws logs tail /ecs/bankiq-backend --follow
```

### Agent Not Responding
```bash
# Check agent status
agentcore status

# View agent logs
aws logs tail /aws/bedrock-agentcore/runtimes/bankiq_agent_v1-xxx --follow
```

### Frontend Not Loading
```bash
# Check CloudFront distribution
aws cloudfront get-distribution --id XXXXX

# Invalidate cache
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

## 📝 Notes

- **Subnets:** Must be in different availability zones
- **VPC:** Must have internet gateway for public subnets
- **Bedrock:** Requires model access in your AWS account
- **CloudFront:** Takes 5-10 minutes to fully propagate

## 🤝 Support

For issues or questions:
1. Check CloudFormation events
2. Review CloudWatch logs
3. Verify prerequisites are met

## 📄 License

MIT License
