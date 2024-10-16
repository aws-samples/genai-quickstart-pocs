import os
import json
import streamlit as st
import boto3
from dotenv import load_dotenv
import base64

# Load environment variables
load_dotenv()

# Get the bucket name from the .env file
bucket_name = os.getenv("save_folder")

# Initialize the S3 and Bedrock clients
s3_client = boto3.client("s3", region_name="us-east-1")
client = boto3.client("bedrock-runtime", region_name="us-west-2")

# Set the model ID, e.g., Claude 3.5 Sonnet.
model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"

# Streamlit app title
st.title(f""":rainbow[Document Q&A with Amazon Bedrock]""")
st.write("Select an option below to ask questions about the document using the enriched text output or with Amazon Bedrock's multimodal capabilities:")

# Ensure messages are stored in the session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Provide options to user for Q&A method
option = st.radio(
    "Choose Q&A method:",
    ('Ask questions about the document using contents from enriched_output.txt file', 
     'Ask questions about the document using multimodal model')
)

# Clear messages on screen if selectedoption changes
if st.session_state.messages and st.session_state.option != option:
    st.session_state.messages = []

# Store current option in session state
st.session_state.option = option

def list_files_in_s3(bucket):
    """
    This function is used to list the document objects from the S3 bucket that a user can select before sending to Textract
    :param bucket: S3 bucket name
    :return: List of objects in the S3 bucket
    """
    try:
        response = s3_client.list_objects_v2(Bucket=bucket)
        # Check if there are objects in bucket
        if 'Contents' in response:
            return [obj['Key'] for obj in response['Contents']]
        else:
            return []
    except Exception as e:
        st.error(f"An error occurred while listing files: {e}")
        return []
    
def encode_image_to_base64(bucket, image_key):
    """
    This function encodes the image to a base64 format to be analyzed by Bedrock's multimodal model
    :param bucket: The S3 bucket name
    :param image_key: The S3 image key
    :return: The encoded image
    """
    # Retrieve the image file from S3 and encode it in base64
    image_obj = s3_client.get_object(Bucket=bucket, Key=image_key)
    image_bytes = image_obj['Body'].read()
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    return encoded_image
    
# If user selected multimodal option, then list files from the S3 bucket above the chat history
if option == 'Ask questions about the document using multimodal model':
    # List files in S3 and allow user to select one
    files = list_files_in_s3(bucket_name)
    selected_file = st.selectbox("Select an image from S3 to process:", files)
    if selected_file:
         encoded_image = encode_image_to_base64(bucket_name, selected_file)

# Display the messages stored in session state 
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

def chat_with_bedrock(prompt):
    """
    This function performs Q&A using the enriched output text from the local file
    :param prompt: The enriched output text from the local file
    :return: The answer to the questionfrom the model
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "temperature": 0,
        "messages": [
            {
                "role": "user",
                "content": '''You are a conversational question-answering agent that will be provided with a document and a question. 
                        Answer the question only using information from the document. Do not include your rationale or any additional thoughts. Do not make assumptions. 
                        Here is the document and user question:''' + prompt,
            }
        ],
    }

    # Convert request to JSON for the API call
    request = json.dumps(body)
    # Call to Bedrock API to answer the question
    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=request
    )
    # Decode the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text
    response_text = model_response["content"][0]["text"]
    return response_text

def chat_with_multimodal(prompt, question):
    """
    This function performs Q&A using the multimodal capabilities of Bedrock, which will analyze the file in the
    S3 bucket as is (for ex.g., images, PDFs, etc.)
    :param prompt: The image in base64 format to be analyzed by the model
    :param question: The question to be asked about the document
    :return: The answer to the question from the model
    """
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": prompt,
                        },
                    },
                    {
                        "type": "text", 
                        "text": '''You are a conversational question-answering agent that will be provided with a document image and a question. 
                        Answer the question only using information from the document. Do not include your rationale or any additional thoughts. Do not make assumptions. 
                        Here is the document and user question:''' + question
                    }
                ],
            }
        ],
    }

   # Convert request to JSON for the API call
    request = json.dumps(body)
    # Call to Bedrock API to answer the question
    response = client.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=request
    )
    # Decode the response body
    model_response = json.loads(response["body"].read())
    # Extract and display the response text.
    response_text = model_response["content"][0]["text"]
    return response_text

# If user selected text option, then answer questions from the local file
if option == 'Ask questions about the document using contents from enriched_output.txt file':
    # Read the enriched document text from file
    with open("enriched_output.txt", "r", encoding="utf-8") as file:
        file_text = file.read()
    # Display chat input for user question
    if question := st.chat_input("Ask a question about the document..."):
        # Show the user's message
        with st.chat_message("user"):
            st.markdown(question)
        # Store the user message in session state
        st.session_state.messages.append({"role": "user", "content": question})
        # Generate the response from Bedrock
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            with st.status("Determining the best possible answer...", expanded=False) as status:
                combined_prompt = f"\nDocument:\n{file_text}\n\nQuestion:\n{question}"
                answer = chat_with_bedrock(combined_prompt)
                message_placeholder.markdown(answer)  # Display the response
                status.update(label="Question Answered...", state="complete", expanded=False)
        # Store the assistant's response in session state
        st.session_state.messages.append({"role": "assistant", "content": answer})

# If user selected multimodal option, then answer questions from the S3 bucket
elif option == 'Ask questions about the document using multimodal model':
    if selected_file:
         encoded_image = encode_image_to_base64(bucket_name, selected_file)
    # Display chat input for user question
    if question := st.chat_input("Ask a question about the document..."):
        # Show the user's message
        with st.chat_message("user"):
            st.markdown(question)
        # Store the user message in session state
        st.session_state.messages.append({"role": "user", "content": question})
        # Generate the response from Bedrock
        with st.chat_message("assistant"):
            message_placeholder = st.empty()  # Placeholder for response
            with st.status("Determining the best possible answer...", expanded=False) as status:
                prompt = f"Question:\n{question}"
                answer = chat_with_multimodal(encoded_image, prompt)
                message_placeholder.markdown(answer)  # Display the response
                status.update(label="Question Answered...", state="complete", expanded=False)
        # Store the assistant's response in session state
        st.session_state.messages.append({"role": "assistant", "content": answer})
