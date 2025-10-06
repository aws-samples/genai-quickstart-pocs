"""
Loan Application Document Verification - Main Streamlit Application

This application demonstrates automated document processing using Amazon Bedrock Data Automation.
It guides users through 4 steps: applicant info → upload docs → verify docs → review results.
"""

import streamlit as st
import uuid
import time
import boto3
from datetime import datetime
from botocore.exceptions import NoCredentialsError, ClientError

from config import (
    DOCUMENT_TYPES, DOCUMENT_STATUSES, 
    STREAMLIT_CONFIG, S3_BUCKET, MAX_ITERATIONS, POLLING_INTERVAL_SECONDS,
    AWS_REGION, PROJECT_NAME
)
from backend.bedrock_processor import BedrockProcessor

st.set_page_config(**STREAMLIT_CONFIG)

def validate_configuration():
    """Validate configuration - check environment variables and AWS credentials"""
    # Check required environment variables
    required_vars = {'AWS_REGION': AWS_REGION, 'PROJECT_NAME': PROJECT_NAME, 'S3_BUCKET': S3_BUCKET}
    missing_vars = [name for name, value in required_vars.items() if not value]
    
    if missing_vars:
        return False, f"Missing environment variables: {', '.join(missing_vars)}"
    
    # Test AWS access
    try:
        account_id = boto3.client('sts').get_caller_identity()['Account']
        print(f"Environment valid - Account: {account_id}")
        return True, "Configuration valid"
    except NoCredentialsError:
        return False, "No AWS credentials found. Please configure AWS credentials or use an IAM role."
    except ClientError as e:
        error_code = e.response['Error']['Code']
        error_messages = {
            'AccessDenied': "AWS access denied. Check your IAM permissions for STS GetCallerIdentity.",
            'InvalidUserID.NotFound': "AWS credentials are invalid or expired."
        }
        message = error_messages.get(error_code, f"AWS service error ({error_code}). Check your AWS credentials and permissions.")
        return False, message
    except Exception as e:
        return False, f"Unexpected error during AWS validation: {type(e).__name__}. Check your network connection and AWS configuration."

def handle_configuration_error(config_message):
    """Handle configuration validation errors with detailed error display"""
    st.error(f"❌ Configuration Error: {config_message}")
    
    # Show current environment status
    st.subheader("🔧 Current Environment Status:")
    
    env_vars = {'AWS_REGION': AWS_REGION, 'PROJECT_NAME': PROJECT_NAME, 'S3_BUCKET': S3_BUCKET}
    cols = st.columns(3)
    
    for i, (name, value) in enumerate(env_vars.items()):
        with cols[i]:
            if value:
                st.success(f"✅ {name}: {value}")
            else:
                st.error(f"❌ {name}: Not set")
    
    st.markdown("---")
    st.info("""
    **To fix this issue:**
    
    1. **Stop the app** (Ctrl+C in terminal)
    2. Create a .env file with your AWS configuration (refer to [HowTO.md](https://github.com/aws-samples/genai-quickstart-pocs/blob/main/industry-specific-pocs/financial-services/intelligent-document-processing/sample-loan-automation-app/HowTO.md) for details)
    3. **Start the app again:** `streamlit run app.py`
    """)
    
   
def initialize_session_state():
    """Initialize session state with loan application and processor"""
    if 'loan_application' not in st.session_state:
        st.session_state.loan_application = {
            'loan_id': f"loan_{uuid.uuid4().hex[:8]}",
            'current_step': 1,
            'applicant': {},
            'files': []
        }
    
    if 'processor' not in st.session_state:
        config_valid, config_message = validate_configuration()
        if not config_valid:
            handle_configuration_error(config_message)
            st.stop()
        st.session_state.processor = BedrockProcessor(st.session_state.loan_application['loan_id'])

initialize_session_state()

# ============================================================================
# 1. INITIALIZATION & CONFIGURATION
# ============================================================================

def map_bda_status_to_document_status(bda_status: str) -> str:
    """Map AWS Bedrock Data Automation status to Document Workflow status"""
    mapping = {
        'Created': 'Extraction in Progress',
        'InProgress': 'Extraction in Progress', 
        'Success': 'Extraction Complete but confidence evaluation pending',
        'ServiceError': 'Error',
        'ClientError': 'Error'
    }
    return mapping.get(bda_status, 'Error')

def find_file_by_unique_name(file_unique_name):
    """Find file in session state by unique name"""
    return next((f for f in st.session_state.loan_application['files'] if f['file_unique_name'] == file_unique_name), None)

# ============================================================================
# 2. VALIDATION HELPERS
# ============================================================================

def _validate_ssn(ssn):
    """Validate SSN format - accepts XXX-XX-XXXX or XXXXXXXXX"""
    if not ssn:
        return False
    ssn_clean = ssn.strip().replace('-', '').replace(' ', '')
    return ssn_clean.isdigit() and len(ssn_clean) == 9

def _calculate_age(birth_date):
    """Calculate age from birth date"""
    today = datetime.now().date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

def _get_date_range():
    """Get valid date range for DOB input"""
    today = datetime.now().date()
    return (
        today.replace(year=today.year - 200),  # min: 200 years ago
        today.replace(year=today.year - 18)    # max: 18 years ago
    )

def _has_complete_applicant(loan_app):
    """Check if applicant information is complete"""
    applicant = loan_app.get('applicant')
    return applicant and all([
        applicant.get('first_name'),
        applicant.get('last_name'), 
        applicant.get('ssn'),
        applicant.get('date_of_birth'),
        applicant.get('loan_amount')
    ])

def _has_files(loan_app):
    """Check if files are uploaded"""
    return bool(loan_app.get('files'))

def _has_extracted_data(loan_app):
    """Check if any file has extracted data"""
    return any(f.get('extracted_data') for f in loan_app.get('files', []))

# ============================================================================
# 3. DOCUMENT PROCESSING FUNCTIONS
# ============================================================================

def process_extraction_data(file_data, extracted_data):
    """Process extracted data and determine final status."""
    if extracted_data:
        file_data['extracted_data'] = extracted_data
        file_data['confidence_score'] = extracted_data.get('confidence', 0)
        
        expected_blueprint = DOCUMENT_TYPES[file_data['doc_type']]['blueprint']
        detected_blueprint = extracted_data.get('matched_blueprint', {}).get('name', '')
        
        if detected_blueprint == expected_blueprint:
            file_data['status'] = 'Extraction Complete' if file_data['confidence_score'] >= 90 else 'Extraction Complete but Manual Review required'
        else:
            file_data['status'] = 'Extraction Complete but Document Mismatch identified'
            file_data['error_message'] = f'Expected {expected_blueprint}, got {detected_blueprint}'
    else:
        file_data['status'] = 'Error'
        file_data['error_message'] = 'No results returned'

# 1. verify_single_file during step 2 (Upload required documents) . This allows user to verify a document uploaded is expected type.
def verify_single_file(doc_type, file_object, button_key=None, progress_bar=None):
    """Verify single file by extracting contents and classifying document type.
    
    This function:
    - Uploads document to S3
    - Submits extraction invocation to AWS Bedrock Data Automation
    - Polls for invocation completion
    - Extracts data from completed invocation
    - Sets document status: 'Extraction Complete', 'Extraction Complete but Manual Review required', 
      'Extraction Complete but Document Mismatch identified', or 'Error'
    """
    try:
        processor = st.session_state.processor
        loan_app = st.session_state.loan_application
        
        # 1. Upload document to S3 (same as original)
        file_unique_name = processor.upload_document_to_s3(file_object, doc_type)
        
        # Update progress: Upload phase (AFTER upload completes)
        if progress_bar:
            progress_bar.progress(0.05, text="5% - 📤 Document uploaded to S3")
        
        if not file_unique_name:
            if progress_bar:
                progress_bar.progress(0, text="❌ Upload failed")
            return
        
        # 2. Get the file data for v2 processing
        file_data = find_file_by_unique_name(file_unique_name)
        
        # Update progress: Submission phase
        if progress_bar:
            progress_bar.progress(0.1, text="10% - 🚀 Submitting to Bedrock")
        
        # Step 1: Submit invocation to AWS Bedrock Data Automation (single file)
        result = processor.invoke_extraction(file_data)
        
        if result['invocation_arn'] is not None:
            file_data['status'] = map_bda_status_to_document_status(result['status'])
            file_data['invocation_arn'] = result['invocation_arn']
            invocation_arn = result['invocation_arn']
        else:
            file_data['status'] = 'Error'
            file_data['error_message'] = result['error_message'] or 'Invoke Extraction failed'
            if progress_bar:
                progress_bar.progress(0, text="❌ Invocation submission failed")
            return
        
        # Update progress: Processing phase
        if progress_bar:
            progress_bar.progress(0.15, text="30% - 🔄 Processing document")
        
        # Step 2: Poll single invocation using backend functions
        current_iteration = 1
        
        # Keep polling until invocation is completed or until the maximum number of iterations is reached
        while current_iteration <= MAX_ITERATIONS:
            # Update progress: Polling progress (30% to 90%)
            progress = 0.15 + (current_iteration / MAX_ITERATIONS) * 0.85
            percentage = int(progress * 100)
            if progress_bar:
                progress_bar.progress(progress, text=f"{percentage}% - 🔄 Extracting data from document")
            
            # Sleep before checking status (gives invocation time to initialize on first iteration)
            time.sleep(POLLING_INTERVAL_SECONDS)
            
            # Check single invocation status using direct method
            status_data = processor.check_status(invocation_arn)
            status = status_data.get('status')
            
            if status == 'Success':
                extracted_data = processor.get_result(invocation_arn, file_data['s3_output_uri'])
                process_extraction_data(file_data, extracted_data)
                break
            elif status in ['Created', 'InProgress']:
                # Invocation still processing - continue polling
                pass
            elif status in ['Failed', 'ClientError', 'ServiceError']:
                # Invocation failed - update session state
                file_data['status'] = 'Error'
                file_data['error_message'] = status_data.get('errorMessage', 'Invocation failed')
                break
            
            current_iteration += 1
        

        # Final status - use file_data pointer (no need to search again)
        final_status = file_data.get('status', 'Unknown')
        
        if progress_bar:
            # Display the status description from config in one elegant line
            progress_bar.progress(1.0, text=f"100% - {DOCUMENT_STATUSES.get(file_data.get('status'), 'Processing completed')}")        
       
        if file_data.get('error_message'):
            print(f"📝 Error details: {file_data['error_message']}")
            
    except Exception as e:
        print(f"❌ Single file processing failed: {str(e)}")
        if progress_bar:
            progress_bar.progress(0, text=f"❌ {str(e)}")




# 2. verify_all_files - Verify all uploaded documents in parallel


def verify_all_files():
    """Verify all uploaded documents in parallel by extracting contents and classifying types.
    
    This function:
    - Processes all files with 'Uploaded to S3' status in parallel
    - Submits parallel extraction invocations to AWS Bedrock Data Automation
    - Polls all invocations for completion with progress tracking
    - Extracts data from completed invocations and validates against expected document types
    - Sets document statuses: 'Extraction Complete', 'Extraction Complete but Manual Review required',
      'Extraction Complete but Document Mismatch identified', or 'Error'
    - Displays real-time progress and timing information
    - Auto-refreshes UI upon completion
    """
    
    # Start timing from button click
    start_time = time.time()
    
    loan_app = st.session_state.loan_application
    processor = st.session_state.processor
    
    # Get files with 'Uploaded' status
    pending_files = [f for f in loan_app['files'] if f['status'] == 'Uploaded to S3']
    
    if not pending_files:
        st.warning("No files to process!")
        return
    
    st.info(f"🚀 Starting parallel processing for {len(pending_files)} files...")
    
    try:
        # Step 1: Submit invocations to AWS Bedrock Data Automation in parallel
        invocation_results = processor.invoke_extractions(pending_files)
        
        # Update session state with invocation submission results
        active_invocations = []  # Only invocations with valid invocation ARNs
        
        # Create lookup dictionary for O(1) performance
        file_lookup = {f['file_unique_name']: f for f in loan_app['files']}
        
        for result in invocation_results:
            file_data = file_lookup.get(result['file_unique_name'])
            if file_data:
                if result['invocation_arn'] is not None:
                    file_data['status'] = map_bda_status_to_document_status(result['status'])
                    file_data['invocation_arn'] = result['invocation_arn']  # Store the invocation ARN!
                    active_invocations.append(result['invocation_arn'])  # Only add valid invocation ARNs
                else:
                    file_data['status'] = 'Error'
                    file_data['error_message'] = result['error_message'] or 'Invoke Extraction failed'
       
        # Show submission results
        successful_count = len(active_invocations)
        failed_count = len(invocation_results) - successful_count
        
        if successful_count > 0 and failed_count > 0:
            st.warning(f"⚠️ {successful_count} files submitted successfully, {failed_count} failed")
        elif failed_count > 0:
            st.error(f"❌ All {failed_count} files failed to submit")
        else:
            st.success(f"✅ All {successful_count} files submitted successfully!")
        
        # Step 2: Poll invocations using backend functions
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        # Keep track of total files for progress calculation
        total_files = len(active_invocations)
        current_iteration = 1
        
        # Create lookup dictionary once for O(1) performance
        invocation_to_file = {f['invocation_arn']: f for f in loan_app['files'] if f.get('invocation_arn')}
        
        # Keep polling until all invocations are completed or until the maximum number of iterations is reached
        while current_iteration <= MAX_ITERATIONS and len(active_invocations) > 0:
            progress_bar.progress(current_iteration / MAX_ITERATIONS)
            
            # Sleep before checking status (gives invocations time to initialize on first iteration)
            time.sleep(POLLING_INTERVAL_SECONDS)
            
            # Check invocation statuses using backend function
            status_results = processor.check_statuses(active_invocations)
           
            active_invocations = []
            
            for invocation_arn, status_data in status_results.items():
                status = status_data.get('status')
                file_data = invocation_to_file.get(invocation_arn)
                
                if status == 'Success' and file_data:
                    # Process result immediately
                    extracted_data = processor.get_result(invocation_arn, file_data['s3_output_uri'])
                    process_extraction_data(file_data, extracted_data)
                elif status in ['Created', 'InProgress']:
                    # Invocation still processing - keep in active_invocations
                    active_invocations.append(invocation_arn)
                elif status in ['Failed', 'ClientError', 'ServiceError'] and file_data:
                    # Invocation failed - update session state
                    file_data['status'] = 'Error'
                    file_data['error_message'] = status_data.get('errorMessage', 'Invocation failed')
            
            # Update progress after processing results
            completed_files = total_files - len(active_invocations)
            elapsed_time = time.time() - start_time
            status_text.text(f"🔄 {completed_files}/{total_files} files completed - {len(active_invocations)} still processing... ({elapsed_time:.1f}s elapsed)")
            
            current_iteration += 1
        
        # Final status
        completed_count = total_files - len(active_invocations)
        progress_bar.progress(1.0)
        
        if completed_count == total_files:
            total_duration = time.time() - start_time
            
            # Store timing in session state for display after refresh
            st.session_state.processing_duration = total_duration
            
            status_text.text(f"✅ All {completed_count} invocations completed!")
            st.success(f"✅ Extraction and preliminary verification completed in {total_duration:.1f} seconds! {completed_count}/{total_files} files processed.")
            # Auto-refresh UI to show the new state
            st.rerun()
        else:
            total_duration = time.time() - start_time
            
            status_text.text(f"⚠️ Timeout - {completed_count}/{total_files} completed")
            st.warning(f"⚠️ Processing timeout after {total_duration:.1f} seconds - {completed_count}/{total_files} files completed")
            
    except Exception as e:
        total_duration = time.time() - start_time
        
        st.error(f"❌ Extraction processing failed after {total_duration:.1f} seconds: {str(e)}")
        if 'progress_bar' in locals():
            progress_bar.empty()
        if 'status_text' in locals():
            status_text.empty()


# ============================================================================
# 4. UTILITY FUNCTIONS
# ============================================================================

def get_document_display_name(doc_type):
    """Convert doc_type to human-readable name"""
    return DOCUMENT_TYPES[doc_type]['name']

def upload_pending_files_to_s3():
    """Upload any files in uploaders that haven't been uploaded to S3 yet"""
    processor = st.session_state.processor
    uploaded_count = 0
    
    stored_files_lookup = {(f['file_name'], f['doc_type']) for f in st.session_state.loan_application['files']} if st.session_state.loan_application['files'] else set()
    
    for doc_type in DOCUMENT_TYPES.keys():
        uploaded_files = st.session_state.get(f"upload_{doc_type}")
        if uploaded_files:
            for file_object in uploaded_files:
                if (file_object.name, doc_type) not in stored_files_lookup:
                    file_unique_name = processor.upload_document_to_s3(file_object, doc_type)
                    if file_unique_name:
                        uploaded_count += 1
    
    return uploaded_count

# ============================================================================
# 5. NAVIGATION & MAIN APP
# ============================================================================

def navigate_to_step(step_number):
    """Navigate between application steps with authorization checks"""
    loan_app = st.session_state.loan_application
    current_step = loan_app.get('current_step', 1)
    
    if not 1 <= step_number <= 4:
        st.error("❌ Invalid step number")
        return
    
    if step_number > current_step + 1:
        st.error("❌ Cannot skip steps. Complete previous steps first")
        return
    
    # Backward navigation - validate data integrity
    if step_number < current_step:
        if current_step >= 2 and not _has_complete_applicant(loan_app):
            st.error("❌ Data corrupted. Redirecting to Step 1")
            loan_app['current_step'] = 1
            st.rerun()
            return
        
        if current_step >= 3 and not _has_files(loan_app):
            st.error("❌ Files missing. Redirecting to Step 2")
            loan_app['current_step'] = 2
            st.rerun()
            return
        
        if current_step >= 4 and not _has_extracted_data(loan_app):
            st.error("❌ Extracted data missing. Redirecting to Step 3")
            loan_app['current_step'] = 3
            st.rerun()
            return
    
    # Auto-upload files when moving to Step 3
    if step_number == 3:
        upload_pending_files_to_s3()
    
    # Forward navigation - check requirements
    if step_number >= 2 and not _has_complete_applicant(loan_app):
        st.error("❌ Complete all applicant information first")
        return
    
    if step_number >= 3 and not _has_files(loan_app):
        st.error("❌ Upload at least one document first")
        return
    
    if step_number >= 4 and not _has_extracted_data(loan_app):
        st.error("❌ Complete document verification first")
        return
    
    st.session_state.loan_application['current_step'] = step_number
    st.rerun()

def _render_progress_indicator(current_step):
    """Render the progress indicator at the top of the page"""
    steps = ["👤 Applicant Info", "📄 Upload Documents", "✅ Verify Documents", "✅ Cross-Verify Applicant Info"]
    cols = st.columns(4)
    
    for i, step in enumerate(steps):
        with cols[i]:
            step_num = i + 1
            if step_num == current_step:
                st.markdown(f"**{step}** ⬅️")
            elif step_num < current_step:
                st.markdown(f"✅ {step}")
            else:
                st.markdown(f"⏳ {step}")

def _validate_step_access(current_step, loan_app):
    """Validate if user can access current step, redirect if not"""
    if current_step >= 2 and not _has_complete_applicant(loan_app):
        st.error("❌ Complete applicant information first")
        loan_app['current_step'] = 1
        st.rerun()
        return False
    
    if current_step >= 3 and not _has_files(loan_app):
        st.error("❌ Upload at least one document first")
        loan_app['current_step'] = 2
        st.rerun()
        return False
    
    if current_step >= 4 and not _has_extracted_data(loan_app):
        st.error("❌ Complete document verification first")
        loan_app['current_step'] = 3
        st.rerun()
        return False
    
    return True

def main():
    """Main Streamlit application."""
    try:
        if 'loan_application' not in st.session_state:
            initialize_session_state()
        
        loan_app = st.session_state.loan_application
        current_step = loan_app['current_step']
        
        st.title("🏦 Loan Application Document Verification - Automated Processing")
        st.markdown("---")
        
        _render_progress_indicator(current_step)
        st.markdown("---")
        
        if not _validate_step_access(current_step, loan_app):
            return
        
        # Render current step
        step_renderers = {
            1: render_step_1,
            2: render_step_2,
            3: render_step_3,
            4: render_step_4
        }
        step_renderers[current_step]()
            
    except Exception as e:
        st.error(f"An application error occurred: {e}")
        st.info("Please ensure Streamlit is correctly installed and environment variables are set.")

# ============================================================================
# 6. STEP RENDERERS
# ============================================================================

def render_step_2():
    """Step 2: Upload required documents with enhanced UX styling"""
    loan_app = st.session_state.loan_application
    
    st.header("📄 Step 2: Upload Required Documents")
    st.info("📋 Upload multiple files for each document type (e.g., multiple pay slips, bank statements)")
    
    for doc_type, doc_config in DOCUMENT_TYPES.items():
        required_text = '(Required)' if doc_config.get('required', True) else '(Optional)'
        with st.expander(f"📎 {doc_config['name']} {required_text}", expanded=True):
            st.write(f"**Description:** {doc_config.get('description', 'Document for verification')}")
            
            uploaded_files = st.file_uploader(
                f"Choose {doc_config['name']} files",
                type=doc_config['accepted_formats'],
                accept_multiple_files=True,
                key=f"upload_{doc_type}"
            )
            
            # Sync loan_app with uploader state
            if uploaded_files:
                if any(f['doc_type'] == doc_type for f in loan_app['files']):
                    uploaded_names = {f.name for f in uploaded_files}
                    loan_app['files'] = [f for f in loan_app['files'] if f['doc_type'] != doc_type or f['file_name'] in uploaded_names]
            else:
                loan_app['files'] = [f for f in loan_app['files'] if f['doc_type'] != doc_type]
            
            if uploaded_files:
                stored_lookup = {(f['file_name'], f['doc_type']): f for f in loan_app['files']}
                
                for i, file_object in enumerate(uploaded_files):
                    stored_file = stored_lookup.get((file_object.name, doc_type))
                    
                    col1, col2 = st.columns([1, 2])
                    with col1:
                        st.write(f"📄 {i+1}. {file_object.name} ({file_object.size:,} bytes)")
                    
                    with col2:
                        status_placeholder = st.empty()
                        button_key = f"verify_{doc_type}_{i}"
                        
                        if stored_file and stored_file['status'] != 'Uploaded to S3':
                            st.button("✅ Verified", key=button_key, disabled=True, type="secondary")
                            status_desc = DOCUMENT_STATUSES.get(stored_file['status'], 'Processing completed')
                            status_placeholder.info(status_desc)
                            if stored_file.get('error_message'):
                                status_placeholder.info(f"❌ {stored_file.get('error_message')}")
                        else:
                            status_placeholder.info("💡 **Tip:** Verify all documents together on the next screen for faster processing!")
                            if st.button(f"✅ Verify: {doc_type.replace('_', ' ').title()}", key=button_key, type="secondary"):
                                progress_bar = st.progress(0, text="Verifying...")
                                verify_single_file(doc_type, file_object, button_key, progress_bar)
    
    render_step_navigation(2)

def render_step_3():
    """Step 3: Verify and process documents with enhanced UX styling"""
    loan_app = st.session_state.loan_application
    
    st.header("✅ Step 3: Document Verification")
    
    # Check if documents are uploaded
    if not loan_app['files']:
        st.info("📁 No documents uploaded yet. Please upload documents in Step 2.")
        return
    
    # FIRST: Show the document status table
    render_document_status_display()
    
    # SECOND: Show document processing section below the table
    st.subheader("🚀 Document Processing")
    
    # Find all pending files (only those that haven't been processed yet)
    pending_files = [f for f in loan_app['files'] if f['status'] == 'Uploaded to S3']
    
    # Check if all files have been processed (any status other than 'Uploaded to S3')
    processed_files = [f for f in loan_app['files'] if f['status'] != 'Uploaded to S3']
    
    # Single button that changes based on state
    if pending_files:
        total_docs = len(pending_files)
        st.info(f"📋 **Processing:** {total_docs} documents ready for validation")
        
        # Big RED button for validation
        if st.button(f"🚀 Verify {total_docs} Documents", type="primary", use_container_width=True):
            verify_all_files()
    elif processed_files:
        # All files have been processed - show submit button
        timing_msg = ""
        if hasattr(st.session_state, 'processing_duration'):
            timing_msg = f" in {st.session_state.processing_duration:.1f} seconds"
            # Clear the timing after displaying it
            del st.session_state.processing_duration
        
        st.success(f"✅ All {len(processed_files)} documents have been processed{timing_msg}!")
        if st.button("🔍 Cross-Verify Applicant Info with Submitted Documents →", type="primary", use_container_width=True):
            navigate_to_step(4)
    else:
        # No files at all
        st.info("📁 No documents uploaded yet. Please upload documents in Step 2.")




def create_validation_table(validation_results):
    """Create validation results as a list of dictionaries for Streamlit table"""
    table_data = []
    doc_counter = 1
    
    for doc_type_key, results in validation_results.items():
        display_name = results.get('display_name')
        files = results.get('files', [])
        
        if files:
            validation_status = results.get('validation_status', [])
            
            for file_info in files:
                filename = file_info.get('file_name', 'Unknown file')
                document_status = file_info.get('file_status', 'Unknown')
                
                if validation_status:
                    for i, finding in enumerate(validation_status):
                        table_data.append({
                            'Document Type': f"{doc_counter}. {display_name}" if i == 0 else '',
                            'Document Name': filename if i == 0 else '',
                            'Document Status': document_status if i == 0 else '',
                            'Validation Findings': finding
                        })
                else:
                    table_data.append({
                        'Document Type': f"{doc_counter}. {display_name}",
                        'Document Name': filename,
                        'Document Status': document_status,
                        'Validation Findings': '⚠️ No validation results available'
                    })
        else:
            table_data.append({
                'Document Type': f"{doc_counter}. {display_name}",
                'Document Name': 'No file uploaded',
                'Document Status': 'No file uploaded',
                'Validation Findings': '⚠️ No document uploaded'
            })
        
        doc_counter += 1
    
    return table_data

def render_validation_summary_section():
    """Render document validation summary for all document types"""
    try:
        from backend.document_validator import DocumentValidatorV3
        
        loan_app = st.session_state.loan_application
        validator = DocumentValidatorV3()
        validation_results = validator.validate_all_document_types(loan_app)
        
        if not validation_results:
            st.info("ℹ️ No documents available for validation")
            return
        
        validation_table = create_validation_table(validation_results)
        
        if validation_table:
            st.markdown("**📊 Cross-Verification Result**")
            st.dataframe(validation_table, hide_index=True)
            
            st.markdown("---")
            st.markdown("**📄 Extracted JSON Data**")
            
            documents_with_data = [
                {
                    'name': file_data.get('file_name', 'Unknown'),
                    'type': file_data.get('doc_type', 'Unknown'),
                    'data': file_data['extracted_data']
                }
                for file_data in loan_app.get('files', [])
                if file_data.get('extracted_data')
            ]
            
            if documents_with_data:
                selected_idx = st.selectbox("Select document to view JSON:", range(len(documents_with_data)), 
                                          format_func=lambda x: f"{documents_with_data[x]['name']} ({documents_with_data[x]['type']})")
                st.json(documents_with_data[selected_idx]['data'], expanded=False)
            else:
                st.info("No documents with extracted data available")
        else:
            st.warning("⚠️ No validation data available")
            
    except Exception as e:
        st.error(f"❌ Error during validation: {str(e)}")



def render_step_4():
    """Render Step 4 UI (summary and extracted data display)"""
    loan_app = st.session_state.loan_application
  
    # Cross-Verification Result
    st.subheader("🔍 Cross-Verification Result")
    st.info("ℹ️ **Proof of Concept Only:** This demonstrates basic automated validation by cross-checking applicant information against extracted document data. This is NOT comprehensive validation and is for demonstration purposes only. Production systems require extensive additional verification, compliance checks, and MAY require manual review processes.")
    render_validation_summary_section()

    
    # Navigation
    render_step_navigation(4)

def render_file_status_table_row_detailed(file_data):
    """Render a single file as a detailed table row with 3 columns"""
    if not file_data:
        return
    
    col1, col2, col3 = st.columns([2, 3, 3])
    
    with col1:
        doc_name = get_document_display_name(file_data['doc_type'])
        st.write(f"📄 {doc_name}")
    
    with col2:
        st.write(f"📁 {file_data['file_name']}")
    
    with col3:
        status = file_data['status']
        status_display = DOCUMENT_STATUSES.get(status, f'⏳ {status}')
        st.write(status_display)




def render_document_status_display():
    """Render status display for all files with enhanced table format"""
    loan_app = st.session_state.loan_application
    
    if not loan_app['files']:
        st.info("📁 No documents uploaded yet")
        return
    
    # Create enhanced table with headers
    st.subheader("📊 Document Processing Results")
    
    # Table header with 3 columns
    col1, col2, col3 = st.columns([2, 3, 3])
    with col1:
        st.write("**📄 Document Type**")
    with col2:
        st.write("**📁 Document Names**")
    with col3:
        st.write("**📊 Status**")
    
    # Render all files in a single table
    for file_data in loan_app['files']:
        render_file_status_table_row_detailed(file_data)

def get_pending_file_count():
    """Get count of files in uploaders that haven't been uploaded to S3 yet"""
    if not st.session_state.loan_application['files']:
        # Early exit when no stored files - count all uploaded files
        return sum(len(st.session_state.get(f"upload_{doc_type}", [])) for doc_type in DOCUMENT_TYPES.keys())
    
    stored_files_lookup = {(f['file_name'], f['doc_type']) for f in st.session_state.loan_application['files']}
    
    return sum(
        1 for doc_type in DOCUMENT_TYPES.keys()
        for file_object in st.session_state.get(f"upload_{doc_type}", [])
        if (file_object.name, doc_type) not in stored_files_lookup
    )

def render_step_navigation(current_step):
    """Render navigation buttons between steps"""
    st.divider()
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col1:
        if current_step > 1:
            if st.button("◀️ Back", type="secondary"):
                navigate_to_step(current_step - 1)
    
    with col3:
        if current_step < 4:
            if current_step == 2:
                # Show pending upload count in Continue button for Step 2
                pending_count = get_pending_file_count()
                button_text = f"Continue to Verification: Upload {pending_count} files ▶️" if pending_count > 0 else "Continue to Verification ▶️"
                if st.button(button_text, type="primary"):
                    navigate_to_step(current_step + 1)
            else:
                if st.button("Continue ▶️", type="primary"):
                    navigate_to_step(current_step + 1)


# ============================================================================
# 7. UI HELPER FUNCTIONS
# ============================================================================

def render_step_1():
    """Step 1: Collect applicant information"""
    st.header("👤 Step 1: Applicant Information")
    
    loan_app = st.session_state.loan_application
    applicant = loan_app.get('applicant', {})
    
    with st.form("applicant_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            first_name = st.text_input("First Name*", value=applicant.get('first_name', ''))
            ssn = st.text_input("Social Security Number*", value=applicant.get('ssn', ''), help="Format: XXX-XX-XXXX")
            
            min_date, max_date = _get_date_range()
            date_of_birth = st.date_input(
                "Date of Birth* (MM/DD/YYYY)", 
                value=applicant.get('date_of_birth'),
                min_value=min_date,
                max_value=max_date,
                format="MM/DD/YYYY"
            )
        
        with col2:
            last_name = st.text_input("Last Name*", value=applicant.get('last_name', ''))
            loan_amount = st.number_input(
                "Requested Loan Amount*", 
                min_value=1000, 
                max_value=1000000, 
                value=applicant.get('loan_amount', 50000)
            )
        
        if st.form_submit_button("Continue to Document Upload", type="primary"):
            # Validation
            if not _validate_ssn(ssn):
                st.error("SSN must be in format XXX-XX-XXXX (9 digits)")
                return
            
            if date_of_birth and _calculate_age(date_of_birth) < 18:
                st.error(f"❌ You must be at least 18 years old. Current age: {_calculate_age(date_of_birth)} years")
                return
            
            if not all([first_name, last_name, ssn, date_of_birth]):
                st.error("Please fill in all required fields marked with *")
                return
            
            # Clean SSN before saving (remove spaces and standardize format)
            ssn_clean = ssn.strip().replace('-', '').replace(' ', '')
            ssn_formatted = f"{ssn_clean[:3]}-{ssn_clean[3:5]}-{ssn_clean[5:]}"
            
            # Save and navigate
            loan_app['applicant'] = {
                'first_name': first_name.strip(),
                'last_name': last_name.strip(),
                'ssn': ssn_formatted,
                'date_of_birth': date_of_birth.isoformat(),
                'loan_amount': loan_amount
            }
            navigate_to_step(2)

if __name__ == "__main__":
    main()
