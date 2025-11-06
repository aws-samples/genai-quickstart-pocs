#!/usr/bin/env python3

import boto3
import os
import sys
from pathlib import Path
import argparse

def download_s3_bucket(output_dir="tests/output", service_filter=None):
    # Get AWS account and region from environment or use defaults
    account = os.environ.get('AWS_ACCOUNT_ID')
    region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
    
    if not account:
        # Try to get account from STS
        try:
            sts = boto3.client('sts')
            account = sts.get_caller_identity()['Account']
        except Exception as e:
            print(f"Error getting account ID: {e}")
            sys.exit(1)
    
    bucket_name = f"gensec-security-config-outputs-{account}-{region}"
    local_dir = Path(output_dir)
    
    # Create local directory
    local_dir.mkdir(exist_ok=True)
    
    # Initialize S3 client
    s3 = boto3.client('s3')
    
    try:
        # List all objects in bucket
        paginator = s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=bucket_name)
        
        for page in pages:
            if 'Contents' not in page:
                continue
                
            for obj in page['Contents']:
                key = obj['Key']
                
                # Skip old-stuff folder
                if key.startswith('old-stuff/'):
                    continue
                
                # Filter by service if specified
                if service_filter and service_filter.lower() not in key.lower():
                    continue
                
                # Create local file path
                local_file = local_dir / key
                local_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Download file
                print(f"Downloading: {key}")
                s3.download_file(bucket_name, key, str(local_file))
        
        print(f"Download complete. Files saved to: {local_dir}")
        
    except Exception as e:
        print(f"Error downloading from bucket {bucket_name}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Download S3 outputs, optionally filtered by service')
    parser.add_argument('--service', '-s', help='Service name to filter downloads (e.g., ACM, S3, Lambda)')
    parser.add_argument('--output-dir', '-o', default='../tests/output', help='Output directory (default: ../tests/output)')
    
    args = parser.parse_args()
    
    if args.service:
        print(f"Downloading outputs for service: {args.service}")
    else:
        print("Downloading all outputs")
    
    download_s3_bucket(args.output_dir, args.service)
