/**
 * Provider Monitor Tests
 * 
 * Tests for the comprehensive monitoring and logging system including
 * performance metrics, API usage tracking, error rates, and alerting.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const ProviderMonitor = require('../ProviderMonitor');

describe('ProviderMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new ProviderMonitor();
    // Stop automatic monitoring for tests
    monitor.stopMonitoring();
  });

  afterEach(() => {
    monitor.cleanup();
  });

  describe('Request Tracking', () => {
    test('should record request start correctly', () => {
      const tracker = monitor.recordRequestStart('yahoo', 'getStockPrice', { ticker: 'AAPL' });

      expect(tracker.requestId).toBeDefined();
      expect(tracker.provider).toBe('yahoo');
      expect(tracker.operation).toBe('getStockPrice');
      expect(tracker.startTime).toBeDefined();
      expect(tracker.context.ticker).toBe('AAPL');

      const metrics = monitor.getMetricsReport();
      expect(metrics.summary.totalRequests).toBe(1);
      expect(metrics.providers.yahoo.requests.total).toBe(1);
    });

    test('should record successful request completion', () => {
      const tracker = monitor.recordRequestStart('yahoo', 'getStockPrice', { ticker: 'AAPL' });
      
      // Simulate some processing time
      tracker.startTime = Date.now() - 1000; // 1 second ago
      
      monitor.recordRequestSuccess(tracker, { price: 150.00 });

      const metrics = monitor.getMetricsReport();
      expect(metrics.summary.successfulRequests).toBe(1);
      expect(metrics.summary.successRate).toBe('100.0%');
      expect(metrics.providers.yahoo.requests.successful).toBe(1);
      expect(metrics.providers.yahoo.requests.successRate).toBe('100.0%');
    });

    test('should record failed request', () => {
      const tracker = monitor.recordRequestStart('yahoo', 'getStockPrice', { ticker: 'AAPL' });
      const error = new Error('Network error');
      error.category = 'network';
      error.severity = 'medium';

      monitor.recordRequestFailure(tracker, error);

      const metrics = monitor.getMetricsReport();
      expect(metrics.summary.failedRequests).toBe(1);
      expect(metrics.summary.successRate).toBe('0.0%');
      expect(metrics.providers.yahoo.requests.failed).toBe(1);
      expect(metrics.errors.byCategory.network).toBe(1);
    });

    test('should track response times correctly', () => {
      const tracker = monitor.recordRequestStart('yahoo', 'getStockPrice', { ticker: 'AAPL' });
      tracker.startTime = Date.now() - 500; // 500ms ago

      monitor.recordRequestSuccess(tracker, { price: 150.00 });

      const metrics = monitor.getMetricsReport();
      expect(parseInt(metrics.summary.averageResponseTime)).toBeGreaterThan(400);
      expect(parseInt(metrics.summary.averageResponseTime)).toBeLessThan(600);
    });
  });

  describe('API Usage Tracking', () => {
    test('should record API usage correctly', () => {
      monitor.recordApiUsage('newsapi', 'everything', {
        quotaUsed: 50,
        quotaLimit: 1000
      });

      const metrics = monitor.getMetricsReport();
      expect(metrics.apiUsage.byProvider.newsapi.totalRequests).toBe(1);
      expect(metrics.apiUsage.byProvider.newsapi.quotaUsed).toBe(50);
      expect(metrics.apiUsage.byProvider.newsapi.quotaLimit).toBe(1000);
      expect(metrics.apiUsage.byProvider.newsapi.endpoints.everything).toBe(1);
    });

    test('should record rate limit hits', () => {
      monitor.recordRateLimitHit('newsapi', {
        retryAfter: 60,
        currentUsage: 58,
        limit: 60
      });

      const metrics = monitor.getMetricsReport();
      expect(metrics.apiUsage.rateLimitHits.newsapi).toBe(1);
    });

    test('should trigger quota approaching alert', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert');

      monitor.recordApiUsage('newsapi', 'everything', {
        quotaUsed: 950,
        quotaLimit: 1000
      });

      expect(alertSpy).toHaveBeenCalledWith('quota_approaching', expect.objectContaining({
        provider: 'newsapi',
        quotaUsed: 950,
        quotaLimit: 1000,
        usageRatio: 0.95
      }));
    });
  });

  describe('Cache Metrics', () => {
    test('should record cache hits and misses', () => {
      monitor.recordCacheMetrics('yahoo', 'hit', { method: 'getStockPrice' });
      monitor.recordCacheMetrics('yahoo', 'miss', { method: 'getEarningsData' });
      monitor.recordCacheMetrics('yahoo', 'hit', { method: 'getStockPrice' });

      const metrics = monitor.getMetricsReport();
      expect(metrics.summary.cacheHitRate).toBe('66.7%');
      expect(metrics.providers.yahoo.cache.hitRate).toBe('66.7%');
      expect(metrics.providers.yahoo.cache.hits).toBe(2);
      expect(metrics.providers.yahoo.cache.misses).toBe(1);
    });
  });

  describe('Error Tracking', () => {
    test('should track errors by category and severity', () => {
      const error1 = new Error('Network error');
      error1.category = 'network';
      error1.severity = 'medium';

      const error2 = new Error('Auth error');
      error2.category = 'auth';
      error2.severity = 'critical';

      monitor.updateErrorMetrics('yahoo', error1);
      monitor.updateErrorMetrics('newsapi', error2);

      const metrics = monitor.getMetricsReport();
      expect(metrics.errors.byCategory.network).toBe(1);
      expect(metrics.errors.byCategory.auth).toBe(1);
      expect(metrics.errors.bySeverity.medium).toBe(1);
      expect(metrics.errors.bySeverity.critical).toBe(1);
      expect(metrics.errors.recent).toHaveLength(2);
    });

    test('should limit recent errors to 100', () => {
      // Add more than 100 errors
      for (let i = 0; i < 150; i++) {
        const error = new Error(`Error ${i}`);
        error.category = 'test';
        error.severity = 'low';
        monitor.updateErrorMetrics('test', error);
      }

      const metrics = monitor.getMetricsReport();
      expect(metrics.errors.recent).toHaveLength(10); // Limited to 10 in report
      expect(monitor.metrics.errors.recentErrors).toHaveLength(100); // Limited to 100 internally
    });
  });

  describe('Alerting System', () => {
    test('should trigger high error rate alert', () => {
      const alertSpy = jest.spyOn(monitor, 'logAlert').mockImplementation(() => {});

      // Create requests with high error rate
      for (let i = 0; i < 10; i++) {
        const tracker = monitor.recordRequestStart('test', 'operation', {});
        if (i < 5) {
          monitor.recordRequestSuccess(tracker, {});
        } else {
          const error = new Error('Test error');
          error.category = 'network';
          error.severity = 'medium';
          monitor.recordRequestFailure(tracker, error);
        }
      }

      monitor.checkErrorAlerts('test', new Error('Another error'));

      expect(alertSpy).toHaveBeenCalled();
    });

    test('should trigger slow response alert', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert');

      monitor.checkPerformanceAlerts('yahoo', 'getStockPrice', 15000); // 15 seconds

      expect(alertSpy).toHaveBeenCalledWith('slow_response', expect.objectContaining({
        provider: 'yahoo',
        operation: 'getStockPrice',
        responseTime: 15000,
        threshold: 10000
      }));
    });

    test('should trigger critical error alert', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert');
      const error = new Error('Critical error');
      error.category = 'auth';
      error.severity = 'critical';
      error.operation = 'getStockPrice';

      // Initialize provider metrics first
      monitor.recordRequestStart('yahoo', 'getStockPrice', {});

      monitor.checkErrorAlerts('yahoo', error);

      expect(alertSpy).toHaveBeenCalledWith('critical_error', expect.objectContaining({
        provider: 'yahoo',
        error: expect.objectContaining({
          category: 'auth',
          message: 'Critical error',
          operation: 'getStockPrice'
        })
      }));
    });

    test('should prevent alert spam with cooldown', () => {
      const alertSpy = jest.spyOn(monitor, 'logAlert').mockImplementation(() => {});

      // Trigger same alert multiple times
      monitor.triggerAlert('test_alert', { provider: 'test' });
      monitor.triggerAlert('test_alert', { provider: 'test' });
      monitor.triggerAlert('test_alert', { provider: 'test' });

      // Should only log once due to cooldown
      expect(alertSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Health Monitoring', () => {
    test('should calculate provider health score', () => {
      // Create some requests with mixed results
      for (let i = 0; i < 10; i++) {
        const tracker = monitor.recordRequestStart('test', 'operation', {});
        if (i < 8) {
          monitor.recordRequestSuccess(tracker, {});
        } else {
          const error = new Error('Test error');
          error.category = 'network';
          error.severity = 'medium';
          monitor.recordRequestFailure(tracker, error);
        }
      }

      monitor.checkProviderHealth('test', monitor.metrics.requests.byProvider.test);

      // Health score should be good (80% success rate)
      const metrics = monitor.getMetricsReport();
      expect(metrics.providers.test.requests.successRate).toBe('80.0%');
    });

    test('should trigger provider unhealthy alert', () => {
      const alertSpy = jest.spyOn(monitor, 'triggerAlert');

      // Create requests with very high error rate
      for (let i = 0; i < 10; i++) {
        const tracker = monitor.recordRequestStart('test', 'operation', {});
        const error = new Error('Test error');
        error.category = 'network';
        error.severity = 'medium';
        monitor.recordRequestFailure(tracker, error);
      }

      monitor.checkProviderHealth('test', monitor.metrics.requests.byProvider.test);

      expect(alertSpy).toHaveBeenCalledWith('provider_unhealthy', expect.objectContaining({
        provider: 'test',
        errorRate: '100.0'
      }));
    });
  });

  describe('Metrics Reporting', () => {
    test('should generate comprehensive metrics report', () => {
      // Add some test data
      const tracker = monitor.recordRequestStart('yahoo', 'getStockPrice', { ticker: 'AAPL' });
      monitor.recordRequestSuccess(tracker, { price: 150.00 });

      monitor.recordApiUsage('newsapi', 'everything', { quotaUsed: 50, quotaLimit: 1000 });
      monitor.recordCacheMetrics('yahoo', 'hit', {});

      const error = new Error('Test error');
      error.category = 'network';
      error.severity = 'medium';
      monitor.updateErrorMetrics('yahoo', error);

      const report = monitor.getMetricsReport();

      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.providers).toBeDefined();
      expect(report.operations).toBeDefined();
      expect(report.errors).toBeDefined();
      expect(report.alerts).toBeDefined();
      expect(report.apiUsage).toBeDefined();
      expect(report.responseTime).toBeDefined();

      // Check summary data
      expect(report.summary.totalRequests).toBe(1);
      expect(report.summary.successfulRequests).toBe(1);
      expect(report.summary.successRate).toBe('100.0%');
      expect(report.summary.cacheHitRate).toBe('100.0%');
      expect(report.summary.totalErrors).toBe(1);

      // Check provider data
      expect(report.providers.yahoo).toBeDefined();
      expect(report.providers.yahoo.requests.total).toBe(1);
      expect(report.providers.yahoo.requests.successful).toBe(1);
    });

    test('should handle empty metrics gracefully', () => {
      const report = monitor.getMetricsReport();

      expect(report.summary.totalRequests).toBe(0);
      expect(report.summary.successRate).toBe('0%');
      expect(report.summary.cacheHitRate).toBe('0.0%');
      expect(Object.keys(report.providers)).toHaveLength(0);
    });
  });

  describe('Cleanup and Reset', () => {
    test('should reset metrics correctly', () => {
      // Add some data
      const tracker = monitor.recordRequestStart('test', 'operation', {});
      monitor.recordRequestSuccess(tracker, {});

      expect(monitor.metrics.requests.total).toBe(1);

      monitor.resetMetrics();

      expect(monitor.metrics.requests.total).toBe(0);
      expect(monitor.metrics.requests.byProvider).toEqual({});
    });

    test('should cleanup resources correctly', () => {
      const stopSpy = jest.spyOn(monitor, 'stopMonitoring');

      monitor.cleanup();

      expect(stopSpy).toHaveBeenCalled();
      expect(monitor.metrics.requests.total).toBe(0);
      expect(monitor.alertState.activeAlerts.size).toBe(0);
    });
  });

  describe('ID Generation', () => {
    test('should generate unique request IDs', () => {
      const id1 = monitor.generateRequestId();
      const id2 = monitor.generateRequestId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    test('should generate unique alert IDs', () => {
      const id1 = monitor.generateAlertId();
      const id2 = monitor.generateAlertId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^alert_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^alert_\d+_[a-z0-9]+$/);
    });
  });
});