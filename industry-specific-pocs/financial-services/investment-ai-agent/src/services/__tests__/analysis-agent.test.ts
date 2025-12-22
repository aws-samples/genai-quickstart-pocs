/**
 * Analysis Agent Tests
 * 
 * Tests for the Analysis Agent implementation including:
 * - Financial analysis algorithms
 * - Correlation and causation analysis
 * - Scenario generation and evaluation
 */

import { AnalysisAgent } from '../ai/analysis-agent';
import { AmazonNovaProService } from '../ai/amazon-nova-pro-service';
import { MarketDataService } from '../market-data-service';
import { Investment } from '../../models/investment';
import { BedrockResponse } from '../../models/bedrock';

// Mock dependencies
jest.mock('../ai/amazon-nova-pro-service');
jest.mock('../market-data-service');

describe('AnalysisAgent', () => {
  let analysisAgent: AnalysisAgent;
  let mockNovaProService: jest.Mocked<AmazonNovaProService>;
  let mockMarketDataService: jest.Mocked<MarketDataService>;

  // Sample investment data for testing
  const sampleInvestments: Investment[] = [
    {
      id: 'inv-1',
      type: 'stock',
      name: 'Apple Inc.',
      ticker: 'AAPL',
      description: 'Technology company',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 3000000000000,
      currentPrice: 150.00,
      historicalPerformance: [
        {
          date: new Date('2024-01-01'),
          open: 140,
          high: 145,
          low: 138,
          close: 142,
          volume: 1000000,
          adjustedClose: 142
        },
        {
          date: new Date('2024-01-02'),
          open: 142,
          high: 148,
          low: 141,
          close: 147,
          volume: 1200000,
          adjustedClose: 147
        },
        {
          date: new Date('2024-01-03'),
          open: 147,
          high: 152,
          low: 146,
          close: 150,
          volume: 1100000,
          adjustedClose: 150
        }
      ],
      fundamentals: {
        eps: 6.05,
        peRatio: 24.8,
        pbRatio: 5.2,
        dividendYield: 0.5,
        revenueGrowth: 0.08,
        profitMargin: 0.25,
        debtToEquity: 1.8,
        freeCashFlow: 100000000000,
        returnOnEquity: 0.15,
        returnOnAssets: 0.12
      },
      technicalIndicators: {
        movingAverages: {
          ma50: 145,
          ma100: 140,
          ma200: 135
        },
        relativeStrengthIndex: 65,
        macdLine: 2.5,
        macdSignal: 2.0,
        macdHistogram: 0.5,
        bollingerBands: {
          upper: 155,
          middle: 150,
          lower: 145
        },
        averageVolume: 1100000
      },
      sentimentAnalysis: {
        overallSentiment: 'positive',
        sentimentScore: 0.7,
        sentimentTrend: 'stable',
        newsVolume: 50,
        socialMediaMentions: 1000,
        analystRecommendations: {
          buy: 15,
          hold: 8,
          sell: 2
        },
        insiderTrading: {
          buying: 5,
          selling: 2
        }
      },
      riskMetrics: {
        volatility: 0.25,
        beta: 1.2,
        sharpeRatio: 1.5,
        drawdown: 0.15,
        var: 0.05,
        correlations: {
          'SPY': 0.8,
          'QQQ': 0.9
        }
      },
      relatedInvestments: ['MSFT', 'GOOGL']
    },
    {
      id: 'inv-2',
      type: 'stock',
      name: 'Microsoft Corporation',
      ticker: 'MSFT',
      description: 'Technology company',
      sector: 'Technology',
      industry: 'Software',
      marketCap: 2800000000000,
      currentPrice: 380.00,
      historicalPerformance: [
        {
          date: new Date('2024-01-01'),
          open: 370,
          high: 375,
          low: 368,
          close: 372,
          volume: 800000,
          adjustedClose: 372
        },
        {
          date: new Date('2024-01-02'),
          open: 372,
          high: 378,
          low: 371,
          close: 376,
          volume: 900000,
          adjustedClose: 376
        },
        {
          date: new Date('2024-01-03'),
          open: 376,
          high: 382,
          low: 375,
          close: 380,
          volume: 850000,
          adjustedClose: 380
        }
      ],
      fundamentals: {
        eps: 11.05,
        peRatio: 34.4,
        pbRatio: 4.8,
        dividendYield: 0.7,
        revenueGrowth: 0.12,
        profitMargin: 0.30,
        debtToEquity: 0.5,
        freeCashFlow: 80000000000,
        returnOnEquity: 0.18,
        returnOnAssets: 0.14
      },
      riskMetrics: {
        volatility: 0.22,
        beta: 1.1,
        sharpeRatio: 1.8,
        drawdown: 0.12,
        var: 0.04,
        correlations: {
          'SPY': 0.75,
          'QQQ': 0.85
        }
      },
      relatedInvestments: ['AAPL', 'GOOGL']
    }
  ];

  beforeEach(() => {
    // Create mocked services
    mockNovaProService = {
      complete: jest.fn(),
      parseResponse: jest.fn(),
      generateSystemPrompt: jest.fn()
    } as any;

    mockMarketDataService = {
      getMarketData: jest.fn(),
      getHistoricalData: jest.fn()
    } as any;

    // Create analysis agent with mocked dependencies
    analysisAgent = new AnalysisAgent(mockNovaProService, mockMarketDataService);
  });

  describe('Fundamental Analysis', () => {
    it('should perform fundamental analysis for investments', async () => {
      // Mock Nova Pro response
      const mockResponse: BedrockResponse = {
        completion: `
          # Fundamental Analysis for Apple Inc.
          
          ## Valuation Assessment
          Apple appears fairly valued based on current metrics.
          
          ## Key Strengths
          - Strong brand loyalty
          - Diversified product portfolio
          - Excellent cash generation
          
          ## Key Weaknesses
          - High dependence on iPhone sales
          - Mature smartphone market
          
          ## Investment Recommendation
          HOLD with target price of $155
        `,
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const request = {
        investments: [sampleInvestments[0]],
        analysisType: 'fundamental' as const,
        parameters: {
          timeHorizon: 'medium' as const
        }
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.results).toHaveLength(1);
      expect(response.results[0].analysisType).toBe('fundamental');
      expect(response.results[0].investmentId).toBe('inv-1');
      expect(response.riskAssessment).toBeDefined();
      expect(response.recommendations).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(mockNovaProService.complete).toHaveBeenCalled();
    });

    it('should handle multiple investments in fundamental analysis', async () => {
      const mockResponse: BedrockResponse = {
        completion: 'Fundamental analysis completed',
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const request = {
        investments: sampleInvestments,
        analysisType: 'fundamental' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.results).toHaveLength(2);
      expect(mockNovaProService.complete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Correlation Analysis', () => {
    it('should calculate correlation matrix for investments', async () => {
      const request = {
        investments: sampleInvestments,
        analysisType: 'correlation' as const,
        parameters: {
          correlationThreshold: 0.5
        }
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.correlationMatrix).toBeDefined();
      expect(response.correlationMatrix!.matrix).toBeDefined();
      expect(response.correlationMatrix!.significantCorrelations).toBeDefined();
      expect(response.riskAssessment.diversificationScore).toBeDefined();
    });

    it('should identify significant correlations', async () => {
      const request = {
        investments: sampleInvestments,
        analysisType: 'correlation' as const,
        parameters: {
          correlationThreshold: 0.3
        }
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.correlationMatrix!.significantCorrelations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            asset1: expect.any(String),
            asset2: expect.any(String),
            correlation: expect.any(Number),
            significance: expect.any(Number),
            interpretation: expect.any(String)
          })
        ])
      );
    });

    it('should calculate Pearson correlation correctly', async () => {
      // Test the correlation calculation with known values
      const request = {
        investments: sampleInvestments,
        analysisType: 'correlation' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);
      const matrix = response.correlationMatrix!.matrix;

      // Self-correlation should be 1
      expect(matrix['inv-1']['inv-1']).toBeCloseTo(1, 2);
      expect(matrix['inv-2']['inv-2']).toBeCloseTo(1, 2);

      // Cross-correlations should be symmetric
      expect(matrix['inv-1']['inv-2']).toBeCloseTo(matrix['inv-2']['inv-1'], 5);
    });
  });

  describe('Scenario Analysis', () => {
    it('should perform scenario analysis with default scenarios', async () => {
      const request = {
        investments: sampleInvestments,
        analysisType: 'scenario' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.scenarioAnalysis).toBeDefined();
      expect(response.scenarioAnalysis!.scenarios).toHaveLength(4); // Default scenarios
      expect(response.scenarioAnalysis!.expectedValue).toBeDefined();
      expect(response.scenarioAnalysis!.bestCase).toBeDefined();
      expect(response.scenarioAnalysis!.worstCase).toBeDefined();
      expect(response.scenarioAnalysis!.probabilityWeightedReturn).toBeDefined();
    });

    it('should use custom scenarios when provided', async () => {
      const customScenarios = [
        {
          name: 'Custom Bull',
          description: 'Custom bull market scenario',
          marketConditions: {
            economicGrowth: 0.05,
            inflation: 0.02,
            interestRates: 0.03,
            volatility: 0.12
          },
          probability: 0.6
        },
        {
          name: 'Custom Bear',
          description: 'Custom bear market scenario',
          marketConditions: {
            economicGrowth: -0.03,
            inflation: 0.04,
            interestRates: 0.01,
            volatility: 0.40
          },
          probability: 0.4
        }
      ];

      const request = {
        investments: sampleInvestments,
        analysisType: 'scenario' as const,
        parameters: {
          scenarios: customScenarios
        }
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.scenarioAnalysis!.scenarios).toHaveLength(2);
      expect(response.scenarioAnalysis!.scenarios[0].scenario.name).toBe('Custom Bull');
      expect(response.scenarioAnalysis!.scenarios[1].scenario.name).toBe('Custom Bear');
    });

    it('should calculate probability-weighted returns correctly', async () => {
      const request = {
        investments: sampleInvestments,
        analysisType: 'scenario' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);
      const scenarios = response.scenarioAnalysis!.scenarios;

      // Calculate expected probability-weighted return manually
      const expectedReturn = scenarios.reduce((sum, scenario) => 
        sum + (scenario.portfolioReturn * scenario.probability), 0
      );

      expect(response.scenarioAnalysis!.probabilityWeightedReturn).toBeCloseTo(expectedReturn, 5);
      expect(response.scenarioAnalysis!.expectedValue).toBeCloseTo(expectedReturn, 5);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should combine multiple analysis types', async () => {
      const mockResponse: BedrockResponse = {
        completion: 'Analysis completed',
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const request = {
        investments: sampleInvestments,
        analysisType: 'comprehensive' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.results.length).toBeGreaterThan(2); // Should have results from multiple analysis types
      expect(response.correlationMatrix).toBeDefined();
      expect(response.scenarioAnalysis).toBeDefined();
      expect(response.riskAssessment).toBeDefined();
      expect(response.recommendations).toBeDefined();
    });

    it('should synthesize recommendations from multiple analyses', async () => {
      const mockResponse: BedrockResponse = {
        completion: 'Analysis completed',
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const request = {
        investments: sampleInvestments,
        analysisType: 'comprehensive' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.recommendations.length).toBeGreaterThan(0);
      expect(response.recommendations.length).toBeLessThanOrEqual(5); // Should limit to top 5
    });
  });

  describe('Risk Assessment', () => {
    it('should assess portfolio risk correctly', async () => {
      const request = {
        investments: sampleInvestments,
        analysisType: 'correlation' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.riskAssessment.overallRisk).toMatch(/^(low|medium|high|very-high)$/);
      expect(response.riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(response.riskAssessment.riskScore).toBeLessThanOrEqual(1);
      expect(response.riskAssessment.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(response.riskAssessment.diversificationScore).toBeLessThanOrEqual(1);
    });

    it('should combine risk assessments from multiple analyses', async () => {
      const mockResponse: BedrockResponse = {
        completion: 'Analysis completed',
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const request = {
        investments: sampleInvestments,
        analysisType: 'comprehensive' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.riskAssessment).toBeDefined();
      expect(response.riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
      expect(response.riskAssessment.riskScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Agent Message Handling', () => {
    it('should handle analysis request messages', async () => {
      const mockResponse: BedrockResponse = {
        completion: 'Analysis completed',
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const message = {
        sender: 'supervisor' as const,
        recipient: 'analysis' as const,
        messageType: 'request' as const,
        content: {
          type: 'analysis',
          request: {
            investments: [sampleInvestments[0]],
            analysisType: 'fundamental' as const,
            parameters: {}
          }
        },
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'conv-1',
          requestId: 'req-1'
        }
      };

      const response = await analysisAgent.handleMessage(message);

      expect(response.messageType).toBe('response');
      expect(response.sender).toBe('analysis');
      expect(response.recipient).toBe('supervisor');
      expect(response.content).toBeDefined();
    });

    it('should throw error for unsupported message types', async () => {
      const message = {
        sender: 'supervisor' as const,
        recipient: 'analysis' as const,
        messageType: 'unsupported' as any,
        content: {},
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'conv-1',
          requestId: 'req-1'
        }
      };

      await expect(analysisAgent.handleMessage(message)).rejects.toThrow('Unsupported message type');
    });

    it('should throw error for unsupported request types', async () => {
      const message = {
        sender: 'supervisor' as const,
        recipient: 'analysis' as const,
        messageType: 'request' as const,
        content: {
          type: 'unsupported',
          request: {}
        },
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'conv-1',
          requestId: 'req-1'
        }
      };

      await expect(analysisAgent.handleMessage(message)).rejects.toThrow('Unsupported request type');
    });
  });

  describe('Error Handling', () => {
    it('should handle Nova Pro service errors gracefully', async () => {
      mockNovaProService.complete.mockRejectedValue(new Error('Nova Pro service error'));

      const request = {
        investments: [sampleInvestments[0]],
        analysisType: 'fundamental' as const,
        parameters: {}
      };

      await expect(analysisAgent.processAnalysisRequest(request)).rejects.toThrow('Nova Pro service error');
    });

    it('should handle unsupported analysis types', async () => {
      const request = {
        investments: sampleInvestments,
        analysisType: 'unsupported' as any,
        parameters: {}
      };

      await expect(analysisAgent.processAnalysisRequest(request)).rejects.toThrow('Unsupported analysis type');
    });

    it('should handle empty investment arrays', async () => {
      const request = {
        investments: [],
        analysisType: 'fundamental' as const,
        parameters: {}
      };

      const response = await analysisAgent.processAnalysisRequest(request);

      expect(response.results).toHaveLength(0);
      expect(response.confidence).toBe(0); // NaN should be handled as 0
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', async () => {
      const mockResponse: BedrockResponse = {
        completion: 'Analysis completed',
        modelId: 'amazon.nova-pro-v1:0',
        usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
        requestId: 'test-request',
        finishReason: 'stop'
      };

      mockNovaProService.complete.mockResolvedValue(mockResponse);

      const request = {
        investments: sampleInvestments,
        analysisType: 'fundamental' as const,
        parameters: {}
      };

      const startTime = Date.now();
      const response = await analysisAgent.processAnalysisRequest(request);
      const endTime = Date.now();

      expect(response.executionTime).toBeGreaterThanOrEqual(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});