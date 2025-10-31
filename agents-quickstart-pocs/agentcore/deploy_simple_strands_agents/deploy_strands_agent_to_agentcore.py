#!/usr/bin/env python3
"""
Deploy Strands Calculator Agent to AgentCore

This script deploys the strands calculator agent to Amazon Bedrock AgentCore
using an interactive configuration approach that guides users through the process.

Features:
- Interactive agentcore configure with user prompts
- Automatic ECR repository creation
- Automatic execution role setup with proper permissions
- Cloud deployment using CodeBuild
- Comprehensive error handling and status monitoring
- User-friendly prompts and guidance throughout the process
"""

import os
import sys
import json
import subprocess
import time
from typing import Dict, Any, Optional

class StrandsAgentCoreDeployer:
    """Deploys Strands agents to AgentCore using the correct patterns."""
    
    def __init__(self):
        self.agent_id = None
        self.agent_alias_id = None
        
        # Display important message about deployment process
        print("=" * 80)
        print("🚀 STRANDS AGENT DEPLOYMENT TO AGENTCORE")
        print("=" * 80)
        print("💡 This deployment process will prompt you for configuration choices.")
        print("   You can accept defaults by pressing Enter for all options.")
        print("   The program will guide you through each step interactively.")
        print("=" * 80)
        print()
        
    def check_prerequisites(self) -> bool:
        """Check if all prerequisites are met."""
        print("🔍 Checking prerequisites...")
        
        # Check if we're in a virtual environment
        if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            print("❌ Please activate your virtual environment first:")
            print("   source venv/bin/activate")
            return False
        
        # Check strands dependencies
        try:
            from strands import Agent
            print("✅ Strands dependencies available")
        except ImportError as e:
            print(f"❌ Strands dependencies not available: {e}")
            print("   Please install: pip install strands-agents")
            return False
        
        # Check AWS credentials
        try:
            import boto3
            sts = boto3.client('sts')
            identity = sts.get_caller_identity()
            region = os.environ.get('AWS_DEFAULT_REGION') or os.environ.get('AWS_REGION') or 'us-east-1'
            print(f"✅ AWS credentials valid for account: {identity['Account']}")
            print(f"✅ AWS region: {region}")
        except Exception as e:
            print(f"❌ AWS credentials error: {e}")
            print("   Please configure AWS CLI: aws configure")
            return False
        
        # Check if agentcore CLI is available
        try:
            result = subprocess.run(['agentcore', '--version'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ AgentCore CLI available: {result.stdout.strip()}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ AgentCore CLI not found")
            print("   Installing AgentCore CLI...")
            try:
                subprocess.run([sys.executable, '-m', 'pip', 'install', 'agentcore'], 
                              check=True)
                print("✅ AgentCore CLI installed")
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install AgentCore CLI: {e}")
                return False
        
        return True
    
    def ensure_ecr_repository(self, account_id: str, region: str) -> bool:
        """Ensure the ECR repository exists for the agent."""
        print("🔍 Ensuring ECR repository exists...")
        
        try:
            import boto3
            ecr = boto3.client('ecr', region_name=region)
            repository_name = 'strands-calculator-agent'
            
            # Check if repository exists
            try:
                ecr.describe_repositories(repositoryNames=[repository_name])
                print(f"   ✅ ECR repository '{repository_name}' already exists")
                return True
            except ecr.exceptions.RepositoryNotFoundException:
                print(f"   📦 Creating ECR repository '{repository_name}'...")
                ecr.create_repository(repositoryName=repository_name)
                print(f"   ✅ ECR repository '{repository_name}' created successfully")
                return True
                
        except Exception as e:
            print(f"   ❌ Failed to ensure ECR repository: {e}")
            return False
    
    def ensure_execution_role(self, account_id: str, region: str) -> bool:
        """Ensure the execution role exists with proper permissions."""
        print("🔍 Ensuring execution role exists...")
        
        try:
            import boto3
            iam = boto3.client('iam')
            role_name = 'AmazonBedrockExecutionRoleForAgents'
            
            # Check if role exists
            try:
                iam.get_role(RoleName=role_name)
                print(f"   ✅ Execution role '{role_name}' already exists")
            except iam.exceptions.NoSuchEntityException:
                print(f"   🔐 Creating execution role '{role_name}'...")
                
                # Create role with trust policy for Bedrock AgentCore
                trust_policy = {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "bedrock-agentcore.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }
                
                iam.create_role(
                    RoleName=role_name,
                    AssumeRolePolicyDocument=json.dumps(trust_policy),
                    Description='Execution role for Bedrock AgentCore agents'
                )
                
                # Attach necessary policies
                iam.attach_role_policy(RoleName=role_name, PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')
                iam.attach_role_policy(RoleName=role_name, PolicyArn='arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly')
                
                # Create custom policy for Bedrock permissions
                bedrock_policy = {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
                        "Resource": "*"
                    }]
                }
                
                iam.put_role_policy(
                    RoleName=role_name,
                    PolicyName='BedrockInvokePolicy',
                    PolicyDocument=json.dumps(bedrock_policy)
                )
                
                print(f"   ✅ Execution role '{role_name}' created with all necessary permissions")
            
            return True
                
        except Exception as e:
            print(f"   ❌ Failed to ensure execution role: {e}")
            return False
    
    def create_strands_agent_file(self) -> str:
        """Create the strands agent file for AgentCore deployment."""
        print("📝 Creating Strands agent file...")
        
        agent_code = '''#!/usr/bin/env python3
"""
Strands Calculator Agent for AgentCore Deployment

This file is created by the deployment script and contains the agent
that will be deployed to AgentCore.
"""

import os
os.environ["BYPASS_TOOL_CONSENT"] = "true"

from strands import Agent
from bedrock_agentcore.runtime import BedrockAgentCoreApp

# Create the calculator agent
agent = Agent(
    name="Calculator Agent",
    description="A calculator agent that can perform mathematical operations.",
    system_prompt="You are a helpful calculator assistant. You can perform various mathematical operations including basic arithmetic, trigonometry, logarithms, and more. Always show your work and explain the steps when performing calculations."
)

# Integrate with Bedrock AgentCore
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    """Process user input and return a response"""
    user_message = payload.get("prompt", "Hello")
    print("Processing request:", user_message)
    
    try:
        result = agent(user_message)
        return {"result": str(result)}
    except Exception as e:
        print(f"Error processing request: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    app.run()
'''
        
        agent_file = "strands_calculator_agentcore.py"
        with open(agent_file, 'w') as f:
            f.write(agent_code)
        
        print(f"✅ Agent file created: {agent_file}")
        return agent_file
    
    def deploy_agent(self, agent_file: str, config_file: str) -> bool:
        """Deploy the agent to AgentCore."""
        print("🚀 Deploying agent to AgentCore...")
        
        # Get AWS account ID and region for configuration
        try:
            import boto3
            sts = boto3.client('sts')
            account_id = sts.get_caller_identity()['Account']
            region = os.environ.get('AWS_DEFAULT_REGION') or os.environ.get('AWS_REGION') or 'us-east-1'
        except Exception as e:
            print(f"   ❌ Could not get AWS account ID: {e}")
            return False
        
        try:
            # Ensure prerequisites are met
            if not self.ensure_execution_role(account_id, region):
                print("   ❌ Failed to ensure execution role")
                return False
            
            if not self.ensure_ecr_repository(account_id, region):
                print("   ❌ Failed to ensure ECR repository")
                return False
            
            # Check if we already have a valid configuration
            config_file = '.bedrock_agentcore.yaml'
            if os.path.exists(config_file):
                print("   🔍 Checking existing configuration...")
                try:
                    with open(config_file, 'r') as f:
                        config_content = f.read()
                    
                    # Check if configuration has the agent we want
                    if 'strands_calculator_agent' in config_content and 'agent_id' in config_content:
                        print("   ✅ Valid configuration found, skipping configuration step")
                        print("   📋 Using existing configuration for deployment")
                    else:
                        print("   ⚠️ Configuration exists but may be incomplete, attempting to reconfigure...")
                        # Continue with configuration below
                except Exception as e:
                    print(f"   ⚠️ Error reading existing config: {e}, attempting to reconfigure...")
                    # Continue with configuration below
            else:
                print("   📝 No existing configuration found, creating new configuration...")
            
            # Only configure if we don't have a valid existing configuration
            if not os.path.exists(config_file) or 'agent_id' not in open(config_file, 'r').read():
                print("   📝 Configuration needed - running interactive agentcore configure...")
                print("   💡 You will be prompted for configuration options.")
                print("   💡 Recommended: Accept all defaults by pressing Enter for each prompt.")
                print()
                
                # Run interactive agentcore configure
                try:
                    print("   🔧 Running: agentcore configure with required parameters...")
                    print("   📝 Please respond to the prompts below:")
                    print("   💡 Tip: Press Enter to accept defaults for most options")
                    print("-" * 60)
                    
                    # Run the configure command with required parameters but allow interactive input for choices
                    result = subprocess.run(['agentcore', 'configure', '--entrypoint', agent_file], 
                                          capture_output=False,  # Allow interactive input
                                          text=True)
                    
                    if result.returncode == 0:
                        print("   ✅ Configuration completed successfully!")
                    else:
                        print(f"   ❌ Configuration failed with exit code: {result.returncode}")
                        return False
                        
                except subprocess.CalledProcessError as e:
                    print(f"   ❌ Configuration failed: {e}")
                    return False
                except Exception as e:
                    print(f"   ❌ Unexpected error during configuration: {e}")
                    return False
            
            # List current directory to debug
            print("   📁 Current directory contents:")
            for file in os.listdir('.'):
                if file.startswith('.') or file.endswith('.py'):
                    print(f"      {file}")
            
            # Check if agent file exists
            if not os.path.exists(agent_file):
                print(f"   ❌ Agent file {agent_file} not found!")
                return False
            
            # Deploy the agent directly to cloud
            print("   🚀 Deploying to cloud...")
            try:
                print("   📝 Running: agentcore launch")
                print("   💡 This may take several minutes. Please wait...")
                
                result = subprocess.run(['agentcore', 'launch'], 
                                      capture_output=True, text=True, timeout=600)  # Increased timeout for cloud deployment
                if result.returncode == 0:
                    print("   ✅ Agent deployment completed successfully!")
                    print(f"   Launch output: {result.stdout}")
                else:
                    print(f"   ❌ Cloud launch failed: {result.stderr}")
                    return False
            except subprocess.CalledProcessError as e:
                print(f"   ❌ Cloud launch failed: {e}")
                print(f"   Launch stderr: {e.stderr}")
                print(f"   Launch stdout: {e.stdout}")
                return False
            except subprocess.TimeoutExpired as e:
                print(f"   ❌ Cloud launch timeout: {e}")
                return False
            
            # Extract agent ID from deployment output
            if 'agentId' in result.stdout:
                self.agent_id = result.stdout.split('agentId')[1].split()[0].strip()
                print(f"   📋 Agent ID: {self.agent_id}")
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"   ❌ Deployment failed: {e}")
            print(f"   Error output: {e.stderr}")
            return False
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return False
    
    def test_deployed_agent(self) -> Dict[str, Any]:
        """Test the deployed agent."""
        print("🧪 Testing deployed agent...")
        
        if not self.agent_id:
            print("   ❌ No agent ID available for testing")
            return {"error": "No agent ID available"}
        
        results = {}
        
        try:
            print("   💡 Enter calculations to test (type 'quit' to exit):")
            
            while True:
                try:
                    # Get user input for testing
                    user_input = input("   Enter a calculation to test: ").strip()
                    
                    if user_input.lower() in ['quit', 'exit', 'q']:
                        print("   ✅ Testing completed")
                        break
                    
                    if not user_input:
                        continue
                    
                    print(f"   🔢 Testing: {user_input}")
                    
                    # Test using agentcore invoke
                    result = subprocess.run(['agentcore', 'invoke', f'{{"prompt": "{user_input}"}}'], 
                                          capture_output=True, text=True, check=True)
                    
                    results[user_input] = {"status": "success", "response": result.stdout}
                    print(f"   ✅ Success: {result.stdout.strip()}")
                    print()
                    
                except subprocess.CalledProcessError as e:
                    results[user_input] = {"status": "error", "error": e.stderr}
                    print(f"   ❌ Error: {e.stderr}")
                    print()
                except Exception as e:
                    results[user_input] = {"status": "error", "error": str(e)}
                    print(f"   ❌ Error: {e}")
                    print()
            
            print("   ✅ Deployed agent testing completed")
            return results
            
        except Exception as e:
            print(f"   ❌ Deployed agent testing failed: {e}")
            return {"error": str(e)}
    
    def cleanup(self) -> None:
        """Clean up resources."""
        print("\n🧹 Cleaning up...")
        
        try:
            # Delete the agent using agentcore CLI
            if self.agent_id:
                print(f"   Deleting agent: {self.agent_id}")
                subprocess.run(['agentcore', 'delete'], check=True)
                print("   ✅ Agent deleted")
        except Exception as e:
            print(f"   ⚠️ Cleanup warning: {e}")
        
        # Remove temporary files
        for file in ["agentcore_config.json", "strands_calculator_agentcore.py"]:
            if os.path.exists(file):
                os.remove(file)
                print(f"   ✅ {file} removed")

def main():
    """Main deployment function."""
    print("🚀 Strands Calculator Agent - AgentCore Deployment")
    print("=" * 60)
    
    # Initialize deployer
    deployer = StrandsAgentCoreDeployer()
    
    try:
        # Check prerequisites
        if not deployer.check_prerequisites():
            print("❌ Prerequisites not met. Exiting.")
            return
        
        # Create strands agent file
        agent_file = deployer.create_strands_agent_file()
        
        # Deploy agent using the interactive approach
        if not deployer.deploy_agent(agent_file, None):
            print("❌ Agent deployment failed. Exiting.")
            return
        
        # Deployment completed, no need to wait for local deployment
        
        # Agent deployed successfully
        
        print("\n🎉 Cloud deployment completed successfully!")
        print("\n💡 Next steps:")
        print("   • Monitor agent performance in AWS Console")
        print("   • Test your agent: agentcore invoke '{\"prompt\": \"What is 5 * 5?\"}'")
        print("   • Check agent status: agentcore status")
        print("   • Clean up when done: python cleanup_agents.py")
        
        # Test the deployed agent
        print("\n🧪 Testing the deployed AgentCore agent...")
        print("=" * 60)
        print("This will test the agent deployed in AgentCore.")
        print("Type 'quit' to exit testing.")
        print()
        
        # Get the agent ID from the deployment output
        agent_id = None
        if hasattr(deployer, 'agent_id') and deployer.agent_id:
            agent_id = deployer.agent_id
        else:
            # Try to extract from status
            try:
                result = subprocess.run(['agentcore', 'status'], 
                                      capture_output=True, text=True, check=True)
                if 'Agent ID:' in result.stdout:
                    agent_id = result.stdout.split('Agent ID:')[1].split()[0].strip()
            except:
                pass
        
        if agent_id:
            print(f"✅ Testing agent: {agent_id}")
        else:
            print("⚠️ Could not determine agent ID, but proceeding with testing...")
        
        while True:
            try:
                # Get user input for testing
                user_input = input("Enter a calculation to test: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("Testing completed! 👋")
                    break
                
                if not user_input:
                    continue
                
                print(f"\n🤔 Testing: {user_input}")
                print("-" * 40)
                print("Processing your request via AgentCore...")
                
                # Test using agentcore invoke
                try:
                    result = subprocess.run(['agentcore', 'invoke', f'{{"prompt": "{user_input}"}}'], 
                                          capture_output=True, text=True, check=True)
                    
                    print("📝 Response from AgentCore:")
                    
                    # Parse the response to extract just the answer
                    try:
                        import json
                        import re
                        
                        # Extract the response content from the AgentCore output
                        response_text = result.stdout.strip()
                        
                        # Look for the response array in the JSON
                        if '"response": [' in response_text:
                            # Extract the response array content
                            response_match = re.search(r'"response":\s*\[(.*?)\]', response_text, re.DOTALL)
                            if response_match:
                                response_content = response_match.group(1).strip()
                                
                                # Remove the b'' wrapper and decode if it's bytes
                                if response_content.startswith("b'") and response_content.endswith("'"):
                                    response_content = response_content[2:-1]  # Remove b'' wrapper
                                
                                # Try to parse the inner JSON
                                try:
                                    inner_json = json.loads(response_content)
                                    if 'result' in inner_json:
                                        # Extract and clean the result
                                        result_text = inner_json['result']
                                        
                                        # Clean up encoding issues and markdown formatting
                                        # Fix UTF-8 encoded characters
                                        result_text = result_text.replace('xc3x97', '×')
                                        result_text = result_text.replace('xc3xa0', ' ')
                                        result_text = result_text.replace('xc2xa0', ' ')
                                        
                                        # Remove markdown code blocks
                                        result_text = re.sub(r'```.*?```', '', result_text, flags=re.DOTALL)
                                        # Remove markdown formatting
                                        result_text = re.sub(r'\*\*(.*?)\*\*', r'\1', result_text)
                                        # Clean up extra whitespace
                                        result_text = re.sub(r'\s+', ' ', result_text).strip()
                                        
                                        # Extract just the final answer if it exists
                                        answer_match = re.search(r'Answer:\s*(.+)', result_text, re.IGNORECASE)
                                        if answer_match:
                                            clean_answer = answer_match.group(1).strip()
                                            print(f"🎯 Answer: {clean_answer}")
                                        else:
                                            # If no "Answer:" found, show the cleaned result
                                            print(f"📊 Result: {result_text}")
                                    else:
                                        print(f"📊 Response: {inner_json}")
                                except json.JSONDecodeError:
                                    # If inner JSON parsing fails, try to extract answer from raw content
                                    clean_content = response_content.replace('\\n', ' ').replace('\\', '')
                                    # Fix encoding issues
                                    clean_content = clean_content.replace('xc3x97', '×')
                                    clean_content = clean_content.replace('xc3xa0', ' ')
                                    clean_content = clean_content.replace('xc2xa0', ' ')
                                    
                                    # Try to find answer in the raw content
                                    answer_match = re.search(r'Answer:\s*([^"]+)', clean_content, re.IGNORECASE)
                                    if answer_match:
                                        clean_answer = answer_match.group(1).strip()
                                        print(f"🎯 Answer: {clean_answer}")
                                    else:
                                        # Show the cleaned raw content
                                        print(f"📊 Raw Response: {clean_content}")
                            else:
                                print("⚠️ Could not parse response structure")
                                print(response_text)
                        else:
                            # Fallback to showing the full response
                            print(response_text)
                            
                    except Exception as parse_error:
                        # If parsing fails, show the original response
                        print("⚠️ Could not parse response, showing raw output:")
                        print(response_text)
                    
                    print("-" * 40)
                    print()
                    
                except subprocess.CalledProcessError as e:
                    print(f"❌ AgentCore invocation failed: {e.stderr}")
                    print("-" * 40)
                    print()
                except Exception as e:
                    print(f"❌ Unexpected error: {e}")
                    print("-" * 40)
                    print()
                    
            except KeyboardInterrupt:
                print("\n\nTesting interrupted! 👋")
                break
            except Exception as e:
                print(f"\n❌ Error during testing: {e}")
                print()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Deployment interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    finally:
        # Ask user if they want to cleanup
        try:
            cleanup_choice = input("\n🧹 Do you want to clean up the deployed agent? (y/N): ").strip().lower()
            if cleanup_choice in ['y', 'yes']:
                deployer.cleanup()
                print("✅ Cleanup completed")
            else:
                print("ℹ️ Agent left running. Remember to clean up manually later.")
        except:
            print("ℹ️ Agent left running. Remember to clean up manually later.")

if __name__ == "__main__":
    main()
