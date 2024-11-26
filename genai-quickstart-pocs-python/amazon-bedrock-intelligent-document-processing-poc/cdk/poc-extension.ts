
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { POCExtender, POCExtenderProps } from '../../poc-deployment';
import { Bucket } from 'aws-cdk-lib/aws-s3';


export class POCExtension extends POCExtender {
  public extensionForDeploymentOnly = true;
  constructor(scope: Construct, id: string, props: POCExtenderProps) {
    super(scope, id, props);

    const idpBucket = new Bucket(this.pocExtendedConstruct, 'IDPBucket')
    if (props.pocTaskDefinition) {
      idpBucket.grantReadWrite(props.pocTaskDefinition.taskRole);
    }

  
    this.pocExtendedConstruct.addPermissions([new Policy(this.pocExtendedConstruct, 'TextractPolicy', {
      policyName: 'TextractPolicy',
      statements: [
        new PolicyStatement({
          actions: ['textract:*'],
          resources: ['*'],
        }),
      ],
    }),
    new Policy(this.pocExtendedConstruct, 'ComprehendPolicy', {
      policyName: 'ComprehendPolicy',
      statements: [
        new PolicyStatement({
          actions: ['comprehend:DetectEntities',],
          resources: ['*'],
        }),
      ]
    })]);

    this.pocExtendedConstruct.addEnvironmentVariables({
      save_folder: idpBucket.bucketName
    })
  }
}