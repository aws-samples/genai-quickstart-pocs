/**
 * Communication Error Handler
 * 
 * Handles errors, retries, and recovery mechanisms for the agent communication system.
 */

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

export class CommunicationErrorHandler extends EventEmitter {
  private config: ErrorHandlingConfig;
  private errorHistory: Map<string, CommunicationError[]> = new Map();
  private deadLetterQueue: CommunicationError[] = [];
  private retryPolicies: Map<string, RetryPolicy> = new Map();
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private circuitBreakers: Map<AgentType, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    super();
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
  async handleError(error: CommunicationError): Promise<{
    shouldRetry: boolean;
    delayMs?: number;
    alternativeAction?: string;
  }> {
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

    } catch (handlingError) {
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
  addRetryPolicy(errorType: string, policy: RetryPolicy): void {
    this.retryPolicies.set(errorType, policy);
  }

  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(errorType: string, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByAgent: Record<string, number>;
    deadLetterQueueSize: number;
    circuitBreakerStates: Record<string, boolean>;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByAgent: Record<string, number> = {};
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

    const circuitBreakerStates: Record<string, boolean> = {};
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
  getDeadLetterQueue(): CommunicationError[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue.length = 0;
    this.emit('dead-letter-queue-cleared');
  }

  /**
   * Get error history for a specific conversation or agent
   */
  getErrorHistory(key: string): CommunicationError[] {
    return this.errorHistory.get(key) || [];
  }

  private recordError(error: CommunicationError): void {
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

  private getRecoveryStrategy(error: CommunicationError): ErrorRecoveryStrategy {
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

  private async handleRetryStrategy(error: CommunicationError, strategy: ErrorRecoveryStrategy): Promise<{
    shouldRetry: boolean;
    delayMs?: number;
  }> {
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
      delayMs = Math.min(
        policy.delayMs * Math.pow(policy.backoffMultiplier, error.retryCount),
        this.config.maxRetryDelayMs
      );
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

  private async handleRerouteStrategy(error: CommunicationError, strategy: ErrorRecoveryStrategy): Promise<{
    shouldRetry: boolean;
    alternativeAction?: string;
  }> {
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

  private async handleFallbackStrategy(error: CommunicationError, strategy: ErrorRecoveryStrategy): Promise<{
    shouldRetry: boolean;
    alternativeAction?: string;
  }> {
    // Implement fallback mechanism (e.g., use cached response, default response, etc.)
    this.emit('fallback-activated', error);
    
    return {
      shouldRetry: false,
      alternativeAction: 'fallback-response'
    };
  }

  private async handleEscalateStrategy(error: CommunicationError, strategy: ErrorRecoveryStrategy): Promise<{
    shouldRetry: boolean;
    alternativeAction?: string;
  }> {
    // Escalate to supervisor or human intervention
    this.emit('error-escalated', error);
    
    return {
      shouldRetry: false,
      alternativeAction: 'escalate-to-supervisor'
    };
  }

  private async handleDefaultStrategy(error: CommunicationError): Promise<{
    shouldRetry: boolean;
    delayMs?: number;
  }> {
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

  private findAlternativeAgent(failedAgent?: AgentType): AgentType | null {
    if (!failedAgent) return null;

    // Simple alternative mapping - in a real system, this would be more sophisticated
    const alternatives: Record<AgentType, AgentType[]> = {
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

  private getDefaultRetryPolicy(): RetryPolicy {
    return {
      maxRetries: this.config.maxRetries,
      delayMs: this.config.baseRetryDelayMs,
      backoffMultiplier: 2,
      jitterMaxMs: 1000
    };
  }

  private updateCircuitBreaker(agentType: AgentType, success: boolean): void {
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
    } else {
      breaker.failures++;
      breaker.lastFailure = new Date();
      
      if (breaker.failures >= 5) { // Threshold
        breaker.isOpen = true;
        this.emit('circuit-breaker-opened', { agentType });
      }
    }
  }

  private isCircuitOpen(agentType: AgentType): boolean {
    const breaker = this.circuitBreakers.get(agentType);
    if (!breaker) return false;

    // Auto-reset after 60 seconds
    if (breaker.isOpen && Date.now() - breaker.lastFailure.getTime() > 60000) {
      breaker.isOpen = false;
      breaker.failures = 0;
      this.emit('circuit-breaker-reset', { agentType });
    }

    return breaker.isOpen;
  }

  private initializeDefaultPolicies(): void {
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

  private initializeDefaultStrategies(): void {
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