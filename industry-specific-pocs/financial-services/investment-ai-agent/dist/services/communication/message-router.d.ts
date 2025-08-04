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
export declare class MessageRouter {
    private messageBus;
    private config;
    private routingRules;
    private agentStatuses;
    private circuitBreakers;
    private roundRobinCounters;
    constructor(messageBus: MessageBus, config?: Partial<RoutingConfig>);
    /**
     * Route a message using configured rules and strategies
     */
    routeMessage(message: AgentMessage): Promise<MessageDeliveryResult>;
    /**
     * Add a custom routing rule
     */
    addRoutingRule(rule: RoutingRule): void;
    /**
     * Remove a routing rule
     */
    removeRoutingRule(ruleId: string): boolean;
    /**
     * Update agent status for load balancing
     */
    updateAgentStatus(status: AgentStatus): void;
    /**
     * Get routing statistics
     */
    getRoutingStats(): {
        totalRules: number;
        circuitBreakerStates: Record<string, boolean>;
        agentStatuses: Record<string, string>;
    };
    private applyRoutingRules;
    private applyLoadBalancing;
    private selectTargetByStrategy;
    private selectRoundRobin;
    private selectLeastBusy;
    private selectByPriority;
    private isCircuitOpen;
    private updateCircuitBreaker;
    private getRoutingHops;
    private generateMessageId;
    private initializeDefaultRules;
}
