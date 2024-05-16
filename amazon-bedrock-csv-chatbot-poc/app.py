import streamlit as st
from pathlib import Path
import os
import time
from dotenv import load_dotenv
from csv_data_insights import chat_with_csv, csv_to_text, parse_xml

# load environment variables
load_dotenv()
# title of the streamlit app

st.set_page_config(page_title="Data Insights", page_icon=":tada", layout="wide")

# Headers
with st.container():
    st.title(f""":rainbow[Amazon Bedrock: CSV Data Insights]""")

# Streamlit workflow
uploaded_file = st.file_uploader("Choose a CSV file")

if uploaded_file is not None:
    file_name = uploaded_file.name
    st.write(file_name)
    csv_data = uploaded_file.read()

    #Ask for the subject so that it can be passed into to prompt when invoking model
    csv_subject = st.text_input("What is the subject of your csv file (provide 1-2 word answer if applicable)")


    analyze_button = st.button("Analyze CSV")
    if analyze_button:
        results = csv_to_text(csv_data, csv_subject)
        description = parse_xml(results, "description")
        insights = parse_xml(results, "insights")

        st.write(f"Description: {description}")       
        st.write(f"Insights:")
        st.write(insights)

    user_question = st.text_input("Ask a question about the CSV data")
    if user_question:
        response = chat_with_csv(csv_data, user_question, csv_subject)
        output = response[0]['text']
        output = output.replace('_', '')
        st.write(output)
