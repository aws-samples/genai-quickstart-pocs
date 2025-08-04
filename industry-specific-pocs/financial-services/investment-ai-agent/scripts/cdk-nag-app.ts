#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InvestmentAiAgentStack } from '../src/infrastructure/investment-ai-agent-stack';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

/**
 * CDK Nag application for security and compliance checks
 * This runs additional security validations on the CDK templates
 */

const app = new cdk.App();

// Get environment from context
const environment = app.node.tryGetContext('environment') || 'dev';

// Create the stack
const stack = new InvestmentAiAgentStack(app, `InvestmentAiAgentStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Investment AI Agent Stack for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: 'InvestmentAiAgent',
    ManagedBy: 'CDK'
  }
});

// Add CDK Nag checks
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

// Add suppressions for known acceptable violations
NagSuppressions.addStackSuppressions(stack, [
  {
    id: 'AwsSolutions-IAM4',
    reason: 'AWS managed policies are acceptable for this use case',
  },
  {
    id: 'AwsSolutions-IAM5',
    reason: 'Wildcard permissions are needed for Bedrock model access',
  },
  {
    id: 'AwsSolutions-APIG2',
    reason: 'Request validation is handled at the application level',
  },
  {
    id: 'AwsSolutions-APIG3',
    reason: 'WAF is configured based on environment settings',
  },
  {
    id: 'AwsSolutions-APIG4',
    reason: 'Authorization is implemented using Cognito',
  },
  {
    id: 'AwsSolutions-COG2',
    reason: 'MFA configuration varies by environment',
  },
  {
    id: 'AwsSolutions-L1',
    reason: 'Lambda runtime version is managed through deployment pipeline',
  }
]);

app.synth();