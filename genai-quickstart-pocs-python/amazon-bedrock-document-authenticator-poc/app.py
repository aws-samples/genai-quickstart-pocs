import streamlit as st  # Web application framework for creating interactive UI
from utils.document_processor import process_document, get_bedrock_client  # Custom document processing utilities
import logging  # For application logging

# Initialize logger for this module
logger = logging.getLogger(__name__)

def display_verification_results(results):
    """
    Display document verification results in a structured format using Streamlit
    
    Args:
        results (dict): Dictionary containing document analysis results with the following structure:
            - full_analysis (dict): Contains the complete analysis
                - document_analysis (dict): Overall document verification info
                - extracted_info (dict): Specific fields extracted from the document
    
    The function handles multiple document types and displays relevant information
    in an organized, user-friendly format with proper error handling.
    """
    # Basic validation checks
    if not results:
        st.error("No results to display. Please try uploading the document again.")
        return
        
    if not isinstance(results, dict):
        st.error(f"Invalid results format: {type(results)}")
        return

    if "error" in results.get("full_analysis", {}):
        st.error(f"Error processing document: {results['full_analysis']['error']}")
        return

    try:
        # Extract main analysis components
        analysis = results.get("full_analysis", {})
        if not analysis:
            st.error("No analysis results available")
            return

        extracted_info = analysis.get("extracted_info", {})
        if not extracted_info:
            st.error("No information could be extracted from the document")
            return

        # Display logic for ID Documents (driver's license, passport, etc.)
        if "id_type" in extracted_info:
            # Create two-column layout for better organization
            col1, col2 = st.columns(2)
            with col1:
                st.subheader("Personal Information")
                st.info(f"**Name:** {extracted_info['full_name']['value']}")
                if "date_of_birth" in extracted_info:
                    st.info(f"**Date of Birth:** {extracted_info['date_of_birth']['value']}")
                if "address" in extracted_info:
                    st.info(f"**Address:** {extracted_info['address']['value']}")

            with col2:
                st.subheader("Document Information")
                st.info(f"**ID Type:** {extracted_info['id_type']['value']}")
                if "document_number" in extracted_info:
                    st.info(f"**Document Number:** {extracted_info['document_number']['value']}")
                if "issue_date" in extracted_info:
                    st.info(f"**Issue Date:** {extracted_info['issue_date']['value']}")
                if "expiration_date" in extracted_info:
                    st.info(f"**Expiration Date:** {extracted_info['expiration_date']['value']}")

        # Display logic for Bank Statements
        elif "bank_name" in extracted_info:
            st.header("Bank Statement Information")
            st.info(f"**Bank Name:** {extracted_info['bank_name']['value']}")
            st.info(f"**Account Holder:** {extracted_info['account_holder']['value']}")
            st.info(f"**Account Number (Last 4):** {extracted_info['account_number']['value']}")
            st.info(f"**Statement Period:** {extracted_info['statement_period']['value']}")
            if 'address' in extracted_info:
                st.info(f"**Mailing Address:** {extracted_info['address']['value']}")

        # Display logic for Utility Bills
        elif "utility_type" in extracted_info:
            st.header("Utility Bill Information")
            st.info(f"**Utility Type:** {extracted_info['utility_type']['value']}")
            st.info(f"**Utility Provider:** {extracted_info['utility_provider']['value']}")
            st.info(f"**Customer Name:** {extracted_info['customer_name']['value']}")
            st.info(f"**Service Address:** {extracted_info['service_address']['value']}")
            st.info(f"**Account Number:** {extracted_info['account_number']['value']}")
            st.info(f"**Bill Date:** {extracted_info['bill_date']['value']}")

        # Display logic for Pay Stubs and Employment Verification
        elif "employee_info" in extracted_info:
            if "pay_period" in extracted_info:  # Pay Stub specific information
                st.header("Pay Stub Information")
                # Employee Information
                emp_info = extracted_info['employee_info']
                st.info(f"**Employee Name:** {emp_info['name']['value']}")
                if 'id' in emp_info:
                    st.info(f"**Employee ID:** {emp_info['id']['value']}")

                # Company Information
                company_info = extracted_info['company_info']
                st.info(f"**Company Name:** {company_info['name']['value']}")
                if 'address' in company_info:
                    st.info(f"**Company Address:** {company_info['address']['value']}")

                # Pay Period Details
                pay_period = extracted_info['pay_period']
                st.info(f"**Pay Period:** {pay_period['start_date']['value']} - {pay_period['end_date']['value']}")
                st.info(f"**Pay Date:** {pay_period['pay_date']['value']}")

                # Earnings Information
                earnings = extracted_info['earnings']
                st.info(f"**Gross Pay:** {earnings['gross_pay']['value']}")
                st.info(f"**Net Pay:** {earnings['net_pay']['value']}")
                st.info(f"**YTD Gross:** {earnings['ytd_gross']['value']}")
                st.info(f"**YTD Net:** {earnings['ytd_net']['value']}")

            else:  # Employment Verification Letter
                st.header("Employment Verification Information")
                # Employee Information
                emp_info = extracted_info['employee_info']
                st.info(f"**Employee Name:** {emp_info['name']['value']}")
                
                # Company Information
                company_info = extracted_info['company_info']
                st.info(f"**Company Name:** {company_info['name']['value']}")
                st.info(f"**Company Address:** {company_info['address']['value']}")
                
                # Employment Details
                emp_details = extracted_info['employment_details']
                st.info(f"**Position:** {emp_details['position']['value']}")
                st.info(f"**Start Date:** {emp_details['start_date']['value']}")
                st.info(f"**Employment Status:** {emp_details['employment_status']['value']}")
                
                # Verification Details
                ver_details = extracted_info['verification_details']
                st.info(f"**Issue Date:** {ver_details['issue_date']['value']}")
                st.info(f"**Issued By:** {ver_details['issuer_name']['value']}")
                st.info(f"**Issuer Title:** {ver_details['issuer_title']['value']}")
                st.info(f"**Contact Info:** {ver_details['contact_info']['value']}")

        # Display Verification Status for all document types
        st.subheader("Verification Status")
        verification_status = analysis.get("document_analysis", {}).get("verification_status", {}).get("value", "UNVERIFIED")
        status_color = "green" if verification_status == "VERIFIED" else "orange"
        st.markdown(f":{status_color}[**{verification_status}**]")

        # Display Confidence Scores in an expandable section
        with st.expander("Confidence Scores"):
            for field, data in extracted_info.items():
                if isinstance(data, dict):
                    if 'confidence' in data:
                        st.text(f"{field}: {data['confidence']:.2%}")
                    elif isinstance(data, dict):
                        for subfield, subdata in data.items():
                            if isinstance(subdata, dict) and 'confidence' in subdata:
                                st.text(f"{field}.{subfield}: {subdata['confidence']:.2%}")

    except Exception as e:
        logger.error(f"Error displaying results: {str(e)}", exc_info=True)
        st.error(f"Error displaying results: {str(e)}")

def main():
    """
    Main application function that sets up the Streamlit interface and handles the document
    verification workflow.
    
    Features:
    - Interactive document type selection
    - File upload capability for PDF and image files
    - Real-time document verification processing
    - Structured display of verification results
    - Error handling and user feedback
    """
    # Application title with decorative styling
    st.title(f""":rainbow[Financial Document Verification System]""")    
    
    # Document type selection dropdown
    doc_type = st.selectbox(
        "Select Document Type",
        ["ID Document", "Bank Statement", "Utility Bill", "Pay Stub", "Employment Verification"],
        key="doc_type_selector"
    )
    
    # Handle document type changes
    if 'previous_doc_type' not in st.session_state:
        st.session_state.previous_doc_type = doc_type
    
    # Clear file uploader when document type changes
    if st.session_state.previous_doc_type != doc_type:
        st.session_state.previous_doc_type = doc_type
        if 'uploaded_file' in st.session_state:
            del st.session_state.uploaded_file
    
    # File uploader widget
    uploaded_file = st.file_uploader(
        "Upload Document", 
        type=["pdf", "png", "jpg", "jpeg"],
        key="uploaded_file"
    )
    
    # Process uploaded document
    if uploaded_file is not None:
        try:
            with st.spinner('Verifying document...'):
                # Initialize AWS Bedrock client
                bedrock_client = get_bedrock_client()
                # Process the document and get results
                results = process_document(bedrock_client, uploaded_file, doc_type)
                if results:
                    display_verification_results(results)
                else:
                    st.error("Failed to process document. Please try again.")
        except Exception as e:
            logger.error(f"Processing error: {str(e)}", exc_info=True)
            st.error(f"Error processing document: {str(e)}")

# Entry point of the application
if __name__ == "__main__":
    main()
