import streamlit as st
import os
from idp.s3_utils import upload_to_s3
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Streamlit app title
st.title(f""":rainbow[Upload Document to Amazon S3]""")

# File uploader
uploaded_file = st.file_uploader("Choose a file", type=["png", "jpg", "jpeg", "pdf", "txt"])

# Check if a file is uploaded and then send to S3
if uploaded_file is not None:
    # Upload button
    if st.button("Upload to S3", type="primary"):
        try:
            upload_to_s3(uploaded_file)
            st.success(f"File '{uploaded_file.name}' uploaded successfully to '{bucket_name}'!")
            # Check if user is authenticated
        except NoCredentialsError:
            st.error("Credentials not available.")
        # Print error message
        except Exception as e:
            st.error(f"An error occurred: {e}")
        
        
