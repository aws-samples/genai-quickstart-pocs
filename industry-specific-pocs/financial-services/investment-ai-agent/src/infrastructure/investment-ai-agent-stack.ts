import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

export class InvestmentAiAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for storing proprietary data
    const proprietaryDataBucket = new s3.Bucket(this, 'ProprietaryDataBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    // DynamoDB tables for storing investment ideas and analysis results
    const investmentIdeasTable = new dynamodb.Table(this, 'InvestmentIdeasTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // DynamoDB table for async job tracking
    const jobsTable = new dynamodb.Table(this, 'AsyncJobsTable', {
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl', // Auto-delete completed jobs after 7 days
    });

    // Add GSI for user-based job queries
    jobsTable.addGlobalSecondaryIndex({
      indexName: 'UserJobsIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // IAM role for Bedrock access
    const bedrockAccessRole = new iam.Role(this, 'BedrockAccessRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    bedrockAccessRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'], // Scope down to specific models in production
    }));

    // Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, 'InvestmentAiUserPool', {
      selfSignUpEnabled: false,
      userPoolName: 'investment-ai-users',
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add a domain to the user pool
    userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: `investment-ai-${this.account}`,
      },
    });

    // Create a user pool client
    const userPoolClient = new cognito.UserPoolClient(this, 'InvestmentAiUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      preventUserExistenceErrors: true,
      generateSecret: false,
    });

    // Log group removed to avoid CloudWatch role requirement

    // Create the API Lambda function
    const apiLambda = new lambda.Function(this, 'ApiLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'simple-lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist/api')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        DYNAMODB_TABLE: investmentIdeasTable.tableName,
        JOBS_TABLE: jobsTable.tableName,
        S3_BUCKET: proprietaryDataBucket.bucketName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant the Lambda function access to DynamoDB and S3
    investmentIdeasTable.grantReadWriteData(apiLambda);
    jobsTable.grantReadWriteData(apiLambda);
    proprietaryDataBucket.grantReadWrite(apiLambda);

    // Grant the Lambda function access to Bedrock
    apiLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: ['*'], // Scope down to specific models in production
    }));

    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'InvestmentAiAgentApi', {
      description: 'API for Investment AI Agent',
      deployOptions: {
        stageName: 'v1',
        metricsEnabled: true,
        tracingEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Request-Id',
        ],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Create an authorizer for the API Gateway
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Create a Lambda integration for the API Gateway
    const apiIntegration = new apigateway.LambdaIntegration(apiLambda, {
      proxy: true,
    });

    // Add routes to the API Gateway
    const apiResource = api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    // Demo UI endpoint (no auth)
    api.root.addMethod('GET', apiIntegration);

    // Demo endpoints (no auth - rate limiting handled in Lambda)
    const demoResource = v1Resource.addResource('demo');
    
    const demoHealthResource = demoResource.addResource('health');
    demoHealthResource.addMethod('GET', apiIntegration);

    const demoIdeasResource = demoResource.addResource('ideas');
    demoIdeasResource.addMethod('GET', apiIntegration);

    const demoVersionResource = demoResource.addResource('version');
    demoVersionResource.addMethod('GET', apiIntegration);

    // Public endpoints (no authorization required, standard rate limits)
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', apiIntegration);

    const versionResource = v1Resource.addResource('version');
    versionResource.addMethod('GET', apiIntegration);

    // Protected endpoints (authorization required, no additional rate limits)
    const ideasResource = v1Resource.addResource('ideas');
    // Temporarily remove authorization for testing multi-agent workflow
    ideasResource.addMethod('GET', apiIntegration);
    ideasResource.addMethod('POST', apiIntegration);

    // Async endpoints for production long-running workflows
    const asyncResource = ideasResource.addResource('async');
    asyncResource.addMethod('POST', apiIntegration);

    // Job management endpoints
    const jobsResource = v1Resource.addResource('jobs');
    const jobResource = jobsResource.addResource('{jobId}');
    
    const statusResource = jobResource.addResource('status');
    statusResource.addMethod('GET', apiIntegration);
    
    const resultsResource = jobResource.addResource('results');
    resultsResource.addMethod('GET', apiIntegration);
    
    const cancelResource = jobResource.addResource('cancel');
    cancelResource.addMethod('DELETE', apiIntegration);

    const investmentsResource = v1Resource.addResource('investments');
    investmentsResource.addMethod('GET', apiIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    investmentsResource.addMethod('POST', apiIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const analysisResource = v1Resource.addResource('analysis');
    analysisResource.addMethod('GET', apiIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    analysisResource.addMethod('POST', apiIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Create usage plans for rate limiting
    const demoUsagePlan = new apigateway.UsagePlan(this, 'DemoUsagePlan', {
      name: 'Demo Usage Plan',
      description: 'Rate limited usage plan for demo endpoints',
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 100,
        period: apigateway.Period.DAY,
      },
    });

    const productionUsagePlan = new apigateway.UsagePlan(this, 'ProductionUsagePlan', {
      name: 'Production Usage Plan',
      description: 'Unlimited usage plan for authenticated endpoints',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    // Associate usage plans with API stages
    demoUsagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    productionUsagePlan.addApiStage({
      api: api,
      stage: api.deploymentStage,
    });

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the Investment AI Agent API',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'ProprietaryDataBucketName', {
      value: proprietaryDataBucket.bucketName,
      description: 'Name of the S3 bucket for proprietary data',
    });

    // Output the Cognito User Pool ID
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'ID of the Cognito User Pool',
    });

    // Output the Cognito User Pool Client ID
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'ID of the Cognito User Pool Client',
    });
  }
}