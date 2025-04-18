import os
from pathlib import Path
from mcp import StdioServerParameters


class Config:
    def __init__(self):
        # Get the current file's directory
        self.current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        self.project_root = Path(os.path.dirname(os.path.dirname(self.current_dir)))

        # Set up server configurations
        self._setup_server_configs()

    def _setup_server_configs(self):
        """Set up configurations for both MCP servers."""
        # Yahoo Finance MCP configuration
        self.yahoo_finance_dir = self.project_root / "mcp_servers" / "yahoo-finance"
        self.yahoo_finance_params = StdioServerParameters(
            command="uv",
            args=["--directory", str(self.yahoo_finance_dir), "run", "server.py"],
            env={},  # No API key needed for Yahoo Finance
        )

        # Python REPL MCP configuration
        self.python_repl_dir = self.project_root / "mcp_servers" / "python-repl"
        self.python_repl_params = StdioServerParameters(
            command="uv",
            args=["--directory", str(self.python_repl_dir), "run", "server.py"],
            env={},
        )


config = Config()
