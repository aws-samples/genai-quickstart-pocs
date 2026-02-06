# Deployment Prerequisites

## Overview

This guide covers all prerequisites for deploying the BetterBank Card Operations system with Amazon Connect integration.

---

## AWS Account Requirements

### IAM Permissions

The deploying user/role must have permissions to create and manage:

**Core Services:**
- Lambda Functions (create, update, invoke)
- IAM Roles and Policies (create custom roles)
- DynamoDB Tables (create, configure)
- S3 Buckets (create, upload objects)
- CloudFormation Stacks (create, update, delete)
- CloudWatch Log Groups (create, configure retention)

**VPC Services:**
- VPCs, Subnets, Route Tables
- NAT Gateways
- Internet Gateways
- VPC Endpoints (Gateway endpoints for DynamoDB)
- Security Groups
- Elastic IPs (for NAT Gateway)

**AI Services:**
- Amazon Bedrock (Agent creation and configuration)
- AgentCore Gateway (create and manage)
- Amazon Connect (instance access, contact flows)
- AWS KMS (for Connect Assistant encryption)

---

## Service Quotas

Verify these limits in your AWS account:

| Service | Quota | Default |
|---------|-------|---------|
| Lambda concurrent executions | Per region | 1000 |
| DynamoDB tables | Per region | 2500 |
| VPCs | Per region | 5 |
| NAT Gateways | Per AZ | 5 |
| Elastic IPs | Per region | 5 |

---

## Regional Availability

Ensure these services are available in your target region:

**Always Required:**
- AWS Lambda
- Amazon DynamoDB
- AWS CloudFormation
- Amazon VPC
- NAT Gateway

**For AI Integration:**
- Amazon Bedrock (limited regions: us-east-1, us-west-2, etc.)
- AgentCore Gateway (preview service, may require allowlist)
- Amazon Connect (if using voice/chat)

---

## Amazon Connect Setup

### Step 1: Create Amazon Connect Instance

#### 1.1 Navigate to Connect Console

1. Open [Amazon Connect Console](https://console.aws.amazon.com/connect/)
2. Click **Create instance**
3. Verify region: **us-west-2** or **us-east-1**

#### 1.2 Configure Identity Management

- **Identity management**: Store users within Amazon Connect
- **Access URL**: `betterbank-[your-initials]-[date]`
  - Example: `betterbank-js-20240115`
  - Must be globally unique, lowercase letters/numbers/hyphens only, 1-63 characters
  - If taken, try adding your name or random number
- Click **Next**

#### 1.3 Configure Administrator

**Important**: Create an administrator account for managing your Connect instance.

- **Add a new admin**: Select **Yes**
- **Administrator details**:
  - Username: `admin`
  - Password: Generate a secure password (see options below)
  - First name: `Admin`
  - Last name: `User`
  - Email: Enter your email address
- Click **Next**

**Secure Password Generation Options:**

For development/workshop environments:
```bash
# Option 1: Generate a random 16-character password (Recommended)
openssl rand -base64 12 | tr -d "=+/" | cut -c1-16
# Example output: xK9mP2nQ7vR4sL8w

# Option 2: Use a memorable but secure pattern
# Pattern: [Capital][symbol][word][number][symbol]
# Example: C!onnect2024# or A!gents2024$
```

For production environments:
- Use AWS Secrets Manager to store credentials
- Enforce MFA for all administrators
- Use SSO integration (SAML 2.0) instead of local accounts

**Workshop Quick Option**: `A!Ag3nts2024` (for workshop only)

**Save Your Credentials**: Store the admin username and password securely. You'll need them to access the Connect admin interface.

#### 1.4 Configure Telephony

- ✅ **I want to handle incoming calls with Amazon Connect**
- ✅ **I want to make outbound calls with Amazon Connect**
- Click **Next**

#### 1.5 Configure Data Storage

- Accept all defaults (S3 buckets auto-created)
- Click **Next**

#### 1.6 Review and Create

- Review configuration
- Click **Create instance**
- Wait for status: **Active** (2-4 minutes)

#### 1.7 Save Instance Information

1. Click on instance → **Instance details**
2. Copy to text file:

```
=== Amazon Connect Configuration ===
ConnectInstanceArn: arn:aws:connect:us-west-2:123456789012:instance/abcd-1234-efgh-5678
ConnectInstanceUrl: https://[YOUR-ALIAS].my.connect.aws/
```

---

### Step 2: Enable Amazon Q in Connect Assistant

#### 2.1 Navigate to Connect Assistant

1. Navigate back to the Amazon Connect Console
2. Select your Amazon Connect instance from the list
3. In the navigation pane under **Applications**, choose **AI Agents**
4. Then, choose **Amazon Q in Connect**
5. Click **Add domain**

#### 2.2 Create Assistant Domain

On the **Add domain** page:

- **Domain name**: Enter a friendly name
  - Example: `betterbank-assistant` or `cardguard-assistant`
- **Under Encryption**:
  - Select the input box below **AWS KMS Key**
  - Choose **Create a new KMS key**
  - Provide a key alias name: `betterbank-connect-assistant-key`

**KMS Key Options:**

When you enable Amazon Q in Connect Assistant:
- **Default**: Domain encrypted with AWS owned key (managed by AWS)
- **Recommended**: Create a customer-managed KMS key (you control permissions)

Two KMS keys can be used:
1. **Connect Assistant domain key** - Encrypts excerpts in recommendations
2. **Content import key** - Encrypts content from S3, SharePoint, Salesforce, etc.

For this deployment, we'll create one key and use it for both purposes.

#### 2.3 Configure KMS Key Policy (Before Completing Domain)

**IMPORTANT: Do This Before Clicking 'Add Domain'**

Before completing the domain creation, you must configure the KMS key policy. If you skip this, you'll encounter permission errors when integrating your API and knowledge base.

1. Open a new browser tab and go to **AWS KMS Console**
2. Navigate to **Customer managed keys**
3. Find your newly created key:
   - Key alias: `betterbank-connect-assistant-key`
   - Sort by **Creation date** (newest first)
4. Click on the key → **Key policy** tab → **Edit**
5. Replace the entire policy with this (replace `YOUR-ACCOUNT-ID` on line 8):

```json
{
  "Id": "key-consolepolicy-for-connect-assistant",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow Amazon Connect to use the key",
      "Effect": "Allow",
      "Principal": {
        "Service": "connect.amazonaws.com"
      },
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
```

**Find Your AWS Account ID:**

Option 1: AWS Console
- Click your username in top-right corner → Account ID shown

Option 2: AWS CLI
```bash
aws sts get-caller-identity --query Account --output text
```

6. Click **Save changes**
7. Verify success message: "Key policy updated successfully"

#### 2.4 Complete Domain Creation

1. Return to the Amazon Connect Console tab (where you started creating the domain)
2. In the **AWS KMS Key** dropdown, select your key: `betterbank-connect-assistant-key`
3. Click **Add domain**
4. Wait for status: **Active** (2-3 minutes)

#### 2.5 Save Assistant Information

Copy to your text file:

```
=== Amazon Q in Connect Assistant ===
Domain Name: betterbank-assistant
KMS Key Alias: betterbank-connect-assistant-key
Status: Active
```

---

## Software Requirements

### For Command-Line Deployment

- AWS CLI v2.x: [Installation Guide](https://aws.amazon.com/cli/)
- AWS CDK: `npm install -g aws-cdk`
- Node.js 18+
- Python 3.11+
- Bash (Linux/Mac) or PowerShell (Windows)

### For GUI Deployment

- AWS Console access
- Pre-packaged files (provided by deployment scripts)

---

## Network Requirements

- **VPC CIDR**: Default `10.0.0.0/16` (customizable)
- **Subnets**:
  - Public: `10.0.0.0/24`, `10.0.1.0/24`
  - Private: `10.0.2.0/24`, `10.0.3.0/24`
- **NAT Gateway**: Required for Lambda internet access
- **VPC Gateway Endpoints**: For DynamoDB and S3 (keeps traffic private, no data transfer costs)
- **No Interface Endpoints required**

---

## Cost Considerations

- **Lambda**: ~$10/month (MCP + Card Operations)
- **DynamoDB**: ~$5/month (free tier eligible)
- **S3**: ~$1/month (knowledge base storage)
- **NAT Gateway**: ~$32/month + data transfer
- **VPC**: No charge
- **VPC Endpoints**: No charge
- **CloudWatch**: ~$1/month
- **Amazon Connect**: Pay-per-use (voice/chat minutes)
- **Amazon Q in Connect**: Pay-per-conversation
- **Total Infrastructure: ~$50/month** (excluding Connect usage)

---

## Pre-Deployment Checklist

- [ ] AWS account with appropriate IAM permissions
- [ ] Target region supports all required services (us-east-1 or us-west-2 recommended)
- [ ] Service quotas verified
- [ ] AWS CLI and CDK installed
- [ ] Node.js 18+ and Python 3.11+ installed
- [ ] Network CIDR ranges reviewed
- [ ] Cost estimates reviewed and approved
- [ ] Amazon Connect instance created and active
- [ ] Amazon Q in Connect Assistant enabled
- [ ] KMS key configured for Connect Assistant
- [ ] Connect instance ARN and URL saved

---

## Next Steps

- **Deploy Infrastructure**: See [Deployment Guide](DEPLOYMENT.md)
- **Configure Gateway**: See [Configuration Guide](CONFIGURATION.md)
- **Local Testing**: See [Local Development](LOCAL_DEVELOPMENT.md)
