import os
from pathlib import Path
from dotenv import load_dotenv
from mcp import StdioServerParameters


class Config:
    def __init__(self):
        # Get the current file's directory and project root
        self.current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = Path(os.path.dirname(os.path.dirname(self.current_dir)))

        # In this case, the repo_root is the same as project_root
        self.repo_root = self.project_root

        # Load environment variables
        self._load_env_vars()

        # 1. FRED API MCP - Uses uv run server.py
        # Set API keys
        self.fred_api_key = os.environ.get("FRED_API_KEY", "")

        # Directory where server.py is located
        self.fredapi_server_dir = self.repo_root / "mcp_servers" / "fredapi"

        # Set up the FRED API server parameters
        self.fredapi_params = StdioServerParameters(
            command="uv",
            args=["--directory", str(self.fredapi_server_dir), "run", "server.py"],
            env={"FRED_API_KEY": self.fred_api_key},
        )

        # 2. Perplexity Search MCP - Uses Docker
        # Set API keys
        self.perplexity_api_key = os.environ.get("PERPLEXITY_API_KEY", "")

        # Set up the Perplexity Search server parameters
        self.perplexity_search_params = StdioServerParameters(
            command="docker",
            args=[
                "run",
                "-i",
                "--rm",
                "-e",
                f"PERPLEXITY_API_KEY={self.perplexity_api_key}",
                "mcp/perplexity-ask",
            ],
            env={"PERPLEXITY_API_KEY": self.perplexity_api_key},
        )

        # Validate configuration
        self._validate_config()

    def _load_env_vars(self):
        """Load environment variables from .env file."""
        # First try local .env
        env_file = self.current_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)
        else:
            # Check if .env.example exists and provide guidance
            example_env = self.current_dir / ".env.example"
            if example_env.exists():
                print(
                    f"Warning: .env file not found at {env_file}. "
                    f"Consider copying .env.example to .env and adding your API keys."
                )

        # Also load from repository root .env if it exists
        repo_env_file = self.repo_root / ".env"
        if repo_env_file.exists():
            load_dotenv(repo_env_file)

        # Also check fredapi directory for .env
        fred_env_file = self.repo_root / "mcp_servers" / "fredapi" / ".env"
        if fred_env_file.exists():
            load_dotenv(fred_env_file)

        # Also check perplexity-search directory for .env
        perplexity_env_file = (
            self.repo_root / "mcp_servers" / "perplexity-search" / ".env"
        )
        if perplexity_env_file.exists():
            load_dotenv(perplexity_env_file)

    def _get_required_env(self, key):
        """Get a required environment variable."""
        value = os.environ.get(key)
        if not value:
            raise ValueError(
                f"Environment variable {key} is required but not set in .env file"
            )
        return value

    def _validate_config(self):
        """Perform additional validation of the configuration."""
        # Check if Docker is available for Perplexity Search MCP
        try:
            import subprocess  # nosec B404 - subprocess needed for system commands

            result = subprocess.run(  # nosec B603, B607 - subprocess needed for AWS CLI and agentcore commands
                ["docker", "--version"], capture_output=True, text=True
            )
            if result.returncode != 0:
                raise EnvironmentError(
                    "Docker is required but doesn't appear to be installed or running"
                )
        except FileNotFoundError:
            raise EnvironmentError(
                "Docker is required but doesn't appear to be installed"
            )

        # Check if uv is installed for fredapi
        try:
            result = subprocess.run(["uv", "--version"], capture_output=True, text=True)  # nosec B603, B607 - subprocess needed for AWS CLI and agentcore commands
            if result.returncode != 0:
                print(
                    "Warning: 'uv' command not found. Please install uv or ensure it's in your PATH."
                )
        except FileNotFoundError:
            print(
                "Warning: 'uv' command not found. Please install uv or ensure it's in your PATH."
            )

        # Check if fredapi directory exists
        if not self.fredapi_server_dir.exists():
            raise FileNotFoundError(
                f"FRED API server directory not found: {self.fredapi_server_dir}"
            )

        # Check for API keys
        if not self.fred_api_key:
            print(
                "Warning: FRED_API_KEY is not set. FRED API functionality may be limited."
            )

        if not self.perplexity_api_key:
            print(
                "Warning: PERPLEXITY_API_KEY is not set. Perplexity Search functionality may be limited."
            )


# Create a singleton instance
config = Config()
