import type { Schema } from '../../amplify/data/resource';
export type Message = Schema["ChatMessage"]["createType"] & {
    previousTrendTableMessage?: Schema["ChatMessage"]["createType"];
    previousEventTableMessage?: Schema["ChatMessage"]["createType"];
};



export type messageContentType = 'ai' | 'tool_markdown' | 'tool_json' | 'tool_table_trend' | 'tool_table_events' | 'tool_plot'

export type ToolMessageContentType = {
    messageContentType: messageContentType;
};

// export type Message = {
//     content: string;
//     owner?: string;
//     role: string;
//     createdAt?: string;
//     trace?: string
//     tool_name?: string;
//     tool_call_id?: string;
//     tool_calls?: string;
//     chatSessionId?: string;
//   }