/**
 * Request models for user interactions with the Investment AI Agent
 */

export interface UserRequest {
  id: string;
  userId: string;
  requestType: RequestType;
  timestamp: Date;
  status: RequestStatus;
  parameters: RequestParameters;
  priority: 'low' | 'medium' | 'high';
  callback?: {
    url: string;
    headers?: Record<string, string>;
  };
}

export type RequestType = 
  | 'investment-idea-generation'
  | 'investment-analysis'
  | 'market-research'
  | 'portfolio-optimization'
  | 'risk-assessment'
  | 'compliance-check';

export type RequestStatus = 
  | 'submitted'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface RequestParameters {
  investmentHorizon?: 'short' | 'medium' | 'long';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  sectors?: string[];
  assetClasses?: string[];
  excludedInvestments?: string[];
  minimumConfidence?: number;
  maximumIdeas?: number;
  specificInvestments?: string[];
  marketConditions?: string[];
  thematicFocus?: string[];
  geographicFocus?: string[];
  customParameters?: Record<string, any>;
}

export interface RequestResult {
  requestId: string;
  status: RequestStatus;
  timestamp: Date;
  resultType: 'investment-ideas' | 'analysis' | 'research' | 'optimization' | 'risk-report' | 'compliance-report';
  resultData: any;
  processingMetrics: {
    startTime: Date;
    endTime: Date;
    duration: number;
    resourcesUsed: Record<string, number>;
    modelsUsed: string[];
  };
  feedback?: RequestFeedback;
}

export interface RequestFeedback {
  rating?: number; // 1-5
  comments?: string;
  usefulnessScore?: number;
  accuracyScore?: number;
  insightScore?: number;
  timestamp?: Date;
  actionTaken?: 'implemented' | 'partially-implemented' | 'considered' | 'rejected' | 'pending';
}