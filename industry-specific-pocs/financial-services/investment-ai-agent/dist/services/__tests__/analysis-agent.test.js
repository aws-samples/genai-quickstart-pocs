"use strict";
/**
 * Analysis Agent Tests
 *
 * Tests for the Analysis Agent implementation including:
 * - Financial analysis algorithms
 * - Correlation and causation analysis
 * - Scenario generation and evaluation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const analysis_agent_1 = require("../ai/analysis-agent");
// Mock dependencies
jest.mock('../ai/amazon-nova-pro-service');
jest.mock('../market-data-service');
describe('AnalysisAgent', () => {
    let analysisAgent;
    let mockNovaProService;
    let mockMarketDataService;
    // Sample investment data for testing
    const sampleInvestments = [
        {
            id: 'inv-1',
            type: 'stock',
            name: 'Apple Inc.',
            ticker: 'AAPL',
            description: 'Technology company',
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
            technicalIndicators: {
                movingAverages: {
                    ma50: 145,
                    ma100: 140,
                    ma200: 135
                },
                relativeStrengthIndex: 65,
                macdLine: 2.5,
                macdSignal: 2.0,
                macdHistogram: 0.5,
                bollingerBands: {
                    upper: 155,
                    middle: 150,
                    lower: 145
                },
                averageVolume: 1100000
            },
            sentimentAnalysis: {
                overallSentiment: 'positive',
                sentimentScore: 0.7,
                sentimentTrend: 'stable',
                newsVolume: 50,
                socialMediaMentions: 1000,
                analystRecommendations: {
                    buy: 15,
                    hold: 8,
                    sell: 2
                },
                insiderTrading: {
                    buying: 5,
                    selling: 2
                }
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
            id: 'inv-2',
            type: 'stock',
            name: 'Microsoft Corporation',
            ticker: 'MSFT',
            description: 'Technology company',
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
        }
    ];
    beforeEach(() => {
        // Create mocked services
        mockNovaProService = {
            complete: jest.fn(),
            parseResponse: jest.fn(),
            generateSystemPrompt: jest.fn()
        };
        mockMarketDataService = {
            getMarketData: jest.fn(),
            getHistoricalData: jest.fn()
        };
        // Create analysis agent with mocked dependencies
        analysisAgent = new analysis_agent_1.AnalysisAgent(mockNovaProService, mockMarketDataService);
    });
    describe('Fundamental Analysis', () => {
        it('should perform fundamental analysis for investments', async () => {
            // Mock Nova Pro response
            const mockResponse = {
                completion: `
          # Fundamental Analysis for Apple Inc.
          
          ## Valuation Assessment
          Apple appears fairly valued based on current metrics.
          
          ## Key Strengths
          - Strong brand loyalty
          - Diversified product portfolio
          - Excellent cash generation
          
          ## Key Weaknesses
          - High dependence on iPhone sales
          - Mature smartphone market
          
          ## Investment Recommendation
          HOLD with target price of $155
        `,
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const request = {
                investments: [sampleInvestments[0]],
                analysisType: 'fundamental',
                parameters: {
                    timeHorizon: 'medium'
                }
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.results).toHaveLength(1);
            expect(response.results[0].analysisType).toBe('fundamental');
            expect(response.results[0].investmentId).toBe('inv-1');
            expect(response.riskAssessment).toBeDefined();
            expect(response.recommendations).toBeDefined();
            expect(response.confidence).toBeGreaterThan(0);
            expect(mockNovaProService.complete).toHaveBeenCalled();
        });
        it('should handle multiple investments in fundamental analysis', async () => {
            const mockResponse = {
                completion: 'Fundamental analysis completed',
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const request = {
                investments: sampleInvestments,
                analysisType: 'fundamental',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.results).toHaveLength(2);
            expect(mockNovaProService.complete).toHaveBeenCalledTimes(2);
        });
    });
    describe('Correlation Analysis', () => {
        it('should calculate correlation matrix for investments', async () => {
            const request = {
                investments: sampleInvestments,
                analysisType: 'correlation',
                parameters: {
                    correlationThreshold: 0.5
                }
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.correlationMatrix).toBeDefined();
            expect(response.correlationMatrix.matrix).toBeDefined();
            expect(response.correlationMatrix.significantCorrelations).toBeDefined();
            expect(response.riskAssessment.diversificationScore).toBeDefined();
        });
        it('should identify significant correlations', async () => {
            const request = {
                investments: sampleInvestments,
                analysisType: 'correlation',
                parameters: {
                    correlationThreshold: 0.3
                }
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.correlationMatrix.significantCorrelations).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    asset1: expect.any(String),
                    asset2: expect.any(String),
                    correlation: expect.any(Number),
                    significance: expect.any(Number),
                    interpretation: expect.any(String)
                })
            ]));
        });
        it('should calculate Pearson correlation correctly', async () => {
            // Test the correlation calculation with known values
            const request = {
                investments: sampleInvestments,
                analysisType: 'correlation',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            const matrix = response.correlationMatrix.matrix;
            // Self-correlation should be 1
            expect(matrix['inv-1']['inv-1']).toBeCloseTo(1, 2);
            expect(matrix['inv-2']['inv-2']).toBeCloseTo(1, 2);
            // Cross-correlations should be symmetric
            expect(matrix['inv-1']['inv-2']).toBeCloseTo(matrix['inv-2']['inv-1'], 5);
        });
    });
    describe('Scenario Analysis', () => {
        it('should perform scenario analysis with default scenarios', async () => {
            const request = {
                investments: sampleInvestments,
                analysisType: 'scenario',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.scenarioAnalysis).toBeDefined();
            expect(response.scenarioAnalysis.scenarios).toHaveLength(4); // Default scenarios
            expect(response.scenarioAnalysis.expectedValue).toBeDefined();
            expect(response.scenarioAnalysis.bestCase).toBeDefined();
            expect(response.scenarioAnalysis.worstCase).toBeDefined();
            expect(response.scenarioAnalysis.probabilityWeightedReturn).toBeDefined();
        });
        it('should use custom scenarios when provided', async () => {
            const customScenarios = [
                {
                    name: 'Custom Bull',
                    description: 'Custom bull market scenario',
                    marketConditions: {
                        economicGrowth: 0.05,
                        inflation: 0.02,
                        interestRates: 0.03,
                        volatility: 0.12
                    },
                    probability: 0.6
                },
                {
                    name: 'Custom Bear',
                    description: 'Custom bear market scenario',
                    marketConditions: {
                        economicGrowth: -0.03,
                        inflation: 0.04,
                        interestRates: 0.01,
                        volatility: 0.40
                    },
                    probability: 0.4
                }
            ];
            const request = {
                investments: sampleInvestments,
                analysisType: 'scenario',
                parameters: {
                    scenarios: customScenarios
                }
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.scenarioAnalysis.scenarios).toHaveLength(2);
            expect(response.scenarioAnalysis.scenarios[0].scenario.name).toBe('Custom Bull');
            expect(response.scenarioAnalysis.scenarios[1].scenario.name).toBe('Custom Bear');
        });
        it('should calculate probability-weighted returns correctly', async () => {
            const request = {
                investments: sampleInvestments,
                analysisType: 'scenario',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            const scenarios = response.scenarioAnalysis.scenarios;
            // Calculate expected probability-weighted return manually
            const expectedReturn = scenarios.reduce((sum, scenario) => sum + (scenario.portfolioReturn * scenario.probability), 0);
            expect(response.scenarioAnalysis.probabilityWeightedReturn).toBeCloseTo(expectedReturn, 5);
            expect(response.scenarioAnalysis.expectedValue).toBeCloseTo(expectedReturn, 5);
        });
    });
    describe('Comprehensive Analysis', () => {
        it('should combine multiple analysis types', async () => {
            const mockResponse = {
                completion: 'Analysis completed',
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const request = {
                investments: sampleInvestments,
                analysisType: 'comprehensive',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.results.length).toBeGreaterThan(2); // Should have results from multiple analysis types
            expect(response.correlationMatrix).toBeDefined();
            expect(response.scenarioAnalysis).toBeDefined();
            expect(response.riskAssessment).toBeDefined();
            expect(response.recommendations).toBeDefined();
        });
        it('should synthesize recommendations from multiple analyses', async () => {
            const mockResponse = {
                completion: 'Analysis completed',
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const request = {
                investments: sampleInvestments,
                analysisType: 'comprehensive',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.recommendations.length).toBeGreaterThan(0);
            expect(response.recommendations.length).toBeLessThanOrEqual(5); // Should limit to top 5
        });
    });
    describe('Risk Assessment', () => {
        it('should assess portfolio risk correctly', async () => {
            const request = {
                investments: sampleInvestments,
                analysisType: 'correlation',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.riskAssessment.overallRisk).toMatch(/^(low|medium|high|very-high)$/);
            expect(response.riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
            expect(response.riskAssessment.riskScore).toBeLessThanOrEqual(1);
            expect(response.riskAssessment.diversificationScore).toBeGreaterThanOrEqual(0);
            expect(response.riskAssessment.diversificationScore).toBeLessThanOrEqual(1);
        });
        it('should combine risk assessments from multiple analyses', async () => {
            const mockResponse = {
                completion: 'Analysis completed',
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const request = {
                investments: sampleInvestments,
                analysisType: 'comprehensive',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.riskAssessment).toBeDefined();
            expect(response.riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
            expect(response.riskAssessment.riskScore).toBeLessThanOrEqual(1);
        });
    });
    describe('Agent Message Handling', () => {
        it('should handle analysis request messages', async () => {
            const mockResponse = {
                completion: 'Analysis completed',
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const message = {
                sender: 'supervisor',
                recipient: 'analysis',
                messageType: 'request',
                content: {
                    type: 'analysis',
                    request: {
                        investments: [sampleInvestments[0]],
                        analysisType: 'fundamental',
                        parameters: {}
                    }
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-1',
                    requestId: 'req-1'
                }
            };
            const response = await analysisAgent.handleMessage(message);
            expect(response.messageType).toBe('response');
            expect(response.sender).toBe('analysis');
            expect(response.recipient).toBe('supervisor');
            expect(response.content).toBeDefined();
        });
        it('should throw error for unsupported message types', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'analysis',
                messageType: 'unsupported',
                content: {},
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-1',
                    requestId: 'req-1'
                }
            };
            await expect(analysisAgent.handleMessage(message)).rejects.toThrow('Unsupported message type');
        });
        it('should throw error for unsupported request types', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'analysis',
                messageType: 'request',
                content: {
                    type: 'unsupported',
                    request: {}
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-1',
                    requestId: 'req-1'
                }
            };
            await expect(analysisAgent.handleMessage(message)).rejects.toThrow('Unsupported request type');
        });
    });
    describe('Error Handling', () => {
        it('should handle Nova Pro service errors gracefully', async () => {
            mockNovaProService.complete.mockRejectedValue(new Error('Nova Pro service error'));
            const request = {
                investments: [sampleInvestments[0]],
                analysisType: 'fundamental',
                parameters: {}
            };
            await expect(analysisAgent.processAnalysisRequest(request)).rejects.toThrow('Nova Pro service error');
        });
        it('should handle unsupported analysis types', async () => {
            const request = {
                investments: sampleInvestments,
                analysisType: 'unsupported',
                parameters: {}
            };
            await expect(analysisAgent.processAnalysisRequest(request)).rejects.toThrow('Unsupported analysis type');
        });
        it('should handle empty investment arrays', async () => {
            const request = {
                investments: [],
                analysisType: 'fundamental',
                parameters: {}
            };
            const response = await analysisAgent.processAnalysisRequest(request);
            expect(response.results).toHaveLength(0);
            expect(response.confidence).toBe(0); // NaN should be handled as 0
        });
    });
    describe('Performance', () => {
        it('should complete analysis within reasonable time', async () => {
            const mockResponse = {
                completion: 'Analysis completed',
                modelId: 'amazon.nova-pro-v1:0',
                usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
                requestId: 'test-request',
                finishReason: 'stop'
            };
            mockNovaProService.complete.mockResolvedValue(mockResponse);
            const request = {
                investments: sampleInvestments,
                analysisType: 'fundamental',
                parameters: {}
            };
            const startTime = Date.now();
            const response = await analysisAgent.processAnalysisRequest(request);
            const endTime = Date.now();
            expect(response.executionTime).toBeGreaterThanOrEqual(0);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHlzaXMtYWdlbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vYW5hbHlzaXMtYWdlbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7QUFFSCx5REFBcUQ7QUFNckQsb0JBQW9CO0FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFFcEMsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDN0IsSUFBSSxhQUE0QixDQUFDO0lBQ2pDLElBQUksa0JBQXFELENBQUM7SUFDMUQsSUFBSSxxQkFBcUQsQ0FBQztJQUUxRCxxQ0FBcUM7SUFDckMsTUFBTSxpQkFBaUIsR0FBaUI7UUFDdEM7WUFDRSxFQUFFLEVBQUUsT0FBTztZQUNYLElBQUksRUFBRSxPQUFPO1lBQ2IsSUFBSSxFQUFFLFlBQVk7WUFDbEIsTUFBTSxFQUFFLE1BQU07WUFDZCxXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLE1BQU0sRUFBRSxZQUFZO1lBQ3BCLFFBQVEsRUFBRSxzQkFBc0I7WUFDaEMsU0FBUyxFQUFFLGFBQWE7WUFDeEIsWUFBWSxFQUFFLE1BQU07WUFDcEIscUJBQXFCLEVBQUU7Z0JBQ3JCO29CQUNFLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7b0JBQzVCLElBQUksRUFBRSxHQUFHO29CQUNULElBQUksRUFBRSxHQUFHO29CQUNULEdBQUcsRUFBRSxHQUFHO29CQUNSLEtBQUssRUFBRSxHQUFHO29CQUNWLE1BQU0sRUFBRSxPQUFPO29CQUNmLGFBQWEsRUFBRSxHQUFHO2lCQUNuQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO29CQUM1QixJQUFJLEVBQUUsR0FBRztvQkFDVCxJQUFJLEVB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QUFhLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG1DQUFtQztRQUNyRixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFuYWx5c2lzIEFnZW50IFRlc3RzXG4gKiBcbiAqIFRlc3RzIGZvciB0aGUgQW5hbHlzaXMgQWdlbnQgaW1wbGVtZW50YXRpb24gaW5jbHVkaW5nOlxuICogLSBGaW5hbmNpYWwgYW5hbHlzaXMgYWxnb3JpdGhtc1xuICogLSBDb3JyZWxhdGlvbiBhbmQgY2F1c2F0aW9uIGFuYWx5c2lzXG4gKiAtIFNjZW5hcmlvIGdlbmVyYXRpb24gYW5kIGV2YWx1YXRpb25cbiAqL1xuXG5pbXBvcnQgeyBBbmFseXNpc0FnZW50IH0gZnJvbSAnLi4vYWkvYW5hbHlzaXMtYWdlbnQnO1xuaW1wb3J0IHsgQW1hem9uTm92YVByb1NlcnZpY2UgfSBmcm9tICcuLi9haS9hbWF6b24tbm92YS1wcm8tc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXREYXRhU2VydmljZSB9IGZyb20gJy4uL21hcmtldC1kYXRhLXNlcnZpY2UnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcbmltcG9ydCB7IEJlZHJvY2tSZXNwb25zZSB9IGZyb20gJy4uLy4uL21vZGVscy9iZWRyb2NrJztcblxuLy8gTW9jayBkZXBlbmRlbmNpZXNcbmplc3QubW9jaygnLi4vYWkvYW1hem9uLW5vdmEtcHJvLXNlcnZpY2UnKTtcbmplc3QubW9jaygnLi4vbWFya2V0LWRhdGEtc2VydmljZScpO1xuXG5kZXNjcmliZSgnQW5hbHlzaXNBZ2VudCcsICgpID0+IHtcbiAgbGV0IGFuYWx5c2lzQWdlbnQ6IEFuYWx5c2lzQWdlbnQ7XG4gIGxldCBtb2NrTm92YVByb1NlcnZpY2U6IGplc3QuTW9ja2VkPEFtYXpvbk5vdmFQcm9TZXJ2aWNlPjtcbiAgbGV0IG1vY2tNYXJrZXREYXRhU2VydmljZTogamVzdC5Nb2NrZWQ8TWFya2V0RGF0YVNlcnZpY2U+O1xuXG4gIC8vIFNhbXBsZSBpbnZlc3RtZW50IGRhdGEgZm9yIHRlc3RpbmdcbiAgY29uc3Qgc2FtcGxlSW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSA9IFtcbiAgICB7XG4gICAgICBpZDogJ2ludi0xJyxcbiAgICAgIHR5cGU6ICdzdG9jaycsXG4gICAgICBuYW1lOiAnQXBwbGUgSW5jLicsXG4gICAgICB0aWNrZXI6ICdBQVBMJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGVjaG5vbG9neSBjb21wYW55JyxcbiAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgaW5kdXN0cnk6ICdDb25zdW1lciBFbGVjdHJvbmljcycsXG4gICAgICBtYXJrZXRDYXA6IDMwMDAwMDAwMDAwMDAsXG4gICAgICBjdXJyZW50UHJpY2U6IDE1MC4wMCxcbiAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW1xuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDEnKSxcbiAgICAgICAgICBvcGVuOiAxNDAsXG4gICAgICAgICAgaGlnaDogMTQ1LFxuICAgICAgICAgIGxvdzogMTM4LFxuICAgICAgICAgIGNsb3NlOiAxNDIsXG4gICAgICAgICAgdm9sdW1lOiAxMDAwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDE0MlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDInKSxcbiAgICAgICAgICBvcGVuOiAxNDIsXG4gICAgICAgICAgaGlnaDogMTQ4LFxuICAgICAgICAgIGxvdzogMTQxLFxuICAgICAgICAgIGNsb3NlOiAxNDcsXG4gICAgICAgICAgdm9sdW1lOiAxMjAwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDE0N1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDMnKSxcbiAgICAgICAgICBvcGVuOiAxNDcsXG4gICAgICAgICAgaGlnaDogMTUyLFxuICAgICAgICAgIGxvdzogMTQ2LFxuICAgICAgICAgIGNsb3NlOiAxNTAsXG4gICAgICAgICAgdm9sdW1lOiAxMTAwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDE1MFxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZnVuZGFtZW50YWxzOiB7XG4gICAgICAgIGVwczogNi4wNSxcbiAgICAgICAgcGVSYXRpbzogMjQuOCxcbiAgICAgICAgcGJSYXRpbzogNS4yLFxuICAgICAgICBkaXZpZGVuZFlpZWxkOiAwLjUsXG4gICAgICAgIHJldmVudWVHcm93dGg6IDAuMDgsXG4gICAgICAgIHByb2ZpdE1hcmdpbjogMC4yNSxcbiAgICAgICAgZGVidFRvRXF1aXR5OiAxLjgsXG4gICAgICAgIGZyZWVDYXNoRmxvdzogMTAwMDAwMDAwMDAwLFxuICAgICAgICByZXR1cm5PbkVxdWl0eTogMC4xNSxcbiAgICAgICAgcmV0dXJuT25Bc3NldHM6IDAuMTJcbiAgICAgIH0sXG4gICAgICB0ZWNobmljYWxJbmRpY2F0b3JzOiB7XG4gICAgICAgIG1vdmluZ0F2ZXJhZ2VzOiB7XG4gICAgICAgICAgbWE1MDogMTQ1LFxuICAgICAgICAgIG1hMTAwOiAxNDAsXG4gICAgICAgICAgbWEyMDA6IDEzNVxuICAgICAgICB9LFxuICAgICAgICByZWxhdGl2ZVN0cmVuZ3RoSW5kZXg6IDY1LFxuICAgICAgICBtYWNkTGluZTogMi41LFxuICAgICAgICBtYWNkU2lnbmFsOiAyLjAsXG4gICAgICAgIG1hY2RIaXN0b2dyYW06IDAuNSxcbiAgICAgICAgYm9sbGluZ2VyQmFuZHM6IHtcbiAgICAgICAgICB1cHBlcjogMTU1LFxuICAgICAgICAgIG1pZGRsZTogMTUwLFxuICAgICAgICAgIGxvd2VyOiAxNDVcbiAgICAgICAgfSxcbiAgICAgICAgYXZlcmFnZVZvbHVtZTogMTEwMDAwMFxuICAgICAgfSxcbiAgICAgIHNlbnRpbWVudEFuYWx5c2lzOiB7XG4gICAgICAgIG92ZXJhbGxTZW50aW1lbnQ6ICdwb3NpdGl2ZScsXG4gICAgICAgIHNlbnRpbWVudFNjb3JlOiAwLjcsXG4gICAgICAgIHNlbnRpbWVudFRyZW5kOiAnc3RhYmxlJyxcbiAgICAgICAgbmV3c1ZvbHVtZTogNTAsXG4gICAgICAgIHNvY2lhbE1lZGlhTWVudGlvbnM6IDEwMDAsXG4gICAgICAgIGFuYWx5c3RSZWNvbW1lbmRhdGlvbnM6IHtcbiAgICAgICAgICBidXk6IDE1LFxuICAgICAgICAgIGhvbGQ6IDgsXG4gICAgICAgICAgc2VsbDogMlxuICAgICAgICB9LFxuICAgICAgICBpbnNpZGVyVHJhZGluZzoge1xuICAgICAgICAgIGJ1eWluZzogNSxcbiAgICAgICAgICBzZWxsaW5nOiAyXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByaXNrTWV0cmljczoge1xuICAgICAgICB2b2xhdGlsaXR5OiAwLjI1LFxuICAgICAgICBiZXRhOiAxLjIsXG4gICAgICAgIHNoYXJwZVJhdGlvOiAxLjUsXG4gICAgICAgIGRyYXdkb3duOiAwLjE1LFxuICAgICAgICB2YXI6IDAuMDUsXG4gICAgICAgIGNvcnJlbGF0aW9uczoge1xuICAgICAgICAgICdTUFknOiAwLjgsXG4gICAgICAgICAgJ1FRUSc6IDAuOVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgcmVsYXRlZEludmVzdG1lbnRzOiBbJ01TRlQnLCAnR09PR0wnXVxuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICdpbnYtMicsXG4gICAgICB0eXBlOiAnc3RvY2snLFxuICAgICAgbmFtZTogJ01pY3Jvc29mdCBDb3Jwb3JhdGlvbicsXG4gICAgICB0aWNrZXI6ICdNU0ZUJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGVjaG5vbG9neSBjb21wYW55JyxcbiAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgaW5kdXN0cnk6ICdTb2Z0d2FyZScsXG4gICAgICBtYXJrZXRDYXA6IDI4MDAwMDAwMDAwMDAsXG4gICAgICBjdXJyZW50UHJpY2U6IDM4MC4wMCxcbiAgICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW1xuICAgICAgICB7XG4gICAgICAgICAgZGF0ZTogbmV3IERhdGUoJzIwMjQtMDEtMDEnKSxcbiAgICAgICAgICBvcGVuOiAzNzAsXG4gICAgICAgICAgaGlnaDogMzc1LFxuICAgICAgICAgIGxvdzogMzY4LFxuICAgICAgICAgIGNsb3NlOiAzNzIsXG4gICAgICAgICAgdm9sdW1lOiA4MDAwMDAsXG4gICAgICAgICAgYWRqdXN0ZWRDbG9zZTogMzcyXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBkYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMicpLFxuICAgICAgICAgIG9wZW46IDM3MixcbiAgICAgICAgICBoaWdoOiAzNzgsXG4gICAgICAgICAgbG93OiAzNzEsXG4gICAgICAgICAgY2xvc2U6IDM3NixcbiAgICAgICAgICB2b2x1bWU6IDkwMDAwMCxcbiAgICAgICAgICBhZGp1c3RlZENsb3NlOiAzNzZcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAzJyksXG4gICAgICAgICAgb3BlbjogMzc2LFxuICAgICAgICAgIGhpZ2g6IDM4MixcbiAgICAgICAgICBsb3c6IDM3NSxcbiAgICAgICAgICBjbG9zZTogMzgwLFxuICAgICAgICAgIHZvbHVtZTogODUwMDAwLFxuICAgICAgICAgIGFkanVzdGVkQ2xvc2U6IDM4MFxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZnVuZGFtZW50YWxzOiB7XG4gICAgICAgIGVwczogMTEuMDUsXG4gICAgICAgIHBlUmF0aW86IDM0LjQsXG4gICAgICAgIHBiUmF0aW86IDQuOCxcbiAgICAgICAgZGl2aWRlbmRZaWVsZDogMC43LFxuICAgICAgICByZXZlbnVlR3Jvd3RoOiAwLjEyLFxuICAgICAgICBwcm9maXRNYXJnaW46IDAuMzAsXG4gICAgICAgIGRlYnRUb0VxdWl0eTogMC41LFxuICAgICAgICBmcmVlQ2FzaEZsb3c6IDgwMDAwMDAwMDAwLFxuICAgICAgICByZXR1cm5PbkVxdWl0eTogMC4xOCxcbiAgICAgICAgcmV0dXJuT25Bc3NldHM6IDAuMTRcbiAgICAgIH0sXG4gICAgICByaXNrTWV0cmljczoge1xuICAgICAgICB2b2xhdGlsaXR5OiAwLjIyLFxuICAgICAgICBiZXRhOiAxLjEsXG4gICAgICAgIHNoYXJwZVJhdGlvOiAxLjgsXG4gICAgICAgIGRyYXdkb3duOiAwLjEyLFxuICAgICAgICB2YXI6IDAuMDQsXG4gICAgICAgIGNvcnJlbGF0aW9uczoge1xuICAgICAgICAgICdTUFknOiAwLjc1LFxuICAgICAgICAgICdRUVEnOiAwLjg1XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICByZWxhdGVkSW52ZXN0bWVudHM6IFsnQUFQTCcsICdHT09HTCddXG4gICAgfVxuICBdO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIC8vIENyZWF0ZSBtb2NrZWQgc2VydmljZXNcbiAgICBtb2NrTm92YVByb1NlcnZpY2UgPSB7XG4gICAgICBjb21wbGV0ZTogamVzdC5mbigpLFxuICAgICAgcGFyc2VSZXNwb25zZTogamVzdC5mbigpLFxuICAgICAgZ2VuZXJhdGVTeXN0ZW1Qcm9tcHQ6IGplc3QuZm4oKVxuICAgIH0gYXMgYW55O1xuXG4gICAgbW9ja01hcmtldERhdGFTZXJ2aWNlID0ge1xuICAgICAgZ2V0TWFya2V0RGF0YTogamVzdC5mbigpLFxuICAgICAgZ2V0SGlzdG9yaWNhbERhdGE6IGplc3QuZm4oKVxuICAgIH0gYXMgYW55O1xuXG4gICAgLy8gQ3JlYXRlIGFuYWx5c2lzIGFnZW50IHdpdGggbW9ja2VkIGRlcGVuZGVuY2llc1xuICAgIGFuYWx5c2lzQWdlbnQgPSBuZXcgQW5hbHlzaXNBZ2VudChtb2NrTm92YVByb1NlcnZpY2UsIG1vY2tNYXJrZXREYXRhU2VydmljZSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdGdW5kYW1lbnRhbCBBbmFseXNpcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBlcmZvcm0gZnVuZGFtZW50YWwgYW5hbHlzaXMgZm9yIGludmVzdG1lbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gTW9jayBOb3ZhIFBybyByZXNwb25zZVxuICAgICAgY29uc3QgbW9ja1Jlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UgPSB7XG4gICAgICAgIGNvbXBsZXRpb246IGBcbiAgICAgICAgICAjIEZ1bmRhbWVudGFsIEFuYWx5c2lzIGZvciBBcHBsZSBJbmMuXG4gICAgICAgICAgXG4gICAgICAgICAgIyMgVmFsdWF0aW9uIEFzc2Vzc21lbnRcbiAgICAgICAgICBBcHBsZSBhcHBlYXJzIGZhaXJseSB2YWx1ZWQgYmFzZWQgb24gY3VycmVudCBtZXRyaWNzLlxuICAgICAgICAgIFxuICAgICAgICAgICMjIEtleSBTdHJlbmd0aHNcbiAgICAgICAgICAtIFN0cm9uZyBicmFuZCBsb3lhbHR5XG4gICAgICAgICAgLSBEaXZlcnNpZmllZCBwcm9kdWN0IHBvcnRmb2xpb1xuICAgICAgICAgIC0gRXhjZWxsZW50IGNhc2ggZ2VuZXJhdGlvblxuICAgICAgICAgIFxuICAgICAgICAgICMjIEtleSBXZWFrbmVzc2VzXG4gICAgICAgICAgLSBIaWdoIGRlcGVuZGVuY2Ugb24gaVBob25lIHNhbGVzXG4gICAgICAgICAgLSBNYXR1cmUgc21hcnRwaG9uZSBtYXJrZXRcbiAgICAgICAgICBcbiAgICAgICAgICAjIyBJbnZlc3RtZW50IFJlY29tbWVuZGF0aW9uXG4gICAgICAgICAgSE9MRCB3aXRoIHRhcmdldCBwcmljZSBvZiAkMTU1XG4gICAgICAgIGAsXG4gICAgICAgIG1vZGVsSWQ6ICdhbWF6b24ubm92YS1wcm8tdjE6MCcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiA1MDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogNzAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCcsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnXG4gICAgICB9O1xuXG4gICAgICBtb2NrTm92YVByb1NlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUobW9ja1Jlc3BvbnNlKTtcblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IFtzYW1wbGVJbnZlc3RtZW50c1swXV0sXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyBhcyBjb25zdFxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlc3VsdHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZXN1bHRzWzBdLmFuYWx5c2lzVHlwZSkudG9CZSgnZnVuZGFtZW50YWwnKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZXN1bHRzWzBdLmludmVzdG1lbnRJZCkudG9CZSgnaW52LTEnKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29uZmlkZW5jZSkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KG1vY2tOb3ZhUHJvU2VydmljZS5jb21wbGV0ZSkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgbXVsdGlwbGUgaW52ZXN0bWVudHMgaW4gZnVuZGFtZW50YWwgYW5hbHlzaXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrUmVzcG9uc2U6IEJlZHJvY2tSZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogJ0Z1bmRhbWVudGFsIGFuYWx5c2lzIGNvbXBsZXRlZCcsXG4gICAgICAgIG1vZGVsSWQ6ICdhbWF6b24ubm92YS1wcm8tdjE6MCcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiA1MDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogNzAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCcsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnXG4gICAgICB9O1xuXG4gICAgICBtb2NrTm92YVByb1NlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUobW9ja1Jlc3BvbnNlKTtcblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IHNhbXBsZUludmVzdG1lbnRzLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdmdW5kYW1lbnRhbCcgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlc3VsdHMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChtb2NrTm92YVByb1NlcnZpY2UuY29tcGxldGUpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygyKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NvcnJlbGF0aW9uIEFuYWx5c2lzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGNvcnJlbGF0aW9uIG1hdHJpeCBmb3IgaW52ZXN0bWVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogc2FtcGxlSW52ZXN0bWVudHMsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2NvcnJlbGF0aW9uJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGNvcnJlbGF0aW9uVGhyZXNob2xkOiAwLjVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhbmFseXNpc0FnZW50LnByb2Nlc3NBbmFseXNpc1JlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb3JyZWxhdGlvbk1hdHJpeCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb3JyZWxhdGlvbk1hdHJpeCEubWF0cml4KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4IS5zaWduaWZpY2FudENvcnJlbGF0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudC5kaXZlcnNpZmljYXRpb25TY29yZSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaWRlbnRpZnkgc2lnbmlmaWNhbnQgY29ycmVsYXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IHNhbXBsZUludmVzdG1lbnRzLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdjb3JyZWxhdGlvbicgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBjb3JyZWxhdGlvblRocmVzaG9sZDogMC4zXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29ycmVsYXRpb25NYXRyaXghLnNpZ25pZmljYW50Q29ycmVsYXRpb25zKS50b0VxdWFsKFxuICAgICAgICBleHBlY3QuYXJyYXlDb250YWluaW5nKFtcbiAgICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICBhc3NldDE6IGV4cGVjdC5hbnkoU3RyaW5nKSxcbiAgICAgICAgICAgIGFzc2V0MjogZXhwZWN0LmFueShTdHJpbmcpLFxuICAgICAgICAgICAgY29ycmVsYXRpb246IGV4cGVjdC5hbnkoTnVtYmVyKSxcbiAgICAgICAgICAgIHNpZ25pZmljYW5jZTogZXhwZWN0LmFueShOdW1iZXIpLFxuICAgICAgICAgICAgaW50ZXJwcmV0YXRpb246IGV4cGVjdC5hbnkoU3RyaW5nKVxuICAgICAgICAgIH0pXG4gICAgICAgIF0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgUGVhcnNvbiBjb3JyZWxhdGlvbiBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBUZXN0IHRoZSBjb3JyZWxhdGlvbiBjYWxjdWxhdGlvbiB3aXRoIGtub3duIHZhbHVlc1xuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IHNhbXBsZUludmVzdG1lbnRzLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdjb3JyZWxhdGlvbicgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIGNvbnN0IG1hdHJpeCA9IHJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4IS5tYXRyaXg7XG5cbiAgICAgIC8vIFNlbGYtY29ycmVsYXRpb24gc2hvdWxkIGJlIDFcbiAgICAgIGV4cGVjdChtYXRyaXhbJ2ludi0xJ11bJ2ludi0xJ10pLnRvQmVDbG9zZVRvKDEsIDIpO1xuICAgICAgZXhwZWN0KG1hdHJpeFsnaW52LTInXVsnaW52LTInXSkudG9CZUNsb3NlVG8oMSwgMik7XG5cbiAgICAgIC8vIENyb3NzLWNvcnJlbGF0aW9ucyBzaG91bGQgYmUgc3ltbWV0cmljXG4gICAgICBleHBlY3QobWF0cml4WydpbnYtMSddWydpbnYtMiddKS50b0JlQ2xvc2VUbyhtYXRyaXhbJ2ludi0yJ11bJ2ludi0xJ10sIDUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnU2NlbmFyaW8gQW5hbHlzaXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwZXJmb3JtIHNjZW5hcmlvIGFuYWx5c2lzIHdpdGggZGVmYXVsdCBzY2VuYXJpb3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogc2FtcGxlSW52ZXN0bWVudHMsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ3NjZW5hcmlvJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc2NlbmFyaW9BbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zY2VuYXJpb0FuYWx5c2lzIS5zY2VuYXJpb3MpLnRvSGF2ZUxlbmd0aCg0KTsgLy8gRGVmYXVsdCBzY2VuYXJpb3NcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zY2VuYXJpb0FuYWx5c2lzIS5leHBlY3RlZFZhbHVlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLmJlc3RDYXNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLndvcnN0Q2FzZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zY2VuYXJpb0FuYWx5c2lzIS5wcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1c2UgY3VzdG9tIHNjZW5hcmlvcyB3aGVuIHByb3ZpZGVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY3VzdG9tU2NlbmFyaW9zID0gW1xuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0N1c3RvbSBCdWxsJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbSBidWxsIG1hcmtldCBzY2VuYXJpbycsXG4gICAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgICAgZWNvbm9taWNHcm93dGg6IDAuMDUsXG4gICAgICAgICAgICBpbmZsYXRpb246IDAuMDIsXG4gICAgICAgICAgICBpbnRlcmVzdFJhdGVzOiAwLjAzLFxuICAgICAgICAgICAgdm9sYXRpbGl0eTogMC4xMlxuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJvYmFiaWxpdHk6IDAuNlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0N1c3RvbSBCZWFyJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbSBiZWFyIG1hcmtldCBzY2VuYXJpbycsXG4gICAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgICAgZWNvbm9taWNHcm93dGg6IC0wLjAzLFxuICAgICAgICAgICAgaW5mbGF0aW9uOiAwLjA0LFxuICAgICAgICAgICAgaW50ZXJlc3RSYXRlczogMC4wMSxcbiAgICAgICAgICAgIHZvbGF0aWxpdHk6IDAuNDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjRcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IHNhbXBsZUludmVzdG1lbnRzLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdzY2VuYXJpbycgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBzY2VuYXJpb3M6IGN1c3RvbVNjZW5hcmlvc1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLnNjZW5hcmlvcykudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLnNjZW5hcmlvc1swXS5zY2VuYXJpby5uYW1lKS50b0JlKCdDdXN0b20gQnVsbCcpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLnNjZW5hcmlvc1sxXS5zY2VuYXJpby5uYW1lKS50b0JlKCdDdXN0b20gQmVhcicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgcHJvYmFiaWxpdHktd2VpZ2h0ZWQgcmV0dXJucyBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogc2FtcGxlSW52ZXN0bWVudHMsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ3NjZW5hcmlvJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3QpO1xuICAgICAgY29uc3Qgc2NlbmFyaW9zID0gcmVzcG9uc2Uuc2NlbmFyaW9BbmFseXNpcyEuc2NlbmFyaW9zO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgZXhwZWN0ZWQgcHJvYmFiaWxpdHktd2VpZ2h0ZWQgcmV0dXJuIG1hbnVhbGx5XG4gICAgICBjb25zdCBleHBlY3RlZFJldHVybiA9IHNjZW5hcmlvcy5yZWR1Y2UoKHN1bSwgc2NlbmFyaW8pID0+IFxuICAgICAgICBzdW0gKyAoc2NlbmFyaW8ucG9ydGZvbGlvUmV0dXJuICogc2NlbmFyaW8ucHJvYmFiaWxpdHkpLCAwXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc2NlbmFyaW9BbmFseXNpcyEucHJvYmFiaWxpdHlXZWlnaHRlZFJldHVybikudG9CZUNsb3NlVG8oZXhwZWN0ZWRSZXR1cm4sIDUpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMhLmV4cGVjdGVkVmFsdWUpLnRvQmVDbG9zZVRvKGV4cGVjdGVkUmV0dXJuLCA1KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NvbXByZWhlbnNpdmUgQW5hbHlzaXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb21iaW5lIG11bHRpcGxlIGFuYWx5c2lzIHR5cGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1Jlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UgPSB7XG4gICAgICAgIGNvbXBsZXRpb246ICdBbmFseXNpcyBjb21wbGV0ZWQnLFxuICAgICAgICBtb2RlbElkOiAnYW1hem9uLm5vdmEtcHJvLXYxOjAnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogNTAwLCBvdXRwdXRUb2tlbnM6IDIwMCwgdG90YWxUb2tlbnM6IDcwMCB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnLFxuICAgICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgICAgfTtcblxuICAgICAgbW9ja05vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tSZXNwb25zZSk7XG5cbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBzYW1wbGVJbnZlc3RtZW50cyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZScgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlc3VsdHMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMik7IC8vIFNob3VsZCBoYXZlIHJlc3VsdHMgZnJvbSBtdWx0aXBsZSBhbmFseXNpcyB0eXBlc1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNjZW5hcmlvQW5hbHlzaXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UucmVjb21tZW5kYXRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzeW50aGVzaXplIHJlY29tbWVuZGF0aW9ucyBmcm9tIG11bHRpcGxlIGFuYWx5c2VzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1Jlc3BvbnNlOiBCZWRyb2NrUmVzcG9uc2UgPSB7XG4gICAgICAgIGNvbXBsZXRpb246ICdBbmFseXNpcyBjb21wbGV0ZWQnLFxuICAgICAgICBtb2RlbElkOiAnYW1hem9uLm5vdmEtcHJvLXYxOjAnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogNTAwLCBvdXRwdXRUb2tlbnM6IDIwMCwgdG90YWxUb2tlbnM6IDcwMCB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnLFxuICAgICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgICAgfTtcblxuICAgICAgbW9ja05vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tSZXNwb25zZSk7XG5cbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBzYW1wbGVJbnZlc3RtZW50cyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZScgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlY29tbWVuZGF0aW9ucy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMubGVuZ3RoKS50b0JlTGVzc1RoYW5PckVxdWFsKDUpOyAvLyBTaG91bGQgbGltaXQgdG8gdG9wIDVcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1Jpc2sgQXNzZXNzbWVudCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGFzc2VzcyBwb3J0Zm9saW8gcmlzayBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogc2FtcGxlSW52ZXN0bWVudHMsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2NvcnJlbGF0aW9uJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnQub3ZlcmFsbFJpc2spLnRvTWF0Y2goL14obG93fG1lZGl1bXxoaWdofHZlcnktaGlnaCkkLyk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnQucmlza1Njb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJpc2tBc3Nlc3NtZW50LnJpc2tTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudC5kaXZlcnNpZmljYXRpb25TY29yZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudC5kaXZlcnNpZmljYXRpb25TY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY29tYmluZSByaXNrIGFzc2Vzc21lbnRzIGZyb20gbXVsdGlwbGUgYW5hbHlzZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrUmVzcG9uc2U6IEJlZHJvY2tSZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogJ0FuYWx5c2lzIGNvbXBsZXRlZCcsXG4gICAgICAgIG1vZGVsSWQ6ICdhbWF6b24ubm92YS1wcm8tdjE6MCcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiA1MDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogNzAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCcsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnXG4gICAgICB9O1xuXG4gICAgICBtb2NrTm92YVByb1NlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUobW9ja1Jlc3BvbnNlKTtcblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IHNhbXBsZUludmVzdG1lbnRzLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdjb21wcmVoZW5zaXZlJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnQucmlza1Njb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJpc2tBc3Nlc3NtZW50LnJpc2tTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0FnZW50IE1lc3NhZ2UgSGFuZGxpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgYW5hbHlzaXMgcmVxdWVzdCBtZXNzYWdlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tSZXNwb25zZTogQmVkcm9ja1Jlc3BvbnNlID0ge1xuICAgICAgICBjb21wbGV0aW9uOiAnQW5hbHlzaXMgY29tcGxldGVkJyxcbiAgICAgICAgbW9kZWxJZDogJ2FtYXpvbi5ub3ZhLXByby12MTowJyxcbiAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDUwMCwgb3V0cHV0VG9rZW5zOiAyMDAsIHRvdGFsVG9rZW5zOiA3MDAgfSxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0JyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH07XG5cbiAgICAgIG1vY2tOb3ZhUHJvU2VydmljZS5jb21wbGV0ZS5tb2NrUmVzb2x2ZWRWYWx1ZShtb2NrUmVzcG9uc2UpO1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyBhcyBjb25zdCxcbiAgICAgICAgcmVjaXBpZW50OiAnYW5hbHlzaXMnIGFzIGNvbnN0LFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnIGFzIGNvbnN0LFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgdHlwZTogJ2FuYWx5c2lzJyxcbiAgICAgICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRzWzBdXSxcbiAgICAgICAgICAgIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyBhcyBjb25zdCxcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS0xJ1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFuYWx5c2lzQWdlbnQuaGFuZGxlTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1lc3NhZ2VUeXBlKS50b0JlKCdyZXNwb25zZScpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnNlbmRlcikudG9CZSgnYW5hbHlzaXMnKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZWNpcGllbnQpLnRvQmUoJ3N1cGVydmlzb3InKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb250ZW50KS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3IgdW5zdXBwb3J0ZWQgbWVzc2FnZSB0eXBlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InIGFzIGNvbnN0LFxuICAgICAgICByZWNpcGllbnQ6ICdhbmFseXNpcycgYXMgY29uc3QsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAndW5zdXBwb3J0ZWQnIGFzIGFueSxcbiAgICAgICAgY29udGVudDoge30sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMScsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTEnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhbmFseXNpc0FnZW50LmhhbmRsZU1lc3NhZ2UobWVzc2FnZSkpLnJlamVjdHMudG9UaHJvdygnVW5zdXBwb3J0ZWQgbWVzc2FnZSB0eXBlJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciB1bnN1cHBvcnRlZCByZXF1ZXN0IHR5cGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicgYXMgY29uc3QsXG4gICAgICAgIHJlY2lwaWVudDogJ2FuYWx5c2lzJyBhcyBjb25zdCxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyBhcyBjb25zdCxcbiAgICAgICAgY29udGVudDoge1xuICAgICAgICAgIHR5cGU6ICd1bnN1cHBvcnRlZCcsXG4gICAgICAgICAgcmVxdWVzdDoge31cbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtMSdcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGFuYWx5c2lzQWdlbnQuaGFuZGxlTWVzc2FnZShtZXNzYWdlKSkucmVqZWN0cy50b1Rocm93KCdVbnN1cHBvcnRlZCByZXF1ZXN0IHR5cGUnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Vycm9yIEhhbmRsaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIE5vdmEgUHJvIHNlcnZpY2UgZXJyb3JzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrTm92YVByb1NlcnZpY2UuY29tcGxldGUubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdOb3ZhIFBybyBzZXJ2aWNlIGVycm9yJykpO1xuXG4gICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRzWzBdXSxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnZnVuZGFtZW50YWwnIGFzIGNvbnN0LFxuICAgICAgICBwYXJhbWV0ZXJzOiB7fVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGFuYWx5c2lzQWdlbnQucHJvY2Vzc0FuYWx5c2lzUmVxdWVzdChyZXF1ZXN0KSkucmVqZWN0cy50b1Rocm93KCdOb3ZhIFBybyBzZXJ2aWNlIGVycm9yJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSB1bnN1cHBvcnRlZCBhbmFseXNpcyB0eXBlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBzYW1wbGVJbnZlc3RtZW50cyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAndW5zdXBwb3J0ZWQnIGFzIGFueSxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChhbmFseXNpc0FnZW50LnByb2Nlc3NBbmFseXNpc1JlcXVlc3QocmVxdWVzdCkpLnJlamVjdHMudG9UaHJvdygnVW5zdXBwb3J0ZWQgYW5hbHlzaXMgdHlwZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZW1wdHkgaW52ZXN0bWVudCBhcnJheXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogW10sXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYW5hbHlzaXNBZ2VudC5wcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UucmVzdWx0cykudG9IYXZlTGVuZ3RoKDApO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbmZpZGVuY2UpLnRvQmUoMCk7IC8vIE5hTiBzaG91bGQgYmUgaGFuZGxlZCBhcyAwXG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdQZXJmb3JtYW5jZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNvbXBsZXRlIGFuYWx5c2lzIHdpdGhpbiByZWFzb25hYmxlIHRpbWUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrUmVzcG9uc2U6IEJlZHJvY2tSZXNwb25zZSA9IHtcbiAgICAgICAgY29tcGxldGlvbjogJ0FuYWx5c2lzIGNvbXBsZXRlZCcsXG4gICAgICAgIG1vZGVsSWQ6ICdhbWF6b24ubm92YS1wcm8tdjE6MCcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiA1MDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogNzAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCcsXG4gICAgICAgIGZpbmlzaFJlYXNvbjogJ3N0b3AnXG4gICAgICB9O1xuXG4gICAgICBtb2NrTm92YVByb1NlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUobW9ja1Jlc3BvbnNlKTtcblxuICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IHNhbXBsZUludmVzdG1lbnRzLFxuICAgICAgICBhbmFseXNpc1R5cGU6ICdmdW5kYW1lbnRhbCcgYXMgY29uc3QsXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhbmFseXNpc0FnZW50LnByb2Nlc3NBbmFseXNpc1JlcXVlc3QocmVxdWVzdCk7XG4gICAgICBjb25zdCBlbmRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmV4ZWN1dGlvblRpbWUpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZW5kVGltZSAtIHN0YXJ0VGltZSkudG9CZUxlc3NUaGFuKDUwMDApOyAvLyBTaG91bGQgY29tcGxldGUgd2l0aGluIDUgc2Vjb25kc1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==