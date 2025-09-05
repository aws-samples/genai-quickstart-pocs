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

# Snowflake settings
SNOWFLAKE_ACCOUNT = os.getenv("SNOWFLAKE_ACCOUNT", "")
SNOWFLAKE_USER = os.getenv("SNOWFLAKE_USER", "")
SNOWFLAKE_PASSWORD = os.getenv("SNOWFLAKE_PASSWORD", "")
SNOWFLAKE_WAREHOUSE = os.getenv("SNOWFLAKE_WAREHOUSE", "COMPUTE_WH")
SNOWFLAKE_ROLE = os.getenv("SNOWFLAKE_ROLE", "ACCOUNTADMIN")

# Default database and schema
DEFAULT_DATABASE = "SNOWFLAKE_SAMPLE_DATA"
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