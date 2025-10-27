/**
 * Amazon Bedrock client service
 *
 * This service provides a client for interacting with Amazon Bedrock models.
 * It handles authentication, request formatting, and response parsing.
 */
import { BedrockModelId, BedrockModelConfig, BedrockRequestOptions, BedrockResponse } from '../../models/bedrock';
/**
 * Configuration for the Bedrock client
 */
export interface BedrockClientConfig {
    region: string;
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
    };
    maxRetries?: number;
    timeout?: number;
}
/**
 * Bedrock client service
 */
export declare class BedrockClientService {
    private runtimeClient;
    private managementClient;
    private modelConfigs;
    /**
     * Create a new Bedrock client service
     * @param config Configuration for the Bedrock client
     */
    constructor(config?: Partial<BedrockClientConfig>);
    /**
     * Get the available foundation models
     * @returns List of available foundation models
     */
    listModels(): Promise<string[]>;
    /**
     * Get details about a specific foundation model
     * @param modelId The model ID
     * @returns Model details
     */
    getModelDetails(modelId: string): Promise<any>;
    /**
     * Get the configuration for a model
     * @param modelId The model ID
     * @returns The model configuration
     */
    getModelConfig(modelId: BedrockModelId): BedrockModelConfig;
    /**
     * Set the configuration for a model
     * @param modelId The model ID
     * @param config The model configuration
     */
    setModelConfig(modelId: string, config: Partial<BedrockModelConfig>): void;
    /**
     * Invoke a Bedrock model
     * @param options Request options
     * @returns The model response
     */
    invokeModel(options: BedrockRequestOptions): Promise<BedrockResponse>;
    /**
     * Invoke a Bedrock model with streaming
     * @param options Request options
     * @returns An async generator that yields response chunks
     */
    invokeModelWithStreaming(options: BedrockRequestOptions): AsyncGenerator<Partial<BedrockResponse>>;
    /**
     * Format the request body based on the model type
     * @param modelId The model ID
     * @param prompt The prompt
     * @param systemPrompt The system prompt (optional)
     * @param config The model configuration
     * @returns The formatted request body
     */
    private formatRequestBody;
    /**
     * Format the response based on the model type
     * @param responseBody The response body
     * @param modelId The model ID
     * @param requestId The request ID
     * @returns The formatted response
     */
    private formatResponse;
    /**
     * Extract content from a streaming response chunk
     * @param chunkData The chunk data
     * @param modelId The model ID
     * @returns The extracted content
     */
    private extractStreamContent;
    /**
     * Format an error
     * @param error The error
     * @param code The error code
     * @returns The formatted error
     */
    private formatError;
}
