/**
 * Tests for Amazon Nova Pro service
 */

import { AmazonNovaProService, NovaProPromptTemplate } from '../ai/amazon-nova-pro-service';
import { BedrockClientService } from '../ai/bedrock-client';
import { BedrockModelId, BedrockResponse } from '../../models/bedrock';

// Mock the Bedrock client
jest.mock('../ai/bedrock-client');

describe('AmazonNovaProService', () => {
  let mockBedrockClient: jest.Mocked<BedrockClientService>;
  let novaProService: AmazonNovaProService;
  let mockResponse: BedrockResponse;

  beforeEach(() => {
    // Create mock Bedrock client
    mockBedrockClient = {
      getModelConfig: jest.fn(),
      invokeModel: jest.fn(),
      invokeModelWithStreaming: jest.fn()
    } as any;

    // Mock the model config
    mockBedrockClient.getModelConfig.mockReturnValue({
      modelId: BedrockModelId.AMAZON_NOVA_PRO,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9
    });

    // Create mock response
    mockResponse = {
      completion: 'Test response from Amazon Nova Pro',
      modelId: BedrockModelId.AMAZON_NOVA_PRO,
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300
      },
      requestId: 'test-request-id',
      finishReason: 'stop'
    };

    mockBedrockClient.invokeModel.mockResolvedValue(mockResponse);

    // Create the service
    novaProService = new AmazonNovaProService(mockBedrockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(mockBedrockClient.getModelConfig).toHaveBeenCalledWith(BedrockModelId.AMAZON_NOVA_PRO);
    });

    it('should apply configuration overrides', () => {
      const customConfig = { maxTokens: 2048, temperature: 0.3 };
      const customService = new AmazonNovaProService(mockBedrockClient, customConfig);
      
      expect(customService).toBeDefined();
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate a basic system prompt', () => {
      const prompt = novaProService.generateSystemPrompt('a financial analyst');
      
      expect(prompt).toContain('You are a financial analyst with expertise in financial analysis');
      expect(prompt).toContain('Financial statement analysis');
      expect(prompt).toContain('Statistical analysis');
      expect(prompt).toContain('Risk modeling');
    });

    it('should include additional context', () => {
      const context = 'Focus on technology sector analysis';
      const prompt = novaProService.generateSystemPrompt('a sector analyst', context);
      
      expect(prompt).toContain('You are a sector analyst');
      expect(prompt).toContain('Additional Context: Focus on technology sector analysis');
    });

    it('should include constraints', () => {
      const constraints = ['Use only public data', 'Provide confidence intervals'];
      const prompt = novaProService.generateSystemPrompt('an analyst', undefined, constraints);
      
      expect(prompt).toContain('Constraints:');
      expect(prompt).toContain('- Use only public data');
      expect(prompt).toContain('- Provide confidence intervals');
    });
  });

  describe('complete', () => {
    it('should complete a basic prompt', async () => {
      const options = {
        prompt: 'Analyze AAPL stock performance'
      };

      const result = await novaProService.complete(options);

      expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.objectContaining({
          modelId: BedrockModelId.AMAZON_NOVA_PRO,
          temperature: 0.3 // Should use lower temperature for financial analysis
        }),
        prompt: 'Analyze AAPL stock performance',
        systemPrompt: expect.stringContaining('financial analyst and quantitative researcher'),
        requestId: undefined
      });

      expect(result).toEqual(mockResponse);
    });

    it('should apply financial analysis template', async () => {
      const options = {
        prompt: 'Analyze this company',
        template: NovaProPromptTemplate.FINANCIAL_ANALYSIS,
        templateVariables: {
          investmentDetails: 'Apple Inc. (AAPL)',
          financialData: 'Revenue: $365B, Net Income: $95B',
          analysisRequirements: 'Full financial analysis',
          keyMetrics: 'P/E, ROE, ROA, Debt/Equity',
          timePeriod: '2020-2023'
        }
      };

      await novaProService.complete(options);

      expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.any(Object),
        prompt: expect.stringContaining('Financial Analysis Request'),
        systemPrompt: expect.any(String),
        requestId: undefined
      });
    });

    it('should apply quantitative analysis template', async () => {
      const options = {
        prompt: 'Perform statistical analysis',
        template: NovaProPromptTemplate.QUANTITATIVE_ANALYSIS,
        templateVariables: {
          datasetDescription: 'Stock returns data',
          analysisType: 'Regression analysis',
          statisticalMethods: 'Linear regression, correlation',
          variables: 'Returns, volatility, volume',
          hypothesis: 'Higher volume leads to higher volatility'
        }
      };

      await novaProService.complete(options);

      expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.any(Object),
        prompt: expect.stringContaining('Quantitative Analysis Request'),
        systemPrompt: expect.any(String),
        requestId: undefined
      });
    });

    it('should apply risk modeling template', async () => {
      const options = {
        prompt: 'Calculate portfolio risk',
        template: NovaProPromptTemplate.RISK_MODELING,
        templateVariables: {
          investmentDetails: 'Diversified equity portfolio',
          riskFactors: 'Market risk, sector concentration',
          historicalData: '5 years of daily returns',
          riskMetrics: 'VaR, Expected Shortfall, Beta',
          timeHorizon: '1 year'
        }
      };

      await novaProService.complete(options);

      expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.any(Object),
        prompt: expect.stringContaining('Risk Modeling Request'),
        systemPrompt: expect.any(String),
        requestId: undefined
      });
    });

    it('should handle custom analysis type', async () => {
      const options = {
        prompt: 'Analyze portfolio',
        analysisType: 'quantitative' as const
      };

      await novaProService.complete(options);

      expect(mockBedrockClient.invokeModel).toHaveBeenCalledWith({
        modelConfig: expect.any(Object),
        prompt: 'Analyze portfolio',
        systemPrompt: expect.stringContaining('quantitative analyst specializing in statistical analysis'),
        requestId: undefined
      });
    });

    it('should handle streaming requests', async () => {
      const mockStreamResponse = [
        { completion: 'Part 1', modelId: BedrockModelId.AMAZON_NOVA_PRO, requestId: 'test' },
        { completion: 'Part 2', modelId: BedrockModelId.AMAZON_NOVA_PRO, requestId: 'test' },
        { 
          completion: 'Part 1Part 2', 
          modelId: BedrockModelId.AMAZON_NOVA_PRO, 
          requestId: 'test',
          finishReason: 'stop',
          usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
        }
      ];

      mockBedrockClient.invokeModelWithStreaming.mockImplementation(async function* () {
        for (const chunk of mockStreamResponse) {
          yield chunk;
        }
      });

      const options = {
        prompt: 'Analyze stock',
        streaming: true
      };

      const result = await novaProService.complete(options);

      expect(result.completion).toBe('Part 1Part 2');
      expect(result.finishReason).toBe('stop');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Bedrock service error');
      mockBedrockClient.invokeModel.mockRejectedValue(error);

      const options = {
        prompt: 'Analyze stock'
      };

      await expect(novaProService.complete(options)).rejects.toThrow('Bedrock service error');
    });
  });

  describe('parseResponse', () => {
    it('should return raw response by default', () => {
      const result = novaProService.parseResponse(mockResponse);
      expect(result).toBe('Test response from Amazon Nova Pro');
    });

    it('should extract JSON from code blocks', () => {
      const jsonResponse = {
        ...mockResponse,
        completion: 'Here is the analysis:\n```json\n{"pe_ratio": 25.5, "roe": 0.15}\n```\nEnd of analysis.'
      };

      const result = novaProService.parseResponse(jsonResponse, { extractJson: true });
      expect(result).toEqual({ pe_ratio: 25.5, roe: 0.15 });
    });

    it('should extract financial metrics', () => {
      const metricsResponse = {
        ...mockResponse,
        completion: `
          Financial Analysis Results:
          P/E Ratio: 25.5
          ROE: 15.2%
          Annual Return: 8.5%
          Beta: 1.15
          VaR (95%): 1.2
          Correlation with S&P 500: 0.85
        `
      };

      const result = novaProService.parseResponse(metricsResponse, { extractMetrics: true });
      
      expect(result.extractedMetrics.ratios).toEqual({
        'P/E Ratio': 25.5
      });
      expect(result.extractedMetrics.returns).toEqual({
        'Annual Return': 8.5
      });
      expect(result.extractedMetrics.risks).toEqual({
        'Beta': 1.15,
        'VaR': 1.2
      });
    });

    it('should parse structured financial response', () => {
      const structuredResponse = {
        ...mockResponse,
        completion: `
          # Executive Summary
          This is the summary of the analysis.
          
          ## Financial Ratios
          P/E Ratio: 25.5
          ROE: 15.2%
          
          ## Recommendations
          I recommend buying this stock based on strong fundamentals.
        `
      };

      const result = novaProService.parseResponse(structuredResponse, { formatType: 'structured' });
      
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0].title).toBe('Executive Summary');
      expect(result.sections[1].title).toBe('Financial Ratios');
      expect(result.sections[2].title).toBe('Recommendations');
      expect(result.metrics['Financial Ratios']).toBeDefined();
    });

    it('should convert to HTML format', () => {
      const markdownResponse = {
        ...mockResponse,
        completion: '# Analysis\n**Strong** performance with *good* metrics.'
      };

      const result = novaProService.parseResponse(markdownResponse, { formatType: 'html' });
      expect(result).toContain('<h1>Analysis</h1>');
      expect(result).toContain('<strong>Strong</strong>');
      expect(result).toContain('<em>good</em>');
    });

    it('should strip markdown formatting', () => {
      const markdownResponse = {
        ...mockResponse,
        completion: '# Analysis\n**Strong** performance with *good* metrics.'
      };

      const result = novaProService.parseResponse(markdownResponse, { formatType: 'text' });
      expect(result).toBe('Analysis\nStrong performance with good metrics.');
    });

    it('should parse numerical content', () => {
      const numericalResponse = {
        ...mockResponse,
        completion: 'The return is 8.5% and the cost is $1,250.00'
      };

      const result = novaProService.parseResponse(numericalResponse, { parseNumbers: true });
      expect(result).toContain('0.085');
      expect(result).toContain('1250');
    });
  });

  describe('error handling', () => {
    it('should format errors correctly', async () => {
      const error = new Error('Model invocation failed');
      mockBedrockClient.invokeModel.mockRejectedValue(error);

      await expect(novaProService.complete({ prompt: 'test' })).rejects.toThrow('Model invocation failed');
    });
  });
});