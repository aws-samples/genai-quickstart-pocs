/**
 * Service for unified knowledge query interface across all data sources
 */
import { Query, QueryFilters, QueryResult } from '../models/services';
import { ProprietaryDataService } from './proprietary-data-service';
import { WebSearchService } from './web-search-service';
import { MarketDataService } from './market-data-service';
/**
 * Cache configuration options
 */
export interface CacheConfig {
    stdTTL: number;
    checkperiod: number;
    maxKeys: number;
    useClones: boolean;
}
/**
 * Service for unified knowledge query interface across all data sources
 */
export declare class KnowledgeQueryService {
    private proprietaryDataService;
    private webSearchService;
    private marketDataService;
    private cache;
    /**
     * Constructor
     * @param proprietaryDataService Proprietary data service
     * @param webSearchService Web search service
     * @param marketDataService Market data service
     * @param cacheConfig Cache configuration (optional)
     */
    constructor(proprietaryDataService: ProprietaryDataService, webSearchService: WebSearchService, marketDataService: MarketDataService, cacheConfig?: Partial<CacheConfig>);
    /**
     * Query knowledge base across all data sources
     * @param query Query parameters
     * @param filters Query filters
     * @returns Query results
     */
    queryKnowledgeBase(query: Query, filters: QueryFilters): Promise<QueryResult>;
    /**
     * Clear the cache
     * @returns True if cache was cleared successfully
     */
    clearCache(): boolean;
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    getCacheStats(): {
        keys: number;
        hits: number;
        misses: number;
        ksize: number;
        vsize: number;
    };
    /**
     * Query proprietary data
     * @param query Query parameters
     * @param filters Query filters
     * @returns Query result items
     */
    private queryProprietaryData;
    /**
     * Query web search
     * @param query Query parameters
     * @param filters Query filters
     * @returns Query result items
     */
    private queryWebSearch;
    /**
     * Query market data
     * @param query Query parameters
     * @param filters Query filters
     * @returns Query result items
     */
    private queryMarketData;
    /**
     * Rank results based on relevance to query
     * @param results Query result items
     * @param query Query parameters
     * @returns Ranked query result items
     */
    private rankResults;
    /**
     * Generate a cache key based on query and filters
     * @param query Query parameters
     * @param filters Query filters
     * @returns Cache key
     */
    private generateCacheKey;
    /**
     * Convert date range to timeframe
     * @param dateRange Date range
     * @returns Timeframe
     */
    private convertDateRangeToTimeframe;
    /**
     * Extract stock symbols from query text
     * @param queryText Query text
     * @returns Array of stock symbols
     */
    private extractSymbolsFromQuery;
}
