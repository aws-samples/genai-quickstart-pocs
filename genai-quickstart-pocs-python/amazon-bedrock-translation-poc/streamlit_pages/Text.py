import streamlit as st
from amazon_bedrock_translation.translate import lst_langs, lst_models, transl_txt_bedrock, analyze_responses, parse_xml

# title of the streamlit app
st.title(f""":rainbow[Translation Helper]""")
st.subheader("Input text, source language, and target language to view translation")

###############
# Sidebar UI #
###############

# List available languages
langs = lst_langs()

# Select a source language
st.sidebar.selectbox(
    label='Source Language',
    options=langs,
    index=langs.index(next(filter(lambda n: n.get('LanguageCode') == 'en', langs))),
    format_func=lambda lang: f"{lang['LanguageName']} ({lang['LanguageCode']})",
    key='src_lang'
)

# Select a target language
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

# Add a big red button to clear past messages
st.markdown("""
<style>
div.stButton > button:first-child {
    background-color: red;
    color: white;
}
</style>""", unsafe_allow_html=True)

if st.sidebar.button('Clear'):
    st.session_state.messages = []

#####################
# Text Translation #
#####################

# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# Prompt user for input
if prompt := st.chat_input():

    st.write("Prompt:", prompt)

    # Translate user prompt using Amazon Bedrock
    translate_output = transl_txt_bedrock(
        prompt,
        st.session_state.src_lang['LanguageCode'],
        st.session_state.tgt_lang['LanguageCode'],
        st.session_state.model['modelId']
    )
    
    # Analyze the responses
    analyze_output = analyze_responses(
        prompt,
        translate_output,
        st.session_state.model['modelId']
    )
    analysis=parse_xml(analyze_output, "analysis")

    # Display response
    st.text_area("Bedrock Translation:", str(translate_output), height=200)
    st.text_area("Analysis:", str(analysis), height=500)