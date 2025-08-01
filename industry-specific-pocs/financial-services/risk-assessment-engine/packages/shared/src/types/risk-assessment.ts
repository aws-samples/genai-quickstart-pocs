// Risk assessment types
export interface RiskAssessment {
  customerId: string;
  overallRiskScore: number;
  riskCategory: 'low' | 'medium' | 'high';
  confidence: number;
  assessmentTimestamp: Date;
  status: 'pending' | 'in_progress' | 'complete';
}