/**
 * Example demonstrating the ExplanationService functionality
 * Shows how to generate comprehensive explanations for investment ideas
 */

import { ExplanationService } from '../services/explanation-service';
import { InvestmentIdea } from '../models/investment-idea';
import { DataPoint, AnalysisResult } from '../models/analysis';
import { Investment } from '../models/investment';

async function demonstrateExplanationService() {
  console.log('🔍 Investment AI Agent - Explanation Service Example\n');

  // Initialize the explanation service
  const explanationService = new ExplanationService();

  // Create a sample investment idea
  const sampleInvestmentIdea: InvestmentIdea = {
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
      } as Investment,
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
      } as Investment
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
        timeToRealization: 1095, // 3 years
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
        timeToRealization: 730, // 2 years
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
  const sampleAnalysisResults: AnalysisResult[] = [
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
    const explanation = await explanationService.generateExplanation(
      sampleInvestmentIdea,
      sampleAnalysisResults
    );

    console.log('✅ Explanation generated successfully!\n');
    console.log(`📋 Explanation ID: ${explanation.id}`);
    console.log(`🎯 Investment Idea: ${explanation.investmentIdeaId}`);
    console.log(`⏰ Generated at: ${explanation.timestamp.toISOString()}\n`);

    // Display reasoning explanation
    console.log('🧠 REASONING EXPLANATION');
    console.log('=' .repeat(50));
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
    console.log('=' .repeat(50));
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
    console.log('=' .repeat(50));
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
    console.log('=' .repeat(50));
    explanation.visualizations.forEach((viz, index) => {
      console.log(`${index + 1}. ${viz.title} (${viz.type}) - Priority: ${viz.priority}`);
      console.log(`   ${viz.description}`);
    });
    console.log();

    // Display summary
    console.log('📝 EXPLANATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(explanation.summary);
    console.log();

    // Show data conflicts if any
    if (explanation.dataAttribution.conflicts.length > 0) {
      console.log('⚡ DATA CONFLICTS IDENTIFIED');
      console.log('=' .repeat(50));
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
    console.log('=' .repeat(50));
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

  } catch (error) {
    console.error('❌ Error during explanation generation:', error);
    throw error;
  }
}

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

export { demonstrateExplanationService };