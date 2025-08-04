"use strict";
/**
 * Planning Agent Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const planning_agent_1 = require("../ai/planning-agent");
const claude_sonnet_service_1 = require("../ai/claude-sonnet-service");
const bedrock_client_1 = require("../ai/bedrock-client");
const bedrock_1 = require("../../models/bedrock");
// Mock the Bedrock client
jest.mock('../ai/bedrock-client');
const MockedBedrockClient = bedrock_client_1.BedrockClientService;
describe('PlanningAgent', () => {
    let planningAgent;
    let mockBedrockClient;
    let claudeSonnetService;
    beforeEach(() => {
        // Create mock Bedrock client
        mockBedrockClient = new MockedBedrockClient();
        // Mock the getModelConfig method
        mockBedrockClient.getModelConfig.mockReturnValue({
            modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
            maxTokens: 4000,
            temperature: 0.7,
            topP: 0.9,
            stopSequences: []
        });
        // Mock the invokeModel method
        mockBedrockClient.invokeModel.mockResolvedValue({
            completion: JSON.stringify({
                objectives: ['Analyze market trends', 'Identify investment opportunities'],
                researchQuestions: ['What are the current market conditions?', 'Which sectors show growth potential?'],
                dataSources: [
                    {
                        source: 'Market Data Feed',
                        type: 'market',
                        priority: 'high',
                        estimatedTime: 5000,
                        dependencies: []
                    },
                    {
                        source: 'Financial Reports',
                        type: 'public',
                        priority: 'medium',
                        estimatedTime: 8000,
                        dependencies: ['Market Data Feed']
                    }
                ],
                methodology: 'Comprehensive multi-source analysis',
                expectedOutcomes: ['Investment recommendations', 'Risk assessment'],
                riskFactors: ['Data availability', 'Market volatility']
            }),
            modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
            usage: {
                inputTokens: 100,
                outputTokens: 200,
                totalTokens: 300
            },
            requestId: 'test-request-1',
            finishReason: 'stop'
        });
        // Create Claude Sonnet service
        claudeSonnetService = new claude_sonnet_service_1.ClaudeSonnetService(mockBedrockClient);
        // Create planning agent in test mode
        planningAgent = new planning_agent_1.PlanningAgent(claudeSonnetService, true);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createResearchPlan', () => {
        it('should create a comprehensive research plan', async () => {
            const context = {
                requestType: 'investment-analysis',
                parameters: {
                    sector: 'technology',
                    timeHorizon: 'medium'
                },
                userPreferences: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate',
                    sectors: ['technology', 'healthcare']
                },
                constraints: {
                    timeLimit: 60000,
                    complianceRequirements: ['SEC regulations']
                }
            };
            const researchPlan = await planningAgent.createResearchPlan('conv_123', context);
            expect(researchPlan).toBeDefined();
            expect(researchPlan.id).toMatch(/^research_plan_/);
            expect(researchPlan.conversationId).toBe('conv_123');
            expect(researchPlan.objectives).toHaveLength(2);
            expect(researchPlan.objectives).toContain('Analyze market trends');
            expect(researchPlan.objectives).toContain('Identify investment opportunities');
            expect(researchPlan.researchQuestions).toHaveLength(2);
            expect(researchPlan.dataSources).toHaveLength(2);
            expect(researchPlan.dataSources[0].source).toBe('Market Data Feed');
            expect(researchPlan.dataSources[0].type).toBe('market');
            expect(researchPlan.dataSources[0].priority).toBe('high');
            expect(researchPlan.status).toBe('draft');
            expect(mockBedrockClient.invokeModel).toHaveBeenCalledTimes(1);
        });
        it('should handle errors gracefully', async () => {
            mockBedrockClient.invokeModel.mockRejectedValue(new Error('API Error'));
            const context = {
                requestType: 'investment-analysis',
                parameters: {}
            };
            await expect(planningAgent.createResearchPlan('conv_123', context))
                .rejects.toThrow('Failed to create research plan: API Error');
        });
        it('should handle malformed AI responses', async () => {
            mockBedrockClient.invokeModel.mockResolvedValue({
                completion: 'Invalid JSON response',
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
                requestId: 'test-request-1',
                finishReason: 'stop'
            });
            const context = {
                requestType: 'investment-analysis',
                parameters: {}
            };
            const researchPlan = await planningAgent.createResearchPlan('conv_123', context);
            // Should create a plan with default values
            expect(researchPlan).toBeDefined();
            expect(researchPlan.objectives).toEqual(['Generate investment insights']);
            expect(researchPlan.researchQuestions).toEqual(['What are the key investment opportunities?']);
        });
    });
    describe('createAnalysisPlan', () => {
        it('should create a detailed analysis plan', async () => {
            // Mock response for analysis plan
            mockBedrockClient.invokeModel.mockResolvedValue({
                completion: JSON.stringify({
                    analysisType: 'mixed',
                    analysisSteps: [
                        {
                            step: 'Data Collection',
                            description: 'Gather market data and financial reports',
                            requiredData: ['market_data', 'financial_reports'],
                            expectedOutput: 'Structured dataset',
                            estimatedTime: 10000,
                            dependencies: [],
                            agent: 'research'
                        },
                        {
                            step: 'Financial Analysis',
                            description: 'Analyze financial metrics and ratios',
                            requiredData: ['financial_reports'],
                            expectedOutput: 'Financial analysis report',
                            estimatedTime: 15000,
                            dependencies: ['Data Collection'],
                            agent: 'analysis'
                        }
                    ],
                    metrics: ['ROI', 'Risk-adjusted return', 'Volatility', 'Sharpe ratio'],
                    validationCriteria: ['Data consistency', 'Model accuracy', 'Statistical significance'],
                    confidenceThresholds: {
                        minimum: 0.75,
                        target: 0.90
                    }
                }),
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: { inputTokens: 150, outputTokens: 250, totalTokens: 400 },
                requestId: 'test-request-2',
                finishReason: 'stop'
            });
            const context = {
                requestType: 'investment-analysis',
                parameters: { sector: 'technology' }
            };
            const researchPlan = {
                id: 'research_plan_123',
                conversationId: 'conv_123',
                objectives: ['Analyze market trends'],
                researchQuestions: ['What are the current market conditions?'],
                dataSources: [
                    {
                        source: 'Market Data Feed',
                        type: 'market',
                        priority: 'high',
                        estimatedTime: 5000,
                        dependencies: []
                    }
                ],
                methodology: 'Comprehensive analysis',
                expectedOutcomes: ['Investment recommendations'],
                riskFactors: ['Data availability'],
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            const analysisPlan = await planningAgent.createAnalysisPlan('conv_123', context, researchPlan);
            expect(analysisPlan).toBeDefined();
            expect(analysisPlan.id).toMatch(/^analysis_plan_/);
            expect(analysisPlan.conversationId).toBe('conv_123');
            expect(analysisPlan.analysisType).toBe('mixed');
            expect(analysisPlan.analysisSteps).toHaveLength(2);
            expect(analysisPlan.analysisSteps[0].step).toBe('Data Collection');
            expect(analysisPlan.analysisSteps[0].agent).toBe('research');
            expect(analysisPlan.analysisSteps[1].step).toBe('Financial Analysis');
            expect(analysisPlan.analysisSteps[1].agent).toBe('analysis');
            expect(analysisPlan.metrics).toContain('ROI');
            expect(analysisPlan.metrics).toContain('Sharpe ratio');
            expect(analysisPlan.confidenceThresholds.minimum).toBe(0.75);
            expect(analysisPlan.confidenceThresholds.target).toBe(0.90);
            expect(analysisPlan.status).toBe('draft');
        });
    });
    describe('analyzeDependencies', () => {
        it('should analyze task dependencies correctly', async () => {
            // Mock response for dependency analysis
            mockBedrockClient.invokeModel.mockResolvedValue({
                completion: JSON.stringify({
                    dependencies: [
                        {
                            taskId: 'research_0_market_data_feed',
                            dependsOn: [],
                            blockedBy: ['research_1_financial_reports'],
                            criticalPath: true
                        },
                        {
                            taskId: 'research_1_financial_reports',
                            dependsOn: ['research_0_market_data_feed'],
                            blockedBy: [],
                            criticalPath: false
                        }
                    ]
                }),
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: { inputTokens: 200, outputTokens: 150, totalTokens: 350 },
                requestId: 'test-request-3',
                finishReason: 'stop'
            });
            const researchPlan = {
                id: 'research_plan_123',
                conversationId: 'conv_123',
                objectives: ['Analyze market trends'],
                researchQuestions: ['What are the current market conditions?'],
                dataSources: [
                    {
                        source: 'Market Data Feed',
                        type: 'market',
                        priority: 'high',
                        estimatedTime: 5000,
                        dependencies: []
                    },
                    {
                        source: 'Financial Reports',
                        type: 'public',
                        priority: 'medium',
                        estimatedTime: 8000,
                        dependencies: ['research_0_market_data_feed']
                    }
                ],
                methodology: 'Comprehensive analysis',
                expectedOutcomes: ['Investment recommendations'],
                riskFactors: ['Data availability'],
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            const analysisPlan = {
                id: 'analysis_plan_123',
                conversationId: 'conv_123',
                analysisType: 'mixed',
                analysisSteps: [
                    {
                        step: 'Data Analysis',
                        description: 'Analyze collected data',
                        requiredData: ['market_data'],
                        expectedOutput: 'Analysis results',
                        estimatedTime: 10000,
                        dependencies: [],
                        agent: 'analysis'
                    }
                ],
                metrics: ['ROI'],
                validationCriteria: ['Data consistency'],
                confidenceThresholds: { minimum: 0.7, target: 0.85 },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            const dependencies = await planningAgent.analyzeDependencies(researchPlan, analysisPlan);
            expect(dependencies).toBeDefined();
            expect(dependencies.size).toBeGreaterThan(0);
            // Check that research tasks were created
            const marketDataTask = dependencies.get('research_0_market_data_feed');
            expect(marketDataTask).toBeDefined();
            expect(marketDataTask?.estimatedDuration).toBe(5000);
            expect(marketDataTask?.criticalPath).toBe(true);
            const financialReportsTask = dependencies.get('research_1_financial_reports');
            expect(financialReportsTask).toBeDefined();
            expect(financialReportsTask?.estimatedDuration).toBe(8000);
            expect(financialReportsTask?.dependsOn).toEqual(['research_0_market_data_feed']);
        });
    });
    describe('estimateResources', () => {
        it('should estimate resource requirements accurately', async () => {
            // Mock response for resource estimation
            mockBedrockClient.invokeModel.mockResolvedValue({
                completion: JSON.stringify({
                    totalEstimatedTime: 45000,
                    agentAllocations: [
                        { agent: 'research', estimatedTime: 15000, taskCount: 2, utilizationRate: 0.8 },
                        { agent: 'analysis', estimatedTime: 20000, taskCount: 3, utilizationRate: 0.9 },
                        { agent: 'compliance', estimatedTime: 5000, taskCount: 1, utilizationRate: 0.7 },
                        { agent: 'synthesis', estimatedTime: 5000, taskCount: 1, utilizationRate: 0.6 }
                    ],
                    dataRequirements: [
                        { source: 'Market Data', volume: 'Large', processingTime: 8000 },
                        { source: 'Financial Reports', volume: 'Medium', processingTime: 5000 }
                    ],
                    computationalRequirements: {
                        modelCalls: 8,
                        estimatedCost: 0.75,
                        memoryRequirements: '4GB'
                    },
                    riskFactors: [
                        { factor: 'Data quality', impact: 'high', mitigation: 'Validate data sources' },
                        { factor: 'Model performance', impact: 'medium', mitigation: 'Use ensemble methods' }
                    ]
                }),
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: { inputTokens: 180, outputTokens: 220, totalTokens: 400 },
                requestId: 'test-request-4',
                finishReason: 'stop'
            });
            const researchPlan = {
                id: 'research_plan_123',
                conversationId: 'conv_123',
                objectives: ['Analyze market trends'],
                researchQuestions: ['What are the current market conditions?'],
                dataSources: [
                    {
                        source: 'Market Data Feed',
                        type: 'market',
                        priority: 'high',
                        estimatedTime: 5000,
                        dependencies: []
                    }
                ],
                methodology: 'Comprehensive analysis',
                expectedOutcomes: ['Investment recommendations'],
                riskFactors: ['Data availability'],
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            const analysisPlan = {
                id: 'analysis_plan_123',
                conversationId: 'conv_123',
                analysisType: 'mixed',
                analysisSteps: [
                    {
                        step: 'Data Analysis',
                        description: 'Analyze collected data',
                        requiredData: ['market_data'],
                        expectedOutput: 'Analysis results',
                        estimatedTime: 10000,
                        dependencies: [],
                        agent: 'analysis'
                    }
                ],
                metrics: ['ROI'],
                validationCriteria: ['Data consistency'],
                confidenceThresholds: { minimum: 0.7, target: 0.85 },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            const dependencies = new Map();
            const estimation = await planningAgent.estimateResources(researchPlan, analysisPlan, dependencies);
            expect(estimation).toBeDefined();
            expect(estimation.totalEstimatedTime).toBe(45000);
            expect(estimation.agentAllocations).toHaveLength(4);
            expect(estimation.agentAllocations[0].agent).toBe('research');
            expect(estimation.agentAllocations[0].estimatedTime).toBe(15000);
            expect(estimation.agentAllocations[1].agent).toBe('analysis');
            expect(estimation.agentAllocations[1].estimatedTime).toBe(20000);
            expect(estimation.dataRequirements).toHaveLength(2);
            expect(estimation.computationalRequirements.modelCalls).toBe(8);
            expect(estimation.computationalRequirements.estimatedCost).toBe(0.75);
            expect(estimation.riskFactors).toHaveLength(2);
            expect(estimation.riskFactors[0].factor).toBe('Data quality');
            expect(estimation.riskFactors[0].impact).toBe('high');
        });
    });
    describe('adaptPlan', () => {
        it('should adapt plan based on intermediate findings', async () => {
            // First create a research plan
            const context = {
                requestType: 'investment-analysis',
                parameters: { sector: 'technology' }
            };
            const researchPlan = await planningAgent.createResearchPlan('conv_123', context);
            // Create an analysis plan
            const analysisPlan = {
                id: 'analysis_plan_123',
                conversationId: 'conv_123',
                analysisType: 'mixed',
                analysisSteps: [
                    {
                        step: 'Data Analysis',
                        description: 'Analyze collected data',
                        requiredData: ['market_data'],
                        expectedOutput: 'Analysis results',
                        estimatedTime: 10000,
                        dependencies: [],
                        agent: 'analysis'
                    }
                ],
                metrics: ['ROI'],
                validationCriteria: ['Data consistency'],
                confidenceThresholds: { minimum: 0.7, target: 0.85 },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            // Create resource estimation first
            const dependencies = new Map();
            await planningAgent.estimateResources(researchPlan, analysisPlan, dependencies);
            // Mock response for plan adaptation
            mockBedrockClient.invokeModel.mockResolvedValueOnce({
                completion: JSON.stringify({
                    changes: [
                        {
                            type: 'add',
                            target: 'data-source',
                            description: 'Add ESG data source for sustainability analysis',
                            impact: 'Increases analysis time by 15%'
                        },
                        {
                            type: 'modify',
                            target: 'research-question',
                            description: 'Expand research questions to include ESG factors',
                            impact: 'Minimal impact on timeline'
                        }
                    ],
                    justification: 'Intermediate findings show strong ESG correlation with performance',
                    approvalRequired: false
                }),
                modelId: bedrock_1.BedrockModelId.CLAUDE_SONNET_3_7,
                usage: { inputTokens: 250, outputTokens: 180, totalTokens: 430 },
                requestId: 'test-request-5',
                finishReason: 'stop'
            });
            const intermediateFindings = {
                esgCorrelation: 0.85,
                sustainabilityTrends: 'increasing',
                regulatoryChanges: 'new ESG requirements'
            };
            const adaptation = await planningAgent.adaptPlan(researchPlan.id, 'research', intermediateFindings, 'ESG correlation discovered');
            expect(adaptation).toBeDefined();
            expect(adaptation.adaptationId).toMatch(/^adaptation_/);
            expect(adaptation.originalPlanId).toBe(researchPlan.id);
            expect(adaptation.trigger).toBe('ESG correlation discovered');
            expect(adaptation.changes).toHaveLength(2);
            expect(adaptation.changes[0].type).toBe('add');
            expect(adaptation.changes[0].target).toBe('data-source');
            expect(adaptation.changes[1].type).toBe('modify');
            expect(adaptation.changes[1].target).toBe('research-question');
            expect(adaptation.approvalRequired).toBe(false);
            expect(adaptation.justification).toContain('ESG correlation');
        });
    });
    describe('processMessage', () => {
        it('should process research plan message correctly', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'planning',
                messageType: 'request',
                content: {
                    taskType: planning_agent_1.PlanningTaskType.RESEARCH_PLAN,
                    conversationId: 'conv_123',
                    context: {
                        requestType: 'investment-analysis',
                        parameters: { sector: 'technology' }
                    }
                },
                metadata: {
                    priority: 'high',
                    timestamp: new Date(),
                    conversationId: 'conv_123',
                    requestId: 'req_123'
                }
            };
            const response = await planningAgent.processMessage(message);
            expect(response).toBeDefined();
            expect(response.sender).toBe('planning');
            expect(response.recipient).toBe('supervisor');
            expect(response.messageType).toBe('response');
            expect(response.content.success).toBe(true);
            expect(response.content.result).toBeDefined();
            expect(response.content.result.id).toMatch(/^research_plan_/);
        });
        it('should handle unknown task types', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'planning',
                messageType: 'request',
                content: {
                    taskType: 'unknown-task',
                    conversationId: 'conv_123'
                },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv_123',
                    requestId: 'req_123'
                }
            };
            const response = await planningAgent.processMessage(message);
            expect(response).toBeDefined();
            expect(response.messageType).toBe('error');
            expect(response.content.success).toBe(false);
            expect(response.content.error).toContain('Unknown planning task type');
        });
    });
    describe('getter methods', () => {
        it('should retrieve research plans correctly', async () => {
            const context = {
                requestType: 'investment-analysis',
                parameters: { sector: 'technology' }
            };
            const researchPlan = await planningAgent.createResearchPlan('conv_123', context);
            const retrieved = planningAgent.getResearchPlan(researchPlan.id);
            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(researchPlan.id);
            expect(retrieved?.conversationId).toBe('conv_123');
        });
        it('should return undefined for non-existent plans', () => {
            const retrieved = planningAgent.getResearchPlan('non-existent-id');
            expect(retrieved).toBeUndefined();
        });
        it('should retrieve task dependencies', async () => {
            const researchPlan = {
                id: 'research_plan_123',
                conversationId: 'conv_123',
                objectives: ['Test'],
                researchQuestions: ['Test?'],
                dataSources: [
                    {
                        source: 'Test Source',
                        type: 'market',
                        priority: 'high',
                        estimatedTime: 5000,
                        dependencies: []
                    }
                ],
                methodology: 'Test',
                expectedOutcomes: ['Test'],
                riskFactors: ['Test'],
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            const analysisPlan = {
                id: 'analysis_plan_123',
                conversationId: 'conv_123',
                analysisType: 'mixed',
                analysisSteps: [],
                metrics: [],
                validationCriteria: [],
                confidenceThresholds: { minimum: 0.7, target: 0.85 },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            await planningAgent.analyzeDependencies(researchPlan, analysisPlan);
            const dependencies = planningAgent.getTaskDependencies();
            expect(dependencies).toBeDefined();
            expect(dependencies.size).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbm5pbmctYWdlbnQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vcGxhbm5pbmctYWdlbnQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgseURBQW9IO0FBQ3BILHVFQUFrRTtBQUNsRSx5REFBNEQ7QUFDNUQsa0RBQXNEO0FBR3RELDBCQUEwQjtBQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDbEMsTUFBTSxtQkFBbUIsR0FBRyxxQ0FBcUUsQ0FBQztBQUVsRyxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixJQUFJLGFBQTRCLENBQUM7SUFDakMsSUFBSSxpQkFBb0QsQ0FBQztJQUN6RCxJQUFJLG1CQUF3QyxDQUFDO0lBRTdDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCw2QkFBNkI7UUFDN0IsaUJBQWlCLEdBQUcsSUFBSSxtQkFBbUIsRUFBdUMsQ0FBQztRQUVuRixpQ0FBaUM7UUFDakMsaUJBQWlCLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQztZQUMvQyxPQUFPLEVBQUUsd0JBQWMsQ0FBQyxpQkFBaUI7WUFDekMsU0FBUyxFQUFFLElBQUk7WUFDZixXQUFXLEVBQUUsR0FBRztZQUNoQixJQUFJLEVBQUUsR0FBRztZQUNULGFBQWEsRUFBRSxFQUFFO1NBQ2xCLENBQUMsQ0FBQztRQUVILDhCQUE4QjtRQUM5QixpQkFBaUIsQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUM7WUFDOUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ3pCLFVBQVUsRUFBRSxDQUFDLHVCQUF1QixFQUFFLG1DQUFtQyxDQUFDO2dCQUMxRSxpQkFBaUIsRUFBRSxDQUFDLHlDQUF5QyxFQUFFLHNDQUFzQyxDQUFDO2dCQUN0RyxXQUFXLEVBQUU7b0JBQ1g7d0JBQ0UsTUFBTSxFQUFFLGtCQUFr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Q0FBQyxNQUFNLENBQUM7Z0JBQzFCLFdBQVcsRUFBRSxDQUFDLE1BQU0sQ0FBQztnQkFDckIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUNyQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLE1BQU0sRUFBRSxPQUFPO2FBQ2hCLENBQUM7WUFFRixNQUFNLFlBQVksR0FBaUI7Z0JBQ2pDLEVBQUUsRUFBRSxtQkFBbUI7Z0JBQ3ZCLGNBQWMsRUFBRSxVQUFVO2dCQUMxQixZQUFZLEVBQUUsT0FBTztnQkFDckIsYUFBYSxFQUFFLEVBQUU7Z0JBQ2pCLE9BQU8sRUFBRSxFQUFFO2dCQUNYLGtCQUFrQixFQUFFLEVBQUU7Z0JBQ3RCLG9CQUFvQixFQUFFLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO2dCQUNwRCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLE9BQU87YUFDaEIsQ0FBQztZQUVGLE1BQU0sYUFBYSxDQUFDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNwRSxNQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUV6RCxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQbGFubmluZyBBZ2VudCBUZXN0c1xuICovXG5cbmltcG9ydCB7IFBsYW5uaW5nQWdlbnQsIFBsYW5uaW5nVGFza1R5cGUsIFBsYW5uaW5nQ29udGV4dCwgUmVzZWFyY2hQbGFuLCBBbmFseXNpc1BsYW4gfSBmcm9tICcuLi9haS9wbGFubmluZy1hZ2VudCc7XG5pbXBvcnQgeyBDbGF1ZGVTb25uZXRTZXJ2aWNlIH0gZnJvbSAnLi4vYWkvY2xhdWRlLXNvbm5ldC1zZXJ2aWNlJztcbmltcG9ydCB7IEJlZHJvY2tDbGllbnRTZXJ2aWNlIH0gZnJvbSAnLi4vYWkvYmVkcm9jay1jbGllbnQnO1xuaW1wb3J0IHsgQmVkcm9ja01vZGVsSWQgfSBmcm9tICcuLi8uLi9tb2RlbHMvYmVkcm9jayc7XG5pbXBvcnQgeyBBZ2VudE1lc3NhZ2UgfSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuXG4vLyBNb2NrIHRoZSBCZWRyb2NrIGNsaWVudFxuamVzdC5tb2NrKCcuLi9haS9iZWRyb2NrLWNsaWVudCcpO1xuY29uc3QgTW9ja2VkQmVkcm9ja0NsaWVudCA9IEJlZHJvY2tDbGllbnRTZXJ2aWNlIGFzIGplc3QuTW9ja2VkQ2xhc3M8dHlwZW9mIEJlZHJvY2tDbGllbnRTZXJ2aWNlPjtcblxuZGVzY3JpYmUoJ1BsYW5uaW5nQWdlbnQnLCAoKSA9PiB7XG4gIGxldCBwbGFubmluZ0FnZW50OiBQbGFubmluZ0FnZW50O1xuICBsZXQgbW9ja0JlZHJvY2tDbGllbnQ6IGplc3QuTW9ja2VkPEJlZHJvY2tDbGllbnRTZXJ2aWNlPjtcbiAgbGV0IGNsYXVkZVNvbm5ldFNlcnZpY2U6IENsYXVkZVNvbm5ldFNlcnZpY2U7XG5cbiAgYmVmb3JlRWFjaCgoKSA9PiB7XG4gICAgLy8gQ3JlYXRlIG1vY2sgQmVkcm9jayBjbGllbnRcbiAgICBtb2NrQmVkcm9ja0NsaWVudCA9IG5ldyBNb2NrZWRCZWRyb2NrQ2xpZW50KCkgYXMgamVzdC5Nb2NrZWQ8QmVkcm9ja0NsaWVudFNlcnZpY2U+O1xuICAgIFxuICAgIC8vIE1vY2sgdGhlIGdldE1vZGVsQ29uZmlnIG1ldGhvZFxuICAgIG1vY2tCZWRyb2NrQ2xpZW50LmdldE1vZGVsQ29uZmlnLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfU09OTkVUXzNfNyxcbiAgICAgIG1heFRva2VuczogNDAwMCxcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjcsXG4gICAgICB0b3BQOiAwLjksXG4gICAgICBzdG9wU2VxdWVuY2VzOiBbXVxuICAgIH0pO1xuXG4gICAgLy8gTW9jayB0aGUgaW52b2tlTW9kZWwgbWV0aG9kXG4gICAgbW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICBvYmplY3RpdmVzOiBbJ0FuYWx5emUgbWFya2V0IHRyZW5kcycsICdJZGVudGlmeSBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMnXSxcbiAgICAgICAgcmVzZWFyY2hRdWVzdGlvbnM6IFsnV2hhdCBhcmUgdGhlIGN1cnJlbnQgbWFya2V0IGNvbmRpdGlvbnM/JywgJ1doaWNoIHNlY3RvcnMgc2hvdyBncm93dGggcG90ZW50aWFsPyddLFxuICAgICAgICBkYXRhU291cmNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNvdXJjZTogJ01hcmtldCBEYXRhIEZlZWQnLFxuICAgICAgICAgICAgdHlwZTogJ21hcmtldCcsXG4gICAgICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgICAgICAgZXN0aW1hdGVkVGltZTogNTAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogW11cbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNvdXJjZTogJ0ZpbmFuY2lhbCBSZXBvcnRzJyxcbiAgICAgICAgICAgIHR5cGU6ICdwdWJsaWMnLFxuICAgICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgICAgZXN0aW1hdGVkVGltZTogODAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogWydNYXJrZXQgRGF0YSBGZWVkJ11cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIG1ldGhvZG9sb2d5OiAnQ29tcHJlaGVuc2l2ZSBtdWx0aS1zb3VyY2UgYW5hbHlzaXMnLFxuICAgICAgICBleHBlY3RlZE91dGNvbWVzOiBbJ0ludmVzdG1lbnQgcmVjb21tZW5kYXRpb25zJywgJ1Jpc2sgYXNzZXNzbWVudCddLFxuICAgICAgICByaXNrRmFjdG9yczogWydEYXRhIGF2YWlsYWJpbGl0eScsICdNYXJrZXQgdm9sYXRpbGl0eSddXG4gICAgICB9KSxcbiAgICAgIG1vZGVsSWQ6IEJlZHJvY2tNb2RlbElkLkNMQVVERV9TT05ORVRfM183LFxuICAgICAgdXNhZ2U6IHtcbiAgICAgICAgaW5wdXRUb2tlbnM6IDEwMCxcbiAgICAgICAgb3V0cHV0VG9rZW5zOiAyMDAsXG4gICAgICAgIHRvdGFsVG9rZW5zOiAzMDBcbiAgICAgIH0sXG4gICAgICByZXF1ZXN0SWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIENsYXVkZSBTb25uZXQgc2VydmljZVxuICAgIGNsYXVkZVNvbm5ldFNlcnZpY2UgPSBuZXcgQ2xhdWRlU29ubmV0U2VydmljZShtb2NrQmVkcm9ja0NsaWVudCk7XG5cbiAgICAvLyBDcmVhdGUgcGxhbm5pbmcgYWdlbnQgaW4gdGVzdCBtb2RlXG4gICAgcGxhbm5pbmdBZ2VudCA9IG5ldyBQbGFubmluZ0FnZW50KGNsYXVkZVNvbm5ldFNlcnZpY2UsIHRydWUpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIGplc3QuY2xlYXJBbGxNb2NrcygpO1xuICB9KTtcblxuICBkZXNjcmliZSgnY3JlYXRlUmVzZWFyY2hQbGFuJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY3JlYXRlIGEgY29tcHJlaGVuc2l2ZSByZXNlYXJjaCBwbGFuJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGV4dDogUGxhbm5pbmdDb250ZXh0ID0ge1xuICAgICAgICByZXF1ZXN0VHlwZTogJ2ludmVzdG1lbnQtYW5hbHlzaXMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgc2VjdG9yOiAndGVjaG5vbG9neScsXG4gICAgICAgICAgdGltZUhvcml6b246ICdtZWRpdW0nXG4gICAgICAgIH0sXG4gICAgICAgIHVzZXJQcmVmZXJlbmNlczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIHNlY3RvcnM6IFsndGVjaG5vbG9neScsICdoZWFsdGhjYXJlJ11cbiAgICAgICAgfSxcbiAgICAgICAgY29uc3RyYWludHM6IHtcbiAgICAgICAgICB0aW1lTGltaXQ6IDYwMDAwLFxuICAgICAgICAgIGNvbXBsaWFuY2VSZXF1aXJlbWVudHM6IFsnU0VDIHJlZ3VsYXRpb25zJ11cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzZWFyY2hQbGFuID0gYXdhaXQgcGxhbm5pbmdBZ2VudC5jcmVhdGVSZXNlYXJjaFBsYW4oJ2NvbnZfMTIzJywgY29udGV4dCk7XG5cbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzZWFyY2hQbGFuLmlkKS50b01hdGNoKC9ecmVzZWFyY2hfcGxhbl8vKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4uY29udmVyc2F0aW9uSWQpLnRvQmUoJ2NvbnZfMTIzJyk7XG4gICAgICBleHBlY3QocmVzZWFyY2hQbGFuLm9iamVjdGl2ZXMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4ub2JqZWN0aXZlcykudG9Db250YWluKCdBbmFseXplIG1hcmtldCB0cmVuZHMnKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4ub2JqZWN0aXZlcykudG9Db250YWluKCdJZGVudGlmeSBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMnKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4ucmVzZWFyY2hRdWVzdGlvbnMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4uZGF0YVNvdXJjZXMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4uZGF0YVNvdXJjZXNbMF0uc291cmNlKS50b0JlKCdNYXJrZXQgRGF0YSBGZWVkJyk7XG4gICAgICBleHBlY3QocmVzZWFyY2hQbGFuLmRhdGFTb3VyY2VzWzBdLnR5cGUpLnRvQmUoJ21hcmtldCcpO1xuICAgICAgZXhwZWN0KHJlc2VhcmNoUGxhbi5kYXRhU291cmNlc1swXS5wcmlvcml0eSkudG9CZSgnaGlnaCcpO1xuICAgICAgZXhwZWN0KHJlc2VhcmNoUGxhbi5zdGF0dXMpLnRvQmUoJ2RyYWZ0Jyk7XG4gICAgICBleHBlY3QobW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygxKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIGVycm9ycyBncmFjZWZ1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwubW9ja1JlamVjdGVkVmFsdWUobmV3IEVycm9yKCdBUEkgRXJyb3InKSk7XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IFBsYW5uaW5nQ29udGV4dCA9IHtcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdpbnZlc3RtZW50LWFuYWx5c2lzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChwbGFubmluZ0FnZW50LmNyZWF0ZVJlc2VhcmNoUGxhbignY29udl8xMjMnLCBjb250ZXh0KSlcbiAgICAgICAgLnJlamVjdHMudG9UaHJvdygnRmFpbGVkIHRvIGNyZWF0ZSByZXNlYXJjaCBwbGFuOiBBUEkgRXJyb3InKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG1hbGZvcm1lZCBBSSByZXNwb25zZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrQmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246ICdJbnZhbGlkIEpTT04gcmVzcG9uc2UnLFxuICAgICAgICBtb2RlbElkOiBCZWRyb2NrTW9kZWxJZC5DTEFVREVfU09OTkVUXzNfNyxcbiAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDEwMCwgb3V0cHV0VG9rZW5zOiAyMDAsIHRvdGFsVG9rZW5zOiAzMDAgfSxcbiAgICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICBmaW5pc2hSZWFzb246ICdzdG9wJ1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IFBsYW5uaW5nQ29udGV4dCA9IHtcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdpbnZlc3RtZW50LWFuYWx5c2lzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge31cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc2VhcmNoUGxhbiA9IGF3YWl0IHBsYW5uaW5nQWdlbnQuY3JlYXRlUmVzZWFyY2hQbGFuKCdjb252XzEyMycsIGNvbnRleHQpO1xuXG4gICAgICAvLyBTaG91bGQgY3JlYXRlIGEgcGxhbiB3aXRoIGRlZmF1bHQgdmFsdWVzXG4gICAgICBleHBlY3QocmVzZWFyY2hQbGFuKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc2VhcmNoUGxhbi5vYmplY3RpdmVzKS50b0VxdWFsKFsnR2VuZXJhdGUgaW52ZXN0bWVudCBpbnNpZ2h0cyddKTtcbiAgICAgIGV4cGVjdChyZXNlYXJjaFBsYW4ucmVzZWFyY2hRdWVzdGlvbnMpLnRvRXF1YWwoWydXaGF0IGFyZSB0aGUga2V5IGludmVzdG1lbnQgb3Bwb3J0dW5pdGllcz8nXSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjcmVhdGVBbmFseXNpc1BsYW4nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYSBkZXRhaWxlZCBhbmFseXNpcyBwbGFuJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gTW9jayByZXNwb25zZSBmb3IgYW5hbHlzaXMgcGxhblxuICAgICAgbW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgYW5hbHlzaXNUeXBlOiAnbWl4ZWQnLFxuICAgICAgICAgIGFuYWx5c2lzU3RlcHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RlcDogJ0RhdGEgQ29sbGVjdGlvbicsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2F0aGVyIG1hcmtldCBkYXRhIGFuZCBmaW5hbmNpYWwgcmVwb3J0cycsXG4gICAgICAgICAgICAgIHJlcXVpcmVkRGF0YTogWydtYXJrZXRfZGF0YScsICdmaW5hbmNpYWxfcmVwb3J0cyddLFxuICAgICAgICAgICAgICBleHBlY3RlZE91dHB1dDogJ1N0cnVjdHVyZWQgZGF0YXNldCcsXG4gICAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IDEwMDAwLFxuICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdLFxuICAgICAgICAgICAgICBhZ2VudDogJ3Jlc2VhcmNoJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RlcDogJ0ZpbmFuY2lhbCBBbmFseXNpcycsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5hbHl6ZSBmaW5hbmNpYWwgbWV0cmljcyBhbmQgcmF0aW9zJyxcbiAgICAgICAgICAgICAgcmVxdWlyZWREYXRhOiBbJ2ZpbmFuY2lhbF9yZXBvcnRzJ10sXG4gICAgICAgICAgICAgIGV4cGVjdGVkT3V0cHV0OiAnRmluYW5jaWFsIGFuYWx5c2lzIHJlcG9ydCcsXG4gICAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IDE1MDAwLFxuICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFsnRGF0YSBDb2xsZWN0aW9uJ10sXG4gICAgICAgICAgICAgIGFnZW50OiAnYW5hbHlzaXMnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBtZXRyaWNzOiBbJ1JPSScsICdSaXNrLWFkanVzdGVkIHJldHVybicsICdWb2xhdGlsaXR5JywgJ1NoYXJwZSByYXRpbyddLFxuICAgICAgICAgIHZhbGlkYXRpb25Dcml0ZXJpYTogWydEYXRhIGNvbnNpc3RlbmN5JywgJ01vZGVsIGFjY3VyYWN5JywgJ1N0YXRpc3RpY2FsIHNpZ25pZmljYW5jZSddLFxuICAgICAgICAgIGNvbmZpZGVuY2VUaHJlc2hvbGRzOiB7XG4gICAgICAgICAgICBtaW5pbXVtOiAwLjc1LFxuICAgICAgICAgICAgdGFyZ2V0OiAwLjkwXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxNTAsIG91dHB1dFRva2VuczogMjUwLCB0b3RhbFRva2VuczogNDAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC0yJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjb250ZXh0OiBQbGFubmluZ0NvbnRleHQgPSB7XG4gICAgICAgIHJlcXVlc3RUeXBlOiAnaW52ZXN0bWVudC1hbmFseXNpcycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHsgc2VjdG9yOiAndGVjaG5vbG9neScgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzZWFyY2hQbGFuOiBSZXNlYXJjaFBsYW4gPSB7XG4gICAgICAgIGlkOiAncmVzZWFyY2hfcGxhbl8xMjMnLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnZfMTIzJyxcbiAgICAgICAgb2JqZWN0aXZlczogWydBbmFseXplIG1hcmtldCB0cmVuZHMnXSxcbiAgICAgICAgcmVzZWFyY2hRdWVzdGlvbnM6IFsnV2hhdCBhcmUgdGhlIGN1cnJlbnQgbWFya2V0IGNvbmRpdGlvbnM/J10sXG4gICAgICAgIGRhdGFTb3VyY2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc291cmNlOiAnTWFya2V0IERhdGEgRmVlZCcsXG4gICAgICAgICAgICB0eXBlOiAnbWFya2V0JyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgICAgICBlc3RpbWF0ZWRUaW1lOiA1MDAwLFxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbXVxuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbWV0aG9kb2xvZ3k6ICdDb21wcmVoZW5zaXZlIGFuYWx5c2lzJyxcbiAgICAgICAgZXhwZWN0ZWRPdXRjb21lczogWydJbnZlc3RtZW50IHJlY29tbWVuZGF0aW9ucyddLFxuICAgICAgICByaXNrRmFjdG9yczogWydEYXRhIGF2YWlsYWJpbGl0eSddLFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnZHJhZnQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBhbmFseXNpc1BsYW4gPSBhd2FpdCBwbGFubmluZ0FnZW50LmNyZWF0ZUFuYWx5c2lzUGxhbignY29udl8xMjMnLCBjb250ZXh0LCByZXNlYXJjaFBsYW4pO1xuXG4gICAgICBleHBlY3QoYW5hbHlzaXNQbGFuKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGFuYWx5c2lzUGxhbi5pZCkudG9NYXRjaCgvXmFuYWx5c2lzX3BsYW5fLyk7XG4gICAgICBleHBlY3QoYW5hbHlzaXNQbGFuLmNvbnZlcnNhdGlvbklkKS50b0JlKCdjb252XzEyMycpO1xuICAgICAgZXhwZWN0KGFuYWx5c2lzUGxhbi5hbmFseXNpc1R5cGUpLnRvQmUoJ21peGVkJyk7XG4gICAgICBleHBlY3QoYW5hbHlzaXNQbGFuLmFuYWx5c2lzU3RlcHMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwc1swXS5zdGVwKS50b0JlKCdEYXRhIENvbGxlY3Rpb24nKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwc1swXS5hZ2VudCkudG9CZSgncmVzZWFyY2gnKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwc1sxXS5zdGVwKS50b0JlKCdGaW5hbmNpYWwgQW5hbHlzaXMnKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwc1sxXS5hZ2VudCkudG9CZSgnYW5hbHlzaXMnKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4ubWV0cmljcykudG9Db250YWluKCdST0knKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4ubWV0cmljcykudG9Db250YWluKCdTaGFycGUgcmF0aW8nKTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4uY29uZmlkZW5jZVRocmVzaG9sZHMubWluaW11bSkudG9CZSgwLjc1KTtcbiAgICAgIGV4cGVjdChhbmFseXNpc1BsYW4uY29uZmlkZW5jZVRocmVzaG9sZHMudGFyZ2V0KS50b0JlKDAuOTApO1xuICAgICAgZXhwZWN0KGFuYWx5c2lzUGxhbi5zdGF0dXMpLnRvQmUoJ2RyYWZ0Jyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdhbmFseXplRGVwZW5kZW5jaWVzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYW5hbHl6ZSB0YXNrIGRlcGVuZGVuY2llcyBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBNb2NrIHJlc3BvbnNlIGZvciBkZXBlbmRlbmN5IGFuYWx5c2lzXG4gICAgICBtb2NrQmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGFza0lkOiAncmVzZWFyY2hfMF9tYXJrZXRfZGF0YV9mZWVkJyxcbiAgICAgICAgICAgICAgZGVwZW5kc09uOiBbXSxcbiAgICAgICAgICAgICAgYmxvY2tlZEJ5OiBbJ3Jlc2VhcmNoXzFfZmluYW5jaWFsX3JlcG9ydHMnXSxcbiAgICAgICAgICAgICAgY3JpdGljYWxQYXRoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICB0YXNrSWQ6ICdyZXNlYXJjaF8xX2ZpbmFuY2lhbF9yZXBvcnRzJyxcbiAgICAgICAgICAgICAgZGVwZW5kc09uOiBbJ3Jlc2VhcmNoXzBfbWFya2V0X2RhdGFfZmVlZCddLFxuICAgICAgICAgICAgICBibG9ja2VkQnk6IFtdLFxuICAgICAgICAgICAgICBjcml0aWNhbFBhdGg6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9KSxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAyMDAsIG91dHB1dFRva2VuczogMTUwLCB0b3RhbFRva2VuczogMzUwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC0zJyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNlYXJjaFBsYW46IFJlc2VhcmNoUGxhbiA9IHtcbiAgICAgICAgaWQ6ICdyZXNlYXJjaF9wbGFuXzEyMycsXG4gICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udl8xMjMnLFxuICAgICAgICBvYmplY3RpdmVzOiBbJ0FuYWx5emUgbWFya2V0IHRyZW5kcyddLFxuICAgICAgICByZXNlYXJjaFF1ZXN0aW9uczogWydXaGF0IGFyZSB0aGUgY3VycmVudCBtYXJrZXQgY29uZGl0aW9ucz8nXSxcbiAgICAgICAgZGF0YVNvdXJjZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2U6ICdNYXJrZXQgRGF0YSBGZWVkJyxcbiAgICAgICAgICAgIHR5cGU6ICdtYXJrZXQnLFxuICAgICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IDUwMDAsXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2U6ICdGaW5hbmNpYWwgUmVwb3J0cycsXG4gICAgICAgICAgICB0eXBlOiAncHVibGljJyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IDgwMDAsXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFsncmVzZWFyY2hfMF9tYXJrZXRfZGF0YV9mZWVkJ11cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIG1ldGhvZG9sb2d5OiAnQ29tcHJlaGVuc2l2ZSBhbmFseXNpcycsXG4gICAgICAgIGV4cGVjdGVkT3V0Y29tZXM6IFsnSW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbnMnXSxcbiAgICAgICAgcmlza0ZhY3RvcnM6IFsnRGF0YSBhdmFpbGFiaWxpdHknXSxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ2RyYWZ0J1xuICAgICAgfTtcblxuICAgICAgY29uc3QgYW5hbHlzaXNQbGFuOiBBbmFseXNpc1BsYW4gPSB7XG4gICAgICAgIGlkOiAnYW5hbHlzaXNfcGxhbl8xMjMnLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnZfMTIzJyxcbiAgICAgICAgYW5hbHlzaXNUeXBlOiAnbWl4ZWQnLFxuICAgICAgICBhbmFseXNpc1N0ZXBzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RlcDogJ0RhdGEgQW5hbHlzaXMnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbmFseXplIGNvbGxlY3RlZCBkYXRhJyxcbiAgICAgICAgICAgIHJlcXVpcmVkRGF0YTogWydtYXJrZXRfZGF0YSddLFxuICAgICAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdBbmFseXNpcyByZXN1bHRzJyxcbiAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IDEwMDAwLFxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgICAgIGFnZW50OiAnYW5hbHlzaXMnXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBtZXRyaWNzOiBbJ1JPSSddLFxuICAgICAgICB2YWxpZGF0aW9uQ3JpdGVyaWE6IFsnRGF0YSBjb25zaXN0ZW5jeSddLFxuICAgICAgICBjb25maWRlbmNlVGhyZXNob2xkczogeyBtaW5pbXVtOiAwLjcsIHRhcmdldDogMC44NSB9LFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnZHJhZnQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBhd2FpdCBwbGFubmluZ0FnZW50LmFuYWx5emVEZXBlbmRlbmNpZXMocmVzZWFyY2hQbGFuLCBhbmFseXNpc1BsYW4pO1xuXG4gICAgICBleHBlY3QoZGVwZW5kZW5jaWVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGRlcGVuZGVuY2llcy5zaXplKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIC8vIENoZWNrIHRoYXQgcmVzZWFyY2ggdGFza3Mgd2VyZSBjcmVhdGVkXG4gICAgICBjb25zdCBtYXJrZXREYXRhVGFzayA9IGRlcGVuZGVuY2llcy5nZXQoJ3Jlc2VhcmNoXzBfbWFya2V0X2RhdGFfZmVlZCcpO1xuICAgICAgZXhwZWN0KG1hcmtldERhdGFUYXNrKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG1hcmtldERhdGFUYXNrPy5lc3RpbWF0ZWREdXJhdGlvbikudG9CZSg1MDAwKTtcbiAgICAgIGV4cGVjdChtYXJrZXREYXRhVGFzaz8uY3JpdGljYWxQYXRoKS50b0JlKHRydWUpO1xuXG4gICAgICBjb25zdCBmaW5hbmNpYWxSZXBvcnRzVGFzayA9IGRlcGVuZGVuY2llcy5nZXQoJ3Jlc2VhcmNoXzFfZmluYW5jaWFsX3JlcG9ydHMnKTtcbiAgICAgIGV4cGVjdChmaW5hbmNpYWxSZXBvcnRzVGFzaykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChmaW5hbmNpYWxSZXBvcnRzVGFzaz8uZXN0aW1hdGVkRHVyYXRpb24pLnRvQmUoODAwMCk7XG4gICAgICBleHBlY3QoZmluYW5jaWFsUmVwb3J0c1Rhc2s/LmRlcGVuZHNPbikudG9FcXVhbChbJ3Jlc2VhcmNoXzBfbWFya2V0X2RhdGFfZmVlZCddKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2VzdGltYXRlUmVzb3VyY2VzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZXN0aW1hdGUgcmVzb3VyY2UgcmVxdWlyZW1lbnRzIGFjY3VyYXRlbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBNb2NrIHJlc3BvbnNlIGZvciByZXNvdXJjZSBlc3RpbWF0aW9uXG4gICAgICBtb2NrQmVkcm9ja0NsaWVudC5pbnZva2VNb2RlbC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB0b3RhbEVzdGltYXRlZFRpbWU6IDQ1MDAwLFxuICAgICAgICAgIGFnZW50QWxsb2NhdGlvbnM6IFtcbiAgICAgICAgICAgIHsgYWdlbnQ6ICdyZXNlYXJjaCcsIGVzdGltYXRlZFRpbWU6IDE1MDAwLCB0YXNrQ291bnQ6IDIsIHV0aWxpemF0aW9uUmF0ZTogMC44IH0sXG4gICAgICAgICAgICB7IGFnZW50OiAnYW5hbHlzaXMnLCBlc3RpbWF0ZWRUaW1lOiAyMDAwMCwgdGFza0NvdW50OiAzLCB1dGlsaXphdGlvblJhdGU6IDAuOSB9LFxuICAgICAgICAgICAgeyBhZ2VudDogJ2NvbXBsaWFuY2UnLCBlc3RpbWF0ZWRUaW1lOiA1MDAwLCB0YXNrQ291bnQ6IDEsIHV0aWxpemF0aW9uUmF0ZTogMC43IH0sXG4gICAgICAgICAgICB7IGFnZW50OiAnc3ludGhlc2lzJywgZXN0aW1hdGVkVGltZTogNTAwMCwgdGFza0NvdW50OiAxLCB1dGlsaXphdGlvblJhdGU6IDAuNiB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBkYXRhUmVxdWlyZW1lbnRzOiBbXG4gICAgICAgICAgICB7IHNvdXJjZTogJ01hcmtldCBEYXRhJywgdm9sdW1lOiAnTGFyZ2UnLCBwcm9jZXNzaW5nVGltZTogODAwMCB9LFxuICAgICAgICAgICAgeyBzb3VyY2U6ICdGaW5hbmNpYWwgUmVwb3J0cycsIHZvbHVtZTogJ01lZGl1bScsIHByb2Nlc3NpbmdUaW1lOiA1MDAwIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIGNvbXB1dGF0aW9uYWxSZXF1aXJlbWVudHM6IHtcbiAgICAgICAgICAgIG1vZGVsQ2FsbHM6IDgsXG4gICAgICAgICAgICBlc3RpbWF0ZWRDb3N0OiAwLjc1LFxuICAgICAgICAgICAgbWVtb3J5UmVxdWlyZW1lbnRzOiAnNEdCJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmlza0ZhY3RvcnM6IFtcbiAgICAgICAgICAgIHsgZmFjdG9yOiAnRGF0YSBxdWFsaXR5JywgaW1wYWN0OiAnaGlnaCcsIG1pdGlnYXRpb246ICdWYWxpZGF0ZSBkYXRhIHNvdXJjZXMnIH0sXG4gICAgICAgICAgICB7IGZhY3RvcjogJ01vZGVsIHBlcmZvcm1hbmNlJywgaW1wYWN0OiAnbWVkaXVtJywgbWl0aWdhdGlvbjogJ1VzZSBlbnNlbWJsZSBtZXRob2RzJyB9XG4gICAgICAgICAgXVxuICAgICAgICB9KSxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAxODAsIG91dHB1dFRva2VuczogMjIwLCB0b3RhbFRva2VuczogNDAwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC00JyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXNlYXJjaFBsYW46IFJlc2VhcmNoUGxhbiA9IHtcbiAgICAgICAgaWQ6ICdyZXNlYXJjaF9wbGFuXzEyMycsXG4gICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udl8xMjMnLFxuICAgICAgICBvYmplY3RpdmVzOiBbJ0FuYWx5emUgbWFya2V0IHRyZW5kcyddLFxuICAgICAgICByZXNlYXJjaFF1ZXN0aW9uczogWydXaGF0IGFyZSB0aGUgY3VycmVudCBtYXJrZXQgY29uZGl0aW9ucz8nXSxcbiAgICAgICAgZGF0YVNvdXJjZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzb3VyY2U6ICdNYXJrZXQgRGF0YSBGZWVkJyxcbiAgICAgICAgICAgIHR5cGU6ICdtYXJrZXQnLFxuICAgICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IDUwMDAsXG4gICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFtdXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgICBtZXRob2RvbG9neTogJ0NvbXByZWhlbnNpdmUgYW5hbHlzaXMnLFxuICAgICAgICBleHBlY3RlZE91dGNvbWVzOiBbJ0ludmVzdG1lbnQgcmVjb21tZW5kYXRpb25zJ10sXG4gICAgICAgIHJpc2tGYWN0b3JzOiBbJ0RhdGEgYXZhaWxhYmlsaXR5J10sXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdkcmFmdCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGFuYWx5c2lzUGxhbjogQW5hbHlzaXNQbGFuID0ge1xuICAgICAgICBpZDogJ2FuYWx5c2lzX3BsYW5fMTIzJyxcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252XzEyMycsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ21peGVkJyxcbiAgICAgICAgYW5hbHlzaXNTdGVwczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0ZXA6ICdEYXRhIEFuYWx5c2lzJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5hbHl6ZSBjb2xsZWN0ZWQgZGF0YScsXG4gICAgICAgICAgICByZXF1aXJlZERhdGE6IFsnbWFya2V0X2RhdGEnXSxcbiAgICAgICAgICAgIGV4cGVjdGVkT3V0cHV0OiAnQW5hbHlzaXMgcmVzdWx0cycsXG4gICAgICAgICAgICBlc3RpbWF0ZWRUaW1lOiAxMDAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgICAgICBhZ2VudDogJ2FuYWx5c2lzJ1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbWV0cmljczogWydST0knXSxcbiAgICAgICAgdmFsaWRhdGlvbkNyaXRlcmlhOiBbJ0RhdGEgY29uc2lzdGVuY3knXSxcbiAgICAgICAgY29uZmlkZW5jZVRocmVzaG9sZHM6IHsgbWluaW11bTogMC43LCB0YXJnZXQ6IDAuODUgfSxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ2RyYWZ0J1xuICAgICAgfTtcblxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbmV3IE1hcCgpO1xuXG4gICAgICBjb25zdCBlc3RpbWF0aW9uID0gYXdhaXQgcGxhbm5pbmdBZ2VudC5lc3RpbWF0ZVJlc291cmNlcyhyZXNlYXJjaFBsYW4sIGFuYWx5c2lzUGxhbiwgZGVwZW5kZW5jaWVzKTtcblxuICAgICAgZXhwZWN0KGVzdGltYXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZXN0aW1hdGlvbi50b3RhbEVzdGltYXRlZFRpbWUpLnRvQmUoNDUwMDApO1xuICAgICAgZXhwZWN0KGVzdGltYXRpb24uYWdlbnRBbGxvY2F0aW9ucykudG9IYXZlTGVuZ3RoKDQpO1xuICAgICAgZXhwZWN0KGVzdGltYXRpb24uYWdlbnRBbGxvY2F0aW9uc1swXS5hZ2VudCkudG9CZSgncmVzZWFyY2gnKTtcbiAgICAgIGV4cGVjdChlc3RpbWF0aW9uLmFnZW50QWxsb2NhdGlvbnNbMF0uZXN0aW1hdGVkVGltZSkudG9CZSgxNTAwMCk7XG4gICAgICBleHBlY3QoZXN0aW1hdGlvbi5hZ2VudEFsbG9jYXRpb25zWzFdLmFnZW50KS50b0JlKCdhbmFseXNpcycpO1xuICAgICAgZXhwZWN0KGVzdGltYXRpb24uYWdlbnRBbGxvY2F0aW9uc1sxXS5lc3RpbWF0ZWRUaW1lKS50b0JlKDIwMDAwKTtcbiAgICAgIGV4cGVjdChlc3RpbWF0aW9uLmRhdGFSZXF1aXJlbWVudHMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChlc3RpbWF0aW9uLmNvbXB1dGF0aW9uYWxSZXF1aXJlbWVudHMubW9kZWxDYWxscykudG9CZSg4KTtcbiAgICAgIGV4cGVjdChlc3RpbWF0aW9uLmNvbXB1dGF0aW9uYWxSZXF1aXJlbWVudHMuZXN0aW1hdGVkQ29zdCkudG9CZSgwLjc1KTtcbiAgICAgIGV4cGVjdChlc3RpbWF0aW9uLnJpc2tGYWN0b3JzKS50b0hhdmVMZW5ndGgoMik7XG4gICAgICBleHBlY3QoZXN0aW1hdGlvbi5yaXNrRmFjdG9yc1swXS5mYWN0b3IpLnRvQmUoJ0RhdGEgcXVhbGl0eScpO1xuICAgICAgZXhwZWN0KGVzdGltYXRpb24ucmlza0ZhY3RvcnNbMF0uaW1wYWN0KS50b0JlKCdoaWdoJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdhZGFwdFBsYW4nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhZGFwdCBwbGFuIGJhc2VkIG9uIGludGVybWVkaWF0ZSBmaW5kaW5ncycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEZpcnN0IGNyZWF0ZSBhIHJlc2VhcmNoIHBsYW5cbiAgICAgIGNvbnN0IGNvbnRleHQ6IFBsYW5uaW5nQ29udGV4dCA9IHtcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdpbnZlc3RtZW50LWFuYWx5c2lzJyxcbiAgICAgICAgcGFyYW1ldGVyczogeyBzZWN0b3I6ICd0ZWNobm9sb2d5JyB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNlYXJjaFBsYW4gPSBhd2FpdCBwbGFubmluZ0FnZW50LmNyZWF0ZVJlc2VhcmNoUGxhbignY29udl8xMjMnLCBjb250ZXh0KTtcblxuICAgICAgLy8gQ3JlYXRlIGFuIGFuYWx5c2lzIHBsYW5cbiAgICAgIGNvbnN0IGFuYWx5c2lzUGxhbjogQW5hbHlzaXNQbGFuID0ge1xuICAgICAgICBpZDogJ2FuYWx5c2lzX3BsYW5fMTIzJyxcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252XzEyMycsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ21peGVkJyxcbiAgICAgICAgYW5hbHlzaXNTdGVwczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0ZXA6ICdEYXRhIEFuYWx5c2lzJyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5hbHl6ZSBjb2xsZWN0ZWQgZGF0YScsXG4gICAgICAgICAgICByZXF1aXJlZERhdGE6IFsnbWFya2V0X2RhdGEnXSxcbiAgICAgICAgICAgIGV4cGVjdGVkT3V0cHV0OiAnQW5hbHlzaXMgcmVzdWx0cycsXG4gICAgICAgICAgICBlc3RpbWF0ZWRUaW1lOiAxMDAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgICAgICBhZ2VudDogJ2FuYWx5c2lzJ1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgbWV0cmljczogWydST0knXSxcbiAgICAgICAgdmFsaWRhdGlvbkNyaXRlcmlhOiBbJ0RhdGEgY29uc2lzdGVuY3knXSxcbiAgICAgICAgY29uZmlkZW5jZVRocmVzaG9sZHM6IHsgbWluaW11bTogMC43LCB0YXJnZXQ6IDAuODUgfSxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ2RyYWZ0J1xuICAgICAgfTtcblxuICAgICAgLy8gQ3JlYXRlIHJlc291cmNlIGVzdGltYXRpb24gZmlyc3RcbiAgICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG5ldyBNYXAoKTtcbiAgICAgIGF3YWl0IHBsYW5uaW5nQWdlbnQuZXN0aW1hdGVSZXNvdXJjZXMocmVzZWFyY2hQbGFuLCBhbmFseXNpc1BsYW4sIGRlcGVuZGVuY2llcyk7XG5cbiAgICAgIC8vIE1vY2sgcmVzcG9uc2UgZm9yIHBsYW4gYWRhcHRhdGlvblxuICAgICAgbW9ja0JlZHJvY2tDbGllbnQuaW52b2tlTW9kZWwubW9ja1Jlc29sdmVkVmFsdWVPbmNlKHtcbiAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIGNoYW5nZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogJ2FkZCcsXG4gICAgICAgICAgICAgIHRhcmdldDogJ2RhdGEtc291cmNlJyxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBZGQgRVNHIGRhdGEgc291cmNlIGZvciBzdXN0YWluYWJpbGl0eSBhbmFseXNpcycsXG4gICAgICAgICAgICAgIGltcGFjdDogJ0luY3JlYXNlcyBhbmFseXNpcyB0aW1lIGJ5IDE1JSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdtb2RpZnknLFxuICAgICAgICAgICAgICB0YXJnZXQ6ICdyZXNlYXJjaC1xdWVzdGlvbicsXG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwYW5kIHJlc2VhcmNoIHF1ZXN0aW9ucyB0byBpbmNsdWRlIEVTRyBmYWN0b3JzJyxcbiAgICAgICAgICAgICAgaW1wYWN0OiAnTWluaW1hbCBpbXBhY3Qgb24gdGltZWxpbmUnXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBqdXN0aWZpY2F0aW9uOiAnSW50ZXJtZWRpYXRlIGZpbmRpbmdzIHNob3cgc3Ryb25nIEVTRyBjb3JyZWxhdGlvbiB3aXRoIHBlcmZvcm1hbmNlJyxcbiAgICAgICAgICBhcHByb3ZhbFJlcXVpcmVkOiBmYWxzZVxuICAgICAgICB9KSxcbiAgICAgICAgbW9kZWxJZDogQmVkcm9ja01vZGVsSWQuQ0xBVURFX1NPTk5FVF8zXzcsXG4gICAgICAgIHVzYWdlOiB7IGlucHV0VG9rZW5zOiAyNTAsIG91dHB1dFRva2VuczogMTgwLCB0b3RhbFRva2VuczogNDMwIH0sXG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC01JyxcbiAgICAgICAgZmluaXNoUmVhc29uOiAnc3RvcCdcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBpbnRlcm1lZGlhdGVGaW5kaW5ncyA9IHtcbiAgICAgICAgZXNnQ29ycmVsYXRpb246IDAuODUsXG4gICAgICAgIHN1c3RhaW5hYmlsaXR5VHJlbmRzOiAnaW5jcmVhc2luZycsXG4gICAgICAgIHJlZ3VsYXRvcnlDaGFuZ2VzOiAnbmV3IEVTRyByZXF1aXJlbWVudHMnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBhZGFwdGF0aW9uID0gYXdhaXQgcGxhbm5pbmdBZ2VudC5hZGFwdFBsYW4oXG4gICAgICAgIHJlc2VhcmNoUGxhbi5pZCxcbiAgICAgICAgJ3Jlc2VhcmNoJyxcbiAgICAgICAgaW50ZXJtZWRpYXRlRmluZGluZ3MsXG4gICAgICAgICdFU0cgY29ycmVsYXRpb24gZGlzY292ZXJlZCdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChhZGFwdGF0aW9uKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGFkYXB0YXRpb24uYWRhcHRhdGlvbklkKS50b01hdGNoKC9eYWRhcHRhdGlvbl8vKTtcbiAgICAgIGV4cGVjdChhZGFwdGF0aW9uLm9yaWdpbmFsUGxhbklkKS50b0JlKHJlc2VhcmNoUGxhbi5pZCk7XG4gICAgICBleHBlY3QoYWRhcHRhdGlvbi50cmlnZ2VyKS50b0JlKCdFU0cgY29ycmVsYXRpb24gZGlzY292ZXJlZCcpO1xuICAgICAgZXhwZWN0KGFkYXB0YXRpb24uY2hhbmdlcykudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KGFkYXB0YXRpb24uY2hhbmdlc1swXS50eXBlKS50b0JlKCdhZGQnKTtcbiAgICAgIGV4cGVjdChhZGFwdGF0aW9uLmNoYW5nZXNbMF0udGFyZ2V0KS50b0JlKCdkYXRhLXNvdXJjZScpO1xuICAgICAgZXhwZWN0KGFkYXB0YXRpb24uY2hhbmdlc1sxXS50eXBlKS50b0JlKCdtb2RpZnknKTtcbiAgICAgIGV4cGVjdChhZGFwdGF0aW9uLmNoYW5nZXNbMV0udGFyZ2V0KS50b0JlKCdyZXNlYXJjaC1xdWVzdGlvbicpO1xuICAgICAgZXhwZWN0KGFkYXB0YXRpb24uYXBwcm92YWxSZXF1aXJlZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QoYWRhcHRhdGlvbi5qdXN0aWZpY2F0aW9uKS50b0NvbnRhaW4oJ0VTRyBjb3JyZWxhdGlvbicpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncHJvY2Vzc01lc3NhZ2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBwcm9jZXNzIHJlc2VhcmNoIHBsYW4gbWVzc2FnZSBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdwbGFubmluZycsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICB0YXNrVHlwZTogUGxhbm5pbmdUYXNrVHlwZS5SRVNFQVJDSF9QTEFOLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udl8xMjMnLFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHJlcXVlc3RUeXBlOiAnaW52ZXN0bWVudC1hbmFseXNpcycsXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiB7IHNlY3RvcjogJ3RlY2hub2xvZ3knIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252XzEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxXzEyMydcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBwbGFubmluZ0FnZW50LnByb2Nlc3NNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2Uuc2VuZGVyKS50b0JlKCdwbGFubmluZycpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLnJlY2lwaWVudCkudG9CZSgnc3VwZXJ2aXNvcicpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1lc3NhZ2VUeXBlKS50b0JlKCdyZXNwb25zZScpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbnRlbnQuc3VjY2VzcykudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb250ZW50LnJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5jb250ZW50LnJlc3VsdC5pZCkudG9NYXRjaCgvXnJlc2VhcmNoX3BsYW5fLyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSB1bmtub3duIHRhc2sgdHlwZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdwbGFubmluZycsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICB0YXNrVHlwZTogJ3Vua25vd24tdGFzaycsXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252XzEyMydcbiAgICAgICAgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiAnY29udl8xMjMnLFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcV8xMjMnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcGxhbm5pbmdBZ2VudC5wcm9jZXNzTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLm1lc3NhZ2VUeXBlKS50b0JlKCdlcnJvcicpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLmNvbnRlbnQuc3VjY2VzcykudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuY29udGVudC5lcnJvcikudG9Db250YWluKCdVbmtub3duIHBsYW5uaW5nIHRhc2sgdHlwZScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0dGVyIG1ldGhvZHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXRyaWV2ZSByZXNlYXJjaCBwbGFucyBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0OiBQbGFubmluZ0NvbnRleHQgPSB7XG4gICAgICAgIHJlcXVlc3RUeXBlOiAnaW52ZXN0bWVudC1hbmFseXNpcycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHsgc2VjdG9yOiAndGVjaG5vbG9neScgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzZWFyY2hQbGFuID0gYXdhaXQgcGxhbm5pbmdBZ2VudC5jcmVhdGVSZXNlYXJjaFBsYW4oJ2NvbnZfMTIzJywgY29udGV4dCk7XG4gICAgICBjb25zdCByZXRyaWV2ZWQgPSBwbGFubmluZ0FnZW50LmdldFJlc2VhcmNoUGxhbihyZXNlYXJjaFBsYW4uaWQpO1xuXG4gICAgICBleHBlY3QocmV0cmlldmVkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJldHJpZXZlZD8uaWQpLnRvQmUocmVzZWFyY2hQbGFuLmlkKTtcbiAgICAgIGV4cGVjdChyZXRyaWV2ZWQ/LmNvbnZlcnNhdGlvbklkKS50b0JlKCdjb252XzEyMycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdW5kZWZpbmVkIGZvciBub24tZXhpc3RlbnQgcGxhbnMnLCAoKSA9PiB7XG4gICAgICBjb25zdCByZXRyaWV2ZWQgPSBwbGFubmluZ0FnZW50LmdldFJlc2VhcmNoUGxhbignbm9uLWV4aXN0ZW50LWlkJyk7XG4gICAgICBleHBlY3QocmV0cmlldmVkKS50b0JlVW5kZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHJpZXZlIHRhc2sgZGVwZW5kZW5jaWVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzZWFyY2hQbGFuOiBSZXNlYXJjaFBsYW4gPSB7XG4gICAgICAgIGlkOiAncmVzZWFyY2hfcGxhbl8xMjMnLFxuICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnZfMTIzJyxcbiAgICAgICAgb2JqZWN0aXZlczogWydUZXN0J10sXG4gICAgICAgIHJlc2VhcmNoUXVlc3Rpb25zOiBbJ1Rlc3Q/J10sXG4gICAgICAgIGRhdGFTb3VyY2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc291cmNlOiAnVGVzdCBTb3VyY2UnLFxuICAgICAgICAgICAgdHlwZTogJ21hcmtldCcsXG4gICAgICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgICAgICAgZXN0aW1hdGVkVGltZTogNTAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogW11cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIG1ldGhvZG9sb2d5OiAnVGVzdCcsXG4gICAgICAgIGV4cGVjdGVkT3V0Y29tZXM6IFsnVGVzdCddLFxuICAgICAgICByaXNrRmFjdG9yczogWydUZXN0J10sXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdkcmFmdCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGFuYWx5c2lzUGxhbjogQW5hbHlzaXNQbGFuID0ge1xuICAgICAgICBpZDogJ2FuYWx5c2lzX3BsYW5fMTIzJyxcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252XzEyMycsXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ21peGVkJyxcbiAgICAgICAgYW5hbHlzaXNTdGVwczogW10sXG4gICAgICAgIG1ldHJpY3M6IFtdLFxuICAgICAgICB2YWxpZGF0aW9uQ3JpdGVyaWE6IFtdLFxuICAgICAgICBjb25maWRlbmNlVGhyZXNob2xkczogeyBtaW5pbXVtOiAwLjcsIHRhcmdldDogMC44NSB9LFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAnZHJhZnQnXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBwbGFubmluZ0FnZW50LmFuYWx5emVEZXBlbmRlbmNpZXMocmVzZWFyY2hQbGFuLCBhbmFseXNpc1BsYW4pO1xuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gcGxhbm5pbmdBZ2VudC5nZXRUYXNrRGVwZW5kZW5jaWVzKCk7XG5cbiAgICAgIGV4cGVjdChkZXBlbmRlbmNpZXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZGVwZW5kZW5jaWVzLnNpemUpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=