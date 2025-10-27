"use strict";
/**
 * Message Bus Service for Agent Communication
 *
 * This service provides the core message passing infrastructure for
 * inter-agent communication in the Investment AI Agent system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBus = void 0;
const events_1 = require("events");
class MessageBus extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.messageQueue = new Map();
        this.subscriptions = new Map();
        this.messageHistory = new Map();
        this.retryQueue = new Map();
        this.activeConversations = new Map();
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
    async sendMessage(message) {
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
        }
        catch (error) {
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
    subscribe(subscription) {
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
    unsubscribe(agentType, callback) {
        const subscriptions = this.subscriptions.get(agentType) || [];
        if (callback) {
            // Remove specific subscription
            const filtered = subscriptions.filter(sub => sub.callback !== callback);
            this.subscriptions.set(agentType, filtered);
        }
        else {
            // Remove all subscriptions for this agent
            this.subscriptions.delete(agentType);
        }
        this.emit('agent-unsubscribed', { agentType });
    }
    /**
     * Get conversation history for a specific conversation
     */
    getConversationHistory(conversationId) {
        return this.messageHistory.get(conversationId) || [];
    }
    /**
     * Get active conversation context
     */
    getConversationContext(conversationId) {
        return this.activeConversations.get(conversationId);
    }
    /**
     * Update conversation context
     */
    updateConversationContext(context) {
        this.activeConversations.set(context.id, context);
        this.emit('conversation-updated', context);
    }
    /**
     * Get queue status for monitoring
     */
    getQueueStatus() {
        const messagesByAgent = {};
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
    clearConversation(conversationId) {
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
    cleanup() {
        this.messageQueue.clear();
        this.subscriptions.clear();
        this.messageHistory.clear();
        this.retryQueue.clear();
        this.activeConversations.clear();
        this.removeAllListeners();
    }
    validateMessage(message) {
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
    generateMessageId(message) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${message.sender}-${message.recipient}-${timestamp}-${random}`;
    }
    addToConversationHistory(message) {
        const conversationId = message.metadata.conversationId;
        const history = this.messageHistory.get(conversationId) || [];
        history.push(message);
        // Limit history size to prevent memory issues
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
        this.messageHistory.set(conversationId, history);
    }
    async broadcastMessage(message) {
        const messageId = this.generateMessageId(message);
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        // Send to all subscribed agents
        for (const [agentType, subscriptions] of this.subscriptions.entries()) {
            if (agentType === message.sender)
                continue; // Don't send to sender
            for (const subscription of subscriptions) {
                if (subscription.messageTypes.includes(message.messageType) ||
                    subscription.messageTypes.includes('*')) {
                    try {
                        await subscription.callback(message);
                        successCount++;
                    }
                    catch (error) {
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
    async deliverMessage(message) {
        const messageId = this.generateMessageId(message);
        const subscriptions = this.subscriptions.get(message.recipient) || [];
        if (subscriptions.length === 0) {
            // Queue message for later delivery
            this.queueMessage(message.recipient, message);
            return {
                success: false,
                messageId,
                error: `No subscribers found for agent: ${message.recipient}`,
                retryCount: 0
            };
        }
        // Deliver to all matching subscriptions
        let delivered = false;
        const errors = [];
        for (const subscription of subscriptions) {
            if (subscription.messageTypes.includes(message.messageType) ||
                subscription.messageTypes.includes('*')) {
                try {
                    await subscription.callback(message);
                    delivered = true;
                }
                catch (error) {
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
    queueMessage(agentType, message) {
        const queue = this.messageQueue.get(agentType) || [];
        if (queue.length >= this.config.maxQueueSize) {
            // Remove oldest message to make room
            queue.shift();
        }
        queue.push(message);
        this.messageQueue.set(agentType, queue);
    }
    addToRetryQueue(message) {
        const retryKey = this.generateMessageId(message);
        const nextRetry = new Date(Date.now() + this.config.retryDelayMs);
        this.retryQueue.set(retryKey, {
            message,
            retryCount: 0,
            nextRetry
        });
    }
    startRetryProcessor() {
        setInterval(async () => {
            const now = new Date();
            for (const [key, entry] of this.retryQueue.entries()) {
                if (entry.nextRetry <= now && entry.retryCount < this.config.maxRetries) {
                    try {
                        const result = await this.deliverMessage(entry.message);
                        if (result.success) {
                            this.retryQueue.delete(key);
                            this.emit('message-retry-success', { messageId: result.messageId, retryCount: entry.retryCount + 1 });
                        }
                        else {
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
                    }
                    catch (error) {
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
    startTimeoutProcessor() {
        setInterval(() => {
            const now = new Date();
            const timeoutThreshold = new Date(now.getTime() - this.config.messageTimeoutMs);
            // Clean up old messages from queues
            for (const [agentType, messages] of this.messageQueue.entries()) {
                const filteredMessages = messages.filter(msg => msg.metadata.timestamp > timeoutThreshold);
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
exports.MessageBus = MessageBus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1idXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvY29tbXVuaWNhdGlvbi9tZXNzYWdlLWJ1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUdILG1DQUFzQztBQXdCdEMsTUFBYSxVQUFXLFNBQVEscUJBQVk7SUFRMUMsWUFBWSxTQUFvQyxFQUFFO1FBQ2hELEtBQUssRUFBRSxDQUFDO1FBUEYsaUJBQVksR0FBZ0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN0RCxrQkFBYSxHQUEwQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2pFLG1CQUFjLEdBQWdDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEQsZUFBVSxHQUFnRixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3BHLHdCQUFtQixHQUFxQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBSXhFLElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDWixVQUFVLEVBQUUsQ0FBQztZQUNiLFlBQVksRUFBRSxJQUFJO1lBQ2xCLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsWUFBWSxFQUFFLElBQUk7WUFDbEIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixHQUFHLE1BQU07U0FDVixDQUFDO1FBRUYsd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBRTNCLGtDQUFrQztRQUNsQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQXFCO1FBQ3JDLElBQUk7WUFDRixtQkFBbUI7WUFDbkIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU5QixzQ0FBc0M7WUFDdEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWxELDhCQUE4QjtZQUM5QixJQUFJLENBQUMsd0JB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RSxnQkFBZ0IsQ0FBQyxDQUFDO29CQUNuRCxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFO3dCQUM1QixTQUFTO3dCQUNULFlBQVksRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLGdCQUFnQixDQUFDLE1BQU07cUJBQ3hELENBQUMsQ0FBQztpQkFDSjthQUNGO1FBQ0gsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMseUJBQXlCO0lBQ3RDLENBQUM7Q0FDRjtBQXJYRCxnQ0FxWEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1lc3NhZ2UgQnVzIFNlcnZpY2UgZm9yIEFnZW50IENvbW11bmljYXRpb25cbiAqIFxuICogVGhpcyBzZXJ2aWNlIHByb3ZpZGVzIHRoZSBjb3JlIG1lc3NhZ2UgcGFzc2luZyBpbmZyYXN0cnVjdHVyZSBmb3JcbiAqIGludGVyLWFnZW50IGNvbW11bmljYXRpb24gaW4gdGhlIEludmVzdG1lbnQgQUkgQWdlbnQgc3lzdGVtLlxuICovXG5cbmltcG9ydCB7IEFnZW50TWVzc2FnZSwgQWdlbnRUeXBlLCBDb252ZXJzYXRpb25Db250ZXh0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2FnZW50JztcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVzc2FnZUJ1c0NvbmZpZyB7XG4gIG1heFJldHJpZXM6IG51bWJlcjtcbiAgcmV0cnlEZWxheU1zOiBudW1iZXI7XG4gIG1lc3NhZ2VUaW1lb3V0TXM6IG51bWJlcjtcbiAgbWF4UXVldWVTaXplOiBudW1iZXI7XG4gIGVuYWJsZVBlcnNpc3RlbmNlOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2VEZWxpdmVyeVJlc3VsdCB7XG4gIHN1Y2Nlc3M6IGJvb2xlYW47XG4gIG1lc3NhZ2VJZDogc3RyaW5nO1xuICBkZWxpdmVyZWRBdD86IERhdGU7XG4gIGVycm9yPzogc3RyaW5nO1xuICByZXRyeUNvdW50OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVzc2FnZVN1YnNjcmlwdGlvbiB7XG4gIGFnZW50VHlwZTogQWdlbnRUeXBlO1xuICBtZXNzYWdlVHlwZXM6IHN0cmluZ1tdO1xuICBjYWxsYmFjazogKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSkgPT4gUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IGNsYXNzIE1lc3NhZ2VCdXMgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBwcml2YXRlIGNvbmZpZzogTWVzc2FnZUJ1c0NvbmZpZztcbiAgcHJpdmF0ZSBtZXNzYWdlUXVldWU6IE1hcDxzdHJpbmcsIEFnZW50TWVzc2FnZVtdPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdWJzY3JpcHRpb25zOiBNYXA8QWdlbnRUeXBlLCBNZXNzYWdlU3Vic2NyaXB0aW9uW10+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIG1lc3NhZ2VIaXN0b3J5OiBNYXA8c3RyaW5nLCBBZ2VudE1lc3NhZ2VbXT4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgcmV0cnlRdWV1ZTogTWFwPHN0cmluZywgeyBtZXNzYWdlOiBBZ2VudE1lc3NhZ2U7IHJldHJ5Q291bnQ6IG51bWJlcjsgbmV4dFJldHJ5OiBEYXRlIH0+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIGFjdGl2ZUNvbnZlcnNhdGlvbnM6IE1hcDxzdHJpbmcsIENvbnZlcnNhdGlvbkNvbnRleHQ+ID0gbmV3IE1hcCgpO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUGFydGlhbDxNZXNzYWdlQnVzQ29uZmlnPiA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIG1heFJldHJpZXM6IDMsXG4gICAgICByZXRyeURlbGF5TXM6IDEwMDAsXG4gICAgICBtZXNzYWdlVGltZW91dE1zOiAzMDAwMCxcbiAgICAgIG1heFF1ZXVlU2l6ZTogMTAwMCxcbiAgICAgIGVuYWJsZVBlcnNpc3RlbmNlOiB0cnVlLFxuICAgICAgLi4uY29uZmlnXG4gICAgfTtcblxuICAgIC8vIFN0YXJ0IHJldHJ5IHByb2Nlc3NvclxuICAgIHRoaXMuc3RhcnRSZXRyeVByb2Nlc3NvcigpO1xuICAgIFxuICAgIC8vIFN0YXJ0IG1lc3NhZ2UgdGltZW91dCBwcm9jZXNzb3JcbiAgICB0aGlzLnN0YXJ0VGltZW91dFByb2Nlc3NvcigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBtZXNzYWdlIHRvIGEgc3BlY2lmaWMgYWdlbnQgb3IgYnJvYWRjYXN0IHRvIGFsbCBhZ2VudHNcbiAgICovXG4gIGFzeW5jIHNlbmRNZXNzYWdlKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IFByb21pc2U8TWVzc2FnZURlbGl2ZXJ5UmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIG1lc3NhZ2VcbiAgICAgIHRoaXMudmFsaWRhdGVNZXNzYWdlKG1lc3NhZ2UpO1xuXG4gICAgICAvLyBHZW5lcmF0ZSBtZXNzYWdlIElEIGlmIG5vdCBwcm92aWRlZFxuICAgICAgY29uc3QgbWVzc2FnZUlkID0gdGhpcy5nZW5lcmF0ZU1lc3NhZ2VJZChtZXNzYWdlKTtcbiAgICAgIFxuICAgICAgLy8gQWRkIHRvIGNvbnZlcnNhdGlvbiBoaXN0b3J5XG4gICAgICB0aGlzLmFkZFRvQ29udmVyc2F0aW9uSGlzdG9yeShtZXNzYWdlKTtcblxuICAgICAgLy8gSGFuZGxlIGJyb2FkY2FzdCBtZXNzYWdlc1xuICAgICAgaWYgKG1lc3NhZ2UucmVjaXBpZW50ID09PSAnYnJvYWRjYXN0Jykge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5icm9hZGNhc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgZGlyZWN0IG1lc3NhZ2VzXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZWxpdmVyTWVzc2FnZShtZXNzYWdlKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZUlkOiB0aGlzLmdlbmVyYXRlTWVzc2FnZUlkKG1lc3NhZ2UpLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIHJldHJ5Q291bnQ6IDBcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSBhbiBhZ2VudCB0byByZWNlaXZlIG1lc3NhZ2VzXG4gICAqL1xuICBzdWJzY3JpYmUoc3Vic2NyaXB0aW9uOiBNZXNzYWdlU3Vic2NyaXB0aW9uKTogdm9pZCB7XG4gICAgY29uc3QgYWdlbnRTdWJzY3JpcHRpb25zID0gdGhpcy5zdWJzY3JpcHRpb25zLmdldChzdWJzY3JpcHRpb24uYWdlbnRUeXBlKSB8fCBbXTtcbiAgICBhZ2VudFN1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5zZXQoc3Vic2NyaXB0aW9uLmFnZW50VHlwZSwgYWdlbnRTdWJzY3JpcHRpb25zKTtcblxuICAgIHRoaXMuZW1pdCgnYWdlbnQtc3Vic2NyaWJlZCcsIHtcbiAgICAgIGFnZW50VHlwZTogc3Vic2NyaXB0aW9uLmFnZW50VHlwZSxcbiAgICAgIG1lc3NhZ2VUeXBlczogc3Vic2NyaXB0aW9uLm1lc3NhZ2VUeXBlc1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuc3Vic2NyaWJlIGFuIGFnZW50IGZyb20gcmVjZWl2aW5nIG1lc3NhZ2VzXG4gICAqL1xuICB1bnN1YnNjcmliZShhZ2VudFR5cGU6IEFnZW50VHlwZSwgY2FsbGJhY2s/OiAobWVzc2FnZTogQWdlbnRNZXNzYWdlKSA9PiBQcm9taXNlPHZvaWQ+KTogdm9pZCB7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IHRoaXMuc3Vic2NyaXB0aW9ucy5nZXQoYWdlbnRUeXBlKSB8fCBbXTtcbiAgICBcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIC8vIFJlbW92ZSBzcGVjaWZpYyBzdWJzY3JpcHRpb25cbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gc3Vic2NyaXB0aW9ucy5maWx0ZXIoc3ViID0+IHN1Yi5jYWxsYmFjayAhPT0gY2FsbGJhY2spO1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnNldChhZ2VudFR5cGUsIGZpbHRlcmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVtb3ZlIGFsbCBzdWJzY3JpcHRpb25zIGZvciB0aGlzIGFnZW50XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGVsZXRlKGFnZW50VHlwZSk7XG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KCdhZ2VudC11bnN1YnNjcmliZWQnLCB7IGFnZW50VHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29udmVyc2F0aW9uIGhpc3RvcnkgZm9yIGEgc3BlY2lmaWMgY29udmVyc2F0aW9uXG4gICAqL1xuICBnZXRDb252ZXJzYXRpb25IaXN0b3J5KGNvbnZlcnNhdGlvbklkOiBzdHJpbmcpOiBBZ2VudE1lc3NhZ2VbXSB7XG4gICAgcmV0dXJuIHRoaXMubWVzc2FnZUhpc3RvcnkuZ2V0KGNvbnZlcnNhdGlvbklkKSB8fCBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWN0aXZlIGNvbnZlcnNhdGlvbiBjb250ZXh0XG4gICAqL1xuICBnZXRDb252ZXJzYXRpb25Db250ZXh0KGNvbnZlcnNhdGlvbklkOiBzdHJpbmcpOiBDb252ZXJzYXRpb25Db250ZXh0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVDb252ZXJzYXRpb25zLmdldChjb252ZXJzYXRpb25JZCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGNvbnZlcnNhdGlvbiBjb250ZXh0XG4gICAqL1xuICB1cGRhdGVDb252ZXJzYXRpb25Db250ZXh0KGNvbnRleHQ6IENvbnZlcnNhdGlvbkNvbnRleHQpOiB2b2lkIHtcbiAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbnMuc2V0KGNvbnRleHQuaWQsIGNvbnRleHQpO1xuICAgIHRoaXMuZW1pdCgnY29udmVyc2F0aW9uLXVwZGF0ZWQnLCBjb250ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcXVldWUgc3RhdHVzIGZvciBtb25pdG9yaW5nXG4gICAqL1xuICBnZXRRdWV1ZVN0YXR1cygpOiB7XG4gICAgdG90YWxNZXNzYWdlczogbnVtYmVyO1xuICAgIG1lc3NhZ2VzQnlBZ2VudDogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICByZXRyeVF1ZXVlU2l6ZTogbnVtYmVyO1xuICAgIGFjdGl2ZUNvbnZlcnNhdGlvbnM6IG51bWJlcjtcbiAgfSB7XG4gICAgY29uc3QgbWVzc2FnZXNCeUFnZW50OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgbGV0IHRvdGFsTWVzc2FnZXMgPSAwO1xuXG4gICAgZm9yIChjb25zdCBbYWdlbnRUeXBlLCBtZXNzYWdlc10gb2YgdGhpcy5tZXNzYWdlUXVldWUuZW50cmllcygpKSB7XG4gICAgICBtZXNzYWdlc0J5QWdlbnRbYWdlbnRUeXBlXSA9IG1lc3NhZ2VzLmxlbmd0aDtcbiAgICAgIHRvdGFsTWVzc2FnZXMgKz0gbWVzc2FnZXMubGVuZ3RoO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB0b3RhbE1lc3NhZ2VzLFxuICAgICAgbWVzc2FnZXNCeUFnZW50LFxuICAgICAgcmV0cnlRdWV1ZVNpemU6IHRoaXMucmV0cnlRdWV1ZS5zaXplLFxuICAgICAgYWN0aXZlQ29udmVyc2F0aW9uczogdGhpcy5hY3RpdmVDb252ZXJzYXRpb25zLnNpemVcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFyIGNvbnZlcnNhdGlvbiBkYXRhIChmb3IgY2xlYW51cClcbiAgICovXG4gIGNsZWFyQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbklkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLm1lc3NhZ2VIaXN0b3J5LmRlbGV0ZShjb252ZXJzYXRpb25JZCk7XG4gICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb25zLmRlbGV0ZShjb252ZXJzYXRpb25JZCk7XG4gICAgXG4gICAgLy8gUmVtb3ZlIHJlbGF0ZWQgcmV0cnkgcXVldWUgZW50cmllc1xuICAgIGZvciAoY29uc3QgW2tleSwgZW50cnldIG9mIHRoaXMucmV0cnlRdWV1ZS5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChlbnRyeS5tZXNzYWdlLm1ldGFkYXRhLmNvbnZlcnNhdGlvbklkID09PSBjb252ZXJzYXRpb25JZCkge1xuICAgICAgICB0aGlzLnJldHJ5UXVldWUuZGVsZXRlKGtleSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5lbWl0KCdjb252ZXJzYXRpb24tY2xlYXJlZCcsIHsgY29udmVyc2F0aW9uSWQgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW51cCByZXNvdXJjZXMgKGZvciB0ZXN0aW5nIGFuZCBzaHV0ZG93bilcbiAgICovXG4gIGNsZWFudXAoKTogdm9pZCB7XG4gICAgdGhpcy5tZXNzYWdlUXVldWUuY2xlYXIoKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuY2xlYXIoKTtcbiAgICB0aGlzLm1lc3NhZ2VIaXN0b3J5LmNsZWFyKCk7XG4gICAgdGhpcy5yZXRyeVF1ZXVlLmNsZWFyKCk7XG4gICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb25zLmNsZWFyKCk7XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVNZXNzYWdlKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IHZvaWQge1xuICAgIGlmICghbWVzc2FnZS5zZW5kZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWVzc2FnZSBzZW5kZXIgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG4gICAgaWYgKCFtZXNzYWdlLnJlY2lwaWVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNZXNzYWdlIHJlY2lwaWVudCBpcyByZXF1aXJlZCcpO1xuICAgIH1cbiAgICBpZiAoIW1lc3NhZ2UubWVzc2FnZVR5cGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWVzc2FnZSB0eXBlIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuICAgIGlmICghbWVzc2FnZS5tZXRhZGF0YT8uY29udmVyc2F0aW9uSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ29udmVyc2F0aW9uIElEIGlzIHJlcXVpcmVkIGluIG1lc3NhZ2UgbWV0YWRhdGEnKTtcbiAgICB9XG4gICAgaWYgKCFtZXNzYWdlLm1ldGFkYXRhPy5yZXF1ZXN0SWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVxdWVzdCBJRCBpcyByZXF1aXJlZCBpbiBtZXNzYWdlIG1ldGFkYXRhJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1lc3NhZ2VJZChtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIpO1xuICAgIHJldHVybiBgJHttZXNzYWdlLnNlbmRlcn0tJHttZXNzYWdlLnJlY2lwaWVudH0tJHt0aW1lc3RhbXB9LSR7cmFuZG9tfWA7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvQ29udmVyc2F0aW9uSGlzdG9yeShtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiB2b2lkIHtcbiAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IG1lc3NhZ2UubWV0YWRhdGEuY29udmVyc2F0aW9uSWQ7XG4gICAgY29uc3QgaGlzdG9yeSA9IHRoaXMubWVzc2FnZUhpc3RvcnkuZ2V0KGNvbnZlcnNhdGlvbklkKSB8fCBbXTtcbiAgICBoaXN0b3J5LnB1c2gobWVzc2FnZSk7XG4gICAgXG4gICAgLy8gTGltaXQgaGlzdG9yeSBzaXplIHRvIHByZXZlbnQgbWVtb3J5IGlzc3Vlc1xuICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDEwMDApIHtcbiAgICAgIGhpc3Rvcnkuc3BsaWNlKDAsIGhpc3RvcnkubGVuZ3RoIC0gMTAwMCk7XG4gICAgfVxuICAgIFxuICAgIHRoaXMubWVzc2FnZUhpc3Rvcnkuc2V0KGNvbnZlcnNhdGlvbklkLCBoaXN0b3J5KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYnJvYWRjYXN0TWVzc2FnZShtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBQcm9taXNlPE1lc3NhZ2VEZWxpdmVyeVJlc3VsdD4ge1xuICAgIGNvbnN0IG1lc3NhZ2VJZCA9IHRoaXMuZ2VuZXJhdGVNZXNzYWdlSWQobWVzc2FnZSk7XG4gICAgbGV0IHN1Y2Nlc3NDb3VudCA9IDA7XG4gICAgbGV0IGVycm9yQ291bnQgPSAwO1xuICAgIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIFNlbmQgdG8gYWxsIHN1YnNjcmliZWQgYWdlbnRzXG4gICAgZm9yIChjb25zdCBbYWdlbnRUeXBlLCBzdWJzY3JpcHRpb25zXSBvZiB0aGlzLnN1YnNjcmlwdGlvbnMuZW50cmllcygpKSB7XG4gICAgICBpZiAoYWdlbnRUeXBlID09PSBtZXNzYWdlLnNlbmRlcikgY29udGludWU7IC8vIERvbid0IHNlbmQgdG8gc2VuZGVyXG5cbiAgICAgIGZvciAoY29uc3Qgc3Vic2NyaXB0aW9uIG9mIHN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgaWYgKHN1YnNjcmlwdGlvbi5tZXNzYWdlVHlwZXMuaW5jbHVkZXMobWVzc2FnZS5tZXNzYWdlVHlwZSkgfHwgXG4gICAgICAgICAgICBzdWJzY3JpcHRpb24ubWVzc2FnZVR5cGVzLmluY2x1ZGVzKCcqJykpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgc3Vic2NyaXB0aW9uLmNhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgICAgICAgc3VjY2Vzc0NvdW50Kys7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yQ291bnQrKztcbiAgICAgICAgICAgIGVycm9ycy5wdXNoKGAke2FnZW50VHlwZX06ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGVycm9yQ291bnQgPT09IDAsXG4gICAgICBtZXNzYWdlSWQsXG4gICAgICBkZWxpdmVyZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIGVycm9yOiBlcnJvcnMubGVuZ3RoID4gMCA/IGVycm9ycy5qb2luKCc7ICcpIDogdW5kZWZpbmVkLFxuICAgICAgcmV0cnlDb3VudDogMFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRlbGl2ZXJNZXNzYWdlKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IFByb21pc2U8TWVzc2FnZURlbGl2ZXJ5UmVzdWx0PiB7XG4gICAgY29uc3QgbWVzc2FnZUlkID0gdGhpcy5nZW5lcmF0ZU1lc3NhZ2VJZChtZXNzYWdlKTtcbiAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gdGhpcy5zdWJzY3JpcHRpb25zLmdldChtZXNzYWdlLnJlY2lwaWVudCBhcyBBZ2VudFR5cGUpIHx8IFtdO1xuXG4gICAgaWYgKHN1YnNjcmlwdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBRdWV1ZSBtZXNzYWdlIGZvciBsYXRlciBkZWxpdmVyeVxuICAgICAgdGhpcy5xdWV1ZU1lc3NhZ2UobWVzc2FnZS5yZWNpcGllbnQgYXMgQWdlbnRUeXBlLCBtZXNzYWdlKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlSWQsXG4gICAgICAgIGVycm9yOiBgTm8gc3Vic2NyaWJlcnMgZm91bmQgZm9yIGFnZW50OiAke21lc3NhZ2UucmVjaXBpZW50fWAsXG4gICAgICAgIHJldHJ5Q291bnQ6IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gRGVsaXZlciB0byBhbGwgbWF0Y2hpbmcgc3Vic2NyaXB0aW9uc1xuICAgIGxldCBkZWxpdmVyZWQgPSBmYWxzZTtcbiAgICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHN1YnNjcmlwdGlvbiBvZiBzdWJzY3JpcHRpb25zKSB7XG4gICAgICBpZiAoc3Vic2NyaXB0aW9uLm1lc3NhZ2VUeXBlcy5pbmNsdWRlcyhtZXNzYWdlLm1lc3NhZ2VUeXBlKSB8fCBcbiAgICAgICAgICBzdWJzY3JpcHRpb24ubWVzc2FnZVR5cGVzLmluY2x1ZGVzKCcqJykpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBzdWJzY3JpcHRpb24uY2FsbGJhY2sobWVzc2FnZSk7XG4gICAgICAgICAgZGVsaXZlcmVkID0gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBlcnJvcnMucHVzaChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWRlbGl2ZXJlZCAmJiBlcnJvcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBlcnJvcnMucHVzaChgTm8gbWF0Y2hpbmcgc3Vic2NyaXB0aW9uIGZvdW5kIGZvciBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS5tZXNzYWdlVHlwZX1gKTtcbiAgICB9XG5cbiAgICBpZiAoIWRlbGl2ZXJlZCB8fCBlcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgLy8gQWRkIHRvIHJldHJ5IHF1ZXVlXG4gICAgICB0aGlzLmFkZFRvUmV0cnlRdWV1ZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZGVsaXZlcmVkICYmIGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgICBtZXNzYWdlSWQsXG4gICAgICBkZWxpdmVyZWRBdDogZGVsaXZlcmVkID8gbmV3IERhdGUoKSA6IHVuZGVmaW5lZCxcbiAgICAgIGVycm9yOiBlcnJvcnMubGVuZ3RoID4gMCA/IGVycm9ycy5qb2luKCc7ICcpIDogdW5kZWZpbmVkLFxuICAgICAgcmV0cnlDb3VudDogMFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHF1ZXVlTWVzc2FnZShhZ2VudFR5cGU6IEFnZW50VHlwZSwgbWVzc2FnZTogQWdlbnRNZXNzYWdlKTogdm9pZCB7XG4gICAgY29uc3QgcXVldWUgPSB0aGlzLm1lc3NhZ2VRdWV1ZS5nZXQoYWdlbnRUeXBlKSB8fCBbXTtcbiAgICBcbiAgICBpZiAocXVldWUubGVuZ3RoID49IHRoaXMuY29uZmlnLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgLy8gUmVtb3ZlIG9sZGVzdCBtZXNzYWdlIHRvIG1ha2Ugcm9vbVxuICAgICAgcXVldWUuc2hpZnQoKTtcbiAgICB9XG4gICAgXG4gICAgcXVldWUucHVzaChtZXNzYWdlKTtcbiAgICB0aGlzLm1lc3NhZ2VRdWV1ZS5zZXQoYWdlbnRUeXBlLCBxdWV1ZSk7XG4gIH1cblxuICBwcml2YXRlIGFkZFRvUmV0cnlRdWV1ZShtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiB2b2lkIHtcbiAgICBjb25zdCByZXRyeUtleSA9IHRoaXMuZ2VuZXJhdGVNZXNzYWdlSWQobWVzc2FnZSk7XG4gICAgY29uc3QgbmV4dFJldHJ5ID0gbmV3IERhdGUoRGF0ZS5ub3coKSArIHRoaXMuY29uZmlnLnJldHJ5RGVsYXlNcyk7XG4gICAgXG4gICAgdGhpcy5yZXRyeVF1ZXVlLnNldChyZXRyeUtleSwge1xuICAgICAgbWVzc2FnZSxcbiAgICAgIHJldHJ5Q291bnQ6IDAsXG4gICAgICBuZXh0UmV0cnlcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RhcnRSZXRyeVByb2Nlc3NvcigpOiB2b2lkIHtcbiAgICBzZXRJbnRlcnZhbChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IFtrZXksIGVudHJ5XSBvZiB0aGlzLnJldHJ5UXVldWUuZW50cmllcygpKSB7XG4gICAgICAgIGlmIChlbnRyeS5uZXh0UmV0cnkgPD0gbm93ICYmIGVudHJ5LnJldHJ5Q291bnQgPCB0aGlzLmNvbmZpZy5tYXhSZXRyaWVzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuZGVsaXZlck1lc3NhZ2UoZW50cnkubWVzc2FnZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICB0aGlzLnJldHJ5UXVldWUuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWVzc2FnZS1yZXRyeS1zdWNjZXNzJywgeyBtZXNzYWdlSWQ6IHJlc3VsdC5tZXNzYWdlSWQsIHJldHJ5Q291bnQ6IGVudHJ5LnJldHJ5Q291bnQgKyAxIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gVXBkYXRlIHJldHJ5IGNvdW50IGFuZCBuZXh0IHJldHJ5IHRpbWVcbiAgICAgICAgICAgICAgZW50cnkucmV0cnlDb3VudCsrO1xuICAgICAgICAgICAgICBlbnRyeS5uZXh0UmV0cnkgPSBuZXcgRGF0ZShub3cuZ2V0VGltZSgpICsgKHRoaXMuY29uZmlnLnJldHJ5RGVsYXlNcyAqIE1hdGgucG93KDIsIGVudHJ5LnJldHJ5Q291bnQpKSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBpZiAoZW50cnkucmV0cnlDb3VudCA+PSB0aGlzLmNvbmZpZy5tYXhSZXRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXRyeVF1ZXVlLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWVzc2FnZS1yZXRyeS1mYWlsZWQnLCB7IFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZUlkOiByZXN1bHQubWVzc2FnZUlkLCBcbiAgICAgICAgICAgICAgICAgIHJldHJ5Q291bnQ6IGVudHJ5LnJldHJ5Q291bnQsXG4gICAgICAgICAgICAgICAgICBlcnJvcjogcmVzdWx0LmVycm9yIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGVudHJ5LnJldHJ5Q291bnQrKztcbiAgICAgICAgICAgIGVudHJ5Lm5leHRSZXRyeSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgKyAodGhpcy5jb25maWcucmV0cnlEZWxheU1zICogTWF0aC5wb3coMiwgZW50cnkucmV0cnlDb3VudCkpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGVudHJ5LnJldHJ5Q291bnQgPj0gdGhpcy5jb25maWcubWF4UmV0cmllcykge1xuICAgICAgICAgICAgICB0aGlzLnJldHJ5UXVldWUuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWVzc2FnZS1yZXRyeS1mYWlsZWQnLCB7IFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VJZDoga2V5LCBcbiAgICAgICAgICAgICAgICByZXRyeUNvdW50OiBlbnRyeS5yZXRyeUNvdW50LFxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAxMDAwKTsgLy8gQ2hlY2sgZXZlcnkgc2Vjb25kXG4gIH1cblxuICBwcml2YXRlIHN0YXJ0VGltZW91dFByb2Nlc3NvcigpOiB2b2lkIHtcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgY29uc3QgdGltZW91dFRocmVzaG9sZCA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSB0aGlzLmNvbmZpZy5tZXNzYWdlVGltZW91dE1zKTtcbiAgICAgIFxuICAgICAgLy8gQ2xlYW4gdXAgb2xkIG1lc3NhZ2VzIGZyb20gcXVldWVzXG4gICAgICBmb3IgKGNvbnN0IFthZ2VudFR5cGUsIG1lc3NhZ2VzXSBvZiB0aGlzLm1lc3NhZ2VRdWV1ZS5lbnRyaWVzKCkpIHtcbiAgICAgICAgY29uc3QgZmlsdGVyZWRNZXNzYWdlcyA9IG1lc3NhZ2VzLmZpbHRlcihtc2cgPT4gXG4gICAgICAgICAgbXNnLm1ldGFkYXRhLnRpbWVzdGFtcCA+IHRpbWVvdXRUaHJlc2hvbGRcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChmaWx0ZXJlZE1lc3NhZ2VzLmxlbmd0aCAhPT0gbWVzc2FnZXMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlUXVldWUuc2V0KGFnZW50VHlwZSwgZmlsdGVyZWRNZXNzYWdlcyk7XG4gICAgICAgICAgdGhpcy5lbWl0KCdtZXNzYWdlcy10aW1lb3V0JywgeyBcbiAgICAgICAgICAgIGFnZW50VHlwZSwgXG4gICAgICAgICAgICBleHBpcmVkQ291bnQ6IG1lc3NhZ2VzLmxlbmd0aCAtIGZpbHRlcmVkTWVzc2FnZXMubGVuZ3RoIFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgMzAwMDApOyAvLyBDaGVjayBldmVyeSAzMCBzZWNvbmRzXG4gIH1cbn0iXX0=