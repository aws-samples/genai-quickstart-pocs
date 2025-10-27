"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentAiAgentStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const path = __importStar(require("path"));
class InvestmentAiAgentStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.InvestmentAiAgentStack = InvestmentAiAgentStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1haS1hZ2VudC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pbmZyYXN0cnVjdHVyZS9pbnZlc3RtZW50LWFpLWFnZW50LXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLCtEQUFpRDtBQUNqRCx1RUFBeUQ7QUFDekQseURBQTJDO0FBQzNDLG1FQUFxRDtBQUNyRCx1REFBeUM7QUFDekMsaUVBQW1EO0FBQ25ELDJDQUE2QjtBQUU3QixNQUFhLHNCQUF1QixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQ25ELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIseUNBQXlDO1FBQ3pDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSx1QkFBdUIsRUFBRTtZQUN6RSxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1lBQ3ZDLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxTQUFTLEVBQUUsSUFBSTtTQUNoQixDQUFDLENBQUM7UUFFSCxvRUFBb0U7UUFDcEUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQzVFLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENB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QUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDJCQUEyQixFQUFFO1lBQ25ELEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxVQUFVO1lBQ3ZDLFdBQVcsRUFBRSw0Q0FBNEM7U0FDMUQsQ0FBQyxDQUFDO1FBRUgsa0NBQWtDO1FBQ2xDLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVTtZQUMxQixXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztRQUVILHlDQUF5QztRQUN6QyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxjQUFjLENBQUMsZ0JBQWdCO1lBQ3RDLFdBQVcsRUFBRSxvQ0FBb0M7U0FDbEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeFJELHdEQXdSQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjbGFzcyBJbnZlc3RtZW50QWlBZ2VudFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gUzMgYnVja2V0IGZvciBzdG9yaW5nIHByb3ByaWV0YXJ5IGRhdGFcbiAgICBjb25zdCBwcm9wcmlldGFyeURhdGFCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdQcm9wcmlldGFyeURhdGFCdWNrZXQnLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vREIgdGFibGVzIGZvciBzdG9yaW5nIGludmVzdG1lbnQgaWRlYXMgYW5kIGFuYWx5c2lzIHJlc3VsdHNcbiAgICBjb25zdCBpbnZlc3RtZW50SWRlYXNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnSW52ZXN0bWVudElkZWFzVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG5cbiAgICAvLyBEeW5hbW9EQiB0YWJsZSBmb3IgYXN5bmMgam9iIHRyYWNraW5nXG4gICAgY29uc3Qgam9ic1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdBc3luY0pvYnNUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnam9iSWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIHRpbWVUb0xpdmVBdHRyaWJ1dGU6ICd0dGwnLCAvLyBBdXRvLWRlbGV0ZSBjb21wbGV0ZWQgam9icyBhZnRlciA3IGRheXNcbiAgICB9KTtcblxuICAgIC8vIEFkZCBHU0kgZm9yIHVzZXItYmFzZWQgam9iIHF1ZXJpZXNcbiAgICBqb2JzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnVXNlckpvYnNJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdjcmVhdGVkQXQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIH0pO1xuXG4gICAgLy8gSUFNIHJvbGUgZm9yIEJlZHJvY2sgYWNjZXNzXG4gICAgY29uc3QgYmVkcm9ja0FjY2Vzc1JvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0JlZHJvY2tBY2Nlc3NSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2xhbWJkYS5hbWF6b25hd3MuY29tJyksXG4gICAgfSk7XG5cbiAgICBiZWRyb2NrQWNjZXNzUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgXSxcbiAgICAgIHJlc291cmNlczogWycqJ10sIC8vIFNjb3BlIGRvd24gdG8gc3BlY2lmaWMgbW9kZWxzIGluIHByb2R1Y3Rpb25cbiAgICB9KSk7XG5cbiAgICAvLyBDb2duaXRvIFVzZXIgUG9vbCBmb3IgYXV0aGVudGljYXRpb25cbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdJbnZlc3RtZW50QWlVc2VyUG9vbCcsIHtcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiBmYWxzZSxcbiAgICAgIHVzZXJQb29sTmFtZTogJ2ludmVzdG1lbnQtYWktdXNlcnMnLFxuICAgICAgc3RhbmRhcmRBdHRyaWJ1dGVzOiB7XG4gICAgICAgIGVtYWlsOiB7IHJlcXVpcmVkOiB0cnVlLCBtdXRhYmxlOiB0cnVlIH0sXG4gICAgICB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiAxMixcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IHRydWUsXG4gICAgICB9LFxuICAgICAgYWNjb3VudFJlY292ZXJ5OiBjb2duaXRvLkFjY291bnRSZWNvdmVyeS5FTUFJTF9PTkxZLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGEgZG9tYWluIHRvIHRoZSB1c2VyIHBvb2xcbiAgICB1c2VyUG9vbC5hZGREb21haW4oJ0NvZ25pdG9Eb21haW4nLCB7XG4gICAgICBjb2duaXRvRG9tYWluOiB7XG4gICAgICAgIGRvbWFpblByZWZpeDogYGludmVzdG1lbnQtYWktJHt0aGlzLmFjY291bnR9YCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYSB1c2VyIHBvb2wgY2xpZW50XG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAnSW52ZXN0bWVudEFpVXNlclBvb2xDbGllbnQnLCB7XG4gICAgICB1c2VyUG9vbCxcbiAgICAgIGF1dGhGbG93czoge1xuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIHVzZXJTcnA6IHRydWUsXG4gICAgICB9LFxuICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgY29nbml0by5Vc2VyUG9vbENsaWVudElkZW50aXR5UHJvdmlkZXIuQ09HTklUTyxcbiAgICAgIF0sXG4gICAgICBwcmV2ZW50VXNlckV4aXN0ZW5jZUVycm9yczogdHJ1ZSxcbiAgICAgIGdlbmVyYXRlU2VjcmV0OiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIExvZyBncm91cCByZW1vdmVkIHRvIGF2b2lkIENsb3VkV2F0Y2ggcm9sZSByZXF1aXJlbWVudFxuXG4gICAgLy8gQ3JlYXRlIHRoZSBBUEkgTGFtYmRhIGZ1bmN0aW9uXG4gICAgY29uc3QgYXBpTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQXBpTGFtYmRhRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdzaW1wbGUtbGFtYmRhLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9kaXN0L2FwaScpKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEyMCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBOT0RFX0VOVjogJ3Byb2R1Y3Rpb24nLFxuICAgICAgICBDT0dOSVRPX1VTRVJfUE9PTF9JRDogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgICAgQ09HTklUT19DTElFTlRfSUQ6IHVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAgIERZTkFNT0RCX1RBQkxFOiBpbnZlc3RtZW50SWRlYXNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEpPQlNfVEFCTEU6IGpvYnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFMzX0JVQ0tFVDogcHJvcHJpZXRhcnlEYXRhQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBhY2Nlc3MgdG8gRHluYW1vREIgYW5kIFMzXG4gICAgaW52ZXN0bWVudElkZWFzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFwaUxhbWJkYSk7XG4gICAgam9ic1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGEpO1xuICAgIHByb3ByaWV0YXJ5RGF0YUJ1Y2tldC5ncmFudFJlYWRXcml0ZShhcGlMYW1iZGEpO1xuXG4gICAgLy8gR3JhbnQgdGhlIExhbWJkYSBmdW5jdGlvbiBhY2Nlc3MgdG8gQmVkcm9ja1xuICAgIGFwaUxhbWJkYS5hZGRUb1JvbGVQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLCAvLyBTY29wZSBkb3duIHRvIHNwZWNpZmljIG1vZGVscyBpbiBwcm9kdWN0aW9uXG4gICAgfSkpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0ludmVzdG1lbnRBaUFnZW50QXBpJywge1xuICAgICAgZGVzY3JpcHRpb246ICdBUEkgZm9yIEludmVzdG1lbnQgQUkgQWdlbnQnLFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6ICd2MScsXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICB0cmFjaW5nRW5hYmxlZDogZmFsc2UsXG4gICAgICB9LFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZScsXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BcGktS2V5JyxcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgICAgICdYLVJlcXVlc3QtSWQnLFxuICAgICAgICBdLFxuICAgICAgICBtYXhBZ2U6IGNkay5EdXJhdGlvbi5kYXlzKDEpLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhbiBhdXRob3JpemVyIGZvciB0aGUgQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0FwaUF1dGhvcml6ZXInLCB7XG4gICAgICBjb2duaXRvVXNlclBvb2xzOiBbdXNlclBvb2xdLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGEgTGFtYmRhIGludGVncmF0aW9uIGZvciB0aGUgQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFwaUxhbWJkYSwge1xuICAgICAgcHJveHk6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgcm91dGVzIHRvIHRoZSBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaVJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FwaScpO1xuICAgIGNvbnN0IHYxUmVzb3VyY2UgPSBhcGlSZXNvdXJjZS5hZGRSZXNvdXJjZSgndjEnKTtcblxuICAgIC8vIERlbW8gVUkgZW5kcG9pbnQgKG5vIGF1dGgpXG4gICAgYXBpLnJvb3QuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBEZW1vIGVuZHBvaW50cyAobm8gYXV0aCAtIHJhdGUgbGltaXRpbmcgaGFuZGxlZCBpbiBMYW1iZGEpXG4gICAgY29uc3QgZGVtb1Jlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnZGVtbycpO1xuICAgIFxuICAgIGNvbnN0IGRlbW9IZWFsdGhSZXNvdXJjZSA9IGRlbW9SZXNvdXJjZS5hZGRSZXNvdXJjZSgnaGVhbHRoJyk7XG4gICAgZGVtb0hlYWx0aFJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgYXBpSW50ZWdyYXRpb24pO1xuXG4gICAgY29uc3QgZGVtb0lkZWFzUmVzb3VyY2UgPSBkZW1vUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2lkZWFzJyk7XG4gICAgZGVtb0lkZWFzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbik7XG5cbiAgICBjb25zdCBkZW1vVmVyc2lvblJlc291cmNlID0gZGVtb1Jlc291cmNlLmFkZFJlc291cmNlKCd2ZXJzaW9uJyk7XG4gICAgZGVtb1ZlcnNpb25SZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIGFwaUludGVncmF0aW9uKTtcblxuICAgIC8vIFB1YmxpYyBlbmRwb2ludHMgKG5vIGF1dGhvcml6YXRpb24gcmVxdWlyZWQsIHN0YW5kYXJkIHJhdGUgbGltaXRzKVxuICAgIGNvbnN0IGhlYWx0aFJlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnaGVhbHRoJyk7XG4gICAgaGVhbHRoUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbik7XG5cbiAgICBjb25zdCB2ZXJzaW9uUmVzb3VyY2UgPSB2MVJlc291cmNlLmFkZFJlc291cmNlKCd2ZXJzaW9uJyk7XG4gICAgdmVyc2lvblJlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgYXBpSW50ZWdyYXRpb24pO1xuXG4gICAgLy8gUHJvdGVjdGVkIGVuZHBvaW50cyAoYXV0aG9yaXphdGlvbiByZXF1aXJlZCwgbm8gYWRkaXRpb25hbCByYXRlIGxpbWl0cylcbiAgICBjb25zdCBpZGVhc1Jlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnaWRlYXMnKTtcbiAgICAvLyBUZW1wb3JhcmlseSByZW1vdmUgYXV0aG9yaXphdGlvbiBmb3IgdGVzdGluZyBtdWx0aS1hZ2VudCB3b3JrZmxvd1xuICAgIGlkZWFzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbik7XG4gICAgaWRlYXNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBhcGlJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBBc3luYyBlbmRwb2ludHMgZm9yIHByb2R1Y3Rpb24gbG9uZy1ydW5uaW5nIHdvcmtmbG93c1xuICAgIGNvbnN0IGFzeW5jUmVzb3VyY2UgPSBpZGVhc1Jlc291cmNlLmFkZFJlc291cmNlKCdhc3luYycpO1xuICAgIGFzeW5jUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgYXBpSW50ZWdyYXRpb24pO1xuXG4gICAgLy8gSm9iIG1hbmFnZW1lbnQgZW5kcG9pbnRzXG4gICAgY29uc3Qgam9ic1Jlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnam9icycpO1xuICAgIGNvbnN0IGpvYlJlc291cmNlID0gam9ic1Jlc291cmNlLmFkZFJlc291cmNlKCd7am9iSWR9Jyk7XG4gICAgXG4gICAgY29uc3Qgc3RhdHVzUmVzb3VyY2UgPSBqb2JSZXNvdXJjZS5hZGRSZXNvdXJjZSgnc3RhdHVzJyk7XG4gICAgc3RhdHVzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbik7XG4gICAgXG4gICAgY29uc3QgcmVzdWx0c1Jlc291cmNlID0gam9iUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3Jlc3VsdHMnKTtcbiAgICByZXN1bHRzUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbik7XG4gICAgXG4gICAgY29uc3QgY2FuY2VsUmVzb3VyY2UgPSBqb2JSZXNvdXJjZS5hZGRSZXNvdXJjZSgnY2FuY2VsJyk7XG4gICAgY2FuY2VsUmVzb3VyY2UuYWRkTWV0aG9kKCdERUxFVEUnLCBhcGlJbnRlZ3JhdGlvbik7XG5cbiAgICBjb25zdCBpbnZlc3RtZW50c1Jlc291cmNlID0gdjFSZXNvdXJjZS5hZGRSZXNvdXJjZSgnaW52ZXN0bWVudHMnKTtcbiAgICBpbnZlc3RtZW50c1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgIH0pO1xuICAgIGludmVzdG1lbnRzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYW5hbHlzaXNSZXNvdXJjZSA9IHYxUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ2FuYWx5c2lzJyk7XG4gICAgYW5hbHlzaXNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICB9KTtcbiAgICBhbmFseXNpc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXV0aG9yaXphdGlvblR5cGU6IGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuQ09HTklUTyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB1c2FnZSBwbGFucyBmb3IgcmF0ZSBsaW1pdGluZ1xuICAgIGNvbnN0IGRlbW9Vc2FnZVBsYW4gPSBuZXcgYXBpZ2F0ZXdheS5Vc2FnZVBsYW4odGhpcywgJ0RlbW9Vc2FnZVBsYW4nLCB7XG4gICAgICBuYW1lOiAnRGVtbyBVc2FnZSBQbGFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmF0ZSBsaW1pdGVkIHVzYWdlIHBsYW4gZm9yIGRlbW8gZW5kcG9pbnRzJyxcbiAgICAgIHRocm90dGxlOiB7XG4gICAgICAgIHJhdGVMaW1pdDogMTAsXG4gICAgICAgIGJ1cnN0TGltaXQ6IDIwLFxuICAgICAgfSxcbiAgICAgIHF1b3RhOiB7XG4gICAgICAgIGxpbWl0OiAxMDAsXG4gICAgICAgIHBlcmlvZDogYXBpZ2F0ZXdheS5QZXJpb2QuREFZLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByb2R1Y3Rpb25Vc2FnZVBsYW4gPSBuZXcgYXBpZ2F0ZXdheS5Vc2FnZVBsYW4odGhpcywgJ1Byb2R1Y3Rpb25Vc2FnZVBsYW4nLCB7XG4gICAgICBuYW1lOiAnUHJvZHVjdGlvbiBVc2FnZSBQbGFuJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVW5saW1pdGVkIHVzYWdlIHBsYW4gZm9yIGF1dGhlbnRpY2F0ZWQgZW5kcG9pbnRzJyxcbiAgICAgIHRocm90dGxlOiB7XG4gICAgICAgIHJhdGVMaW1pdDogMTAwMCxcbiAgICAgICAgYnVyc3RMaW1pdDogMjAwMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBBc3NvY2lhdGUgdXNhZ2UgcGxhbnMgd2l0aCBBUEkgc3RhZ2VzXG4gICAgZGVtb1VzYWdlUGxhbi5hZGRBcGlTdGFnZSh7XG4gICAgICBhcGk6IGFwaSxcbiAgICAgIHN0YWdlOiBhcGkuZGVwbG95bWVudFN0YWdlLFxuICAgIH0pO1xuXG4gICAgcHJvZHVjdGlvblVzYWdlUGxhbi5hZGRBcGlTdGFnZSh7XG4gICAgICBhcGk6IGFwaSxcbiAgICAgIHN0YWdlOiBhcGkuZGVwbG95bWVudFN0YWdlLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBBUEkgVVJMXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaVVybCcsIHtcbiAgICAgIHZhbHVlOiBhcGkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdVUkwgb2YgdGhlIEludmVzdG1lbnQgQUkgQWdlbnQgQVBJJyxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCB0aGUgUzMgYnVja2V0IG5hbWVcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUHJvcHJpZXRhcnlEYXRhQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBwcm9wcmlldGFyeURhdGFCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgUzMgYnVja2V0IGZvciBwcm9wcmlldGFyeSBkYXRhJyxcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCB0aGUgQ29nbml0byBVc2VyIFBvb2wgSURcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZGVzY3JpcHRpb246ICdJRCBvZiB0aGUgQ29nbml0byBVc2VyIFBvb2wnLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSURcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdJRCBvZiB0aGUgQ29nbml0byBVc2VyIFBvb2wgQ2xpZW50JyxcbiAgICB9KTtcbiAgfVxufSJdfQ==