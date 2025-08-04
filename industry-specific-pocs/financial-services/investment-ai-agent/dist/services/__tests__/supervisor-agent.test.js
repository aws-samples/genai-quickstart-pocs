"use strict";
/**
 * Tests for SupervisorAgent
 */
Object.defineProperty(exports, "__esModule", { value: true });
const supervisor_agent_1 = require("../ai/supervisor-agent");
// Mock dependencies
jest.mock('../ai/claude-sonnet-service');
jest.mock('../ai/model-selection-service');
describe('SupervisorAgent', () => {
    let supervisorAgent;
    let mockClaudeSonnetService;
    let mockModelSelectionService;
    beforeEach(() => {
        mockClaudeSonnetService = {
            complete: jest.fn(),
            parseResponse: jest.fn(),
            validateInput: jest.fn(),
            getModelInfo: jest.fn()
        };
        mockModelSelectionService = {
            selectModel: jest.fn(),
            evaluateModelPerformance: jest.fn(),
            registerCustomModel: jest.fn()
        };
        supervisorAgent = new supervisor_agent_1.SupervisorAgent(mockClaudeSonnetService, mockModelSelectionService, true // test mode
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
            const result = await supervisorAgent.processUserRequest('user123', 'investment-idea-generation', { riskTolerance: 'moderate', sectors: ['technology'] });
            expect(result).toBeDefined();
            expect(result.userId).toBe('user123');
            expect(result.requestType).toBe('investment-idea-generation');
            expect(result.parameters.riskTolerance).toBe('moderate');
            expect(result.tasks.length).toBeGreaterThan(0);
            expect(mockClaudeSonnetService.complete).toHaveBeenCalledTimes(2);
        });
        it('should handle errors gracefully', async () => {
            mockClaudeSonnetService.complete.mockRejectedValue(new Error('API Error'));
            const result = await supervisorAgent.processUserRequest('user123', 'investment-idea-generation', { riskTolerance: 'moderate' });
            expect(result.currentPhase).toBe('completed');
            expect(result.metadata.error).toBe('API Error');
        });
    });
    describe('delegateTask', () => {
        it('should successfully delegate a task to an agent', async () => {
            const task = {
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
            const task = {
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
            const message = {
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
            const status = supervisorAgent.getAgentStatus('invalid');
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
            const context = await supervisorAgent.processUserRequest('user123', 'test-request', {});
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
            const context = await supervisorAgent.processUserRequest('user123', 'test-request', {});
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
            const context = await supervisorAgent.processUserRequest('user123', 'test-request', {});
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
            const message1 = {
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
            const message2 = {
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
            const agentTypes = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];
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
            const task = {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwZXJ2aXNvci1hZ2VudC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9zdXBlcnZpc29yLWFnZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILDZEQUF5RDtBQVd6RCxvQkFBb0I7QUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztBQUUzQyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO0lBQy9CLElBQUksZUFBZ0MsQ0FBQztJQUNyQyxJQUFJLHVCQUF5RCxDQUFDO0lBQzlELElBQUkseUJBQWlFLENBQUM7SUFFdEUsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLHVCQUF1QixHQUFHO1lBQ3hCLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ25CLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ3hCLGFBQWEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ3hCLFlBQVksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1NBQ2pCLENBQUM7UUFFVCx5QkFBeUIsR0FBRztZQUMxQixXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUN0Qix3QkFBd0IsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1lBQ25DLG1CQUFtQixFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7U0FDeEIsQ0FBQztRQUVULGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQ25DLHVCQUF1QixFQUN2Qix5QkFBeUIsRUFDekIsSUFBSSxDQUFDLFlBQVk7U0FDbEIsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztJQUN2QixDQUFDLENBQUMs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QUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciBTdXBlcnZpc29yQWdlbnRcbiAqL1xuXG5pbXBvcnQgeyBTdXBlcnZpc29yQWdlbnQgfSBmcm9tICcuLi9haS9zdXBlcnZpc29yLWFnZW50JztcbmltcG9ydCB7IENsYXVkZVNvbm5ldFNlcnZpY2UgfSBmcm9tICcuLi9haS9jbGF1ZGUtc29ubmV0LXNlcnZpY2UnO1xuaW1wb3J0IHsgTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCB9IGZyb20gJy4uL2FpL21vZGVsLXNlbGVjdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7IFxuICBBZ2VudFR5cGUsIFxuICBDb252ZXJzYXRpb25Db250ZXh0LCBcbiAgQWdlbnRUYXNrLCBcbiAgQWdlbnRNZXNzYWdlLFxuICBDb25mbGljdFJlc29sdXRpb24gXG59IGZyb20gJy4uLy4uL21vZGVscy9hZ2VudCc7XG5cbi8vIE1vY2sgZGVwZW5kZW5jaWVzXG5qZXN0Lm1vY2soJy4uL2FpL2NsYXVkZS1zb25uZXQtc2VydmljZScpO1xuamVzdC5tb2NrKCcuLi9haS9tb2RlbC1zZWxlY3Rpb24tc2VydmljZScpO1xuXG5kZXNjcmliZSgnU3VwZXJ2aXNvckFnZW50JywgKCkgPT4ge1xuICBsZXQgc3VwZXJ2aXNvckFnZW50OiBTdXBlcnZpc29yQWdlbnQ7XG4gIGxldCBtb2NrQ2xhdWRlU29ubmV0U2VydmljZTogamVzdC5Nb2NrZWQ8Q2xhdWRlU29ubmV0U2VydmljZT47XG4gIGxldCBtb2NrTW9kZWxTZWxlY3Rpb25TZXJ2aWNlOiBqZXN0Lk1vY2tlZDxNb2RlbFNlbGVjdGlvblNlcnZpY2VJbXBsPjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrQ2xhdWRlU29ubmV0U2VydmljZSA9IHtcbiAgICAgIGNvbXBsZXRlOiBqZXN0LmZuKCksXG4gICAgICBwYXJzZVJlc3BvbnNlOiBqZXN0LmZuKCksXG4gICAgICB2YWxpZGF0ZUlucHV0OiBqZXN0LmZuKCksXG4gICAgICBnZXRNb2RlbEluZm86IGplc3QuZm4oKVxuICAgIH0gYXMgYW55O1xuXG4gICAgbW9ja01vZGVsU2VsZWN0aW9uU2VydmljZSA9IHtcbiAgICAgIHNlbGVjdE1vZGVsOiBqZXN0LmZuKCksXG4gICAgICBldmFsdWF0ZU1vZGVsUGVyZm9ybWFuY2U6IGplc3QuZm4oKSxcbiAgICAgIHJlZ2lzdGVyQ3VzdG9tTW9kZWw6IGplc3QuZm4oKVxuICAgIH0gYXMgYW55O1xuXG4gICAgc3VwZXJ2aXNvckFnZW50ID0gbmV3IFN1cGVydmlzb3JBZ2VudChcbiAgICAgIG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLFxuICAgICAgbW9ja01vZGVsU2VsZWN0aW9uU2VydmljZSxcbiAgICAgIHRydWUgLy8gdGVzdCBtb2RlXG4gICAgKTtcbiAgfSk7XG5cbiAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3Byb2Nlc3NVc2VyUmVxdWVzdCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHByb2Nlc3MgYSB1c2VyIHJlcXVlc3QgYW5kIGNyZWF0ZSBjb252ZXJzYXRpb24gY29udGV4dCcsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIE1vY2sgQ2xhdWRlIFNvbm5ldCByZXNwb25zZXNcbiAgICAgIG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2Uoe1xuICAgICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHVuZGVyc3RhbmRpbmc6ICdVc2VyIHdhbnRzIGludmVzdG1lbnQgaWRlYXMnLFxuICAgICAgICAgICAgb2JqZWN0aXZlczogWydHZW5lcmF0ZSBpbnZlc3RtZW50IHJlY29tbWVuZGF0aW9ucyddLFxuICAgICAgICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICAgICAgICBjb25zdHJhaW50czogeyByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnIH0sXG4gICAgICAgICAgICBkZWxpdmVyYWJsZXM6IFsnSW52ZXN0bWVudCBpZGVhcycsICdSaXNrIGFuYWx5c2lzJ11cbiAgICAgICAgICB9KSxcbiAgICAgICAgICBtb2RlbElkOiAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTAwLCBvdXRwdXRUb2tlbnM6IDIwMCwgdG90YWxUb2tlbnM6IDMwMCB9LFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcTEnXG4gICAgICAgIH0pXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2Uoe1xuICAgICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBoYXNlczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3BsYW5uaW5nJyxcbiAgICAgICAgICAgICAgICB0YXNrczogWydjcmVhdGUtcmVzZWFyY2gtcGxhbiddLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgICAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IDEwMDAwXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmVzZWFyY2gnLFxuICAgICAgICAgICAgICAgIHRhc2tzOiBbJ2dhdGhlci1tYXJrZXQtZGF0YSddLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogWydjcmVhdGUtcmVzZWFyY2gtcGxhbiddLFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZER1cmF0aW9uOiAxNTAwMFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdG90YWxFc3RpbWF0ZWREdXJhdGlvbjogMjUwMDBcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBtb2RlbElkOiAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMTUwLCBvdXRwdXRUb2tlbnM6IDMwMCwgdG90YWxUb2tlbnM6IDQ1MCB9LFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcTInXG4gICAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdXBlcnZpc29yQWdlbnQucHJvY2Vzc1VzZXJSZXF1ZXN0KFxuICAgICAgICAndXNlcjEyMycsXG4gICAgICAgICdpbnZlc3RtZW50LWlkZWEtZ2VuZXJhdGlvbicsXG4gICAgICAgIHsgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJywgc2VjdG9yczogWyd0ZWNobm9sb2d5J10gfVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudXNlcklkKS50b0JlKCd1c2VyMTIzJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnJlcXVlc3RUeXBlKS50b0JlKCdpbnZlc3RtZW50LWlkZWEtZ2VuZXJhdGlvbicpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5wYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UpLnRvQmUoJ21vZGVyYXRlJyk7XG4gICAgICBleHBlY3QocmVzdWx0LnRhc2tzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMik7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBlcnJvcnMgZ3JhY2VmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIG1vY2tDbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlLm1vY2tSZWplY3RlZFZhbHVlKG5ldyBFcnJvcignQVBJIEVycm9yJykpO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdXBlcnZpc29yQWdlbnQucHJvY2Vzc1VzZXJSZXF1ZXN0KFxuICAgICAgICAndXNlcjEyMycsXG4gICAgICAgICdpbnZlc3RtZW50LWlkZWEtZ2VuZXJhdGlvbicsXG4gICAgICAgIHsgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyB9XG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmN1cnJlbnRQaGFzZSkudG9CZSgnY29tcGxldGVkJyk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldGFkYXRhLmVycm9yKS50b0JlKCdBUEkgRXJyb3InKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2RlbGVnYXRlVGFzaycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN1Y2Nlc3NmdWxseSBkZWxlZ2F0ZSBhIHRhc2sgdG8gYW4gYWdlbnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0YXNrOiBBZ2VudFRhc2sgPSB7XG4gICAgICAgIGlkOiAndGFzazEyMycsXG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBhZ2VudFJvbGU6ICdyZXNlYXJjaCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR2F0aGVyIG1hcmtldCBkYXRhJyxcbiAgICAgICAgcGFyYW1ldGVyczoge30sXG4gICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc3VwZXJ2aXNvckFnZW50LmRlbGVnYXRlVGFzayh0YXNrKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC50YXNrSWQpLnRvQmUoJ3Rhc2sxMjMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuYXNzaWduZWRUbykudG9CZSgncmVzZWFyY2gnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXN0aW1hdGVkQ29tcGxldGlvbikudG9CZUluc3RhbmNlT2YoRGF0ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBhZ2VudCBjYXBhY2l0eSBsaW1pdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0YXNrOiBBZ2VudFRhc2sgPSB7XG4gICAgICAgIGlkOiAndGFzazEyMycsXG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBhZ2VudFJvbGU6ICdyZXNlYXJjaCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnR2F0aGVyIG1hcmtldCBkYXRhJyxcbiAgICAgICAgcGFyYW1ldGVyczoge30sXG4gICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKVxuICAgICAgfTtcblxuICAgICAgLy8gRmlsbCB1cCB0aGUgYWdlbnQncyBjYXBhY2l0eVxuICAgICAgY29uc3QgYWdlbnRTdGF0dXMgPSBzdXBlcnZpc29yQWdlbnQuZ2V0QWdlbnRTdGF0dXMoJ3Jlc2VhcmNoJyk7XG4gICAgICBpZiAoYWdlbnRTdGF0dXMpIHtcbiAgICAgICAgYWdlbnRTdGF0dXMuc3RhdHVzID0gJ2J1c3knO1xuICAgICAgICBhZ2VudFN0YXR1cy5jdXJyZW50VGFza3MgPSBuZXcgQXJyYXkoYWdlbnRTdGF0dXMuY2FwYWJpbGl0aWVzLm1heENvbmN1cnJlbnRUYXNrcykuZmlsbCgndGFzaycpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdXBlcnZpc29yQWdlbnQuZGVsZWdhdGVUYXNrKHRhc2spO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcikudG9Db250YWluKCdhdCBjYXBhY2l0eScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnc2VuZE1lc3NhZ2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhZGQgbWVzc2FnZSB0byBxdWV1ZScsICgpID0+IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAndGVzdCB0YXNrJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252MTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXExMjMnXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHN1cGVydmlzb3JBZ2VudC5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIGNvbnN0IHF1ZXVlID0gc3VwZXJ2aXNvckFnZW50LmdldE1lc3NhZ2VRdWV1ZSgpO1xuXG4gICAgICBleHBlY3QocXVldWUpLnRvQ29udGFpbihtZXNzYWdlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldEFnZW50U3RhdHVzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIGFnZW50IHN0YXR1cyBmb3IgdmFsaWQgYWdlbnQgdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHN1cGVydmlzb3JBZ2VudC5nZXRBZ2VudFN0YXR1cygncmVzZWFyY2gnKTtcblxuICAgICAgZXhwZWN0KHN0YXR1cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LmFnZW50VHlwZSkudG9CZSgncmVzZWFyY2gnKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LnN0YXR1cykudG9CZSgnaWRsZScpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8uY2FwYWJpbGl0aWVzKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdW5kZWZpbmVkIGZvciBpbnZhbGlkIGFnZW50IHR5cGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBzdXBlcnZpc29yQWdlbnQuZ2V0QWdlbnRTdGF0dXMoJ2ludmFsaWQnIGFzIEFnZW50VHlwZSk7XG5cbiAgICAgIGV4cGVjdChzdGF0dXMpLnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldENvbnZlcnNhdGlvbkNvbnRleHQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY29udmVyc2F0aW9uIGNvbnRleHQgZm9yIHZhbGlkIElEJywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGVcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlT25jZSh7XG4gICAgICAgICAgY29tcGxldGlvbjogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgdW5kZXJzdGFuZGluZzogJ1Rlc3QgcmVxdWVzdCcsXG4gICAgICAgICAgICBvYmplY3RpdmVzOiBbJ1Rlc3Qgb2JqZWN0aXZlJ10sXG4gICAgICAgICAgICBhbmFseXNpc1R5cGU6ICdiYXNpYycsXG4gICAgICAgICAgICBjb25zdHJhaW50czoge30sXG4gICAgICAgICAgICBkZWxpdmVyYWJsZXM6IFsnVGVzdCBkZWxpdmVyYWJsZSddXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbW9kZWxJZDogJ2FudGhyb3BpYy5jbGF1ZGUtMy1zb25uZXQtMjAyNDAyMjktdjE6MCcsXG4gICAgICAgICAgdXNhZ2U6IHsgaW5wdXRUb2tlbnM6IDUwLCBvdXRwdXRUb2tlbnM6IDEwMCwgdG90YWxUb2tlbnM6IDE1MCB9LFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcTMnXG4gICAgICAgIH0pXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZU9uY2Uoe1xuICAgICAgICAgIGNvbXBsZXRpb246IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHBoYXNlczogW3tcbiAgICAgICAgICAgICAgbmFtZTogJ3BsYW5uaW5nJyxcbiAgICAgICAgICAgICAgdGFza3M6IFsndGVzdC10YXNrJ10sXG4gICAgICAgICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgICAgICAgIGVzdGltYXRlZER1cmF0aW9uOiA1MDAwXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIHRvdGFsRXN0aW1hdGVkRHVyYXRpb246IDUwMDBcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBtb2RlbElkOiAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogNzUsIG91dHB1dFRva2VuczogMTUwLCB0b3RhbFRva2VuczogMjI1IH0sXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxNCdcbiAgICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNvbnRleHQgPSBhd2FpdCBzdXBlcnZpc29yQWdlbnQucHJvY2Vzc1VzZXJSZXF1ZXN0KFxuICAgICAgICAndXNlcjEyMycsXG4gICAgICAgICd0ZXN0LXJlcXVlc3QnLFxuICAgICAgICB7fVxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmV0cmlldmVkQ29udGV4dCA9IHN1cGVydmlzb3JBZ2VudC5nZXRDb252ZXJzYXRpb25Db250ZXh0KGNvbnRleHQuaWQpO1xuXG4gICAgICBleHBlY3QocmV0cmlldmVkQ29udGV4dCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXRyaWV2ZWRDb250ZXh0Py5pZCkudG9CZShjb250ZXh0LmlkKTtcbiAgICAgIGV4cGVjdChyZXRyaWV2ZWRDb250ZXh0Py51c2VySWQpLnRvQmUoJ3VzZXIxMjMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIHVuZGVmaW5lZCBmb3IgaW52YWxpZCBjb252ZXJzYXRpb24gSUQnLCAoKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0gc3VwZXJ2aXNvckFnZW50LmdldENvbnZlcnNhdGlvbkNvbnRleHQoJ2ludmFsaWQtaWQnKTtcblxuICAgICAgZXhwZWN0KGNvbnRleHQpLnRvQmVVbmRlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NsZWFudXBDb21wbGV0ZWRDb252ZXJzYXRpb25zJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmVtb3ZlIG9sZCBjb21wbGV0ZWQgY29udmVyc2F0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIENyZWF0ZSBhIGNvbnZlcnNhdGlvblxuICAgICAgbW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGVcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICB1bmRlcnN0YW5kaW5nOiAnVGVzdCcsXG4gICAgICAgICAgICBvYmplY3RpdmVzOiBbJ1Rlc3QnXSxcbiAgICAgICAgICAgIGFuYWx5c2lzVHlwZTogJ2Jhc2ljJyxcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzOiB7fSxcbiAgICAgICAgICAgIGRlbGl2ZXJhYmxlczogWydUZXN0J11cbiAgICAgICAgICB9KSxcbiAgICAgICAgICBtb2RlbElkOiAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMjUsIG91dHB1dFRva2VuczogNTAsIHRvdGFsVG9rZW5zOiA3NSB9LFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcTYnXG4gICAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgc3VwZXJ2aXNvckFnZW50LnByb2Nlc3NVc2VyUmVxdWVzdChcbiAgICAgICAgJ3VzZXIxMjMnLFxuICAgICAgICAndGVzdC1yZXF1ZXN0JyxcbiAgICAgICAge31cbiAgICAgICk7XG5cbiAgICAgIC8vIE1hcmsgYXMgY29tcGxldGVkIGFuZCBzZXQgb2xkIHRpbWVzdGFtcFxuICAgICAgY29udGV4dC5jdXJyZW50UGhhc2UgPSAnY29tcGxldGVkJztcbiAgICAgIGNvbnN0IG9sZERhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgb2xkRGF0ZS5zZXRIb3VycyhvbGREYXRlLmdldEhvdXJzKCkgLSAyNSk7IC8vIDI1IGhvdXJzIGFnb1xuICAgICAgY29udGV4dC51cGRhdGVkQXQgPSBvbGREYXRlO1xuXG4gICAgICAvLyBWZXJpZnkgY29udmVyc2F0aW9uIGV4aXN0c1xuICAgICAgZXhwZWN0KHN1cGVydmlzb3JBZ2VudC5nZXRDb252ZXJzYXRpb25Db250ZXh0KGNvbnRleHQuaWQpKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICAvLyBDbGVhbiB1cCBjb252ZXJzYXRpb25zIG9sZGVyIHRoYW4gMjQgaG91cnNcbiAgICAgIHN1cGVydmlzb3JBZ2VudC5jbGVhbnVwQ29tcGxldGVkQ29udmVyc2F0aW9ucygyNCk7XG5cbiAgICAgIC8vIFZlcmlmeSBjb252ZXJzYXRpb24gd2FzIHJlbW92ZWRcbiAgICAgIGV4cGVjdChzdXBlcnZpc29yQWdlbnQuZ2V0Q29udmVyc2F0aW9uQ29udGV4dChjb250ZXh0LmlkKSkudG9CZVVuZGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgcmVtb3ZlIHJlY2VudCBjb21wbGV0ZWQgY29udmVyc2F0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIENyZWF0ZSBhIGNvbnZlcnNhdGlvblxuICAgICAgbW9ja0NsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGVcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgICBjb21wbGV0aW9uOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICB1bmRlcnN0YW5kaW5nOiAnVGVzdCcsXG4gICAgICAgICAgICBvYmplY3RpdmVzOiBbJ1Rlc3QnXSxcbiAgICAgICAgICAgIGFuYWx5c2lzVHlwZTogJ2Jhc2ljJyxcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzOiB7fSxcbiAgICAgICAgICAgIGRlbGl2ZXJhYmxlczogWydUZXN0J11cbiAgICAgICAgICB9KSxcbiAgICAgICAgICBtb2RlbElkOiAnYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgICAgICB1c2FnZTogeyBpbnB1dFRva2VuczogMjUsIG91dHB1dFRva2VuczogNTAsIHRvdGFsVG9rZW5zOiA3NSB9LFxuICAgICAgICAgIHJlcXVlc3RJZDogJ3JlcTcnXG4gICAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjb250ZXh0ID0gYXdhaXQgc3VwZXJ2aXNvckFnZW50LnByb2Nlc3NVc2VyUmVxdWVzdChcbiAgICAgICAgJ3VzZXIxMjMnLFxuICAgICAgICAndGVzdC1yZXF1ZXN0JyxcbiAgICAgICAge31cbiAgICAgICk7XG5cbiAgICAgIC8vIE1hcmsgYXMgY29tcGxldGVkIHdpdGggcmVjZW50IHRpbWVzdGFtcFxuICAgICAgY29udGV4dC5jdXJyZW50UGhhc2UgPSAnY29tcGxldGVkJztcbiAgICAgIGNvbnRleHQudXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuICAgICAgLy8gQ2xlYW4gdXAgY29udmVyc2F0aW9ucyBvbGRlciB0aGFuIDI0IGhvdXJzXG4gICAgICBzdXBlcnZpc29yQWdlbnQuY2xlYW51cENvbXBsZXRlZENvbnZlcnNhdGlvbnMoMjQpO1xuXG4gICAgICAvLyBWZXJpZnkgY29udmVyc2F0aW9uIHN0aWxsIGV4aXN0c1xuICAgICAgZXhwZWN0KHN1cGVydmlzb3JBZ2VudC5nZXRDb252ZXJzYXRpb25Db250ZXh0KGNvbnRleHQuaWQpKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnbWVzc2FnZSBxdWV1ZSBtYW5hZ2VtZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbWFuYWdlIG1lc3NhZ2UgcXVldWUgY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZTE6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAndGFzazEnIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252MScsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxMSdcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgbWVzc2FnZTI6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ2FuYWx5c2lzJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAndGFzazInIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYyJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEyJ1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBBZGQgbWVzc2FnZXNcbiAgICAgIHN1cGVydmlzb3JBZ2VudC5zZW5kTWVzc2FnZShtZXNzYWdlMSk7XG4gICAgICBzdXBlcnZpc29yQWdlbnQuc2VuZE1lc3NhZ2UobWVzc2FnZTIpO1xuXG4gICAgICAvLyBDaGVjayBxdWV1ZVxuICAgICAgY29uc3QgcXVldWUgPSBzdXBlcnZpc29yQWdlbnQuZ2V0TWVzc2FnZVF1ZXVlKCk7XG4gICAgICBleHBlY3QocXVldWUpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChxdWV1ZSkudG9Db250YWluKG1lc3NhZ2UxKTtcbiAgICAgIGV4cGVjdChxdWV1ZSkudG9Db250YWluKG1lc3NhZ2UyKTtcblxuICAgICAgLy8gQ2xlYXIgcXVldWVcbiAgICAgIHN1cGVydmlzb3JBZ2VudC5jbGVhck1lc3NhZ2VRdWV1ZSgpO1xuICAgICAgZXhwZWN0KHN1cGVydmlzb3JBZ2VudC5nZXRNZXNzYWdlUXVldWUoKSkudG9IYXZlTGVuZ3RoKDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnYWdlbnQgY2FwYWJpbGl0aWVzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGF2ZSBjb3JyZWN0IGNhcGFiaWxpdGllcyBmb3IgZWFjaCBhZ2VudCB0eXBlJywgKCkgPT4ge1xuICAgICAgY29uc3QgYWdlbnRUeXBlczogQWdlbnRUeXBlW10gPSBbJ3N1cGVydmlzb3InLCAncGxhbm5pbmcnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnLCAnY29tcGxpYW5jZScsICdzeW50aGVzaXMnXTtcblxuICAgICAgYWdlbnRUeXBlcy5mb3JFYWNoKGFnZW50VHlwZSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHN1cGVydmlzb3JBZ2VudC5nZXRBZ2VudFN0YXR1cyhhZ2VudFR5cGUpO1xuICAgICAgICBleHBlY3Qoc3RhdHVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3Qoc3RhdHVzPy5jYXBhYmlsaXRpZXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChzdGF0dXM/LmNhcGFiaWxpdGllcy5zdXBwb3J0ZWRUYXNrcykudG9CZUluc3RhbmNlT2YoQXJyYXkpO1xuICAgICAgICBleHBlY3Qoc3RhdHVzPy5jYXBhYmlsaXRpZXMubWF4Q29uY3VycmVudFRhc2tzKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIGV4cGVjdChzdGF0dXM/LmNhcGFiaWxpdGllcy5hdmVyYWdlUHJvY2Vzc2luZ1RpbWUpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgICAgZXhwZWN0KHN0YXR1cz8uY2FwYWJpbGl0aWVzLnJlbGlhYmlsaXR5KS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIGV4cGVjdChzdGF0dXM/LmNhcGFiaWxpdGllcy5yZWxpYWJpbGl0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgICAgZXhwZWN0KHN0YXR1cz8uY2FwYWJpbGl0aWVzLnNwZWNpYWxpemF0aW9ucykudG9CZUluc3RhbmNlT2YoQXJyYXkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCd0YXNrIGxpZmVjeWNsZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBjb21wbGV0ZSB0YXNrIGxpZmVjeWNsZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHRhc2s6IEFnZW50VGFzayA9IHtcbiAgICAgICAgaWQ6ICdsaWZlY3ljbGUtdGFzaycsXG4gICAgICAgIHR5cGU6ICd0ZXh0LWdlbmVyYXRpb24nLFxuICAgICAgICBjb21wbGV4aXR5OiAnc2ltcGxlJyxcbiAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgICAgYWdlbnRSb2xlOiAncmVzZWFyY2gnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3QgbGlmZWN5Y2xlIHRhc2snLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7IHRlc3Q6ICd2YWx1ZScgfSxcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBbXSxcbiAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAgICB9O1xuXG4gICAgICAvLyBEZWxlZ2F0ZSB0YXNrXG4gICAgICBjb25zdCBkZWxlZ2F0aW9uUmVzdWx0ID0gYXdhaXQgc3VwZXJ2aXNvckFnZW50LmRlbGVnYXRlVGFzayh0YXNrKTtcbiAgICAgIGV4cGVjdChkZWxlZ2F0aW9uUmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QodGFzay5zdGF0dXMpLnRvQmUoJ2Fzc2lnbmVkJyk7XG4gICAgICBleHBlY3QodGFzay5hc3NpZ25lZFRvKS50b0JlKCdyZXNlYXJjaCcpO1xuXG4gICAgICAvLyBDaGVjayBhZ2VudCBzdGF0dXMgd2FzIHVwZGF0ZWQgaW1tZWRpYXRlbHkgYWZ0ZXIgZGVsZWdhdGlvblxuICAgICAgY29uc3QgYWdlbnRTdGF0dXMgPSBzdXBlcnZpc29yQWdlbnQuZ2V0QWdlbnRTdGF0dXMoJ3Jlc2VhcmNoJyk7XG4gICAgICBleHBlY3QoYWdlbnRTdGF0dXM/LmN1cnJlbnRUYXNrcykudG9Db250YWluKHRhc2suaWQpO1xuICAgICAgXG4gICAgICAvLyBXYWl0IGZvciBzaW11bGF0ZWQgY29tcGxldGlvblxuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayB0YXNrIHdhcyBjb21wbGV0ZWRcbiAgICAgIGV4cGVjdCh0YXNrLnN0YXR1cykudG9CZSgnY29tcGxldGVkJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19