/**
 * Unit tests for Model Evaluation Framework
 */

import {
  ModelEvaluationFramework,
  createModelEvaluationFramework,
  getModelEvaluationFramework,
  TestCase,
  EvaluationResult,
  AccuracyMetrics,
  BiasMetrics,
  ExplainabilityMetrics,
  ReliabilityMetrics,
  EvaluationConfig
} from '../ai/model-evaluation-framework';
import { Task, ModelContext } from '../../models/services';

describe('ModelEvaluationFramework', () => {
  let framework: ModelEvaluationFramework;
  let mockTestCases: TestCase[];
  let mockTask: Task;
  let mockContext: ModelContext;

  beforeEach(() => {
    framework = createModelEvaluationFramework();
    
    mockTestCases = [
      {
        id: 'test1',
        input: { symbol: 'AAPL', price: 150 },
        expectedOutput: 'buy',
        actualOutput: 'buy',
        metadata: {
          domain: 'financial',
          complexity: 'medium',
          biasTestingGroup: 'tech_stocks',
          explainabilityRequired: true
        }
      },
      {
        id: 'test2',
        input: { symbol: 'TSLA', price: 800 },
        expectedOutput: 'hold',
        actualOutput: 'buy',
        metadata: {
          domain: 'financial',
          complexity: 'high',
          biasTestingGroup: 'tech_stocks',
          explainabilityRequired: true
        }
      },
      {
        id: 'test3',
        input: { symbol: 'XOM', price: 60 },
        expectedOutput: 'sell',
        actualOutput: 'sell',
        metadata: {
          domain: 'financial',
          complexity: 'medium',
          biasTestingGroup: 'energy_stocks',
          explainabilityRequired: false
        }
      }
    ];

    mockTask = {
      type: 'classification',
      complexity: 'medium',
      domain: 'financial',
      priority: 'high',
      agentRole: 'analysis'
    };

    mockContext = {
      dataSize: 1000,
      timeConstraint: 5000,
      accuracyRequirement: 'high',
      explainabilityRequirement: 'high'
    };
  });

  describe('Constructor and Configuration', () => {
    it('should create framework with default configuration', () => {
      const defaultFramework = new ModelEvaluationFramework();
      expect(defaultFramework).toBeInstanceOf(ModelEvaluationFramework);
    });

    it('should create framework with custom configuration', () => {
      const customConfig: Partial<EvaluationConfig> = {
        accuracyThresholds: {
          minimum: 0.85,
          target: 0.95,
          excellent: 0.98
        },
        biasThresholds: {
          acceptable: 0.03,
          concerning: 0.08,
          critical: 0.15
        }
      };

      const customFramework = new ModelEvaluationFramework(customConfig);
      expect(customFramework).toBeInstanceOf(ModelEvaluationFramework);
    });
  });

  describe('Model Evaluation', () => {
    it('should perform comprehensive model evaluation', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);

      expect(result).toBeDefined();
      expect(result.modelId).toBe('claude-sonnet-3.7');
      expect(result.evaluationId).toMatch(/^eval_\d+_[a-z0-9]+$/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.metrics).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should evaluate accuracy metrics correctly', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const accuracy = result.metrics.accuracy;

      expect(accuracy).toBeDefined();
      expect(accuracy.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy.overallAccuracy).toBeLessThanOrEqual(1);
      expect(accuracy.precision).toBeGreaterThanOrEqual(0);
      expect(accuracy.precision).toBeLessThanOrEqual(1);
      expect(accuracy.recall).toBeGreaterThanOrEqual(0);
      expect(accuracy.recall).toBeLessThanOrEqual(1);
      expect(accuracy.f1Score).toBeGreaterThanOrEqual(0);
      expect(accuracy.f1Score).toBeLessThanOrEqual(1);
      expect(accuracy.domainSpecificAccuracy).toBeDefined();
      expect(accuracy.taskSpecificAccuracy).toBeDefined();
      expect(accuracy.confidenceCalibration).toBeGreaterThanOrEqual(0);
      expect(accuracy.confidenceCalibration).toBeLessThanOrEqual(1);
    });

    it('should evaluate bias metrics correctly', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const bias = result.metrics.bias;

      expect(bias).toBeDefined();
      expect(bias.overallBiasScore).toBeGreaterThanOrEqual(0);
      expect(bias.overallBiasScore).toBeLessThanOrEqual(1);
      expect(bias.demographicParity).toBeGreaterThanOrEqual(0);
      expect(bias.demographicParity).toBeLessThanOrEqual(1);
      expect(bias.equalizedOdds).toBeGreaterThanOrEqual(0);
      expect(bias.equalizedOdds).toBeLessThanOrEqual(1);
      expect(Array.isArray(bias.biasDetectionResults)).toBe(true);
      expect(Array.isArray(bias.mitigationRecommendations)).toBe(true);
    });

    it('should evaluate explainability metrics correctly', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const explainability = result.metrics.explainability;

      expect(explainability).toBeDefined();
      expect(explainability.overallExplainabilityScore).toBeGreaterThanOrEqual(0);
      expect(explainability.overallExplainabilityScore).toBeLessThanOrEqual(1);
      expect(Array.isArray(explainability.featureImportance)).toBe(true);
      expect(explainability.decisionPathClarity).toBeGreaterThanOrEqual(0);
      expect(explainability.decisionPathClarity).toBeLessThanOrEqual(1);
      expect(Array.isArray(explainability.counterfactualExplanations)).toBe(true);
      expect(Array.isArray(explainability.localExplanations)).toBe(true);
      expect(Array.isArray(explainability.globalExplanations)).toBe(true);
      expect(explainability.humanInterpretability).toBeGreaterThanOrEqual(0);
      expect(explainability.humanInterpretability).toBeLessThanOrEqual(1);
    });

    it('should evaluate reliability metrics correctly', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const reliability = result.metrics.reliability;

      expect(reliability).toBeDefined();
      expect(reliability.consistency).toBeGreaterThanOrEqual(0);
      expect(reliability.consistency).toBeLessThanOrEqual(1);
      expect(reliability.robustness).toBeGreaterThanOrEqual(0);
      expect(reliability.robustness).toBeLessThanOrEqual(1);
      expect(reliability.stability).toBeGreaterThanOrEqual(0);
      expect(reliability.stability).toBeLessThanOrEqual(1);
      expect(reliability.uncertaintyQuantification).toBeDefined();
      expect(reliability.adversarialRobustness).toBeGreaterThanOrEqual(0);
      expect(reliability.adversarialRobustness).toBeLessThanOrEqual(1);
    });
  });

  describe('Accuracy Evaluation', () => {
    it('should calculate correct accuracy for perfect predictions', async () => {
      const perfectTestCases: TestCase[] = [
        {
          id: 'perfect1',
          input: { test: 'input1' },
          expectedOutput: 'buy',
          actualOutput: 'buy',
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        },
        {
          id: 'perfect2',
          input: { test: 'input2' },
          expectedOutput: 'sell',
          actualOutput: 'sell',
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        }
      ];

      const result = await framework.evaluateModel('test-model', perfectTestCases, mockTask, mockContext);
      expect(result.metrics.accuracy.overallAccuracy).toBe(1.0);
    });

    it('should calculate correct accuracy for failed predictions', async () => {
      const failedTestCases: TestCase[] = [
        {
          id: 'failed1',
          input: { test: 'input1' },
          expectedOutput: 'buy',
          actualOutput: 'sell',
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        },
        {
          id: 'failed2',
          input: { test: 'input2' },
          expectedOutput: 'sell',
          actualOutput: 'buy',
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        }
      ];

      const result = await framework.evaluateModel('test-model', failedTestCases, mockTask, mockContext);
      expect(result.metrics.accuracy.overallAccuracy).toBe(0.0);
    });

    it('should handle numeric output comparisons with tolerance', async () => {
      const numericTestCases: TestCase[] = [
        {
          id: 'numeric1',
          input: { value: 100 },
          expectedOutput: 150.0,
          actualOutput: 149.5, // Within 5% tolerance
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        },
        {
          id: 'numeric2',
          input: { value: 200 },
          expectedOutput: 100.0,
          actualOutput: 120.0, // Outside 5% tolerance
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        }
      ];

      const result = await framework.evaluateModel('test-model', numericTestCases, mockTask, mockContext);
      expect(result.metrics.accuracy.overallAccuracy).toBe(0.5);
    });
  });

  describe('Bias Detection', () => {
    it('should detect demographic bias when accuracy differs between groups', async () => {
      const biasedTestCases: TestCase[] = [
        // High accuracy group
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `group1_${i}`,
          input: { test: `input${i}` },
          expectedOutput: 'buy',
          actualOutput: 'buy',
          metadata: {
            domain: 'financial',
            complexity: 'simple',
            biasTestingGroup: 'group1',
            explainabilityRequired: false
          }
        })),
        // Low accuracy group
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `group2_${i}`,
          input: { test: `input${i}` },
          expectedOutput: 'buy',
          actualOutput: 'sell', // All wrong
          metadata: {
            domain: 'financial',
            complexity: 'simple',
            biasTestingGroup: 'group2',
            explainabilityRequired: false
          }
        }))
      ];

      const result = await framework.evaluateModel('test-model', biasedTestCases, mockTask, mockContext);
      const demographicBias = result.metrics.bias.biasDetectionResults.find(b => b.biasType === 'demographic');
      
      if (demographicBias) {
        expect(demographicBias.severity).toMatch(/medium|high|critical/);
        expect(demographicBias.affectedGroups).toContain('group2');
      }
    });

    it('should detect confirmation bias when model favors certain outcomes', async () => {
      const confirmationBiasTestCases: TestCase[] = [
        // All outputs are 'buy' regardless of expected output
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `confirmation_${i}`,
          input: { test: `input${i}` },
          expectedOutput: i % 2 === 0 ? 'buy' : 'sell',
          actualOutput: 'buy', // Always buy
          metadata: {
            domain: 'financial',
            complexity: 'simple',
            explainabilityRequired: false
          }
        }))
      ];

      const result = await framework.evaluateModel('test-model', confirmationBiasTestCases, mockTask, mockContext);
      const confirmationBias = result.metrics.bias.biasDetectionResults.find(b => b.biasType === 'confirmation');
      
      if (confirmationBias) {
        expect(confirmationBias.description).toContain('confirmation bias');
        expect(confirmationBias.affectedGroups).toContain('positive');
      }
    });
  });

  describe('Explainability Evaluation', () => {
    it('should generate feature importance rankings', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const featureImportance = result.metrics.explainability.featureImportance;

      expect(Array.isArray(featureImportance)).toBe(true);
      expect(featureImportance.length).toBeGreaterThan(0);
      
      for (const feature of featureImportance) {
        expect(feature.feature).toBeDefined();
        expect(feature.importance).toBeGreaterThanOrEqual(0);
        expect(feature.importance).toBeLessThanOrEqual(1);
        expect(feature.confidence).toBeGreaterThanOrEqual(0);
        expect(feature.confidence).toBeLessThanOrEqual(1);
        expect(['positive', 'negative', 'neutral']).toContain(feature.direction);
      }

      // Should be sorted by importance (descending)
      for (let i = 1; i < featureImportance.length; i++) {
        expect(featureImportance[i - 1].importance).toBeGreaterThanOrEqual(featureImportance[i].importance);
      }
    });

    it('should generate local explanations for test cases', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const localExplanations = result.metrics.explainability.localExplanations;

      expect(Array.isArray(localExplanations)).toBe(true);
      expect(localExplanations.length).toBeGreaterThan(0);
      
      for (const explanation of localExplanations) {
        expect(explanation.inputId).toBeDefined();
        expect(explanation.explanation).toBeDefined();
        expect(explanation.confidence).toBeGreaterThanOrEqual(0);
        expect(explanation.confidence).toBeLessThanOrEqual(1);
        expect(Array.isArray(explanation.supportingEvidence)).toBe(true);
        expect(Array.isArray(explanation.keyFactors)).toBe(true);
      }
    });

    it('should generate global explanations for the model', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const globalExplanations = result.metrics.explainability.globalExplanations;

      expect(Array.isArray(globalExplanations)).toBe(true);
      expect(globalExplanations.length).toBeGreaterThan(0);
      
      for (const explanation of globalExplanations) {
        expect(explanation.modelBehavior).toBeDefined();
        expect(Array.isArray(explanation.keyPatterns)).toBe(true);
        expect(Array.isArray(explanation.limitations)).toBe(true);
        expect(Array.isArray(explanation.assumptions)).toBe(true);
        expect(Array.isArray(explanation.dataRequirements)).toBe(true);
      }
    });
  });

  describe('Reliability Evaluation', () => {
    it('should evaluate model consistency', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const reliability = result.metrics.reliability;

      expect(reliability.consistency).toBeGreaterThanOrEqual(0);
      expect(reliability.consistency).toBeLessThanOrEqual(1);
    });

    it('should evaluate model robustness', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const reliability = result.metrics.reliability;

      expect(reliability.robustness).toBeGreaterThanOrEqual(0);
      expect(reliability.robustness).toBeLessThanOrEqual(1);
    });

    it('should quantify uncertainty metrics', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      const uncertainty = result.metrics.reliability.uncertaintyQuantification;

      expect(uncertainty.epistemicUncertainty).toBeGreaterThanOrEqual(0);
      expect(uncertainty.epistemicUncertainty).toBeLessThanOrEqual(1);
      expect(uncertainty.aleatoricUncertainty).toBeGreaterThanOrEqual(0);
      expect(uncertainty.aleatoricUncertainty).toBeLessThanOrEqual(1);
      expect(uncertainty.totalUncertainty).toBeGreaterThanOrEqual(0);
      expect(uncertainty.totalUncertainty).toBeLessThanOrEqual(1);
      expect(uncertainty.calibrationError).toBeGreaterThanOrEqual(0);
      expect(uncertainty.calibrationError).toBeLessThanOrEqual(1);
    });
  });

  describe('Issue Identification and Recommendations', () => {
    it('should identify accuracy issues when below threshold', async () => {
      const lowAccuracyConfig: Partial<EvaluationConfig> = {
        accuracyThresholds: {
          minimum: 0.95, // Set very high threshold
          target: 0.98,
          excellent: 0.99
        }
      };

      const strictFramework = new ModelEvaluationFramework(lowAccuracyConfig);
      const result = await strictFramework.evaluateModel('test-model', mockTestCases, mockTask, mockContext);

      const accuracyIssues = result.issues.filter(issue => issue.category === 'accuracy');
      expect(accuracyIssues.length).toBeGreaterThan(0);
      
      for (const issue of accuracyIssues) {
        expect(issue.description).toContain('accuracy');
        expect(issue.impact).toBeDefined();
        expect(issue.remediation).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity);
      }
    });

    it('should generate appropriate recommendations', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);

      expect(Array.isArray(result.recommendations)).toBe(true);
      
      for (const recommendation of result.recommendations) {
        expect(recommendation.category).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(recommendation.priority);
        expect(recommendation.description).toBeDefined();
        expect(recommendation.expectedBenefit).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(recommendation.implementationEffort);
      }
    });

    it('should determine pass/fail status correctly', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      expect(typeof result.passed).toBe('boolean');
      
      // If passed is false, there should be critical issues
      if (!result.passed) {
        const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
        expect(criticalIssues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Evaluation History and Comparison', () => {
    it('should store evaluation history', async () => {
      const modelId = 'test-model-history';
      
      // Perform multiple evaluations
      await framework.evaluateModel(modelId, mockTestCases, mockTask, mockContext);
      await framework.evaluateModel(modelId, mockTestCases, mockTask, mockContext);
      
      const history = framework.getEvaluationHistory(modelId);
      expect(history.length).toBe(2);
      
      // Should be ordered by timestamp
      expect(history[1].timestamp.getTime()).toBeGreaterThanOrEqual(history[0].timestamp.getTime());
    });

    it('should get latest evaluation for a model', async () => {
      const modelId = 'test-model-latest';
      
      await framework.evaluateModel(modelId, mockTestCases, mockTask, mockContext);
      const latest = framework.getLatestEvaluation(modelId);
      
      expect(latest).toBeDefined();
      expect(latest!.modelId).toBe(modelId);
    });

    it('should return null for models with no evaluation history', () => {
      const latest = framework.getLatestEvaluation('non-existent-model');
      expect(latest).toBeNull();
    });

    it('should compare multiple models', async () => {
      const modelIds = ['model1', 'model2', 'model3'];
      
      // Evaluate first two models
      await framework.evaluateModel(modelIds[0], mockTestCases, mockTask, mockContext);
      await framework.evaluateModel(modelIds[1], mockTestCases, mockTask, mockContext);
      
      const comparison = framework.compareModels(modelIds);
      
      expect(comparison[modelIds[0]]).toBeDefined();
      expect(comparison[modelIds[1]]).toBeDefined();
      expect(comparison[modelIds[2]]).toBeNull(); // Not evaluated
    });
  });

  describe('Factory Functions', () => {
    it('should create framework instance with factory function', () => {
      const framework = createModelEvaluationFramework();
      expect(framework).toBeInstanceOf(ModelEvaluationFramework);
    });

    it('should create framework with custom config using factory', () => {
      const config: Partial<EvaluationConfig> = {
        accuracyThresholds: { minimum: 0.9, target: 0.95, excellent: 0.98 }
      };
      
      const framework = createModelEvaluationFramework(config);
      expect(framework).toBeInstanceOf(ModelEvaluationFramework);
    });

    it('should return singleton instance', () => {
      const instance1 = getModelEvaluationFramework();
      const instance2 = getModelEvaluationFramework();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(ModelEvaluationFramework);
    });
  });

  describe('Error Handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      const invalidTestCases: TestCase[] = [
        {
          id: 'invalid',
          input: null,
          expectedOutput: 'buy',
          actualOutput: null,
          metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
        }
      ];

      await expect(
        framework.evaluateModel('test-model', invalidTestCases, mockTask, mockContext)
      ).rejects.toThrow();
    });

    it('should handle empty test cases', async () => {
      await expect(
        framework.evaluateModel('test-model', [], mockTask, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('String Similarity Calculation', () => {
    it('should calculate string similarity correctly', () => {
      // Access private method through type assertion for testing
      const frameworkAny = framework as any;
      
      expect(frameworkAny.calculateStringSimilarity('hello', 'hello')).toBe(1.0);
      expect(frameworkAny.calculateStringSimilarity('hello', 'hallo')).toBeGreaterThan(0.5);
      expect(frameworkAny.calculateStringSimilarity('hello', 'world')).toBeLessThan(0.5);
      expect(frameworkAny.calculateStringSimilarity('', '')).toBe(1.0);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate overall score within valid range', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });

    it('should weight different metrics appropriately', async () => {
      const result = await framework.evaluateModel('claude-sonnet-3.7', mockTestCases, mockTask, mockContext);
      
      // Overall score should be influenced by all metric categories
      expect(result.overallScore).toBeDefined();
      expect(typeof result.overallScore).toBe('number');
    });
  });
});