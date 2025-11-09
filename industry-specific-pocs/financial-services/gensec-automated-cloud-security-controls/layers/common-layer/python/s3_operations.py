"""
S3 Operations Layer
Common functions for S3 operations across Lambda functions
"""
import json
import boto3
import logging
import concurrent.futures
from datetime import datetime

logger = logging.getLogger()
s3_client = boto3.client('s3')

def store_output_in_s3(prefix, template_data, output_bucket):
    """Store IaC template in S3 with proper prefixing"""
    try:
        if isinstance(template_data, dict):
            filename = template_data.get('filename', 'template.tf')
            content = template_data.get('code', str(template_data))
        else:
            template_str = str(template_data)
            
            if 'filename:' in template_str.lower():
                lines = template_str.split('\n')
                filename_line = next((line for line in lines if 'filename:' in line.lower()), None)
                if filename_line:
                    import re
                    filename_match = re.search(r'\*?\*?filename:\s*`?([^`*\n]+)`?\*?\*?', filename_line, re.IGNORECASE)
                    if filename_match:
                        filename = filename_match.group(1).strip()
                    else:
                        filename = 'template.tf'
                else:
                    filename = 'template.tf'
                content = template_str
            else:
                filename = 'template.tf'
                content = template_str
        
        file_key = f"{prefix}/{filename}"
        
        s3_client.put_object(
            Bucket=output_bucket,
            Key=file_key,
            Body=content,
            ContentType='text/plain'
        )
        
        logger.info(f"Stored template in S3: {file_key}")
        return file_key
        
    except Exception as e:
        logger.error(f"Error storing template in S3: {str(e)}")
        raise

def store_control_file(file_key, content, output_bucket):
    """Store a single control file in S3"""
    try:
        if not content:
            logger.warning(f"Empty content for file: {file_key}")
            return None
            
        s3_client.put_object(
            Bucket=output_bucket,
            Key=file_key,
            Body=content,
            ContentType='text/plain'
        )
        
        logger.info(f"Successfully stored file in S3: {file_key}")
        return file_key
        
    except Exception as e:
        logger.error(f"Error storing file {file_key} in S3: {str(e)}")
        return None

def store_controls_in_parallel(service_id, config_id, controls, output_bucket):
    """Store controls in parallel using thread pool"""
    generated_files = []
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = []
            
            control_types = {
                'detective_controls': 'detective_controls',
                'preventive_controls': 'preventive_controls',
                'proactive_controls': 'proactive_controls'
            }
            
            for control_type, path in control_types.items():
                if control_type in controls and controls[control_type].get('code'):
                    file_key = f"{service_id}/{path}/{config_id}/{controls[control_type]['filename']}"
                    logger.info(f"Submitting {control_type} file: {file_key}")
                    
                    futures.append(executor.submit(
                        store_control_file,
                        file_key,
                        controls[control_type]['code'],
                        output_bucket
                    ))
            
            for future in concurrent.futures.as_completed(futures):
                try:
                    result = future.result()
                    if result:
                        generated_files.append(result)
                        logger.info(f"Successfully stored file: {result}")
                except Exception as e:
                    logger.error(f"Error in file storage thread: {str(e)}")
        
        return generated_files
        
    except Exception as e:
        logger.error(f"Error in parallel file storage: {str(e)}")
        return generated_files

def store_json_and_markdown(service_id, prefix, json_data, markdown_content, output_bucket):
    """Store both JSON and markdown versions of content"""
    try:
        # Add storage timestamp
        if isinstance(json_data, dict) and '_metadata' in json_data:
            json_data['_metadata']['storage_timestamp'] = datetime.utcnow().isoformat()
        
        # Store JSON version
        s3_client.put_object(
            Bucket=output_bucket,
            Key=f"{service_id}/{prefix}.json",
            Body=json.dumps(json_data, indent=2),
            ContentType='application/json',
            Metadata={
                "validated": "true",
                "storage_date": datetime.utcnow().isoformat()
            }
        )
        
        # Store markdown version
        s3_client.put_object(
            Bucket=output_bucket,
            Key=f"{service_id}/{prefix}.md",
            Body=markdown_content,
            ContentType='text/markdown',
            Metadata={
                "validated": "true",
                "storage_date": datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Stored JSON and markdown for service: {service_id}")
        
    except Exception as e:
        logger.error(f"Error storing JSON and markdown: {str(e)}")
        raise
