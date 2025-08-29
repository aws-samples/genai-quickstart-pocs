"""
Setup utilities for the GenAI Sales Analyst application.
"""
import boto3
import logging
from botocore.exceptions import ClientError
import os
import yaml
from typing import Dict


class SetupManager:
    def __init__(self, region_name: str = 'us-east-1'):
        self.region = region_name
        self.s3 = boto3.client('s3', region_name=region_name)
        self.bedrock = boto3.client('bedrock-runtime', region_name=region_name)
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def create_bucket(self, bucket_name: str) -> bool:
        """Create an S3 bucket for metadata storage"""
        try:
            if self.region == 'us-east-1':
                self.s3.create_bucket(Bucket=bucket_name)
            else:
                self.s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={
                        'LocationConstraint': self.region
                    }
                )

            # Enable versioning
            self.s3.put_bucket_versioning(
                Bucket=bucket_name,
                VersioningConfiguration={'Status': 'Enabled'}
            )

            # Create folders
            folders = ['metadata', 'vector_store', 'models']
            for folder in folders:
                self.s3.put_object(
                    Bucket=bucket_name,
                    Key=f'{folder}/'
                )

            self.logger.info(f"Successfully created bucket: {bucket_name}")
            return True

        except ClientError as e:
            if e.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
                self.logger.info(f"Bucket {bucket_name} already exists")
                return True
            elif e.response['Error']['Code'] == 'BucketAlreadyExists':
                self.logger.error(f"Bucket {bucket_name} already exists but is owned by another account")
                return False
            else:
                self.logger.error(f"Error creating bucket: {e}")
                return False

    def verify_bedrock_access(self) -> bool:
        """Verify Bedrock access and available models"""
        try:
            response = self.bedrock.list_foundation_models()
            models = [model['modelId'] for model in response['modelSummaries']]
            required_models = [
                "anthropic.claude-3-sonnet-20240229-v1:0",
                "amazon.titan-embed-text-v1"
            ]
            
            for model in required_models:
                if model not in models:
                    self.logger.warning(f"Required model {model} not available")
                    return False
                    
            self.logger.info("Bedrock access verified")
            return True

        except Exception as e:
            self.logger.error(f"Error verifying Bedrock access: {e}")
            return False

    def create_streamlit_secrets(self, config: Dict) -> bool:
        """Create Streamlit secrets file"""
        try:
            os.makedirs('.streamlit', exist_ok=True)
            with open('.streamlit/secrets.toml', 'w') as f:
                yaml.dump(config, f)
            self.logger.info("Created Streamlit secrets file")
            return True
        except Exception as e:
            self.logger.error(f"Error creating Streamlit secrets: {e}")
            return False


def run_setup():
    """Run complete setup process"""
    setup = SetupManager()
    
    print("Starting setup process...")
    
    # 1. Get configuration
    config = {
        'aws': {
            'region': input("Enter AWS region (default: us-east-1): ") or 'us-east-1',
            's3_bucket': input("Enter unique S3 bucket name: "),
        },

        }
    }
    
    # 2. Create S3 bucket
    print("\nCreating S3 bucket...")
    if setup.create_bucket(config['aws']['s3_bucket']):
        print("✓ S3 bucket created successfully")
    else:
        print("✗ Failed to create S3 bucket")
        return
    
    # 3. Verify Bedrock access
    print("\nVerifying Bedrock access...")
    if setup.verify_bedrock_access():
        print("✓ Bedrock access verified")
    else:
        print("✗ Bedrock access verification failed")
        return
    
    # 4. Create Streamlit secrets
    print("\nCreating Streamlit secrets...")
    if setup.create_streamlit_secrets(config):
        print("✓ Streamlit secrets created")
    else:
        print("✗ Failed to create Streamlit secrets")
        return
    
    print("\nSetup completed successfully!")
    print(f"Your application is ready to use with bucket: {config['aws']['s3_bucket']}")
    print("\nNext steps:")
    print("1. Run: streamlit run app.py")
    print("2. Upload your metadata through the web interface")
    print("3. Start asking questions!")


if __name__ == "__main__":
    run_setup()