# 🚀 Quick Demo Deployment Guide

## Overview

This guide shows how to deploy the Investment AI Agent for demo purposes using a single AWS account, without setting up multiple environments.

## Prerequisites

- **AWS Account**: Single AWS account with admin permissions
- **AWS CLI**: Configured with your credentials
- **Node.js**: Version 18+ installed
- **AWS CDK**: Version 2.100.0+ installed globally

## Quick Setup

### 1. Install Dependencies

```bash
cd investment-ai-agent
npm install
```

### 2. Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (e.g., us-east-1)
```

### 3. Bootstrap CDK (One-time setup)

```bash
npx cdk bootstrap
```

### 4. Build the Project

```bash
npm run build
```

## Demo Deployment Options

### Option 1: Simple Dev Deployment (Recommended for Demo)

Deploy everything to your single AWS account as a development environment:

```bash
# Deploy with dev configuration
npm run deploy:dev
```

This will create:
- Lambda functions for the API
- DynamoDB tables for data storage
- S3 bucket for file uploads
- API Gateway for REST endpoints
- Cognito for authentication (optional)

### Option 2: Minimal Deployment (Fastest)

If you want the absolute fastest deployment, you can deploy with minimal features:

```bash
# Deploy minimal version
npx cdk deploy --context environment=demo --context minimal=true
```

### Option 3: Local Demo Server (Fastest)

For the quickest demo without AWS deployment:

```bash
# Start local demo server with mock data
npm run demo:local
```

This runs a demo server locally on `http://localhost:3000` with realistic mock data and agent workflow simulation.

## Demo Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Demo environment settings
NODE_ENV=demo
AWS_REGION=us-east-1
BEDROCK_REGION=us-east-1

# Optional: Mock mode for faster testing
MOCK_AI_RESPONSES=true
MOCK_MARKET_DATA=true
```

### Simplified CDK Stack

Create a demo-specific CDK configuration by adding this to `cdk.json`:

```json
{
  "context": {
    "demo": {
      "enableMonitoring": false,
      "enableBackups": false,
      "enableMultiAZ": false,
      "minimalResources": true
    }
  }
}
```

## Testing Your Demo

### 1. Check API Health

```bash
# Test the deployed API
curl https://your-api-gateway-url/health
```

### 2. Test Investment Idea Generation

```bash
# Test investment idea endpoint
curl -X POST https://your-api-gateway-url/api/v1/ideas/generate \
  -H "Content-Type: application/json" \
  -d '{
    "investmentHorizon": "medium",
    "riskTolerance": "moderate",
    "sectors": ["technology"],
    "assetClasses": ["stocks"],
    "maximumIdeas": 2
  }'
```

### 3. Open Web Interface

Navigate to the CloudFront URL or S3 static website URL provided after deployment.

## Demo Features Available

### ✅ Core Features (Always Available)
- Investment idea generation API
- Multi-agent AI orchestration
- Web interface for testing
- Basic authentication

### ⚡ Quick Demo Features (With Mocks)
- Instant responses (no real AI calls)
- Sample investment ideas
- Mock market data
- Faster testing cycles

### 🔧 Full Features (Real AI)
- Real Amazon Bedrock AI models
- Live market data integration
- Complete multi-agent workflow
- Full compliance checking

## Cost Optimization for Demo

### Minimal Cost Deployment

```bash
# Deploy with cost optimization
npx cdk deploy --context costOptimized=true
```

This enables:
- On-demand DynamoDB billing
- Minimal Lambda memory allocation
- No CloudWatch detailed monitoring
- Single AZ deployment

### Expected Demo Costs

- **Lambda**: ~$0.20/month for light usage
- **DynamoDB**: ~$0.25/month for demo data
- **API Gateway**: ~$3.50/million requests
- **S3**: ~$0.02/month for static files
- **Bedrock**: Pay per API call (~$0.01-0.10 per request)

**Total estimated cost for demo: $5-10/month**

## Cleanup After Demo

To remove all AWS resources:

```bash
# Destroy the stack
npx cdk destroy --all
```

This will delete all created AWS resources to avoid ongoing charges.

## Troubleshooting

### Common Issues

1. **CDK Bootstrap Error**
   ```bash
   # Re-run bootstrap with explicit region
   npx cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

2. **Bedrock Access Denied**
   - Enable Bedrock models in AWS Console
   - Go to Bedrock → Model access → Request access

3. **Lambda Timeout**
   - Increase timeout in CDK stack
   - Or enable mock mode for faster responses

4. **CORS Issues**
   - Check API Gateway CORS settings
   - Verify frontend is using correct API URL

### Quick Fixes

```bash
# Rebuild and redeploy
npm run build && npm run deploy:dev

# Check logs
aws logs tail /aws/lambda/investment-ai-agent --follow

# Test locally first
npm run demo:local
```

## Demo Script

### 5-Minute Demo Flow

1. **Show Web Interface** (2 minutes)
   - Open the deployed web app
   - Fill out investment preferences form
   - Show agent workflow visualization

2. **Generate Investment Ideas** (2 minutes)
   - Submit form and show real-time agent progress
   - Display generated investment recommendations
   - Highlight AI explanations and confidence scores

3. **Show API Integration** (1 minute)
   - Demonstrate REST API calls
   - Show JSON responses
   - Explain integration possibilities

### Demo Talking Points

- **Multi-Agent AI**: 6 specialized agents working together
- **Amazon Bedrock**: Using Claude and Nova models
- **Real-time Processing**: Live agent workflow visualization
- **Enterprise Ready**: Complete API, authentication, monitoring
- **Scalable Architecture**: AWS serverless infrastructure

---

**Ready to demo in under 10 minutes!** 🚀