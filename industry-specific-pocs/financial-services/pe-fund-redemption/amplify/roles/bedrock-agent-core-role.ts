import { Role, PolicyStatement, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export function createBedrockAgentCoreRole(scope: Construct): Role {
  const role = new Role(scope, 'BedrockAgentCoreRole', {
    roleName: 'bedrock-agent-core-role',
    assumedBy: new ServicePrincipal('bedrock-agentcore.amazonaws.com'),
    description: 'Role for Bedrock Agent Core operations including create_agent_runtime',
  });

  // Add Bedrock Agent Core permissions for create_agent_runtime and related operations
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock-agentcore:CreateAgentRuntime',
      'bedrock-agentcore:GetAgentRuntime',
      'bedrock-agentcore:UpdateAgentRuntime',
      'bedrock-agentcore:DeleteAgentRuntime',
      'bedrock-agentcore:ListAgentRuntimes',
      'bedrock-agentcore:InvokeAgentRuntime'
    ],
    resources: ['*']
  }));

  // Add Bedrock permissions for model invocation
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream',
      'bedrock:GetFoundationModel',
      'bedrock:ListFoundationModels'
    ],
    resources: ['*']
  }));

  // Add ECR permissions for Docker image access
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ecr:GetAuthorizationToken',
      'ecr:BatchCheckLayerAvailability',
      'ecr:GetDownloadUrlForLayer',
      'ecr:BatchGetImage'
    ],
    resources: ['*']
  }));

  // Add CloudWatch Logs permissions
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents'
    ],
    resources: ['arn:aws:logs:*:*:*']
  }));

  // Add IAM permissions to pass roles if needed
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'iam:PassRole'
    ],
    resources: [
      `arn:aws:iam::*:role/bedrock-*`,
      `arn:aws:iam::*:role/AmazonBedrock*`
    ]
  }));

  // Add Secrets Manager permissions
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'secretsmanager:GetSecretValue',
      'secretsmanager:DescribeSecret'
    ],
    resources: ['*']
  }));

  // Add Lambda permissions
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'lambda:InvokeFunction'
    ],
    resources: ['*']
  }));

  // Add S3 permissions
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject',
      's3:ListBucket'
    ],
    resources: [
      'arn:aws:s3:::mcwade-cap-pe-session-123',
      'arn:aws:s3:::mcwade-cap-pe-session-123/*'
    ]
  }));

  return role;
}
