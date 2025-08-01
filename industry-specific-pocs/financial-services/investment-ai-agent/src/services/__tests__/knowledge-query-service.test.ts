/**
 * Tests for the KnowledgeQueryService
 */

import { KnowledgeQueryService, CacheConfig } from '../knowledge-query-service';
import { ProprietaryDataService } from '../proprietary-data-service';
import { WebSearchService } from '../web-search-service';
import { MarketDataService } from '../market-data-service';
import { Query, QueryFilters, WebSearchOptions, WebSearchResult } from '../../models/services';
import { MarketDataQuery, MarketDataQueryResult } from '../../models/market-data';

// Mock dependencies
jest.mock('../proprietary-data-service');
jest.mock('../web-search-service');
jest.mock('../market-data-service');

describe('KnowledgeQueryService', () => {
  let knowledgeQueryService: KnowledgeQueryService;
  let mockProprietaryDataService: jest.Mocked<ProprietaryDataService>;
  let mockWebSearchService: jest.Mocked<WebSearchService>;
  let mockMarketDataService: jest.Mocked<MarketDataService>;
  
  const testCacheConfig: CacheConfig = {
    stdTTL: 60, // 1 minute
    checkperiod: 30,
    maxKeys: 100,
    useClones: true
  };
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockProprietaryDataService = new ProprietaryDataService('test-bucket') as jest.Mocked<ProprietaryDataService>;
    mockWebSearchService = new WebSearchService('test-api-key') as jest.Mocked<WebSearchService>;
    mockMarketDataService = {
      queryData: jest.fn()
    } as unknown as jest.Mocked<MarketDataService>;
    
    // Create service instance
    knowledgeQueryService = new KnowledgeQueryService(
      mockProprietaryDataService,
      mockWebSearchService,
      mockMarketDataService,
      testCacheConfig
    );
    
    // Mock web search results
    mockWebSearchService.performWebSearch = jest.fn().mockResolvedValue({
      results: [
        {
          title: 'Test Result 1',
          url: 'https://example.com/1',
          snippet: 'This is a test result about AAPL',
          source: 'Example Source',
          publishDate: new Date('2023-01-01'),
          relevanceScore: 0.8
        },
        {
          title: 'Test Result 2',
          url: 'https://example.com/2',
          snippet: 'This is another test result about MSFT',
          source: 'Another Source',
          publishDate: new Date('2023-02-01'),
          relevanceScore: 0.7
        }
      ],
      totalResults: 2,
      executionTime: 100
    } as WebSearchResult);
    
    // Mock market data results
    mockMarketDataService.queryData = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'md-1',
          symbol: 'AAPL',
          dataType: 'price',
          timestamp: new Date('2023-03-01'),
          value: { open: 150, high: 155, low: 148, close: 152, volume: 1000000 },
          source: 'Alpha Vantage',
          interval: 'daily'
        },
        {
          id: 'md-2',
          symbol: 'MSFT',
          dataType: 'price',
          timestamp: new Date('2023-03-01'),
          value: { open: 250, high: 255, low: 248, close: 252, volume: 800000 },
          source: 'Alpha Vantage',
          interval: 'daily'
        }
      ],
      metadata: {
        query: {} as MarketDataQuery,
        count: 2,
        executionTime: 150
      }
    } as MarketDataQueryResult);
  });
  
  describe('queryKnowledgeBase', () => {
    it('should query all data sources and return combined results', async () => {
      // Define test query and filters
      const query: Query = {
        text: 'AAPL stock performance',
        type: 'keyword'
      };
      
      const filters: QueryFilters = {
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-03-31')
        }
      };
      
      // Call the method
      const result = await knowledgeQueryService.queryKnowledgeBase(query, filters);
      
      // Verify web search was called with correct parameters
      expect(mockWebSearchService.performWebSearch).toHaveBeenCalledWith(
        'AAPL stock performance',
        expect.objectContaining({
          depth: 'comprehensive',
          timeframe: 'past-month'
        })
      );
      
      // Verify market data service was called with correct parameters
      expect(mockMarketDataService.queryData).toHaveBeenCalledWith(
        expect.objectContaining({
          symbols: ['AAPL'],
          timeRange: {
            start: new Date('2023-01-01'),
            end: new Date('2023-03-31')
          }
        })
      );
      
      // Verify result structure
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('executionTime');
      
      // Verify items were combined from both sources
      expect(result.items.length).toBeGreaterThan(0);
      
      // Verify items are ranked by relevance
      expect(result.items[0].relevanceScore).toBeGreaterThanOrEqual(result.items[1].relevanceScore);
    });
    
    it('should use cache for repeated queries', async () => {
      // Define test query and filters
      const query: Query = {
        text: 'MSFT quarterly earnings',
        type: 'keyword'
      };
      
      const filters: QueryFilters = {};
      
      // First call should query services
      await knowledgeQueryService.queryKnowledgeBase(query, filters);
      
      // Reset mocks to verify they aren't called again
      jest.clearAllMocks();
      
      // Second call should use cache
      await knowledgeQueryService.queryKnowledgeBase(query, filters);
      
      // Verify services weren't called again
      expect(mockWebSearchService.performWebSearch).not.toHaveBeenCalled();
      expect(mockMarketDataService.queryData).not.toHaveBeenCalled();
    });
    
    it('should apply relevance threshold filter', async () => {
      // Define test query and filters with relevance threshold
      const query: Query = {
        text: 'tech stocks',
        type: 'keyword'
      };
      
      const filters: QueryFilters = {
        relevanceThreshold: 0.75 // Only include items with relevance >= 0.75
      };
      
      // Call the method
      const result = await knowledgeQueryService.queryKnowledgeBase(query, filters);
      
      // Verify all items meet the threshold
      expect(result.items.every(item => item.relevanceScore >= 0.75)).toBe(true);
    });
  });
  
  describe('cache management', () => {
    it('should clear cache', () => {
      // First populate cache
      const query: Query = {
        text: 'test query',
        type: 'keyword'
      };
      
      const filters: QueryFilters = {};
      
      // Call the method to populate cache
      knowledgeQueryService.queryKnowledgeBase(query, filters);
      
      // Clear cache
      const result = knowledgeQueryService.clearCache();
      
      // Verify result
      expect(result).toBe(true);
      
      // Verify cache stats
      const stats = knowledgeQueryService.getCacheStats();
      expect(stats.keys).toBe(0);
    });
    
    it('should return cache statistics', async () => {
      // First populate cache
      const query: Query = {
        text: 'test query for stats',
        type: 'keyword'
      };
      
      const filters: QueryFilters = {};
      
      // Call the method to populate cache
      await knowledgeQueryService.queryKnowledgeBase(query, filters);
      
      // Get cache stats
      const stats = knowledgeQueryService.getCacheStats();
      
      // Verify stats structure
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats.keys).toBeGreaterThan(0);
    });
  });
});