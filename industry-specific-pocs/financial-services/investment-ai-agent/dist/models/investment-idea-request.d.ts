/**
 * Investment Idea Request models for handling user requests
 */
import { InvestmentIdea } from './investment-idea';
export interface InvestmentIdeaGenerationRequest {
    id: string;
    userId: string;
    parameters: InvestmentIdeaRequestParameters;
    priority: RequestPriority;
    timestamp: Date;
    status: RequestStatus;
    callback?: CallbackConfiguration;
    estimatedProcessingTime?: number;
    actualProcessingTime?: number;
    metadata?: RequestMetadata;
}
export interface InvestmentIdeaRequestParameters {
    investmentHorizon: TimeHorizon;
    riskTolerance: RiskTolerance;
    investmentAmount?: number;
    currency?: string;
    sectors?: string[];
    assetClasses?: AssetClass[];
    geographicFocus?: GeographicRegion[];
    excludedInvestments?: string[];
    excludedSectors?: string[];
    minimumConfidence?: number;
    maximumIdeas?: number;
    includeAlternatives?: boolean;
    includeESGFactors?: boolean;
    researchDepth?: ResearchDepth;
    thematicFocus?: string[];
    marketConditions?: MarketCondition[];
    liquidityRequirement?: LiquidityRequirement;
    taxConsiderations?: TaxConsideration[];
    regulatoryConstraints?: string[];
    customCriteria?: CustomCriterion[];
    modelPreferences?: ModelPreference[];
    outputFormat?: OutputFormat;
    includeVisualizations?: boolean;
    includeBacktesting?: boolean;
    includeRiskAnalysis?: boolean;
}
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RequestStatus = 'submitted' | 'validated' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
export type TimeHorizon = 'intraday' | 'short-term' | 'medium-term' | 'long-term' | 'flexible';
export type RiskTolerance = 'very-conservative' | 'conservative' | 'moderate' | 'aggressive' | 'very-aggressive';
export type AssetClass = 'equities' | 'fixed-income' | 'commodities' | 'currencies' | 'real-estate' | 'alternatives' | 'cryptocurrencies' | 'derivatives';
export type GeographicRegion = 'north-america' | 'europe' | 'asia-pacific' | 'emerging-markets' | 'global' | 'domestic';
export type ResearchDepth = 'basic' | 'standard' | 'comprehensive' | 'deep-dive';
export type MarketCondition = 'bull-market' | 'bear-market' | 'volatile' | 'stable' | 'uncertain' | 'crisis';
export type LiquidityRequirement = 'high' | 'medium' | 'low' | 'flexible';
export type TaxConsideration = 'tax-efficient' | 'tax-deferred' | 'tax-exempt' | 'capital-gains-focused' | 'dividend-focused';
export type OutputFormat = 'detailed' | 'summary' | 'executive' | 'technical' | 'presentation';
export interface CustomCriterion {
    name: string;
    description: string;
    weight: number;
    type: 'include' | 'exclude' | 'prefer' | 'avoid';
    value: any;
}
export interface ModelPreference {
    modelType: 'claude-sonnet' | 'claude-haiku' | 'amazon-nova-pro';
    taskType: 'research' | 'analysis' | 'synthesis' | 'compliance';
    weight: number;
}
export interface CallbackConfiguration {
    url: string;
    method?: 'POST' | 'PUT';
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'basic' | 'api-key';
        credentials: string;
    };
    retryPolicy?: {
        maxRetries: number;
        backoffMultiplier: number;
        maxBackoffTime: number;
    };
}
export interface RequestMetadata {
    clientVersion?: string;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    referrer?: string;
    experimentFlags?: Record<string, boolean>;
}
export interface RequestTracking {
    requestId: string;
    userId: string;
    status: RequestStatus;
    progress: RequestProgress;
    estimatedTimeRemaining?: number;
    currentStep: ProcessingStep;
    results?: InvestmentIdeaRequestResult;
    errors?: RequestError[];
    warnings?: RequestWarning[];
    lastUpdated: Date;
    processingHistory: ProcessingHistoryEntry[];
}
export interface RequestProgress {
    percentage: number;
    currentPhase: ProcessingPhase;
    completedSteps: ProcessingStep[];
    totalSteps: number;
    startTime: Date;
    estimatedEndTime?: Date;
}
export type ProcessingPhase = 'validation' | 'planning' | 'research' | 'analysis' | 'compliance' | 'synthesis' | 'finalization';
export type ProcessingStep = 'parameter-validation' | 'user-authentication' | 'request-queuing' | 'research-planning' | 'data-collection' | 'market-analysis' | 'idea-generation' | 'compliance-check' | 'risk-assessment' | 'result-synthesis' | 'output-formatting' | 'quality-assurance';
export interface ProcessingHistoryEntry {
    step: ProcessingStep;
    status: 'started' | 'completed' | 'failed' | 'skipped';
    timestamp: Date;
    duration?: number;
    details?: string;
    agentId?: string;
    modelUsed?: string;
}
export interface RequestError {
    code: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    step: ProcessingStep;
    timestamp: Date;
    details?: any;
    recoverable: boolean;
}
export interface RequestWarning {
    code: string;
    message: string;
    step: ProcessingStep;
    timestamp: Date;
    recommendation?: string;
}
export interface InvestmentIdeaRequestResult {
    requestId: string;
    status: RequestStatus;
    investmentIdeas: InvestmentIdea[];
    processingMetrics: ProcessingMetrics;
    generatedAt: Date;
    expiresAt?: Date;
    metadata: ResultMetadata;
    qualityScore: number;
    confidenceScore: number;
}
export interface ProcessingMetrics {
    totalProcessingTime: number;
    modelExecutionTime: number;
    dataRetrievalTime: number;
    validationTime: number;
    resourcesUsed: ResourceUsage;
    modelsUsed: ModelUsage[];
    dataSourcesAccessed: DataSourceUsage[];
}
export interface ResourceUsage {
    cpuTime: number;
    memoryPeak: number;
    networkRequests: number;
    storageOperations: number;
    estimatedCost: number;
}
export interface ModelUsage {
    modelId: string;
    modelName: string;
    executionCount: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    executionTime: number;
    cost: number;
}
export interface DataSourceUsage {
    sourceId: string;
    sourceName: string;
    requestCount: number;
    dataVolume: number;
    responseTime: number;
    reliability: number;
}
export interface ResultMetadata {
    generationMethod: 'multi-agent' | 'single-model' | 'hybrid';
    researchSources: string[];
    marketDataTimestamp: Date;
    complianceVersion: string;
    qualityChecks: QualityCheck[];
    biasAssessment: BiasAssessment;
    userFeedback?: RequestFeedback;
}
export interface QualityCheck {
    checkType: 'consistency' | 'accuracy' | 'completeness' | 'relevance';
    passed: boolean;
    score: number;
    details?: string;
}
export interface BiasAssessment {
    overallBiasScore: number;
    biasTypes: BiasType[];
    mitigationApplied: string[];
}
export interface BiasType {
    type: 'confirmation' | 'availability' | 'anchoring' | 'recency' | 'survivorship';
    severity: 'low' | 'medium' | 'high';
    description: string;
    mitigation?: string;
}
export interface RequestFeedback {
    id: string;
    requestId: string;
    userId: string;
    rating: number;
    comments?: string;
    usefulnessScore?: number;
    accuracyScore?: number;
    insightScore?: number;
    timestamp: Date;
    actionTaken?: ActionTaken;
    specificFeedback?: SpecificFeedback[];
}
export type ActionTaken = 'implemented' | 'partially-implemented' | 'considered' | 'rejected' | 'pending' | 'requires-more-research';
export interface SpecificFeedback {
    ideaId: string;
    aspect: 'rationale' | 'risk-assessment' | 'return-estimate' | 'timing' | 'compliance';
    rating: number;
    comment?: string;
}
export interface RequestHistoryFilter {
    status?: RequestStatus;
    dateFrom?: Date;
    dateTo?: Date;
    priority?: RequestPriority;
    investmentHorizon?: TimeHorizon;
    riskTolerance?: RiskTolerance;
}
export interface RequestHistoryEntry {
    id: string;
    parameters: InvestmentIdeaRequestParameters;
    status: RequestStatus;
    priority: RequestPriority;
    submittedAt: Date;
    completedAt?: Date;
    processingTime?: number;
    resultCount?: number;
    qualityScore?: number;
    userRating?: number;
}
export interface RequestHistoryResponse {
    requests: RequestHistoryEntry[];
    total: number;
    page: number;
    limit: number;
    filters: RequestHistoryFilter;
}
