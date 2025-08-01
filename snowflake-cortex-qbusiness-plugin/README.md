# Snowflake Q Business Custom Plugin

This project creates a custom Amazon Q Business plugin that integrates directly with Snowflake Cortex Search, enabling users to query unstructured data stored in Snowflake through natural language interactions.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Amazon Q      │    │   Custom Plugin  │    │    Snowflake        │
│   Business      │◄──►│   (OpenAPI       │◄──►│    Cortex Search    │
│                 │    │    Schema +      │    │    Service          │
│                 │    │    OAuth 2.0)    │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Files Overview

- `snowflake-q-business-final.yaml` - Final CloudFormation template with comprehensive configuration
- `deploy-snowflake-qbusiness.sh` - Deployment script
- `test-deployment.sh` - Testing and verification script
- `aws-credentials.env` - AWS credentials configuration (not in git)

## Prerequisites

### AWS Requirements
- AWS Account with Amazon Q Business access
- Valid AWS credentials with permissions for:
  - CloudFormation stack creation
  - Q Business application management
  - Secrets Manager access
  - IAM role creation
  - IAM Identity Center access

### Snowflake Requirements
- Snowflake account with Cortex Search enabled
- OAuth security integration configured
- Cortex Search service created
- Existing Secrets Manager secret with OAuth credentials

## Quick Start

### Step 1: Set AWS Credentials

```bash
# Option 1: Use environment file (recommended)
source aws-credentials.env

# Option 2: Set environment variables directly
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_SESSION_TOKEN="your_session_token"  # if using temporary credentials
export AWS_DEFAULT_REGION="us-west-2"
```

### Step 2: Deploy the Plugin

```bash
./deploy-snowflake-qbusiness.sh <SECRETS_MANAGER_ARN> <IDC_INSTANCE_ARN> [APPLICATION_NAME]
```

Example:
```bash
./deploy-snowflake-qbusiness.sh \
  "arn:aws:secretsmanager:us-west-2:<account-id>:secret:snowflake/amazon-q-oauth-UKe0dC" \
  "arn:aws:sso:::instance/ssoins-xxxxxxxx" \
  "SnowflakeCortexApp"
```

### Step 3: Test the Deployment

```bash
./test-deployment.sh [STACK_NAME] [REGION]
```

Example:
```bash
./test-deployment.sh snowflake-qbusiness-plugin us-west-2
```

## Manual Configuration Required

⚠️ **Important**: Some Q Business features are not available through CloudFormation and must be configured manually:

### LLM Access Settings (Console Only)

1. **Go to Q Business Console**:
   - Navigate to: https://console.aws.amazon.com/qbusiness/
   - Select your application

2. **Enable LLM Features**:
   - Click "Edit" or go to "Settings"
   - Enable "Allow end users to send queries directly to the LLM"
   - Enable "Allow Amazon Q to fall back to LLM knowledge"
   - Save changes

### User Access Management

1. **Create Users in IAM Identity Center**:
   - Go to: https://console.aws.amazon.com/singlesignon/
   - Add users with appropriate email addresses

2. **Assign Q Business Subscriptions**:
   - Go to Q Business Console → Your App → Access management → Subscriptions
   - Assign Q Business Lite or Pro subscriptions to users

## CloudFormation Template Features

The template includes comprehensive configuration:

### ✅ Automated Configuration
- **Application Setup**: Q Business application with optimal settings
- **Plugin Integration**: Snowflake Cortex Search plugin with OpenAPI schema
- **OAuth Configuration**: Secure authentication with Snowflake
- **Web Experience**: Ready-to-use web interface
- **Auto Subscriptions**: Automatic Q Business Pro subscriptions for new users
- **Feature Enablement**: File uploads, personalization, Q Apps, sample prompts

### ⚠️ Manual Configuration Required
- **LLM Direct Access**: "Allow end users to send queries directly to the LLM"
- **LLM Knowledge Fallback**: "Allow Amazon Q to fall back to LLM knowledge"
- **User Management**: Creating users and assigning subscriptions

## Snowflake Configuration

The plugin uses the following Snowflake configuration (stored in Secrets Manager):

```json
{
  "account": "xxxxxY-xxxxx",
  "warehouse": "AMAZON_Q_WAREHOUSE",
  "database": "AMAZON_Q_BUSINESS",
  "schema": "CORTEX_SEARCH",
  "role": "AMAZON_Q_ROLE",
  "client_id": "your_oauth_client_id",
  "client_secret": "your_oauth_client_secret",
  "refresh_token": "your_refresh_token"
}
```

## Testing the Plugin

After deployment and manual configuration:

1. **Access the Web Experience**: Use the URL from deployment outputs
2. **Sign In**: Use your IAM Identity Center credentials
3. **Test Queries**: Try questions like:
   - "Search for pump maintenance procedures"
   - "Find information about troubleshooting"
   - "What are the safety guidelines?"

## Troubleshooting

### Common Issues

1. **Login Error: "Please ask your IT Admin to add access to General knowledge"**
   - Enable LLM access settings manually in the console (see Manual Configuration section)

2. **User Not Found**
   - Create the user in IAM Identity Center
   - Assign Q Business subscription to the user
   - Wait up to 24 hours for changes to propagate

3. **Plugin Not Working**
   - Verify Snowflake OAuth credentials in Secrets Manager
   - Check that Cortex Search service is active in Snowflake
   - Ensure plugin is enabled in Q Business console

### Debug Commands

Check stack status:
```bash
aws cloudformation describe-stacks --stack-name snowflake-qbusiness-plugin --region us-west-2
```

View stack events:
```bash
aws cloudformation describe-stack-events --stack-name snowflake-qbusiness-plugin --region us-west-2
```

Get application details:
```bash
aws qbusiness get-application --application-id <APP_ID> --region us-west-2
```

## Security Considerations

- OAuth credentials are stored securely in AWS Secrets Manager
- IAM roles follow least privilege principle
- All communications use HTTPS
- Session tokens have limited validity

## Cost Considerations

### AWS Costs
- Q Business application usage (based on user subscriptions)
- Secrets Manager storage (minimal)
- CloudFormation (no additional cost)
- Lambda function executions (minimal)

### Snowflake Costs
- Warehouse compute time for queries
- Cortex Search operations
- Data storage and transfer

## Cleanup

To remove the plugin and associated resources:

```bash
aws cloudformation delete-stack --stack-name snowflake-qbusiness-plugin --region us-west-2
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CloudFormation stack events
3. Verify Snowflake configuration and permissions
4. Check AWS Q Business application status in the console

## License

This project is licensed under the Apache License 2.0 - see the code headers for details.
