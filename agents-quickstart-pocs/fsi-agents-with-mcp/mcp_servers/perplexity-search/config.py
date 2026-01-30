import os
from pathlib import Path
from dotenv import load_dotenv
from mcp import StdioServerParameters


class Config:
    def __init__(self):
        # Get the current file's directory and project root
        self.current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = Path(os.path.dirname(os.path.dirname(self.current_dir)))

        # Load environment variables
        self._load_env_vars()

        # Set API keys
        self.perplexity_api_key = self._get_required_env("PERPLEXITY_API_KEY")

        # Create the server parameters
        self.server_params = StdioServerParameters(
            command="docker",
            args=[
                "run",
                "-i",
                "--rm",
                "-e",
                "PERPLEXITY_API_KEY",
                "mcp/perplexity-ask",
            ],
            env={"PERPLEXITY_API_KEY": self.perplexity_api_key},
        )

        # Validate configuration
        self._validate_config()

    def _load_env_vars(self):
        """Load environment variables from .env file."""
        env_file = self.current_dir / ".env"
        if not env_file.exists():
            # Check if .env.example exists and provide guidance
            example_env = self.current_dir / ".env.example"
            if example_env.exists():
                raise FileNotFoundError(
                    f".env file not found at {env_file}. "
                    f"Please copy .env.example to .env and add your API keys."
                )
            else:
                raise FileNotFoundError(
                    f".env file not found at {env_file}. "
                    f"Please create one with PERPLEXITY_API_KEY=your_key"
                )

        # Load environment variables from .env
        load_dotenv(env_file)

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
        # Check if Docker is available for running the MCP container
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


# Create a singleton instance
config = Config()
