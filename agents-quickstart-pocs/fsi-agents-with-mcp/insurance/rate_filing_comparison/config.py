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

        # In this case, the repo_root is the same as project_root
        self.repo_root = self.project_root

        # Load environment variables
        self._load_env_vars()

        # Set AWS credentials
        self.aws_region = os.environ.get("AWS_REGION", "us-east-1")
        self.aws_profile = os.environ.get("AWS_PROFILE", "")

        # 1. Configure Bedrock KB Search MCP
        self._setup_bedrock_kb_search()

        # 2. Configure Filesystem MCP
        self._setup_filesystem()

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

        # Also check bedrock-kb-search directory for .env
        kb_env_file = self.repo_root / "mcp_servers" / "bedrock-kb-search" / ".env"
        if kb_env_file.exists():
            load_dotenv(kb_env_file)

    def _setup_bedrock_kb_search(self):
        """Set up the Bedrock KB Search MCP configuration."""
        # Directory where server.py is located
        self.bedrock_kb_search_dir = (
            self.repo_root / "mcp_servers" / "bedrock-kb-search"
        )

        # Use uv command as in the original bedrock-kb-search MCP
        self.bedrock_kb_search_command = "uv"

        # Set up the server parameters
        self.bedrock_kb_search_params = StdioServerParameters(
            command=self.bedrock_kb_search_command,
            args=["--directory", str(self.bedrock_kb_search_dir), "run", "server.py"],
            env={"AWS_REGION": self.aws_region, "AWS_PROFILE": self.aws_profile},
        )

    def _setup_filesystem(self):
        """Set up the Filesystem MCP configuration."""
        # Directory for the filesystem MCP
        self.filesystem_dir = self.repo_root / "mcp_servers" / "filesystem"

        # Set paths to mount - only mount the repository
        mount_points = [
            # Mount the project root to /projects in the container
            {"src": str(self.repo_root), "dst": "/projects"}
        ]

        # Generate the Docker mount arguments
        docker_mount_args = []
        for mount in mount_points:
            docker_mount_args.extend(
                ["--mount", f"type=bind,src={mount['src']},dst={mount['dst']}"]
            )

        # Prepare the Docker command arguments with mount points
        docker_args = [
            "run",
            "-i",
            "--rm",
        ]
        # Add all the mount points
        docker_args.extend(docker_mount_args)
        # Add the container name and base mount point
        docker_args.extend(
            [
                "mcp/filesystem",
                "/projects",  # This is the base directory in the container
            ]
        )

        # Create the server parameters
        self.filesystem_params = StdioServerParameters(
            command="docker",
            args=docker_args,
        )

    def _validate_config(self):
        """Perform additional validation of the configuration."""
        # Check if the bedrock-kb-search directory exists
        if not self.bedrock_kb_search_dir.exists():
            raise FileNotFoundError(
                f"Bedrock KB Search server directory not found: {self.bedrock_kb_search_dir}"
            )

        # Check if the filesystem directory exists
        if not self.filesystem_dir.exists():
            raise FileNotFoundError(
                f"Filesystem MCP directory not found: {self.filesystem_dir}"
            )

        # Check AWS environment variables
        if not self.aws_region:
            print("Warning: AWS_REGION is not set. Using default: us-east-1")

        # Check if Docker is available for the Filesystem MCP
        try:
            result = subprocess.run(  # nosec B603, B607 - subprocess needed for AWS CLI and agentcore commands
                ["docker", "--version"], capture_output=True, text=True
            )
            if result.returncode != 0:
                print(
                    "Warning: Docker is required for the Filesystem MCP but doesn't appear to be installed or running"
                )
        except FileNotFoundError:
            print(
                "Warning: Docker is required for the Filesystem MCP but doesn't appear to be installed"
            )

        # Check if uv is installed for bedrock-kb-search
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

        # Check AWS CLI/SDK access
        try:
            import boto3

            boto3.setup_default_session(region_name=self.aws_region)
        except Exception as e:
            print(f"Warning: Error setting up boto3: {e}")


# Create a singleton instance
config = Config()
