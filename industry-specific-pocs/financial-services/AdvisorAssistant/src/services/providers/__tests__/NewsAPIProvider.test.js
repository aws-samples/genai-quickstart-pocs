/**
 * NewsAPIProvider Tests
 * 
 * Tests for NewsAPI provider including:
 * - Constructor and API key validation
 * - Daily quota management
 * - Request queuing system
 * - Error handling
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const NewsAPIProvider = require('../NewsAPIProvider');

// Mock axios to avoid real API calls
jest.mock('axios');
const axios = require('axios');
const mockAxios = axios;

describe('NewsAPIProvider', () => {
  let provider;
  const mockApiKey = 'test-newsapi-key-12345';

  beforeEach(() => {
    // Clear any global quota storage
    global.newsApiQuotaStorage = {};
    
    // Set up environment variable
    process.env.NEWSAPI_KEY = mockApiKey;
    
    // Reset axios mock
    axios.mockClear();
    
    // Mock successful API response
    axios.mockResolvedValue({
      data: {
        status: 'ok',
        totalResults: 10,
        articles: []
      }
    });
  });

  afterEach(() => {
    if (provider) {
      provider.cleanup();
    }
    delete process.env.NEWSAPI_KEY;
  });

  describe('Constructor', () => {
    test('should initialize with valid API key', () => {
      provider = new NewsAPIProvider();
      
      expect(provider.getProviderName()).toBe('newsapi');
      expect(provider.apiKey).toBe(mockApiKey);
      expect(provider.dailyQuota.limit).toBe(1000);
      expect(provider.dailyQuota.used).toBe(0);
    });

    test('should throw error without API key', () => {
      delete process.env.NEWSAPI_KEY;
      
      expect(() => {
        new NewsAPIProvider();
      }).toThrow('NewsAPI API key is required');
    });

    test('should initialize quota management', () => {
      provider = new NewsAPIProvider();
      
      expect(provider.dailyQuota).toMatchObject({
        limit: 1000,
        used: 0,
        requestQueue: [],
        processing: false
      });
      expect(provider.dailyQuota.resetTime).toBeInstanceOf(Date);
    });
  });

  describe('Quota Management', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should check if request can be made', () => {
      expect(provider.canMakeRequest()).toBe(true);
      
      provider.dailyQuota.used = 999;
      expect(provider.canMakeRequest()).toBe(true);
      
      provider.dailyQuota.used = 1000;
      expect(provider.canMakeRequest()).toBe(false);
    });

    test('should calculate remaining quota correctly', () => {
      expect(provider.getRemainingQuota()).toBe(1000);
      
      provider.dailyQuota.used = 250;
      expect(provider.getRemainingQuota()).toBe(750);
      
      provider.dailyQuota.used = 1000;
      expect(provider.getRemainingQuota()).toBe(0);
      
      provider.dailyQuota.used = 1100; // Over limit
      expect(provider.getRemainingQuota()).toBe(0);
    });

    test('should reset daily quota', () => {
      provider.dailyQuota.used = 500;
      const oldResetTime = provider.dailyQuota.resetTime;
      
      provider.resetDailyQuota();
      
      expect(provider.dailyQuota.used).toBe(0);
      expect(provider.dailyQuota.resetTime.getTime()).toBeGreaterThanOrEqual(oldResetTime.getTime());
    });

    test('should get next reset time correctly', () => {
      const resetTime = provider.getNextResetTime();
      const now = new Date();
      
      expect(resetTime.getTime()).toBeGreaterThan(now.getTime());
      expect(resetTime.getUTCHours()).toBe(0);
      expect(resetTime.getUTCMinutes()).toBe(0);
      expect(resetTime.getUTCSeconds()).toBe(0);
    });
  });

  describe('Request Queuing', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should execute request immediately when quota available', async () => {
      const mockFunction = jest.fn().mockResolvedValue('test result');
      
      const result = await provider.queueRequest(mockFunction);
      
      expect(result).toBe('test result');
      expect(mockFunction).toHaveBeenCalledTimes(1);
      expect(provider.dailyQuota.requestQueue).toHaveLength(0);
    });

    test('should queue request when quota exceeded', async () => {
      provider.dailyQuota.used = 1000; // Exceed quota
      const mockFunction = jest.fn().mockResolvedValue('queued result');
      
      // Start the queued request (it should not resolve immediately)
      const requestPromise = provider.queueRequest(mockFunction);
      
      // Verify request is queued
      expect(provider.dailyQuota.requestQueue).toHaveLength(1);
      expect(mockFunction).not.toHaveBeenCalled();
      
      // Reset quota to allow processing
      provider.dailyQuota.used = 0;
      await provider.processRequestQueue();
      
      const result = await requestPromise;
      expect(result).toBe('queued result');
      expect(mockFunction).toHaveBeenCalledTimes(1);
    });

    test('should handle queued request errors', async () => {
      provider.dailyQuota.used = 1000; // Exceed quota
      const mockFunction = jest.fn().mockRejectedValue(new Error('Test error'));
      
      const requestPromise = provider.queueRequest(mockFunction);
      
      // Reset quota and process queue
      provider.dailyQuota.used = 0;
      await provider.processRequestQueue();
      
      await expect(requestPromise).rejects.toThrow('Test error');
    });
  });

  describe('API Requests', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should make API request and increment quota', async () => {
      const response = await provider.executeApiRequest('everything', { q: 'test' });
      
      expect(axios).toHaveBeenCalledWith({
        url: 'https://newsapi.org/v2/everything?apiKey=test-newsapi-key-12345&q=test',
        timeout: 15000
      });
      expect(provider.dailyQuota.used).toBe(1);
      expect(response.status).toBe('ok');
    });

    test('should handle rate limit errors', async () => {
      axios.mockRejectedValue({
        response: { status: 429 }
      });
      
      await expect(provider.executeApiRequest('everything', { q: 'test' }))
        .rejects.toThrow('NewsAPI rate limit exceeded');
    });

    test('should handle authentication errors', async () => {
      axios.mockRejectedValue({
        response: { status: 401 }
      });
      
      await expect(provider.executeApiRequest('everything', { q: 'test' }))
        .rejects.toThrow('NewsAPI authentication failed');
    });

    test('should queue request when quota exceeded', async () => {
      provider.dailyQuota.used = 1000;
      
      const requestPromise = provider.makeApiRequest('everything', { q: 'test' });
      
      // Should be queued, not executed immediately
      expect(provider.dailyQuota.requestQueue).toHaveLength(1);
      expect(axios).not.toHaveBeenCalled();
      
      // Reset quota and verify request executes
      provider.dailyQuota.used = 0;
      await provider.processRequestQueue();
      
      await requestPromise;
      expect(axios).toHaveBeenCalled();
    });
  });

  describe('Interface Methods', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should return null for unsupported stock price method', async () => {
      const result = await provider.getStockPrice('AAPL');
      expect(result).toBeNull();
    });

    test('should return empty array for unsupported earnings method', async () => {
      const result = await provider.getEarningsData('AAPL');
      expect(result).toEqual([]);
    });

    test('should return null for unsupported company info method', async () => {
      const result = await provider.getCompanyInfo('AAPL');
      expect(result).toBeNull();
    });

    test('should return empty result for unsupported update method', async () => {
      const result = await provider.updateStockPrices();
      expect(result).toEqual({ updated: 0, errors: [] });
    });

    test('should fetch ticker-specific news', async () => {
      const mockArticles = [
        {
          title: 'Apple (AAPL) Reports Strong Earnings',
          description: 'Apple Inc. reported better than expected earnings',
          url: 'https://example.com/apple-earnings',
          source: { name: 'Reuters' },
          publishedAt: '2025-08-07T10:00:00Z',
          author: 'John Doe'
        }
      ];
      
      axios.mockResolvedValue({
        data: {
          status: 'ok',
          articles: mockArticles
        }
      });
      
      const result = await provider.getMarketNews('AAPL');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        headline: 'Apple (AAPL) Reports Strong Earnings',
        summary: 'Apple Inc. reported better than expected earnings',
        url: 'https://example.com/apple-earnings',
        source: 'Reuters',
        ticker: 'AAPL'
      });
      expect(result[0].relevanceScore).toBeGreaterThan(0.5);
      expect(result[0].sentiment).toBeDefined();
      expect(result[0].sentimentScore).toBeDefined();
    });

    test('should fetch general market news', async () => {
      const mockArticles = [
        {
          title: 'Stock Market Reaches New Highs',
          description: 'Major indices hit record levels amid strong earnings',
          url: 'https://example.com/market-highs',
          source: { name: 'CNBC' },
          publishedAt: '2025-08-07T09:00:00Z'
        }
      ];
      
      axios.mockResolvedValue({
        data: {
          status: 'ok',
          articles: mockArticles
        }
      });
      
      const result = await provider.getMarketNews();
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        headline: 'Stock Market Reaches New Highs',
        summary: 'Major indices hit record levels amid strong earnings',
        source: 'CNBC',
        ticker: null
      });
    });

    test('should handle empty news response', async () => {
      axios.mockResolvedValue({
        data: {
          status: 'ok',
          articles: []
        }
      });
      
      const result = await provider.getMarketNews('AAPL');
      expect(result).toEqual([]);
    });

    test('should filter irrelevant articles', async () => {
      const mockArticles = [
        {
          title: 'Apple (AAPL) Reports Strong Earnings',
          description: 'Apple Inc. reported better than expected earnings',
          url: 'https://example.com/apple-earnings',
          source: { name: 'Reuters' },
          publishedAt: '2025-08-07T10:00:00Z'
        },
        {
          title: 'Random Sports News',
          description: 'Sports team wins championship',
          url: 'https://example.com/sports',
          source: { name: 'ESPN' },
          publishedAt: '2025-08-07T10:00:00Z'
        }
      ];
      
      axios.mockResolvedValue({
        data: {
          status: 'ok',
          articles: mockArticles
        }
      });
      
      const result = await provider.getMarketNews('AAPL');
      
      expect(result).toHaveLength(1);
      expect(result[0].headline).toBe('Apple (AAPL) Reports Strong Earnings');
    });
  });

  describe('Statistics and Configuration', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should return provider statistics with quota info', () => {
      provider.dailyQuota.used = 150;
      
      const stats = provider.getStats();
      
      expect(stats.provider).toBe('newsapi');
      expect(stats.quota).toMatchObject({
        used: 150,
        limit: 1000,
        remaining: 850,
        queueLength: 0
      });
      expect(stats.quota.resetTime).toBeDefined();
    });

    test('should return provider configuration', () => {
      const config = provider.getProviderConfig();
      
      expect(config).toMatchObject({
        name: 'newsapi',
        version: '1.0.0',
        capabilities: ['news', 'sentiment'],
        quotaLimit: 1000,
        quotaUsed: 0,
        quotaRemaining: 1000
      });
    });
  });

  describe('News Processing', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should get company name from ticker', () => {
      expect(provider.getCompanyNameFromTicker('AAPL')).toBe('Apple');
      expect(provider.getCompanyNameFromTicker('MSFT')).toBe('Microsoft');
      expect(provider.getCompanyNameFromTicker('UNKNOWN')).toBeNull();
    });

    test('should remove duplicate articles', () => {
      const articles = [
        { url: 'https://example.com/1', title: 'Article 1' },
        { url: 'https://example.com/2', title: 'Article 2' },
        { url: 'https://example.com/1', title: 'Article 1 Duplicate' },
        { url: null, title: 'No URL Article' },
        { url: null, title: 'Another No URL Article' }
      ];
      
      const unique = provider.removeDuplicateArticles(articles);
      
      expect(unique).toHaveLength(2);
      expect(unique.map(a => a.url)).toEqual(['https://example.com/1', 'https://example.com/2']);
    });

    test('should filter relevant articles for ticker', () => {
      const articles = [
        {
          title: 'Apple (AAPL) Reports Earnings',
          description: 'Apple Inc. quarterly results'
        },
        {
          title: 'Microsoft News',
          description: 'Microsoft announces new product'
        },
        {
          title: 'Random News',
          description: 'Unrelated content'
        }
      ];
      
      const filtered = provider.filterRelevantArticles(articles, 'AAPL');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('Apple (AAPL) Reports Earnings');
    });

    test('should filter relevant articles for general market', () => {
      const articles = [
        {
          title: 'Stock Market Update',
          description: 'Market reaches new highs'
        },
        {
          title: 'Sports News',
          description: 'Team wins championship'
        },
        {
          title: 'Economic Report',
          description: 'Fed announces interest rate decision'
        }
      ];
      
      const filtered = provider.filterRelevantArticles(articles, null);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.title)).toEqual(['Stock Market Update', 'Economic Report']);
    });

    test('should calculate relevance score', () => {
      const article = {
        title: 'Apple (AAPL) Reports Strong Earnings',
        description: 'Apple Inc. beats revenue expectations',
        source: { name: 'Reuters' },
        publishedAt: new Date().toISOString()
      };
      
      const score = provider.calculateRelevanceScore(article, 'AAPL');
      
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    test('should format news article correctly', () => {
      const rawArticle = {
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com/test',
        source: { name: 'Test Source' },
        publishedAt: '2025-08-07T10:00:00Z',
        author: 'Test Author',
        urlToImage: 'https://example.com/image.jpg'
      };
      
      const formatted = provider.formatNewsArticle(rawArticle, 'AAPL');
      
      expect(formatted).toMatchObject({
        headline: 'Test Article',
        summary: 'Test description',
        url: 'https://example.com/test',
        source: 'Test Source',
        publishedAt: '2025-08-07T10:00:00Z',
        author: 'Test Author',
        urlToImage: 'https://example.com/image.jpg',
        ticker: 'AAPL'
      });
      expect(typeof formatted.relevanceScore).toBe('number');
    });
  });

  describe('AI-Only Sentiment Analysis', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should mark articles for AI sentiment analysis', async () => {
      // Mock successful API response
      mockAxios.mockResolvedValueOnce({
        data: {
          status: 'ok',
          articles: [
            {
              title: 'Apple (AAPL) Surges on Strong Earnings Beat',
              description: 'Apple reports impressive revenue growth and beats expectations',
              url: 'https://example.com/apple-earnings',
              source: { name: 'Reuters' },
              publishedAt: '2024-01-15T10:00:00Z'
            }
          ]
        }
      });

      const articles = await provider.getMarketNews('AAPL');
      
      expect(articles).toHaveLength(1);
      expect(articles[0].sentiment).toBe('ai_analysis_required');
      expect(articles[0].sentimentScore).toBeNull();
      expect(articles[0].needsAiSentiment).toBe(true);
    });

    test('should not provide manual sentiment analysis methods', () => {
      // Verify that manual sentiment methods have been removed
      expect(provider.analyzeSentiment).toBeUndefined();
      expect(provider.countKeywords).toBeUndefined();
      expect(provider.adjustSentimentForTicker).toBeUndefined();
      expect(provider.getSentimentLabel).toBeUndefined();
      expect(provider.calculateSentimentConfidence).toBeUndefined();
      expect(provider.getSentimentStatistics).toBeUndefined();
      expect(provider.determineSentimentTrend).toBeUndefined();
    });

    test('should format articles for AI processing', async () => {
      // Mock successful API response
      mockAxios.mockResolvedValueOnce({
        data: {
          status: 'ok',
          articles: [
            {
              title: 'Tesla Reports Q4 Results',
              description: 'Tesla announces quarterly earnings',
              url: 'https://example.com/tesla-earnings',
              source: { name: 'Bloomberg' },
              publishedAt: '2024-01-15T10:00:00Z'
            }
          ]
        }
      });

      const articles = await provider.getMarketNews('TSLA');
      
      expect(articles[0]).toHaveProperty('headline');
      expect(articles[0]).toHaveProperty('summary');
      expect(articles[0]).toHaveProperty('needsAiSentiment', true);
      expect(articles[0]).toHaveProperty('sentiment', 'ai_analysis_required');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources and reject queued requests', () => {
      provider = new NewsAPIProvider();
      
      // Add a queued request
      const mockReject = jest.fn();
      provider.dailyQuota.requestQueue.push({
        execute: jest.fn(),
        resolve: jest.fn(),
        reject: mockReject,
        timestamp: Date.now()
      });
      
      provider.cleanup();
      
      expect(mockReject).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Provider is being cleaned up'
        })
      );
      expect(provider.dailyQuota.requestQueue).toHaveLength(0);
    });
  });
});