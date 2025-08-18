# AWS Pricing Agent Chatbot

A Streamlit-based chatbot that uses Strands Agents and the AWS Pricing MCP (Model Context Protocol) server to provide intelligent responses about AWS pricing and cost analysis.

## Features

- 🤖 **AI-Powered Responses**: Uses Strands Agents for intelligent AWS pricing queries
- 🔗 **MCP Integration**: Connects to AWS Pricing MCP server for real-time pricing data
- 💬 **Chat Interface**: Multi-line input with chat history
- 🎨 **Modern UI**: Clean, AWS-branded interface with responsive design
- 🔄 **Cross-Platform**: Works on macOS, Windows, and Linux
- ⚡ **UV Support**: Fast dependency management with UV package manager

## Prerequisites

### System Requirements
- Python 3.8 or higher
- Git
- Internet connection for downloading dependencies

### Platform-Specific Requirements

#### macOS
- Homebrew (recommended for easy installation)
- Terminal or iTerm2

#### Windows
- Windows 10 or higher
- Command Prompt or PowerShell
- Git Bash (recommended for Unix-like commands)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd aws-project-pricing-estimator
```

### 2. Install UV Package Manager (Recommended)

UV is a fast Python package manager that significantly speeds up dependency installation.

#### Quick Installation Scripts
```bash
# macOS/Linux
./install_uv.sh

# Windows
install_uv.bat
```

#### Manual Installation

**macOS:**
```bash
# Using Homebrew (recommended)
brew install uv

# Or using pip
pip install uv
```

**Windows:**
```cmd
# Using pip (recommended)
pip install uv

# Or using PowerShell with winget
winget install astral-sh.uv

# Or download from https://github.com/astral-sh/uv/releases
# Download the .exe file and add it to your PATH
```

**Linux:**
```bash
# Using pip
pip install uv

# Or using cargo (if Rust is installed)
cargo install uv
```

### 3. Create Virtual Environment

#### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Windows
```cmd
python -m venv venv
venv\Scripts\activate
```

### 4. Install Dependencies

The launcher scripts will automatically detect and use UV if available, with fallback to pip.

```bash
# Using UV (faster)
uv pip install -r requirements.txt

# Using pip (fallback)
pip install -r requirements.txt
```

**Note**: The current requirements.txt contains minimal dependencies. The actual installation will include many additional packages automatically resolved by UV.

### 5. Install AWS Pricing MCP Server

```bash
# Clone the MCP repository
git clone https://github.com/awslabs/mcp.git
cd mcp/src/aws-pricing-mcp-server

# Install dependencies using UV
uv pip install -r uv-requirements.txt

# Return to project directory
cd ../../../aws-project-pricing-estimator
```

## Configuration

### AWS Credentials (Optional)

For enhanced functionality, configure AWS credentials:

#### macOS/Linux
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

#### Windows
```cmd
set AWS_ACCESS_KEY_ID=your_access_key
set AWS_SECRET_ACCESS_KEY=your_secret_key
set AWS_REGION=us-east-1
```

## Usage

### Starting the Chatbot

#### Option 1: Using the Launcher Scripts (Recommended)
```bash
# macOS/Linux
./run_chatbot.sh

# Windows
run_chatbot.bat
```

#### Option 2: Using Python Launcher
```bash
python run_chatbot.py
```

#### Option 3: Direct Streamlit Command
```bash
streamlit run streamlit_chatbot.py
```

**Note**: If port 8501 is already in use, you can specify a different port:
```bash
streamlit run streamlit_chatbot.py --server.port 8502
```

### Using the Chatbot

1. **Initialize Agent**: Click the "Initialize Agent" button in the sidebar
2. **Ask Questions**: Type your AWS pricing questions in the text area
3. **Get Responses**: The agent will provide intelligent responses based on AWS pricing knowledge

### Example Questions

- "What are the pricing differences between EC2 instance types?"
- "How does AWS pricing vary by region?"
- "What are the cost optimization strategies for S3?"
- "Compare pricing between on-demand and reserved instances"
- "What factors affect AWS pricing?"

## Project Structure

```
aws-project-pricing-estimator/
├── README.md                 # This file
├── requirements.txt          # Python dependencies (minimal, UV resolves the rest)
├── .gitignore               # Git ignore rules
├── pricing_agent.py         # Main agent with MCP integration
├── mcp_config.py            # MCP server configuration with UV support
├── streamlit_chatbot.py     # Streamlit web application
├── run_chatbot.py           # Cross-platform launcher script with UV detection
├── run_chatbot.sh           # macOS/Linux launcher script with UV support
├── run_chatbot.bat          # Windows launcher script with UV support
├── install_uv.sh            # UV installation script for macOS/Linux
├── install_uv.bat           # UV installation script for Windows
├── test_uv_installation.py  # UV installation verification script
├── mcp/                     # Cloned MCP repository with AWS pricing server
│   └── src/
│       └── aws-pricing-mcp-server/  # AWS Pricing MCP server
└── venv/                    # Virtual environment (created during setup)
```

## UV Package Manager

This project includes comprehensive support for UV, a fast Python package manager that can significantly speed up dependency installation and management.

### Benefits of UV
- **10-100x faster** than pip for dependency resolution
- **Built-in virtual environment management**
- **Lock file support** for reproducible builds
- **Cross-platform compatibility**

### UV Commands Used
```bash
# Install dependencies
uv pip install -r requirements.txt

# Run MCP server
uv run awslabs.aws-pricing-mcp-server

# Create virtual environment
uv venv

# Activate virtual environment
source .venv/bin/activate  # Unix
.venv\Scripts\activate     # Windows
```

## Troubleshooting

### Common Issues

#### 1. "Streamlit not found" Error
**Solution**: The launcher scripts will automatically install dependencies
```bash
# Run the appropriate launcher script
./run_chatbot.sh          # macOS/Linux
run_chatbot.bat           # Windows
```

#### 2. "UV not found" Error
**Solution**: Install UV using the provided scripts
```bash
# macOS/Linux
./install_uv.sh

# Windows
install_uv.bat
```

#### 3. "MCP server connection failed" Error
**Solution**: Ensure MCP server is properly installed
```bash
cd mcp/src/aws-pricing-mcp-server
uv pip install -r uv-requirements.txt
```

#### 4. Port Already in Use
**Solution**: Use a different port
```bash
streamlit run streamlit_chatbot.py --server.port 8502
```

#### 5. "Error starting MCP server: No such file or directory: 'uv'"
**Solution**: This error occurs when the MCP server can't find the UV command. Ensure UV is properly installed and in your PATH:
```bash
# Check if UV is available
uv --version

# If not found, reinstall using the scripts
./install_uv.sh  # macOS/Linux
install_uv.bat   # Windows
```

### Platform-Specific Issues

#### macOS
- If you get permission errors, ensure your terminal has the necessary permissions
- For Homebrew installation issues, try `brew doctor`
- UV installation via Homebrew is recommended

#### Windows
- If Python is not found, add Python to your PATH
- For Git Bash issues, try using Command Prompt instead
- If you get SSL errors, update your certificates
- For UV installation issues, ensure you have the latest pip: `python -m pip install --upgrade pip`
- UV installation via pip is most reliable on Windows

#### Linux
- UV installation via pip or cargo is recommended
- Ensure you have build tools installed for some packages

## Development

### Running Tests
```bash
# Test UV installation
python test_uv_installation.py

# Test the agent functionality through the Streamlit interface
```

### Code Structure
- `pricing_agent.py`: Core agent logic with MCP integration
- `mcp_config.py`: Cross-platform MCP server configuration with enhanced UV support
- `streamlit_chatbot.py`: Web interface with AWS branding
- `run_chatbot.py`: Cross-platform launcher script with UV detection and fallback
- `run_chatbot.sh`: macOS/Linux launcher script with UV support
- `run_chatbot.bat`: Windows launcher script with UV support
- `install_uv.sh`: UV installation helper for Unix systems
- `install_uv.bat`: UV installation helper for Windows
- `test_uv_installation.py`: UV installation verification script

### Adding Features
1. Modify `pricing_agent.py` for new agent capabilities
2. Update `streamlit_chatbot.py` for UI changes
3. Test on both platforms before committing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both platforms before committing
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the project structure
3. Test on both platforms
4. Open an issue with detailed information

## Acknowledgments

- [Strands Agents](https://strandsagents.com) for the AI agent framework
- [AWS Pricing MCP Server](https://github.com/awslabs/mcp/tree/main/src/aws-pricing-mcp-server) for pricing data
- [Streamlit](https://streamlit.io) for the web interface
- [UV](https://github.com/astral-sh/uv) for fast Python package management 