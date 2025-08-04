"use strict";
/**
 * Supervisor Agent Implementation
 *
 * The supervisor agent coordinates the overall workflow, interprets user requests,
 * breaks them down into subtasks, assigns tasks to specialized agents, resolves
 * conflicts, and synthesizes final responses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorAgent = void 0;
class SupervisorAgent {
    constructor(claudeSonnetService, modelSelectionService, testMode = false) {
        this.activeConversations = new Map();
        this.agentStatuses = new Map();
        this.messageQueue = [];
        this.conflictResolutions = new Map();
        this.testMode = false;
        this.claudeSonnetService = claudeSonnetService;
        this.modelSelectionService = modelSelectionService;
        this.testMode = testMode;
        this.initializeAgentStatuses();
    }
    /**
     * Initialize agent status tracking
     */
    initializeAgentStatuses() {
        const agentTypes = ['supervisor', 'planning', 'research', 'analysis', 'compliance', 'synthesis'];
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
    getAgentCapabilities(agentType) {
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
    async processUserRequest(userId, requestType, parameters) {
        const conversationId = this.generateConversationId();
        // Create conversation context
        const context = {
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
            return this.activeConversations.get(conversationId);
        }
        catch (error) {
            console.error('Error processing user request:', error);
            context.currentPhase = 'completed';
            context.metadata.error = error instanceof Error ? error.message : 'Unknown error';
            return context;
        }
    }
    /**
     * Interpret user request using Claude Sonnet
     */
    async interpretUserRequest(requestType, parameters) {
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
        }
        catch (error) {
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
    async createCoordinationPlan(conversationId, interpretation) {
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
            const plan = {
                id: this.generateTaskId(),
                conversationId,
                phases: planData.phases || [],
                totalEstimatedDuration: planData.totalEstimatedDuration || 60000,
                createdAt: new Date(),
                status: 'draft'
            };
            return plan;
        }
        catch (error) {
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
    async executePlan(conversationId, plan) {
        const context = this.activeConversations.get(conversationId);
        if (!context) {
            throw new Error('Conversation context not found');
        }
        plan.status = 'active';
        for (const phase of plan.phases) {
            context.currentPhase = phase.name;
            context.updatedAt = new Date();
            // Create tasks for this phase
            const tasks = await this.createTasksForPhase(conversationId, phase);
            // Delegate tasks to appropriate agents
            const delegationResults = await Promise.all(tasks.map(task => this.delegateTask(task)));
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
    async createTasksForPhase(conversationId, phase) {
        const context = this.activeConversations.get(conversationId);
        if (!context) {
            throw new Error('Conversation context not found');
        }
        const tasks = [];
        for (const taskDescription of phase.tasks) {
            const task = {
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
    mapTaskToType(taskDescription) {
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
    mapTaskToAgent(taskDescription) {
        if (taskDescription.includes('plan'))
            return 'planning';
        if (taskDescription.includes('research') || taskDescription.includes('gather') || taskDescription.includes('collect'))
            return 'research';
        if (taskDescription.includes('analyze') || taskDescription.includes('analysis'))
            return 'analysis';
        if (taskDescription.includes('compliance') || taskDescription.includes('risk'))
            return 'compliance';
        if (taskDescription.includes('synthesize') || taskDescription.includes('present'))
            return 'synthesis';
        return 'supervisor';
    }
    /**
     * Delegate a task to the appropriate agent
     */
    async delegateTask(task) {
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
            const message = {
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
                    conversationId: task.id,
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
            estimatedCompletion.setMilliseconds(estimatedCompletion.getMilliseconds() + agentStatus.capabilities.averageProcessingTime);
            return {
                success: true,
                taskId: task.id,
                assignedTo: task.agentRole,
                estimatedCompletion
            };
        }
        catch (error) {
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
    simulateTaskCompletion(task) {
        task.status = 'completed';
        task.updatedAt = new Date();
        task.result = {
            summary: `Completed ${task.description}`,
            data: {},
            confidence: 0.85,
            timestamp: new Date()
        };
        // Update agent status
        const agentStatus = this.agentStatuses.get(task.agentRole);
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
    async waitForTaskCompletion(taskIds) {
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
                }
                else {
                    setTimeout(checkCompletion, 1000);
                }
            };
            checkCompletion();
        });
    }
    /**
     * Check for conflicts and resolve them
     */
    async checkAndResolveConflicts(conversationId) {
        const context = this.activeConversations.get(conversationId);
        if (!context)
            return;
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
    detectConflicts(tasks) {
        const conflicts = [];
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
    async resolveConflict(conflict) {
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
        }
        catch (error) {
            console.error('Error resolving conflict:', error);
            conflict.resolution = 'Unable to resolve automatically - requires human intervention';
            conflict.resolvedAt = new Date();
            conflict.resolvedBy = 'supervisor';
        }
    }
    /**
     * Get conversation context
     */
    getConversationContext(conversationId) {
        return this.activeConversations.get(conversationId);
    }
    /**
     * Get agent status
     */
    getAgentStatus(agentType) {
        return this.agentStatuses.get(agentType);
    }
    /**
     * Get all active conversations
     */
    getActiveConversations() {
        return Array.from(this.activeConversations.values());
    }
    /**
     * Send message to agent
     */
    sendMessage(message) {
        this.messageQueue.push(message);
        // In real implementation, this would route to actual agent services
    }
    /**
     * Get message queue
     */
    getMessageQueue() {
        return [...this.messageQueue];
    }
    /**
     * Clear message queue
     */
    clearMessageQueue() {
        this.messageQueue = [];
    }
    /**
     * Generate unique conversation ID
     */
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique task ID
     */
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Clean up completed conversations
     */
    cleanupCompletedConversations(olderThanHours = 24) {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);
        for (const [id, context] of this.activeConversations.entries()) {
            if (context.currentPhase === 'completed' && context.updatedAt < cutoffTime) {
                this.activeConversations.delete(id);
            }
        }
    }
}
exports.SupervisorAgent = SupervisorAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VwZXJ2aXNvci1hZ2VudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9haS9zdXBlcnZpc29yLWFnZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0dBTUc7OztBQWVILE1BQWEsZUFBZTtJQVN4QixZQUNJLG1CQUF3QyxFQUN4QyxxQkFBZ0QsRUFDaEQsV0FBb0IsS0FBSztRQVRyQix3QkFBbUIsR0FBcUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNsRSxrQkFBYSxHQUFnQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3ZELGlCQUFZLEdBQW1CLEVBQUUsQ0FBQztRQUNsQyx3QkFBbUIsR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNqRSxhQUFRLEdBQVksS0FBSyxDQUFDO1FBTzlCLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxJQUFJLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7UUFDbkQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVEOztPQUVHO0lBQ0ssdUJBQXVCO1FBQzNCLE1BQU0sVUFBVSxHQUFnQixDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFOUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUMzQixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUU7Z0JBQzlCLFNBQVM7Z0JBQ1QsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLFlBQVksRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDeEIsWUFBWSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUM7YUFDckQsQ0FBQyxD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TyxFQUFFLEVBQUU7WUFDNUQsSUFBSSxPQUFPLENBQUMsWUFBWSxLQUFLLFdBQVcsSUFBSSxPQUFPLENBQUMsU0FBUyxHQUFHLFVBQVUsRUFBRTtnQkFDeEUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUN2QztTQUNKO0lBQ0wsQ0FBQztDQUNKO0FBOW9CRCwwQ0E4b0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTdXBlcnZpc29yIEFnZW50IEltcGxlbWVudGF0aW9uXG4gKiBcbiAqIFRoZSBzdXBlcnZpc29yIGFnZW50IGNvb3JkaW5hdGVzIHRoZSBvdmVyYWxsIHdvcmtmbG93LCBpbnRlcnByZXRzIHVzZXIgcmVxdWVzdHMsXG4gKiBicmVha3MgdGhlbSBkb3duIGludG8gc3VidGFza3MsIGFzc2lnbnMgdGFza3MgdG8gc3BlY2lhbGl6ZWQgYWdlbnRzLCByZXNvbHZlc1xuICogY29uZmxpY3RzLCBhbmQgc3ludGhlc2l6ZXMgZmluYWwgcmVzcG9uc2VzLlxuICovXG5cbmltcG9ydCB7XG4gICAgQWdlbnRUeXBlLFxuICAgIEFnZW50TWVzc2FnZSxcbiAgICBBZ2VudFRhc2ssXG4gICAgQ29udmVyc2F0aW9uQ29udGV4dCxcbiAgICBBZ2VudFN0YXR1cyxcbiAgICBDb25mbGljdFJlc29sdXRpb24sXG4gICAgVGFza0RlbGVnYXRpb25SZXN1bHQsXG4gICAgQ29vcmRpbmF0aW9uUGxhblxufSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlU29ubmV0U2VydmljZSB9IGZyb20gJy4vY2xhdWRlLXNvbm5ldC1zZXJ2aWNlJztcbmltcG9ydCB7IE1vZGVsU2VsZWN0aW9uU2VydmljZUltcGwgfSBmcm9tICcuL21vZGVsLXNlbGVjdGlvbi1zZXJ2aWNlJztcblxuZXhwb3J0IGNsYXNzIFN1cGVydmlzb3JBZ2VudCB7XG4gICAgcHJpdmF0ZSBjbGF1ZGVTb25uZXRTZXJ2aWNlOiBDbGF1ZGVTb25uZXRTZXJ2aWNlO1xuICAgIHByaXZhdGUgbW9kZWxTZWxlY3Rpb25TZXJ2aWNlOiBNb2RlbFNlbGVjdGlvblNlcnZpY2VJbXBsO1xuICAgIHByaXZhdGUgYWN0aXZlQ29udmVyc2F0aW9uczogTWFwPHN0cmluZywgQ29udmVyc2F0aW9uQ29udGV4dD4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSBhZ2VudFN0YXR1c2VzOiBNYXA8QWdlbnRUeXBlLCBBZ2VudFN0YXR1cz4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSBtZXNzYWdlUXVldWU6IEFnZW50TWVzc2FnZVtdID0gW107XG4gICAgcHJpdmF0ZSBjb25mbGljdFJlc29sdXRpb25zOiBNYXA8c3RyaW5nLCBDb25mbGljdFJlc29sdXRpb24+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgdGVzdE1vZGU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjbGF1ZGVTb25uZXRTZXJ2aWNlOiBDbGF1ZGVTb25uZXRTZXJ2aWNlLFxuICAgICAgICBtb2RlbFNlbGVjdGlvblNlcnZpY2U6IE1vZGVsU2VsZWN0aW9uU2VydmljZUltcGwsXG4gICAgICAgIHRlc3RNb2RlOiBib29sZWFuID0gZmFsc2VcbiAgICApIHtcbiAgICAgICAgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlID0gY2xhdWRlU29ubmV0U2VydmljZTtcbiAgICAgICAgdGhpcy5tb2RlbFNlbGVjdGlvblNlcnZpY2UgPSBtb2RlbFNlbGVjdGlvblNlcnZpY2U7XG4gICAgICAgIHRoaXMudGVzdE1vZGUgPSB0ZXN0TW9kZTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplQWdlbnRTdGF0dXNlcygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYWdlbnQgc3RhdHVzIHRyYWNraW5nXG4gICAgICovXG4gICAgcHJpdmF0ZSBpbml0aWFsaXplQWdlbnRTdGF0dXNlcygpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYWdlbnRUeXBlczogQWdlbnRUeXBlW10gPSBbJ3N1cGVydmlzb3InLCAncGxhbm5pbmcnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnLCAnY29tcGxpYW5jZScsICdzeW50aGVzaXMnXTtcblxuICAgICAgICBhZ2VudFR5cGVzLmZvckVhY2goYWdlbnRUeXBlID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWdlbnRTdGF0dXNlcy5zZXQoYWdlbnRUeXBlLCB7XG4gICAgICAgICAgICAgICAgYWdlbnRUeXBlLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ2lkbGUnLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRUYXNrczogW10sXG4gICAgICAgICAgICAgICAgbGFzdEFjdGl2aXR5OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogdGhpcy5nZXRBZ2VudENhcGFiaWxpdGllcyhhZ2VudFR5cGUpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGNhcGFiaWxpdGllcyBmb3IgZWFjaCBhZ2VudCB0eXBlXG4gICAgICovXG4gICAgcHJpdmF0ZSBnZXRBZ2VudENhcGFiaWxpdGllcyhhZ2VudFR5cGU6IEFnZW50VHlwZSk6IGFueSB7XG4gICAgICAgIGNvbnN0IGNhcGFiaWxpdGllc01hcCA9IHtcbiAgICAgICAgICAgIHN1cGVydmlzb3I6IHtcbiAgICAgICAgICAgICAgICBzdXBwb3J0ZWRUYXNrczogWydjb29yZGluYXRpb24nLCAnZGVsZWdhdGlvbicsICdjb25mbGljdC1yZXNvbHV0aW9uJywgJ3N5bnRoZXNpcyddLFxuICAgICAgICAgICAgICAgIG1heENvbmN1cnJlbnRUYXNrczogMTAsXG4gICAgICAgICAgICAgICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiA1MDAwLFxuICAgICAgICAgICAgICAgIHJlbGlhYmlsaXR5OiAwLjk1LFxuICAgICAgICAgICAgICAgIHNwZWNpYWxpemF0aW9uczogWyd3b3JrZmxvdy1tYW5hZ2VtZW50JywgJ2RlY2lzaW9uLW1ha2luZyddXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGxhbm5pbmc6IHtcbiAgICAgICAgICAgICAgICBzdXBwb3J0ZWRUYXNrczogWyd0YXNrLXBsYW5uaW5nJywgJ2RlcGVuZGVuY3ktYW5hbHlzaXMnLCAncmVzb3VyY2UtZXN0aW1hdGlvbiddLFxuICAgICAgICAgICAgICAgIG1heENvbmN1cnJlbnRUYXNrczogMyxcbiAgICAgICAgICAgICAgICBhdmVyYWdlUHJvY2Vzc2luZ1RpbWU6IDgwMDAsXG4gICAgICAgICAgICAgICAgcmVsaWFiaWxpdHk6IDAuOTAsXG4gICAgICAgICAgICAgICAgc3BlY2lhbGl6YXRpb25zOiBbJ3N0cmF0ZWdpYy1wbGFubmluZycsICd0YXNrLXNlcXVlbmNpbmcnXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgc3VwcG9ydGVkVGFza3M6IFsnd2ViLXNlYXJjaCcsICdkYXRhLWV4dHJhY3Rpb24nLCAnaW5mb3JtYXRpb24tZ2F0aGVyaW5nJ10sXG4gICAgICAgICAgICAgICAgbWF4Q29uY3VycmVudFRhc2tzOiA1LFxuICAgICAgICAgICAgICAgIGF2ZXJhZ2VQcm9jZXNzaW5nVGltZTogMzAwMCxcbiAgICAgICAgICAgICAgICByZWxpYWJpbGl0eTogMC44NSxcbiAgICAgICAgICAgICAgICBzcGVjaWFsaXphdGlvbnM6IFsnaW5mb3JtYXRpb24tcmV0cmlldmFsJywgJ2RhdGEtcHJvY2Vzc2luZyddXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYW5hbHlzaXM6IHtcbiAgICAgICAgICAgICAgICBzdXBwb3J0ZWRUYXNrczogWydmaW5hbmNpYWwtYW5hbHlzaXMnLCAncXVhbnRpdGF0aXZlLWFuYWx5c2lzJywgJ3BhdHRlcm4tcmVjb2duaXRpb24nXSxcbiAgICAgICAgICAgICAgICBtYXhDb25jdXJyZW50VGFza3M6IDMsXG4gICAgICAgICAgICAgICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiAxMjAwMCxcbiAgICAgICAgICAgICAgICByZWxpYWJpbGl0eTogMC45MixcbiAgICAgICAgICAgICAgICBzcGVjaWFsaXphdGlvbnM6IFsnZmluYW5jaWFsLW1vZGVsaW5nJywgJ3N0YXRpc3RpY2FsLWFuYWx5c2lzJ11cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wbGlhbmNlOiB7XG4gICAgICAgICAgICAgICAgc3VwcG9ydGVkVGFza3M6IFsncmVndWxhdG9yeS1jaGVjaycsICdyaXNrLWFzc2Vzc21lbnQnLCAnY29tcGxpYW5jZS12YWxpZGF0aW9uJ10sXG4gICAgICAgICAgICAgICAgbWF4Q29uY3VycmVudFRhc2tzOiA0LFxuICAgICAgICAgICAgICAgIGF2ZXJhZ2VQcm9jZXNzaW5nVGltZTogNjAwMCxcbiAgICAgICAgICAgICAgICByZWxpYWJpbGl0eTogMC45OCxcbiAgICAgICAgICAgICAgICBzcGVjaWFsaXphdGlvbnM6IFsncmVndWxhdG9yeS1jb21wbGlhbmNlJywgJ3Jpc2stbWFuYWdlbWVudCddXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3ludGhlc2lzOiB7XG4gICAgICAgICAgICAgICAgc3VwcG9ydGVkVGFza3M6IFsncmVzdWx0LWludGVncmF0aW9uJywgJ25hcnJhdGl2ZS1nZW5lcmF0aW9uJywgJ3Zpc3VhbGl6YXRpb24nXSxcbiAgICAgICAgICAgICAgICBtYXhDb25jdXJyZW50VGFza3M6IDIsXG4gICAgICAgICAgICAgICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiAxMDAwMCxcbiAgICAgICAgICAgICAgICByZWxpYWJpbGl0eTogMC44OCxcbiAgICAgICAgICAgICAgICBzcGVjaWFsaXphdGlvbnM6IFsnY29udGVudC1zeW50aGVzaXMnLCAncHJlc2VudGF0aW9uJ11cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gY2FwYWJpbGl0aWVzTWFwW2FnZW50VHlwZV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyBhIHVzZXIgcmVxdWVzdCBhbmQgY29vcmRpbmF0ZSB0aGUgbXVsdGktYWdlbnQgd29ya2Zsb3dcbiAgICAgKi9cbiAgICBhc3luYyBwcm9jZXNzVXNlclJlcXVlc3QoXG4gICAgICAgIHVzZXJJZDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0VHlwZTogc3RyaW5nLFxuICAgICAgICBwYXJhbWV0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+XG4gICAgKTogUHJvbWlzZTxDb252ZXJzYXRpb25Db250ZXh0PiB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbklkID0gdGhpcy5nZW5lcmF0ZUNvbnZlcnNhdGlvbklkKCk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGNvbnZlcnNhdGlvbiBjb250ZXh0XG4gICAgICAgIGNvbnN0IGNvbnRleHQ6IENvbnZlcnNhdGlvbkNvbnRleHQgPSB7XG4gICAgICAgICAgICBpZDogY29udmVyc2F0aW9uSWQsXG4gICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgICByZXF1ZXN0VHlwZSxcbiAgICAgICAgICAgIHBhcmFtZXRlcnMsXG4gICAgICAgICAgICBtZXNzYWdlczogW10sXG4gICAgICAgICAgICB0YXNrczogW10sXG4gICAgICAgICAgICBjdXJyZW50UGhhc2U6ICdwbGFubmluZycsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBtZXRhZGF0YToge31cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbnMuc2V0KGNvbnZlcnNhdGlvbklkLCBjb250ZXh0KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gSW50ZXJwcmV0IHRoZSB1c2VyIHJlcXVlc3RcbiAgICAgICAgICAgIGNvbnN0IGludGVycHJldGF0aW9uID0gYXdhaXQgdGhpcy5pbnRlcnByZXRVc2VyUmVxdWVzdChyZXF1ZXN0VHlwZSwgcGFyYW1ldGVycyk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb29yZGluYXRpb24gcGxhblxuICAgICAgICAgICAgY29uc3QgcGxhbiA9IGF3YWl0IHRoaXMuY3JlYXRlQ29vcmRpbmF0aW9uUGxhbihjb252ZXJzYXRpb25JZCwgaW50ZXJwcmV0YXRpb24pO1xuXG4gICAgICAgICAgICAvLyBFeGVjdXRlIHRoZSBwbGFuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmV4ZWN1dGVQbGFuKGNvbnZlcnNhdGlvbklkLCBwbGFuKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9ucy5nZXQoY29udmVyc2F0aW9uSWQpITtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgdXNlciByZXF1ZXN0OicsIGVycm9yKTtcbiAgICAgICAgICAgIGNvbnRleHQuY3VycmVudFBoYXNlID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgICAgICBjb250ZXh0Lm1ldGFkYXRhLmVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcic7XG4gICAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVycHJldCB1c2VyIHJlcXVlc3QgdXNpbmcgQ2xhdWRlIFNvbm5ldFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgaW50ZXJwcmV0VXNlclJlcXVlc3QoXG4gICAgICAgIHJlcXVlc3RUeXBlOiBzdHJpbmcsXG4gICAgICAgIHBhcmFtZXRlcnM6IFJlY29yZDxzdHJpbmcsIGFueT5cbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm9tcHQgPSBgXG4gICAgQXMgYSBzdXBlcnZpc29yIGFnZW50IGZvciBhbiBpbnZlc3RtZW50IEFJIHN5c3RlbSwgaW50ZXJwcmV0IHRoZSBmb2xsb3dpbmcgdXNlciByZXF1ZXN0OlxuICAgIFxuICAgIFJlcXVlc3QgVHlwZTogJHtyZXF1ZXN0VHlwZX1cbiAgICBQYXJhbWV0ZXJzOiAke0pTT04uc3RyaW5naWZ5KHBhcmFtZXRlcnMsIG51bGwsIDIpfVxuICAgIFxuICAgIFBsZWFzZSBwcm92aWRlOlxuICAgIDEuIEEgY2xlYXIgdW5kZXJzdGFuZGluZyBvZiB3aGF0IHRoZSB1c2VyIHdhbnRzXG4gICAgMi4gVGhlIGtleSBvYmplY3RpdmVzIHRvIGFjaGlldmVcbiAgICAzLiBUaGUgdHlwZSBvZiBhbmFseXNpcyByZXF1aXJlZFxuICAgIDQuIEFueSBjb25zdHJhaW50cyBvciBwcmVmZXJlbmNlcyB0byBjb25zaWRlclxuICAgIDUuIEV4cGVjdGVkIGRlbGl2ZXJhYmxlc1xuICAgIFxuICAgIEZvcm1hdCB5b3VyIHJlc3BvbnNlIGFzIGEgc3RydWN0dXJlZCBKU09OIG9iamVjdC5cbiAgICBgO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgICAgIHByb21wdCxcbiAgICAgICAgICAgIG1heFRva2VuczogMTAwMCxcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2VUZXh0ID0gcmVzcG9uc2UuY29tcGxldGlvbjtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcG9uc2VUZXh0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIHN0cnVjdHVyZWQgaW50ZXJwcmV0YXRpb25cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdW5kZXJzdGFuZGluZzogYFVzZXIgcmVxdWVzdGVkICR7cmVxdWVzdFR5cGV9YCxcbiAgICAgICAgICAgICAgICBvYmplY3RpdmVzOiBbJ0dlbmVyYXRlIGludmVzdG1lbnQgaW5zaWdodHMnXSxcbiAgICAgICAgICAgICAgICBhbmFseXNpc1R5cGU6ICdjb21wcmVoZW5zaXZlJyxcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50czogcGFyYW1ldGVycyxcbiAgICAgICAgICAgICAgICBkZWxpdmVyYWJsZXM6IFsnSW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbnMnLCAnU3VwcG9ydGluZyBhbmFseXNpcyddXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgY29vcmRpbmF0aW9uIHBsYW4gZm9yIHRoZSByZXF1ZXN0XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVDb29yZGluYXRpb25QbGFuKFxuICAgICAgICBjb252ZXJzYXRpb25JZDogc3RyaW5nLFxuICAgICAgICBpbnRlcnByZXRhdGlvbjogYW55XG4gICAgKTogUHJvbWlzZTxDb29yZGluYXRpb25QbGFuPiB7XG4gICAgICAgIGNvbnN0IHBsYW5Qcm9tcHQgPSBgXG4gICAgQ3JlYXRlIGEgZGV0YWlsZWQgY29vcmRpbmF0aW9uIHBsYW4gZm9yIHRoZSBmb2xsb3dpbmcgaW52ZXN0bWVudCBhbmFseXNpcyByZXF1ZXN0OlxuICAgIFxuICAgICR7SlNPTi5zdHJpbmdpZnkoaW50ZXJwcmV0YXRpb24sIG51bGwsIDIpfVxuICAgIFxuICAgIEJyZWFrIGRvd24gdGhlIHdvcmsgaW50byBwaGFzZXMgd2l0aCBzcGVjaWZpYyB0YXNrcyBmb3IgZWFjaCBhZ2VudCB0eXBlOlxuICAgIC0gcGxhbm5pbmc6IFN0cmF0ZWdpYyBwbGFubmluZyBhbmQgdGFzayBzZXF1ZW5jaW5nXG4gICAgLSByZXNlYXJjaDogSW5mb3JtYXRpb24gZ2F0aGVyaW5nIGFuZCBkYXRhIGNvbGxlY3Rpb25cbiAgICAtIGFuYWx5c2lzOiBGaW5hbmNpYWwgYW5hbHlzaXMgYW5kIHF1YW50aXRhdGl2ZSBldmFsdWF0aW9uXG4gICAgLSBjb21wbGlhbmNlOiBSZWd1bGF0b3J5IGNoZWNrcyBhbmQgcmlzayBhc3Nlc3NtZW50XG4gICAgLSBzeW50aGVzaXM6IFJlc3VsdCBpbnRlZ3JhdGlvbiBhbmQgcHJlc2VudGF0aW9uXG4gICAgXG4gICAgRm9yIGVhY2ggcGhhc2UsIHNwZWNpZnk6XG4gICAgMS4gVGFza3MgdG8gYmUgY29tcGxldGVkXG4gICAgMi4gRGVwZW5kZW5jaWVzIGJldHdlZW4gdGFza3NcbiAgICAzLiBFc3RpbWF0ZWQgZHVyYXRpb24gaW4gc2Vjb25kc1xuICAgIFxuICAgIFJldHVybiBhIHN0cnVjdHVyZWQgcGxhbiBhcyBKU09OLlxuICAgIGA7XG5cbiAgICAgICAgY29uc3QgcGxhblJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgICAgIHByb21wdDogcGxhblByb21wdCxcbiAgICAgICAgICAgIG1heFRva2VuczogMTUwMCxcbiAgICAgICAgICAgIHRlbXBlcmF0dXJlOiAwLjJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcGxhblJlc3BvbnNlVGV4dCA9IHBsYW5SZXNwb25zZS5jb21wbGV0aW9uO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwbGFuRGF0YSA9IEpTT04ucGFyc2UocGxhblJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHBsYW46IENvb3JkaW5hdGlvblBsYW4gPSB7XG4gICAgICAgICAgICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVUYXNrSWQoKSxcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgICAgICAgICAgICBwaGFzZXM6IHBsYW5EYXRhLnBoYXNlcyB8fCBbXSxcbiAgICAgICAgICAgICAgICB0b3RhbEVzdGltYXRlZER1cmF0aW9uOiBwbGFuRGF0YS50b3RhbEVzdGltYXRlZER1cmF0aW9uIHx8IDYwMDAwLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6ICdkcmFmdCdcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBwbGFuO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gRmFsbGJhY2sgcGxhblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5nZW5lcmF0ZVRhc2tJZCgpLFxuICAgICAgICAgICAgICAgIGNvbnZlcnNhdGlvbklkLFxuICAgICAgICAgICAgICAgIHBoYXNlczogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncGxhbm5pbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFza3M6IFsnY3JlYXRlLXJlc2VhcmNoLXBsYW4nXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogW10sXG4gICAgICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWREdXJhdGlvbjogMTAwMDBcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3Jlc2VhcmNoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhc2tzOiBbJ2dhdGhlci1tYXJrZXQtZGF0YScsICdjb2xsZWN0LXJlc2VhcmNoJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFsnY3JlYXRlLXJlc2VhcmNoLXBsYW4nXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzdGltYXRlZER1cmF0aW9uOiAyMDAwMFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYW5hbHlzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFza3M6IFsnYW5hbHl6ZS1kYXRhJywgJ2dlbmVyYXRlLWluc2lnaHRzJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IFsnZ2F0aGVyLW1hcmtldC1kYXRhJywgJ2NvbGxlY3QtcmVzZWFyY2gnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVzdGltYXRlZER1cmF0aW9uOiAxNTAwMFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29tcGxpYW5jZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXNrczogWydjaGVjay1jb21wbGlhbmNlJywgJ2Fzc2Vzcy1yaXNrcyddLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbJ2FuYWx5emUtZGF0YSddLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IDEwMDAwXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdzeW50aGVzaXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGFza3M6IFsnc3ludGhlc2l6ZS1yZXN1bHRzJywgJ2NyZWF0ZS1wcmVzZW50YXRpb24nXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogWydnZW5lcmF0ZS1pbnNpZ2h0cycsICdjaGVjay1jb21wbGlhbmNlJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWREdXJhdGlvbjogMTUwMDBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgdG90YWxFc3RpbWF0ZWREdXJhdGlvbjogNzAwMDAsXG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ2RyYWZ0J1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgdGhlIGNvb3JkaW5hdGlvbiBwbGFuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBleGVjdXRlUGxhbihjb252ZXJzYXRpb25JZDogc3RyaW5nLCBwbGFuOiBDb29yZGluYXRpb25QbGFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbnMuZ2V0KGNvbnZlcnNhdGlvbklkKTtcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnZlcnNhdGlvbiBjb250ZXh0IG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGxhbi5zdGF0dXMgPSAnYWN0aXZlJztcblxuICAgICAgICBmb3IgKGNvbnN0IHBoYXNlIG9mIHBsYW4ucGhhc2VzKSB7XG4gICAgICAgICAgICBjb250ZXh0LmN1cnJlbnRQaGFzZSA9IHBoYXNlLm5hbWUgYXMgYW55O1xuICAgICAgICAgICAgY29udGV4dC51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGFza3MgZm9yIHRoaXMgcGhhc2VcbiAgICAgICAgICAgIGNvbnN0IHRhc2tzID0gYXdhaXQgdGhpcy5jcmVhdGVUYXNrc0ZvclBoYXNlKGNvbnZlcnNhdGlvbklkLCBwaGFzZSk7XG5cbiAgICAgICAgICAgIC8vIERlbGVnYXRlIHRhc2tzIHRvIGFwcHJvcHJpYXRlIGFnZW50c1xuICAgICAgICAgICAgY29uc3QgZGVsZWdhdGlvblJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgICAgICAgICB0YXNrcy5tYXAodGFzayA9PiB0aGlzLmRlbGVnYXRlVGFzayh0YXNrKSlcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vIFdhaXQgZm9yIHRhc2sgY29tcGxldGlvblxuICAgICAgICAgICAgYXdhaXQgdGhpcy53YWl0Rm9yVGFza0NvbXBsZXRpb24odGFza3MubWFwKHQgPT4gdC5pZCkpO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY29uZmxpY3RzIGFuZCByZXNvbHZlIHRoZW1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tBbmRSZXNvbHZlQ29uZmxpY3RzKGNvbnZlcnNhdGlvbklkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRleHQuY3VycmVudFBoYXNlID0gJ2NvbXBsZXRlZCc7XG4gICAgICAgIGNvbnRleHQudXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgcGxhbi5zdGF0dXMgPSAnY29tcGxldGVkJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGUgdGFza3MgZm9yIGEgc3BlY2lmaWMgcGhhc2VcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGNyZWF0ZVRhc2tzRm9yUGhhc2UoXG4gICAgICAgIGNvbnZlcnNhdGlvbklkOiBzdHJpbmcsXG4gICAgICAgIHBoYXNlOiBhbnlcbiAgICApOiBQcm9taXNlPEFnZW50VGFza1tdPiB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbnMuZ2V0KGNvbnZlcnNhdGlvbklkKTtcbiAgICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnZlcnNhdGlvbiBjb250ZXh0IG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGFza3M6IEFnZW50VGFza1tdID0gW107XG5cbiAgICAgICAgZm9yIChjb25zdCB0YXNrRGVzY3JpcHRpb24gb2YgcGhhc2UudGFza3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhc2s6IEFnZW50VGFzayA9IHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5nZW5lcmF0ZVRhc2tJZCgpLFxuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMubWFwVGFza1RvVHlwZSh0YXNrRGVzY3JpcHRpb24pLFxuICAgICAgICAgICAgICAgIGNvbXBsZXhpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgICAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgICAgICAgIGFnZW50Um9sZTogdGhpcy5tYXBUYXNrVG9BZ2VudCh0YXNrRGVzY3JpcHRpb24pLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB0YXNrRGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyczogY29udGV4dC5wYXJhbWV0ZXJzLFxuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llczogcGhhc2UuZGVwZW5kZW5jaWVzIHx8IFtdLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ3BlbmRpbmcnLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRhc2tzLnB1c2godGFzayk7XG4gICAgICAgICAgICBjb250ZXh0LnRhc2tzLnB1c2godGFzayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFza3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFwIHRhc2sgZGVzY3JpcHRpb24gdG8gdGFzayB0eXBlXG4gICAgICovXG4gICAgcHJpdmF0ZSBtYXBUYXNrVG9UeXBlKHRhc2tEZXNjcmlwdGlvbjogc3RyaW5nKTogQWdlbnRUYXNrWyd0eXBlJ10ge1xuICAgICAgICBpZiAodGFza0Rlc2NyaXB0aW9uLmluY2x1ZGVzKCdhbmFseXplJykgfHwgdGFza0Rlc2NyaXB0aW9uLmluY2x1ZGVzKCdhbmFseXNpcycpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3RpbWUtc2VyaWVzLWFuYWx5c2lzJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGFza0Rlc2NyaXB0aW9uLmluY2x1ZGVzKCdyZXNlYXJjaCcpIHx8IHRhc2tEZXNjcmlwdGlvbi5pbmNsdWRlcygnZ2F0aGVyJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnZW50aXR5LWV4dHJhY3Rpb24nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ2NvbXBsaWFuY2UnKSB8fCB0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ2NoZWNrJykpIHtcbiAgICAgICAgICAgIHJldHVybiAnY2xhc3NpZmljYXRpb24nO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ3NlbnRpbWVudCcpKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3NlbnRpbWVudC1hbmFseXNpcyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICd0ZXh0LWdlbmVyYXRpb24nO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcCB0YXNrIGRlc2NyaXB0aW9uIHRvIGFwcHJvcHJpYXRlIGFnZW50XG4gICAgICovXG4gICAgcHJpdmF0ZSBtYXBUYXNrVG9BZ2VudCh0YXNrRGVzY3JpcHRpb246IHN0cmluZyk6IEFnZW50VHlwZSB7XG4gICAgICAgIGlmICh0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ3BsYW4nKSkgcmV0dXJuICdwbGFubmluZyc7XG4gICAgICAgIGlmICh0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ3Jlc2VhcmNoJykgfHwgdGFza0Rlc2NyaXB0aW9uLmluY2x1ZGVzKCdnYXRoZXInKSB8fCB0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ2NvbGxlY3QnKSkgcmV0dXJuICdyZXNlYXJjaCc7XG4gICAgICAgIGlmICh0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ2FuYWx5emUnKSB8fCB0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ2FuYWx5c2lzJykpIHJldHVybiAnYW5hbHlzaXMnO1xuICAgICAgICBpZiAodGFza0Rlc2NyaXB0aW9uLmluY2x1ZGVzKCdjb21wbGlhbmNlJykgfHwgdGFza0Rlc2NyaXB0aW9uLmluY2x1ZGVzKCdyaXNrJykpIHJldHVybiAnY29tcGxpYW5jZSc7XG4gICAgICAgIGlmICh0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ3N5bnRoZXNpemUnKSB8fCB0YXNrRGVzY3JpcHRpb24uaW5jbHVkZXMoJ3ByZXNlbnQnKSkgcmV0dXJuICdzeW50aGVzaXMnO1xuICAgICAgICByZXR1cm4gJ3N1cGVydmlzb3InO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlbGVnYXRlIGEgdGFzayB0byB0aGUgYXBwcm9wcmlhdGUgYWdlbnRcbiAgICAgKi9cbiAgICBhc3luYyBkZWxlZ2F0ZVRhc2sodGFzazogQWdlbnRUYXNrKTogUHJvbWlzZTxUYXNrRGVsZWdhdGlvblJlc3VsdD4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVXBkYXRlIGFnZW50IHN0YXR1c1xuICAgICAgICAgICAgY29uc3QgYWdlbnRTdGF0dXMgPSB0aGlzLmFnZW50U3RhdHVzZXMuZ2V0KHRhc2suYWdlbnRSb2xlKTtcbiAgICAgICAgICAgIGlmICghYWdlbnRTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFnZW50ICR7dGFzay5hZ2VudFJvbGV9IG5vdCBmb3VuZGApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBhZ2VudCBpcyBhdmFpbGFibGVcbiAgICAgICAgICAgIGlmIChhZ2VudFN0YXR1cy5zdGF0dXMgPT09ICdidXN5JyAmJlxuICAgICAgICAgICAgICAgIGFnZW50U3RhdHVzLmN1cnJlbnRUYXNrcy5sZW5ndGggPj0gYWdlbnRTdGF0dXMuY2FwYWJpbGl0aWVzLm1heENvbmN1cnJlbnRUYXNrcykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQWdlbnQgJHt0YXNrLmFnZW50Um9sZX0gaXMgYXQgY2FwYWNpdHlgKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQXNzaWduIHRhc2tcbiAgICAgICAgICAgIHRhc2suc3RhdHVzID0gJ2Fzc2lnbmVkJztcbiAgICAgICAgICAgIHRhc2suYXNzaWduZWRUbyA9IHRhc2suYWdlbnRSb2xlO1xuICAgICAgICAgICAgdGFzay51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBVcGRhdGUgYWdlbnQgc3RhdHVzXG4gICAgICAgICAgICBhZ2VudFN0YXR1cy5zdGF0dXMgPSAnYnVzeSc7XG4gICAgICAgICAgICBhZ2VudFN0YXR1cy5jdXJyZW50VGFza3MucHVzaCh0YXNrLmlkKTtcbiAgICAgICAgICAgIGFnZW50U3RhdHVzLmxhc3RBY3Rpdml0eSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBkZWxlZ2F0aW9uIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2U6IEFnZW50TWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICBzZW5kZXI6ICdzdXBlcnZpc29yJyxcbiAgICAgICAgICAgICAgICByZWNpcGllbnQ6IHRhc2suYWdlbnRSb2xlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VUeXBlOiAncmVxdWVzdCcsXG4gICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICB0YXNrLFxuICAgICAgICAgICAgICAgICAgICBpbnN0cnVjdGlvbnM6IGBQbGVhc2UgY29tcGxldGUgdGhlIGZvbGxvd2luZyB0YXNrOiAke3Rhc2suZGVzY3JpcHRpb259YFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgcHJpb3JpdHk6IHRhc2sucHJpb3JpdHksXG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICAgICAgY29udmVyc2F0aW9uSWQ6IHRhc2suaWQsIC8vIFVzaW5nIHRhc2sgSUQgYXMgY29udmVyc2F0aW9uIHJlZmVyZW5jZVxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQ6IHRhc2suaWRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VRdWV1ZS5wdXNoKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAvLyBTaW11bGF0ZSB0YXNrIHByb2Nlc3NpbmcgKGluIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgYmUgaGFuZGxlZCBieSBhY3R1YWwgYWdlbnRzKVxuICAgICAgICAgICAgY29uc3QgcHJvY2Vzc2luZ1RpbWUgPSB0aGlzLnRlc3RNb2RlID8gMTAgOiBhZ2VudFN0YXR1cy5jYXBhYmlsaXRpZXMuYXZlcmFnZVByb2Nlc3NpbmdUaW1lO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaW11bGF0ZVRhc2tDb21wbGV0aW9uKHRhc2spO1xuICAgICAgICAgICAgfSwgcHJvY2Vzc2luZ1RpbWUpO1xuXG4gICAgICAgICAgICBjb25zdCBlc3RpbWF0ZWRDb21wbGV0aW9uID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGVzdGltYXRlZENvbXBsZXRpb24uc2V0TWlsbGlzZWNvbmRzKFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZENvbXBsZXRpb24uZ2V0TWlsbGlzZWNvbmRzKCkgKyBhZ2VudFN0YXR1cy5jYXBhYmlsaXRpZXMuYXZlcmFnZVByb2Nlc3NpbmdUaW1lXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgdGFza0lkOiB0YXNrLmlkLFxuICAgICAgICAgICAgICAgIGFzc2lnbmVkVG86IHRhc2suYWdlbnRSb2xlLFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZENvbXBsZXRpb25cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICB0YXNrLnN0YXR1cyA9ICdmYWlsZWQnO1xuICAgICAgICAgICAgdGFzay5lcnJvciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRhc2tJZDogdGFzay5pZCxcbiAgICAgICAgICAgICAgICBhc3NpZ25lZFRvOiB0YXNrLmFnZW50Um9sZSxcbiAgICAgICAgICAgICAgICBlc3RpbWF0ZWRDb21wbGV0aW9uOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIGVycm9yOiB0YXNrLmVycm9yXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2ltdWxhdGUgdGFzayBjb21wbGV0aW9uIChwbGFjZWhvbGRlciBmb3IgYWN0dWFsIGFnZW50IGltcGxlbWVudGF0aW9uKVxuICAgICAqL1xuICAgIHByaXZhdGUgc2ltdWxhdGVUYXNrQ29tcGxldGlvbih0YXNrOiBBZ2VudFRhc2spOiB2b2lkIHtcbiAgICAgICAgdGFzay5zdGF0dXMgPSAnY29tcGxldGVkJztcbiAgICAgICAgdGFzay51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB0YXNrLnJlc3VsdCA9IHtcbiAgICAgICAgICAgIHN1bW1hcnk6IGBDb21wbGV0ZWQgJHt0YXNrLmRlc2NyaXB0aW9ufWAsXG4gICAgICAgICAgICBkYXRhOiB7fSxcbiAgICAgICAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBVcGRhdGUgYWdlbnQgc3RhdHVzXG4gICAgICAgIGNvbnN0IGFnZW50U3RhdHVzID0gdGhpcy5hZ2VudFN0YXR1c2VzLmdldCh0YXNrLmFnZW50Um9sZSEpO1xuICAgICAgICBpZiAoYWdlbnRTdGF0dXMpIHtcbiAgICAgICAgICAgIGFnZW50U3RhdHVzLmN1cnJlbnRUYXNrcyA9IGFnZW50U3RhdHVzLmN1cnJlbnRUYXNrcy5maWx0ZXIoaWQgPT4gaWQgIT09IHRhc2suaWQpO1xuICAgICAgICAgICAgaWYgKGFnZW50U3RhdHVzLmN1cnJlbnRUYXNrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBhZ2VudFN0YXR1cy5zdGF0dXMgPSAnaWRsZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZ2VudFN0YXR1cy5sYXN0QWN0aXZpdHkgPSBuZXcgRGF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2FpdCBmb3IgdGFzayBjb21wbGV0aW9uXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyB3YWl0Rm9yVGFza0NvbXBsZXRpb24odGFza0lkczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjaGVja0NvbXBsZXRpb24gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxsQ29tcGxldGVkID0gdGFza0lkcy5ldmVyeSh0YXNrSWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBGaW5kIHRhc2sgaW4gYWxsIGNvbnZlcnNhdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjb250ZXh0IG9mIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9ucy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFzayA9IGNvbnRleHQudGFza3MuZmluZCh0ID0+IHQuaWQgPT09IHRhc2tJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFzayAmJiAodGFzay5zdGF0dXMgPT09ICdjb21wbGV0ZWQnIHx8IHRhc2suc3RhdHVzID09PSAnZmFpbGVkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYWxsQ29tcGxldGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ29tcGxldGlvbiwgMTAwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY2hlY2tDb21wbGV0aW9uKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGZvciBjb25mbGljdHMgYW5kIHJlc29sdmUgdGhlbVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgY2hlY2tBbmRSZXNvbHZlQ29uZmxpY3RzKGNvbnZlcnNhdGlvbklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IHRoaXMuYWN0aXZlQ29udmVyc2F0aW9ucy5nZXQoY29udmVyc2F0aW9uSWQpO1xuICAgICAgICBpZiAoIWNvbnRleHQpIHJldHVybjtcblxuICAgICAgICAvLyBDaGVjayBmb3IgZGF0YSBpbmNvbnNpc3RlbmNpZXNcbiAgICAgICAgY29uc3QgY29tcGxldGVkVGFza3MgPSBjb250ZXh0LnRhc2tzLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSAnY29tcGxldGVkJyk7XG4gICAgICAgIGNvbnN0IGNvbmZsaWN0cyA9IHRoaXMuZGV0ZWN0Q29uZmxpY3RzKGNvbXBsZXRlZFRhc2tzKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNvbmZsaWN0IG9mIGNvbmZsaWN0cykge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZXNvbHZlQ29uZmxpY3QoY29uZmxpY3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZWN0IGNvbmZsaWN0cyBiZXR3ZWVuIHRhc2sgcmVzdWx0c1xuICAgICAqL1xuICAgIHByaXZhdGUgZGV0ZWN0Q29uZmxpY3RzKHRhc2tzOiBBZ2VudFRhc2tbXSk6IENvbmZsaWN0UmVzb2x1dGlvbltdIHtcbiAgICAgICAgY29uc3QgY29uZmxpY3RzOiBDb25mbGljdFJlc29sdXRpb25bXSA9IFtdO1xuXG4gICAgICAgIC8vIFNpbXBsZSBjb25mbGljdCBkZXRlY3Rpb24gLSBpbiByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGJlIG1vcmUgc29waGlzdGljYXRlZFxuICAgICAgICBjb25zdCBhbmFseXNpc1Jlc3VsdHMgPSB0YXNrcy5maWx0ZXIodCA9PiB0LmFnZW50Um9sZSA9PT0gJ2FuYWx5c2lzJyk7XG4gICAgICAgIGNvbnN0IGNvbXBsaWFuY2VSZXN1bHRzID0gdGFza3MuZmlsdGVyKHQgPT4gdC5hZ2VudFJvbGUgPT09ICdjb21wbGlhbmNlJyk7XG5cbiAgICAgICAgaWYgKGFuYWx5c2lzUmVzdWx0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgY29uZmxpY3RpbmcgcmVjb21tZW5kYXRpb25zXG4gICAgICAgICAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSBhbmFseXNpc1Jlc3VsdHMubWFwKHQgPT4gdC5yZXN1bHQ/LnJlY29tbWVuZGF0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IHVuaXF1ZVJlY29tbWVuZGF0aW9ucyA9IG5ldyBTZXQocmVjb21tZW5kYXRpb25zKTtcblxuICAgICAgICAgICAgaWYgKHVuaXF1ZVJlY29tbWVuZGF0aW9ucy5zaXplID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbmZsaWN0cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY29uZmxpY3RJZDogdGhpcy5nZW5lcmF0ZUNvbnZlcnNhdGlvbklkKCksXG4gICAgICAgICAgICAgICAgICAgIGNvbmZsaWN0VHlwZTogJ3JlY29tbWVuZGF0aW9uLWNvbmZsaWN0JyxcbiAgICAgICAgICAgICAgICAgICAgaW52b2x2ZWRBZ2VudHM6IFsnYW5hbHlzaXMnXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNdWx0aXBsZSBhbmFseXNpcyBhZ2VudHMgcHJvdmlkZWQgY29uZmxpY3RpbmcgcmVjb21tZW5kYXRpb25zJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x1dGlvblN0cmF0ZWd5OiAnbWFqb3JpdHktdm90ZSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb25mbGljdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVzb2x2ZSBhIHNwZWNpZmljIGNvbmZsaWN0XG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyByZXNvbHZlQ29uZmxpY3QoY29uZmxpY3Q6IENvbmZsaWN0UmVzb2x1dGlvbik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCByZXNvbHV0aW9uUHJvbXB0ID0gYFxuICAgIFJlc29sdmUgdGhlIGZvbGxvd2luZyBjb25mbGljdCBpbiBpbnZlc3RtZW50IGFuYWx5c2lzOlxuICAgIFxuICAgIENvbmZsaWN0IFR5cGU6ICR7Y29uZmxpY3QuY29uZmxpY3RUeXBlfVxuICAgIERlc2NyaXB0aW9uOiAke2NvbmZsaWN0LmRlc2NyaXB0aW9ufVxuICAgIEludm9sdmVkIEFnZW50czogJHtjb25mbGljdC5pbnZvbHZlZEFnZW50cy5qb2luKCcsICcpfVxuICAgIFxuICAgIFBsZWFzZSBwcm92aWRlIGEgcmVzb2x1dGlvbiBzdHJhdGVneSBhbmQgZmluYWwgcmVjb21tZW5kYXRpb24uXG4gICAgYDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzb2x1dGlvblJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgICAgICAgICBwcm9tcHQ6IHJlc29sdXRpb25Qcm9tcHQsXG4gICAgICAgICAgICAgICAgbWF4VG9rZW5zOiA4MDAsXG4gICAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuMlxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc29sdXRpb24gPSByZXNvbHV0aW9uUmVzcG9uc2UuY29tcGxldGlvbjtcblxuICAgICAgICAgICAgY29uZmxpY3QucmVzb2x1dGlvbiA9IHJlc29sdXRpb247XG4gICAgICAgICAgICBjb25mbGljdC5yZXNvbHZlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGNvbmZsaWN0LnJlc29sdmVkQnkgPSAnc3VwZXJ2aXNvcic7XG5cbiAgICAgICAgICAgIHRoaXMuY29uZmxpY3RSZXNvbHV0aW9ucy5zZXQoY29uZmxpY3QuY29uZmxpY3RJZCwgY29uZmxpY3QpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcmVzb2x2aW5nIGNvbmZsaWN0OicsIGVycm9yKTtcbiAgICAgICAgICAgIGNvbmZsaWN0LnJlc29sdXRpb24gPSAnVW5hYmxlIHRvIHJlc29sdmUgYXV0b21hdGljYWxseSAtIHJlcXVpcmVzIGh1bWFuIGludGVydmVudGlvbic7XG4gICAgICAgICAgICBjb25mbGljdC5yZXNvbHZlZEF0ID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGNvbmZsaWN0LnJlc29sdmVkQnkgPSAnc3VwZXJ2aXNvcic7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgY29udmVyc2F0aW9uIGNvbnRleHRcbiAgICAgKi9cbiAgICBnZXRDb252ZXJzYXRpb25Db250ZXh0KGNvbnZlcnNhdGlvbklkOiBzdHJpbmcpOiBDb252ZXJzYXRpb25Db250ZXh0IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9ucy5nZXQoY29udmVyc2F0aW9uSWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhZ2VudCBzdGF0dXNcbiAgICAgKi9cbiAgICBnZXRBZ2VudFN0YXR1cyhhZ2VudFR5cGU6IEFnZW50VHlwZSk6IEFnZW50U3RhdHVzIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWdlbnRTdGF0dXNlcy5nZXQoYWdlbnRUeXBlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYWxsIGFjdGl2ZSBjb252ZXJzYXRpb25zXG4gICAgICovXG4gICAgZ2V0QWN0aXZlQ29udmVyc2F0aW9ucygpOiBDb252ZXJzYXRpb25Db250ZXh0W10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmFjdGl2ZUNvbnZlcnNhdGlvbnMudmFsdWVzKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgbWVzc2FnZSB0byBhZ2VudFxuICAgICAqL1xuICAgIHNlbmRNZXNzYWdlKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IHZvaWQge1xuICAgICAgICB0aGlzLm1lc3NhZ2VRdWV1ZS5wdXNoKG1lc3NhZ2UpO1xuICAgICAgICAvLyBJbiByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHJvdXRlIHRvIGFjdHVhbCBhZ2VudCBzZXJ2aWNlc1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBtZXNzYWdlIHF1ZXVlXG4gICAgICovXG4gICAgZ2V0TWVzc2FnZVF1ZXVlKCk6IEFnZW50TWVzc2FnZVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLm1lc3NhZ2VRdWV1ZV07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2xlYXIgbWVzc2FnZSBxdWV1ZVxuICAgICAqL1xuICAgIGNsZWFyTWVzc2FnZVF1ZXVlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLm1lc3NhZ2VRdWV1ZSA9IFtdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIHVuaXF1ZSBjb252ZXJzYXRpb24gSURcbiAgICAgKi9cbiAgICBwcml2YXRlIGdlbmVyYXRlQ29udmVyc2F0aW9uSWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBjb252XyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZSB1bmlxdWUgdGFzayBJRFxuICAgICAqL1xuICAgIHByaXZhdGUgZ2VuZXJhdGVUYXNrSWQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGB0YXNrXyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDbGVhbiB1cCBjb21wbGV0ZWQgY29udmVyc2F0aW9uc1xuICAgICAqL1xuICAgIGNsZWFudXBDb21wbGV0ZWRDb252ZXJzYXRpb25zKG9sZGVyVGhhbkhvdXJzOiBudW1iZXIgPSAyNCk6IHZvaWQge1xuICAgICAgICBjb25zdCBjdXRvZmZUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgY3V0b2ZmVGltZS5zZXRIb3VycyhjdXRvZmZUaW1lLmdldEhvdXJzKCkgLSBvbGRlclRoYW5Ib3Vycyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBbaWQsIGNvbnRleHRdIG9mIHRoaXMuYWN0aXZlQ29udmVyc2F0aW9ucy5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0LmN1cnJlbnRQaGFzZSA9PT0gJ2NvbXBsZXRlZCcgJiYgY29udGV4dC51cGRhdGVkQXQgPCBjdXRvZmZUaW1lKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmVDb252ZXJzYXRpb25zLmRlbGV0ZShpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59Il19