import streamlit as st

# Import pages
welcome_page = st.Page("pages/welcome.py", title="Welcome", icon="👋")
upload_page = st.Page("pages/upload_doc_to_s3.py", title="Step 1: Upload Document to S3", icon="🪣")
textract_page = st.Page("pages/extract_text_with_textract.py", title="Step 2: Analyze Document with Textract", icon="🔎")
enrichment_page = st.Page("pages/enrich_doc_with_bedrock.py", title="Step 3: Document Enrichment with Bedrock", icon="📝")
comprehend_page = st.Page("pages/entity_recognition_with_comprehend.py", title="Step 4: Extract Entities with Comprehend", icon="🔤")
classification_page = st.Page("pages/classify_doc_with_bedrock.py", title="Step 5: Document Classification with Bedrock", icon="📘")
summarization_page = st.Page("pages/summarize_doc_with_bedrock.py", title="Step 6: Document Summarization with Bedrock", icon="✍️")
qa_page = st.Page("pages/doc_qa_with_bedrock.py", title="Step 7: Document Q&A with Bedrock", icon="💬")

# Set navigation bar
pg = st.navigation([welcome_page, upload_page, textract_page, enrichment_page, comprehend_page, classification_page, summarization_page, qa_page])
# Set page header
st.set_page_config(page_title="IDP POC")
# Run app
pg.run()