/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "./API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateChatMessage = /* GraphQL */ `subscription OnCreateChatMessage(
  $filter: ModelSubscriptionChatMessageFilterInput
  $owner: String
) {
  onCreateChatMessage(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateChatMessageSubscriptionVariables,
  APITypes.OnCreateChatMessageSubscription
>;
export const onCreateChatSession = /* GraphQL */ `subscription OnCreateChatSession(
  $filter: ModelSubscriptionChatSessionFilterInput
  $owner: String
) {
  onCreateChatSession(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnCreateChatSessionSubscriptionVariables,
  APITypes.OnCreateChatSessionSubscription
>;
export const onDeleteChatMessage = /* GraphQL */ `subscription OnDeleteChatMessage(
  $filter: ModelSubscriptionChatMessageFilterInput
  $owner: String
) {
  onDeleteChatMessage(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteChatMessageSubscriptionVariables,
  APITypes.OnDeleteChatMessageSubscription
>;
export const onDeleteChatSession = /* GraphQL */ `subscription OnDeleteChatSession(
  $filter: ModelSubscriptionChatSessionFilterInput
  $owner: String
) {
  onDeleteChatSession(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnDeleteChatSessionSubscriptionVariables,
  APITypes.OnDeleteChatSessionSubscription
>;
export const onUpdateChatMessage = /* GraphQL */ `subscription OnUpdateChatMessage(
  $filter: ModelSubscriptionChatMessageFilterInput
  $owner: String
) {
  onUpdateChatMessage(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateChatMessageSubscriptionVariables,
  APITypes.OnUpdateChatMessageSubscription
>;
export const onUpdateChatSession = /* GraphQL */ `subscription OnUpdateChatSession(
  $filter: ModelSubscriptionChatSessionFilterInput
  $owner: String
) {
  onUpdateChatSession(filter: $filter, owner: $owner) {
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
` as GeneratedSubscription<
  APITypes.OnUpdateChatSessionSubscriptionVariables,
  APITypes.OnUpdateChatSessionSubscription
>;
export const recieveResponseStreamChunk = /* GraphQL */ `subscription RecieveResponseStreamChunk($chatSessionId: String!) {
  recieveResponseStreamChunk(chatSessionId: $chatSessionId) {
    chatSessionId
    chunk
    index
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.RecieveResponseStreamChunkSubscriptionVariables,
  APITypes.RecieveResponseStreamChunkSubscription
>;
