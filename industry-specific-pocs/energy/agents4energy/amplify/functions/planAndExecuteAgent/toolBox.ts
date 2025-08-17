import { z } from "zod";
import { stringify } from "yaml";

import { tool } from "@langchain/core/tools";

import { AmplifyClientWrapper, createChatMessage } from '../utils/amplifyUtils'
import { ToolMessageContentType } from '../../../src/utils/types'

import * as APITypes from "../graphql/API";
import { invokeBedrock, invokeProductionAgent, listChatMessageByChatSessionIdAndCreatedAt } from '../graphql/queries'
// import { createChatMessage } from '../graphql/mutations'
import { OnCreateChatMessageSubscription, ChatMessage } from '../graphql/API'

import { onCreateChatMessage } from '../graphql/subscriptions'

import { getMessageCatigory } from '../../../src/utils/amplify-utils'

/////////////////////////////////////////////////
//////////// Query GraphQL API Tool /////////////
/////////////////////////////////////////////////

const queryGQLScheama = z.object({
    queryField: z
        .enum(["invokeBedrock", "invokeProductionAgent"]).describe(`
            Use invokeProductionAgent for:
                - General petroleum engineering knowledge
                - Gathering well data, with data sources including well files, production volume databases.
                - Diagnosing well problems
                - Steps to repair a well
                - Repair cost estimates
                - Financial returns estimates
            `.replace(/^\s+/gm, '')),
    invocationText: z.string().describe(`
        The text to use to invoke the agent. 
        When using invokeProduction Agent:
        - Be sure to specify the API number of the well of interest
        `.replace(/^\s+/gm, '')),
});

export const queryGQLToolBuilder = (props: { amplifyClientWrapper: AmplifyClientWrapper, chatMessageOwnerIdentity: string }) => tool(
    async ({ queryField, invocationText }) => {
        const { amplifyClientWrapper, chatMessageOwnerIdentity } = props

        switch (queryField) {
            case "invokeBedrock":
                const invokeBedrockResponse = await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
                    query: invokeBedrock,
                    variables: {
                        // chatSessionId: amplifyClientWrapper.chatSessionId,
                        // lastMessageText: "Hello World"
                        prompt: invocationText
                    }
                })

                // const responseData = JSON.parse(fileDataResponse.data.invokeBedrockWithStructuredOutput || "")

                return invokeBedrockResponse.data.invokeBedrock
            case "invokeProductionAgent":
                console.log("Invoking production agent with text: ", invocationText)


                await amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
                    query: createChatMessage,
                    variables: {
                        input: {
                            chatSessionId: amplifyClientWrapper.chatSessionId,
                            chatSessionIdDashFieldName: `${amplifyClientWrapper.chatSessionId}-${amplifyClientWrapper.fieldName}`,
                            content: invocationText,
                            role: APITypes.ChatMessageRole.human,
                            owner: chatMessageOwnerIdentity,
                            chainOfThought: true
                        }
                    }
                })

                amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
                    query: invokeProductionAgent,
                    variables: {
                        chatSessionId: amplifyClientWrapper.chatSessionId,
                        lastMessageText: invocationText,
                        // usePreviousMessageContext: false,
                        messageOwnerIdentity: chatMessageOwnerIdentity,
                        doNotSendResponseComplete: true
                    }
                }).catch((error) => { //Catch the error so that the system doesn't think something is wrong
                    console.log('Invoke production agent (timeout is expected): ', error)
                })

                const waitForResponse = async (): Promise<ChatMessage[]> => {
                    return new Promise((resolve) => {
                        // Every few seconds check if the most recent chat message has the correct type
                        const interval = setInterval(async () => {
                            const testChatMessages = await amplifyClientWrapper.amplifyClient.graphql({
                                query: listChatMessageByChatSessionIdAndCreatedAt,
                                variables:
                                {
                                    chatSessionId: amplifyClientWrapper.chatSessionId,
                                    limit: 3,
                                    sortDirection: APITypes.ModelSortDirection.DESC
                                },
                            })

                            const mostRecentChatMessage = testChatMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items[0]

                            if (mostRecentChatMessage &&
                                mostRecentChatMessage.role === APITypes.ChatMessageRole.ai &&
                                (getMessageCatigory(mostRecentChatMessage) === 'ai') && //This is a double check incase the tool returns an error, and the error message is picked up as an ai messsage.
                                (!mostRecentChatMessage.tool_calls || mostRecentChatMessage.tool_calls === "[]") &&
                                (!mostRecentChatMessage.tool_call_id || mostRecentChatMessage.tool_call_id === "")//Make sure the message is not a tool response message
                            ) {
                                console.log("Production Agent has returned a response. Ending the check for new messages loop\nMost recent chat message:\n",
                                    stringify(mostRecentChatMessage)
                                )
                                clearInterval(interval)
                                // resolve(mostRecentChatMessage)
                                resolve(testChatMessages.data.listChatMessageByChatSessionIdAndCreatedAt.items)
                            }
                        }, 2000)
                    })
                }

                const completionChatMessages = await waitForResponse()

                const responseString = completionChatMessages.map(item => item.content).join(`\n${'#'.repeat(10)}\n`)

                // console.log('Production Agent Response: ', responseString)

                return responseString

            ////https://aws.amazon.com/blogs/mobile/announcing-server-side-filters-for-real-time-graphql-subscriptions-with-aws-amplify/
            // const testSub = amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
            //     query: onCreateChatMessage,
            //     // variables: {}
            // }).subscribe({
            //     next: ({ data }) => {
            //         const chatMessage = data.onCreateChatMessage
            //         console.log("Production Agent Subscription Data 2:\n", chatMessage)
            //     },
            //     error: (error) => {
            //         console.log(error);

            //     },
            //     complete: () => {
            //         console.log("Subscription complete")
            //     },
            // })

            // testSub.unsubscribe()

            // const testChatResponse = await subscribeAndWaitForResponse2()
            // console.log('test chat response: ', testChatResponse)

            // const chatMessageSubscription = amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
            //     query: onCreateChatMessage,
            //     // variables: {
            //     //     // filter: {
            //     //     //     chatSessionId: {
            //     //     //         contains: amplifyClientWrapper.chatSessionId
            //     //     //     }
            //     //     // }
            //     // },
            // })

            // let subscription: ReturnType<typeof chatMessageSubscription.subscribe>

            // console.log("Subscribing to chat messages to check if the production agent has completed execution")

            // const subscribeAndWaitForResponse = async () => {
            //     return new Promise((resolve, reject) => {
            //         subscription = chatMessageSubscription.subscribe({
            //             next: ({ data }) => {
            //                 const chatMessage = data.onCreateChatMessage

            //                 console.log("Wait For Procution Agent To Complete Subscription Data:\n", chatMessage)
            //                 // If the chat message has the role of ai, and no tool calls, that message is the result to return
            // if (chatMessage.role === "ai" &&
            //     (!chatMessage.tool_calls || chatMessage.tool_calls === "[]")
            // ) {
            //     console.log("Production Agent has returned a response. Unsubscribing from chat messages.")
            //     // subscription.unsubscribe()
            //     resolve(chatMessage)
            // }
            //             },
            //             error: (error) => {
            //                 console.log(error);
            //                 reject(error)
            //             },
            //             complete: () => {
            //                 console.log("Subscription complete")
            //                 resolve("Subscription complete")
            //             },
            //         })
            //     })
            // }

            // const lastChatMessage = await subscribeAndWaitForResponse() as ChatMessage

            // console.log("Production Agent Last Chat Message: ", lastChatMessage)

            // return lastChatMessage.content
            // break;
            default:
                throw new Error(`Unknown query field: ${queryField}`);
        }

    },
    {
        name: "queryGQL",
        description: `
        Can query a GraphQL API. 
        Query invokeProductionAgent for:
            - Create plots or visualizations of well data (including invoking plotProductionTool)
            - General petroleum engineering knowledge
            - Gathering well data, with data sources including well files, production volume databases.
            - Diagnosing well problems
            - Steps to repair a well
            - Repair cost estimates
            - Financial returns estimates
        `.replaceAll(/^\s+/gm, ''),
        schema: queryGQLScheama,
    }
);

