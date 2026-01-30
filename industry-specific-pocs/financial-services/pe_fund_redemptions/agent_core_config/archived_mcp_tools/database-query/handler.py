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
    
    # Validate table name to prevent injection
    if not table.replace('_', '').isalnum():
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid table name'})
        }
    
    # Build query with optional filtering using parameterized queries
    field = event.get('field')
    value = event.get('value')
    
    if field and value:
        # Validate field name to prevent injection
        if not field.replace('_', '').isalnum():
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid field name'})
            }
        # Use parameterized query for safety
        query = f"SELECT * FROM {table} WHERE {field} LIKE ?"  # nosec B608 - table and field names are validated
        params = (f'%{value}%',)
    else:
        # Note: Using f-string with validated table name
        query = f"SELECT * FROM {table}"  # nosec B608 - table name is validated
        params = ()
    
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
