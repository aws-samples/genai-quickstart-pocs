/**
 * Types and interfaces for Amazon Bedrock integration
 */

/**
 * Supported Amazon Bedrock model IDs
 */
export enum BedrockModelId {
  CLAUDE_SONNET_3_7 = 'anthropic.claude-3-sonnet-20240229-v1:0',
  CLAUDE_HAIKU_3_5 = 'anthropic.claude-3-haiku-20240307-v1:0',
  AMAZON_NOVA_PRO = 'amazon.nova-pro-v1:0'
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
export const DEFAULT_MODEL_CONFIGS: Record<BedrockModelId, BedrockModelConfig> = {
  [BedrockModelId.CLAUDE_SONNET_3_7]: {
    modelId: BedrockModelId.CLAUDE_SONNET_3_7,
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9
  },
  [BedrockModelId.CLAUDE_HAIKU_3_5]: {
    modelId: BedrockModelId.CLAUDE_HAIKU_3_5,
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9
  },
  [BedrockModelId.AMAZON_NOVA_PRO]: {
    modelId: BedrockModelId.AMAZON_NOVA_PRO,
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9
  }
};

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