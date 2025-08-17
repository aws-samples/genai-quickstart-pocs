import { handler } from "@/../amplify/functions/planAndExecuteAgent/index"
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
  process.env.MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0'

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
      input: {
        firstMessageSummary: "Test Summary"
      }
    }
  })
  
  const testArguments = {
    chatSessionId: testChatSession.data.createChatSession.id,

    // lastMessageText: `
    // What is the hometown of the 2015 Australian open winner?
    // `

    lastMessageText: `
    Execute a SQL query and plot the result to get the production over the last 12 weeks.
    Ust the ai role for all steps.
    `
    // "input": "What is 1+54?"
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