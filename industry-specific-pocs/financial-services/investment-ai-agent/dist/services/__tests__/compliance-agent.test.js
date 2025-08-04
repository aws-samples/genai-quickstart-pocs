"use strict";
/**
 * Compliance Agent Tests
 *
 * Tests for the compliance agent functionality including:
 * - Regulatory compliance checking
 * - Risk assessment for investment ideas
 * - ESG analysis
 * - Compliance documentation generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const compliance_agent_1 = require("../ai/compliance-agent");
// Mock the Claude Haiku service
jest.mock('../ai/claude-haiku-service');
describe('ComplianceAgent', () => {
    let complianceAgent;
    let mockHaikuService;
    // Sample test data
    const sampleInvestment = {
        id: 'test-investment-1',
        type: 'stock',
        name: 'Test Technology Corp',
        ticker: 'TTC',
        description: 'A technology company focused on AI solutions',
        sector: 'Technology',
        industry: 'Software',
        marketCap: 50000000000,
        currentPrice: 150.50,
        historicalPerformance: [
            {
                date: new Date('2024-01-01'),
                open: 140,
                high: 155,
                low: 138,
                close: 150.50,
                volume: 1000000,
                adjustedClose: 150.50
            }
        ],
        fundamentals: {
            eps: 6.0,
            peRatio: 25.5,
            pbRatio: 3.2,
            returnOnEquity: 0.15,
            returnOnAssets: 0.08,
            debtToEquity: 0.3,
            revenueGrowth: 0.12,
            profitMargin: 0.18
        },
        riskMetrics: {
            volatility: 0.25,
            beta: 1.2,
            sharpeRatio: 1.1,
            drawdown: 0.15,
            var: -0.08,
            correlations: {}
        },
        relatedInvestments: []
    };
    const sampleInvestmentIdea = {
        id: 'test-idea-1',
        version: 1,
        title: 'AI Technology Growth Strategy',
        description: 'Investment strategy focused on AI technology companies',
        investments: [sampleInvestment],
        rationale: 'Strong growth potential in AI sector',
        strategy: 'buy',
        timeHorizon: 'long',
        confidenceScore: 0.85,
        generatedAt: new Date(),
        lastUpdatedAt: new Date(),
        potentialOutcomes: [
            {
                scenario: 'expected',
                probability: 0.6,
                returnEstimate: 0.15,
                timeToRealization: 365,
                description: 'Expected growth scenario',
                conditions: ['Stable market conditions', 'Continued AI adoption'],
                keyRisks: [],
                catalysts: []
            }
        ],
        supportingData: [],
        counterArguments: [],
        complianceStatus: {
            compliant: true,
            issues: [],
            regulationsChecked: [],
            timestamp: new Date()
        },
        createdBy: 'test-agent',
        tags: [],
        category: 'equity',
        riskLevel: 'moderate',
        targetAudience: ['institutional'],
        metadata: {
            sourceModels: ['test-agent'],
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
    };
    beforeEach(() => {
        // Create mock Haiku service
        mockHaikuService = {
            complete: jest.fn()
        };
        // Create compliance agent with mocked service
        complianceAgent = new compliance_agent_1.ComplianceAgent(mockHaikuService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('processComplianceRequest', () => {
        it('should process compliance check request successfully', async () => {
            // Mock the Haiku service response
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Compliance analysis shows the investment meets regulatory requirements with minor considerations for sector-specific regulations.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
                requestId: 'test-request'
            });
            const request = {
                investments: [sampleInvestment],
                requestType: 'compliance-check',
                parameters: {
                    jurisdictions: ['US'],
                    includeESG: true
                }
            };
            const response = await complianceAgent.processComplianceRequest(request);
            expect(response).toBeDefined();
            expect(response.complianceResults).toHaveLength(1);
            expect(response.riskAssessments).toHaveLength(1);
            expect(response.confidence).toBeGreaterThan(0);
            expect(response.executionTime).toBeGreaterThan(0);
            expect(mockHaikuService.complete).toHaveBeenCalled();
        });
        it('should process risk assessment request successfully', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Risk assessment indicates medium overall risk with key factors including market volatility and sector concentration.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 150, outputTokens: 250, totalTokens: 400 },
                requestId: 'test-request'
            });
            const request = {
                investments: [sampleInvestment],
                requestType: 'risk-assessment',
                parameters: {
                    riskTolerance: 'moderate',
                    investmentHorizon: 'long'
                }
            };
            const response = await complianceAgent.processComplianceRequest(request);
            expect(response).toBeDefined();
            expect(response.riskAssessments).toHaveLength(1);
            expect(response.riskAssessments[0].overallRisk).toBeDefined();
            expect(response.riskAssessments[0].riskFactors).toBeDefined();
            expect(response.recommendations).toBeDefined();
        });
        it('should process ESG analysis request successfully', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'ESG analysis shows strong environmental practices (score: 85), good social responsibility (score: 78), and adequate governance (score: 72).',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 200, outputTokens: 300, totalTokens: 500 },
                requestId: 'test-request'
            });
            const request = {
                investments: [sampleInvestment],
                requestType: 'esg-analysis',
                parameters: {
                    includeESG: true
                }
            };
            const response = await complianceAgent.processComplianceRequest(request);
            expect(response).toBeDefined();
            expect(response.esgAnalysis).toBeDefined();
            expect(response.esgAnalysis.overallESGScore).toBeGreaterThan(0);
            expect(response.esgAnalysis.esgFactors).toBeDefined();
            expect(response.esgAnalysis.esgRisks).toBeDefined();
            expect(response.esgAnalysis.esgOpportunities).toBeDefined();
        });
        it('should generate compliance documentation successfully', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Comprehensive compliance documentation including executive summary, regulatory framework analysis, and recommendations.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 300, outputTokens: 800, totalTokens: 1100 },
                requestId: 'test-request'
            });
            const request = {
                investments: [sampleInvestment],
                requestType: 'documentation-generation',
                parameters: {
                    documentationType: 'detailed',
                    jurisdictions: ['US']
                }
            };
            const response = await complianceAgent.processComplianceRequest(request);
            expect(response).toBeDefined();
            expect(response.documentation).toBeDefined();
            expect(response.documentation.title).toBeDefined();
            expect(response.documentation.content).toBeDefined();
            expect(response.documentation.sections).toBeDefined();
            expect(response.documentation.metadata).toBeDefined();
        });
        it('should handle investment ideas compliance check', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Investment idea compliance analysis shows adherence to portfolio diversification requirements with considerations for concentration limits.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 180, outputTokens: 220, totalTokens: 400 },
                requestId: 'test-request'
            });
            const request = {
                investmentIdeas: [sampleInvestmentIdea],
                requestType: 'compliance-check',
                parameters: {
                    jurisdictions: ['US', 'EU']
                }
            };
            const response = await complianceAgent.processComplianceRequest(request);
            expect(response).toBeDefined();
            expect(response.complianceResults).toHaveLength(1);
            expect(response.complianceResults[0].regulationsChecked).toBeDefined();
        });
        it('should throw error for unsupported request type', async () => {
            const request = {
                investments: [sampleInvestment],
                requestType: 'unsupported-type',
                parameters: {}
            };
            await expect(complianceAgent.processComplianceRequest(request))
                .rejects.toThrow('Unsupported compliance request type');
        });
    });
    describe('checkCompliance', () => {
        it('should check compliance for a single investment', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Investment complies with major regulations with minor ESG considerations.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 120, outputTokens: 180, totalTokens: 300 },
                requestId: 'test-request'
            });
            const result = await complianceAgent.checkCompliance(sampleInvestment);
            expect(result).toBeDefined();
            expect(result.compliant).toBeDefined();
            expect(result.issues).toBeDefined();
            expect(result.regulationsChecked).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });
        it('should identify compliance issues when present', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Critical compliance violation detected: Investment exceeds concentration limits under SEC regulations.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 120, outputTokens: 180, totalTokens: 300 },
                requestId: 'test-request'
            });
            const result = await complianceAgent.checkCompliance(sampleInvestment);
            expect(result.compliant).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues.some(issue => issue.severity === 'critical')).toBe(true);
        });
    });
    describe('evaluateRisk', () => {
        it('should evaluate risk for an investment with context', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Risk assessment shows medium overall risk with key factors including market volatility (medium), liquidity risk (low), and regulatory risk (low).',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 150, outputTokens: 200, totalTokens: 350 },
                requestId: 'test-request'
            });
            const riskContext = {
                portfolioComposition: { [sampleInvestment.id]: 0.3 },
                marketConditions: { volatility: 0.2 },
                riskTolerance: 'moderate',
                investmentHorizon: 'long',
                regulatoryContext: ['US']
            };
            const result = await complianceAgent.evaluateRisk(sampleInvestment, riskContext);
            expect(result).toBeDefined();
            expect(result.overallRisk).toBeDefined();
            expect(result.riskFactors).toBeDefined();
            expect(result.mitigationStrategies).toBeDefined();
            expect(result.scenarioAnalysis).toBeDefined();
        });
        it('should adjust risk assessment based on investment type', async () => {
            const cryptoInvestment = {
                ...sampleInvestment,
                type: 'cryptocurrency',
                name: 'Bitcoin'
            };
            mockHaikuService.complete.mockResolvedValue({
                completion: 'High risk assessment for cryptocurrency investment due to extreme volatility and regulatory uncertainty.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 150, outputTokens: 200, totalTokens: 350 },
                requestId: 'test-request'
            });
            const riskContext = {
                portfolioComposition: { [cryptoInvestment.id]: 0.1 },
                marketConditions: {},
                riskTolerance: 'aggressive',
                investmentHorizon: 'short',
                regulatoryContext: ['US']
            };
            const result = await complianceAgent.evaluateRisk(cryptoInvestment, riskContext);
            expect(result.overallRisk).toBe('very-high');
        });
    });
    describe('getRegulationDetails', () => {
        it('should return regulation details for valid regulation ID', async () => {
            const result = await complianceAgent.getRegulationDetails('SEC-ICA-1940');
            expect(result).toBeDefined();
            expect(result.id).toBe('SEC-ICA-1940');
            expect(result.name).toBeDefined();
            expect(result.description).toBeDefined();
            expect(result.jurisdiction).toBeDefined();
            expect(result.requirements).toBeDefined();
        });
        it('should throw error for invalid regulation ID', async () => {
            await expect(complianceAgent.getRegulationDetails('INVALID-REG'))
                .rejects.toThrow('Regulation not found');
        });
    });
    describe('monitorRegulationChanges', () => {
        it('should return regulation updates', async () => {
            const result = await complianceAgent.monitorRegulationChanges();
            expect(result).toBeDefined();
            expect(result.newRegulations).toBeDefined();
            expect(result.updatedRegulations).toBeDefined();
        });
    });
    describe('handleMessage', () => {
        it('should handle compliance request messages', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Compliance analysis completed successfully.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 100, outputTokens: 150, totalTokens: 250 },
                requestId: 'test-request'
            });
            const message = {
                sender: 'supervisor',
                recipient: 'compliance',
                messageType: 'request',
                content: {
                    type: 'compliance',
                    request: {
                        investments: [sampleInvestment],
                        requestType: 'compliance-check',
                        parameters: { jurisdictions: ['US'] }
                    }
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'test-conversation',
                    requestId: 'test-request'
                }
            };
            const response = await complianceAgent.handleMessage(message);
            expect(response).toBeDefined();
            expect(response.sender).toBe('compliance');
            expect(response.recipient).toBe('supervisor');
            expect(response.messageType).toBe('response');
            expect(response.content).toBeDefined();
        });
        it('should throw error for unsupported message types', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'compliance',
                messageType: 'unsupported',
                content: {},
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'test-conversation',
                    requestId: 'test-request'
                }
            };
            await expect(complianceAgent.handleMessage(message))
                .rejects.toThrow('Unsupported message type');
        });
        it('should throw error for unsupported request types in messages', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'compliance',
                messageType: 'request',
                content: {
                    type: 'unsupported',
                    request: {}
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'test-conversation',
                    requestId: 'test-request'
                }
            };
            await expect(complianceAgent.handleMessage(message))
                .rejects.toThrow('Unsupported request type');
        });
    });
    describe('ESG Analysis', () => {
        it('should provide comprehensive ESG scoring', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'ESG Analysis: Environmental score 85 (strong renewable energy initiatives), Social score 78 (good labor practices), Governance score 72 (adequate board independence).',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 200, outputTokens: 300, totalTokens: 500 },
                requestId: 'test-request'
            });
            const request = {
                investments: [sampleInvestment],
                requestType: 'esg-analysis',
                parameters: {}
            };
            const response = await complianceAgent.processComplianceRequest(request);
            const esgAnalysis = response.esgAnalysis;
            expect(esgAnalysis.environmentalScore).toBe(75);
            expect(esgAnalysis.socialScore).toBe(80);
            expect(esgAnalysis.governanceScore).toBe(70);
            expect(esgAnalysis.overallESGScore).toBeCloseTo(75);
            expect(esgAnalysis.esgFactors).toHaveLength(3);
            expect(esgAnalysis.esgRisks).toBeDefined();
            expect(esgAnalysis.esgOpportunities).toBeDefined();
        });
    });
    describe('Compliance Documentation', () => {
        it('should generate structured compliance documentation', async () => {
            mockHaikuService.complete.mockResolvedValue({
                completion: 'Detailed compliance documentation with executive summary, regulatory analysis, risk assessment, and recommendations.',
                modelId: 'claude-haiku-3.5',
                usage: { inputTokens: 300, outputTokens: 800, totalTokens: 1100 },
                requestId: 'test-request'
            });
            const request = {
                investments: [sampleInvestment],
                requestType: 'documentation-generation',
                parameters: {
                    documentationType: 'detailed',
                    jurisdictions: ['US', 'EU']
                }
            };
            const response = await complianceAgent.processComplianceRequest(request);
            const documentation = response.documentation;
            expect(documentation.documentType).toBe('detailed');
            expect(documentation.title).toContain('Compliance Analysis Report');
            expect(documentation.sections).toHaveLength(4);
            expect(documentation.sections[0].title).toBe('Executive Summary');
            expect(documentation.metadata.jurisdiction).toBe('US');
            expect(documentation.metadata.regulations).toContain('SEC Investment Company Act');
        });
    });
    describe('Error Handling', () => {
        it('should handle service errors gracefully', async () => {
            mockHaikuService.complete.mockRejectedValue(new Error('Service unavailable'));
            const request = {
                investments: [sampleInvestment],
                requestType: 'compliance-check',
                parameters: {}
            };
            await expect(complianceAgent.processComplianceRequest(request))
                .rejects.toThrow('Service unavailable');
        });
        it('should handle empty investment arrays', async () => {
            const request = {
                investments: [],
                requestType: 'compliance-check',
                parameters: {}
            };
            const response = await complianceAgent.processComplianceRequest(request);
            expect(response.complianceResults).toHaveLength(0);
            expect(response.riskAssessments).toHaveLength(0);
        });
        it('should require investments for ESG analysis', async () => {
            const request = {
                requestType: 'esg-analysis',
                parameters: {}
            };
            await expect(complianceAgent.processComplianceRequest(request))
                .rejects.toThrow('ESG analysis requires investments to be provided');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxpYW5jZS1hZ2VudC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9jb21wbGlhbmNlLWFnZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOztBQUVILDZEQUFnRztBQU1oRyxnQ0FBZ0M7QUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBRXhDLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7SUFDL0IsSUFBSSxlQUFnQyxDQUFDO0lBQ3JDLElBQUksZ0JBQWlELENBQUM7SUFFdEQsbUJBQW1CO0lBQ25CLE1BQU0sZ0JBQWdCLEdBQWU7UUFDbkMsRUFBRSxFQUFFLG1CQUFtQjtRQUN2QixJQUFJLEVBQUUsT0FBTztRQUNiLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsTUFBTSxFQUFFLEtBQUs7UUFDYixXQUFXLEVBQUUsOENBQThDO1FBQzNELE1BQU0sRUFBRSxZQUFZO1FBQ3BCLFFBQVEsRUFBRSxVQUFVO1FBQ3BCLFNBQVMsRUFBRSxXQUFXO1FBQ3RCLFlBQVksRUFBRSxNQUFNO1FBQ3BCLHFCQUFxQixFQUFFO1lBQ3JCO2dCQUNFLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzVCLElBQUksRUFBRSxHQUFHO2dCQUNULElBQUksRUFBRSxHQUFHO2dCQUNULEdBQUcsRUFBRSxHQUFHO2dCQUNSLEtBQUssRUFBRSxNQUFNO2dCQUNiLE1BQU0sRUFBRSxPQUFPO2dCQUNmLGFBQWEsRUFBRSxNQUFNO2FBQ3RCO1NBQ0Y7UUFDRCxZQUFZLEVBQUU7WUFDWixHQUFHLEVBQUUsR0FBRztZQUNSLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLEdBQUc7WUFDWixjQUFjLEVBQUUsSUFBSTtZQUNwQixjQUFjLEVBQUUsSUFBSTtZQUNwQixZQUFZLEVBQUUsR0FBRztZQUNqQixhQUFhLEVBQUUsSUFBSTtZQUNuQixZQUFZLEVBQUUsSUFBSTtTQUNuQjtRQUNELFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLElBQUksRUFBRSxHQUFHO1lBQ1QsV0FBVyxFQUFFLEdBQUc7WUFDaEIsUUFBUSxFQUFFLElBQUk7WUFDZCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1lBQ1YsWUFBWSxFQUFFLEVBQUU7U0FDakI7UUFDRCxrQkFBa0IsRUFBRSxFQUFFO0tBQ3ZCLENBQUM7SUFFRixNQUFNLG9CQUFvQixHQUFtQjtRQUMzQyxFQUFFLEVBQUUsYUFBYTtRQUNqQixPQUFPLEVBQUUsQ0FBQztRQUNWLEtBQUssRUFBRSwrQkFBK0I7UUFDdEMsV0FBVyxFQUFFLHdEQUF3RDtRQUNyRSxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMvQixTQUFTLEVBQUUsc0NBQXNDO1FBQ2pELFFBQVEsRUFBRSxLQUFLO1FBQ2YsV0FBVyxFQUFFLE1BQU07UUFDbkIsZUFBZSxFQUFFLElBQUk7UUFDckIsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO1FBQ3ZCLGFBQWEsRUFBRSxJQUFJLElBQUksRUFBRTtRQUN6QixpQkFBaUIsRUFBRTtZQUNqQjtnQkFDRSxRQUFRLEVBQUUsVUFBVTtnQkFDcEIsV0FBVyxFQUFFLEdBQUc7Z0JBQ2hCLGNBQWMsRUFBRSxJQUFJO2dCQUNwQixpQkFBaUIsRUFBRSxHQUFHO2dCQUN0QixXQUFXLEVBQUUsMEJBQTBCO2dCQUN2QyxVQUFVLEVBQUUsQ0FBQywwQkFBMEIsRUFBRSx1QkFBdUIsQ0FBQztnQkFDakUsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osU0FBUyxFQUFFLEVBQUU7YUFDZDtTQUNGO1FBQ0QsY0FBYyxFQUFFLEVBQUU7UUFDbEIsZ0JBQWdCLEVBQUUsRUFBRTtRQUNwQixnQkFBZ0IsRUFBRTtZQUNoQixTQUFTLEVBQUUsSUFBSTtZQUNmLE1BQU0sRUFBRSxFQUFFO1lBQ1Ysa0JBQWtCLEVBQUUsRUFBRTtZQUN0QixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7U0FDdEI7UUFDRCxTQUFTLEVBQUUsWUFBWTtRQUN2QixJQUFJLEVBQUUsRUFBRTtRQUNSLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFNBQVMsRUFBRSxVQUFVO1FBQ3JCLGNBQWMsRUFBRSxDQUFDLGVBQWUsQ0FBQztRQUNqQyxRQUFRLEVBQUU7WUFDUixZQUFZLEVBQUUsQ0FBQyxZQUFZLENBQUM7WUFDNUIsY0FBYyxFQUFFLElBQUk7WUFDcEIsZUFBZSxFQUFFLEVBQUU7WUFDbkIsYUFBYSxFQUFFLFVBQVU7WUFDekIsWUFBWSxFQUFFLEVBQUU7WUFDaEIsWUFBWSxFQUFFLEVBQUU7WUFDaEIsNEJBQTRCLEVBQUU7Z0JBQzVCLGVBQWUsRUFBRSxFQUFFO2dCQUNuQixXQUFXLEVBQUUsTUFBTTtnQkFDbkIsa0JBQWtCLEVBQUUsRUFBRTtnQkFDdEIsZ0JBQWdCLEVBQUUsS0FBSzthQUN4QjtTQUNGO1FBQ0QsWUFBWSxFQUFFO1lBQ1osS0FBSyxFQUFFLENBQUM7WUFDUixlQUFlLEVBQUUsQ0FBQztZQUNsQixRQUFRLEVBQUUsRUFBRTtZQUNaLFdBQVcsRUFBRSxFQUFFO1lBQ2YsTUFBTSxFQUFFLFFBQVE7WUFDaEIsYUFBYSxFQUFFLEVBQUU7U0FDbEI7S0FDRixDQUFDO0lBRUYsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLDRCQUE0QjtRQUM1QixnQkFBZ0IsR0FBRztZQUNqQixRQUFRLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtTQUNiLENBQUM7UUFFVCw4Q0FBOEM7UUFDOUMsZUFBZSxHQUFHLElBQUksa0NBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzFELENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BFLGtDQUFrQztZQUNsQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQzFDLFVBQVUsRUFBRSxtSUFBbUk7Z0JBQy9JLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFO2dCQUNoRSxTQUFTLEVBQUUsY0FBYzthQUMxQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBc0I7Z0JBQ2pDLFdBQVcsRUFBRSxDQUFDLGdCQUFnQixDQUFDO2dCQUMvQixXQUFXLEVBQUUsa0JBQWtCO2dCQUMvQixVQUFVLEVBQUU7b0JBQ1YsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDO29CQUNyQixVQUFVLEVBQUUsSUFBSTtpQkFDakI7YUFDRixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbEQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMscURBQXFELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDO2dCQUMxQyxVQUFVLEVBQUUsc0hBQXNIO2dCQUNsSSxPQUFPLEVBQUUsa0JBQWtCO2dCQUMzQixLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRTtnQkFDaEUsU0FBUyxFQUFFLGNBQWM7YUFDMUIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQXNCO2dCQUNqQyxXQUFXLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDL0IsV0FBVyxFQUFFLGlCQUFpQjtnQkFDOUIsVUFBVSxFQUFFO29CQUNWLGFBQWEsRUFBRSxVQUFVO29CQUN6QixpQkFBaUIsRUFBRSxNQUFNO2lCQUMxQjthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV6RSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrREFBa0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQzFDLFVBQVUsRUFBRSw2SUFBNkk7Z0JBQ3pKLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFO2dCQUNoRSxTQUFTLEVBQUUsY0FBYzthQUMxQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBc0I7Z0JBQ2pDLFdBQVcsRUFBRSxDQUFDLGdCQUFnQixDQUFDO2dCQUMvQixXQUFXLEVBQUUsY0FBYztnQkFDM0IsVUFBVSxFQUFFO29CQUNWLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV6RSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDckQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNyRSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQzFDLFVBQVUsRUFBRSx5SEFBeUg7Z0JBQ3JJLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFO2dCQUNqRSxTQUFTLEVBQUUsY0FBYzthQUMxQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBc0I7Z0JBQ2pDLFdBQVcsRUFBRSxDQUFDLGdCQUFnQixDQUFDO2dCQUMvQixXQUFXLEVBQUUsMEJBQTBCO2dCQUN2QyxVQUFVLEVBQUU7b0JBQ1YsaUJBQWlCLEVBQUUsVUFBVTtvQkFDN0IsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDO2lCQUN0QjthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV6RSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNwRCxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0RCxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2RCxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRCxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQzFDLFVBQVUsRUFBRSw2SUFBNkk7Z0JBQ3pKLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFO2dCQUNoRSxTQUFTLEVBQUUsY0FBYzthQUMxQixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBc0I7Z0JBQ2pDLGVBQWUsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2dCQUN2QyxXQUFXLEVBQUUsa0JBQWtCO2dCQUMvQixVQUFVLEVBQUU7b0JBQ1YsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztpQkFDNUI7YUFDRixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9ELE1BQU0sT0FBTyxHQUFzQjtnQkFDakMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7Z0JBQy9CLFdBQVcsRUFBRSxrQkFBeUI7Z0JBQ3RDLFVBQVUsRUFBRSxFQUFFO2FBQ2YsQ0FBQztZQUVGLE1BQU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDNUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQy9CLEVBQUUsQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvRCxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQzFDLFVBQVUsRUFBRSwyRUFBMkU7Z0JBQ3ZGLE9BQU8sRUFBRSxrQkFBa0I7Z0JBQzNCLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFO2dCQUNoRSxTQUFTLEVBQUUsY0FBYzthQUMxQixDQUFDLENBQUM7WUFFSCxNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQWUsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUV2RSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGdEQUFnRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzlELGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsVUFBVSxFQUFFLHdHQUF3RztnQkFDcEgsT0FBTyxFQUFFLGtCQUFrQjtnQkFDM0IsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hFLFNBQVMsRUFBRSxjQUFjO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRXZFLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtRQUM1QixFQUFFLENBQUMscURBQXFELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDO2dCQUMxQyxVQUFVLEVBQUUsbUpBQW1KO2dCQUMvSixPQUFPLEVBQUUsa0JBQWtCO2dCQUMzQixLQUFLLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRTtnQkFDaEUsU0FBUyxFQUFFLGNBQWM7YUFDMUIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxXQUFXLEdBQWdCO2dCQUMvQixvQkFBb0IsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFO2dCQUNwRCxnQkFBZ0IsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUU7Z0JBQ3JDLGFBQWEsRUFBRSxVQUFVO2dCQUN6QixpQkFBaUIsRUFBRSxNQUFNO2dCQUN6QixpQkFBaUIsRUFBRSxDQUFDLElBQUksQ0FBQzthQUMxQixDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxlQUFlLENBQUMsWUFBWSxDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpGLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDekMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx3REFBd0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RSxNQUFNLGdCQUFnQixHQUFlO2dCQUNuQyxHQUFHLGdCQUFnQjtnQkFDbkIsSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsSUFBSSxFQUFFLFNBQVM7YUFDaEIsQ0FBQztZQUVGLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsVUFBVSxFQUFFLDBHQUEwRztnQkFDdEgsT0FBTyxFQUFFLGtCQUFrQjtnQkFDM0IsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hFLFNBQVMsRUFBRSxjQUFjO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sV0FBVyxHQUFnQjtnQkFDL0Isb0JBQW9CLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRTtnQkFDcEQsZ0JBQWdCLEVBQUUsRUFBRTtnQkFDcEIsYUFBYSxFQUFFLFlBQVk7Z0JBQzNCLGlCQUFpQixFQUFFLE9BQU87Z0JBQzFCLGlCQUFpQixFQUFFLENBQUMsSUFBSSxDQUFDO2FBQzFCLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQWUsQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFakYsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFDcEMsRUFBRSxDQUFDLDBEQUEwRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hFLE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDekMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQyxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELE1BQU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztpQkFDOUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBRWhFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDN0IsRUFBRSxDQUFDLDJDQUEyQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pELGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsVUFBVSxFQUFFLDZDQUE2QztnQkFDekQsT0FBTyxFQUFFLGtCQUFrQjtnQkFDM0IsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hFLFNBQVMsRUFBRSxjQUFjO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHO2dCQUNkLE1BQU0sRUFBRSxZQUFxQjtnQkFDN0IsU0FBUyxFQUFFLFlBQXFCO2dCQUNoQyxXQUFXLEVBQUUsU0FBa0I7Z0JBQy9CLE9BQU8sRUFBRTtvQkFDUCxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsT0FBTyxFQUFFO3dCQUNQLFdBQVcsRUFBRSxDQUFDLGdCQUFnQixDQUFDO3dCQUMvQixXQUFXLEVBQUUsa0JBQTJCO3dCQUN4QyxVQUFVLEVBQUUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtxQkFDdEM7aUJBQ0Y7Z0JBQ0QsUUFBUSxFQUFFO29CQUNSLFFBQVEsRUFBRSxRQUFpQjtvQkFDM0IsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO29CQUNyQixjQUFjLEVBQUUsbUJBQW1CO29CQUNuQyxTQUFTLEVBQUUsY0FBYztpQkFDMUI7YUFDRixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlELE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMvQixNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hFLE1BQU0sT0FBTyxHQUFHO2dCQUNkLE1BQU0sRUFBRSxZQUFxQjtnQkFDN0IsU0FBUyxFQUFFLFlBQXFCO2dCQUNoQyxXQUFXLEVBQUUsYUFBb0I7Z0JBQ2pDLE9BQU8sRUFBRSxFQUFFO2dCQUNYLFFBQVEsRUFBRTtvQkFDUixRQUFRLEVBQUUsUUFBaUI7b0JBQzNCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsY0FBYyxFQUFFLG1CQUFtQjtvQkFDbkMsU0FBUyxFQUFFLGNBQWM7aUJBQzFCO2FBQ0YsQ0FBQztZQUVGLE1BQU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ2pELE9BQU8sQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4REFBOEQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RSxNQUFNLE9BQU8sR0FBRztnQkFDZCxNQUFNLEVBQUUsWUFBcUI7Z0JBQzdCLFNBQVMsRUFBRSxZQUFxQjtnQkFDaEMsV0FBVyxFQUFFLFNBQWtCO2dCQUMvQixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLE9BQU8sRUFBRSxFQUFFO2lCQUNaO2dCQUNELFFBQVEsRUFBRTtvQkFDUixRQUFRLEVBQUUsUUFBaUI7b0JBQzNCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsY0FBYyxFQUFFLG1CQUFtQjtvQkFDbkMsU0FBUyxFQUFFLGNBQWM7aUJBQzFCO2FBQ0YsQ0FBQztZQUVGLE1BQU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ2pELE9BQU8sQ0FBQyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDNUIsRUFBRSxDQUFDLDBDQUEwQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3hELGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsVUFBVSxFQUFFLHdLQUF3SztnQkFDcEwsT0FBTyxFQUFFLGtCQUFrQjtnQkFDM0IsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hFLFNBQVMsRUFBRSxjQUFjO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFzQjtnQkFDakMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7Z0JBQy9CLFdBQVcsRUFBRSxjQUFjO2dCQUMzQixVQUFVLEVBQUUsRUFBRTthQUNmLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RSxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBWSxDQUFDO1lBRTFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsRUFBRSxDQUFDLHFEQUFxRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25FLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDMUMsVUFBVSxFQUFFLHNIQUFzSDtnQkFDbEksT0FBTyxFQUFFLGtCQUFrQjtnQkFDM0IsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUU7Z0JBQ2pFLFNBQVMsRUFBRSxjQUFjO2FBQzFCLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFzQjtnQkFDakMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7Z0JBQy9CLFdBQVcsRUFBRSwwQkFBMEI7Z0JBQ3ZDLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxVQUFVO29CQUM3QixhQUFhLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO2lCQUM1QjthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6RSxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYyxDQUFDO1lBRTlDLE1BQU0sQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1FBQ3JGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLEVBQUUsQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RCxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBRTlFLE1BQU0sT0FBTyxHQUFzQjtnQkFDakMsV0FBVyxFQUFFLENBQUMsZ0JBQWdCLENBQUM7Z0JBQy9CLFdBQVcsRUFBRSxrQkFBa0I7Z0JBQy9CLFVBQVUsRUFBRSxFQUFFO2FBQ2YsQ0FBQztZQUVGLE1BQU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDNUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3JELE1BQU0sT0FBTyxHQUFzQjtnQkFDakMsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsV0FBVyxFQUFFLGtCQUFrQjtnQkFDL0IsVUFBVSxFQUFFLEVBQUU7YUFDZixDQUFDO1lBRUYsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFlLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLE9BQU8sR0FBc0I7Z0JBQ2pDLFdBQVcsRUFBRSxjQUFjO2dCQUMzQixVQUFVLEVBQUUsRUFBRTthQUNmLENBQUM7WUFFRixNQUFNLE1BQU0sQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQzVELE9BQU8sQ0FBQyxPQUFPLENBQUMsa0RBQWtELENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbXBsaWFuY2UgQWdlbnQgVGVzdHNcbiAqIFxuICogVGVzdHMgZm9yIHRoZSBjb21wbGlhbmNlIGFnZW50IGZ1bmN0aW9uYWxpdHkgaW5jbHVkaW5nOlxuICogLSBSZWd1bGF0b3J5IGNvbXBsaWFuY2UgY2hlY2tpbmdcbiAqIC0gUmlzayBhc3Nlc3NtZW50IGZvciBpbnZlc3RtZW50IGlkZWFzXG4gKiAtIEVTRyBhbmFseXNpc1xuICogLSBDb21wbGlhbmNlIGRvY3VtZW50YXRpb24gZ2VuZXJhdGlvblxuICovXG5cbmltcG9ydCB7IENvbXBsaWFuY2VBZ2VudCwgQ29tcGxpYW5jZVJlcXVlc3QsIENvbXBsaWFuY2VSZXNwb25zZSB9IGZyb20gJy4uL2FpL2NvbXBsaWFuY2UtYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlSGFpa3VTZXJ2aWNlIH0gZnJvbSAnLi4vYWkvY2xhdWRlLWhhaWt1LXNlcnZpY2UnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcbmltcG9ydCB7IEludmVzdG1lbnRJZGVhIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBSaXNrQ29udGV4dCB9IGZyb20gJy4uLy4uL21vZGVscy9zZXJ2aWNlcyc7XG5cbi8vIE1vY2sgdGhlIENsYXVkZSBIYWlrdSBzZXJ2aWNlXG5qZXN0Lm1vY2soJy4uL2FpL2NsYXVkZS1oYWlrdS1zZXJ2aWNlJyk7XG5cbmRlc2NyaWJlKCdDb21wbGlhbmNlQWdlbnQnLCAoKSA9PiB7XG4gIGxldCBjb21wbGlhbmNlQWdlbnQ6IENvbXBsaWFuY2VBZ2VudDtcbiAgbGV0IG1vY2tIYWlrdVNlcnZpY2U6IGplc3QuTW9ja2VkPENsYXVkZUhhaWt1U2VydmljZT47XG5cbiAgLy8gU2FtcGxlIHRlc3QgZGF0YVxuICBjb25zdCBzYW1wbGVJbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgIGlkOiAndGVzdC1pbnZlc3RtZW50LTEnLFxuICAgIHR5cGU6ICdzdG9jaycsXG4gICAgbmFtZTogJ1Rlc3QgVGVjaG5vbG9neSBDb3JwJyxcbiAgICB0aWNrZXI6ICdUVEMnLFxuICAgIGRlc2NyaXB0aW9uOiAnQSB0ZWNobm9sb2d5IGNvbXBhbnkgZm9jdXNlZCBvbiBBSSBzb2x1dGlvbnMnLFxuICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgIGluZHVzdHJ5OiAnU29mdHdhcmUnLFxuICAgIG1hcmtldENhcDogNTAwMDAwMDAwMDAsXG4gICAgY3VycmVudFByaWNlOiAxNTAuNTAsXG4gICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXG4gICAgICB7XG4gICAgICAgIGRhdGU6IG5ldyBEYXRlKCcyMDI0LTAxLTAxJyksXG4gICAgICAgIG9wZW46IDE0MCxcbiAgICAgICAgaGlnaDogMTU1LFxuICAgICAgICBsb3c6IDEzOCxcbiAgICAgICAgY2xvc2U6IDE1MC41MCxcbiAgICAgICAgdm9sdW1lOiAxMDAwMDAwLFxuICAgICAgICBhZGp1c3RlZENsb3NlOiAxNTAuNTBcbiAgICAgIH1cbiAgICBdLFxuICAgIGZ1bmRhbWVudGFsczoge1xuICAgICAgZXBzOiA2LjAsXG4gICAgICBwZVJhdGlvOiAyNS41LFxuICAgICAgcGJSYXRpbzogMy4yLFxuICAgICAgcmV0dXJuT25FcXVpdHk6IDAuMTUsXG4gICAgICByZXR1cm5PbkFzc2V0czogMC4wOCxcbiAgICAgIGRlYnRUb0VxdWl0eTogMC4zLFxuICAgICAgcmV2ZW51ZUdyb3d0aDogMC4xMixcbiAgICAgIHByb2ZpdE1hcmdpbjogMC4xOFxuICAgIH0sXG4gICAgcmlza01ldHJpY3M6IHtcbiAgICAgIHZvbGF0aWxpdHk6IDAuMjUsXG4gICAgICBiZXRhOiAxLjIsXG4gICAgICBzaGFycGVSYXRpbzogMS4xLFxuICAgICAgZHJhd2Rvd246IDAuMTUsXG4gICAgICB2YXI6IC0wLjA4LFxuICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgIH0sXG4gICAgcmVsYXRlZEludmVzdG1lbnRzOiBbXVxuICB9O1xuXG4gIGNvbnN0IHNhbXBsZUludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSA9IHtcbiAgICBpZDogJ3Rlc3QtaWRlYS0xJyxcbiAgICB2ZXJzaW9uOiAxLFxuICAgIHRpdGxlOiAnQUkgVGVjaG5vbG9neSBHcm93dGggU3RyYXRlZ3knLFxuICAgIGRlc2NyaXB0aW9uOiAnSW52ZXN0bWVudCBzdHJhdGVneSBmb2N1c2VkIG9uIEFJIHRlY2hub2xvZ3kgY29tcGFuaWVzJyxcbiAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRdLFxuICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBncm93dGggcG90ZW50aWFsIGluIEFJIHNlY3RvcicsXG4gICAgc3RyYXRlZ3k6ICdidXknLFxuICAgIHRpbWVIb3Jpem9uOiAnbG9uZycsXG4gICAgY29uZmlkZW5jZVNjb3JlOiAwLjg1LFxuICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgIGxhc3RVcGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgcG90ZW50aWFsT3V0Y29tZXM6IFtcbiAgICAgIHtcbiAgICAgICAgc2NlbmFyaW86ICdleHBlY3RlZCcsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjYsXG4gICAgICAgIHJldHVybkVzdGltYXRlOiAwLjE1LFxuICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogMzY1LFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0V4cGVjdGVkIGdyb3d0aCBzY2VuYXJpbycsXG4gICAgICAgIGNvbmRpdGlvbnM6IFsnU3RhYmxlIG1hcmtldCBjb25kaXRpb25zJywgJ0NvbnRpbnVlZCBBSSBhZG9wdGlvbiddLFxuICAgICAgICBrZXlSaXNrczogW10sXG4gICAgICAgIGNhdGFseXN0czogW11cbiAgICAgIH1cbiAgICBdLFxuICAgIHN1cHBvcnRpbmdEYXRhOiBbXSxcbiAgICBjb3VudGVyQXJndW1lbnRzOiBbXSxcbiAgICBjb21wbGlhbmNlU3RhdHVzOiB7XG4gICAgICBjb21wbGlhbnQ6IHRydWUsXG4gICAgICBpc3N1ZXM6IFtdLFxuICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbXSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgIH0sXG4gICAgY3JlYXRlZEJ5OiAndGVzdC1hZ2VudCcsXG4gICAgdGFnczogW10sXG4gICAgY2F0ZWdvcnk6ICdlcXVpdHknLFxuICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICB0YXJnZXRBdWRpZW5jZTogWydpbnN0aXR1dGlvbmFsJ10sXG4gICAgbWV0YWRhdGE6IHtcbiAgICAgIHNvdXJjZU1vZGVsczogWyd0ZXN0LWFnZW50J10sXG4gICAgICBwcm9jZXNzaW5nVGltZTogMTAwMCxcbiAgICAgIGRhdGFTb3VyY2VzVXNlZDogW10sXG4gICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgcXVhbGl0eVNjb3JlOiA4MCxcbiAgICAgIG5vdmVsdHlTY29yZTogNzAsXG4gICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgIHZvbGF0aWxpdHlJbmRleDogMjAsXG4gICAgICAgIG1hcmtldFRyZW5kOiAnYnVsbCcsXG4gICAgICAgIGVjb25vbWljSW5kaWNhdG9yczoge30sXG4gICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdsb3cnXG4gICAgICB9XG4gICAgfSxcbiAgICB0cmFja2luZ0luZm86IHtcbiAgICAgIHZpZXdzOiAwLFxuICAgICAgaW1wbGVtZW50YXRpb25zOiAwLFxuICAgICAgZmVlZGJhY2s6IFtdLFxuICAgICAgcGVyZm9ybWFuY2U6IFtdLFxuICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgIHN0YXR1c0hpc3Rvcnk6IFtdXG4gICAgfVxuICB9O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIC8vIENyZWF0ZSBtb2NrIEhhaWt1IHNlcnZpY2VcbiAgICBtb2NrSGFpa3VTZXJ2aWNlID0ge1xuICAgICAgY29tcGxldGU6IGplc3QuZm4oKVxuICAgIH0gYXMgYW55O1xuXG4gICAgLy8gQ3JlYXRlIGNvbXBsaWFuY2UgYWdlbnQgd2l0aCBtb2NrZWQgc2VydmljZVxuICAgIGNvbXBsaWFuY2VBZ2VudCA9IG5ldyBDb21wbGlhbmNlQWdlbnQobW9ja0hhaWt1U2VydmljZSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgamVzdC5jbGVhckFsbE1vY2tzKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdwcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIGNvbXBsaWFuY2UgY2hlY2sgcmVxdWVzdCBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBNb2NrIHRoZSBIYWlrdSBzZXJ2aWNlIHJlc3BvbnNlXG4gICAgICBtb2NrSGFpa3VTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogJ0NvbXBsaWFuY2UgYW5hbHlzaXMgc2hvd3MgdGhlIGludmVzdG1lbnQgbWVldHMgcmVndWxhdG9yeSByZXF1aXJlbWVudHMgd2l0aCBtaW5vciBjb25zaWRlcmF0aW9ucyBmb3Igc2VjdG9yLXNwZWNpZmljIHJlZ3VsYXRpb25zLicsXG4gICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtaGFpa3UtMy41JyxcbiAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDEwMCwgb3V0cHV0VG9rZW5zOiAyMDAsIHRvdGFsVG9rZW5zOiAzMDAgfSxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0J1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRdLFxuICAgICAgICByZXF1ZXN0VHlwZTogJ2NvbXBsaWFuY2UtY2hlY2snLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAganVyaXNkaWN0aW9uczogWydVUyddLFxuICAgICAgICAgIGluY2x1ZGVFU0c6IHRydWVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxpYW5jZVJlc3VsdHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb25maWRlbmNlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuZXhlY3V0aW9uVGltZSkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KG1vY2tIYWlrdVNlcnZpY2UuY29tcGxldGUpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyByaXNrIGFzc2Vzc21lbnQgcmVxdWVzdCBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrSGFpa3VTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogJ1Jpc2sgYXNzZXNzbWVudCBpbmRpY2F0ZXMgbWVkaXVtIG92ZXJhbGwgcmlzayB3aXRoIGtleSBmYWN0b3JzIGluY2x1ZGluZyBtYXJrZXQgdm9sYXRpbGl0eSBhbmQgc2VjdG9yIGNvbmNlbnRyYXRpb24uJyxcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS1oYWlrdS0zLjUnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTUwLCBvdXRwdXRUb2tlbnM6IDI1MCwgdG90YWxUb2tlbnM6IDQwMCB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBbc2FtcGxlSW52ZXN0bWVudF0sXG4gICAgICAgIHJlcXVlc3RUeXBlOiAncmlzay1hc3Nlc3NtZW50JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJ1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5yaXNrQXNzZXNzbWVudHNbMF0ub3ZlcmFsbFJpc2spLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnRzWzBdLnJpc2tGYWN0b3JzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlY29tbWVuZGF0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvY2VzcyBFU0cgYW5hbHlzaXMgcmVxdWVzdCBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrSGFpa3VTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogJ0VTRyBhbmFseXNpcyBzaG93cyBzdHJvbmcgZW52aXJvbm1lbnRhbCBwcmFjdGljZXMgKHNjb3JlOiA4NSksIGdvb2Qgc29jaWFsIHJlc3BvbnNpYmlsaXR5IChzY29yZTogNzgpLCBhbmQgYWRlcXVhdGUgZ292ZXJuYW5jZSAoc2NvcmU6IDcyKS4nLFxuICAgICAgICBtb2RlbElkOiAnY2xhdWRlLWhhaWt1LTMuNScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAyMDAsIG91dHB1dFRva2VuczogMzAwLCB0b3RhbFRva2VuczogNTAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IFtzYW1wbGVJbnZlc3RtZW50XSxcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdlc2ctYW5hbHlzaXMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW5jbHVkZUVTRzogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5lc2dBbmFseXNpcyEub3ZlcmFsbEVTR1Njb3JlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuZXNnQW5hbHlzaXMhLmVzZ0ZhY3RvcnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuZXNnQW5hbHlzaXMhLmVzZ1Jpc2tzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmVzZ0FuYWx5c2lzIS5lc2dPcHBvcnR1bml0aWVzKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBjb21wbGlhbmNlIGRvY3VtZW50YXRpb24gc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0hhaWt1U2VydmljZS5jb21wbGV0ZS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdDb21wcmVoZW5zaXZlIGNvbXBsaWFuY2UgZG9jdW1lbnRhdGlvbiBpbmNsdWRpbmcgZXhlY3V0aXZlIHN1bW1hcnksIHJlZ3VsYXRvcnkgZnJhbWV3b3JrIGFuYWx5c2lzLCBhbmQgcmVjb21tZW5kYXRpb25zLicsXG4gICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtaGFpa3UtMy41JyxcbiAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDMwMCwgb3V0cHV0VG9rZW5zOiA4MDAsIHRvdGFsVG9rZW5zOiAxMTAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IFtzYW1wbGVJbnZlc3RtZW50XSxcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdkb2N1bWVudGF0aW9uLWdlbmVyYXRpb24nLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgZG9jdW1lbnRhdGlvblR5cGU6ICdkZXRhaWxlZCcsXG4gICAgICAgICAganVyaXNkaWN0aW9uczogWydVUyddXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmRvY3VtZW50YXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuZG9jdW1lbnRhdGlvbiEudGl0bGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuZG9jdW1lbnRhdGlvbiEuY29udGVudCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kb2N1bWVudGF0aW9uIS5zZWN0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5kb2N1bWVudGF0aW9uIS5tZXRhZGF0YSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGludmVzdG1lbnQgaWRlYXMgY29tcGxpYW5jZSBjaGVjaycsIGFzeW5jICgpID0+IHtcbiAgICAgIG1vY2tIYWlrdVNlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wbGV0aW9uOiAnSW52ZXN0bWVudCBpZGVhIGNvbXBsaWFuY2UgYW5hbHlzaXMgc2hvd3MgYWRoZXJlbmNlIHRvIHBvcnRmb2xpbyBkaXZlcnNpZmljYXRpb24gcmVxdWlyZW1lbnRzIHdpdGggY29uc2lkZXJhdGlvbnMgZm9yIGNvbmNlbnRyYXRpb24gbGltaXRzLicsXG4gICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtaGFpa3UtMy41JyxcbiAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDE4MCwgb3V0cHV0VG9rZW5zOiAyMjAsIHRvdGFsVG9rZW5zOiA0MDAgfSxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0J1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50SWRlYXM6IFtzYW1wbGVJbnZlc3RtZW50SWRlYV0sXG4gICAgICAgIHJlcXVlc3RUeXBlOiAnY29tcGxpYW5jZS1jaGVjaycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBqdXJpc2RpY3Rpb25zOiBbJ1VTJywgJ0VVJ11cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29tcGxpYW5jZVJlc3VsdHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb21wbGlhbmNlUmVzdWx0c1swXS5yZWd1bGF0aW9uc0NoZWNrZWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciB1bnN1cHBvcnRlZCByZXF1ZXN0IHR5cGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IFtzYW1wbGVJbnZlc3RtZW50XSxcbiAgICAgICAgcmVxdWVzdFR5cGU6ICd1bnN1cHBvcnRlZC10eXBlJyBhcyBhbnksXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnVW5zdXBwb3J0ZWQgY29tcGxpYW5jZSByZXF1ZXN0IHR5cGUnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NoZWNrQ29tcGxpYW5jZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNoZWNrIGNvbXBsaWFuY2UgZm9yIGEgc2luZ2xlIGludmVzdG1lbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrSGFpa3VTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogJ0ludmVzdG1lbnQgY29tcGxpZXMgd2l0aCBtYWpvciByZWd1bGF0aW9ucyB3aXRoIG1pbm9yIEVTRyBjb25zaWRlcmF0aW9ucy4nLFxuICAgICAgICBtb2RlbElkOiAnY2xhdWRlLWhhaWt1LTMuNScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMjAsIG91dHB1dFRva2VuczogMTgwLCB0b3RhbFRva2VuczogMzAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuY2hlY2tDb21wbGlhbmNlKHNhbXBsZUludmVzdG1lbnQpO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jb21wbGlhbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0Lmlzc3VlcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmVndWxhdGlvbnNDaGVja2VkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50aW1lc3RhbXApLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGlkZW50aWZ5IGNvbXBsaWFuY2UgaXNzdWVzIHdoZW4gcHJlc2VudCcsIGFzeW5jICgpID0+IHtcbiAgICAgIG1vY2tIYWlrdVNlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wbGV0aW9uOiAnQ3JpdGljYWwgY29tcGxpYW5jZSB2aW9sYXRpb24gZGV0ZWN0ZWQ6IEludmVzdG1lbnQgZXhjZWVkcyBjb25jZW50cmF0aW9uIGxpbWl0cyB1bmRlciBTRUMgcmVndWxhdGlvbnMuJyxcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS1oYWlrdS0zLjUnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTIwLCBvdXRwdXRUb2tlbnM6IDE4MCwgdG90YWxUb2tlbnM6IDMwMCB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LmNoZWNrQ29tcGxpYW5jZShzYW1wbGVJbnZlc3RtZW50KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5jb21wbGlhbnQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pc3N1ZXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmVzdWx0Lmlzc3Vlcy5zb21lKGlzc3VlID0+IGlzc3VlLnNldmVyaXR5ID09PSAnY3JpdGljYWwnKSkudG9CZSh0cnVlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2V2YWx1YXRlUmlzaycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGV2YWx1YXRlIHJpc2sgZm9yIGFuIGludmVzdG1lbnQgd2l0aCBjb250ZXh0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0hhaWt1U2VydmljZS5jb21wbGV0ZS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdSaXNrIGFzc2Vzc21lbnQgc2hvd3MgbWVkaXVtIG92ZXJhbGwgcmlzayB3aXRoIGtleSBmYWN0b3JzIGluY2x1ZGluZyBtYXJrZXQgdm9sYXRpbGl0eSAobWVkaXVtKSwgbGlxdWlkaXR5IHJpc2sgKGxvdyksIGFuZCByZWd1bGF0b3J5IHJpc2sgKGxvdykuJyxcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS1oYWlrdS0zLjUnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTUwLCBvdXRwdXRUb2tlbnM6IDIwMCwgdG90YWxUb2tlbnM6IDM1MCB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgcmlza0NvbnRleHQ6IFJpc2tDb250ZXh0ID0ge1xuICAgICAgICBwb3J0Zm9saW9Db21wb3NpdGlvbjogeyBbc2FtcGxlSW52ZXN0bWVudC5pZF06IDAuMyB9LFxuICAgICAgICBtYXJrZXRDb25kaXRpb25zOiB7IHZvbGF0aWxpdHk6IDAuMiB9LFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnLFxuICAgICAgICByZWd1bGF0b3J5Q29udGV4dDogWydVUyddXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuZXZhbHVhdGVSaXNrKHNhbXBsZUludmVzdG1lbnQsIHJpc2tDb250ZXh0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQub3ZlcmFsbFJpc2spLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnJpc2tGYWN0b3JzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5taXRpZ2F0aW9uU3RyYXRlZ2llcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuc2NlbmFyaW9BbmFseXNpcykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRqdXN0IHJpc2sgYXNzZXNzbWVudCBiYXNlZCBvbiBpbnZlc3RtZW50IHR5cGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjcnlwdG9JbnZlc3RtZW50OiBJbnZlc3RtZW50ID0ge1xuICAgICAgICAuLi5zYW1wbGVJbnZlc3RtZW50LFxuICAgICAgICB0eXBlOiAnY3J5cHRvY3VycmVuY3knLFxuICAgICAgICBuYW1lOiAnQml0Y29pbidcbiAgICAgIH07XG5cbiAgICAgIG1vY2tIYWlrdVNlcnZpY2UuY29tcGxldGUubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wbGV0aW9uOiAnSGlnaCByaXNrIGFzc2Vzc21lbnQgZm9yIGNyeXB0b2N1cnJlbmN5IGludmVzdG1lbnQgZHVlIHRvIGV4dHJlbWUgdm9sYXRpbGl0eSBhbmQgcmVndWxhdG9yeSB1bmNlcnRhaW50eS4nLFxuICAgICAgICBtb2RlbElkOiAnY2xhdWRlLWhhaWt1LTMuNScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxNTAsIG91dHB1dFRva2VuczogMjAwLCB0b3RhbFRva2VuczogMzUwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByaXNrQ29udGV4dDogUmlza0NvbnRleHQgPSB7XG4gICAgICAgIHBvcnRmb2xpb0NvbXBvc2l0aW9uOiB7IFtjcnlwdG9JbnZlc3RtZW50LmlkXTogMC4xIH0sXG4gICAgICAgIG1hcmtldENvbmRpdGlvbnM6IHt9LFxuICAgICAgICByaXNrVG9sZXJhbmNlOiAnYWdncmVzc2l2ZScsXG4gICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnc2hvcnQnLFxuICAgICAgICByZWd1bGF0b3J5Q29udGV4dDogWydVUyddXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuZXZhbHVhdGVSaXNrKGNyeXB0b0ludmVzdG1lbnQsIHJpc2tDb250ZXh0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5vdmVyYWxsUmlzaykudG9CZSgndmVyeS1oaWdoJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRSZWd1bGF0aW9uRGV0YWlscycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiByZWd1bGF0aW9uIGRldGFpbHMgZm9yIHZhbGlkIHJlZ3VsYXRpb24gSUQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjb21wbGlhbmNlQWdlbnQuZ2V0UmVndWxhdGlvbkRldGFpbHMoJ1NFQy1JQ0EtMTk0MCcpO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZCkudG9CZSgnU0VDLUlDQS0xOTQwJyk7XG4gICAgICBleHBlY3QocmVzdWx0Lm5hbWUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmRlc2NyaXB0aW9uKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5qdXJpc2RpY3Rpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlcXVpcmVtZW50cykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIGludmFsaWQgcmVndWxhdGlvbiBJRCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChjb21wbGlhbmNlQWdlbnQuZ2V0UmVndWxhdGlvbkRldGFpbHMoJ0lOVkFMSUQtUkVHJykpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1JlZ3VsYXRpb24gbm90IGZvdW5kJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdtb25pdG9yUmVndWxhdGlvbkNoYW5nZXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcmVndWxhdGlvbiB1cGRhdGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29tcGxpYW5jZUFnZW50Lm1vbml0b3JSZWd1bGF0aW9uQ2hhbmdlcygpO1xuXG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5uZXdSZWd1bGF0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudXBkYXRlZFJlZ3VsYXRpb25zKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnaGFuZGxlTWVzc2FnZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjb21wbGlhbmNlIHJlcXVlc3QgbWVzc2FnZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrSGFpa3VTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgY29tcGxldGlvbjogJ0NvbXBsaWFuY2UgYW5hbHlzaXMgY29tcGxldGVkIHN1Y2Nlc3NmdWxseS4nLFxuICAgICAgICBtb2RlbElkOiAnY2xhdWRlLWhhaWt1LTMuNScsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxMDAsIG91dHB1dFRva2VuczogMTUwLCB0b3RhbFRva2VuczogMjUwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyBhcyBjb25zdCxcbiAgICAgICAgcmVjaXBpZW50OiAnY29tcGxpYW5jZScgYXMgY29uc3QsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcgYXMgY29uc3QsXG4gICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICB0eXBlOiAnY29tcGxpYW5jZScsXG4gICAgICAgICAgcmVxdWVzdDoge1xuICAgICAgICAgICAgaW52ZXN0bWVudHM6IFtzYW1wbGVJbnZlc3RtZW50XSxcbiAgICAgICAgICAgIHJlcXVlc3RUeXBlOiAnY29tcGxpYW5jZS1jaGVjaycgYXMgY29uc3QsXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiB7IGp1cmlzZGljdGlvbnM6IFsnVVMnXSB9XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICd0ZXN0LWNvbnZlcnNhdGlvbicsXG4gICAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNvbXBsaWFuY2VBZ2VudC5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uuc2VuZGVyKS50b0JlKCdjb21wbGlhbmNlJyk7XG4gICAgICBleHBlY3QocmVzcG9uc2UucmVjaXBpZW50KS50b0JlKCdzdXBlcnZpc29yJyk7XG4gICAgICBleHBlY3QocmVzcG9uc2UubWVzc2FnZVR5cGUpLnRvQmUoJ3Jlc3BvbnNlJyk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29udGVudCkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdGhyb3cgZXJyb3IgZm9yIHVuc3VwcG9ydGVkIG1lc3NhZ2UgdHlwZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyBhcyBjb25zdCxcbiAgICAgICAgcmVjaXBpZW50OiAnY29tcGxpYW5jZScgYXMgY29uc3QsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAndW5zdXBwb3J0ZWQnIGFzIGFueSxcbiAgICAgICAgY29udGVudDoge30sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ3Rlc3QtY29udmVyc2F0aW9uJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChjb21wbGlhbmNlQWdlbnQuaGFuZGxlTWVzc2FnZShtZXNzYWdlKSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnVW5zdXBwb3J0ZWQgbWVzc2FnZSB0eXBlJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciB1bnN1cHBvcnRlZCByZXF1ZXN0IHR5cGVzIGluIG1lc3NhZ2VzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicgYXMgY29uc3QsXG4gICAgICAgIHJlY2lwaWVudDogJ2NvbXBsaWFuY2UnIGFzIGNvbnN0LFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnIGFzIGNvbnN0LFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgdHlwZTogJ3Vuc3VwcG9ydGVkJyxcbiAgICAgICAgICByZXF1ZXN0OiB7fVxuICAgICAgICB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICd0ZXN0LWNvbnZlcnNhdGlvbicsXG4gICAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoY29tcGxpYW5jZUFnZW50LmhhbmRsZU1lc3NhZ2UobWVzc2FnZSkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1Vuc3VwcG9ydGVkIHJlcXVlc3QgdHlwZScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRVNHIEFuYWx5c2lzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcHJvdmlkZSBjb21wcmVoZW5zaXZlIEVTRyBzY29yaW5nJywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0hhaWt1U2VydmljZS5jb21wbGV0ZS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdFU0cgQW5hbHlzaXM6IEVudmlyb25tZW50YWwgc2NvcmUgODUgKHN0cm9uZyByZW5ld2FibGUgZW5lcmd5IGluaXRpYXRpdmVzKSwgU29jaWFsIHNjb3JlIDc4IChnb29kIGxhYm9yIHByYWN0aWNlcyksIEdvdmVybmFuY2Ugc2NvcmUgNzIgKGFkZXF1YXRlIGJvYXJkIGluZGVwZW5kZW5jZSkuJyxcbiAgICAgICAgbW9kZWxJZDogJ2NsYXVkZS1oYWlrdS0zLjUnLFxuICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMjAwLCBvdXRwdXRUb2tlbnM6IDMwMCwgdG90YWxUb2tlbnM6IDUwMCB9LFxuICAgICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QnXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgcmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBbc2FtcGxlSW52ZXN0bWVudF0sXG4gICAgICAgIHJlcXVlc3RUeXBlOiAnZXNnLWFuYWx5c2lzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIGNvbnN0IGVzZ0FuYWx5c2lzID0gcmVzcG9uc2UuZXNnQW5hbHlzaXMhO1xuXG4gICAgICBleHBlY3QoZXNnQW5hbHlzaXMuZW52aXJvbm1lbnRhbFNjb3JlKS50b0JlKDc1KTtcbiAgICAgIGV4cGVjdChlc2dBbmFseXNpcy5zb2NpYWxTY29yZSkudG9CZSg4MCk7XG4gICAgICBleHBlY3QoZXNnQW5hbHlzaXMuZ292ZXJuYW5jZVNjb3JlKS50b0JlKDcwKTtcbiAgICAgIGV4cGVjdChlc2dBbmFseXNpcy5vdmVyYWxsRVNHU2NvcmUpLnRvQmVDbG9zZVRvKDc1KTtcbiAgICAgIGV4cGVjdChlc2dBbmFseXNpcy5lc2dGYWN0b3JzKS50b0hhdmVMZW5ndGgoMyk7XG4gICAgICBleHBlY3QoZXNnQW5hbHlzaXMuZXNnUmlza3MpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZXNnQW5hbHlzaXMuZXNnT3Bwb3J0dW5pdGllcykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0NvbXBsaWFuY2UgRG9jdW1lbnRhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHN0cnVjdHVyZWQgY29tcGxpYW5jZSBkb2N1bWVudGF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0hhaWt1U2VydmljZS5jb21wbGV0ZS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdEZXRhaWxlZCBjb21wbGlhbmNlIGRvY3VtZW50YXRpb24gd2l0aCBleGVjdXRpdmUgc3VtbWFyeSwgcmVndWxhdG9yeSBhbmFseXNpcywgcmlzayBhc3Nlc3NtZW50LCBhbmQgcmVjb21tZW5kYXRpb25zLicsXG4gICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtaGFpa3UtMy41JyxcbiAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDMwMCwgb3V0cHV0VG9rZW5zOiA4MDAsIHRvdGFsVG9rZW5zOiAxMTAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXF1ZXN0OiBDb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IFtzYW1wbGVJbnZlc3RtZW50XSxcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdkb2N1bWVudGF0aW9uLWdlbmVyYXRpb24nLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgZG9jdW1lbnRhdGlvblR5cGU6ICdkZXRhaWxlZCcsXG4gICAgICAgICAganVyaXNkaWN0aW9uczogWydVUycsICdFVSddXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KTtcbiAgICAgIGNvbnN0IGRvY3VtZW50YXRpb24gPSByZXNwb25zZS5kb2N1bWVudGF0aW9uITtcblxuICAgICAgZXhwZWN0KGRvY3VtZW50YXRpb24uZG9jdW1lbnRUeXBlKS50b0JlKCdkZXRhaWxlZCcpO1xuICAgICAgZXhwZWN0KGRvY3VtZW50YXRpb24udGl0bGUpLnRvQ29udGFpbignQ29tcGxpYW5jZSBBbmFseXNpcyBSZXBvcnQnKTtcbiAgICAgIGV4cGVjdChkb2N1bWVudGF0aW9uLnNlY3Rpb25zKS50b0hhdmVMZW5ndGgoNCk7XG4gICAgICBleHBlY3QoZG9jdW1lbnRhdGlvbi5zZWN0aW9uc1swXS50aXRsZSkudG9CZSgnRXhlY3V0aXZlIFN1bW1hcnknKTtcbiAgICAgIGV4cGVjdChkb2N1bWVudGF0aW9uLm1ldGFkYXRhLmp1cmlzZGljdGlvbikudG9CZSgnVVMnKTtcbiAgICAgIGV4cGVjdChkb2N1bWVudGF0aW9uLm1ldGFkYXRhLnJlZ3VsYXRpb25zKS50b0NvbnRhaW4oJ1NFQyBJbnZlc3RtZW50IENvbXBhbnkgQWN0Jyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdFcnJvciBIYW5kbGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBzZXJ2aWNlIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0hhaWt1U2VydmljZS5jb21wbGV0ZS5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ1NlcnZpY2UgdW5hdmFpbGFibGUnKSk7XG5cbiAgICAgIGNvbnN0IHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0ID0ge1xuICAgICAgICBpbnZlc3RtZW50czogW3NhbXBsZUludmVzdG1lbnRdLFxuICAgICAgICByZXF1ZXN0VHlwZTogJ2NvbXBsaWFuY2UtY2hlY2snLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7fVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwZWN0KGNvbXBsaWFuY2VBZ2VudC5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QocmVxdWVzdCkpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ1NlcnZpY2UgdW5hdmFpbGFibGUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVtcHR5IGludmVzdG1lbnQgYXJyYXlzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogQ29tcGxpYW5jZVJlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBbXSxcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdjb21wbGlhbmNlLWNoZWNrJyxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbXBsaWFuY2VSZXN1bHRzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uucmlza0Fzc2Vzc21lbnRzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlcXVpcmUgaW52ZXN0bWVudHMgZm9yIEVTRyBhbmFseXNpcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IENvbXBsaWFuY2VSZXF1ZXN0ID0ge1xuICAgICAgICByZXF1ZXN0VHlwZTogJ2VzZy1hbmFseXNpcycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHt9XG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBleHBlY3QoY29tcGxpYW5jZUFnZW50LnByb2Nlc3NDb21wbGlhbmNlUmVxdWVzdChyZXF1ZXN0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnRVNHIGFuYWx5c2lzIHJlcXVpcmVzIGludmVzdG1lbnRzIHRvIGJlIHByb3ZpZGVkJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19