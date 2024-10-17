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
st.title(f""":rainbow[Document Classification with Amazon Bedrock]""")
st.write("Select an option below to classify the document using the enriched text output or with Amazon Bedrock's multimodal capabilities:")

# Provide options to user for classification method
option = st.radio(
    "Choose classification method:",
    ('Classify using contents from enriched_output.txt file', 'Classify using multimodal model')
)

def classify_with_bedrock(prompt):
    """
    This function performs document classification using the enriched output text from the local file
    :param prompt: The enriched output text from the local file
    :return: The classification result from the model
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
                        # This prompt defines which class the model should select after reading the file. Add to the list of options depending on your use case
                        "text": '''This is a document classification program. Given the list of classes
                        ["DISCHARGE_SUMMARY","DOCTORS_NOTES","MEDICAL_REPORT","CLAIM_FORM","INSURANCE_ID","PRESCRIPTION","BENEFIT_APPLICATION", 
                        "DRIVERS_LICENSE","UTILITY_BILL","BANK_STATEMENT","SOCIAL_SECURITY","STUDENT_REGISTRATION","TRANSCRIPT","BIRTH_CERTIFICATE","PAYSTUB"], classify the document in <document> tags into one and exactly one of these classes ("Class"). 
                        Give the answer with exactly one class and no additional text. If you cannot recognize the document, please use the ["UNKNOWN"] class. Do not try to make up a class. Here are some examples of the output:
                            Document: sample document text with claim form information
                            Class: CLAIM_FORM
                            =====
                            Document: sample document text with medical report information
                            Class: MEDICAL_REPORT
                            =====
                            Document: sample document text for document to be classified
                            Class: <document>''' + prompt + '''</document>'''
                    }
                ],
            }
        ],
    }
    # Convert the native request to JSON for the API call
    request = json.dumps(body)
    # Invoke the Bedrock model to classify the text
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
    
def classify_with_multimodal(prompt):
    """
    This function performs document classification using the multimodal capabilities of Bedrock, which will analyze the file in the
    S3 bucket as is (for ex.g., images, PDFs, etc.)
    :param prompt: The image in base64 format to be analyzed by the model
    :return: The classification result from the model
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
                        # This prompt defines which class the model should select after reading the file. Add to the list of options depending on your use case
                        "text": '''This is a document classification program. Given the a list of classes
                        ["DISCHARGE_SUMMARY","DOCTORS_NOTES","MEDICAL_REPORT","CLAIM_FORM","INSURANCE_ID","PRESCRIPTION","BENEFIT_APPLICATION", 
                        "DRIVERS_LICENSE","UTILITY_BILL","BANK_STATEMENT","SOCIAL_SECURITY","STUDENT_REGISTRATION","TRANSCRIPT","BIRTH_CERTIFICATE","PAYSTUB"], classify the document in the image into one and exactly one of these classes ("Class"). 
                        Give the answer with exactly one class and no additional text. If you cannot recognize the document, please use the ["UNKNOWN"] class. Do not try to make up a class. Here are some examples of the output:
                            Document: sample document image with claim form information
                            Class: CLAIM_FORM
                            =====
                            Document: sample document image with medical report information
                            Class: MEDICAL_REPORT
                            =====
                            Document: sample document image for document to be classified
                            Class: '''
                    }
                ],
            }
        ],
    }
    # Convert the native request to JSON for the API call
    request = json.dumps(body)
    # Call to Bedrock API to classify the text
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

# If user selected text option, then classify from the local file
if option == 'Classify using contents from enriched_output.txt file':
    # Button to trigger reading the local file
    if st.button("Classify from 'enriched_output.txt'", type='primary'):
        try:
            with open("enriched_output.txt", "r", encoding="utf-8") as file:
                file_text = file.read() 
            with st.spinner("Classifying the document..."):
                # Invoke text-based classification for Bedrock
                classification = classify_with_bedrock(file_text)
            st.write("### Document Classification:")
            st.write("Based on the provided text and contents, the document is classified as:")
            st.write(classification)
        except FileNotFoundError:
            st.error("The file 'enriched_output.txt' was not found in the directory.")
# If user selected multimodal option, then classify from the S3 bucket
elif option == 'Classify using multimodal model':
    # List files in S3 and allow user to select one
    files = list_files_in_s3(bucket_name)
    selected_file = st.selectbox("Select an image from S3 to process:", files)
    if st.button("Classify image", type='primary'):
        if selected_file:
            try:
                with st.spinner("Encoding image and classifying..."):
                    # Encode S3 file as image
                    encoded_image = encode_image_to_base64(bucket_name, selected_file)
                    # Invoke multimodal classification for Bedrock
                    classification = classify_with_multimodal(encoded_image)
                st.write("### Document Image Classification:")
                st.write(classification)
            except Exception as e:
                st.error(f"An error occurred: {e}")
        else:
            st.error("Please select a file from the dropdown.")
