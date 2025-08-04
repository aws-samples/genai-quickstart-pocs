/**
 * Investment Idea Generation Orchestration Service
 *
 * This service orchestrates the multi-agent workflow for generating investment ideas,
 * implements filtering based on user preferences, and provides confidence scoring and ranking.
 */
import { InvestmentIdea, InvestmentStrategy, TimeHorizon, TargetAudience } from '../models/investment-idea';
import { SupervisorAgent } from './ai/supervisor-agent';
import { PlanningAgent } from './ai/planning-agent';
import { ResearchAgent } from './ai/research-agent';
import { AnalysisAgent } from './ai/analysis-agent';
import { ComplianceAgent } from './ai/compliance-agent';
import { SynthesisAgent } from './ai/synthesis-agent';
import { InvestmentIdeaService } from './investment-idea-service';
import { MessageBus } from './communication/message-bus';
export interface IdeaGenerationRequest {
    userId: string;
    requestId: string;
    parameters: IdeaGenerationParameters;
    context?: IdeaGenerationContext;
}
export interface IdeaGenerationParameters {
    investmentHorizon: TimeHorizon;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    sectors?: string[];
    assetClasses?: string[];
    excludedInvestments?: string[];
    minimumConfidence?: number;
    maximumIdeas?: number;
    specificInvestments?: string[];
    marketConditions?: string[];
    thematicFocus?: string[];
    geographicFocus?: string[];
    targetAudience?: TargetAudience[];
    customFilters?: Record<string, any>;
}
export interface IdeaGenerationContext {
    userProfile?: UserProfile;
    marketContext?: MarketContext;
    portfolioContext?: PortfolioContext;
    complianceContext?: ComplianceContext;
}
export interface UserProfile {
    investmentExperience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    preferredStrategies: InvestmentStrategy[];
    historicalPreferences: string[];
    riskProfile: RiskProfile;
}
export interface RiskProfile {
    riskCapacity: number;
    riskTolerance: number;
    timeHorizon: TimeHorizon;
    liquidityNeeds: 'high' | 'medium' | 'low';
}
export interface MarketContext {
    currentConditions: string[];
    volatilityLevel: 'low' | 'medium' | 'high';
    marketTrend: 'bull' | 'bear' | 'sideways';
    economicIndicators: Record<string, number>;
    geopoliticalRisk: 'low' | 'medium' | 'high';
}
export interface PortfolioContext {
    currentHoldings?: string[];
    assetAllocation?: Record<string, number>;
    concentrationRisks?: string[];
    rebalancingNeeds?: string[];
}
export interface ComplianceContext {
    applicableRegulations: string[];
    restrictedInvestments: string[];
    mandatoryChecks: string[];
    organizationPolicies?: Record<string, any>;
}
export interface IdeaGenerationResult {
    requestId: string;
    ideas: RankedInvestmentIdea[];
    metadata: GenerationMetadata;
    processingMetrics: ProcessingMetrics;
}
export interface RankedInvestmentIdea extends InvestmentIdea {
    rank: number;
    rankingScore: number;
    rankingFactors: RankingFactor[];
    filteredReasons?: string[];
}
export interface RankingFactor {
    factor: string;
    weight: number;
    score: number;
    contribution: number;
    explanation: string;
}
export interface GenerationMetadata {
    totalIdeasGenerated: number;
    totalIdeasFiltered: number;
    filteringCriteria: FilterCriteria[];
    confidenceDistribution: ConfidenceDistribution;
    processingSteps: ProcessingStep[];
}
export interface FilterCriteria {
    criterion: string;
    type: 'inclusion' | 'exclusion';
    value: any;
    appliedCount: number;
}
export interface ConfidenceDistribution {
    high: number;
    medium: number;
    low: number;
    average: number;
}
export interface ProcessingStep {
    step: string;
    agent: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: 'completed' | 'failed' | 'skipped';
    output?: any;
}
export interface ProcessingMetrics {
    totalProcessingTime: number;
    agentProcessingTimes: Record<string, number>;
    dataSourcesAccessed: string[];
    modelsUsed: string[];
    resourceUtilization: Record<string, number>;
}
export declare class InvestmentIdeaOrchestrationService {
    private supervisorAgent;
    private planningAgent;
    private researchAgent;
    private analysisAgent;
    private complianceAgent;
    private synthesisAgent;
    private investmentIdeaService;
    private messageBus;
    private activeRequests;
    constructor(supervisorAgent: SupervisorAgent, planningAgent: PlanningAgent, researchAgent: ResearchAgent, analysisAgent: AnalysisAgent, complianceAgent: ComplianceAgent, synthesisAgent: SynthesisAgent, investmentIdeaService: InvestmentIdeaService, messageBus: MessageBus);
    /**
     * Generate investment ideas based on user parameters
     */
    generateInvestmentIdeas(request: IdeaGenerationRequest): Promise<IdeaGenerationResult>;
    /**
     * Execute planning phase
     */
    private executePlanningPhase;
    /**
     * Execute research phase
     */
    private executeResearchPhase;
    /**
     * Execute analysis phase
     */
    private executeAnalysisPhase;
    /**
     * Execute compliance phase
     */
    private executeCompliancePhase;
    /**
     * Execute synthesis phase
     */
    private executeSynthesisPhase;
    /**
     * Filter and rank investment ideas based on user preferences
     */
    private filterAndRankIdeas;
    /**
     * Apply filtering criteria to investment ideas
     */
    private applyFilters;
    /**
     * Calculate ranking scores for investment ideas
     */
    private calculateRankingScores;
    private isCompatibleTimeHorizon;
    private isCompatibleRiskLevel;
    private matchesSectorCriteria;
    private matchesAssetClassCriteria;
    private containsExcludedInvestments;
    private matchesTargetAudience;
    private calculateRiskReturnScore;
    private calculateTimeHorizonScore;
    private calculateMarketTimingScore;
    private updateConfidenceDistribution;
    private extractObjectives;
    private createResearchRequests;
    private extractMarketInsights;
    private extractTrendAnalysis;
    private extractRiskAssessment;
    private extractOpportunities;
    private filterByCompliance;
    private convertToInvestmentIdeas;
    /**
     * Get active request status
     */
    getActiveRequestStatus(requestId: string): IdeaGenerationRequest | undefined;
    /**
     * Cancel active request
     */
    cancelRequest(requestId: string): boolean;
    /**
     * Get processing statistics
     */
    getProcessingStatistics(): {
        activeRequests: number;
        totalProcessed: number;
        averageProcessingTime: number;
    };
    /**
     * Convert TimeHorizon to the format expected by agents
     */
    private convertTimeHorizon;
    /**
     * Convert IdeaGenerationContext to ConversationContext
     */
    private convertToConversationContext;
}
