/**
 * Message Bus Service for Agent Communication
 * 
 * This service provides the core message passing infrastructure for
 * inter-agent communication in the Investment AI Agent system.
 */

import { AgentMessage, AgentType, ConversationContext } from '../../models/agent';
import { EventEmitter } from 'events';

export interface MessageBusConfig {
  maxRetries: number;
  retryDelayMs: number;
  messageTimeoutMs: number;
  maxQueueSize: number;
  enablePersistence: boolean;
}

export interface MessageDeliveryResult {
  success: boolean;
  messageId: string;
  deliveredAt?: Date;
  error?: string;
  retryCount: number;
}

export interface MessageSubscription {
  agentType: AgentType;
  messageTypes: string[];
  callback: (message: AgentMessage) => Promise<void>;
}

export class MessageBus extends EventEmitter {
  private config: MessageBusConfig;
  private messageQueue: Map<string, AgentMessage[]> = new Map();
  private subscriptions: Map<AgentType, MessageSubscription[]> = new Map();
  private messageHistory: Map<string, AgentMessage[]> = new Map();
  private retryQueue: Map<string, { message: AgentMessage; retryCount: number; nextRetry: Date }> = new Map();
  private activeConversations: Map<string, ConversationContext> = new Map();

  constructor(config: Partial<MessageBusConfig> = {}) {
    super();
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      messageTimeoutMs: 30000,
      maxQueueSize: 1000,
      enablePersistence: true,
      ...config
    };

    // Start retry processor
    this.startRetryProcessor();
    
    // Start message timeout processor
    this.startTimeoutProcessor();
  }

  /**
   * Send a message to a specific agent or broadcast to all agents
   */
  async sendMessage(message: AgentMessage): Promise<MessageDeliveryResult> {
    try {
      // Validate message
      this.validateMessage(message);

      // Generate message ID if not provided
      const messageId = this.generateMessageId(message);
      
      // Add to conversation history
      this.addToConversationHistory(message);

      // Handle broadcast messages
      if (message.recipient === 'broadcast') {
        return await this.broadcastMessage(message);
      }

      // Handle direct messages
      return await this.deliverMessage(message);

    } catch (error) {
      return {
        success: false,
        messageId: this.generateMessageId(message),
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: 0
      };
    }
  }

  /**
   * Subscribe an agent to receive messages
   */
  subscribe(subscription: MessageSubscription): void {
    const agentSubscriptions = this.subscriptions.get(subscription.agentType) || [];
    agentSubscriptions.push(subscription);
    this.subscriptions.set(subscription.agentType, agentSubscriptions);

    this.emit('agent-subscribed', {
      agentType: subscription.agentType,
      messageTypes: subscription.messageTypes
    });
  }

  /**
   * Unsubscribe an agent from receiving messages
   */
  unsubscribe(agentType: AgentType, callback?: (message: AgentMessage) => Promise<void>): void {
    const subscriptions = this.subscriptions.get(agentType) || [];
    
    if (callback) {
      // Remove specific subscription
      const filtered = subscriptions.filter(sub => sub.callback !== callback);
      this.subscriptions.set(agentType, filtered);
    } else {
      // Remove all subscriptions for this agent
      this.subscriptions.delete(agentType);
    }

    this.emit('agent-unsubscribed', { agentType });
  }

  /**
   * Get conversation history for a specific conversation
   */
  getConversationHistory(conversationId: string): AgentMessage[] {
    return this.messageHistory.get(conversationId) || [];
  }

  /**
   * Get active conversation context
   */
  getConversationContext(conversationId: string): ConversationContext | undefined {
    return this.activeConversations.get(conversationId);
  }

  /**
   * Update conversation context
   */
  updateConversationContext(context: ConversationContext): void {
    this.activeConversations.set(context.id, context);
    this.emit('conversation-updated', context);
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): {
    totalMessages: number;
    messagesByAgent: Record<string, number>;
    retryQueueSize: number;
    activeConversations: number;
  } {
    const messagesByAgent: Record<string, number> = {};
    let totalMessages = 0;

    for (const [agentType, messages] of this.messageQueue.entries()) {
      messagesByAgent[agentType] = messages.length;
      totalMessages += messages.length;
    }

    return {
      totalMessages,
      messagesByAgent,
      retryQueueSize: this.retryQueue.size,
      activeConversations: this.activeConversations.size
    };
  }

  /**
   * Clear conversation data (for cleanup)
   */
  clearConversation(conversationId: string): void {
    this.messageHistory.delete(conversationId);
    this.activeConversations.delete(conversationId);
    
    // Remove related retry queue entries
    for (const [key, entry] of this.retryQueue.entries()) {
      if (entry.message.metadata.conversationId === conversationId) {
        this.retryQueue.delete(key);
      }
    }

    this.emit('conversation-cleared', { conversationId });
  }

  /**
   * Cleanup resources (for testing and shutdown)
   */
  cleanup(): void {
    this.messageQueue.clear();
    this.subscriptions.clear();
    this.messageHistory.clear();
    this.retryQueue.clear();
    this.activeConversations.clear();
    this.removeAllListeners();
  }

  private validateMessage(message: AgentMessage): void {
    if (!message.sender) {
      throw new Error('Message sender is required');
    }
    if (!message.recipient) {
      throw new Error('Message recipient is required');
    }
    if (!message.messageType) {
      throw new Error('Message type is required');
    }
    if (!message.metadata?.conversationId) {
      throw new Error('Conversation ID is required in message metadata');
    }
    if (!message.metadata?.requestId) {
      throw new Error('Request ID is required in message metadata');
    }
  }

  private generateMessageId(message: AgentMessage): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${message.sender}-${message.recipient}-${timestamp}-${random}`;
  }

  private addToConversationHistory(message: AgentMessage): void {
    const conversationId = message.metadata.conversationId;
    const history = this.messageHistory.get(conversationId) || [];
    history.push(message);
    
    // Limit history size to prevent memory issues
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    this.messageHistory.set(conversationId, history);
  }

  private async broadcastMessage(message: AgentMessage): Promise<MessageDeliveryResult> {
    const messageId = this.generateMessageId(message);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Send to all subscribed agents
    for (const [agentType, subscriptions] of this.subscriptions.entries()) {
      if (agentType === message.sender) continue; // Don't send to sender

      for (const subscription of subscriptions) {
        if (subscription.messageTypes.includes(message.messageType) || 
            subscription.messageTypes.includes('*')) {
          try {
            await subscription.callback(message);
            successCount++;
          } catch (error) {
            errorCount++;
            errors.push(`${agentType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }

    return {
      success: errorCount === 0,
      messageId,
      deliveredAt: new Date(),
      error: errors.length > 0 ? errors.join('; ') : undefined,
      retryCount: 0
    };
  }

  private async deliverMessage(message: AgentMessage): Promise<MessageDeliveryResult> {
    const messageId = this.generateMessageId(message);
    const subscriptions = this.subscriptions.get(message.recipient as AgentType) || [];

    if (subscriptions.length === 0) {
      // Queue message for later delivery
      this.queueMessage(message.recipient as AgentType, message);
      return {
        success: false,
        messageId,
        error: `No subscribers found for agent: ${message.recipient}`,
        retryCount: 0
      };
    }

    // Deliver to all matching subscriptions
    let delivered = false;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      if (subscription.messageTypes.includes(message.messageType) || 
          subscription.messageTypes.includes('*')) {
        try {
          await subscription.callback(message);
          delivered = true;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    if (!delivered && errors.length === 0) {
      errors.push(`No matching subscription found for message type: ${message.messageType}`);
    }

    if (!delivered || errors.length > 0) {
      // Add to retry queue
      this.addToRetryQueue(message);
    }

    return {
      success: delivered && errors.length === 0,
      messageId,
      deliveredAt: delivered ? new Date() : undefined,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      retryCount: 0
    };
  }

  private queueMessage(agentType: AgentType, message: AgentMessage): void {
    const queue = this.messageQueue.get(agentType) || [];
    
    if (queue.length >= this.config.maxQueueSize) {
      // Remove oldest message to make room
      queue.shift();
    }
    
    queue.push(message);
    this.messageQueue.set(agentType, queue);
  }

  private addToRetryQueue(message: AgentMessage): void {
    const retryKey = this.generateMessageId(message);
    const nextRetry = new Date(Date.now() + this.config.retryDelayMs);
    
    this.retryQueue.set(retryKey, {
      message,
      retryCount: 0,
      nextRetry
    });
  }

  private startRetryProcessor(): void {
    setInterval(async () => {
      const now = new Date();
      
      for (const [key, entry] of this.retryQueue.entries()) {
        if (entry.nextRetry <= now && entry.retryCount < this.config.maxRetries) {
          try {
            const result = await this.deliverMessage(entry.message);
            
            if (result.success) {
              this.retryQueue.delete(key);
              this.emit('message-retry-success', { messageId: result.messageId, retryCount: entry.retryCount + 1 });
            } else {
              // Update retry count and next retry time
              entry.retryCount++;
              entry.nextRetry = new Date(now.getTime() + (this.config.retryDelayMs * Math.pow(2, entry.retryCount)));
              
              if (entry.retryCount >= this.config.maxRetries) {
                this.retryQueue.delete(key);
                this.emit('message-retry-failed', { 
                  messageId: result.messageId, 
                  retryCount: entry.retryCount,
                  error: result.error 
                });
              }
            }
          } catch (error) {
            entry.retryCount++;
            entry.nextRetry = new Date(now.getTime() + (this.config.retryDelayMs * Math.pow(2, entry.retryCount)));
            
            if (entry.retryCount >= this.config.maxRetries) {
              this.retryQueue.delete(key);
              this.emit('message-retry-failed', { 
                messageId: key, 
                retryCount: entry.retryCount,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        }
      }
    }, 1000); // Check every second
  }

  private startTimeoutProcessor(): void {
    setInterval(() => {
      const now = new Date();
      const timeoutThreshold = new Date(now.getTime() - this.config.messageTimeoutMs);
      
      // Clean up old messages from queues
      for (const [agentType, messages] of this.messageQueue.entries()) {
        const filteredMessages = messages.filter(msg => 
          msg.metadata.timestamp > timeoutThreshold
        );
        
        if (filteredMessages.length !== messages.length) {
          this.messageQueue.set(agentType, filteredMessages);
          this.emit('messages-timeout', { 
            agentType, 
            expiredCount: messages.length - filteredMessages.length 
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }
}