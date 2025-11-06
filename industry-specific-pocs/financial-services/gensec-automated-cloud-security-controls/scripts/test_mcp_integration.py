#!/usr/bin/env python3
"""
Test script for MCP integration and Strands agent
"""
import os
import sys
import json

# Add layers to path for testing
sys.path.insert(0, '../layers/mcp-tools-layer/python')
sys.path.insert(0, '../layers/bedrock-layer/python')

def test_mcp_client():
    """Test MCP client functionality"""
    print("Testing MCP Client...")
    
    try:
        from mcp_tools import get_mcp_client
        
        client = get_mcp_client()
        print(f"✓ MCP client initialized: {type(client)}")
        
        # Test service documentation (mock)
        print("Testing service documentation retrieval...")
        docs = client.get_service_documentation('s3')
        print(f"✓ Service documentation test completed (result: {docs is not None})")
        
        # Test search functionality (mock)
        print("Testing documentation search...")
        search_results = client.search_documentation('S3 bucket policies')
        print(f"✓ Documentation search test completed (result: {search_results is not None})")
        
        return True
        
    except Exception as e:
        print(f"✗ MCP client test failed: {str(e)}")
        return False

def test_bedrock_client():
    """Test Bedrock client with model switching"""
    print("\\nTesting Bedrock Client...")
    
    try:
        from bedrock_client import get_bedrock_client
        
        # Test Claude 4
        print("Testing Claude 4 client...")
        claude_client = get_bedrock_client('claude-4')
        print(f"✓ Claude 4 client initialized: {type(claude_client)}")
        
        # Test Nova Pro
        print("Testing Nova Pro client...")
        nova_client = get_bedrock_client('nova-pro')
        print(f"✓ Nova Pro client initialized: {type(nova_client)}")
        
        return True
        
    except Exception as e:
        print(f"✗ Bedrock client test failed: {str(e)}")
        return False

def test_strands_agent():
    """Test Strands agent configuration"""
    print("\\nTesting Strands Agent Configuration...")
    
    try:
        from bedrock_client import BedrockAgentClient
        
        # Set mock environment variables for testing
        os.environ['STRANDS_AGENT_ID'] = 'test-agent-id'
        os.environ['STRANDS_AGENT_ALIAS_ID'] = 'test-alias-id'
        
        agent_client = BedrockAgentClient('claude-4')
        print(f"✓ Strands agent client initialized: {type(agent_client)}")
        print(f"✓ Agent ID: {agent_client.agent_id}")
        print(f"✓ Agent Alias ID: {agent_client.agent_alias_id}")
        
        return True
        
    except Exception as e:
        print(f"✗ Strands agent test failed: {str(e)}")
        return False

def test_mcp_tools_config():
    """Test MCP tools configuration"""
    print("\\nTesting MCP Tools Configuration...")
    
    try:
        from mcp_tools import get_mcp_tools
        
        tools_config = get_mcp_tools()
        print(f"✓ MCP tools configuration generated")
        print(f"✓ Tools count: {len(tools_config.get('tools', []))}")
        
        # Validate structure
        assert 'toolChoice' in tools_config
        assert 'tools' in tools_config
        assert len(tools_config['tools']) > 0
        
        print("✓ MCP tools configuration structure is valid")
        return True
        
    except Exception as e:
        print(f"✗ MCP tools configuration test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=== MCP Integration and Strands Agent Test Suite ===\\n")
    
    tests = [
        test_mcp_client,
        test_bedrock_client,
        test_strands_agent,
        test_mcp_tools_config
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\\n=== Test Results ===")
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✓ All tests passed!")
        return 0
    else:
        print("✗ Some tests failed!")
        return 1

if __name__ == '__main__':
    sys.exit(main())