# Tech Stack Standards

## Core Technology Stack

### Programming Language
- **Python 3.12** - Primary development language for all backend services and AI components
- Use modern Python features and type hints for better code quality
- Follow PEP 8 style guidelines and use tools like black for formatting

### AI and Integration Framework
- **AWS AgentCore Runtime** - Serverless runtime for deploying and scaling AI agents
- **AWS AgentCore Memory** - Context-aware memory management for agents
- **AWS AgentCore Identity** - Secure authentication and credential management for agents
- **AWS AgentCore Observability** - Monitoring, tracing, and debugging for agent workflows
- **Strands Agent Framework** - For building and orchestrating AI agents (integrated with AgentCore)
- **Model Context Protocol (MCP)** - For external data source integrations
- Leverage AWS AgentCore for enterprise-grade agent management and security

### Cloud Infrastructure (AWS)
- **AWS Lambda** - Serverless compute for event-driven processing and microservices
- **Amazon DynamoDB** - NoSQL database for high-performance, scalable data storage
- **Amazon S3** - Object storage for documents, reports, and data archival
- **Amazon RDS PostgreSQL** - Relational database for structured data and complex queries

### Frontend and User Interface
- **Streamlit** - Web application framework for creating interactive dashboards and advisor interfaces
- Focus on rapid development and data visualization capabilities
- Integrate with backend services through API calls

## Architecture Principles

### Agent-First Approach
- **AWS AgentCore Runtime** for AI agent hosting instead of traditional Lambda functions for agent workloads
- **Session Isolation** for secure processing of sensitive financial and behavioral data
- **Extended Runtime Support** for complex agent reasoning workflows (up to 8 hours)
- **Consumption-based Pricing** for cost-effective agent execution
- **Built-in Authentication** through AgentCore Identity for secure agent operations

### Serverless-First Approach
- Use AWS Lambda functions for non-agent business logic and event processing
- Design for auto-scaling and cost-effective resource utilization
- Use event-driven architecture patterns

### Data Storage Strategy
- **AWS AgentCore Memory** for agent context, behavioral patterns, and cross-session knowledge
- **DynamoDB** for high-throughput, real-time data (user sessions, notifications, real-time analytics)
- **PostgreSQL** for complex relational data (user profiles, investment portfolios, audit trails)
- **S3** for file storage, backups, and data lake functionality

### Integration Patterns
- **AWS AgentCore Identity** for secure authentication and credential management for agent access to external services
- **AWS AgentCore Gateway** for transforming APIs and services into agent-compatible tools
- Use MCP for standardized external data source connections
- Implement proper error handling and retry mechanisms for external integrations
- Design for resilience and graceful degradation when external services are unavailable

## Development Guidelines

### Package Management
- Use `requirements.txt` or `pyproject.toml` for dependency management
- Pin specific versions for production deployments
- Regularly update dependencies for security patches

### Testing Framework
- Use `pytest` for unit and integration testing
- Implement proper mocking for external service dependencies
- Maintain high test coverage for critical business logic

### Deployment and Infrastructure
- Use Infrastructure as Code (IaC) with AWS CloudFormation or CDK
- Implement proper CI/CD pipelines for automated testing and deployment
- Follow AWS Well-Architected Framework principles

## AWS AgentCore Standards

### Agent Design Guidelines

#### Agent Responsibility Separation
- **Single Purpose Agents**: Each agent should have a focused, well-defined responsibility
- **Behavioral Analysis Agent**: Focuses solely on transaction patterns and behavioral metrics
- **Psychological Analysis Agent**: Handles psychological indicators and bias detection
- **Sentiment Analysis Agent**: Processes communications and emotional indicators
- **Risk Assessment Agent**: Combines inputs from other agents for comprehensive risk profiling

#### Agent Communication Patterns
- **Event-Driven Communication**: Agents communicate through events and message passing
- **Shared Memory**: Use AgentCore Memory for cross-agent knowledge sharing
- **Stateless Design**: Agents should be stateless with state managed through AgentCore Memory
- **Async Processing**: Leverage AgentCore's extended runtime for long-running analysis

### AgentCore Runtime Best Practices

#### Session Management
- **Session Isolation**: Leverage AgentCore's microVM isolation for customer data security
- **Session State**: Store session-specific context in AgentCore Memory short-term storage
- **Session Cleanup**: Ensure proper cleanup of sensitive data after session completion

#### Performance Optimization
- **Consumption-Based Pricing**: Design agents to minimize idle time and maximize active processing
- **Payload Optimization**: Utilize 100MB payload capacity for multi-modal data processing
- **Extended Runtime**: Use up to 8-hour runtime for complex behavioral pattern analysis

#### Error Handling
- **Graceful Degradation**: Agents should continue operating with reduced functionality when dependencies fail
- **Retry Logic**: Implement exponential backoff for external API calls
- **Circuit Breakers**: Prevent cascading failures in agent workflows

### AgentCore Memory Usage

#### Memory Types and Usage
- **Short-term Memory**: Store conversation context, session-specific analysis results
- **Long-term Memory**: Store behavioral patterns, customer preferences, historical insights
- **Cross-Agent Memory**: Share insights between behavioral, psychological, and sentiment agents

#### Memory Management
- **Data Lifecycle**: Define clear retention policies for different types of memory
- **Privacy Controls**: Implement data anonymization and deletion capabilities
- **Memory Optimization**: Balance memory usage with analysis accuracy

### AgentCore Identity Implementation

#### Authentication Strategy
- **Agent Identities**: Create specific identities for each agent type
- **Credential Management**: Use AgentCore Identity for secure API access
- **Permission Boundaries**: Implement least-privilege access for each agent

#### External Service Access
- **API Key Management**: Store external API credentials securely in AgentCore Identity
- **OAuth Integration**: Use AgentCore Identity for OAuth flows with external services
- **Audit Trails**: Maintain comprehensive logs of all external service access

### AgentCore Observability Standards

#### Monitoring and Tracing
- **Agent Performance**: Monitor processing times, success rates, and resource utilization
- **Decision Tracing**: Track agent decision-making processes for explainable AI
- **Cross-Agent Workflows**: Trace interactions between multiple agents

#### Alerting and Notifications
- **Performance Alerts**: Set up alerts for agent performance degradation
- **Error Monitoring**: Monitor and alert on agent failures and exceptions
- **Business Logic Alerts**: Alert on significant changes in risk assessment patterns

#### Compliance and Auditing
- **Decision Logs**: Maintain detailed logs of all agent decisions and reasoning
- **Data Access Logs**: Track all access to customer data and external services
- **Regulatory Reporting**: Generate compliance reports from observability data

### Agent Development Workflow
1. **Agent Design**: Define agent purpose, inputs, outputs, and decision logic
2. **Memory Schema**: Design memory structures for short-term and long-term storage
3. **Identity Setup**: Configure agent identities and permissions
4. **Implementation**: Develop agent using Strands Framework with AgentCore integration
5. **Testing**: Test agent in isolation and as part of multi-agent workflows
6. **Deployment**: Deploy to AgentCore Runtime with proper monitoring
7. **Monitoring**: Set up observability and performance monitoring

### Code Organization
```
agents/
├── behavioral_analysis/
│   ├── agent.py
│   ├── memory_schema.py
│   └── tests/
├── psychological_analysis/
│   ├── agent.py
│   ├── memory_schema.py
│   └── tests/
├── sentiment_analysis/
│   ├── agent.py
│   ├── memory_schema.py
│   └── tests/
└── risk_assessment/
    ├── agent.py
    ├── memory_schema.py
    └── tests/
```

### Testing Standards
- **Unit Testing**: Test individual agent logic and decision-making
- **Integration Testing**: Test agent interactions and memory sharing
- **End-to-End Testing**: Test complete risk assessment workflows
- **Performance Testing**: Validate agent performance under load
- **Security Testing**: Verify proper isolation and access controls

### Deployment Standards
- **Infrastructure as Code**: Use CDK or CloudFormation for AgentCore resources
- **Environment Management**: Separate development, staging, and production environments
- **Version Control**: Maintain version control for agent code and configurations
- **Rollback Strategy**: Implement safe deployment and rollback procedures

## Security and Compliance

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Session Isolation**: Leverage AgentCore's microVM isolation
- **Data Minimization**: Only process necessary data for risk assessment
- **Data Retention**: Implement appropriate data retention and deletion policies

### Access Control
- **Principle of Least Privilege**: Agents have minimal required permissions
- **Identity Verification**: All agent actions tied to verified identities
- **Regular Audits**: Periodic review of agent permissions and access patterns

### Regulatory Compliance
- **AWS AgentCore Identity** for agent-specific authentication and authorization
- **AWS AgentCore Observability** for comprehensive audit trails and compliance monitoring
- **Audit Trails**: Comprehensive logging for regulatory requirements
- **Explainable AI**: Maintain transparency in agent decision-making
- **Data Privacy**: Comply with GDPR, CCPA, and financial services regulations
- **Right to Deletion**: Support customer data deletion requests
- Implement proper IAM roles and policies for least privilege access
- Use AWS Secrets Manager for sensitive configuration data
- Ensure data encryption at rest and in transit
- Follow financial services compliance requirements for data handling
- Leverage AgentCore's built-in session isolation for secure multi-tenant processing