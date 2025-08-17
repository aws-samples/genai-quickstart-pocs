import { handler } from "@/../amplify/functions/productionAgentFunction/index"
import { AppSyncResolverEvent, Context, AppSyncIdentity } from 'aws-lambda';
import { Schema } from '@/../amplify/data/resource';
import { STSClient } from "@aws-sdk/client-sts";
import { AmplifyClientWrapper } from '@/../amplify/functions/utils/amplifyUtils'
import { createChatSession } from "@/../amplify/functions/graphql/mutations";

import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";

import outputs from '@/../amplify_outputs.json';

const stsClient = new STSClient();

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

export const main = async () => {
  const rootStackName = outputs.custom.root_stack_name
  await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'productionagentfunctionlambda'))

  process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT = outputs.data.url
  process.env.AWS_DEFAULT_REGION = outputs.auth.aws_region
  process.env.MODEL_ID = 'us.anthropic.claude-3-sonnet-20240229-v1:0'

  const credentials = await stsClient.config.credentials()
  process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId
  process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey
  process.env.AWS_SESSION_TOKEN = credentials.sessionToken

  const amplifyClientWrapper = new AmplifyClientWrapper({
    env: process.env
  })

  //Create a new chat session for testing
  const testChatSession = await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatSession,
    variables: {
      input: {}
    }
  })

  const testArguments = {
    chatSessionId: testChatSession.data.createChatSession.id,

    // lastMessageText: `
    // What is the equation I should use for a decline curve analysis?
    // `

    lastMessageText: `
    For the well with API number 30-045-29202, estimate the Arps decline curve parameters.
    `

    // lastMessageText: `
    // Plot the total monthly oil, gas, and water production since 1900 for the well with API number 30-045-29202
    // `
  }

  const event: AppSyncResolverEvent<Schema['invokeProductionAgent']['args']> = {
    "arguments": testArguments,
    identity: { sub: "testIdentity" } as AppSyncIdentity,
    source: null,
    request: {
      headers: {},
      domainName: null,
    },
    info: {
      fieldName: 'yourFieldName',
      parentTypeName: 'Query',
      selectionSetList: [],
      selectionSetGraphQL: '',
      variables: {}
    },
    prev: null,
    stash: {},
  };

  const response = await handler(event, dummyContext, () => null)

  console.log('Handler response: ', response)
}

main()