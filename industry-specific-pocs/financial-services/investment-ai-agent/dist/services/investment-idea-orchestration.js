"use strict";
/**
 * Investment Idea Generation Orchestration Service
 *
 * This service orchestrates the multi-agent workflow for generating investment ideas,
 * implements filtering based on user preferences, and provides confidence scoring and ranking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentIdeaOrchestrationService = void 0;
class InvestmentIdeaOrchestrationService {
    constructor(supervisorAgent, planningAgent, researchAgent, analysisAgent, complianceAgent, synthesisAgent, investmentIdeaService, messageBus) {
        this.activeRequests = new Map();
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
    async generateInvestmentIdeas(request) {
        const startTime = new Date();
        this.activeRequests.set(request.requestId, request);
        try {
            // Initialize processing metadata
            const metadata = {
                totalIdeasGenerated: 0,
                totalIdeasFiltered: 0,
                filteringCriteria: [],
                confidenceDistribution: { high: 0, medium: 0, low: 0, average: 0 },
                processingSteps: []
            };
            const processingMetrics = {
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
            const filteredAndRankedIdeas = await this.filterAndRankIdeas(synthesisResult.ideas, request.parameters, metadata);
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
        }
        catch (error) {
            console.error('Error in investment idea generation:', error);
            throw new Error(`Investment idea generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            this.activeRequests.delete(request.requestId);
        }
    }
    /**
     * Execute planning phase
     */
    async executePlanningPhase(request, metadata) {
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
                    timeLimit: 300000,
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
        }
        catch (error) {
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
    async executeResearchPhase(request, planningResult, metadata) {
        const stepStart = new Date();
        try {
            // Create research requests based on planning
            const researchRequests = this.createResearchRequests(request.parameters, planningResult);
            // Execute research tasks in parallel
            const researchResults = await Promise.all(researchRequests.map(req => this.researchAgent.processResearchRequest(req)));
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
        }
        catch (error) {
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
    async executeAnalysisPhase(request, researchResult, metadata) {
        const stepStart = new Date();
        try {
            // Create analysis requests
            const analysisRequest = {
                investments: [],
                analysisType: 'comprehensive',
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
        }
        catch (error) {
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
    async executeCompliancePhase(request, analysisResult, metadata) {
        const stepStart = new Date();
        try {
            // Create compliance request
            const complianceRequest = {
                investments: analysisResult.results?.map((r) => r.investment).filter(Boolean) || [],
                requestType: 'compliance-check',
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
                filteredOpportunities: this.filterByCompliance(analysisResult.opportunityIdentification, complianceResult),
                analysisResults: analysisResult.results || [],
                researchFindings: analysisResult.researchFindings || []
            };
        }
        catch (error) {
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
    async executeSynthesisPhase(request, complianceResult, metadata) {
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
                outputFormat: 'detailed',
                includeVisualizations: true,
                context: this.convertToConversationContext(request)
            };
            // Execute synthesis
            const synthesisResult = await this.synthesisAgent.processSynthesisRequest(synthesisRequest);
            // Convert synthesis results to investment ideas
            const ideas = await this.convertToInvestmentIdeas(synthesisResult.investmentIdeas || [], request.userId, metadata);
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
        }
        catch (error) {
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
    async filterAndRankIdeas(ideas, parameters, metadata) {
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
    applyFilters(ideas, parameters, metadata) {
        let filteredIdeas = [...ideas];
        // Minimum confidence filter
        if (parameters.minimumConfidence !== undefined) {
            const beforeCount = filteredIdeas.length;
            filteredIdeas = filteredIdeas.filter(idea => idea.confidenceScore >= parameters.minimumConfidence);
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
            filteredIdeas = filteredIdeas.filter(idea => this.isCompatibleTimeHorizon(idea.timeHorizon, parameters.investmentHorizon));
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
            filteredIdeas = filteredIdeas.filter(idea => this.isCompatibleRiskLevel(idea.riskLevel, parameters.riskTolerance));
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
            filteredIdeas = filteredIdeas.filter(idea => this.matchesSectorCriteria(idea, parameters.sectors));
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
            filteredIdeas = filteredIdeas.filter(idea => this.matchesAssetClassCriteria(idea, parameters.assetClasses));
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
            filteredIdeas = filteredIdeas.filter(idea => !this.containsExcludedInvestments(idea, parameters.excludedInvestments));
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
            filteredIdeas = filteredIdeas.filter(idea => this.matchesTargetAudience(idea, parameters.targetAudience));
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
    calculateRankingScores(ideas, parameters) {
        return ideas.map(idea => {
            const rankingFactors = [];
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
            const rankedIdea = {
                ...idea,
                rank: 0,
                rankingScore,
                rankingFactors
            };
            return rankedIdea;
        });
    }
    // Helper methods for filtering and ranking
    isCompatibleTimeHorizon(ideaHorizon, userHorizon) {
        const horizonOrder = ['intraday', 'short', 'medium', 'long', 'very-long'];
        const ideaIndex = horizonOrder.indexOf(ideaHorizon);
        const userIndex = horizonOrder.indexOf(userHorizon);
        // Allow ideas within one level of user preference
        return Math.abs(ideaIndex - userIndex) <= 1;
    }
    isCompatibleRiskLevel(ideaRisk, userRisk) {
        const riskMapping = {
            'conservative': ['very-low', 'low'],
            'moderate': ['low', 'moderate', 'high'],
            'aggressive': ['moderate', 'high', 'very-high']
        };
        return riskMapping[userRisk].includes(ideaRisk);
    }
    matchesSectorCriteria(idea, sectors) {
        return idea.investments.some(investment => investment.sector && sectors.includes(investment.sector));
    }
    matchesAssetClassCriteria(idea, assetClasses) {
        return idea.investments.some(investment => assetClasses.includes(investment.type));
    }
    containsExcludedInvestments(idea, excludedInvestments) {
        return idea.investments.some(investment => excludedInvestments.includes(investment.name) ||
            (investment.ticker && excludedInvestments.includes(investment.ticker)));
    }
    matchesTargetAudience(idea, targetAudience) {
        return idea.targetAudience.some(audience => targetAudience.includes(audience));
    }
    calculateRiskReturnScore(idea, riskTolerance) {
        if (!riskTolerance)
            return 0.5;
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
    calculateTimeHorizonScore(ideaHorizon, userHorizon) {
        if (!userHorizon)
            return 0.5;
        const horizonOrder = ['intraday', 'short', 'medium', 'long', 'very-long'];
        const ideaIndex = horizonOrder.indexOf(ideaHorizon);
        const userIndex = horizonOrder.indexOf(userHorizon);
        const distance = Math.abs(ideaIndex - userIndex);
        return Math.max(0, 1 - distance * 0.25); // Decrease score by 25% for each level difference
    }
    calculateMarketTimingScore(idea) {
        // Simple market timing score based on market conditions at generation
        const marketConditions = idea.metadata.marketConditionsAtGeneration;
        let score = 0.5; // Base score
        // Adjust based on volatility and trend
        if (marketConditions.marketTrend === 'bull') {
            score += 0.2;
        }
        else if (marketConditions.marketTrend === 'bear') {
            score -= 0.1;
        }
        // Adjust based on geopolitical risk
        if (marketConditions.geopoliticalRisk === 'low') {
            score += 0.1;
        }
        else if (marketConditions.geopoliticalRisk === 'high') {
            score -= 0.2;
        }
        return Math.max(0, Math.min(1, score));
    }
    updateConfidenceDistribution(ideas, metadata) {
        let high = 0, medium = 0, low = 0, total = 0;
        ideas.forEach(idea => {
            if (idea.confidenceScore > 0.8)
                high++;
            else if (idea.confidenceScore >= 0.5)
                medium++;
            else
                low++;
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
    extractObjectives(parameters) {
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
    createResearchRequests(parameters, planningResult) {
        const requests = [];
        // Market research request
        requests.push({
            topic: `market trends ${parameters.investmentHorizon || 'medium'} term`,
            researchType: 'comprehensive',
            parameters: {
                depth: 'comprehensive',
                sources: ['financial-news', 'market-data', 'research-reports'],
                timeframe: 'recent',
                includeMarketData: true,
                maxResults: 50
            }
        });
        // Sector-specific research
        if (parameters.sectors && parameters.sectors.length > 0) {
            parameters.sectors.forEach(sector => {
                requests.push({
                    topic: `${sector} sector investment opportunities`,
                    researchType: 'web-search',
                    parameters: {
                        depth: 'standard',
                        sources: ['sector-reports', 'company-analysis'],
                        timeframe: 'past-month',
                        focusAreas: [sector],
                        maxResults: 30
                    }
                });
            });
        }
        return requests;
    }
    extractMarketInsights(researchResults) {
        // Extract market insights from research results
        return {
            trends: researchResults.flatMap(r => r.trends || []),
            opportunities: researchResults.flatMap(r => r.marketInsights || []),
            risks: researchResults.flatMap(r => r.keyFindings?.filter((f) => f.toLowerCase().includes('risk')) || [])
        };
    }
    extractTrendAnalysis(researchResults) {
        // Extract trend analysis from research results
        return {
            emergingTrends: researchResults.flatMap(r => r.trends || []),
            marketSentiment: researchResults.map(r => r.confidence).filter(Boolean),
            technicalIndicators: researchResults.flatMap(r => r.patterns || [])
        };
    }
    extractRiskAssessment(analysisResult) {
        return {
            marketRisks: analysisResult.riskAssessment?.riskFactors || [],
            specificRisks: analysisResult.riskAssessment?.specificRisks || [],
            riskMitigation: analysisResult.riskAssessment?.mitigationStrategies || []
        };
    }
    extractOpportunities(analysisResult) {
        return analysisResult.results?.map((r) => ({
            id: r.investment?.id || `opp-${Date.now()}`,
            title: r.investment?.name || 'Investment Opportunity',
            description: r.summary || 'Investment opportunity identified through analysis',
            expectedReturn: r.expectedReturn || 0.1,
            riskLevel: r.riskLevel || 'moderate',
            investment: r.investment
        })) || [];
    }
    filterByCompliance(opportunities, complianceResult) {
        const criticalIssues = complianceResult.complianceResults?.flatMap((cr) => cr.issues?.filter((issue) => issue.severity === 'critical') || []) || [];
        return opportunities.filter(opp => !criticalIssues.some((issue) => issue.description.toLowerCase().includes(opp.title.toLowerCase())));
    }
    async convertToInvestmentIdeas(investmentIdeas, userId, metadata) {
        const ideas = [];
        for (const idea of investmentIdeas) {
            const createRequest = {
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
    getActiveRequestStatus(requestId) {
        return this.activeRequests.get(requestId);
    }
    /**
     * Cancel active request
     */
    cancelRequest(requestId) {
        return this.activeRequests.delete(requestId);
    }
    /**
     * Get processing statistics
     */
    getProcessingStatistics() {
        return {
            activeRequests: this.activeRequests.size,
            totalProcessed: 0,
            averageProcessingTime: 0 // Would be calculated from historical data
        };
    }
    /**
     * Convert TimeHorizon to the format expected by agents
     */
    convertTimeHorizon(timeHorizon) {
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
    convertToConversationContext(request) {
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
exports.InvestmentIdeaOrchestrationService = InvestmentIdeaOrchestrationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2VydmljZXMvaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUFzSkgsTUFBYSxrQ0FBa0M7SUFXN0MsWUFDRSxlQUFnQyxFQUNoQyxhQUE0QixFQUM1QixhQUE0QixFQUM1QixhQUE0QixFQUM1QixlQUFnQyxFQUNoQyxjQUE4QixFQUM5QixxQkFBNEMsRUFDNUMsVUFBc0I7UUFWaEIsbUJBQWMsR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQVlyRSxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUN2QyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUN2QyxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztRQUNyQyxJQUFJLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7UUFDbkQsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLHVCQUF1QixDQUFDLE9BQThCO1FBQzFELE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFDN0IsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVwRCxJQUFJO1lBQ0YsaUNBQWlDO1lBQ2pDLE1BQU0sUUFBUSxHQUF1QjtnQkFDbkMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdEIsa0JBQWtCLEVBQUUsQ0FBQztnQkFDckIsaUJBQWlC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QUFDO0lBRUQ7O09BRUc7SUFDSCx1QkFBdUI7UUFLckIsT0FBTztZQUNMLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUk7WUFDeEMsY0FBYyxFQUFFLENBQUM7WUFDakIscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLDJDQUEyQztTQUNyRSxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssa0JBQWtCLENBQUMsV0FBd0I7UUFDakQsUUFBUSxXQUFXLEVBQUU7WUFDbkIsS0FBSyxVQUFVLENBQUM7WUFDaEIsS0FBSyxPQUFPO2dCQUNWLE9BQU8sT0FBTyxDQUFDO1lBQ2pCLEtBQUssUUFBUTtnQkFDWCxPQUFPLFFBQVEsQ0FBQztZQUNsQixLQUFLLE1BQU0sQ0FBQztZQUNaLEtBQUssV0FBVztnQkFDZCxPQUFPLE1BQU0sQ0FBQztZQUNoQjtnQkFDRSxPQUFPLFFBQVEsQ0FBQztTQUNuQjtJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLDRCQUE0QixDQUFDLE9BQThCO1FBQ2pFLE9BQU87WUFDTCxFQUFFLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDckIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNO1lBQ3RCLFdBQVcsRUFBRSw0QkFBNEI7WUFDekMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVO1lBQzlCLFFBQVEsRUFBRSxFQUFFO1lBQ1osS0FBSyxFQUFFLEVBQUU7WUFDVCxZQUFZLEVBQUUsWUFBWTtZQUMxQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFDckIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3JCLFFBQVEsRUFBRSxPQUFPLENBQUMsT0FBTyxJQUFJLEVBQUU7U0FDaEMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWg5QkQsZ0ZBZzlCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW52ZXN0bWVudCBJZGVhIEdlbmVyYXRpb24gT3JjaGVzdHJhdGlvbiBTZXJ2aWNlXG4gKiBcbiAqIFRoaXMgc2VydmljZSBvcmNoZXN0cmF0ZXMgdGhlIG11bHRpLWFnZW50IHdvcmtmbG93IGZvciBnZW5lcmF0aW5nIGludmVzdG1lbnQgaWRlYXMsXG4gKiBpbXBsZW1lbnRzIGZpbHRlcmluZyBiYXNlZCBvbiB1c2VyIHByZWZlcmVuY2VzLCBhbmQgcHJvdmlkZXMgY29uZmlkZW5jZSBzY29yaW5nIGFuZCByYW5raW5nLlxuICovXG5cbmltcG9ydCB7XG4gIEludmVzdG1lbnRJZGVhLFxuICBDcmVhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QsXG4gIEludmVzdG1lbnRTdHJhdGVneSxcbiAgVGltZUhvcml6b24sXG4gIEludmVzdG1lbnRDYXRlZ29yeSxcbiAgUmlza0xldmVsLFxuICBUYXJnZXRBdWRpZW5jZSxcbiAgT3V0Y29tZVxufSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcbmltcG9ydCB7IFJlcXVlc3RQYXJhbWV0ZXJzLCBVc2VyUmVxdWVzdCB9IGZyb20gJy4uL21vZGVscy9yZXF1ZXN0JztcbmltcG9ydCB7IFN1cGVydmlzb3JBZ2VudCB9IGZyb20gJy4vYWkvc3VwZXJ2aXNvci1hZ2VudCc7XG5pbXBvcnQgeyBQbGFubmluZ0FnZW50IH0gZnJvbSAnLi9haS9wbGFubmluZy1hZ2VudCc7XG5pbXBvcnQgeyBSZXNlYXJjaEFnZW50IH0gZnJvbSAnLi9haS9yZXNlYXJjaC1hZ2VudCc7XG5pbXBvcnQgeyBBbmFseXNpc0FnZW50IH0gZnJvbSAnLi9haS9hbmFseXNpcy1hZ2VudCc7XG5pbXBvcnQgeyBDb21wbGlhbmNlQWdlbnQgfSBmcm9tICcuL2FpL2NvbXBsaWFuY2UtYWdlbnQnO1xuaW1wb3J0IHsgU3ludGhlc2lzQWdlbnQgfSBmcm9tICcuL2FpL3N5bnRoZXNpcy1hZ2VudCc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYVNlcnZpY2UgfSBmcm9tICcuL2ludmVzdG1lbnQtaWRlYS1zZXJ2aWNlJztcbmltcG9ydCB7IE1lc3NhZ2VCdXMgfSBmcm9tICcuL2NvbW11bmljYXRpb24vbWVzc2FnZS1idXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIElkZWFHZW5lcmF0aW9uUmVxdWVzdCB7XG4gIHVzZXJJZDogc3RyaW5nO1xuICByZXF1ZXN0SWQ6IHN0cmluZztcbiAgcGFyYW1ldGVyczogSWRlYUdlbmVyYXRpb25QYXJhbWV0ZXJzO1xuICBjb250ZXh0PzogSWRlYUdlbmVyYXRpb25Db250ZXh0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElkZWFHZW5lcmF0aW9uUGFyYW1ldGVycyB7XG4gIGludmVzdG1lbnRIb3Jpem9uOiBUaW1lSG9yaXpvbjtcbiAgcmlza1RvbGVyYW5jZTogJ2NvbnNlcnZhdGl2ZScgfCAnbW9kZXJhdGUnIHwgJ2FnZ3Jlc3NpdmUnO1xuICBzZWN0b3JzPzogc3RyaW5nW107XG4gIGFzc2V0Q2xhc3Nlcz86IHN0cmluZ1tdO1xuICBleGNsdWRlZEludmVzdG1lbnRzPzogc3RyaW5nW107XG4gIG1pbmltdW1Db25maWRlbmNlPzogbnVtYmVyO1xuICBtYXhpbXVtSWRlYXM/OiBudW1iZXI7XG4gIHNwZWNpZmljSW52ZXN0bWVudHM/OiBzdHJpbmdbXTtcbiAgbWFya2V0Q29uZGl0aW9ucz86IHN0cmluZ1tdO1xuICB0aGVtYXRpY0ZvY3VzPzogc3RyaW5nW107XG4gIGdlb2dyYXBoaWNGb2N1cz86IHN0cmluZ1tdO1xuICB0YXJnZXRBdWRpZW5jZT86IFRhcmdldEF1ZGllbmNlW107XG4gIGN1c3RvbUZpbHRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElkZWFHZW5lcmF0aW9uQ29udGV4dCB7XG4gIHVzZXJQcm9maWxlPzogVXNlclByb2ZpbGU7XG4gIG1hcmtldENvbnRleHQ/OiBNYXJrZXRDb250ZXh0O1xuICBwb3J0Zm9saW9Db250ZXh0PzogUG9ydGZvbGlvQ29udGV4dDtcbiAgY29tcGxpYW5jZUNvbnRleHQ/OiBDb21wbGlhbmNlQ29udGV4dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBVc2VyUHJvZmlsZSB7XG4gIGludmVzdG1lbnRFeHBlcmllbmNlOiAnYmVnaW5uZXInIHwgJ2ludGVybWVkaWF0ZScgfCAnYWR2YW5jZWQnIHwgJ3Byb2Zlc3Npb25hbCc7XG4gIHByZWZlcnJlZFN0cmF0ZWdpZXM6IEludmVzdG1lbnRTdHJhdGVneVtdO1xuICBoaXN0b3JpY2FsUHJlZmVyZW5jZXM6IHN0cmluZ1tdO1xuICByaXNrUHJvZmlsZTogUmlza1Byb2ZpbGU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmlza1Byb2ZpbGUge1xuICByaXNrQ2FwYWNpdHk6IG51bWJlcjsgLy8gMC0xMDBcbiAgcmlza1RvbGVyYW5jZTogbnVtYmVyOyAvLyAwLTEwMFxuICB0aW1lSG9yaXpvbjogVGltZUhvcml6b247XG4gIGxpcXVpZGl0eU5lZWRzOiAnaGlnaCcgfCAnbWVkaXVtJyB8ICdsb3cnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hcmtldENvbnRleHQge1xuICBjdXJyZW50Q29uZGl0aW9uczogc3RyaW5nW107XG4gIHZvbGF0aWxpdHlMZXZlbDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAgbWFya2V0VHJlbmQ6ICdidWxsJyB8ICdiZWFyJyB8ICdzaWRld2F5cyc7XG4gIGVjb25vbWljSW5kaWNhdG9yczogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgZ2VvcG9saXRpY2FsUmlzazogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQb3J0Zm9saW9Db250ZXh0IHtcbiAgY3VycmVudEhvbGRpbmdzPzogc3RyaW5nW107XG4gIGFzc2V0QWxsb2NhdGlvbj86IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIGNvbmNlbnRyYXRpb25SaXNrcz86IHN0cmluZ1tdO1xuICByZWJhbGFuY2luZ05lZWRzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGxpYW5jZUNvbnRleHQge1xuICBhcHBsaWNhYmxlUmVndWxhdGlvbnM6IHN0cmluZ1tdO1xuICByZXN0cmljdGVkSW52ZXN0bWVudHM6IHN0cmluZ1tdO1xuICBtYW5kYXRvcnlDaGVja3M6IHN0cmluZ1tdO1xuICBvcmdhbml6YXRpb25Qb2xpY2llcz86IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSWRlYUdlbmVyYXRpb25SZXN1bHQge1xuICByZXF1ZXN0SWQ6IHN0cmluZztcbiAgaWRlYXM6IFJhbmtlZEludmVzdG1lbnRJZGVhW107XG4gIG1ldGFkYXRhOiBHZW5lcmF0aW9uTWV0YWRhdGE7XG4gIHByb2Nlc3NpbmdNZXRyaWNzOiBQcm9jZXNzaW5nTWV0cmljcztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSYW5rZWRJbnZlc3RtZW50SWRlYSBleHRlbmRzIEludmVzdG1lbnRJZGVhIHtcbiAgcmFuazogbnVtYmVyO1xuICByYW5raW5nU2NvcmU6IG51bWJlcjtcbiAgcmFua2luZ0ZhY3RvcnM6IFJhbmtpbmdGYWN0b3JbXTtcbiAgZmlsdGVyZWRSZWFzb25zPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmFua2luZ0ZhY3RvciB7XG4gIGZhY3Rvcjogc3RyaW5nO1xuICB3ZWlnaHQ6IG51bWJlcjtcbiAgc2NvcmU6IG51bWJlcjtcbiAgY29udHJpYnV0aW9uOiBudW1iZXI7XG4gIGV4cGxhbmF0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJhdGlvbk1ldGFkYXRhIHtcbiAgdG90YWxJZGVhc0dlbmVyYXRlZDogbnVtYmVyO1xuICB0b3RhbElkZWFzRmlsdGVyZWQ6IG51bWJlcjtcbiAgZmlsdGVyaW5nQ3JpdGVyaWE6IEZpbHRlckNyaXRlcmlhW107XG4gIGNvbmZpZGVuY2VEaXN0cmlidXRpb246IENvbmZpZGVuY2VEaXN0cmlidXRpb247XG4gIHByb2Nlc3NpbmdTdGVwczogUHJvY2Vzc2luZ1N0ZXBbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGaWx0ZXJDcml0ZXJpYSB7XG4gIGNyaXRlcmlvbjogc3RyaW5nO1xuICB0eXBlOiAnaW5jbHVzaW9uJyB8ICdleGNsdXNpb24nO1xuICB2YWx1ZTogYW55O1xuICBhcHBsaWVkQ291bnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25maWRlbmNlRGlzdHJpYnV0aW9uIHtcbiAgaGlnaDogbnVtYmVyOyAvLyA+IDAuOFxuICBtZWRpdW06IG51bWJlcjsgLy8gMC41IC0gMC44XG4gIGxvdzogbnVtYmVyOyAvLyA8IDAuNVxuICBhdmVyYWdlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvY2Vzc2luZ1N0ZXAge1xuICBzdGVwOiBzdHJpbmc7XG4gIGFnZW50OiBzdHJpbmc7XG4gIHN0YXJ0VGltZTogRGF0ZTtcbiAgZW5kVGltZTogRGF0ZTtcbiAgZHVyYXRpb246IG51bWJlcjtcbiAgc3RhdHVzOiAnY29tcGxldGVkJyB8ICdmYWlsZWQnIHwgJ3NraXBwZWQnO1xuICBvdXRwdXQ/OiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvY2Vzc2luZ01ldHJpY3Mge1xuICB0b3RhbFByb2Nlc3NpbmdUaW1lOiBudW1iZXI7XG4gIGFnZW50UHJvY2Vzc2luZ1RpbWVzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICBkYXRhU291cmNlc0FjY2Vzc2VkOiBzdHJpbmdbXTtcbiAgbW9kZWxzVXNlZDogc3RyaW5nW107XG4gIHJlc291cmNlVXRpbGl6YXRpb246IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlIHtcbiAgcHJpdmF0ZSBzdXBlcnZpc29yQWdlbnQ6IFN1cGVydmlzb3JBZ2VudDtcbiAgcHJpdmF0ZSBwbGFubmluZ0FnZW50OiBQbGFubmluZ0FnZW50O1xuICBwcml2YXRlIHJlc2VhcmNoQWdlbnQ6IFJlc2VhcmNoQWdlbnQ7XG4gIHByaXZhdGUgYW5hbHlzaXNBZ2VudDogQW5hbHlzaXNBZ2VudDtcbiAgcHJpdmF0ZSBjb21wbGlhbmNlQWdlbnQ6IENvbXBsaWFuY2VBZ2VudDtcbiAgcHJpdmF0ZSBzeW50aGVzaXNBZ2VudDogU3ludGhlc2lzQWdlbnQ7XG4gIHByaXZhdGUgaW52ZXN0bWVudElkZWFTZXJ2aWNlOiBJbnZlc3RtZW50SWRlYVNlcnZpY2U7XG4gIHByaXZhdGUgbWVzc2FnZUJ1czogTWVzc2FnZUJ1cztcbiAgcHJpdmF0ZSBhY3RpdmVSZXF1ZXN0czogTWFwPHN0cmluZywgSWRlYUdlbmVyYXRpb25SZXF1ZXN0PiA9IG5ldyBNYXAoKTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzdXBlcnZpc29yQWdlbnQ6IFN1cGVydmlzb3JBZ2VudCxcbiAgICBwbGFubmluZ0FnZW50OiBQbGFubmluZ0FnZW50LFxuICAgIHJlc2VhcmNoQWdlbnQ6IFJlc2VhcmNoQWdlbnQsXG4gICAgYW5hbHlzaXNBZ2VudDogQW5hbHlzaXNBZ2VudCxcbiAgICBjb21wbGlhbmNlQWdlbnQ6IENvbXBsaWFuY2VBZ2VudCxcbiAgICBzeW50aGVzaXNBZ2VudDogU3ludGhlc2lzQWdlbnQsXG4gICAgaW52ZXN0bWVudElkZWFTZXJ2aWNlOiBJbnZlc3RtZW50SWRlYVNlcnZpY2UsXG4gICAgbWVzc2FnZUJ1czogTWVzc2FnZUJ1c1xuICApIHtcbiAgICB0aGlzLnN1cGVydmlzb3JBZ2VudCA9IHN1cGVydmlzb3JBZ2VudDtcbiAgICB0aGlzLnBsYW5uaW5nQWdlbnQgPSBwbGFubmluZ0FnZW50O1xuICAgIHRoaXMucmVzZWFyY2hBZ2VudCA9IHJlc2VhcmNoQWdlbnQ7XG4gICAgdGhpcy5hbmFseXNpc0FnZW50ID0gYW5hbHlzaXNBZ2VudDtcbiAgICB0aGlzLmNvbXBsaWFuY2VBZ2VudCA9IGNvbXBsaWFuY2VBZ2VudDtcbiAgICB0aGlzLnN5bnRoZXNpc0FnZW50ID0gc3ludGhlc2lzQWdlbnQ7XG4gICAgdGhpcy5pbnZlc3RtZW50SWRlYVNlcnZpY2UgPSBpbnZlc3RtZW50SWRlYVNlcnZpY2U7XG4gICAgdGhpcy5tZXNzYWdlQnVzID0gbWVzc2FnZUJ1cztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBpbnZlc3RtZW50IGlkZWFzIGJhc2VkIG9uIHVzZXIgcGFyYW1ldGVyc1xuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMocmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTxJZGVhR2VuZXJhdGlvblJlc3VsdD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy5hY3RpdmVSZXF1ZXN0cy5zZXQocmVxdWVzdC5yZXF1ZXN0SWQsIHJlcXVlc3QpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIEluaXRpYWxpemUgcHJvY2Vzc2luZyBtZXRhZGF0YVxuICAgICAgY29uc3QgbWV0YWRhdGE6IEdlbmVyYXRpb25NZXRhZGF0YSA9IHtcbiAgICAgICAgdG90YWxJZGVhc0dlbmVyYXRlZDogMCxcbiAgICAgICAgdG90YWxJZGVhc0ZpbHRlcmVkOiAwLFxuICAgICAgICBmaWx0ZXJpbmdDcml0ZXJpYTogW10sXG4gICAgICAgIGNvbmZpZGVuY2VEaXN0cmlidXRpb246IHsgaGlnaDogMCwgbWVkaXVtOiAwLCBsb3c6IDAsIGF2ZXJhZ2U6IDAgfSxcbiAgICAgICAgcHJvY2Vzc2luZ1N0ZXBzOiBbXVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcHJvY2Vzc2luZ01ldHJpY3M6IFByb2Nlc3NpbmdNZXRyaWNzID0ge1xuICAgICAgICB0b3RhbFByb2Nlc3NpbmdUaW1lOiAwLFxuICAgICAgICBhZ2VudFByb2Nlc3NpbmdUaW1lczoge30sXG4gICAgICAgIGRhdGFTb3VyY2VzQWNjZXNzZWQ6IFtdLFxuICAgICAgICBtb2RlbHNVc2VkOiBbXSxcbiAgICAgICAgcmVzb3VyY2VVdGlsaXphdGlvbjoge31cbiAgICAgIH07XG5cbiAgICAgIC8vIFN0ZXAgMTogUGxhbm5pbmcgUGhhc2VcbiAgICAgIGNvbnN0IHBsYW5uaW5nUmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlUGxhbm5pbmdQaGFzZShyZXF1ZXN0LCBtZXRhZGF0YSk7XG4gICAgICBcbiAgICAgIC8vIFN0ZXAgMjogUmVzZWFyY2ggUGhhc2VcbiAgICAgIGNvbnN0IHJlc2VhcmNoUmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlUmVzZWFyY2hQaGFzZShyZXF1ZXN0LCBwbGFubmluZ1Jlc3VsdCwgbWV0YWRhdGEpO1xuICAgICAgXG4gICAgICAvLyBTdGVwIDM6IEFuYWx5c2lzIFBoYXNlXG4gICAgICBjb25zdCBhbmFseXNpc1Jlc3VsdCA9IGF3YWl0IHRoaXMuZXhlY3V0ZUFuYWx5c2lzUGhhc2UocmVxdWVzdCwgcmVzZWFyY2hSZXN1bHQsIG1ldGFkYXRhKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCA0OiBDb21wbGlhbmNlIFBoYXNlXG4gICAgICBjb25zdCBjb21wbGlhbmNlUmVzdWx0ID0gYXdhaXQgdGhpcy5leGVjdXRlQ29tcGxpYW5jZVBoYXNlKHJlcXVlc3QsIGFuYWx5c2lzUmVzdWx0LCBtZXRhZGF0YSk7XG4gICAgICBcbiAgICAgIC8vIFN0ZXAgNTogU3ludGhlc2lzIFBoYXNlXG4gICAgICBjb25zdCBzeW50aGVzaXNSZXN1bHQgPSBhd2FpdCB0aGlzLmV4ZWN1dGVTeW50aGVzaXNQaGFzZShyZXF1ZXN0LCBjb21wbGlhbmNlUmVzdWx0LCBtZXRhZGF0YSk7XG4gICAgICBcbiAgICAgIC8vIFN0ZXAgNjogRmlsdGVyaW5nIGFuZCBSYW5raW5nXG4gICAgICBjb25zdCBmaWx0ZXJlZEFuZFJhbmtlZElkZWFzID0gYXdhaXQgdGhpcy5maWx0ZXJBbmRSYW5rSWRlYXMoXG4gICAgICAgIHN5bnRoZXNpc1Jlc3VsdC5pZGVhcyxcbiAgICAgICAgcmVxdWVzdC5wYXJhbWV0ZXJzLFxuICAgICAgICBtZXRhZGF0YVxuICAgICAgKTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGZpbmFsIG1ldHJpY3NcbiAgICAgIGNvbnN0IGVuZFRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgICAgcHJvY2Vzc2luZ01ldHJpY3MudG90YWxQcm9jZXNzaW5nVGltZSA9IGVuZFRpbWUuZ2V0VGltZSgpIC0gc3RhcnRUaW1lLmdldFRpbWUoKTtcbiAgICAgIFxuICAgICAgLy8gVXBkYXRlIGNvbmZpZGVuY2UgZGlzdHJpYnV0aW9uXG4gICAgICB0aGlzLnVwZGF0ZUNvbmZpZGVuY2VEaXN0cmlidXRpb24oZmlsdGVyZWRBbmRSYW5rZWRJZGVhcywgbWV0YWRhdGEpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXF1ZXN0SWQ6IHJlcXVlc3QucmVxdWVzdElkLFxuICAgICAgICBpZGVhczogZmlsdGVyZWRBbmRSYW5rZWRJZGVhcyxcbiAgICAgICAgbWV0YWRhdGEsXG4gICAgICAgIHByb2Nlc3NpbmdNZXRyaWNzXG4gICAgICB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uOicsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52ZXN0bWVudCBpZGVhIGdlbmVyYXRpb24gZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLmFjdGl2ZVJlcXVlc3RzLmRlbGV0ZShyZXF1ZXN0LnJlcXVlc3RJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgcGxhbm5pbmcgcGhhc2VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVBsYW5uaW5nUGhhc2UoXG4gICAgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0LFxuICAgIG1ldGFkYXRhOiBHZW5lcmF0aW9uTWV0YWRhdGFcbiAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBzdGVwU3RhcnQgPSBuZXcgRGF0ZSgpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENyZWF0ZSBwbGFubmluZyBjb250ZXh0XG4gICAgICBjb25zdCBwbGFubmluZ0NvbnRleHQgPSB7XG4gICAgICAgIHJlcXVlc3RUeXBlOiAnaW52ZXN0bWVudC1pZGVhLWdlbmVyYXRpb24nLFxuICAgICAgICB1c2VySWQ6IHJlcXVlc3QudXNlcklkLFxuICAgICAgICBwYXJhbWV0ZXJzOiByZXF1ZXN0LnBhcmFtZXRlcnMsXG4gICAgICAgIGNvbnRleHQ6IHJlcXVlc3QuY29udGV4dCxcbiAgICAgICAgb2JqZWN0aXZlczogdGhpcy5leHRyYWN0T2JqZWN0aXZlcyhyZXF1ZXN0LnBhcmFtZXRlcnMpLFxuICAgICAgICB1c2VyUHJlZmVyZW5jZXM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogdGhpcy5jb252ZXJ0VGltZUhvcml6b24ocmVxdWVzdC5wYXJhbWV0ZXJzLmludmVzdG1lbnRIb3Jpem9uKSxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiByZXF1ZXN0LnBhcmFtZXRlcnMucmlza1RvbGVyYW5jZSxcbiAgICAgICAgICBwcmVmZXJyZWRTZWN0b3JzOiByZXF1ZXN0LnBhcmFtZXRlcnMuc2VjdG9ycyxcbiAgICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiByZXF1ZXN0LnBhcmFtZXRlcnMuZXhjbHVkZWRJbnZlc3RtZW50c1xuICAgICAgICB9LFxuICAgICAgICBjb25zdHJhaW50czoge1xuICAgICAgICAgIHRpbWVMaW1pdDogMzAwMDAwLCAvLyA1IG1pbnV0ZXNcbiAgICAgICAgICBkYXRhU291cmNlUmVzdHJpY3Rpb25zOiByZXF1ZXN0LnBhcmFtZXRlcnMuZXhjbHVkZWRJbnZlc3RtZW50cyxcbiAgICAgICAgICBjb21wbGlhbmNlUmVxdWlyZW1lbnRzOiBbJ1NFQycsICdGSU5SQSddXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIC8vIEV4ZWN1dGUgcGxhbm5pbmdcbiAgICAgIGNvbnN0IHBsYW5uaW5nUmVzdWx0ID0gYXdhaXQgdGhpcy5wbGFubmluZ0FnZW50LmNyZWF0ZVJlc2VhcmNoUGxhbihyZXF1ZXN0LnJlcXVlc3RJZCwgcGxhbm5pbmdDb250ZXh0KTtcblxuICAgICAgY29uc3Qgc3RlcEVuZCA9IG5ldyBEYXRlKCk7XG4gICAgICBtZXRhZGF0YS5wcm9jZXNzaW5nU3RlcHMucHVzaCh7XG4gICAgICAgIHN0ZXA6ICdwbGFubmluZycsXG4gICAgICAgIGFnZW50OiAncGxhbm5pbmctYWdlbnQnLFxuICAgICAgICBzdGFydFRpbWU6IHN0ZXBTdGFydCxcbiAgICAgICAgZW5kVGltZTogc3RlcEVuZCxcbiAgICAgICAgZHVyYXRpb246IHN0ZXBFbmQuZ2V0VGltZSgpIC0gc3RlcFN0YXJ0LmdldFRpbWUoKSxcbiAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcbiAgICAgICAgb3V0cHV0OiBwbGFubmluZ1Jlc3VsdFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBwbGFubmluZ1Jlc3VsdDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3Qgc3RlcEVuZCA9IG5ldyBEYXRlKCk7XG4gICAgICBtZXRhZGF0YS5wcm9jZXNzaW5nU3RlcHMucHVzaCh7XG4gICAgICAgIHN0ZXA6ICdwbGFubmluZycsXG4gICAgICAgIGFnZW50OiAncGxhbm5pbmctYWdlbnQnLFxuICAgICAgICBzdGFydFRpbWU6IHN0ZXBTdGFydCxcbiAgICAgICAgZW5kVGltZTogc3RlcEVuZCxcbiAgICAgICAgZHVyYXRpb246IHN0ZXBFbmQuZ2V0VGltZSgpIC0gc3RlcFN0YXJ0LmdldFRpbWUoKSxcbiAgICAgICAgc3RhdHVzOiAnZmFpbGVkJ1xuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSByZXNlYXJjaCBwaGFzZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBleGVjdXRlUmVzZWFyY2hQaGFzZShcbiAgICByZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QsXG4gICAgcGxhbm5pbmdSZXN1bHQ6IGFueSxcbiAgICBtZXRhZGF0YTogR2VuZXJhdGlvbk1ldGFkYXRhXG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3Qgc3RlcFN0YXJ0ID0gbmV3IERhdGUoKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDcmVhdGUgcmVzZWFyY2ggcmVxdWVzdHMgYmFzZWQgb24gcGxhbm5pbmdcbiAgICAgIGNvbnN0IHJlc2VhcmNoUmVxdWVzdHMgPSB0aGlzLmNyZWF0ZVJlc2VhcmNoUmVxdWVzdHMocmVxdWVzdC5wYXJhbWV0ZXJzLCBwbGFubmluZ1Jlc3VsdCk7XG5cbiAgICAgIC8vIEV4ZWN1dGUgcmVzZWFyY2ggdGFza3MgaW4gcGFyYWxsZWxcbiAgICAgIGNvbnN0IHJlc2VhcmNoUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICByZXNlYXJjaFJlcXVlc3RzLm1hcChyZXEgPT4gdGhpcy5yZXNlYXJjaEFnZW50LnByb2Nlc3NSZXNlYXJjaFJlcXVlc3QocmVxKSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHN0ZXBFbmQgPSBuZXcgRGF0ZSgpO1xuICAgICAgbWV0YWRhdGEucHJvY2Vzc2luZ1N0ZXBzLnB1c2goe1xuICAgICAgICBzdGVwOiAncmVzZWFyY2gnLFxuICAgICAgICBhZ2VudDogJ3Jlc2VhcmNoLWFnZW50JyxcbiAgICAgICAgc3RhcnRUaW1lOiBzdGVwU3RhcnQsXG4gICAgICAgIGVuZFRpbWU6IHN0ZXBFbmQsXG4gICAgICAgIGR1cmF0aW9uOiBzdGVwRW5kLmdldFRpbWUoKSAtIHN0ZXBTdGFydC5nZXRUaW1lKCksXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgIG91dHB1dDogcmVzZWFyY2hSZXN1bHRzXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzZWFyY2hEYXRhOiByZXNlYXJjaFJlc3VsdHMsXG4gICAgICAgIG1hcmtldEluc2lnaHRzOiB0aGlzLmV4dHJhY3RNYXJrZXRJbnNpZ2h0cyhyZXNlYXJjaFJlc3VsdHMpLFxuICAgICAgICB0cmVuZEFuYWx5c2lzOiB0aGlzLmV4dHJhY3RUcmVuZEFuYWx5c2lzKHJlc2VhcmNoUmVzdWx0cylcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IHN0ZXBFbmQgPSBuZXcgRGF0ZSgpO1xuICAgICAgbWV0YWRhdGEucHJvY2Vzc2luZ1N0ZXBzLnB1c2goe1xuICAgICAgICBzdGVwOiAncmVzZWFyY2gnLFxuICAgICAgICBhZ2VudDogJ3Jlc2VhcmNoLWFnZW50JyxcbiAgICAgICAgc3RhcnRUaW1lOiBzdGVwU3RhcnQsXG4gICAgICAgIGVuZFRpbWU6IHN0ZXBFbmQsXG4gICAgICAgIGR1cmF0aW9uOiBzdGVwRW5kLmdldFRpbWUoKSAtIHN0ZXBTdGFydC5nZXRUaW1lKCksXG4gICAgICAgIHN0YXR1czogJ2ZhaWxlZCdcbiAgICAgIH0pO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4ZWN1dGUgYW5hbHlzaXMgcGhhc2VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUFuYWx5c2lzUGhhc2UoXG4gICAgcmVxdWVzdDogSWRlYUdlbmVyYXRpb25SZXF1ZXN0LFxuICAgIHJlc2VhcmNoUmVzdWx0OiBhbnksXG4gICAgbWV0YWRhdGE6IEdlbmVyYXRpb25NZXRhZGF0YVxuICApOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHN0ZXBTdGFydCA9IG5ldyBEYXRlKCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ3JlYXRlIGFuYWx5c2lzIHJlcXVlc3RzXG4gICAgICBjb25zdCBhbmFseXNpc1JlcXVlc3QgPSB7XG4gICAgICAgIGludmVzdG1lbnRzOiBbXSwgLy8gV2lsbCBiZSBwb3B1bGF0ZWQgZnJvbSByZXNlYXJjaCByZXN1bHRzXG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2NvbXByZWhlbnNpdmUnIGFzIGNvbnN0LFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgdGltZUhvcml6b246IHRoaXMuY29udmVydFRpbWVIb3Jpem9uKHJlcXVlc3QucGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbiksXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogcmVxdWVzdC5wYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UsXG4gICAgICAgICAgaW5jbHVkZVN0cmVzc1Rlc3Rpbmc6IHRydWUsXG4gICAgICAgICAgY29uZmlkZW5jZUxldmVsOiAwLjk1XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRleHQ6IHRoaXMuY29udmVydFRvQ29udmVyc2F0aW9uQ29udGV4dChyZXF1ZXN0KVxuICAgICAgfTtcblxuICAgICAgLy8gRXhlY3V0ZSBmaW5hbmNpYWwgYW5hbHlzaXNcbiAgICAgIGNvbnN0IGFuYWx5c2lzUmVzdWx0ID0gYXdhaXQgdGhpcy5hbmFseXNpc0FnZW50LnByb2Nlc3NBbmFseXNpc1JlcXVlc3QoYW5hbHlzaXNSZXF1ZXN0KTtcblxuICAgICAgLy8gU2NlbmFyaW9zIGFyZSBpbmNsdWRlZCBpbiB0aGUgYW5hbHlzaXMgcmVzdWx0XG4gICAgICBjb25zdCBzY2VuYXJpb3MgPSBhbmFseXNpc1Jlc3VsdC5zY2VuYXJpb0FuYWx5c2lzIHx8IG51bGw7XG5cbiAgICAgIGNvbnN0IHN0ZXBFbmQgPSBuZXcgRGF0ZSgpO1xuICAgICAgbWV0YWRhdGEucHJvY2Vzc2luZ1N0ZXBzLnB1c2goe1xuICAgICAgICBzdGVwOiAnYW5hbHlzaXMnLFxuICAgICAgICBhZ2VudDogJ2FuYWx5c2lzLWFnZW50JyxcbiAgICAgICAgc3RhcnRUaW1lOiBzdGVwU3RhcnQsXG4gICAgICAgIGVuZFRpbWU6IHN0ZXBFbmQsXG4gICAgICAgIGR1cmF0aW9uOiBzdGVwRW5kLmdldFRpbWUoKSAtIHN0ZXBTdGFydC5nZXRUaW1lKCksXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgIG91dHB1dDogeyBhbmFseXNpc1Jlc3VsdCwgc2NlbmFyaW9zIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBhbmFseXNpc1Jlc3VsdCxcbiAgICAgICAgc2NlbmFyaW9zLFxuICAgICAgICByaXNrQXNzZXNzbWVudDogdGhpcy5leHRyYWN0Umlza0Fzc2Vzc21lbnQoYW5hbHlzaXNSZXN1bHQpLFxuICAgICAgICBvcHBvcnR1bml0eUlkZW50aWZpY2F0aW9uOiB0aGlzLmV4dHJhY3RPcHBvcnR1bml0aWVzKGFuYWx5c2lzUmVzdWx0KSxcbiAgICAgICAgcmVzZWFyY2hGaW5kaW5nczogcmVzZWFyY2hSZXN1bHQucmVzZWFyY2hEYXRhIHx8IFtdXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBzdGVwRW5kID0gbmV3IERhdGUoKTtcbiAgICAgIG1ldGFkYXRhLnByb2Nlc3NpbmdTdGVwcy5wdXNoKHtcbiAgICAgICAgc3RlcDogJ2FuYWx5c2lzJyxcbiAgICAgICAgYWdlbnQ6ICdhbmFseXNpcy1hZ2VudCcsXG4gICAgICAgIHN0YXJ0VGltZTogc3RlcFN0YXJ0LFxuICAgICAgICBlbmRUaW1lOiBzdGVwRW5kLFxuICAgICAgICBkdXJhdGlvbjogc3RlcEVuZC5nZXRUaW1lKCkgLSBzdGVwU3RhcnQuZ2V0VGltZSgpLFxuICAgICAgICBzdGF0dXM6ICdmYWlsZWQnXG4gICAgICB9KTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGNvbXBsaWFuY2UgcGhhc2VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZUNvbXBsaWFuY2VQaGFzZShcbiAgICByZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QsXG4gICAgYW5hbHlzaXNSZXN1bHQ6IGFueSxcbiAgICBtZXRhZGF0YTogR2VuZXJhdGlvbk1ldGFkYXRhXG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgY29uc3Qgc3RlcFN0YXJ0ID0gbmV3IERhdGUoKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBDcmVhdGUgY29tcGxpYW5jZSByZXF1ZXN0XG4gICAgICBjb25zdCBjb21wbGlhbmNlUmVxdWVzdCA9IHtcbiAgICAgICAgaW52ZXN0bWVudHM6IGFuYWx5c2lzUmVzdWx0LnJlc3VsdHM/Lm1hcCgocjogYW55KSA9PiByLmludmVzdG1lbnQpLmZpbHRlcihCb29sZWFuKSB8fCBbXSxcbiAgICAgICAgcmVxdWVzdFR5cGU6ICdjb21wbGlhbmNlLWNoZWNrJyBhcyBjb25zdCxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGp1cmlzZGljdGlvbnM6IFsnVVMnLCAnU0VDJ10sXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogcmVxdWVzdC5wYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UsXG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246IHRoaXMuY29udmVydFRpbWVIb3Jpem9uKHJlcXVlc3QucGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbiksXG4gICAgICAgICAgaW5jbHVkZUVTRzogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0OiB0aGlzLmNvbnZlcnRUb0NvbnZlcnNhdGlvbkNvbnRleHQocmVxdWVzdClcbiAgICAgIH07XG5cbiAgICAgIC8vIEV4ZWN1dGUgY29tcGxpYW5jZSBjaGVja3NcbiAgICAgIGNvbnN0IGNvbXBsaWFuY2VSZXN1bHQgPSBhd2FpdCB0aGlzLmNvbXBsaWFuY2VBZ2VudC5wcm9jZXNzQ29tcGxpYW5jZVJlcXVlc3QoY29tcGxpYW5jZVJlcXVlc3QpO1xuXG4gICAgICBjb25zdCBzdGVwRW5kID0gbmV3IERhdGUoKTtcbiAgICAgIG1ldGFkYXRhLnByb2Nlc3NpbmdTdGVwcy5wdXNoKHtcbiAgICAgICAgc3RlcDogJ2NvbXBsaWFuY2UnLFxuICAgICAgICBhZ2VudDogJ2NvbXBsaWFuY2UtYWdlbnQnLFxuICAgICAgICBzdGFydFRpbWU6IHN0ZXBTdGFydCxcbiAgICAgICAgZW5kVGltZTogc3RlcEVuZCxcbiAgICAgICAgZHVyYXRpb246IHN0ZXBFbmQuZ2V0VGltZSgpIC0gc3RlcFN0YXJ0LmdldFRpbWUoKSxcbiAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcbiAgICAgICAgb3V0cHV0OiBjb21wbGlhbmNlUmVzdWx0XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29tcGxpYW5jZVJlc3VsdCxcbiAgICAgICAgZmlsdGVyZWRPcHBvcnR1bml0aWVzOiB0aGlzLmZpbHRlckJ5Q29tcGxpYW5jZShcbiAgICAgICAgICBhbmFseXNpc1Jlc3VsdC5vcHBvcnR1bml0eUlkZW50aWZpY2F0aW9uLFxuICAgICAgICAgIGNvbXBsaWFuY2VSZXN1bHRcbiAgICAgICAgKSxcbiAgICAgICAgYW5hbHlzaXNSZXN1bHRzOiBhbmFseXNpc1Jlc3VsdC5yZXN1bHRzIHx8IFtdLFxuICAgICAgICByZXNlYXJjaEZpbmRpbmdzOiBhbmFseXNpc1Jlc3VsdC5yZXNlYXJjaEZpbmRpbmdzIHx8IFtdXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBzdGVwRW5kID0gbmV3IERhdGUoKTtcbiAgICAgIG1ldGFkYXRhLnByb2Nlc3NpbmdTdGVwcy5wdXNoKHtcbiAgICAgICAgc3RlcDogJ2NvbXBsaWFuY2UnLFxuICAgICAgICBhZ2VudDogJ2NvbXBsaWFuY2UtYWdlbnQnLFxuICAgICAgICBzdGFydFRpbWU6IHN0ZXBTdGFydCxcbiAgICAgICAgZW5kVGltZTogc3RlcEVuZCxcbiAgICAgICAgZHVyYXRpb246IHN0ZXBFbmQuZ2V0VGltZSgpIC0gc3RlcFN0YXJ0LmdldFRpbWUoKSxcbiAgICAgICAgc3RhdHVzOiAnZmFpbGVkJ1xuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhlY3V0ZSBzeW50aGVzaXMgcGhhc2VcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXhlY3V0ZVN5bnRoZXNpc1BoYXNlKFxuICAgIHJlcXVlc3Q6IElkZWFHZW5lcmF0aW9uUmVxdWVzdCxcbiAgICBjb21wbGlhbmNlUmVzdWx0OiBhbnksXG4gICAgbWV0YWRhdGE6IEdlbmVyYXRpb25NZXRhZGF0YVxuICApOiBQcm9taXNlPGFueT4ge1xuICAgIGNvbnN0IHN0ZXBTdGFydCA9IG5ldyBEYXRlKCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ3JlYXRlIHN5bnRoZXNpcyByZXF1ZXN0XG4gICAgICBjb25zdCBzeW50aGVzaXNSZXF1ZXN0ID0ge1xuICAgICAgICBhbmFseXNpc1Jlc3VsdHM6IGNvbXBsaWFuY2VSZXN1bHQuYW5hbHlzaXNSZXN1bHRzIHx8IFtdLFxuICAgICAgICByZXNlYXJjaEZpbmRpbmdzOiBjb21wbGlhbmNlUmVzdWx0LnJlc2VhcmNoRmluZGluZ3MgfHwgW10sXG4gICAgICAgIGNvbXBsaWFuY2VDaGVja3M6IGNvbXBsaWFuY2VSZXN1bHQuY29tcGxpYW5jZVJlc3VsdHMgfHwgW10sXG4gICAgICAgIHVzZXJQcmVmZXJlbmNlczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiB0aGlzLmNvbnZlcnRUaW1lSG9yaXpvbihyZXF1ZXN0LnBhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24pLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6IHJlcXVlc3QucGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlLFxuICAgICAgICAgIHByZWZlcnJlZFNlY3RvcnM6IHJlcXVlc3QucGFyYW1ldGVycy5zZWN0b3JzLFxuICAgICAgICAgIGV4Y2x1ZGVkSW52ZXN0bWVudHM6IHJlcXVlc3QucGFyYW1ldGVycy5leGNsdWRlZEludmVzdG1lbnRzXG4gICAgICAgIH0sXG4gICAgICAgIG91dHB1dEZvcm1hdDogJ2RldGFpbGVkJyBhcyBjb25zdCxcbiAgICAgICAgaW5jbHVkZVZpc3VhbGl6YXRpb25zOiB0cnVlLFxuICAgICAgICBjb250ZXh0OiB0aGlzLmNvbnZlcnRUb0NvbnZlcnNhdGlvbkNvbnRleHQocmVxdWVzdClcbiAgICAgIH07XG5cbiAgICAgIC8vIEV4ZWN1dGUgc3ludGhlc2lzXG4gICAgICBjb25zdCBzeW50aGVzaXNSZXN1bHQgPSBhd2FpdCB0aGlzLnN5bnRoZXNpc0FnZW50LnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KHN5bnRoZXNpc1JlcXVlc3QpO1xuXG4gICAgICAvLyBDb252ZXJ0IHN5bnRoZXNpcyByZXN1bHRzIHRvIGludmVzdG1lbnQgaWRlYXNcbiAgICAgIGNvbnN0IGlkZWFzID0gYXdhaXQgdGhpcy5jb252ZXJ0VG9JbnZlc3RtZW50SWRlYXMoXG4gICAgICAgIHN5bnRoZXNpc1Jlc3VsdC5pbnZlc3RtZW50SWRlYXMgfHwgW10sXG4gICAgICAgIHJlcXVlc3QudXNlcklkLFxuICAgICAgICBtZXRhZGF0YVxuICAgICAgKTtcblxuICAgICAgY29uc3Qgc3RlcEVuZCA9IG5ldyBEYXRlKCk7XG4gICAgICBtZXRhZGF0YS5wcm9jZXNzaW5nU3RlcHMucHVzaCh7XG4gICAgICAgIHN0ZXA6ICdzeW50aGVzaXMnLFxuICAgICAgICBhZ2VudDogJ3N5bnRoZXNpcy1hZ2VudCcsXG4gICAgICAgIHN0YXJ0VGltZTogc3RlcFN0YXJ0LFxuICAgICAgICBlbmRUaW1lOiBzdGVwRW5kLFxuICAgICAgICBkdXJhdGlvbjogc3RlcEVuZC5nZXRUaW1lKCkgLSBzdGVwU3RhcnQuZ2V0VGltZSgpLFxuICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnLFxuICAgICAgICBvdXRwdXQ6IHN5bnRoZXNpc1Jlc3VsdFxuICAgICAgfSk7XG5cbiAgICAgIG1ldGFkYXRhLnRvdGFsSWRlYXNHZW5lcmF0ZWQgPSBpZGVhcy5sZW5ndGg7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN5bnRoZXNpc1Jlc3VsdCxcbiAgICAgICAgaWRlYXNcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IHN0ZXBFbmQgPSBuZXcgRGF0ZSgpO1xuICAgICAgbWV0YWRhdGEucHJvY2Vzc2luZ1N0ZXBzLnB1c2goe1xuICAgICAgICBzdGVwOiAnc3ludGhlc2lzJyxcbiAgICAgICAgYWdlbnQ6ICdzeW50aGVzaXMtYWdlbnQnLFxuICAgICAgICBzdGFydFRpbWU6IHN0ZXBTdGFydCxcbiAgICAgICAgZW5kVGltZTogc3RlcEVuZCxcbiAgICAgICAgZHVyYXRpb246IHN0ZXBFbmQuZ2V0VGltZSgpIC0gc3RlcFN0YXJ0LmdldFRpbWUoKSxcbiAgICAgICAgc3RhdHVzOiAnZmFpbGVkJ1xuICAgICAgfSk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRmlsdGVyIGFuZCByYW5rIGludmVzdG1lbnQgaWRlYXMgYmFzZWQgb24gdXNlciBwcmVmZXJlbmNlc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmaWx0ZXJBbmRSYW5rSWRlYXMoXG4gICAgaWRlYXM6IEludmVzdG1lbnRJZGVhW10sXG4gICAgcGFyYW1ldGVyczogSWRlYUdlbmVyYXRpb25QYXJhbWV0ZXJzLFxuICAgIG1ldGFkYXRhOiBHZW5lcmF0aW9uTWV0YWRhdGFcbiAgKTogUHJvbWlzZTxSYW5rZWRJbnZlc3RtZW50SWRlYVtdPiB7XG4gICAgLy8gQXBwbHkgZmlsdGVyc1xuICAgIGNvbnN0IGZpbHRlcmVkSWRlYXMgPSB0aGlzLmFwcGx5RmlsdGVycyhpZGVhcywgcGFyYW1ldGVycywgbWV0YWRhdGEpO1xuICAgIFxuICAgIC8vIENhbGN1bGF0ZSByYW5raW5nIHNjb3Jlc1xuICAgIGNvbnN0IHJhbmtlZElkZWFzID0gdGhpcy5jYWxjdWxhdGVSYW5raW5nU2NvcmVzKGZpbHRlcmVkSWRlYXMsIHBhcmFtZXRlcnMpO1xuICAgIFxuICAgIC8vIFNvcnQgYnkgcmFua2luZyBzY29yZVxuICAgIHJhbmtlZElkZWFzLnNvcnQoKGEsIGIpID0+IGIucmFua2luZ1Njb3JlIC0gYS5yYW5raW5nU2NvcmUpO1xuICAgIFxuICAgIC8vIEFzc2lnbiByYW5rcyBhbmQgbGltaXQgcmVzdWx0c1xuICAgIGNvbnN0IG1heElkZWFzID0gcGFyYW1ldGVycy5tYXhpbXVtSWRlYXMgfHwgMTA7XG4gICAgY29uc3QgZmluYWxJZGVhcyA9IHJhbmtlZElkZWFzLnNsaWNlKDAsIG1heElkZWFzKS5tYXAoKGlkZWEsIGluZGV4KSA9PiAoe1xuICAgICAgLi4uaWRlYSxcbiAgICAgIHJhbms6IGluZGV4ICsgMVxuICAgIH0pKTtcblxuICAgIG1ldGFkYXRhLnRvdGFsSWRlYXNGaWx0ZXJlZCA9IGlkZWFzLmxlbmd0aCAtIGZpbHRlcmVkSWRlYXMubGVuZ3RoO1xuXG4gICAgcmV0dXJuIGZpbmFsSWRlYXM7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgZmlsdGVyaW5nIGNyaXRlcmlhIHRvIGludmVzdG1lbnQgaWRlYXNcbiAgICovXG4gIHByaXZhdGUgYXBwbHlGaWx0ZXJzKFxuICAgIGlkZWFzOiBJbnZlc3RtZW50SWRlYVtdLFxuICAgIHBhcmFtZXRlcnM6IElkZWFHZW5lcmF0aW9uUGFyYW1ldGVycyxcbiAgICBtZXRhZGF0YTogR2VuZXJhdGlvbk1ldGFkYXRhXG4gICk6IEludmVzdG1lbnRJZGVhW10ge1xuICAgIGxldCBmaWx0ZXJlZElkZWFzID0gWy4uLmlkZWFzXTtcblxuICAgIC8vIE1pbmltdW0gY29uZmlkZW5jZSBmaWx0ZXJcbiAgICBpZiAocGFyYW1ldGVycy5taW5pbXVtQ29uZmlkZW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBiZWZvcmVDb3VudCA9IGZpbHRlcmVkSWRlYXMubGVuZ3RoO1xuICAgICAgZmlsdGVyZWRJZGVhcyA9IGZpbHRlcmVkSWRlYXMuZmlsdGVyKGlkZWEgPT4gaWRlYS5jb25maWRlbmNlU2NvcmUgPj0gcGFyYW1ldGVycy5taW5pbXVtQ29uZmlkZW5jZSEpO1xuICAgICAgXG4gICAgICBtZXRhZGF0YS5maWx0ZXJpbmdDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgY3JpdGVyaW9uOiAnbWluaW11bUNvbmZpZGVuY2UnLFxuICAgICAgICB0eXBlOiAnaW5jbHVzaW9uJyxcbiAgICAgICAgdmFsdWU6IHBhcmFtZXRlcnMubWluaW11bUNvbmZpZGVuY2UsXG4gICAgICAgIGFwcGxpZWRDb3VudDogYmVmb3JlQ291bnQgLSBmaWx0ZXJlZElkZWFzLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVGltZSBob3Jpem9uIGZpbHRlclxuICAgIGlmIChwYXJhbWV0ZXJzLmludmVzdG1lbnRIb3Jpem9uKSB7XG4gICAgICBjb25zdCBiZWZvcmVDb3VudCA9IGZpbHRlcmVkSWRlYXMubGVuZ3RoO1xuICAgICAgZmlsdGVyZWRJZGVhcyA9IGZpbHRlcmVkSWRlYXMuZmlsdGVyKGlkZWEgPT4gXG4gICAgICAgIHRoaXMuaXNDb21wYXRpYmxlVGltZUhvcml6b24oaWRlYS50aW1lSG9yaXpvbiwgcGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbiEpXG4gICAgICApO1xuICAgICAgXG4gICAgICBtZXRhZGF0YS5maWx0ZXJpbmdDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgY3JpdGVyaW9uOiAnaW52ZXN0bWVudEhvcml6b24nLFxuICAgICAgICB0eXBlOiAnaW5jbHVzaW9uJyxcbiAgICAgICAgdmFsdWU6IHBhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24sXG4gICAgICAgIGFwcGxpZWRDb3VudDogYmVmb3JlQ291bnQgLSBmaWx0ZXJlZElkZWFzLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gUmlzayB0b2xlcmFuY2UgZmlsdGVyXG4gICAgaWYgKHBhcmFtZXRlcnMucmlza1RvbGVyYW5jZSkge1xuICAgICAgY29uc3QgYmVmb3JlQ291bnQgPSBmaWx0ZXJlZElkZWFzLmxlbmd0aDtcbiAgICAgIGZpbHRlcmVkSWRlYXMgPSBmaWx0ZXJlZElkZWFzLmZpbHRlcihpZGVhID0+IFxuICAgICAgICB0aGlzLmlzQ29tcGF0aWJsZVJpc2tMZXZlbChpZGVhLnJpc2tMZXZlbCwgcGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlISlcbiAgICAgICk7XG4gICAgICBcbiAgICAgIG1ldGFkYXRhLmZpbHRlcmluZ0NyaXRlcmlhLnB1c2goe1xuICAgICAgICBjcml0ZXJpb246ICdyaXNrVG9sZXJhbmNlJyxcbiAgICAgICAgdHlwZTogJ2luY2x1c2lvbicsXG4gICAgICAgIHZhbHVlOiBwYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UsXG4gICAgICAgIGFwcGxpZWRDb3VudDogYmVmb3JlQ291bnQgLSBmaWx0ZXJlZElkZWFzLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gU2VjdG9yIGZpbHRlclxuICAgIGlmIChwYXJhbWV0ZXJzLnNlY3RvcnMgJiYgcGFyYW1ldGVycy5zZWN0b3JzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGJlZm9yZUNvdW50ID0gZmlsdGVyZWRJZGVhcy5sZW5ndGg7XG4gICAgICBmaWx0ZXJlZElkZWFzID0gZmlsdGVyZWRJZGVhcy5maWx0ZXIoaWRlYSA9PiBcbiAgICAgICAgdGhpcy5tYXRjaGVzU2VjdG9yQ3JpdGVyaWEoaWRlYSwgcGFyYW1ldGVycy5zZWN0b3JzISlcbiAgICAgICk7XG4gICAgICBcbiAgICAgIG1ldGFkYXRhLmZpbHRlcmluZ0NyaXRlcmlhLnB1c2goe1xuICAgICAgICBjcml0ZXJpb246ICdzZWN0b3JzJyxcbiAgICAgICAgdHlwZTogJ2luY2x1c2lvbicsXG4gICAgICAgIHZhbHVlOiBwYXJhbWV0ZXJzLnNlY3RvcnMsXG4gICAgICAgIGFwcGxpZWRDb3VudDogYmVmb3JlQ291bnQgLSBmaWx0ZXJlZElkZWFzLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQXNzZXQgY2xhc3MgZmlsdGVyXG4gICAgaWYgKHBhcmFtZXRlcnMuYXNzZXRDbGFzc2VzICYmIHBhcmFtZXRlcnMuYXNzZXRDbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGJlZm9yZUNvdW50ID0gZmlsdGVyZWRJZGVhcy5sZW5ndGg7XG4gICAgICBmaWx0ZXJlZElkZWFzID0gZmlsdGVyZWRJZGVhcy5maWx0ZXIoaWRlYSA9PiBcbiAgICAgICAgdGhpcy5tYXRjaGVzQXNzZXRDbGFzc0NyaXRlcmlhKGlkZWEsIHBhcmFtZXRlcnMuYXNzZXRDbGFzc2VzISlcbiAgICAgICk7XG4gICAgICBcbiAgICAgIG1ldGFkYXRhLmZpbHRlcmluZ0NyaXRlcmlhLnB1c2goe1xuICAgICAgICBjcml0ZXJpb246ICdhc3NldENsYXNzZXMnLFxuICAgICAgICB0eXBlOiAnaW5jbHVzaW9uJyxcbiAgICAgICAgdmFsdWU6IHBhcmFtZXRlcnMuYXNzZXRDbGFzc2VzLFxuICAgICAgICBhcHBsaWVkQ291bnQ6IGJlZm9yZUNvdW50IC0gZmlsdGVyZWRJZGVhcy5sZW5ndGhcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEV4Y2x1ZGVkIGludmVzdG1lbnRzIGZpbHRlclxuICAgIGlmIChwYXJhbWV0ZXJzLmV4Y2x1ZGVkSW52ZXN0bWVudHMgJiYgcGFyYW1ldGVycy5leGNsdWRlZEludmVzdG1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGJlZm9yZUNvdW50ID0gZmlsdGVyZWRJZGVhcy5sZW5ndGg7XG4gICAgICBmaWx0ZXJlZElkZWFzID0gZmlsdGVyZWRJZGVhcy5maWx0ZXIoaWRlYSA9PiBcbiAgICAgICAgIXRoaXMuY29udGFpbnNFeGNsdWRlZEludmVzdG1lbnRzKGlkZWEsIHBhcmFtZXRlcnMuZXhjbHVkZWRJbnZlc3RtZW50cyEpXG4gICAgICApO1xuICAgICAgXG4gICAgICBtZXRhZGF0YS5maWx0ZXJpbmdDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgY3JpdGVyaW9uOiAnZXhjbHVkZWRJbnZlc3RtZW50cycsXG4gICAgICAgIHR5cGU6ICdleGNsdXNpb24nLFxuICAgICAgICB2YWx1ZTogcGFyYW1ldGVycy5leGNsdWRlZEludmVzdG1lbnRzLFxuICAgICAgICBhcHBsaWVkQ291bnQ6IGJlZm9yZUNvdW50IC0gZmlsdGVyZWRJZGVhcy5sZW5ndGhcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFRhcmdldCBhdWRpZW5jZSBmaWx0ZXJcbiAgICBpZiAocGFyYW1ldGVycy50YXJnZXRBdWRpZW5jZSAmJiBwYXJhbWV0ZXJzLnRhcmdldEF1ZGllbmNlLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGJlZm9yZUNvdW50ID0gZmlsdGVyZWRJZGVhcy5sZW5ndGg7XG4gICAgICBmaWx0ZXJlZElkZWFzID0gZmlsdGVyZWRJZGVhcy5maWx0ZXIoaWRlYSA9PiBcbiAgICAgICAgdGhpcy5tYXRjaGVzVGFyZ2V0QXVkaWVuY2UoaWRlYSwgcGFyYW1ldGVycy50YXJnZXRBdWRpZW5jZSEpXG4gICAgICApO1xuICAgICAgXG4gICAgICBtZXRhZGF0YS5maWx0ZXJpbmdDcml0ZXJpYS5wdXNoKHtcbiAgICAgICAgY3JpdGVyaW9uOiAndGFyZ2V0QXVkaWVuY2UnLFxuICAgICAgICB0eXBlOiAnaW5jbHVzaW9uJyxcbiAgICAgICAgdmFsdWU6IHBhcmFtZXRlcnMudGFyZ2V0QXVkaWVuY2UsXG4gICAgICAgIGFwcGxpZWRDb3VudDogYmVmb3JlQ291bnQgLSBmaWx0ZXJlZElkZWFzLmxlbmd0aFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbHRlcmVkSWRlYXM7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIHJhbmtpbmcgc2NvcmVzIGZvciBpbnZlc3RtZW50IGlkZWFzXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZVJhbmtpbmdTY29yZXMoXG4gICAgaWRlYXM6IEludmVzdG1lbnRJZGVhW10sXG4gICAgcGFyYW1ldGVyczogSWRlYUdlbmVyYXRpb25QYXJhbWV0ZXJzXG4gICk6IFJhbmtlZEludmVzdG1lbnRJZGVhW10ge1xuICAgIHJldHVybiBpZGVhcy5tYXAoaWRlYSA9PiB7XG4gICAgICBjb25zdCByYW5raW5nRmFjdG9yczogUmFua2luZ0ZhY3RvcltdID0gW107XG4gICAgICBsZXQgdG90YWxTY29yZSA9IDA7XG4gICAgICBsZXQgdG90YWxXZWlnaHQgPSAwO1xuXG4gICAgICAvLyBDb25maWRlbmNlIHNjb3JlIGZhY3RvciAod2VpZ2h0OiAzMCUpXG4gICAgICBjb25zdCBjb25maWRlbmNlV2VpZ2h0ID0gMC4zO1xuICAgICAgY29uc3QgY29uZmlkZW5jZVNjb3JlID0gaWRlYS5jb25maWRlbmNlU2NvcmU7XG4gICAgICBjb25zdCBjb25maWRlbmNlQ29udHJpYnV0aW9uID0gY29uZmlkZW5jZVNjb3JlICogY29uZmlkZW5jZVdlaWdodDtcbiAgICAgIFxuICAgICAgcmFua2luZ0ZhY3RvcnMucHVzaCh7XG4gICAgICAgIGZhY3RvcjogJ2NvbmZpZGVuY2UnLFxuICAgICAgICB3ZWlnaHQ6IGNvbmZpZGVuY2VXZWlnaHQsXG4gICAgICAgIHNjb3JlOiBjb25maWRlbmNlU2NvcmUsXG4gICAgICAgIGNvbnRyaWJ1dGlvbjogY29uZmlkZW5jZUNvbnRyaWJ1dGlvbixcbiAgICAgICAgZXhwbGFuYXRpb246IGBJbnZlc3RtZW50IGNvbmZpZGVuY2Ugc2NvcmUgb2YgJHsoY29uZmlkZW5jZVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgXG4gICAgICB9KTtcblxuICAgICAgdG90YWxTY29yZSArPSBjb25maWRlbmNlQ29udHJpYnV0aW9uO1xuICAgICAgdG90YWxXZWlnaHQgKz0gY29uZmlkZW5jZVdlaWdodDtcblxuICAgICAgLy8gUmlzay1yZXR1cm4gb3B0aW1pemF0aW9uIGZhY3RvciAod2VpZ2h0OiAyNSUpXG4gICAgICBjb25zdCByaXNrUmV0dXJuV2VpZ2h0ID0gMC4yNTtcbiAgICAgIGNvbnN0IHJpc2tSZXR1cm5TY29yZSA9IHRoaXMuY2FsY3VsYXRlUmlza1JldHVyblNjb3JlKGlkZWEsIHBhcmFtZXRlcnMucmlza1RvbGVyYW5jZSk7XG4gICAgICBjb25zdCByaXNrUmV0dXJuQ29udHJpYnV0aW9uID0gcmlza1JldHVyblNjb3JlICogcmlza1JldHVybldlaWdodDtcbiAgICAgIFxuICAgICAgcmFua2luZ0ZhY3RvcnMucHVzaCh7XG4gICAgICAgIGZhY3RvcjogJ3Jpc2stcmV0dXJuJyxcbiAgICAgICAgd2VpZ2h0OiByaXNrUmV0dXJuV2VpZ2h0LFxuICAgICAgICBzY29yZTogcmlza1JldHVyblNjb3JlLFxuICAgICAgICBjb250cmlidXRpb246IHJpc2tSZXR1cm5Db250cmlidXRpb24sXG4gICAgICAgIGV4cGxhbmF0aW9uOiBgUmlzay1yZXR1cm4gcHJvZmlsZSBhbGlnbm1lbnQgd2l0aCB1c2VyIHByZWZlcmVuY2VzYFxuICAgICAgfSk7XG5cbiAgICAgIHRvdGFsU2NvcmUgKz0gcmlza1JldHVybkNvbnRyaWJ1dGlvbjtcbiAgICAgIHRvdGFsV2VpZ2h0ICs9IHJpc2tSZXR1cm5XZWlnaHQ7XG5cbiAgICAgIC8vIFRpbWUgaG9yaXpvbiBhbGlnbm1lbnQgZmFjdG9yICh3ZWlnaHQ6IDE1JSlcbiAgICAgIGNvbnN0IHRpbWVIb3Jpem9uV2VpZ2h0ID0gMC4xNTtcbiAgICAgIGNvbnN0IHRpbWVIb3Jpem9uU2NvcmUgPSB0aGlzLmNhbGN1bGF0ZVRpbWVIb3Jpem9uU2NvcmUoaWRlYS50aW1lSG9yaXpvbiwgcGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbik7XG4gICAgICBjb25zdCB0aW1lSG9yaXpvbkNvbnRyaWJ1dGlvbiA9IHRpbWVIb3Jpem9uU2NvcmUgKiB0aW1lSG9yaXpvbldlaWdodDtcbiAgICAgIFxuICAgICAgcmFua2luZ0ZhY3RvcnMucHVzaCh7XG4gICAgICAgIGZhY3RvcjogJ3RpbWUtaG9yaXpvbicsXG4gICAgICAgIHdlaWdodDogdGltZUhvcml6b25XZWlnaHQsXG4gICAgICAgIHNjb3JlOiB0aW1lSG9yaXpvblNjb3JlLFxuICAgICAgICBjb250cmlidXRpb246IHRpbWVIb3Jpem9uQ29udHJpYnV0aW9uLFxuICAgICAgICBleHBsYW5hdGlvbjogYFRpbWUgaG9yaXpvbiBhbGlnbm1lbnQgd2l0aCBpbnZlc3RtZW50IGdvYWxzYFxuICAgICAgfSk7XG5cbiAgICAgIHRvdGFsU2NvcmUgKz0gdGltZUhvcml6b25Db250cmlidXRpb247XG4gICAgICB0b3RhbFdlaWdodCArPSB0aW1lSG9yaXpvbldlaWdodDtcblxuICAgICAgLy8gTm92ZWx0eSBhbmQgcXVhbGl0eSBmYWN0b3IgKHdlaWdodDogMjAlKVxuICAgICAgY29uc3QgcXVhbGl0eVdlaWdodCA9IDAuMjtcbiAgICAgIGNvbnN0IHF1YWxpdHlTY29yZSA9IChpZGVhLm1ldGFkYXRhLnF1YWxpdHlTY29yZSArIGlkZWEubWV0YWRhdGEubm92ZWx0eVNjb3JlKSAvIDIwMDsgLy8gTm9ybWFsaXplIHRvIDAtMVxuICAgICAgY29uc3QgcXVhbGl0eUNvbnRyaWJ1dGlvbiA9IHF1YWxpdHlTY29yZSAqIHF1YWxpdHlXZWlnaHQ7XG4gICAgICBcbiAgICAgIHJhbmtpbmdGYWN0b3JzLnB1c2goe1xuICAgICAgICBmYWN0b3I6ICdxdWFsaXR5LW5vdmVsdHknLFxuICAgICAgICB3ZWlnaHQ6IHF1YWxpdHlXZWlnaHQsXG4gICAgICAgIHNjb3JlOiBxdWFsaXR5U2NvcmUsXG4gICAgICAgIGNvbnRyaWJ1dGlvbjogcXVhbGl0eUNvbnRyaWJ1dGlvbixcbiAgICAgICAgZXhwbGFuYXRpb246IGBDb21iaW5hdGlvbiBvZiBpZGVhIHF1YWxpdHkgYW5kIG5vdmVsdHkgc2NvcmVzYFxuICAgICAgfSk7XG5cbiAgICAgIHRvdGFsU2NvcmUgKz0gcXVhbGl0eUNvbnRyaWJ1dGlvbjtcbiAgICAgIHRvdGFsV2VpZ2h0ICs9IHF1YWxpdHlXZWlnaHQ7XG5cbiAgICAgIC8vIE1hcmtldCB0aW1pbmcgZmFjdG9yICh3ZWlnaHQ6IDEwJSlcbiAgICAgIGNvbnN0IHRpbWluZ1dlaWdodCA9IDAuMTtcbiAgICAgIGNvbnN0IHRpbWluZ1Njb3JlID0gdGhpcy5jYWxjdWxhdGVNYXJrZXRUaW1pbmdTY29yZShpZGVhKTtcbiAgICAgIGNvbnN0IHRpbWluZ0NvbnRyaWJ1dGlvbiA9IHRpbWluZ1Njb3JlICogdGltaW5nV2VpZ2h0O1xuICAgICAgXG4gICAgICByYW5raW5nRmFjdG9ycy5wdXNoKHtcbiAgICAgICAgZmFjdG9yOiAnbWFya2V0LXRpbWluZycsXG4gICAgICAgIHdlaWdodDogdGltaW5nV2VpZ2h0LFxuICAgICAgICBzY29yZTogdGltaW5nU2NvcmUsXG4gICAgICAgIGNvbnRyaWJ1dGlvbjogdGltaW5nQ29udHJpYnV0aW9uLFxuICAgICAgICBleHBsYW5hdGlvbjogYE1hcmtldCB0aW1pbmcgYW5kIGN1cnJlbnQgY29uZGl0aW9ucyBhbGlnbm1lbnRgXG4gICAgICB9KTtcblxuICAgICAgdG90YWxTY29yZSArPSB0aW1pbmdDb250cmlidXRpb247XG4gICAgICB0b3RhbFdlaWdodCArPSB0aW1pbmdXZWlnaHQ7XG5cbiAgICAgIC8vIE5vcm1hbGl6ZSBmaW5hbCBzY29yZVxuICAgICAgY29uc3QgcmFua2luZ1Njb3JlID0gdG90YWxXZWlnaHQgPiAwID8gdG90YWxTY29yZSAvIHRvdGFsV2VpZ2h0IDogMDtcblxuICAgICAgY29uc3QgcmFua2VkSWRlYTogUmFua2VkSW52ZXN0bWVudElkZWEgPSB7XG4gICAgICAgIC4uLmlkZWEsXG4gICAgICAgIHJhbms6IDAsIC8vIFdpbGwgYmUgc2V0IGxhdGVyXG4gICAgICAgIHJhbmtpbmdTY29yZSxcbiAgICAgICAgcmFua2luZ0ZhY3RvcnNcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiByYW5rZWRJZGVhO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIGZpbHRlcmluZyBhbmQgcmFua2luZ1xuXG4gIHByaXZhdGUgaXNDb21wYXRpYmxlVGltZUhvcml6b24oaWRlYUhvcml6b246IFRpbWVIb3Jpem9uLCB1c2VySG9yaXpvbjogVGltZUhvcml6b24pOiBib29sZWFuIHtcbiAgICBjb25zdCBob3Jpem9uT3JkZXIgPSBbJ2ludHJhZGF5JywgJ3Nob3J0JywgJ21lZGl1bScsICdsb25nJywgJ3ZlcnktbG9uZyddO1xuICAgIGNvbnN0IGlkZWFJbmRleCA9IGhvcml6b25PcmRlci5pbmRleE9mKGlkZWFIb3Jpem9uKTtcbiAgICBjb25zdCB1c2VySW5kZXggPSBob3Jpem9uT3JkZXIuaW5kZXhPZih1c2VySG9yaXpvbik7XG4gICAgXG4gICAgLy8gQWxsb3cgaWRlYXMgd2l0aGluIG9uZSBsZXZlbCBvZiB1c2VyIHByZWZlcmVuY2VcbiAgICByZXR1cm4gTWF0aC5hYnMoaWRlYUluZGV4IC0gdXNlckluZGV4KSA8PSAxO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0NvbXBhdGlibGVSaXNrTGV2ZWwoaWRlYVJpc2s6IFJpc2tMZXZlbCwgdXNlclJpc2s6ICdjb25zZXJ2YXRpdmUnIHwgJ21vZGVyYXRlJyB8ICdhZ2dyZXNzaXZlJyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJpc2tNYXBwaW5nID0ge1xuICAgICAgJ2NvbnNlcnZhdGl2ZSc6IFsndmVyeS1sb3cnLCAnbG93J10sXG4gICAgICAnbW9kZXJhdGUnOiBbJ2xvdycsICdtb2RlcmF0ZScsICdoaWdoJ10sXG4gICAgICAnYWdncmVzc2l2ZSc6IFsnbW9kZXJhdGUnLCAnaGlnaCcsICd2ZXJ5LWhpZ2gnXVxuICAgIH07XG4gICAgXG4gICAgcmV0dXJuIHJpc2tNYXBwaW5nW3VzZXJSaXNrXS5pbmNsdWRlcyhpZGVhUmlzayk7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoZXNTZWN0b3JDcml0ZXJpYShpZGVhOiBJbnZlc3RtZW50SWRlYSwgc2VjdG9yczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gaWRlYS5pbnZlc3RtZW50cy5zb21lKGludmVzdG1lbnQgPT4gXG4gICAgICBpbnZlc3RtZW50LnNlY3RvciAmJiBzZWN0b3JzLmluY2x1ZGVzKGludmVzdG1lbnQuc2VjdG9yKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoZXNBc3NldENsYXNzQ3JpdGVyaWEoaWRlYTogSW52ZXN0bWVudElkZWEsIGFzc2V0Q2xhc3Nlczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gaWRlYS5pbnZlc3RtZW50cy5zb21lKGludmVzdG1lbnQgPT4gXG4gICAgICBhc3NldENsYXNzZXMuaW5jbHVkZXMoaW52ZXN0bWVudC50eXBlKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNvbnRhaW5zRXhjbHVkZWRJbnZlc3RtZW50cyhpZGVhOiBJbnZlc3RtZW50SWRlYSwgZXhjbHVkZWRJbnZlc3RtZW50czogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gaWRlYS5pbnZlc3RtZW50cy5zb21lKGludmVzdG1lbnQgPT4gXG4gICAgICBleGNsdWRlZEludmVzdG1lbnRzLmluY2x1ZGVzKGludmVzdG1lbnQubmFtZSkgfHwgXG4gICAgICAoaW52ZXN0bWVudC50aWNrZXIgJiYgZXhjbHVkZWRJbnZlc3RtZW50cy5pbmNsdWRlcyhpbnZlc3RtZW50LnRpY2tlcikpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgbWF0Y2hlc1RhcmdldEF1ZGllbmNlKGlkZWE6IEludmVzdG1lbnRJZGVhLCB0YXJnZXRBdWRpZW5jZTogVGFyZ2V0QXVkaWVuY2VbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBpZGVhLnRhcmdldEF1ZGllbmNlLnNvbWUoYXVkaWVuY2UgPT4gdGFyZ2V0QXVkaWVuY2UuaW5jbHVkZXMoYXVkaWVuY2UpKTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUmlza1JldHVyblNjb3JlKGlkZWE6IEludmVzdG1lbnRJZGVhLCByaXNrVG9sZXJhbmNlPzogJ2NvbnNlcnZhdGl2ZScgfCAnbW9kZXJhdGUnIHwgJ2FnZ3Jlc3NpdmUnKTogbnVtYmVyIHtcbiAgICBpZiAoIXJpc2tUb2xlcmFuY2UpIHJldHVybiAwLjU7XG5cbiAgICBjb25zdCBleHBlY3RlZFJldHVybiA9IGlkZWEucG90ZW50aWFsT3V0Y29tZXMuZmluZChvID0+IG8uc2NlbmFyaW8gPT09ICdleHBlY3RlZCcpPy5yZXR1cm5Fc3RpbWF0ZSB8fCAwO1xuICAgIGNvbnN0IHJpc2tMZXZlbCA9IGlkZWEucmlza0xldmVsO1xuXG4gICAgLy8gUmlzay1yZXR1cm4gb3B0aW1pemF0aW9uIGJhc2VkIG9uIHVzZXIgdG9sZXJhbmNlXG4gICAgY29uc3Qgcmlza1Njb3JlcyA9IHtcbiAgICAgICd2ZXJ5LWxvdyc6IDAuMixcbiAgICAgICdsb3cnOiAwLjQsXG4gICAgICAnbW9kZXJhdGUnOiAwLjYsXG4gICAgICAnaGlnaCc6IDAuOCxcbiAgICAgICd2ZXJ5LWhpZ2gnOiAxLjBcbiAgICB9O1xuXG4gICAgY29uc3Qgcmlza1Njb3JlID0gcmlza1Njb3Jlc1tyaXNrTGV2ZWxdO1xuICAgIGNvbnN0IHJldHVyblNjb3JlID0gTWF0aC5taW4oZXhwZWN0ZWRSZXR1cm4gLyAwLjIsIDEpOyAvLyBOb3JtYWxpemUgYXNzdW1pbmcgMjAlIGlzIGV4Y2VsbGVudCByZXR1cm5cblxuICAgIC8vIFdlaWdodCBiYXNlZCBvbiB1c2VyIHJpc2sgdG9sZXJhbmNlXG4gICAgY29uc3Qgd2VpZ2h0cyA9IHtcbiAgICAgICdjb25zZXJ2YXRpdmUnOiB7IHJpc2s6IDAuNywgcmV0dXJuOiAwLjMgfSxcbiAgICAgICdtb2RlcmF0ZSc6IHsgcmlzazogMC41LCByZXR1cm46IDAuNSB9LFxuICAgICAgJ2FnZ3Jlc3NpdmUnOiB7IHJpc2s6IDAuMywgcmV0dXJuOiAwLjcgfVxuICAgIH07XG5cbiAgICBjb25zdCB3ZWlnaHQgPSB3ZWlnaHRzW3Jpc2tUb2xlcmFuY2VdO1xuICAgIHJldHVybiAoMSAtIHJpc2tTY29yZSkgKiB3ZWlnaHQucmlzayArIHJldHVyblNjb3JlICogd2VpZ2h0LnJldHVybjtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlVGltZUhvcml6b25TY29yZShpZGVhSG9yaXpvbjogVGltZUhvcml6b24sIHVzZXJIb3Jpem9uPzogVGltZUhvcml6b24pOiBudW1iZXIge1xuICAgIGlmICghdXNlckhvcml6b24pIHJldHVybiAwLjU7XG5cbiAgICBjb25zdCBob3Jpem9uT3JkZXIgPSBbJ2ludHJhZGF5JywgJ3Nob3J0JywgJ21lZGl1bScsICdsb25nJywgJ3ZlcnktbG9uZyddO1xuICAgIGNvbnN0IGlkZWFJbmRleCA9IGhvcml6b25PcmRlci5pbmRleE9mKGlkZWFIb3Jpem9uKTtcbiAgICBjb25zdCB1c2VySW5kZXggPSBob3Jpem9uT3JkZXIuaW5kZXhPZih1c2VySG9yaXpvbik7XG4gICAgXG4gICAgY29uc3QgZGlzdGFuY2UgPSBNYXRoLmFicyhpZGVhSW5kZXggLSB1c2VySW5kZXgpO1xuICAgIHJldHVybiBNYXRoLm1heCgwLCAxIC0gZGlzdGFuY2UgKiAwLjI1KTsgLy8gRGVjcmVhc2Ugc2NvcmUgYnkgMjUlIGZvciBlYWNoIGxldmVsIGRpZmZlcmVuY2VcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlTWFya2V0VGltaW5nU2NvcmUoaWRlYTogSW52ZXN0bWVudElkZWEpOiBudW1iZXIge1xuICAgIC8vIFNpbXBsZSBtYXJrZXQgdGltaW5nIHNjb3JlIGJhc2VkIG9uIG1hcmtldCBjb25kaXRpb25zIGF0IGdlbmVyYXRpb25cbiAgICBjb25zdCBtYXJrZXRDb25kaXRpb25zID0gaWRlYS5tZXRhZGF0YS5tYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uO1xuICAgIFxuICAgIGxldCBzY29yZSA9IDAuNTsgLy8gQmFzZSBzY29yZVxuXG4gICAgLy8gQWRqdXN0IGJhc2VkIG9uIHZvbGF0aWxpdHkgYW5kIHRyZW5kXG4gICAgaWYgKG1hcmtldENvbmRpdGlvbnMubWFya2V0VHJlbmQgPT09ICdidWxsJykge1xuICAgICAgc2NvcmUgKz0gMC4yO1xuICAgIH0gZWxzZSBpZiAobWFya2V0Q29uZGl0aW9ucy5tYXJrZXRUcmVuZCA9PT0gJ2JlYXInKSB7XG4gICAgICBzY29yZSAtPSAwLjE7XG4gICAgfVxuXG4gICAgLy8gQWRqdXN0IGJhc2VkIG9uIGdlb3BvbGl0aWNhbCByaXNrXG4gICAgaWYgKG1hcmtldENvbmRpdGlvbnMuZ2VvcG9saXRpY2FsUmlzayA9PT0gJ2xvdycpIHtcbiAgICAgIHNjb3JlICs9IDAuMTtcbiAgICB9IGVsc2UgaWYgKG1hcmtldENvbmRpdGlvbnMuZ2VvcG9saXRpY2FsUmlzayA9PT0gJ2hpZ2gnKSB7XG4gICAgICBzY29yZSAtPSAwLjI7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHNjb3JlKSk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUNvbmZpZGVuY2VEaXN0cmlidXRpb24oaWRlYXM6IFJhbmtlZEludmVzdG1lbnRJZGVhW10sIG1ldGFkYXRhOiBHZW5lcmF0aW9uTWV0YWRhdGEpOiB2b2lkIHtcbiAgICBsZXQgaGlnaCA9IDAsIG1lZGl1bSA9IDAsIGxvdyA9IDAsIHRvdGFsID0gMDtcblxuICAgIGlkZWFzLmZvckVhY2goaWRlYSA9PiB7XG4gICAgICBpZiAoaWRlYS5jb25maWRlbmNlU2NvcmUgPiAwLjgpIGhpZ2grKztcbiAgICAgIGVsc2UgaWYgKGlkZWEuY29uZmlkZW5jZVNjb3JlID49IDAuNSkgbWVkaXVtKys7XG4gICAgICBlbHNlIGxvdysrO1xuICAgICAgdG90YWwgKz0gaWRlYS5jb25maWRlbmNlU2NvcmU7XG4gICAgfSk7XG5cbiAgICBtZXRhZGF0YS5jb25maWRlbmNlRGlzdHJpYnV0aW9uID0ge1xuICAgICAgaGlnaCxcbiAgICAgIG1lZGl1bSxcbiAgICAgIGxvdyxcbiAgICAgIGF2ZXJhZ2U6IGlkZWFzLmxlbmd0aCA+IDAgPyB0b3RhbCAvIGlkZWFzLmxlbmd0aCA6IDBcbiAgICB9O1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIHBoYXNlIGV4ZWN1dGlvblxuXG4gIHByaXZhdGUgZXh0cmFjdE9iamVjdGl2ZXMocGFyYW1ldGVyczogSWRlYUdlbmVyYXRpb25QYXJhbWV0ZXJzKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IG9iamVjdGl2ZXMgPSBbJ0dlbmVyYXRlIGludmVzdG1lbnQgaWRlYXMnXTtcbiAgICBcbiAgICBpZiAocGFyYW1ldGVycy5pbnZlc3RtZW50SG9yaXpvbikge1xuICAgICAgb2JqZWN0aXZlcy5wdXNoKGBGb2N1cyBvbiAke3BhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b259LXRlcm0gaW52ZXN0bWVudHNgKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHBhcmFtZXRlcnMucmlza1RvbGVyYW5jZSkge1xuICAgICAgb2JqZWN0aXZlcy5wdXNoKGBBbGlnbiB3aXRoICR7cGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlfSByaXNrIHRvbGVyYW5jZWApO1xuICAgIH1cbiAgICBcbiAgICBpZiAocGFyYW1ldGVycy5zZWN0b3JzICYmIHBhcmFtZXRlcnMuc2VjdG9ycy5sZW5ndGggPiAwKSB7XG4gICAgICBvYmplY3RpdmVzLnB1c2goYEZvY3VzIG9uIHNlY3RvcnM6ICR7cGFyYW1ldGVycy5zZWN0b3JzLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvYmplY3RpdmVzO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVSZXNlYXJjaFJlcXVlc3RzKHBhcmFtZXRlcnM6IElkZWFHZW5lcmF0aW9uUGFyYW1ldGVycywgcGxhbm5pbmdSZXN1bHQ6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCByZXF1ZXN0cyA9IFtdO1xuXG4gICAgLy8gTWFya2V0IHJlc2VhcmNoIHJlcXVlc3RcbiAgICByZXF1ZXN0cy5wdXNoKHtcbiAgICAgIHRvcGljOiBgbWFya2V0IHRyZW5kcyAke3BhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24gfHwgJ21lZGl1bSd9IHRlcm1gLFxuICAgICAgcmVzZWFyY2hUeXBlOiAnY29tcHJlaGVuc2l2ZScgYXMgY29uc3QsXG4gICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgIGRlcHRoOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICAgIHNvdXJjZXM6IFsnZmluYW5jaWFsLW5ld3MnLCAnbWFya2V0LWRhdGEnLCAncmVzZWFyY2gtcmVwb3J0cyddLFxuICAgICAgICB0aW1lZnJhbWU6ICdyZWNlbnQnIGFzIGNvbnN0LFxuICAgICAgICBpbmNsdWRlTWFya2V0RGF0YTogdHJ1ZSxcbiAgICAgICAgbWF4UmVzdWx0czogNTBcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNlY3Rvci1zcGVjaWZpYyByZXNlYXJjaFxuICAgIGlmIChwYXJhbWV0ZXJzLnNlY3RvcnMgJiYgcGFyYW1ldGVycy5zZWN0b3JzLmxlbmd0aCA+IDApIHtcbiAgICAgIHBhcmFtZXRlcnMuc2VjdG9ycy5mb3JFYWNoKHNlY3RvciA9PiB7XG4gICAgICAgIHJlcXVlc3RzLnB1c2goe1xuICAgICAgICAgIHRvcGljOiBgJHtzZWN0b3J9IHNlY3RvciBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXNgLFxuICAgICAgICAgIHJlc2VhcmNoVHlwZTogJ3dlYi1zZWFyY2gnIGFzIGNvbnN0LFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGRlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgICAgICAgc291cmNlczogWydzZWN0b3ItcmVwb3J0cycsICdjb21wYW55LWFuYWx5c2lzJ10sXG4gICAgICAgICAgICB0aW1lZnJhbWU6ICdwYXN0LW1vbnRoJyBhcyBjb25zdCxcbiAgICAgICAgICAgIGZvY3VzQXJlYXM6IFtzZWN0b3JdLFxuICAgICAgICAgICAgbWF4UmVzdWx0czogMzBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcXVlc3RzO1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0TWFya2V0SW5zaWdodHMocmVzZWFyY2hSZXN1bHRzOiBhbnlbXSk6IGFueSB7XG4gICAgLy8gRXh0cmFjdCBtYXJrZXQgaW5zaWdodHMgZnJvbSByZXNlYXJjaCByZXN1bHRzXG4gICAgcmV0dXJuIHtcbiAgICAgIHRyZW5kczogcmVzZWFyY2hSZXN1bHRzLmZsYXRNYXAociA9PiByLnRyZW5kcyB8fCBbXSksXG4gICAgICBvcHBvcnR1bml0aWVzOiByZXNlYXJjaFJlc3VsdHMuZmxhdE1hcChyID0+IHIubWFya2V0SW5zaWdodHMgfHwgW10pLFxuICAgICAgcmlza3M6IHJlc2VhcmNoUmVzdWx0cy5mbGF0TWFwKHIgPT4gci5rZXlGaW5kaW5ncz8uZmlsdGVyKChmOiBzdHJpbmcpID0+IGYudG9Mb3dlckNhc2UoKS5pbmNsdWRlcygncmlzaycpKSB8fCBbXSlcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0VHJlbmRBbmFseXNpcyhyZXNlYXJjaFJlc3VsdHM6IGFueVtdKTogYW55IHtcbiAgICAvLyBFeHRyYWN0IHRyZW5kIGFuYWx5c2lzIGZyb20gcmVzZWFyY2ggcmVzdWx0c1xuICAgIHJldHVybiB7XG4gICAgICBlbWVyZ2luZ1RyZW5kczogcmVzZWFyY2hSZXN1bHRzLmZsYXRNYXAociA9PiByLnRyZW5kcyB8fCBbXSksXG4gICAgICBtYXJrZXRTZW50aW1lbnQ6IHJlc2VhcmNoUmVzdWx0cy5tYXAociA9PiByLmNvbmZpZGVuY2UpLmZpbHRlcihCb29sZWFuKSxcbiAgICAgIHRlY2huaWNhbEluZGljYXRvcnM6IHJlc2VhcmNoUmVzdWx0cy5mbGF0TWFwKHIgPT4gci5wYXR0ZXJucyB8fCBbXSlcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0Umlza0Fzc2Vzc21lbnQoYW5hbHlzaXNSZXN1bHQ6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hcmtldFJpc2tzOiBhbmFseXNpc1Jlc3VsdC5yaXNrQXNzZXNzbWVudD8ucmlza0ZhY3RvcnMgfHwgW10sXG4gICAgICBzcGVjaWZpY1Jpc2tzOiBhbmFseXNpc1Jlc3VsdC5yaXNrQXNzZXNzbWVudD8uc3BlY2lmaWNSaXNrcyB8fCBbXSxcbiAgICAgIHJpc2tNaXRpZ2F0aW9uOiBhbmFseXNpc1Jlc3VsdC5yaXNrQXNzZXNzbWVudD8ubWl0aWdhdGlvblN0cmF0ZWdpZXMgfHwgW11cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0T3Bwb3J0dW5pdGllcyhhbmFseXNpc1Jlc3VsdDogYW55KTogYW55W10ge1xuICAgIHJldHVybiBhbmFseXNpc1Jlc3VsdC5yZXN1bHRzPy5tYXAoKHI6IGFueSkgPT4gKHtcbiAgICAgIGlkOiByLmludmVzdG1lbnQ/LmlkIHx8IGBvcHAtJHtEYXRlLm5vdygpfWAsXG4gICAgICB0aXRsZTogci5pbnZlc3RtZW50Py5uYW1lIHx8ICdJbnZlc3RtZW50IE9wcG9ydHVuaXR5JyxcbiAgICAgIGRlc2NyaXB0aW9uOiByLnN1bW1hcnkgfHwgJ0ludmVzdG1lbnQgb3Bwb3J0dW5pdHkgaWRlbnRpZmllZCB0aHJvdWdoIGFuYWx5c2lzJyxcbiAgICAgIGV4cGVjdGVkUmV0dXJuOiByLmV4cGVjdGVkUmV0dXJuIHx8IDAuMSxcbiAgICAgIHJpc2tMZXZlbDogci5yaXNrTGV2ZWwgfHwgJ21vZGVyYXRlJyxcbiAgICAgIGludmVzdG1lbnQ6IHIuaW52ZXN0bWVudFxuICAgIH0pKSB8fCBbXTtcbiAgfVxuXG4gIHByaXZhdGUgZmlsdGVyQnlDb21wbGlhbmNlKG9wcG9ydHVuaXRpZXM6IGFueVtdLCBjb21wbGlhbmNlUmVzdWx0OiBhbnkpOiBhbnlbXSB7XG4gICAgY29uc3QgY3JpdGljYWxJc3N1ZXMgPSBjb21wbGlhbmNlUmVzdWx0LmNvbXBsaWFuY2VSZXN1bHRzPy5mbGF0TWFwKChjcjogYW55KSA9PiBcbiAgICAgIGNyLmlzc3Vlcz8uZmlsdGVyKChpc3N1ZTogYW55KSA9PiBpc3N1ZS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJykgfHwgW11cbiAgICApIHx8IFtdO1xuICAgIFxuICAgIHJldHVybiBvcHBvcnR1bml0aWVzLmZpbHRlcihvcHAgPT4gXG4gICAgICAhY3JpdGljYWxJc3N1ZXMuc29tZSgoaXNzdWU6IGFueSkgPT4gXG4gICAgICAgIGlzc3VlLmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMob3BwLnRpdGxlLnRvTG93ZXJDYXNlKCkpXG4gICAgICApXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29udmVydFRvSW52ZXN0bWVudElkZWFzKFxuICAgIGludmVzdG1lbnRJZGVhczogSW52ZXN0bWVudElkZWFbXSxcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICBtZXRhZGF0YTogR2VuZXJhdGlvbk1ldGFkYXRhXG4gICk6IFByb21pc2U8SW52ZXN0bWVudElkZWFbXT4ge1xuICAgIGNvbnN0IGlkZWFzOiBJbnZlc3RtZW50SWRlYVtdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGlkZWEgb2YgaW52ZXN0bWVudElkZWFzKSB7XG4gICAgICBjb25zdCBjcmVhdGVSZXF1ZXN0OiBDcmVhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QgPSB7XG4gICAgICAgIHRpdGxlOiBpZGVhLnRpdGxlLFxuICAgICAgICBkZXNjcmlwdGlvbjogaWRlYS5kZXNjcmlwdGlvbixcbiAgICAgICAgaW52ZXN0bWVudHM6IGlkZWEuaW52ZXN0bWVudHMgfHwgW10sXG4gICAgICAgIHJhdGlvbmFsZTogaWRlYS5yYXRpb25hbGUsXG4gICAgICAgIHN0cmF0ZWd5OiBpZGVhLnN0cmF0ZWd5IHx8ICdidXknLFxuICAgICAgICB0aW1lSG9yaXpvbjogaWRlYS50aW1lSG9yaXpvbiB8fCAnbWVkaXVtJyxcbiAgICAgICAgY29uZmlkZW5jZVNjb3JlOiBpZGVhLmNvbmZpZGVuY2VTY29yZSB8fCAwLjUsXG4gICAgICAgIHBvdGVudGlhbE91dGNvbWVzOiBpZGVhLnBvdGVudGlhbE91dGNvbWVzIHx8IFtdLFxuICAgICAgICBzdXBwb3J0aW5nRGF0YTogaWRlYS5zdXBwb3J0aW5nRGF0YSB8fCBbXSxcbiAgICAgICAgY291bnRlckFyZ3VtZW50czogaWRlYS5jb3VudGVyQXJndW1lbnRzIHx8IFtdLFxuICAgICAgICBjYXRlZ29yeTogaWRlYS5jYXRlZ29yeSB8fCAnZXF1aXR5JyxcbiAgICAgICAgcmlza0xldmVsOiBpZGVhLnJpc2tMZXZlbCB8fCAnbW9kZXJhdGUnLFxuICAgICAgICB0YXJnZXRBdWRpZW5jZTogaWRlYS50YXJnZXRBdWRpZW5jZSB8fCBbJ3JldGFpbCddLFxuICAgICAgICBjcmVhdGVkQnk6ICdvcmNoZXN0cmF0aW9uLXNlcnZpY2UnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmludmVzdG1lbnRJZGVhU2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYShjcmVhdGVSZXF1ZXN0KTtcbiAgICAgIGlkZWFzLnB1c2gocmVzdWx0LmlkZWEpO1xuICAgIH1cblxuICAgIHJldHVybiBpZGVhcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWN0aXZlIHJlcXVlc3Qgc3RhdHVzXG4gICAqL1xuICBnZXRBY3RpdmVSZXF1ZXN0U3RhdHVzKHJlcXVlc3RJZDogc3RyaW5nKTogSWRlYUdlbmVyYXRpb25SZXF1ZXN0IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVSZXF1ZXN0cy5nZXQocmVxdWVzdElkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYW5jZWwgYWN0aXZlIHJlcXVlc3RcbiAgICovXG4gIGNhbmNlbFJlcXVlc3QocmVxdWVzdElkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVSZXF1ZXN0cy5kZWxldGUocmVxdWVzdElkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcHJvY2Vzc2luZyBzdGF0aXN0aWNzXG4gICAqL1xuICBnZXRQcm9jZXNzaW5nU3RhdGlzdGljcygpOiB7XG4gICAgYWN0aXZlUmVxdWVzdHM6IG51bWJlcjtcbiAgICB0b3RhbFByb2Nlc3NlZDogbnVtYmVyO1xuICAgIGF2ZXJhZ2VQcm9jZXNzaW5nVGltZTogbnVtYmVyO1xuICB9IHtcbiAgICByZXR1cm4ge1xuICAgICAgYWN0aXZlUmVxdWVzdHM6IHRoaXMuYWN0aXZlUmVxdWVzdHMuc2l6ZSxcbiAgICAgIHRvdGFsUHJvY2Vzc2VkOiAwLCAvLyBXb3VsZCBiZSB0cmFja2VkIGluIHJlYWwgaW1wbGVtZW50YXRpb25cbiAgICAgIGF2ZXJhZ2VQcm9jZXNzaW5nVGltZTogMCAvLyBXb3VsZCBiZSBjYWxjdWxhdGVkIGZyb20gaGlzdG9yaWNhbCBkYXRhXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IFRpbWVIb3Jpem9uIHRvIHRoZSBmb3JtYXQgZXhwZWN0ZWQgYnkgYWdlbnRzXG4gICAqL1xuICBwcml2YXRlIGNvbnZlcnRUaW1lSG9yaXpvbih0aW1lSG9yaXpvbjogVGltZUhvcml6b24pOiAnc2hvcnQnIHwgJ21lZGl1bScgfCAnbG9uZycge1xuICAgIHN3aXRjaCAodGltZUhvcml6b24pIHtcbiAgICAgIGNhc2UgJ2ludHJhZGF5JzpcbiAgICAgIGNhc2UgJ3Nob3J0JzpcbiAgICAgICAgcmV0dXJuICdzaG9ydCc7XG4gICAgICBjYXNlICdtZWRpdW0nOlxuICAgICAgICByZXR1cm4gJ21lZGl1bSc7XG4gICAgICBjYXNlICdsb25nJzpcbiAgICAgIGNhc2UgJ3ZlcnktbG9uZyc6XG4gICAgICAgIHJldHVybiAnbG9uZyc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ21lZGl1bSc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgSWRlYUdlbmVyYXRpb25Db250ZXh0IHRvIENvbnZlcnNhdGlvbkNvbnRleHRcbiAgICovXG4gIHByaXZhdGUgY29udmVydFRvQ29udmVyc2F0aW9uQ29udGV4dChyZXF1ZXN0OiBJZGVhR2VuZXJhdGlvblJlcXVlc3QpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogcmVxdWVzdC5yZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IHJlcXVlc3QudXNlcklkLFxuICAgICAgcmVxdWVzdFR5cGU6ICdpbnZlc3RtZW50LWlkZWEtZ2VuZXJhdGlvbicsXG4gICAgICBwYXJhbWV0ZXJzOiByZXF1ZXN0LnBhcmFtZXRlcnMsXG4gICAgICBtZXNzYWdlczogW10sXG4gICAgICB0YXNrczogW10sXG4gICAgICBjdXJyZW50UGhhc2U6ICdwcm9jZXNzaW5nJyxcbiAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIG1ldGFkYXRhOiByZXF1ZXN0LmNvbnRleHQgfHwge31cbiAgICB9O1xuICB9XG59Il19