import streamlit as st
import asyncio
from agent import query_aws_docs, query_aws_docs_streaming

# Set Streamlit page config and main title
st.set_page_config(page_title="AWS Docs Chatbot", page_icon="🤖")
st.title("AWS Documentation Chatbot 🤖")

# Sidebar: AWS logo, instructions, and centered Clear Chat button
with st.sidebar:
    st.image("https://docs.aws.amazon.com/assets/r/images/aws_logo_light.svg", width=200)
    st.header("Instructions")
    st.markdown("""
    - Ask any question about AWS documentation.
    - The bot will use the AWS Documentation MCP Server to answer.
    - Example: `How do I create an S3 bucket?`
    """)
    # Center the Clear Chat button using columns
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        if st.button("Clear Chat", type="primary"):
            st.session_state["history"] = []

# Initialize chat history in session state if not present
if "history" not in st.session_state:
    st.session_state["history"] = []

# Display chat history using chat bubbles (Streamlit 1.25+)
for i, (user_msg, bot_msg) in enumerate(st.session_state["history"]):
    with st.chat_message("user"):
        st.markdown(user_msg)
    with st.chat_message("assistant"):
        st.markdown(bot_msg)

# Chat input at the bottom of the page
prompt = st.chat_input("Type your question and press Enter...")

# Async handler for streaming agent responses to the UI
async def handle_streaming(prompt):
    streamed_response = ""
    response_placeholder = st.empty()
    # Show a spinner while waiting for the agent's response
    with st.spinner("Looking up documentation..."):
        try:
            # Stream each chunk as it arrives from the agent
            async for chunk in query_aws_docs_streaming(prompt):
                streamed_response += chunk
                response_placeholder.markdown(streamed_response)
        except Exception as e:
            streamed_response = f"Error: {e}"
            response_placeholder.markdown(streamed_response)
    # Add the user prompt and streamed response to chat history
    st.session_state["history"].append((prompt, streamed_response))

# If the user submits a prompt, display it and stream the agent's response
if prompt:
    with st.chat_message("user"):
        st.markdown(prompt)
    with st.chat_message("assistant"):
        asyncio.run(handle_streaming(prompt)) 