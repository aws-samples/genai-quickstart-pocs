/**
 * Explanation Service - Generates transparent explanations for AI decisions and recommendations
 * Implements reasoning explanation algorithms, data source attribution, and confidence interval calculation
 */
import { InvestmentIdea, Outcome } from '../models/investment-idea';
import { DataPoint, AnalysisResult } from '../models/analysis';
export interface ExplanationResult {
    id: string;
    investmentIdeaId: string;
    timestamp: Date;
    reasoning: ReasoningExplanation;
    dataAttribution: DataSourceAttribution;
    confidenceAnalysis: ConfidenceAnalysis;
    visualizations: VisualizationSuggestion[];
    summary: string;
}
export interface ReasoningExplanation {
    decisionPath: DecisionStep[];
    keyFactors: KeyFactor[];
    logicalChain: LogicalConnection[];
    assumptions: Assumption[];
    alternativeScenarios: AlternativeScenario[];
}
export interface DecisionStep {
    stepNumber: number;
    description: string;
    inputData: DataPoint[];
    reasoning: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    alternatives: string[];
}
export interface KeyFactor {
    name: string;
    description: string;
    weight: number;
    direction: 'positive' | 'negative' | 'neutral';
    evidence: DataPoint[];
    confidenceLevel: number;
}
export interface LogicalConnection {
    from: string;
    to: string;
    relationship: 'causes' | 'correlates' | 'supports' | 'contradicts' | 'implies';
    strength: number;
    evidence: string[];
}
export interface Assumption {
    description: string;
    type: 'market' | 'economic' | 'company' | 'regulatory' | 'technical';
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    validation: string[];
    risks: string[];
}
export interface AlternativeScenario {
    name: string;
    description: string;
    probability: number;
    outcome: Outcome;
    keyDifferences: string[];
}
export interface DataSourceAttribution {
    sources: SourceAttribution[];
    reliability: ReliabilityAssessment;
    coverage: CoverageAnalysis;
    freshness: FreshnessAnalysis;
    conflicts: DataConflict[];
}
export interface SourceAttribution {
    sourceId: string;
    sourceName: string;
    sourceType: 'proprietary' | 'public' | 'market' | 'news' | 'research' | 'regulatory';
    dataPoints: DataPoint[];
    contribution: number;
    reliability: number;
    lastUpdated: Date;
    accessLevel: 'public' | 'restricted' | 'proprietary';
}
export interface ReliabilityAssessment {
    overallScore: number;
    sourceReliability: Record<string, number>;
    dataQuality: DataQualityMetrics;
    crossValidation: CrossValidationResult[];
}
export interface DataQualityMetrics {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
}
export interface CrossValidationResult {
    dataPoint: string;
    sources: string[];
    agreement: number;
    discrepancies: string[];
}
export interface CoverageAnalysis {
    totalDataPoints: number;
    sourceDistribution: Record<string, number>;
    topicCoverage: Record<string, number>;
    gapsIdentified: string[];
}
export interface FreshnessAnalysis {
    averageAge: number;
    oldestDataPoint: Date;
    newestDataPoint: Date;
    staleDataWarnings: string[];
}
export interface DataConflict {
    description: string;
    conflictingSources: string[];
    severity: 'low' | 'medium' | 'high';
    resolution: string;
    impact: string;
}
export interface ConfidenceAnalysis {
    overallConfidence: number;
    confidenceBreakdown: ConfidenceBreakdown;
    uncertaintyFactors: UncertaintyFactor[];
    confidenceInterval: ExplanationConfidenceInterval;
    sensitivityAnalysis: ExplanationSensitivityAnalysis;
}
export interface ConfidenceBreakdown {
    dataQuality: number;
    modelReliability: number;
    marketConditions: number;
    timeHorizon: number;
    complexity: number;
}
export interface UncertaintyFactor {
    factor: string;
    description: string;
    impact: number;
    mitigation: string[];
}
export interface ExplanationConfidenceInterval {
    lower: number;
    upper: number;
    level: number;
    methodology: string;
    assumptions: string[];
}
export interface ExplanationSensitivityAnalysis {
    keyVariables: ExplanationSensitivityVariable[];
    scenarios: SensitivityScenario[];
    robustness: number;
}
export interface ExplanationSensitivityVariable {
    name: string;
    baseValue: number;
    range: {
        min: number;
        max: number;
    };
    impact: number;
}
export interface SensitivityScenario {
    name: string;
    changes: Record<string, number>;
    resultingConfidence: number;
    outcomeChange: number;
}
export interface VisualizationSuggestion {
    type: 'decision-tree' | 'factor-importance' | 'confidence-bands' | 'data-flow' | 'scenario-comparison';
    title: string;
    description: string;
    data: any;
    priority: 'low' | 'medium' | 'high';
}
export declare class ExplanationService {
    constructor();
    /**
     * Generate comprehensive explanation for an investment idea
     */
    generateExplanation(investmentIdea: InvestmentIdea, analysisResults?: AnalysisResult[]): Promise<ExplanationResult>;
    /**
     * Generate reasoning explanation showing decision path and key factors
     */
    private generateReasoningExplanation;
    /**
     * Generate data source attribution showing where information came from
     */
    private generateDataAttribution;
    /**
     * Generate confidence analysis with intervals and uncertainty factors
     */
    private generateConfidenceAnalysis;
    /**
     * Extract decision steps from investment idea rationale
     */
    private extractDecisionPath;
    /**
     * Identify key factors that influenced the investment decision
     */
    private identifyKeyFactors;
    /**
     * Build logical connections between factors
     */
    private buildLogicalChain;
    /**
     * Extract assumptions from investment idea
     */
    private extractAssumptions;
    /**
     * Generate alternative scenarios based on different assumptions
     */
    private generateAlternativeScenarios;
    /**
     * Group data points by source
     */
    private groupDataPointsBySource;
    /**
     * Create source attributions from grouped data points
     */
    private createSourceAttributions;
    /**
     * Calculate confidence interval for investment idea
     */
    private calculateConfidenceInterval;
    /**
     * Perform sensitivity analysis on key variables
     */
    private performSensitivityAnalysis;
    private generateExplanationId;
    private generateSourceId;
    private parseRationaleSteps;
    private findRelevantDataPoints;
    private groupDataPointsByType;
    private createKeyFactor;
    private determineFactorDirection;
    private analyzeFactorRelationship;
    private extractAssumptionsFromText;
    private categorizeAssumption;
    private createAlternativeOutcome;
    private calculateSourceContribution;
    private calculateSourceReliability;
    private categorizeSourceType;
    private getLatestTimestamp;
    private determineAccessLevel;
    private assessReliability;
    private analyzeCoverage;
    private analyzeFreshness;
    private identifyDataConflicts;
    private calculateConfidenceBreakdown;
    private identifyUncertaintyFactors;
    private calculateOverallConfidence;
    private calculateRobustness;
    private calculateConsistency;
    private calculateTimeliness;
    private identifyDataGaps;
    private calculateDataQualityScore;
    private assessMarketConditions;
    private assessTimeHorizonConfidence;
    private assessComplexity;
    private generateVisualizationSuggestions;
    private generateExplanationSummary;
}
