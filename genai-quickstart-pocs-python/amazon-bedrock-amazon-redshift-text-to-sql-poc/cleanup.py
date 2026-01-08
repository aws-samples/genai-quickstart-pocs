#!/usr/bin/env python3
"""
Clean up all AWS infrastructure for sales analyst app.
"""
import boto3
import os
import subprocess
import warnings
from dotenv import load_dotenv

# Suppress SSL warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
load_dotenv()

def cleanup_redshift():
    """Delete all sales-analyst Redshift clusters."""
    redshift = boto3.client(
        'redshift', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    
    deleted_count = 0
    try:
        # Get all clusters
        clusters = redshift.describe_clusters()['Clusters']
        
        # Delete all sales-analyst clusters
        for cluster in clusters:
            if cluster['ClusterIdentifier'].startswith('sales-analyst-'):
                cluster_id = cluster['ClusterIdentifier']
                redshift.delete_cluster(
                    ClusterIdentifier=cluster_id,
                    SkipFinalClusterSnapshot=True
                )
                print(f"✅ Deleted Redshift cluster: {cluster_id}")
                deleted_count += 1
    except Exception as e:
        print(f"⚠️ Redshift cleanup: {e}")
    
    return deleted_count

def cleanup_ec2():
    """Delete all sales-analyst bastion hosts."""
    ec2 = boto3.client(
        'ec2', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    
    terminated_count = 0
    try:
        # Find all instances
        response = ec2.describe_instances(
            Filters=[
                {'Name': 'instance-state-name', 'Values': ['running', 'stopped']}
            ]
        )
        
        # Terminate all sales-analyst bastion instances
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                for tag in instance.get('Tags', []):
                    if tag['Key'] == 'Name' and tag['Value'].startswith('sales-analyst-bastion'):
                        ec2.terminate_instances(InstanceIds=[instance['InstanceId']])
                        print(f"✅ Terminated bastion: {tag['Value']} ({instance['InstanceId']})")
                        terminated_count += 1
                        break
    except Exception as e:
        print(f"⚠️ EC2 cleanup: {e}")
    
    return terminated_count

def cleanup_iam():
    """Delete IAM role and instance profile."""
    iam = boto3.client(
        'iam', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    
    try:
        # Check if role exists first
        iam.get_role(RoleName='EC2-SSM-Role')
        
        # Remove role from instance profile
        try:
            iam.remove_role_from_instance_profile(
                InstanceProfileName='EC2-SSM-Role',
                RoleName='EC2-SSM-Role'
            )
        except:
            pass
        
        # Delete instance profile
        try:
            iam.delete_instance_profile(InstanceProfileName='EC2-SSM-Role')
        except:
            pass
        
        # Detach policy from role
        try:
            iam.detach_role_policy(
                RoleName='EC2-SSM-Role',
                PolicyArn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
            )
        except:
            pass
        
        # Delete role
        iam.delete_role(RoleName='EC2-SSM-Role')
        print("✅ IAM role and instance profile deleted")
    except iam.exceptions.NoSuchEntityException:
        print("✅ IAM resources already cleaned up")
    except Exception as e:
        print(f"⚠️ IAM cleanup: {e}")

# Key pair cleanup removed - using SSM only

def cleanup_local():
    """Clean up local files."""
    files_to_remove = [
        'metadata_cache.pkl',
        'local_northwind.db'
    ]
    
    for file in files_to_remove:
        if os.path.exists(file):
            os.remove(file)
            print(f"✅ Removed {file}")
    
    # Kill any running SSM sessions
    try:
        subprocess.run(['pkill', '-f', 'aws ssm start-session'], stderr=subprocess.DEVNULL)
        print("✅ Killed SSM sessions")
    except:
        pass

def main():
    print("🧹 Starting cleanup of sales analyst infrastructure...")
    
    cleanup_local()
    ec2_count = cleanup_ec2()
    redshift_count = cleanup_redshift()
    cleanup_iam()
    
    total_cleaned = ec2_count + redshift_count
    
    if total_cleaned == 0:
        print("\n💭 Nothing to clean up - no sales analyst resources found.")
    else:
        print(f"\n✅ Cleanup complete! Removed {ec2_count} bastion hosts and {redshift_count} clusters.")
        print("Run: streamlit run app.py")

if __name__ == "__main__":
    main()