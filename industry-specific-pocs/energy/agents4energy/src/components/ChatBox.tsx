import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic'
import { Schema } from '@/../amplify/data/resource'
import { Message } from '@/utils/types'
import Messages from './ChatMessage'
import { jsonParseHandleError, combineAndSortMessages } from '@/utils/ui-utils'
import { invokeBedrockAgentParseBodyGetTextAndTrace } from '@/utils/amplify-utils'
import { defaultAgents, BedrockAgent } from '@/utils/config'
import { amplifyClient, getMessageCatigory } from '@/utils/amplify-utils';

// Dynamic imports for Cloudscape components
const Header = dynamic(
    () => import('@cloudscape-design/components').then((mod) => mod.Header),
    { ssr: false }
);
const Link = dynamic(
    () => import('@cloudscape-design/components').then((mod) => mod.Link),
    { ssr: false }
);
const Button = dynamic(
    () => import('@cloudscape-design/components/button'),
    { ssr: false }
);
const ButtonDropdown = dynamic(
    () => import('@cloudscape-design/components/button-dropdown'),
    { ssr: false }
);
const PromptInput = dynamic(
    () => import('@cloudscape-design/components/prompt-input'),
    { ssr: false }
);
const Container = dynamic(
    () => import('@cloudscape-design/components/container'),
    { ssr: false }
);
const FormField = dynamic(
    () => import('@cloudscape-design/components/form-field'),
    { ssr: false }
);
const Box = dynamic(
    () => import('@cloudscape-design/components/box'),
    { ssr: false }
);


interface ChatBoxProps {
    chatSession: Schema['ChatSession']['type'] | undefined,
    getGlossary: (message: Message) => Promise<void>,
    glossaryBlurbs: {
        [key: string]: string;
    }
}

const ChatBox: React.FC<ChatBoxProps> = (props: ChatBoxProps) => {
    const { chatSession, getGlossary, glossaryBlurbs } = props;

    const [messages, setMessages] = useState<Array<Schema["ChatMessage"]["createType"]>>([]);
    const [, setCharacterStream] = useState<{ content: string, index: number }[]>([{
        content: "\n\n\n",
        index: -1
    }]);
    const [characterStreamMessage, setCharacterStreamMessage] = useState<Message>({ role: "ai", content: "", createdAt: new Date().toISOString() });
    const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
    const [userPrompt, setUserPrompt] = useState<string>('');
    const [isGenAiResponseLoading, setIsGenAiResponseLoading] = useState(false);

    const messagesString = useMemo(() => JSON.stringify(messages), [messages]);
    const chatSessionString = useMemo(() => JSON.stringify(chatSession), [chatSession]);

    // Subscribe to messages of the active chat session
    useEffect(() => {
        console.log("ChatBox: Subscribing to messages of the active chat session")
        if (!chatSession) return

        const sub = amplifyClient.models.ChatMessage.observeQuery({
            filter: {
                chatSessionId: { eq: chatSession.id }
            }
        }).subscribe({
            next: ({ items }) => { //isSynced is an option here to
                setMessages((prevMessages) => {
                    //If the message has type plot, attach the previous tool_table_events and tool_table_trend messages to it.
                    const sortedMessages = combineAndSortMessages(prevMessages, items)

                    const sortedMessageWithPlotContext = sortedMessages.map((message, index) => {
                        const messageCatigory = getMessageCatigory(message)
                        if (messageCatigory === 'tool_plot') {
                            //Get the messages with a lower index than the tool_plot's index
                            const earlierMessages = sortedMessages.slice(0, index).reverse()

                            const earlierEventsTable = earlierMessages.find((previousMessage) => {
                                const previousMessageCatigory = getMessageCatigory(previousMessage)
                                return previousMessageCatigory === 'tool_table_events'
                            })

                            const earlierTrendTable = earlierMessages.find((previousMessage) => {
                                const previousMessageCatigory = getMessageCatigory(previousMessage)
                                return previousMessageCatigory === 'tool_table_trend'
                            })

                            return {
                                ...message,
                                previousTrendTableMessage: earlierTrendTable,
                                previousEventTableMessage: earlierEventsTable
                            }
                        } else return message
                    })
                    return sortedMessageWithPlotContext
                })
            }
        })
        return () => sub.unsubscribe();
    }, [chatSession?.id]) // Only re-subscribe when the chat session ID changes

    // Subscribe to the token stream for this chat session
    useEffect(() => {
        console.log("Subscribing to the token stream for this chat session")
        if (chatSession) {
            const sub = amplifyClient.subscriptions.recieveResponseStreamChunk({ chatSessionId: chatSession.id }).subscribe({
                next: (newChunk) => {
                    // console.log('Message Stream Chunk: ', chunk)
                    setCharacterStream((prevStream) => {

                        const chunkIndex = (typeof newChunk.index === 'undefined' || newChunk.index === null) ? (prevStream.length + 1) : newChunk.index

                        // console.log("Initial Chunk Index: ", newChunk.index, " Final Chunk Index: ", chunkIndex," Content: ", newChunk.chunk, ' First Chunk: ', prevStream[0])

                        const existingIndex = prevStream.findIndex(item => item.index === chunkIndex);
                        const chunkIndexInPrevStream = prevStream.findIndex(item => item.index > chunkIndex);
                        const newStream = prevStream

                        const formatedNewChunk = { index: chunkIndex, content: newChunk.chunk }

                        if (existingIndex !== -1) {
                            // Replace chunk with the same index
                            newStream[existingIndex] = formatedNewChunk
                        } else if (chunkIndexInPrevStream === -1) {
                            // If no larger index found, append to end
                            newStream.push(formatedNewChunk);
                        } else {
                            // Insert at the found position
                            newStream.splice(chunkIndexInPrevStream, 0, formatedNewChunk);
                        }

                        setCharacterStreamMessage({
                            content: newStream.map(chunk => chunk.content).join(""),
                            role: "ai",
                            createdAt: new Date().toISOString()
                        })

                        return newStream
                    })

                    // setCharacterStreamMessage((prevStreamMessage) => ({
                    //     content: prevStreamMessage ? (prevStreamMessage.content || "") + chunk : chunk,
                    //     role: "ai",
                    //     createdAt: new Date().toISOString()
                    // }))
                }
            }
            )
            return () => sub.unsubscribe();
        }

    }, [chatSession])

    // This runs when the chat session messages change
    // The blurb below sets the suggested prompts and the isLoading indicator
    useEffect(() => {
        //Reset the character stream when we get a new message
        setCharacterStream(() => {
            console.log("Resetting character stream")
            return [{
                content: "\n\n\n",
                index: -1
            }]
        })
        setCharacterStreamMessage(() => ({
            content: "",
            role: "ai",
            createdAt: new Date().toISOString()
        }))

        //Set the default prompts if this is the first message
        if (
            !messages.length && //No messages currently in the chat
            chatSession &&
            chatSession.aiBotInfo &&
            chatSession.aiBotInfo.aiBotId &&
            chatSession.aiBotInfo.aiBotId in defaultAgents
        ) setSuggestedPrompts(defaultAgents[chatSession.aiBotInfo.aiBotId].samplePrompts)

        //If there are no messages, or the last message is an AI message with no tool calls, prepare for a human message
        if (
            messages.length &&
            messages[messages.length - 1].role === "ai" &&
            (!messages[messages.length - 1].tool_calls || messages[messages.length - 1].tool_calls === "[]") &&
            messages[messages.length - 1].responseComplete
        ) {
            console.log('Ready for human response')
            setIsGenAiResponseLoading(false)

            async function fetchAndSetSuggestedPrompts() {
                setSuggestedPrompts([])
                if (!chatSession || !chatSession.id) throw new Error("No active chat session")

                const suggestedPromptsResponse = await amplifyClient.queries.invokeBedrockWithStructuredOutput({
                    chatSessionId: chatSession.id,
                    lastMessageText: "Suggest three follow up prompts",
                    usePastMessages: true,
                    outputStructure: JSON.stringify({
                        title: "RecommendNextPrompt", //title and description help the llm to know how to fill the arguments out
                        description: "Help the user chose the next prompt to send.",
                        type: "object",
                        properties: {// Change anyting in the properties according to the json schema reference: https://json-schema.org/understanding-json-schema/reference
                            suggestedPrompts: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                },
                                minItems: 3,
                                maxItems: 3,
                                description: `
                                    Prompts to suggest to a user when interacting with a large language model
                                    `
                            }
                        },
                        required: ['suggestedPrompts'],
                    })
                })
                console.log("Suggested Prompts Response: ", suggestedPromptsResponse)
                if (suggestedPromptsResponse.data) {
                    const newSuggestedPrompts = jsonParseHandleError(suggestedPromptsResponse.data)
                    if (newSuggestedPrompts) setSuggestedPrompts(newSuggestedPrompts.suggestedPrompts as string[])
                } else console.log('No suggested prompts found in response: ', suggestedPromptsResponse)
            }
            fetchAndSetSuggestedPrompts()
        } else if (messages.length) setIsGenAiResponseLoading(true) //This is so if you re-load a page while the agent is processing is loading is set to true.

    }, [messagesString, chatSessionString, suggestedPrompts.length])

    async function updateChatMessage(props: { message: Message }) {
        const targetChatSessionId = chatSession?.id;

        // setMessages((previousMessages) => combineAndSortMessages([
        //     ...previousMessages.filter(message => message.id != props.message.id),
        //     props.message
        // ]))

        setMessages((previousMessages) => combineAndSortMessages(
            previousMessages.filter(message => message.id != props.message.id),
            [props.message]
        ))

        const updateChatMessageResponse = await amplifyClient.models.ChatMessage.update({
            id: props.message.id!,
            chatSessionId: targetChatSessionId,
            ...props.message,
        })

        console.log('Update chat message response: ', updateChatMessageResponse)

        // if (targetChatSessionId) {
        //     return newMessage
        // }

    }

    async function addChatMessage(props: { body: string, role: "human" | "ai" | "tool", trace?: string, chainOfThought?: boolean }) {
        const targetChatSessionId = chatSession?.id;

        setMessages((previousMessages) => [
            ...previousMessages,
            {
                id: "temp",
                content: props.body,
                role: "human",
                createdAt: new Date().toISOString(),
            }
        ])

        const newMessage = await amplifyClient.models.ChatMessage.create({
            content: props.body,
            trace: props.trace,
            role: props.role,
            chatSessionId: targetChatSessionId,
            chainOfThought: props.chainOfThought
        })

        // Remove the message with the id "temp"
        setMessages((previousMessages) => [
            ...previousMessages.filter(message => message.id != "temp"),
            newMessage.data!
        ])

        if (targetChatSessionId) {
            return newMessage
        }

    }

    const setChatSessionFirstMessageSummary = async (firstMessageBody: string, targetChatSession: Schema['ChatSession']['type']) => {
        const outputStructure = {
            title: "SummarizeMessageIntnet",
            description: "Summarize the intent of the user's message?",
            type: "object",
            properties: {
                summary: {
                    type: 'string',
                    description: `Message intent summary in 20 characters or fewer.`,
                    // maxLength: 20
                }
            },
            required: ['summary'],
        };

        const structuredResponse = await amplifyClient.queries.invokeBedrockWithStructuredOutput({
            chatSessionId: targetChatSession.id,
            lastMessageText: firstMessageBody,
            outputStructure: JSON.stringify(outputStructure)
        })
        console.log("Structured Output Response: ", structuredResponse)
        if (structuredResponse.data) {
            const messageIntent = jsonParseHandleError(structuredResponse.data)
            if (messageIntent) {
                await amplifyClient.models.ChatSession.update({
                    id: targetChatSession.id,
                    firstMessageSummary: messageIntent.summary as string
                })
            }

        } else console.log('No structured output found in response: ', structuredResponse)
    }

    // const invokeProductionAgent = async (prompt: string, chatSession: Schema['ChatSession']['type']) => {
    //     amplifyClient.queries.invokeProductionAgent({ lastMessageText: prompt, chatSessionId: chatSession.id }).then(
    //         (response) => {
    //             console.log("bot response: ", response)
    //         }
    //     )
    // }

    // const onPromptSend = ({ detail: { value } }: { detail: { value: string } }) => {
    async function addUserChatMessage({ detail: { value } }: { detail: { value: string } }) {
        if (!messages.length) {
            console.log("This is the initial message. Getting summary for chat session")
            if (!chatSession) throw new Error("No active chat session")
            setChatSessionFirstMessageSummary(value, chatSession)
        }
        // await addChatMessage({ body: body, role: "human" })
        sendMessageToChatBot(value);
        setUserPrompt("")
    }

    async function sendMessageToChatBot(prompt: string) {
        setIsGenAiResponseLoading(true);
        // await addChatMessage({ body: prompt, role: "human" })

        if (chatSession?.aiBotInfo?.aiBotAliasId) {
            await invokeBedrockAgentParseBodyGetTextAndTrace({ prompt: prompt, chatSession: chatSession })
            // if (!response) throw new Error("No response from agent");
        } else {

            const selectedDefaultAgentKey = Object.keys(defaultAgents).find(key =>
                defaultAgents[key].name === chatSession?.aiBotInfo?.aiBotName
            );
            const selectedDefaultAgent = selectedDefaultAgentKey ? defaultAgents[selectedDefaultAgentKey] : null;

            if (!selectedDefaultAgent) throw new Error("No default agent selected");
            if (!chatSession) throw new Error("No active chat session");

            switch (selectedDefaultAgent.source) {
                case "bedrockAgent":
                    await addChatMessage({ body: prompt, role: "human" })
                    await invokeBedrockAgentParseBodyGetTextAndTrace({
                        prompt: prompt,
                        chatSession: chatSession,
                        agentAliasId: (selectedDefaultAgent as BedrockAgent).agentAliasId,
                        agentId: (selectedDefaultAgent as BedrockAgent).agentId,
                    })
                    break;
                case "graphql":
                    await addChatMessage({ body: prompt, role: "human" })
                    switch (selectedDefaultAgent.name) {
                        case defaultAgents.PlanAndExecuteAgent.name:
                            await amplifyClient.queries.invokePlanAndExecuteAgent({ lastMessageText: prompt, chatSessionId: chatSession.id })
                            break;
                        default:
                            throw new Error("No Agent Configured");
                            break;
                    }
                    break;
                default:
                    throw new Error("No Agent Configured");
                    break;

            }
        }
    }

    return (
        // <div
        //     className='chat-container'
        //     style={{
        //         height: 'calc(100vh - 146px)',
        //         // overflow: 'auto',
        //         // display: 'flex',
        //         // flexDirection: 'column',
        //         position: 'relative',
        //         // scrollBehavior: 'smooth'
        //     }}
        //     id="chat-container"
        // >
        <>
            {/* <div style={{
            marginTop: '60px'
        }}></div> */}
            <Box>
                <Container
                    header={
                        <>
                            <Header variant="h3">Generative AI chat - {chatSession?.aiBotInfo?.aiBotName}</Header>
                            <span className='prompt-label'>Try one of these example prompts</span>
                            <ButtonDropdown
                                ariaLabel="Suggested Prompts"
                                items={[
                                    ...suggestedPrompts.map((prompt) => ({ id: prompt, text: prompt })),
                                ]}
                                onItemClick={({ detail }) => {
                                    addUserChatMessage({ detail: { value: detail.id } });
                                }}
                            />
                            <span className='prompt-label'>
                                <Button
                                    onClick={async () => {
                                        if (chatSession?.id && window.confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
                                            await amplifyClient.models.ChatSession.delete({ id: chatSession.id })
                                        }
                                    }}
                                >x</Button>
                            </span>
                        </>
                    }
                    fitHeight
                    // disableContentPaddings
                    footer={
                        <FormField
                            stretch
                            constraintText={
                                <>
                                    Use of this service is subject to the{' '}
                                    <Link href="#" external variant="primary" fontSize="inherit">
                                        AWS Responsible AI Policy
                                    </Link>
                                    .
                                </>
                            }
                        >

                            {/* During loading, action button looks enabled but functionality is disabled. */}
                            {/* This will be fixed once prompt input receives an update where the action button can receive focus while being disabled. */}
                            {/* In the meantime, changing aria labels of prompt input and action button to reflect this. */}

                            <PromptInput
                                onChange={({ detail }) => setUserPrompt(detail.value)}
                                onAction={addUserChatMessage}
                                value={userPrompt}
                                actionButtonAriaLabel={isGenAiResponseLoading ? 'Send message button - suppressed' : 'Send message'}
                                actionButtonIconName="send"
                                ariaLabel={isGenAiResponseLoading ? 'Prompt input - suppressed' : 'Prompt input'}
                                placeholder="Ask a question"
                                autoFocus
                            />
                        </FormField>
                    }
                >
                    <Messages
                        messages={[
                            ...messages,
                            ...(
                                (
                                    characterStreamMessage.content !== "" &&
                                    messages.length &&
                                    !messages[messages.length - 1].responseComplete //If the last message is not complete, show the character stream message
                                )
                                    ? [characterStreamMessage] : []
                            )
                        ]}
                        updateMessage={updateChatMessage}
                        getGlossary={getGlossary}
                        isLoading={isGenAiResponseLoading}
                        glossaryBlurbs={glossaryBlurbs}
                    />
                </Container>
            </Box>
        </>
        //</div>
    )
}

export default ChatBox