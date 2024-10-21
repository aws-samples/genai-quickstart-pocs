import streamlit as st
from idp.bedrock_utils import classify_with_bedrock, classify_with_multimodal, encode_image_to_base64
from idp.s3_utils import list_files_in_s3

# Streamlit app title
st.title(f""":rainbow[Document Classification with Amazon Bedrock]""")
st.write("Select an option below to classify the document into a pre-defined category (e.g., claim form, driver's license, birth certificate) using the enriched text output or Amazon Bedrock's multimodal capabilities:")

# Provide options to user for classification method
option = st.radio(
    "Choose classification method:",
    ('Classify using contents from output/enriched_output.txt file', 'Classify using multimodal model')
)

# If user selected text option, then classify from the local file
if option == 'Classify using contents from output/enriched_output.txt file':
    # Button to trigger reading the local file
    if st.button("Classify from 'output/enriched_output.txt'", type='primary'):
        try:
            with open("output/enriched_output.txt", "r", encoding="utf-8") as file:
                file_text = file.read() 
            with st.spinner("Classifying the document..."):
                # Invoke text-based classification for Bedrock
                classification = classify_with_bedrock(file_text)
            st.write("### Document Classification:")
            st.write("Based on the provided text and contents, the document is classified as:")
            st.write(classification)
        except FileNotFoundError:
            st.error("The file 'output/enriched_output.txt' was not found in the directory.")
# If user selected multimodal option, then classify from the S3 bucket
elif option == 'Classify using multimodal model':
    # List files in S3 and allow user to select one
    files = list_files_in_s3()
    selected_file = st.selectbox("Select an image from S3 to process:", files)
    if st.button("Classify image", type='primary'):
        if selected_file:
            try:
                with st.spinner("Encoding image and classifying..."):
                    # Encode S3 file as image
                    encoded_image = encode_image_to_base64(selected_file)
                    # Invoke multimodal classification for Bedrock
                    classification = classify_with_multimodal(encoded_image)
                st.write("### Document Image Classification:")
                st.write(classification)
            except Exception as e:
                st.error(f"An error occurred: {e}")
        else:
            st.error("Please select a file from the dropdown.")
