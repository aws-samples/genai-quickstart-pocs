#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { AgenticRiskAssessmentStack } from '../lib/agentic-risk-assessment-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';

new AgenticRiskAssessmentStack(app, `AgenticRiskAssessmentStack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment,
});