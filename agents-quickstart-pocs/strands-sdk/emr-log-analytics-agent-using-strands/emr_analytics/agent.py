"""
Analysis Agent for coordinating analysis workflows
"""

import uuid
from datetime import datetime
from typing import Dict
from strands import Agent
from strands.agent.conversation_manager import SlidingWindowConversationManager
from .prompt_loader import PromptLoader


class AnalysisAgent:
    """Service for orchestrating analysis workflows between different agents"""

    def __init__(self, model_id: str = None):
        self.prompt_loader = PromptLoader()
        self.agent = None
        self.verification_logs = []
        self.model_id = model_id or "anthropic.claude-3-sonnet-20240229-v1:0"

    def create_agent(self, kb_tool, mcp_tool):
        """Create the analysis agent with all necessary tools"""
        if self.agent is not None:
            return self.agent

        conversation_manager = SlidingWindowConversationManager(
            window_size=20,
            should_truncate_results=True
        )

        self.agent = Agent(
            model=self.model_id,
            tools=[kb_tool, mcp_tool],
            system_prompt=self.prompt_loader.get_prompt('orchestrator_system_prompt'),
            conversation_manager=conversation_manager
        )

        return self.agent

    async def orchestrate_analysis(self, query: str, context_type: str = 'query', **kwargs) -> Dict:
        """Unified orchestration method for all analysis flows"""
        # Get KB results if not already provided
        kb_results = kwargs.get('kb_results', '')
        kb_links = kwargs.get('kb_links', [])

        # Create context with all available information
        context = self._create_context(context_type, **kwargs)

        # Call the analysis agent
        self.verification_logs.append("🔍 Analyzing with analysis agent...")

        if context_type == 'combined' and 'issues' in kwargs:
            formatted_query = self.prompt_loader.format_prompt('emr_log_analysis', context)
            response = str(self.agent(formatted_query))
        else:
            response = str(self.agent(context))

        # Process the response
        mcp_used = self._check_aws_docs_used(response)
        kb_used = self._check_knowledge_base_used(response) or (kb_results != '')

        # Return standardized response
        additional_fields = kwargs.get('additional_fields', {})

        return self._build_standard_response(
            response=response,
            analysis_method='strands-agent',
            issues=kwargs.get('issues', []),
            all_links=kb_links,
            mcp_used=mcp_used,
            kb_used=kb_used,
            **additional_fields
        )

    def _create_context(self, content_type: str, **kwargs) -> str:
        """Create context for prompts with consistent formatting"""
        context_parts = []

        # Add KB results if available
        if 'kb_results' in kwargs and kwargs['kb_results']:
            context_parts.append(kwargs['kb_results'])

        # Add user query if provided
        if content_type in ['query', 'combined'] and 'user_query' in kwargs:
            context_parts.append(f"USER QUERY: {kwargs['user_query']}")
            context_parts.append("""
INSTRUCTIONS:
Please analyze this EMR issue and search AWS documentation for official solutions and best practices.
Provide specific recommendations based on official AWS guidance.
If Knowledge Base results are provided above, incorporate those solutions in your response.""")

        # Add metadata if provided
        if 'metadata' in kwargs:
            context_parts.append(f"\nANALYSIS METADATA:\n{kwargs['metadata']}")

        # Add issues if provided
        if content_type in ['issues', 'combined'] and 'issues' in kwargs:
            issues = kwargs['issues']
            if not issues:
                context_parts.append(
                    "\nNo specific issues found in results - analysis may have completed without matches.\n")
            else:
                issues_summary = []
                all_links = []

                for issue in issues[:5]:
                    occurrence_count = issue.get('occurrence_count', 0)
                    summary_text = issue.get('summary', 'N/A')
                    if summary_text and summary_text != 'N/A':
                        issues_summary.append(
                            f"- {issue['matched_keyword']}: {occurrence_count} occurrences (Issue ID: {issue['issue_id']}) - {summary_text}")
                    else:
                        issues_summary.append(
                            f"- {issue['matched_keyword']}: {occurrence_count} occurrences (Issue ID: {issue['issue_id']})")

                    if issue.get('knowledge_center_links'):
                        all_links.extend(issue['knowledge_center_links'])

                context_parts.append("\nACTUAL ISSUES FROM ANALYSIS:\n" + "\n".join(issues_summary))

                if all_links:
                    unique_links = list(set(all_links))
                    context_parts.append("\nRelevant AWS Knowledge Center Articles:\n" +
                                         "\n".join([f"- {link}" for link in unique_links]))

        return '\n'.join(context_parts)

    def _check_aws_docs_used(self, response: str) -> bool:
        """Check if AWS documentation was used in the response"""
        mcp_indicators = [
            'docs.aws.amazon.com',
            'AWS documentation',
            'official AWS',
            'AWS best practices',
            'according to AWS',
            'AWS Documentation:'
        ]

        response_lower = response.lower()
        return any(indicator.lower() in response_lower for indicator in mcp_indicators)

    def _check_knowledge_base_used(self, response: str) -> bool:
        """Check if Knowledge Base was used in the response"""
        kb_indicators = [
            'KB Solution:',
            'knowledge base',
            'specific solution',
            'curated solution',
            'emr knowledge base'
        ]

        response_lower = response.lower()
        return any(indicator.lower() in response_lower for indicator in kb_indicators)

    def _build_standard_response(self, response, analysis_method, issues, all_links,
                                 mcp_used, kb_used, **kwargs):
        """Build a standardized response with consistent structure"""
        standard_response = {
            'success': True,
            'response': response,
            'session_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'mcp_server_used': mcp_used,
            'kb_used': kb_used,
            'knowledge_center_links': all_links,
            'mcp_server_method': analysis_method,
            'verification_logs': self.verification_logs.copy(),
            'issues_count': len(issues),
            'findings': [dict(issue, occurrence_count=issue.get('occurrence_count', 0)) for issue in issues]
        }

        standard_response.update(kwargs)
        return standard_response


# Standalone utility functions
async def create_agent(region_name: str = None, knowledge_base_id: str = None):
    """Create and initialize an AnalysisOrchestrator instance"""
    from .orchestrator import AnalysisOrchestrator

    orchestrator = AnalysisOrchestrator(region_name=region_name, knowledge_base_id=knowledge_base_id)
    await orchestrator.initialize()
    return orchestrator


def clean_response(response: str) -> str:
    """Clean and format the response text"""
    if not response:
        return ""

    # Remove any markdown artifacts or extra whitespace
    cleaned = response.strip()

    # Remove any system prompts or internal markers that might have leaked through
    lines = cleaned.split('\n')
    filtered_lines = []

    for line in lines:
        # Skip lines that look like system prompts or internal markers
        if line.strip().startswith(('SYSTEM:', 'USER:', 'ASSISTANT:', '###', '---')):
            continue
        filtered_lines.append(line)

    return '\n'.join(filtered_lines).strip()
