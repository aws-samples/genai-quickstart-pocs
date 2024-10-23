import streamlit as st
import re 
from idp.bedrock_utils import bedrock_enrichment

from botocore.exceptions import ClientError

# Streamlit app title
st.title(f""":rainbow[Document Enrichment with Amazon Bedrock]""")
st.write(f"""Perform grammar correction on the extracted key-value pairs by clicking the button below. The enriched output will be saved to the local "output" folder.""")

# Read the local key_value text file to use as part of the prompt.
try:
    with open("output/key_value.txt", "r") as file:
        prompt = file.read()
# Print error message if file not found.
except FileNotFoundError:
    st.error("File 'output/extracted_text.txt' not found.")
    st.stop()

# Button to invoke the model
if st.button("Enrich document contents", type='primary'):
    with st.spinner("Processing document..."):
        try:
            response_text = bedrock_enrichment(prompt)
            st.write(response_text)
            # Use regex to extract the "Corrected term" from the model response
            corrected_terms = re.findall(r"Corrected term: (.*?),", response_text)
            # Write the corrected and enriched terms to a new local file
            with open("output/enriched_output.txt", "w") as output_file:
                for term in corrected_terms:
                    output_file.write(term + "\n")
            # Display a success message upon completion
            st.success("Corrected terms saved to 'output/enriched_output.txt'.")
        # Handle exceptions
        except (ClientError, Exception) as e:
            st.error(f"ERROR: Can't invoke invoke'. Reason: {e}")
