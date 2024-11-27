import streamlit as st
from amazon_bedrock_translation.translate import lst_langs, lst_models, transl_txt_bedrock, parse_xml
from amazon_bedrock_translation.file_manager import save_file, delete_file
from amazon_bedrock_translation.text_extractor import extract_text

# title of the streamlit page
st.title(f""":rainbow[Translation Helper]""")
st.subheader("Input a file, source language, and target language to view translation")

###############
# Sidebar UI #
###############

# List available languages
langs = lst_langs()

# Select a source and a target language
st.sidebar.selectbox(
    label='Source Language',
    options=langs,
    index=langs.index(next(filter(lambda n: n.get('LanguageCode') == 'en', langs))),
    format_func=lambda lang: f"{lang['LanguageName']} ({lang['LanguageCode']})",
    key='src_lang'
)

st.sidebar.selectbox(
    label='Target Language',
    options=langs,
    index=langs.index(next(filter(lambda n: n.get('LanguageCode') == 'es', langs))),
    format_func=lambda lang: f"{lang['LanguageName']} ({lang['LanguageCode']})",
    key='tgt_lang'
)

# List Anthropic models
models = lst_models()

st.sidebar.selectbox(
    label='Model',
    options=models,
    index=models.index(next(filter(lambda n: n.get('modelId') == 'anthropic.claude-3-haiku-20240307-v1:0', models))),
    format_func=lambda model: model['modelId'].split(".")[1],
    key='model'
)




###########
# File UI #
###########


# Prompt user for input
uploaded_file = st.file_uploader("Choose a text file", type=["txt", "pdf", "docx", "doc"])

if uploaded_file is not None:
    # Read the contents of the uploaded file
    file_path = save_file(uploaded_file)
    file_contents = extract_text(file_path)
    delete_file(file_path)
    with st.expander("Extracted text from file", expanded=False):
        st.write(file_contents)
    with st.spinner('Translating...'):
        # Translate user prompt Amazon Bedrock
        translate_output = transl_txt_bedrock(
            file_contents,
            st.session_state.src_lang['LanguageCode'],
            st.session_state.tgt_lang['LanguageCode'],
            st.session_state.model['modelId']
        )
        

        # Display response
        with st.expander("Translated text", expanded=True):
            st.write(translate_output)


