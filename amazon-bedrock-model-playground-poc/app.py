import streamlit as st
from model_invoker import orchestrator

# Title displayed on the streamlit web app
st.title(f""":rainbow[Amazon Bedrock Gen AI Model Playground]""")
# configuring values for session state
if "messages" not in st.session_state:
    st.session_state.messages = []
# writing the message that is stored in session state
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
# Putting a sidebar in with a select box to select the LLM that you want to use
model_id = st.sidebar.selectbox("Select a model", ['anthropic.claude-instant-v1', 'anthropic.claude-v2', 'anthropic.claude-v2:1',
         'anthropic.claude-3-haiku-20240307-v1:0',
         'anthropic.claude-3-sonnet-20240229-v1:0',
         'mistral.mistral-7b-instruct-v0:2',
         'mistral.mixtral-8x7b-instruct-v0:1',
         'mistral.mistral-large-2402-v1:0',
         'meta.llama2-13b-chat-v1',
         'meta.llama2-70b-chat-v1',
         'meta.llama3-8b-instruct-v1:0',
         'meta.llama3-70b-instruct-v1:0',
         'cohere.command-text-v14',
         'cohere.command-light-text-v14',
         'amazon.titan-text-lite-v1',
         'amazon.titan-text-express-v1',
         'ai21.j2-mid-v1',
         'ai21.j2-ultra-v1'
         ])
# evaluating st.chat_input and determining if a question has been input
if question := st.chat_input("Ask me about anything...but actually...anything..."):
    # with the user icon, write the question to the front end
    with st.chat_message("user"):
        # writing the question to the front end
        st.markdown(question)
    # append the question and the role (user) as a message to the session state
    st.session_state.messages.append({"role": "user",
                                      "content": question})
    # respond as the assistant with the answer
    with st.chat_message("assistant"):
        # making sure there are no messages present when generating the answer
        message_placeholder = st.empty()
        # putting a spinning icon to show that the query is in progress
        with st.status("Determining the best possible answer!", expanded=False) as status:
            # passing the question into the orchestrator, which then invokes the appropriate LLM
            answer = orchestrator(question, model_id)
            # writing the answer to the front end
            message_placeholder.markdown(f"{answer}")
            # showing a completion message to the front end
            status.update(label="Question Answered...", state="complete", expanded=False)
    # appending the results to the session state
    st.session_state.messages.append({"role": "assistant",
                                      "content": answer})