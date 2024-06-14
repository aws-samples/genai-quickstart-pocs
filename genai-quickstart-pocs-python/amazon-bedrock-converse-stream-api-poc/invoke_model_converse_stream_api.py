import boto3
import os
from dotenv import load_dotenv

# loading in variables from .env file
load_dotenv()

# instantiating the Bedrock client, and passing in the CLI profile
boto3.setup_default_session(profile_name=os.getenv("profile_name"))
bedrock = boto3.client('bedrock-runtime', 'us-east-1', endpoint_url='https://bedrock-runtime.us-east-1.amazonaws.com')

# Instantiate a messages list to store the conversation history
messages = []

def stream_conversation(message):
    """
    Sends messages to a model and streams back the response.
    Args:
        messages: A list of messages to send to the model that helps preserve context along with the latest message.
        
    Returns:
        Nothing.

    """
    # Set the temperature for the model inference, controlling the randomness of the responses.
    temperature = 0.5
    # Set the top_k parameter for the model inference, determining how many of the top predictions to consider.
    top_k = 200
    # Create the inference configuration dictionary with the temperature setting.
    inference_config = {"temperature": temperature}
    # Additional inference parameters to use, including the top_k setting.
    additional_model_fields = {"top_k": top_k}
    # The specific model to use for the conversation.
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0"

    # Define the system prompts to guide the model's behavior, and set the general direction of the models role.
    system_prompts = [{"text": "You are a helpful assistant."}]
    
    # Format the user's message as a dictionary with role and content
    message = {
        "role": "user",
        "content": [{"text": message}]
    }
    
    # Append the formatted user message to the list of messages.
    messages.append(message)

    response = bedrock.converse_stream(
        modelId=model_id,
        messages=messages,
        system=system_prompts,
        inferenceConfig=inference_config,
        additionalModelRequestFields=additional_model_fields
    )

    stream = response.get('stream')
    
    # In a response, if a contentBlockDelta is detected, it triggers an iteration through the stream, creating a generator object going to the
    # frontend
    # looping through the response from the converse_stream api call
    if stream:
        
        # create a variable that will be used to store the streaming content so that we can later append it to the messages
        streaming_text = ""
        
        for event in stream:

            if 'messageStart' in event:
                print(f"\nRole: {event['messageStart']['role']}")

            if 'contentBlockDelta' in event:
                # using a generator object to stream the text to the streamlit front end.
                yield event['contentBlockDelta']['delta']['text']
                
                # Add the streaming chunks to our place holder
                streaming_text += event['contentBlockDelta']['delta']['text']

            if 'messageStop' in event:
                print(f"\nStop reason: {event['messageStop']['stopReason']}")
                
                # Construct the message for the next conversation turn
                message = {
                    "role": "assistant",
                    "content": [{"text": streaming_text}]
                }
                
                messages.append(message)

            if 'metadata' in event:
                # Print somme information regarging input and output tokesns as well as latency in ms
                metadata = event['metadata']
                if 'usage' in metadata:
                    print("\nToken usage")
                    print(f"Input tokens: {metadata['usage']['inputTokens']}")
                    print(
                        f":Output tokens: {metadata['usage']['outputTokens']}")
                    print(f":Total tokens: {metadata['usage']['totalTokens']}")
                if 'metrics' in event['metadata']:
                    print(
                        f"Latency: {metadata['metrics']['latencyMs']} milliseconds")
                    