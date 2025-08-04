/**
 * Supporting Analysis Service
 * Implements key metrics calculation, risk assessment algorithms, and expected outcome modeling
 * Requirements: 4.3, 7.2, 7.3
 */
import { InvestmentIdea, RiskLevel } from '../models/investment-idea';
export interface KeyMetrics {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    valueAtRisk: number;
    diversificationRatio: number;
    correlationScore: number;
    concentrationRisk: number;
    fundamentalScore: number;
    technicalScore: number;
    sentimentScore: number;
    informationRatio: number;
    calmarRatio: number;
    sortinoRatio: number;
    timeToBreakeven: number;
    optimalHoldingPeriod: number;
    dataQuality: number;
    modelConfidence: number;
    marketConditionSuitability: number;
}
export interface RiskAssessment {
    overallRiskLevel: RiskLevel;
    riskScore: number;
    riskFactors: RiskFactor[];
    riskMitigation: RiskMitigation[];
    stressTestResults: StressTestResult[];
    scenarioAnalysis: ScenarioRisk[];
    correlationRisks: CorrelationRisk[];
    liquidityRisk: LiquidityRisk;
    concentrationRisk: ConcentrationRisk;
    marketRisk: MarketRisk;
    creditRisk?: CreditRisk;
    operationalRisk: OperationalRisk;
}
export interface RiskFactor {
    type: 'market' | 'credit' | 'liquidity' | 'operational' | 'regulatory' | 'geopolitical' | 'currency' | 'interest-rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    impact: number;
    description: string;
    timeHorizon: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
    mitigation?: string;
}
export interface RiskMitigation {
    riskType: string;
    strategy: string;
    effectiveness: number;
    cost: number;
    implementation: 'immediate' | 'gradual' | 'conditional';
}
export interface StressTestResult {
    scenario: string;
    probability: number;
    expectedLoss: number;
    timeToRecovery: number;
    description: string;
}
export interface ScenarioRisk {
    scenario: 'bull' | 'bear' | 'sideways' | 'crisis' | 'recovery';
    probability: number;
    riskLevel: RiskLevel;
    expectedImpact: number;
    keyTriggers: string[];
}
export interface CorrelationRisk {
    assetPair: string;
    correlation: number;
    riskLevel: 'low' | 'medium' | 'high';
    description: string;
}
export interface LiquidityRisk {
    level: 'low' | 'medium' | 'high';
    averageDailyVolume: number;
    bidAskSpread: number;
    marketImpactCost: number;
    timeToLiquidate: number;
}
export interface ConcentrationRisk {
    level: 'low' | 'medium' | 'high';
    sectorConcentration: number;
    geographicConcentration: number;
    assetClassConcentration: number;
    singlePositionRisk: number;
}
export interface MarketRisk {
    beta: number;
    marketSensitivity: number;
    sectorSensitivity: number;
    interestRateSensitivity: number;
    currencyExposure: number;
}
export interface CreditRisk {
    creditRating?: string;
    defaultProbability: number;
    recoveryRate: number;
    creditSpread: number;
}
export interface OperationalRisk {
    level: 'low' | 'medium' | 'high';
    keyPersonRisk: number;
    systemRisk: number;
    processRisk: number;
    externalEventRisk: number;
}
export interface ExpectedOutcomeModel {
    baseCase: OutcomeScenario;
    bullCase: OutcomeScenario;
    bearCase: OutcomeScenario;
    probabilityWeightedReturn: number;
    confidenceInterval: ConfidenceInterval;
    sensitivityAnalysis: SensitivityAnalysis;
    monteCarloResults: MonteCarloResults;
    timeSeriesProjection: TimeSeriesProjection[];
}
export interface OutcomeScenario {
    probability: number;
    expectedReturn: number;
    timeToRealization: number;
    keyAssumptions: string[];
    catalysts: string[];
    risks: string[];
    milestones: Milestone[];
}
export interface ConfidenceInterval {
    level: number;
    lowerBound: number;
    upperBound: number;
    standardError: number;
}
export interface SensitivityAnalysis {
    variables: SensitivityVariable[];
    correlationMatrix: number[][];
    keyDrivers: string[];
}
export interface SensitivityVariable {
    name: string;
    baseValue: number;
    impact: number;
    elasticity: number;
    range: {
        min: number;
        max: number;
    };
}
export interface MonteCarloResults {
    iterations: number;
    meanReturn: number;
    standardDeviation: number;
    percentiles: Record<string, number>;
    probabilityOfLoss: number;
    probabilityOfTarget: number;
    expectedShortfall: number;
}
export interface TimeSeriesProjection {
    date: Date;
    expectedValue: number;
    confidenceBands: {
        upper95: number;
        upper68: number;
        lower68: number;
        lower95: number;
    };
    cumulativeReturn: number;
}
export interface Milestone {
    date: Date;
    description: string;
    probability: number;
    impact: number;
    type: 'catalyst' | 'risk-event' | 'decision-point' | 'market-event';
}
export declare class SupportingAnalysisService {
    /**
     * Calculates comprehensive key metrics for an investment idea
     */
    calculateKeyMetrics(idea: InvestmentIdea): Promise<KeyMetrics>;
    /**
     * Performs comprehensive risk assessment
     */
    assessRisk(idea: InvestmentIdea): Promise<RiskAssessment>;
    /**
     * Models expected outcomes using various techniques
     */
    modelExpectedOutcomes(idea: InvestmentIdea): Promise<ExpectedOutcomeModel>;
    private calculateExpectedReturn;
    private calculateHistoricalReturn;
    private calculatePortfolioVolatility;
    private calculateSharpeRatio;
    private calculateMaxDrawdown;
    private calculateValueAtRisk;
    private getZScore;
    private calculateDiversificationRatio;
    private calculateCorrelationScore;
    private calculateConcentrationRisk;
    private calculateFundamentalScore;
    private calculateTechnicalScore;
    private calculateSentimentScore;
    private calculateInformationRatio;
    private calculateCalmarRatio;
    private calculateSortinoRatio;
    private calculateDownwardDeviation;
    private calculateTimeToBreakeven;
    private calculateOptimalHoldingPeriod;
    private assessDataQuality;
    private calculateRecencyScore;
    private assessSourceQuality;
    private assessMarketConditionSuitability;
    private calculateOverallRiskScore;
    private calculateTimeHorizonRisk;
    private calculateStrategyRisk;
    private determineRiskLevel;
    private identifyRiskFactors;
    private generateRiskMitigation;
    private performStressTests;
    private performScenarioAnalysis;
    private assessCorrelationRisks;
    private assessLiquidityRisk;
    private assessConcentrationRisk;
    private assessMarketRisk;
    private assessCreditRisk;
    private assessOperationalRisk;
    private createBaseScenario;
    private createBullScenario;
    private createBearScenario;
    private generateMilestones;
    private calculateProbabilityWeightedReturn;
    private calculateConfidenceInterval;
    private performSensitivityAnalysis;
    private runMonteCarloSimulation;
    private generateNormalRandom;
    private generateTimeSeriesProjection;
}
