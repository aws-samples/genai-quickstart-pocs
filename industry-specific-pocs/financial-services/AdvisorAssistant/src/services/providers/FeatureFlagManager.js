/**
 * Feature Flag Manager
 * 
 * Manages feature flags for gradual rollout of new data providers,
 * A/B testing capabilities, and provider comparison functionality.
 * 
 * @author Advisor Assistant Team
 * @version 1.0.0
 */

class FeatureFlagManager {
  constructor(options = {}) {
    this.flags = this.loadFeatureFlags();
    this.userSegments = new Map();
    this.experiments = new Map();
    this.metrics = {
      flagEvaluations: 0,
      experimentAssignments: 0,
      providerSwitches: 0
    };
    
    // Configuration options
    this.options = {
      enablePersistence: options.enablePersistence !== false,
      enableMetrics: options.enableMetrics !== false,
      enableLogging: options.enableLogging !== false,
      ...options
    };
  }

  /**
   * Load feature flags from environment and configuration
   * @returns {Object} Feature flags configuration
   */
  loadFeatureFlags() {
    return {
      // Provider Feature Flags
      providers: {
        enableNewProviders: this.parseBoolean(process.env.ENABLE_NEW_PROVIDERS, true),
        enableLegacyProviders: this.parseBoolean(process.env.ENABLE_LEGACY_PROVIDERS, false),
        enableYahooFinance: this.parseBoolean(process.env.ENABLE_YAHOO_FINANCE, true),
        enableNewsAPI: this.parseBoolean(process.env.ENABLE_NEWSAPI, true),
        enableFRED: this.parseBoolean(process.env.ENABLE_FRED, true),
        enableEnhancedMultiProvider: this.parseBoolean(process.env.ENABLE_ENHANCED_MULTI_PROVIDER, true)
      },

      // Rollout Feature Flags
      rollout: {
        enableGradualRollout: this.parseBoolean(process.env.ENABLE_GRADUAL_ROLLOUT, true),
        rolloutPercentage: parseInt(process.env.ROLLOUT_PERCENTAGE) || 100,
        enableCanaryDeployment: this.parseBoolean(process.env.ENABLE_CANARY_DEPLOYMENT, false),
        canaryPercentage: parseInt(process.env.CANARY_PERCENTAGE) || 5,
        enableBlueGreenDeployment: this.parseBoolean(process.env.ENABLE_BLUE_GREEN, false)
      },

      // A/B Testing Feature Flags
      experiments: {
        enableABTesting: this.parseBoolean(process.env.ENABLE_AB_TESTING, true),
        enableProviderComparison: this.parseBoolean(process.env.ENABLE_PROVIDER_COMPARISON, true),
        enablePerformanceTesting: this.parseBoolean(process.env.ENABLE_PERFORMANCE_TESTING, true),
        enableDataQualityTesting: this.parseBoolean(process.env.ENABLE_DATA_QUALITY_TESTING, true)
      },

      // Fallback and Safety Feature Flags
      safety: {
        enableProviderFallback: this.parseBoolean(process.env.ENABLE_PROVIDER_FALLBACK, true),
        enableCircuitBreaker: this.parseBoolean(process.env.ENABLE_CIRCUIT_BREAKER, true),
        enableHealthChecks: this.parseBoolean(process.env.ENABLE_HEALTH_CHECKS, true),
        enableAutoRollback: this.parseBoolean(process.env.ENABLE_AUTO_ROLLBACK, true),
        maxFailureRate: parseFloat(process.env.MAX_FAILURE_RATE) || 0.1, // 10%
        rollbackThreshold: parseInt(process.env.ROLLBACK_THRESHOLD) || 5 // 5 consecutive failures
      },

      // Performance Feature Flags
      performance: {
        enableCaching: this.parseBoolean(process.env.ENABLE_CACHING, true),
        enableRateLimiting: this.parseBoolean(process.env.ENABLE_RATE_LIMITING, true),
        enableRequestBatching: this.parseBoolean(process.env.ENABLE_REQUEST_BATCHING, false),
        enableConnectionPooling: this.parseBoolean(process.env.ENABLE_CONNECTION_POOLING, true),
        enableCompression: this.parseBoolean(process.env.ENABLE_COMPRESSION, true)
      },

      // Feature Enhancement Flags
      features: {
        enableMacroData: this.parseBoolean(process.env.ENABLE_MACRO_DATA, true),
        enableSentimentAnalysis: this.parseBoolean(process.env.ENABLE_SENTIMENT_ANALYSIS, true),
        enableAnalystRatings: this.parseBoolean(process.env.ENABLE_ANALYST_RATINGS, true),
        enableFinancialCalendar: this.parseBoolean(process.env.ENABLE_FINANCIAL_CALENDAR, true),
        enableNewsFiltering: this.parseBoolean(process.env.ENABLE_NEWS_FILTERING, true)
      },

      // Debug and Development Flags
      debug: {
        enableDebugLogging: this.parseBoolean(process.env.ENABLE_DEBUG_LOGGING, false),
        enableVerboseLogging: this.parseBoolean(process.env.ENABLE_VERBOSE_LOGGING, false),
        enableProviderMetrics: this.parseBoolean(process.env.ENABLE_PROVIDER_METRICS, true),
        enableRequestTracing: this.parseBoolean(process.env.ENABLE_REQUEST_TRACING, false),
        enableMockProviders: this.parseBoolean(process.env.ENABLE_MOCK_PROVIDERS, false)
      }
    };
  }

  /**
   * Parse boolean environment variables
   * @param {string} value - Environment variable value
   * @param {boolean} defaultValue - Default value
   * @returns {boolean} Parsed boolean value
   */
  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) return defaultValue;
    return ['true', '1', 'yes', 'on', 'enabled'].includes(value.toLowerCase());
  }

  /**
   * Check if a feature flag is enabled
   * @param {string} flagPath - Dot-notation path to flag (e.g., 'providers.enableNewProviders')
   * @param {string} userId - Optional user ID for user-specific flags
   * @returns {boolean} Whether the flag is enabled
   */
  isEnabled(flagPath, userId = null) {
    this.metrics.flagEvaluations++;
    
    const flagValue = this.getFlagValue(flagPath);
    
    if (flagValue === null) {
      if (this.options.enableLogging) {
        console.warn(`⚠️  Feature flag not found: ${flagPath}`);
      }
      return false;
    }

    // Handle percentage-based rollouts
    if (typeof flagValue === 'object' && flagValue.percentage !== undefined) {
      return this.evaluatePercentageFlag(flagValue, userId);
    }

    // Handle user segment-based flags
    if (typeof flagValue === 'object' && flagValue.segments !== undefined) {
      return this.evaluateSegmentFlag(flagValue, userId);
    }

    // Handle experiment-based flags
    if (typeof flagValue === 'object' && flagValue.experiment !== undefined) {
      return this.evaluateExperimentFlag(flagValue, userId);
    }

    return Boolean(flagValue);
  }

  /**
   * Get raw flag value using dot notation
   * @param {string} flagPath - Dot-notation path to flag
   * @returns {*} Flag value or null if not found
   */
  getFlagValue(flagPath) {
    const parts = flagPath.split('.');
    let current = this.flags;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }

  /**
   * Evaluate percentage-based feature flag
   * @param {Object} flagConfig - Flag configuration with percentage
   * @param {string} userId - User ID for consistent assignment
   * @returns {boolean} Whether user is in the enabled percentage
   */
  evaluatePercentageFlag(flagConfig, userId) {
    const percentage = flagConfig.percentage || 0;
    
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    // Use consistent hash-based assignment if userId provided
    if (userId) {
      const hash = this.hashUserId(userId);
      return (hash % 100) < percentage;
    }
    
    // Random assignment for anonymous users
    return Math.random() * 100 < percentage;
  }

  /**
   * Evaluate segment-based feature flag
   * @param {Object} flagConfig - Flag configuration with segments
   * @param {string} userId - User ID
   * @returns {boolean} Whether user is in enabled segment
   */
  evaluateSegmentFlag(flagConfig, userId) {
    if (!userId) return false;
    
    const userSegment = this.getUserSegment(userId);
    const enabledSegments = flagConfig.segments || [];
    
    return enabledSegments.includes(userSegment);
  }

  /**
   * Evaluate experiment-based feature flag
   * @param {Object} flagConfig - Flag configuration with experiment
   * @param {string} userId - User ID
   * @returns {boolean} Whether user is in treatment group
   */
  evaluateExperimentFlag(flagConfig, userId) {
    const experimentId = flagConfig.experiment;
    const experiment = this.experiments.get(experimentId);
    
    if (!experiment) {
      if (this.options.enableLogging) {
        console.warn(`⚠️  Experiment not found: ${experimentId}`);
      }
      return false;
    }
    
    return this.assignUserToExperiment(userId, experiment);
  }

  /**
   * Create a simple hash from user ID for consistent assignment
   * @param {string} userId - User ID
   * @returns {number} Hash value
   */
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get user segment for segment-based flags
   * @param {string} userId - User ID
   * @returns {string} User segment
   */
  getUserSegment(userId) {
    if (this.userSegments.has(userId)) {
      return this.userSegments.get(userId);
    }
    
    // Simple segment assignment based on user ID hash
    const hash = this.hashUserId(userId);
    const segments = ['control', 'treatment_a', 'treatment_b', 'beta', 'alpha'];
    const segment = segments[hash % segments.length];
    
    this.userSegments.set(userId, segment);
    return segment;
  }

  /**
   * Assign user to experiment group
   * @param {string} userId - User ID
   * @param {Object} experiment - Experiment configuration
   * @returns {boolean} Whether user is in treatment group
   */
  assignUserToExperiment(userId, experiment) {
    this.metrics.experimentAssignments++;
    
    const hash = this.hashUserId(userId);
    const treatmentPercentage = experiment.treatmentPercentage || 50;
    
    return (hash % 100) < treatmentPercentage;
  }

  /**
   * Set up A/B test experiment
   * @param {string} experimentId - Unique experiment ID
   * @param {Object} config - Experiment configuration
   */
  createExperiment(experimentId, config) {
    const experiment = {
      id: experimentId,
      name: config.name || experimentId,
      description: config.description || '',
      treatmentPercentage: config.treatmentPercentage || 50,
      startDate: config.startDate || new Date(),
      endDate: config.endDate || null,
      active: config.active !== false,
      metrics: {
        controlGroup: 0,
        treatmentGroup: 0,
        conversions: { control: 0, treatment: 0 }
      }
    };
    
    this.experiments.set(experimentId, experiment);
    
    if (this.options.enableLogging) {
      console.log(`🧪 Created experiment: ${experimentId} (${experiment.treatmentPercentage}% treatment)`);
    }
    
    return experiment;
  }

  /**
   * Get provider based on feature flags and experiments
   * @param {string} userId - User ID for consistent assignment
   * @param {string} defaultProvider - Default provider to use
   * @returns {string} Selected provider
   */
  getProviderForUser(userId, defaultProvider = 'enhanced_multi_provider') {
    // Check if new providers are enabled
    if (!this.isEnabled('providers.enableNewProviders', userId)) {
      throw new Error('New providers are disabled and legacy providers have been removed');
    }

    // Check for provider comparison experiment
    if (this.isEnabled('experiments.enableProviderComparison', userId)) {
      const experiment = this.experiments.get('provider_comparison');
      if (experiment && this.assignUserToExperiment(userId, experiment)) {
        return experiment.treatmentProvider || 'yahoo';
      }
    }

    // Check gradual rollout
    if (this.isEnabled('rollout.enableGradualRollout', userId)) {
      const rolloutPercentage = this.flags.rollout.rolloutPercentage;
      if (!this.evaluatePercentageFlag({ percentage: rolloutPercentage }, userId)) {
        throw new Error('User not in rollout percentage and legacy providers have been removed');
      }
    }

    // Check canary deployment
    if (this.isEnabled('rollout.enableCanaryDeployment', userId)) {
      const canaryPercentage = this.flags.rollout.canaryPercentage;
      if (this.evaluatePercentageFlag({ percentage: canaryPercentage }, userId)) {
        return 'enhanced_multi_provider'; // Canary users get new provider
      }
    }

    this.metrics.providerSwitches++;
    return defaultProvider;
  }

  /**
   * Check if provider should be enabled based on feature flags
   * @param {string} providerName - Name of the provider
   * @param {string} userId - User ID
   * @returns {boolean} Whether provider should be enabled
   */
  isProviderEnabled(providerName, userId = null) {
    const providerFlagMap = {
      'yahoo': 'providers.enableYahooFinance',
      'yahoo_finance': 'providers.enableYahooFinance',
      'newsapi': 'providers.enableNewsAPI',
      'fred': 'providers.enableFRED',
      'enhanced_multi_provider': 'providers.enableEnhancedMultiProvider'
    };

    const flagPath = providerFlagMap[providerName.toLowerCase()];
    if (!flagPath) {
      if (this.options.enableLogging) {
        console.warn(`⚠️  Unknown or unsupported provider: ${providerName}`);
      }
      return false;
    }

    return this.isEnabled(flagPath, userId);
  }

  /**
   * Get feature configuration for provider
   * @param {string} providerName - Name of the provider
   * @param {string} userId - User ID
   * @returns {Object} Feature configuration
   */
  getProviderFeatures(providerName, userId = null) {
    return {
      caching: this.isEnabled('performance.enableCaching', userId),
      rateLimiting: this.isEnabled('performance.enableRateLimiting', userId),
      macroData: this.isEnabled('features.enableMacroData', userId),
      sentimentAnalysis: this.isEnabled('features.enableSentimentAnalysis', userId),
      analystRatings: this.isEnabled('features.enableAnalystRatings', userId),
      financialCalendar: this.isEnabled('features.enableFinancialCalendar', userId),
      newsFiltering: this.isEnabled('features.enableNewsFiltering', userId),
      circuitBreaker: this.isEnabled('safety.enableCircuitBreaker', userId),
      healthChecks: this.isEnabled('safety.enableHealthChecks', userId),
      debugLogging: this.isEnabled('debug.enableDebugLogging', userId),
      providerMetrics: this.isEnabled('debug.enableProviderMetrics', userId)
    };
  }

  /**
   * Update feature flag at runtime
   * @param {string} flagPath - Dot-notation path to flag
   * @param {*} value - New flag value
   */
  updateFlag(flagPath, value) {
    const parts = flagPath.split('.');
    let current = this.flags;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
    
    if (this.options.enableLogging) {
      console.log(`🚩 Updated feature flag: ${flagPath} = ${value}`);
    }
  }

  /**
   * Get all feature flags status
   * @returns {Object} All feature flags with their current values
   */
  getAllFlags() {
    return JSON.parse(JSON.stringify(this.flags));
  }

  /**
   * Get feature flag metrics
   * @returns {Object} Metrics about feature flag usage
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeExperiments: this.experiments.size,
      userSegments: this.userSegments.size,
      flagsLoaded: this.countFlags(this.flags)
    };
  }

  /**
   * Count total number of flags recursively
   * @param {Object} obj - Object to count flags in
   * @returns {number} Total number of flags
   */
  countFlags(obj) {
    let count = 0;
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countFlags(obj[key]);
      } else {
        count++;
      }
    }
    return count;
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      flagEvaluations: 0,
      experimentAssignments: 0,
      providerSwitches: 0
    };
    
    // Reset experiment metrics
    for (const experiment of this.experiments.values()) {
      experiment.metrics = {
        controlGroup: 0,
        treatmentGroup: 0,
        conversions: { control: 0, treatment: 0 }
      };
    }
  }

  /**
   * Export configuration for debugging
   * @returns {Object} Complete feature flag configuration
   */
  exportConfiguration() {
    return {
      flags: this.getAllFlags(),
      experiments: Array.from(this.experiments.entries()),
      userSegments: Array.from(this.userSegments.entries()),
      metrics: this.getMetrics(),
      options: this.options
    };
  }
}

module.exports = FeatureFlagManager;