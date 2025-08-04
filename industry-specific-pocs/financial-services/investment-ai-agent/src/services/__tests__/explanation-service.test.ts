/**
 * Unit tests for ExplanationService
 */

import { ExplanationService } from '../explanation-service';
import { InvestmentIdea } from '../../models/investment-idea';
import { DataPoint, AnalysisResult } from '../../models/analysis';
import { Investment } from '../../models/investment';

describe('ExplanationService', () => {
  let explanationService: ExplanationService;
  let mockInvestmentIdea: InvestmentIdea;
  let mockAnalysisResults: AnalysisResult[];

  beforeEach(() => {
    explanationService = new ExplanationService();
    
    // Create mock investment idea
    mockInvestmentIdea = {
      id: 'idea-123',
      version: 1,
      title: 'Tech Stock Growth Opportunity',
      description: 'Investment in emerging technology companies with strong growth potential',
      investments: [
        {
          id: 'inv-1',
          type: 'stock',
          name: 'TechCorp Inc.',
          ticker: 'TECH',
          description: 'Leading technology company',
          sector: 'Technology',
          industry: 'Software',
          marketCap: 50000000000,
          currentPrice: 150.50,
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
        } as Investment
      ],
      rationale: 'Strong fundamentals indicate growth potential. Technical analysis shows bullish patterns. Market sentiment is positive.',
      strategy: 'buy',
      timeHorizon: 'medium',
      confidenceScore: 0.85,
      generatedAt: new Date('2024-01-15T10:00:00Z'),
      lastUpdatedAt: new Date('2024-01-15T10:00:00Z'),
      potentialOutcomes: [
        {
          scenario: 'best',
          probability: 0.2,
          returnEstimate: 0.4,
          timeToRealization: 365,
          description: 'Exceptional growth scenario',
          conditions: ['Strong market conditions', 'Successful product launches'],
          keyRisks: ['Market volatility'],
          catalysts: ['New product release', 'Market expansion']
        },
        {
          scenario: 'expected',
          probability: 0.6,
          returnEstimate: 0.2,
          timeToRealization: 365,
          description: 'Expected growth scenario',
          conditions: ['Normal market conditions'],
          keyRisks: ['Competition'],
          catalysts: ['Steady growth']
        },
        {
          scenario: 'worst',
          probability: 0.2,
          returnEstimate: -0.1,
          timeToRealization: 365,
          description: 'Downside scenario',
          conditions: ['Market downturn'],
          keyRisks: ['Economic recession', 'Regulatory changes'],
          catalysts: []
        }
      ],
      supportingData: [
        {
          source: 'Financial Reports',
          type: 'fundamental',
          value: { revenue: 1000000000, growth: 0.15 },
          timestamp: new Date('2024-01-10T00:00:00Z'),
          reliability: 0.9
        },
        {
          source: 'Market Analysis',
          type: 'technical',
          value: { trend: 'bullish', rsi: 65 },
          timestamp: new Date('2024-01-12T00:00:00Z'),
          reliability: 0.8
        },
        {
          source: 'News Sentiment',
          type: 'sentiment',
          value: { score: 0.7, articles: 25 },
          timestamp: new Date('2024-01-14T00:00:00Z'),
          reliability: 0.7
        }
      ],
      counterArguments: [
        {
          description: 'High valuation multiples suggest overvaluation',
          strength: 'moderate',
          impact: 'medium',
          mitigationStrategy: 'Monitor valuation metrics closely',
          probability: 0.3
        },
        {
          description: 'Increased competition in the sector',
          strength: 'strong',
          impact: 'high',
          mitigationStrategy: 'Diversify across multiple tech companies',
          probability: 0.4
        }
      ],
      complianceStatus: {
        compliant: true,
        issues: [],
        regulationsChecked: ['SEC', 'FINRA'],
        timestamp: new Date('2024-01-15T09:00:00Z')
      },
      createdBy: 'claude-sonnet-3.7',
      tags: ['technology', 'growth', 'large-cap'],
      category: 'equity',
      riskLevel: 'moderate',
      targetAudience: ['institutional', 'high-net-worth'],
      metadata: {
        sourceModels: ['claude-sonnet-3.7', 'amazon-nova-pro'],
        processingTime: 5000,
        dataSourcesUsed: ['Financial Reports', 'Market Analysis', 'News Sentiment'],
        researchDepth: 'comprehensive',
        qualityScore: 85,
        noveltyScore: 70,
        marketConditionsAtGeneration: {
          volatilityIndex: 18,
          marketTrend: 'bull',
          economicIndicators: { gdp: 0.025, inflation: 0.03 },
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

    // Create mock analysis results
    mockAnalysisResults = [
      {
        id: 'analysis-1',
        investmentId: 'inv-1',
        analysisType: 'fundamental',
        timestamp: new Date('2024-01-15T09:30:00Z'),
        analyst: 'amazon-nova-pro',
        summary: 'Strong fundamental analysis',
        confidence: 0.88,
        details: {
          strengths: ['Strong revenue growth', 'Solid balance sheet'],
          weaknesses: ['High valuation'],
          opportunities: ['Market expansion'],
          threats: ['Competition'],
          keyMetrics: { pe: 25, roe: 0.15 },
          narratives: ['Growth story intact']
        },
        recommendations: [
          {
            action: 'buy',
            timeHorizon: 'medium',
            targetPrice: 180,
            confidence: 0.85,
            rationale: 'Strong fundamentals support higher valuation'
          }
        ],
        dataPoints: []
      }
    ];
  });

  describe('generateExplanation', () => {
    it('should generate comprehensive explanation for investment idea', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea, mockAnalysisResults);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^exp_\d+_[a-z0-9]+$/);
      expect(result.investmentIdeaId).toBe(mockInvestmentIdea.id);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.reasoning).toBeDefined();
      expect(result.dataAttribution).toBeDefined();
      expect(result.confidenceAnalysis).toBeDefined();
      expect(result.visualizations).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should generate explanation without analysis results', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.dataAttribution).toBeDefined();
      expect(result.confidenceAnalysis).toBeDefined();
    });
  });

  describe('reasoning explanation', () => {
    it('should extract decision path from rationale', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.reasoning.decisionPath).toBeDefined();
      expect(result.reasoning.decisionPath.length).toBeGreaterThan(0);
      
      const firstStep = result.reasoning.decisionPath[0];
      expect(firstStep.stepNumber).toBe(1);
      expect(firstStep.description).toBeDefined();
      expect(firstStep.reasoning).toBeDefined();
      expect(firstStep.confidence).toBeGreaterThan(0);
      expect(firstStep.impact).toMatch(/^(low|medium|high)$/);
    });

    it('should identify key factors', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.reasoning.keyFactors).toBeDefined();
      expect(result.reasoning.keyFactors.length).toBeGreaterThan(0);
      
      const firstFactor = result.reasoning.keyFactors[0];
      expect(firstFactor.name).toBeDefined();
      expect(firstFactor.description).toBeDefined();
      expect(firstFactor.weight).toBeGreaterThanOrEqual(0);
      expect(firstFactor.weight).toBeLessThanOrEqual(1);
      expect(firstFactor.direction).toMatch(/^(positive|negative|neutral)$/);
      expect(firstFactor.confidenceLevel).toBeGreaterThanOrEqual(0);
      expect(firstFactor.confidenceLevel).toBeLessThanOrEqual(1);
    });

    it('should build logical connections', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.reasoning.logicalChain).toBeDefined();
      expect(Array.isArray(result.reasoning.logicalChain)).toBe(true);
      
      if (result.reasoning.logicalChain.length > 0) {
        const connection = result.reasoning.logicalChain[0];
        expect(connection.from).toBeDefined();
        expect(connection.to).toBeDefined();
        expect(connection.relationship).toMatch(/^(causes|correlates|supports|contradicts|implies)$/);
        expect(connection.strength).toBeGreaterThanOrEqual(0);
        expect(connection.strength).toBeLessThanOrEqual(1);
      }
    });

    it('should extract assumptions', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.reasoning.assumptions).toBeDefined();
      expect(result.reasoning.assumptions.length).toBeGreaterThan(0);
      
      const assumption = result.reasoning.assumptions[0];
      expect(assumption.description).toBeDefined();
      expect(assumption.type).toMatch(/^(market|economic|company|regulatory|technical)$/);
      expect(assumption.confidence).toBeGreaterThanOrEqual(0);
      expect(assumption.confidence).toBeLessThanOrEqual(1);
      expect(assumption.impact).toMatch(/^(low|medium|high)$/);
    });

    it('should generate alternative scenarios', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.reasoning.alternativeScenarios).toBeDefined();
      expect(result.reasoning.alternativeScenarios.length).toBe(mockInvestmentIdea.counterArguments.length);
      
      const scenario = result.reasoning.alternativeScenarios[0];
      expect(scenario.name).toBeDefined();
      expect(scenario.description).toBeDefined();
      expect(scenario.probability).toBeGreaterThanOrEqual(0);
      expect(scenario.probability).toBeLessThanOrEqual(1);
      expect(scenario.outcome).toBeDefined();
    });
  });

  describe('data attribution', () => {
    it('should group data points by source', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.dataAttribution.sources).toBeDefined();
      expect(result.dataAttribution.sources.length).toBe(3); // Financial Reports, Market Analysis, News Sentiment
      
      const source = result.dataAttribution.sources[0];
      expect(source.sourceId).toBeDefined();
      expect(source.sourceName).toBeDefined();
      expect(source.sourceType).toMatch(/^(proprietary|public|market|news|research|regulatory)$/);
      expect(source.dataPoints).toBeDefined();
      expect(source.contribution).toBeGreaterThanOrEqual(0);
      expect(source.contribution).toBeLessThanOrEqual(1);
      expect(source.reliability).toBeGreaterThanOrEqual(0);
      expect(source.reliability).toBeLessThanOrEqual(1);
      expect(source.lastUpdated).toBeInstanceOf(Date);
      expect(source.accessLevel).toMatch(/^(public|restricted|proprietary)$/);
    });

    it('should assess reliability', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.dataAttribution.reliability).toBeDefined();
      expect(result.dataAttribution.reliability.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.dataAttribution.reliability.overallScore).toBeLessThanOrEqual(1);
      expect(result.dataAttribution.reliability.sourceReliability).toBeDefined();
      expect(result.dataAttribution.reliability.dataQuality).toBeDefined();
      
      const dataQuality = result.dataAttribution.reliability.dataQuality;
      expect(dataQuality.completeness).toBeGreaterThanOrEqual(0);
      expect(dataQuality.completeness).toBeLessThanOrEqual(1);
      expect(dataQuality.accuracy).toBeGreaterThanOrEqual(0);
      expect(dataQuality.accuracy).toBeLessThanOrEqual(1);
      expect(dataQuality.consistency).toBeGreaterThanOrEqual(0);
      expect(dataQuality.consistency).toBeLessThanOrEqual(1);
      expect(dataQuality.timeliness).toBeGreaterThanOrEqual(0);
      expect(dataQuality.timeliness).toBeLessThanOrEqual(1);
    });

    it('should analyze coverage', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.dataAttribution.coverage).toBeDefined();
      expect(result.dataAttribution.coverage.totalDataPoints).toBe(3);
      expect(result.dataAttribution.coverage.sourceDistribution).toBeDefined();
      expect(result.dataAttribution.coverage.topicCoverage).toBeDefined();
      expect(result.dataAttribution.coverage.gapsIdentified).toBeDefined();
      expect(Array.isArray(result.dataAttribution.coverage.gapsIdentified)).toBe(true);
    });

    it('should analyze freshness', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.dataAttribution.freshness).toBeDefined();
      expect(result.dataAttribution.freshness.averageAge).toBeGreaterThanOrEqual(0);
      expect(result.dataAttribution.freshness.oldestDataPoint).toBeInstanceOf(Date);
      expect(result.dataAttribution.freshness.newestDataPoint).toBeInstanceOf(Date);
      expect(Array.isArray(result.dataAttribution.freshness.staleDataWarnings)).toBe(true);
    });

    it('should identify data conflicts', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.dataAttribution.conflicts).toBeDefined();
      expect(Array.isArray(result.dataAttribution.conflicts)).toBe(true);
      
      if (result.dataAttribution.conflicts.length > 0) {
        const conflict = result.dataAttribution.conflicts[0];
        expect(conflict.description).toBeDefined();
        expect(conflict.conflictingSources).toBeDefined();
        expect(conflict.severity).toMatch(/^(low|medium|high)$/);
        expect(conflict.resolution).toBeDefined();
        expect(conflict.impact).toBeDefined();
      }
    });
  });

  describe('confidence analysis', () => {
    it('should calculate overall confidence', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea, mockAnalysisResults);

      expect(result.confidenceAnalysis.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.confidenceAnalysis.overallConfidence).toBeLessThanOrEqual(1);
    });

    it('should break down confidence by components', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea, mockAnalysisResults);

      const breakdown = result.confidenceAnalysis.confidenceBreakdown;
      expect(breakdown.dataQuality).toBeGreaterThanOrEqual(0);
      expect(breakdown.dataQuality).toBeLessThanOrEqual(1);
      expect(breakdown.modelReliability).toBeGreaterThanOrEqual(0);
      expect(breakdown.modelReliability).toBeLessThanOrEqual(1);
      expect(breakdown.marketConditions).toBeGreaterThanOrEqual(0);
      expect(breakdown.marketConditions).toBeLessThanOrEqual(1);
      expect(breakdown.timeHorizon).toBeGreaterThanOrEqual(0);
      expect(breakdown.timeHorizon).toBeLessThanOrEqual(1);
      expect(breakdown.complexity).toBeGreaterThanOrEqual(0);
      expect(breakdown.complexity).toBeLessThanOrEqual(1);
    });

    it('should identify uncertainty factors', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.confidenceAnalysis.uncertaintyFactors).toBeDefined();
      expect(result.confidenceAnalysis.uncertaintyFactors.length).toBeGreaterThan(0);
      
      const factor = result.confidenceAnalysis.uncertaintyFactors[0];
      expect(factor.factor).toBeDefined();
      expect(factor.description).toBeDefined();
      expect(factor.impact).toBeGreaterThanOrEqual(0);
      expect(factor.impact).toBeLessThanOrEqual(1);
      expect(Array.isArray(factor.mitigation)).toBe(true);
    });

    it('should calculate confidence interval', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      const interval = result.confidenceAnalysis.confidenceInterval;
      expect(interval.lower).toBeGreaterThanOrEqual(0);
      expect(interval.upper).toBeLessThanOrEqual(1);
      expect(interval.lower).toBeLessThan(interval.upper);
      expect(interval.level).toBeGreaterThan(0);
      expect(interval.level).toBeLessThanOrEqual(1);
      expect(interval.methodology).toBeDefined();
      expect(Array.isArray(interval.assumptions)).toBe(true);
    });

    it('should perform sensitivity analysis', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      const sensitivity = result.confidenceAnalysis.sensitivityAnalysis;
      expect(sensitivity.keyVariables).toBeDefined();
      expect(sensitivity.keyVariables.length).toBeGreaterThan(0);
      expect(sensitivity.scenarios).toBeDefined();
      expect(sensitivity.scenarios.length).toBeGreaterThan(0);
      expect(sensitivity.robustness).toBeGreaterThanOrEqual(0);
      expect(sensitivity.robustness).toBeLessThanOrEqual(1);
      
      const variable = sensitivity.keyVariables[0];
      expect(variable.name).toBeDefined();
      expect(variable.baseValue).toBeDefined();
      expect(variable.range).toBeDefined();
      expect(variable.range.min).toBeLessThan(variable.range.max);
      expect(variable.impact).toBeGreaterThanOrEqual(0);
      expect(variable.impact).toBeLessThanOrEqual(1);
      
      const scenario = sensitivity.scenarios[0];
      expect(scenario.name).toBeDefined();
      expect(scenario.changes).toBeDefined();
      expect(scenario.resultingConfidence).toBeGreaterThanOrEqual(0);
      expect(scenario.resultingConfidence).toBeLessThanOrEqual(1);
    });
  });

  describe('visualization suggestions', () => {
    it('should generate visualization suggestions', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.visualizations).toBeDefined();
      expect(result.visualizations.length).toBeGreaterThan(0);
      
      const visualization = result.visualizations[0];
      expect(visualization.type).toMatch(/^(decision-tree|factor-importance|confidence-bands|data-flow|scenario-comparison)$/);
      expect(visualization.title).toBeDefined();
      expect(visualization.description).toBeDefined();
      expect(visualization.data).toBeDefined();
      expect(visualization.priority).toMatch(/^(low|medium|high)$/);
    });

    it('should include high-priority visualizations', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      const highPriorityViz = result.visualizations.filter(v => v.priority === 'high');
      expect(highPriorityViz.length).toBeGreaterThan(0);
    });
  });

  describe('explanation summary', () => {
    it('should generate comprehensive summary', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeGreaterThan(100);
      expect(result.summary).toContain('key factors');
      expect(result.summary).toContain('data sources');
      expect(result.summary).toContain('confidence');
    });

    it('should include key metrics in summary', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      expect(result.summary).toContain('%'); // Should contain percentage values
      expect(result.summary).toMatch(/\d+/); // Should contain numbers
    });
  });

  describe('edge cases', () => {
    it('should handle investment idea with no supporting data', async () => {
      const ideaWithNoData = {
        ...mockInvestmentIdea,
        supportingData: []
      };

      const result = await explanationService.generateExplanation(ideaWithNoData);
      
      expect(result).toBeDefined();
      expect(result.dataAttribution.sources).toHaveLength(0);
      expect(result.dataAttribution.coverage.totalDataPoints).toBe(0);
    });

    it('should handle investment idea with no counter-arguments', async () => {
      const ideaWithNoCounterArgs = {
        ...mockInvestmentIdea,
        counterArguments: []
      };

      const result = await explanationService.generateExplanation(ideaWithNoCounterArgs);
      
      expect(result).toBeDefined();
      expect(result.reasoning.alternativeScenarios).toHaveLength(0);
      expect(result.dataAttribution.conflicts).toHaveLength(0);
    });

    it('should handle investment idea with minimal rationale', async () => {
      const ideaWithMinimalRationale = {
        ...mockInvestmentIdea,
        rationale: 'Good investment.'
      };

      const result = await explanationService.generateExplanation(ideaWithMinimalRationale);
      
      expect(result).toBeDefined();
      expect(result.reasoning.decisionPath.length).toBeGreaterThan(0);
    });

    it('should handle investment idea with no potential outcomes', async () => {
      const ideaWithNoOutcomes = {
        ...mockInvestmentIdea,
        potentialOutcomes: []
      };

      const result = await explanationService.generateExplanation(ideaWithNoOutcomes);
      
      expect(result).toBeDefined();
      expect(result.confidenceAnalysis.confidenceInterval).toBeDefined();
      // Should use default confidence interval calculation
    });
  });

  describe('data quality validation', () => {
    it('should validate explanation result structure', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      // Validate all required fields are present
      expect(result.id).toBeDefined();
      expect(result.investmentIdeaId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.dataAttribution).toBeDefined();
      expect(result.confidenceAnalysis).toBeDefined();
      expect(result.visualizations).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should ensure confidence values are within valid range', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      // Check all confidence values are between 0 and 1
      expect(result.confidenceAnalysis.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.confidenceAnalysis.overallConfidence).toBeLessThanOrEqual(1);
      
      result.reasoning.keyFactors.forEach(factor => {
        expect(factor.weight).toBeGreaterThanOrEqual(0);
        expect(factor.weight).toBeLessThanOrEqual(1);
        expect(factor.confidenceLevel).toBeGreaterThanOrEqual(0);
        expect(factor.confidenceLevel).toBeLessThanOrEqual(1);
      });
      
      result.dataAttribution.sources.forEach(source => {
        expect(source.contribution).toBeGreaterThanOrEqual(0);
        expect(source.contribution).toBeLessThanOrEqual(1);
        expect(source.reliability).toBeGreaterThanOrEqual(0);
        expect(source.reliability).toBeLessThanOrEqual(1);
      });
    });

    it('should ensure probability values are within valid range', async () => {
      const result = await explanationService.generateExplanation(mockInvestmentIdea);

      result.reasoning.alternativeScenarios.forEach(scenario => {
        expect(scenario.probability).toBeGreaterThanOrEqual(0);
        expect(scenario.probability).toBeLessThanOrEqual(1);
      });
      
      result.reasoning.assumptions.forEach(assumption => {
        expect(assumption.confidence).toBeGreaterThanOrEqual(0);
        expect(assumption.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});