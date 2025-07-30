"""
Knowledge Base Service for Bedrock KB operations
"""

import boto3
import re
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class KnowledgeBaseService:
    """Service for managing Bedrock Knowledge Base operations"""

    def __init__(self, knowledge_base_id: str, region_name: str = None):
        self.knowledge_base_id = knowledge_base_id
        # Use dotenv pattern: parameter -> .env file -> default
        self.region_name = region_name or os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        self.kb_valid_links = set()
        self.verification_logs = []
        self._initialized = False
        self.kb_config = {}

    async def initialize(self):
        """Initialize Bedrock Knowledge Base configuration"""
        try:
            if not self.knowledge_base_id:
                self.verification_logs.append("⚠️ No Knowledge Base ID provided")
                return

            self.verification_logs.append(f"🔧 Initializing Bedrock Knowledge Base: {self.knowledge_base_id}")

            self.kb_config = {
                'knowledge_base_id': self.knowledge_base_id,
                'region_name': self.region_name,
                'max_results': 5
            }

            self._initialized = True
            self.verification_logs.append("✅ Bedrock Knowledge Base configuration initialized")

        except Exception as e:
            self.verification_logs.append(f"❌ Failed to initialize Knowledge Base: {str(e)}")
            self._initialized = False

    def create_kb_agent_tool(self):
        """Create Knowledge Base agent as a tool for the orchestrator"""
        if not self._initialized:
            def dummy_tool(query: str) -> str:
                return "NO_SPECIFIC_MATCH - Knowledge Base not available"
            return dummy_tool

        return self._create_kb_tool()

    def _create_kb_tool(self):
        """Internal method to create KB agent tool"""
        def kb_agent_tool(query: str) -> str:
            """Query the EMR Knowledge Base for specific solutions"""
            self.kb_valid_links.clear()

            try:
                bedrock_agent = boto3.client('bedrock-agent-runtime', region_name=self.region_name)

                response = bedrock_agent.retrieve(
                    retrievalQuery={"text": query},
                    knowledgeBaseId=self.kb_config['knowledge_base_id'],
                    retrievalConfiguration={
                        "vectorSearchConfiguration": {"numberOfResults": self.kb_config['max_results']},
                    }
                )

                kb_results = response.get("retrievalResults", [])
                self.verification_logs.append(f"KB query returned {len(kb_results)} results")

                if kb_results:
                    formatted_results = []
                    knowledge_center_links = []

                    for i, result in enumerate(kb_results[:3]):
                        content = self._extract_content(result)
                        metadata = result.get("metadata", {})

                        # Extract links from metadata
                        if 'knowledge_center_links' in metadata:
                            links = metadata['knowledge_center_links']
                            if isinstance(links, list):
                                for link in links:
                                    if link and 'http' in link:
                                        knowledge_center_links.append(link)
                                        self.kb_valid_links.add(link)

                        # Extract URLs from content
                        url_pattern = r'(https?://(?:repost\.aws/knowledge-center|aws\.amazon\.com/premiumsupport/knowledge-center|docs\.aws\.amazon\.com)[^\s"\',]+)'
                        urls = re.findall(url_pattern, content)
                        for url in urls:
                            if url:
                                knowledge_center_links.append(url)
                                self.kb_valid_links.add(url)

                        formatted_results.append(f"KB Solution: {content}")

                    response_parts = ["\n\n".join(formatted_results)]
                    if knowledge_center_links:
                        unique_links = list(set([link for link in knowledge_center_links if link and 'http' in link]))
                        if unique_links:
                            links_section = "\n\nRelevant AWS Knowledge Center Articles:\n" + \
                                "\n".join([f"- {link}" for link in unique_links])
                            response_parts.append(links_section)

                    return "\n".join(response_parts)
                else:
                    return "NO_SPECIFIC_MATCH - No relevant solutions found in Knowledge Base"

            except Exception as e:
                self.verification_logs.append(f"KB Error: {str(e)}")
                # amazonq-ignore-next-line
                return f"NO_SPECIFIC_MATCH - KB Error: {str(e)}"

        kb_agent_tool.__name__ = "query_emr_knowledge_base"
        kb_agent_tool.__doc__ = "Query the EMR Knowledge Base for specific error patterns and solutions"
        return kb_agent_tool

    def _extract_content(self, result):
        """Extract content from KB result handling different formats"""
        content = ""
        if "content" in result:
            if isinstance(result["content"], dict):
                if "text" in result["content"]:
                    content = result["content"]["text"]
                elif "row" in result["content"]:
                    rows = result["content"]["row"]
                    content_parts = []
                    for row in rows:
                        if "columnName" in row and "columnValue" in row:
                            content_parts.append(f"{row['columnName']}: {row['columnValue']}")
                    content = "\n".join(content_parts)
            elif isinstance(result["content"], str):
                content = result["content"]
        return content

    async def query_knowledge_base(self, query: str, max_results: int = 3):
        """Query the knowledge base with consistent formatting"""
        self.kb_valid_links.clear()

        kb_tool = self.create_kb_agent_tool()
        self.verification_logs.append(f"Querying KB with: {query[:100]}...")
        kb_response = kb_tool(query)

        has_results = not kb_response.startswith('NO_SPECIFIC_MATCH')
        links = list(self.kb_valid_links)

        if has_results:
            formatted_results = f"""
KNOWLEDGE BASE RESULTS:
{kb_response}
"""
        else:
            formatted_results = ""

        return formatted_results, links, has_results

    @property
    def is_initialized(self):
        return self._initialized
