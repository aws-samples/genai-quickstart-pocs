import boto3
import botocore
import streamlit as st
import io
import json
import pandas as pd

# Setup Bedrock client
config = botocore.config.Config(connect_timeout=300, read_timeout=300)
bedrock = boto3.client('bedrock-runtime', 'us-east-1', config=config)

# s3 client
s3 = boto3.client('s3')

def parse_xml(xml, tag):
    temp = xml.split(">")
    tag_to_extract = "</" + tag
    for line in temp:
        if tag_to_extract in line:
            parsed_value = line.replace(tag_to_extract, "")
            return parsed_value

def csv_to_text(csv_data, csv_subject):
    # Set chunk size (adjust as needed)
    chunk_size = 100000  # Reduced chunk size

    # Create a TextIOWrapper for the CSV data
    csv_io = io.StringIO(csv_data.decode('utf-8'))

    results = []

    # Read the CSV data in chunks
    for chunk in pd.read_csv(csv_io, chunksize=chunk_size):
        # Convert chunk to a JSON string
        json_data = chunk.to_json(orient='records')

        # Truncate the JSON data if it exceeds the maximum length
        max_length = 100000  # Adjust the maximum length as needed
        if len(json_data) > max_length:
            json_data = json_data[:max_length]

        # Setup prompt
        user_prompt = """
You are an {csv_subject} Analyst.You will be provided with CSV data. Based on the data, your goal is to provide the following:
    A brief description of the data
    Insights or patterns you can identify from the data
        
Example output format, use this example for the response format:
    <description>(Brief description of what the CSV data is about)</description>
    <insights>(Insights or patterns identified from the data)</insights>

Think through each step of your thought process and provide a detailed analysis.

"""

        prompt = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "temperature": 0.1,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": user_prompt
                        },
                        {
                            "type": "text",
                            "text": json_data
                        }
                    ]
                }
            ]
        }

        json_prompt = json.dumps(prompt)

        response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")

        response_body = json.loads(response.get('body').read())

        llmOutput = response_body['content'][0]['text']
    print(llmOutput)

    return llmOutput

def parse_unique_values(unique_values_str):
    try:
        unique_values = json.loads(unique_values_str)
        df = pd.DataFrame.from_dict(unique_values, orient='index').T
    except json.JSONDecodeError:
        df = pd.DataFrame()  # Return an empty DataFrame if JSON parsing fails
    return df

def chat_with_csv(csv_data, user_question, csv_subject):
    # Set chunk size (adjust as needed)
    chunk_size = 100000  # Reduced chunk size

    # Create a TextIOWrapper for the CSV data
    csv_io = io.StringIO(csv_data.decode('utf-8'))

    # Initialize an empty list to store the responses
    responses = []

    # Read the CSV data in chunks
    for chunk in pd.read_csv(csv_io, chunksize=chunk_size):
        # Convert chunk to a JSON string
        json_data = chunk.to_json(orient='records')

        # Truncate the JSON data if it exceeds the maximum length
        max_length = 100000  # Adjust the maximum length as needed
        if len(json_data) > max_length:
            json_data = json_data[:max_length]

        # Setup prompt
        user_prompt = f"""
You are an AI {csv_subject} Analyst. You will be provided with CSV data and a user question. Based on the data and the question, provide a detailed response. If the response is better suited in a tabular format, please provide the response in the following format:

CSV Data:
{json_data}

User Question:
{user_question}

Provide a detailed response to the user's question based on the given CSV data.
"""

        prompt = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "temperature": 0.1,
            "messages": [
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        }

        json_prompt = json.dumps(prompt)

        response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0", accept="application/json", contentType="application/json")

        response_body = json.loads(response.get('body').read())

        llmOutput = response_body['content']
    
    print(llmOutput)  
    return llmOutput




        

      