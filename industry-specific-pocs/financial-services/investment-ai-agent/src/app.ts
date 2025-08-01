#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InvestmentAiAgentStack } from './infrastructure/investment-ai-agent-stack';

const app = new cdk.App();
new InvestmentAiAgentStack(app, 'InvestmentAiAgentStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
  description: 'Investment AI Agent infrastructure stack'
});