/**
 * Supporting Analysis Service
 * Implements key metrics calculation, risk assessment algorithms, and expected outcome modeling
 * Requirements: 4.3, 7.2, 7.3
 */

import { Investment, RiskMetrics, Fundamentals, TechnicalIndicators } from '../models/investment';
import { InvestmentIdea, Outcome, TimeHorizon, RiskLevel } from '../models/investment-idea';
import { DataPoint } from '../models/analysis';

export interface KeyMetrics {
  // Financial metrics
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number;
  
  // Portfolio metrics
  diversificationRatio: number;
  correlationScore: number;
  concentrationRisk: number;
  
  // Quality metrics
  fundamentalScore: number;
  technicalScore: number;
  sentimentScore: number;
  
  // Risk-adjusted metrics
  informationRatio: number;
  calmarRatio: number;
  sortinoRatio: number;
  
  // Time-based metrics
  timeToBreakeven: number; // in days
  optimalHoldingPeriod: number; // in days
  
  // Confidence metrics
  dataQuality: number;
  modelConfidence: number;
  marketConditionSuitability: number;
}

export interface RiskAssessment {
  overallRiskLevel: RiskLevel;
  riskScore: number; // 0-100
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
  probability: number; // 0-1
  impact: number; // potential loss as percentage
  description: string;
  timeHorizon: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  mitigation?: string;
}

export interface RiskMitigation {
  riskType: string;
  strategy: string;
  effectiveness: number; // 0-1
  cost: number; // as percentage of investment
  implementation: 'immediate' | 'gradual' | 'conditional';
}

export interface StressTestResult {
  scenario: string;
  probability: number;
  expectedLoss: number;
  timeToRecovery: number; // in days
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
  timeToLiquidate: number; // in days
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
  timeToRealization: number; // in days
  keyAssumptions: string[];
  catalysts: string[];
  risks: string[];
  milestones: Milestone[];
}

export interface ConfidenceInterval {
  level: number; // e.g., 0.95 for 95%
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
  impact: number; // change in outcome per unit change in variable
  elasticity: number;
  range: { min: number; max: number };
}

export interface MonteCarloResults {
  iterations: number;
  meanReturn: number;
  standardDeviation: number;
  percentiles: Record<string, number>; // e.g., "5": -0.15, "95": 0.25
  probabilityOfLoss: number;
  probabilityOfTarget: number;
  expectedShortfall: number; // Conditional VaR
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

export class SupportingAnalysisService {
  /**
   * Calculates comprehensive key metrics for an investment idea
   */
  async calculateKeyMetrics(idea: InvestmentIdea): Promise<KeyMetrics> {
    const investments = idea.investments;
    
    // Calculate portfolio-level metrics
    const expectedReturn = this.calculateExpectedReturn(investments, idea.potentialOutcomes);
    const volatility = this.calculatePortfolioVolatility(investments);
    const sharpeRatio = this.calculateSharpeRatio(expectedReturn, volatility);
    const maxDrawdown = this.calculateMaxDrawdown(investments);
    const valueAtRisk = this.calculateValueAtRisk(investments, 0.05); // 5% VaR
    
    // Portfolio construction metrics
    const diversificationRatio = this.calculateDiversificationRatio(investments);
    const correlationScore = this.calculateCorrelationScore(investments);
    const concentrationRisk = this.calculateConcentrationRisk(investments);
    
    // Quality scores
    const fundamentalScore = this.calculateFundamentalScore(investments);
    const technicalScore = this.calculateTechnicalScore(investments);
    const sentimentScore = this.calculateSentimentScore(investments);
    
    // Risk-adjusted metrics
    const informationRatio = this.calculateInformationRatio(investments);
    const calmarRatio = this.calculateCalmarRatio(expectedReturn, maxDrawdown);
    const sortinoRatio = this.calculateSortinoRatio(investments);
    
    // Time-based metrics
    const timeToBreakeven = this.calculateTimeToBreakeven(idea);
    const optimalHoldingPeriod = this.calculateOptimalHoldingPeriod(idea);
    
    // Confidence metrics
    const dataQuality = this.assessDataQuality(idea.supportingData);
    const modelConfidence = idea.confidenceScore;
    const marketConditionSuitability = this.assessMarketConditionSuitability(idea);

    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk,
      diversificationRatio,
      correlationScore,
      concentrationRisk,
      fundamentalScore,
      technicalScore,
      sentimentScore,
      informationRatio,
      calmarRatio,
      sortinoRatio,
      timeToBreakeven,
      optimalHoldingPeriod,
      dataQuality,
      modelConfidence,
      marketConditionSuitability
    };
  }

  /**
   * Performs comprehensive risk assessment
   */
  async assessRisk(idea: InvestmentIdea): Promise<RiskAssessment> {
    const investments = idea.investments;
    
    // Calculate overall risk score and level
    const riskScore = this.calculateOverallRiskScore(investments, idea);
    const overallRiskLevel = this.determineRiskLevel(riskScore);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(investments, idea);
    
    // Generate risk mitigation strategies
    const riskMitigation = this.generateRiskMitigation(riskFactors);
    
    // Perform stress tests
    const stressTestResults = this.performStressTests(investments);
    
    // Scenario analysis
    const scenarioAnalysis = this.performScenarioAnalysis(investments);
    
    // Correlation risks
    const correlationRisks = this.assessCorrelationRisks(investments);
    
    // Specific risk assessments
    const liquidityRisk = this.assessLiquidityRisk(investments);
    const concentrationRisk = this.assessConcentrationRisk(investments);
    const marketRisk = this.assessMarketRisk(investments);
    const creditRisk = this.assessCreditRisk(investments);
    const operationalRisk = this.assessOperationalRisk(investments, idea);

    return {
      overallRiskLevel,
      riskScore,
      riskFactors,
      riskMitigation,
      stressTestResults,
      scenarioAnalysis,
      correlationRisks,
      liquidityRisk,
      concentrationRisk,
      marketRisk,
      creditRisk,
      operationalRisk
    };
  }

  /**
   * Models expected outcomes using various techniques
   */
  async modelExpectedOutcomes(idea: InvestmentIdea): Promise<ExpectedOutcomeModel> {
    const investments = idea.investments;
    
    // Create scenario outcomes
    const baseCase = this.createBaseScenario(idea);
    const bullCase = this.createBullScenario(idea);
    const bearCase = this.createBearScenario(idea);
    
    // Calculate probability-weighted return
    const probabilityWeightedReturn = this.calculateProbabilityWeightedReturn([baseCase, bullCase, bearCase]);
    
    // Generate confidence intervals
    const confidenceInterval = this.calculateConfidenceInterval(investments);
    
    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(investments, idea);
    
    // Run Monte Carlo simulation
    const monteCarloResults = this.runMonteCarloSimulation(investments, idea);
    
    // Generate time series projection
    const timeSeriesProjection = this.generateTimeSeriesProjection(idea, monteCarloResults);

    return {
      baseCase,
      bullCase,
      bearCase,
      probabilityWeightedReturn,
      confidenceInterval,
      sensitivityAnalysis,
      monteCarloResults,
      timeSeriesProjection
    };
  }

  // Private helper methods for key metrics calculation

  private calculateExpectedReturn(investments: Investment[], outcomes: Outcome[]): number {
    if (outcomes.length === 0) {
      // Fallback to historical performance
      return investments.reduce((sum, inv) => {
        const historicalReturn = this.calculateHistoricalReturn(inv);
        return sum + historicalReturn;
      }, 0) / investments.length;
    }
    
    return outcomes.reduce((sum, outcome) => sum + (outcome.returnEstimate * outcome.probability), 0);
  }

  private calculateHistoricalReturn(investment: Investment): number {
    const performance = investment.historicalPerformance;
    if (performance.length < 2) return 0;
    
    const firstPrice = performance[0].adjustedClose;
    const lastPrice = performance[performance.length - 1].adjustedClose;
    const periods = performance.length;
    
    // Annualized return
    return Math.pow(lastPrice / firstPrice, 252 / periods) - 1;
  }

  private calculatePortfolioVolatility(investments: Investment[]): number {
    if (investments.length === 0) return 0;
    
    // Simple average of individual volatilities (could be enhanced with correlation matrix)
    const totalVolatility = investments.reduce((sum, inv) => {
      return sum + (inv.riskMetrics?.volatility || 0);
    }, 0);
    
    return totalVolatility / investments.length;
  }

  private calculateSharpeRatio(expectedReturn: number, volatility: number, riskFreeRate: number = 0.02): number {
    if (volatility === 0) return 0;
    return (expectedReturn - riskFreeRate) / volatility;
  }

  private calculateMaxDrawdown(investments: Investment[]): number {
    let maxDrawdown = 0;
    
    for (const investment of investments) {
      const performance = investment.historicalPerformance;
      if (performance.length < 2) continue;
      
      let peak = performance[0].adjustedClose;
      let currentDrawdown = 0;
      
      for (let i = 1; i < performance.length; i++) {
        const currentPrice = performance[i].adjustedClose;
        if (currentPrice > peak) {
          peak = currentPrice;
        } else {
          currentDrawdown = (peak - currentPrice) / peak;
          maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
        }
      }
    }
    
    return maxDrawdown;
  }

  private calculateValueAtRisk(investments: Investment[], confidenceLevel: number): number {
    // Simplified VaR calculation using normal distribution assumption
    const portfolioReturn = this.calculateExpectedReturn(investments, []);
    const portfolioVolatility = this.calculatePortfolioVolatility(investments);
    
    // Z-score for confidence level (e.g., -1.645 for 5% VaR)
    const zScore = this.getZScore(confidenceLevel);
    
    return portfolioReturn + (zScore * portfolioVolatility);
  }

  private getZScore(confidenceLevel: number): number {
    // Simplified mapping of confidence levels to z-scores
    const zScores: Record<number, number> = {
      0.01: -2.326,
      0.05: -1.645,
      0.10: -1.282
    };
    return zScores[confidenceLevel] || -1.645;
  }

  private calculateDiversificationRatio(investments: Investment[]): number {
    if (investments.length <= 1) return 0;
    
    // Simplified diversification ratio based on number of assets and sectors
    const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
    const assetTypes = new Set(investments.map(inv => inv.type));
    
    const sectorDiversification = sectors.size / Math.max(investments.length, 1);
    const assetTypeDiversification = assetTypes.size / Math.max(investments.length, 1);
    
    return (sectorDiversification + assetTypeDiversification) / 2;
  }

  private calculateCorrelationScore(investments: Investment[]): number {
    if (investments.length <= 1) return 0;
    
    let totalCorrelation = 0;
    let pairCount = 0;
    
    for (let i = 0; i < investments.length; i++) {
      for (let j = i + 1; j < investments.length; j++) {
        const inv1 = investments[i];
        const inv2 = investments[j];
        
        // Get correlation from risk metrics if available
        const correlation = inv1.riskMetrics?.correlations?.[inv2.id] || 0.5; // Default moderate correlation
        totalCorrelation += Math.abs(correlation);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalCorrelation / pairCount : 0;
  }

  private calculateConcentrationRisk(investments: Investment[]): number {
    if (investments.length === 0) return 1;
    
    // Calculate Herfindahl-Hirschman Index for concentration
    const totalValue = investments.length; // Assuming equal weights
    let hhi = 0;
    
    for (const investment of investments) {
      const weight = 1 / totalValue; // Equal weight assumption
      hhi += weight * weight;
    }
    
    return hhi;
  }

  private calculateFundamentalScore(investments: Investment[]): number {
    let totalScore = 0;
    let validInvestments = 0;
    
    for (const investment of investments) {
      if (!investment.fundamentals) continue;
      
      const fundamentals = investment.fundamentals;
      let score = 50; // Base score
      
      // P/E ratio scoring
      if (fundamentals.peRatio && fundamentals.peRatio > 0) {
        if (fundamentals.peRatio < 15) score += 10;
        else if (fundamentals.peRatio < 25) score += 5;
        else if (fundamentals.peRatio > 40) score -= 10;
      }
      
      // Profit margin scoring
      if (fundamentals.profitMargin && fundamentals.profitMargin > 0) {
        if (fundamentals.profitMargin > 0.15) score += 10;
        else if (fundamentals.profitMargin > 0.10) score += 5;
      }
      
      // ROE scoring
      if (fundamentals.returnOnEquity && fundamentals.returnOnEquity > 0) {
        if (fundamentals.returnOnEquity > 0.15) score += 10;
        else if (fundamentals.returnOnEquity > 0.10) score += 5;
      }
      
      // Debt-to-equity scoring
      if (fundamentals.debtToEquity !== undefined) {
        if (fundamentals.debtToEquity < 0.3) score += 5;
        else if (fundamentals.debtToEquity > 1.0) score -= 10;
      }
      
      totalScore += Math.max(0, Math.min(100, score));
      validInvestments++;
    }
    
    return validInvestments > 0 ? totalScore / validInvestments : 50;
  }

  private calculateTechnicalScore(investments: Investment[]): number {
    let totalScore = 0;
    let validInvestments = 0;
    
    for (const investment of investments) {
      if (!investment.technicalIndicators) continue;
      
      const technical = investment.technicalIndicators;
      let score = 50; // Base score
      
      // RSI scoring
      if (technical.relativeStrengthIndex) {
        const rsi = technical.relativeStrengthIndex;
        if (rsi > 30 && rsi < 70) score += 10; // Neutral zone
        else if (rsi < 30) score += 15; // Oversold
        else if (rsi > 70) score -= 10; // Overbought
      }
      
      // Moving average trend
      if (technical.movingAverages && investment.currentPrice) {
        const price = investment.currentPrice;
        const ma50 = technical.movingAverages.ma50;
        const ma200 = technical.movingAverages.ma200;
        
        if (price > ma50 && ma50 > ma200) score += 15; // Uptrend
        else if (price < ma50 && ma50 < ma200) score -= 10; // Downtrend
      }
      
      // MACD scoring
      if (technical.macdLine && technical.macdSignal) {
        if (technical.macdLine > technical.macdSignal) score += 5; // Bullish
        else score -= 5; // Bearish
      }
      
      totalScore += Math.max(0, Math.min(100, score));
      validInvestments++;
    }
    
    return validInvestments > 0 ? totalScore / validInvestments : 50;
  }

  private calculateSentimentScore(investments: Investment[]): number {
    let totalScore = 0;
    let validInvestments = 0;
    
    for (const investment of investments) {
      if (!investment.sentimentAnalysis) continue;
      
      const sentiment = investment.sentimentAnalysis;
      let score = 50; // Base score
      
      // Overall sentiment scoring
      switch (sentiment.overallSentiment) {
        case 'very-positive':
          score += 20;
          break;
        case 'positive':
          score += 10;
          break;
        case 'neutral':
          score += 0;
          break;
        case 'negative':
          score -= 10;
          break;
        case 'very-negative':
          score -= 20;
          break;
      }
      
      // Sentiment trend scoring
      switch (sentiment.sentimentTrend) {
        case 'improving':
          score += 10;
          break;
        case 'stable':
          score += 0;
          break;
        case 'deteriorating':
          score -= 10;
          break;
      }
      
      // Analyst recommendations
      if (sentiment.analystRecommendations) {
        const total = sentiment.analystRecommendations.buy + 
                     sentiment.analystRecommendations.hold + 
                     sentiment.analystRecommendations.sell;
        if (total > 0) {
          const buyRatio = sentiment.analystRecommendations.buy / total;
          score += (buyRatio - 0.5) * 20; // Adjust based on buy ratio
        }
      }
      
      totalScore += Math.max(0, Math.min(100, score));
      validInvestments++;
    }
    
    return validInvestments > 0 ? totalScore / validInvestments : 50;
  }

  private calculateInformationRatio(investments: Investment[]): number {
    // Simplified information ratio calculation
    const activeReturn = this.calculateExpectedReturn(investments, []);
    const benchmarkReturn = 0.08; // Assume 8% benchmark
    const trackingError = this.calculatePortfolioVolatility(investments) * 0.5; // Simplified
    
    if (trackingError === 0) return 0;
    return (activeReturn - benchmarkReturn) / trackingError;
  }

  private calculateCalmarRatio(expectedReturn: number, maxDrawdown: number): number {
    if (maxDrawdown === 0) return 0;
    return expectedReturn / maxDrawdown;
  }

  private calculateSortinoRatio(investments: Investment[], targetReturn: number = 0): number {
    // Simplified Sortino ratio calculation
    const expectedReturn = this.calculateExpectedReturn(investments, []);
    const downwardDeviation = this.calculateDownwardDeviation(investments, targetReturn);
    
    if (downwardDeviation === 0) return 0;
    return (expectedReturn - targetReturn) / downwardDeviation;
  }

  private calculateDownwardDeviation(investments: Investment[], targetReturn: number): number {
    // Simplified calculation - would need actual return series for proper implementation
    const volatility = this.calculatePortfolioVolatility(investments);
    return volatility * 0.7; // Approximate downward deviation as 70% of total volatility
  }

  private calculateTimeToBreakeven(idea: InvestmentIdea): number {
    // Estimate based on expected return and time horizon
    const expectedReturn = this.calculateExpectedReturn(idea.investments, idea.potentialOutcomes);
    if (expectedReturn <= 0) return Infinity;
    
    // Simple breakeven calculation
    const transactionCosts = 0.01; // Assume 1% transaction costs
    return (transactionCosts / expectedReturn) * 365; // Convert to days
  }

  private calculateOptimalHoldingPeriod(idea: InvestmentIdea): number {
    // Map time horizon to days
    const timeHorizonDays: Record<TimeHorizon, number> = {
      'intraday': 1,
      'short': 90,
      'medium': 365,
      'long': 1095,
      'very-long': 1825
    };
    
    return timeHorizonDays[idea.timeHorizon] || 365;
  }

  private assessDataQuality(supportingData: DataPoint[]): number {
    if (supportingData.length === 0) return 30;
    
    let qualityScore = 0;
    let totalWeight = 0;
    
    for (const dataPoint of supportingData) {
      const reliability = dataPoint.reliability || 0.5;
      const recency = this.calculateRecencyScore(dataPoint.timestamp);
      const sourceQuality = this.assessSourceQuality(dataPoint.source);
      
      const pointQuality = (reliability * 0.4 + recency * 0.3 + sourceQuality * 0.3) * 100;
      qualityScore += pointQuality;
      totalWeight += 1;
    }
    
    return totalWeight > 0 ? qualityScore / totalWeight : 50;
  }

  private calculateRecencyScore(timestamp: Date): number {
    const now = new Date();
    const ageInDays = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays <= 1) return 1.0;
    if (ageInDays <= 7) return 0.9;
    if (ageInDays <= 30) return 0.7;
    if (ageInDays <= 90) return 0.5;
    if (ageInDays <= 365) return 0.3;
    return 0.1;
  }

  private assessSourceQuality(source: string): number {
    // Simple source quality assessment
    const highQualitySources = ['bloomberg', 'reuters', 'sec', 'fed', 'treasury'];
    const mediumQualitySources = ['yahoo', 'google', 'marketwatch', 'cnbc'];
    
    const lowerSource = source.toLowerCase();
    
    if (highQualitySources.some(s => lowerSource.includes(s))) return 0.9;
    if (mediumQualitySources.some(s => lowerSource.includes(s))) return 0.7;
    return 0.5;
  }

  private assessMarketConditionSuitability(idea: InvestmentIdea): number {
    // Simplified market condition assessment
    let suitabilityScore = 50;
    
    // Adjust based on strategy and current market conditions
    switch (idea.strategy) {
      case 'growth':
        suitabilityScore += 10; // Assume growth-friendly environment
        break;
      case 'value':
        suitabilityScore += 5;
        break;
      case 'momentum':
        suitabilityScore -= 5; // Assume less suitable for momentum
        break;
    }
    
    // Adjust based on risk level and market volatility
    if (idea.riskLevel === 'high' || idea.riskLevel === 'very-high') {
      suitabilityScore -= 10; // High risk less suitable in uncertain times
    }
    
    return Math.max(0, Math.min(100, suitabilityScore));
  }

  // Risk assessment helper methods

  private calculateOverallRiskScore(investments: Investment[], idea: InvestmentIdea): number {
    let riskScore = 0;
    let factors = 0;
    
    // Portfolio volatility contribution
    const volatility = this.calculatePortfolioVolatility(investments);
    riskScore += Math.min(volatility * 100, 40); // Cap at 40 points
    factors++;
    
    // Concentration risk contribution
    const concentration = this.calculateConcentrationRisk(investments);
    riskScore += concentration * 20; // Up to 20 points
    factors++;
    
    // Time horizon risk (shorter = riskier for volatile assets)
    const timeHorizonRisk = this.calculateTimeHorizonRisk(idea.timeHorizon);
    riskScore += timeHorizonRisk;
    factors++;
    
    // Strategy risk
    const strategyRisk = this.calculateStrategyRisk(idea.strategy);
    riskScore += strategyRisk;
    factors++;
    
    return factors > 0 ? riskScore / factors : 50;
  }

  private calculateTimeHorizonRisk(timeHorizon: TimeHorizon): number {
    const riskScores: Record<TimeHorizon, number> = {
      'intraday': 30,
      'short': 20,
      'medium': 10,
      'long': 5,
      'very-long': 2
    };
    return riskScores[timeHorizon] || 15;
  }

  private calculateStrategyRisk(strategy: string): number {
    const riskScores: Record<string, number> = {
      'buy': 10,
      'hold': 5,
      'sell': 15,
      'short': 25,
      'long': 10,
      'hedge': 8,
      'arbitrage': 12,
      'pairs-trade': 15,
      'momentum': 20,
      'value': 8,
      'growth': 12,
      'income': 5,
      'complex': 25
    };
    return riskScores[strategy] || 15;
  }

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore <= 20) return 'very-low';
    if (riskScore <= 40) return 'low';
    if (riskScore <= 60) return 'moderate';
    if (riskScore <= 80) return 'high';
    return 'very-high';
  }

  private identifyRiskFactors(investments: Investment[], idea: InvestmentIdea): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];
    
    if (investments.length === 0) {
      // Add a general risk factor for empty portfolios
      riskFactors.push({
        type: 'operational',
        severity: 'high',
        probability: 1.0,
        impact: 100,
        description: 'No investments in portfolio',
        timeHorizon: 'immediate'
      });
      return riskFactors;
    }
    
    // Market risk factors
    const avgBeta = investments.reduce((sum, inv) => sum + (inv.riskMetrics?.beta || 1), 0) / investments.length;
    if (avgBeta > 1.2) {
      riskFactors.push({
        type: 'market',
        severity: 'medium',
        probability: 0.3,
        impact: (avgBeta - 1) * 20,
        description: `High market sensitivity (Beta: ${avgBeta.toFixed(2)})`,
        timeHorizon: 'short-term'
      });
    }
    
    // Liquidity risk factors
    const lowLiquidityAssets = investments.filter(inv => 
      inv.historicalPerformance.some(p => p.volume < 100000)
    );
    if (lowLiquidityAssets.length > 0) {
      riskFactors.push({
        type: 'liquidity',
        severity: 'medium',
        probability: 0.4,
        impact: 15,
        description: `${lowLiquidityAssets.length} assets with potential liquidity constraints`,
        timeHorizon: 'immediate'
      });
    }
    
    // Concentration risk
    const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
    if (sectors.size <= 2 && investments.length > 2) {
      riskFactors.push({
        type: 'market',
        severity: 'high',
        probability: 0.5,
        impact: 25,
        description: 'High sector concentration risk',
        timeHorizon: 'medium-term'
      });
    }
    
    // Strategy-specific risks
    if (idea.strategy === 'momentum') {
      riskFactors.push({
        type: 'market',
        severity: 'medium',
        probability: 0.6,
        impact: 20,
        description: 'Momentum strategy vulnerable to trend reversals',
        timeHorizon: 'short-term'
      });
    }
    
    // Always add at least one general risk factor to ensure mitigation strategies are generated
    if (riskFactors.length === 0) {
      riskFactors.push({
        type: 'market',
        severity: 'low',
        probability: 0.2,
        impact: 5,
        description: 'General market risk exposure',
        timeHorizon: 'medium-term'
      });
    }
    
    return riskFactors;
  }

  private generateRiskMitigation(riskFactors: RiskFactor[]): RiskMitigation[] {
    return riskFactors.map(factor => {
      switch (factor.type) {
        case 'market':
          return {
            riskType: factor.type,
            strategy: 'Consider hedging with market-neutral positions or defensive assets',
            effectiveness: 0.7,
            cost: 0.02,
            implementation: 'gradual'
          };
        case 'liquidity':
          return {
            riskType: factor.type,
            strategy: 'Maintain cash reserves and stagger position sizes',
            effectiveness: 0.8,
            cost: 0.01,
            implementation: 'immediate'
          };
        case 'credit':
          return {
            riskType: factor.type,
            strategy: 'Diversify across credit ratings and monitor credit spreads',
            effectiveness: 0.6,
            cost: 0.015,
            implementation: 'gradual'
          };
        default:
          return {
            riskType: factor.type,
            strategy: 'Monitor closely and maintain stop-loss levels',
            effectiveness: 0.5,
            cost: 0.005,
            implementation: 'immediate'
          };
      }
    });
  }

  private performStressTests(investments: Investment[]): StressTestResult[] {
    const results: StressTestResult[] = [];
    
    // Market crash scenario
    results.push({
      scenario: 'Market Crash (-30%)',
      probability: 0.05,
      expectedLoss: 0.25, // Assuming some correlation but not perfect
      timeToRecovery: 365,
      description: 'Broad market decline of 30% over 3 months'
    });
    
    // Interest rate shock
    results.push({
      scenario: 'Interest Rate Shock (+200bp)',
      probability: 0.15,
      expectedLoss: 0.12,
      timeToRecovery: 180,
      description: 'Rapid increase in interest rates by 2 percentage points'
    });
    
    // Sector-specific stress
    const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
    for (const sector of sectors) {
      results.push({
        scenario: `${sector} Sector Decline (-20%)`,
        probability: 0.1,
        expectedLoss: 0.15,
        timeToRecovery: 270,
        description: `Sector-specific decline in ${sector}`
      });
    }
    
    return results;
  }

  private performScenarioAnalysis(investments: Investment[]): ScenarioRisk[] {
    return [
      {
        scenario: 'bull',
        probability: 0.3,
        riskLevel: 'low',
        expectedImpact: 0.15,
        keyTriggers: ['Economic growth', 'Low interest rates', 'Positive earnings']
      },
      {
        scenario: 'bear',
        probability: 0.2,
        riskLevel: 'high',
        expectedImpact: -0.25,
        keyTriggers: ['Recession', 'High inflation', 'Geopolitical tensions']
      },
      {
        scenario: 'sideways',
        probability: 0.4,
        riskLevel: 'moderate',
        expectedImpact: 0.02,
        keyTriggers: ['Mixed economic signals', 'Uncertainty', 'Range-bound markets']
      },
      {
        scenario: 'crisis',
        probability: 0.05,
        riskLevel: 'very-high',
        expectedImpact: -0.40,
        keyTriggers: ['Financial crisis', 'Black swan event', 'System failure']
      },
      {
        scenario: 'recovery',
        probability: 0.05,
        riskLevel: 'moderate',
        expectedImpact: 0.25,
        keyTriggers: ['Post-crisis recovery', 'Policy support', 'Pent-up demand']
      }
    ];
  }

  private assessCorrelationRisks(investments: Investment[]): CorrelationRisk[] {
    const risks: CorrelationRisk[] = [];
    
    for (let i = 0; i < investments.length; i++) {
      for (let j = i + 1; j < investments.length; j++) {
        const inv1 = investments[i];
        const inv2 = investments[j];
        const correlation = inv1.riskMetrics?.correlations?.[inv2.id] || 0.5;
        
        if (Math.abs(correlation) > 0.7) {
          risks.push({
            assetPair: `${inv1.name} - ${inv2.name}`,
            correlation,
            riskLevel: Math.abs(correlation) > 0.8 ? 'high' : 'medium',
            description: `High correlation (${correlation.toFixed(2)}) reduces diversification benefits`
          });
        }
      }
    }
    
    return risks;
  }

  private assessLiquidityRisk(investments: Investment[]): LiquidityRisk {
    const avgVolume = investments.reduce((sum, inv) => {
      const recentVolume = inv.historicalPerformance.slice(-30)
        .reduce((vSum, p) => vSum + p.volume, 0) / 30;
      return sum + recentVolume;
    }, 0) / investments.length;
    
    const lowVolumeCount = investments.filter(inv => {
      const recentVolume = inv.historicalPerformance.slice(-30)
        .reduce((vSum, p) => vSum + p.volume, 0) / 30;
      return recentVolume < 100000;
    }).length;
    
    const liquidityLevel = lowVolumeCount > investments.length * 0.3 ? 'high' : 
                          lowVolumeCount > 0 ? 'medium' : 'low';
    
    return {
      level: liquidityLevel,
      averageDailyVolume: avgVolume,
      bidAskSpread: 0.01, // Simplified assumption
      marketImpactCost: liquidityLevel === 'high' ? 0.02 : liquidityLevel === 'medium' ? 0.01 : 0.005,
      timeToLiquidate: liquidityLevel === 'high' ? 5 : liquidityLevel === 'medium' ? 2 : 1
    };
  }

  private assessConcentrationRisk(investments: Investment[]): ConcentrationRisk {
    const sectors = new Set(investments.map(inv => inv.sector).filter(Boolean));
    const assetTypes = new Set(investments.map(inv => inv.type));
    
    const sectorConcentration = 1 - (sectors.size / Math.max(investments.length, 1));
    const assetClassConcentration = 1 - (assetTypes.size / Math.max(investments.length, 1));
    
    // Single position risk (assuming equal weights)
    const singlePositionRisk = 1 / investments.length;
    
    const overallLevel = sectorConcentration > 0.7 || assetClassConcentration > 0.7 || singlePositionRisk > 0.3 ? 'high' :
                        sectorConcentration > 0.5 || assetClassConcentration > 0.5 || singlePositionRisk > 0.2 ? 'medium' : 'low';
    
    return {
      level: overallLevel,
      sectorConcentration,
      geographicConcentration: 0.5, // Simplified assumption
      assetClassConcentration,
      singlePositionRisk
    };
  }

  private assessMarketRisk(investments: Investment[]): MarketRisk {
    const avgBeta = investments.reduce((sum, inv) => sum + (inv.riskMetrics?.beta || 1), 0) / investments.length;
    
    return {
      beta: avgBeta,
      marketSensitivity: avgBeta,
      sectorSensitivity: 0.7, // Simplified assumption
      interestRateSensitivity: 0.3, // Simplified assumption
      currencyExposure: 0.1 // Simplified assumption
    };
  }

  private assessCreditRisk(investments: Investment[]): CreditRisk | undefined {
    const bondInvestments = investments.filter(inv => inv.type === 'bond');
    if (bondInvestments.length === 0) return undefined;
    
    return {
      creditRating: 'BBB', // Simplified assumption
      defaultProbability: 0.02,
      recoveryRate: 0.6,
      creditSpread: 0.015
    };
  }

  private assessOperationalRisk(investments: Investment[], idea: InvestmentIdea): OperationalRisk {
    // Simplified operational risk assessment
    const complexityScore = idea.strategy === 'complex' ? 0.8 : 0.3;
    const dataQualityScore = this.assessDataQuality(idea.supportingData) / 100;
    
    return {
      level: complexityScore > 0.6 ? 'high' : complexityScore > 0.3 ? 'medium' : 'low',
      keyPersonRisk: 0.2,
      systemRisk: 0.1,
      processRisk: complexityScore,
      externalEventRisk: 0.15
    };
  }

  // Expected outcome modeling helper methods

  private createBaseScenario(idea: InvestmentIdea): OutcomeScenario {
    const expectedOutcome = idea.potentialOutcomes.find(o => o.scenario === 'expected');
    
    return {
      probability: 0.6,
      expectedReturn: expectedOutcome?.returnEstimate || 0.08,
      timeToRealization: expectedOutcome?.timeToRealization || this.calculateOptimalHoldingPeriod(idea),
      keyAssumptions: [
        'Market conditions remain stable',
        'Company fundamentals improve as expected',
        'No major external shocks'
      ],
      catalysts: expectedOutcome?.catalysts || ['Earnings growth', 'Market expansion'],
      risks: expectedOutcome?.keyRisks || ['Market volatility', 'Execution risk'],
      milestones: this.generateMilestones(idea)
    };
  }

  private createBullScenario(idea: InvestmentIdea): OutcomeScenario {
    const bestOutcome = idea.potentialOutcomes.find(o => o.scenario === 'best');
    
    return {
      probability: 0.2,
      expectedReturn: bestOutcome?.returnEstimate || 0.20,
      timeToRealization: (bestOutcome?.timeToRealization || this.calculateOptimalHoldingPeriod(idea)) * 0.8,
      keyAssumptions: [
        'Favorable market conditions',
        'Strong execution of business plan',
        'Positive regulatory environment'
      ],
      catalysts: bestOutcome?.catalysts || ['Strong earnings beat', 'Market leadership', 'Strategic partnerships'],
      risks: ['Overvaluation', 'Market correction'],
      milestones: this.generateMilestones(idea, 'bull')
    };
  }

  private createBearScenario(idea: InvestmentIdea): OutcomeScenario {
    const worstOutcome = idea.potentialOutcomes.find(o => o.scenario === 'worst');
    
    return {
      probability: 0.2,
      expectedReturn: worstOutcome?.returnEstimate || -0.15,
      timeToRealization: (worstOutcome?.timeToRealization || this.calculateOptimalHoldingPeriod(idea)) * 1.5,
      keyAssumptions: [
        'Adverse market conditions',
        'Execution challenges',
        'Regulatory headwinds'
      ],
      catalysts: ['Earnings miss', 'Competitive pressure', 'Economic downturn'],
      risks: worstOutcome?.keyRisks || ['Significant losses', 'Liquidity issues'],
      milestones: this.generateMilestones(idea, 'bear')
    };
  }

  private generateMilestones(idea: InvestmentIdea, scenario: 'bull' | 'bear' | 'base' = 'base'): Milestone[] {
    const milestones: Milestone[] = [];
    const baseDate = new Date();
    const holdingPeriod = this.calculateOptimalHoldingPeriod(idea);
    
    // Quarterly milestones
    for (let i = 1; i <= Math.ceil(holdingPeriod / 90); i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + (i * 90));
      
      milestones.push({
        date,
        description: `Q${i} Performance Review`,
        probability: scenario === 'bull' ? 0.8 : scenario === 'bear' ? 0.4 : 0.6,
        impact: scenario === 'bull' ? 0.05 : scenario === 'bear' ? -0.03 : 0.02,
        type: 'decision-point'
      });
    }
    
    // Major market events
    const marketEventDate = new Date(baseDate);
    marketEventDate.setDate(marketEventDate.getDate() + (holdingPeriod / 2));
    
    milestones.push({
      date: marketEventDate,
      description: 'Major Market Event',
      probability: 0.3,
      impact: scenario === 'bull' ? 0.10 : scenario === 'bear' ? -0.15 : -0.05,
      type: 'market-event'
    });
    
    return milestones;
  }

  private calculateProbabilityWeightedReturn(scenarios: OutcomeScenario[]): number {
    return scenarios.reduce((sum, scenario) => sum + (scenario.expectedReturn * scenario.probability), 0);
  }

  private calculateConfidenceInterval(investments: Investment[]): ConfidenceInterval {
    const expectedReturn = this.calculateExpectedReturn(investments, []);
    const volatility = this.calculatePortfolioVolatility(investments);
    
    // 95% confidence interval
    const zScore = 1.96;
    const standardError = volatility / Math.sqrt(252); // Daily to annual
    
    return {
      level: 0.95,
      lowerBound: expectedReturn - (zScore * standardError),
      upperBound: expectedReturn + (zScore * standardError),
      standardError
    };
  }

  private performSensitivityAnalysis(investments: Investment[], idea: InvestmentIdea): SensitivityAnalysis {
    const variables: SensitivityVariable[] = [
      {
        name: 'Market Return',
        baseValue: 0.08,
        impact: 1.2, // Beta-like sensitivity
        elasticity: 1.5,
        range: { min: -0.30, max: 0.30 }
      },
      {
        name: 'Interest Rates',
        baseValue: 0.05,
        impact: -0.8, // Negative sensitivity
        elasticity: -1.2,
        range: { min: 0.01, max: 0.10 }
      },
      {
        name: 'Volatility',
        baseValue: 0.20,
        impact: -0.3, // Higher volatility reduces returns
        elasticity: -0.5,
        range: { min: 0.10, max: 0.50 }
      }
    ];
    
    // Simplified correlation matrix
    const correlationMatrix = [
      [1.0, -0.3, 0.6],  // Market Return correlations
      [-0.3, 1.0, -0.2], // Interest Rate correlations
      [0.6, -0.2, 1.0]   // Volatility correlations
    ];
    
    return {
      variables,
      correlationMatrix,
      keyDrivers: ['Market Return', 'Interest Rates']
    };
  }

  private runMonteCarloSimulation(investments: Investment[], idea: InvestmentIdea): MonteCarloResults {
    const iterations = 10000;
    const expectedReturn = this.calculateExpectedReturn(investments, idea.potentialOutcomes);
    const volatility = this.calculatePortfolioVolatility(investments);
    
    const returns: number[] = [];
    
    // Simple Monte Carlo simulation using normal distribution
    for (let i = 0; i < iterations; i++) {
      const randomReturn = this.generateNormalRandom(expectedReturn, volatility);
      returns.push(randomReturn);
    }
    
    returns.sort((a, b) => a - b);
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / iterations;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / iterations;
    const standardDeviation = Math.sqrt(variance);
    
    const percentiles: Record<string, number> = {
      '1': returns[Math.floor(iterations * 0.01)],
      '5': returns[Math.floor(iterations * 0.05)],
      '10': returns[Math.floor(iterations * 0.10)],
      '25': returns[Math.floor(iterations * 0.25)],
      '50': returns[Math.floor(iterations * 0.50)],
      '75': returns[Math.floor(iterations * 0.75)],
      '90': returns[Math.floor(iterations * 0.90)],
      '95': returns[Math.floor(iterations * 0.95)],
      '99': returns[Math.floor(iterations * 0.99)]
    };
    
    const probabilityOfLoss = returns.filter(r => r < 0).length / iterations;
    const targetReturn = 0.10; // 10% target
    const probabilityOfTarget = returns.filter(r => r >= targetReturn).length / iterations;
    
    // Expected Shortfall (Conditional VaR at 5%)
    const var5 = percentiles['5'];
    const tailReturns = returns.filter(r => r <= var5);
    const expectedShortfall = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    
    return {
      iterations,
      meanReturn,
      standardDeviation,
      percentiles,
      probabilityOfLoss,
      probabilityOfTarget,
      expectedShortfall
    };
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + (stdDev * z0);
  }

  private generateTimeSeriesProjection(idea: InvestmentIdea, monteCarloResults: MonteCarloResults): TimeSeriesProjection[] {
    const projections: TimeSeriesProjection[] = [];
    const holdingPeriod = this.calculateOptimalHoldingPeriod(idea);
    const steps = Math.min(holdingPeriod, 365); // Daily projections up to 1 year
    
    const baseDate = new Date();
    const dailyReturn = monteCarloResults.meanReturn / 252; // Annualized to daily
    const dailyVolatility = monteCarloResults.standardDeviation / Math.sqrt(252);
    
    let cumulativeReturn = 0;
    
    for (let i = 1; i <= steps; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      const expectedValue = dailyReturn * i;
      const volatilityAdjustment = dailyVolatility * Math.sqrt(i);
      
      cumulativeReturn += dailyReturn;
      
      projections.push({
        date,
        expectedValue,
        confidenceBands: {
          upper95: expectedValue + (1.96 * volatilityAdjustment),
          upper68: expectedValue + (1.0 * volatilityAdjustment),
          lower68: expectedValue - (1.0 * volatilityAdjustment),
          lower95: expectedValue - (1.96 * volatilityAdjustment)
        },
        cumulativeReturn
      });
    }
    
    return projections;
  }
}