import streamlit as st
import os
from idp.s3_utils import list_files_in_s3
from idp.textract_utils import process_document
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Streamlit app title
st.title(f""":rainbow[Analyze Document with Amazon Textract]""")

# Invoke function to list document objects
files = list_files_in_s3()

# Select object with Streamlit
selected_file = st.selectbox("Select a document from S3 to process:", files)

# If user has selected file, then begin Textract job
if selected_file:
    st.write(f"Selected file: {selected_file}") 
    if st.button("Extract raw text and key-value pairs", type='primary'):
        with st.spinner("Processing document..."):
            raw_text, key_value_pairs = process_document(bucket_name, selected_file)
            st.success("Raw text has been saved to 'extracted_text.txt'.")
            st.success("Key-value pairs have been saved to 'key_value.txt'.")

            # Display the results together
            st.subheader("Results:")
            st.subheader("Raw Text Extraction:")
                
            st.text_area("Raw Text", raw_text, height=200)

            # Display the extracted key-value pairs
            if key_value_pairs:
                st.subheader("Key-Value Extraction:")
                for key, value_info in key_value_pairs.items():
                    st.write(f"**Key:** {key}, **Value:** {value_info['Value']}, **Confidence:** {value_info['Confidence']:.2f}%")
            else:
                st.write("No key-value pairs found.")
