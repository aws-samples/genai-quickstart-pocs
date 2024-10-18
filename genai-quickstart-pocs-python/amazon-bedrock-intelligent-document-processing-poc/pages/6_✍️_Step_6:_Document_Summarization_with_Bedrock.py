import streamlit as st
from idp.bedrock_utils import summarize_with_bedrock, summarize_with_multimodal, encode_image_to_base64
from idp.s3_utils import list_files_in_s3

# Streamlit app title
st.title(f""":rainbow[Document Summarization with Amazon Bedrock]""")
st.write("Select an option below to summarize the document using the enriched text output or with Amazon Bedrock's multimodal capabilities:")

# Provide options to user for summarization method
option = st.radio(
    "Choose summarization method:",
    ('Summarize using contents from enriched_output.txt file', 'Summarize using multimodal model')
)

# If user selected text option, then summarize from the local file
if option == 'Summarize using contents from enriched_output.txt file':
    # Button to trigger reading the local file
    if st.button("Summarize from 'enriched_output.txt'", type='primary'):
        try:
            with open("enriched_output.txt", "r", encoding="utf-8") as file:
                file_text = file.read()       
            with st.spinner("Summarizing the document..."):
                # Invoke text-based summarization for Bedrock
                summary = summarize_with_bedrock(file_text)  
            st.write("### Document Summary:")
            st.write(summary)
        except FileNotFoundError:
            st.error("The file 'enriched_output.txt' was not found in the directory.")
# If user selected multimodal option, then summarize from the S3 bucket
elif option == 'Summarize using multimodal model':
    # List files in S3 and allow user to select one
    files = list_files_in_s3()
    selected_file = st.selectbox("Select an image from S3 to process:", files)
    # Button to trigger reading from S3 file
    if st.button("Summarize image", type='primary'):
        if selected_file:
            try:
                with st.spinner("Encoding image and summarizing..."):
                    # Invoke multimodal summarization for Bedrock
                    encoded_image = encode_image_to_base64(selected_file)
                    summary = summarize_with_multimodal(encoded_image)
                st.write("### Document Image Summary:")
                st.write(summary)
            except Exception as e:
                st.error(f"An error occurred: {e}")
        else:
            st.error("Please select a file from the dropdown.")
