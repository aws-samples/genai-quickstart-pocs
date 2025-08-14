# PDF to Web Form Converter - Project Structure

## Overview
This project converts PDF documents stored in S3 buckets into interactive web forms using AWS services and AI-powered code generation.

## Directory Structure

```
PDF_2_WebForm/
├── src/                          # React application source code
│   ├── App.js                   # Main application component
│   └── index.js                 # Application entry point
├── public/                       # Static assets
│   └── index.html              # HTML template
├── Lambda/                       # AWS Lambda functions
│   ├── generateWebFormStream.py # WebSocket code generation (ACTIVE)
│   ├── getPdfContent.py        # PDF content retrieval (ACTIVE)
│   ├── listS3Objects.py        # S3 operations (ACTIVE)
│   ├── getDocumentFields.py    # Alternative metadata extraction
│   └── requirements.txt        # Python dependencies
├── package.json                 # Node.js dependencies and scripts
├── package-lock.json           # Dependency lock file
├── README.md                   # Project documentation
└── PROJECT_STRUCTURE.md       # This file
```

## Active Components

### Frontend (React)
- **App.js**: Main application with S3 browser, PDF preview, and code generation
- **index.js**: React application bootstrap

### Backend (AWS Lambda)
- **generateWebFormStream.py**: WebSocket handler for real-time code generation
- **getPdfContent.py**: Retrieves PDF content as base64 for preview
- **listS3Objects.py**: Lists S3 buckets and PDF objects

### Alternative Components
- **getDocumentFields.py**: Alternative metadata extraction using Bedrock Data Automation

## API Endpoints

### Production Endpoints (Used in App.js)
- **S3 Operations**: `https://z24xc41oyi.execute-api.us-east-1.amazonaws.com/Dev`
- **Metadata Extraction**: `https://0l9wnxb8dh.execute-api.us-east-1.amazonaws.com/Dev`
- **PDF Content**: `https://aw2o2mcvif.execute-api.us-east-1.amazonaws.com/Dev`
- **WebSocket**: `wss://bb4bk15ec3.execute-api.us-east-1.amazonaws.com/production/`

## AWS Services Used
- **Amazon S3**: PDF document storage
- **AWS Lambda**: Serverless processing functions
- **Amazon API Gateway**: REST and WebSocket APIs
- **Amazon Bedrock**: Claude 3.5 Sonnet for code generation
- **AWS Bedrock Data Automation**: Alternative metadata extraction

## Code Generation Languages
- React.js (with Cloudscape Design System)
- HTML
- Java
- Python
- C#

## Key Features
1. **S3 Browser**: Browse buckets and PDF objects
2. **PDF Preview**: Base64-encoded PDF display
3. **Metadata Extraction**: Extract form fields from PDFs
4. **Real-time Code Generation**: WebSocket streaming
5. **Multi-language Support**: Generate code in multiple languages
6. **Copy to Clipboard**: Easy code export

## Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Deploy Lambda functions to AWS
4. Configure API Gateway endpoints
5. Update API endpoints in App.js if needed

## Deployment Notes
- Lambda functions require appropriate IAM roles
- API Gateway needs CORS configuration
- WebSocket API requires connection management permissions
- Bedrock access requires model permissions