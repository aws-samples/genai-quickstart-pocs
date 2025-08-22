// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { bedrockAgentStream } from './functions/bedrock-agent-stream/resource';
import { userSignupNotification } from './functions/user-signup-notification/resource';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import {
  FunctionUrlAuthType,
  HttpMethod,
  InvokeMode,
  Function as LambdaFunction, // for casting to add env
} from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { createBedrockAgentCoreRole } from './roles/bedrock-agent-core-role';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backend = defineBackend({
  auth,
  bedrockAgentStream,
  userSignupNotification,
});

// Create the Bedrock Agent Core role
const bedrockAgentCoreRole = createBedrockAgentCoreRole(backend.createStack('BedrockAgentCoreStack'));

// Create S3 bucket for agent sessions with unique naming
const agentSessionStack = backend.createStack('AgentSessionStack');
const agentSessionBucket = new Bucket(agentSessionStack, 'AgentSessionBucket', {
  // Generate unique bucket name using stack account and region
  bucketName: `pe-agent-sessions-${agentSessionStack.account}-${agentSessionStack.region}`,
  encryption: BucketEncryption.S3_MANAGED,
  versioned: false,
  publicReadAccess: false,
  removalPolicy: RemovalPolicy.RETAIN, // Keep sessions when stack is deleted
});

console.log(`Agent sessions bucket will be created: ${agentSessionBucket.bucketName}`);

/* ----------------------- Fund Documents S3 Bucket ----------------------- */

// Create S3 bucket for fund documents with unique naming
const fundDocumentsStack = backend.createStack('FundDocumentsStack');
const fundDocumentsBucket = new Bucket(fundDocumentsStack, 'FundDocumentsBucket', {
  // Generate unique bucket name using stack ID suffix
  bucketName: `pe-fund-documents-${fundDocumentsStack.account}-${fundDocumentsStack.region}`,
  encryption: BucketEncryption.S3_MANAGED,
  versioned: true, // Enable versioning for document history
  publicReadAccess: false,
  removalPolicy: RemovalPolicy.RETAIN, // Keep data when stack is deleted
});

// Deploy fund documents from local data folder to S3
const fundDocumentsDeployment = new BucketDeployment(fundDocumentsStack, 'FundDocumentsDeployment', {
  sources: [Source.asset(join(__dirname, '..', 'data', 'fund_documents'))],
  destinationBucket: fundDocumentsBucket,
  destinationKeyPrefix: 'fund_documents/', // Optional: organize in subfolder
  retainOnDelete: true, // Keep files when deployment is deleted
});

// Deploy database CSV files to S3
const databaseDeployment = new BucketDeployment(fundDocumentsStack, 'DatabaseDeployment', {
  sources: [Source.asset(join(__dirname, '..', 'data', 'database'))],
  destinationBucket: fundDocumentsBucket,
  destinationKeyPrefix: 'database/', // Store in database subfolder
  retainOnDelete: true, // Keep files when deployment is deleted
});

console.log(`Fund documents bucket will be created: ${fundDocumentsBucket.bucketName}`);

/* ------------------------- SNS: signup notifications ------------------------ */

// Create an SNS topic + subscription for new user signup alerts
const notifyStack = backend.createStack('NotificationStack');
const signupNotificationTopic = new Topic(notifyStack, 'UserSignupTopic', {
  displayName: 'User Signup Notifications',
});

// Change this per env in Amplify Console if you want:
const notificationEmail = process.env.NOTIFICATION_EMAIL || 'your-email@example.com';
signupNotificationTopic.addSubscription(new EmailSubscription(notificationEmail));

// Grant the trigger lambda permission to publish to the topic
backend.userSignupNotification.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['sns:Publish'],
    resources: [signupNotificationTopic.topicArn],
  })
);

// Pass the Topic ARN to the trigger lambda as an env var.
// `resources.lambda` is typed as IFunction; cast to Function to access addEnvironment.
const signupFn = backend.userSignupNotification.resources
  .lambda as unknown as LambdaFunction;
signupFn.addEnvironment('SNS_TOPIC_ARN', signupNotificationTopic.topicArn);

// Pass the S3 session bucket to the bedrock agent stream lambda
const bedrockAgentStreamFn = backend.bedrockAgentStream.resources
  .lambda as unknown as LambdaFunction;
bedrockAgentStreamFn.addEnvironment('AGENT_SESSION_S3', agentSessionBucket.bucketName);

// Add fund documents bucket name as environment variable
bedrockAgentStreamFn.addEnvironment('FUND_DOCUMENTS_BUCKET', fundDocumentsBucket.bucketName);

// Add knowledge base ID as environment variable
bedrockAgentStreamFn.addEnvironment('KNOWLEDGE_BASE_ID', 'W1Q58MF2A7');

// Grant Lambda permission to read/write to agent sessions bucket
backend.bedrockAgentStream.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject',
      's3:ListBucket',
    ],
    resources: [
      agentSessionBucket.bucketArn,
      `${agentSessionBucket.bucketArn}/*`,
    ],
  })
);

// Grant Lambda permission to read from fund documents bucket
backend.bedrockAgentStream.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject',
      's3:ListBucket',
    ],
    resources: [
      fundDocumentsBucket.bucketArn,
      `${fundDocumentsBucket.bucketArn}/*`,
    ],
  })
);

/* ---------------------- Bedrock AgentCore integration ---------------------- */

// Agent runtime ARN (set later; safe to be missing for first deploy)
const agentRuntimeArn = process.env.AGENTCORE_RUNTIME_ARN;

// Only attach permission when we have a real ARN (avoid CFN “ARN or * required”)
// Add Bedrock Agent Core permissions to Lambda function (unconditional)
backend.bedrockAgentStream.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock-agentcore:InvokeAgentRuntime', 
      'bedrock-agentcore:GetAgentRuntime'
    ],
    resources: ['*'], // Allow access to all agent runtimes
  })
);

// Also add general Bedrock permissions for model access
backend.bedrockAgentStream.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream'
    ],
    resources: ['*'],
  })
);

/* ---------------------- Streaming Function URL (IAM) ----------------------- */

// Create a Function URL with streaming enabled and temporary open CORS
const functionUrl = backend.bedrockAgentStream.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.AWS_IAM,
  invokeMode: InvokeMode.RESPONSE_STREAM,
  cors: {
    allowedOrigins: ['*'],              // tighten later to your site origin(s)
    allowCredentials: false,            // must be false with wildcard origin
    allowedMethods: [HttpMethod.POST],  // don’t include OPTIONS for Function URLs
    allowedHeaders: ['*'],              // Allow all headers for AWS signing
    maxAge: Duration.seconds(300),
  },
});

// Let Cognito *authenticated* users call the Function URL (SigV4 via Identity Pool)
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['lambda:InvokeFunctionUrl'],
    resources: [backend.bedrockAgentStream.resources.lambda.functionArn],
    conditions: { StringEquals: { 'lambda:FunctionUrlAuthType': 'AWS_IAM' } },
  })
);

// (Optional) Allow direct Invoke if you ever call the Lambda by ARN (not via Function URL)
backend.auth.resources.authenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['lambda:InvokeFunction'],
    resources: [backend.bedrockAgentStream.resources.lambda.functionArn],
  })
);

/* --------------------------------- Outputs -------------------------------- */

backend.addOutput({
  custom: {
    bedrockAgentStreamUrl: functionUrl.url,
    agentCoreRuntimeArn: agentRuntimeArn ?? '',
    bedrockAgentCoreRoleArn: bedrockAgentCoreRole.roleArn,
    signupNotificationTopicArn: signupNotificationTopic.topicArn,
    fundDocumentsBucketName: fundDocumentsBucket.bucketName,
    agentSessionBucketName: agentSessionBucket.bucketName,
  },
});
