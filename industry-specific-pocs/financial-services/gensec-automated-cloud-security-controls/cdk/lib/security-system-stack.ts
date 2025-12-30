import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import { Construct } from 'constructs';
import { LambdaLayers } from './lambda-layers';

export class SecuritySystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Add gensec tag to all resources in this stack
    cdk.Tags.of(this).add('gensec', 'true');
    cdk.Tags.of(this).add('Project', 'SecurityConfigurationSystem');
    cdk.Tags.of(this).add('Environment', 'production');

    // Initialize Lambda layers
    const layers = new LambdaLayers(this, 'SecuritySystemLayers');

    // S3 Buckets - Consistent naming without version suffixes
    const outputBucket = new s3.Bucket(this, 'SecurityConfigOutputs', {
      bucketName: `gensec-security-config-outputs-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(outputBucket).add('gensec', 'true');
    cdk.Tags.of(outputBucket).add('ResourceType', 'S3Bucket');
    cdk.Tags.of(outputBucket).add('Purpose', 'SecurityConfigOutputs');

    const inputBucket = new s3.Bucket(this, 'SecurityInputProfiles', {
      bucketName: `gensec-security-input-profiles-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(inputBucket).add('gensec', 'true');
    cdk.Tags.of(inputBucket).add('ResourceType', 'S3Bucket');
    cdk.Tags.of(inputBucket).add('Purpose', 'SecurityInputProfiles');

    // Documentation bucket for AWS service documentation
    const documentationBucket = new s3.Bucket(this, 'ServiceDocumentation', {
      bucketName: `gensec-aws-service-documentation-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(documentationBucket).add('gensec', 'true');
    cdk.Tags.of(documentationBucket).add('ResourceType', 'S3Bucket');
    cdk.Tags.of(documentationBucket).add('Purpose', 'ServiceDocumentation');

    // Deploy service mappings configuration file to input bucket
    new s3deploy.BucketDeployment(this, 'ServiceMappingsDeployment', {
      sources: [s3deploy.Source.asset('../configuration')],
      destinationBucket: inputBucket,
      destinationKeyPrefix: 'configuration/',
      include: ['service-mappings.json'],
      retainOnDelete: false,
    });

    // DynamoDB Tables - Reverse engineered from existing AWS account
    
    // Primary Security Control Library (current active table)
    const controlLibraryTable = new dynamodb.Table(this, 'SecurityControlLibrary2', {
      tableName: 'gensec-SecurityControlLibrary',
      partitionKey: { name: 'configuration_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(controlLibraryTable).add('gensec', 'true');
    cdk.Tags.of(controlLibraryTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(controlLibraryTable).add('Purpose', 'PrimarySecurityControlLibrary');

    // Primary Service Request Tracking (current active table)
    const serviceTrackingTable = new dynamodb.Table(this, 'ServiceRequestTracking2', {
      tableName: 'gensec-ServiceRequestTracking',
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(serviceTrackingTable).add('gensec', 'true');
    cdk.Tags.of(serviceTrackingTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(serviceTrackingTable).add('Purpose', 'PrimaryServiceRequestTracking');

    // AWS Service Actions Documentation Table
    const serviceActionsTable = new dynamodb.Table(this, 'AWSServiceActions', {
      tableName: 'gensec-AWSServiceActions', 
      partitionKey: { name: 'service_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'action_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(serviceActionsTable).add('gensec', 'true');
    cdk.Tags.of(serviceActionsTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(serviceActionsTable).add('Purpose', 'AWSServiceActionsDocumentation');

    // AWS Service Parameters Documentation Table
    const serviceParametersTable = new dynamodb.Table(this, 'AWSServiceParameters', {
      tableName: 'gensec-AWSServiceParameters',
      partitionKey: { name: 'service_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'parameter_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(serviceParametersTable).add('gensec', 'true');
    cdk.Tags.of(serviceParametersTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(serviceParametersTable).add('Purpose', 'AWSServiceParametersDocumentation');

    // AWS Service Inventory Table (discovered but empty)
    const serviceInventoryTable = new dynamodb.Table(this, 'AWSServiceInventory', {
      tableName: 'gensec-AWSServiceInventory',
      partitionKey: { name: 'service_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(serviceInventoryTable).add('gensec', 'true');
    cdk.Tags.of(serviceInventoryTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(serviceInventoryTable).add('Purpose', 'AWSServiceInventory');

    // Add GSI for service inventory
    serviceInventoryTable.addGlobalSecondaryIndex({
      indexName: 'ServiceNameIndex',
      partitionKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // AWS Service Resources Table (additional table found in AWS)
    const serviceResourcesTable = new dynamodb.Table(this, 'AWSServiceResources', {
      tableName: 'gensec-AWSServiceResources',
      partitionKey: { name: 'service_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'resource_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(serviceResourcesTable).add('gensec', 'true');
    cdk.Tags.of(serviceResourcesTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(serviceResourcesTable).add('Purpose', 'AWSServiceResourcesDocumentation');

    // Security Standards Library Table (additional table found in AWS)
    const securityStandardsLibraryTable = new dynamodb.Table(this, 'SecurityStandardsLibrary', {
      tableName: 'gensec-SecurityStandardsLibrary',
      partitionKey: { name: 'standard_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'control_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(securityStandardsLibraryTable).add('gensec', 'true');
    cdk.Tags.of(securityStandardsLibraryTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(securityStandardsLibraryTable).add('Purpose', 'SecurityStandardsLibrary');

    // Service Profile Library Table (additional table found in AWS)
    const serviceProfileLibraryTable = new dynamodb.Table(this, 'ServiceProfileLibrary', {
      tableName: 'gensec-ServiceProfileLibrary',
      partitionKey: { name: 'profile_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(serviceProfileLibraryTable).add('gensec', 'true');
    cdk.Tags.of(serviceProfileLibraryTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(serviceProfileLibraryTable).add('Purpose', 'ServiceProfileLibrary');

    // AWS Config Managed Rules Table
    const configManagedRulesTable = new dynamodb.Table(this, 'AWSConfigManagedRules', {
      tableName: 'gensec-AWSConfigManagedRules',
      partitionKey: { name: 'rule_name', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(configManagedRulesTable).add('gensec', 'true');
    cdk.Tags.of(configManagedRulesTable).add('ResourceType', 'DynamoDBTable');
    cdk.Tags.of(configManagedRulesTable).add('Purpose', 'AWSConfigManagedRules');

    // Add GSI for service-based queries
    configManagedRulesTable.addGlobalSecondaryIndex({
      indexName: 'ServiceNameIndex',
      partitionKey: { name: 'service_name', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Security Profile Processor Lambda Role with proper permissions
    const securityProfileProcessorRole = new iam.Role(this, 'SecurityProfileProcessorRole', {
      roleName: 'gensec-SecurityProfileProcessorRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    cdk.Tags.of(securityProfileProcessorRole).add('gensec', 'true');
    cdk.Tags.of(securityProfileProcessorRole).add('ResourceType', 'IAMRole');
    cdk.Tags.of(securityProfileProcessorRole).add('Purpose', 'SecurityProfileProcessorRole');

    // Add explicit CloudWatch Logs permissions (scoped to this function's log group)
    securityProfileProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-SecurityProfileProcessor:*`,
      ],
    }));

    // Add S3 permissions for SecurityProfileProcessor Lambda (gensec-SecurityProfileProcessor)
    securityProfileProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket',
      ],
      resources: [
        // CDK-managed buckets (proper resource references)
        inputBucket.bucketArn,
        `${inputBucket.bucketArn}/*`,
        outputBucket.bucketArn,
        `${outputBucket.bucketArn}/*`,
        documentationBucket.bucketArn,
        `${documentationBucket.bucketArn}/*`,
      ],
    }));

    // Add Step Functions permissions for SecurityProfileProcessor Lambda
    securityProfileProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'states:StartExecution',
        'states:DescribeExecution',
        'states:StopExecution',
      ],
      resources: [
        // Will be set after stateMachine is created
        `arn:aws:states:${this.region}:${this.account}:stateMachine:gensec-SecurityConfigWorkflow`,
        `arn:aws:states:${this.region}:${this.account}:stateMachine:gensec-SecurityConfigWorkflow:*`,
      ],
    }));

    // Add DynamoDB permissions for SecurityProfileProcessor Lambda (gensec-SecurityProfileProcessor)
    securityProfileProcessorRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:UpdateItem',
      ],
      resources: [
        // Primary security tables (for tracking and control)
        controlLibraryTable.tableArn,
        `${controlLibraryTable.tableArn}/index/*`,
        serviceTrackingTable.tableArn,
        `${serviceTrackingTable.tableArn}/index/*`,
        
        // Service profile and standards tables (for validation)
        serviceProfileLibraryTable.tableArn,
        `${serviceProfileLibraryTable.tableArn}/index/*`,
        securityStandardsLibraryTable.tableArn,
        `${securityStandardsLibraryTable.tableArn}/index/*`,
      ],
    }));

    // ========================================================================
    // IAM ROLES AND PERMISSIONS
    // ========================================================================
    // 
    // This section defines all IAM roles and their permissions for the security
    // configuration system. Each role follows the principle of least privilege.
    //
    // Role Overview:
    // 1. SecurityProfileProcessorRole - Processes S3 uploads, triggers workflows
    // 2. DocumentationManagerRole - Collects AWS service documentation 
    // 3. SecurityConfigurationHandlerRole - Main AI processing and analysis
    // 4. StepFunctionsWorkflowRole - Orchestrates the workflow execution
    //
    // Permission Categories:
    // - CloudWatch Logs: Function-specific log group access
    // - S3: Bucket-specific read/write access
    // - DynamoDB: Table-specific CRUD operations
    // - Bedrock: AI model invocation (foundation models with direct access)
    // - Step Functions: Workflow execution control
    // - VPC: Network access for external API calls
    // ========================================================================

    // Documentation Manager Lambda Role with comprehensive permissions
    const documentationManagerRole = new iam.Role(this, 'DocumentationManagerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });
    cdk.Tags.of(documentationManagerRole).add('gensec', 'true');
    cdk.Tags.of(documentationManagerRole).add('ResourceType', 'IAMRole');
    cdk.Tags.of(documentationManagerRole).add('Purpose', 'DocumentationManagerRole');

    // Add explicit CloudWatch Logs permissions (scoped to this function's log group)
    documentationManagerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-AWSServiceDocumentationManager:*`,
      ],
    }));

    // Add S3 permissions for DocumentationManager Lambda (gensec-AWSServiceDocumentationManager)
    documentationManagerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: [
        // CDK-managed buckets (proper resource references)
        inputBucket.bucketArn,
        `${inputBucket.bucketArn}/*`,
        outputBucket.bucketArn,
        `${outputBucket.bucketArn}/*`,
        documentationBucket.bucketArn,
        `${documentationBucket.bucketArn}/*`,
      ],
    }));

    // Add DynamoDB permissions for DocumentationManager Lambda (gensec-AWSServiceDocumentationManager)
    documentationManagerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
      ],
      resources: [
        // AWS service documentation tables (CDK-managed)
        serviceActionsTable.tableArn,
        `${serviceActionsTable.tableArn}/index/*`,
        serviceParametersTable.tableArn,
        `${serviceParametersTable.tableArn}/index/*`,
        serviceInventoryTable.tableArn,
        `${serviceInventoryTable.tableArn}/index/*`,
        serviceResourcesTable.tableArn,
        `${serviceResourcesTable.tableArn}/index/*`,
        
        // Additional service and security tables
        securityStandardsLibraryTable.tableArn,
        `${securityStandardsLibraryTable.tableArn}/index/*`,
        serviceProfileLibraryTable.tableArn,
        `${serviceProfileLibraryTable.tableArn}/index/*`,
      ],
    }));

    // ------------------------------------------------------------------------
    // BEDROCK PERMISSIONS - ALL REGIONS SUPPORT
    // ------------------------------------------------------------------------
    // Allows access to Bedrock models across all AWS regions for maximum
    // model availability and future-proofing as new models are released
    // in different regions (e.g., Nova Pro in us-east-1, Claude in us-west-2)
    // ------------------------------------------------------------------------

    // DocumentationManagerRole - Scoped Bedrock Access
    documentationManagerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        // Foundation models (direct access)
        `arn:aws:bedrock:*::foundation-model/*`,
        // Inference profiles (for models like Nova Pro)
        `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
      ],
    }));

    // Additional Bedrock permissions for agent operations
    documentationManagerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeAgent',
        'bedrock:GetAgent',
        'bedrock:GetAgentAlias',
      ],
      resources: [
        `arn:aws:bedrock:*:${this.account}:agent/*`,
        `arn:aws:bedrock:*:${this.account}:agent-alias/*/*`,
      ],
    }));

    // VPC for Lambda functions that need external internet access
    const vpc = new ec2.Vpc(this, 'SecuritySystemVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    cdk.Tags.of(vpc).add('gensec', 'true');
    cdk.Tags.of(vpc).add('ResourceType', 'VPC');
    cdk.Tags.of(vpc).add('Purpose', 'SecuritySystemVPC');

    // VPC Endpoints for AWS services to reduce NAT Gateway costs
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addInterfaceEndpoint('DynamoDBEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.DYNAMODB,
      privateDnsEnabled: false,  // DynamoDB doesn't support private DNS
    });

    vpc.addInterfaceEndpoint('BedrockRuntimeEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME,
    });

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Security System Lambda functions',
      allowAllOutbound: true,
    });
    cdk.Tags.of(lambdaSecurityGroup).add('gensec', 'true');
    cdk.Tags.of(lambdaSecurityGroup).add('ResourceType', 'SecurityGroup');
    cdk.Tags.of(lambdaSecurityGroup).add('Purpose', 'LambdaSecurityGroup');

    // ------------------------------------------------------------------------
    // SHARED BEDROCK CLIENT LAYER
    // ------------------------------------------------------------------------
    // Centralized Bedrock client with model switching and comprehensive logging
    // ------------------------------------------------------------------------
    
    const bedrockLayer = new lambda.LayerVersion(this, 'BedrockClientLayer', {
      layerVersionName: 'gensec-bedrock-client-layer',
      code: lambda.Code.fromAsset('../layers/bedrock-layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Centralized Bedrock client with model switching and comprehensive logging'
    });

    // ------------------------------------------------------------------------
    // STRANDS BEDROCK AGENT
    // ------------------------------------------------------------------------
    // Creates the Strands Agent for AWS security configuration analysis
    // ------------------------------------------------------------------------
    
    // IAM role for Strands Agent
    const strandsAgentRole = new iam.Role(this, 'StrandsAgentRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'IAM role for Strands Bedrock Agent',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess')
      ]
    });

    // GenSec Bedrock Agent
    const strandsAgent = new bedrock.CfnAgent(this, 'GenSecAgent', {
      agentName: 'GenSecAgent', // Meaningful name aligned with project
      description: 'GenSec Agent for AWS security configuration analysis and generation',
      foundationModel: 'us.anthropic.claude-sonnet-4-20250514-v1:0', // Use Claude 4 (matches bedrock layer)
      instruction: `You are a specialized agent for analyzing AWS service documentation and generating security configurations. 

When you receive a prompt with [Model: model-name] prefix, use that as guidance for your response style and capabilities:
- [Model: claude-4]: Use advanced reasoning and detailed analysis
- [Model: nova-pro]: Focus on concise, practical responses

Your primary tasks:
1. Extract IAM actions from AWS service authorization documentation
2. Extract CloudFormation parameters from AWS documentation  
3. Generate security controls and recommendations
4. Create infrastructure as code templates
5. Generate IAM models and policies

Always return responses in valid JSON format when requested.`,
      agentResourceRoleArn: strandsAgentRole.roleArn,
      idleSessionTtlInSeconds: 1800, // 30 minutes
    });

    // Strands Agent Alias
    const strandsAgentAlias = new bedrock.CfnAgentAlias(this, 'StrandsAgentAlias', {
      agentId: strandsAgent.attrAgentId,
      agentAliasName: 'PROD',
      description: 'Production alias for Strands Agent'
    });

    // Output the Agent ID and Alias ID for reference
    new cdk.CfnOutput(this, 'GenSecAgentId', {
      value: strandsAgent.attrAgentId,
      description: 'GenSec Agent ID'
    });

    new cdk.CfnOutput(this, 'GenSecAgentAliasId', {
      value: strandsAgentAlias.attrAgentAliasId,
      description: 'GenSec Agent Alias ID'
    });

    const documentationManager = new lambda.Function(this, 'DocumentationManager', {
      functionName: 'gensec-AWSServiceDocumentationManager',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/AWSServiceDocumentationManager'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: documentationManagerRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      layers: [
        layers.commonLayer,
        layers.requestsLayer,
        layers.webScrapingLayer,
        layers.mcpToolsLayer, // Add MCP tools layer
        bedrockLayer, // Add centralized Bedrock client layer
      ],
      environment: {
        // Strands Agent Configuration
        USE_STRANDS_AGENT: 'false', // Set to 'true' to enable Strands Agent (has 6-7K output limit)
        STRANDS_AGENT_ID: strandsAgent.attrAgentId,
        STRANDS_AGENT_ALIAS_ID: strandsAgentAlias.attrAgentAliasId,
        
        // MCP Configuration
        USE_MCP_DOCUMENTATION: 'false', // Set to 'true' to enable MCP (requires MCP server setup)
        MCP_SERVER_PATH: 'uvx', // Path to MCP server executable
        
        // DynamoDB table names (CDK-managed)
        DYNAMODB_TABLE_SERVICE_ACTIONS: serviceActionsTable.tableName,
        DYNAMODB_TABLE_SERVICE_PARAMETERS: serviceParametersTable.tableName,
        DYNAMODB_TABLE_SERVICE_INVENTORY: serviceInventoryTable.tableName,
        DYNAMODB_TABLE_SERVICE_RESOURCES: serviceResourcesTable.tableName,
        DYNAMODB_TABLE_SECURITY_STANDARDS: securityStandardsLibraryTable.tableName,
        DYNAMODB_TABLE_SERVICE_PROFILES: serviceProfileLibraryTable.tableName,
        
        // Documentation configuration
        DOCUMENTATION_TABLE_PREFIX: 'AWSService',
        DOCUMENTATION_BUCKET: documentationBucket.bucketName,
        
        // S3 buckets (CDK-managed)
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
        
        // Logging level
        LOG_LEVEL: 'INFO',
        
        // Force container refresh for service mappings update
        SERVICE_MAPPINGS_VERSION: '2025-12-22-quicksuite',
      },
    });
    cdk.Tags.of(documentationManager).add('gensec', 'true');
    cdk.Tags.of(documentationManager).add('ResourceType', 'LambdaFunction');
    cdk.Tags.of(documentationManager).add('Purpose', 'AWSServiceDocumentationManager');

    // ------------------------------------------------------------------------
    // SECURITY CONFIGURATION HANDLER ROLE
    // ------------------------------------------------------------------------
    // Main processing role for AI-powered security analysis and configuration
    // generation. Requires access to Bedrock AI, DynamoDB tables, and S3.
    // ------------------------------------------------------------------------
    
    const securityConfigHandlerRole = new iam.Role(this, 'SecurityConfigHandlerRole', {
      roleName: 'gensec-SecurityConfigurationHandlerRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });
    cdk.Tags.of(securityConfigHandlerRole).add('gensec', 'true');
    cdk.Tags.of(securityConfigHandlerRole).add('ResourceType', 'IAMRole');
    cdk.Tags.of(securityConfigHandlerRole).add('Purpose', 'SecurityConfigurationHandlerRole');

    // CloudWatch Logs - Function-specific log group access for all decomposed functions
    securityConfigHandlerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        // Decomposed Lambda function log groups
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-AnalyzeSecurityRequirements:*`,
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-GenerateSecurityControls:*`,
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-GenerateIaCTemplate:*`,
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-GenerateIAMModel:*`,
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/gensec-GenerateServiceProfile:*`,
      ],
    }));

    // SecurityConfigurationHandlerRole - Scoped Bedrock Access
    securityConfigHandlerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        // Foundation models (direct access)
        `arn:aws:bedrock:*::foundation-model/*`,
        // Inference profiles (for models like Nova Pro)
        `arn:aws:bedrock:*:${this.account}:inference-profile/*`,
      ],
    }));

    // Additional Bedrock permissions for agent operations
    securityConfigHandlerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeAgent',
        'bedrock:GetAgent',
        'bedrock:GetAgentAlias',
        'bedrock:ListKnowledgeBases',
        'bedrock:GetKnowledgeBase',
        'bedrock:RetrieveAndGenerate',
      ],
      resources: [
        `arn:aws:bedrock:*:${this.account}:agent/*`,
        `arn:aws:bedrock:*:${this.account}:agent-alias/*/*`,
        `arn:aws:bedrock:*:${this.account}:knowledge-base/*`,
      ],
    }));


    // DynamoDB - Scoped access to specific security configuration tables
    securityConfigHandlerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
      ],
      resources: [
        // Core Security Tables
        controlLibraryTable.tableArn,                    // Security control definitions
        `${controlLibraryTable.tableArn}/index/*`,
        serviceTrackingTable.tableArn,                   // Request tracking and audit
        `${serviceTrackingTable.tableArn}/index/*`,
        
        // AWS Service Documentation Tables
        serviceActionsTable.tableArn,                    // AWS service actions catalog
        `${serviceActionsTable.tableArn}/index/*`,
        serviceParametersTable.tableArn,                 // Service parameter definitions
        `${serviceParametersTable.tableArn}/index/*`,
        serviceInventoryTable.tableArn,                  // Service inventory and metadata
        `${serviceInventoryTable.tableArn}/index/*`,
        serviceResourcesTable.tableArn,                  // Service resource mappings
        `${serviceResourcesTable.tableArn}/index/*`,
        
        // Security Standards and Profiles
        securityStandardsLibraryTable.tableArn,         // Security standards library
        `${securityStandardsLibraryTable.tableArn}/index/*`,
        serviceProfileLibraryTable.tableArn,            // Service profile templates
        `${serviceProfileLibraryTable.tableArn}/index/*`,
        configManagedRulesTable.tableArn,               // AWS Config managed rules
        `${configManagedRulesTable.tableArn}/index/*`,
      ],
    }));

    // S3 - Read/write access to all system buckets
    securityConfigHandlerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',    // Read objects from buckets
        's3:PutObject',    // Write results and artifacts
        's3:ListBucket',   // List bucket contents
      ],
      resources: [
        // System Buckets
        outputBucket.bucketArn,                          // Generated security configurations
        `${outputBucket.bucketArn}/*`,
        inputBucket.bucketArn,                           // Input security profiles
        `${inputBucket.bucketArn}/*`,
        documentationBucket.bucketArn,                   // AWS service documentation
        `${documentationBucket.bucketArn}/*`,
      ],
    }));

    // ========================================================================
    // NEW DECOMPOSED LAMBDA FUNCTIONS FOR TESTING
    // ========================================================================

    // 1. AnalyzeSecurityRequirements Lambda
    const analyzeSecurityRequirementsLambda = new lambda.Function(this, 'AnalyzeSecurityRequirements', {
      functionName: 'gensec-AnalyzeSecurityRequirements',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/AnalyzeSecurityRequirements'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: securityConfigHandlerRole,
      layers: [
        layers.commonLayer,
        layers.dynamodbOperationsLayer,
        layers.validationLayer,
        bedrockLayer,
      ],
      environment: {
        // Strands Agent Configuration
        USE_STRANDS_AGENT: 'false', // Set to 'true' to enable Strands Agent
        STRANDS_AGENT_ID: strandsAgent.attrAgentId,
        STRANDS_AGENT_ALIAS_ID: strandsAgentAlias.attrAgentAliasId,
        
        DYNAMODB_TABLE_CONTROL_LIBRARY: controlLibraryTable.tableName,
        DYNAMODB_TABLE_SERVICE_TRACKING: serviceTrackingTable.tableName,
        DYNAMODB_TABLE_SERVICE_ACTIONS: serviceActionsTable.tableName,
        DYNAMODB_TABLE_SERVICE_PARAMETERS: serviceParametersTable.tableName,
        DYNAMODB_TABLE_CONFIG_MANAGED_RULES: configManagedRulesTable.tableName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
      },
    });

    // 2. GenerateSecurityControls Lambda
    const generateSecurityControlsLambda = new lambda.Function(this, 'GenerateSecurityControls', {
      functionName: 'gensec-GenerateSecurityControls',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/GenerateSecurityControls'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: securityConfigHandlerRole,
      layers: [
        layers.commonLayer,
        layers.dynamodbOperationsLayer,
        layers.validationLayer,
        bedrockLayer,
      ],
      environment: {
        // Strands Agent Configuration
        USE_STRANDS_AGENT: 'false', // Set to 'true' to enable Strands Agent
        STRANDS_AGENT_ID: strandsAgent.attrAgentId,
        STRANDS_AGENT_ALIAS_ID: strandsAgentAlias.attrAgentAliasId,
        
        DYNAMODB_TABLE_CONTROL_LIBRARY: controlLibraryTable.tableName,
        DYNAMODB_TABLE_SERVICE_ACTIONS: serviceActionsTable.tableName,
        DYNAMODB_TABLE_SERVICE_PARAMETERS: serviceParametersTable.tableName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
      },
    });

    // 3. GenerateIaCTemplate Lambda
    const generateIaCTemplateLambda = new lambda.Function(this, 'GenerateIaCTemplate', {
      functionName: 'gensec-GenerateIaCTemplate',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/GenerateIaCTemplate'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: securityConfigHandlerRole,
      layers: [
        layers.commonLayer,
        layers.dynamodbOperationsLayer,
        layers.validationLayer,
        bedrockLayer,
      ],
      environment: {
        // Strands Agent Configuration
        USE_STRANDS_AGENT: 'false', // Set to 'true' to enable Strands Agent
        STRANDS_AGENT_ID: strandsAgent.attrAgentId,
        STRANDS_AGENT_ALIAS_ID: strandsAgentAlias.attrAgentAliasId,
        
        DYNAMODB_TABLE_CONTROL_LIBRARY: controlLibraryTable.tableName,
        DYNAMODB_TABLE_SERVICE_PARAMETERS: serviceParametersTable.tableName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
      },
    });

    // 4. GenerateIAMModel Lambda
    const generateIAMModelLambda = new lambda.Function(this, 'GenerateIAMModel', {
      functionName: 'gensec-GenerateIAMModel',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/GenerateIAMModel'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: securityConfigHandlerRole,
      layers: [
        layers.commonLayer,
        layers.dynamodbOperationsLayer,
        layers.validationLayer,
        bedrockLayer,
      ],
      environment: {
        // Strands Agent Configuration
        USE_STRANDS_AGENT: 'false', // Set to 'true' to enable Strands Agent
        STRANDS_AGENT_ID: strandsAgent.attrAgentId,
        STRANDS_AGENT_ALIAS_ID: strandsAgentAlias.attrAgentAliasId,
        
        DYNAMODB_TABLE_SERVICE_ACTIONS: serviceActionsTable.tableName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
      },
    });

    // 5. GenerateServiceProfile Lambda
    const generateServiceProfileLambda = new lambda.Function(this, 'GenerateServiceProfile', {
      functionName: 'gensec-GenerateServiceProfile',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/GenerateServiceProfile'),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      role: securityConfigHandlerRole,
      layers: [
        layers.commonLayer,
        layers.dynamodbOperationsLayer,
        layers.validationLayer,
        bedrockLayer,
      ],
      environment: {
        // Strands Agent Configuration
        USE_STRANDS_AGENT: 'false', // Set to 'true' to enable Strands Agent
        STRANDS_AGENT_ID: strandsAgent.attrAgentId,
        STRANDS_AGENT_ALIAS_ID: strandsAgentAlias.attrAgentAliasId,
        
        DYNAMODB_TABLE_SERVICE_ACTIONS: serviceActionsTable.tableName,
        DYNAMODB_TABLE_SERVICE_PARAMETERS: serviceParametersTable.tableName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
      },
    });

    // Add tags to all new Lambda functions
    [analyzeSecurityRequirementsLambda, generateSecurityControlsLambda, generateIaCTemplateLambda, 
     generateIAMModelLambda, generateServiceProfileLambda].forEach(func => {
      cdk.Tags.of(func).add('gensec', 'true');
      cdk.Tags.of(func).add('ResourceType', 'LambdaFunction');
      cdk.Tags.of(func).add('Purpose', 'DecomposedSecurityFunction');
    });

    // Grant documentation manager permissions to documentation bucket
    // Permissions are handled in the role definition above

    // ========================================================================
    // STEP FUNCTIONS WORKFLOW (DECOMPOSED ARCHITECTURE)
    // ========================================================================

    // Create log group for Step Functions
    const stepFunctionsLogGroup = new logs.LogGroup(this, 'StepFunctionsLogGroup', {
      logGroupName: '/aws/vendedlogs/states/gensec-SecurityConfigWorkflow-Logs',
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(stepFunctionsLogGroup).add('gensec', 'true');
    cdk.Tags.of(stepFunctionsLogGroup).add('ResourceType', 'LogGroup');
    cdk.Tags.of(stepFunctionsLogGroup).add('Purpose', 'StepFunctionsLogGroup');

    // Step Functions Role with proper permissions (matching AWS)
    const stepFunctionsRole = new iam.Role(this, 'StepFunctionsRole', {
      roleName: 'gensec-SecurityConfigWorkflowRole',
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaRole'),
      ],
    });
    cdk.Tags.of(stepFunctionsRole).add('gensec', 'true');
    cdk.Tags.of(stepFunctionsRole).add('ResourceType', 'IAMRole');
    cdk.Tags.of(stepFunctionsRole).add('Purpose', 'StepFunctionsRole');

    // Lambda invoke permissions will be added after all Lambda functions are created

    // Add CloudWatch Logs permissions for Step Functions (scoped to Step Functions log groups)
    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
      ],
      resources: [
        stepFunctionsLogGroup.logGroupArn,
        `${stepFunctionsLogGroup.logGroupArn}:*`,
      ],
    }));

    // Add X-Ray permissions for Step Functions tracing (scoped to this account/region)
    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords',
      ],
      resources: [
        `arn:aws:xray:${this.region}:${this.account}:trace/*`,
      ],
    }));

    // X-Ray sampling rules (global resources)
    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:GetSamplingRules',
        'xray:GetSamplingTargets',
      ],
      resources: ['*'], // These are global resources without specific ARNs
    }));

    // Add Lambda invoke permissions for Step Functions workflow
    stepFunctionsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction',
      ],
      resources: [
        documentationManager.functionArn,
        // OLD: securityConfigHandler.functionArn, // COMMENTED OUT - replaced by decomposed functions
        //  decomposed Lambda functions
        analyzeSecurityRequirementsLambda.functionArn,
        generateSecurityControlsLambda.functionArn,
        generateIaCTemplateLambda.functionArn,
        generateIAMModelLambda.functionArn,
        generateServiceProfileLambda.functionArn,
      ],
    }));

    // Create Step Functions tasks using the decomposed Lambda functions
    const analyzeRequirements = new stepfunctionsTasks.LambdaInvoke(this, 'AnalyzeRequirementsTask', {
      lambdaFunction: analyzeSecurityRequirementsLambda,
      resultPath: '$.analysisResult',
      payload: stepfunctions.TaskInput.fromObject({
        'securityProfile.$': '$.securityProfile',
        'serviceRequest.$': '$.serviceRequest',
        'serviceDocumentation.$': '$.serviceDocumentation.Payload',
      }),
    });

    const generateSecurityControls = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateSecurityControlsTask', {
      lambdaFunction: generateSecurityControlsLambda,
      resultPath: '$.controlsResult',
      payload: stepfunctions.TaskInput.fromObject({
        'requestId.$': '$.serviceRequest.requestId',
        'serviceId.$': '$.serviceRequest.serviceId',
        'analysisResult.$': '$.analysisResult',
        'serviceDocumentation.$': '$.serviceDocumentation.Payload',
      }),
    });

    const generateIaCTemplate = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateIaCTemplateTask', {
      lambdaFunction: generateIaCTemplateLambda,
      resultPath: '$.templateResult',
      payload: stepfunctions.TaskInput.fromObject({
        'requestId.$': '$.serviceRequest.requestId',
        'serviceId.$': '$.serviceRequest.serviceId',
        'analysisResult.$': '$.analysisResult',
        'controlsResult.$': '$.controlsResult',
        'serviceDocumentation.$': '$.serviceDocumentation.Payload',
      }),
    });

    const generateServiceProfile = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateServiceProfileTask', {
      lambdaFunction: generateServiceProfileLambda,
      resultPath: '$.profileResult',
      payload: stepfunctions.TaskInput.fromObject({
        'requestId.$': '$.serviceRequest.requestId',
        'serviceId.$': '$.serviceRequest.serviceId',
        'serviceDocumentation.$': '$.serviceDocumentation.Payload',
      }),
    });

    const generateIAMModel = new stepfunctionsTasks.LambdaInvoke(this, 'GenerateIAMModelTask', {
      lambdaFunction: generateIAMModelLambda,
      resultPath: '$.iamModelResult',
      payload: stepfunctions.TaskInput.fromObject({
        'requestId.$': '$.serviceRequest.requestId',
        'serviceId.$': '$.serviceRequest.serviceId',
        'serviceDocumentation.$': '$.serviceDocumentation.Payload',
      }),
    });

    const workflowSucceeded = new stepfunctions.Succeed(this, 'WorkflowSucceeded');
    const workflowFailed = new stepfunctions.Fail(this, 'WorkflowFailed', {
      error: 'WorkflowFailure',
      cause: ' workflow execution failed. Check the execution history and CloudWatch logs for details.',
    });

    // Create separate service documentation failed state
    const serviceDocumentationFailed = new stepfunctions.Fail(this, 'ServiceDocumentationFailed', {
      error: 'ServiceDocumentationFailure',
      cause: 'Service documentation validation failed. Service documentation must have either valid actions or parameters.',
    });

    // Create separate ValidateAndCollectServiceData for new workflow
    const validateAndCollectData = new stepfunctionsTasks.LambdaInvoke(this, 'ValidateAndCollectServiceData', {
      lambdaFunction: documentationManager,
      resultPath: '$.serviceDocumentation',
      payload: stepfunctions.TaskInput.fromObject({
        action: 'ValidateAndCollectServiceData',
        input: {
          'serviceId.$': '$.serviceRequest.serviceId',
          'service.$': '$.serviceRequest.services[0].serviceName',
        },
      }),
      taskTimeout: stepfunctions.Timeout.duration(cdk.Duration.minutes(15)),
    });

    // Create Choice state for service documentation check (reuse existing logic)
    const checkServiceDocumentation = new stepfunctions.Choice(this, 'CheckServiceDocumentation')
      .when(stepfunctions.Condition.or(
        // Single service with actions
        stepfunctions.Condition.and(
          stepfunctions.Condition.numberEquals('$.serviceDocumentation.Payload.statusCode', 200),
          stepfunctions.Condition.isPresent('$.serviceDocumentation.Payload.body.actions_count'),
          stepfunctions.Condition.numberGreaterThan('$.serviceDocumentation.Payload.body.actions_count', 0)
        ),
        // Parent service with total actions
        stepfunctions.Condition.and(
          stepfunctions.Condition.numberEquals('$.serviceDocumentation.Payload.statusCode', 200),
          stepfunctions.Condition.isPresent('$.serviceDocumentation.Payload.body.total_actions_count'),
          stepfunctions.Condition.numberGreaterThan('$.serviceDocumentation.Payload.body.total_actions_count', 0)
        ),
        // Single service with parameters
        stepfunctions.Condition.and(
          stepfunctions.Condition.numberEquals('$.serviceDocumentation.Payload.statusCode', 200),
          stepfunctions.Condition.isPresent('$.serviceDocumentation.Payload.body.parameters_count'),
          stepfunctions.Condition.numberGreaterThan('$.serviceDocumentation.Payload.body.parameters_count', 0)
        ),
        // Parent service with total parameters
        stepfunctions.Condition.and(
          stepfunctions.Condition.numberEquals('$.serviceDocumentation.Payload.statusCode', 200),
          stepfunctions.Condition.isPresent('$.serviceDocumentation.Payload.body.total_parameters_count'),
          stepfunctions.Condition.numberGreaterThan('$.serviceDocumentation.Payload.body.total_parameters_count', 0)
        ),
        // Any successful status
        stepfunctions.Condition.and(
          stepfunctions.Condition.numberEquals('$.serviceDocumentation.Payload.statusCode', 200),
          stepfunctions.Condition.stringEquals('$.serviceDocumentation.Payload.body.status', 'SUCCESS')
        )
      ), analyzeRequirements)
      .otherwise(serviceDocumentationFailed);

    // Configure error handling and retries for new tasks
    // Configure error handling and retries
    const retryConfig = {
      errors: [
        'States.TaskFailed',
        'Lambda.ServiceException', 
        'Lambda.AWSLambdaException',
        'Lambda.SdkClientException',
      ],
      interval: cdk.Duration.seconds(2),
      maxAttempts: 3,
      backoffRate: 2,
    };

    [validateAndCollectData, analyzeRequirements, generateSecurityControls, generateIaCTemplate, 
     generateServiceProfile, generateIAMModel].forEach(task => {
      task.addRetry(retryConfig);
      task.addCatch(workflowFailed, { resultPath: '$.error' });
    });

    // Create new Step Functions workflow definition
    const setDefaultLogLevel = new stepfunctions.Pass(this, 'SetDefaultLogLevel', {
      parameters: {
        'logLevel': 'INFO',
        'securityProfile.$': '$.securityProfile',
        'serviceRequest.$': '$.serviceRequest'
      }
    });

    const debugState = new stepfunctions.Pass(this, 'DebugState', {
      parameters: {
        debug: {
          'timestamp.$': '$$.State.EnteredTime',
          inputData: {
            'securityProfile.$': '$.securityProfile',
            'serviceRequest.$': '$.serviceRequest',
            'serviceDocumentation.$': '$.serviceDocumentation',
          },
        },
      },
      resultPath: '$.debug',
    });

    const validateInputData = new stepfunctions.Pass(this, 'ValidateInputData', {
      inputPath: '$',
    });

    const definition = setDefaultLogLevel
      .next(validateAndCollectData)
      .next(debugState)
      .next(validateInputData)
      .next(checkServiceDocumentation);

    analyzeRequirements
      .next(generateSecurityControls)
      .next(generateIaCTemplate)
      .next(generateIAMModel)
      .next(generateServiceProfile)
      .next(workflowSucceeded);

    // Create Step Functions state machine
    const stateMachine = new stepfunctions.StateMachine(this, 'SecurityConfigWorkflow', {
      stateMachineName: 'gensec-SecurityConfigWorkflow',
      definition: definition,
      timeout: cdk.Duration.hours(2), // Increased from 30 minutes to handle parent service processing
      tracingEnabled: true,
      role: stepFunctionsRole,  // Reuse existing role with updated permissions
      logs: {
        destination: stepFunctionsLogGroup,
        level: stepfunctions.LogLevel.ALL,
        includeExecutionData: false,
      },
    });
    cdk.Tags.of(stateMachine).add('gensec', 'true');
    cdk.Tags.of(stateMachine).add('ResourceType', 'StateMachine');
    cdk.Tags.of(stateMachine).add('Purpose', 'SecurityConfigWorkflow');

    // ========================================================================
    // IAM PERMISSIONS SUMMARY - LEAST PRIVILEGE IMPLEMENTATION
    // ========================================================================
    // All IAM roles follow strict least privilege with resource-scoped access:
    //
    // ✅ DocumentationManagerRole:
    //    - CloudWatch Logs: /aws/lambda/gensec-AWSServiceDocumentationManager:*
    //    - S3: Specific bucket ARNs (input, output, documentation)
    //    - DynamoDB: Service documentation tables only with specific actions
    //    - Bedrock: InvokeModel on foundation-model/* and inference-profile/*
    //    - Bedrock Agent: InvokeAgent, GetAgent, GetAgentAlias on account resources
    //    - VPC: Managed policy for external documentation access
    //
    // ✅ SecurityConfigurationHandlerRole (shared by 5 decomposed functions):
    //    - CloudWatch Logs: Function-specific log groups for each decomposed function
    //    - Bedrock: InvokeModel + agent operations on account-scoped resources
    //    - DynamoDB: Specific CRUD actions on all security/service tables + indexes
    //    - S3: GetObject, PutObject, ListBucket on system buckets only
    //
    // ✅ StepFunctionsWorkflowRole:
    //    - Lambda: InvokeFunction on specific workflow function ARNs
    //    - CloudWatch Logs: Step Functions log group only
    //    - X-Ray: PutTraceSegments on account traces + global sampling rules
    //
    // ✅ SecurityProfileProcessorRole:
    //    - CloudWatch Logs: /aws/lambda/gensec-SecurityProfileProcessor:*
    //    - S3: Specific bucket ARNs (input, output, documentation)
    //    - Step Functions: StartExecution, DescribeExecution on workflow ARN
    //    - DynamoDB: Specific actions on security control and tracking tables
    // ========================================================================

    // Security Profile Processor Lambda (needs state machine ARN)
    const securityProfileProcessor = new lambda.Function(this, 'SecurityProfileProcessor', {
      functionName: 'gensec-SecurityProfileProcessor',
      runtime: lambda.Runtime.PYTHON_3_10,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambda/SecurityProfileProcessor'),
      timeout: cdk.Duration.minutes(3),
      memorySize: 128,
      role: securityProfileProcessorRole,
      layers: [
        layers.commonLayer,
      ],
      environment: {
        // Step Functions State Machine ARN
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        
        // Primary DynamoDB tables (current active tables)
        DYNAMODB_TABLE_CONTROL_LIBRARY: controlLibraryTable.tableName,
        DYNAMODB_TABLE_SERVICE_TRACKING: serviceTrackingTable.tableName,
        
        // Service profile and standards tables
        DYNAMODB_TABLE_SERVICE_PROFILES: serviceProfileLibraryTable.tableName,
        DYNAMODB_TABLE_SECURITY_STANDARDS: securityStandardsLibraryTable.tableName,
        
        // S3 buckets (CDK-managed)
        S3_INPUT_BUCKET: inputBucket.bucketName,
        S3_OUTPUT_BUCKET: outputBucket.bucketName,
        S3_DOCUMENTATION_BUCKET: documentationBucket.bucketName,
      },
    });
    cdk.Tags.of(securityProfileProcessor).add('gensec', 'true');
    cdk.Tags.of(securityProfileProcessor).add('ResourceType', 'LambdaFunction');
    cdk.Tags.of(securityProfileProcessor).add('Purpose', 'SecurityProfileProcessor');

    // Add S3 trigger for SecurityProfileProcessor
    inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(securityProfileProcessor)
    );

    // Grant permissions for SecurityProfileProcessor
    inputBucket.grantReadWrite(securityProfileProcessor);
    // stateMachine.grantStartExecution(securityProfileProcessor); // OLD - commented out
    stateMachine.grantStartExecution(securityProfileProcessor);
    
    // Add CloudWatch metrics and alarms
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Security Configuration Workflow State Machine ARN (Decomposed Architecture)',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for Security System',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: 'Security Group ID for Lambda functions',
    });

    new cdk.CfnOutput(this, 'ControlLibraryTableName', {
      value: controlLibraryTable.tableName,
      description: 'Primary Security Control Library DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceTrackingTableName', {
      value: serviceTrackingTable.tableName,
      description: 'Primary Service Request Tracking DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceActionsTableName', {
      value: serviceActionsTable.tableName,
      description: 'AWS Service Actions Documentation DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceParametersTableName', {
      value: serviceParametersTable.tableName,
      description: 'AWS Service Parameters Documentation DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceInventoryTableName', {
      value: serviceInventoryTable.tableName,
      description: 'AWS Service Inventory DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceResourcesTableName', {
      value: serviceResourcesTable.tableName,
      description: 'AWS Service Resources Documentation DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'SecurityStandardsLibraryTableName', {
      value: securityStandardsLibraryTable.tableName,
      description: 'Security Standards Library DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ServiceProfileLibraryTableName', {
      value: serviceProfileLibraryTable.tableName,
      description: 'Service Profile Library DynamoDB Table Name',
    });
  }
}
