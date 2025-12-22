/**
 * Tests for Investment Idea Validation
 */

import { InvestmentIdeaValidator } from '../../utils/investment-idea-validation';
import {
  InvestmentIdea,
  CreateInvestmentIdeaRequest,
  UpdateInvestmentIdeaRequest,
  Outcome,
  CounterArgument
} from '../../models/investment-idea';
import { Investment } from '../../models/investment';

describe('InvestmentIdeaValidator', () => {
  const mockInvestment: Investment = {
    id: 'inv_1',
    type: 'stock',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    description: 'Technology company',
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

  const mockOutcome: Outcome = {
    scenario: 'expected',
    probability: 0.6,
    returnEstimate: 0.15,
    timeToRealization: 365,
    description: 'Expected scenario',
    conditions: ['Market stability'],
    keyRisks: ['Market volatility'],
    catalysts: ['Product launch']
  };

  const mockCounterArgument: CounterArgument = {
    description: 'Market volatility risk',
    strength: 'moderate',
    impact: 'medium',
    probability: 0.3
  };

  describe('validateCreateRequest', () => {
    const validCreateRequest: CreateInvestmentIdeaRequest = {
      title: 'Apple Growth Strategy',
      description: 'Long-term growth investment in Apple Inc.',
      investments: [mockInvestment],
      rationale: 'Strong fundamentals and growth prospects',
      strategy: 'buy',
      timeHorizon: 'long',
      confidenceScore: 0.8,
      potentialOutcomes: [mockOutcome],
      supportingData: [],
      counterArguments: [mockCounterArgument],
      tags: ['technology', 'growth'],
      category: 'equity',
      riskLevel: 'moderate',
      targetAudience: ['retail', 'institutional'],
      createdBy: 'claude-sonnet-3.7'
    };

    it('should validate a valid create request', () => {
      const result = InvestmentIdeaValidator.validateCreateRequest(validCreateRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require title', () => {
      const request = { ...validCreateRequest, title: '' };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'title',
          code: 'TITLE_REQUIRED'
        })
      );
    });

    it('should require description', () => {
      const request = { ...validCreateRequest, description: '' };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'description',
          code: 'DESCRIPTION_REQUIRED'
        })
      );
    });

    it('should require rationale', () => {
      const request = { ...validCreateRequest, rationale: '' };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'rationale',
          code: 'RATIONALE_REQUIRED'
        })
      );
    });

    it('should require createdBy', () => {
      const request = { ...validCreateRequest, createdBy: '' };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'createdBy',
          code: 'CREATED_BY_REQUIRED'
        })
      );
    });

    it('should require at least one investment', () => {
      const request = { ...validCreateRequest, investments: [] };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'investments',
          code: 'INVESTMENTS_REQUIRED'
        })
      );
    });

    it('should validate confidence score range', () => {
      const request = { ...validCreateRequest, confidenceScore: 1.5 };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'confidenceScore',
          code: 'INVALID_CONFIDENCE_SCORE'
        })
      );
    });

    it('should warn about low confidence score', () => {
      const request = { ...validCreateRequest, confidenceScore: 0.2 };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'confidenceScore',
          code: 'LOW_CONFIDENCE_WARNING'
        })
      );
    });

    it('should validate investment strategy enum', () => {
      const request = { ...validCreateRequest, strategy: 'invalid' as any };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'strategy',
          code: 'INVALID_STRATEGY'
        })
      );
    });

    it('should validate time horizon enum', () => {
      const request = { ...validCreateRequest, timeHorizon: 'invalid' as any };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'timeHorizon',
          code: 'INVALID_TIME_HORIZON'
        })
      );
    });

    it('should validate category enum', () => {
      const request = { ...validCreateRequest, category: 'invalid' as any };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'category',
          code: 'INVALID_CATEGORY'
        })
      );
    });

    it('should validate risk level enum', () => {
      const request = { ...validCreateRequest, riskLevel: 'invalid' as any };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'riskLevel',
          code: 'INVALID_RISK_LEVEL'
        })
      );
    });

    it('should validate target audience enum', () => {
      const request = { ...validCreateRequest, targetAudience: ['invalid'] as any };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'targetAudience',
          code: 'INVALID_TARGET_AUDIENCE'
        })
      );
    });

    it('should validate outcome probabilities', () => {
      const invalidOutcome = { ...mockOutcome, probability: 1.5 };
      const request = { ...validCreateRequest, potentialOutcomes: [invalidOutcome] };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'potentialOutcomes[0].probability',
          code: 'INVALID_OUTCOME_PROBABILITY'
        })
      );
    });

    it('should validate counter argument probabilities', () => {
      const invalidCounterArg = { ...mockCounterArgument, probability: -0.1 };
      const request = { ...validCreateRequest, counterArguments: [invalidCounterArg] };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'counterArguments[0].probability',
          code: 'INVALID_COUNTER_ARGUMENT_PROBABILITY'
        })
      );
    });

    it('should warn about strategy-time horizon mismatch', () => {
      const request = { ...validCreateRequest, strategy: 'value' as const, timeHorizon: 'short' as const };
      const result = InvestmentIdeaValidator.validateCreateRequest(request);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'strategy',
          code: 'STRATEGY_TIME_HORIZON_MISMATCH'
        })
      );
    });
  });

  describe('validateUpdateRequest', () => {
    const validUpdateRequest: UpdateInvestmentIdeaRequest = {
      id: 'idea_123',
      title: 'Updated Apple Strategy',
      confidenceScore: 0.9,
      updatedBy: 'claude-sonnet-3.7'
    };

    it('should validate a valid update request', () => {
      const result = InvestmentIdeaValidator.validateUpdateRequest(validUpdateRequest);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require id', () => {
      const request = { ...validUpdateRequest, id: '' };
      const result = InvestmentIdeaValidator.validateUpdateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'id',
          code: 'ID_REQUIRED'
        })
      );
    });

    it('should require updatedBy', () => {
      const request = { ...validUpdateRequest, updatedBy: '' };
      const result = InvestmentIdeaValidator.validateUpdateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'updatedBy',
          code: 'UPDATED_BY_REQUIRED'
        })
      );
    });

    it('should not allow empty title if provided', () => {
      const request = { ...validUpdateRequest, title: '' };
      const result = InvestmentIdeaValidator.validateUpdateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'title',
          code: 'TITLE_EMPTY'
        })
      );
    });

    it('should validate confidence score if provided', () => {
      const request = { ...validUpdateRequest, confidenceScore: 2.0 };
      const result = InvestmentIdeaValidator.validateUpdateRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'confidenceScore',
          code: 'INVALID_CONFIDENCE_SCORE'
        })
      );
    });
  });

  describe('validateInvestmentIdea', () => {
    const validIdea: InvestmentIdea = {
      id: 'idea_123',
      version: 1,
      title: 'Apple Growth Strategy',
      description: 'Long-term growth investment in Apple Inc.',
      investments: [mockInvestment],
      rationale: 'Strong fundamentals and growth prospects',
      strategy: 'buy',
      timeHorizon: 'long',
      confidenceScore: 0.8,
      generatedAt: new Date('2024-01-01'),
      lastUpdatedAt: new Date('2024-01-01'),
      potentialOutcomes: [
        { ...mockOutcome, scenario: 'best', probability: 0.2 },
        { ...mockOutcome, scenario: 'expected', probability: 0.6 },
        { ...mockOutcome, scenario: 'worst', probability: 0.2 }
      ],
      supportingData: [],
      counterArguments: [mockCounterArgument],
      complianceStatus: {
        compliant: true,
        issues: [],
        regulationsChecked: ['SEC'],
        timestamp: new Date()
      },
      createdBy: 'claude-sonnet-3.7',
      tags: ['technology', 'growth'],
      category: 'equity',
      riskLevel: 'moderate',
      targetAudience: ['retail'],
      metadata: {
        sourceModels: ['claude-sonnet-3.7'],
        processingTime: 1000,
        dataSourcesUsed: ['market-data'],
        researchDepth: 'standard',
        qualityScore: 85,
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

    it('should validate a valid investment idea', () => {
      const result = InvestmentIdeaValidator.validateInvestmentIdea(validIdea);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate expiration date is after generation date', () => {
      const idea = {
        ...validIdea,
        expiresAt: new Date('2023-12-31') // Before generation date
      };
      const result = InvestmentIdeaValidator.validateInvestmentIdea(idea);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'expiresAt',
          code: 'INVALID_EXPIRATION_DATE'
        })
      );
    });

    it('should warn about outcome probabilities not summing to 1', () => {
      const idea = {
        ...validIdea,
        potentialOutcomes: [
          { ...mockOutcome, scenario: 'best' as const, probability: 0.3 },
          { ...mockOutcome, scenario: 'expected' as const, probability: 0.3 },
          { ...mockOutcome, scenario: 'worst' as const, probability: 0.3 }
        ]
      };
      const result = InvestmentIdeaValidator.validateInvestmentIdea(idea);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'potentialOutcomes',
          code: 'PROBABILITY_SUM_WARNING'
        })
      );
    });

    it('should validate version is at least 1', () => {
      const idea = { ...validIdea, version: 0 };
      const result = InvestmentIdeaValidator.validateInvestmentIdea(idea);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'version',
          code: 'INVALID_VERSION'
        })
      );
    });

    it('should validate compliance status contradiction', () => {
      const idea = {
        ...validIdea,
        complianceStatus: {
          compliant: true,
          issues: [{
            severity: 'critical' as const,
            regulation: 'SEC Rule 1',
            description: 'Critical issue',
            estimatedImpact: 'high' as const
          }],
          regulationsChecked: ['SEC'],
          timestamp: new Date()
        }
      };
      const result = InvestmentIdeaValidator.validateInvestmentIdea(idea);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'complianceStatus',
          code: 'COMPLIANCE_CONTRADICTION'
        })
      );
    });

    it('should warn about future data points', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const idea = {
        ...validIdea,
        supportingData: [{
          source: 'test',
          type: 'fundamental' as const,
          value: 100,
          timestamp: futureDate,
          reliability: 0.9
        }]
      };
      const result = InvestmentIdeaValidator.validateInvestmentIdea(idea);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          field: 'supportingData',
          code: 'FUTURE_DATA_POINTS'
        })
      );
    });
  });
});