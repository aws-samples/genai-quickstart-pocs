/**
 * Provider Configuration Management
 * 
 * Manages API keys, timeouts, rate limits, and other configuration
 * for data providers in a centralized way.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

class ProviderConfig {
  constructor(options = {}) {
    this.config = {
      // Default timeouts
      requestTimeout: options.requestTimeout || 10000, // 10 seconds
      retryTimeout: options.retryTimeout || 5000, // 5 seconds
      
      // Default retry settings
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000, // 1 second
      
      // Default cache settings
      cacheEnabled: options.cacheEnabled !== false, // enabled by default
      defaultCacheDuration: options.defaultCacheDuration || 300000, // 5 minutes
      
      // Rate limiting defaults
      defaultRateLimit: options.defaultRateLimit || 60, // requests per minute
      rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute window
      
      // API keys
      apiKeys: options.apiKeys || {},
      
      // Provider-specific configurations
      providers: options.providers || {}
    };
  }

  /**
   * Get API key for a specific provider
   * @param {string} providerName - Name of the provider
   * @returns {string|null} API key or null if not found
   */
  getApiKey(providerName) {
    // Check provider-specific API key first
    if (this.config.apiKeys[providerName]) {
      return this.config.apiKeys[providerName];
    }

    // Check environment variables with common naming patterns
    const envVarNames = [
      `${providerName.toUpperCase()}_API_KEY`,
      `${providerName.toUpperCase()}_KEY`,
      `${providerName}_API_KEY`,
      `${providerName}_KEY`
    ];

    for (const envVar of envVarNames) {
      if (process.env[envVar]) {
        return process.env[envVar];
      }
    }

    return null;
  }

  /**
   * Set API key for a provider
   * @param {string} providerName - Name of the provider
   * @param {string} apiKey - API key to set
   */
  setApiKey(providerName, apiKey) {
    this.config.apiKeys[providerName] = apiKey;
  }

  /**
   * Get timeout configuration for requests
   * @param {string} providerName - Name of the provider
   * @returns {number} Timeout in milliseconds
   */
  getRequestTimeout(providerName) {
    const providerConfig = this.config.providers[providerName];
    return providerConfig?.requestTimeout || this.config.requestTimeout;
  }

  /**
   * Get retry configuration for a provider
   * @param {string} providerName - Name of the provider
   * @returns {Object} Retry configuration
   */
  getRetryConfig(providerName) {
    const providerConfig = this.config.providers[providerName];
    return {
      maxRetries: providerConfig?.maxRetries || this.config.maxRetries,
      retryDelay: providerConfig?.retryDelay || this.config.retryDelay,
      retryTimeout: providerConfig?.retryTimeout || this.config.retryTimeout
    };
  }

  /**
   * Get cache configuration for a provider
   * @param {string} providerName - Name of the provider
   * @param {string} dataType - Type of data being cached
   * @returns {Object} Cache configuration
   */
  getCacheConfig(providerName, dataType = 'default') {
    const providerConfig = this.config.providers[providerName];
    const cacheConfig = providerConfig?.cache || {};
    
    return {
      enabled: cacheConfig.enabled !== false && this.config.cacheEnabled,
      duration: cacheConfig[dataType] || cacheConfig.duration || this.config.defaultCacheDuration
    };
  }

  /**
   * Get rate limit configuration for a provider
   * @param {string} providerName - Name of the provider
   * @returns {Object} Rate limit configuration
   */
  getRateLimitConfig(providerName) {
    const providerConfig = this.config.providers[providerName];
    const rateLimitConfig = providerConfig?.rateLimit || {};
    
    return {
      requestsPerMinute: rateLimitConfig.requestsPerMinute || this.config.defaultRateLimit,
      window: rateLimitConfig.window || this.config.rateLimitWindow,
      burstLimit: rateLimitConfig.burstLimit || Math.ceil((rateLimitConfig.requestsPerMinute || this.config.defaultRateLimit) / 4)
    };
  }

  /**
   * Set provider-specific configuration
   * @param {string} providerName - Name of the provider
   * @param {Object} config - Provider configuration
   */
  setProviderConfig(providerName, config) {
    this.config.providers[providerName] = {
      ...this.config.providers[providerName],
      ...config
    };
  }

  /**
   * Get full configuration for a provider
   * @param {string} providerName - Name of the provider
   * @returns {Object} Complete provider configuration
   */
  getProviderConfig(providerName) {
    return {
      apiKey: this.getApiKey(providerName),
      timeout: this.getRequestTimeout(providerName),
      retry: this.getRetryConfig(providerName),
      cache: this.getCacheConfig(providerName),
      rateLimit: this.getRateLimitConfig(providerName),
      custom: this.config.providers[providerName] || {}
    };
  }

  /**
   * Validate provider configuration
   * @param {string} providerName - Name of the provider
   * @param {Array} requiredKeys - Required API keys
   * @returns {Object} Validation result
   */
  validateProvider(providerName, requiredKeys = []) {
    const validation = {
      valid: true,
      provider: providerName,
      issues: [],
      warnings: []
    };

    // Check required API keys
    for (const keyName of requiredKeys) {
      const apiKey = this.getApiKey(keyName);
      if (!apiKey) {
        validation.valid = false;
        validation.issues.push(`Missing required API key: ${keyName}`);
      }
    }

    // Check configuration sanity
    const config = this.getProviderConfig(providerName);
    
    if (config.timeout < 1000) {
      validation.warnings.push('Request timeout is very low (< 1 second)');
    }
    
    if (config.retry.maxRetries > 10) {
      validation.warnings.push('Max retries is very high (> 10)');
    }
    
    if (config.rateLimit.requestsPerMinute > 1000) {
      validation.warnings.push('Rate limit is very high (> 1000/min)');
    }

    return validation;
  }

  /**
   * Create default configurations for known providers
   * @returns {Object} Default provider configurations
   */
  static getDefaultConfigurations() {
    return {
      yahoo: {
        cache: {
          stock_price: 300000, // 5 minutes
          earnings: 3600000, // 1 hour
          company_info: 86400000, // 24 hours
          news: 1800000 // 30 minutes
        },
        rateLimit: {
          requestsPerMinute: 120, // No official limit, be conservative
          burstLimit: 30
        }
      },
      newsapi: {
        cache: {
          news: 1800000 // 30 minutes
        },
        rateLimit: {
          requestsPerMinute: 60, // Conservative for daily quota
          burstLimit: 15
        }
      },
      fred: {
        cache: {
          macro_data: 86400000 // 24 hours
        },
        rateLimit: {
          requestsPerMinute: 120, // No official limit
          burstLimit: 30
        }
      }
    };
  }
}

module.exports = ProviderConfig;