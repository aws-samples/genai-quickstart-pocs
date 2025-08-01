import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
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

    // Create a log group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create the API Lambda function
    const apiLambda = new lambda.Function(this, 'ApiLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist/api')),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
        DYNAMODB_TABLE: investmentIdeasTable.tableName,
        S3_BUCKET: proprietaryDataBucket.bucketName,
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant the Lambda function access to DynamoDB and S3
    investmentIdeasTable.grantReadWriteData(apiLambda);
    proprietaryDataBucket.grantReadWrite(apiLambda);

    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'InvestmentAiAgentApi', {
      description: 'API for Investment AI Agent',
      deployOptions: {
        stageName: 'v1',
        accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
        tracingEnabled: true,
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

    // Public endpoints (no authorization required)
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', apiIntegration);

    const versionResource = v1Resource.addResource('version');
    versionResource.addMethod('GET', apiIntegration);

    // Protected endpoints (authorization required)
    const ideasResource = v1Resource.addResource('ideas');
    ideasResource.addMethod('GET', apiIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    ideasResource.addMethod('POST', apiIntegration, {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

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