"""
Redshift cluster manager for automatic cluster creation.
"""
import boto3
import time
import os
import subprocess
import platform
import socket
from dotenv import load_dotenv

load_dotenv()

def create_ssm_role():
    """Create IAM role for SSM access."""
    iam = boto3.client(
        'iam', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
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
        time.sleep(10)  # Wait for role to propagate
        return True
    except Exception as e:
        print(f"Error creating SSM role: {e}")
        return False


def create_bastion_host():
    """Create EC2 bastion host for SSH tunnel."""
    ec2 = boto3.client(
        'ec2', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    
    try:
        # Create SSM role only
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
        
        # Get default VPC and create/update security group for bastion
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
                
                # Add outbound rule for Redshift (port 5439)
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
        
        # Create bastion host with proper security group
        run_params = {
            'ImageId': 'ami-0c02fb55956c7d316',  # Amazon Linux 2 (stable)
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
# Wait for SSM agent to be ready
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
        
        # Wait for SSM agent to be ready (silent)
        ssm = boto3.client(
            'ssm', 
            region_name=os.getenv('AWS_REGION', 'us-east-1')
        )
        
        # Wait up to 10 minutes for SSM agent to connect (silent)
        for i in range(60):  # 60 attempts, 10 seconds each = 10 minutes
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
        
        # Return instance ID for SSM
        return instance_id
        
    except Exception as e:
        print(f"Error creating bastion host: {e}")
        return None

def create_ssm_tunnel(instance_id, redshift_host):
    """Create SSM port forwarding session with Windows compatibility."""
    import subprocess
    import platform
    
    def get_platform():
        return platform.system().lower()
    
    def install_session_manager_plugin():
        """Install Session Manager plugin based on platform."""
        system = get_platform()
        
        try:
            subprocess.run(['session-manager-plugin'], capture_output=True, timeout=5)
            return True
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        print("Installing Session Manager plugin...")
        
        if system == 'windows':
            try:
                import urllib.request
                import tempfile
                
                url = 'https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe'
                
                with tempfile.NamedTemporaryFile(suffix='.exe', delete=False) as tmp_file:
                    urllib.request.urlretrieve(url, tmp_file.name)
                    subprocess.run([tmp_file.name, '/S'], check=True)
                    os.unlink(tmp_file.name)
                
                print("Session Manager plugin installed successfully")
                return True
            except Exception as e:
                print(f"Failed to install Session Manager plugin on Windows: {e}")
                print("Please install manually from:")
                print("https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html")
                return False
        
        elif system == 'darwin':
            try:
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
                subprocess.run(['curl', '-o', '/tmp/session-manager-plugin.rpm',
                              'https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm'],
                              check=True)
                subprocess.run(['sudo', 'yum', 'install', '-y', '/tmp/session-manager-plugin.rpm'], check=True)
                print("Session Manager plugin installed successfully")
                return True
            except subprocess.CalledProcessError as e:
                print(f"Failed to install Session Manager plugin: {e}")
                return False
    
    def kill_existing_sessions():
        """Kill existing SSM sessions in a cross-platform way."""
        system = get_platform()
        
        if system == 'windows':
            try:
                subprocess.run(['taskkill', '/F', '/IM', 'aws.exe'], 
                             capture_output=True, check=False)
            except Exception:
                pass
        else:
            try:
                subprocess.run(['pkill', '-f', 'aws ssm start-session'], 
                             stderr=subprocess.DEVNULL, check=False)
            except Exception:
                pass
        
        time.sleep(2)
    
    # Install plugin if needed
    if not install_session_manager_plugin():
        return False
    
    # Kill any existing sessions
    kill_existing_sessions()
    
    # Wait for SSM to be fully ready (silent)
    time.sleep(60)
    
    # Test SSM connectivity
    ssm = boto3.client(
        'ssm', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
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
        
        pass  # SSM ready
    except Exception as e:
        print(f"SSM connectivity check failed: {e}")
        return False
    
    # Create SSM port forwarding session with explicit region
    cmd = [
        'aws', 'ssm', 'start-session',
        '--region', os.getenv('AWS_REGION', 'us-east-1'),
        '--target', instance_id,
        '--document-name', 'AWS-StartPortForwardingSessionToRemoteHost',
        '--parameters', f'host={redshift_host},portNumber=5439,localPortNumber=5439'
    ]
    
    print(f"Starting SSM session with command: {' '.join(cmd)}")
    
    try:
        # Start session in background with Windows compatibility
        if get_platform() == 'windows':
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE
            )
        
        # Give it time to establish
        print("Waiting for SSM session to establish...")
        time.sleep(15)  # Increased wait time
        
        # Check if process is still running (means session is active)
        if process.poll() is None:
            print("SSM session process is running, testing port forwarding...")
            
            # Test if port forwarding is working
            import socket
            for i in range(15):  # Try for 45 seconds
                sock = None
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(3)
                    result = sock.connect_ex(('localhost', 5439))
                    
                    if result == 0:
                        print(f"✅ Port forwarding working on attempt {i+1}")
                        return True
                    else:
                        print(f"Port test {i+1}/15 failed, retrying...")
                        time.sleep(3)
                except Exception as e:
                    print(f"Port test {i+1}/15 error: {e}")
                    time.sleep(3)
                finally:
                    if sock:
                        try:
                            sock.shutdown(socket.SHUT_RDWR)  # Proper shutdown for Windows
                        except Exception:
                            pass
                        try:
                            sock.close()
                        except Exception:
                            pass
            
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

def create_redshift_cluster():
    """Create Redshift cluster and SSH tunnel if it doesn't exist."""
    import threading
    from .northwind_bootstrapper import download_northwind_data
    
    redshift = boto3.client(
        'redshift', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    ec2 = boto3.client(
        'ec2', 
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )
    
    # Get cluster ID from .env or use default
    cluster_id = os.getenv('OPTION1_CLUSTER_ID', 'sales-analyst-cluster')
    
    # Start data download in background
    download_result = {'path': None}
    def download_data():
        print("Starting parallel data download...")
        download_result['path'] = download_northwind_data()
        print(f"Data download completed: {download_result['path']}")
    
    download_thread = threading.Thread(target=download_data, daemon=True)
    download_thread.start()
    
    try:
        # Check if cluster exists
        response = redshift.describe_clusters(ClusterIdentifier=cluster_id)
        cluster = response['Clusters'][0]
        if cluster['ClusterStatus'] == 'available':
            cluster_endpoint = cluster['Endpoint']['Address']
            print(f"✅ Redshift cluster ready: {cluster_endpoint}")
            
            # Check if cluster is publicly accessible
            is_public = cluster.get('PubliclyAccessible', False)
            
            if not is_public:
                # Private cluster - MUST use bastion
                print("Private cluster detected - using bastion host...")
                
                # Check if tunnel is already working
                import socket
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(2)
                    result = sock.connect_ex(('localhost', 5439))
                    sock.close()
                    
                    if result == 0:
                        print("✅ SSM tunnel already active")
                        return 'localhost'
                except:
                    pass
                
                # Create bastion host and SSM tunnel
                instance_id = create_bastion_host()
                if instance_id:
                    print(f"✅ Bastion instance ready: {instance_id}")
                    
                    # Fix security groups before tunnel
                    try:
                        # Get cluster security groups
                        cluster_response = redshift.describe_clusters(ClusterIdentifier=cluster_id)
                        cluster = cluster_response['Clusters'][0]
                        vpc_sgs = cluster.get('VpcSecurityGroups', [])
                        
                        # Get bastion security group
                        bastion_response = ec2.describe_instances(
                            Filters=[
                                {'Name': 'tag:Name', 'Values': ['sales-analyst-bastion']},
                                {'Name': 'instance-state-name', 'Values': ['running']}
                            ]
                        )
                        bastion_sg = bastion_response['Reservations'][0]['Instances'][0]['SecurityGroups'][0]['GroupId']
                        
                        # Add bastion access to Redshift security groups
                        for sg in vpc_sgs:
                            redshift_sg = sg['VpcSecurityGroupId']
                            try:
                                ec2.authorize_security_group_ingress(
                                    GroupId=redshift_sg,
                                    IpPermissions=[
                                        {
                                            'IpProtocol': 'tcp',
                                            'FromPort': 5439,
                                            'ToPort': 5439,
                                            'UserIdGroupPairs': [{'GroupId': bastion_sg}]
                                        }
                                    ]
                                )
                                print(f"✅ Added bastion access to Redshift SG: {redshift_sg}")
                            except Exception as e:
                                if 'already exists' in str(e):
                                    print(f"✅ Bastion access already exists for SG: {redshift_sg}")
                                else:
                                    print(f"⚠️ SG rule error: {e}")
                    except Exception as e:
                        print(f"⚠️ Security group setup error: {e}")
                    
                    if create_ssm_tunnel(instance_id, cluster_endpoint):
                        print("✅ SSM tunnel established")
                        
                        # Wait for download to complete
                        print("Waiting for data download to complete...")
                        download_thread.join(timeout=60)
                        
                        if download_result['path']:
                            os.environ['NORTHWIND_DATA_PATH'] = download_result['path']
                            print(f"Data ready at: {download_result['path']}")
                        
                        return 'localhost'  # Return localhost for tunnel
                    else:
                        print("❌ SSM tunnel failed")
                        return None
                else:
                    print("❌ Bastion creation failed")
                    return None
            else:
                # Public cluster - try direct connection with security group update
                try:
                    import requests
                    local_ip = requests.get('https://api.ipify.org').text
                    
                    # Get cluster's VPC security groups
                    vpc_security_groups = cluster['VpcSecurityGroups']
                    for sg in vpc_security_groups:
                        sg_id = sg['VpcSecurityGroupId']
                        
                        # Add rule to allow local IP
                        try:
                            ec2.authorize_security_group_ingress(
                                GroupId=sg_id,
                                IpPermissions=[
                                    {
                                        'IpProtocol': 'tcp',
                                        'FromPort': 5439,
                                        'ToPort': 5439,
                                        'IpRanges': [{'CidrIp': f'{local_ip}/32'}]
                                    }
                                ]
                            )
                            print(f"Added security group rule for IP: {local_ip}")
                        except:
                            print(f"Security group rule may already exist for IP: {local_ip}")
                except Exception as e:
                    print(f"Error updating security group: {e}")
                
                return cluster_endpoint
    except redshift.exceptions.ClusterNotFoundFault:
        # Create cluster in PRIVATE subnet (no public access)
        password = os.getenv('OPTION1_PASSWORD')
        if not password:
            raise ValueError("OPTION1_PASSWORD must be set in .env file")
            
        redshift.create_cluster(
            ClusterIdentifier=cluster_id,
            NodeType='ra3.xlplus',
            MasterUsername=os.getenv('OPTION1_USER', 'admin'),
            MasterUserPassword=password,
            DBName=os.getenv('OPTION1_DATABASE', 'sales_analyst'),
            ClusterType='single-node',
            PubliclyAccessible=False,  # PRIVATE SUBNET
            Port=5439,
            ClusterSubnetGroupName='default'
        )
        
        # No security group changes needed for private cluster
        
        # Wait for cluster to be available
        while True:
            response = redshift.describe_clusters(ClusterIdentifier=cluster_id)
            status = response['Clusters'][0]['ClusterStatus']
            if status == 'available':
                cluster_endpoint = response['Clusters'][0]['Endpoint']['Address']
                print(f"✅ Redshift cluster ready: {cluster_endpoint}")
                
                # ALWAYS create bastion for private cluster
                print("Creating bastion host for private cluster...")
                instance_id = create_bastion_host()
                if instance_id:
                    print(f"✅ Bastion instance ready: {instance_id}")
                    
                    # Fix security groups before tunnel
                    try:
                        # Get cluster security groups
                        cluster_response = redshift.describe_clusters(ClusterIdentifier=cluster_id)
                        cluster = cluster_response['Clusters'][0]
                        vpc_sgs = cluster.get('VpcSecurityGroups', [])
                        
                        # Get bastion security group
                        bastion_response = ec2.describe_instances(
                            Filters=[
                                {'Name': 'tag:Name', 'Values': ['sales-analyst-bastion']},
                                {'Name': 'instance-state-name', 'Values': ['running']}
                            ]
                        )
                        bastion_sg = bastion_response['Reservations'][0]['Instances'][0]['SecurityGroups'][0]['GroupId']
                        
                        # Add bastion access to Redshift security groups
                        for sg in vpc_sgs:
                            redshift_sg = sg['VpcSecurityGroupId']
                            try:
                                ec2.authorize_security_group_ingress(
                                    GroupId=redshift_sg,
                                    IpPermissions=[
                                        {
                                            'IpProtocol': 'tcp',
                                            'FromPort': 5439,
                                            'ToPort': 5439,
                                            'UserIdGroupPairs': [{'GroupId': bastion_sg}]
                                        }
                                    ]
                                )
                                print(f"✅ Added bastion access to Redshift SG: {redshift_sg}")
                            except Exception as e:
                                if 'already exists' in str(e):
                                    print(f"✅ Bastion access already exists for SG: {redshift_sg}")
                                else:
                                    print(f"⚠️ SG rule error: {e}")
                    except Exception as e:
                        print(f"⚠️ Security group setup error: {e}")
                    
                    if create_ssm_tunnel(instance_id, cluster_endpoint):
                        print("✅ SSM tunnel established")
                        
                        # Wait for download to complete
                        print("Waiting for data download to complete...")
                        download_thread.join(timeout=60)
                        
                        if download_result['path']:
                            os.environ['NORTHWIND_DATA_PATH'] = download_result['path']
                            print(f"Data ready at: {download_result['path']}")
                        
                        return 'localhost'  # Return localhost for tunnel
                    else:
                        print("❌ SSM tunnel failed")
                        return None
                else:
                    print("❌ Bastion creation failed")
                    return None
            time.sleep(30)
    
    return None