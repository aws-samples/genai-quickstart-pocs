import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../data/resource';
import { env } from '$amplify/env/get-structured-output';

import { listChatMessageByChatSessionIdAndCreatedAt } from "./graphql/queries"
import * as APITypes from "./graphql/API";

import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, AIMessage, ToolMessage, BaseMessage, MessageContentText } from "@langchain/core/messages";
import { stringifyLimitStringLength } from './utils/amplifyUtils'

import { validate } from 'jsonschema';

Amplify.configure(
    {
        API: {
            GraphQL: {
                endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT, // replace with your defineData name
                region: env.AWS_REGION,
                defaultAuthMode: 'identityPool'
            }
        }
    },
    {
        Auth: {
            credentialsProvider: {
                getCredentialsAndIdentityId: async () => ({
                    credentials: {
                        accessKeyId: env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
                        sessionToken: env.AWS_SESSION_TOKEN,
                    },
                }),
                clearCredentialsAndIdentityId: () => {
                    /* noop */
                },
            },
        },
    }
);

const amplifyClient = generateClient<Schema>();

interface FieldDefinition {
    type: string  | Array<string>;
    description: string;
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    default?: any;
    items?: any;
}

interface JsonSchema {
    title: string | Array<string>;
    description: string;
    type: string;
    properties: Record<string, FieldDefinition>;
    required: string[];
}

async function getSortedMessages(chatSessionId: string, latestHumanMessageText: string) {
    // Get the chat messages from the chat session
    const chatSessionMessages = await amplifyClient.graphql({ //listChatMessageByChatSessionIdAndCreatedAt
        query: listChatMessageByChatSessionIdAndCreatedAt,
        variables: {
            limit: 20,
            chatSessionId: chatSessionId,
            sortDirection: APITypes.ModelSortDirection.DESC
        }
    })

    // console.log('messages from gql query: ', chatSessionMessages)

    const sortedMessages = chatSessionMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items.reverse()

    if (sortedMessages.length === 0) return [ //Here there are no messages in the chat session
        new HumanMessage({
            content: latestHumanMessageText,
        })
    ]

    //Messages in a graph may not alternate between human, ai, and tool messages. Put all info into one human message to account for this.
    return [
        new HumanMessage({
            content: sortedMessages
                .map(message => `Role: ${message.role}\nContent: ${message.content}`)
                .join("\n\n") + `\n\n Role: human\nContent: ${latestHumanMessageText}`
        })
    ]

    // // Remove all of the messages before the first message with the role of human
    // const firstHumanMessageIndex = sortedMessages.findIndex((message) => message.role === 'human');
    // const sortedMessagesStartingWithHumanMessage = sortedMessages.slice(firstHumanMessageIndex)

    // //Here we're using the last 20 messages for memory
    // const messages: BaseMessage[] = sortedMessagesStartingWithHumanMessage.map((message) => {
    //     if (message.role === 'human') {
    //         return new HumanMessage({
    //             content: message.content,
    //         })
    //     } else if (message.role === 'ai') {
    //         return new AIMessage({
    //             content: [{
    //                 type: 'text',
    //                 text: message.content
    //             }],
    //             tool_calls: JSON.parse(message.tool_calls || '[]')
    //         })
    //     } else {
    //         return new ToolMessage({
    //             content: message.content,
    //             tool_call_id: message.tool_call_id || "",
    //             name: message.tool_name || ""
    //         })
    //     }
    // })

    // // If the last message is from AI, add the latestHumanMessageText to the end of the messages.
    // if (
    //     messages &&
    //     messages[messages.length - 1] &&
    //     !(messages[messages.length - 1] instanceof HumanMessage)

    // ) {
    //     messages.push(
    //         new HumanMessage({
    //             content: latestHumanMessageText,
    //         })
    //     )
    // }

    // // console.log("mesages in langchain form:\n", stringifyLimitStringLength(messages))

    // return messages
}

export async function correctStructuredOutputResponse(model: { invoke: (arg0: any) => any; }, response: { raw: BaseMessage; parsed: Record<string, any>; }, targetJsonSchema: JsonSchema, messages: BaseMessage[]) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const validationReslut = validate(response.parsed, targetJsonSchema);

        if (validationReslut.valid) break
        console.log(`Data validation result (${attempt}): `, validationReslut.valid);

        console.log("Data validation error:", validationReslut.errors.join('\n'));
        console.log('Model response which caused error: \n', response);
        messages.push(
            new AIMessage({ content: JSON.stringify(response.parsed) }),
            new HumanMessage({ content: `Data validation error: ${validationReslut.errors.join('\n')}. Please try again.` })
        );
        console.log('Messages sent to model: \n', stringifyLimitStringLength(messages))
        response = await model.invoke(messages)
    }

    console.log('Parsed model response: ', response.parsed)

    if (!response.parsed) throw new Error("No parsed response from model");

    return response
}

export const getStructuredOutputResponse = async (props: {modelId: string, messages: BaseMessage[], outputStructure: JsonSchema}) => {


    const chatModelWithStructuredOutput = new ChatBedrockConverse({
        model: props.modelId || process.env.MODEL_ID,
        temperature: 0
    }).withStructuredOutput(
        props.outputStructure, 
        {includeRaw: true}
    )

    let structuredOutputResponse = await chatModelWithStructuredOutput.invoke(props.messages)

    structuredOutputResponse = await correctStructuredOutputResponse(
        chatModelWithStructuredOutput,
        structuredOutputResponse,
        props.outputStructure,
        props.messages
    )

    if (!structuredOutputResponse.parsed) throw new Error(`No parsed response from model. Full response: ${structuredOutputResponse}`);

    return structuredOutputResponse.parsed
}

export const handler: Schema["invokeBedrockWithStructuredOutput"]["functionHandler"] = async (event) => {
    
    const outputStructure = JSON.parse(event.arguments.outputStructure)
    // console.log('target output structure:\n', JSON.stringify(outputStructure, null, 2))

    const sortedLangchainMessages = (event.arguments.usePastMessages) ?
        await getSortedMessages(event.arguments.chatSessionId, event.arguments.lastMessageText) :
        [
            new HumanMessage({
                content: event.arguments.lastMessageText,
            })
        ]
    // console.log('sorted messages:\n', sortedLangchainMessages)

    const structuredOutputResponse = await getStructuredOutputResponse({
        modelId: env.MODEL_ID,
        messages: sortedLangchainMessages,
        outputStructure: outputStructure
    })

    return JSON.stringify(structuredOutputResponse)

    // const chatModelWithStructuredOutput = new ChatBedrockConverse({
    //     model: process.env.MODEL_ID,
    //     temperature: 0
    // }).withStructuredOutput(
    //     outputStructure, 
    //     {includeRaw: true}
    // )

    // let structuredOutputResponse = await chatModelWithStructuredOutput.invoke(sortedLangchainMessages)

    // structuredOutputResponse = await correctStructuredOutputResponse(
    //     chatModelWithStructuredOutput,
    //     structuredOutputResponse,
    //     outputStructure,
    //     sortedLangchainMessages
    // )

    // if (!structuredOutputResponse.parsed) throw new Error(`No parsed response from model. Full response: ${structuredOutputResponse}`);

    // return JSON.stringify(structuredOutputResponse.parsed)
}