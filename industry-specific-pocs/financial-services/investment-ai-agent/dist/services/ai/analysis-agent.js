"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisAgent = void 0;
const amazon_nova_pro_service_1 = require("./amazon-nova-pro-service");
const uuid_1 = require("uuid");
/**
 * Analysis Agent class that handles all financial analysis tasks
 */
class AnalysisAgent {
    constructor(novaProService, marketDataService) {
        this.agentType = 'analysis';
        this.novaProService = novaProService;
        this.marketDataService = marketDataService;
    }
    /**
     * Process an analysis request and return comprehensive analysis results
     */
    async processAnalysisRequest(request) {
        const startTime = Date.now();
        try {
            let response;
            switch (request.analysisType) {
                case 'fundamental':
                    response = await this.performFundamentalAnalysis(request, startTime);
                    break;
                case 'technical':
                    response = await this.performTechnicalAnalysis(request, startTime);
                    break;
                case 'sentiment':
                    response = await this.performSentimentAnalysis(request, startTime);
                    break;
                case 'risk':
                    response = await this.performRiskAnalysis(request, startTime);
                    break;
                case 'correlation':
                    response = await this.performCorrelationAnalysis(request, startTime);
                    break;
                case 'scenario':
                    response = await this.performScenarioAnalysis(request, startTime);
                    break;
                case 'comprehensive':
                    response = await this.performComprehensiveAnalysis(request, startTime);
                    break;
                default:
                    throw new Error(`Unsupported analysis type: ${request.analysisType}`);
            }
            // Don't override execution time if it's already set by the individual analysis method
            if (response.executionTime === 0) {
                response.executionTime = Date.now() - startTime;
            }
            return response;
        }
        catch (error) {
            console.error('Error processing analysis request:', error);
            throw error;
        }
    }
    /**
     * Perform fundamental analysis
     */
    async performFundamentalAnalysis(request, startTime = Date.now()) {
        const results = [];
        for (const investment of request.investments) {
            const analysisResult = await this.analyzeFundamentals(investment, request.parameters);
            results.push(analysisResult);
        }
        const riskAssessment = await this.assessPortfolioRisk(request.investments, request.parameters);
        const recommendations = await this.generateFundamentalRecommendations(results, request.parameters);
        return {
            results,
            riskAssessment,
            recommendations,
            confidence: this.calculateAnalysisConfidence(results),
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Analyze fundamentals for a single investment
     */
    async analyzeFundamentals(investment, parameters) {
        const prompt = `
      Perform comprehensive fundamental analysis for ${investment.name} (${investment.ticker || 'N/A'}).
      
      Investment Details:
      - Type: ${investment.type}
      - Sector: ${investment.sector || 'N/A'}
      - Industry: ${investment.industry || 'N/A'}
      - Market Cap: ${investment.marketCap ? `$${investment.marketCap.toLocaleString()}` : 'N/A'}
      - Current Price: ${investment.currentPrice ? `$${investment.currentPrice}` : 'N/A'}
      
      Fundamental Data:
      ${investment.fundamentals ? JSON.stringify(investment.fundamentals, null, 2) : 'No fundamental data available'}
      
      Please provide:
      1. Financial ratio analysis and interpretation
      2. Valuation assessment (overvalued/undervalued/fairly valued)
      3. Growth prospects and sustainability
      4. Competitive position and moat analysis
      5. Key strengths and weaknesses
      6. Investment recommendation with target price
    `;
        const response = await this.novaProService.complete({
            prompt,
            template: amazon_nova_pro_service_1.NovaProPromptTemplate.FINANCIAL_ANALYSIS,
            templateVariables: {
                investmentDetails: `${investment.name} - ${investment.type}`,
                financialData: JSON.stringify(investment.fundamentals || {}),
                analysisRequirements: 'Comprehensive fundamental analysis',
                keyMetrics: 'P/E, P/B, ROE, ROA, Debt/Equity, Revenue Growth',
                timePeriod: parameters.timeHorizon || 'medium-term'
            },
            analysisType: 'qualitative',
            maxTokens: 2000
        });
        const analysisDetails = await this.parseFundamentalAnalysis(response.completion);
        return {
            id: (0, uuid_1.v4)(),
            investmentId: investment.id,
            analysisType: 'fundamental',
            timestamp: new Date(),
            analyst: 'analysis-agent-nova-pro',
            summary: analysisDetails.summary,
            confidence: analysisDetails.confidence,
            details: analysisDetails.details,
            recommendations: analysisDetails.recommendations,
            dataPoints: this.extractDataPoints(investment, 'fundamental')
        };
    }
    /**
     * Perform correlation analysis
     */
    async performCorrelationAnalysis(request, startTime = Date.now()) {
        const correlationMatrix = await this.calculateCorrelationMatrix(request.investments);
        const causationAnalysis = await this.performCausationAnalysis(request.investments);
        const riskAssessment = await this.assessCorrelationRisk(correlationMatrix, request.parameters);
        const results = [{
                id: (0, uuid_1.v4)(),
                investmentId: 'portfolio',
                analysisType: 'comprehensive',
                timestamp: new Date(),
                analyst: 'analysis-agent-nova-pro',
                summary: await this.generateCorrelationSummary(correlationMatrix, causationAnalysis),
                confidence: 0.85,
                details: {
                    strengths: [`Identified ${correlationMatrix.significantCorrelations.length} significant correlations`],
                    weaknesses: ['Correlation does not imply causation'],
                    opportunities: ['Diversification opportunities identified'],
                    threats: ['High correlation during market stress'],
                    keyMetrics: {
                        'Average Correlation': this.calculateAverageCorrelation(correlationMatrix),
                        'Max Correlation': this.findMaxCorrelation(correlationMatrix),
                        'Diversification Score': riskAssessment.diversificationScore
                    },
                    narratives: [await this.generateCorrelationNarrative(correlationMatrix)]
                },
                recommendations: await this.generateCorrelationRecommendations(correlationMatrix, riskAssessment),
                dataPoints: []
            }];
        return {
            results,
            correlationMatrix,
            riskAssessment,
            recommendations: results[0].recommendations,
            confidence: 0.85,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Calculate correlation matrix for investments
     */
    async calculateCorrelationMatrix(investments) {
        const returns = this.calculateReturns(investments);
        const matrix = {};
        const significantCorrelations = [];
        // Calculate pairwise correlations
        for (let i = 0; i < investments.length; i++) {
            const asset1 = investments[i];
            matrix[asset1.id] = {};
            for (let j = 0; j < investments.length; j++) {
                const asset2 = investments[j];
                const correlation = this.calculatePearsonCorrelation(returns[asset1.id] || [], returns[asset2.id] || []);
                matrix[asset1.id][asset2.id] = correlation;
                // Track significant correlations (excluding self-correlation)
                if (i !== j && Math.abs(correlation) > 0.5) {
                    significantCorrelations.push({
                        asset1: asset1.name,
                        asset2: asset2.name,
                        correlation,
                        significance: Math.abs(correlation),
                        interpretation: this.interpretCorrelation(correlation)
                    });
                }
            }
        }
        return {
            matrix,
            significantCorrelations: significantCorrelations.sort((a, b) => b.significance - a.significance)
        };
    }
    /**
     * Perform scenario analysis
     */
    async performScenarioAnalysis(request, startTime = Date.now()) {
        const scenarios = request.parameters.scenarios || this.getDefaultScenarios();
        const scenarioResults = [];
        for (const scenario of scenarios) {
            const outcome = await this.evaluateScenario(request.investments, scenario);
            scenarioResults.push(outcome);
        }
        const scenarioAnalysis = {
            scenarios: scenarioResults,
            expectedValue: this.calculateExpectedValue(scenarioResults),
            worstCase: scenarioResults.reduce((worst, current) => current.portfolioReturn < worst.portfolioReturn ? current : worst),
            bestCase: scenarioResults.reduce((best, current) => current.portfolioReturn > best.portfolioReturn ? current : best),
            probabilityWeightedReturn: this.calculateProbabilityWeightedReturn(scenarioResults)
        };
        const riskAssessment = await this.assessScenarioRisk(scenarioAnalysis, request.parameters);
        const recommendations = await this.generateScenarioRecommendations(scenarioAnalysis);
        const results = [{
                id: (0, uuid_1.v4)(),
                investmentId: 'portfolio',
                analysisType: 'comprehensive',
                timestamp: new Date(),
                analyst: 'analysis-agent-nova-pro',
                summary: await this.generateScenarioSummary(scenarioAnalysis),
                confidence: 0.80,
                details: {
                    strengths: ['Comprehensive scenario coverage'],
                    weaknesses: ['Scenario probabilities are estimates'],
                    opportunities: [`Best case return: ${(scenarioAnalysis.bestCase.portfolioReturn * 100).toFixed(1)}%`],
                    threats: [`Worst case loss: ${(scenarioAnalysis.worstCase.portfolioReturn * 100).toFixed(1)}%`],
                    keyMetrics: {
                        'Expected Return': scenarioAnalysis.expectedValue,
                        'Probability Weighted Return': scenarioAnalysis.probabilityWeightedReturn,
                        'Best Case': scenarioAnalysis.bestCase.portfolioReturn,
                        'Worst Case': scenarioAnalysis.worstCase.portfolioReturn
                    },
                    narratives: [await this.generateScenarioNarrative(scenarioAnalysis)]
                },
                recommendations,
                dataPoints: []
            }];
        return {
            results,
            scenarioAnalysis,
            riskAssessment,
            recommendations,
            confidence: 0.80,
            executionTime: Date.now() - startTime
        };
    }
    /**
     * Perform comprehensive analysis combining multiple analysis types
     */
    async performComprehensiveAnalysis(request, startTime = Date.now()) {
        // Perform all analysis types in parallel
        const [fundamentalResponse, correlationResponse, scenarioResponse] = await Promise.all([
            this.performFundamentalAnalysis({ ...request, analysisType: 'fundamental' }, startTime),
            this.performCorrelationAnalysis({ ...request, analysisType: 'correlation' }, startTime),
            this.performScenarioAnalysis({ ...request, analysisType: 'scenario' }, startTime)
        ]);
        // Combine results
        const combinedResults = [
            ...fundamentalResponse.results,
            ...correlationResponse.results,
            ...scenarioResponse.results
        ];
        const comprehensiveRiskAssessment = await this.combineRiskAssessments([
            fundamentalResponse.riskAssessment,
            correlationResponse.riskAssessment,
            scenarioResponse.riskAssessment
        ]);
        const comprehensiveRecommendations = await this.synthesizeRecommendations([
            ...fundamentalResponse.recommendations,
            ...correlationResponse.recommendations,
            ...scenarioResponse.recommendations
        ]);
        return {
            results: combinedResults,
            correlationMatrix: correlationResponse.correlationMatrix,
            scenarioAnalysis: scenarioResponse.scenarioAnalysis,
            riskAssessment: comprehensiveRiskAssessment,
            recommendations: comprehensiveRecommendations,
            confidence: this.calculateComprehensiveConfidence([
                fundamentalResponse.confidence,
                correlationResponse.confidence,
                scenarioResponse.confidence
            ]),
            executionTime: Date.now() - startTime
        };
    }
    // Helper methods for calculations and analysis
    calculateReturns(investments) {
        const returns = {};
        investments.forEach(investment => {
            if (investment.historicalPerformance && investment.historicalPerformance.length > 1) {
                const prices = investment.historicalPerformance.map(p => p.close);
                const assetReturns = [];
                for (let i = 1; i < prices.length; i++) {
                    const returnValue = (prices[i] - prices[i - 1]) / prices[i - 1];
                    assetReturns.push(returnValue);
                }
                returns[investment.id] = assetReturns;
            }
            else {
                returns[investment.id] = [];
            }
        });
        return returns;
    }
    calculatePearsonCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0)
            return 0;
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    interpretCorrelation(correlation) {
        const abs = Math.abs(correlation);
        if (abs >= 0.8)
            return 'Very strong correlation';
        if (abs >= 0.6)
            return 'Strong correlation';
        if (abs >= 0.4)
            return 'Moderate correlation';
        if (abs >= 0.2)
            return 'Weak correlation';
        return 'Very weak correlation';
    }
    getDefaultScenarios() {
        return [
            {
                name: 'Bull Market',
                description: 'Strong economic growth with low volatility',
                marketConditions: {
                    economicGrowth: 0.04,
                    inflation: 0.02,
                    interestRates: 0.03,
                    volatility: 0.15
                },
                probability: 0.25
            },
            {
                name: 'Base Case',
                description: 'Moderate economic growth with normal volatility',
                marketConditions: {
                    economicGrowth: 0.025,
                    inflation: 0.025,
                    interestRates: 0.04,
                    volatility: 0.20
                },
                probability: 0.40
            },
            {
                name: 'Bear Market',
                description: 'Economic recession with high volatility',
                marketConditions: {
                    economicGrowth: -0.02,
                    inflation: 0.01,
                    interestRates: 0.02,
                    volatility: 0.35
                },
                probability: 0.20
            },
            {
                name: 'Stagflation',
                description: 'Low growth with high inflation',
                marketConditions: {
                    economicGrowth: 0.01,
                    inflation: 0.06,
                    interestRates: 0.06,
                    volatility: 0.25
                },
                probability: 0.15
            }
        ];
    }
    // Additional helper methods would be implemented here...
    // This is a comprehensive foundation for the analysis agent
    async evaluateScenario(investments, scenario) {
        // Simplified scenario evaluation - would be more sophisticated in practice
        const baseReturn = scenario.marketConditions.economicGrowth || 0;
        const volatilityAdjustment = (scenario.marketConditions.volatility || 0.2) - 0.2;
        const portfolioReturn = baseReturn - (volatilityAdjustment * 0.5);
        const individualReturns = {};
        investments.forEach(investment => {
            // Apply sector-specific adjustments
            let sectorMultiplier = 1.0;
            if (investment.sector === 'Technology')
                sectorMultiplier = 1.2;
            if (investment.sector === 'Utilities')
                sectorMultiplier = 0.8;
            individualReturns[investment.id] = portfolioReturn * sectorMultiplier;
        });
        return {
            scenario,
            portfolioReturn,
            individualReturns,
            riskMetrics: {
                volatility: scenario.marketConditions.volatility || 0.2,
                beta: 1.0,
                sharpeRatio: portfolioReturn / (scenario.marketConditions.volatility || 0.2),
                drawdown: Math.abs(Math.min(0, portfolioReturn)),
                var: portfolioReturn - (1.645 * (scenario.marketConditions.volatility || 0.2)),
                correlations: {}
            },
            probability: scenario.probability
        };
    }
    calculateExpectedValue(scenarios) {
        return scenarios.reduce((sum, scenario) => sum + (scenario.portfolioReturn * scenario.probability), 0);
    }
    calculateProbabilityWeightedReturn(scenarios) {
        return this.calculateExpectedValue(scenarios);
    }
    // Placeholder implementations for remaining methods
    async performTechnicalAnalysis(request, startTime = Date.now()) {
        // Implementation would go here
        return this.performFundamentalAnalysis(request, startTime);
    }
    async performSentimentAnalysis(request, startTime = Date.now()) {
        // Implementation would go here
        return this.performFundamentalAnalysis(request, startTime);
    }
    async performRiskAnalysis(request, startTime = Date.now()) {
        // Implementation would go here
        return this.performFundamentalAnalysis(request, startTime);
    }
    async performCausationAnalysis(investments) {
        // Placeholder implementation
        return {
            causalRelationships: [],
            statisticalSignificance: {},
            methodology: 'Granger Causality',
            limitations: ['Limited historical data'],
            confidence: 0.7
        };
    }
    // Additional helper methods with placeholder implementations
    async parseFundamentalAnalysis(completion) {
        return {
            summary: 'Fundamental analysis completed',
            confidence: 0.8,
            details: {
                strengths: ['Strong fundamentals'],
                weaknesses: ['Market volatility'],
                opportunities: ['Growth potential'],
                threats: ['Economic uncertainty'],
                keyMetrics: {},
                narratives: [completion]
            },
            recommendations: [{
                    action: 'hold',
                    timeHorizon: 'medium',
                    confidence: 0.8,
                    rationale: 'Based on fundamental analysis'
                }]
        };
    }
    extractDataPoints(investment, type) {
        return [{
                source: 'fundamental-analysis',
                type: 'fundamental',
                value: investment.fundamentals,
                timestamp: new Date(),
                reliability: 0.8
            }];
    }
    async assessPortfolioRisk(investments, parameters) {
        return {
            overallRisk: 'medium',
            riskScore: 0.6,
            keyRisks: [],
            diversificationScore: 0.7
        };
    }
    async generateFundamentalRecommendations(results, parameters) {
        return [{
                action: 'hold',
                timeHorizon: 'medium',
                confidence: 0.8,
                rationale: 'Based on comprehensive fundamental analysis'
            }];
    }
    calculateAnalysisConfidence(results) {
        if (results.length === 0)
            return 0;
        return results.reduce((sum, result) => sum + result.confidence, 0) / results.length;
    }
    calculateAverageCorrelation(matrix) {
        const correlations = matrix.significantCorrelations.map(c => Math.abs(c.correlation));
        return correlations.reduce((sum, corr) => sum + corr, 0) / correlations.length || 0;
    }
    findMaxCorrelation(matrix) {
        return Math.max(...matrix.significantCorrelations.map(c => Math.abs(c.correlation)), 0);
    }
    async generateCorrelationSummary(matrix, causation) {
        return `Correlation analysis identified ${matrix.significantCorrelations.length} significant relationships`;
    }
    async generateCorrelationNarrative(matrix) {
        return 'Detailed correlation analysis narrative';
    }
    async generateCorrelationRecommendations(matrix, risk) {
        return [{
                action: 'hold',
                timeHorizon: 'medium',
                confidence: 0.8,
                rationale: 'Based on correlation analysis'
            }];
    }
    async assessCorrelationRisk(matrix, parameters) {
        return {
            overallRisk: 'medium',
            riskScore: 0.6,
            keyRisks: [],
            diversificationScore: 1 - this.calculateAverageCorrelation(matrix)
        };
    }
    async generateScenarioSummary(analysis) {
        return `Scenario analysis shows expected return of ${(analysis.expectedValue * 100).toFixed(1)}%`;
    }
    async generateScenarioNarrative(analysis) {
        return 'Detailed scenario analysis narrative';
    }
    async generateScenarioRecommendations(analysis) {
        return [{
                action: 'hold',
                timeHorizon: 'medium',
                confidence: 0.8,
                rationale: 'Based on scenario analysis'
            }];
    }
    async assessScenarioRisk(analysis, parameters) {
        return {
            overallRisk: 'medium',
            riskScore: 0.6,
            keyRisks: [],
            diversificationScore: 0.7
        };
    }
    async combineRiskAssessments(assessments) {
        const avgRiskScore = assessments.reduce((sum, a) => sum + a.riskScore, 0) / assessments.length;
        return {
            overallRisk: avgRiskScore > 0.7 ? 'high' : avgRiskScore > 0.4 ? 'medium' : 'low',
            riskScore: avgRiskScore,
            keyRisks: [],
            diversificationScore: assessments.reduce((sum, a) => sum + a.diversificationScore, 0) / assessments.length
        };
    }
    async synthesizeRecommendations(recommendations) {
        // Remove duplicates and prioritize
        const unique = recommendations.filter((rec, index, self) => index === self.findIndex(r => r.action === rec.action && r.timeHorizon === rec.timeHorizon));
        return unique.slice(0, 5); // Return top 5 recommendations
    }
    calculateComprehensiveConfidence(confidences) {
        return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    }
    /**
     * Handle agent messages for communication with other agents
     */
    async handleMessage(message) {
        try {
            let responseContent;
            switch (message.messageType) {
                case 'request':
                    if (message.content.type === 'analysis') {
                        responseContent = await this.processAnalysisRequest(message.content.request);
                    }
                    else {
                        throw new Error(`Unsupported request type: ${message.content.type}`);
                    }
                    break;
                default:
                    throw new Error(`Unsupported message type: ${message.messageType}`);
            }
            return {
                sender: this.agentType,
                recipient: message.sender,
                messageType: 'response',
                content: responseContent,
                metadata: {
                    priority: message.metadata.priority,
                    timestamp: new Date(),
                    conversationId: message.metadata.conversationId,
                    requestId: message.metadata.requestId
                }
            };
        }
        catch (error) {
            console.error('Error handling message:', error);
            throw error;
        }
    }
}
exports.AnalysisAgent = AnalysisAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHlzaXMtYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvYW5hbHlzaXMtYWdlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7O0FBRUgsdUVBQXdGO0FBcUJ4RiwrQkFBb0M7QUF1SXBDOztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBS3hCLFlBQ0UsY0FBb0MsRUFDcEMsaUJBQW9DO1FBSjlCLGNBQVMsR0FBYyxVQUFVLENBQUM7UUFNeEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDckMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO0lBQzdDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxPQUF3QjtRQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFN0IsSUFBSTtZQUNGLElBQUksUUFBMEIsQ0FBQztZQUUvQixRQUFRLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQzVCLEtBQUssYUFBYTtvQkFDaEIsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDckUsTUFBTTtnQkFDUixLQUFLLFdBQVc7b0JBQ2QsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDbkUsTUFBTTtnQkFDUixLQUFLLFdBQVc7b0JBQ2QsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDbkUsTUFBTTtnQkFDUixLQUFLLE1BQU07b0JBQ1QsUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDOUQsTUFBTTtnQkFDUixL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QUFDO1lBQUUsT0FBTyxDQUFDLENBQUM7UUFFdEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNuQixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQyxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0RCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFdEQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQzFDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFckYsT0FBTyxXQUFXLEtB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QyxDQUFDO3FCQUM5RTt5QkFBTTt3QkFDTCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7cUJBQ3RFO29CQUNELE1BQU07Z0JBQ1I7b0JBQ0UsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7YUFDdkU7WUFFRCxPQUFPO2dCQUNMLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDdEIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxNQUFNO2dCQUN6QixXQUFXLEVBQUUsVUFBVTtnQkFDdkIsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLFFBQVEsRUFBRTtvQkFDUixRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRO29CQUNuQyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3JCLGNBQWMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWM7b0JBQy9DLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVM7aUJBQ3RDO2FBQ0YsQ0FBQztTQUNIO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sS0FBSyxDQUFDO1NBQ2I7SUFDSCxDQUFDO0NBQ0Y7QUFscUJELHNDQWtxQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFuYWx5c2lzIEFnZW50IEltcGxlbWVudGF0aW9uXG4gKiBcbiAqIFRoaXMgYWdlbnQgaXMgcmVzcG9uc2libGUgZm9yOlxuICogLSBGaW5hbmNpYWwgYW5hbHlzaXMgYWxnb3JpdGhtc1xuICogLSBDb3JyZWxhdGlvbiBhbmQgY2F1c2F0aW9uIGFuYWx5c2lzXG4gKiAtIFNjZW5hcmlvIGdlbmVyYXRpb24gYW5kIGV2YWx1YXRpb25cbiAqIFxuICogVXNlcyBBbWF6b24gTm92YSBQcm8gZm9yIHNwZWNpYWxpemVkIGZpbmFuY2lhbCBhbmFseXNpcyBhbmQgcXVhbnRpdGF0aXZlIG1vZGVsaW5nXG4gKi9cblxuaW1wb3J0IHsgQW1hem9uTm92YVByb1NlcnZpY2UsIE5vdmFQcm9Qcm9tcHRUZW1wbGF0ZSB9IGZyb20gJy4vYW1hem9uLW5vdmEtcHJvLXNlcnZpY2UnO1xuaW1wb3J0IHsgTWFya2V0RGF0YVNlcnZpY2UgfSBmcm9tICcuLi9tYXJrZXQtZGF0YS1zZXJ2aWNlJztcbmltcG9ydCB7IFxuICBBZ2VudE1lc3NhZ2UsIFxuICBBZ2VudFRhc2ssIFxuICBDb252ZXJzYXRpb25Db250ZXh0LCBcbiAgQWdlbnRUeXBlIFxufSBmcm9tICcuLi8uLi9tb2RlbHMvYWdlbnQnO1xuaW1wb3J0IHsgXG4gIEFuYWx5c2lzUmVzdWx0LFxuICBBbmFseXNpc0RldGFpbHMsXG4gIEFuYWx5c2lzUmVjb21tZW5kYXRpb24sXG4gIERhdGFQb2ludFxufSBmcm9tICcuLi8uLi9tb2RlbHMvYW5hbHlzaXMnO1xuaW1wb3J0IHtcbiAgSW52ZXN0bWVudElkZWEsXG4gIE91dGNvbWUsXG4gIENvdW50ZXJBcmd1bWVudFxufSBmcm9tICcuLi8uLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcbmltcG9ydCB7IEludmVzdG1lbnQsIFJpc2tNZXRyaWNzIH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQnO1xuaW1wb3J0IHsgTWFya2V0RGF0YVBvaW50IH0gZnJvbSAnLi4vLi4vbW9kZWxzL21hcmtldC1kYXRhJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFuYWx5c2lzUmVxdWVzdCB7XG4gIGludmVzdG1lbnRzOiBJbnZlc3RtZW50W107XG4gIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyB8ICd0ZWNobmljYWwnIHwgJ3NlbnRpbWVudCcgfCAncmlzaycgfCAnY29tcHJlaGVuc2l2ZScgfCAnY29ycmVsYXRpb24nIHwgJ3NjZW5hcmlvJztcbiAgcGFyYW1ldGVyczoge1xuICAgIHRpbWVIb3Jpem9uPzogJ3Nob3J0JyB8ICdtZWRpdW0nIHwgJ2xvbmcnO1xuICAgIHJpc2tUb2xlcmFuY2U/OiAnY29uc2VydmF0aXZlJyB8ICdtb2RlcmF0ZScgfCAnYWdncmVzc2l2ZSc7XG4gICAgYmVuY2htYXJrcz86IHN0cmluZ1tdO1xuICAgIHNjZW5hcmlvcz86IFNjZW5hcmlvRGVmaW5pdGlvbltdO1xuICAgIGNvcnJlbGF0aW9uVGhyZXNob2xkPzogbnVtYmVyO1xuICAgIGNvbmZpZGVuY2VMZXZlbD86IG51bWJlcjtcbiAgICBpbmNsdWRlU3RyZXNzVGVzdGluZz86IGJvb2xlYW47XG4gICAgbWF4RHJhd2Rvd25MaW1pdD86IG51bWJlcjtcbiAgfTtcbiAgY29udGV4dD86IENvbnZlcnNhdGlvbkNvbnRleHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5hbHlzaXNSZXNwb25zZSB7XG4gIHJlc3VsdHM6IEFuYWx5c2lzUmVzdWx0W107XG4gIGNvcnJlbGF0aW9uTWF0cml4PzogQ29ycmVsYXRpb25NYXRyaXg7XG4gIHNjZW5hcmlvQW5hbHlzaXM/OiBTY2VuYXJpb0FuYWx5c2lzUmVzdWx0O1xuICByaXNrQXNzZXNzbWVudDogUmlza0Fzc2Vzc21lbnQ7XG4gIHJlY29tbWVuZGF0aW9uczogQW5hbHlzaXNSZWNvbW1lbmRhdGlvbltdO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG4gIGV4ZWN1dGlvblRpbWU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTY2VuYXJpb0RlZmluaXRpb24ge1xuICBuYW1lOiBzdHJpbmc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIG1hcmtldENvbmRpdGlvbnM6IHtcbiAgICBlY29ub21pY0dyb3d0aD86IG51bWJlcjtcbiAgICBpbmZsYXRpb24/OiBudW1iZXI7XG4gICAgaW50ZXJlc3RSYXRlcz86IG51bWJlcjtcbiAgICB2b2xhdGlsaXR5PzogbnVtYmVyO1xuICB9O1xuICBwcm9iYWJpbGl0eTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjZW5hcmlvQW5hbHlzaXNSZXN1bHQge1xuICBzY2VuYXJpb3M6IFNjZW5hcmlvT3V0Y29tZVtdO1xuICBleHBlY3RlZFZhbHVlOiBudW1iZXI7XG4gIHdvcnN0Q2FzZTogU2NlbmFyaW9PdXRjb21lO1xuICBiZXN0Q2FzZTogU2NlbmFyaW9PdXRjb21lO1xuICBwcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NlbmFyaW9PdXRjb21lIHtcbiAgc2NlbmFyaW86IFNjZW5hcmlvRGVmaW5pdGlvbjtcbiAgcG9ydGZvbGlvUmV0dXJuOiBudW1iZXI7XG4gIGluZGl2aWR1YWxSZXR1cm5zOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuICByaXNrTWV0cmljczogUmlza01ldHJpY3M7XG4gIHByb2JhYmlsaXR5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ycmVsYXRpb25NYXRyaXgge1xuICBtYXRyaXg6IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIG51bWJlcj4+O1xuICBzaWduaWZpY2FudENvcnJlbGF0aW9uczogQ29ycmVsYXRpb25QYWlyW107XG4gIHRpbWVWYXJ5aW5nQ29ycmVsYXRpb25zPzogVGltZVZhcnlpbmdDb3JyZWxhdGlvbltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvcnJlbGF0aW9uUGFpciB7XG4gIGFzc2V0MTogc3RyaW5nO1xuICBhc3NldDI6IHN0cmluZztcbiAgY29ycmVsYXRpb246IG51bWJlcjtcbiAgc2lnbmlmaWNhbmNlOiBudW1iZXI7XG4gIGludGVycHJldGF0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGltZVZhcnlpbmdDb3JyZWxhdGlvbiB7XG4gIGFzc2V0MTogc3RyaW5nO1xuICBhc3NldDI6IHN0cmluZztcbiAgY29ycmVsYXRpb25zOiB7IGRhdGU6IERhdGU7IGNvcnJlbGF0aW9uOiBudW1iZXIgfVtdO1xuICB0cmVuZDogJ2luY3JlYXNpbmcnIHwgJ2RlY3JlYXNpbmcnIHwgJ3N0YWJsZScgfCAndm9sYXRpbGUnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJpc2tBc3Nlc3NtZW50IHtcbiAgb3ZlcmFsbFJpc2s6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAndmVyeS1oaWdoJztcbiAgcmlza1Njb3JlOiBudW1iZXI7XG4gIGtleVJpc2tzOiBSaXNrRmFjdG9yW107XG4gIGRpdmVyc2lmaWNhdGlvblNjb3JlOiBudW1iZXI7XG4gIHN0cmVzc1Rlc3RSZXN1bHRzPzogU3RyZXNzVGVzdFJlc3VsdFtdO1xuICB2YWx1ZUF0Umlzaz86IFZhUlJlc3VsdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSaXNrRmFjdG9yIHtcbiAgZmFjdG9yOiBzdHJpbmc7XG4gIGltcGFjdDogJ2xvdycgfCAnbWVkaXVtJyB8ICdoaWdoJztcbiAgcHJvYmFiaWxpdHk6IG51bWJlcjtcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgbWl0aWdhdGlvbj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdHJlc3NUZXN0UmVzdWx0IHtcbiAgc2NlbmFyaW86IHN0cmluZztcbiAgcG9ydGZvbGlvTG9zczogbnVtYmVyO1xuICB3b3JzdEFzc2V0TG9zczogbnVtYmVyO1xuICByZWNvdmVyeVRpbWU6IG51bWJlcjtcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWYVJSZXN1bHQge1xuICBjb25maWRlbmNlTGV2ZWw6IG51bWJlcjtcbiAgdGltZUhvcml6b246IG51bWJlcjtcbiAgdmFsdWVBdFJpc2s6IG51bWJlcjtcbiAgZXhwZWN0ZWRTaG9ydGZhbGw6IG51bWJlcjtcbiAgaW50ZXJwcmV0YXRpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDYXVzYXRpb25BbmFseXNpc1JlcXVlc3Qge1xuICBkZXBlbmRlbnRWYXJpYWJsZTogc3RyaW5nO1xuICBpbmRlcGVuZGVudFZhcmlhYmxlczogc3RyaW5nW107XG4gIGRhdGE6IFJlY29yZDxzdHJpbmcsIG51bWJlcltdPjtcbiAgYW5hbHlzaXNNZXRob2Q6ICdncmFuZ2VyJyB8ICdyZWdyZXNzaW9uJyB8ICdpbnN0cnVtZW50YWwtdmFyaWFibGVzJyB8ICdkaWZmZXJlbmNlLWluLWRpZmZlcmVuY2VzJztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDYXVzYXRpb25BbmFseXNpc1Jlc3VsdCB7XG4gIGNhdXNhbFJlbGF0aW9uc2hpcHM6IENhdXNhbFJlbGF0aW9uc2hpcFtdO1xuICBzdGF0aXN0aWNhbFNpZ25pZmljYW5jZTogUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgbWV0aG9kb2xvZ3k6IHN0cmluZztcbiAgbGltaXRhdGlvbnM6IHN0cmluZ1tdO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2F1c2FsUmVsYXRpb25zaGlwIHtcbiAgY2F1c2U6IHN0cmluZztcbiAgZWZmZWN0OiBzdHJpbmc7XG4gIHN0cmVuZ3RoOiBudW1iZXI7XG4gIGRpcmVjdGlvbjogJ3Bvc2l0aXZlJyB8ICduZWdhdGl2ZSc7XG4gIGxhZ1BlcmlvZD86IG51bWJlcjtcbiAgY29uZmlkZW5jZTogbnVtYmVyO1xuICBpbnRlcnByZXRhdGlvbjogc3RyaW5nO1xufVxuXG4vKipcbiAqIEFuYWx5c2lzIEFnZW50IGNsYXNzIHRoYXQgaGFuZGxlcyBhbGwgZmluYW5jaWFsIGFuYWx5c2lzIHRhc2tzXG4gKi9cbmV4cG9ydCBjbGFzcyBBbmFseXNpc0FnZW50IHtcbiAgcHJpdmF0ZSBub3ZhUHJvU2VydmljZTogQW1hem9uTm92YVByb1NlcnZpY2U7XG4gIHByaXZhdGUgbWFya2V0RGF0YVNlcnZpY2U6IE1hcmtldERhdGFTZXJ2aWNlO1xuICBwcml2YXRlIGFnZW50VHlwZTogQWdlbnRUeXBlID0gJ2FuYWx5c2lzJztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBub3ZhUHJvU2VydmljZTogQW1hem9uTm92YVByb1NlcnZpY2UsXG4gICAgbWFya2V0RGF0YVNlcnZpY2U6IE1hcmtldERhdGFTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMubm92YVByb1NlcnZpY2UgPSBub3ZhUHJvU2VydmljZTtcbiAgICB0aGlzLm1hcmtldERhdGFTZXJ2aWNlID0gbWFya2V0RGF0YVNlcnZpY2U7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBhbiBhbmFseXNpcyByZXF1ZXN0IGFuZCByZXR1cm4gY29tcHJlaGVuc2l2ZSBhbmFseXNpcyByZXN1bHRzXG4gICAqL1xuICBhc3luYyBwcm9jZXNzQW5hbHlzaXNSZXF1ZXN0KHJlcXVlc3Q6IEFuYWx5c2lzUmVxdWVzdCk6IFByb21pc2U8QW5hbHlzaXNSZXNwb25zZT4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXNwb25zZTogQW5hbHlzaXNSZXNwb25zZTtcblxuICAgICAgc3dpdGNoIChyZXF1ZXN0LmFuYWx5c2lzVHlwZSkge1xuICAgICAgICBjYXNlICdmdW5kYW1lbnRhbCc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1GdW5kYW1lbnRhbEFuYWx5c2lzKHJlcXVlc3QsIHN0YXJ0VGltZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RlY2huaWNhbCc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1UZWNobmljYWxBbmFseXNpcyhyZXF1ZXN0LCBzdGFydFRpbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzZW50aW1lbnQnOlxuICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wZXJmb3JtU2VudGltZW50QW5hbHlzaXMocmVxdWVzdCwgc3RhcnRUaW1lKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlzayc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1SaXNrQW5hbHlzaXMocmVxdWVzdCwgc3RhcnRUaW1lKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29ycmVsYXRpb24nOlxuICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wZXJmb3JtQ29ycmVsYXRpb25BbmFseXNpcyhyZXF1ZXN0LCBzdGFydFRpbWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzY2VuYXJpbyc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1TY2VuYXJpb0FuYWx5c2lzKHJlcXVlc3QsIHN0YXJ0VGltZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbXByZWhlbnNpdmUnOlxuICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wZXJmb3JtQ29tcHJlaGVuc2l2ZUFuYWx5c2lzKHJlcXVlc3QsIHN0YXJ0VGltZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBhbmFseXNpcyB0eXBlOiAke3JlcXVlc3QuYW5hbHlzaXNUeXBlfWApO1xuICAgICAgfVxuXG4gICAgICAvLyBEb24ndCBvdmVycmlkZSBleGVjdXRpb24gdGltZSBpZiBpdCdzIGFscmVhZHkgc2V0IGJ5IHRoZSBpbmRpdmlkdWFsIGFuYWx5c2lzIG1ldGhvZFxuICAgICAgaWYgKHJlc3BvbnNlLmV4ZWN1dGlvblRpbWUgPT09IDApIHtcbiAgICAgICAgcmVzcG9uc2UuZXhlY3V0aW9uVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyBhbmFseXNpcyByZXF1ZXN0OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGZ1bmRhbWVudGFsIGFuYWx5c2lzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1GdW5kYW1lbnRhbEFuYWx5c2lzKHJlcXVlc3Q6IEFuYWx5c2lzUmVxdWVzdCwgc3RhcnRUaW1lOiBudW1iZXIgPSBEYXRlLm5vdygpKTogUHJvbWlzZTxBbmFseXNpc1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVzdWx0czogQW5hbHlzaXNSZXN1bHRbXSA9IFtdO1xuICAgIFxuICAgIGZvciAoY29uc3QgaW52ZXN0bWVudCBvZiByZXF1ZXN0LmludmVzdG1lbnRzKSB7XG4gICAgICBjb25zdCBhbmFseXNpc1Jlc3VsdCA9IGF3YWl0IHRoaXMuYW5hbHl6ZUZ1bmRhbWVudGFscyhpbnZlc3RtZW50LCByZXF1ZXN0LnBhcmFtZXRlcnMpO1xuICAgICAgcmVzdWx0cy5wdXNoKGFuYWx5c2lzUmVzdWx0KTtcbiAgICB9XG5cbiAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHRoaXMuYXNzZXNzUG9ydGZvbGlvUmlzayhyZXF1ZXN0LmludmVzdG1lbnRzLCByZXF1ZXN0LnBhcmFtZXRlcnMpO1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVGdW5kYW1lbnRhbFJlY29tbWVuZGF0aW9ucyhyZXN1bHRzLCByZXF1ZXN0LnBhcmFtZXRlcnMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdHMsXG4gICAgICByaXNrQXNzZXNzbWVudCxcbiAgICAgIHJlY29tbWVuZGF0aW9ucyxcbiAgICAgIGNvbmZpZGVuY2U6IHRoaXMuY2FsY3VsYXRlQW5hbHlzaXNDb25maWRlbmNlKHJlc3VsdHMpLFxuICAgICAgZXhlY3V0aW9uVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQW5hbHl6ZSBmdW5kYW1lbnRhbHMgZm9yIGEgc2luZ2xlIGludmVzdG1lbnRcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgYW5hbHl6ZUZ1bmRhbWVudGFscyhpbnZlc3RtZW50OiBJbnZlc3RtZW50LCBwYXJhbWV0ZXJzOiBhbnkpOiBQcm9taXNlPEFuYWx5c2lzUmVzdWx0PiB7XG4gICAgY29uc3QgcHJvbXB0ID0gYFxuICAgICAgUGVyZm9ybSBjb21wcmVoZW5zaXZlIGZ1bmRhbWVudGFsIGFuYWx5c2lzIGZvciAke2ludmVzdG1lbnQubmFtZX0gKCR7aW52ZXN0bWVudC50aWNrZXIgfHwgJ04vQSd9KS5cbiAgICAgIFxuICAgICAgSW52ZXN0bWVudCBEZXRhaWxzOlxuICAgICAgLSBUeXBlOiAke2ludmVzdG1lbnQudHlwZX1cbiAgICAgIC0gU2VjdG9yOiAke2ludmVzdG1lbnQuc2VjdG9yIHx8ICdOL0EnfVxuICAgICAgLSBJbmR1c3RyeTogJHtpbnZlc3RtZW50LmluZHVzdHJ5IHx8ICdOL0EnfVxuICAgICAgLSBNYXJrZXQgQ2FwOiAke2ludmVzdG1lbnQubWFya2V0Q2FwID8gYCQke2ludmVzdG1lbnQubWFya2V0Q2FwLnRvTG9jYWxlU3RyaW5nKCl9YCA6ICdOL0EnfVxuICAgICAgLSBDdXJyZW50IFByaWNlOiAke2ludmVzdG1lbnQuY3VycmVudFByaWNlID8gYCQke2ludmVzdG1lbnQuY3VycmVudFByaWNlfWAgOiAnTi9BJ31cbiAgICAgIFxuICAgICAgRnVuZGFtZW50YWwgRGF0YTpcbiAgICAgICR7aW52ZXN0bWVudC5mdW5kYW1lbnRhbHMgPyBKU09OLnN0cmluZ2lmeShpbnZlc3RtZW50LmZ1bmRhbWVudGFscywgbnVsbCwgMikgOiAnTm8gZnVuZGFtZW50YWwgZGF0YSBhdmFpbGFibGUnfVxuICAgICAgXG4gICAgICBQbGVhc2UgcHJvdmlkZTpcbiAgICAgIDEuIEZpbmFuY2lhbCByYXRpbyBhbmFseXNpcyBhbmQgaW50ZXJwcmV0YXRpb25cbiAgICAgIDIuIFZhbHVhdGlvbiBhc3Nlc3NtZW50IChvdmVydmFsdWVkL3VuZGVydmFsdWVkL2ZhaXJseSB2YWx1ZWQpXG4gICAgICAzLiBHcm93dGggcHJvc3BlY3RzIGFuZCBzdXN0YWluYWJpbGl0eVxuICAgICAgNC4gQ29tcGV0aXRpdmUgcG9zaXRpb24gYW5kIG1vYXQgYW5hbHlzaXNcbiAgICAgIDUuIEtleSBzdHJlbmd0aHMgYW5kIHdlYWtuZXNzZXNcbiAgICAgIDYuIEludmVzdG1lbnQgcmVjb21tZW5kYXRpb24gd2l0aCB0YXJnZXQgcHJpY2VcbiAgICBgO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm5vdmFQcm9TZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgIHByb21wdCxcbiAgICAgIHRlbXBsYXRlOiBOb3ZhUHJvUHJvbXB0VGVtcGxhdGUuRklOQU5DSUFMX0FOQUxZU0lTLFxuICAgICAgdGVtcGxhdGVWYXJpYWJsZXM6IHtcbiAgICAgICAgaW52ZXN0bWVudERldGFpbHM6IGAke2ludmVzdG1lbnQubmFtZX0gLSAke2ludmVzdG1lbnQudHlwZX1gLFxuICAgICAgICBmaW5hbmNpYWxEYXRhOiBKU09OLnN0cmluZ2lmeShpbnZlc3RtZW50LmZ1bmRhbWVudGFscyB8fCB7fSksXG4gICAgICAgIGFuYWx5c2lzUmVxdWlyZW1lbnRzOiAnQ29tcHJlaGVuc2l2ZSBmdW5kYW1lbnRhbCBhbmFseXNpcycsXG4gICAgICAgIGtleU1ldHJpY3M6ICdQL0UsIFAvQiwgUk9FLCBST0EsIERlYnQvRXF1aXR5LCBSZXZlbnVlIEdyb3d0aCcsXG4gICAgICAgIHRpbWVQZXJpb2Q6IHBhcmFtZXRlcnMudGltZUhvcml6b24gfHwgJ21lZGl1bS10ZXJtJ1xuICAgICAgfSxcbiAgICAgIGFuYWx5c2lzVHlwZTogJ3F1YWxpdGF0aXZlJyxcbiAgICAgIG1heFRva2VuczogMjAwMFxuICAgIH0pO1xuXG4gICAgY29uc3QgYW5hbHlzaXNEZXRhaWxzID0gYXdhaXQgdGhpcy5wYXJzZUZ1bmRhbWVudGFsQW5hbHlzaXMocmVzcG9uc2UuY29tcGxldGlvbik7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgIGludmVzdG1lbnRJZDogaW52ZXN0bWVudC5pZCxcbiAgICAgIGFuYWx5c2lzVHlwZTogJ2Z1bmRhbWVudGFsJyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIGFuYWx5c3Q6ICdhbmFseXNpcy1hZ2VudC1ub3ZhLXBybycsXG4gICAgICBzdW1tYXJ5OiBhbmFseXNpc0RldGFpbHMuc3VtbWFyeSxcbiAgICAgIGNvbmZpZGVuY2U6IGFuYWx5c2lzRGV0YWlscy5jb25maWRlbmNlLFxuICAgICAgZGV0YWlsczogYW5hbHlzaXNEZXRhaWxzLmRldGFpbHMsXG4gICAgICByZWNvbW1lbmRhdGlvbnM6IGFuYWx5c2lzRGV0YWlscy5yZWNvbW1lbmRhdGlvbnMsXG4gICAgICBkYXRhUG9pbnRzOiB0aGlzLmV4dHJhY3REYXRhUG9pbnRzKGludmVzdG1lbnQsICdmdW5kYW1lbnRhbCcpXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGNvcnJlbGF0aW9uIGFuYWx5c2lzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1Db3JyZWxhdGlvbkFuYWx5c2lzKHJlcXVlc3Q6IEFuYWx5c2lzUmVxdWVzdCwgc3RhcnRUaW1lOiBudW1iZXIgPSBEYXRlLm5vdygpKTogUHJvbWlzZTxBbmFseXNpc1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgY29ycmVsYXRpb25NYXRyaXggPSBhd2FpdCB0aGlzLmNhbGN1bGF0ZUNvcnJlbGF0aW9uTWF0cml4KHJlcXVlc3QuaW52ZXN0bWVudHMpO1xuICAgIGNvbnN0IGNhdXNhdGlvbkFuYWx5c2lzID0gYXdhaXQgdGhpcy5wZXJmb3JtQ2F1c2F0aW9uQW5hbHlzaXMocmVxdWVzdC5pbnZlc3RtZW50cyk7XG4gICAgY29uc3Qgcmlza0Fzc2Vzc21lbnQgPSBhd2FpdCB0aGlzLmFzc2Vzc0NvcnJlbGF0aW9uUmlzayhjb3JyZWxhdGlvbk1hdHJpeCwgcmVxdWVzdC5wYXJhbWV0ZXJzKTtcbiAgICBcbiAgICBjb25zdCByZXN1bHRzOiBBbmFseXNpc1Jlc3VsdFtdID0gW3tcbiAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgIGludmVzdG1lbnRJZDogJ3BvcnRmb2xpbycsXG4gICAgICBhbmFseXNpc1R5cGU6ICdjb21wcmVoZW5zaXZlJyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIGFuYWx5c3Q6ICdhbmFseXNpcy1hZ2VudC1ub3ZhLXBybycsXG4gICAgICBzdW1tYXJ5OiBhd2FpdCB0aGlzLmdlbmVyYXRlQ29ycmVsYXRpb25TdW1tYXJ5KGNvcnJlbGF0aW9uTWF0cml4LCBjYXVzYXRpb25BbmFseXNpcyksXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICBzdHJlbmd0aHM6IFtgSWRlbnRpZmllZCAke2NvcnJlbGF0aW9uTWF0cml4LnNpZ25pZmljYW50Q29ycmVsYXRpb25zLmxlbmd0aH0gc2lnbmlmaWNhbnQgY29ycmVsYXRpb25zYF0sXG4gICAgICAgIHdlYWtuZXNzZXM6IFsnQ29ycmVsYXRpb24gZG9lcyBub3QgaW1wbHkgY2F1c2F0aW9uJ10sXG4gICAgICAgIG9wcG9ydHVuaXRpZXM6IFsnRGl2ZXJzaWZpY2F0aW9uIG9wcG9ydHVuaXRpZXMgaWRlbnRpZmllZCddLFxuICAgICAgICB0aHJlYXRzOiBbJ0hpZ2ggY29ycmVsYXRpb24gZHVyaW5nIG1hcmtldCBzdHJlc3MnXSxcbiAgICAgICAga2V5TWV0cmljczoge1xuICAgICAgICAgICdBdmVyYWdlIENvcnJlbGF0aW9uJzogdGhpcy5jYWxjdWxhdGVBdmVyYWdlQ29ycmVsYXRpb24oY29ycmVsYXRpb25NYXRyaXgpLFxuICAgICAgICAgICdNYXggQ29ycmVsYXRpb24nOiB0aGlzLmZpbmRNYXhDb3JyZWxhdGlvbihjb3JyZWxhdGlvbk1hdHJpeCksXG4gICAgICAgICAgJ0RpdmVyc2lmaWNhdGlvbiBTY29yZSc6IHJpc2tBc3Nlc3NtZW50LmRpdmVyc2lmaWNhdGlvblNjb3JlXG4gICAgICAgIH0sXG4gICAgICAgIG5hcnJhdGl2ZXM6IFthd2FpdCB0aGlzLmdlbmVyYXRlQ29ycmVsYXRpb25OYXJyYXRpdmUoY29ycmVsYXRpb25NYXRyaXgpXVxuICAgICAgfSxcbiAgICAgIHJlY29tbWVuZGF0aW9uczogYXdhaXQgdGhpcy5nZW5lcmF0ZUNvcnJlbGF0aW9uUmVjb21tZW5kYXRpb25zKGNvcnJlbGF0aW9uTWF0cml4LCByaXNrQXNzZXNzbWVudCksXG4gICAgICBkYXRhUG9pbnRzOiBbXVxuICAgIH1dO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdHMsXG4gICAgICBjb3JyZWxhdGlvbk1hdHJpeCxcbiAgICAgIHJpc2tBc3Nlc3NtZW50LFxuICAgICAgcmVjb21tZW5kYXRpb25zOiByZXN1bHRzWzBdLnJlY29tbWVuZGF0aW9ucyxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODUsXG4gICAgICBleGVjdXRpb25UaW1lOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgY29ycmVsYXRpb24gbWF0cml4IGZvciBpbnZlc3RtZW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjYWxjdWxhdGVDb3JyZWxhdGlvbk1hdHJpeChpbnZlc3RtZW50czogSW52ZXN0bWVudFtdKTogUHJvbWlzZTxDb3JyZWxhdGlvbk1hdHJpeD4ge1xuICAgIGNvbnN0IHJldHVybnMgPSB0aGlzLmNhbGN1bGF0ZVJldHVybnMoaW52ZXN0bWVudHMpO1xuICAgIGNvbnN0IG1hdHJpeDogUmVjb3JkPHN0cmluZywgUmVjb3JkPHN0cmluZywgbnVtYmVyPj4gPSB7fTtcbiAgICBjb25zdCBzaWduaWZpY2FudENvcnJlbGF0aW9uczogQ29ycmVsYXRpb25QYWlyW10gPSBbXTtcblxuICAgIC8vIENhbGN1bGF0ZSBwYWlyd2lzZSBjb3JyZWxhdGlvbnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGludmVzdG1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhc3NldDEgPSBpbnZlc3RtZW50c1tpXTtcbiAgICAgIG1hdHJpeFthc3NldDEuaWRdID0ge307XG4gICAgICBcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgaW52ZXN0bWVudHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgYXNzZXQyID0gaW52ZXN0bWVudHNbal07XG4gICAgICAgIGNvbnN0IGNvcnJlbGF0aW9uID0gdGhpcy5jYWxjdWxhdGVQZWFyc29uQ29ycmVsYXRpb24oXG4gICAgICAgICAgcmV0dXJuc1thc3NldDEuaWRdIHx8IFtdLFxuICAgICAgICAgIHJldHVybnNbYXNzZXQyLmlkXSB8fCBbXVxuICAgICAgICApO1xuICAgICAgICBcbiAgICAgICAgbWF0cml4W2Fzc2V0MS5pZF1bYXNzZXQyLmlkXSA9IGNvcnJlbGF0aW9uO1xuICAgICAgICBcbiAgICAgICAgLy8gVHJhY2sgc2lnbmlmaWNhbnQgY29ycmVsYXRpb25zIChleGNsdWRpbmcgc2VsZi1jb3JyZWxhdGlvbilcbiAgICAgICAgaWYgKGkgIT09IGogJiYgTWF0aC5hYnMoY29ycmVsYXRpb24pID4gMC41KSB7XG4gICAgICAgICAgc2lnbmlmaWNhbnRDb3JyZWxhdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBhc3NldDE6IGFzc2V0MS5uYW1lLFxuICAgICAgICAgICAgYXNzZXQyOiBhc3NldDIubmFtZSxcbiAgICAgICAgICAgIGNvcnJlbGF0aW9uLFxuICAgICAgICAgICAgc2lnbmlmaWNhbmNlOiBNYXRoLmFicyhjb3JyZWxhdGlvbiksXG4gICAgICAgICAgICBpbnRlcnByZXRhdGlvbjogdGhpcy5pbnRlcnByZXRDb3JyZWxhdGlvbihjb3JyZWxhdGlvbilcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtYXRyaXgsXG4gICAgICBzaWduaWZpY2FudENvcnJlbGF0aW9uczogc2lnbmlmaWNhbnRDb3JyZWxhdGlvbnMuc29ydCgoYSwgYikgPT4gYi5zaWduaWZpY2FuY2UgLSBhLnNpZ25pZmljYW5jZSlcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gc2NlbmFyaW8gYW5hbHlzaXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybVNjZW5hcmlvQW5hbHlzaXMocmVxdWVzdDogQW5hbHlzaXNSZXF1ZXN0LCBzdGFydFRpbWU6IG51bWJlciA9IERhdGUubm93KCkpOiBQcm9taXNlPEFuYWx5c2lzUmVzcG9uc2U+IHtcbiAgICBjb25zdCBzY2VuYXJpb3MgPSByZXF1ZXN0LnBhcmFtZXRlcnMuc2NlbmFyaW9zIHx8IHRoaXMuZ2V0RGVmYXVsdFNjZW5hcmlvcygpO1xuICAgIGNvbnN0IHNjZW5hcmlvUmVzdWx0czogU2NlbmFyaW9PdXRjb21lW10gPSBbXTtcblxuICAgIGZvciAoY29uc3Qgc2NlbmFyaW8gb2Ygc2NlbmFyaW9zKSB7XG4gICAgICBjb25zdCBvdXRjb21lID0gYXdhaXQgdGhpcy5ldmFsdWF0ZVNjZW5hcmlvKHJlcXVlc3QuaW52ZXN0bWVudHMsIHNjZW5hcmlvKTtcbiAgICAgIHNjZW5hcmlvUmVzdWx0cy5wdXNoKG91dGNvbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHNjZW5hcmlvQW5hbHlzaXM6IFNjZW5hcmlvQW5hbHlzaXNSZXN1bHQgPSB7XG4gICAgICBzY2VuYXJpb3M6IHNjZW5hcmlvUmVzdWx0cyxcbiAgICAgIGV4cGVjdGVkVmFsdWU6IHRoaXMuY2FsY3VsYXRlRXhwZWN0ZWRWYWx1ZShzY2VuYXJpb1Jlc3VsdHMpLFxuICAgICAgd29yc3RDYXNlOiBzY2VuYXJpb1Jlc3VsdHMucmVkdWNlKCh3b3JzdCwgY3VycmVudCkgPT4gXG4gICAgICAgIGN1cnJlbnQucG9ydGZvbGlvUmV0dXJuIDwgd29yc3QucG9ydGZvbGlvUmV0dXJuID8gY3VycmVudCA6IHdvcnN0XG4gICAgICApLFxuICAgICAgYmVzdENhc2U6IHNjZW5hcmlvUmVzdWx0cy5yZWR1Y2UoKGJlc3QsIGN1cnJlbnQpID0+IFxuICAgICAgICBjdXJyZW50LnBvcnRmb2xpb1JldHVybiA+IGJlc3QucG9ydGZvbGlvUmV0dXJuID8gY3VycmVudCA6IGJlc3RcbiAgICAgICksXG4gICAgICBwcm9iYWJpbGl0eVdlaWdodGVkUmV0dXJuOiB0aGlzLmNhbGN1bGF0ZVByb2JhYmlsaXR5V2VpZ2h0ZWRSZXR1cm4oc2NlbmFyaW9SZXN1bHRzKVxuICAgIH07XG5cbiAgICBjb25zdCByaXNrQXNzZXNzbWVudCA9IGF3YWl0IHRoaXMuYXNzZXNzU2NlbmFyaW9SaXNrKHNjZW5hcmlvQW5hbHlzaXMsIHJlcXVlc3QucGFyYW1ldGVycyk7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gYXdhaXQgdGhpcy5nZW5lcmF0ZVNjZW5hcmlvUmVjb21tZW5kYXRpb25zKHNjZW5hcmlvQW5hbHlzaXMpO1xuXG4gICAgY29uc3QgcmVzdWx0czogQW5hbHlzaXNSZXN1bHRbXSA9IFt7XG4gICAgICBpZDogdXVpZHY0KCksXG4gICAgICBpbnZlc3RtZW50SWQ6ICdwb3J0Zm9saW8nLFxuICAgICAgYW5hbHlzaXNUeXBlOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICBhbmFseXN0OiAnYW5hbHlzaXMtYWdlbnQtbm92YS1wcm8nLFxuICAgICAgc3VtbWFyeTogYXdhaXQgdGhpcy5nZW5lcmF0ZVNjZW5hcmlvU3VtbWFyeShzY2VuYXJpb0FuYWx5c2lzKSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuODAsXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIHN0cmVuZ3RoczogWydDb21wcmVoZW5zaXZlIHNjZW5hcmlvIGNvdmVyYWdlJ10sXG4gICAgICAgIHdlYWtuZXNzZXM6IFsnU2NlbmFyaW8gcHJvYmFiaWxpdGllcyBhcmUgZXN0aW1hdGVzJ10sXG4gICAgICAgIG9wcG9ydHVuaXRpZXM6IFtgQmVzdCBjYXNlIHJldHVybjogJHsoc2NlbmFyaW9BbmFseXNpcy5iZXN0Q2FzZS5wb3J0Zm9saW9SZXR1cm4gKiAxMDApLnRvRml4ZWQoMSl9JWBdLFxuICAgICAgICB0aHJlYXRzOiBbYFdvcnN0IGNhc2UgbG9zczogJHsoc2NlbmFyaW9BbmFseXNpcy53b3JzdENhc2UucG9ydGZvbGlvUmV0dXJuICogMTAwKS50b0ZpeGVkKDEpfSVgXSxcbiAgICAgICAga2V5TWV0cmljczoge1xuICAgICAgICAgICdFeHBlY3RlZCBSZXR1cm4nOiBzY2VuYXJpb0FuYWx5c2lzLmV4cGVjdGVkVmFsdWUsXG4gICAgICAgICAgJ1Byb2JhYmlsaXR5IFdlaWdodGVkIFJldHVybic6IHNjZW5hcmlvQW5hbHlzaXMucHJvYmFiaWxpdHlXZWlnaHRlZFJldHVybixcbiAgICAgICAgICAnQmVzdCBDYXNlJzogc2NlbmFyaW9BbmFseXNpcy5iZXN0Q2FzZS5wb3J0Zm9saW9SZXR1cm4sXG4gICAgICAgICAgJ1dvcnN0IENhc2UnOiBzY2VuYXJpb0FuYWx5c2lzLndvcnN0Q2FzZS5wb3J0Zm9saW9SZXR1cm5cbiAgICAgICAgfSxcbiAgICAgICAgbmFycmF0aXZlczogW2F3YWl0IHRoaXMuZ2VuZXJhdGVTY2VuYXJpb05hcnJhdGl2ZShzY2VuYXJpb0FuYWx5c2lzKV1cbiAgICAgIH0sXG4gICAgICByZWNvbW1lbmRhdGlvbnMsXG4gICAgICBkYXRhUG9pbnRzOiBbXVxuICAgIH1dO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdHMsXG4gICAgICBzY2VuYXJpb0FuYWx5c2lzLFxuICAgICAgcmlza0Fzc2Vzc21lbnQsXG4gICAgICByZWNvbW1lbmRhdGlvbnMsXG4gICAgICBjb25maWRlbmNlOiAwLjgwLFxuICAgICAgZXhlY3V0aW9uVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSBjb21wcmVoZW5zaXZlIGFuYWx5c2lzIGNvbWJpbmluZyBtdWx0aXBsZSBhbmFseXNpcyB0eXBlc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtQ29tcHJlaGVuc2l2ZUFuYWx5c2lzKHJlcXVlc3Q6IEFuYWx5c2lzUmVxdWVzdCwgc3RhcnRUaW1lOiBudW1iZXIgPSBEYXRlLm5vdygpKTogUHJvbWlzZTxBbmFseXNpc1Jlc3BvbnNlPiB7XG4gICAgLy8gUGVyZm9ybSBhbGwgYW5hbHlzaXMgdHlwZXMgaW4gcGFyYWxsZWxcbiAgICBjb25zdCBbZnVuZGFtZW50YWxSZXNwb25zZSwgY29ycmVsYXRpb25SZXNwb25zZSwgc2NlbmFyaW9SZXNwb25zZV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLnBlcmZvcm1GdW5kYW1lbnRhbEFuYWx5c2lzKHsgLi4ucmVxdWVzdCwgYW5hbHlzaXNUeXBlOiAnZnVuZGFtZW50YWwnIH0sIHN0YXJ0VGltZSksXG4gICAgICB0aGlzLnBlcmZvcm1Db3JyZWxhdGlvbkFuYWx5c2lzKHsgLi4ucmVxdWVzdCwgYW5hbHlzaXNUeXBlOiAnY29ycmVsYXRpb24nIH0sIHN0YXJ0VGltZSksXG4gICAgICB0aGlzLnBlcmZvcm1TY2VuYXJpb0FuYWx5c2lzKHsgLi4ucmVxdWVzdCwgYW5hbHlzaXNUeXBlOiAnc2NlbmFyaW8nIH0sIHN0YXJ0VGltZSlcbiAgICBdKTtcblxuICAgIC8vIENvbWJpbmUgcmVzdWx0c1xuICAgIGNvbnN0IGNvbWJpbmVkUmVzdWx0cyA9IFtcbiAgICAgIC4uLmZ1bmRhbWVudGFsUmVzcG9uc2UucmVzdWx0cyxcbiAgICAgIC4uLmNvcnJlbGF0aW9uUmVzcG9uc2UucmVzdWx0cyxcbiAgICAgIC4uLnNjZW5hcmlvUmVzcG9uc2UucmVzdWx0c1xuICAgIF07XG5cbiAgICBjb25zdCBjb21wcmVoZW5zaXZlUmlza0Fzc2Vzc21lbnQgPSBhd2FpdCB0aGlzLmNvbWJpbmVSaXNrQXNzZXNzbWVudHMoW1xuICAgICAgZnVuZGFtZW50YWxSZXNwb25zZS5yaXNrQXNzZXNzbWVudCxcbiAgICAgIGNvcnJlbGF0aW9uUmVzcG9uc2Uucmlza0Fzc2Vzc21lbnQsXG4gICAgICBzY2VuYXJpb1Jlc3BvbnNlLnJpc2tBc3Nlc3NtZW50XG4gICAgXSk7XG5cbiAgICBjb25zdCBjb21wcmVoZW5zaXZlUmVjb21tZW5kYXRpb25zID0gYXdhaXQgdGhpcy5zeW50aGVzaXplUmVjb21tZW5kYXRpb25zKFtcbiAgICAgIC4uLmZ1bmRhbWVudGFsUmVzcG9uc2UucmVjb21tZW5kYXRpb25zLFxuICAgICAgLi4uY29ycmVsYXRpb25SZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMsXG4gICAgICAuLi5zY2VuYXJpb1Jlc3BvbnNlLnJlY29tbWVuZGF0aW9uc1xuICAgIF0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3VsdHM6IGNvbWJpbmVkUmVzdWx0cyxcbiAgICAgIGNvcnJlbGF0aW9uTWF0cml4OiBjb3JyZWxhdGlvblJlc3BvbnNlLmNvcnJlbGF0aW9uTWF0cml4LFxuICAgICAgc2NlbmFyaW9BbmFseXNpczogc2NlbmFyaW9SZXNwb25zZS5zY2VuYXJpb0FuYWx5c2lzLFxuICAgICAgcmlza0Fzc2Vzc21lbnQ6IGNvbXByZWhlbnNpdmVSaXNrQXNzZXNzbWVudCxcbiAgICAgIHJlY29tbWVuZGF0aW9uczogY29tcHJlaGVuc2l2ZVJlY29tbWVuZGF0aW9ucyxcbiAgICAgIGNvbmZpZGVuY2U6IHRoaXMuY2FsY3VsYXRlQ29tcHJlaGVuc2l2ZUNvbmZpZGVuY2UoW1xuICAgICAgICBmdW5kYW1lbnRhbFJlc3BvbnNlLmNvbmZpZGVuY2UsXG4gICAgICAgIGNvcnJlbGF0aW9uUmVzcG9uc2UuY29uZmlkZW5jZSxcbiAgICAgICAgc2NlbmFyaW9SZXNwb25zZS5jb25maWRlbmNlXG4gICAgICBdKSxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IERhdGUubm93KCkgLSBzdGFydFRpbWVcbiAgICB9O1xuICB9XG5cbiAgLy8gSGVscGVyIG1ldGhvZHMgZm9yIGNhbGN1bGF0aW9ucyBhbmQgYW5hbHlzaXNcblxuICBwcml2YXRlIGNhbGN1bGF0ZVJldHVybnMoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSk6IFJlY29yZDxzdHJpbmcsIG51bWJlcltdPiB7XG4gICAgY29uc3QgcmV0dXJuczogUmVjb3JkPHN0cmluZywgbnVtYmVyW10+ID0ge307XG4gICAgXG4gICAgaW52ZXN0bWVudHMuZm9yRWFjaChpbnZlc3RtZW50ID0+IHtcbiAgICAgIGlmIChpbnZlc3RtZW50Lmhpc3RvcmljYWxQZXJmb3JtYW5jZSAmJiBpbnZlc3RtZW50Lmhpc3RvcmljYWxQZXJmb3JtYW5jZS5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnN0IHByaWNlcyA9IGludmVzdG1lbnQuaGlzdG9yaWNhbFBlcmZvcm1hbmNlLm1hcChwID0+IHAuY2xvc2UpO1xuICAgICAgICBjb25zdCBhc3NldFJldHVybnM6IG51bWJlcltdID0gW107XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHByaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHJldHVyblZhbHVlID0gKHByaWNlc1tpXSAtIHByaWNlc1tpLTFdKSAvIHByaWNlc1tpLTFdO1xuICAgICAgICAgIGFzc2V0UmV0dXJucy5wdXNoKHJldHVyblZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuc1tpbnZlc3RtZW50LmlkXSA9IGFzc2V0UmV0dXJucztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybnNbaW52ZXN0bWVudC5pZF0gPSBbXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gcmV0dXJucztcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlUGVhcnNvbkNvcnJlbGF0aW9uKHg6IG51bWJlcltdLCB5OiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgaWYgKHgubGVuZ3RoICE9PSB5Lmxlbmd0aCB8fCB4Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG4gICAgXG4gICAgY29uc3QgbiA9IHgubGVuZ3RoO1xuICAgIGNvbnN0IHN1bVggPSB4LnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAgIGNvbnN0IHN1bVkgPSB5LnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAgIGNvbnN0IHN1bVhZID0geC5yZWR1Y2UoKHN1bSwgeGksIGkpID0+IHN1bSArIHhpICogeVtpXSwgMCk7XG4gICAgY29uc3Qgc3VtWDIgPSB4LnJlZHVjZSgoc3VtLCB4aSkgPT4gc3VtICsgeGkgKiB4aSwgMCk7XG4gICAgY29uc3Qgc3VtWTIgPSB5LnJlZHVjZSgoc3VtLCB5aSkgPT4gc3VtICsgeWkgKiB5aSwgMCk7XG4gICAgXG4gICAgY29uc3QgbnVtZXJhdG9yID0gbiAqIHN1bVhZIC0gc3VtWCAqIHN1bVk7XG4gICAgY29uc3QgZGVub21pbmF0b3IgPSBNYXRoLnNxcnQoKG4gKiBzdW1YMiAtIHN1bVggKiBzdW1YKSAqIChuICogc3VtWTIgLSBzdW1ZICogc3VtWSkpO1xuICAgIFxuICAgIHJldHVybiBkZW5vbWluYXRvciA9PT0gMCA/IDAgOiBudW1lcmF0b3IgLyBkZW5vbWluYXRvcjtcbiAgfVxuXG4gIHByaXZhdGUgaW50ZXJwcmV0Q29ycmVsYXRpb24oY29ycmVsYXRpb246IG51bWJlcik6IHN0cmluZyB7XG4gICAgY29uc3QgYWJzID0gTWF0aC5hYnMoY29ycmVsYXRpb24pO1xuICAgIGlmIChhYnMgPj0gMC44KSByZXR1cm4gJ1Zlcnkgc3Ryb25nIGNvcnJlbGF0aW9uJztcbiAgICBpZiAoYWJzID49IDAuNikgcmV0dXJuICdTdHJvbmcgY29ycmVsYXRpb24nO1xuICAgIGlmIChhYnMgPj0gMC40KSByZXR1cm4gJ01vZGVyYXRlIGNvcnJlbGF0aW9uJztcbiAgICBpZiAoYWJzID49IDAuMikgcmV0dXJuICdXZWFrIGNvcnJlbGF0aW9uJztcbiAgICByZXR1cm4gJ1Zlcnkgd2VhayBjb3JyZWxhdGlvbic7XG4gIH1cblxuICBwcml2YXRlIGdldERlZmF1bHRTY2VuYXJpb3MoKTogU2NlbmFyaW9EZWZpbml0aW9uW10ge1xuICAgIHJldHVybiBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdCdWxsIE1hcmtldCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU3Ryb25nIGVjb25vbWljIGdyb3d0aCB3aXRoIGxvdyB2b2xhdGlsaXR5JyxcbiAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgIGVjb25vbWljR3Jvd3RoOiAwLjA0LFxuICAgICAgICAgIGluZmxhdGlvbjogMC4wMixcbiAgICAgICAgICBpbnRlcmVzdFJhdGVzOiAwLjAzLFxuICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMTVcbiAgICAgICAgfSxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMjVcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdCYXNlIENhc2UnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ01vZGVyYXRlIGVjb25vbWljIGdyb3d0aCB3aXRoIG5vcm1hbCB2b2xhdGlsaXR5JyxcbiAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgIGVjb25vbWljR3Jvd3RoOiAwLjAyNSxcbiAgICAgICAgICBpbmZsYXRpb246IDAuMDI1LFxuICAgICAgICAgIGludGVyZXN0UmF0ZXM6IDAuMDQsXG4gICAgICAgICAgdm9sYXRpbGl0eTogMC4yMFxuICAgICAgICB9LFxuICAgICAgICBwcm9iYWJpbGl0eTogMC40MFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0JlYXIgTWFya2V0JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFY29ub21pYyByZWNlc3Npb24gd2l0aCBoaWdoIHZvbGF0aWxpdHknLFxuICAgICAgICBtYXJrZXRDb25kaXRpb25zOiB7XG4gICAgICAgICAgZWNvbm9taWNHcm93dGg6IC0wLjAyLFxuICAgICAgICAgIGluZmxhdGlvbjogMC4wMSxcbiAgICAgICAgICBpbnRlcmVzdFJhdGVzOiAwLjAyLFxuICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMzVcbiAgICAgICAgfSxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMjBcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdTdGFnZmxhdGlvbicsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTG93IGdyb3d0aCB3aXRoIGhpZ2ggaW5mbGF0aW9uJyxcbiAgICAgICAgbWFya2V0Q29uZGl0aW9uczoge1xuICAgICAgICAgIGVjb25vbWljR3Jvd3RoOiAwLjAxLFxuICAgICAgICAgIGluZmxhdGlvbjogMC4wNixcbiAgICAgICAgICBpbnRlcmVzdFJhdGVzOiAwLjA2LFxuICAgICAgICAgIHZvbGF0aWxpdHk6IDAuMjVcbiAgICAgICAgfSxcbiAgICAgICAgcHJvYmFiaWxpdHk6IDAuMTVcbiAgICAgIH1cbiAgICBdO1xuICB9XG5cbiAgLy8gQWRkaXRpb25hbCBoZWxwZXIgbWV0aG9kcyB3b3VsZCBiZSBpbXBsZW1lbnRlZCBoZXJlLi4uXG4gIC8vIFRoaXMgaXMgYSBjb21wcmVoZW5zaXZlIGZvdW5kYXRpb24gZm9yIHRoZSBhbmFseXNpcyBhZ2VudFxuXG4gIHByaXZhdGUgYXN5bmMgZXZhbHVhdGVTY2VuYXJpbyhpbnZlc3RtZW50czogSW52ZXN0bWVudFtdLCBzY2VuYXJpbzogU2NlbmFyaW9EZWZpbml0aW9uKTogUHJvbWlzZTxTY2VuYXJpb091dGNvbWU+IHtcbiAgICAvLyBTaW1wbGlmaWVkIHNjZW5hcmlvIGV2YWx1YXRpb24gLSB3b3VsZCBiZSBtb3JlIHNvcGhpc3RpY2F0ZWQgaW4gcHJhY3RpY2VcbiAgICBjb25zdCBiYXNlUmV0dXJuID0gc2NlbmFyaW8ubWFya2V0Q29uZGl0aW9ucy5lY29ub21pY0dyb3d0aCB8fCAwO1xuICAgIGNvbnN0IHZvbGF0aWxpdHlBZGp1c3RtZW50ID0gKHNjZW5hcmlvLm1hcmtldENvbmRpdGlvbnMudm9sYXRpbGl0eSB8fCAwLjIpIC0gMC4yO1xuICAgIFxuICAgIGNvbnN0IHBvcnRmb2xpb1JldHVybiA9IGJhc2VSZXR1cm4gLSAodm9sYXRpbGl0eUFkanVzdG1lbnQgKiAwLjUpO1xuICAgIGNvbnN0IGluZGl2aWR1YWxSZXR1cm5zOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgXG4gICAgaW52ZXN0bWVudHMuZm9yRWFjaChpbnZlc3RtZW50ID0+IHtcbiAgICAgIC8vIEFwcGx5IHNlY3Rvci1zcGVjaWZpYyBhZGp1c3RtZW50c1xuICAgICAgbGV0IHNlY3Rvck11bHRpcGxpZXIgPSAxLjA7XG4gICAgICBpZiAoaW52ZXN0bWVudC5zZWN0b3IgPT09ICdUZWNobm9sb2d5Jykgc2VjdG9yTXVsdGlwbGllciA9IDEuMjtcbiAgICAgIGlmIChpbnZlc3RtZW50LnNlY3RvciA9PT0gJ1V0aWxpdGllcycpIHNlY3Rvck11bHRpcGxpZXIgPSAwLjg7XG4gICAgICBcbiAgICAgIGluZGl2aWR1YWxSZXR1cm5zW2ludmVzdG1lbnQuaWRdID0gcG9ydGZvbGlvUmV0dXJuICogc2VjdG9yTXVsdGlwbGllcjtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBzY2VuYXJpbyxcbiAgICAgIHBvcnRmb2xpb1JldHVybixcbiAgICAgIGluZGl2aWR1YWxSZXR1cm5zLFxuICAgICAgcmlza01ldHJpY3M6IHtcbiAgICAgICAgdm9sYXRpbGl0eTogc2NlbmFyaW8ubWFya2V0Q29uZGl0aW9ucy52b2xhdGlsaXR5IHx8IDAuMixcbiAgICAgICAgYmV0YTogMS4wLFxuICAgICAgICBzaGFycGVSYXRpbzogcG9ydGZvbGlvUmV0dXJuIC8gKHNjZW5hcmlvLm1hcmtldENvbmRpdGlvbnMudm9sYXRpbGl0eSB8fCAwLjIpLFxuICAgICAgICBkcmF3ZG93bjogTWF0aC5hYnMoTWF0aC5taW4oMCwgcG9ydGZvbGlvUmV0dXJuKSksXG4gICAgICAgIHZhcjogcG9ydGZvbGlvUmV0dXJuIC0gKDEuNjQ1ICogKHNjZW5hcmlvLm1hcmtldENvbmRpdGlvbnMudm9sYXRpbGl0eSB8fCAwLjIpKSxcbiAgICAgICAgY29ycmVsYXRpb25zOiB7fVxuICAgICAgfSxcbiAgICAgIHByb2JhYmlsaXR5OiBzY2VuYXJpby5wcm9iYWJpbGl0eVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUV4cGVjdGVkVmFsdWUoc2NlbmFyaW9zOiBTY2VuYXJpb091dGNvbWVbXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIHNjZW5hcmlvcy5yZWR1Y2UoKHN1bSwgc2NlbmFyaW8pID0+IFxuICAgICAgc3VtICsgKHNjZW5hcmlvLnBvcnRmb2xpb1JldHVybiAqIHNjZW5hcmlvLnByb2JhYmlsaXR5KSwgMFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZVByb2JhYmlsaXR5V2VpZ2h0ZWRSZXR1cm4oc2NlbmFyaW9zOiBTY2VuYXJpb091dGNvbWVbXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY2FsY3VsYXRlRXhwZWN0ZWRWYWx1ZShzY2VuYXJpb3MpO1xuICB9XG5cbiAgLy8gUGxhY2Vob2xkZXIgaW1wbGVtZW50YXRpb25zIGZvciByZW1haW5pbmcgbWV0aG9kc1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1UZWNobmljYWxBbmFseXNpcyhyZXF1ZXN0OiBBbmFseXNpc1JlcXVlc3QsIHN0YXJ0VGltZTogbnVtYmVyID0gRGF0ZS5ub3coKSk6IFByb21pc2U8QW5hbHlzaXNSZXNwb25zZT4ge1xuICAgIC8vIEltcGxlbWVudGF0aW9uIHdvdWxkIGdvIGhlcmVcbiAgICByZXR1cm4gdGhpcy5wZXJmb3JtRnVuZGFtZW50YWxBbmFseXNpcyhyZXF1ZXN0LCBzdGFydFRpbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtU2VudGltZW50QW5hbHlzaXMocmVxdWVzdDogQW5hbHlzaXNSZXF1ZXN0LCBzdGFydFRpbWU6IG51bWJlciA9IERhdGUubm93KCkpOiBQcm9taXNlPEFuYWx5c2lzUmVzcG9uc2U+IHtcbiAgICAvLyBJbXBsZW1lbnRhdGlvbiB3b3VsZCBnbyBoZXJlXG4gICAgcmV0dXJuIHRoaXMucGVyZm9ybUZ1bmRhbWVudGFsQW5hbHlzaXMocmVxdWVzdCwgc3RhcnRUaW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybVJpc2tBbmFseXNpcyhyZXF1ZXN0OiBBbmFseXNpc1JlcXVlc3QsIHN0YXJ0VGltZTogbnVtYmVyID0gRGF0ZS5ub3coKSk6IFByb21pc2U8QW5hbHlzaXNSZXNwb25zZT4ge1xuICAgIC8vIEltcGxlbWVudGF0aW9uIHdvdWxkIGdvIGhlcmVcbiAgICByZXR1cm4gdGhpcy5wZXJmb3JtRnVuZGFtZW50YWxBbmFseXNpcyhyZXF1ZXN0LCBzdGFydFRpbWUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtQ2F1c2F0aW9uQW5hbHlzaXMoaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSk6IFByb21pc2U8Q2F1c2F0aW9uQW5hbHlzaXNSZXN1bHQ+IHtcbiAgICAvLyBQbGFjZWhvbGRlciBpbXBsZW1lbnRhdGlvblxuICAgIHJldHVybiB7XG4gICAgICBjYXVzYWxSZWxhdGlvbnNoaXBzOiBbXSxcbiAgICAgIHN0YXRpc3RpY2FsU2lnbmlmaWNhbmNlOiB7fSxcbiAgICAgIG1ldGhvZG9sb2d5OiAnR3JhbmdlciBDYXVzYWxpdHknLFxuICAgICAgbGltaXRhdGlvbnM6IFsnTGltaXRlZCBoaXN0b3JpY2FsIGRhdGEnXSxcbiAgICAgIGNvbmZpZGVuY2U6IDAuN1xuICAgIH07XG4gIH1cblxuICAvLyBBZGRpdGlvbmFsIGhlbHBlciBtZXRob2RzIHdpdGggcGxhY2Vob2xkZXIgaW1wbGVtZW50YXRpb25zXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VGdW5kYW1lbnRhbEFuYWx5c2lzKGNvbXBsZXRpb246IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1bW1hcnk6ICdGdW5kYW1lbnRhbCBhbmFseXNpcyBjb21wbGV0ZWQnLFxuICAgICAgY29uZmlkZW5jZTogMC44LFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICBzdHJlbmd0aHM6IFsnU3Ryb25nIGZ1bmRhbWVudGFscyddLFxuICAgICAgICB3ZWFrbmVzc2VzOiBbJ01hcmtldCB2b2xhdGlsaXR5J10sXG4gICAgICAgIG9wcG9ydHVuaXRpZXM6IFsnR3Jvd3RoIHBvdGVudGlhbCddLFxuICAgICAgICB0aHJlYXRzOiBbJ0Vjb25vbWljIHVuY2VydGFpbnR5J10sXG4gICAgICAgIGtleU1ldHJpY3M6IHt9LFxuICAgICAgICBuYXJyYXRpdmVzOiBbY29tcGxldGlvbl1cbiAgICAgIH0sXG4gICAgICByZWNvbW1lbmRhdGlvbnM6IFt7XG4gICAgICAgIGFjdGlvbjogJ2hvbGQnIGFzIGNvbnN0LFxuICAgICAgICB0aW1lSG9yaXpvbjogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICAgIGNvbmZpZGVuY2U6IDAuOCxcbiAgICAgICAgcmF0aW9uYWxlOiAnQmFzZWQgb24gZnVuZGFtZW50YWwgYW5hbHlzaXMnXG4gICAgICB9XVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3REYXRhUG9pbnRzKGludmVzdG1lbnQ6IEludmVzdG1lbnQsIHR5cGU6IHN0cmluZyk6IERhdGFQb2ludFtdIHtcbiAgICByZXR1cm4gW3tcbiAgICAgIHNvdXJjZTogJ2Z1bmRhbWVudGFsLWFuYWx5c2lzJyxcbiAgICAgIHR5cGU6ICdmdW5kYW1lbnRhbCcgYXMgY29uc3QsXG4gICAgICB2YWx1ZTogaW52ZXN0bWVudC5mdW5kYW1lbnRhbHMsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICByZWxpYWJpbGl0eTogMC44XG4gICAgfV07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFzc2Vzc1BvcnRmb2xpb1Jpc2soaW52ZXN0bWVudHM6IEludmVzdG1lbnRbXSwgcGFyYW1ldGVyczogYW55KTogUHJvbWlzZTxSaXNrQXNzZXNzbWVudD4ge1xuICAgIHJldHVybiB7XG4gICAgICBvdmVyYWxsUmlzazogJ21lZGl1bScgYXMgY29uc3QsXG4gICAgICByaXNrU2NvcmU6IDAuNixcbiAgICAgIGtleVJpc2tzOiBbXSxcbiAgICAgIGRpdmVyc2lmaWNhdGlvblNjb3JlOiAwLjdcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUZ1bmRhbWVudGFsUmVjb21tZW5kYXRpb25zKHJlc3VsdHM6IEFuYWx5c2lzUmVzdWx0W10sIHBhcmFtZXRlcnM6IGFueSk6IFByb21pc2U8QW5hbHlzaXNSZWNvbW1lbmRhdGlvbltdPiB7XG4gICAgcmV0dXJuIFt7XG4gICAgICBhY3Rpb246ICdob2xkJyBhcyBjb25zdCxcbiAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOCxcbiAgICAgIHJhdGlvbmFsZTogJ0Jhc2VkIG9uIGNvbXByZWhlbnNpdmUgZnVuZGFtZW50YWwgYW5hbHlzaXMnXG4gICAgfV07XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUFuYWx5c2lzQ29uZmlkZW5jZShyZXN1bHRzOiBBbmFseXNpc1Jlc3VsdFtdKTogbnVtYmVyIHtcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHJldHVybiAwO1xuICAgIHJldHVybiByZXN1bHRzLnJlZHVjZSgoc3VtLCByZXN1bHQpID0+IHN1bSArIHJlc3VsdC5jb25maWRlbmNlLCAwKSAvIHJlc3VsdHMubGVuZ3RoO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVBdmVyYWdlQ29ycmVsYXRpb24obWF0cml4OiBDb3JyZWxhdGlvbk1hdHJpeCk6IG51bWJlciB7XG4gICAgY29uc3QgY29ycmVsYXRpb25zID0gbWF0cml4LnNpZ25pZmljYW50Q29ycmVsYXRpb25zLm1hcChjID0+IE1hdGguYWJzKGMuY29ycmVsYXRpb24pKTtcbiAgICByZXR1cm4gY29ycmVsYXRpb25zLnJlZHVjZSgoc3VtLCBjb3JyKSA9PiBzdW0gKyBjb3JyLCAwKSAvIGNvcnJlbGF0aW9ucy5sZW5ndGggfHwgMDtcbiAgfVxuXG4gIHByaXZhdGUgZmluZE1heENvcnJlbGF0aW9uKG1hdHJpeDogQ29ycmVsYXRpb25NYXRyaXgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heCguLi5tYXRyaXguc2lnbmlmaWNhbnRDb3JyZWxhdGlvbnMubWFwKGMgPT4gTWF0aC5hYnMoYy5jb3JyZWxhdGlvbikpLCAwKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVDb3JyZWxhdGlvblN1bW1hcnkobWF0cml4OiBDb3JyZWxhdGlvbk1hdHJpeCwgY2F1c2F0aW9uOiBDYXVzYXRpb25BbmFseXNpc1Jlc3VsdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGBDb3JyZWxhdGlvbiBhbmFseXNpcyBpZGVudGlmaWVkICR7bWF0cml4LnNpZ25pZmljYW50Q29ycmVsYXRpb25zLmxlbmd0aH0gc2lnbmlmaWNhbnQgcmVsYXRpb25zaGlwc2A7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQ29ycmVsYXRpb25OYXJyYXRpdmUobWF0cml4OiBDb3JyZWxhdGlvbk1hdHJpeCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuICdEZXRhaWxlZCBjb3JyZWxhdGlvbiBhbmFseXNpcyBuYXJyYXRpdmUnO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUNvcnJlbGF0aW9uUmVjb21tZW5kYXRpb25zKG1hdHJpeDogQ29ycmVsYXRpb25NYXRyaXgsIHJpc2s6IFJpc2tBc3Nlc3NtZW50KTogUHJvbWlzZTxBbmFseXNpc1JlY29tbWVuZGF0aW9uW10+IHtcbiAgICByZXR1cm4gW3tcbiAgICAgIGFjdGlvbjogJ2hvbGQnIGFzIGNvbnN0LFxuICAgICAgdGltZUhvcml6b246ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgY29uZmlkZW5jZTogMC44LFxuICAgICAgcmF0aW9uYWxlOiAnQmFzZWQgb24gY29ycmVsYXRpb24gYW5hbHlzaXMnXG4gICAgfV07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGFzc2Vzc0NvcnJlbGF0aW9uUmlzayhtYXRyaXg6IENvcnJlbGF0aW9uTWF0cml4LCBwYXJhbWV0ZXJzOiBhbnkpOiBQcm9taXNlPFJpc2tBc3Nlc3NtZW50PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG92ZXJhbGxSaXNrOiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgIHJpc2tTY29yZTogMC42LFxuICAgICAga2V5Umlza3M6IFtdLFxuICAgICAgZGl2ZXJzaWZpY2F0aW9uU2NvcmU6IDEgLSB0aGlzLmNhbGN1bGF0ZUF2ZXJhZ2VDb3JyZWxhdGlvbihtYXRyaXgpXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVTY2VuYXJpb1N1bW1hcnkoYW5hbHlzaXM6IFNjZW5hcmlvQW5hbHlzaXNSZXN1bHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBgU2NlbmFyaW8gYW5hbHlzaXMgc2hvd3MgZXhwZWN0ZWQgcmV0dXJuIG9mICR7KGFuYWx5c2lzLmV4cGVjdGVkVmFsdWUgKiAxMDApLnRvRml4ZWQoMSl9JWA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlU2NlbmFyaW9OYXJyYXRpdmUoYW5hbHlzaXM6IFNjZW5hcmlvQW5hbHlzaXNSZXN1bHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAnRGV0YWlsZWQgc2NlbmFyaW8gYW5hbHlzaXMgbmFycmF0aXZlJztcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVTY2VuYXJpb1JlY29tbWVuZGF0aW9ucyhhbmFseXNpczogU2NlbmFyaW9BbmFseXNpc1Jlc3VsdCk6IFByb21pc2U8QW5hbHlzaXNSZWNvbW1lbmRhdGlvbltdPiB7XG4gICAgcmV0dXJuIFt7XG4gICAgICBhY3Rpb246ICdob2xkJyBhcyBjb25zdCxcbiAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyBhcyBjb25zdCxcbiAgICAgIGNvbmZpZGVuY2U6IDAuOCxcbiAgICAgIHJhdGlvbmFsZTogJ0Jhc2VkIG9uIHNjZW5hcmlvIGFuYWx5c2lzJ1xuICAgIH1dO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhc3Nlc3NTY2VuYXJpb1Jpc2soYW5hbHlzaXM6IFNjZW5hcmlvQW5hbHlzaXNSZXN1bHQsIHBhcmFtZXRlcnM6IGFueSk6IFByb21pc2U8Umlza0Fzc2Vzc21lbnQ+IHtcbiAgICByZXR1cm4ge1xuICAgICAgb3ZlcmFsbFJpc2s6ICdtZWRpdW0nIGFzIGNvbnN0LFxuICAgICAgcmlza1Njb3JlOiAwLjYsXG4gICAgICBrZXlSaXNrczogW10sXG4gICAgICBkaXZlcnNpZmljYXRpb25TY29yZTogMC43XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY29tYmluZVJpc2tBc3Nlc3NtZW50cyhhc3Nlc3NtZW50czogUmlza0Fzc2Vzc21lbnRbXSk6IFByb21pc2U8Umlza0Fzc2Vzc21lbnQ+IHtcbiAgICBjb25zdCBhdmdSaXNrU2NvcmUgPSBhc3Nlc3NtZW50cy5yZWR1Y2UoKHN1bSwgYSkgPT4gc3VtICsgYS5yaXNrU2NvcmUsIDApIC8gYXNzZXNzbWVudHMubGVuZ3RoO1xuICAgIHJldHVybiB7XG4gICAgICBvdmVyYWxsUmlzazogYXZnUmlza1Njb3JlID4gMC43ID8gJ2hpZ2gnIDogYXZnUmlza1Njb3JlID4gMC40ID8gJ21lZGl1bScgOiAnbG93JyxcbiAgICAgIHJpc2tTY29yZTogYXZnUmlza1Njb3JlLFxuICAgICAga2V5Umlza3M6IFtdLFxuICAgICAgZGl2ZXJzaWZpY2F0aW9uU2NvcmU6IGFzc2Vzc21lbnRzLnJlZHVjZSgoc3VtLCBhKSA9PiBzdW0gKyBhLmRpdmVyc2lmaWNhdGlvblNjb3JlLCAwKSAvIGFzc2Vzc21lbnRzLmxlbmd0aFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN5bnRoZXNpemVSZWNvbW1lbmRhdGlvbnMocmVjb21tZW5kYXRpb25zOiBBbmFseXNpc1JlY29tbWVuZGF0aW9uW10pOiBQcm9taXNlPEFuYWx5c2lzUmVjb21tZW5kYXRpb25bXT4ge1xuICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGFuZCBwcmlvcml0aXplXG4gICAgY29uc3QgdW5pcXVlID0gcmVjb21tZW5kYXRpb25zLmZpbHRlcigocmVjLCBpbmRleCwgc2VsZikgPT4gXG4gICAgICBpbmRleCA9PT0gc2VsZi5maW5kSW5kZXgociA9PiByLmFjdGlvbiA9PT0gcmVjLmFjdGlvbiAmJiByLnRpbWVIb3Jpem9uID09PSByZWMudGltZUhvcml6b24pXG4gICAgKTtcbiAgICByZXR1cm4gdW5pcXVlLnNsaWNlKDAsIDUpOyAvLyBSZXR1cm4gdG9wIDUgcmVjb21tZW5kYXRpb25zXG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUNvbXByZWhlbnNpdmVDb25maWRlbmNlKGNvbmZpZGVuY2VzOiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgcmV0dXJuIGNvbmZpZGVuY2VzLnJlZHVjZSgoc3VtLCBjb25mKSA9PiBzdW0gKyBjb25mLCAwKSAvIGNvbmZpZGVuY2VzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYWdlbnQgbWVzc2FnZXMgZm9yIGNvbW11bmljYXRpb24gd2l0aCBvdGhlciBhZ2VudHNcbiAgICovXG4gIGFzeW5jIGhhbmRsZU1lc3NhZ2UobWVzc2FnZTogQWdlbnRNZXNzYWdlKTogUHJvbWlzZTxBZ2VudE1lc3NhZ2U+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3BvbnNlQ29udGVudDogYW55O1xuXG4gICAgICBzd2l0Y2ggKG1lc3NhZ2UubWVzc2FnZVR5cGUpIHtcbiAgICAgICAgY2FzZSAncmVxdWVzdCc6XG4gICAgICAgICAgaWYgKG1lc3NhZ2UuY29udGVudC50eXBlID09PSAnYW5hbHlzaXMnKSB7XG4gICAgICAgICAgICByZXNwb25zZUNvbnRlbnQgPSBhd2FpdCB0aGlzLnByb2Nlc3NBbmFseXNpc1JlcXVlc3QobWVzc2FnZS5jb250ZW50LnJlcXVlc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHJlcXVlc3QgdHlwZTogJHttZXNzYWdlLmNvbnRlbnQudHlwZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS5tZXNzYWdlVHlwZX1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2VuZGVyOiB0aGlzLmFnZW50VHlwZSxcbiAgICAgICAgcmVjaXBpZW50OiBtZXNzYWdlLnNlbmRlcixcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXNwb25zZScsXG4gICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlQ29udGVudCxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogbWVzc2FnZS5tZXRhZGF0YS5wcmlvcml0eSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6IG1lc3NhZ2UubWV0YWRhdGEuY29udmVyc2F0aW9uSWQsXG4gICAgICAgICAgcmVxdWVzdElkOiBtZXNzYWdlLm1ldGFkYXRhLnJlcXVlc3RJZFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBoYW5kbGluZyBtZXNzYWdlOicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufSJdfQ==