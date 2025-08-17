import { getStructuredOutputResponse } from '@/../amplify/functions/getStructuredOutputFromLangchain'
import { HumanMessage } from "@langchain/core/messages";
import outputs from '@/../amplify_outputs.json';

const main = async () => {
    process.env.AWS_DEFAULT_REGION = outputs.auth.aws_region

    const outputStructure = {
        title: "SummarizeMessageIntnet",
        description: "Summarize the intent of the user's message?",
        type: "object",
        properties: {
            summary: {
                type: 'string',
                description: `Message intent summary in 20 characters or fewer.`,
            },
            svgImage: {
                type: 'string',
                description: `SVG describing the input`,
            }
        },
        required: ['summary','svgImage'],
    };

    const response = await getStructuredOutputResponse({
        messages: [
            new HumanMessage({ content: "I'm the strongest, greatest, most hansome man in the world" })
        ],
        modelId: 'us.anthropic.claude-3-sonnet-20240229-v1:0',
        outputStructure: outputStructure
    })
    console.log(response)
}

main()