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
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd mcp-aws-documentation-server
   ```
2. **Create a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Usage
- **Run the Streamlit chatbot app:**
  ```bash
  streamlit run chatbot_app.py
  ```

## Customization
- Update `agent.py` to change agent logic, tools, or streaming behavior.
- Update `chatbot_app.py` to modify the UI, branding, or chat workflow.

## Contributing
Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

## License
[Apache License 2.0](LICENSE) (see LICENSE file for details)

---

### References
- [Strands Agents SDK Documentation](https://strandsagents.com)
- [AWS Documentation Server](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server/)
- [AWS Documentation](https://docs.aws.amazon.com/) 
