/**
 * Tests for the Claude Sonnet service
 */

import { BedrockClientService } from '../ai/bedrock-client';
import { ClaudeSonnetService, ClaudePromptTemplate } from '../ai/claude-sonnet-service';
import { BedrockModelId } from '../../models/bedrock';

// Mock the Bedrock client
jest.mock('../ai/bedrock-client');

describe('ClaudeSonnetService', () => {
  let bedrockClient: jest.Mocked<BedrockClientService>;
  let claudeSonnetService: ClaudeSonnetService;

  beforeEach(() => {
    // Create a mock Bedrock client
    bedrockClient = new BedrockClientService() as jest.Mocked<BedrockClientService>;
    
    // Mock the getModelConfig method
    bedrockClient.getModelConfig = jest.fn().mockReturnValue({
      modelId: BedrockModelId.CLAUDE_SONNET_3_7,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9
    });
    
    // Mock the invokeModel method
    bedrockClient.invokeModel = jest.fn().mockResolvedValue({
      completion: 'This is a test response',
      modelId: BedrockModelId.CLAUDE_SONNET_3_7,
      usage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15
      },
      requestId: 'test-request-id',
      finishReason: 'stop'
    });
    
    // Mock the invokeModelWithStreaming method
    bedrockClient.invokeModelWithStreaming = jest.fn().mockImplementation(async function* () {
      yield {
        completion: 'This ',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        requestId: 'test-request-id'
      };
      yield {
        completion: 'is ',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        requestId: 'test-request-id'
      };
      yield {
        completion: 'a ',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        requestId: 'test-request-id'
      };
      yield {
        completion: 'test',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        requestId: 'test-request-id'
      };
      yield {
        completion: 'This is a test',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        requestId: 'test-request-id',
        finishReason: 'stop',
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        }
      };
    });
    
    // Create the Claude Sonnet service
    claudeSonnetService = new ClaudeSonnetService(bedrockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSystemPrompt', () => {
    it('should generate a basic system prompt with just a role', () => {
      const systemPrompt = claudeSonnetService.generateSystemPrompt('an investment advisor');
      
      expect(systemPrompt).toBe('You are an investment advisor.');
    });

    it('should generate a system prompt with role and context', () => {
      const systemPrompt = claudeSonnetService.generateSystemPrompt(
        'an investment advisor',
        'You specialize in technology stocks and have 10 years of experience.'
      );
      
      expect(systemPrompt).toContain('You are an investment advisor.');
      expect(systemPrompt).toContain('You specialize in technology stocks and have 10 years of experience.');
    });

    it('should generate a system prompt with role, context, and constraints', () => {
      const systemPrompt = claudeSonnetService.generateSystemPrompt(
        'an investment advisor',
        'You specialize in technology stocks.',
        [
          'Always cite your sources',
          'Provide balanced perspectives',
          'Highlight risks clearly'
        ]
      );
      
      expect(systemPrompt).toContain('You are an investment advisor.');
      expect(systemPrompt).toContain('You specialize in technology stocks.');
      expect(systemPrompt).toContain('Constraints:');
      expect(systemPrompt).toContain('- Always cite your sources');
      expect(systemPrompt).toContain('- Provide balanced perspectives');
      expect(systemPrompt).toContain('- Highlight risks clearly');
    });
  });

  describe('complete', () => {
    it('should complete a prompt using the default template', async () => {
      const response = await claudeSonnetService.complete({
        prompt: 'What are the best tech stocks to invest in?'
      });
      
      expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.objectContaining({
          modelId: BedrockModelId.CLAUDE_SONNET_3_7
        }),
        prompt: 'What are the best tech stocks to invest in?',
        systemPrompt: undefined,
        requestId: undefined
      });
      
      expect(response.completion).toBe('This is a test response');
    });

    it('should complete a prompt using a specific template', async () => {
      const response = await claudeSonnetService.complete({
        prompt: 'Tech stocks analysis',
        template: ClaudePromptTemplate.INVESTMENT_ANALYSIS,
        templateVariables: {
          context: 'Current market conditions show tech sector volatility.',
          investmentDetails: 'Looking at FAANG stocks.',
          analysisRequirements: 'Need fundamental and technical analysis.',
          questions: 'Which tech stock has the best growth potential?'
        }
      });
      
      expect(bedrockClient.invokeModel).toHaveBeenCalled();
      const callArgs = bedrockClient.invokeModel.mock.calls[0][0];
      
      expect(callArgs.prompt).toContain('# Investment Analysis Request');
      expect(callArgs.prompt).toContain('Current market conditions show tech sector volatility.');
      expect(callArgs.prompt).toContain('Looking at FAANG stocks.');
      expect(callArgs.prompt).toContain('Need fundamental and technical analysis.');
      expect(callArgs.prompt).toContain('Which tech stock has the best growth potential?');
      
      expect(response.completion).toBe('This is a test response');
    });

    it('should complete a prompt with a system prompt', async () => {
      const response = await claudeSonnetService.complete({
        prompt: 'What are the best tech stocks to invest in?',
        systemPrompt: 'You are a financial advisor specializing in technology investments.'
      });
      
      expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.objectContaining({
          modelId: BedrockModelId.CLAUDE_SONNET_3_7
        }),
        prompt: 'What are the best tech stocks to invest in?',
        systemPrompt: 'You are a financial advisor specializing in technology investments.',
        requestId: undefined
      });
      
      expect(response.completion).toBe('This is a test response');
    });

    it('should complete a prompt with custom model parameters', async () => {
      const response = await claudeSonnetService.complete({
        prompt: 'What are the best tech stocks to invest in?',
        maxTokens: 2000,
        temperature: 0.5,
        topP: 0.8,
        stopSequences: ['END']
      });
      
      expect(bedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.objectContaining({
          modelId: BedrockModelId.CLAUDE_SONNET_3_7,
          maxTokens: 2000,
          temperature: 0.5,
          topP: 0.8,
          stopSequences: ['END']
        }),
        prompt: 'What are the best tech stocks to invest in?',
        systemPrompt: undefined,
        requestId: undefined
      });
      
      expect(response.completion).toBe('This is a test response');
    });

    it('should complete a prompt with streaming', async () => {
      const response = await claudeSonnetService.complete({
        prompt: 'What are the best tech stocks to invest in?',
        streaming: true
      });
      
      expect(bedrockClient.invokeModelWithStreaming).toHaveBeenCalled();
      expect(response.completion).toBe('This is a test');
    });
  });

  describe('parseResponse', () => {
    it('should return the raw completion by default', () => {
      const response = {
        completion: 'This is a test response',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        },
        requestId: 'test-request-id',
        finishReason: 'stop'
      };
      
      const parsed = claudeSonnetService.parseResponse(response);
      expect(parsed).toBe('This is a test response');
    });

    it('should extract JSON from code blocks', () => {
      const response = {
        completion: 'Here is the analysis:\n\n```json\n{"stock": "AAPL", "recommendation": "buy", "targetPrice": 200}\n```',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        },
        requestId: 'test-request-id',
        finishReason: 'stop'
      };
      
      const parsed = claudeSonnetService.parseResponse(response, { extractJson: true });
      expect(parsed).toEqual({
        stock: 'AAPL',
        recommendation: 'buy',
        targetPrice: 200
      });
    });

    it('should format response as HTML', () => {
      const response = {
        completion: '# Analysis\n\nThis is a **bold** statement with *emphasis*.\n\nNew paragraph.',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        },
        requestId: 'test-request-id',
        finishReason: 'stop'
      };
      
      const parsed = claudeSonnetService.parseResponse(response, { formatType: 'html' });
      expect(parsed).toContain('<h1>Analysis</h1>');
      expect(parsed).toContain('<strong>bold</strong>');
      expect(parsed).toContain('<em>emphasis</em>');
      expect(parsed).toContain('<br><br>');
    });

    it('should format response as plain text', () => {
      const response = {
        completion: '# Analysis\n\nThis is a **bold** statement with *emphasis*.',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15
        },
        requestId: 'test-request-id',
        finishReason: 'stop'
      };
      
      const parsed = claudeSonnetService.parseResponse(response, { formatType: 'text' });
      expect(parsed).not.toContain('#');
      expect(parsed).not.toContain('**');
      expect(parsed).not.toContain('*');
      expect(parsed).toContain('Analysis');
      expect(parsed).toContain('This is a bold statement with emphasis.');
    });
  });
});