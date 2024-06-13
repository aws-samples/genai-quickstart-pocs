import boto3
import os
from dotenv import load_dotenv

# loading in variables from .env file
load_dotenv()

# instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')

def conversation_orchestrator(bedrock, model_id, system_prompts, messages):
    """
    Orchestrates the conversation between the user and the model.
    Args:
        bedrock: The Amazon Bedrock Runtime Client Object.
        model_id: The specific model to use for the conversation.
        system_prompts: The system prompts to use for the conversation.
        messages: A list of messages to send to the model that helps preserve context along with the latest message.

    Returns: The response from the model that answers the user's question and retains the context of previous question/answer
    pairs.

    """
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

# Instantiate a messages list to store the conversation history
messages = []

def invoke_model(message):
    """
    Invokes the model to generate a response to a user's question.
    Args:
        message: The user's question.

    Returns: The model's response to the user's question.

    """
    # Define the system prompts to guide the model's behavior, and set the general direction of the models role.
    system_prompts = [{"text": "You are a helpful assistant."}]
    # Format the user's message as a dictionary with role and content
    message = {"role": "user", "content": [{"text": message}]}
    # Append the formatted user message to the list of messages.
    messages.append(message)
    # Invoke the conversation orchestrator to get the model's response.
    response = conversation_orchestrator(bedrock, "anthropic.claude-3-sonnet-20240229-v1:0", system_prompts, messages)
    # Extract the output message from the response.
    output_message = response['output']['message']
    # Append the output message to the list of messages.
    messages.append(output_message)
    # Return the text of the model's response to the frontend
    return output_message['content'][0]['text']

