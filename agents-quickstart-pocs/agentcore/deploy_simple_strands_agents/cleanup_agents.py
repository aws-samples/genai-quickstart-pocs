#!/usr/bin/env python3
"""
Cleanup Script for AgentCore Deployed Agents

This script cleans up the deployed strands_calculator_agentcore by:
1. Deleting the agent from AgentCore runtime
2. Removing the ECR repository and container images
3. Cleaning up local configuration files

All operations use defaults automatically - no user input required.
"""

import os
import subprocess
import sys
import json
import boto3
import yaml
from typing import Optional

def check_environment():
    """Check if the environment is properly set up."""
    print("🔍 Checking environment...")
    
    # Check AWS CLI
    try:
        result = subprocess.run(['aws', '--version'], 
                              capture_output=True, text=True, check=True)
        print("✅ AWS CLI available")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ AWS CLI not found. Please install and configure AWS CLI.")
        return False
    
    # Check AgentCore CLI
    try:
        # Try to find agentcore in the current environment
        agentcore_path = None
        
        # Check if agentcore is in PATH
        try:
            result = subprocess.run(['which', 'agentcore'], 
                                  capture_output=True, text=True, check=True)
            agentcore_path = result.stdout.strip()
            print(f"   Found agentcore in PATH at: {agentcore_path}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("   agentcore not found in PATH")
        
        # Check if agentcore is in virtual environment
        if not agentcore_path:
            venv_agentcore = os.path.join('venv', 'bin', 'agentcore')
            print(f"   Checking relative path: {venv_agentcore}")
            if os.path.exists(venv_agentcore):
                agentcore_path = venv_agentcore
                print(f"   Found at relative path: {agentcore_path}")
            else:
                # Try with absolute path
                current_dir = os.getcwd()
                venv_agentcore = os.path.join(current_dir, 'venv', 'bin', 'agentcore')
                print(f"   Checking absolute path: {venv_agentcore}")
                if os.path.exists(venv_agentcore):
                    agentcore_path = venv_agentcore
                    print(f"   Found at absolute path: {agentcore_path}")
                else:
                    print(f"   Path does not exist: {venv_agentcore}")
        
        if agentcore_path:
            result = subprocess.run([agentcore_path, '--help'], 
                                  capture_output=True, text=True, check=True)
            print(f"✅ AgentCore CLI available at: {agentcore_path}")
            # Store the path for later use
            os.environ['AGENTCORE_PATH'] = agentcore_path
        else:
            print("❌ AgentCore CLI not found. Please install AgentCore CLI.")
            return False
            
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"❌ AgentCore CLI check failed: {e}")
        return False
    
    # Check AWS credentials
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS credentials valid - Account: {identity['Account']}")
        return True
    except Exception as e:
        print(f"❌ AWS credentials error: {e}")
        print("   Please run: aws configure")
        return False

def get_agent_info() -> Optional[dict]:
    """Get information about the deployed strands_calculator_agentcore."""
    print("📋 Getting agent information...")
    
    config_file = '.bedrock_agentcore.yaml'
    if not os.path.exists(config_file):
        print("   ❌ Configuration file not found")
        return None
    
    try:
        # Read configuration file
        with open(config_file, 'r') as f:
            config = yaml.safe_load(f)
        
        agent_name = 'strands_calculator_agentcore'
        if agent_name in config.get('agents', {}):
            agent_config = config['agents'][agent_name]
            return {
                'name': agent_name,
                'entrypoint': agent_config.get('entrypoint'),
                'agent_id': agent_config.get('bedrock_agentcore', {}).get('agent_id'),
                'agent_arn': agent_config.get('bedrock_agentcore', {}).get('agent_arn'),
                'ecr_repository': agent_config.get('aws', {}).get('ecr_repository'),
                'region': agent_config.get('aws', {}).get('region', 'us-east-1'),
                'execution_role': agent_config.get('aws', {}).get('execution_role')
            }
        else:
            print(f"   ❌ Agent '{agent_name}' not found in configuration")
            return None
            
    except Exception as e:
        print(f"   ❌ Error reading configuration: {e}")
        return None

def delete_agent_from_runtime(agent_name: str) -> bool:
    """Delete the agent from AgentCore runtime using the CLI."""
    print(f"🗑️ Deleting agent '{agent_name}' from runtime...")
    
    try:
        # Get the agentcore path
        agentcore_path = os.environ.get('AGENTCORE_PATH', 'agentcore')
        
        # Set the agent as current
        subprocess.run([agentcore_path, 'configure', 'use', agent_name], 
                      capture_output=True, text=True, check=True)
        
        # Delete the agent
        result = subprocess.run([agentcore_path, 'delete'], 
                              capture_output=True, text=True, check=True)
        
        print(f"   ✅ Successfully deleted agent '{agent_name}' from runtime")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Error deleting agent '{agent_name}': {e}")
        print(f"   Error output: {e.stderr}")
        return False

def delete_agent_using_boto3(agent_arn: str, region: str) -> bool:
    """Delete the agent from AgentCore runtime using boto3."""
    print(f"🗑️ Deleting agent from runtime using AWS SDK...")
    
    try:
        # Create the Bedrock AgentCore control client
        client = boto3.client('bedrock-agentcore-control', region_name=region)
        
        # Extract agent runtime ID from ARN
        agent_runtime_id = agent_arn.split('/')[-1]
        
        # Delete the agent runtime
        response = client.delete_agent_runtime(
            agentRuntimeId=agent_runtime_id
        )
        
        print(f"   ✅ Successfully deleted agent runtime '{agent_runtime_id}'")
        return True
        
    except Exception as e:
        print(f"   ❌ Error deleting agent runtime: {e}")
        return False

def delete_ecr_repository(repository_uri: str, region: str) -> bool:
    """Delete the ECR repository and all its images."""
    print(f"🗑️ Deleting ECR repository: {repository_uri}")
    
    try:
        # Extract repository name from URI
        if '/' in repository_uri:
            repository_name = repository_uri.split('/')[-1]
        else:
            repository_name = repository_uri
        
        print(f"   Repository: {repository_name}")
        print(f"   Region: {region}")
        
        # Create ECR client
        ecr = boto3.client('ecr', region_name=region)
        
        # List and delete all images
        try:
            response = ecr.list_images(repositoryName=repository_name)
            if 'imageIds' in response and response['imageIds']:
                print(f"   Found {len(response['imageIds'])} images to delete")
                
                # Delete all images
                ecr.batch_delete_image(
                    repositoryName=repository_name,
                    imageIds=response['imageIds']
                )
                print("   ✅ All images deleted")
            else:
                print("   ℹ️ No images found in repository")
        except ecr.exceptions.RepositoryNotFoundException:
            print("   ℹ️ Repository not found (may already be deleted)")
        
        # Delete the repository
        ecr.delete_repository(repositoryName=repository_name)
        print(f"   ✅ ECR repository '{repository_name}' deleted")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error deleting ECR repository: {e}")
        return False

def cleanup_local_configuration():
    """Clean up local configuration files."""
    print("🧹 Cleaning up local configuration...")
    
    # Don't automatically delete .bedrock_agentcore.yaml as it's needed for deployment
    config_file = '.bedrock_agentcore.yaml'
    if os.path.exists(config_file):
        print(f"   ℹ️ Preserving {config_file} for future deployments")
        print(f"   ℹ️ To remove it manually, run: rm {config_file}")
    else:
        print("   ℹ️ No local configuration file found")
    
    # Remove any generated agent files
    agent_files = [
        'strands_calculator_agentcore.py',
        'minimal_calculator_agent.py'
    ]
    
    for agent_file in agent_files:
        if os.path.exists(agent_file):
            os.remove(agent_file)
            print(f"   ✅ Removed {agent_file}")

def cleanup_deployed_agent():
    """Clean up the deployed strands_calculator_agentcore automatically."""
    print("🚀 Starting cleanup of deployed strands_calculator_agentcore...")
    print("=" * 60)
    print("Using all defaults - no user input required!")
    print()
    
    if not check_environment():
        print("❌ Environment check failed. Exiting.")
        return
    
    # Get agent information from configuration
    agent_info = get_agent_info()
    
    if not agent_info:
        print("❌ Could not retrieve agent information")
        print("   The agent may have already been cleaned up or configuration is missing")
        cleanup_local_configuration()
        return
    
    print(f"📋 Found deployed agent:")
    print(f"   Name: {agent_info['name']}")
    print(f"   Entrypoint: {agent_info['entrypoint']}")
    print(f"   Agent ID: {agent_info['agent_id']}")
    print(f"   Agent ARN: {agent_info['agent_arn']}")
    print(f"   ECR Repository: {agent_info['ecr_repository']}")
    print(f"   Region: {agent_info['region']}")
    
    print("\n⚠️ This will permanently delete:")
    print("   • The deployed agent from AgentCore runtime")
    print("   • The ECR repository and all container images")
    print("   • Local configuration files")
    print("\n🔄 Proceeding automatically with cleanup...")
    
    success = True
    
    # Delete from runtime using AWS SDK (no CLI delete command available)
    if agent_info['agent_arn']:
        if not delete_agent_using_boto3(agent_info['agent_arn'], agent_info['region']):
            success = False
            print("   ❌ Failed to delete agent from runtime")
    else:
        success = False
        print("   ❌ No agent ARN available for SDK deletion")
    
    # Delete ECR repository
    if agent_info['ecr_repository']:
        if not delete_ecr_repository(agent_info['ecr_repository'], agent_info['region']):
            success = False
            print("   ❌ Failed to delete ECR repository")
    else:
        print("   ℹ️ No ECR repository information available")
    
    # Only clean up local configuration if explicitly requested
    # Don't delete .bedrock_agentcore.yaml automatically as it's needed for deployment
    print("   ℹ️ Preserving .bedrock_agentcore.yaml for future deployments")
    print("   ℹ️ To remove it manually, run: rm .bedrock_agentcore.yaml")
    
    # Summary
    print(f"\n🎉 Cleanup completed!")
    if success:
        print("   ✅ Successfully cleaned up all resources")
    else:
        print("   ⚠️ Some cleanup operations failed")
        print("   You may need to clean up manually using the AWS Console")

def main():
    """Main cleanup function."""
    print("🧹 AgentCore Cleanup Tool")
    print("=" * 30)
    print("Clean up deployed strands_calculator_agentcore")
    print("All operations use defaults automatically - no user input required!")
    print()
    
    # Always clean up the deployed agent
    cleanup_deployed_agent()

if __name__ == "__main__":
    main()
