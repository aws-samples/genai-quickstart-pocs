/**
 * Error Handler Tests
 * 
 * Tests for the comprehensive error handling system including
 * error categorization, recovery strategies, and graceful degradation.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

const ErrorHandler = require('../ErrorHandler');

describe('ErrorHandler', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  afterEach(() => {
    errorHandler.resetStats();
  });

  describe('Error Categorization', () => {
    test('should categorize HTTP 401 as auth error', () => {
      const error = new Error('Unauthorized');
      error.response = { status: 401 };

      const classification = errorHandler.categorizeError(error, 'newsapi');

      expect(classification.category).toBe('auth');
      expect(classification.severity).toBe('critical');
      expect(classification.isRetryable).toBe(false);
    });

    test('should categorize HTTP 429 as rate limit error', () => {
      const error = new Error('Too Many Requests');
      error.response = { status: 429 };

      const classification = errorHandler.categorizeError(error, 'newsapi');

      expect(classification.category).toBe('rate_limit');
      expect(classification.severity).toBe('high');
      expect(classification.isRetryable).toBe(true);
    });

    test('should categorize network errors correctly', () => {
      const error = new Error('ECONNREFUSED');
      error.code = 'ECONNREFUSED';

      const classification = errorHandler.categorizeError(error, 'yahoo');

      expect(classification.category).toBe('network');
      expect(classification.severity).toBe('medium');
      expect(classification.isRetryable).toBe(true);
    });

    test('should categorize provider-specific errors', () => {
      const error = new Error('yfinance module not found');

      const classification = errorHandler.categorizeError(error, 'yahoo');

      expect(classification.category).toBe('data'); // General pattern categorizes as data error
      expect(classification.severity).toBe('medium');
    });

    test('should categorize NewsAPI quota errors', () => {
      const error = new Error('daily quota exceeded');

      const classification = errorHandler.categorizeError(error, 'newsapi');

      expect(classification.category).toBe('quota');
      expect(classification.severity).toBe('high');
    });
  });

  describe('Error Handling', () => {
    test('should handle error and return recovery result', async () => {
      const error = new Error('Test error');
      error.response = { status: 500 };

      const result = await errorHandler.handleError(error, 'test', 'getStockPrice', {
        ticker: 'AAPL'
      });

      expect(result.error).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.recoveryStrategy).toBeDefined();
      expect(result.recoveryResult).toBeDefined();
    });

    test('should update error statistics', async () => {
      const error = new Error('Test error');
      error.response = { status: 500 };

      await errorHandler.handleError(error, 'test', 'getStockPrice', {});

      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(1);
      expect(stats.byProvider.test).toBe(1);
    });

    test('should generate unique error IDs', async () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      const result1 = await errorHandler.handleError(error1, 'test', 'op1', {});
      const result2 = await errorHandler.handleError(error2, 'test', 'op2', {});

      expect(result1.error.id).not.toBe(result2.error.id);
    });
  });

  describe('Recovery Strategies', () => {
    test('should return appropriate recovery strategy for network errors', () => {
      const strategy = errorHandler.getRecoveryStrategy('network');
      
      expect(strategy).toContain('retry_with_backoff');
      expect(strategy).toContain('use_cache');
      expect(strategy).toContain('fallback_provider');
    });

    test('should return appropriate recovery strategy for auth errors', () => {
      const strategy = errorHandler.getRecoveryStrategy('auth');
      
      expect(strategy).toContain('log_error');
      expect(strategy).toContain('disable_provider');
      expect(strategy).toContain('notify_admin');
    });

    test('should calculate backoff delay correctly', () => {
      const delay1 = errorHandler.calculateBackoffDelay(1);
      const delay2 = errorHandler.calculateBackoffDelay(2);
      const delay3 = errorHandler.calculateBackoffDelay(10);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(5000); // Capped at 5 seconds
    });

    test('should calculate exponential backoff correctly', () => {
      const delay1 = errorHandler.calculateExponentialBackoff(1);
      const delay2 = errorHandler.calculateExponentialBackoff(2);
      const delay3 = errorHandler.calculateExponentialBackoff(10);

      expect(delay1).toBeGreaterThanOrEqual(900); // 1s ± jitter
      expect(delay1).toBeLessThanOrEqual(1100);
      expect(delay2).toBeGreaterThanOrEqual(1800); // 2s ± jitter
      expect(delay2).toBeLessThanOrEqual(2200);
      expect(delay3).toBeGreaterThanOrEqual(14400); // Capped at 16 seconds ± jitter (10%)
      expect(delay3).toBeLessThanOrEqual(17600);
    });
  });

  describe('Recovery Actions', () => {
    test('should execute retry_with_backoff action', async () => {
      const enhancedError = {
        provider: 'test',
        operation: 'test',
        classification: { category: 'network' }
      };

      const result = await errorHandler.executeRecoveryAction(
        'retry_with_backoff',
        enhancedError,
        { attempt: 2 }
      );

      expect(result.success).toBe(true);
      expect(result.canRetry).toBe(true);
      expect(result.nextRetryDelay).toBe(2000);
    });

    test('should execute use_cache action with cached data', async () => {
      const mockCacheProvider = {
        getFromCache: jest.fn().mockReturnValue({ data: 'cached' })
      };

      const enhancedError = {
        provider: 'test',
        operation: 'test'
      };

      const result = await errorHandler.executeRecoveryAction(
        'use_cache',
        enhancedError,
        { cacheProvider: mockCacheProvider, cacheKey: 'test-key' }
      );

      expect(result.success).toBe(true);
      expect(result.fallbackData).toEqual({ data: 'cached' });
      expect(mockCacheProvider.getFromCache).toHaveBeenCalledWith('test-key');
    });

    test('should execute fallback_provider action', async () => {
      const mockFallbackProvider = jest.fn().mockResolvedValue({ data: 'fallback' });

      const enhancedError = {
        provider: 'test',
        operation: 'test'
      };

      const result = await errorHandler.executeRecoveryAction(
        'fallback_provider',
        enhancedError,
        { fallbackProvider: mockFallbackProvider }
      );

      expect(result.success).toBe(true);
      expect(result.fallbackData).toEqual({ data: 'fallback' });
      expect(mockFallbackProvider).toHaveBeenCalled();
    });
  });

  describe('Error Statistics', () => {
    test('should track error statistics correctly', async () => {
      // Generate some test errors
      await errorHandler.handleError(new Error('Network error'), 'provider1', 'op1', {});
      await errorHandler.handleError(new Error('Auth error'), 'provider2', 'op2', {});
      
      const error3 = new Error('Rate limit');
      error3.response = { status: 429 };
      await errorHandler.handleError(error3, 'provider1', 'op1', {});

      const stats = errorHandler.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byProvider.provider1).toBe(2);
      expect(stats.byProvider.provider2).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    test('should calculate error rates correctly', async () => {
      // Generate errors within the last hour
      for (let i = 0; i < 5; i++) {
        await errorHandler.handleError(new Error(`Error ${i}`), 'test', 'op', {});
      }

      const stats = errorHandler.getErrorStats();
      expect(stats.errorRates.hourly).toBe(5);
      expect(stats.errorRates.daily).toBe(5);
    });

    test('should calculate health score correctly', async () => {
      const stats1 = errorHandler.getErrorStats();
      expect(stats1.healthScore).toBe(100); // No errors

      // Add some errors
      await errorHandler.handleError(new Error('Error 1'), 'test', 'op', {});
      await errorHandler.handleError(new Error('Error 2'), 'test', 'op', {});

      const stats2 = errorHandler.getErrorStats();
      expect(stats2.healthScore).toBeLessThan(100);
    });

    test('should get top errors correctly', async () => {
      // Generate repeated errors
      for (let i = 0; i < 3; i++) {
        await errorHandler.handleError(new Error('Common error'), 'test', 'op', {});
      }
      await errorHandler.handleError(new Error('Rare error'), 'test', 'op', {});

      const stats = errorHandler.getErrorStats();
      const topErrors = stats.topErrors;

      expect(topErrors).toHaveLength(2);
      expect(topErrors[0].count).toBe(3);
      expect(topErrors[0].message).toBe('Common error');
      expect(topErrors[1].count).toBe(1);
      expect(topErrors[1].message).toBe('Rare error');
    });
  });

  describe('Graceful Degradation', () => {
    test('should provide degradation strategy for essential operations', () => {
      const strategy = errorHandler.getGracefulDegradationStrategy('getStockPrice', 'yahoo');

      expect(strategy.essential).toBe(true);
      expect(strategy.fallbacks).toContain('cache');
      expect(strategy.fallbacks).toContain('alternative_provider');
      expect(strategy.partialDataAcceptable).toBe(false);
    });

    test('should provide degradation strategy for non-essential operations', () => {
      const strategy = errorHandler.getGracefulDegradationStrategy('getMarketNews', 'newsapi');

      expect(strategy.essential).toBe(false);
      expect(strategy.fallbacks).toContain('cache');
      expect(strategy.partialDataAcceptable).toBe(true);
    });

    test('should provide default strategy for unknown operations', () => {
      const strategy = errorHandler.getGracefulDegradationStrategy('unknownOperation', 'test');

      expect(strategy.essential).toBe(false);
      expect(strategy.fallbacks).toContain('cache');
      expect(strategy.partialDataAcceptable).toBe(true);
    });
  });
});