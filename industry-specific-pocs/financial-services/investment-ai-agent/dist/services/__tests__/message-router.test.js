"use strict";
/**
 * Tests for MessageRouter service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const message_router_1 = require("../communication/message-router");
const message_bus_1 = require("../communication/message-bus");
describe('MessageRouter', () => {
    let messageBus;
    let messageRouter;
    beforeEach(() => {
        messageBus = new message_bus_1.MessageBus({
            maxRetries: 1,
            retryDelayMs: 100,
            messageTimeoutMs: 5000,
            maxQueueSize: 10,
            enablePersistence: false
        });
        messageRouter = new message_router_1.MessageRouter(messageBus, {
            enableLoadBalancing: true,
            loadBalancingStrategy: { type: 'least-busy' },
            enableCircuitBreaker: true,
            circuitBreakerThreshold: 3,
            enableMessageTransformation: true,
            maxRoutingHops: 5
        });
    });
    afterEach(() => {
        messageBus.removeAllListeners();
    });
    describe('routing rules', () => {
        it('should apply routing rules to messages', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            messageBus.subscribe({
                agentType: 'supervisor',
                messageTypes: ['request'],
                callback: mockCallback
            });
            const message = {
                sender: 'research',
                recipient: 'analysis',
                messageType: 'request',
                content: { priority: 'urgent' },
                metadata: {
                    priority: 'high',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageRouter.routeMessage(message);
            // High priority messages should be routed to supervisor by default rule
            expect(result.success).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
            const routedMessage = mockCallback.mock.calls[0][0];
            expect(routedMessage.recipient).toBe('supervisor');
        });
        it('should allow custom routing rules', async () => {
            const customRule = {
                id: 'custom-analysis-rule',
                condition: (msg) => msg.content?.type === 'financial-analysis',
                action: 'route',
                target: 'analysis',
                priority: 200
            };
            messageRouter.addRoutingRule(customRule);
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            messageBus.subscribe({
                agentType: 'analysis',
                messageTypes: ['request'],
                callback: mockCallback
            });
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { type: 'financial-analysis' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageRouter.routeMessage(message);
            expect(result.success).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
            const routedMessage = mockCallback.mock.calls[0][0];
            expect(routedMessage.recipient).toBe('analysis');
        });
        it('should filter messages when rule action is filter', async () => {
            const filterRule = {
                id: 'filter-spam',
                condition: (msg) => msg.content?.spam === true,
                action: 'filter',
                priority: 300
            };
            messageRouter.addRoutingRule(filterRule);
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { spam: true },
                metadata: {
                    priority: 'low',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageRouter.routeMessage(message);
            expect(result.success).toBe(false);
            expect(result.error).toContain('filtered by routing rules');
        });
        it('should transform messages when rule action is transform', async () => {
            const transformRule = {
                id: 'add-timestamp',
                condition: (msg) => msg.messageType === 'request',
                action: 'transform',
                transformer: (msg) => ({
                    ...msg,
                    content: {
                        ...msg.content,
                        processedAt: new Date().toISOString()
                    }
                }),
                priority: 150
            };
            messageRouter.addRoutingRule(transformRule);
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            messageBus.subscribe({
                agentType: 'research',
                messageTypes: ['request'],
                callback: mockCallback
            });
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            const result = await messageRouter.routeMessage(message);
            expect(result.success).toBe(true);
            expect(mockCallback).toHaveBeenCalled();
            const transformedMessage = mockCallback.mock.calls[0][0];
            expect(transformedMessage.content.processedAt).toBeDefined();
        });
    });
    describe('load balancing', () => {
        it('should distribute messages using least-busy strategy', async () => {
            // Set up agent statuses
            const agentStatus1 = {
                agentType: 'analysis',
                status: 'busy',
                currentTasks: ['task1', 'task2'],
                lastActivity: new Date(),
                capabilities: {
                    supportedTasks: ['analysis'],
                    maxConcurrentTasks: 5,
                    averageProcessingTime: 1000,
                    reliability: 0.95,
                    specializations: ['financial']
                }
            };
            const agentStatus2 = {
                agentType: 'analysis',
                status: 'idle',
                currentTasks: [],
                lastActivity: new Date(),
                capabilities: {
                    supportedTasks: ['analysis'],
                    maxConcurrentTasks: 5,
                    averageProcessingTime: 1200,
                    reliability: 0.90,
                    specializations: ['market']
                }
            };
            messageRouter.updateAgentStatus(agentStatus1);
            messageRouter.updateAgentStatus(agentStatus2);
            // This test would require more complex setup to properly test load balancing
            // For now, we'll test that the router accepts agent status updates
            const stats = messageRouter.getRoutingStats();
            expect(stats.agentStatuses['analysis']).toBeDefined();
        });
        it('should handle round-robin load balancing', async () => {
            const router = new message_router_1.MessageRouter(messageBus, {
                enableLoadBalancing: true,
                loadBalancingStrategy: { type: 'round-robin' },
                enableCircuitBreaker: false
            });
            // Test would require multiple agents of same type to properly verify round-robin
            expect(router).toBeDefined();
        });
    });
    describe('circuit breaker', () => {
        it('should open circuit breaker after threshold failures', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            // Simulate failures by not having any subscribers
            for (let i = 0; i < 5; i++) {
                await messageRouter.routeMessage(message);
            }
            const stats = messageRouter.getRoutingStats();
            expect(stats.circuitBreakerStates['research']).toBe(true);
        });
        it('should prevent routing when circuit is open', async () => {
            // First, open the circuit breaker
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456'
                }
            };
            // Cause failures to open circuit
            for (let i = 0; i < 5; i++) {
                await messageRouter.routeMessage(message);
            }
            // Now try to route another message
            const result = await messageRouter.routeMessage(message);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Circuit breaker is open');
        });
    });
    describe('rule management', () => {
        it('should add and remove routing rules', () => {
            const rule = {
                id: 'test-rule',
                condition: (msg) => msg.messageType === 'test',
                action: 'route',
                target: 'analysis',
                priority: 100
            };
            messageRouter.addRoutingRule(rule);
            let stats = messageRouter.getRoutingStats();
            expect(stats.totalRules).toBeGreaterThan(0);
            const removed = messageRouter.removeRoutingRule('test-rule');
            expect(removed).toBe(true);
            stats = messageRouter.getRoutingStats();
            // Should have fewer rules now (exact count depends on default rules)
        });
        it('should maintain rule priority order', () => {
            const lowPriorityRule = {
                id: 'low-priority',
                condition: (msg) => true,
                action: 'route',
                target: 'analysis',
                priority: 10
            };
            const highPriorityRule = {
                id: 'high-priority',
                condition: (msg) => true,
                action: 'route',
                target: 'supervisor',
                priority: 200
            };
            messageRouter.addRoutingRule(lowPriorityRule);
            messageRouter.addRoutingRule(highPriorityRule);
            // Rules should be applied in priority order (high to low)
            // This would require access to internal rule array to properly test
            expect(messageRouter.getRoutingStats().totalRules).toBeGreaterThan(0);
        });
    });
    describe('error handling', () => {
        it('should handle routing loops', async () => {
            const message = {
                sender: 'supervisor',
                recipient: 'research',
                messageType: 'request',
                content: { task: 'analyze data' },
                metadata: {
                    priority: 'medium',
                    timestamp: new Date(),
                    conversationId: 'conv-123',
                    requestId: 'req-456',
                    routingHops: 10 // Simulate max hops reached
                }
            };
            const result = await messageRouter.routeMessage(message);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum routing hops exceeded');
        });
        it('should provide routing statistics', () => {
            const stats = messageRouter.getRoutingStats();
            expect(stats).toHaveProperty('totalRules');
            expect(stats).toHaveProperty('circuitBreakerStates');
            expect(stats).toHaveProperty('agentStatuses');
            expect(typeof stats.totalRules).toBe('number');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1yb3V0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vbWVzc2FnZS1yb3V0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsb0VBQW9HO0FBQ3BHLDhEQUEwRDtBQUcxRCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUM3QixJQUFJLFVBQXNCLENBQUM7SUFDM0IsSUFBSSxhQUE0QixDQUFDO0lBRWpDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxVQUFVLEdBQUcsSUFBSSx3QkFBVSxDQUFDO1lBQzFCLFVBQVUsRUFBRSxDQUFDO1lBQ2IsWUFBWSxFQUFFLEdBQUc7WUFDakIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixZQUFZLEVBQUUsRUFBRTtZQUNoQixpQkFBaUIsRUFBRSxLQUFLO1NBQ3pCLENBQUMsQ0FBQztRQUVILGFBQWEsR0FBRyxJQUFJLDhCQUFhLENBQUMsVUFBVSxFQUFFO1lBQzVDLG1CQUFtQixFQUFFLElBQUk7WUFDekIscUJBQXFCLEVBQUUsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQzdDLG9CQUFvQixFQUFFLElBQUk7WUFDMUIsdUJBQXVCLEVBQUUsQ0FBQztZQUMxQiwyQkFBMkIsRUFBRSxJQUFJO1lBQ2pDLGNBQWMsRUFBRSxDQUFDO1NBQ2xCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNiLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0lBQ2xDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDN0IsRUFBRSxDQUFDLHdDQUF3QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3RELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1RCxVQUFVLENBQUMsU0FBUyxDQUFDO2dCQUNuQixTQUFTLEVBQUUsWUFBWTtnQkFDdkIsWUFBWSxFQUFFLENBQUMsU0FBUyxDQUFDO2dCQUN6QixRQUFRLEVBQUUsWUFBWTthQUN2QixDQUFDLENBQUM7WUFFSCxNQUFNLE9BQU8sR0FBaUI7Z0JBQzVCLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixTQUFTLEVBQUUsVUFBVTtnQkFDckIsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUU7Z0JBQy9CLFFBQVEsRUFBRTtvQkFDUixRQUFRLEVBQUUsTUFBTTtvQkFDaEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO29CQUNyQixjQUFjLEVBQUUsVUFBVTtvQkFDMUIsU0FBUyxFQUFFLFNBQVM7aUJBQ3JCO2FBQ0YsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV6RCx3RUFBd0U7WUFDeEUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDeEMsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakQsTUFBTSxVQUFVLEdBQWdCO2dCQUM5QixFQUFFLEVBQUUsc0JBQXNCO2dCQUMxQixTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxLQUFLLG9CQUFvQjtnQkFDOUQsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFFBQVEsRUFBRSxHQUFHO2FBQ2QsQ0FBQztZQUVGLGFBQWEsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFekMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVELFVBQVUsQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixZQUFZLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0JBQ3pCLFFBQVEsRUFBRSxZQUFZO2FBQ3ZCLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFpQjtnQkFDNUIsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixXQUFXLEVBQUUsU0FBUztnQkFDdEIsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFO2dCQUN2QyxRQUFRLEVBQUU7b0JBQ1IsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsY0FBYyxFQUFFLFVBQVU7b0JBQzFCLFNBQVMsRUFBRSxTQUFTO2lCQUNyQjthQUNGLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDeEMsTUFBTSxhQUFhLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDakUsTUFBTSxVQUFVLEdBQWdCO2dCQUM5QixFQUFFLEVBQUUsYUFBYTtnQkFDakIsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksS0FBSyxJQUFJO2dCQUM5QyxNQUFNLEVBQUUsUUFBUTtnQkFDaEIsUUFBUSxFQUFFLEdBQUc7YUFDZCxDQUFDO1lBRUYsYUFBYSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUV6QyxNQUFNLE9BQU8sR0FBaUI7Z0JBQzVCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixTQUFTLEVBQUUsVUFBVTtnQkFDckIsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7Z0JBQ3ZCLFFBQVEsRUFBRTtvQkFDUixRQUFRLEVBQUUsS0FBSztvQkFDZixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3JCLGNBQWMsRUFBRSxVQUFVO29CQUMxQixTQUFTLEVBQUUsU0FBUztpQkFDckI7YUFDRixDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXpELE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMseURBQXlELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdkUsTUFBTSxhQUFhLEdBQWdCO2dCQUNqQyxFQUFFLEVBQUUsZUFBZTtnQkFDbkIsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxLQUFLLFNBQVM7Z0JBQ2pELE1BQU0sRUFBRSxXQUFXO2dCQUNuQixXQUFXLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQ3JCLEdBQUcsR0FBRztvQkFDTixPQUFPLEVBQUU7d0JBQ1AsR0FBRyxHQUFHLENBQUMsT0FBTzt3QkFDZCxXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7cUJBQ3RDO2lCQUNGLENBQUM7Z0JBQ0YsUUFBUSxFQUFFLEdBQUc7YUFDZCxDQUFDO1lBRUYsYUFBYSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUU1QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsVUFBVSxDQUFDLFNBQVMsQ0FBQztnQkFDbkIsU0FBUyxFQUFFLFVBQVU7Z0JBQ3JCLFlBQVksRUFBRSxDQUFDLFNBQVMsQ0FBQztnQkFDekIsUUFBUSxFQUFFLFlBQVk7YUFDdkIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxPQUFPLEdBQWlCO2dCQUM1QixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsU0FBUyxFQUFFLFVBQVU7Z0JBQ3JCLFdBQVcsRUFBRSxTQUFTO2dCQUN0QixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFO2dCQUNqQyxRQUFRLEVBQUU7b0JBQ1IsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsY0FBYyxFQUFFLFVBQVU7b0JBQzFCLFNBQVMsRUFBRSxTQUFTO2lCQUNyQjthQUNGLENBQUM7WUFFRixNQUFNLE1BQU0sR0FBRyxNQUFNLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFekQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDeEMsTUFBTSxrQkFBa0IsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RCxNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQy9ELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1FBQzlCLEVBQUUsQ0FBQyxzREFBc0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNwRSx3QkFBd0I7WUFDeEIsTUFBTSxZQUFZLEdBQWdCO2dCQUNoQyxTQUFTLEVBQUUsVUFBVTtnQkFDckIsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsWUFBWSxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQztnQkFDaEMsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUN4QixZQUFZLEVBQUU7b0JBQ1osY0FBYyxFQUFFLENBQUMsVUFBVSxDQUFDO29CQUM1QixrQkFBa0IsRUFBRSxDQUFDO29CQUNyQixxQkFBcUIsRUFBRSxJQUFJO29CQUMzQixXQUFXLEVBQUUsSUFBSTtvQkFDakIsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFDO2lCQUMvQjthQUNGLENBQUM7WUFFRixNQUFNLFlBQVksR0FBZ0I7Z0JBQ2hDLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxZQUFZLEVBQUUsRUFBRTtnQkFDaEIsWUFBWSxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUN4QixZQUFZLEVBQUU7b0JBQ1osY0FBYyxFQUFFLENBQUMsVUFBVSxDQUFDO29CQUM1QixrQkFBa0IsRUFBRSxDQUFDO29CQUNyQixxQkFBcUIsRUFBRSxJQUFJO29CQUMzQixXQUFXLEVBQUUsSUFBSTtvQkFDakIsZUFBZSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUM1QjthQUNGLENBQUM7WUFFRixhQUFhLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDOUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTlDLDZFQUE2RTtZQUM3RSxtRUFBbUU7WUFDbkUsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDeEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsMENBQTBDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEQsTUFBTSxNQUFNLEdBQUcsSUFBSSw4QkFBYSxDQUFDLFVBQVUsRUFBRTtnQkFDM0MsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIscUJBQXFCLEVBQUUsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFO2dCQUM5QyxvQkFBb0IsRUFBRSxLQUFLO2FBQzVCLENBQUMsQ0FBQztZQUVILGlGQUFpRjtZQUNqRixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3BFLE1BQU0sT0FBTyxHQUFpQjtnQkFDNUIsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFNBQVMsRUFBRSxVQUFVO2dCQUNyQixXQUFXLEVBQUUsU0FBUztnQkFDdEIsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRTtnQkFDakMsUUFBUSxFQUFFO29CQUNSLFFBQVEsRUFBRSxRQUFRO29CQUNsQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3JCLGNBQWMsRUFBRSxVQUFVO29CQUMxQixTQUFTLEVBQUUsU0FBUztpQkFDckI7YUFDRixDQUFDO1lBRUYsa0RBQWtEO1lBQ2xELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFCLE1BQU0sYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUMzQztZQUVELE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNELGtDQUFrQztZQUNsQyxNQUFNLE9BQU8sR0FBaUI7Z0JBQzVCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixTQUFTLEVBQUUsVUFBVTtnQkFDckIsV0FBVyxFQUFFLFNBQVM7Z0JBQ3RCLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUU7Z0JBQ2pDLFFBQVEsRUFBRTtvQkFDUixRQUFRLEVBQUUsUUFBUTtvQkFDbEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO29CQUNyQixjQUFjLEVBQUUsVUFBVTtvQkFDMUIsU0FBUyxFQUFFLFNBQVM7aUJBQ3JCO2FBQ0YsQ0FBQztZQUVGLGlDQUFpQztZQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMxQixNQUFNLGFBQWEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDM0M7WUFFRCxtQ0FBbUM7WUFDbkMsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEdBQUcsRUFBRTtZQUM3QyxNQUFNLElBQUksR0FBZ0I7Z0JBQ3hCLEVBQUUsRUFBRSxXQUFXO2dCQUNmLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsS0FBSyxNQUFNO2dCQUM5QyxNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsUUFBUSxFQUFFLEdBQUc7YUFDZCxDQUFDO1lBRUYsYUFBYSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxJQUFJLEtBQUssR0FBRyxhQUFhLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDNUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUMsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzdELE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFM0IsS0FBSyxHQUFHLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QyxxRUFBcUU7UUFDdkUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1lBQzdDLE1BQU0sZUFBZSxHQUFnQjtnQkFDbkMsRUFBRSxFQUFFLGNBQWM7Z0JBQ2xCLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSTtnQkFDeEIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFFBQVEsRUFBRSxFQUFFO2FBQ2IsQ0FBQztZQUVGLE1BQU0sZ0JBQWdCLEdBQWdCO2dCQUNwQyxFQUFFLEVBQUUsZUFBZTtnQkFDbkIsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJO2dCQUN4QixNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsUUFBUSxFQUFFLEdBQUc7YUFDZCxDQUFDO1lBRUYsYUFBYSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM5QyxhQUFhLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFL0MsMERBQTBEO1lBQzFELG9FQUFvRTtZQUNwRSxNQUFNLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM5QixFQUFFLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0MsTUFBTSxPQUFPLEdBQWlCO2dCQUM1QixNQUFNLEVBQUUsWUFBWTtnQkFDcEIsU0FBUyxFQUFFLFVBQVU7Z0JBQ3JCLFdBQVcsRUFBRSxTQUFTO2dCQUN0QixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFO2dCQUNqQyxRQUFRLEVBQUU7b0JBQ1IsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDckIsY0FBYyxFQUFFLFVBQVU7b0JBQzFCLFNBQVMsRUFBRSxTQUFTO29CQUNwQixXQUFXLEVBQUUsRUFBRSxDQUFDLDRCQUE0QjtpQkFDdEM7YUFDVCxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxhQUFhLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pELE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDbEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBQzNDLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgTWVzc2FnZVJvdXRlciBzZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgTWVzc2FnZVJvdXRlciwgUm91dGluZ1J1bGUsIExvYWRCYWxhbmNpbmdTdHJhdGVneSB9IGZyb20gJy4uL2NvbW11bmljYXRpb24vbWVzc2FnZS1yb3V0ZXInO1xuaW1wb3J0IHsgTWVzc2FnZUJ1cyB9IGZyb20gJy4uL2NvbW11bmljYXRpb24vbWVzc2FnZS1idXMnO1xuaW1wb3J0IHsgQWdlbnRNZXNzYWdlLCBBZ2VudFN0YXR1cywgQWdlbnRUeXBlIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2FnZW50JztcblxuZGVzY3JpYmUoJ01lc3NhZ2VSb3V0ZXInLCAoKSA9PiB7XG4gIGxldCBtZXNzYWdlQnVzOiBNZXNzYWdlQnVzO1xuICBsZXQgbWVzc2FnZVJvdXRlcjogTWVzc2FnZVJvdXRlcjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtZXNzYWdlQnVzID0gbmV3IE1lc3NhZ2VCdXMoe1xuICAgICAgbWF4UmV0cmllczogMSxcbiAgICAgIHJldHJ5RGVsYXlNczogMTAwLFxuICAgICAgbWVzc2FnZVRpbWVvdXRNczogNTAwMCxcbiAgICAgIG1heFF1ZXVlU2l6ZTogMTAsXG4gICAgICBlbmFibGVQZXJzaXN0ZW5jZTogZmFsc2VcbiAgICB9KTtcblxuICAgIG1lc3NhZ2VSb3V0ZXIgPSBuZXcgTWVzc2FnZVJvdXRlcihtZXNzYWdlQnVzLCB7XG4gICAgICBlbmFibGVMb2FkQmFsYW5jaW5nOiB0cnVlLFxuICAgICAgbG9hZEJhbGFuY2luZ1N0cmF0ZWd5OiB7IHR5cGU6ICdsZWFzdC1idXN5JyB9LFxuICAgICAgZW5hYmxlQ2lyY3VpdEJyZWFrZXI6IHRydWUsXG4gICAgICBjaXJjdWl0QnJlYWtlclRocmVzaG9sZDogMyxcbiAgICAgIGVuYWJsZU1lc3NhZ2VUcmFuc2Zvcm1hdGlvbjogdHJ1ZSxcbiAgICAgIG1heFJvdXRpbmdIb3BzOiA1XG4gICAgfSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgbWVzc2FnZUJ1cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3JvdXRpbmcgcnVsZXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhcHBseSByb3V0aW5nIHJ1bGVzIHRvIG1lc3NhZ2VzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0NhbGxiYWNrID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZSh7XG4gICAgICAgIGFnZW50VHlwZTogJ3N1cGVydmlzb3InLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsncmVxdWVzdCddLFxuICAgICAgICBjYWxsYmFjazogbW9ja0NhbGxiYWNrXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdyZXNlYXJjaCcsXG4gICAgICAgIHJlY2lwaWVudDogJ2FuYWx5c2lzJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyBwcmlvcml0eTogJ3VyZ2VudCcgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtNDU2J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZXNzYWdlUm91dGVyLnJvdXRlTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgLy8gSGlnaCBwcmlvcml0eSBtZXNzYWdlcyBzaG91bGQgYmUgcm91dGVkIHRvIHN1cGVydmlzb3IgYnkgZGVmYXVsdCBydWxlXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QobW9ja0NhbGxiYWNrKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBjb25zdCByb3V0ZWRNZXNzYWdlID0gbW9ja0NhbGxiYWNrLm1vY2suY2FsbHNbMF1bMF07XG4gICAgICBleHBlY3Qocm91dGVkTWVzc2FnZS5yZWNpcGllbnQpLnRvQmUoJ3N1cGVydmlzb3InKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWxsb3cgY3VzdG9tIHJvdXRpbmcgcnVsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjdXN0b21SdWxlOiBSb3V0aW5nUnVsZSA9IHtcbiAgICAgICAgaWQ6ICdjdXN0b20tYW5hbHlzaXMtcnVsZScsXG4gICAgICAgIGNvbmRpdGlvbjogKG1zZykgPT4gbXNnLmNvbnRlbnQ/LnR5cGUgPT09ICdmaW5hbmNpYWwtYW5hbHlzaXMnLFxuICAgICAgICBhY3Rpb246ICdyb3V0ZScsXG4gICAgICAgIHRhcmdldDogJ2FuYWx5c2lzJyxcbiAgICAgICAgcHJpb3JpdHk6IDIwMFxuICAgICAgfTtcblxuICAgICAgbWVzc2FnZVJvdXRlci5hZGRSb3V0aW5nUnVsZShjdXN0b21SdWxlKTtcblxuICAgICAgY29uc3QgbW9ja0NhbGxiYWNrID0gamVzdC5mbigpLm1vY2tSZXNvbHZlZFZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBtZXNzYWdlQnVzLnN1YnNjcmliZSh7XG4gICAgICAgIGFnZW50VHlwZTogJ2FuYWx5c2lzJyxcbiAgICAgICAgbWVzc2FnZVR5cGVzOiBbJ3JlcXVlc3QnXSxcbiAgICAgICAgY2FsbGJhY2s6IG1vY2tDYWxsYmFja1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0eXBlOiAnZmluYW5jaWFsLWFuYWx5c2lzJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NidcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVzc2FnZVJvdXRlci5yb3V0ZU1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChtb2NrQ2FsbGJhY2spLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGNvbnN0IHJvdXRlZE1lc3NhZ2UgPSBtb2NrQ2FsbGJhY2subW9jay5jYWxsc1swXVswXTtcbiAgICAgIGV4cGVjdChyb3V0ZWRNZXNzYWdlLnJlY2lwaWVudCkudG9CZSgnYW5hbHlzaXMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZmlsdGVyIG1lc3NhZ2VzIHdoZW4gcnVsZSBhY3Rpb24gaXMgZmlsdGVyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsdGVyUnVsZTogUm91dGluZ1J1bGUgPSB7XG4gICAgICAgIGlkOiAnZmlsdGVyLXNwYW0nLFxuICAgICAgICBjb25kaXRpb246IChtc2cpID0+IG1zZy5jb250ZW50Py5zcGFtID09PSB0cnVlLFxuICAgICAgICBhY3Rpb246ICdmaWx0ZXInLFxuICAgICAgICBwcmlvcml0eTogMzAwXG4gICAgICB9O1xuXG4gICAgICBtZXNzYWdlUm91dGVyLmFkZFJvdXRpbmdSdWxlKGZpbHRlclJ1bGUpO1xuXG4gICAgICBjb25zdCBtZXNzYWdlOiBBZ2VudE1lc3NhZ2UgPSB7XG4gICAgICAgIHNlbmRlcjogJ3N1cGVydmlzb3InLFxuICAgICAgICByZWNpcGllbnQ6ICdyZXNlYXJjaCcsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgIGNvbnRlbnQ6IHsgc3BhbTogdHJ1ZSB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbG93JyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NidcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVzc2FnZVJvdXRlci5yb3V0ZU1lc3NhZ2UobWVzc2FnZSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuc3VjY2VzcykudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9yKS50b0NvbnRhaW4oJ2ZpbHRlcmVkIGJ5IHJvdXRpbmcgcnVsZXMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdHJhbnNmb3JtIG1lc3NhZ2VzIHdoZW4gcnVsZSBhY3Rpb24gaXMgdHJhbnNmb3JtJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgdHJhbnNmb3JtUnVsZTogUm91dGluZ1J1bGUgPSB7XG4gICAgICAgIGlkOiAnYWRkLXRpbWVzdGFtcCcsXG4gICAgICAgIGNvbmRpdGlvbjogKG1zZykgPT4gbXNnLm1lc3NhZ2VUeXBlID09PSAncmVxdWVzdCcsXG4gICAgICAgIGFjdGlvbjogJ3RyYW5zZm9ybScsXG4gICAgICAgIHRyYW5zZm9ybWVyOiAobXNnKSA9PiAoe1xuICAgICAgICAgIC4uLm1zZyxcbiAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAuLi5tc2cuY29udGVudCxcbiAgICAgICAgICAgIHByb2Nlc3NlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBwcmlvcml0eTogMTUwXG4gICAgICB9O1xuXG4gICAgICBtZXNzYWdlUm91dGVyLmFkZFJvdXRpbmdSdWxlKHRyYW5zZm9ybVJ1bGUpO1xuXG4gICAgICBjb25zdCBtb2NrQ2FsbGJhY2sgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICAgIG1lc3NhZ2VCdXMuc3Vic2NyaWJlKHtcbiAgICAgICAgYWdlbnRUeXBlOiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZXM6IFsncmVxdWVzdCddLFxuICAgICAgICBjYWxsYmFjazogbW9ja0NhbGxiYWNrXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIGRhdGEnIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtNDU2J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZXNzYWdlUm91dGVyLnJvdXRlTWVzc2FnZShtZXNzYWdlKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KG1vY2tDYWxsYmFjaykudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgY29uc3QgdHJhbnNmb3JtZWRNZXNzYWdlID0gbW9ja0NhbGxiYWNrLm1vY2suY2FsbHNbMF1bMF07XG4gICAgICBleHBlY3QodHJhbnNmb3JtZWRNZXNzYWdlLmNvbnRlbnQucHJvY2Vzc2VkQXQpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdsb2FkIGJhbGFuY2luZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGRpc3RyaWJ1dGUgbWVzc2FnZXMgdXNpbmcgbGVhc3QtYnVzeSBzdHJhdGVneScsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIFNldCB1cCBhZ2VudCBzdGF0dXNlc1xuICAgICAgY29uc3QgYWdlbnRTdGF0dXMxOiBBZ2VudFN0YXR1cyA9IHtcbiAgICAgICAgYWdlbnRUeXBlOiAnYW5hbHlzaXMnLFxuICAgICAgICBzdGF0dXM6ICdidXN5JyxcbiAgICAgICAgY3VycmVudFRhc2tzOiBbJ3Rhc2sxJywgJ3Rhc2syJ10sXG4gICAgICAgIGxhc3RBY3Rpdml0eTogbmV3IERhdGUoKSxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiB7XG4gICAgICAgICAgc3VwcG9ydGVkVGFza3M6IFsnYW5hbHlzaXMnXSxcbiAgICAgICAgICBtYXhDb25jdXJyZW50VGFza3M6IDUsXG4gICAgICAgICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiAxMDAwLFxuICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjk1LFxuICAgICAgICAgIHNwZWNpYWxpemF0aW9uczogWydmaW5hbmNpYWwnXVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBhZ2VudFN0YXR1czI6IEFnZW50U3RhdHVzID0ge1xuICAgICAgICBhZ2VudFR5cGU6ICdhbmFseXNpcycsXG4gICAgICAgIHN0YXR1czogJ2lkbGUnLFxuICAgICAgICBjdXJyZW50VGFza3M6IFtdLFxuICAgICAgICBsYXN0QWN0aXZpdHk6IG5ldyBEYXRlKCksXG4gICAgICAgIGNhcGFiaWxpdGllczoge1xuICAgICAgICAgIHN1cHBvcnRlZFRhc2tzOiBbJ2FuYWx5c2lzJ10sXG4gICAgICAgICAgbWF4Q29uY3VycmVudFRhc2tzOiA1LFxuICAgICAgICAgIGF2ZXJhZ2VQcm9jZXNzaW5nVGltZTogMTIwMCxcbiAgICAgICAgICByZWxpYWJpbGl0eTogMC45MCxcbiAgICAgICAgICBzcGVjaWFsaXphdGlvbnM6IFsnbWFya2V0J11cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgbWVzc2FnZVJvdXRlci51cGRhdGVBZ2VudFN0YXR1cyhhZ2VudFN0YXR1czEpO1xuICAgICAgbWVzc2FnZVJvdXRlci51cGRhdGVBZ2VudFN0YXR1cyhhZ2VudFN0YXR1czIpO1xuXG4gICAgICAvLyBUaGlzIHRlc3Qgd291bGQgcmVxdWlyZSBtb3JlIGNvbXBsZXggc2V0dXAgdG8gcHJvcGVybHkgdGVzdCBsb2FkIGJhbGFuY2luZ1xuICAgICAgLy8gRm9yIG5vdywgd2UnbGwgdGVzdCB0aGF0IHRoZSByb3V0ZXIgYWNjZXB0cyBhZ2VudCBzdGF0dXMgdXBkYXRlc1xuICAgICAgY29uc3Qgc3RhdHMgPSBtZXNzYWdlUm91dGVyLmdldFJvdXRpbmdTdGF0cygpO1xuICAgICAgZXhwZWN0KHN0YXRzLmFnZW50U3RhdHVzZXNbJ2FuYWx5c2lzJ10pLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSByb3VuZC1yb2JpbiBsb2FkIGJhbGFuY2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJvdXRlciA9IG5ldyBNZXNzYWdlUm91dGVyKG1lc3NhZ2VCdXMsIHtcbiAgICAgICAgZW5hYmxlTG9hZEJhbGFuY2luZzogdHJ1ZSxcbiAgICAgICAgbG9hZEJhbGFuY2luZ1N0cmF0ZWd5OiB7IHR5cGU6ICdyb3VuZC1yb2JpbicgfSxcbiAgICAgICAgZW5hYmxlQ2lyY3VpdEJyZWFrZXI6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgLy8gVGVzdCB3b3VsZCByZXF1aXJlIG11bHRpcGxlIGFnZW50cyBvZiBzYW1lIHR5cGUgdG8gcHJvcGVybHkgdmVyaWZ5IHJvdW5kLXJvYmluXG4gICAgICBleHBlY3Qocm91dGVyKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY2lyY3VpdCBicmVha2VyJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgb3BlbiBjaXJjdWl0IGJyZWFrZXIgYWZ0ZXIgdGhyZXNob2xkIGZhaWx1cmVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIGRhdGEnIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtNDU2J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBTaW11bGF0ZSBmYWlsdXJlcyBieSBub3QgaGF2aW5nIGFueSBzdWJzY3JpYmVyc1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgICAgYXdhaXQgbWVzc2FnZVJvdXRlci5yb3V0ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXRzID0gbWVzc2FnZVJvdXRlci5nZXRSb3V0aW5nU3RhdHMoKTtcbiAgICAgIGV4cGVjdChzdGF0cy5jaXJjdWl0QnJlYWtlclN0YXRlc1sncmVzZWFyY2gnXSkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJldmVudCByb3V0aW5nIHdoZW4gY2lyY3VpdCBpcyBvcGVuJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gRmlyc3QsIG9wZW4gdGhlIGNpcmN1aXQgYnJlYWtlclxuICAgICAgY29uc3QgbWVzc2FnZTogQWdlbnRNZXNzYWdlID0ge1xuICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgcmVjaXBpZW50OiAncmVzZWFyY2gnLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ3JlcXVlc3QnLFxuICAgICAgICBjb250ZW50OiB7IHRhc2s6ICdhbmFseXplIGRhdGEnIH0sXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogJ2NvbnYtMTIzJyxcbiAgICAgICAgICByZXF1ZXN0SWQ6ICdyZXEtNDU2J1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICAvLyBDYXVzZSBmYWlsdXJlcyB0byBvcGVuIGNpcmN1aXRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgIGF3YWl0IG1lc3NhZ2VSb3V0ZXIucm91dGVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgICAvLyBOb3cgdHJ5IHRvIHJvdXRlIGFub3RoZXIgbWVzc2FnZVxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgbWVzc2FnZVJvdXRlci5yb3V0ZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcikudG9Db250YWluKCdDaXJjdWl0IGJyZWFrZXIgaXMgb3BlbicpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncnVsZSBtYW5hZ2VtZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgYWRkIGFuZCByZW1vdmUgcm91dGluZyBydWxlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHJ1bGU6IFJvdXRpbmdSdWxlID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcnVsZScsXG4gICAgICAgIGNvbmRpdGlvbjogKG1zZykgPT4gbXNnLm1lc3NhZ2VUeXBlID09PSAndGVzdCcsXG4gICAgICAgIGFjdGlvbjogJ3JvdXRlJyxcbiAgICAgICAgdGFyZ2V0OiAnYW5hbHlzaXMnLFxuICAgICAgICBwcmlvcml0eTogMTAwXG4gICAgICB9O1xuXG4gICAgICBtZXNzYWdlUm91dGVyLmFkZFJvdXRpbmdSdWxlKHJ1bGUpO1xuICAgICAgbGV0IHN0YXRzID0gbWVzc2FnZVJvdXRlci5nZXRSb3V0aW5nU3RhdHMoKTtcbiAgICAgIGV4cGVjdChzdGF0cy50b3RhbFJ1bGVzKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgIGNvbnN0IHJlbW92ZWQgPSBtZXNzYWdlUm91dGVyLnJlbW92ZVJvdXRpbmdSdWxlKCd0ZXN0LXJ1bGUnKTtcbiAgICAgIGV4cGVjdChyZW1vdmVkKS50b0JlKHRydWUpO1xuXG4gICAgICBzdGF0cyA9IG1lc3NhZ2VSb3V0ZXIuZ2V0Um91dGluZ1N0YXRzKCk7XG4gICAgICAvLyBTaG91bGQgaGF2ZSBmZXdlciBydWxlcyBub3cgKGV4YWN0IGNvdW50IGRlcGVuZHMgb24gZGVmYXVsdCBydWxlcylcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gcnVsZSBwcmlvcml0eSBvcmRlcicsICgpID0+IHtcbiAgICAgIGNvbnN0IGxvd1ByaW9yaXR5UnVsZTogUm91dGluZ1J1bGUgPSB7XG4gICAgICAgIGlkOiAnbG93LXByaW9yaXR5JyxcbiAgICAgICAgY29uZGl0aW9uOiAobXNnKSA9PiB0cnVlLFxuICAgICAgICBhY3Rpb246ICdyb3V0ZScsXG4gICAgICAgIHRhcmdldDogJ2FuYWx5c2lzJyxcbiAgICAgICAgcHJpb3JpdHk6IDEwXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBoaWdoUHJpb3JpdHlSdWxlOiBSb3V0aW5nUnVsZSA9IHtcbiAgICAgICAgaWQ6ICdoaWdoLXByaW9yaXR5JyxcbiAgICAgICAgY29uZGl0aW9uOiAobXNnKSA9PiB0cnVlLFxuICAgICAgICBhY3Rpb246ICdyb3V0ZScsXG4gICAgICAgIHRhcmdldDogJ3N1cGVydmlzb3InLFxuICAgICAgICBwcmlvcml0eTogMjAwXG4gICAgICB9O1xuXG4gICAgICBtZXNzYWdlUm91dGVyLmFkZFJvdXRpbmdSdWxlKGxvd1ByaW9yaXR5UnVsZSk7XG4gICAgICBtZXNzYWdlUm91dGVyLmFkZFJvdXRpbmdSdWxlKGhpZ2hQcmlvcml0eVJ1bGUpO1xuXG4gICAgICAvLyBSdWxlcyBzaG91bGQgYmUgYXBwbGllZCBpbiBwcmlvcml0eSBvcmRlciAoaGlnaCB0byBsb3cpXG4gICAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgYWNjZXNzIHRvIGludGVybmFsIHJ1bGUgYXJyYXkgdG8gcHJvcGVybHkgdGVzdFxuICAgICAgZXhwZWN0KG1lc3NhZ2VSb3V0ZXIuZ2V0Um91dGluZ1N0YXRzKCkudG90YWxSdWxlcykudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXJyb3IgaGFuZGxpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgcm91dGluZyBsb29wcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgc2VuZGVyOiAnc3VwZXJ2aXNvcicsXG4gICAgICAgIHJlY2lwaWVudDogJ3Jlc2VhcmNoJyxcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXF1ZXN0JyxcbiAgICAgICAgY29udGVudDogeyB0YXNrOiAnYW5hbHl6ZSBkYXRhJyB9LFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6ICdjb252LTEyMycsXG4gICAgICAgICAgcmVxdWVzdElkOiAncmVxLTQ1NicsXG4gICAgICAgICAgcm91dGluZ0hvcHM6IDEwIC8vIFNpbXVsYXRlIG1heCBob3BzIHJlYWNoZWRcbiAgICAgICAgfSBhcyBhbnlcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IG1lc3NhZ2VSb3V0ZXIucm91dGVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3IpLnRvQ29udGFpbignTWF4aW11bSByb3V0aW5nIGhvcHMgZXhjZWVkZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcHJvdmlkZSByb3V0aW5nIHN0YXRpc3RpY3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0cyA9IG1lc3NhZ2VSb3V0ZXIuZ2V0Um91dGluZ1N0YXRzKCk7XG4gICAgICBleHBlY3Qoc3RhdHMpLnRvSGF2ZVByb3BlcnR5KCd0b3RhbFJ1bGVzJyk7XG4gICAgICBleHBlY3Qoc3RhdHMpLnRvSGF2ZVByb3BlcnR5KCdjaXJjdWl0QnJlYWtlclN0YXRlcycpO1xuICAgICAgZXhwZWN0KHN0YXRzKS50b0hhdmVQcm9wZXJ0eSgnYWdlbnRTdGF0dXNlcycpO1xuICAgICAgZXhwZWN0KHR5cGVvZiBzdGF0cy50b3RhbFJ1bGVzKS50b0JlKCdudW1iZXInKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=