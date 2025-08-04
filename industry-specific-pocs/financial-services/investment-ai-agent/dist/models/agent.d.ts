/**
 * Agent-related models and interfaces
 */
export type AgentType = 'supervisor' | 'planning' | 'research' | 'analysis' | 'compliance' | 'synthesis';
export interface AgentMessage {
    sender: AgentType;
    recipient: AgentType | 'broadcast';
    messageType: 'request' | 'response' | 'update' | 'error' | 'alert' | 'test';
    content: any;
    metadata: {
        priority: 'low' | 'medium' | 'high';
        timestamp: Date;
        conversationId: string;
        requestId: string;
        routingTargets?: AgentType[];
        loadBalanced?: boolean;
        availableTargets?: number;
        isDuplicate?: boolean;
        originalRecipient?: AgentType | 'broadcast';
        routingHops?: number;
    };
}
export interface AgentTask {
    id: string;
    type: 'text-generation' | 'classification' | 'time-series-analysis' | 'sentiment-analysis' | 'entity-extraction';
    complexity: 'simple' | 'medium' | 'complex';
    domain: 'general' | 'financial' | 'regulatory' | 'market';
    priority: 'low' | 'medium' | 'high';
    agentRole: AgentType;
    description: string;
    parameters: Record<string, any>;
    dependencies: string[];
    status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
    assignedTo?: AgentType;
    createdAt: Date;
    updatedAt: Date;
    result?: any;
    error?: string;
}
export interface ConversationContext {
    id: string;
    userId: string;
    requestType: string;
    parameters: Record<string, any>;
    messages: AgentMessage[];
    tasks: AgentTask[];
    currentPhase: 'planning' | 'research' | 'analysis' | 'compliance' | 'synthesis' | 'completed';
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
}
export interface AgentCapabilities {
    supportedTasks: string[];
    maxConcurrentTasks: number;
    averageProcessingTime: number;
    reliability: number;
    specializations: string[];
}
export interface AgentStatus {
    agentType: AgentType;
    status: 'idle' | 'busy' | 'error' | 'offline';
    currentTasks: string[];
    lastActivity: Date;
    capabilities: AgentCapabilities;
}
export interface ConflictResolution {
    conflictId: string;
    conflictType: 'data-inconsistency' | 'recommendation-conflict' | 'priority-conflict' | 'resource-conflict';
    involvedAgents: AgentType[];
    description: string;
    resolutionStrategy: 'majority-vote' | 'priority-based' | 'expert-override' | 'human-intervention';
    resolution?: any;
    resolvedAt?: Date;
    resolvedBy?: AgentType | 'human';
}
export interface TaskDelegationResult {
    success: boolean;
    taskId: string;
    assignedTo: AgentType;
    estimatedCompletion: Date;
    error?: string;
}
export interface CoordinationPlan {
    id: string;
    conversationId: string;
    phases: {
        name: string;
        tasks: string[];
        dependencies: string[];
        estimatedDuration: number;
    }[];
    totalEstimatedDuration: number;
    createdAt: Date;
    status: 'draft' | 'active' | 'completed' | 'failed';
}
