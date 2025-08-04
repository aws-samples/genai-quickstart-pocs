"use strict";
/**
 * Tests for Supporting Analysis Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const supporting_analysis_service_1 = require("../supporting-analysis-service");
describe('SupportingAnalysisService', () => {
    let service;
    let mockInvestment;
    let mockInvestmentIdea;
    beforeEach(() => {
        service = new supporting_analysis_service_1.SupportingAnalysisService();
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
            const expectedWeightedReturn = (outcomeModel.baseCase.expectedReturn * outcomeModel.baseCase.probability) +
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
            expect(outcomeModel.monteCarloResults.percentiles['5']).toBeLessThan(outcomeModel.monteCarloResults.percentiles['95']);
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
            const shortTermIdea = { ...mockInvestmentIdea, timeHorizon: 'short' };
            const longTermIdea = { ...mockInvestmentIdea, timeHorizon: 'long' };
            const shortTermModel = await service.modelExpectedOutcomes(shortTermIdea);
            const longTermModel = await service.modelExpectedOutcomes(longTermIdea);
            // Long term should have more time series projections
            expect(longTermModel.timeSeriesProjection.length).toBeGreaterThan(shortTermModel.timeSeriesProjection.length);
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
            const investmentWithoutRisk = { ...mockInvestment, riskMetrics: undefined };
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
            const complexIdea = { ...mockInvestmentIdea, strategy: 'complex' };
            const riskAssessment = await service.assessRisk(complexIdea);
            expect(riskAssessment).toBeDefined();
            expect(riskAssessment.operationalRisk.level).toBe('high');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcG9ydGluZy1hbmFseXNpcy1zZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvX190ZXN0c19fL3N1cHBvcnRpbmctYW5hbHlzaXMtc2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCxnRkFBMkU7QUFLM0UsUUFBUSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtJQUN6QyxJQUFJLE9BQWtDLENBQUM7SUFDdkMsSUFBSSxjQUEwQixDQUFDO0lBQy9CLElBQUksa0JBQWtDLENBQUM7SUFFdkMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLE9BQU8sR0FBRyxJQUFJLHVEQUF5QixFQUFFLENBQUM7UUFFMUMseUJBQXlCO1FBQ3pCLGNBQWMsR0FBRztZQUNmLEVBQUUsRUFBRSxtQkFBbUI7WUFDdkIsSUFBSSxFQUFFLE9BQU87WUFDYixJQUFJLEVBQUUsY0FBYztZQUNwQixNQUFNLEVBQUUsTUFBTTtZQUNkLFdBQVcsRUFBRSxnQkFBZ0I7WUFDN0IsTUFBTSxFQUFFLFlBQVk7WUFDcEIsUUFBUSxFQUFFLFVBQVU7WUFDcEIsU0FBUyxFQUFFLFVBQVU7WUFDckIsWUFBWSxFQUFFLEdBQUc7WUFDakIscUJBQXFCLEVBQUU7Z0JBQ3JCO29CQUNFLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7b0JBQzVCLElBQUksRUFBRSxFQUFFO29CQUNSLElBQUksRUFBRSxHQUFHO29CQUNULEdBQUcsRUFBRSxFQUFFO29CQUNQLEtBQUssRUFBRSxHQUFHO29CQUNWLE1BQU0sRUFBRSxPQUFPO29CQUNmLGFBQWEsRUFBRSxHQUFHO2lCQUNuQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO29CQUM1QixJQUFJLEVBQUUsR0FBRztvQkFDVCxJQUFJLEVBQUUsR0FBRztvQkFDVCxHQUFHLEVBQUUsRUFB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TyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUU3RCxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGVzdHMgZm9yIFN1cHBvcnRpbmcgQW5hbHlzaXMgU2VydmljZVxuICovXG5cbmltcG9ydCB7IFN1cHBvcnRpbmdBbmFseXNpc1NlcnZpY2UgfSBmcm9tICcuLi9zdXBwb3J0aW5nLWFuYWx5c2lzLXNlcnZpY2UnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhLCBUaW1lSG9yaXpvbiwgUmlza0xldmVsIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBEYXRhUG9pbnQgfSBmcm9tICcuLi8uLi9tb2RlbHMvYW5hbHlzaXMnO1xuXG5kZXNjcmliZSgnU3VwcG9ydGluZ0FuYWx5c2lzU2VydmljZScsICgpID0+IHtcbiAgbGV0IHNlcnZpY2U6IFN1cHBvcnRpbmdBbmFseXNpc1NlcnZpY2U7XG4gIGxldCBtb2NrSW52ZXN0bWVudDogSW52ZXN0bWVudDtcbiAgbGV0IG1vY2tJbnZlc3RtZW50SWRlYTogSW52ZXN0bWVudElkZWE7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgc2VydmljZSA9IG5ldyBTdXBwb3J0aW5nQW5hbHlzaXNTZXJ2aWNlKCk7XG4gICAgXG4gICAgLy8gQ3JlYXRlIG1vY2sgaW52ZXN0bWVudFxuICAgIG1vY2tJbnZlc3RtZW50ID0ge1xuICAgICAgaWQ6ICd0ZXN0LWludmVzdG1lbnQtMScsXG4gICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgbmFtZTogJ1Rlc3QgQ29tcGFueScsXG4gICAgICB0aWNrZXI6ICdURVNUJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQSB0ZXN0IGNvbXBhbnknLFxuICAgICAgc2VjdG9yOiAnVGVjaG5vbG9neScsXG4gICAgICBpbmR1c3RyeTogJ1NvZnR3YXJlJyxcbiAgICAgIG1hcmtldENhcDogMTAwMDAwMDAwMCxcbiAgICAgIGN1cnJlbnRQcmljZTogMTAwLFxuICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMScpLFxuICAgICAgICAgIG9wZW46IDk1LFxuICAgICAgICAgIGhpZ2g6IDEwNSxcbiAgICAgICAgICBsb3c6IDkwLFxuICAgICAgICAgIGNsb3NlOiAxMDAsXG4gICAgICAgICAgdm9sdW1lOiAxMDAwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDEwMFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDInKSxcbiAgICAgICAgICBvcGVuOiAxMDAsXG4gICAgICAgICAgaGlnaDogMTEwLFxuICAgICAgICAgIGxvdzogOTgsXG4gICAgICAgICAgY2xvc2U6IDEwNSxcbiAgICAgICAgICB2b2x1bWU6IDEyMDAwMDAsXG4gICAgICAgICAgYWRqdXN0ZWRDbG9zZTogMTA1XG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBmdW5kYW1lbnRhbHM6IHtcbiAgICAgICAgZXBzOiA1LjAsXG4gICAgICAgIHBlUmF0aW86IDIwLFxuICAgICAgICBwYlJhdGlvOiAyLjUsXG4gICAgICAgIGRpdmlkZW5kWWllbGQ6IDAuMDIsXG4gICAgICAgIHJldmVudWVHcm93dGg6IDAuMTUsXG4gICAgICAgIHByb2ZpdE1hcmdpbjogMC4xMixcbiAgICAgICAgZGVidFRvRXF1aXR5OiAwLjMsXG4gICAgICAgIGZyZWVDYXNoRmxvdzogNTAwMDAwMDAsXG4gICAgICAgIHJldHVybk9uRXF1aXR5OiAwLjE4LFxuICAgICAgICByZXR1cm5PbkFzc2V0czogMC4xMFxuICAgICAgfSxcbiAgICAgIHRlY2huaWNhbEluZGljYXRvcnM6IHtcbiAgICAgICAgbW92aW5nQXZlcmFnZXM6IHtcbiAgICAgICAgICBtYTUwOiA5OCxcbiAgICAgICAgICBtYTEwMDogOTUsXG4gICAgICAgICAgbWEyMDA6IDkwXG4gICAgICAgIH0sXG4gICAgICAgIHJlbGF0aXZlU3RyZW5ndGhJbmRleDogNTUsXG4gICAgICAgIG1hY2RMaW5lOiAyLjUsXG4gICAgICAgIG1hY2RTaWduYWw6IDIuMCxcbiAgICAgICAgbWFjZEhpc3RvZ3JhbTogMC41LFxuICAgICAgICBib2xsaW5nZXJCYW5kczoge1xuICAgICAgICAgIHVwcGVyOiAxMTAsXG4gICAgICAgICAgbWlkZGxlOiAxMDAsXG4gICAgICAgICAgbG93ZXI6IDkwXG4gICAgICAgIH0sXG4gICAgICAgIGF2ZXJhZ2VWb2x1bWU6IDExMDAwMDBcbiAgICAgIH0sXG4gICAgICBzZW50aW1lbnRBbmFseXNpczoge1xuICAgICAgICBvdmVyYWxsU2VudGltZW50OiAncG9zaXRpdmUnLFxuICAgICAgICBzZW50aW1lbnRTY29yZTogMC4zLFxuICAgICAgICBzZW50aW1lbnRUcmVuZDogJ2ltcHJvdmluZycsXG4gICAgICAgIG5ld3NWb2x1bWU6IDUwLFxuICAgICAgICBzb2NpYWxNZWRpYU1lbnRpb25zOiAxMDAwLFxuICAgICAgICBhbmFseXN0UmVjb21tZW5kYXRpb25zOiB7XG4gICAgICAgICAgYnV5OiA4LFxuICAgICAgICAgIGhvbGQ6IDQsXG4gICAgICAgICAgc2VsbDogMVxuICAgICAgICB9LFxuICAgICAgICBpbnNpZGVyVHJhZGluZzoge1xuICAgICAgICAgIGJ1eWluZzogMTAwMDAwLFxuICAgICAgICAgIHNlbGxpbmc6IDUwMDAwXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByaXNrTWV0cmljczoge1xuICAgICAgICB2b2xhdGlsaXR5OiAwLjI1LFxuICAgICAgICBiZXRhOiAxLjIsXG4gICAgICAgIHNoYXJwZVJhdGlvOiAwLjgsXG4gICAgICAgIGRyYXdkb3duOiAwLjE1LFxuICAgICAgICB2YXI6IC0wLjA1LFxuICAgICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgICB9LFxuICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbXVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgbW9jayBpbnZlc3RtZW50IGlkZWFcbiAgICBtb2NrSW52ZXN0bWVudElkZWEgPSB7XG4gICAgICBpZDogJ3Rlc3QtaWRlYS0xJyxcbiAgICAgIHZlcnNpb246IDEsXG4gICAgICB0aXRsZTogJ1Rlc3QgSW52ZXN0bWVudCBJZGVhJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQSB0ZXN0IGludmVzdG1lbnQgaWRlYScsXG4gICAgICBpbnZlc3RtZW50czogW21vY2tJbnZlc3RtZW50XSxcbiAgICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBmdW5kYW1lbnRhbHMgYW5kIHBvc2l0aXZlIHNlbnRpbWVudCcsXG4gICAgICBzdHJhdGVneTogJ2J1eScsXG4gICAgICB0aW1lSG9yaXpvbjogJ21lZGl1bScsXG4gICAgICBjb25maWRlbmNlU2NvcmU6IDAuNzUsXG4gICAgICBnZW5lcmF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIGxhc3RVcGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAgICB7XG4gICAgICAgICAgc2NlbmFyaW86ICdiZXN0JyxcbiAgICAgICAgICBwcm9iYWJpbGl0eTogMC4yLFxuICAgICAgICAgIHJldHVybkVzdGltYXRlOiAwLjI1LFxuICAgICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdCZXN0IGNhc2Ugc2NlbmFyaW8nLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IFsnU3Ryb25nIG1hcmtldCcsICdFeGNlbGxlbnQgZXhlY3V0aW9uJ10sXG4gICAgICAgICAga2V5Umlza3M6IFsnTWFya2V0IGNvcnJlY3Rpb24nXSxcbiAgICAgICAgICBjYXRhbHlzdHM6IFsnUHJvZHVjdCBsYXVuY2gnLCAnTWFya2V0IGV4cGFuc2lvbiddXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzY2VuYXJpbzogJ2V4cGVjdGVkJyxcbiAgICAgICAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgICAgICAgIHJldHVybkVzdGltYXRlOiAwLjEyLFxuICAgICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdFeHBlY3RlZCBzY2VuYXJpbycsXG4gICAgICAgICAgY29uZGl0aW9uczogWydOb3JtYWwgbWFya2V0IGNvbmRpdGlvbnMnXSxcbiAgICAgICAgICBrZXlSaXNrczogWydDb21wZXRpdGlvbicsICdNYXJrZXQgdm9sYXRpbGl0eSddLFxuICAgICAgICAgIGNhdGFseXN0czogWydTdGVhZHkgZ3Jvd3RoJ11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICAgICAgcmV0dXJuRXN0aW1hdGU6IC0wLjEwLFxuICAgICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdXb3JzdCBjYXNlIHNjZW5hcmlvJyxcbiAgICAgICAgICBjb25kaXRpb25zOiBbJ01hcmtldCBkb3dudHVybiddLFxuICAgICAgICAgIGtleVJpc2tzOiBbJ1JlY2Vzc2lvbicsICdFeGVjdXRpb24gZmFpbHVyZSddLFxuICAgICAgICAgIGNhdGFseXN0czogW11cbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIHN1cHBvcnRpbmdEYXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzb3VyY2U6ICdibG9vbWJlcmcnLFxuICAgICAgICAgIHR5cGU6ICdmdW5kYW1lbnRhbCcsXG4gICAgICAgICAgdmFsdWU6IHsgZXBzOiA1LjAgfSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgcmVsaWFiaWxpdHk6IDAuOVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgY291bnRlckFyZ3VtZW50czogW10sXG4gICAgICBjb21wbGlhbmNlU3RhdHVzOiB7XG4gICAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbXSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICB9LFxuICAgICAgY3JlYXRlZEJ5OiAndGVzdC1hZ2VudCcsXG4gICAgICB0YWdzOiBbJ3RlY2hub2xvZ3knLCAnZ3Jvd3RoJ10sXG4gICAgICBjYXRlZ29yeTogJ2VxdWl0eScsXG4gICAgICByaXNrTGV2ZWw6ICdtb2RlcmF0ZScsXG4gICAgICB0YXJnZXRBdWRpZW5jZTogWydpbnN0aXR1dGlvbmFsJ10sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBzb3VyY2VNb2RlbHM6IFsndGVzdC1tb2RlbCddLFxuICAgICAgICBwcm9jZXNzaW5nVGltZTogMTAwMCxcbiAgICAgICAgZGF0YVNvdXJjZXNVc2VkOiBbJ2Jsb29tYmVyZyddLFxuICAgICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgICBxdWFsaXR5U2NvcmU6IDc1LFxuICAgICAgICBub3ZlbHR5U2NvcmU6IDYwLFxuICAgICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgICAgdm9sYXRpbGl0eUluZGV4OiAyMCxcbiAgICAgICAgICBtYXJrZXRUcmVuZDogJ2J1bGwnLFxuICAgICAgICAgIGVjb25vbWljSW5kaWNhdG9yczoge30sXG4gICAgICAgICAgZ2VvcG9saXRpY2FsUmlzazogJ2xvdydcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRyYWNraW5nSW5mbzoge1xuICAgICAgICB2aWV3czogMCxcbiAgICAgICAgaW1wbGVtZW50YXRpb25zOiAwLFxuICAgICAgICBmZWVkYmFjazogW10sXG4gICAgICAgIHBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgICAgc3RhdHVzSGlzdG9yeTogW11cbiAgICAgIH1cbiAgICB9O1xuICB9KTtcblxuICBkZXNjcmliZSgnY2FsY3VsYXRlS2V5TWV0cmljcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBjb21wcmVoZW5zaXZlIGtleSBtZXRyaWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWV0cmljcyA9IGF3YWl0IHNlcnZpY2UuY2FsY3VsYXRlS2V5TWV0cmljcyhtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICBleHBlY3QobWV0cmljcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdCh0eXBlb2YgbWV0cmljcy5leHBlY3RlZFJldHVybikudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3Mudm9sYXRpbGl0eSkudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3Muc2hhcnBlUmF0aW8pLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLm1heERyYXdkb3duKS50b0JlKCdudW1iZXInKTtcbiAgICAgIGV4cGVjdCh0eXBlb2YgbWV0cmljcy52YWx1ZUF0UmlzaykudG9CZSgnbnVtYmVyJyk7XG4gICAgICBcbiAgICAgIC8vIFBvcnRmb2xpbyBtZXRyaWNzXG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3MuZGl2ZXJzaWZpY2F0aW9uUmF0aW8pLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLmNvcnJlbGF0aW9uU2NvcmUpLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLmNvbmNlbnRyYXRpb25SaXNrKS50b0JlKCdudW1iZXInKTtcbiAgICAgIFxuICAgICAgLy8gUXVhbGl0eSBtZXRyaWNzXG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3MuZnVuZGFtZW50YWxTY29yZSkudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3MudGVjaG5pY2FsU2NvcmUpLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLnNlbnRpbWVudFNjb3JlKS50b0JlKCdudW1iZXInKTtcbiAgICAgIFxuICAgICAgLy8gUmlzay1hZGp1c3RlZCBtZXRyaWNzXG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3MuaW5mb3JtYXRpb25SYXRpbykudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3MuY2FsbWFyUmF0aW8pLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLnNvcnRpbm9SYXRpbykudG9CZSgnbnVtYmVyJyk7XG4gICAgICBcbiAgICAgIC8vIFRpbWUtYmFzZWQgbWV0cmljc1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLnRpbWVUb0JyZWFrZXZlbikudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3Mub3B0aW1hbEhvbGRpbmdQZXJpb2QpLnRvQmUoJ251bWJlcicpO1xuICAgICAgXG4gICAgICAvLyBDb25maWRlbmNlIG1ldHJpY3NcbiAgICAgIGV4cGVjdCh0eXBlb2YgbWV0cmljcy5kYXRhUXVhbGl0eSkudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG1ldHJpY3MubW9kZWxDb25maWRlbmNlKS50b0JlKCdudW1iZXInKTtcbiAgICAgIGV4cGVjdCh0eXBlb2YgbWV0cmljcy5tYXJrZXRDb25kaXRpb25TdWl0YWJpbGl0eSkudG9CZSgnbnVtYmVyJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBleHBlY3RlZCByZXR1cm4gZnJvbSBwb3RlbnRpYWwgb3V0Y29tZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKG1vY2tJbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIC8vIEV4cGVjdGVkIHJldHVybiBzaG91bGQgYmUgcHJvYmFiaWxpdHktd2VpZ2h0ZWRcbiAgICAgIGNvbnN0IGV4cGVjdGVkUmV0dXJuID0gKDAuMiAqIDAuMjUpICsgKDAuNiAqIDAuMTIpICsgKDAuMiAqIC0wLjEwKTtcbiAgICAgIGV4cGVjdChtZXRyaWNzLmV4cGVjdGVkUmV0dXJuKS50b0JlQ2xvc2VUbyhleHBlY3RlZFJldHVybiwgMik7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZlc3RtZW50IHdpdGggbm8gaGlzdG9yaWNhbCBkYXRhJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaW52ZXN0bWVudFdpdGhvdXRIaXN0b3J5ID0geyAuLi5tb2NrSW52ZXN0bWVudCwgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSB9O1xuICAgICAgY29uc3QgaWRlYVdpdGhvdXRIaXN0b3J5ID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBbaW52ZXN0bWVudFdpdGhvdXRIaXN0b3J5XSB9O1xuICAgICAgXG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKGlkZWFXaXRob3V0SGlzdG9yeSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChtZXRyaWNzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG1ldHJpY3MubWF4RHJhd2Rvd24pLnRvQmUoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBmdW5kYW1lbnRhbCBzY29yZSBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKG1vY2tJbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIC8vIFNob3VsZCBiZSBhYm92ZSBiYXNlIHNjb3JlIGR1ZSB0byBnb29kIGZ1bmRhbWVudGFsc1xuICAgICAgZXhwZWN0KG1ldHJpY3MuZnVuZGFtZW50YWxTY29yZSkudG9CZUdyZWF0ZXJUaGFuKDUwKTtcbiAgICAgIGV4cGVjdChtZXRyaWNzLmZ1bmRhbWVudGFsU2NvcmUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMTAwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIHRlY2huaWNhbCBzY29yZSBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKG1vY2tJbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIC8vIFNob3VsZCBiZSBhYm92ZSBiYXNlIHNjb3JlIGR1ZSB0byBwb3NpdGl2ZSB0ZWNobmljYWwgaW5kaWNhdG9yc1xuICAgICAgZXhwZWN0KG1ldHJpY3MudGVjaG5pY2FsU2NvcmUpLnRvQmVHcmVhdGVyVGhhbig1MCk7XG4gICAgICBleHBlY3QobWV0cmljcy50ZWNobmljYWxTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgc2VudGltZW50IHNjb3JlIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1ldHJpY3MgPSBhd2FpdCBzZXJ2aWNlLmNhbGN1bGF0ZUtleU1ldHJpY3MobW9ja0ludmVzdG1lbnRJZGVhKTtcbiAgICAgIFxuICAgICAgLy8gU2hvdWxkIGJlIGFib3ZlIGJhc2Ugc2NvcmUgZHVlIHRvIHBvc2l0aXZlIHNlbnRpbWVudFxuICAgICAgZXhwZWN0KG1ldHJpY3Muc2VudGltZW50U2NvcmUpLnRvQmVHcmVhdGVyVGhhbig1MCk7XG4gICAgICBleHBlY3QobWV0cmljcy5zZW50aW1lbnRTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnYXNzZXNzUmlzaycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBlcmZvcm0gY29tcHJlaGVuc2l2ZSByaXNrIGFzc2Vzc21lbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHNlcnZpY2UuYXNzZXNzUmlzayhtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQub3ZlcmFsbFJpc2tMZXZlbCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdCh0eXBlb2Ygcmlza0Fzc2Vzc21lbnQucmlza1Njb3JlKS50b0JlKCdudW1iZXInKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJpc2tBc3Nlc3NtZW50LnJpc2tGYWN0b3JzKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJpc2tBc3Nlc3NtZW50LnJpc2tNaXRpZ2F0aW9uKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJpc2tBc3Nlc3NtZW50LnN0cmVzc1Rlc3RSZXN1bHRzKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJpc2tBc3Nlc3NtZW50LnNjZW5hcmlvQW5hbHlzaXMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmlza0Fzc2Vzc21lbnQuY29ycmVsYXRpb25SaXNrcykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQubGlxdWlkaXR5UmlzaykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5jb25jZW50cmF0aW9uUmlzaykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5tYXJrZXRSaXNrKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJpc2tBc3Nlc3NtZW50Lm9wZXJhdGlvbmFsUmlzaykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaWRlbnRpZnkgbWFya2V0IHJpc2sgZmFjdG9ycyBmb3IgaGlnaCBiZXRhIGludmVzdG1lbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaGlnaEJldGFJbnZlc3RtZW50ID0geyBcbiAgICAgICAgLi4ubW9ja0ludmVzdG1lbnQsIFxuICAgICAgICByaXNrTWV0cmljczogeyAuLi5tb2NrSW52ZXN0bWVudC5yaXNrTWV0cmljcywgYmV0YTogMS41IH0gXG4gICAgICB9O1xuICAgICAgY29uc3QgaGlnaEJldGFJZGVhID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBbaGlnaEJldGFJbnZlc3RtZW50XSB9O1xuICAgICAgXG4gICAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHNlcnZpY2UuYXNzZXNzUmlzayhoaWdoQmV0YUlkZWEpO1xuICAgICAgXG4gICAgICBjb25zdCBtYXJrZXRSaXNrRmFjdG9ycyA9IHJpc2tBc3Nlc3NtZW50LnJpc2tGYWN0b3JzLmZpbHRlcihyZiA9PiByZi50eXBlID09PSAnbWFya2V0Jyk7XG4gICAgICBleHBlY3QobWFya2V0Umlza0ZhY3RvcnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGlkZW50aWZ5IGxpcXVpZGl0eSByaXNrIGZhY3RvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBsb3dWb2x1bWVJbnZlc3RtZW50ID0ge1xuICAgICAgICAuLi5tb2NrSW52ZXN0bWVudCxcbiAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBtb2NrSW52ZXN0bWVudC5oaXN0b3JpY2FsUGVyZm9ybWFuY2UubWFwKHAgPT4gKHsgLi4ucCwgdm9sdW1lOiA1MDAwMCB9KSlcbiAgICAgIH07XG4gICAgICBjb25zdCBsb3dWb2x1bWVJZGVhID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBbbG93Vm9sdW1lSW52ZXN0bWVudF0gfTtcbiAgICAgIFxuICAgICAgY29uc3Qgcmlza0Fzc2Vzc21lbnQgPSBhd2FpdCBzZXJ2aWNlLmFzc2Vzc1Jpc2sobG93Vm9sdW1lSWRlYSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGxpcXVpZGl0eVJpc2tGYWN0b3JzID0gcmlza0Fzc2Vzc21lbnQucmlza0ZhY3RvcnMuZmlsdGVyKHJmID0+IHJmLnR5cGUgPT09ICdsaXF1aWRpdHknKTtcbiAgICAgIGV4cGVjdChsaXF1aWRpdHlSaXNrRmFjdG9ycy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaWRlbnRpZnkgY29uY2VudHJhdGlvbiByaXNrIGZvciBzaW5nbGUgc2VjdG9yIHBvcnRmb2xpb3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBzYW1lU2VjdG9JbnZlc3RtZW50ID0geyAuLi5tb2NrSW52ZXN0bWVudCwgaWQ6ICd0ZXN0LWludmVzdG1lbnQtMicgfTtcbiAgICAgIGNvbnN0IGNvbmNlbnRyYXRlZElkZWEgPSB7IC4uLm1vY2tJbnZlc3RtZW50SWRlYSwgaW52ZXN0bWVudHM6IFttb2NrSW52ZXN0bWVudCwgc2FtZVNlY3RvSW52ZXN0bWVudF0gfTtcbiAgICAgIFxuICAgICAgY29uc3Qgcmlza0Fzc2Vzc21lbnQgPSBhd2FpdCBzZXJ2aWNlLmFzc2Vzc1Jpc2soY29uY2VudHJhdGVkSWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5jb25jZW50cmF0aW9uUmlzay5sZXZlbCkudG9CZSgnaGlnaCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBhcHByb3ByaWF0ZSByaXNrIG1pdGlnYXRpb24gc3RyYXRlZ2llcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJpc2tBc3Nlc3NtZW50ID0gYXdhaXQgc2VydmljZS5hc3Nlc3NSaXNrKG1vY2tJbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyaXNrQXNzZXNzbWVudC5yaXNrTWl0aWdhdGlvbi5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIHJpc2tBc3Nlc3NtZW50LnJpc2tNaXRpZ2F0aW9uLmZvckVhY2gobWl0aWdhdGlvbiA9PiB7XG4gICAgICAgIGV4cGVjdChtaXRpZ2F0aW9uLnN0cmF0ZWd5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QodHlwZW9mIG1pdGlnYXRpb24uZWZmZWN0aXZlbmVzcykudG9CZSgnbnVtYmVyJyk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgbWl0aWdhdGlvbi5jb3N0KS50b0JlKCdudW1iZXInKTtcbiAgICAgICAgZXhwZWN0KG1pdGlnYXRpb24uaW1wbGVtZW50YXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGVyZm9ybSBzdHJlc3MgdGVzdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHNlcnZpY2UuYXNzZXNzUmlzayhtb2NrSW52ZXN0bWVudElkZWEpO1xuICAgICAgXG4gICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQuc3RyZXNzVGVzdFJlc3VsdHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICByaXNrQXNzZXNzbWVudC5zdHJlc3NUZXN0UmVzdWx0cy5mb3JFYWNoKHJlc3VsdCA9PiB7XG4gICAgICAgIGV4cGVjdChyZXN1bHQuc2NlbmFyaW8pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzdWx0LnByb2JhYmlsaXR5KS50b0JlKCdudW1iZXInKTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXN1bHQuZXhwZWN0ZWRMb3NzKS50b0JlKCdudW1iZXInKTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXN1bHQudGltZVRvUmVjb3ZlcnkpLnRvQmUoJ251bWJlcicpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHBlcmZvcm0gc2NlbmFyaW8gYW5hbHlzaXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHNlcnZpY2UuYXNzZXNzUmlzayhtb2NrSW52ZXN0bWVudElkZWEpO1xuICAgICAgXG4gICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQuc2NlbmFyaW9BbmFseXNpcy5sZW5ndGgpLnRvQmUoNSk7IC8vIGJ1bGwsIGJlYXIsIHNpZGV3YXlzLCBjcmlzaXMsIHJlY292ZXJ5XG4gICAgICBcbiAgICAgIGNvbnN0IHNjZW5hcmlvcyA9IHJpc2tBc3Nlc3NtZW50LnNjZW5hcmlvQW5hbHlzaXMubWFwKHMgPT4gcy5zY2VuYXJpbyk7XG4gICAgICBleHBlY3Qoc2NlbmFyaW9zKS50b0NvbnRhaW4oJ2J1bGwnKTtcbiAgICAgIGV4cGVjdChzY2VuYXJpb3MpLnRvQ29udGFpbignYmVhcicpO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvcykudG9Db250YWluKCdzaWRld2F5cycpO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvcykudG9Db250YWluKCdjcmlzaXMnKTtcbiAgICAgIGV4cGVjdChzY2VuYXJpb3MpLnRvQ29udGFpbigncmVjb3ZlcnknKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ21vZGVsRXhwZWN0ZWRPdXRjb21lcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIG1vZGVsIGV4cGVjdGVkIG91dGNvbWVzIGNvbXByZWhlbnNpdmVseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG91dGNvbWVNb2RlbCA9IGF3YWl0IHNlcnZpY2UubW9kZWxFeHBlY3RlZE91dGNvbWVzKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLmJhc2VDYXNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG91dGNvbWVNb2RlbC5idWxsQ2FzZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwuYmVhckNhc2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodHlwZW9mIG91dGNvbWVNb2RlbC5wcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuKS50b0JlKCdudW1iZXInKTtcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwuY29uZmlkZW5jZUludGVydmFsKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG91dGNvbWVNb2RlbC5zZW5zaXRpdml0eUFuYWx5c2lzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KG91dGNvbWVNb2RlbC50aW1lU2VyaWVzUHJvamVjdGlvbikpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSByZWFsaXN0aWMgc2NlbmFyaW8gb3V0Y29tZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBvdXRjb21lTW9kZWwgPSBhd2FpdCBzZXJ2aWNlLm1vZGVsRXhwZWN0ZWRPdXRjb21lcyhtb2NrSW52ZXN0bWVudElkZWEpO1xuICAgICAgXG4gICAgICAvLyBCdWxsIGNhc2Ugc2hvdWxkIGhhdmUgaGlnaGVyIHJldHVybiB0aGFuIGJhc2UgY2FzZVxuICAgICAgZXhwZWN0KG91dGNvbWVNb2RlbC5idWxsQ2FzZS5leHBlY3RlZFJldHVybikudG9CZUdyZWF0ZXJUaGFuKG91dGNvbWVNb2RlbC5iYXNlQ2FzZS5leHBlY3RlZFJldHVybik7XG4gICAgICBcbiAgICAgIC8vIEJlYXIgY2FzZSBzaG91bGQgaGF2ZSBsb3dlciByZXR1cm4gdGhhbiBiYXNlIGNhc2VcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwuYmVhckNhc2UuZXhwZWN0ZWRSZXR1cm4pLnRvQmVMZXNzVGhhbihvdXRjb21lTW9kZWwuYmFzZUNhc2UuZXhwZWN0ZWRSZXR1cm4pO1xuICAgICAgXG4gICAgICAvLyBQcm9iYWJpbGl0aWVzIHNob3VsZCBiZSByZWFzb25hYmxlXG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLmJhc2VDYXNlLnByb2JhYmlsaXR5KS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLmJ1bGxDYXNlLnByb2JhYmlsaXR5KS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLmJlYXJDYXNlLnByb2JhYmlsaXR5KS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBwcm9iYWJpbGl0eS13ZWlnaHRlZCByZXR1cm4gY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgb3V0Y29tZU1vZGVsID0gYXdhaXQgc2VydmljZS5tb2RlbEV4cGVjdGVkT3V0Y29tZXMobW9ja0ludmVzdG1lbnRJZGVhKTtcbiAgICAgIFxuICAgICAgY29uc3QgZXhwZWN0ZWRXZWlnaHRlZFJldHVybiA9IFxuICAgICAgICAob3V0Y29tZU1vZGVsLmJhc2VDYXNlLmV4cGVjdGVkUmV0dXJuICogb3V0Y29tZU1vZGVsLmJhc2VDYXNlLnByb2JhYmlsaXR5KSArXG4gICAgICAgIChvdXRjb21lTW9kZWwuYnVsbENhc2UuZXhwZWN0ZWRSZXR1cm4gKiBvdXRjb21lTW9kZWwuYnVsbENhc2UucHJvYmFiaWxpdHkpICtcbiAgICAgICAgKG91dGNvbWVNb2RlbC5iZWFyQ2FzZS5leHBlY3RlZFJldHVybiAqIG91dGNvbWVNb2RlbC5iZWFyQ2FzZS5wcm9iYWJpbGl0eSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwucHJvYmFiaWxpdHlXZWlnaHRlZFJldHVybikudG9CZUNsb3NlVG8oZXhwZWN0ZWRXZWlnaHRlZFJldHVybiwgMik7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGNvbmZpZGVuY2UgaW50ZXJ2YWxzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgb3V0Y29tZU1vZGVsID0gYXdhaXQgc2VydmljZS5tb2RlbEV4cGVjdGVkT3V0Y29tZXMobW9ja0ludmVzdG1lbnRJZGVhKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KG91dGNvbWVNb2RlbC5jb25maWRlbmNlSW50ZXJ2YWwubGV2ZWwpLnRvQmUoMC45NSk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLmNvbmZpZGVuY2VJbnRlcnZhbC5sb3dlckJvdW5kKS50b0JlTGVzc1RoYW4ob3V0Y29tZU1vZGVsLmNvbmZpZGVuY2VJbnRlcnZhbC51cHBlckJvdW5kKTtcbiAgICAgIGV4cGVjdCh0eXBlb2Ygb3V0Y29tZU1vZGVsLmNvbmZpZGVuY2VJbnRlcnZhbC5zdGFuZGFyZEVycm9yKS50b0JlKCdudW1iZXInKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGVyZm9ybSBzZW5zaXRpdml0eSBhbmFseXNpcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG91dGNvbWVNb2RlbCA9IGF3YWl0IHNlcnZpY2UubW9kZWxFeHBlY3RlZE91dGNvbWVzKG1vY2tJbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwuc2Vuc2l0aXZpdHlBbmFseXNpcy52YXJpYWJsZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLnNlbnNpdGl2aXR5QW5hbHlzaXMuY29ycmVsYXRpb25NYXRyaXgubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLnNlbnNpdGl2aXR5QW5hbHlzaXMua2V5RHJpdmVycy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIFxuICAgICAgb3V0Y29tZU1vZGVsLnNlbnNpdGl2aXR5QW5hbHlzaXMudmFyaWFibGVzLmZvckVhY2godmFyaWFibGUgPT4ge1xuICAgICAgICBleHBlY3QodmFyaWFibGUubmFtZSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiB2YXJpYWJsZS5iYXNlVmFsdWUpLnRvQmUoJ251bWJlcicpO1xuICAgICAgICBleHBlY3QodHlwZW9mIHZhcmlhYmxlLmltcGFjdCkudG9CZSgnbnVtYmVyJyk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgdmFyaWFibGUuZWxhc3RpY2l0eSkudG9CZSgnbnVtYmVyJyk7XG4gICAgICAgIGV4cGVjdCh2YXJpYWJsZS5yYW5nZS5taW4pLnRvQmVMZXNzVGhhbih2YXJpYWJsZS5yYW5nZS5tYXgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJ1biBNb250ZSBDYXJsbyBzaW11bGF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgb3V0Y29tZU1vZGVsID0gYXdhaXQgc2VydmljZS5tb2RlbEV4cGVjdGVkT3V0Y29tZXMobW9ja0ludmVzdG1lbnRJZGVhKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cy5pdGVyYXRpb25zKS50b0JlKDEwMDAwKTtcbiAgICAgIGV4cGVjdCh0eXBlb2Ygb3V0Y29tZU1vZGVsLm1vbnRlQ2FybG9SZXN1bHRzLm1lYW5SZXR1cm4pLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMuc3RhbmRhcmREZXZpYXRpb24pLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMucHJvYmFiaWxpdHlPZkxvc3MpLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMucHJvYmFiaWxpdHlPZlRhcmdldCkudG9CZSgnbnVtYmVyJyk7XG4gICAgICBleHBlY3QodHlwZW9mIG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cy5leHBlY3RlZFNob3J0ZmFsbCkudG9CZSgnbnVtYmVyJyk7XG4gICAgICBcbiAgICAgIC8vIENoZWNrIHBlcmNlbnRpbGVzXG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsLm1vbnRlQ2FybG9SZXN1bHRzLnBlcmNlbnRpbGVzWyc1J10pLnRvQmVMZXNzVGhhbihcbiAgICAgICAgb3V0Y29tZU1vZGVsLm1vbnRlQ2FybG9SZXN1bHRzLnBlcmNlbnRpbGVzWyc5NSddXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSB0aW1lIHNlcmllcyBwcm9qZWN0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG91dGNvbWVNb2RlbCA9IGF3YWl0IHNlcnZpY2UubW9kZWxFeHBlY3RlZE91dGNvbWVzKG1vY2tJbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwudGltZVNlcmllc1Byb2plY3Rpb24ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIG91dGNvbWVNb2RlbC50aW1lU2VyaWVzUHJvamVjdGlvbi5mb3JFYWNoKHByb2plY3Rpb24gPT4ge1xuICAgICAgICBleHBlY3QocHJvamVjdGlvbi5kYXRlKS50b0JlSW5zdGFuY2VPZihEYXRlKTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiBwcm9qZWN0aW9uLmV4cGVjdGVkVmFsdWUpLnRvQmUoJ251bWJlcicpO1xuICAgICAgICBleHBlY3QodHlwZW9mIHByb2plY3Rpb24uY3VtdWxhdGl2ZVJldHVybikudG9CZSgnbnVtYmVyJyk7XG4gICAgICAgIGV4cGVjdChwcm9qZWN0aW9uLmNvbmZpZGVuY2VCYW5kcy51cHBlcjk1KS50b0JlR3JlYXRlclRoYW4ocHJvamVjdGlvbi5jb25maWRlbmNlQmFuZHMubG93ZXI5NSk7XG4gICAgICAgIGV4cGVjdChwcm9qZWN0aW9uLmNvbmZpZGVuY2VCYW5kcy51cHBlcjY4KS50b0JlR3JlYXRlclRoYW4ocHJvamVjdGlvbi5jb25maWRlbmNlQmFuZHMubG93ZXI2OCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGRpZmZlcmVudCB0aW1lIGhvcml6b25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc2hvcnRUZXJtSWRlYSA9IHsgLi4ubW9ja0ludmVzdG1lbnRJZGVhLCB0aW1lSG9yaXpvbjogJ3Nob3J0JyBhcyBUaW1lSG9yaXpvbiB9O1xuICAgICAgY29uc3QgbG9uZ1Rlcm1JZGVhID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIHRpbWVIb3Jpem9uOiAnbG9uZycgYXMgVGltZUhvcml6b24gfTtcbiAgICAgIFxuICAgICAgY29uc3Qgc2hvcnRUZXJtTW9kZWwgPSBhd2FpdCBzZXJ2aWNlLm1vZGVsRXhwZWN0ZWRPdXRjb21lcyhzaG9ydFRlcm1JZGVhKTtcbiAgICAgIGNvbnN0IGxvbmdUZXJtTW9kZWwgPSBhd2FpdCBzZXJ2aWNlLm1vZGVsRXhwZWN0ZWRPdXRjb21lcyhsb25nVGVybUlkZWEpO1xuICAgICAgXG4gICAgICAvLyBMb25nIHRlcm0gc2hvdWxkIGhhdmUgbW9yZSB0aW1lIHNlcmllcyBwcm9qZWN0aW9uc1xuICAgICAgZXhwZWN0KGxvbmdUZXJtTW9kZWwudGltZVNlcmllc1Byb2plY3Rpb24ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oXG4gICAgICAgIHNob3J0VGVybU1vZGVsLnRpbWVTZXJpZXNQcm9qZWN0aW9uLmxlbmd0aFxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2VkZ2UgY2FzZXMgYW5kIGVycm9yIGhhbmRsaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVtcHR5IGludmVzdG1lbnRzIGFycmF5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZW1wdHlJZGVhID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBbXSB9O1xuICAgICAgXG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKGVtcHR5SWRlYSk7XG4gICAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHNlcnZpY2UuYXNzZXNzUmlzayhlbXB0eUlkZWEpO1xuICAgICAgY29uc3Qgb3V0Y29tZU1vZGVsID0gYXdhaXQgc2VydmljZS5tb2RlbEV4cGVjdGVkT3V0Y29tZXMoZW1wdHlJZGVhKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KG1ldHJpY3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qocmlza0Fzc2Vzc21lbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qob3V0Y29tZU1vZGVsKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52ZXN0bWVudHMgd2l0aG91dCByaXNrIG1ldHJpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpbnZlc3RtZW50V2l0aG91dFJpc2sgPSB7IC4uLm1vY2tJbnZlc3RtZW50LCByaXNrTWV0cmljczogdW5kZWZpbmVkIGFzIGFueSB9O1xuICAgICAgY29uc3QgaWRlYVdpdGhvdXRSaXNrID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBbaW52ZXN0bWVudFdpdGhvdXRSaXNrXSB9O1xuICAgICAgXG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKGlkZWFXaXRob3V0Umlzayk7XG4gICAgICBcbiAgICAgIGV4cGVjdChtZXRyaWNzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBtZXRyaWNzLnZvbGF0aWxpdHkpLnRvQmUoJ251bWJlcicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52ZXN0bWVudHMgd2l0aG91dCBmdW5kYW1lbnRhbHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpbnZlc3RtZW50V2l0aG91dEZ1bmRhbWVudGFscyA9IHsgLi4ubW9ja0ludmVzdG1lbnQsIGZ1bmRhbWVudGFsczogdW5kZWZpbmVkIH07XG4gICAgICBjb25zdCBpZGVhV2l0aG91dEZ1bmRhbWVudGFscyA9IHsgLi4ubW9ja0ludmVzdG1lbnRJZGVhLCBpbnZlc3RtZW50czogW2ludmVzdG1lbnRXaXRob3V0RnVuZGFtZW50YWxzXSB9O1xuICAgICAgXG4gICAgICBjb25zdCBtZXRyaWNzID0gYXdhaXQgc2VydmljZS5jYWxjdWxhdGVLZXlNZXRyaWNzKGlkZWFXaXRob3V0RnVuZGFtZW50YWxzKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KG1ldHJpY3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QobWV0cmljcy5mdW5kYW1lbnRhbFNjb3JlKS50b0JlKDUwKTsgLy8gU2hvdWxkIHJldHVybiBiYXNlIHNjb3JlXG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZlc3RtZW50cyB3aXRob3V0IHRlY2huaWNhbCBpbmRpY2F0b3JzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaW52ZXN0bWVudFdpdGhvdXRUZWNobmljYWwgPSB7IC4uLm1vY2tJbnZlc3RtZW50LCB0ZWNobmljYWxJbmRpY2F0b3JzOiB1bmRlZmluZWQgfTtcbiAgICAgIGNvbnN0IGlkZWFXaXRob3V0VGVjaG5pY2FsID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBbaW52ZXN0bWVudFdpdGhvdXRUZWNobmljYWxdIH07XG4gICAgICBcbiAgICAgIGNvbnN0IG1ldHJpY3MgPSBhd2FpdCBzZXJ2aWNlLmNhbGN1bGF0ZUtleU1ldHJpY3MoaWRlYVdpdGhvdXRUZWNobmljYWwpO1xuICAgICAgXG4gICAgICBleHBlY3QobWV0cmljcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChtZXRyaWNzLnRlY2huaWNhbFNjb3JlKS50b0JlKDUwKTsgLy8gU2hvdWxkIHJldHVybiBiYXNlIHNjb3JlXG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZlc3RtZW50cyB3aXRob3V0IHNlbnRpbWVudCBhbmFseXNpcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGludmVzdG1lbnRXaXRob3V0U2VudGltZW50ID0geyAuLi5tb2NrSW52ZXN0bWVudCwgc2VudGltZW50QW5hbHlzaXM6IHVuZGVmaW5lZCB9O1xuICAgICAgY29uc3QgaWRlYVdpdGhvdXRTZW50aW1lbnQgPSB7IC4uLm1vY2tJbnZlc3RtZW50SWRlYSwgaW52ZXN0bWVudHM6IFtpbnZlc3RtZW50V2l0aG91dFNlbnRpbWVudF0gfTtcbiAgICAgIFxuICAgICAgY29uc3QgbWV0cmljcyA9IGF3YWl0IHNlcnZpY2UuY2FsY3VsYXRlS2V5TWV0cmljcyhpZGVhV2l0aG91dFNlbnRpbWVudCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChtZXRyaWNzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG1ldHJpY3Muc2VudGltZW50U2NvcmUpLnRvQmUoNTApOyAvLyBTaG91bGQgcmV0dXJuIGJhc2Ugc2NvcmVcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGlkZWFzIHdpdGhvdXQgcG90ZW50aWFsIG91dGNvbWVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaWRlYVdpdGhvdXRPdXRjb21lcyA9IHsgLi4ubW9ja0ludmVzdG1lbnRJZGVhLCBwb3RlbnRpYWxPdXRjb21lczogW10gfTtcbiAgICAgIFxuICAgICAgY29uc3QgbWV0cmljcyA9IGF3YWl0IHNlcnZpY2UuY2FsY3VsYXRlS2V5TWV0cmljcyhpZGVhV2l0aG91dE91dGNvbWVzKTtcbiAgICAgIGNvbnN0IG91dGNvbWVNb2RlbCA9IGF3YWl0IHNlcnZpY2UubW9kZWxFeHBlY3RlZE91dGNvbWVzKGlkZWFXaXRob3V0T3V0Y29tZXMpO1xuICAgICAgXG4gICAgICBleHBlY3QobWV0cmljcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChvdXRjb21lTW9kZWwpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpZGVhcyB3aXRob3V0IHN1cHBvcnRpbmcgZGF0YScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGlkZWFXaXRob3V0RGF0YSA9IHsgLi4ubW9ja0ludmVzdG1lbnRJZGVhLCBzdXBwb3J0aW5nRGF0YTogW10gfTtcbiAgICAgIFxuICAgICAgY29uc3QgbWV0cmljcyA9IGF3YWl0IHNlcnZpY2UuY2FsY3VsYXRlS2V5TWV0cmljcyhpZGVhV2l0aG91dERhdGEpO1xuICAgICAgXG4gICAgICBleHBlY3QobWV0cmljcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChtZXRyaWNzLmRhdGFRdWFsaXR5KS50b0JlKDMwKTsgLy8gU2hvdWxkIHJldHVybiBsb3cgcXVhbGl0eSBzY29yZVxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncGVyZm9ybWFuY2UgYW5kIHNjYWxhYmlsaXR5JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIGxhcmdlIHBvcnRmb2xpb3MgZWZmaWNpZW50bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBsYXJnZVBvcnRmb2xpbyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IDUwIH0sIChfLCBpKSA9PiAoe1xuICAgICAgICAuLi5tb2NrSW52ZXN0bWVudCxcbiAgICAgICAgaWQ6IGBpbnZlc3RtZW50LSR7aX1gLFxuICAgICAgICBuYW1lOiBgSW52ZXN0bWVudCAke2l9YFxuICAgICAgfSkpO1xuICAgICAgY29uc3QgbGFyZ2VJZGVhID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIGludmVzdG1lbnRzOiBsYXJnZVBvcnRmb2xpbyB9O1xuICAgICAgXG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgbWV0cmljcyA9IGF3YWl0IHNlcnZpY2UuY2FsY3VsYXRlS2V5TWV0cmljcyhsYXJnZUlkZWEpO1xuICAgICAgY29uc3QgZW5kVGltZSA9IERhdGUubm93KCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChtZXRyaWNzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGVuZFRpbWUgLSBzdGFydFRpbWUpLnRvQmVMZXNzVGhhbig1MDAwKTsgLy8gU2hvdWxkIGNvbXBsZXRlIHdpdGhpbiA1IHNlY29uZHNcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGNvbXBsZXggc3RyYXRlZ2llcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbXBsZXhJZGVhID0geyAuLi5tb2NrSW52ZXN0bWVudElkZWEsIHN0cmF0ZWd5OiAnY29tcGxleCcgYXMgYW55IH07XG4gICAgICBcbiAgICAgIGNvbnN0IHJpc2tBc3Nlc3NtZW50ID0gYXdhaXQgc2VydmljZS5hc3Nlc3NSaXNrKGNvbXBsZXhJZGVhKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJpc2tBc3Nlc3NtZW50KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJpc2tBc3Nlc3NtZW50Lm9wZXJhdGlvbmFsUmlzay5sZXZlbCkudG9CZSgnaGlnaCcpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==