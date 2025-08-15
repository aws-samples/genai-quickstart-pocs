/**
 * Supervisor Agent Implementation
 * 
 * The supervisor agent coordinates the overall workflow, interprets user requests,
 * breaks them down into subtasks, assigns tasks to specialized agents, resolves
 * conflicts, and synthesizes final responses.
 */

import {
    AgentType,
    AgentMessage,
    AgentTask,
    ConversationContext,
    AgentStatus,
    ConflictResolution,
    TaskDelegationResult,
    CoordinationPlan
} from '../../models/agent';
import { ClaudeSonnetService } from './claude-sonnet-service';
import { ModelSelectionServiceImpl } from './model-selection-service';

export class SupervisorAgent {
    private claudeSonnetService: ClaudeSonnetService;
    private modelSelectionService: ModelSelectionServiceImpl;
    private activeConversations: Map<string, ConversationContext> = new Map();
    private agentStatuses: Map<AgentType, AgentStatus> = new Map();
    private messageQueue: AgentMessage[] = [];
    private conflictResolutions: Map<string, ConflictResolution> = new Map();
    private testMode: boolean = false;

    constructor(
        claudeSonnetService: ClaudeSonnetService,
        modelSelectionService: ModelSelectionServiceImpl,
        testMode: boolean = false
    ) {
        this.claudeSonnetService = claudeSonnetService;
        this.modelSelectionService = modelSelectionService;
        this.testMode = testMode;
        this.initializeAgentStatuses();
    }

    /**
     * Initialize agent status tracking
     */
    private initializeAgentStatuses(): void {
        const agentTypes: AgentType[] = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];

        agentTypes.forEach(agentType => {
            this.agentStatuses.set(agentType, {
                agentType,
                status: 'idle',
                currentTasks: [],
                lastActivity: new Date(),
                capabilities: this.getAgentCapabilities(agentType)
            });
        });
    }

    /**
     * Get capabilities for each agent type
     */
    private getAgentCapabilities(agentType: AgentType): any {
        const capabilitiesMap = {
            supervisor: {
                supportedTasks: ['coordination', 'delegation', 'conflict-resolution', 'synthesis'],
                maxConcurrentTasks: 10,
                averageProcessingTime: 5000,
                reliability: 0.95,
                specializations: ['workflow-management', 'decision-making']
            },
            planning: {
                supportedTasks: ['task-planning', 'dependency-analysis', 'resource-estimation'],
                maxConcurrentTasks: 3,
                averageProcessingTime: 8000,
                reliability: 0.90,
                specializations: ['strategic-planning', 'task-sequencing']
            },
            research: {
                supportedTasks: ['web-search', 'data-extraction', 'information-gathering'],
                maxConcurrentTasks: 5,
                averageProcessingTime: 3000,
                reliability: 0.85,
                specializations: ['information-retrieval', 'data-processing']
            },
            analysis: {
                supportedTasks: ['financial-analysis', 'quantitative-analysis', 'pattern-recognition'],
                maxConcurrentTasks: 3,
                averageProcessingTime: 12000,
                reliability: 0.92,
                specializations: ['financial-modeling', 'statistical-analysis']
            },
            compliance: {
                supportedTasks: ['regulatory-check', 'risk-assessment', 'compliance-validation'],
                maxConcurrentTasks: 4,
                averageProcessingTime: 6000,
                reliability: 0.98,
                specializations: ['regulatory-compliance', 'risk-management']
            },
            synthesis: {
                supportedTasks: ['result-integration', 'narrative-generation', 'visualization'],
                maxConcurrentTasks: 2,
                averageProcessingTime: 10000,
                reliability: 0.88,
                specializations: ['content-synthesis', 'presentation']
            }
        };

        return capabilitiesMap[agentType];
    }

    /**
     * Process a user request and coordinate the multi-agent workflow
     */
    async processUserRequest(
        userId: string,
        requestType: string,
        parameters: Record<string, any>
    ): Promise<ConversationContext> {
        const conversationId = this.generateConversationId();

        // Create conversation context
        const context: ConversationContext = {
            id: conversationId,
            userId,
            requestType,
            parameters,
            messages: [],
            tasks: [],
            currentPhase: 'planning',
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {}
        };

        this.activeConversations.set(conversationId, context);

        try {
            // Interpret the user request
            const interpretation = await this.interpretUserRequest(requestType, parameters);

            // Create coordination plan
            const plan = await this.createCoordinationPlan(conversationId, interpretation);

            // Execute the plan
            await this.executePlan(conversationId, plan);

            return this.activeConversations.get(conversationId)!;
        } catch (error) {
            console.error('Error processing user request:', error);
            context.currentPhase = 'completed';
            context.metadata.error = error instanceof Error ? error.message : 'Unknown error';
            return context;
        }
    }

    /**
     * Interpret user request using Claude Sonnet
     */
    private async interpretUserRequest(
        requestType: string,
        parameters: Record<string, any>
    ): Promise<any> {
        const prompt = `
    As a supervisor agent for an investment AI system, interpret the following user request:
    
    Request Type: ${requestType}
    Parameters: ${JSON.stringify(parameters, null, 2)}
    
    Please provide:
    1. A clear understanding of what the user wants
    2. The key objectives to achieve
    3. The type of analysis required
    4. Any constraints or preferences to consider
    5. Expected deliverables
    
    Format your response as a structured JSON object.
    `;

        const response = await this.claudeSonnetService.complete({
            prompt,
            maxTokens: 1000,
            temperature: 0.3
        });

        const responseText = response.completion;

        try {
            return JSON.parse(responseText);
        } catch (error) {
            // Fallback to structured interpretation
            return {
                understanding: `User requested ${requestType}`,
                objectives: ['Generate investment insights'],
                analysisType: 'comprehensive',
                constraints: parameters,
                deliverables: ['Investment recommendations', 'Supporting analysis']
            };
        }
    }

    /**
     * Create a coordination plan for the request
     */
    private async createCoordinationPlan(
        conversationId: string,
        interpretation: any
    ): Promise<CoordinationPlan> {
        const planPrompt = `
    Create a detailed coordination plan for the following investment analysis request:
    
    ${JSON.stringify(interpretation, null, 2)}
    
    Break down the work into phases with specific tasks for each agent type:
    - planning: Strategic planning and task sequencing
    - research: Information gathering and data collection
    - analysis: Financial analysis and quantitative evaluation
    - compliance: Regulatory checks and risk assessment
    - synthesis: Result integration and presentation
    
    For each phase, specify:
    1. Tasks to be completed
    2. Dependencies between tasks
    3. Estimated duration in seconds
    
    Return a structured plan as JSON.
    `;

        const planResponse = await this.claudeSonnetService.complete({
            prompt: planPrompt,
            maxTokens: 1500,
            temperature: 0.2
        });

        const planResponseText = planResponse.completion;

        try {
            const planData = JSON.parse(planResponseText);

            const plan: CoordinationPlan = {
                id: this.generateTaskId(),
                conversationId,
                phases: planData.phases || [],
                totalEstimatedDuration: planData.totalEstimatedDuration || 60000,
                createdAt: new Date(),
                status: 'draft'
            };

            return plan;
        } catch (error) {
            // Fallback plan
            return {
                id: this.generateTaskId(),
                conversationId,
                phases: [
                    {
                        name: 'planning',
                        tasks: ['create-research-plan'],
                        dependencies: [],
                        estimatedDuration: 10000
                    },
                    {
                        name: 'research',
                        tasks: ['gather-market-data', 'collect-research'],
                        dependencies: ['create-research-plan'],
                        estimatedDuration: 20000
                    },
                    {
                        name: 'analysis',
                        tasks: ['analyze-data', 'generate-insights'],
                        dependencies: ['gather-market-data', 'collect-research'],
                        estimatedDuration: 15000
                    },
                    {
                        name: 'compliance',
                        tasks: ['check-compliance', 'assess-risks'],
                        dependencies: ['analyze-data'],
                        estimatedDuration: 10000
                    },
                    {
                        name: 'synthesis',
                        tasks: ['synthesize-results', 'create-presentation'],
                        dependencies: ['generate-insights', 'check-compliance'],
                        estimatedDuration: 15000
                    }
                ],
                totalEstimatedDuration: 70000,
                createdAt: new Date(),
                status: 'draft'
            };
        }
    }

    /**
     * Execute the coordination plan
     */
    private async executePlan(conversationId: string, plan: CoordinationPlan): Promise<void> {
        const context = this.activeConversations.get(conversationId);
        if (!context) {
            throw new Error('Conversation context not found');
        }

        plan.status = 'active';

        for (const phase of plan.phases) {
            context.currentPhase = phase.name as any;
            context.updatedAt = new Date();

            // Create tasks for this phase
            const tasks = await this.createTasksForPhase(conversationId, phase);

            // Delegate tasks to appropriate agents
            const delegationResults = await Promise.all(
                tasks.map(task => this.delegateTask(task))
            );

            // Wait for task completion
            await this.waitForTaskCompletion(tasks.map(t => t.id));

            // Check for conflicts and resolve them
            await this.checkAndResolveConflicts(conversationId);
        }

        context.currentPhase = 'completed';
        context.updatedAt = new Date();
        plan.status = 'completed';
    }

    /**
     * Create tasks for a specific phase
     */
    private async createTasksForPhase(
        conversationId: string,
        phase: any
    ): Promise<AgentTask[]> {
        const context = this.activeConversations.get(conversationId);
        if (!context) {
            throw new Error('Conversation context not found');
        }

        const tasks: AgentTask[] = [];

        for (const taskDescription of phase.tasks) {
            const task: AgentTask = {
                id: this.generateTaskId(),
                type: this.mapTaskToType(taskDescription),
                complexity: 'medium',
                domain: 'financial',
                priority: 'medium',
                agentRole: this.mapTaskToAgent(taskDescription),
                description: taskDescription,
                parameters: context.parameters,
                dependencies: phase.dependencies || [],
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            tasks.push(task);
            context.tasks.push(task);
        }

        return tasks;
    }

    /**
     * Map task description to task type
     */
    private mapTaskToType(taskDescription: string): AgentTask['type'] {
        if (taskDescription.includes('analyze') || taskDescription.includes('analysis')) {
            return 'time-series-analysis';
        }
        if (taskDescription.includes('research') || taskDescription.includes('gather')) {
            return 'entity-extraction';
        }
        if (taskDescription.includes('compliance') || taskDescription.includes('check')) {
            return 'classification';
        }
        if (taskDescription.includes('sentiment')) {
            return 'sentiment-analysis';
        }
        return 'text-generation';
    }

    /**
     * Map task description to appropriate agent
     */
    private mapTaskToAgent(taskDescription: string): AgentType {
        if (taskDescription.includes('plan')) return 'planning';
        if (taskDescription.includes('research') || taskDescription.includes('gather') || taskDescription.includes('collect')) return 'research';
        if (taskDescription.includes('analyze') || taskDescription.includes('analysis')) return 'analysis';
        if (taskDescription.includes('compliance') || taskDescription.includes('risk')) return 'compliance';
        if (taskDescription.includes('synthesize') || taskDescription.includes('present')) return 'synthesis';
        return 'supervisor';
    }

    /**
     * Delegate a task to the appropriate agent
     */
    async delegateTask(task: AgentTask): Promise<TaskDelegationResult> {
        try {
            // Update agent status
            const agentStatus = this.agentStatuses.get(task.agentRole);
            if (!agentStatus) {
                throw new Error(`Agent ${task.agentRole} not found`);
            }

            // Check if agent is available
            if (agentStatus.status === 'busy' &&
                agentStatus.currentTasks.length >= agentStatus.capabilities.maxConcurrentTasks) {
                throw new Error(`Agent ${task.agentRole} is at capacity`);
            }

            // Assign task
            task.status = 'assigned';
            task.assignedTo = task.agentRole;
            task.updatedAt = new Date();

            // Update agent status
            agentStatus.status = 'busy';
            agentStatus.currentTasks.push(task.id);
            agentStatus.lastActivity = new Date();

            // Create delegation message
            const message: AgentMessage = {
                sender: 'supervisor',
                recipient: task.agentRole,
                messageType: 'request',
                content: {
                    task,
                    instructions: `Please complete the following task: ${task.description}`
                },
                metadata: {
                    priority: task.priority,
                    timestamp: new Date(),
                    conversationId: task.id, // Using task ID as conversation reference
                    requestId: task.id
                }
            };

            this.messageQueue.push(message);

            // Simulate task processing (in real implementation, this would be handled by actual agents)
            const processingTime = this.testMode ? 10 : agentStatus.capabilities.averageProcessingTime;
            setTimeout(() => {
                this.simulateTaskCompletion(task);
            }, processingTime);

            const estimatedCompletion = new Date();
            estimatedCompletion.setMilliseconds(
                estimatedCompletion.getMilliseconds() + agentStatus.capabilities.averageProcessingTime
            );

            return {
                success: true,
                taskId: task.id,
                assignedTo: task.agentRole,
                estimatedCompletion
            };
        } catch (error) {
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';

            return {
                success: false,
                taskId: task.id,
                assignedTo: task.agentRole,
                estimatedCompletion: new Date(),
                error: task.error
            };
        }
    }

    /**
     * Simulate task completion (placeholder for actual agent implementation)
     */
    private simulateTaskCompletion(task: AgentTask): void {
        task.status = 'completed';
        task.updatedAt = new Date();
        task.result = {
            summary: `Completed ${task.description}`,
            data: {},
            confidence: 0.85,
            timestamp: new Date()
        };

        // Update agent status
        const agentStatus = this.agentStatuses.get(task.agentRole!);
        if (agentStatus) {
            agentStatus.currentTasks = agentStatus.currentTasks.filter(id => id !== task.id);
            if (agentStatus.currentTasks.length === 0) {
                agentStatus.status = 'idle';
            }
            agentStatus.lastActivity = new Date();
        }
    }

    /**
     * Wait for task completion
     */
    private async waitForTaskCompletion(taskIds: string[]): Promise<void> {
        return new Promise((resolve) => {
            const checkCompletion = () => {
                const allCompleted = taskIds.every(taskId => {
                    // Find task in all conversations
                    for (const context of this.activeConversations.values()) {
                        const task = context.tasks.find(t => t.id === taskId);
                        if (task && (task.status === 'completed' || task.status === 'failed')) {
                            return true;
                        }
                    }
                    return false;
                });

                if (allCompleted) {
                    resolve();
                } else {
                    setTimeout(checkCompletion, 1000);
                }
            };

            checkCompletion();
        });
    }

    /**
     * Check for conflicts and resolve them
     */
    private async checkAndResolveConflicts(conversationId: string): Promise<void> {
        const context = this.activeConversations.get(conversationId);
        if (!context) return;

        // Check for data inconsistencies
        const completedTasks = context.tasks.filter(t => t.status === 'completed');
        const conflicts = this.detectConflicts(completedTasks);

        for (const conflict of conflicts) {
            await this.resolveConflict(conflict);
        }
    }

    /**
     * Detect conflicts between task results
     */
    private detectConflicts(tasks: AgentTask[]): ConflictResolution[] {
        const conflicts: ConflictResolution[] = [];

        // Simple conflict detection - in real implementation, this would be more sophisticated
        const analysisResults = tasks.filter(t => t.agentRole === 'analysis');
        const complianceResults = tasks.filter(t => t.agentRole === 'compliance');

        if (analysisResults.length > 1) {
            // Check for conflicting recommendations
            const recommendations = analysisResults.map(t => t.result?.recommendation);
            const uniqueRecommendations = new Set(recommendations);

            if (uniqueRecommendations.size > 1) {
                conflicts.push({
                    conflictId: this.generateConversationId(),
                    conflictType: 'recommendation-conflict',
                    involvedAgents: ['analysis'],
                    description: 'Multiple analysis agents provided conflicting recommendations',
                    resolutionStrategy: 'majority-vote'
                });
            }
        }

        return conflicts;
    }

    /**
     * Resolve a specific conflict
     */
    private async resolveConflict(conflict: ConflictResolution): Promise<void> {
        const resolutionPrompt = `
    Resolve the following conflict in investment analysis:
    
    Conflict Type: ${conflict.conflictType}
    Description: ${conflict.description}
    Involved Agents: ${conflict.involvedAgents.join(', ')}
    
    Please provide a resolution strategy and final recommendation.
    `;

        try {
            const resolutionResponse = await this.claudeSonnetService.complete({
                prompt: resolutionPrompt,
                maxTokens: 800,
                temperature: 0.2
            });

            const resolution = resolutionResponse.completion;

            conflict.resolution = resolution;
            conflict.resolvedAt = new Date();
            conflict.resolvedBy = 'supervisor';

            this.conflictResolutions.set(conflict.conflictId, conflict);
        } catch (error) {
            console.error('Error resolving conflict:', error);
            conflict.resolution = 'Unable to resolve automatically - requires human intervention';
            conflict.resolvedAt = new Date();
            conflict.resolvedBy = 'supervisor';
        }
    }

    /**
     * Get conversation context
     */
    getConversationContext(conversationId: string): ConversationContext | undefined {
        return this.activeConversations.get(conversationId);
    }

    /**
     * Get agent status
     */
    getAgentStatus(agentType: AgentType): AgentStatus | undefined {
        return this.agentStatuses.get(agentType);
    }

    /**
     * Get all active conversations
     */
    getActiveConversations(): ConversationContext[] {
        return Array.from(this.activeConversations.values());
    }

    /**
     * Send message to agent
     */
    sendMessage(message: AgentMessage): void {
        this.messageQueue.push(message);
        // In real implementation, this would route to actual agent services
    }

    /**
     * Get message queue
     */
    getMessageQueue(): AgentMessage[] {
        return [...this.messageQueue];
    }

    /**
     * Clear message queue
     */
    clearMessageQueue(): void {
        this.messageQueue = [];
    }

    /**
     * Generate unique conversation ID
     */
    private generateConversationId(): string {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique task ID
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clean up completed conversations
     */
    cleanupCompletedConversations(olderThanHours: number = 24): void {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

        for (const [id, context] of this.activeConversations.entries()) {
            if (context.currentPhase === 'completed' && context.updatedAt < cutoffTime) {
                this.activeConversations.delete(id);
            }
        }
    }
}