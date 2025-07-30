import uuid
import os
from datetime import datetime
from typing import Dict
from dotenv import load_dotenv
from .mcp_client import MCPClientService
from .knowledge_base import KnowledgeBaseService
from .emr_analyzer import EMRAnalyzer
from .agent import AnalysisAgent

# Load environment variables
load_dotenv()


class AnalysisOrchestrator:
    """Analysis Orchestrator using service-oriented architecture"""

    def __init__(self, region_name: str = None, knowledge_base_id: str = None):
        """Initialize Analysis Orchestrator with service dependencies"""
        # Use dotenv pattern: parameter -> .env file -> default
        self.region_name = region_name or os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        self.knowledge_base_id = knowledge_base_id or os.getenv('BEDROCK_KB_ID')
        self.session_id = str(uuid.uuid4())
        self.uploaded_logs = {}

        # Initialize services
        self.mcp_client = MCPClientService()
        self.knowledge_base = KnowledgeBaseService(knowledge_base_id, region_name)
        self.emr_analyzer = EMRAnalyzer(region_name)
        self.agent = AnalysisAgent(model_id=os.getenv('BEDROCK_MODEL_ID'))

        self._initialized = False

    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.cleanup()

    async def initialize(self):
        """Initialize all services"""
        try:
            # Initialize services
            await self.mcp_client.initialize()
            await self.knowledge_base.initialize()

            # Create agent with tools
            kb_tool = self.knowledge_base.create_kb_agent_tool()
            mcp_tool = self.mcp_client.create_mcp_agent_tool()
            self.agent.create_agent(kb_tool, mcp_tool)

            self._initialized = True

        except Exception as e:
            self._initialized = False
            raise Exception(f"Failed to initialize orchestrator: {str(e)}")

    async def cleanup(self):
        """Clean up resources"""
        await self.mcp_client.cleanup()

    def add_log_data(self, logs_dict: Dict, previous_analysis_context: str = None):
        """Add EMR log data for analysis"""
        self.uploaded_logs = logs_dict

    async def query_knowledge_base(self, user_query: str, is_follow_up: bool = False) -> Dict:
        """Query the knowledge base with the given query"""
        try:
            if not self._initialized:
                return self._build_error_response('Orchestrator not initialized')

            # For initial analysis with logs, use log analysis flow
            if not is_follow_up and self.uploaded_logs:
                return await self.analyze_logs(self.uploaded_logs, user_query)

            # Process direct query
            additional_fields = {
                'enhanced_query_used': True,
                'orchestrator_used': True,
                'analysis_type': 'direct_query'
            }

            return await self.agent.orchestrate_analysis(
                query=user_query,
                context_type='query',
                user_query=user_query,
                additional_fields=additional_fields
            )

        except Exception as e:
            return self._build_error_response(f'Analysis failed: {str(e)}')

    async def analyze_logs(self, logs_dict: Dict, prompt: str = None, session_id: str = None) -> Dict:
        """Analyze logs using the agent"""
        try:
            # Use provided session_id or generate one
            if session_id:
                self.session_id = session_id

            # Analyze logs
            analysis_result = await self.emr_analyzer.analyze_uploaded_logs(
                logs_dict, session_id=self.session_id
            )

            if not analysis_result['success']:
                return self._build_error_response(analysis_result.get('error', 'Analysis failed'))

            issues = analysis_result['issues']

            if not issues:
                return self._build_no_issues_response(analysis_result)

            # Get KB results for specific issues
            all_kb_results = ""
            all_kb_links = []

            generic_keywords = ["ERROR", "EXCEPTION", "FATAL"]
            specific_issues = [f for f in issues if f['matched_keyword'] not in generic_keywords][:5]

            for issue in specific_issues:
                issue_keyword = issue['matched_keyword']
                query = f"How to resolve {issue_keyword} in EMR"

                kb_results, kb_links, has_results = await self.knowledge_base.query_knowledge_base(query)

                if has_results:
                    all_kb_results += f"\nKB RESULTS FOR {issue_keyword.upper()}:\n{kb_results}\n"
                    all_kb_links.extend(kb_links)

            # Extract links from issues
            issue_links = []
            for issue in issues:
                if issue.get('knowledge_center_links'):
                    issue_links.extend(issue['knowledge_center_links'])

            all_links = list(set(issue_links + all_kb_links))

            # Create metadata
            context_metadata = f"""- Analysis Type: Uploaded Logs
- Status: {analysis_result.get('analysis_results', {}).get('status', 'Unknown')}
- Database: {analysis_result.get('database_name')}
- Results Table: {analysis_result.get('results_table', 'N/A')}
- Logs Location: {analysis_result.get('logs_location')}
- Files Analyzed: {len(logs_dict)} files"""

            # Orchestrate analysis
            result = await self.agent.orchestrate_analysis(
                query="Analyze EMR log issues and provide recommendations",
                context_type='combined',
                issues=issues,
                metadata=context_metadata,
                kb_results=all_kb_results,
                kb_links=all_links,
                additional_fields={
                    'database_name': analysis_result.get('database_name'),
                    'results_table': analysis_result.get('results_table'),
                    'logs_location': analysis_result.get('logs_location'),
                    'analysis_type': 'uploaded_logs',
                    'findings': issues  # Include findings in response
                }
            )

            return result

        except Exception as e:
            return self._build_error_response(f'Log analysis failed: {str(e)}')

    async def analyze_athena_results(self, analysis_results: Dict) -> Dict:
        """Analyze Athena query results"""
        try:
            if not self._initialized:
                return self._build_error_response('Orchestrator not initialized')

            # Get results from Athena table
            database_name = analysis_results.get('database_name', 'emr_kb')
            results_table = analysis_results.get('results_table')
            output_location = analysis_results.get('output_location')

            if not results_table:
                issues = []
            else:
                issues = await self.emr_analyzer.query_athena_results(
                    database_name, results_table, output_location
                )

            # Create metadata
            context_metadata = f"""- Analysis Type: EMR Cluster
- Status: {analysis_results.get('status', 'Unknown')}
- Database: {database_name}
- Results Table: {results_table or 'N/A'}
- Execution IDs: {len(analysis_results.get('execution_ids', []))} queries completed
- Components Detected: Spark, YARN (based on log patterns)"""

            # Orchestrate analysis
            result = await self.agent.orchestrate_analysis(
                query="Analyze EMR cluster issues and provide recommendations",
                context_type='combined',
                issues=issues,
                metadata=context_metadata,
                additional_fields={
                    'database_name': database_name,
                    'results_table': results_table,
                    'analysis_type': 'cluster'
                }
            )

            # Add cluster-specific fields
            cluster_id = analysis_results.get('cluster_id')
            if cluster_id:
                result['cluster_id'] = cluster_id

            if output_location:
                result['output_location'] = output_location

            return result

        except Exception as e:
            return self._build_error_response(f'Results analysis failed: {str(e)}')

    def _build_error_response(self, error_message: str) -> Dict:
        """Build standardized error response"""
        return {
            'success': False,
            'error': error_message,
            'session_id': self.session_id,
            'timestamp': datetime.now().isoformat(),
            'mcp_server_used': False,
            'kb_used': False,
            'knowledge_center_links': [],
            'verification_logs': [f"❌ Error: {error_message}"],
            'issues_count': 0,
            'findings': []
        }

    def _build_no_issues_response(self, analysis_result: Dict) -> Dict:
        """Build response when no issues are found"""
        return {
            'success': True,
            'response': "No specific issues were found in the EMR logs. The analysis completed successfully without detecting any error patterns.",
            'session_id': self.session_id,
            'timestamp': datetime.now().isoformat(),
            'mcp_server_used': False,
            'kb_used': False,
            'knowledge_center_links': [],
            'verification_logs': ["✅ Analysis completed - no issues detected"],
            'issues_count': 0,
            'findings': [],
            'database_name': analysis_result.get('database_name'),
            'results_table': analysis_result.get('results_table'),
            'logs_location': analysis_result.get('logs_location'),
            'analysis_type': 'uploaded_logs'}
