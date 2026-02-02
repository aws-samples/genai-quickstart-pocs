# Customer Deployment Guide

**Simple AWS Console-Based Deployment** - No command-line tools needed!

This guide is designed for customers who want to deploy the Card Operations API using only the AWS Console web interface.

---

## What You Need

1. AWS Account with appropriate permissions
2. Two files provided to you:
   - `lambda-deployment.zip` - The application code
   - `template.yaml` - The infrastructure template

---

## Deployment Steps

### Step 1: Upload Lambda Code to S3

1. **Open AWS Console** and log in

2. **Navigate to S3 service**
   - Search for "S3" in the top search bar
   - Click on "S3"

3. **Create a bucket** (or use an existing one):
   - Click the orange "Create bucket" button
   - **Bucket name**: Enter a unique name (e.g., `my-company-bank-lambda`)
   - **AWS Region**: Select your preferred region (e.g., `US East (N. Virginia)`)
   - Leave all other settings as default
   - Click "Create bucket" at the bottom

4. **Upload the Lambda code**:
   - Click on your newly created bucket name
   - Click the orange "Upload" button
   - Click "Add files"
   - Select the `lambda-deployment.zip` file
   - Click the orange "Upload" button at the bottom
   - Wait for upload to complete

5. **Note your bucket name** - Write it down, you'll need it in the next step!

---

### Step 2: Deploy via CloudFormation

1. **Navigate to CloudFormation service**
   - Search for "CloudFormation" in the top search bar
   - Click on "CloudFormation"

2. **Create a new stack**:
   - Click the orange "Create stack" button
   - Select "With new resources (standard)"

3. **Upload the template**:
   - Under "Prepare template", select "Template is ready"
   - Under "Template source", select "Upload a template file"
   - Click "Choose file" and select `template.yaml`
   - Click orange "Next" button

4. **Configure stack details**:
   - **Stack name**: Enter `banking-selfservice-ai-agents-dev`
   - **Parameters section**:
     - **Environment**: Leave as `dev` (or select `staging`/`prod` if needed)
     - **LambdaCodeBucket**: Enter the S3 bucket name from Step 1
     - **LambdaCodeKey**: Leave as `lambda-deployment.zip`
   - Click orange "Next" button

5. **Configure stack options** (optional):
   - You can add tags if desired (e.g., Key: `Project`, Value: `Bank Card Operations`)
   - Leave all other settings as default
   - Click orange "Next" button

6. **Review and create**:
   - Review all your settings
   - Scroll to the bottom
   - ✅ **Check the box** next to "I acknowledge that AWS CloudFormation might create IAM resources with custom names"
   - Click the orange "Submit" button

7. **Wait for deployment** (5-10 minutes):
   - You'll see the stack status as "CREATE_IN_PROGRESS"
   - Click the refresh button (↻) periodically to check progress
   - Wait until status changes to "CREATE_COMPLETE" ✅
   - If it fails, see Troubleshooting section below

---

### Step 3: Get Your API Endpoint and API Key

Once deployment shows "CREATE_COMPLETE":

1. Click on your stack name (`banking-selfservice-ai-agents-dev`)
2. Click the "Outputs" tab
3. Find these important values:
   - **ApiEndpoint** - Your API URL (e.g., `https://abc123xyz.execute-api.us-east-1.amazonaws.com/v1`)
   - **ApiKeyId** - Your API Key ID
   - **GetApiKeyCommand** - Command to retrieve your API key

4. **Get your API key**:
   - Copy the full command shown in "GetApiKeyCommand" output
   - Open **AWS CloudShell** (click icon in top-right of AWS Console)
   - Paste and run the command
   - Copy the API key value that's displayed

5. **Save these values securely**:
   - API Endpoint URL
   - API Key value

**Note:** The API key is required for all API requests. Keep it secure!

---

## Testing Your Deployment

### Option 1: Using Postman (Recommended)

1. Open Postman
2. Create a new POST request
3. Enter URL: `YOUR-API-ENDPOINT/cards/lock` (replace with your actual endpoint)
4. Set Headers:
   - `Content-Type`: `application/json`
   - `x-api-key`: `YOUR-API-KEY` (paste your API key here)
5. Set Body (raw JSON):
```json
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```
6. Click Send

Expected response:
```json
{
  "success": true,
  "message": "Card successfully locked"
}
```

### Option 2: Using Command Line

If you have curl installed:
```bash
# Set your API key as environment variable
export API_KEY="your-api-key-here"

# Test the API
curl -X POST https://YOUR-API-ENDPOINT/cards/lock \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"customer_id": "CUST001", "card_id": "CARD001"}'
```

---

## Available API Endpoints

All endpoints use the POST method and require JSON body:

### 1. Lock Card
- **URL**: `POST {ApiEndpoint}/cards/lock`
- **Body**:
```json
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### 2. Unlock Card
- **URL**: `POST {ApiEndpoint}/cards/unlock`
- **Body**:
```json
{
  "customer_id": "CUST001",
  "card_id": "CARD001"
}
```

### 3. Request New Card
- **URL**: `POST {ApiEndpoint}/cards/request-new`
- **Body**:
```json
{
  "customer_id": "CUST001",
  "account_id": "ACC001",
  "reason": "Lost card",
  "delivery_address": "123 Main St, Cincinnati, OH 45202"
}
```

---

## What Was Created in Your AWS Account

CloudFormation created these resources:

| Resource Type | Name | Purpose |
|--------------|------|---------|
| DynamoDB Table | `bank-customers-dev` | Stores customer information |
| DynamoDB Table | `bank-accounts-dev` | Stores bank accounts |
| DynamoDB Table | `bank-cards-dev` | Stores debit card data |
| DynamoDB Table | `bank-card-requests-dev` | Stores card replacement requests |
| Lambda Function | `banking-selfservice-ai-agents-dev` | Handles API requests |
| API Gateway | `banking-selfservice-ai-agents-dev` | Provides HTTP endpoints |
| IAM Role | (auto-generated) | Permissions for Lambda |
| CloudWatch Log Group | `/aws/lambda/banking-selfservice-ai-agents-dev` | Application logs |

---

## Updating the Deployment

If you receive an updated `lambda-deployment.zip`:

### Option 1: Update Lambda Code Only (Faster)

1. **Go to S3**:
   - Find your bucket
   - Upload the new `lambda-deployment.zip` (it will replace the old one)

2. **Go to CloudFormation**:
   - Select your stack
   - Click "Update"
   - Select "Use current template"
   - Click Next → Next → Next
   - Check the IAM acknowledgment box
   - Click "Submit"

### Option 2: Full Stack Update

If you also have a new `template.yaml`:
1. Follow Step 2 again but click "Update" instead of "Create stack"
2. Upload the new template
3. Proceed through the wizard

---

## Troubleshooting

### Stack Creation Failed

1. **Check the error**:
   - In CloudFormation, click on your stack
   - Click the "Events" tab
   - Look for rows with "Failed" status
   - Read the "Status reason" column

2. **Common issues**:
   - **Wrong S3 bucket name**: Make sure you entered it exactly as it appears in S3
   - **File not found**: Ensure `lambda-deployment.zip` was uploaded to the bucket
   - **Insufficient permissions**: Contact your AWS administrator
   - **Region mismatch**: Make sure S3 bucket and CloudFormation are in the same region

3. **Fix and retry**:
   - Delete the failed stack: Select stack → Actions → Delete stack
   - Wait for deletion to complete
   - Start over from Step 2

### API Returns 500 Error

1. **Check Lambda logs**:
   - Go to CloudWatch service
   - Click "Log groups"
   - Find `/aws/lambda/banking-selfservice-ai-agents-dev`
   - Click on the most recent log stream
   - Look for error messages

2. **Common causes**:
   - Database not seeded with test data
   - Lambda permissions issue
   - Configuration error

### API Returns 403 Forbidden

- Verify you're using the correct API endpoint from the Outputs tab
- Check that you're sending proper JSON in the request body
- Verify Content-Type header is `application/json`

---

## Cost Estimate

Estimated monthly costs for light usage:

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Lambda | 1M requests/month free | $0-1/month |
| API Gateway | 1M requests/month free (12 months) | $0-3/month |
| DynamoDB | 25GB storage + requests free | $0-5/month |
| CloudWatch Logs | 5GB free | $0-1/month |
| **Total** | | **$0-10/month** |

Actual costs depend on usage volume.

---

## Deleting Everything (Cleanup)

To remove all resources and stop incurring costs:

1. **Go to CloudFormation**
2. Select your stack (`banking-selfservice-ai-agents-dev`)
3. Click "Delete"
4. Confirm deletion
5. Wait for "DELETE_COMPLETE" status (5-10 minutes)

⚠️ **Warning**: This permanently deletes all data in the DynamoDB tables!

Optional: Delete the S3 bucket
1. Go to S3
2. Select your bucket
3. Click "Empty" then "Delete"

---

## Support

For technical questions or issues:
- Check the Troubleshooting section above
- Review CloudWatch logs for error details
- Contact your technical support team

---

## Next Steps

After successful deployment:
1. ✅ Test all three API endpoints
2. ✅ Integrate the API endpoint with your application
3. ✅ Configure monitoring and alerts (optional)
4. ✅ Set up production environment (repeat steps with `prod` environment parameter)
