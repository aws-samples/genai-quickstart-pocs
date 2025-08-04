/**
 * Planning Agent Implementation
 * 
 * The planning agent develops research and analysis plans, identifies required
 * information and data sources, creates task sequences with dependencies,
 * adapts plans based on intermediate findings, and estimates time and resource requirements.
 */

import {
    AgentType,
    AgentMessage,
    AgentTask,
    ConversationContext,
    AgentStatus
} from '../../models/agent';
import { ClaudeSonnetService, ClaudePromptTemplate } from './claude-sonnet-service';

/**
 * Planning task types
 */
export enum PlanningTaskType {
    RESEARCH_PLAN = 'research-plan',
    ANALYSIS_PLAN = 'analysis-plan',
    DEPENDENCY_ANALYSIS = 'dependency-analysis',
    RESOURCE_ESTIMATION = 'resource-estimation',
    PLAN_ADAPTATION = 'plan-adaptation'
}

/**
 * Planning context for investment research
 */
export interface PlanningContext {
    requestType: string;
    parameters: Record<string, any>;
    userPreferences?: {
        investmentHorizon?: 'short' | 'medium' | 'long';
        riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
        sectors?: string[];
        assetClasses?: string[];
    };
    constraints?: {
        timeLimit?: number;
        budgetLimit?: number;
        dataSourceRestrictions?: string[];
        complianceRequirements?: string[];
    };
    availableResources?: {
        dataSources: string[];
        analysisTools: string[];
        timeAllocation: number;
    };
}

/**
 * Research plan structure
 */
export interface ResearchPlan {
    id: string;
    conversationId: string;
    objectives: string[];
    researchQuestions: string[];
    dataSources: {
        source: string;
        type: 'proprietary' | 'public' | 'market' | 'regulatory';
        priority: 'high' | 'medium' | 'low';
        estimatedTime: number;
        dependencies: string[];
    }[];
    methodology: string;
    expectedOutcomes: string[];
    riskFactors: string[];
    createdAt: Date;
    updatedAt: Date;
    status: 'draft' | 'approved' | 'active' | 'completed' | 'adapted';
}

/**
 * Analysis plan structure
 */
export interface AnalysisPlan {
    id: string;
    conversationId: string;
    analysisType: 'fundamental' | 'technical' | 'quantitative' | 'qualitative' | 'mixed';
    analysisSteps: {
        step: string;
        description: string;
        requiredData: string[];
        expectedOutput: string;
        estimatedTime: number;
        dependencies: string[];
        agent: AgentType;
    }[];
    metrics: string[];
    validationCriteria: string[];
    confidenceThresholds: {
        minimum: number;
        target: number;
    };
    createdAt: Date;
    updatedAt: Date;
    status: 'draft' | 'approved' | 'active' | 'completed' | 'adapted';
}

/**
 * Task dependency graph
 */
export interface TaskDependency {
    taskId: string;
    dependsOn: string[];
    blockedBy: string[];
    criticalPath: boolean;
    estimatedDuration: number;
    actualDuration?: number;
}

/**
 * Resource estimation
 */
export interface ResourceEstimation {
    totalEstimatedTime: number;
    agentAllocations: {
        agent: AgentType;
        estimatedTime: number;
        taskCount: number;
        utilizationRate: number;
    }[];
    dataRequirements: {
        source: string;
        volume: string;
        processingTime: number;
    }[];
    computationalRequirements: {
        modelCalls: number;
        estimatedCost: number;
        memoryRequirements: string;
    };
    riskFactors: {
        factor: string;
        impact: 'low' | 'medium' | 'high';
        mitigation: string;
    }[];
}

/**
 * Plan adaptation result
 */
export interface PlanAdaptation {
    adaptationId: string;
    originalPlanId: string;
    trigger: string;
    changes: {
        type: 'add' | 'remove' | 'modify' | 'reorder';
        target: string;
        description: string;
        impact: string;
    }[];
    newEstimations: ResourceEstimation;
    justification: string;
    approvalRequired: boolean;
    createdAt: Date;
}

/**
 * Planning Agent implementation
 */
export class PlanningAgent {
    private claudeSonnetService: ClaudeSonnetService;
    private researchPlans: Map<string, ResearchPlan> = new Map();
    private analysisPlans: Map<string, AnalysisPlan> = new Map();
    private taskDependencies: Map<string, TaskDependency> = new Map();
    private resourceEstimations: Map<string, ResourceEstimation> = new Map();
    private planAdaptations: Map<string, PlanAdaptation> = new Map();
    private testMode: boolean = false;

    constructor(
        claudeSonnetService: ClaudeSonnetService,
        testMode: boolean = false
    ) {
        this.claudeSonnetService = claudeSonnetService;
        this.testMode = testMode;
    }

    /**
     * Create a comprehensive research plan
     */
    async createResearchPlan(
        conversationId: string,
        context: PlanningContext
    ): Promise<ResearchPlan> {
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
                template: ClaudePromptTemplate.MARKET_RESEARCH,
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

            const researchPlan: ResearchPlan = {
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
        } catch (error) {
            console.error('Error creating research plan:', error);
            throw new Error(`Failed to create research plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create a detailed analysis plan
     */
    async createAnalysisPlan(
        conversationId: string,
        context: PlanningContext,
        researchPlan: ResearchPlan
    ): Promise<AnalysisPlan> {
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
                template: ClaudePromptTemplate.INVESTMENT_ANALYSIS,
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

            const analysisPlan: AnalysisPlan = {
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
        } catch (error) {
            console.error('Error creating analysis plan:', error);
            throw new Error(`Failed to create analysis plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Analyze task dependencies and create dependency graph
     */
    async analyzeDependencies(
        researchPlan: ResearchPlan,
        analysisPlan: AnalysisPlan
    ): Promise<Map<string, TaskDependency>> {
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
            const dependencies = new Map<string, TaskDependency>();

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
                    criticalPath: false, // Will be determined by dependency analysis
                    estimatedDuration: step.estimatedTime
                });
            });

            // Update dependencies based on AI analysis
            if (dependencyData.dependencies && Array.isArray(dependencyData.dependencies)) {
                dependencyData.dependencies.forEach((dep: any) => {
                    if (dependencies.has(dep.taskId)) {
                        const existing = dependencies.get(dep.taskId)!;
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
        } catch (error) {
            console.error('Error analyzing dependencies:', error);
            throw new Error(`Failed to analyze dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Estimate resource requirements
     */
    async estimateResources(
        researchPlan: ResearchPlan,
        analysisPlan: AnalysisPlan,
        dependencies: Map<string, TaskDependency>
    ): Promise<ResourceEstimation> {
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

            const resourceEstimation: ResourceEstimation = {
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
        } catch (error) {
            console.error('Error estimating resources:', error);
            throw new Error(`Failed to estimate resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Adapt plan based on intermediate findings
     */
    async adaptPlan(
        planId: string,
        planType: 'research' | 'analysis',
        intermediateFindings: any,
        trigger: string
    ): Promise<PlanAdaptation> {
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

            const adaptation: PlanAdaptation = {
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
        } catch (error) {
            console.error('Error adapting plan:', error);
            throw new Error(`Failed to adapt plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get research plan by ID
     */
    getResearchPlan(planId: string): ResearchPlan | undefined {
        return this.researchPlans.get(planId);
    }

    /**
     * Get analysis plan by ID
     */
    getAnalysisPlan(planId: string): AnalysisPlan | undefined {
        return this.analysisPlans.get(planId);
    }

    /**
     * Get task dependencies
     */
    getTaskDependencies(): Map<string, TaskDependency> {
        return new Map(this.taskDependencies);
    }

    /**
     * Get resource estimation
     */
    getResourceEstimation(conversationId: string): ResourceEstimation | undefined {
        return this.resourceEstimations.get(conversationId);
    }

    /**
     * Get plan adaptations
     */
    getPlanAdaptations(): Map<string, PlanAdaptation> {
        return new Map(this.planAdaptations);
    }

    /**
     * Process planning message
     */
    async processMessage(message: AgentMessage): Promise<AgentMessage> {
        try {
            const { content } = message;
            let response: any;

            switch (content.taskType) {
                case PlanningTaskType.RESEARCH_PLAN:
                    response = await this.createResearchPlan(
                        content.conversationId,
                        content.context
                    );
                    break;

                case PlanningTaskType.ANALYSIS_PLAN:
                    response = await this.createAnalysisPlan(
                        content.conversationId,
                        content.context,
                        content.researchPlan
                    );
                    break;

                case PlanningTaskType.DEPENDENCY_ANALYSIS:
                    response = await this.analyzeDependencies(
                        content.researchPlan,
                        content.analysisPlan
                    );
                    break;

                case PlanningTaskType.RESOURCE_ESTIMATION:
                    response = await this.estimateResources(
                        content.researchPlan,
                        content.analysisPlan,
                        content.dependencies
                    );
                    break;

                case PlanningTaskType.PLAN_ADAPTATION:
                    response = await this.adaptPlan(
                        content.planId,
                        content.planType,
                        content.intermediateFindings,
                        content.trigger
                    );
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
        } catch (error) {
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

    private parseStructuredResponse(response: string): any {
        try {
            // Try to extract JSON from code blocks
            const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1].trim());
            }

            // Try to parse the entire response as JSON
            return JSON.parse(response);
        } catch (error) {
            console.warn('Failed to parse structured response, using fallback');
            return {};
        }
    }

    private formatDataSources(sources: any[]): ResearchPlan['dataSources'] {
        return sources.map((source, index) => ({
            source: source.source || `Data Source ${index + 1}`,
            type: source.type || 'public',
            priority: source.priority || 'medium',
            estimatedTime: source.estimatedTime || 5000,
            dependencies: source.dependencies || []
        }));
    }

    private formatAnalysisSteps(steps: any[]): AnalysisPlan['analysisSteps'] {
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

    private calculateBlockedByRelationships(dependencies: Map<string, TaskDependency>): void {
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

    private formatAgentAllocations(allocations: any, analysisPlan: AnalysisPlan): ResourceEstimation['agentAllocations'] {
        const defaultAllocations = [
            { agent: 'research' as AgentType, estimatedTime: 15000, taskCount: 3, utilizationRate: 0.8 },
            { agent: 'analysis' as AgentType, estimatedTime: 20000, taskCount: analysisPlan.analysisSteps.length, utilizationRate: 0.9 },
            { agent: 'compliance' as AgentType, estimatedTime: 8000, taskCount: 2, utilizationRate: 0.7 },
            { agent: 'synthesis' as AgentType, estimatedTime: 12000, taskCount: 1, utilizationRate: 0.6 }
        ];

        if (!allocations || !Array.isArray(allocations)) {
            return defaultAllocations;
        }

        return allocations.map((alloc: any) => ({
            agent: alloc.agent || 'research',
            estimatedTime: alloc.estimatedTime || 10000,
            taskCount: alloc.taskCount || 1,
            utilizationRate: alloc.utilizationRate || 0.8
        }));
    }

    private formatDataRequirements(requirements: any, researchPlan: ResearchPlan): ResourceEstimation['dataRequirements'] {
        const defaultRequirements = researchPlan.dataSources.map(source => ({
            source: source.source,
            volume: 'Medium',
            processingTime: source.estimatedTime
        }));

        if (!requirements || !Array.isArray(requirements)) {
            return defaultRequirements;
        }

        return requirements.map((req: any) => ({
            source: req.source || 'Unknown',
            volume: req.volume || 'Medium',
            processingTime: req.processingTime || 5000
        }));
    }

    private formatRiskFactors(factors: any): ResourceEstimation['riskFactors'] {
        const defaultFactors = [
            { factor: 'Data availability', impact: 'medium' as const, mitigation: 'Use alternative data sources' },
            { factor: 'Model accuracy', impact: 'high' as const, mitigation: 'Cross-validate with multiple models' },
            { factor: 'Time constraints', impact: 'medium' as const, mitigation: 'Prioritize critical tasks' }
        ];

        if (!factors || !Array.isArray(factors)) {
            return defaultFactors;
        }

        return factors.map((factor: any) => ({
            factor: factor.factor || 'Unknown risk',
            impact: factor.impact || 'medium',
            mitigation: factor.mitigation || 'Monitor and adjust'
        }));
    }

    private formatPlanChanges(changes: any[]): PlanAdaptation['changes'] {
        return changes.map(change => ({
            type: change.type || 'modify',
            target: change.target || 'unknown',
            description: change.description || 'Plan modification',
            impact: change.impact || 'Low impact on timeline'
        }));
    }

    private async recalculateEstimations(planId: string, changes: any[]): Promise<ResourceEstimation> {
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

    private async applyPlanChanges(planId: string, planType: 'research' | 'analysis', changes: PlanAdaptation['changes']): Promise<void> {
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

    private generatePlanId(type: string): string {
        return `${type}_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateAdaptationId(): string {
        return `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}