"""
Windows-compatible Redshift cluster manager for automatic cluster creation.
"""
import boto3
import time
import os
import subprocess
import platform
import socket
from dotenv import load_dotenv

load_dotenv()

def get_platform():
    """Get the current platform."""
    return platform.system().lower()

def kill_existing_sessions():
    """Kill existing SSM sessions in a cross-platform way."""
    system = get_platform()
    
    if system == 'windows':
        # Windows: Use taskkill to terminate AWS CLI processes
        try:
            subprocess.run(['taskkill', '/F', '/IM', 'aws.exe'], 
                         capture_output=True, check=False)
        except Exception:
            pass
    else:
        # Unix/Mac: Use pkill
        try:
            subprocess.run(['pkill', '-f', 'aws ssm start-session'], 
                         stderr=subprocess.DEVNULL, check=False)
        except Exception:
            pass
    
    time.sleep(2)

def install_session_manager_plugin():
    """Install Session Manager plugin based on platform."""
    system = get_platform()
    
    try:
        # Test if plugin is already installed
        result = subprocess.run(['session-manager-plugin'], 
                              capture_output=True, timeout=5)
        return True  # Already installed
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    
    print("Installing Session Manager plugin...")
    
    if system == 'windows':
        # Windows installation
        try:
            import urllib.request
            import zipfile
            import tempfile
            
            # Download Windows installer
            url = 'https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe'
            
            with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as tmp_file:
                urllib.request.urlretrieve(url, tmp_file.name)
                
                # Run installer silently
                subprocess.run([tmp_file.name, '/S'], check=True)
                
                # Clean up
                os.unlink(tmp_file.name)
            
            print("Session Manager plugin installed successfully")
            return True
            
        except Exception as e:
            print(f"Failed to install Session Manager plugin on Windows: {e}")
            print("Please install manually from:")
            print("https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html")
            return False
    
    elif system == 'darwin':  # macOS
        try:
            # Download and install for macOS
            subprocess.run(['curl', '-o', '/tmp/sessionmanager-bundle.zip', 
                          'https://s3.amazonaws.com/session-manager-downloads/plugin/latest/mac/sessionmanager-bundle.zip'], 
                          check=True)
            subprocess.run(['unzip', '-o', '/tmp/sessionmanager-bundle.zip', '-d', '/tmp/'], check=True)
            subprocess.run(['sudo', '/tmp/sessionmanager-bundle/install', 
                          '-i', '/usr/local/sessionmanagerplugin', 
                          '-b', '/usr/local/bin/session-manager-plugin'], check=True)
            print("Session Manager plugin installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to install Session Manager plugin: {e}")
            return False
    
    else:  # Linux
        try:
            # Download and install for Linux
            subprocess.run(['curl', '-o', '/tmp/session-manager-plugin.rpm',
                          'https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm'],
                          check=True)
            subprocess.run(['sudo', 'yum', 'install', '-y', '/tmp/session-manager-plugin.rpm'], check=True)
            print("Session Manager plugin installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Failed to install Session Manager plugin: {e}")
            return False

def test_port_connection(host='localhost', port=5439, timeout=3):
    """Test if a port is accessible with proper socket handling."""
    sock = None
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        return result == 0
    except Exception:
        return False
    finally:
        if sock:
            try:
                sock.shutdown(socket.SHUT_RDWR)  # Proper shutdown before close
            except Exception:
                pass
            try:
                sock.close()
            except Exception:
                pass

def create_ssm_tunnel(instance_id, redshift_host):
    """Create SSM port forwarding session with Windows compatibility."""
    
    # Install plugin if needed
    if not install_session_manager_plugin():
        return False
    
    # Kill any existing sessions
    kill_existing_sessions()
    
    # Wait for SSM to be fully ready
    time.sleep(60)
    
    # Test SSM connectivity
    ssm = boto3.client(
        'ssm', 
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    try:
        response = ssm.describe_instance_information(
            Filters=[{'Key': 'InstanceIds', 'Values': [instance_id]}]
        )
        if not response['InstanceInformationList']:
            print("Instance not found in SSM")
            return False
        
        instance_info = response['InstanceInformationList'][0]
        if instance_info['PingStatus'] != 'Online':
            print(f"Instance SSM status: {instance_info['PingStatus']}")
            return False
            
    except Exception as e:
        print(f"SSM connectivity check failed: {e}")
        return False
    
    # Create SSM port forwarding session
    cmd = [
        'aws', 'ssm', 'start-session',
        '--region', os.getenv('AWS_REGION', 'us-east-1'),
        '--target', instance_id,
        '--document-name', 'AWS-StartPortForwardingSessionToRemoteHost',
        '--parameters', f'host={redshift_host},portNumber=5439,localPortNumber=5439'
    ]
    
    print(f"Starting SSM session with command: {' '.join(cmd)}")
    
    try:
        # Start session in background
        if get_platform() == 'windows':
            # Windows: Use CREATE_NEW_PROCESS_GROUP to allow background execution
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            # Unix/Mac
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE
            )
        
        # Give it time to establish
        print("Waiting for SSM session to establish...")
        time.sleep(15)
        
        # Check if process is still running
        if process.poll() is None:
            print("SSM session process is running, testing port forwarding...")
            
            # Test if port forwarding is working
            for i in range(15):  # Try for 45 seconds
                if test_port_connection('localhost', 5439):
                    print(f"✅ Port forwarding working on attempt {i+1}")
                    return True
                else:
                    print(f"Port test {i+1}/15 failed, retrying...")
                    time.sleep(3)
            
            print("❌ Port forwarding test failed after 15 attempts")
            process.terminate()
            return False
        else:
            stdout, stderr = process.communicate()
            print(f"❌ SSM session failed to start")
            print(f"STDOUT: {stdout.decode() if stdout else 'None'}")
            print(f"STDERR: {stderr.decode() if stderr else 'None'}")
            return False
            
    except Exception as e:
        print(f"❌ SSM session error: {e}")
        return False

# Copy other functions from original file with minimal changes
def create_ssm_role():
    """Create IAM role for SSM access."""
    iam = boto3.client(
        'iam', 
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    try:
        # Check if role exists
        iam.get_role(RoleName='EC2-SSM-Role')
        return True
    except iam.exceptions.NoSuchEntityException:
        # Create role
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        iam.create_role(
            RoleName='EC2-SSM-Role',
            AssumeRolePolicyDocument=str(trust_policy).replace("'", '"')
        )
        
        # Attach SSM policy
        iam.attach_role_policy(
            RoleName='EC2-SSM-Role',
            PolicyArn='arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        )
        
        # Create instance profile
        try:
            iam.create_instance_profile(InstanceProfileName='EC2-SSM-Role')
            iam.add_role_to_instance_profile(
                InstanceProfileName='EC2-SSM-Role',
                RoleName='EC2-SSM-Role'
            )
        except iam.exceptions.EntityAlreadyExistsException:
            pass
        
        print("Created SSM role and instance profile")
        time.sleep(10)
        return True
    except Exception as e:
        print(f"Error creating SSM role: {e}")
        return False

def create_bastion_host():
    """Create EC2 bastion host for SSH tunnel."""
    ec2 = boto3.client(
        'ec2', 
        region_name=os.getenv('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    try:
        # Create SSM role
        create_ssm_role()
        
        # Check if bastion exists
        response = ec2.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': ['sales-analyst-bastion']},
                {'Name': 'instance-state-name', 'Values': ['running']}
            ]
        )
        
        if response['Reservations']:
            instance = response['Reservations'][0]['Instances'][0]
            return instance['InstanceId']
        
        # Get default VPC and create security group
        vpc_response = ec2.describe_vpcs(Filters=[{'Name': 'isDefault', 'Values': ['true']}])
        if not vpc_response['Vpcs']:
            print("No default VPC found")
            return None
        
        vpc_id = vpc_response['Vpcs'][0]['VpcId']
        
        # Create or get bastion security group
        try:
            sg_response = ec2.describe_security_groups(
                Filters=[
                    {'Name': 'group-name', 'Values': ['sales-analyst-bastion-sg']},
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            if sg_response['SecurityGroups']:
                sg_id = sg_response['SecurityGroups'][0]['GroupId']
            else:
                # Create security group
                sg_response = ec2.create_security_group(
                    GroupName='sales-analyst-bastion-sg',
                    Description='Security group for sales analyst bastion host',
                    VpcId=vpc_id
                )
                sg_id = sg_response['GroupId']
                
                # Add outbound rule for Redshift
                ec2.authorize_security_group_egress(
                    GroupId=sg_id,
                    IpPermissions=[
                        {
                            'IpProtocol': 'tcp',
                            'FromPort': 5439,
                            'ToPort': 5439,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                )
                print(f"Created bastion security group: {sg_id}")
        except Exception as e:
            print(f"Error with security group: {e}")
            sg_id = None
        
        # Create bastion host
        run_params = {
            'ImageId': 'ami-0c02fb55956c7d316',  # Amazon Linux 2
            'MinCount': 1,
            'MaxCount': 1,
            'InstanceType': 't3.micro',
            'IamInstanceProfile': {'Name': 'EC2-SSM-Role'},
            'UserData': '''
#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent
sleep 30
            ''',
            'TagSpecifications': [
                {
                    'ResourceType': 'instance',
                    'Tags': [{'Key': 'Name', 'Value': 'sales-analyst-bastion'}]
                }
            ]
        }
        
        if sg_id:
            run_params['SecurityGroupIds'] = [sg_id]
        else:
            run_params['SecurityGroups'] = ['default']
        
        response = ec2.run_instances(**run_params)
        instance_id = response['Instances'][0]['InstanceId']
        
        # Wait for instance to be running
        waiter = ec2.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        
        # Wait for SSM agent to be ready
        ssm = boto3.client(
            'ssm', 
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        # Wait up to 10 minutes for SSM agent
        for i in range(60):
            try:
                response = ssm.describe_instance_information(
                    Filters=[{'Key': 'InstanceIds', 'Values': [instance_id]}]
                )
                if response['InstanceInformationList']:
                    instance_info = response['InstanceInformationList'][0]
                    if instance_info['PingStatus'] == 'Online':
                        break
                time.sleep(10)
            except Exception:
                time.sleep(10)
        
        return instance_id
        
    except Exception as e:
        print(f"Error creating bastion host: {e}")
        return None