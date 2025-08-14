import json
import boto3
from botocore.exceptions import ClientError

"""
WebSocket Lambda Function for Real-time Code Generation

This function handles WebSocket connections and generates code using AWS Bedrock Claude 3.5 Sonnet.
It supports streaming responses for real-time code generation in multiple programming languages.

Supported Languages:
- React.js
- HTML
- Java
- Python
- C#

WebSocket Routes:
- $connect: Handle new WebSocket connections
- $disconnect: Handle WebSocket disconnections
- generate: Process code generation requests with streaming responses
"""

def lambda_handler(event, context):
    # Get the WebSocket route key to determine the action
    route_key = event.get('requestContext', {}).get('routeKey')
    
    # Handle WebSocket connection establishment
    if route_key == '$connect':
        return {'statusCode': 200}
    
    # Handle WebSocket disconnection
    elif route_key == '$disconnect':
        return {'statusCode': 200}
    
    # Handle code generation requests
    elif route_key == 'generate':
        try:
            # Parse the WebSocket message body
            if 'body' in event and event['body']:
                body = json.loads(event['body'])
                metadata_json = body.get('metadata', {})
                language = body.get('language', 'reactjs')
                custom_prompt = body.get('prompt', '')
            else:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    'body': json.dumps({'error': 'Missing metadata or language'})
                }
            
            # Create the prompt for Claude based on custom prompt or default template
            if custom_prompt:
                # Use custom prompt and replace metadata placeholder
                prompt = custom_prompt.replace('{metadata}', json.dumps(metadata_json, indent=2))
            else:
                # Use default HTML form generation prompt
                prompt = f"""
                Generate ONLY clean HTML form code for the following PDF metadata fields.
                
                Metadata: {json.dumps(metadata_json, indent=2)}
                
                Requirements:
                - Generate a very professional looking HTML form elements (no explanations, no markdown)
                - Include inline CSS styles for proper formatting
                - Create appropriate input types for each field
                - Add form validation attributes
                - Include a submit button
                - Start directly with <form> tag
                
                Return ONLY the HTML form code that can be directly rendered in a browser.
                """
            
            # Extract WebSocket connection information
            connection_id = event['requestContext']['connectionId']
            
            # Initialize API Gateway Management API client for WebSocket communication
            apigateway_client = boto3.client(
                'apigatewaymanagementapi',
                endpoint_url='https://bb4bk15ec3.execute-api.us-east-1.amazonaws.com/production'
            )
            
            # Initialize Bedrock client and invoke Claude 3.5 Sonnet with streaming
            bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
            response = bedrock.invoke_model_with_response_stream(
                modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                body=json.dumps({
                    'anthropic_version': 'bedrock-2023-05-31',
                    'max_tokens': 4000,
                    'messages': [{
                        'role': 'user',
                        'content': prompt
                    }]
                })
            )
            
            # Stream response chunks to WebSocket client in real-time
            for event_chunk in response['body']:
                chunk = json.loads(event_chunk['chunk']['bytes'])
                
                # Send content chunks as they arrive from Claude
                if chunk['type'] == 'content_block_delta' and chunk['delta']['text']:
                    apigateway_client.post_to_connection(
                        ConnectionId=connection_id,
                        Data=json.dumps({
                            'type': 'content_block_delta',
                            'delta': {'text': chunk['delta']['text']}
                        })
                    )
            
            # Send completion signal to client
            apigateway_client.post_to_connection(
                ConnectionId=connection_id,
                Data=json.dumps({'type': 'message_delta', 'delta': {'stop_reason': 'end_turn'}})
            )
            
            return {'statusCode': 200}
        except ClientError as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': json.dumps({
                    'error': str(e)
                })
            }