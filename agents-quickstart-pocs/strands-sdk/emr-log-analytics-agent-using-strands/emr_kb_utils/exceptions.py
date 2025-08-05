"""
Custom exceptions for EMR Knowledge Base operations
"""


class EMRKBError(Exception):
    """Base exception for EMR KB operations"""


class ParsingError(EMRKBError):
    """Error during parsing of knowledge base files"""


class DataLoadError(EMRKBError):
    """Error during data loading to S3/Glue"""


class PermissionError(EMRKBError):
    """Error during permission setup"""
