import boto3
import os
from dotenv import load_dotenv
import json

# loading in environment variables
load_dotenv()
# setting default session with AWS CLI Profile
boto3.setup_default_session(profile_name=os.getenv('profile_name'))
# Setup Bedrock client
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')


def kendraSearch(question):
    """
    Primary function that performs a kendra search, using the retrieve API and passes the kendra response into the
    invoke LLM function.
    :param question: The question the user inputs within app.py or the frontend
    :return: Returns the final response of the LLM that was created by the invokeLLM function
    """
    # initiating kendra client
    kendra = boto3.client('kendra')
    # performing the retrieve call against Kendra
    kendra_response = kendra.retrieve(
        IndexId=os.getenv('kendra_index'),  # Put INDEX in .env file
        QueryText=question,
        PageNumber=1,
        PageSize=15
    )
    # passing in the original question, and various kendra responses as context into the LLM
    return invokeLLM(question, kendra_response)


def invokeLLM(question, kendra_response):
    """
    This function takes in the question from the user, along with the Kendra responses as context to generate an answer
    for the user on the frontend.
    :param question: The question the user is asking that was asked via the frontend input text box.
    :param kendra_response: The response from the Kendra document retrieve query, used as context to generate a better
    answer.
    :return: Returns the final answer that will be provided to the end-user of the application who asked the original
    question.
    """
    # prompt that is passed into the LLM with the Kendra Retrieval context and question
    # TODO: FEEL FREE TO EDIT THIS PROMPT TO CATER TO YOUR USE CASE
    prompt_data = f"""\n\nHuman:    
Answer the following question to the best of your ability based on the context provided.
Provide an answer and provide sources and the source link to where the relevant information can be found. Include this at the end of the response
Do not include information that is not relevant to the question.
Only provide information based on the context provided, and do not make assumptions
Only Provide the source if relevant information came from that source in your answer
Use the provided examples as reference
###
Question: {question}

Context: {kendra_response}

###

\n\nAssistant:

"""
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
                        "text": prompt_data
                    }
                ]
            }
        ]
    }
    # formatting the prompt as a json string
    json_prompt = json.dumps(prompt)
    # invoking Claude3, passing in our prompt
    response = bedrock.invoke_model(body=json_prompt, modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                                    accept="application/json", contentType="application/json")
    # getting the response from Claude3 and parsing it to return to the end user
    response_body = json.loads(response.get('body').read())
    # the final string returned to the end user
    answer = response_body['content'][0]['text']
    # returning the final string to the end user
    return answer
