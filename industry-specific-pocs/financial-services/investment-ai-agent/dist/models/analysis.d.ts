/**
 * Analysis models representing the results of investment analysis
 */
export interface AnalysisResult {
    id: string;
    investmentId: string;
    analysisType: 'fundamental' | 'technical' | 'sentiment' | 'risk' | 'comprehensive';
    timestamp: Date;
    analyst: string;
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
