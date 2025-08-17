import { Schema } from '../../data/resource';
import { env } from '$amplify/env/production-agent-function';
import { stringify } from 'yaml'

import { ChatBedrockConverse } from "@langchain/aws";
import { HumanMessage, AIMessage, ToolMessage, BaseMessage, AIMessageChunk } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { RetryPolicy } from "@langchain/langgraph"

import { AmplifyClientWrapper, getLangChainMessageTextContent, stringifyLimitStringLength } from '../utils/amplifyUtils'
import { publishResponseStreamChunk, updateChatMessage } from '../graphql/mutations'

import { Calculator } from "@langchain/community/tools/calculator";

import {
    queryKnowledgeBase,
    wellTableTool,
    getTableDefinitionsTool,
    executeSQLQueryTool,
    plotTableFromToolResponseTool,
    getS3KeyConentsTool,
} from './toolBox';

function insertBeforeLast<T>(arr: T[], element: T): T[] {
    arr.splice(-1, 0, element);
    return arr;
}

export const handler: Schema["invokeProductionAgent"]["functionHandler"] = async (event) => {

    // console.log('event: ', event)
    // console.log('context: ', context)
    // console.log('Amplify env: ', env)
    // console.log('process.env: ', process.env)

    // const amplifyClientWrapper = generateAmplifyClientWrapper(process.env)

    if (!(event.arguments.chatSessionId)) throw new Error("Event does not contain chatSessionId");
    if (!event.identity) throw new Error("Event does not contain identity");

    const fieldName = "invokeProductionAgent" //event.info.fieldName

    const chatMessageOwnerIdentity = ('sub' in event.identity) ? event.identity.sub : event.arguments.messageOwnerIdentity

    if (!chatMessageOwnerIdentity) throw new Error(`Event does not contain user. Event:\n${JSON.stringify(event)}`);

    const amplifyClientWrapper = new AmplifyClientWrapper({
        chatSessionId: event.arguments.chatSessionId,
        fieldName: fieldName,
        env: process.env
    })

    const agentTools = [
        new Calculator,
        wellTableTool,
        getS3KeyConentsTool,
        getTableDefinitionsTool,
        executeSQLQueryTool,
        plotTableFromToolResponseTool,
    ];

    try {

        // If the usePreviousMessageContent field is true or undefined, get the messages. If not set the latest message text as the only message.
        if (
            !("usePreviousMessageContext" in event.arguments) || 
            event.arguments.usePreviousMessageContext === undefined || 
            event.arguments.usePreviousMessageContext === null || 
            event.arguments.usePreviousMessageContext
        ) {
            console.log('Getting messages for chat session: ', event.arguments.chatSessionId)
            await amplifyClientWrapper.getChatMessageHistory({
                latestHumanMessageText: event.arguments.lastMessageText
            })
            // console.log("messages in langchain form: ", stringifyLimitStringLength(amplifyClientWrapper.chatMessages))

            // const lastMessageId = amplifyClientWrapper.chatMessages[amplifyClientWrapper.chatMessages.length - 1].id

            // if (lastMessageId) {
            //     //Add the latest human message to the chain of thought
            //     amplifyClientWrapper.amplifyClient.graphql({
            //         query: updateChatMessage,
            //         variables: {
            //             input: {
            //                 id: lastMessageId,
            //                 chainOfThought: true
            //             }
            //         }
            //     })
            // }

        } else {
            amplifyClientWrapper.chatMessages = [
                new HumanMessage({
                    content: event.arguments.lastMessageText
                })
            ]
        }

        // console.log("mesages in langchain form: ", amplifyClientWrapper.chatMessages)

        const agentModel = new ChatBedrockConverse({
            model: process.env.MODEL_ID,
            temperature: 0
        })
        // .withRetry({
        //     stopAfterAttempt: 5
        // })

        const agent = createReactAgent({
            llm: agentModel,
            tools: agentTools,
        });

        //Add retry to the agent
        agent.nodes['agent'].retryPolicy = { maxAttempts: 3 } as RetryPolicy

        // const agentWithRag = ragPrompt.pipe(agent);

        // https://js.langchain.com/v0.2/docs/how_to/chat_streaming/#stream-events
        // https://js.langchain.com/v0.2/docs/how_to/streaming/#using-stream-events
        // const stream = agent.streamEvents(input, { version: "v2" });

        const messages = amplifyClientWrapper.chatMessages

        console.log("Invoking Production Agent. Latest Message:\n", stringify(messages[messages.length - 1].content))

        const ragContext = await queryKnowledgeBase({
            knowledgeBaseId: env.PETROLEUM_ENG_KNOWLEDGE_BASE_ID,
            query: getLangChainMessageTextContent(messages[messages.length - 1]) || ""
        })

        console.log("Rag context:\n", stringifyLimitStringLength(ragContext))

        insertBeforeLast(messages,
            new HumanMessage("What are a few relevant oil and gas concepts?")
        )

        insertBeforeLast(messages, // If there is no result from the knowledge base, use a dummy result
            new AIMessage(ragContext?.map(retrievalResult => retrievalResult.content?.text).join('\n\n') || "Safety is the top priority.")
        )

        console.log("Messages with rag:\n", stringifyLimitStringLength(messages))

        const stream = agent.streamEvents(
            {
                messages: messages,
            },
            { version: "v2" }
        )

        let currentChunkIndex = 0
        console.log('Listening for stream events')
        for await (const streamEvent of stream) {
            // console.log(`${JSON.stringify(streamEvent, null, 2)}\n---`);

            if (streamEvent.event === "on_chat_model_stream") {
                // console.log('Message Chunk: ', streamEvent.data.chunk)

                const streamChunk = streamEvent.data.chunk as AIMessageChunk
                // const chunkContent = streamEvent.data.chunk.kwargs.content
                const chunkContent = getLangChainMessageTextContent(streamChunk)
                // console.log("chunkContent: ", chunkContent)
                if (chunkContent) {
                    process.stdout.write(chunkContent || "") //Write the chunk to the log
                    await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
                        query: publishResponseStreamChunk,
                        variables: {
                            chatSessionId: event.arguments.chatSessionId,
                            index: currentChunkIndex++,
                            chunk: chunkContent
                        }
                    })
                }

            } else if (streamEvent.event === 'on_tool_end') {
                const streamChunk = streamEvent.data.output as ToolMessage
                // console.log('Tool Output: ', streamChunk)
                await amplifyClientWrapper.publishMessage({
                    chatSessionId: event.arguments.chatSessionId,
                    fieldName: fieldName,
                    owner: chatMessageOwnerIdentity,
                    message: streamChunk,
                    chainOfThought: true
                })

            } else if (streamEvent.event === "on_chat_model_end") { //When there is a full response from the chat model
                // console.log('Message Output Chunk: ', streamEvent.data.output)
                const streamChunk = streamEvent.data.output as AIMessageChunk
                // console.log('Message Output Chunk as AIMessageChunk: ', streamChunk)

                if (!streamChunk) throw new Error("No output chunk found")
                const streamChunkAIMessage = new AIMessage({
                    content: streamChunk.content,
                    tool_calls: streamChunk.tool_calls
                })

                // console.log('Publishing AI Message: ', streamChunkAIMessage, '. Content: ', streamChunkAIMessage.content)

                await amplifyClientWrapper.publishMessage({
                    chatSessionId: event.arguments.chatSessionId,
                    fieldName: fieldName,
                    chainOfThought: true,
                    owner: chatMessageOwnerIdentity,
                    message: streamChunkAIMessage,
                    responseComplete: !(event.arguments.doNotSendResponseComplete || (streamChunk.tool_calls && streamChunk.tool_calls.length > 0))
                })

            }

        }

        return "Invocation Successful!";

    } catch (error) {

        console.log('Error: ', error)

        if (error instanceof Error) {
            //If there is an error
            const AIErrorMessage = new AIMessage({ content: error.message + `\n model id: ${process.env.MODEL_ID}` })
            await amplifyClientWrapper.publishMessage({
                chatSessionId: event.arguments.chatSessionId,
                fieldName: fieldName,
                chainOfThought: true,
                owner: chatMessageOwnerIdentity,
                message: AIErrorMessage
            })
            return error.message
        }
        return `Error: ${JSON.stringify(error)}`
    }

};