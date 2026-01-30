#!/usr/bin/env python3
"""
run_chatbot.py
--------------
Launcher script for the AWS Pricing Agent Chatbot Streamlit app.

Checks environment, dependencies, and launches the Streamlit web interface.
Provides helpful output for setup and troubleshooting.

Usage:
- Run directly: python run_chatbot.py
- Requires: streamlit_chatbot.py and all dependencies installed
"""
import subprocess  # nosec B404 - subprocess needed for system commands
import sys
import os
import platform
import shutil

def check_streamlit():
    """
    Check if Streamlit is available in the current environment.
    Returns:
        bool: True if Streamlit is available, False otherwise.
    """
    try:
        import streamlit
        return True
    except ImportError:
        return False

def check_uv():
    """
    Check if UV is available in the current environment.
    Returns:
        bool: True if UV is available, False otherwise.
    """
    return shutil.which("uv") is not None

def get_streamlit_command():
    """
    Get the appropriate command to run Streamlit based on the platform.
    Returns:
        list: Command list to run Streamlit.
    """
    # Try to use streamlit directly
    if shutil.which("streamlit"):
        return ["streamlit", "run", "streamlit_chatbot.py"]
    # Fallback to python -m streamlit
    else:
        return [sys.executable, "-m", "streamlit", "run", "streamlit_chatbot.py"]

def install_dependencies_with_uv():
    """
    Install dependencies using UV if available.
    Returns:
        bool: True if installation was successful, False otherwise.
    """
    if not check_uv():
        print("⚠️  UV not found. Using pip instead...")
        return False
    
    print("🚀 Installing dependencies with UV...")
    try:
        # Use UV to install dependencies with force reinstall to avoid metadata-only issues
        result = subprocess.run(["uv", "pip", "install", "-r", "requirements.txt", "--force-reinstall"],  # nosec B603, B607 - subprocess needed for AWS CLI and agentcore commands
                              capture_output=True, text=True, check=True)
        print("✅ Dependencies installed successfully with UV")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ UV installation failed: {e}")
        print("📋 UV output:", e.stdout)
        print("❌ UV errors:", e.stderr)
        return False

def install_dependencies_with_pip():
    """
    Install dependencies using pip.
    Returns:
        bool: True if installation was successful, False otherwise.
    """
    print("📦 Installing dependencies with pip...")
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],  # nosec B603 - subprocess needed for system commands
                              capture_output=True, text=True, check=True)
        print("✅ Dependencies installed successfully with pip")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Pip installation failed: {e}")
        print("📋 Pip output:", e.stdout)
        print("❌ Pip errors:", e.stderr)
        return False

def install_streamlit_with_uv():
    """
    Install Streamlit specifically using UV with force reinstall.
    Returns:
        bool: True if installation was successful, False otherwise.
    """
    if not check_uv():
        return False
    
    print("🚀 Installing Streamlit with UV (force reinstall)...")
    try:
        result = subprocess.run(["uv", "pip", "install", "streamlit", "--force-reinstall"],  # nosec B603, B607 - subprocess needed for AWS CLI and agentcore commands
                              capture_output=True, text=True, check=True)
        print("✅ Streamlit installed successfully with UV")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ UV Streamlit installation failed: {e}")
        return False

def install_streamlit_with_pip():
    """
    Install Streamlit specifically using pip.
    Returns:
        bool: True if installation was successful, False otherwise.
    """
    print("📦 Installing Streamlit with pip...")
    try:
        result = subprocess.run([sys.executable, "-m", "pip", "install", "streamlit"],  # nosec B603 - subprocess needed for system commands
                              capture_output=True, text=True, check=True)
        print("✅ Streamlit installed successfully with pip")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Pip Streamlit installation failed: {e}")
        return False

def main():
    """
    Launch the Streamlit chatbot app.
    Checks for Streamlit, prints helpful info, and runs the app.
    """
    print("🚀 Starting AWS Pricing Agent Chatbot...")
    print("📝 Make sure you have:")
    print("   - Python virtual environment activated")
    print("   - Dependencies installed")
    print("   - AWS credentials configured (optional)")
    print()
    
    # Check if UV is available
    if check_uv():
        print("✅ UV is available (recommended for faster installations)")
    else:
        print("⚠️  UV not found. Consider installing it for faster dependency management:")
        if platform.system() == "Windows":
            print("   Windows: pip install uv")
            print("   Windows: winget install astral-sh.uv")
        else:
            print("   macOS: brew install uv")
            print("   Linux: pip install uv")
        print()
    
    # Check if streamlit is available
    if not check_streamlit():
        print("❌ Streamlit not found. Installing dependencies...")
        
        # Try UV first, then fallback to pip
        if not install_dependencies_with_uv():
            if not install_dependencies_with_pip():
                print("❌ Failed to install dependencies. Please install manually:")
                print("   pip install -r requirements.txt")
                sys.exit(1)
        
        # Check again after installation
        if not check_streamlit():
            print("❌ Streamlit still not available after dependency installation")
            print("🔄 Trying to install Streamlit specifically...")
            
            # Try to install Streamlit specifically with force reinstall
            if not install_streamlit_with_uv():
                if not install_streamlit_with_pip():
                    print("❌ Failed to install Streamlit. Please install manually:")
                    print("   pip install streamlit")
                    sys.exit(1)
            
            # Final check
            if not check_streamlit():
                print("❌ Streamlit still not available after specific installation")
                sys.exit(1)
    
    print("✅ Streamlit is available")
    
    # Launch Streamlit app
    print("🌐 Opening chatbot in your browser...")
    print("📱 The app will be available at: http://localhost:8501")
    print("🛑 Press Ctrl+C to stop the server")
    print()
    
    try:
        # Get the appropriate command for this platform
        streamlit_cmd = get_streamlit_command()
        
        # Add platform-specific arguments
        if platform.system() == "Windows":
            # Windows-specific settings
            cmd = streamlit_cmd + [
                "--server.port", "8501",
                "--server.address", "localhost",
                "--server.headless", "true"
            ]
        else:
            # Unix-like systems (macOS, Linux)
            cmd = streamlit_cmd + [
                "--server.port", "8501",
                "--server.address", "localhost"
            ]
        
        # Run the Streamlit app
        subprocess.run(cmd)  # nosec B603 - subprocess needed for system commands
        
    except KeyboardInterrupt:
        print("\n👋 Chatbot stopped. Goodbye!")
    except Exception as e:
        print(f"❌ Error starting chatbot: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 