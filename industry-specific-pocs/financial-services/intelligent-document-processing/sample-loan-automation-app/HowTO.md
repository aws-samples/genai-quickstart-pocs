# Loan Application Document Verification - Usage Guide

 Purpose of this POC is to help developers learn how they can leverage Amazon Bedrock Data Automation to build loan automation applications. The application showcases automated document classification, extraction, and validation with immediate feedback and status tracking.

This application purposely uses minimum AWS services needed to keep focus on BDA capabilities.


## Prerequisites

Before beginning, ensure you have:

- **Python 3.8 or higher** installed on your system
- **AWS Account** with Amazon Bedrock Data Automation access enabled
- **S3 Bucket** configured for document storage
- **IAM Permissions** for Amazon Bedrock Data Automation and S3 access

## Directory Structure

```
sample-loan-automation-app/
├── HOWTO.md                  # This usage guide
├── README.md                 # Project overview and architecture
├── app.py                    # Streamlit web interface
├── config.py                 # Configuration and constants
├── requirements.txt          # Python dependencies
├── env.example              # Environment configuration template

├── backend/
│   ├── bedrock_processor.py # Core processing engine
│   └── document_validator.py # Document validation logic
├── samples/                 # Sample documents for testing
│   ├── sample_driver_license.pdf
│   ├── sample_w2.pdf
│   ├── sample_pay_stub.pdf
│   └── sample_account_statement.pdf
└── images/                  # Architecture diagrams
    └── arch1.png           # Application architecture diagram
```

## Getting Started

### Step 1: Clone Repository and Setup Environment

#### For Linux/macOS:
```bash
# Clone the repository
git clone https://github.com/aws-samples/genai-quickstart-pocs.git  

# Navigate to the loan processing directory
cd genai-quickstart-pocs/genai-quickstart-pocs-python/sample-loan-automation-app

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate
```

#### For Windows:
```cmd
# Clone the repository
git clone https://github.com/aws-samples/genai-quickstart-pocs.git  

# Navigate to the loan processing directory
cd genai-quickstart-pocs\genai-quickstart-pocs-python\sample-loan-automation-app

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate
```

### Step 2: Install Dependencies

#### For Linux/macOS:
```bash
pip install -r requirements.txt
```

#### For Windows:
```cmd
pip install -r requirements.txt
```

### Step 3: AWS IAM Permissions Setup

Ensure your AWS user or role has the required permissions by attaching this IAM policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock-data-automation:*",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

**Important**: Replace `your-bucket-name` with your actual S3 bucket name in the policy above.

### Step 4: Environment Configuration

Create a `.env` file from the template:

#### For Linux/macOS:
```bash
cp env.example .env
```

#### For Windows:
```cmd
copy env.example .env
```

Then edit `.env` with your actual AWS configuration:

```bash
# Required AWS Configuration
# Important Notes:
# - S3_BUCKET must exist
# - If PROJECT_NAME does not exist, application will create a project
# - If project exists, it must be configured for W2-Form, US-Driver-License, Bank-Statement, and Payslip

AWS_REGION=us-east-1
PROJECT_NAME=loan-processing-project-example
S3_BUCKET=your-loan-document-storage-bucket

# AWS Credentials (Only required if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

**Important**: Replace the placeholder values with your actual AWS configuration.

## Running the Application

Launch the Streamlit application:

#### For Linux/macOS:
```bash
streamlit run app.py
```

#### For Windows:
```cmd
streamlit run app.py
```


1. **Application Initialization**:
   - Application opens in browser at `http://localhost:8501`
   - Automatically verifies S3 bucket, region, and project name configuration
   - Displays error messages if configuration issues are found

2. **Process Loan Application**:
   - **Step 1**: Enter applicant information (name, SSN, date of birth, loan amount) and press "Continue to Document Upload"
   - **Step 2**: Upload required documents (Driver License, W2 Form, Bank Statement, Payslip). You can drag/drop or browse multiple documents of the same document type. Choose to verify individually or defer to next step
   - **Step 3**: Click "Verify Documents" to start processing all pending documents not verified during previous step
   - **Step 4**: Review cross-verification results comparing applicant information against extracted document data

3. **Review Results**:
   - Documents are processed using AWS Bedrock Data Automation
   - Extracted data is displayed with confidence scores
   - Cross-verification results show comparison between applicant info and document data
   - JSON data browser allows exploration of all extracted information

> **Important Note**: This POC demonstrates basic automated cross-checking between applicant information and document data for demonstration purposes only. This is NOT comprehensive validation. Production loan applications require extensive additional verification, compliance checks, fraud detection, credit verification, and may require manual underwriting review processes.



## Troubleshooting

### Common Issues

#### AWS Credentials Not Found
**Symptoms**: Authentication errors or "Access Denied" messages

**Solution**:
1. Verify your `.env` file contains valid AWS credentials
2. Ensure your AWS account has the required IAM permissions (see Step 3 above)
3. Attach the IAM policy to your AWS user or role
4. Update the S3 bucket ARN in the policy to match your actual bucket

#### Project or Blueprint Not Found
**Symptoms**: "Project not found" or "Blueprint not found" errors

**Solutions**:
- **Web Interface**: Verify AWS credentials and S3 bucket access
- **Command Line**: Check environment configuration and AWS permissions

#### S3 Bucket Access Issues
**Symptoms**: Upload failures or S3 permission errors

**Solution**:
1. Verify the S3 bucket exists and is accessible
2. Check bucket permissions allow read/write operations

#### Low Confidence Scores
**Symptoms**: Extracted fields have low confidence scores

**Solutions**:
1. Ensure document quality is high (clear, readable PDF/images)
2. Verify the document matches the expected blueprint type
3. Check for any document corruption or unusual formatting

## Additional Resources

### Documentation
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Data Automation User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/bda.html)
- [Streamlit Documentation](https://docs.streamlit.io/)

### AWS Services
- [Amazon S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)

### Development Tools
- [Python 3.8+ Documentation](https://docs.python.org/3.8/)
- [Boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)