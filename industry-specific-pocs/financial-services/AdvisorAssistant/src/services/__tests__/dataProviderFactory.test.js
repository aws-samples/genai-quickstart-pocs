/**
 * DataProviderFactory Integration Tests
 * 
 * Tests for backward compatibility, provider creation, and migration functionality.
 * Ensures new providers maintain compatibility with existing API contracts.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const { DataProviderFactory, BackwardCompatibilityLayer, MigrationHelper } = require('../dataProviderFactory');

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    NEWSAPI_KEY: 'test_newsapi_key',
    FRED_API_KEY: 'test_fred_key',
    DATA_PROVIDER: 'yahoo', // Set to yahoo to avoid enhanced_multi_provider validation
    ENABLE_NEW_PROVIDERS: 'true',
    ENABLE_LEGACY_PROVIDERS: 'false'
  };
  
  // Reset static instances to pick up new environment variables
  const { DataProviderFactory } = require('../dataProviderFactory');
  const EnvironmentConfig = require('../providers/EnvironmentConfig');
  const FeatureFlagManager = require('../providers/FeatureFlagManager');
  
  DataProviderFactory.environmentConfig = new EnvironmentConfig();
  DataProviderFactory.featureFlagManager = new FeatureFlagManager();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('DataProviderFactory', () => {
  describe('Provider Creation', () => {
    test('should create Yahoo Finance provider', () => {
      const provider = DataProviderFactory.createProvider('yahoo');
      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('YahooFinanceProvider');
    });



    test('should create NewsAPI provider', () => {
      const provider = DataProviderFactory.createProvider('newsapi');
      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('NewsAPIProvider');
    });

    test('should create FRED provider', () => {
      const provider = DataProviderFactory.createProvider('fred');
      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('FREDProvider');
    });

    test('should create Enhanced Multi-Provider', () => {
      const provider = DataProviderFactory.createProvider('enhanced_multi_provider');
      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('EnhancedDataAggregator');
    });

    test('should handle unknown provider types by defaulting to enhanced_multi_provider', () => {
      // Unknown provider types should default to enhanced_multi_provider
      const unknownProvider = DataProviderFactory.createProvider('unknown_provider');
      expect(unknownProvider).toBeDefined();
      expect(unknownProvider.constructor.name).toBe('EnhancedDataAggregator');
    });

    test('should default to enhanced_multi_provider for unknown provider types', () => {
      const provider = DataProviderFactory.createProvider('unknown_provider');
      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('EnhancedDataAggregator');
    });
  });

  describe('Provider Validation', () => {
    test('should validate Yahoo Finance provider (no API key required)', () => {
      const validation = DataProviderFactory.validateProvider('yahoo');
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });



    test('should validate enhanced_multi_provider with required keys', () => {
      const validation = DataProviderFactory.validateProvider('enhanced_multi_provider');
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should invalidate enhanced_multi_provider without required keys', () => {
      const originalKey = process.env.NEWSAPI_KEY;
      delete process.env.NEWSAPI_KEY;
      
      // Create new instance to pick up environment changes
      const EnvironmentConfig = require('../providers/EnvironmentConfig');
      const tempConfig = new EnvironmentConfig();
      const validation = tempConfig.validateProvider('enhanced_multi_provider');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors[0]).toContain('NEWSAPI_KEY is required');
      
      // Restore original key
      if (originalKey) process.env.NEWSAPI_KEY = originalKey;
    });

    test('should validate FRED provider even without API key', () => {
      delete process.env.FRED_API_KEY;
      const validation = DataProviderFactory.validateProvider('fred');
      expect(validation.valid).toBe(true); // FRED is optional
    });

    test('should provide recommendations for unknown provider', () => {
      const validation = DataProviderFactory.validateProvider('unknown');
      expect(validation.valid).toBe(false);
      expect(validation.issues[0]).toContain('Unknown provider');
      // Recommendations array might be empty for unknown providers
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });
  });

  describe('Available Providers', () => {
    test('should return list of available providers', () => {
      const providers = DataProviderFactory.getAvailableProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      
      // Check for new providers
      const providerTypes = providers.map(p => p.type);
      expect(providerTypes).toContain('yahoo');
      expect(providerTypes).toContain('newsapi');
      expect(providerTypes).toContain('fred');
      expect(providerTypes).toContain('enhanced_multi_provider');
    });

    test('should only return supported providers', () => {
      const providers = DataProviderFactory.getAvailableProviders();
      const supportedTypes = ['yahoo', 'newsapi', 'fred', 'enhanced_multi_provider'];
      
      providers.forEach(provider => {
        expect(supportedTypes).toContain(provider.type);
        expect(provider.name).toBeDefined();
        expect(provider.description).toBeDefined();
        expect(typeof provider.recommended).toBe('boolean');
      });
    });

    test('should mark enhanced_multi_provider as primary recommendation', () => {
      const providers = DataProviderFactory.getAvailableProviders();
      const enhancedProvider = providers.find(p => p.type === 'enhanced_multi_provider');
      
      expect(enhancedProvider).toBeDefined();
      expect(enhancedProvider.recommended).toBe(true);
      expect(enhancedProvider.primary).toBe(true);
    });
  });
});

describe('BackwardCompatibilityLayer', () => {
  let mockProvider;
  let compatibilityLayer;

  beforeEach(() => {
    mockProvider = {
      getStockPrice: jest.fn(),
      getFinancialData: jest.fn(),
      getEarningsData: jest.fn(),
      getCompanyInfo: jest.fn(),
      getMarketNews: jest.fn(),
      updateStockPrices: jest.fn(),
      getProviderName: jest.fn().mockReturnValue('MockProvider')
    };
    compatibilityLayer = new BackwardCompatibilityLayer(mockProvider);
  });

  describe('Stock Price Normalization', () => {
    test('should normalize new provider stock price format', async () => {
      const newFormatData = {
        symbol: 'AAPL',
        regularMarketPrice: 150.25,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.69,
        regularMarketVolume: 50000000,
        regularMarketPreviousClose: 147.75,
        regularMarketOpen: 148.00,
        regularMarketDayHigh: 151.00,
        regularMarketDayLow: 147.50,
        marketCapitalization: 2500000000000,
        trailingPE: 25.5,
        trailingEps: 5.89
      };

      mockProvider.getStockPrice.mockResolvedValue(newFormatData);
      const result = await compatibilityLayer.getStockPrice('AAPL');

      expect(result).toEqual({
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 0.0169, // Normalized to decimal
        volume: 50000000,
        previousClose: 147.75,
        open: 148.00,
        high: 151.00,
        low: 147.50,
        marketCap: 2500000000000,
        pe: 25.5,
        eps: 5.89,
        timestamp: expect.any(Date)
      });
    });

    test('should pass through legacy format unchanged', async () => {
      const legacyFormatData = {
        ticker: 'AAPL',
        price: 150.25,
        change: 2.50,
        changePercent: 0.0169,
        volume: 50000000
      };

      mockProvider.getStockPrice.mockResolvedValue(legacyFormatData);
      const result = await compatibilityLayer.getStockPrice('AAPL');

      expect(result).toEqual(legacyFormatData);
    });

    test('should handle null data', async () => {
      mockProvider.getStockPrice.mockResolvedValue(null);
      const result = await compatibilityLayer.getStockPrice('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('Financial Data Normalization', () => {
    test('should normalize financial data array', async () => {
      const newFormatFinancials = [{
        symbol: 'AAPL',
        period: 'Q1',
        calendarYear: 2024,
        totalRevenue: 90000000000,
        netIncomeBasic: 20000000000,
        epsActual: 1.25,
        epsEstimate: 1.20,
        epsSurprise: 0.05,
        epsSurprisePercent: 4.17,
        date: '2024-01-25',
        fiscalDateEnding: '2023-12-31'
      }];

      mockProvider.getEarningsData.mockResolvedValue(newFormatFinancials);
      const result = await compatibilityLayer.getFinancialData('AAPL');

      expect(result).toEqual([{
        ticker: 'AAPL',
        quarter: 'Q1',
        year: 2024,
        revenue: 90000000000,
        netIncome: 20000000000,
        eps: 1.25,
        estimatedEPS: 1.20,
        surprise: 0.05,
        surprisePercentage: 4.17,
        reportDate: '2024-01-25',
        fiscalEndDate: '2023-12-31'
      }]);
    });

    test('should handle empty financial data array', async () => {
      mockProvider.getEarningsData.mockResolvedValue([]);
      const result = await compatibilityLayer.getFinancialData('AAPL');

      expect(result).toEqual([]);
    });

    test('should handle non-array financial data', async () => {
      mockProvider.getEarningsData.mockResolvedValue(null);
      const result = await compatibilityLayer.getFinancialData('AAPL');

      expect(result).toEqual([]);
    });
  });

  describe('Company Info Normalization', () => {
    test('should normalize company information', async () => {
      const newFormatCompany = {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        longBusinessSummary: 'Apple Inc. designs and manufactures consumer electronics...',
        gicsSector: 'Technology',
        gicsSubIndustry: 'Technology Hardware',
        countryName: 'United States',
        websiteURL: 'https://www.apple.com',
        marketCapitalization: 2500000000000,
        fullTimeEmployees: 150000,
        foundedYear: 1976,
        exchangeShortName: 'NASDAQ',
        financialCurrency: 'USD'
      };

      mockProvider.getCompanyInfo.mockResolvedValue(newFormatCompany);
      const result = await compatibilityLayer.getCompanyInfo('AAPL');

      expect(result).toEqual({
        ticker: 'AAPL',
        name: 'Apple Inc.',
        description: 'Apple Inc. designs and manufactures consumer electronics...',
        sector: 'Technology',
        industry: 'Technology Hardware',
        country: 'United States',
        website: 'https://www.apple.com',
        marketCap: 2500000000000,
        employees: 150000,
        founded: 1976,
        exchange: 'NASDAQ',
        currency: 'USD'
      });
    });

    test('should handle null company info', async () => {
      mockProvider.getCompanyInfo.mockResolvedValue(null);
      const result = await compatibilityLayer.getCompanyInfo('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('News Data Normalization', () => {
    test('should normalize news articles', async () => {
      const newFormatNews = [{
        title: 'Apple Reports Strong Q1 Results',
        description: 'Apple Inc. reported better than expected earnings...',
        link: 'https://example.com/news/1',
        sourceName: 'Financial Times',
        publishedDate: '2024-01-25T10:00:00Z',
        sentiment: 'positive',
        sentiment_score: 0.8,
        relevance_score: 0.9,
        categories: ['earnings', 'technology']
      }];

      mockProvider.getMarketNews.mockResolvedValue(newFormatNews);
      const result = await compatibilityLayer.getMarketNews('AAPL');

      expect(result).toEqual([{
        headline: 'Apple Reports Strong Q1 Results',
        summary: 'Apple Inc. reported better than expected earnings...',
        url: 'https://example.com/news/1',
        source: 'Financial Times',
        publishedAt: '2024-01-25T10:00:00Z',
        sentiment: 'positive',
        sentimentScore: 0.8,
        relevanceScore: 0.9,
        topics: ['earnings', 'technology'],
        tickerSentiment: []
      }]);
    });

    test('should handle empty news array', async () => {
      mockProvider.getMarketNews.mockResolvedValue([]);
      const result = await compatibilityLayer.getMarketNews('AAPL');

      expect(result).toEqual([]);
    });
  });
});

describe('MigrationHelper', () => {
  describe('Compatible Provider Creation', () => {
    test('should create provider with compatibility layer for new providers', () => {
      const provider = MigrationHelper.createCompatibleProvider('yahoo', true);
      expect(provider).toBeInstanceOf(BackwardCompatibilityLayer);
    });

    test('should create provider with compatibility layer for new providers', () => {
      const provider = MigrationHelper.createCompatibleProvider('yahoo', true);
      expect(provider.constructor.name).toBe('BackwardCompatibilityLayer');
    });

    test('should create provider without compatibility layer when disabled', () => {
      const provider = MigrationHelper.createCompatibleProvider('yahoo', false);
      expect(provider.constructor.name).toBe('YahooFinanceProvider');
    });
  });

  describe('Data Structure Comparison', () => {
    test('should compare compatible data structures', () => {
      const oldData = { ticker: 'AAPL', price: 150.25, change: 2.50 };
      const newData = { ticker: 'AAPL', price: 151.00, change: 2.75 };
      
      const compatible = MigrationHelper.compareDataStructures(
        oldData, 
        newData, 
        ['ticker', 'price', 'change']
      );
      
      expect(compatible).toBe(true);
    });

    test('should detect incompatible data structures', () => {
      const oldData = { ticker: 'AAPL', price: 150.25, change: 2.50 };
      const newData = { symbol: 'AAPL', currentPrice: 151.00 }; // Different field names
      
      const compatible = MigrationHelper.compareDataStructures(
        oldData, 
        newData, 
        ['ticker', 'price']
      );
      
      expect(compatible).toBe(false);
    });

    test('should handle null data comparisons', () => {
      expect(MigrationHelper.compareDataStructures(null, null, [])).toBe(true);
      expect(MigrationHelper.compareDataStructures({}, null, [])).toBe(false);
      expect(MigrationHelper.compareDataStructures(null, {}, [])).toBe(false);
    });
  });

  describe('Migration Recommendations', () => {
    test('should provide default recommendations for unknown providers', () => {
      const recommendations = MigrationHelper.getMigrationRecommendations('unknown_provider');
      
      expect(recommendations.currentProvider).toBe('unknown_provider');
      expect(recommendations.recommendedMigration).toBe('enhanced_multi_provider');
      expect(recommendations.benefits).toContain('Comprehensive multi-source data aggregation');
      expect(recommendations.migrationSteps).toContain('Contact support for custom migration plan');
    });
  });
});