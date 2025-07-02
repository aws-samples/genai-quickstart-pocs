# Amazon Bedrock Agentic Text-to-Speech

## Overview

This PoC demonstrates how to combine Amazon Bedrock agents with text-to-speech capabilities to create an intelligent document summarization and audio generation system. The solution uses agentic-powered RAG to identify relevant policies, disclaimers, and instructions from an internal knowledge base, then leverages large language models to create concise summaries that can be converted to professional-grade audio.

### Use Cases

- **Compliance Requirements**: Industries with strict compliance requirements can provide audible information and confirmations to customers for documentation purposes
- **Hands-Free Operations**: Customer service representatives can access information without manual interaction when multitasking or when hands are occupied
- **Consistent Communication**: Ensures policies, disclaimers, and instructions are delivered consistently and professionally across all customer interactions, maintaining brand voice and improving customer experience


![Amazon Bedrock Agentic Text to Speech](agentic_tts.gif)


## Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with access to Amazon Bedrock
- [Python](https://www.python.org/downloads/) v3.11 or greater
- AWS account with appropriate permissions for Bedrock, Lambda, S3, and Polly services 



## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aws-samples/genai-quickstart-pocs.git
cd genai-quickstart-pocs/genai-quickstart-pocs-python/amazon-bedrock-agent-text-to-speech-poc
```

### Project Structure

- `streamlit_app/` - Streamlit application with agent invocation and text-to-speech logic
- `agent/` - Lambda function and schema definitions for the Bedrock Agent
- `cnf/` - CloudFormation template for EC2 server hosting
- `sample_data/` - Sample knowledge base data


### 2. Configure Lambda Function

Create a Lambda function using the code from `agent/ActionLambda.py`:

#### Resource-Based Policy
Add the following resource-based policy to allow Bedrock Agent access:

```json
{
  "ArnLike": {
    "AWS:SourceArn": "arn:aws:bedrock:<AWS-Region>:<AWS-Account-ID>:agent/*"
  }
}
```

#### Execution Role Permissions
Ensure the Lambda execution role includes:
- Amazon S3 access permissions
- Amazon Polly access permissions  
- CloudWatch Logs permissions

### 3. Setup Amazon Bedrock Agent

#### Create the Agent
1. **Model Selection**: Choose Claude 3.5 Haiku
2. **Agent Instructions**: Use the following prompt:

```
You are an intelligent agent designed to assist customer service representatives with accurate information retrieval, document summarization, and speech synthesis.

Follow these steps:

1. Document Research and Summarization:
   - Conduct detailed research to gather relevant information
   - If "Annual Report" is mentioned, retrieve information from the knowledge base first
   - Provide concise, accurate summaries
   - If no information is available, respond with "Information is not available"

2. Speech Synthesis:
   - When users request audio output, use the synthesis tools
   - Include the file name and S3 presigned URL in the response
   - Format URLs with XML tags: <url>COMPLETE_S3_URL</url>
   
Example response:
"I've generated an audio file with the summary. The audio file [filename] is available at: <url>[Complete S3 presigned URL]</url>"
```

#### Configure Action Group
- Use the API schema from `agent/ActionSchema.json`
- Link to the Lambda function created in step 2
- Create a Bedrock Knowledge Base using the provided sample data

### 4. Deploy and Configure Streamlit Application

#### Option A: Deploy on EC2 (Recommended for Production)
1. Deploy the CloudFormation template: `cnf/ec2-streamlit-template.yaml`

2. Update the configuration with your agent details:
   ```bash
   sudo vi app/streamlit_app/invoke_agent.py
   ```
   Update: `agentId`, `agentAliasId`, and `region`

3. Start the application:
   ```bash
   streamlit run app.py
   ```

#### Option B: Run Locally
1. Navigate to the streamlit app directory:
   ```bash
   cd streamlit_app
   ```

2. Create and activate virtual environment:
   ```bash
   python -m venv .env
   source .env/bin/activate  
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Update configuration in `invoke_agent.py` with your agent details

5. Start the application:
   ```bash
   streamlit run app.py
   ```

The application will open in your default browser. 

## Architecture Diagram
![Architecture Overview](agentic_tts_architecture.png)

