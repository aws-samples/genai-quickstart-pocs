import { handler } from "@/../amplify/functions/productionAgentFunction/index"
import { AppSyncResolverEvent, Context, AppSyncIdentity } from 'aws-lambda';
import { Schema } from '@/../amplify/data/resource';

import { STSClient } from "@aws-sdk/client-sts";
import { AmplifyClientWrapper } from '@/../amplify/functions/utils/amplifyUtils'
import { listChatMessageByChatSessionIdAndCreatedAt} from "@/../amplify/functions/graphql/queries";
import { createChatSession, createChatMessage } from "@/../amplify/functions/graphql/mutations";
// import { onCreateChatMessage } from "@/../amplify/functions/graphql/subscriptions";
import * as APITypes from "@/../amplify/functions/graphql/API";

import { getDeployedResourceArn, getLambdaEnvironmentVariables } from "../utils";

import outputs from '@/../amplify_outputs.json';

import { queryGQLToolBuilder } from '../../amplify/functions/planAndExecuteAgent/toolBox';

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

  const testChatSession = await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
    query: createChatSession,
    variables: {
      input: {}
    }
  })

  amplifyClientWrapper.chatSessionId = testChatSession.data.createChatSession.id

  console.log('created chat session with id: ', amplifyClientWrapper.chatSessionId)

  // await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
  //   query: createChatMessage,
  //   variables: {
  //     input: {
  //       chatSessionId: testChatSession.data.createChatSession.id,
  //       content: 'What is the oil production over the last 5 days?',
  //       role: APITypes.ChatMessageRole.human
  //     }
  //   }
  // })

  // await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
  //   query: createChatMessage,
  //   variables: {
  //     input: {
  //       chatSessionId: testChatSession.data.createChatSession.id,
  //       content: 'Whatever you want it to be.',
  //       role: APITypes.ChatMessageRole.ai
  //     }
  //   }
  // })

  // const testChatMessages = await amplifyClientWrapper.amplifyClient.graphql({
  //   query: listChatMessageByChatSessionIdAndCreatedAt,
  //   variables:
  //   {
  //     chatSessionId: amplifyClientWrapper.chatSessionId,
  //     limit: 1,
  //     sortDirection: APITypes.ModelSortDirection.DESC
  //   },
  // })

  // console.log('Test Chat Messages: ', testChatMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items)

  const queryGQLTool = queryGQLToolBuilder({ amplifyClientWrapper: amplifyClientWrapper, chatMessageOwnerIdentity: "testUser" })

  const toolResponse = await queryGQLTool.invoke({
    queryField: "invokeProductionAgent",
    invocationText: "Which well had the highest gas production in January 2000?"
  })

  console.log('Tool response: ', toolResponse)

  // type GeneratedSubscription<InputType, OutputType> = string & {
  //   __generatedSubscriptionInput: InputType;
  //   __generatedSubscriptionOutput: OutputType;
  // };

  // const onCreateChatMessage2 = /* GraphQL */ `subscription OnCreateChatMessage {
  //   onCreateChatMessage {
  //     chatSessionId
  //     content
  //   }
  // }
  // ` as GeneratedSubscription<
  //   APITypes.OnCreateChatMessageSubscriptionVariables,
  //   APITypes.OnCreateChatMessageSubscription
  // >;

  // amplifyClientWrapper.amplifyClient.models.ChatMessage.observeQuery().subscribe({
  //   next: (result) => {
  //     console.log('Subscription event: ', result)
  //     return result
  //   },
  //   error: (error) => {
  //     console.error('Subscription error: ', error)
  //     throw new Error(error)
  //   }
  // })

  // console.log('Creating a test subsubscription')
  // const testSubQuery = amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
  //   query: onCreateChatMessage2,
  //   variables: {
  //     filter: {}
  //   }
  // })

  // const testSub = testSubQuery.subscribe({
  //   next: (result) => {
  //     console.log('Subscription event: ', result)
  //     return result
  //   },
  //   error: (error) => {
  //     console.error('Subscription error: ', error)
  //     throw new Error(error)
  //   }
  // })

  // console.log("Chat Message Content: ", testSub.onCreateChatMessage?.content)

  // .subscribe({
  //   next: (result) => {
  //     console.log('Subscription event: ', result)
  //     return result
  //   },
  //   error: (error) => {
  //     console.error('Subscription error: ', error)
  //     throw new Error(error)
  //   }
  // })
  // console.log('Created a test subsubscription')

  // setInterval(() => {
  //   console.log('testSub:\n', testSub)
  // }, 5000)



  
}

main()