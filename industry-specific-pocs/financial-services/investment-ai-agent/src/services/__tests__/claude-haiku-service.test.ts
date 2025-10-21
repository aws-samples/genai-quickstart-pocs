/**
 * Tests for Claude Haiku 3.5 service
 */

import { BedrockClientService } from '../ai/bedrock-client';
import { ClaudeHaikuService, ClaudeHaikuPromptTemplate } from '../ai/claude-haiku-service';
import { BedrockModelId, BedrockResponse } from '../../models/bedrock';

// Mock the Bedrock client
jest.mock('../ai/bedrock-client');

describe('ClaudeHaikuService', () => {
  let bedrockClient: jest.Mocked<BedrockClientService>;
  let haikuService: ClaudeHaikuService;
  
  beforeEach(() => {
    // Create a mock Bedrock client
    bedrockClient = new BedrockClientService() as jest.Mocked<BedrockClientService>;
    
    // Mock the getModelConfig method
    bedrockClient.getModelConfig = jest.fn().mockReturnValue({
      modelId: BedrockModelId.CLAUDE_HAIKU_3_5,
      maxTokens: 2048,
      temperature: 0.7,
      topP: 0.9
    });
    
    // Create the Claude Haiku service
    haikuService = new ClaudeHaikuService(bedrockClient);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(bedrockClient.getModelConfig).toHaveBeenCalledWith(BedrockModelId.CLAUDE_HAIKU_3_5);
    });
    
    it('should apply configuration overrides', () => {
      const config = {
        maxTokens: 1000,
        temperature: 0.5
      };
      
      const customService = new ClaudeHaikuService(bedrockClient, config);
      expect(customService).toBeDefined();
    });
  });
  
  describe('generateSystemPrompt', () => {
    it('should generate a basic system prompt', () => {
      const prompt = haikuService.generateSystemPrompt('a financial analyst');
      expect(prompt).toBe('You are a financial analyst.');
    });
    
    it('should include context in the system prompt', () => {
      const prompt = haikuService.generateSystemPrompt(
        'a financial analyst',
        'You specialize in market trends'
      );
      expect(prompt).toBe('You are a financial analyst. You specialize in market trends');
    });
    
    it('should include constraints in the system prompt', () => {
      const prompt = haikuService.generateSystemPrompt(
        'a financial analyst',
        'You specialize in market trends',
        ['Be concise', 'Focus on data']
      );
      expect(prompt).toBe('You are a financial analyst. You specialize in market trends Constraints: Be concise. Focus on data.');
    });
  });
  
  describe('complete', () => {
    beforeEach(() => {
      // Mock the invokeModel method
      bedrockClient.invokeModel = jest.fn().mockResolvedValue({
        completion: 'Test completion',
        modelId: BedrockModelId.CLAUDE_HAIKU_3_5,
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30
        },
        requestId: 'test-request-id',
        finishReason: 'stop'
      } as BedrockResponse);
    });
    
    it('should complete a prompt with default options', async () => {
      const response = await haikuService.complete({
        prompt: 'Test prompt'
      });
      
      expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.objectContaining({
          modelId: BedrockModelId.CLAUDE_HAIKU_3_5
        }),
        prompt: 'Test prompt',
        systemPrompt: undefined,
        requestId: undefined
      });
      
      expect(response).toEqual({
        completion: 'Test completion',
        modelId: BedrockModelId.CLAUDE_HAIKU_3_5,
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30
        },
        requestId: 'test-request-id',
        finishReason: 'stop'
      });
    });
    
    it('should apply a template when specified', async () => {
      const response = await haikuService.complete({
        prompt: 'Test prompt',
        template: ClaudeHaikuPromptTemplate.QUICK_ANALYSIS,
        templateVariables: {
          topic: 'Market trends',
          points: 'Key indicators',
          format: 'Bullet points'
        }
      });
      
      expect(bedrockClient.invokeModel).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Market trends')
        })
      );
      
      expect(response.completion).toBe('Test completion');
    });
    
    it('should handle errors gracefully', async () => {
      bedrockClient.invokeModel = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(haikuService.complete({
        prompt: 'Test prompt'
      })).rejects.toThrow('Test error');
    });
  });
  
  describe('parseResponse', () => {
    const mockResponse: BedrockResponse = {
      completion: '```json\n{"key": "value"}\n```',
      modelId: BedrockModelId.CLAUDE_HAIKU_3_5,
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30
      },
      requestId: 'test-request-id',
      finishReason: 'stop'
    };
    
    it('should extract JSON from code blocks', () => {
      const result = haikuService.parseResponse(mockResponse, {
        extractJson: true
      });
      
      expect(result).toEqual({ key: 'value' });
    });
    
    it('should return raw completion when no options are specified', () => {
      const result = haikuService.parseResponse(mockResponse);
      expect(result).toBe('```json\n{"key": "value"}\n```');
    });
    
    it('should format as HTML when requested', () => {
      const response: BedrockResponse = {
        ...mockResponse,
        completion: '# Title\n\n**Bold** and *italic*'
      };
      
      const result = haikuService.parseResponse(response, {
        formatType: 'html'
      });
      
      expect(result).toContain('<h3>Title</h3>');
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });
    
    it('should format as plain text when requested', () => {
      const response: BedrockResponse = {
        ...mockResponse,
        completion: '# Title\n\n**Bold** and *italic*'
      };
      
      const result = haikuService.parseResponse(response, {
        formatType: 'text'
      });
      
      expect(result).toBe('Title\n\nBold and italic');
    });
  });
});