/**
 * Enhanced Data Aggregator Tests
 * 
 * Tests for the EnhancedDataAggregator class that combines data from
 * multiple providers (Yahoo Finance, NewsAPI, FRED) to create comprehensive
 * responses.
 */

const EnhancedDataAggregator = require('../EnhancedDataAggregator');

// Mock the provider classes
jest.mock('../YahooFinanceProvider');
jest.mock('../NewsAPIProvider');
jest.mock('../FREDProvider');

// Mock the AI analyzer to prevent AWS connections
jest.mock('../../enhancedAiAnalyzer');

const YahooFinanceProvider = require('../YahooFinanceProvider');
const NewsAPIProvider = require('../NewsAPIProvider');
const FREDProvider = require('../FREDProvider');
const EnhancedAIAnalyzer = require('../../enhancedAiAnalyzer');

describe('EnhancedDataAggregator', () => {
  let aggregator;
  let mockYahooProvider;
  let mockNewsAPIProvider;
  let mockFREDProvider;

  const config = {
    providers: {
      enhanced_aggregator: {
        cache: {
          aggregated_stock: 300000,
          aggregated_earnings: 1800000,
          aggregated_company: 3600000
        },
        rateLimit: {
          requestsPerMinute: 200,
          burstLimit: 50
        },
        requestTimeout: 30000,
        maxRetries: 1
      }
    }
  };

  beforeEach(() => {
    // Set up environment variables for tests
    process.env.NEWSAPI_KEY = 'test_newsapi_key';
    process.env.FRED_API_KEY = 'test_fred_key';
    
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Yahoo Finance provider
    mockYahooProvider = {
      getStockPrice: jest.fn(),
      getEarningsData: jest.fn(),
      getCompanyInfo: jest.fn(),
      getStats: jest.fn(() => ({ provider: 'yahoo', requests: { total: 0 } })),
      cleanup: jest.fn()
    };

    // Mock NewsAPI provider
    mockNewsAPIProvider = {
      getMarketNews: jest.fn(),
      getStats: jest.fn(() => ({ provider: 'newsapi', requests: { total: 0 } })),
      cleanup: jest.fn()
    };

    // Mock FRED provider
    mockFREDProvider = {
      getInterestRateData: jest.fn(),
      getCPIData: jest.fn(),
      isProviderEnabled: jest.fn(() => true),
      getStats: jest.fn(() => ({ provider: 'fred', requests: { total: 0 } })),
      cleanup: jest.fn()
    };

    // Mock provider constructors
    YahooFinanceProvider.mockImplementation(() => mockYahooProvider);
    NewsAPIProvider.mockImplementation(() => mockNewsAPIProvider);
    FREDProvider.mockImplementation(() => mockFREDProvider);

    // Mock AI analyzer to prevent AWS connections
    const mockAIAnalyzer = {
      analyzeNewsSentimentWithAI: jest.fn().mockResolvedValue({
        sentimentScore: 0.067, // (0.8 - 0.6 + 0.0) / 3 = 0.067
        overallSentiment: 'neutral',
        confidence: 0.85,
        articles: [
          { title: 'Test Article 1', sentiment: 'positive', score: 0.8 },
          { title: 'Test Article 2', sentiment: 'negative', score: -0.6 },
          { title: 'Test Article 3', sentiment: 'neutral', score: 0.0 }
        ],
        summary: 'Mixed sentiment from news analysis'
      }),
      analyzeMarketContextWithAI: jest.fn().mockResolvedValue({
        valuationAssessment: { level: 'fairly_valued' },
        riskAssessment: { level: 'moderate' }
      }),
      analyzeNewsRelevanceWithAI: jest.fn().mockResolvedValue({
        relevantCount: 3,
        totalArticles: 3,
        allArticles: [
          { title: 'Test Article 1', relevant: true },
          { title: 'Test Article 2', relevant: true },
          { title: 'Test Article 3', relevant: true }
        ]
      })
    };
    EnhancedAIAnalyzer.mockImplementation(() => mockAIAnalyzer);

    // Create aggregator instance
    aggregator = new EnhancedDataAggregator({
      providers: {
        yahoo: { apiKey: 'test' },
        newsapi: { apiKey: 'test_newsapi_key' },
        fred: { apiKey: 'test_fred_key' }
      }
    });
  });

  afterEach(() => {
    if (aggregator) {
      aggregator.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize all providers successfully', () => {
      expect(YahooFinanceProvider).toHaveBeenCalledTimes(1);
      expect(NewsAPIProvider).toHaveBeenCalledTimes(1);
      expect(FREDProvider).toHaveBeenCalledTimes(1);
    });

    test('should handle provider initialization failures gracefully', () => {
      // Mock a provider that throws during initialization
      NewsAPIProvider.mockImplementation(() => {
        throw new Error('API key invalid');
      });

      const aggregatorWithFailure = new EnhancedDataAggregator(config);
      
      // Should still create aggregator but mark provider as disabled
      expect(aggregatorWithFailure.providerStatus.newsapi.enabled).toBe(false);
      expect(aggregatorWithFailure.providerStatus.newsapi.lastError).toBe('API key invalid');
      
      aggregatorWithFailure.cleanup();
    });

    test('should track active providers correctly', () => {
      const activeProviders = aggregator.getActiveProviders();
      expect(activeProviders).toContain('yahoo');
      expect(activeProviders).toContain('newsapi');
      expect(activeProviders).toContain('fred');
    });
  });

  describe('Stock Price Data Aggregation', () => {
    test('should aggregate comprehensive stock data from multiple providers', async () => {
      // Mock data from different providers
      const yahooData = {
        ticker: 'AAPL',
        price: 150.00,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89
      };

      const newsData = [
        {
          headline: 'Apple reports strong quarterly earnings',
          sentimentScore: 0.8,
          relevanceScore: 0.9
        },
        {
          headline: 'iPhone sales exceed expectations',
          sentimentScore: 0.6,
          relevanceScore: 0.8
        }
      ];

      const interestRateData = { currentValue: 5.25 };
      const cpiData = { 
        allItems: { currentValue: 307.026 },
        inflation: {
          allItems: { currentRate: 3.2 },
          core: { currentRate: 2.8 }
        }
      };

      // Set up mocks
      mockYahooProvider.getStockPrice.mockResolvedValue(yahooData);
      mockNewsAPIProvider.getMarketNews.mockResolvedValue(newsData);
      mockFREDProvider.getInterestRateData.mockResolvedValue(interestRateData);
      mockFREDProvider.getCPIData.mockResolvedValue(cpiData);

      const result = await aggregator.getStockPrice('AAPL');

      // Verify basic stock data
      expect(result.ticker).toBe('AAPL');
      expect(result.price).toBe(150.00);
      expect(result.change).toBe(2.50);
      expect(result.changePercent).toBe(1.69);
      expect(result.volume).toBe(50000000);
      expect(result.marketCap).toBe(2500000000000);
      
      // Check news sentiment aggregation
      expect(result.sentiment).toBeDefined();
      expect(result.sentiment.score).toBeGreaterThan(0);
      expect(result.sentiment.label).toBe('neutral');
      expect(result.sentiment.newsCount).toBe(2);
      expect(result.sentiment.articles).toHaveLength(3); // Mock returns 3 articles

      // Check macro context
      expect(result.macroContext).toBeDefined();
      expect(result.macroContext.fedRate).toBe(5.25);
      expect(result.macroContext.cpi).toBe(307.026);
      expect(result.macroContext.inflationRate).toBe(3.2);

      // Verify metadata
      expect(result.dataSource).toBe('enhanced_multi_provider');
      expect(result.providersUsed).toContain('yahoo');
      expect(result.providersUsed).toContain('newsapi');
      expect(result.providersUsed).toContain('fred');
      expect(result.lastUpdated).toBeDefined();
    });

    test('should handle partial provider failures gracefully', async () => {
      const yahooData = { ticker: 'AAPL', price: 150.00 };
      
      // Mock enhancement provider failures
      mockYahooProvider.getStockPrice.mockResolvedValue(yahooData);
      mockNewsAPIProvider.getMarketNews.mockRejectedValue(new Error('API quota exceeded'));
      mockFREDProvider.getInterestRateData.mockRejectedValue(new Error('Network error'));
      mockFREDProvider.getCPIData.mockRejectedValue(new Error('Network error'));

      const result = await aggregator.getStockPrice('AAPL');

      // Should still return basic stock data
      expect(result.ticker).toBe('AAPL');
      expect(result.price).toBe(150.00);
      
      // Should have neutral sentiment when news fails
      expect(result.sentiment.score).toBe(0);
      expect(result.sentiment.label).toBe('neutral');
      expect(result.sentiment.newsCount).toBe(0);
      
      // Should have null macro context when FRED fails
      expect(result.macroContext).toBeNull();
    });

    test('should return null when primary provider fails', async () => {
      mockYahooProvider.getStockPrice.mockResolvedValue(null);

      const result = await aggregator.getStockPrice('AAPL');

      expect(result).toBeNull();
    });

    test('should handle permanent vs temporary errors correctly', async () => {
      // Test permanent error (should disable provider)
      const permanentError = new Error('Invalid API key');
      permanentError.response = { status: 401 };

      mockNewsAPIProvider.getMarketNews.mockRejectedValue(permanentError);

      await aggregator.executeProviderMethod('newsapi', 'getMarketNews', ['AAPL']);

      expect(aggregator.providerStatus.newsapi.enabled).toBe(false);
      expect(aggregator.providerStatus.newsapi.lastError).toBe('Invalid API key');
    });

    test('should keep provider enabled for temporary errors', async () => {
      // Test temporary error (should keep provider enabled)
      const temporaryError = new Error('Network timeout');

      mockNewsAPIProvider.getMarketNews.mockRejectedValue(temporaryError);

      await aggregator.executeProviderMethod('newsapi', 'getMarketNews', ['AAPL']);

      expect(aggregator.providerStatus.newsapi.enabled).toBe(true);
      expect(aggregator.providerStatus.newsapi.lastError).toBe('Network timeout');
    });
  });

  describe('News Sentiment Analysis', () => {
    test('should calculate comprehensive sentiment from news articles', async () => {
      const newsData = [
        {
          headline: 'Apple reports record profits',
          sentimentScore: 0.8,
          relevanceScore: 1.0
        },
        {
          headline: 'iPhone sales disappoint investors',
          sentimentScore: -0.6,
          relevanceScore: 0.9
        },
        {
          headline: 'Apple stock neutral outlook',
          sentimentScore: 0.0,
          relevanceScore: 0.7
        }
      ];

      mockYahooProvider.getStockPrice.mockResolvedValue({ ticker: 'AAPL', price: 150.00 });
      mockNewsAPIProvider.getMarketNews.mockResolvedValue(newsData);
      mockFREDProvider.getInterestRateData.mockResolvedValue(null);
      mockFREDProvider.getCPIData.mockResolvedValue(null);

      const result = await aggregator.getStockPrice('AAPL');

      expect(result.sentiment.score).toBeCloseTo(0.067, 2); // (0.8 - 0.6 + 0.0) / 3
      expect(result.sentiment.label).toBe('neutral');
      expect(result.sentiment.newsCount).toBe(3);
      expect(result.sentiment.scoredArticles).toBe(3);
      expect(result.sentiment.distribution.positive).toBe(1);
      expect(result.sentiment.distribution.negative).toBe(1);
      expect(result.sentiment.distribution.neutral).toBe(1);
      expect(result.sentiment.confidence).toBeGreaterThan(0);
    });

    test('should handle empty news data gracefully', async () => {
      const yahooData = { ticker: 'AAPL', price: 150.00 };

      mockYahooProvider.getStockPrice.mockResolvedValue(yahooData);
      mockNewsAPIProvider.getMarketNews.mockResolvedValue([]);
      mockFREDProvider.getInterestRateData.mockResolvedValue(null);
      mockFREDProvider.getCPIData.mockResolvedValue(null);

      const result = await aggregator.getStockPrice('AAPL');

      expect(result.sentiment.score).toBe(0);
      expect(result.sentiment.label).toBe('neutral');
      expect(result.sentiment.newsCount).toBe(0);
      expect(result.sentiment.confidence).toBe(0);
    });
  });

  describe('Earnings Data Enhancement', () => {
    test('should enhance Yahoo earnings with macro economic context', async () => {
      const yahooEarnings = [
        {
          ticker: 'AAPL',
          quarter: 'Q1',
          year: 2024,
          revenue: 119000000000,
          netIncome: 33900000000,
          eps: 2.18,
          reportDate: '2024-02-01',
          fiscalEndDate: '2023-12-31'
        }
      ];

      const interestRateData = { currentValue: 5.25 };
      const cpiData = { 
        allItems: { currentValue: 307.026 },
        inflation: {
          allItems: { currentRate: 3.2 },
          core: { currentRate: 2.8 }
        }
      };

      mockYahooProvider.getEarningsData.mockResolvedValue(yahooEarnings);
      mockFREDProvider.getInterestRateData.mockResolvedValue(interestRateData);
      mockFREDProvider.getCPIData.mockResolvedValue({
        allItems: { currentValue: 307.026 },
        inflation: {
          allItems: { currentRate: 3.2 },
          core: { currentRate: 2.8 }
        }
      });

      const result = await aggregator.getEarningsData('AAPL');

      expect(result).toHaveLength(1);
      
      const firstEarning = result[0];
      expect(firstEarning.ticker).toBe('AAPL');
      expect(firstEarning.quarter).toBe('Q1');
      expect(firstEarning.year).toBe(2024);
      expect(firstEarning.revenue).toBe(119000000000);
      expect(firstEarning.netIncome).toBe(33900000000);
      expect(firstEarning.eps).toBe(2.18);

      // Check macro context enhancement
      expect(firstEarning.macroContext).toBeDefined();
      expect(firstEarning.macroContext.fedRate).toBe(5.25);
      expect(firstEarning.macroContext.cpi).toBe(307.026);
      expect(firstEarning.macroContext.inflationRate).toBe(3.2);

      // Verify metadata
      expect(firstEarning.dataSource).toBe('enhanced_multi_provider');
      expect(firstEarning.providersUsed).toContain('yahoo');
      expect(firstEarning.providersUsed).toContain('fred');
      expect(firstEarning.lastUpdated).toBeDefined();
    });

    test('should handle earnings data without macro context', async () => {
      const yahooEarnings = [
        {
          ticker: 'AAPL',
          quarter: 'Q1',
          year: 2024,
          eps: 2.18
        }
      ];

      mockYahooProvider.getEarningsData.mockResolvedValue(yahooEarnings);
      mockFREDProvider.getInterestRateData.mockResolvedValue(null);
      mockFREDProvider.getCPIData.mockResolvedValue(null);

      const result = await aggregator.getEarningsData('AAPL');

      expect(result).toHaveLength(1);
      expect(result[0].macroContext).toBeNull();
      expect(result[0].providersUsed).toEqual(['yahoo']);
    });

    test('should return empty array when no earnings data available', async () => {
      mockYahooProvider.getEarningsData.mockResolvedValue([]);

      const result = await aggregator.getEarningsData('AAPL');

      expect(result).toEqual([]);
    });
  });

  describe('Company Information', () => {
    test('should get company information from Yahoo Finance', async () => {
      const companyData = {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        description: 'Technology company',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        marketCap: 2500000000000
      };

      mockYahooProvider.getCompanyInfo.mockResolvedValue(companyData);

      const result = await aggregator.getCompanyInfo('AAPL');

      expect(result.ticker).toBe('AAPL');
      expect(result.name).toBe('Apple Inc.');
      expect(result.sector).toBe('Technology');
      expect(result.dataSource).toBe('enhanced_multi_provider');
      expect(result.providersUsed).toEqual(['yahoo']);
    });

    test('should return null when company data not found', async () => {
      mockYahooProvider.getCompanyInfo.mockResolvedValue(null);

      const result = await aggregator.getCompanyInfo('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('Market News', () => {
    test('should get market news from NewsAPI', async () => {
      const newsData = [
        {
          headline: 'Market update',
          summary: 'Market summary',
          sentimentScore: 0.5
        }
      ];

      mockNewsAPIProvider.getMarketNews.mockResolvedValue(newsData);

      const result = await aggregator.getMarketNews('AAPL');

      // Should return AI-enhanced articles from the mock
      expect(result).toEqual([
        { title: 'Test Article 1', relevant: true },
        { title: 'Test Article 2', relevant: true },
        { title: 'Test Article 3', relevant: true }
      ]);
    });

    test('should return empty array when news fails', async () => {
      mockNewsAPIProvider.getMarketNews.mockResolvedValue(null);

      const result = await aggregator.getMarketNews('AAPL');

      expect(result).toEqual([]);
    });
  });

  describe('Provider Status and Configuration', () => {
    test('should provide provider status information', () => {
      const status = aggregator.getProviderStatus();

      expect(status.aggregator.name).toBe('EnhancedDataAggregator');
      expect(status.aggregator.activeProviders).toContain('yahoo');
      expect(status.aggregator.activeProviders).toContain('newsapi');
      expect(status.aggregator.activeProviders).toContain('fred');
    });

    test('should provide provider configuration', () => {
      const config = aggregator.getProviderConfig();

      expect(config.name).toBe('EnhancedDataAggregator');
      expect(config.capabilities).toContain('stock_price');
      expect(config.capabilities).toContain('earnings');
      expect(config.capabilities).toContain('company_info');
      expect(config.capabilities).toContain('news');
      expect(config.capabilities).toContain('macro_data');
    });
  });

  describe('Input Validation', () => {
    test('should validate ticker input for stock price', async () => {
      await expect(aggregator.getStockPrice(null)).rejects.toThrow('Ticker symbol is required');
      await expect(aggregator.getStockPrice('')).rejects.toThrow('Ticker symbol is required');
      await expect(aggregator.getStockPrice(123)).rejects.toThrow('must be a string');
    });

    test('should validate ticker input for earnings data', async () => {
      await expect(aggregator.getEarningsData(null)).rejects.toThrow('Ticker symbol is required');
      await expect(aggregator.getEarningsData('')).rejects.toThrow('Ticker symbol is required');
      await expect(aggregator.getEarningsData(123)).rejects.toThrow('must be a string');
    });

    test('should validate ticker input for company info', async () => {
      await expect(aggregator.getCompanyInfo(null)).rejects.toThrow('Ticker symbol is required');
      await expect(aggregator.getCompanyInfo('')).rejects.toThrow('Ticker symbol is required');
      await expect(aggregator.getCompanyInfo(123)).rejects.toThrow('must be a string');
    });
  });

  describe('Cleanup', () => {
    test('should cleanup all providers', () => {
      aggregator.cleanup();

      expect(mockYahooProvider.cleanup).toHaveBeenCalled();
      expect(mockNewsAPIProvider.cleanup).toHaveBeenCalled();
      expect(mockFREDProvider.cleanup).toHaveBeenCalled();
    });
  });
});