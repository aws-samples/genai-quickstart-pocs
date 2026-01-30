#!/usr/bin/env python3
"""
Local AgentCore Deployment Script for Strands Calculator Agent

This script deploys the Strands calculator agent locally using the BedrockAgentCoreApp
runtime, following the exact pattern from AWS Bedrock AgentCore documentation.

Based on: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-getting-started-toolkit.html

Usage:
    python deploy_strands_agent_to_local_agentcore.py
"""

import os
import sys
import subprocess  # nosec B404 - subprocess needed for system commands
from typing import Optional, Dict, Any
import json

def check_environment():
    """Check if the environment is properly set up for local AgentCore testing."""
    print("🔍 Checking local environment...")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        return False
    
    print("✅ Python version compatible")
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Virtual environment not detected")
        print("   Consider activating: source venv/bin/activate")
    else:
        print("✅ Virtual environment detected")
    
    # Check required packages
    required_packages = ['strands', 'strands_tools', 'bedrock_agentcore']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} available")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} not available")
    
    if missing_packages:
        print(f"\n📦 Install missing packages:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    print("✅ All required packages available")
    return True

def create_local_agentcore_agent():
    """Create the Strands agent with BedrockAgentCoreApp for local testing."""
    print("\n📝 Creating local AgentCore agent...")

    agent_code = '''#!/usr/bin/env python3
"""
Strands Calculator Agent - Local AgentCore Testing

This agent follows the exact pattern from AWS Bedrock AgentCore documentation
for local testing before cloud deployment.

Based on: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-getting-started-toolkit.html
"""

import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from strands import Agent
from strands_tools.calculator import calculator

# Create the calculator agent
agent = Agent(
    name="Local Calculator Agent",
    tools=[calculator],
    system_prompt="""You are a helpful calculator assistant that can perform mathematical operations.
    
    You have access to a calculator tool that can handle:
    - Basic arithmetic (+, -, *, /)
    - Powers and roots
    - Trigonometric functions
    - Logarithms
    - And more complex mathematical operations
    
    Always use the calculator tool for mathematical calculations to ensure accuracy.
    Provide clear explanations of your calculations."""
)

# Integrate with Bedrock AgentCore - following AWS documentation pattern
from bedrock_agentcore.runtime import BedrockAgentCoreApp
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    """Process user input and return a response - following AWS pattern"""
    user_message = payload.get("prompt", "Hello! I'm your calculator assistant. How can I help you today?")
    
    try:
        result = agent(user_message)
        return {"result": str(result.message)}
    except Exception as e:
        return {"error": f"Agent error: {str(e)}"}

if __name__ == "__main__":
    print("🧪 Testing local AgentCore agent...")
    print("=" * 50)
    
    # Test the agent locally first
    test_cases = [
        "What is 2 + 3?",
        "Calculate the square root of 144",
        "What is 15 * 7 + 23?"
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\\n{i}. Testing: {test_case}")
        try:
            result = agent(test_case)
            print(f"   Result: {result.message}")
        except Exception as e:
            print(f"   Error: {e}")
    
    print("\\n✅ Local testing complete!")
    print("\\n🚀 Starting local AgentCore server...")
    print("   Server will be available at: http://localhost:8080")
    print("   Test with: curl -X POST http://localhost:8080/invocations \\")
    print("        -H 'Content-Type: application/json' \\")
    print("        -d '{\"prompt\": \"What is 5 * 5?\"}'")
    
    # Start the local server
    app.run()
'''

    # Write the local AgentCore agent file
    local_agentcore_file = "strands_calculator_local_agentcore.py"
    with open(local_agentcore_file, 'w') as f:
        f.write(agent_code)

    print(f"✅ Local AgentCore agent file created: {local_agentcore_file}")
    return local_agentcore_file

def create_requirements_file():
    """Create a requirements.txt file for local testing."""
    print("\n📝 Creating requirements.txt...")

    requirements_content = """strands-agents
strands-tools
bedrock-agentcore
PyYAML>=6.0
"""

    requirements_file = "requirements_local.txt"
    with open(requirements_file, 'w') as f:
        f.write(requirements_content)

    print(f"✅ Requirements file created: {requirements_file}")
    return requirements_file

def test_agent_locally(agent):
    """Test the agent functionality locally with interactive testing."""
    # Consistent interactive testing banner
    print("\n🧪 Interactive Testing (Local Strands Agent)")
    print("=" * 60)
    print("This will test the agent locally using the Strands runtime.")
    print("Type 'quit' to exit testing.")
    print()

    try:
        while True:
            try:
                # Get user input (consistent prompt)
                user_input = input("Enter a calculation to test: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("Testing completed! 👋")
                    break
                
                if not user_input:
                    continue
                
                # Consistent UX formatting
                print(f"\n🤔 Testing: {user_input}")
                print("-" * 40)
                print("Processing your request via Local Strands Agent...")
                
                # Get response from agent
                result = agent(user_input)
                
                # Attempt to extract just the final answer for consistency
                try:
                    import re
                    result_text = str(result)
                    # Remove markdown code blocks and bold markers
                    result_text = re.sub(r"```.*?```", "", result_text, flags=re.DOTALL)
                    result_text = re.sub(r"\*\*(.*?)\*\*", r"\1", result_text)
                    result_text = re.sub(r"\s+", " ", result_text).strip()
                    
                    answer_match = re.search(r"Answer:\s*(.+)", result_text, re.IGNORECASE)
                    if answer_match:
                        clean_answer = answer_match.group(1).strip()
                        print(f"🎯 Answer: {clean_answer}")
                    else:
                        print("📝 Response:")
                        print(result_text)
                except Exception:
                    print("📝 Response:")
                    print(result)
                
                print("-" * 40)
                print()
                
            except KeyboardInterrupt:
                print("\n\nTesting interrupted! 👋")
                break
            except Exception as e:
                print(f"\n❌ Error during testing: {e}")
                print()
        
        return True
    
    except Exception as e:
        print(f"   ❌ Unexpected error during local testing: {e}")
        return False




def create_dockerfile():
    """Create a Dockerfile for local container testing."""
    print("\n📝 Creating Dockerfile...")
    
    dockerfile_content = """# Dockerfile for local AgentCore testing
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements_local.txt .
RUN pip install --no-cache-dir -r requirements_local.txt

# Copy agent code
COPY strands_calculator_agent.py .

# Expose the port that BedrockAgentCoreApp uses
EXPOSE 8080

# Run the agent
CMD ["python", "strands_calculator_agent.py"]
"""
    
    # Write the Dockerfile
    dockerfile_file = "Dockerfile.local"
    with open(dockerfile_file, 'w') as f:
        f.write(dockerfile_content)
    
    print(f"✅ Dockerfile created: {dockerfile_file}")
    return dockerfile_file

def main():
    """Main function for local Strands agent testing."""
    print("🧪 Strands Agent - Local Testing")
    print("=" * 60)
    print("Test your Strands calculator agent locally before deployment")
    print("Following AWS Bedrock AgentCore documentation patterns")
    print()
    
    # Check environment
    if not check_environment():
        print("\n❌ Environment check failed. Please fix the issues above.")
        return
    
    # Create local AgentCore agent
    agent_file = create_local_agentcore_agent()
    
    # Create requirements file
    requirements_file = create_requirements_file()
    
    # Create Dockerfile for container testing
    dockerfile_file = create_dockerfile()
    
    print("\n🎉 Local AgentCore deployment setup completed successfully!")
    print("=" * 60)
    print("📁 Files created:")
    print(f"   • {agent_file} - Local AgentCore agent (main file)")
    print(f"   • {requirements_file} - Python dependencies")
    print(f"   • {dockerfile_file} - Dockerfile for container testing")
    
    # Create and test the agent locally
    try:
        from strands import Agent
        from strands_tools.calculator import calculator
        
        # Create the calculator agent
        agent = Agent(
            name="Calculator Agent",
            tools=[calculator],
            system_prompt="""You are a helpful calculator assistant that can perform mathematical operations.
            
            You have access to a calculator tool that can handle:
            - Basic arithmetic (+, -, *, /)
            - Powers and roots
            - Trigonometric functions
            - Logarithms
            - And more complex mathematical operations
            
            Always use the calculator tool for mathematical calculations to ensure accuracy.
            Provide clear explanations of your calculations."""
        )
        
        # Test the agent with sample calculations
        test_agent_locally(agent)
        
    except Exception as e:
        print(f"\n❌ Failed to create agent: {e}")
        print("   Continuing with file creation...")
    
    print("\n🚀 Next steps:")
    print("1. Start the local AgentCore server:")
    print(f"   python {agent_file}")
    
    print("\n2. Test manually with curl:")
    print("   curl -X POST http://localhost:8080/invocations \\")
    print("        -H 'Content-Type: application/json' \\")
    print("        -d '{\"prompt\": \"What is 5 * 5?\"}'")
    
    print("\n3. Test health check:")
    print("   curl http://localhost:8080/ping")
    
    print("\n4. Deploy to cloud AgentCore when ready:")
    print("   python deploy_strands_agent_to_agentcore.py")
    
    print("\n📚 Based on AWS documentation:")
    print("   https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-getting-started-toolkit.html")
    
    print("\n✅ Your Strands agent is ready for local AgentCore testing!")

if __name__ == "__main__":
    main()
