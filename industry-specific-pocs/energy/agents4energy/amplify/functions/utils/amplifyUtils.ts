import { validate } from 'jsonschema';
import { stringify } from 'yaml';

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import * as APITypes from "../graphql/API";
import { listChatMessageByChatSessionIdAndCreatedAt, listChatMessageByChatSessionIdDashFieldNameAndCreatedAt, getChatSession } from "../graphql/queries"
import { Schema } from '../../data/resource';

import { HumanMessage, AIMessage, AIMessageChunk, ToolMessage, BaseMessage, MessageContentText } from "@langchain/core/messages";

// Create a GraphQL query for messages in the chat session
type GeneratedMutation<InputType, OutputType> = string & {
    __generatedMutationInput: InputType;
    __generatedMutationOutput: OutputType;
};
export const createChatMessage = /* GraphQL */ `mutation CreateChatMessage(
$condition: ModelChatMessageConditionInput
$input: CreateChatMessageInput!
) {
createChatMessage(condition: $condition, input: $input) {
  role
  chatSessionId
  chatSessionIdDashFieldName
  chainOfThought
  content
  createdAt
  id
  owner
  tool_call_id
  tool_calls
  tool_name
  trace
  updatedAt
  responseComplete
  __typename
}
}
` as GeneratedMutation<
    APITypes.CreateChatMessageMutationVariables,
    APITypes.CreateChatMessageMutation
>;

export function getLangChainMessageTextContent(message: HumanMessage | AIMessage | AIMessageChunk | ToolMessage): string | void {
    // console.log('message type: ', message._getType())
    // console.log('Content type: ', typeof message.content)
    // console.log('(message.content[0] as MessageContentText).text', (message.content[0] as MessageContentText).text)

    let messageTextContent: string = ''

    if (typeof message.content === 'string') {
        messageTextContent += message.content
    } else {
        message.content.forEach((contentBlock) => {
            if ((contentBlock as MessageContentText).text !== undefined) messageTextContent += (contentBlock as MessageContentText).text + '\n'
            // else if ((contentBlock as MessageContentImageUrl).image_url !== undefined) messageContent += message.content.text !== undefined
        })
    }

    return messageTextContent

}
export function stringifyLimitStringLength(obj: any, maxLength: number = 200) {
    return stringify(obj, (key, value) => {
        if (typeof value === 'string' && value.length > maxLength) {
            return value.substring(0, maxLength) + '...';
        }
        return value;
    }, 2);
}

export interface FieldDefinition {
    type: string | Array<string>;
    description: string;
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    default?: any;
    items?: any;
}

export interface JsonSchema {
    title: string;
    description: string;
    type: string;
    properties: Record<string, FieldDefinition>;
    required: string[];
}

export async function correctStructuredOutputResponse(
    model: { invoke: (arg0: any) => any; },
    response: { raw: BaseMessage; parsed: Record<string, any>; },
    targetJsonSchema: JsonSchema | {},
    messages: BaseMessage[]
) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const validationReslut = validate(response.parsed, targetJsonSchema);
        // console.log(`Data validation result (${attempt}): `, validationReslut.valid);
        if (validationReslut.valid) break

        console.log("Data validation error:", validationReslut.errors.join('\n'));
        console.log('Model response which caused error: \n', response);
        messages.push(
            new AIMessage({ content: JSON.stringify(response.parsed) }),
            new HumanMessage({ content: `Data validation error: ${validationReslut.errors.join('\n')}. Please try again.` })
        );
        response = await model.invoke(messages)
    }

    if (!response.parsed) throw new Error("No parsed response from model");

    return response
}

export type PublishMessageCommandInput = {
    chatSessionId: string,
    fieldName?: string,
    owner: string,
    message: HumanMessage | AIMessage | ToolMessage,
    responseComplete?: boolean,
    chainOfThought?: boolean
}

type GeneratedClient = ReturnType<typeof generateClient<Schema>>;
export class AmplifyClientWrapper {
    // private env: any;
    public amplifyClient: GeneratedClient;
    public chatMessages: BaseMessage[];
    public chatSessionId: string
    public fieldName?: string

    constructor(props: { env: any, chatSessionId?: string, fieldName?: string }) {
        this.chatMessages = [];
        this.chatSessionId = props.chatSessionId || "";
        this.fieldName = props.fieldName || "";
        // console.log('AMPLIFY_DATA_GRAPHQL_ENDPOINT from env: ', props.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT)
        //   this.env = env;
        Amplify.configure(
            {
                API: {
                    GraphQL: {
                        endpoint: props.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT, // replace with your defineData name
                        region: props.env.AWS_REGION,
                        defaultAuthMode: 'identityPool',
                    }
                }
            },
            {
                Auth: {
                    credentialsProvider: {
                        getCredentialsAndIdentityId: async () => ({
                            credentials: {
                                accessKeyId: props.env.AWS_ACCESS_KEY_ID,
                                secretAccessKey: props.env.AWS_SECRET_ACCESS_KEY,
                                sessionToken: props.env.AWS_SESSION_TOKEN,
                            },
                        }),
                        clearCredentialsAndIdentityId: () => {
                            /* noop */
                        },
                    },
                },
            }
        );
        this.amplifyClient = generateClient<Schema>()
    }



    public async publishMessage(props: PublishMessageCommandInput) {
        if (!this.chatSessionId) throw new Error('Publish message called and chat session ID is not set')

        // Add the most recent message to the stored chat messages
        this.chatMessages.push(props.message)
        // console.log('chatMessages: ', this.chatMessages)

        const messageTextContent = getLangChainMessageTextContent(props.message)

        let input: APITypes.CreateChatMessageInput = {
            chatSessionId: props.chatSessionId,
            chatSessionIdDashFieldName: `${props.chatSessionId}-${props.fieldName}`,
            content: messageTextContent || "AI Message:\n",
            chainOfThought: props.chainOfThought || false,
            // contentBlocks: JSON.stringify(props.message.content), //The images are too big for DDB error:  ValidationException: The model returned the following errors: Input is too long for requested model.
            owner: props.owner,
            tool_calls: "[]",
            tool_call_id: "",
            tool_name: "",
            responseComplete: props.responseComplete || false
        }

        if (props.message instanceof HumanMessage) {
            input = { ...input, role: APITypes.ChatMessageRole.human }
        } else if (props.message instanceof AIMessage) {
            input = { ...input, role: APITypes.ChatMessageRole.ai, tool_calls: JSON.stringify(props.message.tool_calls) }
        } else if (props.message instanceof ToolMessage) {
            input = {
                ...input,
                role: APITypes.ChatMessageRole.tool,
                tool_call_id: props.message.tool_call_id,
                tool_name: props.message.name || 'no tool name supplied'
            }
        }

        // console.log('Publishing mesage with input: ', input)

        const publishMessageResponse = await this.amplifyClient.graphql({
            query: createChatMessage,
            variables: {
                input: input,
            },
        })
            .catch((err: any) => {
                console.error('GraphQL Error: ', err);
            });

        console.log('Publish message response: \n', stringifyLimitStringLength(publishMessageResponse))
    }

    // If you use the amplifyClient: Client type, you get the error below
    //Excessive stack depth comparing types 'Prettify<DeepReadOnlyObject<RestoreArrays<UnionToIntersection<DeepPickFromPath<FlatModel, ?[number]>>, FlatModel>>>' and 'Prettify<DeepReadOnlyObject<RestoreArrays<UnionToIntersection<DeepPickFromPath<FlatModel, ?[number]>>, FlatModel>>>'.ts(2321)
    public async getChatMessageHistory(props: { latestHumanMessageText?: string }): Promise<void> {
        // console.log('event: ', event)
        // console.log('context: ', context)
        // console.log('Amplify env: ', env)

        // if (!(props.chatSessionId)) throw new Error("Event does not contain chatSessionId");

        // Get the chat messages from the chat session
        const chatSessionMessages = await this.amplifyClient.graphql({ //listChatMessageByChatSessionIdAndCreatedAt
            query: listChatMessageByChatSessionIdAndCreatedAt,
            variables: {
                limit: 20,
                chatSessionId: this.chatSessionId,
                sortDirection: APITypes.ModelSortDirection.DESC,
                filter: {
                    chainOfThought: {
                        eq: true
                    }
                }
            }
        })

        console.log(`Retrieved ${chatSessionMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items.length} messages`)
        // console.log('ChatSessionMessageQueryResponse: ', stringifyLimitStringLength(chatSessionMessages))
        // console.log('messages from gql query: ', chatSessionMessages)

        // const sortedMessages = chatSessionMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items.reverse()
        const sortedMessages = chatSessionMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items.reverse()


        // Remove all of the messages before the first message with the role of human
        const firstHumanMessageIndex = sortedMessages.findIndex((message) => message.role === 'human');
        // const sortedMessagesStartingWithHumanMessage = sortedMessages.slice(firstHumanMessageIndex)
        const sortedMessagesStartingWithHumanMessage = firstHumanMessageIndex === -1
            ? []
            : sortedMessages.slice(firstHumanMessageIndex);

        //Here we're using the last 20 messages for memory
        const messages: BaseMessage[] = sortedMessagesStartingWithHumanMessage.map((message) => {
            if (message.role === 'human') {
                return new HumanMessage({
                    id: message.id,
                    content: message.content,
                })
            } else if (message.role === 'ai') {
                // if (!message.contentBlocks) throw new Error(`No contentBlocks in message: ${message}`);
                return new AIMessage({
                    content: [{
                        type: 'text',
                        text: message.content
                    }],
                    // content: JSON.parse(message.contentBlocks),
                    tool_calls: JSON.parse(message.tool_calls || '[]')
                })
            } else {
                // if (!message.contentBlocks) throw new Error(`No contentBlocks in message: ${message}`);
                return new ToolMessage({
                    content: message.content,
                    // content: JSON.parse(message.contentBlocks),
                    tool_call_id: message.tool_call_id || "",
                    name: message.tool_name || ""
                })
            }
        })

        // If the last message is from AI, add the latestHumanMessageText to the end of the messages.
        if (
            props.latestHumanMessageText && (
                messages.length === 0 || (
                    messages[messages.length - 1] &&
                    !(messages[messages.length - 1] instanceof HumanMessage)
                )
            )
        ) {
            messages.push(
                new HumanMessage({
                    content: props.latestHumanMessageText,
                })
            )
        } else {
            console.log('Last message in query is a human message')
        }

        // console.log("mesages in langchain form: ", messages)
        // return messages
        this.chatMessages = messages
        // }

    }

    public async getChatSession(props: { chatSessionId: string }) {
        const chatSession = await this.amplifyClient.graphql({
            query: getChatSession,
            variables: {
                id: props.chatSessionId,
            }
        })
        return chatSession.data.getChatSession
    }

}