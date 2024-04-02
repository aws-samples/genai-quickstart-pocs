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
    body = json.dumps({"prompt": question_with_prompt,
                       "max_tokens_to_sample": 8191,
                       "temperature": 0,
                       "top_k": 250,
                       "top_p": 0.5,
                       "stop_sequences": []
                       })
    # configure model specifics such as specific model
    modelId = 'anthropic.claude-v2:1'
    accept = 'application/json'
    contentType = 'application/json'
    # Invoking bedrock using the invoke_model_with_response_stream method, which returns a generator object
    response = bedrock.invoke_model_with_response_stream(body=body,
                                                         modelId=modelId,
                                                         accept=accept,
                                                         contentType=contentType)
    # creating the initial stream of the answer from Bedrock
    stream = response["body"]
    # when a stream is detected, it triggers an iteration through the stream, creating a generator object going to the
    # frontend
    if stream:
        # iterating through the stream
        for response in stream:
            # getting the specific chunks, and bytes needed to return the appropriate pieces of the response
            json_response = json.loads(response['chunk']['bytes'])
            # returning a generator object, that is being streamed to the frontend
            yield json_response['completion']
