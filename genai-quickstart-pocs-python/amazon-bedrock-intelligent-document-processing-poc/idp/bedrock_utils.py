import boto3
import json
import os
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Initialize a Bedrock Runtime client in the AWS Region of your choice.
client = boto3.client("bedrock-runtime")
s3_client = boto3.client("s3")

# Set the model ID, e.g., Claude 3 Sonnet.
model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"

def bedrock_enrichment(prompt):
    """
    This function performs document enrichment and grammar correction using the key-value pair output text from the local file
    :param prompt: The key-value text from the local file
    :return: The enriched result with grammar corrections from the model
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
                        "text": '''These are key-value pairs extracted from a document uploaded to an S3 bucket, along with the Amazon Textract extraction confidence score. 
                                Perform grammar correction on the key and value pairs. Do not make assumptions. Do not perform a grammar correction if it is not needed.
                                Use the confidence scores to help guide you as some terms may be unique to the document. 
                                Print the original word, term, or number and its corrected version with an explanation, even if no correction was done. Each original and corrected word or number must be on a new line in your response. 
                                Do not not skip any keys or values in your response. Do not repeat the instructions in your response.
                                Use the following format: Original term: <word>, Corrected term: <corrected_word>, Reason: <reason>''' + prompt
                    }
                ],
            }
        ],
    }
    # Convert the body to JSON for the API call
    request = json.dumps(body)
    # Invoke the model
    response = client.invoke_model(
        modelId=model_id,   
        contentType="application/json",
        accept="application/json",
        body=request)
    # Read the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text


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
    # Convert the body to JSON for the API call
    request = json.dumps(body)
    # Invoke the model
    response = client.invoke_model(
        modelId=model_id,   
        contentType="application/json",
        accept="application/json",
        body=request)
    # Read the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

def encode_image_to_base64(image_key):
    """
    This function encodes the image to a base64 format to be analyzed by Bedrock's multimodal model
    :param image_key: The S3 image key
    :return: The encoded image
    """
    # Retrieve the image file from S3 and encode it in base64
    image_obj = s3_client.get_object(Bucket=bucket_name, Key=image_key)
    # Get the image bytes as input to the model
    image_bytes = image_obj['Body'].read()
    # Encode the image in base64 format
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    return encoded_image
    
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
    # Convert the body to JSON for the API call
    request = json.dumps(body)
    # Invoke the model
    response = client.invoke_model(
        modelId=model_id,   
        contentType="application/json",
        accept="application/json",
        body=request)
    # Read the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

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
    # Convert the body to JSON for the API call
    request = json.dumps(body)
    # Invoke the model
    response = client.invoke_model(
        modelId=model_id,   
        contentType="application/json",
        accept="application/json",
        body=request)
    # Read the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

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
    # Convert the body to JSON for the API call
    request = json.dumps(body)
    # Invoke the model
    response = client.invoke_model(
        modelId=model_id,   
        contentType="application/json",
        accept="application/json",
        body=request)
    # Read the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

def chat_with_bedrock(prompt):
    """
    This function performs Q&A using the enriched output text from the local file
    :param prompt: The enriched output text from the local file
    :return: The answer to the questionfrom the model
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": '''You are a conversational question-answering agent that will be provided with a document and a question. 
                        Answer the question only using information from the document. Do not include your rationale or any additional thoughts. Do not make assumptions. 
                        Here is the document and user question:''' + prompt,
            }
        ],
    }
    # Convert the body to JSON for the API call
    request = json.dumps(body)
    # Invoke the model
    response = client.invoke_model(
        modelId=model_id,   
        contentType="application/json",
        accept="application/json",
        body=request)
    # Read the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

def chat_with_multimodal(prompt, question):
    """
    This function performs Q&A using the multimodal capabilities of Bedrock, which will analyze the file in the
    S3 bucket as is (for ex.g., images, PDFs, etc.)
    :param prompt: The image in base64 format to be analyzed by the model
    :param question: The question to be asked about the document
    :return: The answer to the question from the model
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
                        "text": '''You are a conversational question-answering agent that will be provided with a document image and a question. 
                        Answer the question only using information from the document. Do not include your rationale or any additional thoughts. Do not make assumptions. 
                        Here is the document and user question:''' + question
                    }
                ],
            }
        ],
    }
   # Convert request to JSON for the API call
    request = json.dumps(body)
    # Call to Bedrock API to answer the question
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
