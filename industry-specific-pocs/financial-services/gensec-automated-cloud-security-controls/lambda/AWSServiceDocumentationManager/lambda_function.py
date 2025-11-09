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

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class AWSServiceDocumentationCollector:
    def __init__(self):
        self.dynamodb = boto3.client('dynamodb')
        self.s3 = boto3.client('s3')
        
        # Initialize centralized Bedrock client
        self.bedrock_client = get_bedrock_client('claude-4')  # Change between 'nova-pro' and 'claude' to switch models
        
        # Initialize MCP documentation collector
        self.mcp_collector = MCPDocumentationCollector()
        self.use_mcp = os.environ.get('USE_MCP_DOCUMENTATION', 'false').lower() == 'true'  # Disable MCP by default until server is available
        
        self.documentation_bucket = os.environ['DOCUMENTATION_BUCKET']
        self.input_bucket = os.environ.get('S3_INPUT_BUCKET', self.documentation_bucket)
        self.service_actions_table = os.environ['DYNAMODB_TABLE_SERVICE_ACTIONS']
        self.service_parameters_table = os.environ['DYNAMODB_TABLE_SERVICE_PARAMETERS']
        self.service_inventory_table = os.environ['DYNAMODB_TABLE_SERVICE_INVENTORY']
        
        # Load service mappings from S3
        self.service_mappings = self._load_service_mappings()
        
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
            
            # Try MCP first if enabled
            if self.use_mcp:
                logger.info(f"Using MCP server for {service_id} actions")
                mcp_actions = self.mcp_collector.collect_service_actions_mcp(service_id)
                if mcp_actions:
                    logger.info(f"Successfully collected {len(mcp_actions)} actions via MCP")
                    return mcp_actions
                else:
                    logger.warning(f"MCP failed for {service_id}, falling back to web scraping")
            
            # Fallback to web scraping
            logger.info(f"Using web scraping fallback for {service_id} actions")
            all_actions = self._extract_actions_with_ai_v2(service_id)
            
            logger.info(f"Total actions collected for {service_id}: {len(all_actions)}")
            return all_actions
            
        except Exception as e:
            logger.error(f"Error collecting actions for service {service_id}: {str(e)}")
            return []

    # def _extract_actions_from_html(self, html_content, service_id, source_url):
    #     """Extract actions from HTML content"""
    #     soup = BeautifulSoup(html_content, 'html.parser')
    #     actions = []
    #     
    #     # Find the actions table - handle both old and new AWS documentation formats
    #     tables = soup.find_all('table')
    #     actions_table = None
    #     
    #     for table in tables:
    #         # Check if this table contains actions
    #         thead = table.find('thead')
    #         if thead:
    #             headers = [th.text.strip().lower() for th in thead.find_all('th')]
    #             if 'actions' in headers:
    #                 actions_table = table
    #                 break
    #         
    #         # Fallback: check first row for headers
    #         rows = table.find_all('tr')
    #         if rows:
    #             first_row_headers = [th.text.strip().lower() for th in rows[0].find_all(['th', 'td'])]
    #             if 'actions' in first_row_headers:
    #                 actions_table = table
    #                 break
    #     
    #     if not actions_table:
    #         logger.warning(f"No actions table found for {service_id}")
    #         return []
    #     
    #     # Parse the table structure
    #     tbody = actions_table.find('tbody') or actions_table
    #     rows = tbody.find_all('tr')
    #     
    #     if not rows:
    #         logger.warning(f"No table rows found for {service_id}")
    #         return []
    #     
    #     # Get headers from thead or first row
    #     thead = actions_table.find('thead')
    #     if thead:
    #         header_row = thead.find('tr')
    #         data_rows = rows
    #     else:
    #         header_row = rows[0]
    #         data_rows = rows[1:]
    #     
    #     headers = [th.text.strip().lower() for th in header_row.find_all(['th', 'td'])]
    #     
    #     # Find column indices
    #     action_col = None
    #     description_col = None
    #     access_level_col = None
    #     resource_types_col = None
    #     condition_keys_col = None
    #     dependent_actions_col = None
    #     
    #     for i, header in enumerate(headers):
    #         if 'actions' in header or 'action' in header:
    #             action_col = i
    #         elif 'description' in header:
    #             description_col = i
    #         elif 'access level' in header or 'accesslevel' in header:
    #             access_level_col = i
    #         elif 'resource types' in header or 'resourcetypes' in header:
    #             resource_types_col = i
    #         elif 'condition keys' in header or 'conditionkeys' in header:
    #             condition_keys_col = i
    #         elif 'dependent actions' in header or 'dependentactions' in header:
    #             dependent_actions_col = i
    #     
    #     if action_col is None:
    #         logger.warning(f"No actions column found for {service_id}")
    #         return []
    #     
    #     # Extract actions from rows
    #     for row in data_rows:
    #         cols = row.find_all(['td', 'th'])
    #         if len(cols) <= action_col:
    #             continue
    #         
    #         action_name = self._extract_cell_text(cols, action_col)
    #         if not action_name or action_name.strip() == '':
    #             continue
    #         
    #         action = {
    #             'service_id': service_id,
    #             'action_name': action_name,
    #             'description': self._extract_cell_text(cols, description_col),
    #             'access_level': self._extract_cell_text(cols, access_level_col),
    #             'resource_types': self._extract_list_from_cell(cols, resource_types_col),
    #             'condition_keys': self._extract_list_from_cell(cols, condition_keys_col),
    #             'dependent_actions': self._extract_list_from_cell(cols, dependent_actions_col),
    #             'last_updated': datetime.now().isoformat(),
    #             'source_url': source_url
    #         }
    #         
    #         actions.append(action)
    #     
    #     # No AI fallback needed since main function uses AI as primary method
    #     return actions

    # def _extract_cell_text(self, cols, index):
    #     """Extract text from table cell at given index"""
    #     if index is None or index >= len(cols):
    #         return ''
    #     return cols[index].get_text(strip=True)
    # 
    # def _extract_list_from_cell(self, cols, index):
    #     """Extract list items from table cell, handling various separators"""
    #     if index is None or index >= len(cols):
    #         return []
    #     
    #     text = cols[index].get_text(strip=True)
    #     if not text or text == '-':
    #         return []
    #     
    #     # Split by common separators and clean up
    #     items = []
    #     for separator in [',', '\n', ';']:
    #         if separator in text:
    #             items = [item.strip() for item in text.split(separator) if item.strip()]
    #             break
    #     
    #     if not items and text:
    #         items = [text]
    #     
    #     return [item for item in items if item and item != '-']

    def collect_service_parameters(self, service_id):
        """Collect CloudFormation parameters using MCP server or fallback to web scraping"""
        try:
            logger.info(f"Collecting parameters for service: {service_id}")
            
            # Try MCP first if enabled
            if self.use_mcp:
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
                    logger.info(f'item: {str(item)}')
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
        """Parse AI JSON response directly"""
        try:
            # Remove any leading/trailing whitespace
            cleaned = ai_response.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI {context} as JSON: {str(e)}")
            logger.error(f"Response was: \n{ai_response}")
            return None

    def _invoke_bedrock(self, prompt):
        """Centralized Bedrock invocation using shared client"""
        try:
            # max_tokens is configured in the bedrock client layer, not passed as parameter
            return self.bedrock_client.invoke(prompt)
        except Exception as e:
            logger.error(f"Error invoking Bedrock: {str(e)}")
            raise

    def _extract_actions_with_ai_v2(self, service_id):
        """Use AI to extract actions from service authorization URLs with content chunking"""
        all_actions = []
        
        logger.info(f"Starting AI action extraction for {service_id}")
        
        # Get URLs from service_mappings
        service_config = self.service_mappings.get(service_id.lower(), {})
        urls = service_config.get('service_authorization_urls', [])
        
        # If no URLs in service_mappings, fall back to generated patterns
        if not urls:
            urls = self._generate_service_url_patterns(service_id)
        
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
                
                # Check if content needs chunking (>50k chars)
                if len(text_content) > 50000:
                    logger.info(f"Content too large ({len(text_content)} chars), using chunking approach")
                    actions_data = self._extract_actions_with_chunking(service_id, text_content, url)
                else:
                    actions_data = self._extract_actions_single_call(service_id, text_content, url)
                
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
        
        logger.info(f"AI action extraction completed for {service_id}. Total actions extracted: {len(all_actions)}")
        return all_actions

    def _extract_actions_single_call(self, service_id, text_content, url):
        """Extract actions with single AI call"""
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

    def _extract_actions_with_chunking(self, service_id, text_content, url):
        """Extract actions using smart chunking that preserves complete entries"""
        # Split by logical boundaries (table rows, action entries) - reduced chunk size for better performance
        chunks = ContentProcessor.smart_chunk_content(text_content, 40000, ['Action:', 'action:', '\n\n', '. '])
        all_actions = []
        
        logger.info(f"Processing {len(chunks)} smart chunks for {service_id}")
        
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
                
                prompt = f"""Extract IAM actions from this AWS documentation chunk. Return ONLY valid JSON array.

Service: {service_id}
Chunk: {i+1}/{len(chunks)}

Requirements:
- Return ONLY the JSON array, no markdown, no explanations
- Each object must have: action_name (string), description (string), access_level (string), resource_types (array), condition_keys (array), dependent_actions (array)
- Use proper JSON formatting with double quotes
- Arrays can be empty [] if no data
- No trailing commas

Format: [{{"action_name":"CreateTopic","description":"Creates a topic","access_level":"Write","resource_types":["topic"],"condition_keys":[],"dependent_actions":[]}}]

Documentation chunk:
{chunk}"""

                ai_response = self._invoke_bedrock(prompt)
                chunk_actions = self._parse_ai_json_response(ai_response, f"chunk {i+1} response")
                
                if chunk_actions:
                    all_actions.extend(chunk_actions)
                    logger.info(f"Extracted {len(chunk_actions)} actions from chunk {i+1}")
                
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {str(e)}")
                continue
        
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
        
        # Get resource types from loaded service mappings
        service_config = self.service_mappings.get(service_id.lower(), {})
        resource_types = service_config.get('resource_types', [service_id.lower()])
        
        for resource_type in resource_types:
            try:
                logger.info(f"Processing resource type: {resource_type}")
                
                # Fetch individual page
                url = f"https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-{resource_type}.html"
                response = self._make_request(url)
                if not response or response.status_code != 200:
                    logger.warning(f"Failed to fetch {url}")
                    continue
                
                # Extract and clean content more aggressively
                text_content = ContentProcessor.extract_section_content(response.text, 'parameters')
                logger.info(f"Extracted text content: {len(text_content)} characters")
                
                # Check if content needs chunking (>80k chars for parameters)
                if len(text_content) > 80000:
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
        """Extract parameters using smart chunking that preserves complete entries"""
        # Split by logical boundaries (properties, parameter definitions)
        chunks = ContentProcessor.smart_chunk_content(text_content, 60000, ['Type:', 'Required:', 'Properties', '\n\n', '. '])
        all_parameters = []
        
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
                
            except Exception as e:
                logger.error(f"Error processing chunk {i+1}: {str(e)}")
                continue
        
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
        actions = []
        parameters = []
        actions_found = False
        parameters_found = False
        warnings = []
        
        # Get service configuration to check capabilities
        service_config = collector.service_mappings.get(service_id.lower(), {})
        has_iam_actions = service_config.get('has_iam_actions', True)
        has_cloudformation_resources = service_config.get('has_cloudformation_resources', True)
        
        # Collect Actions (only if service has IAM actions)
        if has_iam_actions:
            try:
                actions = collector.collect_service_actions(service_id)
                if actions:
                    actions_found = True
                    collector.store_documentation(service_id, 'Actions', actions)
                    logger.info(f"Stored {len(actions)} actions for {service_id}")
                else:
                    warnings.append("No actions found")
            except Exception as e:
                logger.error(f"Error collecting actions: {str(e)}")
                warnings.append(f"Error collecting actions: {str(e)}")
        else:
            logger.warning(f"Skipping actions collection for {service_id} - service has no IAM actions")
            actions_found = True  # Consider as success since it's expected
        
        # Collect Parameters (only if service has CloudFormation resources)
        if has_cloudformation_resources:
            try:
                parameters = collector.collect_service_parameters(service_id)
                if parameters:
                    parameters_found = True
                    collector.store_documentation(service_id, 'Parameters', parameters)
                    logger.info(f"Stored {len(parameters)} parameters for {service_id}")
                else:
                    warnings.append("No parameters found")
            except Exception as e:
                logger.error(f"Error collecting parameters: {str(e)}")
                warnings.append(f"Error collecting parameters: {str(e)}")
        else:
            logger.warning(f"Skipping parameters collection for {service_id} - service has no CloudFormation resources")
            parameters_found = True  # Consider as success since it's expected
        # Create timestamp and S3 locations
        timestamp = datetime.now().strftime('%Y%m%d')
        s3_locations = {
            'actions': f"s3://{collector.documentation_bucket}/{service_id}/Actions/raw_data_{timestamp}.json",
            'parameters': f"s3://{collector.documentation_bucket}/{service_id}/Parameters/raw_data_{timestamp}.json"
        }
        
        # Determine status - success if at least one type of documentation is found
        if actions_found or parameters_found:
            status = 'SUCCESS'
        else:
            status = 'FAILURE'
            error_message = f"No documentation found for {service_id}. Both actions and parameters extraction failed."
            logger.error(error_message)
            
            return {
                'statusCode': 500,
                'body': {
                    'error': error_message,
                    'service_id': service_id,
                    'status': status,
                    'actions_count': 0,
                    'parameters_count': 0,
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
        
        logger.info(f"Processing completed for {service_id} with status: {status}")
        
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
