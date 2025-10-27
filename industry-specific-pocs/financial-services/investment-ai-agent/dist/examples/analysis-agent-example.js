"use strict";
/**
 * Analysis Agent Example
 *
 * This example demonstrates how to use the Analysis Agent for:
 * - Financial analysis algorithms
 * - Correlation and causation analysis
 * - Scenario generation and evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAnalysisAgentExample = void 0;
const analysis_agent_1 = require("../services/ai/analysis-agent");
const amazon_nova_pro_service_1 = require("../services/ai/amazon-nova-pro-service");
const bedrock_client_1 = require("../services/ai/bedrock-client");
async function runAnalysisAgentExample() {
    console.log('🔍 Analysis Agent Example');
    console.log('========================\n');
    // Initialize services
    const bedrockClient = new bedrock_client_1.BedrockClientService();
    const novaProService = new amazon_nova_pro_service_1.AmazonNovaProService(bedrockClient);
    // Mock market data service for example
    const marketDataService = {};
    const analysisAgent = new analysis_agent_1.AnalysisAgent(novaProService, marketDataService);
    // Sample portfolio for analysis
    const samplePortfolio = [
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
            investments: [samplePortfolio[0]],
            analysisType: 'fundamental',
            parameters: {
                timeHorizon: 'medium',
                riskTolerance: 'moderate'
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
            analysisType: 'correlation',
            parameters: {
                correlationThreshold: 0.5,
                confidenceLevel: 0.95
            }
        };
        const correlationResponse = await analysisAgent.processAnalysisRequest(correlationRequest);
        console.log(`Correlation Matrix Generated: ${Object.keys(correlationResponse.correlationMatrix.matrix).length}x${Object.keys(correlationResponse.correlationMatrix.matrix).length}`);
        console.log(`Significant Correlations Found: ${correlationResponse.correlationMatrix.significantCorrelations.length}`);
        console.log(`Diversification Score: ${(correlationResponse.riskAssessment.diversificationScore * 100).toFixed(1)}%`);
        console.log('\nTop Correlations:');
        correlationResponse.correlationMatrix.significantCorrelations.slice(0, 3).forEach((corr, index) => {
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
            analysisType: 'scenario',
            parameters: {
                scenarios: customScenarios,
                includeStressTesting: true
            }
        };
        const scenarioResponse = await analysisAgent.processAnalysisRequest(scenarioRequest);
        console.log(`Scenarios Analyzed: ${scenarioResponse.scenarioAnalysis.scenarios.length}`);
        console.log(`Expected Portfolio Return: ${(scenarioResponse.scenarioAnalysis.expectedValue * 100).toFixed(2)}%`);
        console.log(`Best Case Return: ${(scenarioResponse.scenarioAnalysis.bestCase.portfolioReturn * 100).toFixed(2)}%`);
        console.log(`Worst Case Return: ${(scenarioResponse.scenarioAnalysis.worstCase.portfolioReturn * 100).toFixed(2)}%`);
        console.log('\nScenario Breakdown:');
        scenarioResponse.scenarioAnalysis.scenarios.forEach((scenario, index) => {
            console.log(`  ${index + 1}. ${scenario.scenario.name}: ${(scenario.portfolioReturn * 100).toFixed(2)}% (${(scenario.probability * 100).toFixed(0)}% probability)`);
        });
        console.log();
        // Example 4: Comprehensive Analysis
        console.log('🎯 Example 4: Comprehensive Analysis');
        console.log('------------------------------------');
        const comprehensiveRequest = {
            investments: samplePortfolio,
            analysisType: 'comprehensive',
            parameters: {
                timeHorizon: 'long',
                riskTolerance: 'moderate',
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
            sender: 'supervisor',
            recipient: 'analysis',
            messageType: 'request',
            content: {
                type: 'analysis',
                request: {
                    investments: [samplePortfolio[0]],
                    analysisType: 'fundamental',
                    parameters: {
                        timeHorizon: 'short'
                    }
                }
            },
            metadata: {
                priority: 'medium',
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
    }
    catch (error) {
        console.error('❌ Error running Analysis Agent example:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }
    }
}
exports.runAnalysisAgentExample = runAnalysisAgentExample;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHlzaXMtYWdlbnQtZXhhbXBsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGFtcGxlcy9hbmFseXNpcy1hZ2VudC1leGFtcGxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7QUFFSCxrRUFBOEQ7QUFDOUQsb0ZBQThFO0FBQzlFLGtFQUFxRTtBQUtyRSxLQUFLLFVBQVUsdUJBQXVCO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixDQUFDLENBQUM7SUFFMUMsc0JBQXNCO0lBQ3RCLE1BQU0sYUFBYSxHQUFHLElBQUkscUNBQW9CLEVBQUUsQ0FBQztJQUNqRCxNQUFNLGNBQWMsR0FBRyxJQUFJLDhDQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQy9ELHVDQUF1QztJQUN2QyxNQUFNLGlCQUFpQixHQUFHLEVBQXVCLENBQUM7SUFDbEQsTUFBTSxhQUFhLEdBQUcsSUFBSSw4QkFBYSxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBRTNFLGdDQUFnQztJQUNoQyxNQUFNLGVBQWUsR0FBaUI7UUFDcEM7WUFDRSxFQUFFLEVBQUUsVUFBVTtZQUNkLElBQUksRUFBRSxPQUFPO1lBQ2IsSUFBSSxFQUFFLFlBQVk7WUFDbEIsTUFBTSxFQUFFLE1BQU07WUFDZCxXQUFXLEVBQUUseURBQXlEO1lBQ3RFLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLFFBQVEsRUFBRSxzQkFBc0I7WUFDaEMsU0FBUyxFQUFFLGFBQWE7WUFDeEIsWUFBWSxFQUFFLE1BQU07WUFDcEIscUJBQXFCLEVBQUU7Z0JBQ3JCO29CQUNFLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7b0JBQzVCLElBQUksRUFBRSxHQUFHO29CQUNULElBQUksRUFBRSxHQUFHO29CQUNULEdBQUcsRUFBRSxHQUFHO29CQUNSLEtB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YW1wbGUgZGVtb25zdHJhdGVzIGhvdyB0byB1c2UgdGhlIEFuYWx5c2lzIEFnZW50IGZvcjpcbiAqIC0gRmluYW5jaWFsIGFuYWx5c2lzIGFsZ29yaXRobXNcbiAqIC0gQ29ycmVsYXRpb24gYW5kIGNhdXNhdGlvbiBhbmFseXNpcyAgXG4gKiAtIFNjZW5hcmlvIGdlbmVyYXRpb24gYW5kIGV2YWx1YXRpb25cbiAqL1xuXG5pbXBvcnQgeyBBbmFseXNpc0FnZW50IH0gZnJvbSAnLi4vc2VydmljZXMvYWkvYW5hbHlzaXMtYWdlbnQnO1xuaW1wb3J0IHsgQW1hem9uTm92YVByb1NlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9haS9hbWF6b24tbm92YS1wcm8tc2VydmljZSc7XG5pbXBvcnQgeyBCZWRyb2NrQ2xpZW50U2VydmljZSB9IGZyb20gJy4uL3NlcnZpY2VzL2FpL2JlZHJvY2stY2xpZW50JztcbmltcG9ydCB7IE1hcmtldERhdGFTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvbWFya2V0LWRhdGEtc2VydmljZSc7XG5pbXBvcnQgeyBJbnZlc3RtZW50IH0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuaW1wb3J0IHsgQmVkcm9ja01vZGVsSWQgfSBmcm9tICcuLi9tb2RlbHMvYmVkcm9jayc7XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bkFuYWx5c2lzQWdlbnRFeGFtcGxlKCkge1xuICBjb25zb2xlLmxvZygn8J+UjSBBbmFseXNpcyBBZ2VudCBFeGFtcGxlJyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PT09PT09PT1cXG4nKTtcblxuICAvLyBJbml0aWFsaXplIHNlcnZpY2VzXG4gIGNvbnN0IGJlZHJvY2tDbGllbnQgPSBuZXcgQmVkcm9ja0NsaWVudFNlcnZpY2UoKTtcbiAgY29uc3Qgbm92YVByb1NlcnZpY2UgPSBuZXcgQW1hem9uTm92YVByb1NlcnZpY2UoYmVkcm9ja0NsaWVudCk7XG4gIC8vIE1vY2sgbWFya2V0IGRhdGEgc2VydmljZSBmb3IgZXhhbXBsZVxuICBjb25zdCBtYXJrZXREYXRhU2VydmljZSA9IHt9IGFzIE1hcmtldERhdGFTZXJ2aWNlO1xuICBjb25zdCBhbmFseXNpc0FnZW50ID0gbmV3IEFuYWx5c2lzQWdlbnQobm92YVByb1NlcnZpY2UsIG1hcmtldERhdGFTZXJ2aWNlKTtcblxuICAvLyBTYW1wbGUgcG9ydGZvbGlvIGZvciBhbmFseXNpc1xuICBjb25zdCBzYW1wbGVQb3J0Zm9saW86IEludmVzdG1lbnRbXSA9IFtcbiAgICB7XG4gICAgICBpZDogJ2FhcGwtMDAxJyxcbiAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICBuYW1lOiAnQXBwbGUgSW5jLicsXG4gICAgICB0aWNrZXI6ICdBQVBMJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGVjaG5vbG9neSBjb21wYW55IHNwZWNpYWxpemluZyBpbiBjb25zdW1lciBlbGVjdHJvbmljcycsXG4gICAgICBzZWN0b3I6ICdUZWNobm9sb2d5JyxcbiAgICAgIGluZHVzdHJ5OiAnQ29uc3VtZXIgRWxlY3Ryb25pY3MnLFxuICAgICAgbWFya2V0Q2FwOiAzMDAwMDAwMDAwMDAwLFxuICAgICAgY3VycmVudFByaWNlOiAxNTAuMDAsXG4gICAgICBoaXN0b3JpY2FsUGVyZm9ybWFuY2U6IFtcbiAgICAgICAge1xuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAxJyksXG4gICAgICAgICAgb3BlbjogMTQwLFxuICAgICAgICAgIGhpZ2g6IDE0NSxcbiAgICAgICAgICBsb3c6IDEzOCxcbiAgICAgICAgICBjbG9zZTogMTQyLFxuICAgICAgICAgIHZvbHVtZTogMTAwMDAwMCxcbiAgICAgICAgICBhZGp1c3RlZENsb3NlOiAxNDJcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAyJyksXG4gICAgICAgICAgb3BlbjogMTQyLFxuICAgICAgICAgIGhpZ2g6IDE0OCxcbiAgICAgICAgICBsb3c6IDE0MSxcbiAgICAgICAgICBjbG9zZTogMTQ3LFxuICAgICAgICAgIHZvbHVtZTogMTIwMDAwMCxcbiAgICAgICAgICBhZGp1c3RlZENsb3NlOiAxNDdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAzJyksXG4gICAgICAgICAgb3BlbjogMTQ3LFxuICAgICAgICAgIGhpZ2g6IDE1MixcbiAgICAgICAgICBsb3c6IDE0NixcbiAgICAgICAgICBjbG9zZTogMTUwLFxuICAgICAgICAgIHZvbHVtZTogMTEwMDAwMCxcbiAgICAgICAgICBhZGp1c3RlZENsb3NlOiAxNTBcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIGZ1bmRhbWVudGFsczoge1xuICAgICAgICBlcHM6IDYuMDUsXG4gICAgICAgIHBlUmF0aW86IDI0LjgsXG4gICAgICAgIHBiUmF0aW86IDUuMixcbiAgICAgICAgZGl2aWRlbmRZaWVsZDogMC41LFxuICAgICAgICByZXZlbnVlR3Jvd3RoOiAwLjA4LFxuICAgICAgICBwcm9maXRNYXJnaW46IDAuMjUsXG4gICAgICAgIGRlYnRUb0VxdWl0eTogMS44LFxuICAgICAgICBmcmVlQ2FzaEZsb3c6IDEwMDAwMDAwMDAwMCxcbiAgICAgICAgcmV0dXJuT25FcXVpdHk6IDAuMTUsXG4gICAgICAgIHJldHVybk9uQXNzZXRzOiAwLjEyXG4gICAgICB9LFxuICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgdm9sYXRpbGl0eTogMC4yNSxcbiAgICAgICAgYmV0YTogMS4yLFxuICAgICAgICBzaGFycGVSYXRpbzogMS41LFxuICAgICAgICBkcmF3ZG93bjogMC4xNSxcbiAgICAgICAgdmFyOiAwLjA1LFxuICAgICAgICBjb3JyZWxhdGlvbnM6IHtcbiAgICAgICAgICAnU1BZJzogMC44LFxuICAgICAgICAgICdRUVEnOiAwLjlcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHJlbGF0ZWRJbnZlc3RtZW50czogWydNU0ZUJywgJ0dPT0dMJ11cbiAgICB9LFxuICAgIHtcbiAgICAgIGlkOiAnbXNmdC0wMDEnLFxuICAgICAgdHlwZTogJ3N0b2NrJyxcbiAgICAgIG5hbWU6ICdNaWNyb3NvZnQgQ29ycG9yYXRpb24nLFxuICAgICAgdGlja2VyOiAnTVNGVCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueSBzcGVjaWFsaXppbmcgaW4gc29mdHdhcmUgYW5kIGNsb3VkIHNlcnZpY2VzJyxcbiAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgaW5kdXN0cnk6ICdTb2Z0d2FyZScsXG4gICAgICBtYXJrZXRDYXA6IDI4MDAwMDAwMDAwMDAsXG4gICAgICBjdXJyZW50UHJpY2U6IDM4MC4wMCxcbiAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW1xuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDEnKSxcbiAgICAgICAgICBvcGVuOiAzNzAsXG4gICAgICAgICAgaGlnaDogMzc1LFxuICAgICAgICAgIGxvdzogMzY4LFxuICAgICAgICAgIGNsb3NlOiAzNzIsXG4gICAgICAgICAgdm9sdW1lOiA4MDAwMDAsXG4gICAgICAgICAgYWRqdXN0ZWRDbG9zZTogMzcyXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMicpLFxuICAgICAgICAgIG9wZW46IDM3MixcbiAgICAgICAgICBoaWdoOiAzNzgsXG4gICAgICAgICAgbG93OiAzNzEsXG4gICAgICAgICAgY2xvc2U6IDM3NixcbiAgICAgICAgICB2b2x1bWU6IDkwMDAwMCxcbiAgICAgICAgICBhZGp1c3RlZENsb3NlOiAzNzZcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAzJyksXG4gICAgICAgICAgb3BlbjogMzc2LFxuICAgICAgICAgIGhpZ2g6IDM4MixcbiAgICAgICAgICBsb3c6IDM3NSxcbiAgICAgICAgICBjbG9zZTogMzgwLFxuICAgICAgICAgIHZvbHVtZTogODUwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDM4MFxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZnVuZGFtZW50YWxzOiB7XG4gICAgICAgIGVwczogMTEuMDUsXG4gICAgICAgIHBlUmF0aW86IDM0LjQsXG4gICAgICAgIHBiUmF0aW86IDQuOCxcbiAgICAgICAgZGl2aWRlbmRZaWVsZDogMC43LFxuICAgICAgICByZXZlbnVlR3Jvd3RoOiAwLjEyLFxuICAgICAgICBwcm9maXRNYXJnaW46IDAuMzAsXG4gICAgICAgIGRlYnRUb0VxdWl0eTogMC41LFxuICAgICAgICBmcmVlQ2FzaEZsb3c6IDgwMDAwMDAwMDAwLFxuICAgICAgICByZXR1cm5PbkVxdWl0eTogMC4xOCxcbiAgICAgICAgcmV0dXJuT25Bc3NldHM6IDAuMTRcbiAgICAgIH0sXG4gICAgICByaXNrTWV0cmljczoge1xuICAgICAgICB2b2xhdGlsaXR5OiAwLjIyLFxuICAgICAgICBiZXRhOiAxLjEsXG4gICAgICAgIHNoYXJwZVJhdGlvOiAxLjgsXG4gICAgICAgIGRyYXdkb3duOiAwLjEyLFxuICAgICAgICB2YXI6IDAuMDQsXG4gICAgICAgIGNvcnJlbGF0aW9uczoge1xuICAgICAgICAgICdTUFknOiAwLjc1LFxuICAgICAgICAgICdRUVEnOiAwLjg1XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFsnQUFQTCcsICdHT09HTCddXG4gICAgfSxcbiAgICB7XG4gICAgICBpZDogJ2pwbS0wMDEnLFxuICAgICAgdHlwZTogJ3N0b2NrJyxcbiAgICAgIG5hbWU6ICdKUE1vcmdhbiBDaGFzZSAmIENvLicsXG4gICAgICB0aWNrZXI6ICdKUE0nLFxuICAgICAgZGVzY3JpcHRpb246ICdNdWx0aW5hdGlvbmFsIGludmVzdG1lbnQgYmFuayBhbmQgZmluYW5jaWFsIHNlcnZpY2VzIGNvbXBhbnknLFxuICAgICAgc2VjdG9yOiAnRmluYW5jaWFsIFNlcnZpY2VzJyxcbiAgICAgIGluZHVzdHJ5OiAnQmFua3MnLFxuICAgICAgbWFya2V0Q2FwOiA0NTAwMDAwMDAwMDAsXG4gICAgICBjdXJyZW50UHJpY2U6IDE1NS4wMCxcbiAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW1xuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDEnKSxcbiAgICAgICAgICBvcGVuOiAxNTAsXG4gICAgICAgICAgaGlnaDogMTUzLFxuICAgICAgICAgIGxvdzogMTQ5LFxuICAgICAgICAgIGNsb3NlOiAxNTIsXG4gICAgICAgICAgdm9sdW1lOiA2MDAwMDAsXG4gICAgICAgICAgYWRqdXN0ZWRDbG9zZTogMTUyXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMicpLFxuICAgICAgICAgIG9wZW46IDE1MixcbiAgICAgICAgICBoaWdoOiAxNTYsXG4gICAgICAgICAgbG93OiAxNTEsXG4gICAgICAgICAgY2xvc2U6IDE1NCxcbiAgICAgICAgICB2b2x1bWU6IDcwMDAwMCxcbiAgICAgICAgICBhZGp1c3RlZENsb3NlOiAxNTRcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAzJyksXG4gICAgICAgICAgb3BlbjogMTU0LFxuICAgICAgICAgIGhpZ2g6IDE1OCxcbiAgICAgICAgICBsb3c6IDE1MyxcbiAgICAgICAgICBjbG9zZTogMTU1LFxuICAgICAgICAgIHZvbHVtZTogNjUwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDE1NVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZnVuZGFtZW50YWxzOiB7XG4gICAgICAgIGVwczogMTUuMzYsXG4gICAgICAgIHBlUmF0aW86IDEwLjEsXG4gICAgICAgIHBiUmF0aW86IDEuNCxcbiAgICAgICAgZGl2aWRlbmRZaWVsZDogMi44LFxuICAgICAgICByZXZlbnVlR3Jvd3RoOiAwLjA1LFxuICAgICAgICBwcm9maXRNYXJnaW46IDAuMzIsXG4gICAgICAgIGRlYnRUb0VxdWl0eTogMS4yLFxuICAgICAgICBmcmVlQ2FzaEZsb3c6IDI1MDAwMDAwMDAwLFxuICAgICAgICByZXR1cm5PbkVxdWl0eTogMC4xNCxcbiAgICAgICAgcmV0dXJuT25Bc3NldHM6IDAuMDEyXG4gICAgICB9LFxuICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgdm9sYXRpbGl0eTogMC4yOCxcbiAgICAgICAgYmV0YTogMS4zLFxuICAgICAgICBzaGFycGVSYXRpbzogMS4yLFxuICAgICAgICBkcmF3ZG93bjogMC4yMCxcbiAgICAgICAgdmFyOiAwLjA2LFxuICAgICAgICBjb3JyZWxhdGlvbnM6IHtcbiAgICAgICAgICAnU1BZJzogMC44NSxcbiAgICAgICAgICAnWExGJzogMC45NVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbJ0JBQycsICdXRkMnXVxuICAgIH1cbiAgXTtcblxuICB0cnkge1xuICAgIC8vIEV4YW1wbGUgMTogRnVuZGFtZW50YWwgQW5hbHlzaXNcbiAgICBjb25zb2xlLmxvZygn8J+TiiBFeGFtcGxlIDE6IEZ1bmRhbWVudGFsIEFuYWx5c2lzJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBcbiAgICBjb25zdCBmdW5kYW1lbnRhbFJlcXVlc3QgPSB7XG4gICAgICBpbnZlc3RtZW50czogW3NhbXBsZVBvcnRmb2xpb1swXV0sIC8vIEFuYWx5emUgQXBwbGVcbiAgICAgIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyBhcyBjb25zdCxcbiAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgdGltZUhvcml6b246ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnIGFzIGNvbnN0XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGZ1bmRhbWVudGFsUmVzcG9uc2UgPSBhd2FpdCBhbmFseXNpc0FnZW50LnByb2Nlc3NBbmFseXNpc1JlcXVlc3QoZnVuZGFtZW50YWxSZXF1ZXN0KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgQW5hbHlzaXMgUmVzdWx0czogJHtmdW5kYW1lbnRhbFJlc3BvbnNlLnJlc3VsdHMubGVuZ3RofSBpbnZlc3RtZW50KHMpIGFuYWx5emVkYCk7XG4gICAgY29uc29sZS5sb2coYE92ZXJhbGwgQ29uZmlkZW5jZTogJHsoZnVuZGFtZW50YWxSZXNwb25zZS5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgUmlzayBMZXZlbDogJHtmdW5kYW1lbnRhbFJlc3BvbnNlLnJpc2tBc3Nlc3NtZW50Lm92ZXJhbGxSaXNrfWApO1xuICAgIGNvbnNvbGUubG9nKGBSZWNvbW1lbmRhdGlvbnM6ICR7ZnVuZGFtZW50YWxSZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMubGVuZ3RofSBnZW5lcmF0ZWRgKTtcbiAgICBcbiAgICBmdW5kYW1lbnRhbFJlc3BvbnNlLnJlY29tbWVuZGF0aW9ucy5mb3JFYWNoKChyZWMsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7cmVjLmFjdGlvbi50b1VwcGVyQ2FzZSgpfSAtICR7cmVjLnJhdGlvbmFsZX1gKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgLy8gRXhhbXBsZSAyOiBDb3JyZWxhdGlvbiBBbmFseXNpc1xuICAgIGNvbnNvbGUubG9nKCfwn5SXIEV4YW1wbGUgMjogQ29ycmVsYXRpb24gQW5hbHlzaXMnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIFxuICAgIGNvbnN0IGNvcnJlbGF0aW9uUmVxdWVzdCA9IHtcbiAgICAgIGludmVzdG1lbnRzOiBzYW1wbGVQb3J0Zm9saW8sXG4gICAgICBhbmFseXNpc1R5cGU6ICdjb3JyZWxhdGlvbicgYXMgY29uc3QsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIGNvcnJlbGF0aW9uVGhyZXNob2xkOiAwLjUsXG4gICAgICAgIGNvbmZpZGVuY2VMZXZlbDogMC45NVxuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBjb3JyZWxhdGlvblJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KGNvcnJlbGF0aW9uUmVxdWVzdCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYENvcnJlbGF0aW9uIE1hdHJpeCBHZW5lcmF0ZWQ6ICR7T2JqZWN0LmtleXMoY29ycmVsYXRpb25SZXNwb25zZS5jb3JyZWxhdGlvbk1hdHJpeCEubWF0cml4KS5sZW5ndGh9eCR7T2JqZWN0LmtleXMoY29ycmVsYXRpb25SZXNwb25zZS5jb3JyZWxhdGlvbk1hdHJpeCEubWF0cml4KS5sZW5ndGh9YCk7XG4gICAgY29uc29sZS5sb2coYFNpZ25pZmljYW50IENvcnJlbGF0aW9ucyBGb3VuZDogJHtjb3JyZWxhdGlvblJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4IS5zaWduaWZpY2FudENvcnJlbGF0aW9ucy5sZW5ndGh9YCk7XG4gICAgY29uc29sZS5sb2coYERpdmVyc2lmaWNhdGlvbiBTY29yZTogJHsoY29ycmVsYXRpb25SZXNwb25zZS5yaXNrQXNzZXNzbWVudC5kaXZlcnNpZmljYXRpb25TY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ1xcblRvcCBDb3JyZWxhdGlvbnM6Jyk7XG4gICAgY29ycmVsYXRpb25SZXNwb25zZS5jb3JyZWxhdGlvbk1hdHJpeCEuc2lnbmlmaWNhbnRDb3JyZWxhdGlvbnMuc2xpY2UoMCwgMykuZm9yRWFjaCgoY29yciwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAgICR7aW5kZXggKyAxfS4gJHtjb3JyLmFzc2V0MX0g4oaUICR7Y29yci5hc3NldDJ9OiAke2NvcnIuY29ycmVsYXRpb24udG9GaXhlZCgzKX0gKCR7Y29yci5pbnRlcnByZXRhdGlvbn0pYCk7XG4gICAgfSk7XG4gICAgY29uc29sZS5sb2coKTtcblxuICAgIC8vIEV4YW1wbGUgMzogU2NlbmFyaW8gQW5hbHlzaXNcbiAgICBjb25zb2xlLmxvZygn8J+OryBFeGFtcGxlIDM6IFNjZW5hcmlvIEFuYWx5c2lzJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0nKTtcbiAgICBcbiAgICBjb25zdCBjdXN0b21TY2VuYXJpb3MgPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdFY29ub21pYyBCb29tJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdHJvbmcgZWNvbm9taWMgZ3Jvd3RoIHdpdGggbG93IGluZmxhdGlvbicsXG4gICAgICAgIG1hcmtldENvbmRpdGlvbnM6IHtcbiAgICAgICAgICBlY29ub21pY0dyb3d0aDogMC4wNSxcbiAgICAgICAgICBpbmZsYXRpb246IDAuMDIsXG4gICAgICAgICAgaW50ZXJlc3RSYXRlczogMC4wNCxcbiAgICAgICAgICB2b2xhdGlsaXR5OiAwLjE1XG4gICAgICAgIH0sXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjI1XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiAnTW9kZXJhdGUgR3Jvd3RoJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTdGVhZHkgZWNvbm9taWMgZXhwYW5zaW9uJyxcbiAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgIGVjb25vbWljR3Jvd3RoOiAwLjAzLFxuICAgICAgICAgIGluZmxhdGlvbjogMC4wMjUsXG4gICAgICAgICAgaW50ZXJlc3RSYXRlczogMC4wNDUsXG4gICAgICAgICAgdm9sYXRpbGl0eTogMC4yMFxuICAgICAgICB9LFxuICAgICAgICBwcm9iYWJpbGl0eTogMC40NVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0Vjb25vbWljIFNsb3dkb3duJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdSZWR1Y2VkIGdyb3d0aCB3aXRoIGhpZ2hlciB2b2xhdGlsaXR5JyxcbiAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgIGVjb25vbWljR3Jvd3RoOiAwLjAxLFxuICAgICAgICAgIGluZmxhdGlvbjogMC4wMyxcbiAgICAgICAgICBpbnRlcmVzdFJhdGVzOiAwLjAzLFxuICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMzBcbiAgICAgICAgfSxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMjBcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdSZWNlc3Npb24nLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0Vjb25vbWljIGNvbnRyYWN0aW9uIHdpdGggaGlnaCB1bmNlcnRhaW50eScsXG4gICAgICAgIG1hcmtldENvbmRpdGlvbnM6IHtcbiAgICAgICAgICBlY29ub21pY0dyb3d0aDogLTAuMDIsXG4gICAgICAgICAgaW5mbGF0aW9uOiAwLjAxLFxuICAgICAgICAgIGludGVyZXN0UmF0ZXM6IDAuMDIsXG4gICAgICAgICAgdm9sYXRpbGl0eTogMC40MFxuICAgICAgICB9LFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4xMFxuICAgICAgfVxuICAgIF07XG5cbiAgICBjb25zdCBzY2VuYXJpb1JlcXVlc3QgPSB7XG4gICAgICBpbnZlc3RtZW50czogc2FtcGxlUG9ydGZvbGlvLFxuICAgICAgYW5hbHlzaXNUeXBlOiAnc2NlbmFyaW8nIGFzIGNvbnN0LFxuICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICBzY2VuYXJpb3M6IGN1c3RvbVNjZW5hcmlvcyxcbiAgICAgICAgaW5jbHVkZVN0cmVzc1Rlc3Rpbmc6IHRydWVcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3Qgc2NlbmFyaW9SZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChzY2VuYXJpb1JlcXVlc3QpO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKGBTY2VuYXJpb3MgQW5hbHl6ZWQ6ICR7c2NlbmFyaW9SZXNwb25zZS5zY2VuYXJpb0FuYWx5c2lzIS5zY2VuYXJpb3MubGVuZ3RofWApO1xuICAgIGNvbnNvbGUubG9nKGBFeHBlY3RlZCBQb3J0Zm9saW8gUmV0dXJuOiAkeyhzY2VuYXJpb1Jlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLmV4cGVjdGVkVmFsdWUgKiAxMDApLnRvRml4ZWQoMil9JWApO1xuICAgIGNvbnNvbGUubG9nKGBCZXN0IENhc2UgUmV0dXJuOiAkeyhzY2VuYXJpb1Jlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLmJlc3RDYXNlLnBvcnRmb2xpb1JldHVybiAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgY29uc29sZS5sb2coYFdvcnN0IENhc2UgUmV0dXJuOiAkeyhzY2VuYXJpb1Jlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLndvcnN0Q2FzZS5wb3J0Zm9saW9SZXR1cm4gKiAxMDApLnRvRml4ZWQoMil9JWApO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5TY2VuYXJpbyBCcmVha2Rvd246Jyk7XG4gICAgc2NlbmFyaW9SZXNwb25zZS5zY2VuYXJpb0FuYWx5c2lzIS5zY2VuYXJpb3MuZm9yRWFjaCgoc2NlbmFyaW8sIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgICAke2luZGV4ICsgMX0uICR7c2NlbmFyaW8uc2NlbmFyaW8ubmFtZX06ICR7KHNjZW5hcmlvLnBvcnRmb2xpb1JldHVybiAqIDEwMCkudG9GaXhlZCgyKX0lICgkeyhzY2VuYXJpby5wcm9iYWJpbGl0eSAqIDEwMCkudG9GaXhlZCgwKX0lIHByb2JhYmlsaXR5KWApO1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCk7XG5cbiAgICAvLyBFeGFtcGxlIDQ6IENvbXByZWhlbnNpdmUgQW5hbHlzaXNcbiAgICBjb25zb2xlLmxvZygn8J+OryBFeGFtcGxlIDQ6IENvbXByZWhlbnNpdmUgQW5hbHlzaXMnKTtcbiAgICBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tJyk7XG4gICAgXG4gICAgY29uc3QgY29tcHJlaGVuc2l2ZVJlcXVlc3QgPSB7XG4gICAgICBpbnZlc3RtZW50czogc2FtcGxlUG9ydGZvbGlvLFxuICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZScgYXMgY29uc3QsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIHRpbWVIb3Jpem9uOiAnbG9uZycgYXMgY29uc3QsXG4gICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScgYXMgY29uc3QsXG4gICAgICAgIGluY2x1ZGVTdHJlc3NUZXN0aW5nOiB0cnVlLFxuICAgICAgICBjb25maWRlbmNlTGV2ZWw6IDAuOTVcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgY29tcHJlaGVuc2l2ZVJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KGNvbXByZWhlbnNpdmVSZXF1ZXN0KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgVG90YWwgQW5hbHlzaXMgUmVzdWx0czogJHtjb21wcmVoZW5zaXZlUmVzcG9uc2UucmVzdWx0cy5sZW5ndGh9YCk7XG4gICAgY29uc29sZS5sb2coYE92ZXJhbGwgQ29uZmlkZW5jZTogJHsoY29tcHJlaGVuc2l2ZVJlc3BvbnNlLmNvbmZpZGVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGBFeGVjdXRpb24gVGltZTogJHtjb21wcmVoZW5zaXZlUmVzcG9uc2UuZXhlY3V0aW9uVGltZX1tc2ApO1xuICAgIGNvbnNvbGUubG9nKGBSaXNrIEFzc2Vzc21lbnQ6ICR7Y29tcHJlaGVuc2l2ZVJlc3BvbnNlLnJpc2tBc3Nlc3NtZW50Lm92ZXJhbGxSaXNrfSAoU2NvcmU6ICR7Y29tcHJlaGVuc2l2ZVJlc3BvbnNlLnJpc2tBc3Nlc3NtZW50LnJpc2tTY29yZS50b0ZpeGVkKDIpfSlgKTtcbiAgICBcbiAgICBpZiAoY29tcHJlaGVuc2l2ZVJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4KSB7XG4gICAgICBjb25zb2xlLmxvZyhgQ29ycmVsYXRpb24gQW5hbHlzaXM6ICR7Y29tcHJlaGVuc2l2ZVJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4LnNpZ25pZmljYW50Q29ycmVsYXRpb25zLmxlbmd0aH0gc2lnbmlmaWNhbnQgY29ycmVsYXRpb25zYCk7XG4gICAgfVxuICAgIFxuICAgIGlmIChjb21wcmVoZW5zaXZlUmVzcG9uc2Uuc2NlbmFyaW9BbmFseXNpcykge1xuICAgICAgY29uc29sZS5sb2coYFNjZW5hcmlvIEFuYWx5c2lzOiBFeHBlY3RlZCByZXR1cm4gJHsoY29tcHJlaGVuc2l2ZVJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMuZXhwZWN0ZWRWYWx1ZSAqIDEwMCkudG9GaXhlZCgyKX0lYCk7XG4gICAgfVxuICAgIFxuICAgIGNvbnNvbGUubG9nKCdcXG5Ub3AgUmVjb21tZW5kYXRpb25zOicpO1xuICAgIGNvbXByZWhlbnNpdmVSZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMuc2xpY2UoMCwgNSkuZm9yRWFjaCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coYCAgJHtpbmRleCArIDF9LiAke3JlYy5hY3Rpb24udG9VcHBlckNhc2UoKX0gKCR7cmVjLnRpbWVIb3Jpem9ufS10ZXJtKSAtICR7cmVjLnJhdGlvbmFsZX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICAgIENvbmZpZGVuY2U6ICR7KHJlYy5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygpO1xuXG4gICAgLy8gRXhhbXBsZSA1OiBBZ2VudCBNZXNzYWdlIEhhbmRsaW5nXG4gICAgY29uc29sZS5sb2coJ/CfkqwgRXhhbXBsZSA1OiBBZ2VudCBNZXNzYWdlIEhhbmRsaW5nJyk7XG4gICAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLScpO1xuICAgIFxuICAgIGNvbnN0IGFnZW50TWVzc2FnZSA9IHtcbiAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InIGFzIGNvbnN0LFxuICAgICAgcmVjaXBpZW50OiAnYW5hbHlzaXMnIGFzIGNvbnN0LFxuICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyBhcyBjb25zdCxcbiAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgdHlwZTogJ2FuYWx5c2lzJyxcbiAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgIGludmVzdG1lbnRzOiBbc2FtcGxlUG9ydGZvbGlvWzBdXSxcbiAgICAgICAgICBhbmFseXNpc1R5cGU6ICdmdW5kYW1lbnRhbCcgYXMgY29uc3QsXG4gICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgdGltZUhvcml6b246ICdzaG9ydCcgYXMgY29uc3RcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LWFuYWx5c2lzLWV4YW1wbGUnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtYW5hbHlzaXMtMDAxJ1xuICAgICAgfVxuICAgIH07XG5cbiAgICBjb25zdCBtZXNzYWdlUmVzcG9uc2UgPSBhd2FpdCBhbmFseXNpc0FnZW50LmhhbmRsZU1lc3NhZ2UoYWdlbnRNZXNzYWdlKTtcbiAgICBcbiAgICBjb25zb2xlLmxvZyhgTWVzc2FnZSBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5YCk7XG4gICAgY29uc29sZS5sb2coYFJlc3BvbnNlIGZyb206ICR7bWVzc2FnZVJlc3BvbnNlLnNlbmRlcn1gKTtcbiAgICBjb25zb2xlLmxvZyhgUmVzcG9uc2UgdG86ICR7bWVzc2FnZVJlc3BvbnNlLnJlY2lwaWVudH1gKTtcbiAgICBjb25zb2xlLmxvZyhgTWVzc2FnZSB0eXBlOiAke21lc3NhZ2VSZXNwb25zZS5tZXNzYWdlVHlwZX1gKTtcbiAgICBjb25zb2xlLmxvZyhgQW5hbHlzaXMgcmVzdWx0czogJHttZXNzYWdlUmVzcG9uc2UuY29udGVudC5yZXN1bHRzPy5sZW5ndGggfHwgMH0gaW52ZXN0bWVudChzKWApO1xuICAgIGNvbnNvbGUubG9nKCk7XG5cbiAgICBjb25zb2xlLmxvZygn4pyFIEFuYWx5c2lzIEFnZW50IGV4YW1wbGVzIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkhJyk7XG4gICAgY29uc29sZS5sb2coJ1xcbktleSBGZWF0dXJlcyBEZW1vbnN0cmF0ZWQ6Jyk7XG4gICAgY29uc29sZS5sb2coJ+KAoiBGdW5kYW1lbnRhbCBhbmFseXNpcyB3aXRoIGZpbmFuY2lhbCBtZXRyaWNzIGV2YWx1YXRpb24nKTtcbiAgICBjb25zb2xlLmxvZygn4oCiIENvcnJlbGF0aW9uIGFuYWx5c2lzIHdpdGggZGl2ZXJzaWZpY2F0aW9uIHNjb3JpbmcnKTtcbiAgICBjb25zb2xlLmxvZygn4oCiIFNjZW5hcmlvIGFuYWx5c2lzIHdpdGggY3VzdG9tIG1hcmtldCBjb25kaXRpb25zJyk7XG4gICAgY29uc29sZS5sb2coJ+KAoiBDb21wcmVoZW5zaXZlIGFuYWx5c2lzIGNvbWJpbmluZyBtdWx0aXBsZSBhcHByb2FjaGVzJyk7XG4gICAgY29uc29sZS5sb2coJ+KAoiBBZ2VudCBtZXNzYWdlIGhhbmRsaW5nIGZvciBpbnRlci1hZ2VudCBjb21tdW5pY2F0aW9uJyk7XG4gICAgY29uc29sZS5sb2coJ+KAoiBSaXNrIGFzc2Vzc21lbnQgYW5kIHJlY29tbWVuZGF0aW9uIGdlbmVyYXRpb24nKTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBydW5uaW5nIEFuYWx5c2lzIEFnZW50IGV4YW1wbGU6JywgZXJyb3IpO1xuICAgIFxuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBkZXRhaWxzOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgaWYgKGVycm9yLnN0YWNrKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YWNrIHRyYWNlOicsIGVycm9yLnN0YWNrKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gUnVuIHRoZSBleGFtcGxlIGlmIHRoaXMgZmlsZSBpcyBleGVjdXRlZCBkaXJlY3RseVxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIHJ1bkFuYWx5c2lzQWdlbnRFeGFtcGxlKClcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnXFxu8J+OiSBBbmFseXNpcyBBZ2VudCBleGFtcGxlIGNvbXBsZXRlZCEnKTtcbiAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1xcbvCfkqUgQW5hbHlzaXMgQWdlbnQgZXhhbXBsZSBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBydW5BbmFseXNpc0FnZW50RXhhbXBsZSB9OyJdfQ==