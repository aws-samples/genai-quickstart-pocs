// amplify/backend.ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { bedrockAgentStream } from './functions/bedrock-agent-stream/resource';
import { userSignupNotification } from './functions/user-signup-notification/resource';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import {
  FunctionUrlAuthType,
  HttpMethod,
  InvokeMode,
  Function as LambdaFunction, // for casting to add env
} from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { createBedrockAgentCoreRole } from './roles/bedrock-agent-core-role';

const backend = defineBackend({
  auth,
  bedrockAgentStream,
  userSignupNotification,
});

// Create the Bedrock Agent Core role
const bedrockAgentCoreRole = createBedrockAgentCoreRole(backend.createStack('BedrockAgentCoreStack'));

// Create S3 bucket for agent sessions if environment variable is provided
let agentSessionBucket;
const agentSessionBucketName = process.env.AGENT_SESSION_S3;
if (agentSessionBucketName) {
  // CDK will handle the case where bucket already exists
  // If bucket exists with same name, CDK will import it instead of creating
  agentSessionBucket = new Bucket(backend.createStack('AgentSessionStack'), 'AgentSessionBucket', {
    bucketName: agentSessionBucketName,
    encryption: BucketEncryption.S3_MANAGED,
    versioned: false,
    publicReadAccess: false,
    // This tells CDK to import existing bucket if it exists
    removalPolicy: RemovalPolicy.RETAIN,
  });
  console.log(`Configured S3 bucket for agent sessions: ${agentSessionBucketName}`);
} else {
  console.log('AGENT_SESSION_S3 environment variable not set, skipping bucket configuration');
}

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
bedrockAgentStreamFn.addEnvironment('AGENT_SESSION_S3', process.env.AGENT_SESSION_S3 || '');

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
  },
});
