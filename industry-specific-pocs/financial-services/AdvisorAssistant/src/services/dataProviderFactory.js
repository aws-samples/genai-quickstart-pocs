/**
 * Data Provider Factory
 * 
 * Factory pattern implementation for switching between different financial data providers.
 * Supports new enhanced providers with Yahoo Finance, NewsAPI, and FRED.
 * 
 * Provider Options:
 * - 'enhanced_multi_provider': Multi-provider system with Yahoo Finance, NewsAPI, and FRED
 * - 'yahoo': Yahoo Finance for stock data
 * - 'newsapi': NewsAPI for news and sentiment
 * - 'fred': FRED for macro economic data
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

// New provider imports
const YahooFinanceProvider = require('./providers/YahooFinanceProvider');
const NewsAPIProvider = require('./providers/NewsAPIProvider');
const FREDProvider = require('./providers/FREDProvider');
const EnhancedDataAggregator = require('./providers/EnhancedDataAggregator');
const EnvironmentConfig = require('./providers/EnvironmentConfig');
const FeatureFlagManager = require('./providers/FeatureFlagManager');



/**
 * Data Provider Factory
 * Creates appropriate data provider based on configuration
 * Uses singleton pattern to prevent multiple provider initializations
 */
class DataProviderFactory {
  static environmentConfig = new EnvironmentConfig();
  static featureFlagManager = new FeatureFlagManager();
  static providerInstances = new Map(); // Singleton cache

  /**
   * Create data provider instance (singleton)
   * @param {string} providerType - Type of provider to create
   * @param {string} userId - Optional user ID for feature flag evaluation
   * @returns {Object} Data provider instance
   */
  static createProvider(providerType = process.env.DATA_PROVIDER || 'enhanced_multi_provider', userId = null) {
    const cacheKey = `${providerType}-${userId || 'default'}`;
    
    // Return existing instance if available
    if (this.providerInstances.has(cacheKey)) {
      console.log(`🔄 Reusing existing provider instance: ${providerType}`);
      return this.providerInstances.get(cacheKey);
    }
    
    console.log(`🏭 DataProviderFactory: Creating provider type '${providerType}'`);
    
    // Check if provider is enabled via feature flags
    if (!this.featureFlagManager.isProviderEnabled(providerType, userId)) {
      console.warn(`⚠️  Provider '${providerType}' is disabled by feature flags`);
      
      // Try to get alternative provider based on feature flags
      const alternativeProvider = this.featureFlagManager.getProviderForUser(userId, 'enhanced_multi_provider');
      if (alternativeProvider !== providerType) {
        console.log(`🔄 Switching to alternative provider: ${alternativeProvider}`);
        return this.createProvider(alternativeProvider, userId);
      }
      
      throw new Error(`Provider '${providerType}' is disabled and no alternative is available`);
    }
    
    // Validate configuration for the specific provider being created
    const providerValidation = this.environmentConfig.validateProvider(providerType);
    if (!providerValidation.valid) {
      console.error(`❌ Provider validation failed for ${providerType}:`, providerValidation.errors);
      throw new Error(`Provider validation failed for ${providerType}: ${providerValidation.errors.join(', ')}`);
    }
    
    switch (providerType.toLowerCase()) {
      // New provider types
      case 'yahoo':
      case 'yahoo_finance':
        console.log('📊 Using Yahoo Finance data provider');
        const yahooProvider = new YahooFinanceProvider({
          ...this.environmentConfig.getProviderConfig('yahoo'),
          features: this.featureFlagManager.getProviderFeatures('yahoo', userId)
        });
        this.providerInstances.set(cacheKey, yahooProvider);
        return yahooProvider;
        
      case 'newsapi':
        console.log('📊 Using NewsAPI data provider');
        const newsProvider = new NewsAPIProvider({
          ...this.environmentConfig.getProviderConfig('newsapi'),
          features: this.featureFlagManager.getProviderFeatures('newsapi', userId)
        });
        this.providerInstances.set(cacheKey, newsProvider);
        return newsProvider;
        
      case 'fred':
        console.log('📊 Using FRED data provider');
        const fredProvider = new FREDProvider({
          ...this.environmentConfig.getProviderConfig('fred'),
          features: this.featureFlagManager.getProviderFeatures('fred', userId)
        });
        this.providerInstances.set(cacheKey, fredProvider);
        return fredProvider;
        
      case 'enhanced_multi_provider':
        console.log('📊 Using Enhanced Multi-Provider (Yahoo + NewsAPI + FRED)');
        const enhancedProvider = new EnhancedDataAggregator({
          yahoo: {
            ...this.environmentConfig.getProviderConfig('yahoo'),
            features: this.featureFlagManager.getProviderFeatures('yahoo', userId)
          },
          newsapi: {
            ...this.environmentConfig.getProviderConfig('newsapi'),
            features: this.featureFlagManager.getProviderFeatures('newsapi', userId)
          },
          fred: {
            ...this.environmentConfig.getProviderConfig('fred'),
            features: this.featureFlagManager.getProviderFeatures('fred', userId)
          }
        });
        this.providerInstances.set(cacheKey, enhancedProvider);
        return enhancedProvider;
        
      default:
        console.log(`⚠️  Unknown provider type '${providerType}', defaulting to enhanced_multi_provider`);
        const defaultProvider = new EnhancedDataAggregator({
          yahoo: {
            ...this.environmentConfig.getProviderConfig('yahoo'),
            features: this.featureFlagManager.getProviderFeatures('yahoo', userId)
          },
          newsapi: {
            ...this.environmentConfig.getProviderConfig('newsapi'),
            features: this.featureFlagManager.getProviderFeatures('newsapi', userId)
          },
          fred: {
            ...this.environmentConfig.getProviderConfig('fred'),
            features: this.featureFlagManager.getProviderFeatures('fred', userId)
          }
        });
        this.providerInstances.set(cacheKey, defaultProvider);
        return defaultProvider;
    }
  }

  /**
   * Get available provider types
   * @returns {Array} List of available provider types
   */
  static getAvailableProviders() {
    return [
      // New providers
      {
        type: 'yahoo',
        name: 'Yahoo Finance',
        description: 'Free stock prices, financial data, and company fundamentals',
        recommended: true
      },
      {
        type: 'newsapi',
        name: 'NewsAPI',
        description: 'News headlines with sentiment analysis',
        recommended: true
      },
      {
        type: 'fred',
        name: 'FRED Economic Data',
        description: 'Macro economic indicators (interest rates, CPI)',
        recommended: true
      },
      {
        type: 'enhanced_multi_provider',
        name: 'Enhanced Multi-Provider',
        description: 'Combines Yahoo, NewsAPI, and FRED for comprehensive data',
        recommended: true,
        primary: true
      }
    ];
  }

  /**
   * Get environment configuration instance
   * @returns {EnvironmentConfig} Environment configuration instance
   */
  static getEnvironmentConfig() {
    return this.environmentConfig;
  }

  /**
   * Get feature flag manager instance
   * @returns {FeatureFlagManager} Feature flag manager instance
   */
  static getFeatureFlagManager() {
    return this.featureFlagManager;
  }

  /**
   * Get configuration summary
   * @returns {Object} Configuration summary
   */
  static getConfigurationSummary() {
    return this.environmentConfig.getConfigurationSummary();
  }

  /**
   * Validate current configuration
   * @returns {Object} Validation results
   */
  static validateConfiguration() {
    return this.environmentConfig.validateConfiguration();
  }

  /**
   * Create provider with A/B testing support
   * @param {string} userId - User ID for consistent assignment
   * @param {string} defaultProvider - Default provider if no experiment is active
   * @returns {Object} Provider instance based on feature flags and experiments
   */
  static createProviderForUser(userId, defaultProvider = 'enhanced_multi_provider') {
    const selectedProvider = this.featureFlagManager.getProviderForUser(userId, defaultProvider);
    return this.createProvider(selectedProvider, userId);
  }

  /**
   * Set up A/B test for provider comparison
   * @param {string} experimentId - Unique experiment ID
   * @param {Object} config - Experiment configuration
   * @returns {Object} Created experiment
   */
  static createProviderExperiment(experimentId, config) {
    return this.featureFlagManager.createExperiment(experimentId, {
      name: config.name || 'Provider Comparison',
      description: config.description || 'A/B test comparing different data providers',
      treatmentPercentage: config.treatmentPercentage || 50,
      treatmentProvider: config.treatmentProvider || 'enhanced_multi_provider',
      controlProvider: config.controlProvider || 'enhanced_multi_provider',
      ...config
    });
  }

  /**
   * Validate provider configuration
   * @param {string} providerType - Provider type to validate
   * @returns {Object} Validation result
   */
  static validateProvider(providerType) {
    const providerValidation = this.environmentConfig.validateProvider(providerType);
    
    // Convert to legacy format for backward compatibility
    return {
      valid: providerValidation.valid,
      provider: providerValidation.provider,
      issues: providerValidation.errors,
      recommendations: [
        ...providerValidation.warnings,
        ...(providerValidation.required.length > 0 ? 
          [`Set required API keys: ${providerValidation.required.join(', ')}`] : []),
        ...(providerValidation.optional.length > 0 ? 
          [`Consider setting optional API keys: ${providerValidation.optional.join(', ')}`] : [])
      ]
    };
  }
}

/**
 * Backward Compatibility Layer
 * Ensures new providers return data in the same format as legacy providers
 */
class BackwardCompatibilityLayer {
  constructor(provider) {
    this.provider = provider;
    this.providerName = provider.getProviderName ? provider.getProviderName() : provider.constructor.name;
  }

  /**
   * Normalize stock price data to legacy format
   */
  normalizeStockPrice(data) {
    if (!data) return null;

    // If data is already in legacy format, return as-is
    if (data.ticker && typeof data.price === 'number') {
      return data;
    }

    // Transform new provider format to legacy format
    return {
      ticker: data.symbol || data.ticker,
      price: parseFloat(data.price || data.regularMarketPrice || data.currentPrice),
      change: parseFloat(data.change || data.regularMarketChange || data.priceChange),
      changePercent: parseFloat(data.changePercent || data.regularMarketChangePercent || data.percentChange) / (Math.abs(parseFloat(data.changePercent || data.regularMarketChangePercent || data.percentChange)) > 1 ? 100 : 1),
      volume: parseFloat(data.volume || data.regularMarketVolume || data.tradingVolume) || null,
      previousClose: parseFloat(data.previousClose || data.regularMarketPreviousClose || data.prevClose) || null,
      open: parseFloat(data.open || data.regularMarketOpen || data.openPrice) || null,
      high: parseFloat(data.high || data.regularMarketDayHigh || data.dayHigh) || null,
      low: parseFloat(data.low || data.regularMarketDayLow || data.dayLow) || null,
      marketCap: parseFloat(data.marketCap || data.marketCapitalization) || null,
      pe: parseFloat(data.pe || data.trailingPE || data.peRatio) || null,
      eps: parseFloat(data.eps || data.trailingEps || data.earningsPerShare) || null,
      timestamp: data.timestamp || new Date()
    };
  }

  /**
   * Normalize financial data to legacy format
   */
  normalizeFinancialData(data) {
    if (!Array.isArray(data)) return [];

    return data.map(financial => ({
      ticker: financial.symbol || financial.ticker,
      quarter: financial.quarter || financial.period,
      year: financial.year || financial.calendarYear,
      revenue: parseFloat(financial.revenue || financial.totalRevenue || financial.sales) || null,
      netIncome: parseFloat(financial.netIncome || financial.netIncomeBasic || financial.profit) || null,
      eps: parseFloat(financial.eps || financial.epsActual || financial.earningsPerShare) || null,
      estimatedEPS: parseFloat(financial.estimatedEPS || financial.epsEstimate || financial.expectedEPS) || null,
      surprise: parseFloat(financial.surprise || financial.epsSurprise) || null,
      surprisePercentage: parseFloat(financial.surprisePercentage || financial.epsSurprisePercent) || null,
      reportDate: financial.reportDate || financial.date || financial.announcementDate,
      fiscalEndDate: financial.fiscalEndDate || financial.fiscalDateEnding || financial.periodEnding
    }));
  }

  /**
   * Normalize company info to legacy format
   */
  normalizeCompanyInfo(data) {
    if (!data) return null;

    return {
      ticker: data.symbol || data.ticker,
      name: data.name || data.companyName || data.longName,
      description: data.description || data.longBusinessSummary || data.businessSummary,
      sector: data.sector || data.gicsSector,
      industry: data.industry || data.gicsSubIndustry,
      country: data.country || data.countryName,
      website: data.website || data.websiteURL,
      marketCap: parseFloat(data.marketCap || data.marketCapitalization) || null,
      employees: parseInt(data.employees || data.fullTimeEmployees) || null,
      founded: data.founded || data.foundedYear,
      exchange: data.exchange || data.exchangeShortName,
      currency: data.currency || data.financialCurrency || 'USD'
    };
  }

  /**
   * Normalize news data to legacy format
   */
  normalizeNewsData(data) {
    if (!Array.isArray(data)) return [];

    return data.map(article => ({
      headline: article.headline || article.title,
      summary: article.summary || article.description || article.content,
      url: article.url || article.link,
      source: article.source || article.sourceName || article.publisher,
      publishedAt: article.publishedAt || article.publishedDate || article.datetime,
      sentiment: article.sentiment || 'neutral',
      sentimentScore: parseFloat(article.sentimentScore || article.sentiment_score) || 0,
      relevanceScore: parseFloat(article.relevanceScore || article.relevance_score) || 0.5,
      topics: article.topics || article.categories || [],
      tickerSentiment: article.tickerSentiment || []
    }));
  }

  // Proxy methods that apply normalization
  async getStockPrice(ticker) {
    const result = await this.provider.getStockPrice(ticker);
    return this.normalizeStockPrice(result);
  }

  async getFinancialData(ticker) {
    const result = await this.provider.getEarningsData(ticker);
    return this.normalizeFinancialData(result);
  }

  async getCompanyInfo(ticker) {
    const result = await this.provider.getCompanyInfo(ticker);
    return this.normalizeCompanyInfo(result);
  }

  async getMarketNews(ticker) {
    const result = await this.provider.getMarketNews(ticker);
    return this.normalizeNewsData(result);
  }

  async updateStockPrices() {
    return await this.provider.updateStockPrices();
  }

  // Pass through other methods
  getProviderName() {
    return this.provider.getProviderName ? this.provider.getProviderName() : this.providerName;
  }

  getProviderConfig() {
    return this.provider.getProviderConfig ? this.provider.getProviderConfig() : {
      name: this.getProviderName(),
      version: '1.0.0',
      capabilities: ['stock_price', 'financials', 'company_info', 'news']
    };
  }
}

/**
 * Migration Helper
 * Provides utilities for switching between old and new providers
 */
class MigrationHelper {
  /**
   * Create a provider with backward compatibility
   * @param {string} providerType - Provider type
   * @param {boolean} enableCompatibility - Whether to enable backward compatibility layer
   * @returns {Object} Provider instance with optional compatibility layer
   */
  static createCompatibleProvider(providerType, enableCompatibility = true) {
    const provider = DataProviderFactory.createProvider(providerType);
    
    // Only apply compatibility layer to new providers
    const newProviderTypes = ['yahoo', 'yahoo_finance', 'newsapi', 'fred', 'enhanced_multi_provider'];
    const isNewProvider = newProviderTypes.includes(providerType.toLowerCase());
    
    if (enableCompatibility && isNewProvider) {
      console.log(`🔄 Applying backward compatibility layer to ${providerType}`);
      return new BackwardCompatibilityLayer(provider);
    }
    
    return provider;
  }

  /**
   * Test provider compatibility
   * @param {string} oldProviderType - Old provider type
   * @param {string} newProviderType - New provider type
   * @param {string} testTicker - Ticker to test with
   * @returns {Promise<Object>} Compatibility test results
   */
  static async testProviderCompatibility(oldProviderType, newProviderType, testTicker = 'AAPL') {
    const results = {
      ticker: testTicker,
      oldProvider: oldProviderType,
      newProvider: newProviderType,
      tests: {},
      compatible: true,
      issues: []
    };

    try {
      const oldProvider = DataProviderFactory.createProvider(oldProviderType);
      const newProvider = this.createCompatibleProvider(newProviderType, true);

      // Test stock price compatibility
      try {
        const oldStockPrice = await oldProvider.getStockPrice(testTicker);
        const newStockPrice = await newProvider.getStockPrice(testTicker);
        
        results.tests.stockPrice = {
          oldFormat: oldStockPrice,
          newFormat: newStockPrice,
          compatible: this.compareDataStructures(oldStockPrice, newStockPrice, ['ticker', 'price', 'change'])
        };
        
        if (!results.tests.stockPrice.compatible) {
          results.compatible = false;
          results.issues.push('Stock price data structure mismatch');
        }
      } catch (error) {
        results.tests.stockPrice = { error: error.message };
        results.issues.push(`Stock price test failed: ${error.message}`);
      }

      // Test financial data compatibility
      try {
        const oldFinancials = await oldProvider.getFinancialData(testTicker);
        const newFinancials = await newProvider.getFinancialData(testTicker);
        
        results.tests.financials = {
          oldCount: oldFinancials?.length || 0,
          newCount: newFinancials?.length || 0,
          compatible: Array.isArray(oldFinancials) && Array.isArray(newFinancials)
        };
        
        if (newFinancials?.length > 0 && oldFinancials?.length > 0) {
          results.tests.financials.structureMatch = this.compareDataStructures(
            oldFinancials[0], 
            newFinancials[0], 
            ['ticker', 'quarter', 'year', 'eps']
          );
        }
      } catch (error) {
        results.tests.financials = { error: error.message };
        results.issues.push(`Financial data test failed: ${error.message}`);
      }

      // Test company info compatibility
      try {
        const oldCompanyInfo = await oldProvider.getCompanyInfo(testTicker);
        const newCompanyInfo = await newProvider.getCompanyInfo(testTicker);
        
        results.tests.companyInfo = {
          oldFormat: oldCompanyInfo,
          newFormat: newCompanyInfo,
          compatible: this.compareDataStructures(oldCompanyInfo, newCompanyInfo, ['ticker', 'name', 'sector'])
        };
        
        if (!results.tests.companyInfo.compatible) {
          results.compatible = false;
          results.issues.push('Company info data structure mismatch');
        }
      } catch (error) {
        results.tests.companyInfo = { error: error.message };
        results.issues.push(`Company info test failed: ${error.message}`);
      }

    } catch (error) {
      results.compatible = false;
      results.issues.push(`Provider creation failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Compare data structures for compatibility
   * @param {Object} oldData - Old data structure
   * @param {Object} newData - New data structure
   * @param {Array} requiredFields - Required fields to check
   * @returns {boolean} Whether structures are compatible
   */
  static compareDataStructures(oldData, newData, requiredFields = []) {
    if (!oldData && !newData) return true;
    if (!oldData || !newData) return false;

    // Check if required fields exist in both structures
    for (const field of requiredFields) {
      if ((oldData[field] !== undefined) !== (newData[field] !== undefined)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get migration recommendations
   * @param {string} currentProvider - Current provider type
   * @returns {Object} Migration recommendations
   */
  static getMigrationRecommendations(currentProvider) {
    const recommendations = {
      currentProvider,
      recommendedMigration: null,
      benefits: [],
      considerations: [],
      migrationSteps: []
    };

    switch (currentProvider.toLowerCase()) {
      default:
        recommendations.recommendedMigration = 'enhanced_multi_provider';
        recommendations.benefits = ['Comprehensive multi-source data aggregation'];
        recommendations.considerations = ['Evaluate current setup and requirements'];
        recommendations.migrationSteps = ['Contact support for custom migration plan'];
    }

    return recommendations;
  }
}

module.exports = {
  DataProviderFactory,
  BackwardCompatibilityLayer,
  MigrationHelper
};