"use strict";
/**
 * Tests for Investment Idea Orchestration Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const investment_idea_orchestration_1 = require("../investment-idea-orchestration");
const supervisor_agent_1 = require("../ai/supervisor-agent");
const planning_agent_1 = require("../ai/planning-agent");
const research_agent_1 = require("../ai/research-agent");
const analysis_agent_1 = require("../ai/analysis-agent");
const compliance_agent_1 = require("../ai/compliance-agent");
const synthesis_agent_1 = require("../ai/synthesis-agent");
const investment_idea_service_1 = require("../investment-idea-service");
const message_bus_1 = require("../communication/message-bus");
// Mock dependencies
jest.mock('../ai/supervisor-agent');
jest.mock('../ai/planning-agent');
jest.mock('../ai/research-agent');
jest.mock('../ai/analysis-agent');
jest.mock('../ai/compliance-agent');
jest.mock('../ai/synthesis-agent');
jest.mock('../investment-idea-service');
jest.mock('../communication/message-bus');
describe('InvestmentIdeaOrchestrationService', () => {
    let orchestrationService;
    let mockSupervisorAgent;
    let mockPlanningAgent;
    let mockResearchAgent;
    let mockAnalysisAgent;
    let mockComplianceAgent;
    let mockSynthesisAgent;
    let mockInvestmentIdeaService;
    let mockMessageBus;
    const mockInvestment = {
        id: 'inv-1',
        type: 'stock',
        name: 'Apple Inc.',
        ticker: 'AAPL',
        description: 'Technology company',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 3000000000000,
        currentPrice: 150.00,
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
    };
    const mockInvestmentIdea = {
        id: 'idea-1',
        version: 1,
        title: 'Apple Growth Investment',
        description: 'Investment in Apple for long-term growth',
        investments: [mockInvestment],
        rationale: 'Strong fundamentals and growth prospects',
        strategy: 'buy',
        timeHorizon: 'long',
        confidenceScore: 0.85,
        generatedAt: new Date(),
        lastUpdatedAt: new Date(),
        potentialOutcomes: [
            {
                scenario: 'expected',
                probability: 0.6,
                returnEstimate: 0.12,
                timeToRealization: 365,
                description: 'Expected growth scenario',
                conditions: ['Market stability'],
                keyRisks: ['Market volatility'],
                catalysts: ['Product launches']
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
        tags: ['technology', 'growth'],
        category: 'equity',
        riskLevel: 'moderate',
        targetAudience: ['retail'],
        metadata: {
            sourceModels: ['claude-sonnet'],
            processingTime: 5000,
            dataSourcesUsed: ['market-data'],
            researchDepth: 'standard',
            qualityScore: 80,
            noveltyScore: 70,
            marketConditionsAtGeneration: {
                volatilityIndex: 20,
                marketTrend: 'bull',
                economicIndicators: {},
                geopoliticalRisk: 'medium'
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
        // Create mocked instances
        mockSupervisorAgent = new supervisor_agent_1.SupervisorAgent({}, {});
        mockPlanningAgent = new planning_agent_1.PlanningAgent({}, {});
        mockResearchAgent = new research_agent_1.ResearchAgent({}, {}, {}, {});
        mockAnalysisAgent = new analysis_agent_1.AnalysisAgent({}, {});
        mockComplianceAgent = new compliance_agent_1.ComplianceAgent({});
        mockSynthesisAgent = new synthesis_agent_1.SynthesisAgent({});
        mockInvestmentIdeaService = new investment_idea_service_1.InvestmentIdeaService();
        mockMessageBus = new message_bus_1.MessageBus();
        // Setup default mock implementations
        mockPlanningAgent.createResearchPlan = jest.fn().mockResolvedValue({
            researchTasks: ['market-analysis', 'sector-research'],
            analysisTasks: ['financial-analysis', 'risk-assessment'],
            timeline: 60000
        });
        mockResearchAgent.processResearchRequest = jest.fn().mockResolvedValue({
            summary: 'Research completed',
            keyFindings: ['market data', 'research reports'],
            trends: [{ trend: 'AI growth', strength: 'strong', timeframe: 'medium' }],
            patterns: [{ pattern: 'Tech innovation', confidence: 0.8 }],
            sources: [],
            confidence: 0.85,
            recommendations: ['Cloud computing', 'Mobile technology'],
            relatedTopics: ['technology', 'growth'],
            executionTime: 5000
        });
        mockAnalysisAgent.processAnalysisRequest = jest.fn().mockResolvedValue({
            results: [
                {
                    investment: mockInvestment,
                    summary: 'Financial analysis results',
                    expectedReturn: 0.12,
                    riskLevel: 'moderate',
                    confidence: 0.85
                }
            ],
            riskAssessment: {
                overallRisk: 'medium',
                riskScore: 0.6,
                riskFactors: ['Market volatility'],
                mitigationStrategies: ['Diversification']
            },
            recommendations: [],
            confidence: 0.85,
            executionTime: 8000
        });
        mockComplianceAgent.processComplianceRequest = jest.fn().mockResolvedValue({
            complianceResults: [
                {
                    compliant: true,
                    issues: [],
                    regulationsChecked: ['SEC', 'FINRA'],
                    timestamp: new Date()
                }
            ],
            riskAssessments: [],
            recommendations: [],
            confidence: 0.95,
            executionTime: 3000
        });
        mockSynthesisAgent.processSynthesisRequest = jest.fn().mockResolvedValue({
            investmentIdeas: [mockInvestmentIdea],
            executiveSummary: 'Investment analysis completed',
            detailedNarrative: 'Detailed analysis narrative',
            keyInsights: ['Strong growth potential'],
            riskSummary: 'Moderate risk profile',
            recommendations: [],
            visualizations: [],
            coherenceScore: 0.9,
            confidence: 0.85,
            executionTime: 10000
        });
        mockInvestmentIdeaService.createInvestmentIdea = jest.fn().mockResolvedValue({
            idea: mockInvestmentIdea,
            validation: { isValid: true, errors: [], warnings: [] }
        });
        // Create service instance
        orchestrationService = new investment_idea_orchestration_1.InvestmentIdeaOrchestrationService(mockSupervisorAgent, mockPlanningAgent, mockResearchAgent, mockAnalysisAgent, mockComplianceAgent, mockSynthesisAgent, mockInvestmentIdeaService, mockMessageBus);
    });
    describe('generateInvestmentIdeas', () => {
        it('should successfully generate investment ideas with basic parameters', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-1',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result).toBeDefined();
            expect(result.requestId).toBe('req-1');
            expect(result.ideas).toHaveLength(1);
            expect(result.ideas[0].rank).toBe(1);
            expect(result.ideas[0].rankingScore).toBeGreaterThan(0);
            expect(result.metadata.totalIdeasGenerated).toBe(1);
            expect(result.metadata.processingSteps).toHaveLength(5);
        });
        it('should apply filtering based on minimum confidence', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-2',
                parameters: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate',
                    minimumConfidence: 0.9,
                    maximumIdeas: 10
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(0); // Should be filtered out
            expect(result.metadata.totalIdeasFiltered).toBe(1);
            expect(result.metadata.filteringCriteria).toContainEqual(expect.objectContaining({
                criterion: 'minimumConfidence',
                type: 'inclusion',
                value: 0.9
            }));
        });
        it('should apply sector filtering', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-3',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    sectors: ['Healthcare', 'Finance'],
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(0); // Should be filtered out
            expect(result.metadata.filteringCriteria).toContainEqual(expect.objectContaining({
                criterion: 'sectors',
                type: 'inclusion',
                value: ['Healthcare', 'Finance']
            }));
        });
        it('should apply risk tolerance filtering', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-4',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'conservative',
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(0); // Should be filtered out
            expect(result.metadata.filteringCriteria).toContainEqual(expect.objectContaining({
                criterion: 'riskTolerance',
                type: 'inclusion',
                value: 'conservative'
            }));
        });
        it('should exclude specified investments', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-5',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    excludedInvestments: ['AAPL'],
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(0); // Should be filtered out
            expect(result.metadata.filteringCriteria).toContainEqual(expect.objectContaining({
                criterion: 'excludedInvestments',
                type: 'exclusion',
                value: ['AAPL']
            }));
        });
        it('should limit results to maximum ideas', async () => {
            // Mock multiple ideas
            const multipleIdeas = Array.from({ length: 5 }, (_, i) => ({
                ...mockInvestmentIdea,
                id: `idea-${i + 1}`,
                title: `Investment Idea ${i + 1}`,
                confidenceScore: 0.8 - (i * 0.1) // Decreasing confidence
            }));
            mockSynthesisAgent.processSynthesisRequest = jest.fn().mockResolvedValue({
                investmentIdeas: multipleIdeas,
                executiveSummary: 'Multiple investment opportunities identified',
                detailedNarrative: 'Detailed analysis of multiple opportunities',
                keyInsights: ['Diverse opportunities available'],
                riskSummary: 'Varied risk profiles',
                recommendations: [],
                visualizations: [],
                coherenceScore: 0.9,
                confidence: 0.85,
                executionTime: 10000
            });
            mockInvestmentIdeaService.createInvestmentIdea = jest.fn()
                .mockImplementation((req) => {
                const idea = multipleIdeas.find(i => i.title === req.title) || mockInvestmentIdea;
                return Promise.resolve({
                    idea,
                    validation: { isValid: true, errors: [], warnings: [] }
                });
            });
            const request = {
                userId: 'user-1',
                requestId: 'req-6',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 3 // Limit to 3 ideas
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(3);
            expect(result.ideas[0].rank).toBe(1);
            expect(result.ideas[1].rank).toBe(2);
            expect(result.ideas[2].rank).toBe(3);
            // Should be sorted by ranking score (higher confidence = higher score)
            expect(result.ideas[0].confidenceScore).toBeGreaterThanOrEqual(result.ideas[1].confidenceScore);
            expect(result.ideas[1].confidenceScore).toBeGreaterThanOrEqual(result.ideas[2].confidenceScore);
        });
        it('should calculate ranking scores correctly', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-7',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 1
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(1);
            const rankedIdea = result.ideas[0];
            expect(rankedIdea.rankingScore).toBeGreaterThan(0);
            expect(rankedIdea.rankingFactors).toHaveLength(5);
            // Check that all ranking factors are present
            const factorNames = rankedIdea.rankingFactors.map(f => f.factor);
            expect(factorNames).toContain('confidence');
            expect(factorNames).toContain('risk-return');
            expect(factorNames).toContain('time-horizon');
            expect(factorNames).toContain('quality-novelty');
            expect(factorNames).toContain('market-timing');
            // Check that weights sum to 1
            const totalWeight = rankedIdea.rankingFactors.reduce((sum, f) => sum + f.weight, 0);
            expect(totalWeight).toBeCloseTo(1.0, 2);
        });
        it('should update confidence distribution correctly', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-8',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 1
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.metadata.confidenceDistribution).toBeDefined();
            expect(result.metadata.confidenceDistribution.high).toBe(1); // 0.85 > 0.8
            expect(result.metadata.confidenceDistribution.medium).toBe(0);
            expect(result.metadata.confidenceDistribution.low).toBe(0);
            expect(result.metadata.confidenceDistribution.average).toBe(0.85);
        });
        it('should handle context parameters', async () => {
            const context = {
                userProfile: {
                    investmentExperience: 'advanced',
                    preferredStrategies: ['growth', 'value'],
                    historicalPreferences: ['technology', 'healthcare'],
                    riskProfile: {
                        riskCapacity: 80,
                        riskTolerance: 75,
                        timeHorizon: 'long',
                        liquidityNeeds: 'low'
                    }
                },
                marketContext: {
                    currentConditions: ['bull-market', 'low-volatility'],
                    volatilityLevel: 'low',
                    marketTrend: 'bull',
                    economicIndicators: { 'GDP-growth': 3.2, 'inflation': 2.1 },
                    geopoliticalRisk: 'low'
                }
            };
            const request = {
                userId: 'user-1',
                requestId: 'req-9',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                },
                context
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result).toBeDefined();
            expect(mockPlanningAgent.createResearchPlan).toHaveBeenCalledWith('req-9', expect.objectContaining({
                context: context
            }));
        });
        it('should handle errors gracefully', async () => {
            mockPlanningAgent.createResearchPlan = jest.fn().mockRejectedValue(new Error('Planning failed'));
            const request = {
                userId: 'user-1',
                requestId: 'req-10',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            await expect(orchestrationService.generateInvestmentIdeas(request))
                .rejects.toThrow('Investment idea generation failed: Planning failed');
        });
        it('should track processing metrics', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-11',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.processingMetrics).toBeDefined();
            expect(result.processingMetrics.totalProcessingTime).toBeGreaterThanOrEqual(0);
            expect(result.metadata.processingSteps).toHaveLength(5);
            const stepNames = result.metadata.processingSteps.map(s => s.step);
            expect(stepNames).toEqual(['planning', 'research', 'analysis', 'compliance', 'synthesis']);
        });
    });
    describe('utility methods', () => {
        it('should track active requests', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-12',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            // Start generation (don't await)
            const generationPromise = orchestrationService.generateInvestmentIdeas(request);
            // Check active request
            const activeRequest = orchestrationService.getActiveRequestStatus('req-12');
            expect(activeRequest).toBeDefined();
            expect(activeRequest?.requestId).toBe('req-12');
            // Wait for completion
            await generationPromise;
            // Should no longer be active
            const completedRequest = orchestrationService.getActiveRequestStatus('req-12');
            expect(completedRequest).toBeUndefined();
        });
        it('should cancel active requests', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-13',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            // Start generation (don't await)
            orchestrationService.generateInvestmentIdeas(request);
            // Cancel request
            const cancelled = orchestrationService.cancelRequest('req-13');
            expect(cancelled).toBe(true);
            // Should no longer be active
            const activeRequest = orchestrationService.getActiveRequestStatus('req-13');
            expect(activeRequest).toBeUndefined();
        });
        it('should provide processing statistics', () => {
            const stats = orchestrationService.getProcessingStatistics();
            expect(stats).toBeDefined();
            expect(stats.activeRequests).toBe(0);
            expect(typeof stats.totalProcessed).toBe('number');
            expect(typeof stats.averageProcessingTime).toBe('number');
        });
    });
    describe('filtering logic', () => {
        it('should correctly identify compatible time horizons', async () => {
            // Test with compatible time horizon
            const compatibleRequest = {
                userId: 'user-1',
                requestId: 'req-14',
                parameters: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(compatibleRequest);
            expect(result.ideas).toHaveLength(1); // Should pass filter
        });
        it('should correctly identify compatible risk levels', async () => {
            // Test with compatible risk level
            const compatibleRequest = {
                userId: 'user-1',
                requestId: 'req-15',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(compatibleRequest);
            expect(result.ideas).toHaveLength(1); // Should pass filter
        });
        it('should match asset class criteria correctly', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-16',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    assetClasses: ['stock'],
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(1); // Should pass filter
        });
        it('should match target audience correctly', async () => {
            const request = {
                userId: 'user-1',
                requestId: 'req-17',
                parameters: {
                    investmentHorizon: 'long',
                    riskTolerance: 'moderate',
                    targetAudience: ['retail'],
                    maximumIdeas: 5
                }
            };
            const result = await orchestrationService.generateInvestmentIdeas(request);
            expect(result.ideas).toHaveLength(1); // Should pass filter
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24udGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsb0ZBTTBDO0FBQzFDLDZEQUF5RDtBQUN6RCx5REFBcUQ7QUFDckQseURBQXFEO0FBQ3JELHlEQUFxRDtBQUNyRCw2REFBeUQ7QUFDekQsMkRBQXVEO0FBQ3ZELHdFQUFtRTtBQUNuRSw4REFBMEQ7QUFJMUQsb0JBQW9CO0FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFDcEMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQ25DLElBQUksQ0FBQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7QUFFMUMsUUFBUSxDQUFDLG9DQUFvQyxFQUFFLEdBQUcsRUFBRTtJQUNsRCxJQUFJLG9CQUF3RCxDQUFDO0lBQzdELElBQUksbUJBQWlELENBQUM7SUFDdEQsSUFBSSxpQkFBNkMsQ0FBQztJQUNsRCxJQUFJLGlCQUE2QyxDQUFDO0lBQ2xELElBQUksaUJBQTZDLENBQUM7SUFDbEQsSUFBSSxtQkFBaUQsQ0FBQztJQUN0RCxJQUFJLGtCQUErQyxDQUFDO0lBQ3BELElBQUkseUJBQTZELENBQUM7SUFDbEUsSUFB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QyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RCxNQUFNLE9BQU8sR0FBMEI7Z0JBQ3JDLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsUUFBUTtnQkFDbkIsVUFBVSxFQUFFO29CQUNWLGlCQUFpQixFQUFFLE1BQU07b0JBQ3pCLGFBQWEsRUFBRSxVQUFVO29CQUN6QixjQUFjLEVBQUUsQ0FBQyxRQUFRLENBQUM7b0JBQzFCLFlBQVksRUFBRSxDQUFDO2lCQUNoQjthQUNGLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLG9CQUFvQixDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQXFCO1FBQzdELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGVzdHMgZm9yIEludmVzdG1lbnQgSWRlYSBPcmNoZXN0cmF0aW9uIFNlcnZpY2VcbiAqL1xuXG5pbXBvcnQge1xuICBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlLFxuICBJZGVhR2VuZXJhdGlvblJlcXVlc3QsXG4gIElkZWFHZW5lcmF0aW9uUGFyYW1ldGVycyxcbiAgSWRlYUdlbmVyYXRpb25Db250ZXh0LFxuICBSYW5rZWRJbnZlc3RtZW50SWRlYVxufSBmcm9tICcuLi9pbnZlc3RtZW50LWlkZWEtb3JjaGVzdHJhdGlvbic7XG5pbXBvcnQgeyBTdXBlcnZpc29yQWdlbnQgfSBmcm9tICcuLi9haS9zdXBlcnZpc29yLWFnZW50JztcbmltcG9ydCB7IFBsYW5uaW5nQWdlbnQgfSBmcm9tICcuLi9haS9wbGFubmluZy1hZ2VudCc7XG5pbXBvcnQgeyBSZXNlYXJjaEFnZW50IH0gZnJvbSAnLi4vYWkvcmVzZWFyY2gtYWdlbnQnO1xuaW1wb3J0IHsgQW5hbHlzaXNBZ2VudCB9IGZyb20gJy4uL2FpL2FuYWx5c2lzLWFnZW50JztcbmltcG9ydCB7IENvbXBsaWFuY2VBZ2VudCB9IGZyb20gJy4uL2FpL2NvbXBsaWFuY2UtYWdlbnQnO1xuaW1wb3J0IHsgU3ludGhlc2lzQWdlbnQgfSBmcm9tICcuLi9haS9zeW50aGVzaXMtYWdlbnQnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWFTZXJ2aWNlIH0gZnJvbSAnLi4vaW52ZXN0bWVudC1pZGVhLXNlcnZpY2UnO1xuaW1wb3J0IHsgTWVzc2FnZUJ1cyB9IGZyb20gJy4uL2NvbW11bmljYXRpb24vbWVzc2FnZS1idXMnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWEsIENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcblxuLy8gTW9jayBkZXBlbmRlbmNpZXNcbmplc3QubW9jaygnLi4vYWkvc3VwZXJ2aXNvci1hZ2VudCcpO1xuamVzdC5tb2NrKCcuLi9haS9wbGFubmluZy1hZ2VudCcpO1xuamVzdC5tb2NrKCcuLi9haS9yZXNlYXJjaC1hZ2VudCcpO1xuamVzdC5tb2NrKCcuLi9haS9hbmFseXNpcy1hZ2VudCcpO1xuamVzdC5tb2NrKCcuLi9haS9jb21wbGlhbmNlLWFnZW50Jyk7XG5qZXN0Lm1vY2soJy4uL2FpL3N5bnRoZXNpcy1hZ2VudCcpO1xuamVzdC5tb2NrKCcuLi9pbnZlc3RtZW50LWlkZWEtc2VydmljZScpO1xuamVzdC5tb2NrKCcuLi9jb21tdW5pY2F0aW9uL21lc3NhZ2UtYnVzJyk7XG5cbmRlc2NyaWJlKCdJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlJywgKCkgPT4ge1xuICBsZXQgb3JjaGVzdHJhdGlvblNlcnZpY2U6IEludmVzdG1lbnRJZGVhT3JjaGVzdHJhdGlvblNlcnZpY2U7XG4gIGxldCBtb2NrU3VwZXJ2aXNvckFnZW50OiBqZXN0Lk1vY2tlZDxTdXBlcnZpc29yQWdlbnQ+O1xuICBsZXQgbW9ja1BsYW5uaW5nQWdlbnQ6IGplc3QuTW9ja2VkPFBsYW5uaW5nQWdlbnQ+O1xuICBsZXQgbW9ja1Jlc2VhcmNoQWdlbnQ6IGplc3QuTW9ja2VkPFJlc2VhcmNoQWdlbnQ+O1xuICBsZXQgbW9ja0FuYWx5c2lzQWdlbnQ6IGplc3QuTW9ja2VkPEFuYWx5c2lzQWdlbnQ+O1xuICBsZXQgbW9ja0NvbXBsaWFuY2VBZ2VudDogamVzdC5Nb2NrZWQ8Q29tcGxpYW5jZUFnZW50PjtcbiAgbGV0IG1vY2tTeW50aGVzaXNBZ2VudDogamVzdC5Nb2NrZWQ8U3ludGhlc2lzQWdlbnQ+O1xuICBsZXQgbW9ja0ludmVzdG1lbnRJZGVhU2VydmljZTogamVzdC5Nb2NrZWQ8SW52ZXN0bWVudElkZWFTZXJ2aWNlPjtcbiAgbGV0IG1vY2tNZXNzYWdlQnVzOiBqZXN0Lk1vY2tlZDxNZXNzYWdlQnVzPjtcblxuICBjb25zdCBtb2NrSW52ZXN0bWVudDogSW52ZXN0bWVudCA9IHtcbiAgICBpZDogJ2ludi0xJyxcbiAgICB0eXBlOiAnc3RvY2snLFxuICAgIG5hbWU6ICdBcHBsZSBJbmMuJyxcbiAgICB0aWNrZXI6ICdBQVBMJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueScsXG4gICAgc2VjdG9yOiAnVGVjaG5vbG9neScsXG4gICAgaW5kdXN0cnk6ICdDb25zdW1lciBFbGVjdHJvbmljcycsXG4gICAgbWFya2V0Q2FwOiAzMDAwMDAwMDAwMDAwLFxuICAgIGN1cnJlbnRQcmljZTogMTUwLjAwLFxuICAgIGhpc3RvcmljYWxQZXJmb3JtYW5jZTogW10sXG4gICAgcmlza01ldHJpY3M6IHtcbiAgICAgIHZvbGF0aWxpdHk6IDAuMjUsXG4gICAgICBiZXRhOiAxLjIsXG4gICAgICBzaGFycGVSYXRpbzogMS41LFxuICAgICAgZHJhd2Rvd246IDAuMTUsXG4gICAgICB2YXI6IDAuMDUsXG4gICAgICBjb3JyZWxhdGlvbnM6IHt9XG4gICAgfSxcbiAgICByZWxhdGVkSW52ZXN0bWVudHM6IFtdXG4gIH07XG5cbiAgY29uc3QgbW9ja0ludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSA9IHtcbiAgICBpZDogJ2lkZWEtMScsXG4gICAgdmVyc2lvbjogMSxcbiAgICB0aXRsZTogJ0FwcGxlIEdyb3d0aCBJbnZlc3RtZW50JyxcbiAgICBkZXNjcmlwdGlvbjogJ0ludmVzdG1lbnQgaW4gQXBwbGUgZm9yIGxvbmctdGVybSBncm93dGgnLFxuICAgIGludmVzdG1lbnRzOiBbbW9ja0ludmVzdG1lbnRdLFxuICAgIHJhdGlvbmFsZTogJ1N0cm9uZyBmdW5kYW1lbnRhbHMgYW5kIGdyb3d0aCBwcm9zcGVjdHMnLFxuICAgIHN0cmF0ZWd5OiAnYnV5JyxcbiAgICB0aW1lSG9yaXpvbjogJ2xvbmcnLFxuICAgIGNvbmZpZGVuY2VTY29yZTogMC44NSxcbiAgICBnZW5lcmF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICBsYXN0VXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgIHBvdGVudGlhbE91dGNvbWVzOiBbXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnZXhwZWN0ZWQnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC42LFxuICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC4xMixcbiAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDM2NSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFeHBlY3RlZCBncm93dGggc2NlbmFyaW8nLFxuICAgICAgICBjb25kaXRpb25zOiBbJ01hcmtldCBzdGFiaWxpdHknXSxcbiAgICAgICAga2V5Umlza3M6IFsnTWFya2V0IHZvbGF0aWxpdHknXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbJ1Byb2R1Y3QgbGF1bmNoZXMnXVxuICAgICAgfVxuICAgIF0sXG4gICAgc3VwcG9ydGluZ0RhdGE6IFtdLFxuICAgIGNvdW50ZXJBcmd1bWVudHM6IFtdLFxuICAgIGNvbXBsaWFuY2VTdGF0dXM6IHtcbiAgICAgIGNvbXBsaWFudDogdHJ1ZSxcbiAgICAgIGlzc3VlczogW10sXG4gICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFtdLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgfSxcbiAgICBjcmVhdGVkQnk6ICd0ZXN0LWFnZW50JyxcbiAgICB0YWdzOiBbJ3RlY2hub2xvZ3knLCAnZ3Jvd3RoJ10sXG4gICAgY2F0ZWdvcnk6ICdlcXVpdHknLFxuICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICB0YXJnZXRBdWRpZW5jZTogWydyZXRhaWwnXSxcbiAgICBtZXRhZGF0YToge1xuICAgICAgc291cmNlTW9kZWxzOiBbJ2NsYXVkZS1zb25uZXQnXSxcbiAgICAgIHByb2Nlc3NpbmdUaW1lOiA1MDAwLFxuICAgICAgZGF0YVNvdXJjZXNVc2VkOiBbJ21hcmtldC1kYXRhJ10sXG4gICAgICByZXNlYXJjaERlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgcXVhbGl0eVNjb3JlOiA4MCxcbiAgICAgIG5vdmVsdHlTY29yZTogNzAsXG4gICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgIHZvbGF0aWxpdHlJbmRleDogMjAsXG4gICAgICAgIG1hcmtldFRyZW5kOiAnYnVsbCcsXG4gICAgICAgIGVjb25vbWljSW5kaWNhdG9yczoge30sXG4gICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdtZWRpdW0nXG4gICAgICB9XG4gICAgfSxcbiAgICB0cmFja2luZ0luZm86IHtcbiAgICAgIHZpZXdzOiAwLFxuICAgICAgaW1wbGVtZW50YXRpb25zOiAwLFxuICAgICAgZmVlZGJhY2s6IFtdLFxuICAgICAgcGVyZm9ybWFuY2U6IFtdLFxuICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgIHN0YXR1c0hpc3Rvcnk6IFtdXG4gICAgfVxuICB9O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIC8vIENyZWF0ZSBtb2NrZWQgaW5zdGFuY2VzXG4gICAgbW9ja1N1cGVydmlzb3JBZ2VudCA9IG5ldyBTdXBlcnZpc29yQWdlbnQoe30gYXMgYW55LCB7fSBhcyBhbnkpIGFzIGplc3QuTW9ja2VkPFN1cGVydmlzb3JBZ2VudD47XG4gICAgbW9ja1BsYW5uaW5nQWdlbnQgPSBuZXcgUGxhbm5pbmdBZ2VudCh7fSBhcyBhbnksIHt9IGFzIGFueSkgYXMgamVzdC5Nb2NrZWQ8UGxhbm5pbmdBZ2VudD47XG4gICAgbW9ja1Jlc2VhcmNoQWdlbnQgPSBuZXcgUmVzZWFyY2hBZ2VudCh7fSBhcyBhbnksIHt9IGFzIGFueSwge30gYXMgYW55LCB7fSBhcyBhbnkpIGFzIGplc3QuTW9ja2VkPFJlc2VhcmNoQWdlbnQ+O1xuICAgIG1vY2tBbmFseXNpc0FnZW50ID0gbmV3IEFuYWx5c2lzQWdlbnQoe30gYXMgYW55LCB7fSBhcyBhbnkpIGFzIGplc3QuTW9ja2VkPEFuYWx5c2lzQWdlbnQ+O1xuICAgIG1vY2tDb21wbGlhbmNlQWdlbnQgPSBuZXcgQ29tcGxpYW5jZUFnZW50KHt9IGFzIGFueSkgYXMgamVzdC5Nb2NrZWQ8Q29tcGxpYW5jZUFnZW50PjtcbiAgICBtb2NrU3ludGhlc2lzQWdlbnQgPSBuZXcgU3ludGhlc2lzQWdlbnQoe30gYXMgYW55KSBhcyBqZXN0Lk1vY2tlZDxTeW50aGVzaXNBZ2VudD47XG4gICAgbW9ja0ludmVzdG1lbnRJZGVhU2VydmljZSA9IG5ldyBJbnZlc3RtZW50SWRlYVNlcnZpY2UoKSBhcyBqZXN0Lk1vY2tlZDxJbnZlc3RtZW50SWRlYVNlcnZpY2U+O1xuICAgIG1vY2tNZXNzYWdlQnVzID0gbmV3IE1lc3NhZ2VCdXMoKSBhcyBqZXN0Lk1vY2tlZDxNZXNzYWdlQnVzPjtcblxuICAgIC8vIFNldHVwIGRlZmF1bHQgbW9jayBpbXBsZW1lbnRhdGlvbnNcbiAgICBtb2NrUGxhbm5pbmdBZ2VudC5jcmVhdGVSZXNlYXJjaFBsYW4gPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgcmVzZWFyY2hUYXNrczogWydtYXJrZXQtYW5hbHlzaXMnLCAnc2VjdG9yLXJlc2VhcmNoJ10sXG4gICAgICBhbmFseXNpc1Rhc2tzOiBbJ2ZpbmFuY2lhbC1hbmFseXNpcycsICdyaXNrLWFzc2Vzc21lbnQnXSxcbiAgICAgIHRpbWVsaW5lOiA2MDAwMFxuICAgIH0pO1xuXG4gICAgbW9ja1Jlc2VhcmNoQWdlbnQucHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdCA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICBzdW1tYXJ5OiAnUmVzZWFyY2ggY29tcGxldGVkJyxcbiAgICAgIGtleUZpbmRpbmdzOiBbJ21hcmtldCBkYXRhJywgJ3Jlc2VhcmNoIHJlcG9ydHMnXSxcbiAgICAgIHRyZW5kczogW3sgdHJlbmQ6ICdBSSBncm93dGgnLCBzdHJlbmd0aDogJ3N0cm9uZycsIHRpbWVmcmFtZTogJ21lZGl1bScgfV0sXG4gICAgICBwYXR0ZXJuczogW3sgcGF0dGVybjogJ1RlY2ggaW5ub3ZhdGlvbicsIGNvbmZpZGVuY2U6IDAuOCB9XSxcbiAgICAgIHNvdXJjZXM6IFtdLFxuICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgIHJlY29tbWVuZGF0aW9uczogWydDbG91ZCBjb21wdXRpbmcnLCAnTW9iaWxlIHRlY2hub2xvZ3knXSxcbiAgICAgIHJlbGF0ZWRUb3BpY3M6IFsndGVjaG5vbG9neScsICdncm93dGgnXSxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IDUwMDBcbiAgICB9KTtcblxuICAgIG1vY2tBbmFseXNpc0FnZW50LnByb2Nlc3NBbmFseXNpc1JlcXVlc3QgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgcmVzdWx0czogW1xuICAgICAgICB7XG4gICAgICAgICAgaW52ZXN0bWVudDogbW9ja0ludmVzdG1lbnQsXG4gICAgICAgICAgc3VtbWFyeTogJ0ZpbmFuY2lhbCBhbmFseXNpcyByZXN1bHRzJyxcbiAgICAgICAgICBleHBlY3RlZFJldHVybjogMC4xMixcbiAgICAgICAgICByaXNrTGV2ZWw6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgY29uZmlkZW5jZTogMC44NVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgcmlza0Fzc2Vzc21lbnQ6IHtcbiAgICAgICAgb3ZlcmFsbFJpc2s6ICdtZWRpdW0nLFxuICAgICAgICByaXNrU2NvcmU6IDAuNixcbiAgICAgICAgcmlza0ZhY3RvcnM6IFsnTWFya2V0IHZvbGF0aWxpdHknXSxcbiAgICAgICAgbWl0aWdhdGlvblN0cmF0ZWdpZXM6IFsnRGl2ZXJzaWZpY2F0aW9uJ11cbiAgICAgIH0sXG4gICAgICByZWNvbW1lbmRhdGlvbnM6IFtdLFxuICAgICAgY29uZmlkZW5jZTogMC44NSxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IDgwMDBcbiAgICB9KTtcblxuICAgIG1vY2tDb21wbGlhbmNlQWdlbnQucHJvY2Vzc0NvbXBsaWFuY2VSZXF1ZXN0ID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgIGNvbXBsaWFuY2VSZXN1bHRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjb21wbGlhbnQ6IHRydWUsXG4gICAgICAgICAgaXNzdWVzOiBbXSxcbiAgICAgICAgICByZWd1bGF0aW9uc0NoZWNrZWQ6IFsnU0VDJywgJ0ZJTlJBJ10sXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICByaXNrQXNzZXNzbWVudHM6IFtdLFxuICAgICAgcmVjb21tZW5kYXRpb25zOiBbXSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgICBleGVjdXRpb25UaW1lOiAzMDAwXG4gICAgfSk7XG5cbiAgICBtb2NrU3ludGhlc2lzQWdlbnQucHJvY2Vzc1N5bnRoZXNpc1JlcXVlc3QgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgaW52ZXN0bWVudElkZWFzOiBbbW9ja0ludmVzdG1lbnRJZGVhXSxcbiAgICAgIGV4ZWN1dGl2ZVN1bW1hcnk6ICdJbnZlc3RtZW50IGFuYWx5c2lzIGNvbXBsZXRlZCcsXG4gICAgICBkZXRhaWxlZE5hcnJhdGl2ZTogJ0RldGFpbGVkIGFuYWx5c2lzIG5hcnJhdGl2ZScsXG4gICAgICBrZXlJbnNpZ2h0czogWydTdHJvbmcgZ3Jvd3RoIHBvdGVudGlhbCddLFxuICAgICAgcmlza1N1bW1hcnk6ICdNb2RlcmF0ZSByaXNrIHByb2ZpbGUnLFxuICAgICAgcmVjb21tZW5kYXRpb25zOiBbXSxcbiAgICAgIHZpc3VhbGl6YXRpb25zOiBbXSxcbiAgICAgIGNvaGVyZW5jZVNjb3JlOiAwLjksXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgICAgZXhlY3V0aW9uVGltZTogMTAwMDBcbiAgICB9KTtcblxuICAgIG1vY2tJbnZlc3RtZW50SWRlYVNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgaWRlYTogbW9ja0ludmVzdG1lbnRJZGVhLFxuICAgICAgdmFsaWRhdGlvbjogeyBpc1ZhbGlkOiB0cnVlLCBlcnJvcnM6IFtdLCB3YXJuaW5nczogW10gfVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHNlcnZpY2UgaW5zdGFuY2VcbiAgICBvcmNoZXN0cmF0aW9uU2VydmljZSA9IG5ldyBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlKFxuICAgICAgbW9ja1N1cGVydmlzb3JBZ2VudCxcbiAgICAgIG1vY2tQbGFubmluZ0FnZW50LFxuICAgICAgbW9ja1Jlc2VhcmNoQWdlbnQsXG4gICAgICBtb2NrQW5hbHlzaXNBZ2VudCxcbiAgICAgIG1vY2tDb21wbGlhbmNlQWdlbnQsXG4gICAgICBtb2NrU3ludGhlc2lzQWdlbnQsXG4gICAgICBtb2NrSW52ZXN0bWVudElkZWFTZXJ2aWNlLFxuICAgICAgbW9ja01lc3NhZ2VCdXNcbiAgICApO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzdWNjZXNzZnVsbHkgZ2VuZXJhdGUgaW52ZXN0bWVudCBpZGVhcyB3aXRoIGJhc2ljIHBhcmFtZXRlcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXItMScsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS0xJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMocmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlcXVlc3RJZCkudG9CZSgncmVxLTEnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYXMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYXNbMF0ucmFuaykudG9CZSgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYXNbMF0ucmFua2luZ1Njb3JlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLnRvdGFsSWRlYXNHZW5lcmF0ZWQpLnRvQmUoMSk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLnByb2Nlc3NpbmdTdGVwcykudG9IYXZlTGVuZ3RoKDUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhcHBseSBmaWx0ZXJpbmcgYmFzZWQgb24gbWluaW11bSBjb25maWRlbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtMicsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBtaW5pbXVtQ29uZmlkZW5jZTogMC45LCAvLyBIaWdoZXIgdGhhbiBtb2NrIGlkZWEgY29uZmlkZW5jZSAoMC44NSlcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDEwXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlkZWFzKS50b0hhdmVMZW5ndGgoMCk7IC8vIFNob3VsZCBiZSBmaWx0ZXJlZCBvdXRcbiAgICAgIGV4cGVjdChyZXN1bHQubWV0YWRhdGEudG90YWxJZGVhc0ZpbHRlcmVkKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5tZXRhZGF0YS5maWx0ZXJpbmdDcml0ZXJpYSkudG9Db250YWluRXF1YWwoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBjcml0ZXJpb246ICdtaW5pbXVtQ29uZmlkZW5jZScsXG4gICAgICAgICAgdHlwZTogJ2luY2x1c2lvbicsXG4gICAgICAgICAgdmFsdWU6IDAuOVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYXBwbHkgc2VjdG9yIGZpbHRlcmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIHNlY3RvcnM6IFsnSGVhbHRoY2FyZScsICdGaW5hbmNlJ10sIC8vIERpZmZlcmVudCBmcm9tIG1vY2sgKFRlY2hub2xvZ3kpXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiA1XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmlkZWFzKS50b0hhdmVMZW5ndGgoMCk7IC8vIFNob3VsZCBiZSBmaWx0ZXJlZCBvdXRcbiAgICAgIGV4cGVjdChyZXN1bHQubWV0YWRhdGEuZmlsdGVyaW5nQ3JpdGVyaWEpLnRvQ29udGFpbkVxdWFsKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgY3JpdGVyaW9uOiAnc2VjdG9ycycsXG4gICAgICAgICAgdHlwZTogJ2luY2x1c2lvbicsXG4gICAgICAgICAgdmFsdWU6IFsnSGVhbHRoY2FyZScsICdGaW5hbmNlJ11cbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFwcGx5IHJpc2sgdG9sZXJhbmNlIGZpbHRlcmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTQnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnY29uc2VydmF0aXZlJywgLy8gTW9jayBpZGVhIGlzICdtb2RlcmF0ZScgcmlza1xuICAgICAgICAgIG1heGltdW1JZGVhczogNVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhcykudG9IYXZlTGVuZ3RoKDApOyAvLyBTaG91bGQgYmUgZmlsdGVyZWQgb3V0XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLmZpbHRlcmluZ0NyaXRlcmlhKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGNyaXRlcmlvbjogJ3Jpc2tUb2xlcmFuY2UnLFxuICAgICAgICAgIHR5cGU6ICdpbmNsdXNpb24nLFxuICAgICAgICAgIHZhbHVlOiAnY29uc2VydmF0aXZlJ1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZXhjbHVkZSBzcGVjaWZpZWQgaW52ZXN0bWVudHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXItMScsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS01JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiBbJ0FBUEwnXSwgLy8gTW9jayBpbnZlc3RtZW50IHRpY2tlclxuICAgICAgICAgIG1heGltdW1JZGVhczogNVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhcykudG9IYXZlTGVuZ3RoKDApOyAvLyBTaG91bGQgYmUgZmlsdGVyZWQgb3V0XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLmZpbHRlcmluZ0NyaXRlcmlhKS50b0NvbnRhaW5FcXVhbChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIGNyaXRlcmlvbjogJ2V4Y2x1ZGVkSW52ZXN0bWVudHMnLFxuICAgICAgICAgIHR5cGU6ICdleGNsdXNpb24nLFxuICAgICAgICAgIHZhbHVlOiBbJ0FBUEwnXVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbGltaXQgcmVzdWx0cyB0byBtYXhpbXVtIGlkZWFzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gTW9jayBtdWx0aXBsZSBpZGVhc1xuICAgICAgY29uc3QgbXVsdGlwbGVJZGVhcyA9IEFycmF5LmZyb20oeyBsZW5ndGg6IDUgfSwgKF8sIGkpID0+ICh7XG4gICAgICAgIC4uLm1vY2tJbnZlc3RtZW50SWRlYSxcbiAgICAgICAgaWQ6IGBpZGVhLSR7aSArIDF9YCxcbiAgICAgICAgdGl0bGU6IGBJbnZlc3RtZW50IElkZWEgJHtpICsgMX1gLFxuICAgICAgICBjb25maWRlbmNlU2NvcmU6IDAuOCAtIChpICogMC4xKSAvLyBEZWNyZWFzaW5nIGNvbmZpZGVuY2VcbiAgICAgIH0pKTtcblxuICAgICAgbW9ja1N5bnRoZXNpc0FnZW50LnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0ID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgaW52ZXN0bWVudElkZWFzOiBtdWx0aXBsZUlkZWFzLFxuICAgICAgICBleGVjdXRpdmVTdW1tYXJ5OiAnTXVsdGlwbGUgaW52ZXN0bWVudCBvcHBvcnR1bml0aWVzIGlkZW50aWZpZWQnLFxuICAgICAgICBkZXRhaWxlZE5hcnJhdGl2ZTogJ0RldGFpbGVkIGFuYWx5c2lzIG9mIG11bHRpcGxlIG9wcG9ydHVuaXRpZXMnLFxuICAgICAgICBrZXlJbnNpZ2h0czogWydEaXZlcnNlIG9wcG9ydHVuaXRpZXMgYXZhaWxhYmxlJ10sXG4gICAgICAgIHJpc2tTdW1tYXJ5OiAnVmFyaWVkIHJpc2sgcHJvZmlsZXMnLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFtdLFxuICAgICAgICB2aXN1YWxpemF0aW9uczogW10sXG4gICAgICAgIGNvaGVyZW5jZVNjb3JlOiAwLjksXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICAgIGV4ZWN1dGlvblRpbWU6IDEwMDAwXG4gICAgICB9KTtcblxuICAgICAgbW9ja0ludmVzdG1lbnRJZGVhU2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSA9IGplc3QuZm4oKVxuICAgICAgICAubW9ja0ltcGxlbWVudGF0aW9uKChyZXE6IENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlkZWEgPSBtdWx0aXBsZUlkZWFzLmZpbmQoaSA9PiBpLnRpdGxlID09PSByZXEudGl0bGUpIHx8IG1vY2tJbnZlc3RtZW50SWRlYTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIGlkZWEsXG4gICAgICAgICAgICB2YWxpZGF0aW9uOiB7IGlzVmFsaWQ6IHRydWUsIGVycm9yczogW10sIHdhcm5pbmdzOiBbXSB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXItMScsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS02JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDMgLy8gTGltaXQgdG8gMyBpZGVhc1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhcykudG9IYXZlTGVuZ3RoKDMpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhc1swXS5yYW5rKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhc1sxXS5yYW5rKS50b0JlKDIpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhc1syXS5yYW5rKS50b0JlKDMpO1xuICAgICAgXG4gICAgICAvLyBTaG91bGQgYmUgc29ydGVkIGJ5IHJhbmtpbmcgc2NvcmUgKGhpZ2hlciBjb25maWRlbmNlID0gaGlnaGVyIHNjb3JlKVxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhc1swXS5jb25maWRlbmNlU2NvcmUpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwocmVzdWx0LmlkZWFzWzFdLmNvbmZpZGVuY2VTY29yZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWFzWzFdLmNvbmZpZGVuY2VTY29yZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbChyZXN1bHQuaWRlYXNbMl0uY29uZmlkZW5jZVNjb3JlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIHJhbmtpbmcgc2NvcmVzIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTcnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIG1heGltdW1JZGVhczogMVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhcykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgXG4gICAgICBjb25zdCByYW5rZWRJZGVhID0gcmVzdWx0LmlkZWFzWzBdIGFzIFJhbmtlZEludmVzdG1lbnRJZGVhO1xuICAgICAgZXhwZWN0KHJhbmtlZElkZWEucmFua2luZ1Njb3JlKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QocmFua2VkSWRlYS5yYW5raW5nRmFjdG9ycykudG9IYXZlTGVuZ3RoKDUpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayB0aGF0IGFsbCByYW5raW5nIGZhY3RvcnMgYXJlIHByZXNlbnRcbiAgICAgIGNvbnN0IGZhY3Rvck5hbWVzID0gcmFua2VkSWRlYS5yYW5raW5nRmFjdG9ycy5tYXAoZiA9PiBmLmZhY3Rvcik7XG4gICAgICBleHBlY3QoZmFjdG9yTmFtZXMpLnRvQ29udGFpbignY29uZmlkZW5jZScpO1xuICAgICAgZXhwZWN0KGZhY3Rvck5hbWVzKS50b0NvbnRhaW4oJ3Jpc2stcmV0dXJuJyk7XG4gICAgICBleHBlY3QoZmFjdG9yTmFtZXMpLnRvQ29udGFpbigndGltZS1ob3Jpem9uJyk7XG4gICAgICBleHBlY3QoZmFjdG9yTmFtZXMpLnRvQ29udGFpbigncXVhbGl0eS1ub3ZlbHR5Jyk7XG4gICAgICBleHBlY3QoZmFjdG9yTmFtZXMpLnRvQ29udGFpbignbWFya2V0LXRpbWluZycpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayB0aGF0IHdlaWdodHMgc3VtIHRvIDFcbiAgICAgIGNvbnN0IHRvdGFsV2VpZ2h0ID0gcmFua2VkSWRlYS5yYW5raW5nRmFjdG9ycy5yZWR1Y2UoKHN1bSwgZikgPT4gc3VtICsgZi53ZWlnaHQsIDApO1xuICAgICAgZXhwZWN0KHRvdGFsV2VpZ2h0KS50b0JlQ2xvc2VUbygxLjAsIDIpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgY29uZmlkZW5jZSBkaXN0cmlidXRpb24gY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtOCcsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiAxXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKHJlcXVlc3QpO1xuXG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLmNvbmZpZGVuY2VEaXN0cmlidXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLmNvbmZpZGVuY2VEaXN0cmlidXRpb24uaGlnaCkudG9CZSgxKTsgLy8gMC44NSA+IDAuOFxuICAgICAgZXhwZWN0KHJlc3VsdC5tZXRhZGF0YS5jb25maWRlbmNlRGlzdHJpYnV0aW9uLm1lZGl1bSkudG9CZSgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubWV0YWRhdGEuY29uZmlkZW5jZURpc3RyaWJ1dGlvbi5sb3cpLnRvQmUoMCk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLmNvbmZpZGVuY2VEaXN0cmlidXRpb24uYXZlcmFnZSkudG9CZSgwLjg1KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGNvbnRleHQgcGFyYW1ldGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRleHQ6IElkZWFHZW5lcmF0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgdXNlclByb2ZpbGU6IHtcbiAgICAgICAgICBpbnZlc3RtZW50RXhwZXJpZW5jZTogJ2FkdmFuY2VkJyxcbiAgICAgICAgICBwcmVmZXJyZWRTdHJhdGVnaWVzOiBbJ2dyb3d0aCcsICd2YWx1ZSddLFxuICAgICAgICAgIGhpc3RvcmljYWxQcmVmZXJlbmNlczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnXSxcbiAgICAgICAgICByaXNrUHJvZmlsZToge1xuICAgICAgICAgICAgcmlza0NhcGFjaXR5OiA4MCxcbiAgICAgICAgICAgIHJpc2tUb2xlcmFuY2U6IDc1LFxuICAgICAgICAgICAgdGltZUhvcml6b246ICdsb25nJyxcbiAgICAgICAgICAgIGxpcXVpZGl0eU5lZWRzOiAnbG93J1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbWFya2V0Q29udGV4dDoge1xuICAgICAgICAgIGN1cnJlbnRDb25kaXRpb25zOiBbJ2J1bGwtbWFya2V0JywgJ2xvdy12b2xhdGlsaXR5J10sXG4gICAgICAgICAgdm9sYXRpbGl0eUxldmVsOiAnbG93JyxcbiAgICAgICAgICBtYXJrZXRUcmVuZDogJ2J1bGwnLFxuICAgICAgICAgIGVjb25vbWljSW5kaWNhdG9yczogeyAnR0RQLWdyb3d0aCc6IDMuMiwgJ2luZmxhdGlvbic6IDIuMSB9LFxuICAgICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdsb3cnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTknLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIG1heGltdW1JZGVhczogNVxuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChtb2NrUGxhbm5pbmdBZ2VudC5jcmVhdGVSZXNlYXJjaFBsYW4pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAncmVxLTknLFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgY29udGV4dDogY29udGV4dFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja1BsYW5uaW5nQWdlbnQuY3JlYXRlUmVzZWFyY2hQbGFuID0gamVzdC5mbigpLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignUGxhbm5pbmcgZmFpbGVkJykpO1xuXG4gICAgICBjb25zdCByZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXItMScsXG4gICAgICAgIHJlcXVlc3RJZDogJ3JlcS0xMCcsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiA1XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnSW52ZXN0bWVudCBpZGVhIGdlbmVyYXRpb24gZmFpbGVkOiBQbGFubmluZyBmYWlsZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdHJhY2sgcHJvY2Vzc2luZyBtZXRyaWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtMTEnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIG1heGltdW1JZGVhczogNVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5wcm9jZXNzaW5nTWV0cmljcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucHJvY2Vzc2luZ01ldHJpY3MudG90YWxQcm9jZXNzaW5nVGltZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubWV0YWRhdGEucHJvY2Vzc2luZ1N0ZXBzKS50b0hhdmVMZW5ndGgoNSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0ZXBOYW1lcyA9IHJlc3VsdC5tZXRhZGF0YS5wcm9jZXNzaW5nU3RlcHMubWFwKHMgPT4gcy5zdGVwKTtcbiAgICAgIGV4cGVjdChzdGVwTmFtZXMpLnRvRXF1YWwoWydwbGFubmluZycsICdyZXNlYXJjaCcsICdhbmFseXNpcycsICdjb21wbGlhbmNlJywgJ3N5bnRoZXNpcyddKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3V0aWxpdHkgbWV0aG9kcycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHRyYWNrIGFjdGl2ZSByZXF1ZXN0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTEyJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gU3RhcnQgZ2VuZXJhdGlvbiAoZG9uJ3QgYXdhaXQpXG4gICAgICBjb25zdCBnZW5lcmF0aW9uUHJvbWlzZSA9IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKHJlcXVlc3QpO1xuXG4gICAgICAvLyBDaGVjayBhY3RpdmUgcmVxdWVzdFxuICAgICAgY29uc3QgYWN0aXZlUmVxdWVzdCA9IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdldEFjdGl2ZVJlcXVlc3RTdGF0dXMoJ3JlcS0xMicpO1xuICAgICAgZXhwZWN0KGFjdGl2ZVJlcXVlc3QpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoYWN0aXZlUmVxdWVzdD8ucmVxdWVzdElkKS50b0JlKCdyZXEtMTInKTtcblxuICAgICAgLy8gV2FpdCBmb3IgY29tcGxldGlvblxuICAgICAgYXdhaXQgZ2VuZXJhdGlvblByb21pc2U7XG5cbiAgICAgIC8vIFNob3VsZCBubyBsb25nZXIgYmUgYWN0aXZlXG4gICAgICBjb25zdCBjb21wbGV0ZWRSZXF1ZXN0ID0gb3JjaGVzdHJhdGlvblNlcnZpY2UuZ2V0QWN0aXZlUmVxdWVzdFN0YXR1cygncmVxLTEyJyk7XG4gICAgICBleHBlY3QoY29tcGxldGVkUmVxdWVzdCkudG9CZVVuZGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjYW5jZWwgYWN0aXZlIHJlcXVlc3RzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtMTMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIG1heGltdW1JZGVhczogNVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBTdGFydCBnZW5lcmF0aW9uIChkb24ndCBhd2FpdClcbiAgICAgIG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKHJlcXVlc3QpO1xuXG4gICAgICAvLyBDYW5jZWwgcmVxdWVzdFxuICAgICAgY29uc3QgY2FuY2VsbGVkID0gb3JjaGVzdHJhdGlvblNlcnZpY2UuY2FuY2VsUmVxdWVzdCgncmVxLTEzJyk7XG4gICAgICBleHBlY3QoY2FuY2VsbGVkKS50b0JlKHRydWUpO1xuXG4gICAgICAvLyBTaG91bGQgbm8gbG9uZ2VyIGJlIGFjdGl2ZVxuICAgICAgY29uc3QgYWN0aXZlUmVxdWVzdCA9IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdldEFjdGl2ZVJlcXVlc3RTdGF0dXMoJ3JlcS0xMycpO1xuICAgICAgZXhwZWN0KGFjdGl2ZVJlcXVlc3QpLnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvdmlkZSBwcm9jZXNzaW5nIHN0YXRpc3RpY3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0cyA9IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdldFByb2Nlc3NpbmdTdGF0aXN0aWNzKCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChzdGF0cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzdGF0cy5hY3RpdmVSZXF1ZXN0cykudG9CZSgwKTtcbiAgICAgIGV4cGVjdCh0eXBlb2Ygc3RhdHMudG90YWxQcm9jZXNzZWQpLnRvQmUoJ251bWJlcicpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBzdGF0cy5hdmVyYWdlUHJvY2Vzc2luZ1RpbWUpLnRvQmUoJ251bWJlcicpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZmlsdGVyaW5nIGxvZ2ljJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY29ycmVjdGx5IGlkZW50aWZ5IGNvbXBhdGlibGUgdGltZSBob3Jpem9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIFRlc3Qgd2l0aCBjb21wYXRpYmxlIHRpbWUgaG9yaXpvblxuICAgICAgY29uc3QgY29tcGF0aWJsZVJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTE0JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtJywgLy8gU2hvdWxkIGJlIGNvbXBhdGlibGUgd2l0aCAnbG9uZycgKHdpdGhpbiAxIGxldmVsKVxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiA1XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG9yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKGNvbXBhdGlibGVSZXF1ZXN0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYXMpLnRvSGF2ZUxlbmd0aCgxKTsgLy8gU2hvdWxkIHBhc3MgZmlsdGVyXG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNvcnJlY3RseSBpZGVudGlmeSBjb21wYXRpYmxlIHJpc2sgbGV2ZWxzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gVGVzdCB3aXRoIGNvbXBhdGlibGUgcmlzayBsZXZlbFxuICAgICAgY29uc3QgY29tcGF0aWJsZVJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xJyxcbiAgICAgICAgcmVxdWVzdElkOiAncmVxLTE1JyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZycsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJywgLy8gU2hvdWxkIGJlIGNvbXBhdGlibGUgd2l0aCAnbW9kZXJhdGUnIHJpc2sgbGV2ZWxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMoY29tcGF0aWJsZVJlcXVlc3QpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhcykudG9IYXZlTGVuZ3RoKDEpOyAvLyBTaG91bGQgcGFzcyBmaWx0ZXJcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbWF0Y2ggYXNzZXQgY2xhc3MgY3JpdGVyaWEgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtMTYnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIGFzc2V0Q2xhc3NlczogWydzdG9jayddLCAvLyBTaG91bGQgbWF0Y2ggbW9jayBpbnZlc3RtZW50IHR5cGVcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgb3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMocmVxdWVzdCk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWFzKS50b0hhdmVMZW5ndGgoMSk7IC8vIFNob3VsZCBwYXNzIGZpbHRlclxuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBtYXRjaCB0YXJnZXQgYXVkaWVuY2UgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyLTEnLFxuICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtMTcnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdsb25nJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIHRhcmdldEF1ZGllbmNlOiBbJ3JldGFpbCddLCAvLyBTaG91bGQgbWF0Y2ggbW9jayBpZGVhIHRhcmdldCBhdWRpZW5jZVxuICAgICAgICAgIG1heGltdW1JZGVhczogNVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBvcmNoZXN0cmF0aW9uU2VydmljZS5nZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXF1ZXN0KTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYXMpLnRvSGF2ZUxlbmd0aCgxKTsgLy8gU2hvdWxkIHBhc3MgZmlsdGVyXG4gICAgfSk7XG4gIH0pO1xufSk7Il19