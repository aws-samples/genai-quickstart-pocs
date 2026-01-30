#!/bin/bash

echo "=========================================="
echo "BankIQ+ Agent Diagnostics"
echo "=========================================="
echo ""

# 1. Check if agent is deployed
echo "1. Checking AgentCore agent status..."
cd "$(dirname "$0")"
if [ -f ".bedrock_agentcore.yaml" ]; then
    AGENT_ARN=$(grep "agent_arn:" .bedrock_agentcore.yaml | sed 's/.*agent_arn: *\(.*\)/\1/')
    echo "   Agent ARN from config: $AGENT_ARN"
    
    if command -v agentcore &> /dev/null; then
        echo ""
        echo "   AgentCore CLI status:"
        agentcore status 2>&1 | head -20
    else
        echo "   ⚠️  AgentCore CLI not found"
    fi
else
    echo "   ❌ .bedrock_agentcore.yaml not found"
fi

echo ""
echo "2. Checking backend ECS task configuration..."
BACKEND_ARN=$(aws ecs describe-task-definition \
  --task-definition bankiq-backend \
  --query 'taskDefinition.containerDefinitions[0].environment[?name==`AGENTCORE_AGENT_ARN`].value' \
  --output text 2>/dev/null)

if [ -n "$BACKEND_ARN" ]; then
    echo "   Backend Agent ARN: $BACKEND_ARN"
    
    if [ "$AGENT_ARN" = "$BACKEND_ARN" ]; then
        echo "   ✅ Agent ARNs match"
    else
        echo "   ❌ Agent ARNs DO NOT MATCH!"
        echo "      Config:  $AGENT_ARN"
        echo "      Backend: $BACKEND_ARN"
    fi
else
    echo "   ❌ Could not retrieve backend agent ARN"
fi

echo ""
echo "3. Checking recent backend logs..."
echo "   (Last 20 lines with errors):"
aws logs tail /ecs/bankiq-backend --since 5m --region us-east-1 2>/dev/null | grep -i "error\|fail\|exception" | tail -20

echo ""
echo "4. Checking ECS task status..."
TASK_ARN=$(aws ecs list-tasks --cluster bankiq-cluster --service-name bankiq-backend-service --query 'taskArns[0]' --output text 2>/dev/null)
if [ -n "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
    echo "   Task ARN: $TASK_ARN"
    TASK_STATUS=$(aws ecs describe-tasks --cluster bankiq-cluster --tasks $TASK_ARN --query 'tasks[0].lastStatus' --output text 2>/dev/null)
    echo "   Task Status: $TASK_STATUS"
else
    echo "   ❌ No running tasks found"
fi

echo ""
echo "5. Testing agent invocation..."
if [ -n "$AGENT_ARN" ]; then
    echo "   Attempting to invoke agent..."
    # This will fail if permissions are wrong
    aws bedrock-agent-runtime invoke-agent \
        --agent-id $(echo $AGENT_ARN | cut -d'/' -f2) \
        --agent-alias-id TSTALIASID \
        --session-id test-session-123 \
        --input-text "Hello" \
        --region us-east-1 2>&1 | head -5
else
    echo "   ⚠️  Skipping - no agent ARN found"
fi

echo ""
echo "=========================================="
echo "Diagnostics Complete"
echo "=========================================="
