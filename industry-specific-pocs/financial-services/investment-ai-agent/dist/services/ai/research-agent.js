"use strict";
/**
 * Research Agent Implementation
 *
 * This agent is responsible for:
 * - Web search and data retrieval functionality
 * - Information extraction and summarization
 * - Trend and pattern identification
 *
 * Uses Claude Haiku 3.5 for efficient processing of information
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchAgent = void 0;
/**
 * Research Agent class that handles all research-related tasks
 */
class ResearchAgent {
    constructor(claudeHaikuService, webSearchService, proprietaryDataService, marketDataService) {
        this.agentType = 'research';
        this.claudeHaikuService = claudeHaikuService;
        this.webSearchService = webSearchService;
        this.proprietaryDataService = proprietaryDataService;
        this.marketDataService = marketDataService;
    }
    /**
     * Process a research request and return comprehensive research results
     */
    async processResearchRequest(request) {
        const startTime = Date.now();
        try {
            let response;
            switch (request.researchType) {
                case 'web-search':
                    response = await this.performWebSearchResearch(request);
                    break;
                case 'deep-research':
                    response = await this.performDeepResearch(request);
                    break;
                case 'market-analysis':
                    response = await this.performMarketAnalysis(request);
                    break;
                case 'proprietary-analysis':
                    response = await this.performProprietaryAnalysis(request);
                    break;
                case 'comprehensive':
                    response = await this.performComprehensiveResearch(request);
                    break;
                default:
                    throw new Error(`Unsupported research type: ${request.researchType}`);
            }
            response.executionTime = Date.now() - startTime;
            return response;
        }
        catch (error) {
            console.error('Error processing research request:', error);
            throw error;
        }
    }
    /**
     * Perform web search research
     */
    async performWebSearchResearch(request) {
        const searchOptions = {
            depth: (request.parameters.depth === 'deep' || request.parameters.depth === 'comprehensive') ? 'comprehensive' : 'basic',
            sources: request.parameters.sources || [],
            timeframe: request.parameters.timeframe || 'all-time',
            maxResults: request.parameters.maxResults || 20
        };
        const searchResult = await this.webSearchService.performWebSearch(request.topic, searchOptions);
        // Extract information from search results
        const extractionResult = await this.extractInformation(searchResult.results.map(r => r.snippet).join('\n'));
        // Identify trends and patterns
        const trends = await this.identifyTrends(searchResult.results, request.topic);
        const patterns = await this.identifyPatterns(searchResult.results, request.topic);
        // Generate summary and insights
        const summary = await this.generateSummary(request.topic, searchResult.results, extractionResult);
        const keyFindings = await this.generateKeyFindings(extractionResult, trends, patterns);
        const recommendations = await this.generateRecommendations(request.topic, keyFindings, trends);
        return {
            summary,
            keyFindings,
            trends,
            patterns,
            sources: searchResult.results.map(r => ({
                title: r.title,
                url: r.url,
                publisher: r.source,
                publishDate: r.publishDate,
                relevance: r.relevanceScore,
                excerpts: [r.snippet]
            })),
            confidence: this.calculateConfidence(searchResult.results, extractionResult),
            recommendations,
            relatedTopics: extractionResult.topics.map(t => t.topic),
            executionTime: 0 // Will be set by caller
        };
    }
    /**
     * Perform deep research
     */
    async performDeepResearch(request) {
        const researchOptions = {
            depth: (request.parameters.depth === 'basic') ? 'standard' : (request.parameters.depth || 'deep'),
            focusAreas: request.parameters.focusAreas || [],
            includeSources: request.parameters.sources || [],
            excludeSources: request.parameters.excludeSources || [],
            timeConstraint: 300 // 5 minutes
        };
        const researchResult = await this.webSearchService.performDeepResearch(request.topic, researchOptions);
        // Extract detailed information
        const extractionResult = await this.extractInformation(researchResult.sources.map(s => s.excerpts.join(' ')).join('\n'));
        // Perform advanced trend and pattern analysis
        const trends = await this.identifyAdvancedTrends(researchResult, request.topic);
        const patterns = await this.identifyAdvancedPatterns(researchResult, request.topic);
        // Generate comprehensive insights
        const keyFindings = await this.generateAdvancedFindings(researchResult, extractionResult, trends, patterns);
        const recommendations = await this.generateAdvancedRecommendations(request.topic, keyFindings, trends, patterns);
        return {
            summary: researchResult.summary,
            keyFindings,
            trends,
            patterns,
            sources: researchResult.sources,
            confidence: researchResult.confidence,
            recommendations,
            relatedTopics: researchResult.relatedTopics,
            executionTime: 0
        };
    }
    /**
     * Perform market analysis research
     */
    async performMarketAnalysis(request) {
        // Get market data for the topic (mock implementation)
        const marketData = {
            data: [
                {
                    id: 'market-1',
                    symbol: request.topic,
                    timestamp: new Date(),
                    price: 100,
                    volume: 1000000,
                    change: 1.5,
                    changePercent: 1.5,
                    dataType: 'price',
                    value: 100,
                    source: 'mock-provider',
                    interval: 'daily'
                }
            ]
        };
        // Analyze market trends
        const marketInsights = await this.analyzeMarketData(marketData.data);
        const trends = await this.identifyMarketTrends(marketData.data, request.topic);
        const patterns = await this.identifyMarketPatterns(marketData.data, request.topic);
        // Generate market-focused summary
        const summary = await this.generateMarketSummary(request.topic, marketInsights, trends);
        const keyFindings = await this.generateMarketFindings(marketInsights, trends, patterns);
        const recommendations = await this.generateMarketRecommendations(request.topic, marketInsights, trends);
        return {
            summary,
            keyFindings,
            trends,
            patterns,
            sources: [],
            marketInsights,
            confidence: this.calculateMarketConfidence(marketData.data),
            recommendations,
            relatedTopics: await this.generateRelatedMarketTopics(request.topic),
            executionTime: 0
        };
    }
    /**
     * Perform proprietary data analysis
     */
    async performProprietaryAnalysis(request) {
        const query = {
            searchTerm: request.topic,
            dataTypes: ['financial', 'research', 'analysis'],
            timeframe: request.parameters.timeframe || 'all-time',
            maxResults: request.parameters.maxResults || 50
        };
        // Mock proprietary data query (would be implemented with actual service method)
        const proprietaryResult = {
            results: [
                {
                    id: 'prop-1',
                    title: `Internal ${request.topic} Analysis`,
                    content: `Our analysis shows significant insights about ${request.topic}`,
                    relevance: 0.9,
                    lastModified: new Date()
                }
            ],
            sources: [
                {
                    title: `Internal ${request.topic} Analysis`,
                    url: `internal://${request.topic.toLowerCase().replace(/\s+/g, '-')}-analysis`,
                    source: 'Internal Research',
                    lastModified: new Date(),
                    relevance: 0.9,
                    summary: `Comprehensive analysis of ${request.topic}`
                }
            ],
            confidence: 0.85,
            totalResults: 1
        };
        // Extract insights from proprietary data
        const proprietaryInsights = await this.analyzeProprietaryData(proprietaryResult);
        const trends = await this.identifyProprietaryTrends(proprietaryResult, request.topic);
        const patterns = await this.identifyProprietaryPatterns(proprietaryResult, request.topic);
        // Generate proprietary-focused analysis
        const summary = await this.generateProprietarySummary(request.topic, proprietaryInsights, trends);
        const keyFindings = await this.generateProprietaryFindings(proprietaryInsights, trends, patterns);
        const recommendations = await this.generateProprietaryRecommendations(request.topic, proprietaryInsights, trends);
        return {
            summary,
            keyFindings,
            trends,
            patterns,
            sources: proprietaryResult.sources.map(s => ({
                title: s.title,
                url: s.url,
                publisher: s.source,
                publishDate: s.lastModified,
                relevance: s.relevance,
                excerpts: [s.summary]
            })),
            proprietaryInsights,
            confidence: proprietaryResult.confidence,
            recommendations,
            relatedTopics: await this.generateRelatedProprietaryTopics(request.topic, proprietaryResult),
            executionTime: 0
        };
    }
    /**
     * Perform comprehensive research combining all sources
     */
    async performComprehensiveResearch(request) {
        // Perform all types of research in parallel
        const [webResearch, marketResearch, proprietaryResearch] = await Promise.all([
            this.performWebSearchResearch({ ...request, researchType: 'web-search' }),
            request.parameters.includeMarketData ?
                this.performMarketAnalysis({ ...request, researchType: 'market-analysis' }) :
                null,
            request.parameters.includeProprietaryData ?
                this.performProprietaryAnalysis({ ...request, researchType: 'proprietary-analysis' }) :
                null
        ]);
        // Combine and synthesize results
        const combinedSources = [
            ...webResearch.sources,
            ...(marketResearch?.sources || []),
            ...(proprietaryResearch?.sources || [])
        ];
        const combinedTrends = [
            ...webResearch.trends,
            ...(marketResearch?.trends || []),
            ...(proprietaryResearch?.trends || [])
        ];
        const combinedPatterns = [
            ...webResearch.patterns,
            ...(marketResearch?.patterns || []),
            ...(proprietaryResearch?.patterns || [])
        ];
        // Generate comprehensive synthesis
        const summary = await this.synthesizeComprehensiveResults(request.topic, webResearch, marketResearch, proprietaryResearch);
        const keyFindings = await this.synthesizeKeyFindings([
            ...webResearch.keyFindings,
            ...(marketResearch?.keyFindings || []),
            ...(proprietaryResearch?.keyFindings || [])
        ]);
        const recommendations = await this.synthesizeRecommendations(request.topic, webResearch.recommendations, marketResearch?.recommendations || [], proprietaryResearch?.recommendations || []);
        return {
            summary,
            keyFindings,
            trends: combinedTrends,
            patterns: combinedPatterns,
            sources: combinedSources,
            marketInsights: marketResearch?.marketInsights,
            proprietaryInsights: proprietaryResearch?.proprietaryInsights,
            confidence: this.calculateComprehensiveConfidence(webResearch, marketResearch, proprietaryResearch),
            recommendations,
            relatedTopics: this.combineRelatedTopics([
                ...webResearch.relatedTopics,
                ...(marketResearch?.relatedTopics || []),
                ...(proprietaryResearch?.relatedTopics || [])
            ]),
            executionTime: 0
        };
    }
    /**
     * Extract information from text using Claude Haiku
     */
    async extractInformation(text) {
        const prompt = `
      Analyze the following text and extract key information:
      
      Text: ${text}
      
      Please extract:
      1. Named entities (companies, people, locations, products, concepts, financial instruments)
      2. Key financial metrics and numbers
      3. Sentiment analysis for different aspects
      4. Main topics and themes
      5. Relationships between entities
      
      Format your response as JSON with the following structure:
      {
        "entities": [{"name": "...", "type": "...", "confidence": 0.9, "mentions": 3, "context": ["..."]}],
        "keyMetrics": [{"name": "...", "value": 123, "unit": "...", "context": "...", "source": "...", "confidence": 0.8}],
        "sentiments": [{"text": "...", "sentiment": "positive", "score": 0.7, "confidence": 0.9, "aspects": []}],
        "topics": [{"topic": "...", "relevance": 0.8, "keywords": ["..."], "frequency": 5}],
        "relationships": [{"entity1": "...", "entity2": "...", "relationship": "...", "strength": 0.7, "context": "..."}]
      }
    `;
        try {
            const response = await this.claudeHaikuService.complete({
                prompt,
                maxTokens: 2000,
                temperature: 0.1
            });
            return JSON.parse(response.completion);
        }
        catch (error) {
            console.error('Error extracting information:', error);
            // Return empty structure if parsing fails
            return {
                entities: [],
                keyMetrics: [],
                sentiments: [],
                topics: [],
                relationships: []
            };
        }
    }
    /**
     * Identify trends from search results
     */
    async identifyTrends(results, topic) {
        const prompt = `
      Analyze the following search results for trends related to "${topic}":
      
      ${results.map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nDate: ${r.publishDate}\n`).join('\n---\n')}
      
      Identify key trends, their direction, strength, and implications.
      Format as JSON array of trend objects with: trend, direction, strength, timeframe, confidence, supportingEvidence, implications.
    `;
        try {
            const response = await this.claudeHaikuService.complete({
                prompt,
                maxTokens: 1500,
                temperature: 0.2
            });
            return JSON.parse(response.completion);
        }
        catch (error) {
            console.error('Error identifying trends:', error);
            return [];
        }
    }
    /**
     * Identify patterns from search results
     */
    async identifyPatterns(results, topic) {
        const prompt = `
      Analyze the following search results for patterns related to "${topic}":
      
      ${results.map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nDate: ${r.publishDate}\n`).join('\n---\n')}
      
      Identify recurring patterns, cycles, correlations, or anomalies.
      Format as JSON array of pattern objects with: pattern, type, frequency, strength, confidence, description, historicalOccurrences, predictiveValue.
    `;
        try {
            const response = await this.claudeHaikuService.complete({
                prompt,
                maxTokens: 1500,
                temperature: 0.2
            });
            return JSON.parse(response.completion);
        }
        catch (error) {
            console.error('Error identifying patterns:', error);
            return [];
        }
    }
    // Additional helper methods for advanced analysis, market analysis, proprietary analysis, etc.
    // These would be implemented similarly to the above methods
    async identifyAdvancedTrends(researchResult, topic) {
        // Implementation for advanced trend analysis
        return [];
    }
    async identifyAdvancedPatterns(researchResult, topic) {
        // Implementation for advanced pattern analysis
        return [];
    }
    async analyzeMarketData(marketData) {
        // Implementation for market data analysis
        return [];
    }
    async identifyMarketTrends(marketData, topic) {
        // Implementation for market trend identification
        return [];
    }
    async identifyMarketPatterns(marketData, topic) {
        // Implementation for market pattern identification
        return [];
    }
    async analyzeProprietaryData(proprietaryResult) {
        // Implementation for proprietary data analysis
        return [];
    }
    async identifyProprietaryTrends(proprietaryResult, topic) {
        // Implementation for proprietary trend identification
        return [];
    }
    async identifyProprietaryPatterns(proprietaryResult, topic) {
        // Implementation for proprietary pattern identification
        return [];
    }
    // Summary and finding generation methods
    async generateSummary(topic, results, extractionResult) {
        const prompt = `
      Generate a comprehensive summary for research on "${topic}" based on:
      
      Search Results: ${results.length} sources
      Key Entities: ${extractionResult.entities.map(e => e.name).join(', ')}
      Key Topics: ${extractionResult.topics.map(t => t.topic).join(', ')}
      
      Provide a 2-3 paragraph summary that synthesizes the key information.
    `;
        try {
            const response = await this.claudeHaikuService.complete({
                prompt,
                maxTokens: 800,
                temperature: 0.3
            });
            return response.completion;
        }
        catch (error) {
            console.error('Error generating summary:', error);
            return `Research summary for ${topic} based on ${results.length} sources.`;
        }
    }
    async generateKeyFindings(extractionResult, trends, patterns) {
        const findings = [];
        // Add findings from entities (up to 3)
        extractionResult.entities.slice(0, 3).forEach(entity => {
            findings.push(`${entity.name} is a key ${entity.type} mentioned ${entity.mentions} times in the research.`);
        });
        // Add findings from trends (up to 1)
        trends.slice(0, 1).forEach(trend => {
            findings.push(`${trend.trend} shows a ${trend.direction} trend with ${trend.strength} strength.`);
        });
        // Add findings from patterns (up to 1)
        patterns.slice(0, 1).forEach(pattern => {
            findings.push(`Identified ${pattern.type} pattern: ${pattern.pattern} with ${pattern.predictiveValue} predictive value.`);
        });
        return findings;
    }
    async generateRecommendations(topic, keyFindings, trends) {
        const recommendations = [];
        // Generate recommendations based on trends
        trends.forEach(trend => {
            if (trend.direction === 'upward' && trend.strength === 'strong') {
                recommendations.push(`Consider increasing exposure to ${topic} given the strong upward trend in ${trend.trend}.`);
            }
            else if (trend.direction === 'downward' && trend.strength === 'strong') {
                recommendations.push(`Exercise caution with ${topic} due to the strong downward trend in ${trend.trend}.`);
            }
        });
        // Add general recommendations
        recommendations.push(`Continue monitoring ${topic} for further developments.`);
        recommendations.push(`Consider diversification strategies related to ${topic}.`);
        return recommendations;
    }
    // Confidence calculation methods
    calculateConfidence(results, extractionResult) {
        let confidence = 0.5; // Base confidence
        // Increase confidence based on number of sources
        confidence += Math.min(0.3, results.length / 50);
        // Increase confidence based on entity extraction quality
        const avgEntityConfidence = extractionResult.entities.reduce((sum, e) => sum + e.confidence, 0) / extractionResult.entities.length;
        confidence += (avgEntityConfidence || 0) * 0.2;
        return Math.min(1.0, confidence);
    }
    calculateMarketConfidence(marketData) {
        // Calculate confidence based on market data quality and completeness
        return Math.min(1.0, 0.7 + (marketData.length / 100) * 0.3);
    }
    calculateComprehensiveConfidence(webResearch, marketResearch, proprietaryResearch) {
        let totalConfidence = webResearch.confidence;
        let sources = 1;
        if (marketResearch) {
            totalConfidence += marketResearch.confidence;
            sources++;
        }
        if (proprietaryResearch) {
            totalConfidence += proprietaryResearch.confidence;
            sources++;
        }
        return totalConfidence / sources;
    }
    // Synthesis methods for comprehensive research
    async synthesizeComprehensiveResults(topic, webResearch, marketResearch, proprietaryResearch) {
        const prompt = `
      Synthesize comprehensive research results for "${topic}":
      
      Web Research Summary: ${webResearch.summary}
      ${marketResearch ? `Market Research Summary: ${marketResearch.summary}` : ''}
      ${proprietaryResearch ? `Proprietary Research Summary: ${proprietaryResearch.summary}` : ''}
      
      Create a unified, coherent summary that integrates insights from all sources.
    `;
        try {
            const response = await this.claudeHaikuService.complete({
                prompt,
                maxTokens: 1000,
                temperature: 0.3
            });
            return response.completion;
        }
        catch (error) {
            console.error('Error synthesizing comprehensive results:', error);
            return webResearch.summary;
        }
    }
    async synthesizeKeyFindings(allFindings) {
        // Remove duplicates and prioritize most important findings
        const uniqueFindings = [...new Set(allFindings)];
        return uniqueFindings.slice(0, 10); // Return top 10 findings
    }
    async synthesizeRecommendations(topic, webRecs, marketRecs, proprietaryRecs) {
        const allRecommendations = [...webRecs, ...marketRecs, ...proprietaryRecs];
        const uniqueRecommendations = [...new Set(allRecommendations)];
        return uniqueRecommendations.slice(0, 8); // Return top 8 recommendations
    }
    combineRelatedTopics(allTopics) {
        const uniqueTopics = [...new Set(allTopics)];
        return uniqueTopics.slice(0, 15); // Return top 15 related topics
    }
    // Placeholder methods for additional functionality
    async generateAdvancedFindings(researchResult, extractionResult, trends, patterns) {
        return researchResult.keyFindings;
    }
    async generateAdvancedRecommendations(topic, keyFindings, trends, patterns) {
        return [`Advanced recommendation for ${topic} based on comprehensive analysis.`];
    }
    async generateMarketSummary(topic, marketInsights, trends) {
        return `Market analysis summary for ${topic} based on ${marketInsights.length} insights and ${trends.length} trends.`;
    }
    async generateMarketFindings(marketInsights, trends, patterns) {
        return marketInsights.map(insight => `${insight.metric}: ${insight.value} (${insight.interpretation})`);
    }
    async generateMarketRecommendations(topic, marketInsights, trends) {
        return [`Market-based recommendation for ${topic}.`];
    }
    async generateRelatedMarketTopics(topic) {
        return [`${topic} market analysis`, `${topic} price trends`, `${topic} volatility`];
    }
    async generateProprietarySummary(topic, proprietaryInsights, trends) {
        return `Proprietary analysis summary for ${topic} based on ${proprietaryInsights.length} insights.`;
    }
    async generateProprietaryFindings(proprietaryInsights, trends, patterns) {
        return proprietaryInsights.map(insight => insight.insight);
    }
    async generateProprietaryRecommendations(topic, proprietaryInsights, trends) {
        return [`Proprietary-based recommendation for ${topic}.`];
    }
    async generateRelatedProprietaryTopics(topic, proprietaryResult) {
        return [`${topic} internal analysis`, `${topic} proprietary insights`];
    }
    /**
     * Handle agent messages for communication with other agents
     */
    async handleMessage(message) {
        try {
            let responseContent;
            switch (message.messageType) {
                case 'request':
                    if (message.content.type === 'research') {
                        responseContent = await this.processResearchRequest(message.content.request);
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
            return {
                sender: this.agentType,
                recipient: message.sender,
                messageType: 'error',
                content: { error: error instanceof Error ? error.message : 'Unknown error' },
                metadata: {
                    priority: 'high',
                    timestamp: new Date(),
                    conversationId: message.metadata.conversationId,
                    requestId: message.metadata.requestId
                }
            };
        }
    }
}
exports.ResearchAgent = ResearchAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzZWFyY2gtYWdlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvcmVzZWFyY2gtYWdlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7O0FBK0pIOztHQUVHO0FBQ0gsTUFBYSxhQUFhO0lBT3hCLFlBQ0Usa0JBQXNDLEVBQ3RDLGdCQUFrQyxFQUNsQyxzQkFBOEMsRUFDOUMsaUJBQW9DO1FBTjlCLGNBQVMsR0FBYyxVQUFVLENBQUM7UUFReEMsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO1FBQzdDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUN6QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7UUFDckQsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO0lBQzdDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxPQUF3QjtRQUNuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFN0IsSUFBSTtZQUNGLElBQUksUUFBMEIsQ0FBQztZQUUvQixRQUFRLE9BQU8sQ0FBQyxZQUFZLEVBQUU7Z0JBQzVCLEtBQUssWUFBWTtvQkFDZixRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ3hELE1BQU07Z0JBQ1IsS0FBSyxlQUFlO29CQUNsQixRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ25ELE1BQU07Z0JBQ1IsS0FBSyxpQkFBaUI7b0JBQ3BCLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDckQsTUFBTTtnQkFDUixLQUFLLHNCQUFzQjtvQkFDekIsUUFBUSxHQUFHLE1BQU0sSUFBSSxD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LEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRTtnQkFDNUUsUUFBUSxFQUFFO29CQUNSLFFBQVEsRUFBRSxNQUFNO29CQUNoQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7b0JBQ3JCLGNBQWMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWM7b0JBQy9DLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVM7aUJBQ3RDO2FBQ0YsQ0FBQztTQUNIO0lBQ0gsQ0FBQztDQUNGO0FBbHNCRCxzQ0Frc0JDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBSZXNlYXJjaCBBZ2VudCBJbXBsZW1lbnRhdGlvblxuICogXG4gKiBUaGlzIGFnZW50IGlzIHJlc3BvbnNpYmxlIGZvcjpcbiAqIC0gV2ViIHNlYXJjaCBhbmQgZGF0YSByZXRyaWV2YWwgZnVuY3Rpb25hbGl0eVxuICogLSBJbmZvcm1hdGlvbiBleHRyYWN0aW9uIGFuZCBzdW1tYXJpemF0aW9uXG4gKiAtIFRyZW5kIGFuZCBwYXR0ZXJuIGlkZW50aWZpY2F0aW9uXG4gKiBcbiAqIFVzZXMgQ2xhdWRlIEhhaWt1IDMuNSBmb3IgZWZmaWNpZW50IHByb2Nlc3Npbmcgb2YgaW5mb3JtYXRpb25cbiAqL1xuXG5pbXBvcnQgeyBDbGF1ZGVIYWlrdVNlcnZpY2UgfSBmcm9tICcuL2NsYXVkZS1oYWlrdS1zZXJ2aWNlJztcbmltcG9ydCB7IFdlYlNlYXJjaFNlcnZpY2UgfSBmcm9tICcuLi93ZWItc2VhcmNoLXNlcnZpY2UnO1xuaW1wb3J0IHsgUHJvcHJpZXRhcnlEYXRhU2VydmljZSB9IGZyb20gJy4uL3Byb3ByaWV0YXJ5LWRhdGEtc2VydmljZSc7XG5pbXBvcnQgeyBNYXJrZXREYXRhU2VydmljZSB9IGZyb20gJy4uL21hcmtldC1kYXRhLXNlcnZpY2UnO1xuaW1wb3J0IHsgXG4gIEFnZW50TWVzc2FnZSwgXG4gIEFnZW50VGFzaywgXG4gIENvbnZlcnNhdGlvbkNvbnRleHQsIFxuICBBZ2VudFR5cGUgXG59IGZyb20gJy4uLy4uL21vZGVscy9hZ2VudCc7XG5pbXBvcnQgeyBcbiAgV2ViU2VhcmNoT3B0aW9ucywgXG4gIFdlYlNlYXJjaFJlc3VsdCxcbiAgRGVlcFJlc2VhcmNoT3B0aW9ucyxcbiAgUmVzZWFyY2hSZXN1bHQsXG4gIFJlc2VhcmNoU291cmNlXG59IGZyb20gJy4uLy4uL21vZGVscy9zZXJ2aWNlcyc7XG5pbXBvcnQgeyBNYXJrZXREYXRhUG9pbnQgfSBmcm9tICcuLi8uLi9tb2RlbHMvbWFya2V0LWRhdGEnO1xuaW1wb3J0IHsgUHJvcHJpZXRhcnlEYXRhRmlsZSB9IGZyb20gJy4uLy4uL21vZGVscy9wcm9wcmlldGFyeS1kYXRhJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc2VhcmNoUmVxdWVzdCB7XG4gIHRvcGljOiBzdHJpbmc7XG4gIHJlc2VhcmNoVHlwZTogJ3dlYi1zZWFyY2gnIHwgJ2RlZXAtcmVzZWFyY2gnIHwgJ21hcmtldC1hbmFseXNpcycgfCAncHJvcHJpZXRhcnktYW5hbHlzaXMnIHwgJ2NvbXByZWhlbnNpdmUnO1xuICBwYXJhbWV0ZXJzOiB7XG4gICAgdGltZWZyYW1lPzogJ3JlY2VudCcgfCAncGFzdC13ZWVrJyB8ICdwYXN0LW1vbnRoJyB8ICdwYXN0LXllYXInIHwgJ2FsbC10aW1lJztcbiAgICBzb3VyY2VzPzogc3RyaW5nW107XG4gICAgZGVwdGg/OiAnYmFzaWMnIHwgJ3N0YW5kYXJkJyB8ICdkZWVwJyB8ICdjb21wcmVoZW5zaXZlJztcbiAgICBmb2N1c0FyZWFzPzogc3RyaW5nW107XG4gICAgZXhjbHVkZVNvdXJjZXM/OiBzdHJpbmdbXTtcbiAgICBpbmNsdWRlTWFya2V0RGF0YT86IGJvb2xlYW47XG4gICAgaW5jbHVkZVByb3ByaWV0YXJ5RGF0YT86IGJvb2xlYW47XG4gICAgbWF4UmVzdWx0cz86IG51bWJlcjtcbiAgfTtcbiAgY29udGV4dD86IENvbnZlcnNhdGlvbkNvbnRleHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzZWFyY2hSZXNwb25zZSB7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAga2V5RmluZGluZ3M6IHN0cmluZ1tdO1xuICB0cmVuZHM6IFRyZW5kQW5hbHlzaXNbXTtcbiAgcGF0dGVybnM6IFBhdHRlcm5BbmFseXNpc1tdO1xuICBzb3VyY2VzOiBSZXNlYXJjaFNvdXJjZVtdO1xuICBtYXJrZXRJbnNpZ2h0cz86IE1hcmtldEluc2lnaHRbXTtcbiAgcHJvcHJpZXRhcnlJbnNpZ2h0cz86IFByb3ByaWV0YXJ5SW5zaWdodFtdO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG4gIHJlY29tbWVuZGF0aW9uczogc3RyaW5nW107XG4gIHJlbGF0ZWRUb3BpY3M6IHN0cmluZ1tdO1xuICBleGVjdXRpb25UaW1lOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJlbmRBbmFseXNpcyB7XG4gIHRyZW5kOiBzdHJpbmc7XG4gIGRpcmVjdGlvbjogJ3Vwd2FyZCcgfCAnZG93bndhcmQnIHwgJ3N0YWJsZScgfCAndm9sYXRpbGUnO1xuICBzdHJlbmd0aDogJ3dlYWsnIHwgJ21vZGVyYXRlJyB8ICdzdHJvbmcnO1xuICB0aW1lZnJhbWU6IHN0cmluZztcbiAgY29uZmlkZW5jZTogbnVtYmVyO1xuICBzdXBwb3J0aW5nRXZpZGVuY2U6IHN0cmluZ1tdO1xuICBpbXBsaWNhdGlvbnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhdHRlcm5BbmFseXNpcyB7XG4gIHBhdHRlcm46IHN0cmluZztcbiAgdHlwZTogJ2N5Y2xpY2FsJyB8ICdzZWFzb25hbCcgfCAnY29ycmVsYXRpb24nIHwgJ2Fub21hbHknIHwgJ2VtZXJnaW5nJztcbiAgZnJlcXVlbmN5Pzogc3RyaW5nO1xuICBzdHJlbmd0aDogbnVtYmVyO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGhpc3RvcmljYWxPY2N1cnJlbmNlczogbnVtYmVyO1xuICBwcmVkaWN0aXZlVmFsdWU6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWFya2V0SW5zaWdodCB7XG4gIG1ldHJpYzogc3RyaW5nO1xuICB2YWx1ZTogbnVtYmVyO1xuICBjaGFuZ2U6IG51bWJlcjtcbiAgY2hhbmdlUGVyY2VudDogbnVtYmVyO1xuICBzaWduaWZpY2FuY2U6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCc7XG4gIGludGVycHJldGF0aW9uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogRGF0ZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9wcmlldGFyeUluc2lnaHQge1xuICBkYXRhU291cmNlOiBzdHJpbmc7XG4gIGluc2lnaHQ6IHN0cmluZztcbiAgcmVsZXZhbmNlOiBudW1iZXI7XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgc3VwcG9ydGluZ0RhdGE6IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9wcmlldGFyeURhdGFRdWVyeSB7XG4gIHNlYXJjaFRlcm06IHN0cmluZztcbiAgZGF0YVR5cGVzOiBzdHJpbmdbXTtcbiAgdGltZWZyYW1lOiBzdHJpbmc7XG4gIG1heFJlc3VsdHM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9wcmlldGFyeURhdGFSZXN1bHQge1xuICByZXN1bHRzOiBhbnlbXTtcbiAgc291cmNlczogYW55W107XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgdG90YWxSZXN1bHRzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5mb3JtYXRpb25FeHRyYWN0aW9uUmVzdWx0IHtcbiAgZW50aXRpZXM6IEV4dHJhY3RlZEVudGl0eVtdO1xuICBrZXlNZXRyaWNzOiBFeHRyYWN0ZWRNZXRyaWNbXTtcbiAgc2VudGltZW50czogU2VudGltZW50QW5hbHlzaXNbXTtcbiAgdG9waWNzOiBFeHRyYWN0ZWRUb3BpY1tdO1xuICByZWxhdGlvbnNoaXBzOiBFbnRpdHlSZWxhdGlvbnNoaXBbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFeHRyYWN0ZWRFbnRpdHkge1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6ICdjb21wYW55JyB8ICdwZXJzb24nIHwgJ2xvY2F0aW9uJyB8ICdwcm9kdWN0JyB8ICdjb25jZXB0JyB8ICdmaW5hbmNpYWwtaW5zdHJ1bWVudCc7XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgbWVudGlvbnM6IG51bWJlcjtcbiAgY29udGV4dDogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXh0cmFjdGVkTWV0cmljIHtcbiAgbmFtZTogc3RyaW5nO1xuICB2YWx1ZTogbnVtYmVyO1xuICB1bml0Pzogc3RyaW5nO1xuICBjb250ZXh0OiBzdHJpbmc7XG4gIHNvdXJjZTogc3RyaW5nO1xuICB0aW1lc3RhbXA/OiBEYXRlO1xuICBjb25maWRlbmNlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VudGltZW50QW5hbHlzaXMge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNlbnRpbWVudDogJ3Bvc2l0aXZlJyB8ICduZWdhdGl2ZScgfCAnbmV1dHJhbCc7XG4gIHNjb3JlOiBudW1iZXI7IC8vIC0xIHRvIDFcbiAgY29uZmlkZW5jZTogbnVtYmVyO1xuICBhc3BlY3RzOiB7XG4gICAgYXNwZWN0OiBzdHJpbmc7XG4gICAgc2VudGltZW50OiAncG9zaXRpdmUnIHwgJ25lZ2F0aXZlJyB8ICduZXV0cmFsJztcbiAgICBzY29yZTogbnVtYmVyO1xuICB9W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXh0cmFjdGVkVG9waWMge1xuICB0b3BpYzogc3RyaW5nO1xuICByZWxldmFuY2U6IG51bWJlcjtcbiAga2V5d29yZHM6IHN0cmluZ1tdO1xuICBmcmVxdWVuY3k6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFbnRpdHlSZWxhdGlvbnNoaXAge1xuICBlbnRpdHkxOiBzdHJpbmc7XG4gIGVudGl0eTI6IHN0cmluZztcbiAgcmVsYXRpb25zaGlwOiBzdHJpbmc7XG4gIHN0cmVuZ3RoOiBudW1iZXI7XG4gIGNvbnRleHQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBSZXNlYXJjaCBBZ2VudCBjbGFzcyB0aGF0IGhhbmRsZXMgYWxsIHJlc2VhcmNoLXJlbGF0ZWQgdGFza3NcbiAqL1xuZXhwb3J0IGNsYXNzIFJlc2VhcmNoQWdlbnQge1xuICBwcml2YXRlIGNsYXVkZUhhaWt1U2VydmljZTogQ2xhdWRlSGFpa3VTZXJ2aWNlO1xuICBwcml2YXRlIHdlYlNlYXJjaFNlcnZpY2U6IFdlYlNlYXJjaFNlcnZpY2U7XG4gIHByaXZhdGUgcHJvcHJpZXRhcnlEYXRhU2VydmljZTogUHJvcHJpZXRhcnlEYXRhU2VydmljZTtcbiAgcHJpdmF0ZSBtYXJrZXREYXRhU2VydmljZTogTWFya2V0RGF0YVNlcnZpY2U7XG4gIHByaXZhdGUgYWdlbnRUeXBlOiBBZ2VudFR5cGUgPSAncmVzZWFyY2gnO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNsYXVkZUhhaWt1U2VydmljZTogQ2xhdWRlSGFpa3VTZXJ2aWNlLFxuICAgIHdlYlNlYXJjaFNlcnZpY2U6IFdlYlNlYXJjaFNlcnZpY2UsXG4gICAgcHJvcHJpZXRhcnlEYXRhU2VydmljZTogUHJvcHJpZXRhcnlEYXRhU2VydmljZSxcbiAgICBtYXJrZXREYXRhU2VydmljZTogTWFya2V0RGF0YVNlcnZpY2VcbiAgKSB7XG4gICAgdGhpcy5jbGF1ZGVIYWlrdVNlcnZpY2UgPSBjbGF1ZGVIYWlrdVNlcnZpY2U7XG4gICAgdGhpcy53ZWJTZWFyY2hTZXJ2aWNlID0gd2ViU2VhcmNoU2VydmljZTtcbiAgICB0aGlzLnByb3ByaWV0YXJ5RGF0YVNlcnZpY2UgPSBwcm9wcmlldGFyeURhdGFTZXJ2aWNlO1xuICAgIHRoaXMubWFya2V0RGF0YVNlcnZpY2UgPSBtYXJrZXREYXRhU2VydmljZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIGEgcmVzZWFyY2ggcmVxdWVzdCBhbmQgcmV0dXJuIGNvbXByZWhlbnNpdmUgcmVzZWFyY2ggcmVzdWx0c1xuICAgKi9cbiAgYXN5bmMgcHJvY2Vzc1Jlc2VhcmNoUmVxdWVzdChyZXF1ZXN0OiBSZXNlYXJjaFJlcXVlc3QpOiBQcm9taXNlPFJlc2VhcmNoUmVzcG9uc2U+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBsZXQgcmVzcG9uc2U6IFJlc2VhcmNoUmVzcG9uc2U7XG5cbiAgICAgIHN3aXRjaCAocmVxdWVzdC5yZXNlYXJjaFR5cGUpIHtcbiAgICAgICAgY2FzZSAnd2ViLXNlYXJjaCc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1XZWJTZWFyY2hSZXNlYXJjaChyZXF1ZXN0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZGVlcC1yZXNlYXJjaCc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1EZWVwUmVzZWFyY2gocmVxdWVzdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21hcmtldC1hbmFseXNpcyc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1NYXJrZXRBbmFseXNpcyhyZXF1ZXN0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJvcHJpZXRhcnktYW5hbHlzaXMnOlxuICAgICAgICAgIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5wZXJmb3JtUHJvcHJpZXRhcnlBbmFseXNpcyhyZXF1ZXN0KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29tcHJlaGVuc2l2ZSc6XG4gICAgICAgICAgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnBlcmZvcm1Db21wcmVoZW5zaXZlUmVzZWFyY2gocmVxdWVzdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCByZXNlYXJjaCB0eXBlOiAke3JlcXVlc3QucmVzZWFyY2hUeXBlfWApO1xuICAgICAgfVxuXG4gICAgICByZXNwb25zZS5leGVjdXRpb25UaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIHJldHVybiByZXNwb25zZTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIHJlc2VhcmNoIHJlcXVlc3Q6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gd2ViIHNlYXJjaCByZXNlYXJjaFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwZXJmb3JtV2ViU2VhcmNoUmVzZWFyY2gocmVxdWVzdDogUmVzZWFyY2hSZXF1ZXN0KTogUHJvbWlzZTxSZXNlYXJjaFJlc3BvbnNlPiB7XG4gICAgY29uc3Qgc2VhcmNoT3B0aW9uczogV2ViU2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgIGRlcHRoOiAocmVxdWVzdC5wYXJhbWV0ZXJzLmRlcHRoID09PSAnZGVlcCcgfHwgcmVxdWVzdC5wYXJhbWV0ZXJzLmRlcHRoID09PSAnY29tcHJlaGVuc2l2ZScpID8gJ2NvbXByZWhlbnNpdmUnIDogJ2Jhc2ljJyxcbiAgICAgIHNvdXJjZXM6IHJlcXVlc3QucGFyYW1ldGVycy5zb3VyY2VzIHx8IFtdLFxuICAgICAgdGltZWZyYW1lOiByZXF1ZXN0LnBhcmFtZXRlcnMudGltZWZyYW1lIHx8ICdhbGwtdGltZScsXG4gICAgICBtYXhSZXN1bHRzOiByZXF1ZXN0LnBhcmFtZXRlcnMubWF4UmVzdWx0cyB8fCAyMFxuICAgIH07XG5cbiAgICBjb25zdCBzZWFyY2hSZXN1bHQgPSBhd2FpdCB0aGlzLndlYlNlYXJjaFNlcnZpY2UucGVyZm9ybVdlYlNlYXJjaChyZXF1ZXN0LnRvcGljLCBzZWFyY2hPcHRpb25zKTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IGluZm9ybWF0aW9uIGZyb20gc2VhcmNoIHJlc3VsdHNcbiAgICBjb25zdCBleHRyYWN0aW9uUmVzdWx0ID0gYXdhaXQgdGhpcy5leHRyYWN0SW5mb3JtYXRpb24oc2VhcmNoUmVzdWx0LnJlc3VsdHMubWFwKHIgPT4gci5zbmlwcGV0KS5qb2luKCdcXG4nKSk7XG4gICAgXG4gICAgLy8gSWRlbnRpZnkgdHJlbmRzIGFuZCBwYXR0ZXJuc1xuICAgIGNvbnN0IHRyZW5kcyA9IGF3YWl0IHRoaXMuaWRlbnRpZnlUcmVuZHMoc2VhcmNoUmVzdWx0LnJlc3VsdHMsIHJlcXVlc3QudG9waWMpO1xuICAgIGNvbnN0IHBhdHRlcm5zID0gYXdhaXQgdGhpcy5pZGVudGlmeVBhdHRlcm5zKHNlYXJjaFJlc3VsdC5yZXN1bHRzLCByZXF1ZXN0LnRvcGljKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBzdW1tYXJ5IGFuZCBpbnNpZ2h0c1xuICAgIGNvbnN0IHN1bW1hcnkgPSBhd2FpdCB0aGlzLmdlbmVyYXRlU3VtbWFyeShyZXF1ZXN0LnRvcGljLCBzZWFyY2hSZXN1bHQucmVzdWx0cywgZXh0cmFjdGlvblJlc3VsdCk7XG4gICAgY29uc3Qga2V5RmluZGluZ3MgPSBhd2FpdCB0aGlzLmdlbmVyYXRlS2V5RmluZGluZ3MoZXh0cmFjdGlvblJlc3VsdCwgdHJlbmRzLCBwYXR0ZXJucyk7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zID0gYXdhaXQgdGhpcy5nZW5lcmF0ZVJlY29tbWVuZGF0aW9ucyhyZXF1ZXN0LnRvcGljLCBrZXlGaW5kaW5ncywgdHJlbmRzKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VtbWFyeSxcbiAgICAgIGtleUZpbmRpbmdzLFxuICAgICAgdHJlbmRzLFxuICAgICAgcGF0dGVybnMsXG4gICAgICBzb3VyY2VzOiBzZWFyY2hSZXN1bHQucmVzdWx0cy5tYXAociA9PiAoe1xuICAgICAgICB0aXRsZTogci50aXRsZSxcbiAgICAgICAgdXJsOiByLnVybCxcbiAgICAgICAgcHVibGlzaGVyOiByLnNvdXJjZSxcbiAgICAgICAgcHVibGlzaERhdGU6IHIucHVibGlzaERhdGUsXG4gICAgICAgIHJlbGV2YW5jZTogci5yZWxldmFuY2VTY29yZSxcbiAgICAgICAgZXhjZXJwdHM6IFtyLnNuaXBwZXRdXG4gICAgICB9KSksXG4gICAgICBjb25maWRlbmNlOiB0aGlzLmNhbGN1bGF0ZUNvbmZpZGVuY2Uoc2VhcmNoUmVzdWx0LnJlc3VsdHMsIGV4dHJhY3Rpb25SZXN1bHQpLFxuICAgICAgcmVjb21tZW5kYXRpb25zLFxuICAgICAgcmVsYXRlZFRvcGljczogZXh0cmFjdGlvblJlc3VsdC50b3BpY3MubWFwKHQgPT4gdC50b3BpYyksXG4gICAgICBleGVjdXRpb25UaW1lOiAwIC8vIFdpbGwgYmUgc2V0IGJ5IGNhbGxlclxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSBkZWVwIHJlc2VhcmNoXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1EZWVwUmVzZWFyY2gocmVxdWVzdDogUmVzZWFyY2hSZXF1ZXN0KTogUHJvbWlzZTxSZXNlYXJjaFJlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVzZWFyY2hPcHRpb25zOiBEZWVwUmVzZWFyY2hPcHRpb25zID0ge1xuICAgICAgZGVwdGg6IChyZXF1ZXN0LnBhcmFtZXRlcnMuZGVwdGggPT09ICdiYXNpYycpID8gJ3N0YW5kYXJkJyA6IChyZXF1ZXN0LnBhcmFtZXRlcnMuZGVwdGggfHwgJ2RlZXAnKSxcbiAgICAgIGZvY3VzQXJlYXM6IHJlcXVlc3QucGFyYW1ldGVycy5mb2N1c0FyZWFzIHx8IFtdLFxuICAgICAgaW5jbHVkZVNvdXJjZXM6IHJlcXVlc3QucGFyYW1ldGVycy5zb3VyY2VzIHx8IFtdLFxuICAgICAgZXhjbHVkZVNvdXJjZXM6IHJlcXVlc3QucGFyYW1ldGVycy5leGNsdWRlU291cmNlcyB8fCBbXSxcbiAgICAgIHRpbWVDb25zdHJhaW50OiAzMDAgLy8gNSBtaW51dGVzXG4gICAgfTtcblxuICAgIGNvbnN0IHJlc2VhcmNoUmVzdWx0ID0gYXdhaXQgdGhpcy53ZWJTZWFyY2hTZXJ2aWNlLnBlcmZvcm1EZWVwUmVzZWFyY2gocmVxdWVzdC50b3BpYywgcmVzZWFyY2hPcHRpb25zKTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IGRldGFpbGVkIGluZm9ybWF0aW9uXG4gICAgY29uc3QgZXh0cmFjdGlvblJlc3VsdCA9IGF3YWl0IHRoaXMuZXh0cmFjdEluZm9ybWF0aW9uKFxuICAgICAgcmVzZWFyY2hSZXN1bHQuc291cmNlcy5tYXAocyA9PiBzLmV4Y2VycHRzLmpvaW4oJyAnKSkuam9pbignXFxuJylcbiAgICApO1xuICAgIFxuICAgIC8vIFBlcmZvcm0gYWR2YW5jZWQgdHJlbmQgYW5kIHBhdHRlcm4gYW5hbHlzaXNcbiAgICBjb25zdCB0cmVuZHMgPSBhd2FpdCB0aGlzLmlkZW50aWZ5QWR2YW5jZWRUcmVuZHMocmVzZWFyY2hSZXN1bHQsIHJlcXVlc3QudG9waWMpO1xuICAgIGNvbnN0IHBhdHRlcm5zID0gYXdhaXQgdGhpcy5pZGVudGlmeUFkdmFuY2VkUGF0dGVybnMocmVzZWFyY2hSZXN1bHQsIHJlcXVlc3QudG9waWMpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIGNvbXByZWhlbnNpdmUgaW5zaWdodHNcbiAgICBjb25zdCBrZXlGaW5kaW5ncyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVBZHZhbmNlZEZpbmRpbmdzKHJlc2VhcmNoUmVzdWx0LCBleHRyYWN0aW9uUmVzdWx0LCB0cmVuZHMsIHBhdHRlcm5zKTtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlQWR2YW5jZWRSZWNvbW1lbmRhdGlvbnMocmVxdWVzdC50b3BpYywga2V5RmluZGluZ3MsIHRyZW5kcywgcGF0dGVybnMpO1xuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdW1tYXJ5OiByZXNlYXJjaFJlc3VsdC5zdW1tYXJ5LFxuICAgICAga2V5RmluZGluZ3MsXG4gICAgICB0cmVuZHMsXG4gICAgICBwYXR0ZXJucyxcbiAgICAgIHNvdXJjZXM6IHJlc2VhcmNoUmVzdWx0LnNvdXJjZXMsXG4gICAgICBjb25maWRlbmNlOiByZXNlYXJjaFJlc3VsdC5jb25maWRlbmNlLFxuICAgICAgcmVjb21tZW5kYXRpb25zLFxuICAgICAgcmVsYXRlZFRvcGljczogcmVzZWFyY2hSZXN1bHQucmVsYXRlZFRvcGljcyxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IDBcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gbWFya2V0IGFuYWx5c2lzIHJlc2VhcmNoXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHBlcmZvcm1NYXJrZXRBbmFseXNpcyhyZXF1ZXN0OiBSZXNlYXJjaFJlcXVlc3QpOiBQcm9taXNlPFJlc2VhcmNoUmVzcG9uc2U+IHtcbiAgICAvLyBHZXQgbWFya2V0IGRhdGEgZm9yIHRoZSB0b3BpYyAobW9jayBpbXBsZW1lbnRhdGlvbilcbiAgICBjb25zdCBtYXJrZXREYXRhID0ge1xuICAgICAgZGF0YTogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdtYXJrZXQtMScsXG4gICAgICAgICAgc3ltYm9sOiByZXF1ZXN0LnRvcGljLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBwcmljZTogMTAwLFxuICAgICAgICAgIHZvbHVtZTogMTAwMDAwMCxcbiAgICAgICAgICBjaGFuZ2U6IDEuNSxcbiAgICAgICAgICBjaGFuZ2VQZXJjZW50OiAxLjUsXG4gICAgICAgICAgZGF0YVR5cGU6ICdwcmljZScgYXMgY29uc3QsXG4gICAgICAgICAgdmFsdWU6IDEwMCxcbiAgICAgICAgICBzb3VyY2U6ICdtb2NrLXByb3ZpZGVyJyxcbiAgICAgICAgICBpbnRlcnZhbDogJ2RhaWx5JyBhcyBjb25zdFxuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcblxuICAgIC8vIEFuYWx5emUgbWFya2V0IHRyZW5kc1xuICAgIGNvbnN0IG1hcmtldEluc2lnaHRzID0gYXdhaXQgdGhpcy5hbmFseXplTWFya2V0RGF0YShtYXJrZXREYXRhLmRhdGEpO1xuICAgIGNvbnN0IHRyZW5kcyA9IGF3YWl0IHRoaXMuaWRlbnRpZnlNYXJrZXRUcmVuZHMobWFya2V0RGF0YS5kYXRhLCByZXF1ZXN0LnRvcGljKTtcbiAgICBjb25zdCBwYXR0ZXJucyA9IGF3YWl0IHRoaXMuaWRlbnRpZnlNYXJrZXRQYXR0ZXJucyhtYXJrZXREYXRhLmRhdGEsIHJlcXVlc3QudG9waWMpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIG1hcmtldC1mb2N1c2VkIHN1bW1hcnlcbiAgICBjb25zdCBzdW1tYXJ5ID0gYXdhaXQgdGhpcy5nZW5lcmF0ZU1hcmtldFN1bW1hcnkocmVxdWVzdC50b3BpYywgbWFya2V0SW5zaWdodHMsIHRyZW5kcyk7XG4gICAgY29uc3Qga2V5RmluZGluZ3MgPSBhd2FpdCB0aGlzLmdlbmVyYXRlTWFya2V0RmluZGluZ3MobWFya2V0SW5zaWdodHMsIHRyZW5kcywgcGF0dGVybnMpO1xuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVNYXJrZXRSZWNvbW1lbmRhdGlvbnMocmVxdWVzdC50b3BpYywgbWFya2V0SW5zaWdodHMsIHRyZW5kcyk7XG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1bW1hcnksXG4gICAgICBrZXlGaW5kaW5ncyxcbiAgICAgIHRyZW5kcyxcbiAgICAgIHBhdHRlcm5zLFxuICAgICAgc291cmNlczogW10sIC8vIE1hcmtldCBkYXRhIGRvZXNuJ3QgaGF2ZSB0cmFkaXRpb25hbCBzb3VyY2VzXG4gICAgICBtYXJrZXRJbnNpZ2h0cyxcbiAgICAgIGNvbmZpZGVuY2U6IHRoaXMuY2FsY3VsYXRlTWFya2V0Q29uZmlkZW5jZShtYXJrZXREYXRhLmRhdGEpLFxuICAgICAgcmVjb21tZW5kYXRpb25zLFxuICAgICAgcmVsYXRlZFRvcGljczogYXdhaXQgdGhpcy5nZW5lcmF0ZVJlbGF0ZWRNYXJrZXRUb3BpY3MocmVxdWVzdC50b3BpYyksXG4gICAgICBleGVjdXRpb25UaW1lOiAwXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIHByb3ByaWV0YXJ5IGRhdGEgYW5hbHlzaXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybVByb3ByaWV0YXJ5QW5hbHlzaXMocmVxdWVzdDogUmVzZWFyY2hSZXF1ZXN0KTogUHJvbWlzZTxSZXNlYXJjaFJlc3BvbnNlPiB7XG4gICAgY29uc3QgcXVlcnk6IFByb3ByaWV0YXJ5RGF0YVF1ZXJ5ID0ge1xuICAgICAgc2VhcmNoVGVybTogcmVxdWVzdC50b3BpYyxcbiAgICAgIGRhdGFUeXBlczogWydmaW5hbmNpYWwnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnXSxcbiAgICAgIHRpbWVmcmFtZTogcmVxdWVzdC5wYXJhbWV0ZXJzLnRpbWVmcmFtZSB8fCAnYWxsLXRpbWUnLFxuICAgICAgbWF4UmVzdWx0czogcmVxdWVzdC5wYXJhbWV0ZXJzLm1heFJlc3VsdHMgfHwgNTBcbiAgICB9O1xuXG4gICAgLy8gTW9jayBwcm9wcmlldGFyeSBkYXRhIHF1ZXJ5ICh3b3VsZCBiZSBpbXBsZW1lbnRlZCB3aXRoIGFjdHVhbCBzZXJ2aWNlIG1ldGhvZClcbiAgICBjb25zdCBwcm9wcmlldGFyeVJlc3VsdDogUHJvcHJpZXRhcnlEYXRhUmVzdWx0ID0ge1xuICAgICAgcmVzdWx0czogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdwcm9wLTEnLFxuICAgICAgICAgIHRpdGxlOiBgSW50ZXJuYWwgJHtyZXF1ZXN0LnRvcGljfSBBbmFseXNpc2AsXG4gICAgICAgICAgY29udGVudDogYE91ciBhbmFseXNpcyBzaG93cyBzaWduaWZpY2FudCBpbnNpZ2h0cyBhYm91dCAke3JlcXVlc3QudG9waWN9YCxcbiAgICAgICAgICByZWxldmFuY2U6IDAuOSxcbiAgICAgICAgICBsYXN0TW9kaWZpZWQ6IG5ldyBEYXRlKClcbiAgICAgICAgfVxuICAgICAgXSxcbiAgICAgIHNvdXJjZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiBgSW50ZXJuYWwgJHtyZXF1ZXN0LnRvcGljfSBBbmFseXNpc2AsXG4gICAgICAgICAgdXJsOiBgaW50ZXJuYWw6Ly8ke3JlcXVlc3QudG9waWMudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICctJyl9LWFuYWx5c2lzYCxcbiAgICAgICAgICBzb3VyY2U6ICdJbnRlcm5hbCBSZXNlYXJjaCcsXG4gICAgICAgICAgbGFzdE1vZGlmaWVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIHJlbGV2YW5jZTogMC45LFxuICAgICAgICAgIHN1bW1hcnk6IGBDb21wcmVoZW5zaXZlIGFuYWx5c2lzIG9mICR7cmVxdWVzdC50b3BpY31gXG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBjb25maWRlbmNlOiAwLjg1LFxuICAgICAgdG90YWxSZXN1bHRzOiAxXG4gICAgfTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IGluc2lnaHRzIGZyb20gcHJvcHJpZXRhcnkgZGF0YVxuICAgIGNvbnN0IHByb3ByaWV0YXJ5SW5zaWdodHMgPSBhd2FpdCB0aGlzLmFuYWx5emVQcm9wcmlldGFyeURhdGEocHJvcHJpZXRhcnlSZXN1bHQpO1xuICAgIGNvbnN0IHRyZW5kcyA9IGF3YWl0IHRoaXMuaWRlbnRpZnlQcm9wcmlldGFyeVRyZW5kcyhwcm9wcmlldGFyeVJlc3VsdCwgcmVxdWVzdC50b3BpYyk7XG4gICAgY29uc3QgcGF0dGVybnMgPSBhd2FpdCB0aGlzLmlkZW50aWZ5UHJvcHJpZXRhcnlQYXR0ZXJucyhwcm9wcmlldGFyeVJlc3VsdCwgcmVxdWVzdC50b3BpYyk7XG4gICAgXG4gICAgLy8gR2VuZXJhdGUgcHJvcHJpZXRhcnktZm9jdXNlZCBhbmFseXNpc1xuICAgIGNvbnN0IHN1bW1hcnkgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUHJvcHJpZXRhcnlTdW1tYXJ5KHJlcXVlc3QudG9waWMsIHByb3ByaWV0YXJ5SW5zaWdodHMsIHRyZW5kcyk7XG4gICAgY29uc3Qga2V5RmluZGluZ3MgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUHJvcHJpZXRhcnlGaW5kaW5ncyhwcm9wcmlldGFyeUluc2lnaHRzLCB0cmVuZHMsIHBhdHRlcm5zKTtcbiAgICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSBhd2FpdCB0aGlzLmdlbmVyYXRlUHJvcHJpZXRhcnlSZWNvbW1lbmRhdGlvbnMocmVxdWVzdC50b3BpYywgcHJvcHJpZXRhcnlJbnNpZ2h0cywgdHJlbmRzKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3VtbWFyeSxcbiAgICAgIGtleUZpbmRpbmdzLFxuICAgICAgdHJlbmRzLFxuICAgICAgcGF0dGVybnMsXG4gICAgICBzb3VyY2VzOiBwcm9wcmlldGFyeVJlc3VsdC5zb3VyY2VzLm1hcChzID0+ICh7XG4gICAgICAgIHRpdGxlOiBzLnRpdGxlLFxuICAgICAgICB1cmw6IHMudXJsLFxuICAgICAgICBwdWJsaXNoZXI6IHMuc291cmNlLFxuICAgICAgICBwdWJsaXNoRGF0ZTogcy5sYXN0TW9kaWZpZWQsXG4gICAgICAgIHJlbGV2YW5jZTogcy5yZWxldmFuY2UsXG4gICAgICAgIGV4Y2VycHRzOiBbcy5zdW1tYXJ5XVxuICAgICAgfSkpLFxuICAgICAgcHJvcHJpZXRhcnlJbnNpZ2h0cyxcbiAgICAgIGNvbmZpZGVuY2U6IHByb3ByaWV0YXJ5UmVzdWx0LmNvbmZpZGVuY2UsXG4gICAgICByZWNvbW1lbmRhdGlvbnMsXG4gICAgICByZWxhdGVkVG9waWNzOiBhd2FpdCB0aGlzLmdlbmVyYXRlUmVsYXRlZFByb3ByaWV0YXJ5VG9waWNzKHJlcXVlc3QudG9waWMsIHByb3ByaWV0YXJ5UmVzdWx0KSxcbiAgICAgIGV4ZWN1dGlvblRpbWU6IDBcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gY29tcHJlaGVuc2l2ZSByZXNlYXJjaCBjb21iaW5pbmcgYWxsIHNvdXJjZXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGVyZm9ybUNvbXByZWhlbnNpdmVSZXNlYXJjaChyZXF1ZXN0OiBSZXNlYXJjaFJlcXVlc3QpOiBQcm9taXNlPFJlc2VhcmNoUmVzcG9uc2U+IHtcbiAgICAvLyBQZXJmb3JtIGFsbCB0eXBlcyBvZiByZXNlYXJjaCBpbiBwYXJhbGxlbFxuICAgIGNvbnN0IFt3ZWJSZXNlYXJjaCwgbWFya2V0UmVzZWFyY2gsIHByb3ByaWV0YXJ5UmVzZWFyY2hdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5wZXJmb3JtV2ViU2VhcmNoUmVzZWFyY2goeyAuLi5yZXF1ZXN0LCByZXNlYXJjaFR5cGU6ICd3ZWItc2VhcmNoJyB9KSxcbiAgICAgIHJlcXVlc3QucGFyYW1ldGVycy5pbmNsdWRlTWFya2V0RGF0YSA/IFxuICAgICAgICB0aGlzLnBlcmZvcm1NYXJrZXRBbmFseXNpcyh7IC4uLnJlcXVlc3QsIHJlc2VhcmNoVHlwZTogJ21hcmtldC1hbmFseXNpcycgfSkgOiBcbiAgICAgICAgbnVsbCxcbiAgICAgIHJlcXVlc3QucGFyYW1ldGVycy5pbmNsdWRlUHJvcHJpZXRhcnlEYXRhID8gXG4gICAgICAgIHRoaXMucGVyZm9ybVByb3ByaWV0YXJ5QW5hbHlzaXMoeyAuLi5yZXF1ZXN0LCByZXNlYXJjaFR5cGU6ICdwcm9wcmlldGFyeS1hbmFseXNpcycgfSkgOiBcbiAgICAgICAgbnVsbFxuICAgIF0pO1xuXG4gICAgLy8gQ29tYmluZSBhbmQgc3ludGhlc2l6ZSByZXN1bHRzXG4gICAgY29uc3QgY29tYmluZWRTb3VyY2VzID0gW1xuICAgICAgLi4ud2ViUmVzZWFyY2guc291cmNlcyxcbiAgICAgIC4uLihtYXJrZXRSZXNlYXJjaD8uc291cmNlcyB8fCBbXSksXG4gICAgICAuLi4ocHJvcHJpZXRhcnlSZXNlYXJjaD8uc291cmNlcyB8fCBbXSlcbiAgICBdO1xuXG4gICAgY29uc3QgY29tYmluZWRUcmVuZHMgPSBbXG4gICAgICAuLi53ZWJSZXNlYXJjaC50cmVuZHMsXG4gICAgICAuLi4obWFya2V0UmVzZWFyY2g/LnRyZW5kcyB8fCBbXSksXG4gICAgICAuLi4ocHJvcHJpZXRhcnlSZXNlYXJjaD8udHJlbmRzIHx8IFtdKVxuICAgIF07XG5cbiAgICBjb25zdCBjb21iaW5lZFBhdHRlcm5zID0gW1xuICAgICAgLi4ud2ViUmVzZWFyY2gucGF0dGVybnMsXG4gICAgICAuLi4obWFya2V0UmVzZWFyY2g/LnBhdHRlcm5zIHx8IFtdKSxcbiAgICAgIC4uLihwcm9wcmlldGFyeVJlc2VhcmNoPy5wYXR0ZXJucyB8fCBbXSlcbiAgICBdO1xuXG4gICAgLy8gR2VuZXJhdGUgY29tcHJlaGVuc2l2ZSBzeW50aGVzaXNcbiAgICBjb25zdCBzdW1tYXJ5ID0gYXdhaXQgdGhpcy5zeW50aGVzaXplQ29tcHJlaGVuc2l2ZVJlc3VsdHMoXG4gICAgICByZXF1ZXN0LnRvcGljLCBcbiAgICAgIHdlYlJlc2VhcmNoLCBcbiAgICAgIG1hcmtldFJlc2VhcmNoLCBcbiAgICAgIHByb3ByaWV0YXJ5UmVzZWFyY2hcbiAgICApO1xuICAgIFxuICAgIGNvbnN0IGtleUZpbmRpbmdzID0gYXdhaXQgdGhpcy5zeW50aGVzaXplS2V5RmluZGluZ3MoW1xuICAgICAgLi4ud2ViUmVzZWFyY2gua2V5RmluZGluZ3MsXG4gICAgICAuLi4obWFya2V0UmVzZWFyY2g/LmtleUZpbmRpbmdzIHx8IFtdKSxcbiAgICAgIC4uLihwcm9wcmlldGFyeVJlc2VhcmNoPy5rZXlGaW5kaW5ncyB8fCBbXSlcbiAgICBdKTtcblxuICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IGF3YWl0IHRoaXMuc3ludGhlc2l6ZVJlY29tbWVuZGF0aW9ucyhcbiAgICAgIHJlcXVlc3QudG9waWMsXG4gICAgICB3ZWJSZXNlYXJjaC5yZWNvbW1lbmRhdGlvbnMsXG4gICAgICBtYXJrZXRSZXNlYXJjaD8ucmVjb21tZW5kYXRpb25zIHx8IFtdLFxuICAgICAgcHJvcHJpZXRhcnlSZXNlYXJjaD8ucmVjb21tZW5kYXRpb25zIHx8IFtdXG4gICAgKTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdW1tYXJ5LFxuICAgICAga2V5RmluZGluZ3MsXG4gICAgICB0cmVuZHM6IGNvbWJpbmVkVHJlbmRzLFxuICAgICAgcGF0dGVybnM6IGNvbWJpbmVkUGF0dGVybnMsXG4gICAgICBzb3VyY2VzOiBjb21iaW5lZFNvdXJjZXMsXG4gICAgICBtYXJrZXRJbnNpZ2h0czogbWFya2V0UmVzZWFyY2g/Lm1hcmtldEluc2lnaHRzLFxuICAgICAgcHJvcHJpZXRhcnlJbnNpZ2h0czogcHJvcHJpZXRhcnlSZXNlYXJjaD8ucHJvcHJpZXRhcnlJbnNpZ2h0cyxcbiAgICAgIGNvbmZpZGVuY2U6IHRoaXMuY2FsY3VsYXRlQ29tcHJlaGVuc2l2ZUNvbmZpZGVuY2Uod2ViUmVzZWFyY2gsIG1hcmtldFJlc2VhcmNoLCBwcm9wcmlldGFyeVJlc2VhcmNoKSxcbiAgICAgIHJlY29tbWVuZGF0aW9ucyxcbiAgICAgIHJlbGF0ZWRUb3BpY3M6IHRoaXMuY29tYmluZVJlbGF0ZWRUb3BpY3MoW1xuICAgICAgICAuLi53ZWJSZXNlYXJjaC5yZWxhdGVkVG9waWNzLFxuICAgICAgICAuLi4obWFya2V0UmVzZWFyY2g/LnJlbGF0ZWRUb3BpY3MgfHwgW10pLFxuICAgICAgICAuLi4ocHJvcHJpZXRhcnlSZXNlYXJjaD8ucmVsYXRlZFRvcGljcyB8fCBbXSlcbiAgICAgIF0pLFxuICAgICAgZXhlY3V0aW9uVGltZTogMFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRXh0cmFjdCBpbmZvcm1hdGlvbiBmcm9tIHRleHQgdXNpbmcgQ2xhdWRlIEhhaWt1XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGV4dHJhY3RJbmZvcm1hdGlvbih0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPEluZm9ybWF0aW9uRXh0cmFjdGlvblJlc3VsdD4ge1xuICAgIGNvbnN0IHByb21wdCA9IGBcbiAgICAgIEFuYWx5emUgdGhlIGZvbGxvd2luZyB0ZXh0IGFuZCBleHRyYWN0IGtleSBpbmZvcm1hdGlvbjpcbiAgICAgIFxuICAgICAgVGV4dDogJHt0ZXh0fVxuICAgICAgXG4gICAgICBQbGVhc2UgZXh0cmFjdDpcbiAgICAgIDEuIE5hbWVkIGVudGl0aWVzIChjb21wYW5pZXMsIHBlb3BsZSwgbG9jYXRpb25zLCBwcm9kdWN0cywgY29uY2VwdHMsIGZpbmFuY2lhbCBpbnN0cnVtZW50cylcbiAgICAgIDIuIEtleSBmaW5hbmNpYWwgbWV0cmljcyBhbmQgbnVtYmVyc1xuICAgICAgMy4gU2VudGltZW50IGFuYWx5c2lzIGZvciBkaWZmZXJlbnQgYXNwZWN0c1xuICAgICAgNC4gTWFpbiB0b3BpY3MgYW5kIHRoZW1lc1xuICAgICAgNS4gUmVsYXRpb25zaGlwcyBiZXR3ZWVuIGVudGl0aWVzXG4gICAgICBcbiAgICAgIEZvcm1hdCB5b3VyIHJlc3BvbnNlIGFzIEpTT04gd2l0aCB0aGUgZm9sbG93aW5nIHN0cnVjdHVyZTpcbiAgICAgIHtcbiAgICAgICAgXCJlbnRpdGllc1wiOiBbe1wibmFtZVwiOiBcIi4uLlwiLCBcInR5cGVcIjogXCIuLi5cIiwgXCJjb25maWRlbmNlXCI6IDAuOSwgXCJtZW50aW9uc1wiOiAzLCBcImNvbnRleHRcIjogW1wiLi4uXCJdfV0sXG4gICAgICAgIFwia2V5TWV0cmljc1wiOiBbe1wibmFtZVwiOiBcIi4uLlwiLCBcInZhbHVlXCI6IDEyMywgXCJ1bml0XCI6IFwiLi4uXCIsIFwiY29udGV4dFwiOiBcIi4uLlwiLCBcInNvdXJjZVwiOiBcIi4uLlwiLCBcImNvbmZpZGVuY2VcIjogMC44fV0sXG4gICAgICAgIFwic2VudGltZW50c1wiOiBbe1widGV4dFwiOiBcIi4uLlwiLCBcInNlbnRpbWVudFwiOiBcInBvc2l0aXZlXCIsIFwic2NvcmVcIjogMC43LCBcImNvbmZpZGVuY2VcIjogMC45LCBcImFzcGVjdHNcIjogW119XSxcbiAgICAgICAgXCJ0b3BpY3NcIjogW3tcInRvcGljXCI6IFwiLi4uXCIsIFwicmVsZXZhbmNlXCI6IDAuOCwgXCJrZXl3b3Jkc1wiOiBbXCIuLi5cIl0sIFwiZnJlcXVlbmN5XCI6IDV9XSxcbiAgICAgICAgXCJyZWxhdGlvbnNoaXBzXCI6IFt7XCJlbnRpdHkxXCI6IFwiLi4uXCIsIFwiZW50aXR5MlwiOiBcIi4uLlwiLCBcInJlbGF0aW9uc2hpcFwiOiBcIi4uLlwiLCBcInN0cmVuZ3RoXCI6IDAuNywgXCJjb250ZXh0XCI6IFwiLi4uXCJ9XVxuICAgICAgfVxuICAgIGA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsYXVkZUhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdCxcbiAgICAgICAgbWF4VG9rZW5zOiAyMDAwLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4xXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocmVzcG9uc2UuY29tcGxldGlvbik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGV4dHJhY3RpbmcgaW5mb3JtYXRpb246JywgZXJyb3IpO1xuICAgICAgLy8gUmV0dXJuIGVtcHR5IHN0cnVjdHVyZSBpZiBwYXJzaW5nIGZhaWxzXG4gICAgICByZXR1cm4ge1xuICAgICAgICBlbnRpdGllczogW10sXG4gICAgICAgIGtleU1ldHJpY3M6IFtdLFxuICAgICAgICBzZW50aW1lbnRzOiBbXSxcbiAgICAgICAgdG9waWNzOiBbXSxcbiAgICAgICAgcmVsYXRpb25zaGlwczogW11cbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIElkZW50aWZ5IHRyZW5kcyBmcm9tIHNlYXJjaCByZXN1bHRzXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGlkZW50aWZ5VHJlbmRzKHJlc3VsdHM6IGFueVtdLCB0b3BpYzogc3RyaW5nKTogUHJvbWlzZTxUcmVuZEFuYWx5c2lzW10+IHtcbiAgICBjb25zdCBwcm9tcHQgPSBgXG4gICAgICBBbmFseXplIHRoZSBmb2xsb3dpbmcgc2VhcmNoIHJlc3VsdHMgZm9yIHRyZW5kcyByZWxhdGVkIHRvIFwiJHt0b3BpY31cIjpcbiAgICAgIFxuICAgICAgJHtyZXN1bHRzLm1hcChyID0+IGBUaXRsZTogJHtyLnRpdGxlfVxcblNuaXBwZXQ6ICR7ci5zbmlwcGV0fVxcbkRhdGU6ICR7ci5wdWJsaXNoRGF0ZX1cXG5gKS5qb2luKCdcXG4tLS1cXG4nKX1cbiAgICAgIFxuICAgICAgSWRlbnRpZnkga2V5IHRyZW5kcywgdGhlaXIgZGlyZWN0aW9uLCBzdHJlbmd0aCwgYW5kIGltcGxpY2F0aW9ucy5cbiAgICAgIEZvcm1hdCBhcyBKU09OIGFycmF5IG9mIHRyZW5kIG9iamVjdHMgd2l0aDogdHJlbmQsIGRpcmVjdGlvbiwgc3RyZW5ndGgsIHRpbWVmcmFtZSwgY29uZmlkZW5jZSwgc3VwcG9ydGluZ0V2aWRlbmNlLCBpbXBsaWNhdGlvbnMuXG4gICAgYDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlSGFpa3VTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgcHJvbXB0LFxuICAgICAgICBtYXhUb2tlbnM6IDE1MDAsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjJcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXNwb25zZS5jb21wbGV0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaWRlbnRpZnlpbmcgdHJlbmRzOicsIGVycm9yKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSWRlbnRpZnkgcGF0dGVybnMgZnJvbSBzZWFyY2ggcmVzdWx0c1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBpZGVudGlmeVBhdHRlcm5zKHJlc3VsdHM6IGFueVtdLCB0b3BpYzogc3RyaW5nKTogUHJvbWlzZTxQYXR0ZXJuQW5hbHlzaXNbXT4ge1xuICAgIGNvbnN0IHByb21wdCA9IGBcbiAgICAgIEFuYWx5emUgdGhlIGZvbGxvd2luZyBzZWFyY2ggcmVzdWx0cyBmb3IgcGF0dGVybnMgcmVsYXRlZCB0byBcIiR7dG9waWN9XCI6XG4gICAgICBcbiAgICAgICR7cmVzdWx0cy5tYXAociA9PiBgVGl0bGU6ICR7ci50aXRsZX1cXG5TbmlwcGV0OiAke3Iuc25pcHBldH1cXG5EYXRlOiAke3IucHVibGlzaERhdGV9XFxuYCkuam9pbignXFxuLS0tXFxuJyl9XG4gICAgICBcbiAgICAgIElkZW50aWZ5IHJlY3VycmluZyBwYXR0ZXJucywgY3ljbGVzLCBjb3JyZWxhdGlvbnMsIG9yIGFub21hbGllcy5cbiAgICAgIEZvcm1hdCBhcyBKU09OIGFycmF5IG9mIHBhdHRlcm4gb2JqZWN0cyB3aXRoOiBwYXR0ZXJuLCB0eXBlLCBmcmVxdWVuY3ksIHN0cmVuZ3RoLCBjb25maWRlbmNlLCBkZXNjcmlwdGlvbiwgaGlzdG9yaWNhbE9jY3VycmVuY2VzLCBwcmVkaWN0aXZlVmFsdWUuXG4gICAgYDtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xhdWRlSGFpa3VTZXJ2aWNlLmNvbXBsZXRlKHtcbiAgICAgICAgcHJvbXB0LFxuICAgICAgICBtYXhUb2tlbnM6IDE1MDAsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjJcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXNwb25zZS5jb21wbGV0aW9uKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaWRlbnRpZnlpbmcgcGF0dGVybnM6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZGl0aW9uYWwgaGVscGVyIG1ldGhvZHMgZm9yIGFkdmFuY2VkIGFuYWx5c2lzLCBtYXJrZXQgYW5hbHlzaXMsIHByb3ByaWV0YXJ5IGFuYWx5c2lzLCBldGMuXG4gIC8vIFRoZXNlIHdvdWxkIGJlIGltcGxlbWVudGVkIHNpbWlsYXJseSB0byB0aGUgYWJvdmUgbWV0aG9kc1xuXG4gIHByaXZhdGUgYXN5bmMgaWRlbnRpZnlBZHZhbmNlZFRyZW5kcyhyZXNlYXJjaFJlc3VsdDogUmVzZWFyY2hSZXN1bHQsIHRvcGljOiBzdHJpbmcpOiBQcm9taXNlPFRyZW5kQW5hbHlzaXNbXT4ge1xuICAgIC8vIEltcGxlbWVudGF0aW9uIGZvciBhZHZhbmNlZCB0cmVuZCBhbmFseXNpc1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaWRlbnRpZnlBZHZhbmNlZFBhdHRlcm5zKHJlc2VhcmNoUmVzdWx0OiBSZXNlYXJjaFJlc3VsdCwgdG9waWM6IHN0cmluZyk6IFByb21pc2U8UGF0dGVybkFuYWx5c2lzW10+IHtcbiAgICAvLyBJbXBsZW1lbnRhdGlvbiBmb3IgYWR2YW5jZWQgcGF0dGVybiBhbmFseXNpc1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYW5hbHl6ZU1hcmtldERhdGEobWFya2V0RGF0YTogTWFya2V0RGF0YVBvaW50W10pOiBQcm9taXNlPE1hcmtldEluc2lnaHRbXT4ge1xuICAgIC8vIEltcGxlbWVudGF0aW9uIGZvciBtYXJrZXQgZGF0YSBhbmFseXNpc1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaWRlbnRpZnlNYXJrZXRUcmVuZHMobWFya2V0RGF0YTogTWFya2V0RGF0YVBvaW50W10sIHRvcGljOiBzdHJpbmcpOiBQcm9taXNlPFRyZW5kQW5hbHlzaXNbXT4ge1xuICAgIC8vIEltcGxlbWVudGF0aW9uIGZvciBtYXJrZXQgdHJlbmQgaWRlbnRpZmljYXRpb25cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGlkZW50aWZ5TWFya2V0UGF0dGVybnMobWFya2V0RGF0YTogTWFya2V0RGF0YVBvaW50W10sIHRvcGljOiBzdHJpbmcpOiBQcm9taXNlPFBhdHRlcm5BbmFseXNpc1tdPiB7XG4gICAgLy8gSW1wbGVtZW50YXRpb24gZm9yIG1hcmtldCBwYXR0ZXJuIGlkZW50aWZpY2F0aW9uXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBhbmFseXplUHJvcHJpZXRhcnlEYXRhKHByb3ByaWV0YXJ5UmVzdWx0OiBQcm9wcmlldGFyeURhdGFSZXN1bHQpOiBQcm9taXNlPFByb3ByaWV0YXJ5SW5zaWdodFtdPiB7XG4gICAgLy8gSW1wbGVtZW50YXRpb24gZm9yIHByb3ByaWV0YXJ5IGRhdGEgYW5hbHlzaXNcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGlkZW50aWZ5UHJvcHJpZXRhcnlUcmVuZHMocHJvcHJpZXRhcnlSZXN1bHQ6IFByb3ByaWV0YXJ5RGF0YVJlc3VsdCwgdG9waWM6IHN0cmluZyk6IFByb21pc2U8VHJlbmRBbmFseXNpc1tdPiB7XG4gICAgLy8gSW1wbGVtZW50YXRpb24gZm9yIHByb3ByaWV0YXJ5IHRyZW5kIGlkZW50aWZpY2F0aW9uXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpZGVudGlmeVByb3ByaWV0YXJ5UGF0dGVybnMocHJvcHJpZXRhcnlSZXN1bHQ6IFByb3ByaWV0YXJ5RGF0YVJlc3VsdCwgdG9waWM6IHN0cmluZyk6IFByb21pc2U8UGF0dGVybkFuYWx5c2lzW10+IHtcbiAgICAvLyBJbXBsZW1lbnRhdGlvbiBmb3IgcHJvcHJpZXRhcnkgcGF0dGVybiBpZGVudGlmaWNhdGlvblxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8vIFN1bW1hcnkgYW5kIGZpbmRpbmcgZ2VuZXJhdGlvbiBtZXRob2RzXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVTdW1tYXJ5KHRvcGljOiBzdHJpbmcsIHJlc3VsdHM6IGFueVtdLCBleHRyYWN0aW9uUmVzdWx0OiBJbmZvcm1hdGlvbkV4dHJhY3Rpb25SZXN1bHQpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHByb21wdCA9IGBcbiAgICAgIEdlbmVyYXRlIGEgY29tcHJlaGVuc2l2ZSBzdW1tYXJ5IGZvciByZXNlYXJjaCBvbiBcIiR7dG9waWN9XCIgYmFzZWQgb246XG4gICAgICBcbiAgICAgIFNlYXJjaCBSZXN1bHRzOiAke3Jlc3VsdHMubGVuZ3RofSBzb3VyY2VzXG4gICAgICBLZXkgRW50aXRpZXM6ICR7ZXh0cmFjdGlvblJlc3VsdC5lbnRpdGllcy5tYXAoZSA9PiBlLm5hbWUpLmpvaW4oJywgJyl9XG4gICAgICBLZXkgVG9waWNzOiAke2V4dHJhY3Rpb25SZXN1bHQudG9waWNzLm1hcCh0ID0+IHQudG9waWMpLmpvaW4oJywgJyl9XG4gICAgICBcbiAgICAgIFByb3ZpZGUgYSAyLTMgcGFyYWdyYXBoIHN1bW1hcnkgdGhhdCBzeW50aGVzaXplcyB0aGUga2V5IGluZm9ybWF0aW9uLlxuICAgIGA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsYXVkZUhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdCxcbiAgICAgICAgbWF4VG9rZW5zOiA4MDAsXG4gICAgICAgIHRlbXBlcmF0dXJlOiAwLjNcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcmVzcG9uc2UuY29tcGxldGlvbjtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBzdW1tYXJ5OicsIGVycm9yKTtcbiAgICAgIHJldHVybiBgUmVzZWFyY2ggc3VtbWFyeSBmb3IgJHt0b3BpY30gYmFzZWQgb24gJHtyZXN1bHRzLmxlbmd0aH0gc291cmNlcy5gO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVLZXlGaW5kaW5ncyhleHRyYWN0aW9uUmVzdWx0OiBJbmZvcm1hdGlvbkV4dHJhY3Rpb25SZXN1bHQsIHRyZW5kczogVHJlbmRBbmFseXNpc1tdLCBwYXR0ZXJuczogUGF0dGVybkFuYWx5c2lzW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgZmluZGluZ3M6IHN0cmluZ1tdID0gW107XG4gICAgXG4gICAgLy8gQWRkIGZpbmRpbmdzIGZyb20gZW50aXRpZXMgKHVwIHRvIDMpXG4gICAgZXh0cmFjdGlvblJlc3VsdC5lbnRpdGllcy5zbGljZSgwLCAzKS5mb3JFYWNoKGVudGl0eSA9PiB7XG4gICAgICBmaW5kaW5ncy5wdXNoKGAke2VudGl0eS5uYW1lfSBpcyBhIGtleSAke2VudGl0eS50eXBlfSBtZW50aW9uZWQgJHtlbnRpdHkubWVudGlvbnN9IHRpbWVzIGluIHRoZSByZXNlYXJjaC5gKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBBZGQgZmluZGluZ3MgZnJvbSB0cmVuZHMgKHVwIHRvIDEpXG4gICAgdHJlbmRzLnNsaWNlKDAsIDEpLmZvckVhY2godHJlbmQgPT4ge1xuICAgICAgZmluZGluZ3MucHVzaChgJHt0cmVuZC50cmVuZH0gc2hvd3MgYSAke3RyZW5kLmRpcmVjdGlvbn0gdHJlbmQgd2l0aCAke3RyZW5kLnN0cmVuZ3RofSBzdHJlbmd0aC5gKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBBZGQgZmluZGluZ3MgZnJvbSBwYXR0ZXJucyAodXAgdG8gMSlcbiAgICBwYXR0ZXJucy5zbGljZSgwLCAxKS5mb3JFYWNoKHBhdHRlcm4gPT4ge1xuICAgICAgZmluZGluZ3MucHVzaChgSWRlbnRpZmllZCAke3BhdHRlcm4udHlwZX0gcGF0dGVybjogJHtwYXR0ZXJuLnBhdHRlcm59IHdpdGggJHtwYXR0ZXJuLnByZWRpY3RpdmVWYWx1ZX0gcHJlZGljdGl2ZSB2YWx1ZS5gKTtcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gZmluZGluZ3M7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlUmVjb21tZW5kYXRpb25zKHRvcGljOiBzdHJpbmcsIGtleUZpbmRpbmdzOiBzdHJpbmdbXSwgdHJlbmRzOiBUcmVuZEFuYWx5c2lzW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIHJlY29tbWVuZGF0aW9ucyBiYXNlZCBvbiB0cmVuZHNcbiAgICB0cmVuZHMuZm9yRWFjaCh0cmVuZCA9PiB7XG4gICAgICBpZiAodHJlbmQuZGlyZWN0aW9uID09PSAndXB3YXJkJyAmJiB0cmVuZC5zdHJlbmd0aCA9PT0gJ3N0cm9uZycpIHtcbiAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYENvbnNpZGVyIGluY3JlYXNpbmcgZXhwb3N1cmUgdG8gJHt0b3BpY30gZ2l2ZW4gdGhlIHN0cm9uZyB1cHdhcmQgdHJlbmQgaW4gJHt0cmVuZC50cmVuZH0uYCk7XG4gICAgICB9IGVsc2UgaWYgKHRyZW5kLmRpcmVjdGlvbiA9PT0gJ2Rvd253YXJkJyAmJiB0cmVuZC5zdHJlbmd0aCA9PT0gJ3N0cm9uZycpIHtcbiAgICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goYEV4ZXJjaXNlIGNhdXRpb24gd2l0aCAke3RvcGljfSBkdWUgdG8gdGhlIHN0cm9uZyBkb3dud2FyZCB0cmVuZCBpbiAke3RyZW5kLnRyZW5kfS5gKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICAvLyBBZGQgZ2VuZXJhbCByZWNvbW1lbmRhdGlvbnNcbiAgICByZWNvbW1lbmRhdGlvbnMucHVzaChgQ29udGludWUgbW9uaXRvcmluZyAke3RvcGljfSBmb3IgZnVydGhlciBkZXZlbG9wbWVudHMuYCk7XG4gICAgcmVjb21tZW5kYXRpb25zLnB1c2goYENvbnNpZGVyIGRpdmVyc2lmaWNhdGlvbiBzdHJhdGVnaWVzIHJlbGF0ZWQgdG8gJHt0b3BpY30uYCk7XG4gICAgXG4gICAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbiAgfVxuXG4gIC8vIENvbmZpZGVuY2UgY2FsY3VsYXRpb24gbWV0aG9kc1xuICBwcml2YXRlIGNhbGN1bGF0ZUNvbmZpZGVuY2UocmVzdWx0czogYW55W10sIGV4dHJhY3Rpb25SZXN1bHQ6IEluZm9ybWF0aW9uRXh0cmFjdGlvblJlc3VsdCk6IG51bWJlciB7XG4gICAgbGV0IGNvbmZpZGVuY2UgPSAwLjU7IC8vIEJhc2UgY29uZmlkZW5jZVxuICAgIFxuICAgIC8vIEluY3JlYXNlIGNvbmZpZGVuY2UgYmFzZWQgb24gbnVtYmVyIG9mIHNvdXJjZXNcbiAgICBjb25maWRlbmNlICs9IE1hdGgubWluKDAuMywgcmVzdWx0cy5sZW5ndGggLyA1MCk7XG4gICAgXG4gICAgLy8gSW5jcmVhc2UgY29uZmlkZW5jZSBiYXNlZCBvbiBlbnRpdHkgZXh0cmFjdGlvbiBxdWFsaXR5XG4gICAgY29uc3QgYXZnRW50aXR5Q29uZmlkZW5jZSA9IGV4dHJhY3Rpb25SZXN1bHQuZW50aXRpZXMucmVkdWNlKChzdW0sIGUpID0+IHN1bSArIGUuY29uZmlkZW5jZSwgMCkgLyBleHRyYWN0aW9uUmVzdWx0LmVudGl0aWVzLmxlbmd0aDtcbiAgICBjb25maWRlbmNlICs9IChhdmdFbnRpdHlDb25maWRlbmNlIHx8IDApICogMC4yO1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1pbigxLjAsIGNvbmZpZGVuY2UpO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVNYXJrZXRDb25maWRlbmNlKG1hcmtldERhdGE6IE1hcmtldERhdGFQb2ludFtdKTogbnVtYmVyIHtcbiAgICAvLyBDYWxjdWxhdGUgY29uZmlkZW5jZSBiYXNlZCBvbiBtYXJrZXQgZGF0YSBxdWFsaXR5IGFuZCBjb21wbGV0ZW5lc3NcbiAgICByZXR1cm4gTWF0aC5taW4oMS4wLCAwLjcgKyAobWFya2V0RGF0YS5sZW5ndGggLyAxMDApICogMC4zKTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlQ29tcHJlaGVuc2l2ZUNvbmZpZGVuY2Uod2ViUmVzZWFyY2g6IFJlc2VhcmNoUmVzcG9uc2UsIG1hcmtldFJlc2VhcmNoOiBSZXNlYXJjaFJlc3BvbnNlIHwgbnVsbCwgcHJvcHJpZXRhcnlSZXNlYXJjaDogUmVzZWFyY2hSZXNwb25zZSB8IG51bGwpOiBudW1iZXIge1xuICAgIGxldCB0b3RhbENvbmZpZGVuY2UgPSB3ZWJSZXNlYXJjaC5jb25maWRlbmNlO1xuICAgIGxldCBzb3VyY2VzID0gMTtcbiAgICBcbiAgICBpZiAobWFya2V0UmVzZWFyY2gpIHtcbiAgICAgIHRvdGFsQ29uZmlkZW5jZSArPSBtYXJrZXRSZXNlYXJjaC5jb25maWRlbmNlO1xuICAgICAgc291cmNlcysrO1xuICAgIH1cbiAgICBcbiAgICBpZiAocHJvcHJpZXRhcnlSZXNlYXJjaCkge1xuICAgICAgdG90YWxDb25maWRlbmNlICs9IHByb3ByaWV0YXJ5UmVzZWFyY2guY29uZmlkZW5jZTtcbiAgICAgIHNvdXJjZXMrKztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRvdGFsQ29uZmlkZW5jZSAvIHNvdXJjZXM7XG4gIH1cblxuICAvLyBTeW50aGVzaXMgbWV0aG9kcyBmb3IgY29tcHJlaGVuc2l2ZSByZXNlYXJjaFxuICBwcml2YXRlIGFzeW5jIHN5bnRoZXNpemVDb21wcmVoZW5zaXZlUmVzdWx0cyh0b3BpYzogc3RyaW5nLCB3ZWJSZXNlYXJjaDogUmVzZWFyY2hSZXNwb25zZSwgbWFya2V0UmVzZWFyY2g6IFJlc2VhcmNoUmVzcG9uc2UgfCBudWxsLCBwcm9wcmlldGFyeVJlc2VhcmNoOiBSZXNlYXJjaFJlc3BvbnNlIHwgbnVsbCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcHJvbXB0ID0gYFxuICAgICAgU3ludGhlc2l6ZSBjb21wcmVoZW5zaXZlIHJlc2VhcmNoIHJlc3VsdHMgZm9yIFwiJHt0b3BpY31cIjpcbiAgICAgIFxuICAgICAgV2ViIFJlc2VhcmNoIFN1bW1hcnk6ICR7d2ViUmVzZWFyY2guc3VtbWFyeX1cbiAgICAgICR7bWFya2V0UmVzZWFyY2ggPyBgTWFya2V0IFJlc2VhcmNoIFN1bW1hcnk6ICR7bWFya2V0UmVzZWFyY2guc3VtbWFyeX1gIDogJyd9XG4gICAgICAke3Byb3ByaWV0YXJ5UmVzZWFyY2ggPyBgUHJvcHJpZXRhcnkgUmVzZWFyY2ggU3VtbWFyeTogJHtwcm9wcmlldGFyeVJlc2VhcmNoLnN1bW1hcnl9YCA6ICcnfVxuICAgICAgXG4gICAgICBDcmVhdGUgYSB1bmlmaWVkLCBjb2hlcmVudCBzdW1tYXJ5IHRoYXQgaW50ZWdyYXRlcyBpbnNpZ2h0cyBmcm9tIGFsbCBzb3VyY2VzLlxuICAgIGA7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNsYXVkZUhhaWt1U2VydmljZS5jb21wbGV0ZSh7XG4gICAgICAgIHByb21wdCxcbiAgICAgICAgbWF4VG9rZW5zOiAxMDAwLFxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4zXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmNvbXBsZXRpb247XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN5bnRoZXNpemluZyBjb21wcmVoZW5zaXZlIHJlc3VsdHM6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHdlYlJlc2VhcmNoLnN1bW1hcnk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzeW50aGVzaXplS2V5RmluZGluZ3MoYWxsRmluZGluZ3M6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGFuZCBwcmlvcml0aXplIG1vc3QgaW1wb3J0YW50IGZpbmRpbmdzXG4gICAgY29uc3QgdW5pcXVlRmluZGluZ3MgPSBbLi4ubmV3IFNldChhbGxGaW5kaW5ncyldO1xuICAgIHJldHVybiB1bmlxdWVGaW5kaW5ncy5zbGljZSgwLCAxMCk7IC8vIFJldHVybiB0b3AgMTAgZmluZGluZ3NcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3ludGhlc2l6ZVJlY29tbWVuZGF0aW9ucyh0b3BpYzogc3RyaW5nLCB3ZWJSZWNzOiBzdHJpbmdbXSwgbWFya2V0UmVjczogc3RyaW5nW10sIHByb3ByaWV0YXJ5UmVjczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgYWxsUmVjb21tZW5kYXRpb25zID0gWy4uLndlYlJlY3MsIC4uLm1hcmtldFJlY3MsIC4uLnByb3ByaWV0YXJ5UmVjc107XG4gICAgY29uc3QgdW5pcXVlUmVjb21tZW5kYXRpb25zID0gWy4uLm5ldyBTZXQoYWxsUmVjb21tZW5kYXRpb25zKV07XG4gICAgcmV0dXJuIHVuaXF1ZVJlY29tbWVuZGF0aW9ucy5zbGljZSgwLCA4KTsgLy8gUmV0dXJuIHRvcCA4IHJlY29tbWVuZGF0aW9uc1xuICB9XG5cbiAgcHJpdmF0ZSBjb21iaW5lUmVsYXRlZFRvcGljcyhhbGxUb3BpY3M6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICAgIGNvbnN0IHVuaXF1ZVRvcGljcyA9IFsuLi5uZXcgU2V0KGFsbFRvcGljcyldO1xuICAgIHJldHVybiB1bmlxdWVUb3BpY3Muc2xpY2UoMCwgMTUpOyAvLyBSZXR1cm4gdG9wIDE1IHJlbGF0ZWQgdG9waWNzXG4gIH1cblxuICAvLyBQbGFjZWhvbGRlciBtZXRob2RzIGZvciBhZGRpdGlvbmFsIGZ1bmN0aW9uYWxpdHlcbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFkdmFuY2VkRmluZGluZ3MocmVzZWFyY2hSZXN1bHQ6IFJlc2VhcmNoUmVzdWx0LCBleHRyYWN0aW9uUmVzdWx0OiBJbmZvcm1hdGlvbkV4dHJhY3Rpb25SZXN1bHQsIHRyZW5kczogVHJlbmRBbmFseXNpc1tdLCBwYXR0ZXJuczogUGF0dGVybkFuYWx5c2lzW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIHJlc2VhcmNoUmVzdWx0LmtleUZpbmRpbmdzO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUFkdmFuY2VkUmVjb21tZW5kYXRpb25zKHRvcGljOiBzdHJpbmcsIGtleUZpbmRpbmdzOiBzdHJpbmdbXSwgdHJlbmRzOiBUcmVuZEFuYWx5c2lzW10sIHBhdHRlcm5zOiBQYXR0ZXJuQW5hbHlzaXNbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gW2BBZHZhbmNlZCByZWNvbW1lbmRhdGlvbiBmb3IgJHt0b3BpY30gYmFzZWQgb24gY29tcHJlaGVuc2l2ZSBhbmFseXNpcy5gXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVNYXJrZXRTdW1tYXJ5KHRvcGljOiBzdHJpbmcsIG1hcmtldEluc2lnaHRzOiBNYXJrZXRJbnNpZ2h0W10sIHRyZW5kczogVHJlbmRBbmFseXNpc1tdKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYE1hcmtldCBhbmFseXNpcyBzdW1tYXJ5IGZvciAke3RvcGljfSBiYXNlZCBvbiAke21hcmtldEluc2lnaHRzLmxlbmd0aH0gaW5zaWdodHMgYW5kICR7dHJlbmRzLmxlbmd0aH0gdHJlbmRzLmA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlTWFya2V0RmluZGluZ3MobWFya2V0SW5zaWdodHM6IE1hcmtldEluc2lnaHRbXSwgdHJlbmRzOiBUcmVuZEFuYWx5c2lzW10sIHBhdHRlcm5zOiBQYXR0ZXJuQW5hbHlzaXNbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gbWFya2V0SW5zaWdodHMubWFwKGluc2lnaHQgPT4gYCR7aW5zaWdodC5tZXRyaWN9OiAke2luc2lnaHQudmFsdWV9ICgke2luc2lnaHQuaW50ZXJwcmV0YXRpb259KWApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZU1hcmtldFJlY29tbWVuZGF0aW9ucyh0b3BpYzogc3RyaW5nLCBtYXJrZXRJbnNpZ2h0czogTWFya2V0SW5zaWdodFtdLCB0cmVuZHM6IFRyZW5kQW5hbHlzaXNbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gW2BNYXJrZXQtYmFzZWQgcmVjb21tZW5kYXRpb24gZm9yICR7dG9waWN9LmBdO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVJlbGF0ZWRNYXJrZXRUb3BpY3ModG9waWM6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gW2Ake3RvcGljfSBtYXJrZXQgYW5hbHlzaXNgLCBgJHt0b3BpY30gcHJpY2UgdHJlbmRzYCwgYCR7dG9waWN9IHZvbGF0aWxpdHlgXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVQcm9wcmlldGFyeVN1bW1hcnkodG9waWM6IHN0cmluZywgcHJvcHJpZXRhcnlJbnNpZ2h0czogUHJvcHJpZXRhcnlJbnNpZ2h0W10sIHRyZW5kczogVHJlbmRBbmFseXNpc1tdKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYFByb3ByaWV0YXJ5IGFuYWx5c2lzIHN1bW1hcnkgZm9yICR7dG9waWN9IGJhc2VkIG9uICR7cHJvcHJpZXRhcnlJbnNpZ2h0cy5sZW5ndGh9IGluc2lnaHRzLmA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlUHJvcHJpZXRhcnlGaW5kaW5ncyhwcm9wcmlldGFyeUluc2lnaHRzOiBQcm9wcmlldGFyeUluc2lnaHRbXSwgdHJlbmRzOiBUcmVuZEFuYWx5c2lzW10sIHBhdHRlcm5zOiBQYXR0ZXJuQW5hbHlzaXNbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gcHJvcHJpZXRhcnlJbnNpZ2h0cy5tYXAoaW5zaWdodCA9PiBpbnNpZ2h0Lmluc2lnaHQpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVByb3ByaWV0YXJ5UmVjb21tZW5kYXRpb25zKHRvcGljOiBzdHJpbmcsIHByb3ByaWV0YXJ5SW5zaWdodHM6IFByb3ByaWV0YXJ5SW5zaWdodFtdLCB0cmVuZHM6IFRyZW5kQW5hbHlzaXNbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICByZXR1cm4gW2BQcm9wcmlldGFyeS1iYXNlZCByZWNvbW1lbmRhdGlvbiBmb3IgJHt0b3BpY30uYF07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlUmVsYXRlZFByb3ByaWV0YXJ5VG9waWNzKHRvcGljOiBzdHJpbmcsIHByb3ByaWV0YXJ5UmVzdWx0OiBQcm9wcmlldGFyeURhdGFSZXN1bHQpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgcmV0dXJuIFtgJHt0b3BpY30gaW50ZXJuYWwgYW5hbHlzaXNgLCBgJHt0b3BpY30gcHJvcHJpZXRhcnkgaW5zaWdodHNgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGUgYWdlbnQgbWVzc2FnZXMgZm9yIGNvbW11bmljYXRpb24gd2l0aCBvdGhlciBhZ2VudHNcbiAgICovXG4gIGFzeW5jIGhhbmRsZU1lc3NhZ2UobWVzc2FnZTogQWdlbnRNZXNzYWdlKTogUHJvbWlzZTxBZ2VudE1lc3NhZ2U+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3BvbnNlQ29udGVudDogYW55O1xuXG4gICAgICBzd2l0Y2ggKG1lc3NhZ2UubWVzc2FnZVR5cGUpIHtcbiAgICAgICAgY2FzZSAncmVxdWVzdCc6XG4gICAgICAgICAgaWYgKG1lc3NhZ2UuY29udGVudC50eXBlID09PSAncmVzZWFyY2gnKSB7XG4gICAgICAgICAgICByZXNwb25zZUNvbnRlbnQgPSBhd2FpdCB0aGlzLnByb2Nlc3NSZXNlYXJjaFJlcXVlc3QobWVzc2FnZS5jb250ZW50LnJlcXVlc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHJlcXVlc3QgdHlwZTogJHttZXNzYWdlLmNvbnRlbnQudHlwZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS5tZXNzYWdlVHlwZX1gKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc2VuZGVyOiB0aGlzLmFnZW50VHlwZSxcbiAgICAgICAgcmVjaXBpZW50OiBtZXNzYWdlLnNlbmRlcixcbiAgICAgICAgbWVzc2FnZVR5cGU6ICdyZXNwb25zZScsXG4gICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlQ29udGVudCxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogbWVzc2FnZS5tZXRhZGF0YS5wcmlvcml0eSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29udmVyc2F0aW9uSWQ6IG1lc3NhZ2UubWV0YWRhdGEuY29udmVyc2F0aW9uSWQsXG4gICAgICAgICAgcmVxdWVzdElkOiBtZXNzYWdlLm1ldGFkYXRhLnJlcXVlc3RJZFxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzZW5kZXI6IHRoaXMuYWdlbnRUeXBlLFxuICAgICAgICByZWNpcGllbnQ6IG1lc3NhZ2Uuc2VuZGVyLFxuICAgICAgICBtZXNzYWdlVHlwZTogJ2Vycm9yJyxcbiAgICAgICAgY29udGVudDogeyBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicgfSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgICBjb252ZXJzYXRpb25JZDogbWVzc2FnZS5tZXRhZGF0YS5jb252ZXJzYXRpb25JZCxcbiAgICAgICAgICByZXF1ZXN0SWQ6IG1lc3NhZ2UubWV0YWRhdGEucmVxdWVzdElkXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICB9XG59Il19