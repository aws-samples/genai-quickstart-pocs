/**
 * Supporting Analysis Service Example
 * Demonstrates key metrics calculation, risk assessment, and expected outcome modeling
 */

import { SupportingAnalysisService } from '../services/supporting-analysis-service';
import { Investment } from '../models/investment';
import { InvestmentIdea } from '../models/investment-idea';
import { DataPoint } from '../models/analysis';

async function demonstrateSupportingAnalysis() {
  console.log('=== Supporting Analysis Service Example ===\n');

  const analysisService = new SupportingAnalysisService();

  // Create sample investment data
  const sampleInvestment: Investment = {
    id: 'AAPL',
    type: 'stock',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    description: 'Technology company specializing in consumer electronics',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: 3000000000000, // $3T
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
  const sampleIdea: InvestmentIdea = {
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
        timeToRealization: 1095, // 3 years
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
    } else if (overallScore >= 60 && riskAdjustedReturn >= 0.3 && riskAssessment.riskScore <= 70) {
      console.log('\n✅ RECOMMENDATION: BUY');
      console.log('   Good fundamentals with acceptable risk level.');
    } else if (overallScore >= 50 && riskAdjustedReturn >= 0.2) {
      console.log('\n⚠️  RECOMMENDATION: HOLD/CAUTIOUS BUY');
      console.log('   Mixed signals - consider position sizing and risk management.');
    } else {
      console.log('\n❌ RECOMMENDATION: AVOID/SELL');
      console.log('   Poor risk-return profile or high risk level.');
    }
    
    console.log('\nKey Considerations:');
    console.log(`• Expected annual return: ${(outcomeModel.probabilityWeightedReturn * 100).toFixed(1)}%`);
    console.log(`• Volatility: ${(keyMetrics.volatility * 100).toFixed(1)}%`);
    console.log(`• Maximum potential loss (5% VaR): ${(Math.abs(keyMetrics.valueAtRisk) * 100).toFixed(1)}%`);
    console.log(`• Time to breakeven: ${Math.ceil(keyMetrics.timeToBreakeven)} days`);
    console.log(`• Recommended holding period: ${Math.ceil(keyMetrics.optimalHoldingPeriod / 365)} years`);

  } catch (error) {
    console.error('Error in supporting analysis demonstration:', error);
  }
}

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

export { demonstrateSupportingAnalysis };