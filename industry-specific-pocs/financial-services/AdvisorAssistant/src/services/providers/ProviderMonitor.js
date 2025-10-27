/**
 * Provider Monitor
 * 
 * Comprehensive monitoring and logging system for data providers.
 * Tracks performance metrics, API usage, error rates, response times,
 * and provides alerting capabilities.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

class ProviderMonitor {
  constructor() {
    // Performance metrics
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byProvider: {},
        byOperation: {},
        byHour: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0,
        byProvider: {},
        byOperation: {}
      },
      apiUsage: {
        byProvider: {},
        quotaUsage: {},
        rateLimitHits: {}
      },
      errors: {
        total: 0,
        byCategory: {},
        bySeverity: {},
        byProvider: {},
        recentErrors: []
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        byProvider: {}
      }
    };

    // Alert thresholds
    this.alertThresholds = {
      errorRate: 0.1, // 10% error rate
      responseTime: 10000, // 10 seconds
      consecutiveErrors: 5,
      rateLimitApproaching: 0.8, // 80% of rate limit
      quotaApproaching: 0.9, // 90% of quota
      providerDowntime: 300000 // 5 minutes
    };

    // Alert state tracking
    this.alertState = {
      activeAlerts: new Map(),
      alertHistory: [],
      lastAlertCheck: Date.now()
    };

    // Monitoring intervals
    this.monitoringInterval = null;
    this.metricsResetInterval = null;

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start monitoring processes
   */
  startMonitoring() {
    // Check alerts every minute
    this.monitoringInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);

    // Reset hourly metrics every hour
    this.metricsResetInterval = setInterval(() => {
      this.resetHourlyMetrics();
    }, 3600000);

    console.log('📊 Provider monitoring started');
  }

  /**
   * Record a request start
   * @param {string} provider - Provider name
   * @param {string} operation - Operation name
   * @param {Object} context - Request context
   * @returns {Object} Request tracking object
   */
  recordRequestStart(provider, operation, context = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    // Initialize provider metrics if needed
    this.initializeProviderMetrics(provider);
    
    // Update request counts
    this.metrics.requests.total++;
    this.metrics.requests.byProvider[provider].total++;
    
    if (!this.metrics.requests.byOperation[operation]) {
      this.metrics.requests.byOperation[operation] = { total: 0, successful: 0, failed: 0 };
    }
    this.metrics.requests.byOperation[operation].total++;
    
    // Track hourly requests
    const hour = new Date().getHours();
    if (!this.metrics.requests.byHour[hour]) {
      this.metrics.requests.byHour[hour] = 0;
    }
    this.metrics.requests.byHour[hour]++;

    // Log request start
    console.log(`🚀 [${requestId}] ${provider.toUpperCase()}: Starting ${operation}${context.ticker ? ` for ${context.ticker}` : ''}`);

    return {
      requestId,
      provider,
      operation,
      startTime,
      context
    };
  }

  /**
   * Record a successful request completion
   * @param {Object} requestTracker - Request tracking object
   * @param {any} result - Request result
   */
  recordRequestSuccess(requestTracker, result) {
    const { requestId, provider, operation, startTime } = requestTracker;
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Update success counts
    this.metrics.requests.successful++;
    this.metrics.requests.byProvider[provider].successful++;
    this.metrics.requests.byOperation[operation].successful++;

    // Update response time metrics
    this.updateResponseTimeMetrics(provider, operation, responseTime);

    // Log successful completion
    console.log(`✅ [${requestId}] ${provider.toUpperCase()}: Completed ${operation} in ${responseTime}ms`);

    // Check for performance alerts
    this.checkPerformanceAlerts(provider, operation, responseTime);
  }

  /**
   * Record a failed request
   * @param {Object} requestTracker - Request tracking object
   * @param {Error} error - Error that occurred
   */
  recordRequestFailure(requestTracker, error) {
    const { requestId, provider, operation, startTime } = requestTracker;
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Update failure counts
    this.metrics.requests.failed++;
    this.metrics.requests.byProvider[provider].failed++;
    this.metrics.requests.byOperation[operation].failed++;

    // Update error metrics
    this.updateErrorMetrics(provider, error);

    // Update response time metrics (even for failures)
    this.updateResponseTimeMetrics(provider, operation, responseTime);

    // Log failure
    const errorCategory = error.category || 'unknown';
    const errorSeverity = error.severity || 'medium';
    console.error(`❌ [${requestId}] ${provider.toUpperCase()}: Failed ${operation} in ${responseTime}ms - ${errorCategory}/${errorSeverity}: ${error.message}`);

    // Check for error alerts
    this.checkErrorAlerts(provider, error);
  }

  /**
   * Record API usage
   * @param {string} provider - Provider name
   * @param {string} endpoint - API endpoint
   * @param {Object} usage - Usage information
   */
  recordApiUsage(provider, endpoint, usage = {}) {
    this.initializeProviderMetrics(provider);

    if (!this.metrics.apiUsage.byProvider[provider]) {
      this.metrics.apiUsage.byProvider[provider] = {
        totalRequests: 0,
        endpoints: {},
        quotaUsed: 0,
        quotaLimit: 0,
        rateLimitHits: 0
      };
    }

    const providerUsage = this.metrics.apiUsage.byProvider[provider];
    providerUsage.totalRequests++;

    if (!providerUsage.endpoints[endpoint]) {
      providerUsage.endpoints[endpoint] = 0;
    }
    providerUsage.endpoints[endpoint]++;

    // Update quota information if provided
    if (usage.quotaUsed !== undefined) {
      providerUsage.quotaUsed = usage.quotaUsed;
    }
    if (usage.quotaLimit !== undefined) {
      providerUsage.quotaLimit = usage.quotaLimit;
    }

    // Check for quota alerts
    if (providerUsage.quotaLimit > 0) {
      const quotaUsageRatio = providerUsage.quotaUsed / providerUsage.quotaLimit;
      if (quotaUsageRatio >= this.alertThresholds.quotaApproaching) {
        this.triggerAlert('quota_approaching', {
          provider,
          quotaUsed: providerUsage.quotaUsed,
          quotaLimit: providerUsage.quotaLimit,
          usageRatio: quotaUsageRatio
        });
      }
    }
  }

  /**
   * Record rate limit hit
   * @param {string} provider - Provider name
   * @param {Object} rateLimitInfo - Rate limit information
   */
  recordRateLimitHit(provider, rateLimitInfo = {}) {
    this.initializeProviderMetrics(provider);

    if (!this.metrics.apiUsage.rateLimitHits[provider]) {
      this.metrics.apiUsage.rateLimitHits[provider] = 0;
    }
    this.metrics.apiUsage.rateLimitHits[provider]++;

    // Update provider-specific rate limit hits
    if (this.metrics.apiUsage.byProvider[provider]) {
      this.metrics.apiUsage.byProvider[provider].rateLimitHits++;
    }

    // Log rate limit hit
    console.warn(`⏱️  Rate limit hit for ${provider.toUpperCase()}${rateLimitInfo.retryAfter ? ` - retry after ${rateLimitInfo.retryAfter}s` : ''}`);

    // Trigger rate limit alert
    this.triggerAlert('rate_limit_hit', {
      provider,
      retryAfter: rateLimitInfo.retryAfter,
      currentUsage: rateLimitInfo.currentUsage,
      limit: rateLimitInfo.limit
    });
  }

  /**
   * Record cache metrics
   * @param {string} provider - Provider name
   * @param {string} operation - Cache operation (hit/miss)
   * @param {Object} cacheInfo - Cache information
   */
  recordCacheMetrics(provider, operation, cacheInfo = {}) {
    this.initializeProviderMetrics(provider);

    if (operation === 'hit') {
      this.metrics.cache.hits++;
      this.metrics.cache.byProvider[provider].hits++;
    } else if (operation === 'miss') {
      this.metrics.cache.misses++;
      this.metrics.cache.byProvider[provider].misses++;
    }

    // Update overall hit rate
    const totalCacheOps = this.metrics.cache.hits + this.metrics.cache.misses;
    if (totalCacheOps > 0) {
      this.metrics.cache.hitRate = (this.metrics.cache.hits / totalCacheOps) * 100;
    }

    // Update provider-specific hit rate
    const providerCache = this.metrics.cache.byProvider[provider];
    const providerTotal = providerCache.hits + providerCache.misses;
    if (providerTotal > 0) {
      providerCache.hitRate = (providerCache.hits / providerTotal) * 100;
    }
  }

  /**
   * Initialize provider metrics if not exists
   * @param {string} provider - Provider name
   */
  initializeProviderMetrics(provider) {
    if (!this.metrics.requests.byProvider[provider]) {
      this.metrics.requests.byProvider[provider] = {
        total: 0,
        successful: 0,
        failed: 0
      };
    }

    if (!this.metrics.responseTime.byProvider[provider]) {
      this.metrics.responseTime.byProvider[provider] = {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      };
    }

    if (!this.metrics.errors.byProvider[provider]) {
      this.metrics.errors.byProvider[provider] = 0;
    }

    if (!this.metrics.cache.byProvider[provider]) {
      this.metrics.cache.byProvider[provider] = {
        hits: 0,
        misses: 0,
        hitRate: 0
      };
    }
  }

  /**
   * Update response time metrics
   * @param {string} provider - Provider name
   * @param {string} operation - Operation name
   * @param {number} responseTime - Response time in milliseconds
   */
  updateResponseTimeMetrics(provider, operation, responseTime) {
    // Update overall response time metrics
    this.metrics.responseTime.total += responseTime;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.average = this.metrics.responseTime.total / this.metrics.responseTime.count;
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime);
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime);

    // Update provider-specific response time metrics
    const providerMetrics = this.metrics.responseTime.byProvider[provider];
    providerMetrics.total += responseTime;
    providerMetrics.count++;
    providerMetrics.average = providerMetrics.total / providerMetrics.count;
    providerMetrics.min = Math.min(providerMetrics.min, responseTime);
    providerMetrics.max = Math.max(providerMetrics.max, responseTime);

    // Update operation-specific response time metrics
    if (!this.metrics.responseTime.byOperation[operation]) {
      this.metrics.responseTime.byOperation[operation] = {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      };
    }
    const operationMetrics = this.metrics.responseTime.byOperation[operation];
    operationMetrics.total += responseTime;
    operationMetrics.count++;
    operationMetrics.average = operationMetrics.total / operationMetrics.count;
    operationMetrics.min = Math.min(operationMetrics.min, responseTime);
    operationMetrics.max = Math.max(operationMetrics.max, responseTime);
  }

  /**
   * Update error metrics
   * @param {string} provider - Provider name
   * @param {Error} error - Error that occurred
   */
  updateErrorMetrics(provider, error) {
    this.metrics.errors.total++;
    this.metrics.errors.byProvider[provider]++;

    const category = error.category || 'unknown';
    const severity = error.severity || 'medium';

    if (!this.metrics.errors.byCategory[category]) {
      this.metrics.errors.byCategory[category] = 0;
    }
    this.metrics.errors.byCategory[category]++;

    if (!this.metrics.errors.bySeverity[severity]) {
      this.metrics.errors.bySeverity[severity] = 0;
    }
    this.metrics.errors.bySeverity[severity]++;

    // Add to recent errors (keep last 100)
    this.metrics.errors.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      provider,
      category,
      severity,
      message: error.message,
      operation: error.operation || 'unknown'
    });

    if (this.metrics.errors.recentErrors.length > 100) {
      this.metrics.errors.recentErrors = this.metrics.errors.recentErrors.slice(0, 100);
    }
  }

  /**
   * Check for performance alerts
   * @param {string} provider - Provider name
   * @param {string} operation - Operation name
   * @param {number} responseTime - Response time in milliseconds
   */
  checkPerformanceAlerts(provider, operation, responseTime) {
    if (responseTime > this.alertThresholds.responseTime) {
      this.triggerAlert('slow_response', {
        provider,
        operation,
        responseTime,
        threshold: this.alertThresholds.responseTime
      });
    }
  }

  /**
   * Check for error alerts
   * @param {string} provider - Provider name
   * @param {Error} error - Error that occurred
   */
  checkErrorAlerts(provider, error) {
    const providerMetrics = this.metrics.requests.byProvider[provider];
    const errorRate = providerMetrics.total > 0 ? providerMetrics.failed / providerMetrics.total : 0;

    // Check error rate threshold
    if (errorRate >= this.alertThresholds.errorRate && providerMetrics.total >= 10) {
      this.triggerAlert('high_error_rate', {
        provider,
        errorRate: (errorRate * 100).toFixed(1),
        threshold: (this.alertThresholds.errorRate * 100).toFixed(1),
        totalRequests: providerMetrics.total,
        failedRequests: providerMetrics.failed
      });
    }

    // Check for critical errors
    if (error.severity === 'critical') {
      this.triggerAlert('critical_error', {
        provider,
        error: {
          category: error.category,
          message: error.message,
          operation: error.operation
        }
      });
    }
  }

  /**
   * Check all alert conditions
   */
  checkAlerts() {
    const now = Date.now();
    
    // Check provider health
    for (const [provider, metrics] of Object.entries(this.metrics.requests.byProvider)) {
      this.checkProviderHealth(provider, metrics);
    }

    // Check overall system health
    this.checkSystemHealth();

    this.alertState.lastAlertCheck = now;
  }

  /**
   * Check individual provider health
   * @param {string} provider - Provider name
   * @param {Object} metrics - Provider metrics
   */
  checkProviderHealth(provider, metrics) {
    const errorRate = metrics.total > 0 ? metrics.failed / metrics.total : 0;
    const responseTimeMetrics = this.metrics.responseTime.byProvider[provider];
    
    // Calculate health score (0-100)
    let healthScore = 100;
    
    // Deduct for error rate
    healthScore -= errorRate * 50;
    
    // Deduct for slow response times
    if (responseTimeMetrics.average > this.alertThresholds.responseTime) {
      healthScore -= 20;
    }
    
    // Deduct for recent errors
    const recentErrors = this.metrics.errors.recentErrors
      .filter(error => error.provider === provider)
      .filter(error => Date.now() - new Date(error.timestamp).getTime() < 3600000); // Last hour
    
    healthScore -= recentErrors.length * 5;
    
    healthScore = Math.max(0, healthScore);
    
    // Trigger alert if health is poor
    if (healthScore < 50) {
      this.triggerAlert('provider_unhealthy', {
        provider,
        healthScore: healthScore.toFixed(1),
        errorRate: (errorRate * 100).toFixed(1),
        averageResponseTime: responseTimeMetrics.average.toFixed(0),
        recentErrors: recentErrors.length
      });
    }
  }

  /**
   * Check overall system health
   */
  checkSystemHealth() {
    const totalRequests = this.metrics.requests.total;
    const totalErrors = this.metrics.requests.failed;
    const overallErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    if (overallErrorRate >= this.alertThresholds.errorRate && totalRequests >= 50) {
      this.triggerAlert('system_high_error_rate', {
        errorRate: (overallErrorRate * 100).toFixed(1),
        threshold: (this.alertThresholds.errorRate * 100).toFixed(1),
        totalRequests,
        totalErrors
      });
    }
  }

  /**
   * Trigger an alert
   * @param {string} alertType - Type of alert
   * @param {Object} alertData - Alert data
   */
  triggerAlert(alertType, alertData) {
    const alertKey = `${alertType}_${alertData.provider || 'system'}`;
    const now = Date.now();
    
    // Check if this alert is already active (prevent spam)
    const existingAlert = this.alertState.activeAlerts.get(alertKey);
    if (existingAlert && now - existingAlert.lastTriggered < 300000) { // 5 minutes cooldown
      return;
    }

    const alert = {
      id: this.generateAlertId(),
      type: alertType,
      timestamp: new Date().toISOString(),
      data: alertData,
      lastTriggered: now
    };

    // Add to active alerts
    this.alertState.activeAlerts.set(alertKey, alert);

    // Add to alert history
    this.alertState.alertHistory.unshift(alert);
    if (this.alertState.alertHistory.length > 1000) {
      this.alertState.alertHistory = this.alertState.alertHistory.slice(0, 1000);
    }

    // Log the alert
    this.logAlert(alert);

    // In a real implementation, this would send notifications
    // (email, Slack, PagerDuty, etc.)
  }

  /**
   * Log an alert
   * @param {Object} alert - Alert object
   */
  logAlert(alert) {
    const { type, data } = alert;
    
    switch (type) {
      case 'high_error_rate':
        console.error(`🚨 ALERT: High error rate for ${data.provider} - ${data.errorRate}% (threshold: ${data.threshold}%)`);
        break;
        
      case 'slow_response':
        console.warn(`⏰ ALERT: Slow response from ${data.provider} - ${data.responseTime}ms for ${data.operation} (threshold: ${data.threshold}ms)`);
        break;
        
      case 'critical_error':
        console.error(`🚨 ALERT: Critical error in ${data.provider} - ${data.error.category}: ${data.error.message}`);
        break;
        
      case 'rate_limit_hit':
        console.warn(`⏱️  ALERT: Rate limit hit for ${data.provider}${data.retryAfter ? ` - retry after ${data.retryAfter}s` : ''}`);
        break;
        
      case 'quota_approaching':
        console.warn(`📊 ALERT: Quota approaching for ${data.provider} - ${data.quotaUsed}/${data.quotaLimit} (${(data.usageRatio * 100).toFixed(1)}%)`);
        break;
        
      case 'provider_unhealthy':
        console.error(`🏥 ALERT: Provider ${data.provider} is unhealthy - Health score: ${data.healthScore}%`);
        break;
        
      case 'system_high_error_rate':
        console.error(`🚨 ALERT: System-wide high error rate - ${data.errorRate}% (threshold: ${data.threshold}%)`);
        break;
        
      default:
        console.warn(`⚠️  ALERT: ${type} - ${JSON.stringify(data)}`);
    }
  }

  /**
   * Generate unique request ID
   * @returns {string} Unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   * @returns {string} Unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Reset hourly metrics
   */
  resetHourlyMetrics() {
    const currentHour = new Date().getHours();
    console.log(`📊 Resetting hourly metrics for hour ${currentHour}`);
    
    // Keep only current hour data
    this.metrics.requests.byHour = {
      [currentHour]: this.metrics.requests.byHour[currentHour] || 0
    };
  }

  /**
   * Get comprehensive metrics report
   * @returns {Object} Metrics report
   */
  getMetricsReport() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    // Calculate recent error rates
    const recentErrors = this.metrics.errors.recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneHourAgo
    );

    const dailyErrors = this.metrics.errors.recentErrors.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    );

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: this.metrics.requests.total,
        successfulRequests: this.metrics.requests.successful,
        failedRequests: this.metrics.requests.failed,
        successRate: this.metrics.requests.total > 0 ? 
          ((this.metrics.requests.successful / this.metrics.requests.total) * 100).toFixed(1) + '%' : '0%',
        averageResponseTime: this.metrics.responseTime.average.toFixed(0) + 'ms',
        cacheHitRate: this.metrics.cache.hitRate.toFixed(1) + '%',
        totalErrors: this.metrics.errors.total,
        recentErrors: recentErrors.length,
        dailyErrors: dailyErrors.length
      },
      providers: this.getProviderMetrics(),
      operations: this.getOperationMetrics(),
      errors: {
        byCategory: this.metrics.errors.byCategory,
        bySeverity: this.metrics.errors.bySeverity,
        recent: recentErrors.slice(0, 10) // Last 10 errors
      },
      alerts: {
        active: Array.from(this.alertState.activeAlerts.values()),
        recent: this.alertState.alertHistory.slice(0, 20) // Last 20 alerts
      },
      apiUsage: this.metrics.apiUsage,
      responseTime: {
        overall: this.metrics.responseTime,
        byProvider: this.metrics.responseTime.byProvider,
        byOperation: this.metrics.responseTime.byOperation
      }
    };
  }

  /**
   * Get provider-specific metrics
   * @returns {Object} Provider metrics
   */
  getProviderMetrics() {
    const providerMetrics = {};
    
    for (const [provider, requests] of Object.entries(this.metrics.requests.byProvider)) {
      const responseTime = this.metrics.responseTime.byProvider[provider];
      const cache = this.metrics.cache.byProvider[provider];
      const errors = this.metrics.errors.byProvider[provider] || 0;
      
      providerMetrics[provider] = {
        requests: {
          total: requests.total,
          successful: requests.successful,
          failed: requests.failed,
          successRate: requests.total > 0 ? 
            ((requests.successful / requests.total) * 100).toFixed(1) + '%' : '0%'
        },
        responseTime: {
          average: responseTime.average.toFixed(0) + 'ms',
          min: responseTime.min === Infinity ? 0 : responseTime.min,
          max: responseTime.max
        },
        cache: {
          hitRate: cache.hitRate.toFixed(1) + '%',
          hits: cache.hits,
          misses: cache.misses
        },
        errors: errors,
        apiUsage: this.metrics.apiUsage.byProvider[provider] || {}
      };
    }
    
    return providerMetrics;
  }

  /**
   * Get operation-specific metrics
   * @returns {Object} Operation metrics
   */
  getOperationMetrics() {
    const operationMetrics = {};
    
    for (const [operation, requests] of Object.entries(this.metrics.requests.byOperation)) {
      const responseTime = this.metrics.responseTime.byOperation[operation];
      
      operationMetrics[operation] = {
        requests: {
          total: requests.total,
          successful: requests.successful,
          failed: requests.failed,
          successRate: requests.total > 0 ? 
            ((requests.successful / requests.total) * 100).toFixed(1) + '%' : '0%'
        },
        responseTime: responseTime ? {
          average: responseTime.average.toFixed(0) + 'ms',
          min: responseTime.min === Infinity ? 0 : responseTime.min,
          max: responseTime.max
        } : null
      };
    }
    
    return operationMetrics;
  }

  /**
   * Clear alert
   * @param {string} alertKey - Alert key to clear
   */
  clearAlert(alertKey) {
    this.alertState.activeAlerts.delete(alertKey);
    console.log(`✅ Alert cleared: ${alertKey}`);
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byProvider: {},
        byOperation: {},
        byHour: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0,
        byProvider: {},
        byOperation: {}
      },
      apiUsage: {
        byProvider: {},
        quotaUsage: {},
        rateLimitHits: {}
      },
      errors: {
        total: 0,
        byCategory: {},
        bySeverity: {},
        byProvider: {},
        recentErrors: []
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
        byProvider: {}
      }
    };
    
    console.log('📊 All metrics reset');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.metricsResetInterval) {
      clearInterval(this.metricsResetInterval);
      this.metricsResetInterval = null;
    }
    
    console.log('📊 Provider monitoring stopped');
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring();
    this.resetMetrics();
    this.alertState.activeAlerts.clear();
    this.alertState.alertHistory = [];
  }
}

module.exports = ProviderMonitor;