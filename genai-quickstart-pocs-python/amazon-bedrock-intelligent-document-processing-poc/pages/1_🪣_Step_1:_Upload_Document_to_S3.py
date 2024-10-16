import os
import streamlit as st
import boto3
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Initialize the S3 client
s3 = boto3.client('s3')

# Streamlit app title
st.title(f""":rainbow[Upload Document to Amazon S3]""")

# File uploader
uploaded_file = st.file_uploader("Choose a file", type=["png", "jpg", "jpeg", "pdf", "txt"])

# Check if a file is uploaded and then send to S3
if uploaded_file is not None:
    # Upload button
    if st.button("Upload to S3", type="primary"):
        try:
            # Upload the file to the S3 bucket
            s3.upload_fileobj(
                uploaded_file,
                bucket_name,
                uploaded_file.name,
            )
            # Display a success message
            st.success(f"File '{uploaded_file.name}' uploaded successfully to '{bucket_name}'!")
        # Check if user is authenticated
        except NoCredentialsError:
            st.error("Credentials not available.")
        # Print error message
        except Exception as e:
            st.error(f"An error occurred: {e}")
