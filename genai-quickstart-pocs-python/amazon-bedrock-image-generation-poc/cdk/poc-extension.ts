
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { POCExtender, POCExtenderProps } from '../../poc-deployment';


export class POCExtension extends POCExtender {
  public extensionForDeploymentOnly = true;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id, props);
    
    this.pocExtendedConstruct.addPermissions([new Policy(this.pocExtendedConstruct, 'BedrockExtendedPolicy', {
      policyName: 'BedrockExtendedPolicy',
      statements: [
        new PolicyStatement({
          actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
          resources: [`arn:aws:bedrock:us-east-1::foundation-model/*`],
        }),
        new PolicyStatement({
          actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
          resources: [`arn:aws:bedrock:us-west-2::foundation-model/*`],
        }),
      ],
    })]);
  }
}