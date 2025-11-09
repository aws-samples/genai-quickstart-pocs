# Centralized Bedrock Client Layer

This Lambda layer provides a centralized Bedrock client that standardizes model invocation across all Lambda functions in the security configuration system.

## Features

### 1. Model Switching
- **Easy model switching**: Change `DEFAULT_MODEL` constant to switch between models
- **Supported models**: Nova Pro, Claude 3.5 Sonnet, and Claude 4
- **Model-specific configurations**: Each model has its own token limits and request formats

### 2. Comprehensive Logging
- **Full prompt logging**: Complete prompts are logged (no truncation)
- **Model identification**: Logs show which model and model ID is being used
- **Full response logging**: Complete responses are logged (no truncation)
- **Extracted content logging**: Final extracted content is logged

### 3. Token Limit Validation
- **Pre-validation**: Prompts are validated against model token limits before sending
- **Model-aware limits**: Each model has its specific token limits configured
- **Exception handling**: Clear error messages when prompts exceed limits

### 4. Retry Logic
- **Exponential backoff**: Built-in retry logic with exponential backoff
- **Throttling handling**: Automatic retry on throttling exceptions
- **Error categorization**: Different handling for validation, access, and throttling errors

## Usage

### Basic Usage

```python
from bedrock_client import get_bedrock_client

# Get client with default model (Nova Pro)
client = get_bedrock_client()
response = client.invoke("Your prompt here")

# Get client with specific model
claude_client = get_bedrock_client('claude')
response = claude_client.invoke("Your prompt here")
```

### Legacy Compatibility

```python
from bedrock_client import invoke_bedrock_agent

# This function maintains backward compatibility
response = invoke_bedrock_agent({"prompt": "Your prompt here"})
```

## Model Configuration

### Current Models

1. **Nova Pro** (`nova-pro`)
   - Model ID: `us.amazon.nova-pro-v1:0`
   - Max tokens: 10,240
   - Default model

2. **Claude 3.5 Sonnet** (`claude`)
   - Model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
   - Max tokens: 200,000

3. **Claude 4** (`claude-4`)
   - Model ID: `us.anthropic.claude-4-0-20250101-v1:0`
   - Max tokens: 200,000

### Switching Models

To switch the default model system-wide:

1. Edit `layers/bedrock-layer/bedrock_client.py`
2. Change the `DEFAULT_MODEL` constant:
   ```python
   DEFAULT_MODEL = 'claude'  # or 'nova-pro'
   ```
3. Redeploy the layer

## Implementation Details

### Token Limit Management
- Estimates tokens using 1 token ≈ 4 characters
- Reserves 20% of model limit for response
- Validates prompts before sending to avoid API errors

### Request Format Handling
- **Nova Pro**: Uses `messages-v1` schema with `inferenceConfig`
- **Claude**: Uses `anthropic_version` with direct message format
- Automatic format selection based on model

### Response Extraction
- Model-specific response parsing
- Handles different response structures automatically
- Comprehensive error logging for debugging

### Error Handling
- **ValidationException**: Model configuration or access issues
- **AccessDeniedException**: IAM permission issues
- **ThrottlingException**: Rate limiting with automatic retry
- **ValueError**: Token limit or response parsing issues

## Logging Output

The client provides detailed logging at each step:

```
================================================================================
BEDROCK INVOCATION - Model: nova-pro
Model ID: us.amazon.nova-pro-v1:0
================================================================================
PROMPT:
[Full prompt content here - no truncation]
================================================================================
BEDROCK RESPONSE:
[Full JSON response - no truncation]
================================================================================
EXTRACTED CONTENT:
[Final extracted text content - no truncation]
================================================================================
```

## Testing

Run the test suite to validate functionality:

```bash
cd layers/bedrock-layer
python test_bedrock_client.py
```

Tests cover:
- Model switching
- Token validation
- Request body creation
- Error handling

## Deployment

1. **Build the layer**:
   ```bash
   ./scripts/deploy-bedrock-layer.sh
   ```

2. **Deploy with CDK**:
   ```bash
   cd cdk
   npm run build
   cdk deploy
   ```

## Migration from Old Code

### Before (in each Lambda function)
```python
# Duplicated Bedrock client code
bedrock = boto3.client('bedrock-runtime')
MODEL_ID = 'amazon.nova-pro-v1:0'

def invoke_bedrock_agent(prompt):
    # 100+ lines of duplicated code
    # Manual retry logic
    # Manual response parsing
    # Limited logging
```

### After (using centralized layer)
```python
from bedrock_client import get_bedrock_client

# Single line initialization
bedrock_client = get_bedrock_client('nova-pro')

def invoke_bedrock_agent(prompt):
    # Simple delegation to centralized client
    prompt_text = prompt.get("prompt") if isinstance(prompt, dict) else prompt
    return bedrock_client.invoke(prompt_text)
```

## Benefits

1. **Centralized Management**: Single place to manage Bedrock invocation logic
2. **Easy Model Switching**: Change one constant to switch models system-wide
3. **Comprehensive Logging**: Full visibility into prompts, responses, and model usage
4. **Token Safety**: Automatic validation prevents API errors
5. **Consistent Error Handling**: Standardized error handling across all functions
6. **Reduced Code Duplication**: Eliminates 100+ lines of duplicated code per function
7. **Better Maintainability**: Updates to Bedrock logic only need to be made in one place
