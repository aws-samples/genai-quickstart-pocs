/**
 * Feature Flag Manager Tests
 * 
 * Tests for the FeatureFlagManager class that handles feature flags,
 * A/B testing, and gradual rollout functionality.
 */

const FeatureFlagManager = require('../FeatureFlagManager');

describe('FeatureFlagManager', () => {
  let originalEnv;
  let flagManager;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.ENABLE_NEW_PROVIDERS;
    delete process.env.ENABLE_LEGACY_PROVIDERS;
    delete process.env.ENABLE_AB_TESTING;
    delete process.env.ROLLOUT_PERCENTAGE;
    delete process.env.CANARY_PERCENTAGE;
    delete process.env.ENABLE_CACHING;
    
    flagManager = new FeatureFlagManager();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Feature Flag Loading', () => {
    test('should load default feature flags', () => {
      const flags = flagManager.loadFeatureFlags();
      
      expect(flags.providers.enableNewProviders).toBe(true);
      expect(flags.providers.enableLegacyProviders).toBe(false);
      expect(flags.rollout.rolloutPercentage).toBe(100);
      expect(flags.experiments.enableABTesting).toBe(true);
      expect(flags.performance.enableCaching).toBe(true);
    });

    test('should load feature flags from environment variables', () => {
      process.env.ENABLE_NEW_PROVIDERS = 'false';
      process.env.ENABLE_LEGACY_PROVIDERS = 'true';
      process.env.ROLLOUT_PERCENTAGE = '50';
      process.env.ENABLE_AB_TESTING = 'false';
      process.env.ENABLE_CACHING = 'false';
      
      const newFlagManager = new FeatureFlagManager();
      const flags = newFlagManager.loadFeatureFlags();
      
      expect(flags.providers.enableNewProviders).toBe(false);
      expect(flags.providers.enableLegacyProviders).toBe(true);
      expect(flags.rollout.rolloutPercentage).toBe(50);
      expect(flags.experiments.enableABTesting).toBe(false);
      expect(flags.performance.enableCaching).toBe(false);
    });

    test('should parse boolean values correctly', () => {
      expect(flagManager.parseBoolean('true')).toBe(true);
      expect(flagManager.parseBoolean('1')).toBe(true);
      expect(flagManager.parseBoolean('yes')).toBe(true);
      expect(flagManager.parseBoolean('on')).toBe(true);
      expect(flagManager.parseBoolean('enabled')).toBe(true);
      expect(flagManager.parseBoolean('false')).toBe(false);
      expect(flagManager.parseBoolean('0')).toBe(false);
      expect(flagManager.parseBoolean('no')).toBe(false);
      expect(flagManager.parseBoolean('off')).toBe(false);
      expect(flagManager.parseBoolean(undefined, true)).toBe(true);
      expect(flagManager.parseBoolean(null, false)).toBe(false);
    });
  });

  describe('Basic Feature Flag Evaluation', () => {
    test('should check if feature flag is enabled', () => {
      expect(flagManager.isEnabled('providers.enableNewProviders')).toBe(true);
      expect(flagManager.isEnabled('providers.enableLegacyProviders')).toBe(false);
      expect(flagManager.isEnabled('performance.enableCaching')).toBe(true);
    });

    test('should return false for non-existent flags', () => {
      expect(flagManager.isEnabled('nonexistent.flag')).toBe(false);
    });

    test('should get raw flag values', () => {
      expect(flagManager.getFlagValue('providers.enableNewProviders')).toBe(true);
      expect(flagManager.getFlagValue('rollout.rolloutPercentage')).toBe(100);
      expect(flagManager.getFlagValue('nonexistent.flag')).toBeNull();
    });
  });

  describe('Percentage-based Feature Flags', () => {
    test('should evaluate percentage flags with user ID', () => {
      const flagConfig = { percentage: 50 };
      
      // Test with consistent user IDs
      const result1 = flagManager.evaluatePercentageFlag(flagConfig, 'user123');
      const result2 = flagManager.evaluatePercentageFlag(flagConfig, 'user123');
      
      // Should be consistent for same user
      expect(result1).toBe(result2);
    });

    test('should handle 0% and 100% percentages', () => {
      expect(flagManager.evaluatePercentageFlag({ percentage: 0 }, 'user123')).toBe(false);
      expect(flagManager.evaluatePercentageFlag({ percentage: 100 }, 'user123')).toBe(true);
    });

    test('should use random assignment for anonymous users', () => {
      const flagConfig = { percentage: 50 };
      
      // Mock Math.random to return predictable values
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0.3); // 30% < 50%
      
      expect(flagManager.evaluatePercentageFlag(flagConfig, null)).toBe(true);
      
      Math.random = jest.fn().mockReturnValue(0.7); // 70% > 50%
      expect(flagManager.evaluatePercentageFlag(flagConfig, null)).toBe(false);
      
      Math.random = originalRandom;
    });
  });

  describe('User Segmentation', () => {
    test('should assign users to segments consistently', () => {
      const segment1 = flagManager.getUserSegment('user123');
      const segment2 = flagManager.getUserSegment('user123');
      
      expect(segment1).toBe(segment2);
      expect(['control', 'treatment_a', 'treatment_b', 'beta', 'alpha']).toContain(segment1);
    });

    test('should evaluate segment-based flags', () => {
      const flagConfig = { segments: ['beta', 'alpha'] };
      
      // Mock getUserSegment to return 'beta'
      flagManager.getUserSegment = jest.fn().mockReturnValue('beta');
      
      expect(flagManager.evaluateSegmentFlag(flagConfig, 'user123')).toBe(true);
      
      // Mock getUserSegment to return 'control'
      flagManager.getUserSegment = jest.fn().mockReturnValue('control');
      
      expect(flagManager.evaluateSegmentFlag(flagConfig, 'user123')).toBe(false);
    });

    test('should return false for segment flags without user ID', () => {
      const flagConfig = { segments: ['beta'] };
      
      expect(flagManager.evaluateSegmentFlag(flagConfig, null)).toBe(false);
    });
  });

  describe('A/B Testing and Experiments', () => {
    test('should create experiments', () => {
      const experiment = flagManager.createExperiment('test_experiment', {
        name: 'Test Experiment',
        treatmentPercentage: 30,
        description: 'Testing new feature'
      });
      
      expect(experiment.id).toBe('test_experiment');
      expect(experiment.name).toBe('Test Experiment');
      expect(experiment.treatmentPercentage).toBe(30);
      expect(experiment.active).toBe(true);
    });

    test('should assign users to experiment groups consistently', () => {
      const experiment = flagManager.createExperiment('test_experiment', {
        treatmentPercentage: 50
      });
      
      const assignment1 = flagManager.assignUserToExperiment('user123', experiment);
      const assignment2 = flagManager.assignUserToExperiment('user123', experiment);
      
      expect(assignment1).toBe(assignment2);
      expect(typeof assignment1).toBe('boolean');
    });

    test('should evaluate experiment-based flags', () => {
      const experiment = flagManager.createExperiment('test_experiment', {
        treatmentPercentage: 100 // Everyone gets treatment
      });
      
      const flagConfig = { experiment: 'test_experiment' };
      
      expect(flagManager.evaluateExperimentFlag(flagConfig, 'user123')).toBe(true);
    });

    test('should handle non-existent experiments', () => {
      const flagConfig = { experiment: 'nonexistent_experiment' };
      
      expect(flagManager.evaluateExperimentFlag(flagConfig, 'user123')).toBe(false);
    });
  });

  describe('Provider Selection', () => {
    test('should get provider for user based on feature flags', () => {
      const provider = flagManager.getProviderForUser('user123');
      
      expect(provider).toBe('enhanced_multi_provider'); // Default when new providers enabled
    });

    test('should throw error when new providers disabled (legacy removed)', () => {
      process.env.ENABLE_NEW_PROVIDERS = 'false';
      process.env.ENABLE_LEGACY_PROVIDERS = 'true';
      
      const newFlagManager = new FeatureFlagManager();
      
      expect(() => {
        newFlagManager.getProviderForUser('user123');
      }).toThrow('New providers are disabled and legacy providers have been removed');
    });

    test('should throw error when no providers enabled', () => {
      process.env.ENABLE_NEW_PROVIDERS = 'false';
      process.env.ENABLE_LEGACY_PROVIDERS = 'false';
      
      const newFlagManager = new FeatureFlagManager();
      
      expect(() => {
        newFlagManager.getProviderForUser('user123');
      }).toThrow('New providers are disabled and legacy providers have been removed');
    });

    test('should check if specific provider is enabled', () => {
      expect(flagManager.isProviderEnabled('yahoo')).toBe(true);
      expect(flagManager.isProviderEnabled('newsapi')).toBe(true);
      expect(flagManager.isProviderEnabled('enhanced_multi_provider')).toBe(true);
    });

    test('should handle unknown providers', () => {
      expect(flagManager.isProviderEnabled('unknown_provider')).toBe(false);
    });
  });

  describe('Provider Features', () => {
    test('should get feature configuration for provider', () => {
      const features = flagManager.getProviderFeatures('yahoo', 'user123');
      
      expect(features).toHaveProperty('caching');
      expect(features).toHaveProperty('rateLimiting');
      expect(features).toHaveProperty('macroData');
      expect(features).toHaveProperty('sentimentAnalysis');
      expect(features).toHaveProperty('circuitBreaker');
      expect(features.caching).toBe(true);
      expect(features.rateLimiting).toBe(true);
    });

    test('should respect feature flag settings', () => {
      process.env.ENABLE_CACHING = 'false';
      process.env.ENABLE_MACRO_DATA = 'false';
      
      const newFlagManager = new FeatureFlagManager();
      const features = newFlagManager.getProviderFeatures('yahoo', 'user123');
      
      expect(features.caching).toBe(false);
      expect(features.macroData).toBe(false);
    });
  });

  describe('Runtime Flag Updates', () => {
    test('should update feature flags at runtime', () => {
      expect(flagManager.isEnabled('providers.enableNewProviders')).toBe(true);
      
      flagManager.updateFlag('providers.enableNewProviders', false);
      
      expect(flagManager.isEnabled('providers.enableNewProviders')).toBe(false);
    });

    test('should create nested flag paths when updating', () => {
      flagManager.updateFlag('new.nested.flag', true);
      
      expect(flagManager.isEnabled('new.nested.flag')).toBe(true);
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should track flag evaluation metrics', () => {
      const initialMetrics = flagManager.getMetrics();
      
      flagManager.isEnabled('providers.enableNewProviders');
      flagManager.isEnabled('performance.enableCaching');
      
      const updatedMetrics = flagManager.getMetrics();
      
      expect(updatedMetrics.flagEvaluations).toBe(initialMetrics.flagEvaluations + 2);
    });

    test('should track experiment assignment metrics', () => {
      const experiment = flagManager.createExperiment('test_experiment', {
        treatmentPercentage: 50
      });
      
      const initialMetrics = flagManager.getMetrics();
      
      flagManager.assignUserToExperiment('user123', experiment);
      flagManager.assignUserToExperiment('user456', experiment);
      
      const updatedMetrics = flagManager.getMetrics();
      
      expect(updatedMetrics.experimentAssignments).toBe(initialMetrics.experimentAssignments + 2);
    });

    test('should reset metrics', () => {
      flagManager.isEnabled('providers.enableNewProviders');
      flagManager.getProviderForUser('user123');
      
      expect(flagManager.getMetrics().flagEvaluations).toBeGreaterThan(0);
      
      flagManager.resetMetrics();
      
      const metrics = flagManager.getMetrics();
      expect(metrics.flagEvaluations).toBe(0);
      expect(metrics.providerSwitches).toBe(0);
    });
  });

  describe('Configuration Export', () => {
    test('should export complete configuration', () => {
      flagManager.createExperiment('test_experiment', { treatmentPercentage: 50 });
      flagManager.getUserSegment('user123');
      
      const config = flagManager.exportConfiguration();
      
      expect(config).toHaveProperty('flags');
      expect(config).toHaveProperty('experiments');
      expect(config).toHaveProperty('userSegments');
      expect(config).toHaveProperty('metrics');
      expect(config).toHaveProperty('options');
      
      expect(config.experiments).toHaveLength(1);
      expect(config.userSegments).toHaveLength(1);
    });

    test('should get all flags', () => {
      const allFlags = flagManager.getAllFlags();
      
      expect(allFlags).toHaveProperty('providers');
      expect(allFlags).toHaveProperty('rollout');
      expect(allFlags).toHaveProperty('experiments');
      expect(allFlags).toHaveProperty('safety');
      expect(allFlags).toHaveProperty('performance');
      expect(allFlags).toHaveProperty('features');
      expect(allFlags).toHaveProperty('debug');
    });
  });

  describe('Hash Function', () => {
    test('should generate consistent hashes for same input', () => {
      const hash1 = flagManager.hashUserId('user123');
      const hash2 = flagManager.hashUserId('user123');
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
      expect(hash1).toBeGreaterThanOrEqual(0);
    });

    test('should generate different hashes for different inputs', () => {
      const hash1 = flagManager.hashUserId('user123');
      const hash2 = flagManager.hashUserId('user456');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Gradual Rollout', () => {
    test('should handle gradual rollout based on percentage', () => {
      process.env.ENABLE_GRADUAL_ROLLOUT = 'true';
      process.env.ROLLOUT_PERCENTAGE = '50';
      
      const newFlagManager = new FeatureFlagManager();
      
      // Mock the percentage evaluation to return false (user not in rollout)
      newFlagManager.evaluatePercentageFlag = jest.fn().mockReturnValue(false);
      
      expect(() => {
        newFlagManager.getProviderForUser('user123');
      }).toThrow('User not in rollout percentage and legacy providers have been removed');
    });

    test('should handle canary deployment', () => {
      process.env.ENABLE_CANARY_DEPLOYMENT = 'true';
      process.env.CANARY_PERCENTAGE = '10';
      
      const newFlagManager = new FeatureFlagManager();
      
      // Mock the percentage evaluation to return true (user in canary)
      newFlagManager.evaluatePercentageFlag = jest.fn().mockReturnValue(true);
      
      const provider = newFlagManager.getProviderForUser('user123');
      
      expect(provider).toBe('enhanced_multi_provider'); // Should get new provider
    });
  });
});