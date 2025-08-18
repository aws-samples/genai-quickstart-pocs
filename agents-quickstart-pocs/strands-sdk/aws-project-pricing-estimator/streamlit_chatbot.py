"""
streamlit_chatbot.py
--------------------
Streamlit web application for the AWS Pricing Agent Chatbot.

This app provides a chat interface for users to interact with a Strands agent
integrated with the AWS Pricing MCP server. It supports multi-line user input,
chat history, and dynamic UI/UX features for a modern chatbot experience.

Key Features:
- Agent initialization and MCP server management
- Multi-line chat input and history
- Customizable UI with AWS branding
- Cleaned and safe display of agent responses

Usage:
- Run with: streamlit run streamlit_chatbot.py
- Requires: pricing_agent.py, mcp_config.py, and all dependencies in requirements.txt
"""
import streamlit as st
import asyncio
import threading
from datetime import datetime
from pricing_agent import PricingAgentWithMCP
import re

# Page configuration
st.set_page_config(
    page_title="AWS Pricing Agent Chatbot",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .stTextArea textarea {
        font-family: 'Courier New', monospace;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }
    .user-message {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
    }
    .assistant-message {
        background-color: #f3e5f5;
        border-left: 4px solid #9c27b0;
    }
    .system-message {
        background-color: #fff3e0;
        border-left: 4px solid #ff9800;
    }
    .timestamp {
        font-size: 0.8rem;
        color: #666;
        margin-top: 0.5rem;
    }
    /* Style all buttons with yellow background */
    .stButton > button {
        background-color: #ffc107 !important;
        color: #212529 !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 10px 20px !important;
        font-weight: bold !important;
        transition: background-color 0.3s !important;
    }
    .stButton > button:hover {
        background-color: #e0a800 !important;
    }
    
    /* Specific styling for send button */
    .send-button {
        background-color: #b8860b !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 10px 20px !important;
        font-weight: bold !important;
        transition: background-color 0.3s !important;
        width: 100% !important;
        margin-left: auto !important;
        margin-right: 0 !important;
    }
    .send-button:hover {
        background-color: #daa520 !important;
    }
    .block-container h1:first-child {
        margin-top: 0 !important;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'messages' not in st.session_state:
    st.session_state.messages = []  # Stores chat history
if 'agent' not in st.session_state:
    st.session_state.agent = None   # Stores the agent instance
if 'mcp_connected' not in st.session_state:
    st.session_state.mcp_connected = False  # Tracks MCP connection status
if 'init_error' not in st.session_state:
    st.session_state.init_error = None  # Stores initialization errors

def clean_response_text(text):
    """
    Remove HTML tags and extra whitespace from agent responses.
    Args:
        text (str): The response text to clean.
    Returns:
        str: Cleaned response text.
    """
    if not text:
        return ""
    text = str(text)
    text = re.sub(r'<[^>]+>', '', text)  # Remove HTML tags
    text = re.sub(r'\n\s*\n', '\n\n', text)  # Remove extra blank lines
    text = text.strip()
    return text

def initialize_agent():
    """
    Initialize the PricingAgentWithMCP and attempt MCP connection.
    Returns:
        PricingAgentWithMCP or None: The initialized agent, or None on failure.
    Side Effects:
        Updates st.session_state with agent and connection status.
    """
    try:
        st.session_state.init_error = None
        agent = PricingAgentWithMCP()
        # Test agent with a simple query
        test_response = agent.ask("Hello")
        if test_response:
            # Try to connect to MCP server
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                mcp_connected = loop.run_until_complete(agent.ensure_mcp_connection())
                loop.close()
                if mcp_connected:
                    st.session_state.mcp_connected = True
            except Exception as e:
                print(f"Auto MCP connection failed: {e}")
            return agent
        else:
            st.session_state.init_error = "Agent initialized but failed to respond to test query"
            return None
    except Exception as e:
        st.session_state.init_error = f"Failed to initialize agent: {str(e)}"
        st.error(f"Initialization error: {e}")
        return None

def get_agent_response(agent, prompt):
    """
    Get a response from the agent for a given prompt.
    Args:
        agent (PricingAgentWithMCP): The agent instance.
        prompt (str): The user's question.
    Returns:
        str: The agent's response, cleaned of HTML.
    """
    try:
        # (Optional) Use MCP session if available
        if agent.mcp_session:
            pass  # Placeholder for future MCP-specific logic
        response = agent.ask(prompt)
        cleaned_response = clean_response_text(response)
        return cleaned_response
    except Exception as e:
        return f"Error getting response: {e}"

def display_message(message):
    """
    Render a chat message in the Streamlit UI with role-based styling.
    Args:
        message (dict): Contains 'role', 'content', and 'timestamp'.
    """
    timestamp = message["timestamp"]
    content = message["content"]
    if message["role"] == "user":
        st.markdown(f"""
        <div class="chat-message user-message">
            <strong>You:</strong><br>
            {content}
            <div class="timestamp">{timestamp}</div>
        </div>
        """, unsafe_allow_html=True)
    elif message["role"] == "assistant":
        st.markdown(f"""
        <div class="chat-message assistant-message">
            <strong>Agent:</strong><br>
        </div>
        """, unsafe_allow_html=True)
        st.write(content)
        st.markdown(f'<div class="timestamp">{timestamp}</div>', unsafe_allow_html=True)
    elif message["role"] == "system":
        st.markdown(f"""
        <div class="chat-message system-message">
            <strong>System:</strong><br>
            {content}
            <div class="timestamp">{timestamp}</div>
        </div>
        """, unsafe_allow_html=True)

def clean_existing_messages():
    """
    Clean all messages in session state to remove HTML tags.
    """
    for message in st.session_state.messages:
        if "content" in message:
            message["content"] = clean_response_text(message["content"])

# Clean messages on startup
if st.session_state.messages:
    clean_existing_messages()

# Sidebar: AWS logo, agent init, and chat controls
with st.sidebar:
    st.markdown('<div style="text-align:center;"><img src="https://docs.aws.amazon.com/assets/r/images/aws_logo_light.svg" width="200"></div>', unsafe_allow_html=True)
    st.markdown("---")
    # Agent initialization button
    if st.button("Initialize Agent", use_container_width=True):
        with st.spinner("Initializing agent..."):
            st.session_state.agent = initialize_agent()
            if st.session_state.agent:
                st.success("Agent initialized successfully!")
            else:
                st.error("Failed to initialize agent")
                if st.session_state.init_error:
                    st.error(f"Error: {st.session_state.init_error}")
    st.markdown("<br>", unsafe_allow_html=True)
    # Clear chat button
    if st.button("Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()

# Main chat interface
st.markdown("""
    <style>
    .block-container h1:first-child {
        margin-top: 0 !important;
    }
    </style>
""", unsafe_allow_html=True)
st.title("AWS Pricing Agent Chatbot")
st.markdown("Ask questions about AWS pricing and get intelligent responses powered by Strands Agents and MCP!")

# Display chat history
for message in st.session_state.messages:
    display_message(message)

# Input area for user prompt
st.subheader("💬 Ask a Question")

# Only show input if agent is initialized
if not st.session_state.agent:
    st.warning("⚠️ Please initialize the agent first using the 'Initialize Agent' button in the sidebar.")
    st.info("Once the agent is initialized, you'll be able to ask questions about AWS pricing.")
else:
    # Dynamic placeholder based on chat state
    if st.session_state.messages:
        placeholder_text = "Please make changes to your query or clear chat and ask your next question here"
    else:
        placeholder_text = "Create a cost analysis for a serverless application using API Gateway, Lambda, and DynamoDB. Assume 1 million API calls per month, average Lambda execution time of 200ms with 512MB memory, and 10GB of DynamoDB storage with 5 million read requests and 1 million write requests per month."
    user_input = st.text_area(
        "Enter your question about AWS pricing:",
        height=150,
        placeholder=placeholder_text
    )
    # Send button, right-aligned
    col1, col2, col3 = st.columns([3, 1, 1])
    with col3:
        st.markdown('<div style="text-align: right;">', unsafe_allow_html=True)
        send_button = st.button("✉️ Send", use_container_width=True, key="send_button")
        st.markdown('</div>', unsafe_allow_html=True)

# Add custom styling to the send button
st.markdown("""
<script>
document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.querySelector('button[data-testid="send_button"]');
    if (sendButton) {
        sendButton.classList.add('send-button');
    }
});
</script>
""", unsafe_allow_html=True)

# Handle user input and agent response
if st.session_state.agent and send_button and user_input.strip():
    # Add user message to chat history
    timestamp = datetime.now().strftime("%H:%M:%S")
    st.session_state.messages.append({
        "role": "user",
        "content": user_input,
        "timestamp": timestamp
    })
    # Get agent response
    with st.spinner("🧐 Thinking..."):
        response = get_agent_response(st.session_state.agent, user_input)
        # Add assistant response to chat
        timestamp = datetime.now().strftime("%H:%M:%S")
        st.session_state.messages.append({
            "role": "assistant",
            "content": response,
            "timestamp": timestamp
        })
    st.rerun()

# Info section for users
with st.expander("ℹ️ How to use this chatbot"):
    st.markdown("""
    ### Getting Started
    1. **Initialize Agent**: Click the "Initialize Agent" button in the sidebar
    2. **Ask Questions**: Type your AWS pricing questions in the text area
    3. **Get Responses**: The agent will provide intelligent responses based on AWS pricing knowledge
    ### Example Questions
    - "What are the pricing differences between EC2 instance types?"
    - "How does AWS pricing vary by region?"
    - "What are the cost optimization strategies for S3?"
    - "Compare pricing between on-demand and reserved instances"
    - "What factors affect AWS pricing?"
    ### Features
    - **Multi-line Input**: Support for detailed questions and context
    - **Chat History**: View previous conversations
    - **Status Monitoring**: Track agent status
    """)

# Footer with credits
st.markdown("---")
st.markdown(
    "Built with [Strands Agents](https://strandsagents.com) and [Streamlit](https://streamlit.io) | "
    "Powered by [AWS Pricing MCP Server](https://github.com/awslabs/mcp/tree/main/src/aws-pricing-mcp-server)"
) 