/**
 * Environment Configuration Tests
 * 
 * Tests for the EnvironmentConfig class that manages environment variables,
 * API keys, and configuration validation for data providers.
 */

const EnvironmentConfig = require('../EnvironmentConfig');

describe('EnvironmentConfig', () => {
  let originalEnv;
  let config;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.NEWSAPI_KEY;
    delete process.env.FRED_API_KEY;
    delete process.env.DATA_PROVIDER;
    delete process.env.ENABLE_NEW_PROVIDERS;
    delete process.env.CACHE_DURATION_STOCK;
    
    config = new EnvironmentConfig();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Configuration Loading', () => {
    test('should load default configuration when no environment variables are set', () => {
      const loadedConfig = config.loadConfiguration();
      
      expect(loadedConfig.providers.dataProvider).toBe('enhanced_multi_provider');
      expect(loadedConfig.cache.stockPrice).toBe(300000); // 5 minutes
      expect(loadedConfig.features.enableNewProviders).toBe(true);
    });

    test('should load configuration from environment variables', () => {
      process.env.NEWSAPI_KEY = 'test_newsapi_key';
      process.env.DATA_PROVIDER = 'yahoo';
      process.env.CACHE_DURATION_STOCK = '600000';
      process.env.ENABLE_NEW_PROVIDERS = 'false';
      
      const newConfig = new EnvironmentConfig();
      const loadedConfig = newConfig.loadConfiguration();
      
      expect(loadedConfig.apiKeys.newsapi).toBe('test_newsapi_key');
      expect(loadedConfig.providers.dataProvider).toBe('yahoo');
      expect(loadedConfig.cache.stockPrice).toBe(600000);
      expect(loadedConfig.features.enableNewProviders).toBe(false);
    });

    test('should parse boolean environment variables correctly', () => {
      expect(config.parseBoolean('true')).toBe(true);
      expect(config.parseBoolean('1')).toBe(true);
      expect(config.parseBoolean('yes')).toBe(true);
      expect(config.parseBoolean('on')).toBe(true);
      expect(config.parseBoolean('false')).toBe(false);
      expect(config.parseBoolean('0')).toBe(false);
      expect(config.parseBoolean('no')).toBe(false);
      expect(config.parseBoolean('off')).toBe(false);
      expect(config.parseBoolean(undefined, true)).toBe(true);
      expect(config.parseBoolean(null, false)).toBe(false);
    });
  });

  describe('Provider Validation', () => {
    test('should validate Yahoo Finance provider (no API key required)', () => {
      const validation = config.validateProvider('yahoo');
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.provider).toBe('yahoo');
    });



    test('should validate NewsAPI provider with API key', () => {
      process.env.NEWSAPI_KEY = 'test_key';
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateProvider('newsapi');
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should fail validation for NewsAPI provider without API key', () => {
      const validation = config.validateProvider('newsapi');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('NEWSAPI_KEY is required for NewsAPI provider');
      expect(validation.required).toContain('NEWSAPI_KEY');
    });

    test('should validate FRED provider without API key (optional)', () => {
      const validation = config.validateProvider('fred');
      
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('FRED_API_KEY is optional but recommended for macro economic data');
      expect(validation.optional).toContain('FRED_API_KEY');
    });

    test('should validate enhanced multi-provider with required keys', () => {
      process.env.NEWSAPI_KEY = 'test_newsapi';
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateProvider('enhanced_multi_provider');
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should fail validation for enhanced multi-provider without required keys', () => {
      const validation = config.validateProvider('enhanced_multi_provider');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('NEWSAPI_KEY is required for enhanced multi-provider');
    });

    test('should warn about removed providers', () => {
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateProvider('unknown_deprecated_provider');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Unknown provider: unknown_deprecated_provider');
    });

    test('should handle unknown provider types', () => {
      const validation = config.validateProvider('unknown_provider');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Unknown provider: unknown_provider');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate complete configuration', () => {
      process.env.NEWSAPI_KEY = 'test_newsapi';
      process.env.DATA_PROVIDER = 'enhanced_multi_provider';
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateConfiguration();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should fail validation with missing required keys', () => {
      process.env.DATA_PROVIDER = 'enhanced_multi_provider';
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateConfiguration();
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should warn about cache duration issues', () => {
      process.env.CACHE_DURATION_STOCK = '30000'; // 30 seconds - too short
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateConfiguration();
      
      expect(validation.warnings).toContain('Cache duration for stockPrice is very short (30000ms)');
    });

    test('should warn about rate limit issues', () => {
      process.env.NEWSAPI_RATE_LIMIT = '5'; // Very low
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateConfiguration();
      
      expect(validation.warnings).toContain('Rate limit for newsapi is very low (5/min)');
    });

    test('should validate timeout configuration', () => {
      process.env.REQUEST_TIMEOUT = '500'; // Too short
      process.env.RETRY_TIMEOUT = '15000'; // Greater than request timeout
      const newConfig = new EnvironmentConfig();
      
      const validation = newConfig.validateConfiguration();
      
      expect(validation.warnings).toContain('Request timeout is very short (500ms)');
      expect(validation.errors).toContain('Retry timeout should be less than request timeout');
    });
  });

  describe('Provider Configuration', () => {
    test('should get provider-specific configuration', () => {
      process.env.NEWSAPI_KEY = 'test_key';
      const newConfig = new EnvironmentConfig();
      
      const providerConfig = newConfig.getProviderConfig('newsapi');
      
      expect(providerConfig.apiKey).toBe('test_key');
      expect(providerConfig.dailyQuotaTracking).toBe(true);
      expect(providerConfig.endpoints).toBeDefined();
      expect(providerConfig.cache.enabled).toBe(true);
      expect(providerConfig.rateLimit.enabled).toBe(true);
    });

    test('should get API key for provider', () => {
      process.env.NEWSAPI_KEY = 'newsapi_key';
      const newConfig = new EnvironmentConfig();
      
      expect(newConfig.getApiKey('newsapi')).toBe('newsapi_key');
      expect(newConfig.getApiKey('unknown')).toBeNull();
    });

    test('should get cache configuration for provider', () => {
      process.env.CACHE_DURATION_STOCK = '600000';
      const newConfig = new EnvironmentConfig();
      
      const cacheConfig = newConfig.getCacheConfig('yahoo');
      
      expect(cacheConfig.enabled).toBe(true);
      expect(cacheConfig.durations.stockPrice).toBe(600000);
    });

    test('should get rate limit configuration for provider', () => {
      process.env.NEWSAPI_RATE_LIMIT = '120';
      const newConfig = new EnvironmentConfig();
      
      const rateLimitConfig = newConfig.getRateLimitConfig('newsapi');
      
      expect(rateLimitConfig.enabled).toBe(true);
      expect(rateLimitConfig.requestsPerMinute).toBe(120);
    });
  });

  describe('Configuration Summary', () => {
    test('should provide configuration summary', () => {
      process.env.NEWSAPI_KEY = 'test_key';
      process.env.DATA_PROVIDER = 'enhanced_multi_provider';
      const newConfig = new EnvironmentConfig();
      
      const summary = newConfig.getConfigurationSummary();
      
      expect(summary.currentProvider).toBe('enhanced_multi_provider');
      expect(summary.validConfiguration).toBe(true);
      expect(summary.enabledFeatures).toContain('enableNewProviders');
      expect(summary.configuredProviders).toContain('newsapi');
      expect(summary.cacheEnabled).toBe(true);
      expect(summary.rateLimitingEnabled).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration at runtime', () => {
      const updates = {
        cache: {
          stockPrice: 600000
        },
        features: {
          enableCaching: false
        }
      };
      
      config.updateConfiguration(updates);
      
      expect(config.config.cache.stockPrice).toBe(600000);
      expect(config.config.features.enableCaching).toBe(false);
    });

    test('should deep merge configuration updates', () => {
      const updates = {
        rateLimits: {
          newsapi: {
            requestsPerMinute: 120
          }
        }
      };
      
      config.updateConfiguration(updates);
      
      expect(config.config.rateLimits.newsapi.requestsPerMinute).toBe(120);
      expect(config.config.rateLimits.newsapi.burstLimit).toBe(15); // Should preserve existing values
    });
  });

  describe('Configuration Export', () => {
    test('should export configuration without sensitive data', () => {
      process.env.NEWSAPI_KEY = 'very_secret_key_12345';
      const newConfig = new EnvironmentConfig();
      
      const exported = newConfig.exportConfiguration(false);
      
      expect(exported.apiKeys.newsapi).toBe('very_sec...');
      expect(exported.apiKeys.newsapi).not.toBe('very_secret_key_12345');
    });

    test('should export configuration with sensitive data when requested', () => {
      process.env.NEWSAPI_KEY = 'very_secret_key_12345';
      const newConfig = new EnvironmentConfig();
      
      const exported = newConfig.exportConfiguration(true);
      
      expect(exported.apiKeys.newsapi).toBe('very_secret_key_12345');
    });
  });
});