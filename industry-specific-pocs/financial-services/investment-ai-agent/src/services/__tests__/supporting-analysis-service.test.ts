/**
 * Tests for Supporting Analysis Service
 */

import { SupportingAnalysisService } from '../supporting-analysis-service';
import { Investment } from '../../models/investment';
import { InvestmentIdea, TimeHorizon, RiskLevel } from '../../models/investment-idea';
import { DataPoint } from '../../models/analysis';

describe('SupportingAnalysisService', () => {
  let service: SupportingAnalysisService;
  let mockInvestment: Investment;
  let mockInvestmentIdea: InvestmentIdea;

  beforeEach(() => {
    service = new SupportingAnalysisService();
    
    // Create mock investment
    mockInvestment = {
      id: 'test-investment-1',
      type: 'stock',
      name: 'Test Company',
      ticker: 'TEST',
      description: 'A test company',
      sector: 'Technology',
      industry: 'Software',
      marketCap: 1000000000,
      currentPrice: 100,
      historicalPerformance: [
        {
          date: new Date('2024-01-01'),
          open: 95,
          high: 105,
          low: 90,
          close: 100,
          volume: 1000000,
          adjustedClose: 100
        },
        {
          date: new Date('2024-01-02'),
          open: 100,
          high: 110,
          low: 98,
          close: 105,
          volume: 1200000,
          adjustedClose: 105
        }
      ],
      fundamentals: {
        eps: 5.0,
        peRatio: 20,
        pbRatio: 2.5,
        dividendYield: 0.02,
        revenueGrowth: 0.15,
        profitMargin: 0.12,
        debtToEquity: 0.3,
        freeCashFlow: 50000000,
        returnOnEquity: 0.18,
        returnOnAssets: 0.10
      },
      technicalIndicators: {
        movingAverages: {
          ma50: 98,
          ma100: 95,
          ma200: 90
        },
        relativeStrengthIndex: 55,
        macdLine: 2.5,
        macdSignal: 2.0,
        macdHistogram: 0.5,
        bollingerBands: {
          upper: 110,
          middle: 100,
          lower: 90
        },
        averageVolume: 1100000
      },
      sentimentAnalysis: {
        overallSentiment: 'positive',
        sentimentScore: 0.3,
        sentimentTrend: 'improving',
        newsVolume: 50,
        socialMediaMentions: 1000,
        analystRecommendations: {
          buy: 8,
          hold: 4,
          sell: 1
        },
        insiderTrading: {
          buying: 100000,
          selling: 50000
        }
      },
      riskMetrics: {
        volatility: 0.25,
        beta: 1.2,
        sharpeRatio: 0.8,
        drawdown: 0.15,
        var: -0.05,
        correlations: {}
      },
      relatedInvestments: []
    };

    // Create mock investment idea
    mockInvestmentIdea = {
      id: 'test-idea-1',
      version: 1,
      title: 'Test Investment Idea',
      description: 'A test investment idea',
      investments: [mockInvestment],
      rationale: 'Strong fundamentals and positive sentiment',
      strategy: 'buy',
      timeHorizon: 'medium',
      confidenceScore: 0.75,
      generatedAt: new Date(),
      lastUpdatedAt: new Date(),
      potentialOutcomes: [
        {
          scenario: 'best',
          probability: 0.2,
          returnEstimate: 0.25,
          timeToRealization: 365,
          description: 'Best case scenario',
          conditions: ['Strong market', 'Excellent execution'],
          keyRisks: ['Market correction'],
          catalysts: ['Product launch', 'Market expansion']
        },
        {
          scenario: 'expected',
          probability: 0.6,
          returnEstimate: 0.12,
          timeToRealization: 365,
          description: 'Expected scenario',
          conditions: ['Normal market conditions'],
          keyRisks: ['Competition', 'Market volatility'],
          catalysts: ['Steady growth']
        },
        {
          scenario: 'worst',
          probability: 0.2,
          returnEstimate: -0.10,
          timeToRealization: 365,
          description: 'Worst case scenario',
          conditions: ['Market downturn'],
          keyRisks: ['Recession', 'Execution failure'],
          catalysts: []
        }
      ],
      supportingData: [
        {
          source: 'bloomberg',
          type: 'fundamental',
          value: { eps: 5.0 },
          timestamp: new Date(),
          reliability: 0.9
        }
      ],
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
      targetAudience: ['institutional'],
      metadata: {
        sourceModels: ['test-model'],
        processingTime: 1000,
        dataSourcesUsed: ['bloomberg'],
        researchDepth: 'standard',
        qualityScore: 75,
        noveltyScore: 60,
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
  });

  describe('calculateKeyMetrics', () => {
    it('should calculate comprehensive key metrics', async () => {
      const metrics = await service.calculateKeyMetrics(mockInvestmentIdea);

      expect(metrics).toBeDefined();
      expect(typeof metrics.expectedReturn).toBe('number');
      expect(typeof metrics.volatility).toBe('number');
      expect(typeof metrics.sharpeRatio).toBe('number');
      expect(typeof metrics.maxDrawdown).toBe('number');
      expect(typeof metrics.valueAtRisk).toBe('number');
      
      // Portfolio metrics
      expect(typeof metrics.diversificationRatio).toBe('number');
      expect(typeof metrics.correlationScore).toBe('number');
      expect(typeof metrics.concentrationRisk).toBe('number');
      
      // Quality metrics
      expect(typeof metrics.fundamentalScore).toBe('number');
      expect(typeof metrics.technicalScore).toBe('number');
      expect(typeof metrics.sentimentScore).toBe('number');
      
      // Risk-adjusted metrics
      expect(typeof metrics.informationRatio).toBe('number');
      expect(typeof metrics.calmarRatio).toBe('number');
      expect(typeof metrics.sortinoRatio).toBe('number');
      
      // Time-based metrics
      expect(typeof metrics.timeToBreakeven).toBe('number');
      expect(typeof metrics.optimalHoldingPeriod).toBe('number');
      
      // Confidence metrics
      expect(typeof metrics.dataQuality).toBe('number');
      expect(typeof metrics.modelConfidence).toBe('number');
      expect(typeof metrics.marketConditionSuitability).toBe('number');
    });

    it('should calculate expected return from potential outcomes', async () => {
      const metrics = await service.calculateKeyMetrics(mockInvestmentIdea);
      
      // Expected return should be probability-weighted
      const expectedReturn = (0.2 * 0.25) + (0.6 * 0.12) + (0.2 * -0.10);
      expect(metrics.expectedReturn).toBeCloseTo(expectedReturn, 2);
    });

    it('should handle investment with no historical data', async () => {
      const investmentWithoutHistory = { ...mockInvestment, historicalPerformance: [] };
      const ideaWithoutHistory = { ...mockInvestmentIdea, investments: [investmentWithoutHistory] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutHistory);
      
      expect(metrics).toBeDefined();
      expect(metrics.maxDrawdown).toBe(0);
    });

    it('should calculate fundamental score correctly', async () => {
      const metrics = await service.calculateKeyMetrics(mockInvestmentIdea);
      
      // Should be above base score due to good fundamentals
      expect(metrics.fundamentalScore).toBeGreaterThan(50);
      expect(metrics.fundamentalScore).toBeLessThanOrEqual(100);
    });

    it('should calculate technical score correctly', async () => {
      const metrics = await service.calculateKeyMetrics(mockInvestmentIdea);
      
      // Should be above base score due to positive technical indicators
      expect(metrics.technicalScore).toBeGreaterThan(50);
      expect(metrics.technicalScore).toBeLessThanOrEqual(100);
    });

    it('should calculate sentiment score correctly', async () => {
      const metrics = await service.calculateKeyMetrics(mockInvestmentIdea);
      
      // Should be above base score due to positive sentiment
      expect(metrics.sentimentScore).toBeGreaterThan(50);
      expect(metrics.sentimentScore).toBeLessThanOrEqual(100);
    });
  });

  describe('assessRisk', () => {
    it('should perform comprehensive risk assessment', async () => {
      const riskAssessment = await service.assessRisk(mockInvestmentIdea);

      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.overallRiskLevel).toBeDefined();
      expect(typeof riskAssessment.riskScore).toBe('number');
      expect(Array.isArray(riskAssessment.riskFactors)).toBe(true);
      expect(Array.isArray(riskAssessment.riskMitigation)).toBe(true);
      expect(Array.isArray(riskAssessment.stressTestResults)).toBe(true);
      expect(Array.isArray(riskAssessment.scenarioAnalysis)).toBe(true);
      expect(Array.isArray(riskAssessment.correlationRisks)).toBe(true);
      expect(riskAssessment.liquidityRisk).toBeDefined();
      expect(riskAssessment.concentrationRisk).toBeDefined();
      expect(riskAssessment.marketRisk).toBeDefined();
      expect(riskAssessment.operationalRisk).toBeDefined();
    });

    it('should identify market risk factors for high beta investments', async () => {
      const highBetaInvestment = { 
        ...mockInvestment, 
        riskMetrics: { ...mockInvestment.riskMetrics, beta: 1.5 } 
      };
      const highBetaIdea = { ...mockInvestmentIdea, investments: [highBetaInvestment] };
      
      const riskAssessment = await service.assessRisk(highBetaIdea);
      
      const marketRiskFactors = riskAssessment.riskFactors.filter(rf => rf.type === 'market');
      expect(marketRiskFactors.length).toBeGreaterThan(0);
    });

    it('should identify liquidity risk factors', async () => {
      const lowVolumeInvestment = {
        ...mockInvestment,
        historicalPerformance: mockInvestment.historicalPerformance.map(p => ({ ...p, volume: 50000 }))
      };
      const lowVolumeIdea = { ...mockInvestmentIdea, investments: [lowVolumeInvestment] };
      
      const riskAssessment = await service.assessRisk(lowVolumeIdea);
      
      const liquidityRiskFactors = riskAssessment.riskFactors.filter(rf => rf.type === 'liquidity');
      expect(liquidityRiskFactors.length).toBeGreaterThan(0);
    });

    it('should identify concentration risk for single sector portfolios', async () => {
      const sameSectoInvestment = { ...mockInvestment, id: 'test-investment-2' };
      const concentratedIdea = { ...mockInvestmentIdea, investments: [mockInvestment, sameSectoInvestment] };
      
      const riskAssessment = await service.assessRisk(concentratedIdea);
      
      expect(riskAssessment.concentrationRisk.level).toBe('high');
    });

    it('should generate appropriate risk mitigation strategies', async () => {
      const riskAssessment = await service.assessRisk(mockInvestmentIdea);
      
      expect(riskAssessment.riskMitigation.length).toBeGreaterThan(0);
      riskAssessment.riskMitigation.forEach(mitigation => {
        expect(mitigation.strategy).toBeDefined();
        expect(typeof mitigation.effectiveness).toBe('number');
        expect(typeof mitigation.cost).toBe('number');
        expect(mitigation.implementation).toBeDefined();
      });
    });

    it('should perform stress tests', async () => {
      const riskAssessment = await service.assessRisk(mockInvestmentIdea);
      
      expect(riskAssessment.stressTestResults.length).toBeGreaterThan(0);
      riskAssessment.stressTestResults.forEach(result => {
        expect(result.scenario).toBeDefined();
        expect(typeof result.probability).toBe('number');
        expect(typeof result.expectedLoss).toBe('number');
        expect(typeof result.timeToRecovery).toBe('number');
      });
    });

    it('should perform scenario analysis', async () => {
      const riskAssessment = await service.assessRisk(mockInvestmentIdea);
      
      expect(riskAssessment.scenarioAnalysis.length).toBe(5); // bull, bear, sideways, crisis, recovery
      
      const scenarios = riskAssessment.scenarioAnalysis.map(s => s.scenario);
      expect(scenarios).toContain('bull');
      expect(scenarios).toContain('bear');
      expect(scenarios).toContain('sideways');
      expect(scenarios).toContain('crisis');
      expect(scenarios).toContain('recovery');
    });
  });

  describe('modelExpectedOutcomes', () => {
    it('should model expected outcomes comprehensively', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);

      expect(outcomeModel).toBeDefined();
      expect(outcomeModel.baseCase).toBeDefined();
      expect(outcomeModel.bullCase).toBeDefined();
      expect(outcomeModel.bearCase).toBeDefined();
      expect(typeof outcomeModel.probabilityWeightedReturn).toBe('number');
      expect(outcomeModel.confidenceInterval).toBeDefined();
      expect(outcomeModel.sensitivityAnalysis).toBeDefined();
      expect(outcomeModel.monteCarloResults).toBeDefined();
      expect(Array.isArray(outcomeModel.timeSeriesProjection)).toBe(true);
    });

    it('should create realistic scenario outcomes', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);
      
      // Bull case should have higher return than base case
      expect(outcomeModel.bullCase.expectedReturn).toBeGreaterThan(outcomeModel.baseCase.expectedReturn);
      
      // Bear case should have lower return than base case
      expect(outcomeModel.bearCase.expectedReturn).toBeLessThan(outcomeModel.baseCase.expectedReturn);
      
      // Probabilities should be reasonable
      expect(outcomeModel.baseCase.probability).toBeGreaterThan(0);
      expect(outcomeModel.bullCase.probability).toBeGreaterThan(0);
      expect(outcomeModel.bearCase.probability).toBeGreaterThan(0);
    });

    it('should calculate probability-weighted return correctly', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);
      
      const expectedWeightedReturn = 
        (outcomeModel.baseCase.expectedReturn * outcomeModel.baseCase.probability) +
        (outcomeModel.bullCase.expectedReturn * outcomeModel.bullCase.probability) +
        (outcomeModel.bearCase.expectedReturn * outcomeModel.bearCase.probability);
      
      expect(outcomeModel.probabilityWeightedReturn).toBeCloseTo(expectedWeightedReturn, 2);
    });

    it('should generate confidence intervals', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);
      
      expect(outcomeModel.confidenceInterval.level).toBe(0.95);
      expect(outcomeModel.confidenceInterval.lowerBound).toBeLessThan(outcomeModel.confidenceInterval.upperBound);
      expect(typeof outcomeModel.confidenceInterval.standardError).toBe('number');
    });

    it('should perform sensitivity analysis', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);
      
      expect(outcomeModel.sensitivityAnalysis.variables.length).toBeGreaterThan(0);
      expect(outcomeModel.sensitivityAnalysis.correlationMatrix.length).toBeGreaterThan(0);
      expect(outcomeModel.sensitivityAnalysis.keyDrivers.length).toBeGreaterThan(0);
      
      outcomeModel.sensitivityAnalysis.variables.forEach(variable => {
        expect(variable.name).toBeDefined();
        expect(typeof variable.baseValue).toBe('number');
        expect(typeof variable.impact).toBe('number');
        expect(typeof variable.elasticity).toBe('number');
        expect(variable.range.min).toBeLessThan(variable.range.max);
      });
    });

    it('should run Monte Carlo simulation', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);
      
      expect(outcomeModel.monteCarloResults.iterations).toBe(10000);
      expect(typeof outcomeModel.monteCarloResults.meanReturn).toBe('number');
      expect(typeof outcomeModel.monteCarloResults.standardDeviation).toBe('number');
      expect(typeof outcomeModel.monteCarloResults.probabilityOfLoss).toBe('number');
      expect(typeof outcomeModel.monteCarloResults.probabilityOfTarget).toBe('number');
      expect(typeof outcomeModel.monteCarloResults.expectedShortfall).toBe('number');
      
      // Check percentiles
      expect(outcomeModel.monteCarloResults.percentiles['5']).toBeLessThan(
        outcomeModel.monteCarloResults.percentiles['95']
      );
    });

    it('should generate time series projections', async () => {
      const outcomeModel = await service.modelExpectedOutcomes(mockInvestmentIdea);
      
      expect(outcomeModel.timeSeriesProjection.length).toBeGreaterThan(0);
      
      outcomeModel.timeSeriesProjection.forEach(projection => {
        expect(projection.date).toBeInstanceOf(Date);
        expect(typeof projection.expectedValue).toBe('number');
        expect(typeof projection.cumulativeReturn).toBe('number');
        expect(projection.confidenceBands.upper95).toBeGreaterThan(projection.confidenceBands.lower95);
        expect(projection.confidenceBands.upper68).toBeGreaterThan(projection.confidenceBands.lower68);
      });
    });

    it('should handle different time horizons', async () => {
      const shortTermIdea = { ...mockInvestmentIdea, timeHorizon: 'short' as TimeHorizon };
      const longTermIdea = { ...mockInvestmentIdea, timeHorizon: 'long' as TimeHorizon };
      
      const shortTermModel = await service.modelExpectedOutcomes(shortTermIdea);
      const longTermModel = await service.modelExpectedOutcomes(longTermIdea);
      
      // Long term should have more time series projections
      expect(longTermModel.timeSeriesProjection.length).toBeGreaterThan(
        shortTermModel.timeSeriesProjection.length
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty investments array', async () => {
      const emptyIdea = { ...mockInvestmentIdea, investments: [] };
      
      const metrics = await service.calculateKeyMetrics(emptyIdea);
      const riskAssessment = await service.assessRisk(emptyIdea);
      const outcomeModel = await service.modelExpectedOutcomes(emptyIdea);
      
      expect(metrics).toBeDefined();
      expect(riskAssessment).toBeDefined();
      expect(outcomeModel).toBeDefined();
    });

    it('should handle investments without risk metrics', async () => {
      const investmentWithoutRisk = { ...mockInvestment, riskMetrics: undefined as any };
      const ideaWithoutRisk = { ...mockInvestmentIdea, investments: [investmentWithoutRisk] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutRisk);
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.volatility).toBe('number');
    });

    it('should handle investments without fundamentals', async () => {
      const investmentWithoutFundamentals = { ...mockInvestment, fundamentals: undefined };
      const ideaWithoutFundamentals = { ...mockInvestmentIdea, investments: [investmentWithoutFundamentals] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutFundamentals);
      
      expect(metrics).toBeDefined();
      expect(metrics.fundamentalScore).toBe(50); // Should return base score
    });

    it('should handle investments without technical indicators', async () => {
      const investmentWithoutTechnical = { ...mockInvestment, technicalIndicators: undefined };
      const ideaWithoutTechnical = { ...mockInvestmentIdea, investments: [investmentWithoutTechnical] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutTechnical);
      
      expect(metrics).toBeDefined();
      expect(metrics.technicalScore).toBe(50); // Should return base score
    });

    it('should handle investments without sentiment analysis', async () => {
      const investmentWithoutSentiment = { ...mockInvestment, sentimentAnalysis: undefined };
      const ideaWithoutSentiment = { ...mockInvestmentIdea, investments: [investmentWithoutSentiment] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutSentiment);
      
      expect(metrics).toBeDefined();
      expect(metrics.sentimentScore).toBe(50); // Should return base score
    });

    it('should handle ideas without potential outcomes', async () => {
      const ideaWithoutOutcomes = { ...mockInvestmentIdea, potentialOutcomes: [] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutOutcomes);
      const outcomeModel = await service.modelExpectedOutcomes(ideaWithoutOutcomes);
      
      expect(metrics).toBeDefined();
      expect(outcomeModel).toBeDefined();
    });

    it('should handle ideas without supporting data', async () => {
      const ideaWithoutData = { ...mockInvestmentIdea, supportingData: [] };
      
      const metrics = await service.calculateKeyMetrics(ideaWithoutData);
      
      expect(metrics).toBeDefined();
      expect(metrics.dataQuality).toBe(30); // Should return low quality score
    });
  });

  describe('performance and scalability', () => {
    it('should handle large portfolios efficiently', async () => {
      const largePortfolio = Array.from({ length: 50 }, (_, i) => ({
        ...mockInvestment,
        id: `investment-${i}`,
        name: `Investment ${i}`
      }));
      const largeIdea = { ...mockInvestmentIdea, investments: largePortfolio };
      
      const startTime = Date.now();
      const metrics = await service.calculateKeyMetrics(largeIdea);
      const endTime = Date.now();
      
      expect(metrics).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle complex strategies', async () => {
      const complexIdea = { ...mockInvestmentIdea, strategy: 'complex' as any };
      
      const riskAssessment = await service.assessRisk(complexIdea);
      
      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.operationalRisk.level).toBe('high');
    });
  });
});