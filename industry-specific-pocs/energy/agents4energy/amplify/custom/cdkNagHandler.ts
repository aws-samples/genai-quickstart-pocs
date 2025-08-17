import { Stack, NestedStack, Aspects } from 'aws-cdk-lib';
import { NagSuppressions } from 'cdk-nag'


const applyStackSupperssions = (stack: Stack, suppressions: { id: string, reason: string }[]) => {
  NagSuppressions.addStackSuppressions(stack, suppressions);
  // Recursively apply suppressions to nested stacks
  const nestedStacks = stack.node.children
    .filter(child => child instanceof NestedStack)
    .map(child => child as NestedStack);

  for (const nestedStack of nestedStacks) {
    applyStackSupperssions(nestedStack, suppressions);
  }
}

export const cdkNagSupperssionsHandler = (stack: Stack) => {
  // Apply suppressions to the current stack
  const suppressions = [
    {
      id: 'AwsSolutions-IAM4',
      reason: 'The lambda execution role must be able to dynamically create log groups, and so will have a * in the iam policy resource section'
    },
    {
      id: 'AwsSolutions-IAM5',
      reason: 'The Lambda function must be able to get any object from the well file drive bucket, so a * in needed in the resource arn.'
    },
    {
      id: 'AwsSolutions-L1',
      reason: `This lambda is created by s3Deployment from 'aws-cdk-lib/aws-s3-deployment'`
    },
    {
      id: 'AwsSolutions-RDS10',
      reason: `This rds database in this sample is meant to be deleted and not for production traffic.`
    }
  ];

  applyStackSupperssions(stack, suppressions)

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    `/${stack.stackName}/networkingStack/accessLogs/Resource`,
    [
      {
        id: 'AwsSolutions-S1',
        reason: 'The AWS bucket which recieves access logs does not itself have access logs enabled due to recursion.'
      }
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    `/${stack.stackName}/data/amplifyData/AmplifyCodegenAssets/AmplifyCodegenAssetsBucket/Policy/Resource`,
    [
      {
        id: 'AwsSolutions-S10',
        reason: 'The AWS bucket is created by AWS Amplify.'
      }
    ]
  )

  NagSuppressions.addResourceSuppressionsByPath(
    stack,
    `/${stack.stackName}/data/amplifyData/AmplifyCodegenAssets/AmplifyCodegenAssetsBucket/Resource`,
    [
      {
        id: 'AwsSolutions-S1',
        reason: 'The AWS bucket is created by AWS Amplify.'
      },
      {
        id: 'AwsSolutions-S10',
        reason: 'The AWS bucket is created by AWS Amplify.'
      }
    ]
  )
}