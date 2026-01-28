#!/usr/bin/env python3
"""
Auto-detection setup script for Sales Analyst
Detects platform and installs appropriate dependencies
"""
import platform
import subprocess  # nosec B404 - subprocess needed for system commands
import sys
import os

def detect_platform():
    """Detect the current platform and distribution."""
    system = platform.system().lower()
    
    if system == 'linux':
        # Check if it's Amazon Linux
        try:
            with open('/etc/os-release', 'r') as f:
                content = f.read()
                if 'amazon' in content.lower():
                    return 'amazon_linux'
                elif 'ubuntu' in content.lower():
                    return 'ubuntu'
                else:
                    return 'linux'
        except:
            return 'linux'
    
    return system

def run_command(cmd, shell=None):
    """Run a command and return success status."""
    try:
        # Auto-detect if shell is needed based on command type
        if shell is None:
            shell = isinstance(cmd, str)
        
        if shell and isinstance(cmd, str):
            # For shell commands, use shlex.split to safely parse the command
            import shlex
            cmd = shlex.split(cmd)
        subprocess.run(cmd, check=True, shell=False)  # nosec B603 - subprocess needed for system commands
        return True
    except subprocess.CalledProcessError:
        return False

def install_amazon_linux():
    """Install dependencies for Amazon Linux 2023."""
    print("🚀 Detected Amazon Linux - installing EC2 dependencies...")
    
    commands = [
        "sudo yum update -y",
        "sudo yum install -y git python3 python3-pip python3-devel sqlite-devel gcc gcc-c++ make unzip --allowerasing",
        "sudo yum remove -y awscli || true",  # Remove old AWS CLI if exists
        "curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'",
        "unzip awscliv2.zip",
        "sudo ./aws/install --update",
        "rm -rf aws awscliv2.zip",
        "python3 -m pip install --upgrade pip wheel --ignore-installed setuptools",
        "pip3 install faiss-cpu==1.7.3 --no-cache-dir"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        if not run_command(cmd):
            print(f"❌ Failed: {cmd}")
            return False
    
    return True

def install_ubuntu():
    """Install dependencies for Ubuntu."""
    print("🚀 Detected Ubuntu - installing dependencies...")
    
    commands = [
        "sudo apt-get update",
        "sudo apt-get install -y git python3-dev python3-pip sqlite3 libsqlite3-dev build-essential curl unzip",
        "python3 -m pip install --upgrade pip"
    ]
    
    for cmd in commands:
        print(f"Running: {cmd}")
        if not run_command(cmd):
            print(f"❌ Failed: {cmd}")
            return False
    
    return True

def install_requirements():
    """Install Python requirements."""
    print("🐍 Installing Python packages...")
    return run_command([sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "--ignore-installed", "requests"])

def main():
    """Main setup function."""
    print("🔍 Auto-detecting platform...")
    
    platform_type = detect_platform()
    print(f"📍 Detected: {platform_type}")
    
    success = True
    
    if platform_type == 'amazon_linux':
        success = install_amazon_linux()
    elif platform_type == 'ubuntu':
        success = install_ubuntu()
    elif platform_type in ['darwin', 'windows']:
        print(f"🍎 Detected {platform_type} - using standard pip install")
    else:
        print(f"⚠️  Unknown platform: {platform_type} - trying standard install")
    
    if success:
        success = install_requirements()
    
    if success:
        print("✅ Setup complete!")
        print("\nNext steps:")
        print("1. Configure your .env file with AWS credentials")
        print("2. Run: streamlit run app.py")
    else:
        print("❌ Setup failed. Please check errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()