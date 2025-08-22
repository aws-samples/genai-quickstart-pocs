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
    "name": "pull_s3_data___get_investments",
    "description": "Get investment information from S3 CSV data. Can filter by investor ID, fund ID, date range, or amount range.",
    "inputSchema": {
        "json": {
            "type": "object",
            "properties": {
                "investor_id": {
                    "type": "string",
                    "description": "Filter by specific investor ID"
                },
                "fund_id": {
                    "type": "string",
                    "description": "Filter by specific fund ID"
                },
                "investor_class": {
                    "type": "string",
                    "description": "Filter by investor class (ClassA, ClassB, Institutional)"
                },
                "min_amount": {
                    "type": "number",
                    "description": "Minimum investment amount filter"
                },
                "max_amount": {
                    "type": "number",
                    "description": "Maximum investment amount filter"
                },
                "start_date": {
                    "type": "string",
                    "description": "Start date filter (YYYY-MM-DD format)"
                },
                "end_date": {
                    "type": "string",
                    "description": "End date filter (YYYY-MM-DD format)"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default: 100)"
                }
            },
            "required": []
        }
    }
}

def pull_s3_data___get_investments(tool, **kwargs: Any):
    tool_use_id = tool["toolUseId"]
    tool_input = tool["input"]
    
    # Get filter parameters
    investor_id = tool_input.get("investor_id", "")
    fund_id = tool_input.get("fund_id", "")
    investor_class = tool_input.get("investor_class", "")
    min_amount = tool_input.get("min_amount")
    max_amount = tool_input.get("max_amount")
    start_date = tool_input.get("start_date", "")
    end_date = tool_input.get("end_date", "")
    limit = tool_input.get("limit", 100)
    
    # Get bucket name from configuration
    bucket = FUND_DOCUMENTS_BUCKET
    if not bucket:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": "FUND_DOCUMENTS_BUCKET environment variable not set and could not auto-discover bucket"}]
        }
    
    try:
        s3_client = boto3.client('s3', region_name='us-east-1')
        s3_key = "database/investments.csv"
        
        response = s3_client.get_object(Bucket=bucket, Key=s3_key)
        csv_content = response['Body'].read().decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        investments = []
        
        for row in csv_reader:
            # Apply filters
            if investor_id and row.get('investor_id') != investor_id:
                continue
                
            if fund_id and row.get('fund_id') != fund_id:
                continue
                
            if investor_class and row.get('investor_class') != investor_class:
                continue
                
            if min_amount is not None:
                try:
                    amount = float(row.get('investment_amount', 0))
                    if amount < min_amount:
                        continue
                except (ValueError, TypeError):
                    continue
                    
            if max_amount is not None:
                try:
                    amount = float(row.get('investment_amount', 0))
                    if amount > max_amount:
                        continue
                except (ValueError, TypeError):
                    continue
                    
            if start_date and row.get('call_date', '') < start_date:
                continue
                
            if end_date and row.get('call_date', '') > end_date:
                continue
            
            investments.append(row)
            
            # Apply limit
            if len(investments) >= limit:
                break
        
        result = {
            'total_found': len(investments),
            'filters_applied': {
                'investor_id': investor_id if investor_id else None,
                'fund_id': fund_id if fund_id else None,
                'investor_class': investor_class if investor_class else None,
                'min_amount': min_amount,
                'max_amount': max_amount,
                'start_date': start_date if start_date else None,
                'end_date': end_date if end_date else None,
                'limit': limit
            },
            'investments': investments
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
            "content": [{"text": f"Investments data not found: {s3_key} in bucket {bucket}"}]
        }
    except Exception as e:
        return {
            "toolUseId": tool_use_id,
            "status": "error",
            "content": [{"text": f"Error: {str(e)}"}]
        }
