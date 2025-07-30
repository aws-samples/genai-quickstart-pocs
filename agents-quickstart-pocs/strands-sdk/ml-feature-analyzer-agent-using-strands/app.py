"""ML Feature Analyzer - Main Streamlit Application"""

import streamlit as st
import traceback
from bedrock_processor import BedrockProcessor
from model_service import ModelService
from config import MODEL_INFO, APP_TITLE

# Page configuration
st.set_page_config(page_title=APP_TITLE, page_icon="📊", layout="wide")

# Initialize services with caching


@st.cache_resource
def get_bedrock_processor():
    return BedrockProcessor()


@st.cache_resource
def get_model_service():
    return ModelService()


bedrock_processor = get_bedrock_processor()
model_service = get_model_service()


# Initialize session state
if "messages" not in st.session_state:
    st.session_state.messages = []
if "analysis_started" not in st.session_state:
    st.session_state.analysis_started = False

# Title
st.title("🔬 Credit Risk ML Attribute Analyzer")
st.markdown("**Evaluate Premium Consumer Attributes to Improve Credit Decisioning Models**")

# Overview
st.markdown(
    """
**Overview:** Compare baseline and premium models to evaluate the business value of incremental premium attributes.
Run an analysis to compare performance or build a custom model with your selected attributes.
"""
)

# Model Cards Section
st.subheader("🏦 Credit Risk Benchmark Models")
st.markdown("Explore how premium attributes enhance loan approval accuracy:")

cols = st.columns(4)
for i, (model_type, info) in enumerate(MODEL_INFO.items()):
    with cols[i]:
        model_status = model_service.get_model_status(model_type)

        # Create expandable model card
        with st.expander(f"{info['icon']} {info['name']}", expanded=False):
            st.markdown(f"**{info['description']}**")
            st.markdown(f"**Attributes:** {len(info['attributes'])} total")

            if model_status["trained"]:
                # Visual indicator for data source
                if model_status["source"] == "sample":
                    st.info("📊 Using sample data - train models for live results")
                    st.markdown(f"**Sample AUC:** {model_status['auc']:.3f}")
                else:
                    st.success("✅ Live model results")
                    st.markdown(f"**Live AUC:** {model_status['auc']:.3f}")

                st.markdown("**Attributes Used:**")
                attrs_text = ", ".join(info["attributes"])
                st.markdown(f"{attrs_text}")
            else:
                st.warning("Model not trained yet")

# Analysis Section
st.markdown("---")
st.subheader("📊 Premium Attribute ROI Analysis")

if not st.session_state.analysis_started:
    st.markdown("Analyze ROI and performance improvements from premium attributes across model tiers.")

    if st.button("🚀 Run Analysis on Models", type="primary", use_container_width=True):
        # Initialize orchestrator
        with st.spinner("🤖 Initializing ML Analysis Orchestrator..."):
            bedrock_processor.initialize_orchestrator()

        # Start analysis
        with st.spinner("🔍 Running model comparison analysis..."):
            try:
                result = bedrock_processor.run_analysis("model_comparison")
                response = result["response"]
                st.session_state.messages.append({"role": "assistant", "content": response})
                st.session_state.analysis_started = True
                st.rerun()
            except Exception as e:
                error_details = traceback.format_exc()
                print(f"❌ Analysis error: {error_details}")
                st.error(f"❌ Analysis failed: {str(e)}")
                st.error(f"Details: {error_details}")
else:
    # Display chat messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    # Chat input
    if prompt := st.chat_input("Ask follow-up questions about the analysis or ask me how to create a custom model..."):
        st.session_state.messages.append({"role": "user", "content": prompt})

        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            # Determine analysis type based on prompt
            if "train" in prompt.lower() and "custom" in prompt.lower():
                analysis_type = "custom_training"
            else:
                analysis_type = "chat"

            try:
                # Show any training updates from hooks
                if 'training_updates' in st.session_state:
                    for update in st.session_state.training_updates:
                        st.info(update)
                    st.session_state.training_updates = []

                response = bedrock_processor.process_chat_message(prompt, analysis_type)

                # Check if training was started
                if "**TRAINING_STARTED**" in response:
                    st.session_state.custom_training_started = True
                    # Remove the marker from display
                    response = response.replace("**TRAINING_STARTED**", "")

                st.markdown(response)
                st.session_state.messages.append({"role": "assistant", "content": response})
            except Exception as e:
                error_msg = f"Error processing message: {str(e)}"
                st.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg})

    # Show re-analysis button if custom training was started
    if st.session_state.get("custom_training_started", False):
        st.markdown("---")
        st.markdown("**Custom Model Training In Progress**")
        if st.button("🔄 Re-run Analysis (Include Custom Model)", type="primary", use_container_width=True):
            with st.spinner("🔍 Running updated analysis with custom model..."):
                try:
                    result = bedrock_processor.run_analysis("model_comparison")
                    response = result["response"]
                    st.session_state.messages.append({"role": "assistant", "content": response})
                    st.rerun()
                except Exception as e:
                    st.error(f"Analysis failed: {str(e)}")
