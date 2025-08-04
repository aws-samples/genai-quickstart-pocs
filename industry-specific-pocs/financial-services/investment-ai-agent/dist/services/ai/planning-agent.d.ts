/**
 * Planning Agent Implementation
 *
 * The planning agent develops research and analysis plans, identifies required
 * information and data sources, creates task sequences with dependencies,
 * adapts plans based on intermediate findings, and estimates time and resource requirements.
 */
import { AgentType, AgentMessage } from '../../models/agent';
import { ClaudeSonnetService } from './claude-sonnet-service';
/**
 * Planning task types
 */
export declare enum PlanningTaskType {
    RESEARCH_PLAN = "research-plan",
    ANALYSIS_PLAN = "analysis-plan",
    DEPENDENCY_ANALYSIS = "dependency-analysis",
    RESOURCE_ESTIMATION = "resource-estimation",
    PLAN_ADAPTATION = "plan-adaptation"
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
export declare class PlanningAgent {
    private claudeSonnetService;
    private researchPlans;
    private analysisPlans;
    private taskDependencies;
    private resourceEstimations;
    private planAdaptations;
    private testMode;
    constructor(claudeSonnetService: ClaudeSonnetService, testMode?: boolean);
    /**
     * Create a comprehensive research plan
     */
    createResearchPlan(conversationId: string, context: PlanningContext): Promise<ResearchPlan>;
    /**
     * Create a detailed analysis plan
     */
    createAnalysisPlan(conversationId: string, context: PlanningContext, researchPlan: ResearchPlan): Promise<AnalysisPlan>;
    /**
     * Analyze task dependencies and create dependency graph
     */
    analyzeDependencies(researchPlan: ResearchPlan, analysisPlan: AnalysisPlan): Promise<Map<string, TaskDependency>>;
    /**
     * Estimate resource requirements
     */
    estimateResources(researchPlan: ResearchPlan, analysisPlan: AnalysisPlan, dependencies: Map<string, TaskDependency>): Promise<ResourceEstimation>;
    /**
     * Adapt plan based on intermediate findings
     */
    adaptPlan(planId: string, planType: 'research' | 'analysis', intermediateFindings: any, trigger: string): Promise<PlanAdaptation>;
    /**
     * Get research plan by ID
     */
    getResearchPlan(planId: string): ResearchPlan | undefined;
    /**
     * Get analysis plan by ID
     */
    getAnalysisPlan(planId: string): AnalysisPlan | undefined;
    /**
     * Get task dependencies
     */
    getTaskDependencies(): Map<string, TaskDependency>;
    /**
     * Get resource estimation
     */
    getResourceEstimation(conversationId: string): ResourceEstimation | undefined;
    /**
     * Get plan adaptations
     */
    getPlanAdaptations(): Map<string, PlanAdaptation>;
    /**
     * Process planning message
     */
    processMessage(message: AgentMessage): Promise<AgentMessage>;
    private parseStructuredResponse;
    private formatDataSources;
    private formatAnalysisSteps;
    private calculateBlockedByRelationships;
    private formatAgentAllocations;
    private formatDataRequirements;
    private formatRiskFactors;
    private formatPlanChanges;
    private recalculateEstimations;
    private applyPlanChanges;
    private generatePlanId;
    private generateAdaptationId;
}
