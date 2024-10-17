import boto3
import json
import streamlit as st
import re 

from botocore.exceptions import ClientError

# Initialize a Bedrock Runtime client in the AWS Region of your choice.
client = boto3.client("bedrock-runtime", region_name="us-west-2")

# Set the model ID, e.g., Claude 3 Sonnet.
model_id = "anthropic.claude-3-5-sonnet-20240620-v1:0"

# Streamlit app title
st.title(f""":rainbow[Document Enrichment with Amazon Bedrock]""")
st.write("Perform grammar correction of extracted key-value pairs by clicking the button below. The enriched output will be saved locally.")

# Read the local key_value text file to use as part of the prompt.
try:
    with open("key_value.txt", "r") as file:
        prompt = file.read()
# Print error message if file not found.
except FileNotFoundError:
    st.error("File 'extracted_text.txt' not found.")
    st.stop()

# Define the prompt and parameters for the model
body = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 4096,
    "temperature": 0,
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text", 
                    "text": '''These are key-value pairs extracted from a document uploaded to an S3 bucket, along with the Amazon Textract extraction confidence score. 
                              Perform grammar correction on the key and value pairs. Do not make assumptions. Do not perform a grammar correction if it is not needed.
                              Use the confidence scores to help guide you as some terms may be unique to the document. 
                              Print the original word, term, or number and its corrected version with an explanation, even if no correction was done. Each original and corrected word or number must be on a new line in your response. 
                              Do not not skip any keys or values in your response. Do not repeat the instructions in your response.
                              Use the following format: Original term: <word>, Corrected term: <corrected_word>, Reason: <reason>''' + prompt
                }
            ],
        }
    ],
}

# Convert the body to JSON for the API call
request = json.dumps(body)

# Button to invoke the model
if st.button("Enrich document contents", type='primary'):
    with st.spinner("Processing document..."):
        try:
            # Invoke the model with the request
            response = client.invoke_model(modelId=model_id, body=request)
            # Decode the response body upon completion
            model_response = json.loads(response["body"].read())
            # Extract and display the response text
            response_text = model_response["content"][0]["text"]
            st.write(response_text)
            # Use regex to extract the "Corrected term" from the model response
            corrected_terms = re.findall(r"Corrected term: (.*?),", response_text)
            # Write the corrected and enriched terms to a new local file
            with open("enriched_output.txt", "w") as output_file:
                for term in corrected_terms:
                    output_file.write(term + "\n")
            # Display a success message upon completion
            st.success("Corrected terms saved to 'enriched_output.txt'.")
        # Handle exceptions
        except (ClientError, Exception) as e:
            st.error(f"ERROR: Can't invoke '{model_id}'. Reason: {e}")
