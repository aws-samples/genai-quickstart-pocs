# Infrastructure Architecture

## Overview

The Investment AI Agent infrastructure is built on AWS using a serverless-first approach with Infrastructure as Code (IaC) principles. The architecture emphasizes scalability, security, and cost-effectiveness while maintaining high availability and performance.

## Infrastructure Components

### Compute Layer

#### AWS Lambda
- **API Lambda**: Handles all API requests and responses
- **Processing Lambda**: Executes background processing tasks
- **Scheduler Lambda**: Manages periodic tasks and data updates

**Configuration**:
```yaml
Runtime: Node.js 18.x
Memory: 256MB - 3008MB (auto-scaling)
Timeout: 30 seconds (API), 15 minutes (processing)
Concurrency: 1000 concurrent executions
```

#### Amazon ECS (Optional)
- Used for long-running processes that exceed Lambda limits
- Container-based deployment for complex AI workflows
- Auto-scaling based on CPU and memory utilization

### Storage Layer

#### Amazon S3
**Proprietary Data Bucket**:
- Stores uploaded documents (PDF, CSV, Excel, JSON)
- Versioning enabled for data integrity
- Server-side encryption with AWS KMS
- Lifecycle policies for cost optimization

**Configuration**:
```yaml
Encryption: AES-256 with KMS
Versioning: Enabled
Public Access: Blocked
Backup: Cross-region replication
Lifecycle: 
  - Standard: 0-30 days
  - IA: 30-90 days
  - Glacier: 90+ days
```

#### Amazon DynamoDB
**Investment Ideas Table**:
- Partition Key: `id` (String)
- Sort Key: `timestamp` (Number)
- Global Secondary Indexes for querying by user, status, and date
- Point-in-time recovery enabled

**User Profiles Table**:
- Partition Key: `userId` (String)
- Stores user preferences and settings
- Encrypted at rest

**Configuration**:
```yaml
Billing Mode: On-Demand
Encryption: AWS Managed Keys
Backup: Point-in-time recovery
TTL: Enabled for temporary data
```

#### Amazon Timestream
**Market Data Database**:
- Time-series data for real-time market information
- Automatic data lifecycle management
- Memory and magnetic storage tiers

**Configuration**:
```yaml
Memory Retention: 24 hours
Magnetic Retention: 7 days
Compression: Enabled
Encryption: At rest and in transit
```

#### Amazon OpenSearch
**Knowledge Base Index**:
- Full-text search across all data sources
- Vector search for semantic similarity
- Real-time indexing and updates

**Configuration**:
```yaml
Instance Type: t3.small.search (dev), m6g.large.search (prod)
Storage: EBS GP3
Encryption: At rest and in transit
Access: VPC-based with security groups
```

### AI/ML Layer

#### Amazon Bedrock
**Foundation Models**:
- Claude Sonnet 3.7: Complex reasoning and planning
- Claude Haiku 3.5: Fast processing and research
- Amazon Nova Pro: Financial analysis and quantitative tasks

**Configuration**:
```yaml
Model Access: On-demand
Throttling: 1000 requests/minute per model
Logging: CloudWatch integration
Monitoring: Custom metrics for usage and performance
```

### Networking Layer

#### Amazon VPC
**Network Architecture**:
- Multi-AZ deployment for high availability
- Public subnets for API Gateway and Load Balancers
- Private subnets for Lambda functions and databases
- Isolated subnets for sensitive data processing

**Configuration**:
```yaml
CIDR: 10.0.0.0/16
Availability Zones: 3
Public Subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
Private Subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
Isolated Subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
```

#### Security Groups
- **API Gateway SG**: Allows HTTPS traffic from internet
- **Lambda SG**: Allows outbound HTTPS and database connections
- **Database SG**: Allows inbound connections from Lambda only
- **OpenSearch SG**: Restricted access from application layer

### API Layer

#### Amazon API Gateway
**REST API Configuration**:
- Regional endpoint for better performance
- Custom domain with SSL certificate
- Request/response transformation
- Throttling and quota management

**Configuration**:
```yaml
Endpoint Type: Regional
Throttling: 10,000 requests/second
Burst: 5,000 requests
Caching: Enabled (TTL: 300 seconds)
Logging: Full request/response logging
```

#### AWS WAF
**Web Application Firewall**:
- Protection against common web exploits
- Rate limiting and IP blocking
- Custom rules for API protection

**Rules**:
- AWS Managed Core Rule Set
- AWS Managed Known Bad Inputs
- Rate limiting: 2000 requests per 5 minutes per IP
- Geographic blocking for high-risk countries

### Authentication Layer

#### Amazon Cognito
**User Pool Configuration**:
- Email-based authentication
- Strong password policies
- Multi-factor authentication support
- Custom attributes for user preferences

**Configuration**:
```yaml
Sign-up: Admin only
Password Policy:
  Min Length: 12
  Require: Uppercase, lowercase, numbers, symbols
MFA: Optional (TOTP)
Token Validity: 
  Access: 1 hour
  Refresh: 30 days
```

### Monitoring Layer

#### Amazon CloudWatch
**Metrics and Alarms**:
- API Gateway metrics (latency, errors, throttling)
- Lambda metrics (duration, errors, concurrent executions)
- DynamoDB metrics (read/write capacity, throttling)
- Custom business metrics

**Log Groups**:
- API Gateway access logs
- Lambda function logs
- Application logs with structured JSON format

#### AWS X-Ray
**Distributed Tracing**:
- End-to-end request tracing
- Performance bottleneck identification
- Service map visualization

### Security Layer

#### AWS IAM
**Role-Based Access Control**:
- Lambda execution roles with minimal permissions
- Service-to-service authentication
- Cross-account access for multi-environment setup

**Key Roles**:
- `InvestmentAI-Lambda-ExecutionRole`
- `InvestmentAI-Bedrock-AccessRole`
- `InvestmentAI-DynamoDB-AccessRole`

#### AWS KMS
**Encryption Key Management**:
- Customer-managed keys for sensitive data
- Automatic key rotation
- Fine-grained access control

**Key Usage**:
- S3 bucket encryption
- DynamoDB encryption
- Lambda environment variables
- Secrets Manager integration

#### AWS Secrets Manager
**Secret Management**:
- API keys for external services
- Database connection strings
- Encryption keys for application-level encryption

### Backup and Disaster Recovery

#### Backup Strategy
**Automated Backups**:
- DynamoDB: Point-in-time recovery with 35-day retention
- S3: Cross-region replication to secondary region
- Lambda: Code stored in S3 with versioning
- Infrastructure: CDK templates in version control

#### Disaster Recovery
**Multi-Region Setup**:
- Primary Region: us-east-1
- Secondary Region: us-west-2
- RTO: 4 hours
- RPO: 1 hour

**Failover Process**:
1. Automated health checks detect primary region failure
2. Route 53 health checks redirect traffic to secondary region
3. Lambda functions deployed in secondary region
4. Data synchronized from backups and replicas

### Cost Optimization

#### Resource Optimization
- Lambda: Right-sized memory allocation
- DynamoDB: On-demand billing for variable workloads
- S3: Intelligent tiering for automatic cost optimization
- OpenSearch: Reserved instances for predictable workloads

#### Monitoring and Alerts
- AWS Cost Explorer for cost analysis
- Budget alerts for spending thresholds
- Resource utilization monitoring
- Automated scaling policies

### Deployment Pipeline

#### Infrastructure as Code
**AWS CDK Stack Structure**:
```
investment-ai-agent-stack/
├── networking-stack.ts      # VPC, subnets, security groups
├── storage-stack.ts         # S3, DynamoDB, Timestream
├── compute-stack.ts         # Lambda functions, ECS
├── api-stack.ts            # API Gateway, Cognito
├── monitoring-stack.ts     # CloudWatch, X-Ray
└── security-stack.ts       # IAM, KMS, Secrets Manager
```

#### Deployment Environments
- **Development**: Single AZ, minimal resources
- **Staging**: Production-like setup for testing
- **Production**: Multi-AZ, high availability

#### CI/CD Pipeline
1. Code commit triggers pipeline
2. Unit and integration tests
3. Security scanning and compliance checks
4. Infrastructure deployment (CDK)
5. Application deployment
6. Smoke tests and validation
7. Production deployment with blue-green strategy

### Performance Optimization

#### Caching Strategy
- API Gateway response caching
- Lambda container reuse
- DynamoDB DAX for microsecond latency
- CloudFront for static content

#### Auto-Scaling Configuration
- Lambda: Concurrent execution limits
- DynamoDB: Auto-scaling for read/write capacity
- OpenSearch: Auto-scaling for storage and compute
- ECS: CPU and memory-based scaling

### Compliance and Governance

#### Security Compliance
- SOC 2 Type II compliance
- GDPR data protection measures
- Financial services regulatory requirements
- Regular security assessments and penetration testing

#### Governance
- AWS Config for compliance monitoring
- AWS CloudTrail for audit logging
- Resource tagging for cost allocation
- Access logging and monitoring

### Environment-Specific Configurations

#### Development Environment
```yaml
Lambda Memory: 256MB
DynamoDB: On-demand, minimal capacity
S3: Standard storage class
OpenSearch: t3.small.search
Monitoring: Basic CloudWatch metrics
```

#### Staging Environment
```yaml
Lambda Memory: 512MB
DynamoDB: On-demand with higher limits
S3: Standard with lifecycle policies
OpenSearch: m6g.medium.search
Monitoring: Enhanced monitoring enabled
```

#### Production Environment
```yaml
Lambda Memory: 1024MB+
DynamoDB: On-demand with reserved capacity
S3: Intelligent tiering
OpenSearch: m6g.large.search with Multi-AZ
Monitoring: Full observability stack
```

This infrastructure architecture provides a robust, scalable, and secure foundation for the Investment AI Agent system while maintaining cost-effectiveness and operational efficiency.