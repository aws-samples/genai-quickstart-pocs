
import type { Schema } from "../data/resource"
import * as APITypes from "./graphql/API";
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";
import { AmplifyClientWrapper, createChatMessage } from './utils/amplifyUtils'
import { publishResponseStreamChunk, updateChatSession } from './graphql/mutations'
import { env } from '$amplify/env/invoke-bedrock-agent';

const client = new BedrockAgentRuntimeClient();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handler: Schema["invokeBedrockAgent"]["functionHandler"] = async (event) => {
    console.log('Event: ', event)
    if (!(event.arguments.chatSessionId)) throw new Error("Event does not contain chatSessionId");
    if (!event.identity) throw new Error("Event does not contain identity");
    if (!('sub' in event.identity)) throw new Error("Event does not contain user");

    const amplifyClientWrapper = new AmplifyClientWrapper({
        chatSessionId: event.arguments.chatSessionId,
        env: process.env
    })

    // Give the user an intial response
    amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
        query: publishResponseStreamChunk,
        variables: {
            chatSessionId: event.arguments.chatSessionId,
            index: 0,
            chunk: 'Invoking Amazon Bedrock Agent...'
        }
    }).catch((error) => {
        console.error('Initial Invoke error: ', error)
    })

    // console.log('Amplify Env: ', env)

    const params = {
        agentId: event.arguments.agentId,
        agentAliasId: event.arguments.agentAliasId,
        sessionId: event.arguments.chatSessionId,
        inputText: event.arguments.prompt,
        enableTrace: true,
    };

    const command = new InvokeAgentCommand(params);

    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            const response = await client.send(command);
            
            if (!response.completion) {
                throw new Error("No completion found in the response.");
            }

            console.log("Agent Response:", response.completion)

            let completion = '';
            let orchestrationTraceRationale = '';
            for await (let chunkEvent of response.completion) {
                const { chunk, trace } = chunkEvent;
                if (chunk) {
                    const decodedResponse = new TextDecoder("utf-8").decode(chunk.bytes);
                    completion += decodedResponse;
                }

                if (trace && trace.trace && trace.trace.orchestrationTrace && trace.trace.orchestrationTrace.rationale)  {
                    orchestrationTraceRationale += trace.trace.orchestrationTrace.rationale.text + "\n\n"
                    console.log('orchestrationTraceRationale: ', orchestrationTraceRationale)

                    //Stream the rational to the client
                    amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
                        query: publishResponseStreamChunk,
                        variables: {
                            chatSessionId: event.arguments.chatSessionId,
                            index: 0,
                            chunk: orchestrationTraceRationale
                        }
                    }).catch((error) => {
                        console.error('publishResponseStreamChunk error: ', error)
                    })
                }
                
            }

            console.log('Parsed event stream completion: ', completion, ' and trace: ', orchestrationTraceRationale);

            await amplifyClientWrapper.amplifyClient.graphql({
                query: createChatMessage,
                variables: {
                    input: {
                        chatSessionId: event.arguments.chatSessionId,
                        content: orchestrationTraceRationale + completion,
                        owner: event.identity.sub,
                        trace: orchestrationTraceRationale,
                        role: APITypes.ChatMessageRole.ai,
                        responseComplete: true
                    },
                },
            }).then((response) => {
                console.log('createChatMessage response: ', response)
            }).catch((error) => {
                console.error('createChatMessage error: ', error)
            })

            return {
                completion: completion,
                orchestrationTrace: orchestrationTraceRationale
            };

        } catch (error: any) {
            console.error(`Attempt ${retries + 1} failed:`, error);

            if (error.name === 'ConflictException' || error.$metadata?.httpStatusCode === 409) {
                retries++;
                if (retries < maxRetries) {
                    const backoffTime = Math.pow(2, retries) * 100; // exponential backoff
                    console.log(`Retrying in ${backoffTime}ms...`);
                    await delay(backoffTime);
                } else {
                    throw new Error('Max retries reached. Unable to process the request.');
                }
            } else {
                // For other types of errors, throw immediately
                throw error;
            }
        }
    }

    throw new Error('Max retries reached. Unable to process the request.');
};