# RFP Agent Response System

An intelligent RFP (Request for Proposal) processing system that automatically extracts questions from RFP documents and generates professional responses using AWS Bedrock Knowledge Base and AI agents. The system supports both PDF and text files, providing a complete web-based interface for enterprise RFP management.

## Architecture Overview

The system consists of two main components working together:

### Core Processing Pipeline
- **S3 Storage**: Organized file storage with separate folders for uploads, processing stages, and results
- **Multi-Stage Lambda Processing**: 
  - Question extraction from PDF/text files using Amazon Bedrock
  - Knowledge base querying for intelligent response generation
  - CSV export generation for professional RFP responses
- **Bedrock Knowledge Base**: AI-powered document retrieval and response generation
- **S3 Event Triggers**: Automatic pipeline progression between processing stages

### Web Interface
- **CloudFront + S3**: Enterprise-grade static web hosting
- **API Gateway**: RESTful APIs for file upload, status tracking, and result downloads
- **Multi-Page Interface**: Upload, status monitoring, admin panel, and download management
- **Real-time Status**: Live tracking of RFP processing stages

## Project Structure

```
rfp-agent-response/
├── src/                          # Lambda functions and APIs
│   ├── rfp_question_extractor.py # Question extraction from RFP documents
│   ├── question_processor.py     # Knowledge base integration and response generation
│   ├── upload_api.py             # File upload API endpoint
│   ├── status_api.py             # Processing status tracking API
│   ├── download_api.py           # Result download API
│   ├── list_jobs_api.py          # Job listing API
│   ├── cleanup_api.py            # Cleanup operations API
│   ├── compliance_agent.py       # Compliance-focused response agent
│   ├── drafting_agent.py         # Response drafting agent
│   └── requirements.txt          # Python dependencies
├── scripts/                      # Deployment and management scripts
│   ├── deploy-complete.ps1       # Complete system deployment
│   ├── cleanup.ps1              # Resource cleanup
│   └── diagnose-pipeline.ps1    # Troubleshooting tools
├── infrastructure/               # CloudFormation templates
│   ├── cloudformation.yaml      # Core infrastructure
│   └── web-cloudformation.yaml  # Web interface infrastructure
├── web/                         # Web interface
│   ├── templates/              # Template files with placeholders
│   │   ├── index.html          # Main upload interface template
│   │   ├── status.html         # Processing status dashboard template
│   │   ├── downloads.html      # Result download page template
│   │   ├── admin.html          # Administrative interface template
│   │   └── json-explorer.html  # JSON data explorer template
│   └── [generated files]       # Actual web files (created during deployment)
├── example-data/                # Sample data and documentation
│   ├── sample-rfps/            # Example RFP documents (PDF/TXT)
│   ├── knowledge-base-docs/    # Sample knowledge base content
│   └── README.md               # Usage instructions for examples
└── README.md
```

## Prerequisites and Dependencies

### AWS Requirements
- AWS CLI configured with appropriate permissions
- AWS account with access to:
  - Amazon S3
  - AWS Lambda
  - Amazon Bedrock (Claude Sonnet models and Knowledge Base)
  - CloudFormation
  - API Gateway
  - CloudFront
  - IAM (for role and policy management)

### Local Environment
- Python 3.8 or higher
- PowerShell (for deployment scripts)
- Required Python packages (see `src/requirements.txt`)

### AWS Permissions
Your AWS credentials need permissions for:
- S3 bucket creation and management
- Lambda function deployment and execution
- CloudFormation stack operations
- Bedrock model invocation and Knowledge Base operations
- API Gateway and CloudFront management
- IAM role and policy creation

## Setup Instructions

### 1. Install Dependencies
```bash
cd src
pip install -r requirements.txt
```

### 2. Set Up Knowledge Base (Required Before Deployment)

The RFP system needs a Knowledge Base containing your company's information to generate intelligent responses. Follow these steps carefully:

> **⚠️ CRITICAL**: Complete this entire section before running the deployment script, or the system won't work.

---

#### 🗂️ **Step A: Upload Your Company Documents**

First, create an S3 bucket and upload your company documentation:

```bash
# Replace 'your-company-kb-docs' with your preferred bucket name
aws s3 mb s3://your-company-kb-docs --region us-east-1

# Upload the sample documents (you can customize these later)
aws s3 sync example-data/knowledge-base-docs/ s3://your-company-kb-docs/
```

**What documents should you include?**
- Company overview and history
- Product/service descriptions and capabilities
- Pricing information and service tiers
- Compliance certifications and security measures
- Implementation methodologies and timelines
- Support and maintenance offerings

---

#### 🧠 **Step B: Create the Knowledge Base in AWS**

1. **Open AWS Console** and navigate to **Amazon Bedrock** → **Knowledge bases**

2. **Click "Create knowledge base"**

3. **Fill in the basic details**:
   ```
   Name: rfp-response-knowledge-base
   Description: Knowledge base for automated RFP response generation
   ```

4. **Set up the data source**:
   - **Data source type**: S3
   - **S3 URI**: `s3://your-company-kb-docs/` (the bucket you created above)
   - **Data source name**: `company-documents`

5. **Choose your AI models**:
   - **Embeddings model**: `Amazon Titan Text Embeddings v2` (recommended)
   - **Vector database**: `Amazon OpenSearch Serverless or Amazon S3 Vectors` (let AWS create it)

6. **Review and create** - AWS will automatically process your documents

7. **📝 SAVE THE KNOWLEDGE BASE ID**: After creation, you'll see a Knowledge Base ID like `ABC123DEF456` - **copy this exactly**

---

#### ✅ **Verification**

Before proceeding to deployment, verify:
- [ ] S3 bucket created and documents uploaded
- [ ] Knowledge Base created and shows "Available" status
- [ ] Knowledge Base ID copied (you'll need it during deployment)

**🎯 You're now ready to deploy the system!**

> **💡 Note**: You don't need to edit any code files! The deployment script will prompt you for your Knowledge Base ID and configure everything automatically.

### 3. Deploy Complete System
```powershell
cd scripts
.\deploy-complete.ps1
```

**During deployment, you'll be prompted for your Knowledge Base ID** - just paste the ID you copied from Step B above. The deployment script will automatically configure all API endpoints.

This will create:
- S3 buckets for uploads, processing, and results
- Multiple Lambda functions for the processing pipeline (automatically configured with your Knowledge Base)
- S3 event triggers for automatic processing
- API Gateway endpoints for web interface
- CloudFront distribution for web hosting
- All necessary IAM roles and policies

**🎉 That's it!** The system will automatically:
- Use your Knowledge Base for generating RFP responses
- Generate web interface files with the correct API endpoints
- Work consistently across multiple deployments

## Usage Examples

### Web-Based Processing (Recommended)
1. **Access the Interface**: Open the CloudFront URL provided after deployment
2. **Upload RFP Files**: 
   - Drag and drop PDF or TXT files onto the upload area
   - Or use the file selector to choose files
   - Supports both individual files and batch uploads
3. **Monitor Progress**: 
   - View real-time processing status on the status page
   - Track each stage: upload → question extraction → response generation
4. **Download Results**: 
   - Access completed RFP responses in CSV format
   - Download individual files or batch results

### Sample Data Testing
Test the system with provided examples:

```bash
# Upload sample RFPs from the example-data folder
# Use any file from: example-data/sample-rfps/
# - banking-core-system-rfp.pdf
# - payment-processing-rfp.txt
# - cybersecurity-services-rfp.txt
```

### Automatic Processing Pipeline
When files are uploaded, the system automatically:

1. **File Upload**: Files stored in `uploaded_rfp_requests/` with timestamps
2. **Question Extraction**: 
   - PDF text extraction using PyPDF2
   - AI-powered question identification using Bedrock
   - Results saved as JSON in `formatted_questions/` folder
3. **Response Generation**:
   - Knowledge base queries for each extracted question
   - Professional response drafting using compliance and drafting agents
   - Final CSV generation with complete RFP responses
4. **Result Storage**: Completed responses in `final_responses/` folder

### File Organization
- **Uploads**: `uploaded_rfp_requests/` - Original RFP files
- **Questions**: `formatted_questions/` - Extracted questions in JSON format
- **Responses**: `final_responses/` - Complete RFP responses in CSV format
- **Status**: Real-time tracking via web interface and CloudWatch logs

## Cleanup

To remove all deployed resources:

```powershell
cd scripts
.\cleanup.ps1
```

This will delete all CloudFormation stacks and associated resources, helping you avoid ongoing AWS charges.

## Advanced Features

### Multiple Web Interfaces
- **Main Upload** (`index.html`): Primary file upload interface
- **Status Dashboard** (`status.html`): Real-time processing monitoring
- **Downloads** (`downloads.html`): Result retrieval and management
- **Admin Panel** (`admin.html`): System administration and cleanup
- **JSON Explorer** (`json-explorer.html`): Detailed data inspection

### API Endpoints
The system provides RESTful APIs for integration:
- `POST /upload` - File upload
- `GET /status/{jobId}` - Processing status
- `GET /download/{jobId}` - Result download
- `GET /list-jobs` - Job listing
- `DELETE /cleanup/{jobId}` - Resource cleanup

### Diagnostic Tools
Use the provided PowerShell script for system management:
- `diagnose-pipeline.ps1` - Pipeline health checks and troubleshooting

## Troubleshooting

- **Permission Issues**: Ensure your AWS credentials have the required permissions listed in Prerequisites
- **Model Access**: Verify Amazon Bedrock Claude Sonnet model access and Knowledge Base setup in your AWS region
- **File Format**: System supports both PDF and TXT files
- **Knowledge Base Configuration**: 
  - Verify the Knowledge Base is populated with relevant documentation and has been synced
  - Check that the Knowledge Base is in the same AWS region as your deployment
  - If you see "Knowledge Base ID not configured" errors, the deployment script may not have received the correct Knowledge Base ID
  - To update the Knowledge Base ID after deployment, redeploy with: `.\scripts\deploy-complete.ps1`
- **Processing Stuck**: Use the diagnostic script (`diagnose-pipeline.ps1`) to check pipeline health
- **Empty Responses**: Usually indicates Knowledge Base issues - check that documents are properly indexed and the Knowledge Base ID is correct
- **Logs**: Check CloudWatch logs for detailed processing information and error messages