#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecuritySystemStack } from '../lib/security-system-stack';

const app = new cdk.App();

// Get environment context or use default
const environment = app.node.tryGetContext('environment') || 'production';

const stack = new SecuritySystemStack(app, `SecuritySystem-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'  // Changed to us-east-1 for Nova Pro deployment
  },
  description: 'Security Configuration System Infrastructure'
});

// Add the gensec tag to all resources in the stack
cdk.Tags.of(stack).add('Project', 'gensec');
