/**
 * Supervisor Agent Implementation
 *
 * The supervisor agent coordinates the overall workflow, interprets user requests,
 * breaks them down into subtasks, assigns tasks to specialized agents, resolves
 * conflicts, and synthesizes final responses.
 */
import { AgentType, AgentMessage, AgentTask, ConversationContext, AgentStatus, TaskDelegationResult } from '../../models/agent';
import { ClaudeSonnetService } from './claude-sonnet-service';
import { ModelSelectionServiceImpl } from './model-selection-service';
export declare class SupervisorAgent {
    private claudeSonnetService;
    private modelSelectionService;
    private activeConversations;
    private agentStatuses;
    private messageQueue;
    private conflictResolutions;
    private testMode;
    constructor(claudeSonnetService: ClaudeSonnetService, modelSelectionService: ModelSelectionServiceImpl, testMode?: boolean);
    /**
     * Initialize agent status tracking
     */
    private initializeAgentStatuses;
    /**
     * Get capabilities for each agent type
     */
    private getAgentCapabilities;
    /**
     * Process a user request and coordinate the multi-agent workflow
     */
    processUserRequest(userId: string, requestType: string, parameters: Record<string, any>): Promise<ConversationContext>;
    /**
     * Interpret user request using Claude Sonnet
     */
    private interpretUserRequest;
    /**
     * Create a coordination plan for the request
     */
    private createCoordinationPlan;
    /**
     * Execute the coordination plan
     */
    private executePlan;
    /**
     * Create tasks for a specific phase
     */
    private createTasksForPhase;
    /**
     * Map task description to task type
     */
    private mapTaskToType;
    /**
     * Map task description to appropriate agent
     */
    private mapTaskToAgent;
    /**
     * Delegate a task to the appropriate agent
     */
    delegateTask(task: AgentTask): Promise<TaskDelegationResult>;
    /**
     * Simulate task completion (placeholder for actual agent implementation)
     */
    private simulateTaskCompletion;
    /**
     * Wait for task completion
     */
    private waitForTaskCompletion;
    /**
     * Check for conflicts and resolve them
     */
    private checkAndResolveConflicts;
    /**
     * Detect conflicts between task results
     */
    private detectConflicts;
    /**
     * Resolve a specific conflict
     */
    private resolveConflict;
    /**
     * Get conversation context
     */
    getConversationContext(conversationId: string): ConversationContext | undefined;
    /**
     * Get agent status
     */
    getAgentStatus(agentType: AgentType): AgentStatus | undefined;
    /**
     * Get all active conversations
     */
    getActiveConversations(): ConversationContext[];
    /**
     * Send message to agent
     */
    sendMessage(message: AgentMessage): void;
    /**
     * Get message queue
     */
    getMessageQueue(): AgentMessage[];
    /**
     * Clear message queue
     */
    clearMessageQueue(): void;
    /**
     * Generate unique conversation ID
     */
    private generateConversationId;
    /**
     * Generate unique task ID
     */
    private generateTaskId;
    /**
     * Clean up completed conversations
     */
    cleanupCompletedConversations(olderThanHours?: number): void;
}
