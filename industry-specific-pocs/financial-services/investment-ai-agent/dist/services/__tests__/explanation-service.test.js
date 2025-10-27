"use strict";
/**
 * Unit tests for ExplanationService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const explanation_service_1 = require("../explanation-service");
describe('ExplanationService', () => {
    let explanationService;
    let mockInvestmentIdea;
    let mockAnalysisResults;
    beforeEach(() => {
        explanationService = new explanation_service_1.ExplanationService();
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
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbGFuYXRpb24tc2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9leHBsYW5hdGlvbi1zZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILGdFQUE0RDtBQUs1RCxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO0lBQ2xDLElBQUksa0JBQXNDLENBQUM7SUFDM0MsSUFBSSxrQkFBa0MsQ0FBQztJQUN2QyxJQUFJLG1CQUFxQyxDQUFDO0lBRTFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxrQkFBa0IsR0FBRyxJQUFJLHdDQUFrQixFQUFFLENBQUM7UUFFOUMsOEJBQThCO1FBQzlCLGtCQUFrQixHQUFHO1lBQ25CLEVBQUUsRUFBRSxVQUFVO1lBQ2QsT0FBTyxFQUFFLENBQUM7WUFDVixLQUFLLEVBQUUsK0JBQStCO1lBQ3RDLFdBQVcsRUFBRSwwRUFBMEU7WUFDdkYsV0FBVyxFQUFFO2dCQUNYO29CQUNFLEVBQUUsRUFBRSxPQUFPO29CQUNYLElBQUksRUFBRSxPQUFPO29CQUNiLElBQUksRUFBRSxlQUFlO29CQUNyQixNQUFNLEVBQUUsTUFBTTtvQkFDZCxXQUFXLEVBQUUsNEJBQTRCO29CQUN6QyxNQUFNLEVBQUUsWUFBWTtvQkFDcEIsUUFBUSxFQUFFLFVBQVU7b0JBQ3BCLFNBQVMsRUFBRSxXQUFXO29CQUN0QixZQUFZLEVBQUUsTUFBTTtvQkFDcEIscUJBQXFCLEVBQUUsRUFBRTtvQkFDekIsV0FBVyxFQUFFO3dCQUNYLFVBQVUsRUFBRSxJQUFJO3dCQUNoQixJQUFJLEVBQUUsR0FBRzt3QkFDVCxXQUFXLEVBQUUsR0FBRzt3QkFDaEIsUUFBUSxFQUFFLElBQUk7d0JBQ2QsR0FBRyxFQUFFLElBQUk7d0JBQ1QsWUFBWSxFQUFFLEVBQUU7cUJBQ2pCO29CQUNELGtCQUFrQixFQUFFLEVBQUU7aUJBQ1Q7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O2dCQUN4RCxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBVbml0IHRlc3RzIGZvciBFeHBsYW5hdGlvblNlcnZpY2VcbiAqL1xuXG5pbXBvcnQgeyBFeHBsYW5hdGlvblNlcnZpY2UgfSBmcm9tICcuLi9leHBsYW5hdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBEYXRhUG9pbnQsIEFuYWx5c2lzUmVzdWx0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2FuYWx5c2lzJztcbmltcG9ydCB7IEludmVzdG1lbnQgfSBmcm9tICcuLi8uLi9tb2RlbHMvaW52ZXN0bWVudCc7XG5cbmRlc2NyaWJlKCdFeHBsYW5hdGlvblNlcnZpY2UnLCAoKSA9PiB7XG4gIGxldCBleHBsYW5hdGlvblNlcnZpY2U6IEV4cGxhbmF0aW9uU2VydmljZTtcbiAgbGV0IG1vY2tJbnZlc3RtZW50SWRlYTogSW52ZXN0bWVudElkZWE7XG4gIGxldCBtb2NrQW5hbHlzaXNSZXN1bHRzOiBBbmFseXNpc1Jlc3VsdFtdO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGV4cGxhbmF0aW9uU2VydmljZSA9IG5ldyBFeHBsYW5hdGlvblNlcnZpY2UoKTtcbiAgICBcbiAgICAvLyBDcmVhdGUgbW9jayBpbnZlc3RtZW50IGlkZWFcbiAgICBtb2NrSW52ZXN0bWVudElkZWEgPSB7XG4gICAgICBpZDogJ2lkZWEtMTIzJyxcbiAgICAgIHZlcnNpb246IDEsXG4gICAgICB0aXRsZTogJ1RlY2ggU3RvY2sgR3Jvd3RoIE9wcG9ydHVuaXR5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW52ZXN0bWVudCBpbiBlbWVyZ2luZyB0ZWNobm9sb2d5IGNvbXBhbmllcyB3aXRoIHN0cm9uZyBncm93dGggcG90ZW50aWFsJyxcbiAgICAgIGludmVzdG1lbnRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ludi0xJyxcbiAgICAgICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgICAgIG5hbWU6ICdUZWNoQ29ycCBJbmMuJyxcbiAgICAgICAgICB0aWNrZXI6ICdURUNIJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xlYWRpbmcgdGVjaG5vbG9neSBjb21wYW55JyxcbiAgICAgICAgICBzZWN0b3I6ICdUZWNobm9sb2d5JyxcbiAgICAgICAgICBpbmR1c3RyeTogJ1NvZnR3YXJlJyxcbiAgICAgICAgICBtYXJrZXRDYXA6IDUwMDAwMDAwMDAwLFxuICAgICAgICAgIGN1cnJlbnRQcmljZTogMTUwLjUwLFxuICAgICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMjUsXG4gICAgICAgICAgICBiZXRhOiAxLjIsXG4gICAgICAgICAgICBzaGFycGVSYXRpbzogMS41LFxuICAgICAgICAgICAgZHJhd2Rvd246IDAuMTUsXG4gICAgICAgICAgICB2YXI6IDAuMDUsXG4gICAgICAgICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgICAgICAgfSxcbiAgICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gICAgICAgIH0gYXMgSW52ZXN0bWVudFxuICAgICAgXSxcbiAgICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBmdW5kYW1lbnRhbHMgaW5kaWNhdGUgZ3Jvd3RoIHBvdGVudGlhbC4gVGVjaG5pY2FsIGFuYWx5c2lzIHNob3dzIGJ1bGxpc2ggcGF0dGVybnMuIE1hcmtldCBzZW50aW1lbnQgaXMgcG9zaXRpdmUuJyxcbiAgICAgIHN0cmF0ZWd5OiAnYnV5JyxcbiAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICAgIGNvbmZpZGVuY2VTY29yZTogMC44NSxcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMS0xNVQxMDowMDowMFonKSxcbiAgICAgIGxhc3RVcGRhdGVkQXQ6IG5ldyBEYXRlKCcyMDI0LTAxLTE1VDEwOjAwOjAwWicpLFxuICAgICAgcG90ZW50aWFsT3V0Y29tZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNjZW5hcmlvOiAnYmVzdCcsXG4gICAgICAgICAgcHJvYmFiaWxpdHk6IDAuMixcbiAgICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC40LFxuICAgICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdFeGNlcHRpb25hbCBncm93dGggc2NlbmFyaW8nLFxuICAgICAgICAgIGNvbmRpdGlvbnM6IFsnU3Ryb25nIG1hcmtldCBjb25kaXRpb25zJywgJ1N1Y2Nlc3NmdWwgcHJvZHVjdCBsYXVuY2hlcyddLFxuICAgICAgICAgIGtleVJpc2tzOiBbJ01hcmtldCB2b2xhdGlsaXR5J10sXG4gICAgICAgICAgY2F0YWx5c3RzOiBbJ05ldyBwcm9kdWN0IHJlbGVhc2UnLCAnTWFya2V0IGV4cGFuc2lvbiddXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzY2VuYXJpbzogJ2V4cGVjdGVkJyxcbiAgICAgICAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgICAgICAgIHJldHVybkVzdGltYXRlOiAwLjIsXG4gICAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDM2NSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4cGVjdGVkIGdyb3d0aCBzY2VuYXJpbycsXG4gICAgICAgICAgY29uZGl0aW9uczogWydOb3JtYWwgbWFya2V0IGNvbmRpdGlvbnMnXSxcbiAgICAgICAgICBrZXlSaXNrczogWydDb21wZXRpdGlvbiddLFxuICAgICAgICAgIGNhdGFseXN0czogWydTdGVhZHkgZ3Jvd3RoJ11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICAgICAgcmV0dXJuRXN0aW1hdGU6IC0wLjEsXG4gICAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDM2NSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Rvd25zaWRlIHNjZW5hcmlvJyxcbiAgICAgICAgICBjb25kaXRpb25zOiBbJ01hcmtldCBkb3dudHVybiddLFxuICAgICAgICAgIGtleVJpc2tzOiBbJ0Vjb25vbWljIHJlY2Vzc2lvbicsICdSZWd1bGF0b3J5IGNoYW5nZXMnXSxcbiAgICAgICAgICBjYXRhbHlzdHM6IFtdXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBzdXBwb3J0aW5nRGF0YTogW1xuICAgICAgICB7XG4gICAgICAgICAgc291cmNlOiAnRmluYW5jaWFsIFJlcG9ydHMnLFxuICAgICAgICAgIHR5cGU6ICdmdW5kYW1lbnRhbCcsXG4gICAgICAgICAgdmFsdWU6IHsgcmV2ZW51ZTogMTAwMDAwMDAwMCwgZ3Jvd3RoOiAwLjE1IH0sXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wMS0xMFQwMDowMDowMFonKSxcbiAgICAgICAgICByZWxpYWJpbGl0eTogMC45XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBzb3VyY2U6ICdNYXJrZXQgQW5hbHlzaXMnLFxuICAgICAgICAgIHR5cGU6ICd0ZWNobmljYWwnLFxuICAgICAgICAgIHZhbHVlOiB7IHRyZW5kOiAnYnVsbGlzaCcsIHJzaTogNjUgfSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTEyVDAwOjAwOjAwWicpLFxuICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjhcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNvdXJjZTogJ05ld3MgU2VudGltZW50JyxcbiAgICAgICAgICB0eXBlOiAnc2VudGltZW50JyxcbiAgICAgICAgICB2YWx1ZTogeyBzY29yZTogMC43LCBhcnRpY2xlczogMjUgfSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTE0VDAwOjAwOjAwWicpLFxuICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjdcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIGNvdW50ZXJBcmd1bWVudHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaCB2YWx1YXRpb24gbXVsdGlwbGVzIHN1Z2dlc3Qgb3ZlcnZhbHVhdGlvbicsXG4gICAgICAgICAgc3RyZW5ndGg6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgaW1wYWN0OiAnbWVkaXVtJyxcbiAgICAgICAgICBtaXRpZ2F0aW9uU3RyYXRlZ3k6ICdNb25pdG9yIHZhbHVhdGlvbiBtZXRyaWNzIGNsb3NlbHknLFxuICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjNcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jcmVhc2VkIGNvbXBldGl0aW9uIGluIHRoZSBzZWN0b3InLFxuICAgICAgICAgIHN0cmVuZ3RoOiAnc3Ryb25nJyxcbiAgICAgICAgICBpbXBhY3Q6ICdoaWdoJyxcbiAgICAgICAgICBtaXRpZ2F0aW9uU3RyYXRlZ3k6ICdEaXZlcnNpZnkgYWNyb3NzIG11bHRpcGxlIHRlY2ggY29tcGFuaWVzJyxcbiAgICAgICAgICBwcm9iYWJpbGl0eTogMC40XG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBjb21wbGlhbmNlU3RhdHVzOiB7XG4gICAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbJ1NFQycsICdGSU5SQSddLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTE1VDA5OjAwOjAwWicpXG4gICAgICB9LFxuICAgICAgY3JlYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgICAgdGFnczogWyd0ZWNobm9sb2d5JywgJ2dyb3d0aCcsICdsYXJnZS1jYXAnXSxcbiAgICAgIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgIHRhcmdldEF1ZGllbmNlOiBbJ2luc3RpdHV0aW9uYWwnLCAnaGlnaC1uZXQtd29ydGgnXSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHNvdXJjZU1vZGVsczogWydjbGF1ZGUtc29ubmV0LTMuNycsICdhbWF6b24tbm92YS1wcm8nXSxcbiAgICAgICAgcHJvY2Vzc2luZ1RpbWU6IDUwMDAsXG4gICAgICAgIGRhdGFTb3VyY2VzVXNlZDogWydGaW5hbmNpYWwgUmVwb3J0cycsICdNYXJrZXQgQW5hbHlzaXMnLCAnTmV3cyBTZW50aW1lbnQnXSxcbiAgICAgICAgcmVzZWFyY2hEZXB0aDogJ2NvbXByZWhlbnNpdmUnLFxuICAgICAgICBxdWFsaXR5U2NvcmU6IDg1LFxuICAgICAgICBub3ZlbHR5U2NvcmU6IDcwLFxuICAgICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgICAgdm9sYXRpbGl0eUluZGV4OiAxOCxcbiAgICAgICAgICBtYXJrZXRUcmVuZDogJ2J1bGwnLFxuICAgICAgICAgIGVjb25vbWljSW5kaWNhdG9yczogeyBnZHA6IDAuMDI1LCBpbmZsYXRpb246IDAuMDMgfSxcbiAgICAgICAgICBnZW9wb2xpdGljYWxSaXNrOiAnbG93J1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdHJhY2tpbmdJbmZvOiB7XG4gICAgICAgIHZpZXdzOiAwLFxuICAgICAgICBpbXBsZW1lbnRhdGlvbnM6IDAsXG4gICAgICAgIGZlZWRiYWNrOiBbXSxcbiAgICAgICAgcGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgICAgICBzdGF0dXNIaXN0b3J5OiBbXVxuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgbW9jayBhbmFseXNpcyByZXN1bHRzXG4gICAgbW9ja0FuYWx5c2lzUmVzdWx0cyA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdhbmFseXNpcy0xJyxcbiAgICAgICAgaW52ZXN0bWVudElkOiAnaW52LTEnLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdmdW5kYW1lbnRhbCcsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjQtMDEtMTVUMDk6MzA6MDBaJyksXG4gICAgICAgIGFuYWx5c3Q6ICdhbWF6b24tbm92YS1wcm8nLFxuICAgICAgICBzdW1tYXJ5OiAnU3Ryb25nIGZ1bmRhbWVudGFsIGFuYWx5c2lzJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC44OCxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIHN0cmVuZ3RoczogWydTdHJvbmcgcmV2ZW51ZSBncm93dGgnLCAnU29saWQgYmFsYW5jZSBzaGVldCddLFxuICAgICAgICAgIHdlYWtuZXNzZXM6IFsnSGlnaCB2YWx1YXRpb24nXSxcbiAgICAgICAgICBvcHBvcnR1bml0aWVzOiBbJ01hcmtldCBleHBhbnNpb24nXSxcbiAgICAgICAgICB0aHJlYXRzOiBbJ0NvbXBldGl0aW9uJ10sXG4gICAgICAgICAga2V5TWV0cmljczogeyBwZTogMjUsIHJvZTogMC4xNSB9LFxuICAgICAgICAgIG5hcnJhdGl2ZXM6IFsnR3Jvd3RoIHN0b3J5IGludGFjdCddXG4gICAgICAgIH0sXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2J1eScsXG4gICAgICAgICAgICB0aW1lSG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgICB0YXJnZXRQcmljZTogMTgwLFxuICAgICAgICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgICAgICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBmdW5kYW1lbnRhbHMgc3VwcG9ydCBoaWdoZXIgdmFsdWF0aW9uJ1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgZGF0YVBvaW50czogW11cbiAgICAgIH1cbiAgICBdO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2VuZXJhdGVFeHBsYW5hdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGNvbXByZWhlbnNpdmUgZXhwbGFuYXRpb24gZm9yIGludmVzdG1lbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSwgbW9ja0FuYWx5c2lzUmVzdWx0cyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkKS50b01hdGNoKC9eZXhwX1xcZCtfW2EtejAtOV0rJC8pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pbnZlc3RtZW50SWRlYUlkKS50b0JlKG1vY2tJbnZlc3RtZW50SWRlYS5pZCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRpbWVzdGFtcCkudG9CZUluc3RhbmNlT2YoRGF0ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlYXNvbmluZykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlQW5hbHlzaXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnZpc3VhbGl6YXRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zdW1tYXJ5KS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBleHBsYW5hdGlvbiB3aXRob3V0IGFuYWx5c2lzIHJlc3VsdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY29uZmlkZW5jZUFuYWx5c2lzKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmVhc29uaW5nIGV4cGxhbmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZXh0cmFjdCBkZWNpc2lvbiBwYXRoIGZyb20gcmF0aW9uYWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcuZGVjaXNpb25QYXRoKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcuZGVjaXNpb25QYXRoLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgXG4gICAgICBjb25zdCBmaXJzdFN0ZXAgPSByZXN1bHQucmVhc29uaW5nLmRlY2lzaW9uUGF0aFswXTtcbiAgICAgIGV4cGVjdChmaXJzdFN0ZXAuc3RlcE51bWJlcikudG9CZSgxKTtcbiAgICAgIGV4cGVjdChmaXJzdFN0ZXAuZGVzY3JpcHRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZmlyc3RTdGVwLnJlYXNvbmluZykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChmaXJzdFN0ZXAuY29uZmlkZW5jZSkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KGZpcnN0U3RlcC5pbXBhY3QpLnRvTWF0Y2goL14obG93fG1lZGl1bXxoaWdoKSQvKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaWRlbnRpZnkga2V5IGZhY3RvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnJlYXNvbmluZy5rZXlGYWN0b3JzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcua2V5RmFjdG9ycy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIFxuICAgICAgY29uc3QgZmlyc3RGYWN0b3IgPSByZXN1bHQucmVhc29uaW5nLmtleUZhY3RvcnNbMF07XG4gICAgICBleHBlY3QoZmlyc3RGYWN0b3IubmFtZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChmaXJzdEZhY3Rvci5kZXNjcmlwdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChmaXJzdEZhY3Rvci53ZWlnaHQpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZmlyc3RGYWN0b3Iud2VpZ2h0KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGZpcnN0RmFjdG9yLmRpcmVjdGlvbikudG9NYXRjaCgvXihwb3NpdGl2ZXxuZWdhdGl2ZXxuZXV0cmFsKSQvKTtcbiAgICAgIGV4cGVjdChmaXJzdEZhY3Rvci5jb25maWRlbmNlTGV2ZWwpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZmlyc3RGYWN0b3IuY29uZmlkZW5jZUxldmVsKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBidWlsZCBsb2dpY2FsIGNvbm5lY3Rpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcubG9naWNhbENoYWluKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzdWx0LnJlYXNvbmluZy5sb2dpY2FsQ2hhaW4pKS50b0JlKHRydWUpO1xuICAgICAgXG4gICAgICBpZiAocmVzdWx0LnJlYXNvbmluZy5sb2dpY2FsQ2hhaW4ubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gcmVzdWx0LnJlYXNvbmluZy5sb2dpY2FsQ2hhaW5bMF07XG4gICAgICAgIGV4cGVjdChjb25uZWN0aW9uLmZyb20pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChjb25uZWN0aW9uLnRvKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoY29ubmVjdGlvbi5yZWxhdGlvbnNoaXApLnRvTWF0Y2goL14oY2F1c2VzfGNvcnJlbGF0ZXN8c3VwcG9ydHN8Y29udHJhZGljdHN8aW1wbGllcykkLyk7XG4gICAgICAgIGV4cGVjdChjb25uZWN0aW9uLnN0cmVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgICBleHBlY3QoY29ubmVjdGlvbi5zdHJlbmd0aCkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZXh0cmFjdCBhc3N1bXB0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQucmVhc29uaW5nLmFzc3VtcHRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcuYXNzdW1wdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGFzc3VtcHRpb24gPSByZXN1bHQucmVhc29uaW5nLmFzc3VtcHRpb25zWzBdO1xuICAgICAgZXhwZWN0KGFzc3VtcHRpb24uZGVzY3JpcHRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoYXNzdW1wdGlvbi50eXBlKS50b01hdGNoKC9eKG1hcmtldHxlY29ub21pY3xjb21wYW55fHJlZ3VsYXRvcnl8dGVjaG5pY2FsKSQvKTtcbiAgICAgIGV4cGVjdChhc3N1bXB0aW9uLmNvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYXNzdW1wdGlvbi5jb25maWRlbmNlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGFzc3VtcHRpb24uaW1wYWN0KS50b01hdGNoKC9eKGxvd3xtZWRpdW18aGlnaCkkLyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGFsdGVybmF0aXZlIHNjZW5hcmlvcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQucmVhc29uaW5nLmFsdGVybmF0aXZlU2NlbmFyaW9zKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcuYWx0ZXJuYXRpdmVTY2VuYXJpb3MubGVuZ3RoKS50b0JlKG1vY2tJbnZlc3RtZW50SWRlYS5jb3VudGVyQXJndW1lbnRzLmxlbmd0aCk7XG4gICAgICBcbiAgICAgIGNvbnN0IHNjZW5hcmlvID0gcmVzdWx0LnJlYXNvbmluZy5hbHRlcm5hdGl2ZVNjZW5hcmlvc1swXTtcbiAgICAgIGV4cGVjdChzY2VuYXJpby5uYW1lKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvLmRlc2NyaXB0aW9uKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvLnByb2JhYmlsaXR5KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvLnByb2JhYmlsaXR5KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvLm91dGNvbWUpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdkYXRhIGF0dHJpYnV0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ3JvdXAgZGF0YSBwb2ludHMgYnkgc291cmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24uc291cmNlcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLnNvdXJjZXMubGVuZ3RoKS50b0JlKDMpOyAvLyBGaW5hbmNpYWwgUmVwb3J0cywgTWFya2V0IEFuYWx5c2lzLCBOZXdzIFNlbnRpbWVudFxuICAgICAgXG4gICAgICBjb25zdCBzb3VyY2UgPSByZXN1bHQuZGF0YUF0dHJpYnV0aW9uLnNvdXJjZXNbMF07XG4gICAgICBleHBlY3Qoc291cmNlLnNvdXJjZUlkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNvdXJjZS5zb3VyY2VOYW1lKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNvdXJjZS5zb3VyY2VUeXBlKS50b01hdGNoKC9eKHByb3ByaWV0YXJ5fHB1YmxpY3xtYXJrZXR8bmV3c3xyZXNlYXJjaHxyZWd1bGF0b3J5KSQvKTtcbiAgICAgIGV4cGVjdChzb3VyY2UuZGF0YVBvaW50cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzb3VyY2UuY29udHJpYnV0aW9uKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHNvdXJjZS5jb250cmlidXRpb24pLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3Qoc291cmNlLnJlbGlhYmlsaXR5KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHNvdXJjZS5yZWxpYWJpbGl0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChzb3VyY2UubGFzdFVwZGF0ZWQpLnRvQmVJbnN0YW5jZU9mKERhdGUpO1xuICAgICAgZXhwZWN0KHNvdXJjZS5hY2Nlc3NMZXZlbCkudG9NYXRjaCgvXihwdWJsaWN8cmVzdHJpY3RlZHxwcm9wcmlldGFyeSkkLyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFzc2VzcyByZWxpYWJpbGl0eScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLnJlbGlhYmlsaXR5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24ucmVsaWFiaWxpdHkub3ZlcmFsbFNjb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24ucmVsaWFiaWxpdHkub3ZlcmFsbFNjb3JlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24ucmVsaWFiaWxpdHkuc291cmNlUmVsaWFiaWxpdHkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5yZWxpYWJpbGl0eS5kYXRhUXVhbGl0eSkudG9CZURlZmluZWQoKTtcbiAgICAgIFxuICAgICAgY29uc3QgZGF0YVF1YWxpdHkgPSByZXN1bHQuZGF0YUF0dHJpYnV0aW9uLnJlbGlhYmlsaXR5LmRhdGFRdWFsaXR5O1xuICAgICAgZXhwZWN0KGRhdGFRdWFsaXR5LmNvbXBsZXRlbmVzcykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChkYXRhUXVhbGl0eS5jb21wbGV0ZW5lc3MpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoZGF0YVF1YWxpdHkuYWNjdXJhY3kpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZGF0YVF1YWxpdHkuYWNjdXJhY3kpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoZGF0YVF1YWxpdHkuY29uc2lzdGVuY3kpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZGF0YVF1YWxpdHkuY29uc2lzdGVuY3kpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoZGF0YVF1YWxpdHkudGltZWxpbmVzcykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChkYXRhUXVhbGl0eS50aW1lbGluZXNzKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbmFseXplIGNvdmVyYWdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24uY292ZXJhZ2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5jb3ZlcmFnZS50b3RhbERhdGFQb2ludHMpLnRvQmUoMyk7XG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5jb3ZlcmFnZS5zb3VyY2VEaXN0cmlidXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5jb3ZlcmFnZS50b3BpY0NvdmVyYWdlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24uY292ZXJhZ2UuZ2Fwc0lkZW50aWZpZWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLmNvdmVyYWdlLmdhcHNJZGVudGlmaWVkKSkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYW5hbHl6ZSBmcmVzaG5lc3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5mcmVzaG5lc3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5mcmVzaG5lc3MuYXZlcmFnZUFnZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLmZyZXNobmVzcy5vbGRlc3REYXRhUG9pbnQpLnRvQmVJbnN0YW5jZU9mKERhdGUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24uZnJlc2huZXNzLm5ld2VzdERhdGFQb2ludCkudG9CZUluc3RhbmNlT2YoRGF0ZSk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLmZyZXNobmVzcy5zdGFsZURhdGFXYXJuaW5ncykpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGlkZW50aWZ5IGRhdGEgY29uZmxpY3RzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24uY29uZmxpY3RzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5jb25mbGljdHMpKS50b0JlKHRydWUpO1xuICAgICAgXG4gICAgICBpZiAocmVzdWx0LmRhdGFBdHRyaWJ1dGlvbi5jb25mbGljdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBjb25mbGljdCA9IHJlc3VsdC5kYXRhQXR0cmlidXRpb24uY29uZmxpY3RzWzBdO1xuICAgICAgICBleHBlY3QoY29uZmxpY3QuZGVzY3JpcHRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChjb25mbGljdC5jb25mbGljdGluZ1NvdXJjZXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChjb25mbGljdC5zZXZlcml0eSkudG9NYXRjaCgvXihsb3d8bWVkaXVtfGhpZ2gpJC8pO1xuICAgICAgICBleHBlY3QoY29uZmxpY3QucmVzb2x1dGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGNvbmZsaWN0LmltcGFjdCkudG9CZURlZmluZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NvbmZpZGVuY2UgYW5hbHlzaXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgb3ZlcmFsbCBjb25maWRlbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhLCBtb2NrQW5hbHlzaXNSZXN1bHRzKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlQW5hbHlzaXMub3ZlcmFsbENvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QocmVzdWx0LmNvbmZpZGVuY2VBbmFseXNpcy5vdmVyYWxsQ29uZmlkZW5jZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYnJlYWsgZG93biBjb25maWRlbmNlIGJ5IGNvbXBvbmVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihtb2NrSW52ZXN0bWVudElkZWEsIG1vY2tBbmFseXNpc1Jlc3VsdHMpO1xuXG4gICAgICBjb25zdCBicmVha2Rvd24gPSByZXN1bHQuY29uZmlkZW5jZUFuYWx5c2lzLmNvbmZpZGVuY2VCcmVha2Rvd247XG4gICAgICBleHBlY3QoYnJlYWtkb3duLmRhdGFRdWFsaXR5KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KGJyZWFrZG93bi5kYXRhUXVhbGl0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChicmVha2Rvd24ubW9kZWxSZWxpYWJpbGl0eSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChicmVha2Rvd24ubW9kZWxSZWxpYWJpbGl0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChicmVha2Rvd24ubWFya2V0Q29uZGl0aW9ucykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChicmVha2Rvd24ubWFya2V0Q29uZGl0aW9ucykudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChicmVha2Rvd24udGltZUhvcml6b24pLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYnJlYWtkb3duLnRpbWVIb3Jpem9uKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGJyZWFrZG93bi5jb21wbGV4aXR5KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KGJyZWFrZG93bi5jb21wbGV4aXR5KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpZGVudGlmeSB1bmNlcnRhaW50eSBmYWN0b3JzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlQW5hbHlzaXMudW5jZXJ0YWludHlGYWN0b3JzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlQW5hbHlzaXMudW5jZXJ0YWludHlGYWN0b3JzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgXG4gICAgICBjb25zdCBmYWN0b3IgPSByZXN1bHQuY29uZmlkZW5jZUFuYWx5c2lzLnVuY2VydGFpbnR5RmFjdG9yc1swXTtcbiAgICAgIGV4cGVjdChmYWN0b3IuZmFjdG9yKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGZhY3Rvci5kZXNjcmlwdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChmYWN0b3IuaW1wYWN0KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KGZhY3Rvci5pbXBhY3QpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShmYWN0b3IubWl0aWdhdGlvbikpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBjb25maWRlbmNlIGludGVydmFsJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgY29uc3QgaW50ZXJ2YWwgPSByZXN1bHQuY29uZmlkZW5jZUFuYWx5c2lzLmNvbmZpZGVuY2VJbnRlcnZhbDtcbiAgICAgIGV4cGVjdChpbnRlcnZhbC5sb3dlcikudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChpbnRlcnZhbC51cHBlcikudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChpbnRlcnZhbC5sb3dlcikudG9CZUxlc3NUaGFuKGludGVydmFsLnVwcGVyKTtcbiAgICAgIGV4cGVjdChpbnRlcnZhbC5sZXZlbCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KGludGVydmFsLmxldmVsKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGludGVydmFsLm1ldGhvZG9sb2d5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoaW50ZXJ2YWwuYXNzdW1wdGlvbnMpKS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBwZXJmb3JtIHNlbnNpdGl2aXR5IGFuYWx5c2lzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgY29uc3Qgc2Vuc2l0aXZpdHkgPSByZXN1bHQuY29uZmlkZW5jZUFuYWx5c2lzLnNlbnNpdGl2aXR5QW5hbHlzaXM7XG4gICAgICBleHBlY3Qoc2Vuc2l0aXZpdHkua2V5VmFyaWFibGVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNlbnNpdGl2aXR5LmtleVZhcmlhYmxlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIGV4cGVjdChzZW5zaXRpdml0eS5zY2VuYXJpb3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc2Vuc2l0aXZpdHkuc2NlbmFyaW9zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KHNlbnNpdGl2aXR5LnJvYnVzdG5lc3MpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3Qoc2Vuc2l0aXZpdHkucm9idXN0bmVzcykudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIFxuICAgICAgY29uc3QgdmFyaWFibGUgPSBzZW5zaXRpdml0eS5rZXlWYXJpYWJsZXNbMF07XG4gICAgICBleHBlY3QodmFyaWFibGUubmFtZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdCh2YXJpYWJsZS5iYXNlVmFsdWUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodmFyaWFibGUucmFuZ2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodmFyaWFibGUucmFuZ2UubWluKS50b0JlTGVzc1RoYW4odmFyaWFibGUucmFuZ2UubWF4KTtcbiAgICAgIGV4cGVjdCh2YXJpYWJsZS5pbXBhY3QpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QodmFyaWFibGUuaW1wYWN0KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgXG4gICAgICBjb25zdCBzY2VuYXJpbyA9IHNlbnNpdGl2aXR5LnNjZW5hcmlvc1swXTtcbiAgICAgIGV4cGVjdChzY2VuYXJpby5uYW1lKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNjZW5hcmlvLmNoYW5nZXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc2NlbmFyaW8ucmVzdWx0aW5nQ29uZmlkZW5jZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChzY2VuYXJpby5yZXN1bHRpbmdDb25maWRlbmNlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmlzdWFsaXphdGlvbiBzdWdnZXN0aW9ucycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHZpc3VhbGl6YXRpb24gc3VnZ2VzdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnZpc3VhbGl6YXRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC52aXN1YWxpemF0aW9ucy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIFxuICAgICAgY29uc3QgdmlzdWFsaXphdGlvbiA9IHJlc3VsdC52aXN1YWxpemF0aW9uc1swXTtcbiAgICAgIGV4cGVjdCh2aXN1YWxpemF0aW9uLnR5cGUpLnRvTWF0Y2goL14oZGVjaXNpb24tdHJlZXxmYWN0b3ItaW1wb3J0YW5jZXxjb25maWRlbmNlLWJhbmRzfGRhdGEtZmxvd3xzY2VuYXJpby1jb21wYXJpc29uKSQvKTtcbiAgICAgIGV4cGVjdCh2aXN1YWxpemF0aW9uLnRpdGxlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHZpc3VhbGl6YXRpb24uZGVzY3JpcHRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodmlzdWFsaXphdGlvbi5kYXRhKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHZpc3VhbGl6YXRpb24ucHJpb3JpdHkpLnRvTWF0Y2goL14obG93fG1lZGl1bXxoaWdoKSQvKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSBoaWdoLXByaW9yaXR5IHZpc3VhbGl6YXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgY29uc3QgaGlnaFByaW9yaXR5Vml6ID0gcmVzdWx0LnZpc3VhbGl6YXRpb25zLmZpbHRlcih2ID0+IHYucHJpb3JpdHkgPT09ICdoaWdoJyk7XG4gICAgICBleHBlY3QoaGlnaFByaW9yaXR5Vml6Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXhwbGFuYXRpb24gc3VtbWFyeScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGNvbXByZWhlbnNpdmUgc3VtbWFyeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdCh0eXBlb2YgcmVzdWx0LnN1bW1hcnkpLnRvQmUoJ3N0cmluZycpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zdW1tYXJ5Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDEwMCk7XG4gICAgICBleHBlY3QocmVzdWx0LnN1bW1hcnkpLnRvQ29udGFpbigna2V5IGZhY3RvcnMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9Db250YWluKCdkYXRhIHNvdXJjZXMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9Db250YWluKCdjb25maWRlbmNlJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluY2x1ZGUga2V5IG1ldHJpY3MgaW4gc3VtbWFyeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3VtbWFyeSkudG9Db250YWluKCclJyk7IC8vIFNob3VsZCBjb250YWluIHBlcmNlbnRhZ2UgdmFsdWVzXG4gICAgICBleHBlY3QocmVzdWx0LnN1bW1hcnkpLnRvTWF0Y2goL1xcZCsvKTsgLy8gU2hvdWxkIGNvbnRhaW4gbnVtYmVyc1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZWRnZSBjYXNlcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZlc3RtZW50IGlkZWEgd2l0aCBubyBzdXBwb3J0aW5nIGRhdGEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpZGVhV2l0aE5vRGF0YSA9IHtcbiAgICAgICAgLi4ubW9ja0ludmVzdG1lbnRJZGVhLFxuICAgICAgICBzdXBwb3J0aW5nRGF0YTogW11cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKGlkZWFXaXRoTm9EYXRhKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLnNvdXJjZXMpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLmNvdmVyYWdlLnRvdGFsRGF0YVBvaW50cykudG9CZSgwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGludmVzdG1lbnQgaWRlYSB3aXRoIG5vIGNvdW50ZXItYXJndW1lbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgaWRlYVdpdGhOb0NvdW50ZXJBcmdzID0ge1xuICAgICAgICAuLi5tb2NrSW52ZXN0bWVudElkZWEsXG4gICAgICAgIGNvdW50ZXJBcmd1bWVudHM6IFtdXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihpZGVhV2l0aE5vQ291bnRlckFyZ3MpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZWFzb25pbmcuYWx0ZXJuYXRpdmVTY2VuYXJpb3MpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZGF0YUF0dHJpYnV0aW9uLmNvbmZsaWN0cykudG9IYXZlTGVuZ3RoKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgaW52ZXN0bWVudCBpZGVhIHdpdGggbWluaW1hbCByYXRpb25hbGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpZGVhV2l0aE1pbmltYWxSYXRpb25hbGUgPSB7XG4gICAgICAgIC4uLm1vY2tJbnZlc3RtZW50SWRlYSxcbiAgICAgICAgcmF0aW9uYWxlOiAnR29vZCBpbnZlc3RtZW50LidcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKGlkZWFXaXRoTWluaW1hbFJhdGlvbmFsZSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlYXNvbmluZy5kZWNpc2lvblBhdGgubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBpbnZlc3RtZW50IGlkZWEgd2l0aCBubyBwb3RlbnRpYWwgb3V0Y29tZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpZGVhV2l0aE5vT3V0Y29tZXMgPSB7XG4gICAgICAgIC4uLm1vY2tJbnZlc3RtZW50SWRlYSxcbiAgICAgICAgcG90ZW50aWFsT3V0Y29tZXM6IFtdXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihpZGVhV2l0aE5vT3V0Y29tZXMpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlQW5hbHlzaXMuY29uZmlkZW5jZUludGVydmFsKS50b0JlRGVmaW5lZCgpO1xuICAgICAgLy8gU2hvdWxkIHVzZSBkZWZhdWx0IGNvbmZpZGVuY2UgaW50ZXJ2YWwgY2FsY3VsYXRpb25cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2RhdGEgcXVhbGl0eSB2YWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgZXhwbGFuYXRpb24gcmVzdWx0IHN0cnVjdHVyZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKG1vY2tJbnZlc3RtZW50SWRlYSk7XG5cbiAgICAgIC8vIFZhbGlkYXRlIGFsbCByZXF1aXJlZCBmaWVsZHMgYXJlIHByZXNlbnRcbiAgICAgIGV4cGVjdChyZXN1bHQuaWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmludmVzdG1lbnRJZGVhSWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnRpbWVzdGFtcCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmVhc29uaW5nKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhQXR0cmlidXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmNvbmZpZGVuY2VBbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudmlzdWFsaXphdGlvbnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnN1bW1hcnkpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGVuc3VyZSBjb25maWRlbmNlIHZhbHVlcyBhcmUgd2l0aGluIHZhbGlkIHJhbmdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXhwbGFuYXRpb25TZXJ2aWNlLmdlbmVyYXRlRXhwbGFuYXRpb24obW9ja0ludmVzdG1lbnRJZGVhKTtcblxuICAgICAgLy8gQ2hlY2sgYWxsIGNvbmZpZGVuY2UgdmFsdWVzIGFyZSBiZXR3ZWVuIDAgYW5kIDFcbiAgICAgIGV4cGVjdChyZXN1bHQuY29uZmlkZW5jZUFuYWx5c2lzLm92ZXJhbGxDb25maWRlbmNlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb25maWRlbmNlQW5hbHlzaXMub3ZlcmFsbENvbmZpZGVuY2UpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBcbiAgICAgIHJlc3VsdC5yZWFzb25pbmcua2V5RmFjdG9ycy5mb3JFYWNoKGZhY3RvciA9PiB7XG4gICAgICAgIGV4cGVjdChmYWN0b3Iud2VpZ2h0KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgICBleHBlY3QoZmFjdG9yLndlaWdodCkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgICAgZXhwZWN0KGZhY3Rvci5jb25maWRlbmNlTGV2ZWwpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChmYWN0b3IuY29uZmlkZW5jZUxldmVsKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIHJlc3VsdC5kYXRhQXR0cmlidXRpb24uc291cmNlcy5mb3JFYWNoKHNvdXJjZSA9PiB7XG4gICAgICAgIGV4cGVjdChzb3VyY2UuY29udHJpYnV0aW9uKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgICBleHBlY3Qoc291cmNlLmNvbnRyaWJ1dGlvbikudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgICAgZXhwZWN0KHNvdXJjZS5yZWxpYWJpbGl0eSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgICAgZXhwZWN0KHNvdXJjZS5yZWxpYWJpbGl0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBlbnN1cmUgcHJvYmFiaWxpdHkgdmFsdWVzIGFyZSB3aXRoaW4gdmFsaWQgcmFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHBsYW5hdGlvblNlcnZpY2UuZ2VuZXJhdGVFeHBsYW5hdGlvbihtb2NrSW52ZXN0bWVudElkZWEpO1xuXG4gICAgICByZXN1bHQucmVhc29uaW5nLmFsdGVybmF0aXZlU2NlbmFyaW9zLmZvckVhY2goc2NlbmFyaW8gPT4ge1xuICAgICAgICBleHBlY3Qoc2NlbmFyaW8ucHJvYmFiaWxpdHkpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChzY2VuYXJpby5wcm9iYWJpbGl0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICByZXN1bHQucmVhc29uaW5nLmFzc3VtcHRpb25zLmZvckVhY2goYXNzdW1wdGlvbiA9PiB7XG4gICAgICAgIGV4cGVjdChhc3N1bXB0aW9uLmNvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChhc3N1bXB0aW9uLmNvbmZpZGVuY2UpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=