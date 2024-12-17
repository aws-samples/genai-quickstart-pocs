import streamlit as st
from amazon_bedrock_translation.translate import lst_langs, lst_models, transl_txt_bedrock, parse_xml
from amazon_bedrock_translation.file_manager import save_file, delete_file
from amazon_bedrock_translation.text_extractor import extract_text

# title of the streamlit page
st.title(f""":rainbow[Translation Helper]""")
st.subheader("Upload a PDF and set the source and target language to generate a Amazon Translate translated PDF with similar formatting")
st.caption("Note: The PDF will be translated with Amazon Translate, not Amazon Bedrock LLM due to the complexity of extracting text and mapping the translated text back. To help keep the formatting, lots of small text chunks are rapidly translated and each mapped back to the origin text's location.")
