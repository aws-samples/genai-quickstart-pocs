"""
EMR Knowledge Base Utilities

A module for managing EMR knowledge base data, including parsing, loading to AWS services,
and setting up permissions for Bedrock Knowledge Base integration.
"""

from .parser import EMRKnowledgeBaseParser
from .data_loader import (
    download_emr_knowledge_base_data,
    process_and_upload_data,
    create_glue_database,
    setup_redshift_external_schema
)
from .permissions import (
    get_redshift_credentials,
    setup_database_permissions,
    grant_current_user_permissions
)
from .exceptions import EMRKBError, ParsingError, DataLoadError, PermissionError

__all__ = [
    'EMRKnowledgeBaseParser',
    'download_emr_knowledge_base_data',
    'process_and_upload_data',
    'create_glue_database',
    'setup_redshift_external_schema',
    'get_redshift_credentials',
    'setup_database_permissions',
    'grant_current_user_permissions',
    'EMRKBError',
    'ParsingError',
    'DataLoadError',
    'PermissionError'
]
