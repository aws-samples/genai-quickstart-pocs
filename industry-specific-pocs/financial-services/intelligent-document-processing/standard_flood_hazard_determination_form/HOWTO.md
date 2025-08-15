# Standard Flood Hazard Determination Forms (SFHDF) Processing - Usage Guide

This proof-of-concept demonstrates intelligent document processing for Standard Flood Hazard Determination Forms using [Amazon Bedrock Data Automation](https://docs.aws.amazon.com/bedrock/latest/userguide/bda.html). The SFHDF is a mandatory requirement for all federally backed loans, enabling lenders to assess flood risk for property financing.

> **Reference**: [Official FEMA SFHDF Form](https://www.fema.gov/sites/default/files/2020-07/fema_nfip_form_086-0-32.pdf)

## Prerequisites

Before beginning, ensure you have:

- **Python 3.11 or higher** installed on your system
- **AWS Account** with Amazon Bedrock Data Automation access enabled
- **S3 Bucket** configured for document storage
- **IAM Permissions** as defined in `iam-policy.json`

## Directory Structure

```
standard_flood_hazard_determination_form/
├── HOWTO.md                                    # This usage guide
├── app.py                                      # Streamlit web interface
├── extract_sfhdf_fields.py                    # CLI processing tool
├── create_comprehensive_sfhdf_blueprint.py    # Setup automation
├── create_comprehensive_sfhdf_blueprint_master.py # Alternative setup script
├── backend/
│   ├── __init__.py                            # Python package initialization
│   └── bedrock_processor.py                   # Core processing engine
├── sfhdf_config.json                         # Field definitions & structure
├── requirements.txt                           # Python dependencies
├── samples/
│   └── generic_fema_form_sample1.pdf         # Sample SFHDF document
├── .env.example                               # Environment configuration template
└── iam-policy.json                           # Required AWS IAM permissions
```



## Getting Started

### Step 1: Clone Repository and Setup Environment

#### For Linux/macOS:
```bash
# Clone the repository
git clone https://github.com/aws-samples/genai-quickstart-pocs.git  

# Navigate to the SFHDF processing directory
cd genai-quickstart-pocs/industry-specific-pocs/financial-services/intelligent-document-processing/standard_flood_hazard_determination_form

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate
```

#### For Windows:
```cmd
# Clone the repository
git clone https://github.com/aws-samples/genai-quickstart-pocs.git  

# Navigate to the SFHDF processing directory
cd genai-quickstart-pocs\industry-specific-pocs\financial-services\intelligent-document-processing\standard_flood_hazard_determination_form

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

Ensure your AWS user or role has the required permissions by attaching the policy defined in `iam-policy.json`:

#### For Linux/macOS:
```bash
# View the required permissions
cat iam-policy.json
```

#### For Windows:
```cmd
# View the required permissions
type iam-policy.json
```

**Important**: Update the S3 bucket ARN in `iam-policy.json` to match your actual bucket name.

### Step 4: Environment Configuration

Create a `.env` file from the template:

#### For Linux/macOS:
```bash
cp .env.example .env
```

#### For Windows:
```cmd
copy .env.example .env
```

Then edit `.env` with your actual AWS configuration:

```bash
# Required AWS Configuration
AWS_REGION=us-east-1
PROJECT_NAME=sfhdf-processing-project-example
S3_BUCKET=your-document-storage-bucket

# AWS Credentials (Only required if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

**Important**: Replace the placeholder values with your actual AWS configuration.

## Usage Methods

### Method 1: Web Interface (Recommended for Interactive Use)

Launch the Streamlit application:

#### For Linux/macOS:
```bash
streamlit run app.py
```

#### For Windows:
```cmd
streamlit run app.py
```

#### Web Interface Features:

1. **Auto Setup**: Click the "🚀 Auto Setup" button to automatically create required AWS resources
2. **Document Upload**: Drag-and-drop PDF documents or use the file browser
3. **Real-time Processing**: View extraction progress and results
4. **Field Visualization**: See extracted fields organized by SFHDF sections
5. **Confidence Scores**: Review extraction confidence for each field

#### Using the Web Interface:

1. **Initial Setup**:
   - Open the application in your browser (typically `http://localhost:8501`)
   - Click "🚀 Auto Setup" to create the Bedrock Data Automation project and blueprint
   - Wait for the setup confirmation message

2. **Process Documents**:
   - Upload your SFHDF PDF using the file uploader
   - Click "Process Document" to start extraction
   - Monitor the progress indicator
   - Review extracted fields in the results section

3. **Review Results**:
   - Fields are organized by SFHDF sections (Header, Loan Information, NFIP Data, etc.)
   - Each field shows the extracted value and confidence score
 

### Method 2: Command Line Interface (Recommended for Automation)

#### Initial Setup:

#### For Linux/macOS:
```bash
python create_comprehensive_sfhdf_blueprint.py
```

#### For Windows:
```cmd
python create_comprehensive_sfhdf_blueprint.py
```

This creates the required Bedrock Data Automation project and blueprint.

#### Process Documents:

#### For Linux/macOS:
```bash
python extract_sfhdf_fields.py --file path/to/your-document.pdf
```

#### For Windows:
```cmd
python extract_sfhdf_fields.py --file path\to\your-document.pdf
```

#### CLI Options:

- `--file`: Path to the PDF document to process

#### Example Usage:

#### For Linux/macOS:
```bash
# Process a single document
python extract_sfhdf_fields.py --file samples/generic_fema_form_sample1.pdf

# Process a document
python extract_sfhdf_fields.py --file document.pdf
```

#### For Windows:
```cmd
# Process a single document
python extract_sfhdf_fields.py --file samples\generic_fema_form_sample1.pdf

# Process a document
python extract_sfhdf_fields.py --file document.pdf
```

#### sfhdf_config.json

This file defines the SFHDF form structure and field mappings:

- **field_descriptions**: Human-readable names for each field
- **sections**: Organizes fields by SFHDF form sections

Key sections include:
- Header Information
- Section I - Loan Information
- Section II-A - NFIP Community Jurisdiction
- Section II-B - NFIP Data Affecting Building
- Section II-C - Federal Flood Insurance
- Section II-D - Determination
- Section II-E - Comments
- Section II-F - Preparer's Information

### AWS Services Integration

- **Amazon Bedrock Data Automation**: Core document processing and field extraction
- **Amazon S3**: Secure document storage and retrieval
- **AWS IAM**: Authentication and authorization management

## Extracted Fields

The system extracts 42+ fields from SFHDF documents, including:

### Loan Information
- Lender/Servicer details
- Property address
- Borrower information
- Loan reference numbers

### NFIP Data
- Community and county designations
- Map panel information
- Flood zone designations
- Map effective dates

### Insurance Information
- Federal insurance availability
- Program status indicators
- CBRA/OPA designations

### Determination Results
- Special Flood Hazard Area status
- Comments and additional notes
- Preparer information

## Troubleshooting

### Common Issues

#### AWS Credentials Not Found
**Symptoms**: Authentication errors or "Access Denied" messages

**Solution**:
1. Verify your `.env` file contains valid AWS credentials
2. Ensure your AWS account has the required IAM permissions (see `iam-policy.json`)
3. Attach the IAM policy to your AWS user or role
4. Update the S3 bucket ARN in the policy to match your actual bucket


#### Project or Blueprint Not Found
**Symptoms**: "Project not found" or "Blueprint not found" errors

**Solutions**:
- **Web Interface**: Click the "🚀 Auto Setup" button
- **Command Line**: Run `python create_comprehensive_sfhdf_blueprint.py`

#### S3 Bucket Access Issues
**Symptoms**: Upload failures or S3 permission errors

**Solution**:
1. Verify the S3 bucket exists and is accessible
2. Check bucket permissions allow read/write operations



#### Low Confidence Scores
**Symptoms**: Extracted fields have low confidence scores

**Solutions**:
1. Ensure document quality is high (clear, readable PDF)
2. Verify the document is a standard FEMA SFHDF form
3. Check for any document corruption or unusual formatting


## Additional Resources

### Documentation
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Data Automation User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/bda.html)
- [FEMA SFHDF Official Form](https://www.fema.gov/sites/default/files/2020-07/fema_nfip_form_086-0-32.pdf)

### AWS Services
- [Amazon S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Documentation](https://docs.aws.amazon.com/iam/)

### Development Tools
- [Streamlit Documentation](https://docs.streamlit.io/)
- [Python 3.11+ Documentation](https://docs.python.org/3.11/)