# MCP AWS Documentation Server

![AWS Logo](https://docs.aws.amazon.com/assets/r/images/aws_logo_light.svg)

This project provides a Streamlit-based chatbot app and agent tools for interacting with AWS documentation, leveraging the Strands Agents SDK and AWS Documentation MCP Server with Claude Haiku for fast, efficient responses.

## Features
- **🤖 Claude Haiku Integration**: Uses Claude 3 Haiku for fast, cost-effective responses
- **📚 AWS Documentation Access**: Real-time access to official AWS documentation
- **💬 Interactive Chat Interface**: Modern Streamlit-based chatbot UI
- **🛠️ MCP Server Integration**: Leverages AWS Documentation MCP Server
- **⚡ Enhanced Response Handling**: Robust error handling and response extraction
- **🎯 Cross-Platform Support**: Works on macOS, Windows, and Linux
- **🔧 Easy Setup**: Simple installation with uv package manager

## Project Structure
- `agent.py`: Core agent logic with Claude Haiku integration and MCP server handling
- `chatbot_app.py`: Streamlit chatbot application with enhanced response handling
- `requirements.txt`: Python dependencies including strands-agents and MCP server
- `pyproject.toml`: Project configuration for uv package manager
- `.gitignore`: Standard Python and cross-platform ignores
- `README.md`: Project documentation

## Setup

### Prerequisites

- Python 3.10 or newer
- Git (for cloning the repository)
- Internet connection (for installing dependencies and accessing AWS docs)
- AWS credentials (optional, for enhanced functionality)

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

### Example Questions
Try asking questions like:
- "What is AWS S3?"
- "How do I create an S3 bucket?"
- "What is AWS Lambda?"
- "How to set up EC2 instances?"
- "What is an Internet Gateway?"

### Running the Agent Directly (Optional)
For CLI testing or debugging:
```bash
python agent.py
```

## Customization
- **Agent Logic:** Edit `agent.py` to change how queries are processed or to add new tools.
- **Model Configuration:** Modify the Claude Haiku model settings in `agent.py`.
- **UI/Branding:** Edit `chatbot_app.py` to modify the Streamlit interface, sidebar, or branding.
- **Response Handling:** Customize error handling and response extraction in `chatbot_app.py`.

## Troubleshooting

### Common Issues
- **Dependencies:** Ensure you are using Python 3.10+ and all dependencies are installed.
- **AWS Credentials:** If you use AWS services, make sure your credentials are set up (see [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)).
- **Port in Use:** If port 8501 is busy, Streamlit will suggest an alternative or you can specify one:
  ```bash
  streamlit run chatbot_app.py --server.port 8502
  ```

### MCP Server Issues
- **Connection Timeouts:** The MCP server may take time to initialize. Wait for the "Looking up documentation..." message to complete.
- **Throttling:** If you see throttling errors, wait a moment and try again. Claude Haiku helps reduce this issue.
- **Windows uvx Issues:** If running on Windows, the `uvx` command may fail. The current implementation includes cross-platform detection, but you may need to modify the `_get_uvx_command()` function based on your specific Windows environment.

### Response Issues
- **Empty Responses:** The app includes fallback handling for empty or error responses.
- **Model Errors:** If Claude Haiku is unavailable, the app will show appropriate error messages.

## Technical Details

### Model Configuration
The app uses Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) for:
- **Fast Response Times**: Optimized for speed and efficiency
- **Cost Effectiveness**: More affordable than larger models
- **Reliability**: Reduced throttling issues
- **Quality**: Maintains good quality for documentation queries

### Response Handling
The app includes enhanced response extraction that supports multiple response object types:
- `.text`, `.content`, `.message`, `.response`, `.result`
- Automatic fallback for empty or whitespace-only responses
- Comprehensive error handling with informative messages

### MCP Server Integration
- **Context Manager Usage**: Proper MCP client context management
- **Tool Listing**: Automatic tool discovery and caching
- **Error Recovery**: Graceful handling of connection issues

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

## License
[Apache License 2.0](LICENSE) (see LICENSE file for details)

---

### References
- [Strands Agents SDK Documentation](https://strandsagents.com)
- [AWS Documentation Server](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server/)
- [AWS Documentation](https://docs.aws.amazon.com/) 
