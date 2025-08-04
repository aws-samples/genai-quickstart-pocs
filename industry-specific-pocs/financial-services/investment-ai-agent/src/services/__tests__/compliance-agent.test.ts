/**
 * Compliance Agent Tests
 * 
 * Tests for the compliance agent functionality including:
 * - Regulatory compliance checking
 * - Risk assessment for investment ideas
 * - ESG analysis
 * - Compliance documentation generation
 */

import { ComplianceAgent, ComplianceRequest, ComplianceResponse } from '../ai/compliance-agent';
import { ClaudeHaikuService } from '../ai/claude-haiku-service';
import { Investment } from '../../models/investment';
import { InvestmentIdea } from '../../models/investment-idea';
import { RiskContext } from '../../models/services';

// Mock the Claude Haiku service
jest.mock('../ai/claude-haiku-service');

describe('ComplianceAgent', () => {
  let complianceAgent: ComplianceAgent;
  let mockHaikuService: jest.Mocked<ClaudeHaikuService>;

  // Sample test data
  const sampleInvestment: Investment = {
    id: 'test-investment-1',
    type: 'stock',
    name: 'Test Technology Corp',
    ticker: 'TTC',
    description: 'A technology company focused on AI solutions',
    sector: 'Technology',
    industry: 'Software',
    marketCap: 50000000000,
    currentPrice: 150.50,
    historicalPerformance: [
      {
        date: new Date('2024-01-01'),
        open: 140,
        high: 155,
        low: 138,
        close: 150.50,
        volume: 1000000,
        adjustedClose: 150.50
      }
    ],
    fundamentals: {
      eps: 6.0,
      peRatio: 25.5,
      pbRatio: 3.2,
      returnOnEquity: 0.15,
      returnOnAssets: 0.08,
      debtToEquity: 0.3,
      revenueGrowth: 0.12,
      profitMargin: 0.18
    },
    riskMetrics: {
      volatility: 0.25,
      beta: 1.2,
      sharpeRatio: 1.1,
      drawdown: 0.15,
      var: -0.08,
      correlations: {}
    },
    relatedInvestments: []
  };

  const sampleInvestmentIdea: InvestmentIdea = {
    id: 'test-idea-1',
    version: 1,
    title: 'AI Technology Growth Strategy',
    description: 'Investment strategy focused on AI technology companies',
    investments: [sampleInvestment],
    rationale: 'Strong growth potential in AI sector',
    strategy: 'buy',
    timeHorizon: 'long',
    confidenceScore: 0.85,
    generatedAt: new Date(),
    lastUpdatedAt: new Date(),
    potentialOutcomes: [
      {
        scenario: 'expected',
        probability: 0.6,
        returnEstimate: 0.15,
        timeToRealization: 365,
        description: 'Expected growth scenario',
        conditions: ['Stable market conditions', 'Continued AI adoption'],
        keyRisks: [],
        catalysts: []
      }
    ],
    supportingData: [],
    counterArguments: [],
    complianceStatus: {
      compliant: true,
      issues: [],
      regulationsChecked: [],
      timestamp: new Date()
    },
    createdBy: 'test-agent',
    tags: [],
    category: 'equity',
    riskLevel: 'moderate',
    targetAudience: ['institutional'],
    metadata: {
      sourceModels: ['test-agent'],
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
  };

  beforeEach(() => {
    // Create mock Haiku service
    mockHaikuService = {
      complete: jest.fn()
    } as any;

    // Create compliance agent with mocked service
    complianceAgent = new ComplianceAgent(mockHaikuService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processComplianceRequest', () => {
    it('should process compliance check request successfully', async () => {
      // Mock the Haiku service response
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Compliance analysis shows the investment meets regulatory requirements with minor considerations for sector-specific regulations.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'compliance-check',
        parameters: {
          jurisdictions: ['US'],
          includeESG: true
        }
      };

      const response = await complianceAgent.processComplianceRequest(request);

      expect(response).toBeDefined();
      expect(response.complianceResults).toHaveLength(1);
      expect(response.riskAssessments).toHaveLength(1);
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.executionTime).toBeGreaterThan(0);
      expect(mockHaikuService.complete).toHaveBeenCalled();
    });

    it('should process risk assessment request successfully', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Risk assessment indicates medium overall risk with key factors including market volatility and sector concentration.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 150, outputTokens: 250, totalTokens: 400 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'risk-assessment',
        parameters: {
          riskTolerance: 'moderate',
          investmentHorizon: 'long'
        }
      };

      const response = await complianceAgent.processComplianceRequest(request);

      expect(response).toBeDefined();
      expect(response.riskAssessments).toHaveLength(1);
      expect(response.riskAssessments[0].overallRisk).toBeDefined();
      expect(response.riskAssessments[0].riskFactors).toBeDefined();
      expect(response.recommendations).toBeDefined();
    });

    it('should process ESG analysis request successfully', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'ESG analysis shows strong environmental practices (score: 85), good social responsibility (score: 78), and adequate governance (score: 72).',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 200, outputTokens: 300, totalTokens: 500 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'esg-analysis',
        parameters: {
          includeESG: true
        }
      };

      const response = await complianceAgent.processComplianceRequest(request);

      expect(response).toBeDefined();
      expect(response.esgAnalysis).toBeDefined();
      expect(response.esgAnalysis!.overallESGScore).toBeGreaterThan(0);
      expect(response.esgAnalysis!.esgFactors).toBeDefined();
      expect(response.esgAnalysis!.esgRisks).toBeDefined();
      expect(response.esgAnalysis!.esgOpportunities).toBeDefined();
    });

    it('should generate compliance documentation successfully', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Comprehensive compliance documentation including executive summary, regulatory framework analysis, and recommendations.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 300, outputTokens: 800, totalTokens: 1100 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'documentation-generation',
        parameters: {
          documentationType: 'detailed',
          jurisdictions: ['US']
        }
      };

      const response = await complianceAgent.processComplianceRequest(request);

      expect(response).toBeDefined();
      expect(response.documentation).toBeDefined();
      expect(response.documentation!.title).toBeDefined();
      expect(response.documentation!.content).toBeDefined();
      expect(response.documentation!.sections).toBeDefined();
      expect(response.documentation!.metadata).toBeDefined();
    });

    it('should handle investment ideas compliance check', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Investment idea compliance analysis shows adherence to portfolio diversification requirements with considerations for concentration limits.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 180, outputTokens: 220, totalTokens: 400 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investmentIdeas: [sampleInvestmentIdea],
        requestType: 'compliance-check',
        parameters: {
          jurisdictions: ['US', 'EU']
        }
      };

      const response = await complianceAgent.processComplianceRequest(request);

      expect(response).toBeDefined();
      expect(response.complianceResults).toHaveLength(1);
      expect(response.complianceResults[0].regulationsChecked).toBeDefined();
    });

    it('should throw error for unsupported request type', async () => {
      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'unsupported-type' as any,
        parameters: {}
      };

      await expect(complianceAgent.processComplianceRequest(request))
        .rejects.toThrow('Unsupported compliance request type');
    });
  });

  describe('checkCompliance', () => {
    it('should check compliance for a single investment', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Investment complies with major regulations with minor ESG considerations.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 120, outputTokens: 180, totalTokens: 300 },
        requestId: 'test-request'
      });

      const result = await complianceAgent.checkCompliance(sampleInvestment);

      expect(result).toBeDefined();
      expect(result.compliant).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.regulationsChecked).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should identify compliance issues when present', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Critical compliance violation detected: Investment exceeds concentration limits under SEC regulations.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 120, outputTokens: 180, totalTokens: 300 },
        requestId: 'test-request'
      });

      const result = await complianceAgent.checkCompliance(sampleInvestment);

      expect(result.compliant).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.severity === 'critical')).toBe(true);
    });
  });

  describe('evaluateRisk', () => {
    it('should evaluate risk for an investment with context', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Risk assessment shows medium overall risk with key factors including market volatility (medium), liquidity risk (low), and regulatory risk (low).',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 150, outputTokens: 200, totalTokens: 350 },
        requestId: 'test-request'
      });

      const riskContext: RiskContext = {
        portfolioComposition: { [sampleInvestment.id]: 0.3 },
        marketConditions: { volatility: 0.2 },
        riskTolerance: 'moderate',
        investmentHorizon: 'long',
        regulatoryContext: ['US']
      };

      const result = await complianceAgent.evaluateRisk(sampleInvestment, riskContext);

      expect(result).toBeDefined();
      expect(result.overallRisk).toBeDefined();
      expect(result.riskFactors).toBeDefined();
      expect(result.mitigationStrategies).toBeDefined();
      expect(result.scenarioAnalysis).toBeDefined();
    });

    it('should adjust risk assessment based on investment type', async () => {
      const cryptoInvestment: Investment = {
        ...sampleInvestment,
        type: 'cryptocurrency',
        name: 'Bitcoin'
      };

      mockHaikuService.complete.mockResolvedValue({
        completion: 'High risk assessment for cryptocurrency investment due to extreme volatility and regulatory uncertainty.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 150, outputTokens: 200, totalTokens: 350 },
        requestId: 'test-request'
      });

      const riskContext: RiskContext = {
        portfolioComposition: { [cryptoInvestment.id]: 0.1 },
        marketConditions: {},
        riskTolerance: 'aggressive',
        investmentHorizon: 'short',
        regulatoryContext: ['US']
      };

      const result = await complianceAgent.evaluateRisk(cryptoInvestment, riskContext);

      expect(result.overallRisk).toBe('very-high');
    });
  });

  describe('getRegulationDetails', () => {
    it('should return regulation details for valid regulation ID', async () => {
      const result = await complianceAgent.getRegulationDetails('SEC-ICA-1940');

      expect(result).toBeDefined();
      expect(result.id).toBe('SEC-ICA-1940');
      expect(result.name).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.jurisdiction).toBeDefined();
      expect(result.requirements).toBeDefined();
    });

    it('should throw error for invalid regulation ID', async () => {
      await expect(complianceAgent.getRegulationDetails('INVALID-REG'))
        .rejects.toThrow('Regulation not found');
    });
  });

  describe('monitorRegulationChanges', () => {
    it('should return regulation updates', async () => {
      const result = await complianceAgent.monitorRegulationChanges();

      expect(result).toBeDefined();
      expect(result.newRegulations).toBeDefined();
      expect(result.updatedRegulations).toBeDefined();
    });
  });

  describe('handleMessage', () => {
    it('should handle compliance request messages', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Compliance analysis completed successfully.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 100, outputTokens: 150, totalTokens: 250 },
        requestId: 'test-request'
      });

      const message = {
        sender: 'supervisor' as const,
        recipient: 'compliance' as const,
        messageType: 'request' as const,
        content: {
          type: 'compliance',
          request: {
            investments: [sampleInvestment],
            requestType: 'compliance-check' as const,
            parameters: { jurisdictions: ['US'] }
          }
        },
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'test-conversation',
          requestId: 'test-request'
        }
      };

      const response = await complianceAgent.handleMessage(message);

      expect(response).toBeDefined();
      expect(response.sender).toBe('compliance');
      expect(response.recipient).toBe('supervisor');
      expect(response.messageType).toBe('response');
      expect(response.content).toBeDefined();
    });

    it('should throw error for unsupported message types', async () => {
      const message = {
        sender: 'supervisor' as const,
        recipient: 'compliance' as const,
        messageType: 'unsupported' as any,
        content: {},
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'test-conversation',
          requestId: 'test-request'
        }
      };

      await expect(complianceAgent.handleMessage(message))
        .rejects.toThrow('Unsupported message type');
    });

    it('should throw error for unsupported request types in messages', async () => {
      const message = {
        sender: 'supervisor' as const,
        recipient: 'compliance' as const,
        messageType: 'request' as const,
        content: {
          type: 'unsupported',
          request: {}
        },
        metadata: {
          priority: 'medium' as const,
          timestamp: new Date(),
          conversationId: 'test-conversation',
          requestId: 'test-request'
        }
      };

      await expect(complianceAgent.handleMessage(message))
        .rejects.toThrow('Unsupported request type');
    });
  });

  describe('ESG Analysis', () => {
    it('should provide comprehensive ESG scoring', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'ESG Analysis: Environmental score 85 (strong renewable energy initiatives), Social score 78 (good labor practices), Governance score 72 (adequate board independence).',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 200, outputTokens: 300, totalTokens: 500 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'esg-analysis',
        parameters: {}
      };

      const response = await complianceAgent.processComplianceRequest(request);
      const esgAnalysis = response.esgAnalysis!;

      expect(esgAnalysis.environmentalScore).toBe(75);
      expect(esgAnalysis.socialScore).toBe(80);
      expect(esgAnalysis.governanceScore).toBe(70);
      expect(esgAnalysis.overallESGScore).toBeCloseTo(75);
      expect(esgAnalysis.esgFactors).toHaveLength(3);
      expect(esgAnalysis.esgRisks).toBeDefined();
      expect(esgAnalysis.esgOpportunities).toBeDefined();
    });
  });

  describe('Compliance Documentation', () => {
    it('should generate structured compliance documentation', async () => {
      mockHaikuService.complete.mockResolvedValue({
        completion: 'Detailed compliance documentation with executive summary, regulatory analysis, risk assessment, and recommendations.',
        modelId: 'claude-haiku-3.5',
        usage: { inputTokens: 300, outputTokens: 800, totalTokens: 1100 },
        requestId: 'test-request'
      });

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'documentation-generation',
        parameters: {
          documentationType: 'detailed',
          jurisdictions: ['US', 'EU']
        }
      };

      const response = await complianceAgent.processComplianceRequest(request);
      const documentation = response.documentation!;

      expect(documentation.documentType).toBe('detailed');
      expect(documentation.title).toContain('Compliance Analysis Report');
      expect(documentation.sections).toHaveLength(4);
      expect(documentation.sections[0].title).toBe('Executive Summary');
      expect(documentation.metadata.jurisdiction).toBe('US');
      expect(documentation.metadata.regulations).toContain('SEC Investment Company Act');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockHaikuService.complete.mockRejectedValue(new Error('Service unavailable'));

      const request: ComplianceRequest = {
        investments: [sampleInvestment],
        requestType: 'compliance-check',
        parameters: {}
      };

      await expect(complianceAgent.processComplianceRequest(request))
        .rejects.toThrow('Service unavailable');
    });

    it('should handle empty investment arrays', async () => {
      const request: ComplianceRequest = {
        investments: [],
        requestType: 'compliance-check',
        parameters: {}
      };

      const response = await complianceAgent.processComplianceRequest(request);

      expect(response.complianceResults).toHaveLength(0);
      expect(response.riskAssessments).toHaveLength(0);
    });

    it('should require investments for ESG analysis', async () => {
      const request: ComplianceRequest = {
        requestType: 'esg-analysis',
        parameters: {}
      };

      await expect(complianceAgent.processComplianceRequest(request))
        .rejects.toThrow('ESG analysis requires investments to be provided');
    });
  });
});