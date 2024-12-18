import streamlit as st
from amazon_translate_translation.pdf_translator import PDFTranslator


# title of the streamlit page
st.title(f""":rainbow[Translation Helper]""")
st.subheader("Upload a PDF and set the source and target language to generate a Amazon Translate translated PDF with similar formatting")
st.caption("Note: The PDF will be translated with Amazon Translate, not Amazon Bedrock LLM due to the complexity of extracting text and mapping the translated text back. To help keep the formatting, lots of small text chunks are rapidly translated and each mapped back to the origin text's location.")

translator = PDFTranslator()


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
            
            translations = translator.batch_translate(
                [pos['text'] for pos in text_positions],
                translator.languages[source_lang],
                translator.languages[target_lang],
                use_bedrock=False
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