import boto3
import json
from dotenv import load_dotenv
import os


# loading in variables from .env file
load_dotenv()

# instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv('profile_name'))

bedrock = boto3.client('bedrock-runtime', 'us-east-1')
bedrock_agent_runtime = boto3.client('bedrock-agent-runtime','us-east-1')

# getting the knowledge base id from the env variable
knowledge_base_id = os.getenv('knowledge_base_id')  

def get_contexts(query, kbId, numberOfResults=5):
    """
    This function takes a query, knowledge base id, and number of results as input, and returns the contexts for the query.
    :param query: This is the natural language query that is passed in through the app.py file.
    :param kbId: This is the knowledge base id that is gathered from the .env file.
    :param numberOfResults: This is the number of results that are returned from the knowledge base.
    :return: The contexts for the query.
    """
    # getting the contexts for the query from the knowledge base
    results = bedrock_agent_runtime.retrieve(
        retrievalQuery= {
            'text': query
        },
        knowledgeBaseId=kbId,
        retrievalConfiguration= {
            'vectorSearchConfiguration': {
                'numberOfResults': numberOfResults
            }
        }
    )
    #  creating a list to store the contexts
    contexts = []
    #   adding the contexts to the list
    for retrievedResult in results['retrievalResults']: 
        contexts.append(retrievedResult['content']['text'])
    #  returning the contexts
    return contexts


def answer_query(user_input):
    """
    This function takes the user question, queries Amazon Bedrock KnowledgeBases for that question,
    and gets context for the question.
    Once it has the context, it calls the LLM for the response
    :param user_input: This is the natural language question that is passed in through the app.py file.
    :return: The answer to your question from the LLM based on the context from the Knowledge Bases.
    """
    # Setting primary variables, of the user input
    userQuery = user_input
    # getting the contexts for the user input from Bedrock knowledge bases
    userContexts = get_contexts(userQuery, knowledge_base_id)

    # Configuring the Prompt for the LLM
    # TODO: EDIT THIS PROMPT TO OPTIMIZE FOR YOUR USE CASE
    prompt_data = """
    You are a Question and answering assistant and your responsibility is to answer user questions based on provided context
    
    Here is the context to reference:
    <context>
    {context_str}
    </context>

    Referencing the context, answer the user question
    <question>
    {query_str}
    </question>
    """

    # formatting the prompt template to add context and user query
    formatted_prompt_data = prompt_data.format(context_str=userContexts, query_str=userQuery)

    # Configuring the model parameters, preparing for inference
    # TODO: TUNE THESE PARAMETERS TO OPTIMIZE FOR YOUR USE CASE
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
                        "text": formatted_prompt_data
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