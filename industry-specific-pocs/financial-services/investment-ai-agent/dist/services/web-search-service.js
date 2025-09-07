"use strict";
/**
 * Service for handling web search and deep research capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSearchService = void 0;
const uuid_1 = require("uuid");
/**
 * Service for handling web search and deep research capabilities
 */
class WebSearchService {
    constructor(apiKey, defaultSources = []) {
        this.apiKey = apiKey;
        this.defaultSources = defaultSources;
    }
    /**
     * Perform a web search with filtering and relevance ranking
     * @param query The search query
     * @param options Search options
     * @returns Search results
     */
    async performWebSearch(query, options) {
        try {
            const startTime = Date.now();
            // In a real implementation, this would call an external search API
            // For now, we'll simulate the search with mock data
            // Apply source filtering
            const sources = options.sources.length > 0 ? options.sources : this.defaultSources;
            // Generate mock results based on query and options
            const results = this.generateMockSearchResults(query, options);
            // Apply relevance ranking
            const rankedResults = this.rankResults(results, query);
            // Apply pagination if needed
            const limitedResults = rankedResults.slice(0, options.maxResults);
            return {
                results: limitedResults,
                totalResults: rankedResults.length,
                executionTime: Date.now() - startTime,
                nextPage: rankedResults.length > options.maxResults ? 'next-page-token' : undefined
            };
        }
        catch (error) {
            console.error('Error performing web search:', error);
            throw error;
        }
    }
    /**
     * Perform deep research on a topic
     * @param topic The research topic
     * @param options Research options
     * @returns Research results
     */
    async performDeepResearch(topic, options) {
        try {
            // In a real implementation, this would involve multiple API calls,
            // data aggregation, and analysis
            // First, perform a web search to gather initial information
            const searchOptions = {
                depth: options.depth === 'comprehensive' ? 'comprehensive' : 'basic',
                sources: options.includeSources,
                timeframe: 'all-time',
                maxResults: 20 // Get more results for deep research
            };
            const searchResult = await this.performWebSearch(topic, searchOptions);
            // Filter out excluded sources
            const filteredResults = searchResult.results.filter(result => !options.excludeSources.some(source => result.source.toLowerCase().includes(source.toLowerCase())));
            // Generate research sources from search results
            const sources = this.generateResearchSources(filteredResults);
            // Generate key findings based on the sources
            const keyFindings = this.generateKeyFindings(topic, sources);
            // Generate related topics
            const relatedTopics = this.generateRelatedTopics(topic);
            // Generate summary
            const summary = this.generateSummary(topic, keyFindings, sources);
            return {
                summary,
                keyFindings,
                sources,
                relatedTopics,
                confidence: this.calculateConfidence(sources, options)
            };
        }
        catch (error) {
            console.error('Error performing deep research:', error);
            throw error;
        }
    }
    /**
     * Verify a source's credibility and authenticity
     * @param source The source to verify
     * @returns Verification result
     */
    async verifySource(source) {
        try {
            // In a real implementation, this would check against known reliable sources,
            // verify publication dates, check for citations, etc.
            // For now, we'll use a simple mock implementation
            const isKnownSource = Math.random() > 0.2; // 80% chance of being a known source
            const hasCitations = Math.random() > 0.3; // 70% chance of having citations
            const isRecentlyUpdated = Math.random() > 0.4; // 60% chance of being recently updated
            const credibilityScore = ((isKnownSource ? 0.5 : 0) +
                (hasCitations ? 0.3 : 0) +
                (isRecentlyUpdated ? 0.2 : 0));
            return {
                source,
                isVerified: credibilityScore > 0.5,
                credibilityScore,
                factors: {
                    isKnownSource,
                    hasCitations,
                    isRecentlyUpdated
                },
                verificationMethod: 'automated-check'
            };
        }
        catch (error) {
            console.error('Error verifying source:', error);
            throw error;
        }
    }
    /**
     * Track citations for a research result
     * @param researchResult The research result to track citations for
     * @returns Citation tracking result
     */
    async trackCitations(researchResult) {
        try {
            // In a real implementation, this would track citations across sources,
            // verify cross-references, etc.
            const citations = [];
            // Generate citations for each source
            for (const source of researchResult.sources) {
                const citationCount = Math.floor(Math.random() * 10) + 1; // 1-10 citations
                for (let i = 0; i < citationCount; i++) {
                    citations.push({
                        id: (0, uuid_1.v4)(),
                        sourceId: source.url || source.title,
                        citedBy: `Author ${i + 1}`,
                        publicationDate: new Date(Date.now() - Math.random() * 31536000000),
                        context: `Citation context ${i + 1} for ${source.title}`,
                        relevance: Math.random()
                    });
                }
            }
            return {
                researchTopic: researchResult.summary.split(' ').slice(0, 5).join(' '),
                totalCitations: citations.length,
                citations,
                citationGraph: {
                    nodes: researchResult.sources.map(s => ({ id: s.url || s.title, label: s.title })),
                    edges: citations.map(c => ({
                        source: c.sourceId,
                        target: researchResult.sources[Math.floor(Math.random() * researchResult.sources.length)].url || '',
                        weight: c.relevance
                    }))
                }
            };
        }
        catch (error) {
            console.error('Error tracking citations:', error);
            throw error;
        }
    }
    // Private helper methods
    /**
     * Generate mock search results
     * @param query The search query
     * @param options Search options
     * @returns Mock search results
     */
    generateMockSearchResults(query, options) {
        const results = [];
        // Generate a random number of results based on the query length
        const resultCount = Math.min(50, Math.max(5, query.length * 2));
        for (let i = 0; i < resultCount; i++) {
            const source = this.getRandomSource(options.sources);
            const publishDate = this.getRandomDateByTimeframe(options.timeframe);
            results.push({
                title: `${query} - Result ${i + 1} from ${source}`,
                url: `https://${source.toLowerCase().replace(/\s+/g, '')}.com/article-${i + 1}`,
                snippet: `This is a snippet for ${query} from ${source}. It contains relevant information about the topic.`,
                source,
                publishDate,
                relevanceScore: Math.random() // Random relevance score between 0 and 1
            });
        }
        return results;
    }
    /**
     * Rank search results by relevance
     * @param results The search results to rank
     * @param query The search query
     * @returns Ranked search results
     */
    rankResults(results, query) {
        // In a real implementation, this would use sophisticated ranking algorithms
        // For now, we'll use a simple approach based on keyword matching and recency
        const queryTerms = query.toLowerCase().split(/\s+/);
        // Calculate a more meaningful relevance score
        const scoredResults = results.map(result => {
            let score = result.relevanceScore; // Start with the initial score
            // Boost score based on title match
            const titleLower = result.title.toLowerCase();
            queryTerms.forEach(term => {
                if (titleLower.includes(term)) {
                    score += 0.2;
                }
            });
            // Boost score based on snippet match
            const snippetLower = result.snippet.toLowerCase();
            queryTerms.forEach(term => {
                if (snippetLower.includes(term)) {
                    score += 0.1;
                }
            });
            // Boost score based on recency
            if (result.publishDate) {
                const now = new Date();
                const ageInDays = (now.getTime() - result.publishDate.getTime()) / (1000 * 60 * 60 * 24);
                if (ageInDays < 7) { // Published within the last week
                    score += 0.3;
                }
                else if (ageInDays < 30) { // Published within the last month
                    score += 0.2;
                }
                else if (ageInDays < 365) { // Published within the last year
                    score += 0.1;
                }
            }
            // Cap score at 1.0
            score = Math.min(1.0, score);
            return {
                ...result,
                relevanceScore: score
            };
        });
        // Sort by relevance score (descending)
        return scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Generate research sources from search results
     * @param searchResults The search results to generate sources from
     * @returns Research sources
     */
    generateResearchSources(searchResults) {
        return searchResults.map(result => ({
            title: result.title,
            url: result.url,
            publisher: result.source,
            publishDate: result.publishDate,
            relevance: result.relevanceScore,
            excerpts: [result.snippet]
        }));
    }
    /**
     * Generate key findings based on a topic and sources
     * @param topic The research topic
     * @param sources The research sources
     * @returns Key findings
     */
    generateKeyFindings(topic, sources) {
        // In a real implementation, this would analyze the content of the sources
        // and extract key findings using NLP techniques
        // For now, we'll generate mock findings
        const findings = [
            `${topic} shows significant growth potential in the next 5 years.`,
            `Market analysts are generally positive about ${topic}'s future prospects.`,
            `Recent regulatory changes may impact ${topic} in the short term.`,
            `Competitors in the ${topic} space are increasing their R&D investments.`,
            `Consumer sentiment towards ${topic} has improved over the last quarter.`
        ];
        // Add some source-specific findings
        sources.slice(0, 3).forEach((source, index) => {
            findings.push(`According to ${source.publisher}, ${topic} is experiencing ${index === 0 ? 'positive' : index === 1 ? 'mixed' : 'challenging'} market conditions.`);
        });
        return findings;
    }
    /**
     * Generate related topics based on a main topic
     * @param topic The main topic
     * @returns Related topics
     */
    generateRelatedTopics(topic) {
        // In a real implementation, this would use topic modeling or knowledge graphs
        // For now, we'll generate mock related topics
        return [
            `${topic} market trends`,
            `${topic} investment opportunities`,
            `${topic} risk factors`,
            `${topic} competitive landscape`,
            `${topic} future outlook`
        ];
    }
    /**
     * Generate a summary based on a topic, findings, and sources
     * @param topic The research topic
     * @param findings The key findings
     * @param sources The research sources
     * @returns Research summary
     */
    generateSummary(topic, findings, sources) {
        // In a real implementation, this would generate a coherent summary
        // based on the actual content of the sources
        // For now, we'll generate a mock summary
        return `
      This research on ${topic} synthesizes information from ${sources.length} sources.
      The analysis reveals that ${findings[0].toLowerCase()} Additionally, 
      ${findings[1].toLowerCase()} However, it's important to note that 
      ${findings[2].toLowerCase()}
      
      The most reliable sources, including ${sources.slice(0, 3).map(s => s.publisher).join(', ')},
      suggest that ${topic} warrants careful consideration for investment purposes.
      Further research may be needed on ${topic} market trends and competitive landscape.
    `.trim().replace(/\s+/g, ' ');
    }
    /**
     * Calculate confidence score for research results
     * @param sources The research sources
     * @param options The research options
     * @returns Confidence score between 0 and 1
     */
    calculateConfidence(sources, options) {
        // In a real implementation, this would use more sophisticated methods
        // to assess the confidence of the research results
        // For now, we'll use a simple approach based on source count and relevance
        // Base confidence on number of sources (more sources = higher confidence)
        let confidence = Math.min(0.5, sources.length / 20);
        // Add confidence based on average relevance of sources
        const avgRelevance = sources.reduce((sum, source) => sum + source.relevance, 0) / sources.length;
        confidence += avgRelevance * 0.3;
        // Add confidence based on research depth
        switch (options.depth) {
            case 'comprehensive':
                confidence += 0.2;
                break;
            case 'deep':
                confidence += 0.15;
                break;
            case 'standard':
                confidence += 0.1;
                break;
        }
        // Cap at 1.0
        return Math.min(1.0, confidence);
    }
    /**
     * Get a random source from a list of sources or default sources
     * @param sources The list of sources to choose from
     * @returns A random source
     */
    getRandomSource(sources) {
        const sourceList = sources.length > 0 ? sources : this.defaultSources;
        if (sourceList.length === 0) {
            // If no sources are provided, use some default financial sources
            const defaultFinancialSources = [
                'Bloomberg', 'Reuters', 'Financial Times', 'Wall Street Journal',
                'CNBC', 'Forbes', 'The Economist', 'Morningstar', 'MarketWatch'
            ];
            return defaultFinancialSources[Math.floor(Math.random() * defaultFinancialSources.length)];
        }
        return sourceList[Math.floor(Math.random() * sourceList.length)];
    }
    /**
     * Get a random date based on a timeframe
     * @param timeframe The timeframe to generate a date within
     * @returns A random date within the specified timeframe
     */
    getRandomDateByTimeframe(timeframe) {
        const now = new Date();
        let minDate;
        switch (timeframe) {
            case 'recent':
                minDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
                break;
            case 'past-week':
                minDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
                break;
            case 'past-month':
                minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
                break;
            case 'past-year':
                minDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 365 days ago
                break;
            case 'all-time':
            default:
                minDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000); // 5 years ago
                break;
        }
        return new Date(minDate.getTime() + Math.random() * (now.getTime() - minDate.getTime()));
    }
}
exports.WebSearchService = WebSearchService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLXNlYXJjaC1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NlcnZpY2VzL3dlYi1zZWFyY2gtc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQVVILCtCQUFvQztBQUVwQzs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBSTNCLFlBQVksTUFBYyxFQUFFLGlCQUEyQixFQUFFO1FBQ3ZELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFhLEVBQUUsT0FBeUI7UUFDN0QsSUFBSTtZQUNGLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUU3QixtRUFBbUU7WUFDbkUsb0RBQW9EO1lBRXBELHlCQUF5QjtZQUN6QixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7WUFFbkYsbURBQW1EO1lBQ25ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFL0QsMEJBQTBCO1lBQzFCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRXZELDZCQUE2QjtZQUM3QixNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFbEUsT0FBTztnQkFDTCxPQUFPLEVBQUUsY0FBYztnQkFDdkIsWUFBWSxFQUFFLGFBQWEsQ0FBQyxNQUFNO2dCQUNs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SSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLGFBQWE7Z0JBQzFFLE1BQU07WUFDUixLQUFLLFlBQVk7Z0JBQ2YsT0FBTyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxjQUFjO2dCQUM1RSxNQUFNO1lBQ1IsS0FBSyxXQUFXO2dCQUNkLE9BQU8sR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZTtnQkFDOUUsTUFBTTtZQUNSLEtBQUssVUFBVSxDQUFDO1lBQ2hCO2dCQUNFLE9BQU8sR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWM7Z0JBQ2pGLE1BQU07U0FDVDtRQUVELE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7Q0FDRjtBQTdiRCw0Q0E2YkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNlcnZpY2UgZm9yIGhhbmRsaW5nIHdlYiBzZWFyY2ggYW5kIGRlZXAgcmVzZWFyY2ggY2FwYWJpbGl0aWVzXG4gKi9cblxuaW1wb3J0IHsgXG4gIFdlYlNlYXJjaE9wdGlvbnMsIFxuICBXZWJTZWFyY2hSZXN1bHQsIFxuICBXZWJTZWFyY2hSZXN1bHRJdGVtLFxuICBEZWVwUmVzZWFyY2hPcHRpb25zLFxuICBSZXNlYXJjaFJlc3VsdCxcbiAgUmVzZWFyY2hTb3VyY2Vcbn0gZnJvbSAnLi4vbW9kZWxzL3NlcnZpY2VzJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuXG4vKipcbiAqIFNlcnZpY2UgZm9yIGhhbmRsaW5nIHdlYiBzZWFyY2ggYW5kIGRlZXAgcmVzZWFyY2ggY2FwYWJpbGl0aWVzXG4gKi9cbmV4cG9ydCBjbGFzcyBXZWJTZWFyY2hTZXJ2aWNlIHtcbiAgcHJpdmF0ZSBhcGlLZXk6IHN0cmluZztcbiAgcHJpdmF0ZSBkZWZhdWx0U291cmNlczogc3RyaW5nW107XG4gIFxuICBjb25zdHJ1Y3RvcihhcGlLZXk6IHN0cmluZywgZGVmYXVsdFNvdXJjZXM6IHN0cmluZ1tdID0gW10pIHtcbiAgICB0aGlzLmFwaUtleSA9IGFwaUtleTtcbiAgICB0aGlzLmRlZmF1bHRTb3VyY2VzID0gZGVmYXVsdFNvdXJjZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQZXJmb3JtIGEgd2ViIHNlYXJjaCB3aXRoIGZpbHRlcmluZyBhbmQgcmVsZXZhbmNlIHJhbmtpbmdcbiAgICogQHBhcmFtIHF1ZXJ5IFRoZSBzZWFyY2ggcXVlcnlcbiAgICogQHBhcmFtIG9wdGlvbnMgU2VhcmNoIG9wdGlvbnNcbiAgICogQHJldHVybnMgU2VhcmNoIHJlc3VsdHNcbiAgICovXG4gIGFzeW5jIHBlcmZvcm1XZWJTZWFyY2gocXVlcnk6IHN0cmluZywgb3B0aW9uczogV2ViU2VhcmNoT3B0aW9ucyk6IFByb21pc2U8V2ViU2VhcmNoUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICBcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBjYWxsIGFuIGV4dGVybmFsIHNlYXJjaCBBUElcbiAgICAgIC8vIEZvciBub3csIHdlJ2xsIHNpbXVsYXRlIHRoZSBzZWFyY2ggd2l0aCBtb2NrIGRhdGFcbiAgICAgIFxuICAgICAgLy8gQXBwbHkgc291cmNlIGZpbHRlcmluZ1xuICAgICAgY29uc3Qgc291cmNlcyA9IG9wdGlvbnMuc291cmNlcy5sZW5ndGggPiAwID8gb3B0aW9ucy5zb3VyY2VzIDogdGhpcy5kZWZhdWx0U291cmNlcztcbiAgICAgIFxuICAgICAgLy8gR2VuZXJhdGUgbW9jayByZXN1bHRzIGJhc2VkIG9uIHF1ZXJ5IGFuZCBvcHRpb25zXG4gICAgICBjb25zdCByZXN1bHRzID0gdGhpcy5nZW5lcmF0ZU1vY2tTZWFyY2hSZXN1bHRzKHF1ZXJ5LCBvcHRpb25zKTtcbiAgICAgIFxuICAgICAgLy8gQXBwbHkgcmVsZXZhbmNlIHJhbmtpbmdcbiAgICAgIGNvbnN0IHJhbmtlZFJlc3VsdHMgPSB0aGlzLnJhbmtSZXN1bHRzKHJlc3VsdHMsIHF1ZXJ5KTtcbiAgICAgIFxuICAgICAgLy8gQXBwbHkgcGFnaW5hdGlvbiBpZiBuZWVkZWRcbiAgICAgIGNvbnN0IGxpbWl0ZWRSZXN1bHRzID0gcmFua2VkUmVzdWx0cy5zbGljZSgwLCBvcHRpb25zLm1heFJlc3VsdHMpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICByZXN1bHRzOiBsaW1pdGVkUmVzdWx0cyxcbiAgICAgICAgdG90YWxSZXN1bHRzOiByYW5rZWRSZXN1bHRzLmxlbmd0aCxcbiAgICAgICAgZXhlY3V0aW9uVGltZTogRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgbmV4dFBhZ2U6IHJhbmtlZFJlc3VsdHMubGVuZ3RoID4gb3B0aW9ucy5tYXhSZXN1bHRzID8gJ25leHQtcGFnZS10b2tlbicgOiB1bmRlZmluZWRcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHBlcmZvcm1pbmcgd2ViIHNlYXJjaDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQZXJmb3JtIGRlZXAgcmVzZWFyY2ggb24gYSB0b3BpY1xuICAgKiBAcGFyYW0gdG9waWMgVGhlIHJlc2VhcmNoIHRvcGljXG4gICAqIEBwYXJhbSBvcHRpb25zIFJlc2VhcmNoIG9wdGlvbnNcbiAgICogQHJldHVybnMgUmVzZWFyY2ggcmVzdWx0c1xuICAgKi9cbiAgYXN5bmMgcGVyZm9ybURlZXBSZXNlYXJjaCh0b3BpYzogc3RyaW5nLCBvcHRpb25zOiBEZWVwUmVzZWFyY2hPcHRpb25zKTogUHJvbWlzZTxSZXNlYXJjaFJlc3VsdD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgaW52b2x2ZSBtdWx0aXBsZSBBUEkgY2FsbHMsXG4gICAgICAvLyBkYXRhIGFnZ3JlZ2F0aW9uLCBhbmQgYW5hbHlzaXNcbiAgICAgIFxuICAgICAgLy8gRmlyc3QsIHBlcmZvcm0gYSB3ZWIgc2VhcmNoIHRvIGdhdGhlciBpbml0aWFsIGluZm9ybWF0aW9uXG4gICAgICBjb25zdCBzZWFyY2hPcHRpb25zOiBXZWJTZWFyY2hPcHRpb25zID0ge1xuICAgICAgICBkZXB0aDogb3B0aW9ucy5kZXB0aCA9PT0gJ2NvbXByZWhlbnNpdmUnID8gJ2NvbXByZWhlbnNpdmUnIDogJ2Jhc2ljJyxcbiAgICAgICAgc291cmNlczogb3B0aW9ucy5pbmNsdWRlU291cmNlcyxcbiAgICAgICAgdGltZWZyYW1lOiAnYWxsLXRpbWUnLFxuICAgICAgICBtYXhSZXN1bHRzOiAyMCAvLyBHZXQgbW9yZSByZXN1bHRzIGZvciBkZWVwIHJlc2VhcmNoXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBzZWFyY2hSZXN1bHQgPSBhd2FpdCB0aGlzLnBlcmZvcm1XZWJTZWFyY2godG9waWMsIHNlYXJjaE9wdGlvbnMpO1xuICAgICAgXG4gICAgICAvLyBGaWx0ZXIgb3V0IGV4Y2x1ZGVkIHNvdXJjZXNcbiAgICAgIGNvbnN0IGZpbHRlcmVkUmVzdWx0cyA9IHNlYXJjaFJlc3VsdC5yZXN1bHRzLmZpbHRlcihcbiAgICAgICAgcmVzdWx0ID0+ICFvcHRpb25zLmV4Y2x1ZGVTb3VyY2VzLnNvbWUoc291cmNlID0+IFxuICAgICAgICAgIHJlc3VsdC5zb3VyY2UudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzb3VyY2UudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgLy8gR2VuZXJhdGUgcmVzZWFyY2ggc291cmNlcyBmcm9tIHNlYXJjaCByZXN1bHRzXG4gICAgICBjb25zdCBzb3VyY2VzID0gdGhpcy5nZW5lcmF0ZVJlc2VhcmNoU291cmNlcyhmaWx0ZXJlZFJlc3VsdHMpO1xuICAgICAgXG4gICAgICAvLyBHZW5lcmF0ZSBrZXkgZmluZGluZ3MgYmFzZWQgb24gdGhlIHNvdXJjZXNcbiAgICAgIGNvbnN0IGtleUZpbmRpbmdzID0gdGhpcy5nZW5lcmF0ZUtleUZpbmRpbmdzKHRvcGljLCBzb3VyY2VzKTtcbiAgICAgIFxuICAgICAgLy8gR2VuZXJhdGUgcmVsYXRlZCB0b3BpY3NcbiAgICAgIGNvbnN0IHJlbGF0ZWRUb3BpY3MgPSB0aGlzLmdlbmVyYXRlUmVsYXRlZFRvcGljcyh0b3BpYyk7XG4gICAgICBcbiAgICAgIC8vIEdlbmVyYXRlIHN1bW1hcnlcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSB0aGlzLmdlbmVyYXRlU3VtbWFyeSh0b3BpYywga2V5RmluZGluZ3MsIHNvdXJjZXMpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdW1tYXJ5LFxuICAgICAgICBrZXlGaW5kaW5ncyxcbiAgICAgICAgc291cmNlcyxcbiAgICAgICAgcmVsYXRlZFRvcGljcyxcbiAgICAgICAgY29uZmlkZW5jZTogdGhpcy5jYWxjdWxhdGVDb25maWRlbmNlKHNvdXJjZXMsIG9wdGlvbnMpXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwZXJmb3JtaW5nIGRlZXAgcmVzZWFyY2g6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmVyaWZ5IGEgc291cmNlJ3MgY3JlZGliaWxpdHkgYW5kIGF1dGhlbnRpY2l0eVxuICAgKiBAcGFyYW0gc291cmNlIFRoZSBzb3VyY2UgdG8gdmVyaWZ5XG4gICAqIEByZXR1cm5zIFZlcmlmaWNhdGlvbiByZXN1bHRcbiAgICovXG4gIGFzeW5jIHZlcmlmeVNvdXJjZShzb3VyY2U6IFJlc2VhcmNoU291cmNlKTogUHJvbWlzZTxTb3VyY2VWZXJpZmljYXRpb25SZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGNoZWNrIGFnYWluc3Qga25vd24gcmVsaWFibGUgc291cmNlcyxcbiAgICAgIC8vIHZlcmlmeSBwdWJsaWNhdGlvbiBkYXRlcywgY2hlY2sgZm9yIGNpdGF0aW9ucywgZXRjLlxuICAgICAgXG4gICAgICAvLyBGb3Igbm93LCB3ZSdsbCB1c2UgYSBzaW1wbGUgbW9jayBpbXBsZW1lbnRhdGlvblxuICAgICAgY29uc3QgaXNLbm93blNvdXJjZSA9IE1hdGgucmFuZG9tKCkgPiAwLjI7IC8vIDgwJSBjaGFuY2Ugb2YgYmVpbmcgYSBrbm93biBzb3VyY2VcbiAgICAgIGNvbnN0IGhhc0NpdGF0aW9ucyA9IE1hdGgucmFuZG9tKCkgPiAwLjM7IC8vIDcwJSBjaGFuY2Ugb2YgaGF2aW5nIGNpdGF0aW9uc1xuICAgICAgY29uc3QgaXNSZWNlbnRseVVwZGF0ZWQgPSBNYXRoLnJhbmRvbSgpID4gMC40OyAvLyA2MCUgY2hhbmNlIG9mIGJlaW5nIHJlY2VudGx5IHVwZGF0ZWRcbiAgICAgIFxuICAgICAgY29uc3QgY3JlZGliaWxpdHlTY29yZSA9IChcbiAgICAgICAgKGlzS25vd25Tb3VyY2UgPyAwLjUgOiAwKSArIFxuICAgICAgICAoaGFzQ2l0YXRpb25zID8gMC4zIDogMCkgKyBcbiAgICAgICAgKGlzUmVjZW50bHlVcGRhdGVkID8gMC4yIDogMClcbiAgICAgICk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgaXNWZXJpZmllZDogY3JlZGliaWxpdHlTY29yZSA+IDAuNSxcbiAgICAgICAgY3JlZGliaWxpdHlTY29yZSxcbiAgICAgICAgZmFjdG9yczoge1xuICAgICAgICAgIGlzS25vd25Tb3VyY2UsXG4gICAgICAgICAgaGFzQ2l0YXRpb25zLFxuICAgICAgICAgIGlzUmVjZW50bHlVcGRhdGVkXG4gICAgICAgIH0sXG4gICAgICAgIHZlcmlmaWNhdGlvbk1ldGhvZDogJ2F1dG9tYXRlZC1jaGVjaydcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHZlcmlmeWluZyBzb3VyY2U6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVHJhY2sgY2l0YXRpb25zIGZvciBhIHJlc2VhcmNoIHJlc3VsdFxuICAgKiBAcGFyYW0gcmVzZWFyY2hSZXN1bHQgVGhlIHJlc2VhcmNoIHJlc3VsdCB0byB0cmFjayBjaXRhdGlvbnMgZm9yXG4gICAqIEByZXR1cm5zIENpdGF0aW9uIHRyYWNraW5nIHJlc3VsdFxuICAgKi9cbiAgYXN5bmMgdHJhY2tDaXRhdGlvbnMocmVzZWFyY2hSZXN1bHQ6IFJlc2VhcmNoUmVzdWx0KTogUHJvbWlzZTxDaXRhdGlvblRyYWNraW5nUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCB0cmFjayBjaXRhdGlvbnMgYWNyb3NzIHNvdXJjZXMsXG4gICAgICAvLyB2ZXJpZnkgY3Jvc3MtcmVmZXJlbmNlcywgZXRjLlxuICAgICAgXG4gICAgICBjb25zdCBjaXRhdGlvbnM6IENpdGF0aW9uW10gPSBbXTtcbiAgICAgIFxuICAgICAgLy8gR2VuZXJhdGUgY2l0YXRpb25zIGZvciBlYWNoIHNvdXJjZVxuICAgICAgZm9yIChjb25zdCBzb3VyY2Ugb2YgcmVzZWFyY2hSZXN1bHQuc291cmNlcykge1xuICAgICAgICBjb25zdCBjaXRhdGlvbkNvdW50ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTApICsgMTsgLy8gMS0xMCBjaXRhdGlvbnNcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2l0YXRpb25Db3VudDsgaSsrKSB7XG4gICAgICAgICAgY2l0YXRpb25zLnB1c2goe1xuICAgICAgICAgICAgaWQ6IHV1aWR2NCgpLFxuICAgICAgICAgICAgc291cmNlSWQ6IHNvdXJjZS51cmwgfHwgc291cmNlLnRpdGxlLFxuICAgICAgICAgICAgY2l0ZWRCeTogYEF1dGhvciAke2kgKyAxfWAsXG4gICAgICAgICAgICBwdWJsaWNhdGlvbkRhdGU6IG5ldyBEYXRlKERhdGUubm93KCkgLSBNYXRoLnJhbmRvbSgpICogMzE1MzYwMDAwMDApLCAvLyBSYW5kb20gZGF0ZSB3aXRoaW4gbGFzdCB5ZWFyXG4gICAgICAgICAgICBjb250ZXh0OiBgQ2l0YXRpb24gY29udGV4dCAke2kgKyAxfSBmb3IgJHtzb3VyY2UudGl0bGV9YCxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogTWF0aC5yYW5kb20oKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc2VhcmNoVG9waWM6IHJlc2VhcmNoUmVzdWx0LnN1bW1hcnkuc3BsaXQoJyAnKS5zbGljZSgwLCA1KS5qb2luKCcgJyksIC8vIEV4dHJhY3QgdG9waWMgZnJvbSBzdW1tYXJ5XG4gICAgICAgIHRvdGFsQ2l0YXRpb25zOiBjaXRhdGlvbnMubGVuZ3RoLFxuICAgICAgICBjaXRhdGlvbnMsXG4gICAgICAgIGNpdGF0aW9uR3JhcGg6IHtcbiAgICAgICAgICBub2RlczogcmVzZWFyY2hSZXN1bHQuc291cmNlcy5tYXAocyA9PiAoeyBpZDogcy51cmwgfHwgcy50aXRsZSwgbGFiZWw6IHMudGl0bGUgfSkpLFxuICAgICAgICAgIGVkZ2VzOiBjaXRhdGlvbnMubWFwKGMgPT4gKHsgXG4gICAgICAgICAgICBzb3VyY2U6IGMuc291cmNlSWQsIFxuICAgICAgICAgICAgdGFyZ2V0OiByZXNlYXJjaFJlc3VsdC5zb3VyY2VzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHJlc2VhcmNoUmVzdWx0LnNvdXJjZXMubGVuZ3RoKV0udXJsIHx8ICcnLCBcbiAgICAgICAgICAgIHdlaWdodDogYy5yZWxldmFuY2UgXG4gICAgICAgICAgfSkpXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHRyYWNraW5nIGNpdGF0aW9uczonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIFByaXZhdGUgaGVscGVyIG1ldGhvZHNcbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBtb2NrIHNlYXJjaCByZXN1bHRzXG4gICAqIEBwYXJhbSBxdWVyeSBUaGUgc2VhcmNoIHF1ZXJ5XG4gICAqIEBwYXJhbSBvcHRpb25zIFNlYXJjaCBvcHRpb25zXG4gICAqIEByZXR1cm5zIE1vY2sgc2VhcmNoIHJlc3VsdHNcbiAgICovXG4gIHByaXZhdGUgZ2VuZXJhdGVNb2NrU2VhcmNoUmVzdWx0cyhxdWVyeTogc3RyaW5nLCBvcHRpb25zOiBXZWJTZWFyY2hPcHRpb25zKTogV2ViU2VhcmNoUmVzdWx0SXRlbVtdIHtcbiAgICBjb25zdCByZXN1bHRzOiBXZWJTZWFyY2hSZXN1bHRJdGVtW10gPSBbXTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBudW1iZXIgb2YgcmVzdWx0cyBiYXNlZCBvbiB0aGUgcXVlcnkgbGVuZ3RoXG4gICAgY29uc3QgcmVzdWx0Q291bnQgPSBNYXRoLm1pbig1MCwgTWF0aC5tYXgoNSwgcXVlcnkubGVuZ3RoICogMikpO1xuICAgIFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzdWx0Q291bnQ7IGkrKykge1xuICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5nZXRSYW5kb21Tb3VyY2Uob3B0aW9ucy5zb3VyY2VzKTtcbiAgICAgIGNvbnN0IHB1Ymxpc2hEYXRlID0gdGhpcy5nZXRSYW5kb21EYXRlQnlUaW1lZnJhbWUob3B0aW9ucy50aW1lZnJhbWUpO1xuICAgICAgXG4gICAgICByZXN1bHRzLnB1c2goe1xuICAgICAgICB0aXRsZTogYCR7cXVlcnl9IC0gUmVzdWx0ICR7aSArIDF9IGZyb20gJHtzb3VyY2V9YCxcbiAgICAgICAgdXJsOiBgaHR0cHM6Ly8ke3NvdXJjZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL1xccysvZywgJycpfS5jb20vYXJ0aWNsZS0ke2kgKyAxfWAsXG4gICAgICAgIHNuaXBwZXQ6IGBUaGlzIGlzIGEgc25pcHBldCBmb3IgJHtxdWVyeX0gZnJvbSAke3NvdXJjZX0uIEl0IGNvbnRhaW5zIHJlbGV2YW50IGluZm9ybWF0aW9uIGFib3V0IHRoZSB0b3BpYy5gLFxuICAgICAgICBzb3VyY2UsXG4gICAgICAgIHB1Ymxpc2hEYXRlLFxuICAgICAgICByZWxldmFuY2VTY29yZTogTWF0aC5yYW5kb20oKSAvLyBSYW5kb20gcmVsZXZhbmNlIHNjb3JlIGJldHdlZW4gMCBhbmQgMVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiByZXN1bHRzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmFuayBzZWFyY2ggcmVzdWx0cyBieSByZWxldmFuY2VcbiAgICogQHBhcmFtIHJlc3VsdHMgVGhlIHNlYXJjaCByZXN1bHRzIHRvIHJhbmtcbiAgICogQHBhcmFtIHF1ZXJ5IFRoZSBzZWFyY2ggcXVlcnlcbiAgICogQHJldHVybnMgUmFua2VkIHNlYXJjaCByZXN1bHRzXG4gICAqL1xuICBwcml2YXRlIHJhbmtSZXN1bHRzKHJlc3VsdHM6IFdlYlNlYXJjaFJlc3VsdEl0ZW1bXSwgcXVlcnk6IHN0cmluZyk6IFdlYlNlYXJjaFJlc3VsdEl0ZW1bXSB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHVzZSBzb3BoaXN0aWNhdGVkIHJhbmtpbmcgYWxnb3JpdGhtc1xuICAgIC8vIEZvciBub3csIHdlJ2xsIHVzZSBhIHNpbXBsZSBhcHByb2FjaCBiYXNlZCBvbiBrZXl3b3JkIG1hdGNoaW5nIGFuZCByZWNlbmN5XG4gICAgXG4gICAgY29uc3QgcXVlcnlUZXJtcyA9IHF1ZXJ5LnRvTG93ZXJDYXNlKCkuc3BsaXQoL1xccysvKTtcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgYSBtb3JlIG1lYW5pbmdmdWwgcmVsZXZhbmNlIHNjb3JlXG4gICAgY29uc3Qgc2NvcmVkUmVzdWx0cyA9IHJlc3VsdHMubWFwKHJlc3VsdCA9PiB7XG4gICAgICBsZXQgc2NvcmUgPSByZXN1bHQucmVsZXZhbmNlU2NvcmU7IC8vIFN0YXJ0IHdpdGggdGhlIGluaXRpYWwgc2NvcmVcbiAgICAgIFxuICAgICAgLy8gQm9vc3Qgc2NvcmUgYmFzZWQgb24gdGl0bGUgbWF0Y2hcbiAgICAgIGNvbnN0IHRpdGxlTG93ZXIgPSByZXN1bHQudGl0bGUudG9Mb3dlckNhc2UoKTtcbiAgICAgIHF1ZXJ5VGVybXMuZm9yRWFjaCh0ZXJtID0+IHtcbiAgICAgICAgaWYgKHRpdGxlTG93ZXIuaW5jbHVkZXModGVybSkpIHtcbiAgICAgICAgICBzY29yZSArPSAwLjI7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBCb29zdCBzY29yZSBiYXNlZCBvbiBzbmlwcGV0IG1hdGNoXG4gICAgICBjb25zdCBzbmlwcGV0TG93ZXIgPSByZXN1bHQuc25pcHBldC50b0xvd2VyQ2FzZSgpO1xuICAgICAgcXVlcnlUZXJtcy5mb3JFYWNoKHRlcm0gPT4ge1xuICAgICAgICBpZiAoc25pcHBldExvd2VyLmluY2x1ZGVzKHRlcm0pKSB7XG4gICAgICAgICAgc2NvcmUgKz0gMC4xO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gQm9vc3Qgc2NvcmUgYmFzZWQgb24gcmVjZW5jeVxuICAgICAgaWYgKHJlc3VsdC5wdWJsaXNoRGF0ZSkge1xuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCBhZ2VJbkRheXMgPSAobm93LmdldFRpbWUoKSAtIHJlc3VsdC5wdWJsaXNoRGF0ZS5nZXRUaW1lKCkpIC8gKDEwMDAgKiA2MCAqIDYwICogMjQpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGFnZUluRGF5cyA8IDcpIHsgLy8gUHVibGlzaGVkIHdpdGhpbiB0aGUgbGFzdCB3ZWVrXG4gICAgICAgICAgc2NvcmUgKz0gMC4zO1xuICAgICAgICB9IGVsc2UgaWYgKGFnZUluRGF5cyA8IDMwKSB7IC8vIFB1Ymxpc2hlZCB3aXRoaW4gdGhlIGxhc3QgbW9udGhcbiAgICAgICAgICBzY29yZSArPSAwLjI7XG4gICAgICAgIH0gZWxzZSBpZiAoYWdlSW5EYXlzIDwgMzY1KSB7IC8vIFB1Ymxpc2hlZCB3aXRoaW4gdGhlIGxhc3QgeWVhclxuICAgICAgICAgIHNjb3JlICs9IDAuMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBDYXAgc2NvcmUgYXQgMS4wXG4gICAgICBzY29yZSA9IE1hdGgubWluKDEuMCwgc2NvcmUpO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5yZXN1bHQsXG4gICAgICAgIHJlbGV2YW5jZVNjb3JlOiBzY29yZVxuICAgICAgfTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBTb3J0IGJ5IHJlbGV2YW5jZSBzY29yZSAoZGVzY2VuZGluZylcbiAgICByZXR1cm4gc2NvcmVkUmVzdWx0cy5zb3J0KChhLCBiKSA9PiBiLnJlbGV2YW5jZVNjb3JlIC0gYS5yZWxldmFuY2VTY29yZSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSByZXNlYXJjaCBzb3VyY2VzIGZyb20gc2VhcmNoIHJlc3VsdHNcbiAgICogQHBhcmFtIHNlYXJjaFJlc3VsdHMgVGhlIHNlYXJjaCByZXN1bHRzIHRvIGdlbmVyYXRlIHNvdXJjZXMgZnJvbVxuICAgKiBAcmV0dXJucyBSZXNlYXJjaCBzb3VyY2VzXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUmVzZWFyY2hTb3VyY2VzKHNlYXJjaFJlc3VsdHM6IFdlYlNlYXJjaFJlc3VsdEl0ZW1bXSk6IFJlc2VhcmNoU291cmNlW10ge1xuICAgIHJldHVybiBzZWFyY2hSZXN1bHRzLm1hcChyZXN1bHQgPT4gKHtcbiAgICAgIHRpdGxlOiByZXN1bHQudGl0bGUsXG4gICAgICB1cmw6IHJlc3VsdC51cmwsXG4gICAgICBwdWJsaXNoZXI6IHJlc3VsdC5zb3VyY2UsXG4gICAgICBwdWJsaXNoRGF0ZTogcmVzdWx0LnB1Ymxpc2hEYXRlLFxuICAgICAgcmVsZXZhbmNlOiByZXN1bHQucmVsZXZhbmNlU2NvcmUsXG4gICAgICBleGNlcnB0czogW3Jlc3VsdC5zbmlwcGV0XVxuICAgIH0pKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGtleSBmaW5kaW5ncyBiYXNlZCBvbiBhIHRvcGljIGFuZCBzb3VyY2VzXG4gICAqIEBwYXJhbSB0b3BpYyBUaGUgcmVzZWFyY2ggdG9waWNcbiAgICogQHBhcmFtIHNvdXJjZXMgVGhlIHJlc2VhcmNoIHNvdXJjZXNcbiAgICogQHJldHVybnMgS2V5IGZpbmRpbmdzXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlS2V5RmluZGluZ3ModG9waWM6IHN0cmluZywgc291cmNlczogUmVzZWFyY2hTb3VyY2VbXSk6IHN0cmluZ1tdIHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgYW5hbHl6ZSB0aGUgY29udGVudCBvZiB0aGUgc291cmNlc1xuICAgIC8vIGFuZCBleHRyYWN0IGtleSBmaW5kaW5ncyB1c2luZyBOTFAgdGVjaG5pcXVlc1xuICAgIFxuICAgIC8vIEZvciBub3csIHdlJ2xsIGdlbmVyYXRlIG1vY2sgZmluZGluZ3NcbiAgICBjb25zdCBmaW5kaW5ncyA9IFtcbiAgICAgIGAke3RvcGljfSBzaG93cyBzaWduaWZpY2FudCBncm93dGggcG90ZW50aWFsIGluIHRoZSBuZXh0IDUgeWVhcnMuYCxcbiAgICAgIGBNYXJrZXQgYW5hbHlzdHMgYXJlIGdlbmVyYWxseSBwb3NpdGl2ZSBhYm91dCAke3RvcGljfSdzIGZ1dHVyZSBwcm9zcGVjdHMuYCxcbiAgICAgIGBSZWNlbnQgcmVndWxhdG9yeSBjaGFuZ2VzIG1heSBpbXBhY3QgJHt0b3BpY30gaW4gdGhlIHNob3J0IHRlcm0uYCxcbiAgICAgIGBDb21wZXRpdG9ycyBpbiB0aGUgJHt0b3BpY30gc3BhY2UgYXJlIGluY3JlYXNpbmcgdGhlaXIgUiZEIGludmVzdG1lbnRzLmAsXG4gICAgICBgQ29uc3VtZXIgc2VudGltZW50IHRvd2FyZHMgJHt0b3BpY30gaGFzIGltcHJvdmVkIG92ZXIgdGhlIGxhc3QgcXVhcnRlci5gXG4gICAgXTtcbiAgICBcbiAgICAvLyBBZGQgc29tZSBzb3VyY2Utc3BlY2lmaWMgZmluZGluZ3NcbiAgICBzb3VyY2VzLnNsaWNlKDAsIDMpLmZvckVhY2goKHNvdXJjZSwgaW5kZXgpID0+IHtcbiAgICAgIGZpbmRpbmdzLnB1c2goYEFjY29yZGluZyB0byAke3NvdXJjZS5wdWJsaXNoZXJ9LCAke3RvcGljfSBpcyBleHBlcmllbmNpbmcgJHtpbmRleCA9PT0gMCA/ICdwb3NpdGl2ZScgOiBpbmRleCA9PT0gMSA/ICdtaXhlZCcgOiAnY2hhbGxlbmdpbmcnfSBtYXJrZXQgY29uZGl0aW9ucy5gKTtcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gZmluZGluZ3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSByZWxhdGVkIHRvcGljcyBiYXNlZCBvbiBhIG1haW4gdG9waWNcbiAgICogQHBhcmFtIHRvcGljIFRoZSBtYWluIHRvcGljXG4gICAqIEByZXR1cm5zIFJlbGF0ZWQgdG9waWNzXG4gICAqL1xuICBwcml2YXRlIGdlbmVyYXRlUmVsYXRlZFRvcGljcyh0b3BpYzogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCB1c2UgdG9waWMgbW9kZWxpbmcgb3Iga25vd2xlZGdlIGdyYXBoc1xuICAgIC8vIEZvciBub3csIHdlJ2xsIGdlbmVyYXRlIG1vY2sgcmVsYXRlZCB0b3BpY3NcbiAgICBcbiAgICByZXR1cm4gW1xuICAgICAgYCR7dG9waWN9IG1hcmtldCB0cmVuZHNgLFxuICAgICAgYCR7dG9waWN9IGludmVzdG1lbnQgb3Bwb3J0dW5pdGllc2AsXG4gICAgICBgJHt0b3BpY30gcmlzayBmYWN0b3JzYCxcbiAgICAgIGAke3RvcGljfSBjb21wZXRpdGl2ZSBsYW5kc2NhcGVgLFxuICAgICAgYCR7dG9waWN9IGZ1dHVyZSBvdXRsb29rYFxuICAgIF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHN1bW1hcnkgYmFzZWQgb24gYSB0b3BpYywgZmluZGluZ3MsIGFuZCBzb3VyY2VzXG4gICAqIEBwYXJhbSB0b3BpYyBUaGUgcmVzZWFyY2ggdG9waWNcbiAgICogQHBhcmFtIGZpbmRpbmdzIFRoZSBrZXkgZmluZGluZ3NcbiAgICogQHBhcmFtIHNvdXJjZXMgVGhlIHJlc2VhcmNoIHNvdXJjZXNcbiAgICogQHJldHVybnMgUmVzZWFyY2ggc3VtbWFyeVxuICAgKi9cbiAgcHJpdmF0ZSBnZW5lcmF0ZVN1bW1hcnkodG9waWM6IHN0cmluZywgZmluZGluZ3M6IHN0cmluZ1tdLCBzb3VyY2VzOiBSZXNlYXJjaFNvdXJjZVtdKTogc3RyaW5nIHtcbiAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHRoaXMgd291bGQgZ2VuZXJhdGUgYSBjb2hlcmVudCBzdW1tYXJ5XG4gICAgLy8gYmFzZWQgb24gdGhlIGFjdHVhbCBjb250ZW50IG9mIHRoZSBzb3VyY2VzXG4gICAgXG4gICAgLy8gRm9yIG5vdywgd2UnbGwgZ2VuZXJhdGUgYSBtb2NrIHN1bW1hcnlcbiAgICByZXR1cm4gYFxuICAgICAgVGhpcyByZXNlYXJjaCBvbiAke3RvcGljfSBzeW50aGVzaXplcyBpbmZvcm1hdGlvbiBmcm9tICR7c291cmNlcy5sZW5ndGh9IHNvdXJjZXMuXG4gICAgICBUaGUgYW5hbHlzaXMgcmV2ZWFscyB0aGF0ICR7ZmluZGluZ3NbMF0udG9Mb3dlckNhc2UoKX0gQWRkaXRpb25hbGx5LCBcbiAgICAgICR7ZmluZGluZ3NbMV0udG9Mb3dlckNhc2UoKX0gSG93ZXZlciwgaXQncyBpbXBvcnRhbnQgdG8gbm90ZSB0aGF0IFxuICAgICAgJHtmaW5kaW5nc1syXS50b0xvd2VyQ2FzZSgpfVxuICAgICAgXG4gICAgICBUaGUgbW9zdCByZWxpYWJsZSBzb3VyY2VzLCBpbmNsdWRpbmcgJHtzb3VyY2VzLnNsaWNlKDAsIDMpLm1hcChzID0+IHMucHVibGlzaGVyKS5qb2luKCcsICcpfSxcbiAgICAgIHN1Z2dlc3QgdGhhdCAke3RvcGljfSB3YXJyYW50cyBjYXJlZnVsIGNvbnNpZGVyYXRpb24gZm9yIGludmVzdG1lbnQgcHVycG9zZXMuXG4gICAgICBGdXJ0aGVyIHJlc2VhcmNoIG1heSBiZSBuZWVkZWQgb24gJHt0b3BpY30gbWFya2V0IHRyZW5kcyBhbmQgY29tcGV0aXRpdmUgbGFuZHNjYXBlLlxuICAgIGAudHJpbSgpLnJlcGxhY2UoL1xccysvZywgJyAnKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBjb25maWRlbmNlIHNjb3JlIGZvciByZXNlYXJjaCByZXN1bHRzXG4gICAqIEBwYXJhbSBzb3VyY2VzIFRoZSByZXNlYXJjaCBzb3VyY2VzXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSByZXNlYXJjaCBvcHRpb25zXG4gICAqIEByZXR1cm5zIENvbmZpZGVuY2Ugc2NvcmUgYmV0d2VlbiAwIGFuZCAxXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZUNvbmZpZGVuY2Uoc291cmNlczogUmVzZWFyY2hTb3VyY2VbXSwgb3B0aW9uczogRGVlcFJlc2VhcmNoT3B0aW9ucyk6IG51bWJlciB7XG4gICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIHVzZSBtb3JlIHNvcGhpc3RpY2F0ZWQgbWV0aG9kc1xuICAgIC8vIHRvIGFzc2VzcyB0aGUgY29uZmlkZW5jZSBvZiB0aGUgcmVzZWFyY2ggcmVzdWx0c1xuICAgIFxuICAgIC8vIEZvciBub3csIHdlJ2xsIHVzZSBhIHNpbXBsZSBhcHByb2FjaCBiYXNlZCBvbiBzb3VyY2UgY291bnQgYW5kIHJlbGV2YW5jZVxuICAgIFxuICAgIC8vIEJhc2UgY29uZmlkZW5jZSBvbiBudW1iZXIgb2Ygc291cmNlcyAobW9yZSBzb3VyY2VzID0gaGlnaGVyIGNvbmZpZGVuY2UpXG4gICAgbGV0IGNvbmZpZGVuY2UgPSBNYXRoLm1pbigwLjUsIHNvdXJjZXMubGVuZ3RoIC8gMjApO1xuICAgIFxuICAgIC8vIEFkZCBjb25maWRlbmNlIGJhc2VkIG9uIGF2ZXJhZ2UgcmVsZXZhbmNlIG9mIHNvdXJjZXNcbiAgICBjb25zdCBhdmdSZWxldmFuY2UgPSBzb3VyY2VzLnJlZHVjZSgoc3VtLCBzb3VyY2UpID0+IHN1bSArIHNvdXJjZS5yZWxldmFuY2UsIDApIC8gc291cmNlcy5sZW5ndGg7XG4gICAgY29uZmlkZW5jZSArPSBhdmdSZWxldmFuY2UgKiAwLjM7XG4gICAgXG4gICAgLy8gQWRkIGNvbmZpZGVuY2UgYmFzZWQgb24gcmVzZWFyY2ggZGVwdGhcbiAgICBzd2l0Y2ggKG9wdGlvbnMuZGVwdGgpIHtcbiAgICAgIGNhc2UgJ2NvbXByZWhlbnNpdmUnOlxuICAgICAgICBjb25maWRlbmNlICs9IDAuMjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkZWVwJzpcbiAgICAgICAgY29uZmlkZW5jZSArPSAwLjE1O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0YW5kYXJkJzpcbiAgICAgICAgY29uZmlkZW5jZSArPSAwLjE7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICAvLyBDYXAgYXQgMS4wXG4gICAgcmV0dXJuIE1hdGgubWluKDEuMCwgY29uZmlkZW5jZSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gc291cmNlIGZyb20gYSBsaXN0IG9mIHNvdXJjZXMgb3IgZGVmYXVsdCBzb3VyY2VzXG4gICAqIEBwYXJhbSBzb3VyY2VzIFRoZSBsaXN0IG9mIHNvdXJjZXMgdG8gY2hvb3NlIGZyb21cbiAgICogQHJldHVybnMgQSByYW5kb20gc291cmNlXG4gICAqL1xuICBwcml2YXRlIGdldFJhbmRvbVNvdXJjZShzb3VyY2VzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgY29uc3Qgc291cmNlTGlzdCA9IHNvdXJjZXMubGVuZ3RoID4gMCA/IHNvdXJjZXMgOiB0aGlzLmRlZmF1bHRTb3VyY2VzO1xuICAgIFxuICAgIGlmIChzb3VyY2VMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gSWYgbm8gc291cmNlcyBhcmUgcHJvdmlkZWQsIHVzZSBzb21lIGRlZmF1bHQgZmluYW5jaWFsIHNvdXJjZXNcbiAgICAgIGNvbnN0IGRlZmF1bHRGaW5hbmNpYWxTb3VyY2VzID0gW1xuICAgICAgICAnQmxvb21iZXJnJywgJ1JldXRlcnMnLCAnRmluYW5jaWFsIFRpbWVzJywgJ1dhbGwgU3RyZWV0IEpvdXJuYWwnLFxuICAgICAgICAnQ05CQycsICdGb3JiZXMnLCAnVGhlIEVjb25vbWlzdCcsICdNb3JuaW5nc3RhcicsICdNYXJrZXRXYXRjaCdcbiAgICAgIF07XG4gICAgICByZXR1cm4gZGVmYXVsdEZpbmFuY2lhbFNvdXJjZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZGVmYXVsdEZpbmFuY2lhbFNvdXJjZXMubGVuZ3RoKV07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBzb3VyY2VMaXN0W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNvdXJjZUxpc3QubGVuZ3RoKV07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSByYW5kb20gZGF0ZSBiYXNlZCBvbiBhIHRpbWVmcmFtZVxuICAgKiBAcGFyYW0gdGltZWZyYW1lIFRoZSB0aW1lZnJhbWUgdG8gZ2VuZXJhdGUgYSBkYXRlIHdpdGhpblxuICAgKiBAcmV0dXJucyBBIHJhbmRvbSBkYXRlIHdpdGhpbiB0aGUgc3BlY2lmaWVkIHRpbWVmcmFtZVxuICAgKi9cbiAgcHJpdmF0ZSBnZXRSYW5kb21EYXRlQnlUaW1lZnJhbWUodGltZWZyYW1lOiAncmVjZW50JyB8ICdwYXN0LXdlZWsnIHwgJ3Bhc3QtbW9udGgnIHwgJ3Bhc3QteWVhcicgfCAnYWxsLXRpbWUnKTogRGF0ZSB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBsZXQgbWluRGF0ZTogRGF0ZTtcbiAgICBcbiAgICBzd2l0Y2ggKHRpbWVmcmFtZSkge1xuICAgICAgY2FzZSAncmVjZW50JzpcbiAgICAgICAgbWluRGF0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSAzICogMjQgKiA2MCAqIDYwICogMTAwMCk7IC8vIDMgZGF5cyBhZ29cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwYXN0LXdlZWsnOlxuICAgICAgICBtaW5EYXRlID0gbmV3IERhdGUobm93LmdldFRpbWUoKSAtIDcgKiAyNCAqIDYwICogNjAgKiAxMDAwKTsgLy8gNyBkYXlzIGFnb1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3Bhc3QtbW9udGgnOlxuICAgICAgICBtaW5EYXRlID0gbmV3IERhdGUobm93LmdldFRpbWUoKSAtIDMwICogMjQgKiA2MCAqIDYwICogMTAwMCk7IC8vIDMwIGRheXMgYWdvXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncGFzdC15ZWFyJzpcbiAgICAgICAgbWluRGF0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSAzNjUgKiAyNCAqIDYwICogNjAgKiAxMDAwKTsgLy8gMzY1IGRheXMgYWdvXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYWxsLXRpbWUnOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbWluRGF0ZSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgLSA1ICogMzY1ICogMjQgKiA2MCAqIDYwICogMTAwMCk7IC8vIDUgeWVhcnMgYWdvXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbmV3IERhdGUobWluRGF0ZS5nZXRUaW1lKCkgKyBNYXRoLnJhbmRvbSgpICogKG5vdy5nZXRUaW1lKCkgLSBtaW5EYXRlLmdldFRpbWUoKSkpO1xuICB9XG59XG5cbi8qKlxuICogU291cmNlIHZlcmlmaWNhdGlvbiByZXN1bHQgaW50ZXJmYWNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlVmVyaWZpY2F0aW9uUmVzdWx0IHtcbiAgc291cmNlOiBSZXNlYXJjaFNvdXJjZTtcbiAgaXNWZXJpZmllZDogYm9vbGVhbjtcbiAgY3JlZGliaWxpdHlTY29yZTogbnVtYmVyO1xuICBmYWN0b3JzOiB7XG4gICAgaXNLbm93blNvdXJjZTogYm9vbGVhbjtcbiAgICBoYXNDaXRhdGlvbnM6IGJvb2xlYW47XG4gICAgaXNSZWNlbnRseVVwZGF0ZWQ6IGJvb2xlYW47XG4gIH07XG4gIHZlcmlmaWNhdGlvbk1ldGhvZDogJ2F1dG9tYXRlZC1jaGVjaycgfCAnbWFudWFsLXJldmlldyc7XG59XG5cbi8qKlxuICogQ2l0YXRpb24gaW50ZXJmYWNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2l0YXRpb24ge1xuICBpZDogc3RyaW5nO1xuICBzb3VyY2VJZDogc3RyaW5nO1xuICBjaXRlZEJ5OiBzdHJpbmc7XG4gIHB1YmxpY2F0aW9uRGF0ZTogRGF0ZTtcbiAgY29udGV4dDogc3RyaW5nO1xuICByZWxldmFuY2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBDaXRhdGlvbiB0cmFja2luZyByZXN1bHQgaW50ZXJmYWNlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ2l0YXRpb25UcmFja2luZ1Jlc3VsdCB7XG4gIHJlc2VhcmNoVG9waWM6IHN0cmluZztcbiAgdG90YWxDaXRhdGlvbnM6IG51bWJlcjtcbiAgY2l0YXRpb25zOiBDaXRhdGlvbltdO1xuICBjaXRhdGlvbkdyYXBoOiB7XG4gICAgbm9kZXM6IHsgaWQ6IHN0cmluZzsgbGFiZWw6IHN0cmluZyB9W107XG4gICAgZWRnZXM6IHsgc291cmNlOiBzdHJpbmc7IHRhcmdldDogc3RyaW5nOyB3ZWlnaHQ6IG51bWJlciB9W107XG4gIH07XG59Il19