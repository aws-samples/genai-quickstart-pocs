/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createChatMessage = /* GraphQL */ `mutation CreateChatMessage(
  $condition: ModelChatMessageConditionInput
  $input: CreateChatMessageInput!
) {
  createChatMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateChatMessageMutationVariables,
  APITypes.CreateChatMessageMutation
>;
export const createChatSession = /* GraphQL */ `mutation CreateChatSession(
  $condition: ModelChatSessionConditionInput
  $input: CreateChatSessionInput!
) {
  createChatSession(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.CreateChatSessionMutationVariables,
  APITypes.CreateChatSessionMutation
>;
export const deleteChatMessage = /* GraphQL */ `mutation DeleteChatMessage(
  $condition: ModelChatMessageConditionInput
  $input: DeleteChatMessageInput!
) {
  deleteChatMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteChatMessageMutationVariables,
  APITypes.DeleteChatMessageMutation
>;
export const deleteChatSession = /* GraphQL */ `mutation DeleteChatSession(
  $condition: ModelChatSessionConditionInput
  $input: DeleteChatSessionInput!
) {
  deleteChatSession(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.DeleteChatSessionMutationVariables,
  APITypes.DeleteChatSessionMutation
>;
export const publishResponseStreamChunk = /* GraphQL */ `mutation PublishResponseStreamChunk(
  $chatSessionId: String!
  $chunk: String!
  $index: Int
) {
  publishResponseStreamChunk(
    chatSessionId: $chatSessionId
    chunk: $chunk
    index: $index
  ) {
    chatSessionId
    chunk
    index
    __typename
  }
}
` as GeneratedMutation<
  APITypes.PublishResponseStreamChunkMutationVariables,
  APITypes.PublishResponseStreamChunkMutation
>;
export const updateChatMessage = /* GraphQL */ `mutation UpdateChatMessage(
  $condition: ModelChatMessageConditionInput
  $input: UpdateChatMessageInput!
) {
  updateChatMessage(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateChatMessageMutationVariables,
  APITypes.UpdateChatMessageMutation
>;
export const updateChatSession = /* GraphQL */ `mutation UpdateChatSession(
  $condition: ModelChatSessionConditionInput
  $input: UpdateChatSessionInput!
) {
  updateChatSession(condition: $condition, input: $input) {
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
` as GeneratedMutation<
  APITypes.UpdateChatSessionMutationVariables,
  APITypes.UpdateChatSessionMutation
>;
