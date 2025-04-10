import boto3
import json
from dotenv import load_dotenv
import os
from botocore.exceptions import ClientError

# Loading in variables from .env file
load_dotenv()

# Getting the variables from the .env file for the guardrail identifier and guardrail version
guardrail_identifier = os.getenv("guardrail_identifier")
guardrail_version = os.getenv("guardrail_version")

# Instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')

def invoke_model(text):
    """
    This function is used to invoke the Claude3 model, while leveraging Amazon Bedrock Guardrails.
    :param text: This is the text that the user inserts on the frontend.
    :return: A natural language response to the question that the user inserted on the frontend.
    """
    # The system prompt is used as a default prompt, and is always passed into to the model
    system_content = "Answer every aspect of the provided question as thoroughly as possible. Be extremely thorough and provide detailed answers to the user provided question."
    
    # Prepare the request with correct message format and parameter structure
    # The content needs to be a list of message parts
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "text": text
                }
            ]
        }
    ]
    
    # # System needs to be a list of message parts
    system = [
        {
            "text": system_content
        }
    ]
    
    # Set up guardrail configuration
    guardrail_config = {
        "guardrailIdentifier": guardrail_identifier,
        "guardrailVersion": guardrail_version,
        "trace": 'enabled'
    }
    
    # Add inference configuration
    inference_config = {
        "maxTokens": 1000,
        "temperature": 0.5,
        "topP": 0.9
    }
    
    print(f'Using guardrail: {guardrail_identifier} with version: {guardrail_version}')
    
    # Invoking Claude3 with the converse API and specified guardrail
    response = bedrock.converse(
        modelId="anthropic.claude-3-sonnet-20240229-v1:0",
        messages=messages,
        system=system,
        inferenceConfig=inference_config,
        guardrailConfig=guardrail_config,
    )
    # Checking to see if the guardrail was intervened and if so setting the appropriate output response
    if response['stopReason'] == 'guardrail_intervened':
        try:
            guardrail_topics_invoked = get_guardrail_topic(response)
            output_text = 'Sorry, the model cannot answer this question because it discusses the following topics: {}.'.format(", ".join(guardrail_topics_invoked))
        except:
            output_text = 'Sorry, the model cannot answer this question'
    else:
        output_text = response['output']['message']['content'][0]['text']
    return output_text


def get_guardrail_topic(response):
    # Process guardrail response from Amazon Bedrock
    guardrail = response.get('trace', {}).get('guardrail', {})
    input_assessments = guardrail.get('inputAssessment', {}).get(guardrail_identifier, [])
    output_assessments = guardrail.get('outputAssessments', {}).get(guardrail_identifier, [])

    # Determine what topics triggered the guardrail
    guardrail_topics_raw_input = None
    guardrail_topics_raw_output = None
    if input_assessments:
        guardrail_topics_raw_input = input_assessments.get('topicPolicy', {}).get('topics')
    if output_assessments:
        guardrail_topics_raw_output = output_assessments[0].get('topicPolicy', {}).get('topics')
    guardrail_topics = []
    if guardrail_topics_raw_input:
        for guardrail_topic in guardrail_topics_raw_input:
            guardrail_topics.append(guardrail_topic['name'])
    if guardrail_topics_raw_output:
        for guardrail_topic in guardrail_topics_raw_output:
            guardrail_topics.append(guardrail_topic['name'])
            
    return guardrail_topics