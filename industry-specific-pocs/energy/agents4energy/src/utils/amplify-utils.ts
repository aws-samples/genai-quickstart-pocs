import { generateClient } from "aws-amplify/data";
import { list, ListPaginateWithPathInput } from 'aws-amplify/storage';
import { Message, ToolMessageContentType, messageContentType } from './types'

import { type Schema } from "../../amplify/data/resource";

export const amplifyClient = generateClient<Schema>();

type BedrockAnthropicBodyType = {
    id: string;
    type: string;
    role: string;
    model: string;
    content: {
        type: string;
        text: string;
    }[];
    stop_reason: string;
    stop_sequence: null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
};

export const invokeBedrockModelParseBodyGetText = async (prompt: string) => {
    console.log('Prompt: ', prompt)
    const response = await amplifyClient.queries.invokeBedrock({ prompt: prompt })
    console.log('Bedrock Response: ', response.data)
    if (!(response.data && response.data.body)) {
        console.log('No response from bedrock after prompt: ', prompt)
        return
    }
    const bedrockResponseBody = JSON.parse(response.data.body) as BedrockAnthropicBodyType
    console.log('Bedrock Response Body: ', bedrockResponseBody)
    return bedrockResponseBody.content.map(item => item.text).join('\n')
}


export interface S3Asset {
    Key: string;
    Size: number | undefined;
    IsFolder: boolean;
}

export const onFetchObjects = async (pathPrefix: string): Promise<readonly S3Asset[]> => {
    console.log('pathPrefix', pathPrefix)
    try {

        const result = await list({
            path: pathPrefix || "well-files/",
            pageSize: 10,
            options: {
                subpathStrategy: { strategy: 'exclude' }
            },
            // nextToken: nextToken
        } as ListPaginateWithPathInput);

        console.log('list result: ', result)

        const objects: S3Asset[] = result.items.map((item) => ({
            Key: item.path,
            Size: item.size,
            IsFolder: false
        }));

        if (result.excludedSubpaths) {
            const folders: S3Asset[] = result.excludedSubpaths.map((item) => {
                return {
                    Key: item.substring(pathPrefix.length),
                    Size: undefined,
                    IsFolder: true
                }
            })

            objects.push(...folders)
        }

        return objects

    } catch (error) {
        console.error('Error fetching S3 objects:', error);
        return Promise.resolve([]); // Return an empty array in case of an error
    }
}

export function isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

export function getMessageCatigory(message: Message): messageContentType {
    if (!message.tool_name) {
      //This is an AI message
      return 'ai'
    } else if (!isValidJSON(message.content)) {
      //This is a markdown tool message
      return 'tool_markdown'
    } else {
        switch (message.tool_name) {
        case 'executeSQLQuery':
          return 'tool_table_trend'
        case 'wellTableTool':
          return 'tool_table_events'
        case 'plotTableFromToolResponseToolBuilder':
          return 'tool_plot'
        // default:
        //   return 'tool_json'
      }

      return (JSON.parse(message.content) as ToolMessageContentType).messageContentType
    }
  }

  export const invokeBedrockAgentParseBodyGetTextAndTrace = async (props: { prompt: string, chatSession: Schema['ChatSession']['type'], agentId?: string, agentAliasId?: string }) => {
    const { prompt, chatSession } = props
    const agentId = props.agentId || chatSession.aiBotInfo?.aiBotId
    const agentAliasId = props.agentAliasId || chatSession.aiBotInfo?.aiBotAliasId
    console.log(`Agent (id: ${agentId}, aliasId: ${agentAliasId}) Prompt:\n ${prompt} `)

    if (!agentId) throw new Error('No Agent ID found in invoke request')
    if (!agentAliasId) throw new Error('No Agent Alias ID found in invoke request')

    const response = await amplifyClient.queries.invokeBedrockAgent({
        prompt: prompt,
        agentId: agentId,
        agentAliasId: agentAliasId,
        chatSessionId: chatSession.id
    })
    console.log('Bedrock Agent Response: ', response)

}

