"""
MCP-Enhanced AWS Service Documentation Collector
Replaces web scraping with AWS Documentation MCP Server integration
"""
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from bedrock_client import get_bedrock_client

logger = logging.getLogger()

class MCPDocumentationCollector:
    """Enhanced documentation collector using MCP server"""
    
    def __init__(self):
        # Initialize MCP client
        try:
            from mcp_tools import get_mcp_client
            self.mcp_client = get_mcp_client()
            self.use_mcp = True
            logger.info("MCP Documentation Collector initialized successfully")
        except ImportError:
            logger.warning("MCP tools not available - falling back to web scraping")
            self.mcp_client = None
            self.use_mcp = False
        
        # Initialize Bedrock client for AI processing
        self.bedrock_client = get_bedrock_client('claude-4')
    
    def collect_service_actions_mcp(self, service_id: str) -> List[Dict[str, Any]]:
        """Collect IAM actions using MCP server"""
        if not self.use_mcp:
            logger.warning("MCP not available, cannot collect actions via MCP")
            return []
        
        try:
            logger.info(f"Collecting actions for {service_id} using MCP")
            
            # Get service documentation via MCP
            service_docs = self.mcp_client.get_service_documentation(service_id)
            
            if not service_docs:
                logger.warning(f"No MCP documentation found for {service_id}")
                return []
            
            # Extract actions using AI from MCP documentation
            actions = self._extract_actions_from_mcp_docs(service_id, service_docs)
            
            logger.info(f"Extracted {len(actions)} actions for {service_id} via MCP")
            return actions
            
        except Exception as e:
            logger.error(f"Error collecting MCP actions for {service_id}: {str(e)}")
            return []
    
    def collect_service_parameters_mcp(self, service_id: str) -> List[Dict[str, Any]]:
        """Collect CloudFormation parameters using MCP server"""
        if not self.use_mcp:
            logger.warning("MCP not available, cannot collect parameters via MCP")
            return []
        
        try:
            logger.info(f"Collecting parameters for {service_id} using MCP")
            
            # Search for CloudFormation documentation via MCP
            cf_docs = self.mcp_client.search_documentation(
                f"{service_id} CloudFormation properties parameters",
                service_id
            )
            
            if not cf_docs:
                logger.warning(f"No MCP CloudFormation documentation found for {service_id}")
                return []
            
            # Extract parameters using AI from MCP documentation
            parameters = self._extract_parameters_from_mcp_docs(service_id, cf_docs)
            
            logger.info(f"Extracted {len(parameters)} parameters for {service_id} via MCP")
            return parameters
            
        except Exception as e:
            logger.error(f"Error collecting MCP parameters for {service_id}: {str(e)}")
            return []
    
    def _extract_actions_from_mcp_docs(self, service_id: str, mcp_docs: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract IAM actions from MCP documentation using AI"""
        try:
            # Convert MCP docs to text for AI processing
            docs_text = self._mcp_docs_to_text(mcp_docs)
            
            if len(docs_text) > 80000:
                # Use chunking for large documents
                return self._extract_actions_with_chunking_mcp(service_id, docs_text)
            else:
                # Single AI call for smaller documents
                return self._extract_actions_single_call_mcp(service_id, docs_text)
                
        except Exception as e:
            logger.error(f"Error extracting actions from MCP docs: {str(e)}")
            return []
    
    def _extract_parameters_from_mcp_docs(self, service_id: str, mcp_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract CloudFormation parameters from MCP documentation using AI"""
        try:
            # Convert MCP docs to text for AI processing
            docs_text = ""
            for doc in mcp_docs:
                docs_text += self._mcp_docs_to_text(doc) + "\\n\\n"
            
            if len(docs_text) > 80000:
                # Use chunking for large documents
                return self._extract_parameters_with_chunking_mcp(service_id, docs_text)
            else:
                # Single AI call for smaller documents
                return self._extract_parameters_single_call_mcp(service_id, docs_text)
                
        except Exception as e:
            logger.error(f"Error extracting parameters from MCP docs: {str(e)}")
            return []
    
    def _mcp_docs_to_text(self, docs: Any) -> str:
        """Convert MCP documentation to text format"""
        if isinstance(docs, str):
            return docs
        elif isinstance(docs, dict):
            # Extract relevant text fields from MCP response
            text_parts = []
            
            # Common MCP response fields
            for field in ['content', 'text', 'description', 'body', 'documentation']:
                if field in docs:
                    text_parts.append(str(docs[field]))
            
            # If no standard fields, convert entire dict to string
            if not text_parts:
                text_parts.append(json.dumps(docs, indent=2))
            
            return "\\n".join(text_parts)
        elif isinstance(docs, list):
            return "\\n".join([self._mcp_docs_to_text(item) for item in docs])
        else:
            return str(docs)
    
    def _extract_actions_single_call_mcp(self, service_id: str, docs_text: str) -> List[Dict[str, Any]]:
        """Extract actions with single AI call from MCP docs"""
        prompt = f"""Extract IAM actions from AWS service documentation obtained via MCP server. Return ONLY valid JSON array.

Service: {service_id}
Source: AWS Documentation MCP Server

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: action_name (string), description (string), access_level (string), resource_types (array), condition_keys (array), dependent_actions (array)
- Use proper JSON formatting with double quotes
- Arrays can be empty [] if no data
- No trailing commas

Format: [{{"action_name":"CreateTopic","description":"Creates a topic","access_level":"Write","resource_types":["topic"],"condition_keys":[],"dependent_actions":[]}}]

MCP Documentation:
{docs_text}"""

        try:
            ai_response = self.bedrock_client.invoke(prompt)
            return self._parse_ai_json_response(ai_response, "MCP actions response")
        except Exception as e:
            logger.error(f"Error in single call MCP actions extraction: {str(e)}")
            return []
    
    def _extract_parameters_single_call_mcp(self, service_id: str, docs_text: str) -> List[Dict[str, Any]]:
        """Extract parameters with single AI call from MCP docs"""
        prompt = f"""Extract CloudFormation properties from AWS documentation obtained via MCP server. Return ONLY valid JSON array.

Service: {service_id}
Source: AWS Documentation MCP Server

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: parameter_name (string), description (string), type (string), required (boolean)
- Use proper JSON formatting with double quotes
- Boolean values must be true or false (not strings)
- No trailing commas

Format: [{{"parameter_name":"ExampleParam","description":"Example description","type":"String","required":true}}]

MCP Documentation:
{docs_text}"""

        try:
            ai_response = self.bedrock_client.invoke(prompt)
            return self._parse_ai_json_response(ai_response, "MCP parameters response")
        except Exception as e:
            logger.error(f"Error in single call MCP parameters extraction: {str(e)}")
            return []
    
    def _extract_actions_with_chunking_mcp(self, service_id: str, docs_text: str) -> List[Dict[str, Any]]:
        """Extract actions using chunking from MCP docs"""
        from content_processor import ContentProcessor
        
        chunks = ContentProcessor.smart_chunk_content(docs_text, 40000, ['Action:', 'action:', '\\n\\n', '. '])
        all_actions = []
        
        logger.info(f"Processing {len(chunks)} MCP chunks for {service_id} actions")
        
        for i, chunk in enumerate(chunks):
            try:
                prompt = f"""Extract IAM actions from this AWS MCP documentation chunk. Return ONLY valid JSON array.

Service: {service_id}
Source: AWS Documentation MCP Server
Chunk: {i+1}/{len(chunks)}

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: action_name (string), description (string), access_level (string), resource_types (array), condition_keys (array), dependent_actions (array)
- Use proper JSON formatting with double quotes
- Arrays can be empty [] if no data
- No trailing commas

Format: [{{"action_name":"CreateTopic","description":"Creates a topic","access_level":"Write","resource_types":["topic"],"condition_keys":[],"dependent_actions":[]}}]

MCP Documentation chunk:
{chunk}"""

                ai_response = self.bedrock_client.invoke(prompt)
                chunk_actions = self._parse_ai_json_response(ai_response, f"MCP chunk {i+1} response")
                
                if chunk_actions:
                    all_actions.extend(chunk_actions)
                    logger.info(f"Extracted {len(chunk_actions)} actions from MCP chunk {i+1}")
                
            except Exception as e:
                logger.error(f"Error processing MCP chunk {i+1}: {str(e)}")
                continue
        
        # Deduplicate actions
        seen_actions = set()
        unique_actions = []
        for action in all_actions:
            action_name = action.get('action_name', '')
            if action_name and action_name not in seen_actions:
                seen_actions.add(action_name)
                unique_actions.append(action)
        
        logger.info(f"Deduplicated {len(all_actions)} MCP actions to {len(unique_actions)} unique actions")
        return unique_actions
    
    def _extract_parameters_with_chunking_mcp(self, service_id: str, docs_text: str) -> List[Dict[str, Any]]:
        """Extract parameters using chunking from MCP docs"""
        from content_processor import ContentProcessor
        
        chunks = ContentProcessor.smart_chunk_content(docs_text, 60000, ['Type:', 'Required:', 'Properties', '\\n\\n', '. '])
        all_parameters = []
        
        logger.info(f"Processing {len(chunks)} MCP chunks for {service_id} parameters")
        
        for i, chunk in enumerate(chunks):
            try:
                prompt = f"""Extract CloudFormation properties from this AWS MCP documentation chunk. Return ONLY valid JSON array.

Service: {service_id}
Source: AWS Documentation MCP Server
Chunk: {i+1}/{len(chunks)}

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: parameter_name (string), description (string), type (string), required (boolean)
- Use proper JSON formatting with double quotes
- Boolean values must be true or false (not strings)
- No trailing commas

Format: [{{"parameter_name":"ExampleParam","description":"Example description","type":"String","required":true}}]

MCP Documentation chunk:
{chunk}"""

                ai_response = self.bedrock_client.invoke(prompt)
                chunk_parameters = self._parse_ai_json_response(ai_response, f"MCP chunk {i+1} response")
                
                if chunk_parameters:
                    all_parameters.extend(chunk_parameters)
                    logger.info(f"Extracted {len(chunk_parameters)} parameters from MCP chunk {i+1}")
                
            except Exception as e:
                logger.error(f"Error processing MCP chunk {i+1}: {str(e)}")
                continue
        
        # Deduplicate parameters
        seen_parameters = set()
        unique_parameters = []
        for param in all_parameters:
            param_name = param.get('parameter_name', '')
            if param_name and param_name not in seen_parameters:
                seen_parameters.add(param_name)
                unique_parameters.append(param)
        
        logger.info(f"Deduplicated {len(all_parameters)} MCP parameters to {len(unique_parameters)} unique parameters")
        return unique_parameters
    
    def _parse_ai_json_response(self, ai_response: str, context: str = "response") -> Optional[List[Dict[str, Any]]]:
        """Parse AI JSON response"""
        try:
            cleaned = ai_response.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI {context} as JSON: {str(e)}")
            logger.error(f"Response was: \\n{ai_response}")
            return None