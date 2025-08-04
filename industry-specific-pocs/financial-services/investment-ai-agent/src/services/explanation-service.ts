/**
 * Explanation Service - Generates transparent explanations for AI decisions and recommendations
 * Implements reasoning explanation algorithms, data source attribution, and confidence interval calculation
 */

import { InvestmentIdea, Outcome, CounterArgument } from '../models/investment-idea';
import { DataPoint, AnalysisResult } from '../models/analysis';
import { Investment } from '../models/investment';

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
  weight: number; // 0-1, importance in decision
  direction: 'positive' | 'negative' | 'neutral';
  evidence: DataPoint[];
  confidenceLevel: number;
}

export interface LogicalConnection {
  from: string;
  to: string;
  relationship: 'causes' | 'correlates' | 'supports' | 'contradicts' | 'implies';
  strength: number; // 0-1
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
  contribution: number; // 0-1, how much this source contributed to the decision
  reliability: number; // 0-1
  lastUpdated: Date;
  accessLevel: 'public' | 'restricted' | 'proprietary';
}

export interface ReliabilityAssessment {
  overallScore: number; // 0-1
  sourceReliability: Record<string, number>;
  dataQuality: DataQualityMetrics;
  crossValidation: CrossValidationResult[];
}

export interface DataQualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
}

export interface CrossValidationResult {
  dataPoint: string;
  sources: string[];
  agreement: number; // 0-1
  discrepancies: string[];
}

export interface CoverageAnalysis {
  totalDataPoints: number;
  sourceDistribution: Record<string, number>;
  topicCoverage: Record<string, number>;
  gapsIdentified: string[];
}

export interface FreshnessAnalysis {
  averageAge: number; // in hours
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
  overallConfidence: number; // 0-1
  confidenceBreakdown: ConfidenceBreakdown;
  uncertaintyFactors: UncertaintyFactor[];
  confidenceInterval: ExplanationConfidenceInterval;
  sensitivityAnalysis: ExplanationSensitivityAnalysis;
}

export interface ConfidenceBreakdown {
  dataQuality: number; // 0-1
  modelReliability: number; // 0-1
  marketConditions: number; // 0-1
  timeHorizon: number; // 0-1
  complexity: number; // 0-1
}

export interface UncertaintyFactor {
  factor: string;
  description: string;
  impact: number; // 0-1, how much this reduces confidence
  mitigation: string[];
}

export interface ExplanationConfidenceInterval {
  lower: number;
  upper: number;
  level: number; // e.g., 0.95 for 95% confidence
  methodology: string;
  assumptions: string[];
}

export interface ExplanationSensitivityAnalysis {
  keyVariables: ExplanationSensitivityVariable[];
  scenarios: SensitivityScenario[];
  robustness: number; // 0-1
}

export interface ExplanationSensitivityVariable {
  name: string;
  baseValue: number;
  range: { min: number; max: number };
  impact: number; // how much changing this affects the outcome
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

export class ExplanationService {
  constructor() {}

  /**
   * Generate comprehensive explanation for an investment idea
   */
  async generateExplanation(
    investmentIdea: InvestmentIdea,
    analysisResults?: AnalysisResult[]
  ): Promise<ExplanationResult> {
    const explanationId = this.generateExplanationId();
    
    // Generate reasoning explanation
    const reasoning = await this.generateReasoningExplanation(investmentIdea, analysisResults);
    
    // Generate data source attribution
    const dataAttribution = await this.generateDataAttribution(investmentIdea);
    
    // Generate confidence analysis
    const confidenceAnalysis = await this.generateConfidenceAnalysis(investmentIdea, analysisResults);
    
    // Generate visualization suggestions
    const visualizations = await this.generateVisualizationSuggestions(
      investmentIdea,
      reasoning,
      dataAttribution,
      confidenceAnalysis
    );
    
    // Generate summary
    const summary = await this.generateExplanationSummary(
      investmentIdea,
      reasoning,
      dataAttribution,
      confidenceAnalysis
    );

    return {
      id: explanationId,
      investmentIdeaId: investmentIdea.id,
      timestamp: new Date(),
      reasoning,
      dataAttribution,
      confidenceAnalysis,
      visualizations,
      summary
    };
  }

  /**
   * Generate reasoning explanation showing decision path and key factors
   */
  private async generateReasoningExplanation(
    investmentIdea: InvestmentIdea,
    analysisResults?: AnalysisResult[]
  ): Promise<ReasoningExplanation> {
    // Extract decision steps from rationale and supporting data
    const decisionPath = this.extractDecisionPath(investmentIdea);
    
    // Identify key factors that influenced the decision
    const keyFactors = this.identifyKeyFactors(investmentIdea);
    
    // Build logical connections between factors
    const logicalChain = this.buildLogicalChain(keyFactors, investmentIdea);
    
    // Extract assumptions
    const assumptions = this.extractAssumptions(investmentIdea);
    
    // Generate alternative scenarios
    const alternativeScenarios = this.generateAlternativeScenarios(investmentIdea);

    return {
      decisionPath,
      keyFactors,
      logicalChain,
      assumptions,
      alternativeScenarios
    };
  }

  /**
   * Generate data source attribution showing where information came from
   */
  private async generateDataAttribution(investmentIdea: InvestmentIdea): Promise<DataSourceAttribution> {
    // Group data points by source
    const sourceGroups = this.groupDataPointsBySource(investmentIdea.supportingData);
    
    // Create source attributions
    const sources = this.createSourceAttributions(sourceGroups, investmentIdea);
    
    // Assess reliability
    const reliability = this.assessReliability(sources, investmentIdea.supportingData);
    
    // Analyze coverage
    const coverage = this.analyzeCoverage(sources);
    
    // Analyze freshness
    const freshness = this.analyzeFreshness(investmentIdea.supportingData);
    
    // Identify conflicts
    const conflicts = this.identifyDataConflicts(investmentIdea.supportingData, investmentIdea.counterArguments);

    return {
      sources,
      reliability,
      coverage,
      freshness,
      conflicts
    };
  }

  /**
   * Generate confidence analysis with intervals and uncertainty factors
   */
  private async generateConfidenceAnalysis(
    investmentIdea: InvestmentIdea,
    analysisResults?: AnalysisResult[]
  ): Promise<ConfidenceAnalysis> {
    // Break down confidence by components
    const confidenceBreakdown = this.calculateConfidenceBreakdown(investmentIdea, analysisResults);
    
    // Identify uncertainty factors
    const uncertaintyFactors = this.identifyUncertaintyFactors(investmentIdea);
    
    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(investmentIdea);
    
    // Perform sensitivity analysis
    const sensitivityAnalysis = this.performSensitivityAnalysis(investmentIdea);
    
    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      confidenceBreakdown,
      uncertaintyFactors,
      investmentIdea.confidenceScore
    );

    return {
      overallConfidence,
      confidenceBreakdown,
      uncertaintyFactors,
      confidenceInterval,
      sensitivityAnalysis
    };
  }

  /**
   * Extract decision steps from investment idea rationale
   */
  private extractDecisionPath(investmentIdea: InvestmentIdea): DecisionStep[] {
    const steps: DecisionStep[] = [];
    
    // Parse rationale to identify logical steps
    const rationaleSteps = this.parseRationaleSteps(investmentIdea.rationale);
    
    rationaleSteps.forEach((step, index) => {
      const relevantData = this.findRelevantDataPoints(step, investmentIdea.supportingData);
      
      steps.push({
        stepNumber: index + 1,
        description: step.description,
        inputData: relevantData,
        reasoning: step.reasoning,
        confidence: step.confidence || 0.8,
        impact: step.impact || 'medium',
        alternatives: step.alternatives || []
      });
    });

    return steps;
  }

  /**
   * Identify key factors that influenced the investment decision
   */
  private identifyKeyFactors(investmentIdea: InvestmentIdea): KeyFactor[] {
    const factors: KeyFactor[] = [];
    
    // Analyze supporting data to identify key factors
    const dataByType = this.groupDataPointsByType(investmentIdea.supportingData);
    
    Object.entries(dataByType).forEach(([type, dataPoints]) => {
      const factor = this.createKeyFactor(type, dataPoints, investmentIdea);
      if (factor) {
        factors.push(factor);
      }
    });
    
    // Add factors from potential outcomes
    investmentIdea.potentialOutcomes.forEach(outcome => {
      outcome.catalysts.forEach(catalyst => {
        const existingFactor = factors.find(f => f.name === catalyst);
        if (!existingFactor) {
          factors.push({
            name: catalyst,
            description: `Catalyst for ${outcome.scenario} scenario`,
            weight: outcome.probability,
            direction: outcome.returnEstimate > 0 ? 'positive' : 'negative',
            evidence: [],
            confidenceLevel: outcome.probability
          });
        }
      });
    });

    return factors.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Build logical connections between factors
   */
  private buildLogicalChain(keyFactors: KeyFactor[], investmentIdea: InvestmentIdea): LogicalConnection[] {
    const connections: LogicalConnection[] = [];
    
    // Analyze relationships between factors
    for (let i = 0; i < keyFactors.length; i++) {
      for (let j = i + 1; j < keyFactors.length; j++) {
        const connection = this.analyzeFactorRelationship(keyFactors[i], keyFactors[j], investmentIdea);
        if (connection) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  /**
   * Extract assumptions from investment idea
   */
  private extractAssumptions(investmentIdea: InvestmentIdea): Assumption[] {
    const assumptions: Assumption[] = [];
    
    // Extract from rationale
    const rationaleAssumptions = this.extractAssumptionsFromText(investmentIdea.rationale);
    assumptions.push(...rationaleAssumptions);
    
    // Extract from potential outcomes
    investmentIdea.potentialOutcomes.forEach(outcome => {
      outcome.conditions.forEach(condition => {
        assumptions.push({
          description: condition,
          type: this.categorizeAssumption(condition),
          confidence: outcome.probability,
          impact: 'medium',
          validation: [],
          risks: outcome.keyRisks
        });
      });
    });

    return assumptions;
  }

  /**
   * Generate alternative scenarios based on different assumptions
   */
  private generateAlternativeScenarios(investmentIdea: InvestmentIdea): AlternativeScenario[] {
    const scenarios: AlternativeScenario[] = [];
    
    // Create scenarios based on counter-arguments
    investmentIdea.counterArguments.forEach((counterArg, index) => {
      const alternativeOutcome = this.createAlternativeOutcome(counterArg, investmentIdea);
      
      scenarios.push({
        name: `Alternative Scenario ${index + 1}`,
        description: counterArg.description,
        probability: counterArg.probability,
        outcome: alternativeOutcome,
        keyDifferences: [counterArg.mitigationStrategy || 'No mitigation strategy provided']
      });
    });

    return scenarios;
  }

  /**
   * Group data points by source
   */
  private groupDataPointsBySource(dataPoints: DataPoint[]): Record<string, DataPoint[]> {
    return dataPoints.reduce((groups, dataPoint) => {
      if (!groups[dataPoint.source]) {
        groups[dataPoint.source] = [];
      }
      groups[dataPoint.source].push(dataPoint);
      return groups;
    }, {} as Record<string, DataPoint[]>);
  }

  /**
   * Create source attributions from grouped data points
   */
  private createSourceAttributions(
    sourceGroups: Record<string, DataPoint[]>,
    investmentIdea: InvestmentIdea
  ): SourceAttribution[] {
    return Object.entries(sourceGroups).map(([sourceName, dataPoints]) => {
      const contribution = this.calculateSourceContribution(dataPoints, investmentIdea);
      const reliability = this.calculateSourceReliability(dataPoints);
      
      return {
        sourceId: this.generateSourceId(sourceName),
        sourceName,
        sourceType: this.categorizeSourceType(sourceName),
        dataPoints,
        contribution,
        reliability,
        lastUpdated: this.getLatestTimestamp(dataPoints),
        accessLevel: this.determineAccessLevel(sourceName)
      };
    });
  }

  /**
   * Calculate confidence interval for investment idea
   */
  private calculateConfidenceInterval(investmentIdea: InvestmentIdea): ExplanationConfidenceInterval {
    const expectedOutcome = investmentIdea.potentialOutcomes.find(o => o.scenario === 'expected');
    const bestOutcome = investmentIdea.potentialOutcomes.find(o => o.scenario === 'best');
    const worstOutcome = investmentIdea.potentialOutcomes.find(o => o.scenario === 'worst');
    
    if (!expectedOutcome || !bestOutcome || !worstOutcome) {
      return {
        lower: investmentIdea.confidenceScore * 0.8,
        upper: investmentIdea.confidenceScore * 1.2,
        level: 0.95,
        methodology: 'Default estimation based on confidence score',
        assumptions: ['Normal distribution of outcomes']
      };
    }
    
    // Calculate confidence interval based on outcome distribution
    const mean = expectedOutcome.returnEstimate;
    const range = Math.abs(bestOutcome.returnEstimate - worstOutcome.returnEstimate);
    const standardDeviation = range / 4; // Approximate standard deviation
    
    // 95% confidence interval (±1.96 standard deviations)
    const margin = 1.96 * standardDeviation;
    
    return {
      lower: Math.max(0, mean - margin),
      upper: Math.min(1, mean + margin),
      level: 0.95,
      methodology: 'Statistical estimation based on outcome scenarios',
      assumptions: [
        'Normal distribution of returns',
        'Independent outcome scenarios',
        'Stable market conditions'
      ]
    };
  }

  /**
   * Perform sensitivity analysis on key variables
   */
  private performSensitivityAnalysis(investmentIdea: InvestmentIdea): ExplanationSensitivityAnalysis {
    const keyVariables: ExplanationSensitivityVariable[] = [
      {
        name: 'Market Volatility',
        baseValue: 0.2,
        range: { min: 0.1, max: 0.4 },
        impact: 0.3
      },
      {
        name: 'Economic Growth',
        baseValue: 0.03,
        range: { min: -0.02, max: 0.06 },
        impact: 0.4
      },
      {
        name: 'Interest Rates',
        baseValue: 0.05,
        range: { min: 0.01, max: 0.08 },
        impact: 0.25
      }
    ];
    
    const scenarios: SensitivityScenario[] = [
      {
        name: 'High Volatility',
        changes: { 'Market Volatility': 0.4 },
        resultingConfidence: investmentIdea.confidenceScore * 0.8,
        outcomeChange: -0.15
      },
      {
        name: 'Economic Recession',
        changes: { 'Economic Growth': -0.02, 'Market Volatility': 0.35 },
        resultingConfidence: investmentIdea.confidenceScore * 0.6,
        outcomeChange: -0.25
      },
      {
        name: 'Rising Interest Rates',
        changes: { 'Interest Rates': 0.08 },
        resultingConfidence: investmentIdea.confidenceScore * 0.9,
        outcomeChange: -0.1
      }
    ];
    
    const robustness = this.calculateRobustness(scenarios, investmentIdea.confidenceScore);
    
    return {
      keyVariables,
      scenarios,
      robustness
    };
  }

  // Helper methods
  private generateExplanationId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSourceId(sourceName: string): string {
    return `src_${sourceName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  }

  private parseRationaleSteps(rationale: string): any[] {
    // Simple parsing - in a real implementation, this would use NLP
    const sentences = rationale.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.map((sentence, index) => ({
      description: sentence.trim(),
      reasoning: `Step ${index + 1} in the analysis`,
      confidence: 0.8,
      impact: 'medium' as const,
      alternatives: []
    }));
  }

  private findRelevantDataPoints(step: any, dataPoints: DataPoint[]): DataPoint[] {
    // Simple relevance matching - in a real implementation, this would use semantic similarity
    return dataPoints.filter(dp => 
      step.description.toLowerCase().includes(dp.type) ||
      step.description.toLowerCase().includes(dp.source.toLowerCase())
    );
  }

  private groupDataPointsByType(dataPoints: DataPoint[]): Record<string, DataPoint[]> {
    return dataPoints.reduce((groups, dataPoint) => {
      if (!groups[dataPoint.type]) {
        groups[dataPoint.type] = [];
      }
      groups[dataPoint.type].push(dataPoint);
      return groups;
    }, {} as Record<string, DataPoint[]>);
  }

  private createKeyFactor(type: string, dataPoints: DataPoint[], investmentIdea: InvestmentIdea): KeyFactor | null {
    if (dataPoints.length === 0) return null;
    
    const avgReliability = dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
    const weight = Math.min(dataPoints.length / 10, 1) * avgReliability;
    
    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      description: `${type} analysis based on ${dataPoints.length} data points`,
      weight,
      direction: this.determineFactorDirection(dataPoints, investmentIdea),
      evidence: dataPoints,
      confidenceLevel: avgReliability
    };
  }

  private determineFactorDirection(dataPoints: DataPoint[], investmentIdea: InvestmentIdea): 'positive' | 'negative' | 'neutral' {
    // Simple heuristic - in a real implementation, this would analyze the actual data values
    const expectedOutcome = investmentIdea.potentialOutcomes.find(o => o.scenario === 'expected');
    if (expectedOutcome && expectedOutcome.returnEstimate > 0) {
      return 'positive';
    } else if (expectedOutcome && expectedOutcome.returnEstimate < 0) {
      return 'negative';
    }
    return 'neutral';
  }

  private analyzeFactorRelationship(factor1: KeyFactor, factor2: KeyFactor, investmentIdea: InvestmentIdea): LogicalConnection | null {
    // Simple relationship analysis - in a real implementation, this would use correlation analysis
    if (factor1.direction === factor2.direction) {
      return {
        from: factor1.name,
        to: factor2.name,
        relationship: 'supports',
        strength: Math.min(factor1.weight, factor2.weight),
        evidence: [`Both factors point in the same direction (${factor1.direction})`]
      };
    }
    return null;
  }

  private extractAssumptionsFromText(text: string): Assumption[] {
    // Simple assumption extraction - in a real implementation, this would use NLP
    const assumptionKeywords = ['assume', 'assuming', 'expect', 'likely', 'probable', 'if'];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences
      .filter(sentence => assumptionKeywords.some(keyword => 
        sentence.toLowerCase().includes(keyword)
      ))
      .map(sentence => ({
        description: sentence.trim(),
        type: 'market' as const,
        confidence: 0.7,
        impact: 'medium' as const,
        validation: [],
        risks: []
      }));
  }

  private categorizeAssumption(condition: string): 'market' | 'economic' | 'company' | 'regulatory' | 'technical' {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('market') || lowerCondition.includes('price')) return 'market';
    if (lowerCondition.includes('economic') || lowerCondition.includes('gdp') || lowerCondition.includes('inflation')) return 'economic';
    if (lowerCondition.includes('company') || lowerCondition.includes('earnings') || lowerCondition.includes('revenue')) return 'company';
    if (lowerCondition.includes('regulation') || lowerCondition.includes('policy') || lowerCondition.includes('law')) return 'regulatory';
    return 'technical';
  }

  private createAlternativeOutcome(counterArg: CounterArgument, investmentIdea: InvestmentIdea): Outcome {
    const expectedOutcome = investmentIdea.potentialOutcomes.find(o => o.scenario === 'expected');
    const baseReturn = expectedOutcome?.returnEstimate || 0;
    
    return {
      scenario: 'worst',
      probability: counterArg.probability,
      returnEstimate: baseReturn * (counterArg.strength === 'strong' ? -0.5 : -0.2),
      timeToRealization: expectedOutcome?.timeToRealization || 365,
      description: counterArg.description,
      conditions: [counterArg.description],
      keyRisks: [counterArg.description],
      catalysts: []
    };
  }

  private calculateSourceContribution(dataPoints: DataPoint[], investmentIdea: InvestmentIdea): number {
    const totalDataPoints = investmentIdea.supportingData.length;
    const sourceDataPoints = dataPoints.length;
    const avgReliability = dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
    
    return (sourceDataPoints / totalDataPoints) * avgReliability;
  }

  private calculateSourceReliability(dataPoints: DataPoint[]): number {
    return dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
  }

  private categorizeSourceType(sourceName: string): 'proprietary' | 'public' | 'market' | 'news' | 'research' | 'regulatory' {
    const lowerSource = sourceName.toLowerCase();
    if (lowerSource.includes('proprietary') || lowerSource.includes('internal')) return 'proprietary';
    if (lowerSource.includes('market') || lowerSource.includes('bloomberg') || lowerSource.includes('reuters')) return 'market';
    if (lowerSource.includes('news') || lowerSource.includes('media')) return 'news';
    if (lowerSource.includes('research') || lowerSource.includes('analyst')) return 'research';
    if (lowerSource.includes('sec') || lowerSource.includes('regulatory')) return 'regulatory';
    return 'public';
  }

  private getLatestTimestamp(dataPoints: DataPoint[]): Date {
    return dataPoints.reduce((latest, dp) => 
      dp.timestamp > latest ? dp.timestamp : latest, 
      new Date(0)
    );
  }

  private determineAccessLevel(sourceName: string): 'public' | 'restricted' | 'proprietary' {
    const lowerSource = sourceName.toLowerCase();
    if (lowerSource.includes('proprietary') || lowerSource.includes('internal')) return 'proprietary';
    if (lowerSource.includes('restricted') || lowerSource.includes('premium')) return 'restricted';
    return 'public';
  }

  private assessReliability(sources: SourceAttribution[], dataPoints: DataPoint[]): ReliabilityAssessment {
    const overallScore = sources.reduce((sum, source) => sum + source.reliability * source.contribution, 0);
    
    const sourceReliability = sources.reduce((acc, source) => {
      acc[source.sourceName] = source.reliability;
      return acc;
    }, {} as Record<string, number>);
    
    const dataQuality: DataQualityMetrics = {
      completeness: Math.min(dataPoints.length / 20, 1), // Assume 20 data points is complete
      accuracy: overallScore,
      consistency: this.calculateConsistency(dataPoints),
      timeliness: this.calculateTimeliness(dataPoints)
    };
    
    return {
      overallScore,
      sourceReliability,
      dataQuality,
      crossValidation: []
    };
  }

  private analyzeCoverage(sources: SourceAttribution[]): CoverageAnalysis {
    const totalDataPoints = sources.reduce((sum, source) => sum + source.dataPoints.length, 0);
    
    const sourceDistribution = sources.reduce((acc, source) => {
      acc[source.sourceName] = source.dataPoints.length;
      return acc;
    }, {} as Record<string, number>);
    
    const topicCoverage = sources.reduce((acc, source) => {
      source.dataPoints.forEach(dp => {
        acc[dp.type] = (acc[dp.type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalDataPoints,
      sourceDistribution,
      topicCoverage,
      gapsIdentified: this.identifyDataGaps(topicCoverage)
    };
  }

  private analyzeFreshness(dataPoints: DataPoint[]): FreshnessAnalysis {
    const now = new Date();
    const ages = dataPoints.map(dp => now.getTime() - dp.timestamp.getTime());
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length / (1000 * 60 * 60); // in hours
    
    const oldestDataPoint = dataPoints.reduce((oldest, dp) => 
      dp.timestamp < oldest ? dp.timestamp : oldest, 
      new Date()
    );
    
    const newestDataPoint = dataPoints.reduce((newest, dp) => 
      dp.timestamp > newest ? dp.timestamp : newest, 
      new Date(0)
    );
    
    const staleDataWarnings = dataPoints
      .filter(dp => now.getTime() - dp.timestamp.getTime() > 7 * 24 * 60 * 60 * 1000) // older than 7 days
      .map(dp => `${dp.source} data is ${Math.floor((now.getTime() - dp.timestamp.getTime()) / (24 * 60 * 60 * 1000))} days old`);
    
    return {
      averageAge,
      oldestDataPoint,
      newestDataPoint,
      staleDataWarnings
    };
  }

  private identifyDataConflicts(dataPoints: DataPoint[], counterArguments: CounterArgument[]): DataConflict[] {
    const conflicts: DataConflict[] = [];
    
    // Simple conflict detection based on counter-arguments
    counterArguments.forEach(counterArg => {
      if (counterArg.strength === 'strong') {
        conflicts.push({
          description: counterArg.description,
          conflictingSources: ['Analysis', 'Counter-argument'],
          severity: counterArg.impact === 'high' ? 'high' : 'medium',
          resolution: counterArg.mitigationStrategy || 'No resolution provided',
          impact: `Potential ${counterArg.impact} impact on investment thesis`
        });
      }
    });
    
    return conflicts;
  }

  private calculateConfidenceBreakdown(investmentIdea: InvestmentIdea, analysisResults?: AnalysisResult[]): ConfidenceBreakdown {
    const dataQuality = this.calculateDataQualityScore(investmentIdea.supportingData);
    const modelReliability = analysisResults ? 
      analysisResults.reduce((sum, result) => sum + result.confidence, 0) / analysisResults.length : 
      0.8;
    
    return {
      dataQuality,
      modelReliability,
      marketConditions: this.assessMarketConditions(investmentIdea),
      timeHorizon: this.assessTimeHorizonConfidence(investmentIdea.timeHorizon),
      complexity: this.assessComplexity(investmentIdea)
    };
  }

  private identifyUncertaintyFactors(investmentIdea: InvestmentIdea): UncertaintyFactor[] {
    const factors: UncertaintyFactor[] = [];
    
    // Add uncertainty factors based on counter-arguments
    investmentIdea.counterArguments.forEach(counterArg => {
      factors.push({
        factor: counterArg.description,
        description: `Counter-argument with ${counterArg.strength} strength`,
        impact: counterArg.strength === 'strong' ? 0.3 : counterArg.strength === 'moderate' ? 0.2 : 0.1,
        mitigation: counterArg.mitigationStrategy ? [counterArg.mitigationStrategy] : []
      });
    });
    
    // Add general uncertainty factors
    factors.push({
      factor: 'Market Volatility',
      description: 'General market uncertainty and volatility',
      impact: 0.15,
      mitigation: ['Diversification', 'Risk management', 'Position sizing']
    });
    
    return factors;
  }

  private calculateOverallConfidence(
    breakdown: ConfidenceBreakdown,
    uncertaintyFactors: UncertaintyFactor[],
    baseConfidence: number
  ): number {
    const breakdownAverage = (
      breakdown.dataQuality +
      breakdown.modelReliability +
      breakdown.marketConditions +
      breakdown.timeHorizon +
      breakdown.complexity
    ) / 5;
    
    const uncertaintyReduction = uncertaintyFactors.reduce((sum, factor) => sum + factor.impact, 0);
    
    return Math.max(0, Math.min(1, (baseConfidence + breakdownAverage) / 2 - uncertaintyReduction));
  }

  private calculateRobustness(scenarios: SensitivityScenario[], baseConfidence: number): number {
    const confidenceVariations = scenarios.map(scenario => 
      Math.abs(scenario.resultingConfidence - baseConfidence)
    );
    
    const maxVariation = Math.max(...confidenceVariations);
    return Math.max(0, 1 - maxVariation);
  }

  // Additional helper methods
  private calculateConsistency(dataPoints: DataPoint[]): number {
    // Simple consistency calculation - in a real implementation, this would analyze data consistency
    return 0.8;
  }

  private calculateTimeliness(dataPoints: DataPoint[]): number {
    const now = new Date();
    const avgAge = dataPoints.reduce((sum, dp) => 
      sum + (now.getTime() - dp.timestamp.getTime()), 0
    ) / dataPoints.length;
    
    const maxAcceptableAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return Math.max(0, 1 - (avgAge / maxAcceptableAge));
  }

  private identifyDataGaps(topicCoverage: Record<string, number>): string[] {
    const requiredTopics = ['fundamental', 'technical', 'sentiment', 'news', 'research'];
    return requiredTopics.filter(topic => !topicCoverage[topic] || topicCoverage[topic] < 2);
  }

  private calculateDataQualityScore(dataPoints: DataPoint[]): number {
    if (dataPoints.length === 0) return 0;
    return dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
  }

  private assessMarketConditions(investmentIdea: InvestmentIdea): number {
    // Simple market conditions assessment based on metadata
    const marketConditions = investmentIdea.metadata?.marketConditionsAtGeneration;
    if (!marketConditions) return 0.7;
    
    let score = 0.5;
    if (marketConditions.marketTrend === 'bull') score += 0.2;
    if (marketConditions.volatilityIndex < 20) score += 0.2;
    if (marketConditions.geopoliticalRisk === 'low') score += 0.1;
    
    return Math.min(1, score);
  }

  private assessTimeHorizonConfidence(timeHorizon: string): number {
    const confidenceMap: Record<string, number> = {
      'intraday': 0.6,
      'short': 0.7,
      'medium': 0.8,
      'long': 0.9,
      'very-long': 0.7
    };
    
    return confidenceMap[timeHorizon] || 0.7;
  }

  private assessComplexity(investmentIdea: InvestmentIdea): number {
    let complexity = 0.8;
    
    // Reduce confidence for complex strategies
    if (investmentIdea.strategy === 'complex') complexity -= 0.2;
    if (investmentIdea.investments.length > 5) complexity -= 0.1;
    if (investmentIdea.counterArguments.length > 3) complexity -= 0.1;
    
    return Math.max(0.3, complexity);
  }

  private async generateVisualizationSuggestions(
    investmentIdea: InvestmentIdea,
    reasoning: ReasoningExplanation,
    dataAttribution: DataSourceAttribution,
    confidenceAnalysis: ConfidenceAnalysis
  ): Promise<VisualizationSuggestion[]> {
    return [
      {
        type: 'decision-tree',
        title: 'Investment Decision Tree',
        description: 'Visual representation of the decision-making process',
        data: reasoning.decisionPath,
        priority: 'high'
      },
      {
        type: 'factor-importance',
        title: 'Key Factor Importance',
        description: 'Chart showing the relative importance of different factors',
        data: reasoning.keyFactors,
        priority: 'high'
      },
      {
        type: 'confidence-bands',
        title: 'Confidence Intervals',
        description: 'Visualization of confidence intervals and uncertainty',
        data: confidenceAnalysis.confidenceInterval,
        priority: 'medium'
      },
      {
        type: 'data-flow',
        title: 'Data Source Flow',
        description: 'How different data sources contribute to the analysis',
        data: dataAttribution.sources,
        priority: 'medium'
      },
      {
        type: 'scenario-comparison',
        title: 'Scenario Comparison',
        description: 'Comparison of different outcome scenarios',
        data: investmentIdea.potentialOutcomes,
        priority: 'low'
      }
    ];
  }

  private async generateExplanationSummary(
    investmentIdea: InvestmentIdea,
    reasoning: ReasoningExplanation,
    dataAttribution: DataSourceAttribution,
    confidenceAnalysis: ConfidenceAnalysis
  ): Promise<string> {
    const keyFactorsText = reasoning.keyFactors
      .slice(0, 3)
      .map(factor => `${factor.name} (${Math.round(factor.weight * 100)}% importance)`)
      .join(', ');
    
    const dataSourcesText = dataAttribution.sources
      .slice(0, 3)
      .map(source => source.sourceName)
      .join(', ');
    
    const confidenceText = `${Math.round(confidenceAnalysis.overallConfidence * 100)}%`;
    
    return `This investment idea is based on ${reasoning.keyFactors.length} key factors, with the most important being: ${keyFactorsText}. ` +
           `The analysis draws from ${dataAttribution.sources.length} data sources including ${dataSourcesText}. ` +
           `Overall confidence in this recommendation is ${confidenceText}, with a confidence interval of ` +
           `${Math.round(confidenceAnalysis.confidenceInterval.lower * 100)}% to ${Math.round(confidenceAnalysis.confidenceInterval.upper * 100)}%.`;
  }
}