# Quick Start Guide - Advisor Assistant POC

## Prerequisites (5 minutes)
- AWS Account with Bedrock access
- **Claude 3.5 Sonnet model access enabled** in AWS Bedrock console
- AWS CLI configured
- Docker installed
- **Note**: This POC deploys with HTTP endpoints. HTTPS would require additional configuration.
- **Platform**: Deployment tested on macOS. Windows deployment paths have not been fully tested.
- API Keys (optional but recommended):
  - NewsAPI: https://newsapi.org/ (free tier available)
  - FRED: https://fred.stlouisfed.org/docs/api/ (free access available)

### Enable Claude 3.5 Sonnet (Required)
1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to "Model access" under "Bedrock configurations"
3. Click "Modify model access"
4. Select "Anthropic Claude 3.5 Sonnet"
5. Complete the use case form and submit

## Deploy (10 minutes)
```bash
# Clone and deploy
git clone <your-repository-url>
cd advisor-assistant-poc

# Deploy with API keys (recommended)
NEWSAPI_KEY=your_key FRED_API_KEY=your_key ./deploy.sh poc us-east-1

# Or deploy without API keys
./deploy.sh poc us-east-1
```

## Test the Enhanced Analysis (5 minutes)
```bash
# Create test user
# Once created add user to admin group in Cognito to see Administrative permissions
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username testuser \
  --password NewPass123! \
  --permanent
```

### What's New in This Version
The platform now provides **institutional-quality analysis** suitable for high-net-worth wealth management:

**🆕 Fresh Analysis Button**:
- **One-Click Comprehensive Rebuild**: Clears all cached data and generates completely fresh analysis
- **Complete Data Refresh**: Re-fetches latest financial reports, news, and market data
- **Enhanced User Experience**: Clear progress indicators and automatic results display

**🆕 Institutional-Quality AI Analysis**:
- **Detailed Key Insights**: 4-5 comprehensive insights with specific growth rates and margin analysis
- **Quantified Risk Factors**: Specific risks with probability assessments and financial impact
- **Market-Sized Opportunities**: Revenue potential, market penetration analysis, and timeline projections
- **Investment Committee Ready**: Analysis quality suitable for institutional investment committees

**🆕 Comprehensive Data Integration**:
- **FRED Macroeconomic Data**: Federal Funds Rate, CPI, inflation trends integrated into all analyses
- **AI-Enhanced News Analysis**: Context-aware sentiment with confidence scores and relevance filtering
- **Market Context Analysis**: Industry-specific valuation and competitive positioning assessment

**🆕 Enhanced Display Quality**:
- **Fixed Object Display Issues**: Proper handling of complex analysis objects
- **Better Error Messages**: Clear progress indicators instead of "Not available"
- **Professional Presentation**: Institutional-grade formatting and data presentation

## Access
- **App**: http://your-alb-dns-name
- **Login**: /login.html
- **Health**: /api/health

## Quick Test APIs
```bash
# Add company
curl -X POST http://your-alb/api/companies \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL", "name": "Apple Inc."}'

# Fetch financial data
curl -X POST http://your-alb/api/fetch-data/AAPL

# Get AI analysis
curl http://your-alb/api/analysis/AAPL
```

## Cleanup
```bash
aws cloudformation delete-stack --stack-name advisor-assistant-poc-app
aws cloudformation delete-stack --stack-name advisor-assistant-poc-security
```

