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

  describe('Sentiment Analysis', () => {
    beforeEach(() => {
      provider = new NewsAPIProvider();
    });

    test('should analyze positive sentiment', () => {
      const article = {
        title: 'Apple (AAPL) Surges on Strong Earnings Beat',
        description: 'Apple reports impressive revenue growth and beats expectations'
      };
      
      const sentiment = provider.analyzeSentiment(article, 'AAPL');
      
      expect(sentiment.score).toBeGreaterThan(0);
      expect(sentiment.label).toMatch(/positive/);
      expect(sentiment.confidence).toBeGreaterThan(0.3);
      expect(sentiment.keywordCounts.positive).toBeGreaterThan(0);
    });

    test('should analyze negative sentiment', () => {
      const article = {
        title: 'Tesla (TSLA) Plunges After Disappointing Results',
        description: 'Tesla misses revenue expectations and cuts guidance'
      };
      
      const sentiment = provider.analyzeSentiment(article, 'TSLA');
      
      expect(sentiment.score).toBeLessThan(0);
      expect(sentiment.label).toMatch(/negative/);
      expect(sentiment.confidence).toBeGreaterThan(0.3);
      expect(sentiment.keywordCounts.negative).toBeGreaterThan(0);
    });

    test('should analyze neutral sentiment', () => {
      const article = {
        title: 'Microsoft Maintains Steady Performance',
        description: 'Microsoft reports stable results in line with expectations'
      };
      
      const sentiment = provider.analyzeSentiment(article, 'MSFT');
      
      expect(Math.abs(sentiment.score)).toBeLessThan(0.3);
      expect(sentiment.label).toMatch(/neutral|slightly/);
    });

    test('should count keywords correctly', () => {
      const text = 'strong growth and impressive gains beat expectations';
      const positiveCount = provider.countKeywords(text, provider.positiveKeywords);
      
      expect(positiveCount).toBeGreaterThan(0);
    });

    test('should adjust sentiment for ticker mentions', () => {
      const baseScore = 0.1;
      const text = 'aapl surges after earnings beat';
      
      const adjustedScore = provider.adjustSentimentForTicker(baseScore, text, 'AAPL');
      
      expect(adjustedScore).toBeGreaterThan(baseScore);
    });

    test('should get correct sentiment label', () => {
      expect(provider.getSentimentLabel(0.5)).toBe('positive');
      expect(provider.getSentimentLabel(-0.5)).toBe('negative');
      expect(provider.getSentimentLabel(0.2)).toBe('slightly positive');
      expect(provider.getSentimentLabel(-0.2)).toBe('slightly negative');
      expect(provider.getSentimentLabel(0.05)).toBe('neutral');
    });

    test('should calculate sentiment confidence', () => {
      const highConfidence = provider.calculateSentimentConfidence(5, 0, 1);
      const lowConfidence = provider.calculateSentimentConfidence(0, 0, 0);
      const mixedConfidence = provider.calculateSentimentConfidence(2, 2, 1);
      
      expect(highConfidence).toBeGreaterThan(lowConfidence);
      expect(highConfidence).toBeGreaterThan(mixedConfidence);
      expect(lowConfidence).toBe(0.1);
    });

    test('should get sentiment statistics for articles', () => {
      const articles = [
        { sentiment: 'positive', sentimentScore: 0.6 },
        { sentiment: 'negative', sentimentScore: -0.4 },
        { sentiment: 'neutral', sentimentScore: 0.1 }
      ];
      
      const stats = provider.getSentimentStatistics(articles);
      
      expect(stats.totalArticles).toBe(3);
      expect(stats.distribution.positive).toBe(1);
      expect(stats.distribution.negative).toBe(1);
      expect(stats.distribution.neutral).toBe(1);
      expect(typeof stats.averageScore).toBe('number');
      expect(stats.sentimentTrend).toBeDefined();
    });

    test('should handle empty articles for sentiment statistics', () => {
      const stats = provider.getSentimentStatistics([]);
      
      expect(stats.totalArticles).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.sentimentTrend).toBe('unknown');
    });

    test('should determine sentiment trend correctly', () => {
      const strongPositive = provider.determineSentimentTrend(0.5, { positive: 8, negative: 1, neutral: 1 });
      const strongNegative = provider.determineSentimentTrend(-0.5, { positive: 1, negative: 8, neutral: 1 });
      const mixed = provider.determineSentimentTrend(0.05, { positive: 3, negative: 3, neutral: 4 });
      
      expect(strongPositive).toBe('strongly positive');
      expect(strongNegative).toBe('strongly negative');
      expect(mixed).toBe('mixed');
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