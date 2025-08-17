import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend';

export const invokeBedrockAgentFunction = defineFunction({
  name: 'invoke-bedrock-agent',
  entry: '../functions/invokeBedrockAgent.ts',
  timeoutSeconds: 120
});

export const getStructuredOutputFromLangchainFunction = defineFunction({
  name: 'get-structured-output',
  entry: '../functions/getStructuredOutputFromLangchain.ts',
  timeoutSeconds: 120,
  environment: {
    // MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0'
    // MODEL_ID: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
    // MODEL_ID: 'us.anthropic.claude-3-sonnet-20240229-v1:0'
    MODEL_ID: 'us.anthropic.claude-3-haiku-20240307-v1:0'
  },
});

export const productionAgentFunction = defineFunction({
  name: "production-agent-function",
  entry: '../functions/productionAgentFunction/index.ts',
  timeoutSeconds: 900,
  environment: {
    // STRUCTURED_OUTPUT_MODEL_ID: 'amazon.nova-lite-v1:0',
    STRUCTURED_OUTPUT_MODEL_ID: 'us.anthropic.claude-3-haiku-20240307-v1:0',
    // MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0'
    // MODEL_ID: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
    MODEL_ID: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
    // MODEL_ID: 'us.anthropic.claude-3-haiku-20240307-v1:0'
    // MODEL_ID: 'us.amazon.nova-pro-v1:0',
    // MODEL_ID: 'amazon.nova-lite-v1:0'
    FILE_PROCESSING_CONCURRENCY: '10'
  },
  runtime: 20
});

export const planAndExecuteAgentFunction = defineFunction({
  name: "plan-and-execute-agent",
  entry: '../functions/planAndExecuteAgent/index.ts',
  timeoutSeconds: 900,
  environment: {
    // MODEL_ID: 'us.anthropic.claude-3-5-sonnet-20240620-v1:0'
    // MODEL_ID: 'us.anthropic.claude-3-5-haiku-20241022-v1:0'
    MODEL_ID: 'us.anthropic.claude-3-sonnet-20240229-v1:0'
    // MODEL_ID: 'us.anthropic.claude-3-haiku-20240307-v1:0'
  },
  runtime: 20
});

// export const addIamDirectiveFunction = defineFunction({
//   name: "add-iam-directive-function",
//   entry: '../functions/addIamDirectiveToAllAssets.ts',
//   timeoutSeconds: 60,
// });

// export const dummyFunction2 = defineFunction()

const schema = a.schema({

  BedrockResponse: a.customType({
    body: a.string(),
    error: a.string(),
  }),

  BedrockAgentResponse: a.customType({
    completion: a.string(),
    orchestrationTrace: a.string()
  }),

  ChatSession: a
    .model({
      messages: a.hasMany("ChatMessage", "chatSessionId"),
      firstMessageSummary: a.string(),
      aiBotInfo: a.customType({
        aiBotName: a.string(),
        aiBotId: a.string(),
        aiBotAliasId: a.string(),
        aiBotVersion: a.string(),
      }),
      planGoal: a.string(),
      planSteps: a.string().array(),
      pastSteps: a.string().array(),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]), //The allow.authenticated() allows other users to view chat sessions.

  ChatMessage: a
    .model({
      chatSessionId: a.id(),
      session: a.belongsTo("ChatSession", "chatSessionId"),
      content: a.string().required(),
      trace: a.string(),
      role: a.enum(["human", "ai", "tool"]),
      chatSessionIdDashFieldName: a.string().default("none"), //This exists to let agents pull their messages in a multi agent environment
      chainOfThought: a.boolean().default(false),
      owner: a.string(),
      createdAt: a.datetime(),
      tool_call_id: a.string(), //This is the langchain tool call id
      tool_name: a.string(),
      tool_calls: a.json(),
      responseComplete: a.boolean().default(false),
      userFeedback: a.enum(["like", "dislike", "none"])
    })
    .secondaryIndexes((index) => [
      index("chatSessionId").sortKeys(["createdAt"]),
      index("chatSessionIdDashFieldName").sortKeys(["createdAt"]) //an agent in a multi agent enviornment can query its messages.
    ])
    .authorization((allow) => [allow.owner(), allow.authenticated()]),

  invokeBedrock: a
    .query()
    .arguments({ prompt: a.string() })
    .returns(a.ref("BedrockResponse"))
    .authorization(allow => allow.authenticated())
    .handler(
      a.handler.custom({ entry: "./invokeBedrockModel.js", dataSource: "bedrockRuntimeDS" })
    ),

  listBedrockAgents: a
    .query()
    .returns(a.ref("BedrockResponse"))
    .authorization(allow => [allow.authenticated()])
    .handler(
      a.handler.custom({ entry: "./listBedrockAgents.js", dataSource: "bedrockAgentDS" })
    ),

  listBedrockAgentAliasIds: a
    .query()
    .arguments({ agentId: a.string() })
    .returns(a.ref("BedrockResponse"))
    .authorization(allow => allow.authenticated())
    .handler(
      a.handler.custom({ entry: "./listBedrockAgentAliasIds.js", dataSource: "bedrockAgentDS" })
    ),

  invokeBedrockAgent: a
    .query()
    .arguments({ prompt: a.string().required(), agentId: a.string().required(), agentAliasId: a.string().required(), chatSessionId: a.string().required() })
    .returns(a.ref("BedrockAgentResponse"))
    .authorization(allow => allow.authenticated())
    .handler(
      a.handler.function(invokeBedrockAgentFunction)
    ),

  invokeBedrockWithStructuredOutput: a
    .query()
    .arguments({ lastMessageText: a.string().required(), usePastMessages: a.boolean() ,outputStructure: a.string().required(), chatSessionId: a.string().required() })
    .returns(a.string())
    .authorization(allow => allow.authenticated())
    .handler(
      a.handler.function(getStructuredOutputFromLangchainFunction)
    ),

  invokeProductionAgent: a
    .query()
    .arguments({
      lastMessageText: a.string().required(),//input
      chatSessionId: a.string(),
      usePreviousMessageContext: a.boolean(),
      messageOwnerIdentity: a.string(),// Use this to set the identiy of the owner of the messages
      doNotSendResponseComplete: a.boolean()//If this agent is called by another agent, don't send responseComplete in the final message
    })
    .returns(a.json())
    .handler(a.handler.function(productionAgentFunction))
    .authorization((allow) => [allow.authenticated()]),

  invokePlanAndExecuteAgent: a
    .query()
    .arguments({
      lastMessageText: a.string().required(),//input
      chatSessionId: a.string(),
    })
    .returns(a.json())
    .handler(a.handler.function(planAndExecuteAgentFunction))
    .authorization((allow) => [allow.authenticated()]),

  //These assets enable token level streaming from the model
  ResponseStreamChunk: a
    .customType({
      chunk: a.string().required(),
      index: a.integer(),
      chatSessionId: a.string().required()
    }),

  publishResponseStreamChunk: a
    .mutation()
    .arguments({
      chunk: a.string().required(),
      index: a.integer(),
      chatSessionId: a.string().required(),
    })
    .returns(a.ref('ResponseStreamChunk'))
    .handler(a.handler.custom({ entry: './publishMessageStreamChunk.js' }))
    .authorization(allow => [allow.authenticated()]),

  recieveResponseStreamChunk: a
    .subscription()
    .for(a.ref('publishResponseStreamChunk'))
    .arguments({ chatSessionId: a.string().required() })
    .handler(a.handler.custom({ entry: './receiveMessageStreamChunk.js' }))
    .authorization(allow => [allow.authenticated()]),

}).authorization(allow => [
  allow.resource(getStructuredOutputFromLangchainFunction),
  allow.resource(productionAgentFunction),
  allow.resource(invokeBedrockAgentFunction),
  allow.resource(planAndExecuteAgentFunction),
]);

export type Schema = ClientSchema<typeof schema>;

// https://aws-amplify.github.io/amplify-backend/functions/_aws_amplify_backend.defineData.html
export const data = defineData({
  schema: { schemas: [schema] },
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  }
});
