import boto3
import requests
from bs4 import BeautifulSoup
import json
import logging
import os
import re
from datetime import datetime
from botocore.exceptions import ClientError
import time
from urllib.parse import urljoin
from bedrock_client import get_bedrock_client
from content_processor import ContentProcessor
from mcp_documentation_collector import MCPDocumentationCollector
from service_name_resolver import ServiceNameResolver

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class AWSServiceDocumentationCollector:
    def __init__(self):
        self.dynamodb = boto3.client('dynamodb')
        self.s3 = boto3.client('s3')
        
        # Initialize centralized Bedrock client
        self.bedrock_client = get_bedrock_client('claude-4')  # Change between 'nova-pro' and 'claude' to switch models
        
        # Check if using Strands Agent or direct model invocation
        self.use_strands_agent = os.environ.get('USE_STRANDS_AGENT', 'false').lower() == 'true'
        
        # Configure chunking limits based on invocation method
        if self.use_strands_agent:
            # Strands Agent has 6-7K EventStream output limit
            # With pagination (20 actions/page) and sub-service splitting, we can use larger chunks
            # 25K input → ~100 actions → paginated into 5 pages of 20 actions each
            # Each page stays under 6K output limit
            # Note: EC2 sub-services use direct model invocation (configured per service)
            self.actions_chunk_threshold = 20000  # Trigger chunking above 20K
            self.actions_chunk_size = 25000       # 25K chunks → ~100 actions → 5 pages
            self.params_chunk_threshold = 20000   # Trigger chunking above 20K
            self.params_chunk_size = 30000        # 30K chunks → paginated extraction
            logger.info("Using Strands Agent with optimized chunking (actions: 20K/25K, params: 20K/30K) + pagination")
        else:
            # Direct model invocation has 50K token output limit
            # However, model reliability decreases with large extraction tasks
            # Keep chunks small enough that extraction count stays manageable (20-30 actions)
            self.actions_chunk_threshold = 20000  # Trigger chunking above 20K
            self.actions_chunk_size = 12000       # 12K chunks → ~20-30 actions per chunk
            self.params_chunk_threshold = 30000   # Trigger chunking above 30K
            self.params_chunk_size = 20000        # 20K chunks
            logger.info("🔧 DEPLOYMENT VERIFICATION: Using direct model invocation with 12K chunks (UPDATED CODE v2024-11-20)")
            logger.info(f"   Actions: threshold={self.actions_chunk_threshold}, size={self.actions_chunk_size}")
            logger.info(f"   Params: threshold={self.params_chunk_threshold}, size={self.params_chunk_size}")
        
        # MCP documentation collector (lazy-loaded when needed)
        self.mcp_collector = None
        self.use_mcp = os.environ.get('USE_MCP_DOCUMENTATION', 'false').lower() == 'true'  # Disable MCP by default until server is available
        
        self.documentation_bucket = os.environ['DOCUMENTATION_BUCKET']
        self.input_bucket = os.environ.get('S3_INPUT_BUCKET', self.documentation_bucket)
        self.service_actions_table = os.environ['DYNAMODB_TABLE_SERVICE_ACTIONS']
        self.service_parameters_table = os.environ['DYNAMODB_TABLE_SERVICE_PARAMETERS']
        self.service_inventory_table = os.environ['DYNAMODB_TABLE_SERVICE_INVENTORY']
        
        # Load service mappings from S3
        self.service_mappings = self._load_service_mappings()
        
        # Initialize service name resolver
        self.service_resolver = ServiceNameResolver(self.service_mappings) if self.service_mappings else None
        
        # Force container refresh for quicksuite mapping - 2025-12-22
        
        # Request session with retry logic
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AWS-Documentation-Collector/1.0'
        })
    
    def _get_service_extraction_config(self, service_id):
        """
        Get extraction configuration for a specific service.
        Checks service config first, then parent service config, then environment variables.
        
        Returns: (use_strands_agent, use_mcp)
        """
        service_config = self.service_mappings.get(service_id.lower(), {})
        extraction_config = service_config.get('extraction_config', {})
        
        # If no config at service level, check parent service
        if not extraction_config:
            parent_service = service_config.get('parent_service')
            if parent_service:
                parent_config = self.service_mappings.get(parent_service.lower(), {})
                extraction_config = parent_config.get('extraction_config', {})
                if extraction_config:
                    logger.info(f"📋 Service '{service_id}' inheriting extraction config from parent '{parent_service}'")
        
        if extraction_config:
            use_strands = extraction_config.get('use_strands_agent', self.use_strands_agent)
            use_mcp = extraction_config.get('use_mcp', self.use_mcp)
            reason = extraction_config.get('reason', '')
            
            # Log override if different from environment variables
            if use_strands != self.use_strands_agent or use_mcp != self.use_mcp:
                logger.info(f"⚙️ Service '{service_id}' extraction config override:")
                logger.info(f"   Strands Agent: {self.use_strands_agent} → {use_strands}")
                logger.info(f"   MCP: {self.use_mcp} → {use_mcp}")
                if reason:
                    logger.info(f"   Reason: {reason}")
            
            return use_strands, use_mcp
        
        # No override - use environment variables
        return self.use_strands_agent, self.use_mcp
        
        # Request session with retry logic
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AWS-Documentation-Collector/1.0'
        })
    
    def _load_service_mappings(self):
        """Load service mappings from S3 configuration file"""
        try:
            logger.info("Loading service mappings from S3...")
            
            # Try to load from input bucket first, fallback to documentation bucket
            buckets_to_try = [self.input_bucket, self.documentation_bucket]
            
            for bucket in buckets_to_try:
                try:
                    response = self.s3.get_object(
                        Bucket=bucket,
                        Key='configuration/service-mappings.json'
                    )
                    
                    mappings_data = json.loads(response['Body'].read().decode('utf-8'))
                    logger.info(f"Successfully loaded service mappings from {bucket}")
                    
                    # Extract just the services section for backward compatibility
                    if 'services' in mappings_data:
                        return mappings_data['services']
                    else:
                        return mappings_data
                        
                except ClientError as e:
                    if e.response['Error']['Code'] == 'NoSuchKey':
                        logger.warning(f"Service mappings not found in {bucket}")
                        continue
                    else:
                        logger.warning(f"Error loading from {bucket}: {str(e)}")
                        continue
            
            # Fallback to hardcoded mappings if S3 load fails
            logger.warning("Could not load service mappings from S3, using fallback mappings")
            return self._get_fallback_service_mappings()
            
        except Exception as e:
            logger.error(f"Error loading service mappings: {str(e)}")
            return self._get_fallback_service_mappings()
    
    def _expand_service_request(self, service_id):
        """
        Expand parent services to their sub-services.
        
        Examples:
        - 'bedrock' → ['bedrock-foundation-models', 'bedrock-guardrails', 'bedrock-knowledge-bases']
        - 'bedrock-all' → ['bedrock-foundation-models', 'bedrock-guardrails', ..., 'bedrock-data-automation']
        - 'bedrock-agents' → ['bedrock-agents'] (no expansion)
        
        Returns:
            List of service IDs to process
        """
        service_mapping = self.service_mappings.get(service_id.lower(), {})
        
        # Check if this is a parent service with sub-services
        if service_mapping.get('is_parent_service'):
            sub_services = service_mapping.get('sub_services', [])
            expansion_type = service_mapping.get('expansion_type', 'core')
            
            if sub_services:
                logger.info(f"Expanding '{service_id}' ({expansion_type}) to {len(sub_services)} sub-services: {sub_services}")
                return sub_services
        
        # Not a parent service, return as-is
        return [service_id]
    
    def _filter_actions_by_patterns(self, service_id, actions):
        """
        Filter actions based on action_filter_patterns and action_exclude_patterns.
        
        Used for sub-services that share the same IAM documentation page but need
        different subsets of actions (e.g., Bedrock sub-services).
        
        Args:
            service_id: Service ID to get filter patterns for
            actions: List of action dictionaries
            
        Returns:
            Filtered list of actions
        """
        service_config = self.service_mappings.get(service_id.lower(), {})
        filter_patterns = service_config.get('action_filter_patterns', [])
        exclude_patterns = service_config.get('action_exclude_patterns', [])
        
        # No filtering if no patterns configured
        if not filter_patterns and not exclude_patterns:
            return actions
        
        filtered_actions = []
        
        for action in actions:
            action_name = action.get('action_name', '')
            
            # Apply exclude patterns first
            if exclude_patterns:
                excluded = any(pattern in action_name for pattern in exclude_patterns)
                if excluded:
                    logger.debug(f"Excluding action {action_name} (matches exclude pattern)")
                    continue
            
            # Apply include patterns
            if filter_patterns:
                included = any(pattern in action_name for pattern in filter_patterns)
                if included:
                    filtered_actions.append(action)
                else:
                    logger.debug(f"Filtering out action {action_name} (doesn't match filter patterns)")
            else:
                # No include patterns, just exclude patterns were applied
                filtered_actions.append(action)
        
        if filter_patterns or exclude_patterns:
            logger.info(f"Filtered actions for {service_id}: {len(actions)} → {len(filtered_actions)} actions")
            if filter_patterns:
                logger.info(f"  Include patterns: {filter_patterns}")
            if exclude_patterns:
                logger.info(f"  Exclude patterns: {exclude_patterns}")
        
        return filtered_actions
    
    def _get_fallback_service_mappings(self):
        """Fallback service mappings if S3 load fails"""
        return {
            'dynamodb': {
                'resource_types': ['dynamodb-table', 'dynamodb-globaltable'],
                'iam_service_name': 'dynamodb'
            },
            'lambda': {
                'resource_types': ['lambda-function', 'lambda-layerversion'],
                'iam_service_name': 'lambda'
            },
            's3': {
                'resource_types': ['s3-bucket', 's3-bucketpolicy'],
                'iam_service_name': 's3'
            },
            'ec2': {
                'resource_types': ['ec2-instance', 'ec2-vpc', 'ec2-subnet', 'ec2-securitygroup'],
                'iam_service_name': 'ec2'
            },
            'iam': {
                'resource_types': ['iam-role', 'iam-policy', 'iam-user'],
                'iam_service_name': 'iam'
            },
            'sns': {
                'resource_types': ['sns-topic', 'sns-subscription'],
                'iam_service_name': 'sns'
            },
            'sqs': {
                'resource_types': ['sqs-queue', 'sqs-queuepolicy'],
                'iam_service_name': 'sqs'
            }
        }
    
    def _make_request(self, url, max_retries=3, timeout=30):
        """Make HTTP request with retry logic"""
        for attempt in range(max_retries):
            try:
                logger.info(f"Attempting to fetch {url} (attempt {attempt + 1}/{max_retries})")
                response = self.session.get(url, timeout=timeout)
                
                if response.status_code == 200:
                    return response
                elif response.status_code in [301, 302]:
                    # Handle redirects
                    redirect_url = response.headers.get('Location')
                    if redirect_url:
                        logger.info(f"Following redirect to: {redirect_url}")
                        return self._make_request(redirect_url, max_retries - attempt - 1, timeout)
                else:
                    logger.warning(f"HTTP {response.status_code} for {url}")
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout for {url} on attempt {attempt + 1}")
            except requests.exceptions.RequestException as e:
                logger.warning(f"Request error for {url} on attempt {attempt + 1}: {str(e)}")
            
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
        
        return None

    def _generate_service_url_patterns(self, service_id):
        """Generate smart URL patterns for AWS service documentation"""
        service_id_lower = service_id.lower()
        
        # Generate standard patterns
        patterns = []
        
        # Pattern 1: list_amazon{service} (most common)
        patterns.append(f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazon{service_id_lower}.html")
        
        # Pattern 2: list_{service} (for services without amazon prefix)
        patterns.append(f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_{service_id_lower}.html")
        
        # Pattern 3: list_aws{service} (for AWS-prefixed services)
        patterns.append(f"https://docs.aws.amazon.com/service-authorization/latest/reference/list_aws{service_id_lower}.html")
        
        return patterns

    def collect_service_actions(self, service_id):
        """Collect IAM actions using MCP server or fallback to web scraping"""
        try:
            logger.info(f"Collecting actions for service: {service_id}")
            
            # Get service-specific extraction configuration (overrides environment variables)
            use_strands, use_mcp = self._get_service_extraction_config(service_id)
            
            # Try MCP first if enabled for this service
            if use_mcp:
                # Lazy-load MCP collector on first use
                if self.mcp_collector is None:
                    self.mcp_collector = MCPDocumentationCollector()
                
                logger.info(f"Using MCP server for {service_id} actions")
                mcp_actions = self.mcp_collector.collect_service_actions_mcp(service_id)
                if mcp_actions:
                    logger.info(f"Successfully collected {len(mcp_actions)} actions via MCP")
                    return mcp_actions
                else:
                    logger.warning(f"MCP failed for {service_id}, falling back to web scraping")
            
            # Fallback to web scraping with appropriate extraction method
            if use_strands:
                logger.info(f"Using web scraping with Strands Agent for {service_id} actions")
            else:
                logger.info(f"Using web scraping with direct model invocation for {service_id} actions")
            
            all_actions = self._extract_actions_with_ai_v2(service_id, use_strands_agent=use_strands)
            
            logger.info(f"Total actions collected for {service_id}: {len(all_actions)}")
            return all_actions
            
        except Exception as e:
            logger.error(f"Error collecting actions for service {service_id}: {str(e)}")
            return []

    def collect_service_parameters(self, service_id):
        """Collect CloudFormation parameters using MCP server or fallback to web scraping"""
        try:
            logger.info(f"Collecting parameters for service: {service_id}")
            
            # Try MCP first if enabled
            if self.use_mcp:
                # Lazy-load MCP collector on first use
                if self.mcp_collector is None:
                    self.mcp_collector = MCPDocumentationCollector()
                
                logger.info(f"Using MCP server for {service_id} parameters")
                mcp_parameters = self.mcp_collector.collect_service_parameters_mcp(service_id)
                if mcp_parameters:
                    logger.info(f"Successfully collected {len(mcp_parameters)} parameters via MCP")
                    return mcp_parameters
                else:
                    logger.warning(f"MCP failed for {service_id}, falling back to web scraping")
            
            # Fallback to web scraping
            logger.info(f"Using web scraping fallback for {service_id} parameters")
            all_parameters = self._extract_parameters_with_ai(service_id)
            
            return all_parameters
            
        except Exception as e:
            logger.error(f"Error collecting parameters for service {service_id}: {str(e)}")
            logger.error("Full traceback: ", exc_info=True)
            return []
    

    def store_documentation(self, service_id, data_type, data):
        """Store collected documentation in DynamoDB and S3"""
        try:
            # Determine the correct table name based on data type
            if data_type == 'Actions':
                table_name = self.service_actions_table
            elif data_type == 'Parameters':
                table_name = self.service_parameters_table
            else:
                table_name = self.service_inventory_table
                
            logger.info(f"Storing {len(data)} items in DynamoDB table {table_name}")
            
            for item in data:
                try:
                    logger.debug(f'item: {str(item)}')
                    dynamodb_item = self._convert_to_dynamodb_item(item)
                    self.dynamodb.put_item(
                        TableName=table_name,
                        Item=dynamodb_item
                    )
                except Exception as e:
                    logger.error(f"Error storing item in DynamoDB: {str(e)}")
                    continue
            
            # Store in S3
            timestamp = datetime.now().strftime('%Y%m%d')
            s3_key = f"{service_id}/{data_type}/raw_data_{timestamp}.json"
            
            self.s3.put_object(
                Bucket=self.documentation_bucket,
                Key=s3_key,
                Body=json.dumps(data, indent=2),
                ContentType='application/json'
            )
            
            logger.info(f"Stored documentation in S3: {s3_key}")
            
        except Exception as e:
            logger.error(f"Error storing documentation: {str(e)}")
            raise

    def _convert_to_dynamodb_item(self, item):
        """Convert Python dict to DynamoDB format"""
        dynamodb_item = {}
        for key, value in item.items():
            if isinstance(value, str):
                dynamodb_item[key] = {'S': value}
            elif isinstance(value, bool):
                dynamodb_item[key] = {'BOOL': value}
            elif isinstance(value, (int, float)):
                dynamodb_item[key] = {'N': str(value)}
            elif isinstance(value, list):
                if value:
                    dynamodb_item[key] = {'L': [{'S': str(v)} for v in value if v]}
                else:
                    dynamodb_item[key] = {'L': []}
            elif isinstance(value, dict):
                dynamodb_item[key] = {'M': self._convert_to_dynamodb_item(value)}
            elif value is None:
                continue
        return dynamodb_item

    def _fetch_cloudformation_pages_for_ai(self, service_id):
        """Fetch CloudFormation documentation pages for AI processing"""
        # Get resource types from loaded service mappings
        service_config = self.service_mappings.get(service_id.lower(), {})
        resource_types = service_config.get('resource_types', [service_id.lower()])
        html_contents = []
        
        for resource_type in resource_types:
            url = f"https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-{resource_type}.html"
            try:
                response = self._make_request(url)
                if response and response.status_code == 200:
                    html_contents.append({
                        'resource_type': resource_type,
                        'url': url,
                        'content': response.text
                    })
            except Exception as e:
                logger.warning(f"Failed to fetch {url}: {str(e)}")
        
        return html_contents

    def _parse_ai_json_response(self, ai_response, context="response"):
        """Parse AI JSON response with handling for truncated responses and extra data"""
        try:
            # Remove any leading/trailing whitespace
            cleaned = ai_response.strip()
            
            # Try to parse as-is first
            return json.loads(cleaned)
            
        except json.JSONDecodeError as e:
            # Log as ERROR - this is a failure that needs recovery
            logger.error(f"❌ Failed to parse AI {context} as JSON: {str(e)}")
            
            # Handle "Extra data" error - AI added content after valid JSON
            if "Extra data" in str(e):
                logger.warning(f"⚠️ AI added extra content after JSON. Extracting first valid JSON array...")
                try:
                    # Parse up to the error position to get the valid JSON
                    cleaned = ai_response.strip()
                    if cleaned.startswith('['):
                        # Find the closing bracket of the first complete array
                        bracket_count = 0
                        for i, char in enumerate(cleaned):
                            if char == '[':
                                bracket_count += 1
                            elif char == ']':
                                bracket_count -= 1
                                if bracket_count == 0:
                                    # Found the end of the first complete array
                                    valid_json = cleaned[:i+1]
                                    result = json.loads(valid_json)
                                    logger.info(f"✓ Successfully extracted {len(result)} items from first JSON array (ignored extra content)")
                                    return result
                except Exception as extract_error:
                    logger.error(f"❌ Failed to extract first JSON array: {str(extract_error)}")
            
            # Check if response appears truncated (unterminated string/array)
            elif "Unterminated string" in str(e) or "Expecting" in str(e):
                logger.error(f"❌ Response truncated at {e.pos} chars (model output limit or reliability issue)")
                logger.error(f"❌ Truncated responses are not acceptable - this extraction attempt has failed")
                # Don't attempt partial recovery - let retry logic handle it or fail completely
            
            # Log the error with truncated response preview
            response_preview = ai_response[:500] + "..." if len(ai_response) > 500 else ai_response
            logger.error(f"Response preview: {response_preview}")
            logger.error(f"Response length: {len(ai_response)} chars")
            return None

    def _invoke_bedrock(self, prompt):
        """Centralized Bedrock invocation using shared client"""
        try:
            # max_tokens is configured in the bedrock client layer, not passed as parameter
            return self.bedrock_client.invoke(prompt)
        except Exception as e:
            logger.error(f"Error invoking Bedrock: {str(e)}")
            raise

    def _extract_actions_with_ai_v2(self, service_id, use_strands_agent=None):
        """Use AI to extract actions from service authorization URLs with content chunking"""
        all_actions = []
        
        # Use provided parameter or fall back to instance variable
        if use_strands_agent is None:
            use_strands_agent = self.use_strands_agent
        
        logger.info(f"Starting AI action extraction for {service_id} (Strands Agent: {use_strands_agent})")
        
        # Get URLs from service_mappings
        service_config = self.service_mappings.get(service_id.lower(), {})
        urls = service_config.get('service_authorization_url', [])  # Fixed: was 'service_authorization_urls' (plural)
        
        # If no URLs in service_mappings, fall back to generated patterns
        if not urls:
            logger.info(f"No service_authorization_url in mappings for {service_id}, using generated patterns")
            urls = self._generate_service_url_patterns(service_id)
        else:
            logger.info(f"Using {len(urls)} URLs from service mappings for {service_id}")
        
        for url in urls:
            try:
                logger.info(f"Processing URL: {url}")
                
                # Fetch individual page
                response = self._make_request(url)
                if not response or response.status_code != 200:
                    logger.warning(f"Failed to fetch {url}")
                    continue
                
                # Skip if redirected to main reference page (invalid service URL)
                if 'reference.html' in response.url or response.url.endswith('/reference/'):
                    logger.info(f"Skipping redirected URL (invalid service): {url} -> {response.url}")
                    continue
                
                # Extract and clean content more aggressively
                text_content = ContentProcessor.extract_section_content(response.text, 'actions')
                logger.info(f"Extracted text content: {len(text_content)} characters")
                
                # Check if content needs chunking based on invocation method
                # Strands Agent: 20K threshold (6-7K output limit per response)
                # Direct model: 50K threshold (50K token output limit)
                chunk_threshold = 20000 if use_strands_agent else 50000
                
                if len(text_content) > chunk_threshold:
                    logger.info(f"Content too large ({len(text_content)} chars > {chunk_threshold}), using chunking approach")
                    actions_data = self._extract_actions_with_chunking(service_id, text_content, url, use_strands_agent)
                else:
                    logger.info(f"Content size OK ({len(text_content)} chars ≤ {chunk_threshold}), using single call")
                    actions_data = self._extract_actions_single_call(service_id, text_content, url, use_strands_agent)
                
                if not actions_data:
                    continue
                
                logger.info(f"Successfully parsed {len(actions_data)} actions from AI response")
                
                # Add metadata to each action
                for action in actions_data:
                    action.update({
                        'service_id': service_id,
                        'service_action': f"{service_id.lower()}:{action.get('action_name', '')}",
                        'last_updated': datetime.now().isoformat(),
                        'extraction_method': 'ai',
                        'source_url': url
                    })
                    all_actions.append(action)
                
                logger.info(f"Extracted {len(actions_data)} actions from {url}")
                
            except Exception as e:
                logger.error(f"Error using AI to extract actions from {url}: {str(e)}")
                continue
        
        # Apply action filtering if configured for this service
        all_actions = self._filter_actions_by_patterns(service_id, all_actions)
        
        logger.info(f"AI action extraction completed for {service_id}. Total actions extracted: {len(all_actions)}")
        return all_actions

    def _extract_actions_single_call(self, service_id, text_content, url, use_strands_agent=True):
        """Extract actions with single AI call"""
        # Note: use_strands_agent parameter available for future use if needed
        prompt = f"""Extract IAM actions from AWS service authorization documentation. Return ONLY valid JSON array.

Service: {service_id}

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: action_name (string), description (string), access_level (string), resource_types (array), condition_keys (array), dependent_actions (array)
- Use proper JSON formatting with double quotes
- Arrays can be empty [] if no data
- No trailing commas

Format: [{{"action_name":"CreateTopic","description":"Creates a topic","access_level":"Write","resource_types":["topic"],"condition_keys":[],"dependent_actions":[]}}]

Documentation:
{text_content}"""

        ai_response = self._invoke_bedrock(prompt)
        return self._parse_ai_json_response(ai_response, "actions response")

    def _extract_actions_with_chunking(self, service_id, text_content, url, use_strands_agent=True):
        """Extract actions using agent-controlled pagination to avoid EventStream truncation"""
        
        if use_strands_agent:
            # Use agent-controlled pagination for Strands Agent
            return self._extract_actions_with_pagination(service_id, text_content, url)
        else:
            # Use traditional chunking for direct model invocation
            return self._extract_actions_with_traditional_chunking(service_id, text_content, url)
    
    def _extract_actions_with_pagination(self, service_id, text_content, url):
        """Extract actions using agent-controlled pagination to stay under EventStream limits"""
        # Use larger chunks (10K-15K) and let agent paginate the output
        chunks = ContentProcessor.smart_chunk_content(
            text_content, 
            15000,  # Larger chunks since agent will paginate
            [' Grants permission to ', '\n\n']
        )
        logger.info(f"Content length: {len(text_content)}, Created {len(chunks)} chunks for pagination")
        all_actions = []
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars) with pagination")
            
            # Process this chunk with pagination
            chunk_actions = self._extract_chunk_with_pagination(service_id, chunk, i+1, len(chunks))
            
            if chunk_actions:
                all_actions.extend(chunk_actions)
                logger.info(f"✓ Chunk {i+1}/{len(chunks)}: Extracted {len(chunk_actions)} actions (Total: {len(all_actions)})")
            else:
                logger.error(f"✗ Chunk {i+1}/{len(chunks)}: Failed to extract any actions")
        
        # Deduplicate
        seen_actions = set()
        unique_actions = []
        for action in all_actions:
            action_name = action.get('action_name', '')
            if action_name and action_name not in seen_actions:
                seen_actions.add(action_name)
                unique_actions.append(action)
        
        logger.info(f"Extracted {len(unique_actions)} unique actions from {len(all_actions)} total")
        return unique_actions
    
    def _extract_chunk_with_pagination(self, service_id, chunk, chunk_num, total_chunks):
        """Extract actions from a single chunk using agent pagination"""
        all_actions = []
        page = 1
        continue_from = None
        max_pages = 100  # Safety limit - with 20 actions/page, allows up to 2000 actions per chunk
        
        while page <= max_pages:
            try:
                continue_instruction = f"\n- START extracting from action: {continue_from}" if continue_from else ""
                
                prompt = f"""Extract IAM actions from this AWS documentation chunk. Return ONLY valid JSON.

Service: {service_id}
Chunk: {chunk_num}/{total_chunks}, Page: {page}

CRITICAL EXTRACTION RULES:
1. Extract EXACTLY 20 actions (or fewer if less than 20 remain)
2. Do NOT extract more than 20 actions in a single response
3. If more actions exist after these 20, set "has_more": true
4. Always set "last_action" to the name of the final action you extracted

Requirements:
- Return ONLY a JSON object with this structure: {{"actions": [...], "has_more": true/false, "last_action": "ActionName"}}
- Each action object must have: action_name, description, access_level, resource_types, condition_keys, dependent_actions
- Extract actions sequentially from the documentation
- Stop after 20 actions even if more exist in the chunk{continue_instruction}

Example response with 20 actions:
{{"actions":[{{"action_name":"Action1",...}},{{"action_name":"Action2",...}},...,{{"action_name":"Action20",...}}],"has_more":true,"last_action":"Action20"}}

Example response with final 7 actions:
{{"actions":[{{"action_name":"Action1",...}},...,{{"action_name":"Action7",...}}],"has_more":false,"last_action":"Action7"}}

Documentation chunk:
{chunk}"""

                ai_response = self._invoke_bedrock(prompt)
                response_data = self._parse_ai_json_response(ai_response, f"chunk {chunk_num} page {page}")
                
                if not response_data:
                    logger.error(f"Failed to parse response for chunk {chunk_num} page {page}")
                    break
                
                # Handle both array and object responses
                if isinstance(response_data, list):
                    # Old format - just an array
                    all_actions.extend(response_data)
                    logger.info(f"✓ Chunk {chunk_num} Page {page}: Extracted {len(response_data)} actions (no pagination info)")
                    break
                elif isinstance(response_data, dict):
                    # New pagination format
                    page_actions = response_data.get('actions', [])
                    has_more = response_data.get('has_more', False)
                    last_action = response_data.get('last_action', '')
                    
                    # Validate extraction count
                    action_count = len(page_actions)
                    if action_count > 20:
                        logger.warning(f"⚠️ Model extracted {action_count} actions (expected ≤20) on chunk {chunk_num} page {page}")
                    elif action_count < 10 and has_more:
                        logger.warning(f"⚠️ Model extracted only {action_count} actions but has_more=true on chunk {chunk_num} page {page}")
                    
                    all_actions.extend(page_actions)
                    logger.info(f"✓ Chunk {chunk_num} Page {page}: Extracted {action_count} actions, has_more={has_more}, last={last_action}")
                    
                    if not has_more or not last_action:
                        break
                    
                    continue_from = last_action
                    page += 1
                else:
                    logger.error(f"Unexpected response format: {type(response_data)}")
                    break
                    
            except Exception as e:
                logger.error(f"Error processing chunk {chunk_num} page {page}: {str(e)}")
                break
        
        if page > max_pages:
            logger.warning(f"⚠️ Hit max pages ({max_pages}) for chunk {chunk_num}")
        
        return all_actions
    
    def _extract_actions_with_traditional_chunking(self, service_id, text_content, url):
        """Extract actions using traditional pre-chunking (for direct model invocation)"""
        chunks = ContentProcessor.smart_chunk_content(
            text_content, 
            self.actions_chunk_size,
            [' Grants permission to ', '\n\n']
        )
        logger.info(f"Content length: {len(text_content)}, Created {len(chunks)} chunks")
        all_actions = []
        failed_chunks = []
        
        logger.info(f"Processing {len(chunks)} smart chunks for {service_id}")
        
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
                
                # Count approximate number of actions in chunk for validation
                # Each action has "Grants permission to" in its description
                action_count_estimate = chunk.count('Grants permission to')
                
                # Sanity check: if count seems wrong, log warning
                if action_count_estimate == 0:
                    logger.warning(f"⚠️ Chunk {i+1}/{len(chunks)}: No actions detected (chunk may be malformed)")
                elif action_count_estimate > 100:
                    logger.warning(f"⚠️ Chunk {i+1}/{len(chunks)}: Detected {action_count_estimate} actions (unusually high, chunk may be too large)")
                
                prompt = f"""TASK: Extract exactly {action_count_estimate} IAM actions from AWS documentation. Return complete JSON array.

DO NOT SAMPLE. DO NOT TRUNCATE. DO NOT SUMMARIZE. Extract EVERY SINGLE action.

This chunk contains {action_count_estimate} actions. Your response must contain {action_count_estimate} complete action objects.

Service: {service_id}
Chunk: {i+1}/{len(chunks)}

REQUIRED OUTPUT:
- Start with [
- Include ALL {action_count_estimate} action objects
- Each object format: {{"action_name":"string","description":"string","access_level":"string","resource_types":[],"condition_keys":[],"dependent_actions":[]}}
- End with ]
- NO comments, NO explanations, NO markdown, NO "..." placeholders, NO "Additional actions would continue"

WRONG - DO NOT DO THIS:
[{{"action_name":"Action1",...}},{{"action_name":"Action2",...}}] // Additional actions...
[{{"action_name":"Action1",...}}, ...]

CORRECT - DO THIS:
[{{"action_name":"Action1","description":"...","access_level":"Write","resource_types":[],"condition_keys":[],"dependent_actions":[]}},{{"action_name":"Action2","description":"...","access_level":"Write","resource_types":[],"condition_keys":[],"dependent_actions":[]}},{{"action_name":"Action3","description":"...","access_level":"Write","resource_types":[],"condition_keys":[],"dependent_actions":[]}}]

Count check: If your response has fewer than {action_count_estimate} objects, you failed. Go back and extract ALL {action_count_estimate} actions.

Documentation chunk:
{chunk}"""

                ai_response = self._invoke_bedrock(prompt)
                chunk_actions = self._parse_ai_json_response(ai_response, f"chunk {i+1} response")
                
                if chunk_actions:
                    all_actions.extend(chunk_actions)
                    
                    # Validate extraction completeness
                    extraction_ratio = len(chunk_actions) / action_count_estimate if action_count_estimate > 0 else 1.0
                    if extraction_ratio < 0.5:
                        logger.warning(f"⚠️ Chunk {i+1}/{len(chunks)}: Extracted {len(chunk_actions)} actions but expected ~{action_count_estimate} (only {extraction_ratio:.0%})")
                        logger.warning(f"   This may indicate incomplete extraction - consider reviewing prompt or chunk size")
                    else:
                        logger.info(f"✓ Chunk {i+1}/{len(chunks)}: Extracted {len(chunk_actions)} actions (expected ~{action_count_estimate}, {extraction_ratio:.0%} complete, Total: {len(all_actions)})")
                else:
                    logger.error(f"✗ Chunk {i+1}/{len(chunks)}: Failed to extract any actions")
                    failed_chunks.append(i+1)
                
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {str(e)}")
                failed_chunks.append(i+1)
        
        # Check if any chunks failed - if so, raise exception
        if failed_chunks:
            error_msg = f"Failed to process {len(failed_chunks)} out of {len(chunks)} chunks: {failed_chunks}"
            logger.error(f"❌ Chunked extraction incomplete: {error_msg}")
            raise ValueError(f"Incomplete action extraction for {service_id}: {error_msg}")
        
        # Deduplicate actions by action_name
        seen_actions = set()
        unique_actions = []
        for action in all_actions:
            action_name = action.get('action_name', '')
            if action_name and action_name not in seen_actions:
                seen_actions.add(action_name)
                unique_actions.append(action)
        
        logger.info(f"Deduplicated {len(all_actions)} actions to {len(unique_actions)} unique actions")
        return unique_actions

    def _extract_parameters_with_ai(self, service_id):
        """Use AI to extract parameters from CloudFormation HTML content with chunking"""
        all_parameters = []
        
        logger.info(f"Starting AI parameter extraction for {service_id}")
        
        # Get curated resource types from service mappings (pre-filtered at build-time)
        service_config = self.service_mappings.get(service_id.lower(), {})
        resource_types = service_config.get('resource_types', [])
        
        # If no resource types defined, skip parameter extraction
        # Note: This should rarely happen since mappings are curated at build-time
        # Using service_id as fallback creates invalid URLs that redirect
        if not resource_types:
            logger.warning(f"No resource_types in service mappings for {service_id}, skipping parameter extraction")
            logger.info(f"To enable parameter extraction, add resource_types to service mappings (e.g., ['bedrock-agent', 'bedrock-knowledgebase'])")
            return []
        
        logger.info(f"Processing {len(resource_types)} curated resource types for {service_id}")
        
        for resource_type in resource_types:
            try:
                logger.info(f"Processing resource type: {resource_type}")
                
                # Fetch individual page
                url = f"https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-{resource_type}.html"
                response = self._make_request(url)
                if not response or response.status_code != 200:
                    logger.warning(f"Failed to fetch {url}")
                    continue
                
                # Check for redirects (302) - indicates invalid resource type
                if response.history:
                    logger.warning(f"URL redirected (invalid resource type): {url} -> {response.url}")
                    continue
                
                # Extract and clean content more aggressively
                text_content = ContentProcessor.extract_section_content(response.text, 'parameters')
                logger.info(f"Extracted text content: {len(text_content)} characters")
                
                # Validate content is substantial (not just generic page)
                if len(text_content) < 100:
                    logger.warning(f"Insufficient content ({len(text_content)} chars) - likely invalid resource type or redirect")
                    continue
                
                # Check if content needs chunking based on invocation method
                # Strands Agent: 20K threshold (6-7K output limit per response)
                # Direct model: 80K threshold (50K token output limit)
                if len(text_content) > self.params_chunk_threshold:
                    logger.info(f"Content too large ({len(text_content)} chars), using chunking approach")
                    parameters_data = self._extract_parameters_with_chunking(service_id, resource_type, text_content, url)
                else:
                    parameters_data = self._extract_parameters_single_call(service_id, resource_type, text_content, url)
                
                if not parameters_data:
                    continue
                
                logger.info(f"Successfully parsed {len(parameters_data)} parameters from AI response")
                
                # Add metadata to each parameter
                for param in parameters_data:
                    param.update({
                        'service_id': service_id,
                        'last_updated': datetime.now().isoformat(),
                        'extraction_method': 'ai',
                        'source_url': url
                    })
                    all_parameters.append(param)
                
                logger.info(f"Extracted {len(parameters_data)} parameters for {resource_type}")
                
            except Exception as e:
                logger.error(f"Error using AI to extract parameters for {resource_type}: {str(e)}")
        
        logger.info(f"AI parameter extraction completed for {service_id}. Total parameters extracted: {len(all_parameters)}")
        return all_parameters

    def _extract_parameters_single_call(self, service_id, resource_type, text_content, url):
        """Extract parameters with single AI call"""
        prompt = f"""Extract CloudFormation properties from documentation. Return ONLY valid JSON array.

Service: {service_id}
Resource: {resource_type}

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: parameter_name (string), description (string), type (string), required (boolean)
- Use proper JSON formatting with double quotes
- Boolean values must be true or false (not strings)
- No trailing commas

Format: [{{"parameter_name":"ExampleParam","description":"Example description","type":"String","required":true}}]

Documentation:
{text_content}"""

        ai_response = self._invoke_bedrock(prompt)
        return self._parse_ai_json_response(ai_response, "parameters response")

    def _extract_parameters_with_chunking(self, service_id, resource_type, text_content, url):
        """Extract parameters using agent-controlled pagination or traditional chunking"""
        
        if self.use_strands_agent:
            # Use agent-controlled pagination for Strands Agent
            return self._extract_parameters_with_pagination(service_id, resource_type, text_content, url)
        else:
            # Use traditional chunking for direct model invocation
            return self._extract_parameters_with_traditional_chunking(service_id, resource_type, text_content, url)
    
    def _extract_parameters_with_pagination(self, service_id, resource_type, text_content, url):
        """Extract parameters using agent-controlled pagination to stay under EventStream limits"""
        # Use larger chunks (15K-20K) and let agent paginate the output
        chunks = ContentProcessor.smart_chunk_content(
            text_content, 
            20000,  # Larger chunks since agent will paginate
            ['Type:', 'Required:', 'Properties', '\n\n', '. ']
        )
        logger.info(f"Content length: {len(text_content)}, Created {len(chunks)} chunks for pagination")
        all_parameters = []
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars) with pagination")
            
            # Process this chunk with pagination
            chunk_params = self._extract_param_chunk_with_pagination(service_id, resource_type, chunk, i+1, len(chunks))
            
            if chunk_params:
                all_parameters.extend(chunk_params)
                logger.info(f"✓ Chunk {i+1}/{len(chunks)}: Extracted {len(chunk_params)} parameters (Total: {len(all_parameters)})")
            else:
                logger.error(f"✗ Chunk {i+1}/{len(chunks)}: Failed to extract any parameters")
        
        # Deduplicate
        seen_parameters = set()
        unique_parameters = []
        for param in all_parameters:
            param_name = param.get('parameter_name', '')
            if param_name and param_name not in seen_parameters:
                seen_parameters.add(param_name)
                unique_parameters.append(param)
        
        logger.info(f"Extracted {len(unique_parameters)} unique parameters from {len(all_parameters)} total")
        return unique_parameters
    
    def _extract_param_chunk_with_pagination(self, service_id, resource_type, chunk, chunk_num, total_chunks):
        """Extract parameters from a single chunk using agent pagination"""
        all_parameters = []
        page = 1
        continue_from = None
        max_pages = 100  # Safety limit - with 20 params/page, allows up to 2000 params per chunk
        
        while page <= max_pages:
            try:
                continue_instruction = f"\n- START extracting from parameter: {continue_from}" if continue_from else ""
                
                prompt = f"""Extract CloudFormation properties from this documentation chunk. Return ONLY valid JSON.

Service: {service_id}
Resource: {resource_type}
Chunk: {chunk_num}/{total_chunks}, Page: {page}

CRITICAL EXTRACTION RULES:
1. Extract EXACTLY 20 parameters (or fewer if less than 20 remain)
2. Do NOT extract more than 20 parameters in a single response
3. If more parameters exist after these 20, set "has_more": true
4. Always set "last_parameter" to the name of the final parameter you extracted

Requirements:
- Return ONLY a JSON object with this structure: {{"parameters": [...], "has_more": true/false, "last_parameter": "ParamName"}}
- Each parameter object must have: parameter_name, description, type, required
- Extract parameters sequentially from the documentation
- Stop after 20 parameters even if more exist in the chunk{continue_instruction}

Example response with 20 parameters:
{{"parameters":[{{"parameter_name":"Param1",...}},...,{{"parameter_name":"Param20",...}}],"has_more":true,"last_parameter":"Param20"}}

Example response with final 5 parameters:
{{"parameters":[{{"parameter_name":"Param1",...}},...,{{"parameter_name":"Param5",...}}],"has_more":false,"last_parameter":"Param5"}}

Documentation chunk:
{chunk}"""

                ai_response = self._invoke_bedrock(prompt)
                response_data = self._parse_ai_json_response(ai_response, f"chunk {chunk_num} page {page}")
                
                if not response_data:
                    logger.error(f"Failed to parse response for chunk {chunk_num} page {page}")
                    break
                
                # Handle both array and object responses
                if isinstance(response_data, list):
                    # Old format - just an array
                    all_parameters.extend(response_data)
                    logger.info(f"✓ Chunk {chunk_num} Page {page}: Extracted {len(response_data)} parameters (no pagination info)")
                    break
                elif isinstance(response_data, dict):
                    # New pagination format
                    page_params = response_data.get('parameters', [])
                    has_more = response_data.get('has_more', False)
                    last_param = response_data.get('last_parameter', '')
                    
                    # Validate extraction count
                    param_count = len(page_params)
                    if param_count > 20:
                        logger.warning(f"⚠️ Model extracted {param_count} parameters (expected ≤20) on chunk {chunk_num} page {page}")
                    elif param_count < 10 and has_more:
                        logger.warning(f"⚠️ Model extracted only {param_count} parameters but has_more=true on chunk {chunk_num} page {page}")
                    
                    all_parameters.extend(page_params)
                    logger.info(f"✓ Chunk {chunk_num} Page {page}: Extracted {param_count} parameters, has_more={has_more}, last={last_param}")
                    
                    if not has_more or not last_param:
                        break
                    
                    continue_from = last_param
                    page += 1
                else:
                    logger.error(f"Unexpected response format: {type(response_data)}")
                    break
                    
            except Exception as e:
                logger.error(f"Error processing chunk {chunk_num} page {page}: {str(e)}")
                break
        
        if page > max_pages:
            logger.warning(f"⚠️ Hit max pages ({max_pages}) for chunk {chunk_num}")
        
        return all_parameters
    
    def _extract_parameters_with_traditional_chunking(self, service_id, resource_type, text_content, url):
        """Extract parameters using traditional pre-chunking (for direct model invocation)"""
        chunks = ContentProcessor.smart_chunk_content(text_content, self.params_chunk_size, ['Type:', 'Required:', 'Properties', '\n\n', '. '])
        all_parameters = []
        failed_chunks = []
        
        logger.info(f"Processing {len(chunks)} smart chunks for {resource_type}")
        
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
                
                prompt = f"""Extract CloudFormation properties from this documentation chunk. Return ONLY valid JSON array.

Service: {service_id}
Resource: {resource_type}
Chunk: {i+1}/{len(chunks)}

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: parameter_name (string), description (string), type (string), required (boolean)
- Use proper JSON formatting with double quotes
- Boolean values must be true or false (not strings)
- No trailing commas

Format: [{{"parameter_name":"ExampleParam","description":"Example description","type":"String","required":true}}]

Documentation chunk:
{chunk}"""

                ai_response = self._invoke_bedrock(prompt)
                chunk_parameters = self._parse_ai_json_response(ai_response, f"chunk {i+1} response")
                
                if chunk_parameters:
                    all_parameters.extend(chunk_parameters)
                    logger.info(f"Extracted {len(chunk_parameters)} parameters from chunk {i+1}")
                else:
                    logger.error(f"✗ Chunk {i+1}/{len(chunks)}: Failed to extract any parameters")
                    failed_chunks.append(i+1)
                
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {str(e)}")
                failed_chunks.append(i+1)
        
        # Check if any chunks failed - if so, raise exception
        if failed_chunks:
            error_msg = f"Failed to process {len(failed_chunks)} out of {len(chunks)} chunks: {failed_chunks}"
            logger.error(f"❌ Chunked extraction incomplete: {error_msg}")
            raise ValueError(f"Incomplete parameter extraction for {service_id}/{resource_type}: {error_msg}")
        
        # Deduplicate parameters by parameter_name
        seen_parameters = set()
        unique_parameters = []
        for param in all_parameters:
            param_name = param.get('parameter_name', '')
            if param_name and param_name not in seen_parameters:
                seen_parameters.add(param_name)
                unique_parameters.append(param)
        
        logger.info(f"Deduplicated {len(all_parameters)} parameters to {len(unique_parameters)} unique parameters")
        return unique_parameters

def lambda_handler(event, context):
    """Lambda handler to collect and store AWS service documentation"""
    try:
        # Set log level from event if provided
        log_level = event.get('logLevel', 'INFO').upper()
        if hasattr(logging, log_level):
            logger.setLevel(getattr(logging, log_level))
            logger.info(f"Log level set to {log_level}")
        
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract action and input data
        action = event.get('action')
        input_data = event.get('input', {})
        service_id = input_data.get('serviceId') or input_data.get('service_id')
        
        if not service_id:
            raise ValueError("service_id is required")
        
        collector = AWSServiceDocumentationCollector()
        
        # Resolve service name to service ID if needed
        if collector.service_resolver:
            original_service_id = service_id
            resolved_service_id = collector.service_resolver.resolve(service_id)
            
            if resolved_service_id:
                service_id = resolved_service_id
                if service_id != original_service_id:
                    logger.info(f"Resolved '{original_service_id}' to '{service_id}'")
            else:
                error_message = collector.service_resolver.format_error_message(service_id)
                logger.error(error_message)
                return {
                    'statusCode': 400,
                    'body': {
                        'error': 'Invalid service name',
                        'message': error_message,
                        'service_id': service_id,
                        'status': 'ERROR'
                    }
                }
        
        # Check if this is a parent service that should be expanded
        service_config = collector.service_mappings.get(service_id.lower(), {})
        is_parent = service_config.get('is_parent_service', False)
        
        if is_parent:
            # Process parent service efficiently - extract once, filter multiple times
            sub_services = service_config.get('sub_services', [])
            logger.info(f"Processing parent service '{service_id}' with {len(sub_services)} sub-services: {sub_services}")
            
            # Get the IAM service name (e.g., "bedrock" for all bedrock-* sub-services)
            # Use the first sub-service's iam_service_name
            first_sub_config = collector.service_mappings.get(sub_services[0].lower(), {}) if sub_services else {}
            iam_service_name = first_sub_config.get('iam_service_name', service_id)
            
            logger.info(f"Extracting actions from IAM service: {iam_service_name}")
            
            # Extract all actions from the shared IAM page
            all_actions = collector.collect_service_actions(iam_service_name)
            
            # Process each sub-service by filtering the extracted actions
            all_results = []
            for sub_service_id in sub_services:
                logger.info(f"Filtering actions for sub-service: {sub_service_id}")
                
                # Filter actions for this sub-service
                filtered_actions = collector._filter_actions_by_patterns(sub_service_id, all_actions)
                
                # Store filtered actions in DynamoDB
                if filtered_actions:
                    collector.store_documentation(sub_service_id, 'Actions', filtered_actions)
                
                # Collect parameters for this sub-service (if configured)
                sub_config = collector.service_mappings.get(sub_service_id.lower(), {})
                parameters = []
                if sub_config.get('has_cloudformation_resources') and sub_config.get('resource_types'):
                    logger.info(f"Collecting parameters for {sub_service_id}")
                    parameters = collector.collect_service_parameters(sub_service_id)
                    if parameters:
                        collector.store_documentation(sub_service_id, 'Parameters', parameters)
                
                all_results.append({
                    'service_id': sub_service_id,
                    'actions_count': len(filtered_actions),
                    'parameters_count': len(parameters),
                    'status': 'SUCCESS'
                })
                
                logger.info(f"✓ {sub_service_id}: {len(filtered_actions)} actions, {len(parameters)} parameters")
            
            # Aggregate results
            total_actions = sum(r['actions_count'] for r in all_results)
            total_params = sum(r['parameters_count'] for r in all_results)
            
            # Log consolidated summary
            logger.info(f"=" * 80)
            logger.info(f"PARENT SERVICE SUMMARY: {service_id}")
            logger.info(f"  Expanded to: {', '.join(sub_services)}")
            logger.info(f"  Sub-services processed: {len(sub_services)}")
            logger.info(f"  Total actions: {total_actions}")
            logger.info(f"  Total parameters: {total_params}")
            logger.info(f"  Status: SUCCESS")
            logger.info(f"=" * 80)
            
            return {
                'statusCode': 200,
                'body': {
                    'service_id': service_id,
                    'expanded_to': sub_services,
                    'sub_services_processed': len(sub_services),
                    'total_actions_count': total_actions,
                    'total_parameters_count': total_params,
                    'sub_service_results': all_results,
                    'status': 'SUCCESS'
                }
            }
        
        # Single service - continue with normal processing
        # (service_id stays as-is, no expansion needed)
        actions = []
        parameters = []
        actions_attempted = False
        actions_found = False
        parameters_attempted = False
        parameters_found = False
        warnings = []
        
        # Get service configuration to check capabilities
        service_config = collector.service_mappings.get(service_id.lower(), {})
        has_iam_actions = service_config.get('has_iam_actions', True)
        # Default to True - assume services have CloudFormation resources unless explicitly marked False
        # The extraction script doesn't populate resource_types, so we can't rely on that
        has_cloudformation_resources = service_config.get('has_cloudformation_resources', True)
        
        # Collect Actions (only if service has IAM actions)
        actions_error = None
        if has_iam_actions:
            actions_attempted = True
            try:
                actions = collector.collect_service_actions(service_id)
                if actions:
                    actions_found = True
                    collector.store_documentation(service_id, 'Actions', actions)
                    logger.info(f"Stored {len(actions)} actions for {service_id}")
                else:
                    warnings.append("No actions found")
                    logger.warning(f"Actions collection returned empty list for {service_id}")
            except Exception as e:
                actions_error = str(e)
                logger.error(f"Error collecting actions: {actions_error}")
                logger.error("Actions collection traceback: ", exc_info=True)
                warnings.append(f"Error collecting actions: {actions_error}")
        else:
            logger.warning(f"Skipping actions collection for {service_id} - service has no IAM actions")
        
        # Collect Parameters (only if service has CloudFormation resources)
        parameters_error = None
        if has_cloudformation_resources:
            parameters_attempted = True
            try:
                parameters = collector.collect_service_parameters(service_id)
                if parameters:
                    parameters_found = True
                    collector.store_documentation(service_id, 'Parameters', parameters)
                    logger.info(f"Stored {len(parameters)} parameters for {service_id}")
                else:
                    warnings.append("No parameters found")
                    logger.warning(f"Parameters collection returned empty list for {service_id}")
            except Exception as e:
                parameters_error = str(e)
                logger.error(f"Error collecting parameters: {parameters_error}")
                logger.error("Parameters collection traceback: ", exc_info=True)
                warnings.append(f"Error collecting parameters: {parameters_error}")
        else:
            logger.warning(f"Skipping parameters collection for {service_id} - service has no CloudFormation resources")
        # Create timestamp and S3 locations
        timestamp = datetime.now().strftime('%Y%m%d')
        s3_locations = {
            'actions': f"s3://{collector.documentation_bucket}/{service_id}/Actions/raw_data_{timestamp}.json",
            'parameters': f"s3://{collector.documentation_bucket}/{service_id}/Parameters/raw_data_{timestamp}.json"
        }
        
        # Determine status - fail if we attempted collection but found nothing
        # Success requires: (attempted actions AND found) OR (attempted parameters AND found) OR (nothing attempted)
        actions_success = (not actions_attempted) or actions_found
        parameters_success = (not parameters_attempted) or parameters_found
        
        if actions_success and parameters_success:
            status = 'SUCCESS'
        else:
            status = 'FAILURE'
            error_details = []
            
            if actions_attempted and not actions_found:
                if actions_error:
                    error_details.append(f"Actions: {actions_error}")
                else:
                    error_details.append("Actions: No actions extracted (empty result)")
            
            if parameters_attempted and not parameters_found:
                if parameters_error:
                    error_details.append(f"Parameters: {parameters_error}")
                else:
                    error_details.append("Parameters: No parameters extracted (empty result)")
            
            error_message = f"Documentation extraction failed for {service_id}."
            if error_details:
                error_message += f" {'; '.join(error_details)}"
            
            logger.error(error_message)
            logger.error(f"Actions attempted: {actions_attempted}, found: {actions_found}, error: {actions_error}")
            logger.error(f"Parameters attempted: {parameters_attempted}, found: {parameters_found}, error: {parameters_error}")
            
            return {
                'statusCode': 500,
                'body': {
                    'error': error_message,
                    'service_id': service_id,
                    'status': status,
                    'actions_count': 0,
                    'parameters_count': 0,
                    'actions_attempted': actions_attempted,
                    'actions_found': actions_found,
                    'actions_error': actions_error,
                    'parameters_attempted': parameters_attempted,
                    'parameters_found': parameters_found,
                    'parameters_error': parameters_error,
                    'warnings': warnings
                }
            }
        
        # Prepare response with actual data included for Step Functions processing
        response_body = {
            'service_id': service_id,
            'actions_count': len(actions),
            'parameters_count': len(parameters),
           # 'actions': actions,           # Include actual actions data
           # 'parameters': parameters,     # Include actual parameters data
            'message': f"Documentation collection completed for {service_id}",
            'warnings': warnings if warnings else None,
            's3_locations': s3_locations,
            'status': status,
            'metadata': {
                'timestamp': timestamp,
                'actions_processed': actions_found,
                'parameters_processed': parameters_found,
                'documentation_bucket': collector.documentation_bucket
            }
        }
        
        # Log consolidated summary
        logger.info(f"=" * 80)
        logger.info(f"SINGLE SERVICE SUMMARY: {service_id}")
        logger.info(f"  Actions collected: {len(actions)}")
        logger.info(f"  Parameters collected: {len(parameters)}")
        logger.info(f"  Status: {status}")
        if warnings:
            logger.info(f"  Warnings: {len(warnings)}")
        logger.info(f"=" * 80)
        
        return {
            'statusCode': 200,
            'body': response_body
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        logger.error("Full traceback: ", exc_info=True)
        
        return {
            'statusCode': 500,
            'body': {
                'error': str(e),
                'details': 'Check CloudWatch logs for more information',
                'service_id': service_id if 'service_id' in locals() else None,
                'status': 'ERROR',
                'documentation_bucket': collector.documentation_bucket if 'collector' in locals() else None
            }
        }
