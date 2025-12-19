# ⚠️ CRITICAL: Agent vs Backend Dockerfiles

## DO NOT CONFUSE THESE TWO CONTAINERS

### 1. **Agent Container** (Python - AgentCore)
- **File**: `Dockerfile` (required by AgentCore)
- **Purpose**: Bedrock AgentCore runtime
- **Base**: `public.ecr.aws/docker/library/python:3.11-slim`
- **Runs**: `bank_iq_agent_v1.py`
- **Port**: 8080 (AgentCore requirement)
- **Deployed by**: `agentcore launch` command
- **DO NOT MODIFY** without redeploying agent

### 2. **Backend Container** (Node.js - ECS)
- **File**: `Dockerfile.backend`
- **Purpose**: Express API server
- **Base**: `public.ecr.aws/docker/library/node:18-alpine`
- **Runs**: `server.js`
- **Port**: 3001
- **Deployed by**: Docker build + ECR push + ECS update

## What Went Wrong Before

AgentCore's CodeBuild found wrong Dockerfile and built Node.js backend instead of the Python agent. This caused health check failures because:
- AgentCore expected Python agent with `/ping` and `/invocations` endpoints
- Got Node.js Express server instead
- Container couldn't respond to health checks

## Rules

1. **`Dockerfile`** = Agent only (Python) - AgentCore requires this exact name
2. **`Dockerfile.backend`** = Backend only (Node.js)
3. Never rename `Dockerfile` - AgentCore buildspec hardcodes it
4. Always use `public.ecr.aws/docker/library/*` images (no Docker Hub rate limits)
5. Always set `region_name='us-east-1'` in boto3 clients

## Current Working Agent

- **ARN**: `arn:aws:bedrock-agentcore:us-east-1:164543933824:runtime/bank_iq_agent_v1-f98stM8Sv9`
- **Status**: ✅ Working
- **Test**: `agentcore invoke '{"prompt": "Hello"}'`
