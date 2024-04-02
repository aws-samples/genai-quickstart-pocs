import boto3
import json
import botocore.config
import os
from dotenv import load_dotenv

# loading in environment variables
load_dotenv()

# configuring our CLI profile name
boto3.setup_default_session(profile_name=os.getenv('profile_name'))
# increasing the timeout period when invoking bedrock
config = botocore.config.Config(connect_timeout=120, read_timeout=120)
# instantiating the bedrock client
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com',
                       config=config)


def llm_answer_streaming(question):
    """
    This function is used to invoke Amazon Bedrock using the question that was passed in from the user on the frontend.
    :param question: This is the question that is passed in from the frontend.
    :return: A generator object, used to stream the answer from Bedrock to the frontend streamlit application.
    """
    # formatting the user question to fit the prompting style of Anthropic Claude.
    question_with_prompt = f"""Human: {question}
    
    Assistant:"""

    # body of data with parameters that is passed into the bedrock invoke model request
    # TODO: TUNE THESE PARAMETERS AS YOU SEE FIT
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.5,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": question_with_prompt
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)
    # Invoking bedrock using the invoke_model_with_response_stream method, which returns a generator object
    response = bedrock.invoke_model_with_response_stream(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                                    accept="application/json", contentType="application/json")
    # In a response, if a content_block_delta is detected, it triggers an iteration through the stream, creating a generator object going to the
    # frontend
    # looping through the response from the invoke_model_with_response_stream method
    for event in response.get("body"):
        # loading the json, and accessing the specific bytes
        chunk = json.loads(event["chunk"]["bytes"])
        # If a message_delta is detected, it prints the stop reason, stop sequence, and output tokens.
        if chunk['type'] == 'message_delta':
            print(f"\nStop reason: {chunk['delta']['stop_reason']}")
            print(f"Stop sequence: {chunk['delta']['stop_sequence']}")
            print(f"Output tokens: {chunk['usage']['output_tokens']}")
        #  If a content_block_delta is detected, it determines if it includes a text_delta.
        if chunk['type'] == 'content_block_delta':
            # If a text_delta is detected, it streams the text to the front end.
            if chunk['delta']['type'] == 'text_delta':
                # using a generator object to stream the text to the front end.
                yield chunk['delta']['text']