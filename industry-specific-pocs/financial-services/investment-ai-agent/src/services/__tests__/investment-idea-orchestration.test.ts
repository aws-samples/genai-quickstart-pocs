/**
 * Tests for Investment Idea Orchestration Service
 */

import {
  InvestmentIdeaOrchestrationService,
  IdeaGenerationRequest,
  IdeaGenerationParameters,
  IdeaGenerationContext,
  RankedInvestmentIdea
} from '../investment-idea-orchestration';
import { SupervisorAgent } from '../ai/supervisor-agent';
import { PlanningAgent } from '../ai/planning-agent';
import { ResearchAgent } from '../ai/research-agent';
import { AnalysisAgent } from '../ai/analysis-agent';
import { ComplianceAgent } from '../ai/compliance-agent';
import { SynthesisAgent } from '../ai/synthesis-agent';
import { InvestmentIdeaService } from '../investment-idea-service';
import { MessageBus } from '../communication/message-bus';
import { InvestmentIdea, CreateInvestmentIdeaRequest } from '../../models/investment-idea';
import { Investment } from '../../models/investment';

// Mock dependencies
jest.mock('../ai/supervisor-agent');
jest.mock('../ai/planning-agent');
jest.mock('../ai/research-agent');
jest.mock('../ai/analysis-agent');
jest.mock('../ai/compliance-agent');
jest.mock('../ai/synthesis-agent');
jest.mock('../investment-idea-service');
jest.mock('../communication/message-bus');

describe('InvestmentIdeaOrchestrationService', () => {
  let orchestrationService: InvestmentIdeaOrchestrationService;
  let mockSupervisorAgent: jest.Mocked<SupervisorAgent>;
  let mockPlanningAgent: jest.Mocked<PlanningAgent>;
  let mockResearchAgent: jest.Mocked<ResearchAgent>;
  let mockAnalysisAgent: jest.Mocked<AnalysisAgent>;
  let mockComplianceAgent: jest.Mocked<ComplianceAgent>;
  let mockSynthesisAgent: jest.Mocked<SynthesisAgent>;
  let mockInvestmentIdeaService: jest.Mocked<InvestmentIdeaService>;
  let mockMessageBus: jest.Mocked<MessageBus>;

  const mockInvestment: Investment = {
    id: 'inv-1',
    type: 'stock',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    description: 'Technology company',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: 3000000000000,
    currentPrice: 150.00,
    historicalPerformance: [],
    riskMetrics: {
      volatility: 0.25,
      beta: 1.2,
      sharpeRatio: 1.5,
      drawdown: 0.15,
      var: 0.05,
      correlations: {}
    },
    relatedInvestments: []
  };

  const mockInvestmentIdea: InvestmentIdea = {
    id: 'idea-1',
    version: 1,
    title: 'Apple Growth Investment',
    description: 'Investment in Apple for long-term growth',
    investments: [mockInvestment],
    rationale: 'Strong fundamentals and growth prospects',
    strategy: 'buy',
    timeHorizon: 'long',
    confidenceScore: 0.85,
    generatedAt: new Date(),
    lastUpdatedAt: new Date(),
    potentialOutcomes: [
      {
        scenario: 'expected',
        probability: 0.6,
        returnEstimate: 0.12,
        timeToRealization: 365,
        description: 'Expected growth scenario',
        conditions: ['Market stability'],
        keyRisks: ['Market volatility'],
        catalysts: ['Product launches']
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
    tags: ['technology', 'growth'],
    category: 'equity',
    riskLevel: 'moderate',
    targetAudience: ['retail'],
    metadata: {
      sourceModels: ['claude-sonnet'],
      processingTime: 5000,
      dataSourcesUsed: ['market-data'],
      researchDepth: 'standard',
      qualityScore: 80,
      noveltyScore: 70,
      marketConditionsAtGeneration: {
        volatilityIndex: 20,
        marketTrend: 'bull',
        economicIndicators: {},
        geopoliticalRisk: 'medium'
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
    // Create mocked instances
    mockSupervisorAgent = new SupervisorAgent({} as any, {} as any) as jest.Mocked<SupervisorAgent>;
    mockPlanningAgent = new PlanningAgent({} as any, {} as any) as jest.Mocked<PlanningAgent>;
    mockResearchAgent = new ResearchAgent({} as any, {} as any, {} as any, {} as any) as jest.Mocked<ResearchAgent>;
    mockAnalysisAgent = new AnalysisAgent({} as any, {} as any) as jest.Mocked<AnalysisAgent>;
    mockComplianceAgent = new ComplianceAgent({} as any) as jest.Mocked<ComplianceAgent>;
    mockSynthesisAgent = new SynthesisAgent({} as any) as jest.Mocked<SynthesisAgent>;
    mockInvestmentIdeaService = new InvestmentIdeaService() as jest.Mocked<InvestmentIdeaService>;
    mockMessageBus = new MessageBus() as jest.Mocked<MessageBus>;

    // Setup default mock implementations
    mockPlanningAgent.createResearchPlan = jest.fn().mockResolvedValue({
      researchTasks: ['market-analysis', 'sector-research'],
      analysisTasks: ['financial-analysis', 'risk-assessment'],
      timeline: 60000
    });

    mockResearchAgent.processResearchRequest = jest.fn().mockResolvedValue({
      summary: 'Research completed',
      keyFindings: ['market data', 'research reports'],
      trends: [{ trend: 'AI growth', strength: 'strong', timeframe: 'medium' }],
      patterns: [{ pattern: 'Tech innovation', confidence: 0.8 }],
      sources: [],
      confidence: 0.85,
      recommendations: ['Cloud computing', 'Mobile technology'],
      relatedTopics: ['technology', 'growth'],
      executionTime: 5000
    });

    mockAnalysisAgent.processAnalysisRequest = jest.fn().mockResolvedValue({
      results: [
        {
          investment: mockInvestment,
          summary: 'Financial analysis results',
          expectedReturn: 0.12,
          riskLevel: 'moderate',
          confidence: 0.85
        }
      ],
      riskAssessment: {
        overallRisk: 'medium',
        riskScore: 0.6,
        riskFactors: ['Market volatility'],
        mitigationStrategies: ['Diversification']
      },
      recommendations: [],
      confidence: 0.85,
      executionTime: 8000
    });

    mockComplianceAgent.processComplianceRequest = jest.fn().mockResolvedValue({
      complianceResults: [
        {
          compliant: true,
          issues: [],
          regulationsChecked: ['SEC', 'FINRA'],
          timestamp: new Date()
        }
      ],
      riskAssessments: [],
      recommendations: [],
      confidence: 0.95,
      executionTime: 3000
    });

    mockSynthesisAgent.processSynthesisRequest = jest.fn().mockResolvedValue({
      investmentIdeas: [mockInvestmentIdea],
      executiveSummary: 'Investment analysis completed',
      detailedNarrative: 'Detailed analysis narrative',
      keyInsights: ['Strong growth potential'],
      riskSummary: 'Moderate risk profile',
      recommendations: [],
      visualizations: [],
      coherenceScore: 0.9,
      confidence: 0.85,
      executionTime: 10000
    });

    mockInvestmentIdeaService.createInvestmentIdea = jest.fn().mockResolvedValue({
      idea: mockInvestmentIdea,
      validation: { isValid: true, errors: [], warnings: [] }
    });

    // Create service instance
    orchestrationService = new InvestmentIdeaOrchestrationService(
      mockSupervisorAgent,
      mockPlanningAgent,
      mockResearchAgent,
      mockAnalysisAgent,
      mockComplianceAgent,
      mockSynthesisAgent,
      mockInvestmentIdeaService,
      mockMessageBus
    );
  });

  describe('generateInvestmentIdeas', () => {
    it('should successfully generate investment ideas with basic parameters', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-1',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result).toBeDefined();
      expect(result.requestId).toBe('req-1');
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].rank).toBe(1);
      expect(result.ideas[0].rankingScore).toBeGreaterThan(0);
      expect(result.metadata.totalIdeasGenerated).toBe(1);
      expect(result.metadata.processingSteps).toHaveLength(5);
    });

    it('should apply filtering based on minimum confidence', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-2',
        parameters: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate',
          minimumConfidence: 0.9, // Higher than mock idea confidence (0.85)
          maximumIdeas: 10
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.ideas).toHaveLength(0); // Should be filtered out
      expect(result.metadata.totalIdeasFiltered).toBe(1);
      expect(result.metadata.filteringCriteria).toContainEqual(
        expect.objectContaining({
          criterion: 'minimumConfidence',
          type: 'inclusion',
          value: 0.9
        })
      );
    });

    it('should apply sector filtering', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-3',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          sectors: ['Healthcare', 'Finance'], // Different from mock (Technology)
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.ideas).toHaveLength(0); // Should be filtered out
      expect(result.metadata.filteringCriteria).toContainEqual(
        expect.objectContaining({
          criterion: 'sectors',
          type: 'inclusion',
          value: ['Healthcare', 'Finance']
        })
      );
    });

    it('should apply risk tolerance filtering', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-4',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'conservative', // Mock idea is 'moderate' risk
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.ideas).toHaveLength(0); // Should be filtered out
      expect(result.metadata.filteringCriteria).toContainEqual(
        expect.objectContaining({
          criterion: 'riskTolerance',
          type: 'inclusion',
          value: 'conservative'
        })
      );
    });

    it('should exclude specified investments', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-5',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          excludedInvestments: ['AAPL'], // Mock investment ticker
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.ideas).toHaveLength(0); // Should be filtered out
      expect(result.metadata.filteringCriteria).toContainEqual(
        expect.objectContaining({
          criterion: 'excludedInvestments',
          type: 'exclusion',
          value: ['AAPL']
        })
      );
    });

    it('should limit results to maximum ideas', async () => {
      // Mock multiple ideas
      const multipleIdeas = Array.from({ length: 5 }, (_, i) => ({
        ...mockInvestmentIdea,
        id: `idea-${i + 1}`,
        title: `Investment Idea ${i + 1}`,
        confidenceScore: 0.8 - (i * 0.1) // Decreasing confidence
      }));

      mockSynthesisAgent.processSynthesisRequest = jest.fn().mockResolvedValue({
        investmentIdeas: multipleIdeas,
        executiveSummary: 'Multiple investment opportunities identified',
        detailedNarrative: 'Detailed analysis of multiple opportunities',
        keyInsights: ['Diverse opportunities available'],
        riskSummary: 'Varied risk profiles',
        recommendations: [],
        visualizations: [],
        coherenceScore: 0.9,
        confidence: 0.85,
        executionTime: 10000
      });

      mockInvestmentIdeaService.createInvestmentIdea = jest.fn()
        .mockImplementation((req: CreateInvestmentIdeaRequest) => {
          const idea = multipleIdeas.find(i => i.title === req.title) || mockInvestmentIdea;
          return Promise.resolve({
            idea,
            validation: { isValid: true, errors: [], warnings: [] }
          });
        });

      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-6',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 3 // Limit to 3 ideas
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.ideas).toHaveLength(3);
      expect(result.ideas[0].rank).toBe(1);
      expect(result.ideas[1].rank).toBe(2);
      expect(result.ideas[2].rank).toBe(3);
      
      // Should be sorted by ranking score (higher confidence = higher score)
      expect(result.ideas[0].confidenceScore).toBeGreaterThanOrEqual(result.ideas[1].confidenceScore);
      expect(result.ideas[1].confidenceScore).toBeGreaterThanOrEqual(result.ideas[2].confidenceScore);
    });

    it('should calculate ranking scores correctly', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-7',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 1
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.ideas).toHaveLength(1);
      
      const rankedIdea = result.ideas[0] as RankedInvestmentIdea;
      expect(rankedIdea.rankingScore).toBeGreaterThan(0);
      expect(rankedIdea.rankingFactors).toHaveLength(5);
      
      // Check that all ranking factors are present
      const factorNames = rankedIdea.rankingFactors.map(f => f.factor);
      expect(factorNames).toContain('confidence');
      expect(factorNames).toContain('risk-return');
      expect(factorNames).toContain('time-horizon');
      expect(factorNames).toContain('quality-novelty');
      expect(factorNames).toContain('market-timing');
      
      // Check that weights sum to 1
      const totalWeight = rankedIdea.rankingFactors.reduce((sum, f) => sum + f.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should update confidence distribution correctly', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-8',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 1
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.metadata.confidenceDistribution).toBeDefined();
      expect(result.metadata.confidenceDistribution.high).toBe(1); // 0.85 > 0.8
      expect(result.metadata.confidenceDistribution.medium).toBe(0);
      expect(result.metadata.confidenceDistribution.low).toBe(0);
      expect(result.metadata.confidenceDistribution.average).toBe(0.85);
    });

    it('should handle context parameters', async () => {
      const context: IdeaGenerationContext = {
        userProfile: {
          investmentExperience: 'advanced',
          preferredStrategies: ['growth', 'value'],
          historicalPreferences: ['technology', 'healthcare'],
          riskProfile: {
            riskCapacity: 80,
            riskTolerance: 75,
            timeHorizon: 'long',
            liquidityNeeds: 'low'
          }
        },
        marketContext: {
          currentConditions: ['bull-market', 'low-volatility'],
          volatilityLevel: 'low',
          marketTrend: 'bull',
          economicIndicators: { 'GDP-growth': 3.2, 'inflation': 2.1 },
          geopoliticalRisk: 'low'
        }
      };

      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-9',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 5
        },
        context
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result).toBeDefined();
      expect(mockPlanningAgent.createResearchPlan).toHaveBeenCalledWith(
        'req-9',
        expect.objectContaining({
          context: context
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockPlanningAgent.createResearchPlan = jest.fn().mockRejectedValue(new Error('Planning failed'));

      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-10',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 5
        }
      };

      await expect(orchestrationService.generateInvestmentIdeas(request))
        .rejects.toThrow('Investment idea generation failed: Planning failed');
    });

    it('should track processing metrics', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-11',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);

      expect(result.processingMetrics).toBeDefined();
      expect(result.processingMetrics.totalProcessingTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.processingSteps).toHaveLength(5);
      
      const stepNames = result.metadata.processingSteps.map(s => s.step);
      expect(stepNames).toEqual(['planning', 'research', 'analysis', 'compliance', 'synthesis']);
    });
  });

  describe('utility methods', () => {
    it('should track active requests', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-12',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 5
        }
      };

      // Start generation (don't await)
      const generationPromise = orchestrationService.generateInvestmentIdeas(request);

      // Check active request
      const activeRequest = orchestrationService.getActiveRequestStatus('req-12');
      expect(activeRequest).toBeDefined();
      expect(activeRequest?.requestId).toBe('req-12');

      // Wait for completion
      await generationPromise;

      // Should no longer be active
      const completedRequest = orchestrationService.getActiveRequestStatus('req-12');
      expect(completedRequest).toBeUndefined();
    });

    it('should cancel active requests', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-13',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          maximumIdeas: 5
        }
      };

      // Start generation (don't await)
      orchestrationService.generateInvestmentIdeas(request);

      // Cancel request
      const cancelled = orchestrationService.cancelRequest('req-13');
      expect(cancelled).toBe(true);

      // Should no longer be active
      const activeRequest = orchestrationService.getActiveRequestStatus('req-13');
      expect(activeRequest).toBeUndefined();
    });

    it('should provide processing statistics', () => {
      const stats = orchestrationService.getProcessingStatistics();
      
      expect(stats).toBeDefined();
      expect(stats.activeRequests).toBe(0);
      expect(typeof stats.totalProcessed).toBe('number');
      expect(typeof stats.averageProcessingTime).toBe('number');
    });
  });

  describe('filtering logic', () => {
    it('should correctly identify compatible time horizons', async () => {
      // Test with compatible time horizon
      const compatibleRequest: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-14',
        parameters: {
          investmentHorizon: 'medium', // Should be compatible with 'long' (within 1 level)
          riskTolerance: 'moderate',
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(compatibleRequest);
      expect(result.ideas).toHaveLength(1); // Should pass filter
    });

    it('should correctly identify compatible risk levels', async () => {
      // Test with compatible risk level
      const compatibleRequest: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-15',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate', // Should be compatible with 'moderate' risk level
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(compatibleRequest);
      expect(result.ideas).toHaveLength(1); // Should pass filter
    });

    it('should match asset class criteria correctly', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-16',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          assetClasses: ['stock'], // Should match mock investment type
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);
      expect(result.ideas).toHaveLength(1); // Should pass filter
    });

    it('should match target audience correctly', async () => {
      const request: IdeaGenerationRequest = {
        userId: 'user-1',
        requestId: 'req-17',
        parameters: {
          investmentHorizon: 'long',
          riskTolerance: 'moderate',
          targetAudience: ['retail'], // Should match mock idea target audience
          maximumIdeas: 5
        }
      };

      const result = await orchestrationService.generateInvestmentIdeas(request);
      expect(result.ideas).toHaveLength(1); // Should pass filter
    });
  });
});