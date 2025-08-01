/**
 * Investment Idea Generation Orchestration Service
 * 
 * This service orchestrates the multi-agent workflow for generating investment ideas,
 * implements filtering based on user preferences, and provides confidence scoring and ranking.
 */

import {
  InvestmentIdea,
  CreateInvestmentIdeaRequest,
  InvestmentStrategy,
  TimeHorizon,
  InvestmentCategory,
  RiskLevel,
  TargetAudience,
  Outcome
} from '../models/investment-idea';
import { RequestParameters, UserRequest } from '../models/request';
import { SupervisorAgent } from './ai/supervisor-agent';
import { PlanningAgent } from './ai/planning-agent';
import { ResearchAgent } from './ai/research-agent';
import { AnalysisAgent } from './ai/analysis-agent';
import { ComplianceAgent } from './ai/compliance-agent';
import { SynthesisAgent } from './ai/synthesis-agent';
import { InvestmentIdeaService } from './investment-idea-service';
import { MessageBus } from './communication/message-bus';

export interface IdeaGenerationRequest {
  userId: string;
  requestId: string;
  parameters: IdeaGenerationParameters;
  context?: IdeaGenerationContext;
}

export interface IdeaGenerationParameters {
  investmentHorizon: TimeHorizon;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  sectors?: string[];
  assetClasses?: string[];
  excludedInvestments?: string[];
  minimumConfidence?: number;
  maximumIdeas?: number;
  specificInvestments?: string[];
  marketConditions?: string[];
  thematicFocus?: string[];
  geographicFocus?: string[];
  targetAudience?: TargetAudience[];
  customFilters?: Record<string, any>;
}

export interface IdeaGenerationContext {
  userProfile?: UserProfile;
  marketContext?: MarketContext;
  portfolioContext?: PortfolioContext;
  complianceContext?: ComplianceContext;
}

export interface UserProfile {
  investmentExperience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  preferredStrategies: InvestmentStrategy[];
  historicalPreferences: string[];
  riskProfile: RiskProfile;
}

export interface RiskProfile {
  riskCapacity: number; // 0-100
  riskTolerance: number; // 0-100
  timeHorizon: TimeHorizon;
  liquidityNeeds: 'high' | 'medium' | 'low';
}

export interface MarketContext {
  currentConditions: string[];
  volatilityLevel: 'low' | 'medium' | 'high';
  marketTrend: 'bull' | 'bear' | 'sideways';
  economicIndicators: Record<string, number>;
  geopoliticalRisk: 'low' | 'medium' | 'high';
}

export interface PortfolioContext {
  currentHoldings?: string[];
  assetAllocation?: Record<string, number>;
  concentrationRisks?: string[];
  rebalancingNeeds?: string[];
}

export interface ComplianceContext {
  applicableRegulations: string[];
  restrictedInvestments: string[];
  mandatoryChecks: string[];
  organizationPolicies?: Record<string, any>;
}

export interface IdeaGenerationResult {
  requestId: string;
  ideas: RankedInvestmentIdea[];
  metadata: GenerationMetadata;
  processingMetrics: ProcessingMetrics;
}

export interface RankedInvestmentIdea extends InvestmentIdea {
  rank: number;
  rankingScore: number;
  rankingFactors: RankingFactor[];
  filteredReasons?: string[];
}

export interface RankingFactor {
  factor: string;
  weight: number;
  score: number;
  contribution: number;
  explanation: string;
}

export interface GenerationMetadata {
  totalIdeasGenerated: number;
  totalIdeasFiltered: number;
  filteringCriteria: FilterCriteria[];
  confidenceDistribution: ConfidenceDistribution;
  processingSteps: ProcessingStep[];
}

export interface FilterCriteria {
  criterion: string;
  type: 'inclusion' | 'exclusion';
  value: any;
  appliedCount: number;
}

export interface ConfidenceDistribution {
  high: number; // > 0.8
  medium: number; // 0.5 - 0.8
  low: number; // < 0.5
  average: number;
}

export interface ProcessingStep {
  step: string;
  agent: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'failed' | 'skipped';
  output?: any;
}

export interface ProcessingMetrics {
  totalProcessingTime: number;
  agentProcessingTimes: Record<string, number>;
  dataSourcesAccessed: string[];
  modelsUsed: string[];
  resourceUtilization: Record<string, number>;
}

export class InvestmentIdeaOrchestrationService {
  private supervisorAgent: SupervisorAgent;
  private planningAgent: PlanningAgent;
  private researchAgent: ResearchAgent;
  private analysisAgent: AnalysisAgent;
  private complianceAgent: ComplianceAgent;
  private synthesisAgent: SynthesisAgent;
  private investmentIdeaService: InvestmentIdeaService;
  private messageBus: MessageBus;
  private activeRequests: Map<string, IdeaGenerationRequest> = new Map();

  constructor(
    supervisorAgent: SupervisorAgent,
    planningAgent: PlanningAgent,
    researchAgent: ResearchAgent,
    analysisAgent: AnalysisAgent,
    complianceAgent: ComplianceAgent,
    synthesisAgent: SynthesisAgent,
    investmentIdeaService: InvestmentIdeaService,
    messageBus: MessageBus
  ) {
    this.supervisorAgent = supervisorAgent;
    this.planningAgent = planningAgent;
    this.researchAgent = researchAgent;
    this.analysisAgent = analysisAgent;
    this.complianceAgent = complianceAgent;
    this.synthesisAgent = synthesisAgent;
    this.investmentIdeaService = investmentIdeaService;
    this.messageBus = messageBus;
  }

  /**
   * Generate investment ideas based on user parameters
   */
  async generateInvestmentIdeas(request: IdeaGenerationRequest): Promise<IdeaGenerationResult> {
    const startTime = new Date();
    this.activeRequests.set(request.requestId, request);

    try {
      // Initialize processing metadata
      const metadata: GenerationMetadata = {
        totalIdeasGenerated: 0,
        totalIdeasFiltered: 0,
        filteringCriteria: [],
        confidenceDistribution: { high: 0, medium: 0, low: 0, average: 0 },
        processingSteps: []
      };

      const processingMetrics: ProcessingMetrics = {
        totalProcessingTime: 0,
        agentProcessingTimes: {},
        dataSourcesAccessed: [],
        modelsUsed: [],
        resourceUtilization: {}
      };

      // Step 1: Planning Phase
      const planningResult = await this.executePlanningPhase(request, metadata);
      
      // Step 2: Research Phase
      const researchResult = await this.executeResearchPhase(request, planningResult, metadata);
      
      // Step 3: Analysis Phase
      const analysisResult = await this.executeAnalysisPhase(request, researchResult, metadata);
      
      // Step 4: Compliance Phase
      const complianceResult = await this.executeCompliancePhase(request, analysisResult, metadata);
      
      // Step 5: Synthesis Phase
      const synthesisResult = await this.executeSynthesisPhase(request, complianceResult, metadata);
      
      // Step 6: Filtering and Ranking
      const filteredAndRankedIdeas = await this.filterAndRankIdeas(
        synthesisResult.ideas,
        request.parameters,
        metadata
      );

      // Calculate final metrics
      const endTime = new Date();
      processingMetrics.totalProcessingTime = endTime.getTime() - startTime.getTime();
      
      // Update confidence distribution
      this.updateConfidenceDistribution(filteredAndRankedIdeas, metadata);

      return {
        requestId: request.requestId,
        ideas: filteredAndRankedIdeas,
        metadata,
        processingMetrics
      };

    } catch (error) {
      console.error('Error in investment idea generation:', error);
      throw new Error(`Investment idea generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.activeRequests.delete(request.requestId);
    }
  }

  /**
   * Execute planning phase
   */
  private async executePlanningPhase(
    request: IdeaGenerationRequest,
    metadata: GenerationMetadata
  ): Promise<any> {
    const stepStart = new Date();

    try {
      // Create planning context
      const planningContext = {
        requestType: 'investment-idea-generation',
        userId: request.userId,
        parameters: request.parameters,
        context: request.context,
        objectives: this.extractObjectives(request.parameters),
        userPreferences: {
          investmentHorizon: this.convertTimeHorizon(request.parameters.investmentHorizon),
          riskTolerance: request.parameters.riskTolerance,
          preferredSectors: request.parameters.sectors,
          excludedInvestments: request.parameters.excludedInvestments
        },
        constraints: {
          timeLimit: 300000, // 5 minutes
          dataSourceRestrictions: request.parameters.excludedInvestments,
          complianceRequirements: ['SEC', 'FINRA']
        }
      };

      // Execute planning
      const planningResult = await this.planningAgent.createResearchPlan(request.requestId, planningContext);

      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'planning',
        agent: 'planning-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'completed',
        output: planningResult
      });

      return planningResult;
    } catch (error) {
      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'planning',
        agent: 'planning-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'failed'
      });
      throw error;
    }
  }

  /**
   * Execute research phase
   */
  private async executeResearchPhase(
    request: IdeaGenerationRequest,
    planningResult: any,
    metadata: GenerationMetadata
  ): Promise<any> {
    const stepStart = new Date();

    try {
      // Create research requests based on planning
      const researchRequests = this.createResearchRequests(request.parameters, planningResult);

      // Execute research tasks in parallel
      const researchResults = await Promise.all(
        researchRequests.map(req => this.researchAgent.processResearchRequest(req))
      );

      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'research',
        agent: 'research-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'completed',
        output: researchResults
      });

      return {
        researchData: researchResults,
        marketInsights: this.extractMarketInsights(researchResults),
        trendAnalysis: this.extractTrendAnalysis(researchResults)
      };
    } catch (error) {
      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'research',
        agent: 'research-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'failed'
      });
      throw error;
    }
  }

  /**
   * Execute analysis phase
   */
  private async executeAnalysisPhase(
    request: IdeaGenerationRequest,
    researchResult: any,
    metadata: GenerationMetadata
  ): Promise<any> {
    const stepStart = new Date();

    try {
      // Create analysis requests
      const analysisRequest = {
        investments: [], // Will be populated from research results
        analysisType: 'comprehensive' as const,
        parameters: {
          timeHorizon: this.convertTimeHorizon(request.parameters.investmentHorizon),
          riskTolerance: request.parameters.riskTolerance,
          includeStressTesting: true,
          confidenceLevel: 0.95
        },
        context: this.convertToConversationContext(request)
      };

      // Execute financial analysis
      const analysisResult = await this.analysisAgent.processAnalysisRequest(analysisRequest);

      // Scenarios are included in the analysis result
      const scenarios = analysisResult.scenarioAnalysis || null;

      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'analysis',
        agent: 'analysis-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'completed',
        output: { analysisResult, scenarios }
      });

      return {
        analysisResult,
        scenarios,
        riskAssessment: this.extractRiskAssessment(analysisResult),
        opportunityIdentification: this.extractOpportunities(analysisResult),
        researchFindings: researchResult.researchData || []
      };
    } catch (error) {
      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'analysis',
        agent: 'analysis-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'failed'
      });
      throw error;
    }
  }

  /**
   * Execute compliance phase
   */
  private async executeCompliancePhase(
    request: IdeaGenerationRequest,
    analysisResult: any,
    metadata: GenerationMetadata
  ): Promise<any> {
    const stepStart = new Date();

    try {
      // Create compliance request
      const complianceRequest = {
        investments: analysisResult.results?.map((r: any) => r.investment).filter(Boolean) || [],
        requestType: 'compliance-check' as const,
        parameters: {
          jurisdictions: ['US', 'SEC'],
          riskTolerance: request.parameters.riskTolerance,
          investmentHorizon: this.convertTimeHorizon(request.parameters.investmentHorizon),
          includeESG: true
        },
        context: this.convertToConversationContext(request)
      };

      // Execute compliance checks
      const complianceResult = await this.complianceAgent.processComplianceRequest(complianceRequest);

      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'compliance',
        agent: 'compliance-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'completed',
        output: complianceResult
      });

      return {
        complianceResult,
        filteredOpportunities: this.filterByCompliance(
          analysisResult.opportunityIdentification,
          complianceResult
        ),
        analysisResults: analysisResult.results || [],
        researchFindings: analysisResult.researchFindings || []
      };
    } catch (error) {
      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'compliance',
        agent: 'compliance-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'failed'
      });
      throw error;
    }
  }

  /**
   * Execute synthesis phase
   */
  private async executeSynthesisPhase(
    request: IdeaGenerationRequest,
    complianceResult: any,
    metadata: GenerationMetadata
  ): Promise<any> {
    const stepStart = new Date();

    try {
      // Create synthesis request
      const synthesisRequest = {
        analysisResults: complianceResult.analysisResults || [],
        researchFindings: complianceResult.researchFindings || [],
        complianceChecks: complianceResult.complianceResults || [],
        userPreferences: {
          investmentHorizon: this.convertTimeHorizon(request.parameters.investmentHorizon),
          riskTolerance: request.parameters.riskTolerance,
          preferredSectors: request.parameters.sectors,
          excludedInvestments: request.parameters.excludedInvestments
        },
        outputFormat: 'detailed' as const,
        includeVisualizations: true,
        context: this.convertToConversationContext(request)
      };

      // Execute synthesis
      const synthesisResult = await this.synthesisAgent.processSynthesisRequest(synthesisRequest);

      // Convert synthesis results to investment ideas
      const ideas = await this.convertToInvestmentIdeas(
        synthesisResult.investmentIdeas || [],
        request.userId,
        metadata
      );

      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'synthesis',
        agent: 'synthesis-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'completed',
        output: synthesisResult
      });

      metadata.totalIdeasGenerated = ideas.length;

      return {
        synthesisResult,
        ideas
      };
    } catch (error) {
      const stepEnd = new Date();
      metadata.processingSteps.push({
        step: 'synthesis',
        agent: 'synthesis-agent',
        startTime: stepStart,
        endTime: stepEnd,
        duration: stepEnd.getTime() - stepStart.getTime(),
        status: 'failed'
      });
      throw error;
    }
  }

  /**
   * Filter and rank investment ideas based on user preferences
   */
  private async filterAndRankIdeas(
    ideas: InvestmentIdea[],
    parameters: IdeaGenerationParameters,
    metadata: GenerationMetadata
  ): Promise<RankedInvestmentIdea[]> {
    // Apply filters
    const filteredIdeas = this.applyFilters(ideas, parameters, metadata);
    
    // Calculate ranking scores
    const rankedIdeas = this.calculateRankingScores(filteredIdeas, parameters);
    
    // Sort by ranking score
    rankedIdeas.sort((a, b) => b.rankingScore - a.rankingScore);
    
    // Assign ranks and limit results
    const maxIdeas = parameters.maximumIdeas || 10;
    const finalIdeas = rankedIdeas.slice(0, maxIdeas).map((idea, index) => ({
      ...idea,
      rank: index + 1
    }));

    metadata.totalIdeasFiltered = ideas.length - filteredIdeas.length;

    return finalIdeas;
  }

  /**
   * Apply filtering criteria to investment ideas
   */
  private applyFilters(
    ideas: InvestmentIdea[],
    parameters: IdeaGenerationParameters,
    metadata: GenerationMetadata
  ): InvestmentIdea[] {
    let filteredIdeas = [...ideas];

    // Minimum confidence filter
    if (parameters.minimumConfidence !== undefined) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => idea.confidenceScore >= parameters.minimumConfidence!);
      
      metadata.filteringCriteria.push({
        criterion: 'minimumConfidence',
        type: 'inclusion',
        value: parameters.minimumConfidence,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    // Time horizon filter
    if (parameters.investmentHorizon) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => 
        this.isCompatibleTimeHorizon(idea.timeHorizon, parameters.investmentHorizon!)
      );
      
      metadata.filteringCriteria.push({
        criterion: 'investmentHorizon',
        type: 'inclusion',
        value: parameters.investmentHorizon,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    // Risk tolerance filter
    if (parameters.riskTolerance) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => 
        this.isCompatibleRiskLevel(idea.riskLevel, parameters.riskTolerance!)
      );
      
      metadata.filteringCriteria.push({
        criterion: 'riskTolerance',
        type: 'inclusion',
        value: parameters.riskTolerance,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    // Sector filter
    if (parameters.sectors && parameters.sectors.length > 0) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => 
        this.matchesSectorCriteria(idea, parameters.sectors!)
      );
      
      metadata.filteringCriteria.push({
        criterion: 'sectors',
        type: 'inclusion',
        value: parameters.sectors,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    // Asset class filter
    if (parameters.assetClasses && parameters.assetClasses.length > 0) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => 
        this.matchesAssetClassCriteria(idea, parameters.assetClasses!)
      );
      
      metadata.filteringCriteria.push({
        criterion: 'assetClasses',
        type: 'inclusion',
        value: parameters.assetClasses,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    // Excluded investments filter
    if (parameters.excludedInvestments && parameters.excludedInvestments.length > 0) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => 
        !this.containsExcludedInvestments(idea, parameters.excludedInvestments!)
      );
      
      metadata.filteringCriteria.push({
        criterion: 'excludedInvestments',
        type: 'exclusion',
        value: parameters.excludedInvestments,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    // Target audience filter
    if (parameters.targetAudience && parameters.targetAudience.length > 0) {
      const beforeCount = filteredIdeas.length;
      filteredIdeas = filteredIdeas.filter(idea => 
        this.matchesTargetAudience(idea, parameters.targetAudience!)
      );
      
      metadata.filteringCriteria.push({
        criterion: 'targetAudience',
        type: 'inclusion',
        value: parameters.targetAudience,
        appliedCount: beforeCount - filteredIdeas.length
      });
    }

    return filteredIdeas;
  }

  /**
   * Calculate ranking scores for investment ideas
   */
  private calculateRankingScores(
    ideas: InvestmentIdea[],
    parameters: IdeaGenerationParameters
  ): RankedInvestmentIdea[] {
    return ideas.map(idea => {
      const rankingFactors: RankingFactor[] = [];
      let totalScore = 0;
      let totalWeight = 0;

      // Confidence score factor (weight: 30%)
      const confidenceWeight = 0.3;
      const confidenceScore = idea.confidenceScore;
      const confidenceContribution = confidenceScore * confidenceWeight;
      
      rankingFactors.push({
        factor: 'confidence',
        weight: confidenceWeight,
        score: confidenceScore,
        contribution: confidenceContribution,
        explanation: `Investment confidence score of ${(confidenceScore * 100).toFixed(1)}%`
      });

      totalScore += confidenceContribution;
      totalWeight += confidenceWeight;

      // Risk-return optimization factor (weight: 25%)
      const riskReturnWeight = 0.25;
      const riskReturnScore = this.calculateRiskReturnScore(idea, parameters.riskTolerance);
      const riskReturnContribution = riskReturnScore * riskReturnWeight;
      
      rankingFactors.push({
        factor: 'risk-return',
        weight: riskReturnWeight,
        score: riskReturnScore,
        contribution: riskReturnContribution,
        explanation: `Risk-return profile alignment with user preferences`
      });

      totalScore += riskReturnContribution;
      totalWeight += riskReturnWeight;

      // Time horizon alignment factor (weight: 15%)
      const timeHorizonWeight = 0.15;
      const timeHorizonScore = this.calculateTimeHorizonScore(idea.timeHorizon, parameters.investmentHorizon);
      const timeHorizonContribution = timeHorizonScore * timeHorizonWeight;
      
      rankingFactors.push({
        factor: 'time-horizon',
        weight: timeHorizonWeight,
        score: timeHorizonScore,
        contribution: timeHorizonContribution,
        explanation: `Time horizon alignment with investment goals`
      });

      totalScore += timeHorizonContribution;
      totalWeight += timeHorizonWeight;

      // Novelty and quality factor (weight: 20%)
      const qualityWeight = 0.2;
      const qualityScore = (idea.metadata.qualityScore + idea.metadata.noveltyScore) / 200; // Normalize to 0-1
      const qualityContribution = qualityScore * qualityWeight;
      
      rankingFactors.push({
        factor: 'quality-novelty',
        weight: qualityWeight,
        score: qualityScore,
        contribution: qualityContribution,
        explanation: `Combination of idea quality and novelty scores`
      });

      totalScore += qualityContribution;
      totalWeight += qualityWeight;

      // Market timing factor (weight: 10%)
      const timingWeight = 0.1;
      const timingScore = this.calculateMarketTimingScore(idea);
      const timingContribution = timingScore * timingWeight;
      
      rankingFactors.push({
        factor: 'market-timing',
        weight: timingWeight,
        score: timingScore,
        contribution: timingContribution,
        explanation: `Market timing and current conditions alignment`
      });

      totalScore += timingContribution;
      totalWeight += timingWeight;

      // Normalize final score
      const rankingScore = totalWeight > 0 ? totalScore / totalWeight : 0;

      const rankedIdea: RankedInvestmentIdea = {
        ...idea,
        rank: 0, // Will be set later
        rankingScore,
        rankingFactors
      };

      return rankedIdea;
    });
  }

  // Helper methods for filtering and ranking

  private isCompatibleTimeHorizon(ideaHorizon: TimeHorizon, userHorizon: TimeHorizon): boolean {
    const horizonOrder = ['intraday', 'short', 'medium', 'long', 'very-long'];
    const ideaIndex = horizonOrder.indexOf(ideaHorizon);
    const userIndex = horizonOrder.indexOf(userHorizon);
    
    // Allow ideas within one level of user preference
    return Math.abs(ideaIndex - userIndex) <= 1;
  }

  private isCompatibleRiskLevel(ideaRisk: RiskLevel, userRisk: 'conservative' | 'moderate' | 'aggressive'): boolean {
    const riskMapping = {
      'conservative': ['very-low', 'low'],
      'moderate': ['low', 'moderate', 'high'],
      'aggressive': ['moderate', 'high', 'very-high']
    };
    
    return riskMapping[userRisk].includes(ideaRisk);
  }

  private matchesSectorCriteria(idea: InvestmentIdea, sectors: string[]): boolean {
    return idea.investments.some(investment => 
      investment.sector && sectors.includes(investment.sector)
    );
  }

  private matchesAssetClassCriteria(idea: InvestmentIdea, assetClasses: string[]): boolean {
    return idea.investments.some(investment => 
      assetClasses.includes(investment.type)
    );
  }

  private containsExcludedInvestments(idea: InvestmentIdea, excludedInvestments: string[]): boolean {
    return idea.investments.some(investment => 
      excludedInvestments.includes(investment.name) || 
      (investment.ticker && excludedInvestments.includes(investment.ticker))
    );
  }

  private matchesTargetAudience(idea: InvestmentIdea, targetAudience: TargetAudience[]): boolean {
    return idea.targetAudience.some(audience => targetAudience.includes(audience));
  }

  private calculateRiskReturnScore(idea: InvestmentIdea, riskTolerance?: 'conservative' | 'moderate' | 'aggressive'): number {
    if (!riskTolerance) return 0.5;

    const expectedReturn = idea.potentialOutcomes.find(o => o.scenario === 'expected')?.returnEstimate || 0;
    const riskLevel = idea.riskLevel;

    // Risk-return optimization based on user tolerance
    const riskScores = {
      'very-low': 0.2,
      'low': 0.4,
      'moderate': 0.6,
      'high': 0.8,
      'very-high': 1.0
    };

    const riskScore = riskScores[riskLevel];
    const returnScore = Math.min(expectedReturn / 0.2, 1); // Normalize assuming 20% is excellent return

    // Weight based on user risk tolerance
    const weights = {
      'conservative': { risk: 0.7, return: 0.3 },
      'moderate': { risk: 0.5, return: 0.5 },
      'aggressive': { risk: 0.3, return: 0.7 }
    };

    const weight = weights[riskTolerance];
    return (1 - riskScore) * weight.risk + returnScore * weight.return;
  }

  private calculateTimeHorizonScore(ideaHorizon: TimeHorizon, userHorizon?: TimeHorizon): number {
    if (!userHorizon) return 0.5;

    const horizonOrder = ['intraday', 'short', 'medium', 'long', 'very-long'];
    const ideaIndex = horizonOrder.indexOf(ideaHorizon);
    const userIndex = horizonOrder.indexOf(userHorizon);
    
    const distance = Math.abs(ideaIndex - userIndex);
    return Math.max(0, 1 - distance * 0.25); // Decrease score by 25% for each level difference
  }

  private calculateMarketTimingScore(idea: InvestmentIdea): number {
    // Simple market timing score based on market conditions at generation
    const marketConditions = idea.metadata.marketConditionsAtGeneration;
    
    let score = 0.5; // Base score

    // Adjust based on volatility and trend
    if (marketConditions.marketTrend === 'bull') {
      score += 0.2;
    } else if (marketConditions.marketTrend === 'bear') {
      score -= 0.1;
    }

    // Adjust based on geopolitical risk
    if (marketConditions.geopoliticalRisk === 'low') {
      score += 0.1;
    } else if (marketConditions.geopoliticalRisk === 'high') {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  private updateConfidenceDistribution(ideas: RankedInvestmentIdea[], metadata: GenerationMetadata): void {
    let high = 0, medium = 0, low = 0, total = 0;

    ideas.forEach(idea => {
      if (idea.confidenceScore > 0.8) high++;
      else if (idea.confidenceScore >= 0.5) medium++;
      else low++;
      total += idea.confidenceScore;
    });

    metadata.confidenceDistribution = {
      high,
      medium,
      low,
      average: ideas.length > 0 ? total / ideas.length : 0
    };
  }

  // Helper methods for phase execution

  private extractObjectives(parameters: IdeaGenerationParameters): string[] {
    const objectives = ['Generate investment ideas'];
    
    if (parameters.investmentHorizon) {
      objectives.push(`Focus on ${parameters.investmentHorizon}-term investments`);
    }
    
    if (parameters.riskTolerance) {
      objectives.push(`Align with ${parameters.riskTolerance} risk tolerance`);
    }
    
    if (parameters.sectors && parameters.sectors.length > 0) {
      objectives.push(`Focus on sectors: ${parameters.sectors.join(', ')}`);
    }
    
    return objectives;
  }

  private createResearchRequests(parameters: IdeaGenerationParameters, planningResult: any): any[] {
    const requests = [];

    // Market research request
    requests.push({
      topic: `market trends ${parameters.investmentHorizon || 'medium'} term`,
      researchType: 'comprehensive' as const,
      parameters: {
        depth: 'comprehensive',
        sources: ['financial-news', 'market-data', 'research-reports'],
        timeframe: 'recent' as const,
        includeMarketData: true,
        maxResults: 50
      }
    });

    // Sector-specific research
    if (parameters.sectors && parameters.sectors.length > 0) {
      parameters.sectors.forEach(sector => {
        requests.push({
          topic: `${sector} sector investment opportunities`,
          researchType: 'web-search' as const,
          parameters: {
            depth: 'standard',
            sources: ['sector-reports', 'company-analysis'],
            timeframe: 'past-month' as const,
            focusAreas: [sector],
            maxResults: 30
          }
        });
      });
    }

    return requests;
  }

  private extractMarketInsights(researchResults: any[]): any {
    // Extract market insights from research results
    return {
      trends: researchResults.flatMap(r => r.trends || []),
      opportunities: researchResults.flatMap(r => r.marketInsights || []),
      risks: researchResults.flatMap(r => r.keyFindings?.filter((f: string) => f.toLowerCase().includes('risk')) || [])
    };
  }

  private extractTrendAnalysis(researchResults: any[]): any {
    // Extract trend analysis from research results
    return {
      emergingTrends: researchResults.flatMap(r => r.trends || []),
      marketSentiment: researchResults.map(r => r.confidence).filter(Boolean),
      technicalIndicators: researchResults.flatMap(r => r.patterns || [])
    };
  }

  private extractRiskAssessment(analysisResult: any): any {
    return {
      marketRisks: analysisResult.riskAssessment?.riskFactors || [],
      specificRisks: analysisResult.riskAssessment?.specificRisks || [],
      riskMitigation: analysisResult.riskAssessment?.mitigationStrategies || []
    };
  }

  private extractOpportunities(analysisResult: any): any[] {
    return analysisResult.results?.map((r: any) => ({
      id: r.investment?.id || `opp-${Date.now()}`,
      title: r.investment?.name || 'Investment Opportunity',
      description: r.summary || 'Investment opportunity identified through analysis',
      expectedReturn: r.expectedReturn || 0.1,
      riskLevel: r.riskLevel || 'moderate',
      investment: r.investment
    })) || [];
  }

  private filterByCompliance(opportunities: any[], complianceResult: any): any[] {
    const criticalIssues = complianceResult.complianceResults?.flatMap((cr: any) => 
      cr.issues?.filter((issue: any) => issue.severity === 'critical') || []
    ) || [];
    
    return opportunities.filter(opp => 
      !criticalIssues.some((issue: any) => 
        issue.description.toLowerCase().includes(opp.title.toLowerCase())
      )
    );
  }

  private async convertToInvestmentIdeas(
    investmentIdeas: InvestmentIdea[],
    userId: string,
    metadata: GenerationMetadata
  ): Promise<InvestmentIdea[]> {
    const ideas: InvestmentIdea[] = [];

    for (const idea of investmentIdeas) {
      const createRequest: CreateInvestmentIdeaRequest = {
        title: idea.title,
        description: idea.description,
        investments: idea.investments || [],
        rationale: idea.rationale,
        strategy: idea.strategy || 'buy',
        timeHorizon: idea.timeHorizon || 'medium',
        confidenceScore: idea.confidenceScore || 0.5,
        potentialOutcomes: idea.potentialOutcomes || [],
        supportingData: idea.supportingData || [],
        counterArguments: idea.counterArguments || [],
        category: idea.category || 'equity',
        riskLevel: idea.riskLevel || 'moderate',
        targetAudience: idea.targetAudience || ['retail'],
        createdBy: 'orchestration-service'
      };

      const result = await this.investmentIdeaService.createInvestmentIdea(createRequest);
      ideas.push(result.idea);
    }

    return ideas;
  }

  /**
   * Get active request status
   */
  getActiveRequestStatus(requestId: string): IdeaGenerationRequest | undefined {
    return this.activeRequests.get(requestId);
  }

  /**
   * Cancel active request
   */
  cancelRequest(requestId: string): boolean {
    return this.activeRequests.delete(requestId);
  }

  /**
   * Get processing statistics
   */
  getProcessingStatistics(): {
    activeRequests: number;
    totalProcessed: number;
    averageProcessingTime: number;
  } {
    return {
      activeRequests: this.activeRequests.size,
      totalProcessed: 0, // Would be tracked in real implementation
      averageProcessingTime: 0 // Would be calculated from historical data
    };
  }

  /**
   * Convert TimeHorizon to the format expected by agents
   */
  private convertTimeHorizon(timeHorizon: TimeHorizon): 'short' | 'medium' | 'long' {
    switch (timeHorizon) {
      case 'intraday':
      case 'short':
        return 'short';
      case 'medium':
        return 'medium';
      case 'long':
      case 'very-long':
        return 'long';
      default:
        return 'medium';
    }
  }

  /**
   * Convert IdeaGenerationContext to ConversationContext
   */
  private convertToConversationContext(request: IdeaGenerationRequest): any {
    return {
      id: request.requestId,
      userId: request.userId,
      requestType: 'investment-idea-generation',
      parameters: request.parameters,
      messages: [],
      tasks: [],
      currentPhase: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: request.context || {}
    };
  }
}