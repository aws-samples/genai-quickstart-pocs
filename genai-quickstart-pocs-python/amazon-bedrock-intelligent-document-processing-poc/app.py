import streamlit as st

# Set page header
st.set_page_config(
    page_title="IDP POC"
)

# Title displayed on the streamlit web app
st.title(f""":rainbow[Intelligent Document Processing with Amazon Textract, Comprehend, and Bedrock]""")

# Provide IDP options for user to select from in menu
st.markdown(
    """
    This POC is powered by a Streamlit frontend, an open-source app framework built for
    Machine Learning and Data Science projects, along with various Generative AI functionalities powered by Amazon Bedrock.
    👈 A typical intelligent document processing (IDP) pipeline consists of the following steps in the menu to the right:
    - **🪣 Upload your documents to an Amazon S3 bucket for processing.**
    - **🔎 Extract text content from your documents using Amazon Textract.**
    - **📝 Perform document enrichment and grammar correction using Amazon Bedrock.**
    - **🔤 Extract entities and relationships from your documents using Amazon Comprehend.**
    - **📘 Perform document classification using Amazon Bedrock.**
    - **✍️ Summarize your document with Amazon Bedrock.**
    - **💬 Chat with your document with Amazon Bedrock.**
"""
)




