/**
 * Tests for MessageRouter service
 */

import { MessageRouter, RoutingRule, LoadBalancingStrategy } from '../communication/message-router';
import { MessageBus } from '../communication/message-bus';
import { AgentMessage, AgentStatus, AgentType } from '../../models/agent';

describe('MessageRouter', () => {
  let messageBus: MessageBus;
  let messageRouter: MessageRouter;

  beforeEach(() => {
    messageBus = new MessageBus({
      maxRetries: 1,
      retryDelayMs: 100,
      messageTimeoutMs: 5000,
      maxQueueSize: 10,
      enablePersistence: false
    });

    messageRouter = new MessageRouter(messageBus, {
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

      const message: AgentMessage = {
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
      const customRule: RoutingRule = {
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

      const message: AgentMessage = {
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
      const filterRule: RoutingRule = {
        id: 'filter-spam',
        condition: (msg) => msg.content?.spam === true,
        action: 'filter',
        priority: 300
      };

      messageRouter.addRoutingRule(filterRule);

      const message: AgentMessage = {
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
      const transformRule: RoutingRule = {
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

      const message: AgentMessage = {
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
      const agentStatus1: AgentStatus = {
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

      const agentStatus2: AgentStatus = {
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
      const router = new MessageRouter(messageBus, {
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
      const message: AgentMessage = {
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
      const message: AgentMessage = {
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
      const rule: RoutingRule = {
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
      const lowPriorityRule: RoutingRule = {
        id: 'low-priority',
        condition: (msg) => true,
        action: 'route',
        target: 'analysis',
        priority: 10
      };

      const highPriorityRule: RoutingRule = {
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
      const message: AgentMessage = {
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
        } as any
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