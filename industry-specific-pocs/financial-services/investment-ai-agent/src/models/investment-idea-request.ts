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
  estimatedProcessingTime?: number; // in seconds
  actualProcessingTime?: number; // in seconds
  metadata?: RequestMetadata;
}

export interface InvestmentIdeaRequestParameters {
  // Core investment preferences
  investmentHorizon: TimeHorizon;
  riskTolerance: RiskTolerance;
  investmentAmount?: number;
  currency?: string;

  // Asset and sector preferences
  sectors?: string[];
  assetClasses?: AssetClass[];
  geographicFocus?: GeographicRegion[];
  excludedInvestments?: string[];
  excludedSectors?: string[];

  // Generation parameters
  minimumConfidence?: number; // 0-100
  maximumIdeas?: number; // 1-20
  includeAlternatives?: boolean;
  includeESGFactors?: boolean;

  // Research depth and focus
  researchDepth?: ResearchDepth;
  thematicFocus?: string[];
  marketConditions?: MarketCondition[];
  
  // Specific constraints
  liquidityRequirement?: LiquidityRequirement;
  taxConsiderations?: TaxConsideration[];
  regulatoryConstraints?: string[];
  
  // Custom parameters for advanced users
  customCriteria?: CustomCriterion[];
  modelPreferences?: ModelPreference[];
  
  // Output preferences
  outputFormat?: OutputFormat;
  includeVisualizations?: boolean;
  includeBacktesting?: boolean;
  includeRiskAnalysis?: boolean;
}

export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 
  | 'submitted'
  | 'validated'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export type TimeHorizon = 
  | 'intraday'
  | 'short-term'    // < 1 year
  | 'medium-term'   // 1-5 years
  | 'long-term'     // > 5 years
  | 'flexible';

export type RiskTolerance = 
  | 'very-conservative'
  | 'conservative'
  | 'moderate'
  | 'aggressive'
  | 'very-aggressive';

export type AssetClass = 
  | 'equities'
  | 'fixed-income'
  | 'commodities'
  | 'currencies'
  | 'real-estate'
  | 'alternatives'
  | 'cryptocurrencies'
  | 'derivatives';

export type GeographicRegion = 
  | 'north-america'
  | 'europe'
  | 'asia-pacific'
  | 'emerging-markets'
  | 'global'
  | 'domestic';

export type ResearchDepth = 
  | 'basic'
  | 'standard'
  | 'comprehensive'
  | 'deep-dive';

export type MarketCondition = 
  | 'bull-market'
  | 'bear-market'
  | 'volatile'
  | 'stable'
  | 'uncertain'
  | 'crisis';

export type LiquidityRequirement = 
  | 'high'
  | 'medium'
  | 'low'
  | 'flexible';

export type TaxConsideration = 
  | 'tax-efficient'
  | 'tax-deferred'
  | 'tax-exempt'
  | 'capital-gains-focused'
  | 'dividend-focused';

export type OutputFormat = 
  | 'detailed'
  | 'summary'
  | 'executive'
  | 'technical'
  | 'presentation';

export interface CustomCriterion {
  name: string;
  description: string;
  weight: number; // 0-100
  type: 'include' | 'exclude' | 'prefer' | 'avoid';
  value: any;
}

export interface ModelPreference {
  modelType: 'claude-sonnet' | 'claude-haiku' | 'amazon-nova-pro';
  taskType: 'research' | 'analysis' | 'synthesis' | 'compliance';
  weight: number; // 0-100
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

// Request tracking and status interfaces
export interface RequestTracking {
  requestId: string;
  userId: string;
  status: RequestStatus;
  progress: RequestProgress;
  estimatedTimeRemaining?: number; // in seconds
  currentStep: ProcessingStep;
  results?: InvestmentIdeaRequestResult;
  errors?: RequestError[];
  warnings?: RequestWarning[];
  lastUpdated: Date;
  processingHistory: ProcessingHistoryEntry[];
}

export interface RequestProgress {
  percentage: number; // 0-100
  currentPhase: ProcessingPhase;
  completedSteps: ProcessingStep[];
  totalSteps: number;
  startTime: Date;
  estimatedEndTime?: Date;
}

export type ProcessingPhase = 
  | 'validation'
  | 'planning'
  | 'research'
  | 'analysis'
  | 'compliance'
  | 'synthesis'
  | 'finalization';

export type ProcessingStep = 
  | 'parameter-validation'
  | 'user-authentication'
  | 'request-queuing'
  | 'research-planning'
  | 'data-collection'
  | 'market-analysis'
  | 'idea-generation'
  | 'compliance-check'
  | 'risk-assessment'
  | 'result-synthesis'
  | 'output-formatting'
  | 'quality-assurance';

export interface ProcessingHistoryEntry {
  step: ProcessingStep;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  timestamp: Date;
  duration?: number; // in milliseconds
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

// Request result interfaces
export interface InvestmentIdeaRequestResult {
  requestId: string;
  status: RequestStatus;
  investmentIdeas: InvestmentIdea[];
  processingMetrics: ProcessingMetrics;
  generatedAt: Date;
  expiresAt?: Date;
  metadata: ResultMetadata;
  qualityScore: number; // 0-100
  confidenceScore: number; // 0-100
}

export interface ProcessingMetrics {
  totalProcessingTime: number; // in milliseconds
  modelExecutionTime: number; // in milliseconds
  dataRetrievalTime: number; // in milliseconds
  validationTime: number; // in milliseconds
  resourcesUsed: ResourceUsage;
  modelsUsed: ModelUsage[];
  dataSourcesAccessed: DataSourceUsage[];
}

export interface ResourceUsage {
  cpuTime: number; // in milliseconds
  memoryPeak: number; // in MB
  networkRequests: number;
  storageOperations: number;
  estimatedCost: number; // in USD
}

export interface ModelUsage {
  modelId: string;
  modelName: string;
  executionCount: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  executionTime: number; // in milliseconds
  cost: number; // in USD
}

export interface DataSourceUsage {
  sourceId: string;
  sourceName: string;
  requestCount: number;
  dataVolume: number; // in bytes
  responseTime: number; // in milliseconds
  reliability: number; // 0-100
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
  score: number; // 0-100
  details?: string;
}

export interface BiasAssessment {
  overallBiasScore: number; // 0-100, lower is better
  biasTypes: BiasType[];
  mitigationApplied: string[];
}

export interface BiasType {
  type: 'confirmation' | 'availability' | 'anchoring' | 'recency' | 'survivorship';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

// Request feedback interfaces
export interface RequestFeedback {
  id: string;
  requestId: string;
  userId: string;
  rating: number; // 1-5
  comments?: string;
  usefulnessScore?: number; // 1-5
  accuracyScore?: number; // 1-5
  insightScore?: number; // 1-5
  timestamp: Date;
  actionTaken?: ActionTaken;
  specificFeedback?: SpecificFeedback[];
}

export type ActionTaken = 
  | 'implemented'
  | 'partially-implemented'
  | 'considered'
  | 'rejected'
  | 'pending'
  | 'requires-more-research';

export interface SpecificFeedback {
  ideaId: string;
  aspect: 'rationale' | 'risk-assessment' | 'return-estimate' | 'timing' | 'compliance';
  rating: number; // 1-5
  comment?: string;
}

// Request history and filtering
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