"""
Test script for MCP ServiceNow Helpdesk Assistant

This script tests the basic functionality of the chatbot components.
"""

import sys
import os

def test_imports():
    """Test if all required modules can be imported"""
    print("🧪 Testing imports...")
    
    try:
        from config import SERVICENOW_MCP_CONFIG, AGENT_CONFIG
        print("✅ Config imported successfully")
    except Exception as e:
        print(f"❌ Config import failed: {e}")
        return False
    
    try:
        from servicenow_tools import servicenow_tools
        print("✅ ServiceNow tools imported successfully")
    except Exception as e:
        print(f"❌ ServiceNow tools import failed: {e}")
        return False
    
    try:
        from chatbot_agent import chatbot
        print("✅ Chatbot agent imported successfully")
    except Exception as e:
        print(f"❌ Chatbot agent import failed: {e}")
        return False
    
    return True


def test_config():
    """Test configuration settings"""
    print("\n🔧 Testing configuration...")
    
    from config import SERVICENOW_MCP_CONFIG, AGENT_CONFIG, CHATBOT_CONFIG
    
    # Check ServiceNow config
    required_keys = ["command", "args", "env"]
    for key in required_keys:
        if key not in SERVICENOW_MCP_CONFIG:
            print(f"❌ Missing ServiceNow config key: {key}")
            return False
    
    # Check agent config
    required_agent_keys = ["max_tokens", "budget_tokens", "model_id"]
    for key in required_agent_keys:
        if key not in AGENT_CONFIG:
            print(f"❌ Missing agent config key: {key}")
            return False
    
    print("✅ Configuration looks good")
    return True


def test_servicenow_tools():
    """Test ServiceNow tools functionality"""
    print("\n🛠️ Testing ServiceNow tools...")
    
    from servicenow_tools import servicenow_tools
    
    try:
        # Test connection (will be simulated in demo mode)
        connected = servicenow_tools.connect()
        print(f"✅ ServiceNow tools connection: {'Connected' if connected else 'Simulated'}")
        
        # Test create incident (simulated)
        result = servicenow_tools.create_incident(
            "Test incident",
            "This is a test incident",
            "Test Category",
            "Medium"
        )
        
        if result["success"]:
            print("✅ Create incident test passed")
        else:
            print(f"❌ Create incident test failed: {result.get('error', 'Unknown error')}")
            return False
        
        # Test search incidents (simulated)
        result = servicenow_tools.search_incidents("test", 5)
        
        if result["success"]:
            print("✅ Search incidents test passed")
        else:
            print(f"❌ Search incidents test failed: {result.get('error', 'Unknown error')}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ ServiceNow tools test failed: {e}")
        return False


def test_chatbot_agent():
    """Test chatbot agent functionality"""
    print("\n🤖 Testing chatbot agent...")
    
    from chatbot_agent import chatbot
    
    try:
        # Test basic response
        response = chatbot.process_message("Hello, can you help me?")
        
        if response and len(response) > 0:
            print("✅ Basic chatbot response test passed")
            print(f"   Response: {response[:100]}...")
        else:
            print("❌ Basic chatbot response test failed")
            return False
        
        # Test trends analysis
        trends = chatbot.analyze_trends()
        
        if trends and len(trends) > 0:
            print("✅ Trends analysis test passed")
            print(f"   Analysis: {trends[:100]}...")
        else:
            print("❌ Trends analysis test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Chatbot agent test failed: {e}")
        return False


def test_streamlit_import():
    """Test if Streamlit can be imported"""
    print("\n📱 Testing Streamlit import...")
    
    try:
        import streamlit as st
        print("✅ Streamlit imported successfully")
        return True
    except Exception as e:
        print(f"❌ Streamlit import failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\ud83d\ude80 MCP ServiceNow Helpdesk Assistant - Setup Test")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Configuration", test_config),
        ("ServiceNow Tools", test_servicenow_tools),
        ("Chatbot Agent", test_chatbot_agent),
        ("Streamlit", test_streamlit_import)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"❌ {test_name} test failed")
        except Exception as e:
            print(f"❌ {test_name} test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The chatbot is ready to use.")
        print("\n🚀 Next steps:")
        print("1. Run 'python main.py streamlit' to start the web interface")
        print("2. Run 'python main.py cli' to start the command line interface")
        print("3. Run 'python main.py test' to test the connection")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure all dependencies are installed: pip install -r requirements.txt")
        print("2. Check your environment variables in the 'env' file")
        print("3. Verify ServiceNow MCP server configuration")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 