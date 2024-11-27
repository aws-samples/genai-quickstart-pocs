import streamlit as st
from amazon_bedrock_translation import lst_langs, lst_models, transl_chat_bedrock, parse_xml

# title of the streamlit page
st.title(f""":rainbow[Translation Helper]""")
st.subheader("Input chat messages and the chatbot will respond in the target language")

###############
# Sidebar UI #
###############

# List available languages
langs = lst_langs()

# select a target language
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

This is a simple chatbot powered by Streamlit that 1/ takes in user input 2/ answers in a target language using Amazon Bedrock
            
""")

#########
# Chat #
#########

# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []

# writing the message that is stored in session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Prompt user for input
if question := st.chat_input("Interact with the chatbot to receive a response in the target language"):

    # with the user icon, write the question to the front end
    with st.chat_message("user"):
        st.markdown(question)

    # append the question and the role (user) as a message to the session state
    st.session_state.messages.append({"role": "user",
                                      "content": question})
    
    # respond as the assistant with the answer
    with st.chat_message("assistant"):

        # making sure there are no messages present when generating the answer
        message_placeholder = st.empty()

        # putting a spinning icon to show that the query is in progress
        with st.spinner("Determining translated response"):

            # Translate user prompt Amazon Bedrock
            translate_output = transl_chat_bedrock(
                question,
                st.session_state.tgt_lang['LanguageCode'],
                st.session_state.model['modelId']
            )
    
            bedrock_translation=parse_xml(translate_output, "response")

            # Display the translation response
            message_placeholder.markdown(f""" {bedrock_translation} """)
                                         
            # appending the results to the session state
            st.session_state.messages.append({"role": "assistant",
                                      "content": bedrock_translation})