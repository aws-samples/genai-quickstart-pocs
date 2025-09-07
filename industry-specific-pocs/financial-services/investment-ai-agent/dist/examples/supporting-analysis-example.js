"use strict";
/**
 * Supporting Analysis Service Example
 * Demonstrates key metrics calculation, risk assessment, and expected outcome modeling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateSupportingAnalysis = void 0;
const supporting_analysis_service_1 = require("../services/supporting-analysis-service");
async function demonstrateSupportingAnalysis() {
    console.log('=== Supporting Analysis Service Example ===\n');
    const analysisService = new supporting_analysis_service_1.SupportingAnalysisService();
    // Create sample investment data
    const sampleInvestment = {
        id: 'AAPL',
        type: 'stock',
        name: 'Apple Inc.',
        ticker: 'AAPL',
        description: 'Technology company specializing in consumer electronics',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 3000000000000,
        currentPrice: 175.50,
        historicalPerformance: [
            {
                date: new Date('2024-01-01'),
                open: 170.00,
                high: 180.00,
                low: 165.00,
                close: 175.50,
                volume: 50000000,
                adjustedClose: 175.50
            },
            {
                date: new Date('2024-01-02'),
                open: 175.50,
                high: 182.00,
                low: 173.00,
                close: 180.25,
                volume: 45000000,
                adjustedClose: 180.25
            }
        ],
        fundamentals: {
            eps: 6.15,
            peRatio: 28.5,
            pbRatio: 45.2,
            dividendYield: 0.0044,
            revenueGrowth: 0.08,
            profitMargin: 0.26,
            debtToEquity: 1.73,
            freeCashFlow: 99584000000,
            returnOnEquity: 1.47,
            returnOnAssets: 0.22
        },
        technicalIndicators: {
            movingAverages: {
                ma50: 172.30,
                ma100: 168.45,
                ma200: 165.20
            },
            relativeStrengthIndex: 62.5,
            macdLine: 2.15,
            macdSignal: 1.85,
            macdHistogram: 0.30,
            bollingerBands: {
                upper: 185.00,
                middle: 175.50,
                lower: 166.00
            },
            averageVolume: 47500000
        },
        sentimentAnalysis: {
            overallSentiment: 'positive',
            sentimentScore: 0.35,
            sentimentTrend: 'stable',
            newsVolume: 125,
            socialMediaMentions: 15000,
            analystRecommendations: {
                buy: 15,
                hold: 8,
                sell: 2
            },
            insiderTrading: {
                buying: 500000,
                selling: 200000
            }
        },
        riskMetrics: {
            volatility: 0.28,
            beta: 1.25,
            sharpeRatio: 1.15,
            drawdown: 0.18,
            var: -0.045,
            correlations: {}
        },
        relatedInvestments: ['MSFT', 'GOOGL', 'AMZN']
    };
    // Create sample investment idea
    const sampleIdea = {
        id: 'tech-growth-idea-001',
        version: 1,
        title: 'Technology Growth Investment Strategy',
        description: 'Long-term growth investment in leading technology companies',
        investments: [sampleInvestment],
        rationale: 'Strong fundamentals, positive sentiment, and favorable technical indicators support long-term growth potential',
        strategy: 'buy',
        timeHorizon: 'long',
        confidenceScore: 0.82,
        generatedAt: new Date(),
        lastUpdatedAt: new Date(),
        potentialOutcomes: [
            {
                scenario: 'best',
                probability: 0.25,
                returnEstimate: 0.35,
                timeToRealization: 1095,
                description: 'Strong market conditions with excellent company execution',
                conditions: ['Continued innovation', 'Market expansion', 'Economic growth'],
                keyRisks: ['Market correction', 'Regulatory changes'],
                catalysts: ['New product launches', 'Market share gains', 'AI integration']
            },
            {
                scenario: 'expected',
                probability: 0.55,
                returnEstimate: 0.18,
                timeToRealization: 1095,
                description: 'Normal market conditions with steady company performance',
                conditions: ['Stable market environment', 'Consistent execution'],
                keyRisks: ['Competition', 'Economic slowdown', 'Supply chain issues'],
                catalysts: ['Steady revenue growth', 'Margin improvement']
            },
            {
                scenario: 'worst',
                probability: 0.20,
                returnEstimate: -0.12,
                timeToRealization: 1095,
                description: 'Adverse market conditions or execution challenges',
                conditions: ['Market downturn', 'Execution failures'],
                keyRisks: ['Recession', 'Technology disruption', 'Regulatory crackdown'],
                catalysts: []
            }
        ],
        supportingData: [
            {
                source: 'Bloomberg Terminal',
                type: 'fundamental',
                value: { eps: 6.15, revenue: 394328000000 },
                timestamp: new Date(),
                reliability: 0.95
            },
            {
                source: 'SEC 10-K Filing',
                type: 'fundamental',
                value: { freeCashFlow: 99584000000 },
                timestamp: new Date(),
                reliability: 0.98
            }
        ],
        counterArguments: [
            {
                description: 'High valuation multiples may limit upside potential',
                strength: 'moderate',
                impact: 'medium',
                mitigationStrategy: 'Focus on long-term growth trajectory rather than short-term valuation',
                probability: 0.4
            }
        ],
        complianceStatus: {
            compliant: true,
            issues: [],
            regulationsChecked: ['SEC', 'FINRA'],
            timestamp: new Date()
        },
        createdBy: 'analysis-agent-v1',
        tags: ['technology', 'growth', 'large-cap', 'blue-chip'],
        category: 'equity',
        riskLevel: 'moderate',
        targetAudience: ['institutional', 'high-net-worth'],
        metadata: {
            sourceModels: ['claude-sonnet-3.7', 'amazon-nova-pro'],
            processingTime: 2500,
            dataSourcesUsed: ['Bloomberg', 'SEC', 'Yahoo Finance'],
            researchDepth: 'comprehensive',
            qualityScore: 88,
            noveltyScore: 65,
            marketConditionsAtGeneration: {
                volatilityIndex: 18.5,
                marketTrend: 'bull',
                economicIndicators: {
                    'GDP_Growth': 2.8,
                    'Inflation_Rate': 3.2,
                    'Unemployment_Rate': 3.7
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
            statusHistory: [{
                    status: 'active',
                    timestamp: new Date(),
                    changedBy: 'analysis-agent-v1'
                }]
        }
    };
    try {
        // 1. Calculate Key Metrics
        console.log('1. Calculating Key Metrics...');
        const keyMetrics = await analysisService.calculateKeyMetrics(sampleIdea);
        console.log('Key Financial Metrics:');
        console.log(`  Expected Return: ${(keyMetrics.expectedReturn * 100).toFixed(2)}%`);
        console.log(`  Volatility: ${(keyMetrics.volatility * 100).toFixed(2)}%`);
        console.log(`  Sharpe Ratio: ${keyMetrics.sharpeRatio.toFixed(2)}`);
        console.log(`  Max Drawdown: ${(keyMetrics.maxDrawdown * 100).toFixed(2)}%`);
        console.log(`  Value at Risk (5%): ${(keyMetrics.valueAtRisk * 100).toFixed(2)}%`);
        console.log('\nPortfolio Metrics:');
        console.log(`  Diversification Ratio: ${keyMetrics.diversificationRatio.toFixed(2)}`);
        console.log(`  Correlation Score: ${keyMetrics.correlationScore.toFixed(2)}`);
        console.log(`  Concentration Risk: ${keyMetrics.concentrationRisk.toFixed(2)}`);
        console.log('\nQuality Scores:');
        console.log(`  Fundamental Score: ${keyMetrics.fundamentalScore.toFixed(1)}/100`);
        console.log(`  Technical Score: ${keyMetrics.technicalScore.toFixed(1)}/100`);
        console.log(`  Sentiment Score: ${keyMetrics.sentimentScore.toFixed(1)}/100`);
        console.log('\nRisk-Adjusted Metrics:');
        console.log(`  Information Ratio: ${keyMetrics.informationRatio.toFixed(2)}`);
        console.log(`  Calmar Ratio: ${keyMetrics.calmarRatio.toFixed(2)}`);
        console.log(`  Sortino Ratio: ${keyMetrics.sortinoRatio.toFixed(2)}`);
        console.log('\nTime-Based Metrics:');
        console.log(`  Time to Breakeven: ${keyMetrics.timeToBreakeven.toFixed(0)} days`);
        console.log(`  Optimal Holding Period: ${keyMetrics.optimalHoldingPeriod.toFixed(0)} days`);
        console.log('\nConfidence Metrics:');
        console.log(`  Data Quality: ${keyMetrics.dataQuality.toFixed(1)}/100`);
        console.log(`  Model Confidence: ${(keyMetrics.modelConfidence * 100).toFixed(1)}%`);
        console.log(`  Market Condition Suitability: ${keyMetrics.marketConditionSuitability.toFixed(1)}/100`);
        // 2. Assess Risk
        console.log('\n\n2. Performing Risk Assessment...');
        const riskAssessment = await analysisService.assessRisk(sampleIdea);
        console.log(`Overall Risk Level: ${riskAssessment.overallRiskLevel.toUpperCase()}`);
        console.log(`Risk Score: ${riskAssessment.riskScore.toFixed(1)}/100`);
        console.log('\nIdentified Risk Factors:');
        riskAssessment.riskFactors.forEach((factor, index) => {
            console.log(`  ${index + 1}. ${factor.description}`);
            console.log(`     Type: ${factor.type}, Severity: ${factor.severity}`);
            console.log(`     Probability: ${(factor.probability * 100).toFixed(1)}%, Impact: ${factor.impact.toFixed(1)}%`);
            console.log(`     Time Horizon: ${factor.timeHorizon}`);
        });
        console.log('\nRisk Mitigation Strategies:');
        riskAssessment.riskMitigation.forEach((mitigation, index) => {
            console.log(`  ${index + 1}. ${mitigation.strategy}`);
            console.log(`     Effectiveness: ${(mitigation.effectiveness * 100).toFixed(1)}%`);
            console.log(`     Cost: ${(mitigation.cost * 100).toFixed(2)}% of investment`);
            console.log(`     Implementation: ${mitigation.implementation}`);
        });
        console.log('\nStress Test Results:');
        riskAssessment.stressTestResults.forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.scenario}`);
            console.log(`     Probability: ${(result.probability * 100).toFixed(1)}%`);
            console.log(`     Expected Loss: ${(result.expectedLoss * 100).toFixed(1)}%`);
            console.log(`     Recovery Time: ${result.timeToRecovery} days`);
        });
        console.log('\nLiquidity Risk Assessment:');
        console.log(`  Level: ${riskAssessment.liquidityRisk.level.toUpperCase()}`);
        console.log(`  Average Daily Volume: ${riskAssessment.liquidityRisk.averageDailyVolume.toLocaleString()}`);
        console.log(`  Market Impact Cost: ${(riskAssessment.liquidityRisk.marketImpactCost * 100).toFixed(2)}%`);
        console.log(`  Time to Liquidate: ${riskAssessment.liquidityRisk.timeToLiquidate} days`);
        // 3. Model Expected Outcomes
        console.log('\n\n3. Modeling Expected Outcomes...');
        const outcomeModel = await analysisService.modelExpectedOutcomes(sampleIdea);
        console.log('Scenario Analysis:');
        console.log(`  Bull Case: ${(outcomeModel.bullCase.expectedReturn * 100).toFixed(1)}% (Probability: ${(outcomeModel.bullCase.probability * 100).toFixed(1)}%)`);
        console.log(`  Base Case: ${(outcomeModel.baseCase.expectedReturn * 100).toFixed(1)}% (Probability: ${(outcomeModel.baseCase.probability * 100).toFixed(1)}%)`);
        console.log(`  Bear Case: ${(outcomeModel.bearCase.expectedReturn * 100).toFixed(1)}% (Probability: ${(outcomeModel.bearCase.probability * 100).toFixed(1)}%)`);
        console.log(`  Probability-Weighted Return: ${(outcomeModel.probabilityWeightedReturn * 100).toFixed(2)}%`);
        console.log('\nConfidence Interval (95%):');
        console.log(`  Lower Bound: ${(outcomeModel.confidenceInterval.lowerBound * 100).toFixed(2)}%`);
        console.log(`  Upper Bound: ${(outcomeModel.confidenceInterval.upperBound * 100).toFixed(2)}%`);
        console.log(`  Standard Error: ${(outcomeModel.confidenceInterval.standardError * 100).toFixed(2)}%`);
        console.log('\nSensitivity Analysis - Key Variables:');
        outcomeModel.sensitivityAnalysis.variables.forEach((variable, index) => {
            console.log(`  ${index + 1}. ${variable.name}`);
            console.log(`     Base Value: ${variable.baseValue.toFixed(3)}`);
            console.log(`     Impact: ${variable.impact.toFixed(2)}`);
            console.log(`     Elasticity: ${variable.elasticity.toFixed(2)}`);
            console.log(`     Range: ${variable.range.min.toFixed(2)} to ${variable.range.max.toFixed(2)}`);
        });
        console.log('\nMonte Carlo Simulation Results:');
        console.log(`  Iterations: ${outcomeModel.monteCarloResults.iterations.toLocaleString()}`);
        console.log(`  Mean Return: ${(outcomeModel.monteCarloResults.meanReturn * 100).toFixed(2)}%`);
        console.log(`  Standard Deviation: ${(outcomeModel.monteCarloResults.standardDeviation * 100).toFixed(2)}%`);
        console.log(`  Probability of Loss: ${(outcomeModel.monteCarloResults.probabilityOfLoss * 100).toFixed(1)}%`);
        console.log(`  Probability of Target (10%): ${(outcomeModel.monteCarloResults.probabilityOfTarget * 100).toFixed(1)}%`);
        console.log(`  Expected Shortfall (5% VaR): ${(outcomeModel.monteCarloResults.expectedShortfall * 100).toFixed(2)}%`);
        console.log('\nKey Percentiles:');
        console.log(`  5th Percentile: ${(outcomeModel.monteCarloResults.percentiles['5'] * 100).toFixed(2)}%`);
        console.log(`  25th Percentile: ${(outcomeModel.monteCarloResults.percentiles['25'] * 100).toFixed(2)}%`);
        console.log(`  50th Percentile (Median): ${(outcomeModel.monteCarloResults.percentiles['50'] * 100).toFixed(2)}%`);
        console.log(`  75th Percentile: ${(outcomeModel.monteCarloResults.percentiles['75'] * 100).toFixed(2)}%`);
        console.log(`  95th Percentile: ${(outcomeModel.monteCarloResults.percentiles['95'] * 100).toFixed(2)}%`);
        console.log('\nTime Series Projection (First 10 Days):');
        outcomeModel.timeSeriesProjection.slice(0, 10).forEach((projection, index) => {
            console.log(`  Day ${index + 1}: Expected ${(projection.expectedValue * 100).toFixed(3)}%, ` +
                `Cumulative ${(projection.cumulativeReturn * 100).toFixed(3)}%`);
        });
        // 4. Summary and Recommendations
        console.log('\n\n4. Summary and Investment Recommendations:');
        const overallScore = (keyMetrics.fundamentalScore + keyMetrics.technicalScore + keyMetrics.sentimentScore) / 3;
        const riskAdjustedReturn = outcomeModel.probabilityWeightedReturn / (keyMetrics.volatility || 0.2);
        console.log(`Overall Quality Score: ${overallScore.toFixed(1)}/100`);
        console.log(`Risk-Adjusted Return Ratio: ${riskAdjustedReturn.toFixed(2)}`);
        if (overallScore >= 70 && riskAdjustedReturn >= 0.5 && riskAssessment.riskScore <= 60) {
            console.log('\n✅ RECOMMENDATION: STRONG BUY');
            console.log('   High quality metrics, favorable risk-return profile, and manageable risk level.');
        }
        else if (overallScore >= 60 && riskAdjustedReturn >= 0.3 && riskAssessment.riskScore <= 70) {
            console.log('\n✅ RECOMMENDATION: BUY');
            console.log('   Good fundamentals with acceptable risk level.');
        }
        else if (overallScore >= 50 && riskAdjustedReturn >= 0.2) {
            console.log('\n⚠️  RECOMMENDATION: HOLD/CAUTIOUS BUY');
            console.log('   Mixed signals - consider position sizing and risk management.');
        }
        else {
            console.log('\n❌ RECOMMENDATION: AVOID/SELL');
            console.log('   Poor risk-return profile or high risk level.');
        }
        console.log('\nKey Considerations:');
        console.log(`• Expected annual return: ${(outcomeModel.probabilityWeightedReturn * 100).toFixed(1)}%`);
        console.log(`• Volatility: ${(keyMetrics.volatility * 100).toFixed(1)}%`);
        console.log(`• Maximum potential loss (5% VaR): ${(Math.abs(keyMetrics.valueAtRisk) * 100).toFixed(1)}%`);
        console.log(`• Time to breakeven: ${Math.ceil(keyMetrics.timeToBreakeven)} days`);
        console.log(`• Recommended holding period: ${Math.ceil(keyMetrics.optimalHoldingPeriod / 365)} years`);
    }
    catch (error) {
        console.error('Error in supporting analysis demonstration:', error);
    }
}
exports.demonstrateSupportingAnalysis = demonstrateSupportingAnalysis;
// Run the example
if (require.main === module) {
    demonstrateSupportingAnalysis()
        .then(() => {
        console.log('\n=== Supporting Analysis Example Complete ===');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Example failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwcG9ydGluZy1hbmFseXNpcy1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL3N1cHBvcnRpbmctYW5hbHlzaXMtZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7QUFFSCx5RkFBb0Y7QUFLcEYsS0FBSyxVQUFVLDZCQUE2QjtJQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFFN0QsTUFBTSxlQUFlLEdBQUcsSUFBSSx1REFBeUIsRUFBRSxDQUFDO0lBRXhELGdDQUFnQztJQUNoQyxNQUFNLGdCQUFnQixHQUFlO1FBQ25DLEVBQUUsRUFBRSxNQUFNO1FBQ1YsSUFBSSxFQUFFLE9BQU87UUFDYixJQUFJLEVBQUUsWUFBWTtRQUNsQixNQUFNLEVBQUUsTUFBTTtRQUNkLFdBQVcsRUFBRSx5REFBeUQ7UUFDdEUsTUFBTSxFQUFFLFlBQVk7UUFDcEIsUUFBUSxFQUFFLHNCQUFzQjtRQUNoQyxTQUFTLEVBQUUsYUFBYTtRQUN4QixZQUFZLEVBQUUsTUFBTTtRQUNwQixxQkFBcUIsRUFBRTtZQUNyQjtnQkFDRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUM1QixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsTUFBTTtnQkFDWixHQUFHLEVBQUUsTUFBTTtnQkFDWCxLQUFLLEVBQUUsTUFBTTtnQkFDYixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsYUFBYSxFQUFFLE1BQU07YUFDdEI7WUFDRDtnQkFDRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUM1QixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsTUFBTTtnQkFDWixHQUFHLEVBQUUsTUFBTTtnQkFDWCxLQUFLLEVBQUUsTUFBTTtnQkFDYixNQUFNLEVBQUUsUUFBUTtnQkFDaEIsYUFBYSxFQUFFLE1BQU07YUFDdEI7U0FD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QUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQyxDQUFDLENBQUM7Q0FDTiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogU3VwcG9ydGluZyBBbmFseXNpcyBTZXJ2aWNlIEV4YW1wbGVcbiAqIERlbW9uc3RyYXRlcyBrZXkgbWV0cmljcyBjYWxjdWxhdGlvbiwgcmlzayBhc3Nlc3NtZW50LCBhbmQgZXhwZWN0ZWQgb3V0Y29tZSBtb2RlbGluZ1xuICovXG5cbmltcG9ydCB7IFN1cHBvcnRpbmdBbmFseXNpc1NlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9zdXBwb3J0aW5nLWFuYWx5c2lzLXNlcnZpY2UnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uL21vZGVscy9pbnZlc3RtZW50JztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhIH0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBEYXRhUG9pbnQgfSBmcm9tICcuLi9tb2RlbHMvYW5hbHlzaXMnO1xuXG5hc3luYyBmdW5jdGlvbiBkZW1vbnN0cmF0ZVN1cHBvcnRpbmdBbmFseXNpcygpIHtcbiAgY29uc29sZS5sb2coJz09PSBTdXBwb3J0aW5nIEFuYWx5c2lzIFNlcnZpY2UgRXhhbXBsZSA9PT1cXG4nKTtcblxuICBjb25zdCBhbmFseXNpc1NlcnZpY2UgPSBuZXcgU3VwcG9ydGluZ0FuYWx5c2lzU2VydmljZSgpO1xuXG4gIC8vIENyZWF0ZSBzYW1wbGUgaW52ZXN0bWVudCBkYXRhXG4gIGNvbnN0IHNhbXBsZUludmVzdG1lbnQ6IEludmVzdG1lbnQgPSB7XG4gICAgaWQ6ICdBQVBMJyxcbiAgICB0eXBlOiAnc3RvY2snLFxuICAgIG5hbWU6ICdBcHBsZSBJbmMuJyxcbiAgICB0aWNrZXI6ICdBQVBMJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueSBzcGVjaWFsaXppbmcgaW4gY29uc3VtZXIgZWxlY3Ryb25pY3MnLFxuICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgIGluZHVzdHJ5OiAnQ29uc3VtZXIgRWxlY3Ryb25pY3MnLFxuICAgIG1hcmtldENhcDogMzAwMDAwMDAwMDAwMCwgLy8gJDNUXG4gICAgY3VycmVudFByaWNlOiAxNzUuNTAsXG4gICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXG4gICAgICB7XG4gICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAxJyksXG4gICAgICAgIG9wZW46IDE3MC4wMCxcbiAgICAgICAgaGlnaDogMTgwLjAwLFxuICAgICAgICBsb3c6IDE2NS4wMCxcbiAgICAgICAgY2xvc2U6IDE3NS41MCxcbiAgICAgICAgdm9sdW1lOiA1MDAwMDAwMCxcbiAgICAgICAgYWRqdXN0ZWRDbG9zZTogMTc1LjUwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBkYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMicpLFxuICAgICAgICBvcGVuOiAxNzUuNTAsXG4gICAgICAgIGhpZ2g6IDE4Mi4wMCxcbiAgICAgICAgbG93OiAxNzMuMDAsXG4gICAgICAgIGNsb3NlOiAxODAuMjUsXG4gICAgICAgIHZvbHVtZTogNDUwMDAwMDAsXG4gICAgICAgIGFkanVzdGVkQ2xvc2U6IDE4MC4yNVxuICAgICAgfVxuICAgIF0sXG4gICAgZnVuZGFtZW50YWxzOiB7XG4gICAgICBlcHM6IDYuMTUsXG4gICAgICBwZVJhdGlvOiAyOC41LFxuICAgICAgcGJSYXRpbzogNDUuMixcbiAgICAgIGRpdmlkZW5kWWllbGQ6IDAuMDA0NCxcbiAgICAgIHJldmVudWVHcm93dGg6IDAuMDgsXG4gICAgICBwcm9maXRNYXJnaW46IDAuMjYsXG4gICAgICBkZWJ0VG9FcXVpdHk6IDEuNzMsXG4gICAgICBmcmVlQ2FzaEZsb3c6IDk5NTg0MDAwMDAwLFxuICAgICAgcmV0dXJuT25FcXVpdHk6IDEuNDcsXG4gICAgICByZXR1cm5PbkFzc2V0czogMC4yMlxuICAgIH0sXG4gICAgdGVjaG5pY2FsSW5kaWNhdG9yczoge1xuICAgICAgbW92aW5nQXZlcmFnZXM6IHtcbiAgICAgICAgbWE1MDogMTcyLjMwLFxuICAgICAgICBtYTEwMDogMTY4LjQ1LFxuICAgICAgICBtYTIwMDogMTY1LjIwXG4gICAgICB9LFxuICAgICAgcmVsYXRpdmVTdHJlbmd0aEluZGV4OiA2Mi41LFxuICAgICAgbWFjZExpbmU6IDIuMTUsXG4gICAgICBtYWNkU2lnbmFsOiAxLjg1LFxuICAgICAgbWFjZEhpc3RvZ3JhbTogMC4zMCxcbiAgICAgIGJvbGxpbmdlckJhbmRzOiB7XG4gICAgICAgIHVwcGVyOiAxODUuMDAsXG4gICAgICAgIG1pZGRsZTogMTc1LjUwLFxuICAgICAgICBsb3dlcjogMTY2LjAwXG4gICAgICB9LFxuICAgICAgYXZlcmFnZVZvbHVtZTogNDc1MDAwMDBcbiAgICB9LFxuICAgIHNlbnRpbWVudEFuYWx5c2lzOiB7XG4gICAgICBvdmVyYWxsU2VudGltZW50OiAncG9zaXRpdmUnLFxuICAgICAgc2VudGltZW50U2NvcmU6IDAuMzUsXG4gICAgICBzZW50aW1lbnRUcmVuZDogJ3N0YWJsZScsXG4gICAgICBuZXdzVm9sdW1lOiAxMjUsXG4gICAgICBzb2NpYWxNZWRpYU1lbnRpb25zOiAxNTAwMCxcbiAgICAgIGFuYWx5c3RSZWNvbW1lbmRhdGlvbnM6IHtcbiAgICAgICAgYnV5OiAxNSxcbiAgICAgICAgaG9sZDogOCxcbiAgICAgICAgc2VsbDogMlxuICAgICAgfSxcbiAgICAgIGluc2lkZXJUcmFkaW5nOiB7XG4gICAgICAgIGJ1eWluZzogNTAwMDAwLFxuICAgICAgICBzZWxsaW5nOiAyMDAwMDBcbiAgICAgIH1cbiAgICB9LFxuICAgIHJpc2tNZXRyaWNzOiB7XG4gICAgICB2b2xhdGlsaXR5OiAwLjI4LFxuICAgICAgYmV0YTogMS4yNSxcbiAgICAgIHNoYXJwZVJhdGlvOiAxLjE1LFxuICAgICAgZHJhd2Rvd246IDAuMTgsXG4gICAgICB2YXI6IC0wLjA0NSxcbiAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICB9LFxuICAgIHJlbGF0ZWRJbnZlc3RtZW50czogWydNU0ZUJywgJ0dPT0dMJywgJ0FNWk4nXVxuICB9O1xuXG4gIC8vIENyZWF0ZSBzYW1wbGUgaW52ZXN0bWVudCBpZGVhXG4gIGNvbnN0IHNhbXBsZUlkZWE6IEludmVzdG1lbnRJZGVhID0ge1xuICAgIGlkOiAndGVjaC1ncm93dGgtaWRlYS0wMDEnLFxuICAgIHZlcnNpb246IDEsXG4gICAgdGl0bGU6ICdUZWNobm9sb2d5IEdyb3d0aCBJbnZlc3RtZW50IFN0cmF0ZWd5JyxcbiAgICBkZXNjcmlwdGlvbjogJ0xvbmctdGVybSBncm93dGggaW52ZXN0bWVudCBpbiBsZWFkaW5nIHRlY2hub2xvZ3kgY29tcGFuaWVzJyxcbiAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRdLFxuICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBmdW5kYW1lbnRhbHMsIHBvc2l0aXZlIHNlbnRpbWVudCwgYW5kIGZhdm9yYWJsZSB0ZWNobmljYWwgaW5kaWNhdG9ycyBzdXBwb3J0IGxvbmctdGVybSBncm93dGggcG90ZW50aWFsJyxcbiAgICBzdHJhdGVneTogJ2J1eScsXG4gICAgdGltZUhvcml6b246ICdsb25nJyxcbiAgICBjb25maWRlbmNlU2NvcmU6IDAuODIsXG4gICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgbGFzdFVwZGF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ2Jlc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yNSxcbiAgICAgICAgcmV0dXJuRXN0aW1hdGU6IDAuMzUsXG4gICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAxMDk1LCAvLyAzIHllYXJzXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3Ryb25nIG1hcmtldCBjb25kaXRpb25zIHdpdGggZXhjZWxsZW50IGNvbXBhbnkgZXhlY3V0aW9uJyxcbiAgICAgICAgY29uZGl0aW9uczogWydDb250aW51ZWQgaW5ub3ZhdGlvbicsICdNYXJrZXQgZXhwYW5zaW9uJywgJ0Vjb25vbWljIGdyb3d0aCddLFxuICAgICAgICBrZXlSaXNrczogWydNYXJrZXQgY29ycmVjdGlvbicsICdSZWd1bGF0b3J5IGNoYW5nZXMnXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbJ05ldyBwcm9kdWN0IGxhdW5jaGVzJywgJ01hcmtldCBzaGFyZSBnYWlucycsICdBSSBpbnRlZ3JhdGlvbiddXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ2V4cGVjdGVkJyxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuNTUsXG4gICAgICAgIHJldHVybkVzdGltYXRlOiAwLjE4LFxuICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogMTA5NSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdOb3JtYWwgbWFya2V0IGNvbmRpdGlvbnMgd2l0aCBzdGVhZHkgY29tcGFueSBwZXJmb3JtYW5jZScsXG4gICAgICAgIGNvbmRpdGlvbnM6IFsnU3RhYmxlIG1hcmtldCBlbnZpcm9ubWVudCcsICdDb25zaXN0ZW50IGV4ZWN1dGlvbiddLFxuICAgICAgICBrZXlSaXNrczogWydDb21wZXRpdGlvbicsICdFY29ub21pYyBzbG93ZG93bicsICdTdXBwbHkgY2hhaW4gaXNzdWVzJ10sXG4gICAgICAgIGNhdGFseXN0czogWydTdGVhZHkgcmV2ZW51ZSBncm93dGgnLCAnTWFyZ2luIGltcHJvdmVtZW50J11cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yMCxcbiAgICAgICAgcmV0dXJuRXN0aW1hdGU6IC0wLjEyLFxuICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogMTA5NSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBZHZlcnNlIG1hcmtldCBjb25kaXRpb25zIG9yIGV4ZWN1dGlvbiBjaGFsbGVuZ2VzJyxcbiAgICAgICAgY29uZGl0aW9uczogWydNYXJrZXQgZG93bnR1cm4nLCAnRXhlY3V0aW9uIGZhaWx1cmVzJ10sXG4gICAgICAgIGtleVJpc2tzOiBbJ1JlY2Vzc2lvbicsICdUZWNobm9sb2d5IGRpc3J1cHRpb24nLCAnUmVndWxhdG9yeSBjcmFja2Rvd24nXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbXVxuICAgICAgfVxuICAgIF0sXG4gICAgc3VwcG9ydGluZ0RhdGE6IFtcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAnQmxvb21iZXJnIFRlcm1pbmFsJyxcbiAgICAgICAgdHlwZTogJ2Z1bmRhbWVudGFsJyxcbiAgICAgICAgdmFsdWU6IHsgZXBzOiA2LjE1LCByZXZlbnVlOiAzOTQzMjgwMDAwMDAgfSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICByZWxpYWJpbGl0eTogMC45NVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc291cmNlOiAnU0VDIDEwLUsgRmlsaW5nJyxcbiAgICAgICAgdHlwZTogJ2Z1bmRhbWVudGFsJyxcbiAgICAgICAgdmFsdWU6IHsgZnJlZUNhc2hGbG93OiA5OTU4NDAwMDAwMCB9LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHJlbGlhYmlsaXR5OiAwLjk4XG4gICAgICB9XG4gICAgXSxcbiAgICBjb3VudGVyQXJndW1lbnRzOiBbXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaCB2YWx1YXRpb24gbXVsdGlwbGVzIG1heSBsaW1pdCB1cHNpZGUgcG90ZW50aWFsJyxcbiAgICAgICAgc3RyZW5ndGg6ICdtb2RlcmF0ZScsXG4gICAgICAgIGltcGFjdDogJ21lZGl1bScsXG4gICAgICAgIG1pdGlnYXRpb25TdHJhdGVneTogJ0ZvY3VzIG9uIGxvbmctdGVybSBncm93dGggdHJhamVjdG9yeSByYXRoZXIgdGhhbiBzaG9ydC10ZXJtIHZhbHVhdGlvbicsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjRcbiAgICAgIH1cbiAgICBdLFxuICAgIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgIGlzc3VlczogW10sXG4gICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFsnU0VDJywgJ0ZJTlJBJ10sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICB9LFxuICAgIGNyZWF0ZWRCeTogJ2FuYWx5c2lzLWFnZW50LXYxJyxcbiAgICB0YWdzOiBbJ3RlY2hub2xvZ3knLCAnZ3Jvd3RoJywgJ2xhcmdlLWNhcCcsICdibHVlLWNoaXAnXSxcbiAgICBjYXRlZ29yeTogJ2VxdWl0eScsXG4gICAgcmlza0xldmVsOiAnbW9kZXJhdGUnLFxuICAgIHRhcmdldEF1ZGllbmNlOiBbJ2luc3RpdHV0aW9uYWwnLCAnaGlnaC1uZXQtd29ydGgnXSxcbiAgICBtZXRhZGF0YToge1xuICAgICAgc291cmNlTW9kZWxzOiBbJ2NsYXVkZS1zb25uZXQtMy43JywgJ2FtYXpvbi1ub3ZhLXBybyddLFxuICAgICAgcHJvY2Vzc2luZ1RpbWU6IDI1MDAsXG4gICAgICBkYXRhU291cmNlc1VzZWQ6IFsnQmxvb21iZXJnJywgJ1NFQycsICdZYWhvbyBGaW5hbmNlJ10sXG4gICAgICByZXNlYXJjaERlcHRoOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICBxdWFsaXR5U2NvcmU6IDg4LFxuICAgICAgbm92ZWx0eVNjb3JlOiA2NSxcbiAgICAgIG1hcmtldENvbmRpdGlvbnNBdEdlbmVyYXRpb246IHtcbiAgICAgICAgdm9sYXRpbGl0eUluZGV4OiAxOC41LFxuICAgICAgICBtYXJrZXRUcmVuZDogJ2J1bGwnLFxuICAgICAgICBlY29ub21pY0luZGljYXRvcnM6IHtcbiAgICAgICAgICAnR0RQX0dyb3d0aCc6IDIuOCxcbiAgICAgICAgICAnSW5mbGF0aW9uX1JhdGUnOiAzLjIsXG4gICAgICAgICAgJ1VuZW1wbG95bWVudF9SYXRlJzogMy43XG4gICAgICAgIH0sXG4gICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdtZWRpdW0nXG4gICAgICB9XG4gICAgfSxcbiAgICB0cmFja2luZ0luZm86IHtcbiAgICAgIHZpZXdzOiAwLFxuICAgICAgaW1wbGVtZW50YXRpb25zOiAwLFxuICAgICAgZmVlZGJhY2s6IFtdLFxuICAgICAgcGVyZm9ybWFuY2U6IFtdLFxuICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgIHN0YXR1c0hpc3Rvcnk6IFt7XG4gICAgICAgIHN0YXR1czogJ2FjdGl2ZScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgY2hhbmdlZEJ5OiAnYW5hbHlzaXMtYWdlbnQtdjEnXG4gICAgICB9XVxuICAgIH1cbiAgfTtcblxuICB0cnkge1xuICAgIC8vIDEuIENhbGN1bGF0ZSBLZXkgTWV0cmljc1xuICAgIGNvbnNvbGUubG9nKCcxLiBDYWxjdWxhdGluZyBLZXkgTWV0cmljcy4uLicpO1xuICAgIGNvbnN0IGtleU1ldHJpY3MgPSBhd2FpdCBhbmFseXNpc1NlcnZpY2UuY2FsY3VsYXRlS2V5TWV0cmljcyhzYW1wbGVJZGVhKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnS2V5IEZpbmFuY2lhbCBNZXRyaWNzOicpO1xuICAgIGNvbnNvbGUubG9nKGAgIEV4cGVjdGVkIFJldHVybjogJHsoa2V5TWV0cmljcy5leHBlY3RlZFJldHVybiAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgVm9sYXRpbGl0eTogJHsoa2V5TWV0cmljcy52b2xhdGlsaXR5ICogMTAwKS50b0ZpeGVkKDIpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICBTaGFycGUgUmF0aW86ICR7a2V5TWV0cmljcy5zaGFycGVSYXRpby50b0ZpeGVkKDIpfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIE1heCBEcmF3ZG93bjogJHsoa2V5TWV0cmljcy5tYXhEcmF3ZG93biAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgVmFsdWUgYXQgUmlzayAoNSUpOiAkeyhrZXlNZXRyaWNzLnZhbHVlQXRSaXNrICogMTAwKS50b0ZpeGVkKDIpfSVgKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnXFxuUG9ydGZvbGlvIE1ldHJpY3M6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgRGl2ZXJzaWZpY2F0aW9uIFJhdGlvOiAke2tleU1ldHJpY3MuZGl2ZXJzaWZpY2F0aW9uUmF0aW8udG9GaXhlZCgyKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICBDb3JyZWxhdGlvbiBTY29yZTogJHtrZXlNZXRyaWNzLmNvcnJlbGF0aW9uU2NvcmUudG9GaXhlZCgyKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICBDb25jZW50cmF0aW9uIFJpc2s6ICR7a2V5TWV0cmljcy5jb25jZW50cmF0aW9uUmlzay50b0ZpeGVkKDIpfWApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5RdWFsaXR5IFNjb3JlczonKTtcbiAgICBjb25zb2xlLmxvZyhgICBGdW5kYW1lbnRhbCBTY29yZTogJHtrZXlNZXRyaWNzLmZ1bmRhbWVudGFsU2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgY29uc29sZS5sb2coYCAgVGVjaG5pY2FsIFNjb3JlOiAke2tleU1ldHJpY3MudGVjaG5pY2FsU2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgY29uc29sZS5sb2coYCAgU2VudGltZW50IFNjb3JlOiAke2tleU1ldHJpY3Muc2VudGltZW50U2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcblJpc2stQWRqdXN0ZWQgTWV0cmljczonKTtcbiAgICBjb25zb2xlLmxvZyhgICBJbmZvcm1hdGlvbiBSYXRpbzogJHtrZXlNZXRyaWNzLmluZm9ybWF0aW9uUmF0aW8udG9GaXhlZCgyKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICBDYWxtYXIgUmF0aW86ICR7a2V5TWV0cmljcy5jYWxtYXJSYXRpby50b0ZpeGVkKDIpfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIFNvcnRpbm8gUmF0aW86ICR7a2V5TWV0cmljcy5zb3J0aW5vUmF0aW8udG9GaXhlZCgyKX1gKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnXFxuVGltZS1CYXNlZCBNZXRyaWNzOicpO1xuICAgIGNvbnNvbGUubG9nKGAgIFRpbWUgdG8gQnJlYWtldmVuOiAke2tleU1ldHJpY3MudGltZVRvQnJlYWtldmVuLnRvRml4ZWQoMCl9IGRheXNgKTtcbiAgICBjb25zb2xlLmxvZyhgICBPcHRpbWFsIEhvbGRpbmcgUGVyaW9kOiAke2tleU1ldHJpY3Mub3B0aW1hbEhvbGRpbmdQZXJpb2QudG9GaXhlZCgwKX0gZGF5c2ApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5Db25maWRlbmNlIE1ldHJpY3M6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgRGF0YSBRdWFsaXR5OiAke2tleU1ldHJpY3MuZGF0YVF1YWxpdHkudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgY29uc29sZS5sb2coYCAgTW9kZWwgQ29uZmlkZW5jZTogJHsoa2V5TWV0cmljcy5tb2RlbENvbmZpZGVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgIE1hcmtldCBDb25kaXRpb24gU3VpdGFiaWxpdHk6ICR7a2V5TWV0cmljcy5tYXJrZXRDb25kaXRpb25TdWl0YWJpbGl0eS50b0ZpeGVkKDEpfS8xMDBgKTtcblxuICAgIC8vIDIuIEFzc2VzcyBSaXNrXG4gICAgY29uc29sZS5sb2coJ1xcblxcbjIuIFBlcmZvcm1pbmcgUmlzayBBc3Nlc3NtZW50Li4uJyk7XG4gICAgY29uc3Qgcmlza0Fzc2Vzc21lbnQgPSBhd2FpdCBhbmFseXNpc1NlcnZpY2UuYXNzZXNzUmlzayhzYW1wbGVJZGVhKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgT3ZlcmFsbCBSaXNrIExldmVsOiAke3Jpc2tBc3Nlc3NtZW50Lm92ZXJhbGxSaXNrTGV2ZWwudG9VcHBlckNhc2UoKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgUmlzayBTY29yZTogJHtyaXNrQXNzZXNzbWVudC5yaXNrU2NvcmUudG9GaXhlZCgxKX0vMTAwYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcbklkZW50aWZpZWQgUmlzayBGYWN0b3JzOicpO1xuICAgIHJpc2tBc3Nlc3NtZW50LnJpc2tGYWN0b3JzLmZvckVhY2goKGZhY3RvciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICR7aW5kZXggKyAxfS4gJHtmYWN0b3IuZGVzY3JpcHRpb259YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBUeXBlOiAke2ZhY3Rvci50eXBlfSwgU2V2ZXJpdHk6ICR7ZmFjdG9yLnNldmVyaXR5fWApO1xuICAgICAgY29uc29sZS5sb2coYCAgICAgUHJvYmFiaWxpdHk6ICR7KGZhY3Rvci5wcm9iYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lLCBJbXBhY3Q6ICR7ZmFjdG9yLmltcGFjdC50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIFRpbWUgSG9yaXpvbjogJHtmYWN0b3IudGltZUhvcml6b259YCk7XG4gICAgfSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcblJpc2sgTWl0aWdhdGlvbiBTdHJhdGVnaWVzOicpO1xuICAgIHJpc2tBc3Nlc3NtZW50LnJpc2tNaXRpZ2F0aW9uLmZvckVhY2goKG1pdGlnYXRpb24sIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7bWl0aWdhdGlvbi5zdHJhdGVneX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIEVmZmVjdGl2ZW5lc3M6ICR7KG1pdGlnYXRpb24uZWZmZWN0aXZlbmVzcyAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBDb3N0OiAkeyhtaXRpZ2F0aW9uLmNvc3QgKiAxMDApLnRvRml4ZWQoMil9JSBvZiBpbnZlc3RtZW50YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBJbXBsZW1lbnRhdGlvbjogJHttaXRpZ2F0aW9uLmltcGxlbWVudGF0aW9ufWApO1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5TdHJlc3MgVGVzdCBSZXN1bHRzOicpO1xuICAgIHJpc2tBc3Nlc3NtZW50LnN0cmVzc1Rlc3RSZXN1bHRzLmZvckVhY2goKHJlc3VsdCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICR7aW5kZXggKyAxfS4gJHtyZXN1bHQuc2NlbmFyaW99YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBQcm9iYWJpbGl0eTogJHsocmVzdWx0LnByb2JhYmlsaXR5ICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIEV4cGVjdGVkIExvc3M6ICR7KHJlc3VsdC5leHBlY3RlZExvc3MgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgICAgUmVjb3ZlcnkgVGltZTogJHtyZXN1bHQudGltZVRvUmVjb3Zlcnl9IGRheXNgKTtcbiAgICB9KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnXFxuTGlxdWlkaXR5IFJpc2sgQXNzZXNzbWVudDonKTtcbiAgICBjb25zb2xlLmxvZyhgICBMZXZlbDogJHtyaXNrQXNzZXNzbWVudC5saXF1aWRpdHlSaXNrLmxldmVsLnRvVXBwZXJDYXNlKCl9YCk7XG4gICAgY29uc29sZS5sb2coYCAgQXZlcmFnZSBEYWlseSBWb2x1bWU6ICR7cmlza0Fzc2Vzc21lbnQubGlxdWlkaXR5Umlzay5hdmVyYWdlRGFpbHlWb2x1bWUudG9Mb2NhbGVTdHJpbmcoKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICBNYXJrZXQgSW1wYWN0IENvc3Q6ICR7KHJpc2tBc3Nlc3NtZW50LmxpcXVpZGl0eVJpc2subWFya2V0SW1wYWN0Q29zdCAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgVGltZSB0byBMaXF1aWRhdGU6ICR7cmlza0Fzc2Vzc21lbnQubGlxdWlkaXR5Umlzay50aW1lVG9MaXF1aWRhdGV9IGRheXNgKTtcblxuICAgIC8vIDMuIE1vZGVsIEV4cGVjdGVkIE91dGNvbWVzXG4gICAgY29uc29sZS5sb2coJ1xcblxcbjMuIE1vZGVsaW5nIEV4cGVjdGVkIE91dGNvbWVzLi4uJyk7XG4gICAgY29uc3Qgb3V0Y29tZU1vZGVsID0gYXdhaXQgYW5hbHlzaXNTZXJ2aWNlLm1vZGVsRXhwZWN0ZWRPdXRjb21lcyhzYW1wbGVJZGVhKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygnU2NlbmFyaW8gQW5hbHlzaXM6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgQnVsbCBDYXNlOiAkeyhvdXRjb21lTW9kZWwuYnVsbENhc2UuZXhwZWN0ZWRSZXR1cm4gKiAxMDApLnRvRml4ZWQoMSl9JSAoUHJvYmFiaWxpdHk6ICR7KG91dGNvbWVNb2RlbC5idWxsQ2FzZS5wcm9iYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lKWApO1xuICAgIGNvbnNvbGUubG9nKGAgIEJhc2UgQ2FzZTogJHsob3V0Y29tZU1vZGVsLmJhc2VDYXNlLmV4cGVjdGVkUmV0dXJuICogMTAwKS50b0ZpeGVkKDEpfSUgKFByb2JhYmlsaXR5OiAkeyhvdXRjb21lTW9kZWwuYmFzZUNhc2UucHJvYmFiaWxpdHkgKiAxMDApLnRvRml4ZWQoMSl9JSlgKTtcbiAgICBjb25zb2xlLmxvZyhgICBCZWFyIENhc2U6ICR7KG91dGNvbWVNb2RlbC5iZWFyQ2FzZS5leHBlY3RlZFJldHVybiAqIDEwMCkudG9GaXhlZCgxKX0lIChQcm9iYWJpbGl0eTogJHsob3V0Y29tZU1vZGVsLmJlYXJDYXNlLnByb2JhYmlsaXR5ICogMTAwKS50b0ZpeGVkKDEpfSUpYCk7XG4gICAgY29uc29sZS5sb2coYCAgUHJvYmFiaWxpdHktV2VpZ2h0ZWQgUmV0dXJuOiAkeyhvdXRjb21lTW9kZWwucHJvYmFiaWxpdHlXZWlnaHRlZFJldHVybiAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcbkNvbmZpZGVuY2UgSW50ZXJ2YWwgKDk1JSk6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgTG93ZXIgQm91bmQ6ICR7KG91dGNvbWVNb2RlbC5jb25maWRlbmNlSW50ZXJ2YWwubG93ZXJCb3VuZCAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgVXBwZXIgQm91bmQ6ICR7KG91dGNvbWVNb2RlbC5jb25maWRlbmNlSW50ZXJ2YWwudXBwZXJCb3VuZCAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgU3RhbmRhcmQgRXJyb3I6ICR7KG91dGNvbWVNb2RlbC5jb25maWRlbmNlSW50ZXJ2YWwuc3RhbmRhcmRFcnJvciAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcblNlbnNpdGl2aXR5IEFuYWx5c2lzIC0gS2V5IFZhcmlhYmxlczonKTtcbiAgICBvdXRjb21lTW9kZWwuc2Vuc2l0aXZpdHlBbmFseXNpcy52YXJpYWJsZXMuZm9yRWFjaCgodmFyaWFibGUsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7dmFyaWFibGUubmFtZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIEJhc2UgVmFsdWU6ICR7dmFyaWFibGUuYmFzZVZhbHVlLnRvRml4ZWQoMyl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBJbXBhY3Q6ICR7dmFyaWFibGUuaW1wYWN0LnRvRml4ZWQoMil9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgICBFbGFzdGljaXR5OiAke3ZhcmlhYmxlLmVsYXN0aWNpdHkudG9GaXhlZCgyKX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIFJhbmdlOiAke3ZhcmlhYmxlLnJhbmdlLm1pbi50b0ZpeGVkKDIpfSB0byAke3ZhcmlhYmxlLnJhbmdlLm1heC50b0ZpeGVkKDIpfWApO1xuICAgIH0pO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5Nb250ZSBDYXJsbyBTaW11bGF0aW9uIFJlc3VsdHM6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgSXRlcmF0aW9uczogJHtvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMuaXRlcmF0aW9ucy50b0xvY2FsZVN0cmluZygpfWApO1xuICAgIGNvbnNvbGUubG9nKGAgIE1lYW4gUmV0dXJuOiAkeyhvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMubWVhblJldHVybiAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgU3RhbmRhcmQgRGV2aWF0aW9uOiAkeyhvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMuc3RhbmRhcmREZXZpYXRpb24gKiAxMDApLnRvRml4ZWQoMil9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgIFByb2JhYmlsaXR5IG9mIExvc3M6ICR7KG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cy5wcm9iYWJpbGl0eU9mTG9zcyAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgUHJvYmFiaWxpdHkgb2YgVGFyZ2V0ICgxMCUpOiAkeyhvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMucHJvYmFiaWxpdHlPZlRhcmdldCAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgRXhwZWN0ZWQgU2hvcnRmYWxsICg1JSBWYVIpOiAkeyhvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMuZXhwZWN0ZWRTaG9ydGZhbGwgKiAxMDApLnRvRml4ZWQoMil9JWApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5LZXkgUGVyY2VudGlsZXM6Jyk7XG4gICAgY29uc29sZS5sb2coYCAgNXRoIFBlcmNlbnRpbGU6ICR7KG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cy5wZXJjZW50aWxlc1snNSddICogMTAwKS50b0ZpeGVkKDIpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICAyNXRoIFBlcmNlbnRpbGU6ICR7KG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cy5wZXJjZW50aWxlc1snMjUnXSAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgNTB0aCBQZXJjZW50aWxlIChNZWRpYW4pOiAkeyhvdXRjb21lTW9kZWwubW9udGVDYXJsb1Jlc3VsdHMucGVyY2VudGlsZXNbJzUwJ10gKiAxMDApLnRvRml4ZWQoMil9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgIDc1dGggUGVyY2VudGlsZTogJHsob3V0Y29tZU1vZGVsLm1vbnRlQ2FybG9SZXN1bHRzLnBlcmNlbnRpbGVzWyc3NSddICogMTAwKS50b0ZpeGVkKDIpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICA5NXRoIFBlcmNlbnRpbGU6ICR7KG91dGNvbWVNb2RlbC5tb250ZUNhcmxvUmVzdWx0cy5wZXJjZW50aWxlc1snOTUnXSAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcblRpbWUgU2VyaWVzIFByb2plY3Rpb24gKEZpcnN0IDEwIERheXMpOicpO1xuICAgIG91dGNvbWVNb2RlbC50aW1lU2VyaWVzUHJvamVjdGlvbi5zbGljZSgwLCAxMCkuZm9yRWFjaCgocHJvamVjdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgIERheSAke2luZGV4ICsgMX06IEV4cGVjdGVkICR7KHByb2plY3Rpb24uZXhwZWN0ZWRWYWx1ZSAqIDEwMCkudG9GaXhlZCgzKX0lLCBgICtcbiAgICAgICAgICAgICAgICAgYEN1bXVsYXRpdmUgJHsocHJvamVjdGlvbi5jdW11bGF0aXZlUmV0dXJuICogMTAwKS50b0ZpeGVkKDMpfSVgKTtcbiAgICB9KTtcblxuICAgIC8vIDQuIFN1bW1hcnkgYW5kIFJlY29tbWVuZGF0aW9uc1xuICAgIGNvbnNvbGUubG9nKCdcXG5cXG40LiBTdW1tYXJ5IGFuZCBJbnZlc3RtZW50IFJlY29tbWVuZGF0aW9uczonKTtcbiAgICBcbiAgICBjb25zdCBvdmVyYWxsU2NvcmUgPSAoa2V5TWV0cmljcy5mdW5kYW1lbnRhbFNjb3JlICsga2V5TWV0cmljcy50ZWNobmljYWxTY29yZSArIGtleU1ldHJpY3Muc2VudGltZW50U2NvcmUpIC8gMztcbiAgICBjb25zdCByaXNrQWRqdXN0ZWRSZXR1cm4gPSBvdXRjb21lTW9kZWwucHJvYmFiaWxpdHlXZWlnaHRlZFJldHVybiAvIChrZXlNZXRyaWNzLnZvbGF0aWxpdHkgfHwgMC4yKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgT3ZlcmFsbCBRdWFsaXR5IFNjb3JlOiAke292ZXJhbGxTY29yZS50b0ZpeGVkKDEpfS8xMDBgKTtcbiAgICBjb25zb2xlLmxvZyhgUmlzay1BZGp1c3RlZCBSZXR1cm4gUmF0aW86ICR7cmlza0FkanVzdGVkUmV0dXJuLnRvRml4ZWQoMil9YCk7XG4gICAgXG4gICAgaWYgKG92ZXJhbGxTY29yZSA+PSA3MCAmJiByaXNrQWRqdXN0ZWRSZXR1cm4gPj0gMC41ICYmIHJpc2tBc3Nlc3NtZW50LnJpc2tTY29yZSA8PSA2MCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcbuKchSBSRUNPTU1FTkRBVElPTjogU1RST05HIEJVWScpO1xuICAgICAgY29uc29sZS5sb2coJyAgIEhpZ2ggcXVhbGl0eSBtZXRyaWNzLCBmYXZvcmFibGUgcmlzay1yZXR1cm4gcHJvZmlsZSwgYW5kIG1hbmFnZWFibGUgcmlzayBsZXZlbC4nKTtcbiAgICB9IGVsc2UgaWYgKG92ZXJhbGxTY29yZSA+PSA2MCAmJiByaXNrQWRqdXN0ZWRSZXR1cm4gPj0gMC4zICYmIHJpc2tBc3Nlc3NtZW50LnJpc2tTY29yZSA8PSA3MCkge1xuICAgICAgY29uc29sZS5sb2coJ1xcbuKchSBSRUNPTU1FTkRBVElPTjogQlVZJyk7XG4gICAgICBjb25zb2xlLmxvZygnICAgR29vZCBmdW5kYW1lbnRhbHMgd2l0aCBhY2NlcHRhYmxlIHJpc2sgbGV2ZWwuJyk7XG4gICAgfSBlbHNlIGlmIChvdmVyYWxsU2NvcmUgPj0gNTAgJiYgcmlza0FkanVzdGVkUmV0dXJuID49IDAuMikge1xuICAgICAgY29uc29sZS5sb2coJ1xcbuKaoO+4jyAgUkVDT01NRU5EQVRJT046IEhPTEQvQ0FVVElPVVMgQlVZJyk7XG4gICAgICBjb25zb2xlLmxvZygnICAgTWl4ZWQgc2lnbmFscyAtIGNvbnNpZGVyIHBvc2l0aW9uIHNpemluZyBhbmQgcmlzayBtYW5hZ2VtZW50LicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu4p2MIFJFQ09NTUVOREFUSU9OOiBBVk9JRC9TRUxMJyk7XG4gICAgICBjb25zb2xlLmxvZygnICAgUG9vciByaXNrLXJldHVybiBwcm9maWxlIG9yIGhpZ2ggcmlzayBsZXZlbC4nKTtcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcbktleSBDb25zaWRlcmF0aW9uczonKTtcbiAgICBjb25zb2xlLmxvZyhg4oCiIEV4cGVjdGVkIGFubnVhbCByZXR1cm46ICR7KG91dGNvbWVNb2RlbC5wcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhg4oCiIFZvbGF0aWxpdHk6ICR7KGtleU1ldHJpY3Mudm9sYXRpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYOKAoiBNYXhpbXVtIHBvdGVudGlhbCBsb3NzICg1JSBWYVIpOiAkeyhNYXRoLmFicyhrZXlNZXRyaWNzLnZhbHVlQXRSaXNrKSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYOKAoiBUaW1lIHRvIGJyZWFrZXZlbjogJHtNYXRoLmNlaWwoa2V5TWV0cmljcy50aW1lVG9CcmVha2V2ZW4pfSBkYXlzYCk7XG4gICAgY29uc29sZS5sb2coYOKAoiBSZWNvbW1lbmRlZCBob2xkaW5nIHBlcmlvZDogJHtNYXRoLmNlaWwoa2V5TWV0cmljcy5vcHRpbWFsSG9sZGluZ1BlcmlvZCAvIDM2NSl9IHllYXJzYCk7XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBzdXBwb3J0aW5nIGFuYWx5c2lzIGRlbW9uc3RyYXRpb246JywgZXJyb3IpO1xuICB9XG59XG5cbi8vIFJ1biB0aGUgZXhhbXBsZVxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIGRlbW9uc3RyYXRlU3VwcG9ydGluZ0FuYWx5c2lzKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnXFxuPT09IFN1cHBvcnRpbmcgQW5hbHlzaXMgRXhhbXBsZSBDb21wbGV0ZSA9PT0nKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0V4YW1wbGUgZmFpbGVkOicsIGVycm9yKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHsgZGVtb25zdHJhdGVTdXBwb3J0aW5nQW5hbHlzaXMgfTsiXX0=