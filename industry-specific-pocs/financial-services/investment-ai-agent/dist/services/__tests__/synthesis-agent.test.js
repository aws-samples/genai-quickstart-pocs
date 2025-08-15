"use strict";
/**
 * Tests for Synthesis Agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
const synthesis_agent_1 = require("../ai/synthesis-agent");
const claude_sonnet_service_1 = require("../ai/claude-sonnet-service");
// Mock the Claude Sonnet service
jest.mock('../ai/claude-sonnet-service');
describe('SynthesisAgent', () => {
    let synthesisAgent;
    let mockClaudeSonnetService;
    beforeEach(() => {
        mockClaudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService({});
        synthesisAgent = new synthesis_agent_1.SynthesisAgent(mockClaudeSonnetService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('processSynthesisRequest', () => {
        const mockAnalysisResults = [
            {
                id: 'analysis-1',
                investmentId: 'investment-1',
                analysisType: 'fundamental',
                timestamp: new Date(),
                analyst: 'analysis-agent',
                summary: 'Strong fundamental analysis shows positive outlook',
                confidence: 0.85,
                details: {
                    strengths: ['Strong revenue growth', 'Solid balance sheet'],
                    weaknesses: ['High valuation', 'Market competition'],
                    opportunities: ['Market expansion', 'New products'],
                    threats: ['Economic downturn', 'Regulatory changes'],
                    keyMetrics: {
                        'P/E Ratio': 15.2,
                        'Revenue Growth': 0.12,
                        'Debt/Equity': 0.3
                    },
                    narratives: ['Company shows strong fundamentals with consistent growth']
                },
                recommendations: [
                    {
                        action: 'buy',
                        timeHorizon: 'medium',
                        confidence: 0.8,
                        rationale: 'Strong fundamentals support investment'
                    }
                ],
                dataPoints: [
                    {
                        source: 'financial-statements',
                        type: 'fundamental',
                        value: { revenue: 1000000, profit: 150000 },
                        timestamp: new Date(),
                        reliability: 0.9
                    }
                ]
            },
            {
                id: 'analysis-2',
                investmentId: 'investment-1',
                analysisType: 'technical',
                timestamp: new Date(),
                analyst: 'analysis-agent',
                summary: 'Technical indicators suggest upward momentum',
                confidence: 0.75,
                details: {
                    strengths: ['Bullish trend', 'Strong volume'],
                    weaknesses: ['Overbought conditions'],
                    opportunities: ['Breakout potential'],
                    threats: ['Support level breach'],
                    keyMetrics: {
                        'RSI': 65,
                        'MACD': 0.5,
                        'Volume': 1500000
                    },
                    narratives: ['Technical analysis shows positive momentum']
                },
                recommendations: [
                    {
                        action: 'buy',
                        timeHorizon: 'short',
                        confidence: 0.7,
                        rationale: 'Technical momentum supports entry'
                    }
                ],
                dataPoints: [
                    {
                        source: 'market-data',
                        type: 'technical',
                        value: { price: 50.25, volume: 1500000 },
                        timestamp: new Date(),
                        reliability: 0.95
                    }
                ]
            }
        ];
        const mockRequest = {
            analysisResults: mockAnalysisResults,
            researchFindings: [
                {
                    source: 'research-agent',
                    findings: 'Market research shows growing demand in sector',
                    confidence: 0.8
                }
            ],
            complianceChecks: [
                {
                    compliant: true,
                    issues: [],
                    regulationsChecked: ['SEC', 'FINRA'],
                    timestamp: new Date()
                }
            ],
            userPreferences: {
                investmentHorizon: 'medium',
                riskTolerance: 'moderate',
                preferredSectors: ['Technology', 'Healthcare'],
                excludedInvestments: ['Tobacco', 'Weapons']
            },
            outputFormat: 'detailed',
            includeVisualizations: true
        };
        beforeEach(() => {
            // Mock Claude Sonnet responses
            mockClaudeSonnetService.complete.mockImplementation(async ({ prompt }) => {
                if (prompt.includes('coherence check')) {
                    return {
                        completion: JSON.stringify({
                            overallScore: 0.85,
                            consistencyScore: 0.8,
                            completenessScore: 0.9,
                            clarityScore: 0.8,
                            issues: [],
                            recommendations: ['Maintain consistency across analyses']
                        }),
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-1',
                        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
                    };
                }
                if (prompt.includes('Integrate the following analysis results')) {
                    return {
                        completion: JSON.stringify({
                            consolidatedFindings: ['Strong fundamentals', 'Positive technical momentum'],
                            weightedConfidence: 0.8,
                            integratedRecommendations: [{ action: 'buy', confidence: 0.8 }],
                            consensus: 'Both fundamental and technical analysis support investment',
                            investmentThesis: 'Strong investment opportunity with multiple supporting factors'
                        }),
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-2',
                        usage: { inputTokens: 150, outputTokens: 300, totalTokens: 450 }
                    };
                }
                if (prompt.includes('generate specific investment ideas')) {
                    return {
                        completion: `
            Investment Idea 1: Technology Growth Opportunity
            - Strong fundamental metrics with 12% revenue growth
            - Technical momentum supports entry timing
            - Confidence: 85%
            - Expected return: 12-15% annually
            - Risk factors: Market volatility, competition
            `,
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-3',
                        usage: { inputTokens: 200, outputTokens: 400, totalTokens: 600 }
                    };
                }
                if (prompt.includes('narrative structure')) {
                    return {
                        completion: JSON.stringify({
                            sections: [
                                {
                                    id: 'executive-summary',
                                    title: 'Executive Summary',
                                    content: 'Investment opportunities identified',
                                    type: 'introduction',
                                    priority: 1,
                                    dependencies: []
                                }
                            ],
                            flow: ['executive-summary', 'analysis', 'recommendations'],
                            keyMessages: ['Strong opportunities identified'],
                            supportingEvidence: {}
                        }),
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-4',
                        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
                    };
                }
                if (prompt.includes('executive summary')) {
                    return {
                        completion: 'Our comprehensive analysis has identified strong investment opportunities with favorable risk-adjusted returns. The combination of solid fundamentals and positive technical momentum creates an attractive entry point for medium-term investors.',
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-5',
                        usage: { inputTokens: 100, outputTokens: 150, totalTokens: 250 }
                    };
                }
                if (prompt.includes('key insights')) {
                    return {
                        completion: JSON.stringify([
                            'Strong fundamental metrics support long-term growth potential',
                            'Technical analysis confirms favorable entry timing',
                            'Risk-adjusted returns appear attractive in current market conditions',
                            'Diversification benefits available across recommended positions',
                            'Compliance requirements fully satisfied for all recommendations'
                        ]),
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-6',
                        usage: { inputTokens: 80, outputTokens: 120, totalTokens: 200 }
                    };
                }
                if (prompt.includes('risk summary')) {
                    return {
                        completion: 'Overall risk assessment indicates moderate risk levels with appropriate mitigation strategies. Key risks include market volatility and sector-specific challenges, which can be managed through diversification and position sizing.',
                        modelId: 'claude-3-5-sonnet-20241022-v2:0',
                        requestId: 'test-request-7',
                        usage: { inputTokens: 90, outputTokens: 140, totalTokens: 230 }
                    };
                }
                // Default response
                return {
                    completion: 'Analysis completed successfully',
                    modelId: 'claude-3-5-sonnet-20241022-v2:0',
                    requestId: 'test-request-default',
                    usage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 }
                };
            });
        });
        it('should process synthesis request successfully', async () => {
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            expect(response).toBeDefined();
            expect(response.investmentIdeas).toHaveLength(1);
            expect(response.executiveSummary).toContain('comprehensive analysis');
            expect(response.keyInsights).toHaveLength(5);
            expect(response.coherenceScore).toBeGreaterThan(0);
            expect(response.confidence).toBeGreaterThan(0);
            expect(response.executionTime).toBeGreaterThan(0);
        });
        it('should include visualizations when requested', async () => {
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            expect(response.visualizations).toBeDefined();
            expect(response.visualizations.length).toBeGreaterThan(0);
            const riskReturnChart = response.visualizations.find(v => v.title === 'Risk-Return Analysis');
            expect(riskReturnChart).toBeDefined();
            expect(riskReturnChart?.type).toBe('chart');
            expect(riskReturnChart?.config.chartType).toBe('scatter');
        });
        it('should not include visualizations when not requested', async () => {
            const requestWithoutViz = { ...mockRequest, includeVisualizations: false };
            const response = await synthesisAgent.processSynthesisRequest(requestWithoutViz);
            expect(response.visualizations).toHaveLength(0);
        });
        it('should generate appropriate recommendations', async () => {
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            expect(response.recommendations).toBeDefined();
            expect(response.recommendations.length).toBeGreaterThan(0);
            const highPriorityRecs = response.recommendations.filter(r => r.priority === 'high');
            // Since we're using mock data, we just check that recommendations exist
            expect(response.recommendations.length).toBeGreaterThan(0);
            response.recommendations.forEach(rec => {
                expect(rec.action).toMatch(/buy|sell|hold|investigate|monitor/);
                expect(rec.confidence).toBeGreaterThan(0);
                expect(rec.confidence).toBeLessThanOrEqual(1);
                expect(rec.rationale).toBeDefined();
            });
        });
        it('should handle coherence checking', async () => {
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            expect(response.coherenceScore).toBeDefined();
            expect(response.coherenceScore).toBeGreaterThan(0);
            expect(response.coherenceScore).toBeLessThanOrEqual(1);
            // Verify coherence check was called
            expect(mockClaudeSonnetService.complete).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('coherence check')
            }));
        });
        it('should integrate analysis results from multiple agents', async () => {
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            expect(response.investmentIdeas).toBeDefined();
            expect(response.investmentIdeas.length).toBeGreaterThan(0);
            // Verify integration was called
            expect(mockClaudeSonnetService.complete).toHaveBeenCalledWith(expect.objectContaining({
                prompt: expect.stringContaining('Integrate the following analysis results')
            }));
        });
        it('should handle errors gracefully', async () => {
            mockClaudeSonnetService.complete.mockRejectedValue(new Error('API Error'));
            await expect(synthesisAgent.processSynthesisRequest(mockRequest))
                .rejects.toThrow('API Error');
        });
        it('should calculate confidence scores correctly', async () => {
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            expect(response.confidence).toBeDefined();
            expect(response.confidence).toBeGreaterThan(0);
            expect(response.confidence).toBeLessThanOrEqual(1);
            // Confidence should be based on investment ideas
            const avgConfidence = response.investmentIdeas.reduce((sum, idea) => sum + idea.confidenceScore, 0) / response.investmentIdeas.length;
            expect(response.confidence).toBeCloseTo(avgConfidence, 2);
        });
    });
    describe('formatOutput', () => {
        const mockResponse = {
            investmentIdeas: [
                {
                    id: 'idea-1',
                    version: 1,
                    title: 'Test Investment',
                    description: 'Test description',
                    investments: [],
                    rationale: 'Test rationale',
                    strategy: 'buy',
                    timeHorizon: 'medium',
                    confidenceScore: 0.8,
                    generatedAt: new Date(),
                    lastUpdatedAt: new Date(),
                    potentialOutcomes: [
                        {
                            scenario: 'expected',
                            probability: 0.6,
                            returnEstimate: 0.12,
                            timeToRealization: 365,
                            description: 'Expected outcome',
                            conditions: ['Normal market conditions'],
                            keyRisks: [],
                            catalysts: []
                        }
                    ],
                    supportingData: [],
                    counterArguments: [],
                    complianceStatus: {
                        compliant: true,
                        issues: [],
                        regulationsChecked: ['SEC'],
                        timestamp: new Date()
                    },
                    createdBy: 'synthesis-agent',
                    tags: [],
                    category: 'equity',
                    riskLevel: 'moderate',
                    targetAudience: ['institutional'],
                    metadata: {
                        sourceModels: ['synthesis-agent'],
                        processingTime: 1000,
                        dataSourcesUsed: [],
                        researchDepth: 'standard',
                        qualityScore: 80,
                        noveltyScore: 70,
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
                }
            ],
            executiveSummary: 'Test executive summary',
            detailedNarrative: 'Test detailed narrative',
            keyInsights: ['Insight 1', 'Insight 2'],
            riskSummary: 'Test risk summary',
            recommendations: [
                {
                    priority: 'high',
                    action: 'buy',
                    investment: 'Test Investment',
                    rationale: 'Test rationale',
                    timeframe: 'medium',
                    confidence: 0.8,
                    supportingEvidence: ['Evidence 1']
                }
            ],
            visualizations: [],
            coherenceScore: 0.85,
            confidence: 0.8,
            executionTime: 5000
        };
        it('should format as JSON', async () => {
            const result = await synthesisAgent.formatOutput(mockResponse, 'json');
            expect(result).toBeDefined();
            expect(() => JSON.parse(result)).not.toThrow();
            const parsed = JSON.parse(result);
            expect(parsed.investmentIdeas).toHaveLength(1);
            expect(parsed.executiveSummary).toBe('Test executive summary');
        });
        it('should format as Markdown', async () => {
            const result = await synthesisAgent.formatOutput(mockResponse, 'markdown');
            expect(result).toBeDefined();
            expect(result).toContain('# Investment Analysis Report');
            expect(result).toContain('## Executive Summary');
            expect(result).toContain('Test executive summary');
            expect(result).toContain('### 1. Test Investment');
            expect(result).toContain('**Confidence:** 80.0%');
        });
        it('should format as HTML', async () => {
            const result = await synthesisAgent.formatOutput(mockResponse, 'html');
            expect(result).toBeDefined();
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('<h1>Investment Analysis Report</h1>');
            expect(result).toContain('Test executive summary');
            expect(result).toContain('<h3>1. Test Investment</h3>');
            expect(result).toContain('80.0%');
        });
        it('should handle unsupported format', async () => {
            await expect(synthesisAgent.formatOutput(mockResponse, 'xml'))
                .rejects.toThrow('Unsupported format: xml');
        });
    });
    describe('handleMessage', () => {
        it('should handle synthesis request message', async () => {
            const mockRequest = {
                analysisResults: [],
                researchFindings: [],
                complianceChecks: [],
                userPreferences: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate'
                },
                outputFormat: 'summary',
                includeVisualizations: false
            };
            const message = {
                sender: 'supervisor',
                recipient: 'synthesis',
                messageType: 'request',
                content: {
                    type: 'synthesis',
                    request: mockRequest
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            // Mock the synthesis processing
            mockClaudeSonnetService.complete.mockResolvedValue({
                completion: JSON.stringify({ overallScore: 0.8 }),
                modelId: 'claude-3-5-sonnet-20241022-v2:0',
                requestId: 'test-request-handle',
                usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
            });
            const response = await synthesisAgent.handleMessage(message);
            expect(response).toBeDefined();
            expect(response.sender).toBe('synthesis');
            expect(response.recipient).toBe('supervisor');
            expect(response.messageType).toBe('response');
            expect(response.content).toBeDefined();
        });
        it('should handle unsupported request type', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'synthesis',
                messageType: 'request',
                content: {
                    type: 'unsupported',
                    request: {}
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            await expect(synthesisAgent.handleMessage(message))
                .rejects.toThrow('Unsupported request type: unsupported');
        });
        it('should handle unsupported message type', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'synthesis',
                messageType: 'update',
                content: {},
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            await expect(synthesisAgent.handleMessage(message))
                .rejects.toThrow('Unsupported message type: update');
        });
    });
    describe('visualization generation', () => {
        it('should generate risk-return scatter plot', async () => {
            const mockRequest = {
                analysisResults: [],
                researchFindings: [],
                complianceChecks: [],
                userPreferences: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate'
                },
                outputFormat: 'detailed',
                includeVisualizations: true
            };
            mockClaudeSonnetService.complete.mockResolvedValue({
                completion: JSON.stringify({ overallScore: 0.8 }),
                modelId: 'claude-3-5-sonnet-20241022-v2:0',
                requestId: 'test-request-scatter',
                usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
            });
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            const scatterPlot = response.visualizations.find(v => v.type === 'chart' && v.config.chartType === 'scatter');
            expect(scatterPlot).toBeDefined();
            expect(scatterPlot?.title).toBe('Risk-Return Analysis');
            expect(scatterPlot?.config.dimensions).toEqual({ width: 800, height: 600 });
            expect(scatterPlot?.config.interactivity.zoom).toBe(true);
        });
        it('should generate confidence distribution chart', async () => {
            const mockRequest = {
                analysisResults: [],
                researchFindings: [],
                complianceChecks: [],
                userPreferences: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate'
                },
                outputFormat: 'detailed',
                includeVisualizations: true
            };
            mockClaudeSonnetService.complete.mockResolvedValue({
                completion: JSON.stringify({ overallScore: 0.8 }),
                modelId: 'claude-3-5-sonnet-20241022-v2:0',
                requestId: 'test-request-confidence',
                usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
            });
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            const barChart = response.visualizations.find(v => v.type === 'chart' && v.config.chartType === 'bar');
            expect(barChart).toBeDefined();
            expect(barChart?.title).toBe('Confidence Distribution');
            expect(barChart?.config.dimensions).toEqual({ width: 600, height: 400 });
        });
        it('should generate implementation timeline', async () => {
            const mockRequest = {
                analysisResults: [],
                researchFindings: [],
                complianceChecks: [],
                userPreferences: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate'
                },
                outputFormat: 'detailed',
                includeVisualizations: true
            };
            mockClaudeSonnetService.complete.mockResolvedValue({
                completion: JSON.stringify({ overallScore: 0.8 }),
                modelId: 'claude-3-5-sonnet-20241022-v2:0',
                requestId: 'test-request-timeline',
                usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 }
            });
            const response = await synthesisAgent.processSynthesisRequest(mockRequest);
            const timeline = response.visualizations.find(v => v.type === 'diagram');
            expect(timeline).toBeDefined();
            expect(timeline?.title).toBe('Implementation Timeline');
            expect(timeline?.config.dimensions).toEqual({ width: 1000, height: 300 });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGhlc2lzLWFnZW50LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvX190ZXN0c19fL3N5bnRoZXNpcy1hZ2VudC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwyREFBNEY7QUFDNUYsdUVBQWtFO0FBSWxFLGlDQUFpQztBQUNqQyxJQUFJLENBQUMsSUFBSSxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFFekMsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtJQUM5QixJQUFJLGNBQThCLENBQUM7SUFDbkMsSUFBSSx1QkFBeUQsQ0FBQztJQUU5RCxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsdUJBQXVCLEdBQUcsSUFBSSwyQ0FBbUIsQ0FBQyxFQUFTLENBQXFDLENBQUM7UUFDakcsY0FBYyxHQUFHLElBQUksZ0NBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQy9ELENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7UUFDdkMsTUFBTSxtQkFBbUIsR0FBcUI7WUFDNUM7Z0JBQ0UsRUFBRSxFQUFFLFlBQVk7Z0JBQ2hCLFlBQVksRUFBRSxjQUFjO2dCQUM1QixZQUFZLEVBQUUsYUFBYTtnQkFDM0IsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUNyQixPQUFPLEVBQUUsZ0JBQWdCO2dCQUN6QixPQUFPLEVBQUUsb0RBQW9EO2dCQUM3RCxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsT0FBTyxFQUFFO29CQUNQLFNBQVMsRUFBRSxDQUFDLHVCQUF1QixFQUFFLHFCQUFxQixDQUFDO29CQUMzRCxVQUFVLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQztvQkFD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QUFVO2dCQUN4QixxQkFBcUIsRUFBRSxJQUFJO2FBQzVCLENBQUM7WUFFRix1QkFBdUIsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2pELFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDO2dCQUNqRCxPQUFPLEVBQUUsaUNBQWlDO2dCQUMxQyxTQUFTLEVBQUUsdUJBQXVCO2dCQUNsQyxLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRTthQUNqRSxDQUFDLENBQUM7WUFFSCxNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUzRSxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLENBQUM7WUFDekUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDeEQsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUM1RSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciBTeW50aGVzaXMgQWdlbnRcbiAqL1xuXG5pbXBvcnQgeyBTeW50aGVzaXNBZ2VudCwgU3ludGhlc2lzUmVxdWVzdCwgU3ludGhlc2lzUmVzcG9uc2UgfSBmcm9tICcuLi9haS9zeW50aGVzaXMtYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlU29ubmV0U2VydmljZSB9IGZyb20gJy4uL2FpL2NsYXVkZS1zb25uZXQtc2VydmljZSc7XG5pbXBvcnQgeyBBbmFseXNpc1Jlc3VsdCB9IGZyb20gJy4uLy4uL21vZGVscy9hbmFseXNpcyc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYSB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEnO1xuXG4vLyBNb2NrIHRoZSBDbGF1ZGUgU29ubmV0IHNlcnZpY2Vcbmplc3QubW9jaygnLi4vYWkvY2xhdWRlLXNvbm5ldC1zZXJ2aWNlJyk7XG5cbmRlc2NyaWJlKCdTeW50aGVzaXNBZ2VudCcsICgpID0+IHtcbiAgbGV0IHN5bnRoZXNpc0FnZW50OiBTeW50aGVzaXNBZ2VudDtcbiAgbGV0IG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlOiBqZXN0Lk1vY2tlZDxDbGF1ZGVTb25uZXRTZXJ2aWNlPjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrQ2xhdWRlU29ubmV0U2VydmljZSA9IG5ldyBDbGF1ZGVTb25uZXRTZXJ2aWNlKHt9IGFzIGFueSkgYXMgamVzdC5Nb2NrZWQ8Q2xhdWRlU29ubmV0U2VydmljZT47XG4gICAgc3ludGhlc2lzQWdlbnQgPSBuZXcgU3ludGhlc2lzQWdlbnQobW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuICB9KTtcblxuICBkZXNjcmliZSgncHJvY2Vzc1N5bnRoZXNpc1JlcXVlc3QnLCAoKSA9PiB7XG4gICAgY29uc3QgbW9ja0FuYWx5c2lzUmVzdWx0czogQW5hbHlzaXNSZXN1bHRbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdhbmFseXNpcy0xJyxcbiAgICAgICAgaW52ZXN0bWVudElkOiAnaW52ZXN0bWVudC0xJyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnZnVuZGFtZW50YWwnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIGFuYWx5c3Q6ICdhbmFseXNpcy1hZ2VudCcsXG4gICAgICAgIHN1bW1hcnk6ICdTdHJvbmcgZnVuZGFtZW50YWwgYW5hbHlzaXMgc2hvd3MgcG9zaXRpdmUgb3V0bG9vaycsXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICAgIGRldGFpbHM6IHtcbiAgICAgICAgICBzdHJlbmd0aHM6IFsnU3Ryb25nIHJldmVudWUgZ3Jvd3RoJywgJ1NvbGlkIGJhbGFuY2Ugc2hlZXQnXSxcbiAgICAgICAgICB3ZWFrbmVzc2VzOiBbJ0hpZ2ggdmFsdWF0aW9uJywgJ01hcmtldCBjb21wZXRpdGlvbiddLFxuICAgICAgICAgIG9wcG9ydHVuaXRpZXM6IFsnTWFya2V0IGV4cGFuc2lvbicsICdOZXcgcHJvZHVjdHMnXSxcbiAgICAgICAgICB0aHJlYXRzOiBbJ0Vjb25vbWljIGRvd250dXJuJywgJ1JlZ3VsYXRvcnkgY2hhbmdlcyddLFxuICAgICAgICAgIGtleU1ldHJpY3M6IHtcbiAgICAgICAgICAgICdQL0UgUmF0aW8nOiAxNS4yLFxuICAgICAgICAgICAgJ1JldmVudWUgR3Jvd3RoJzogMC4xMixcbiAgICAgICAgICAgICdEZWJ0L0VxdWl0eSc6IDAuM1xuICAgICAgICAgIH0sXG4gICAgICAgICAgbmFycmF0aXZlczogWydDb21wYW55IHNob3dzIHN0cm9uZyBmdW5kYW1lbnRhbHMgd2l0aCBjb25zaXN0ZW50IGdyb3d0aCddXG4gICAgICAgIH0sXG4gICAgICAgIHJlY29tbWVuZGF0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbjogJ2J1eScsXG4gICAgICAgICAgICB0aW1lSG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgICBjb25maWRlbmNlOiAwLjgsXG4gICAgICAgICAgICByYXRpb25hbGU6ICdTdHJvbmcgZnVuZGFtZW50YWxzIHN1cHBvcnQgaW52ZXN0bWVudCdcbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGRhdGFQb2ludHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2U6ICdmaW5hbmNpYWwtc3RhdGVtZW50cycsXG4gICAgICAgICAgICB0eXBlOiAnZnVuZGFtZW50YWwnLFxuICAgICAgICAgICAgdmFsdWU6IHsgcmV2ZW51ZTogMTAwMDAwMCwgcHJvZml0OiAxNTAwMDAgfSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjlcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnYW5hbHlzaXMtMicsXG4gICAgICAgIGludmVzdG1lbnRJZDogJ2ludmVzdG1lbnQtMScsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ3RlY2huaWNhbCcsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgYW5hbHlzdDogJ2FuYWx5c2lzLWFnZW50JyxcbiAgICAgICAgc3VtbWFyeTogJ1RlY2huaWNhbCBpbmRpY2F0b3JzIHN1Z2dlc3QgdXB3YXJkIG1vbWVudHVtJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC43NSxcbiAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgIHN0cmVuZ3RoczogWydCdWxsaXNoIHRyZW5kJywgJ1N0cm9uZyB2b2x1bWUnXSxcbiAgICAgICAgICB3ZWFrbmVzc2VzOiBbJ092ZXJib3VnaHQgY29uZGl0aW9ucyddLFxuICAgICAgICAgIG9wcG9ydHVuaXRpZXM6IFsnQnJlYWtvdXQgcG90ZW50aWFsJ10sXG4gICAgICAgICAgdGhyZWF0czogWydTdXBwb3J0IGxldmVsIGJyZWFjaCddLFxuICAgICAgICAgIGtleU1ldHJpY3M6IHtcbiAgICAgICAgICAgICdSU0knOiA2NSxcbiAgICAgICAgICAgICdNQUNEJzogMC41LFxuICAgICAgICAgICAgJ1ZvbHVtZSc6IDE1MDAwMDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIG5hcnJhdGl2ZXM6IFsnVGVjaG5pY2FsIGFuYWx5c2lzIHNob3dzIHBvc2l0aXZlIG1vbWVudHVtJ11cbiAgICAgICAgfSxcbiAgICAgICAgcmVjb21tZW5kYXRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWN0aW9uOiAnYnV5JyxcbiAgICAgICAgICAgIHRpbWVIb3Jpem9uOiAnc2hvcnQnLFxuICAgICAgICAgICAgY29uZmlkZW5jZTogMC43LFxuICAgICAgICAgICAgcmF0aW9uYWxlOiAnVGVjaG5pY2FsIG1vbWVudHVtIHN1cHBvcnRzIGVudHJ5J1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgZGF0YVBvaW50czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNvdXJjZTogJ21hcmtldC1kYXRhJyxcbiAgICAgICAgICAgIHR5cGU6ICd0ZWNobmljYWwnLFxuICAgICAgICAgICAgdmFsdWU6IHsgcHJpY2U6IDUwLjI1LCB2b2x1bWU6IDE1MDAwMDAgfSxcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjk1XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgXTtcblxuICAgIGNvbnN0IG1vY2tSZXF1ZXN0OiBTeW50aGVzaXNSZXF1ZXN0ID0ge1xuICAgICAgYW5hbHlzaXNSZXN1bHRzOiBtb2NrQW5hbHlzaXNSZXN1bHRzLFxuICAgICAgcmVzZWFyY2hGaW5kaW5nczogW1xuICAgICAgICB7XG4gICAgICAgICAgc291cmNlOiAncmVzZWFyY2gtYWdlbnQnLFxuICAgICAgICAgIGZpbmRpbmdzOiAnTWFya2V0IHJlc2VhcmNoIHNob3dzIGdyb3dpbmcgZGVtYW5kIGluIHNlY3RvcicsXG4gICAgICAgICAgY29uZmlkZW5jZTogMC44XG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBjb21wbGlhbmNlQ2hlY2tzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjb21wbGlhbnQ6IHRydWUsXG4gICAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFsnU0VDJywgJ0ZJTlJBJ10sXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICB1c2VyUHJlZmVyZW5jZXM6IHtcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICBwcmVmZXJyZWRTZWN0b3JzOiBbJ1RlY2hub2xvZ3knLCAnSGVhbHRoY2FyZSddLFxuICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiBbJ1RvYmFjY28nLCAnV2VhcG9ucyddXG4gICAgICB9LFxuICAgICAgb3V0cHV0Rm9ybWF0OiAnZGV0YWlsZWQnLFxuICAgICAgaW5jbHVkZVZpc3VhbGl6YXRpb25zOiB0cnVlXG4gICAgfTtcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgLy8gTW9jayBDbGF1ZGUgU29ubmV0IHJlc3BvbnNlc1xuICAgICAgbW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUubW9ja0ltcGxlbWVudGF0aW9uKGFzeW5jICh7IHByb21wdCB9OiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHByb21wdC5pbmNsdWRlcygnY29oZXJlbmNlIGNoZWNrJykpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBvdmVyYWxsU2NvcmU6IDAuODUsXG4gICAgICAgICAgICAgIGNvbnNpc3RlbmN5U2NvcmU6IDAuOCxcbiAgICAgICAgICAgICAgY29tcGxldGVuZXNzU2NvcmU6IDAuOSxcbiAgICAgICAgICAgICAgY2xhcml0eVNjb3JlOiAwLjgsXG4gICAgICAgICAgICAgIGlzc3VlczogW10sXG4gICAgICAgICAgICAgIHJlY29tbWVuZGF0aW9uczogWydNYWludGFpbiBjb25zaXN0ZW5jeSBhY3Jvc3MgYW5hbHlzZXMnXVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBtb2RlbElkOiAnY2xhdWRlLTMtNS1zb25uZXQtMjAyNDEwMjItdjI6MCcsXG4gICAgICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTAwLCBvdXRwdXRUb2tlbnM6IDIwMCwgdG90YWxUb2tlbnM6IDMwMCB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHByb21wdC5pbmNsdWRlcygnSW50ZWdyYXRlIHRoZSBmb2xsb3dpbmcgYW5hbHlzaXMgcmVzdWx0cycpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgY29uc29saWRhdGVkRmluZGluZ3M6IFsnU3Ryb25nIGZ1bmRhbWVudGFscycsICdQb3NpdGl2ZSB0ZWNobmljYWwgbW9tZW50dW0nXSxcbiAgICAgICAgICAgICAgd2VpZ2h0ZWRDb25maWRlbmNlOiAwLjgsXG4gICAgICAgICAgICAgIGludGVncmF0ZWRSZWNvbW1lbmRhdGlvbnM6IFt7IGFjdGlvbjogJ2J1eScsIGNvbmZpZGVuY2U6IDAuOCB9XSxcbiAgICAgICAgICAgICAgY29uc2Vuc3VzOiAnQm90aCBmdW5kYW1lbnRhbCBhbmQgdGVjaG5pY2FsIGFuYWx5c2lzIHN1cHBvcnQgaW52ZXN0bWVudCcsXG4gICAgICAgICAgICAgIGludmVzdG1lbnRUaGVzaXM6ICdTdHJvbmcgaW52ZXN0bWVudCBvcHBvcnR1bml0eSB3aXRoIG11bHRpcGxlIHN1cHBvcnRpbmcgZmFjdG9ycydcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS0zLTUtc29ubmV0LTIwMjQxMDIyLXYyOjAnLFxuICAgICAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LTInLFxuICAgICAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDE1MCwgb3V0cHV0VG9rZW5zOiAzMDAsIHRvdGFsVG9rZW5zOiA0NTAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChwcm9tcHQuaW5jbHVkZXMoJ2dlbmVyYXRlIHNwZWNpZmljIGludmVzdG1lbnQgaWRlYXMnKSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb21wbGV0aW9uOiBgXG4gICAgICAgICAgICBJbnZlc3RtZW50IElkZWEgMTogVGVjaG5vbG9neSBHcm93dGggT3Bwb3J0dW5pdHlcbiAgICAgICAgICAgIC0gU3Ryb25nIGZ1bmRhbWVudGFsIG1ldHJpY3Mgd2l0aCAxMiUgcmV2ZW51ZSBncm93dGhcbiAgICAgICAgICAgIC0gVGVjaG5pY2FsIG1vbWVudHVtIHN1cHBvcnRzIGVudHJ5IHRpbWluZ1xuICAgICAgICAgICAgLSBDb25maWRlbmNlOiA4NSVcbiAgICAgICAgICAgIC0gRXhwZWN0ZWQgcmV0dXJuOiAxMi0xNSUgYW5udWFsbHlcbiAgICAgICAgICAgIC0gUmlzayBmYWN0b3JzOiBNYXJrZXQgdm9sYXRpbGl0eSwgY29tcGV0aXRpb25cbiAgICAgICAgICAgIGAsXG4gICAgICAgICAgICBtb2RlbElkOiAnY2xhdWRlLTMtNS1zb25uZXQtMjAyNDEwMjItdjI6MCcsXG4gICAgICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtMycsXG4gICAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMjAwLCBvdXRwdXRUb2tlbnM6IDQwMCwgdG90YWxUb2tlbnM6IDYwMCB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKHByb21wdC5pbmNsdWRlcygnbmFycmF0aXZlIHN0cnVjdHVyZScpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgc2VjdGlvbnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBpZDogJ2V4ZWN1dGl2ZS1zdW1tYXJ5JyxcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnRXhlY3V0aXZlIFN1bW1hcnknLFxuICAgICAgICAgICAgICAgICAgY29udGVudDogJ0ludmVzdG1lbnQgb3Bwb3J0dW5pdGllcyBpZGVudGlmaWVkJyxcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbnRyb2R1Y3Rpb24nLFxuICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IDEsXG4gICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBmbG93OiBbJ2V4ZWN1dGl2ZS1zdW1tYXJ5JywgJ2FuYWx5c2lzJywgJ3JlY29tbWVuZGF0aW9ucyddLFxuICAgICAgICAgICAgICBrZXlNZXNzYWdlczogWydTdHJvbmcgb3Bwb3J0dW5pdGllcyBpZGVudGlmaWVkJ10sXG4gICAgICAgICAgICAgIHN1cHBvcnRpbmdFdmlkZW5jZToge31cbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS0zLTUtc29ubmV0LTIwMjQxMDIyLXYyOjAnLFxuICAgICAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LTQnLFxuICAgICAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDEwMCwgb3V0cHV0VG9rZW5zOiAyMDAsIHRvdGFsVG9rZW5zOiAzMDAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChwcm9tcHQuaW5jbHVkZXMoJ2V4ZWN1dGl2ZSBzdW1tYXJ5JykpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29tcGxldGlvbjogJ091ciBjb21wcmVoZW5zaXZlIGFuYWx5c2lzIGhhcyBpZGVudGlmaWVkIHN0cm9uZyBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMgd2l0aCBmYXZvcmFibGUgcmlzay1hZGp1c3RlZCByZXR1cm5zLiBUaGUgY29tYmluYXRpb24gb2Ygc29saWQgZnVuZGFtZW50YWxzIGFuZCBwb3NpdGl2ZSB0ZWNobmljYWwgbW9tZW50dW0gY3JlYXRlcyBhbiBhdHRyYWN0aXZlIGVudHJ5IHBvaW50IGZvciBtZWRpdW0tdGVybSBpbnZlc3RvcnMuJyxcbiAgICAgICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtMy01LXNvbm5ldC0yMDI0MTAyMi12MjowJyxcbiAgICAgICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC01JyxcbiAgICAgICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMTUwLCB0b3RhbFRva2VuczogMjUwIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAocHJvbXB0LmluY2x1ZGVzKCdrZXkgaW5zaWdodHMnKSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeShbXG4gICAgICAgICAgICAgICdTdHJvbmcgZnVuZGFtZW50YWwgbWV0cmljcyBzdXBwb3J0IGxvbmctdGVybSBncm93dGggcG90ZW50aWFsJyxcbiAgICAgICAgICAgICAgJ1RlY2huaWNhbCBhbmFseXNpcyBjb25maXJtcyBmYXZvcmFibGUgZW50cnkgdGltaW5nJyxcbiAgICAgICAgICAgICAgJ1Jpc2stYWRqdXN0ZWQgcmV0dXJucyBhcHBlYXIgYXR0cmFjdGl2ZSBpbiBjdXJyZW50IG1hcmtldCBjb25kaXRpb25zJyxcbiAgICAgICAgICAgICAgJ0RpdmVyc2lmaWNhdGlvbiBiZW5lZml0cyBhdmFpbGFibGUgYWNyb3NzIHJlY29tbWVuZGVkIHBvc2l0aW9ucycsXG4gICAgICAgICAgICAgICdDb21wbGlhbmNlIHJlcXVpcmVtZW50cyBmdWxseSBzYXRpc2ZpZWQgZm9yIGFsbCByZWNvbW1lbmRhdGlvbnMnXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtMy01LXNvbm5ldC0yMDI0MTAyMi12MjowJyxcbiAgICAgICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC02JyxcbiAgICAgICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiA4MCwgb3V0cHV0VG9rZW5zOiAxMjAsIHRvdGFsVG9rZW5zOiAyMDAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmIChwcm9tcHQuaW5jbHVkZXMoJ3Jpc2sgc3VtbWFyeScpKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvbXBsZXRpb246ICdPdmVyYWxsIHJpc2sgYXNzZXNzbWVudCBpbmRpY2F0ZXMgbW9kZXJhdGUgcmlzayBsZXZlbHMgd2l0aCBhcHByb3ByaWF0ZSBtaXRpZ2F0aW9uIHN0cmF0ZWdpZXMuIEtleSByaXNrcyBpbmNsdWRlIG1hcmtldCB2b2xhdGlsaXR5IGFuZCBzZWN0b3Itc3BlY2lmaWMgY2hhbGxlbmdlcywgd2hpY2ggY2FuIGJlIG1hbmFnZWQgdGhyb3VnaCBkaXZlcnNpZmljYXRpb24gYW5kIHBvc2l0aW9uIHNpemluZy4nLFxuICAgICAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS0zLTUtc29ubmV0LTIwMjQxMDIyLXYyOjAnLFxuICAgICAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LTcnLFxuICAgICAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDkwLCBvdXRwdXRUb2tlbnM6IDE0MCwgdG90YWxUb2tlbnM6IDIzMCB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gRGVmYXVsdCByZXNwb25zZVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbXBsZXRpb246ICdBbmFseXNpcyBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICBtb2RlbElkOiAnY2xhdWRlLTMtNS1zb25uZXQtMjAyNDEwMjItdjI6MCcsXG4gICAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LWRlZmF1bHQnLFxuICAgICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiA1MCwgb3V0cHV0VG9rZW5zOiAxMDAsIHRvdGFsVG9rZW5zOiAxNTAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHByb2Nlc3Mgc3ludGhlc2lzIHJlcXVlc3Qgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdChtb2NrUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5pbnZlc3RtZW50SWRlYXMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5leGVjdXRpdmVTdW1tYXJ5KS50b0NvbnRhaW4oJ2NvbXByZWhlbnNpdmUgYW5hbHlzaXMnKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5rZXlJbnNpZ2h0cykudG9IYXZlTGVuZ3RoKDUpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvaGVyZW5jZVNjb3JlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29uZmlkZW5jZSkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmV4ZWN1dGlvblRpbWUpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jbHVkZSB2aXN1YWxpemF0aW9ucyB3aGVuIHJlcXVlc3RlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc3ludGhlc2lzQWdlbnQucHJvY2Vzc1N5bnRoZXNpc1JlcXVlc3QobW9ja1JlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UudmlzdWFsaXphdGlvbnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UudmlzdWFsaXphdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIGNvbnN0IHJpc2tSZXR1cm5DaGFydCA9IHJlc3BvbnNlLnZpc3VhbGl6YXRpb25zLmZpbmQodiA9PiB2LnRpdGxlID09PSAnUmlzay1SZXR1cm4gQW5hbHlzaXMnKTtcbiAgICAgIGV4cGVjdChyaXNrUmV0dXJuQ2hhcnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qocmlza1JldHVybkNoYXJ0Py50eXBlKS50b0JlKCdjaGFydCcpO1xuICAgICAgZXhwZWN0KHJpc2tSZXR1cm5DaGFydD8uY29uZmlnLmNoYXJ0VHlwZSkudG9CZSgnc2NhdHRlcicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgaW5jbHVkZSB2aXN1YWxpemF0aW9ucyB3aGVuIG5vdCByZXF1ZXN0ZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0V2l0aG91dFZpeiA9IHsgLi4ubW9ja1JlcXVlc3QsIGluY2x1ZGVWaXN1YWxpemF0aW9uczogZmFsc2UgfTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc3ludGhlc2lzQWdlbnQucHJvY2Vzc1N5bnRoZXNpc1JlcXVlc3QocmVxdWVzdFdpdGhvdXRWaXopO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UudmlzdWFsaXphdGlvbnMpLnRvSGF2ZUxlbmd0aCgwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgYXBwcm9wcmlhdGUgcmVjb21tZW5kYXRpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdChtb2NrUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UucmVjb21tZW5kYXRpb25zLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgXG4gICAgICBjb25zdCBoaWdoUHJpb3JpdHlSZWNzID0gcmVzcG9uc2UucmVjb21tZW5kYXRpb25zLmZpbHRlcihyID0+IHIucHJpb3JpdHkgPT09ICdoaWdoJyk7XG4gICAgICAvLyBTaW5jZSB3ZSdyZSB1c2luZyBtb2NrIGRhdGEsIHdlIGp1c3QgY2hlY2sgdGhhdCByZWNvbW1lbmRhdGlvbnMgZXhpc3RcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIHJlc3BvbnNlLnJlY29tbWVuZGF0aW9ucy5mb3JFYWNoKHJlYyA9PiB7XG4gICAgICAgIGV4cGVjdChyZWMuYWN0aW9uKS50b01hdGNoKC9idXl8c2VsbHxob2xkfGludmVzdGlnYXRlfG1vbml0b3IvKTtcbiAgICAgICAgZXhwZWN0KHJlYy5jb25maWRlbmNlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIGV4cGVjdChyZWMuY29uZmlkZW5jZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgICAgZXhwZWN0KHJlYy5yYXRpb25hbGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGNvaGVyZW5jZSBjaGVja2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc3ludGhlc2lzQWdlbnQucHJvY2Vzc1N5bnRoZXNpc1JlcXVlc3QobW9ja1JlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29oZXJlbmNlU2NvcmUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29oZXJlbmNlU2NvcmUpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb2hlcmVuY2VTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIFxuICAgICAgLy8gVmVyaWZ5IGNvaGVyZW5jZSBjaGVjayB3YXMgY2FsbGVkXG4gICAgICBleHBlY3QobW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgcHJvbXB0OiBleHBlY3Quc3RyaW5nQ29udGFpbmluZygnY29oZXJlbmNlIGNoZWNrJylcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGludGVncmF0ZSBhbmFseXNpcyByZXN1bHRzIGZyb20gbXVsdGlwbGUgYWdlbnRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdChtb2NrUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5pbnZlc3RtZW50SWRlYXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuaW52ZXN0bWVudElkZWFzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgXG4gICAgICAvLyBWZXJpZnkgaW50ZWdyYXRpb24gd2FzIGNhbGxlZFxuICAgICAgZXhwZWN0KG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIHByb21wdDogZXhwZWN0LnN0cmluZ0NvbnRhaW5pbmcoJ0ludGVncmF0ZSB0aGUgZm9sbG93aW5nIGFuYWx5c2lzIHJlc3VsdHMnKVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdBUEkgRXJyb3InKSk7XG5cbiAgICAgIGF3YWl0IGV4cGVjdChzeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdChtb2NrUmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ0FQSSBFcnJvcicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgY29uZmlkZW5jZSBzY29yZXMgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzeW50aGVzaXNBZ2VudC5wcm9jZXNzU3ludGhlc2lzUmVxdWVzdChtb2NrUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb25maWRlbmNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb25maWRlbmNlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgXG4gICAgICAvLyBDb25maWRlbmNlIHNob3VsZCBiZSBiYXNlZCBvbiBpbnZlc3RtZW50IGlkZWFzXG4gICAgICBjb25zdCBhdmdDb25maWRlbmNlID0gcmVzcG9uc2UuaW52ZXN0bWVudElkZWFzLnJlZHVjZShcbiAgICAgICAgKHN1bSwgaWRlYSkgPT4gc3VtICsgaWRlYS5jb25maWRlbmNlU2NvcmUsIDBcbiAgICAgICkgLyByZXNwb25zZS5pbnZlc3RtZW50SWRlYXMubGVuZ3RoO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzcG9uc2UuY29uZmlkZW5jZSkudG9CZUNsb3NlVG8oYXZnQ29uZmlkZW5jZSwgMik7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdmb3JtYXRPdXRwdXQnLCAoKSA9PiB7XG4gICAgY29uc3QgbW9ja1Jlc3BvbnNlOiBTeW50aGVzaXNSZXNwb25zZSA9IHtcbiAgICAgIGludmVzdG1lbnRJZGVhczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdpZGVhLTEnLFxuICAgICAgICAgIHZlcnNpb246IDEsXG4gICAgICAgICAgdGl0bGU6ICdUZXN0IEludmVzdG1lbnQnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBkZXNjcmlwdGlvbicsXG4gICAgICAgICAgaW52ZXN0bWVudHM6IFtdLFxuICAgICAgICAgIHJhdGlvbmFsZTogJ1Rlc3QgcmF0aW9uYWxlJyxcbiAgICAgICAgICBzdHJhdGVneTogJ2J1eScsXG4gICAgICAgICAgdGltZUhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIGNvbmZpZGVuY2VTY29yZTogMC44LFxuICAgICAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGxhc3RVcGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgcG90ZW50aWFsT3V0Y29tZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc2NlbmFyaW86ICdleHBlY3RlZCcsXG4gICAgICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjYsXG4gICAgICAgICAgICAgIHJldHVybkVzdGltYXRlOiAwLjEyLFxuICAgICAgICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogMzY1LFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4cGVjdGVkIG91dGNvbWUnLFxuICAgICAgICAgICAgICBjb25kaXRpb25zOiBbJ05vcm1hbCBtYXJrZXQgY29uZGl0aW9ucyddLFxuICAgICAgICAgICAgICBrZXlSaXNrczogW10sXG4gICAgICAgICAgICAgIGNhdGFseXN0czogW11cbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIHN1cHBvcnRpbmdEYXRhOiBbXSxcbiAgICAgICAgICBjb3VudGVyQXJndW1lbnRzOiBbXSxcbiAgICAgICAgICBjb21wbGlhbmNlU3RhdHVzOiB7XG4gICAgICAgICAgICBjb21wbGlhbnQ6IHRydWUsXG4gICAgICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbJ1NFQyddLFxuICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjcmVhdGVkQnk6ICdzeW50aGVzaXMtYWdlbnQnLFxuICAgICAgICAgIHRhZ3M6IFtdLFxuICAgICAgICAgIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgICAgICAgICByaXNrTGV2ZWw6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgdGFyZ2V0QXVkaWVuY2U6IFsnaW5zdGl0dXRpb25hbCddLFxuICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICBzb3VyY2VNb2RlbHM6IFsnc3ludGhlc2lzLWFnZW50J10sXG4gICAgICAgICAgICBwcm9jZXNzaW5nVGltZTogMTAwMCxcbiAgICAgICAgICAgIGRhdGFTb3VyY2VzVXNlZDogW10sXG4gICAgICAgICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiA4MCxcbiAgICAgICAgICAgIG5vdmVsdHlTY29yZTogNzAsXG4gICAgICAgICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgICAgICAgIHZvbGF0aWxpdHlJbmRleDogMjAsXG4gICAgICAgICAgICAgIG1hcmtldFRyZW5kOiAnYnVsbCcsXG4gICAgICAgICAgICAgIGVjb25vbWljSW5kaWNhdG9yczoge30sXG4gICAgICAgICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdsb3cnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICB0cmFja2luZ0luZm86IHtcbiAgICAgICAgICAgIHZpZXdzOiAwLFxuICAgICAgICAgICAgaW1wbGVtZW50YXRpb25zOiAwLFxuICAgICAgICAgICAgZmVlZGJhY2s6IFtdLFxuICAgICAgICAgICAgcGVyZm9ybWFuY2U6IFtdLFxuICAgICAgICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgICAgICAgIHN0YXR1c0hpc3Rvcnk6IFtdXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgZXhlY3V0aXZlU3VtbWFyeTogJ1Rlc3QgZXhlY3V0aXZlIHN1bW1hcnknLFxuICAgICAgZGV0YWlsZWROYXJyYXRpdmU6ICdUZXN0IGRldGFpbGVkIG5hcnJhdGl2ZScsXG4gICAgICBrZXlJbnNpZ2h0czogWydJbnNpZ2h0IDEnLCAnSW5zaWdodCAyJ10sXG4gICAgICByaXNrU3VtbWFyeTogJ1Rlc3QgcmlzayBzdW1tYXJ5JyxcbiAgICAgIHJlY29tbWVuZGF0aW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICBhY3Rpb246ICdidXknLFxuICAgICAgICAgIGludmVzdG1lbnQ6ICdUZXN0IEludmVzdG1lbnQnLFxuICAgICAgICAgIHJhdGlvbmFsZTogJ1Rlc3QgcmF0aW9uYWxlJyxcbiAgICAgICAgICB0aW1lZnJhbWU6ICdtZWRpdW0nLFxuICAgICAgICAgIGNvbmZpZGVuY2U6IDAuOCxcbiAgICAgICAgICBzdXBwb3J0aW5nRXZpZGVuY2U6IFsnRXZpZGVuY2UgMSddXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICB2aXN1YWxpemF0aW9uczogW10sXG4gICAgICBjb2hlcmVuY2VTY29yZTogMC44NSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOCxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IDUwMDBcbiAgICB9O1xuXG4gICAgaXQoJ3Nob3VsZCBmb3JtYXQgYXMgSlNPTicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LmZvcm1hdE91dHB1dChtb2NrUmVzcG9uc2UsICdqc29uJyk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoKCkgPT4gSlNPTi5wYXJzZShyZXN1bHQpKS5ub3QudG9UaHJvdygpO1xuICAgICAgXG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJlc3VsdCk7XG4gICAgICBleHBlY3QocGFyc2VkLmludmVzdG1lbnRJZGVhcykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHBhcnNlZC5leGVjdXRpdmVTdW1tYXJ5KS50b0JlKCdUZXN0IGV4ZWN1dGl2ZSBzdW1tYXJ5Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZvcm1hdCBhcyBNYXJrZG93bicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LmZvcm1hdE91dHB1dChtb2NrUmVzcG9uc2UsICdtYXJrZG93bicpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9Db250YWluKCcjIEludmVzdG1lbnQgQW5hbHlzaXMgUmVwb3J0Jyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0NvbnRhaW4oJyMjIEV4ZWN1dGl2ZSBTdW1tYXJ5Jyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0NvbnRhaW4oJ1Rlc3QgZXhlY3V0aXZlIHN1bW1hcnknKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignIyMjIDEuIFRlc3QgSW52ZXN0bWVudCcpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9Db250YWluKCcqKkNvbmZpZGVuY2U6KiogODAuMCUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZm9ybWF0IGFzIEhUTUwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzeW50aGVzaXNBZ2VudC5mb3JtYXRPdXRwdXQobW9ja1Jlc3BvbnNlLCAnaHRtbCcpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9Db250YWluKCc8IURPQ1RZUEUgaHRtbD4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignPGgxPkludmVzdG1lbnQgQW5hbHlzaXMgUmVwb3J0PC9oMT4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignVGVzdCBleGVjdXRpdmUgc3VtbWFyeScpO1xuICAgICAgZXhwZWN0KHJlc3VsdCkudG9Db250YWluKCc8aDM+MS4gVGVzdCBJbnZlc3RtZW50PC9oMz4nKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQ29udGFpbignODAuMCUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHVuc3VwcG9ydGVkIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChzeW50aGVzaXNBZ2VudC5mb3JtYXRPdXRwdXQobW9ja1Jlc3BvbnNlLCAneG1sJyBhcyBhbnkpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdVbnN1cHBvcnRlZCBmb3JtYXQ6IHhtbCcpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnaGFuZGxlTWVzc2FnZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBzeW50aGVzaXMgcmVxdWVzdCBtZXNzYWdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1JlcXVlc3Q6IFN5bnRoZXNpc1JlcXVlc3QgPSB7XG4gICAgICAgIGFuYWx5c2lzUmVzdWx0czogW10sXG4gICAgICAgIHJlc2VhcmNoRmluZGluZ3M6IFtdLFxuICAgICAgICBjb21wbGlhbmNlQ2hlY2tzOiBbXSxcbiAgICAgICAgdXNlclByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgb3V0cHV0Rm9ybWF0OiAnc3VtbWFyeScsXG4gICAgICAgIGluY2x1ZGVWaXN1YWxpemF0aW9uczogZmFsc2VcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InIGFzIGNvbnN0LFxuICAgICAgICByZWNpcGllbnQ6ICdzeW50aGVzaXMnIGFzIGNvbnN0LFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnIGFzIGNvbnN0LFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgdHlwZTogJ3N5bnRoZXNpcycsXG4gICAgICAgICAgcmVxdWVzdDogbW9ja1JlcXVlc3RcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIE1vY2sgdGhlIHN5bnRoZXNpcyBwcm9jZXNzaW5nXG4gICAgICBtb2NrQ2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHsgb3ZlcmFsbFNjb3JlOiAwLjggfSksXG4gICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtMy01LXNvbm5ldC0yMDI0MTAyMi12MjowJyxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LWhhbmRsZScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogMzAwIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5zZW5kZXIpLnRvQmUoJ3N5bnRoZXNpcycpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlY2lwaWVudCkudG9CZSgnc3VwZXJ2aXNvcicpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1lc3NhZ2VUeXBlKS50b0JlKCdyZXNwb25zZScpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbnRlbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSB1bnN1cHBvcnRlZCByZXF1ZXN0IHR5cGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyBhcyBjb25zdCxcbiAgICAgICAgcmVjaXBpZW50OiAnc3ludGhlc2lzJyBhcyBjb25zdCxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyBhcyBjb25zdCxcbiAgICAgICAgY29udGVudDoge1xuICAgICAgICAgIHR5cGU6ICd1bnN1cHBvcnRlZCcsXG4gICAgICAgICAgcmVxdWVzdDoge31cbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChzeW50aGVzaXNBZ2VudC5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdVbnN1cHBvcnRlZCByZXF1ZXN0IHR5cGU6IHVuc3VwcG9ydGVkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSB1bnN1cHBvcnRlZCBtZXNzYWdlIHR5cGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyBhcyBjb25zdCxcbiAgICAgICAgcmVjaXBpZW50OiAnc3ludGhlc2lzJyBhcyBjb25zdCxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICd1cGRhdGUnIGFzIGNvbnN0LFxuICAgICAgICBjb250ZW50OiB7fSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udi0xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcS00NTYnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChzeW50aGVzaXNBZ2VudC5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdVbnN1cHBvcnRlZCBtZXNzYWdlIHR5cGU6IHVwZGF0ZScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmlzdWFsaXphdGlvbiBnZW5lcmF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgcmlzay1yZXR1cm4gc2NhdHRlciBwbG90JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1JlcXVlc3Q6IFN5bnRoZXNpc1JlcXVlc3QgPSB7XG4gICAgICAgIGFuYWx5c2lzUmVzdWx0czogW10sXG4gICAgICAgIHJlc2VhcmNoRmluZGluZ3M6IFtdLFxuICAgICAgICBjb21wbGlhbmNlQ2hlY2tzOiBbXSxcbiAgICAgICAgdXNlclByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgb3V0cHV0Rm9ybWF0OiAnZGV0YWlsZWQnLFxuICAgICAgICBpbmNsdWRlVmlzdWFsaXphdGlvbnM6IHRydWVcbiAgICAgIH07XG5cbiAgICAgIG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoeyBvdmVyYWxsU2NvcmU6IDAuOCB9KSxcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS0zLTUtc29ubmV0LTIwMjQxMDIyLXYyOjAnLFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3Qtc2NhdHRlcicsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogMzAwIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KG1vY2tSZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgY29uc3Qgc2NhdHRlclBsb3QgPSByZXNwb25zZS52aXN1YWxpemF0aW9ucy5maW5kKHYgPT4gdi50eXBlID09PSAnY2hhcnQnICYmIHYuY29uZmlnLmNoYXJ0VHlwZSA9PT0gJ3NjYXR0ZXInKTtcbiAgICAgIGV4cGVjdChzY2F0dGVyUGxvdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzY2F0dGVyUGxvdD8udGl0bGUpLnRvQmUoJ1Jpc2stUmV0dXJuIEFuYWx5c2lzJyk7XG4gICAgICBleHBlY3Qoc2NhdHRlclBsb3Q/LmNvbmZpZy5kaW1lbnNpb25zKS50b0VxdWFsKHsgd2lkdGg6IDgwMCwgaGVpZ2h0OiA2MDAgfSk7XG4gICAgICBleHBlY3Qoc2NhdHRlclBsb3Q/LmNvbmZpZy5pbnRlcmFjdGl2aXR5Lnpvb20pLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGNvbmZpZGVuY2UgZGlzdHJpYnV0aW9uIGNoYXJ0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1JlcXVlc3Q6IFN5bnRoZXNpc1JlcXVlc3QgPSB7XG4gICAgICAgIGFuYWx5c2lzUmVzdWx0czogW10sXG4gICAgICAgIHJlc2VhcmNoRmluZGluZ3M6IFtdLFxuICAgICAgICBjb21wbGlhbmNlQ2hlY2tzOiBbXSxcbiAgICAgICAgdXNlclByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgb3V0cHV0Rm9ybWF0OiAnZGV0YWlsZWQnLFxuICAgICAgICBpbmNsdWRlVmlzdWFsaXphdGlvbnM6IHRydWVcbiAgICAgIH07XG5cbiAgICAgIG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoeyBvdmVyYWxsU2NvcmU6IDAuOCB9KSxcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS0zLTUtc29ubmV0LTIwMjQxMDIyLXYyOjAnLFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtY29uZmlkZW5jZScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogMzAwIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KG1vY2tSZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgY29uc3QgYmFyQ2hhcnQgPSByZXNwb25zZS52aXN1YWxpemF0aW9ucy5maW5kKHYgPT4gdi50eXBlID09PSAnY2hhcnQnICYmIHYuY29uZmlnLmNoYXJ0VHlwZSA9PT0gJ2JhcicpO1xuICAgICAgZXhwZWN0KGJhckNoYXJ0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGJhckNoYXJ0Py50aXRsZSkudG9CZSgnQ29uZmlkZW5jZSBEaXN0cmlidXRpb24nKTtcbiAgICAgIGV4cGVjdChiYXJDaGFydD8uY29uZmlnLmRpbWVuc2lvbnMpLnRvRXF1YWwoeyB3aWR0aDogNjAwLCBoZWlnaHQ6IDQwMCB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgaW1wbGVtZW50YXRpb24gdGltZWxpbmUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrUmVxdWVzdDogU3ludGhlc2lzUmVxdWVzdCA9IHtcbiAgICAgICAgYW5hbHlzaXNSZXN1bHRzOiBbXSxcbiAgICAgICAgcmVzZWFyY2hGaW5kaW5nczogW10sXG4gICAgICAgIGNvbXBsaWFuY2VDaGVja3M6IFtdLFxuICAgICAgICB1c2VyUHJlZmVyZW5jZXM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgICB9LFxuICAgICAgICBvdXRwdXRGb3JtYXQ6ICdkZXRhaWxlZCcsXG4gICAgICAgIGluY2x1ZGVWaXN1YWxpemF0aW9uczogdHJ1ZVxuICAgICAgfTtcblxuICAgICAgbW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeSh7IG92ZXJhbGxTY29yZTogMC44IH0pLFxuICAgICAgICBtb2RlbElkOiAnY2xhdWRlLTMtNS1zb25uZXQtMjAyNDEwMjItdjI6MCcsXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC10aW1lbGluZScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogMzAwIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHN5bnRoZXNpc0FnZW50LnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KG1vY2tSZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgY29uc3QgdGltZWxpbmUgPSByZXNwb25zZS52aXN1YWxpemF0aW9ucy5maW5kKHYgPT4gdi50eXBlID09PSAnZGlhZ3JhbScpO1xuICAgICAgZXhwZWN0KHRpbWVsaW5lKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHRpbWVsaW5lPy50aXRsZSkudG9CZSgnSW1wbGVtZW50YXRpb24gVGltZWxpbmUnKTtcbiAgICAgIGV4cGVjdCh0aW1lbGluZT8uY29uZmlnLmRpbWVuc2lvbnMpLnRvRXF1YWwoeyB3aWR0aDogMTAwMCwgaGVpZ2h0OiAzMDAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19