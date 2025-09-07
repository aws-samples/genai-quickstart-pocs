"use strict";
/**
 * Explanation Service - Generates transparent explanations for AI decisions and recommendations
 * Implements reasoning explanation algorithms, data source attribution, and confidence interval calculation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplanationService = void 0;
class ExplanationService {
    constructor() { }
    /**
     * Generate comprehensive explanation for an investment idea
     */
    async generateExplanation(investmentIdea, analysisResults) {
        const explanationId = this.generateExplanationId();
        // Generate reasoning explanation
        const reasoning = await this.generateReasoningExplanation(investmentIdea, analysisResults);
        // Generate data source attribution
        const dataAttribution = await this.generateDataAttribution(investmentIdea);
        // Generate confidence analysis
        const confidenceAnalysis = await this.generateConfidenceAnalysis(investmentIdea, analysisResults);
        // Generate visualization suggestions
        const visualizations = await this.generateVisualizationSuggestions(investmentIdea, reasoning, dataAttribution, confidenceAnalysis);
        // Generate summary
        const summary = await this.generateExplanationSummary(investmentIdea, reasoning, dataAttribution, confidenceAnalysis);
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
    async generateReasoningExplanation(investmentIdea, analysisResults) {
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
    async generateDataAttribution(investmentIdea) {
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
    async generateConfidenceAnalysis(investmentIdea, analysisResults) {
        // Break down confidence by components
        const confidenceBreakdown = this.calculateConfidenceBreakdown(investmentIdea, analysisResults);
        // Identify uncertainty factors
        const uncertaintyFactors = this.identifyUncertaintyFactors(investmentIdea);
        // Calculate confidence interval
        const confidenceInterval = this.calculateConfidenceInterval(investmentIdea);
        // Perform sensitivity analysis
        const sensitivityAnalysis = this.performSensitivityAnalysis(investmentIdea);
        // Calculate overall confidence
        const overallConfidence = this.calculateOverallConfidence(confidenceBreakdown, uncertaintyFactors, investmentIdea.confidenceScore);
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
    extractDecisionPath(investmentIdea) {
        const steps = [];
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
    identifyKeyFactors(investmentIdea) {
        const factors = [];
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
    buildLogicalChain(keyFactors, investmentIdea) {
        const connections = [];
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
    extractAssumptions(investmentIdea) {
        const assumptions = [];
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
    generateAlternativeScenarios(investmentIdea) {
        const scenarios = [];
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
    groupDataPointsBySource(dataPoints) {
        return dataPoints.reduce((groups, dataPoint) => {
            if (!groups[dataPoint.source]) {
                groups[dataPoint.source] = [];
            }
            groups[dataPoint.source].push(dataPoint);
            return groups;
        }, {});
    }
    /**
     * Create source attributions from grouped data points
     */
    createSourceAttributions(sourceGroups, investmentIdea) {
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
    calculateConfidenceInterval(investmentIdea) {
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
    performSensitivityAnalysis(investmentIdea) {
        const keyVariables = [
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
        const scenarios = [
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
    generateExplanationId() {
        return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSourceId(sourceName) {
        return `src_${sourceName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }
    parseRationaleSteps(rationale) {
        // Simple parsing - in a real implementation, this would use NLP
        const sentences = rationale.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.map((sentence, index) => ({
            description: sentence.trim(),
            reasoning: `Step ${index + 1} in the analysis`,
            confidence: 0.8,
            impact: 'medium',
            alternatives: []
        }));
    }
    findRelevantDataPoints(step, dataPoints) {
        // Simple relevance matching - in a real implementation, this would use semantic similarity
        return dataPoints.filter(dp => step.description.toLowerCase().includes(dp.type) ||
            step.description.toLowerCase().includes(dp.source.toLowerCase()));
    }
    groupDataPointsByType(dataPoints) {
        return dataPoints.reduce((groups, dataPoint) => {
            if (!groups[dataPoint.type]) {
                groups[dataPoint.type] = [];
            }
            groups[dataPoint.type].push(dataPoint);
            return groups;
        }, {});
    }
    createKeyFactor(type, dataPoints, investmentIdea) {
        if (dataPoints.length === 0)
            return null;
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
    determineFactorDirection(dataPoints, investmentIdea) {
        // Simple heuristic - in a real implementation, this would analyze the actual data values
        const expectedOutcome = investmentIdea.potentialOutcomes.find(o => o.scenario === 'expected');
        if (expectedOutcome && expectedOutcome.returnEstimate > 0) {
            return 'positive';
        }
        else if (expectedOutcome && expectedOutcome.returnEstimate < 0) {
            return 'negative';
        }
        return 'neutral';
    }
    analyzeFactorRelationship(factor1, factor2, investmentIdea) {
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
    extractAssumptionsFromText(text) {
        // Simple assumption extraction - in a real implementation, this would use NLP
        const assumptionKeywords = ['assume', 'assuming', 'expect', 'likely', 'probable', 'if'];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences
            .filter(sentence => assumptionKeywords.some(keyword => sentence.toLowerCase().includes(keyword)))
            .map(sentence => ({
            description: sentence.trim(),
            type: 'market',
            confidence: 0.7,
            impact: 'medium',
            validation: [],
            risks: []
        }));
    }
    categorizeAssumption(condition) {
        const lowerCondition = condition.toLowerCase();
        if (lowerCondition.includes('market') || lowerCondition.includes('price'))
            return 'market';
        if (lowerCondition.includes('economic') || lowerCondition.includes('gdp') || lowerCondition.includes('inflation'))
            return 'economic';
        if (lowerCondition.includes('company') || lowerCondition.includes('earnings') || lowerCondition.includes('revenue'))
            return 'company';
        if (lowerCondition.includes('regulation') || lowerCondition.includes('policy') || lowerCondition.includes('law'))
            return 'regulatory';
        return 'technical';
    }
    createAlternativeOutcome(counterArg, investmentIdea) {
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
    calculateSourceContribution(dataPoints, investmentIdea) {
        const totalDataPoints = investmentIdea.supportingData.length;
        const sourceDataPoints = dataPoints.length;
        const avgReliability = dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
        return (sourceDataPoints / totalDataPoints) * avgReliability;
    }
    calculateSourceReliability(dataPoints) {
        return dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
    }
    categorizeSourceType(sourceName) {
        const lowerSource = sourceName.toLowerCase();
        if (lowerSource.includes('proprietary') || lowerSource.includes('internal'))
            return 'proprietary';
        if (lowerSource.includes('market') || lowerSource.includes('bloomberg') || lowerSource.includes('reuters'))
            return 'market';
        if (lowerSource.includes('news') || lowerSource.includes('media'))
            return 'news';
        if (lowerSource.includes('research') || lowerSource.includes('analyst'))
            return 'research';
        if (lowerSource.includes('sec') || lowerSource.includes('regulatory'))
            return 'regulatory';
        return 'public';
    }
    getLatestTimestamp(dataPoints) {
        return dataPoints.reduce((latest, dp) => dp.timestamp > latest ? dp.timestamp : latest, new Date(0));
    }
    determineAccessLevel(sourceName) {
        const lowerSource = sourceName.toLowerCase();
        if (lowerSource.includes('proprietary') || lowerSource.includes('internal'))
            return 'proprietary';
        if (lowerSource.includes('restricted') || lowerSource.includes('premium'))
            return 'restricted';
        return 'public';
    }
    assessReliability(sources, dataPoints) {
        const overallScore = sources.reduce((sum, source) => sum + source.reliability * source.contribution, 0);
        const sourceReliability = sources.reduce((acc, source) => {
            acc[source.sourceName] = source.reliability;
            return acc;
        }, {});
        const dataQuality = {
            completeness: Math.min(dataPoints.length / 20, 1),
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
    analyzeCoverage(sources) {
        const totalDataPoints = sources.reduce((sum, source) => sum + source.dataPoints.length, 0);
        const sourceDistribution = sources.reduce((acc, source) => {
            acc[source.sourceName] = source.dataPoints.length;
            return acc;
        }, {});
        const topicCoverage = sources.reduce((acc, source) => {
            source.dataPoints.forEach(dp => {
                acc[dp.type] = (acc[dp.type] || 0) + 1;
            });
            return acc;
        }, {});
        return {
            totalDataPoints,
            sourceDistribution,
            topicCoverage,
            gapsIdentified: this.identifyDataGaps(topicCoverage)
        };
    }
    analyzeFreshness(dataPoints) {
        const now = new Date();
        const ages = dataPoints.map(dp => now.getTime() - dp.timestamp.getTime());
        const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length / (1000 * 60 * 60); // in hours
        const oldestDataPoint = dataPoints.reduce((oldest, dp) => dp.timestamp < oldest ? dp.timestamp : oldest, new Date());
        const newestDataPoint = dataPoints.reduce((newest, dp) => dp.timestamp > newest ? dp.timestamp : newest, new Date(0));
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
    identifyDataConflicts(dataPoints, counterArguments) {
        const conflicts = [];
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
    calculateConfidenceBreakdown(investmentIdea, analysisResults) {
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
    identifyUncertaintyFactors(investmentIdea) {
        const factors = [];
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
    calculateOverallConfidence(breakdown, uncertaintyFactors, baseConfidence) {
        const breakdownAverage = (breakdown.dataQuality +
            breakdown.modelReliability +
            breakdown.marketConditions +
            breakdown.timeHorizon +
            breakdown.complexity) / 5;
        const uncertaintyReduction = uncertaintyFactors.reduce((sum, factor) => sum + factor.impact, 0);
        return Math.max(0, Math.min(1, (baseConfidence + breakdownAverage) / 2 - uncertaintyReduction));
    }
    calculateRobustness(scenarios, baseConfidence) {
        const confidenceVariations = scenarios.map(scenario => Math.abs(scenario.resultingConfidence - baseConfidence));
        const maxVariation = Math.max(...confidenceVariations);
        return Math.max(0, 1 - maxVariation);
    }
    // Additional helper methods
    calculateConsistency(dataPoints) {
        // Simple consistency calculation - in a real implementation, this would analyze data consistency
        return 0.8;
    }
    calculateTimeliness(dataPoints) {
        const now = new Date();
        const avgAge = dataPoints.reduce((sum, dp) => sum + (now.getTime() - dp.timestamp.getTime()), 0) / dataPoints.length;
        const maxAcceptableAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        return Math.max(0, 1 - (avgAge / maxAcceptableAge));
    }
    identifyDataGaps(topicCoverage) {
        const requiredTopics = ['fundamental', 'technical', 'sentiment', 'news', 'research'];
        return requiredTopics.filter(topic => !topicCoverage[topic] || topicCoverage[topic] < 2);
    }
    calculateDataQualityScore(dataPoints) {
        if (dataPoints.length === 0)
            return 0;
        return dataPoints.reduce((sum, dp) => sum + dp.reliability, 0) / dataPoints.length;
    }
    assessMarketConditions(investmentIdea) {
        // Simple market conditions assessment based on metadata
        const marketConditions = investmentIdea.metadata?.marketConditionsAtGeneration;
        if (!marketConditions)
            return 0.7;
        let score = 0.5;
        if (marketConditions.marketTrend === 'bull')
            score += 0.2;
        if (marketConditions.volatilityIndex < 20)
            score += 0.2;
        if (marketConditions.geopoliticalRisk === 'low')
            score += 0.1;
        return Math.min(1, score);
    }
    assessTimeHorizonConfidence(timeHorizon) {
        const confidenceMap = {
            'intraday': 0.6,
            'short': 0.7,
            'medium': 0.8,
            'long': 0.9,
            'very-long': 0.7
        };
        return confidenceMap[timeHorizon] || 0.7;
    }
    assessComplexity(investmentIdea) {
        let complexity = 0.8;
        // Reduce confidence for complex strategies
        if (investmentIdea.strategy === 'complex')
            complexity -= 0.2;
        if (investmentIdea.investments.length > 5)
            complexity -= 0.1;
        if (investmentIdea.counterArguments.length > 3)
            complexity -= 0.1;
        return Math.max(0.3, complexity);
    }
    async generateVisualizationSuggestions(investmentIdea, reasoning, dataAttribution, confidenceAnalysis) {
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
    async generateExplanationSummary(investmentIdea, reasoning, dataAttribution, confidenceAnalysis) {
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
exports.ExplanationService = ExplanationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwbGFuYXRpb24tc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9leHBsYW5hdGlvbi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQThMSCxNQUFhLGtCQUFrQjtJQUM3QixnQkFBZSxDQUFDO0lBRWhCOztPQUVHO0lBQ0gsS0FBSyxDQUFDLG1CQUFtQixDQUN2QixjQUE4QixFQUM5QixlQUFrQztRQUVsQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUVuRCxpQ0FBaUM7UUFDakMsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsNEJBQTRCLENBQUMsY0FBYyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRTNGLG1DQUFtQztRQUNuQyxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUUzRSwrQkFBK0I7UUFDL0IsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxjQUFjLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFbEcscUNBQXFDO1FBQ3JDLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdDQUFnQyxDQUNoRSxjQUFjLEVBQ2QsU0FBUyxFQUNULGVBQWUsRUFDZixrQkFBa0IsQ0FDbkIsQ0FBQztRQUVGLG1CQUFtQjtRQUNuQixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQywwQkFBMEIsQ0FDbkQsY0FBYyxFQUNkLFNBQVMsRUFDVCxlQUFlLEVBQ2Ysa0JBQWtCLENBQ25CLENBQUM7UUFFRixPQUFPO1lBQ0wsRUFBRSxFQUFFLGFBQWE7WUFDakIsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLEVBQUU7WUFDbkMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ3JCLFNBQVM7WUFDVCxlQUFlO1lBQ2Ysa0JBQWtCO1lBQ2xCLGNB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Q0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO2FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVkLE1BQU0sY0FBYyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO1FBRXBGLE9BQU8sb0NBQW9DLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxnREFBZ0QsY0FBYyxJQUFJO1lBQ2pJLDJCQUEyQixlQUFlLENBQUMsT0FBTyxDQUFDLE1BQU0sMkJBQTJCLGVBQWUsSUFBSTtZQUN2RyxnREFBZ0QsY0FBYyxrQ0FBa0M7WUFDaEcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDO0lBQ25KLENBQUM7Q0FDRjtBQXYxQkQsZ0RBdTFCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRXhwbGFuYXRpb24gU2VydmljZSAtIEdlbmVyYXRlcyB0cmFuc3BhcmVudCBleHBsYW5hdGlvbnMgZm9yIEFJIGRlY2lzaW9ucyBhbmQgcmVjb21tZW5kYXRpb25zXG4gKiBJbXBsZW1lbnRzIHJlYXNvbmluZyBleHBsYW5hdGlvbiBhbGdvcml0aG1zLCBkYXRhIHNvdXJjZSBhdHRyaWJ1dGlvbiwgYW5kIGNvbmZpZGVuY2UgaW50ZXJ2YWwgY2FsY3VsYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYSwgT3V0Y29tZSwgQ291bnRlckFyZ3VtZW50IH0gZnJvbSAnLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBEYXRhUG9pbnQsIEFuYWx5c2lzUmVzdWx0IH0gZnJvbSAnLi4vbW9kZWxzL2FuYWx5c2lzJztcbmltcG9ydCB7IEludmVzdG1lbnQgfSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwbGFuYXRpb25SZXN1bHQge1xuICBpZDogc3RyaW5nO1xuICBpbnZlc3RtZW50SWRlYUlkOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogRGF0ZTtcbiAgcmVhc29uaW5nOiBSZWFzb25pbmdFeHBsYW5hdGlvbjtcbiAgZGF0YUF0dHJpYnV0aW9uOiBEYXRhU291cmNlQXR0cmlidXRpb247XG4gIGNvbmZpZGVuY2VBbmFseXNpczogQ29uZmlkZW5jZUFuYWx5c2lzO1xuICB2aXN1YWxpemF0aW9uczogVmlzdWFsaXphdGlvblN1Z2dlc3Rpb25bXTtcbiAgc3VtbWFyeTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlYXNvbmluZ0V4cGxhbmF0aW9uIHtcbiAgZGVjaXNpb25QYXRoOiBEZWNpc2lvblN0ZXBbXTtcbiAga2V5RmFjdG9yczogS2V5RmFjdG9yW107XG4gIGxvZ2ljYWxDaGFpbjogTG9naWNhbENvbm5lY3Rpb25bXTtcbiAgYXNzdW1wdGlvbnM6IEFzc3VtcHRpb25bXTtcbiAgYWx0ZXJuYXRpdmVTY2VuYXJpb3M6IEFsdGVybmF0aXZlU2NlbmFyaW9bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZWNpc2lvblN0ZXAge1xuICBzdGVwTnVtYmVyOiBudW1iZXI7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGlucHV0RGF0YTogRGF0YVBvaW50W107XG4gIHJlYXNvbmluZzogc3RyaW5nO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG4gIGltcGFjdDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAgYWx0ZXJuYXRpdmVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLZXlGYWN0b3Ige1xuICBuYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIHdlaWdodDogbnVtYmVyOyAvLyAwLTEsIGltcG9ydGFuY2UgaW4gZGVjaXNpb25cbiAgZGlyZWN0aW9uOiAncG9zaXRpdmUnIHwgJ25lZ2F0aXZlJyB8ICduZXV0cmFsJztcbiAgZXZpZGVuY2U6IERhdGFQb2ludFtdO1xuICBjb25maWRlbmNlTGV2ZWw6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMb2dpY2FsQ29ubmVjdGlvbiB7XG4gIGZyb206IHN0cmluZztcbiAgdG86IHN0cmluZztcbiAgcmVsYXRpb25zaGlwOiAnY2F1c2VzJyB8ICdjb3JyZWxhdGVzJyB8ICdzdXBwb3J0cycgfCAnY29udHJhZGljdHMnIHwgJ2ltcGxpZXMnO1xuICBzdHJlbmd0aDogbnVtYmVyOyAvLyAwLTFcbiAgZXZpZGVuY2U6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzc3VtcHRpb24ge1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICB0eXBlOiAnbWFya2V0JyB8ICdlY29ub21pYycgfCAnY29tcGFueScgfCAncmVndWxhdG9yeScgfCAndGVjaG5pY2FsJztcbiAgY29uZmlkZW5jZTogbnVtYmVyO1xuICBpbXBhY3Q6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG4gIHZhbGlkYXRpb246IHN0cmluZ1tdO1xuICByaXNrczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWx0ZXJuYXRpdmVTY2VuYXJpbyB7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgcHJvYmFiaWxpdHk6IG51bWJlcjtcbiAgb3V0Y29tZTogT3V0Y29tZTtcbiAga2V5RGlmZmVyZW5jZXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFTb3VyY2VBdHRyaWJ1dGlvbiB7XG4gIHNvdXJjZXM6IFNvdXJjZUF0dHJpYnV0aW9uW107XG4gIHJlbGlhYmlsaXR5OiBSZWxpYWJpbGl0eUFzc2Vzc21lbnQ7XG4gIGNvdmVyYWdlOiBDb3ZlcmFnZUFuYWx5c2lzO1xuICBmcmVzaG5lc3M6IEZyZXNobmVzc0FuYWx5c2lzO1xuICBjb25mbGljdHM6IERhdGFDb25mbGljdFtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUF0dHJpYnV0aW9uIHtcbiAgc291cmNlSWQ6IHN0cmluZztcbiAgc291cmNlTmFtZTogc3RyaW5nO1xuICBzb3VyY2VUeXBlOiAncHJvcHJpZXRhcnknIHwgJ3B1YmxpYycgfCAnbWFya2V0JyB8ICduZXdzJyB8ICdyZXNlYXJjaCcgfCAncmVndWxhdG9yeSc7XG4gIGRhdGFQb2ludHM6IERhdGFQb2ludFtdO1xuICBjb250cmlidXRpb246IG51bWJlcjsgLy8gMC0xLCBob3cgbXVjaCB0aGlzIHNvdXJjZSBjb250cmlidXRlZCB0byB0aGUgZGVjaXNpb25cbiAgcmVsaWFiaWxpdHk6IG51bWJlcjsgLy8gMC0xXG4gIGxhc3RVcGRhdGVkOiBEYXRlO1xuICBhY2Nlc3NMZXZlbDogJ3B1YmxpYycgfCAncmVzdHJpY3RlZCcgfCAncHJvcHJpZXRhcnknO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJlbGlhYmlsaXR5QXNzZXNzbWVudCB7XG4gIG92ZXJhbGxTY29yZTogbnVtYmVyOyAvLyAwLTFcbiAgc291cmNlUmVsaWFiaWxpdHk6IFJlY29yZDxzdHJpbmcsIG51bWJlcj47XG4gIGRhdGFRdWFsaXR5OiBEYXRhUXVhbGl0eU1ldHJpY3M7XG4gIGNyb3NzVmFsaWRhdGlvbjogQ3Jvc3NWYWxpZGF0aW9uUmVzdWx0W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVF1YWxpdHlNZXRyaWNzIHtcbiAgY29tcGxldGVuZXNzOiBudW1iZXI7IC8vIDAtMVxuICBhY2N1cmFjeTogbnVtYmVyOyAvLyAwLTFcbiAgY29uc2lzdGVuY3k6IG51bWJlcjsgLy8gMC0xXG4gIHRpbWVsaW5lc3M6IG51bWJlcjsgLy8gMC0xXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3Jvc3NWYWxpZGF0aW9uUmVzdWx0IHtcbiAgZGF0YVBvaW50OiBzdHJpbmc7XG4gIHNvdXJjZXM6IHN0cmluZ1tdO1xuICBhZ3JlZW1lbnQ6IG51bWJlcjsgLy8gMC0xXG4gIGRpc2NyZXBhbmNpZXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvdmVyYWdlQW5hbHlzaXMge1xuICB0b3RhbERhdGFQb2ludHM6IG51bWJlcjtcbiAgc291cmNlRGlzdHJpYnV0aW9uOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICB0b3BpY0NvdmVyYWdlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICBnYXBzSWRlbnRpZmllZDogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRnJlc2huZXNzQW5hbHlzaXMge1xuICBhdmVyYWdlQWdlOiBudW1iZXI7IC8vIGluIGhvdXJzXG4gIG9sZGVzdERhdGFQb2ludDogRGF0ZTtcbiAgbmV3ZXN0RGF0YVBvaW50OiBEYXRlO1xuICBzdGFsZURhdGFXYXJuaW5nczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YUNvbmZsaWN0IHtcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgY29uZmxpY3RpbmdTb3VyY2VzOiBzdHJpbmdbXTtcbiAgc2V2ZXJpdHk6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG4gIHJlc29sdXRpb246IHN0cmluZztcbiAgaW1wYWN0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlkZW5jZUFuYWx5c2lzIHtcbiAgb3ZlcmFsbENvbmZpZGVuY2U6IG51bWJlcjsgLy8gMC0xXG4gIGNvbmZpZGVuY2VCcmVha2Rvd246IENvbmZpZGVuY2VCcmVha2Rvd247XG4gIHVuY2VydGFpbnR5RmFjdG9yczogVW5jZXJ0YWludHlGYWN0b3JbXTtcbiAgY29uZmlkZW5jZUludGVydmFsOiBFeHBsYW5hdGlvbkNvbmZpZGVuY2VJbnRlcnZhbDtcbiAgc2Vuc2l0aXZpdHlBbmFseXNpczogRXhwbGFuYXRpb25TZW5zaXRpdml0eUFuYWx5c2lzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZGVuY2VCcmVha2Rvd24ge1xuICBkYXRhUXVhbGl0eTogbnVtYmVyOyAvLyAwLTFcbiAgbW9kZWxSZWxpYWJpbGl0eTogbnVtYmVyOyAvLyAwLTFcbiAgbWFya2V0Q29uZGl0aW9uczogbnVtYmVyOyAvLyAwLTFcbiAgdGltZUhvcml6b246IG51bWJlcjsgLy8gMC0xXG4gIGNvbXBsZXhpdHk6IG51bWJlcjsgLy8gMC0xXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVW5jZXJ0YWludHlGYWN0b3Ige1xuICBmYWN0b3I6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgaW1wYWN0OiBudW1iZXI7IC8vIDAtMSwgaG93IG11Y2ggdGhpcyByZWR1Y2VzIGNvbmZpZGVuY2VcbiAgbWl0aWdhdGlvbjogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwbGFuYXRpb25Db25maWRlbmNlSW50ZXJ2YWwge1xuICBsb3dlcjogbnVtYmVyO1xuICB1cHBlcjogbnVtYmVyO1xuICBsZXZlbDogbnVtYmVyOyAvLyBlLmcuLCAwLjk1IGZvciA5NSUgY29uZmlkZW5jZVxuICBtZXRob2RvbG9neTogc3RyaW5nO1xuICBhc3N1bXB0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwbGFuYXRpb25TZW5zaXRpdml0eUFuYWx5c2lzIHtcbiAga2V5VmFyaWFibGVzOiBFeHBsYW5hdGlvblNlbnNpdGl2aXR5VmFyaWFibGVbXTtcbiAgc2NlbmFyaW9zOiBTZW5zaXRpdml0eVNjZW5hcmlvW107XG4gIHJvYnVzdG5lc3M6IG51bWJlcjsgLy8gMC0xXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhwbGFuYXRpb25TZW5zaXRpdml0eVZhcmlhYmxlIHtcbiAgbmFtZTogc3RyaW5nO1xuICBiYXNlVmFsdWU6IG51bWJlcjtcbiAgcmFuZ2U6IHsgbWluOiBudW1iZXI7IG1heDogbnVtYmVyIH07XG4gIGltcGFjdDogbnVtYmVyOyAvLyBob3cgbXVjaCBjaGFuZ2luZyB0aGlzIGFmZmVjdHMgdGhlIG91dGNvbWVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZW5zaXRpdml0eVNjZW5hcmlvIHtcbiAgbmFtZTogc3RyaW5nO1xuICBjaGFuZ2VzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICByZXN1bHRpbmdDb25maWRlbmNlOiBudW1iZXI7XG4gIG91dGNvbWVDaGFuZ2U6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWaXN1YWxpemF0aW9uU3VnZ2VzdGlvbiB7XG4gIHR5cGU6ICdkZWNpc2lvbi10cmVlJyB8ICdmYWN0b3ItaW1wb3J0YW5jZScgfCAnY29uZmlkZW5jZS1iYW5kcycgfCAnZGF0YS1mbG93JyB8ICdzY2VuYXJpby1jb21wYXJpc29uJztcbiAgdGl0bGU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgZGF0YTogYW55O1xuICBwcmlvcml0eTogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbn1cblxuZXhwb3J0IGNsYXNzIEV4cGxhbmF0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKCkge31cblxuICAvKipcbiAgICogR2VuZXJhdGUgY29tcHJlaGVuc2l2ZSBleHBsYW5hdGlvbiBmb3IgYW4gaW52ZXN0bWVudCBpZGVhXG4gICAqL1xuICBhc3luYyBnZW5lcmF0ZUV4cGxhbmF0aW9uKFxuICAgIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSxcbiAgICBhbmFseXNpc1Jlc3VsdHM/OiBBbmFseXNpc1Jlc3VsdFtdXG4gICk6IFByb21pc2U8RXhwbGFuYXRpb25SZXN1bHQ+IHtcbiAgICBjb25zdCBleHBsYW5hdGlvbklkID0gdGhpcy5nZW5lcmF0ZUV4cGxhbmF0aW9uSWQoKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSByZWFzb25pbmcgZXhwbGFuYXRpb25cbiAgICBjb25zdCByZWFzb25pbmcgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUmVhc29uaW5nRXhwbGFuYXRpb24oaW52ZXN0bWVudElkZWEsIGFuYWx5c2lzUmVzdWx0cyk7XG4gICAgXG4gICAgLy8gR2VuZXJhdGUgZGF0YSBzb3VyY2UgYXR0cmlidXRpb25cbiAgICBjb25zdCBkYXRhQXR0cmlidXRpb24gPSBhd2FpdCB0aGlzLmdlbmVyYXRlRGF0YUF0dHJpYnV0aW9uKGludmVzdG1lbnRJZGVhKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBjb25maWRlbmNlIGFuYWx5c2lzXG4gICAgY29uc3QgY29uZmlkZW5jZUFuYWx5c2lzID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUNvbmZpZGVuY2VBbmFseXNpcyhpbnZlc3RtZW50SWRlYSwgYW5hbHlzaXNSZXN1bHRzKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSB2aXN1YWxpemF0aW9uIHN1Z2dlc3Rpb25zXG4gICAgY29uc3QgdmlzdWFsaXphdGlvbnMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlVmlzdWFsaXphdGlvblN1Z2dlc3Rpb25zKFxuICAgICAgaW52ZXN0bWVudElkZWEsXG4gICAgICByZWFzb25pbmcsXG4gICAgICBkYXRhQXR0cmlidXRpb24sXG4gICAgICBjb25maWRlbmNlQW5hbHlzaXNcbiAgICApO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIHN1bW1hcnlcbiAgICBjb25zdCBzdW1tYXJ5ID0gYXdhaXQgdGhpcy5nZW5lcmF0ZUV4cGxhbmF0aW9uU3VtbWFyeShcbiAgICAgIGludmVzdG1lbnRJZGVhLFxuICAgICAgcmVhc29uaW5nLFxuICAgICAgZGF0YUF0dHJpYnV0aW9uLFxuICAgICAgY29uZmlkZW5jZUFuYWx5c2lzXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpZDogZXhwbGFuYXRpb25JZCxcbiAgICAgIGludmVzdG1lbnRJZGVhSWQ6IGludmVzdG1lbnRJZGVhLmlkLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgcmVhc29uaW5nLFxuICAgICAgZGF0YUF0dHJpYnV0aW9uLFxuICAgICAgY29uZmlkZW5jZUFuYWx5c2lzLFxuICAgICAgdmlzdWFsaXphdGlvbnMsXG4gICAgICBzdW1tYXJ5XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSByZWFzb25pbmcgZXhwbGFuYXRpb24gc2hvd2luZyBkZWNpc2lvbiBwYXRoIGFuZCBrZXkgZmFjdG9yc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVJlYXNvbmluZ0V4cGxhbmF0aW9uKFxuICAgIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSxcbiAgICBhbmFseXNpc1Jlc3VsdHM/OiBBbmFseXNpc1Jlc3VsdFtdXG4gICk6IFByb21pc2U8UmVhc29uaW5nRXhwbGFuYXRpb24+IHtcbiAgICAvLyBFeHRyYWN0IGRlY2lzaW9uIHN0ZXBzIGZyb20gcmF0aW9uYWxlIGFuZCBzdXBwb3J0aW5nIGRhdGFcbiAgICBjb25zdCBkZWNpc2lvblBhdGggPSB0aGlzLmV4dHJhY3REZWNpc2lvblBhdGgoaW52ZXN0bWVudElkZWEpO1xuICAgIFxuICAgIC8vIElkZW50aWZ5IGtleSBmYWN0b3JzIHRoYXQgaW5mbHVlbmNlZCB0aGUgZGVjaXNpb25cbiAgICBjb25zdCBrZXlGYWN0b3JzID0gdGhpcy5pZGVudGlmeUtleUZhY3RvcnMoaW52ZXN0bWVudElkZWEpO1xuICAgIFxuICAgIC8vIEJ1aWxkIGxvZ2ljYWwgY29ubmVjdGlvbnMgYmV0d2VlbiBmYWN0b3JzXG4gICAgY29uc3QgbG9naWNhbENoYWluID0gdGhpcy5idWlsZExvZ2ljYWxDaGFpbihrZXlGYWN0b3JzLCBpbnZlc3RtZW50SWRlYSk7XG4gICAgXG4gICAgLy8gRXh0cmFjdCBhc3N1bXB0aW9uc1xuICAgIGNvbnN0IGFzc3VtcHRpb25zID0gdGhpcy5leHRyYWN0QXNzdW1wdGlvbnMoaW52ZXN0bWVudElkZWEpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIGFsdGVybmF0aXZlIHNjZW5hcmlvc1xuICAgIGNvbnN0IGFsdGVybmF0aXZlU2NlbmFyaW9zID0gdGhpcy5nZW5lcmF0ZUFsdGVybmF0aXZlU2NlbmFyaW9zKGludmVzdG1lbnRJZGVhKTtcblxuICAgIHJldHVybiB7XG4gICAgICBkZWNpc2lvblBhdGgsXG4gICAgICBrZXlGYWN0b3JzLFxuICAgICAgbG9naWNhbENoYWluLFxuICAgICAgYXNzdW1wdGlvbnMsXG4gICAgICBhbHRlcm5hdGl2ZVNjZW5hcmlvc1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgZGF0YSBzb3VyY2UgYXR0cmlidXRpb24gc2hvd2luZyB3aGVyZSBpbmZvcm1hdGlvbiBjYW1lIGZyb21cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVEYXRhQXR0cmlidXRpb24oaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhKTogUHJvbWlzZTxEYXRhU291cmNlQXR0cmlidXRpb24+IHtcbiAgICAvLyBHcm91cCBkYXRhIHBvaW50cyBieSBzb3VyY2VcbiAgICBjb25zdCBzb3VyY2VHcm91cHMgPSB0aGlzLmdyb3VwRGF0YVBvaW50c0J5U291cmNlKGludmVzdG1lbnRJZGVhLnN1cHBvcnRpbmdEYXRhKTtcbiAgICBcbiAgICAvLyBDcmVhdGUgc291cmNlIGF0dHJpYnV0aW9uc1xuICAgIGNvbnN0IHNvdXJjZXMgPSB0aGlzLmNyZWF0ZVNvdXJjZUF0dHJpYnV0aW9ucyhzb3VyY2VHcm91cHMsIGludmVzdG1lbnRJZGVhKTtcbiAgICBcbiAgICAvLyBBc3Nlc3MgcmVsaWFiaWxpdHlcbiAgICBjb25zdCByZWxpYWJpbGl0eSA9IHRoaXMuYXNzZXNzUmVsaWFiaWxpdHkoc291cmNlcywgaW52ZXN0bWVudElkZWEuc3VwcG9ydGluZ0RhdGEpO1xuICAgIFxuICAgIC8vIEFuYWx5emUgY292ZXJhZ2VcbiAgICBjb25zdCBjb3ZlcmFnZSA9IHRoaXMuYW5hbHl6ZUNvdmVyYWdlKHNvdXJjZXMpO1xuICAgIFxuICAgIC8vIEFuYWx5emUgZnJlc2huZXNzXG4gICAgY29uc3QgZnJlc2huZXNzID0gdGhpcy5hbmFseXplRnJlc2huZXNzKGludmVzdG1lbnRJZGVhLnN1cHBvcnRpbmdEYXRhKTtcbiAgICBcbiAgICAvLyBJZGVudGlmeSBjb25mbGljdHNcbiAgICBjb25zdCBjb25mbGljdHMgPSB0aGlzLmlkZW50aWZ5RGF0YUNvbmZsaWN0cyhpbnZlc3RtZW50SWRlYS5zdXBwb3J0aW5nRGF0YSwgaW52ZXN0bWVudElkZWEuY291bnRlckFyZ3VtZW50cyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc291cmNlcyxcbiAgICAgIHJlbGlhYmlsaXR5LFxuICAgICAgY292ZXJhZ2UsXG4gICAgICBmcmVzaG5lc3MsXG4gICAgICBjb25mbGljdHNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGNvbmZpZGVuY2UgYW5hbHlzaXMgd2l0aCBpbnRlcnZhbHMgYW5kIHVuY2VydGFpbnR5IGZhY3RvcnNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVDb25maWRlbmNlQW5hbHlzaXMoXG4gICAgaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhLFxuICAgIGFuYWx5c2lzUmVzdWx0cz86IEFuYWx5c2lzUmVzdWx0W11cbiAgKTogUHJvbWlzZTxDb25maWRlbmNlQW5hbHlzaXM+IHtcbiAgICAvLyBCcmVhayBkb3duIGNvbmZpZGVuY2UgYnkgY29tcG9uZW50c1xuICAgIGNvbnN0IGNvbmZpZGVuY2VCcmVha2Rvd24gPSB0aGlzLmNhbGN1bGF0ZUNvbmZpZGVuY2VCcmVha2Rvd24oaW52ZXN0bWVudElkZWEsIGFuYWx5c2lzUmVzdWx0cyk7XG4gICAgXG4gICAgLy8gSWRlbnRpZnkgdW5jZXJ0YWludHkgZmFjdG9yc1xuICAgIGNvbnN0IHVuY2VydGFpbnR5RmFjdG9ycyA9IHRoaXMuaWRlbnRpZnlVbmNlcnRhaW50eUZhY3RvcnMoaW52ZXN0bWVudElkZWEpO1xuICAgIFxuICAgIC8vIENhbGN1bGF0ZSBjb25maWRlbmNlIGludGVydmFsXG4gICAgY29uc3QgY29uZmlkZW5jZUludGVydmFsID0gdGhpcy5jYWxjdWxhdGVDb25maWRlbmNlSW50ZXJ2YWwoaW52ZXN0bWVudElkZWEpO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gc2Vuc2l0aXZpdHkgYW5hbHlzaXNcbiAgICBjb25zdCBzZW5zaXRpdml0eUFuYWx5c2lzID0gdGhpcy5wZXJmb3JtU2Vuc2l0aXZpdHlBbmFseXNpcyhpbnZlc3RtZW50SWRlYSk7XG4gICAgXG4gICAgLy8gQ2FsY3VsYXRlIG92ZXJhbGwgY29uZmlkZW5jZVxuICAgIGNvbnN0IG92ZXJhbGxDb25maWRlbmNlID0gdGhpcy5jYWxjdWxhdGVPdmVyYWxsQ29uZmlkZW5jZShcbiAgICAgIGNvbmZpZGVuY2VCcmVha2Rvd24sXG4gICAgICB1bmNlcnRhaW50eUZhY3RvcnMsXG4gICAgICBpbnZlc3RtZW50SWRlYS5jb25maWRlbmNlU2NvcmVcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG92ZXJhbGxDb25maWRlbmNlLFxuICAgICAgY29uZmlkZW5jZUJyZWFrZG93bixcbiAgICAgIHVuY2VydGFpbnR5RmFjdG9ycyxcbiAgICAgIGNvbmZpZGVuY2VJbnRlcnZhbCxcbiAgICAgIHNlbnNpdGl2aXR5QW5hbHlzaXNcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3QgZGVjaXNpb24gc3RlcHMgZnJvbSBpbnZlc3RtZW50IGlkZWEgcmF0aW9uYWxlXG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3REZWNpc2lvblBhdGgoaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhKTogRGVjaXNpb25TdGVwW10ge1xuICAgIGNvbnN0IHN0ZXBzOiBEZWNpc2lvblN0ZXBbXSA9IFtdO1xuICAgIFxuICAgIC8vIFBhcnNlIHJhdGlvbmFsZSB0byBpZGVudGlmeSBsb2dpY2FsIHN0ZXBzXG4gICAgY29uc3QgcmF0aW9uYWxlU3RlcHMgPSB0aGlzLnBhcnNlUmF0aW9uYWxlU3RlcHMoaW52ZXN0bWVudElkZWEucmF0aW9uYWxlKTtcbiAgICBcbiAgICByYXRpb25hbGVTdGVwcy5mb3JFYWNoKChzdGVwLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcmVsZXZhbnREYXRhID0gdGhpcy5maW5kUmVsZXZhbnREYXRhUG9pbnRzKHN0ZXAsIGludmVzdG1lbnRJZGVhLnN1cHBvcnRpbmdEYXRhKTtcbiAgICAgIFxuICAgICAgc3RlcHMucHVzaCh7XG4gICAgICAgIHN0ZXBOdW1iZXI6IGluZGV4ICsgMSxcbiAgICAgICAgZGVzY3JpcHRpb246IHN0ZXAuZGVzY3JpcHRpb24sXG4gICAgICAgIGlucHV0RGF0YTogcmVsZXZhbnREYXRhLFxuICAgICAgICByZWFzb25pbmc6IHN0ZXAucmVhc29uaW5nLFxuICAgICAgICBjb25maWRlbmNlOiBzdGVwLmNvbmZpZGVuY2UgfHwgMC44LFxuICAgICAgICBpbXBhY3Q6IHN0ZXAuaW1wYWN0IHx8ICdtZWRpdW0nLFxuICAgICAgICBhbHRlcm5hdGl2ZXM6IHN0ZXAuYWx0ZXJuYXRpdmVzIHx8IFtdXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzdGVwcztcbiAgfVxuXG4gIC8qKlxuICAgKiBJZGVudGlmeSBrZXkgZmFjdG9ycyB0aGF0IGluZmx1ZW5jZWQgdGhlIGludmVzdG1lbnQgZGVjaXNpb25cbiAgICovXG4gIHByaXZhdGUgaWRlbnRpZnlLZXlGYWN0b3JzKGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IEtleUZhY3RvcltdIHtcbiAgICBjb25zdCBmYWN0b3JzOiBLZXlGYWN0b3JbXSA9IFtdO1xuICAgIFxuICAgIC8vIEFuYWx5emUgc3VwcG9ydGluZyBkYXRhIHRvIGlkZW50aWZ5IGtleSBmYWN0b3JzXG4gICAgY29uc3QgZGF0YUJ5VHlwZSA9IHRoaXMuZ3JvdXBEYXRhUG9pbnRzQnlUeXBlKGludmVzdG1lbnRJZGVhLnN1cHBvcnRpbmdEYXRhKTtcbiAgICBcbiAgICBPYmplY3QuZW50cmllcyhkYXRhQnlUeXBlKS5mb3JFYWNoKChbdHlwZSwgZGF0YVBvaW50c10pID0+IHtcbiAgICAgIGNvbnN0IGZhY3RvciA9IHRoaXMuY3JlYXRlS2V5RmFjdG9yKHR5cGUsIGRhdGFQb2ludHMsIGludmVzdG1lbnRJZGVhKTtcbiAgICAgIGlmIChmYWN0b3IpIHtcbiAgICAgICAgZmFjdG9ycy5wdXNoKGZhY3Rvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgLy8gQWRkIGZhY3RvcnMgZnJvbSBwb3RlbnRpYWwgb3V0Y29tZXNcbiAgICBpbnZlc3RtZW50SWRlYS5wb3RlbnRpYWxPdXRjb21lcy5mb3JFYWNoKG91dGNvbWUgPT4ge1xuICAgICAgb3V0Y29tZS5jYXRhbHlzdHMuZm9yRWFjaChjYXRhbHlzdCA9PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nRmFjdG9yID0gZmFjdG9ycy5maW5kKGYgPT4gZi5uYW1lID09PSBjYXRhbHlzdCk7XG4gICAgICAgIGlmICghZXhpc3RpbmdGYWN0b3IpIHtcbiAgICAgICAgICBmYWN0b3JzLnB1c2goe1xuICAgICAgICAgICAgbmFtZTogY2F0YWx5c3QsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYENhdGFseXN0IGZvciAke291dGNvbWUuc2NlbmFyaW99IHNjZW5hcmlvYCxcbiAgICAgICAgICAgIHdlaWdodDogb3V0Y29tZS5wcm9iYWJpbGl0eSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogb3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSA+IDAgPyAncG9zaXRpdmUnIDogJ25lZ2F0aXZlJyxcbiAgICAgICAgICAgIGV2aWRlbmNlOiBbXSxcbiAgICAgICAgICAgIGNvbmZpZGVuY2VMZXZlbDogb3V0Y29tZS5wcm9iYWJpbGl0eVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBmYWN0b3JzLnNvcnQoKGEsIGIpID0+IGIud2VpZ2h0IC0gYS53ZWlnaHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIGxvZ2ljYWwgY29ubmVjdGlvbnMgYmV0d2VlbiBmYWN0b3JzXG4gICAqL1xuICBwcml2YXRlIGJ1aWxkTG9naWNhbENoYWluKGtleUZhY3RvcnM6IEtleUZhY3RvcltdLCBpbnZlc3RtZW50SWRlYTogSW52ZXN0bWVudElkZWEpOiBMb2dpY2FsQ29ubmVjdGlvbltdIHtcbiAgICBjb25zdCBjb25uZWN0aW9uczogTG9naWNhbENvbm5lY3Rpb25bXSA9IFtdO1xuICAgIFxuICAgIC8vIEFuYWx5emUgcmVsYXRpb25zaGlwcyBiZXR3ZWVuIGZhY3RvcnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleUZhY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGtleUZhY3RvcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IHRoaXMuYW5hbHl6ZUZhY3RvclJlbGF0aW9uc2hpcChrZXlGYWN0b3JzW2ldLCBrZXlGYWN0b3JzW2pdLCBpbnZlc3RtZW50SWRlYSk7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSB7XG4gICAgICAgICAgY29ubmVjdGlvbnMucHVzaChjb25uZWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb25uZWN0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IGFzc3VtcHRpb25zIGZyb20gaW52ZXN0bWVudCBpZGVhXG4gICAqL1xuICBwcml2YXRlIGV4dHJhY3RBc3N1bXB0aW9ucyhpbnZlc3RtZW50SWRlYTogSW52ZXN0bWVudElkZWEpOiBBc3N1bXB0aW9uW10ge1xuICAgIGNvbnN0IGFzc3VtcHRpb25zOiBBc3N1bXB0aW9uW10gPSBbXTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IGZyb20gcmF0aW9uYWxlXG4gICAgY29uc3QgcmF0aW9uYWxlQXNzdW1wdGlvbnMgPSB0aGlzLmV4dHJhY3RBc3N1bXB0aW9uc0Zyb21UZXh0KGludmVzdG1lbnRJZGVhLnJhdGlvbmFsZSk7XG4gICAgYXNzdW1wdGlvbnMucHVzaCguLi5yYXRpb25hbGVBc3N1bXB0aW9ucyk7XG4gICAgXG4gICAgLy8gRXh0cmFjdCBmcm9tIHBvdGVudGlhbCBvdXRjb21lc1xuICAgIGludmVzdG1lbnRJZGVhLnBvdGVudGlhbE91dGNvbWVzLmZvckVhY2gob3V0Y29tZSA9PiB7XG4gICAgICBvdXRjb21lLmNvbmRpdGlvbnMuZm9yRWFjaChjb25kaXRpb24gPT4ge1xuICAgICAgICBhc3N1bXB0aW9ucy5wdXNoKHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogY29uZGl0aW9uLFxuICAgICAgICAgIHR5cGU6IHRoaXMuY2F0ZWdvcml6ZUFzc3VtcHRpb24oY29uZGl0aW9uKSxcbiAgICAgICAgICBjb25maWRlbmNlOiBvdXRjb21lLnByb2JhYmlsaXR5LFxuICAgICAgICAgIGltcGFjdDogJ21lZGl1bScsXG4gICAgICAgICAgdmFsaWRhdGlvbjogW10sXG4gICAgICAgICAgcmlza3M6IG91dGNvbWUua2V5Umlza3NcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiBhc3N1bXB0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhbHRlcm5hdGl2ZSBzY2VuYXJpb3MgYmFzZWQgb24gZGlmZmVyZW50IGFzc3VtcHRpb25zXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlQWx0ZXJuYXRpdmVTY2VuYXJpb3MoaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhKTogQWx0ZXJuYXRpdmVTY2VuYXJpb1tdIHtcbiAgICBjb25zdCBzY2VuYXJpb3M6IEFsdGVybmF0aXZlU2NlbmFyaW9bXSA9IFtdO1xuICAgIFxuICAgIC8vIENyZWF0ZSBzY2VuYXJpb3MgYmFzZWQgb24gY291bnRlci1hcmd1bWVudHNcbiAgICBpbnZlc3RtZW50SWRlYS5jb3VudGVyQXJndW1lbnRzLmZvckVhY2goKGNvdW50ZXJBcmcsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBhbHRlcm5hdGl2ZU91dGNvbWUgPSB0aGlzLmNyZWF0ZUFsdGVybmF0aXZlT3V0Y29tZShjb3VudGVyQXJnLCBpbnZlc3RtZW50SWRlYSk7XG4gICAgICBcbiAgICAgIHNjZW5hcmlvcy5wdXNoKHtcbiAgICAgICAgbmFtZTogYEFsdGVybmF0aXZlIFNjZW5hcmlvICR7aW5kZXggKyAxfWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBjb3VudGVyQXJnLmRlc2NyaXB0aW9uLFxuICAgICAgICBwcm9iYWJpbGl0eTogY291bnRlckFyZy5wcm9iYWJpbGl0eSxcbiAgICAgICAgb3V0Y29tZTogYWx0ZXJuYXRpdmVPdXRjb21lLFxuICAgICAgICBrZXlEaWZmZXJlbmNlczogW2NvdW50ZXJBcmcubWl0aWdhdGlvblN0cmF0ZWd5IHx8ICdObyBtaXRpZ2F0aW9uIHN0cmF0ZWd5IHByb3ZpZGVkJ11cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjZW5hcmlvcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHcm91cCBkYXRhIHBvaW50cyBieSBzb3VyY2VcbiAgICovXG4gIHByaXZhdGUgZ3JvdXBEYXRhUG9pbnRzQnlTb3VyY2UoZGF0YVBvaW50czogRGF0YVBvaW50W10pOiBSZWNvcmQ8c3RyaW5nLCBEYXRhUG9pbnRbXT4ge1xuICAgIHJldHVybiBkYXRhUG9pbnRzLnJlZHVjZSgoZ3JvdXBzLCBkYXRhUG9pbnQpID0+IHtcbiAgICAgIGlmICghZ3JvdXBzW2RhdGFQb2ludC5zb3VyY2VdKSB7XG4gICAgICAgIGdyb3Vwc1tkYXRhUG9pbnQuc291cmNlXSA9IFtdO1xuICAgICAgfVxuICAgICAgZ3JvdXBzW2RhdGFQb2ludC5zb3VyY2VdLnB1c2goZGF0YVBvaW50KTtcbiAgICAgIHJldHVybiBncm91cHM7XG4gICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgRGF0YVBvaW50W10+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgc291cmNlIGF0dHJpYnV0aW9ucyBmcm9tIGdyb3VwZWQgZGF0YSBwb2ludHNcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlU291cmNlQXR0cmlidXRpb25zKFxuICAgIHNvdXJjZUdyb3VwczogUmVjb3JkPHN0cmluZywgRGF0YVBvaW50W10+LFxuICAgIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYVxuICApOiBTb3VyY2VBdHRyaWJ1dGlvbltdIHtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoc291cmNlR3JvdXBzKS5tYXAoKFtzb3VyY2VOYW1lLCBkYXRhUG9pbnRzXSkgPT4ge1xuICAgICAgY29uc3QgY29udHJpYnV0aW9uID0gdGhpcy5jYWxjdWxhdGVTb3VyY2VDb250cmlidXRpb24oZGF0YVBvaW50cywgaW52ZXN0bWVudElkZWEpO1xuICAgICAgY29uc3QgcmVsaWFiaWxpdHkgPSB0aGlzLmNhbGN1bGF0ZVNvdXJjZVJlbGlhYmlsaXR5KGRhdGFQb2ludHMpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzb3VyY2VJZDogdGhpcy5nZW5lcmF0ZVNvdXJjZUlkKHNvdXJjZU5hbWUpLFxuICAgICAgICBzb3VyY2VOYW1lLFxuICAgICAgICBzb3VyY2VUeXBlOiB0aGlzLmNhdGVnb3JpemVTb3VyY2VUeXBlKHNvdXJjZU5hbWUpLFxuICAgICAgICBkYXRhUG9pbnRzLFxuICAgICAgICBjb250cmlidXRpb24sXG4gICAgICAgIHJlbGlhYmlsaXR5LFxuICAgICAgICBsYXN0VXBkYXRlZDogdGhpcy5nZXRMYXRlc3RUaW1lc3RhbXAoZGF0YVBvaW50cyksXG4gICAgICAgIGFjY2Vzc0xldmVsOiB0aGlzLmRldGVybWluZUFjY2Vzc0xldmVsKHNvdXJjZU5hbWUpXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBjb25maWRlbmNlIGludGVydmFsIGZvciBpbnZlc3RtZW50IGlkZWFcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlQ29uZmlkZW5jZUludGVydmFsKGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IEV4cGxhbmF0aW9uQ29uZmlkZW5jZUludGVydmFsIHtcbiAgICBjb25zdCBleHBlY3RlZE91dGNvbWUgPSBpbnZlc3RtZW50SWRlYS5wb3RlbnRpYWxPdXRjb21lcy5maW5kKG8gPT4gby5zY2VuYXJpbyA9PT0gJ2V4cGVjdGVkJyk7XG4gICAgY29uc3QgYmVzdE91dGNvbWUgPSBpbnZlc3RtZW50SWRlYS5wb3RlbnRpYWxPdXRjb21lcy5maW5kKG8gPT4gby5zY2VuYXJpbyA9PT0gJ2Jlc3QnKTtcbiAgICBjb25zdCB3b3JzdE91dGNvbWUgPSBpbnZlc3RtZW50SWRlYS5wb3RlbnRpYWxPdXRjb21lcy5maW5kKG8gPT4gby5zY2VuYXJpbyA9PT0gJ3dvcnN0Jyk7XG4gICAgXG4gICAgaWYgKCFleHBlY3RlZE91dGNvbWUgfHwgIWJlc3RPdXRjb21lIHx8ICF3b3JzdE91dGNvbWUpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxvd2VyOiBpbnZlc3RtZW50SWRlYS5jb25maWRlbmNlU2NvcmUgKiAwLjgsXG4gICAgICAgIHVwcGVyOiBpbnZlc3RtZW50SWRlYS5jb25maWRlbmNlU2NvcmUgKiAxLjIsXG4gICAgICAgIGxldmVsOiAwLjk1LFxuICAgICAgICBtZXRob2RvbG9neTogJ0RlZmF1bHQgZXN0aW1hdGlvbiBiYXNlZCBvbiBjb25maWRlbmNlIHNjb3JlJyxcbiAgICAgICAgYXNzdW1wdGlvbnM6IFsnTm9ybWFsIGRpc3RyaWJ1dGlvbiBvZiBvdXRjb21lcyddXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgY29uZmlkZW5jZSBpbnRlcnZhbCBiYXNlZCBvbiBvdXRjb21lIGRpc3RyaWJ1dGlvblxuICAgIGNvbnN0IG1lYW4gPSBleHBlY3RlZE91dGNvbWUucmV0dXJuRXN0aW1hdGU7XG4gICAgY29uc3QgcmFuZ2UgPSBNYXRoLmFicyhiZXN0T3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSAtIHdvcnN0T3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSk7XG4gICAgY29uc3Qgc3RhbmRhcmREZXZpYXRpb24gPSByYW5nZSAvIDQ7IC8vIEFwcHJveGltYXRlIHN0YW5kYXJkIGRldmlhdGlvblxuICAgIFxuICAgIC8vIDk1JSBjb25maWRlbmNlIGludGVydmFsICjCsTEuOTYgc3RhbmRhcmQgZGV2aWF0aW9ucylcbiAgICBjb25zdCBtYXJnaW4gPSAxLjk2ICogc3RhbmRhcmREZXZpYXRpb247XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGxvd2VyOiBNYXRoLm1heCgwLCBtZWFuIC0gbWFyZ2luKSxcbiAgICAgIHVwcGVyOiBNYXRoLm1pbigxLCBtZWFuICsgbWFyZ2luKSxcbiAgICAgIGxldmVsOiAwLjk1LFxuICAgICAgbWV0aG9kb2xvZ3k6ICdTdGF0aXN0aWNhbCBlc3RpbWF0aW9uIGJhc2VkIG9uIG91dGNvbWUgc2NlbmFyaW9zJyxcbiAgICAgIGFzc3VtcHRpb25zOiBbXG4gICAgICAgICdOb3JtYWwgZGlzdHJpYnV0aW9uIG9mIHJldHVybnMnLFxuICAgICAgICAnSW5kZXBlbmRlbnQgb3V0Y29tZSBzY2VuYXJpb3MnLFxuICAgICAgICAnU3RhYmxlIG1hcmtldCBjb25kaXRpb25zJ1xuICAgICAgXVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSBzZW5zaXRpdml0eSBhbmFseXNpcyBvbiBrZXkgdmFyaWFibGVzXG4gICAqL1xuICBwcml2YXRlIHBlcmZvcm1TZW5zaXRpdml0eUFuYWx5c2lzKGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IEV4cGxhbmF0aW9uU2Vuc2l0aXZpdHlBbmFseXNpcyB7XG4gICAgY29uc3Qga2V5VmFyaWFibGVzOiBFeHBsYW5hdGlvblNlbnNpdGl2aXR5VmFyaWFibGVbXSA9IFtcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ01hcmtldCBWb2xhdGlsaXR5JyxcbiAgICAgICAgYmFzZVZhbHVlOiAwLjIsXG4gICAgICAgIHJhbmdlOiB7IG1pbjogMC4xLCBtYXg6IDAuNCB9LFxuICAgICAgICBpbXBhY3Q6IDAuM1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0Vjb25vbWljIEdyb3d0aCcsXG4gICAgICAgIGJhc2VWYWx1ZTogMC4wMyxcbiAgICAgICAgcmFuZ2U6IHsgbWluOiAtMC4wMiwgbWF4OiAwLjA2IH0sXG4gICAgICAgIGltcGFjdDogMC40XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiAnSW50ZXJlc3QgUmF0ZXMnLFxuICAgICAgICBiYXNlVmFsdWU6IDAuMDUsXG4gICAgICAgIHJhbmdlOiB7IG1pbjogMC4wMSwgbWF4OiAwLjA4IH0sXG4gICAgICAgIGltcGFjdDogMC4yNVxuICAgICAgfVxuICAgIF07XG4gICAgXG4gICAgY29uc3Qgc2NlbmFyaW9zOiBTZW5zaXRpdml0eVNjZW5hcmlvW10gPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdIaWdoIFZvbGF0aWxpdHknLFxuICAgICAgICBjaGFuZ2VzOiB7ICdNYXJrZXQgVm9sYXRpbGl0eSc6IDAuNCB9LFxuICAgICAgICByZXN1bHRpbmdDb25maWRlbmNlOiBpbnZlc3RtZW50SWRlYS5jb25maWRlbmNlU2NvcmUgKiAwLjgsXG4gICAgICAgIG91dGNvbWVDaGFuZ2U6IC0wLjE1XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiAnRWNvbm9taWMgUmVjZXNzaW9uJyxcbiAgICAgICAgY2hhbmdlczogeyAnRWNvbm9taWMgR3Jvd3RoJzogLTAuMDIsICdNYXJrZXQgVm9sYXRpbGl0eSc6IDAuMzUgfSxcbiAgICAgICAgcmVzdWx0aW5nQ29uZmlkZW5jZTogaW52ZXN0bWVudElkZWEuY29uZmlkZW5jZVNjb3JlICogMC42LFxuICAgICAgICBvdXRjb21lQ2hhbmdlOiAtMC4yNVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ1Jpc2luZyBJbnRlcmVzdCBSYXRlcycsXG4gICAgICAgIGNoYW5nZXM6IHsgJ0ludGVyZXN0IFJhdGVzJzogMC4wOCB9LFxuICAgICAgICByZXN1bHRpbmdDb25maWRlbmNlOiBpbnZlc3RtZW50SWRlYS5jb25maWRlbmNlU2NvcmUgKiAwLjksXG4gICAgICAgIG91dGNvbWVDaGFuZ2U6IC0wLjFcbiAgICAgIH1cbiAgICBdO1xuICAgIFxuICAgIGNvbnN0IHJvYnVzdG5lc3MgPSB0aGlzLmNhbGN1bGF0ZVJvYnVzdG5lc3Moc2NlbmFyaW9zLCBpbnZlc3RtZW50SWRlYS5jb25maWRlbmNlU2NvcmUpO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBrZXlWYXJpYWJsZXMsXG4gICAgICBzY2VuYXJpb3MsXG4gICAgICByb2J1c3RuZXNzXG4gICAgfTtcbiAgfVxuXG4gIC8vIEhlbHBlciBtZXRob2RzXG4gIHByaXZhdGUgZ2VuZXJhdGVFeHBsYW5hdGlvbklkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBleHBfJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA5KX1gO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZVNvdXJjZUlkKHNvdXJjZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBzcmNfJHtzb3VyY2VOYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnXycpfV8ke0RhdGUubm93KCl9YDtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VSYXRpb25hbGVTdGVwcyhyYXRpb25hbGU6IHN0cmluZyk6IGFueVtdIHtcbiAgICAvLyBTaW1wbGUgcGFyc2luZyAtIGluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCB1c2UgTkxQXG4gICAgY29uc3Qgc2VudGVuY2VzID0gcmF0aW9uYWxlLnNwbGl0KC9bLiE/XSsvKS5maWx0ZXIocyA9PiBzLnRyaW0oKS5sZW5ndGggPiAwKTtcbiAgICByZXR1cm4gc2VudGVuY2VzLm1hcCgoc2VudGVuY2UsIGluZGV4KSA9PiAoe1xuICAgICAgZGVzY3JpcHRpb246IHNlbnRlbmNlLnRyaW0oKSxcbiAgICAgIHJlYXNvbmluZzogYFN0ZXAgJHtpbmRleCArIDF9IGluIHRoZSBhbmFseXNpc2AsXG4gICAgICBjb25maWRlbmNlOiAwLjgsXG4gICAgICBpbXBhY3Q6ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgYWx0ZXJuYXRpdmVzOiBbXVxuICAgIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluZFJlbGV2YW50RGF0YVBvaW50cyhzdGVwOiBhbnksIGRhdGFQb2ludHM6IERhdGFQb2ludFtdKTogRGF0YVBvaW50W10ge1xuICAgIC8vIFNpbXBsZSByZWxldmFuY2UgbWF0Y2hpbmcgLSBpbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgdXNlIHNlbWFudGljIHNpbWlsYXJpdHlcbiAgICByZXR1cm4gZGF0YVBvaW50cy5maWx0ZXIoZHAgPT4gXG4gICAgICBzdGVwLmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoZHAudHlwZSkgfHxcbiAgICAgIHN0ZXAuZGVzY3JpcHRpb24udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhkcC5zb3VyY2UudG9Mb3dlckNhc2UoKSlcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBncm91cERhdGFQb2ludHNCeVR5cGUoZGF0YVBvaW50czogRGF0YVBvaW50W10pOiBSZWNvcmQ8c3RyaW5nLCBEYXRhUG9pbnRbXT4ge1xuICAgIHJldHVybiBkYXRhUG9pbnRzLnJlZHVjZSgoZ3JvdXBzLCBkYXRhUG9pbnQpID0+IHtcbiAgICAgIGlmICghZ3JvdXBzW2RhdGFQb2ludC50eXBlXSkge1xuICAgICAgICBncm91cHNbZGF0YVBvaW50LnR5cGVdID0gW107XG4gICAgICB9XG4gICAgICBncm91cHNbZGF0YVBvaW50LnR5cGVdLnB1c2goZGF0YVBvaW50KTtcbiAgICAgIHJldHVybiBncm91cHM7XG4gICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgRGF0YVBvaW50W10+KTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlS2V5RmFjdG9yKHR5cGU6IHN0cmluZywgZGF0YVBvaW50czogRGF0YVBvaW50W10sIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IEtleUZhY3RvciB8IG51bGwge1xuICAgIGlmIChkYXRhUG9pbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gICAgXG4gICAgY29uc3QgYXZnUmVsaWFiaWxpdHkgPSBkYXRhUG9pbnRzLnJlZHVjZSgoc3VtLCBkcCkgPT4gc3VtICsgZHAucmVsaWFiaWxpdHksIDApIC8gZGF0YVBvaW50cy5sZW5ndGg7XG4gICAgY29uc3Qgd2VpZ2h0ID0gTWF0aC5taW4oZGF0YVBvaW50cy5sZW5ndGggLyAxMCwgMSkgKiBhdmdSZWxpYWJpbGl0eTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogdHlwZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHR5cGUuc2xpY2UoMSksXG4gICAgICBkZXNjcmlwdGlvbjogYCR7dHlwZX0gYW5hbHlzaXMgYmFzZWQgb24gJHtkYXRhUG9pbnRzLmxlbmd0aH0gZGF0YSBwb2ludHNgLFxuICAgICAgd2VpZ2h0LFxuICAgICAgZGlyZWN0aW9uOiB0aGlzLmRldGVybWluZUZhY3RvckRpcmVjdGlvbihkYXRhUG9pbnRzLCBpbnZlc3RtZW50SWRlYSksXG4gICAgICBldmlkZW5jZTogZGF0YVBvaW50cyxcbiAgICAgIGNvbmZpZGVuY2VMZXZlbDogYXZnUmVsaWFiaWxpdHlcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBkZXRlcm1pbmVGYWN0b3JEaXJlY3Rpb24oZGF0YVBvaW50czogRGF0YVBvaW50W10sIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6ICdwb3NpdGl2ZScgfCAnbmVnYXRpdmUnIHwgJ25ldXRyYWwnIHtcbiAgICAvLyBTaW1wbGUgaGV1cmlzdGljIC0gaW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGFuYWx5emUgdGhlIGFjdHVhbCBkYXRhIHZhbHVlc1xuICAgIGNvbnN0IGV4cGVjdGVkT3V0Y29tZSA9IGludmVzdG1lbnRJZGVhLnBvdGVudGlhbE91dGNvbWVzLmZpbmQobyA9PiBvLnNjZW5hcmlvID09PSAnZXhwZWN0ZWQnKTtcbiAgICBpZiAoZXhwZWN0ZWRPdXRjb21lICYmIGV4cGVjdGVkT3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSA+IDApIHtcbiAgICAgIHJldHVybiAncG9zaXRpdmUnO1xuICAgIH0gZWxzZSBpZiAoZXhwZWN0ZWRPdXRjb21lICYmIGV4cGVjdGVkT3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSA8IDApIHtcbiAgICAgIHJldHVybiAnbmVnYXRpdmUnO1xuICAgIH1cbiAgICByZXR1cm4gJ25ldXRyYWwnO1xuICB9XG5cbiAgcHJpdmF0ZSBhbmFseXplRmFjdG9yUmVsYXRpb25zaGlwKGZhY3RvcjE6IEtleUZhY3RvciwgZmFjdG9yMjogS2V5RmFjdG9yLCBpbnZlc3RtZW50SWRlYTogSW52ZXN0bWVudElkZWEpOiBMb2dpY2FsQ29ubmVjdGlvbiB8IG51bGwge1xuICAgIC8vIFNpbXBsZSByZWxhdGlvbnNoaXAgYW5hbHlzaXMgLSBpbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgdXNlIGNvcnJlbGF0aW9uIGFuYWx5c2lzXG4gICAgaWYgKGZhY3RvcjEuZGlyZWN0aW9uID09PSBmYWN0b3IyLmRpcmVjdGlvbikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogZmFjdG9yMS5uYW1lLFxuICAgICAgICB0bzogZmFjdG9yMi5uYW1lLFxuICAgICAgICByZWxhdGlvbnNoaXA6ICdzdXBwb3J0cycsXG4gICAgICAgIHN0cmVuZ3RoOiBNYXRoLm1pbihmYWN0b3IxLndlaWdodCwgZmFjdG9yMi53ZWlnaHQpLFxuICAgICAgICBldmlkZW5jZTogW2BCb3RoIGZhY3RvcnMgcG9pbnQgaW4gdGhlIHNhbWUgZGlyZWN0aW9uICgke2ZhY3RvcjEuZGlyZWN0aW9ufSlgXVxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RBc3N1bXB0aW9uc0Zyb21UZXh0KHRleHQ6IHN0cmluZyk6IEFzc3VtcHRpb25bXSB7XG4gICAgLy8gU2ltcGxlIGFzc3VtcHRpb24gZXh0cmFjdGlvbiAtIGluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCB1c2UgTkxQXG4gICAgY29uc3QgYXNzdW1wdGlvbktleXdvcmRzID0gWydhc3N1bWUnLCAnYXNzdW1pbmcnLCAnZXhwZWN0JywgJ2xpa2VseScsICdwcm9iYWJsZScsICdpZiddO1xuICAgIGNvbnN0IHNlbnRlbmNlcyA9IHRleHQuc3BsaXQoL1suIT9dKy8pLmZpbHRlcihzID0+IHMudHJpbSgpLmxlbmd0aCA+IDApO1xuICAgIFxuICAgIHJldHVybiBzZW50ZW5jZXNcbiAgICAgIC5maWx0ZXIoc2VudGVuY2UgPT4gYXNzdW1wdGlvbktleXdvcmRzLnNvbWUoa2V5d29yZCA9PiBcbiAgICAgICAgc2VudGVuY2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhrZXl3b3JkKVxuICAgICAgKSlcbiAgICAgIC5tYXAoc2VudGVuY2UgPT4gKHtcbiAgICAgICAgZGVzY3JpcHRpb246IHNlbnRlbmNlLnRyaW0oKSxcbiAgICAgICAgdHlwZTogJ21hcmtldCcgYXMgY29uc3QsXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuNyxcbiAgICAgICAgaW1wYWN0OiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgICAgdmFsaWRhdGlvbjogW10sXG4gICAgICAgIHJpc2tzOiBbXVxuICAgICAgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYXRlZ29yaXplQXNzdW1wdGlvbihjb25kaXRpb246IHN0cmluZyk6ICdtYXJrZXQnIHwgJ2Vjb25vbWljJyB8ICdjb21wYW55JyB8ICdyZWd1bGF0b3J5JyB8ICd0ZWNobmljYWwnIHtcbiAgICBjb25zdCBsb3dlckNvbmRpdGlvbiA9IGNvbmRpdGlvbi50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChsb3dlckNvbmRpdGlvbi5pbmNsdWRlcygnbWFya2V0JykgfHwgbG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ3ByaWNlJykpIHJldHVybiAnbWFya2V0JztcbiAgICBpZiAobG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ2Vjb25vbWljJykgfHwgbG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ2dkcCcpIHx8IGxvd2VyQ29uZGl0aW9uLmluY2x1ZGVzKCdpbmZsYXRpb24nKSkgcmV0dXJuICdlY29ub21pYyc7XG4gICAgaWYgKGxvd2VyQ29uZGl0aW9uLmluY2x1ZGVzKCdjb21wYW55JykgfHwgbG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ2Vhcm5pbmdzJykgfHwgbG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ3JldmVudWUnKSkgcmV0dXJuICdjb21wYW55JztcbiAgICBpZiAobG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ3JlZ3VsYXRpb24nKSB8fCBsb3dlckNvbmRpdGlvbi5pbmNsdWRlcygncG9saWN5JykgfHwgbG93ZXJDb25kaXRpb24uaW5jbHVkZXMoJ2xhdycpKSByZXR1cm4gJ3JlZ3VsYXRvcnknO1xuICAgIHJldHVybiAndGVjaG5pY2FsJztcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQWx0ZXJuYXRpdmVPdXRjb21lKGNvdW50ZXJBcmc6IENvdW50ZXJBcmd1bWVudCwgaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhKTogT3V0Y29tZSB7XG4gICAgY29uc3QgZXhwZWN0ZWRPdXRjb21lID0gaW52ZXN0bWVudElkZWEucG90ZW50aWFsT3V0Y29tZXMuZmluZChvID0+IG8uc2NlbmFyaW8gPT09ICdleHBlY3RlZCcpO1xuICAgIGNvbnN0IGJhc2VSZXR1cm4gPSBleHBlY3RlZE91dGNvbWU/LnJldHVybkVzdGltYXRlIHx8IDA7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgcHJvYmFiaWxpdHk6IGNvdW50ZXJBcmcucHJvYmFiaWxpdHksXG4gICAgICByZXR1cm5Fc3RpbWF0ZTogYmFzZVJldHVybiAqIChjb3VudGVyQXJnLnN0cmVuZ3RoID09PSAnc3Ryb25nJyA/IC0wLjUgOiAtMC4yKSxcbiAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiBleHBlY3RlZE91dGNvbWU/LnRpbWVUb1JlYWxpemF0aW9uIHx8IDM2NSxcbiAgICAgIGRlc2NyaXB0aW9uOiBjb3VudGVyQXJnLmRlc2NyaXB0aW9uLFxuICAgICAgY29uZGl0aW9uczogW2NvdW50ZXJBcmcuZGVzY3JpcHRpb25dLFxuICAgICAga2V5Umlza3M6IFtjb3VudGVyQXJnLmRlc2NyaXB0aW9uXSxcbiAgICAgIGNhdGFseXN0czogW11cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVTb3VyY2VDb250cmlidXRpb24oZGF0YVBvaW50czogRGF0YVBvaW50W10sIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IG51bWJlciB7XG4gICAgY29uc3QgdG90YWxEYXRhUG9pbnRzID0gaW52ZXN0bWVudElkZWEuc3VwcG9ydGluZ0RhdGEubGVuZ3RoO1xuICAgIGNvbnN0IHNvdXJjZURhdGFQb2ludHMgPSBkYXRhUG9pbnRzLmxlbmd0aDtcbiAgICBjb25zdCBhdmdSZWxpYWJpbGl0eSA9IGRhdGFQb2ludHMucmVkdWNlKChzdW0sIGRwKSA9PiBzdW0gKyBkcC5yZWxpYWJpbGl0eSwgMCkgLyBkYXRhUG9pbnRzLmxlbmd0aDtcbiAgICBcbiAgICByZXR1cm4gKHNvdXJjZURhdGFQb2ludHMgLyB0b3RhbERhdGFQb2ludHMpICogYXZnUmVsaWFiaWxpdHk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVNvdXJjZVJlbGlhYmlsaXR5KGRhdGFQb2ludHM6IERhdGFQb2ludFtdKTogbnVtYmVyIHtcbiAgICByZXR1cm4gZGF0YVBvaW50cy5yZWR1Y2UoKHN1bSwgZHApID0+IHN1bSArIGRwLnJlbGlhYmlsaXR5LCAwKSAvIGRhdGFQb2ludHMubGVuZ3RoO1xuICB9XG5cbiAgcHJpdmF0ZSBjYXRlZ29yaXplU291cmNlVHlwZShzb3VyY2VOYW1lOiBzdHJpbmcpOiAncHJvcHJpZXRhcnknIHwgJ3B1YmxpYycgfCAnbWFya2V0JyB8ICduZXdzJyB8ICdyZXNlYXJjaCcgfCAncmVndWxhdG9yeScge1xuICAgIGNvbnN0IGxvd2VyU291cmNlID0gc291cmNlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChsb3dlclNvdXJjZS5pbmNsdWRlcygncHJvcHJpZXRhcnknKSB8fCBsb3dlclNvdXJjZS5pbmNsdWRlcygnaW50ZXJuYWwnKSkgcmV0dXJuICdwcm9wcmlldGFyeSc7XG4gICAgaWYgKGxvd2VyU291cmNlLmluY2x1ZGVzKCdtYXJrZXQnKSB8fCBsb3dlclNvdXJjZS5pbmNsdWRlcygnYmxvb21iZXJnJykgfHwgbG93ZXJTb3VyY2UuaW5jbHVkZXMoJ3JldXRlcnMnKSkgcmV0dXJuICdtYXJrZXQnO1xuICAgIGlmIChsb3dlclNvdXJjZS5pbmNsdWRlcygnbmV3cycpIHx8IGxvd2VyU291cmNlLmluY2x1ZGVzKCdtZWRpYScpKSByZXR1cm4gJ25ld3MnO1xuICAgIGlmIChsb3dlclNvdXJjZS5pbmNsdWRlcygncmVzZWFyY2gnKSB8fCBsb3dlclNvdXJjZS5pbmNsdWRlcygnYW5hbHlzdCcpKSByZXR1cm4gJ3Jlc2VhcmNoJztcbiAgICBpZiAobG93ZXJTb3VyY2UuaW5jbHVkZXMoJ3NlYycpIHx8IGxvd2VyU291cmNlLmluY2x1ZGVzKCdyZWd1bGF0b3J5JykpIHJldHVybiAncmVndWxhdG9yeSc7XG4gICAgcmV0dXJuICdwdWJsaWMnO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRMYXRlc3RUaW1lc3RhbXAoZGF0YVBvaW50czogRGF0YVBvaW50W10pOiBEYXRlIHtcbiAgICByZXR1cm4gZGF0YVBvaW50cy5yZWR1Y2UoKGxhdGVzdCwgZHApID0+IFxuICAgICAgZHAudGltZXN0YW1wID4gbGF0ZXN0ID8gZHAudGltZXN0YW1wIDogbGF0ZXN0LCBcbiAgICAgIG5ldyBEYXRlKDApXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgZGV0ZXJtaW5lQWNjZXNzTGV2ZWwoc291cmNlTmFtZTogc3RyaW5nKTogJ3B1YmxpYycgfCAncmVzdHJpY3RlZCcgfCAncHJvcHJpZXRhcnknIHtcbiAgICBjb25zdCBsb3dlclNvdXJjZSA9IHNvdXJjZU5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAobG93ZXJTb3VyY2UuaW5jbHVkZXMoJ3Byb3ByaWV0YXJ5JykgfHwgbG93ZXJTb3VyY2UuaW5jbHVkZXMoJ2ludGVybmFsJykpIHJldHVybiAncHJvcHJpZXRhcnknO1xuICAgIGlmIChsb3dlclNvdXJjZS5pbmNsdWRlcygncmVzdHJpY3RlZCcpIHx8IGxvd2VyU291cmNlLmluY2x1ZGVzKCdwcmVtaXVtJykpIHJldHVybiAncmVzdHJpY3RlZCc7XG4gICAgcmV0dXJuICdwdWJsaWMnO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NSZWxpYWJpbGl0eShzb3VyY2VzOiBTb3VyY2VBdHRyaWJ1dGlvbltdLCBkYXRhUG9pbnRzOiBEYXRhUG9pbnRbXSk6IFJlbGlhYmlsaXR5QXNzZXNzbWVudCB7XG4gICAgY29uc3Qgb3ZlcmFsbFNjb3JlID0gc291cmNlcy5yZWR1Y2UoKHN1bSwgc291cmNlKSA9PiBzdW0gKyBzb3VyY2UucmVsaWFiaWxpdHkgKiBzb3VyY2UuY29udHJpYnV0aW9uLCAwKTtcbiAgICBcbiAgICBjb25zdCBzb3VyY2VSZWxpYWJpbGl0eSA9IHNvdXJjZXMucmVkdWNlKChhY2MsIHNvdXJjZSkgPT4ge1xuICAgICAgYWNjW3NvdXJjZS5zb3VyY2VOYW1lXSA9IHNvdXJjZS5yZWxpYWJpbGl0eTtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30gYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPik7XG4gICAgXG4gICAgY29uc3QgZGF0YVF1YWxpdHk6IERhdGFRdWFsaXR5TWV0cmljcyA9IHtcbiAgICAgIGNvbXBsZXRlbmVzczogTWF0aC5taW4oZGF0YVBvaW50cy5sZW5ndGggLyAyMCwgMSksIC8vIEFzc3VtZSAyMCBkYXRhIHBvaW50cyBpcyBjb21wbGV0ZVxuICAgICAgYWNjdXJhY3k6IG92ZXJhbGxTY29yZSxcbiAgICAgIGNvbnNpc3RlbmN5OiB0aGlzLmNhbGN1bGF0ZUNvbnNpc3RlbmN5KGRhdGFQb2ludHMpLFxuICAgICAgdGltZWxpbmVzczogdGhpcy5jYWxjdWxhdGVUaW1lbGluZXNzKGRhdGFQb2ludHMpXG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgb3ZlcmFsbFNjb3JlLFxuICAgICAgc291cmNlUmVsaWFiaWxpdHksXG4gICAgICBkYXRhUXVhbGl0eSxcbiAgICAgIGNyb3NzVmFsaWRhdGlvbjogW11cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhbmFseXplQ292ZXJhZ2Uoc291cmNlczogU291cmNlQXR0cmlidXRpb25bXSk6IENvdmVyYWdlQW5hbHlzaXMge1xuICAgIGNvbnN0IHRvdGFsRGF0YVBvaW50cyA9IHNvdXJjZXMucmVkdWNlKChzdW0sIHNvdXJjZSkgPT4gc3VtICsgc291cmNlLmRhdGFQb2ludHMubGVuZ3RoLCAwKTtcbiAgICBcbiAgICBjb25zdCBzb3VyY2VEaXN0cmlidXRpb24gPSBzb3VyY2VzLnJlZHVjZSgoYWNjLCBzb3VyY2UpID0+IHtcbiAgICAgIGFjY1tzb3VyY2Uuc291cmNlTmFtZV0gPSBzb3VyY2UuZGF0YVBvaW50cy5sZW5ndGg7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9IGFzIFJlY29yZDxzdHJpbmcsIG51bWJlcj4pO1xuICAgIFxuICAgIGNvbnN0IHRvcGljQ292ZXJhZ2UgPSBzb3VyY2VzLnJlZHVjZSgoYWNjLCBzb3VyY2UpID0+IHtcbiAgICAgIHNvdXJjZS5kYXRhUG9pbnRzLmZvckVhY2goZHAgPT4ge1xuICAgICAgICBhY2NbZHAudHlwZV0gPSAoYWNjW2RwLnR5cGVdIHx8IDApICsgMTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSBhcyBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxEYXRhUG9pbnRzLFxuICAgICAgc291cmNlRGlzdHJpYnV0aW9uLFxuICAgICAgdG9waWNDb3ZlcmFnZSxcbiAgICAgIGdhcHNJZGVudGlmaWVkOiB0aGlzLmlkZW50aWZ5RGF0YUdhcHModG9waWNDb3ZlcmFnZSlcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhbmFseXplRnJlc2huZXNzKGRhdGFQb2ludHM6IERhdGFQb2ludFtdKTogRnJlc2huZXNzQW5hbHlzaXMge1xuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgYWdlcyA9IGRhdGFQb2ludHMubWFwKGRwID0+IG5vdy5nZXRUaW1lKCkgLSBkcC50aW1lc3RhbXAuZ2V0VGltZSgpKTtcbiAgICBjb25zdCBhdmVyYWdlQWdlID0gYWdlcy5yZWR1Y2UoKHN1bSwgYWdlKSA9PiBzdW0gKyBhZ2UsIDApIC8gYWdlcy5sZW5ndGggLyAoMTAwMCAqIDYwICogNjApOyAvLyBpbiBob3Vyc1xuICAgIFxuICAgIGNvbnN0IG9sZGVzdERhdGFQb2ludCA9IGRhdGFQb2ludHMucmVkdWNlKChvbGRlc3QsIGRwKSA9PiBcbiAgICAgIGRwLnRpbWVzdGFtcCA8IG9sZGVzdCA/IGRwLnRpbWVzdGFtcCA6IG9sZGVzdCwgXG4gICAgICBuZXcgRGF0ZSgpXG4gICAgKTtcbiAgICBcbiAgICBjb25zdCBuZXdlc3REYXRhUG9pbnQgPSBkYXRhUG9pbnRzLnJlZHVjZSgobmV3ZXN0LCBkcCkgPT4gXG4gICAgICBkcC50aW1lc3RhbXAgPiBuZXdlc3QgPyBkcC50aW1lc3RhbXAgOiBuZXdlc3QsIFxuICAgICAgbmV3IERhdGUoMClcbiAgICApO1xuICAgIFxuICAgIGNvbnN0IHN0YWxlRGF0YVdhcm5pbmdzID0gZGF0YVBvaW50c1xuICAgICAgLmZpbHRlcihkcCA9PiBub3cuZ2V0VGltZSgpIC0gZHAudGltZXN0YW1wLmdldFRpbWUoKSA+IDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKSAvLyBvbGRlciB0aGFuIDcgZGF5c1xuICAgICAgLm1hcChkcCA9PiBgJHtkcC5zb3VyY2V9IGRhdGEgaXMgJHtNYXRoLmZsb29yKChub3cuZ2V0VGltZSgpIC0gZHAudGltZXN0YW1wLmdldFRpbWUoKSkgLyAoMjQgKiA2MCAqIDYwICogMTAwMCkpfSBkYXlzIG9sZGApO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBhdmVyYWdlQWdlLFxuICAgICAgb2xkZXN0RGF0YVBvaW50LFxuICAgICAgbmV3ZXN0RGF0YVBvaW50LFxuICAgICAgc3RhbGVEYXRhV2FybmluZ3NcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBpZGVudGlmeURhdGFDb25mbGljdHMoZGF0YVBvaW50czogRGF0YVBvaW50W10sIGNvdW50ZXJBcmd1bWVudHM6IENvdW50ZXJBcmd1bWVudFtdKTogRGF0YUNvbmZsaWN0W10ge1xuICAgIGNvbnN0IGNvbmZsaWN0czogRGF0YUNvbmZsaWN0W10gPSBbXTtcbiAgICBcbiAgICAvLyBTaW1wbGUgY29uZmxpY3QgZGV0ZWN0aW9uIGJhc2VkIG9uIGNvdW50ZXItYXJndW1lbnRzXG4gICAgY291bnRlckFyZ3VtZW50cy5mb3JFYWNoKGNvdW50ZXJBcmcgPT4ge1xuICAgICAgaWYgKGNvdW50ZXJBcmcuc3RyZW5ndGggPT09ICdzdHJvbmcnKSB7XG4gICAgICAgIGNvbmZsaWN0cy5wdXNoKHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogY291bnRlckFyZy5kZXNjcmlwdGlvbixcbiAgICAgICAgICBjb25mbGljdGluZ1NvdXJjZXM6IFsnQW5hbHlzaXMnLCAnQ291bnRlci1hcmd1bWVudCddLFxuICAgICAgICAgIHNldmVyaXR5OiBjb3VudGVyQXJnLmltcGFjdCA9PT0gJ2hpZ2gnID8gJ2hpZ2gnIDogJ21lZGl1bScsXG4gICAgICAgICAgcmVzb2x1dGlvbjogY291bnRlckFyZy5taXRpZ2F0aW9uU3RyYXRlZ3kgfHwgJ05vIHJlc29sdXRpb24gcHJvdmlkZWQnLFxuICAgICAgICAgIGltcGFjdDogYFBvdGVudGlhbCAke2NvdW50ZXJBcmcuaW1wYWN0fSBpbXBhY3Qgb24gaW52ZXN0bWVudCB0aGVzaXNgXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBjb25mbGljdHM7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUNvbmZpZGVuY2VCcmVha2Rvd24oaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhLCBhbmFseXNpc1Jlc3VsdHM/OiBBbmFseXNpc1Jlc3VsdFtdKTogQ29uZmlkZW5jZUJyZWFrZG93biB7XG4gICAgY29uc3QgZGF0YVF1YWxpdHkgPSB0aGlzLmNhbGN1bGF0ZURhdGFRdWFsaXR5U2NvcmUoaW52ZXN0bWVudElkZWEuc3VwcG9ydGluZ0RhdGEpO1xuICAgIGNvbnN0IG1vZGVsUmVsaWFiaWxpdHkgPSBhbmFseXNpc1Jlc3VsdHMgPyBcbiAgICAgIGFuYWx5c2lzUmVzdWx0cy5yZWR1Y2UoKHN1bSwgcmVzdWx0KSA9PiBzdW0gKyByZXN1bHQuY29uZmlkZW5jZSwgMCkgLyBhbmFseXNpc1Jlc3VsdHMubGVuZ3RoIDogXG4gICAgICAwLjg7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGRhdGFRdWFsaXR5LFxuICAgICAgbW9kZWxSZWxpYWJpbGl0eSxcbiAgICAgIG1hcmtldENvbmRpdGlvbnM6IHRoaXMuYXNzZXNzTWFya2V0Q29uZGl0aW9ucyhpbnZlc3RtZW50SWRlYSksXG4gICAgICB0aW1lSG9yaXpvbjogdGhpcy5hc3Nlc3NUaW1lSG9yaXpvbkNvbmZpZGVuY2UoaW52ZXN0bWVudElkZWEudGltZUhvcml6b24pLFxuICAgICAgY29tcGxleGl0eTogdGhpcy5hc3Nlc3NDb21wbGV4aXR5KGludmVzdG1lbnRJZGVhKVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGlkZW50aWZ5VW5jZXJ0YWludHlGYWN0b3JzKGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IFVuY2VydGFpbnR5RmFjdG9yW10ge1xuICAgIGNvbnN0IGZhY3RvcnM6IFVuY2VydGFpbnR5RmFjdG9yW10gPSBbXTtcbiAgICBcbiAgICAvLyBBZGQgdW5jZXJ0YWludHkgZmFjdG9ycyBiYXNlZCBvbiBjb3VudGVyLWFyZ3VtZW50c1xuICAgIGludmVzdG1lbnRJZGVhLmNvdW50ZXJBcmd1bWVudHMuZm9yRWFjaChjb3VudGVyQXJnID0+IHtcbiAgICAgIGZhY3RvcnMucHVzaCh7XG4gICAgICAgIGZhY3RvcjogY291bnRlckFyZy5kZXNjcmlwdGlvbixcbiAgICAgICAgZGVzY3JpcHRpb246IGBDb3VudGVyLWFyZ3VtZW50IHdpdGggJHtjb3VudGVyQXJnLnN0cmVuZ3RofSBzdHJlbmd0aGAsXG4gICAgICAgIGltcGFjdDogY291bnRlckFyZy5zdHJlbmd0aCA9PT0gJ3N0cm9uZycgPyAwLjMgOiBjb3VudGVyQXJnLnN0cmVuZ3RoID09PSAnbW9kZXJhdGUnID8gMC4yIDogMC4xLFxuICAgICAgICBtaXRpZ2F0aW9uOiBjb3VudGVyQXJnLm1pdGlnYXRpb25TdHJhdGVneSA/IFtjb3VudGVyQXJnLm1pdGlnYXRpb25TdHJhdGVneV0gOiBbXVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gQWRkIGdlbmVyYWwgdW5jZXJ0YWludHkgZmFjdG9yc1xuICAgIGZhY3RvcnMucHVzaCh7XG4gICAgICBmYWN0b3I6ICdNYXJrZXQgVm9sYXRpbGl0eScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0dlbmVyYWwgbWFya2V0IHVuY2VydGFpbnR5IGFuZCB2b2xhdGlsaXR5JyxcbiAgICAgIGltcGFjdDogMC4xNSxcbiAgICAgIG1pdGlnYXRpb246IFsnRGl2ZXJzaWZpY2F0aW9uJywgJ1Jpc2sgbWFuYWdlbWVudCcsICdQb3NpdGlvbiBzaXppbmcnXVxuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBmYWN0b3JzO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVPdmVyYWxsQ29uZmlkZW5jZShcbiAgICBicmVha2Rvd246IENvbmZpZGVuY2VCcmVha2Rvd24sXG4gICAgdW5jZXJ0YWludHlGYWN0b3JzOiBVbmNlcnRhaW50eUZhY3RvcltdLFxuICAgIGJhc2VDb25maWRlbmNlOiBudW1iZXJcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBicmVha2Rvd25BdmVyYWdlID0gKFxuICAgICAgYnJlYWtkb3duLmRhdGFRdWFsaXR5ICtcbiAgICAgIGJyZWFrZG93bi5tb2RlbFJlbGlhYmlsaXR5ICtcbiAgICAgIGJyZWFrZG93bi5tYXJrZXRDb25kaXRpb25zICtcbiAgICAgIGJyZWFrZG93bi50aW1lSG9yaXpvbiArXG4gICAgICBicmVha2Rvd24uY29tcGxleGl0eVxuICAgICkgLyA1O1xuICAgIFxuICAgIGNvbnN0IHVuY2VydGFpbnR5UmVkdWN0aW9uID0gdW5jZXJ0YWludHlGYWN0b3JzLnJlZHVjZSgoc3VtLCBmYWN0b3IpID0+IHN1bSArIGZhY3Rvci5pbXBhY3QsIDApO1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAoYmFzZUNvbmZpZGVuY2UgKyBicmVha2Rvd25BdmVyYWdlKSAvIDIgLSB1bmNlcnRhaW50eVJlZHVjdGlvbikpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVSb2J1c3RuZXNzKHNjZW5hcmlvczogU2Vuc2l0aXZpdHlTY2VuYXJpb1tdLCBiYXNlQ29uZmlkZW5jZTogbnVtYmVyKTogbnVtYmVyIHtcbiAgICBjb25zdCBjb25maWRlbmNlVmFyaWF0aW9ucyA9IHNjZW5hcmlvcy5tYXAoc2NlbmFyaW8gPT4gXG4gICAgICBNYXRoLmFicyhzY2VuYXJpby5yZXN1bHRpbmdDb25maWRlbmNlIC0gYmFzZUNvbmZpZGVuY2UpXG4gICAgKTtcbiAgICBcbiAgICBjb25zdCBtYXhWYXJpYXRpb24gPSBNYXRoLm1heCguLi5jb25maWRlbmNlVmFyaWF0aW9ucyk7XG4gICAgcmV0dXJuIE1hdGgubWF4KDAsIDEgLSBtYXhWYXJpYXRpb24pO1xuICB9XG5cbiAgLy8gQWRkaXRpb25hbCBoZWxwZXIgbWV0aG9kc1xuICBwcml2YXRlIGNhbGN1bGF0ZUNvbnNpc3RlbmN5KGRhdGFQb2ludHM6IERhdGFQb2ludFtdKTogbnVtYmVyIHtcbiAgICAvLyBTaW1wbGUgY29uc2lzdGVuY3kgY2FsY3VsYXRpb24gLSBpbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgYW5hbHl6ZSBkYXRhIGNvbnNpc3RlbmN5XG4gICAgcmV0dXJuIDAuODtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlVGltZWxpbmVzcyhkYXRhUG9pbnRzOiBEYXRhUG9pbnRbXSk6IG51bWJlciB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBhdmdBZ2UgPSBkYXRhUG9pbnRzLnJlZHVjZSgoc3VtLCBkcCkgPT4gXG4gICAgICBzdW0gKyAobm93LmdldFRpbWUoKSAtIGRwLnRpbWVzdGFtcC5nZXRUaW1lKCkpLCAwXG4gICAgKSAvIGRhdGFQb2ludHMubGVuZ3RoO1xuICAgIFxuICAgIGNvbnN0IG1heEFjY2VwdGFibGVBZ2UgPSA3ICogMjQgKiA2MCAqIDYwICogMTAwMDsgLy8gNyBkYXlzIGluIG1pbGxpc2Vjb25kc1xuICAgIHJldHVybiBNYXRoLm1heCgwLCAxIC0gKGF2Z0FnZSAvIG1heEFjY2VwdGFibGVBZ2UpKTtcbiAgfVxuXG4gIHByaXZhdGUgaWRlbnRpZnlEYXRhR2Fwcyh0b3BpY0NvdmVyYWdlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+KTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHJlcXVpcmVkVG9waWNzID0gWydmdW5kYW1lbnRhbCcsICd0ZWNobmljYWwnLCAnc2VudGltZW50JywgJ25ld3MnLCAncmVzZWFyY2gnXTtcbiAgICByZXR1cm4gcmVxdWlyZWRUb3BpY3MuZmlsdGVyKHRvcGljID0+ICF0b3BpY0NvdmVyYWdlW3RvcGljXSB8fCB0b3BpY0NvdmVyYWdlW3RvcGljXSA8IDIpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVEYXRhUXVhbGl0eVNjb3JlKGRhdGFQb2ludHM6IERhdGFQb2ludFtdKTogbnVtYmVyIHtcbiAgICBpZiAoZGF0YVBvaW50cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIHJldHVybiBkYXRhUG9pbnRzLnJlZHVjZSgoc3VtLCBkcCkgPT4gc3VtICsgZHAucmVsaWFiaWxpdHksIDApIC8gZGF0YVBvaW50cy5sZW5ndGg7XG4gIH1cblxuICBwcml2YXRlIGFzc2Vzc01hcmtldENvbmRpdGlvbnMoaW52ZXN0bWVudElkZWE6IEludmVzdG1lbnRJZGVhKTogbnVtYmVyIHtcbiAgICAvLyBTaW1wbGUgbWFya2V0IGNvbmRpdGlvbnMgYXNzZXNzbWVudCBiYXNlZCBvbiBtZXRhZGF0YVxuICAgIGNvbnN0IG1hcmtldENvbmRpdGlvbnMgPSBpbnZlc3RtZW50SWRlYS5tZXRhZGF0YT8ubWFya2V0Q29uZGl0aW9uc0F0R2VuZXJhdGlvbjtcbiAgICBpZiAoIW1hcmtldENvbmRpdGlvbnMpIHJldHVybiAwLjc7XG4gICAgXG4gICAgbGV0IHNjb3JlID0gMC41O1xuICAgIGlmIChtYXJrZXRDb25kaXRpb25zLm1hcmtldFRyZW5kID09PSAnYnVsbCcpIHNjb3JlICs9IDAuMjtcbiAgICBpZiAobWFya2V0Q29uZGl0aW9ucy52b2xhdGlsaXR5SW5kZXggPCAyMCkgc2NvcmUgKz0gMC4yO1xuICAgIGlmIChtYXJrZXRDb25kaXRpb25zLmdlb3BvbGl0aWNhbFJpc2sgPT09ICdsb3cnKSBzY29yZSArPSAwLjE7XG4gICAgXG4gICAgcmV0dXJuIE1hdGgubWluKDEsIHNjb3JlKTtcbiAgfVxuXG4gIHByaXZhdGUgYXNzZXNzVGltZUhvcml6b25Db25maWRlbmNlKHRpbWVIb3Jpem9uOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGNvbnN0IGNvbmZpZGVuY2VNYXA6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7XG4gICAgICAnaW50cmFkYXknOiAwLjYsXG4gICAgICAnc2hvcnQnOiAwLjcsXG4gICAgICAnbWVkaXVtJzogMC44LFxuICAgICAgJ2xvbmcnOiAwLjksXG4gICAgICAndmVyeS1sb25nJzogMC43XG4gICAgfTtcbiAgICBcbiAgICByZXR1cm4gY29uZmlkZW5jZU1hcFt0aW1lSG9yaXpvbl0gfHwgMC43O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3Nlc3NDb21wbGV4aXR5KGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSk6IG51bWJlciB7XG4gICAgbGV0IGNvbXBsZXhpdHkgPSAwLjg7XG4gICAgXG4gICAgLy8gUmVkdWNlIGNvbmZpZGVuY2UgZm9yIGNvbXBsZXggc3RyYXRlZ2llc1xuICAgIGlmIChpbnZlc3RtZW50SWRlYS5zdHJhdGVneSA9PT0gJ2NvbXBsZXgnKSBjb21wbGV4aXR5IC09IDAuMjtcbiAgICBpZiAoaW52ZXN0bWVudElkZWEuaW52ZXN0bWVudHMubGVuZ3RoID4gNSkgY29tcGxleGl0eSAtPSAwLjE7XG4gICAgaWYgKGludmVzdG1lbnRJZGVhLmNvdW50ZXJBcmd1bWVudHMubGVuZ3RoID4gMykgY29tcGxleGl0eSAtPSAwLjE7XG4gICAgXG4gICAgcmV0dXJuIE1hdGgubWF4KDAuMywgY29tcGxleGl0eSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlVmlzdWFsaXphdGlvblN1Z2dlc3Rpb25zKFxuICAgIGludmVzdG1lbnRJZGVhOiBJbnZlc3RtZW50SWRlYSxcbiAgICByZWFzb25pbmc6IFJlYXNvbmluZ0V4cGxhbmF0aW9uLFxuICAgIGRhdGFBdHRyaWJ1dGlvbjogRGF0YVNvdXJjZUF0dHJpYnV0aW9uLFxuICAgIGNvbmZpZGVuY2VBbmFseXNpczogQ29uZmlkZW5jZUFuYWx5c2lzXG4gICk6IFByb21pc2U8VmlzdWFsaXphdGlvblN1Z2dlc3Rpb25bXT4ge1xuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdkZWNpc2lvbi10cmVlJyxcbiAgICAgICAgdGl0bGU6ICdJbnZlc3RtZW50IERlY2lzaW9uIFRyZWUnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Zpc3VhbCByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGVjaXNpb24tbWFraW5nIHByb2Nlc3MnLFxuICAgICAgICBkYXRhOiByZWFzb25pbmcuZGVjaXNpb25QYXRoLFxuICAgICAgICBwcmlvcml0eTogJ2hpZ2gnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiAnZmFjdG9yLWltcG9ydGFuY2UnLFxuICAgICAgICB0aXRsZTogJ0tleSBGYWN0b3IgSW1wb3J0YW5jZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hhcnQgc2hvd2luZyB0aGUgcmVsYXRpdmUgaW1wb3J0YW5jZSBvZiBkaWZmZXJlbnQgZmFjdG9ycycsXG4gICAgICAgIGRhdGE6IHJlYXNvbmluZy5rZXlGYWN0b3JzLFxuICAgICAgICBwcmlvcml0eTogJ2hpZ2gnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiAnY29uZmlkZW5jZS1iYW5kcycsXG4gICAgICAgIHRpdGxlOiAnQ29uZmlkZW5jZSBJbnRlcnZhbHMnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Zpc3VhbGl6YXRpb24gb2YgY29uZmlkZW5jZSBpbnRlcnZhbHMgYW5kIHVuY2VydGFpbnR5JyxcbiAgICAgICAgZGF0YTogY29uZmlkZW5jZUFuYWx5c2lzLmNvbmZpZGVuY2VJbnRlcnZhbCxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiAnZGF0YS1mbG93JyxcbiAgICAgICAgdGl0bGU6ICdEYXRhIFNvdXJjZSBGbG93JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdIb3cgZGlmZmVyZW50IGRhdGEgc291cmNlcyBjb250cmlidXRlIHRvIHRoZSBhbmFseXNpcycsXG4gICAgICAgIGRhdGE6IGRhdGFBdHRyaWJ1dGlvbi5zb3VyY2VzLFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bSdcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdzY2VuYXJpby1jb21wYXJpc29uJyxcbiAgICAgICAgdGl0bGU6ICdTY2VuYXJpbyBDb21wYXJpc29uJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb21wYXJpc29uIG9mIGRpZmZlcmVudCBvdXRjb21lIHNjZW5hcmlvcycsXG4gICAgICAgIGRhdGE6IGludmVzdG1lbnRJZGVhLnBvdGVudGlhbE91dGNvbWVzLFxuICAgICAgICBwcmlvcml0eTogJ2xvdydcbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUV4cGxhbmF0aW9uU3VtbWFyeShcbiAgICBpbnZlc3RtZW50SWRlYTogSW52ZXN0bWVudElkZWEsXG4gICAgcmVhc29uaW5nOiBSZWFzb25pbmdFeHBsYW5hdGlvbixcbiAgICBkYXRhQXR0cmlidXRpb246IERhdGFTb3VyY2VBdHRyaWJ1dGlvbixcbiAgICBjb25maWRlbmNlQW5hbHlzaXM6IENvbmZpZGVuY2VBbmFseXNpc1xuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleUZhY3RvcnNUZXh0ID0gcmVhc29uaW5nLmtleUZhY3RvcnNcbiAgICAgIC5zbGljZSgwLCAzKVxuICAgICAgLm1hcChmYWN0b3IgPT4gYCR7ZmFjdG9yLm5hbWV9ICgke01hdGgucm91bmQoZmFjdG9yLndlaWdodCAqIDEwMCl9JSBpbXBvcnRhbmNlKWApXG4gICAgICAuam9pbignLCAnKTtcbiAgICBcbiAgICBjb25zdCBkYXRhU291cmNlc1RleHQgPSBkYXRhQXR0cmlidXRpb24uc291cmNlc1xuICAgICAgLnNsaWNlKDAsIDMpXG4gICAgICAubWFwKHNvdXJjZSA9PiBzb3VyY2Uuc291cmNlTmFtZSlcbiAgICAgIC5qb2luKCcsICcpO1xuICAgIFxuICAgIGNvbnN0IGNvbmZpZGVuY2VUZXh0ID0gYCR7TWF0aC5yb3VuZChjb25maWRlbmNlQW5hbHlzaXMub3ZlcmFsbENvbmZpZGVuY2UgKiAxMDApfSVgO1xuICAgIFxuICAgIHJldHVybiBgVGhpcyBpbnZlc3RtZW50IGlkZWEgaXMgYmFzZWQgb24gJHtyZWFzb25pbmcua2V5RmFjdG9ycy5sZW5ndGh9IGtleSBmYWN0b3JzLCB3aXRoIHRoZSBtb3N0IGltcG9ydGFudCBiZWluZzogJHtrZXlGYWN0b3JzVGV4dH0uIGAgK1xuICAgICAgICAgICBgVGhlIGFuYWx5c2lzIGRyYXdzIGZyb20gJHtkYXRhQXR0cmlidXRpb24uc291cmNlcy5sZW5ndGh9IGRhdGEgc291cmNlcyBpbmNsdWRpbmcgJHtkYXRhU291cmNlc1RleHR9LiBgICtcbiAgICAgICAgICAgYE92ZXJhbGwgY29uZmlkZW5jZSBpbiB0aGlzIHJlY29tbWVuZGF0aW9uIGlzICR7Y29uZmlkZW5jZVRleHR9LCB3aXRoIGEgY29uZmlkZW5jZSBpbnRlcnZhbCBvZiBgICtcbiAgICAgICAgICAgYCR7TWF0aC5yb3VuZChjb25maWRlbmNlQW5hbHlzaXMuY29uZmlkZW5jZUludGVydmFsLmxvd2VyICogMTAwKX0lIHRvICR7TWF0aC5yb3VuZChjb25maWRlbmNlQW5hbHlzaXMuY29uZmlkZW5jZUludGVydmFsLnVwcGVyICogMTAwKX0lLmA7XG4gIH1cbn0iXX0=