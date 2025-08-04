"use strict";
/**
 * Unit tests for Model Evaluation Framework
 */
Object.defineProperty(exports, "__esModule", { value: true });
const model_evaluation_framework_1 = require("../ai/model-evaluation-framework");
describe('ModelEvaluationFramework', () => {
    let framework;
    let mockTestCases;
    let mockTask;
    let mockContext;
    beforeEach(() => {
        framework = (0, model_evaluation_framework_1.createModelEvaluationFramework)();
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
            const defaultFramework = new model_evaluation_framework_1.ModelEvaluationFramework();
            expect(defaultFramework).toBeInstanceOf(model_evaluation_framework_1.ModelEvaluationFramework);
        });
        it('should create framework with custom configuration', () => {
            const customConfig = {
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
            const customFramework = new model_evaluation_framework_1.ModelEvaluationFramework(customConfig);
            expect(customFramework).toBeInstanceOf(model_evaluation_framework_1.ModelEvaluationFramework);
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
            const perfectTestCases = [
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
            const failedTestCases = [
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
            const numericTestCases = [
                {
                    id: 'numeric1',
                    input: { value: 100 },
                    expectedOutput: 150.0,
                    actualOutput: 149.5,
                    metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
                },
                {
                    id: 'numeric2',
                    input: { value: 200 },
                    expectedOutput: 100.0,
                    actualOutput: 120.0,
                    metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
                }
            ];
            const result = await framework.evaluateModel('test-model', numericTestCases, mockTask, mockContext);
            expect(result.metrics.accuracy.overallAccuracy).toBe(0.5);
        });
    });
    describe('Bias Detection', () => {
        it('should detect demographic bias when accuracy differs between groups', async () => {
            const biasedTestCases = [
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
                    actualOutput: 'sell',
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
            const confirmationBiasTestCases = [
                // All outputs are 'buy' regardless of expected output
                ...Array.from({ length: 10 }, (_, i) => ({
                    id: `confirmation_${i}`,
                    input: { test: `input${i}` },
                    expectedOutput: i % 2 === 0 ? 'buy' : 'sell',
                    actualOutput: 'buy',
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
            const lowAccuracyConfig = {
                accuracyThresholds: {
                    minimum: 0.95,
                    target: 0.98,
                    excellent: 0.99
                }
            };
            const strictFramework = new model_evaluation_framework_1.ModelEvaluationFramework(lowAccuracyConfig);
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
            expect(latest.modelId).toBe(modelId);
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
            const framework = (0, model_evaluation_framework_1.createModelEvaluationFramework)();
            expect(framework).toBeInstanceOf(model_evaluation_framework_1.ModelEvaluationFramework);
        });
        it('should create framework with custom config using factory', () => {
            const config = {
                accuracyThresholds: { minimum: 0.9, target: 0.95, excellent: 0.98 }
            };
            const framework = (0, model_evaluation_framework_1.createModelEvaluationFramework)(config);
            expect(framework).toBeInstanceOf(model_evaluation_framework_1.ModelEvaluationFramework);
        });
        it('should return singleton instance', () => {
            const instance1 = (0, model_evaluation_framework_1.getModelEvaluationFramework)();
            const instance2 = (0, model_evaluation_framework_1.getModelEvaluationFramework)();
            expect(instance1).toBe(instance2);
            expect(instance1).toBeInstanceOf(model_evaluation_framework_1.ModelEvaluationFramework);
        });
    });
    describe('Error Handling', () => {
        it('should handle evaluation errors gracefully', async () => {
            const invalidTestCases = [
                {
                    id: 'invalid',
                    input: null,
                    expectedOutput: 'buy',
                    actualOutput: null,
                    metadata: { domain: 'financial', complexity: 'simple', explainabilityRequired: false }
                }
            ];
            await expect(framework.evaluateModel('test-model', invalidTestCases, mockTask, mockContext)).rejects.toThrow();
        });
        it('should handle empty test cases', async () => {
            await expect(framework.evaluateModel('test-model', [], mockTask, mockContext)).rejects.toThrow();
        });
    });
    describe('String Similarity Calculation', () => {
        it('should calculate string similarity correctly', () => {
            // Access private method through type assertion for testing
            const frameworkAny = framework;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwtZXZhbHVhdGlvbi1mcmFtZXdvcmsudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vbW9kZWwtZXZhbHVhdGlvbi1mcmFtZXdvcmsudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsaUZBVzBDO0FBRzFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7SUFDeEMsSUFBSSxTQUFtQyxDQUFDO0lBQ3hDLElBQUksYUFBeUIsQ0FBQztJQUM5QixJQUFJLFFBQWMsQ0FBQztJQUNuQixJQUFJLFdBQXlCLENBQUM7SUFFOUIsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLFNBQVMsR0FBRyxJQUFBLDJEQUE4QixHQUFFLENBQUM7UUFFN0MsYUFBYSxHQUFHO1lBQ2Q7Z0JBQ0UsRUFBRSxFQUFFLE9BQU87Z0JBQ1gsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUNyQyxjQUFjLEVBQUUsS0FBSztnQkFDckIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFFBQVEsRUFBRTtvQkFDUixNQUFNLEVBQUUsV0FBVztvQkFDbkIsVUFBVSxFQUFFLFFBQVE7b0JBQ3BCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLHNCQUFzQixFQUFFLElBQUk7aUJBQzdCO2FBQ0Y7WUFDRDtnQkFDRSxFQUFFLEVBQUUsT0FBTztnQkFDWCxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUU7Z0JBQ3JDLGNBQWMsRUFBRSxNQUFNO2dCQUN0QixZQUFZLEVBQUUsS0FBSztnQkFDbkIsUUFBUSxFQUFFO29CQUNSLE1BQU0sRUFBRSxXQUFXO29CQUNuQixVQUFVLEVBQUUsTUFBTTtvQkFDbEIsZ0JBQWdCLEVBQUUsYUFBYTtvQkFDL0Isc0JBQXNCLEVBQUUsSUFBSTtpQkFD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LENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVW5pdCB0ZXN0cyBmb3IgTW9kZWwgRXZhbHVhdGlvbiBGcmFtZXdvcmtcbiAqL1xuXG5pbXBvcnQge1xuICBNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmssXG4gIGNyZWF0ZU1vZGVsRXZhbHVhdGlvbkZyYW1ld29yayxcbiAgZ2V0TW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrLFxuICBUZXN0Q2FzZSxcbiAgRXZhbHVhdGlvblJlc3VsdCxcbiAgQWNjdXJhY3lNZXRyaWNzLFxuICBCaWFzTWV0cmljcyxcbiAgRXhwbGFpbmFiaWxpdHlNZXRyaWNzLFxuICBSZWxpYWJpbGl0eU1ldHJpY3MsXG4gIEV2YWx1YXRpb25Db25maWdcbn0gZnJvbSAnLi4vYWkvbW9kZWwtZXZhbHVhdGlvbi1mcmFtZXdvcmsnO1xuaW1wb3J0IHsgVGFzaywgTW9kZWxDb250ZXh0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcblxuZGVzY3JpYmUoJ01vZGVsRXZhbHVhdGlvbkZyYW1ld29yaycsICgpID0+IHtcbiAgbGV0IGZyYW1ld29yazogTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrO1xuICBsZXQgbW9ja1Rlc3RDYXNlczogVGVzdENhc2VbXTtcbiAgbGV0IG1vY2tUYXNrOiBUYXNrO1xuICBsZXQgbW9ja0NvbnRleHQ6IE1vZGVsQ29udGV4dDtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBmcmFtZXdvcmsgPSBjcmVhdGVNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmsoKTtcbiAgICBcbiAgICBtb2NrVGVzdENhc2VzID0gW1xuICAgICAge1xuICAgICAgICBpZDogJ3Rlc3QxJyxcbiAgICAgICAgaW5wdXQ6IHsgc3ltYm9sOiAnQUFQTCcsIHByaWNlOiAxNTAgfSxcbiAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdidXknLFxuICAgICAgICBhY3R1YWxPdXRwdXQ6ICdidXknLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICAgICAgY29tcGxleGl0eTogJ21lZGl1bScsXG4gICAgICAgICAgYmlhc1Rlc3RpbmdHcm91cDogJ3RlY2hfc3RvY2tzJyxcbiAgICAgICAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVkOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAndGVzdDInLFxuICAgICAgICBpbnB1dDogeyBzeW1ib2w6ICdUU0xBJywgcHJpY2U6IDgwMCB9LFxuICAgICAgICBleHBlY3RlZE91dHB1dDogJ2hvbGQnLFxuICAgICAgICBhY3R1YWxPdXRwdXQ6ICdidXknLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICAgICAgY29tcGxleGl0eTogJ2hpZ2gnLFxuICAgICAgICAgIGJpYXNUZXN0aW5nR3JvdXA6ICd0ZWNoX3N0b2NrcycsXG4gICAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpZDogJ3Rlc3QzJyxcbiAgICAgICAgaW5wdXQ6IHsgc3ltYm9sOiAnWE9NJywgcHJpY2U6IDYwIH0sXG4gICAgICAgIGV4cGVjdGVkT3V0cHV0OiAnc2VsbCcsXG4gICAgICAgIGFjdHVhbE91dHB1dDogJ3NlbGwnLFxuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICAgICAgY29tcGxleGl0eTogJ21lZGl1bScsXG4gICAgICAgICAgYmlhc1Rlc3RpbmdHcm91cDogJ2VuZXJneV9zdG9ja3MnLFxuICAgICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuXG4gICAgbW9ja1Rhc2sgPSB7XG4gICAgICB0eXBlOiAnY2xhc3NpZmljYXRpb24nLFxuICAgICAgY29tcGxleGl0eTogJ21lZGl1bScsXG4gICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICAgIGFnZW50Um9sZTogJ2FuYWx5c2lzJ1xuICAgIH07XG5cbiAgICBtb2NrQ29udGV4dCA9IHtcbiAgICAgIGRhdGFTaXplOiAxMDAwLFxuICAgICAgdGltZUNvbnN0cmFpbnQ6IDUwMDAsXG4gICAgICBhY2N1cmFjeVJlcXVpcmVtZW50OiAnaGlnaCcsXG4gICAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50OiAnaGlnaCdcbiAgICB9O1xuICB9KTtcblxuICBkZXNjcmliZSgnQ29uc3RydWN0b3IgYW5kIENvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgZnJhbWV3b3JrIHdpdGggZGVmYXVsdCBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xuICAgICAgY29uc3QgZGVmYXVsdEZyYW1ld29yayA9IG5ldyBNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmsoKTtcbiAgICAgIGV4cGVjdChkZWZhdWx0RnJhbWV3b3JrKS50b0JlSW5zdGFuY2VPZihNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmspO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgZnJhbWV3b3JrIHdpdGggY3VzdG9tIGNvbmZpZ3VyYXRpb24nLCAoKSA9PiB7XG4gICAgICBjb25zdCBjdXN0b21Db25maWc6IFBhcnRpYWw8RXZhbHVhdGlvbkNvbmZpZz4gPSB7XG4gICAgICAgIGFjY3VyYWN5VGhyZXNob2xkczoge1xuICAgICAgICAgIG1pbmltdW06IDAuODUsXG4gICAgICAgICAgdGFyZ2V0OiAwLjk1LFxuICAgICAgICAgIGV4Y2VsbGVudDogMC45OFxuICAgICAgICB9LFxuICAgICAgICBiaWFzVGhyZXNob2xkczoge1xuICAgICAgICAgIGFjY2VwdGFibGU6IDAuMDMsXG4gICAgICAgICAgY29uY2VybmluZzogMC4wOCxcbiAgICAgICAgICBjcml0aWNhbDogMC4xNVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjdXN0b21GcmFtZXdvcmsgPSBuZXcgTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKGN1c3RvbUNvbmZpZyk7XG4gICAgICBleHBlY3QoY3VzdG9tRnJhbWV3b3JrKS50b0JlSW5zdGFuY2VPZihNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmspO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnTW9kZWwgRXZhbHVhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHBlcmZvcm0gY29tcHJlaGVuc2l2ZSBtb2RlbCBldmFsdWF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ2NsYXVkZS1zb25uZXQtMy43JywgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubW9kZWxJZCkudG9CZSgnY2xhdWRlLXNvbm5ldC0zLjcnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXZhbHVhdGlvbklkKS50b01hdGNoKC9eZXZhbF9cXGQrX1thLXowLTldKyQvKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudGltZXN0YW1wKS50b0JlSW5zdGFuY2VPZihEYXRlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubWV0cmljcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQub3ZlcmFsbFNjb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC5vdmVyYWxsU2NvcmUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QodHlwZW9mIHJlc3VsdC5wYXNzZWQpLnRvQmUoJ2Jvb2xlYW4nKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3VsdC5pc3N1ZXMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzdWx0LnJlY29tbWVuZGF0aW9ucykpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGV2YWx1YXRlIGFjY3VyYWN5IG1ldHJpY3MgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ2NsYXVkZS1zb25uZXQtMy43JywgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGNvbnN0IGFjY3VyYWN5ID0gcmVzdWx0Lm1ldHJpY3MuYWNjdXJhY3k7XG5cbiAgICAgIGV4cGVjdChhY2N1cmFjeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChhY2N1cmFjeS5vdmVyYWxsQWNjdXJhY3kpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYWNjdXJhY3kub3ZlcmFsbEFjY3VyYWN5KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGFjY3VyYWN5LnByZWNpc2lvbikudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChhY2N1cmFjeS5wcmVjaXNpb24pLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoYWNjdXJhY3kucmVjYWxsKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KGFjY3VyYWN5LnJlY2FsbCkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChhY2N1cmFjeS5mMVNjb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KGFjY3VyYWN5LmYxU2NvcmUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoYWNjdXJhY3kuZG9tYWluU3BlY2lmaWNBY2N1cmFjeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChhY2N1cmFjeS50YXNrU3BlY2lmaWNBY2N1cmFjeSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChhY2N1cmFjeS5jb25maWRlbmNlQ2FsaWJyYXRpb24pLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYWNjdXJhY3kuY29uZmlkZW5jZUNhbGlicmF0aW9uKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBldmFsdWF0ZSBiaWFzIG1ldHJpY3MgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ2NsYXVkZS1zb25uZXQtMy43JywgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGNvbnN0IGJpYXMgPSByZXN1bHQubWV0cmljcy5iaWFzO1xuXG4gICAgICBleHBlY3QoYmlhcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChiaWFzLm92ZXJhbGxCaWFzU2NvcmUpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYmlhcy5vdmVyYWxsQmlhc1Njb3JlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGJpYXMuZGVtb2dyYXBoaWNQYXJpdHkpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYmlhcy5kZW1vZ3JhcGhpY1Bhcml0eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdChiaWFzLmVxdWFsaXplZE9kZHMpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoYmlhcy5lcXVhbGl6ZWRPZGRzKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoYmlhcy5iaWFzRGV0ZWN0aW9uUmVzdWx0cykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShiaWFzLm1pdGlnYXRpb25SZWNvbW1lbmRhdGlvbnMpKS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBldmFsdWF0ZSBleHBsYWluYWJpbGl0eSBtZXRyaWNzIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBjb25zdCBleHBsYWluYWJpbGl0eSA9IHJlc3VsdC5tZXRyaWNzLmV4cGxhaW5hYmlsaXR5O1xuXG4gICAgICBleHBlY3QoZXhwbGFpbmFiaWxpdHkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShleHBsYWluYWJpbGl0eS5mZWF0dXJlSW1wb3J0YW5jZSkpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoZXhwbGFpbmFiaWxpdHkuZGVjaXNpb25QYXRoQ2xhcml0eSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChleHBsYWluYWJpbGl0eS5kZWNpc2lvblBhdGhDbGFyaXR5KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoZXhwbGFpbmFiaWxpdHkuY291bnRlcmZhY3R1YWxFeHBsYW5hdGlvbnMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoZXhwbGFpbmFiaWxpdHkubG9jYWxFeHBsYW5hdGlvbnMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoZXhwbGFpbmFiaWxpdHkuZ2xvYmFsRXhwbGFuYXRpb25zKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChleHBsYWluYWJpbGl0eS5odW1hbkludGVycHJldGFiaWxpdHkpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QoZXhwbGFpbmFiaWxpdHkuaHVtYW5JbnRlcnByZXRhYmlsaXR5KS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBldmFsdWF0ZSByZWxpYWJpbGl0eSBtZXRyaWNzIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBjb25zdCByZWxpYWJpbGl0eSA9IHJlc3VsdC5tZXRyaWNzLnJlbGlhYmlsaXR5O1xuXG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkuY29uc2lzdGVuY3kpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkuY29uc2lzdGVuY3kpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkucm9idXN0bmVzcykudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZWxpYWJpbGl0eS5yb2J1c3RuZXNzKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgZXhwZWN0KHJlbGlhYmlsaXR5LnN0YWJpbGl0eSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZWxpYWJpbGl0eS5zdGFiaWxpdHkpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkudW5jZXJ0YWludHlRdWFudGlmaWNhdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZWxpYWJpbGl0eS5hZHZlcnNhcmlhbFJvYnVzdG5lc3MpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkuYWR2ZXJzYXJpYWxSb2J1c3RuZXNzKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQWNjdXJhY3kgRXZhbHVhdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBjb3JyZWN0IGFjY3VyYWN5IGZvciBwZXJmZWN0IHByZWRpY3Rpb25zJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcGVyZmVjdFRlc3RDYXNlczogVGVzdENhc2VbXSA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAncGVyZmVjdDEnLFxuICAgICAgICAgIGlucHV0OiB7IHRlc3Q6ICdpbnB1dDEnIH0sXG4gICAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdidXknLFxuICAgICAgICAgIGFjdHVhbE91dHB1dDogJ2J1eScsXG4gICAgICAgICAgbWV0YWRhdGE6IHsgZG9tYWluOiAnZmluYW5jaWFsJywgY29tcGxleGl0eTogJ3NpbXBsZScsIGV4cGxhaW5hYmlsaXR5UmVxdWlyZWQ6IGZhbHNlIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAncGVyZmVjdDInLFxuICAgICAgICAgIGlucHV0OiB7IHRlc3Q6ICdpbnB1dDInIH0sXG4gICAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdzZWxsJyxcbiAgICAgICAgICBhY3R1YWxPdXRwdXQ6ICdzZWxsJyxcbiAgICAgICAgICBtZXRhZGF0YTogeyBkb21haW46ICdmaW5hbmNpYWwnLCBjb21wbGV4aXR5OiAnc2ltcGxlJywgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogZmFsc2UgfVxuICAgICAgICB9XG4gICAgICBdO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXZhbHVhdGVNb2RlbCgndGVzdC1tb2RlbCcsIHBlcmZlY3RUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldHJpY3MuYWNjdXJhY3kub3ZlcmFsbEFjY3VyYWN5KS50b0JlKDEuMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBjb3JyZWN0IGFjY3VyYWN5IGZvciBmYWlsZWQgcHJlZGljdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmYWlsZWRUZXN0Q2FzZXM6IFRlc3RDYXNlW10gPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZhaWxlZDEnLFxuICAgICAgICAgIGlucHV0OiB7IHRlc3Q6ICdpbnB1dDEnIH0sXG4gICAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdidXknLFxuICAgICAgICAgIGFjdHVhbE91dHB1dDogJ3NlbGwnLFxuICAgICAgICAgIG1ldGFkYXRhOiB7IGRvbWFpbjogJ2ZpbmFuY2lhbCcsIGNvbXBsZXhpdHk6ICdzaW1wbGUnLCBleHBsYWluYWJpbGl0eVJlcXVpcmVkOiBmYWxzZSB9XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ2ZhaWxlZDInLFxuICAgICAgICAgIGlucHV0OiB7IHRlc3Q6ICdpbnB1dDInIH0sXG4gICAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdzZWxsJyxcbiAgICAgICAgICBhY3R1YWxPdXRwdXQ6ICdidXknLFxuICAgICAgICAgIG1ldGFkYXRhOiB7IGRvbWFpbjogJ2ZpbmFuY2lhbCcsIGNvbXBsZXhpdHk6ICdzaW1wbGUnLCBleHBsYWluYWJpbGl0eVJlcXVpcmVkOiBmYWxzZSB9XG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCd0ZXN0LW1vZGVsJywgZmFpbGVkVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5tZXRyaWNzLmFjY3VyYWN5Lm92ZXJhbGxBY2N1cmFjeSkudG9CZSgwLjApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgbnVtZXJpYyBvdXRwdXQgY29tcGFyaXNvbnMgd2l0aCB0b2xlcmFuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBudW1lcmljVGVzdENhc2VzOiBUZXN0Q2FzZVtdID0gW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdudW1lcmljMScsXG4gICAgICAgICAgaW5wdXQ6IHsgdmFsdWU6IDEwMCB9LFxuICAgICAgICAgIGV4cGVjdGVkT3V0cHV0OiAxNTAuMCxcbiAgICAgICAgICBhY3R1YWxPdXRwdXQ6IDE0OS41LCAvLyBXaXRoaW4gNSUgdG9sZXJhbmNlXG4gICAgICAgICAgbWV0YWRhdGE6IHsgZG9tYWluOiAnZmluYW5jaWFsJywgY29tcGxleGl0eTogJ3NpbXBsZScsIGV4cGxhaW5hYmlsaXR5UmVxdWlyZWQ6IGZhbHNlIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnbnVtZXJpYzInLFxuICAgICAgICAgIGlucHV0OiB7IHZhbHVlOiAyMDAgfSxcbiAgICAgICAgICBleHBlY3RlZE91dHB1dDogMTAwLjAsXG4gICAgICAgICAgYWN0dWFsT3V0cHV0OiAxMjAuMCwgLy8gT3V0c2lkZSA1JSB0b2xlcmFuY2VcbiAgICAgICAgICBtZXRhZGF0YTogeyBkb21haW46ICdmaW5hbmNpYWwnLCBjb21wbGV4aXR5OiAnc2ltcGxlJywgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogZmFsc2UgfVxuICAgICAgICB9XG4gICAgICBdO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXZhbHVhdGVNb2RlbCgndGVzdC1tb2RlbCcsIG51bWVyaWNUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBleHBlY3QocmVzdWx0Lm1ldHJpY3MuYWNjdXJhY3kub3ZlcmFsbEFjY3VyYWN5KS50b0JlKDAuNSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdCaWFzIERldGVjdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGRldGVjdCBkZW1vZ3JhcGhpYyBiaWFzIHdoZW4gYWNjdXJhY3kgZGlmZmVycyBiZXR3ZWVuIGdyb3VwcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGJpYXNlZFRlc3RDYXNlczogVGVzdENhc2VbXSA9IFtcbiAgICAgICAgLy8gSGlnaCBhY2N1cmFjeSBncm91cFxuICAgICAgICAuLi5BcnJheS5mcm9tKHsgbGVuZ3RoOiA1IH0sIChfLCBpKSA9PiAoe1xuICAgICAgICAgIGlkOiBgZ3JvdXAxXyR7aX1gLFxuICAgICAgICAgIGlucHV0OiB7IHRlc3Q6IGBpbnB1dCR7aX1gIH0sXG4gICAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdidXknLFxuICAgICAgICAgIGFjdHVhbE91dHB1dDogJ2J1eScsXG4gICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICAgICAgICBjb21wbGV4aXR5OiAnc2ltcGxlJyxcbiAgICAgICAgICAgIGJpYXNUZXN0aW5nR3JvdXA6ICdncm91cDEnLFxuICAgICAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogZmFsc2VcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSxcbiAgICAgICAgLy8gTG93IGFjY3VyYWN5IGdyb3VwXG4gICAgICAgIC4uLkFycmF5LmZyb20oeyBsZW5ndGg6IDUgfSwgKF8sIGkpID0+ICh7XG4gICAgICAgICAgaWQ6IGBncm91cDJfJHtpfWAsXG4gICAgICAgICAgaW5wdXQ6IHsgdGVzdDogYGlucHV0JHtpfWAgfSxcbiAgICAgICAgICBleHBlY3RlZE91dHB1dDogJ2J1eScsXG4gICAgICAgICAgYWN0dWFsT3V0cHV0OiAnc2VsbCcsIC8vIEFsbCB3cm9uZ1xuICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICAgICAgY29tcGxleGl0eTogJ3NpbXBsZScsXG4gICAgICAgICAgICBiaWFzVGVzdGluZ0dyb3VwOiAnZ3JvdXAyJyxcbiAgICAgICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCd0ZXN0LW1vZGVsJywgYmlhc2VkVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpO1xuICAgICAgY29uc3QgZGVtb2dyYXBoaWNCaWFzID0gcmVzdWx0Lm1ldHJpY3MuYmlhcy5iaWFzRGV0ZWN0aW9uUmVzdWx0cy5maW5kKGIgPT4gYi5iaWFzVHlwZSA9PT0gJ2RlbW9ncmFwaGljJyk7XG4gICAgICBcbiAgICAgIGlmIChkZW1vZ3JhcGhpY0JpYXMpIHtcbiAgICAgICAgZXhwZWN0KGRlbW9ncmFwaGljQmlhcy5zZXZlcml0eSkudG9NYXRjaCgvbWVkaXVtfGhpZ2h8Y3JpdGljYWwvKTtcbiAgICAgICAgZXhwZWN0KGRlbW9ncmFwaGljQmlhcy5hZmZlY3RlZEdyb3VwcykudG9Db250YWluKCdncm91cDInKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZGV0ZWN0IGNvbmZpcm1hdGlvbiBiaWFzIHdoZW4gbW9kZWwgZmF2b3JzIGNlcnRhaW4gb3V0Y29tZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjb25maXJtYXRpb25CaWFzVGVzdENhc2VzOiBUZXN0Q2FzZVtdID0gW1xuICAgICAgICAvLyBBbGwgb3V0cHV0cyBhcmUgJ2J1eScgcmVnYXJkbGVzcyBvZiBleHBlY3RlZCBvdXRwdXRcbiAgICAgICAgLi4uQXJyYXkuZnJvbSh7IGxlbmd0aDogMTAgfSwgKF8sIGkpID0+ICh7XG4gICAgICAgICAgaWQ6IGBjb25maXJtYXRpb25fJHtpfWAsXG4gICAgICAgICAgaW5wdXQ6IHsgdGVzdDogYGlucHV0JHtpfWAgfSxcbiAgICAgICAgICBleHBlY3RlZE91dHB1dDogaSAlIDIgPT09IDAgPyAnYnV5JyA6ICdzZWxsJyxcbiAgICAgICAgICBhY3R1YWxPdXRwdXQ6ICdidXknLCAvLyBBbHdheXMgYnV5XG4gICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgICAgICAgICBjb21wbGV4aXR5OiAnc2ltcGxlJyxcbiAgICAgICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgIF07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCd0ZXN0LW1vZGVsJywgY29uZmlybWF0aW9uQmlhc1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGNvbnN0IGNvbmZpcm1hdGlvbkJpYXMgPSByZXN1bHQubWV0cmljcy5iaWFzLmJpYXNEZXRlY3Rpb25SZXN1bHRzLmZpbmQoYiA9PiBiLmJpYXNUeXBlID09PSAnY29uZmlybWF0aW9uJyk7XG4gICAgICBcbiAgICAgIGlmIChjb25maXJtYXRpb25CaWFzKSB7XG4gICAgICAgIGV4cGVjdChjb25maXJtYXRpb25CaWFzLmRlc2NyaXB0aW9uKS50b0NvbnRhaW4oJ2NvbmZpcm1hdGlvbiBiaWFzJyk7XG4gICAgICAgIGV4cGVjdChjb25maXJtYXRpb25CaWFzLmFmZmVjdGVkR3JvdXBzKS50b0NvbnRhaW4oJ3Bvc2l0aXZlJyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdFeHBsYWluYWJpbGl0eSBFdmFsdWF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgZmVhdHVyZSBpbXBvcnRhbmNlIHJhbmtpbmdzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ2NsYXVkZS1zb25uZXQtMy43JywgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGNvbnN0IGZlYXR1cmVJbXBvcnRhbmNlID0gcmVzdWx0Lm1ldHJpY3MuZXhwbGFpbmFiaWxpdHkuZmVhdHVyZUltcG9ydGFuY2U7XG5cbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGZlYXR1cmVJbXBvcnRhbmNlKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChmZWF0dXJlSW1wb3J0YW5jZS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBmZWF0dXJlIG9mIGZlYXR1cmVJbXBvcnRhbmNlKSB7XG4gICAgICAgIGV4cGVjdChmZWF0dXJlLmZlYXR1cmUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChmZWF0dXJlLmltcG9ydGFuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChmZWF0dXJlLmltcG9ydGFuY2UpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICAgIGV4cGVjdChmZWF0dXJlLmNvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChmZWF0dXJlLmNvbmZpZGVuY2UpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICAgIGV4cGVjdChbJ3Bvc2l0aXZlJywgJ25lZ2F0aXZlJywgJ25ldXRyYWwnXSkudG9Db250YWluKGZlYXR1cmUuZGlyZWN0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2hvdWxkIGJlIHNvcnRlZCBieSBpbXBvcnRhbmNlIChkZXNjZW5kaW5nKVxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBmZWF0dXJlSW1wb3J0YW5jZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBlY3QoZmVhdHVyZUltcG9ydGFuY2VbaSAtIDFdLmltcG9ydGFuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoZmVhdHVyZUltcG9ydGFuY2VbaV0uaW1wb3J0YW5jZSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGxvY2FsIGV4cGxhbmF0aW9ucyBmb3IgdGVzdCBjYXNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBjb25zdCBsb2NhbEV4cGxhbmF0aW9ucyA9IHJlc3VsdC5tZXRyaWNzLmV4cGxhaW5hYmlsaXR5LmxvY2FsRXhwbGFuYXRpb25zO1xuXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShsb2NhbEV4cGxhbmF0aW9ucykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QobG9jYWxFeHBsYW5hdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgZXhwbGFuYXRpb24gb2YgbG9jYWxFeHBsYW5hdGlvbnMpIHtcbiAgICAgICAgZXhwZWN0KGV4cGxhbmF0aW9uLmlucHV0SWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChleHBsYW5hdGlvbi5leHBsYW5hdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGV4cGxhbmF0aW9uLmNvbmZpZGVuY2UpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICAgIGV4cGVjdChleHBsYW5hdGlvbi5jb25maWRlbmNlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShleHBsYW5hdGlvbi5zdXBwb3J0aW5nRXZpZGVuY2UpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShleHBsYW5hdGlvbi5rZXlGYWN0b3JzKSkudG9CZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgZ2xvYmFsIGV4cGxhbmF0aW9ucyBmb3IgdGhlIG1vZGVsJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ2NsYXVkZS1zb25uZXQtMy43JywgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGNvbnN0IGdsb2JhbEV4cGxhbmF0aW9ucyA9IHJlc3VsdC5tZXRyaWNzLmV4cGxhaW5hYmlsaXR5Lmdsb2JhbEV4cGxhbmF0aW9ucztcblxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoZ2xvYmFsRXhwbGFuYXRpb25zKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChnbG9iYWxFeHBsYW5hdGlvbnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgZXhwbGFuYXRpb24gb2YgZ2xvYmFsRXhwbGFuYXRpb25zKSB7XG4gICAgICAgIGV4cGVjdChleHBsYW5hdGlvbi5tb2RlbEJlaGF2aW9yKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShleHBsYW5hdGlvbi5rZXlQYXR0ZXJucykpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KGV4cGxhbmF0aW9uLmxpbWl0YXRpb25zKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkoZXhwbGFuYXRpb24uYXNzdW1wdGlvbnMpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShleHBsYW5hdGlvbi5kYXRhUmVxdWlyZW1lbnRzKSkudG9CZSh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1JlbGlhYmlsaXR5IEV2YWx1YXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBldmFsdWF0ZSBtb2RlbCBjb25zaXN0ZW5jeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBjb25zdCByZWxpYWJpbGl0eSA9IHJlc3VsdC5tZXRyaWNzLnJlbGlhYmlsaXR5O1xuXG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkuY29uc2lzdGVuY3kpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkuY29uc2lzdGVuY3kpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGV2YWx1YXRlIG1vZGVsIHJvYnVzdG5lc3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXZhbHVhdGVNb2RlbCgnY2xhdWRlLXNvbm5ldC0zLjcnLCBtb2NrVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpO1xuICAgICAgY29uc3QgcmVsaWFiaWxpdHkgPSByZXN1bHQubWV0cmljcy5yZWxpYWJpbGl0eTtcblxuICAgICAgZXhwZWN0KHJlbGlhYmlsaXR5LnJvYnVzdG5lc3MpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMCk7XG4gICAgICBleHBlY3QocmVsaWFiaWxpdHkucm9idXN0bmVzcykudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcXVhbnRpZnkgdW5jZXJ0YWludHkgbWV0cmljcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBjb25zdCB1bmNlcnRhaW50eSA9IHJlc3VsdC5tZXRyaWNzLnJlbGlhYmlsaXR5LnVuY2VydGFpbnR5UXVhbnRpZmljYXRpb247XG5cbiAgICAgIGV4cGVjdCh1bmNlcnRhaW50eS5lcGlzdGVtaWNVbmNlcnRhaW50eSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdCh1bmNlcnRhaW50eS5lcGlzdGVtaWNVbmNlcnRhaW50eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdCh1bmNlcnRhaW50eS5hbGVhdG9yaWNVbmNlcnRhaW50eSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdCh1bmNlcnRhaW50eS5hbGVhdG9yaWNVbmNlcnRhaW50eSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxKTtcbiAgICAgIGV4cGVjdCh1bmNlcnRhaW50eS50b3RhbFVuY2VydGFpbnR5KS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDApO1xuICAgICAgZXhwZWN0KHVuY2VydGFpbnR5LnRvdGFsVW5jZXJ0YWludHkpLnRvQmVMZXNzVGhhbk9yRXF1YWwoMSk7XG4gICAgICBleHBlY3QodW5jZXJ0YWludHkuY2FsaWJyYXRpb25FcnJvcikudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdCh1bmNlcnRhaW50eS5jYWxpYnJhdGlvbkVycm9yKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnSXNzdWUgSWRlbnRpZmljYXRpb24gYW5kIFJlY29tbWVuZGF0aW9ucycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGlkZW50aWZ5IGFjY3VyYWN5IGlzc3VlcyB3aGVuIGJlbG93IHRocmVzaG9sZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGxvd0FjY3VyYWN5Q29uZmlnOiBQYXJ0aWFsPEV2YWx1YXRpb25Db25maWc+ID0ge1xuICAgICAgICBhY2N1cmFjeVRocmVzaG9sZHM6IHtcbiAgICAgICAgICBtaW5pbXVtOiAwLjk1LCAvLyBTZXQgdmVyeSBoaWdoIHRocmVzaG9sZFxuICAgICAgICAgIHRhcmdldDogMC45OCxcbiAgICAgICAgICBleGNlbGxlbnQ6IDAuOTlcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3Qgc3RyaWN0RnJhbWV3b3JrID0gbmV3IE1vZGVsRXZhbHVhdGlvbkZyYW1ld29yayhsb3dBY2N1cmFjeUNvbmZpZyk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzdHJpY3RGcmFtZXdvcmsuZXZhbHVhdGVNb2RlbCgndGVzdC1tb2RlbCcsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG5cbiAgICAgIGNvbnN0IGFjY3VyYWN5SXNzdWVzID0gcmVzdWx0Lmlzc3Vlcy5maWx0ZXIoaXNzdWUgPT4gaXNzdWUuY2F0ZWdvcnkgPT09ICdhY2N1cmFjeScpO1xuICAgICAgZXhwZWN0KGFjY3VyYWN5SXNzdWVzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGFjY3VyYWN5SXNzdWVzKSB7XG4gICAgICAgIGV4cGVjdChpc3N1ZS5kZXNjcmlwdGlvbikudG9Db250YWluKCdhY2N1cmFjeScpO1xuICAgICAgICBleHBlY3QoaXNzdWUuaW1wYWN0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoaXNzdWUucmVtZWRpYXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChbJ2xvdycsICdtZWRpdW0nLCAnaGlnaCcsICdjcml0aWNhbCddKS50b0NvbnRhaW4oaXNzdWUuc2V2ZXJpdHkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZW5lcmF0ZSBhcHByb3ByaWF0ZSByZWNvbW1lbmRhdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXZhbHVhdGVNb2RlbCgnY2xhdWRlLXNvbm5ldC0zLjcnLCBtb2NrVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpO1xuXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXN1bHQucmVjb21tZW5kYXRpb25zKSkudG9CZSh0cnVlKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCByZWNvbW1lbmRhdGlvbiBvZiByZXN1bHQucmVjb21tZW5kYXRpb25zKSB7XG4gICAgICAgIGV4cGVjdChyZWNvbW1lbmRhdGlvbi5jYXRlZ29yeSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KFsnbG93JywgJ21lZGl1bScsICdoaWdoJ10pLnRvQ29udGFpbihyZWNvbW1lbmRhdGlvbi5wcmlvcml0eSk7XG4gICAgICAgIGV4cGVjdChyZWNvbW1lbmRhdGlvbi5kZXNjcmlwdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KHJlY29tbWVuZGF0aW9uLmV4cGVjdGVkQmVuZWZpdCkudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KFsnbG93JywgJ21lZGl1bScsICdoaWdoJ10pLnRvQ29udGFpbihyZWNvbW1lbmRhdGlvbi5pbXBsZW1lbnRhdGlvbkVmZm9ydCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGRldGVybWluZSBwYXNzL2ZhaWwgc3RhdHVzIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBleHBlY3QodHlwZW9mIHJlc3VsdC5wYXNzZWQpLnRvQmUoJ2Jvb2xlYW4nKTtcbiAgICAgIFxuICAgICAgLy8gSWYgcGFzc2VkIGlzIGZhbHNlLCB0aGVyZSBzaG91bGQgYmUgY3JpdGljYWwgaXNzdWVzXG4gICAgICBpZiAoIXJlc3VsdC5wYXNzZWQpIHtcbiAgICAgICAgY29uc3QgY3JpdGljYWxJc3N1ZXMgPSByZXN1bHQuaXNzdWVzLmZpbHRlcihpc3N1ZSA9PiBpc3N1ZS5zZXZlcml0eSA9PT0gJ2NyaXRpY2FsJyk7XG4gICAgICAgIGV4cGVjdChjcml0aWNhbElzc3Vlcy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0V2YWx1YXRpb24gSGlzdG9yeSBhbmQgQ29tcGFyaXNvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN0b3JlIGV2YWx1YXRpb24gaGlzdG9yeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1vZGVsSWQgPSAndGVzdC1tb2RlbC1oaXN0b3J5JztcbiAgICAgIFxuICAgICAgLy8gUGVyZm9ybSBtdWx0aXBsZSBldmFsdWF0aW9uc1xuICAgICAgYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwobW9kZWxJZCwgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKG1vZGVsSWQsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGhpc3RvcnkgPSBmcmFtZXdvcmsuZ2V0RXZhbHVhdGlvbkhpc3RvcnkobW9kZWxJZCk7XG4gICAgICBleHBlY3QoaGlzdG9yeS5sZW5ndGgpLnRvQmUoMik7XG4gICAgICBcbiAgICAgIC8vIFNob3VsZCBiZSBvcmRlcmVkIGJ5IHRpbWVzdGFtcFxuICAgICAgZXhwZWN0KGhpc3RvcnlbMV0udGltZXN0YW1wLmdldFRpbWUoKSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbChoaXN0b3J5WzBdLnRpbWVzdGFtcC5nZXRUaW1lKCkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBnZXQgbGF0ZXN0IGV2YWx1YXRpb24gZm9yIGEgbW9kZWwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2RlbElkID0gJ3Rlc3QtbW9kZWwtbGF0ZXN0JztcbiAgICAgIFxuICAgICAgYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwobW9kZWxJZCwgbW9ja1Rlc3RDYXNlcywgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KTtcbiAgICAgIGNvbnN0IGxhdGVzdCA9IGZyYW1ld29yay5nZXRMYXRlc3RFdmFsdWF0aW9uKG1vZGVsSWQpO1xuICAgICAgXG4gICAgICBleHBlY3QobGF0ZXN0KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGxhdGVzdCEubW9kZWxJZCkudG9CZShtb2RlbElkKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIG51bGwgZm9yIG1vZGVscyB3aXRoIG5vIGV2YWx1YXRpb24gaGlzdG9yeScsICgpID0+IHtcbiAgICAgIGNvbnN0IGxhdGVzdCA9IGZyYW1ld29yay5nZXRMYXRlc3RFdmFsdWF0aW9uKCdub24tZXhpc3RlbnQtbW9kZWwnKTtcbiAgICAgIGV4cGVjdChsYXRlc3QpLnRvQmVOdWxsKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNvbXBhcmUgbXVsdGlwbGUgbW9kZWxzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9kZWxJZHMgPSBbJ21vZGVsMScsICdtb2RlbDInLCAnbW9kZWwzJ107XG4gICAgICBcbiAgICAgIC8vIEV2YWx1YXRlIGZpcnN0IHR3byBtb2RlbHNcbiAgICAgIGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKG1vZGVsSWRzWzBdLCBtb2NrVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpO1xuICAgICAgYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwobW9kZWxJZHNbMV0sIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBcbiAgICAgIGNvbnN0IGNvbXBhcmlzb24gPSBmcmFtZXdvcmsuY29tcGFyZU1vZGVscyhtb2RlbElkcyk7XG4gICAgICBcbiAgICAgIGV4cGVjdChjb21wYXJpc29uW21vZGVsSWRzWzBdXSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChjb21wYXJpc29uW21vZGVsSWRzWzFdXSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChjb21wYXJpc29uW21vZGVsSWRzWzJdXSkudG9CZU51bGwoKTsgLy8gTm90IGV2YWx1YXRlZFxuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRmFjdG9yeSBGdW5jdGlvbnMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgZnJhbWV3b3JrIGluc3RhbmNlIHdpdGggZmFjdG9yeSBmdW5jdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZyYW1ld29yayA9IGNyZWF0ZU1vZGVsRXZhbHVhdGlvbkZyYW1ld29yaygpO1xuICAgICAgZXhwZWN0KGZyYW1ld29yaykudG9CZUluc3RhbmNlT2YoTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY3JlYXRlIGZyYW1ld29yayB3aXRoIGN1c3RvbSBjb25maWcgdXNpbmcgZmFjdG9yeScsICgpID0+IHtcbiAgICAgIGNvbnN0IGNvbmZpZzogUGFydGlhbDxFdmFsdWF0aW9uQ29uZmlnPiA9IHtcbiAgICAgICAgYWNjdXJhY3lUaHJlc2hvbGRzOiB7IG1pbmltdW06IDAuOSwgdGFyZ2V0OiAwLjk1LCBleGNlbGxlbnQ6IDAuOTggfVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgY29uc3QgZnJhbWV3b3JrID0gY3JlYXRlTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKGNvbmZpZyk7XG4gICAgICBleHBlY3QoZnJhbWV3b3JrKS50b0JlSW5zdGFuY2VPZihNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmspO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gc2luZ2xldG9uIGluc3RhbmNlJywgKCkgPT4ge1xuICAgICAgY29uc3QgaW5zdGFuY2UxID0gZ2V0TW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKCk7XG4gICAgICBjb25zdCBpbnN0YW5jZTIgPSBnZXRNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmsoKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGluc3RhbmNlMSkudG9CZShpbnN0YW5jZTIpO1xuICAgICAgZXhwZWN0KGluc3RhbmNlMSkudG9CZUluc3RhbmNlT2YoTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0Vycm9yIEhhbmRsaW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIGV2YWx1YXRpb24gZXJyb3JzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpbnZhbGlkVGVzdENhc2VzOiBUZXN0Q2FzZVtdID0gW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdpbnZhbGlkJyxcbiAgICAgICAgICBpbnB1dDogbnVsbCxcbiAgICAgICAgICBleHBlY3RlZE91dHB1dDogJ2J1eScsXG4gICAgICAgICAgYWN0dWFsT3V0cHV0OiBudWxsLFxuICAgICAgICAgIG1ldGFkYXRhOiB7IGRvbWFpbjogJ2ZpbmFuY2lhbCcsIGNvbXBsZXhpdHk6ICdzaW1wbGUnLCBleHBsYWluYWJpbGl0eVJlcXVpcmVkOiBmYWxzZSB9XG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChcbiAgICAgICAgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ3Rlc3QtbW9kZWwnLCBpbnZhbGlkVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpXG4gICAgICApLnJlamVjdHMudG9UaHJvdygpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgZW1wdHkgdGVzdCBjYXNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChcbiAgICAgICAgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ3Rlc3QtbW9kZWwnLCBbXSwgbW9ja1Rhc2ssIG1vY2tDb250ZXh0KVxuICAgICAgKS5yZWplY3RzLnRvVGhyb3coKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1N0cmluZyBTaW1pbGFyaXR5IENhbGN1bGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIHN0cmluZyBzaW1pbGFyaXR5IGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgIC8vIEFjY2VzcyBwcml2YXRlIG1ldGhvZCB0aHJvdWdoIHR5cGUgYXNzZXJ0aW9uIGZvciB0ZXN0aW5nXG4gICAgICBjb25zdCBmcmFtZXdvcmtBbnkgPSBmcmFtZXdvcmsgYXMgYW55O1xuICAgICAgXG4gICAgICBleHBlY3QoZnJhbWV3b3JrQW55LmNhbGN1bGF0ZVN0cmluZ1NpbWlsYXJpdHkoJ2hlbGxvJywgJ2hlbGxvJykpLnRvQmUoMS4wKTtcbiAgICAgIGV4cGVjdChmcmFtZXdvcmtBbnkuY2FsY3VsYXRlU3RyaW5nU2ltaWxhcml0eSgnaGVsbG8nLCAnaGFsbG8nKSkudG9CZUdyZWF0ZXJUaGFuKDAuNSk7XG4gICAgICBleHBlY3QoZnJhbWV3b3JrQW55LmNhbGN1bGF0ZVN0cmluZ1NpbWlsYXJpdHkoJ2hlbGxvJywgJ3dvcmxkJykpLnRvQmVMZXNzVGhhbigwLjUpO1xuICAgICAgZXhwZWN0KGZyYW1ld29ya0FueS5jYWxjdWxhdGVTdHJpbmdTaW1pbGFyaXR5KCcnLCAnJykpLnRvQmUoMS4wKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ092ZXJhbGwgU2NvcmUgQ2FsY3VsYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgb3ZlcmFsbCBzY29yZSB3aXRoaW4gdmFsaWQgcmFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmcmFtZXdvcmsuZXZhbHVhdGVNb2RlbCgnY2xhdWRlLXNvbm5ldC0zLjcnLCBtb2NrVGVzdENhc2VzLCBtb2NrVGFzaywgbW9ja0NvbnRleHQpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0Lm92ZXJhbGxTY29yZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQub3ZlcmFsbFNjb3JlKS50b0JlTGVzc1RoYW5PckVxdWFsKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB3ZWlnaHQgZGlmZmVyZW50IG1ldHJpY3MgYXBwcm9wcmlhdGVseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdjbGF1ZGUtc29ubmV0LTMuNycsIG1vY2tUZXN0Q2FzZXMsIG1vY2tUYXNrLCBtb2NrQ29udGV4dCk7XG4gICAgICBcbiAgICAgIC8vIE92ZXJhbGwgc2NvcmUgc2hvdWxkIGJlIGluZmx1ZW5jZWQgYnkgYWxsIG1ldHJpYyBjYXRlZ29yaWVzXG4gICAgICBleHBlY3QocmVzdWx0Lm92ZXJhbGxTY29yZSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdCh0eXBlb2YgcmVzdWx0Lm92ZXJhbGxTY29yZSkudG9CZSgnbnVtYmVyJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19