# Strands Agent Integration Plan

## Implementation Status

✅ **COMPLETED** - Strands Agent integration has been successfully implemented with transparent lambda function support.

### What Was Implemented

1. **✅ Bedrock Layer Updates**
   - Added `BedrockAgentClient` class to `/layers/bedrock-layer/python/bedrock_client.py`
   - Implemented transparent factory function with `USE_STRANDS_AGENT` environment variable
   - Added session management and agent response parsing
   - Maintained consistent `invoke()` interface

2. **✅ Environment Variables**
   - Added `USE_STRANDS_AGENT=false` to all lambda functions (disabled by default)
   - Added `STRANDS_AGENT_ALIAS_ID=TSTALIASID` configuration
   - All lambda functions now support transparent agent switching

3. **✅ IAM Permissions**
   - Existing `bedrock:*` permissions already cover agent access
   - No additional IAM changes required

4. **✅ Lambda Functions**
   - No code changes required in lambda functions
   - All functions continue using `get_bedrock_client('claude-4')` or `get_bedrock_client('nova-pro')`
   - Model preference passed to agent for internal selection

### How to Enable Strands Agent

**Option 1: Environment Variable (Recommended)**
Set `USE_STRANDS_AGENT=true` in CDK stack and redeploy:
```typescript
USE_STRANDS_AGENT: 'true', // Enable Strands Agent
```

**Option 2: Runtime Toggle**
Change environment variable in AWS Console without redeployment.

### Current State
- **Agent Integration**: ✅ Complete and ready
- **Default Mode**: Direct model invocation (`USE_STRANDS_AGENT=false`)
- **Agent Mode**: Available via environment variable toggle
- **Model Preferences**: Preserved and passed to agent
- **Rollback**: Instant via environment variable

## Implementation Status

This document outlines the plan to integrate Strands Agent (YWZMJLEXED) into the security configuration system, replacing direct Bedrock model invocation with agent-based processing.

## Current Architecture

### Bedrock Layer Structure
- **Location**: `/layers/bedrock-layer/python/bedrock_client.py`
- **Client Type**: Direct model invocation using `bedrock-runtime`
- **Models**: Claude-4 (primary), Nova Pro (secondary)
- **Usage Pattern**: `bedrock_client = get_bedrock_client('claude-4')`

### Lambda Functions Using Bedrock
- AWSServiceDocumentationManager
- AnalyzeSecurityRequirements
- GenerateSecurityControls
- GenerateIaCTemplate
- GenerateIAMModel
- GenerateServiceProfile

All functions use consistent pattern:
```python
from bedrock_client import get_bedrock_client
bedrock_client = get_bedrock_client('claude-4')
response = bedrock_client.invoke(prompt)
```

## Integration Plan

### Phase 1: Add Agent Support to Bedrock Layer

#### 1.1 Add Agent Client Class
```python
# In /layers/bedrock-layer/python/bedrock_client.py

class BedrockAgentClient:
    def __init__(self, model_type='claude-4'):
        self.bedrock_agent = boto3.client('bedrock-agent-runtime')
        self.agent_id = 'YWZMJLEXED'
        self.agent_alias_id = os.environ.get('STRANDS_AGENT_ALIAS_ID', 'TSTALIASID')
        self.model_type = model_type  # Pass model preference to agent
    
    def invoke(self, prompt, session_id=None):
        """Invoke Strands Agent with model preference"""
        if isinstance(prompt, dict):
            prompt_text = prompt.get("prompt", str(prompt))
        else:
            prompt_text = str(prompt)
        
        # Include model preference in prompt or session attributes
        enhanced_prompt = f"[Model: {self.model_type}] {prompt_text}"
        
        if not session_id:
            session_id = f"session-{int(time.time())}"
        
        try:
            response = self.bedrock_agent.invoke_agent(
                agentId=self.agent_id,
                agentAliasId=self.agent_alias_id,
                sessionId=session_id,
                inputText=enhanced_prompt
            )
            
            return self._extract_agent_response(response)
            
        except Exception as e:
            logger.error(f"Error invoking Strands Agent: {str(e)}")
            raise
    
    def _extract_agent_response(self, response):
        """Extract text from agent response stream"""
        # Implementation depends on agent response format
        pass
```

#### 1.2 Update Factory Function (Transparent Integration)
```python
def get_bedrock_client(model_type='claude-4'):
    """Factory function - transparent agent integration"""
    # Check if Strands Agent should be used (via environment variable)
    use_strands_agent = os.environ.get('USE_STRANDS_AGENT', 'false').lower() == 'true'
    
    if use_strands_agent:
        return BedrockAgentClient(model_type)  # Agent with model preference
    else:
        return BedrockClient(model_type)       # Direct model invocation
```

### Phase 2: Environment Configuration

#### 2.1 Add Environment Variables
```typescript
// In CDK stack
const lambdaEnvironment = {
  // Existing variables...
  USE_STRANDS_AGENT: 'true',           // Toggle agent vs direct models
  STRANDS_AGENT_ALIAS_ID: 'TSTALIASID', // Agent alias ID
};
```

#### 2.2 Update IAM Permissions
```typescript
// Add to lambda execution roles
new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'bedrock:InvokeAgent',
    'bedrock:GetAgent',
    'bedrock:GetAgentAlias'
  ],
  resources: [
    `arn:aws:bedrock:${region}:${account}:agent/YWZMJLEXED`,
    `arn:aws:bedrock:${region}:${account}:agent-alias/YWZMJLEXED/*`
  ]
})
```

### Phase 3: Lambda Function Updates

#### 3.1 No Changes Required (Transparent Integration)
Lambda functions continue using existing pattern:
```python
# No changes needed - transparent integration
bedrock_client = get_bedrock_client('claude-4')  # Agent receives model preference
bedrock_client = get_bedrock_client('nova-pro')  # Agent receives model preference
```

#### 3.2 Control via Environment Variable
- Set `USE_STRANDS_AGENT=true` → All functions use Strands Agent with model preferences
- Set `USE_STRANDS_AGENT=false` → All functions use direct model invocation
- Model parameter (`claude-4`, `nova-pro`) passed to agent for model selection

## Implementation Strategy

### Rollout Approach
1. **Test Environment**: Deploy with `USE_STRANDS_AGENT=false` first
2. **Agent Activation**: Change `USE_STRANDS_AGENT=true` to enable agent
3. **Model Testing**: Test different model preferences (`claude-4`, `nova-pro`)
4. **Rollback Plan**: Set `USE_STRANDS_AGENT=false` for immediate rollback

### Testing Strategy
1. **Unit Tests**: Test agent client with mock responses
2. **Integration Tests**: Test with actual Strands Agent
3. **Performance Tests**: Compare response times vs direct models
4. **Accuracy Tests**: Compare output quality vs direct models

### Monitoring Points
- Agent response times
- Session management effectiveness
- Error rates compared to direct models
- Output quality metrics

## Benefits

### Advantages of Agent Integration
1. **Specialized Knowledge**: Agent may have domain-specific training for AWS documentation
2. **Consistent Results**: Agent provides more consistent extraction results
3. **Context Retention**: Agent can maintain context across multiple extractions
4. **Optimized Prompts**: Agent has pre-optimized prompts for AWS documentation parsing

### Architecture Benefits
1. **Transparent Integration**: No lambda function changes required
2. **Environment-Controlled**: Single environment variable controls agent usage
3. **Model Preference Preserved**: Agent receives model preference from lambda calls
4. **Easy Switching**: Toggle between agent and direct models via environment variable

## Risks and Mitigation

### Potential Risks
1. **Agent Availability**: Agent service may have different availability characteristics
2. **Session Limits**: Agent may have session or concurrency limits
3. **Response Format**: Agent response format may differ from direct models
4. **Performance**: Agent may be slower than direct model invocation

### Mitigation Strategies
1. **Fallback Mechanism**: Implement fallback to direct models if agent fails
2. **Session Management**: Implement proper session cleanup and rotation
3. **Response Parsing**: Robust response parsing with error handling
4. **Performance Monitoring**: Monitor and alert on performance degradation

## Success Criteria

### Technical Metrics
- Agent integration completes without breaking existing functionality
- Response times within 20% of current direct model performance
- Error rates remain below 5%
- All existing tests pass with agent implementation

### Quality Metrics
- Output accuracy matches or exceeds direct model results
- JSON parsing success rate remains above 95%
- Documentation extraction completeness maintained

## Timeline

### Phase 1: Development (1-2 days)
- Implement BedrockAgentClient class
- Add environment variable support
- Update factory function

### Phase 2: Testing (1-2 days)
- Unit tests for agent client
- Integration testing with Strands Agent
- Performance benchmarking

### Phase 3: Deployment (1 day)
- Deploy to test environment
- Gradual rollout to production
- Monitor and validate results

## Rollback Plan

### Quick Rollback
Set environment variable:
```bash
USE_STRANDS_AGENT=false  # Immediate rollback to direct models
```

### Full Rollback
1. Set `USE_STRANDS_AGENT=false` in CDK stack
2. Remove agent permissions from IAM roles (optional)
3. Redeploy infrastructure

## Conclusion

The current architecture with centralized Bedrock layer makes Strands Agent integration straightforward and low-risk. The consistent interface pattern allows for easy switching between agent and direct model implementations, providing flexibility for testing and rollback scenarios.
