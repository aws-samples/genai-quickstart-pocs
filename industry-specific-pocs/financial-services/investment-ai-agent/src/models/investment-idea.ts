/**
 * Investment Idea model with comprehensive validation, versioning, and tracking
 */

import { Investment } from './investment';
import { DataPoint } from './analysis';

export interface InvestmentIdea {
  id: string;
  version: number;
  title: string;
  description: string;
  investments: Investment[];
  rationale: string;
  strategy: InvestmentStrategy;
  timeHorizon: TimeHorizon;
  confidenceScore: number;
  generatedAt: Date;
  expiresAt?: Date;
  lastUpdatedAt: Date;
  potentialOutcomes: Outcome[];
  supportingData: DataPoint[];
  counterArguments: CounterArgument[];
  complianceStatus: ComplianceResult;
  createdBy: string; // Model ID or agent identifier
  tags: string[];
  category: InvestmentCategory;
  riskLevel: RiskLevel;
  targetAudience: TargetAudience[];
  metadata: InvestmentIdeaMetadata;
  trackingInfo: TrackingInfo;
}

export type InvestmentStrategy = 
  | 'buy' 
  | 'sell' 
  | 'hold' 
  | 'short' 
  | 'long' 
  | 'hedge' 
  | 'arbitrage' 
  | 'pairs-trade' 
  | 'momentum' 
  | 'value' 
  | 'growth' 
  | 'income' 
  | 'complex';

export type TimeHorizon = 
  | 'intraday' 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'very-long';

export type InvestmentCategory = 
  | 'equity' 
  | 'fixed-income' 
  | 'commodity' 
  | 'currency' 
  | 'alternative' 
  | 'mixed' 
  | 'thematic' 
  | 'sector-rotation' 
  | 'macro';

export type RiskLevel = 
  | 'very-low' 
  | 'low' 
  | 'moderate' 
  | 'high' 
  | 'very-high';

export type TargetAudience = 
  | 'retail' 
  | 'institutional' 
  | 'high-net-worth' 
  | 'pension-fund' 
  | 'hedge-fund' 
  | 'family-office';

export interface Outcome {
  scenario: 'best' | 'expected' | 'worst';
  probability: number;
  returnEstimate: number;
  timeToRealization: number; // in days
  description: string;
  conditions: string[];
  keyRisks: string[];
  catalysts: string[];
}

export interface CounterArgument {
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  impact: 'low' | 'medium' | 'high';
  mitigationStrategy?: string;
  probability: number;
}

export interface ComplianceResult {
  compliant: boolean;
  issues: ComplianceIssue[];
  regulationsChecked: string[];
  timestamp: Date;
  reviewedBy?: string;
  nextReviewDate?: Date;
}

export interface ComplianceIssue {
  severity: 'info' | 'warning' | 'critical';
  regulation: string;
  description: string;
  remediation?: string;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export interface InvestmentIdeaMetadata {
  sourceModels: string[];
  processingTime: number; // in milliseconds
  dataSourcesUsed: string[];
  researchDepth: 'basic' | 'standard' | 'comprehensive';
  qualityScore: number; // 0-100
  noveltyScore: number; // 0-100
  marketConditionsAtGeneration: MarketConditions;
}

export interface MarketConditions {
  volatilityIndex: number;
  marketTrend: 'bull' | 'bear' | 'sideways';
  economicIndicators: Record<string, number>;
  geopoliticalRisk: 'low' | 'medium' | 'high';
}

export interface TrackingInfo {
  views: number;
  implementations: number;
  feedback: FeedbackEntry[];
  performance: PerformanceTracking[];
  status: IdeaStatus;
  statusHistory: StatusHistoryEntry[];
}

export type IdeaStatus = 
  | 'active' 
  | 'implemented' 
  | 'expired' 
  | 'invalidated' 
  | 'under-review' 
  | 'archived';

export interface FeedbackEntry {
  id: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  timestamp: Date;
  feedbackType: 'quality' | 'accuracy' | 'usefulness' | 'clarity';
}

export interface PerformanceTracking {
  date: Date;
  actualReturn: number;
  expectedReturn: number;
  variance: number;
  notes?: string;
}

export interface StatusHistoryEntry {
  status: IdeaStatus;
  timestamp: Date;
  reason?: string;
  changedBy: string;
}

// Validation interfaces and types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  recommendation?: string;
}

// Version control interfaces
export interface InvestmentIdeaVersion {
  version: number;
  timestamp: Date;
  changes: VersionChange[];
  changedBy: string;
  reason?: string;
}

export interface VersionChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

// Creation and update request interfaces
export interface CreateInvestmentIdeaRequest {
  title: string;
  description: string;
  investments: Investment[];
  rationale: string;
  strategy: InvestmentStrategy;
  timeHorizon: TimeHorizon;
  confidenceScore: number;
  expiresAt?: Date;
  potentialOutcomes: Outcome[];
  supportingData: DataPoint[];
  counterArguments: CounterArgument[];
  tags?: string[];
  category: InvestmentCategory;
  riskLevel: RiskLevel;
  targetAudience: TargetAudience[];
  createdBy: string;
}

export interface UpdateInvestmentIdeaRequest {
  id: string;
  title?: string;
  description?: string;
  rationale?: string;
  confidenceScore?: number;
  expiresAt?: Date;
  potentialOutcomes?: Outcome[];
  counterArguments?: CounterArgument[];
  tags?: string[];
  riskLevel?: RiskLevel;
  targetAudience?: TargetAudience[];
  updatedBy: string;
  reason?: string;
}