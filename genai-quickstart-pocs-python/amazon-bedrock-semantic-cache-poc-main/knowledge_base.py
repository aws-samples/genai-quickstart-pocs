import json
from typing import List
import streamlit as st 
from utils import BEDROCK_CLIENT, BEDROCK_AGENT_CLIENT, KNOWLEDGE_BASE_ID
from botocore.exceptions import ClientError
import time

# Instantiate a messages list to store the conversation history
messages = []

# Retrieve relevant contexts from the knowledge base
def get_contexts(query: str, kb_id: str, number_of_results: int = 5) -> List[str]:
    
    results = BEDROCK_AGENT_CLIENT.retrieve(
        retrievalQuery={'text': query},
        knowledgeBaseId=kb_id,
        retrievalConfiguration={
            'vectorSearchConfiguration': {
                'numberOfResults': number_of_results
            }
        }
    )
    return [result['content']['text'] for result in results['retrievalResults']]

# Orchestrates the conversation between the user and the model
def conversation_orchestrator(bedrock, model_id, system_prompts, messages):

    # Set the temperature for the model inference, controlling the randomness of the responses.
    temperature = 0.5
    # Set the top_k parameter for the model inference, determining how many of the top predictions to consider.
    top_k = 200
    # Create the inference configuration dictionary with the temperature setting.
    inference_config = {"temperature": temperature}
    # Additional inference parameters to use, including the top_k setting.
    additional_model_fields = {"top_k": top_k}
    # Call the converse method of the Bedrock client object to get a response from the model.
    response = bedrock.converse(
        modelId=model_id,
        messages=messages,
        system=system_prompts,
        inferenceConfig=inference_config,
        additionalModelRequestFields=additional_model_fields
    )
    # Return the response from the model.
    return response

# Invokes the model to generate a response to a user's question
def invoke_model(message):

    # Define the system prompts to guide the model's behavior, and set the general direction of the models role.
    system_prompts = [{"text": "You are a Question and answering assistant and your responsibility is to answer user questions based on provided context."}]
    # Format the user's message as a dictionary with role and content
    message = {"role": "user", "content": [{"text": message}]}
    # Append the formatted user message to the list of messages.
    messages.append(message)
    # Invoke the conversation orchestrator to get the model's response.
    response = conversation_orchestrator(BEDROCK_CLIENT, st.session_state.textmodel['modelId'], system_prompts, messages)
    # Extract the output message from the response.
    output_message = response['output']['message']
    # Append the output message to the list of messages.
    messages.append(output_message)
    # Return the text of the model's response to the frontend
    return output_message['content'][0]['text']


# Generate an answer to the user's query using retrieved contexts
def answer_query(user_input: str) -> str:
    
    user_contexts = get_contexts(user_input, KNOWLEDGE_BASE_ID)

    prompt_template = """
    

    Here is the context to reference:
    <context>
    {context_str}
    </context>

    Referencing the context, answer the user question
    <question>
    {query_str}
    </question>
    """

    formatted_prompt = prompt_template.format(context_str=user_contexts, query_str=user_input)

    # Define the system prompts to guide the model's behavior, and set the general direction of the models role.
    system_prompts = [{"text": "You are a Question and answering assistant and your responsibility is to answer user questions based on provided context."}]
    # Format the user's message as a dictionary with role and content
    message = {"role": "user", "content": [{"text": formatted_prompt}]}
    # Append the formatted user message to the list of messages.
    messages.append(message)

    max_retries = 5
    initial_delay = 1

    for attempt in range(max_retries):
        try:
            # Invoke the conversation orchestrator to get the model's response.
            response = conversation_orchestrator(BEDROCK_CLIENT, "anthropic.claude-3-sonnet-20240229-v1:0", system_prompts, messages)
            # Extract the output message from the response.
            output_message = response['output']['message']
            # Append the output message to the list of messages.
            messages.append(output_message)
            # Return the text of the model's response to the frontend
            return output_message['content'][0]['text']
        except ClientError as e:
            if attempt == max_retries - 1:
                raise e
            delay = initial_delay * (2 ** attempt)
            print(f"Throttled. Retrying in {delay} seconds...")
            time.sleep(delay)