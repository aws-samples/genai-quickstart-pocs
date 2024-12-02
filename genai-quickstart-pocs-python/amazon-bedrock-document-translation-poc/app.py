import streamlit as st
from document_translation.pdf_translator import PDFTranslator

st.title("PDF Form Translation")

translator = PDFTranslator()

translation_service = st.radio(
    "Translation Service",
    ["Amazon Translate", "Amazon Bedrock"],
    captions=["Fast machine translation", "AI-powered contextual translation"]
)

uploaded_file = st.file_uploader("Upload PDF form", type=['pdf'])

if uploaded_file:
    source_lang = st.selectbox(
        "Source Language",
        options=list(translator.languages.keys()),
        index=0
    )
    
    target_lang = st.selectbox(
        "Target Language",
        options=[lang for lang in translator.languages.keys() if lang != source_lang],
        index=0
    )
    
    if st.button("Translate"):
        with st.spinner("Processing..."):
            pdf_bytes = uploaded_file.read()
            text_positions = translator.extract_text_and_positions(pdf_bytes)
            
            use_bedrock = translation_service == "Amazon Bedrock"
            translations = translator.batch_translate(
                [pos['text'] for pos in text_positions],
                translator.languages[source_lang],
                translator.languages[target_lang],
                use_bedrock=use_bedrock
            )
            
            translated_pdf = translator.create_translated_pdf(
                pdf_bytes,
                text_positions,
                translations
            )
            
            st.download_button(
                "Download Translated PDF",
                translated_pdf,
                file_name=f"translated_{uploaded_file.name}",
                mime="application/pdf"
            )