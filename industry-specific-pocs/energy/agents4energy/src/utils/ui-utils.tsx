import { ComponentProps } from 'react';
import { Message } from '@/utils/types'

export const jsonParseHandleError = (jsonString: string) => {
    try {
        return JSON.parse(jsonString)
    } catch {
        console.warn(`Could not parse string: ${jsonString}`)
    }
}

export const combineAndSortMessages = ((arr1: Array<Message>, arr2: Array<Message>) => {
    const combinedMessages = [...arr1, ...arr2]
    const uniqueMessages = combinedMessages.filter((message, index, self) =>
        index === self.findIndex((p) => p.id === message.id)
    );
    return uniqueMessages.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) throw new Error("createdAt is missing")
        return a.createdAt.localeCompare(b.createdAt)
    });
})

// Use ComponentProps to get the prop types of the Avatar component
export type AuthorAvatarProps = {
    type: 'user' | 'gen-ai';
    name: string;
    initials?: string;
    loading?: boolean;
} & Partial<ComponentProps<typeof Avatar>>;
type AuthorsType = {
    [key: string]: AuthorAvatarProps;
};
export const AUTHORS: AuthorsType = {
    'human': { type: 'user', name: 'Jane Doe', initials: 'JD' },
    'ai': { type: 'gen-ai', name: 'Generative AI assistant' },
    'tool': { type: 'gen-ai', name: 'Generative AI assistant' },
};
import Avatar from '@cloudscape-design/chat-components/avatar';


export function ChatBubbleAvatar({ type, name, loading }: AuthorAvatarProps) {
    if (type === 'gen-ai') {
        return <Avatar color="gen-ai" iconName="gen-ai" tooltipText={name} ariaLabel={name} loading={loading} />;
    }

    return <Avatar tooltipText={name} ariaLabel={name} />;
}
