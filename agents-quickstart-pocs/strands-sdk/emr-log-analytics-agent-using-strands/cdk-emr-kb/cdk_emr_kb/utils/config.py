import os
import json
from typing import Dict, Any, Optional
import jsonschema


# Configuration schema for validation
CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "vpc": {
            "type": "object",
            "properties": {
                "cidr": {"type": "string", "pattern": "^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/\\d{1,2}$"},
                "maxAzs": {"type": "integer", "minimum": 1, "maximum": 6},
                "createPublicSubnets": {"type": "boolean"},
                "createEndpoints": {"type": "boolean"}
            },
            "required": ["cidr", "maxAzs"]
        },
        "redshift": {
            "type": "object",
            "properties": {
                "namespaceName": {"type": "string"},
                "workgroupName": {"type": "string"},
                "databaseName": {"type": "string"},
                "baseCapacity": {"type": "integer", "minimum": 8}
            },
            "required": ["namespaceName", "workgroupName", "databaseName"]
        },
        "bedrock": {
            "type": "object",
            "properties": {
                "kbName": {"type": "string"},
                "kbDescription": {"type": "string"},
                "modelId": {"type": "string"}
            },
            "required": ["kbName"]
        },
        "glue": {
            "type": "object",
            "properties": {
                "databaseName": {"type": "string"}
            },
            "required": ["databaseName"]
        },
        "tags": {
            "type": "object",
            "additionalProperties": {"type": "string"}
        }
    },
    "required": ["vpc", "redshift", "bedrock", "glue"]
}


def load_config(env_name: str = "dev", config_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Load configuration from JSON file based on environment name.

    Args:
        env_name: Environment name (dev, prod, etc.)
        config_dir: Directory containing configuration files (default: config/)

    Returns:
        Dict containing configuration values

    Raises:
        FileNotFoundError: If configuration file is not found
        ValueError: If configuration is invalid
    """
    if config_dir is None:
        # Default to config directory in project root
        config_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

    # Load default configuration
    # amazonq-ignore-next-line
    default_config_path = os.path.join(config_dir, "default.json")
    try:
        # amazonq-ignore-next-line
        with open(default_config_path, "r") as f:
            config = json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Default configuration file not found at {default_config_path}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in default configuration file: {e}")

    # Validate env_name to prevent path traversal
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', env_name):
        raise ValueError(f"Invalid environment name: {env_name}")
    
    # Load environment-specific configuration if it exists
    env_config_path = os.path.join(config_dir, f"{env_name}.json")
    # Validate path to prevent directory traversal
    env_config_path = os.path.realpath(env_config_path)
    if not env_config_path.startswith(os.path.realpath(config_dir)):
        raise ValueError(f"Invalid configuration path: {env_config_path}")
    
    try:
        # amazonq-ignore-next-line
        with open(env_config_path, "r") as f:
            env_config = json.load(f)
            # Merge environment config with default config
            deep_merge(config, env_config)
    except FileNotFoundError:
        # Environment-specific config is optional
        pass
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in environment configuration file: {e}")

    # Validate configuration
    try:
        jsonschema.validate(instance=config, schema=CONFIG_SCHEMA)
    except jsonschema.exceptions.ValidationError as e:
        raise ValueError(f"Invalid configuration: {e}")

    return config


def deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries, with override values taking precedence.

    Args:
        base: Base dictionary
        override: Dictionary with override values

    Returns:
        Merged dictionary
    """
    for key, value in override.items():
        if key in base and isinstance(base[key], dict) and isinstance(value, dict):
            deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def get_env_config(app, env_name: str = None) -> Dict[str, Any]:
    """
    Get environment configuration from CDK context.

    Args:
        app: CDK app instance
        env_name: Environment name (dev, prod, etc.)

    Returns:
        Dict containing environment configuration

    Raises:
        ValueError: If environment configuration is not found
    """
    # Get environment name from context or use default
    env_name = env_name or app.node.try_get_context("env") or "dev"
    
    # Validate env_name to prevent path traversal
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', env_name):
        raise ValueError(f"Invalid environment name: {env_name}")

    # Get environment configuration from context
    environments = app.node.try_get_context("environments")
    if not environments:
        raise ValueError("No environments defined in CDK context")

    env_config = environments.get(env_name)
    if not env_config:
        raise ValueError(f"Environment '{env_name}' not found in CDK context")

    return env_config
