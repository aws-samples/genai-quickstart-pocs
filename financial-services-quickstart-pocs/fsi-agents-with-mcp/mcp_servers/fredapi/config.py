import os
from pathlib import Path
from dotenv import load_dotenv
from mcp import StdioServerParameters


class Config:
    def __init__(self):
        # Get the current file's directory
        self.current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = Path(os.path.dirname(os.path.dirname(self.current_dir)))

        # Load environment variables
        self._load_env_vars()

        # Set API keys
        self.fred_api_key = os.environ.get("FRED_API_KEY", "")

        # Set up server configuration
        self._setup_server_config()

        # Validate configuration
        self._validate_config()

    def _load_env_vars(self):
        """Load environment variables from .env file."""
        env_file = self.current_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)
        else:
            # Check if .env.example exists and provide guidance
            example_env = self.current_dir / ".env.example"
            if example_env.exists():
                print(
                    f"No .env file found. Please copy .env.example to .env and add your API key."
                )

    def _setup_server_config(self):
        """Set up the MCP server configuration."""
        # Use uv as specified in the original config
        self.server_command = "uv"

        # Directory where server.py is located
        self.server_dir = self.current_dir

        # Set up the server parameters
        self.server_params = StdioServerParameters(
            command=self.server_command,
            args=["--directory", str(self.server_dir), "run", "server.py"],
            env={"FRED_API_KEY": self.fred_api_key},
        )

    def get_server_params(self):
        """Get the MCP server parameters."""
        return self.server_params

    def _validate_config(self):
        """Perform additional validation of the configuration."""
        if not self.fred_api_key:
            print("Warning: FRED_API_KEY is not set. The FRED API requires an API key.")
            print(
                "Get a free API key at: https://fred.stlouisfed.org/docs/api/api_key.html"
            )

        # Check if uv is installed
        try:
            import subprocess

            result = subprocess.run(["uv", "--version"], capture_output=True, text=True)
            if result.returncode != 0:
                print(
                    "Warning: 'uv' command not found. Please install uv or ensure it's in your PATH."
                )
                print(
                    "You may need to modify the server_command in config.py if using a different path."
                )
        except FileNotFoundError:
            print(
                "Warning: 'uv' command not found. Please install uv or ensure it's in your PATH."
            )
            print(
                "You may need to modify the server_command in config.py if using a different path."
            )


# Create a singleton instance
config = Config()
