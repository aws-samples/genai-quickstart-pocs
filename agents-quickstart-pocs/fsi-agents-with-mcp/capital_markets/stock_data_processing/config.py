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
        # since we're in capital_markets/stock_data_processing
        # and the repo root is amazon-bedrock-fsi-agents-examples
        self.repo_root = self.project_root

        # Load environment variables
        self._load_env_vars()

        # Configure servers for each MCP

        # 1. Filesystem MCP - Uses Docker
        # Set paths to mount - only mount the repository
        self.mount_points = [
            # Mount the project root to /projects in the container
            {"src": str(self.repo_root), "dst": "/projects"}
        ]

        # Generate the Docker mount arguments
        self.docker_mount_args = []
        for mount in self.mount_points:
            self.docker_mount_args.extend(
                ["--mount", f"type=bind,src={mount['src']},dst={mount['dst']}"]
            )

        # Prepare the Docker command arguments with mount points
        self.docker_args = [
            "run",
            "-i",
            "--rm",
        ]
        # Add all the mount points
        self.docker_args.extend(self.docker_mount_args)
        # Add the container name and base mount point
        self.docker_args.extend(
            [
                "mcp/filesystem",
                "/projects",  # This is the base directory in the container
            ]
        )

        # Create the Filesystem server parameters
        self.filesystem_params = StdioServerParameters(
            command="docker",
            args=self.docker_args,
        )

        # 2. Financial Datasets MCP - Uses uv run server.py
        # Set API keys
        self.financial_datasets_api_key = os.environ.get(
            "FINANCIAL_DATASETS_API_KEY", ""
        )

        # Directory where server.py is located
        self.financial_datasets_server_dir = (
            self.repo_root / "mcp_servers" / "financial-datasets"
        )

        # Set up the Financial Datasets server parameters
        self.financial_datasets_params = StdioServerParameters(
            command="uv",
            args=[
                "--directory",
                str(self.financial_datasets_server_dir),
                "run",
                "server.py",
            ],
            env={"FINANCIAL_DATASETS_API_KEY": self.financial_datasets_api_key},
        )

        # 3. Code Interpreter MCP - Nothing needed for Config
        # This is a built-in tool that is accessed by action group signature

        # Validate configuration
        self._validate_config()

    def _load_env_vars(self):
        """Load environment variables from .env file."""
        # First try local .env
        env_file = self.current_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)

        # Also load from repository root .env if it exists
        repo_env_file = self.repo_root / ".env"
        if repo_env_file.exists():
            load_dotenv(repo_env_file)

        # Also check financial-datasets directory for .env
        fin_env_file = self.repo_root / "mcp_servers" / "financial-datasets" / ".env"
        if fin_env_file.exists():
            load_dotenv(fin_env_file)

    def _validate_config(self):
        """Perform additional validation of the configuration."""
        # Check if Docker is available for filesystem MCP
        try:
            import subprocess

            result = subprocess.run(
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

        # Check if uv is installed for financial datasets
        try:
            result = subprocess.run(["uv", "--version"], capture_output=True, text=True)
            if result.returncode != 0:
                print(
                    "Warning: 'uv' command not found. Please install uv or ensure it's in your PATH."
                )
        except FileNotFoundError:
            print(
                "Warning: 'uv' command not found. Please install uv or ensure it's in your PATH."
            )

        # Check if financial datasets directory exists
        if not self.financial_datasets_server_dir.exists():
            raise FileNotFoundError(
                f"Financial datasets server directory not found: {self.financial_datasets_server_dir}"
            )

        # Check if mount paths exist
        for mount in self.mount_points:
            path = Path(mount["src"])
            if not path.exists():
                raise FileNotFoundError(f"Mount path does not exist: {path}")

        # Check for API key
        if not self.financial_datasets_api_key:
            print(
                "Warning: FINANCIAL_DATASETS_API_KEY is not set. Financial data functionality may be limited."
            )


# Create a singleton instance
config = Config()
