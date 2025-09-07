/**
 * Service for handling web search and deep research capabilities
 */
import { WebSearchOptions, WebSearchResult, DeepResearchOptions, ResearchResult, ResearchSource } from '../models/services';
/**
 * Service for handling web search and deep research capabilities
 */
export declare class WebSearchService {
    private apiKey;
    private defaultSources;
    constructor(apiKey: string, defaultSources?: string[]);
    /**
     * Perform a web search with filtering and relevance ranking
     * @param query The search query
     * @param options Search options
     * @returns Search results
     */
    performWebSearch(query: string, options: WebSearchOptions): Promise<WebSearchResult>;
    /**
     * Perform deep research on a topic
     * @param topic The research topic
     * @param options Research options
     * @returns Research results
     */
    performDeepResearch(topic: string, options: DeepResearchOptions): Promise<ResearchResult>;
    /**
     * Verify a source's credibility and authenticity
     * @param source The source to verify
     * @returns Verification result
     */
    verifySource(source: ResearchSource): Promise<SourceVerificationResult>;
    /**
     * Track citations for a research result
     * @param researchResult The research result to track citations for
     * @returns Citation tracking result
     */
    trackCitations(researchResult: ResearchResult): Promise<CitationTrackingResult>;
    /**
     * Generate mock search results
     * @param query The search query
     * @param options Search options
     * @returns Mock search results
     */
    private generateMockSearchResults;
    /**
     * Rank search results by relevance
     * @param results The search results to rank
     * @param query The search query
     * @returns Ranked search results
     */
    private rankResults;
    /**
     * Generate research sources from search results
     * @param searchResults The search results to generate sources from
     * @returns Research sources
     */
    private generateResearchSources;
    /**
     * Generate key findings based on a topic and sources
     * @param topic The research topic
     * @param sources The research sources
     * @returns Key findings
     */
    private generateKeyFindings;
    /**
     * Generate related topics based on a main topic
     * @param topic The main topic
     * @returns Related topics
     */
    private generateRelatedTopics;
    /**
     * Generate a summary based on a topic, findings, and sources
     * @param topic The research topic
     * @param findings The key findings
     * @param sources The research sources
     * @returns Research summary
     */
    private generateSummary;
    /**
     * Calculate confidence score for research results
     * @param sources The research sources
     * @param options The research options
     * @returns Confidence score between 0 and 1
     */
    private calculateConfidence;
    /**
     * Get a random source from a list of sources or default sources
     * @param sources The list of sources to choose from
     * @returns A random source
     */
    private getRandomSource;
    /**
     * Get a random date based on a timeframe
     * @param timeframe The timeframe to generate a date within
     * @returns A random date within the specified timeframe
     */
    private getRandomDateByTimeframe;
}
/**
 * Source verification result interface
 */
export interface SourceVerificationResult {
    source: ResearchSource;
    isVerified: boolean;
    credibilityScore: number;
    factors: {
        isKnownSource: boolean;
        hasCitations: boolean;
        isRecentlyUpdated: boolean;
    };
    verificationMethod: 'automated-check' | 'manual-review';
}
/**
 * Citation interface
 */
export interface Citation {
    id: string;
    sourceId: string;
    citedBy: string;
    publicationDate: Date;
    context: string;
    relevance: number;
}
/**
 * Citation tracking result interface
 */
export interface CitationTrackingResult {
    researchTopic: string;
    totalCitations: number;
    citations: Citation[];
    citationGraph: {
        nodes: {
            id: string;
            label: string;
        }[];
        edges: {
            source: string;
            target: string;
            weight: number;
        }[];
    };
}
