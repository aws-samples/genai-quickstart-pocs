/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getChatMessage = /* GraphQL */ `query GetChatMessage($id: ID!) {
  getChatMessage(id: $id) {
    chainOfThought
    chatSessionId
    chatSessionIdDashFieldName
    content
    createdAt
    id
    owner
    responseComplete
    role
    session {
      createdAt
      firstMessageSummary
      id
      owner
      pastSteps
      planGoal
      planSteps
      updatedAt
      __typename
    }
    tool_call_id
    tool_calls
    tool_name
    trace
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetChatMessageQueryVariables,
  APITypes.GetChatMessageQuery
>;
export const getChatSession = /* GraphQL */ `query GetChatSession($id: ID!) {
  getChatSession(id: $id) {
    aiBotInfo {
      aiBotAliasId
      aiBotId
      aiBotName
      aiBotVersion
      __typename
    }
    createdAt
    firstMessageSummary
    id
    messages {
      nextToken
      __typename
    }
    owner
    pastSteps
    planGoal
    planSteps
    updatedAt
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetChatSessionQueryVariables,
  APITypes.GetChatSessionQuery
>;
export const invokeBedrock = /* GraphQL */ `query InvokeBedrock($prompt: String) {
  invokeBedrock(prompt: $prompt) {
    body
    error
    __typename
  }
}
` as GeneratedQuery<
  APITypes.InvokeBedrockQueryVariables,
  APITypes.InvokeBedrockQuery
>;
export const invokeBedrockAgent = /* GraphQL */ `query InvokeBedrockAgent(
  $agentAliasId: String!
  $agentId: String!
  $chatSessionId: String!
  $prompt: String!
) {
  invokeBedrockAgent(
    agentAliasId: $agentAliasId
    agentId: $agentId
    chatSessionId: $chatSessionId
    prompt: $prompt
  ) {
    completion
    orchestrationTrace
    __typename
  }
}
` as GeneratedQuery<
  APITypes.InvokeBedrockAgentQueryVariables,
  APITypes.InvokeBedrockAgentQuery
>;
export const invokeBedrockWithStructuredOutput = /* GraphQL */ `query InvokeBedrockWithStructuredOutput(
  $chatSessionId: String!
  $lastMessageText: String!
  $outputStructure: String!
) {
  invokeBedrockWithStructuredOutput(
    chatSessionId: $chatSessionId
    lastMessageText: $lastMessageText
    outputStructure: $outputStructure
  )
}
` as GeneratedQuery<
  APITypes.InvokeBedrockWithStructuredOutputQueryVariables,
  APITypes.InvokeBedrockWithStructuredOutputQuery
>;
export const invokePlanAndExecuteAgent = /* GraphQL */ `query InvokePlanAndExecuteAgent(
  $chatSessionId: String
  $lastMessageText: String!
) {
  invokePlanAndExecuteAgent(
    chatSessionId: $chatSessionId
    lastMessageText: $lastMessageText
  )
}
` as GeneratedQuery<
  APITypes.InvokePlanAndExecuteAgentQueryVariables,
  APITypes.InvokePlanAndExecuteAgentQuery
>;
export const invokeProductionAgent = /* GraphQL */ `query InvokeProductionAgent(
  $chatSessionId: String
  $doNotSendResponseComplete: Boolean
  $lastMessageText: String!
  $messageOwnerIdentity: String
  $usePreviousMessageContext: Boolean
) {
  invokeProductionAgent(
    chatSessionId: $chatSessionId
    doNotSendResponseComplete: $doNotSendResponseComplete
    lastMessageText: $lastMessageText
    messageOwnerIdentity: $messageOwnerIdentity
    usePreviousMessageContext: $usePreviousMessageContext
  )
}
` as GeneratedQuery<
  APITypes.InvokeProductionAgentQueryVariables,
  APITypes.InvokeProductionAgentQuery
>;
export const listBedrockAgentAliasIds = /* GraphQL */ `query ListBedrockAgentAliasIds($agentId: String) {
  listBedrockAgentAliasIds(agentId: $agentId) {
    body
    error
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBedrockAgentAliasIdsQueryVariables,
  APITypes.ListBedrockAgentAliasIdsQuery
>;
export const listBedrockAgents = /* GraphQL */ `query ListBedrockAgents {
  listBedrockAgents {
    body
    error
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListBedrockAgentsQueryVariables,
  APITypes.ListBedrockAgentsQuery
>;
export const listChatMessageByChatSessionIdAndCreatedAt = /* GraphQL */ `query ListChatMessageByChatSessionIdAndCreatedAt(
  $chatSessionId: ID!
  $createdAt: ModelStringKeyConditionInput
  $filter: ModelChatMessageFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listChatMessageByChatSessionIdAndCreatedAt(
    chatSessionId: $chatSessionId
    createdAt: $createdAt
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      chainOfThought
      chatSessionId
      chatSessionIdDashFieldName
      content
      createdAt
      id
      owner
      responseComplete
      role
      tool_call_id
      tool_calls
      tool_name
      trace
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatMessageByChatSessionIdAndCreatedAtQueryVariables,
  APITypes.ListChatMessageByChatSessionIdAndCreatedAtQuery
>;
export const listChatMessageByChatSessionIdDashFieldNameAndCreatedAt = /* GraphQL */ `query ListChatMessageByChatSessionIdDashFieldNameAndCreatedAt(
  $chatSessionIdDashFieldName: String!
  $createdAt: ModelStringKeyConditionInput
  $filter: ModelChatMessageFilterInput
  $limit: Int
  $nextToken: String
  $sortDirection: ModelSortDirection
) {
  listChatMessageByChatSessionIdDashFieldNameAndCreatedAt(
    chatSessionIdDashFieldName: $chatSessionIdDashFieldName
    createdAt: $createdAt
    filter: $filter
    limit: $limit
    nextToken: $nextToken
    sortDirection: $sortDirection
  ) {
    items {
      chainOfThought
      chatSessionId
      chatSessionIdDashFieldName
      content
      createdAt
      id
      owner
      responseComplete
      role
      tool_call_id
      tool_calls
      tool_name
      trace
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatMessageByChatSessionIdDashFieldNameAndCreatedAtQueryVariables,
  APITypes.ListChatMessageByChatSessionIdDashFieldNameAndCreatedAtQuery
>;
export const listChatMessages = /* GraphQL */ `query ListChatMessages(
  $filter: ModelChatMessageFilterInput
  $limit: Int
  $nextToken: String
) {
  listChatMessages(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      chainOfThought
      chatSessionId
      chatSessionIdDashFieldName
      content
      createdAt
      id
      owner
      responseComplete
      role
      tool_call_id
      tool_calls
      tool_name
      trace
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatMessagesQueryVariables,
  APITypes.ListChatMessagesQuery
>;
export const listChatSessions = /* GraphQL */ `query ListChatSessions(
  $filter: ModelChatSessionFilterInput
  $limit: Int
  $nextToken: String
) {
  listChatSessions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      createdAt
      firstMessageSummary
      id
      owner
      pastSteps
      planGoal
      planSteps
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListChatSessionsQueryVariables,
  APITypes.ListChatSessionsQuery
>;
