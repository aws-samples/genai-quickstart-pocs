"use strict";
/**
 * Planning Agent Implementation
 *
 * The planning agent develops research and analysis plans, identifies required
 * information and data sources, creates task sequences with dependencies,
 * adapts plans based on intermediate findings, and estimates time and resource requirements.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningAgent = exports.PlanningTaskType = void 0;
const claude_sonnet_service_1 = require("./claude-sonnet-service");
/**
 * Planning task types
 */
var PlanningTaskType;
(function (PlanningTaskType) {
    PlanningTaskType["RESEARCH_PLAN"] = "research-plan";
    PlanningTaskType["ANALYSIS_PLAN"] = "analysis-plan";
    PlanningTaskType["DEPENDENCY_ANALYSIS"] = "dependency-analysis";
    PlanningTaskType["RESOURCE_ESTIMATION"] = "resource-estimation";
    PlanningTaskType["PLAN_ADAPTATION"] = "plan-adaptation";
})(PlanningTaskType || (exports.PlanningTaskType = PlanningTaskType = {}));
/**
 * Planning Agent implementation
 */
class PlanningAgent {
    constructor(claudeSonnetService, testMode = false) {
        this.researchPlans = new Map();
        this.analysisPlans = new Map();
        this.taskDependencies = new Map();
        this.resourceEstimations = new Map();
        this.planAdaptations = new Map();
        this.testMode = false;
        this.claudeSonnetService = claudeSonnetService;
        this.testMode = testMode;
    }
    /**
     * Create a comprehensive research plan
     */
    async createResearchPlan(conversationId, context) {
        const planningPrompt = `
        Create a detailed research plan for the following investment analysis request:

        Request Type: ${context.requestType}
        Parameters: ${JSON.stringify(context.parameters, null, 2)}
        User Preferences: ${JSON.stringify(context.userPreferences || {}, null, 2)}
        Constraints: ${JSON.stringify(context.constraints || {}, null, 2)}

        Please provide a comprehensive research plan that includes:

        1. Clear research objectives
        2. Specific research questions to answer
        3. Data sources to investigate (prioritized)
        4. Research methodology
        5. Expected outcomes
        6. Potential risk factors

        For each data source, specify:
        - Source name and type (proprietary/public/market/regulatory)
        - Priority level (high/medium/low)
        - Estimated time required
        - Dependencies on other sources

        Format your response as a structured JSON object.
        `;
        try {
            const response = await this.claudeSonnetService.complete({
                prompt: planningPrompt,
                template: claude_sonnet_service_1.ClaudePromptTemplate.MARKET_RESEARCH,
                templateVariables: {
                    topic: context.requestType,
                    questions: JSON.stringify(context.parameters),
                    dataSources: context.availableResources?.dataSources?.join(', ') || 'Standard market data sources',
                    outputFormat: 'Structured JSON with research plan details'
                },
                maxTokens: 2000,
                temperature: 0.3
            });
            const planData = this.parseStructuredResponse(response.completion);
            const researchPlan = {
                id: this.generatePlanId('research'),
                conversationId,
                objectives: planData.objectives || ['Generate investment insights'],
                researchQuestions: planData.researchQuestions || ['What are the key investment opportunities?'],
                dataSources: this.formatDataSources(planData.dataSources || []),
                methodology: planData.methodology || 'Comprehensive multi-source analysis',
                expectedOutcomes: planData.expectedOutcomes || ['Investment recommendations'],
                riskFactors: planData.riskFactors || ['Data availability', 'Market volatility'],
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            this.researchPlans.set(researchPlan.id, researchPlan);
            return researchPlan;
        }
        catch (error) {
            console.error('Error creating research plan:', error);
            throw new Error(`Failed to create research plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a detailed analysis plan
     */
    async createAnalysisPlan(conversationId, context, researchPlan) {
        const analysisPrompt = `
        Create a detailed analysis plan based on the following research plan and context:

        Research Plan Objectives: ${researchPlan.objectives.join(', ')}
        Research Questions: ${researchPlan.researchQuestions.join(', ')}
        Available Data Sources: ${researchPlan.dataSources.map(ds => ds.source).join(', ')}
        
        Context:
        Request Type: ${context.requestType}
        Parameters: ${JSON.stringify(context.parameters, null, 2)}
        User Preferences: ${JSON.stringify(context.userPreferences || {}, null, 2)}

        Please provide a comprehensive analysis plan that includes:

        1. Analysis type (fundamental/technical/quantitative/qualitative/mixed)
        2. Detailed analysis steps with:
           - Step description
           - Required data inputs
           - Expected outputs
           - Estimated time
           - Dependencies
           - Responsible agent (research/analysis/compliance/synthesis)
        3. Key metrics to calculate
        4. Validation criteria
        5. Confidence thresholds (minimum and target)

        Format your response as a structured JSON object.
        `;
        try {
            const response = await this.claudeSonnetService.complete({
                prompt: analysisPrompt,
                template: claude_sonnet_service_1.ClaudePromptTemplate.INVESTMENT_ANALYSIS,
                templateVariables: {
                    context: `Research plan: ${JSON.stringify(researchPlan, null, 2)}`,
                    investmentDetails: JSON.stringify(context.parameters),
                    analysisRequirements: 'Comprehensive financial analysis with risk assessment',
                    questions: researchPlan.researchQuestions.join('\n')
                },
                maxTokens: 2500,
                temperature: 0.2
            });
            const planData = this.parseStructuredResponse(response.completion);
            const analysisPlan = {
                id: this.generatePlanId('analysis'),
                conversationId,
                analysisType: planData.analysisType || 'mixed',
                analysisSteps: this.formatAnalysisSteps(planData.analysisSteps || []),
                metrics: planData.metrics || ['ROI', 'Risk-adjusted return', 'Volatility'],
                validationCriteria: planData.validationCriteria || ['Data consistency', 'Model accuracy'],
                confidenceThresholds: {
                    minimum: planData.confidenceThresholds?.minimum || 0.7,
                    target: planData.confidenceThresholds?.target || 0.85
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'draft'
            };
            this.analysisPlans.set(analysisPlan.id, analysisPlan);
            return analysisPlan;
        }
        catch (error) {
            console.error('Error creating analysis plan:', error);
            throw new Error(`Failed to create analysis plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Analyze task dependencies and create dependency graph
     */
    async analyzeDependencies(researchPlan, analysisPlan) {
        const dependencyPrompt = `
        Analyze the dependencies between tasks in the following research and analysis plans:

        Research Plan:
        ${JSON.stringify(researchPlan, null, 2)}

        Analysis Plan:
        ${JSON.stringify(analysisPlan, null, 2)}

        Please identify:
        1. Task dependencies (which tasks depend on others)
        2. Critical path tasks (tasks that would delay the entire project if delayed)
        3. Parallel execution opportunities
        4. Potential bottlenecks

        For each task, provide:
        - Task ID
        - Dependencies (tasks that must complete first)
        - Blocked by (tasks that this task blocks)
        - Whether it's on the critical path
        - Estimated duration

        Format your response as a structured JSON object with a "dependencies" array.
        `;
        try {
            const response = await this.claudeSonnetService.complete({
                prompt: dependencyPrompt,
                maxTokens: 2000,
                temperature: 0.2
            });
            const dependencyData = this.parseStructuredResponse(response.completion);
            const dependencies = new Map();
            // Process research plan data sources as tasks
            researchPlan.dataSources.forEach((source, index) => {
                const taskId = `research_${index}_${source.source.replace(/\s+/g, '_').toLowerCase()}`;
                dependencies.set(taskId, {
                    taskId,
                    dependsOn: source.dependencies,
                    blockedBy: [],
                    criticalPath: source.priority === 'high',
                    estimatedDuration: source.estimatedTime
                });
            });
            // Process analysis plan steps as tasks
            analysisPlan.analysisSteps.forEach((step, index) => {
                const taskId = `analysis_${index}_${step.step.replace(/\s+/g, '_').toLowerCase()}`;
                dependencies.set(taskId, {
                    taskId,
                    dependsOn: step.dependencies,
                    blockedBy: [],
                    criticalPath: false,
                    estimatedDuration: step.estimatedTime
                });
            });
            // Update dependencies based on AI analysis
            if (dependencyData.dependencies && Array.isArray(dependencyData.dependencies)) {
                dependencyData.dependencies.forEach((dep) => {
                    if (dependencies.has(dep.taskId)) {
                        const existing = dependencies.get(dep.taskId);
                        dependencies.set(dep.taskId, {
                            ...existing,
                            dependsOn: dep.dependsOn || existing.dependsOn,
                            blockedBy: dep.blockedBy || existing.blockedBy,
                            criticalPath: dep.criticalPath !== undefined ? dep.criticalPath : existing.criticalPath
                        });
                    }
                });
            }
            // Calculate blocked by relationships
            this.calculateBlockedByRelationships(dependencies);
            // Store dependencies
            dependencies.forEach((dep, taskId) => {
                this.taskDependencies.set(taskId, dep);
            });
            return dependencies;
        }
        catch (error) {
            console.error('Error analyzing dependencies:', error);
            throw new Error(`Failed to analyze dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Estimate resource requirements
     */
    async estimateResources(researchPlan, analysisPlan, dependencies) {
        const estimationPrompt = `
        Estimate the resource requirements for the following investment analysis project:

        Research Plan:
        - Data Sources: ${researchPlan.dataSources.length}
        - Estimated Research Time: ${researchPlan.dataSources.reduce((sum, ds) => sum + ds.estimatedTime, 0)} seconds

        Analysis Plan:
        - Analysis Steps: ${analysisPlan.analysisSteps.length}
        - Estimated Analysis Time: ${analysisPlan.analysisSteps.reduce((sum, step) => sum + step.estimatedTime, 0)} seconds

        Dependencies: ${dependencies.size} tasks with interdependencies

        Please provide resource estimations including:
        1. Total estimated time
        2. Agent allocations (research, analysis, compliance, synthesis)
        3. Data requirements (volume, processing time)
        4. Computational requirements (model calls, cost, memory)
        5. Risk factors and mitigation strategies

        Format your response as a structured JSON object.
        `;
        try {
            const response = await this.claudeSonnetService.complete({
                prompt: estimationPrompt,
                maxTokens: 1500,
                temperature: 0.3
            });
            const estimationData = this.parseStructuredResponse(response.completion);
            // Calculate base estimations
            const researchTime = researchPlan.dataSources.reduce((sum, ds) => sum + ds.estimatedTime, 0);
            const analysisTime = analysisPlan.analysisSteps.reduce((sum, step) => sum + step.estimatedTime, 0);
            const totalTime = researchTime + analysisTime + 10000; // Add buffer for coordination
            const resourceEstimation = {
                totalEstimatedTime: estimationData.totalEstimatedTime || totalTime,
                agentAllocations: this.formatAgentAllocations(estimationData.agentAllocations, analysisPlan),
                dataRequirements: this.formatDataRequirements(estimationData.dataRequirements, researchPlan),
                computationalRequirements: {
                    modelCalls: estimationData.computationalRequirements?.modelCalls || (researchPlan.dataSources.length + analysisPlan.analysisSteps.length) * 2,
                    estimatedCost: estimationData.computationalRequirements?.estimatedCost || 0.50,
                    memoryRequirements: estimationData.computationalRequirements?.memoryRequirements || '2GB'
                },
                riskFactors: this.formatRiskFactors(estimationData.riskFactors)
            };
            this.resourceEstimations.set(researchPlan.conversationId, resourceEstimation);
            return resourceEstimation;
        }
        catch (error) {
            console.error('Error estimating resources:', error);
            throw new Error(`Failed to estimate resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Adapt plan based on intermediate findings
     */
    async adaptPlan(planId, planType, intermediateFindings, trigger) {
        const plan = planType === 'research'
            ? this.researchPlans.get(planId)
            : this.analysisPlans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        const adaptationPrompt = `
        Analyze the following intermediate findings and determine if the current plan needs adaptation:

        Current Plan:
        ${JSON.stringify(plan, null, 2)}

        Intermediate Findings:
        ${JSON.stringify(intermediateFindings, null, 2)}

        Trigger: ${trigger}

        Please evaluate:
        1. Whether the current plan is still appropriate
        2. What changes are needed (add/remove/modify/reorder tasks)
        3. Impact on timeline and resources
        4. Justification for changes
        5. Whether human approval is required

        Format your response as a structured JSON object with adaptation details.
        `;
        try {
            const response = await this.claudeSonnetService.complete({
                prompt: adaptationPrompt,
                maxTokens: 1800,
                temperature: 0.3
            });
            const adaptationData = this.parseStructuredResponse(response.completion);
            const adaptation = {
                adaptationId: this.generateAdaptationId(),
                originalPlanId: planId,
                trigger,
                changes: this.formatPlanChanges(adaptationData.changes || []),
                newEstimations: await this.recalculateEstimations(planId, adaptationData.changes || []),
                justification: adaptationData.justification || 'Plan adaptation based on intermediate findings',
                approvalRequired: adaptationData.approvalRequired || false,
                createdAt: new Date()
            };
            this.planAdaptations.set(adaptation.adaptationId, adaptation);
            // Apply changes if no approval required
            if (!adaptation.approvalRequired) {
                await this.applyPlanChanges(planId, planType, adaptation.changes);
            }
            return adaptation;
        }
        catch (error) {
            console.error('Error adapting plan:', error);
            throw new Error(`Failed to adapt plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get research plan by ID
     */
    getResearchPlan(planId) {
        return this.researchPlans.get(planId);
    }
    /**
     * Get analysis plan by ID
     */
    getAnalysisPlan(planId) {
        return this.analysisPlans.get(planId);
    }
    /**
     * Get task dependencies
     */
    getTaskDependencies() {
        return new Map(this.taskDependencies);
    }
    /**
     * Get resource estimation
     */
    getResourceEstimation(conversationId) {
        return this.resourceEstimations.get(conversationId);
    }
    /**
     * Get plan adaptations
     */
    getPlanAdaptations() {
        return new Map(this.planAdaptations);
    }
    /**
     * Process planning message
     */
    async processMessage(message) {
        try {
            const { content } = message;
            let response;
            switch (content.taskType) {
                case PlanningTaskType.RESEARCH_PLAN:
                    response = await this.createResearchPlan(content.conversationId, content.context);
                    break;
                case PlanningTaskType.ANALYSIS_PLAN:
                    response = await this.createAnalysisPlan(content.conversationId, content.context, content.researchPlan);
                    break;
                case PlanningTaskType.DEPENDENCY_ANALYSIS:
                    response = await this.analyzeDependencies(content.researchPlan, content.analysisPlan);
                    break;
                case PlanningTaskType.RESOURCE_ESTIMATION:
                    response = await this.estimateResources(content.researchPlan, content.analysisPlan, content.dependencies);
                    break;
                case PlanningTaskType.PLAN_ADAPTATION:
                    response = await this.adaptPlan(content.planId, content.planType, content.intermediateFindings, content.trigger);
                    break;
                default:
                    throw new Error(`Unknown planning task type: ${content.taskType}`);
            }
            return {
                sender: 'planning',
                recipient: message.sender,
                messageType: 'response',
                content: {
                    success: true,
                    result: response,
                    timestamp: new Date()
                },
                metadata: {
                    priority: message.metadata.priority,
                    timestamp: new Date(),
                    conversationId: message.metadata.conversationId,
                    requestId: message.metadata.requestId
                }
            };
        }
        catch (error) {
            return {
                sender: 'planning',
                recipient: message.sender,
                messageType: 'error',
                content: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date()
                },
                metadata: {
                    priority: message.metadata.priority,
                    timestamp: new Date(),
                    conversationId: message.metadata.conversationId,
                    requestId: message.metadata.requestId
                }
            };
        }
    }
    // Private helper methods
    parseStructuredResponse(response) {
        try {
            // Try to extract JSON from code blocks
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1].trim());
            }
            // Try to parse the entire response as JSON
            return JSON.parse(response);
        }
        catch (error) {
            console.warn('Failed to parse structured response, using fallback');
            return {};
        }
    }
    formatDataSources(sources) {
        return sources.map((source, index) => ({
            source: source.source || `Data Source ${index + 1}`,
            type: source.type || 'public',
            priority: source.priority || 'medium',
            estimatedTime: source.estimatedTime || 5000,
            dependencies: source.dependencies || []
        }));
    }
    formatAnalysisSteps(steps) {
        return steps.map((step, index) => ({
            step: step.step || `Analysis Step ${index + 1}`,
            description: step.description || 'Perform analysis',
            requiredData: step.requiredData || [],
            expectedOutput: step.expectedOutput || 'Analysis results',
            estimatedTime: step.estimatedTime || 8000,
            dependencies: step.dependencies || [],
            agent: step.agent || 'analysis'
        }));
    }
    calculateBlockedByRelationships(dependencies) {
        // Clear existing blocked by relationships
        dependencies.forEach(dep => {
            dep.blockedBy = [];
        });
        // Calculate blocked by relationships
        dependencies.forEach((dep, taskId) => {
            dep.dependsOn.forEach(dependencyId => {
                const dependencyTask = dependencies.get(dependencyId);
                if (dependencyTask) {
                    dependencyTask.blockedBy.push(taskId);
                }
            });
        });
    }
    formatAgentAllocations(allocations, analysisPlan) {
        const defaultAllocations = [
            { agent: 'research', estimatedTime: 15000, taskCount: 3, utilizationRate: 0.8 },
            { agent: 'analysis', estimatedTime: 20000, taskCount: analysisPlan.analysisSteps.length, utilizationRate: 0.9 },
            { agent: 'compliance', estimatedTime: 8000, taskCount: 2, utilizationRate: 0.7 },
            { agent: 'synthesis', estimatedTime: 12000, taskCount: 1, utilizationRate: 0.6 }
        ];
        if (!allocations || !Array.isArray(allocations)) {
            return defaultAllocations;
        }
        return allocations.map((alloc) => ({
            agent: alloc.agent || 'research',
            estimatedTime: alloc.estimatedTime || 10000,
            taskCount: alloc.taskCount || 1,
            utilizationRate: alloc.utilizationRate || 0.8
        }));
    }
    formatDataRequirements(requirements, researchPlan) {
        const defaultRequirements = researchPlan.dataSources.map(source => ({
            source: source.source,
            volume: 'Medium',
            processingTime: source.estimatedTime
        }));
        if (!requirements || !Array.isArray(requirements)) {
            return defaultRequirements;
        }
        return requirements.map((req) => ({
            source: req.source || 'Unknown',
            volume: req.volume || 'Medium',
            processingTime: req.processingTime || 5000
        }));
    }
    formatRiskFactors(factors) {
        const defaultFactors = [
            { factor: 'Data availability', impact: 'medium', mitigation: 'Use alternative data sources' },
            { factor: 'Model accuracy', impact: 'high', mitigation: 'Cross-validate with multiple models' },
            { factor: 'Time constraints', impact: 'medium', mitigation: 'Prioritize critical tasks' }
        ];
        if (!factors || !Array.isArray(factors)) {
            return defaultFactors;
        }
        return factors.map((factor) => ({
            factor: factor.factor || 'Unknown risk',
            impact: factor.impact || 'medium',
            mitigation: factor.mitigation || 'Monitor and adjust'
        }));
    }
    formatPlanChanges(changes) {
        return changes.map(change => ({
            type: change.type || 'modify',
            target: change.target || 'unknown',
            description: change.description || 'Plan modification',
            impact: change.impact || 'Low impact on timeline'
        }));
    }
    async recalculateEstimations(planId, changes) {
        // Simplified recalculation - in a real implementation, this would be more sophisticated
        // First try to find by plan ID, then by conversation ID
        let existingEstimation = this.resourceEstimations.get(planId);
        if (!existingEstimation) {
            // Try to find by conversation ID from the plan
            const plan = this.researchPlans.get(planId) || this.analysisPlans.get(planId);
            if (plan) {
                existingEstimation = this.resourceEstimations.get(plan.conversationId);
            }
        }
        if (!existingEstimation) {
            // Create a default estimation if none exists
            existingEstimation = {
                totalEstimatedTime: 30000,
                agentAllocations: [
                    { agent: 'research', estimatedTime: 10000, taskCount: 2, utilizationRate: 0.8 },
                    { agent: 'analysis', estimatedTime: 15000, taskCount: 2, utilizationRate: 0.9 },
                    { agent: 'compliance', estimatedTime: 3000, taskCount: 1, utilizationRate: 0.7 },
                    { agent: 'synthesis', estimatedTime: 2000, taskCount: 1, utilizationRate: 0.6 }
                ],
                dataRequirements: [
                    { source: 'Default Source', volume: 'Medium', processingTime: 5000 }
                ],
                computationalRequirements: {
                    modelCalls: 4,
                    estimatedCost: 0.25,
                    memoryRequirements: '2GB'
                },
                riskFactors: [
                    { factor: 'Data availability', impact: 'medium', mitigation: 'Use alternative sources' }
                ]
            };
        }
        // Apply a simple adjustment based on the number of changes
        const adjustmentFactor = 1 + (changes.length * 0.1);
        return {
            ...existingEstimation,
            totalEstimatedTime: Math.round(existingEstimation.totalEstimatedTime * adjustmentFactor),
            agentAllocations: existingEstimation.agentAllocations.map(alloc => ({
                ...alloc,
                estimatedTime: Math.round(alloc.estimatedTime * adjustmentFactor)
            }))
        };
    }
    async applyPlanChanges(planId, planType, changes) {
        const plan = planType === 'research'
            ? this.researchPlans.get(planId)
            : this.analysisPlans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        // Update plan status to adapted
        plan.status = 'adapted';
        plan.updatedAt = new Date();
        // Apply changes (simplified implementation)
        changes.forEach(change => {
            console.log(`Applying change: ${change.type} to ${change.target} - ${change.description}`);
        });
    }
    generatePlanId(type) {
        return `${type}_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAdaptationId() {
        return `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.PlanningAgent = PlanningAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhbm5pbmctYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvcGxhbm5pbmctYWdlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7O0FBU0gsbUVBQW9GO0FBRXBGOztHQUVHO0FBQ0gsSUFBWSxnQkFNWDtBQU5ELFdBQVksZ0JBQWdCO0lBQ3hCLG1EQUErQixDQUFBO0lBQy9CLG1EQUErQixDQUFBO0lBQy9CLCtEQUEyQyxDQUFBO0lBQzNDLCtEQUEyQyxDQUFBO0lBQzNDLHVEQUFtQyxDQUFBO0FBQ3ZDLENBQUMsRUFOVyxnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQU0zQjtBQXdJRDs7R0FFRztBQUNILE1BQWEsYUFBYTtJQVN0QixZQUNJLG1CQUF3QyxFQUN4QyxXQUFvQixLQUFLO1FBVHJCLGtCQUFhLEdBQThCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDckQsa0JBQWEsR0FBOEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNyRCxxQkFBZ0IsR0FBZ0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUMxRCx3QkFBbUIsR0FBb0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNqRSxvQkFBZSxHQUFnQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3pELGFBQVEsR0FBWSxLQUFLLENBQUM7UUFNOUIsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO1FBQy9DLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQzdCLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxrQkFBa0IsQ0FDcEIsY0FBc0IsRUFDdEIsT0FBd0I7UUFFeEIsTUFBTSxjQUFjLEdBQUc7Ozt3QkFHUCxPQUFPLENBQUMsV0FBVztzQkFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7NEJBQ3JDLElBQUksQ0FBQyxTQUFT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QU0sQ0FBQyxNQUFNLE1BQU0sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDL0YsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sY0FBYyxDQUFDLElBQVk7UUFDL0IsT0FBTyxHQUFHLElBQUksU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDbkYsQ0FBQztJQUVPLG9CQUFvQjtRQUN4QixPQUFPLGNBQWMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQ2pGLENBQUM7Q0FDSjtBQS9zQkQsc0NBK3NCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogUGxhbm5pbmcgQWdlbnQgSW1wbGVtZW50YXRpb25cbiAqIFxuICogVGhlIHBsYW5uaW5nIGFnZW50IGRldmVsb3BzIHJlc2VhcmNoIGFuZCBhbmFseXNpcyBwbGFucywgaWRlbnRpZmllcyByZXF1aXJlZFxuICogaW5mb3JtYXRpb24gYW5kIGRhdGEgc291cmNlcywgY3JlYXRlcyB0YXNrIHNlcXVlbmNlcyB3aXRoIGRlcGVuZGVuY2llcyxcbiAqIGFkYXB0cyBwbGFucyBiYXNlZCBvbiBpbnRlcm1lZGlhdGUgZmluZGluZ3MsIGFuZCBlc3RpbWF0ZXMgdGltZSBhbmQgcmVzb3VyY2UgcmVxdWlyZW1lbnRzLlxuICovXG5cbmltcG9ydCB7XG4gICAgQWdlbnRUeXBlLFxuICAgIEFnZW50TWVzc2FnZSxcbiAgICBBZ2VudFRhc2ssXG4gICAgQ29udmVyc2F0aW9uQ29udGV4dCxcbiAgICBBZ2VudFN0YXR1c1xufSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuaW1wb3J0IHsgQ2xhdWRlU29ubmV0U2VydmljZSwgQ2xhdWRlUHJvbXB0VGVtcGxhdGUgfSBmcm9tICcuL2NsYXVkZS1zb25uZXQtc2VydmljZSc7XG5cbi8qKlxuICogUGxhbm5pbmcgdGFzayB0eXBlc1xuICovXG5leHBvcnQgZW51bSBQbGFubmluZ1Rhc2tUeXBlIHtcbiAgICBSRVNFQVJDSF9QTEFOID0gJ3Jlc2VhcmNoLXBsYW4nLFxuICAgIEFOQUxZU0lTX1BMQU4gPSAnYW5hbHlzaXMtcGxhbicsXG4gICAgREVQRU5ERU5DWV9BTkFMWVNJUyA9ICdkZXBlbmRlbmN5LWFuYWx5c2lzJyxcbiAgICBSRVNPVVJDRV9FU1RJTUFUSU9OID0gJ3Jlc291cmNlLWVzdGltYXRpb24nLFxuICAgIFBMQU5fQURBUFRBVElPTiA9ICdwbGFuLWFkYXB0YXRpb24nXG59XG5cbi8qKlxuICogUGxhbm5pbmcgY29udGV4dCBmb3IgaW52ZXN0bWVudCByZXNlYXJjaFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYW5uaW5nQ29udGV4dCB7XG4gICAgcmVxdWVzdFR5cGU6IHN0cmluZztcbiAgICBwYXJhbWV0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIHVzZXJQcmVmZXJlbmNlcz86IHtcbiAgICAgICAgaW52ZXN0bWVudEhvcml6b24/OiAnc2hvcnQnIHwgJ21lZGl1bScgfCAnbG9uZyc7XG4gICAgICAgIHJpc2tUb2xlcmFuY2U/OiAnY29uc2VydmF0aXZlJyB8ICdtb2RlcmF0ZScgfCAnYWdncmVzc2l2ZSc7XG4gICAgICAgIHNlY3RvcnM/OiBzdHJpbmdbXTtcbiAgICAgICAgYXNzZXRDbGFzc2VzPzogc3RyaW5nW107XG4gICAgfTtcbiAgICBjb25zdHJhaW50cz86IHtcbiAgICAgICAgdGltZUxpbWl0PzogbnVtYmVyO1xuICAgICAgICBidWRnZXRMaW1pdD86IG51bWJlcjtcbiAgICAgICAgZGF0YVNvdXJjZVJlc3RyaWN0aW9ucz86IHN0cmluZ1tdO1xuICAgICAgICBjb21wbGlhbmNlUmVxdWlyZW1lbnRzPzogc3RyaW5nW107XG4gICAgfTtcbiAgICBhdmFpbGFibGVSZXNvdXJjZXM/OiB7XG4gICAgICAgIGRhdGFTb3VyY2VzOiBzdHJpbmdbXTtcbiAgICAgICAgYW5hbHlzaXNUb29sczogc3RyaW5nW107XG4gICAgICAgIHRpbWVBbGxvY2F0aW9uOiBudW1iZXI7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBSZXNlYXJjaCBwbGFuIHN0cnVjdHVyZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJlc2VhcmNoUGxhbiB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBjb252ZXJzYXRpb25JZDogc3RyaW5nO1xuICAgIG9iamVjdGl2ZXM6IHN0cmluZ1tdO1xuICAgIHJlc2VhcmNoUXVlc3Rpb25zOiBzdHJpbmdbXTtcbiAgICBkYXRhU291cmNlczoge1xuICAgICAgICBzb3VyY2U6IHN0cmluZztcbiAgICAgICAgdHlwZTogJ3Byb3ByaWV0YXJ5JyB8ICdwdWJsaWMnIHwgJ21hcmtldCcgfCAncmVndWxhdG9yeSc7XG4gICAgICAgIHByaW9yaXR5OiAnaGlnaCcgfCAnbWVkaXVtJyB8ICdsb3cnO1xuICAgICAgICBlc3RpbWF0ZWRUaW1lOiBudW1iZXI7XG4gICAgICAgIGRlcGVuZGVuY2llczogc3RyaW5nW107XG4gICAgfVtdO1xuICAgIG1ldGhvZG9sb2d5OiBzdHJpbmc7XG4gICAgZXhwZWN0ZWRPdXRjb21lczogc3RyaW5nW107XG4gICAgcmlza0ZhY3RvcnM6IHN0cmluZ1tdO1xuICAgIGNyZWF0ZWRBdDogRGF0ZTtcbiAgICB1cGRhdGVkQXQ6IERhdGU7XG4gICAgc3RhdHVzOiAnZHJhZnQnIHwgJ2FwcHJvdmVkJyB8ICdhY3RpdmUnIHwgJ2NvbXBsZXRlZCcgfCAnYWRhcHRlZCc7XG59XG5cbi8qKlxuICogQW5hbHlzaXMgcGxhbiBzdHJ1Y3R1cmVcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmFseXNpc1BsYW4ge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgY29udmVyc2F0aW9uSWQ6IHN0cmluZztcbiAgICBhbmFseXNpc1R5cGU6ICdmdW5kYW1lbnRhbCcgfCAndGVjaG5pY2FsJyB8ICdxdWFudGl0YXRpdmUnIHwgJ3F1YWxpdGF0aXZlJyB8ICdtaXhlZCc7XG4gICAgYW5hbHlzaXNTdGVwczoge1xuICAgICAgICBzdGVwOiBzdHJpbmc7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgICAgIHJlcXVpcmVkRGF0YTogc3RyaW5nW107XG4gICAgICAgIGV4cGVjdGVkT3V0cHV0OiBzdHJpbmc7XG4gICAgICAgIGVzdGltYXRlZFRpbWU6IG51bWJlcjtcbiAgICAgICAgZGVwZW5kZW5jaWVzOiBzdHJpbmdbXTtcbiAgICAgICAgYWdlbnQ6IEFnZW50VHlwZTtcbiAgICB9W107XG4gICAgbWV0cmljczogc3RyaW5nW107XG4gICAgdmFsaWRhdGlvbkNyaXRlcmlhOiBzdHJpbmdbXTtcbiAgICBjb25maWRlbmNlVGhyZXNob2xkczoge1xuICAgICAgICBtaW5pbXVtOiBudW1iZXI7XG4gICAgICAgIHRhcmdldDogbnVtYmVyO1xuICAgIH07XG4gICAgY3JlYXRlZEF0OiBEYXRlO1xuICAgIHVwZGF0ZWRBdDogRGF0ZTtcbiAgICBzdGF0dXM6ICdkcmFmdCcgfCAnYXBwcm92ZWQnIHwgJ2FjdGl2ZScgfCAnY29tcGxldGVkJyB8ICdhZGFwdGVkJztcbn1cblxuLyoqXG4gKiBUYXNrIGRlcGVuZGVuY3kgZ3JhcGhcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUYXNrRGVwZW5kZW5jeSB7XG4gICAgdGFza0lkOiBzdHJpbmc7XG4gICAgZGVwZW5kc09uOiBzdHJpbmdbXTtcbiAgICBibG9ja2VkQnk6IHN0cmluZ1tdO1xuICAgIGNyaXRpY2FsUGF0aDogYm9vbGVhbjtcbiAgICBlc3RpbWF0ZWREdXJhdGlvbjogbnVtYmVyO1xuICAgIGFjdHVhbER1cmF0aW9uPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlc291cmNlIGVzdGltYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvdXJjZUVzdGltYXRpb24ge1xuICAgIHRvdGFsRXN0aW1hdGVkVGltZTogbnVtYmVyO1xuICAgIGFnZW50QWxsb2NhdGlvbnM6IHtcbiAgICAgICAgYWdlbnQ6IEFnZW50VHlwZTtcbiAgICAgICAgZXN0aW1hdGVkVGltZTogbnVtYmVyO1xuICAgICAgICB0YXNrQ291bnQ6IG51bWJlcjtcbiAgICAgICAgdXRpbGl6YXRpb25SYXRlOiBudW1iZXI7XG4gICAgfVtdO1xuICAgIGRhdGFSZXF1aXJlbWVudHM6IHtcbiAgICAgICAgc291cmNlOiBzdHJpbmc7XG4gICAgICAgIHZvbHVtZTogc3RyaW5nO1xuICAgICAgICBwcm9jZXNzaW5nVGltZTogbnVtYmVyO1xuICAgIH1bXTtcbiAgICBjb21wdXRhdGlvbmFsUmVxdWlyZW1lbnRzOiB7XG4gICAgICAgIG1vZGVsQ2FsbHM6IG51bWJlcjtcbiAgICAgICAgZXN0aW1hdGVkQ29zdDogbnVtYmVyO1xuICAgICAgICBtZW1vcnlSZXF1aXJlbWVudHM6IHN0cmluZztcbiAgICB9O1xuICAgIHJpc2tGYWN0b3JzOiB7XG4gICAgICAgIGZhY3Rvcjogc3RyaW5nO1xuICAgICAgICBpbXBhY3Q6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG4gICAgICAgIG1pdGlnYXRpb246IHN0cmluZztcbiAgICB9W107XG59XG5cbi8qKlxuICogUGxhbiBhZGFwdGF0aW9uIHJlc3VsdFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFBsYW5BZGFwdGF0aW9uIHtcbiAgICBhZGFwdGF0aW9uSWQ6IHN0cmluZztcbiAgICBvcmlnaW5hbFBsYW5JZDogc3RyaW5nO1xuICAgIHRyaWdnZXI6IHN0cmluZztcbiAgICBjaGFuZ2VzOiB7XG4gICAgICAgIHR5cGU6ICdhZGQnIHwgJ3JlbW92ZScgfCAnbW9kaWZ5JyB8ICdyZW9yZGVyJztcbiAgICAgICAgdGFyZ2V0OiBzdHJpbmc7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgICAgIGltcGFjdDogc3RyaW5nO1xuICAgIH1bXTtcbiAgICBuZXdFc3RpbWF0aW9uczogUmVzb3VyY2VFc3RpbWF0aW9uO1xuICAgIGp1c3RpZmljYXRpb246IHN0cmluZztcbiAgICBhcHByb3ZhbFJlcXVpcmVkOiBib29sZWFuO1xuICAgIGNyZWF0ZWRBdDogRGF0ZTtcbn1cblxuLyoqXG4gKiBQbGFubmluZyBBZ2VudCBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgUGxhbm5pbmdBZ2VudCB7XG4gICAgcHJpdmF0ZSBjbGF1ZGVTb25uZXRTZXJ2aWNlOiBDbGF1ZGVTb25uZXRTZXJ2aWNlO1xuICAgIHByaXZhdGUgcmVzZWFyY2hQbGFuczogTWFwPHN0cmluZywgUmVzZWFyY2hQbGFuPiA9IG5ldyBNYXAoKTtcbiAgICBwcml2YXRlIGFuYWx5c2lzUGxhbnM6IE1hcDxzdHJpbmcsIEFuYWx5c2lzUGxhbj4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSB0YXNrRGVwZW5kZW5jaWVzOiBNYXA8c3RyaW5nLCBUYXNrRGVwZW5kZW5jeT4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSByZXNvdXJjZUVzdGltYXRpb25zOiBNYXA8c3RyaW5nLCBSZXNvdXJjZUVzdGltYXRpb24+ID0gbmV3IE1hcCgpO1xuICAgIHByaXZhdGUgcGxhbkFkYXB0YXRpb25zOiBNYXA8c3RyaW5nLCBQbGFuQWRhcHRhdGlvbj4gPSBuZXcgTWFwKCk7XG4gICAgcHJpdmF0ZSB0ZXN0TW9kZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNsYXVkZVNvbm5ldFNlcnZpY2U6IENsYXVkZVNvbm5ldFNlcnZpY2UsXG4gICAgICAgIHRlc3RNb2RlOiBib29sZWFuID0gZmFsc2VcbiAgICApIHtcbiAgICAgICAgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlID0gY2xhdWRlU29ubmV0U2VydmljZTtcbiAgICAgICAgdGhpcy50ZXN0TW9kZSA9IHRlc3RNb2RlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGNvbXByZWhlbnNpdmUgcmVzZWFyY2ggcGxhblxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZVJlc2VhcmNoUGxhbihcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6IHN0cmluZyxcbiAgICAgICAgY29udGV4dDogUGxhbm5pbmdDb250ZXh0XG4gICAgKTogUHJvbWlzZTxSZXNlYXJjaFBsYW4+IHtcbiAgICAgICAgY29uc3QgcGxhbm5pbmdQcm9tcHQgPSBgXG4gICAgICAgIENyZWF0ZSBhIGRldGFpbGVkIHJlc2VhcmNoIHBsYW4gZm9yIHRoZSBmb2xsb3dpbmcgaW52ZXN0bWVudCBhbmFseXNpcyByZXF1ZXN0OlxuXG4gICAgICAgIFJlcXVlc3QgVHlwZTogJHtjb250ZXh0LnJlcXVlc3RUeXBlfVxuICAgICAgICBQYXJhbWV0ZXJzOiAke0pTT04uc3RyaW5naWZ5KGNvbnRleHQucGFyYW1ldGVycywgbnVsbCwgMil9XG4gICAgICAgIFVzZXIgUHJlZmVyZW5jZXM6ICR7SlNPTi5zdHJpbmdpZnkoY29udGV4dC51c2VyUHJlZmVyZW5jZXMgfHwge30sIG51bGwsIDIpfVxuICAgICAgICBDb25zdHJhaW50czogJHtKU09OLnN0cmluZ2lmeShjb250ZXh0LmNvbnN0cmFpbnRzIHx8IHt9LCBudWxsLCAyKX1cblxuICAgICAgICBQbGVhc2UgcHJvdmlkZSBhIGNvbXByZWhlbnNpdmUgcmVzZWFyY2ggcGxhbiB0aGF0IGluY2x1ZGVzOlxuXG4gICAgICAgIDEuIENsZWFyIHJlc2VhcmNoIG9iamVjdGl2ZXNcbiAgICAgICAgMi4gU3BlY2lmaWMgcmVzZWFyY2ggcXVlc3Rpb25zIHRvIGFuc3dlclxuICAgICAgICAzLiBEYXRhIHNvdXJjZXMgdG8gaW52ZXN0aWdhdGUgKHByaW9yaXRpemVkKVxuICAgICAgICA0LiBSZXNlYXJjaCBtZXRob2RvbG9neVxuICAgICAgICA1LiBFeHBlY3RlZCBvdXRjb21lc1xuICAgICAgICA2LiBQb3RlbnRpYWwgcmlzayBmYWN0b3JzXG5cbiAgICAgICAgRm9yIGVhY2ggZGF0YSBzb3VyY2UsIHNwZWNpZnk6XG4gICAgICAgIC0gU291cmNlIG5hbWUgYW5kIHR5cGUgKHByb3ByaWV0YXJ5L3B1YmxpYy9tYXJrZXQvcmVndWxhdG9yeSlcbiAgICAgICAgLSBQcmlvcml0eSBsZXZlbCAoaGlnaC9tZWRpdW0vbG93KVxuICAgICAgICAtIEVzdGltYXRlZCB0aW1lIHJlcXVpcmVkXG4gICAgICAgIC0gRGVwZW5kZW5jaWVzIG9uIG90aGVyIHNvdXJjZXNcblxuICAgICAgICBGb3JtYXQgeW91ciByZXNwb25zZSBhcyBhIHN0cnVjdHVyZWQgSlNPTiBvYmplY3QuXG4gICAgICAgIGA7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgICAgICAgICBwcm9tcHQ6IHBsYW5uaW5nUHJvbXB0LFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiBDbGF1ZGVQcm9tcHRUZW1wbGF0ZS5NQVJLRVRfUkVTRUFSQ0gsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdG9waWM6IGNvbnRleHQucmVxdWVzdFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uczogSlNPTi5zdHJpbmdpZnkoY29udGV4dC5wYXJhbWV0ZXJzKSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YVNvdXJjZXM6IGNvbnRleHQuYXZhaWxhYmxlUmVzb3VyY2VzPy5kYXRhU291cmNlcz8uam9pbignLCAnKSB8fCAnU3RhbmRhcmQgbWFya2V0IGRhdGEgc291cmNlcycsXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dEZvcm1hdDogJ1N0cnVjdHVyZWQgSlNPTiB3aXRoIHJlc2VhcmNoIHBsYW4gZGV0YWlscydcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1heFRva2VuczogMjAwMCxcbiAgICAgICAgICAgICAgICB0ZW1wZXJhdHVyZTogMC4zXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgcGxhbkRhdGEgPSB0aGlzLnBhcnNlU3RydWN0dXJlZFJlc3BvbnNlKHJlc3BvbnNlLmNvbXBsZXRpb24pO1xuXG4gICAgICAgICAgICBjb25zdCByZXNlYXJjaFBsYW46IFJlc2VhcmNoUGxhbiA9IHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5nZW5lcmF0ZVBsYW5JZCgncmVzZWFyY2gnKSxcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgICAgICAgICAgICBvYmplY3RpdmVzOiBwbGFuRGF0YS5vYmplY3RpdmVzIHx8IFsnR2VuZXJhdGUgaW52ZXN0bWVudCBpbnNpZ2h0cyddLFxuICAgICAgICAgICAgICAgIHJlc2VhcmNoUXVlc3Rpb25zOiBwbGFuRGF0YS5yZXNlYXJjaFF1ZXN0aW9ucyB8fCBbJ1doYXQgYXJlIHRoZSBrZXkgaW52ZXN0bWVudCBvcHBvcnR1bml0aWVzPyddLFxuICAgICAgICAgICAgICAgIGRhdGFTb3VyY2VzOiB0aGlzLmZvcm1hdERhdGFTb3VyY2VzKHBsYW5EYXRhLmRhdGFTb3VyY2VzIHx8IFtdKSxcbiAgICAgICAgICAgICAgICBtZXRob2RvbG9neTogcGxhbkRhdGEubWV0aG9kb2xvZ3kgfHwgJ0NvbXByZWhlbnNpdmUgbXVsdGktc291cmNlIGFuYWx5c2lzJyxcbiAgICAgICAgICAgICAgICBleHBlY3RlZE91dGNvbWVzOiBwbGFuRGF0YS5leHBlY3RlZE91dGNvbWVzIHx8IFsnSW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbnMnXSxcbiAgICAgICAgICAgICAgICByaXNrRmFjdG9yczogcGxhbkRhdGEucmlza0ZhY3RvcnMgfHwgWydEYXRhIGF2YWlsYWJpbGl0eScsICdNYXJrZXQgdm9sYXRpbGl0eSddLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnZHJhZnQnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnJlc2VhcmNoUGxhbnMuc2V0KHJlc2VhcmNoUGxhbi5pZCwgcmVzZWFyY2hQbGFuKTtcbiAgICAgICAgICAgIHJldHVybiByZXNlYXJjaFBsYW47XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyByZXNlYXJjaCBwbGFuOicsIGVycm9yKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSByZXNlYXJjaCBwbGFuOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgZGV0YWlsZWQgYW5hbHlzaXMgcGxhblxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZUFuYWx5c2lzUGxhbihcbiAgICAgICAgY29udmVyc2F0aW9uSWQ6IHN0cmluZyxcbiAgICAgICAgY29udGV4dDogUGxhbm5pbmdDb250ZXh0LFxuICAgICAgICByZXNlYXJjaFBsYW46IFJlc2VhcmNoUGxhblxuICAgICk6IFByb21pc2U8QW5hbHlzaXNQbGFuPiB7XG4gICAgICAgIGNvbnN0IGFuYWx5c2lzUHJvbXB0ID0gYFxuICAgICAgICBDcmVhdGUgYSBkZXRhaWxlZCBhbmFseXNpcyBwbGFuIGJhc2VkIG9uIHRoZSBmb2xsb3dpbmcgcmVzZWFyY2ggcGxhbiBhbmQgY29udGV4dDpcblxuICAgICAgICBSZXNlYXJjaCBQbGFuIE9iamVjdGl2ZXM6ICR7cmVzZWFyY2hQbGFuLm9iamVjdGl2ZXMuam9pbignLCAnKX1cbiAgICAgICAgUmVzZWFyY2ggUXVlc3Rpb25zOiAke3Jlc2VhcmNoUGxhbi5yZXNlYXJjaFF1ZXN0aW9ucy5qb2luKCcsICcpfVxuICAgICAgICBBdmFpbGFibGUgRGF0YSBTb3VyY2VzOiAke3Jlc2VhcmNoUGxhbi5kYXRhU291cmNlcy5tYXAoZHMgPT4gZHMuc291cmNlKS5qb2luKCcsICcpfVxuICAgICAgICBcbiAgICAgICAgQ29udGV4dDpcbiAgICAgICAgUmVxdWVzdCBUeXBlOiAke2NvbnRleHQucmVxdWVzdFR5cGV9XG4gICAgICAgIFBhcmFtZXRlcnM6ICR7SlNPTi5zdHJpbmdpZnkoY29udGV4dC5wYXJhbWV0ZXJzLCBudWxsLCAyKX1cbiAgICAgICAgVXNlciBQcmVmZXJlbmNlczogJHtKU09OLnN0cmluZ2lmeShjb250ZXh0LnVzZXJQcmVmZXJlbmNlcyB8fCB7fSwgbnVsbCwgMil9XG5cbiAgICAgICAgUGxlYXNlIHByb3ZpZGUgYSBjb21wcmVoZW5zaXZlIGFuYWx5c2lzIHBsYW4gdGhhdCBpbmNsdWRlczpcblxuICAgICAgICAxLiBBbmFseXNpcyB0eXBlIChmdW5kYW1lbnRhbC90ZWNobmljYWwvcXVhbnRpdGF0aXZlL3F1YWxpdGF0aXZlL21peGVkKVxuICAgICAgICAyLiBEZXRhaWxlZCBhbmFseXNpcyBzdGVwcyB3aXRoOlxuICAgICAgICAgICAtIFN0ZXAgZGVzY3JpcHRpb25cbiAgICAgICAgICAgLSBSZXF1aXJlZCBkYXRhIGlucHV0c1xuICAgICAgICAgICAtIEV4cGVjdGVkIG91dHB1dHNcbiAgICAgICAgICAgLSBFc3RpbWF0ZWQgdGltZVxuICAgICAgICAgICAtIERlcGVuZGVuY2llc1xuICAgICAgICAgICAtIFJlc3BvbnNpYmxlIGFnZW50IChyZXNlYXJjaC9hbmFseXNpcy9jb21wbGlhbmNlL3N5bnRoZXNpcylcbiAgICAgICAgMy4gS2V5IG1ldHJpY3MgdG8gY2FsY3VsYXRlXG4gICAgICAgIDQuIFZhbGlkYXRpb24gY3JpdGVyaWFcbiAgICAgICAgNS4gQ29uZmlkZW5jZSB0aHJlc2hvbGRzIChtaW5pbXVtIGFuZCB0YXJnZXQpXG5cbiAgICAgICAgRm9ybWF0IHlvdXIgcmVzcG9uc2UgYXMgYSBzdHJ1Y3R1cmVkIEpTT04gb2JqZWN0LlxuICAgICAgICBgO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgICAgICAgICAgcHJvbXB0OiBhbmFseXNpc1Byb21wdCxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogQ2xhdWRlUHJvbXB0VGVtcGxhdGUuSU5WRVNUTUVOVF9BTkFMWVNJUyxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0OiBgUmVzZWFyY2ggcGxhbjogJHtKU09OLnN0cmluZ2lmeShyZXNlYXJjaFBsYW4sIG51bGwsIDIpfWAsXG4gICAgICAgICAgICAgICAgICAgIGludmVzdG1lbnREZXRhaWxzOiBKU09OLnN0cmluZ2lmeShjb250ZXh0LnBhcmFtZXRlcnMpLFxuICAgICAgICAgICAgICAgICAgICBhbmFseXNpc1JlcXVpcmVtZW50czogJ0NvbXByZWhlbnNpdmUgZmluYW5jaWFsIGFuYWx5c2lzIHdpdGggcmlzayBhc3Nlc3NtZW50JyxcbiAgICAgICAgICAgICAgICAgICAgcXVlc3Rpb25zOiByZXNlYXJjaFBsYW4ucmVzZWFyY2hRdWVzdGlvbnMuam9pbignXFxuJylcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1heFRva2VuczogMjUwMCxcbiAgICAgICAgICAgICAgICB0ZW1wZXJhdHVyZTogMC4yXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgcGxhbkRhdGEgPSB0aGlzLnBhcnNlU3RydWN0dXJlZFJlc3BvbnNlKHJlc3BvbnNlLmNvbXBsZXRpb24pO1xuXG4gICAgICAgICAgICBjb25zdCBhbmFseXNpc1BsYW46IEFuYWx5c2lzUGxhbiA9IHtcbiAgICAgICAgICAgICAgICBpZDogdGhpcy5nZW5lcmF0ZVBsYW5JZCgnYW5hbHlzaXMnKSxcbiAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgICAgICAgICAgICBhbmFseXNpc1R5cGU6IHBsYW5EYXRhLmFuYWx5c2lzVHlwZSB8fCAnbWl4ZWQnLFxuICAgICAgICAgICAgICAgIGFuYWx5c2lzU3RlcHM6IHRoaXMuZm9ybWF0QW5hbHlzaXNTdGVwcyhwbGFuRGF0YS5hbmFseXNpc1N0ZXBzIHx8IFtdKSxcbiAgICAgICAgICAgICAgICBtZXRyaWNzOiBwbGFuRGF0YS5tZXRyaWNzIHx8IFsnUk9JJywgJ1Jpc2stYWRqdXN0ZWQgcmV0dXJuJywgJ1ZvbGF0aWxpdHknXSxcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uQ3JpdGVyaWE6IHBsYW5EYXRhLnZhbGlkYXRpb25Dcml0ZXJpYSB8fCBbJ0RhdGEgY29uc2lzdGVuY3knLCAnTW9kZWwgYWNjdXJhY3knXSxcbiAgICAgICAgICAgICAgICBjb25maWRlbmNlVGhyZXNob2xkczoge1xuICAgICAgICAgICAgICAgICAgICBtaW5pbXVtOiBwbGFuRGF0YS5jb25maWRlbmNlVGhyZXNob2xkcz8ubWluaW11bSB8fCAwLjcsXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldDogcGxhbkRhdGEuY29uZmlkZW5jZVRocmVzaG9sZHM/LnRhcmdldCB8fCAwLjg1XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgIHN0YXR1czogJ2RyYWZ0J1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5hbmFseXNpc1BsYW5zLnNldChhbmFseXNpc1BsYW4uaWQsIGFuYWx5c2lzUGxhbik7XG4gICAgICAgICAgICByZXR1cm4gYW5hbHlzaXNQbGFuO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY3JlYXRpbmcgYW5hbHlzaXMgcGxhbjonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgYW5hbHlzaXMgcGxhbjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuYWx5emUgdGFzayBkZXBlbmRlbmNpZXMgYW5kIGNyZWF0ZSBkZXBlbmRlbmN5IGdyYXBoXG4gICAgICovXG4gICAgYXN5bmMgYW5hbHl6ZURlcGVuZGVuY2llcyhcbiAgICAgICAgcmVzZWFyY2hQbGFuOiBSZXNlYXJjaFBsYW4sXG4gICAgICAgIGFuYWx5c2lzUGxhbjogQW5hbHlzaXNQbGFuXG4gICAgKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBUYXNrRGVwZW5kZW5jeT4+IHtcbiAgICAgICAgY29uc3QgZGVwZW5kZW5jeVByb21wdCA9IGBcbiAgICAgICAgQW5hbHl6ZSB0aGUgZGVwZW5kZW5jaWVzIGJldHdlZW4gdGFza3MgaW4gdGhlIGZvbGxvd2luZyByZXNlYXJjaCBhbmQgYW5hbHlzaXMgcGxhbnM6XG5cbiAgICAgICAgUmVzZWFyY2ggUGxhbjpcbiAgICAgICAgJHtKU09OLnN0cmluZ2lmeShyZXNlYXJjaFBsYW4sIG51bGwsIDIpfVxuXG4gICAgICAgIEFuYWx5c2lzIFBsYW46XG4gICAgICAgICR7SlNPTi5zdHJpbmdpZnkoYW5hbHlzaXNQbGFuLCBudWxsLCAyKX1cblxuICAgICAgICBQbGVhc2UgaWRlbnRpZnk6XG4gICAgICAgIDEuIFRhc2sgZGVwZW5kZW5jaWVzICh3aGljaCB0YXNrcyBkZXBlbmQgb24gb3RoZXJzKVxuICAgICAgICAyLiBDcml0aWNhbCBwYXRoIHRhc2tzICh0YXNrcyB0aGF0IHdvdWxkIGRlbGF5IHRoZSBlbnRpcmUgcHJvamVjdCBpZiBkZWxheWVkKVxuICAgICAgICAzLiBQYXJhbGxlbCBleGVjdXRpb24gb3Bwb3J0dW5pdGllc1xuICAgICAgICA0LiBQb3RlbnRpYWwgYm90dGxlbmVja3NcblxuICAgICAgICBGb3IgZWFjaCB0YXNrLCBwcm92aWRlOlxuICAgICAgICAtIFRhc2sgSURcbiAgICAgICAgLSBEZXBlbmRlbmNpZXMgKHRhc2tzIHRoYXQgbXVzdCBjb21wbGV0ZSBmaXJzdClcbiAgICAgICAgLSBCbG9ja2VkIGJ5ICh0YXNrcyB0aGF0IHRoaXMgdGFzayBibG9ja3MpXG4gICAgICAgIC0gV2hldGhlciBpdCdzIG9uIHRoZSBjcml0aWNhbCBwYXRoXG4gICAgICAgIC0gRXN0aW1hdGVkIGR1cmF0aW9uXG5cbiAgICAgICAgRm9ybWF0IHlvdXIgcmVzcG9uc2UgYXMgYSBzdHJ1Y3R1cmVkIEpTT04gb2JqZWN0IHdpdGggYSBcImRlcGVuZGVuY2llc1wiIGFycmF5LlxuICAgICAgICBgO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgICAgICAgICAgcHJvbXB0OiBkZXBlbmRlbmN5UHJvbXB0LFxuICAgICAgICAgICAgICAgIG1heFRva2VuczogMjAwMCxcbiAgICAgICAgICAgICAgICB0ZW1wZXJhdHVyZTogMC4yXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jeURhdGEgPSB0aGlzLnBhcnNlU3RydWN0dXJlZFJlc3BvbnNlKHJlc3BvbnNlLmNvbXBsZXRpb24pO1xuICAgICAgICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gbmV3IE1hcDxzdHJpbmcsIFRhc2tEZXBlbmRlbmN5PigpO1xuXG4gICAgICAgICAgICAvLyBQcm9jZXNzIHJlc2VhcmNoIHBsYW4gZGF0YSBzb3VyY2VzIGFzIHRhc2tzXG4gICAgICAgICAgICByZXNlYXJjaFBsYW4uZGF0YVNvdXJjZXMuZm9yRWFjaCgoc291cmNlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhc2tJZCA9IGByZXNlYXJjaF8ke2luZGV4fV8ke3NvdXJjZS5zb3VyY2UucmVwbGFjZSgvXFxzKy9nLCAnXycpLnRvTG93ZXJDYXNlKCl9YDtcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXMuc2V0KHRhc2tJZCwge1xuICAgICAgICAgICAgICAgICAgICB0YXNrSWQsXG4gICAgICAgICAgICAgICAgICAgIGRlcGVuZHNPbjogc291cmNlLmRlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tlZEJ5OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgY3JpdGljYWxQYXRoOiBzb3VyY2UucHJpb3JpdHkgPT09ICdoaWdoJyxcbiAgICAgICAgICAgICAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IHNvdXJjZS5lc3RpbWF0ZWRUaW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gUHJvY2VzcyBhbmFseXNpcyBwbGFuIHN0ZXBzIGFzIHRhc2tzXG4gICAgICAgICAgICBhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwcy5mb3JFYWNoKChzdGVwLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhc2tJZCA9IGBhbmFseXNpc18ke2luZGV4fV8ke3N0ZXAuc3RlcC5yZXBsYWNlKC9cXHMrL2csICdfJykudG9Mb3dlckNhc2UoKX1gO1xuICAgICAgICAgICAgICAgIGRlcGVuZGVuY2llcy5zZXQodGFza0lkLCB7XG4gICAgICAgICAgICAgICAgICAgIHRhc2tJZCxcbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kc09uOiBzdGVwLmRlcGVuZGVuY2llcyxcbiAgICAgICAgICAgICAgICAgICAgYmxvY2tlZEJ5OiBbXSxcbiAgICAgICAgICAgICAgICAgICAgY3JpdGljYWxQYXRoOiBmYWxzZSwgLy8gV2lsbCBiZSBkZXRlcm1pbmVkIGJ5IGRlcGVuZGVuY3kgYW5hbHlzaXNcbiAgICAgICAgICAgICAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IHN0ZXAuZXN0aW1hdGVkVGltZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSBkZXBlbmRlbmNpZXMgYmFzZWQgb24gQUkgYW5hbHlzaXNcbiAgICAgICAgICAgIGlmIChkZXBlbmRlbmN5RGF0YS5kZXBlbmRlbmNpZXMgJiYgQXJyYXkuaXNBcnJheShkZXBlbmRlbmN5RGF0YS5kZXBlbmRlbmNpZXMpKSB7XG4gICAgICAgICAgICAgICAgZGVwZW5kZW5jeURhdGEuZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZXBlbmRlbmNpZXMuaGFzKGRlcC50YXNrSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IGRlcGVuZGVuY2llcy5nZXQoZGVwLnRhc2tJZCkhO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jaWVzLnNldChkZXAudGFza0lkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZXhpc3RpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVwZW5kc09uOiBkZXAuZGVwZW5kc09uIHx8IGV4aXN0aW5nLmRlcGVuZHNPbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2VkQnk6IGRlcC5ibG9ja2VkQnkgfHwgZXhpc3RpbmcuYmxvY2tlZEJ5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyaXRpY2FsUGF0aDogZGVwLmNyaXRpY2FsUGF0aCAhPT0gdW5kZWZpbmVkID8gZGVwLmNyaXRpY2FsUGF0aCA6IGV4aXN0aW5nLmNyaXRpY2FsUGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGJsb2NrZWQgYnkgcmVsYXRpb25zaGlwc1xuICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVCbG9ja2VkQnlSZWxhdGlvbnNoaXBzKGRlcGVuZGVuY2llcyk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIGRlcGVuZGVuY2llc1xuICAgICAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcCwgdGFza0lkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy50YXNrRGVwZW5kZW5jaWVzLnNldCh0YXNrSWQsIGRlcCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGFuYWx5emluZyBkZXBlbmRlbmNpZXM6JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gYW5hbHl6ZSBkZXBlbmRlbmNpZXM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFc3RpbWF0ZSByZXNvdXJjZSByZXF1aXJlbWVudHNcbiAgICAgKi9cbiAgICBhc3luYyBlc3RpbWF0ZVJlc291cmNlcyhcbiAgICAgICAgcmVzZWFyY2hQbGFuOiBSZXNlYXJjaFBsYW4sXG4gICAgICAgIGFuYWx5c2lzUGxhbjogQW5hbHlzaXNQbGFuLFxuICAgICAgICBkZXBlbmRlbmNpZXM6IE1hcDxzdHJpbmcsIFRhc2tEZXBlbmRlbmN5PlxuICAgICk6IFByb21pc2U8UmVzb3VyY2VFc3RpbWF0aW9uPiB7XG4gICAgICAgIGNvbnN0IGVzdGltYXRpb25Qcm9tcHQgPSBgXG4gICAgICAgIEVzdGltYXRlIHRoZSByZXNvdXJjZSByZXF1aXJlbWVudHMgZm9yIHRoZSBmb2xsb3dpbmcgaW52ZXN0bWVudCBhbmFseXNpcyBwcm9qZWN0OlxuXG4gICAgICAgIFJlc2VhcmNoIFBsYW46XG4gICAgICAgIC0gRGF0YSBTb3VyY2VzOiAke3Jlc2VhcmNoUGxhbi5kYXRhU291cmNlcy5sZW5ndGh9XG4gICAgICAgIC0gRXN0aW1hdGVkIFJlc2VhcmNoIFRpbWU6ICR7cmVzZWFyY2hQbGFuLmRhdGFTb3VyY2VzLnJlZHVjZSgoc3VtLCBkcykgPT4gc3VtICsgZHMuZXN0aW1hdGVkVGltZSwgMCl9IHNlY29uZHNcblxuICAgICAgICBBbmFseXNpcyBQbGFuOlxuICAgICAgICAtIEFuYWx5c2lzIFN0ZXBzOiAke2FuYWx5c2lzUGxhbi5hbmFseXNpc1N0ZXBzLmxlbmd0aH1cbiAgICAgICAgLSBFc3RpbWF0ZWQgQW5hbHlzaXMgVGltZTogJHthbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwcy5yZWR1Y2UoKHN1bSwgc3RlcCkgPT4gc3VtICsgc3RlcC5lc3RpbWF0ZWRUaW1lLCAwKX0gc2Vjb25kc1xuXG4gICAgICAgIERlcGVuZGVuY2llczogJHtkZXBlbmRlbmNpZXMuc2l6ZX0gdGFza3Mgd2l0aCBpbnRlcmRlcGVuZGVuY2llc1xuXG4gICAgICAgIFBsZWFzZSBwcm92aWRlIHJlc291cmNlIGVzdGltYXRpb25zIGluY2x1ZGluZzpcbiAgICAgICAgMS4gVG90YWwgZXN0aW1hdGVkIHRpbWVcbiAgICAgICAgMi4gQWdlbnQgYWxsb2NhdGlvbnMgKHJlc2VhcmNoLCBhbmFseXNpcywgY29tcGxpYW5jZSwgc3ludGhlc2lzKVxuICAgICAgICAzLiBEYXRhIHJlcXVpcmVtZW50cyAodm9sdW1lLCBwcm9jZXNzaW5nIHRpbWUpXG4gICAgICAgIDQuIENvbXB1dGF0aW9uYWwgcmVxdWlyZW1lbnRzIChtb2RlbCBjYWxscywgY29zdCwgbWVtb3J5KVxuICAgICAgICA1LiBSaXNrIGZhY3RvcnMgYW5kIG1pdGlnYXRpb24gc3RyYXRlZ2llc1xuXG4gICAgICAgIEZvcm1hdCB5b3VyIHJlc3BvbnNlIGFzIGEgc3RydWN0dXJlZCBKU09OIG9iamVjdC5cbiAgICAgICAgYDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgICAgICAgICAgIHByb21wdDogZXN0aW1hdGlvblByb21wdCxcbiAgICAgICAgICAgICAgICBtYXhUb2tlbnM6IDE1MDAsXG4gICAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuM1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGVzdGltYXRpb25EYXRhID0gdGhpcy5wYXJzZVN0cnVjdHVyZWRSZXNwb25zZShyZXNwb25zZS5jb21wbGV0aW9uKTtcblxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGJhc2UgZXN0aW1hdGlvbnNcbiAgICAgICAgICAgIGNvbnN0IHJlc2VhcmNoVGltZSA9IHJlc2VhcmNoUGxhbi5kYXRhU291cmNlcy5yZWR1Y2UoKHN1bSwgZHMpID0+IHN1bSArIGRzLmVzdGltYXRlZFRpbWUsIDApO1xuICAgICAgICAgICAgY29uc3QgYW5hbHlzaXNUaW1lID0gYW5hbHlzaXNQbGFuLmFuYWx5c2lzU3RlcHMucmVkdWNlKChzdW0sIHN0ZXApID0+IHN1bSArIHN0ZXAuZXN0aW1hdGVkVGltZSwgMCk7XG4gICAgICAgICAgICBjb25zdCB0b3RhbFRpbWUgPSByZXNlYXJjaFRpbWUgKyBhbmFseXNpc1RpbWUgKyAxMDAwMDsgLy8gQWRkIGJ1ZmZlciBmb3IgY29vcmRpbmF0aW9uXG5cbiAgICAgICAgICAgIGNvbnN0IHJlc291cmNlRXN0aW1hdGlvbjogUmVzb3VyY2VFc3RpbWF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHRvdGFsRXN0aW1hdGVkVGltZTogZXN0aW1hdGlvbkRhdGEudG90YWxFc3RpbWF0ZWRUaW1lIHx8IHRvdGFsVGltZSxcbiAgICAgICAgICAgICAgICBhZ2VudEFsbG9jYXRpb25zOiB0aGlzLmZvcm1hdEFnZW50QWxsb2NhdGlvbnMoZXN0aW1hdGlvbkRhdGEuYWdlbnRBbGxvY2F0aW9ucywgYW5hbHlzaXNQbGFuKSxcbiAgICAgICAgICAgICAgICBkYXRhUmVxdWlyZW1lbnRzOiB0aGlzLmZvcm1hdERhdGFSZXF1aXJlbWVudHMoZXN0aW1hdGlvbkRhdGEuZGF0YVJlcXVpcmVtZW50cywgcmVzZWFyY2hQbGFuKSxcbiAgICAgICAgICAgICAgICBjb21wdXRhdGlvbmFsUmVxdWlyZW1lbnRzOiB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGVsQ2FsbHM6IGVzdGltYXRpb25EYXRhLmNvbXB1dGF0aW9uYWxSZXF1aXJlbWVudHM/Lm1vZGVsQ2FsbHMgfHwgKHJlc2VhcmNoUGxhbi5kYXRhU291cmNlcy5sZW5ndGggKyBhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwcy5sZW5ndGgpICogMixcbiAgICAgICAgICAgICAgICAgICAgZXN0aW1hdGVkQ29zdDogZXN0aW1hdGlvbkRhdGEuY29tcHV0YXRpb25hbFJlcXVpcmVtZW50cz8uZXN0aW1hdGVkQ29zdCB8fCAwLjUwLFxuICAgICAgICAgICAgICAgICAgICBtZW1vcnlSZXF1aXJlbWVudHM6IGVzdGltYXRpb25EYXRhLmNvbXB1dGF0aW9uYWxSZXF1aXJlbWVudHM/Lm1lbW9yeVJlcXVpcmVtZW50cyB8fCAnMkdCJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmlza0ZhY3RvcnM6IHRoaXMuZm9ybWF0Umlza0ZhY3RvcnMoZXN0aW1hdGlvbkRhdGEucmlza0ZhY3RvcnMpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnJlc291cmNlRXN0aW1hdGlvbnMuc2V0KHJlc2VhcmNoUGxhbi5jb252ZXJzYXRpb25JZCwgcmVzb3VyY2VFc3RpbWF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiByZXNvdXJjZUVzdGltYXRpb247XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBlc3RpbWF0aW5nIHJlc291cmNlczonLCBlcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBlc3RpbWF0ZSByZXNvdXJjZXM6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGFwdCBwbGFuIGJhc2VkIG9uIGludGVybWVkaWF0ZSBmaW5kaW5nc1xuICAgICAqL1xuICAgIGFzeW5jIGFkYXB0UGxhbihcbiAgICAgICAgcGxhbklkOiBzdHJpbmcsXG4gICAgICAgIHBsYW5UeXBlOiAncmVzZWFyY2gnIHwgJ2FuYWx5c2lzJyxcbiAgICAgICAgaW50ZXJtZWRpYXRlRmluZGluZ3M6IGFueSxcbiAgICAgICAgdHJpZ2dlcjogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxQbGFuQWRhcHRhdGlvbj4ge1xuICAgICAgICBjb25zdCBwbGFuID0gcGxhblR5cGUgPT09ICdyZXNlYXJjaCcgXG4gICAgICAgICAgICA/IHRoaXMucmVzZWFyY2hQbGFucy5nZXQocGxhbklkKVxuICAgICAgICAgICAgOiB0aGlzLmFuYWx5c2lzUGxhbnMuZ2V0KHBsYW5JZCk7XG5cbiAgICAgICAgaWYgKCFwbGFuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBsYW4gJHtwbGFuSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYWRhcHRhdGlvblByb21wdCA9IGBcbiAgICAgICAgQW5hbHl6ZSB0aGUgZm9sbG93aW5nIGludGVybWVkaWF0ZSBmaW5kaW5ncyBhbmQgZGV0ZXJtaW5lIGlmIHRoZSBjdXJyZW50IHBsYW4gbmVlZHMgYWRhcHRhdGlvbjpcblxuICAgICAgICBDdXJyZW50IFBsYW46XG4gICAgICAgICR7SlNPTi5zdHJpbmdpZnkocGxhbiwgbnVsbCwgMil9XG5cbiAgICAgICAgSW50ZXJtZWRpYXRlIEZpbmRpbmdzOlxuICAgICAgICAke0pTT04uc3RyaW5naWZ5KGludGVybWVkaWF0ZUZpbmRpbmdzLCBudWxsLCAyKX1cblxuICAgICAgICBUcmlnZ2VyOiAke3RyaWdnZXJ9XG5cbiAgICAgICAgUGxlYXNlIGV2YWx1YXRlOlxuICAgICAgICAxLiBXaGV0aGVyIHRoZSBjdXJyZW50IHBsYW4gaXMgc3RpbGwgYXBwcm9wcmlhdGVcbiAgICAgICAgMi4gV2hhdCBjaGFuZ2VzIGFyZSBuZWVkZWQgKGFkZC9yZW1vdmUvbW9kaWZ5L3Jlb3JkZXIgdGFza3MpXG4gICAgICAgIDMuIEltcGFjdCBvbiB0aW1lbGluZSBhbmQgcmVzb3VyY2VzXG4gICAgICAgIDQuIEp1c3RpZmljYXRpb24gZm9yIGNoYW5nZXNcbiAgICAgICAgNS4gV2hldGhlciBodW1hbiBhcHByb3ZhbCBpcyByZXF1aXJlZFxuXG4gICAgICAgIEZvcm1hdCB5b3VyIHJlc3BvbnNlIGFzIGEgc3RydWN0dXJlZCBKU09OIG9iamVjdCB3aXRoIGFkYXB0YXRpb24gZGV0YWlscy5cbiAgICAgICAgYDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgICAgICAgICAgIHByb21wdDogYWRhcHRhdGlvblByb21wdCxcbiAgICAgICAgICAgICAgICBtYXhUb2tlbnM6IDE4MDAsXG4gICAgICAgICAgICAgICAgdGVtcGVyYXR1cmU6IDAuM1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGFkYXB0YXRpb25EYXRhID0gdGhpcy5wYXJzZVN0cnVjdHVyZWRSZXNwb25zZShyZXNwb25zZS5jb21wbGV0aW9uKTtcblxuICAgICAgICAgICAgY29uc3QgYWRhcHRhdGlvbjogUGxhbkFkYXB0YXRpb24gPSB7XG4gICAgICAgICAgICAgICAgYWRhcHRhdGlvbklkOiB0aGlzLmdlbmVyYXRlQWRhcHRhdGlvbklkKCksXG4gICAgICAgICAgICAgICAgb3JpZ2luYWxQbGFuSWQ6IHBsYW5JZCxcbiAgICAgICAgICAgICAgICB0cmlnZ2VyLFxuICAgICAgICAgICAgICAgIGNoYW5nZXM6IHRoaXMuZm9ybWF0UGxhbkNoYW5nZXMoYWRhcHRhdGlvbkRhdGEuY2hhbmdlcyB8fCBbXSksXG4gICAgICAgICAgICAgICAgbmV3RXN0aW1hdGlvbnM6IGF3YWl0IHRoaXMucmVjYWxjdWxhdGVFc3RpbWF0aW9ucyhwbGFuSWQsIGFkYXB0YXRpb25EYXRhLmNoYW5nZXMgfHwgW10pLFxuICAgICAgICAgICAgICAgIGp1c3RpZmljYXRpb246IGFkYXB0YXRpb25EYXRhLmp1c3RpZmljYXRpb24gfHwgJ1BsYW4gYWRhcHRhdGlvbiBiYXNlZCBvbiBpbnRlcm1lZGlhdGUgZmluZGluZ3MnLFxuICAgICAgICAgICAgICAgIGFwcHJvdmFsUmVxdWlyZWQ6IGFkYXB0YXRpb25EYXRhLmFwcHJvdmFsUmVxdWlyZWQgfHwgZmFsc2UsXG4gICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLnBsYW5BZGFwdGF0aW9ucy5zZXQoYWRhcHRhdGlvbi5hZGFwdGF0aW9uSWQsIGFkYXB0YXRpb24pO1xuXG4gICAgICAgICAgICAvLyBBcHBseSBjaGFuZ2VzIGlmIG5vIGFwcHJvdmFsIHJlcXVpcmVkXG4gICAgICAgICAgICBpZiAoIWFkYXB0YXRpb24uYXBwcm92YWxSZXF1aXJlZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwbHlQbGFuQ2hhbmdlcyhwbGFuSWQsIHBsYW5UeXBlLCBhZGFwdGF0aW9uLmNoYW5nZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYWRhcHRhdGlvbjtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGFkYXB0aW5nIHBsYW46JywgZXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gYWRhcHQgcGxhbjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZXNlYXJjaCBwbGFuIGJ5IElEXG4gICAgICovXG4gICAgZ2V0UmVzZWFyY2hQbGFuKHBsYW5JZDogc3RyaW5nKTogUmVzZWFyY2hQbGFuIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzZWFyY2hQbGFucy5nZXQocGxhbklkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYW5hbHlzaXMgcGxhbiBieSBJRFxuICAgICAqL1xuICAgIGdldEFuYWx5c2lzUGxhbihwbGFuSWQ6IHN0cmluZyk6IEFuYWx5c2lzUGxhbiB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFuYWx5c2lzUGxhbnMuZ2V0KHBsYW5JZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRhc2sgZGVwZW5kZW5jaWVzXG4gICAgICovXG4gICAgZ2V0VGFza0RlcGVuZGVuY2llcygpOiBNYXA8c3RyaW5nLCBUYXNrRGVwZW5kZW5jeT4ge1xuICAgICAgICByZXR1cm4gbmV3IE1hcCh0aGlzLnRhc2tEZXBlbmRlbmNpZXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCByZXNvdXJjZSBlc3RpbWF0aW9uXG4gICAgICovXG4gICAgZ2V0UmVzb3VyY2VFc3RpbWF0aW9uKGNvbnZlcnNhdGlvbklkOiBzdHJpbmcpOiBSZXNvdXJjZUVzdGltYXRpb24gfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNvdXJjZUVzdGltYXRpb25zLmdldChjb252ZXJzYXRpb25JZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHBsYW4gYWRhcHRhdGlvbnNcbiAgICAgKi9cbiAgICBnZXRQbGFuQWRhcHRhdGlvbnMoKTogTWFwPHN0cmluZywgUGxhbkFkYXB0YXRpb24+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXAodGhpcy5wbGFuQWRhcHRhdGlvbnMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3MgcGxhbm5pbmcgbWVzc2FnZVxuICAgICAqL1xuICAgIGFzeW5jIHByb2Nlc3NNZXNzYWdlKG1lc3NhZ2U6IEFnZW50TWVzc2FnZSk6IFByb21pc2U8QWdlbnRNZXNzYWdlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7IGNvbnRlbnQgfSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBsZXQgcmVzcG9uc2U6IGFueTtcblxuICAgICAgICAgICAgc3dpdGNoIChjb250ZW50LnRhc2tUeXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBQbGFubmluZ1Rhc2tUeXBlLlJFU0VBUkNIX1BMQU46XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jcmVhdGVSZXNlYXJjaFBsYW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmNvbnZlcnNhdGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5jb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBQbGFubmluZ1Rhc2tUeXBlLkFOQUxZU0lTX1BMQU46XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jcmVhdGVBbmFseXNpc1BsYW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmNvbnZlcnNhdGlvbklkLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5jb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5yZXNlYXJjaFBsYW5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFBsYW5uaW5nVGFza1R5cGUuREVQRU5ERU5DWV9BTkFMWVNJUzpcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmFuYWx5emVEZXBlbmRlbmNpZXMoXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LnJlc2VhcmNoUGxhbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuYW5hbHlzaXNQbGFuXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSBQbGFubmluZ1Rhc2tUeXBlLlJFU09VUkNFX0VTVElNQVRJT046XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5lc3RpbWF0ZVJlc291cmNlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucmVzZWFyY2hQbGFuLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5hbmFseXNpc1BsYW4sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmRlcGVuZGVuY2llc1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgUGxhbm5pbmdUYXNrVHlwZS5QTEFOX0FEQVBUQVRJT046XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5hZGFwdFBsYW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LnBsYW5JZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucGxhblR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LmludGVybWVkaWF0ZUZpbmRpbmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC50cmlnZ2VyXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHBsYW5uaW5nIHRhc2sgdHlwZTogJHtjb250ZW50LnRhc2tUeXBlfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNlbmRlcjogJ3BsYW5uaW5nJyxcbiAgICAgICAgICAgICAgICByZWNpcGllbnQ6IG1lc3NhZ2Uuc2VuZGVyLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VUeXBlOiAncmVzcG9uc2UnLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiByZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogbWVzc2FnZS5tZXRhZGF0YS5wcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25JZDogbWVzc2FnZS5tZXRhZGF0YS5jb252ZXJzYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkOiBtZXNzYWdlLm1ldGFkYXRhLnJlcXVlc3RJZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNlbmRlcjogJ3BsYW5uaW5nJyxcbiAgICAgICAgICAgICAgICByZWNpcGllbnQ6IG1lc3NhZ2Uuc2VuZGVyLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2VUeXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogbWVzc2FnZS5tZXRhZGF0YS5wcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgICAgICBjb252ZXJzYXRpb25JZDogbWVzc2FnZS5tZXRhZGF0YS5jb252ZXJzYXRpb25JZCxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdElkOiBtZXNzYWdlLm1ldGFkYXRhLnJlcXVlc3RJZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBQcml2YXRlIGhlbHBlciBtZXRob2RzXG5cbiAgICBwcml2YXRlIHBhcnNlU3RydWN0dXJlZFJlc3BvbnNlKHJlc3BvbnNlOiBzdHJpbmcpOiBhbnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVHJ5IHRvIGV4dHJhY3QgSlNPTiBmcm9tIGNvZGUgYmxvY2tzXG4gICAgICAgICAgICBjb25zdCBqc29uTWF0Y2ggPSByZXNwb25zZS5tYXRjaCgvYGBgKD86anNvbik/XFxzKihbXFxzXFxTXSo/KVxccypgYGAvKTtcbiAgICAgICAgICAgIGlmIChqc29uTWF0Y2ggJiYganNvbk1hdGNoWzFdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoanNvbk1hdGNoWzFdLnRyaW0oKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyeSB0byBwYXJzZSB0aGUgZW50aXJlIHJlc3BvbnNlIGFzIEpTT05cbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3BvbnNlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHBhcnNlIHN0cnVjdHVyZWQgcmVzcG9uc2UsIHVzaW5nIGZhbGxiYWNrJyk7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcm1hdERhdGFTb3VyY2VzKHNvdXJjZXM6IGFueVtdKTogUmVzZWFyY2hQbGFuWydkYXRhU291cmNlcyddIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZXMubWFwKChzb3VyY2UsIGluZGV4KSA9PiAoe1xuICAgICAgICAgICAgc291cmNlOiBzb3VyY2Uuc291cmNlIHx8IGBEYXRhIFNvdXJjZSAke2luZGV4ICsgMX1gLFxuICAgICAgICAgICAgdHlwZTogc291cmNlLnR5cGUgfHwgJ3B1YmxpYycsXG4gICAgICAgICAgICBwcmlvcml0eTogc291cmNlLnByaW9yaXR5IHx8ICdtZWRpdW0nLFxuICAgICAgICAgICAgZXN0aW1hdGVkVGltZTogc291cmNlLmVzdGltYXRlZFRpbWUgfHwgNTAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogc291cmNlLmRlcGVuZGVuY2llcyB8fCBbXVxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmb3JtYXRBbmFseXNpc1N0ZXBzKHN0ZXBzOiBhbnlbXSk6IEFuYWx5c2lzUGxhblsnYW5hbHlzaXNTdGVwcyddIHtcbiAgICAgICAgcmV0dXJuIHN0ZXBzLm1hcCgoc3RlcCwgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICBzdGVwOiBzdGVwLnN0ZXAgfHwgYEFuYWx5c2lzIFN0ZXAgJHtpbmRleCArIDF9YCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBzdGVwLmRlc2NyaXB0aW9uIHx8ICdQZXJmb3JtIGFuYWx5c2lzJyxcbiAgICAgICAgICAgIHJlcXVpcmVkRGF0YTogc3RlcC5yZXF1aXJlZERhdGEgfHwgW10sXG4gICAgICAgICAgICBleHBlY3RlZE91dHB1dDogc3RlcC5leHBlY3RlZE91dHB1dCB8fCAnQW5hbHlzaXMgcmVzdWx0cycsXG4gICAgICAgICAgICBlc3RpbWF0ZWRUaW1lOiBzdGVwLmVzdGltYXRlZFRpbWUgfHwgODAwMCxcbiAgICAgICAgICAgIGRlcGVuZGVuY2llczogc3RlcC5kZXBlbmRlbmNpZXMgfHwgW10sXG4gICAgICAgICAgICBhZ2VudDogc3RlcC5hZ2VudCB8fCAnYW5hbHlzaXMnXG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNhbGN1bGF0ZUJsb2NrZWRCeVJlbGF0aW9uc2hpcHMoZGVwZW5kZW5jaWVzOiBNYXA8c3RyaW5nLCBUYXNrRGVwZW5kZW5jeT4pOiB2b2lkIHtcbiAgICAgICAgLy8gQ2xlYXIgZXhpc3RpbmcgYmxvY2tlZCBieSByZWxhdGlvbnNoaXBzXG4gICAgICAgIGRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XG4gICAgICAgICAgICBkZXAuYmxvY2tlZEJ5ID0gW107XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBibG9ja2VkIGJ5IHJlbGF0aW9uc2hpcHNcbiAgICAgICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGRlcCwgdGFza0lkKSA9PiB7XG4gICAgICAgICAgICBkZXAuZGVwZW5kc09uLmZvckVhY2goZGVwZW5kZW5jeUlkID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZXBlbmRlbmN5VGFzayA9IGRlcGVuZGVuY2llcy5nZXQoZGVwZW5kZW5jeUlkKTtcbiAgICAgICAgICAgICAgICBpZiAoZGVwZW5kZW5jeVRhc2spIHtcbiAgICAgICAgICAgICAgICAgICAgZGVwZW5kZW5jeVRhc2suYmxvY2tlZEJ5LnB1c2godGFza0lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmb3JtYXRBZ2VudEFsbG9jYXRpb25zKGFsbG9jYXRpb25zOiBhbnksIGFuYWx5c2lzUGxhbjogQW5hbHlzaXNQbGFuKTogUmVzb3VyY2VFc3RpbWF0aW9uWydhZ2VudEFsbG9jYXRpb25zJ10ge1xuICAgICAgICBjb25zdCBkZWZhdWx0QWxsb2NhdGlvbnMgPSBbXG4gICAgICAgICAgICB7IGFnZW50OiAncmVzZWFyY2gnIGFzIEFnZW50VHlwZSwgZXN0aW1hdGVkVGltZTogMTUwMDAsIHRhc2tDb3VudDogMywgdXRpbGl6YXRpb25SYXRlOiAwLjggfSxcbiAgICAgICAgICAgIHsgYWdlbnQ6ICdhbmFseXNpcycgYXMgQWdlbnRUeXBlLCBlc3RpbWF0ZWRUaW1lOiAyMDAwMCwgdGFza0NvdW50OiBhbmFseXNpc1BsYW4uYW5hbHlzaXNTdGVwcy5sZW5ndGgsIHV0aWxpemF0aW9uUmF0ZTogMC45IH0sXG4gICAgICAgICAgICB7IGFnZW50OiAnY29tcGxpYW5jZScgYXMgQWdlbnRUeXBlLCBlc3RpbWF0ZWRUaW1lOiA4MDAwLCB0YXNrQ291bnQ6IDIsIHV0aWxpemF0aW9uUmF0ZTogMC43IH0sXG4gICAgICAgICAgICB7IGFnZW50OiAnc3ludGhlc2lzJyBhcyBBZ2VudFR5cGUsIGVzdGltYXRlZFRpbWU6IDEyMDAwLCB0YXNrQ291bnQ6IDEsIHV0aWxpemF0aW9uUmF0ZTogMC42IH1cbiAgICAgICAgXTtcblxuICAgICAgICBpZiAoIWFsbG9jYXRpb25zIHx8ICFBcnJheS5pc0FycmF5KGFsbG9jYXRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRBbGxvY2F0aW9ucztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhbGxvY2F0aW9ucy5tYXAoKGFsbG9jOiBhbnkpID0+ICh7XG4gICAgICAgICAgICBhZ2VudDogYWxsb2MuYWdlbnQgfHwgJ3Jlc2VhcmNoJyxcbiAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IGFsbG9jLmVzdGltYXRlZFRpbWUgfHwgMTAwMDAsXG4gICAgICAgICAgICB0YXNrQ291bnQ6IGFsbG9jLnRhc2tDb3VudCB8fCAxLFxuICAgICAgICAgICAgdXRpbGl6YXRpb25SYXRlOiBhbGxvYy51dGlsaXphdGlvblJhdGUgfHwgMC44XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZvcm1hdERhdGFSZXF1aXJlbWVudHMocmVxdWlyZW1lbnRzOiBhbnksIHJlc2VhcmNoUGxhbjogUmVzZWFyY2hQbGFuKTogUmVzb3VyY2VFc3RpbWF0aW9uWydkYXRhUmVxdWlyZW1lbnRzJ10ge1xuICAgICAgICBjb25zdCBkZWZhdWx0UmVxdWlyZW1lbnRzID0gcmVzZWFyY2hQbGFuLmRhdGFTb3VyY2VzLm1hcChzb3VyY2UgPT4gKHtcbiAgICAgICAgICAgIHNvdXJjZTogc291cmNlLnNvdXJjZSxcbiAgICAgICAgICAgIHZvbHVtZTogJ01lZGl1bScsXG4gICAgICAgICAgICBwcm9jZXNzaW5nVGltZTogc291cmNlLmVzdGltYXRlZFRpbWVcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGlmICghcmVxdWlyZW1lbnRzIHx8ICFBcnJheS5pc0FycmF5KHJlcXVpcmVtZW50cykpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0UmVxdWlyZW1lbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcXVpcmVtZW50cy5tYXAoKHJlcTogYW55KSA9PiAoe1xuICAgICAgICAgICAgc291cmNlOiByZXEuc291cmNlIHx8ICdVbmtub3duJyxcbiAgICAgICAgICAgIHZvbHVtZTogcmVxLnZvbHVtZSB8fCAnTWVkaXVtJyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdUaW1lOiByZXEucHJvY2Vzc2luZ1RpbWUgfHwgNTAwMFxuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmb3JtYXRSaXNrRmFjdG9ycyhmYWN0b3JzOiBhbnkpOiBSZXNvdXJjZUVzdGltYXRpb25bJ3Jpc2tGYWN0b3JzJ10ge1xuICAgICAgICBjb25zdCBkZWZhdWx0RmFjdG9ycyA9IFtcbiAgICAgICAgICAgIHsgZmFjdG9yOiAnRGF0YSBhdmFpbGFiaWxpdHknLCBpbXBhY3Q6ICdtZWRpdW0nIGFzIGNvbnN0LCBtaXRpZ2F0aW9uOiAnVXNlIGFsdGVybmF0aXZlIGRhdGEgc291cmNlcycgfSxcbiAgICAgICAgICAgIHsgZmFjdG9yOiAnTW9kZWwgYWNjdXJhY3knLCBpbXBhY3Q6ICdoaWdoJyBhcyBjb25zdCwgbWl0aWdhdGlvbjogJ0Nyb3NzLXZhbGlkYXRlIHdpdGggbXVsdGlwbGUgbW9kZWxzJyB9LFxuICAgICAgICAgICAgeyBmYWN0b3I6ICdUaW1lIGNvbnN0cmFpbnRzJywgaW1wYWN0OiAnbWVkaXVtJyBhcyBjb25zdCwgbWl0aWdhdGlvbjogJ1ByaW9yaXRpemUgY3JpdGljYWwgdGFza3MnIH1cbiAgICAgICAgXTtcblxuICAgICAgICBpZiAoIWZhY3RvcnMgfHwgIUFycmF5LmlzQXJyYXkoZmFjdG9ycykpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0RmFjdG9ycztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWN0b3JzLm1hcCgoZmFjdG9yOiBhbnkpID0+ICh7XG4gICAgICAgICAgICBmYWN0b3I6IGZhY3Rvci5mYWN0b3IgfHwgJ1Vua25vd24gcmlzaycsXG4gICAgICAgICAgICBpbXBhY3Q6IGZhY3Rvci5pbXBhY3QgfHwgJ21lZGl1bScsXG4gICAgICAgICAgICBtaXRpZ2F0aW9uOiBmYWN0b3IubWl0aWdhdGlvbiB8fCAnTW9uaXRvciBhbmQgYWRqdXN0J1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmb3JtYXRQbGFuQ2hhbmdlcyhjaGFuZ2VzOiBhbnlbXSk6IFBsYW5BZGFwdGF0aW9uWydjaGFuZ2VzJ10ge1xuICAgICAgICByZXR1cm4gY2hhbmdlcy5tYXAoY2hhbmdlID0+ICh7XG4gICAgICAgICAgICB0eXBlOiBjaGFuZ2UudHlwZSB8fCAnbW9kaWZ5JyxcbiAgICAgICAgICAgIHRhcmdldDogY2hhbmdlLnRhcmdldCB8fCAndW5rbm93bicsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogY2hhbmdlLmRlc2NyaXB0aW9uIHx8ICdQbGFuIG1vZGlmaWNhdGlvbicsXG4gICAgICAgICAgICBpbXBhY3Q6IGNoYW5nZS5pbXBhY3QgfHwgJ0xvdyBpbXBhY3Qgb24gdGltZWxpbmUnXG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHJlY2FsY3VsYXRlRXN0aW1hdGlvbnMocGxhbklkOiBzdHJpbmcsIGNoYW5nZXM6IGFueVtdKTogUHJvbWlzZTxSZXNvdXJjZUVzdGltYXRpb24+IHtcbiAgICAgICAgLy8gU2ltcGxpZmllZCByZWNhbGN1bGF0aW9uIC0gaW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGJlIG1vcmUgc29waGlzdGljYXRlZFxuICAgICAgICAvLyBGaXJzdCB0cnkgdG8gZmluZCBieSBwbGFuIElELCB0aGVuIGJ5IGNvbnZlcnNhdGlvbiBJRFxuICAgICAgICBsZXQgZXhpc3RpbmdFc3RpbWF0aW9uID0gdGhpcy5yZXNvdXJjZUVzdGltYXRpb25zLmdldChwbGFuSWQpO1xuICAgICAgICBcbiAgICAgICAgaWYgKCFleGlzdGluZ0VzdGltYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRyeSB0byBmaW5kIGJ5IGNvbnZlcnNhdGlvbiBJRCBmcm9tIHRoZSBwbGFuXG4gICAgICAgICAgICBjb25zdCBwbGFuID0gdGhpcy5yZXNlYXJjaFBsYW5zLmdldChwbGFuSWQpIHx8IHRoaXMuYW5hbHlzaXNQbGFucy5nZXQocGxhbklkKTtcbiAgICAgICAgICAgIGlmIChwbGFuKSB7XG4gICAgICAgICAgICAgICAgZXhpc3RpbmdFc3RpbWF0aW9uID0gdGhpcy5yZXNvdXJjZUVzdGltYXRpb25zLmdldChwbGFuLmNvbnZlcnNhdGlvbklkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCFleGlzdGluZ0VzdGltYXRpb24pIHtcbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGRlZmF1bHQgZXN0aW1hdGlvbiBpZiBub25lIGV4aXN0c1xuICAgICAgICAgICAgZXhpc3RpbmdFc3RpbWF0aW9uID0ge1xuICAgICAgICAgICAgICAgIHRvdGFsRXN0aW1hdGVkVGltZTogMzAwMDAsXG4gICAgICAgICAgICAgICAgYWdlbnRBbGxvY2F0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICB7IGFnZW50OiAncmVzZWFyY2gnLCBlc3RpbWF0ZWRUaW1lOiAxMDAwMCwgdGFza0NvdW50OiAyLCB1dGlsaXphdGlvblJhdGU6IDAuOCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGFnZW50OiAnYW5hbHlzaXMnLCBlc3RpbWF0ZWRUaW1lOiAxNTAwMCwgdGFza0NvdW50OiAyLCB1dGlsaXphdGlvblJhdGU6IDAuOSB9LFxuICAgICAgICAgICAgICAgICAgICB7IGFnZW50OiAnY29tcGxpYW5jZScsIGVzdGltYXRlZFRpbWU6IDMwMDAsIHRhc2tDb3VudDogMSwgdXRpbGl6YXRpb25SYXRlOiAwLjcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBhZ2VudDogJ3N5bnRoZXNpcycsIGVzdGltYXRlZFRpbWU6IDIwMDAsIHRhc2tDb3VudDogMSwgdXRpbGl6YXRpb25SYXRlOiAwLjYgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgZGF0YVJlcXVpcmVtZW50czogW1xuICAgICAgICAgICAgICAgICAgICB7IHNvdXJjZTogJ0RlZmF1bHQgU291cmNlJywgdm9sdW1lOiAnTWVkaXVtJywgcHJvY2Vzc2luZ1RpbWU6IDUwMDAgfVxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgY29tcHV0YXRpb25hbFJlcXVpcmVtZW50czoge1xuICAgICAgICAgICAgICAgICAgICBtb2RlbENhbGxzOiA0LFxuICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWRDb3N0OiAwLjI1LFxuICAgICAgICAgICAgICAgICAgICBtZW1vcnlSZXF1aXJlbWVudHM6ICcyR0InXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByaXNrRmFjdG9yczogW1xuICAgICAgICAgICAgICAgICAgICB7IGZhY3RvcjogJ0RhdGEgYXZhaWxhYmlsaXR5JywgaW1wYWN0OiAnbWVkaXVtJywgbWl0aWdhdGlvbjogJ1VzZSBhbHRlcm5hdGl2ZSBzb3VyY2VzJyB9XG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFwcGx5IGEgc2ltcGxlIGFkanVzdG1lbnQgYmFzZWQgb24gdGhlIG51bWJlciBvZiBjaGFuZ2VzXG4gICAgICAgIGNvbnN0IGFkanVzdG1lbnRGYWN0b3IgPSAxICsgKGNoYW5nZXMubGVuZ3RoICogMC4xKTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZXhpc3RpbmdFc3RpbWF0aW9uLFxuICAgICAgICAgICAgdG90YWxFc3RpbWF0ZWRUaW1lOiBNYXRoLnJvdW5kKGV4aXN0aW5nRXN0aW1hdGlvbi50b3RhbEVzdGltYXRlZFRpbWUgKiBhZGp1c3RtZW50RmFjdG9yKSxcbiAgICAgICAgICAgIGFnZW50QWxsb2NhdGlvbnM6IGV4aXN0aW5nRXN0aW1hdGlvbi5hZ2VudEFsbG9jYXRpb25zLm1hcChhbGxvYyA9PiAoe1xuICAgICAgICAgICAgICAgIC4uLmFsbG9jLFxuICAgICAgICAgICAgICAgIGVzdGltYXRlZFRpbWU6IE1hdGgucm91bmQoYWxsb2MuZXN0aW1hdGVkVGltZSAqIGFkanVzdG1lbnRGYWN0b3IpXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGFwcGx5UGxhbkNoYW5nZXMocGxhbklkOiBzdHJpbmcsIHBsYW5UeXBlOiAncmVzZWFyY2gnIHwgJ2FuYWx5c2lzJywgY2hhbmdlczogUGxhbkFkYXB0YXRpb25bJ2NoYW5nZXMnXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBwbGFuID0gcGxhblR5cGUgPT09ICdyZXNlYXJjaCcgXG4gICAgICAgICAgICA/IHRoaXMucmVzZWFyY2hQbGFucy5nZXQocGxhbklkKVxuICAgICAgICAgICAgOiB0aGlzLmFuYWx5c2lzUGxhbnMuZ2V0KHBsYW5JZCk7XG5cbiAgICAgICAgaWYgKCFwbGFuKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBsYW4gJHtwbGFuSWR9IG5vdCBmb3VuZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXBkYXRlIHBsYW4gc3RhdHVzIHRvIGFkYXB0ZWRcbiAgICAgICAgcGxhbi5zdGF0dXMgPSAnYWRhcHRlZCc7XG4gICAgICAgIHBsYW4udXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcblxuICAgICAgICAvLyBBcHBseSBjaGFuZ2VzIChzaW1wbGlmaWVkIGltcGxlbWVudGF0aW9uKVxuICAgICAgICBjaGFuZ2VzLmZvckVhY2goY2hhbmdlID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBcHBseWluZyBjaGFuZ2U6ICR7Y2hhbmdlLnR5cGV9IHRvICR7Y2hhbmdlLnRhcmdldH0gLSAke2NoYW5nZS5kZXNjcmlwdGlvbn1gKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVBsYW5JZCh0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYCR7dHlwZX1fcGxhbl8ke0RhdGUubm93KCl9XyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpfWA7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZUFkYXB0YXRpb25JZCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYGFkYXB0YXRpb25fJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA5KX1gO1xuICAgIH1cbn0iXX0=