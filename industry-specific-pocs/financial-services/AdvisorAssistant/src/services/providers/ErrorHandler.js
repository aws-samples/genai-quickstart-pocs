/**
 * Error Handler for Data Providers
 * 
 * Provides comprehensive error handling, categorization, and graceful degradation
 * for all data provider operations. Implements specific error handling strategies
 * for different types of failures.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

class ErrorHandler {
  constructor() {
    // Error categories for classification
    this.errorCategories = {
      NETWORK: 'network',
      AUTH: 'auth', 
      RATE_LIMIT: 'rate_limit',
      DATA: 'data',
      TIMEOUT: 'timeout',
      QUOTA: 'quota',
      VALIDATION: 'validation',
      PROVIDER: 'provider',
      UNKNOWN: 'unknown'
    };

    // Error severity levels
    this.severityLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };

    // Provider-specific error patterns
    this.providerErrorPatterns = {
      yahoo: {
        patterns: [
          { regex: /python.*not found/i, category: 'provider', severity: 'critical' },
          { regex: /yfinance.*error/i, category: 'provider', severity: 'high' },
          { regex: /no data found/i, category: 'data', severity: 'medium' },
          { regex: /timeout/i, category: 'timeout', severity: 'medium' },
          { regex: /rate.*limit.*exceeded/i, category: 'rate_limit', severity: 'high' },
          { regex: /forbidden/i, category: 'auth', severity: 'high' },
          { regex: /quota.*exceeded/i, category: 'quota', severity: 'high' }
        ]
      },
      newsapi: {
        patterns: [
          { regex: /daily.*quota.*exceeded/i, category: 'quota', severity: 'high' },
          { regex: /api.*key.*invalid/i, category: 'auth', severity: 'critical' },
          { regex: /rate.*limit/i, category: 'rate_limit', severity: 'medium' },
          { regex: /no.*articles.*found/i, category: 'data', severity: 'low' }
        ]
      },
      fred: {
        patterns: [
          { regex: /api.*key.*required/i, category: 'auth', severity: 'medium' },
          { regex: /series.*not.*found/i, category: 'data', severity: 'medium' },
          { regex: /bad.*request/i, category: 'validation', severity: 'medium' }
        ]
      }
    };

    // Recovery strategies for different error types
    this.recoveryStrategies = {
      network: ['retry_with_backoff', 'use_cache', 'fallback_provider'],
      auth: ['log_error', 'disable_provider', 'notify_admin'],
      rate_limit: ['exponential_backoff', 'queue_request', 'use_cache'],
      data: ['return_partial', 'use_cache', 'log_warning'],
      timeout: ['retry_with_longer_timeout', 'use_cache'],
      quota: ['queue_until_reset', 'use_cache', 'fallback_provider'],
      validation: ['sanitize_input', 'log_error'],
      provider: ['fallback_provider', 'disable_temporarily'],
      unknown: ['retry_once', 'log_error', 'use_cache']
    };

    // Error statistics
    this.errorStats = {
      total: 0,
      byCategory: {},
      bySeverity: {},
      byProvider: {},
      recentErrors: []
    };

    // Initialize error statistics
    this.initializeErrorStats();
  }

  /**
   * Initialize error statistics tracking
   */
  initializeErrorStats() {
    Object.values(this.errorCategories).forEach(category => {
      this.errorStats.byCategory[category] = 0;
    });

    Object.values(this.severityLevels).forEach(severity => {
      this.errorStats.bySeverity[severity] = 0;
    });
  }

  /**
   * Categorize error based on error message and provider
   * @param {Error} error - The error to categorize
   * @param {string} provider - Provider name
   * @returns {Object} Error classification
   */
  categorizeError(error, provider) {
    const errorMessage = error.message || error.toString();
    const statusCode = error.response?.status;

    // Check HTTP status codes first
    if (statusCode) {
      const httpCategory = this.categorizeHttpError(statusCode);
      if (httpCategory) {
        return {
          category: httpCategory.category,
          severity: httpCategory.severity,
          isRetryable: httpCategory.isRetryable,
          source: 'http_status'
        };
      }
    }

    // Check provider-specific patterns
    if (provider && this.providerErrorPatterns[provider]) {
      const patterns = this.providerErrorPatterns[provider].patterns;
      
      for (const pattern of patterns) {
        if (pattern.regex.test(errorMessage)) {
          return {
            category: pattern.category,
            severity: pattern.severity,
            isRetryable: this.isRetryableError(pattern.category),
            source: 'provider_pattern'
          };
        }
      }
    }

    // Check general error patterns
    const generalCategory = this.categorizeGeneralError(errorMessage);
    return {
      category: generalCategory.category,
      severity: generalCategory.severity,
      isRetryable: generalCategory.isRetryable,
      source: 'general_pattern'
    };
  }

  /**
   * Categorize HTTP status code errors
   * @param {number} statusCode - HTTP status code
   * @returns {Object|null} Error classification or null
   */
  categorizeHttpError(statusCode) {
    const httpErrorMap = {
      400: { category: 'validation', severity: 'medium', isRetryable: false },
      401: { category: 'auth', severity: 'critical', isRetryable: false },
      403: { category: 'auth', severity: 'high', isRetryable: false },
      404: { category: 'data', severity: 'medium', isRetryable: false },
      408: { category: 'timeout', severity: 'medium', isRetryable: true },
      429: { category: 'rate_limit', severity: 'high', isRetryable: true },
      500: { category: 'provider', severity: 'high', isRetryable: true },
      502: { category: 'network', severity: 'medium', isRetryable: true },
      503: { category: 'provider', severity: 'high', isRetryable: true },
      504: { category: 'timeout', severity: 'medium', isRetryable: true }
    };

    return httpErrorMap[statusCode] || null;
  }

  /**
   * Categorize general error patterns
   * @param {string} errorMessage - Error message
   * @returns {Object} Error classification
   */
  categorizeGeneralError(errorMessage) {
    const lowerMessage = errorMessage.toLowerCase();

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('connection') || 
        lowerMessage.includes('econnrefused') || lowerMessage.includes('enotfound')) {
      return { category: 'network', severity: 'medium', isRetryable: true };
    }

    // Timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('etimedout')) {
      return { category: 'timeout', severity: 'medium', isRetryable: true };
    }

    // Authentication errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden') ||
        lowerMessage.includes('api key') || lowerMessage.includes('authentication')) {
      return { category: 'auth', severity: 'high', isRetryable: false };
    }

    // Rate limiting errors
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
      return { category: 'rate_limit', severity: 'high', isRetryable: true };
    }

    // Data errors
    if (lowerMessage.includes('not found') || lowerMessage.includes('no data') ||
        lowerMessage.includes('invalid response') || lowerMessage.includes('parse error')) {
      return { category: 'data', severity: 'medium', isRetryable: false };
    }

    // Validation errors
    if (lowerMessage.includes('invalid') || lowerMessage.includes('validation') ||
        lowerMessage.includes('bad request')) {
      return { category: 'validation', severity: 'medium', isRetryable: false };
    }

    // Default to unknown
    return { category: 'unknown', severity: 'medium', isRetryable: true };
  }

  /**
   * Check if error category is retryable
   * @param {string} category - Error category
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(category) {
    const retryableCategories = ['network', 'timeout', 'rate_limit', 'provider', 'unknown'];
    return retryableCategories.includes(category);
  }

  /**
   * Handle error with appropriate strategy
   * @param {Error} error - The error to handle
   * @param {string} provider - Provider name
   * @param {string} operation - Operation that failed
   * @param {Object} context - Additional context
   * @returns {Object} Error handling result
   */
  async handleError(error, provider, operation, context = {}) {
    // Categorize the error
    const classification = this.categorizeError(error, provider);
    
    // Create enhanced error object
    const enhancedError = this.createEnhancedError(error, provider, operation, classification, context);
    
    // Update statistics
    this.updateErrorStats(enhancedError);
    
    // Log the error
    this.logError(enhancedError);
    
    // Determine recovery strategy
    const recoveryStrategy = this.getRecoveryStrategy(classification.category);
    
    // Execute recovery actions
    const recoveryResult = await this.executeRecoveryStrategy(
      recoveryStrategy, 
      enhancedError, 
      context
    );

    return {
      error: enhancedError,
      classification,
      recoveryStrategy,
      recoveryResult,
      shouldRetry: classification.isRetryable && recoveryResult.canRetry,
      fallbackData: recoveryResult.fallbackData
    };
  }

  /**
   * Create enhanced error object with additional metadata
   * @param {Error} error - Original error
   * @param {string} provider - Provider name
   * @param {string} operation - Operation that failed
   * @param {Object} classification - Error classification
   * @param {Object} context - Additional context
   * @returns {Object} Enhanced error object
   */
  createEnhancedError(error, provider, operation, classification, context) {
    return {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      provider,
      operation,
      originalError: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        statusCode: error.response?.status,
        statusText: error.response?.statusText
      },
      classification,
      context: {
        ticker: context.ticker,
        method: context.method,
        params: context.params,
        attempt: context.attempt || 1,
        ...context
      },
      metadata: {
        userAgent: context.userAgent,
        requestId: context.requestId,
        sessionId: context.sessionId
      }
    };
  }

  /**
   * Generate unique error ID
   * @returns {string} Unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update error statistics
   * @param {Object} enhancedError - Enhanced error object
   */
  updateErrorStats(enhancedError) {
    this.errorStats.total++;
    
    // Update category stats
    const category = enhancedError.classification.category;
    this.errorStats.byCategory[category] = (this.errorStats.byCategory[category] || 0) + 1;
    
    // Update severity stats
    const severity = enhancedError.classification.severity;
    this.errorStats.bySeverity[severity] = (this.errorStats.bySeverity[severity] || 0) + 1;
    
    // Update provider stats
    const provider = enhancedError.provider;
    this.errorStats.byProvider[provider] = (this.errorStats.byProvider[provider] || 0) + 1;
    
    // Add to recent errors (keep last 100)
    this.errorStats.recentErrors.unshift({
      id: enhancedError.id,
      timestamp: enhancedError.timestamp,
      provider: enhancedError.provider,
      operation: enhancedError.operation,
      category: category,
      severity: severity,
      message: enhancedError.originalError.message
    });
    
    if (this.errorStats.recentErrors.length > 100) {
      this.errorStats.recentErrors = this.errorStats.recentErrors.slice(0, 100);
    }
  }

  /**
   * Log error with appropriate level
   * @param {Object} enhancedError - Enhanced error object
   */
  logError(enhancedError) {
    const { classification, provider, operation, originalError, context } = enhancedError;
    
    const logMessage = `❌ ${provider.toUpperCase()} Error [${classification.category}/${classification.severity}] in ${operation}: ${originalError.message}`;
    
    // Log based on severity
    switch (classification.severity) {
      case 'critical':
        console.error(`🚨 CRITICAL: ${logMessage}`);
        try {
          console.error(`   Context: ${JSON.stringify(context, null, 2)}`);
        } catch (jsonError) {
          console.error(`   Context: ${JSON.stringify({
            ticker: context?.ticker,
            attempt: context?.attempt,
            provider: context?.provider,
            operation: context?.operation
          }, null, 2)}`);
        }
        console.error(`   Stack: ${originalError.stack}`);
        break;
        
      case 'high':
        console.error(`🔴 HIGH: ${logMessage}`);
        console.error(`   Context: ticker=${context.ticker}, method=${context.method}, attempt=${context.attempt}`);
        break;
        
      case 'medium':
        console.warn(`🟡 MEDIUM: ${logMessage}`);
        console.warn(`   Context: ticker=${context.ticker}, attempt=${context.attempt}`);
        break;
        
      case 'low':
        console.log(`🟢 LOW: ${logMessage}`);
        break;
        
      default:
        console.error(`❓ UNKNOWN: ${logMessage}`);
    }

    // Additional logging for specific categories
    if (classification.category === 'auth') {
      console.error(`   🔑 Authentication issue detected - check API keys and permissions`);
    } else if (classification.category === 'rate_limit') {
      console.warn(`   ⏱️  Rate limit reached - implementing backoff strategy`);
    } else if (classification.category === 'quota') {
      console.warn(`   📊 Quota exceeded - requests will be queued until reset`);
    }
  }

  /**
   * Get recovery strategy for error category
   * @param {string} category - Error category
   * @returns {Array} Array of recovery actions
   */
  getRecoveryStrategy(category) {
    return this.recoveryStrategies[category] || this.recoveryStrategies.unknown;
  }

  /**
   * Execute recovery strategy
   * @param {Array} strategy - Recovery strategy actions
   * @param {Object} enhancedError - Enhanced error object
   * @param {Object} context - Additional context
   * @returns {Object} Recovery result
   */
  async executeRecoveryStrategy(strategy, enhancedError, context) {
    const result = {
      actionsExecuted: [],
      canRetry: false,
      fallbackData: null,
      nextRetryDelay: null,
      providerDisabled: false
    };

    for (const action of strategy) {
      try {
        const actionResult = await this.executeRecoveryAction(action, enhancedError, context);
        
        result.actionsExecuted.push({
          action,
          success: actionResult.success,
          result: actionResult.result
        });

        // Update result based on action outcome
        if (actionResult.canRetry) result.canRetry = true;
        if (actionResult.fallbackData) result.fallbackData = actionResult.fallbackData;
        if (actionResult.nextRetryDelay) result.nextRetryDelay = actionResult.nextRetryDelay;
        if (actionResult.providerDisabled) result.providerDisabled = true;

        // If we got fallback data, we can stop here
        if (actionResult.fallbackData) {
          break;
        }

      } catch (recoveryError) {
        console.error(`❌ Recovery action '${action}' failed: ${recoveryError.message}`);
        result.actionsExecuted.push({
          action,
          success: false,
          error: recoveryError.message
        });
      }
    }

    return result;
  }

  /**
   * Execute individual recovery action
   * @param {string} action - Recovery action name
   * @param {Object} enhancedError - Enhanced error object
   * @param {Object} context - Additional context
   * @returns {Object} Action result
   */
  async executeRecoveryAction(action, enhancedError, context) {
    const result = {
      success: false,
      canRetry: false,
      fallbackData: null,
      nextRetryDelay: null,
      providerDisabled: false
    };

    switch (action) {
      case 'retry_with_backoff':
        result.canRetry = true;
        result.nextRetryDelay = this.calculateBackoffDelay(context.attempt || 1);
        result.success = true;
        break;

      case 'exponential_backoff':
        result.canRetry = true;
        result.nextRetryDelay = this.calculateExponentialBackoff(context.attempt || 1);
        result.success = true;
        break;

      case 'use_cache':
        if (context.cacheProvider && context.cacheKey) {
          const cachedData = await context.cacheProvider.getFromCache(context.cacheKey);
          if (cachedData) {
            result.fallbackData = cachedData;
            result.success = true;
            console.log(`💾 Using cached data as fallback for ${enhancedError.provider}:${enhancedError.operation}`);
          }
        }
        break;

      case 'fallback_provider':
        if (context.fallbackProvider && typeof context.fallbackProvider === 'function') {
          try {
            result.fallbackData = await context.fallbackProvider();
            result.success = true;
            console.log(`🔄 Using fallback provider for ${enhancedError.operation}`);
          } catch (fallbackError) {
            console.error(`❌ Fallback provider failed: ${fallbackError.message}`);
          }
        }
        break;

      case 'return_partial':
        if (context.partialData) {
          result.fallbackData = context.partialData;
          result.success = true;
          console.log(`📊 Returning partial data for ${enhancedError.provider}:${enhancedError.operation}`);
        }
        break;

      case 'queue_request':
        if (context.requestQueue && typeof context.requestQueue.add === 'function') {
          await context.requestQueue.add(context.originalRequest);
          result.success = true;
          console.log(`📋 Request queued for later execution`);
        }
        break;

      case 'disable_provider':
        result.providerDisabled = true;
        result.success = true;
        console.warn(`⚠️  Provider ${enhancedError.provider} disabled due to ${enhancedError.classification.category} error`);
        break;

      case 'disable_temporarily':
        if (context.providerManager && typeof context.providerManager.disableTemporarily === 'function') {
          await context.providerManager.disableTemporarily(enhancedError.provider, 300000); // 5 minutes
          result.success = true;
          console.warn(`⏰ Provider ${enhancedError.provider} temporarily disabled for 5 minutes`);
        }
        break;

      case 'log_error':
        // Already logged in handleError, just mark as success
        result.success = true;
        break;

      case 'log_warning':
        console.warn(`⚠️  ${enhancedError.provider} warning: ${enhancedError.originalError.message}`);
        result.success = true;
        break;

      case 'notify_admin':
        // In a real implementation, this would send notifications
        console.error(`🚨 ADMIN NOTIFICATION: Critical error in ${enhancedError.provider} - ${enhancedError.originalError.message}`);
        result.success = true;
        break;

      case 'sanitize_input':
        if (context.sanitizeFunction && typeof context.sanitizeFunction === 'function') {
          try {
            const sanitizedInput = context.sanitizeFunction(context.originalInput);
            result.fallbackData = { sanitizedInput };
            result.success = true;
            console.log(`🧹 Input sanitized for retry`);
          } catch (sanitizeError) {
            console.error(`❌ Input sanitization failed: ${sanitizeError.message}`);
          }
        }
        break;

      case 'retry_once':
        if ((context.attempt || 1) === 1) {
          result.canRetry = true;
          result.nextRetryDelay = 1000; // 1 second
          result.success = true;
        }
        break;

      case 'retry_with_longer_timeout':
        result.canRetry = true;
        result.nextRetryDelay = 2000; // 2 seconds
        result.success = true;
        break;

      case 'queue_until_reset':
        if (context.quotaResetTime) {
          const delayUntilReset = new Date(context.quotaResetTime).getTime() - Date.now();
          result.nextRetryDelay = Math.max(delayUntilReset, 60000); // At least 1 minute
          result.canRetry = true;
          result.success = true;
          console.log(`⏳ Request will be retried after quota reset in ${Math.round(result.nextRetryDelay / 1000)}s`);
        }
        break;

      default:
        console.warn(`⚠️  Unknown recovery action: ${action}`);
    }

    return result;
  }

  /**
   * Calculate backoff delay
   * @param {number} attempt - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  calculateBackoffDelay(attempt) {
    // Linear backoff: 1s, 2s, 3s, 4s, 5s (max)
    return Math.min(attempt * 1000, 5000);
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Current attempt number
   * @returns {number} Delay in milliseconds
   */
  calculateExponentialBackoff(attempt) {
    // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s (max)
    const baseDelay = Math.min(Math.pow(2, attempt - 1) * 1000, 16000);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    return Math.floor(baseDelay + jitter);
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    return {
      ...this.errorStats,
      errorRates: this.calculateErrorRates(),
      topErrors: this.getTopErrors(),
      healthScore: this.calculateHealthScore()
    };
  }

  /**
   * Calculate error rates by provider and category
   * @returns {Object} Error rates
   */
  calculateErrorRates() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentErrors = this.errorStats.recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );

    const dailyErrors = this.errorStats.recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    );

    return {
      hourly: recentErrors.length,
      daily: dailyErrors.length,
      byProvider: this.groupErrorsByField(recentErrors, 'provider'),
      byCategory: this.groupErrorsByField(recentErrors, 'category')
    };
  }

  /**
   * Group errors by field
   * @param {Array} errors - Array of errors
   * @param {string} field - Field to group by
   * @returns {Object} Grouped errors
   */
  groupErrorsByField(errors, field) {
    return errors.reduce((groups, error) => {
      const key = error[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Get top errors by frequency
   * @returns {Array} Top errors
   */
  getTopErrors() {
    const errorCounts = {};
    
    this.errorStats.recentErrors.forEach(error => {
      const key = `${error.provider}:${error.category}:${error.message}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => {
        const [provider, category, message] = key.split(':');
        return { provider, category, message, count };
      });
  }

  /**
   * Calculate overall system health score
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errorStats.recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );

    // Base score
    let score = 100;

    // Deduct points for recent errors
    score -= recentErrors.length * 2;

    // Deduct more points for critical/high severity errors
    const criticalErrors = recentErrors.filter(error => error.severity === 'critical').length;
    const highErrors = recentErrors.filter(error => error.severity === 'high').length;
    
    score -= criticalErrors * 10;
    score -= highErrors * 5;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Reset error statistics
   */
  resetStats() {
    this.errorStats = {
      total: 0,
      byCategory: {},
      bySeverity: {},
      byProvider: {},
      recentErrors: []
    };
    
    this.initializeErrorStats();
    console.log('📊 Error statistics reset');
  }

  /**
   * Get graceful degradation strategy for operation
   * @param {string} operation - Operation name
   * @param {string} provider - Provider name
   * @returns {Object} Degradation strategy
   */
  getGracefulDegradationStrategy(operation, provider) {
    const strategies = {
      getStockPrice: {
        essential: true,
        fallbacks: ['cache', 'alternative_provider'],
        partialDataAcceptable: false
      },
      getEarningsData: {
        essential: true,
        fallbacks: ['cache', 'alternative_provider', 'partial_data'],
        partialDataAcceptable: true
      },
      getCompanyInfo: {
        essential: false,
        fallbacks: ['cache', 'basic_info_only'],
        partialDataAcceptable: true
      },
      getMarketNews: {
        essential: false,
        fallbacks: ['cache', 'general_news'],
        partialDataAcceptable: true
      },
      getMacroEconomicData: {
        essential: false,
        fallbacks: ['cache', 'skip_macro_data'],
        partialDataAcceptable: true
      }
    };

    return strategies[operation] || {
      essential: false,
      fallbacks: ['cache'],
      partialDataAcceptable: true
    };
  }
}

module.exports = ErrorHandler;