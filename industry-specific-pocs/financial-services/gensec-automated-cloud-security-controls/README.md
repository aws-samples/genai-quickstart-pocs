# Security Configuration System

A serverless application that automates security configuration analysis and recommendations using AWS services and Bedrock AI integration. The system processes service configurations, generates security controls, IAM models, and infrastructure templates.

## Business Value & Impact

**Accelerate AWS Service Adoption**: Transform service approval from 12 weeks to 3 validation sessions through AI-powered automation.

### Key Benefits
- **Time Savings**: Automated security control generation and compliance mapping
- **Enhanced Security**: Comprehensive coverage of security domains and threat vectors  
- **Compliance Assurance**: Automatic alignment with regulatory frameworks (NIST 800-53, etc.)
- **Consistency**: Standardized security controls across all approved services
- **Accelerated Threat Modeling**: Pre-approved services with associated threat vectors for faster workload assessments

### Process Innovation
1. Input security profile, compliance needs, and AWS service selection
2. AI analyzes against AWS documentation and best practices
3. Generate tailored detective, preventive, and proactive controls
4. Review and approve generated controls and templates
5. Automated deployment of approved artifacts

### Workload-Level Impact

By using pre-approved services with associated controls and threat vectors, customers can:

- **Rapid Assessment**: Quickly evaluate new workloads against known security baselines
- **Efficient Gap Analysis**: Identify potential vulnerabilities and compliance gaps more efficiently  
- **Proven Controls**: Implement security controls with confidence based on AI analysis
- **Focused Threat Modeling**: Concentrate efforts on workload-specific risks rather than underlying service security
- **Continuous Improvement**: AI learns from approvals and refinements, improving recommendations over time

## Architecture Overview

![GenSec System Architecture](docs/blog/GenSec.png)

## Core Components

### Step Functions Workflow (gensec-SecurityConfigWorkflow)
1. **ValidateAndCollectServiceData**
   - Collects AWS service documentation
   - Validates service capabilities
   - Stores documentation for reference

2. **AnalyzeSecurityRequirements**
   - Processes security configurations
   - Integrates with Bedrock AI
   - Generates initial analysis

3. **GenerateSecurityControls**
   - Creates security control recommendations
   - Maps to compliance requirements
   - Provides implementation guidance

4. **GenerateIaCTemplate**
   - Creates infrastructure templates
   - Implements security controls
   - Supports multiple IaC formats

5. **GenerateServiceProfile**
   - Documents service capabilities
   - Maps security features
   - Provides configuration guidance

6. **GenerateIAMModel**
   - Creates IAM permission models
   - Implements least privilege
   - Maps service actions

### Lambda Functions

The system uses 7 Lambda functions in a decomposed architecture. For detailed documentation of each function, see [docs/lambda-functions/](docs/lambda-functions/).

| Function | Purpose | Memory | Timeout | Documentation |
|----------|---------|--------|---------|---------------|
| SecurityProfileProcessor | S3 event processing & workflow orchestration | 128 MB | 3 min | [Details](docs/lambda-functions/SecurityProfileProcessor.md) |
| AWSServiceDocumentationManager | AWS service documentation collection | 1024 MB | 15 min | [Details](docs/lambda-functions/AWSServiceDocumentationManager.md) |
| AnalyzeSecurityRequirements | AI-powered security analysis | 1024 MB | 15 min | [Details](docs/lambda-functions/AnalyzeSecurityRequirements.md) |
| GenerateSecurityControls | Security control generation | 1024 MB | 15 min | [Details](docs/lambda-functions/GenerateSecurityControls.md) |
| GenerateIaCTemplate | Infrastructure template generation | 1024 MB | 15 min | [Details](docs/lambda-functions/GenerateIaCTemplate.md) |
| GenerateIAMModel | IAM permission model generation | 1024 MB | 15 min | [Details](docs/lambda-functions/GenerateIAMModel.md) |
| GenerateServiceProfile | Service capability documentation | 1024 MB | 15 min | [Details](docs/lambda-functions/GenerateServiceProfile.md) |

### Storage Resources

#### DynamoDB Tables
1. **Security Control Library** (gensec-SecurityControlLibrary)
   - Stores security control definitions
   - Maps compliance requirements
   - Tracks implementation status

2. **Service Request Tracking** (gensec-ServiceRequestTracking)
   - Tracks processing requests
   - Maintains audit history
   - Enables request tracing

3. **AWS Service Actions** (gensec-AWSServiceActions)
   - AWS service action definitions
   - IAM permission mappings

4. **AWS Service Parameters** (gensec-AWSServiceParameters)
   - Service parameter documentation
   - Configuration validation

5. **AWS Service Inventory** (gensec-AWSServiceInventory)
   - Service metadata and capabilities

6. **AWS Service Resources** (gensec-AWSServiceResources)
   - Resource type definitions

7. **Security Standards Library** (gensec-SecurityStandardsLibrary)
   - Compliance framework mappings

8. **Service Profile Library** (gensec-ServiceProfileLibrary)
   - Service capability templates

9. **AWS Config Managed Rules** (gensec-AWSConfigManagedRules)
   - AWS Config managed rule definitions
   - Service-based rule categorization
   - Security compliance rule mappings

#### S3 Buckets
1. **Input Profiles** (gensec-security-input-profiles-${account}-${region})
   - Stores service configurations
   - Triggers processing workflow via S3 events
   - Maintains version history
   - Supports security-profile/ and service-request/ prefixes

2. **Configuration Outputs** (gensec-security-config-outputs-${account}-${region})
   - Stores processing results
   - Maintains documentation
   - Stores generated artifacts

### Config Rules Management

The system includes AWS Config managed rules for security control recommendations:

```bash
# Load AWS Config managed rules into DynamoDB
cd scripts/config-rules
python3 load_config_rules.py

# View baseline rules (696 rules from AWS documentation)
cat aws_config_manage_rules_baseline.json
```

**Files:**
- `scripts/config-rules/load_config_rules.py` - Extracts rules from AWS documentation and loads into DynamoDB
- `scripts/config-rules/aws_config_manage_rules_baseline.json` - Read-only baseline reference (696 rules)

**Features:**
- Extracts rules directly from AWS Config documentation
- No hardcoded rules - dynamically discovers services
- Service-based categorization via GSI
- Fallback to baseline file if documentation unavailable

## System Outputs

The security configuration system generates comprehensive outputs tailored for different teams and use cases:

| Output Type | Format | Purpose & Description | Primary Users |
|-------------|--------|----------------------|---------------|
| **Service Research Profile** (customer form) | Markdown | • Comprehensive security documentation of AWS service<br>• Details on data protection, network/access controls, compliance<br>• Operational guidelines and best practices | • Security Architects<br>• Cloud Teams<br>• Compliance Teams |
| **IAM Review Module** (customer request) | JSON/Markdown | • Detailed IAM configurations and policies<br>• Permission sets and role analysis<br>• Best practices and implementation guidance<br>• Approval requirements and workflows | • IAM Team<br>• Security Team<br>• Cloud Platform Team |
| **AWS Service Configuration Recommendations** | JSON | • Security configuration guidance<br>• Service-specific security parameters<br>• Compliance mappings<br>• Implementation considerations | • Security Architects<br>• Cloud Teams<br>• Implementation Teams |
| **Security Controls** (checks) | JSON | • Proactive controls (CI/CD pipeline checks)<br>• Preventive (SCPs IAM policy at the Org level)<br>• Detective controls (Custom AWS Config rules) | • Security Teams<br>• Compliance Teams<br>• Operations Teams |
| **IaC Templates** | YAML/JSON | • CloudFormation / Terraform templates<br>• Pre-configured security settings<br>• Resource and parameters definitions | • DevOps Teams<br>• Cloud Engineers<br>• Implementation Teams |
| **Security Control Library** | DynamoDB Table | • Approved configurations storage<br>• Implementation status<br>• Approval history<br>• Compliance and threat mappings<br>• Configuration and control selection rational | • All Teams<br>• Auditors<br>• Security Teams |
| **Service Request Tracking** | DynamoDB Table | • Configuration request history<br>• Processing status<br>• Approval tracking<br>• Version control | • Operations Teams<br>• Security Teams<br>• Requestors |

## Getting Started

### Prerequisites
- AWS Account with appropriate permissions
- Node.js ≥ 14.x (for CDK)
- Python 3.9 (for Lambda functions)
- AWS CDK CLI

Warning: Before deploying, make sure to build Lambda Layers
```bash
# Set up Lambda Layers
cd layers
./build-all-layers.sh
```

### Deployment
```bash
# Install CDK dependencies
cd cdk
npm install

# Build TypeScript
npm run build

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy infrastructure (defaults to us-east-1)
cdk deploy
```

### Testing the System
```bash
# Upload service mappings configuration (required for documentation collection)
aws s3 cp config-example/service-mappings.json s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/configuration/

# To update service mappings with latest AWS services, run:
cd scripts/service-mapping && python3 extract_service_mappings.py

# Upload test security profile
aws s3 cp security-profile.json s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/security-profile/

# Upload test service request
aws s3 cp service-request.json s3://gensec-security-input-profiles-${ACCOUNT}-${REGION}/service-request/

# Monitor execution (decomposed workflow)
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:${REGION}:${ACCOUNT}:stateMachine:gensec-SecurityConfigWorkflow

# Check results
aws s3 ls s3://gensec-security-config-outputs-${ACCOUNT}-${REGION}/

# Download outputs locally
./scripts/download_outputs.py

# Validate outputs for a service
cd scripts/output-validation
./validate_service.sh ACM
```

## Project Structure

```
security-project/
├── cdk/                  # Infrastructure as Code
│   ├── bin/             # CDK app entry point
│   ├── lib/             # Stack definitions
│   │   ├── security-system-stack.ts
│   │   └── lambda-layers.ts
│   └── test/            # Infrastructure tests
├── lambda/              # Current Lambda function code (decomposed architecture)
│   ├── AWSServiceDocumentationManager/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   ├── AnalyzeSecurityRequirements/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   ├── GenerateSecurityControls/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   ├── GenerateIaCTemplate/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   ├── GenerateIAMModel/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   ├── GenerateServiceProfile/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   └── SecurityProfileProcessor/
│       ├── lambda_function.py
│       └── requirements.txt
├── lambda-legacy/       # Legacy Lambda functions (archived)
│   ├── [old]SecurityConfigurationHandler/
│   │   ├── lambda_function.py
│   │   └── requirements.txt
│   └── [old]SecurityProfileProcessor/
│       ├── lambda_function.py
│       └── requirements.txt
├── layers/              # Lambda layers for shared code
│   ├── bedrock-layer/   # Bedrock AI client with comprehensive logging
│   ├── common-layer/    # boto3, botocore, s3_operations
│   ├── dynamodb-operations-layer/  # DynamoDB operations
│   ├── requests-layer/  # HTTP operations
│   ├── validation-layer/  # validation, json_processing, yaml
│   └── web-scraping-layer/  # beautifulsoup4, lxml
├── scripts/             # Supporting utility scripts
│   ├── download_outputs.py      # Download S3 outputs locally
│   ├── output-validation/       # Validation automation
│   └── config-rules/           # AWS Config rules management
│       ├── load_config_rules.py # Load Config rules into DynamoDB
│       └── aws_config_manage_rules_baseline.json # Baseline reference (696 rules)
├── config-example/      # Example configurations and sample files
├── tests/              # Test implementations and test files
│   └── output/         # Downloaded outputs (gitignored)
└── docs/               # Detailed documentation

```

**Note:** The `tests/output/` directory is excluded from version control (.gitignore) as it contains downloaded artifacts from S3 buckets.

## Documentation

- [Business Value & Impact](docs/BUSINESS_VALUE.md) - Executive summary and ROI analysis
- [Architecture Details](docs/ARCHITECTURE.md) - Detailed system architecture
- [Lambda Functions](docs/lambda-functions/) - Individual function documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions
- [Development Guide](docs/DEVELOPMENT.md) - Development guidelines

## IAM Permissions Architecture

### Design Philosophy
All IAM permissions are defined directly in the main CDK stack (`cdk/lib/security-system-stack.ts`) following these principles:

- **Principle of Least Privilege**: Each role has only the minimum permissions required
- **Resource-Specific Scoping**: Permissions are scoped to specific resources, not wildcards
- **Function-Specific Access**: CloudWatch logs are scoped to individual Lambda function log groups
- **Clear Documentation**: Each permission block includes detailed comments explaining purpose

### Role Overview

#### 1. DocumentationManagerRole
**Purpose**: Collects AWS service documentation from external sources
- **CloudWatch Logs**: Function-specific log group access
- **S3**: Read/write access to documentation, input, and output buckets
- **DynamoDB**: Full access to service documentation tables (Actions, Parameters, Inventory, Resources)
- **Bedrock**: Model invocation for AI processing of documentation
- **VPC**: Network access for external documentation URL requests

#### 2. SecurityConfigurationHandlerRole
**Purpose**: Main AI-powered security analysis and configuration generation
- **CloudWatch Logs**: Function-specific log group access
- **Bedrock**: Full AI access (foundation models, inference profiles, agents, knowledge bases)
- **DynamoDB**: Full access to all security and service tables
- **S3**: Read/write access to all system buckets
- **VPC**: Network access for potential external integrations

#### 3. StepFunctionsWorkflowRole
**Purpose**: Orchestrates the security configuration workflow
- **Lambda**: Invoke permissions for all workflow Lambda functions
- **CloudWatch Logs**: Full logging access for workflow monitoring
- **X-Ray**: Distributed tracing for performance monitoring

#### 4. SecurityProfileProcessorRole
**Purpose**: Processes S3 uploads and triggers workflows
- **CloudWatch Logs**: Function-specific log group access
- **S3**: Read/write access to input and output buckets
- **Step Functions**: Start and monitor workflow executions

### Bedrock Model Access
The system supports both foundation models and inference profiles:
- **Foundation Models**: `arn:aws:bedrock:region::foundation-model/*`
- **Inference Profiles**: `arn:aws:bedrock:region:account:inference-profile/*`

This dual approach ensures compatibility with models like Nova Pro that require inference profiles while maintaining access to directly invokable models.

### Permission Maintenance
- All permissions are centralized in `security-system-stack.ts`
- Each permission block includes detailed comments
- Resource ARNs use CDK references for automatic updates
- Legacy table access is maintained for backward compatibility

## Contributing

1. Review the [Development Guide](docs/DEVELOPMENT.md)
2. Set up your development environment
3. Make your changes
4. Add/update tests
5. Submit a pull request

### Development Guidelines

#### Working Directory Structure
- **Production code**: `lambda/`, `cdk/`, `config-example/`
- **Development tools**: `scripts/` (gitignored)
- **Permanent docs**: `docs/`
- **Test files**: `tests/`

#### File Organization Rules
- **scripts/**: Development utilities, temporary files (NOT deployed)
- **tests/output/**: Downloaded S3 artifacts (gitignored)
- **config-example/**: Sample configurations for deployment
- **docs/**: Permanent project documentation

#### Testing Guidelines
- All test implementations should be stored in the `tests/` folder
- Example configurations belong in `config-example/`
- Test structure should mirror the main project structure
- Use `./scripts/download_outputs.py` to get latest outputs
- Use `./scripts/output-validation/validate_service.sh <SERVICE>` to validate outputs

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For detailed information about:
- System architecture: See [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Deployment process: See [DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Development guidelines: See [DEVELOPMENT.md](docs/DEVELOPMENT.md)
