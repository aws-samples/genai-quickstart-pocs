
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { POCExtender, POCExtenderProps } from '../../poc-deployment';


export class POCExtension extends POCExtender {
  public extensionForDeploymentOnly = true;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id, props);
  
    this.pocExtendedConstruct.addPermissions([new Policy(this.pocExtendedConstruct, 'TranslatePolicy', {
      policyName: 'TranslatePolicy',
      statements: [
        new PolicyStatement({
          actions: ['translate:*'],
          resources: ['*'],
        }),
        new PolicyStatement({
          actions: ['bedrock:ListFoundationModels'],
          resources: ['*'],
        }),
      ],
    })]);
  }
}