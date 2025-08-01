/**
 * Service interfaces for communication between components
 */

import { Investment } from './investment';
import { AnalysisResult } from './analysis';
import { InvestmentIdea, ComplianceResult } from './investment-idea';
import { UserRequest, RequestResult } from './request';

/**
 * Knowledge Integration Service interface
 */
export interface KnowledgeService {
  uploadProprietaryData(data: File, metadata: DataMetadata): Promise<UploadResult>;
  performWebSearch(query: string, options: WebSearchOptions): Promise<WebSearchResult>;
  performDeepResearch(topic: string, options: DeepResearchOptions): Promise<ResearchResult>;
  connectMarketDataFeed(feedConfig: MarketFeedConfig): Promise<ConnectionStatus>;
  queryKnowledgeBase(query: Query, filters: QueryFilters): Promise<QueryResult>;
  updateKnowledgeBase(source: string): Promise<UpdateResult>;
}

export interface DataMetadata {
  source: string;
  type: 'financial' | 'research' | 'news' | 'proprietary' | 'other';
  timestamp: Date;
  confidentiality: 'public' | 'private' | 'restricted';
  tags: string[];
}

export interface WebSearchOptions {
  depth: 'basic' | 'comprehensive';
  sources: string[];
  timeframe: 'recent' | 'past-week' | 'past-month' | 'past-year' | 'all-time';
  maxResults: number;
}

export interface DeepResearchOptions {
  depth: 'standard' | 'deep' | 'comprehensive';
  focusAreas: string[];
  includeSources: string[];
  excludeSources: string[];
  timeConstraint: number; // in seconds
}

export interface Query {
  text: string;
  type: 'keyword' | 'semantic' | 'hybrid';
  context?: Record<string, any>;
}

export interface QueryFilters {
  sources?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  confidentiality?: ('public' | 'private' | 'restricted')[];
  types?: string[];
  relevanceThreshold?: number;
}

export interface QueryResult {
  items: QueryResultItem[];
  totalCount: number;
  executionTime: number;
  nextToken?: string;
}

export interface QueryResultItem {
  id: string;
  source: string;
  type: string;
  content: any;
  relevanceScore: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface UploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
  processingStatus: 'queued' | 'processing' | 'completed' | 'failed';
  processingTime?: number;
}

export interface UpdateResult {
  success: boolean;
  updatedItems: number;
  failedItems: number;
  timestamp: Date;
}

export interface WebSearchResult {
  results: WebSearchResultItem[];
  totalResults: number;
  executionTime: number;
  nextPage?: string;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishDate?: Date;
  relevanceScore: number;
}

export interface ResearchResult {
  summary: string;
  keyFindings: string[];
  sources: ResearchSource[];
  relatedTopics: string[];
  confidence: number;
}

export interface ResearchSource {
  title: string;
  url?: string;
  author?: string;
  publishDate?: Date;
  publisher?: string;
  relevance: number;
  excerpts: string[];
}

export interface MarketFeedConfig {
  provider: string;
  dataTypes: string[];
  symbols: string[];
  interval: 'tick' | '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' | 'daily';
  apiKey?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connectionId?: string;
  error?: string;
  latency?: number;
}

/**
 * Model Selection Service interface
 */
export interface ModelSelectionService {
  selectModel(task: Task, context: ModelContext): Promise<SelectedModel>;
  evaluateModelPerformance(modelId: string, task: Task): Promise<PerformanceMetrics>;
  registerCustomModel(model: ModelDefinition): Promise<RegistrationResult>;
}

export interface Task {
  type: 'text-generation' | 'classification' | 'time-series-analysis' | 'sentiment-analysis' | 'entity-extraction';
  complexity: 'simple' | 'medium' | 'complex';
  domain: 'general' | 'financial' | 'regulatory' | 'market';
  priority: 'low' | 'medium' | 'high';
  agentRole: 'supervisor' | 'planning' | 'research' | 'analysis' | 'compliance' | 'synthesis';
}

export interface ModelContext {
  dataSize: number;
  timeConstraint: number;
  accuracyRequirement: 'low' | 'medium' | 'high';
  explainabilityRequirement: 'low' | 'medium' | 'high';
}

export interface SelectedModel {
  id: string;
  name: 'Claude-Sonnet-3.7' | 'Claude-Haiku-3.5' | 'Amazon-Nova-Pro';
  version: string;
  capabilities: string[];
  limitations: string[];
  configurationParameters: Record<string, any>;
}

export interface ModelDefinition {
  id: string;
  name: string;
  version: string;
  provider: string;
  capabilities: string[];
  limitations: string[];
  configurationSchema: Record<string, any>;
}

export interface PerformanceMetrics {
  accuracy: number;
  latency: number;
  throughput: number;
  costPerRequest: number;
  errorRate: number;
  customMetrics: Record<string, number>;
}

export interface RegistrationResult {
  success: boolean;
  modelId?: string;
  error?: string;
}

/**
 * Investment Idea Generator Service interface
 */
export interface IdeaGeneratorService {
  generateIdeas(parameters: IdeaParameters): Promise<InvestmentIdea[]>;
  evaluateInvestment(investment: Investment): Promise<EvaluationResult>;
  compareInvestments(investments: Investment[]): Promise<ComparisonResult>;
}

export interface IdeaParameters {
  investmentHorizon: 'short' | 'medium' | 'long';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  sectors?: string[];
  assetClasses?: string[];
  excludedInvestments?: string[];
  minimumConfidence?: number;
  maximumIdeas?: number;
}

export interface EvaluationResult {
  investment: Investment;
  score: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendation: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;
}

export interface ComparisonResult {
  investments: Investment[];
  comparisonMatrix: Record<string, Record<string, any>>;
  rankings: Record<string, number>;
  recommendation: string;
  rationale: string;
}

/**
 * Compliance Service interface
 */
export interface ComplianceService {
  checkCompliance(investment: Investment): Promise<ComplianceResult>;
  getRegulationDetails(regulationId: string): Promise<RegulationDetails>;
  evaluateRisk(investment: Investment, context: RiskContext): Promise<RiskAssessment>;
  monitorRegulationChanges(): Promise<RegulationUpdates>;
}

export interface RegulationDetails {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  effectiveDate: Date;
  requirements: string[];
  applicability: string[];
  references: string[];
}

export interface RiskContext {
  portfolioComposition: Record<string, number>;
  marketConditions: Record<string, any>;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  regulatoryContext: string[];
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'very-high';
  riskFactors: {
    factor: string;
    level: 'low' | 'medium' | 'high' | 'very-high';
    description: string;
  }[];
  mitigationStrategies: string[];
  scenarioAnalysis: Record<string, any>;
}

export interface RegulationUpdates {
  newRegulations: RegulationDetails[];
  updatedRegulations: {
    regulation: RegulationDetails;
    changes: string[];
  }[];
  upcomingRegulations: {
    regulation: RegulationDetails;
    effectiveDate: Date;
  }[];
}