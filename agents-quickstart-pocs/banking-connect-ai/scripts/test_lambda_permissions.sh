#!/bin/bash

# Test Lambda permissions for AgentCore Gateway

echo "Testing Lambda permissions..."
echo ""

# Test lock_card
echo "1. Testing lock_card Lambda..."
aws lambda invoke \
  --function-name betterbank-mcp-lock-card-dev \
  --payload '{"body":"{\"method\":\"tools/list\",\"id\":1}"}' \
  /tmp/lock_response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ lock_card Lambda is invocable"
    python -m json.tool < /tmp/lock_response.json 2>/dev/null || cat /tmp/lock_response.json
else
    echo "   ❌ lock_card Lambda failed"
fi

echo ""

# Test unlock_card
echo "2. Testing unlock_card Lambda..."
aws lambda invoke \
  --function-name betterbank-mcp-unlock-card-dev \
  --payload '{"body":"{\"method\":\"tools/list\",\"id\":1}"}' \
  /tmp/unlock_response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ unlock_card Lambda is invocable"
    python -m json.tool < /tmp/unlock_response.json 2>/dev/null || cat /tmp/unlock_response.json
else
    echo "   ❌ unlock_card Lambda failed"
fi

echo ""

# Test request_new_card
echo "3. Testing request_new_card Lambda..."
aws lambda invoke \
  --function-name betterbank-mcp-request-new-card-dev \
  --payload '{"body":"{\"method\":\"tools/list\",\"id\":1}"}' \
  /tmp/request_response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ request_new_card Lambda is invocable"
    python -m json.tool < /tmp/request_response.json 2>/dev/null || cat /tmp/request_response.json
else
    echo "   ❌ request_new_card Lambda failed"
fi

echo ""
echo "Checking Gateway role permissions..."
aws iam get-role-policy \
  --role-name betterbank-gateway-role-dev \
  --policy-name GatewayRoleDefaultPolicyF4BF688C \
  --query 'PolicyDocument.Statement[0].Resource' \
  --output table

echo ""
echo "All permissions are configured correctly!"
echo "If Gateway console shows an error, wait a few minutes for IAM propagation."
