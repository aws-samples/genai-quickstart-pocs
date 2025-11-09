"""
Bedrock Client Layer
Centralized Bedrock client for AI model interactions
"""
import json
import boto3
import logging
import time
import random
import os
from botocore.exceptions import ClientError

logger = logging.getLogger()

class BedrockClient:
    def __init__(self, model_type='claude-4'):
        self.model_type = model_type
        
        # Configure Bedrock client with timeout settings
        config = boto3.session.Config(
            read_timeout=840,  # 14 minutes (leave 1 min buffer for Lambda)
            connect_timeout=60,  # 1 minute
            retries={'max_attempts': 3}
        )
        self.bedrock_client = boto3.client('bedrock-runtime', config=config)
        
        # Model configurations - using inference profile for Claude Sonnet 4
        self.models = {
            'claude-4': {
                'model_id': 'us.anthropic.claude-sonnet-4-20250514-v1:0',  # Cross-region inference profile
                'max_tokens': 50000,
                'temperature': 0.1
            },
            'nova-pro': {
                'model_id': 'amazon.nova-pro-v1:0',
                'max_tokens': 5120,
                'temperature': 0.1
            }
        }
        
        # Initialize MCP client if available
        self.mcp_client = None
        try:
            from mcp_tools import get_mcp_client
            self.mcp_client = get_mcp_client()
            logger.info("MCP client initialized successfully")
        except ImportError:
            logger.info("MCP tools not available - using direct model calls only")
        
    def invoke(self, prompt, use_mcp_tools=False, max_retries=5, initial_delay=2):
        """Invoke Bedrock model with retry logic and timeout handling"""
        try:
            # Handle both string and dict prompt formats
            if isinstance(prompt, dict):
                prompt_text = prompt.get("prompt", str(prompt))
            else:
                prompt_text = str(prompt)
            
            # Log prompt details with size check
            prompt_size = len(prompt_text)
            if prompt_size > 200000:  # >200k chars
                logger.warning(f"Large prompt detected: {prompt_size} characters - may cause timeout")
            
            logger.info(f"GenSec Agent prompt (model: {self.model_type}, length: {prompt_size}): {prompt_text}")
             
            model_config = self.models.get(self.model_type)
            if not model_config:
                raise ValueError(f"Unsupported model type: {self.model_type}")
                
            # Prepare request body based on model type
            if self.model_type == 'claude-4':
                body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": model_config['max_tokens'],
                    "temperature": model_config['temperature'],
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt_text
                        }
                    ]
                }
            elif self.model_type == 'nova-pro':
                body = {
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"text": prompt_text}]
                        }
                    ],
                    "inferenceConfig": {
                        "max_new_tokens": model_config['max_tokens'],
                        "temperature": model_config['temperature']
                    }
                }
            
            # Invoke with retry logic
            for attempt in range(max_retries):
                try:
                    start_time = time.time()
                    response = self.bedrock_client.invoke_model(
                        modelId=model_config['model_id'],
                        body=json.dumps(body),
                        contentType='application/json'
                    )
                    
                    elapsed_time = time.time() - start_time
                    logger.info(f"Bedrock invocation completed in {elapsed_time:.2f} seconds")
                    
                    response_body = json.loads(response['body'].read())
                    
                    # Extract content based on model type
                    if self.model_type == 'claude-4':
                        if 'content' in response_body and response_body['content']:
                            result = response_body['content'][0]['text']
                            logger.info(f"Bedrock response (length: {len(result)}): {result}")
                            return result
                    elif self.model_type == 'nova-pro':
                        if 'output' in response_body and 'message' in response_body['output']:
                            result = response_body['output']['message']['content'][0]['text']
                            logger.info(f"Bedrock response (length: {len(result)}): {result}")
                            return result
                    
                    logger.info(f"Bedrock response (raw): {str(response_body)}")
                    return response_body
                    
                except ClientError as e:
                    error_code = e.response['Error']['Code']
                    if error_code == 'ThrottlingException':
                        if attempt < max_retries - 1:
                            delay = initial_delay * (2 ** attempt) + random.uniform(0, 1)
                            logger.warning(f"Throttled, retrying in {delay:.2f}s (attempt {attempt + 1})")
                            time.sleep(delay)
                            continue
                    elif error_code == 'ValidationException':
                        logger.error(f"Validation error: {str(e)} - prompt may be too large")
                        raise ValueError(f"Prompt validation failed: {str(e)}")
                    raise
                except Exception as e:
                    if "timeout" in str(e).lower() or "timed out" in str(e).lower():
                        logger.error(f"Timeout on attempt {attempt + 1}: {str(e)}")
                        if attempt < max_retries - 1:
                            delay = initial_delay * (2 ** attempt)
                            logger.warning(f"Retrying after timeout in {delay:.2f}s")
                            time.sleep(delay)
                            continue
                    raise
                    
        except Exception as e:
            logger.error(f"Error invoking Bedrock: {str(e)}")
            raise

class BedrockAgentClient:
    def __init__(self, model_type='claude-4'):
        self.bedrock_agent = boto3.client('bedrock-agent-runtime')
        # Get agent configuration from environment variables
        self.agent_id = os.environ.get('STRANDS_AGENT_ID')
        self.agent_alias_id = os.environ.get('STRANDS_AGENT_ALIAS_ID')
        
        if not self.agent_id or not self.agent_alias_id:
            raise ValueError("STRANDS_AGENT_ID and STRANDS_AGENT_ALIAS_ID environment variables must be set")
        self.model_type = model_type
        
    def invoke(self, prompt, use_mcp_tools=False, max_retries=5, initial_delay=5):
        """Invoke Strands Agent with optional MCP tools"""
        try:
            # Handle both string and dict prompt formats
            if isinstance(prompt, dict):
                prompt_text = prompt.get("prompt", str(prompt))
            else:
                prompt_text = str(prompt)
            
            # Enhanced prompt with model preference and MCP tools context
            model_context = f"[Model: {self.model_type}]"
            if use_mcp_tools:
                model_context += " [MCP: enabled]"
            enhanced_prompt = f"{model_context} {prompt_text}"
            
            # Generate session ID
            session_id = f"session-{int(time.time())}-{random.randint(1000, 9999)}"
            
            logger.info(f"GenSec Agent prompt (model: {self.model_type}, MCP: {use_mcp_tools}, length: {len(enhanced_prompt)}): {enhanced_prompt}")
            
            # Prepare invoke parameters
            invoke_params = {
                'agentId': self.agent_id,
                'agentAliasId': self.agent_alias_id,
                'sessionId': session_id,
                'inputText': enhanced_prompt
            }
            
            # Add MCP tools if requested
            if use_mcp_tools:
                try:
                    from mcp_tools import get_mcp_tools
                    invoke_params['toolConfig'] = get_mcp_tools()
                    logger.info("Added MCP tools to agent invocation")
                except ImportError:
                    logger.warning("MCP tools not available")
            
            # Invoke with aggressive retry logic for throttling
            for attempt in range(max_retries):
                try:
                    response = self.bedrock_agent.invoke_agent(**invoke_params)
                    result = self._extract_agent_response(response)
                    logger.info(f"GenSec Agent response (length: {len(result)}): {result}")
                    return result
                    
                except ClientError as e:
                    error_code = e.response['Error']['Code']
                    if error_code == 'ValidationException':
                        logger.error(f"Agent validation error: {str(e)}")
                        raise ValueError(f"Agent configuration error: {str(e)}")
                    elif error_code in ['ThrottlingException', 'TooManyRequestsException']:
                        if attempt < max_retries - 1:
                            # Aggressive exponential backoff for throttling
                            delay = initial_delay * (3 ** attempt) + random.uniform(1, 5)
                            logger.warning(f"Agent throttled, retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                            time.sleep(delay)
                            continue
                        else:
                            logger.error(f"Max retries exceeded for throttling. Consider reducing request frequency.")
                            raise
                    raise
                except Exception as e:
                    # Catch any other exceptions (including from response extraction)
                    if "throttling" in str(e).lower() and attempt < max_retries - 1:
                        delay = initial_delay * (3 ** attempt) + random.uniform(1, 5)
                        logger.warning(f"Throttling during response processing, retrying in {delay:.2f}s (attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                        continue
                    raise
                    
        except Exception as e:
            logger.error(f"Error invoking GenSec Agent: {str(e)}")
            raise
    
    def _extract_agent_response(self, response):
        """Extract text from agent response stream"""
        try:
            # Handle streaming response from bedrock-agent-runtime
            if 'completion' in response:
                completion = response['completion']
                
                # Process the event stream
                full_response = ""
                for event in completion:
                    if 'chunk' in event:
                        chunk = event['chunk']
                        if 'bytes' in chunk:
                            # Decode the bytes to get the actual text
                            chunk_text = chunk['bytes'].decode('utf-8')
                            full_response += chunk_text
                
                return full_response.strip()
            
            # Fallback to string representation if structure is different
            return str(response)
            
        except Exception as e:
            logger.error(f"Error extracting agent response: {str(e)}")
            logger.error(f"Response structure: {response}")
            # Return the string representation as fallback
            return str(response)

def get_bedrock_client(model_type='claude-4'):
    """Factory function - transparent agent integration"""
    # Check if Strands Agent should be used (via environment variable)
    use_strands_agent = os.environ.get('USE_STRANDS_AGENT', 'false').lower() == 'true'
    
    if use_strands_agent:
        logger.info(f"Using Strands Agent with model preference: {model_type}")
        return BedrockAgentClient(model_type)  # Agent with model preference
    else:
        logger.info(f"Using direct Bedrock model: {model_type}")
        return BedrockClient(model_type)       # Direct model invocation
