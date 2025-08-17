import { handler } from "@/../amplify/functions/configureProdDb/index"
import { Context } from 'aws-lambda';
import outputs from '@/../amplify_outputs.json';

import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";

const rootStackName = outputs.custom.root_stack_name

const testArguments = {}

const dummyContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: '52fdfc07-2182-154f-163f-5f0f9a621d72',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2020/09/22/[$LATEST]abcdefghijklmnopqrstuvwxyz',
  // identity: null,
  // clientContext: null,
  getRemainingTimeInMillis: () => 3000,
  done: () => { },
  fail: () => { },
  succeed: () => { },
};

const main = async () => {
  process.env.ROOT_STACK_NAME = rootStackName
  // test()
  // getDeployedResourceArn(rootStackName, 'configureProdDbFunction')
  await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'configureProdDbFunction'))

  const response = await handler({}, dummyContext, () => null)

  console.log('Handler response: ', response)
}

main()