import { stringify } from "yaml"
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { Schema } from '../../data/resource';

import { ChatBedrockConverse } from "@langchain/aws";
import { BaseMessage, AIMessage, ToolMessage, AIMessageChunk, HumanMessage, isAIMessageChunk, BaseMessageChunk } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { END, START, StateGraph, Annotation, CompiledStateGraph, StateDefinition } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { RetryPolicy } from "@langchain/langgraph"

import { AmplifyClientWrapper, getLangChainMessageTextContent, stringifyLimitStringLength } from '../utils/amplifyUtils'
import { publishResponseStreamChunk, updateChatSession } from '../graphql/mutations'
import { RateLimiter } from '../../../src/utils/rateLimiter';

import { Calculator } from "@langchain/community/tools/calculator";

import { queryGQLToolBuilder } from './toolBox'
import { isValidJSON } from "../../../src/utils/amplify-utils";

const MAX_RETRIES = 3

const PlanStepSchema = z.object({
    title: z.string(),
    role: z.enum(['ai', 'human']),
    description: z.string(),
    toolCalls: z.array(z.any()).optional(),
    result: z.string().optional()
});


type PlanStep = z.infer<typeof PlanStepSchema>;

const PlanExecuteState = Annotation.Root({
    input: Annotation<string>({
        reducer: (x, y) => y ?? x ?? "",
    }),
    plan: Annotation<PlanStep[]>({
        reducer: (x, y) => y ?? x ?? [],
    }),
    pastSteps: Annotation<PlanStep[]>({
        // reducer: (x, y) => x.concat(y),
        reducer: (x, y) => y ?? x ?? [],
    }),
    response: Annotation<string>({
        reducer: (x, y) => y ?? x,
    })
})

function areListsEqual<T>(list1: T[] | undefined, list2: T[] | undefined): boolean {
    if (!list1 || !list2) return false;
    return list1.length === list2.length &&
        list1.every((value, index) => value === list2[index]);
}

async function publishTokenStreamChunk(props: { tokenStreamChunk: AIMessageChunk, tokenIndex: number, amplifyClientWrapper: AmplifyClientWrapper }) {
    // console.log("publishTokenStreamChunk: ", props.tokenStreamChunk)
    const streamChunk = props.tokenStreamChunk// as AIMessageChunk
    // console.log("streamChunk: ", streamChunk)
    // const chunkContent = streamEvent.data.chunk.kwargs.content

    const chunkContent = getLangChainMessageTextContent(streamChunk)

    // process.stdout.write(`\x1b[32m${chunkContent}\x1b[0m`); //Write the chunk to the log with green text

    if (chunkContent) {
        // console.log("chunkContent: ", chunkContent)

        await props.amplifyClientWrapper.amplifyClient.graphql({ //To stream partial responces to the client
            query: publishResponseStreamChunk,
            variables: {
                chatSessionId: props.amplifyClientWrapper.chatSessionId,
                index: props.tokenIndex,
                chunk: chunkContent
            }
        })
    }
}

export const handler: Schema["invokePlanAndExecuteAgent"]["functionHandler"] = async (event) => {

    // console.log('event: ', event)
    // console.log('context: ', context)
    // console.log('Amplify env: ', env)
    // console.log('process.env: ', process.env)

    if (!(event.arguments.chatSessionId)) throw new Error("Event does not contain chatSessionId");
    if (!event.identity) throw new Error("Event does not contain identity");
    if (!('sub' in event.identity)) throw new Error("Event does not contain user");

    const amplifyClientWrapper = new AmplifyClientWrapper({
        chatSessionId: event.arguments.chatSessionId,
        env: process.env
    })

    await publishTokenStreamChunk({
        tokenStreamChunk: new AIMessageChunk({content: "Generating new plan ...\n\n"}),//This is just meant to show something is happening.
        tokenIndex: -1,
        amplifyClientWrapper: amplifyClientWrapper
    })

    try {
        // console.log('Getting the current chat session info')
        const chatSession = await amplifyClientWrapper.getChatSession({ chatSessionId: event.arguments.chatSessionId })
        if (!chatSession) throw new Error(`Chat session ${event.arguments.chatSessionId} not found`)

        console.log('Getting messages for chat session: ', event.arguments.chatSessionId)
        await amplifyClientWrapper.getChatMessageHistory({
            latestHumanMessageText: event.arguments.lastMessageText
            // latestHumanMessageText: event.arguments.input
        })

        // Update the chat session with the user's intention
        await amplifyClientWrapper.amplifyClient.graphql({
            query: updateChatSession,
            variables: {
                input: {
                    id: event.arguments.chatSessionId,
                    planGoal: event.arguments.lastMessageText
                }
            }
        })


        // Define inputs to the agent
        const inputs = {
            input: event.arguments.lastMessageText,
            plan: chatSession?.planSteps?.map(step => JSON.parse(step || "") as PlanStep),
            pastSteps: chatSession?.pastSteps?.map(step => JSON.parse(step || "") as PlanStep),
        }


        // Select the model to use for the executor agent
        const agentModel = new ChatBedrockConverse({
            model: process.env.MODEL_ID,
            temperature: 0
        });

        ///////////////////////////////////////////////
        ///////// Executor Agent Step /////////////////
        ///////////////////////////////////////////////
        const agentExecutorTools = [
            new Calculator,
            queryGQLToolBuilder({
                amplifyClientWrapper: amplifyClientWrapper,
                chatMessageOwnerIdentity: event.identity.sub
            })
        ]

        //Create the executor agent
        const agentExecutor = createReactAgent({
            llm: agentModel,
            tools: agentExecutorTools,
        });

        // const dummyAgentExecutorResponse = await agentExecutor.invoke({
        //     messages: [new HumanMessage("who is the winner of the us open")],
        //   });
        // console.log("Dummy Agent Executor Response:\n", dummyAgentExecutorResponse.slice(-1)[0])

        ///////////////////////////////////////////////
        ///////// Planning Step ///////////////////////
        ///////////////////////////////////////////////

        const plan = zodToJsonSchema(
            z.object({
                steps: z
                    .array(PlanStepSchema)
                    .describe("Different steps to follow. Sort in order of completion"),
            }),
        );

        const planningModel = agentModel.withStructuredOutput(plan);

        ///////////////////////////////////////////////
        ///////// Re-Planning Step ////////////////////
        ///////////////////////////////////////////////


        const replannerPrompt = ChatPromptTemplate.fromTemplate(
            `For the given objective, come up with a simple step by step plan.
            This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps.
            The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.
            Favor assigning the role of ai to human if an available tool may be able to resolve the step.

            Your objective was this:
            {objective}

            Your original plan (if any) was this:
            {plan}

            You have currently done the follow steps:
            {pastSteps}

            Update your plan accordingly.
            Only add steps to the plan that still NEED to be done. Do not return previously done steps as part of the plan.`.replace(/^\s+/gm, ''),
        );

        const replanner = replannerPrompt.pipe(planningModel);

        ///////////////////////////////////////////////
        ///////// Response Step ///////////////////////
        ///////////////////////////////////////////////

        const responderPrompt = ChatPromptTemplate.fromTemplate(
            `Respond to the user in markdown format based on the origional objective and completed steps.

            Your objective was this:
            {input}

            The next steps (if any) are this:
            {plan}

            You have currently done the follow steps:
            {pastSteps}
            `.replace(/^\s+/gm, ''),
        );


        const response = zodToJsonSchema(
            z.object({
                response: z.string().describe("Response to user in markdown format."),
            }),
        );

        const responderModel = agentModel.withStructuredOutput(response);

        const responder = responderPrompt.pipe(responderModel)



        ///////////////////////////////////////////////
        ///////// Create the Graph ////////////////////
        ///////////////////////////////////////////////
        const customHandler = {
            handleLLMNewToken: async (token: string, idx: { completion: number, prompt: number }, runId: any, parentRunId: any, tags: any, fields: any) => {
                //   console.log(`Chat model new token: ${token}. Length: ${token.length}`);

                const tokenStreamChunk = new AIMessageChunk({ content: token.length > 0 ? token : '.'.repeat(Math.ceil(Math.random() * 5)) })

                process.stdout.write(`\x1b[32m${getLangChainMessageTextContent(tokenStreamChunk)}\x1b[0m`); //Write the chunk to the log with green text

                await publishTokenStreamChunk({
                    tokenStreamChunk: tokenStreamChunk,//This is just meant to show something is happening.
                    tokenIndex: -2,
                    amplifyClientWrapper: amplifyClientWrapper
                })
            },
            handleChatModelStart: async (llm: any, inputMessages: any, runId: any) => {
                console.log("Chat model start:\n", stringifyLimitStringLength(inputMessages));
            },
        };

        async function executeStep(
            state: typeof PlanExecuteState.State,
            config?: RunnableConfig,
        ): Promise<Partial<typeof PlanExecuteState.State>> {
            const { result, ...task } = state.plan[0];//Remove the "Result" field from the task if it exists

            // The user has the following objective
            // <objective>
            // ${state.input}
            // </objective>

            const rateLimiter = await RateLimiter.getInstance();
            const inputs = {
                messages: [new HumanMessage(`
                    The following steps have been completed
                    <previousSteps>
                    ${stringify(state.pastSteps)}
                    </previousSteps>

                    Now execute this task.
                    <task>
                    ${stringify(task)}
                    </task>

                    To make plots or tables, use the queryGQL tool.
                    When creating a table, never use the HTML format.

                    Tool messages can contain visualizations, query results and tables.
                    If the tool message says it contains information which completes the task, return a summary to the user.

                    Once you have a result for this task, respond with that result.
                    `)],
            };
            await rateLimiter.waitForRateLimit();
            const { messages } = await agentExecutor.invoke(inputs, config);
            const resultText = getLangChainMessageTextContent(messages.slice(-1)[0]) || ""
            console.log("Execute Step Complete. Result Text:\n", resultText)

            return {
                pastSteps: [
                    ...(state.pastSteps || []),
                    {
                        ...task,
                        result: resultText,
                    },
                ],
                plan: state.plan.slice(1),
            };
        }

        async function replanStep(
            state: typeof PlanExecuteState.State,
            config: RunnableConfig,
        ): Promise<Partial<typeof PlanExecuteState.State>> {

            // console.log("Replanning based on the state: \n", stringify(state))

            //If this isn't the intital replan, and there are no more plan steps, respond to the user}
            if (state.plan && state.plan.length === 0 && !areListsEqual(inputs.pastSteps, state.pastSteps)) return {}

            //If this is the initial replan, and the user input a plan, set the user's response as the last step's response. The user was responding to this prompt.
            let pastSteps = state.pastSteps
            let planSteps = state.plan
            if (
                state.plan &&
                state.plan.length > 0 &&
                state.plan[0].role === "human" &&
                (
                    !state.pastSteps || //If the first plan step is a human step, the past steps will be null
                    areListsEqual(inputs.pastSteps, state.pastSteps)
                )
            ) {
                pastSteps = [
                    ...(state.pastSteps ?? []),
                    {
                        ...state.plan[0],
                        result: event.arguments.lastMessageText
                    }
                ]

                planSteps = planSteps.slice(1)

                console.log(`User responded to a step with the role human. New Past Steps: \n${stringify(pastSteps)} \n New plan steps:\n${planSteps}`)
            }

            // let newPlanFromInvoke: { steps: PlanStep[] }
            const invokeReplanner = async () => {
                let newPlan: { steps: PlanStep[] }
                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    try {
                        const rateLimiter = await RateLimiter.getInstance();
                        await rateLimiter.waitForRateLimit();
                        newPlan = await replanner
                            .withConfig({
                                callbacks: [customHandler],
                                // callbacks: config.callbacks!,
                                // runName: "replanner",
                                tags: ["replanner"],
                            })
                            .invoke(
                                {
                                    objective: state.input,
                                    plan: stringify(planSteps),
                                    pastSteps: stringify(pastSteps) + "\nMake sure you respond in the correct format".repeat(attempt)
                                },
                                config
                            ) as { steps: PlanStep[] };

                        if (!newPlan.steps) throw new Error("No steps returned from replanner")

                        if (typeof newPlan.steps === 'string' && isValidJSON(newPlan.steps)) {
                            console.log("Steps are a string and valid JSON. Converting them to an object")
                            newPlan.steps = JSON.parse(newPlan.steps) as PlanStep[]
                        }

                        if (
                            !Array.isArray(newPlan.steps) ||
                            !newPlan.steps.every((step: unknown) => (PlanStepSchema.safeParse(step).success)
                            )
                        ) {
                            console.warn(`Provided steps are not in the correct format.\n\nSteps: ${stringify(newPlan.steps)}\n\n`)
                        } else return newPlan

                    } catch (error) {
                        if (attempt === MAX_RETRIES - 1) {
                            throw new Error(`Failed to get valid output after ${MAX_RETRIES} attempts: ${error}`);
                        }
                        // console.log(`Attempt ${attempt + 1} failed, retrying after ${RETRY_DELAY_MS}ms...`);
                        // await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                }
            }

            // }

            // const newPlanFromInvoke = await replanner
            //     .withConfig({
            //         callbacks: [customHandler],
            //         // callbacks: config.callbacks!,
            //         // runName: "replanner",
            //         tags: ["replanner"],
            //     })
            //     .invoke(
            //         {
            //             objective: state.input,
            //             plan: stringify(planSteps),
            //             pastSteps: stringify(pastSteps)
            //         },
            //         config
            //     );
            const newPlanFromInvoke = await invokeReplanner()
            if (!newPlanFromInvoke) throw new Error("No new plan returned from replanner")

            console.log("New Plan:\n", stringify(newPlanFromInvoke))

            // if (!newPlanFromInvoke.steps) throw new Error("No steps returned from replanner")

            // if (typeof newPlanFromInvoke.steps === 'string' && isValidJSON(newPlanFromInvoke.steps)) {
            //     console.log("Steps are a string and valid JSON. Converting them to an object")
            //     newPlanFromInvoke.steps = JSON.parse(newPlanFromInvoke.steps) as PlanStep[]
            // }

            // if (
            //     !Array.isArray(newPlanFromInvoke.steps) ||
            //     !newPlanFromInvoke.steps.every((step: unknown) => (PlanStepSchema.safeParse(step).success)
            //     )
            // ) throw new Error(`Provided steps are not in the correct format.\n\nSteps: ${stringify(newPlanFromInvoke.steps)}\n\n`)

            // Remove the result part if present from plan steps
            planSteps = newPlanFromInvoke.steps.map((step: PlanStep) => {
                const { result, ...planPart } = step
                return planPart
            })

            if (!(event.arguments.chatSessionId)) throw new Error("Event does not contain chatSessionId");
            if (!event.identity) throw new Error("Event does not contain identity");
            if (!('sub' in event.identity)) throw new Error("Event does not contain user");

            if (planSteps[0]) {
                //Send a message with the step title to make clear in the chat history where each step begins.
                amplifyClientWrapper.publishMessage({
                    chatSessionId: event.arguments.chatSessionId,
                    owner: event.identity.sub,
                    message: new AIMessage({ content: `## ${planSteps[0].title}` }),
                    responseComplete: true
                })
            }


            return {
                plan: planSteps,
                pastSteps: pastSteps
            }
        }

        async function respondStep(
            state: typeof PlanExecuteState.State,
            config: RunnableConfig,
        ): Promise<Partial<typeof PlanExecuteState.State>> {
            const rateLimiter = await RateLimiter.getInstance();
            await rateLimiter.waitForRateLimit();
            const response = await responder
                .withConfig({
                    callbacks: [customHandler],
                    tags: ["responder"],
                })
                .invoke({
                    input: state.input,
                    plan: stringify(state.plan),
                    pastSteps: stringify(state.pastSteps)
                },
                    config
                );

            return { response: response.response };
        }

        function shouldEnd(state: typeof PlanExecuteState.State) {
            // If human input is requested, or there are no more steps, return true
            // console.log("Deciding to end based on the state: \n", stringify(state))
            if (!state.plan) return "false"
            if (state.plan.length === 0) return "true"
            if (state.plan[0].role === "human") return "true"
            return "false";
            // return state.response ? "true" : "false";
        }
        const workflow = new StateGraph(PlanExecuteState)
            .addNode("agent", executeStep, { retryPolicy: { maxAttempts: 2 } })
            .addNode("replan", replanStep, { retryPolicy: { maxAttempts: 2 } })
            .addNode("respond", respondStep, { retryPolicy: { maxAttempts: 2 } })
            .addEdge(START, "replan")
            .addEdge("agent", "replan")
            .addConditionalEdges("replan", shouldEnd, {
                true: "respond",
                false: "agent",
            })
            .addEdge("respond", END);

        // Finally, we compile it!
        // This compiles it into a LangChain Runnable,
        // meaning you can use it as you would any other runnable
        const agent = workflow.compile();

        ///////////////////////////////////////////////
        ///////// Invoke the Graph ////////////////////
        ///////////////////////////////////////////////

        // const stream = await agent.stream(inputs, {
        //     recursionLimit: 50,
        //     streamMode: "messages"
        // });

        const agentEventStream = agent.streamEvents(
            inputs,
            {
                version: "v2",
            }
        );

        // https://js.langchain.com/v0.2/docs/how_to/chat_streaming/#stream-events
        // https://js.langchain.com/v0.2/docs/how_to/streaming/#using-stream-events
        // const stream = executorAgent.streamEvents(input, { version: "v2" });

        console.log('Listening for stream events')
        // for await (const streamEvent of stream) {
        let currentChunkIndex = 10000 // This is meant to help if multiple agents are streaming at the same time to the client.
        for await (const streamEvent of agentEventStream) {
            // console.log('event: ', streamEvent.event)

            switch (streamEvent.event) {
                case "on_chat_model_stream":
                    const streamChunkText = getLangChainMessageTextContent(streamEvent.data.chunk as AIMessageChunk) || ""

                    //Write the blurb in blue
                    process.stdout.write(`\x1b[34m${streamChunkText}\x1b[0m`);

                    await publishTokenStreamChunk({
                        tokenStreamChunk: streamEvent.data.chunk,
                        tokenIndex: currentChunkIndex++,
                        amplifyClientWrapper: amplifyClientWrapper,
                    })
                    break
                case "on_chain_stream":
                    console.log('on_chain_stream: \n', stringifyLimitStringLength(streamEvent))
                    const chainStreamMessage = streamEvent.data.chunk
                    const chainMessageType = ("planner" in chainStreamMessage || "replan" in chainStreamMessage) ? "plan" :
                        ("agent" in chainStreamMessage) ? "agent" :
                            ("respond" in chainStreamMessage) ? "respond" :
                                "unknown"

                    switch (chainMessageType) {
                        case "plan":
                            const updatePlanResonseInput: Schema["ChatSession"]["updateType"] = {
                                id: event.arguments.chatSessionId,
                                planSteps: ((chainStreamMessage.planner || chainStreamMessage.replan) as typeof PlanExecuteState.State)
                                    .plan.map((step) => JSON.stringify(step, null, 2)),
                            }

                            //If the chatStreamMessage contains pastSteps, update the chat session with them.
                            if (chainStreamMessage.replan.pastSteps) {
                                updatePlanResonseInput.pastSteps = (chainStreamMessage.replan as typeof PlanExecuteState.State)
                                    .pastSteps.map((step) => JSON.stringify(step, null, 2))
                            }

                            const updatePlanResonse = await amplifyClientWrapper.amplifyClient.graphql({
                                query: updateChatSession,
                                variables: {
                                    input: updatePlanResonseInput
                                }
                            })

                            // console.log(`Update Plan Response:\n`, stringify(updatePlanResonse))
                            break
                        case "agent":
                            const executeAgentChatSessionUpdate = await amplifyClientWrapper.amplifyClient.graphql({
                                query: updateChatSession,
                                variables: {
                                    input: {
                                        id: event.arguments.chatSessionId,
                                        pastSteps: (chainStreamMessage.agent as typeof PlanExecuteState.State).pastSteps.map((step) => JSON.stringify(step, null, 2)),
                                        planSteps: (chainStreamMessage.agent as typeof PlanExecuteState.State).plan.map((step) => JSON.stringify(step, null, 2)),
                                    }
                                }
                            })
                            break
                        case "respond":
                            // console.log('Response Event: ', chainStreamMessage)
                            const responseAIMessage = new AIMessage({
                                content: chainStreamMessage.respond.response,
                            })

                            // console.log('Publishing AI Message: ', responseAIMessage, '. Content: ', responseAIMessage.content)

                            await amplifyClientWrapper.publishMessage({
                                chatSessionId: event.arguments.chatSessionId,
                                owner: event.identity.sub,
                                message: responseAIMessage,
                                responseComplete: true
                            })
                            break
                        default:
                            console.log('Unknown message type:\n', stringifyLimitStringLength(chainStreamMessage))
                            break
                    }
                    break
                // case "on_tool_end":
                case "on_chat_model_end":
                    const streamChunk = streamEvent.data.output as ToolMessage | AIMessageChunk
                    const textContent = getLangChainMessageTextContent(streamChunk)
                    if (textContent && textContent.length > 20) {
                        await amplifyClientWrapper.publishMessage({
                            chatSessionId: event.arguments.chatSessionId,
                            owner: event.identity.sub,
                            message: streamChunk
                        })
                    }
                    break

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
                owner: event.identity.sub,
                message: AIErrorMessage,
                responseComplete: true
            })
            return error.message
        }
        return `Error: ${JSON.stringify(error)}`
    }

};