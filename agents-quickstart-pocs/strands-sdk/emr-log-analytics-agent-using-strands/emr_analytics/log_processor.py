#!/usr/bin/env python3

import boto3
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class LogProcessor:
    """Handles heavy log processing operations including query templates, table creation, and S3 operations"""

    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.s3 = boto3.client('s3', region_name=region)

    def load_query_templates(self, templates_path: str, database_name: str = None) -> List[str]:
        """Load and process Athena query templates from file"""
        try:
            # Validate path to prevent path traversal attacks
            normalized_path = os.path.normpath(templates_path)
            if '..' in normalized_path or not os.path.isabs(normalized_path):
                raise ValueError(f"Invalid template path: {templates_path}")
            
            with open(normalized_path, 'r') as f:
                content = f.read().strip()
                queries = content.split('\n')
                result = [q.strip() for q in queries if q.strip()]

                # Replace table name placeholder with fully qualified name
                if database_name:
                    result = [q.replace('known_issues_table_name', f'{database_name}.known_issues') for q in result]

                return result
        except Exception as e:
            raise Exception(f"Error reading query templates: {e}")

    def get_templates_path(self) -> str:
        """Get the path to query templates"""
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)  # Go up one level from emr_analytics to root
        return os.path.join(project_root, 'bedrock-kb-data', 'athena_queries')

    def create_logs_table_query(self, templates: List[str], table_name: str, logs_location: str) -> str:
        """Generate logs table creation query"""
        create_table_query = templates[1].replace('logs_table_name', table_name).replace('logs_location', logs_location)
        # Sanitize table_name for logging to prevent log injection
        safe_table_name = table_name.replace('\n', '').replace('\r', '').replace('\t', '')
        logger.info(f"Creating logs table: {safe_table_name}")
        return create_table_query

    def create_analysis_query(self, templates: List[str], logs_table_name: str, date_pattern: str = None) -> str:
        """Generate analysis query with optional date filtering"""
        query_index = 4 if date_pattern else 3
        dml_query = templates[query_index].replace('logs_table_name', logs_table_name)

        log_msg = "Executing keyword-based analysis"
        if date_pattern:
            # Sanitize date_pattern for logging to prevent log injection
            safe_date_pattern = date_pattern.replace('\n', '').replace('\r', '').replace('\t', '')
            log_msg += f" with date filter: {safe_date_pattern}"
        logger.info(log_msg)

        return dml_query

    def create_results_table_queries(self, templates: List[str], results_table: str,
                                     known_issues_table: str, results_location: str) -> List[str]:
        """Generate results table creation and analysis queries"""
        queries = []

        # Create results table query (index 6)
        create_table_query = templates[6].replace(
            'emr_log_analysis_table_name', results_table).replace(
            'athena_output_location', results_location)
        queries.append(create_table_query)

        # Analysis queries (index 7 and 9)
        analysis_query_1 = templates[7].replace(
            'emr_log_analysis_table_name',
            results_table).replace(
            'known_issues_table_name',
            known_issues_table)
        analysis_query_2 = templates[9].replace('emr_log_analysis_table_name', results_table)

        queries.extend([analysis_query_1, analysis_query_2])
        return queries

    def copy_s3_results(self, output_location: str, analysis_exec_id: str) -> str:
        """Copy S3 results to specific subdirectory"""
        # amazonq-ignore-next-line
        results_location = f"{output_location.rstrip('/')}/step2-results-{analysis_exec_id}/"
        source_bucket = output_location.split('/')[2]
        # amazonq-ignore-next-line
        source_key = f"athena-results/{analysis_exec_id}.csv"
        # amazonq-ignore-next-line
        dest_key = f"athena-results/step2-results-{analysis_exec_id}/{analysis_exec_id}.csv"

        try:
            self.s3.copy_object(
                CopySource={'Bucket': source_bucket, 'Key': source_key},
                Bucket=source_bucket,
                Key=dest_key
            )
            # Sanitize results_location for XSS prevention
            safe_results_location = results_location.replace('<', '&lt;').replace('>', '&gt;').replace('&', '&amp;').replace('"', '&quot;').replace("'", '&#x27;')
            return safe_results_location
        except Exception as e:
            logger.warning(f"Could not copy results: {e}, using original location")
            # Sanitize output_location for XSS prevention
            safe_output_location = output_location.replace('<', '&lt;').replace('>', '&gt;').replace('&', '&amp;').replace('"', '&quot;').replace("'", '&#x27;')
            return safe_output_location

    def check_analysis_results(self, athena_client, analysis_exec_id: str) -> Dict[str, Any]:
        """Check if analysis found any errors"""
        try:
            error_results = athena_client.get_query_results(QueryExecutionId=analysis_exec_id)
            if len(error_results['ResultSet']['Rows']) > 1:  # More than just header row
                error_count = len(error_results['ResultSet']['Rows']) - 1
                logger.info(f"Found {error_count} error patterns in logs")

                if error_count >= 200:
                    logger.warning("Maximum number of errors found (200) - there may be more errors")

                return {'errors_found': True, 'error_count': error_count}
            else:
                logger.info("No error patterns found in logs")
                return {'errors_found': False, 'error_count': 0}
        except Exception as e:
            logger.error(f"Error checking analysis results: {e}")
            return {'errors_found': False, 'error_count': 0}
