#!/usr/bin/env python3
"""
Setup utilities for GenAI Sales Analyst with DynamoDB
"""
import os
import sys
import subprocess
import shutil

def check_python_version():
    """Check if Python version is 3.8 or higher."""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required.")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def install_requirements():
    """Install Python requirements."""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)

def setup_env_file():
    """Create .env file from template if it doesn't exist."""
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            shutil.copy('.env.example', '.env')
            print("✅ Created .env file from template")
            print("⚠️  Please edit .env file with your AWS credentials")
        else:
            print("❌ .env.example file not found")
    else:
        print("✅ .env file already exists")

def run_setup():
    """Main setup function."""
    print("🚀 Setting up GenAI Sales Analyst with DynamoDB...")
    
    check_python_version()
    install_requirements()
    setup_env_file()
    
    print("\n✅ Setup complete!")
    print("\nNext steps:")
    print("1. Edit .env file with your AWS credentials")
    print("2. Run: streamlit run app.py")