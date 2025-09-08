/**
 * Environment Configuration Management
 * 
 * Centralized management of environment variables, API keys, and configuration
 * for the new data provider system. Provides validation, defaults, and
 * configuration loading for all providers.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfiguration();
    this.validationResults = null;
  }

  /**
   * Load configuration from environment variables
   * @returns {Object} Complete configuration object
   */
  loadConfiguration() {
    return {
      // New Provider API Keys
      apiKeys: {
        newsapi: process.env.NEWSAPI_KEY,
        fred: process.env.FRED_API_KEY,

      },

      // Provider Configuration
      providers: {
        // Current provider selection
        dataProvider: process.env.DATA_PROVIDER || 'enhanced_multi_provider',
        
        // Provider priorities
        providerPriority: {
          stockData: process.env.STOCK_DATA_PROVIDER || 'yahoo',
          financials: process.env.FINANCIALS_PROVIDER || 'yahoo',
          news: process.env.NEWS_PROVIDER || 'newsapi',
          macroData: process.env.MACRO_DATA_PROVIDER || 'fred'
        }
      },

      // Cache Configuration
      cache: {
        stockPrice: parseInt(process.env.CACHE_DURATION_STOCK) || 300000, // 5 minutes
        financials: parseInt(process.env.CACHE_DURATION_FINANCIALS) || 3600000, // 1 hour
        companyInfo: parseInt(process.env.CACHE_DURATION_COMPANY) || 86400000, // 24 hours
        news: parseInt(process.env.CACHE_DURATION_NEWS) || 1800000, // 30 minutes
        macroData: parseInt(process.env.CACHE_DURATION_MACRO) || 86400000, // 24 hours
        analystData: parseInt(process.env.CACHE_DURATION_ANALYST) || 3600000 // 1 hour
      },

      // Rate Limiting Configuration
      rateLimits: {
        newsapi: {
          requestsPerMinute: parseInt(process.env.NEWSAPI_RATE_LIMIT) || 60,
          dailyLimit: parseInt(process.env.NEWSAPI_DAILY_LIMIT) || 1000,
          burstLimit: parseInt(process.env.NEWSAPI_BURST_LIMIT) || 15
        },
        yahoo: {
          requestsPerMinute: parseInt(process.env.YAHOO_RATE_LIMIT) || 120,
          dailyLimit: parseInt(process.env.YAHOO_DAILY_LIMIT) || null,
          burstLimit: parseInt(process.env.YAHOO_BURST_LIMIT) || 30
        },
        fred: {
          requestsPerMinute: parseInt(process.env.FRED_RATE_LIMIT) || 120,
          dailyLimit: parseInt(process.env.FRED_DAILY_LIMIT) || null,
          burstLimit: parseInt(process.env.FRED_BURST_LIMIT) || 30
        }
      },

      // Feature Flags
      features: {
        enableNewProviders: this.parseBoolean(process.env.ENABLE_NEW_PROVIDERS, true),
        enableLegacyProviders: this.parseBoolean(process.env.ENABLE_LEGACY_PROVIDERS, false),
        enableFeatureFlags: this.parseBoolean(process.env.ENABLE_FEATURE_FLAGS, true),
        enableProviderFallback: this.parseBoolean(process.env.ENABLE_PROVIDER_FALLBACK, true),
        enableCaching: this.parseBoolean(process.env.ENABLE_CACHING, true),
        enableRateLimiting: this.parseBoolean(process.env.ENABLE_RATE_LIMITING, true),
        enableMacroData: this.parseBoolean(process.env.ENABLE_MACRO_DATA, true),
        enableSentimentAnalysis: this.parseBoolean(process.env.ENABLE_SENTIMENT_ANALYSIS, true)
      },

      // Timeout Configuration
      timeouts: {
        request: parseInt(process.env.REQUEST_TIMEOUT) || 10000, // 10 seconds
        retry: parseInt(process.env.RETRY_TIMEOUT) || 5000, // 5 seconds
        cache: parseInt(process.env.CACHE_TIMEOUT) || 1000 // 1 second
      },

      // Retry Configuration
      retry: {
        maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
        retryDelay: parseInt(process.env.RETRY_DELAY) || 1000, // 1 second
        exponentialBackoff: this.parseBoolean(process.env.EXPONENTIAL_BACKOFF, true),
        backoffMultiplier: parseFloat(process.env.BACKOFF_MULTIPLIER) || 2.0
      },

      // Environment Information
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        awsRegion: process.env.AWS_REGION || 'us-east-1',
        logLevel: process.env.LOG_LEVEL || 'info',
        debug: this.parseBoolean(process.env.DEBUG, false)
      }
    };
  }

  /**
   * Parse boolean environment variables
   * @param {string} value - Environment variable value
   * @param {boolean} defaultValue - Default value if not set
   * @returns {boolean} Parsed boolean value
   */
  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }

  /**
   * Validate all API keys and configuration
   * @returns {Object} Validation results
   */
  validateConfiguration() {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
      providerStatus: {}
    };

    // Validate API keys for current provider
    const currentProvider = this.config.providers.dataProvider;
    validation.providerStatus[currentProvider] = this.validateProvider(currentProvider);

    if (!validation.providerStatus[currentProvider].valid) {
      validation.valid = false;
      validation.errors.push(...validation.providerStatus[currentProvider].errors);
    }

    // Validate individual provider configurations
    const providers = ['yahoo', 'newsapi', 'fred'];
    for (const provider of providers) {
      validation.providerStatus[provider] = this.validateProvider(provider);
    }

    // Validate cache durations
    this.validateCacheConfiguration(validation);

    // Validate rate limits
    this.validateRateLimitConfiguration(validation);

    // Validate timeouts
    this.validateTimeoutConfiguration(validation);

    // Check for deprecated configurations
    this.checkDeprecatedConfiguration(validation);

    this.validationResults = validation;
    return validation;
  }

  /**
   * Validate specific provider configuration
   * @param {string} providerName - Name of the provider to validate
   * @returns {Object} Provider validation results
   */
  validateProvider(providerName) {
    const validation = {
      provider: providerName,
      valid: true,
      errors: [],
      warnings: [],
      required: [],
      optional: []
    };

    switch (providerName.toLowerCase()) {
      case 'yahoo':
      case 'yahoo_finance':
        // Yahoo Finance doesn't require API key
        validation.valid = true;
        break;



      case 'newsapi':
        if (!this.config.apiKeys.newsapi) {
          validation.valid = false;
          validation.errors.push('NEWSAPI_KEY is required for NewsAPI provider');
          validation.required.push('NEWSAPI_KEY');
        }
        break;

      case 'fred':
        if (!this.config.apiKeys.fred) {
          validation.warnings.push('FRED_API_KEY is optional but recommended for macro economic data');
          validation.optional.push('FRED_API_KEY');
        }
        // FRED is always valid since API key is optional
        validation.valid = true;
        break;

      case 'enhanced_multi_provider':
        // Check required keys for enhanced provider
        const requiredKeys = ['newsapi'];
        for (const key of requiredKeys) {
          if (!this.config.apiKeys[key]) {
            validation.valid = false;
            const keyName = key === 'newsapi' ? 'NEWSAPI_KEY' : `${key.toUpperCase()}_API_KEY`;
            validation.errors.push(`${keyName} is required for enhanced multi-provider`);
            validation.required.push(keyName);
          }
        }
        
        if (!this.config.apiKeys.fred) {
          validation.warnings.push('FRED_API_KEY is optional but recommended for macro economic context');
          validation.optional.push('FRED_API_KEY');
        }
        break;



      // Handle deprecated providers
      case 'alpha_vantage':
        validation.valid = false;
        validation.warnings.push('Alpha Vantage provider is deprecated, consider migrating to enhanced_multi_provider');
        validation.errors.push('Alpha Vantage provider is no longer supported');
        break;
        
      case 'fmp':
      case 'financial_modeling_prep':
        validation.valid = false;
        validation.warnings.push('Financial Modeling Prep provider is deprecated, consider migrating to enhanced_multi_provider');
        validation.errors.push('Financial Modeling Prep provider is no longer supported');
        break;
        
      case 'finnhub':
        validation.valid = false;
        validation.warnings.push('Finnhub provider is deprecated, consider migrating to enhanced_multi_provider');
        validation.errors.push('Finnhub provider is no longer supported');
        break;

      default:
        validation.valid = false;
        validation.errors.push(`Unknown provider: ${providerName}`);
    }

    return validation;
  }

  /**
   * Validate cache configuration
   * @param {Object} validation - Validation object to update
   */
  validateCacheConfiguration(validation) {
    const cacheConfig = this.config.cache;
    
    // Check for reasonable cache durations
    Object.entries(cacheConfig).forEach(([key, duration]) => {
      if (duration < 60000) { // Less than 1 minute
        validation.warnings.push(`Cache duration for ${key} is very short (${duration}ms)`);
      }
      if (duration > 86400000) { // More than 24 hours
        validation.warnings.push(`Cache duration for ${key} is very long (${duration}ms)`);
      }
    });
  }

  /**
   * Validate rate limit configuration
   * @param {Object} validation - Validation object to update
   */
  validateRateLimitConfiguration(validation) {
    const rateLimits = this.config.rateLimits;
    
    Object.entries(rateLimits).forEach(([provider, limits]) => {
      if (limits.requestsPerMinute > 1000) {
        validation.warnings.push(`Rate limit for ${provider} is very high (${limits.requestsPerMinute}/min)`);
      }
      if (limits.requestsPerMinute < 10) {
        validation.warnings.push(`Rate limit for ${provider} is very low (${limits.requestsPerMinute}/min)`);
      }
      if (limits.burstLimit > limits.requestsPerMinute) {
        validation.errors.push(`Burst limit for ${provider} cannot exceed requests per minute`);
        validation.valid = false;
      }
    });
  }

  /**
   * Validate timeout configuration
   * @param {Object} validation - Validation object to update
   */
  validateTimeoutConfiguration(validation) {
    const timeouts = this.config.timeouts;
    
    if (timeouts.request < 1000) {
      validation.warnings.push(`Request timeout is very short (${timeouts.request}ms)`);
    }
    if (timeouts.request > 30000) {
      validation.warnings.push(`Request timeout is very long (${timeouts.request}ms)`);
    }
    if (timeouts.retry >= timeouts.request) {
      validation.errors.push('Retry timeout should be less than request timeout');
      validation.valid = false;
    }
  }

  /**
   * Check for deprecated configuration
   * @param {Object} validation - Validation object to update
   */
  checkDeprecatedConfiguration(validation) {
    // Check for legacy provider usage
    const currentProvider = this.config.providers.dataProvider;
    const legacyProviders = ['alpha_vantage', 'fmp', 'financial_modeling_prep', 'hybrid', 'hybrid_news'];
    
    if (legacyProviders.includes(currentProvider)) {
      validation.warnings.push(`Current provider '${currentProvider}' is deprecated`);
      validation.recommendations.push('Consider migrating to enhanced_multi_provider for better performance and reliability');
    }

    // Check for legacy environment variables
    const legacyEnvVars = [
      'FMP_API_KEY' // Removed - no longer supported
    ];
    
    // Check for removed environment variables
    const removedEnvVars = [
    ];

    legacyEnvVars.forEach(envVar => {
      if (process.env[envVar] && !this.config.features.enableLegacyProviders) {
        validation.warnings.push(`Legacy environment variable ${envVar} is set but legacy providers are disabled`);
      }
    });

    // Check for removed environment variables
    removedEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        validation.warnings.push(`Removed environment variable ${envVar} is still set. This provider has been removed and is no longer supported.`);
      }
    });
  }

  /**
   * Get configuration for a specific provider
   * @param {string} providerName - Name of the provider
   * @returns {Object} Provider-specific configuration
   */
  getProviderConfig(providerName) {
    const baseConfig = {
      apiKey: this.getApiKey(providerName),
      cache: this.getCacheConfig(providerName),
      rateLimit: this.getRateLimitConfig(providerName),
      timeout: this.config.timeouts.request,
      retry: this.config.retry,
      features: this.config.features
    };

    // Add provider-specific configurations
    switch (providerName.toLowerCase()) {
      case 'newsapi':
        return {
          ...baseConfig,
          dailyQuotaTracking: true,
          endpoints: {
            everything: '/everything',
            topHeadlines: '/top-headlines'
          }
        };

      case 'yahoo':
        return {
          ...baseConfig,
          pythonBridge: true,
          yfinanceModule: 'yfinance'
        };

      case 'fred':
        return {
          ...baseConfig,
          optional: true,
          endpoints: {
            series: '/series/observations',
            categories: '/category/series'
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Get API key for a provider
   * @param {string} providerName - Name of the provider
   * @returns {string|null} API key or null if not found
   */
  getApiKey(providerName) {
    const keyMap = {
      newsapi: this.config.apiKeys.newsapi,
      fred: this.config.apiKeys.fred,
      alpha_vantage: this.config.apiKeys.alphaVantage,
      fmp: null // Removed - no longer supported
    };

    return keyMap[providerName.toLowerCase()] || null;
  }

  /**
   * Get cache configuration for a provider
   * @param {string} providerName - Name of the provider
   * @returns {Object} Cache configuration
   */
  getCacheConfig(providerName) {
    const providerCacheMap = {
      yahoo: {
        stockPrice: this.config.cache.stockPrice,
        financials: this.config.cache.financials,
        companyInfo: this.config.cache.companyInfo
      },
      newsapi: {
        news: this.config.cache.news
      },
      fred: {
        macroData: this.config.cache.macroData
      }
    };

    return {
      enabled: this.config.features.enableCaching,
      durations: providerCacheMap[providerName.toLowerCase()] || {
        default: this.config.cache.stockPrice
      }
    };
  }

  /**
   * Get rate limit configuration for a provider
   * @param {string} providerName - Name of the provider
   * @returns {Object} Rate limit configuration
   */
  getRateLimitConfig(providerName) {
    const rateLimitConfig = this.config.rateLimits[providerName.toLowerCase()];
    
    if (!rateLimitConfig) {
      return {
        enabled: this.config.features.enableRateLimiting,
        requestsPerMinute: 60,
        burstLimit: 15,
        dailyLimit: null
      };
    }

    return {
      enabled: this.config.features.enableRateLimiting,
      ...rateLimitConfig
    };
  }

  /**
   * Get current configuration summary
   * @returns {Object} Configuration summary
   */
  getConfigurationSummary() {
    const validation = this.validationResults || this.validateConfiguration();
    
    return {
      currentProvider: this.config.providers.dataProvider,
      validConfiguration: validation.valid,
      enabledFeatures: Object.entries(this.config.features)
        .filter(([key, value]) => value)
        .map(([key]) => key),
      configuredProviders: Object.entries(this.config.apiKeys)
        .filter(([key, value]) => value)
        .map(([key]) => key),
      cacheEnabled: this.config.features.enableCaching,
      rateLimitingEnabled: this.config.features.enableRateLimiting,
      environment: this.config.environment.nodeEnv,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  /**
   * Update configuration at runtime
   * @param {Object} updates - Configuration updates
   */
  updateConfiguration(updates) {
    // Deep merge updates into current configuration
    this.config = this.deepMerge(this.config, updates);
    
    // Re-validate after updates
    this.validationResults = this.validateConfiguration();
    
    console.log('🔄 Configuration updated and re-validated');
  }

  /**
   * Deep merge two objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Export configuration for debugging
   * @param {boolean} includeSensitive - Whether to include sensitive data
   * @returns {Object} Configuration export
   */
  exportConfiguration(includeSensitive = false) {
    const config = JSON.parse(JSON.stringify(this.config));
    
    if (!includeSensitive) {
      // Mask API keys
      Object.keys(config.apiKeys).forEach(key => {
        if (config.apiKeys[key]) {
          config.apiKeys[key] = config.apiKeys[key].substring(0, 8) + '...';
        }
      });
    }
    
    return config;
  }
}

module.exports = EnvironmentConfig;