"""
Analysis mode handlers for the EMR Log Analytics Chatbot
"""

from .components import render_progress_bar
from .agent import create_agent
from .emr_analyzer import EMRAnalyzer as EMRLogAnalyzer
import streamlit as st
import asyncio
import os
import boto3
from abc import ABC, abstractmethod
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class BaseAnalysisHandler(ABC):
    def __init__(self, state, region, prompt_loader):
        self.state = state
        self.region = region
        self.prompt_loader = prompt_loader

    def _execute_with_progress(self, steps, business_logic_func):
        """Common pattern for progress + error handling"""
        progress_bar = render_progress_bar(0, steps[0])
        try:
            for i, (progress, message) in enumerate(steps[1:], 1):
                progress_bar.progress(progress, text=message)

            result = business_logic_func()
            progress_bar.progress(0.9, text="Processing response...")

            if result['success']:
                self.state.log_analysis_results = result
                self.state.analysis_complete = True
                st.rerun()
            else:
                # amazonq-ignore-next-line
                st.error(f"❌ Error: {result.get('error', 'Unknown error')}")
        except Exception as e:
            # Sanitize exception message for logging to prevent log injection
            safe_error_msg = str(e).replace('\n', '').replace('\r', '').replace('\t', '')
            st.error(f"❌ Error: {safe_error_msg}")
            import traceback
            st.code(traceback.format_exc())
        finally:
            progress_bar.progress(1.0, text="Complete!")

    def _get_knowledge_base_id(self) -> str:
        """Auto-detect Knowledge Base ID"""
        # Try environment variable first
        kb_id = os.getenv('BEDROCK_KB_ID')
        if kb_id:
            return kb_id

        # Auto-detect from Bedrock
        try:
            bedrock_client = boto3.client('bedrock-agent', region_name=self.region)
            response = bedrock_client.list_knowledge_bases()

            # Look for EMR-related knowledge bases
            for kb in response.get('knowledgeBaseSummaries', []):
                kb_name = kb.get('name', '').lower()
                if any(keyword in kb_name for keyword in ['emr', 'log', 'analytics']):
                    return kb['knowledgeBaseId']

            # Return first available KB if no EMR-specific one found
            if response.get('knowledgeBaseSummaries'):
                return response['knowledgeBaseSummaries'][0]['knowledgeBaseId']

        except (boto3.exceptions.Boto3Error, boto3.exceptions.NoCredentialsError, 
                boto3.exceptions.PartialCredentialsError) as e:
            # Log specific AWS credential or service errors
            pass
        except (KeyError, ValueError, TypeError) as e:
            # Log unexpected errors for debugging
            pass

        # Fallback to your specific KB ID
        return 'T3UOPAEFCZ'

    async def _create_agent(self):
        """Common agent creation pattern"""
        kb_id = self._get_knowledge_base_id()
        agent = await create_agent(
            region_name=self.region,
            knowledge_base_id=kb_id
        )
        self.state.emr_agent = agent
        return agent

    @abstractmethod
    def render_ui(self):
        """Render the UI for this analysis mode"""


class QuestionModeHandler(BaseAnalysisHandler):
    def render_ui(self):
        st.header("Ask a Question")

        st.markdown("""
        Enter your question about an error message or issue. The Agent will search the knowledge base
        for specific solutions and AWS documentation for best practices.

        **Examples:**
        - How to resolve java.lang.OutOfMemoryError?
        - What causes Container killed by YARN?
        - How to fix Spark FetchFailedException?
        """)

        error_question = st.text_area(
            "Your question about an error message:",
            placeholder="Example: How to resolve java.lang.OutOfMemoryError?",
            height=100
        )

        if error_question and st.button("🔍 Get Answer", type="primary", use_container_width=True):
            self._process_question(error_question)

    def _process_question(self, question):
        steps = [
            "Initializing...",
            (0.3, "Connecting to knowledge base..."),
            (0.6, "Searching for solutions...")
        ]

        def business_logic():
            async def process_question():
                agent = await self._create_agent()
                return await agent.query_knowledge_base(question)

            result = asyncio.run(process_question())

            # Add question-specific result formatting
            if result['success']:
                self.state.uploaded_logs = {
                    "question.log": {
                        'content': f"Question: {question}",
                        'size': len(question),
                        'type': 'question'
                    }
                }
                return {
                    'success': True,
                    'response': result['response'],
                    'knowledge_center_links': result.get('knowledge_center_links', []),
                    'analysis_type': 'direct_query'
                }
            return result

        self._execute_with_progress(steps, business_logic)


class UploadModeHandler(BaseAnalysisHandler):
    def render_ui(self):
        st.header("Upload Your EMR Logs")

        uploaded_files = st.file_uploader(
            "Choose EMR log files",
            accept_multiple_files=True,
            type=['log', 'txt'],
            help="Upload application logs, container logs, system logs, etc."
        )

        if uploaded_files:
            self._handle_file_upload(uploaded_files)

        self._render_sample_logs_option()

        if self.state.uploaded_logs:
            st.markdown("---")
            st.header("Analyze Your Logs")

            if not self.state.aws_configured:
                st.error("❌ Please configure your AWS credentials first!")
            else:
                st.markdown("**Ready to analyze your EMR logs for issues and get recommendations.**")

                if st.button("🚀 Analyze My Logs", type="primary", use_container_width=True):
                    self._process_logs()

    def _handle_file_upload(self, uploaded_files):
        st.success(f"✅ {len(uploaded_files)} file(s) uploaded")

        for uploaded_file in uploaded_files:
            if uploaded_file.name not in self.state.uploaded_logs:
                content = uploaded_file.read().decode('utf-8')
                self.state.uploaded_logs[uploaded_file.name] = {
                    'content': content,
                    'size': len(content),
                    'type': 'uploaded'
                }

        st.subheader("📋 Uploaded Files")
        for filename, file_info in self.state.uploaded_logs.items():
            st.write(f"📄 **{filename}**: {file_info['size']:,} characters")

    def _render_sample_logs_option(self):
        st.subheader("Try Sample Logs")
        if st.button("📂 Load Sample EMR Logs", type="secondary", use_container_width=True):
            sample_files = ['application.log', 'container.log', 'system.log']
            # Navigate from emr_analytics/ to app root, then to sample_logs/
            handlers_dir = os.path.dirname(os.path.abspath(__file__))
            app_root = os.path.dirname(handlers_dir)  # Go up from emr_analytics/ to root
            sample_logs_dir = os.path.join(app_root, 'sample_logs')

            for filename in sample_files:
                try:
                    sample_file_path = os.path.join(sample_logs_dir, filename)
                    with open(sample_file_path, 'r') as f:
                        content = f.read()
                        self.state.uploaded_logs[f"sample_{filename}"] = {
                            'content': content,
                            'size': len(content),
                            'type': 'sample'
                        }
                    st.success(f"✅ Loaded {filename}")
                except FileNotFoundError:
                    st.warning(f"⚠️ Sample file {filename} not found at {sample_file_path}")

    def _process_logs(self):
        steps = [
            "Starting analysis...",
            (0.25, "Initializing agent..."),
            (0.5, "Analyzing logs..."),
            (0.75, "Processing results...")
        ]

        def business_logic():
            async def process_logs():
                agent = await self._create_agent()
                analysis_prompt = self.prompt_loader.get_prompt('emr_log_analysis')
                # Generate session ID for S3 upload
                import uuid
                session_id = str(uuid.uuid4())[:8]
                return await agent.analyze_logs(self.state.uploaded_logs, analysis_prompt, session_id)

            analysis_result = asyncio.run(process_logs())

            if analysis_result['success']:
                return {
                    'success': True,
                    'response': analysis_result['response'],
                    'mcp_server_used': analysis_result.get('mcp_server_used', False),
                    'documentation_results': analysis_result.get('documentation_results', []),
                    'verification_logs': analysis_result.get('verification_logs', []),
                    'findings': analysis_result.get('findings', []),
                    'database_name': analysis_result.get('database_name'),
                    'results_table': analysis_result.get('results_table'),
                    'logs_location': analysis_result.get('logs_location'),
                    'analysis_type': analysis_result.get('analysis_type', 'uploaded_logs')
                }
            return analysis_result

        self._execute_with_progress(steps, business_logic)


class ClusterModeHandler(BaseAnalysisHandler):
    def render_ui(self):
        st.header("Analyze EMR Cluster Logs")

        if self.state.aws_configured and not self.state.emr_log_analyzer:
            try:
                self.state.emr_log_analyzer = EMRLogAnalyzer(region=self.region)
            except Exception as e:
                st.error(f"❌ Failed to initialize EMR log analyzer: {str(e)}")

        cluster_id = st.text_input(
            "Enter EMR Cluster ID",
            placeholder="j-1234567890ABCDEF",
            help="Enter the EMR cluster ID to analyze its logs"
        )

        if cluster_id:
            if not self._validate_cluster_id(cluster_id):
                st.warning("⚠️ Please enter a valid EMR cluster ID (format: j-XXXXXXXXXXXXXXX)")
            elif self.state.emr_log_analyzer:
                st.info(f"📋 Ready to analyze cluster: {cluster_id}")

                self._render_advanced_config()

                if st.button("🚀 Analyze Cluster Logs", type="primary", use_container_width=True):
                    self._process_cluster(cluster_id)

    def _validate_cluster_id(self, cluster_id):
        return cluster_id.startswith('j-') and len(cluster_id) >= 15

    def _render_advanced_config(self):
        with st.expander("⚙️ Advanced Configuration (Optional)"):
            col1, col2 = st.columns(2)
            with col1:
                database_name = st.text_input("Database Name", value="", placeholder="Auto-detect EMR KB database")
                known_issues_table = st.text_input(
                    "Known Issues Table", value="", placeholder="Auto-detected from database")
            with col2:
                output_location = st.text_input(
                    "Output S3 Location (Optional)",
                    placeholder="Auto-detected from cluster logs bucket",
                    help="Leave empty to auto-detect from cluster's log bucket"
                )
            return database_name, known_issues_table, output_location

    def _process_cluster(self, cluster_id):
        steps = [
            "Starting analysis...",
            (0.25, "Running Athena queries..."),
            (0.5, "Generating recommendations..."),
            (0.75, "Processing results...")
        ]

        def business_logic():
            analysis_result = self.state.emr_log_analyzer.analyze_emr_cluster(
                cluster_id=cluster_id
            )

            if analysis_result['status'] != 'COMPLETED':
                return {
                    'success': False,
                    'error': analysis_result.get('error', 'Analysis failed')
                }

            self.state.cluster_analysis_results = analysis_result

            log_summary = f"EMR Cluster: {cluster_id}\n\n"
            log_summary += f"Logs Location: {analysis_result['logs_location']}\n"
            log_summary += f"Status: {analysis_result['status']}\n"
            log_summary += f"Database: {analysis_result['database_name']}\n"
            log_summary += f"Results Table: {analysis_result.get('results_table', 'N/A')}\n"
            log_summary += f"Execution IDs: {', '.join(analysis_result['execution_ids'])}\n\n"

            async def get_recommendations():
                agent = await self._create_agent()
                recommendations = await agent.analyze_athena_results(analysis_result)
                findings = await self.state.emr_log_analyzer.query_athena_results(
                    analysis_result.get('database_name', 'emr_kb'),
                    analysis_result.get('results_table'),
                    analysis_result.get('output_location')
                )
                return recommendations, findings

            recommendations, findings = asyncio.run(get_recommendations())

            if recommendations['success']:
                log_summary += f"\n\nAI RECOMMENDATIONS:\n{recommendations['response']}"

                self.state.uploaded_logs = {
                    f"cluster_{cluster_id}_analysis.log": {
                        'content': log_summary,
                        'size': len(log_summary),
                        'type': 'cluster_analysis'
                    }
                }

                return {
                    'success': True,
                    'response': log_summary,
                    'findings': findings
                }
            else:
                return {
                    'success': False,
                    'error': f"Could not generate recommendations: {recommendations['error']}"
                }

        self._execute_with_progress(steps, business_logic)


class AnalysisModeRegistry:
    def __init__(self, state, region, prompt_loader):
        self.handlers = {
            "question": QuestionModeHandler(state, region, prompt_loader),
            "upload": UploadModeHandler(state, region, prompt_loader),
            "cluster": ClusterModeHandler(state, region, prompt_loader)
        }

    def get_handler(self, mode):
        return self.handlers.get(mode)

    def render_mode_selection(self, state):
        # Custom CSS for larger buttons
        st.markdown("""
        <style>
        div.stButton > button {
            font-size: 18px;
            height: 3em;
            width: 100%;
            border-radius: 10px;
            font-weight: bold;
        }
        </style>
        """, unsafe_allow_html=True)

        col1, col2, col3 = st.columns(3)

        with col1:
            question_type = "primary" if state.analysis_mode == "question" else "secondary"
            if st.button("Ask a Question", type=question_type, use_container_width=True):
                state.analysis_mode = "question"
                st.rerun()

        with col2:
            upload_type = "primary" if state.analysis_mode == "upload" else "secondary"
            if st.button("📁 Upload Log Files", type=upload_type, use_container_width=True):
                state.analysis_mode = "upload"
                st.rerun()

        with col3:
            cluster_type = "primary" if state.analysis_mode == "cluster" else "secondary"
            if st.button("🔍 Analyze EMR Cluster", type=cluster_type, use_container_width=True):
                state.analysis_mode = "cluster"
                st.rerun()
