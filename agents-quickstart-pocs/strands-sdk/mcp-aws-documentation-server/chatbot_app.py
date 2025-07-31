import streamlit as st
from agent import query_aws_docs, query_aws_docs_simple

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

# If the user submits a prompt, display it and get the agent's response
if prompt:
    with st.chat_message("user"):
        st.markdown(prompt)
    
    with st.chat_message("assistant"):
        # Show a spinner while waiting for the agent's response
        with st.spinner("Looking up documentation..."):
            try:
                # Try the simple version first, then fallback to timeout version
                try:
                    response = query_aws_docs_simple(prompt)
                except:
                    # Fallback to timeout version
                    response = query_aws_docs(prompt, timeout_seconds=15)
                
                # Extract the text content from the response
                if hasattr(response, 'text'):
                    response_text = response.text
                elif hasattr(response, 'content'):
                    response_text = response.content
                elif hasattr(response, 'message'):
                    response_text = response.message
                elif hasattr(response, 'response'):
                    response_text = response.response
                elif hasattr(response, 'result'):
                    response_text = response.result
                else:
                    response_text = str(response)
                
                # Clean up the response text
                if response_text and isinstance(response_text, str):
                    # Remove any extra whitespace
                    response_text = response_text.strip()
                    # If response is empty or just whitespace, provide a fallback
                    if not response_text:
                        response_text = "I'm sorry, I couldn't find a specific answer to your question. Please try rephrasing your question or ask about a different AWS service."
                
                # Display the response
                st.markdown(response_text)
                
                # Add the user prompt and response to chat history
                st.session_state["history"].append((prompt, response_text))
                
            except Exception as e:
                error_message = f"Error: {e}"
                st.error(error_message)
                st.info("The AWS Documentation MCP Server may be experiencing issues. Please try again in a moment.")
                st.session_state["history"].append((prompt, error_message)) 