"""
Databricks workspace management utilities
"""
import boto3
import time
import os
import requests
import streamlit as st

def create_databricks_workspace_if_needed():
    """Create Databricks workspace and token automatically"""
    try:
        # Check if workspace already configured
        if os.getenv('DATABRICKS_HOST') and os.getenv('DATABRICKS_TOKEN'):
            return True
        
        st.info("🔄 Creating new Databricks workspace in us-east-1...")
        
        session = boto3.Session(
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name='us-east-1'
        )
        
        databricks_client = session.client('databricks')
        workspace_name = "sales-analyst-workspace"
        
        # Create workspace
        response = databricks_client.create_workspace(
            WorkspaceName=workspace_name,
            AwsRegion='us-east-1',
            PricingTier='STANDARD',
            DeploymentName=workspace_name.lower().replace('-', '')
        )
        
        workspace_id = response['WorkspaceId']
        
        # Wait for ready status
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for i in range(20):  # Max 10 minutes
            status_response = databricks_client.describe_workspace(WorkspaceId=workspace_id)
            status = status_response['WorkspaceStatus']
            
            status_text.text(f"Workspace status: {status}")
            progress_bar.progress((i + 1) / 20)
            
            if status == 'RUNNING':
                workspace_url = status_response['WorkspaceUrl']
                st.success(f"✅ Workspace ready: https://{workspace_url}")
                
                # Create token automatically
                token = create_databricks_token(workspace_url)
                if token:
                    update_env_file(workspace_url, token)
                    st.success("✅ Token created and saved automatically")
                    st.info("🔄 Please restart the app to continue")
                    return True
                else:
                    st.error("❌ Failed to create token automatically")
                    return False
                    
            elif status in ['FAILED', 'CANCELLED']:
                st.error(f"❌ Workspace creation failed: {status}")
                return False
            
            time.sleep(30)
        
        st.error("❌ Workspace creation timed out")
        return False
        
    except Exception as e:
        st.error(f"❌ Error creating workspace: {e}")
        return False

def create_databricks_token(workspace_url):
    """Create a personal access token using Databricks API"""
    try:
        import requests
        
        # Use AWS credentials to authenticate with Databricks
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {os.getenv("AWS_ACCESS_KEY_ID")}:{os.getenv("AWS_SECRET_ACCESS_KEY")}'
        }
        
        # Create token via API
        token_data = {
            'comment': 'Auto-generated token for Sales Analyst app',
            'lifetime_seconds': 7776000  # 90 days
        }
        
        response = requests.post(
            f'https://{workspace_url}/api/2.0/token/create',
            headers=headers,
            json=token_data,
            timeout=30
        )
        
        if response.status_code == 200:
            return response.json()['token_value']
        else:
            st.error(f"Token creation failed: {response.text}")
            return None
            
    except Exception as e:
        st.error(f"Error creating token: {e}")
        return None

def update_env_file(workspace_url, token):
    """Update .env file with workspace URL and token"""
    try:
        env_path = '.env'
        env_lines = []
        
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_lines = f.readlines()
        
        # Update or add settings
        updated_lines = []
        host_found = token_found = False
        
        for line in env_lines:
            if line.startswith('DATABRICKS_HOST='):
                updated_lines.append(f'DATABRICKS_HOST=https://{workspace_url}\n')
                host_found = True
            elif line.startswith('DATABRICKS_TOKEN='):
                updated_lines.append(f'DATABRICKS_TOKEN={token}\n')
                token_found = True
            else:
                updated_lines.append(line)
        
        if not host_found:
            updated_lines.append(f'DATABRICKS_HOST=https://{workspace_url}\n')
        if not token_found:
            updated_lines.append(f'DATABRICKS_TOKEN={token}\n')
        
        with open(env_path, 'w') as f:
            f.writelines(updated_lines)
            
    except Exception as e:
        st.error(f"Could not update .env file: {e}")