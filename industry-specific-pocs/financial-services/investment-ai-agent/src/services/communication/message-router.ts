/**
 * Message Router Service
 * 
 * Handles intelligent message routing, load balancing, and delivery strategies
 * for the agent communication system.
 */

import { AgentMessage, AgentType, AgentStatus } from '../../models/agent';
import { MessageBus, MessageDeliveryResult } from './message-bus';

export interface RoutingRule {
  id: string;
  condition: (message: AgentMessage) => boolean;
  action: 'route' | 'transform' | 'filter' | 'duplicate';
  target?: AgentType | AgentType[];
  transformer?: (message: AgentMessage) => AgentMessage;
  priority: number;
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'least-busy' | 'random' | 'priority-based';
  weights?: Record<AgentType, number>;
}

export interface RoutingConfig {
  enableLoadBalancing: boolean;
  loadBalancingStrategy: LoadBalancingStrategy;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  enableMessageTransformation: boolean;
  maxRoutingHops: number;
}

export class MessageRouter {
  private messageBus: MessageBus;
  private config: RoutingConfig;
  private routingRules: RoutingRule[] = [];
  private agentStatuses: Map<AgentType, AgentStatus> = new Map();
  private circuitBreakers: Map<AgentType, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();
  private roundRobinCounters: Map<string, number> = new Map();

  constructor(messageBus: MessageBus, config: Partial<RoutingConfig> = {}) {
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
  async routeMessage(message: AgentMessage): Promise<MessageDeliveryResult> {
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
      if (this.config.enableCircuitBreaker && this.isCircuitOpen(finalMessage.recipient as AgentType)) {
        throw new Error(`Circuit breaker is open for agent: ${finalMessage.recipient}`);
      }

      // Route the message
      const result = await this.messageBus.sendMessage(finalMessage);

      // Update circuit breaker state
      this.updateCircuitBreaker(finalMessage.recipient as AgentType, result.success);

      return result;

    } catch (error) {
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
  addRoutingRule(rule: RoutingRule): void {
    // Insert rule in priority order
    const insertIndex = this.routingRules.findIndex(r => r.priority < rule.priority);
    if (insertIndex === -1) {
      this.routingRules.push(rule);
    } else {
      this.routingRules.splice(insertIndex, 0, rule);
    }
  }

  /**
   * Remove a routing rule
   */
  removeRoutingRule(ruleId: string): boolean {
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
  updateAgentStatus(status: AgentStatus): void {
    this.agentStatuses.set(status.agentType, status);
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalRules: number;
    circuitBreakerStates: Record<string, boolean>;
    agentStatuses: Record<string, string>;
  } {
    const circuitBreakerStates: Record<string, boolean> = {};
    for (const [agent, breaker] of this.circuitBreakers.entries()) {
      circuitBreakerStates[agent] = breaker.isOpen;
    }

    const agentStatuses: Record<string, string> = {};
    for (const [agent, status] of this.agentStatuses.entries()) {
      agentStatuses[agent] = status.status;
    }

    return {
      totalRules: this.routingRules.length,
      circuitBreakerStates,
      agentStatuses
    };
  }

  private async applyRoutingRules(message: AgentMessage): Promise<AgentMessage | null> {
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
              } else {
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

  private async applyLoadBalancing(message: AgentMessage): Promise<AgentMessage> {
    const routingTargets = message.metadata.routingTargets as AgentType[] | undefined;
    
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

  private selectTargetByStrategy(targets: AgentType[], message: AgentMessage): AgentType {
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

  private selectRoundRobin(targets: AgentType[], message: AgentMessage): AgentType {
    const key = `${message.messageType}-${targets.join(',')}`;
    const counter = this.roundRobinCounters.get(key) || 0;
    const selectedIndex = counter % targets.length;
    this.roundRobinCounters.set(key, counter + 1);
    return targets[selectedIndex];
  }

  private selectLeastBusy(targets: AgentType[]): AgentType {
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

  private selectByPriority(targets: AgentType[], message: AgentMessage): AgentType {
    const weights = this.config.loadBalancingStrategy.weights || {} as Record<AgentType, number>;
    const messagePriority = message.metadata.priority;

    // Sort targets by weight and message priority compatibility
    const sortedTargets = targets.sort((a, b) => {
      const weightA = weights[a] || 1;
      const weightB = weights[b] || 1;
      
      // Higher weight agents get priority for high priority messages
      if (messagePriority === 'high') {
        return weightB - weightA;
      } else {
        return weightA - weightB;
      }
    });

    return sortedTargets[0];
  }

  private isCircuitOpen(agentType: AgentType): boolean {
    const breaker = this.circuitBreakers.get(agentType);
    if (!breaker) return false;

    // Check if circuit should be reset (after 60 seconds)
    if (breaker.isOpen && Date.now() - breaker.lastFailure.getTime() > 60000) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }

    return breaker.isOpen;
  }

  private updateCircuitBreaker(agentType: AgentType, success: boolean): void {
    let breaker = this.circuitBreakers.get(agentType);
    if (!breaker) {
      breaker = { failures: 0, lastFailure: new Date(), isOpen: false };
      this.circuitBreakers.set(agentType, breaker);
    }

    if (success) {
      breaker.failures = Math.max(0, breaker.failures - 1);
    } else {
      breaker.failures++;
      breaker.lastFailure = new Date();
      
      if (breaker.failures >= this.config.circuitBreakerThreshold) {
        breaker.isOpen = true;
      }
    }
  }

  private getRoutingHops(message: AgentMessage): number {
    return (message.metadata as any).routingHops || 0;
  }

  private generateMessageId(message: AgentMessage): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${message.sender}-${message.recipient}-${timestamp}-${random}`;
  }

  private initializeDefaultRules(): void {
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
      condition: (msg) => 
        msg.content && 
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
      target: ['analysis'], // Will be expanded by load balancer if multiple analysis agents exist
      priority: 70
    });
  }
}