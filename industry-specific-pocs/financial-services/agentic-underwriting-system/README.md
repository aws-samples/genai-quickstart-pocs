# Agentic Underwriting System With AgentCore

This repository contains hands-on tutorials for building an agentic underwriting system for life insurance applications using Amazon Bedrock AgentCore. The system uses AI agents built with the Strands framework to analyze insurance applications, detect medical impairments, and calculate risk scores.

## What This Demonstrates

This repository shows how AI agents built with Amazon Bedrock AgentCore and the Strands framework can:

1. **Ground decisions in policy** by creating a searchable Knowledge Base from underwriting manuals
2. **Detect medical impairments** by analyzing multiple data sources (applications, prescription history, lab results, MIB records)
3. **Calculate risk scores** by consulting underwriting guidelines and applying rating tables
4. **Generate audit trails** with detailed explanations and citations for each decision
5. **Deploy to production** using Amazon Bedrock AgentCore Runtime for scalable, serverless execution

The notebooks demonstrate a complete end-to-end workflow from infrastructure setup to deployed, production-ready agents.

## How to Use This Repository

The entire project is contained in three interactive notebooks with extensive documentation:

### Lab 1: Knowledge Base Setup (`agentcore_examples/01_kb_setup.ipynb`)
**What it does:** Creates a Bedrock Knowledge Base containing your underwriting manual for policy grounding.

Open this notebook first to:
- Upload underwriting manual documents to S3
- Create a Bedrock Knowledge Base with OpenSearch Serverless vector store
- Configure and sync a data source from S3
- Test retrieval using Bedrock's Retrieve and RetrieveAndGenerate APIs
- Persist Knowledge Base identifiers for use in later labs

**Key concepts:** RAG (Retrieval Augmented Generation), vector embeddings, semantic search, contextual grounding

### Lab 2: Impairment Detection Agent (`agentcore_examples/02_impairment_agent.ipynb`)
**What it does:** Builds and deploys an agent that analyzes data sources to identify medical impairments and extract scoring factors.

Open this notebook to see how the agent:
- Scans extracted data from applications, RX history, labs, and MIB
- Uses semantic search to find relevant underwriting guidelines from the Knowledge Base
- Identifies impairments and compiles evidence from multiple sources with page references
- Outputs structured JSON with impairment IDs, scoring factors, evidence, and KB citations
- Deploys to Amazon Bedrock AgentCore Runtime for production use

**Try changing:** The `extracted_data` variable to test different clinical scenarios

### Lab 3: Scoring Agent (`agentcore_examples/03_scoring_agent.ipynb`)
**What it does:** Builds and deploys an agent that calculates risk scores by applying underwriting rules to detected impairments.

Open this notebook to see how the agent:
- Looks up rating tables for each impairment from the Knowledge Base
- Applies scoring factors to determine debits and credits
- Uses a calculator tool for exact arithmetic (no "creative math")
- Generates detailed explanations with citations for audit trails
- Deploys to Amazon Bedrock AgentCore Runtime for production use

**Try changing:** The `sample_impairments` variable to test different risk profiles (e.g., higher blood pressure, additional complications)

### Quick Start

```bash
# Prerequisites: AWS account with Bedrock access
# Enable Claude 3.7 Sonnet and Titan Text Embeddings V2 in Bedrock console

# Install dependencies (run in each notebook)
%pip install boto3 strands-agents bedrock-agentcore bedrock-agentcore-starter-toolkit python-dotenv

# Launch Jupyter notebook
jupyter notebook

# Complete labs in order:
# 1. Open agentcore_examples/01_kb_setup.ipynb and run all cells
# 2. Open agentcore_examples/02_impairment_agent.ipynb and run all cells
# 3. Open agentcore_examples/03_scoring_agent.ipynb and run all cells
```

## Repository Structure

```
agentic_underwriting/
├── agentcore_examples/
│   ├── 01_kb_setup.ipynb              # Lab 1: Knowledge Base creation
│   ├── 02_impairment_agent.ipynb      # Lab 2: Detection agent
│   └── 03_scoring_agent.ipynb         # Lab 3: Scoring agent
├── mock_data/
│   ├── diabetes_cardiovascular/       # Complex test case
│   │   ├── mock_application.json
│   │   ├── mock_intelliscript_rx.json
│   │   ├── mock_lab_results.json
│   │   ├── mock_mib_response.json
│   │   └── mock_rx_data.json
│   └── hypertension/                  # Simpler test case
│       ├── mock_application.json
│       ├── mock_intelliscript_rx.json
│       ├── mock_lab_results.json
│       └── mock_mib_response.json
└── underwriting-manual/
    ├── 1-foundations/                 # Core underwriting principles
    ├── 2-non-medical-factors/         # Lifestyle, occupation, travel
    ├── 3-medical-impairments/         # Detailed medical guidelines
    │   ├── cardiovascular/
    │   ├── endocrine/
    │   ├── metabolic/
    │   ├── oncology/
    │   ├── psych/
    │   └── ... (11 categories total)
    ├── 4-evidence-screening/          # Lab and test requirements
    └── 5-appendices/                  # Reference tables
```

## Why This Matters

Traditional underwriting requires trained professionals to:
- Review multiple data sources manually
- Cross-reference underwriting guidelines
- Calculate risk scores using complex rating tables
- Document their reasoning for compliance

**This takes 30-90 minutes per application.**

This project shows how AI agents can perform the same analysis in seconds while:
- Maintaining consistency across all decisions
- Providing detailed audit trails with citations
- Scaling to handle thousands of applications
- Adapting to new rules by updating markdown files in the Knowledge Base

The notebooks demonstrate this end-to-end with production-ready deployment.

## What's Included

### The Notebooks (Main Focus)
- **`agentcore_examples/01_kb_setup.ipynb`** - Knowledge Base creation with Bedrock and OpenSearch Serverless
- **`agentcore_examples/02_impairment_agent.ipynb`** - Impairment detection from multiple data sources
- **`agentcore_examples/03_scoring_agent.ipynb`** - Risk scoring using underwriting guidelines

### Supporting Materials
- **`mock_data/`** - Synthetic JSON test data for two clinical scenarios
- **`underwriting-manual/`** - Comprehensive markdown files with rating tables and underwriting rules
- **`.env`** - Auto-generated configuration file (created by Lab 1)

### Prerequisites

- Python 3.8+
- AWS account with Bedrock access
- **Required:** Enable model access in Bedrock console:
  - Claude 3.7 Sonnet (for retrieval and generation)
  - Titan Text Embeddings V2 (for creating embeddings)
- Jupyter Notebook or JupyterLab
- IAM permissions for:
  - Amazon Bedrock (model invocation, Knowledge Base creation)
  - Amazon S3 (bucket creation, object upload)
  - Amazon OpenSearch Serverless (collection creation)
  - AWS IAM (role creation for AgentCore Runtime)
  - Amazon ECR (container registry for agent deployment)

## Test Cases

The repository includes synthetic data for two clinical scenarios:

1. **`diabetes_cardiovascular/`** - Complex case with Type 2 Diabetes, hypertension, and cardiovascular risk factors
2. **`hypertension/`** - Simpler case with controlled blood pressure and good lab results

Each case includes JSON files simulating real data sources:
- Application data (demographics, questionnaire answers)
- Prescription history (medications, dosages, fill dates)
- Lab results (blood work, A1C, lipid panels)
- MIB records (prior insurance applications)

**Note:** All data has been anonymized with masked company names and addresses while preserving clinical values.

## Extending This Project

The notebooks are designed to be modified and extended:

1. **Add new impairments:** Create markdown files in `underwriting-manual/3-medical-impairments/` with rating tables
2. **Test new scenarios:** Modify the mock data JSON files or create new test cases
3. **Refine agent behavior:** Adjust the system prompts in the notebooks
4. **Add new tools:** Give agents additional capabilities (e.g., database queries, API calls)
5. **Integrate with workflows:** Connect deployed agents to Step Functions or other orchestration services

The beauty of this architecture is that updating underwriting rules only requires editing markdown files in the Knowledge Base - no code changes needed.

## Technical Details

### Architecture Components

**Knowledge Base Layer:**
- Amazon Bedrock Knowledge Base (orchestration)
- Amazon OpenSearch Serverless (vector store)
- Amazon S3 (document storage)
- Amazon Titan Text Embeddings V2 (embedding model)

**Agent Layer:**
- Strands Agents framework (agent orchestration)
- Claude 3.7 Sonnet (foundation model)
- Custom tools (kb_search, calculator)
- Amazon Bedrock AgentCore Runtime (deployment platform)

**Data Layer:**
- Synthetic JSON test data (applications, RX, labs, MIB)
- Markdown underwriting manual (policy guidelines)

### Key Patterns Demonstrated

The notebooks demonstrate essential agentic patterns:
- **Tool use:** Agents call functions to search knowledge bases and perform calculations
- **Multi-step reasoning:** Agents break complex tasks into sequential steps
- **Semantic search:** Vector embeddings find relevant guidelines based on meaning
- **Structured output:** Agents produce JSON for downstream processing
- **Audit trails:** Every decision includes detailed explanations with citations
- **Policy grounding:** Agents retrieve authoritative guidance rather than relying on training data
- **Deterministic operations:** Calculator tool ensures accurate arithmetic
- **Production deployment:** Agents package cleanly to serverless runtime

### Dependencies
- `boto3` - AWS SDK for Bedrock, S3, IAM, and other services
- `strands-agents` - Agent framework for orchestrating LLM tool calls
- `bedrock-agentcore` - Runtime library for AgentCore deployment
- `bedrock-agentcore-starter-toolkit` - Helper utilities for agent deployment
- `python-dotenv` - Environment variable management
- `opensearch-py` - OpenSearch client for index creation
- `requests_aws4auth` - AWS authentication for OpenSearch

## Project Flow

1. **Lab 1 (30-45 min):** Set up infrastructure
   - Create S3 bucket and upload documents
   - Create OpenSearch Serverless collection
   - Create Bedrock Knowledge Base
   - Ingest and index documents
   - Test retrieval APIs

2. **Lab 2 (45-60 min):** Build detection agent
   - Define kb_search tool
   - Create Strands agent with detection prompt
   - Test locally with sample data
   - Deploy to AgentCore Runtime
   - Invoke deployed agent

3. **Lab 3 (45-60 min):** Build scoring agent
   - Define kb_search and calculator tools
   - Create Strands agent with scoring prompt
   - Test locally with sample impairments
   - Deploy to AgentCore Runtime
   - Invoke deployed agent

**Total project execution time:** 2-3 hours

## Next Steps After This Project

After completing the three labs, you can:

1. **Integrate with workflows:** Connect agents to AWS Step Functions for orchestration
2. **Build a UI:** Create a web interface for underwriters using the deployed agents
3. **Add more agents:** Build additional agents for other underwriting tasks
4. **Enhance the Knowledge Base:** Add more documents and refine chunking strategies
5. **Implement guardrails:** Add Bedrock Guardrails for content filtering and safety
6. **Monitor and optimize:** Use CloudWatch and X-Ray for observability
7. **Scale to production:** Configure auto-scaling and implement CI/CD pipelines

## Note

This is example code designed for learning and demonstration, not a production application. For production use, consider:
- Error handling and retry logic
- Input validation and sanitization
- Security best practices (least privilege IAM, encryption)
- Cost optimization (caching, batch processing)
- Monitoring and alerting
- Compliance and audit logging
