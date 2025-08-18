"""
mcp_config.py
-------------
Configuration module for the AWS Pricing MCP server.

Defines the command, arguments, working directory, and environment variables
needed to launch and interact with the MCP server. Also provides helper functions
to retrieve these configuration values for use in agent/server management code.

Usage:
- Imported by pricing_agent.py for MCP server management
- Update paths and environment variables as needed for your environment
"""
import os
import platform
import shutil
import subprocess
import sys
from typing import Dict, Any

# Get the current working directory to find the MCP server
current_dir = os.getcwd()
mcp_server_dir = os.path.join(current_dir, "mcp", "src", "aws-pricing-mcp-server")

# Cross-platform command detection
def get_uv_command():
    """
    Get the appropriate uv command for the current platform.
    Returns:
        str: The uv command to use.
    """
    # Check if uv is available in PATH
    if shutil.which("uv"):
        return "uv"
    
    # Check if uv is available via python -m uv
    try:
        result = subprocess.run([sys.executable, "-c", "import uv"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            return "python"
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    
    # Platform-specific fallbacks
    if platform.system() == "Windows":
        # Windows: try common installation paths
        # Windows: You might have to add the path to uv.exe in your system if it is not in the choices below

        possible_paths = [
            os.path.expanduser("~\\AppData\\Local\\Programs\\uv\\uv.exe"),
            os.path.expanduser("~\\AppData\\Roaming\\Python\\Python39\\Scripts\\uv.exe"),
            "C:\\Program Files\\uv\\uv.exe"
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path
    else:
        # Unix-like systems: try common installation paths
        possible_paths = [
            "/usr/local/bin/uv",
            "/opt/homebrew/bin/uv",  # macOS Homebrew
            os.path.expanduser("~/.local/bin/uv"),
            os.path.expanduser("~/.cargo/bin/uv")  # If installed via cargo
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path
    
    return "uv"  # Default fallback

def get_uv_args():
    """
    Get the appropriate uv arguments for the current platform.
    Returns:
        list: The uv arguments to use.
    """
    uv_cmd = get_uv_command()
    if uv_cmd == "python":
        return ["-m", "uv", "run", "awslabs.aws-pricing-mcp-server"]
    elif uv_cmd.endswith("uv.exe") or uv_cmd.endswith("uv"):
        return ["run", "awslabs.aws-pricing-mcp-server"]
    else:
        return ["run", "awslabs.aws-pricing-mcp-server"]

def check_uv_availability():
    """
    Check if UV is available and working.
    Returns:
        tuple: (bool, str) - (is_available, error_message)
    """
    uv_cmd = get_uv_command()
    
    try:
        if uv_cmd == "python":
            # Test python -m uv
            result = subprocess.run([uv_cmd, "-c", "import uv"], 
                                  capture_output=True, text=True, timeout=10)
        else:
            # Test direct uv command
            result = subprocess.run([uv_cmd, "--version"], 
                                  capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            return True, ""
        else:
            return False, f"UV command failed with return code {result.returncode}"
            
    except subprocess.TimeoutExpired:
        return False, "UV command timed out"
    except FileNotFoundError:
        return False, f"UV command not found: {uv_cmd}"
    except Exception as e:
        return False, f"Error checking UV: {str(e)}"

# MCP Server Configuration
MCP_SERVER_CONFIG = {
    "command": get_uv_command(),  # Use platform-appropriate uv command
    "args": get_uv_args(),  # Run the server script
    "cwd": mcp_server_dir,  # Set working directory to the MCP server
    "env": {
        # Add any environment variables needed for the AWS pricing server
        "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
        "AWS_PROFILE": os.getenv("AWS_PROFILE", "default"),
        "PYTHONPATH": mcp_server_dir,  # Add the server directory to Python path
    }
}

# Available MCP Resources (these will be discovered at runtime)
MCP_RESOURCES = {
    "pricing_data": "aws-pricing-data",
    "service_catalog": "aws-service-catalog",
    "price_history": "aws-price-history"
}

# Available MCP Tools (these will be discovered at runtime)
MCP_TOOLS = {
    "get_pricing": "get-aws-pricing",
    "compare_pricing": "compare-aws-pricing",
    "search_services": "search-aws-services"
}

def get_mcp_server_path() -> str:
    """
    Get the path to the MCP server executable (usually 'uv').
    Returns:
        str: The command to run the MCP server.
    """
    return MCP_SERVER_CONFIG["command"]

def get_mcp_server_args() -> list:
    """
    Get the arguments for the MCP server (e.g., ['run', 'awslabs.aws-pricing-mcp-server']).
    Returns:
        list: Arguments for the MCP server command.
    """
    return MCP_SERVER_CONFIG["args"]

def get_mcp_server_cwd() -> str:
    """
    Get the working directory for the MCP server (where the server code lives).
    Returns:
        str: The working directory path.
    """
    return MCP_SERVER_CONFIG["cwd"]

def get_mcp_environment() -> Dict[str, str]:
    """
    Get environment variables for MCP server (region, profile, PYTHONPATH, etc).
    Returns:
        dict: Environment variables for the MCP server process.
    """
    return MCP_SERVER_CONFIG["env"]

def get_uv_installation_instructions() -> str:
    """
    Get platform-specific UV installation instructions.
    Returns:
        str: Installation instructions for the current platform.
    """
    if platform.system() == "Windows":
        return """Windows UV Installation:
1. Using pip (recommended): pip install uv
2. Using winget: winget install astral-sh.uv
3. Manual download: https://github.com/astral-sh/uv/releases
   Download .exe and add to PATH"""
    elif platform.system() == "Darwin":  # macOS
        return """macOS UV Installation:
1. Using Homebrew (recommended): brew install uv
2. Using pip: pip install uv"""
    else:  # Linux
        return """Linux UV Installation:
1. Using pip: pip install uv
2. Using cargo: cargo install uv
3. Using package manager: Check your distribution's package manager""" 