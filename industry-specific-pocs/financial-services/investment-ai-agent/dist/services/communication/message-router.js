"use strict";
/**
 * Message Router Service
 *
 * Handles intelligent message routing, load balancing, and delivery strategies
 * for the agent communication system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
class MessageRouter {
    constructor(messageBus, config = {}) {
        this.routingRules = [];
        this.agentStatuses = new Map();
        this.circuitBreakers = new Map();
        this.roundRobinCounters = new Map();
        this.messageBus = messageBus;
        this.config = {
            enableLoadBalancing: true,
            loadBalancingStrategy: { type: 'least-busy' },
            enableCircuitBreaker: true,
            circuitBreakerThreshold: 5,
            enableMessageTransformation: true,
            maxRoutingHops: 10,
            ...config
        };
        this.initializeDefaultRules();
    }
    /**
     * Route a message using configured rules and strategies
     */
    async routeMessage(message) {
        try {
            // Check for routing loops
            const hops = this.getRoutingHops(message);
            if (hops >= this.config.maxRoutingHops) {
                throw new Error(`Maximum routing hops exceeded: ${hops}`);
            }
            // Apply routing rules
            const processedMessage = await this.applyRoutingRules(message);
            if (!processedMessage) {
                return {
                    success: false,
                    messageId: this.generateMessageId(message),
                    error: 'Message filtered by routing rules',
                    retryCount: 0
                };
            }
            // Handle load balancing for multiple targets
            const finalMessage = await this.applyLoadBalancing(processedMessage);
            // Check circuit breaker
            if (this.config.enableCircuitBreaker && this.isCircuitOpen(finalMessage.recipient)) {
                throw new Error(`Circuit breaker is open for agent: ${finalMessage.recipient}`);
            }
            // Route the message
            const result = await this.messageBus.sendMessage(finalMessage);
            // Update circuit breaker state
            this.updateCircuitBreaker(finalMessage.recipient, result.success);
            return result;
        }
        catch (error) {
            return {
                success: false,
                messageId: this.generateMessageId(message),
                error: error instanceof Error ? error.message : 'Unknown routing error',
                retryCount: 0
            };
        }
    }
    /**
     * Add a custom routing rule
     */
    addRoutingRule(rule) {
        // Insert rule in priority order
        const insertIndex = this.routingRules.findIndex(r => r.priority < rule.priority);
        if (insertIndex === -1) {
            this.routingRules.push(rule);
        }
        else {
            this.routingRules.splice(insertIndex, 0, rule);
        }
    }
    /**
     * Remove a routing rule
     */
    removeRoutingRule(ruleId) {
        const index = this.routingRules.findIndex(r => r.id === ruleId);
        if (index !== -1) {
            this.routingRules.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Update agent status for load balancing
     */
    updateAgentStatus(status) {
        this.agentStatuses.set(status.agentType, status);
    }
    /**
     * Get routing statistics
     */
    getRoutingStats() {
        const circuitBreakerStates = {};
        for (const [agent, breaker] of this.circuitBreakers.entries()) {
            circuitBreakerStates[agent] = breaker.isOpen;
        }
        const agentStatuses = {};
        for (const [agent, status] of this.agentStatuses.entries()) {
            agentStatuses[agent] = status.status;
        }
        return {
            totalRules: this.routingRules.length,
            circuitBreakerStates,
            agentStatuses
        };
    }
    async applyRoutingRules(message) {
        let currentMessage = { ...message };
        for (const rule of this.routingRules) {
            if (rule.condition(currentMessage)) {
                switch (rule.action) {
                    case 'filter':
                        return null; // Message is filtered out
                    case 'transform':
                        if (rule.transformer) {
                            currentMessage = rule.transformer(currentMessage);
                        }
                        break;
                    case 'route':
                        if (rule.target) {
                            if (Array.isArray(rule.target)) {
                                // For multiple targets, we'll handle this in load balancing
                                currentMessage.metadata = {
                                    ...currentMessage.metadata,
                                    routingTargets: rule.target
                                };
                            }
                            else {
                                currentMessage.recipient = rule.target;
                            }
                        }
                        break;
                    case 'duplicate':
                        if (rule.target && Array.isArray(rule.target)) {
                            // Send copies to additional targets
                            for (const target of rule.target) {
                                const duplicateMessage = {
                                    ...currentMessage,
                                    recipient: target,
                                    metadata: {
                                        ...currentMessage.metadata,
                                        isDuplicate: true,
                                        originalRecipient: currentMessage.recipient
                                    }
                                };
                                // Fire and forget for duplicates
                                this.messageBus.sendMessage(duplicateMessage).catch(console.error);
                            }
                        }
                        break;
                }
            }
        }
        return currentMessage;
    }
    async applyLoadBalancing(message) {
        const routingTargets = message.metadata.routingTargets;
        if (!routingTargets || routingTargets.length <= 1 || !this.config.enableLoadBalancing) {
            return message;
        }
        // Filter out unavailable agents
        const availableTargets = routingTargets.filter(target => {
            const status = this.agentStatuses.get(target);
            return status && status.status !== 'offline' && status.status !== 'error';
        });
        if (availableTargets.length === 0) {
            throw new Error('No available agents for load balancing');
        }
        if (availableTargets.length === 1) {
            return { ...message, recipient: availableTargets[0] };
        }
        // Apply load balancing strategy
        const selectedTarget = this.selectTargetByStrategy(availableTargets, message);
        return {
            ...message,
            recipient: selectedTarget,
            metadata: {
                ...message.metadata,
                loadBalanced: true,
                availableTargets: availableTargets.length
            }
        };
    }
    selectTargetByStrategy(targets, message) {
        const strategy = this.config.loadBalancingStrategy;
        switch (strategy.type) {
            case 'round-robin':
                return this.selectRoundRobin(targets, message);
            case 'least-busy':
                return this.selectLeastBusy(targets);
            case 'random':
                return targets[Math.floor(Math.random() * targets.length)];
            case 'priority-based':
                return this.selectByPriority(targets, message);
            default:
                return targets[0];
        }
    }
    selectRoundRobin(targets, message) {
        const key = `${message.messageType}-${targets.join(',')}`;
        const counter = this.roundRobinCounters.get(key) || 0;
        const selectedIndex = counter % targets.length;
        this.roundRobinCounters.set(key, counter + 1);
        return targets[selectedIndex];
    }
    selectLeastBusy(targets) {
        let leastBusyAgent = targets[0];
        let minTasks = Infinity;
        for (const target of targets) {
            const status = this.agentStatuses.get(target);
            if (status) {
                const currentTasks = status.currentTasks.length;
                if (currentTasks < minTasks) {
                    minTasks = currentTasks;
                    leastBusyAgent = target;
                }
            }
        }
        return leastBusyAgent;
    }
    selectByPriority(targets, message) {
        const weights = this.config.loadBalancingStrategy.weights || {};
        const messagePriority = message.metadata.priority;
        // Sort targets by weight and message priority compatibility
        const sortedTargets = targets.sort((a, b) => {
            const weightA = weights[a] || 1;
            const weightB = weights[b] || 1;
            // Higher weight agents get priority for high priority messages
            if (messagePriority === 'high') {
                return weightB - weightA;
            }
            else {
                return weightA - weightB;
            }
        });
        return sortedTargets[0];
    }
    isCircuitOpen(agentType) {
        const breaker = this.circuitBreakers.get(agentType);
        if (!breaker)
            return false;
        // Check if circuit should be reset (after 60 seconds)
        if (breaker.isOpen && Date.now() - breaker.lastFailure.getTime() > 60000) {
            breaker.isOpen = false;
            breaker.failures = 0;
        }
        return breaker.isOpen;
    }
    updateCircuitBreaker(agentType, success) {
        let breaker = this.circuitBreakers.get(agentType);
        if (!breaker) {
            breaker = { failures: 0, lastFailure: new Date(), isOpen: false };
            this.circuitBreakers.set(agentType, breaker);
        }
        if (success) {
            breaker.failures = Math.max(0, breaker.failures - 1);
        }
        else {
            breaker.failures++;
            breaker.lastFailure = new Date();
            if (breaker.failures >= this.config.circuitBreakerThreshold) {
                breaker.isOpen = true;
            }
        }
    }
    getRoutingHops(message) {
        return message.metadata.routingHops || 0;
    }
    generateMessageId(message) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${message.sender}-${message.recipient}-${timestamp}-${random}`;
    }
    initializeDefaultRules() {
        // Rule: Route high priority messages to supervisor first
        this.addRoutingRule({
            id: 'high-priority-to-supervisor',
            condition: (msg) => msg.metadata.priority === 'high' && msg.recipient !== 'supervisor',
            action: 'route',
            target: 'supervisor',
            priority: 100
        });
        // Rule: Transform error messages to include stack trace
        this.addRoutingRule({
            id: 'enhance-error-messages',
            condition: (msg) => msg.messageType === 'error',
            action: 'transform',
            transformer: (msg) => ({
                ...msg,
                content: {
                    ...msg.content,
                    timestamp: new Date(),
                    enhanced: true
                }
            }),
            priority: 90
        });
        // Rule: Duplicate compliance-related messages to compliance agent
        this.addRoutingRule({
            id: 'duplicate-compliance-messages',
            condition: (msg) => msg.content &&
                typeof msg.content === 'object' &&
                (msg.content.type === 'compliance' ||
                    (typeof msg.content.content === 'string' &&
                        msg.content.content.toLowerCase().includes('compliance'))),
            action: 'duplicate',
            target: ['compliance'],
            priority: 80
        });
        // Rule: Route analysis requests to multiple analysis agents if available
        this.addRoutingRule({
            id: 'load-balance-analysis',
            condition: (msg) => msg.messageType === 'request' && msg.recipient === 'analysis',
            action: 'route',
            target: ['analysis'],
            priority: 70
        });
    }
}
exports.MessageRouter = MessageRouter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVzc2FnZS1yb3V0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvY29tbXVuaWNhdGlvbi9tZXNzYWdlLXJvdXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQTRCSCxNQUFhLGFBQWE7SUFReEIsWUFBWSxVQUFzQixFQUFFLFNBQWlDLEVBQUU7UUFML0QsaUJBQVksR0FBa0IsRUFBRSxDQUFDO1FBQ2pDLGtCQUFhLEdBQWdDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDdkQsb0JBQWUsR0FBNkUsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN0Ryx1QkFBa0IsR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUcxRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsTUFBTSxHQUFHO1lBQ1osbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixxQkFBcUIsRUFBRSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDN0Msb0JBQW9CLEVBQUUsSUFBSTtZQUMxQix1QkFBdUIsRUFBRSxDQUFDO1lBQzFCLDJCQUEyQixFQUFFLElBQUk7WUFDakMsY0FBYyxFQUFFLEVBQUU7WUFDbEIsR0FBRyxNQUFNO1NBQ1YsQ0FBQztRQUVGLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBcUI7UUFDdEMsSUFBSTtZQUNGLDBCQUEwQjtZQUMxQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFO2dCQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQzNEO1lBRUQsc0JBQXNCO1lBQ3RCLE1BQU0sZ0JB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LEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLFlBQVk7b0JBQ2pDLENBQUMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sS0FBSyxRQUFRO3dCQUN2QyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUM5RCxNQUFNLEVBQUUsV0FBVztZQUNuQixNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUM7WUFDdEIsUUFBUSxFQUFFLEVBQUU7U0FDYixDQUFDLENBQUM7UUFFSCx5RUFBeUU7UUFDekUsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUNsQixFQUFFLEVBQUUsdUJBQXVCO1lBQzNCLFNBQVMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFdBQVcsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLFNBQVMsS0FBSyxVQUFVO1lBQ2pGLE1BQU0sRUFBRSxPQUFPO1lBQ2YsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDO1lBQ3BCLFFBQVEsRUFBRSxFQUFFO1NBQ2IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdlhELHNDQXVYQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTWVzc2FnZSBSb3V0ZXIgU2VydmljZVxuICogXG4gKiBIYW5kbGVzIGludGVsbGlnZW50IG1lc3NhZ2Ugcm91dGluZywgbG9hZCBiYWxhbmNpbmcsIGFuZCBkZWxpdmVyeSBzdHJhdGVnaWVzXG4gKiBmb3IgdGhlIGFnZW50IGNvbW11bmljYXRpb24gc3lzdGVtLlxuICovXG5cbmltcG9ydCB7IEFnZW50TWVzc2FnZSwgQWdlbnRUeXBlLCBBZ2VudFN0YXR1cyB9IGZyb20gJy4uLy4uL21vZGVscy9hZ2VudCc7XG5pbXBvcnQgeyBNZXNzYWdlQnVzLCBNZXNzYWdlRGVsaXZlcnlSZXN1bHQgfSBmcm9tICcuL21lc3NhZ2UtYnVzJztcblxuZXhwb3J0IGludGVyZmFjZSBSb3V0aW5nUnVsZSB7XG4gIGlkOiBzdHJpbmc7XG4gIGNvbmRpdGlvbjogKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSkgPT4gYm9vbGVhbjtcbiAgYWN0aW9uOiAncm91dGUnIHwgJ3RyYW5zZm9ybScgfCAnZmlsdGVyJyB8ICdkdXBsaWNhdGUnO1xuICB0YXJnZXQ/OiBBZ2VudFR5cGUgfCBBZ2VudFR5cGVbXTtcbiAgdHJhbnNmb3JtZXI/OiAobWVzc2FnZTogQWdlbnRNZXNzYWdlKSA9PiBBZ2VudE1lc3NhZ2U7XG4gIHByaW9yaXR5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9hZEJhbGFuY2luZ1N0cmF0ZWd5IHtcbiAgdHlwZTogJ3JvdW5kLXJvYmluJyB8ICdsZWFzdC1idXN5JyB8ICdyYW5kb20nIHwgJ3ByaW9yaXR5LWJhc2VkJztcbiAgd2VpZ2h0cz86IFJlY29yZDxBZ2VudFR5cGUsIG51bWJlcj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGluZ0NvbmZpZyB7XG4gIGVuYWJsZUxvYWRCYWxhbmNpbmc6IGJvb2xlYW47XG4gIGxvYWRCYWxhbmNpbmdTdHJhdGVneTogTG9hZEJhbGFuY2luZ1N0cmF0ZWd5O1xuICBlbmFibGVDaXJjdWl0QnJlYWtlcjogYm9vbGVhbjtcbiAgY2lyY3VpdEJyZWFrZXJUaHJlc2hvbGQ6IG51bWJlcjtcbiAgZW5hYmxlTWVzc2FnZVRyYW5zZm9ybWF0aW9uOiBib29sZWFuO1xuICBtYXhSb3V0aW5nSG9wczogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTWVzc2FnZVJvdXRlciB7XG4gIHByaXZhdGUgbWVzc2FnZUJ1czogTWVzc2FnZUJ1cztcbiAgcHJpdmF0ZSBjb25maWc6IFJvdXRpbmdDb25maWc7XG4gIHByaXZhdGUgcm91dGluZ1J1bGVzOiBSb3V0aW5nUnVsZVtdID0gW107XG4gIHByaXZhdGUgYWdlbnRTdGF0dXNlczogTWFwPEFnZW50VHlwZSwgQWdlbnRTdGF0dXM+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIGNpcmN1aXRCcmVha2VyczogTWFwPEFnZW50VHlwZSwgeyBmYWlsdXJlczogbnVtYmVyOyBsYXN0RmFpbHVyZTogRGF0ZTsgaXNPcGVuOiBib29sZWFuIH0+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHJvdW5kUm9iaW5Db3VudGVyczogTWFwPHN0cmluZywgbnVtYmVyPiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihtZXNzYWdlQnVzOiBNZXNzYWdlQnVzLCBjb25maWc6IFBhcnRpYWw8Um91dGluZ0NvbmZpZz4gPSB7fSkge1xuICAgIHRoaXMubWVzc2FnZUJ1cyA9IG1lc3NhZ2VCdXM7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICBlbmFibGVMb2FkQmFsYW5jaW5nOiB0cnVlLFxuICAgICAgbG9hZEJhbGFuY2luZ1N0cmF0ZWd5OiB7IHR5cGU6ICdsZWFzdC1idXN5JyB9LFxuICAgICAgZW5hYmxlQ2lyY3VpdEJyZWFrZXI6IHRydWUsXG4gICAgICBjaXJjdWl0QnJlYWtlclRocmVzaG9sZDogNSxcbiAgICAgIGVuYWJsZU1lc3NhZ2VUcmFuc2Zvcm1hdGlvbjogdHJ1ZSxcbiAgICAgIG1heFJvdXRpbmdIb3BzOiAxMCxcbiAgICAgIC4uLmNvbmZpZ1xuICAgIH07XG5cbiAgICB0aGlzLmluaXRpYWxpemVEZWZhdWx0UnVsZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3V0ZSBhIG1lc3NhZ2UgdXNpbmcgY29uZmlndXJlZCBydWxlcyBhbmQgc3RyYXRlZ2llc1xuICAgKi9cbiAgYXN5bmMgcm91dGVNZXNzYWdlKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IFByb21pc2U8TWVzc2FnZURlbGl2ZXJ5UmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGZvciByb3V0aW5nIGxvb3BzXG4gICAgICBjb25zdCBob3BzID0gdGhpcy5nZXRSb3V0aW5nSG9wcyhtZXNzYWdlKTtcbiAgICAgIGlmIChob3BzID49IHRoaXMuY29uZmlnLm1heFJvdXRpbmdIb3BzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTWF4aW11bSByb3V0aW5nIGhvcHMgZXhjZWVkZWQ6ICR7aG9wc31gKTtcbiAgICAgIH1cblxuICAgICAgLy8gQXBwbHkgcm91dGluZyBydWxlc1xuICAgICAgY29uc3QgcHJvY2Vzc2VkTWVzc2FnZSA9IGF3YWl0IHRoaXMuYXBwbHlSb3V0aW5nUnVsZXMobWVzc2FnZSk7XG4gICAgICBpZiAoIXByb2Nlc3NlZE1lc3NhZ2UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlSWQ6IHRoaXMuZ2VuZXJhdGVNZXNzYWdlSWQobWVzc2FnZSksXG4gICAgICAgICAgZXJyb3I6ICdNZXNzYWdlIGZpbHRlcmVkIGJ5IHJvdXRpbmcgcnVsZXMnLFxuICAgICAgICAgIHJldHJ5Q291bnQ6IDBcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgLy8gSGFuZGxlIGxvYWQgYmFsYW5jaW5nIGZvciBtdWx0aXBsZSB0YXJnZXRzXG4gICAgICBjb25zdCBmaW5hbE1lc3NhZ2UgPSBhd2FpdCB0aGlzLmFwcGx5TG9hZEJhbGFuY2luZyhwcm9jZXNzZWRNZXNzYWdlKTtcblxuICAgICAgLy8gQ2hlY2sgY2lyY3VpdCBicmVha2VyXG4gICAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlQ2lyY3VpdEJyZWFrZXIgJiYgdGhpcy5pc0NpcmN1aXRPcGVuKGZpbmFsTWVzc2FnZS5yZWNpcGllbnQgYXMgQWdlbnRUeXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENpcmN1aXQgYnJlYWtlciBpcyBvcGVuIGZvciBhZ2VudDogJHtmaW5hbE1lc3NhZ2UucmVjaXBpZW50fWApO1xuICAgICAgfVxuXG4gICAgICAvLyBSb3V0ZSB0aGUgbWVzc2FnZVxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5tZXNzYWdlQnVzLnNlbmRNZXNzYWdlKGZpbmFsTWVzc2FnZSk7XG5cbiAgICAgIC8vIFVwZGF0ZSBjaXJjdWl0IGJyZWFrZXIgc3RhdGVcbiAgICAgIHRoaXMudXBkYXRlQ2lyY3VpdEJyZWFrZXIoZmluYWxNZXNzYWdlLnJlY2lwaWVudCBhcyBBZ2VudFR5cGUsIHJlc3VsdC5zdWNjZXNzKTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZUlkOiB0aGlzLmdlbmVyYXRlTWVzc2FnZUlkKG1lc3NhZ2UpLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biByb3V0aW5nIGVycm9yJyxcbiAgICAgICAgcmV0cnlDb3VudDogMFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgY3VzdG9tIHJvdXRpbmcgcnVsZVxuICAgKi9cbiAgYWRkUm91dGluZ1J1bGUocnVsZTogUm91dGluZ1J1bGUpOiB2b2lkIHtcbiAgICAvLyBJbnNlcnQgcnVsZSBpbiBwcmlvcml0eSBvcmRlclxuICAgIGNvbnN0IGluc2VydEluZGV4ID0gdGhpcy5yb3V0aW5nUnVsZXMuZmluZEluZGV4KHIgPT4gci5wcmlvcml0eSA8IHJ1bGUucHJpb3JpdHkpO1xuICAgIGlmIChpbnNlcnRJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMucm91dGluZ1J1bGVzLnB1c2gocnVsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucm91dGluZ1J1bGVzLnNwbGljZShpbnNlcnRJbmRleCwgMCwgcnVsZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhIHJvdXRpbmcgcnVsZVxuICAgKi9cbiAgcmVtb3ZlUm91dGluZ1J1bGUocnVsZUlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMucm91dGluZ1J1bGVzLmZpbmRJbmRleChyID0+IHIuaWQgPT09IHJ1bGVJZCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgdGhpcy5yb3V0aW5nUnVsZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGFnZW50IHN0YXR1cyBmb3IgbG9hZCBiYWxhbmNpbmdcbiAgICovXG4gIHVwZGF0ZUFnZW50U3RhdHVzKHN0YXR1czogQWdlbnRTdGF0dXMpOiB2b2lkIHtcbiAgICB0aGlzLmFnZW50U3RhdHVzZXMuc2V0KHN0YXR1cy5hZ2VudFR5cGUsIHN0YXR1cyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHJvdXRpbmcgc3RhdGlzdGljc1xuICAgKi9cbiAgZ2V0Um91dGluZ1N0YXRzKCk6IHtcbiAgICB0b3RhbFJ1bGVzOiBudW1iZXI7XG4gICAgY2lyY3VpdEJyZWFrZXJTdGF0ZXM6IFJlY29yZDxzdHJpbmcsIGJvb2xlYW4+O1xuICAgIGFnZW50U3RhdHVzZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIH0ge1xuICAgIGNvbnN0IGNpcmN1aXRCcmVha2VyU3RhdGVzOiBSZWNvcmQ8c3RyaW5nLCBib29sZWFuPiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2FnZW50LCBicmVha2VyXSBvZiB0aGlzLmNpcmN1aXRCcmVha2Vycy5lbnRyaWVzKCkpIHtcbiAgICAgIGNpcmN1aXRCcmVha2VyU3RhdGVzW2FnZW50XSA9IGJyZWFrZXIuaXNPcGVuO1xuICAgIH1cblxuICAgIGNvbnN0IGFnZW50U3RhdHVzZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFthZ2VudCwgc3RhdHVzXSBvZiB0aGlzLmFnZW50U3RhdHVzZXMuZW50cmllcygpKSB7XG4gICAgICBhZ2VudFN0YXR1c2VzW2FnZW50XSA9IHN0YXR1cy5zdGF0dXM7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsUnVsZXM6IHRoaXMucm91dGluZ1J1bGVzLmxlbmd0aCxcbiAgICAgIGNpcmN1aXRCcmVha2VyU3RhdGVzLFxuICAgICAgYWdlbnRTdGF0dXNlc1xuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGx5Um91dGluZ1J1bGVzKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IFByb21pc2U8QWdlbnRNZXNzYWdlIHwgbnVsbD4ge1xuICAgIGxldCBjdXJyZW50TWVzc2FnZSA9IHsgLi4ubWVzc2FnZSB9O1xuXG4gICAgZm9yIChjb25zdCBydWxlIG9mIHRoaXMucm91dGluZ1J1bGVzKSB7XG4gICAgICBpZiAocnVsZS5jb25kaXRpb24oY3VycmVudE1lc3NhZ2UpKSB7XG4gICAgICAgIHN3aXRjaCAocnVsZS5hY3Rpb24pIHtcbiAgICAgICAgICBjYXNlICdmaWx0ZXInOlxuICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIE1lc3NhZ2UgaXMgZmlsdGVyZWQgb3V0XG5cbiAgICAgICAgICBjYXNlICd0cmFuc2Zvcm0nOlxuICAgICAgICAgICAgaWYgKHJ1bGUudHJhbnNmb3JtZXIpIHtcbiAgICAgICAgICAgICAgY3VycmVudE1lc3NhZ2UgPSBydWxlLnRyYW5zZm9ybWVyKGN1cnJlbnRNZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAncm91dGUnOlxuICAgICAgICAgICAgaWYgKHJ1bGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJ1bGUudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIC8vIEZvciBtdWx0aXBsZSB0YXJnZXRzLCB3ZSdsbCBoYW5kbGUgdGhpcyBpbiBsb2FkIGJhbGFuY2luZ1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNZXNzYWdlLm1ldGFkYXRhID0ge1xuICAgICAgICAgICAgICAgICAgLi4uY3VycmVudE1lc3NhZ2UubWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICByb3V0aW5nVGFyZ2V0czogcnVsZS50YXJnZXRcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRNZXNzYWdlLnJlY2lwaWVudCA9IHJ1bGUudGFyZ2V0O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2R1cGxpY2F0ZSc6XG4gICAgICAgICAgICBpZiAocnVsZS50YXJnZXQgJiYgQXJyYXkuaXNBcnJheShydWxlLnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgLy8gU2VuZCBjb3BpZXMgdG8gYWRkaXRpb25hbCB0YXJnZXRzXG4gICAgICAgICAgICAgIGZvciAoY29uc3QgdGFyZ2V0IG9mIHJ1bGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZHVwbGljYXRlTWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICAgIC4uLmN1cnJlbnRNZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgcmVjaXBpZW50OiB0YXJnZXQsXG4gICAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAuLi5jdXJyZW50TWVzc2FnZS5tZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgaXNEdXBsaWNhdGU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsUmVjaXBpZW50OiBjdXJyZW50TWVzc2FnZS5yZWNpcGllbnRcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIEZpcmUgYW5kIGZvcmdldCBmb3IgZHVwbGljYXRlc1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZUJ1cy5zZW5kTWVzc2FnZShkdXBsaWNhdGVNZXNzYWdlKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY3VycmVudE1lc3NhZ2U7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFwcGx5TG9hZEJhbGFuY2luZyhtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBQcm9taXNlPEFnZW50TWVzc2FnZT4ge1xuICAgIGNvbnN0IHJvdXRpbmdUYXJnZXRzID0gbWVzc2FnZS5tZXRhZGF0YS5yb3V0aW5nVGFyZ2V0cyBhcyBBZ2VudFR5cGVbXSB8IHVuZGVmaW5lZDtcbiAgICBcbiAgICBpZiAoIXJvdXRpbmdUYXJnZXRzIHx8IHJvdXRpbmdUYXJnZXRzLmxlbmd0aCA8PSAxIHx8ICF0aGlzLmNvbmZpZy5lbmFibGVMb2FkQmFsYW5jaW5nKSB7XG4gICAgICByZXR1cm4gbWVzc2FnZTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXIgb3V0IHVuYXZhaWxhYmxlIGFnZW50c1xuICAgIGNvbnN0IGF2YWlsYWJsZVRhcmdldHMgPSByb3V0aW5nVGFyZ2V0cy5maWx0ZXIodGFyZ2V0ID0+IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuYWdlbnRTdGF0dXNlcy5nZXQodGFyZ2V0KTtcbiAgICAgIHJldHVybiBzdGF0dXMgJiYgc3RhdHVzLnN0YXR1cyAhPT0gJ29mZmxpbmUnICYmIHN0YXR1cy5zdGF0dXMgIT09ICdlcnJvcic7XG4gICAgfSk7XG5cbiAgICBpZiAoYXZhaWxhYmxlVGFyZ2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gYXZhaWxhYmxlIGFnZW50cyBmb3IgbG9hZCBiYWxhbmNpbmcnKTtcbiAgICB9XG5cbiAgICBpZiAoYXZhaWxhYmxlVGFyZ2V0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiB7IC4uLm1lc3NhZ2UsIHJlY2lwaWVudDogYXZhaWxhYmxlVGFyZ2V0c1swXSB9O1xuICAgIH1cblxuICAgIC8vIEFwcGx5IGxvYWQgYmFsYW5jaW5nIHN0cmF0ZWd5XG4gICAgY29uc3Qgc2VsZWN0ZWRUYXJnZXQgPSB0aGlzLnNlbGVjdFRhcmdldEJ5U3RyYXRlZ3koYXZhaWxhYmxlVGFyZ2V0cywgbWVzc2FnZSk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLm1lc3NhZ2UsXG4gICAgICByZWNpcGllbnQ6IHNlbGVjdGVkVGFyZ2V0LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgLi4ubWVzc2FnZS5tZXRhZGF0YSxcbiAgICAgICAgbG9hZEJhbGFuY2VkOiB0cnVlLFxuICAgICAgICBhdmFpbGFibGVUYXJnZXRzOiBhdmFpbGFibGVUYXJnZXRzLmxlbmd0aFxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdFRhcmdldEJ5U3RyYXRlZ3kodGFyZ2V0czogQWdlbnRUeXBlW10sIG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IEFnZW50VHlwZSB7XG4gICAgY29uc3Qgc3RyYXRlZ3kgPSB0aGlzLmNvbmZpZy5sb2FkQmFsYW5jaW5nU3RyYXRlZ3k7XG5cbiAgICBzd2l0Y2ggKHN0cmF0ZWd5LnR5cGUpIHtcbiAgICAgIGNhc2UgJ3JvdW5kLXJvYmluJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Um91bmRSb2Jpbih0YXJnZXRzLCBtZXNzYWdlKTtcblxuICAgICAgY2FzZSAnbGVhc3QtYnVzeSc6XG4gICAgICAgIHJldHVybiB0aGlzLnNlbGVjdExlYXN0QnVzeSh0YXJnZXRzKTtcblxuICAgICAgY2FzZSAncmFuZG9tJzpcbiAgICAgICAgcmV0dXJuIHRhcmdldHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogdGFyZ2V0cy5sZW5ndGgpXTtcblxuICAgICAgY2FzZSAncHJpb3JpdHktYmFzZWQnOlxuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RCeVByaW9yaXR5KHRhcmdldHMsIG1lc3NhZ2UpO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGFyZ2V0c1swXTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdFJvdW5kUm9iaW4odGFyZ2V0czogQWdlbnRUeXBlW10sIG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IEFnZW50VHlwZSB7XG4gICAgY29uc3Qga2V5ID0gYCR7bWVzc2FnZS5tZXNzYWdlVHlwZX0tJHt0YXJnZXRzLmpvaW4oJywnKX1gO1xuICAgIGNvbnN0IGNvdW50ZXIgPSB0aGlzLnJvdW5kUm9iaW5Db3VudGVycy5nZXQoa2V5KSB8fCAwO1xuICAgIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBjb3VudGVyICUgdGFyZ2V0cy5sZW5ndGg7XG4gICAgdGhpcy5yb3VuZFJvYmluQ291bnRlcnMuc2V0KGtleSwgY291bnRlciArIDEpO1xuICAgIHJldHVybiB0YXJnZXRzW3NlbGVjdGVkSW5kZXhdO1xuICB9XG5cbiAgcHJpdmF0ZSBzZWxlY3RMZWFzdEJ1c3kodGFyZ2V0czogQWdlbnRUeXBlW10pOiBBZ2VudFR5cGUge1xuICAgIGxldCBsZWFzdEJ1c3lBZ2VudCA9IHRhcmdldHNbMF07XG4gICAgbGV0IG1pblRhc2tzID0gSW5maW5pdHk7XG5cbiAgICBmb3IgKGNvbnN0IHRhcmdldCBvZiB0YXJnZXRzKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmFnZW50U3RhdHVzZXMuZ2V0KHRhcmdldCk7XG4gICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUYXNrcyA9IHN0YXR1cy5jdXJyZW50VGFza3MubGVuZ3RoO1xuICAgICAgICBpZiAoY3VycmVudFRhc2tzIDwgbWluVGFza3MpIHtcbiAgICAgICAgICBtaW5UYXNrcyA9IGN1cnJlbnRUYXNrcztcbiAgICAgICAgICBsZWFzdEJ1c3lBZ2VudCA9IHRhcmdldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBsZWFzdEJ1c3lBZ2VudDtcbiAgfVxuXG4gIHByaXZhdGUgc2VsZWN0QnlQcmlvcml0eSh0YXJnZXRzOiBBZ2VudFR5cGVbXSwgbWVzc2FnZTogQWdlbnRNZXNzYWdlKTogQWdlbnRUeXBlIHtcbiAgICBjb25zdCB3ZWlnaHRzID0gdGhpcy5jb25maWcubG9hZEJhbGFuY2luZ1N0cmF0ZWd5LndlaWdodHMgfHwge30gYXMgUmVjb3JkPEFnZW50VHlwZSwgbnVtYmVyPjtcbiAgICBjb25zdCBtZXNzYWdlUHJpb3JpdHkgPSBtZXNzYWdlLm1ldGFkYXRhLnByaW9yaXR5O1xuXG4gICAgLy8gU29ydCB0YXJnZXRzIGJ5IHdlaWdodCBhbmQgbWVzc2FnZSBwcmlvcml0eSBjb21wYXRpYmlsaXR5XG4gICAgY29uc3Qgc29ydGVkVGFyZ2V0cyA9IHRhcmdldHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgY29uc3Qgd2VpZ2h0QSA9IHdlaWdodHNbYV0gfHwgMTtcbiAgICAgIGNvbnN0IHdlaWdodEIgPSB3ZWlnaHRzW2JdIHx8IDE7XG4gICAgICBcbiAgICAgIC8vIEhpZ2hlciB3ZWlnaHQgYWdlbnRzIGdldCBwcmlvcml0eSBmb3IgaGlnaCBwcmlvcml0eSBtZXNzYWdlc1xuICAgICAgaWYgKG1lc3NhZ2VQcmlvcml0eSA9PT0gJ2hpZ2gnKSB7XG4gICAgICAgIHJldHVybiB3ZWlnaHRCIC0gd2VpZ2h0QTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB3ZWlnaHRBIC0gd2VpZ2h0QjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBzb3J0ZWRUYXJnZXRzWzBdO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0NpcmN1aXRPcGVuKGFnZW50VHlwZTogQWdlbnRUeXBlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYnJlYWtlciA9IHRoaXMuY2lyY3VpdEJyZWFrZXJzLmdldChhZ2VudFR5cGUpO1xuICAgIGlmICghYnJlYWtlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgLy8gQ2hlY2sgaWYgY2lyY3VpdCBzaG91bGQgYmUgcmVzZXQgKGFmdGVyIDYwIHNlY29uZHMpXG4gICAgaWYgKGJyZWFrZXIuaXNPcGVuICYmIERhdGUubm93KCkgLSBicmVha2VyLmxhc3RGYWlsdXJlLmdldFRpbWUoKSA+IDYwMDAwKSB7XG4gICAgICBicmVha2VyLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgYnJlYWtlci5mYWlsdXJlcyA9IDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJyZWFrZXIuaXNPcGVuO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDaXJjdWl0QnJlYWtlcihhZ2VudFR5cGU6IEFnZW50VHlwZSwgc3VjY2VzczogYm9vbGVhbik6IHZvaWQge1xuICAgIGxldCBicmVha2VyID0gdGhpcy5jaXJjdWl0QnJlYWtlcnMuZ2V0KGFnZW50VHlwZSk7XG4gICAgaWYgKCFicmVha2VyKSB7XG4gICAgICBicmVha2VyID0geyBmYWlsdXJlczogMCwgbGFzdEZhaWx1cmU6IG5ldyBEYXRlKCksIGlzT3BlbjogZmFsc2UgfTtcbiAgICAgIHRoaXMuY2lyY3VpdEJyZWFrZXJzLnNldChhZ2VudFR5cGUsIGJyZWFrZXIpO1xuICAgIH1cblxuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICBicmVha2VyLmZhaWx1cmVzID0gTWF0aC5tYXgoMCwgYnJlYWtlci5mYWlsdXJlcyAtIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVha2VyLmZhaWx1cmVzKys7XG4gICAgICBicmVha2VyLmxhc3RGYWlsdXJlID0gbmV3IERhdGUoKTtcbiAgICAgIFxuICAgICAgaWYgKGJyZWFrZXIuZmFpbHVyZXMgPj0gdGhpcy5jb25maWcuY2lyY3VpdEJyZWFrZXJUaHJlc2hvbGQpIHtcbiAgICAgICAgYnJlYWtlci5pc09wZW4gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0Um91dGluZ0hvcHMobWVzc2FnZTogQWdlbnRNZXNzYWdlKTogbnVtYmVyIHtcbiAgICByZXR1cm4gKG1lc3NhZ2UubWV0YWRhdGEgYXMgYW55KS5yb3V0aW5nSG9wcyB8fCAwO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1lc3NhZ2VJZChtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBzdHJpbmcge1xuICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG4gICAgY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIpO1xuICAgIHJldHVybiBgJHttZXNzYWdlLnNlbmRlcn0tJHttZXNzYWdlLnJlY2lwaWVudH0tJHt0aW1lc3RhbXB9LSR7cmFuZG9tfWA7XG4gIH1cblxuICBwcml2YXRlIGluaXRpYWxpemVEZWZhdWx0UnVsZXMoKTogdm9pZCB7XG4gICAgLy8gUnVsZTogUm91dGUgaGlnaCBwcmlvcml0eSBtZXNzYWdlcyB0byBzdXBlcnZpc29yIGZpcnN0XG4gICAgdGhpcy5hZGRSb3V0aW5nUnVsZSh7XG4gICAgICBpZDogJ2hpZ2gtcHJpb3JpdHktdG8tc3VwZXJ2aXNvcicsXG4gICAgICBjb25kaXRpb246IChtc2cpID0+IG1zZy5tZXRhZGF0YS5wcmlvcml0eSA9PT0gJ2hpZ2gnICYmIG1zZy5yZWNpcGllbnQgIT09ICdzdXBlcnZpc29yJyxcbiAgICAgIGFjdGlvbjogJ3JvdXRlJyxcbiAgICAgIHRhcmdldDogJ3N1cGVydmlzb3InLFxuICAgICAgcHJpb3JpdHk6IDEwMFxuICAgIH0pO1xuXG4gICAgLy8gUnVsZTogVHJhbnNmb3JtIGVycm9yIG1lc3NhZ2VzIHRvIGluY2x1ZGUgc3RhY2sgdHJhY2VcbiAgICB0aGlzLmFkZFJvdXRpbmdSdWxlKHtcbiAgICAgIGlkOiAnZW5oYW5jZS1lcnJvci1tZXNzYWdlcycsXG4gICAgICBjb25kaXRpb246IChtc2cpID0+IG1zZy5tZXNzYWdlVHlwZSA9PT0gJ2Vycm9yJyxcbiAgICAgIGFjdGlvbjogJ3RyYW5zZm9ybScsXG4gICAgICB0cmFuc2Zvcm1lcjogKG1zZykgPT4gKHtcbiAgICAgICAgLi4ubXNnLFxuICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgLi4ubXNnLmNvbnRlbnQsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGVuaGFuY2VkOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgcHJpb3JpdHk6IDkwXG4gICAgfSk7XG5cbiAgICAvLyBSdWxlOiBEdXBsaWNhdGUgY29tcGxpYW5jZS1yZWxhdGVkIG1lc3NhZ2VzIHRvIGNvbXBsaWFuY2UgYWdlbnRcbiAgICB0aGlzLmFkZFJvdXRpbmdSdWxlKHtcbiAgICAgIGlkOiAnZHVwbGljYXRlLWNvbXBsaWFuY2UtbWVzc2FnZXMnLFxuICAgICAgY29uZGl0aW9uOiAobXNnKSA9PiBcbiAgICAgICAgbXNnLmNvbnRlbnQgJiYgXG4gICAgICAgIHR5cGVvZiBtc2cuY29udGVudCA9PT0gJ29iamVjdCcgJiYgXG4gICAgICAgIChtc2cuY29udGVudC50eXBlID09PSAnY29tcGxpYW5jZScgfHwgXG4gICAgICAgICAodHlwZW9mIG1zZy5jb250ZW50LmNvbnRlbnQgPT09ICdzdHJpbmcnICYmIFxuICAgICAgICAgIG1zZy5jb250ZW50LmNvbnRlbnQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygnY29tcGxpYW5jZScpKSksXG4gICAgICBhY3Rpb246ICdkdXBsaWNhdGUnLFxuICAgICAgdGFyZ2V0OiBbJ2NvbXBsaWFuY2UnXSxcbiAgICAgIHByaW9yaXR5OiA4MFxuICAgIH0pO1xuXG4gICAgLy8gUnVsZTogUm91dGUgYW5hbHlzaXMgcmVxdWVzdHMgdG8gbXVsdGlwbGUgYW5hbHlzaXMgYWdlbnRzIGlmIGF2YWlsYWJsZVxuICAgIHRoaXMuYWRkUm91dGluZ1J1bGUoe1xuICAgICAgaWQ6ICdsb2FkLWJhbGFuY2UtYW5hbHlzaXMnLFxuICAgICAgY29uZGl0aW9uOiAobXNnKSA9PiBtc2cubWVzc2FnZVR5cGUgPT09ICdyZXF1ZXN0JyAmJiBtc2cucmVjaXBpZW50ID09PSAnYW5hbHlzaXMnLFxuICAgICAgYWN0aW9uOiAncm91dGUnLFxuICAgICAgdGFyZ2V0OiBbJ2FuYWx5c2lzJ10sIC8vIFdpbGwgYmUgZXhwYW5kZWQgYnkgbG9hZCBiYWxhbmNlciBpZiBtdWx0aXBsZSBhbmFseXNpcyBhZ2VudHMgZXhpc3RcbiAgICAgIHByaW9yaXR5OiA3MFxuICAgIH0pO1xuICB9XG59Il19