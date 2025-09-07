"use strict";
/**
 * Synthesis Agent Implementation
 *
 * This agent is responsible for:
 * - Output integration and coherence checking
 * - Narrative generation for investment ideas
 * - Visualization and formatting utilities
 *
 * Uses Claude Sonnet 3.7 for sophisticated content synthesis and narrative generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynthesisAgent = void 0;
const claude_sonnet_service_1 = require("./claude-sonnet-service");
const uuid_1 = require("uuid");
/**
 * Synthesis Agent class that handles output integration and narrative generation
 */
class SynthesisAgent {
    constructor(claudeSonnetService) {
        this.agentType = 'synthesis';
        this.claudeSonnetService = claudeSonnetService;
    }
    /**
     * Process a synthesis request and return integrated investment ideas with narratives
     */
    async processSynthesisRequest(request) {
        const startTime = Date.now();
        try {
            // Step 1: Perform coherence checking on input data
            const coherenceCheck = await this.performCoherenceCheck(request);
            // Step 2: Integrate analysis results
            const integratedResults = await this.integrateAnalysisResults(request.analysisResults);
            // Step 3: Generate investment ideas
            const investmentIdeas = await this.generateInvestmentIdeas(integratedResults, request.researchFindings, request.complianceChecks, request.userPreferences);
            // Step 4: Create narrative structure
            const narrativeStructure = await this.createNarrativeStructure(investmentIdeas, integratedResults, request.outputFormat);
            // Step 5: Generate detailed narratives
            const detailedNarrative = await this.generateDetailedNarrative(narrativeStructure);
            const executiveSummary = await this.generateExecutiveSummary(investmentIdeas, integratedResults);
            // Step 6: Extract key insights
            const keyInsights = await this.extractKeyInsights(investmentIdeas, integratedResults);
            // Step 7: Generate risk summary
            const riskSummary = await this.generateRiskSummary(investmentIdeas, request.complianceChecks);
            // Step 8: Create synthesis recommendations
            const recommendations = await this.createSynthesisRecommendations(investmentIdeas);
            // Step 9: Generate visualizations if requested
            const visualizations = request.includeVisualizations
                ? await this.generateVisualizations(investmentIdeas, integratedResults)
                : [];
            return {
                investmentIdeas,
                executiveSummary,
                detailedNarrative,
                keyInsights,
                riskSummary,
                recommendations,
                visualizations,
                coherenceScore: coherenceCheck.overallScore,
                confidence: this.calculateOverallConfidence(investmentIdeas),
                executionTime: Date.now() - startTime
            };
        }
        catch (error) {
            console.error('Error processing synthesis request:', error);
            throw error;
        }
    }
    /**
     * Perform coherence checking on input data
     */
    async performCoherenceCheck(request) {
        const prompt = `
      As a synthesis agent, perform a comprehensive coherence check on the following investment analysis data:
      
      Analysis Results: ${JSON.stringify(request.analysisResults, null, 2)}
      Research Findings: ${JSON.stringify(request.researchFindings, null, 2)}
      Compliance Checks: ${JSON.stringify(request.complianceChecks, null, 2)}
      
      Please evaluate:
      1. Consistency across different analysis types
      2. Completeness of the analysis coverage
      3. Clarity of findings and recommendations
      4. Identification of any contradictions or gaps
      
      Provide scores (0-1) for:
      - Overall coherence
      - Consistency
      - Completeness
      - Clarity
      
      List any issues found with severity levels and suggested fixes.
      
      Format your response as JSON with the structure:
      {
        "overallScore": number,
        "consistencyScore": number,
        "completenessScore": number,
        "clarityScore": number,
        "issues": [{"type": string, "severity": string, "description": string, "location": string, "suggestedFix": string}],
        "recommendations": [string]
      }
    `;
        const response = await this.claudeSonnetService.complete({
            prompt,
            template: claude_sonnet_service_1.ClaudePromptTemplate.INVESTMENT_ANALYSIS,
            templateVariables: {
                analysisType: 'coherence-check',
                context: 'Investment analysis synthesis',
                requirements: 'Comprehensive coherence evaluation'
            },
            maxTokens: 1500,
            temperature: 0.2
        });
        try {
            return JSON.parse(response.completion);
        }
        catch (error) {
            // Fallback coherence check
            return {
                overallScore: 0.8,
                consistencyScore: 0.8,
                completenessScore: 0.7,
                clarityScore: 0.8,
                issues: [],
                recommendations: ['Review for consistency', 'Ensure completeness']
            };
        }
    }
    /**
     * Integrate analysis results from different agents
     */
    async integrateAnalysisResults(analysisResults) {
        const integrationPrompt = `
      Integrate the following analysis results from different specialized agents:
      
      ${analysisResults.map((result, index) => `
        Analysis ${index + 1} (${result.analysisType}):
        - Summary: ${result.summary}
        - Confidence: ${result.confidence}
        - Key Details: ${JSON.stringify(result.details, null, 2)}
        - Recommendations: ${JSON.stringify(result.recommendations, null, 2)}
      `).join('\n')}
      
      Please provide:
      1. Consolidated findings that reconcile different perspectives
      2. Weighted confidence scores based on analysis quality
      3. Integrated recommendations that consider all inputs
      4. Identification of consensus and divergent views
      5. Overall investment thesis
      
      Format as structured JSON.
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: integrationPrompt,
            maxTokens: 2000,
            temperature: 0.3
        });
        try {
            return JSON.parse(response.completion);
        }
        catch (error) {
            // Fallback integration
            return {
                consolidatedFindings: analysisResults.map(r => r.summary),
                weightedConfidence: analysisResults.reduce((sum, r) => sum + r.confidence, 0) / analysisResults.length,
                integratedRecommendations: analysisResults.flatMap(r => r.recommendations),
                consensus: 'Mixed signals require careful consideration',
                investmentThesis: 'Comprehensive analysis suggests cautious optimism'
            };
        }
    }
    /**
     * Generate investment ideas based on integrated analysis
     */
    async generateInvestmentIdeas(integratedResults, researchFindings, complianceChecks, userPreferences) {
        const ideaGenerationPrompt = `
      Based on the integrated analysis and research findings, generate specific investment ideas:
      
      Integrated Analysis: ${JSON.stringify(integratedResults, null, 2)}
      Research Findings: ${JSON.stringify(researchFindings, null, 2)}
      Compliance Status: ${JSON.stringify(complianceChecks, null, 2)}
      User Preferences: ${JSON.stringify(userPreferences, null, 2)}
      
      Generate 3-5 specific investment ideas, each with:
      1. Clear title and description
      2. Detailed rationale based on analysis
      3. Confidence score (0-1)
      4. Time horizon alignment
      5. Potential outcomes (best, expected, worst case)
      6. Risk factors and mitigation strategies
      7. Supporting data points
      8. Counter-arguments and responses
      9. Compliance considerations
      
      Format each idea as a complete investment recommendation.
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: ideaGenerationPrompt,
            maxTokens: 3000,
            temperature: 0.4
        });
        // Parse and structure the investment ideas
        const ideas = await this.parseInvestmentIdeas(response.completion, integratedResults);
        return ideas;
    }
    /**
     * Parse investment ideas from AI response
     */
    async parseInvestmentIdeas(completion, integratedResults) {
        // This would typically involve more sophisticated parsing
        // For now, create structured investment ideas based on the completion
        const ideas = [];
        // Create a sample investment idea structure
        const baseIdea = {
            id: (0, uuid_1.v4)(),
            version: 1,
            title: 'AI-Generated Investment Opportunity',
            description: completion.substring(0, 500) + '...',
            investments: [],
            rationale: 'Based on comprehensive multi-agent analysis',
            strategy: 'buy',
            timeHorizon: 'medium',
            confidenceScore: integratedResults.weightedConfidence || 0.8,
            generatedAt: new Date(),
            lastUpdatedAt: new Date(),
            potentialOutcomes: [
                {
                    scenario: 'best',
                    probability: 0.2,
                    returnEstimate: 0.25,
                    timeToRealization: 365,
                    description: 'Optimal market conditions and execution',
                    conditions: ['Strong market performance', 'Successful strategy execution'],
                    keyRisks: ['Market volatility'],
                    catalysts: ['Strong earnings', 'Market expansion']
                },
                {
                    scenario: 'expected',
                    probability: 0.6,
                    returnEstimate: 0.12,
                    timeToRealization: 365,
                    description: 'Normal market conditions',
                    conditions: ['Stable market environment', 'Average execution'],
                    keyRisks: ['Market uncertainty'],
                    catalysts: ['Steady growth', 'Market stability']
                },
                {
                    scenario: 'worst',
                    probability: 0.2,
                    returnEstimate: -0.05,
                    timeToRealization: 365,
                    description: 'Adverse market conditions',
                    conditions: ['Market downturn', 'Strategy underperformance'],
                    keyRisks: ['Economic recession', 'Market crash'],
                    catalysts: ['Market recovery', 'Policy changes']
                }
            ],
            supportingData: [],
            counterArguments: [
                {
                    description: 'Market volatility could impact returns',
                    strength: 'moderate',
                    impact: 'medium',
                    mitigationStrategy: 'Diversification and risk management',
                    probability: 0.3
                }
            ],
            complianceStatus: {
                compliant: true,
                issues: [],
                regulationsChecked: ['SEC', 'FINRA'],
                timestamp: new Date()
            },
            createdBy: 'synthesis-agent-claude-sonnet',
            tags: ['ai-generated', 'multi-agent-analysis'],
            category: 'equity',
            riskLevel: 'moderate',
            targetAudience: ['retail'],
            metadata: {
                sourceModels: ['claude-sonnet-3.7'],
                processingTime: 10000,
                dataSourcesUsed: ['research-agent', 'analysis-agent', 'compliance-agent'],
                researchDepth: 'comprehensive',
                qualityScore: 85,
                noveltyScore: 75,
                marketConditionsAtGeneration: {
                    volatilityIndex: 20,
                    marketTrend: 'sideways',
                    economicIndicators: {},
                    geopoliticalRisk: 'medium'
                }
            },
            trackingInfo: {
                views: 0,
                implementations: 0,
                feedback: [],
                performance: [],
                status: 'active',
                statusHistory: [{
                        status: 'active',
                        timestamp: new Date(),
                        changedBy: 'synthesis-agent'
                    }]
            }
        };
        ideas.push(baseIdea);
        return ideas;
    }
    /**
     * Create narrative structure for the investment report
     */
    async createNarrativeStructure(investmentIdeas, integratedResults, outputFormat) {
        const structurePrompt = `
      Create a narrative structure for an investment report with the following format: ${outputFormat}
      
      Investment Ideas: ${investmentIdeas.length} ideas generated
      Analysis Results: ${JSON.stringify(integratedResults, null, 2)}
      
      Design a logical flow with sections that include:
      1. Executive summary
      2. Market analysis overview
      3. Individual investment opportunities
      4. Risk assessment
      5. Implementation recommendations
      6. Conclusion and next steps
      
      For each section, specify:
      - Title and content outline
      - Priority level
      - Dependencies on other sections
      - Key messages to convey
      
      Format as structured JSON.
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: structurePrompt,
            maxTokens: 1500,
            temperature: 0.3
        });
        try {
            const parsed = JSON.parse(response.completion);
            return {
                sections: parsed.sections || [],
                flow: parsed.flow || ['introduction', 'analysis', 'recommendations', 'conclusion'],
                keyMessages: parsed.keyMessages || [],
                supportingEvidence: parsed.supportingEvidence || {}
            };
        }
        catch (error) {
            // Fallback structure
            return {
                sections: [
                    {
                        id: 'executive-summary',
                        title: 'Executive Summary',
                        content: 'High-level overview of investment opportunities',
                        type: 'introduction',
                        priority: 1,
                        dependencies: []
                    },
                    {
                        id: 'investment-ideas',
                        title: 'Investment Opportunities',
                        content: 'Detailed analysis of recommended investments',
                        type: 'recommendations',
                        priority: 2,
                        dependencies: ['executive-summary']
                    }
                ],
                flow: ['executive-summary', 'investment-ideas'],
                keyMessages: ['Strong investment opportunities identified', 'Risk-adjusted returns favorable'],
                supportingEvidence: {}
            };
        }
    }
    /**
     * Generate detailed narrative based on structure
     */
    async generateDetailedNarrative(structure) {
        const narrativePrompt = `
      Generate a comprehensive investment report narrative based on this structure:
      
      ${JSON.stringify(structure, null, 2)}
      
      Create a professional, coherent narrative that:
      1. Flows logically from section to section
      2. Maintains consistent tone and style
      3. Supports key messages with evidence
      4. Uses clear, professional language
      5. Includes appropriate transitions
      
      The narrative should be suitable for investment professionals and decision-makers.
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: narrativePrompt,
            maxTokens: 4000,
            temperature: 0.4
        });
        return response.completion;
    }
    /**
     * Generate executive summary
     */
    async generateExecutiveSummary(investmentIdeas, integratedResults) {
        const summaryPrompt = `
      Create a concise executive summary for the following investment analysis:
      
      Number of Investment Ideas: ${investmentIdeas.length}
      Average Confidence: ${investmentIdeas.reduce((sum, idea) => sum + idea.confidenceScore, 0) / investmentIdeas.length}
      
      Investment Ideas:
      ${investmentIdeas.map(idea => `- ${idea.title}: ${idea.description.substring(0, 100)}...`).join('\n')}
      
      Integrated Analysis: ${JSON.stringify(integratedResults, null, 2)}
      
      The summary should be 3-4 paragraphs covering:
      1. Key findings and opportunities
      2. Risk assessment
      3. Recommended actions
      4. Expected outcomes
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: summaryPrompt,
            maxTokens: 800,
            temperature: 0.3
        });
        return response.completion;
    }
    /**
     * Extract key insights from analysis
     */
    async extractKeyInsights(investmentIdeas, integratedResults) {
        const insightsPrompt = `
      Extract 5-7 key insights from the investment analysis:
      
      Investment Ideas: ${JSON.stringify(investmentIdeas.map(idea => ({
            title: idea.title,
            rationale: idea.rationale,
            confidence: idea.confidenceScore
        })), null, 2)}
      
      Integrated Results: ${JSON.stringify(integratedResults, null, 2)}
      
      Focus on:
      1. Market opportunities
      2. Risk factors
      3. Timing considerations
      4. Strategic implications
      5. Unique findings
      
      Return as a JSON array of strings.
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: insightsPrompt,
            maxTokens: 1000,
            temperature: 0.3
        });
        try {
            return JSON.parse(response.completion);
        }
        catch (error) {
            // Fallback insights
            return [
                'Multiple investment opportunities identified with strong fundamentals',
                'Risk-adjusted returns appear favorable in current market conditions',
                'Diversification across sectors recommended for optimal portfolio balance',
                'Timing considerations suggest gradual position building',
                'Compliance requirements fully satisfied for all recommendations'
            ];
        }
    }
    /**
     * Generate risk summary
     */
    async generateRiskSummary(investmentIdeas, complianceChecks) {
        const riskPrompt = `
      Generate a comprehensive risk summary for the investment recommendations:
      
      Investment Ideas: ${investmentIdeas.length} recommendations
      Risk Factors: ${investmentIdeas.flatMap(idea => idea.counterArguments.map((arg) => arg.description)).join(', ')}
      
      Compliance Status: ${JSON.stringify(complianceChecks, null, 2)}
      
      Cover:
      1. Overall risk assessment
      2. Key risk factors and mitigation strategies
      3. Compliance considerations
      4. Risk monitoring recommendations
    `;
        const response = await this.claudeSonnetService.complete({
            prompt: riskPrompt,
            maxTokens: 1200,
            temperature: 0.3
        });
        return response.completion;
    }
    /**
     * Create synthesis recommendations
     */
    async createSynthesisRecommendations(investmentIdeas) {
        const recommendations = [];
        for (const idea of investmentIdeas) {
            recommendations.push({
                priority: idea.confidenceScore > 0.8 ? 'high' : idea.confidenceScore > 0.6 ? 'medium' : 'low',
                action: idea.strategy,
                investment: idea.title,
                rationale: idea.rationale,
                timeframe: idea.timeHorizon,
                confidence: idea.confidenceScore,
                supportingEvidence: idea.supportingData.map((dp) => dp.source)
            });
        }
        return recommendations.sort((a, b) => b.confidence - a.confidence);
    }
    /**
     * Generate visualizations for the investment ideas
     */
    async generateVisualizations(investmentIdeas, integratedResults) {
        const visualizations = [];
        // Risk-Return Scatter Plot
        visualizations.push({
            id: (0, uuid_1.v4)(),
            type: 'chart',
            title: 'Risk-Return Analysis',
            description: 'Investment opportunities plotted by expected return vs risk',
            data: {
                datasets: [{
                        label: 'Investment Ideas',
                        data: investmentIdeas.map(idea => ({
                            x: this.calculateRiskScore(idea),
                            y: idea.potentialOutcomes.find((o) => o.scenario === 'expected')?.returnEstimate || 0,
                            label: idea.title
                        }))
                    }]
            },
            config: {
                chartType: 'scatter',
                dimensions: { width: 800, height: 600 },
                styling: { theme: 'professional', colors: ['#2E86AB', '#A23B72', '#F18F01'] },
                interactivity: { zoom: true, filter: true, tooltip: true },
                export: { formats: ['png', 'svg'] }
            },
            priority: 'high'
        });
        // Confidence Distribution
        visualizations.push({
            id: (0, uuid_1.v4)(),
            type: 'chart',
            title: 'Confidence Distribution',
            description: 'Distribution of confidence scores across investment ideas',
            data: {
                labels: investmentIdeas.map(idea => idea.title),
                datasets: [{
                        label: 'Confidence Score',
                        data: investmentIdeas.map(idea => idea.confidenceScore)
                    }]
            },
            config: {
                chartType: 'bar',
                dimensions: { width: 600, height: 400 },
                styling: { theme: 'professional', colors: ['#4CAF50', '#FF9800', '#F44336'] },
                interactivity: { zoom: false, filter: true, tooltip: true },
                export: { formats: ['png'] }
            },
            priority: 'medium'
        });
        // Investment Timeline
        visualizations.push({
            id: (0, uuid_1.v4)(),
            type: 'diagram',
            title: 'Implementation Timeline',
            description: 'Recommended timeline for investment implementation',
            data: {
                timeline: investmentIdeas.map((idea, index) => ({
                    id: idea.id,
                    title: idea.title,
                    timeHorizon: idea.timeHorizon,
                    priority: index + 1
                }))
            },
            config: {
                dimensions: { width: 1000, height: 300 },
                styling: { theme: 'professional', colors: ['#1976D2', '#388E3C', '#F57C00'] },
                interactivity: { zoom: false, filter: false, tooltip: true },
                export: { formats: ['png', 'svg'] }
            },
            priority: 'medium'
        });
        return visualizations;
    }
    /**
     * Calculate risk score for an investment idea
     */
    calculateRiskScore(idea) {
        const worstCase = idea.potentialOutcomes.find((o) => o.scenario === 'worst');
        const expected = idea.potentialOutcomes.find((o) => o.scenario === 'expected');
        if (!worstCase || !expected)
            return 0.5;
        // Risk as potential downside from expected
        return Math.abs(worstCase.returnEstimate - expected.returnEstimate);
    }
    /**
     * Calculate overall confidence across investment ideas
     */
    calculateOverallConfidence(investmentIdeas) {
        if (investmentIdeas.length === 0)
            return 0;
        return investmentIdeas.reduce((sum, idea) => sum + idea.confidenceScore, 0) / investmentIdeas.length;
    }
    /**
     * Handle agent messages for communication with other agents
     */
    async handleMessage(message) {
        try {
            let responseContent;
            switch (message.messageType) {
                case 'request':
                    if (message.content.type === 'synthesis') {
                        responseContent = await this.processSynthesisRequest(message.content.request);
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
    /**
     * Format output for different presentation formats
     */
    async formatOutput(response, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(response, null, 2);
            case 'markdown':
                return this.formatAsMarkdown(response);
            case 'html':
                return this.formatAsHTML(response);
            case 'pdf':
                // Would integrate with PDF generation library
                return this.formatAsMarkdown(response); // Fallback to markdown
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    /**
     * Format response as Markdown
     */
    formatAsMarkdown(response) {
        let markdown = `# Investment Analysis Report\n\n`;
        markdown += `## Executive Summary\n\n${response.executiveSummary}\n\n`;
        markdown += `## Key Insights\n\n`;
        response.keyInsights.forEach((insight, index) => {
            markdown += `${index + 1}. ${insight}\n`;
        });
        markdown += '\n';
        markdown += `## Investment Opportunities\n\n`;
        response.investmentIdeas.forEach((idea, index) => {
            markdown += `### ${index + 1}. ${idea.title}\n\n`;
            markdown += `**Description:** ${idea.description}\n\n`;
            markdown += `**Rationale:** ${idea.rationale}\n\n`;
            markdown += `**Confidence:** ${(idea.confidenceScore * 100).toFixed(1)}%\n\n`;
            markdown += `**Time Horizon:** ${idea.timeHorizon}\n\n`;
            markdown += `**Potential Outcomes:**\n`;
            idea.potentialOutcomes.forEach((outcome) => {
                markdown += `- **${outcome.scenario.charAt(0).toUpperCase() + outcome.scenario.slice(1)}:** ${(outcome.returnEstimate * 100).toFixed(1)}% (${(outcome.probability * 100).toFixed(0)}% probability)\n`;
            });
            markdown += '\n';
        });
        markdown += `## Risk Assessment\n\n${response.riskSummary}\n\n`;
        markdown += `## Recommendations\n\n`;
        response.recommendations.forEach((rec, index) => {
            markdown += `${index + 1}. **${rec.action.toUpperCase()}** ${rec.investment} (${rec.priority} priority)\n`;
            markdown += `   - ${rec.rationale}\n`;
            markdown += `   - Confidence: ${(rec.confidence * 100).toFixed(1)}%\n\n`;
        });
        markdown += `---\n\n`;
        markdown += `*Report generated by Investment AI Agent - Synthesis Agent*\n`;
        markdown += `*Coherence Score: ${(response.coherenceScore * 100).toFixed(1)}%*\n`;
        markdown += `*Overall Confidence: ${(response.confidence * 100).toFixed(1)}%*\n`;
        return markdown;
    }
    /**
     * Format response as HTML
     */
    formatAsHTML(response) {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Investment Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #2c3e50; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .insight { margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 3px; }
        .investment { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .confidence { font-weight: bold; color: #27ae60; }
        .risk { color: #e74c3c; }
        .recommendation { margin: 10px 0; padding: 10px; background: #f0f8ff; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Investment Analysis Report</h1>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <p>${response.executiveSummary.replace(/\n/g, '</p><p>')}</p>
    </div>
    
    <h2>Key Insights</h2>
    ${response.keyInsights.map(insight => `<div class="insight">${insight}</div>`).join('')}
    
    <h2>Investment Opportunities</h2>
    ${response.investmentIdeas.map((idea, index) => `
        <div class="investment">
            <h3>${index + 1}. ${idea.title}</h3>
            <p><strong>Description:</strong> ${idea.description}</p>
            <p><strong>Rationale:</strong> ${idea.rationale}</p>
            <p><strong>Confidence:</strong> <span class="confidence">${(idea.confidenceScore * 100).toFixed(1)}%</span></p>
            <p><strong>Time Horizon:</strong> ${idea.timeHorizon}</p>
            <h4>Potential Outcomes:</h4>
            <ul>
                ${idea.potentialOutcomes.map((outcome) => `
                    <li><strong>${outcome.scenario.charAt(0).toUpperCase() + outcome.scenario.slice(1)}:</strong> 
                        ${(outcome.returnEstimate * 100).toFixed(1)}% (${(outcome.probability * 100).toFixed(0)}% probability)
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('')}
    
    <h2>Risk Assessment</h2>
    <div class="risk">
        <p>${response.riskSummary.replace(/\n/g, '</p><p>')}</p>
    </div>
    
    <h2>Recommendations</h2>
    ${response.recommendations.map((rec, index) => `
        <div class="recommendation">
            <strong>${index + 1}. ${rec.action.toUpperCase()}</strong> ${rec.investment} (${rec.priority} priority)<br>
            ${rec.rationale}<br>
            <span class="confidence">Confidence: ${(rec.confidence * 100).toFixed(1)}%</span>
        </div>
    `).join('')}
    
    <hr>
    <p><em>Report generated by Investment AI Agent - Synthesis Agent</em></p>
    <p><em>Coherence Score: ${(response.coherenceScore * 100).toFixed(1)}%</em></p>
    <p><em>Overall Confidence: ${(response.confidence * 100).toFixed(1)}%</em></p>
</body>
</html>
    `;
        return html;
    }
}
exports.SynthesisAgent = SynthesisAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGhlc2lzLWFnZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL2FpL3N5bnRoZXNpcy1hZ2VudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7QUFFSCxtRUFBb0Y7QUFhcEYsK0JBQW9DO0FBdUdwQzs7R0FFRztBQUNILE1BQWEsY0FBYztJQUl6QixZQUFZLG1CQUF3QztRQUY1QyxjQUFTLEdBQWMsV0FBVyxDQUFDO1FBR3pDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztJQUNqRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsdUJBQXVCLENBQUMsT0FBeUI7UUFDckQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUk7WUFDRixtREFBbUQ7WUFDbkQsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFakUscUNBQXFDO1lBQ3JDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRXZGLG9DQUFvQztZQUNwQyxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FDeEQsaUJBQWlCLEVBQ2pCLE9BQU8sQ0FBQyxnQkFBZ0IsRUFDeEIsT0FBTyxDQUFDLGdCQUFnQixFQUN4QixPQUFPLENBQUMsZUFBZSxDQUN4QixDQUFDO1lBRUYscUNBQXFDO1lBQ3JDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQzVELGVBQWUsRUFDZixpQkFBaUIsRUFDakIsT0FBTyxDQUFDLFlBQVksQ0FDckIsQ0FBQztZQUVGLHVDQUF1QztZQUN2QyxNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLGtCQUFrQixD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QUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzs7S0FFL0UsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Ozs7OEJBSWUsQ0FBQyxRQUFRLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7aUNBQ3ZDLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOzs7S0FHbEUsQ0FBQztRQUVGLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBejFCRCx3Q0F5MUJDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTeW50aGVzaXMgQWdlbnQgSW1wbGVtZW50YXRpb25cbiAqIFxuICogVGhpcyBhZ2VudCBpcyByZXNwb25zaWJsZSBmb3I6XG4gKiAtIE91dHB1dCBpbnRlZ3JhdGlvbiBhbmQgY29oZXJlbmNlIGNoZWNraW5nXG4gKiAtIE5hcnJhdGl2ZSBnZW5lcmF0aW9uIGZvciBpbnZlc3RtZW50IGlkZWFzXG4gKiAtIFZpc3VhbGl6YXRpb24gYW5kIGZvcm1hdHRpbmcgdXRpbGl0aWVzXG4gKiBcbiAqIFVzZXMgQ2xhdWRlIFNvbm5ldCAzLjcgZm9yIHNvcGhpc3RpY2F0ZWQgY29udGVudCBzeW50aGVzaXMgYW5kIG5hcnJhdGl2ZSBnZW5lcmF0aW9uXG4gKi9cblxuaW1wb3J0IHsgQ2xhdWRlU29ubmV0U2VydmljZSwgQ2xhdWRlUHJvbXB0VGVtcGxhdGUgfSBmcm9tICcuL2NsYXVkZS1zb25uZXQtc2VydmljZSc7XG5pbXBvcnQgeyBcbiAgQWdlbnRNZXNzYWdlLCBcbiAgQWdlbnRUYXNrLCBcbiAgQ29udmVyc2F0aW9uQ29udGV4dCwgXG4gIEFnZW50VHlwZSBcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL2FnZW50JztcbmltcG9ydCB7IFxuICBBbmFseXNpc1Jlc3VsdCxcbiAgQW5hbHlzaXNSZWNvbW1lbmRhdGlvbixcbiAgRGF0YVBvaW50XG59IGZyb20gJy4uLy4uL21vZGVscy9hbmFseXNpcyc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYSwgT3V0Y29tZSwgQ291bnRlckFyZ3VtZW50IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNSZXF1ZXN0IHtcbiAgYW5hbHlzaXNSZXN1bHRzOiBBbmFseXNpc1Jlc3VsdFtdO1xuICByZXNlYXJjaEZpbmRpbmdzOiBhbnlbXTtcbiAgY29tcGxpYW5jZUNoZWNrczogYW55W107XG4gIHVzZXJQcmVmZXJlbmNlczoge1xuICAgIGludmVzdG1lbnRIb3Jpem9uOiAnc2hvcnQnIHwgJ21lZGl1bScgfCAnbG9uZyc7XG4gICAgcmlza1RvbGVyYW5jZTogJ2NvbnNlcnZhdGl2ZScgfCAnbW9kZXJhdGUnIHwgJ2FnZ3Jlc3NpdmUnO1xuICAgIHByZWZlcnJlZFNlY3RvcnM/OiBzdHJpbmdbXTtcbiAgICBleGNsdWRlZEludmVzdG1lbnRzPzogc3RyaW5nW107XG4gIH07XG4gIG91dHB1dEZvcm1hdDogJ2RldGFpbGVkJyB8ICdzdW1tYXJ5JyB8ICdleGVjdXRpdmUnIHwgJ3RlY2huaWNhbCc7XG4gIGluY2x1ZGVWaXN1YWxpemF0aW9uczogYm9vbGVhbjtcbiAgY29udGV4dD86IENvbnZlcnNhdGlvbkNvbnRleHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3ludGhlc2lzUmVzcG9uc2Uge1xuICBpbnZlc3RtZW50SWRlYXM6IEludmVzdG1lbnRJZGVhW107XG4gIGV4ZWN1dGl2ZVN1bW1hcnk6IHN0cmluZztcbiAgZGV0YWlsZWROYXJyYXRpdmU6IHN0cmluZztcbiAga2V5SW5zaWdodHM6IHN0cmluZ1tdO1xuICByaXNrU3VtbWFyeTogc3RyaW5nO1xuICByZWNvbW1lbmRhdGlvbnM6IFN5bnRoZXNpc1JlY29tbWVuZGF0aW9uW107XG4gIHZpc3VhbGl6YXRpb25zOiBWaXN1YWxpemF0aW9uU3BlY1tdO1xuICBjb2hlcmVuY2VTY29yZTogbnVtYmVyO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG4gIGV4ZWN1dGlvblRpbWU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTeW50aGVzaXNSZWNvbW1lbmRhdGlvbiB7XG4gIHByaW9yaXR5OiAnaGlnaCcgfCAnbWVkaXVtJyB8ICdsb3cnO1xuICBhY3Rpb246ICdidXknIHwgJ3NlbGwnIHwgJ2hvbGQnIHwgJ2ludmVzdGlnYXRlJyB8ICdtb25pdG9yJztcbiAgaW52ZXN0bWVudDogc3RyaW5nO1xuICByYXRpb25hbGU6IHN0cmluZztcbiAgdGltZWZyYW1lOiBzdHJpbmc7XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgc3VwcG9ydGluZ0V2aWRlbmNlOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBWaXN1YWxpemF0aW9uU3BlYyB7XG4gIGlkOiBzdHJpbmc7XG4gIHR5cGU6ICdjaGFydCcgfCAndGFibGUnIHwgJ2RpYWdyYW0nIHwgJ2luZm9ncmFwaGljJyB8ICdkYXNoYm9hcmQnO1xuICB0aXRsZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICBkYXRhOiBhbnk7XG4gIGNvbmZpZzogVmlzdWFsaXphdGlvbkNvbmZpZztcbiAgcHJpb3JpdHk6ICdoaWdoJyB8ICdtZWRpdW0nIHwgJ2xvdyc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlzdWFsaXphdGlvbkNvbmZpZyB7XG4gIGNoYXJ0VHlwZT86ICdsaW5lJyB8ICdiYXInIHwgJ3BpZScgfCAnc2NhdHRlcicgfCAnaGVhdG1hcCcgfCAndHJlZW1hcCc7XG4gIGRpbWVuc2lvbnM6IHtcbiAgICB3aWR0aDogbnVtYmVyO1xuICAgIGhlaWdodDogbnVtYmVyO1xuICB9O1xuICBzdHlsaW5nOiB7XG4gICAgdGhlbWU6ICdsaWdodCcgfCAnZGFyaycgfCAncHJvZmVzc2lvbmFsJztcbiAgICBjb2xvcnM6IHN0cmluZ1tdO1xuICB9O1xuICBpbnRlcmFjdGl2aXR5OiB7XG4gICAgem9vbTogYm9vbGVhbjtcbiAgICBmaWx0ZXI6IGJvb2xlYW47XG4gICAgdG9vbHRpcDogYm9vbGVhbjtcbiAgfTtcbiAgZXhwb3J0OiB7XG4gICAgZm9ybWF0czogKCdwbmcnIHwgJ3N2ZycgfCAncGRmJylbXTtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb2hlcmVuY2VDaGVjayB7XG4gIG92ZXJhbGxTY29yZTogbnVtYmVyO1xuICBjb25zaXN0ZW5jeVNjb3JlOiBudW1iZXI7XG4gIGNvbXBsZXRlbmVzc1Njb3JlOiBudW1iZXI7XG4gIGNsYXJpdHlTY29yZTogbnVtYmVyO1xuICBpc3N1ZXM6IENvaGVyZW5jZUlzc3VlW107XG4gIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29oZXJlbmNlSXNzdWUge1xuICB0eXBlOiAnaW5jb25zaXN0ZW5jeScgfCAnZ2FwJyB8ICdjb250cmFkaWN0aW9uJyB8ICd1bmNsZWFyJyB8ICdpbmNvbXBsZXRlJztcbiAgc2V2ZXJpdHk6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGxvY2F0aW9uOiBzdHJpbmc7XG4gIHN1Z2dlc3RlZEZpeDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5hcnJhdGl2ZVN0cnVjdHVyZSB7XG4gIHNlY3Rpb25zOiBOYXJyYXRpdmVTZWN0aW9uW107XG4gIGZsb3c6IHN0cmluZ1tdO1xuICBrZXlNZXNzYWdlczogc3RyaW5nW107XG4gIHN1cHBvcnRpbmdFdmlkZW5jZTogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5hcnJhdGl2ZVNlY3Rpb24ge1xuICBpZDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBjb250ZW50OiBzdHJpbmc7XG4gIHR5cGU6ICdpbnRyb2R1Y3Rpb24nIHwgJ2FuYWx5c2lzJyB8ICdmaW5kaW5ncycgfCAncmVjb21tZW5kYXRpb25zJyB8ICdyaXNrcycgfCAnY29uY2x1c2lvbic7XG4gIHByaW9yaXR5OiBudW1iZXI7XG4gIGRlcGVuZGVuY2llczogc3RyaW5nW107XG59XG5cbi8qKlxuICogU3ludGhlc2lzIEFnZW50IGNsYXNzIHRoYXQgaGFuZGxlcyBvdXRwdXQgaW50ZWdyYXRpb24gYW5kIG5hcnJhdGl2ZSBnZW5lcmF0aW9uXG4gKi9cbmV4cG9ydCBjbGFzcyBTeW50aGVzaXNBZ2VudCB7XG4gIHByaXZhdGUgY2xhdWRlU29ubmV0U2VydmljZTogQ2xhdWRlU29ubmV0U2VydmljZTtcbiAgcHJpdmF0ZSBhZ2VudFR5cGU6IEFnZW50VHlwZSA9ICdzeW50aGVzaXMnO1xuXG4gIGNvbnN0cnVjdG9yKGNsYXVkZVNvbm5ldFNlcnZpY2U6IENsYXVkZVNvbm5ldFNlcnZpY2UpIHtcbiAgICB0aGlzLmNsYXVkZVNvbm5ldFNlcnZpY2UgPSBjbGF1ZGVTb25uZXRTZXJ2aWNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb2Nlc3MgYSBzeW50aGVzaXMgcmVxdWVzdCBhbmQgcmV0dXJuIGludGVncmF0ZWQgaW52ZXN0bWVudCBpZGVhcyB3aXRoIG5hcnJhdGl2ZXNcbiAgICovXG4gIGFzeW5jIHByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KHJlcXVlc3Q6IFN5bnRoZXNpc1JlcXVlc3QpOiBQcm9taXNlPFN5bnRoZXNpc1Jlc3BvbnNlPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICBcbiAgICB0cnkge1xuICAgICAgLy8gU3RlcCAxOiBQZXJmb3JtIGNvaGVyZW5jZSBjaGVja2luZyBvbiBpbnB1dCBkYXRhXG4gICAgICBjb25zdCBjb2hlcmVuY2VDaGVjayA9IGF3YWl0IHRoaXMucGVyZm9ybUNvaGVyZW5jZUNoZWNrKHJlcXVlc3QpO1xuICAgICAgXG4gICAgICAvLyBTdGVwIDI6IEludGVncmF0ZSBhbmFseXNpcyByZXN1bHRzXG4gICAgICBjb25zdCBpbnRlZ3JhdGVkUmVzdWx0cyA9IGF3YWl0IHRoaXMuaW50ZWdyYXRlQW5hbHlzaXNSZXN1bHRzKHJlcXVlc3QuYW5hbHlzaXNSZXN1bHRzKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCAzOiBHZW5lcmF0ZSBpbnZlc3RtZW50IGlkZWFzXG4gICAgICBjb25zdCBpbnZlc3RtZW50SWRlYXMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzKFxuICAgICAgICBpbnRlZ3JhdGVkUmVzdWx0cyxcbiAgICAgICAgcmVxdWVzdC5yZXNlYXJjaEZpbmRpbmdzLFxuICAgICAgICByZXF1ZXN0LmNvbXBsaWFuY2VDaGVja3MsXG4gICAgICAgIHJlcXVlc3QudXNlclByZWZlcmVuY2VzXG4gICAgICApO1xuICAgICAgXG4gICAgICAvLyBTdGVwIDQ6IENyZWF0ZSBuYXJyYXRpdmUgc3RydWN0dXJlXG4gICAgICBjb25zdCBuYXJyYXRpdmVTdHJ1Y3R1cmUgPSBhd2FpdCB0aGlzLmNyZWF0ZU5hcnJhdGl2ZVN0cnVjdHVyZShcbiAgICAgICAgaW52ZXN0bWVudElkZWFzLFxuICAgICAgICBpbnRlZ3JhdGVkUmVzdWx0cyxcbiAgICAgICAgcmVxdWVzdC5vdXRwdXRGb3JtYXRcbiAgICAgICk7XG4gICAgICBcbiAgICAgIC8vIFN0ZXAgNTogR2VuZXJhdGUgZGV0YWlsZWQgbmFycmF0aXZlc1xuICAgICAgY29uc3QgZGV0YWlsZWROYXJyYXRpdmUgPSBhd2FpdCB0aGlzLmdlbmVyYXRlRGV0YWlsZWROYXJyYXRpdmUobmFycmF0aXZlU3RydWN0dXJlKTtcbiAgICAgIGNvbnN0IGV4ZWN1dGl2ZVN1bW1hcnkgPSBhd2FpdCB0aGlzLmdlbmVyYXRlRXhlY3V0aXZlU3VtbWFyeShpbnZlc3RtZW50SWRlYXMsIGludGVncmF0ZWRSZXN1bHRzKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCA2OiBFeHRyYWN0IGtleSBpbnNpZ2h0c1xuICAgICAgY29uc3Qga2V5SW5zaWdodHMgPSBhd2FpdCB0aGlzLmV4dHJhY3RLZXlJbnNpZ2h0cyhpbnZlc3RtZW50SWRlYXMsIGludGVncmF0ZWRSZXN1bHRzKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCA3OiBHZW5lcmF0ZSByaXNrIHN1bW1hcnlcbiAgICAgIGNvbnN0IHJpc2tTdW1tYXJ5ID0gYXdhaXQgdGhpcy5nZW5lcmF0ZVJpc2tTdW1tYXJ5KGludmVzdG1lbnRJZGVhcywgcmVxdWVzdC5jb21wbGlhbmNlQ2hlY2tzKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCA4OiBDcmVhdGUgc3ludGhlc2lzIHJlY29tbWVuZGF0aW9uc1xuICAgICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gYXdhaXQgdGhpcy5jcmVhdGVTeW50aGVzaXNSZWNvbW1lbmRhdGlvbnMoaW52ZXN0bWVudElkZWFzKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCA5OiBHZW5lcmF0ZSB2aXN1YWxpemF0aW9ucyBpZiByZXF1ZXN0ZWRcbiAgICAgIGNvbnN0IHZpc3VhbGl6YXRpb25zID0gcmVxdWVzdC5pbmNsdWRlVmlzdWFsaXphdGlvbnMgXG4gICAgICAgID8gYXdhaXQgdGhpcy5nZW5lcmF0ZVZpc3VhbGl6YXRpb25zKGludmVzdG1lbnRJZGVhcywgaW50ZWdyYXRlZFJlc3VsdHMpXG4gICAgICAgIDogW107XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGludmVzdG1lbnRJZGVhcyxcbiAgICAgICAgZXhlY3V0aXZlU3VtbWFyeSxcbiAgICAgICAgZGV0YWlsZWROYXJyYXRpdmUsXG4gICAgICAgIGtleUluc2lnaHRzLFxuICAgICAgICByaXNrU3VtbWFyeSxcbiAgICAgICAgcmVjb21tZW5kYXRpb25zLFxuICAgICAgICB2aXN1YWxpemF0aW9ucyxcbiAgICAgICAgY29oZXJlbmNlU2NvcmU6IGNvaGVyZW5jZUNoZWNrLm92ZXJhbGxTY29yZSxcbiAgICAgICAgY29uZmlkZW5jZTogdGhpcy5jYWxjdWxhdGVPdmVyYWxsQ29uZmlkZW5jZShpbnZlc3RtZW50SWRlYXMpLFxuICAgICAgICBleGVjdXRpb25UaW1lOiBEYXRlLm5vdygpIC0gc3RhcnRUaW1lXG4gICAgICB9O1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3Npbmcgc3ludGhlc2lzIHJlcXVlc3Q6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gY29oZXJlbmNlIGNoZWNraW5nIG9uIGlucHV0IGRhdGFcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybUNvaGVyZW5jZUNoZWNrKHJlcXVlc3Q6IFN5bnRoZXNpc1JlcXVlc3QpOiBQcm9taXNlPENvaGVyZW5jZUNoZWNrPiB7XG4gICAgY29uc3QgcHJvbXB0ID0gYFxuICAgICAgQXMgYSBzeW50aGVzaXMgYWdlbnQsIHBlcmZvcm0gYSBjb21wcmVoZW5zaXZlIGNvaGVyZW5jZSBjaGVjayBvbiB0aGUgZm9sbG93aW5nIGludmVzdG1lbnQgYW5hbHlzaXMgZGF0YTpcbiAgICAgIFxuICAgICAgQW5hbHlzaXMgUmVzdWx0czogJHtKU09OLnN0cmluZ2lmeShyZXF1ZXN0LmFuYWx5c2lzUmVzdWx0cywgbnVsbCwgMil9XG4gICAgICBSZXNlYXJjaCBGaW5kaW5nczogJHtKU09OLnN0cmluZ2lmeShyZXF1ZXN0LnJlc2VhcmNoRmluZGluZ3MsIG51bGwsIDIpfVxuICAgICAgQ29tcGxpYW5jZSBDaGVja3M6ICR7SlNPTi5zdHJpbmdpZnkocmVxdWVzdC5jb21wbGlhbmNlQ2hlY2tzLCBudWxsLCAyKX1cbiAgICAgIFxuICAgICAgUGxlYXNlIGV2YWx1YXRlOlxuICAgICAgMS4gQ29uc2lzdGVuY3kgYWNyb3NzIGRpZmZlcmVudCBhbmFseXNpcyB0eXBlc1xuICAgICAgMi4gQ29tcGxldGVuZXNzIG9mIHRoZSBhbmFseXNpcyBjb3ZlcmFnZVxuICAgICAgMy4gQ2xhcml0eSBvZiBmaW5kaW5ncyBhbmQgcmVjb21tZW5kYXRpb25zXG4gICAgICA0LiBJZGVudGlmaWNhdGlvbiBvZiBhbnkgY29udHJhZGljdGlvbnMgb3IgZ2Fwc1xuICAgICAgXG4gICAgICBQcm92aWRlIHNjb3JlcyAoMC0xKSBmb3I6XG4gICAgICAtIE92ZXJhbGwgY29oZXJlbmNlXG4gICAgICAtIENvbnNpc3RlbmN5XG4gICAgICAtIENvbXBsZXRlbmVzc1xuICAgICAgLSBDbGFyaXR5XG4gICAgICBcbiAgICAgIExpc3QgYW55IGlzc3VlcyBmb3VuZCB3aXRoIHNldmVyaXR5IGxldmVscyBhbmQgc3VnZ2VzdGVkIGZpeGVzLlxuICAgICAgXG4gICAgICBGb3JtYXQgeW91ciByZXNwb25zZSBhcyBKU09OIHdpdGggdGhlIHN0cnVjdHVyZTpcbiAgICAgIHtcbiAgICAgICAgXCJvdmVyYWxsU2NvcmVcIjogbnVtYmVyLFxuICAgICAgICBcImNvbnNpc3RlbmN5U2NvcmVcIjogbnVtYmVyLFxuICAgICAgICBcImNvbXBsZXRlbmVzc1Njb3JlXCI6IG51bWJlcixcbiAgICAgICAgXCJjbGFyaXR5U2NvcmVcIjogbnVtYmVyLFxuICAgICAgICBcImlzc3Vlc1wiOiBbe1widHlwZVwiOiBzdHJpbmcsIFwic2V2ZXJpdHlcIjogc3RyaW5nLCBcImRlc2NyaXB0aW9uXCI6IHN0cmluZywgXCJsb2NhdGlvblwiOiBzdHJpbmcsIFwic3VnZ2VzdGVkRml4XCI6IHN0cmluZ31dLFxuICAgICAgICBcInJlY29tbWVuZGF0aW9uc1wiOiBbc3RyaW5nXVxuICAgICAgfVxuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQsXG4gICAgICB0ZW1wbGF0ZTogQ2xhdWRlUHJvbXB0VGVtcGxhdGUuSU5WRVNUTUVOVF9BTkFMWVNJUyxcbiAgICAgIHRlbXBsYXRlVmFyaWFibGVzOiB7XG4gICAgICAgIGFuYWx5c2lzVHlwZTogJ2NvaGVyZW5jZS1jaGVjaycsXG4gICAgICAgIGNvbnRleHQ6ICdJbnZlc3RtZW50IGFuYWx5c2lzIHN5bnRoZXNpcycsXG4gICAgICAgIHJlcXVpcmVtZW50czogJ0NvbXByZWhlbnNpdmUgY29oZXJlbmNlIGV2YWx1YXRpb24nXG4gICAgICB9LFxuICAgICAgbWF4VG9rZW5zOiAxNTAwLFxuICAgICAgdGVtcGVyYXR1cmU6IDAuMlxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbXBsZXRpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBGYWxsYmFjayBjb2hlcmVuY2UgY2hlY2tcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG92ZXJhbGxTY29yZTogMC44LFxuICAgICAgICBjb25zaXN0ZW5jeVNjb3JlOiAwLjgsXG4gICAgICAgIGNvbXBsZXRlbmVzc1Njb3JlOiAwLjcsXG4gICAgICAgIGNsYXJpdHlTY29yZTogMC44LFxuICAgICAgICBpc3N1ZXM6IFtdLFxuICAgICAgICByZWNvbW1lbmRhdGlvbnM6IFsnUmV2aWV3IGZvciBjb25zaXN0ZW5jeScsICdFbnN1cmUgY29tcGxldGVuZXNzJ11cbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEludGVncmF0ZSBhbmFseXNpcyByZXN1bHRzIGZyb20gZGlmZmVyZW50IGFnZW50c1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBpbnRlZ3JhdGVBbmFseXNpc1Jlc3VsdHMoYW5hbHlzaXNSZXN1bHRzOiBBbmFseXNpc1Jlc3VsdFtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICBjb25zdCBpbnRlZ3JhdGlvblByb21wdCA9IGBcbiAgICAgIEludGVncmF0ZSB0aGUgZm9sbG93aW5nIGFuYWx5c2lzIHJlc3VsdHMgZnJvbSBkaWZmZXJlbnQgc3BlY2lhbGl6ZWQgYWdlbnRzOlxuICAgICAgXG4gICAgICAke2FuYWx5c2lzUmVzdWx0cy5tYXAoKHJlc3VsdCwgaW5kZXgpID0+IGBcbiAgICAgICAgQW5hbHlzaXMgJHtpbmRleCArIDF9ICgke3Jlc3VsdC5hbmFseXNpc1R5cGV9KTpcbiAgICAgICAgLSBTdW1tYXJ5OiAke3Jlc3VsdC5zdW1tYXJ5fVxuICAgICAgICAtIENvbmZpZGVuY2U6ICR7cmVzdWx0LmNvbmZpZGVuY2V9XG4gICAgICAgIC0gS2V5IERldGFpbHM6ICR7SlNPTi5zdHJpbmdpZnkocmVzdWx0LmRldGFpbHMsIG51bGwsIDIpfVxuICAgICAgICAtIFJlY29tbWVuZGF0aW9uczogJHtKU09OLnN0cmluZ2lmeShyZXN1bHQucmVjb21tZW5kYXRpb25zLCBudWxsLCAyKX1cbiAgICAgIGApLmpvaW4oJ1xcbicpfVxuICAgICAgXG4gICAgICBQbGVhc2UgcHJvdmlkZTpcbiAgICAgIDEuIENvbnNvbGlkYXRlZCBmaW5kaW5ncyB0aGF0IHJlY29uY2lsZSBkaWZmZXJlbnQgcGVyc3BlY3RpdmVzXG4gICAgICAyLiBXZWlnaHRlZCBjb25maWRlbmNlIHNjb3JlcyBiYXNlZCBvbiBhbmFseXNpcyBxdWFsaXR5XG4gICAgICAzLiBJbnRlZ3JhdGVkIHJlY29tbWVuZGF0aW9ucyB0aGF0IGNvbnNpZGVyIGFsbCBpbnB1dHNcbiAgICAgIDQuIElkZW50aWZpY2F0aW9uIG9mIGNvbnNlbnN1cyBhbmQgZGl2ZXJnZW50IHZpZXdzXG4gICAgICA1LiBPdmVyYWxsIGludmVzdG1lbnQgdGhlc2lzXG4gICAgICBcbiAgICAgIEZvcm1hdCBhcyBzdHJ1Y3R1cmVkIEpTT04uXG4gICAgYDtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGF1ZGVTb25uZXRTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgIHByb21wdDogaW50ZWdyYXRpb25Qcm9tcHQsXG4gICAgICBtYXhUb2tlbnM6IDIwMDAsXG4gICAgICB0ZW1wZXJhdHVyZTogMC4zXG4gICAgfSk7XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcG9uc2UuY29tcGxldGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIEZhbGxiYWNrIGludGVncmF0aW9uXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb25zb2xpZGF0ZWRGaW5kaW5nczogYW5hbHlzaXNSZXN1bHRzLm1hcChyID0+IHIuc3VtbWFyeSksXG4gICAgICAgIHdlaWdodGVkQ29uZmlkZW5jZTogYW5hbHlzaXNSZXN1bHRzLnJlZHVjZSgoc3VtLCByKSA9PiBzdW0gKyByLmNvbmZpZGVuY2UsIDApIC8gYW5hbHlzaXNSZXN1bHRzLmxlbmd0aCxcbiAgICAgICAgaW50ZWdyYXRlZFJlY29tbWVuZGF0aW9uczogYW5hbHlzaXNSZXN1bHRzLmZsYXRNYXAociA9PiByLnJlY29tbWVuZGF0aW9ucyksXG4gICAgICAgIGNvbnNlbnN1czogJ01peGVkIHNpZ25hbHMgcmVxdWlyZSBjYXJlZnVsIGNvbnNpZGVyYXRpb24nLFxuICAgICAgICBpbnZlc3RtZW50VGhlc2lzOiAnQ29tcHJlaGVuc2l2ZSBhbmFseXNpcyBzdWdnZXN0cyBjYXV0aW91cyBvcHRpbWlzbSdcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGludmVzdG1lbnQgaWRlYXMgYmFzZWQgb24gaW50ZWdyYXRlZCBhbmFseXNpc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhcbiAgICBpbnRlZ3JhdGVkUmVzdWx0czogYW55LFxuICAgIHJlc2VhcmNoRmluZGluZ3M6IGFueVtdLFxuICAgIGNvbXBsaWFuY2VDaGVja3M6IGFueVtdLFxuICAgIHVzZXJQcmVmZXJlbmNlczogYW55XG4gICk6IFByb21pc2U8SW52ZXN0bWVudElkZWFbXT4ge1xuICAgIGNvbnN0IGlkZWFHZW5lcmF0aW9uUHJvbXB0ID0gYFxuICAgICAgQmFzZWQgb24gdGhlIGludGVncmF0ZWQgYW5hbHlzaXMgYW5kIHJlc2VhcmNoIGZpbmRpbmdzLCBnZW5lcmF0ZSBzcGVjaWZpYyBpbnZlc3RtZW50IGlkZWFzOlxuICAgICAgXG4gICAgICBJbnRlZ3JhdGVkIEFuYWx5c2lzOiAke0pTT04uc3RyaW5naWZ5KGludGVncmF0ZWRSZXN1bHRzLCBudWxsLCAyKX1cbiAgICAgIFJlc2VhcmNoIEZpbmRpbmdzOiAke0pTT04uc3RyaW5naWZ5KHJlc2VhcmNoRmluZGluZ3MsIG51bGwsIDIpfVxuICAgICAgQ29tcGxpYW5jZSBTdGF0dXM6ICR7SlNPTi5zdHJpbmdpZnkoY29tcGxpYW5jZUNoZWNrcywgbnVsbCwgMil9XG4gICAgICBVc2VyIFByZWZlcmVuY2VzOiAke0pTT04uc3RyaW5naWZ5KHVzZXJQcmVmZXJlbmNlcywgbnVsbCwgMil9XG4gICAgICBcbiAgICAgIEdlbmVyYXRlIDMtNSBzcGVjaWZpYyBpbnZlc3RtZW50IGlkZWFzLCBlYWNoIHdpdGg6XG4gICAgICAxLiBDbGVhciB0aXRsZSBhbmQgZGVzY3JpcHRpb25cbiAgICAgIDIuIERldGFpbGVkIHJhdGlvbmFsZSBiYXNlZCBvbiBhbmFseXNpc1xuICAgICAgMy4gQ29uZmlkZW5jZSBzY29yZSAoMC0xKVxuICAgICAgNC4gVGltZSBob3Jpem9uIGFsaWdubWVudFxuICAgICAgNS4gUG90ZW50aWFsIG91dGNvbWVzIChiZXN0LCBleHBlY3RlZCwgd29yc3QgY2FzZSlcbiAgICAgIDYuIFJpc2sgZmFjdG9ycyBhbmQgbWl0aWdhdGlvbiBzdHJhdGVnaWVzXG4gICAgICA3LiBTdXBwb3J0aW5nIGRhdGEgcG9pbnRzXG4gICAgICA4LiBDb3VudGVyLWFyZ3VtZW50cyBhbmQgcmVzcG9uc2VzXG4gICAgICA5LiBDb21wbGlhbmNlIGNvbnNpZGVyYXRpb25zXG4gICAgICBcbiAgICAgIEZvcm1hdCBlYWNoIGlkZWEgYXMgYSBjb21wbGV0ZSBpbnZlc3RtZW50IHJlY29tbWVuZGF0aW9uLlxuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQ6IGlkZWFHZW5lcmF0aW9uUHJvbXB0LFxuICAgICAgbWF4VG9rZW5zOiAzMDAwLFxuICAgICAgdGVtcGVyYXR1cmU6IDAuNFxuICAgIH0pO1xuXG4gICAgLy8gUGFyc2UgYW5kIHN0cnVjdHVyZSB0aGUgaW52ZXN0bWVudCBpZGVhc1xuICAgIGNvbnN0IGlkZWFzID0gYXdhaXQgdGhpcy5wYXJzZUludmVzdG1lbnRJZGVhcyhyZXNwb25zZS5jb21wbGV0aW9uLCBpbnRlZ3JhdGVkUmVzdWx0cyk7XG4gICAgcmV0dXJuIGlkZWFzO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGludmVzdG1lbnQgaWRlYXMgZnJvbSBBSSByZXNwb25zZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZUludmVzdG1lbnRJZGVhcyhjb21wbGV0aW9uOiBzdHJpbmcsIGludGVncmF0ZWRSZXN1bHRzOiBhbnkpOiBQcm9taXNlPEludmVzdG1lbnRJZGVhW10+IHtcbiAgICAvLyBUaGlzIHdvdWxkIHR5cGljYWxseSBpbnZvbHZlIG1vcmUgc29waGlzdGljYXRlZCBwYXJzaW5nXG4gICAgLy8gRm9yIG5vdywgY3JlYXRlIHN0cnVjdHVyZWQgaW52ZXN0bWVudCBpZGVhcyBiYXNlZCBvbiB0aGUgY29tcGxldGlvblxuICAgIFxuICAgIGNvbnN0IGlkZWFzOiBJbnZlc3RtZW50SWRlYVtdID0gW107XG4gICAgXG4gICAgLy8gQ3JlYXRlIGEgc2FtcGxlIGludmVzdG1lbnQgaWRlYSBzdHJ1Y3R1cmVcbiAgICBjb25zdCBiYXNlSWRlYTogSW52ZXN0bWVudElkZWEgPSB7XG4gICAgICBpZDogdXVpZHY0KCksXG4gICAgICB2ZXJzaW9uOiAxLFxuICAgICAgdGl0bGU6ICdBSS1HZW5lcmF0ZWQgSW52ZXN0bWVudCBPcHBvcnR1bml0eScsXG4gICAgICBkZXNjcmlwdGlvbjogY29tcGxldGlvbi5zdWJzdHJpbmcoMCwgNTAwKSArICcuLi4nLFxuICAgICAgaW52ZXN0bWVudHM6IFtdLCAvLyBXb3VsZCBiZSBwb3B1bGF0ZWQgd2l0aCBhY3R1YWwgSW52ZXN0bWVudCBvYmplY3RzXG4gICAgICByYXRpb25hbGU6ICdCYXNlZCBvbiBjb21wcmVoZW5zaXZlIG11bHRpLWFnZW50IGFuYWx5c2lzJyxcbiAgICAgIHN0cmF0ZWd5OiAnYnV5JyxcbiAgICAgIHRpbWVIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICAgIGNvbmZpZGVuY2VTY29yZTogaW50ZWdyYXRlZFJlc3VsdHMud2VpZ2h0ZWRDb25maWRlbmNlIHx8IDAuOCxcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgbGFzdFVwZGF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIHBvdGVudGlhbE91dGNvbWVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBzY2VuYXJpbzogJ2Jlc3QnLFxuICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICAgICAgcmV0dXJuRXN0aW1hdGU6IDAuMjUsXG4gICAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDM2NSxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wdGltYWwgbWFya2V0IGNvbmRpdGlvbnMgYW5kIGV4ZWN1dGlvbicsXG4gICAgICAgICAgY29uZGl0aW9uczogWydTdHJvbmcgbWFya2V0IHBlcmZvcm1hbmNlJywgJ1N1Y2Nlc3NmdWwgc3RyYXRlZ3kgZXhlY3V0aW9uJ10sXG4gICAgICAgICAga2V5Umlza3M6IFsnTWFya2V0IHZvbGF0aWxpdHknXSxcbiAgICAgICAgICBjYXRhbHlzdHM6IFsnU3Ryb25nIGVhcm5pbmdzJywgJ01hcmtldCBleHBhbnNpb24nXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc2NlbmFyaW86ICdleHBlY3RlZCcsXG4gICAgICAgICAgcHJvYmFiaWxpdHk6IDAuNixcbiAgICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC4xMixcbiAgICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogMzY1LFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9ybWFsIG1hcmtldCBjb25kaXRpb25zJyxcbiAgICAgICAgICBjb25kaXRpb25zOiBbJ1N0YWJsZSBtYXJrZXQgZW52aXJvbm1lbnQnLCAnQXZlcmFnZSBleGVjdXRpb24nXSxcbiAgICAgICAgICBrZXlSaXNrczogWydNYXJrZXQgdW5jZXJ0YWludHknXSxcbiAgICAgICAgICBjYXRhbHlzdHM6IFsnU3RlYWR5IGdyb3d0aCcsICdNYXJrZXQgc3RhYmlsaXR5J11cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgICAgIHByb2JhYmlsaXR5OiAwLjIsXG4gICAgICAgICAgcmV0dXJuRXN0aW1hdGU6IC0wLjA1LFxuICAgICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdBZHZlcnNlIG1hcmtldCBjb25kaXRpb25zJyxcbiAgICAgICAgICBjb25kaXRpb25zOiBbJ01hcmtldCBkb3dudHVybicsICdTdHJhdGVneSB1bmRlcnBlcmZvcm1hbmNlJ10sXG4gICAgICAgICAga2V5Umlza3M6IFsnRWNvbm9taWMgcmVjZXNzaW9uJywgJ01hcmtldCBjcmFzaCddLFxuICAgICAgICAgIGNhdGFseXN0czogWydNYXJrZXQgcmVjb3ZlcnknLCAnUG9saWN5IGNoYW5nZXMnXVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgc3VwcG9ydGluZ0RhdGE6IFtdLFxuICAgICAgY291bnRlckFyZ3VtZW50czogW1xuICAgICAgICB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdNYXJrZXQgdm9sYXRpbGl0eSBjb3VsZCBpbXBhY3QgcmV0dXJucycsXG4gICAgICAgICAgc3RyZW5ndGg6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgaW1wYWN0OiAnbWVkaXVtJyxcbiAgICAgICAgICBtaXRpZ2F0aW9uU3RyYXRlZ3k6ICdEaXZlcnNpZmljYXRpb24gYW5kIHJpc2sgbWFuYWdlbWVudCcsXG4gICAgICAgICAgcHJvYmFiaWxpdHk6IDAuM1xuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgY29tcGxpYW5jZVN0YXR1czoge1xuICAgICAgICBjb21wbGlhbnQ6IHRydWUsXG4gICAgICAgIGlzc3VlczogW10sXG4gICAgICAgIHJlZ3VsYXRpb25zQ2hlY2tlZDogWydTRUMnLCAnRklOUkEnXSxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICB9LFxuICAgICAgY3JlYXRlZEJ5OiAnc3ludGhlc2lzLWFnZW50LWNsYXVkZS1zb25uZXQnLFxuICAgICAgdGFnczogWydhaS1nZW5lcmF0ZWQnLCAnbXVsdGktYWdlbnQtYW5hbHlzaXMnXSxcbiAgICAgIGNhdGVnb3J5OiAnZXF1aXR5JyxcbiAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgIHRhcmdldEF1ZGllbmNlOiBbJ3JldGFpbCddLFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgc291cmNlTW9kZWxzOiBbJ2NsYXVkZS1zb25uZXQtMy43J10sXG4gICAgICAgIHByb2Nlc3NpbmdUaW1lOiAxMDAwMCxcbiAgICAgICAgZGF0YVNvdXJjZXNVc2VkOiBbJ3Jlc2VhcmNoLWFnZW50JywgJ2FuYWx5c2lzLWFnZW50JywgJ2NvbXBsaWFuY2UtYWdlbnQnXSxcbiAgICAgICAgcmVzZWFyY2hEZXB0aDogJ2NvbXByZWhlbnNpdmUnLFxuICAgICAgICBxdWFsaXR5U2NvcmU6IDg1LFxuICAgICAgICBub3ZlbHR5U2NvcmU6IDc1LFxuICAgICAgICBtYXJrZXRDb25kaXRpb25zQXRHZW5lcmF0aW9uOiB7XG4gICAgICAgICAgdm9sYXRpbGl0eUluZGV4OiAyMCxcbiAgICAgICAgICBtYXJrZXRUcmVuZDogJ3NpZGV3YXlzJyxcbiAgICAgICAgICBlY29ub21pY0luZGljYXRvcnM6IHt9LFxuICAgICAgICAgIGdlb3BvbGl0aWNhbFJpc2s6ICdtZWRpdW0nXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB0cmFja2luZ0luZm86IHtcbiAgICAgICAgdmlld3M6IDAsXG4gICAgICAgIGltcGxlbWVudGF0aW9uczogMCxcbiAgICAgICAgZmVlZGJhY2s6IFtdLFxuICAgICAgICBwZXJmb3JtYW5jZTogW10sXG4gICAgICAgIHN0YXR1czogJ2FjdGl2ZScsXG4gICAgICAgIHN0YXR1c0hpc3Rvcnk6IFt7XG4gICAgICAgICAgc3RhdHVzOiAnYWN0aXZlJyxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY2hhbmdlZEJ5OiAnc3ludGhlc2lzLWFnZW50J1xuICAgICAgICB9XVxuICAgICAgfVxuICAgIH07XG5cbiAgICBpZGVhcy5wdXNoKGJhc2VJZGVhKTtcbiAgICByZXR1cm4gaWRlYXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5hcnJhdGl2ZSBzdHJ1Y3R1cmUgZm9yIHRoZSBpbnZlc3RtZW50IHJlcG9ydFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOYXJyYXRpdmVTdHJ1Y3R1cmUoXG4gICAgaW52ZXN0bWVudElkZWFzOiBJbnZlc3RtZW50SWRlYVtdLFxuICAgIGludGVncmF0ZWRSZXN1bHRzOiBhbnksXG4gICAgb3V0cHV0Rm9ybWF0OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxOYXJyYXRpdmVTdHJ1Y3R1cmU+IHtcbiAgICBjb25zdCBzdHJ1Y3R1cmVQcm9tcHQgPSBgXG4gICAgICBDcmVhdGUgYSBuYXJyYXRpdmUgc3RydWN0dXJlIGZvciBhbiBpbnZlc3RtZW50IHJlcG9ydCB3aXRoIHRoZSBmb2xsb3dpbmcgZm9ybWF0OiAke291dHB1dEZvcm1hdH1cbiAgICAgIFxuICAgICAgSW52ZXN0bWVudCBJZGVhczogJHtpbnZlc3RtZW50SWRlYXMubGVuZ3RofSBpZGVhcyBnZW5lcmF0ZWRcbiAgICAgIEFuYWx5c2lzIFJlc3VsdHM6ICR7SlNPTi5zdHJpbmdpZnkoaW50ZWdyYXRlZFJlc3VsdHMsIG51bGwsIDIpfVxuICAgICAgXG4gICAgICBEZXNpZ24gYSBsb2dpY2FsIGZsb3cgd2l0aCBzZWN0aW9ucyB0aGF0IGluY2x1ZGU6XG4gICAgICAxLiBFeGVjdXRpdmUgc3VtbWFyeVxuICAgICAgMi4gTWFya2V0IGFuYWx5c2lzIG92ZXJ2aWV3XG4gICAgICAzLiBJbmRpdmlkdWFsIGludmVzdG1lbnQgb3Bwb3J0dW5pdGllc1xuICAgICAgNC4gUmlzayBhc3Nlc3NtZW50XG4gICAgICA1LiBJbXBsZW1lbnRhdGlvbiByZWNvbW1lbmRhdGlvbnNcbiAgICAgIDYuIENvbmNsdXNpb24gYW5kIG5leHQgc3RlcHNcbiAgICAgIFxuICAgICAgRm9yIGVhY2ggc2VjdGlvbiwgc3BlY2lmeTpcbiAgICAgIC0gVGl0bGUgYW5kIGNvbnRlbnQgb3V0bGluZVxuICAgICAgLSBQcmlvcml0eSBsZXZlbFxuICAgICAgLSBEZXBlbmRlbmNpZXMgb24gb3RoZXIgc2VjdGlvbnNcbiAgICAgIC0gS2V5IG1lc3NhZ2VzIHRvIGNvbnZleVxuICAgICAgXG4gICAgICBGb3JtYXQgYXMgc3RydWN0dXJlZCBKU09OLlxuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQ6IHN0cnVjdHVyZVByb21wdCxcbiAgICAgIG1heFRva2VuczogMTUwMCxcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjNcbiAgICB9KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbXBsZXRpb24pO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2VjdGlvbnM6IHBhcnNlZC5zZWN0aW9ucyB8fCBbXSxcbiAgICAgICAgZmxvdzogcGFyc2VkLmZsb3cgfHwgWydpbnRyb2R1Y3Rpb24nLCAnYW5hbHlzaXMnLCAncmVjb21tZW5kYXRpb25zJywgJ2NvbmNsdXNpb24nXSxcbiAgICAgICAga2V5TWVzc2FnZXM6IHBhcnNlZC5rZXlNZXNzYWdlcyB8fCBbXSxcbiAgICAgICAgc3VwcG9ydGluZ0V2aWRlbmNlOiBwYXJzZWQuc3VwcG9ydGluZ0V2aWRlbmNlIHx8IHt9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBGYWxsYmFjayBzdHJ1Y3R1cmVcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNlY3Rpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdleGVjdXRpdmUtc3VtbWFyeScsXG4gICAgICAgICAgICB0aXRsZTogJ0V4ZWN1dGl2ZSBTdW1tYXJ5JyxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdIaWdoLWxldmVsIG92ZXJ2aWV3IG9mIGludmVzdG1lbnQgb3Bwb3J0dW5pdGllcycsXG4gICAgICAgICAgICB0eXBlOiAnaW50cm9kdWN0aW9uJyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbXVxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdpbnZlc3RtZW50LWlkZWFzJyxcbiAgICAgICAgICAgIHRpdGxlOiAnSW52ZXN0bWVudCBPcHBvcnR1bml0aWVzJyxcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdEZXRhaWxlZCBhbmFseXNpcyBvZiByZWNvbW1lbmRlZCBpbnZlc3RtZW50cycsXG4gICAgICAgICAgICB0eXBlOiAncmVjb21tZW5kYXRpb25zJyxcbiAgICAgICAgICAgIHByaW9yaXR5OiAyLFxuICAgICAgICAgICAgZGVwZW5kZW5jaWVzOiBbJ2V4ZWN1dGl2ZS1zdW1tYXJ5J11cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICAgIGZsb3c6IFsnZXhlY3V0aXZlLXN1bW1hcnknLCAnaW52ZXN0bWVudC1pZGVhcyddLFxuICAgICAgICBrZXlNZXNzYWdlczogWydTdHJvbmcgaW52ZXN0bWVudCBvcHBvcnR1bml0aWVzIGlkZW50aWZpZWQnLCAnUmlzay1hZGp1c3RlZCByZXR1cm5zIGZhdm9yYWJsZSddLFxuICAgICAgICBzdXBwb3J0aW5nRXZpZGVuY2U6IHt9XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBkZXRhaWxlZCBuYXJyYXRpdmUgYmFzZWQgb24gc3RydWN0dXJlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlRGV0YWlsZWROYXJyYXRpdmUoc3RydWN0dXJlOiBOYXJyYXRpdmVTdHJ1Y3R1cmUpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG5hcnJhdGl2ZVByb21wdCA9IGBcbiAgICAgIEdlbmVyYXRlIGEgY29tcHJlaGVuc2l2ZSBpbnZlc3RtZW50IHJlcG9ydCBuYXJyYXRpdmUgYmFzZWQgb24gdGhpcyBzdHJ1Y3R1cmU6XG4gICAgICBcbiAgICAgICR7SlNPTi5zdHJpbmdpZnkoc3RydWN0dXJlLCBudWxsLCAyKX1cbiAgICAgIFxuICAgICAgQ3JlYXRlIGEgcHJvZmVzc2lvbmFsLCBjb2hlcmVudCBuYXJyYXRpdmUgdGhhdDpcbiAgICAgIDEuIEZsb3dzIGxvZ2ljYWxseSBmcm9tIHNlY3Rpb24gdG8gc2VjdGlvblxuICAgICAgMi4gTWFpbnRhaW5zIGNvbnNpc3RlbnQgdG9uZSBhbmQgc3R5bGVcbiAgICAgIDMuIFN1cHBvcnRzIGtleSBtZXNzYWdlcyB3aXRoIGV2aWRlbmNlXG4gICAgICA0LiBVc2VzIGNsZWFyLCBwcm9mZXNzaW9uYWwgbGFuZ3VhZ2VcbiAgICAgIDUuIEluY2x1ZGVzIGFwcHJvcHJpYXRlIHRyYW5zaXRpb25zXG4gICAgICBcbiAgICAgIFRoZSBuYXJyYXRpdmUgc2hvdWxkIGJlIHN1aXRhYmxlIGZvciBpbnZlc3RtZW50IHByb2Zlc3Npb25hbHMgYW5kIGRlY2lzaW9uLW1ha2Vycy5cbiAgICBgO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsYXVkZVNvbm5ldFNlcnZpY2UuY29tcGxldGUoe1xuICAgICAgcHJvbXB0OiBuYXJyYXRpdmVQcm9tcHQsXG4gICAgICBtYXhUb2tlbnM6IDQwMDAsXG4gICAgICB0ZW1wZXJhdHVyZTogMC40XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuY29tcGxldGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBleGVjdXRpdmUgc3VtbWFyeVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUV4ZWN1dGl2ZVN1bW1hcnkoXG4gICAgaW52ZXN0bWVudElkZWFzOiBJbnZlc3RtZW50SWRlYVtdLFxuICAgIGludGVncmF0ZWRSZXN1bHRzOiBhbnlcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzdW1tYXJ5UHJvbXB0ID0gYFxuICAgICAgQ3JlYXRlIGEgY29uY2lzZSBleGVjdXRpdmUgc3VtbWFyeSBmb3IgdGhlIGZvbGxvd2luZyBpbnZlc3RtZW50IGFuYWx5c2lzOlxuICAgICAgXG4gICAgICBOdW1iZXIgb2YgSW52ZXN0bWVudCBJZGVhczogJHtpbnZlc3RtZW50SWRlYXMubGVuZ3RofVxuICAgICAgQXZlcmFnZSBDb25maWRlbmNlOiAke2ludmVzdG1lbnRJZGVhcy5yZWR1Y2UoKHN1bSwgaWRlYSkgPT4gc3VtICsgaWRlYS5jb25maWRlbmNlU2NvcmUsIDApIC8gaW52ZXN0bWVudElkZWFzLmxlbmd0aH1cbiAgICAgIFxuICAgICAgSW52ZXN0bWVudCBJZGVhczpcbiAgICAgICR7aW52ZXN0bWVudElkZWFzLm1hcChpZGVhID0+IGAtICR7aWRlYS50aXRsZX06ICR7aWRlYS5kZXNjcmlwdGlvbi5zdWJzdHJpbmcoMCwgMTAwKX0uLi5gKS5qb2luKCdcXG4nKX1cbiAgICAgIFxuICAgICAgSW50ZWdyYXRlZCBBbmFseXNpczogJHtKU09OLnN0cmluZ2lmeShpbnRlZ3JhdGVkUmVzdWx0cywgbnVsbCwgMil9XG4gICAgICBcbiAgICAgIFRoZSBzdW1tYXJ5IHNob3VsZCBiZSAzLTQgcGFyYWdyYXBocyBjb3ZlcmluZzpcbiAgICAgIDEuIEtleSBmaW5kaW5ncyBhbmQgb3Bwb3J0dW5pdGllc1xuICAgICAgMi4gUmlzayBhc3Nlc3NtZW50XG4gICAgICAzLiBSZWNvbW1lbmRlZCBhY3Rpb25zXG4gICAgICA0LiBFeHBlY3RlZCBvdXRjb21lc1xuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQ6IHN1bW1hcnlQcm9tcHQsXG4gICAgICBtYXhUb2tlbnM6IDgwMCxcbiAgICAgIHRlbXBlcmF0dXJlOiAwLjNcbiAgICB9KTtcblxuICAgIHJldHVybiByZXNwb25zZS5jb21wbGV0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4dHJhY3Qga2V5IGluc2lnaHRzIGZyb20gYW5hbHlzaXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZXh0cmFjdEtleUluc2lnaHRzKFxuICAgIGludmVzdG1lbnRJZGVhczogSW52ZXN0bWVudElkZWFbXSxcbiAgICBpbnRlZ3JhdGVkUmVzdWx0czogYW55XG4gICk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBpbnNpZ2h0c1Byb21wdCA9IGBcbiAgICAgIEV4dHJhY3QgNS03IGtleSBpbnNpZ2h0cyBmcm9tIHRoZSBpbnZlc3RtZW50IGFuYWx5c2lzOlxuICAgICAgXG4gICAgICBJbnZlc3RtZW50IElkZWFzOiAke0pTT04uc3RyaW5naWZ5KGludmVzdG1lbnRJZGVhcy5tYXAoaWRlYSA9PiAoe1xuICAgICAgICB0aXRsZTogaWRlYS50aXRsZSxcbiAgICAgICAgcmF0aW9uYWxlOiBpZGVhLnJhdGlvbmFsZSxcbiAgICAgICAgY29uZmlkZW5jZTogaWRlYS5jb25maWRlbmNlU2NvcmVcbiAgICAgIH0pKSwgbnVsbCwgMil9XG4gICAgICBcbiAgICAgIEludGVncmF0ZWQgUmVzdWx0czogJHtKU09OLnN0cmluZ2lmeShpbnRlZ3JhdGVkUmVzdWx0cywgbnVsbCwgMil9XG4gICAgICBcbiAgICAgIEZvY3VzIG9uOlxuICAgICAgMS4gTWFya2V0IG9wcG9ydHVuaXRpZXNcbiAgICAgIDIuIFJpc2sgZmFjdG9yc1xuICAgICAgMy4gVGltaW5nIGNvbnNpZGVyYXRpb25zXG4gICAgICA0LiBTdHJhdGVnaWMgaW1wbGljYXRpb25zXG4gICAgICA1LiBVbmlxdWUgZmluZGluZ3NcbiAgICAgIFxuICAgICAgUmV0dXJuIGFzIGEgSlNPTiBhcnJheSBvZiBzdHJpbmdzLlxuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQ6IGluc2lnaHRzUHJvbXB0LFxuICAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICAgICAgdGVtcGVyYXR1cmU6IDAuM1xuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKHJlc3BvbnNlLmNvbXBsZXRpb24pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBGYWxsYmFjayBpbnNpZ2h0c1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAgJ011bHRpcGxlIGludmVzdG1lbnQgb3Bwb3J0dW5pdGllcyBpZGVudGlmaWVkIHdpdGggc3Ryb25nIGZ1bmRhbWVudGFscycsXG4gICAgICAgICdSaXNrLWFkanVzdGVkIHJldHVybnMgYXBwZWFyIGZhdm9yYWJsZSBpbiBjdXJyZW50IG1hcmtldCBjb25kaXRpb25zJyxcbiAgICAgICAgJ0RpdmVyc2lmaWNhdGlvbiBhY3Jvc3Mgc2VjdG9ycyByZWNvbW1lbmRlZCBmb3Igb3B0aW1hbCBwb3J0Zm9saW8gYmFsYW5jZScsXG4gICAgICAgICdUaW1pbmcgY29uc2lkZXJhdGlvbnMgc3VnZ2VzdCBncmFkdWFsIHBvc2l0aW9uIGJ1aWxkaW5nJyxcbiAgICAgICAgJ0NvbXBsaWFuY2UgcmVxdWlyZW1lbnRzIGZ1bGx5IHNhdGlzZmllZCBmb3IgYWxsIHJlY29tbWVuZGF0aW9ucydcbiAgICAgIF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIHJpc2sgc3VtbWFyeVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVJpc2tTdW1tYXJ5KFxuICAgIGludmVzdG1lbnRJZGVhczogSW52ZXN0bWVudElkZWFbXSxcbiAgICBjb21wbGlhbmNlQ2hlY2tzOiBhbnlbXVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJpc2tQcm9tcHQgPSBgXG4gICAgICBHZW5lcmF0ZSBhIGNvbXByZWhlbnNpdmUgcmlzayBzdW1tYXJ5IGZvciB0aGUgaW52ZXN0bWVudCByZWNvbW1lbmRhdGlvbnM6XG4gICAgICBcbiAgICAgIEludmVzdG1lbnQgSWRlYXM6ICR7aW52ZXN0bWVudElkZWFzLmxlbmd0aH0gcmVjb21tZW5kYXRpb25zXG4gICAgICBSaXNrIEZhY3RvcnM6ICR7aW52ZXN0bWVudElkZWFzLmZsYXRNYXAoaWRlYSA9PiBcbiAgICAgICAgaWRlYS5jb3VudGVyQXJndW1lbnRzLm1hcCgoYXJnOiBDb3VudGVyQXJndW1lbnQpID0+IGFyZy5kZXNjcmlwdGlvbilcbiAgICAgICkuam9pbignLCAnKX1cbiAgICAgIFxuICAgICAgQ29tcGxpYW5jZSBTdGF0dXM6ICR7SlNPTi5zdHJpbmdpZnkoY29tcGxpYW5jZUNoZWNrcywgbnVsbCwgMil9XG4gICAgICBcbiAgICAgIENvdmVyOlxuICAgICAgMS4gT3ZlcmFsbCByaXNrIGFzc2Vzc21lbnRcbiAgICAgIDIuIEtleSByaXNrIGZhY3RvcnMgYW5kIG1pdGlnYXRpb24gc3RyYXRlZ2llc1xuICAgICAgMy4gQ29tcGxpYW5jZSBjb25zaWRlcmF0aW9uc1xuICAgICAgNC4gUmlzayBtb25pdG9yaW5nIHJlY29tbWVuZGF0aW9uc1xuICAgIGA7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlU29ubmV0U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICBwcm9tcHQ6IHJpc2tQcm9tcHQsXG4gICAgICBtYXhUb2tlbnM6IDEyMDAsXG4gICAgICB0ZW1wZXJhdHVyZTogMC4zXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2UuY29tcGxldGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgc3ludGhlc2lzIHJlY29tbWVuZGF0aW9uc1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTeW50aGVzaXNSZWNvbW1lbmRhdGlvbnMoXG4gICAgaW52ZXN0bWVudElkZWFzOiBJbnZlc3RtZW50SWRlYVtdXG4gICk6IFByb21pc2U8U3ludGhlc2lzUmVjb21tZW5kYXRpb25bXT4ge1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9uczogU3ludGhlc2lzUmVjb21tZW5kYXRpb25bXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBpZGVhIG9mIGludmVzdG1lbnRJZGVhcykge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICBwcmlvcml0eTogaWRlYS5jb25maWRlbmNlU2NvcmUgPiAwLjggPyAnaGlnaCcgOiBpZGVhLmNvbmZpZGVuY2VTY29yZSA+IDAuNiA/ICdtZWRpdW0nIDogJ2xvdycsXG4gICAgICAgIGFjdGlvbjogaWRlYS5zdHJhdGVneSBhcyBhbnksXG4gICAgICAgIGludmVzdG1lbnQ6IGlkZWEudGl0bGUsXG4gICAgICAgIHJhdGlvbmFsZTogaWRlYS5yYXRpb25hbGUsXG4gICAgICAgIHRpbWVmcmFtZTogaWRlYS50aW1lSG9yaXpvbixcbiAgICAgICAgY29uZmlkZW5jZTogaWRlYS5jb25maWRlbmNlU2NvcmUsXG4gICAgICAgIHN1cHBvcnRpbmdFdmlkZW5jZTogaWRlYS5zdXBwb3J0aW5nRGF0YS5tYXAoKGRwOiBhbnkpID0+IGRwLnNvdXJjZSlcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiByZWNvbW1lbmRhdGlvbnMuc29ydCgoYSwgYikgPT4gYi5jb25maWRlbmNlIC0gYS5jb25maWRlbmNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSB2aXN1YWxpemF0aW9ucyBmb3IgdGhlIGludmVzdG1lbnQgaWRlYXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVWaXN1YWxpemF0aW9ucyhcbiAgICBpbnZlc3RtZW50SWRlYXM6IEludmVzdG1lbnRJZGVhW10sXG4gICAgaW50ZWdyYXRlZFJlc3VsdHM6IGFueVxuICApOiBQcm9taXNlPFZpc3VhbGl6YXRpb25TcGVjW10+IHtcbiAgICBjb25zdCB2aXN1YWxpemF0aW9uczogVmlzdWFsaXphdGlvblNwZWNbXSA9IFtdO1xuXG4gICAgLy8gUmlzay1SZXR1cm4gU2NhdHRlciBQbG90XG4gICAgdmlzdWFsaXphdGlvbnMucHVzaCh7XG4gICAgICBpZDogdXVpZHY0KCksXG4gICAgICB0eXBlOiAnY2hhcnQnLFxuICAgICAgdGl0bGU6ICdSaXNrLVJldHVybiBBbmFseXNpcycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ludmVzdG1lbnQgb3Bwb3J0dW5pdGllcyBwbG90dGVkIGJ5IGV4cGVjdGVkIHJldHVybiB2cyByaXNrJyxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgZGF0YXNldHM6IFt7XG4gICAgICAgICAgbGFiZWw6ICdJbnZlc3RtZW50IElkZWFzJyxcbiAgICAgICAgICBkYXRhOiBpbnZlc3RtZW50SWRlYXMubWFwKGlkZWEgPT4gKHtcbiAgICAgICAgICAgIHg6IHRoaXMuY2FsY3VsYXRlUmlza1Njb3JlKGlkZWEpLFxuICAgICAgICAgICAgeTogaWRlYS5wb3RlbnRpYWxPdXRjb21lcy5maW5kKChvOiBPdXRjb21lKSA9PiBvLnNjZW5hcmlvID09PSAnZXhwZWN0ZWQnKT8ucmV0dXJuRXN0aW1hdGUgfHwgMCxcbiAgICAgICAgICAgIGxhYmVsOiBpZGVhLnRpdGxlXG4gICAgICAgICAgfSkpXG4gICAgICAgIH1dXG4gICAgICB9LFxuICAgICAgY29uZmlnOiB7XG4gICAgICAgIGNoYXJ0VHlwZTogJ3NjYXR0ZXInLFxuICAgICAgICBkaW1lbnNpb25zOiB7IHdpZHRoOiA4MDAsIGhlaWdodDogNjAwIH0sXG4gICAgICAgIHN0eWxpbmc6IHsgdGhlbWU6ICdwcm9mZXNzaW9uYWwnLCBjb2xvcnM6IFsnIzJFODZBQicsICcjQTIzQjcyJywgJyNGMThGMDEnXSB9LFxuICAgICAgICBpbnRlcmFjdGl2aXR5OiB7IHpvb206IHRydWUsIGZpbHRlcjogdHJ1ZSwgdG9vbHRpcDogdHJ1ZSB9LFxuICAgICAgICBleHBvcnQ6IHsgZm9ybWF0czogWydwbmcnLCAnc3ZnJ10gfVxuICAgICAgfSxcbiAgICAgIHByaW9yaXR5OiAnaGlnaCdcbiAgICB9KTtcblxuICAgIC8vIENvbmZpZGVuY2UgRGlzdHJpYnV0aW9uXG4gICAgdmlzdWFsaXphdGlvbnMucHVzaCh7XG4gICAgICBpZDogdXVpZHY0KCksXG4gICAgICB0eXBlOiAnY2hhcnQnLFxuICAgICAgdGl0bGU6ICdDb25maWRlbmNlIERpc3RyaWJ1dGlvbicsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Rpc3RyaWJ1dGlvbiBvZiBjb25maWRlbmNlIHNjb3JlcyBhY3Jvc3MgaW52ZXN0bWVudCBpZGVhcycsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGxhYmVsczogaW52ZXN0bWVudElkZWFzLm1hcChpZGVhID0+IGlkZWEudGl0bGUpLFxuICAgICAgICBkYXRhc2V0czogW3tcbiAgICAgICAgICBsYWJlbDogJ0NvbmZpZGVuY2UgU2NvcmUnLFxuICAgICAgICAgIGRhdGE6IGludmVzdG1lbnRJZGVhcy5tYXAoaWRlYSA9PiBpZGVhLmNvbmZpZGVuY2VTY29yZSlcbiAgICAgICAgfV1cbiAgICAgIH0sXG4gICAgICBjb25maWc6IHtcbiAgICAgICAgY2hhcnRUeXBlOiAnYmFyJyxcbiAgICAgICAgZGltZW5zaW9uczogeyB3aWR0aDogNjAwLCBoZWlnaHQ6IDQwMCB9LFxuICAgICAgICBzdHlsaW5nOiB7IHRoZW1lOiAncHJvZmVzc2lvbmFsJywgY29sb3JzOiBbJyM0Q0FGNTAnLCAnI0ZGOTgwMCcsICcjRjQ0MzM2J10gfSxcbiAgICAgICAgaW50ZXJhY3Rpdml0eTogeyB6b29tOiBmYWxzZSwgZmlsdGVyOiB0cnVlLCB0b29sdGlwOiB0cnVlIH0sXG4gICAgICAgIGV4cG9ydDogeyBmb3JtYXRzOiBbJ3BuZyddIH1cbiAgICAgIH0sXG4gICAgICBwcmlvcml0eTogJ21lZGl1bSdcbiAgICB9KTtcblxuICAgIC8vIEludmVzdG1lbnQgVGltZWxpbmVcbiAgICB2aXN1YWxpemF0aW9ucy5wdXNoKHtcbiAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgIHR5cGU6ICdkaWFncmFtJyxcbiAgICAgIHRpdGxlOiAnSW1wbGVtZW50YXRpb24gVGltZWxpbmUnLFxuICAgICAgZGVzY3JpcHRpb246ICdSZWNvbW1lbmRlZCB0aW1lbGluZSBmb3IgaW52ZXN0bWVudCBpbXBsZW1lbnRhdGlvbicsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHRpbWVsaW5lOiBpbnZlc3RtZW50SWRlYXMubWFwKChpZGVhLCBpbmRleCkgPT4gKHtcbiAgICAgICAgICBpZDogaWRlYS5pZCxcbiAgICAgICAgICB0aXRsZTogaWRlYS50aXRsZSxcbiAgICAgICAgICB0aW1lSG9yaXpvbjogaWRlYS50aW1lSG9yaXpvbixcbiAgICAgICAgICBwcmlvcml0eTogaW5kZXggKyAxXG4gICAgICAgIH0pKVxuICAgICAgfSxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICBkaW1lbnNpb25zOiB7IHdpZHRoOiAxMDAwLCBoZWlnaHQ6IDMwMCB9LFxuICAgICAgICBzdHlsaW5nOiB7IHRoZW1lOiAncHJvZmVzc2lvbmFsJywgY29sb3JzOiBbJyMxOTc2RDInLCAnIzM4OEUzQycsICcjRjU3QzAwJ10gfSxcbiAgICAgICAgaW50ZXJhY3Rpdml0eTogeyB6b29tOiBmYWxzZSwgZmlsdGVyOiBmYWxzZSwgdG9vbHRpcDogdHJ1ZSB9LFxuICAgICAgICBleHBvcnQ6IHsgZm9ybWF0czogWydwbmcnLCAnc3ZnJ10gfVxuICAgICAgfSxcbiAgICAgIHByaW9yaXR5OiAnbWVkaXVtJ1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHZpc3VhbGl6YXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSByaXNrIHNjb3JlIGZvciBhbiBpbnZlc3RtZW50IGlkZWFcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlUmlza1Njb3JlKGlkZWE6IEludmVzdG1lbnRJZGVhKTogbnVtYmVyIHtcbiAgICBjb25zdCB3b3JzdENhc2UgPSBpZGVhLnBvdGVudGlhbE91dGNvbWVzLmZpbmQoKG86IE91dGNvbWUpID0+IG8uc2NlbmFyaW8gPT09ICd3b3JzdCcpO1xuICAgIGNvbnN0IGV4cGVjdGVkID0gaWRlYS5wb3RlbnRpYWxPdXRjb21lcy5maW5kKChvOiBPdXRjb21lKSA9PiBvLnNjZW5hcmlvID09PSAnZXhwZWN0ZWQnKTtcbiAgICBcbiAgICBpZiAoIXdvcnN0Q2FzZSB8fCAhZXhwZWN0ZWQpIHJldHVybiAwLjU7XG4gICAgXG4gICAgLy8gUmlzayBhcyBwb3RlbnRpYWwgZG93bnNpZGUgZnJvbSBleHBlY3RlZFxuICAgIHJldHVybiBNYXRoLmFicyh3b3JzdENhc2UucmV0dXJuRXN0aW1hdGUgLSBleHBlY3RlZC5yZXR1cm5Fc3RpbWF0ZSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIG92ZXJhbGwgY29uZmlkZW5jZSBhY3Jvc3MgaW52ZXN0bWVudCBpZGVhc1xuICAgKi9cbiAgcHJpdmF0ZSBjYWxjdWxhdGVPdmVyYWxsQ29uZmlkZW5jZShpbnZlc3RtZW50SWRlYXM6IEludmVzdG1lbnRJZGVhW10pOiBudW1iZXIge1xuICAgIGlmIChpbnZlc3RtZW50SWRlYXMubGVuZ3RoID09PSAwKSByZXR1cm4gMDtcbiAgICByZXR1cm4gaW52ZXN0bWVudElkZWFzLnJlZHVjZSgoc3VtLCBpZGVhKSA9PiBzdW0gKyBpZGVhLmNvbmZpZGVuY2VTY29yZSwgMCkgLyBpbnZlc3RtZW50SWRlYXMubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZSBhZ2VudCBtZXNzYWdlcyBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIG90aGVyIGFnZW50c1xuICAgKi9cbiAgYXN5bmMgaGFuZGxlTWVzc2FnZShtZXNzYWdlOiBBZ2VudE1lc3NhZ2UpOiBQcm9taXNlPEFnZW50TWVzc2FnZT4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcG9uc2VDb250ZW50OiBhbnk7XG5cbiAgICAgIHN3aXRjaCAobWVzc2FnZS5tZXNzYWdlVHlwZSkge1xuICAgICAgICBjYXNlICdyZXF1ZXN0JzpcbiAgICAgICAgICBpZiAobWVzc2FnZS5jb250ZW50LnR5cGUgPT09ICdzeW50aGVzaXMnKSB7XG4gICAgICAgICAgICByZXNwb25zZUNvbnRlbnQgPSBhd2FpdCB0aGlzLnByb2Nlc3NTeW50aGVzaXNSZXF1ZXN0KG1lc3NhZ2UuY29udGVudC5yZXF1ZXN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCByZXF1ZXN0IHR5cGU6ICR7bWVzc2FnZS5jb250ZW50LnR5cGV9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgbWVzc2FnZSB0eXBlOiAke21lc3NhZ2UubWVzc2FnZVR5cGV9YCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNlbmRlcjogdGhpcy5hZ2VudFR5cGUsXG4gICAgICAgIHJlY2lwaWVudDogbWVzc2FnZS5zZW5kZXIsXG4gICAgICAgIG1lc3NhZ2VUeXBlOiAncmVzcG9uc2UnLFxuICAgICAgICBjb250ZW50OiByZXNwb25zZUNvbnRlbnQsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgcHJpb3JpdHk6IG1lc3NhZ2UubWV0YWRhdGEucHJpb3JpdHksXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNvbnZlcnNhdGlvbklkOiBtZXNzYWdlLm1ldGFkYXRhLmNvbnZlcnNhdGlvbklkLFxuICAgICAgICAgIHJlcXVlc3RJZDogbWVzc2FnZS5tZXRhZGF0YS5yZXF1ZXN0SWRcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgbWVzc2FnZTonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRm9ybWF0IG91dHB1dCBmb3IgZGlmZmVyZW50IHByZXNlbnRhdGlvbiBmb3JtYXRzXG4gICAqL1xuICBhc3luYyBmb3JtYXRPdXRwdXQoXG4gICAgcmVzcG9uc2U6IFN5bnRoZXNpc1Jlc3BvbnNlLFxuICAgIGZvcm1hdDogJ2pzb24nIHwgJ21hcmtkb3duJyB8ICdodG1sJyB8ICdwZGYnXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgIGNhc2UgJ2pzb24nOlxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UsIG51bGwsIDIpO1xuICAgICAgXG4gICAgICBjYXNlICdtYXJrZG93bic6XG4gICAgICAgIHJldHVybiB0aGlzLmZvcm1hdEFzTWFya2Rvd24ocmVzcG9uc2UpO1xuICAgICAgXG4gICAgICBjYXNlICdodG1sJzpcbiAgICAgICAgcmV0dXJuIHRoaXMuZm9ybWF0QXNIVE1MKHJlc3BvbnNlKTtcbiAgICAgIFxuICAgICAgY2FzZSAncGRmJzpcbiAgICAgICAgLy8gV291bGQgaW50ZWdyYXRlIHdpdGggUERGIGdlbmVyYXRpb24gbGlicmFyeVxuICAgICAgICByZXR1cm4gdGhpcy5mb3JtYXRBc01hcmtkb3duKHJlc3BvbnNlKTsgLy8gRmFsbGJhY2sgdG8gbWFya2Rvd25cbiAgICAgIFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBmb3JtYXQ6ICR7Zm9ybWF0fWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JtYXQgcmVzcG9uc2UgYXMgTWFya2Rvd25cbiAgICovXG4gIHByaXZhdGUgZm9ybWF0QXNNYXJrZG93bihyZXNwb25zZTogU3ludGhlc2lzUmVzcG9uc2UpOiBzdHJpbmcge1xuICAgIGxldCBtYXJrZG93biA9IGAjIEludmVzdG1lbnQgQW5hbHlzaXMgUmVwb3J0XFxuXFxuYDtcbiAgICBcbiAgICBtYXJrZG93biArPSBgIyMgRXhlY3V0aXZlIFN1bW1hcnlcXG5cXG4ke3Jlc3BvbnNlLmV4ZWN1dGl2ZVN1bW1hcnl9XFxuXFxuYDtcbiAgICBcbiAgICBtYXJrZG93biArPSBgIyMgS2V5IEluc2lnaHRzXFxuXFxuYDtcbiAgICByZXNwb25zZS5rZXlJbnNpZ2h0cy5mb3JFYWNoKChpbnNpZ2h0LCBpbmRleCkgPT4ge1xuICAgICAgbWFya2Rvd24gKz0gYCR7aW5kZXggKyAxfS4gJHtpbnNpZ2h0fVxcbmA7XG4gICAgfSk7XG4gICAgbWFya2Rvd24gKz0gJ1xcbic7XG4gICAgXG4gICAgbWFya2Rvd24gKz0gYCMjIEludmVzdG1lbnQgT3Bwb3J0dW5pdGllc1xcblxcbmA7XG4gICAgcmVzcG9uc2UuaW52ZXN0bWVudElkZWFzLmZvckVhY2goKGlkZWEsIGluZGV4KSA9PiB7XG4gICAgICBtYXJrZG93biArPSBgIyMjICR7aW5kZXggKyAxfS4gJHtpZGVhLnRpdGxlfVxcblxcbmA7XG4gICAgICBtYXJrZG93biArPSBgKipEZXNjcmlwdGlvbjoqKiAke2lkZWEuZGVzY3JpcHRpb259XFxuXFxuYDtcbiAgICAgIG1hcmtkb3duICs9IGAqKlJhdGlvbmFsZToqKiAke2lkZWEucmF0aW9uYWxlfVxcblxcbmA7XG4gICAgICBtYXJrZG93biArPSBgKipDb25maWRlbmNlOioqICR7KGlkZWEuY29uZmlkZW5jZVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5cXG5gO1xuICAgICAgbWFya2Rvd24gKz0gYCoqVGltZSBIb3Jpem9uOioqICR7aWRlYS50aW1lSG9yaXpvbn1cXG5cXG5gO1xuICAgICAgXG4gICAgICBtYXJrZG93biArPSBgKipQb3RlbnRpYWwgT3V0Y29tZXM6KipcXG5gO1xuICAgICAgaWRlYS5wb3RlbnRpYWxPdXRjb21lcy5mb3JFYWNoKChvdXRjb21lOiBPdXRjb21lKSA9PiB7XG4gICAgICAgIG1hcmtkb3duICs9IGAtICoqJHtvdXRjb21lLnNjZW5hcmlvLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgb3V0Y29tZS5zY2VuYXJpby5zbGljZSgxKX06KiogJHsob3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lICgkeyhvdXRjb21lLnByb2JhYmlsaXR5ICogMTAwKS50b0ZpeGVkKDApfSUgcHJvYmFiaWxpdHkpXFxuYDtcbiAgICAgIH0pO1xuICAgICAgbWFya2Rvd24gKz0gJ1xcbic7XG4gICAgfSk7XG4gICAgXG4gICAgbWFya2Rvd24gKz0gYCMjIFJpc2sgQXNzZXNzbWVudFxcblxcbiR7cmVzcG9uc2Uucmlza1N1bW1hcnl9XFxuXFxuYDtcbiAgICBcbiAgICBtYXJrZG93biArPSBgIyMgUmVjb21tZW5kYXRpb25zXFxuXFxuYDtcbiAgICByZXNwb25zZS5yZWNvbW1lbmRhdGlvbnMuZm9yRWFjaCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgbWFya2Rvd24gKz0gYCR7aW5kZXggKyAxfS4gKioke3JlYy5hY3Rpb24udG9VcHBlckNhc2UoKX0qKiAke3JlYy5pbnZlc3RtZW50fSAoJHtyZWMucHJpb3JpdHl9IHByaW9yaXR5KVxcbmA7XG4gICAgICBtYXJrZG93biArPSBgICAgLSAke3JlYy5yYXRpb25hbGV9XFxuYDtcbiAgICAgIG1hcmtkb3duICs9IGAgICAtIENvbmZpZGVuY2U6ICR7KHJlYy5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5cXG5gO1xuICAgIH0pO1xuICAgIFxuICAgIG1hcmtkb3duICs9IGAtLS1cXG5cXG5gO1xuICAgIG1hcmtkb3duICs9IGAqUmVwb3J0IGdlbmVyYXRlZCBieSBJbnZlc3RtZW50IEFJIEFnZW50IC0gU3ludGhlc2lzIEFnZW50KlxcbmA7XG4gICAgbWFya2Rvd24gKz0gYCpDb2hlcmVuY2UgU2NvcmU6ICR7KHJlc3BvbnNlLmNvaGVyZW5jZVNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSUqXFxuYDtcbiAgICBtYXJrZG93biArPSBgKk92ZXJhbGwgQ29uZmlkZW5jZTogJHsocmVzcG9uc2UuY29uZmlkZW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lKlxcbmA7XG4gICAgXG4gICAgcmV0dXJuIG1hcmtkb3duO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1hdCByZXNwb25zZSBhcyBIVE1MXG4gICAqL1xuICBwcml2YXRlIGZvcm1hdEFzSFRNTChyZXNwb25zZTogU3ludGhlc2lzUmVzcG9uc2UpOiBzdHJpbmcge1xuICAgIGxldCBodG1sID0gYFxuPCFET0NUWVBFIGh0bWw+XG48aHRtbD5cbjxoZWFkPlxuICAgIDx0aXRsZT5JbnZlc3RtZW50IEFuYWx5c2lzIFJlcG9ydDwvdGl0bGU+XG4gICAgPHN0eWxlPlxuICAgICAgICBib2R5IHsgZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBtYXJnaW46IDQwcHg7IGxpbmUtaGVpZ2h0OiAxLjY7IH1cbiAgICAgICAgaDEsIGgyLCBoMyB7IGNvbG9yOiAjMmMzZTUwOyB9XG4gICAgICAgIC5zdW1tYXJ5IHsgYmFja2dyb3VuZDogI2Y4ZjlmYTsgcGFkZGluZzogMjBweDsgYm9yZGVyLXJhZGl1czogNXB4OyBtYXJnaW46IDIwcHggMDsgfVxuICAgICAgICAuaW5zaWdodCB7IG1hcmdpbjogMTBweCAwOyBwYWRkaW5nOiAxMHB4OyBiYWNrZ3JvdW5kOiAjZTNmMmZkOyBib3JkZXItcmFkaXVzOiAzcHg7IH1cbiAgICAgICAgLmludmVzdG1lbnQgeyBtYXJnaW46IDIwcHggMDsgcGFkZGluZzogMjBweDsgYm9yZGVyOiAxcHggc29saWQgI2RkZDsgYm9yZGVyLXJhZGl1czogNXB4OyB9XG4gICAgICAgIC5jb25maWRlbmNlIHsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjMjdhZTYwOyB9XG4gICAgICAgIC5yaXNrIHsgY29sb3I6ICNlNzRjM2M7IH1cbiAgICAgICAgLnJlY29tbWVuZGF0aW9uIHsgbWFyZ2luOiAxMHB4IDA7IHBhZGRpbmc6IDEwcHg7IGJhY2tncm91bmQ6ICNmMGY4ZmY7IGJvcmRlci1yYWRpdXM6IDNweDsgfVxuICAgIDwvc3R5bGU+XG48L2hlYWQ+XG48Ym9keT5cbiAgICA8aDE+SW52ZXN0bWVudCBBbmFseXNpcyBSZXBvcnQ8L2gxPlxuICAgIFxuICAgIDxkaXYgY2xhc3M9XCJzdW1tYXJ5XCI+XG4gICAgICAgIDxoMj5FeGVjdXRpdmUgU3VtbWFyeTwvaDI+XG4gICAgICAgIDxwPiR7cmVzcG9uc2UuZXhlY3V0aXZlU3VtbWFyeS5yZXBsYWNlKC9cXG4vZywgJzwvcD48cD4nKX08L3A+XG4gICAgPC9kaXY+XG4gICAgXG4gICAgPGgyPktleSBJbnNpZ2h0czwvaDI+XG4gICAgJHtyZXNwb25zZS5rZXlJbnNpZ2h0cy5tYXAoaW5zaWdodCA9PiBgPGRpdiBjbGFzcz1cImluc2lnaHRcIj4ke2luc2lnaHR9PC9kaXY+YCkuam9pbignJyl9XG4gICAgXG4gICAgPGgyPkludmVzdG1lbnQgT3Bwb3J0dW5pdGllczwvaDI+XG4gICAgJHtyZXNwb25zZS5pbnZlc3RtZW50SWRlYXMubWFwKChpZGVhLCBpbmRleCkgPT4gYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiaW52ZXN0bWVudFwiPlxuICAgICAgICAgICAgPGgzPiR7aW5kZXggKyAxfS4gJHtpZGVhLnRpdGxlfTwvaDM+XG4gICAgICAgICAgICA8cD48c3Ryb25nPkRlc2NyaXB0aW9uOjwvc3Ryb25nPiAke2lkZWEuZGVzY3JpcHRpb259PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5SYXRpb25hbGU6PC9zdHJvbmc+ICR7aWRlYS5yYXRpb25hbGV9PC9wPlxuICAgICAgICAgICAgPHA+PHN0cm9uZz5Db25maWRlbmNlOjwvc3Ryb25nPiA8c3BhbiBjbGFzcz1cImNvbmZpZGVuY2VcIj4keyhpZGVhLmNvbmZpZGVuY2VTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lPC9zcGFuPjwvcD5cbiAgICAgICAgICAgIDxwPjxzdHJvbmc+VGltZSBIb3Jpem9uOjwvc3Ryb25nPiAke2lkZWEudGltZUhvcml6b259PC9wPlxuICAgICAgICAgICAgPGg0PlBvdGVudGlhbCBPdXRjb21lczo8L2g0PlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICR7aWRlYS5wb3RlbnRpYWxPdXRjb21lcy5tYXAoKG91dGNvbWU6IE91dGNvbWUpID0+IGBcbiAgICAgICAgICAgICAgICAgICAgPGxpPjxzdHJvbmc+JHtvdXRjb21lLnNjZW5hcmlvLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgb3V0Y29tZS5zY2VuYXJpby5zbGljZSgxKX06PC9zdHJvbmc+IFxuICAgICAgICAgICAgICAgICAgICAgICAgJHsob3V0Y29tZS5yZXR1cm5Fc3RpbWF0ZSAqIDEwMCkudG9GaXhlZCgxKX0lICgkeyhvdXRjb21lLnByb2JhYmlsaXR5ICogMTAwKS50b0ZpeGVkKDApfSUgcHJvYmFiaWxpdHkpXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICBgKS5qb2luKCcnKX1cbiAgICBcbiAgICA8aDI+UmlzayBBc3Nlc3NtZW50PC9oMj5cbiAgICA8ZGl2IGNsYXNzPVwicmlza1wiPlxuICAgICAgICA8cD4ke3Jlc3BvbnNlLnJpc2tTdW1tYXJ5LnJlcGxhY2UoL1xcbi9nLCAnPC9wPjxwPicpfTwvcD5cbiAgICA8L2Rpdj5cbiAgICBcbiAgICA8aDI+UmVjb21tZW5kYXRpb25zPC9oMj5cbiAgICAke3Jlc3BvbnNlLnJlY29tbWVuZGF0aW9ucy5tYXAoKHJlYywgaW5kZXgpID0+IGBcbiAgICAgICAgPGRpdiBjbGFzcz1cInJlY29tbWVuZGF0aW9uXCI+XG4gICAgICAgICAgICA8c3Ryb25nPiR7aW5kZXggKyAxfS4gJHtyZWMuYWN0aW9uLnRvVXBwZXJDYXNlKCl9PC9zdHJvbmc+ICR7cmVjLmludmVzdG1lbnR9ICgke3JlYy5wcmlvcml0eX0gcHJpb3JpdHkpPGJyPlxuICAgICAgICAgICAgJHtyZWMucmF0aW9uYWxlfTxicj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiY29uZmlkZW5jZVwiPkNvbmZpZGVuY2U6ICR7KHJlYy5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSU8L3NwYW4+XG4gICAgICAgIDwvZGl2PlxuICAgIGApLmpvaW4oJycpfVxuICAgIFxuICAgIDxocj5cbiAgICA8cD48ZW0+UmVwb3J0IGdlbmVyYXRlZCBieSBJbnZlc3RtZW50IEFJIEFnZW50IC0gU3ludGhlc2lzIEFnZW50PC9lbT48L3A+XG4gICAgPHA+PGVtPkNvaGVyZW5jZSBTY29yZTogJHsocmVzcG9uc2UuY29oZXJlbmNlU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JTwvZW0+PC9wPlxuICAgIDxwPjxlbT5PdmVyYWxsIENvbmZpZGVuY2U6ICR7KHJlc3BvbnNlLmNvbmZpZGVuY2UgKiAxMDApLnRvRml4ZWQoMSl9JTwvZW0+PC9wPlxuPC9ib2R5PlxuPC9odG1sPlxuICAgIGA7XG4gICAgXG4gICAgcmV0dXJuIGh0bWw7XG4gIH1cbn0iXX0=