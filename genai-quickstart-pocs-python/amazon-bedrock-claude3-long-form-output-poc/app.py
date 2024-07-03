import boto3  # Import the Boto3 library for AWS services
import botocore  # Import the botocore library for AWS service configuration
import streamlit as st  # Import the Streamlit library for building web apps

# Import custom modules
from BedrockProcessor import BedrockProcessor
from typing import List
from utils import *

# Define system prompts and prompt templates
SYSTEM_PROMPT = """
You are a helpful AI assistant. You will be given instructions in the user input and generate contents based on this instructions. You have been designed to be robust and complete.
Only return the the response"""
TRANSLATE_SYSTEM_PROMPT = """
You are a language translator. Provided a document, you will translate the contents to user provided language. You have been designed to be robust and complete. 
Only return the translated content."""
PROMPT_TEMPLATE = """
Generate content for the topic provided in <topic> tags. There are multiplie iterations. Iteration number is provided in <iteration> tag. 
If iteration is not 0 then continue generating the content based on the previously generated content provided in the assistent role. 
For iteration 0 generate an absolute minimum of 4096 tokens. You have been designed to be robust and complete.
<topic>{user_input}</topic>
<iteration>{retries}</iteration>"""
TRANSLATE_PROMPT_TEMPLATE = """
Translate the following document in <document> tags based on the instructions in the <user_input> tags. There are muliple iterations of the call if the document is too large. 
Continue from where it was left in the previous iteration and provide only the continuation in the response. 
Each iteration should generate an absolute maximum of 4096 tokens unless input token is less than or equal to 4096. You have been designed to be robust and complete.
<document>{document}</document>
<user_input>{user_input}</user_input>
"""

# Configure AWS clients
config = botocore.config.Config(connect_timeout=500, read_timeout=500)  # Set timeouts for AWS clients
bedrock = boto3.client('bedrock', region_name='us-east-1')  # Create Bedrock client

# Set default values for parameters
document_processing_type = None
max_output_tokens = 50000
temperature = 0.2
top_p = 0.5
max_iterations = 10
prompt_file_name = './samples/long_form_prompt.txt'

# Configure Streamlit app
st.set_page_config(layout="wide")
st.sidebar.title(f"""Long Form Output""")

# Get available Anthropic models from Bedrock
models = bedrock.list_foundation_models(
    byProvider='Anthropic',
    byOutputModality='TEXT',
    byInferenceType='ON_DEMAND'
)

# Filter models to only include those with text and image input modalities
models_list = [x.get('modelId') for x in models['modelSummaries'] if x.get('inputModalities') == ['TEXT', 'IMAGE']]

# Create a sidebar widget to select the model
model_id = st.sidebar.selectbox(label='Model', options=models_list)

# Create a radio button to select the processing type
processing_type = st.sidebar.radio(label='Processing Type', 
                                   options=['Text Generation', 'Documents Processing'], 
                                   horizontal=True)

# Conditional logic based on the selected processing type
if processing_type.lower() == 'documents processing':
    document_type = st.sidebar.selectbox(label='Document Type', options=['PDF', 'Text'])  # Select document type
    document_processing_type = st.sidebar.selectbox(label="Document Processing Type", options=['Translate', 'Extract', 'Summarize'])  # Select document processing type
    document = st.sidebar.file_uploader("Choose a file")  # Upload a document
    system_prompt_template = TRANSLATE_SYSTEM_PROMPT if document_processing_type.lower() == 'translate' else SYSTEM_PROMPT  # Set system prompt template based on processing type
    prompt_template = TRANSLATE_PROMPT_TEMPLATE if document_processing_type.lower() == 'translate' else PROMPT_TEMPLATE  # Set prompt template based on processing type
    prompt_selection = ''
else:
    system_prompt_template = SYSTEM_PROMPT  # Set system prompt template for text generation
    prompt_template = PROMPT_TEMPLATE  # Set prompt template for text generation
    document = None  # No document for text generation
    document_type = None  # No document type for text generation
    document_processing_type = None  # No document processing type for text generation
    prompt_selection = st.sidebar.radio(label="Prompt Type", options=['Default Prompt', 'Enter a Prompt'], horizontal=True)  # Select prompt type

# Get the default prompt from a file or allow the user to enter a prompt
default_prompt = get_default_prompt(prompt_file_name) if prompt_selection.lower() == 'default prompt' else None
user_input = st.text_input(label="Enter a topic", value=default_prompt)  # Get user input or default prompt

# Create a button to generate the output
button = st.button("Generate")

# Process the request when the button is clicked
if button:
    bp = BedrockProcessor(system_prompt_template, prompt_template, iterations=max_iterations)  # Create a BedrockProcessor instance
    bp.clear_chat_history()  # Clear the chat history
    with st.status('Generating a response...', expanded=True, state="running") as status:  # Display a status message
        final_response, output_tokens, invocation_latency = bp.process_request(model_id, user_input, max_output_tokens, temperature, top_p, document, document_type, document_processing_type)  # Process the request
        total_output_tokens = total_tokens(output_tokens)  # Calculate the total output tokens
        st.markdown(final_response.split('~')[1])  # Display the final response
        for x, y in output_tokens:
            st.sidebar.markdown(f"Tokens in Iteration {x}: {y:,}")  # Display the number of tokens used in each iteration
        st.sidebar.markdown(f"Output Tokens used: {total_output_tokens:,}")  # Display the total output tokens used
        st.sidebar.markdown(f"Time Taken: {invocation_latency:,.2f} s")  # Display the time taken for the request
        if document is not None:
            del st.session_state['document']  # Remove the document from the session state
