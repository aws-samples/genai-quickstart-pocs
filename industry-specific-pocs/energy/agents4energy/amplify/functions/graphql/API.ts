/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ChatMessage = {
  __typename: "ChatMessage",
  chainOfThought?: boolean | null,
  chatSessionId?: string | null,
  chatSessionIdDashFieldName?: string | null,
  content: string,
  createdAt?: string | null,
  id: string,
  owner?: string | null,
  responseComplete?: boolean | null,
  role?: ChatMessageRole | null,
  session?: ChatSession | null,
  tool_call_id?: string | null,
  tool_calls?: string | null,
  tool_name?: string | null,
  trace?: string | null,
  updatedAt: string,
};

export enum ChatMessageRole {
  ai = "ai",
  human = "human",
  tool = "tool",
}


export type ChatSession = {
  __typename: "ChatSession",
  aiBotInfo?: ChatSessionAiBotInfo | null,
  createdAt: string,
  firstMessageSummary?: string | null,
  id: string,
  messages?: ModelChatMessageConnection | null,
  owner?: string | null,
  pastSteps?: Array< string | null > | null,
  planGoal?: string | null,
  planSteps?: Array< string | null > | null,
  updatedAt: string,
};

export type ChatSessionAiBotInfo = {
  __typename: "ChatSessionAiBotInfo",
  aiBotAliasId?: string | null,
  aiBotId?: string | null,
  aiBotName?: string | null,
  aiBotVersion?: string | null,
};

export type ModelChatMessageConnection = {
  __typename: "ModelChatMessageConnection",
  items:  Array<ChatMessage | null >,
  nextToken?: string | null,
};

export type BedrockResponse = {
  __typename: "BedrockResponse",
  body?: string | null,
  error?: string | null,
};

export type BedrockAgentResponse = {
  __typename: "BedrockAgentResponse",
  completion?: string | null,
  orchestrationTrace?: string | null,
};

export type ModelStringKeyConditionInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
};

export type ModelChatMessageFilterInput = {
  and?: Array< ModelChatMessageFilterInput | null > | null,
  chainOfThought?: ModelBooleanInput | null,
  chatSessionId?: ModelIDInput | null,
  chatSessionIdDashFieldName?: ModelStringInput | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelChatMessageFilterInput | null,
  or?: Array< ModelChatMessageFilterInput | null > | null,
  owner?: ModelStringInput | null,
  responseComplete?: ModelBooleanInput | null,
  role?: ModelChatMessageRoleInput | null,
  tool_call_id?: ModelStringInput | null,
  tool_calls?: ModelStringInput | null,
  tool_name?: ModelStringInput | null,
  trace?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelBooleanInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  eq?: boolean | null,
  ne?: boolean | null,
};

export enum ModelAttributeTypes {
  _null = "_null",
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
}


export type ModelIDInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelSizeInput = {
  between?: Array< number | null > | null,
  eq?: number | null,
  ge?: number | null,
  gt?: number | null,
  le?: number | null,
  lt?: number | null,
  ne?: number | null,
};

export type ModelStringInput = {
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  size?: ModelSizeInput | null,
};

export type ModelChatMessageRoleInput = {
  eq?: ChatMessageRole | null,
  ne?: ChatMessageRole | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelChatSessionFilterInput = {
  and?: Array< ModelChatSessionFilterInput | null > | null,
  createdAt?: ModelStringInput | null,
  firstMessageSummary?: ModelStringInput | null,
  id?: ModelIDInput | null,
  not?: ModelChatSessionFilterInput | null,
  or?: Array< ModelChatSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  pastSteps?: ModelStringInput | null,
  planGoal?: ModelStringInput | null,
  planSteps?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelChatSessionConnection = {
  __typename: "ModelChatSessionConnection",
  items:  Array<ChatSession | null >,
  nextToken?: string | null,
};

export type ModelChatMessageConditionInput = {
  and?: Array< ModelChatMessageConditionInput | null > | null,
  chainOfThought?: ModelBooleanInput | null,
  chatSessionId?: ModelIDInput | null,
  chatSessionIdDashFieldName?: ModelStringInput | null,
  content?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  not?: ModelChatMessageConditionInput | null,
  or?: Array< ModelChatMessageConditionInput | null > | null,
  owner?: ModelStringInput | null,
  responseComplete?: ModelBooleanInput | null,
  role?: ModelChatMessageRoleInput | null,
  tool_call_id?: ModelStringInput | null,
  tool_calls?: ModelStringInput | null,
  tool_name?: ModelStringInput | null,
  trace?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateChatMessageInput = {
  chainOfThought?: boolean | null,
  chatSessionId?: string | null,
  chatSessionIdDashFieldName?: string | null,
  content: string,
  createdAt?: string | null,
  id?: string | null,
  owner?: string | null,
  responseComplete?: boolean | null,
  role?: ChatMessageRole | null,
  tool_call_id?: string | null,
  tool_calls?: string | null,
  tool_name?: string | null,
  trace?: string | null,
};

export type ModelChatSessionConditionInput = {
  and?: Array< ModelChatSessionConditionInput | null > | null,
  createdAt?: ModelStringInput | null,
  firstMessageSummary?: ModelStringInput | null,
  not?: ModelChatSessionConditionInput | null,
  or?: Array< ModelChatSessionConditionInput | null > | null,
  owner?: ModelStringInput | null,
  pastSteps?: ModelStringInput | null,
  planGoal?: ModelStringInput | null,
  planSteps?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type CreateChatSessionInput = {
  aiBotInfo?: ChatSessionAiBotInfoInput | null,
  firstMessageSummary?: string | null,
  id?: string | null,
  pastSteps?: Array< string | null > | null,
  planGoal?: string | null,
  planSteps?: Array< string | null > | null,
};

export type ChatSessionAiBotInfoInput = {
  aiBotAliasId?: string | null,
  aiBotId?: string | null,
  aiBotName?: string | null,
  aiBotVersion?: string | null,
};

export type DeleteChatMessageInput = {
  id: string,
};

export type DeleteChatSessionInput = {
  id: string,
};

export type ResponseStreamChunk = {
  __typename: "ResponseStreamChunk",
  chatSessionId: string,
  chunk: string,
  index?: number | null,
};

export type UpdateChatMessageInput = {
  chainOfThought?: boolean | null,
  chatSessionId?: string | null,
  chatSessionIdDashFieldName?: string | null,
  content?: string | null,
  createdAt?: string | null,
  id: string,
  owner?: string | null,
  responseComplete?: boolean | null,
  role?: ChatMessageRole | null,
  tool_call_id?: string | null,
  tool_calls?: string | null,
  tool_name?: string | null,
  trace?: string | null,
};

export type UpdateChatSessionInput = {
  aiBotInfo?: ChatSessionAiBotInfoInput | null,
  firstMessageSummary?: string | null,
  id: string,
  pastSteps?: Array< string | null > | null,
  planGoal?: string | null,
  planSteps?: Array< string | null > | null,
};

export type ModelSubscriptionChatMessageFilterInput = {
  and?: Array< ModelSubscriptionChatMessageFilterInput | null > | null,
  chainOfThought?: ModelSubscriptionBooleanInput | null,
  chatSessionId?: ModelSubscriptionIDInput | null,
  chatSessionIdDashFieldName?: ModelSubscriptionStringInput | null,
  content?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionChatMessageFilterInput | null > | null,
  owner?: ModelStringInput | null,
  responseComplete?: ModelSubscriptionBooleanInput | null,
  role?: ModelSubscriptionStringInput | null,
  tool_call_id?: ModelSubscriptionStringInput | null,
  tool_calls?: ModelSubscriptionStringInput | null,
  tool_name?: ModelSubscriptionStringInput | null,
  trace?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type ModelSubscriptionBooleanInput = {
  eq?: boolean | null,
  ne?: boolean | null,
};

export type ModelSubscriptionIDInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  beginsWith?: string | null,
  between?: Array< string | null > | null,
  contains?: string | null,
  eq?: string | null,
  ge?: string | null,
  gt?: string | null,
  in?: Array< string | null > | null,
  le?: string | null,
  lt?: string | null,
  ne?: string | null,
  notContains?: string | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionChatSessionFilterInput = {
  and?: Array< ModelSubscriptionChatSessionFilterInput | null > | null,
  createdAt?: ModelSubscriptionStringInput | null,
  firstMessageSummary?: ModelSubscriptionStringInput | null,
  id?: ModelSubscriptionIDInput | null,
  or?: Array< ModelSubscriptionChatSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
  pastSteps?: ModelSubscriptionStringInput | null,
  planGoal?: ModelSubscriptionStringInput | null,
  planSteps?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
};

export type GetChatMessageQueryVariables = {
  id: string,
};

export type GetChatMessageQuery = {
  getChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type GetChatSessionQueryVariables = {
  id: string,
};

export type GetChatSessionQuery = {
  getChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type InvokeBedrockQueryVariables = {
  prompt?: string | null,
};

export type InvokeBedrockQuery = {
  invokeBedrock?:  {
    __typename: "BedrockResponse",
    body?: string | null,
    error?: string | null,
  } | null,
};

export type InvokeBedrockAgentQueryVariables = {
  agentAliasId: string,
  agentId: string,
  chatSessionId: string,
  prompt: string,
};

export type InvokeBedrockAgentQuery = {
  invokeBedrockAgent?:  {
    __typename: "BedrockAgentResponse",
    completion?: string | null,
    orchestrationTrace?: string | null,
  } | null,
};

export type InvokeBedrockWithStructuredOutputQueryVariables = {
  chatSessionId: string,
  lastMessageText: string,
  outputStructure: string,
};

export type InvokeBedrockWithStructuredOutputQuery = {
  invokeBedrockWithStructuredOutput?: string | null,
};

export type InvokePlanAndExecuteAgentQueryVariables = {
  chatSessionId?: string | null,
  lastMessageText: string,
};

export type InvokePlanAndExecuteAgentQuery = {
  invokePlanAndExecuteAgent?: string | null,
};

export type InvokeProductionAgentQueryVariables = {
  chatSessionId?: string | null,
  doNotSendResponseComplete?: boolean | null,
  lastMessageText: string,
  messageOwnerIdentity?: string | null,
  usePreviousMessageContext?: boolean | null,
};

export type InvokeProductionAgentQuery = {
  invokeProductionAgent?: string | null,
};

export type ListBedrockAgentAliasIdsQueryVariables = {
  agentId?: string | null,
};

export type ListBedrockAgentAliasIdsQuery = {
  listBedrockAgentAliasIds?:  {
    __typename: "BedrockResponse",
    body?: string | null,
    error?: string | null,
  } | null,
};

export type ListBedrockAgentsQueryVariables = {
};

export type ListBedrockAgentsQuery = {
  listBedrockAgents?:  {
    __typename: "BedrockResponse",
    body?: string | null,
    error?: string | null,
  } | null,
};

export type ListChatMessageByChatSessionIdAndCreatedAtQueryVariables = {
  chatSessionId: string,
  createdAt?: ModelStringKeyConditionInput | null,
  filter?: ModelChatMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListChatMessageByChatSessionIdAndCreatedAtQuery = {
  listChatMessageByChatSessionIdAndCreatedAt?:  {
    __typename: "ModelChatMessageConnection",
    items:  Array< {
      __typename: "ChatMessage",
      chainOfThought?: boolean | null,
      chatSessionId?: string | null,
      chatSessionIdDashFieldName?: string | null,
      content: string,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: ChatMessageRole | null,
      tool_call_id?: string | null,
      tool_calls?: string | null,
      tool_name?: string | null,
      trace?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatMessageByChatSessionIdDashFieldNameAndCreatedAtQueryVariables = {
  chatSessionIdDashFieldName: string,
  createdAt?: ModelStringKeyConditionInput | null,
  filter?: ModelChatMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
  sortDirection?: ModelSortDirection | null,
};

export type ListChatMessageByChatSessionIdDashFieldNameAndCreatedAtQuery = {
  listChatMessageByChatSessionIdDashFieldNameAndCreatedAt?:  {
    __typename: "ModelChatMessageConnection",
    items:  Array< {
      __typename: "ChatMessage",
      chainOfThought?: boolean | null,
      chatSessionId?: string | null,
      chatSessionIdDashFieldName?: string | null,
      content: string,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: ChatMessageRole | null,
      tool_call_id?: string | null,
      tool_calls?: string | null,
      tool_name?: string | null,
      trace?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatMessagesQueryVariables = {
  filter?: ModelChatMessageFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListChatMessagesQuery = {
  listChatMessages?:  {
    __typename: "ModelChatMessageConnection",
    items:  Array< {
      __typename: "ChatMessage",
      chainOfThought?: boolean | null,
      chatSessionId?: string | null,
      chatSessionIdDashFieldName?: string | null,
      content: string,
      createdAt?: string | null,
      id: string,
      owner?: string | null,
      responseComplete?: boolean | null,
      role?: ChatMessageRole | null,
      tool_call_id?: string | null,
      tool_calls?: string | null,
      tool_name?: string | null,
      trace?: string | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type ListChatSessionsQueryVariables = {
  filter?: ModelChatSessionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListChatSessionsQuery = {
  listChatSessions?:  {
    __typename: "ModelChatSessionConnection",
    items:  Array< {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type CreateChatMessageMutationVariables = {
  condition?: ModelChatMessageConditionInput | null,
  input: CreateChatMessageInput,
};

export type CreateChatMessageMutation = {
  createChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type CreateChatSessionMutationVariables = {
  condition?: ModelChatSessionConditionInput | null,
  input: CreateChatSessionInput,
};

export type CreateChatSessionMutation = {
  createChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type DeleteChatMessageMutationVariables = {
  condition?: ModelChatMessageConditionInput | null,
  input: DeleteChatMessageInput,
};

export type DeleteChatMessageMutation = {
  deleteChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type DeleteChatSessionMutationVariables = {
  condition?: ModelChatSessionConditionInput | null,
  input: DeleteChatSessionInput,
};

export type DeleteChatSessionMutation = {
  deleteChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type PublishResponseStreamChunkMutationVariables = {
  chatSessionId: string,
  chunk: string,
  index?: number | null,
};

export type PublishResponseStreamChunkMutation = {
  publishResponseStreamChunk?:  {
    __typename: "ResponseStreamChunk",
    chatSessionId: string,
    chunk: string,
    index?: number | null,
  } | null,
};

export type UpdateChatMessageMutationVariables = {
  condition?: ModelChatMessageConditionInput | null,
  input: UpdateChatMessageInput,
};

export type UpdateChatMessageMutation = {
  updateChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type UpdateChatSessionMutationVariables = {
  condition?: ModelChatSessionConditionInput | null,
  input: UpdateChatSessionInput,
};

export type UpdateChatSessionMutation = {
  updateChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type OnCreateChatMessageSubscriptionVariables = {
  filter?: ModelSubscriptionChatMessageFilterInput | null,
  owner?: string | null,
};

export type OnCreateChatMessageSubscription = {
  onCreateChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type OnCreateChatSessionSubscriptionVariables = {
  filter?: ModelSubscriptionChatSessionFilterInput | null,
  owner?: string | null,
};

export type OnCreateChatSessionSubscription = {
  onCreateChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteChatMessageSubscriptionVariables = {
  filter?: ModelSubscriptionChatMessageFilterInput | null,
  owner?: string | null,
};

export type OnDeleteChatMessageSubscription = {
  onDeleteChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type OnDeleteChatSessionSubscriptionVariables = {
  filter?: ModelSubscriptionChatSessionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteChatSessionSubscription = {
  onDeleteChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateChatMessageSubscriptionVariables = {
  filter?: ModelSubscriptionChatMessageFilterInput | null,
  owner?: string | null,
};

export type OnUpdateChatMessageSubscription = {
  onUpdateChatMessage?:  {
    __typename: "ChatMessage",
    chainOfThought?: boolean | null,
    chatSessionId?: string | null,
    chatSessionIdDashFieldName?: string | null,
    content: string,
    createdAt?: string | null,
    id: string,
    owner?: string | null,
    responseComplete?: boolean | null,
    role?: ChatMessageRole | null,
    session?:  {
      __typename: "ChatSession",
      createdAt: string,
      firstMessageSummary?: string | null,
      id: string,
      owner?: string | null,
      pastSteps?: Array< string | null > | null,
      planGoal?: string | null,
      planSteps?: Array< string | null > | null,
      updatedAt: string,
    } | null,
    tool_call_id?: string | null,
    tool_calls?: string | null,
    tool_name?: string | null,
    trace?: string | null,
    updatedAt: string,
  } | null,
};

export type OnUpdateChatSessionSubscriptionVariables = {
  filter?: ModelSubscriptionChatSessionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateChatSessionSubscription = {
  onUpdateChatSession?:  {
    __typename: "ChatSession",
    aiBotInfo?:  {
      __typename: "ChatSessionAiBotInfo",
      aiBotAliasId?: string | null,
      aiBotId?: string | null,
      aiBotName?: string | null,
      aiBotVersion?: string | null,
    } | null,
    createdAt: string,
    firstMessageSummary?: string | null,
    id: string,
    messages?:  {
      __typename: "ModelChatMessageConnection",
      nextToken?: string | null,
    } | null,
    owner?: string | null,
    pastSteps?: Array< string | null > | null,
    planGoal?: string | null,
    planSteps?: Array< string | null > | null,
    updatedAt: string,
  } | null,
};

export type RecieveResponseStreamChunkSubscriptionVariables = {
  chatSessionId: string,
};

export type RecieveResponseStreamChunkSubscription = {
  recieveResponseStreamChunk?:  {
    __typename: "ResponseStreamChunk",
    chatSessionId: string,
    chunk: string,
    index?: number | null,
  } | null,
};
