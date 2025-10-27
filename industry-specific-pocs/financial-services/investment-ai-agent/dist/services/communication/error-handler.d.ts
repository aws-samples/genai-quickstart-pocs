/**
 * Communication Error Handler
 *
 * Handles errors, retries, and recovery mechanisms for the agent communication system.
 */
/// <reference types="node" />
import { AgentMessage, AgentType } from '../../models/agent';
import { EventEmitter } from 'events';
export interface ErrorHandlingConfig {
    maxRetries: number;
    baseRetryDelayMs: number;
    maxRetryDelayMs: number;
    exponentialBackoff: boolean;
    jitterEnabled: boolean;
    deadLetterQueueEnabled: boolean;
    errorReportingEnabled: boolean;
    circuitBreakerEnabled: boolean;
}
export interface CommunicationError {
    id: string;
    type: 'delivery-failure' | 'timeout' | 'validation-error' | 'agent-unavailable' | 'system-error';
    message: string;
    agentType?: AgentType;
    originalMessage?: AgentMessage;
    timestamp: Date;
    retryCount: number;
    recoverable: boolean;
    context?: Record<string, any>;
}
export interface RetryPolicy {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier: number;
    jitterMaxMs: number;
    condition?: (error: CommunicationError) => boolean;
}
export interface ErrorRecoveryStrategy {
    errorType: string;
    strategy: 'retry' | 'reroute' | 'fallback' | 'escalate' | 'ignore';
    parameters?: Record<string, any>;
}
export declare class CommunicationErrorHandler extends EventEmitter {
    private config;
    private errorHistory;
    private deadLetterQueue;
    private retryPolicies;
    private recoveryStrategies;
    private circuitBreakers;
    constructor(config?: Partial<ErrorHandlingConfig>);
    /**
     * Handle a communication error
     */
    handleError(error: CommunicationError): Promise<{
        shouldRetry: boolean;
        delayMs?: number;
        alternativeAction?: string;
    }>;
    /**
     * Add a custom retry policy
     */
    addRetryPolicy(errorType: string, policy: RetryPolicy): void;
    /**
     * Add a custom recovery strategy
     */
    addRecoveryStrategy(errorType: string, strategy: ErrorRecoveryStrategy): void;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByType: Record<string, number>;
        errorsByAgent: Record<string, number>;
        deadLetterQueueSize: number;
        circuitBreakerStates: Record<string, boolean>;
    };
    /**
     * Get dead letter queue contents
     */
    getDeadLetterQueue(): CommunicationError[];
    /**
     * Clear dead letter queue
     */
    clearDeadLetterQueue(): void;
    /**
     * Get error history for a specific conversation or agent
     */
    getErrorHistory(key: string): CommunicationError[];
    private recordError;
    private getRecoveryStrategy;
    private handleRetryStrategy;
    private handleRerouteStrategy;
    private handleFallbackStrategy;
    private handleEscalateStrategy;
    private handleDefaultStrategy;
    private findAlternativeAgent;
    private getDefaultRetryPolicy;
    private updateCircuitBreaker;
    private isCircuitOpen;
    private initializeDefaultPolicies;
    private initializeDefaultStrategies;
}
