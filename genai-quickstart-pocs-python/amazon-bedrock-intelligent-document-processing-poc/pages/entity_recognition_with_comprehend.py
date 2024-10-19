import os
import streamlit as st
from idp.comprehend_utils import detect_entities

# Streamlit app title
st.title(f""":rainbow[Extract Entities with Amazon Comprehend]""")
st.write("Detect built-in entities from the enriched document output using Amazon Comprehend's pre-trained model to identify entities such as names, places, organizations, and more.")

# Check if the new enriched outpt file exists
if 'output/enriched_output.txt' not in os.path.join('..', 'output', 'enriched_output.txt'):
    st.error("File 'output/enriched_output.txt' not found!")
else:
    # Read the file content
    with open("output/enriched_output.txt", "r") as file:
        text_content = file.read()
    # Button to invoke the Comprehend analysis
    if st.button("Extract entities", type='primary'):
        with st.spinner('Detecting entities...'):
            entities = detect_entities(text_content)
        # Display detected entities with bold formatting for titles
        if entities:
            st.subheader("Detected Entities:")
            for entity in entities:
                score_percentage = entity['Score'] * 100
                st.write(f"**Entity**: {entity['Text']}, **Type**: {entity['Type']}, **Confidence Score**: {score_percentage:.2f}%")
        else:
            st.write("No entities detected.")
