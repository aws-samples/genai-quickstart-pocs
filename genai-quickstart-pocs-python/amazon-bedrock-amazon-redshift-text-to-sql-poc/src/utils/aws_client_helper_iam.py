"""
AWS client helper with IAM role authentication.
"""
import boto3
import os

def create_aws_client(service_name, region_name=None):
    """
    Create AWS client using IAM role authentication.
    
    Args:
        service_name: AWS service name (e.g., 'ec2', 'redshift', 'iam')
        region_name: AWS region name
        
    Returns:
        Configured boto3 client
    """
    if not region_name:
        region_name = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'
    
    # Use default credentials (IAM role from EC2 instance)
    client = boto3.client(service_name, region_name=region_name)
    
    return client

def get_current_region():
    """Get current AWS region from instance metadata or environment."""
    try:
        # Try to get from instance metadata
        import requests
        response = requests.get(
            'http://169.254.169.254/latest/meta-data/placement/region',
            timeout=2
        )
        if response.status_code == 200:
            return response.text
    except:
        pass
    
    # Fallback to environment variables
    return os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'
