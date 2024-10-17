import os
import json
import streamlit as st
import boto3
from dotenv import load_dotenv
import base64

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Initialize the S3 and Bedrock clients
s3_client = boto3.client("s3", region_name="us-east-1")
client = boto3.client("bedrock-runtime", region_name="us-west-2")

# Set the model ID, e.g., Claude 3.5 Sonnet.
model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"

# Streamlit app title
st.title(f""":rainbow[Document Summarization with Amazon Bedrock]""")
st.write("Select an option below to summarize the document using the enriched text output or with Amazon Bedrock's multimodal capabilities:")

# Provide options to user for summarization method
option = st.radio(
    "Choose summarization method:",
    ('Summarize using contents from enriched_output.txt file', 'Summarize using multimodal model')
)

def summarize_with_bedrock(prompt):
    """
    This function performs document summarization using the enriched output text from the local file
    :param prompt: The enriched output text from the local file
    :return: The summarization result from the model
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text", 
                        "text": '''This is a document summarization program. Provide a cohesive summary of the contents from this document: ''' + prompt
                    }
                ],
            }
        ],
    }
    # Convert the native request to JSON for the API call
    request = json.dumps(body)
    # Call to Bedrock API to summarize the text
    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=request
    )
    # Decode the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

def encode_image_to_base64(bucket, image_key):
    """
    This function encodes the image to a base64 format to be analyzed by Bedrock's multimodal model
    :param bucket: The S3 bucket name
    :param image_key: The S3 image key
    :return: The encoded image
    """
    # Retrieve the image file from S3 and encode it in base64
    image_obj = s3_client.get_object(Bucket=bucket, Key=image_key)
    image_bytes = image_obj['Body'].read()
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    return encoded_image

def list_files_in_s3(bucket):
    """
    This function is used to list the document objects from the S3 bucket that a user can select before sending to Textract
    :param bucket: S3 bucket name
    :return: List of objects in the S3 bucket
    """
    try:
        response = s3_client.list_objects_v2(Bucket=bucket)
        # Check if there are objects in bucket
        if 'Contents' in response:
            return [obj['Key'] for obj in response['Contents']]
        else:
            return []
    except Exception as e:
        st.error(f"An error occurred while listing files: {e}")
        return []
    
def summarize_with_multimodal(prompt):
    """
    This function performs document summarization using the multimodal capabilities of Bedrock, which will analyze the file in the
    S3 bucket as is (for ex.g., images, PDFs, etc.)
    :param prompt: The image in base64 format to be analyzed by the model
    :return: The summarization result from the model
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": prompt,
                        },
                    },
                    {
                        "type": "text", 
                        "text": '''This is a document summarization program. Provide a cohesive summary of the contents from this image'''
                    }
                ],
            }
        ],
    }
    # Convert the native request to JSON for the API call
    request = json.dumps(body)
    # Call to Bedrock API to summarize the text
    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=request
    )
    # Decode the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

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
    files = list_files_in_s3(bucket_name)
    selected_file = st.selectbox("Select an image from S3 to process:", files)
    # Button to trigger reading from S3 file
    if st.button("Summarize image", type='primary'):
        if selected_file:
            try:
                with st.spinner("Encoding image and summarizing..."):
                    # Invoke multimodal summarization for Bedrock
                    encoded_image = encode_image_to_base64(bucket_name, selected_file)
                    summary = summarize_with_multimodal(encoded_image)
                st.write("### Document Image Summary:")
                st.write(summary)
            except Exception as e:
                st.error(f"An error occurred: {e}")
        else:
            st.error("Please select a file from the dropdown.")
