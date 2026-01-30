"""
Frontend Streamlit application for SFHDF Document Processor.
Handles UI and user interactions, delegates processing to backend modules.
"""

import streamlit as st
import pandas as pd
import os
import json
import tempfile
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv

# Load environment variables from .env file in same directory ONLY
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)  # Override any existing env vars
    print(f"Loaded environment from: {env_path}")
else:
    print(f" .env file not found at: {env_path}")

# AWS Configuration - ONLY from .env file
AWS_REGION = os.environ.get("AWS_REGION")
PROJECT_NAME = os.environ.get("PROJECT_NAME")
S3_BUCKET = os.environ.get("S3_BUCKET")

def load_config():
    """Load configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), 'sfhdf_config.json')
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        return {"field_descriptions": {}, "sections": {}}

def display_results_by_section(extracted_data: dict, confidence_data: dict) -> None:
    """Display extracted results organized by form sections with confidence scores."""
    config = load_config()
    field_descriptions = config.get('field_descriptions', {})
    field_data_types = config.get('field_data_types', {})
    sections = config.get('sections', {})
    
    # Process each section
    for section_name, fields in sections.items():
        section_data = []
        has_data = False
        
        for field in fields:
            value = extracted_data.get(field, '')
            confidence = confidence_data.get(field, {}).get('confidence', 'N/A')
            field_type = field_data_types.get(field, 'string')
            
            # Check if field has data
            if field_type == 'boolean':
                if value is not None:
                    has_data = True
                    display_value = str(value)
                else:
                    display_value = '[Empty]'
            else:
                if value and str(value).strip():
                    has_data = True
                    display_value = str(value)
                else:
                    display_value = '[Empty]'
            
            section_data.append({
                'field': field_descriptions.get(field, field),
                'value': display_value,
                'confidence': confidence
            })
        
        # Display section if it has any data
        if has_data:
            st.markdown(f"#### {section_name}")
            
            # Create DataFrame and display as table
            df = pd.DataFrame(section_data)
            
            # Format confidence scores
            def format_confidence(conf):
                if conf == 'N/A':
                    return 'N/A'
                try:
                    if isinstance(conf, (int, float)):
                        return f"{conf:.0%}"
                    return str(conf)
                except:
                    return str(conf)
            
            df['confidence'] = df['confidence'].apply(format_confidence)
            df.columns = ['Field', 'Value', 'Confidence']
            
            st.dataframe(df, 
                        column_config={
                            'Field': st.column_config.TextColumn(
                                'Field Name',
                                width='medium',
                                help='The field name from the document'
                            ),
                            'Value': st.column_config.TextColumn(
                                'Extracted Value',
                                width='large',
                                help='The value extracted from the document'
                            ),
                            'Confidence': st.column_config.TextColumn(
                                'Confidence Score',
                                width='small',
                                help='Confidence level of the extraction'
                            )
                        },
                        hide_index=True,
                        use_container_width=True)

def validate_configuration():
    """Validate configuration - simple check for required environment variables and AWS credentials"""
    # Check required environment variables
    missing_vars = []
    if not AWS_REGION:
        missing_vars.append("AWS_REGION")
    if not PROJECT_NAME:
        missing_vars.append("PROJECT_NAME")
    if not S3_BUCKET:
        missing_vars.append("S3_BUCKET")
    
    if missing_vars:
        return False, f"Missing environment variables: {', '.join(missing_vars)}"
    
    # Test AWS access
    try:
        sts_client = boto3.client('sts')
        account_id = sts_client.get_caller_identity()['Account']
        print(f"Environment valid - Account: {account_id}")
        return True, "Configuration valid"
    except NoCredentialsError:
        return False, "No AWS credentials found. Please configure AWS credentials or use an IAM role (For example, an EC2 instance role)."
    except Exception as e:
        return False, f"AWS credentials error: {e}. Check your AWS credentials and permissions."

def main():
    """Main Streamlit application."""
    try:
        st.set_page_config(
            page_title="SFHDF Document Processor",
            page_icon="🏠",
            layout="wide"
        )
        
        st.title("🏠 SFHDF Document Processor")
        st.markdown("Extract information from Standard Flood Hazard Determination Forms using Amazon Bedrock Data Automation")
        
        # Validate configuration first
        config_valid, config_message = validate_configuration()
        
        if not config_valid:
            st.error(f"❌ Configuration Error: {config_message}")
            
            # Show current environment status
            st.subheader("🔧 Current Environment Status:")
            
            col1, col2, col3 = st.columns(3)
            with col1:
                if AWS_REGION:
                    st.success(f"✅ AWS_REGION: {AWS_REGION}")
                else:
                    st.error("❌ AWS_REGION: Not set")
            
            with col2:
                if PROJECT_NAME:
                    st.success(f"✅ PROJECT_NAME: {PROJECT_NAME}")
                else:
                    st.error("❌ PROJECT_NAME: Not set")
            
            with col3:
                if S3_BUCKET:
                    st.success(f"✅ S3_BUCKET: {S3_BUCKET}")
                else:
                    st.error("❌ S3_BUCKET: Not set")
            
            st.markdown("---")
            st.subheader("🔧 Setup Instructions:")
            
            st.info("""
            **To fix this issue:**
            
            1. **Stop the app** (Ctrl+C in terminal)
            2. **Edit your .env file** at: `{env_path}`
            3.  Please read howto.md for setup instructions
            4. **Start the app again:** `streamlit run app.py`
            """)
            
            # Show current .env file content
            if os.path.exists(env_path):
                st.subheader("📄 Current .env file content:")
                try:
                    with open(env_path, 'r') as f:
                        env_content = f.read()
                    st.code(env_content, language='bash')
                except Exception as e:
                    st.error(f"Could not read .env file: {e}")
            else:
                st.error(f"❌ .env file not found at: {env_path}")
                st.info("Create the .env file with your AWS configuration.")
            
            return
        
        # Initialize backend processor
        from backend.bedrock_processor import BedrockProcessor
        processor = BedrockProcessor()
        
        # Check if project exists
        project_arn = processor.get_project_arn()
        
        if not project_arn:
            st.header("🔧 Project Setup Required")
            st.error(f"Project '{PROJECT_NAME}' not found")
            
            st.markdown("---")
            st.subheader("📋 Setup Instructions")
            
            # Check if project name is empty
            if not PROJECT_NAME or PROJECT_NAME.strip() == "":
                st.warning("⚠️ Project name is empty in your .env file!")
                st.markdown("""
                **To fix this:**
                1. Open your `.env` file
                2. Set `PROJECT_NAME=your-project-name`
                3. Save the file
                4. Restart the app
                """)
            else:
                st.markdown("""
                **Prerequisites:**
                - ✅ AWS credentials configured
                - ✅ Environment variables set
                """)
                
                # Setup options
                st.subheader("🚀 Setup Options")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("**Option 1: Automatic Setup (Recommended)**")
                    st.info("🚀 Click the button below to automatically create the blueprint and project. This will take 2-3 minutes.")
                    
                    if st.button("🚀 Auto Setup", type="primary", help="Automatically create blueprint and project"):
                        with st.spinner("Setting up blueprint and project..."):
                            try:
                                if processor.setup_blueprint_and_project():
                                    st.success("✅ Setup completed successfully!")
                                    st.info("🔄 Refreshing page to load the project...")
                                    st.rerun()
                                else:
                                    st.error("❌ Automatic setup failed. Please try manual setup.")
                                    st.info("💡 Check the terminal output above for error details.")
                            except Exception as e:
                                st.error(f"❌ Setup error: {e}")
                                st.info("💡 Please try manual setup or check your AWS permissions.")
                
                with col2:
                    st.markdown("**Option 2: Manual Setup**")
                    st.info("📋 Click below to see step-by-step manual setup instructions.")
                    
                    if st.button("📋 Manual Setup", help="Show manual setup instructions"):
                        st.info(f"""
                        **Manual Setup Steps:**
                        
                        1. **Open Terminal** in this directory: `{os.getcwd()}`
                        2. **Run the setup script:**
                           ```bash
                           python create_comprehensive_sfhdf_blueprint.py
                           ```
                        3. **Wait for completion** (may take 2-3 minutes)
                        4. **Refresh this page** when done
                        
                        **Troubleshooting:**
                        - Review Howto.md for detailed setup instructions
                        """)
        else:
            # Project is ready - show document upload
            st.success("✅ Project is ready!")
            st.info(f"Project: {PROJECT_NAME}")
            
            st.markdown("---")
            
            # Document upload section
            st.header("📄 Document Upload")
            
            uploaded_file = st.file_uploader(
                "Choose a SFHDF document (PDF, PNG, JPG)",
                type=['pdf', 'png', 'jpg', 'jpeg'],
                help="Upload a Standard Flood Hazard Determination Form to extract information"
            )
            
            if uploaded_file is not None:
                st.info(f"📁 File uploaded: {uploaded_file.name}")
                
                if st.button("🔍 Process Document", type="primary"):
                    # Create progress bar for job status
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    try:
                        # Save uploaded file temporarily
                        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{uploaded_file.name}") as tmp_file:
                            tmp_file.write(uploaded_file.getvalue())
                            tmp_file_path = tmp_file.name
                        
                        # Process document with real-time progress updates
                        results = None
                        
                        try:
                            # Call the backend processor with real progress updates
                            results = processor.process_document_with_status(tmp_file_path, progress_bar, status_text)
                        except Exception as e:
                            st.error(f"❌ Processing error: {e}")
                        
                        # Final completion
                        progress_bar.progress(100)
                        status_text.text("✅ Processing complete!")
                        
                        # Clean up temp file
                        os.unlink(tmp_file_path)
                        
                        if results:
                            st.success("✅ Document processing completed successfully!")
                            st.header("📋 Extraction Results")
                            
                            # Extract confidence data if available
                            confidence_data = {}
                            if isinstance(results, dict) and 'explainability_info' in results:
                                confidence_data = results.get('explainability_info', [{}])[0] if results.get('explainability_info') else {}
                            
                            # Get extracted data - same logic as extract_sfhdf_fields.py
                            extracted_data = results.get('inference_result', results)
                            
                            display_results_by_section(extracted_data, confidence_data)
                            
                            # Display raw JSON output in collapsible section
                            st.markdown("---")
                            with st.expander("📄 Raw JSON Output (Click to expand)"):
                                st.json(results)
                        else:
                            st.error("❌ Failed to process document. Please check the logs above.")
                    except Exception as e:
                        st.error(f"❌ Processing error: {e}")
    except Exception as e:
        st.error(f"An application error occurred: {e}")
        st.info("Please ensure Streamlit is correctly installed and environment variables are set.")

if __name__ == "__main__":
    main() 