/**
 * Analysis Agent Example
 * 
 * This example demonstrates how to use the Analysis Agent for:
 * - Financial analysis algorithms
 * - Correlation and causation analysis  
 * - Scenario generation and evaluation
 */

import { AnalysisAgent } from '../services/ai/analysis-agent';
import { AmazonNovaProService } from '../services/ai/amazon-nova-pro-service';
import { BedrockClientService } from '../services/ai/bedrock-client';
import { MarketDataService } from '../services/market-data-service';
import { Investment } from '../models/investment';
import { BedrockModelId } from '../models/bedrock';

async function runAnalysisAgentExample() {
  console.log('🔍 Analysis Agent Example');
  console.log('========================\n');

  // Initialize services
  const bedrockClient = new BedrockClientService();
  const novaProService = new AmazonNovaProService(bedrockClient);
  // Mock market data service for example
  const marketDataService = {} as MarketDataService;
  const analysisAgent = new AnalysisAgent(novaProService, marketDataService);

  // Sample portfolio for analysis
  const samplePortfolio: Investment[] = [
    {
      id: 'aapl-001',
      type: 'stock',
      name: 'Apple Inc.',
      ticker: 'AAPL',
      description: 'Technology company specializing in consumer electronics',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      marketCap: 3000000000000,
      currentPrice: 150.00,
      historicalPerformance: [
        {
          date: new Date('2024-01-01'),
          open: 140,
          high: 145,
          low: 138,
          close: 142,
          volume: 1000000,
          adjustedClose: 142
        },
        {
          date: new Date('2024-01-02'),
          open: 142,
          high: 148,
          low: 141,
          close: 147,
          volume: 1200000,
          adjustedClose: 147
        },
        {
          date: new Date('2024-01-03'),
          open: 147,
          high: 152,
          low: 146,
          close: 150,
          volume: 1100000,
          adjustedClose: 150
        }
      ],
      fundamentals: {
        eps: 6.05,
        peRatio: 24.8,
        pbRatio: 5.2,
        dividendYield: 0.5,
        revenueGrowth: 0.08,
        profitMargin: 0.25,
        debtToEquity: 1.8,
        freeCashFlow: 100000000000,
        returnOnEquity: 0.15,
        returnOnAssets: 0.12
      },
      riskMetrics: {
        volatility: 0.25,
        beta: 1.2,
        sharpeRatio: 1.5,
        drawdown: 0.15,
        var: 0.05,
        correlations: {
          'SPY': 0.8,
          'QQQ': 0.9
        }
      },
      relatedInvestments: ['MSFT', 'GOOGL']
    },
    {
      id: 'msft-001',
      type: 'stock',
      name: 'Microsoft Corporation',
      ticker: 'MSFT',
      description: 'Technology company specializing in software and cloud services',
      sector: 'Technology',
      industry: 'Software',
      marketCap: 2800000000000,
      currentPrice: 380.00,
      historicalPerformance: [
        {
          date: new Date('2024-01-01'),
          open: 370,
          high: 375,
          low: 368,
          close: 372,
          volume: 800000,
          adjustedClose: 372
        },
        {
          date: new Date('2024-01-02'),
          open: 372,
          high: 378,
          low: 371,
          close: 376,
          volume: 900000,
          adjustedClose: 376
        },
        {
          date: new Date('2024-01-03'),
          open: 376,
          high: 382,
          low: 375,
          close: 380,
          volume: 850000,
          adjustedClose: 380
        }
      ],
      fundamentals: {
        eps: 11.05,
        peRatio: 34.4,
        pbRatio: 4.8,
        dividendYield: 0.7,
        revenueGrowth: 0.12,
        profitMargin: 0.30,
        debtToEquity: 0.5,
        freeCashFlow: 80000000000,
        returnOnEquity: 0.18,
        returnOnAssets: 0.14
      },
      riskMetrics: {
        volatility: 0.22,
        beta: 1.1,
        sharpeRatio: 1.8,
        drawdown: 0.12,
        var: 0.04,
        correlations: {
          'SPY': 0.75,
          'QQQ': 0.85
        }
      },
      relatedInvestments: ['AAPL', 'GOOGL']
    },
    {
      id: 'jpm-001',
      type: 'stock',
      name: 'JPMorgan Chase & Co.',
      ticker: 'JPM',
      description: 'Multinational investment bank and financial services company',
      sector: 'Financial Services',
      industry: 'Banks',
      marketCap: 450000000000,
      currentPrice: 155.00,
      historicalPerformance: [
        {
          date: new Date('2024-01-01'),
          open: 150,
          high: 153,
          low: 149,
          close: 152,
          volume: 600000,
          adjustedClose: 152
        },
        {
          date: new Date('2024-01-02'),
          open: 152,
          high: 156,
          low: 151,
          close: 154,
          volume: 700000,
          adjustedClose: 154
        },
        {
          date: new Date('2024-01-03'),
          open: 154,
          high: 158,
          low: 153,
          close: 155,
          volume: 650000,
          adjustedClose: 155
        }
      ],
      fundamentals: {
        eps: 15.36,
        peRatio: 10.1,
        pbRatio: 1.4,
        dividendYield: 2.8,
        revenueGrowth: 0.05,
        profitMargin: 0.32,
        debtToEquity: 1.2,
        freeCashFlow: 25000000000,
        returnOnEquity: 0.14,
        returnOnAssets: 0.012
      },
      riskMetrics: {
        volatility: 0.28,
        beta: 1.3,
        sharpeRatio: 1.2,
        drawdown: 0.20,
        var: 0.06,
        correlations: {
          'SPY': 0.85,
          'XLF': 0.95
        }
      },
      relatedInvestments: ['BAC', 'WFC']
    }
  ];

  try {
    // Example 1: Fundamental Analysis
    console.log('📊 Example 1: Fundamental Analysis');
    console.log('----------------------------------');
    
    const fundamentalRequest = {
      investments: [samplePortfolio[0]], // Analyze Apple
      analysisType: 'fundamental' as const,
      parameters: {
        timeHorizon: 'medium' as const,
        riskTolerance: 'moderate' as const
      }
    };

    const fundamentalResponse = await analysisAgent.processAnalysisRequest(fundamentalRequest);
    
    console.log(`Analysis Results: ${fundamentalResponse.results.length} investment(s) analyzed`);
    console.log(`Overall Confidence: ${(fundamentalResponse.confidence * 100).toFixed(1)}%`);
    console.log(`Risk Level: ${fundamentalResponse.riskAssessment.overallRisk}`);
    console.log(`Recommendations: ${fundamentalResponse.recommendations.length} generated`);
    
    fundamentalResponse.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.action.toUpperCase()} - ${rec.rationale}`);
    });
    console.log();

    // Example 2: Correlation Analysis
    console.log('🔗 Example 2: Correlation Analysis');
    console.log('----------------------------------');
    
    const correlationRequest = {
      investments: samplePortfolio,
      analysisType: 'correlation' as const,
      parameters: {
        correlationThreshold: 0.5,
        confidenceLevel: 0.95
      }
    };

    const correlationResponse = await analysisAgent.processAnalysisRequest(correlationRequest);
    
    console.log(`Correlation Matrix Generated: ${Object.keys(correlationResponse.correlationMatrix!.matrix).length}x${Object.keys(correlationResponse.correlationMatrix!.matrix).length}`);
    console.log(`Significant Correlations Found: ${correlationResponse.correlationMatrix!.significantCorrelations.length}`);
    console.log(`Diversification Score: ${(correlationResponse.riskAssessment.diversificationScore * 100).toFixed(1)}%`);
    
    console.log('\nTop Correlations:');
    correlationResponse.correlationMatrix!.significantCorrelations.slice(0, 3).forEach((corr, index) => {
      console.log(`  ${index + 1}. ${corr.asset1} ↔ ${corr.asset2}: ${corr.correlation.toFixed(3)} (${corr.interpretation})`);
    });
    console.log();

    // Example 3: Scenario Analysis
    console.log('🎯 Example 3: Scenario Analysis');
    console.log('-------------------------------');
    
    const customScenarios = [
      {
        name: 'Economic Boom',
        description: 'Strong economic growth with low inflation',
        marketConditions: {
          economicGrowth: 0.05,
          inflation: 0.02,
          interestRates: 0.04,
          volatility: 0.15
        },
        probability: 0.25
      },
      {
        name: 'Moderate Growth',
        description: 'Steady economic expansion',
        marketConditions: {
          economicGrowth: 0.03,
          inflation: 0.025,
          interestRates: 0.045,
          volatility: 0.20
        },
        probability: 0.45
      },
      {
        name: 'Economic Slowdown',
        description: 'Reduced growth with higher volatility',
        marketConditions: {
          economicGrowth: 0.01,
          inflation: 0.03,
          interestRates: 0.03,
          volatility: 0.30
        },
        probability: 0.20
      },
      {
        name: 'Recession',
        description: 'Economic contraction with high uncertainty',
        marketConditions: {
          economicGrowth: -0.02,
          inflation: 0.01,
          interestRates: 0.02,
          volatility: 0.40
        },
        probability: 0.10
      }
    ];

    const scenarioRequest = {
      investments: samplePortfolio,
      analysisType: 'scenario' as const,
      parameters: {
        scenarios: customScenarios,
        includeStressTesting: true
      }
    };

    const scenarioResponse = await analysisAgent.processAnalysisRequest(scenarioRequest);
    
    console.log(`Scenarios Analyzed: ${scenarioResponse.scenarioAnalysis!.scenarios.length}`);
    console.log(`Expected Portfolio Return: ${(scenarioResponse.scenarioAnalysis!.expectedValue * 100).toFixed(2)}%`);
    console.log(`Best Case Return: ${(scenarioResponse.scenarioAnalysis!.bestCase.portfolioReturn * 100).toFixed(2)}%`);
    console.log(`Worst Case Return: ${(scenarioResponse.scenarioAnalysis!.worstCase.portfolioReturn * 100).toFixed(2)}%`);
    
    console.log('\nScenario Breakdown:');
    scenarioResponse.scenarioAnalysis!.scenarios.forEach((scenario, index) => {
      console.log(`  ${index + 1}. ${scenario.scenario.name}: ${(scenario.portfolioReturn * 100).toFixed(2)}% (${(scenario.probability * 100).toFixed(0)}% probability)`);
    });
    console.log();

    // Example 4: Comprehensive Analysis
    console.log('🎯 Example 4: Comprehensive Analysis');
    console.log('------------------------------------');
    
    const comprehensiveRequest = {
      investments: samplePortfolio,
      analysisType: 'comprehensive' as const,
      parameters: {
        timeHorizon: 'long' as const,
        riskTolerance: 'moderate' as const,
        includeStressTesting: true,
        confidenceLevel: 0.95
      }
    };

    const comprehensiveResponse = await analysisAgent.processAnalysisRequest(comprehensiveRequest);
    
    console.log(`Total Analysis Results: ${comprehensiveResponse.results.length}`);
    console.log(`Overall Confidence: ${(comprehensiveResponse.confidence * 100).toFixed(1)}%`);
    console.log(`Execution Time: ${comprehensiveResponse.executionTime}ms`);
    console.log(`Risk Assessment: ${comprehensiveResponse.riskAssessment.overallRisk} (Score: ${comprehensiveResponse.riskAssessment.riskScore.toFixed(2)})`);
    
    if (comprehensiveResponse.correlationMatrix) {
      console.log(`Correlation Analysis: ${comprehensiveResponse.correlationMatrix.significantCorrelations.length} significant correlations`);
    }
    
    if (comprehensiveResponse.scenarioAnalysis) {
      console.log(`Scenario Analysis: Expected return ${(comprehensiveResponse.scenarioAnalysis.expectedValue * 100).toFixed(2)}%`);
    }
    
    console.log('\nTop Recommendations:');
    comprehensiveResponse.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.action.toUpperCase()} (${rec.timeHorizon}-term) - ${rec.rationale}`);
      console.log(`     Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
    });
    console.log();

    // Example 5: Agent Message Handling
    console.log('💬 Example 5: Agent Message Handling');
    console.log('------------------------------------');
    
    const agentMessage = {
      sender: 'supervisor' as const,
      recipient: 'analysis' as const,
      messageType: 'request' as const,
      content: {
        type: 'analysis',
        request: {
          investments: [samplePortfolio[0]],
          analysisType: 'fundamental' as const,
          parameters: {
            timeHorizon: 'short' as const
          }
        }
      },
      metadata: {
        priority: 'medium' as const,
        timestamp: new Date(),
        conversationId: 'conv-analysis-example',
        requestId: 'req-analysis-001'
      }
    };

    const messageResponse = await analysisAgent.handleMessage(agentMessage);
    
    console.log(`Message processed successfully`);
    console.log(`Response from: ${messageResponse.sender}`);
    console.log(`Response to: ${messageResponse.recipient}`);
    console.log(`Message type: ${messageResponse.messageType}`);
    console.log(`Analysis results: ${messageResponse.content.results?.length || 0} investment(s)`);
    console.log();

    console.log('✅ Analysis Agent examples completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('• Fundamental analysis with financial metrics evaluation');
    console.log('• Correlation analysis with diversification scoring');
    console.log('• Scenario analysis with custom market conditions');
    console.log('• Comprehensive analysis combining multiple approaches');
    console.log('• Agent message handling for inter-agent communication');
    console.log('• Risk assessment and recommendation generation');

  } catch (error) {
    console.error('❌ Error running Analysis Agent example:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runAnalysisAgentExample()
    .then(() => {
      console.log('\n🎉 Analysis Agent example completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Analysis Agent example failed:', error);
      process.exit(1);
    });
}

export { runAnalysisAgentExample };