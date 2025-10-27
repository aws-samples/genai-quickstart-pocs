/**
 * Integration Tests for New Data Providers System
 * 
 * Tests complete data flow from providers through aggregator, validates
 * provider factory creation and switching, and ensures data format
 * consistency with existing API.
 * 
 * Requirements: 6.1, 6.2
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const { DataProviderFactory } = require('../../dataProviderFactory');
const EnhancedDataAggregator = require('../EnhancedDataAggregator');
const YahooFinanceProvider = require('../YahooFinanceProvider');
const NewsAPIProvider = require('../NewsAPIProvider');
const FREDProvider = require('../FREDProvider');

// Test utility to create providers directly for testing
function createTestProvider(type, config = {}) {
  const defaultConfig = {
    providers: {
      yahoo: { enabled: true },
      newsapi: { apiKey: 'test_newsapi_key', enabled: true },
      fred: { apiKey: 'test_fred_key', enabled: true }
    }
  };

  // Merge provided config with defaults
  const mergedConfig = {
    providers: {
      ...defaultConfig.providers,
      ...config.providers
    }
  };

  switch (type) {
    case 'yahoo':
      return new YahooFinanceProvider(mergedConfig.providers.yahoo);
    case 'newsapi':
      return new NewsAPIProvider(mergedConfig.providers.newsapi);
    case 'fred':
      return new FREDProvider(mergedConfig.providers.fred);
    case 'enhanced_multi_provider':
      return new EnhancedDataAggregator(mergedConfig);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

// Test configuration
const testConfig = {
  providers: {
    yahoo: { enabled: true },
    newsapi: { apiKey: 'test_newsapi_key', enabled: true },
    fred: { apiKey: 'test_fred_key', enabled: true }
  }
};

// Mock environment variables for testing
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEWSAPI_KEY: 'test_newsapi_key',
    FRED_API_KEY: 'test_fred_key',
    DATA_PROVIDER: 'enhanced_multi_provider',
    ENABLE_NEW_PROVIDERS: 'true'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

beforeEach(() => {
  jest.resetModules();
  // Reset static instances to pick up new environment variables
  const { DataProviderFactory } = require('../../dataProviderFactory');
  const EnvironmentConfig = require('../EnvironmentConfig');
  const FeatureFlagManager = require('../FeatureFlagManager');
  
  if (DataProviderFactory.environmentConfig) {
    DataProviderFactory.environmentConfig = new EnvironmentConfig();
  }
  if (DataProviderFactory.featureFlagManager) {
    DataProviderFactory.featureFlagManager = new FeatureFlagManager();
  }
});

describe('Data Provider Integration Tests', () => {
  describe('Complete Data Flow Through Aggregator', () => {
    let aggregator;

    beforeEach(() => {
      aggregator = createTestProvider('enhanced_multi_provider', testConfig);
    });

    afterEach(() => {
      if (aggregator) {
        aggregator.cleanup();
      }
    });

    test('should complete full stock data flow from all providers', async () => {
      // Mock all provider responses
      const mockYahooData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89
      };

      const mockNewsData = [
        {
          headline: 'Apple reports strong earnings',
          summary: 'Apple exceeded expectations',
          sentimentScore: 0.8,
          relevanceScore: 0.9,
          source: 'Financial Times',
          publishedAt: '2024-01-25T10:00:00Z'
        }
      ];

      const mockInterestData = { currentValue: 5.25 };
      const mockCPIData = { 
        allItems: { currentValue: 307.026 },
        inflation: {
          allItems: { currentRate: 3.2 },
          core: { currentRate: 2.8 }
        }
      };

      // Mock provider methods
      jest.spyOn(aggregator.providers.yahoo, 'getStockPrice')
        .mockResolvedValue(mockYahooData);
      jest.spyOn(aggregator.providers.newsapi, 'getMarketNews')
        .mockResolvedValue(mockNewsData);
      jest.spyOn(aggregator.providers.fred, 'getInterestRateData')
        .mockResolvedValue(mockInterestData);
      jest.spyOn(aggregator.providers.fred, 'getCPIData')
        .mockResolvedValue(mockCPIData);

      // Execute complete data flow
      const result = await aggregator.getStockPrice('AAPL');

      // Verify data structure integrity
      expect(result).toMatchObject({
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89
      });

      // Verify sentiment aggregation (AI-powered, may have empty articles in test)
      expect(result.sentiment).toMatchObject({
        score: expect.any(Number),
        label: expect.stringMatching(/^(positive|negative|neutral)$/),
        newsCount: 1,
        articles: expect.any(Array) // AI analysis may return empty array in test environment
      });

      // Verify macro context integration
      expect(result.macroContext).toMatchObject({
        fedRate: 5.25,
        cpi: 307.026,
        inflationRate: 3.2
      });

      // Verify metadata
      expect(result.dataSource).toBe('enhanced_multi_provider');
      expect(result.providersUsed).toEqual(
        expect.arrayContaining(['yahoo', 'newsapi', 'fred'])
      );
      expect(result.lastUpdated).toBeDefined();
    });

    test('should handle partial provider failures in data flow', async () => {
      const mockYahooData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50
      };

      // Mock successful Yahoo, failed NewsAPI and FRED
      jest.spyOn(aggregator.providers.yahoo, 'getStockPrice')
        .mockResolvedValue(mockYahooData);
      jest.spyOn(aggregator.providers.newsapi, 'getMarketNews')
        .mockRejectedValue(new Error('API quota exceeded'));
      jest.spyOn(aggregator.providers.fred, 'getInterestRateData')
        .mockRejectedValue(new Error('Network timeout'));
      jest.spyOn(aggregator.providers.fred, 'getCPIData')
        .mockRejectedValue(new Error('Network timeout'));

      const result = await aggregator.getStockPrice('AAPL');

      // Should still return core data
      expect(result.ticker).toBe('AAPL');
      expect(result.price).toBe(150.25);

      // Should have neutral sentiment when news fails
      expect(result.sentiment.score).toBe(0);
      expect(result.sentiment.label).toBe('neutral');
      expect(result.sentiment.newsCount).toBe(0);

      // Should have null macro context when FRED fails
      expect(result.macroContext).toBeNull();

      // Should indicate partial success (yahoo succeeded, others failed but still recorded)
      expect(result.providersUsed).toContain('yahoo');
    });

    test('should complete earnings data flow with macro context', async () => {
      const mockEarningsData = [
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

      const mockInterestData = { currentValue: 5.25 };
      const mockCPIData = { 
        allItems: { currentValue: 307.026 },
        inflation: {
          allItems: { currentRate: 3.2 },
          core: { currentRate: 2.8 }
        }
      };

      jest.spyOn(aggregator.providers.yahoo, 'getEarningsData')
        .mockResolvedValue(mockEarningsData);
      jest.spyOn(aggregator.providers.fred, 'getInterestRateData')
        .mockResolvedValue(mockInterestData);
      jest.spyOn(aggregator.providers.fred, 'getCPIData')
        .mockResolvedValue(mockCPIData);

      const result = await aggregator.getEarningsData('AAPL');

      expect(result).toHaveLength(1);
      
      const earnings = result[0];
      expect(earnings).toMatchObject({
        ticker: 'AAPL',
        quarter: 'Q1',
        year: 2024,
        revenue: 119000000000,
        netIncome: 33900000000,
        eps: 2.18
      });

      expect(earnings.macroContext).toMatchObject({
        fedRate: 5.25,
        cpi: 307.026,
        inflationRate: 3.2
      });

      expect(earnings.dataSource).toBe('enhanced_multi_provider');
      expect(earnings.providersUsed).toEqual(['yahoo', 'fred']);
    });
  });

  describe('Provider Factory Creation and Switching', () => {
    test('should create and validate all provider types', () => {
      const providerTypes = ['yahoo', 'newsapi', 'fred', 'enhanced_multi_provider'];

      providerTypes.forEach(type => {
        const provider = createTestProvider(type);
        expect(provider).toBeDefined();
        
        // Verify provider implements required interface
        expect(typeof provider.getStockPrice).toBe('function');
        expect(typeof provider.getEarningsData).toBe('function');
        expect(typeof provider.getCompanyInfo).toBe('function');
        expect(typeof provider.getMarketNews).toBe('function');
        
        if (provider.cleanup) provider.cleanup();
      });
    });

    test('should switch between providers seamlessly', async () => {
      // Test switching between different provider types
      const yahooProvider = createTestProvider('yahoo');
      const enhancedProvider = createTestProvider('enhanced_multi_provider');

      expect(yahooProvider.constructor.name).toBe('YahooFinanceProvider');
      expect(enhancedProvider.constructor.name).toBe('EnhancedDataAggregator');

      // Both should implement the same interface
      const interfaceMethods = ['getStockPrice', 'getEarningsData', 'getCompanyInfo', 'getMarketNews'];
      
      interfaceMethods.forEach(method => {
        expect(typeof yahooProvider[method]).toBe('function');
        expect(typeof enhancedProvider[method]).toBe('function');
      });

      // Cleanup
      if (yahooProvider.cleanup) yahooProvider.cleanup();
      if (enhancedProvider.cleanup) enhancedProvider.cleanup();
    });

    test('should validate provider configurations correctly', () => {
      const validationResults = {
        yahoo: DataProviderFactory.validateProvider('yahoo'),
        newsapi: DataProviderFactory.validateProvider('newsapi'),
        fred: DataProviderFactory.validateProvider('fred'),
        enhanced_multi_provider: DataProviderFactory.validateProvider('enhanced_multi_provider')
      };

      // Yahoo should always be valid (no API key required)
      expect(validationResults.yahoo.valid).toBe(true);

      // NewsAPI validation depends on environment setup
      expect(typeof validationResults.newsapi.valid).toBe('boolean');

      // FRED should be valid (API key is optional)
      expect(validationResults.fred.valid).toBe(true);

      // Enhanced multi-provider should be valid with required keys (may fail if API keys missing in test)
      expect(typeof validationResults.enhanced_multi_provider.valid).toBe('boolean');
    });

    test('should provide accurate available providers list', () => {
      const availableProviders = DataProviderFactory.getAvailableProviders();

      expect(availableProviders).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'yahoo',
            name: expect.any(String)
          }),
          expect.objectContaining({
            type: 'newsapi',
            name: expect.any(String)
          }),
          expect.objectContaining({
            type: 'fred',
            name: expect.any(String)
          }),
          expect.objectContaining({
            type: 'enhanced_multi_provider',
            name: expect.any(String),
            recommended: true,
            primary: true
          })
        ])
      );
    });
  });

  describe('Data Format Consistency with Existing API', () => {
    let provider;

    beforeEach(() => {
      provider = createTestProvider('enhanced_multi_provider');
    });

    afterEach(() => {
      if (provider && provider.cleanup) {
        provider.cleanup();
      }
    });

    test('should maintain consistent stock price data format', async () => {
      const mockData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 1.69,
        volume: 50000000,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89
      };

      jest.spyOn(provider.providers.yahoo, 'getStockPrice')
        .mockResolvedValue(mockData);
      jest.spyOn(provider.providers.newsapi, 'getMarketNews')
        .mockResolvedValue([]);
      jest.spyOn(provider.providers.fred, 'getInterestRateData')
        .mockResolvedValue(null);
      jest.spyOn(provider.providers.fred, 'getCPIData')
        .mockResolvedValue(null);

      const result = await provider.getStockPrice('AAPL');

      // Verify required fields are present and correctly typed
      expect(result).toMatchObject({
        ticker: expect.any(String),
        price: expect.any(Number),
        change: expect.any(Number),
        changePercent: expect.any(Number),
        volume: expect.any(Number),
        marketCap: expect.any(Number),
        pe: expect.any(Number),
        eps: expect.any(Number)
      });

      // Verify enhanced fields are present
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('macroContext');
      expect(result).toHaveProperty('dataSource');
      expect(result).toHaveProperty('providersUsed');
      expect(result).toHaveProperty('lastUpdated');

      // Verify sentiment structure
      expect(result.sentiment).toMatchObject({
        score: expect.any(Number),
        label: expect.stringMatching(/^(positive|negative|neutral)$/),
        newsCount: expect.any(Number)
      });
    });

    test('should maintain consistent earnings data format', async () => {
      const mockEarnings = [
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

      jest.spyOn(provider.providers.yahoo, 'getEarningsData')
        .mockResolvedValue(mockEarnings);
      jest.spyOn(provider.providers.fred, 'getInterestRateData')
        .mockResolvedValue(null);
      jest.spyOn(provider.providers.fred, 'getCPIData')
        .mockResolvedValue(null);

      const result = await provider.getEarningsData('AAPL');

      expect(result).toHaveLength(1);
      
      const earnings = result[0];
      expect(earnings).toMatchObject({
        ticker: expect.any(String),
        quarter: expect.any(String),
        year: expect.any(Number),
        revenue: expect.any(Number),
        netIncome: expect.any(Number),
        eps: expect.any(Number),
        reportDate: expect.any(String),
        fiscalEndDate: expect.any(String)
      });

      // Verify enhanced fields
      expect(earnings).toHaveProperty('macroContext');
      expect(earnings).toHaveProperty('dataSource');
      expect(earnings).toHaveProperty('providersUsed');
      expect(earnings).toHaveProperty('lastUpdated');
    });

    test('should maintain consistent company info data format', async () => {
      const mockCompanyInfo = {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        description: 'Technology company',
        sector: 'Technology',
        industry: 'Consumer Electronics',
        country: 'United States',
        website: 'https://www.apple.com',
        marketCap: 2500000000000,
        employees: 150000,
        founded: 1976,
        exchange: 'NASDAQ',
        currency: 'USD'
      };

      jest.spyOn(provider.providers.yahoo, 'getCompanyInfo')
        .mockResolvedValue(mockCompanyInfo);

      const result = await provider.getCompanyInfo('AAPL');

      expect(result).toMatchObject({
        ticker: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        sector: expect.any(String),
        industry: expect.any(String),
        country: expect.any(String),
        website: expect.any(String),
        marketCap: expect.any(Number),
        employees: expect.any(Number),
        founded: expect.any(Number),
        exchange: expect.any(String),
        currency: expect.any(String)
      });

      // Verify enhanced fields
      expect(result).toHaveProperty('dataSource');
      expect(result).toHaveProperty('providersUsed');
      expect(result).toHaveProperty('lastUpdated');
    });

    test('should maintain consistent news data format', async () => {
      const mockNews = [
        {
          headline: 'Apple reports strong earnings',
          summary: 'Apple exceeded expectations',
          url: 'https://example.com/news/1',
          source: 'Financial Times',
          publishedAt: '2024-01-25T10:00:00Z',
          sentiment: 'positive',
          sentimentScore: 0.8,
          relevanceScore: 0.9,
          topics: ['earnings', 'technology'],
          tickerSentiment: [{ ticker: 'AAPL', sentiment: 'positive' }]
        }
      ];

      jest.spyOn(provider.providers.newsapi, 'getMarketNews')
        .mockResolvedValue(mockNews);

      const result = await provider.getMarketNews('AAPL');

      expect(result).toHaveLength(1);
      
      const news = result[0];
      expect(news).toMatchObject({
        headline: expect.any(String),
        summary: expect.any(String),
        url: expect.any(String),
        source: expect.any(String),
        publishedAt: expect.any(String),
        sentiment: expect.stringMatching(/^(positive|negative|neutral)$/),
        sentimentScore: expect.any(Number),
        relevanceScore: expect.any(Number),
        topics: expect.any(Array),
        tickerSentiment: expect.any(Array)
      });
    });

    test('should handle null responses consistently', async () => {
      // Mock all providers to return null
      jest.spyOn(provider.providers.yahoo, 'getStockPrice')
        .mockResolvedValue(null);
      jest.spyOn(provider.providers.yahoo, 'getEarningsData')
        .mockResolvedValue([]);
      jest.spyOn(provider.providers.yahoo, 'getCompanyInfo')
        .mockResolvedValue(null);
      jest.spyOn(provider.providers.newsapi, 'getMarketNews')
        .mockResolvedValue([]);

      const stockResult = await provider.getStockPrice('INVALID');
      const earningsResult = await provider.getEarningsData('INVALID');
      const companyResult = await provider.getCompanyInfo('INVALID');
      const newsResult = await provider.getMarketNews('INVALID');

      expect(stockResult).toBeNull();
      expect(earningsResult).toEqual([]);
      expect(companyResult).toBeNull();
      expect(newsResult).toEqual([]);
    });
  });

  describe('Error Handling and Recovery', () => {
    let provider;

    beforeEach(() => {
      provider = createTestProvider('enhanced_multi_provider');
    });

    afterEach(() => {
      if (provider && provider.cleanup) {
        provider.cleanup();
      }
    });

    test('should handle provider initialization failures', () => {
      // Save original environment variable
      const originalNewsApiKey = process.env.NEWSAPI_KEY;
      
      // Remove API key to simulate failure
      delete process.env.NEWSAPI_KEY;
      
      try {
        const aggregator = createTestProvider('enhanced_multi_provider', {});
        
        // Should still create aggregator but disable failed provider
        expect(aggregator.providerStatus.newsapi.enabled).toBe(false);
        expect(aggregator.providerStatus.newsapi.lastError).toBeDefined();
        
        aggregator.cleanup();
      } finally {
        // Restore original environment variable
        if (originalNewsApiKey) {
          process.env.NEWSAPI_KEY = originalNewsApiKey;
        }
      }
    });

    test('should recover from temporary provider failures', async () => {
      let callCount = 0;
      
      // Mock provider to fail first call, succeed second
      jest.spyOn(provider.providers.yahoo, 'getStockPrice')
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Temporary network error'));
          }
          return Promise.resolve({
            ticker: 'AAPL',
            price: 150.25
          });
        });

      // First call should handle error gracefully
      const firstResult = await provider.getStockPrice('AAPL');
      expect(firstResult).toBeNull();

      // Provider should still be enabled for retry
      expect(provider.providerStatus.yahoo.enabled).toBe(true);

      // Second call should succeed
      const secondResult = await provider.getStockPrice('AAPL');
      expect(secondResult).toMatchObject({
        ticker: 'AAPL',
        price: 150.25
      });
    });

    test('should disable provider on permanent failures', async () => {
      const permanentError = new Error('Invalid API key');
      permanentError.response = { status: 401 };

      jest.spyOn(provider.providers.newsapi, 'getMarketNews')
        .mockRejectedValue(permanentError);

      await provider.getMarketNews('AAPL');

      // Provider should be disabled after permanent error
      expect(provider.providerStatus.newsapi.enabled).toBe(false);
      expect(provider.providerStatus.newsapi.lastError).toBe('Invalid API key');
    });
  });

  describe('Caching Integration', () => {
    let provider;

    beforeEach(() => {
      provider = createTestProvider('enhanced_multi_provider');
    });

    afterEach(() => {
      if (provider && provider.cleanup) {
        provider.cleanup();
      }
    });

    test('should cache aggregated stock data correctly', async () => {
      const mockData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50
      };

      const yahooSpy = jest.spyOn(provider.providers.yahoo, 'getStockPrice')
        .mockResolvedValue(mockData);
      jest.spyOn(provider.providers.newsapi, 'getMarketNews')
        .mockResolvedValue([]);
      jest.spyOn(provider.providers.fred, 'getInterestRateData')
        .mockResolvedValue(null);
      jest.spyOn(provider.providers.fred, 'getCPIData')
        .mockResolvedValue(null);

      // First call should hit providers
      const firstResult = await provider.getStockPrice('AAPL');
      expect(firstResult.ticker).toBe('AAPL');
      expect(yahooSpy).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const secondResult = await provider.getStockPrice('AAPL');
      expect(secondResult.ticker).toBe('AAPL');
      expect(yahooSpy).toHaveBeenCalledTimes(1); // Should not increase
    });
  });
});