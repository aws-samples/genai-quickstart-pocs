"""
Configuration file for Loan Application Document Verification v3
Contains constants, document types, and configuration settings
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# AWS Configuration
AWS_REGION = os.getenv('AWS_REGION')
S3_BUCKET = os.getenv('S3_BUCKET')
PROJECT_NAME = os.getenv('PROJECT_NAME')

# ARNs use AWS_REGION variable for flexibility
BLUEPRINTS = {
    'US-Driver-License': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-us-driver-license',
    'Payslip': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-payslip',
    'Bank-Statement': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-bank-statement',
    'W2-Form': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-w2-form'
    # 'US-Bank-Check': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-us-bank-check',
    #'Form-1040': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-form-1040',
    #'Form-1098': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-form-1098',
    #'Property_Tax_Statement': f'arn:aws:bedrock:{AWS_REGION}:aws:blueprint/bedrock-data-automation-public-property-tax-statement'
}

# Application Configuration.
#MAX_ITERATIONS is the maximum number of iterations to poll for the BDA invocation status completion
#POLLING_INTERVAL_SECONDS is the interval in seconds to poll for the BDA invocation status completion
MAX_ITERATIONS = int(os.getenv('MAX_ITERATIONS', '60'))
POLLING_INTERVAL_SECONDS = int(os.getenv('POLLING_INTERVAL_SECONDS', '2'))


# Document Types Configuration
DOCUMENT_TYPES = {
    'driver_license': {
        'name': 'Driver License',
        'description': 'Valid driver license or state ID',
        'required': True,
        'accepted_formats': ['jpg', 'jpeg', 'png', 'pdf'],
        'blueprint': 'US-Driver-License'
    },
    'w2_form': {
        'name': 'W2 Form',
        'description': 'Most recent W2 tax form',
        'required': True,
        'accepted_formats': ['pdf', 'jpg', 'jpeg', 'png'],
        'blueprint': 'W2-Form'
    },
    'bank_statement': {
        'name': 'Bank Statement',
        'description': 'Recent bank statement (last 3 months)',
        'required': True,
        'accepted_formats': ['pdf', 'jpg', 'jpeg', 'png'],
        'blueprint': 'Bank-Statement'
    },
    'payslip': {
        'name': 'Payslip',
        'description': 'Recent payslip or income verification',
        'required': False,
        'accepted_formats': ['pdf', 'jpg', 'jpeg', 'png'],
        'blueprint': 'Payslip'
    }
}

# Status Constants - Human Readable Keys and Values
DOCUMENT_STATUSES = {
    # Initial States
    'Uploaded to S3': '📤 File successfully uploaded to S3, ready for Processing',
    
    # Processing States
    'Extraction in Progress': '🔄 Data extraction in progress',
    'Extraction Complete but condfidence check pending': '📋 Extraction Complete but condfidence check pending',
    
    # Final States - Based on Business Rules
    'Extraction Complete': '📋 Extraction Complete with high confidence (≥90%)',
    'Extraction Complete but Manual Review required': '👁️ Extraction Complete but Manual Review required due to low confidence',
    'Extraction Complete but Document Mismatch identified': '⚠️ Extraction Complete but Document Mismatch identified',
    'Error': '❌ Error'
}



# UI Configuration
STREAMLIT_CONFIG = {
    'page_title': 'Loan Application Document Verification',
    'page_icon': '🏠',
    'layout': 'wide',
    'initial_sidebar_state': 'expanded'
}

# Streamlit Server Configuration to fix Windows file watcher issues
STREAMLIT_SERVER_CONFIG = {
    'server.fileWatcherType': 'none',  # Disable file watching to prevent Windows drive errors
    'server.headless': True,           # Run in headless mode
    'server.port': 8501,              # Default port
    'server.address': 'localhost'      # Local address
}
