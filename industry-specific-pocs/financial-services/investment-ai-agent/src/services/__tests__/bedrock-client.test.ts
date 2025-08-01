/**
 * Tests for the Bedrock client service
 */

import { BedrockClientService } from '../ai/bedrock-client';
import { BedrockModelId } from '../../models/bedrock';

// Mock the AWS SDK clients
jest.mock('@aws-sdk/client-bedrock-runtime', () => {
  const mockSend = jest.fn().mockImplementation((command) => {
    if (command.constructor.name === 'InvokeModelCommand') {
      return Promise.resolve({
        body: Buffer.from(JSON.stringify({
          content: [{ text: 'This is a test response' }],
          usage: {
            input_tokens: 10,
            output_tokens: 5
          },
          stop_reason: 'stop'
        }))
      });
    } else if (command.constructor.name === 'InvokeModelWithResponseStreamCommand') {
      return Promise.resolve({
        body: {
          [Symbol.asyncIterator]: async function* () {
            yield {
              chunk: {
                bytes: Buffer.from(JSON.stringify({
                  delta: { text: 'This ' }
                }))
              }
            };
            yield {
              chunk: {
                bytes: Buffer.from(JSON.stringify({
                  delta: { text: 'is ' }
                }))
              }
            };
            yield {
              chunk: {
                bytes: Buffer.from(JSON.stringify({
                  delta: { text: 'a ' }
                }))
              }
            };
            yield {
              chunk: {
                bytes: Buffer.from(JSON.stringify({
                  delta: { text: 'test' }
                }))
              }
            };
          }
        }
      });
    }
    return Promise.reject(new Error('Unknown command'));
  });

  return {
    BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    InvokeModelCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'InvokeModelCommand' },
      input: params
    })),
    InvokeModelWithResponseStreamCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'InvokeModelWithResponseStreamCommand' },
      input: params
    }))
  };
});

jest.mock('@aws-sdk/client-bedrock', () => {
  const mockSend = jest.fn().mockImplementation((command) => {
    if (command.constructor.name === 'ListFoundationModelsCommand') {
      return Promise.resolve({
        modelSummaries: [
          { modelId: 'anthropic.claude-3-sonnet-20240229-v1:0' },
          { modelId: 'anthropic.claude-3-haiku-20240307-v1:0' },
          { modelId: 'amazon.nova-pro-v1:0' }
        ]
      });
    } else if (command.constructor.name === 'GetFoundationModelCommand') {
      return Promise.resolve({
        modelDetails: {
          modelId: command.input.modelIdentifier,
          providerName: 'Anthropic',
          modelName: 'Claude 3 Sonnet',
          inferenceTypesSupported: ['ON_DEMAND']
        }
      });
    }
    return Promise.reject(new Error('Unknown command'));
  });

  return {
    BedrockClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    ListFoundationModelsCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'ListFoundationModelsCommand' },
      input: params
    })),
    GetFoundationModelCommand: jest.fn().mockImplementation((params) => ({
      constructor: { name: 'GetFoundationModelCommand' },
      input: params
    }))
  };
});

describe('BedrockClientService', () => {
  let bedrockClient: BedrockClientService;

  beforeEach(() => {
    bedrockClient = new BedrockClientService({
      region: 'us-east-1'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listModels', () => {
    it('should return a list of available models', async () => {
      const models = await bedrockClient.listModels();
      
      expect(models).toEqual([
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.nova-pro-v1:0'
      ]);
    });
  });

  describe('getModelDetails', () => {
    it('should return details for a specific model', async () => {
      const modelId = 'anthropic.claude-3-sonnet-20240229-v1:0';
      const details = await bedrockClient.getModelDetails(modelId);
      
      expect(details).toHaveProperty('modelDetails');
      expect(details.modelDetails).toHaveProperty('modelId', modelId);
    });
  });

  describe('getModelConfig', () => {
    it('should return the configuration for a model', () => {
      const config = bedrockClient.getModelConfig(BedrockModelId.CLAUDE_SONNET_3_7);
      
      expect(config).toHaveProperty('modelId', BedrockModelId.CLAUDE_SONNET_3_7);
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('temperature');
    });
  });

  describe('setModelConfig', () => {
    it('should update the configuration for a model', () => {
      const modelId = BedrockModelId.CLAUDE_SONNET_3_7;
      const newConfig = {
        maxTokens: 2000,
        temperature: 0.5
      };
      
      bedrockClient.setModelConfig(modelId, newConfig);
      const config = bedrockClient.getModelConfig(modelId);
      
      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.5);
    });
  });

  describe('invokeModel', () => {
    it('should invoke a model and return a response', async () => {
      const response = await bedrockClient.invokeModel({
        modelConfig: bedrockClient.getModelConfig(BedrockModelId.CLAUDE_SONNET_3_7),
        prompt: 'Hello, world!',
        systemPrompt: 'You are a helpful assistant.'
      });
      
      expect(response).toHaveProperty('completion', 'This is a test response');
      expect(response).toHaveProperty('modelId', BedrockModelId.CLAUDE_SONNET_3_7);
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('inputTokens', 10);
      expect(response.usage).toHaveProperty('outputTokens', 5);
      expect(response.usage).toHaveProperty('totalTokens', 15);
    });
  });

  describe('invokeModelWithStreaming', () => {
    it('should invoke a model with streaming and yield response chunks', async () => {
      const chunks: string[] = [];
      
      for await (const chunk of bedrockClient.invokeModelWithStreaming({
        modelConfig: bedrockClient.getModelConfig(BedrockModelId.CLAUDE_SONNET_3_7),
        prompt: 'Hello, world!',
        systemPrompt: 'You are a helpful assistant.'
      })) {
        if (chunk.completion) {
          chunks.push(chunk.completion);
        }
      }
      
      expect(chunks).toEqual(['This ', 'is ', 'a ', 'test', 'This is a test']);
    });
  });
});