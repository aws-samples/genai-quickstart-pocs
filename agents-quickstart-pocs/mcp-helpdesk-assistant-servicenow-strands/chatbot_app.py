"""
ServiceNow Chatbot Streamlit App

A modern chatbot interface for ServiceNow incident management
"""

import streamlit as st
import json
from datetime import datetime
from chatbot_agent import chatbot
from config import CHATBOT_CONFIG


def initialize_session_state():
    """Initialize session state variables"""
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "chatbot_initialized" not in st.session_state:
        st.session_state.chatbot_initialized = False


def main():
    """Main Streamlit app"""
    st.set_page_config(
        page_title="Enterprise IT Helpdesk Assistant",
        page_icon="🛠️",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Initialize session state
    initialize_session_state()
    
    # Custom CSS for better styling
    st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 1rem;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        border-left: 4px solid;
    }
    .user-message {
        background-color: #e3f2fd;
        border-left-color: #2196f3;
    }
    .assistant-message {
        background-color: #f3e5f5;
        border-left-color: #9c27b0;
    }
    .sidebar-header {
        font-size: 1.2rem;
        font-weight: bold;
        color: #1f77b4;
        margin-bottom: 1rem;
    }
    .quick-action {
        background-color: #f0f2f6;
        padding: 0.5rem;
        border-radius: 0.3rem;
        margin-bottom: 0.5rem;
        cursor: pointer;
        border: 1px solid #ddd;
    }
    .quick-action:hover {
        background-color: #e0e0e0;
    }
    </style>
    """, unsafe_allow_html=True)
    
    # Header
    st.markdown('<h1 class="main-header">🛠️ ServiceNow Helpdesk Assistant</h1>', unsafe_allow_html=True)
    st.markdown("---")
    
    # Sidebar
    with st.sidebar:
        st.markdown('<div class="sidebar-header">Quick Actions</div>', unsafe_allow_html=True)
        
        # Quick action buttons
        if st.button("📊 View Incident Trends", use_container_width=True):
            st.session_state.messages.append({"role": "user", "content": "Show me recent incident trends and analysis"})
            st.session_state.messages.append({"role": "assistant", "content": chatbot.analyze_trends()})
            st.rerun()
        
        if st.button("🔍 Search Recent Incidents", use_container_width=True):
            st.session_state.messages.append({"role": "user", "content": "Show me recent incidents"})
            st.session_state.messages.append({"role": "assistant", "content": chatbot.process_message("Show me recent incidents")})
            st.rerun()
        
        if st.button("📚 Search Knowledge Base", use_container_width=True):
            st.session_state.messages.append({"role": "user", "content": "Search knowledge base for common solutions"})
            st.session_state.messages.append({"role": "assistant", "content": chatbot.process_message("Search knowledge base for common solutions")})
            st.rerun()
        
        st.markdown("---")
        
        # Conversation management
        st.markdown('<div class="sidebar-header">Conversation</div>', unsafe_allow_html=True)
        
        if st.button("🗑️ Clear Chat", use_container_width=True):
            st.session_state.messages = []
            chatbot.clear_conversation_history()
            st.rerun()
        
        if st.button("💾 Save Conversation", use_container_width=True):
            filename = chatbot.save_conversation()
            st.success(f"Conversation saved to {filename}")
        
        st.markdown("---")
        
        # Help section
        st.markdown('<div class="sidebar-header">Help</div>', unsafe_allow_html=True)
        
        with st.expander("What can I do?"):
            st.markdown("""
            **I can help you with:**
            
            🔧 **Incident Management**
            - Create new incidents
            - Search existing incidents
            - Update incident details
            - Get incident information
            
            📊 **Analytics & Trends**
            - View incident trends
            - Analyze patterns
            - Generate reports
            
            📚 **Knowledge & Solutions**
            - Search knowledge base
            - Find solutions
            - Get troubleshooting help
            
            **Example commands:**
            - "Create an incident for email system down"
            - "Search for incidents related to VPN"
            - "Update incident INC0012345 status to resolved"
            - "Show me trends from last week"
            """)
        
        with st.expander("About"):
            st.markdown("""
            **ServiceNow Helpdesk Assistant**
            
            Powered by:
            - Strands Agents
            - ServiceNow MCP Server
            - AWS Bedrock (Claude)
            
            Version: 1.0.0
            """)
    
    # Main chat area
    col1, col2 = st.columns([3, 1])
    
    with col1:
        # Display chat messages
        for message in st.session_state.messages:
            if message["role"] == "user":
                st.markdown(f"""
                <div class="chat-message user-message">
                    <strong>👤 You:</strong><br>
                    {message["content"]}
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="chat-message assistant-message">
                    <strong>🤖 Assistant:</strong><br>
                    {message["content"]}
                </div>
                """, unsafe_allow_html=True)
        
        # Chat input
        with st.container():
            user_input = st.chat_input("Type your message here...")
            
            if user_input:
                # Add user message
                st.session_state.messages.append({"role": "user", "content": user_input})
                
                # Get bot response
                with st.spinner("🤖 Assistant is thinking..."):
                    bot_response = chatbot.process_message(user_input)
                
                # Add bot response
                st.session_state.messages.append({"role": "assistant", "content": bot_response})
                
                # Rerun to update the display
                st.rerun()
    
    with col2:
        # Quick templates
        st.markdown("### 💡 Quick Templates")
        
        templates = [
            "Create incident for email system down",
            "Search incidents related to VPN",
            "Show me recent trends",
            "Find solutions for password reset",
            "Update incident status",
            "Search knowledge base"
        ]
        
        for template in templates:
            if st.button(template, key=f"template_{template}", use_container_width=True):
                st.session_state.messages.append({"role": "user", "content": template})
                st.session_state.messages.append({"role": "assistant", "content": chatbot.process_message(template)})
                st.rerun()
    
    # Footer
    st.markdown("---")
    st.markdown(
        "<div style='text-align: center; color: #666; font-size: 0.8rem;'>"
        "ServiceNow Helpdesk Assistant | Powered by Strands Agents & MCP"
        "</div>",
        unsafe_allow_html=True
    )


if __name__ == "__main__":
    main() 