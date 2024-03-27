import boto3
import os
from dotenv import load_dotenv
import json

# loading in environment variables
load_dotenv()
# setting default session with AWS CLI Profile
boto3.setup_default_session(profile_name=os.getenv('profile_name'))


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
    # Setup Bedrock client
    bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')
    # configure model specifics such as specific model
    modelId = 'anthropic.claude-v2'
    accept = 'application/json'
    contentType = 'application/json'
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
    body = json.dumps({"prompt": prompt_data,
                       "max_tokens_to_sample": 8191,
                       "temperature": 0,
                       "top_k": 250,
                       "top_p": 0.5,
                       "stop_sequences": []
                       })
    # Invoking the bedrock model with your specifications
    response = bedrock.invoke_model(body=body,
                                    modelId=modelId,
                                    accept=accept,
                                    contentType=contentType)
    # the body of the response that was generated
    response_body = json.loads(response.get('body').read())
    # retrieving the specific completion field, where you answer will be
    answer = response_body.get('completion')
    # returning the answer as a final result, which ultimately gets returned to the end user
    return answer
