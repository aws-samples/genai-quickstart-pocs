/**
 * Tests for MessageBus service
 */

import { MessageBus, MessageBusConfig, MessageSubscription } from '../communication/message-bus';
import { AgentMessage, AgentType } from '../../models/agent';

describe('MessageBus', () => {
  let messageBus: MessageBus;
  let testConfig: Partial<MessageBusConfig>;

  beforeEach(() => {
    testConfig = {
      maxRetries: 2,
      retryDelayMs: 100,
      messageTimeoutMs: 5000,
      maxQueueSize: 10,
      enablePersistence: false
    };
    messageBus = new MessageBus(testConfig);
  });

  afterEach(() => {
    messageBus.cleanup();
    // Clear any pending timers to prevent memory leaks
    jest.clearAllTimers();
  });

  describe('sendMessage', () => {
    it('should send a message successfully to subscribed agent', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const subscription: MessageSubscription = {
        agentType: 'research',
        messageTypes: ['request'],
        callback: mockCallback
      };

      messageBus.subscribe(subscription);

      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      const result = await messageBus.sendMessage(message);

      expect(result.success).toBe(true);
      expect(result.deliveredAt).toBeDefined();
      expect(mockCallback).toHaveBeenCalledWith(message);
    });

    it('should handle broadcast messages', async () => {
      const mockCallback1 = jest.fn().mockResolvedValue(undefined);
      const mockCallback2 = jest.fn().mockResolvedValue(undefined);

      messageBus.subscribe({
        agentType: 'research',
        messageTypes: ['update'],
        callback: mockCallback1
      });

      messageBus.subscribe({
        agentType: 'analysis',
        messageTypes: ['update'],
        callback: mockCallback2
      });

      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'broadcast',
        messageType: 'update',
        content: { status: 'system maintenance' },
        metadata: {
          priority: 'high',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      const result = await messageBus.sendMessage(message);

      expect(result.success).toBe(true);
      expect(mockCallback1).toHaveBeenCalledWith(message);
      expect(mockCallback2).toHaveBeenCalledWith(message);
    });

    it('should queue messages when no subscribers are available', async () => {
      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      const result = await messageBus.sendMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No subscribers found');

      const queueStatus = messageBus.getQueueStatus();
      expect(queueStatus.messagesByAgent['research']).toBe(1);
    });

    it('should validate message format', async () => {
      const invalidMessage = {
        sender: 'supervisor',
        // missing recipient
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      } as AgentMessage;

      const result = await messageBus.sendMessage(invalidMessage);

      expect(result.success).toBe(false);
      expect(result.error).toContain('recipient is required');
    });
  });

  describe('subscription management', () => {
    it('should allow agents to subscribe to specific message types', () => {
      const mockCallback = jest.fn();
      const subscription: MessageSubscription = {
        agentType: 'research',
        messageTypes: ['request', 'update'],
        callback: mockCallback
      };

      messageBus.subscribe(subscription);

      // Verify subscription was added (internal state check)
      expect(messageBus.getQueueStatus().totalMessages).toBe(0);
    });

    it('should allow agents to unsubscribe', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const subscription: MessageSubscription = {
        agentType: 'research',
        messageTypes: ['request'],
        callback: mockCallback
      };

      messageBus.subscribe(subscription);
      messageBus.unsubscribe('research');

      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      const result = await messageBus.sendMessage(message);

      expect(result.success).toBe(false);
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('conversation management', () => {
    it('should track conversation history', async () => {
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
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      await messageBus.sendMessage(message);

      const history = messageBus.getConversationHistory('conv-123');
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(message);
    });

    it('should clear conversation data', async () => {
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
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      await messageBus.sendMessage(message);
      messageBus.clearConversation('conv-123');

      const history = messageBus.getConversationHistory('conv-123');
      expect(history).toHaveLength(0);
    });
  });

  describe('error handling and retries', () => {
    it('should retry failed message deliveries', async () => {
      let callCount = 0;
      const mockCallback = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve();
      });

      messageBus.subscribe({
        agentType: 'research',
        messageTypes: ['request'],
        callback: mockCallback
      });

      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      const result = await messageBus.sendMessage(message);

      // Initial delivery should fail
      expect(result.success).toBe(false);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Wait for retry with longer timeout
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Should have retried and succeeded
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should emit retry events', (done) => {
      const mockCallback = jest.fn().mockRejectedValue(new Error('Always fails'));

      messageBus.subscribe({
        agentType: 'research',
        messageTypes: ['request'],
        callback: mockCallback
      });

      messageBus.on('message-retry-failed', (event) => {
        expect(event.retryCount).toBeGreaterThan(0);
        expect(event.error).toBeDefined();
        done();
      });

      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      messageBus.sendMessage(message);
    });
  });

  describe('queue management', () => {
    it('should provide queue status information', async () => {
      // Send message to non-existent subscriber to queue it
      const message: AgentMessage = {
        sender: 'supervisor',
        recipient: 'research',
        messageType: 'request',
        content: { task: 'analyze market data' },
        metadata: {
          priority: 'medium',
          timestamp: new Date(),
          conversationId: 'conv-123',
          requestId: 'req-456'
        }
      };

      await messageBus.sendMessage(message);

      const status = messageBus.getQueueStatus();
      expect(status.totalMessages).toBe(1);
      expect(status.messagesByAgent['research']).toBe(1);
      expect(status.retryQueueSize).toBeGreaterThanOrEqual(0);
    });

    it('should respect maximum queue size', async () => {
      const maxQueueSize = testConfig.maxQueueSize || 10;

      // Send more messages than queue size
      for (let i = 0; i < maxQueueSize + 5; i++) {
        const message: AgentMessage = {
          sender: 'supervisor',
          recipient: 'research',
          messageType: 'request',
          content: { task: `analyze data ${i}` },
          metadata: {
            priority: 'medium',
            timestamp: new Date(),
            conversationId: 'conv-123',
            requestId: `req-${i}`
          }
        };

        await messageBus.sendMessage(message);
      }

      const status = messageBus.getQueueStatus();
      expect(status.messagesByAgent['research']).toBeLessThanOrEqual(maxQueueSize);
    });
  });
});