# HOWTO: Set Up and Run the AWS Documentation Chatbot

This guide explains how to set up and run the Streamlit-based AWS Documentation Chatbot, which uses the Strands Agents SDK and AWS Documentation MCP Server.

---

## Prerequisites
- Python 3.10 or newer
- Git (for cloning the repository)
- Internet connection (for installing dependencies and accessing AWS docs)

## 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mcp-aws-documentation-server
```

## 2. Create and Activate a Virtual Environment (Recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

## 3. Install Dependencies
```bash
pip install -r requirements.txt
```

## 4. Run the Chatbot App
```bash
streamlit run chatbot_app.py
```
- This will open the chatbot UI in your browser (usually at http://localhost:8501).
- You can now ask questions about AWS documentation in the chat interface.

## 5. (Optional) Run the Agent Directly
For CLI testing or debugging:
```bash
python agent.py
```

## 6. Customization
- **Agent Logic:** Edit `agent.py` to change how queries are processed or to add new tools.
- **UI/Branding:** Edit `chatbot_app.py` to modify the Streamlit interface, sidebar, or branding.

## 7. Troubleshooting
- **Dependencies:** Ensure you are using Python 3.10+ and all dependencies are installed.
- **AWS Credentials:** If you use AWS services, make sure your credentials are set up (see [AWS docs](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)).
- **Port in Use:** If port 8501 is busy, Streamlit will suggest an alternative or you can specify one:
  ```bash
  streamlit run chatbot_app.py --server.port 8502
  ```
- **MCP Server Issues:** Ensure the MCP server can be launched from your environment. Check logs for errors.

## 8. References
- [Strands Agents SDK Documentation](https://strandsagents.com)
- [AWS Documentation Server](https://awslabs.github.io/mcp/servers/aws-documentation-mcp-server/)
- [AWS Documentation](https://docs.aws.amazon.com/)

---

For further help, open an issue or pull request on the repository. 