/**
 * Tests for SupervisorAgent
 */

import { SupervisorAgent } from '../ai/supervisor-agent';
import { ClaudeSonnetService } from '../ai/claude-sonnet-service';
import { ModelSelectionServiceImpl } from '../ai/model-selection-service';
import { 
  AgentType, 
  ConversationContext, 
  AgentTask, 
  AgentMessage,
  ConflictResolution 
} from '../../models/agent';

// Mock dependencies
jest.mock('../ai/claude-sonnet-service');
jest.mock('../ai/model-selection-service');

describe('SupervisorAgent', () => {
  let supervisorAgent: SupervisorAgent;
  let mockClaudeSonnetService: jest.Mocked<ClaudeSonnetService>;
  let mockModelSelectionService: jest.Mocked<ModelSelectionServiceImpl>;

  beforeEach(() => {
    mockClaudeSonnetService = {
      complete: jest.fn(),
      parseResponse: jest.fn(),
      validateInput: jest.fn(),
      getModelInfo: jest.fn()
    } as any;

    mockModelSelectionService = {
      selectModel: jest.fn(),
      evaluateModelPerformance: jest.fn(),
      registerCustomModel: jest.fn()
    } as any;

    supervisorAgent = new SupervisorAgent(
      mockClaudeSonnetService,
      mockModelSelectionService,
      true // test mode
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processUserRequest', () => {
    it('should process a user request and create conversation context', async () => {
      // Mock Claude Sonnet responses
      mockClaudeSonnetService.complete
        .mockResolvedValueOnce({
          completion: JSON.stringify({
            understanding: 'User wants investment ideas',
            objectives: ['Generate investment recommendations'],
            analysisType: 'comprehensive',
            constraints: { riskTolerance: 'moderate' },
            deliverables: ['Investment ideas', 'Risk analysis']
          }),
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
          requestId: 'req1'
        })
        .mockResolvedValueOnce({
          completion: JSON.stringify({
            phases: [
              {
                name: 'planning',
                tasks: ['create-research-plan'],
                dependencies: [],
                estimatedDuration: 10000
              },
              {
                name: 'research',
                tasks: ['gather-market-data'],
                dependencies: ['create-research-plan'],
                estimatedDuration: 15000
              }
            ],
            totalEstimatedDuration: 25000
          }),
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          usage: { inputTokens: 150, outputTokens: 300, totalTokens: 450 },
          requestId: 'req2'
        });

      const result = await supervisorAgent.processUserRequest(
        'user123',
        'investment-idea-generation',
        { riskTolerance: 'moderate', sectors: ['technology'] }
      );

      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.requestType).toBe('investment-idea-generation');
      expect(result.parameters.riskTolerance).toBe('moderate');
      expect(result.tasks.length).toBeGreaterThan(0);
      expect(mockClaudeSonnetService.complete).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      mockClaudeSonnetService.complete.mockRejectedValue(new Error('API Error'));

      const result = await supervisorAgent.processUserRequest(
        'user123',
        'investment-idea-generation',
        { riskTolerance: 'moderate' }
      );

      expect(result.currentPhase).toBe('completed');
      expect(result.metadata.error).toBe('API Error');
    });
  });

  describe('delegateTask', () => {
    it('should successfully delegate a task to an agent', async () => {
      const task: AgentTask = {
        id: 'task123',
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'medium',
        agentRole: 'research',
        description: 'Gather market data',
        parameters: {},
        dependencies: [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await supervisorAgent.delegateTask(task);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task123');
      expect(result.assignedTo).toBe('research');
      expect(result.estimatedCompletion).toBeInstanceOf(Date);
    });

    it('should handle agent capacity limits', async () => {
      const task: AgentTask = {
        id: 'task123',
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'medium',
        agentRole: 'research',
        description: 'Gather market data',
        parameters: {},
        dependencies: [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Fill up the agent's capacity
      const agentStatus = supervisorAgent.getAgentStatus('research');
      if (agentStatus) {
        agentStatus.status = 'busy';
        agentStatus.currentTasks = new Array(agentStatus.capabilities.maxConcurrentTasks).fill('task');
      }

      const result = await supervisorAgent.delegateTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at capacity');
    });
  });

  describe('sendMessage', () => {
    it('should add message to queue', () => {
      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'test task' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv123',
          requestId: 'req123'
        }
      };

      supervisorAgent.sendMessage(message);
      const queue = supervisorAgent.getMessageQueue();

      expect(queue).toContain(message);
    });
  });

  describe('getAgentStatus', () => {
    it('should return agent status for valid agent type', () => {
      const status = supervisorAgent.getAgentStatus('research');

      expect(status).toBeDefined();
      expect(status?.agentType).toBe('research');
      expect(status?.status).toBe('idle');
      expect(status?.capabilities).toBeDefined();
    });

    it('should return undefined for invalid agent type', () => {
      const status = supervisorAgent.getAgentStatus('invalid' as AgentType);

      expect(status).toBeUndefined();
    });
  });

  describe('getConversationContext', () => {
    it('should return conversation context for valid ID', async () => {
      mockClaudeSonnetService.complete
        .mockResolvedValueOnce({
          completion: JSON.stringify({
            understanding: 'Test request',
            objectives: ['Test objective'],
            analysisType: 'basic',
            constraints: {},
            deliverables: ['Test deliverable']
          }),
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          usage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 },
          requestId: 'req3'
        })
        .mockResolvedValueOnce({
          completion: JSON.stringify({
            phases: [{
              name: 'planning',
              tasks: ['test-task'],
              dependencies: [],
              estimatedDuration: 5000
            }],
            totalEstimatedDuration: 5000
          }),
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          usage: { inputTokens: 75, outputTokens: 150, totalTokens: 225 },
          requestId: 'req4'
        });

      const context = await supervisorAgent.processUserRequest(
        'user123',
        'test-request',
        {}
      );

      const retrievedContext = supervisorAgent.getConversationContext(context.id);

      expect(retrievedContext).toBeDefined();
      expect(retrievedContext?.id).toBe(context.id);
      expect(retrievedContext?.userId).toBe('user123');
    });

    it('should return undefined for invalid conversation ID', () => {
      const context = supervisorAgent.getConversationContext('invalid-id');

      expect(context).toBeUndefined();
    });
  });

  describe('cleanupCompletedConversations', () => {
    it('should remove old completed conversations', async () => {
      // Create a conversation
      mockClaudeSonnetService.complete
        .mockResolvedValue({
          completion: JSON.stringify({
            understanding: 'Test',
            objectives: ['Test'],
            analysisType: 'basic',
            constraints: {},
            deliverables: ['Test']
          }),
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          usage: { inputTokens: 25, outputTokens: 50, totalTokens: 75 },
          requestId: 'req6'
        });

      const context = await supervisorAgent.processUserRequest(
        'user123',
        'test-request',
        {}
      );

      // Mark as completed and set old timestamp
      context.currentPhase = 'completed';
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago
      context.updatedAt = oldDate;

      // Verify conversation exists
      expect(supervisorAgent.getConversationContext(context.id)).toBeDefined();

      // Clean up conversations older than 24 hours
      supervisorAgent.cleanupCompletedConversations(24);

      // Verify conversation was removed
      expect(supervisorAgent.getConversationContext(context.id)).toBeUndefined();
    });

    it('should not remove recent completed conversations', async () => {
      // Create a conversation
      mockClaudeSonnetService.complete
        .mockResolvedValue({
          completion: JSON.stringify({
            understanding: 'Test',
            objectives: ['Test'],
            analysisType: 'basic',
            constraints: {},
            deliverables: ['Test']
          }),
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          usage: { inputTokens: 25, outputTokens: 50, totalTokens: 75 },
          requestId: 'req7'
        });

      const context = await supervisorAgent.processUserRequest(
        'user123',
        'test-request',
        {}
      );

      // Mark as completed with recent timestamp
      context.currentPhase = 'completed';
      context.updatedAt = new Date();

      // Clean up conversations older than 24 hours
      supervisorAgent.cleanupCompletedConversations(24);

      // Verify conversation still exists
      expect(supervisorAgent.getConversationContext(context.id)).toBeDefined();
    });
  });

  describe('message queue management', () => {
    it('should manage message queue correctly', () => {
      const message1: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'task1' },
        metadata: {
          priority: 'high',
          timestamp: new Date(),
          conversationId: 'conv1',
          requestId: 'req1'
        }
      };

      const message2: AgentMessage = {
        sender: 'supervisor',
        recipient: 'analysis',
        messageType: 'request',
        content: { task: 'task2' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv2',
          requestId: 'req2'
        }
      };

      // Add messages
      supervisorAgent.sendMessage(message1);
      supervisorAgent.sendMessage(message2);

      // Check queue
      const queue = supervisorAgent.getMessageQueue();
      expect(queue).toHaveLength(2);
      expect(queue).toContain(message1);
      expect(queue).toContain(message2);

      // Clear queue
      supervisorAgent.clearMessageQueue();
      expect(supervisorAgent.getMessageQueue()).toHaveLength(0);
    });
  });

  describe('agent capabilities', () => {
    it('should have correct capabilities for each agent type', () => {
      const agentTypes: AgentType[] = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];

      agentTypes.forEach(agentType => {
        const status = supervisorAgent.getAgentStatus(agentType);
        expect(status).toBeDefined();
        expect(status?.capabilities).toBeDefined();
        expect(status?.capabilities.supportedTasks).toBeInstanceOf(Array);
        expect(status?.capabilities.maxConcurrentTasks).toBeGreaterThan(0);
        expect(status?.capabilities.averageProcessingTime).toBeGreaterThan(0);
        expect(status?.capabilities.reliability).toBeGreaterThan(0);
        expect(status?.capabilities.reliability).toBeLessThanOrEqual(1);
        expect(status?.capabilities.specializations).toBeInstanceOf(Array);
      });
    });
  });

  describe('task lifecycle', () => {
    it('should handle complete task lifecycle', async () => {
      const task: AgentTask = {
        id: 'lifecycle-task',
        type: 'text-generation',
        complexity: 'simple',
        domain: 'financial',
        priority: 'high',
        agentRole: 'research',
        description: 'Test lifecycle task',
        parameters: { test: 'value' },
        dependencies: [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Delegate task
      const delegationResult = await supervisorAgent.delegateTask(task);
      expect(delegationResult.success).toBe(true);
      expect(task.status).toBe('assigned');
      expect(task.assignedTo).toBe('research');

      // Check agent status was updated immediately after delegation
      const agentStatus = supervisorAgent.getAgentStatus('research');
      expect(agentStatus?.currentTasks).toContain(task.id);
      
      // Wait for simulated completion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check task was completed
      expect(task.status).toBe('completed');
    });
  });
});