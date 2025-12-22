/**
 * Unit tests for Model Selection Service
 */

import {
  ModelSelectionServiceImpl,
  createModelSelectionService,
  getModelSelectionService,
  ModelSelectionConfig
} from '../ai/model-selection-service';
import {
  Task,
  ModelContext,
  SelectedModel,
  ModelDefinition,
  PerformanceMetrics
} from '../../models/services';

describe('ModelSelectionService', () => {
  let service: ModelSelectionServiceImpl;
  let mockConfig: Partial<ModelSelectionConfig>;

  beforeEach(() => {
    mockConfig = {
      defaultModel: 'claude-sonnet-3.7',
      performanceThresholds: {
        accuracy: 0.80,
        latency: 6000,
        errorRate: 0.10
      },
      fallbackChain: ['claude-sonnet-3.7', 'claude-haiku-3.5', 'amazon-nova-pro'],
      maxRetries: 2
    };
    service = createModelSelectionService(mockConfig);
  });

  describe('Model Selection Logic', () => {
    it('should select Claude Sonnet for supervisor agent tasks', async () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'supervisor'
      };

      const context: ModelContext = {
        dataSize: 5000,
        timeConstraint: 10000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
      };

      const result = await service.selectModel(task, context);

      expect(result.name).toBe('Claude Sonnet 3.7');
      expect(result.id).toBe('claude-sonnet-3.7');
      expect(result.capabilities).toContain('text-generation');
    });

    it('should select Claude Haiku for research agent tasks', async () => {
      const task: Task = {
        type: 'classification',
        complexity: 'simple',
        domain: 'general',
        priority: 'medium',
        agentRole: 'research'
      };

      const context: ModelContext = {
        dataSize: 1000,
        timeConstraint: 3000,
        accuracyRequirement: 'medium',
        explainabilityRequirement: 'low'
      };

      const result = await service.selectModel(task, context);

      expect(result.name).toBe('Claude Haiku 3.5');
      expect(result.id).toBe('claude-haiku-3.5');
    });

    it('should select Amazon Nova Pro for analysis agent tasks', async () => {
      const task: Task = {
        type: 'time-series-analysis',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'analysis'
      };

      const context: ModelContext = {
        dataSize: 8000,
        timeConstraint: 15000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'medium'
      };

      const result = await service.selectModel(task, context);

      expect(result.name).toBe('Amazon Nova Pro');
      expect(result.id).toBe('amazon-nova-pro');
    });

    it('should fall back to default model for unsupported tasks', async () => {
      const task: Task = {
        type: 'entity-extraction' as any,
        complexity: 'complex',
        domain: 'regulatory',
        priority: 'low',
        agentRole: 'compliance'
      };

      const context: ModelContext = {
        dataSize: 2000,
        timeConstraint: 5000,
        accuracyRequirement: 'medium',
        explainabilityRequirement: 'medium'
      };

      const result = await service.selectModel(task, context);

      expect(result.id).toBe(mockConfig.defaultModel);
    });
  });

  describe('Performance Monitoring', () => {
    it('should evaluate model performance correctly', async () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'medium',
        agentRole: 'synthesis'
      };

      // Record some performance data
      const mockMetrics: PerformanceMetrics = {
        accuracy: 0.92,
        latency: 2500,
        throughput: 25,
        costPerRequest: 0.012,
        errorRate: 0.02,
        customMetrics: {}
      };

      service.recordPerformance('claude-sonnet-3.7', task, mockMetrics, true);

      const result = await service.evaluateModelPerformance('claude-sonnet-3.7', task);

      expect(result.accuracy).toBeGreaterThan(0.8);
      expect(result.latency).toBeLessThan(5000);
      expect(result.errorRate).toBeLessThan(0.1);
    });

    it('should return default metrics for models with no history', async () => {
      const task: Task = {
        type: 'classification',
        complexity: 'simple',
        domain: 'general',
        priority: 'low',
        agentRole: 'research'
      };

      const result = await service.evaluateModelPerformance('claude-haiku-3.5', task);

      expect(result.accuracy).toBeDefined();
      expect(result.latency).toBeDefined();
      expect(result.throughput).toBeDefined();
      expect(result.costPerRequest).toBeDefined();
      expect(result.errorRate).toBeDefined();
    });

    it('should calculate aggregate metrics from performance history', () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'medium',
        agentRole: 'planning'
      };

      // Record multiple performance entries
      const metrics1: PerformanceMetrics = {
        accuracy: 0.90,
        latency: 2000,
        throughput: 30,
        costPerRequest: 0.010,
        errorRate: 0.01,
        customMetrics: {}
      };

      const metrics2: PerformanceMetrics = {
        accuracy: 0.88,
        latency: 2200,
        throughput: 28,
        costPerRequest: 0.011,
        errorRate: 0.02,
        customMetrics: {}
      };

      service.recordPerformance('claude-sonnet-3.7', task, metrics1, true);
      service.recordPerformance('claude-sonnet-3.7', task, metrics2, true);

      const health = service.getModelHealth('claude-sonnet-3.7');

      expect(health.status).toBe('healthy');
      expect(health.metrics.accuracy).toBeCloseTo(0.89, 2);
      expect(health.metrics.latency).toBeCloseTo(2100, 0);
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should provide fallback model when primary model fails', () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'high',
        agentRole: 'supervisor'
      };

      const context: ModelContext = {
        dataSize: 3000,
        timeConstraint: 8000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
      };

      const fallback = service.getFallbackModel('claude-sonnet-3.7', task, context);

      expect(fallback.id).not.toBe('claude-sonnet-3.7');
      expect(['claude-haiku-3.5', 'amazon-nova-pro']).toContain(fallback.id);
    });

    it('should return default model as last resort fallback', () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'supervisor'
      };

      const context: ModelContext = {
        dataSize: 5000,
        timeConstraint: 10000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
      };

      // Simulate all models in fallback chain failing
      const customConfig = {
        ...mockConfig,
        fallbackChain: ['non-existent-model']
      };

      const customService = createModelSelectionService(customConfig);
      const fallback = customService.getFallbackModel('claude-sonnet-3.7', task, context);

      // Should return a valid model that's not the failed one
      expect(fallback.id).not.toBe('claude-sonnet-3.7');
      expect(['claude-haiku-3.5', 'amazon-nova-pro']).toContain(fallback.id);
    });
  });

  describe('Model Health Monitoring', () => {
    it('should report healthy status for good performance', () => {
      const task: Task = {
        type: 'classification',
        complexity: 'simple',
        domain: 'general',
        priority: 'medium',
        agentRole: 'research'
      };

      const goodMetrics: PerformanceMetrics = {
        accuracy: 0.95,
        latency: 1000,
        throughput: 50,
        costPerRequest: 0.005,
        errorRate: 0.01,
        customMetrics: {}
      };

      service.recordPerformance('claude-haiku-3.5', task, goodMetrics, true);

      const health = service.getModelHealth('claude-haiku-3.5');

      expect(health.status).toBe('healthy');
      expect(health.issues).toHaveLength(0);
    });

    it('should report degraded status for poor performance', () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'medium',
        agentRole: 'synthesis'
      };

      const poorMetrics: PerformanceMetrics = {
        accuracy: 0.70, // Below threshold
        latency: 8000, // Above threshold
        throughput: 10,
        costPerRequest: 0.020,
        errorRate: 0.03,
        customMetrics: {}
      };

      service.recordPerformance('claude-sonnet-3.7', task, poorMetrics, true);

      const health = service.getModelHealth('claude-sonnet-3.7');

      expect(health.status).toBe('degraded');
      expect(health.issues.length).toBeGreaterThan(0);
    });

    it('should report unhealthy status for very poor performance', () => {
      const task: Task = {
        type: 'time-series-analysis',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'analysis'
      };

      const veryPoorMetrics: PerformanceMetrics = {
        accuracy: 0.60,
        latency: 12000,
        throughput: 5,
        costPerRequest: 0.030,
        errorRate: 0.15, // Very high error rate
        customMetrics: {}
      };

      service.recordPerformance('amazon-nova-pro', task, veryPoorMetrics, false);

      const health = service.getModelHealth('amazon-nova-pro');

      expect(health.status).toBe('unhealthy');
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.issues.some(issue => issue.includes('error rate'))).toBe(true);
    });
  });

  describe('Custom Model Registration', () => {
    it('should successfully register a valid custom model', async () => {
      const customModel: ModelDefinition = {
        id: 'custom-model-1',
        name: 'Custom Financial Model',
        version: '1.0',
        provider: 'CustomProvider',
        capabilities: ['financial-analysis', 'risk-assessment'],
        limitations: ['domain-specific'],
        configurationSchema: {
          temperature: { type: 'number', default: 0.5 }
        }
      };

      const result = await service.registerCustomModel(customModel);

      expect(result.success).toBe(true);
      expect(result.modelId).toBe('custom-model-1');
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid model definitions', async () => {
      const invalidModel: Partial<ModelDefinition> = {
        id: 'invalid-model',
        name: 'Invalid Model'
        // Missing required fields
      };

      const result = await service.registerCustomModel(invalidModel as ModelDefinition);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.modelId).toBeUndefined();
    });

    it('should reject duplicate model IDs', async () => {
      const model1: ModelDefinition = {
        id: 'duplicate-model',
        name: 'First Model',
        version: '1.0',
        provider: 'Provider1',
        capabilities: ['text-generation'],
        limitations: [],
        configurationSchema: {}
      };

      const model2: ModelDefinition = {
        id: 'duplicate-model', // Same ID
        name: 'Second Model',
        version: '2.0',
        provider: 'Provider2',
        capabilities: ['classification'],
        limitations: [],
        configurationSchema: {}
      };

      await service.registerCustomModel(model1);
      const result = await service.registerCustomModel(model2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('Configuration Generation', () => {
    it('should generate appropriate configuration for high accuracy tasks', async () => {
      const task: Task = {
        type: 'classification',
        complexity: 'medium',
        domain: 'regulatory',
        priority: 'high',
        agentRole: 'compliance'
      };

      const context: ModelContext = {
        dataSize: 2000,
        timeConstraint: 5000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
      };

      const result = await service.selectModel(task, context);

      expect(result.configurationParameters.temperature).toBeLessThanOrEqual(0.1);
    });

    it('should generate appropriate configuration for complex tasks', async () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'synthesis'
      };

      const context: ModelContext = {
        dataSize: 8000,
        timeConstraint: 15000,
        accuracyRequirement: 'medium',
        explainabilityRequirement: 'high'
      };

      const result = await service.selectModel(task, context);

      expect(result.configurationParameters.maxTokens).toBeGreaterThanOrEqual(4096);
    });

    it('should generate Nova Pro specific configuration', async () => {
      const task: Task = {
        type: 'time-series-analysis',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'analysis'
      };

      const context: ModelContext = {
        dataSize: 10000,
        timeConstraint: 20000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'medium'
      };

      const result = await service.selectModel(task, context);

      if (result.id === 'amazon-nova-pro') {
        expect(result.configurationParameters.analysisDepth).toBe('comprehensive');
        expect(result.configurationParameters.financialFocus).toBe(true);
      }
    });
  });

  describe('Factory Functions', () => {
    it('should create service instance with factory function', () => {
      const customConfig: Partial<ModelSelectionConfig> = {
        defaultModel: 'claude-haiku-3.5',
        maxRetries: 5
      };

      const factoryService = createModelSelectionService(customConfig);

      expect(factoryService).toBeInstanceOf(ModelSelectionServiceImpl);
    });

    it('should return singleton instance with global getter', () => {
      const service1 = getModelSelectionService();
      const service2 = getModelSelectionService();

      expect(service1).toBe(service2);
      expect(service1).toBeInstanceOf(ModelSelectionServiceImpl);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in model selection', async () => {
      const task: Task = {
        type: 'text-generation',
        complexity: 'medium',
        domain: 'financial',
        priority: 'medium',
        agentRole: 'supervisor'
      };

      const context: ModelContext = {
        dataSize: 3000,
        timeConstraint: 8000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
      };

      // Create service with invalid configuration to trigger error path
      const invalidService = new ModelSelectionServiceImpl({
        defaultModel: 'non-existent-model',
        performanceThresholds: {
          accuracy: 0.8,
          latency: 5000,
          errorRate: 0.05
        },
        fallbackChain: [],
        evaluationInterval: 300000,
        maxRetries: 3
      });

      // Should not throw, should fallback gracefully
      const result = await invalidService.selectModel(task, context);
      expect(result).toBeDefined();
    });

    it('should handle missing model configurations', () => {
      expect(() => {
        service.getFallbackModel('non-existent-model', {
          type: 'text-generation',
          complexity: 'medium',
          domain: 'financial',
          priority: 'medium',
          agentRole: 'supervisor'
        }, {
          dataSize: 1000,
          timeConstraint: 5000,
          accuracyRequirement: 'medium',
          explainabilityRequirement: 'medium'
        });
      }).not.toThrow();
    });
  });
});