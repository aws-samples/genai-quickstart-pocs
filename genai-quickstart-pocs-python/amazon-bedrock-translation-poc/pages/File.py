import streamlit as st
from amazon_bedrock_translation import lst_langs, lst_models, transl_txt_bedrock, parse_xml

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

st.sidebar.markdown("""
### What is the purpose of this demo?                    

This is a simple app powered by Streamlit that 1/ takes in a file 2/ translates it to a target language using Amazon Bedrock 
            
""")

###########
# Chat UI #
###########

# Initialize history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Prompt user for input
uploaded_file = st.file_uploader("Choose a text file", type=["txt"])

if uploaded_file is not None:
    # Read the contents of the uploaded file
    file_contents = uploaded_file.getvalue().decode("utf-8")
    st.write(file_contents)

    # Translate user prompt Amazon Bedrock
    translate_output = transl_txt_bedrock(
        file_contents,
        st.session_state.src_lang['LanguageCode'],
        st.session_state.tgt_lang['LanguageCode'],
        st.session_state.model['modelId']
    )
    
    bedrock_translation=parse_xml(translate_output, "translated_text")

    # Display response
    st.text_area("Bedrock Translation:", str(bedrock_translation), height=200)

    #Add messages to chat history
    st.session_state.messages.append(
        {
            "role": "user",
            "content": file_contents,
            "bedrock_translation": bedrock_translation
        }
    )

