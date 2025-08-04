/**
 * Analysis Agent Implementation
 *
 * This agent is responsible for:
 * - Financial analysis algorithms
 * - Correlation and causation analysis
 * - Scenario generation and evaluation
 *
 * Uses Amazon Nova Pro for specialized financial analysis and quantitative modeling
 */
import { AmazonNovaProService } from './amazon-nova-pro-service';
import { MarketDataService } from '../market-data-service';
import { AgentMessage, ConversationContext } from '../../models/agent';
import { AnalysisResult, AnalysisRecommendation } from '../../models/analysis';
import { Investment, RiskMetrics } from '../../models/investment';
export interface AnalysisRequest {
    investments: Investment[];
    analysisType: 'fundamental' | 'technical' | 'sentiment' | 'risk' | 'comprehensive' | 'correlation' | 'scenario';
    parameters: {
        timeHorizon?: 'short' | 'medium' | 'long';
        riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
        benchmarks?: string[];
        scenarios?: ScenarioDefinition[];
        correlationThreshold?: number;
        confidenceLevel?: number;
        includeStressTesting?: boolean;
        maxDrawdownLimit?: number;
    };
    context?: ConversationContext;
}
export interface AnalysisResponse {
    results: AnalysisResult[];
    correlationMatrix?: CorrelationMatrix;
    scenarioAnalysis?: ScenarioAnalysisResult;
    riskAssessment: RiskAssessment;
    recommendations: AnalysisRecommendation[];
    confidence: number;
    executionTime: number;
}
export interface ScenarioDefinition {
    name: string;
    description: string;
    marketConditions: {
        economicGrowth?: number;
        inflation?: number;
        interestRates?: number;
        volatility?: number;
    };
    probability: number;
}
export interface ScenarioAnalysisResult {
    scenarios: ScenarioOutcome[];
    expectedValue: number;
    worstCase: ScenarioOutcome;
    bestCase: ScenarioOutcome;
    probabilityWeightedReturn: number;
}
export interface ScenarioOutcome {
    scenario: ScenarioDefinition;
    portfolioReturn: number;
    individualReturns: Record<string, number>;
    riskMetrics: RiskMetrics;
    probability: number;
}
export interface CorrelationMatrix {
    matrix: Record<string, Record<string, number>>;
    significantCorrelations: CorrelationPair[];
    timeVaryingCorrelations?: TimeVaryingCorrelation[];
}
export interface CorrelationPair {
    asset1: string;
    asset2: string;
    correlation: number;
    significance: number;
    interpretation: string;
}
export interface TimeVaryingCorrelation {
    asset1: string;
    asset2: string;
    correlations: {
        date: Date;
        correlation: number;
    }[];
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
}
export interface RiskAssessment {
    overallRisk: 'low' | 'medium' | 'high' | 'very-high';
    riskScore: number;
    keyRisks: RiskFactor[];
    diversificationScore: number;
    stressTestResults?: StressTestResult[];
    valueAtRisk?: VaRResult;
}
export interface RiskFactor {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
    description: string;
    mitigation?: string;
}
export interface StressTestResult {
    scenario: string;
    portfolioLoss: number;
    worstAssetLoss: number;
    recoveryTime: number;
    description: string;
}
export interface VaRResult {
    confidenceLevel: number;
    timeHorizon: number;
    valueAtRisk: number;
    expectedShortfall: number;
    interpretation: string;
}
export interface CausationAnalysisRequest {
    dependentVariable: string;
    independentVariables: string[];
    data: Record<string, number[]>;
    analysisMethod: 'granger' | 'regression' | 'instrumental-variables' | 'difference-in-differences';
}
export interface CausationAnalysisResult {
    causalRelationships: CausalRelationship[];
    statisticalSignificance: Record<string, number>;
    methodology: string;
    limitations: string[];
    confidence: number;
}
export interface CausalRelationship {
    cause: string;
    effect: string;
    strength: number;
    direction: 'positive' | 'negative';
    lagPeriod?: number;
    confidence: number;
    interpretation: string;
}
/**
 * Analysis Agent class that handles all financial analysis tasks
 */
export declare class AnalysisAgent {
    private novaProService;
    private marketDataService;
    private agentType;
    constructor(novaProService: AmazonNovaProService, marketDataService: MarketDataService);
    /**
     * Process an analysis request and return comprehensive analysis results
     */
    processAnalysisRequest(request: AnalysisRequest): Promise<AnalysisResponse>;
    /**
     * Perform fundamental analysis
     */
    private performFundamentalAnalysis;
    /**
     * Analyze fundamentals for a single investment
     */
    private analyzeFundamentals;
    /**
     * Perform correlation analysis
     */
    private performCorrelationAnalysis;
    /**
     * Calculate correlation matrix for investments
     */
    private calculateCorrelationMatrix;
    /**
     * Perform scenario analysis
     */
    private performScenarioAnalysis;
    /**
     * Perform comprehensive analysis combining multiple analysis types
     */
    private performComprehensiveAnalysis;
    private calculateReturns;
    private calculatePearsonCorrelation;
    private interpretCorrelation;
    private getDefaultScenarios;
    private evaluateScenario;
    private calculateExpectedValue;
    private calculateProbabilityWeightedReturn;
    private performTechnicalAnalysis;
    private performSentimentAnalysis;
    private performRiskAnalysis;
    private performCausationAnalysis;
    private parseFundamentalAnalysis;
    private extractDataPoints;
    private assessPortfolioRisk;
    private generateFundamentalRecommendations;
    private calculateAnalysisConfidence;
    private calculateAverageCorrelation;
    private findMaxCorrelation;
    private generateCorrelationSummary;
    private generateCorrelationNarrative;
    private generateCorrelationRecommendations;
    private assessCorrelationRisk;
    private generateScenarioSummary;
    private generateScenarioNarrative;
    private generateScenarioRecommendations;
    private assessScenarioRisk;
    private combineRiskAssessments;
    private synthesizeRecommendations;
    private calculateComprehensiveConfidence;
    /**
     * Handle agent messages for communication with other agents
     */
    handleMessage(message: AgentMessage): Promise<AgentMessage>;
}
