#!/usr/bin/env python3

import boto3
import logging
import time
import os
from typing import List, Dict, Any, Callable, TypeVar, Optional
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from .log_processor import LogProcessor


class EMRAnalysisError(Exception):
    """Custom exception for EMR analysis errors"""

    def __init__(self, message: str, original_error: Exception = None):
        super().__init__(message)
        self.original_error = original_error


# Load environment variables
load_dotenv()

# Type variable for generic return type
T = TypeVar('T')

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s: %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def handle_aws_error(func: Callable[..., T], *args, default_return: Optional[T] = None,
                     error_message: str = "AWS API error", raise_exception: bool = False, **kwargs) -> T:
    """Utility function to handle AWS API errors consistently"""
    try:
        return func(*args, **kwargs)
    except ClientError as e:
        func_name = getattr(func, '__name__', 'unknown')
        full_error = f"{error_message} in {func_name}: {e}"
        # Sanitize error message for logging to prevent log injection
        safe_error_msg = full_error.replace('\n', '').replace('\r', '').replace('\t', '')
        logger.error(safe_error_msg)
        if raise_exception:
            raise EMRAnalysisError(full_error, e)
        return default_return


class EMRAnalyzer:
    def __init__(self, region: str = None):
        # Use dotenv pattern: parameter -> .env file -> default
        self.region = region or os.getenv('AWS_DEFAULT_REGION', 'us-east-1')
        self.athena = boto3.client('athena', region_name=region)
        self.glue = boto3.client('glue', region_name=region)
        self.emr = boto3.client('emr', region_name=region)
        self.log_processor = LogProcessor(region)
        self.query_templates = None
        self.verification_logs = []

    def _get_default_bucket_name(self) -> str:
        """Get default S3 bucket name for log analysis"""
        bucket_name = os.getenv('S3_BUCKET_NAME')
        if not bucket_name:
            account_id = boto3.client('sts').get_caller_identity()['Account']
            bucket_name = f"emr-log-analysis-{account_id}-{self.region}".lower()
        return bucket_name

    def _auto_detect_database(self) -> str:
        """Auto-detect database and log the result"""
        database_name = self.find_emr_kb_database()
        logger.info(f"Auto-detected database: {database_name}")
        return database_name

    def _analyze_logs_workflow(self, logs_location: str, metadata: Dict = None,
                               database_name: str = None, output_location: str = None,
                               known_issues_table: str = None, date_pattern: str = None) -> Dict[str, Any]:
        """Common workflow for analyzing logs from any source"""
        # Auto-detect database if not provided
        if not database_name:
            database_name = self._auto_detect_database()

        # Set default output location if not provided
        if not output_location:
            bucket = logs_location.split('/')[2]  # Extract bucket from s3://bucket/path
            output_location = f's3://{bucket}/athena-results/'

        result = self.analyze_emr_logs(database_name, logs_location, output_location,
                                       known_issues_table, date_pattern)

        # Add metadata to result
        if metadata:
            result.update(metadata)
        return result

    def get_cluster_log_location(self, cluster_id: str) -> str:
        """Get S3 log location for EMR cluster"""
        response = handle_aws_error(
            self.emr.describe_cluster,
            ClusterId=cluster_id,
            error_message=f"Error getting info for cluster {cluster_id}",
            raise_exception=True
        )

        log_uri = response['Cluster'].get('LogUri')
        if not log_uri:
            raise EMRAnalysisError(f"No LogUri configured for cluster {cluster_id}")

        # Convert s3n:// to s3:// for Athena compatibility
        if log_uri.startswith('s3n://'):
            log_uri = log_uri.replace('s3n://', 's3://')
        return log_uri.rstrip('/') + f'/{cluster_id}/'

    def create_logs_table(self, database_name: str, table_name: str, logs_location: str,
                          output_location: str) -> str:
        """Create external table for EMR logs"""
        create_table_query = self.log_processor.create_logs_table_query(self.query_templates, table_name, logs_location)
        return self.execute_query(create_table_query, database_name, output_location)

    def execute_analysis_query(self, database_name: str, logs_table_name: str,
                               known_issues_table: str, date_pattern: str = None,
                               output_location: str = None) -> str:
        """Execute comprehensive analysis query using all keywords from known_issues table"""
        dml_query = self.log_processor.create_analysis_query(self.query_templates, logs_table_name, date_pattern)
        return self.execute_query(dml_query, database_name, output_location)

    def execute_query(self, query: str, database_name: str, output_location: str) -> str:
        """Execute Athena query and return execution ID"""
        response = handle_aws_error(
            self.athena.start_query_execution,
            QueryString=query,
            QueryExecutionContext={'Database': database_name},
            ResultConfiguration={'OutputLocation': output_location},
            error_message="Error executing Athena query",
            raise_exception=True
        )

        return response['QueryExecutionId']

    def wait_for_query_completion(self, execution_id: str, timeout: int = 120) -> str:
        """Wait for query to complete and return status"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            response = handle_aws_error(
                self.athena.get_query_execution,
                QueryExecutionId=execution_id,
                error_message=f"Error checking status for query {execution_id}",
                default_return={'QueryExecution': {'Status': {'State': 'FAILED'}}}
            )

            status = response['QueryExecution']['Status']['State']

            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                if status != 'SUCCEEDED':
                    reason = response['QueryExecution']['Status'].get('StateChangeReason', 'Unknown')
                    # amazonq-ignore-next-line
                    logger.error(f"Query {execution_id} {status}: {reason}")
                return status

            time.sleep(5)

        # amazonq-ignore-next-line
        logger.error(f"Query {execution_id} timed out")
        return 'TIMEOUT'

    def create_results_table_and_analyze(
            self,
            database_name: str,
            results_table: str,
            known_issues_table: str,
            results_location: str,
            output_location: str) -> List[str]:
        """Create results table and run analysis queries using proper sequential execution"""
        execution_ids = []

        # Get all queries from log processor
        queries = self.log_processor.create_results_table_queries(
            self.query_templates, results_table, known_issues_table, results_location)

        # Execute table creation query first
        # amazonq-ignore-next-line
        logger.info(f"Creating results table: {results_table}")
        ddl_exec_id = self.execute_query(queries[0], database_name, output_location)
        execution_ids.append(ddl_exec_id)

        if self.wait_for_query_completion(ddl_exec_id) != 'SUCCEEDED':
            raise EMRAnalysisError("Failed to create results table")

        # Execute analysis queries
        logger.info("Executing analysis queries")
        for i, query in enumerate(queries[1:], 1):
            logger.info(f"Executing analysis query {i}")
            analysis_exec_id = self.execute_query(query, database_name, output_location)
            execution_ids.append(analysis_exec_id)

            if self.wait_for_query_completion(analysis_exec_id) != 'SUCCEEDED':
                logger.warning(f"Analysis query {i} failed, but continuing...")

        return execution_ids

    def analyze_emr_cluster(self, cluster_id: str, database_name: str = None,
                            output_location: str = None, known_issues_table: str = None,
                            date_pattern: str = None) -> Dict[str, Any]:
        """Analyze EMR cluster logs by cluster ID"""
        logs_location = self.get_cluster_log_location(cluster_id)
        return self._analyze_logs_workflow(
            logs_location=logs_location,
            metadata={'cluster_id': cluster_id},
            database_name=database_name,
            output_location=output_location,
            known_issues_table=known_issues_table,
            date_pattern=date_pattern
        )

    def find_emr_kb_database(self) -> str:
        """Auto-detect the correct EMR KB database by finding one with known_issues table"""
        try:
            # Get all databases
            response = handle_aws_error(
                self.glue.get_databases,
                error_message="Error getting Glue databases",
                default_return={'DatabaseList': []}
            )
            databases = response.get('DatabaseList', [])

            # Look for databases with 'emr' or 'kb' in the name
            candidate_dbs = []
            for db in databases:
                db_name = db['Name']
                if any(keyword in db_name.lower() for keyword in ['emr', 'kb']):
                    candidate_dbs.append(db_name)

            # Check each candidate for known_issues table
            for db_name in candidate_dbs:
                tables = handle_aws_error(
                    self.glue.get_tables,
                    DatabaseName=db_name,
                    error_message=f"Error getting tables for database {db_name}",
                    default_return={'TableList': []}
                )
                table_names = [t['Name'] for t in tables.get('TableList', [])]
                if 'known_issues' in table_names:
                    logger.info(f"Found EMR KB database: {db_name}")
                    return db_name

            # Fallback: try common names
            for fallback in ['emr_kb_dev', 'emr_kb', 'emr_kb_prod']:
                if self.ensure_database_exists(fallback):
                    tables = handle_aws_error(
                        self.glue.get_tables,
                        DatabaseName=fallback,
                        error_message=f"Error getting tables for database {fallback}",
                        default_return={'TableList': []}
                    )
                    table_names = [t['Name'] for t in tables.get('TableList', [])]
                    if 'known_issues' in table_names:
                        logger.info(f"Using fallback database: {fallback}")
                        return fallback

            logger.warning("Using default database: emr_kb_dev")
            return 'emr_kb_dev'

        except Exception as e:
            # Sanitize exception message for logging to prevent log injection
            safe_error_msg = str(e).replace('\n', '').replace('\r', '').replace('\t', '')
            logger.error(f"Error finding EMR KB database: {safe_error_msg}")
            return 'emr_kb_dev'

    def ensure_database_exists(self, database_name: str) -> bool:
        """Check if the Glue database exists"""
        try:
            self.glue.get_database(Name=database_name)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'EntityNotFoundException':
                return False
            else:
                # amazonq-ignore-next-line
                logger.error(f"Error checking database {database_name}: {e}")
                raise EMRAnalysisError(f"Error checking database {database_name}: {e}", e)

    def analyze_emr_logs(self, database_name: str, logs_location: str, output_location: str,
                         known_issues_table: str = None, date_pattern: str = None) -> Dict[str, Any]:
        """Main analysis workflow"""
        if not known_issues_table:
            # amazonq-ignore-next-line
            known_issues_table = f"{database_name}.known_issues"
            # amazonq-ignore-next-line
            logger.info(f"Using table: {known_issues_table}")

        db_exists = self.ensure_database_exists(database_name)
        if not db_exists:
            raise EMRAnalysisError(f"Database {database_name} does not exist. Please create it first.")

        query_templates_path = self.log_processor.get_templates_path()
        self.query_templates = self.log_processor.load_query_templates(query_templates_path, database_name)

        results = {
            'database_name': database_name,
            'logs_location': logs_location,
            'output_location': output_location,
            'execution_ids': [],
            'status': 'STARTED',
            'errors_found': False
        }

        try:
            timestamp = str(int(time.time()))
            logs_table = f"emr_logs_{timestamp}"

            logger.info("Step 1: Creating logs table")
            logs_table_exec_id = self.create_logs_table(database_name, logs_table, logs_location, output_location)
            results['execution_ids'].append(logs_table_exec_id)

            if self.wait_for_query_completion(logs_table_exec_id) != 'SUCCEEDED':
                raise EMRAnalysisError("Failed to create logs table")

            logger.info("Step 2: Executing analysis query")
            analysis_exec_id = self.execute_analysis_query(
                database_name, logs_table, known_issues_table, date_pattern, output_location
            )
            results['execution_ids'].append(analysis_exec_id)
            results['logs_table'] = logs_table

            if self.wait_for_query_completion(analysis_exec_id) != 'SUCCEEDED':
                raise EMRAnalysisError("Analysis query failed")

            analysis_results = self.log_processor.check_analysis_results(self.athena, analysis_exec_id)
            results['errors_found'] = analysis_results['errors_found']

            logger.info("Step 3: Creating results table and running analysis")
            results_table = f"{logs_table}_analysis_results"
            results_location = self.log_processor.copy_s3_results(output_location, analysis_exec_id)

            analysis_exec_ids = self.create_results_table_and_analyze(
                database_name, results_table, known_issues_table, results_location, output_location
            )
            results['execution_ids'].extend(analysis_exec_ids)
            results['results_table'] = results_table

            for exec_id in analysis_exec_ids:
                if self.wait_for_query_completion(exec_id) != 'SUCCEEDED':
                    # amazonq-ignore-next-line
                    logger.warning(f"Analysis query {exec_id} failed, but continuing...")

            results['status'] = 'COMPLETED'
            logger.info("EMR Log Analysis Completed")

        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            results['status'] = 'FAILED'
            results['error'] = str(e)

        return results

    def upload_logs_to_s3(self, logs_dict: Dict, session_id: str) -> str:
        """Upload logs to S3 bucket and return S3 location"""
        bucket_name = self._get_default_bucket_name()
        self.verification_logs.append(f"Using bucket: {bucket_name}")

        s3_client = boto3.client('s3', region_name=self.region)

        # Create bucket if it doesn't exist
        try:
            s3_client.head_bucket(Bucket=bucket_name)
            self.verification_logs.append(f"Bucket {bucket_name} exists")
        except Exception:
            self.verification_logs.append(f"Bucket {bucket_name} doesn't exist, creating...")
            try:
                if self.region == 'us-east-1':
                    s3_client.create_bucket(Bucket=bucket_name)
                else:
                    s3_client.create_bucket(
                        Bucket=bucket_name,
                        CreateBucketConfiguration={'LocationConstraint': self.region}
                    )
                self.verification_logs.append(f"Successfully created bucket: {bucket_name}")
            except Exception as create_error:
                self.verification_logs.append(f"Failed to create bucket: {create_error}")
                raise EMRAnalysisError(f"Cannot create bucket {bucket_name}: {create_error}", create_error)

        s3_prefix = f"uploaded-logs/{session_id}/"

        for filename, log_info in logs_dict.items():
            s3_key = f"{s3_prefix}{filename}"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=log_info['content'].encode('utf-8')
            )

        # amazonq-ignore-next-line
        return f"s3://{bucket_name}/{s3_prefix}"

    async def analyze_uploaded_logs(self, logs_dict: Dict, session_id: str = None) -> Dict:
        """Analyze uploaded logs using Athena (same as cluster analysis)"""
        try:
            if not session_id:
                session_id = str(int(time.time()))

            # Upload logs to S3
            s3_location = self.upload_logs_to_s3(logs_dict, session_id)

            # Set output location using helper method
            bucket_name = self._get_default_bucket_name()
            output_location = f's3://{bucket_name}/athena-results/'

            # Use common analysis workflow
            result = self._analyze_logs_workflow(
                logs_location=s3_location,
                metadata={'analysis_type': 'uploaded_logs'},
                output_location=output_location
            )

            # Get findings from Athena results if analysis succeeded
            issues = []
            if result.get('status') == 'COMPLETED' and result.get('results_table'):
                issues = await self.query_athena_results(
                    result.get('database_name'),
                    result.get('results_table'),
                    output_location
                )

            return {
                'success': result.get('status') == 'COMPLETED',
                'issues': issues,
                'database_name': result.get('database_name'),
                'results_table': result.get('results_table'),
                'logs_location': s3_location,
                'analysis_results': {'status': result.get('status', 'COMPLETED')},
                'execution_ids': result.get('execution_ids', []),
                'analysis_type': 'uploaded_logs'
            }

        except Exception as e:
            self.verification_logs.append(f"Error analyzing uploaded logs: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    async def query_athena_results(self, database_name: str, results_table: str, output_location: str) -> List[Dict]:
        """Query Athena results table to get findings with proper aggregation and counts"""
        if not results_table:
            return []

        try:
            # Use aggregation query like the old version to group and count occurrences
            query = f"""
            SELECT
                r.issue_id,
                r.matched_keyword,
                COUNT(*) as occurrence_count,
                MAX(r.data) as sample_data
            FROM {database_name}.{results_table} r
            GROUP BY r.issue_id, r.matched_keyword
            ORDER BY occurrence_count DESC
            LIMIT 50
            """

            # amazonq-ignore-next-line
            logger.info(f"Executing aggregation query on {database_name}.{results_table}")
            exec_id = self.execute_query(query, database_name, output_location)

            if self.wait_for_query_completion(exec_id) != 'SUCCEEDED':
                logger.warning("Aggregation query failed, falling back to simple query")
                # Fallback to simple query if aggregation fails
                return await self._query_athena_results_fallback(database_name, results_table, output_location)

            response = self.athena.get_query_results(QueryExecutionId=exec_id)
            rows = response.get('ResultSet', {}).get('Rows', [])

            if len(rows) <= 1:  # Only header or no data
                # amazonq-ignore-next-line
                logger.info(f"No data found in aggregation query for {results_table}")
                return []

            # Convert to list of dictionaries with proper field mapping
            results = []
            for row in rows[1:]:  # Skip header
                data = row.get('Data', [])
                if len(data) >= 4:  # Ensure we have all expected columns
                    result = {
                        'issue_id': data[0].get('VarCharValue', 'N/A'),
                        'matched_keyword': data[1].get('VarCharValue', 'N/A'),
                        'occurrence_count': int(data[2].get('VarCharValue', '0')) if data[2].get('VarCharValue', '0').isdigit() else 0,
                        # Limit sample data length
                        'sample_data': data[3].get('VarCharValue', 'No sample available')[:500]
                    }
                    results.append(result)

            logger.info(f"Successfully retrieved {len(results)} aggregated findings")
            return results

        except Exception as e:
            logger.error(f"Error querying Athena results: {e}")
            # Try fallback approach
            return await self._query_athena_results_fallback(database_name, results_table, output_location)

    def _process_query_results(self, rows: List, headers: List[str]) -> List[Dict]:
        """Process raw query results into normalized format"""
        raw_results = []
        for row in rows[1:]:  # Skip header
            data = row.get('Data', [])
            result = {}
            for i, header in enumerate(headers):
                if i < len(data):
                    result[header] = data[i].get('VarCharValue', '')
            raw_results.append(result)

        # Try to aggregate manually if we have the right fields
        if raw_results and 'issue_id' in headers and 'matched_keyword' in headers:
            aggregated = {}
            for item in raw_results:
                key = (item.get('issue_id', 'N/A'), item.get('matched_keyword', 'N/A'))
                if key not in aggregated:
                    aggregated[key] = {
                        'issue_id': item.get('issue_id', 'N/A'),
                        'matched_keyword': item.get('matched_keyword', 'N/A'),
                        'occurrence_count': 1,
                        'sample_data': item.get('data', item.get('sample_data', 'No sample available'))[:500]
                    }
                else:
                    aggregated[key]['occurrence_count'] += 1

            # Sort by occurrence count
            results = sorted(aggregated.values(), key=lambda x: x['occurrence_count'], reverse=True)
            logger.info(f"Manual aggregation created {len(results)} findings")
            return results[:50]  # Limit to top 50

        # If we can't aggregate, return raw results with normalized field names
        normalized_results = []
        for item in raw_results:
            normalized = {
                'issue_id': item.get('issue_id', 'N/A'),
                'matched_keyword': item.get('matched_keyword', 'N/A'),
                'occurrence_count': 1,  # Default to 1 since we can't count
                'sample_data': item.get('data', item.get('sample_data', 'No sample available'))[:500]
            }
            normalized_results.append(normalized)

        return normalized_results[:50]  # Limit results

    async def _query_athena_results_fallback(
            self,
            database_name: str,
            results_table: str,
            output_location: str) -> List[Dict]:
        """Fallback method for querying results when aggregation fails"""
        try:
            query = f"SELECT * FROM {database_name}.{results_table} LIMIT 100"
            exec_id = self.execute_query(query, database_name, output_location)

            if self.wait_for_query_completion(exec_id) != 'SUCCEEDED':
                return []

            response = self.athena.get_query_results(QueryExecutionId=exec_id)
            rows = response.get('ResultSet', {}).get('Rows', [])

            if len(rows) <= 1:  # Only header or no data
                return []

            # Extract headers and process results using helper method
            headers = [col.get('VarCharValue', '') for col in rows[0].get('Data', [])]
            return self._process_query_results(rows, headers)

        except Exception as e:
            # Sanitize exception message for logging to prevent log injection
            safe_error_msg = str(e).replace('\n', '').replace('\r', '').replace('\t', '')
            logger.error(f"Fallback query also failed: {safe_error_msg}")
            return []
