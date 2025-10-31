# 🚀 Strands Calculator Agent - Amazon Bedrock AgentCore Deployment

This project provides multiple ways to deploy your Strands calculator agent to Amazon Bedrock AgentCore with full automation and zero user input required.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Complete Deployment Workflow](#complete-deployment-workflow)
- [Deployment Options](#deployment-options)
- [Project Structure](#project-structure)
- [Testing Your Agent](#testing-your-agent)
- [Monitoring and Management](#monitoring-and-management)
- [Cleanup](#cleanup)
- [Troubleshooting](#troubleshooting)
- [Reference](#reference)

## 🎯 Prerequisites

### 1. AWS Account & Permissions
- Active AWS account with access to Amazon Bedrock
- IAM permissions for AgentCore operations
- Bedrock model access (Claude 3 Haiku recommended)

### 2. Local Environment
- Python 3.8+
- AWS CLI configured with appropriate credentials
- AgentCore CLI installed

### 3. Dependencies
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 🚀 Complete Deployment Workflow

**⚠️ IMPORTANT: Follow these steps in order for a successful deployment!**

**🎉 UPDATE:** The deployment flow is streamlined. First-time configuration requires one command (shown below). Subsequent runs are fully automated and include an interactive test loop that parses AgentCore responses to show just the final answer.

### 🔧 What's New in the Updated Scripts

The deployment process has been significantly improved to eliminate interactive prompts and automate all setup:

- **🚫 No More Interactive Prompts**: Uses command-line flags instead of waiting for user input
- **🔐 Automatic IAM Setup**: Creates execution role with all necessary permissions
- **📦 Automatic ECR Setup**: Creates ECR repository if it doesn't exist
- **⚙️ Smart Configuration**: Uses `agentcore configure` with proper flags for non-interactive setup
- **☁️ Cloud-First Deployment**: Deploys directly to AWS using CodeBuild for ARM64 containers
- **✅ Comprehensive Error Handling**: Better error messages and recovery options

### Step 1: Local Agent Testing (REQUIRED FIRST STEP)
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify AWS credentials
aws sts get-caller-identity

# Test the agent locally with sample calculations
python strands_calculator_agent.py
```

**This will run the agent with sample calculations to verify functionality. DO NOT proceed to the next step until this test passes successfully.**

### Step 2: Local AgentCore Testing
```bash
# Create and test locally using BedrockAgentCoreApp runtime
python deploy_strands_agent_to_local_agentcore.py
```

**This script will:**
- Create a local AgentCore agent file (`strands_calculator_local_agentcore.py`)
- Test sample calculations (8 different mathematical operations)
- Create requirements and Dockerfile for container testing

**After the script completes, manually start the local server:**
```bash
python strands_calculator_local_agentcore.py
```

**This will start the HTTP server on port 8080 for testing.**

### Step 3: Cloud Deployment
```bash
# Deploy to AWS Bedrock AgentCore in the cloud
python deploy_strands_agent_to_agentcore.py
```

**This will automatically:**
- ✅ Create ECR repository if it doesn't exist
- ✅ Set up execution role with proper permissions
- ✅ Use your existing configuration, or guide you to run a one-time configure command if missing
- ✅ Build and push Docker image to ECR using CodeBuild
- ✅ Deploy agent to AgentCore runtime
- ✅ Start an interactive test loop that extracts and prints just the final answer

### Step 4: Testing Deployed Agent
```bash
# Test using AgentCore CLI (uses the default configured agent)
agentcore invoke '{"prompt": "What is 2 + 3?"}'

# Test local server with curl (if running locally)
curl -X POST http://localhost:8080/invocations \
     -H 'Content-Type: application/json' \
     -d '{"prompt": "What is 5 * 5?"}'

# Test health check
curl http://localhost:8080/ping
```

## 🔧 Deployment Options

### Option 1: Local Agent Testing (REQUIRED FIRST STEP)
```bash
# Test your agent locally with sample calculations
python strands_calculator_agent.py
```

**What it does:**
- 🧪 Tests agent functionality with sample calculations
- ✅ Verifies the agent works correctly before deployment
- 🚫 **Required before proceeding to any deployment**

### Option 2: Local AgentCore Testing
```bash
# Create and test locally using BedrockAgentCoreApp runtime
python deploy_strands_agent_to_local_agentcore.py
```

**What it does:**
- 🔍 Checks local environment and dependencies
- 📝 Creates local AgentCore agent file (`strands_calculator_local_agentcore.py`)
- 🧪 Tests agent functionality with sample calculations (8 different operations)
- 📋 Creates requirements and Dockerfile for container testing
- ✅ Follows exact AWS Bedrock AgentCore documentation patterns

**To start the local server:**
```bash
python strands_calculator_local_agentcore.py
```

### Option 3: Cloud Deployment
```bash
python deploy_strands_agent_to_agentcore.py
```

**What it does:**
- 🔍 Comprehensive prerequisite checking
- 📝 Creates AgentCore configuration
- 📝 Creates agent file
- 🚀 Full deployment workflow with defaults
- ⏳ Waits for deployment completion
- 🧪 Runs an interactive test loop and prints only the final answers
- 🧹 Automatic cleanup

### Option 4: Manual Commands (First-time configuration)
```bash
# One-time configure (replace placeholders with your values)
agentcore configure \
  --entrypoint strands_calculator_agentcore.py \
  --name strands_calculator_agent \
  --execution-role arn:aws:iam::<ACCOUNT_ID>:role/AmazonBedrockExecutionRoleForAgents \
  --ecr <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/strands-calculator-agent \
  --region <REGION>

# Launch the agent
agentcore launch
```

## 📁 Project Structure

### 🎯 Deployment Scripts
- **`deploy_strands_agent_to_local_agentcore.py`** - Creates local AgentCore agent for testing
- **`deploy_strands_agent_to_agentcore.py`** - Comprehensive cloud deployment script

### 🔧 Agent Files
- **`strands_calculator_local_agentcore.py`** - Local AgentCore agent with BedrockAgentCoreApp runtime
- **`strands_calculator_agent.py`** - Original local testing agent

### 📋 Configuration Files
- **`requirements.txt`** - Main project dependencies
- **`requirements_local.txt`** - Local testing dependencies
- **`Dockerfile.local`** - Docker configuration for local testing

### 🧹 Cleanup
- **`cleanup_agents.py`** - Cleanup script for deployed agents (deletes from both ECR and AgentCore)

## 🔧 How It Works

### 1. Agent Creation
The deployment scripts create a Strands agent file that follows the exact pattern from the AWS Bedrock AgentCore samples:

```python
import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from strands import Agent
from strands_tools.calculator import calculator

# Create the calculator agent
agent = Agent(
    name="Calculator Agent",
    tools=[calculator],
    system_prompt="You are a helpful calculator assistant..."
)

# Integrate with Bedrock AgentCore
from bedrock_agentcore.runtime import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

@app.entrypoint
def agent_invocation(payload, context):
    user_message = payload.get("prompt", "Default message")
    result = agent(user_message)
    return {"result": str(result)}

if __name__ == "__main__":
    app.run()
```

### 2. Deployment Process
1. **Configure**: `agentcore configure -e strands_calculator_agentcore.py`
2. **Deploy**: `agentcore launch`
3. **Test**: `agentcore invoke '{"prompt": "What is 2 + 3?"}'`

### 3. AgentCore Integration
- Uses `BedrockAgentCoreApp` from the AWS samples
- Follows the exact entrypoint pattern
- Handles payload and context properly
- Returns results in the expected format

## 🧪 Testing Your Agent

### Local Testing (Before Deployment)
```bash
# Test the basic agent
python strands_calculator_agent.py

# Test the local AgentCore agent
python strands_calculator_local_agentcore.py

# Test the local HTTP server with curl
curl -X POST http://localhost:8080/invocations \
     -H 'Content-Type: application/json' \
     -d '{"prompt": "What is 5 * 5?"}'

# Test health check
curl http://localhost:8080/ping
```

### Cloud Testing (After Deployment)
```bash
# Test using AgentCore CLI
agentcore invoke '{"prompt": "What is 2 + 3?"}'

# Test with more complex operations
agentcore invoke '{"prompt": "Calculate the square root of 144"}'

# Test with mathematical expressions
agentcore invoke '{"prompt": "What is 15 * 7 + 23?"}'
```

### Using AWS Console
1. Navigate to Amazon Bedrock → Agents
2. Find your deployed agent
3. Use the test interface to send requests

## 📊 Monitoring and Management

### AgentCore CLI Commands
```bash
# Check agent status
agentcore status

# View agent logs
agentcore logs

# Get agent information
agentcore info

# List configured agents
agentcore configure list
```

### AWS Console
- Navigate to Amazon Bedrock → Agents
- Monitor performance metrics
- View CloudWatch logs
- Check agent health and status

## 🧹 Cleanup

**⚠️ CRITICAL WARNING: The cleanup script will permanently delete ALL deployed agents and ECR repositories!**

**This action cannot be undone and will remove:**
- All deployed agents from AgentCore runtime
- All ECR repositories and Docker images
- Local configuration files

### Using Cleanup Script
```bash
# Clean up deployed agents and ECR repositories
python cleanup_agents.py
```

**Only run cleanup when you are certain you want to remove all deployed resources.**

### Manual Cleanup
- Delete the deployed agent from the AWS Console (Amazon Bedrock → Agents) or use the provided cleanup script
- Remove local temporary files if needed:
  - `rm strands_calculator_agentcore.py`
  - `rm .bedrock_agentcore.yaml` (only if you want to reconfigure from scratch)

## 🔍 Troubleshooting

### Common Issues

#### 1. "ModuleNotFoundError: No module named 'requests'"
```bash
# Solution: Activate virtual environment
source venv/bin/activate
```

#### 2. "AgentCore CLI not found"
```bash
# Solution: Install AgentCore CLI
pip install agentcore
```

#### 3. "AWS credentials error"
```bash
# Solution: Configure AWS credentials
aws configure
```

#### 4. "Strands dependencies not available"
```bash
# Solution: Install requirements
pip install -r requirements.txt
```

#### 5. Interactive CLI limitations
- First-time configuration requires a one-time `agentcore configure` command (shown above)
- After that, deployment is automated and includes an interactive test loop

#### 6. Local AgentCore server won't start
```bash
# Check if the agent file was created
ls -la strands_calculator_local_agentcore.py

# Check for syntax errors
python -m py_compile strands_calculator_local_agentcore.py

# Verify bedrock-agentcore is installed
pip list | grep bedrock-agentcore
```

### Getting Help
- Check AWS Bedrock documentation
- Review CloudWatch logs
- Verify IAM permissions
- Use `agentcore --help` for CLI options

## 📚 Reference

This deployment follows the exact patterns from the Amazon Bedrock AgentCore samples:
- **Strands Agents Integration**: `REFERENCE/03-integrations/agentic-frameworks/strands-agents/`
- **Runtime Examples**: `REFERENCE/01-tutorials/01-AgentCore-runtime/`
- **End-to-End Tutorials**: `REFERENCE/01-tutorials/07-AgentCore-E2E/`

## 🎉 Success!

After following the complete workflow, you'll have:
- ✅ A locally tested calculator agent
- ✅ A locally tested AgentCore agent with BedrockAgentCoreApp runtime
- ✅ A working calculator agent deployed to AgentCore
- ✅ Access via AgentCore CLI and AWS Console
- ✅ Scalable, managed agent infrastructure
- ✅ Full observability and monitoring
- ✨ **Deployed automatically with no questions asked**

## ✨ Key Improvements

- **🧪 Local Testing First**: Always test locally before deployment
- **🚫 No More Questions**: All scripts use defaults automatically
- **⚡ Fully Automated**: Run once and deployment completes
- **🔄 Structured Workflow**: Clear step-by-step deployment process
- **📱 Cross-Platform**: Works on macOS, Linux, and Windows
- **🧹 Auto-Cleanup**: Temporary files removed automatically
- **⚠️ Safety Warnings**: Clear warnings about cleanup operations

## 🤝 Contributing

1. **Always test locally first** using `strands_calculator_agent.py`
2. **Test with local AgentCore** using `deploy_strands_agent_to_local_agentcore.py`
3. **Deploy to cloud** only after local testing passes
4. **Clean up test resources** after development using `cleanup_agents.py`
5. Update documentation for any new features

---

**Happy Deploying! 🎉**

Your Strands calculator agent is now running in production on Amazon Bedrock AgentCore with zero user input required! 🚀
