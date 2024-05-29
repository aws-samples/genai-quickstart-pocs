import boto3
import json
from dotenv import load_dotenv
import os

# loading in variables from .env file
load_dotenv()
# getting the variables from the .env file for the guardrail identifier and guardrail version
guardrail_identifier = os.getenv("guardrail_identifier")
guardrail_version = os.getenv("guardrail_version")

# instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
def invoke_model(text):
    """
    This function is used to invoke the Claude3 model, while leveraging Amazon Bedrock Guardrails.
    :param text: This is the text that the user inserts on the frontend.
    :return: A natural language response to the question that the user inserted on the frontend.
    """
    # the system prompt is used as a default prompt, and is always passed into to the model
    # TODO: Edit the system prompt based on your specific use case
    system_prompt = """Answer every aspect of the provided question as thoroughly as possible. Be extremely thorough and provide detailed answers to the user provided question.
    """
    # this is the formatted prompt that contains both the system_prompt along with the text prompt that was inserted by the user.
    prompt = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0.5,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": text
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)
    # invoking Claude3, with Amazon Bedrock Guardrails passing in our prompt
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                                    guardrailIdentifier=guardrail_identifier, guardrailVersion=guardrail_version, accept="application/json",
                                    contentType="application/json")
    # getting the response from Claude3 and parsing it to return to the end user, if the response is blocked by the Guardrail,
    # then the Guardrail blocking message will be returned to the end user.
    response_body = json.loads(response.get('body').read())
    # the final string returned to the end user
    llm_output = response_body['content'][0]['text']
    # returning the final string to the end user
    return llm_output
