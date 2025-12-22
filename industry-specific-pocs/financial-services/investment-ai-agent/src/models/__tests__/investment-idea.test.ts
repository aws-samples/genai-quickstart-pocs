/**
 * Tests for InvestmentIdea model and related types
 */

import {
  InvestmentIdea,
  InvestmentStrategy,
  TimeHorizon,
  InvestmentCategory,
  RiskLevel,
  Outcome,
  CounterArgument,
  ComplianceResult,
  ComplianceIssue,
  CreateInvestmentIdeaRequest,
  UpdateInvestmentIdeaRequest
} from '../investment-idea';

import { DataPoint } from '../analysis';

describe('InvestmentIdea Model', () => {
  const mockInvestmentIdea: InvestmentIdea = {
    id: 'idea-123',
    version: 1,
    title: 'Test Investment Idea',
    description: 'A test investment idea for unit testing',
    investments: [],
    rationale: 'Strong fundamentals and growth potential',
    strategy: 'buy',
    timeHorizon: 'medium',
    confidenceScore: 0.85,
    generatedAt: new Date('2023-06-01'),
    lastUpdatedAt: new Date('2023-06-01'),
    potentialOutcomes: [
      {
        scenario: 'best',
        probability: 0.2,
        returnEstimate: 0.35,
        timeToRealization: 365,
        description: 'Optimistic scenario',
        conditions: ['Strong market conditions'],
        keyRisks: ['Market volatility'],
        catalysts: ['Earnings growth']
      }
    ],
    supportingData: [
      {
        source: 'market-analysis',
        type: 'fundamental',
        value: { revenue_growth: 0.25 },
        timestamp: new Date('2023-05-30'),
        reliability: 0.9
      }
    ],
    counterArguments: [
      {
        description: 'High valuation risk',
        strength: 'moderate',
        impact: 'medium',
        probability: 0.3,
        mitigationStrategy: 'Focus on companies with proven revenue'
      }
    ],
    complianceStatus: {
      compliant: true,
      issues: [],
      regulationsChecked: ['SEC-RULE-1'],
      timestamp: new Date('2023-06-01')
    },
    createdBy: 'claude-sonnet-3.7',
    tags: ['technology', 'growth'],
    category: 'equity',
    riskLevel: 'moderate',
    targetAudience: ['institutional'],
    metadata: {
      sourceModels: ['claude-sonnet-3.7'],
      processingTime: 5000,
      dataSourcesUsed: ['market-data'],
      researchDepth: 'standard',
      qualityScore: 85,
      noveltyScore: 70,
      marketConditionsAtGeneration: {
        volatilityIndex: 25,
        marketTrend: 'bull',
        economicIndicators: { gdp_growth: 2.5 },
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

  describe('InvestmentIdea interface', () => {
    it('should create a valid investment idea object', () => {
      expect(mockInvestmentIdea).toBeDefined();
      expect(mockInvestmentIdea.id).toBe('idea-123');
      expect(mockInvestmentIdea.version).toBe(1);
      expect(mockInvestmentIdea.title).toBe('Test Investment Idea');
      expect(mockInvestmentIdea.strategy).toBe('buy');
      expect(mockInvestmentIdea.timeHorizon).toBe('medium');
      expect(mockInvestmentIdea.confidenceScore).toBe(0.85);
      expect(mockInvestmentIdea.category).toBe('equity');
      expect(mockInvestmentIdea.riskLevel).toBe('moderate');
    });

    it('should have required tracking information', () => {
      expect(mockInvestmentIdea.trackingInfo).toBeDefined();
      expect(mockInvestmentIdea.trackingInfo.status).toBe('active');
      expect(mockInvestmentIdea.trackingInfo.views).toBe(0);
      expect(mockInvestmentIdea.trackingInfo.implementations).toBe(0);
    });

    it('should have metadata', () => {
      expect(mockInvestmentIdea.metadata).toBeDefined();
      expect(mockInvestmentIdea.metadata.qualityScore).toBe(85);
      expect(mockInvestmentIdea.metadata.noveltyScore).toBe(70);
      expect(mockInvestmentIdea.metadata.researchDepth).toBe('standard');
    });
  });

  describe('Type definitions', () => {
    it('should support all investment strategies', () => {
      const strategies: InvestmentStrategy[] = [
        'buy', 'sell', 'hold', 'short', 'long', 'hedge', 
        'arbitrage', 'pairs-trade', 'momentum', 'value', 
        'growth', 'income', 'complex'
      ];

      strategies.forEach(strategy => {
        const idea: Partial<InvestmentIdea> = { strategy };
        expect(idea.strategy).toBe(strategy);
      });
    });

    it('should support all time horizons', () => {
      const timeHorizons: TimeHorizon[] = [
        'intraday', 'short', 'medium', 'long', 'very-long'
      ];

      timeHorizons.forEach(timeHorizon => {
        const idea: Partial<InvestmentIdea> = { timeHorizon };
        expect(idea.timeHorizon).toBe(timeHorizon);
      });
    });

    it('should support all investment categories', () => {
      const categories: InvestmentCategory[] = [
        'equity', 'fixed-income', 'commodity', 'currency',
        'alternative', 'mixed', 'thematic', 'sector-rotation', 'macro'
      ];

      categories.forEach(category => {
        const idea: Partial<InvestmentIdea> = { category };
        expect(idea.category).toBe(category);
      });
    });

    it('should support all risk levels', () => {
      const riskLevels: RiskLevel[] = [
        'very-low', 'low', 'moderate', 'high', 'very-high'
      ];

      riskLevels.forEach(riskLevel => {
        const idea: Partial<InvestmentIdea> = { riskLevel };
        expect(idea.riskLevel).toBe(riskLevel);
      });
    });
  });

  describe('Outcome interface', () => {
    it('should create valid outcome objects', () => {
      const outcome: Outcome = {
        scenario: 'expected',
        probability: 0.6,
        returnEstimate: 0.15,
        timeToRealization: 180,
        description: 'Expected scenario',
        conditions: ['Normal market conditions'],
        keyRisks: ['Market volatility'],
        catalysts: ['Earnings growth']
      };

      expect(outcome.scenario).toBe('expected');
      expect(outcome.probability).toBe(0.6);
      expect(outcome.returnEstimate).toBe(0.15);
      expect(outcome.timeToRealization).toBe(180);
    });

    it('should support all scenario types', () => {
      const scenarios: Array<'best' | 'expected' | 'worst'> = ['best', 'expected', 'worst'];
      
      scenarios.forEach(scenario => {
        const outcome: Partial<Outcome> = { scenario };
        expect(outcome.scenario).toBe(scenario);
      });
    });
  });

  describe('CounterArgument interface', () => {
    it('should create valid counter argument objects', () => {
      const counterArg: CounterArgument = {
        description: 'High valuation risk',
        strength: 'moderate',
        impact: 'medium',
        probability: 0.3,
        mitigationStrategy: 'Focus on value stocks'
      };

      expect(counterArg.description).toBe('High valuation risk');
      expect(counterArg.strength).toBe('moderate');
      expect(counterArg.impact).toBe('medium');
      expect(counterArg.probability).toBe(0.3);
    });

    it('should support all strength levels', () => {
      const strengths: Array<'weak' | 'moderate' | 'strong'> = ['weak', 'moderate', 'strong'];
      
      strengths.forEach(strength => {
        const counterArg: Partial<CounterArgument> = { strength };
        expect(counterArg.strength).toBe(strength);
      });
    });
  });

  describe('ComplianceResult interface', () => {
    it('should create valid compliance result objects', () => {
      const complianceResult: ComplianceResult = {
        compliant: true,
        issues: [],
        regulationsChecked: ['SEC-RULE-1'],
        timestamp: new Date('2023-06-01')
      };

      expect(complianceResult.compliant).toBe(true);
      expect(complianceResult.issues).toHaveLength(0);
      expect(complianceResult.regulationsChecked).toContain('SEC-RULE-1');
    });

    it('should support compliance issues', () => {
      const issue: ComplianceIssue = {
        severity: 'warning',
        regulation: 'SEC-RULE-2',
        description: 'Potential conflict of interest',
        remediation: 'Disclose potential conflicts',
        estimatedImpact: 'medium'
      };

      expect(issue.severity).toBe('warning');
      expect(issue.estimatedImpact).toBe('medium');
    });
  });

  describe('CreateInvestmentIdeaRequest interface', () => {
    it('should create valid creation request', () => {
      const request: CreateInvestmentIdeaRequest = {
        title: 'New Investment Idea',
        description: 'A new investment opportunity',
        investments: [],
        rationale: 'Strong fundamentals',
        strategy: 'buy',
        timeHorizon: 'medium',
        confidenceScore: 0.8,
        potentialOutcomes: [],
        supportingData: [],
        counterArguments: [],
        category: 'equity',
        riskLevel: 'moderate',
        targetAudience: ['institutional'],
        createdBy: 'analyst-123'
      };

      expect(request.title).toBe('New Investment Idea');
      expect(request.strategy).toBe('buy');
      expect(request.category).toBe('equity');
      expect(request.riskLevel).toBe('moderate');
    });
  });

  describe('UpdateInvestmentIdeaRequest interface', () => {
    it('should create valid update request', () => {
      const request: UpdateInvestmentIdeaRequest = {
        id: 'idea-123',
        title: 'Updated Investment Idea',
        confidenceScore: 0.9,
        updatedBy: 'analyst-456',
        reason: 'New market data available'
      };

      expect(request.id).toBe('idea-123');
      expect(request.title).toBe('Updated Investment Idea');
      expect(request.confidenceScore).toBe(0.9);
      expect(request.reason).toBe('New market data available');
    });
  });
});