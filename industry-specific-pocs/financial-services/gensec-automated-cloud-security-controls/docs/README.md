# Documentation Index

This directory contains comprehensive documentation for the Security Configuration System.

## Quick Start

| Document | Purpose | Audience |
|----------|---------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview and component architecture | All developers |
| [EXTRACTION_METHODS.md](./EXTRACTION_METHODS.md) | AI extraction strategies and optimization | Backend developers |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local development and testing | New developers |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment procedures | DevOps, Deployment |

## Core Architecture

### System Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture
  - Component overview
  - Data flow diagrams
  - Integration points
  - Performance considerations

### AI Extraction System
- **[EXTRACTION_METHODS.md](./EXTRACTION_METHODS.md)** - AI extraction methods and strategies
  - Bedrock Agents vs Direct Invocation
  - Chunking strategies
  - Pagination approaches
  - Service-level configuration
  - Performance comparison
  - Error handling

### Service Resolution
- **[SERVICE_NAME_RESOLUTION.md](./SERVICE_NAME_RESOLUTION.md)** - Service identification
  - Service name mapping
  - Alias resolution
  - IAM service name lookup
  - CloudFormation prefix matching

### Resource Management
- **[RESOURCE_TYPE_FILTERING.md](./RESOURCE_TYPE_FILTERING.md)** - Resource type curation
  - Build-time validation
  - Resource type filtering
  - Invalid resource detection

- **[BUILD_TIME_RESOURCE_CURATION.md](./BUILD_TIME_RESOURCE_CURATION.md)** - Resource curation process
  - Validation workflow
  - Error detection
  - Redirect handling

## Development

### Getting Started
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide
  - Local setup
  - Testing procedures
  - Code organization
  - Best practices

### Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment procedures
  - CDK deployment
  - Configuration management
  - Environment setup
  - Troubleshooting

### Business Context
- **[BUSINESS_VALUE.md](./BUSINESS_VALUE.md)** - Business value and ROI
  - Time savings
  - Process improvements
  - Cost benefits

## Implementation Notes (Internal Reference)

Implementation-specific notes and fixes are maintained in `docs/temp-fixes/` for internal reference. These documents capture specific implementation decisions, optimizations, and bug fixes. They should be periodically reviewed for consolidation into main documentation.

## Lambda Functions

Detailed documentation for each Lambda function:

### Documentation Management
- **[AWSServiceDocumentationManager](./lambda-functions/AWSServiceDocumentationManager.md)**
  - Service documentation collection
  - Action and parameter extraction
  - AI-powered content processing
  - Multi-method extraction support

### Security Analysis
- **[AnalyzeSecurityRequirements](./lambda-functions/AnalyzeSecurityRequirements.md)**
  - Security requirement analysis
  - Threat vector identification
  - Compliance mapping

### Control Generation
- **[GenerateSecurityControls](./lambda-functions/GenerateSecurityControls.md)**
  - Security control generation
  - Detective, preventive, and proactive controls
  - AWS Config rule creation

### Template Generation
- **[GenerateIaCTemplate](./lambda-functions/GenerateIaCTemplate.md)**
  - Infrastructure as Code generation
  - CloudFormation templates
  - Terraform configurations

### Profile Generation
- **[GenerateServiceProfile](./lambda-functions/GenerateServiceProfile.md)**
  - Service security profile creation
  - Comprehensive documentation
  - Best practices compilation

### IAM Modeling
- **[GenerateIAMModel](./lambda-functions/GenerateIAMModel.md)**
  - IAM policy generation
  - Permission analysis
  - Role recommendations

## Documentation Standards

All documentation follows these principles:

### Permanent Documentation (docs/)
- Architecture and design decisions
- API documentation
- Development guides
- Deployment procedures

### Temporary Documentation (docs/temp-fixes/)
- Implementation notes
- Bug fixes and workarounds
- Performance optimizations
- Should be reviewed and consolidated periodically

### Code Documentation
- Inline comments for complex logic
- Docstrings for all functions
- Type hints where applicable
- README files in component directories

## Contributing to Documentation

When adding or updating documentation:

1. **Choose the right location:**
   - Core architecture → `docs/`
   - Implementation notes → `docs/temp-fixes/`
   - Lambda-specific → `docs/lambda-functions/`

2. **Follow the template:**
   - Clear problem statement
   - Detailed solution
   - Implementation details
   - Results and benefits

3. **Update indexes:**
   - Add to this README.md
   - Update ARCHITECTURE.md references
   - Update main project README.md

4. **Use consistent formatting:**
   - Markdown headers
   - Code blocks with language tags
   - Tables for comparisons
   - Diagrams where helpful

## Questions?

For specific topics:
- **Architecture questions** → See ARCHITECTURE.md
- **AI extraction questions** → See EXTRACTION_METHODS.md
- **Development questions** → See DEVELOPMENT.md
- **Deployment questions** → See DEPLOYMENT.md
