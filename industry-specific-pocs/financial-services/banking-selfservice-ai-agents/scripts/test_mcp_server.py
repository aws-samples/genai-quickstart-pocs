"""Test script for MCP server"""
import json
import sys
import os
import asyncio

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.mcp_server.server import handle_list_tools, handle_call_tool


async def test_lock_card():
    """Test lock_card tool"""
    print("\n=== Testing MCP Tool: lock_card ===")
    
    result = await handle_call_tool(
        name="lock_card",
        arguments={
            "customer_id": "CUST001",
            "card_id": "CARD001"
        }
    )
    
    response = json.loads(result[0].text)
    print(f"Response: {json.dumps(response, indent=2)}")
    return response.get("success", False)


async def test_unlock_card():
    """Test unlock_card tool"""
    print("\n=== Testing MCP Tool: unlock_card ===")
    
    result = await handle_call_tool(
        name="unlock_card",
        arguments={
            "customer_id": "CUST001",
            "card_id": "CARD001"
        }
    )
    
    response = json.loads(result[0].text)
    print(f"Response: {json.dumps(response, indent=2)}")
    return response.get("success", False)


async def test_request_new_card():
    """Test request_new_card tool"""
    print("\n=== Testing MCP Tool: request_new_card ===")
    
    result = await handle_call_tool(
        name="request_new_card",
        arguments={
            "customer_id": "CUST001",
            "account_id": "ACC001",
            "reason": "Lost card",
            "delivery_address": "123 Main St, Cincinnati, OH 45202"
        }
    )
    
    response = json.loads(result[0].text)
    print(f"Response: {json.dumps(response, indent=2)}")
    return response.get("success", False)


async def test_unauthorized_access():
    """Test unauthorized access through MCP"""
    print("\n=== Testing MCP Tool: Unauthorized Access ===")
    
    result = await handle_call_tool(
        name="lock_card",
        arguments={
            "customer_id": "CUST002",  # Wrong customer
            "card_id": "CARD001"  # Belongs to CUST001
        }
    )
    
    response = json.loads(result[0].text)
    print(f"Response: {json.dumps(response, indent=2)}")
    return not response.get("success", True)  # Should fail


async def test_list_tools():
    """Test listing available tools"""
    print("\n=== Testing MCP: List Tools ===")
    
    tools = await handle_list_tools()
    
    print(f"Available tools: {len(tools)}")
    for tool in tools:
        print(f"  - {tool.name}: {tool.description[:60]}...")
    
    return len(tools) == 3


async def main():
    """Run all MCP tests"""
    print("=" * 60)
    print("MCP Server Testing for Card Operations")
    print("=" * 60)
    print("\nNote: Make sure DynamoDB tables are created and seeded!")
    print("Run: python scripts/create_tables.py")
    print("Run: python scripts/seed_data.py")
    
    results = []
    
    # Run tests
    results.append(("List Tools", await test_list_tools()))
    results.append(("Lock Card", await test_lock_card()))
    results.append(("Unlock Card", await test_unlock_card()))
    results.append(("Request New Card", await test_request_new_card()))
    results.append(("Unauthorized Access", await test_unauthorized_access()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(result[1] for result in results)
    print("\n" + ("✓ All MCP tests passed!" if all_passed else "✗ Some tests failed"))


if __name__ == '__main__':
    asyncio.run(main())
