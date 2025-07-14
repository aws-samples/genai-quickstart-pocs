"""
MCP ServiceNow Helpdesk Assistant - Main Entry Point (CLI)

This is the main entry point for the MCP ServiceNow Helpdesk Assistant.
It provides a simple command-line interface and can also launch the Streamlit app.
"""

import sys
import os
from chatbot_agent import chatbot


def cli_interface():
    """Simple command-line interface for testing"""
    print("MCP ServiceNow Helpdesk Assistant - CLI Mode")
    print("=" * 50)
    print("Type 'quit' to exit, 'help' for commands")
    print()
    
    while True:
        try:
            user_input = input("👤 You: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("Goodbye!")
                break
            
            if user_input.lower() == 'help':
                print_help()
                continue
            
            if user_input.lower() == 'trends':
                print("Analyzing trends...")
                response = chatbot.analyze_trends()
                print(f"Assistant: {response}")
                continue
            
            if not user_input:
                continue
            
            print("Assistant: ", end="", flush=True)
            response = chatbot.process_message(user_input)
            print(response)
            print()
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: {str(e)}")


def print_help():
    """Print help information"""
    print("""
📋 Available Commands:
- help: Show this help message
- trends: Show incident trend analysis
- quit/exit/q: Exit the application

💡 Example Questions:
- "Create an incident for email system down"
- "Search for incidents related to VPN"
- "Update incident INC0012345 status to resolved"
- "Show me recent trends"
- "Find solutions for password reset"
- "Search knowledge base for network issues"
""")


def main():
    """Main function"""
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "cli":
            cli_interface()
        elif command == "streamlit":
            print("🚀 Launching Streamlit app...")
            os.system("streamlit run chatbot_app.py")
        elif command == "test":
            print("🧪 Running connection test...")
            test_connection()
        else:
            print(f"Unknown command: {command}")
            print("Available commands: cli, streamlit, test")
    else:
        # Default to CLI mode
        cli_interface()


def test_connection():
    """Test ServiceNow connection"""
    print("Testing ServiceNow MCP connection...")
    
    try:
        # Test connection
        if chatbot.agent:
            print("Chatbot agent initialized successfully")
        else:
            print("Chatbot agent initialization failed")
        
        # Test basic functionality
        response = chatbot.process_message("Hello, can you help me?")
        print(f"Basic response test: {response[:100]}...")
        
        print("Connection test completed successfully!")
        
    except Exception as e:
        print(f"Connection test failed: {str(e)}")


if __name__ == "__main__":
    main() 