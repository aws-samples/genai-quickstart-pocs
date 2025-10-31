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

        # Set paths to mount - only mount the repository
        self.mount_points = [
            # Mount the project root to /projects in the container
            {"src": str(self.project_root), "dst": "/projects"}
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

        # Create the server parameters
        self.server_params = StdioServerParameters(
            command="docker",
            args=self.docker_args,
        )

        # Validate configuration
        self._validate_config()

    def _load_env_vars(self):
        """Load environment variables from .env file."""
        env_file = self.current_dir / ".env"
        if env_file.exists():
            load_dotenv(env_file)

    def _validate_config(self):
        """Perform additional validation of the configuration."""
        # Check if Docker is available for running the MCP container
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

        # Check if mount paths exist
        for mount in self.mount_points:
            path = Path(mount["src"])
            if not path.exists():
                raise FileNotFoundError(f"Mount path does not exist: {path}")


# Create a singleton instance
config = Config()
