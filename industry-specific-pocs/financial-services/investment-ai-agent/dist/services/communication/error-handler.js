"use strict";
/**
 * Communication Error Handler
 *
 * Handles errors, retries, and recovery mechanisms for the agent communication system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationErrorHandler = void 0;
const events_1 = require("events");
class CommunicationErrorHandler extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.errorHistory = new Map();
        this.deadLetterQueue = [];
        this.retryPolicies = new Map();
        this.recoveryStrategies = new Map();
        this.circuitBreakers = new Map();
        this.config = {
            maxRetries: 3,
            baseRetryDelayMs: 1000,
            maxRetryDelayMs: 30000,
            exponentialBackoff: true,
            jitterEnabled: true,
            deadLetterQueueEnabled: true,
            errorReportingEnabled: true,
            circuitBreakerEnabled: true,
            ...config
        };
        this.initializeDefaultPolicies();
        this.initializeDefaultStrategies();
    }
    /**
     * Handle a communication error
     */
    async handleError(error) {
        try {
            // Record error in history
            this.recordError(error);
            // Check circuit breaker
            if (this.config.circuitBreakerEnabled && error.agentType) {
                this.updateCircuitBreaker(error.agentType, false);
                if (this.isCircuitOpen(error.agentType)) {
                    return {
                        shouldRetry: false,
                        alternativeAction: 'circuit-breaker-open'
                    };
                }
            }
            // Get recovery strategy
            const strategy = this.getRecoveryStrategy(error);
            switch (strategy.strategy) {
                case 'retry':
                    return await this.handleRetryStrategy(error, strategy);
                case 'reroute':
                    return await this.handleRerouteStrategy(error, strategy);
                case 'fallback':
                    return await this.handleFallbackStrategy(error, strategy);
                case 'escalate':
                    return await this.handleEscalateStrategy(error, strategy);
                case 'ignore':
                    return { shouldRetry: false };
                default:
                    return await this.handleDefaultStrategy(error);
            }
        }
        catch (handlingError) {
            this.emit('error-handling-failed', {
                originalError: error,
                handlingError: handlingError instanceof Error ? handlingError.message : 'Unknown error'
            });
            return { shouldRetry: false };
        }
    }
    /**
     * Add a custom retry policy
     */
    addRetryPolicy(errorType, policy) {
        this.retryPolicies.set(errorType, policy);
    }
    /**
     * Add a custom recovery strategy
     */
    addRecoveryStrategy(errorType, strategy) {
        this.recoveryStrategies.set(errorType, strategy);
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const errorsByType = {};
        const errorsByAgent = {};
        let totalErrors = 0;
        for (const errors of this.errorHistory.values()) {
            for (const error of errors) {
                totalErrors++;
                errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
                if (error.agentType) {
                    errorsByAgent[error.agentType] = (errorsByAgent[error.agentType] || 0) + 1;
                }
            }
        }
        const circuitBreakerStates = {};
        for (const [agent, breaker] of this.circuitBreakers.entries()) {
            circuitBreakerStates[agent] = breaker.isOpen;
        }
        return {
            totalErrors,
            errorsByType,
            errorsByAgent,
            deadLetterQueueSize: this.deadLetterQueue.length,
            circuitBreakerStates
        };
    }
    /**
     * Get dead letter queue contents
     */
    getDeadLetterQueue() {
        return [...this.deadLetterQueue];
    }
    /**
     * Clear dead letter queue
     */
    clearDeadLetterQueue() {
        this.deadLetterQueue.length = 0;
        this.emit('dead-letter-queue-cleared');
    }
    /**
     * Get error history for a specific conversation or agent
     */
    getErrorHistory(key) {
        return this.errorHistory.get(key) || [];
    }
    recordError(error) {
        // Record by conversation ID if available
        if (error.originalMessage?.metadata.conversationId) {
            const conversationId = error.originalMessage.metadata.conversationId;
            const history = this.errorHistory.get(conversationId) || [];
            history.push(error);
            this.errorHistory.set(conversationId, history);
        }
        // Record by agent type if available
        if (error.agentType) {
            const agentHistory = this.errorHistory.get(error.agentType) || [];
            agentHistory.push(error);
            this.errorHistory.set(error.agentType, agentHistory);
        }
        // Emit error event for monitoring
        if (this.config.errorReportingEnabled) {
            this.emit('communication-error', error);
        }
    }
    getRecoveryStrategy(error) {
        const strategy = this.recoveryStrategies.get(error.type);
        if (strategy) {
            return strategy;
        }
        // Default strategy based on error type
        switch (error.type) {
            case 'timeout':
            case 'delivery-failure':
                return { errorType: error.type, strategy: 'retry' };
            case 'agent-unavailable':
                return { errorType: error.type, strategy: 'reroute' };
            case 'validation-error':
                return { errorType: error.type, strategy: 'escalate' };
            case 'system-error':
                return { errorType: error.type, strategy: 'fallback' };
            default:
                return { errorType: error.type, strategy: 'retry' };
        }
    }
    async handleRetryStrategy(error, strategy) {
        const policy = this.retryPolicies.get(error.type) || this.getDefaultRetryPolicy();
        // Check if we should retry based on policy condition
        if (policy.condition && !policy.condition(error)) {
            return { shouldRetry: false };
        }
        // Check retry count
        if (error.retryCount >= policy.maxRetries) {
            // Move to dead letter queue if enabled
            if (this.config.deadLetterQueueEnabled) {
                this.deadLetterQueue.push(error);
                this.emit('message-moved-to-dlq', error);
            }
            return { shouldRetry: false };
        }
        // Calculate delay
        let delayMs = policy.delayMs;
        if (this.config.exponentialBackoff) {
            delayMs = Math.min(policy.delayMs * Math.pow(policy.backoffMultiplier, error.retryCount), this.config.maxRetryDelayMs);
        }
        // Add jitter if enabled
        if (this.config.jitterEnabled) {
            const jitter = Math.random() * policy.jitterMaxMs;
            delayMs += jitter;
        }
        return {
            shouldRetry: true,
            delayMs
        };
    }
    async handleRerouteStrategy(error, strategy) {
        // Try to find alternative agent
        const alternativeAgent = this.findAlternativeAgent(error.agentType);
        if (alternativeAgent) {
            this.emit('message-rerouted', {
                originalAgent: error.agentType,
                alternativeAgent,
                error
            });
            return {
                shouldRetry: true,
                alternativeAction: `reroute-to-${alternativeAgent}`
            };
        }
        // No alternative found, escalate
        return {
            shouldRetry: false,
            alternativeAction: 'escalate-no-alternative'
        };
    }
    async handleFallbackStrategy(error, strategy) {
        // Implement fallback mechanism (e.g., use cached response, default response, etc.)
        this.emit('fallback-activated', error);
        return {
            shouldRetry: false,
            alternativeAction: 'fallback-response'
        };
    }
    async handleEscalateStrategy(error, strategy) {
        // Escalate to supervisor or human intervention
        this.emit('error-escalated', error);
        return {
            shouldRetry: false,
            alternativeAction: 'escalate-to-supervisor'
        };
    }
    async handleDefaultStrategy(error) {
        // Default retry logic
        if (error.retryCount < this.config.maxRetries && error.recoverable) {
            const delayMs = this.config.baseRetryDelayMs * Math.pow(2, error.retryCount);
            return {
                shouldRetry: true,
                delayMs: Math.min(delayMs, this.config.maxRetryDelayMs)
            };
        }
        return { shouldRetry: false };
    }
    findAlternativeAgent(failedAgent) {
        if (!failedAgent)
            return null;
        // Simple alternative mapping - in a real system, this would be more sophisticated
        const alternatives = {
            'research': ['analysis'],
            'analysis': ['research'],
            'planning': ['supervisor'],
            'compliance': ['supervisor'],
            'synthesis': ['supervisor'],
            'supervisor': [] // No alternative for supervisor
        };
        const possibleAlternatives = alternatives[failedAgent] || [];
        // Return first available alternative (in a real system, check agent status)
        return possibleAlternatives.length > 0 ? possibleAlternatives[0] : null;
    }
    getDefaultRetryPolicy() {
        return {
            maxRetries: this.config.maxRetries,
            delayMs: this.config.baseRetryDelayMs,
            backoffMultiplier: 2,
            jitterMaxMs: 1000
        };
    }
    updateCircuitBreaker(agentType, success) {
        let breaker = this.circuitBreakers.get(agentType);
        if (!breaker) {
            breaker = { failures: 0, lastFailure: new Date(), isOpen: false };
            this.circuitBreakers.set(agentType, breaker);
        }
        if (success) {
            breaker.failures = Math.max(0, breaker.failures - 1);
            if (breaker.failures === 0) {
                breaker.isOpen = false;
            }
        }
        else {
            breaker.failures++;
            breaker.lastFailure = new Date();
            if (breaker.failures >= 5) { // Threshold
                breaker.isOpen = true;
                this.emit('circuit-breaker-opened', { agentType });
            }
        }
    }
    isCircuitOpen(agentType) {
        const breaker = this.circuitBreakers.get(agentType);
        if (!breaker)
            return false;
        // Auto-reset after 60 seconds
        if (breaker.isOpen && Date.now() - breaker.lastFailure.getTime() > 60000) {
            breaker.isOpen = false;
            breaker.failures = 0;
            this.emit('circuit-breaker-reset', { agentType });
        }
        return breaker.isOpen;
    }
    initializeDefaultPolicies() {
        // Timeout errors - retry with exponential backoff
        this.addRetryPolicy('timeout', {
            maxRetries: 3,
            delayMs: 2000,
            backoffMultiplier: 2,
            jitterMaxMs: 1000
        });
        // Delivery failures - retry quickly
        this.addRetryPolicy('delivery-failure', {
            maxRetries: 5,
            delayMs: 500,
            backoffMultiplier: 1.5,
            jitterMaxMs: 500
        });
        // Agent unavailable - retry with longer delays
        this.addRetryPolicy('agent-unavailable', {
            maxRetries: 2,
            delayMs: 5000,
            backoffMultiplier: 2,
            jitterMaxMs: 2000
        });
        // System errors - limited retries
        this.addRetryPolicy('system-error', {
            maxRetries: 1,
            delayMs: 10000,
            backoffMultiplier: 1,
            jitterMaxMs: 0
        });
        // Validation errors - no retries (need human intervention)
        this.addRetryPolicy('validation-error', {
            maxRetries: 0,
            delayMs: 0,
            backoffMultiplier: 1,
            jitterMaxMs: 0
        });
    }
    initializeDefaultStrategies() {
        this.addRecoveryStrategy('timeout', {
            errorType: 'timeout',
            strategy: 'retry'
        });
        this.addRecoveryStrategy('delivery-failure', {
            errorType: 'delivery-failure',
            strategy: 'retry'
        });
        this.addRecoveryStrategy('agent-unavailable', {
            errorType: 'agent-unavailable',
            strategy: 'reroute'
        });
        this.addRecoveryStrategy('validation-error', {
            errorType: 'validation-error',
            strategy: 'escalate'
        });
        this.addRecoveryStrategy('system-error', {
            errorType: 'system-error',
            strategy: 'fallback'
        });
    }
}
exports.CommunicationErrorHandler = CommunicationErrorHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3ItaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9jb21tdW5pY2F0aW9uL2Vycm9yLWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7OztBQUdILG1DQUFzQztBQXVDdEMsTUFBYSx5QkFBMEIsU0FBUSxxQkFBWTtJQVF6RCxZQUFZLFNBQXVDLEVBQUU7UUFDbkQsS0FBSyxFQUFFLENBQUM7UUFQRixpQkFBWSxHQUFzQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQzVELG9CQUFlLEdBQXlCLEVBQUUsQ0FBQztRQUMzQyxrQkFBYSxHQUE2QixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3BELHVCQUFrQixHQUF1QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ25FLG9CQUFlLEdBQTZFLElBQUksR0FBRyxFQUFFLENBQUM7UUFJNUcsSUFBSSxDQUFDLE1BQU0sR0FBRztZQUNaLFVBQVUsRUFBRSxDQUFDO1lBQ2IsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixlQUFlLEVBQUUsS0FBSztZQUN0QixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLHNCQUFzQixFQUFFLElBQUk7WUFDNUIscUJBQXFCLEVBQUUsSUFBSTtZQUMzQixxQkFBcUIsRUFBRSxJQUFJO1lBQzNCLEdBQUcsTUFBTTtTQUNWLENBQUM7UUFFRixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNqQyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQXlCO1FBS3pDLElBQUk7WUFDRiwwQkFBMEI7WUFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV4Qix3QkFBd0I7WUFDeEIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLHFCQUFxQixJQUFJLEtBQUssQ0FB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VUFBVTtTQUNyQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqY0QsOERBaWNDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb21tdW5pY2F0aW9uIEVycm9yIEhhbmRsZXJcbiAqIFxuICogSGFuZGxlcyBlcnJvcnMsIHJldHJpZXMsIGFuZCByZWNvdmVyeSBtZWNoYW5pc21zIGZvciB0aGUgYWdlbnQgY29tbXVuaWNhdGlvbiBzeXN0ZW0uXG4gKi9cblxuaW1wb3J0IHsgQWdlbnRNZXNzYWdlLCBBZ2VudFR5cGUgfSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcblxuZXhwb3J0IGludGVyZmFjZSBFcnJvckhhbmRsaW5nQ29uZmlnIHtcbiAgbWF4UmV0cmllczogbnVtYmVyO1xuICBiYXNlUmV0cnlEZWxheU1zOiBudW1iZXI7XG4gIG1heFJldHJ5RGVsYXlNczogbnVtYmVyO1xuICBleHBvbmVudGlhbEJhY2tvZmY6IGJvb2xlYW47XG4gIGppdHRlckVuYWJsZWQ6IGJvb2xlYW47XG4gIGRlYWRMZXR0ZXJRdWV1ZUVuYWJsZWQ6IGJvb2xlYW47XG4gIGVycm9yUmVwb3J0aW5nRW5hYmxlZDogYm9vbGVhbjtcbiAgY2lyY3VpdEJyZWFrZXJFbmFibGVkOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbW11bmljYXRpb25FcnJvciB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6ICdkZWxpdmVyeS1mYWlsdXJlJyB8ICd0aW1lb3V0JyB8ICd2YWxpZGF0aW9uLWVycm9yJyB8ICdhZ2VudC11bmF2YWlsYWJsZScgfCAnc3lzdGVtLWVycm9yJztcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBhZ2VudFR5cGU/OiBBZ2VudFR5cGU7XG4gIG9yaWdpbmFsTWVzc2FnZT86IEFnZW50TWVzc2FnZTtcbiAgdGltZXN0YW1wOiBEYXRlO1xuICByZXRyeUNvdW50OiBudW1iZXI7XG4gIHJlY292ZXJhYmxlOiBib29sZWFuO1xuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZXRyeVBvbGljeSB7XG4gIG1heFJldHJpZXM6IG51bWJlcjtcbiAgZGVsYXlNczogbnVtYmVyO1xuICBiYWNrb2ZmTXVsdGlwbGllcjogbnVtYmVyO1xuICBqaXR0ZXJNYXhNczogbnVtYmVyO1xuICBjb25kaXRpb24/OiAoZXJyb3I6IENvbW11bmljYXRpb25FcnJvcikgPT4gYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFcnJvclJlY292ZXJ5U3RyYXRlZ3kge1xuICBlcnJvclR5cGU6IHN0cmluZztcbiAgc3RyYXRlZ3k6ICdyZXRyeScgfCAncmVyb3V0ZScgfCAnZmFsbGJhY2snIHwgJ2VzY2FsYXRlJyB8ICdpZ25vcmUnO1xuICBwYXJhbWV0ZXJzPzogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGNsYXNzIENvbW11bmljYXRpb25FcnJvckhhbmRsZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBwcml2YXRlIGNvbmZpZzogRXJyb3JIYW5kbGluZ0NvbmZpZztcbiAgcHJpdmF0ZSBlcnJvckhpc3Rvcnk6IE1hcDxzdHJpbmcsIENvbW11bmljYXRpb25FcnJvcltdPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBkZWFkTGV0dGVyUXVldWU6IENvbW11bmljYXRpb25FcnJvcltdID0gW107XG4gIHByaXZhdGUgcmV0cnlQb2xpY2llczogTWFwPHN0cmluZywgUmV0cnlQb2xpY3k+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHJlY292ZXJ5U3RyYXRlZ2llczogTWFwPHN0cmluZywgRXJyb3JSZWNvdmVyeVN0cmF0ZWd5PiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBjaXJjdWl0QnJlYWtlcnM6IE1hcDxBZ2VudFR5cGUsIHsgZmFpbHVyZXM6IG51bWJlcjsgbGFzdEZhaWx1cmU6IERhdGU7IGlzT3BlbjogYm9vbGVhbiB9PiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFBhcnRpYWw8RXJyb3JIYW5kbGluZ0NvbmZpZz4gPSB7fSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICBtYXhSZXRyaWVzOiAzLFxuICAgICAgYmFzZVJldHJ5RGVsYXlNczogMTAwMCxcbiAgICAgIG1heFJldHJ5RGVsYXlNczogMzAwMDAsXG4gICAgICBleHBvbmVudGlhbEJhY2tvZmY6IHRydWUsXG4gICAgICBqaXR0ZXJFbmFibGVkOiB0cnVlLFxuICAgICAgZGVhZExldHRlclF1ZXVlRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGVycm9yUmVwb3J0aW5nRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGNpcmN1aXRCcmVha2VyRW5hYmxlZDogdHJ1ZSxcbiAgICAgIC4uLmNvbmZpZ1xuICAgIH07XG5cbiAgICB0aGlzLmluaXRpYWxpemVEZWZhdWx0UG9saWNpZXMoKTtcbiAgICB0aGlzLmluaXRpYWxpemVEZWZhdWx0U3RyYXRlZ2llcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhIGNvbW11bmljYXRpb24gZXJyb3JcbiAgICovXG4gIGFzeW5jIGhhbmRsZUVycm9yKGVycm9yOiBDb21tdW5pY2F0aW9uRXJyb3IpOiBQcm9taXNlPHtcbiAgICBzaG91bGRSZXRyeTogYm9vbGVhbjtcbiAgICBkZWxheU1zPzogbnVtYmVyO1xuICAgIGFsdGVybmF0aXZlQWN0aW9uPzogc3RyaW5nO1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFJlY29yZCBlcnJvciBpbiBoaXN0b3J5XG4gICAgICB0aGlzLnJlY29yZEVycm9yKGVycm9yKTtcblxuICAgICAgLy8gQ2hlY2sgY2lyY3VpdCBicmVha2VyXG4gICAgICBpZiAodGhpcy5jb25maWcuY2lyY3VpdEJyZWFrZXJFbmFibGVkICYmIGVycm9yLmFnZW50VHlwZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNpcmN1aXRCcmVha2VyKGVycm9yLmFnZW50VHlwZSwgZmFsc2UpO1xuICAgICAgICBpZiAodGhpcy5pc0NpcmN1aXRPcGVuKGVycm9yLmFnZW50VHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2hvdWxkUmV0cnk6IGZhbHNlLFxuICAgICAgICAgICAgYWx0ZXJuYXRpdmVBY3Rpb246ICdjaXJjdWl0LWJyZWFrZXItb3BlbidcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCByZWNvdmVyeSBzdHJhdGVneVxuICAgICAgY29uc3Qgc3RyYXRlZ3kgPSB0aGlzLmdldFJlY292ZXJ5U3RyYXRlZ3koZXJyb3IpO1xuICAgICAgXG4gICAgICBzd2l0Y2ggKHN0cmF0ZWd5LnN0cmF0ZWd5KSB7XG4gICAgICAgIGNhc2UgJ3JldHJ5JzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVSZXRyeVN0cmF0ZWd5KGVycm9yLCBzdHJhdGVneSk7XG4gICAgICAgIFxuICAgICAgICBjYXNlICdyZXJvdXRlJzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVSZXJvdXRlU3RyYXRlZ3koZXJyb3IsIHN0cmF0ZWd5KTtcbiAgICAgICAgXG4gICAgICAgIGNhc2UgJ2ZhbGxiYWNrJzpcbiAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5oYW5kbGVGYWxsYmFja1N0cmF0ZWd5KGVycm9yLCBzdHJhdGVneSk7XG4gICAgICAgIFxuICAgICAgICBjYXNlICdlc2NhbGF0ZSc6XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlRXNjYWxhdGVTdHJhdGVneShlcnJvciwgc3RyYXRlZ3kpO1xuICAgICAgICBcbiAgICAgICAgY2FzZSAnaWdub3JlJzpcbiAgICAgICAgICByZXR1cm4geyBzaG91bGRSZXRyeTogZmFsc2UgfTtcbiAgICAgICAgXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuaGFuZGxlRGVmYXVsdFN0cmF0ZWd5KGVycm9yKTtcbiAgICAgIH1cblxuICAgIH0gY2F0Y2ggKGhhbmRsaW5nRXJyb3IpIHtcbiAgICAgIHRoaXMuZW1pdCgnZXJyb3ItaGFuZGxpbmctZmFpbGVkJywge1xuICAgICAgICBvcmlnaW5hbEVycm9yOiBlcnJvcixcbiAgICAgICAgaGFuZGxpbmdFcnJvcjogaGFuZGxpbmdFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gaGFuZGxpbmdFcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHsgc2hvdWxkUmV0cnk6IGZhbHNlIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGN1c3RvbSByZXRyeSBwb2xpY3lcbiAgICovXG4gIGFkZFJldHJ5UG9saWN5KGVycm9yVHlwZTogc3RyaW5nLCBwb2xpY3k6IFJldHJ5UG9saWN5KTogdm9pZCB7XG4gICAgdGhpcy5yZXRyeVBvbGljaWVzLnNldChlcnJvclR5cGUsIHBvbGljeSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGEgY3VzdG9tIHJlY292ZXJ5IHN0cmF0ZWd5XG4gICAqL1xuICBhZGRSZWNvdmVyeVN0cmF0ZWd5KGVycm9yVHlwZTogc3RyaW5nLCBzdHJhdGVneTogRXJyb3JSZWNvdmVyeVN0cmF0ZWd5KTogdm9pZCB7XG4gICAgdGhpcy5yZWNvdmVyeVN0cmF0ZWdpZXMuc2V0KGVycm9yVHlwZSwgc3RyYXRlZ3kpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBlcnJvciBzdGF0aXN0aWNzXG4gICAqL1xuICBnZXRFcnJvclN0YXRzKCk6IHtcbiAgICB0b3RhbEVycm9yczogbnVtYmVyO1xuICAgIGVycm9yc0J5VHlwZTogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICBlcnJvcnNCeUFnZW50OiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICAgIGRlYWRMZXR0ZXJRdWV1ZVNpemU6IG51bWJlcjtcbiAgICBjaXJjdWl0QnJlYWtlclN0YXRlczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj47XG4gIH0ge1xuICAgIGNvbnN0IGVycm9yc0J5VHlwZTogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGNvbnN0IGVycm9yc0J5QWdlbnQ6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgICBsZXQgdG90YWxFcnJvcnMgPSAwO1xuXG4gICAgZm9yIChjb25zdCBlcnJvcnMgb2YgdGhpcy5lcnJvckhpc3RvcnkudmFsdWVzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgZXJyb3Igb2YgZXJyb3JzKSB7XG4gICAgICAgIHRvdGFsRXJyb3JzKys7XG4gICAgICAgIGVycm9yc0J5VHlwZVtlcnJvci50eXBlXSA9IChlcnJvcnNCeVR5cGVbZXJyb3IudHlwZV0gfHwgMCkgKyAxO1xuICAgICAgICBpZiAoZXJyb3IuYWdlbnRUeXBlKSB7XG4gICAgICAgICAgZXJyb3JzQnlBZ2VudFtlcnJvci5hZ2VudFR5cGVdID0gKGVycm9yc0J5QWdlbnRbZXJyb3IuYWdlbnRUeXBlXSB8fCAwKSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjaXJjdWl0QnJlYWtlclN0YXRlczogUmVjb3JkPHN0cmluZywgYm9vbGVhbj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFthZ2VudCwgYnJlYWtlcl0gb2YgdGhpcy5jaXJjdWl0QnJlYWtlcnMuZW50cmllcygpKSB7XG4gICAgICBjaXJjdWl0QnJlYWtlclN0YXRlc1thZ2VudF0gPSBicmVha2VyLmlzT3BlbjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxFcnJvcnMsXG4gICAgICBlcnJvcnNCeVR5cGUsXG4gICAgICBlcnJvcnNCeUFnZW50LFxuICAgICAgZGVhZExldHRlclF1ZXVlU2l6ZTogdGhpcy5kZWFkTGV0dGVyUXVldWUubGVuZ3RoLFxuICAgICAgY2lyY3VpdEJyZWFrZXJTdGF0ZXNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBkZWFkIGxldHRlciBxdWV1ZSBjb250ZW50c1xuICAgKi9cbiAgZ2V0RGVhZExldHRlclF1ZXVlKCk6IENvbW11bmljYXRpb25FcnJvcltdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuZGVhZExldHRlclF1ZXVlXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhciBkZWFkIGxldHRlciBxdWV1ZVxuICAgKi9cbiAgY2xlYXJEZWFkTGV0dGVyUXVldWUoKTogdm9pZCB7XG4gICAgdGhpcy5kZWFkTGV0dGVyUXVldWUubGVuZ3RoID0gMDtcbiAgICB0aGlzLmVtaXQoJ2RlYWQtbGV0dGVyLXF1ZXVlLWNsZWFyZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZXJyb3IgaGlzdG9yeSBmb3IgYSBzcGVjaWZpYyBjb252ZXJzYXRpb24gb3IgYWdlbnRcbiAgICovXG4gIGdldEVycm9ySGlzdG9yeShrZXk6IHN0cmluZyk6IENvbW11bmljYXRpb25FcnJvcltdIHtcbiAgICByZXR1cm4gdGhpcy5lcnJvckhpc3RvcnkuZ2V0KGtleSkgfHwgW107XG4gIH1cblxuICBwcml2YXRlIHJlY29yZEVycm9yKGVycm9yOiBDb21tdW5pY2F0aW9uRXJyb3IpOiB2b2lkIHtcbiAgICAvLyBSZWNvcmQgYnkgY29udmVyc2F0aW9uIElEIGlmIGF2YWlsYWJsZVxuICAgIGlmIChlcnJvci5vcmlnaW5hbE1lc3NhZ2U/Lm1ldGFkYXRhLmNvbnZlcnNhdGlvbklkKSB7XG4gICAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IGVycm9yLm9yaWdpbmFsTWVzc2FnZS5tZXRhZGF0YS5jb252ZXJzYXRpb25JZDtcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSB0aGlzLmVycm9ySGlzdG9yeS5nZXQoY29udmVyc2F0aW9uSWQpIHx8IFtdO1xuICAgICAgaGlzdG9yeS5wdXNoKGVycm9yKTtcbiAgICAgIHRoaXMuZXJyb3JIaXN0b3J5LnNldChjb252ZXJzYXRpb25JZCwgaGlzdG9yeSk7XG4gICAgfVxuXG4gICAgLy8gUmVjb3JkIGJ5IGFnZW50IHR5cGUgaWYgYXZhaWxhYmxlXG4gICAgaWYgKGVycm9yLmFnZW50VHlwZSkge1xuICAgICAgY29uc3QgYWdlbnRIaXN0b3J5ID0gdGhpcy5lcnJvckhpc3RvcnkuZ2V0KGVycm9yLmFnZW50VHlwZSkgfHwgW107XG4gICAgICBhZ2VudEhpc3RvcnkucHVzaChlcnJvcik7XG4gICAgICB0aGlzLmVycm9ySGlzdG9yeS5zZXQoZXJyb3IuYWdlbnRUeXBlLCBhZ2VudEhpc3RvcnkpO1xuICAgIH1cblxuICAgIC8vIEVtaXQgZXJyb3IgZXZlbnQgZm9yIG1vbml0b3JpbmdcbiAgICBpZiAodGhpcy5jb25maWcuZXJyb3JSZXBvcnRpbmdFbmFibGVkKSB7XG4gICAgICB0aGlzLmVtaXQoJ2NvbW11bmljYXRpb24tZXJyb3InLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRSZWNvdmVyeVN0cmF0ZWd5KGVycm9yOiBDb21tdW5pY2F0aW9uRXJyb3IpOiBFcnJvclJlY292ZXJ5U3RyYXRlZ3kge1xuICAgIGNvbnN0IHN0cmF0ZWd5ID0gdGhpcy5yZWNvdmVyeVN0cmF0ZWdpZXMuZ2V0KGVycm9yLnR5cGUpO1xuICAgIGlmIChzdHJhdGVneSkge1xuICAgICAgcmV0dXJuIHN0cmF0ZWd5O1xuICAgIH1cblxuICAgIC8vIERlZmF1bHQgc3RyYXRlZ3kgYmFzZWQgb24gZXJyb3IgdHlwZVxuICAgIHN3aXRjaCAoZXJyb3IudHlwZSkge1xuICAgICAgY2FzZSAndGltZW91dCc6XG4gICAgICBjYXNlICdkZWxpdmVyeS1mYWlsdXJlJzpcbiAgICAgICAgcmV0dXJuIHsgZXJyb3JUeXBlOiBlcnJvci50eXBlLCBzdHJhdGVneTogJ3JldHJ5JyB9O1xuICAgICAgXG4gICAgICBjYXNlICdhZ2VudC11bmF2YWlsYWJsZSc6XG4gICAgICAgIHJldHVybiB7IGVycm9yVHlwZTogZXJyb3IudHlwZSwgc3RyYXRlZ3k6ICdyZXJvdXRlJyB9O1xuICAgICAgXG4gICAgICBjYXNlICd2YWxpZGF0aW9uLWVycm9yJzpcbiAgICAgICAgcmV0dXJuIHsgZXJyb3JUeXBlOiBlcnJvci50eXBlLCBzdHJhdGVneTogJ2VzY2FsYXRlJyB9O1xuICAgICAgXG4gICAgICBjYXNlICdzeXN0ZW0tZXJyb3InOlxuICAgICAgICByZXR1cm4geyBlcnJvclR5cGU6IGVycm9yLnR5cGUsIHN0cmF0ZWd5OiAnZmFsbGJhY2snIH07XG4gICAgICBcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB7IGVycm9yVHlwZTogZXJyb3IudHlwZSwgc3RyYXRlZ3k6ICdyZXRyeScgfTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGhhbmRsZVJldHJ5U3RyYXRlZ3koZXJyb3I6IENvbW11bmljYXRpb25FcnJvciwgc3RyYXRlZ3k6IEVycm9yUmVjb3ZlcnlTdHJhdGVneSk6IFByb21pc2U8e1xuICAgIHNob3VsZFJldHJ5OiBib29sZWFuO1xuICAgIGRlbGF5TXM/OiBudW1iZXI7XG4gIH0+IHtcbiAgICBjb25zdCBwb2xpY3kgPSB0aGlzLnJldHJ5UG9saWNpZXMuZ2V0KGVycm9yLnR5cGUpIHx8IHRoaXMuZ2V0RGVmYXVsdFJldHJ5UG9saWN5KCk7XG4gICAgXG4gICAgLy8gQ2hlY2sgaWYgd2Ugc2hvdWxkIHJldHJ5IGJhc2VkIG9uIHBvbGljeSBjb25kaXRpb25cbiAgICBpZiAocG9saWN5LmNvbmRpdGlvbiAmJiAhcG9saWN5LmNvbmRpdGlvbihlcnJvcikpIHtcbiAgICAgIHJldHVybiB7IHNob3VsZFJldHJ5OiBmYWxzZSB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIHJldHJ5IGNvdW50XG4gICAgaWYgKGVycm9yLnJldHJ5Q291bnQgPj0gcG9saWN5Lm1heFJldHJpZXMpIHtcbiAgICAgIC8vIE1vdmUgdG8gZGVhZCBsZXR0ZXIgcXVldWUgaWYgZW5hYmxlZFxuICAgICAgaWYgKHRoaXMuY29uZmlnLmRlYWRMZXR0ZXJRdWV1ZUVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5kZWFkTGV0dGVyUXVldWUucHVzaChlcnJvcik7XG4gICAgICAgIHRoaXMuZW1pdCgnbWVzc2FnZS1tb3ZlZC10by1kbHEnLCBlcnJvcik7XG4gICAgICB9XG4gICAgICByZXR1cm4geyBzaG91bGRSZXRyeTogZmFsc2UgfTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgZGVsYXlcbiAgICBsZXQgZGVsYXlNcyA9IHBvbGljeS5kZWxheU1zO1xuICAgIFxuICAgIGlmICh0aGlzLmNvbmZpZy5leHBvbmVudGlhbEJhY2tvZmYpIHtcbiAgICAgIGRlbGF5TXMgPSBNYXRoLm1pbihcbiAgICAgICAgcG9saWN5LmRlbGF5TXMgKiBNYXRoLnBvdyhwb2xpY3kuYmFja29mZk11bHRpcGxpZXIsIGVycm9yLnJldHJ5Q291bnQpLFxuICAgICAgICB0aGlzLmNvbmZpZy5tYXhSZXRyeURlbGF5TXNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQWRkIGppdHRlciBpZiBlbmFibGVkXG4gICAgaWYgKHRoaXMuY29uZmlnLmppdHRlckVuYWJsZWQpIHtcbiAgICAgIGNvbnN0IGppdHRlciA9IE1hdGgucmFuZG9tKCkgKiBwb2xpY3kuaml0dGVyTWF4TXM7XG4gICAgICBkZWxheU1zICs9IGppdHRlcjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2hvdWxkUmV0cnk6IHRydWUsXG4gICAgICBkZWxheU1zXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlUmVyb3V0ZVN0cmF0ZWd5KGVycm9yOiBDb21tdW5pY2F0aW9uRXJyb3IsIHN0cmF0ZWd5OiBFcnJvclJlY292ZXJ5U3RyYXRlZ3kpOiBQcm9taXNlPHtcbiAgICBzaG91bGRSZXRyeTogYm9vbGVhbjtcbiAgICBhbHRlcm5hdGl2ZUFjdGlvbj86IHN0cmluZztcbiAgfT4ge1xuICAgIC8vIFRyeSB0byBmaW5kIGFsdGVybmF0aXZlIGFnZW50XG4gICAgY29uc3QgYWx0ZXJuYXRpdmVBZ2VudCA9IHRoaXMuZmluZEFsdGVybmF0aXZlQWdlbnQoZXJyb3IuYWdlbnRUeXBlKTtcbiAgICBcbiAgICBpZiAoYWx0ZXJuYXRpdmVBZ2VudCkge1xuICAgICAgdGhpcy5lbWl0KCdtZXNzYWdlLXJlcm91dGVkJywge1xuICAgICAgICBvcmlnaW5hbEFnZW50OiBlcnJvci5hZ2VudFR5cGUsXG4gICAgICAgIGFsdGVybmF0aXZlQWdlbnQsXG4gICAgICAgIGVycm9yXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2hvdWxkUmV0cnk6IHRydWUsXG4gICAgICAgIGFsdGVybmF0aXZlQWN0aW9uOiBgcmVyb3V0ZS10by0ke2FsdGVybmF0aXZlQWdlbnR9YFxuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBObyBhbHRlcm5hdGl2ZSBmb3VuZCwgZXNjYWxhdGVcbiAgICByZXR1cm4ge1xuICAgICAgc2hvdWxkUmV0cnk6IGZhbHNlLFxuICAgICAgYWx0ZXJuYXRpdmVBY3Rpb246ICdlc2NhbGF0ZS1uby1hbHRlcm5hdGl2ZSdcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBoYW5kbGVGYWxsYmFja1N0cmF0ZWd5KGVycm9yOiBDb21tdW5pY2F0aW9uRXJyb3IsIHN0cmF0ZWd5OiBFcnJvclJlY292ZXJ5U3RyYXRlZ3kpOiBQcm9taXNlPHtcbiAgICBzaG91bGRSZXRyeTogYm9vbGVhbjtcbiAgICBhbHRlcm5hdGl2ZUFjdGlvbj86IHN0cmluZztcbiAgfT4ge1xuICAgIC8vIEltcGxlbWVudCBmYWxsYmFjayBtZWNoYW5pc20gKGUuZy4sIHVzZSBjYWNoZWQgcmVzcG9uc2UsIGRlZmF1bHQgcmVzcG9uc2UsIGV0Yy4pXG4gICAgdGhpcy5lbWl0KCdmYWxsYmFjay1hY3RpdmF0ZWQnLCBlcnJvcik7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHNob3VsZFJldHJ5OiBmYWxzZSxcbiAgICAgIGFsdGVybmF0aXZlQWN0aW9uOiAnZmFsbGJhY2stcmVzcG9uc2UnXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlRXNjYWxhdGVTdHJhdGVneShlcnJvcjogQ29tbXVuaWNhdGlvbkVycm9yLCBzdHJhdGVneTogRXJyb3JSZWNvdmVyeVN0cmF0ZWd5KTogUHJvbWlzZTx7XG4gICAgc2hvdWxkUmV0cnk6IGJvb2xlYW47XG4gICAgYWx0ZXJuYXRpdmVBY3Rpb24/OiBzdHJpbmc7XG4gIH0+IHtcbiAgICAvLyBFc2NhbGF0ZSB0byBzdXBlcnZpc29yIG9yIGh1bWFuIGludGVydmVudGlvblxuICAgIHRoaXMuZW1pdCgnZXJyb3ItZXNjYWxhdGVkJywgZXJyb3IpO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzaG91bGRSZXRyeTogZmFsc2UsXG4gICAgICBhbHRlcm5hdGl2ZUFjdGlvbjogJ2VzY2FsYXRlLXRvLXN1cGVydmlzb3InXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlRGVmYXVsdFN0cmF0ZWd5KGVycm9yOiBDb21tdW5pY2F0aW9uRXJyb3IpOiBQcm9taXNlPHtcbiAgICBzaG91bGRSZXRyeTogYm9vbGVhbjtcbiAgICBkZWxheU1zPzogbnVtYmVyO1xuICB9PiB7XG4gICAgLy8gRGVmYXVsdCByZXRyeSBsb2dpY1xuICAgIGlmIChlcnJvci5yZXRyeUNvdW50IDwgdGhpcy5jb25maWcubWF4UmV0cmllcyAmJiBlcnJvci5yZWNvdmVyYWJsZSkge1xuICAgICAgY29uc3QgZGVsYXlNcyA9IHRoaXMuY29uZmlnLmJhc2VSZXRyeURlbGF5TXMgKiBNYXRoLnBvdygyLCBlcnJvci5yZXRyeUNvdW50KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNob3VsZFJldHJ5OiB0cnVlLFxuICAgICAgICBkZWxheU1zOiBNYXRoLm1pbihkZWxheU1zLCB0aGlzLmNvbmZpZy5tYXhSZXRyeURlbGF5TXMpXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7IHNob3VsZFJldHJ5OiBmYWxzZSB9O1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kQWx0ZXJuYXRpdmVBZ2VudChmYWlsZWRBZ2VudD86IEFnZW50VHlwZSk6IEFnZW50VHlwZSB8IG51bGwge1xuICAgIGlmICghZmFpbGVkQWdlbnQpIHJldHVybiBudWxsO1xuXG4gICAgLy8gU2ltcGxlIGFsdGVybmF0aXZlIG1hcHBpbmcgLSBpbiBhIHJlYWwgc3lzdGVtLCB0aGlzIHdvdWxkIGJlIG1vcmUgc29waGlzdGljYXRlZFxuICAgIGNvbnN0IGFsdGVybmF0aXZlczogUmVjb3JkPEFnZW50VHlwZSwgQWdlbnRUeXBlW10+ID0ge1xuICAgICAgJ3Jlc2VhcmNoJzogWydhbmFseXNpcyddLFxuICAgICAgJ2FuYWx5c2lzJzogWydyZXNlYXJjaCddLFxuICAgICAgJ3BsYW5uaW5nJzogWydzdXBlcnZpc29yJ10sXG4gICAgICAnY29tcGxpYW5jZSc6IFsnc3VwZXJ2aXNvciddLFxuICAgICAgJ3N5bnRoZXNpcyc6IFsnc3VwZXJ2aXNvciddLFxuICAgICAgJ3N1cGVydmlzb3InOiBbXSAvLyBObyBhbHRlcm5hdGl2ZSBmb3Igc3VwZXJ2aXNvclxuICAgIH07XG5cbiAgICBjb25zdCBwb3NzaWJsZUFsdGVybmF0aXZlcyA9IGFsdGVybmF0aXZlc1tmYWlsZWRBZ2VudF0gfHwgW107XG4gICAgXG4gICAgLy8gUmV0dXJuIGZpcnN0IGF2YWlsYWJsZSBhbHRlcm5hdGl2ZSAoaW4gYSByZWFsIHN5c3RlbSwgY2hlY2sgYWdlbnQgc3RhdHVzKVxuICAgIHJldHVybiBwb3NzaWJsZUFsdGVybmF0aXZlcy5sZW5ndGggPiAwID8gcG9zc2libGVBbHRlcm5hdGl2ZXNbMF0gOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0UmV0cnlQb2xpY3koKTogUmV0cnlQb2xpY3kge1xuICAgIHJldHVybiB7XG4gICAgICBtYXhSZXRyaWVzOiB0aGlzLmNvbmZpZy5tYXhSZXRyaWVzLFxuICAgICAgZGVsYXlNczogdGhpcy5jb25maWcuYmFzZVJldHJ5RGVsYXlNcyxcbiAgICAgIGJhY2tvZmZNdWx0aXBsaWVyOiAyLFxuICAgICAgaml0dGVyTWF4TXM6IDEwMDBcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDaXJjdWl0QnJlYWtlcihhZ2VudFR5cGU6IEFnZW50VHlwZSwgc3VjY2VzczogYm9vbGVhbik6IHZvaWQge1xuICAgIGxldCBicmVha2VyID0gdGhpcy5jaXJjdWl0QnJlYWtlcnMuZ2V0KGFnZW50VHlwZSk7XG4gICAgaWYgKCFicmVha2VyKSB7XG4gICAgICBicmVha2VyID0geyBmYWlsdXJlczogMCwgbGFzdEZhaWx1cmU6IG5ldyBEYXRlKCksIGlzT3BlbjogZmFsc2UgfTtcbiAgICAgIHRoaXMuY2lyY3VpdEJyZWFrZXJzLnNldChhZ2VudFR5cGUsIGJyZWFrZXIpO1xuICAgIH1cblxuICAgIGlmIChzdWNjZXNzKSB7XG4gICAgICBicmVha2VyLmZhaWx1cmVzID0gTWF0aC5tYXgoMCwgYnJlYWtlci5mYWlsdXJlcyAtIDEpO1xuICAgICAgaWYgKGJyZWFrZXIuZmFpbHVyZXMgPT09IDApIHtcbiAgICAgICAgYnJlYWtlci5pc09wZW4gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWtlci5mYWlsdXJlcysrO1xuICAgICAgYnJlYWtlci5sYXN0RmFpbHVyZSA9IG5ldyBEYXRlKCk7XG4gICAgICBcbiAgICAgIGlmIChicmVha2VyLmZhaWx1cmVzID49IDUpIHsgLy8gVGhyZXNob2xkXG4gICAgICAgIGJyZWFrZXIuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0KCdjaXJjdWl0LWJyZWFrZXItb3BlbmVkJywgeyBhZ2VudFR5cGUgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc0NpcmN1aXRPcGVuKGFnZW50VHlwZTogQWdlbnRUeXBlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgYnJlYWtlciA9IHRoaXMuY2lyY3VpdEJyZWFrZXJzLmdldChhZ2VudFR5cGUpO1xuICAgIGlmICghYnJlYWtlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgLy8gQXV0by1yZXNldCBhZnRlciA2MCBzZWNvbmRzXG4gICAgaWYgKGJyZWFrZXIuaXNPcGVuICYmIERhdGUubm93KCkgLSBicmVha2VyLmxhc3RGYWlsdXJlLmdldFRpbWUoKSA+IDYwMDAwKSB7XG4gICAgICBicmVha2VyLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgYnJlYWtlci5mYWlsdXJlcyA9IDA7XG4gICAgICB0aGlzLmVtaXQoJ2NpcmN1aXQtYnJlYWtlci1yZXNldCcsIHsgYWdlbnRUeXBlIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBicmVha2VyLmlzT3BlbjtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURlZmF1bHRQb2xpY2llcygpOiB2b2lkIHtcbiAgICAvLyBUaW1lb3V0IGVycm9ycyAtIHJldHJ5IHdpdGggZXhwb25lbnRpYWwgYmFja29mZlxuICAgIHRoaXMuYWRkUmV0cnlQb2xpY3koJ3RpbWVvdXQnLCB7XG4gICAgICBtYXhSZXRyaWVzOiAzLFxuICAgICAgZGVsYXlNczogMjAwMCxcbiAgICAgIGJhY2tvZmZNdWx0aXBsaWVyOiAyLFxuICAgICAgaml0dGVyTWF4TXM6IDEwMDBcbiAgICB9KTtcblxuICAgIC8vIERlbGl2ZXJ5IGZhaWx1cmVzIC0gcmV0cnkgcXVpY2tseVxuICAgIHRoaXMuYWRkUmV0cnlQb2xpY3koJ2RlbGl2ZXJ5LWZhaWx1cmUnLCB7XG4gICAgICBtYXhSZXRyaWVzOiA1LFxuICAgICAgZGVsYXlNczogNTAwLFxuICAgICAgYmFja29mZk11bHRpcGxpZXI6IDEuNSxcbiAgICAgIGppdHRlck1heE1zOiA1MDBcbiAgICB9KTtcblxuICAgIC8vIEFnZW50IHVuYXZhaWxhYmxlIC0gcmV0cnkgd2l0aCBsb25nZXIgZGVsYXlzXG4gICAgdGhpcy5hZGRSZXRyeVBvbGljeSgnYWdlbnQtdW5hdmFpbGFibGUnLCB7XG4gICAgICBtYXhSZXRyaWVzOiAyLFxuICAgICAgZGVsYXlNczogNTAwMCxcbiAgICAgIGJhY2tvZmZNdWx0aXBsaWVyOiAyLFxuICAgICAgaml0dGVyTWF4TXM6IDIwMDBcbiAgICB9KTtcblxuICAgIC8vIFN5c3RlbSBlcnJvcnMgLSBsaW1pdGVkIHJldHJpZXNcbiAgICB0aGlzLmFkZFJldHJ5UG9saWN5KCdzeXN0ZW0tZXJyb3InLCB7XG4gICAgICBtYXhSZXRyaWVzOiAxLFxuICAgICAgZGVsYXlNczogMTAwMDAsXG4gICAgICBiYWNrb2ZmTXVsdGlwbGllcjogMSxcbiAgICAgIGppdHRlck1heE1zOiAwXG4gICAgfSk7XG5cbiAgICAvLyBWYWxpZGF0aW9uIGVycm9ycyAtIG5vIHJldHJpZXMgKG5lZWQgaHVtYW4gaW50ZXJ2ZW50aW9uKVxuICAgIHRoaXMuYWRkUmV0cnlQb2xpY3koJ3ZhbGlkYXRpb24tZXJyb3InLCB7XG4gICAgICBtYXhSZXRyaWVzOiAwLFxuICAgICAgZGVsYXlNczogMCxcbiAgICAgIGJhY2tvZmZNdWx0aXBsaWVyOiAxLFxuICAgICAgaml0dGVyTWF4TXM6IDBcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURlZmF1bHRTdHJhdGVnaWVzKCk6IHZvaWQge1xuICAgIHRoaXMuYWRkUmVjb3ZlcnlTdHJhdGVneSgndGltZW91dCcsIHtcbiAgICAgIGVycm9yVHlwZTogJ3RpbWVvdXQnLFxuICAgICAgc3RyYXRlZ3k6ICdyZXRyeSdcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkUmVjb3ZlcnlTdHJhdGVneSgnZGVsaXZlcnktZmFpbHVyZScsIHtcbiAgICAgIGVycm9yVHlwZTogJ2RlbGl2ZXJ5LWZhaWx1cmUnLFxuICAgICAgc3RyYXRlZ3k6ICdyZXRyeSdcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkUmVjb3ZlcnlTdHJhdGVneSgnYWdlbnQtdW5hdmFpbGFibGUnLCB7XG4gICAgICBlcnJvclR5cGU6ICdhZ2VudC11bmF2YWlsYWJsZScsXG4gICAgICBzdHJhdGVneTogJ3Jlcm91dGUnXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFJlY292ZXJ5U3RyYXRlZ3koJ3ZhbGlkYXRpb24tZXJyb3InLCB7XG4gICAgICBlcnJvclR5cGU6ICd2YWxpZGF0aW9uLWVycm9yJyxcbiAgICAgIHN0cmF0ZWd5OiAnZXNjYWxhdGUnXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFJlY292ZXJ5U3RyYXRlZ3koJ3N5c3RlbS1lcnJvcicsIHtcbiAgICAgIGVycm9yVHlwZTogJ3N5c3RlbS1lcnJvcicsXG4gICAgICBzdHJhdGVneTogJ2ZhbGxiYWNrJ1xuICAgIH0pO1xuICB9XG59Il19