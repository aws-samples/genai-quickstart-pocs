import json
import boto3
import os

def lambda_handler(event, context):
    """
    Fund Document Service MCP Handler
    Handles fund document retrieval from S3
    """
    
    # Debug logging
    print(f"DEBUG: Received event: {json.dumps(event)}")
    
    try:
        # Handle direct format from MCP Gateway: {"fund_name": "FUND002", "investor_class": "ClassA"}
        if 'fund_name' in event:
            print("DEBUG: Using direct MCP Gateway format")
            result = get_fund_document(event)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'content': [{'type': 'text', 'text': json.dumps(result, indent=2)}]
                })
            }
        
        # Handle MCP Protocol format for direct testing
        body = json.loads(event.get('body', '{}'))
        method = body.get('method')
        params = body.get('params', {})
        
        print(f"DEBUG: Method: {method}, Params: {params}")
        
        if method == 'tools/list':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'tools': [
                        {
                            'name': 'fund_document_service',
                            'description': 'Retrieve fund documents from S3 storage',
                            'inputSchema': {
                                'type': 'object',
                                'properties': {
                                    'fund_name': {
                                        'type': 'string',
                                        'description': 'Fund name (e.g., FUND001, Strategic Growth Fund 1)'
                                    },
                                    'investor_class': {
                                        'type': 'string',
                                        'enum': ['ClassA', 'ClassB', 'Institutional'],
                                        'default': 'ClassA',
                                        'description': 'Investor class for the document'
                                    }
                                },
                                'required': ['fund_name']
                            }
                        }
                    ]
                })
            }
        
        elif method == 'tools/call':
            tool_name = params.get('name')
            arguments = params.get('arguments', {})
            
            if tool_name == 'fund_document_service':
                result = get_fund_document(arguments)
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'content': [{'type': 'text', 'text': json.dumps(result, indent=2)}]
                    })
                }
            else:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Unknown tool: {tool_name}'})
                }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Unknown method: {method}'})
            }
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_fund_document(arguments):
    """Get fund document from S3"""
    fund_name = arguments.get('fund_name')
    investor_class = arguments.get('investor_class', 'ClassA')
    
    if not fund_name:
        raise ValueError("fund_name is required")
    
    bucket = os.environ.get('FUND_DOCUMENTS_BUCKET')
    if not bucket:
        raise ValueError("FUND_DOCUMENTS_BUCKET environment variable not set")
    
    # Convert fund name to fund ID format if needed
    if not fund_name.startswith('FUND'):
        # Try to map common fund names to IDs
        fund_mapping = {
            'Strategic Growth Fund 1': 'FUND001',
            'Financial Services Fund 9': 'FUND009',
            # Add more mappings as needed
        }
        fund_name = fund_mapping.get(fund_name, fund_name)
    
    s3_client = boto3.client('s3', region_name='us-east-1')
    s3_key = f"fund_documents/{fund_name}_{investor_class}.txt"
    
    try:
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        document_content = response['Body'].read().decode('utf-8')
        
        return {
            'fund_name': fund_name,
            'investor_class': investor_class,
            'document_content': document_content,
            'source': f's3://{bucket}/{s3_key}'
        }
    except s3_client.exceptions.NoSuchKey:
        raise ValueError(f"Document not found: {s3_key} in bucket {bucket}")
