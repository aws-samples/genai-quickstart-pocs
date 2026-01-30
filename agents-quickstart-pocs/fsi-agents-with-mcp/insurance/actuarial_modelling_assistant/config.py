import os
from pathlib import Path
from dotenv import load_dotenv
from mcp import StdioServerParameters
import subprocess  # nosec B404 - subprocess needed for system commands


class Config:
    def __init__(self):
        # Get the current file's directory and project root
        self.current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = Path(os.path.dirname(os.path.dirname(self.current_dir)))

        # Load environment variables
        self._load_env_vars()

        # Configure Python REPL MCP
        self._setup_python_repl()

        # Validate configuration
        self._validate_config()

    def _load_env_vars(self):
        """Load environment variables from .env file."""
        # First try local .env
        env_file = self.current_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)

        # Also load from repository root .env if it exists
        repo_env_file = self.project_root / ".env"
        if repo_env_file.exists():
            load_dotenv(repo_env_file)

        # Also check python-repl directory for .env
        python_repl_env_file = (
            self.project_root / "mcp_servers" / "python-repl" / ".env"
        )
        if python_repl_env_file.exists():
            load_dotenv(python_repl_env_file)

    def _setup_python_repl(self):
        """Set up the Python REPL MCP configuration."""
        # Directory where server.py is located
        self.python_repl_dir = self.project_root / "mcp_servers" / "python-repl"

        # Use uv command as specified for other MCPs
        self.python_repl_command = "uv"

        # Set up the server parameters
        self.python_repl_params = StdioServerParameters(
            command=self.python_repl_command,
            args=["--directory", str(self.python_repl_dir), "run", "server.py"],
            env={},
        )

    def _validate_config(self):
        """Perform additional validation of the configuration."""
        # Check if the python-repl directory exists
        if not self.python_repl_dir.exists():
            raise FileNotFoundError(
                f"Python REPL MCP directory not found: {self.python_repl_dir}"
            )

        # Check if sample data directory exists and list contents
        sample_data_dir = self.current_dir / "sample-actuarial-data"
        if not sample_data_dir.exists():
            raise FileNotFoundError(
                f"Sample actuarial data directory not found: {sample_data_dir}"
            )
        else:
            print("Sample data directory contents:")
            for item in sample_data_dir.iterdir():
                print(f"  - {item.name}")

        # Check if uv is installed
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


# Create a singleton instance
config = Config()
