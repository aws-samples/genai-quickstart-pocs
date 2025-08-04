/**
 * Types and interfaces for Amazon Bedrock integration
 */
/**
 * Supported Amazon Bedrock model IDs
 */
export declare enum BedrockModelId {
    CLAUDE_SONNET_3_7 = "anthropic.claude-3-sonnet-20240229-v1:0",
    CLAUDE_HAIKU_3_5 = "anthropic.claude-3-haiku-20240307-v1:0",
    AMAZON_NOVA_PRO = "amazon.nova-pro-v1:0"
}
/**
 * Bedrock model configuration
 */
export interface BedrockModelConfig {
    modelId: BedrockModelId;
    maxTokens: number;
    temperature: number;
    topP?: number;
    stopSequences?: string[];
    additionalParams?: Record<string, any>;
}
/**
 * Default model configurations
 */
export declare const DEFAULT_MODEL_CONFIGS: Record<BedrockModelId, BedrockModelConfig>;
/**
 * Bedrock request options
 */
export interface BedrockRequestOptions {
    modelConfig: BedrockModelConfig;
    prompt: string;
    systemPrompt?: string;
    requestId?: string;
    streaming?: boolean;
}
/**
 * Bedrock response
 */
export interface BedrockResponse {
    completion: string;
    modelId: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    requestId: string;
    finishReason?: string;
}
/**
 * Bedrock error
 */
export interface BedrockError {
    code: string;
    message: string;
    requestId?: string;
    statusCode?: number;
    timestamp: Date;
}
