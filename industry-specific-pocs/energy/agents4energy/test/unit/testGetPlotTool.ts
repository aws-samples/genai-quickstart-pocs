import { handler } from "@/../amplify/functions/productionAgentFunction/index"
import { AppSyncResolverEvent, Context, AppSyncIdentity } from 'aws-lambda';
import { Schema } from '@/../amplify/data/resource';

import { STSClient } from "@aws-sdk/client-sts";
import { AmplifyClientWrapper } from '@/../amplify/functions/utils/amplifyUtils'
import { createChatSession, createChatMessage } from "@/../amplify/functions/graphql/mutations";
import * as APITypes from "@/../amplify/functions/graphql/API";

import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";

import outputs from '@/../amplify_outputs.json';

import { plotTableFromToolResponseTool } from '../../amplify/functions/productionAgentFunction/toolBox';

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
  console.log('Beginning test')
  const rootStackName = outputs.custom.root_stack_name
  await getLambdaEnvironmentVariables(await getDeployedResourceArn(rootStackName, 'productionagentfunctionlambda'))

  process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT = outputs.data.url
  process.env.AWS_DEFAULT_REGION = outputs.auth.aws_region
  process.env.MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'

  const credentials = await stsClient.config.credentials()
  process.env.AWS_ACCESS_KEY_ID = credentials.accessKeyId
  process.env.AWS_SECRET_ACCESS_KEY = credentials.secretAccessKey
  process.env.AWS_SESSION_TOKEN = credentials.sessionToken

  console.log('creating amplify client')
  const amplifyClientWrapper = new AmplifyClientWrapper({
    chatSessionId: "",
    env: process.env
  })
  // const plotTableFromToolResponseTool = plotTableFromToolResponseTool(amplifyClientWrapper)
  //Create a new chat session for testing
  console.log('creating chat session')
  const testChatSession = await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatSession,
    variables: {
      input: {}
    }
  })

  amplifyClientWrapper.chatSessionId = testChatSession.data.createChatSession.id

  await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatMessage,
    variables: {
      input: {
        chatSessionId: testChatSession.data.createChatSession.id,
        content: 'What is the oil production over the last 5 days?',
        role: APITypes.ChatMessageRole.human
      }
    }
  })

  await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatMessage,
    variables: {
      input: {
        chatSessionId: testChatSession.data.createChatSession.id,
        content: 'Calling the table making tool',
        role: APITypes.ChatMessageRole.ai,
        tool_calls: JSON.stringify([
          {
            args: { query: 'SELECT * FROM oil_production ORDER BY date DESC LIMIT 5;' },
            name: "executeSQLQueryReturnPlot",
            id: "tooluse_1OeYGfs9SAaOc6C_2q7BRw",
            type: "tool_call"
          }
        ])
      }
    }
  })

  await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatMessage,
    variables: {
      input: {
        chatSessionId: testChatSession.data.createChatSession.id,
        content: JSON.stringify({
          messageContentType: "tool_table",
          queryResponseData: {
            'oil': [1, 2, 3, 4],
            'date': ["2022-01-01", "2022-01-02", "2022-01-03", "2022-01-04"]
          }
        }),
        role: APITypes.ChatMessageRole.tool,
        tool_call_id: "tooluse_hny127d-R--qBs-gbj1vHA"
      }
    }
  })

  await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatMessage,
    variables: {
      input: {
        chatSessionId: testChatSession.data.createChatSession.id,
        content: 'Done!',
        role: APITypes.ChatMessageRole.ai,
      }
    }
  })


  //Get those chat messages we put earlier
  await amplifyClientWrapper.getChatMessageHistory({})

  const toolResponse = await plotTableFromToolResponseTool.invoke({
    chartTitle: "Hello World",
    includePreviousDataTable: true,
    includePreviousEventTable: true
  })

  console.log('Tool response: ', toolResponse)
}

main()