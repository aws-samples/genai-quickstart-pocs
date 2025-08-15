/**
 * Base Provider Class
 * 
 * Provides common functionality for all data providers including:
 * - Caching with configurable TTL
 * - Error handling with retry logic
 * - Rate limiting with token bucket algorithm
 * - Request timeout management
 * - Logging and monitoring
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const axios = require('axios');
const DataProviderInterface = require('./DataProviderInterface');
const ProviderConfig = require('./ProviderConfig');
const ErrorHandler = require('./ErrorHandler');
const ProviderMonitor = require('./ProviderMonitor');

class BaseProvider extends DataProviderInterface {
  constructor(providerName, config = {}) {
    super();
    this.providerName = providerName;
    this.config = new ProviderConfig(config);
    
    // Initialize error handling
    this.errorHandler = new ErrorHandler();
    
    // Initialize monitoring (shared instance)
    if (!BaseProvider.monitor) {
      BaseProvider.monitor = new ProviderMonitor();
    }
    this.monitor = BaseProvider.monitor;
    
    // Initialize caching
    this.cache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0
    };
    
    // Initialize rate limiting
    this.rateLimiter = this.createRateLimiter();
    
    // Initialize request stats
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      retries: 0,
      rateLimited: 0
    };
    
    // Provider health status
    this.healthStatus = {
      isEnabled: true,
      lastError: null,
      consecutiveErrors: 0,
      disabledUntil: null,
      degradationLevel: 'none' // none, partial, severe
    };
    
    // Set up periodic cache cleanup
    this.setupCacheCleanup();
  }

  /**
   * Create rate limiter using token bucket algorithm
   * @returns {Object} Rate limiter instance
   */
  createRateLimiter() {
    const rateLimitConfig = this.config.getRateLimitConfig(this.providerName);
    
    return {
      tokens: rateLimitConfig.requestsPerMinute,
      maxTokens: rateLimitConfig.requestsPerMinute,
      refillRate: rateLimitConfig.requestsPerMinute / 60, // tokens per second
      lastRefill: Date.now(),
      
      // Check if request can proceed
      canProceed() {
        this.refillTokens();
        if (this.tokens >= 1) {
          this.tokens -= 1;
          return true;
        }
        return false;
      },
      
      // Refill tokens based on time elapsed
      refillTokens() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * this.refillRate;
        
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
      },
      
      // Get time until next token is available
      getWaitTime() {
        this.refillTokens();
        if (this.tokens >= 1) return 0;
        return Math.ceil((1 - this.tokens) / this.refillRate * 1000); // milliseconds
      }
    };
  }

  /**
   * Set up periodic cache cleanup to remove expired entries
   */
  setupCacheCleanup() {
    // Clean up cache every 5 minutes
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let evicted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        evicted++;
      }
    }
    
    if (evicted > 0) {
      this.cacheStats.evictions += evicted;
      console.log(`🧹 Cache cleanup: evicted ${evicted} expired entries for ${this.providerName}`);
    }
  }

  /**
   * Generate cache key for data
   * @param {string} method - Method name
   * @param {string} ticker - Ticker symbol
   * @param {Object} params - Additional parameters
   * @returns {string} Cache key
   */
  generateCacheKey(method, ticker, params = {}) {
    const paramString = Object.keys(params).length > 0 ? 
      JSON.stringify(params) : '';
    return `${this.providerName}:${method}:${ticker}:${paramString}`;
  }

  /**
   * Get data from cache
   * @param {string} cacheKey - Cache key
   * @returns {any|null} Cached data or null if not found/expired
   */
  getFromCache(cacheKey) {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }
    
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(cacheKey);
      this.cacheStats.misses++;
      this.cacheStats.evictions++;
      return null;
    }
    
    this.cacheStats.hits++;
    return entry.data;
  }

  /**
   * Set data in cache
   * @param {string} cacheKey - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setInCache(cacheKey, data, ttl) {
    const cacheConfig = this.config.getCacheConfig(this.providerName);
    
    if (!cacheConfig.enabled) {
      return;
    }
    
    const expiresAt = Date.now() + (ttl || cacheConfig.duration);
    this.cache.set(cacheKey, {
      data,
      expiresAt,
      createdAt: Date.now()
    });
    
    this.cacheStats.sets++;
  }

  /**
   * Wait for rate limit to allow request
   * @returns {Promise<void>}
   */
  async waitForRateLimit() {
    if (this.rateLimiter.canProceed()) {
      return;
    }
    
    const waitTime = this.rateLimiter.getWaitTime();
    if (waitTime > 0) {
      this.requestStats.rateLimited++;
      
      // Record rate limit hit for monitoring
      this.monitor.recordRateLimitHit(this.providerName, {
        retryAfter: Math.ceil(waitTime / 1000),
        currentUsage: this.rateLimiter.maxTokens - this.rateLimiter.tokens,
        limit: this.rateLimiter.maxTokens
      });
      
      console.log(`⏳ Rate limit reached for ${this.providerName}, waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with error handling and retries
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<any>} Response data
   */
  async makeRequest(url, options = {}) {
    const retryConfig = this.config.getRetryConfig(this.providerName);
    const timeout = this.config.getRequestTimeout(this.providerName);
    
    let lastError;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Wait for rate limit
        await this.waitForRateLimit();
        
        this.requestStats.total++;
        
        const response = await axios({
          url,
          timeout,
          ...options
        });
        
        this.requestStats.successful++;
        return response.data;
        
      } catch (error) {
        lastError = error;
        this.requestStats.failed++;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }
        
        this.requestStats.retries++;
        const delay = this.calculateRetryDelay(attempt, retryConfig.retryDelay);
        
        console.log(`⚠️  Request failed for ${this.providerName} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms: ${error.message}`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error should not be retried
   * @param {Error} error - Error to check
   * @returns {boolean} True if error should not be retried
   */
  isNonRetryableError(error) {
    // Don't retry on authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return true;
    }
    
    // Don't retry on bad request errors
    if (error.response?.status === 400) {
      return true;
    }
    
    // Don't retry on not found errors
    if (error.response?.status === 404) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attempt, baseDelay) {
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Execute method with caching, enhanced error handling, and monitoring
   * @param {string} method - Method name for caching
   * @param {string} ticker - Ticker symbol
   * @param {Function} fetchFunction - Function to fetch data
   * @param {Object} options - Options including cache TTL
   * @returns {Promise<any>} Data result
   */
  async executeWithCache(method, ticker, fetchFunction, options = {}) {
    const cacheKey = this.generateCacheKey(method, ticker, options.params);
    
    // Check if provider is temporarily disabled
    if (!this.isProviderHealthy()) {
      console.warn(`⚠️  Provider ${this.providerName} is unhealthy, attempting cache fallback`);
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData !== null) {
        console.log(`💾 Using cached data due to provider health issues`);
        this.monitor.recordCacheMetrics(this.providerName, 'hit', { fallback: true });
        return cachedData;
      }
      throw new Error(`Provider ${this.providerName} is temporarily unavailable`);
    }
    
    // Try to get from cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData !== null) {
      console.log(`💾 Cache hit for ${this.providerName}:${method}:${ticker}`);
      this.monitor.recordCacheMetrics(this.providerName, 'hit', { method, ticker });
      return cachedData;
    }
    
    console.log(`🌐 Cache miss for ${this.providerName}:${method}:${ticker}, fetching...`);
    this.monitor.recordCacheMetrics(this.providerName, 'miss', { method, ticker });
    
    const context = {
      ticker,
      method,
      params: options.params,
      cacheKey,
      cacheProvider: this,
      attempt: options.attempt || 1
    };
    
    // Start monitoring the request
    const requestTracker = this.monitor.recordRequestStart(this.providerName, method, context);
    
    try {
      const data = await fetchFunction();
      
      // Record successful request
      this.monitor.recordRequestSuccess(requestTracker, data);
      
      // Reset consecutive errors on success
      this.healthStatus.consecutiveErrors = 0;
      this.healthStatus.lastError = null;
      
      // Cache the result if it's valid
      if (data !== null && data !== undefined) {
        const cacheConfig = this.config.getCacheConfig(this.providerName, method);
        this.setInCache(cacheKey, data, options.cacheTtl || cacheConfig.duration);
      }
      
      return data;
    } catch (error) {
      // Record failed request
      this.monitor.recordRequestFailure(requestTracker, error);
      
      // Handle error with comprehensive error handling
      const errorResult = await this.errorHandler.handleError(
        error, 
        this.providerName, 
        method, 
        context
      );
      
      // Update provider health status
      this.updateHealthStatus(errorResult);
      
      // Check if we have fallback data
      if (errorResult.fallbackData) {
        console.log(`🔄 Using fallback data for ${this.providerName}:${method}:${ticker}`);
        return errorResult.fallbackData;
      }
      
      // If error is retryable and we haven't exceeded max attempts
      if (errorResult.shouldRetry && context.attempt < 3) {
        console.log(`🔄 Retrying ${this.providerName}:${method}:${ticker} (attempt ${context.attempt + 1})`);
        
        if (errorResult.recoveryResult.nextRetryDelay) {
          await this.sleep(errorResult.recoveryResult.nextRetryDelay);
        }
        
        return this.executeWithCache(method, ticker, fetchFunction, {
          ...options,
          attempt: context.attempt + 1
        });
      }
      
      // Re-throw the original error if no recovery was possible
      throw error;
    }
  }

  /**
   * Check if provider is healthy and available
   * @returns {boolean} True if provider is healthy
   */
  isProviderHealthy() {
    // Check if provider is temporarily disabled
    if (this.healthStatus.disabledUntil && Date.now() < this.healthStatus.disabledUntil) {
      return false;
    }
    
    // Re-enable provider if disable period has passed
    if (this.healthStatus.disabledUntil && Date.now() >= this.healthStatus.disabledUntil) {
      this.healthStatus.isEnabled = true;
      this.healthStatus.disabledUntil = null;
      this.healthStatus.consecutiveErrors = 0;
      console.log(`✅ Provider ${this.providerName} re-enabled after temporary disable`);
    }
    
    return this.healthStatus.isEnabled;
  }

  /**
   * Update provider health status based on error result
   * @param {Object} errorResult - Error handling result
   */
  updateHealthStatus(errorResult) {
    this.healthStatus.lastError = errorResult.error;
    this.healthStatus.consecutiveErrors++;
    
    const { classification } = errorResult.error;
    
    // Disable provider for critical authentication errors
    if (classification.category === 'auth' && classification.severity === 'critical') {
      this.healthStatus.isEnabled = false;
      console.error(`🚨 Provider ${this.providerName} disabled due to critical authentication error`);
    }
    
    // Temporarily disable provider for too many consecutive errors
    if (this.healthStatus.consecutiveErrors >= 5) {
      const disableDuration = Math.min(300000 * Math.pow(2, this.healthStatus.consecutiveErrors - 5), 3600000); // Max 1 hour
      this.healthStatus.disabledUntil = Date.now() + disableDuration;
      console.warn(`⏰ Provider ${this.providerName} temporarily disabled for ${Math.round(disableDuration / 1000)}s due to consecutive errors`);
    }
    
    // Update degradation level
    if (this.healthStatus.consecutiveErrors >= 10) {
      this.healthStatus.degradationLevel = 'severe';
    } else if (this.healthStatus.consecutiveErrors >= 3) {
      this.healthStatus.degradationLevel = 'partial';
    } else {
      this.healthStatus.degradationLevel = 'none';
    }
  }

  /**
   * Manually disable provider temporarily
   * @param {number} duration - Duration in milliseconds
   */
  disableTemporarily(duration = 300000) {
    this.healthStatus.disabledUntil = Date.now() + duration;
    console.warn(`⏰ Provider ${this.providerName} manually disabled for ${Math.round(duration / 1000)}s`);
  }

  /**
   * Reset provider health status
   */
  resetHealthStatus() {
    this.healthStatus = {
      isEnabled: true,
      lastError: null,
      consecutiveErrors: 0,
      disabledUntil: null,
      degradationLevel: 'none'
    };
    console.log(`✅ Provider ${this.providerName} health status reset`);
  }

  /**
   * Get provider statistics including health, error information, and monitoring data
   * @returns {Object} Provider statistics
   */
  getStats() {
    const cacheHitRate = this.cacheStats.hits + this.cacheStats.misses > 0 ?
      (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1) + '%' :
      '0%';
    
    const successRate = this.requestStats.total > 0 ?
      (this.requestStats.successful / this.requestStats.total * 100).toFixed(1) + '%' :
      '0%';
    
    // Get monitoring data for this provider
    const monitoringReport = this.monitor.getMetricsReport();
    const providerMonitoringData = monitoringReport.providers[this.providerName] || {};
    
    return {
      provider: this.providerName,
      health: {
        isHealthy: this.isProviderHealthy(),
        isEnabled: this.healthStatus.isEnabled,
        consecutiveErrors: this.healthStatus.consecutiveErrors,
        degradationLevel: this.healthStatus.degradationLevel,
        disabledUntil: this.healthStatus.disabledUntil ? new Date(this.healthStatus.disabledUntil).toISOString() : null,
        lastError: this.healthStatus.lastError ? {
          timestamp: this.healthStatus.lastError.timestamp,
          category: this.healthStatus.lastError.classification.category,
          severity: this.healthStatus.lastError.classification.severity,
          message: this.healthStatus.lastError.originalError.message
        } : null
      },
      requests: this.requestStats,
      cache: {
        ...this.cacheStats,
        hitRate: cacheHitRate,
        size: this.cache.size
      },
      rateLimiting: {
        currentTokens: Math.floor(this.rateLimiter.tokens),
        maxTokens: this.rateLimiter.maxTokens
      },
      successRate,
      errors: this.errorHandler.getErrorStats(),
      monitoring: providerMonitoringData
    };
  }

  /**
   * Get monitoring instance
   * @returns {ProviderMonitor} Monitoring instance
   */
  getMonitor() {
    return this.monitor;
  }

  /**
   * Get error handler instance
   * @returns {ErrorHandler} Error handler instance
   */
  getErrorHandler() {
    return this.errorHandler;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
    }
    this.cache.clear();
    
    // Reset error statistics
    if (this.errorHandler) {
      this.errorHandler.resetStats();
    }
    
    // Reset health status
    this.resetHealthStatus();
  }

  /**
   * Get provider name
   * @returns {string} Provider name
   */
  getProviderName() {
    return this.providerName;
  }
}

module.exports = BaseProvider;