"""
Configuration settings for the GenAI Sales Analyst application.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# AWS Bedrock settings
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DEFAULT_MODEL_ID = "amazon.nova-pro-v1:0"

# Redshift settings
REDSHIFT_ACCOUNT = os.getenv("REDSHIFT_ACCOUNT", "")
REDSHIFT_USER = os.getenv("REDSHIFT_USER", "")
REDSHIFT_PASSWORD = os.getenv("REDSHIFT_PASSWORD", "")
REDSHIFT_WAREHOUSE = os.getenv("REDSHIFT_WAREHOUSE", "COMPUTE_WH")
REDSHIFT_ROLE = os.getenv("REDSHIFT_ROLE", "ACCOUNTADMIN")

# Default database and schema
DEFAULT_DATABASE = "REDSHIFT_SAMPLE_DATA"
DEFAULT_SCHEMA = "TPCH_SF1"

# Cache settings
SCHEMA_CACHE_TTL = 3600  # Cache schema information for 1 hour
SCHEMA_CACHE_SIZE = 100  # Maximum number of schemas to cache

# UI settings
PAGE_TITLE = "GenAI Sales Analyst – Powered by Amazon Bedrock"
PAGE_LAYOUT = "wide"

# Assets paths
ASSETS_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "assets")
IMAGES_FOLDER = os.path.join(ASSETS_FOLDER, "images")