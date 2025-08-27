/**
 * Planning Agent Tests
 */

import { PlanningAgent, PlanningTaskType, PlanningContext, ResearchPlan, AnalysisPlan } from '../ai/planning-agent';
import { ClaudeSonnetService } from '../ai/claude-sonnet-service';
import { BedrockClientService } from '../ai/bedrock-client';
import { BedrockModelId } from '../../models/bedrock';
import { AgentMessage } from '../../models/agent';

// Mock the Bedrock client
jest.mock('../ai/bedrock-client');
const MockedBedrockClient = BedrockClientService as jest.MockedClass<typeof BedrockClientService>;

describe('PlanningAgent', () => {
  let planningAgent: PlanningAgent;
  let mockBedrockClient: jest.Mocked<BedrockClientService>;
  let claudeSonnetService: ClaudeSonnetService;

  beforeEach(() => {
    // Create mock Bedrock client
    mockBedrockClient = new MockedBedrockClient() as jest.Mocked<BedrockClientService>;
    
    // Mock the getModelConfig method
    mockBedrockClient.getModelConfig.mockReturnValue({
      modelId: BedrockModelId.CLAUDE_SONNET_3_7,
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
      modelId: BedrockModelId.CLAUDE_SONNET_3_7,
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300
      },
      requestId: 'test-request-1',
      finishReason: 'stop'
    });

    // Create Claude Sonnet service
    claudeSonnetService = new ClaudeSonnetService(mockBedrockClient);

    // Create planning agent in test mode
    planningAgent = new PlanningAgent(claudeSonnetService, true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createResearchPlan', () => {
    it('should create a comprehensive research plan', async () => {
      const context: PlanningContext = {
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

      const context: PlanningContext = {
        requestType: 'investment-analysis',
        parameters: {}
      };

      await expect(planningAgent.createResearchPlan('conv_123', context))
        .rejects.toThrow('Failed to create research plan: API Error');
    });

    it('should handle malformed AI responses', async () => {
      mockBedrockClient.invokeModel.mockResolvedValue({
        completion: 'Invalid JSON response',
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
        requestId: 'test-request-1',
        finishReason: 'stop'
      });

      const context: PlanningContext = {
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
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: { inputTokens: 150, outputTokens: 250, totalTokens: 400 },
        requestId: 'test-request-2',
        finishReason: 'stop'
      });

      const context: PlanningContext = {
        requestType: 'investment-analysis',
        parameters: { sector: 'technology' }
      };

      const researchPlan: ResearchPlan = {
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
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: { inputTokens: 200, outputTokens: 150, totalTokens: 350 },
        requestId: 'test-request-3',
        finishReason: 'stop'
      });

      const researchPlan: ResearchPlan = {
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

      const analysisPlan: AnalysisPlan = {
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
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: { inputTokens: 180, outputTokens: 220, totalTokens: 400 },
        requestId: 'test-request-4',
        finishReason: 'stop'
      });

      const researchPlan: ResearchPlan = {
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

      const analysisPlan: AnalysisPlan = {
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
      const context: PlanningContext = {
        requestType: 'investment-analysis',
        parameters: { sector: 'technology' }
      };

      const researchPlan = await planningAgent.createResearchPlan('conv_123', context);

      // Create an analysis plan
      const analysisPlan: AnalysisPlan = {
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
        modelId: BedrockModelId.CLAUDE_SONNET_3_7,
        usage: { inputTokens: 250, outputTokens: 180, totalTokens: 430 },
        requestId: 'test-request-5',
        finishReason: 'stop'
      });

      const intermediateFindings = {
        esgCorrelation: 0.85,
        sustainabilityTrends: 'increasing',
        regulatoryChanges: 'new ESG requirements'
      };

      const adaptation = await planningAgent.adaptPlan(
        researchPlan.id,
        'research',
        intermediateFindings,
        'ESG correlation discovered'
      );

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
      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'planning',
        messageType: 'request',
        content: {
          taskType: PlanningTaskType.RESEARCH_PLAN,
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
      const message: AgentMessage = {
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
      const context: PlanningContext = {
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
      const researchPlan: ResearchPlan = {
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

      const analysisPlan: AnalysisPlan = {
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