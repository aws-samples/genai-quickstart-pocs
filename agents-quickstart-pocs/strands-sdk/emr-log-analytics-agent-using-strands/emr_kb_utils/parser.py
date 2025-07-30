"""
EMR Knowledge Base Parser

Parses EMR knowledge base JSON files containing known issues,
error patterns, and troubleshooting recommendations.
"""
import json
import os
import re
import logging
from typing import Dict, List, Any, Optional, Tuple

from .exceptions import ParsingError

logger = logging.getLogger(__name__)


class EMRKnowledgeBaseParser:
    """Parser for EMR knowledge base JSON files containing known issues and recommendations."""

    COMPONENT_MAPPING = {
        "emr_sdk": "EMR SDK",
        "emr_service": "EMR Service",
        "hadoop_hdfs": "Hadoop HDFS",
        "hadoop_yarn": "Hadoop YARN",
        "hbase": "HBase",
        "hive": "Hive",
        "presto": "Presto",
        "spark": "Spark",
        "error_exception": "General Error"
    }

    def __init__(self, data_dir: str = "bedrock-kb-data"):
        """Initialize the parser with the data directory"""
        self.data_dir = data_dir
        self.processed_files = set()  # Track processed files to avoid duplicates
        self.processed_ids = set()    # Track processed IDs to avoid duplicates

    def get_component_from_filename(self, filename: str) -> str:
        """Extract component name from filename"""
        base_name = os.path.basename(filename)
        name_without_ext = os.path.splitext(base_name)[0]

        # Map filename to component
        for key, value in self.COMPONENT_MAPPING.items():
            if key in name_without_ext:
                return value

        return "Unknown"

    def parse_json_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse a JSON file containing EMR knowledge base data"""
        records = []

        try:
            component = self.get_component_from_filename(file_path)
            # Sanitize component for logging to prevent log injection
            safe_component = re.sub(r'[\r\n\t]', '', component)
            logger.info("Parsing file %s as component %s", file_path, safe_component)

            # First try to parse as a JSON array
            try:
                # amazonq-ignore-next-line
                with open(file_path, 'r') as f:
                    content = f.read()
                    # Check if the file starts with [ which would indicate a JSON array
                    if content.strip().startswith('['):
                        json_array = json.loads(content)
                        # amazonq-ignore-next-line
                        logger.info(f"Parsed {file_path} as JSON array with {len(json_array)} records")
                        for record in json_array:
                            record['component'] = component
                            records.append(record)
                        return records
            except json.JSONDecodeError:
                # Not a JSON array, try line by line
                pass

            # Parse line by line (JSONL format)
            # amazonq-ignore-next-line
            with open(file_path, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        record = json.loads(line)
                        record['component'] = component
                        records.append(record)
                    except json.JSONDecodeError as e:
                        # amazonq-ignore-next-line
                        logger.warning(f"Error parsing JSON at line {line_num} in {file_path}: {e}")

            # amazonq-ignore-next-line
            logger.info(f"Parsed {len(records)} records from {file_path}")
        except Exception as e:
            raise ParsingError(f"Error processing file {file_path}: {e}")

        return records

    def parse_all_files(self) -> List[Dict[str, Any]]:
        """Parse all JSON files in the data directory"""
        all_records = []

        # Get a sorted list of files to ensure consistent processing order
        json_files = sorted([f for f in os.listdir(self.data_dir) if f.endswith('.json')])

        # Process each file only once
        for filename in json_files:
            if filename in self.processed_files:
                logger.info(f"Skipping already processed file: {filename}")
                continue

            # Validate filename to prevent path traversal attacks
            if '..' in filename or '/' in filename or '\\' in filename:
                logger.warning(f"Skipping potentially unsafe filename: {filename}")
                continue
            
            file_path = os.path.join(self.data_dir, filename)
            # Ensure the resolved path is within the data directory
            normalized_path = os.path.normpath(file_path)
            normalized_data_dir = os.path.normpath(self.data_dir)
            if not normalized_path.startswith(normalized_data_dir):
                logger.warning(f"Skipping file outside data directory: {filename}")
                continue
            records = self.parse_json_file(file_path)
            all_records.extend(records)
            # Sanitize filename for logging to prevent log injection
            safe_filename = filename.replace('\n', '').replace('\r', '').replace('\t', '')
            logger.info(f"Parsed {len(records)} records from {safe_filename}")

            # Mark file as processed
            self.processed_files.add(filename)

        return all_records

    def validate_record(self, record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validate a record for required fields and format"""
        # Check for id or issue_id field
        if 'id' not in record and 'issue_id' not in record:
            return False, "Missing required field: id or issue_id"

        # Check for summary and description
        if 'summary' not in record:
            return False, "Missing required field: summary"
        if 'description' not in record:
            return False, "Missing required field: description"

        # Get the ID value (from either id or issue_id field)
        id_value = record.get('id') or record.get('issue_id')

        # Check ID format
        id_pattern = r'^[a-zA-Z0-9_-]+$'
        if not re.match(id_pattern, id_value):
            return False, f"Invalid ID format: {id_value}"

        # Check summary length
        if len(record['summary']) > 255:
            return False, f"Summary too long ({len(record['summary'])} chars)"

        return True, None

    def get_component_from_issue_id(self, issue_id: str) -> str:
        """Extract component name from issue ID prefix"""
        # Extract prefix from issue ID (e.g., "spark" from "spark-1001")
        prefix = issue_id.split('-')[0].lower() if '-' in issue_id else issue_id.lower()

        # Map prefix to component
        for key, value in self.COMPONENT_MAPPING.items():
            if prefix == key:
                return value

        return "Unknown"

    def prepare_structured_data(self) -> List[Dict[str, Any]]:
        """Parse and prepare records for data store import"""
        records = self.parse_all_files()
        issues = []

        # Reset processed IDs
        self.processed_ids = set()

        for record in records:
            # Validate record
            is_valid, error_msg = self.validate_record(record)
            if not is_valid:
                logger.warning(f"Skipping invalid record: {error_msg}")
                continue

            # Get the ID value (from either id or issue_id field)
            id_value = record.get('issue_id') or record.get('id')

            # Skip duplicate IDs
            if id_value in self.processed_ids:
                logger.info(f"Skipping duplicate ID: {id_value}")
                continue

            # Mark ID as processed
            self.processed_ids.add(id_value)

            # Prepare issue record with proper JSON arrays
            keywords_list = record.get('keywords', [])
            links_list = record.get('knowledge_center_links', [])

            # Ensure keywords and links are proper arrays
            if isinstance(keywords_list, str):
                keywords_list = [keywords_list]
            if isinstance(links_list, str):
                links_list = [links_list]

            # Determine component from issue ID (overrides file-based component)
            component_from_id = self.get_component_from_issue_id(id_value)

            issue = {
                'issue_id': id_value,
                'component': component_from_id if component_from_id != "Unknown" else record.get(
                    'component',
                    'Unknown'),
                'summary': record['summary'],
                'description': record['description'],
                'keywords': keywords_list,
                'keywords_text': ' '.join(keywords_list) if keywords_list else '',
                'knowledge_center_links': links_list}
            issues.append(issue)

        logger.info(f"Prepared {len(issues)} issues for data store (from {len(records)} total records)")
        return issues
