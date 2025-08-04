/**
 * Message Bus Service for Agent Communication
 *
 * This service provides the core message passing infrastructure for
 * inter-agent communication in the Investment AI Agent system.
 */
/// <reference types="node" />
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
export declare class MessageBus extends EventEmitter {
    private config;
    private messageQueue;
    private subscriptions;
    private messageHistory;
    private retryQueue;
    private activeConversations;
    constructor(config?: Partial<MessageBusConfig>);
    /**
     * Send a message to a specific agent or broadcast to all agents
     */
    sendMessage(message: AgentMessage): Promise<MessageDeliveryResult>;
    /**
     * Subscribe an agent to receive messages
     */
    subscribe(subscription: MessageSubscription): void;
    /**
     * Unsubscribe an agent from receiving messages
     */
    unsubscribe(agentType: AgentType, callback?: (message: AgentMessage) => Promise<void>): void;
    /**
     * Get conversation history for a specific conversation
     */
    getConversationHistory(conversationId: string): AgentMessage[];
    /**
     * Get active conversation context
     */
    getConversationContext(conversationId: string): ConversationContext | undefined;
    /**
     * Update conversation context
     */
    updateConversationContext(context: ConversationContext): void;
    /**
     * Get queue status for monitoring
     */
    getQueueStatus(): {
        totalMessages: number;
        messagesByAgent: Record<string, number>;
        retryQueueSize: number;
        activeConversations: number;
    };
    /**
     * Clear conversation data (for cleanup)
     */
    clearConversation(conversationId: string): void;
    /**
     * Cleanup resources (for testing and shutdown)
     */
    cleanup(): void;
    private validateMessage;
    private generateMessageId;
    private addToConversationHistory;
    private broadcastMessage;
    private deliverMessage;
    private queueMessage;
    private addToRetryQueue;
    private startRetryProcessor;
    private startTimeoutProcessor;
}
