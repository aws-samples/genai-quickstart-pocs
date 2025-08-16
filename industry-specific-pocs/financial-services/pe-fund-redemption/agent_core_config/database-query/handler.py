import json
import boto3
import os

lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    # Extract tool name from context
    tool_name = context.client_context.custom.get('bedrockAgentCoreToolName', 'unknown')
    
    # Map tool names to table names
    tables = {
        'get_fund_mapping': 'fund_mapping',
        'get_investments': 'investments',
        'get_investors': 'investors', 
        'get_redemption_requests': 'redemption_requests'
    }
    
    # Find matching table
    table = None
    for tool, table_name in tables.items():
        if tool in tool_name:
            table = table_name
            break
    
    if not table:
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Unknown tool'})
        }
    
    # Build query with optional filtering
    query = f"SELECT * FROM {table}"
    
    field = event.get('field')
    value = event.get('value')
    
    if field and value:
        query += f" WHERE {field} LIKE '%{value}%'"
    
    try:
        # Call the MySQL Lambda function
        mysql_function = os.environ.get('MYSQL_LAMBDA_FUNCTION', 'MSSqlConnect')
        response = lambda_client.invoke(
            FunctionName=mysql_function,
            InvocationType='RequestResponse',
            Payload=json.dumps({'query': query})
        )
        
        # Parse response
        result = json.loads(response['Payload'].read())
        
        return result
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
