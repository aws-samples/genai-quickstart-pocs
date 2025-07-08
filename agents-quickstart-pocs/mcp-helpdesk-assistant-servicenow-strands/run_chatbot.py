#!/usr/bin/env python3
"""
Quick start script for MCP ServiceNow Helpdesk Assistant

This script provides an easy way to start the chatbot with different options.
"""

import sys
import os
import subprocess

def print_banner():
    """Print the application banner"""
    print("""
🛠️  MCP ServiceNow Helpdesk Assistant
=====================================
A modern chatbot interface for incident management
Powered by Strands Agents & MCP

Choose an option:
1. 🚀 Launch Streamlit Web Interface (Recommended)
2. 💻 Launch Command Line Interface
3. 🧪 Run Setup Tests
4. 📊 Test Connection
5. ❌ Exit
""")

def run_streamlit():
    """Launch the Streamlit web interface"""
    print("🚀 Launching Streamlit web interface...")
    print("📱 The app will open in your browser at http://localhost:8501")
    print("⏹️  Press Ctrl+C to stop the server")
    print()
    
    try:
        subprocess.run([sys.executable, "-m", "streamlit", "run", "chatbot_app.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Streamlit server stopped.")
    except Exception as e:
        print(f"❌ Error launching Streamlit: {e}")
        print("💡 Make sure Streamlit is installed: pip install streamlit")

def run_cli():
    """Launch the command line interface"""
    print("💻 Launching command line interface...")
    print("💡 Type 'help' for available commands, 'quit' to exit")
    print()
    
    try:
        subprocess.run([sys.executable, "main.py", "cli"], check=True)
    except KeyboardInterrupt:
        print("\n👋 CLI stopped.")
    except Exception as e:
        print(f"❌ Error launching CLI: {e}")

def run_tests():
    """Run setup tests"""
    print("🧪 Running setup tests...")
    print()
    
    try:
        subprocess.run([sys.executable, "test_setup.py"], check=True)
    except Exception as e:
        print(f"❌ Error running tests: {e}")

def test_connection():
    """Test the connection"""
    print("📊 Testing connection...")
    print()
    
    try:
        subprocess.run([sys.executable, "main.py", "test"], check=True)
    except Exception as e:
        print(f"❌ Error testing connection: {e}")

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    required_packages = [
        "streamlit",
        "strands-agents", 
        "strands-agents-tools",
        "mcp",
        "python-dotenv"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Missing packages: {', '.join(missing_packages)}")
        print("💡 Install missing packages: pip install -r requirements.txt")
        return False
    else:
        print("✅ All required packages are installed")
        return True

def main():
    """Main function"""
    print_banner()
    
    # Check dependencies first
    if not check_dependencies():
        print("\n⚠️  Please install missing dependencies before continuing.")
        return
    
    while True:
        try:
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == "1":
                run_streamlit()
                break
            elif choice == "2":
                run_cli()
                break
            elif choice == "3":
                run_tests()
                break
            elif choice == "4":
                test_connection()
                break
            elif choice == "5":
                print("👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 