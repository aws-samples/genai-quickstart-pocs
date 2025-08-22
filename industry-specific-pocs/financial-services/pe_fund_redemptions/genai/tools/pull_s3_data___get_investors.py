import boto3
import json
import os
import csv
import io
from typing import Any

# Get configuration from environment variables
FUND_DOCUMENTS_BUCKET = os.environ.get('FUND_DOCUMENTS_BUCKET')
if not FUND_DOCUMENTS_BUCKET:
    # Fallback: auto-discover bucket by pattern
    try:
        s3_client = boto3.client('s3', region_name='us-east-1')
        response = s3_client.list_buckets()
        for bucket_info in response['Buckets']:
            bucket_name = bucket_info['Name']
            if bucket_name.startswith('pe-fund-documents-'):
                FUND_DOCUMENTS_BUCKET = bucket_name
                break
    except:
        FUND_DOCUMENTS_BUCKET = None

TOOL_SPEC = {
    "name": "pull_s3_data___get_investors",
    "description": "Get investor information from S3 CSV data. Can filter by investor name, ID, or net worth range.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "investor_name": {
                    "type": "string",
                    "description": "Filter by investor name (partial match supported)"
                },
                "investor_id": {
                    "type": "string",
                    "description": "Filter by specific investor ID"
                },
                "min_net_worth": {
                    "type": "number",
                    "description": "Minimum estimated net worth filter"
                },
                "max_net_worth": {
                    "type": "number",
                    "description": "Maximum estimated net worth filter"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default: 50)"
                }
            },
            "required": []
        }
    }
}

def pull_s3_data___get_investors(tool, **kwargs: Any):
    tool_use_id = tool["toolUseId"]
    tool_input = tool["input"]
    
    # Get filter parameters
    investor_name = tool_input.get("investor_name", "").lower()
    investor_id = tool_input.get("investor_id", "")
    min_net_worth = tool_input.get("min_net_worth")
    max_net_worth = tool_input.get("max_net_worth")
    limit = tool_input.get("limit", 50)
    
    # Get bucket name from configuration
    bucket = FUND_DOCUMENTS_BUCKET
    if not bucket:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": "FUND_DOCUMENTS_BUCKET environment variable not set and could not auto-discover bucket"}]
        }
    
    try:
        # Create S3 client - let boto3 automatically discover credentials from container IAM role
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_key = "database/investors.csv"
        
        print(f"Attempting to access s3://{bucket}/{s3_key}")  # Debug logging
        
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        investors = []
        
        for row in csv_reader:
            # Apply filters
            if investor_id and row.get('investor_id') != investor_id:
                continue
                
            if investor_name and investor_name not in row.get('investor_name', '').lower():
                continue
                
            if min_net_worth is not None:
                try:
                    net_worth = float(row.get('estimated_net_worth', 0))
                    if net_worth < min_net_worth:
                        continue
                except (ValueError, TypeError):
                    continue
                    
            if max_net_worth is not None:
                try:
                    net_worth = float(row.get('estimated_net_worth', 0))
                    if net_worth > max_net_worth:
                        continue
                except (ValueError, TypeError):
                    continue
            
            investors.append(row)
            
            # Apply limit
            if len(investors) >= limit:
                break
        
        result = {
            'total_found': len(investors),
            'filters_applied': {
                'investor_name': investor_name if investor_name else None,
                'investor_id': investor_id if investor_id else None,
                'min_net_worth': min_net_worth,
                'max_net_worth': max_net_worth,
                'limit': limit
            },
            'investors': investors,
            'source': f's3://{bucket}/{s3_key}',
            'data_source': 'S3 CSV Database'
        }
        
        return {
            "toolUseId": tool_use_id,
            "status": "success",
            "content": [{"text": json.dumps(result, indent=2)}]
        }
        
    except s3_client.exceptions.NoSuchKey:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Investors data not found: {s3_key} in bucket {bucket}"}]
        }
    except Exception as e:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Error: {str(e)}"}]
        }
