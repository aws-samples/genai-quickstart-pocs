"""
EMR Log Analytics Chatbot - Streamlit Application
"""

import streamlit as st
import os
import asyncio
from dotenv import load_dotenv
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

# Import local modules
from emr_analytics.prompt_loader import PromptLoader
from emr_analytics.components import (
    apply_dark_mode, render_sidebar, render_findings_visualization,
    render_mcp_verification, render_chat_messages, render_progress_bar
)
from emr_analytics.agent import create_agent, clean_response
from emr_analytics.orchestrator import AnalysisOrchestrator
from emr_analytics.analysis_handlers import AnalysisModeRegistry

# Configure logging
import logging
logging.getLogger("strands").setLevel(logging.WARNING)

# Load environment variables (dotenv will find .env file automatically)
load_dotenv()

# Define paths relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = SCRIPT_DIR

# Initialize prompt loader
prompt_loader = PromptLoader()


@dataclass
class AppState:
    # UI State
    dark_mode: bool = False
    analysis_mode: str = "upload"
    analysis_complete: bool = False
    analysis_progress: int = 0

    # Data State
    messages: List[Dict] = field(default_factory=list)
    uploaded_logs: Dict = field(default_factory=dict)
    log_analysis_results: Optional[Dict] = None
    cluster_analysis_results: Optional[Dict] = None

    # Service State
    aws_configured: bool = False
    emr_agent: Optional[Any] = None
    emr_log_analyzer: Optional[Any] = None
    knowledge_base_id: Optional[str] = field(
        default_factory=lambda: os.getenv('BEDROCK_KB_ID')
    )

    def reset_analysis(self):
        """Reset analysis-related state for new analysis"""
        self.uploaded_logs = {}
        self.log_analysis_results = None
        self.analysis_complete = False
        self.messages = []
        self.cluster_analysis_results = None
        self.emr_agent = None
        self.analysis_mode = "upload"


def get_state() -> AppState:
    """Get or initialize app state"""
    if "app_state" not in st.session_state:
        st.session_state.app_state = AppState()
    return st.session_state.app_state


# Page configuration
st.set_page_config(
    page_title="EMR Log Analytics Agent",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize state
state = get_state()


# Apply dark mode if enabled
if state.dark_mode:
    apply_dark_mode()

# Title and description
st.title("🔍 EMR Log Analytics Agent")
st.markdown("""
**Strands Agent with Bedrock Knowledge Bases & AWS Documentation MCP**

**Instructions:**
1. 📁 **Upload** specific EMR log files or provide EMR Cluster ID to analyze
2. 🚀 **Analyze** - Analyze error logs and get key findings and recommendations
3. 💬 **Chat** - Ask follow-up questions based on analysis
""")

# Render sidebar and get region and bedrock availability
region, bedrock_available = render_sidebar([
    "anthropic.claude-3-sonnet-20240229-v1:0",
    "anthropic.claude-3-haiku-20240307-v1:0",
    "amazon.titan-text-express-v1"
], state)

# Main application flow
if not state.analysis_complete:
    st.subheader("Choose Analysis Mode")

    # Initialize registry
    registry = AnalysisModeRegistry(state, region, prompt_loader)

    # Render mode selection
    registry.render_mode_selection(state)

    st.markdown("---")

    # Get and execute handler
    handler = registry.get_handler(state.analysis_mode)
    if handler:
        handler.render_ui()

else:
    # Results and Chat Phase
    st.header("📊 EMR Log Analysis Results")

    # Display log analysis results
    if state.log_analysis_results:
        result = state.log_analysis_results

        # Analysis header with reset button
        col1, col2 = st.columns([4, 1])
        with col2:
            if st.button("🔄 New Analysis", type="secondary"):
                # Reset for new analysis
                state.reset_analysis()
                st.rerun()

        # Show analysis results with visualizations
        default_type = 'cluster' if state.cluster_analysis_results else 'uploaded_logs'
        analysis_type = result.get('analysis_type', default_type)

        if analysis_type in ['cluster', 'uploaded_logs']:
            if analysis_type == 'cluster':
                cluster_id = state.cluster_analysis_results.get('cluster_id', 'Unknown')
                st.info(f"🔍 **Cluster Analysis** - Analyzed cluster {cluster_id}")
            else:
                actual_logs = {
                    k: v for k, v in state.uploaded_logs.items()
                    if v.get('type') != 'question'
                }
                log_count = len(actual_logs)
                st.info(f"🔍 **Uploaded Log Analysis** - Analyzed {log_count} log files")
            st.caption(
                "📊 Uses Athena queries on S3 logs for comprehensive analysis"
            )
        elif analysis_type == 'direct_query':
            st.info("🔍 **Question Analysis** - Direct knowledge base query")
        else:
            st.info("🔍 **Question Analysis** - Knowledge base query response")

        # Show analysis summary (only for non-direct queries)
        if analysis_type != 'direct_query':
            with st.expander("📊 Analysis Results", expanded=True):
                if analysis_type in ['cluster', 'uploaded_logs']:
                    cluster_has_results = (
                        state.cluster_analysis_results.get('results', []) 
                        if state.cluster_analysis_results else []
                    )
                    if analysis_type == 'cluster' and cluster_has_results:
                        results = state.cluster_analysis_results.get('results', [])
                        st.write(f"**Found {len(results)} types of issues:**")
                        for result_item in results[:5]:  # Show top 5 issues
                            issue_type = result_item.get('issue_type', 'Unknown')
                            component = result_item.get('component', 'Unknown')
                            count = result_item.get('occurrence_count', 0)
                            st.write(f"- **{issue_type}** in {component}: {count} occurrences")
                    else:
                        st.write(
                            "Analysis completed - detailed results available in Athena table"
                        )
                        st.write(f"**Database:** {result.get('database_name', 'N/A')}")
                        st.write(f"**Results Table:** {result.get('results_table', 'N/A')}")

                        if analysis_type == 'cluster':
                            exec_count = len(
                                state.cluster_analysis_results.get('execution_ids', [])
                            )
                            st.write(f"**Queries Executed:** {exec_count}")
                        elif result.get('logs_location'):
                            st.write(
                                f"**Logs Location:** {result.get('logs_location', 'N/A')}"
                            )

                    # Display findings visualization if available
                    findings = result.get('findings')
                    if findings:
                        render_findings_visualization(findings)
                    elif (result.get('results_table') and
                          st.button("📊 View Detailed Results")):
                        with st.spinner("🔍 Querying results table..."):
                            try:
                                async def get_detailed_results():
                                    async with AnalysisOrchestrator(region_name=region) as emr_agent:
                                        db_name = result.get('database_name', 'emr_kb')
                                        table_name = result.get('results_table')
                                        output_loc = (state.cluster_analysis_results.get('output_location')
                                                      if state.cluster_analysis_results
                                                      else result.get('logs_location'))
                                        return await emr_agent.query_athena_results(
                                            db_name, table_name, output_loc
                                        )

                                findings = asyncio.run(get_detailed_results())
                                state.log_analysis_results['findings'] = findings
                                st.rerun()

                            except Exception as e:
                                st.error(f"Failed to query results: {str(e)}")
                    elif not result.get('results_table'):
                        warning_msg = (
                            "⚠️ No results table available - "
                            "analysis may have failed or is still in progress"
                        )
                        st.warning(warning_msg)

        # Display main analysis text
        st.markdown("---")
        st.subheader("📝 Key Findings and Recommendations")
        with st.container():
            st.markdown(result['response'])

        # Analysis metadata removed

        # Show MCP verification
        render_mcp_verification(result)

        # Chat section
        st.markdown("---")
        st.subheader("💬 Follow-up Questions")

        # Display chat messages
        render_chat_messages(state.messages)

        # Chat input
        if prompt := st.chat_input(
            "Ask a follow-up question about EMR errors or issues..."
        ):
            # Add user message to chat history
            state.messages.append({"role": "user", "content": prompt})

            # Display user message
            with st.chat_message("user"):
                st.markdown(prompt)

            # Generate AI response
            with st.chat_message("assistant"):
                chat_progress = render_progress_bar(0, "Analyzing your question...")

                try:
                    # Initialize agent if needed
                    if state.emr_agent is None:
                        chat_progress.progress(0.2, text="Initializing AI agent...")
                        state.emr_agent = asyncio.run(create_agent(
                            region_name=region,
                            knowledge_base_id=state.knowledge_base_id
                        ))

                    chat_progress.progress(0.4, text="Processing context...")

                    async def process_follow_up():
                        # Get agent
                        emr_agent = state.emr_agent

                        # Add context
                        context_logs = state.uploaded_logs
                        previous_analysis = (
                            state.log_analysis_results['response']
                            if state.log_analysis_results else None
                        )

                        # Add cluster context if available
                        if state.cluster_analysis_results:
                            cluster_id = state.cluster_analysis_results.get('cluster_id', 'Unknown')
                            cluster_context = "\n\nCLUSTER ANALYSIS CONTEXT:\n"
                            cluster_context += f"Cluster ID: {cluster_id}\n"
                            db_name = state.cluster_analysis_results.get('database_name', 'N/A')
                            cluster_context += f"Database: {db_name}\n"
                            results_table = state.cluster_analysis_results.get('results_table', 'N/A')
                            cluster_context += f"Results Table: {results_table}\n"

                            # Add previous analysis context
                            previous_analysis = (previous_analysis or "") + cluster_context

                        emr_agent.add_log_data(context_logs, previous_analysis)

                        # Generate response
                        chat_progress.progress(0.6, text="Generating response...")
                        result = await emr_agent.query_knowledge_base(prompt)

                        return result

                    # Process the follow-up question
                    analysis_result = asyncio.run(process_follow_up())

                    chat_progress.progress(0.8, text="Processing response...")

                    if analysis_result['success']:
                        # Clean the response
                        response = clean_response(analysis_result['response'])

                        chat_progress.progress(1.0, text="Complete!")

                        # Display the response
                        if response and response.strip():
                            st.markdown(response)
                        else:
                            st.warning("No content received from agent")
                            response = "No content received"
                    else:
                        response = f"❌ Enhanced Agent failed: {analysis_result['error']}"
                        st.error(response)

                except Exception as e:
                    response = f"❌ Error: {str(e)}"
                    st.error(response)

                # Add assistant response to chat history
                state.messages.append({"role": "assistant", "content": response})

# Footer
st.markdown("---")
st.markdown("""
**🚀 EMR Log Analytics Agent**
""")
