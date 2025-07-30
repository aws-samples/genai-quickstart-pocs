"""
UI components for the EMR Log Analytics Chatbot
"""

import streamlit as st
import pandas as pd
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def apply_dark_mode():
    """Apply dark mode CSS if enabled"""
    st.markdown("""
    <style>
    .stApp {
        background-color: #0e1117;
        color: #fafafa;
    }
    .stMarkdown, .stText, .stCode {
        color: #fafafa;
    }
    .stButton>button {
        background-color: #262730;
        color: #fafafa;
        border: 1px solid #4e4e4e;
    }
    .stTextInput>div>div>input {
        background-color: #262730;
        color: #fafafa;
    }
    .stSelectbox>div>div>div {
        background-color: #262730;
        color: #fafafa;
    }
    </style>
    """, unsafe_allow_html=True)


def render_sidebar(bedrock_models, state):
    """Render the sidebar with configuration options"""
    st.sidebar.header("⚙️ Configuration")

    # Dark mode toggle
    dark_mode = st.sidebar.toggle("🌙 Dark Mode", value=state.dark_mode)
    if dark_mode != state.dark_mode:
        state.dark_mode = dark_mode
        st.rerun()

    # AWS Configuration Check
    st.sidebar.subheader("AWS Setup")

    try:
        import boto3
        session = boto3.Session()
        credentials = session.get_credentials()
        if credentials:
            st.sidebar.success("✅ AWS credentials configured")
            state.aws_configured = True

            # Use .env file as primary source for region
            env_region = os.getenv('AWS_DEFAULT_REGION')
            available_regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1']

            # Pre-select based on .env file
            default_index = 0
            if env_region and env_region in available_regions:
                default_index = available_regions.index(env_region)

            selected_region = st.sidebar.selectbox(
                "AWS Region",
                available_regions,
                index=default_index,
                help="Select AWS region for EMR and Bedrock services"
            )

            st.sidebar.info(f"📍 Using Region: {selected_region}")
            return selected_region, True
        else:
            st.sidebar.error("❌ AWS credentials not found")
            state.aws_configured = False
            return None, False
    except Exception as e:
        st.sidebar.error(f"❌ AWS configuration error: {str(e)}")
        state.aws_configured = False
        return None, False

    # Bedrock Configuration (only show if AWS is configured)
    if state.aws_configured:
        st.sidebar.subheader("Amazon Bedrock")
        # Model selection removed for simplicity
        pass


def render_findings_visualization(findings):
    """Render visualizations for findings data"""
    if not findings:
        return

    # Display metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Issues", len(findings))
    with col2:
        st.metric("Total Occurrences", sum(f.get('occurrence_count', 0) for f in findings))
    with col3:
        st.metric("Most Frequent", findings[0].get('matched_keyword', 'N/A') if findings else "N/A")

    # Display table
    table_data = []
    for f in findings:
        table_data.append({
            'Issue ID': f.get('issue_id', 'N/A'),
            'Error Pattern': f.get('matched_keyword', 'Unknown'),
            'Occurrences': f.get('occurrence_count', 0)
        })
    display_df = pd.DataFrame(table_data)
    st.dataframe(display_df, use_container_width=True)

    # Create visualization
    st.subheader("Issue Distribution")
    chart_data = {f.get('matched_keyword', 'Unknown'): f.get('occurrence_count', 0) for f in findings}
    st.bar_chart(chart_data)

    # Sample data
    st.subheader("Sample Log Entries - Top 3 Issue Types")
    for finding in findings[:3]:
        keyword = finding.get('matched_keyword', 'Unknown')
        count = finding.get('occurrence_count', 0)
        sample = finding.get('sample_data', 'No sample available')
        with st.expander(f"{keyword} ({count} times)"):
            st.code(sample, language='text')


def render_mcp_verification(result):
    """Render MCP verification information"""
    # Show documentation results used in analysis
    if result.get('documentation_results'):
        with st.expander("📚 AWS Documentation Used in Analysis"):
            st.write("**Official AWS Documentation Consulted:**")
            for doc in result.get('documentation_results', [])[:3]:
                st.write(f"📄 **{doc['title']}**")
                st.write(f"   📝 {doc['summary']}")
                st.write(f"   🔗 [View Documentation]({doc['url']})")


def render_chat_messages(messages):
    """Render chat message history"""
    for message in messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])


def render_progress_bar(progress_value, message):
    """Render a progress bar with the given value and message"""
    progress_bar = st.progress(progress_value, text=message)
    return progress_bar
