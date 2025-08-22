import json
import boto3
import csv
import io
import os

def lambda_handler(event, context):
    """
    Unified PE Data Service MCP Handler
    Handles all data operations: investors, investments, fund_mapping, redemption_requests, fund_documents
    """
    
    try:
        # Parse the MCP request
        body = json.loads(event.get('body', '{}'))
        method = body.get('method')
        params = body.get('params', {})
        
        if method == 'tools/list':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'tools': [
                        {
                            'name': 'pe_data_service',
                            'description': 'Unified PE data service for all fund, investor, and document operations',
                            'inputSchema': {
                                'type': 'object',
                                'properties': {
                                    'operation': {
                                        'type': 'string',
                                        'enum': ['get_investors', 'get_investments', 'get_fund_mapping', 'get_redemption_requests', 'get_fund_document'],
                                        'description': 'The data operation to perform'
                                    },
                                    'filters': {
                                        'type': 'object',
                                        'description': 'Filters to apply (varies by operation)',
                                        'properties': {
                                            'investor_id': {'type': 'string'},
                                            'fund_id': {'type': 'string'},
                                            'fund_name': {'type': 'string'},
                                            'investor_class': {'type': 'string'},
                                            'investor_name': {'type': 'string'},
                                            'status': {'type': 'string'},
                                            'min_amount': {'type': 'number'},
                                            'max_amount': {'type': 'number'},
                                            'min_net_worth': {'type': 'number'},
                                            'max_net_worth': {'type': 'number'},
                                            'start_date': {'type': 'string'},
                                            'end_date': {'type': 'string'},
                                            'limit': {'type': 'integer', 'default': 100}
                                        }
                                    }
                                },
                                'required': ['operation']
                            }
                        }
                    ]
                })
            }
        
        elif method == 'tools/call':
            tool_name = params.get('name')
            arguments = params.get('arguments', {})
            
            if tool_name == 'pe_data_service':
                result = handle_pe_data_request(arguments)
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
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def handle_pe_data_request(arguments):
    """Handle the unified PE data request"""
    operation = arguments.get('operation')
    filters = arguments.get('filters', {})
    
    if operation == 'get_fund_document':
        return get_fund_document(filters)
    elif operation in ['get_investors', 'get_investments', 'get_fund_mapping', 'get_redemption_requests']:
        return get_csv_data(operation, filters)
    else:
        raise ValueError(f"Unknown operation: {operation}")

def get_fund_document(filters):
    """Get fund document from S3"""
    fund_name = filters.get('fund_name')
    investor_class = filters.get('investor_class', 'ClassA')
    
    if not fund_name:
        raise ValueError("fund_name is required for get_fund_document operation")
    
    bucket = os.environ.get('FUND_DOCUMENTS_BUCKET')
    if not bucket:
        raise ValueError("FUND_DOCUMENTS_BUCKET environment variable not set")
    
    s3_client = boto3.client('s3', region_name='us-east-1')
    s3_key = f"fund_documents/{fund_name}_{investor_class}.txt"
    
    try:
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        document_content = response['Body'].read().decode('utf-8')
        
        return {
            'operation': 'get_fund_document',
            'fund_name': fund_name,
            'investor_class': investor_class,
            'document': document_content
        }
    except s3_client.exceptions.NoSuchKey:
        raise ValueError(f"Document not found: {s3_key} in bucket {bucket}")

def get_csv_data(operation, filters):
    """Get CSV data from S3"""
    # Map operations to CSV files
    csv_files = {
        'get_investors': 'database/investors.csv',
        'get_investments': 'database/investments.csv',
        'get_fund_mapping': 'database/fund_mapping.csv',
        'get_redemption_requests': 'database/redemption_requests.csv'
    }
    
    bucket = os.environ.get('FUND_DOCUMENTS_BUCKET')
    if not bucket:
        raise ValueError("FUND_DOCUMENTS_BUCKET environment variable not set")
    
    s3_client = boto3.client('s3', region_name='us-east-1')
    s3_key = csv_files[operation]
    
    try:
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        data = []
        limit = filters.get('limit', 100)
        
        for row in csv_reader:
            if apply_filters(row, filters, operation):
                data.append(row)
                if len(data) >= limit:
                    break
        
        return {
            'operation': operation,
            'total_found': len(data),
            'filters_applied': filters,
            'data': data
        }
        
    except s3_client.exceptions.NoSuchKey:
        raise ValueError(f"Data file not found: {s3_key} in bucket {bucket}")

def apply_filters(row, filters, operation):
    """Apply filters to a CSV row"""
    # Common filters
    if filters.get('investor_id') and row.get('investor_id') != filters['investor_id']:
        return False
    if filters.get('fund_id') and row.get('fund_id') != filters['fund_id']:
        return False
    if filters.get('investor_class') and row.get('investor_class') != filters['investor_class']:
        return False
    
    # Operation-specific filters
    if operation == 'get_investors':
        if filters.get('investor_name'):
            if filters['investor_name'].lower() not in row.get('investor_name', '').lower():
                return False
        if filters.get('min_net_worth') is not None:
            try:
                net_worth = float(row.get('estimated_net_worth', 0))
                if net_worth < filters['min_net_worth']:
                    return False
            except (ValueError, TypeError):
                return False
        if filters.get('max_net_worth') is not None:
            try:
                net_worth = float(row.get('estimated_net_worth', 0))
                if net_worth > filters['max_net_worth']:
                    return False
            except (ValueError, TypeError):
                return False
    
    elif operation == 'get_investments':
        if filters.get('min_amount') is not None:
            try:
                amount = float(row.get('investment_amount', 0))
                if amount < filters['min_amount']:
                    return False
            except (ValueError, TypeError):
                return False
        if filters.get('max_amount') is not None:
            try:
                amount = float(row.get('investment_amount', 0))
                if amount > filters['max_amount']:
                    return False
            except (ValueError, TypeError):
                return False
        if filters.get('start_date') and row.get('call_date', '') < filters['start_date']:
            return False
        if filters.get('end_date') and row.get('call_date', '') > filters['end_date']:
            return False
    
    elif operation == 'get_fund_mapping':
        if filters.get('fund_name'):
            if filters['fund_name'].lower() not in row.get('fund_name', '').lower():
                return False
    
    elif operation == 'get_redemption_requests':
        if filters.get('status'):
            if row.get('status', '').lower() != filters['status'].lower():
                return False
        if filters.get('start_date') and row.get('request_date', '') < filters['start_date']:
            return False
        if filters.get('end_date') and row.get('request_date', '') > filters['end_date']:
            return False
    
    return True
