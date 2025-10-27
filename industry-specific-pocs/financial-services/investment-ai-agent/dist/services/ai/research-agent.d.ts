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
import { ClaudeHaikuService } from './claude-haiku-service';
import { WebSearchService } from '../web-search-service';
import { ProprietaryDataService } from '../proprietary-data-service';
import { MarketDataService } from '../market-data-service';
import { AgentMessage, ConversationContext } from '../../models/agent';
import { ResearchSource } from '../../models/services';
export interface ResearchRequest {
    topic: string;
    researchType: 'web-search' | 'deep-research' | 'market-analysis' | 'proprietary-analysis' | 'comprehensive';
    parameters: {
        timeframe?: 'recent' | 'past-week' | 'past-month' | 'past-year' | 'all-time';
        sources?: string[];
        depth?: 'basic' | 'standard' | 'deep' | 'comprehensive';
        focusAreas?: string[];
        excludeSources?: string[];
        includeMarketData?: boolean;
        includeProprietaryData?: boolean;
        maxResults?: number;
    };
    context?: ConversationContext;
}
export interface ResearchResponse {
    summary: string;
    keyFindings: string[];
    trends: TrendAnalysis[];
    patterns: PatternAnalysis[];
    sources: ResearchSource[];
    marketInsights?: MarketInsight[];
    proprietaryInsights?: ProprietaryInsight[];
    confidence: number;
    recommendations: string[];
    relatedTopics: string[];
    executionTime: number;
}
export interface TrendAnalysis {
    trend: string;
    direction: 'upward' | 'downward' | 'stable' | 'volatile';
    strength: 'weak' | 'moderate' | 'strong';
    timeframe: string;
    confidence: number;
    supportingEvidence: string[];
    implications: string[];
}
export interface PatternAnalysis {
    pattern: string;
    type: 'cyclical' | 'seasonal' | 'correlation' | 'anomaly' | 'emerging';
    frequency?: string;
    strength: number;
    confidence: number;
    description: string;
    historicalOccurrences: number;
    predictiveValue: 'low' | 'medium' | 'high';
}
export interface MarketInsight {
    metric: string;
    value: number;
    change: number;
    changePercent: number;
    significance: 'low' | 'medium' | 'high';
    interpretation: string;
    timestamp: Date;
}
export interface ProprietaryInsight {
    dataSource: string;
    insight: string;
    relevance: number;
    confidence: number;
    supportingData: any;
}
export interface ProprietaryDataQuery {
    searchTerm: string;
    dataTypes: string[];
    timeframe: string;
    maxResults: number;
}
export interface ProprietaryDataResult {
    results: any[];
    sources: any[];
    confidence: number;
    totalResults: number;
}
export interface InformationExtractionResult {
    entities: ExtractedEntity[];
    keyMetrics: ExtractedMetric[];
    sentiments: SentimentAnalysis[];
    topics: ExtractedTopic[];
    relationships: EntityRelationship[];
}
export interface ExtractedEntity {
    name: string;
    type: 'company' | 'person' | 'location' | 'product' | 'concept' | 'financial-instrument';
    confidence: number;
    mentions: number;
    context: string[];
}
export interface ExtractedMetric {
    name: string;
    value: number;
    unit?: string;
    context: string;
    source: string;
    timestamp?: Date;
    confidence: number;
}
export interface SentimentAnalysis {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
    aspects: {
        aspect: string;
        sentiment: 'positive' | 'negative' | 'neutral';
        score: number;
    }[];
}
export interface ExtractedTopic {
    topic: string;
    relevance: number;
    keywords: string[];
    frequency: number;
}
export interface EntityRelationship {
    entity1: string;
    entity2: string;
    relationship: string;
    strength: number;
    context: string;
}
/**
 * Research Agent class that handles all research-related tasks
 */
export declare class ResearchAgent {
    private claudeHaikuService;
    private webSearchService;
    private proprietaryDataService;
    private marketDataService;
    private agentType;
    constructor(claudeHaikuService: ClaudeHaikuService, webSearchService: WebSearchService, proprietaryDataService: ProprietaryDataService, marketDataService: MarketDataService);
    /**
     * Process a research request and return comprehensive research results
     */
    processResearchRequest(request: ResearchRequest): Promise<ResearchResponse>;
    /**
     * Perform web search research
     */
    private performWebSearchResearch;
    /**
     * Perform deep research
     */
    private performDeepResearch;
    /**
     * Perform market analysis research
     */
    private performMarketAnalysis;
    /**
     * Perform proprietary data analysis
     */
    private performProprietaryAnalysis;
    /**
     * Perform comprehensive research combining all sources
     */
    private performComprehensiveResearch;
    /**
     * Extract information from text using Claude Haiku
     */
    private extractInformation;
    /**
     * Identify trends from search results
     */
    private identifyTrends;
    /**
     * Identify patterns from search results
     */
    private identifyPatterns;
    private identifyAdvancedTrends;
    private identifyAdvancedPatterns;
    private analyzeMarketData;
    private identifyMarketTrends;
    private identifyMarketPatterns;
    private analyzeProprietaryData;
    private identifyProprietaryTrends;
    private identifyProprietaryPatterns;
    private generateSummary;
    private generateKeyFindings;
    private generateRecommendations;
    private calculateConfidence;
    private calculateMarketConfidence;
    private calculateComprehensiveConfidence;
    private synthesizeComprehensiveResults;
    private synthesizeKeyFindings;
    private synthesizeRecommendations;
    private combineRelatedTopics;
    private generateAdvancedFindings;
    private generateAdvancedRecommendations;
    private generateMarketSummary;
    private generateMarketFindings;
    private generateMarketRecommendations;
    private generateRelatedMarketTopics;
    private generateProprietarySummary;
    private generateProprietaryFindings;
    private generateProprietaryRecommendations;
    private generateRelatedProprietaryTopics;
    /**
     * Handle agent messages for communication with other agents
     */
    handleMessage(message: AgentMessage): Promise<AgentMessage>;
}
