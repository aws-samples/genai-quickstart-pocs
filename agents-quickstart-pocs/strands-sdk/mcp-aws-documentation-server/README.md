# MCP AWS Documentation Server

![AWS Logo](https://docs.aws.amazon.com/assets/r/images/aws_logo_light.svg)

This project provides a Streamlit-based chatbot app and agent tools for interacting with AWS documentation, leveraging the Strands Agents SDK and AWS Documentation MCP Server.

## Features
- Query and retrieve AWS documentation in markdown format
- Real-time, streaming chatbot UI powered by Streamlit
- Integrates Strands Agents SDK for agentic workflows
- Async streaming support (if available from backend/tool)
- AWS and Strands branding

## Project Structure
- `agent.py`: Core agent logic for documentation queries, including async streaming
- `chatbot_app.py`: Streamlit chatbot application interface
- `requirements.txt`: Python dependencies
- `.gitignore`: Standard Python and macOS ignores
- `README.md`: Project documentation

## Setup

### Prerequisites

- Python 3.10 or newer
- Git (for cloning the repository)
- Internet connection (for installing dependencies and accessing AWS docs)

#### Installing uv and uvx

**macOS:**
```bash
# Using curl (recommended)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Using Homebrew
brew install uv

# Verify installation
uv --version
uvx --version
```

**Windows:**
```powershell
# Using PowerShell (recommended)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Using winget
winget install astral-sh.uv

# Using Chocolatey
choco install uv

# Verify installation (restart terminal if needed)
uv --version
uvx --version
```

### Project Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mcp-aws-documentation-server
   ```

2. **Using uv (recommended):**
   ```bash
   # Create virtual environment and install dependencies
   uv sync
   
   # Activate the environment
   source .venv/bin/activate  # macOS/Linux
   # or
   .venv\Scripts\activate     # Windows
   ```

3. **Alternative: Using traditional pip:**
   ```bash
   # Create a virtual environment (recommended):
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate     # Windows
   
   # Install dependencies:
   pip install -r requirements.txt
   ```

## Usage

### Running the Chatbot App
```bash
streamlit run chatbot_app.py
```
- This will open the chatbot UI in your browser (usually at http://localhost:8501).
- You can now ask questions about AWS documentation in the chat interface.

### Running the Agent Directly (Optional)
For CLI testing or debugging:
```bash
python agent.py
```

## Customization
- **Agent Logic:** Edit `agent.py` to change how queries are processed or to add new tools.
- **UI/Branding:** Edit `chatbot_app.py` to modify the Streamlit interface, sidebar, or branding.

## Troubleshooting
- **Dependencies:** Ensure you are using Python 3.10+ and all dependencies are installed.
- **AWS Credentials:** If you use AWS services, make sure your credentials are set up (see [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)).
- **Port in Use:** If port 8501 is busy, Streamlit will suggest an alternative or you can specify one:
  ```bash
  streamlit run chatbot_app.py --server.port 8502
  ```
- **MCP Server Issues:** Ensure the MCP server can be launched from your environment. Check logs for errors.

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

## License
[Apache License 2.0](LICENSE) (see LICENSE file for details)

---

### References
- [Strands Agents SDK Documentation](https://strandsagents.com)
- [AWS Documentation Server](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server/)
- [AWS Documentation](https://docs.aws.amazon.com/) 
