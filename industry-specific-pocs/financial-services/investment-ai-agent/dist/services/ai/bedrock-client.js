"use strict";
/**
 * Amazon Bedrock client service
 *
 * This service provides a client for interacting with Amazon Bedrock models.
 * It handles authentication, request formatting, and response parsing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockClientService = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_bedrock_1 = require("@aws-sdk/client-bedrock");
const bedrock_1 = require("../../models/bedrock");
/**
 * Default configuration for the Bedrock client
 */
const DEFAULT_CONFIG = {
    region: process.env.AWS_REGION || 'us-east-1',
    maxRetries: 3,
    timeout: 30000
};
/**
 * Bedrock client service
 */
class BedrockClientService {
    /**
     * Create a new Bedrock client service
     * @param config Configuration for the Bedrock client
     */
    constructor(config = {}) {
        const fullConfig = { ...DEFAULT_CONFIG, ...config };
        // Initialize the Bedrock runtime client
        this.runtimeClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: fullConfig.region,
            credentials: fullConfig.credentials,
            maxAttempts: fullConfig.maxRetries
        });
        // Initialize the Bedrock management client
        this.managementClient = new client_bedrock_1.BedrockClient({
            region: fullConfig.region,
            credentials: fullConfig.credentials,
            maxAttempts: fullConfig.maxRetries
        });
        // Initialize model configurations with defaults
        this.modelConfigs = new Map(Object.entries(bedrock_1.DEFAULT_MODEL_CONFIGS));
    }
    /**
     * Get the available foundation models
     * @returns List of available foundation models
     */
    async listModels() {
        try {
            const command = new client_bedrock_1.ListFoundationModelsCommand({});
            const response = await this.managementClient.send(command);
            return (response.modelSummaries || [])
                .filter(model => model.modelId)
                .map(model => model.modelId);
        }
        catch (error) {
            console.error('Error listing Bedrock models:', error);
            throw this.formatError(error, 'LIST_MODELS_ERROR');
        }
    }
    /**
     * Get details about a specific foundation model
     * @param modelId The model ID
     * @returns Model details
     */
    async getModelDetails(modelId) {
        try {
            const command = new client_bedrock_1.GetFoundationModelCommand({
                modelIdentifier: modelId
            });
            const response = await this.managementClient.send(command);
            return response;
        }
        catch (error) {
            console.error(`Error getting model details for ${modelId}:`, error);
            throw this.formatError(error, 'GET_MODEL_DETAILS_ERROR');
        }
    }
    /**
     * Get the configuration for a model
     * @param modelId The model ID
     * @returns The model configuration
     */
    getModelConfig(modelId) {
        return this.modelConfigs.get(modelId) || bedrock_1.DEFAULT_MODEL_CONFIGS[modelId];
    }
    /**
     * Set the configuration for a model
     * @param modelId The model ID
     * @param config The model configuration
     */
    setModelConfig(modelId, config) {
        const currentConfig = this.modelConfigs.get(modelId) || bedrock_1.DEFAULT_MODEL_CONFIGS[modelId];
        this.modelConfigs.set(modelId, { ...currentConfig, ...config });
    }
    /**
     * Invoke a Bedrock model
     * @param options Request options
     * @returns The model response
     */
    async invokeModel(options) {
        const { modelConfig, prompt, systemPrompt, requestId } = options;
        try {
            // Format the request body based on the model type
            const requestBody = this.formatRequestBody(modelConfig.modelId, prompt, systemPrompt, modelConfig);
            // Create the command
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: modelConfig.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });
            // Send the request
            const response = await this.runtimeClient.send(command);
            // Parse the response
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            // Format the response
            return this.formatResponse(responseBody, modelConfig.modelId, requestId);
        }
        catch (error) {
            console.error('Error invoking Bedrock model:', error);
            throw this.formatError(error, 'INVOKE_MODEL_ERROR');
        }
    }
    /**
     * Invoke a Bedrock model with streaming
     * @param options Request options
     * @returns An async generator that yields response chunks
     */
    async *invokeModelWithStreaming(options) {
        const { modelConfig, prompt, systemPrompt, requestId } = options;
        try {
            // Format the request body based on the model type
            const requestBody = this.formatRequestBody(modelConfig.modelId, prompt, systemPrompt, modelConfig);
            // Create the command
            const command = new client_bedrock_runtime_1.InvokeModelWithResponseStreamCommand({
                modelId: modelConfig.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody)
            });
            // Send the request
            const response = await this.runtimeClient.send(command);
            // Process the stream
            if (!response.body) {
                throw new Error('No response stream received');
            }
            // Track the accumulated response
            let accumulatedResponse = '';
            // Process each chunk
            for await (const chunk of response.body) {
                if (chunk.chunk?.bytes) {
                    const decodedChunk = new TextDecoder().decode(chunk.chunk.bytes);
                    const chunkData = JSON.parse(decodedChunk);
                    // Extract the content based on the model
                    const content = this.extractStreamContent(chunkData, modelConfig.modelId);
                    if (content) {
                        accumulatedResponse += content;
                        yield {
                            completion: content,
                            modelId: modelConfig.modelId,
                            requestId: requestId || 'unknown'
                        };
                    }
                }
            }
            // Return the final response with usage information
            yield {
                completion: accumulatedResponse,
                modelId: modelConfig.modelId,
                requestId: requestId || 'unknown',
                finishReason: 'stop',
                usage: {
                    inputTokens: -1,
                    outputTokens: -1,
                    totalTokens: -1 // Not available in streaming
                }
            };
        }
        catch (error) {
            console.error('Error invoking Bedrock model with streaming:', error);
            throw this.formatError(error, 'INVOKE_MODEL_STREAMING_ERROR');
        }
    }
    /**
     * Format the request body based on the model type
     * @param modelId The model ID
     * @param prompt The prompt
     * @param systemPrompt The system prompt (optional)
     * @param config The model configuration
     * @returns The formatted request body
     */
    formatRequestBody(modelId, prompt, systemPrompt, config) {
        // Format for Anthropic Claude models
        if (modelId.startsWith('anthropic.claude')) {
            return {
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: config?.maxTokens || 4096,
                temperature: config?.temperature || 0.7,
                top_p: config?.topP || 0.9,
                stop_sequences: config?.stopSequences || [],
                system: systemPrompt || '',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            };
        }
        // Format for Amazon models
        if (modelId.startsWith('amazon.')) {
            return {
                inputText: prompt,
                textGenerationConfig: {
                    maxTokenCount: config?.maxTokens || 4096,
                    temperature: config?.temperature || 0.7,
                    topP: config?.topP || 0.9,
                    stopSequences: config?.stopSequences || []
                }
            };
        }
        // Default format
        return {
            prompt,
            max_tokens: config?.maxTokens || 4096,
            temperature: config?.temperature || 0.7,
            top_p: config?.topP || 0.9,
            stop_sequences: config?.stopSequences || []
        };
    }
    /**
     * Format the response based on the model type
     * @param responseBody The response body
     * @param modelId The model ID
     * @param requestId The request ID
     * @returns The formatted response
     */
    formatResponse(responseBody, modelId, requestId) {
        // Format for Anthropic Claude models
        if (modelId.startsWith('anthropic.claude')) {
            return {
                completion: responseBody.content?.[0]?.text || '',
                modelId,
                usage: {
                    inputTokens: responseBody.usage?.input_tokens || 0,
                    outputTokens: responseBody.usage?.output_tokens || 0,
                    totalTokens: (responseBody.usage?.input_tokens || 0) + (responseBody.usage?.output_tokens || 0)
                },
                requestId: requestId || 'unknown',
                finishReason: responseBody.stop_reason || 'unknown'
            };
        }
        // Format for Amazon models
        if (modelId.startsWith('amazon.')) {
            return {
                completion: responseBody.results?.[0]?.outputText || responseBody.outputText || '',
                modelId,
                usage: {
                    inputTokens: responseBody.inputTextTokenCount || 0,
                    outputTokens: responseBody.outputTextTokenCount || 0,
                    totalTokens: (responseBody.inputTextTokenCount || 0) + (responseBody.outputTextTokenCount || 0)
                },
                requestId: requestId || 'unknown',
                finishReason: responseBody.stopReason || 'unknown'
            };
        }
        // Default format
        return {
            completion: responseBody.completion || responseBody.generated_text || '',
            modelId,
            usage: {
                inputTokens: responseBody.usage?.prompt_tokens || 0,
                outputTokens: responseBody.usage?.completion_tokens || 0,
                totalTokens: responseBody.usage?.total_tokens || 0
            },
            requestId: requestId || 'unknown',
            finishReason: responseBody.finish_reason || 'unknown'
        };
    }
    /**
     * Extract content from a streaming response chunk
     * @param chunkData The chunk data
     * @param modelId The model ID
     * @returns The extracted content
     */
    extractStreamContent(chunkData, modelId) {
        // Extract for Anthropic Claude models
        if (modelId.startsWith('anthropic.claude')) {
            return chunkData.delta?.text || '';
        }
        // Extract for Amazon models
        if (modelId.startsWith('amazon.')) {
            return chunkData.outputText || '';
        }
        // Default extraction
        return chunkData.completion || chunkData.generated_text || '';
    }
    /**
     * Format an error
     * @param error The error
     * @param code The error code
     * @returns The formatted error
     */
    formatError(error, code) {
        return {
            code,
            message: error.message || 'Unknown error',
            requestId: error.$metadata?.requestId,
            statusCode: error.$metadata?.httpStatusCode,
            timestamp: new Date()
        };
    }
}
exports.BedrockClientService = BedrockClientService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvYmVkcm9jay1jbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFFSCw0RUFJeUM7QUFFekMsNERBSWlDO0FBRWpDLGtEQU84QjtBQWdCOUI7O0dBRUc7QUFDSCxNQUFNLGNBQWMsR0FBd0I7SUFDMUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVc7SUFDN0MsVUFBVSxFQUFFLENBQUM7SUFDYixPQUFPLEVBQUUsS0FBSztDQUNmLENBQUM7QUFFRjs7R0FFRztBQUNILE1BQWEsb0JBQW9CO0lBSy9COzs7T0FHRztJQUNILFlBQVksU0FBdUMsRUFBRTtRQUNuRCxNQUFNLFVBQVUsR0FBRyxFQUFFLEdBQUcsY0FBYyxFQUFFLEdBQUcsTUFBTSxFQUFFLENBQUM7UUFFcEQsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSw2Q0FBb0IsQ0FBQztZQUM1QyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07WUFDekIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXO1lBQ25DLFdBQVcsRUFBRSxVQUFVLENBQUMsVUFBVTtTQUNuQyxDQUFDLENBQUM7UUFFSCwyQ0FBMkM7UUFDM0MsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksOEJBQWEsQ0FBQztZQUN4QyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07WUFDekIsV0FBVyxFQUFFLFVBQVUsQ0FBQyxXQUFXO1lBQ25DLFdBQVcsRUFBRSxVQUFVLENBQUMsVUFBVTtTQUNuQyxDQUFDLENBQUM7UUFFSCxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FDekIsTUFBTSxDQUFDLE9BQU8sQ0FBQywrQkFBcUIsQ0FBQyxDQUN0QyxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7T0FHRztJ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QUNuQztRQUVELHFCQUFxQjtRQUNyQixPQUFPLFNBQVMsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7SUFDaEUsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssV0FBVyxDQUFDLEtBQVUsRUFBRSxJQUFZO1FBQzFDLE9BQU87WUFDTCxJQUFJO1lBQ0osT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksZUFBZTtZQUN6QyxTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVMsRUFBRSxTQUFTO1lBQ3JDLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLGNBQWM7WUFDM0MsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1NBQ3RCLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUEvVUQsb0RBK1VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBbWF6b24gQmVkcm9jayBjbGllbnQgc2VydmljZVxuICogXG4gKiBUaGlzIHNlcnZpY2UgcHJvdmlkZXMgYSBjbGllbnQgZm9yIGludGVyYWN0aW5nIHdpdGggQW1hem9uIEJlZHJvY2sgbW9kZWxzLlxuICogSXQgaGFuZGxlcyBhdXRoZW50aWNhdGlvbiwgcmVxdWVzdCBmb3JtYXR0aW5nLCBhbmQgcmVzcG9uc2UgcGFyc2luZy5cbiAqL1xuXG5pbXBvcnQge1xuICBCZWRyb2NrUnVudGltZUNsaWVudCxcbiAgSW52b2tlTW9kZWxDb21tYW5kLFxuICBJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbUNvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWJlZHJvY2stcnVudGltZSc7XG5cbmltcG9ydCB7XG4gIEJlZHJvY2tDbGllbnQsXG4gIEdldEZvdW5kYXRpb25Nb2RlbENvbW1hbmQsXG4gIExpc3RGb3VuZGF0aW9uTW9kZWxzQ29tbWFuZFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtYmVkcm9jayc7XG5cbmltcG9ydCB7XG4gIEJlZHJvY2tNb2RlbElkLFxuICBCZWRyb2NrTW9kZWxDb25maWcsXG4gIEJlZHJvY2tSZXF1ZXN0T3B0aW9ucyxcbiAgQmVkcm9ja1Jlc3BvbnNlLFxuICBCZWRyb2NrRXJyb3IsXG4gIERFRkFVTFRfTU9ERUxfQ09ORklHU1xufSBmcm9tICcuLi8uLi9tb2RlbHMvYmVkcm9jayc7XG5cbi8qKlxuICogQ29uZmlndXJhdGlvbiBmb3IgdGhlIEJlZHJvY2sgY2xpZW50XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQmVkcm9ja0NsaWVudENvbmZpZyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBjcmVkZW50aWFscz86IHtcbiAgICBhY2Nlc3NLZXlJZDogc3RyaW5nO1xuICAgIHNlY3JldEFjY2Vzc0tleTogc3RyaW5nO1xuICAgIHNlc3Npb25Ub2tlbj86IHN0cmluZztcbiAgfTtcbiAgbWF4UmV0cmllcz86IG51bWJlcjtcbiAgdGltZW91dD86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBCZWRyb2NrIGNsaWVudFxuICovXG5jb25zdCBERUZBVUxUX0NPTkZJRzogQmVkcm9ja0NsaWVudENvbmZpZyA9IHtcbiAgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICBtYXhSZXRyaWVzOiAzLFxuICB0aW1lb3V0OiAzMDAwMFxufTtcblxuLyoqXG4gKiBCZWRyb2NrIGNsaWVudCBzZXJ2aWNlXG4gKi9cbmV4cG9ydCBjbGFzcyBCZWRyb2NrQ2xpZW50U2VydmljZSB7XG4gIHByaXZhdGUgcnVudGltZUNsaWVudDogQmVkcm9ja1J1bnRpbWVDbGllbnQ7XG4gIHByaXZhdGUgbWFuYWdlbWVudENsaWVudDogQmVkcm9ja0NsaWVudDtcbiAgcHJpdmF0ZSBtb2RlbENvbmZpZ3M6IE1hcDxzdHJpbmcsIEJlZHJvY2tNb2RlbENvbmZpZz47XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBCZWRyb2NrIGNsaWVudCBzZXJ2aWNlXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIEJlZHJvY2sgY2xpZW50XG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IFBhcnRpYWw8QmVkcm9ja0NsaWVudENvbmZpZz4gPSB7fSkge1xuICAgIGNvbnN0IGZ1bGxDb25maWcgPSB7IC4uLkRFRkFVTFRfQ09ORklHLCAuLi5jb25maWcgfTtcbiAgICBcbiAgICAvLyBJbml0aWFsaXplIHRoZSBCZWRyb2NrIHJ1bnRpbWUgY2xpZW50XG4gICAgdGhpcy5ydW50aW1lQ2xpZW50ID0gbmV3IEJlZHJvY2tSdW50aW1lQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogZnVsbENvbmZpZy5yZWdpb24sXG4gICAgICBjcmVkZW50aWFsczogZnVsbENvbmZpZy5jcmVkZW50aWFscyxcbiAgICAgIG1heEF0dGVtcHRzOiBmdWxsQ29uZmlnLm1heFJldHJpZXNcbiAgICB9KTtcbiAgICBcbiAgICAvLyBJbml0aWFsaXplIHRoZSBCZWRyb2NrIG1hbmFnZW1lbnQgY2xpZW50XG4gICAgdGhpcy5tYW5hZ2VtZW50Q2xpZW50ID0gbmV3IEJlZHJvY2tDbGllbnQoe1xuICAgICAgcmVnaW9uOiBmdWxsQ29uZmlnLnJlZ2lvbixcbiAgICAgIGNyZWRlbnRpYWxzOiBmdWxsQ29uZmlnLmNyZWRlbnRpYWxzLFxuICAgICAgbWF4QXR0ZW1wdHM6IGZ1bGxDb25maWcubWF4UmV0cmllc1xuICAgIH0pO1xuICAgIFxuICAgIC8vIEluaXRpYWxpemUgbW9kZWwgY29uZmlndXJhdGlvbnMgd2l0aCBkZWZhdWx0c1xuICAgIHRoaXMubW9kZWxDb25maWdzID0gbmV3IE1hcChcbiAgICAgIE9iamVjdC5lbnRyaWVzKERFRkFVTFRfTU9ERUxfQ09ORklHUylcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYXZhaWxhYmxlIGZvdW5kYXRpb24gbW9kZWxzXG4gICAqIEByZXR1cm5zIExpc3Qgb2YgYXZhaWxhYmxlIGZvdW5kYXRpb24gbW9kZWxzXG4gICAqL1xuICBhc3luYyBsaXN0TW9kZWxzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBMaXN0Rm91bmRhdGlvbk1vZGVsc0NvbW1hbmQoe30pO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnRDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIChyZXNwb25zZS5tb2RlbFN1bW1hcmllcyB8fCBbXSlcbiAgICAgICAgLmZpbHRlcihtb2RlbCA9PiBtb2RlbC5tb2RlbElkKVxuICAgICAgICAubWFwKG1vZGVsID0+IG1vZGVsLm1vZGVsSWQgYXMgc3RyaW5nKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbGlzdGluZyBCZWRyb2NrIG1vZGVsczonLCBlcnJvcik7XG4gICAgICB0aHJvdyB0aGlzLmZvcm1hdEVycm9yKGVycm9yLCAnTElTVF9NT0RFTFNfRVJST1InKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGRldGFpbHMgYWJvdXQgYSBzcGVjaWZpYyBmb3VuZGF0aW9uIG1vZGVsXG4gICAqIEBwYXJhbSBtb2RlbElkIFRoZSBtb2RlbCBJRFxuICAgKiBAcmV0dXJucyBNb2RlbCBkZXRhaWxzXG4gICAqL1xuICBhc3luYyBnZXRNb2RlbERldGFpbHMobW9kZWxJZDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBHZXRGb3VuZGF0aW9uTW9kZWxDb21tYW5kKHtcbiAgICAgICAgbW9kZWxJZGVudGlmaWVyOiBtb2RlbElkXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm1hbmFnZW1lbnRDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZ2V0dGluZyBtb2RlbCBkZXRhaWxzIGZvciAke21vZGVsSWR9OmAsIGVycm9yKTtcbiAgICAgIHRocm93IHRoaXMuZm9ybWF0RXJyb3IoZXJyb3IsICdHRVRfTU9ERUxfREVUQUlMU19FUlJPUicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIGEgbW9kZWxcbiAgICogQHBhcmFtIG1vZGVsSWQgVGhlIG1vZGVsIElEXG4gICAqIEByZXR1cm5zIFRoZSBtb2RlbCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBnZXRNb2RlbENvbmZpZyhtb2RlbElkOiBCZWRyb2NrTW9kZWxJZCk6IEJlZHJvY2tNb2RlbENvbmZpZyB7XG4gICAgcmV0dXJuIHRoaXMubW9kZWxDb25maWdzLmdldChtb2RlbElkKSB8fCBERUZBVUxUX01PREVMX0NPTkZJR1NbbW9kZWxJZF07XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb25maWd1cmF0aW9uIGZvciBhIG1vZGVsXG4gICAqIEBwYXJhbSBtb2RlbElkIFRoZSBtb2RlbCBJRFxuICAgKiBAcGFyYW0gY29uZmlnIFRoZSBtb2RlbCBjb25maWd1cmF0aW9uXG4gICAqL1xuICBzZXRNb2RlbENvbmZpZyhtb2RlbElkOiBzdHJpbmcsIGNvbmZpZzogUGFydGlhbDxCZWRyb2NrTW9kZWxDb25maWc+KTogdm9pZCB7XG4gICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRoaXMubW9kZWxDb25maWdzLmdldChtb2RlbElkKSB8fCBERUZBVUxUX01PREVMX0NPTkZJR1NbbW9kZWxJZCBhcyBCZWRyb2NrTW9kZWxJZF07XG4gICAgdGhpcy5tb2RlbENvbmZpZ3Muc2V0KG1vZGVsSWQsIHsgLi4uY3VycmVudENvbmZpZywgLi4uY29uZmlnIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSBhIEJlZHJvY2sgbW9kZWxcbiAgICogQHBhcmFtIG9wdGlvbnMgUmVxdWVzdCBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSBtb2RlbCByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgaW52b2tlTW9kZWwob3B0aW9uczogQmVkcm9ja1JlcXVlc3RPcHRpb25zKTogUHJvbWlzZTxCZWRyb2NrUmVzcG9uc2U+IHtcbiAgICBjb25zdCB7IG1vZGVsQ29uZmlnLCBwcm9tcHQsIHN5c3RlbVByb21wdCwgcmVxdWVzdElkIH0gPSBvcHRpb25zO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAvLyBGb3JtYXQgdGhlIHJlcXVlc3QgYm9keSBiYXNlZCBvbiB0aGUgbW9kZWwgdHlwZVxuICAgICAgY29uc3QgcmVxdWVzdEJvZHkgPSB0aGlzLmZvcm1hdFJlcXVlc3RCb2R5KG1vZGVsQ29uZmlnLm1vZGVsSWQsIHByb21wdCwgc3lzdGVtUHJvbXB0LCBtb2RlbENvbmZpZyk7XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSB0aGUgY29tbWFuZFxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBJbnZva2VNb2RlbENvbW1hbmQoe1xuICAgICAgICBtb2RlbElkOiBtb2RlbENvbmZpZy5tb2RlbElkLFxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICBhY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdEJvZHkpXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gU2VuZCB0aGUgcmVxdWVzdFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnJ1bnRpbWVDbGllbnQuc2VuZChjb21tYW5kKTtcbiAgICAgIFxuICAgICAgLy8gUGFyc2UgdGhlIHJlc3BvbnNlXG4gICAgICBjb25zdCByZXNwb25zZUJvZHkgPSBKU09OLnBhcnNlKG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShyZXNwb25zZS5ib2R5KSk7XG4gICAgICBcbiAgICAgIC8vIEZvcm1hdCB0aGUgcmVzcG9uc2VcbiAgICAgIHJldHVybiB0aGlzLmZvcm1hdFJlc3BvbnNlKHJlc3BvbnNlQm9keSwgbW9kZWxDb25maWcubW9kZWxJZCwgcmVxdWVzdElkKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW52b2tpbmcgQmVkcm9jayBtb2RlbDonLCBlcnJvcik7XG4gICAgICB0aHJvdyB0aGlzLmZvcm1hdEVycm9yKGVycm9yLCAnSU5WT0tFX01PREVMX0VSUk9SJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSBhIEJlZHJvY2sgbW9kZWwgd2l0aCBzdHJlYW1pbmdcbiAgICogQHBhcmFtIG9wdGlvbnMgUmVxdWVzdCBvcHRpb25zXG4gICAqIEByZXR1cm5zIEFuIGFzeW5jIGdlbmVyYXRvciB0aGF0IHlpZWxkcyByZXNwb25zZSBjaHVua3NcbiAgICovXG4gIGFzeW5jICppbnZva2VNb2RlbFdpdGhTdHJlYW1pbmcob3B0aW9uczogQmVkcm9ja1JlcXVlc3RPcHRpb25zKTogQXN5bmNHZW5lcmF0b3I8UGFydGlhbDxCZWRyb2NrUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgeyBtb2RlbENvbmZpZywgcHJvbXB0LCBzeXN0ZW1Qcm9tcHQsIHJlcXVlc3RJZCB9ID0gb3B0aW9ucztcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gRm9ybWF0IHRoZSByZXF1ZXN0IGJvZHkgYmFzZWQgb24gdGhlIG1vZGVsIHR5cGVcbiAgICAgIGNvbnN0IHJlcXVlc3RCb2R5ID0gdGhpcy5mb3JtYXRSZXF1ZXN0Qm9keShtb2RlbENvbmZpZy5tb2RlbElkLCBwcm9tcHQsIHN5c3RlbVByb21wdCwgbW9kZWxDb25maWcpO1xuICAgICAgXG4gICAgICAvLyBDcmVhdGUgdGhlIGNvbW1hbmRcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgSW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW1Db21tYW5kKHtcbiAgICAgICAgbW9kZWxJZDogbW9kZWxDb25maWcubW9kZWxJZCxcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgYWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlcXVlc3RCb2R5KVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIFNlbmQgdGhlIHJlcXVlc3RcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5ydW50aW1lQ2xpZW50LnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIC8vIFByb2Nlc3MgdGhlIHN0cmVhbVxuICAgICAgaWYgKCFyZXNwb25zZS5ib2R5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzcG9uc2Ugc3RyZWFtIHJlY2VpdmVkJyk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIFRyYWNrIHRoZSBhY2N1bXVsYXRlZCByZXNwb25zZVxuICAgICAgbGV0IGFjY3VtdWxhdGVkUmVzcG9uc2UgPSAnJztcbiAgICAgIFxuICAgICAgLy8gUHJvY2VzcyBlYWNoIGNodW5rXG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIHJlc3BvbnNlLmJvZHkpIHtcbiAgICAgICAgaWYgKGNodW5rLmNodW5rPy5ieXRlcykge1xuICAgICAgICAgIGNvbnN0IGRlY29kZWRDaHVuayA9IG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShjaHVuay5jaHVuay5ieXRlcyk7XG4gICAgICAgICAgY29uc3QgY2h1bmtEYXRhID0gSlNPTi5wYXJzZShkZWNvZGVkQ2h1bmspO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEV4dHJhY3QgdGhlIGNvbnRlbnQgYmFzZWQgb24gdGhlIG1vZGVsXG4gICAgICAgICAgY29uc3QgY29udGVudCA9IHRoaXMuZXh0cmFjdFN0cmVhbUNvbnRlbnQoY2h1bmtEYXRhLCBtb2RlbENvbmZpZy5tb2RlbElkKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoY29udGVudCkge1xuICAgICAgICAgICAgYWNjdW11bGF0ZWRSZXNwb25zZSArPSBjb250ZW50O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB5aWVsZCB7XG4gICAgICAgICAgICAgIGNvbXBsZXRpb246IGNvbnRlbnQsXG4gICAgICAgICAgICAgIG1vZGVsSWQ6IG1vZGVsQ29uZmlnLm1vZGVsSWQsXG4gICAgICAgICAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkIHx8ICd1bmtub3duJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUmV0dXJuIHRoZSBmaW5hbCByZXNwb25zZSB3aXRoIHVzYWdlIGluZm9ybWF0aW9uXG4gICAgICB5aWVsZCB7XG4gICAgICAgIGNvbXBsZXRpb246IGFjY3VtdWxhdGVkUmVzcG9uc2UsXG4gICAgICAgIG1vZGVsSWQ6IG1vZGVsQ29uZmlnLm1vZGVsSWQsXG4gICAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkIHx8ICd1bmtub3duJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCcsXG4gICAgICAgIHVzYWdlOiB7XG4gICAgICAgICAgaW5wdXRUb2tlbnM6IC0xLCAvLyBOb3QgYXZhaWxhYmxlIGluIHN0cmVhbWluZ1xuICAgICAgICAgIG91dHB1dFRva2VuczogLTEsIC8vIE5vdCBhdmFpbGFibGUgaW4gc3RyZWFtaW5nXG4gICAgICAgICAgdG90YWxUb2tlbnM6IC0xIC8vIE5vdCBhdmFpbGFibGUgaW4gc3RyZWFtaW5nXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGludm9raW5nIEJlZHJvY2sgbW9kZWwgd2l0aCBzdHJlYW1pbmc6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgdGhpcy5mb3JtYXRFcnJvcihlcnJvciwgJ0lOVk9LRV9NT0RFTF9TVFJFQU1JTkdfRVJST1InKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IHRoZSByZXF1ZXN0IGJvZHkgYmFzZWQgb24gdGhlIG1vZGVsIHR5cGVcbiAgICogQHBhcmFtIG1vZGVsSWQgVGhlIG1vZGVsIElEXG4gICAqIEBwYXJhbSBwcm9tcHQgVGhlIHByb21wdFxuICAgKiBAcGFyYW0gc3lzdGVtUHJvbXB0IFRoZSBzeXN0ZW0gcHJvbXB0IChvcHRpb25hbClcbiAgICogQHBhcmFtIGNvbmZpZyBUaGUgbW9kZWwgY29uZmlndXJhdGlvblxuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIHJlcXVlc3QgYm9keVxuICAgKi9cbiAgcHJpdmF0ZSBmb3JtYXRSZXF1ZXN0Qm9keShcbiAgICBtb2RlbElkOiBzdHJpbmcsXG4gICAgcHJvbXB0OiBzdHJpbmcsXG4gICAgc3lzdGVtUHJvbXB0Pzogc3RyaW5nLFxuICAgIGNvbmZpZz86IEJlZHJvY2tNb2RlbENvbmZpZ1xuICApOiBhbnkge1xuICAgIC8vIEZvcm1hdCBmb3IgQW50aHJvcGljIENsYXVkZSBtb2RlbHNcbiAgICBpZiAobW9kZWxJZC5zdGFydHNXaXRoKCdhbnRocm9waWMuY2xhdWRlJykpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGFudGhyb3BpY192ZXJzaW9uOiAnYmVkcm9jay0yMDIzLTA1LTMxJyxcbiAgICAgICAgbWF4X3Rva2VuczogY29uZmlnPy5tYXhUb2tlbnMgfHwgNDA5NixcbiAgICAgICAgdGVtcGVyYXR1cmU6IGNvbmZpZz8udGVtcGVyYXR1cmUgfHwgMC43LFxuICAgICAgICB0b3BfcDogY29uZmlnPy50b3BQIHx8IDAuOSxcbiAgICAgICAgc3RvcF9zZXF1ZW5jZXM6IGNvbmZpZz8uc3RvcFNlcXVlbmNlcyB8fCBbXSxcbiAgICAgICAgc3lzdGVtOiBzeXN0ZW1Qcm9tcHQgfHwgJycsXG4gICAgICAgIG1lc3NhZ2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgY29udGVudDogcHJvbXB0XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvLyBGb3JtYXQgZm9yIEFtYXpvbiBtb2RlbHNcbiAgICBpZiAobW9kZWxJZC5zdGFydHNXaXRoKCdhbWF6b24uJykpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlucHV0VGV4dDogcHJvbXB0LFxuICAgICAgICB0ZXh0R2VuZXJhdGlvbkNvbmZpZzoge1xuICAgICAgICAgIG1heFRva2VuQ291bnQ6IGNvbmZpZz8ubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IGNvbmZpZz8udGVtcGVyYXR1cmUgfHwgMC43LFxuICAgICAgICAgIHRvcFA6IGNvbmZpZz8udG9wUCB8fCAwLjksXG4gICAgICAgICAgc3RvcFNlcXVlbmNlczogY29uZmlnPy5zdG9wU2VxdWVuY2VzIHx8IFtdXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8vIERlZmF1bHQgZm9ybWF0XG4gICAgcmV0dXJuIHtcbiAgICAgIHByb21wdCxcbiAgICAgIG1heF90b2tlbnM6IGNvbmZpZz8ubWF4VG9rZW5zIHx8IDQwOTYsXG4gICAgICB0ZW1wZXJhdHVyZTogY29uZmlnPy50ZW1wZXJhdHVyZSB8fCAwLjcsXG4gICAgICB0b3BfcDogY29uZmlnPy50b3BQIHx8IDAuOSxcbiAgICAgIHN0b3Bfc2VxdWVuY2VzOiBjb25maWc/LnN0b3BTZXF1ZW5jZXMgfHwgW11cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1hdCB0aGUgcmVzcG9uc2UgYmFzZWQgb24gdGhlIG1vZGVsIHR5cGVcbiAgICogQHBhcmFtIHJlc3BvbnNlQm9keSBUaGUgcmVzcG9uc2UgYm9keVxuICAgKiBAcGFyYW0gbW9kZWxJZCBUaGUgbW9kZWwgSURcbiAgICogQHBhcmFtIHJlcXVlc3RJZCBUaGUgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIHJlc3BvbnNlXG4gICAqL1xuICBwcml2YXRlIGZvcm1hdFJlc3BvbnNlKHJlc3BvbnNlQm9keTogYW55LCBtb2RlbElkOiBzdHJpbmcsIHJlcXVlc3RJZD86IHN0cmluZyk6IEJlZHJvY2tSZXNwb25zZSB7XG4gICAgLy8gRm9ybWF0IGZvciBBbnRocm9waWMgQ2xhdWRlIG1vZGVsc1xuICAgIGlmIChtb2RlbElkLnN0YXJ0c1dpdGgoJ2FudGhyb3BpYy5jbGF1ZGUnKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGxldGlvbjogcmVzcG9uc2VCb2R5LmNvbnRlbnQ/LlswXT8udGV4dCB8fCAnJyxcbiAgICAgICAgbW9kZWxJZCxcbiAgICAgICAgdXNhZ2U6IHtcbiAgICAgICAgICBpbnB1dFRva2VuczogcmVzcG9uc2VCb2R5LnVzYWdlPy5pbnB1dF90b2tlbnMgfHwgMCxcbiAgICAgICAgICBvdXRwdXRUb2tlbnM6IHJlc3BvbnNlQm9keS51c2FnZT8ub3V0cHV0X3Rva2VucyB8fCAwLFxuICAgICAgICAgIHRvdGFsVG9rZW5zOiAocmVzcG9uc2VCb2R5LnVzYWdlPy5pbnB1dF90b2tlbnMgfHwgMCkgKyAocmVzcG9uc2VCb2R5LnVzYWdlPy5vdXRwdXRfdG9rZW5zIHx8IDApXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkIHx8ICd1bmtub3duJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiByZXNwb25zZUJvZHkuc3RvcF9yZWFzb24gfHwgJ3Vua25vd24nXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvLyBGb3JtYXQgZm9yIEFtYXpvbiBtb2RlbHNcbiAgICBpZiAobW9kZWxJZC5zdGFydHNXaXRoKCdhbWF6b24uJykpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBsZXRpb246IHJlc3BvbnNlQm9keS5yZXN1bHRzPy5bMF0/Lm91dHB1dFRleHQgfHwgcmVzcG9uc2VCb2R5Lm91dHB1dFRleHQgfHwgJycsXG4gICAgICAgIG1vZGVsSWQsXG4gICAgICAgIHVzYWdlOiB7XG4gICAgICAgICAgaW5wdXRUb2tlbnM6IHJlc3BvbnNlQm9keS5pbnB1dFRleHRUb2tlbkNvdW50IHx8IDAsXG4gICAgICAgICAgb3V0cHV0VG9rZW5zOiByZXNwb25zZUJvZHkub3V0cHV0VGV4dFRva2VuQ291bnQgfHwgMCxcbiAgICAgICAgICB0b3RhbFRva2VuczogKHJlc3BvbnNlQm9keS5pbnB1dFRleHRUb2tlbkNvdW50IHx8IDApICsgKHJlc3BvbnNlQm9keS5vdXRwdXRUZXh0VG9rZW5Db3VudCB8fCAwKVxuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCB8fCAndW5rbm93bicsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogcmVzcG9uc2VCb2R5LnN0b3BSZWFzb24gfHwgJ3Vua25vd24nXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvLyBEZWZhdWx0IGZvcm1hdFxuICAgIHJldHVybiB7XG4gICAgICBjb21wbGV0aW9uOiByZXNwb25zZUJvZHkuY29tcGxldGlvbiB8fCByZXNwb25zZUJvZHkuZ2VuZXJhdGVkX3RleHQgfHwgJycsXG4gICAgICBtb2RlbElkLFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgaW5wdXRUb2tlbnM6IHJlc3BvbnNlQm9keS51c2FnZT8ucHJvbXB0X3Rva2VucyB8fCAwLFxuICAgICAgICBvdXRwdXRUb2tlbnM6IHJlc3BvbnNlQm9keS51c2FnZT8uY29tcGxldGlvbl90b2tlbnMgfHwgMCxcbiAgICAgICAgdG90YWxUb2tlbnM6IHJlc3BvbnNlQm9keS51c2FnZT8udG90YWxfdG9rZW5zIHx8IDBcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCB8fCAndW5rbm93bicsXG4gICAgICBmaW5pc2hSZWFzb246IHJlc3BvbnNlQm9keS5maW5pc2hfcmVhc29uIHx8ICd1bmtub3duJ1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdCBjb250ZW50IGZyb20gYSBzdHJlYW1pbmcgcmVzcG9uc2UgY2h1bmtcbiAgICogQHBhcmFtIGNodW5rRGF0YSBUaGUgY2h1bmsgZGF0YVxuICAgKiBAcGFyYW0gbW9kZWxJZCBUaGUgbW9kZWwgSURcbiAgICogQHJldHVybnMgVGhlIGV4dHJhY3RlZCBjb250ZW50XG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RTdHJlYW1Db250ZW50KGNodW5rRGF0YTogYW55LCBtb2RlbElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIEV4dHJhY3QgZm9yIEFudGhyb3BpYyBDbGF1ZGUgbW9kZWxzXG4gICAgaWYgKG1vZGVsSWQuc3RhcnRzV2l0aCgnYW50aHJvcGljLmNsYXVkZScpKSB7XG4gICAgICByZXR1cm4gY2h1bmtEYXRhLmRlbHRhPy50ZXh0IHx8ICcnO1xuICAgIH1cbiAgICBcbiAgICAvLyBFeHRyYWN0IGZvciBBbWF6b24gbW9kZWxzXG4gICAgaWYgKG1vZGVsSWQuc3RhcnRzV2l0aCgnYW1hem9uLicpKSB7XG4gICAgICByZXR1cm4gY2h1bmtEYXRhLm91dHB1dFRleHQgfHwgJyc7XG4gICAgfVxuICAgIFxuICAgIC8vIERlZmF1bHQgZXh0cmFjdGlvblxuICAgIHJldHVybiBjaHVua0RhdGEuY29tcGxldGlvbiB8fCBjaHVua0RhdGEuZ2VuZXJhdGVkX3RleHQgfHwgJyc7XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IGFuIGVycm9yXG4gICAqIEBwYXJhbSBlcnJvciBUaGUgZXJyb3JcbiAgICogQHBhcmFtIGNvZGUgVGhlIGVycm9yIGNvZGVcbiAgICogQHJldHVybnMgVGhlIGZvcm1hdHRlZCBlcnJvclxuICAgKi9cbiAgcHJpdmF0ZSBmb3JtYXRFcnJvcihlcnJvcjogYW55LCBjb2RlOiBzdHJpbmcpOiBCZWRyb2NrRXJyb3Ige1xuICAgIHJldHVybiB7XG4gICAgICBjb2RlLFxuICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcicsXG4gICAgICByZXF1ZXN0SWQ6IGVycm9yLiRtZXRhZGF0YT8ucmVxdWVzdElkLFxuICAgICAgc3RhdHVzQ29kZTogZXJyb3IuJG1ldGFkYXRhPy5odHRwU3RhdHVzQ29kZSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgIH07XG4gIH1cbn0iXX0=