"use client"
import { stringify } from 'yaml'
import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic'

import type { Schema } from '@/../amplify/data/resource';
import { amplifyClient } from '@/utils/amplify-utils';
import { formatDate } from "@/utils/date-utils";
import { defaultAgents } from '@/utils/config'
import { Message } from '@/utils/types'
import { withAuth } from '@/components/WithAuth';
import ChatBox from '@/components/ChatBox'
import type { SideNavigationProps } from '@cloudscape-design/components';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { Tooltip } from '@mui/material';
import '@aws-amplify/ui-react/styles.css'
import '@/app/styles/chat.scss'
import ReactMarkdown from 'react-markdown';

// Dynamic imports for Cloudscape components
const AppLayout = dynamic(
    () => import('@cloudscape-design/components').then((mod) => mod.AppLayout),
    { ssr: false }
);
const HelpPanel = dynamic(
    () => import('@cloudscape-design/components').then((mod) => mod.HelpPanel),
    { ssr: false }
);
const SideNavigation = dynamic(
    () => import('@cloudscape-design/components').then((mod) => mod.SideNavigation),
    { ssr: false }
);
const Tabs = dynamic(
    () => import('@cloudscape-design/components/tabs'),
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
const Tiles = dynamic(
    () => import('@cloudscape-design/components/tiles'),
    { ssr: false }
);
const Container = dynamic(
    () => import('@cloudscape-design/components/container'),
    { ssr: false }
);
const Steps = dynamic(
    () => import('@cloudscape-design/components/steps'),
    { ssr: false }
);
const StorageBrowser = dynamic(
    () => import('@/components/StorageBrowser').then(mod => mod.StorageBrowser),
    { ssr: false }
);

const jsonParseHandleError = (jsonString: string) => {
    try {
        return JSON.parse(jsonString)
    } catch {
        console.warn(`Could not parse string: ${jsonString}`)
    }
}

function Page({ params }: { params?: { chatSessionId: string } }) {

    const [chatSessions, setChatSessions] = useState<Array<Schema["ChatSession"]["type"]>>([]);
    const [groupedChatSessions, setGroupedChatSessions] = useState<SideNavigationProps.Item[]>([])
    const [initialActiveChatSession, setInitialActiveChatSession] = useState<Schema["ChatSession"]["type"]>();
    const [liveUpdateActiveChatSession, setLiveUpdateActiveChatSession] = useState<Schema["ChatSession"]["type"]>();
    const [glossaryBlurbs, setGlossaryBlurbs] = useState<{ [key: string]: string }>({});
    const { user } = useAuthenticator((context) => [context.user]);
    const router = useRouter();
    const [navigationOpen, setNavigationOpen] = useState(true);

    //Set the chat session from params
    useEffect(() => {
        if (params && params.chatSessionId) {
            amplifyClient.models.ChatSession.get({ id: params.chatSessionId }).then(({ data: chatSession }) => {
                if (chatSession) {
                    setInitialActiveChatSession(chatSession)

                    console.log('Loaded chat session. Ai Bot Info:', chatSession.aiBotInfo)

                } else {
                    console.log(`Chat session ${params.chatSessionId} not found`)
                }
            })
        } else {
            console.log("No chat session id in params: ", params)
        }
    }, [params])

    //Subscribe to updates of the active chat session
    useEffect(() => {
        if (params && params.chatSessionId) {
            amplifyClient.models.ChatSession.observeQuery({
                filter: {
                    // owner: { eq: user.userId }
                    id: { eq: params.chatSessionId }
                }
            }).subscribe({
                next: (data) => setLiveUpdateActiveChatSession(data.items[0]),
                error: (error) => console.error('Error subscribing the chat session', error)
            })
        } else {
            console.log("No chat session id in params: ", params)
        }
    }, [params])

    // List the user's chat sessions
    useEffect(() => {
        console.log("Listing User's Chat Sessions")
        if (user) {
            amplifyClient.models.ChatSession.observeQuery({
                filter: {
                    // owner: { eq: user.userId }
                    owner: { contains: user.userId }
                }
            }).subscribe({
                next: (data) => {
                    if (initialActiveChatSession) { // If there is an active chat session, show the other chat sessions with the same ai bot
                        setChatSessions(data.items.filter(item => item.aiBotInfo?.aiBotName === initialActiveChatSession?.aiBotInfo?.aiBotName))
                    } else if (!params?.chatSessionId) { //If no chat session is supplied, list all chat sessions.
                        setChatSessions(data.items)
                    }
                }
            })
        }

    }, [user, initialActiveChatSession, params?.chatSessionId])

    const groupChatsByMonth = useCallback((chatSessions: Array<Schema["ChatSession"]["type"]>): SideNavigationProps.Item[] => {
        const grouped = chatSessions
            .sort((a, b) => (a.createdAt && b.createdAt) ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0)
            .reduce((acc: { [key: string]: Array<Schema["ChatSession"]["type"]> }, session) => {
                if (!session.createdAt) throw new Error("Chat session missing createdAt timestamp");

                const date = new Date(session.createdAt);
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

                if (!acc[monthYear]) {
                    acc[monthYear] = [];
                }

                const insertIndex = acc[monthYear].findIndex(existingSession =>
                    existingSession.createdAt && session.createdAt &&
                    existingSession.createdAt < session.createdAt
                );
                // If no index found (insertIndex === -1), push to end, otherwise insert at index
                if (insertIndex === -1) {
                    acc[monthYear].push(session);
                } else {
                    acc[monthYear].splice(insertIndex, 0, session);
                }
                return acc;
            }, {});

        return Object.entries(grouped).map(([monthYear, groupedChatSessions]): SideNavigationProps.Item => ({
            type: "section",
            text: monthYear,
            items: [{
                type: "link",
                href: `/chat`,
                text: "",
                info: <Tiles
                    onChange={({ detail }) => {
                        router.push(`/chat/${detail.value}`);
                    }}
                    value={(params && params.chatSessionId) ? params.chatSessionId : "No Active Chat Session"}
                    items={
                        groupedChatSessions.map((groupedChatSession) => ({
                            controlId: groupedChatSession.id,
                            label: groupedChatSession.firstMessageSummary?.slice(0, 50),
                            description: `${formatDate(groupedChatSession.createdAt)} - AI: ${groupedChatSession.aiBotInfo?.aiBotName || 'Unknown'}`,
                            value: groupedChatSession.id
                        }))
                    }
                />
            }]
        }));
    }, [router, params]);

    useEffect(() => {
        console.log("Grouping Chat Sessions")
        const newGroupedChatSessions = groupChatsByMonth(chatSessions)
        setGroupedChatSessions(newGroupedChatSessions)
    }, [chatSessions, groupChatsByMonth])

    async function createChatSession(chatSession: Schema['ChatSession']['createType']) {
        // setMessages([])
        amplifyClient.models.ChatSession.create(chatSession).then(({ data: newChatSession }) => {
            if (newChatSession) {
                router.push(`/chat/${newChatSession.id}`)
            }
        })
    }

    async function getGlossary(message: Message) {

        if (!message.chatSessionId) throw new Error(`No chat session id in message: ${message}`)

        if (message.chatSessionId in glossaryBlurbs) return


        const generateGlossaryResponse = await amplifyClient.queries.invokeBedrockWithStructuredOutput({
            chatSessionId: message.chatSessionId,
            lastMessageText: `Define any uncommon or industry specific terms in the message below\n<message>${message.content}</message>`,
            usePastMessages: false,
            outputStructure: JSON.stringify({
                title: "DefineGlossaryTerms", //title and description help the llm to know how to fill the arguments out
                description: "Create a JSON object which describes complex technical terms in the text. Only define terms which may be confuse some engineers",
                type: "object",
                properties: {// Change anyting in the properties according to the json schema reference: https://json-schema.org/understanding-json-schema/reference
                    glossaryArray: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                term: { type: 'string' },
                                definition: { type: 'string' }
                            },
                            required: ['term', 'description']
                        },
                        description: `Array of defined glossary terms`
                    }
                },
                required: ['glossaryArray'],
            })
        })
        console.log("Generate Glossary Response: ", generateGlossaryResponse)
        if (generateGlossaryResponse.data) {
            const newGeneratedGlossary = jsonParseHandleError(generateGlossaryResponse.data).glossaryArray as { term: string, definition: string }[]
            console.log('Generated Glossary Entry: ', newGeneratedGlossary)
            const newGlossaryBlurb = newGeneratedGlossary.map(glossaryEntry => `## ${glossaryEntry.term}: \n ${glossaryEntry.definition}`).join("\n\n")
            // const newGlossaryBlurb = newGeneratedGlossary.map(glossaryEntry => (<><h4>${glossaryEntry.term}</h4><p>{glossaryEntry.definition}</p></>)).join("\n")
            if (newGeneratedGlossary) setGlossaryBlurbs((prevGlossaryBlurbs) => ({ ...prevGlossaryBlurbs, [message.id || "ShouldNeverHappen"]: newGlossaryBlurb }))
            // const newSuggestedPrompts = JSON.parse(suggestedPromptsResponse.data).suggestedPrompts as string[]
        } else console.log('Error Generating Glossary: ', generateGlossaryResponse)
    }

    return (
        <div className='page-container'>
            <Tabs
                disableContentPaddings
                tabs={[
                    {
                        label: "Chat Agents",
                        id: "first",
                        content:
                            <AppLayout
                                navigationOpen={navigationOpen}
                                onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
                                toolsHide={liveUpdateActiveChatSession?.aiBotInfo?.aiBotName !== defaultAgents.PlanAndExecuteAgent.name}  // Add this line to hide the tools icon
                                tools={
                                    liveUpdateActiveChatSession?.aiBotInfo?.aiBotName === defaultAgents.PlanAndExecuteAgent.name ? (
                                        <HelpPanel
                                            header={
                                                <h2>Plan and Execute Steps</h2>
                                            }>
                                            {[
                                                ...(liveUpdateActiveChatSession?.pastSteps?.map((step) => ({ stepType: 'past', content: step })) ?? []),
                                                ...(liveUpdateActiveChatSession?.planSteps?.map((step) => ({ stepType: 'plan', content: step })) ?? []),
                                            ].map((step) => {
                                                try {
                                                    const stepContent = JSON.parse(step.content as string)
                                                    return (
                                                        <Tooltip
                                                            key={step.content as string}
                                                            title={<pre
                                                                style={{ //Wrap long lines
                                                                    whiteSpace: 'pre-wrap',
                                                                    wordWrap: 'break-word',
                                                                    overflowWrap: 'break-word',
                                                                }}
                                                            >
                                                                {stringify(stepContent)}
                                                            </pre>}
                                                            arrow
                                                            placement="left"
                                                            slotProps={{
                                                                tooltip: {
                                                                    sx: {
                                                                        maxWidth: 2000,
                                                                    },
                                                                },
                                                            }}
                                                        >

                                                            <div className="step-container"
                                                                key={step.content as string}
                                                                onClick={() => {
                                                                    const element = document.getElementById(`## ${stepContent.title}`);
                                                                    // console.log('Scrolling to element: ', element)
                                                                    if (element) {
                                                                        element.scrollIntoView({
                                                                            behavior: 'smooth',
                                                                            block: 'center'
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <Steps
                                                                    // className='steps'
                                                                    steps={[
                                                                        {
                                                                            status: (step.stepType === 'past' ? "success" : "loading"),
                                                                            header: stepContent.title,
                                                                            statusIconAriaLabel: (step.stepType === 'past' ? "Success" : "Loading")
                                                                        }
                                                                    ]}
                                                                />
                                                            </div>
                                                        </Tooltip>
                                                    )
                                                } catch {
                                                    return <p>{step.content}</p>
                                                }
                                            })}
                                        </HelpPanel>
                                    ) : undefined
                                }
                                navigation={
                                    <SideNavigation
                                        header={{
                                            href: '#',
                                            text: 'Sessions',
                                        }}
                                        items={groupedChatSessions}
                                    />
                                }
                                content={
                                    initialActiveChatSession ?
                                        (<ChatBox
                                            chatSession={initialActiveChatSession}
                                            glossaryBlurbs={glossaryBlurbs}
                                            getGlossary={getGlossary}
                                        />) : (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem',
                                                alignItems: 'flex-start'
                                            }}>
                                                <h3>Select an agent to chat with:</h3>
                                                {
                                                    Object.entries(defaultAgents)
                                                        .map(
                                                            ([agentId, agentInfo]) => {
                                                                return <Button
                                                                    key={agentId}
                                                                    onClick={() => {
                                                                        createChatSession({ aiBotInfo: { aiBotName: agentInfo.name, aiBotId: agentId } })
                                                                    }}
                                                                >
                                                                    {agentInfo.name}
                                                                </Button>
                                                            }
                                                        )
                                                }
                                            </div>
                                        )
                                }
                            />,
                        action:
                            <ButtonDropdown
                                variant="icon"

                                ariaLabel="Query actions for first tab"
                                items={[
                                    ...Object.entries(defaultAgents).map(([agentId, agentInfo]) => ({ id: agentId, text: agentInfo.name })),
                                ]}
                                expandToViewport={true}
                                onItemClick={async ({ detail }) => {
                                    const agentInfo = defaultAgents[detail.id];
                                    // const agentAliasId = agent.agentId && !(agent.agentId in defaultAgents) ? await getAgentAliasId(agent.agentId) : null
                                    createChatSession({ aiBotInfo: { aiBotName: agentInfo.name, aiBotId: detail.id } })
                                }}

                            />
                    },
                    {
                        label: "Glossary",
                        id: "second",
                        content:
                            <div className='glossary-container'>
                                <Container>
                                    {Object.entries(glossaryBlurbs).map(([key, value]) => (
                                        <div key={key}>
                                            <ReactMarkdown>
                                                {value}
                                            </ReactMarkdown>
                                        </div>
                                    ))}
                                </Container>
                            </div>,
                    },
                    {
                        label: "Files",
                        id: "fourth",
                        content:
                            <div className='links-container'>
                                <StorageBrowser />
                            </div>,
                    },

                ]}
            />
        </div>
    );
};

export default withAuth(Page)