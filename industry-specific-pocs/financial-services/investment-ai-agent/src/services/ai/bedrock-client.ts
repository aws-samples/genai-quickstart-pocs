/**
 * Amazon Bedrock client service
 * 
 * This service provides a client for interacting with Amazon Bedrock models.
 * It handles authentication, request formatting, and response parsing.
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand
} from '@aws-sdk/client-bedrock-runtime';

import {
  BedrockClient,
  GetFoundationModelCommand,
  ListFoundationModelsCommand
} from '@aws-sdk/client-bedrock';

import {
  BedrockModelId,
  BedrockModelConfig,
  BedrockRequestOptions,
  BedrockResponse,
  BedrockError,
  DEFAULT_MODEL_CONFIGS
} from '../../models/bedrock';

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
 * Default configuration for the Bedrock client
 */
const DEFAULT_CONFIG: BedrockClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  maxRetries: 3,
  timeout: 30000
};

/**
 * Bedrock client service
 */
export class BedrockClientService {
  private runtimeClient: BedrockRuntimeClient;
  private managementClient: BedrockClient;
  private modelConfigs: Map<string, BedrockModelConfig>;

  /**
   * Create a new Bedrock client service
   * @param config Configuration for the Bedrock client
   */
  constructor(config: Partial<BedrockClientConfig> = {}) {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize the Bedrock runtime client
    this.runtimeClient = new BedrockRuntimeClient({
      region: fullConfig.region,
      credentials: fullConfig.credentials,
      maxAttempts: fullConfig.maxRetries
    });
    
    // Initialize the Bedrock management client
    this.managementClient = new BedrockClient({
      region: fullConfig.region,
      credentials: fullConfig.credentials,
      maxAttempts: fullConfig.maxRetries
    });
    
    // Initialize model configurations with defaults
    this.modelConfigs = new Map(
      Object.entries(DEFAULT_MODEL_CONFIGS)
    );
  }

  /**
   * Get the available foundation models
   * @returns List of available foundation models
   */
  async listModels(): Promise<string[]> {
    try {
      const command = new ListFoundationModelsCommand({});
      const response = await this.managementClient.send(command);
      
      return (response.modelSummaries || [])
        .filter(model => model.modelId)
        .map(model => model.modelId as string);
    } catch (error) {
      console.error('Error listing Bedrock models:', error);
      throw this.formatError(error, 'LIST_MODELS_ERROR');
    }
  }

  /**
   * Get details about a specific foundation model
   * @param modelId The model ID
   * @returns Model details
   */
  async getModelDetails(modelId: string): Promise<any> {
    try {
      const command = new GetFoundationModelCommand({
        modelIdentifier: modelId
      });
      
      const response = await this.managementClient.send(command);
      return response;
    } catch (error) {
      console.error(`Error getting model details for ${modelId}:`, error);
      throw this.formatError(error, 'GET_MODEL_DETAILS_ERROR');
    }
  }

  /**
   * Get the configuration for a model
   * @param modelId The model ID
   * @returns The model configuration
   */
  getModelConfig(modelId: BedrockModelId): BedrockModelConfig {
    return this.modelConfigs.get(modelId) || DEFAULT_MODEL_CONFIGS[modelId];
  }

  /**
   * Set the configuration for a model
   * @param modelId The model ID
   * @param config The model configuration
   */
  setModelConfig(modelId: string, config: Partial<BedrockModelConfig>): void {
    const currentConfig = this.modelConfigs.get(modelId) || DEFAULT_MODEL_CONFIGS[modelId as BedrockModelId];
    this.modelConfigs.set(modelId, { ...currentConfig, ...config });
  }

  /**
   * Invoke a Bedrock model
   * @param options Request options
   * @returns The model response
   */
  async invokeModel(options: BedrockRequestOptions): Promise<BedrockResponse> {
    const { modelConfig, prompt, systemPrompt, requestId } = options;
    
    try {
      // Format the request body based on the model type
      const requestBody = this.formatRequestBody(modelConfig.modelId, prompt, systemPrompt, modelConfig);
      
      // Create the command
      const command = new InvokeModelCommand({
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
    } catch (error) {
      console.error('Error invoking Bedrock model:', error);
      throw this.formatError(error, 'INVOKE_MODEL_ERROR');
    }
  }

  /**
   * Invoke a Bedrock model with streaming
   * @param options Request options
   * @returns An async generator that yields response chunks
   */
  async *invokeModelWithStreaming(options: BedrockRequestOptions): AsyncGenerator<Partial<BedrockResponse>> {
    const { modelConfig, prompt, systemPrompt, requestId } = options;
    
    try {
      // Format the request body based on the model type
      const requestBody = this.formatRequestBody(modelConfig.modelId, prompt, systemPrompt, modelConfig);
      
      // Create the command
      const command = new InvokeModelWithResponseStreamCommand({
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
          inputTokens: -1, // Not available in streaming
          outputTokens: -1, // Not available in streaming
          totalTokens: -1 // Not available in streaming
        }
      };
    } catch (error) {
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
  private formatRequestBody(
    modelId: string,
    prompt: string,
    systemPrompt?: string,
    config?: BedrockModelConfig
  ): any {
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
  private formatResponse(responseBody: any, modelId: string, requestId?: string): BedrockResponse {
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
  private extractStreamContent(chunkData: any, modelId: string): string {
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
  private formatError(error: any, code: string): BedrockError {
    return {
      code,
      message: error.message || 'Unknown error',
      requestId: error.$metadata?.requestId,
      statusCode: error.$metadata?.httpStatusCode,
      timestamp: new Date()
    };
  }
}