#!/usr/bin/env python3
"""
Simple Deployment Script for Strands Calculator Agent

This script deploys the agent using existing configuration without the problematic
configuration step. It assumes the agent has already been configured.
"""

import os
import subprocess  # nosec B404 - subprocess needed for system commands
import sys

def main():
    """Simple deployment function."""
    print("🚀 Simple Strands Calculator Agent Deployment")
    print("=" * 50)
    
    # Check if configuration exists
    config_file = '.bedrock_agentcore.yaml'
    if not os.path.exists(config_file):
        print("❌ Configuration file not found!")
        print("   Please run: agentcore configure --entrypoint strands_calculator_agentcore.py --name strands_calculator_agent --execution-role AmazonBedrockExecutionRoleForAgents --ecr 734908905310.dkr.ecr.us-east-1.amazonaws.com/strands-calculator-agent --region us-east-1")
        return
    
    print("✅ Configuration file found")
    
    # Check if agent file exists
    agent_file = "strands_calculator_agentcore.py"
    if not os.path.exists(agent_file):
        print("❌ Agent file not found!")
        print("   Please run the full deployment script first to create the agent file")
        return
    
    print("✅ Agent file found")
    
    # Deploy directly to cloud
    print("🚀 Deploying to cloud...")
    try:
        result = subprocess.run(['agentcore', 'launch'],  # nosec B603, B607 - subprocess needed for AWS CLI and agentcore commands
                              capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            print("✅ Agent deployment completed successfully!")
            print(f"Launch output: {result.stdout}")
        else:
            print(f"❌ Cloud launch failed: {result.stderr}")
            return
    except subprocess.CalledProcessError as e:
        print(f"❌ Cloud launch failed: {e}")
        print(f"Launch stderr: {e.stderr}")
        print(f"Launch stdout: {e.stdout}")
        return
    except subprocess.TimeoutExpired as e:
        print(f"❌ Cloud launch timeout: {e}")
        return
    
    print("\n🎉 Deployment completed successfully!")
    print("\n💡 Next steps:")
    print("   • Test your agent: agentcore invoke '{\"prompt\": \"What is 5 * 5?\"}'")
    print("   • Check status: agentcore status")
    print("   • Clean up when done: python cleanup_agents.py")

if __name__ == "__main__":
    main()
