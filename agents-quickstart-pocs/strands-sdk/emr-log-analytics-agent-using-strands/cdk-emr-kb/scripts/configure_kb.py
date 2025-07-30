#!/usr/bin/env python3
"""
Script to configure Bedrock Knowledge Base with curated queries and table descriptions.
"""
import argparse
import boto3
import logging
import sys
from typing import Dict

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Bedrock Knowledge Base Configuration')

    # Core parameters
    parser.add_argument('--region', help='AWS region (auto-detected if not provided)')
    parser.add_argument('--env', default='dev', help='Environment name (default: dev)')
    parser.add_argument('--profile', help='AWS profile name')

    # Knowledge Base parameters
    parser.add_argument('--kb-id', help='Knowledge Base ID (auto-detected if not provided)')

    # Skip configuration steps if needed
    parser.add_argument('--skip-queries', action='store_true', help='Skip adding curated queries')
    parser.add_argument('--skip-ingestion', action='store_true', help='Skip starting ingestion job')

    return parser.parse_args()


def get_stack_outputs(stack_name: str, session) -> Dict[str, str]:
    """Get CloudFormation stack outputs"""
    cf = session.client('cloudformation')

    try:
        response = cf.describe_stacks(StackName=stack_name)

        outputs = {}
        for stack in response['Stacks']:
            for output in stack.get('Outputs', []):
                outputs[output['OutputKey']] = output['OutputValue']

        return outputs
    except Exception as e:
        logger.error(f"Error getting stack outputs: {e}")
        return {}


def update_kb_config(bedrock_agent_client, kb_id: str, workgroup_name: str, glue_database: str) -> bool:
    """Update Knowledge Base with curated queries and table annotations"""
    logger.info("Updating Knowledge Base configuration...")

    # Get workgroup ARN
    try:
        redshift_client = boto3.client('redshift-serverless')
        response = redshift_client.get_workgroup(workgroupName=workgroup_name)
        workgroup_id = response['workgroup']['workgroupId']
        account_id = boto3.client('sts').get_caller_identity()['Account']
        region = boto3.Session().region_name
        workgroup_arn = f"arn:aws:redshift-serverless:{region}:{account_id}:workgroup/{workgroup_id}"
        logger.info(f"Resolved workgroup ARN: {workgroup_arn}")
    except Exception as e:
        logger.error(f"Error getting workgroup ARN: {e}")
        return False

    # Get current Knowledge Base configuration
    try:
        kb_response = bedrock_agent_client.get_knowledge_base(knowledgeBaseId=kb_id)
        kb = kb_response['knowledgeBase']
        logger.info(f"Retrieved Knowledge Base: {kb['name']}")

        # Get existing configuration to preserve storage settings
        existing_config = kb['knowledgeBaseConfiguration']
        existing_storage = None

        if existing_config.get('type') == 'SQL' and \
           existing_config.get('sqlKnowledgeBaseConfiguration', {}).get('type') == 'REDSHIFT':
            redshift_config = existing_config['sqlKnowledgeBaseConfiguration']['redshiftConfiguration']
            if 'storageConfigurations' in redshift_config:
                existing_storage = redshift_config['storageConfigurations']
                logger.info("Preserving existing storage configurations")
    except Exception as e:
        logger.error(f"Error getting Knowledge Base: {e}")
        return False

    # Define table and column descriptions
    table_descriptions = {f'awsdatacatalog.{glue_database}.known_issues':
                          'Contains known EMR issues with their descriptions, components, and solutions'}

    column_descriptions = {
        f'awsdatacatalog.{glue_database}.known_issues': {
            'issue_id': 'Unique identifier for the issue',
            'component': 'EMR component affected (Spark, Hadoop HDFS, Hadoop YARN, Presto, HBase, EMR SDK, EMR Service, Hive)',
            'summary': 'Brief summary of the issue',
            'description': 'Detailed description including symptoms, causes, and solutions',
            'keywords': 'Search keywords for the issue',
            'keywords_text': 'Concatenated keywords as text for full-text search',
            'knowledge_center_links': 'Links to AWS Knowledge Center articles with additional solutions'}}

    # Curated queries for specific error patterns across components - limited to 10
    curated_queries = [
        # 1. Java OutOfMemoryError - direct keyword match
        {
            'naturalLanguage': 'Java OutOfMemoryError in EMR',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE keywords_text ILIKE '%java.lang.OutOfMemoryError%' OR summary ILIKE '%OutOfMemoryError%'"
        },
        # 2. Spark FetchFailedException - common Spark error
        {
            'naturalLanguage': 'Spark FetchFailedException',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'Spark' AND (keywords_text ILIKE '%FetchFailedException%' OR description ILIKE '%FetchFailedException%')"
        },
        # 3. Spark RpcTimeoutException - common Spark error
        {
            'naturalLanguage': 'Spark RpcTimeoutException',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'Spark' AND (keywords_text ILIKE '%RpcTimeoutException%' OR description ILIKE '%RpcTimeoutException%')"
        },
        # 4. YARN container killed - common YARN error
        {
            'naturalLanguage': 'YARN container killed errors',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'Hadoop YARN' AND (description ILIKE '%container killed%' OR description ILIKE '%exit code is 137%')"
        },
        # 5. HDFS NameNode safe mode - common HDFS error
        {
            'naturalLanguage': 'HDFS NameNode safe mode issues',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'Hadoop HDFS' AND (keywords_text ILIKE '%SafeModeException%' OR summary ILIKE '%safe mode%')"
        },
        # 6. S3 throttling - common EMR SDK error
        {
            'naturalLanguage': 'S3 throttling in EMR',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'EMR SDK' AND (keywords_text ILIKE '%503 Slow Down%' OR summary ILIKE '%S3 Throttling%')"
        },
        # 7. HBase region server issues - common HBase error
        {
            'naturalLanguage': 'HBase region server issues',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'HBase' AND (keywords_text ILIKE '%NotServingRegionException%' OR summary ILIKE '%Region%Server%')"
        },
        # 8. Hive OutOfMemoryError issues - common Hive error
        {
            'naturalLanguage': 'Hive OutOfMemoryError issues',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'Hive' AND (keywords_text ILIKE '%OutOfMemoryError%' OR description ILIKE '%heap space%')"
        },
        # 9. Presto memory issues - common Presto error
        {
            'naturalLanguage': 'Presto memory issues',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE component = 'Presto' AND (keywords_text ILIKE '%ExceededMemoryLimitException%' OR summary ILIKE '%Memory%')"
        },
        # 10. Data skew issues - cross-component problem
        {
            'naturalLanguage': 'Data skew issues in EMR',
            'sql': f"SELECT summary, description, knowledge_center_links FROM awsdatacatalog.{glue_database}.known_issues WHERE description ILIKE '%skew%' OR description ILIKE '%uneven distribution%' OR description ILIKE '%data imbalance%'"
        }
    ]

    # Build configuration
    updated_config = {
        'type': 'SQL',
        'sqlKnowledgeBaseConfiguration': {
            'type': 'REDSHIFT',
            'redshiftConfiguration': {
                'queryEngineConfiguration': {
                    'type': 'SERVERLESS',
                    'serverlessConfiguration': {
                        'workgroupArn': workgroup_arn,
                        'authConfiguration': {'type': 'IAM'}
                    }
                },
                'queryGenerationConfiguration': {
                    'executionTimeoutSeconds': 60,
                    'generationContext': {
                        'curatedQueries': curated_queries,
                        'tables': [
                            {
                                'name': table_name,
                                'description': table_descriptions[table_name],
                                'columns': [
                                    {'name': col_name, 'description': col_desc}
                                    for col_name, col_desc in column_descriptions[table_name].items()
                                ]
                            }
                            for table_name in table_descriptions.keys()
                        ]
                    }
                }
            }
        }
    }

    # Preserve existing storage configurations if available
    if existing_storage:
        updated_config['sqlKnowledgeBaseConfiguration']['redshiftConfiguration']['storageConfigurations'] = existing_storage

    # Update Knowledge Base
    try:
        bedrock_agent_client.update_knowledge_base(
            knowledgeBaseId=kb_id,
            name=kb['name'],
            roleArn=kb['roleArn'],
            knowledgeBaseConfiguration=updated_config
        )

        # amazonq-ignore-next-line
        logger.info(f"Successfully updated Knowledge Base {kb_id}")
        # amazonq-ignore-next-line
        logger.info(f"Added {len(curated_queries)} curated queries")
        # amazonq-ignore-next-line
        logger.info(f"Added descriptions for {len(table_descriptions)} tables")
        logger.info(f"Added column descriptions for {sum(len(cols) for cols in column_descriptions.values())} columns")

        return True
    except Exception as e:
        logger.error(f"Error updating Knowledge Base: {e}")
        return False


def start_ingestion_job(bedrock_agent_client, kb_id: str) -> bool:
    """Start ingestion job for Knowledge Base"""
    logger.info("Starting ingestion job for Knowledge Base...")

    try:
        # Get data sources for the Knowledge Base
        response = bedrock_agent_client.list_data_sources(
            knowledgeBaseId=kb_id,
            maxResults=10
        )

        data_sources = response.get('dataSourceSummaries', [])
        if not data_sources:
            logger.error("No data sources found for Knowledge Base")
            return False

        # Start ingestion job for each data source
        for data_source in data_sources:
            data_source_id = data_source['dataSourceId']

            try:
                response = bedrock_agent_client.start_ingestion_job(
                    knowledgeBaseId=kb_id,
                    dataSourceId=data_source_id
                )

                ingestion_job_id = response['ingestionJob']['ingestionJobId']
                # Sanitize data_source_id for logging to prevent log injection
                safe_data_source_id = data_source_id.replace('\n', '').replace('\r', '').replace('\t', '')
                logger.info(f"Started ingestion job {ingestion_job_id} for data source {safe_data_source_id}")
            except Exception as e:
                # Sanitize data_source_id for logging to prevent log injection
                safe_data_source_id = data_source_id.replace('\n', '').replace('\r', '').replace('\t', '')
                logger.error(f"Error starting ingestion job for data source {safe_data_source_id}: {e}")

        return True
    except Exception as e:
        logger.error(f"Error starting ingestion job: {e}")
        return False


def main():
    args = parse_arguments()

    # Set up AWS session
    session_kwargs = {}
    if args.profile:
        session_kwargs["profile_name"] = args.profile
    if args.region:
        session_kwargs["region_name"] = args.region

    session = boto3.Session(**session_kwargs)
    region = args.region or session.region_name

    # Get stack names
    bedrock_stack_name = f"EmrKb-BedrockStack-{args.env}"
    data_stack_name = f"EmrKb-DataStack-{args.env}"
    redshift_stack_name = f"EmrKb-RedshiftStack-{args.env}"

    logger.info("Bedrock Knowledge Base Configuration")
    logger.info(f"Region: {region}")
    logger.info(f"Environment: {args.env}")

    try:
        # Get stack outputs
        bedrock_outputs = get_stack_outputs(bedrock_stack_name, session)
        data_outputs = get_stack_outputs(data_stack_name, session)
        redshift_outputs = get_stack_outputs(redshift_stack_name, session)

        if not all([bedrock_outputs, data_outputs, redshift_outputs]):
            logger.error("Could not get required stack outputs")
            return 1

        # Extract required values
        kb_id = args.kb_id or bedrock_outputs.get('BedrockKnowledgeBaseId')
        glue_database = data_outputs.get('GlueDatabaseName')
        workgroup_name = redshift_outputs.get('RedshiftServerlessWorkgroupName')

        if not all([kb_id, glue_database, workgroup_name]):
            logger.error("Missing required configuration values")
            return 1

        logger.info(f"Knowledge Base ID: {kb_id}")
        logger.info(f"Glue Database: {glue_database}")
        logger.info(f"Redshift Workgroup: {workgroup_name}")

        # Set up Bedrock agent client
        bedrock_agent_client = session.client('bedrock-agent')

        # Update KB configuration by default unless explicitly skipped
        if not args.skip_queries:
            logger.info("Adding curated queries and table descriptions...")
            if not update_kb_config(bedrock_agent_client, kb_id, workgroup_name, glue_database):
                logger.error("Failed to update Knowledge Base configuration")
                return 1

        # Start ingestion job by default unless explicitly skipped
        if not args.skip_ingestion:
            logger.info("Starting ingestion job...")
            if not start_ingestion_job(bedrock_agent_client, kb_id):
                logger.warning("Failed to start ingestion job")

        logger.info("Knowledge Base configuration completed successfully!")
        return 0

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
