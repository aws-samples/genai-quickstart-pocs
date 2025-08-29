"""
Amazon Bedrock helper for the GenAI Sales Analyst application.
"""
import boto3
import json
from typing import List, Dict, Any, Optional


class BedrockHelper:
    """
    Helper class for Amazon Bedrock operations.
    """
    
    def __init__(self, region_name: str = 'us-east-1'):
        """
        Initialize the Bedrock helper.
        
        Args:
            region_name: AWS region name
        """
        self.bedrock_runtime = boto3.client(
            service_name='bedrock-runtime',
            region_name=region_name
        )
    
    def invoke_model(self, 
                    prompt: str, 
                    model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0",
                    max_tokens: int = 4096,
                    temperature: float = 0.7) -> str:
        """
        Invoke a Bedrock model with a prompt.
        
        Args:
            prompt: Input prompt text
            model_id: Bedrock model ID
            max_tokens: Maximum tokens to generate
            temperature: Temperature for generation
            
        Returns:
            Model response text
        """
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })
        
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId=model_id,
                body=body
            )
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
        except Exception as e:
            print(f"Error invoking Bedrock: {str(e)}")
            raise
    
    def get_embeddings(self, text: str) -> List[float]:
        """
        Get embeddings for a text using Bedrock.
        
        Args:
            text: Input text
            
        Returns:
            List of embedding values
        """
        try:
            response = self.bedrock_runtime.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                body=json.dumps({"inputText": text})
            )
            response_body = json.loads(response['body'].read())
            return response_body['embedding']
        except Exception as e:
            print(f"Error getting embeddings: {str(e)}")
            raise