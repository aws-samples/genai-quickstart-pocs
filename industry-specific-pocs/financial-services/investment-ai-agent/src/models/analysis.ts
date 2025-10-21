/**
 * Analysis models representing the results of investment analysis
 */

import { Investment } from './investment';

export interface AnalysisResult {
  id: string;
  investmentId: string;
  analysisType: 'fundamental' | 'technical' | 'sentiment' | 'risk' | 'comprehensive';
  timestamp: Date;
  analyst: string; // Model ID or user ID
  summary: string;
  confidence: number;
  details: AnalysisDetails;
  recommendations: AnalysisRecommendation[];
  dataPoints: DataPoint[];
}

export interface AnalysisDetails {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  keyMetrics: Record<string, number | string>;
  narratives: string[];
}

export interface AnalysisRecommendation {
  action: 'buy' | 'sell' | 'hold' | 'watch';
  timeHorizon: 'short' | 'medium' | 'long';
  targetPrice?: number;
  confidence: number;
  rationale: string;
}

export interface DataPoint {
  source: string;
  type: 'fundamental' | 'technical' | 'sentiment' | 'news' | 'research';
  value: any;
  timestamp: Date;
  reliability: number;
}

// Note: InvestmentIdea, Outcome, CounterArgument, ComplianceResult, and ComplianceIssue
// have been moved to investment-idea.ts for better organization and enhanced functionality