"use strict";
/**
 * Example demonstrating the ExplanationService functionality
 * Shows how to generate comprehensive explanations for investment ideas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateExplanationService = void 0;
const explanation_service_1 = require("../services/explanation-service");
async function demonstrateExplanationService() {
    console.log('🔍 Investment AI Agent - Explanation Service Example\n');
    // Initialize the explanation service
    const explanationService = new explanation_service_1.ExplanationService();
    // Create a sample investment idea
    const sampleInvestmentIdea = {
        id: 'idea-renewable-energy-2024',
        version: 1,
        title: 'Renewable Energy Sector Growth Opportunity',
        description: 'Strategic investment in renewable energy companies positioned to benefit from global clean energy transition',
        investments: [
            {
                id: 'inv-solar-corp',
                type: 'stock',
                name: 'SolarTech Corporation',
                ticker: 'SOLR',
                description: 'Leading solar panel manufacturer with innovative technology',
                sector: 'Energy',
                industry: 'Renewable Energy',
                marketCap: 15000000000,
                currentPrice: 85.25,
                historicalPerformance: [],
                riskMetrics: {
                    volatility: 0.35,
                    beta: 1.4,
                    sharpeRatio: 1.2,
                    drawdown: 0.22,
                    var: 0.08,
                    correlations: { 'SPY': 0.7, 'XLE': -0.3 }
                },
                relatedInvestments: ['wind-energy-etf', 'clean-tech-fund']
            },
            {
                id: 'inv-wind-power',
                type: 'stock',
                name: 'WindPower Dynamics',
                ticker: 'WIND',
                description: 'Offshore wind farm developer and operator',
                sector: 'Energy',
                industry: 'Renewable Energy',
                marketCap: 8000000000,
                currentPrice: 42.80,
                historicalPerformance: [],
                riskMetrics: {
                    volatility: 0.40,
                    beta: 1.6,
                    sharpeRatio: 1.0,
                    drawdown: 0.28,
                    var: 0.10,
                    correlations: { 'SPY': 0.6, 'XLE': -0.4 }
                },
                relatedInvestments: ['renewable-energy-etf']
            }
        ],
        rationale: 'Government policies strongly support renewable energy adoption. Technological advances are reducing costs significantly. ESG investing trends are driving capital allocation toward clean energy. Market demand is accelerating due to corporate sustainability commitments. Supply chain improvements are enhancing profitability margins.',
        strategy: 'buy',
        timeHorizon: 'long',
        confidenceScore: 0.78,
        generatedAt: new Date('2024-01-20T14:30:00Z'),
        lastUpdatedAt: new Date('2024-01-20T14:30:00Z'),
        potentialOutcomes: [
            {
                scenario: 'best',
                probability: 0.25,
                returnEstimate: 0.65,
                timeToRealization: 1095,
                description: 'Accelerated clean energy transition with strong policy support',
                conditions: [
                    'Aggressive government incentives',
                    'Breakthrough in battery storage technology',
                    'Major corporate renewable energy commitments'
                ],
                keyRisks: ['Technology disruption', 'Supply chain constraints'],
                catalysts: [
                    'New climate legislation',
                    'Grid modernization projects',
                    'Corporate ESG mandates'
                ]
            },
            {
                scenario: 'expected',
                probability: 0.55,
                returnEstimate: 0.35,
                timeToRealization: 1095,
                description: 'Steady renewable energy adoption following current trends',
                conditions: [
                    'Continued policy support',
                    'Gradual cost reductions',
                    'Stable regulatory environment'
                ],
                keyRisks: ['Market volatility', 'Competition from traditional energy'],
                catalysts: [
                    'Technology cost improvements',
                    'Grid integration progress'
                ]
            },
            {
                scenario: 'worst',
                probability: 0.20,
                returnEstimate: -0.15,
                timeToRealization: 730,
                description: 'Policy reversals and technological setbacks slow adoption',
                conditions: [
                    'Reduced government support',
                    'Economic recession',
                    'Technical challenges in grid integration'
                ],
                keyRisks: [
                    'Policy uncertainty',
                    'Commodity price inflation',
                    'Interest rate increases'
                ],
                catalysts: []
            }
        ],
        supportingData: [
            {
                source: 'International Energy Agency',
                type: 'research',
                value: {
                    renewableCapacityGrowth: 0.12,
                    investmentProjections: 4000000000000,
                    policySupport: 'strong'
                },
                timestamp: new Date('2024-01-18T00:00:00Z'),
                reliability: 0.95
            },
            {
                source: 'Bloomberg New Energy Finance',
                type: 'research',
                value: {
                    costDecline: 0.20,
                    capacityAdditions: 295000,
                    marketOutlook: 'positive'
                },
                timestamp: new Date('2024-01-19T00:00:00Z'),
                reliability: 0.90
            },
            {
                source: 'Company Financial Reports',
                type: 'fundamental',
                value: {
                    revenueGrowth: 0.28,
                    marginImprovement: 0.05,
                    orderBacklog: 2500000000
                },
                timestamp: new Date('2024-01-15T00:00:00Z'),
                reliability: 0.92
            },
            {
                source: 'Technical Analysis Platform',
                type: 'technical',
                value: {
                    trendDirection: 'bullish',
                    momentumIndicators: 'positive',
                    supportLevels: [75, 80, 85]
                },
                timestamp: new Date('2024-01-20T09:00:00Z'),
                reliability: 0.75
            },
            {
                source: 'ESG Research Provider',
                type: 'sentiment',
                value: {
                    esgScore: 8.5,
                    sustainabilityRating: 'AA',
                    investorSentiment: 'very positive'
                },
                timestamp: new Date('2024-01-19T12:00:00Z'),
                reliability: 0.85
            },
            {
                source: 'Market News Aggregator',
                type: 'news',
                value: {
                    sentimentScore: 0.72,
                    articleCount: 156,
                    keyTopics: ['policy support', 'technology advancement', 'investment flows']
                },
                timestamp: new Date('2024-01-20T08:00:00Z'),
                reliability: 0.70
            }
        ],
        counterArguments: [
            {
                description: 'High capital requirements and long payback periods may strain cash flows',
                strength: 'moderate',
                impact: 'medium',
                mitigationStrategy: 'Focus on companies with strong balance sheets and government backing',
                probability: 0.35
            },
            {
                description: 'Intermittency issues and grid integration challenges could limit growth',
                strength: 'strong',
                impact: 'high',
                mitigationStrategy: 'Invest in companies developing storage solutions and grid technologies',
                probability: 0.45
            },
            {
                description: 'Potential policy reversals could reduce government incentives',
                strength: 'moderate',
                impact: 'high',
                mitigationStrategy: 'Diversify across multiple geographies and policy environments',
                probability: 0.25
            }
        ],
        complianceStatus: {
            compliant: true,
            issues: [
                {
                    severity: 'info',
                    regulation: 'ESG Disclosure Requirements',
                    description: 'Enhanced ESG reporting may be required for renewable energy investments',
                    remediation: 'Ensure comprehensive ESG documentation and reporting processes',
                    estimatedImpact: 'low'
                }
            ],
            regulationsChecked: ['SEC', 'FINRA', 'ESG Guidelines', 'TCFD'],
            timestamp: new Date('2024-01-20T13:00:00Z'),
            reviewedBy: 'compliance-agent-v2',
            nextReviewDate: new Date('2024-04-20T13:00:00Z')
        },
        createdBy: 'claude-sonnet-3.7',
        tags: ['renewable-energy', 'ESG', 'long-term-growth', 'clean-technology'],
        category: 'thematic',
        riskLevel: 'moderate',
        targetAudience: ['institutional', 'pension-fund', 'family-office'],
        metadata: {
            sourceModels: ['claude-sonnet-3.7', 'amazon-nova-pro', 'claude-haiku-3.5'],
            processingTime: 8500,
            dataSourcesUsed: [
                'International Energy Agency',
                'Bloomberg New Energy Finance',
                'Company Financial Reports',
                'Technical Analysis Platform',
                'ESG Research Provider',
                'Market News Aggregator'
            ],
            researchDepth: 'comprehensive',
            qualityScore: 88,
            noveltyScore: 75,
            marketConditionsAtGeneration: {
                volatilityIndex: 22,
                marketTrend: 'bull',
                economicIndicators: {
                    gdp: 0.028,
                    inflation: 0.032,
                    interestRates: 0.045
                },
                geopoliticalRisk: 'medium'
            }
        },
        trackingInfo: {
            views: 0,
            implementations: 0,
            feedback: [],
            performance: [],
            status: 'active',
            statusHistory: [
                {
                    status: 'active',
                    timestamp: new Date('2024-01-20T14:30:00Z'),
                    reason: 'Initial creation',
                    changedBy: 'claude-sonnet-3.7'
                }
            ]
        }
    };
    // Create sample analysis results
    const sampleAnalysisResults = [
        {
            id: 'analysis-renewable-fundamental',
            investmentId: 'inv-solar-corp',
            analysisType: 'fundamental',
            timestamp: new Date('2024-01-20T12:00:00Z'),
            analyst: 'amazon-nova-pro',
            summary: 'Strong fundamental outlook driven by policy support and cost improvements',
            confidence: 0.85,
            details: {
                strengths: [
                    'Strong revenue growth trajectory',
                    'Improving profit margins',
                    'Robust order backlog',
                    'Favorable regulatory environment'
                ],
                weaknesses: [
                    'High capital intensity',
                    'Cyclical demand patterns',
                    'Supply chain dependencies'
                ],
                opportunities: [
                    'Grid modernization investments',
                    'Corporate sustainability mandates',
                    'Emerging market expansion'
                ],
                threats: [
                    'Policy uncertainty',
                    'Technology disruption',
                    'Commodity price volatility'
                ],
                keyMetrics: {
                    revenueGrowthRate: 0.28,
                    ebitdaMargin: 0.18,
                    roic: 0.12,
                    debtToEquity: 0.45,
                    currentRatio: 1.8
                },
                narratives: [
                    'The renewable energy transition is accelerating globally',
                    'Technology costs continue to decline, improving competitiveness',
                    'Policy support remains strong across major markets'
                ]
            },
            recommendations: [
                {
                    action: 'buy',
                    timeHorizon: 'long',
                    targetPrice: 110,
                    confidence: 0.82,
                    rationale: 'Strong fundamentals and favorable industry dynamics support higher valuation'
                }
            ],
            dataPoints: []
        },
        {
            id: 'analysis-renewable-technical',
            investmentId: 'inv-wind-power',
            analysisType: 'technical',
            timestamp: new Date('2024-01-20T11:30:00Z'),
            analyst: 'claude-haiku-3.5',
            summary: 'Technical indicators show bullish momentum with strong support levels',
            confidence: 0.72,
            details: {
                strengths: [
                    'Upward trending price action',
                    'Strong volume confirmation',
                    'Bullish momentum indicators'
                ],
                weaknesses: [
                    'High volatility',
                    'Resistance at key levels'
                ],
                opportunities: [
                    'Breakout above resistance',
                    'Sector rotation into clean energy'
                ],
                threats: [
                    'Market correction risk',
                    'Sector-wide selling pressure'
                ],
                keyMetrics: {
                    rsi: 68,
                    macd: 'bullish crossover',
                    movingAverages: 'above 50 and 200 day',
                    volumeProfile: 'accumulation'
                },
                narratives: [
                    'Technical setup suggests continued upward momentum',
                    'Sector leadership in clean energy theme'
                ]
            },
            recommendations: [
                {
                    action: 'buy',
                    timeHorizon: 'medium',
                    targetPrice: 55,
                    confidence: 0.70,
                    rationale: 'Technical breakout potential with sector tailwinds'
                }
            ],
            dataPoints: []
        }
    ];
    try {
        console.log('📊 Generating comprehensive explanation for renewable energy investment idea...\n');
        // Generate the explanation
        const explanation = await explanationService.generateExplanation(sampleInvestmentIdea, sampleAnalysisResults);
        console.log('✅ Explanation generated successfully!\n');
        console.log(`📋 Explanation ID: ${explanation.id}`);
        console.log(`🎯 Investment Idea: ${explanation.investmentIdeaId}`);
        console.log(`⏰ Generated at: ${explanation.timestamp.toISOString()}\n`);
        // Display reasoning explanation
        console.log('🧠 REASONING EXPLANATION');
        console.log('='.repeat(50));
        console.log(`Decision Steps: ${explanation.reasoning.decisionPath.length}`);
        console.log(`Key Factors: ${explanation.reasoning.keyFactors.length}`);
        console.log(`Logical Connections: ${explanation.reasoning.logicalChain.length}`);
        console.log(`Assumptions: ${explanation.reasoning.assumptions.length}`);
        console.log(`Alternative Scenarios: ${explanation.reasoning.alternativeScenarios.length}\n`);
        // Show top key factors
        console.log('🔑 Top Key Factors:');
        explanation.reasoning.keyFactors.slice(0, 3).forEach((factor, index) => {
            console.log(`  ${index + 1}. ${factor.name} (Weight: ${(factor.weight * 100).toFixed(1)}%, Direction: ${factor.direction})`);
            console.log(`     ${factor.description}`);
        });
        console.log();
        // Display data attribution
        console.log('📚 DATA ATTRIBUTION');
        console.log('='.repeat(50));
        console.log(`Total Sources: ${explanation.dataAttribution.sources.length}`);
        console.log(`Overall Reliability: ${(explanation.dataAttribution.reliability.overallScore * 100).toFixed(1)}%`);
        console.log(`Data Quality Score: ${(explanation.dataAttribution.reliability.dataQuality.accuracy * 100).toFixed(1)}%`);
        console.log(`Average Data Age: ${explanation.dataAttribution.freshness.averageAge.toFixed(1)} hours\n`);
        // Show data sources
        console.log('📊 Data Sources:');
        explanation.dataAttribution.sources.forEach((source, index) => {
            console.log(`  ${index + 1}. ${source.sourceName} (${source.sourceType})`);
            console.log(`     Contribution: ${(source.contribution * 100).toFixed(1)}%, Reliability: ${(source.reliability * 100).toFixed(1)}%`);
            console.log(`     Data Points: ${source.dataPoints.length}, Access: ${source.accessLevel}`);
        });
        console.log();
        // Display confidence analysis
        console.log('🎯 CONFIDENCE ANALYSIS');
        console.log('='.repeat(50));
        console.log(`Overall Confidence: ${(explanation.confidenceAnalysis.overallConfidence * 100).toFixed(1)}%`);
        console.log(`Confidence Interval: ${(explanation.confidenceAnalysis.confidenceInterval.lower * 100).toFixed(1)}% - ${(explanation.confidenceAnalysis.confidenceInterval.upper * 100).toFixed(1)}%`);
        console.log(`Robustness Score: ${(explanation.confidenceAnalysis.sensitivityAnalysis.robustness * 100).toFixed(1)}%\n`);
        // Show confidence breakdown
        console.log('📈 Confidence Breakdown:');
        const breakdown = explanation.confidenceAnalysis.confidenceBreakdown;
        console.log(`  Data Quality: ${(breakdown.dataQuality * 100).toFixed(1)}%`);
        console.log(`  Model Reliability: ${(breakdown.modelReliability * 100).toFixed(1)}%`);
        console.log(`  Market Conditions: ${(breakdown.marketConditions * 100).toFixed(1)}%`);
        console.log(`  Time Horizon: ${(breakdown.timeHorizon * 100).toFixed(1)}%`);
        console.log(`  Complexity: ${(breakdown.complexity * 100).toFixed(1)}%\n`);
        // Show uncertainty factors
        console.log('⚠️  Top Uncertainty Factors:');
        explanation.confidenceAnalysis.uncertaintyFactors.slice(0, 3).forEach((factor, index) => {
            console.log(`  ${index + 1}. ${factor.factor} (Impact: ${(factor.impact * 100).toFixed(1)}%)`);
            console.log(`     ${factor.description}`);
            if (factor.mitigation.length > 0) {
                console.log(`     Mitigation: ${factor.mitigation.join(', ')}`);
            }
        });
        console.log();
        // Display visualization suggestions
        console.log('📊 VISUALIZATION SUGGESTIONS');
        console.log('='.repeat(50));
        explanation.visualizations.forEach((viz, index) => {
            console.log(`${index + 1}. ${viz.title} (${viz.type}) - Priority: ${viz.priority}`);
            console.log(`   ${viz.description}`);
        });
        console.log();
        // Display summary
        console.log('📝 EXPLANATION SUMMARY');
        console.log('='.repeat(50));
        console.log(explanation.summary);
        console.log();
        // Show data conflicts if any
        if (explanation.dataAttribution.conflicts.length > 0) {
            console.log('⚡ DATA CONFLICTS IDENTIFIED');
            console.log('='.repeat(50));
            explanation.dataAttribution.conflicts.forEach((conflict, index) => {
                console.log(`${index + 1}. ${conflict.description} (Severity: ${conflict.severity})`);
                console.log(`   Conflicting Sources: ${conflict.conflictingSources.join(', ')}`);
                console.log(`   Resolution: ${conflict.resolution}`);
                console.log(`   Impact: ${conflict.impact}`);
            });
            console.log();
        }
        // Show sensitivity analysis scenarios
        console.log('🔄 SENSITIVITY ANALYSIS SCENARIOS');
        console.log('='.repeat(50));
        explanation.confidenceAnalysis.sensitivityAnalysis.scenarios.forEach((scenario, index) => {
            console.log(`${index + 1}. ${scenario.name}`);
            console.log(`   Resulting Confidence: ${(scenario.resultingConfidence * 100).toFixed(1)}%`);
            console.log(`   Outcome Change: ${(scenario.outcomeChange * 100).toFixed(1)}%`);
            console.log(`   Variable Changes: ${Object.entries(scenario.changes).map(([key, value]) => `${key}: ${value}`).join(', ')}`);
        });
        console.log();
        console.log('🎉 Explanation service demonstration completed successfully!');
        console.log('\nThis comprehensive explanation provides:');
        console.log('• Transparent reasoning with decision steps and key factors');
        console.log('• Complete data source attribution with reliability assessment');
        console.log('• Detailed confidence analysis with uncertainty quantification');
        console.log('• Visualization suggestions for better understanding');
        console.log('• Sensitivity analysis for robustness evaluation');
    }
    catch (error) {
        console.error('❌ Error during explanation generation:', error);
        throw error;
    }
}
exports.demonstrateExplanationService = demonstrateExplanationService;
// Run the demonstration
if (require.main === module) {
    demonstrateExplanationService()
        .then(() => {
        console.log('\n✅ Explanation service example completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n❌ Explanation service example failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbGFuYXRpb24tc2VydmljZS1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL2V4cGxhbmF0aW9uLXNlcnZpY2UtZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFFSCx5RUFBcUU7QUFLckUsS0FBSyxVQUFVLDZCQUE2QjtJQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7SUFFdEUscUNBQXFDO0lBQ3JDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSx3Q0FBa0IsRUFBRSxDQUFDO0lBRXBELGtDQUFrQztJQUNsQyxNQUFNLG9CQUFvQixHQUFtQjtRQUMzQyxFQUFFLEVBQUUsNEJBQTRCO1FBQ2hDLE9BQU8sRUFBRSxDQUFDO1FBQ1YsS0FBSyxFQUFFLDRDQUE0QztRQUNuRCxXQUFXLEVBQUUsOEdBQThHO1FBQzNILFdBQVcsRUFBRTtZQUNYO2dCQUNFLEVBQUUsRUFBRSxnQkFBZ0I7Z0JBQ3BCLElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSx1QkFBdUI7Z0JBQzdCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFdBQVcsRUFBRSw2REFBNkQ7Z0JBQzFFLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixRQUFRLEVBQUUsa0JBQWtCO2dCQUM1QixTQUFTLEVBQUUsV0FBVztnQkFDdEIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLHFCQUFxQixFQUFFLEVBQUU7Z0JBQ3pCLFdBQVcsRUFBRTtvQkFDWCxVQUFVLEVBQUUsSUFBSTtvQkFDaEIsSUFBSSxFQUFFLEdBQUc7b0JBQ1QsV0FBVyxFQUFFLEdBQUc7b0JBQ2hCLFFBQVEsRUFBRSxJQUFJO29CQUNkLEdBQUcsRUFBRSxJQUFJO29CQUNULFlBQVksRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFO2lCQUMxQztnQkFDRCxrQkFBa0IsRUFBRSxDQUFD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QUMsOERBQThELENBQUMsQ0FBQztRQUM1RSxPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUM7UUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO1FBQzNFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0VBQWdFLENBQUMsQ0FBQztRQUM5RSxPQUFPLENBQUMsR0FBRyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7UUFDOUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0RBQWtELENBQUMsQ0FBQztLQUVqRTtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRCxNQUFNLEtBQUssQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQWVRLHNFQUE2QjtBQWJ0Qyx3QkFBd0I7QUFDeEIsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUMzQiw2QkFBNkIsRUFBRTtTQUM1QixJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO1FBQ3RFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHlDQUF5QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7Q0FDTiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRXhhbXBsZSBkZW1vbnN0cmF0aW5nIHRoZSBFeHBsYW5hdGlvblNlcnZpY2UgZnVuY3Rpb25hbGl0eVxuICogU2hvd3MgaG93IHRvIGdlbmVyYXRlIGNvbXByZWhlbnNpdmUgZXhwbGFuYXRpb25zIGZvciBpbnZlc3RtZW50IGlkZWFzXG4gKi9cblxuaW1wb3J0IHsgRXhwbGFuYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvZXhwbGFuYXRpb24tc2VydmljZSc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYSB9IGZyb20gJy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEnO1xuaW1wb3J0IHsgRGF0YVBvaW50LCBBbmFseXNpc1Jlc3VsdCB9IGZyb20gJy4uL21vZGVscy9hbmFseXNpcyc7XG5pbXBvcnQgeyBJbnZlc3RtZW50IH0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuXG5hc3luYyBmdW5jdGlvbiBkZW1vbnN0cmF0ZUV4cGxhbmF0aW9uU2VydmljZSgpIHtcbiAgY29uc29sZS5sb2coJ/CflI0gSW52ZXN0bWVudCBBSSBBZ2VudCAtIEV4cGxhbmF0aW9uIFNlcnZpY2UgRXhhbXBsZVxcbicpO1xuXG4gIC8vIEluaXRpYWxpemUgdGhlIGV4cGxhbmF0aW9uIHNlcnZpY2VcbiAgY29uc3QgZXhwbGFuYXRpb25TZXJ2aWNlID0gbmV3IEV4cGxhbmF0aW9uU2VydmljZSgpO1xuXG4gIC8vIENyZWF0ZSBhIHNhbXBsZSBpbnZlc3RtZW50IGlkZWFcbiAgY29uc3Qgc2FtcGxlSW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhID0ge1xuICAgIGlkOiAnaWRlYS1yZW5ld2FibGUtZW5lcmd5LTIwMjQnLFxuICAgIHZlcnNpb246IDEsXG4gICAgdGl0bGU6ICdSZW5ld2FibGUgRW5lcmd5IFNlY3RvciBHcm93dGggT3Bwb3J0dW5pdHknLFxuICAgIGRlc2NyaXB0aW9uOiAnU3RyYXRlZ2ljIGludmVzdG1lbnQgaW4gcmVuZXdhYmxlIGVuZXJneSBjb21wYW5pZXMgcG9zaXRpb25lZCB0byBiZW5lZml0IGZyb20gZ2xvYmFsIGNsZWFuIGVuZXJneSB0cmFuc2l0aW9uJyxcbiAgICBpbnZlc3RtZW50czogW1xuICAgICAge1xuICAgICAgICBpZDogJ2ludi1zb2xhci1jb3JwJyxcbiAgICAgICAgdHlwZTogJ3N0b2NrJyxcbiAgICAgICAgbmFtZTogJ1NvbGFyVGVjaCBDb3Jwb3JhdGlvbicsXG4gICAgICAgIHRpY2tlcjogJ1NPTFInLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0xlYWRpbmcgc29sYXIgcGFuZWwgbWFudWZhY3R1cmVyIHdpdGggaW5ub3ZhdGl2ZSB0ZWNobm9sb2d5JyxcbiAgICAgICAgc2VjdG9yOiAnRW5lcmd5JyxcbiAgICAgICAgaW5kdXN0cnk6ICdSZW5ld2FibGUgRW5lcmd5JyxcbiAgICAgICAgbWFya2V0Q2FwOiAxNTAwMDAwMDAwMCxcbiAgICAgICAgY3VycmVudFByaWNlOiA4NS4yNSxcbiAgICAgICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgICB2b2xhdGlsaXR5OiAwLjM1LFxuICAgICAgICAgIGJldGE6IDEuNCxcbiAgICAgICAgICBzaGFycGVSYXRpbzogMS4yLFxuICAgICAgICAgIGRyYXdkb3duOiAwLjIyLFxuICAgICAgICAgIHZhcjogMC4wOCxcbiAgICAgICAgICBjb3JyZWxhdGlvbnM6IHsgJ1NQWSc6IDAuNywgJ1hMRSc6IC0wLjMgfVxuICAgICAgICB9LFxuICAgICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFsnd2luZC1lbmVyZ3ktZXRmJywgJ2NsZWFuLXRlY2gtZnVuZCddXG4gICAgICB9IGFzIEludmVzdG1lbnQsXG4gICAgICB7XG4gICAgICAgIGlkOiAnaW52LXdpbmQtcG93ZXInLFxuICAgICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgICBuYW1lOiAnV2luZFBvd2VyIER5bmFtaWNzJyxcbiAgICAgICAgdGlja2VyOiAnV0lORCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnT2Zmc2hvcmUgd2luZCBmYXJtIGRldmVsb3BlciBhbmQgb3BlcmF0b3InLFxuICAgICAgICBzZWN0b3I6ICdFbmVyZ3knLFxuICAgICAgICBpbmR1c3RyeTogJ1JlbmV3YWJsZSBFbmVyZ3knLFxuICAgICAgICBtYXJrZXRDYXA6IDgwMDAwMDAwMDAsXG4gICAgICAgIGN1cnJlbnRQcmljZTogNDIuODAsXG4gICAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICAgICAgdm9sYXRpbGl0eTogMC40MCxcbiAgICAgICAgICBiZXRhOiAxLjYsXG4gICAgICAgICAgc2hhcnBlUmF0aW86IDEuMCxcbiAgICAgICAgICBkcmF3ZG93bjogMC4yOCxcbiAgICAgICAgICB2YXI6IDAuMTAsXG4gICAgICAgICAgY29ycmVsYXRpb25zOiB7ICdTUFknOiAwLjYsICdYTEUnOiAtMC40IH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbJ3JlbmV3YWJsZS1lbmVyZ3ktZXRmJ11cbiAgICAgIH0gYXMgSW52ZXN0bWVudFxuICAgIF0sXG4gICAgcmF0aW9uYWxlOiAnR292ZXJubWVudCBwb2xpY2llcyBzdHJvbmdseSBzdXBwb3J0IHJlbmV3YWJsZSBlbmVyZ3kgYWRvcHRpb24uIFRlY2hub2xvZ2ljYWwgYWR2YW5jZXMgYXJlIHJlZHVjaW5nIGNvc3RzIHNpZ25pZmljYW50bHkuIEVTRyBpbnZlc3RpbmcgdHJlbmRzIGFyZSBkcml2aW5nIGNhcGl0YWwgYWxsb2NhdGlvbiB0b3dhcmQgY2xlYW4gZW5lcmd5LiBNYXJrZXQgZGVtYW5kIGlzIGFjY2VsZXJhdGluZyBkdWUgdG8gY29ycG9yYXRlIHN1c3RhaW5hYmlsaXR5IGNvbW1pdG1lbnRzLiBTdXBwbHkgY2hhaW4gaW1wcm92ZW1lbnRzIGFyZSBlbmhhbmNpbmcgcHJvZml0YWJpbGl0eSBtYXJnaW5zLicsXG4gICAgc3RyYXRlZ3k6ICdidXknLFxuICAgIHRpbWVIb3Jpem9uOiAnbG9uZycsXG4gICAgY29uZmlkZW5jZVNjb3JlOiAwLjc4LFxuICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMS0yMFQxNDozMDowMFonKSxcbiAgICBsYXN0VXBkYXRlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMS0yMFQxNDozMDowMFonKSxcbiAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ2Jlc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yNSxcbiAgICAgICAgcmV0dXJuRXN0aW1hdGU6IDAuNjUsXG4gICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAxMDk1LCAvLyAzIHllYXJzXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQWNjZWxlcmF0ZWQgY2xlYW4gZW5lcmd5IHRyYW5zaXRpb24gd2l0aCBzdHJvbmcgcG9saWN5IHN1cHBvcnQnLFxuICAgICAgICBjb25kaXRpb25zOiBbXG4gICAgICAgICAgJ0FnZ3Jlc3NpdmUgZ292ZXJubWVudCBpbmNlbnRpdmVzJyxcbiAgICAgICAgICAnQnJlYWt0aHJvdWdoIGluIGJhdHRlcnkgc3RvcmFnZSB0ZWNobm9sb2d5JyxcbiAgICAgICAgICAnTWFqb3IgY29ycG9yYXRlIHJlbmV3YWJsZSBlbmVyZ3kgY29tbWl0bWVudHMnXG4gICAgICAgIF0sXG4gICAgICAgIGtleVJpc2tzOiBbJ1RlY2hub2xvZ3kgZGlzcnVwdGlvbicsICdTdXBwbHkgY2hhaW4gY29uc3RyYWludHMnXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbXG4gICAgICAgICAgJ05ldyBjbGltYXRlIGxlZ2lzbGF0aW9uJyxcbiAgICAgICAgICAnR3JpZCBtb2Rlcm5pemF0aW9uIHByb2plY3RzJyxcbiAgICAgICAgICAnQ29ycG9yYXRlIEVTRyBtYW5kYXRlcydcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2NlbmFyaW86ICdleHBlY3RlZCcsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjU1LFxuICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC4zNSxcbiAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDEwOTUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3RlYWR5IHJlbmV3YWJsZSBlbmVyZ3kgYWRvcHRpb24gZm9sbG93aW5nIGN1cnJlbnQgdHJlbmRzJyxcbiAgICAgICAgY29uZGl0aW9uczogW1xuICAgICAgICAgICdDb250aW51ZWQgcG9saWN5IHN1cHBvcnQnLFxuICAgICAgICAgICdHcmFkdWFsIGNvc3QgcmVkdWN0aW9ucycsXG4gICAgICAgICAgJ1N0YWJsZSByZWd1bGF0b3J5IGVudmlyb25tZW50J1xuICAgICAgICBdLFxuICAgICAgICBrZXlSaXNrczogWydNYXJrZXQgdm9sYXRpbGl0eScsICdDb21wZXRpdGlvbiBmcm9tIHRyYWRpdGlvbmFsIGVuZXJneSddLFxuICAgICAgICBjYXRhbHlzdHM6IFtcbiAgICAgICAgICAnVGVjaG5vbG9neSBjb3N0IGltcHJvdmVtZW50cycsXG4gICAgICAgICAgJ0dyaWQgaW50ZWdyYXRpb24gcHJvZ3Jlc3MnXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yMCxcbiAgICAgICAgcmV0dXJuRXN0aW1hdGU6IC0wLjE1LFxuICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogNzMwLCAvLyAyIHllYXJzXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUG9saWN5IHJldmVyc2FscyBhbmQgdGVjaG5vbG9naWNhbCBzZXRiYWNrcyBzbG93IGFkb3B0aW9uJyxcbiAgICAgICAgY29uZGl0aW9uczogW1xuICAgICAgICAgICdSZWR1Y2VkIGdvdmVybm1lbnQgc3VwcG9ydCcsXG4gICAgICAgICAgJ0Vjb25vbWljIHJlY2Vzc2lvbicsXG4gICAgICAgICAgJ1RlY2huaWNhbCBjaGFsbGVuZ2VzIGluIGdyaWQgaW50ZWdyYXRpb24nXG4gICAgICAgIF0sXG4gICAgICAgIGtleVJpc2tzOiBbXG4gICAgICAgICAgJ1BvbGljeSB1bmNlcnRhaW50eScsXG4gICAgICAgICAgJ0NvbW1vZGl0eSBwcmljZSBpbmZsYXRpb24nLFxuICAgICAgICAgICdJbnRlcmVzdCByYXRlIGluY3JlYXNlcydcbiAgICAgICAgXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbXVxuICAgICAgfVxuICAgIF0sXG4gICAgc3VwcG9ydGluZ0RhdGE6IFtcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAnSW50ZXJuYXRpb25hbCBFbmVyZ3kgQWdlbmN5JyxcbiAgICAgICAgdHlwZTogJ3Jlc2VhcmNoJyxcbiAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICByZW5ld2FibGVDYXBhY2l0eUdyb3d0aDogMC4xMixcbiAgICAgICAgICBpbnZlc3RtZW50UHJvamVjdGlvbnM6IDQwMDAwMDAwMDAwMDAsXG4gICAgICAgICAgcG9saWN5U3VwcG9ydDogJ3N0cm9uZydcbiAgICAgICAgfSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wMS0xOFQwMDowMDowMFonKSxcbiAgICAgICAgcmVsaWFiaWxpdHk6IDAuOTVcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNvdXJjZTogJ0Jsb29tYmVyZyBOZXcgRW5lcmd5IEZpbmFuY2UnLFxuICAgICAgICB0eXBlOiAncmVzZWFyY2gnLFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgIGNvc3REZWNsaW5lOiAwLjIwLFxuICAgICAgICAgIGNhcGFjaXR5QWRkaXRpb25zOiAyOTUwMDAsXG4gICAgICAgICAgbWFya2V0T3V0bG9vazogJ3Bvc2l0aXZlJ1xuICAgICAgICB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTE5VDAwOjAwOjAwWicpLFxuICAgICAgICByZWxpYWJpbGl0eTogMC45MFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAnQ29tcGFueSBGaW5hbmNpYWwgUmVwb3J0cycsXG4gICAgICAgIHR5cGU6ICdmdW5kYW1lbnRhbCcsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgcmV2ZW51ZUdyb3d0aDogMC4yOCxcbiAgICAgICAgICBtYXJnaW5JbXByb3ZlbWVudDogMC4wNSxcbiAgICAgICAgICBvcmRlckJhY2tsb2c6IDI1MDAwMDAwMDBcbiAgICAgICAgfSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wMS0xNVQwMDowMDowMFonKSxcbiAgICAgICAgcmVsaWFiaWxpdHk6IDAuOTJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNvdXJjZTogJ1RlY2huaWNhbCBBbmFseXNpcyBQbGF0Zm9ybScsXG4gICAgICAgIHR5cGU6ICd0ZWNobmljYWwnLFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgIHRyZW5kRGlyZWN0aW9uOiAnYnVsbGlzaCcsXG4gICAgICAgICAgbW9tZW50dW1JbmRpY2F0b3JzOiAncG9zaXRpdmUnLFxuICAgICAgICAgIHN1cHBvcnRMZXZlbHM6IFs3NSwgODAsIDg1XVxuICAgICAgICB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTIwVDA5OjAwOjAwWicpLFxuICAgICAgICByZWxpYWJpbGl0eTogMC43NVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAnRVNHIFJlc2VhcmNoIFByb3ZpZGVyJyxcbiAgICAgICAgdHlwZTogJ3NlbnRpbWVudCcsXG4gICAgICAgIHZhbHVlOiB7XG4gICAgICAgICAgZXNnU2NvcmU6IDguNSxcbiAgICAgICAgICBzdXN0YWluYWJpbGl0eVJhdGluZzogJ0FBJyxcbiAgICAgICAgICBpbnZlc3RvclNlbnRpbWVudDogJ3ZlcnkgcG9zaXRpdmUnXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjQtMDEtMTlUMTI6MDA6MDBaJyksXG4gICAgICAgIHJlbGlhYmlsaXR5OiAwLjg1XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzb3VyY2U6ICdNYXJrZXQgTmV3cyBBZ2dyZWdhdG9yJyxcbiAgICAgICAgdHlwZTogJ25ld3MnLFxuICAgICAgICB2YWx1ZToge1xuICAgICAgICAgIHNlbnRpbWVudFNjb3JlOiAwLjcyLFxuICAgICAgICAgIGFydGljbGVDb3VudDogMTU2LFxuICAgICAgICAgIGtleVRvcGljczogWydwb2xpY3kgc3VwcG9ydCcsICd0ZWNobm9sb2d5IGFkdmFuY2VtZW50JywgJ2ludmVzdG1lbnQgZmxvd3MnXVxuICAgICAgICB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTIwVDA4OjAwOjAwWicpLFxuICAgICAgICByZWxpYWJpbGl0eTogMC43MFxuICAgICAgfVxuICAgIF0sXG4gICAgY291bnRlckFyZ3VtZW50czogW1xuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0hpZ2ggY2FwaXRhbCByZXF1aXJlbWVudHMgYW5kIGxvbmcgcGF5YmFjayBwZXJpb2RzIG1heSBzdHJhaW4gY2FzaCBmbG93cycsXG4gICAgICAgIHN0cmVuZ3RoOiAnbW9kZXJhdGUnLFxuICAgICAgICBpbXBhY3Q6ICdtZWRpdW0nLFxuICAgICAgICBtaXRpZ2F0aW9uU3RyYXRlZ3k6ICdGb2N1cyBvbiBjb21wYW5pZXMgd2l0aCBzdHJvbmcgYmFsYW5jZSBzaGVldHMgYW5kIGdvdmVybm1lbnQgYmFja2luZycsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjM1XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0ludGVybWl0dGVuY3kgaXNzdWVzIGFuZCBncmlkIGludGVncmF0aW9uIGNoYWxsZW5nZXMgY291bGQgbGltaXQgZ3Jvd3RoJyxcbiAgICAgICAgc3RyZW5ndGg6ICdzdHJvbmcnLFxuICAgICAgICBpbXBhY3Q6ICdoaWdoJyxcbiAgICAgICAgbWl0aWdhdGlvblN0cmF0ZWd5OiAnSW52ZXN0IGluIGNvbXBhbmllcyBkZXZlbG9waW5nIHN0b3JhZ2Ugc29sdXRpb25zIGFuZCBncmlkIHRlY2hub2xvZ2llcycsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjQ1XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ1BvdGVudGlhbCBwb2xpY3kgcmV2ZXJzYWxzIGNvdWxkIHJlZHVjZSBnb3Zlcm5tZW50IGluY2VudGl2ZXMnLFxuICAgICAgICBzdHJlbmd0aDogJ21vZGVyYXRlJyxcbiAgICAgICAgaW1wYWN0OiAnaGlnaCcsXG4gICAgICAgIG1pdGlnYXRpb25TdHJhdGVneTogJ0RpdmVyc2lmeSBhY3Jvc3MgbXVsdGlwbGUgZ2VvZ3JhcGhpZXMgYW5kIHBvbGljeSBlbnZpcm9ubWVudHMnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yNVxuICAgICAgfVxuICAgIF0sXG4gICAgY29tcGxpYW5jZVN0YXR1czoge1xuICAgICAgY29tcGxpYW50OiB0cnVlLFxuICAgICAgaXNzdWVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgICAgICAgIHJlZ3VsYXRpb246ICdFU0cgRGlzY2xvc3VyZSBSZXF1aXJlbWVudHMnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRW5oYW5jZWQgRVNHIHJlcG9ydGluZyBtYXkgYmUgcmVxdWlyZWQgZm9yIHJlbmV3YWJsZSBlbmVyZ3kgaW52ZXN0bWVudHMnLFxuICAgICAgICAgIHJlbWVkaWF0aW9uOiAnRW5zdXJlIGNvbXByZWhlbnNpdmUgRVNHIGRvY3VtZW50YXRpb24gYW5kIHJlcG9ydGluZyBwcm9jZXNzZXMnLFxuICAgICAgICAgIGVzdGltYXRlZEltcGFjdDogJ2xvdydcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIHJlZ3VsYXRpb25zQ2hlY2tlZDogWydTRUMnLCAnRklOUkEnLCAnRVNHIEd1aWRlbGluZXMnLCAnVENGRCddLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wMS0yMFQxMzowMDowMFonKSxcbiAgICAgIHJldmlld2VkQnk6ICdjb21wbGlhbmNlLWFnZW50LXYyJyxcbiAgICAgIG5leHRSZXZpZXdEYXRlOiBuZXcgRGF0ZSgnMjAyNC0wNC0yMFQxMzowMDowMFonKVxuICAgIH0sXG4gICAgY3JlYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgIHRhZ3M6IFsncmVuZXdhYmxlLWVuZXJneScsICdFU0cnLCAnbG9uZy10ZXJtLWdyb3d0aCcsICdjbGVhbi10ZWNobm9sb2d5J10sXG4gICAgY2F0ZWdvcnk6ICd0aGVtYXRpYycsXG4gICAgcmlza0xldmVsOiAnbW9kZXJhdGUnLFxuICAgIHRhcmdldEF1ZGllbmNlOiBbJ2luc3RpdHV0aW9uYWwnLCAncGVuc2lvbi1mdW5kJywgJ2ZhbWlseS1vZmZpY2UnXSxcbiAgICBtZXRhZGF0YToge1xuICAgICAgc291cmNlTW9kZWxzOiBbJ2NsYXVkZS1zb25uZXQtMy43JywgJ2FtYXpvbi1ub3ZhLXBybycsICdjbGF1ZGUtaGFpa3UtMy41J10sXG4gICAgICBwcm9jZXNzaW5nVGltZTogODUwMCxcbiAgICAgIGRhdGFTb3VyY2VzVXNlZDogW1xuICAgICAgICAnSW50ZXJuYXRpb25hbCBFbmVyZ3kgQWdlbmN5JyxcbiAgICAgICAgJ0Jsb29tYmVyZyBOZXcgRW5lcmd5IEZpbmFuY2UnLFxuICAgICAgICAnQ29tcGFueSBGaW5hbmNpYWwgUmVwb3J0cycsXG4gICAgICAgICdUZWNobmljYWwgQW5hbHlzaXMgUGxhdGZvcm0nLFxuICAgICAgICAnRVNHIFJlc2VhcmNoIFByb3ZpZGVyJyxcbiAgICAgICAgJ01hcmtldCBOZXdzIEFnZ3JlZ2F0b3InXG4gICAgICBdLFxuICAgICAgcmVzZWFyY2hEZXB0aDogJ2NvbXByZWhlbnNpdmUnLFxuICAgICAgcXVhbGl0eVNjb3JlOiA4OCxcbiAgICAgIG5vdmVsdHlTY29yZTogNzUsXG4gICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgIHZvbGF0aWxpdHlJbmRleDogMjIsXG4gICAgICAgIG1hcmtldFRyZW5kOiAnYnVsbCcsXG4gICAgICAgIGVjb25vbWljSW5kaWNhdG9yczoge1xuICAgICAgICAgIGdkcDogMC4wMjgsXG4gICAgICAgICAgaW5mbGF0aW9uOiAwLjAzMixcbiAgICAgICAgICBpbnRlcmVzdFJhdGVzOiAwLjA0NVxuICAgICAgICB9LFxuICAgICAgICBnZW9wb2xpdGljYWxSaXNrOiAnbWVkaXVtJ1xuICAgICAgfVxuICAgIH0sXG4gICAgdHJhY2tpbmdJbmZvOiB7XG4gICAgICB2aWV3czogMCxcbiAgICAgIGltcGxlbWVudGF0aW9uczogMCxcbiAgICAgIGZlZWRiYWNrOiBbXSxcbiAgICAgIHBlcmZvcm1hbmNlOiBbXSxcbiAgICAgIHN0YXR1czogJ2FjdGl2ZScsXG4gICAgICBzdGF0dXNIaXN0b3J5OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXM6ICdhY3RpdmUnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjQtMDEtMjBUMTQ6MzA6MDBaJyksXG4gICAgICAgICAgcmVhc29uOiAnSW5pdGlhbCBjcmVhdGlvbicsXG4gICAgICAgICAgY2hhbmdlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIH07XG5cbiAgLy8gQ3JlYXRlIHNhbXBsZSBhbmFseXNpcyByZXN1bHRzXG4gIGNvbnN0IHNhbXBsZUFuYWx5c2lzUmVzdWx0czogQW5hbHlzaXNSZXN1bHRbXSA9IFtcbiAgICB7XG4gICAgICBpZDogJ2FuYWx5c2lzLXJlbmV3YWJsZS1mdW5kYW1lbnRhbCcsXG4gICAgICBpbnZlc3RtZW50SWQ6ICdpbnYtc29sYXItY29ycCcsXG4gICAgICBhbmFseXNpc1R5cGU6ICdmdW5kYW1lbnRhbCcsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTIwVDEyOjAwOjAwWicpLFxuICAgICAgYW5hbHlzdDogJ2FtYXpvbi1ub3ZhLXBybycsXG4gICAgICBzdW1tYXJ5OiAnU3Ryb25nIGZ1bmRhbWVudGFsIG91dGxvb2sgZHJpdmVuIGJ5IHBvbGljeSBzdXBwb3J0IGFuZCBjb3N0IGltcHJvdmVtZW50cycsXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICBzdHJlbmd0aHM6IFtcbiAgICAgICAgICAnU3Ryb25nIHJldmVudWUgZ3Jvd3RoIHRyYWplY3RvcnknLFxuICAgICAgICAgICdJbXByb3ZpbmcgcHJvZml0IG1hcmdpbnMnLFxuICAgICAgICAgICdSb2J1c3Qgb3JkZXIgYmFja2xvZycsXG4gICAgICAgICAgJ0Zhdm9yYWJsZSByZWd1bGF0b3J5IGVudmlyb25tZW50J1xuICAgICAgICBdLFxuICAgICAgICB3ZWFrbmVzc2VzOiBbXG4gICAgICAgICAgJ0hpZ2ggY2FwaXRhbCBpbnRlbnNpdHknLFxuICAgICAgICAgICdDeWNsaWNhbCBkZW1hbmQgcGF0dGVybnMnLFxuICAgICAgICAgICdTdXBwbHkgY2hhaW4gZGVwZW5kZW5jaWVzJ1xuICAgICAgICBdLFxuICAgICAgICBvcHBvcnR1bml0aWVzOiBbXG4gICAgICAgICAgJ0dyaWQgbW9kZXJuaXphdGlvbiBpbnZlc3RtZW50cycsXG4gICAgICAgICAgJ0NvcnBvcmF0ZSBzdXN0YWluYWJpbGl0eSBtYW5kYXRlcycsXG4gICAgICAgICAgJ0VtZXJnaW5nIG1hcmtldCBleHBhbnNpb24nXG4gICAgICAgIF0sXG4gICAgICAgIHRocmVhdHM6IFtcbiAgICAgICAgICAnUG9saWN5IHVuY2VydGFpbnR5JyxcbiAgICAgICAgICAnVGVjaG5vbG9neSBkaXNydXB0aW9uJyxcbiAgICAgICAgICAnQ29tbW9kaXR5IHByaWNlIHZvbGF0aWxpdHknXG4gICAgICAgIF0sXG4gICAgICAgIGtleU1ldHJpY3M6IHtcbiAgICAgICAgICByZXZlbnVlR3Jvd3RoUmF0ZTogMC4yOCxcbiAgICAgICAgICBlYml0ZGFNYXJnaW46IDAuMTgsXG4gICAgICAgICAgcm9pYzogMC4xMixcbiAgICAgICAgICBkZWJ0VG9FcXVpdHk6IDAuNDUsXG4gICAgICAgICAgY3VycmVudFJhdGlvOiAxLjhcbiAgICAgICAgfSxcbiAgICAgICAgbmFycmF0aXZlczogW1xuICAgICAgICAgICdUaGUgcmVuZXdhYmxlIGVuZXJneSB0cmFuc2l0aW9uIGlzIGFjY2VsZXJhdGluZyBnbG9iYWxseScsXG4gICAgICAgICAgJ1RlY2hub2xvZ3kgY29zdHMgY29udGludWUgdG8gZGVjbGluZSwgaW1wcm92aW5nIGNvbXBldGl0aXZlbmVzcycsXG4gICAgICAgICAgJ1BvbGljeSBzdXBwb3J0IHJlbWFpbnMgc3Ryb25nIGFjcm9zcyBtYWpvciBtYXJrZXRzJ1xuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgcmVjb21tZW5kYXRpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhY3Rpb246ICdidXknLFxuICAgICAgICAgIHRpbWVIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgdGFyZ2V0UHJpY2U6IDExMCxcbiAgICAgICAgICBjb25maWRlbmNlOiAwLjgyLFxuICAgICAgICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBmdW5kYW1lbnRhbHMgYW5kIGZhdm9yYWJsZSBpbmR1c3RyeSBkeW5hbWljcyBzdXBwb3J0IGhpZ2hlciB2YWx1YXRpb24nXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBkYXRhUG9pbnRzOiBbXVxuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICdhbmFseXNpcy1yZW5ld2FibGUtdGVjaG5pY2FsJyxcbiAgICAgIGludmVzdG1lbnRJZDogJ2ludi13aW5kLXBvd2VyJyxcbiAgICAgIGFuYWx5c2lzVHlwZTogJ3RlY2huaWNhbCcsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCcyMDI0LTAxLTIwVDExOjMwOjAwWicpLFxuICAgICAgYW5hbHlzdDogJ2NsYXVkZS1oYWlrdS0zLjUnLFxuICAgICAgc3VtbWFyeTogJ1RlY2huaWNhbCBpbmRpY2F0b3JzIHNob3cgYnVsbGlzaCBtb21lbnR1bSB3aXRoIHN0cm9uZyBzdXBwb3J0IGxldmVscycsXG4gICAgICBjb25maWRlbmNlOiAwLjcyLFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICBzdHJlbmd0aHM6IFtcbiAgICAgICAgICAnVXB3YXJkIHRyZW5kaW5nIHByaWNlIGFjdGlvbicsXG4gICAgICAgICAgJ1N0cm9uZyB2b2x1bWUgY29uZmlybWF0aW9uJyxcbiAgICAgICAgICAnQnVsbGlzaCBtb21lbnR1bSBpbmRpY2F0b3JzJ1xuICAgICAgICBdLFxuICAgICAgICB3ZWFrbmVzc2VzOiBbXG4gICAgICAgICAgJ0hpZ2ggdm9sYXRpbGl0eScsXG4gICAgICAgICAgJ1Jlc2lzdGFuY2UgYXQga2V5IGxldmVscydcbiAgICAgICAgXSxcbiAgICAgICAgb3Bwb3J0dW5pdGllczogW1xuICAgICAgICAgICdCcmVha291dCBhYm92ZSByZXNpc3RhbmNlJyxcbiAgICAgICAgICAnU2VjdG9yIHJvdGF0aW9uIGludG8gY2xlYW4gZW5lcmd5J1xuICAgICAgICBdLFxuICAgICAgICB0aHJlYXRzOiBbXG4gICAgICAgICAgJ01hcmtldCBjb3JyZWN0aW9uIHJpc2snLFxuICAgICAgICAgICdTZWN0b3Itd2lkZSBzZWxsaW5nIHByZXNzdXJlJ1xuICAgICAgICBdLFxuICAgICAgICBrZXlNZXRyaWNzOiB7XG4gICAgICAgICAgcnNpOiA2OCxcbiAgICAgICAgICBtYWNkOiAnYnVsbGlzaCBjcm9zc292ZXInLFxuICAgICAgICAgIG1vdmluZ0F2ZXJhZ2VzOiAnYWJvdmUgNTAgYW5kIDIwMCBkYXknLFxuICAgICAgICAgIHZvbHVtZVByb2ZpbGU6ICdhY2N1bXVsYXRpb24nXG4gICAgICAgIH0sXG4gICAgICAgIG5hcnJhdGl2ZXM6IFtcbiAgICAgICAgICAnVGVjaG5pY2FsIHNldHVwIHN1Z2dlc3RzIGNvbnRpbnVlZCB1cHdhcmQgbW9tZW50dW0nLFxuICAgICAgICAgICdTZWN0b3IgbGVhZGVyc2hpcCBpbiBjbGVhbiBlbmVyZ3kgdGhlbWUnXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICByZWNvbW1lbmRhdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGFjdGlvbjogJ2J1eScsXG4gICAgICAgICAgdGltZUhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHRhcmdldFByaWNlOiA1NSxcbiAgICAgICAgICBjb25maWRlbmNlOiAwLjcwLFxuICAgICAgICAgIHJhdGlvbmFsZTogJ1RlY2huaWNhbCBicmVha291dCBwb3RlbnRpYWwgd2l0aCBzZWN0b3IgdGFpbHdpbmRzJ1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZGF0YVBvaW50czogW11cbiAgICB9XG4gIF07XG5cbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZygn8J+TiiBHZW5lcmF0aW5nIGNvbXByZWhlbnNpdmUgZXhwbGFuYXRpb24gZm9yIHJlbmV3YWJsZSBlbmVyZ3kgaW52ZXN0bWVudCBpZGVhLi4uXFxuJyk7XG5cbiAgICAvLyBHZW5lcmF0ZSB0aGUgZXhwbGFuYXRpb25cbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IGF3YWl0IGV4cGxhbmF0aW9uU2VydmljZS5nZW5lcmF0ZUV4cGxhbmF0aW9uKFxuICAgICAgc2FtcGxlSW52ZXN0bWVudElkZWEsXG4gICAgICBzYW1wbGVBbmFseXNpc1Jlc3VsdHNcbiAgICApO1xuXG4gICAgY29uc29sZS5sb2coJ+KchSBFeHBsYW5hdGlvbiBnZW5lcmF0ZWQgc3VjY2Vzc2Z1bGx5IVxcbicpO1xuICAgIGNvbnNvbGUubG9nKGDwn5OLIEV4cGxhbmF0aW9uIElEOiAke2V4cGxhbmF0aW9uLmlkfWApO1xuICAgIGNvbnNvbGUubG9nKGDwn46vIEludmVzdG1lbnQgSWRlYTogJHtleHBsYW5hdGlvbi5pbnZlc3RtZW50SWRlYUlkfWApO1xuICAgIGNvbnNvbGUubG9nKGDij7AgR2VuZXJhdGVkIGF0OiAke2V4cGxhbmF0aW9uLnRpbWVzdGFtcC50b0lTT1N0cmluZygpfVxcbmApO1xuXG4gICAgLy8gRGlzcGxheSByZWFzb25pbmcgZXhwbGFuYXRpb25cbiAgICBjb25zb2xlLmxvZygn8J+noCBSRUFTT05JTkcgRVhQTEFOQVRJT04nKTtcbiAgICBjb25zb2xlLmxvZygnPScgLnJlcGVhdCg1MCkpO1xuICAgIGNvbnNvbGUubG9nKGBEZWNpc2lvbiBTdGVwczogJHtleHBsYW5hdGlvbi5yZWFzb25pbmcuZGVjaXNpb25QYXRoLmxlbmd0aH1gKTtcbiAgICBjb25zb2xlLmxvZyhgS2V5IEZhY3RvcnM6ICR7ZXhwbGFuYXRpb24ucmVhc29uaW5nLmtleUZhY3RvcnMubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKGBMb2dpY2FsIENvbm5lY3Rpb25zOiAke2V4cGxhbmF0aW9uLnJlYXNvbmluZy5sb2dpY2FsQ2hhaW4ubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKGBBc3N1bXB0aW9uczogJHtleHBsYW5hdGlvbi5yZWFzb25pbmcuYXNzdW1wdGlvbnMubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKGBBbHRlcm5hdGl2ZSBTY2VuYXJpb3M6ICR7ZXhwbGFuYXRpb24ucmVhc29uaW5nLmFsdGVybmF0aXZlU2NlbmFyaW9zLmxlbmd0aH1cXG5gKTtcblxuICAgIC8vIFNob3cgdG9wIGtleSBmYWN0b3JzXG4gICAgY29uc29sZS5sb2coJ/CflJEgVG9wIEtleSBGYWN0b3JzOicpO1xuICAgIGV4cGxhbmF0aW9uLnJlYXNvbmluZy5rZXlGYWN0b3JzLnNsaWNlKDAsIDMpLmZvckVhY2goKGZhY3RvciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICR7aW5kZXggKyAxfS4gJHtmYWN0b3IubmFtZX0gKFdlaWdodDogJHsoZmFjdG9yLndlaWdodCAqIDEwMCkudG9GaXhlZCgxKX0lLCBEaXJlY3Rpb246ICR7ZmFjdG9yLmRpcmVjdGlvbn0pYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICAke2ZhY3Rvci5kZXNjcmlwdGlvbn1gKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgLy8gRGlzcGxheSBkYXRhIGF0dHJpYnV0aW9uXG4gICAgY29uc29sZS5sb2coJ/Cfk5ogREFUQSBBVFRSSUJVVElPTicpO1xuICAgIGNvbnNvbGUubG9nKCc9JyAucmVwZWF0KDUwKSk7XG4gICAgY29uc29sZS5sb2coYFRvdGFsIFNvdXJjZXM6ICR7ZXhwbGFuYXRpb24uZGF0YUF0dHJpYnV0aW9uLnNvdXJjZXMubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKGBPdmVyYWxsIFJlbGlhYmlsaXR5OiAkeyhleHBsYW5hdGlvbi5kYXRhQXR0cmlidXRpb24ucmVsaWFiaWxpdHkub3ZlcmFsbFNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgRGF0YSBRdWFsaXR5IFNjb3JlOiAkeyhleHBsYW5hdGlvbi5kYXRhQXR0cmlidXRpb24ucmVsaWFiaWxpdHkuZGF0YVF1YWxpdHkuYWNjdXJhY3kgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGBBdmVyYWdlIERhdGEgQWdlOiAke2V4cGxhbmF0aW9uLmRhdGFBdHRyaWJ1dGlvbi5mcmVzaG5lc3MuYXZlcmFnZUFnZS50b0ZpeGVkKDEpfSBob3Vyc1xcbmApO1xuXG4gICAgLy8gU2hvdyBkYXRhIHNvdXJjZXNcbiAgICBjb25zb2xlLmxvZygn8J+TiiBEYXRhIFNvdXJjZXM6Jyk7XG4gICAgZXhwbGFuYXRpb24uZGF0YUF0dHJpYnV0aW9uLnNvdXJjZXMuZm9yRWFjaCgoc291cmNlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgJHtpbmRleCArIDF9LiAke3NvdXJjZS5zb3VyY2VOYW1lfSAoJHtzb3VyY2Uuc291cmNlVHlwZX0pYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBDb250cmlidXRpb246ICR7KHNvdXJjZS5jb250cmlidXRpb24gKiAxMDApLnRvRml4ZWQoMSl9JSwgUmVsaWFiaWxpdHk6ICR7KHNvdXJjZS5yZWxpYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBEYXRhIFBvaW50czogJHtzb3VyY2UuZGF0YVBvaW50cy5sZW5ndGh9LCBBY2Nlc3M6ICR7c291cmNlLmFjY2Vzc0xldmVsfWApO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCk7XG5cbiAgICAvLyBEaXNwbGF5IGNvbmZpZGVuY2UgYW5hbHlzaXNcbiAgICBjb25zb2xlLmxvZygn8J+OryBDT05GSURFTkNFIEFOQUxZU0lTJyk7XG4gICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNTApKTtcbiAgICBjb25zb2xlLmxvZyhgT3ZlcmFsbCBDb25maWRlbmNlOiAkeyhleHBsYW5hdGlvbi5jb25maWRlbmNlQW5hbHlzaXMub3ZlcmFsbENvbmZpZGVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGBDb25maWRlbmNlIEludGVydmFsOiAkeyhleHBsYW5hdGlvbi5jb25maWRlbmNlQW5hbHlzaXMuY29uZmlkZW5jZUludGVydmFsLmxvd2VyICogMTAwKS50b0ZpeGVkKDEpfSUgLSAkeyhleHBsYW5hdGlvbi5jb25maWRlbmNlQW5hbHlzaXMuY29uZmlkZW5jZUludGVydmFsLnVwcGVyICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgUm9idXN0bmVzcyBTY29yZTogJHsoZXhwbGFuYXRpb24uY29uZmlkZW5jZUFuYWx5c2lzLnNlbnNpdGl2aXR5QW5hbHlzaXMucm9idXN0bmVzcyAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYCk7XG5cbiAgICAvLyBTaG93IGNvbmZpZGVuY2UgYnJlYWtkb3duXG4gICAgY29uc29sZS5sb2coJ/Cfk4ggQ29uZmlkZW5jZSBCcmVha2Rvd246Jyk7XG4gICAgY29uc3QgYnJlYWtkb3duID0gZXhwbGFuYXRpb24uY29uZmlkZW5jZUFuYWx5c2lzLmNvbmZpZGVuY2VCcmVha2Rvd247XG4gICAgY29uc29sZS5sb2coYCAgRGF0YSBRdWFsaXR5OiAkeyhicmVha2Rvd24uZGF0YVF1YWxpdHkgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgIE1vZGVsIFJlbGlhYmlsaXR5OiAkeyhicmVha2Rvd24ubW9kZWxSZWxpYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgTWFya2V0IENvbmRpdGlvbnM6ICR7KGJyZWFrZG93bi5tYXJrZXRDb25kaXRpb25zICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICBUaW1lIEhvcml6b246ICR7KGJyZWFrZG93bi50aW1lSG9yaXpvbiAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgQ29tcGxleGl0eTogJHsoYnJlYWtkb3duLmNvbXBsZXhpdHkgKiAxMDApLnRvRml4ZWQoMSl9JVxcbmApO1xuXG4gICAgLy8gU2hvdyB1bmNlcnRhaW50eSBmYWN0b3JzXG4gICAgY29uc29sZS5sb2coJ+KaoO+4jyAgVG9wIFVuY2VydGFpbnR5IEZhY3RvcnM6Jyk7XG4gICAgZXhwbGFuYXRpb24uY29uZmlkZW5jZUFuYWx5c2lzLnVuY2VydGFpbnR5RmFjdG9ycy5zbGljZSgwLCAzKS5mb3JFYWNoKChmYWN0b3IsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7ZmFjdG9yLmZhY3Rvcn0gKEltcGFjdDogJHsoZmFjdG9yLmltcGFjdCAqIDEwMCkudG9GaXhlZCgxKX0lKWApO1xuICAgICAgY29uc29sZS5sb2coYCAgICAgJHtmYWN0b3IuZGVzY3JpcHRpb259YCk7XG4gICAgICBpZiAoZmFjdG9yLm1pdGlnYXRpb24ubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgICBNaXRpZ2F0aW9uOiAke2ZhY3Rvci5taXRpZ2F0aW9uLmpvaW4oJywgJyl9YCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coKTtcblxuICAgIC8vIERpc3BsYXkgdmlzdWFsaXphdGlvbiBzdWdnZXN0aW9uc1xuICAgIGNvbnNvbGUubG9nKCfwn5OKIFZJU1VBTElaQVRJT04gU1VHR0VTVElPTlMnKTtcbiAgICBjb25zb2xlLmxvZygnPScgLnJlcGVhdCg1MCkpO1xuICAgIGV4cGxhbmF0aW9uLnZpc3VhbGl6YXRpb25zLmZvckVhY2goKHZpeiwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uICR7dml6LnRpdGxlfSAoJHt2aXoudHlwZX0pIC0gUHJpb3JpdHk6ICR7dml6LnByaW9yaXR5fWApO1xuICAgICAgY29uc29sZS5sb2coYCAgICR7dml6LmRlc2NyaXB0aW9ufWApO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCk7XG5cbiAgICAvLyBEaXNwbGF5IHN1bW1hcnlcbiAgICBjb25zb2xlLmxvZygn8J+TnSBFWFBMQU5BVElPTiBTVU1NQVJZJyk7XG4gICAgY29uc29sZS5sb2coJz0nIC5yZXBlYXQoNTApKTtcbiAgICBjb25zb2xlLmxvZyhleHBsYW5hdGlvbi5zdW1tYXJ5KTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgLy8gU2hvdyBkYXRhIGNvbmZsaWN0cyBpZiBhbnlcbiAgICBpZiAoZXhwbGFuYXRpb24uZGF0YUF0dHJpYnV0aW9uLmNvbmZsaWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygn4pqhIERBVEEgQ09ORkxJQ1RTIElERU5USUZJRUQnKTtcbiAgICAgIGNvbnNvbGUubG9nKCc9JyAucmVwZWF0KDUwKSk7XG4gICAgICBleHBsYW5hdGlvbi5kYXRhQXR0cmlidXRpb24uY29uZmxpY3RzLmZvckVhY2goKGNvbmZsaWN0LCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhgJHtpbmRleCArIDF9LiAke2NvbmZsaWN0LmRlc2NyaXB0aW9ufSAoU2V2ZXJpdHk6ICR7Y29uZmxpY3Quc2V2ZXJpdHl9KWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgICAgQ29uZmxpY3RpbmcgU291cmNlczogJHtjb25mbGljdC5jb25mbGljdGluZ1NvdXJjZXMuam9pbignLCAnKX1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIFJlc29sdXRpb246ICR7Y29uZmxpY3QucmVzb2x1dGlvbn1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIEltcGFjdDogJHtjb25mbGljdC5pbXBhY3R9YCk7XG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKCk7XG4gICAgfVxuXG4gICAgLy8gU2hvdyBzZW5zaXRpdml0eSBhbmFseXNpcyBzY2VuYXJpb3NcbiAgICBjb25zb2xlLmxvZygn8J+UhCBTRU5TSVRJVklUWSBBTkFMWVNJUyBTQ0VOQVJJT1MnKTtcbiAgICBjb25zb2xlLmxvZygnPScgLnJlcGVhdCg1MCkpO1xuICAgIGV4cGxhbmF0aW9uLmNvbmZpZGVuY2VBbmFseXNpcy5zZW5zaXRpdml0eUFuYWx5c2lzLnNjZW5hcmlvcy5mb3JFYWNoKChzY2VuYXJpbywgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uICR7c2NlbmFyaW8ubmFtZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBSZXN1bHRpbmcgQ29uZmlkZW5jZTogJHsoc2NlbmFyaW8ucmVzdWx0aW5nQ29uZmlkZW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgT3V0Y29tZSBDaGFuZ2U6ICR7KHNjZW5hcmlvLm91dGNvbWVDaGFuZ2UgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFZhcmlhYmxlIENoYW5nZXM6ICR7T2JqZWN0LmVudHJpZXMoc2NlbmFyaW8uY2hhbmdlcykubWFwKChba2V5LCB2YWx1ZV0pID0+IGAke2tleX06ICR7dmFsdWV9YCkuam9pbignLCAnKX1gKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgY29uc29sZS5sb2coJ/CfjokgRXhwbGFuYXRpb24gc2VydmljZSBkZW1vbnN0cmF0aW9uIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG4gICAgY29uc29sZS5sb2coJ1xcblRoaXMgY29tcHJlaGVuc2l2ZSBleHBsYW5hdGlvbiBwcm92aWRlczonKTtcbiAgICBjb25zb2xlLmxvZygn4oCiIFRyYW5zcGFyZW50IHJlYXNvbmluZyB3aXRoIGRlY2lzaW9uIHN0ZXBzIGFuZCBrZXkgZmFjdG9ycycpO1xuICAgIGNvbnNvbGUubG9nKCfigKIgQ29tcGxldGUgZGF0YSBzb3VyY2UgYXR0cmlidXRpb24gd2l0aCByZWxpYWJpbGl0eSBhc3Nlc3NtZW50Jyk7XG4gICAgY29uc29sZS5sb2coJ+KAoiBEZXRhaWxlZCBjb25maWRlbmNlIGFuYWx5c2lzIHdpdGggdW5jZXJ0YWludHkgcXVhbnRpZmljYXRpb24nKTtcbiAgICBjb25zb2xlLmxvZygn4oCiIFZpc3VhbGl6YXRpb24gc3VnZ2VzdGlvbnMgZm9yIGJldHRlciB1bmRlcnN0YW5kaW5nJyk7XG4gICAgY29uc29sZS5sb2coJ+KAoiBTZW5zaXRpdml0eSBhbmFseXNpcyBmb3Igcm9idXN0bmVzcyBldmFsdWF0aW9uJyk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgZHVyaW5nIGV4cGxhbmF0aW9uIGdlbmVyYXRpb246JywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbi8vIFJ1biB0aGUgZGVtb25zdHJhdGlvblxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGRlbW9uc3RyYXRlRXhwbGFuYXRpb25TZXJ2aWNlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu4pyFIEV4cGxhbmF0aW9uIHNlcnZpY2UgZXhhbXBsZSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICBwcm9jZXNzLmV4aXQoMCk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKCdcXG7inYwgRXhwbGFuYXRpb24gc2VydmljZSBleGFtcGxlIGZhaWxlZDonLCBlcnJvcik7XG4gICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IGRlbW9uc3RyYXRlRXhwbGFuYXRpb25TZXJ2aWNlIH07Il19