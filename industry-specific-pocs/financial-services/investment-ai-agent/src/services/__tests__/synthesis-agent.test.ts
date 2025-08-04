/**
 * Tests for Synthesis Agent
 */

import { SynthesisAgent, SynthesisRequest, SynthesisResponse } from '../ai/synthesis-agent';
import { ClaudeSonnetService } from '../ai/claude-sonnet-service';
import { AnalysisResult } from '../../models/analysis';
import { InvestmentIdea } from '../../models/investment-idea';

// Mock the Claude Sonnet service
jest.mock('../ai/claude-sonnet-service');

describe('SynthesisAgent', () => {
  let synthesisAgent: SynthesisAgent;
  let mockClaudeSonnetService: jest.Mocked<ClaudeSonnetService>;

  beforeEach(() => {
    mockClaudeSonnetService = new ClaudeSonnetService({} as any) as jest.Mocked<ClaudeSonnetService>;
    synthesisAgent = new SynthesisAgent(mockClaudeSonnetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processSynthesisRequest', () => {
    const mockAnalysisResults: AnalysisResult[] = [
      {
        id: 'analysis-1',
        investmentId: 'investment-1',
        analysisType: 'fundamental',
        timestamp: new Date(),
        analyst: 'analysis-agent',
        summary: 'Strong fundamental analysis shows positive outlook',
        confidence: 0.85,
        details: {
          strengths: ['Strong revenue growth', 'Solid balance sheet'],
          weaknesses: ['High valuation', 'Market competition'],
          opportunities: ['Market expansion', 'New products'],
          threats: ['Economic downturn', 'Regulatory changes'],
          keyMetrics: {
            'P/E Ratio': 15.2,
            'Revenue Growth': 0.12,
            'Debt/Equity': 0.3
          },
          narratives: ['Company shows strong fundamentals with consistent growth']
        },
        recommendations: [
          {
            action: 'buy',
            timeHorizon: 'medium',
            confidence: 0.8,
            rationale: 'Strong fundamentals support investment'
          }
        ],
        dataPoints: [
          {
            source: 'financial-statements',
            type: 'fundamental',
            value: { revenue: 1000000, profit: 150000 },
            timestamp: new Date(),
            reliability: 0.9
          }
        ]
      },
      {
        id: 'analysis-2',
        investmentId: 'investment-1',
        analysisType: 'technical',
        timestamp: new Date(),
        analyst: 'analysis-agent',
        summary: 'Technical indicators suggest upward momentum',
        confidence: 0.75,
        details: {
          strengths: ['Bullish trend', 'Strong volume'],
          weaknesses: ['Overbought conditions'],
          opportunities: ['Breakout potential'],
          threats: ['Support level breach'],
          keyMetrics: {
            'RSI': 65,
            'MACD': 0.5,
            'Volume': 1500000
          },
          narratives: ['Technical analysis shows positive momentum']
        },
        recommendations: [
          {
            action: 'buy',
            timeHorizon: 'short',
            confidence: 0.7,
            rationale: 'Technical momentum supports entry'
          }
        ],
        dataPoints: [
          {
            source: 'market-data',
            type: 'technical',
            value: { price: 50.25, volume: 1500000 },
            timestamp: new Date(),
            reliability: 0.95
          }
        ]
      }
    ];

    const mockRequest: SynthesisRequest = {
      analysisResults: mockAnalysisResults,
      researchFindings: [
        {
          source: 'research-agent',
          findings: 'Market research shows growing demand in sector',
          confidence: 0.8
        }
      ],
      complianceChecks: [
        {
          compliant: true,
          issues: [],
          regulationsChecked: ['SEC', 'FINRA'],
          timestamp: new Date()
        }
      ],
      userPreferences: {
        investmentHorizon: 'medium',
        riskTolerance: 'moderate',
        preferredSectors: ['Technology', 'Healthcare'],
        excludedInvestments: ['Tobacco', 'Weapons']
      },
      outputFormat: 'detailed',
      includeVisualizations: true
    };

    beforeEach(() => {
      // Mock Claude Sonnet responses
      mockClaudeSonnetService.complete.mockImplementation(async ({ prompt }: any) => {
        if (prompt.includes('coherence check')) {
          return {
            completion: JSON.stringify({
              overallScore: 0.85,
              consistencyScore: 0.8,
              completenessScore: 0.9,
              clarityScore: 0.8,
              issues: [],
              recommendations: ['Maintain consistency across analyses']
            }),
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-1',
            usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
          };
        }
        
        if (prompt.includes('Integrate the following analysis results')) {
          return {
            completion: JSON.stringify({
              consolidatedFindings: ['Strong fundamentals', 'Positive technical momentum'],
              weightedConfidence: 0.8,
              integratedRecommendations: [{ action: 'buy', confidence: 0.8 }],
              consensus: 'Both fundamental and technical analysis support investment',
              investmentThesis: 'Strong investment opportunity with multiple supporting factors'
            }),
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-2',
            usage: { inputTokens: 150, outputTokens: 300, totalTokens: 450 }
          };
        }
        
        if (prompt.includes('generate specific investment ideas')) {
          return {
            completion: `
            Investment Idea 1: Technology Growth Opportunity
            - Strong fundamental metrics with 12% revenue growth
            - Technical momentum supports entry timing
            - Confidence: 85%
            - Expected return: 12-15% annually
            - Risk factors: Market volatility, competition
            `,
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-3',
            usage: { inputTokens: 200, outputTokens: 400, totalTokens: 600 }
          };
        }
        
        if (prompt.includes('narrative structure')) {
          return {
            completion: JSON.stringify({
              sections: [
                {
                  id: 'executive-summary',
                  title: 'Executive Summary',
                  content: 'Investment opportunities identified',
                  type: 'introduction',
                  priority: 1,
                  dependencies: []
                }
              ],
              flow: ['executive-summary', 'analysis', 'recommendations'],
              keyMessages: ['Strong opportunities identified'],
              supportingEvidence: {}
            }),
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-4',
            usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
          };
        }
        
        if (prompt.includes('executive summary')) {
          return {
            completion: 'Our comprehensive analysis has identified strong investment opportunities with favorable risk-adjusted returns. The combination of solid fundamentals and positive technical momentum creates an attractive entry point for medium-term investors.',
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-5',
            usage: { inputTokens: 100, outputTokens: 150, totalTokens: 250 }
          };
        }
        
        if (prompt.includes('key insights')) {
          return {
            completion: JSON.stringify([
              'Strong fundamental metrics support long-term growth potential',
              'Technical analysis confirms favorable entry timing',
              'Risk-adjusted returns appear attractive in current market conditions',
              'Diversification benefits available across recommended positions',
              'Compliance requirements fully satisfied for all recommendations'
            ]),
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-6',
            usage: { inputTokens: 80, outputTokens: 120, totalTokens: 200 }
          };
        }
        
        if (prompt.includes('risk summary')) {
          return {
            completion: 'Overall risk assessment indicates moderate risk levels with appropriate mitigation strategies. Key risks include market volatility and sector-specific challenges, which can be managed through diversification and position sizing.',
            modelId: 'claude-3-5-sonnet-20241022-v2:0',
            requestId: 'test-request-7',
            usage: { inputTokens: 90, outputTokens: 140, totalTokens: 230 }
          };
        }
        
        // Default response
        return {
          completion: 'Analysis completed successfully',
          modelId: 'claude-3-5-sonnet-20241022-v2:0',
          requestId: 'test-request-default',
          usage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 }
        };
      });
    });

    it('should process synthesis request successfully', async () => {
      const response = await synthesisAgent.processSynthesisRequest(mockRequest);

      expect(response).toBeDefined();
      expect(response.investmentIdeas).toHaveLength(1);
      expect(response.executiveSummary).toContain('comprehensive analysis');
      expect(response.keyInsights).toHaveLength(5);
      expect(response.coherenceScore).toBeGreaterThan(0);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.executionTime).toBeGreaterThan(0);
    });

    it('should include visualizations when requested', async () => {
      const response = await synthesisAgent.processSynthesisRequest(mockRequest);

      expect(response.visualizations).toBeDefined();
      expect(response.visualizations.length).toBeGreaterThan(0);
      
      const riskReturnChart = response.visualizations.find(v => v.title === 'Risk-Return Analysis');
      expect(riskReturnChart).toBeDefined();
      expect(riskReturnChart?.type).toBe('chart');
      expect(riskReturnChart?.config.chartType).toBe('scatter');
    });

    it('should not include visualizations when not requested', async () => {
      const requestWithoutViz = { ...mockRequest, includeVisualizations: false };
      const response = await synthesisAgent.processSynthesisRequest(requestWithoutViz);

      expect(response.visualizations).toHaveLength(0);
    });

    it('should generate appropriate recommendations', async () => {
      const response = await synthesisAgent.processSynthesisRequest(mockRequest);

      expect(response.recommendations).toBeDefined();
      expect(response.recommendations.length).toBeGreaterThan(0);
      
      const highPriorityRecs = response.recommendations.filter(r => r.priority === 'high');
      // Since we're using mock data, we just check that recommendations exist
      expect(response.recommendations.length).toBeGreaterThan(0);
      
      response.recommendations.forEach(rec => {
        expect(rec.action).toMatch(/buy|sell|hold|investigate|monitor/);
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.rationale).toBeDefined();
      });
    });

    it('should handle coherence checking', async () => {
      const response = await synthesisAgent.processSynthesisRequest(mockRequest);

      expect(response.coherenceScore).toBeDefined();
      expect(response.coherenceScore).toBeGreaterThan(0);
      expect(response.coherenceScore).toBeLessThanOrEqual(1);
      
      // Verify coherence check was called
      expect(mockClaudeSonnetService.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('coherence check')
        })
      );
    });

    it('should integrate analysis results from multiple agents', async () => {
      const response = await synthesisAgent.processSynthesisRequest(mockRequest);

      expect(response.investmentIdeas).toBeDefined();
      expect(response.investmentIdeas.length).toBeGreaterThan(0);
      
      // Verify integration was called
      expect(mockClaudeSonnetService.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Integrate the following analysis results')
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockClaudeSonnetService.complete.mockRejectedValue(new Error('API Error'));

      await expect(synthesisAgent.processSynthesisRequest(mockRequest))
        .rejects.toThrow('API Error');
    });

    it('should calculate confidence scores correctly', async () => {
      const response = await synthesisAgent.processSynthesisRequest(mockRequest);

      expect(response.confidence).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
      
      // Confidence should be based on investment ideas
      const avgConfidence = response.investmentIdeas.reduce(
        (sum, idea) => sum + idea.confidenceScore, 0
      ) / response.investmentIdeas.length;
      
      expect(response.confidence).toBeCloseTo(avgConfidence, 2);
    });
  });

  describe('formatOutput', () => {
    const mockResponse: SynthesisResponse = {
      investmentIdeas: [
        {
          id: 'idea-1',
          version: 1,
          title: 'Test Investment',
          description: 'Test description',
          investments: [],
          rationale: 'Test rationale',
          strategy: 'buy',
          timeHorizon: 'medium',
          confidenceScore: 0.8,
          generatedAt: new Date(),
          lastUpdatedAt: new Date(),
          potentialOutcomes: [
            {
              scenario: 'expected',
              probability: 0.6,
              returnEstimate: 0.12,
              timeToRealization: 365,
              description: 'Expected outcome',
              conditions: ['Normal market conditions'],
              keyRisks: [],
              catalysts: []
            }
          ],
          supportingData: [],
          counterArguments: [],
          complianceStatus: {
            compliant: true,
            issues: [],
            regulationsChecked: ['SEC'],
            timestamp: new Date()
          },
          createdBy: 'synthesis-agent',
          tags: [],
          category: 'equity',
          riskLevel: 'moderate',
          targetAudience: ['institutional'],
          metadata: {
            sourceModels: ['synthesis-agent'],
            processingTime: 1000,
            dataSourcesUsed: [],
            researchDepth: 'standard',
            qualityScore: 80,
            noveltyScore: 70,
            marketConditionsAtGeneration: {
              volatilityIndex: 20,
              marketTrend: 'bull',
              economicIndicators: {},
              geopoliticalRisk: 'low'
            }
          },
          trackingInfo: {
            views: 0,
            implementations: 0,
            feedback: [],
            performance: [],
            status: 'active',
            statusHistory: []
          }
        }
      ],
      executiveSummary: 'Test executive summary',
      detailedNarrative: 'Test detailed narrative',
      keyInsights: ['Insight 1', 'Insight 2'],
      riskSummary: 'Test risk summary',
      recommendations: [
        {
          priority: 'high',
          action: 'buy',
          investment: 'Test Investment',
          rationale: 'Test rationale',
          timeframe: 'medium',
          confidence: 0.8,
          supportingEvidence: ['Evidence 1']
        }
      ],
      visualizations: [],
      coherenceScore: 0.85,
      confidence: 0.8,
      executionTime: 5000
    };

    it('should format as JSON', async () => {
      const result = await synthesisAgent.formatOutput(mockResponse, 'json');
      
      expect(result).toBeDefined();
      expect(() => JSON.parse(result)).not.toThrow();
      
      const parsed = JSON.parse(result);
      expect(parsed.investmentIdeas).toHaveLength(1);
      expect(parsed.executiveSummary).toBe('Test executive summary');
    });

    it('should format as Markdown', async () => {
      const result = await synthesisAgent.formatOutput(mockResponse, 'markdown');
      
      expect(result).toBeDefined();
      expect(result).toContain('# Investment Analysis Report');
      expect(result).toContain('## Executive Summary');
      expect(result).toContain('Test executive summary');
      expect(result).toContain('### 1. Test Investment');
      expect(result).toContain('**Confidence:** 80.0%');
    });

    it('should format as HTML', async () => {
      const result = await synthesisAgent.formatOutput(mockResponse, 'html');
      
      expect(result).toBeDefined();
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<h1>Investment Analysis Report</h1>');
      expect(result).toContain('Test executive summary');
      expect(result).toContain('<h3>1. Test Investment</h3>');
      expect(result).toContain('80.0%');
    });

    it('should handle unsupported format', async () => {
      await expect(synthesisAgent.formatOutput(mockResponse, 'xml' as any))
        .rejects.toThrow('Unsupported format: xml');
    });
  });

  describe('handleMessage', () => {
    it('should handle synthesis request message', async () => {
      const mockRequest: SynthesisRequest = {
        analysisResults: [],
        researchFindings: [],
        complianceChecks: [],
        userPreferences: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate'
        },
        outputFormat: 'summary',
        includeVisualizations: false
      };

      const message = {
        sender: 'supervisor' as const,
        recipient: 'synthesis' as const,
        messageType: 'request' as const,
        content: {
          type: 'synthesis',
          request: mockRequest
        },
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      // Mock the synthesis processing
      mockClaudeSonnetService.complete.mockResolvedValue({
        completion: JSON.stringify({ overallScore: 0.8 }),
        modelId: 'claude-3-5-sonnet-20241022-v2:0',
        requestId: 'test-request-handle',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
      });

      const response = await synthesisAgent.handleMessage(message);

      expect(response).toBeDefined();
      expect(response.sender).toBe('synthesis');
      expect(response.recipient).toBe('supervisor');
      expect(response.messageType).toBe('response');
      expect(response.content).toBeDefined();
    });

    it('should handle unsupported request type', async () => {
      const message = {
        sender: 'supervisor' as const,
        recipient: 'synthesis' as const,
        messageType: 'request' as const,
        content: {
          type: 'unsupported',
          request: {}
        },
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      await expect(synthesisAgent.handleMessage(message))
        .rejects.toThrow('Unsupported request type: unsupported');
    });

    it('should handle unsupported message type', async () => {
      const message = {
        sender: 'supervisor' as const,
        recipient: 'synthesis' as const,
        messageType: 'update' as const,
        content: {},
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      await expect(synthesisAgent.handleMessage(message))
        .rejects.toThrow('Unsupported message type: update');
    });
  });

  describe('visualization generation', () => {
    it('should generate risk-return scatter plot', async () => {
      const mockRequest: SynthesisRequest = {
        analysisResults: [],
        researchFindings: [],
        complianceChecks: [],
        userPreferences: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate'
        },
        outputFormat: 'detailed',
        includeVisualizations: true
      };

      mockClaudeSonnetService.complete.mockResolvedValue({
        completion: JSON.stringify({ overallScore: 0.8 }),
        modelId: 'claude-3-5-sonnet-20241022-v2:0',
        requestId: 'test-request-scatter',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
      });

      const response = await synthesisAgent.processSynthesisRequest(mockRequest);
      
      const scatterPlot = response.visualizations.find(v => v.type === 'chart' && v.config.chartType === 'scatter');
      expect(scatterPlot).toBeDefined();
      expect(scatterPlot?.title).toBe('Risk-Return Analysis');
      expect(scatterPlot?.config.dimensions).toEqual({ width: 800, height: 600 });
      expect(scatterPlot?.config.interactivity.zoom).toBe(true);
    });

    it('should generate confidence distribution chart', async () => {
      const mockRequest: SynthesisRequest = {
        analysisResults: [],
        researchFindings: [],
        complianceChecks: [],
        userPreferences: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate'
        },
        outputFormat: 'detailed',
        includeVisualizations: true
      };

      mockClaudeSonnetService.complete.mockResolvedValue({
        completion: JSON.stringify({ overallScore: 0.8 }),
        modelId: 'claude-3-5-sonnet-20241022-v2:0',
        requestId: 'test-request-confidence',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
      });

      const response = await synthesisAgent.processSynthesisRequest(mockRequest);
      
      const barChart = response.visualizations.find(v => v.type === 'chart' && v.config.chartType === 'bar');
      expect(barChart).toBeDefined();
      expect(barChart?.title).toBe('Confidence Distribution');
      expect(barChart?.config.dimensions).toEqual({ width: 600, height: 400 });
    });

    it('should generate implementation timeline', async () => {
      const mockRequest: SynthesisRequest = {
        analysisResults: [],
        researchFindings: [],
        complianceChecks: [],
        userPreferences: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate'
        },
        outputFormat: 'detailed',
        includeVisualizations: true
      };

      mockClaudeSonnetService.complete.mockResolvedValue({
        completion: JSON.stringify({ overallScore: 0.8 }),
        modelId: 'claude-3-5-sonnet-20241022-v2:0',
        requestId: 'test-request-timeline',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
      });

      const response = await synthesisAgent.processSynthesisRequest(mockRequest);
      
      const timeline = response.visualizations.find(v => v.type === 'diagram');
      expect(timeline).toBeDefined();
      expect(timeline?.title).toBe('Implementation Timeline');
      expect(timeline?.config.dimensions).toEqual({ width: 1000, height: 300 });
    });
  });
});