"use strict";
/**
 * Model Evaluation Framework Example
 *
 * This example demonstrates how to use the AI Model Evaluation Framework
 * to assess model performance, detect bias, and evaluate explainability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExplainabilityExample = exports.runBiasDetectionExample = exports.runModelEvaluationExample = void 0;
const model_evaluation_framework_1 = require("../services/ai/model-evaluation-framework");
/**
 * Example: Comprehensive Model Evaluation
 */
async function runModelEvaluationExample() {
    console.log('🔍 Starting Model Evaluation Framework Example...\n');
    // Create evaluation framework with custom configuration
    const evaluationConfig = {
        accuracyThresholds: {
            minimum: 0.85,
            target: 0.92,
            excellent: 0.96
        },
        biasThresholds: {
            acceptable: 0.05,
            concerning: 0.10,
            critical: 0.20
        },
        explainabilityRequirements: {
            minimumScore: 0.80,
            requireLocalExplanations: true,
            requireGlobalExplanations: true,
            requireCounterfactuals: true
        },
        evaluationDatasets: {
            testDataSize: 500,
            validationDataSize: 200,
            biasTestingDataSize: 100
        }
    };
    const evaluationFramework = (0, model_evaluation_framework_1.createModelEvaluationFramework)(evaluationConfig);
    // Create test cases for evaluation
    const testCases = createTestCases();
    // Define task and context
    const task = {
        type: 'classification',
        complexity: 'medium',
        domain: 'financial',
        priority: 'high',
        agentRole: 'analysis'
    };
    const context = {
        dataSize: 1000,
        timeConstraint: 5000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
    };
    try {
        // Evaluate multiple models
        const modelsToEvaluate = ['claude-sonnet-3.7', 'claude-haiku-3.5', 'amazon-nova-pro'];
        const evaluationResults = {};
        for (const modelId of modelsToEvaluate) {
            console.log(`📊 Evaluating model: ${modelId}`);
            const result = await evaluationFramework.evaluateModel(modelId, testCases, task, context);
            evaluationResults[modelId] = result;
            console.log(`✅ Evaluation completed for ${modelId}`);
            console.log(`   Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
            console.log(`   Passed: ${result.passed ? '✅' : '❌'}`);
            console.log(`   Issues Found: ${result.issues.length}`);
            console.log(`   Recommendations: ${result.recommendations.length}\n`);
        }
        // Display detailed results
        await displayEvaluationResults(evaluationResults);
        // Compare models
        console.log('🔄 Comparing Models...\n');
        const comparison = evaluationFramework.compareModels(modelsToEvaluate);
        displayModelComparison(comparison);
        // Demonstrate evaluation history
        console.log('📈 Evaluation History...\n');
        for (const modelId of modelsToEvaluate) {
            const history = evaluationFramework.getEvaluationHistory(modelId);
            console.log(`${modelId}: ${history.length} evaluation(s) in history`);
        }
    }
    catch (error) {
        console.error('❌ Error during model evaluation:', error);
    }
}
exports.runModelEvaluationExample = runModelEvaluationExample;
/**
 * Create sample test cases for evaluation
 */
function createTestCases() {
    const testCases = [];
    // Investment recommendation test cases
    const investmentScenarios = [
        {
            input: {
                symbol: 'AAPL',
                price: 150,
                pe_ratio: 25,
                growth_rate: 0.15,
                sector: 'technology',
                market_cap: 2500000000000
            },
            expectedOutput: 'buy',
            biasGroup: 'tech_stocks'
        },
        {
            input: {
                symbol: 'TSLA',
                price: 800,
                pe_ratio: 45,
                growth_rate: 0.30,
                sector: 'automotive',
                market_cap: 800000000000
            },
            expectedOutput: 'hold',
            biasGroup: 'growth_stocks'
        },
        {
            input: {
                symbol: 'XOM',
                price: 60,
                pe_ratio: 12,
                growth_rate: 0.05,
                sector: 'energy',
                market_cap: 250000000000
            },
            expectedOutput: 'sell',
            biasGroup: 'value_stocks'
        },
        {
            input: {
                symbol: 'JNJ',
                price: 170,
                pe_ratio: 18,
                growth_rate: 0.08,
                sector: 'healthcare',
                market_cap: 450000000000
            },
            expectedOutput: 'buy',
            biasGroup: 'defensive_stocks'
        },
        {
            input: {
                symbol: 'NVDA',
                price: 400,
                pe_ratio: 35,
                growth_rate: 0.25,
                sector: 'technology',
                market_cap: 1000000000000
            },
            expectedOutput: 'buy',
            biasGroup: 'tech_stocks'
        }
    ];
    // Generate test cases with variations
    investmentScenarios.forEach((scenario, index) => {
        // Create multiple variations of each scenario
        for (let variation = 0; variation < 10; variation++) {
            const testCase = {
                id: `test_${index}_${variation}`,
                input: {
                    ...scenario.input,
                    // Add some noise to create variations
                    price: scenario.input.price * (0.9 + Math.random() * 0.2),
                    pe_ratio: scenario.input.pe_ratio * (0.8 + Math.random() * 0.4)
                },
                expectedOutput: scenario.expectedOutput,
                actualOutput: generateModelOutput(scenario.expectedOutput, variation),
                metadata: {
                    domain: 'financial',
                    complexity: index < 2 ? 'simple' : index < 4 ? 'medium' : 'complex',
                    biasTestingGroup: scenario.biasGroup,
                    explainabilityRequired: variation % 2 === 0
                }
            };
            testCases.push(testCase);
        }
    });
    return testCases;
}
/**
 * Generate simulated model output with some accuracy variation
 */
function generateModelOutput(expectedOutput, variation) {
    const accuracy = 0.8; // 80% accuracy simulation
    if (Math.random() < accuracy) {
        // Correct prediction
        return {
            prediction: expectedOutput,
            confidence: 0.7 + Math.random() * 0.3,
            reasoning: `Based on financial analysis, recommending ${expectedOutput}`
        };
    }
    else {
        // Incorrect prediction
        const alternatives = ['buy', 'sell', 'hold'].filter(option => option !== expectedOutput);
        const wrongPrediction = alternatives[Math.floor(Math.random() * alternatives.length)];
        return {
            prediction: wrongPrediction,
            confidence: 0.4 + Math.random() * 0.4,
            reasoning: `Analysis suggests ${wrongPrediction} based on current metrics`
        };
    }
}
/**
 * Display detailed evaluation results
 */
async function displayEvaluationResults(results) {
    console.log('📋 Detailed Evaluation Results:\n');
    for (const [modelId, result] of Object.entries(results)) {
        console.log(`🤖 Model: ${modelId}`);
        console.log(`   Evaluation ID: ${result.evaluationId}`);
        console.log(`   Timestamp: ${result.timestamp.toISOString()}`);
        console.log(`   Overall Score: ${(result.overallScore * 100).toFixed(1)}%`);
        console.log(`   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
        // Accuracy metrics
        const accuracy = result.metrics.accuracy;
        console.log(`   📊 Accuracy Metrics:`);
        console.log(`      Overall Accuracy: ${(accuracy.overallAccuracy * 100).toFixed(1)}%`);
        console.log(`      Precision: ${(accuracy.precision * 100).toFixed(1)}%`);
        console.log(`      Recall: ${(accuracy.recall * 100).toFixed(1)}%`);
        console.log(`      F1 Score: ${(accuracy.f1Score * 100).toFixed(1)}%`);
        console.log(`      Confidence Calibration: ${(accuracy.confidenceCalibration * 100).toFixed(1)}%`);
        // Bias metrics
        const bias = result.metrics.bias;
        console.log(`   ⚖️ Bias Metrics:`);
        console.log(`      Overall Bias Score: ${(bias.overallBiasScore * 100).toFixed(1)}%`);
        console.log(`      Demographic Parity: ${(bias.demographicParity * 100).toFixed(1)}%`);
        console.log(`      Bias Issues Found: ${bias.biasDetectionResults.length}`);
        // Explainability metrics
        const explainability = result.metrics.explainability;
        console.log(`   🔍 Explainability Metrics:`);
        console.log(`      Overall Score: ${(explainability.overallExplainabilityScore * 100).toFixed(1)}%`);
        console.log(`      Decision Path Clarity: ${(explainability.decisionPathClarity * 100).toFixed(1)}%`);
        console.log(`      Human Interpretability: ${(explainability.humanInterpretability * 100).toFixed(1)}%`);
        console.log(`      Feature Importance Items: ${explainability.featureImportance.length}`);
        // Reliability metrics
        const reliability = result.metrics.reliability;
        console.log(`   🛡️ Reliability Metrics:`);
        console.log(`      Consistency: ${(reliability.consistency * 100).toFixed(1)}%`);
        console.log(`      Robustness: ${(reliability.robustness * 100).toFixed(1)}%`);
        console.log(`      Stability: ${(reliability.stability * 100).toFixed(1)}%`);
        console.log(`      Adversarial Robustness: ${(reliability.adversarialRobustness * 100).toFixed(1)}%`);
        // Issues and recommendations
        if (result.issues.length > 0) {
            console.log(`   ⚠️ Issues (${result.issues.length}):`);
            result.issues.forEach((issue, index) => {
                console.log(`      ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
            });
        }
        if (result.recommendations.length > 0) {
            console.log(`   💡 Recommendations (${result.recommendations.length}):`);
            result.recommendations.slice(0, 3).forEach((rec, index) => {
                console.log(`      ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`);
            });
        }
        console.log('');
    }
}
/**
 * Display model comparison
 */
function displayModelComparison(comparison) {
    console.log('🏆 Model Comparison Summary:\n');
    const validResults = Object.entries(comparison)
        .filter(([_, result]) => result !== null)
        .map(([modelId, result]) => ({ modelId, result: result }))
        .sort((a, b) => b.result.overallScore - a.result.overallScore);
    console.log('Ranking by Overall Score:');
    validResults.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        console.log(`${medal} ${index + 1}. ${item.modelId}: ${(item.result.overallScore * 100).toFixed(1)}%`);
    });
    console.log('\nDetailed Comparison:');
    console.log('Model'.padEnd(20) + 'Overall'.padEnd(10) + 'Accuracy'.padEnd(10) + 'Bias'.padEnd(8) + 'Explain'.padEnd(10) + 'Reliable'.padEnd(10) + 'Status');
    console.log('-'.repeat(78));
    validResults.forEach(({ modelId, result }) => {
        const overall = (result.overallScore * 100).toFixed(1) + '%';
        const accuracy = (result.metrics.accuracy.overallAccuracy * 100).toFixed(1) + '%';
        const bias = (result.metrics.bias.overallBiasScore * 100).toFixed(1) + '%';
        const explain = (result.metrics.explainability.overallExplainabilityScore * 100).toFixed(1) + '%';
        const reliable = (result.metrics.reliability.consistency * 100).toFixed(1) + '%';
        const status = result.passed ? '✅' : '❌';
        console.log(modelId.padEnd(20) +
            overall.padEnd(10) +
            accuracy.padEnd(10) +
            bias.padEnd(8) +
            explain.padEnd(10) +
            reliable.padEnd(10) +
            status);
    });
    console.log('');
}
/**
 * Example: Bias Detection Focus
 */
async function runBiasDetectionExample() {
    console.log('⚖️ Starting Bias Detection Example...\n');
    const framework = (0, model_evaluation_framework_1.createModelEvaluationFramework)();
    // Create biased test cases
    const biasedTestCases = createBiasedTestCases();
    const task = {
        type: 'classification',
        complexity: 'medium',
        domain: 'financial',
        priority: 'high',
        agentRole: 'analysis'
    };
    const context = {
        dataSize: 500,
        timeConstraint: 3000,
        accuracyRequirement: 'medium',
        explainabilityRequirement: 'high'
    };
    try {
        const result = await framework.evaluateModel('bias-test-model', biasedTestCases, task, context);
        console.log('🔍 Bias Detection Results:');
        console.log(`Overall Bias Score: ${(result.metrics.bias.overallBiasScore * 100).toFixed(1)}%`);
        console.log(`Bias Issues Found: ${result.metrics.bias.biasDetectionResults.length}\n`);
        // Display bias detection results
        result.metrics.bias.biasDetectionResults.forEach((biasResult, index) => {
            console.log(`${index + 1}. ${biasResult.biasType.toUpperCase()} BIAS`);
            console.log(`   Severity: ${biasResult.severity.toUpperCase()}`);
            console.log(`   Description: ${biasResult.description}`);
            console.log(`   Affected Groups: ${biasResult.affectedGroups.join(', ')}`);
            console.log(`   Confidence: ${(biasResult.confidence * 100).toFixed(1)}%\n`);
        });
        // Display mitigation recommendations
        if (result.metrics.bias.mitigationRecommendations.length > 0) {
            console.log('💡 Bias Mitigation Recommendations:');
            result.metrics.bias.mitigationRecommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec.strategy.toUpperCase()}`);
                console.log(`   Description: ${rec.description}`);
                console.log(`   Expected Impact: ${(rec.expectedImpact * 100).toFixed(1)}%`);
                console.log(`   Implementation: ${rec.implementationComplexity.toUpperCase()}`);
                console.log(`   Estimated Cost: $${rec.estimatedCost.toLocaleString()}\n`);
            });
        }
    }
    catch (error) {
        console.error('❌ Error in bias detection example:', error);
    }
}
exports.runBiasDetectionExample = runBiasDetectionExample;
/**
 * Create test cases with intentional bias for demonstration
 */
function createBiasedTestCases() {
    const testCases = [];
    // Create cases where tech stocks always get 'buy' recommendations (bias)
    const techStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'];
    const energyStocks = ['XOM', 'CVX', 'COP', 'EOG', 'SLB'];
    // Tech stocks - biased towards 'buy'
    techStocks.forEach((symbol, index) => {
        for (let i = 0; i < 10; i++) {
            testCases.push({
                id: `tech_${symbol}_${i}`,
                input: { symbol, sector: 'technology', price: 100 + Math.random() * 200 },
                expectedOutput: Math.random() > 0.3 ? 'buy' : 'hold',
                actualOutput: 'buy',
                metadata: {
                    domain: 'financial',
                    complexity: 'medium',
                    biasTestingGroup: 'tech_stocks',
                    explainabilityRequired: true
                }
            });
        }
    });
    // Energy stocks - biased towards 'sell'
    energyStocks.forEach((symbol, index) => {
        for (let i = 0; i < 10; i++) {
            testCases.push({
                id: `energy_${symbol}_${i}`,
                input: { symbol, sector: 'energy', price: 50 + Math.random() * 100 },
                expectedOutput: Math.random() > 0.3 ? 'hold' : 'buy',
                actualOutput: 'sell',
                metadata: {
                    domain: 'financial',
                    complexity: 'medium',
                    biasTestingGroup: 'energy_stocks',
                    explainabilityRequired: true
                }
            });
        }
    });
    return testCases;
}
/**
 * Example: Explainability Focus
 */
async function runExplainabilityExample() {
    console.log('🔍 Starting Explainability Example...\n');
    const framework = (0, model_evaluation_framework_1.createModelEvaluationFramework)({
        explainabilityRequirements: {
            minimumScore: 0.85,
            requireLocalExplanations: true,
            requireGlobalExplanations: true,
            requireCounterfactuals: true
        }
    });
    const testCases = createTestCases().slice(0, 20); // Smaller set for detailed analysis
    const task = {
        type: 'text-generation',
        complexity: 'complex',
        domain: 'financial',
        priority: 'high',
        agentRole: 'synthesis'
    };
    const context = {
        dataSize: 200,
        timeConstraint: 10000,
        accuracyRequirement: 'high',
        explainabilityRequirement: 'high'
    };
    try {
        const result = await framework.evaluateModel('explainability-test-model', testCases, task, context);
        console.log('🔍 Explainability Analysis Results:');
        console.log(`Overall Explainability Score: ${(result.metrics.explainability.overallExplainabilityScore * 100).toFixed(1)}%`);
        console.log(`Decision Path Clarity: ${(result.metrics.explainability.decisionPathClarity * 100).toFixed(1)}%`);
        console.log(`Human Interpretability: ${(result.metrics.explainability.humanInterpretability * 100).toFixed(1)}%\n`);
        // Feature importance
        console.log('📊 Top Feature Importance:');
        result.metrics.explainability.featureImportance.slice(0, 5).forEach((feature, index) => {
            const direction = feature.direction === 'positive' ? '📈' : feature.direction === 'negative' ? '📉' : '➡️';
            console.log(`${index + 1}. ${feature.feature}: ${(feature.importance * 100).toFixed(1)}% ${direction}`);
        });
        // Local explanations sample
        console.log('\n💬 Sample Local Explanations:');
        result.metrics.explainability.localExplanations.slice(0, 3).forEach((explanation, index) => {
            console.log(`${index + 1}. Input ${explanation.inputId}:`);
            console.log(`   Explanation: ${explanation.explanation}`);
            console.log(`   Confidence: ${(explanation.confidence * 100).toFixed(1)}%`);
            console.log(`   Key Factors: ${explanation.keyFactors.join(', ')}\n`);
        });
        // Global explanations
        console.log('🌐 Global Model Explanations:');
        result.metrics.explainability.globalExplanations.forEach((explanation, index) => {
            console.log(`${index + 1}. Model Behavior: ${explanation.modelBehavior}`);
            console.log(`   Key Patterns: ${explanation.keyPatterns.join(', ')}`);
            console.log(`   Limitations: ${explanation.limitations.join(', ')}\n`);
        });
    }
    catch (error) {
        console.error('❌ Error in explainability example:', error);
    }
}
exports.runExplainabilityExample = runExplainabilityExample;
// Run examples if this file is executed directly
if (require.main === module) {
    (async () => {
        await runModelEvaluationExample();
        console.log('\n' + '='.repeat(80) + '\n');
        await runBiasDetectionExample();
        console.log('\n' + '='.repeat(80) + '\n');
        await runExplainabilityExample();
    })().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwtZXZhbHVhdGlvbi1leGFtcGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4YW1wbGVzL21vZGVsLWV2YWx1YXRpb24tZXhhbXBsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7O0dBS0c7OztBQUVILDBGQU1tRDtBQUduRDs7R0FFRztBQUNJLEtBQUssVUFBVSx5QkFBeUI7SUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO0lBRW5FLHdEQUF3RDtJQUN4RCxNQUFNLGdCQUFnQixHQUE4QjtRQUNsRCxrQkFBa0IsRUFBRTtZQUNsQixPQUFPLEVBQUUsSUFBSTtZQUNiLE1BQU0sRUFBRSxJQUFJO1lBQ1osU0FBUyxFQUFFLElBQUk7U0FDaEI7UUFDRCxjQUFjLEVBQUU7WUFDZCxVQUFVLEVBQUUsSUFBSTtZQUNoQixVQUFVLEVBQUUsSUFBSTtZQUNoQixRQUFRLEVBQUUsSUFBSTtTQUNmO1FBQ0QsMEJBQTBCLEVBQUU7WUFDMUIsWUFBWSxFQUFFLElBQUk7WUFDbEIsd0JBQXdCLEVBQUUsSUFBSTtZQUM5Qix5QkFBeUIsRUFBRSxJQUFJO1lBQy9CLHNCQUFzQixFQUFFLElBQUk7U0FDN0I7UUFDRCxrQkFBa0IsRUFBRTtZQUNsQixZQUFZLEVBQUUsR0FBRztZQUNqQixrQkFBa0IsRUFBRSxHQUFHO1lBQ3ZCLG1CQUFtQixFQUFFLEdBQUc7U0FDekI7S0FDRixDQUFDO0lBRUYsTUFBTSxtQkFBbUIsR0FBRyxJQUFBLDJEQUE4QixFQUFDLGdCQUFnQixDQUFDLENBQUM7SUFFN0UsbUNBQW1DO0lBQ25DLE1BQU0sU0FBUyxHQUFHLGVBQWUsRUFBRSxDQUFDO0lBRXBDLDBCQUEwQjtJQUMxQixNQUFNLElBQUksR0FBUztRQUNqQixJQUFJLEVBQUUsZ0JBQWdCO1FBQ3RCLFVBQVUsRUFBRSxRQUFRO1FBQ3BCLE1BQU0sRUFBRSxXQUFXO1FBQ25CLFFBQVEsRUFBRSxNQUFNO1FBQ2hCLFNBQVMsRUFBRSxVQUFVO0tBQ3RCLENBQUM7SUFFRixNQUFNLE9BQU8sR0FBaUI7UUFDNUIsUUFBUSxFQUFFLElBQUk7UUFDZCxjQUFjLEVBQUUsSUFBSTtRQUNwQixtQkFBbUIsRUFBRSxNQUFNO1FBQzNCLHlCQUF5QixFQUFFLE1BQU07S0FDbEMsQ0FBQztJQUVGLElBQUk7UUFDRiwyQkFBMkI7UUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLG1CQUFtQixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDdEYsTUFBTSxpQkFBaUIsR0FBcUMsRUFBRSxDQUFDO1FBRS9ELEtBQUssTUFBTSxPQUFPLElBQUksZ0JBQWdCLEVBQUU7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUMvQyxNQUFNLE1BQU0sR0FBRyxNQUFNLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztZQUMxRixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxNQUFNLENBQUM7WUFFcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM1RSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUN4RCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7U0FDdkU7UUFFRCwyQkFBMkI7UUFDM0IsTUFBTSx3QkFBd0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRWxELGlCQUFpQjtRQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDeEMsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDdkUsc0JBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFbkMsaUNBQWlDO1FBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsQ0FBQztRQUMxQyxLQUFLLE1BQU0sT0FBTyxJQUFJLGdCQUFnQixFQUFFO1lBQ3RDLE1BQU0sT0FBTyxHQUFHLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLEtBQUssT0FBTyxDQUFDLE1BQU0sMkJBQTJCLENBQUMsQ0FBQztTQUN2RTtLQUVGO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzFEO0FBQ0gsQ0FBQztBQXBGRCw4REFvRkM7QUFFRDs7R0FFRztBQUNILFNBQVMsZUFBZTtJQUN0QixNQUFNLFNBQVMsR0FBZSxFQUFFLENBQUM7SUFFakMsdUNBQXVDO0lBQ3ZDLE1BQU0sbUJBQW1CLEdBQUc7UUFDMUI7WUFDRSxLQUFLLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixVQUFVLEVBQUUsYUFBYTthQUMxQjtZQUNELGNBQWMsRUFBRSxLQUFLO1lBQ3JCLFNBQVMsRUFBRSxhQUFhO1NBQ3pCO1FBQ0Q7WUFDRSxLQUFLLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixVQUFVLEVBQUUsWUFBWTthQUN6QjtZQUNELGNBQWMsRUFBRSxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxlQUFlO1NBQzNCO1FBQ0Q7WUFDRSxLQUFLLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixVQUFVLEVBQUUsWUFBWTthQUN6QjtZQUNELGNBQWMsRUFBRSxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxjQUFjO1NBQzFCO1FBQ0Q7WUFDRSxLQUFLLEVBQUU7Z0JBQ0wsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsS0FBSyxFQUFFLEdBQUc7Z0JBQ1YsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixVQUFVLEVBQUUsWUFBWTthQUN6QjtZQUNELGNBQWMsRUFBRSxLQUFLO1lBQ3JCLFNBQVMsRUFBRSxrQkFBa0I7U0FDOUI7UUFDRDtZQUNFLEtBQUssRUFBRTtnQkFDTCxNQUFNLEVBQUUsTUFBTTtnQkFDZCxLQUFLLEVBQUUsR0FBRztnQkFDVixRQUFRLEVBQUUsRUFBRTtnQkFDWixXQUFXLEVBQUUsSUFBSTtnQkFDakIsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFVBQVUsRUFBRSxhQUFhO2FBQzFCO1lBQ0QsY0FBYyxFQUFFLEtBQUs7WUFDckIsU0FBUyxFQUFFLGFBQWE7U0FDekI7S0FDRixDQUFDO0lBRUYsc0NBQXNDO0lBQ3RDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUM5Qyw4Q0FBOEM7UUFDOUMsS0FBSyxJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUUsU0FBUyxHQUFHLEVBQUUsRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUNuRCxNQUFNLFFBQVEsR0FBYTtnQkFDekIsRUFBRSxFQUFFLFFBQVEsS0FBSyxJQUFJLFNBQVMsRUFBRTtnQkFDaEMsS0FBSyxFQUFFO29CQUNMLEdBQUcsUUFBUSxDQUFDLEtBQUs7b0JBQ2pCLHNDQUFzQztvQkFDdEMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7b0JBQ3pELFFBQVEsRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDO2lCQUNoRTtnQkFDRCxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWM7Z0JBQ3ZDLFlBQVksRUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQztnQkFDckUsUUFBUSxFQUFFO29CQUNSLE1BQU0sRUFBRSxXQUFXO29CQUNuQixVQUFVLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQ25FLGdCQUFnQixFQUFFLFFBQVEsQ0FBQyxTQUFTO29CQUNwQyxzQkFBc0IsRUFBRSxTQUFTLEdBQUcsQ0FBQyxLQUFLLENBQUM7aUJBQzVDO2FBQ0YsQ0FBQztZQUNGLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDMUI7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsbUJBQW1CLENBQUMsY0FBc0IsRUFBRSxTQUFpQjtJQUNwRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsQ0FBQywwQkFBMEI7SUFFaEQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxFQUFFO1FBQzVCLHFCQUFxQjtRQUNyQixPQUFPO1lBQ0wsVUFBVSxFQUFFLGNBQWM7WUFDMUIsVUFBVSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRztZQUNyQyxTQUFTLEVBQUUsNkNBQTZDLGNBQWMsRUFBRTtTQUN6RSxDQUFDO0tBQ0g7U0FBTTtRQUNMLHVCQUF1QjtRQUN2QixNQUFNLFlBQVksR0FBRyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxLQUFLLGNBQWMsQ0FBQyxDQUFDO1FBQ3pGLE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUV0RixPQUFPO1lBQ0wsVUFBVSxFQUFFLGVBQWU7WUFDM0IsVUFBVSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRztZQUNyQyxTQUFTLEVBQUUscUJBQXFCLGVBQWUsMkJBQTJCO1NBQzNFLENBQUM7S0FDSDtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILEtBQUssVUFBVSx3QkFBd0IsQ0FBQyxPQUF5QztJQUMvRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFFakQsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUVyRSxtQkFBbUI7UUFDbkIsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7UUFDekMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsUUFBUSxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZGLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsUUFBUSxDQUFDLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbkcsZUFBZTtRQUNmLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2pDLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkYsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFNUUseUJBQXlCO1FBQ3pCLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLGNBQWMsQ0FBQywwQkFBMEIsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsY0FBYyxDQUFDLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxjQUFjLENBQUMscUJBQXFCLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6RyxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUUxRixzQkFBc0I7UUFDdEIsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7UUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pGLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9FLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUNBQWlDLENBQUMsV0FBVyxDQUFDLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFdEcsNkJBQTZCO1FBQzdCLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzVCLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEtBQUssR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUM1RixDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsSUFBSSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxLQUFLLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDeEYsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDakI7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLHNCQUFzQixDQUFDLFVBQW1EO0lBQ2pGLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztJQUU5QyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztTQUM1QyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQztTQUN4QyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTyxFQUFFLENBQUMsQ0FBQztTQUMxRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBRWpFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUN6QyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1FBQ25DLE1BQU0sS0FBSyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNsRixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekcsQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztJQUM1SixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUU1QixZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRTtRQUMzQyxNQUFNLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFD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QUMzQixDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ1YsTUFBTSx5QkFBeUIsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDMUMsTUFBTSx1QkFBdUIsRUFBRSxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDMUMsTUFBTSx3QkFBd0IsRUFBRSxDQUFDO0lBQ25DLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUMzQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9kZWwgRXZhbHVhdGlvbiBGcmFtZXdvcmsgRXhhbXBsZVxuICogXG4gKiBUaGlzIGV4YW1wbGUgZGVtb25zdHJhdGVzIGhvdyB0byB1c2UgdGhlIEFJIE1vZGVsIEV2YWx1YXRpb24gRnJhbWV3b3JrXG4gKiB0byBhc3Nlc3MgbW9kZWwgcGVyZm9ybWFuY2UsIGRldGVjdCBiaWFzLCBhbmQgZXZhbHVhdGUgZXhwbGFpbmFiaWxpdHkuXG4gKi9cblxuaW1wb3J0IHtcbiAgTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrLFxuICBjcmVhdGVNb2RlbEV2YWx1YXRpb25GcmFtZXdvcmssXG4gIFRlc3RDYXNlLFxuICBFdmFsdWF0aW9uQ29uZmlnLFxuICBFdmFsdWF0aW9uUmVzdWx0XG59IGZyb20gJy4uL3NlcnZpY2VzL2FpL21vZGVsLWV2YWx1YXRpb24tZnJhbWV3b3JrJztcbmltcG9ydCB7IFRhc2ssIE1vZGVsQ29udGV4dCB9IGZyb20gJy4uL21vZGVscy9zZXJ2aWNlcyc7XG5cbi8qKlxuICogRXhhbXBsZTogQ29tcHJlaGVuc2l2ZSBNb2RlbCBFdmFsdWF0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Nb2RlbEV2YWx1YXRpb25FeGFtcGxlKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygn8J+UjSBTdGFydGluZyBNb2RlbCBFdmFsdWF0aW9uIEZyYW1ld29yayBFeGFtcGxlLi4uXFxuJyk7XG5cbiAgLy8gQ3JlYXRlIGV2YWx1YXRpb24gZnJhbWV3b3JrIHdpdGggY3VzdG9tIGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgZXZhbHVhdGlvbkNvbmZpZzogUGFydGlhbDxFdmFsdWF0aW9uQ29uZmlnPiA9IHtcbiAgICBhY2N1cmFjeVRocmVzaG9sZHM6IHtcbiAgICAgIG1pbmltdW06IDAuODUsXG4gICAgICB0YXJnZXQ6IDAuOTIsXG4gICAgICBleGNlbGxlbnQ6IDAuOTZcbiAgICB9LFxuICAgIGJpYXNUaHJlc2hvbGRzOiB7XG4gICAgICBhY2NlcHRhYmxlOiAwLjA1LFxuICAgICAgY29uY2VybmluZzogMC4xMCxcbiAgICAgIGNyaXRpY2FsOiAwLjIwXG4gICAgfSxcbiAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50czoge1xuICAgICAgbWluaW11bVNjb3JlOiAwLjgwLFxuICAgICAgcmVxdWlyZUxvY2FsRXhwbGFuYXRpb25zOiB0cnVlLFxuICAgICAgcmVxdWlyZUdsb2JhbEV4cGxhbmF0aW9uczogdHJ1ZSxcbiAgICAgIHJlcXVpcmVDb3VudGVyZmFjdHVhbHM6IHRydWVcbiAgICB9LFxuICAgIGV2YWx1YXRpb25EYXRhc2V0czoge1xuICAgICAgdGVzdERhdGFTaXplOiA1MDAsXG4gICAgICB2YWxpZGF0aW9uRGF0YVNpemU6IDIwMCxcbiAgICAgIGJpYXNUZXN0aW5nRGF0YVNpemU6IDEwMFxuICAgIH1cbiAgfTtcblxuICBjb25zdCBldmFsdWF0aW9uRnJhbWV3b3JrID0gY3JlYXRlTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKGV2YWx1YXRpb25Db25maWcpO1xuXG4gIC8vIENyZWF0ZSB0ZXN0IGNhc2VzIGZvciBldmFsdWF0aW9uXG4gIGNvbnN0IHRlc3RDYXNlcyA9IGNyZWF0ZVRlc3RDYXNlcygpO1xuXG4gIC8vIERlZmluZSB0YXNrIGFuZCBjb250ZXh0XG4gIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgdHlwZTogJ2NsYXNzaWZpY2F0aW9uJyxcbiAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgYWdlbnRSb2xlOiAnYW5hbHlzaXMnXG4gIH07XG5cbiAgY29uc3QgY29udGV4dDogTW9kZWxDb250ZXh0ID0ge1xuICAgIGRhdGFTaXplOiAxMDAwLFxuICAgIHRpbWVDb25zdHJhaW50OiA1MDAwLFxuICAgIGFjY3VyYWN5UmVxdWlyZW1lbnQ6ICdoaWdoJyxcbiAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50OiAnaGlnaCdcbiAgfTtcblxuICB0cnkge1xuICAgIC8vIEV2YWx1YXRlIG11bHRpcGxlIG1vZGVsc1xuICAgIGNvbnN0IG1vZGVsc1RvRXZhbHVhdGUgPSBbJ2NsYXVkZS1zb25uZXQtMy43JywgJ2NsYXVkZS1oYWlrdS0zLjUnLCAnYW1hem9uLW5vdmEtcHJvJ107XG4gICAgY29uc3QgZXZhbHVhdGlvblJlc3VsdHM6IFJlY29yZDxzdHJpbmcsIEV2YWx1YXRpb25SZXN1bHQ+ID0ge307XG5cbiAgICBmb3IgKGNvbnN0IG1vZGVsSWQgb2YgbW9kZWxzVG9FdmFsdWF0ZSkge1xuICAgICAgY29uc29sZS5sb2coYPCfk4ogRXZhbHVhdGluZyBtb2RlbDogJHttb2RlbElkfWApO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZXZhbHVhdGlvbkZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKG1vZGVsSWQsIHRlc3RDYXNlcywgdGFzaywgY29udGV4dCk7XG4gICAgICBldmFsdWF0aW9uUmVzdWx0c1ttb2RlbElkXSA9IHJlc3VsdDtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYOKchSBFdmFsdWF0aW9uIGNvbXBsZXRlZCBmb3IgJHttb2RlbElkfWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIE92ZXJhbGwgU2NvcmU6ICR7KHJlc3VsdC5vdmVyYWxsU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFBhc3NlZDogJHtyZXN1bHQucGFzc2VkID8gJ+KchScgOiAn4p2MJ31gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBJc3N1ZXMgRm91bmQ6ICR7cmVzdWx0Lmlzc3Vlcy5sZW5ndGh9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgUmVjb21tZW5kYXRpb25zOiAke3Jlc3VsdC5yZWNvbW1lbmRhdGlvbnMubGVuZ3RofVxcbmApO1xuICAgIH1cblxuICAgIC8vIERpc3BsYXkgZGV0YWlsZWQgcmVzdWx0c1xuICAgIGF3YWl0IGRpc3BsYXlFdmFsdWF0aW9uUmVzdWx0cyhldmFsdWF0aW9uUmVzdWx0cyk7XG5cbiAgICAvLyBDb21wYXJlIG1vZGVsc1xuICAgIGNvbnNvbGUubG9nKCfwn5SEIENvbXBhcmluZyBNb2RlbHMuLi5cXG4nKTtcbiAgICBjb25zdCBjb21wYXJpc29uID0gZXZhbHVhdGlvbkZyYW1ld29yay5jb21wYXJlTW9kZWxzKG1vZGVsc1RvRXZhbHVhdGUpO1xuICAgIGRpc3BsYXlNb2RlbENvbXBhcmlzb24oY29tcGFyaXNvbik7XG5cbiAgICAvLyBEZW1vbnN0cmF0ZSBldmFsdWF0aW9uIGhpc3RvcnlcbiAgICBjb25zb2xlLmxvZygn8J+TiCBFdmFsdWF0aW9uIEhpc3RvcnkuLi5cXG4nKTtcbiAgICBmb3IgKGNvbnN0IG1vZGVsSWQgb2YgbW9kZWxzVG9FdmFsdWF0ZSkge1xuICAgICAgY29uc3QgaGlzdG9yeSA9IGV2YWx1YXRpb25GcmFtZXdvcmsuZ2V0RXZhbHVhdGlvbkhpc3RvcnkobW9kZWxJZCk7XG4gICAgICBjb25zb2xlLmxvZyhgJHttb2RlbElkfTogJHtoaXN0b3J5Lmxlbmd0aH0gZXZhbHVhdGlvbihzKSBpbiBoaXN0b3J5YCk7XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcign4p2MIEVycm9yIGR1cmluZyBtb2RlbCBldmFsdWF0aW9uOicsIGVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBzYW1wbGUgdGVzdCBjYXNlcyBmb3IgZXZhbHVhdGlvblxuICovXG5mdW5jdGlvbiBjcmVhdGVUZXN0Q2FzZXMoKTogVGVzdENhc2VbXSB7XG4gIGNvbnN0IHRlc3RDYXNlczogVGVzdENhc2VbXSA9IFtdO1xuXG4gIC8vIEludmVzdG1lbnQgcmVjb21tZW5kYXRpb24gdGVzdCBjYXNlc1xuICBjb25zdCBpbnZlc3RtZW50U2NlbmFyaW9zID0gW1xuICAgIHtcbiAgICAgIGlucHV0OiB7IFxuICAgICAgICBzeW1ib2w6ICdBQVBMJywgXG4gICAgICAgIHByaWNlOiAxNTAsIFxuICAgICAgICBwZV9yYXRpbzogMjUsIFxuICAgICAgICBncm93dGhfcmF0ZTogMC4xNSxcbiAgICAgICAgc2VjdG9yOiAndGVjaG5vbG9neScsXG4gICAgICAgIG1hcmtldF9jYXA6IDI1MDAwMDAwMDAwMDBcbiAgICAgIH0sXG4gICAgICBleHBlY3RlZE91dHB1dDogJ2J1eScsXG4gICAgICBiaWFzR3JvdXA6ICd0ZWNoX3N0b2NrcydcbiAgICB9LFxuICAgIHtcbiAgICAgIGlucHV0OiB7IFxuICAgICAgICBzeW1ib2w6ICdUU0xBJywgXG4gICAgICAgIHByaWNlOiA4MDAsIFxuICAgICAgICBwZV9yYXRpbzogNDUsIFxuICAgICAgICBncm93dGhfcmF0ZTogMC4zMCxcbiAgICAgICAgc2VjdG9yOiAnYXV0b21vdGl2ZScsXG4gICAgICAgIG1hcmtldF9jYXA6IDgwMDAwMDAwMDAwMFxuICAgICAgfSxcbiAgICAgIGV4cGVjdGVkT3V0cHV0OiAnaG9sZCcsXG4gICAgICBiaWFzR3JvdXA6ICdncm93dGhfc3RvY2tzJ1xuICAgIH0sXG4gICAge1xuICAgICAgaW5wdXQ6IHsgXG4gICAgICAgIHN5bWJvbDogJ1hPTScsIFxuICAgICAgICBwcmljZTogNjAsIFxuICAgICAgICBwZV9yYXRpbzogMTIsIFxuICAgICAgICBncm93dGhfcmF0ZTogMC4wNSxcbiAgICAgICAgc2VjdG9yOiAnZW5lcmd5JyxcbiAgICAgICAgbWFya2V0X2NhcDogMjUwMDAwMDAwMDAwXG4gICAgICB9LFxuICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdzZWxsJyxcbiAgICAgIGJpYXNHcm91cDogJ3ZhbHVlX3N0b2NrcydcbiAgICB9LFxuICAgIHtcbiAgICAgIGlucHV0OiB7IFxuICAgICAgICBzeW1ib2w6ICdKTkonLCBcbiAgICAgICAgcHJpY2U6IDE3MCwgXG4gICAgICAgIHBlX3JhdGlvOiAxOCwgXG4gICAgICAgIGdyb3d0aF9yYXRlOiAwLjA4LFxuICAgICAgICBzZWN0b3I6ICdoZWFsdGhjYXJlJyxcbiAgICAgICAgbWFya2V0X2NhcDogNDUwMDAwMDAwMDAwXG4gICAgICB9LFxuICAgICAgZXhwZWN0ZWRPdXRwdXQ6ICdidXknLFxuICAgICAgYmlhc0dyb3VwOiAnZGVmZW5zaXZlX3N0b2NrcydcbiAgICB9LFxuICAgIHtcbiAgICAgIGlucHV0OiB7IFxuICAgICAgICBzeW1ib2w6ICdOVkRBJywgXG4gICAgICAgIHByaWNlOiA0MDAsIFxuICAgICAgICBwZV9yYXRpbzogMzUsIFxuICAgICAgICBncm93dGhfcmF0ZTogMC4yNSxcbiAgICAgICAgc2VjdG9yOiAndGVjaG5vbG9neScsXG4gICAgICAgIG1hcmtldF9jYXA6IDEwMDAwMDAwMDAwMDBcbiAgICAgIH0sXG4gICAgICBleHBlY3RlZE91dHB1dDogJ2J1eScsXG4gICAgICBiaWFzR3JvdXA6ICd0ZWNoX3N0b2NrcydcbiAgICB9XG4gIF07XG5cbiAgLy8gR2VuZXJhdGUgdGVzdCBjYXNlcyB3aXRoIHZhcmlhdGlvbnNcbiAgaW52ZXN0bWVudFNjZW5hcmlvcy5mb3JFYWNoKChzY2VuYXJpbywgaW5kZXgpID0+IHtcbiAgICAvLyBDcmVhdGUgbXVsdGlwbGUgdmFyaWF0aW9ucyBvZiBlYWNoIHNjZW5hcmlvXG4gICAgZm9yIChsZXQgdmFyaWF0aW9uID0gMDsgdmFyaWF0aW9uIDwgMTA7IHZhcmlhdGlvbisrKSB7XG4gICAgICBjb25zdCB0ZXN0Q2FzZTogVGVzdENhc2UgPSB7XG4gICAgICAgIGlkOiBgdGVzdF8ke2luZGV4fV8ke3ZhcmlhdGlvbn1gLFxuICAgICAgICBpbnB1dDoge1xuICAgICAgICAgIC4uLnNjZW5hcmlvLmlucHV0LFxuICAgICAgICAgIC8vIEFkZCBzb21lIG5vaXNlIHRvIGNyZWF0ZSB2YXJpYXRpb25zXG4gICAgICAgICAgcHJpY2U6IHNjZW5hcmlvLmlucHV0LnByaWNlICogKDAuOSArIE1hdGgucmFuZG9tKCkgKiAwLjIpLFxuICAgICAgICAgIHBlX3JhdGlvOiBzY2VuYXJpby5pbnB1dC5wZV9yYXRpbyAqICgwLjggKyBNYXRoLnJhbmRvbSgpICogMC40KVxuICAgICAgICB9LFxuICAgICAgICBleHBlY3RlZE91dHB1dDogc2NlbmFyaW8uZXhwZWN0ZWRPdXRwdXQsXG4gICAgICAgIGFjdHVhbE91dHB1dDogZ2VuZXJhdGVNb2RlbE91dHB1dChzY2VuYXJpby5leHBlY3RlZE91dHB1dCwgdmFyaWF0aW9uKSxcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICAgIGNvbXBsZXhpdHk6IGluZGV4IDwgMiA/ICdzaW1wbGUnIDogaW5kZXggPCA0ID8gJ21lZGl1bScgOiAnY29tcGxleCcsXG4gICAgICAgICAgYmlhc1Rlc3RpbmdHcm91cDogc2NlbmFyaW8uYmlhc0dyb3VwLFxuICAgICAgICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZWQ6IHZhcmlhdGlvbiAlIDIgPT09IDBcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHRlc3RDYXNlcy5wdXNoKHRlc3RDYXNlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB0ZXN0Q2FzZXM7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgc2ltdWxhdGVkIG1vZGVsIG91dHB1dCB3aXRoIHNvbWUgYWNjdXJhY3kgdmFyaWF0aW9uXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlTW9kZWxPdXRwdXQoZXhwZWN0ZWRPdXRwdXQ6IHN0cmluZywgdmFyaWF0aW9uOiBudW1iZXIpOiBhbnkge1xuICBjb25zdCBhY2N1cmFjeSA9IDAuODsgLy8gODAlIGFjY3VyYWN5IHNpbXVsYXRpb25cbiAgXG4gIGlmIChNYXRoLnJhbmRvbSgpIDwgYWNjdXJhY3kpIHtcbiAgICAvLyBDb3JyZWN0IHByZWRpY3Rpb25cbiAgICByZXR1cm4ge1xuICAgICAgcHJlZGljdGlvbjogZXhwZWN0ZWRPdXRwdXQsXG4gICAgICBjb25maWRlbmNlOiAwLjcgKyBNYXRoLnJhbmRvbSgpICogMC4zLFxuICAgICAgcmVhc29uaW5nOiBgQmFzZWQgb24gZmluYW5jaWFsIGFuYWx5c2lzLCByZWNvbW1lbmRpbmcgJHtleHBlY3RlZE91dHB1dH1gXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJbmNvcnJlY3QgcHJlZGljdGlvblxuICAgIGNvbnN0IGFsdGVybmF0aXZlcyA9IFsnYnV5JywgJ3NlbGwnLCAnaG9sZCddLmZpbHRlcihvcHRpb24gPT4gb3B0aW9uICE9PSBleHBlY3RlZE91dHB1dCk7XG4gICAgY29uc3Qgd3JvbmdQcmVkaWN0aW9uID0gYWx0ZXJuYXRpdmVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFsdGVybmF0aXZlcy5sZW5ndGgpXTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgcHJlZGljdGlvbjogd3JvbmdQcmVkaWN0aW9uLFxuICAgICAgY29uZmlkZW5jZTogMC40ICsgTWF0aC5yYW5kb20oKSAqIDAuNCxcbiAgICAgIHJlYXNvbmluZzogYEFuYWx5c2lzIHN1Z2dlc3RzICR7d3JvbmdQcmVkaWN0aW9ufSBiYXNlZCBvbiBjdXJyZW50IG1ldHJpY3NgXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIERpc3BsYXkgZGV0YWlsZWQgZXZhbHVhdGlvbiByZXN1bHRzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGRpc3BsYXlFdmFsdWF0aW9uUmVzdWx0cyhyZXN1bHRzOiBSZWNvcmQ8c3RyaW5nLCBFdmFsdWF0aW9uUmVzdWx0Pik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygn8J+TiyBEZXRhaWxlZCBFdmFsdWF0aW9uIFJlc3VsdHM6XFxuJyk7XG5cbiAgZm9yIChjb25zdCBbbW9kZWxJZCwgcmVzdWx0XSBvZiBPYmplY3QuZW50cmllcyhyZXN1bHRzKSkge1xuICAgIGNvbnNvbGUubG9nKGDwn6SWIE1vZGVsOiAke21vZGVsSWR9YCk7XG4gICAgY29uc29sZS5sb2coYCAgIEV2YWx1YXRpb24gSUQ6ICR7cmVzdWx0LmV2YWx1YXRpb25JZH1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgVGltZXN0YW1wOiAke3Jlc3VsdC50aW1lc3RhbXAudG9JU09TdHJpbmcoKX1gKTtcbiAgICBjb25zb2xlLmxvZyhgICAgT3ZlcmFsbCBTY29yZTogJHsocmVzdWx0Lm92ZXJhbGxTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgIFN0YXR1czogJHtyZXN1bHQucGFzc2VkID8gJ+KchSBQQVNTRUQnIDogJ+KdjCBGQUlMRUQnfWApO1xuICAgIFxuICAgIC8vIEFjY3VyYWN5IG1ldHJpY3NcbiAgICBjb25zdCBhY2N1cmFjeSA9IHJlc3VsdC5tZXRyaWNzLmFjY3VyYWN5O1xuICAgIGNvbnNvbGUubG9nKGAgICDwn5OKIEFjY3VyYWN5IE1ldHJpY3M6YCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIE92ZXJhbGwgQWNjdXJhY3k6ICR7KGFjY3VyYWN5Lm92ZXJhbGxBY2N1cmFjeSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIFByZWNpc2lvbjogJHsoYWNjdXJhY3kucHJlY2lzaW9uICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICAgICAgUmVjYWxsOiAkeyhhY2N1cmFjeS5yZWNhbGwgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgICAgICBGMSBTY29yZTogJHsoYWNjdXJhY3kuZjFTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIENvbmZpZGVuY2UgQ2FsaWJyYXRpb246ICR7KGFjY3VyYWN5LmNvbmZpZGVuY2VDYWxpYnJhdGlvbiAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgXG4gICAgLy8gQmlhcyBtZXRyaWNzXG4gICAgY29uc3QgYmlhcyA9IHJlc3VsdC5tZXRyaWNzLmJpYXM7XG4gICAgY29uc29sZS5sb2coYCAgIOKalu+4jyBCaWFzIE1ldHJpY3M6YCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIE92ZXJhbGwgQmlhcyBTY29yZTogJHsoYmlhcy5vdmVyYWxsQmlhc1Njb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICAgICAgRGVtb2dyYXBoaWMgUGFyaXR5OiAkeyhiaWFzLmRlbW9ncmFwaGljUGFyaXR5ICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICBjb25zb2xlLmxvZyhgICAgICAgQmlhcyBJc3N1ZXMgRm91bmQ6ICR7Ymlhcy5iaWFzRGV0ZWN0aW9uUmVzdWx0cy5sZW5ndGh9YCk7XG4gICAgXG4gICAgLy8gRXhwbGFpbmFiaWxpdHkgbWV0cmljc1xuICAgIGNvbnN0IGV4cGxhaW5hYmlsaXR5ID0gcmVzdWx0Lm1ldHJpY3MuZXhwbGFpbmFiaWxpdHk7XG4gICAgY29uc29sZS5sb2coYCAgIPCflI0gRXhwbGFpbmFiaWxpdHkgTWV0cmljczpgKTtcbiAgICBjb25zb2xlLmxvZyhgICAgICAgT3ZlcmFsbCBTY29yZTogJHsoZXhwbGFpbmFiaWxpdHkub3ZlcmFsbEV4cGxhaW5hYmlsaXR5U2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgICAgICBEZWNpc2lvbiBQYXRoIENsYXJpdHk6ICR7KGV4cGxhaW5hYmlsaXR5LmRlY2lzaW9uUGF0aENsYXJpdHkgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgICAgICBIdW1hbiBJbnRlcnByZXRhYmlsaXR5OiAkeyhleHBsYWluYWJpbGl0eS5odW1hbkludGVycHJldGFiaWxpdHkgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgICAgICBGZWF0dXJlIEltcG9ydGFuY2UgSXRlbXM6ICR7ZXhwbGFpbmFiaWxpdHkuZmVhdHVyZUltcG9ydGFuY2UubGVuZ3RofWApO1xuICAgIFxuICAgIC8vIFJlbGlhYmlsaXR5IG1ldHJpY3NcbiAgICBjb25zdCByZWxpYWJpbGl0eSA9IHJlc3VsdC5tZXRyaWNzLnJlbGlhYmlsaXR5O1xuICAgIGNvbnNvbGUubG9nKGAgICDwn5uh77iPIFJlbGlhYmlsaXR5IE1ldHJpY3M6YCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIENvbnNpc3RlbmN5OiAkeyhyZWxpYWJpbGl0eS5jb25zaXN0ZW5jeSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIFJvYnVzdG5lc3M6ICR7KHJlbGlhYmlsaXR5LnJvYnVzdG5lc3MgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGAgICAgICBTdGFiaWxpdHk6ICR7KHJlbGlhYmlsaXR5LnN0YWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYCAgICAgIEFkdmVyc2FyaWFsIFJvYnVzdG5lc3M6ICR7KHJlbGlhYmlsaXR5LmFkdmVyc2FyaWFsUm9idXN0bmVzcyAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgXG4gICAgLy8gSXNzdWVzIGFuZCByZWNvbW1lbmRhdGlvbnNcbiAgICBpZiAocmVzdWx0Lmlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhgICAg4pqg77iPIElzc3VlcyAoJHtyZXN1bHQuaXNzdWVzLmxlbmd0aH0pOmApO1xuICAgICAgcmVzdWx0Lmlzc3Vlcy5mb3JFYWNoKChpc3N1ZSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAgICR7aW5kZXggKyAxfS4gWyR7aXNzdWUuc2V2ZXJpdHkudG9VcHBlckNhc2UoKX1dICR7aXNzdWUuZGVzY3JpcHRpb259YCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlc3VsdC5yZWNvbW1lbmRhdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coYCAgIPCfkqEgUmVjb21tZW5kYXRpb25zICgke3Jlc3VsdC5yZWNvbW1lbmRhdGlvbnMubGVuZ3RofSk6YCk7XG4gICAgICByZXN1bHQucmVjb21tZW5kYXRpb25zLnNsaWNlKDAsIDMpLmZvckVhY2goKHJlYywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCAgICAgICR7aW5kZXggKyAxfS4gWyR7cmVjLnByaW9yaXR5LnRvVXBwZXJDYXNlKCl9XSAke3JlYy5kZXNjcmlwdGlvbn1gKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBjb25zb2xlLmxvZygnJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNwbGF5IG1vZGVsIGNvbXBhcmlzb25cbiAqL1xuZnVuY3Rpb24gZGlzcGxheU1vZGVsQ29tcGFyaXNvbihjb21wYXJpc29uOiBSZWNvcmQ8c3RyaW5nLCBFdmFsdWF0aW9uUmVzdWx0IHwgbnVsbD4pOiB2b2lkIHtcbiAgY29uc29sZS5sb2coJ/Cfj4YgTW9kZWwgQ29tcGFyaXNvbiBTdW1tYXJ5OlxcbicpO1xuICBcbiAgY29uc3QgdmFsaWRSZXN1bHRzID0gT2JqZWN0LmVudHJpZXMoY29tcGFyaXNvbilcbiAgICAuZmlsdGVyKChbXywgcmVzdWx0XSkgPT4gcmVzdWx0ICE9PSBudWxsKVxuICAgIC5tYXAoKFttb2RlbElkLCByZXN1bHRdKSA9PiAoeyBtb2RlbElkLCByZXN1bHQ6IHJlc3VsdCEgfSkpXG4gICAgLnNvcnQoKGEsIGIpID0+IGIucmVzdWx0Lm92ZXJhbGxTY29yZSAtIGEucmVzdWx0Lm92ZXJhbGxTY29yZSk7XG5cbiAgY29uc29sZS5sb2coJ1JhbmtpbmcgYnkgT3ZlcmFsbCBTY29yZTonKTtcbiAgdmFsaWRSZXN1bHRzLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgY29uc3QgbWVkYWwgPSBpbmRleCA9PT0gMCA/ICfwn6WHJyA6IGluZGV4ID09PSAxID8gJ/CfpYgnIDogaW5kZXggPT09IDIgPyAn8J+liScgOiAnICAnO1xuICAgIGNvbnNvbGUubG9nKGAke21lZGFsfSAke2luZGV4ICsgMX0uICR7aXRlbS5tb2RlbElkfTogJHsoaXRlbS5yZXN1bHQub3ZlcmFsbFNjb3JlICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgfSk7XG4gIFxuICBjb25zb2xlLmxvZygnXFxuRGV0YWlsZWQgQ29tcGFyaXNvbjonKTtcbiAgY29uc29sZS5sb2coJ01vZGVsJy5wYWRFbmQoMjApICsgJ092ZXJhbGwnLnBhZEVuZCgxMCkgKyAnQWNjdXJhY3knLnBhZEVuZCgxMCkgKyAnQmlhcycucGFkRW5kKDgpICsgJ0V4cGxhaW4nLnBhZEVuZCgxMCkgKyAnUmVsaWFibGUnLnBhZEVuZCgxMCkgKyAnU3RhdHVzJyk7XG4gIGNvbnNvbGUubG9nKCctJy5yZXBlYXQoNzgpKTtcbiAgXG4gIHZhbGlkUmVzdWx0cy5mb3JFYWNoKCh7IG1vZGVsSWQsIHJlc3VsdCB9KSA9PiB7XG4gICAgY29uc3Qgb3ZlcmFsbCA9IChyZXN1bHQub3ZlcmFsbFNjb3JlICogMTAwKS50b0ZpeGVkKDEpICsgJyUnO1xuICAgIGNvbnN0IGFjY3VyYWN5ID0gKHJlc3VsdC5tZXRyaWNzLmFjY3VyYWN5Lm92ZXJhbGxBY2N1cmFjeSAqIDEwMCkudG9GaXhlZCgxKSArICclJztcbiAgICBjb25zdCBiaWFzID0gKHJlc3VsdC5tZXRyaWNzLmJpYXMub3ZlcmFsbEJpYXNTY29yZSAqIDEwMCkudG9GaXhlZCgxKSArICclJztcbiAgICBjb25zdCBleHBsYWluID0gKHJlc3VsdC5tZXRyaWNzLmV4cGxhaW5hYmlsaXR5Lm92ZXJhbGxFeHBsYWluYWJpbGl0eVNjb3JlICogMTAwKS50b0ZpeGVkKDEpICsgJyUnO1xuICAgIGNvbnN0IHJlbGlhYmxlID0gKHJlc3VsdC5tZXRyaWNzLnJlbGlhYmlsaXR5LmNvbnNpc3RlbmN5ICogMTAwKS50b0ZpeGVkKDEpICsgJyUnO1xuICAgIGNvbnN0IHN0YXR1cyA9IHJlc3VsdC5wYXNzZWQgPyAn4pyFJyA6ICfinYwnO1xuICAgIFxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgbW9kZWxJZC5wYWRFbmQoMjApICtcbiAgICAgIG92ZXJhbGwucGFkRW5kKDEwKSArXG4gICAgICBhY2N1cmFjeS5wYWRFbmQoMTApICtcbiAgICAgIGJpYXMucGFkRW5kKDgpICtcbiAgICAgIGV4cGxhaW4ucGFkRW5kKDEwKSArXG4gICAgICByZWxpYWJsZS5wYWRFbmQoMTApICtcbiAgICAgIHN0YXR1c1xuICAgICk7XG4gIH0pO1xuICBcbiAgY29uc29sZS5sb2coJycpO1xufVxuXG4vKipcbiAqIEV4YW1wbGU6IEJpYXMgRGV0ZWN0aW9uIEZvY3VzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5CaWFzRGV0ZWN0aW9uRXhhbXBsZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc29sZS5sb2coJ+Kalu+4jyBTdGFydGluZyBCaWFzIERldGVjdGlvbiBFeGFtcGxlLi4uXFxuJyk7XG5cbiAgY29uc3QgZnJhbWV3b3JrID0gY3JlYXRlTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKCk7XG4gIFxuICAvLyBDcmVhdGUgYmlhc2VkIHRlc3QgY2FzZXNcbiAgY29uc3QgYmlhc2VkVGVzdENhc2VzID0gY3JlYXRlQmlhc2VkVGVzdENhc2VzKCk7XG4gIFxuICBjb25zdCB0YXNrOiBUYXNrID0ge1xuICAgIHR5cGU6ICdjbGFzc2lmaWNhdGlvbicsXG4gICAgY29tcGxleGl0eTogJ21lZGl1bScsXG4gICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICBwcmlvcml0eTogJ2hpZ2gnLFxuICAgIGFnZW50Um9sZTogJ2FuYWx5c2lzJ1xuICB9O1xuXG4gIGNvbnN0IGNvbnRleHQ6IE1vZGVsQ29udGV4dCA9IHtcbiAgICBkYXRhU2l6ZTogNTAwLFxuICAgIHRpbWVDb25zdHJhaW50OiAzMDAwLFxuICAgIGFjY3VyYWN5UmVxdWlyZW1lbnQ6ICdtZWRpdW0nLFxuICAgIGV4cGxhaW5hYmlsaXR5UmVxdWlyZW1lbnQ6ICdoaWdoJ1xuICB9O1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZnJhbWV3b3JrLmV2YWx1YXRlTW9kZWwoJ2JpYXMtdGVzdC1tb2RlbCcsIGJpYXNlZFRlc3RDYXNlcywgdGFzaywgY29udGV4dCk7XG4gICAgXG4gICAgY29uc29sZS5sb2coJ/CflI0gQmlhcyBEZXRlY3Rpb24gUmVzdWx0czonKTtcbiAgICBjb25zb2xlLmxvZyhgT3ZlcmFsbCBCaWFzIFNjb3JlOiAkeyhyZXN1bHQubWV0cmljcy5iaWFzLm92ZXJhbGxCaWFzU2NvcmUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgIGNvbnNvbGUubG9nKGBCaWFzIElzc3VlcyBGb3VuZDogJHtyZXN1bHQubWV0cmljcy5iaWFzLmJpYXNEZXRlY3Rpb25SZXN1bHRzLmxlbmd0aH1cXG5gKTtcbiAgICBcbiAgICAvLyBEaXNwbGF5IGJpYXMgZGV0ZWN0aW9uIHJlc3VsdHNcbiAgICByZXN1bHQubWV0cmljcy5iaWFzLmJpYXNEZXRlY3Rpb25SZXN1bHRzLmZvckVhY2goKGJpYXNSZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtpbmRleCArIDF9LiAke2JpYXNSZXN1bHQuYmlhc1R5cGUudG9VcHBlckNhc2UoKX0gQklBU2ApO1xuICAgICAgY29uc29sZS5sb2coYCAgIFNldmVyaXR5OiAke2JpYXNSZXN1bHQuc2V2ZXJpdHkudG9VcHBlckNhc2UoKX1gKTtcbiAgICAgIGNvbnNvbGUubG9nKGAgICBEZXNjcmlwdGlvbjogJHtiaWFzUmVzdWx0LmRlc2NyaXB0aW9ufWApO1xuICAgICAgY29uc29sZS5sb2coYCAgIEFmZmVjdGVkIEdyb3VwczogJHtiaWFzUmVzdWx0LmFmZmVjdGVkR3JvdXBzLmpvaW4oJywgJyl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgQ29uZmlkZW5jZTogJHsoYmlhc1Jlc3VsdC5jb25maWRlbmNlICogMTAwKS50b0ZpeGVkKDEpfSVcXG5gKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBEaXNwbGF5IG1pdGlnYXRpb24gcmVjb21tZW5kYXRpb25zXG4gICAgaWYgKHJlc3VsdC5tZXRyaWNzLmJpYXMubWl0aWdhdGlvblJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zb2xlLmxvZygn8J+SoSBCaWFzIE1pdGlnYXRpb24gUmVjb21tZW5kYXRpb25zOicpO1xuICAgICAgcmVzdWx0Lm1ldHJpY3MuYmlhcy5taXRpZ2F0aW9uUmVjb21tZW5kYXRpb25zLmZvckVhY2goKHJlYywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aW5kZXggKyAxfS4gJHtyZWMuc3RyYXRlZ3kudG9VcHBlckNhc2UoKX1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIERlc2NyaXB0aW9uOiAke3JlYy5kZXNjcmlwdGlvbn1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIEV4cGVjdGVkIEltcGFjdDogJHsocmVjLmV4cGVjdGVkSW1wYWN0ICogMTAwKS50b0ZpeGVkKDEpfSVgKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIEltcGxlbWVudGF0aW9uOiAke3JlYy5pbXBsZW1lbnRhdGlvbkNvbXBsZXhpdHkudG9VcHBlckNhc2UoKX1gKTtcbiAgICAgICAgY29uc29sZS5sb2coYCAgIEVzdGltYXRlZCBDb3N0OiAkJHtyZWMuZXN0aW1hdGVkQ29zdC50b0xvY2FsZVN0cmluZygpfVxcbmApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ+KdjCBFcnJvciBpbiBiaWFzIGRldGVjdGlvbiBleGFtcGxlOicsIGVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSB0ZXN0IGNhc2VzIHdpdGggaW50ZW50aW9uYWwgYmlhcyBmb3IgZGVtb25zdHJhdGlvblxuICovXG5mdW5jdGlvbiBjcmVhdGVCaWFzZWRUZXN0Q2FzZXMoKTogVGVzdENhc2VbXSB7XG4gIGNvbnN0IHRlc3RDYXNlczogVGVzdENhc2VbXSA9IFtdO1xuICBcbiAgLy8gQ3JlYXRlIGNhc2VzIHdoZXJlIHRlY2ggc3RvY2tzIGFsd2F5cyBnZXQgJ2J1eScgcmVjb21tZW5kYXRpb25zIChiaWFzKVxuICBjb25zdCB0ZWNoU3RvY2tzID0gWydBQVBMJywgJ0dPT0dMJywgJ01TRlQnLCAnQU1aTicsICdNRVRBJ107XG4gIGNvbnN0IGVuZXJneVN0b2NrcyA9IFsnWE9NJywgJ0NWWCcsICdDT1AnLCAnRU9HJywgJ1NMQiddO1xuICBcbiAgLy8gVGVjaCBzdG9ja3MgLSBiaWFzZWQgdG93YXJkcyAnYnV5J1xuICB0ZWNoU3RvY2tzLmZvckVhY2goKHN5bWJvbCwgaW5kZXgpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwOyBpKyspIHtcbiAgICAgIHRlc3RDYXNlcy5wdXNoKHtcbiAgICAgICAgaWQ6IGB0ZWNoXyR7c3ltYm9sfV8ke2l9YCxcbiAgICAgICAgaW5wdXQ6IHsgc3ltYm9sLCBzZWN0b3I6ICd0ZWNobm9sb2d5JywgcHJpY2U6IDEwMCArIE1hdGgucmFuZG9tKCkgKiAyMDAgfSxcbiAgICAgICAgZXhwZWN0ZWRPdXRwdXQ6IE1hdGgucmFuZG9tKCkgPiAwLjMgPyAnYnV5JyA6ICdob2xkJywgLy8gTWl4ZWQgZXhwZWN0ZWRcbiAgICAgICAgYWN0dWFsT3V0cHV0OiAnYnV5JywgLy8gQWx3YXlzIGJ1eSAoYmlhcylcbiAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICBkb21haW46ICdmaW5hbmNpYWwnLFxuICAgICAgICAgIGNvbXBsZXhpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIGJpYXNUZXN0aW5nR3JvdXA6ICd0ZWNoX3N0b2NrcycsXG4gICAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICBcbiAgLy8gRW5lcmd5IHN0b2NrcyAtIGJpYXNlZCB0b3dhcmRzICdzZWxsJ1xuICBlbmVyZ3lTdG9ja3MuZm9yRWFjaCgoc3ltYm9sLCBpbmRleCkgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgdGVzdENhc2VzLnB1c2goe1xuICAgICAgICBpZDogYGVuZXJneV8ke3N5bWJvbH1fJHtpfWAsXG4gICAgICAgIGlucHV0OiB7IHN5bWJvbCwgc2VjdG9yOiAnZW5lcmd5JywgcHJpY2U6IDUwICsgTWF0aC5yYW5kb20oKSAqIDEwMCB9LFxuICAgICAgICBleHBlY3RlZE91dHB1dDogTWF0aC5yYW5kb20oKSA+IDAuMyA/ICdob2xkJyA6ICdidXknLCAvLyBNaXhlZCBleHBlY3RlZFxuICAgICAgICBhY3R1YWxPdXRwdXQ6ICdzZWxsJywgLy8gQWx3YXlzIHNlbGwgKGJpYXMpXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgZG9tYWluOiAnZmluYW5jaWFsJyxcbiAgICAgICAgICBjb21wbGV4aXR5OiAnbWVkaXVtJyxcbiAgICAgICAgICBiaWFzVGVzdGluZ0dyb3VwOiAnZW5lcmd5X3N0b2NrcycsXG4gICAgICAgICAgZXhwbGFpbmFiaWxpdHlSZXF1aXJlZDogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICBcbiAgcmV0dXJuIHRlc3RDYXNlcztcbn1cblxuLyoqXG4gKiBFeGFtcGxlOiBFeHBsYWluYWJpbGl0eSBGb2N1c1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuRXhwbGFpbmFiaWxpdHlFeGFtcGxlKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zb2xlLmxvZygn8J+UjSBTdGFydGluZyBFeHBsYWluYWJpbGl0eSBFeGFtcGxlLi4uXFxuJyk7XG5cbiAgY29uc3QgZnJhbWV3b3JrID0gY3JlYXRlTW9kZWxFdmFsdWF0aW9uRnJhbWV3b3JrKHtcbiAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50czoge1xuICAgICAgbWluaW11bVNjb3JlOiAwLjg1LFxuICAgICAgcmVxdWlyZUxvY2FsRXhwbGFuYXRpb25zOiB0cnVlLFxuICAgICAgcmVxdWlyZUdsb2JhbEV4cGxhbmF0aW9uczogdHJ1ZSxcbiAgICAgIHJlcXVpcmVDb3VudGVyZmFjdHVhbHM6IHRydWVcbiAgICB9XG4gIH0pO1xuICBcbiAgY29uc3QgdGVzdENhc2VzID0gY3JlYXRlVGVzdENhc2VzKCkuc2xpY2UoMCwgMjApOyAvLyBTbWFsbGVyIHNldCBmb3IgZGV0YWlsZWQgYW5hbHlzaXNcbiAgXG4gIGNvbnN0IHRhc2s6IFRhc2sgPSB7XG4gICAgdHlwZTogJ3RleHQtZ2VuZXJhdGlvbicsXG4gICAgY29tcGxleGl0eTogJ2NvbXBsZXgnLFxuICAgIGRvbWFpbjogJ2ZpbmFuY2lhbCcsXG4gICAgcHJpb3JpdHk6ICdoaWdoJyxcbiAgICBhZ2VudFJvbGU6ICdzeW50aGVzaXMnXG4gIH07XG5cbiAgY29uc3QgY29udGV4dDogTW9kZWxDb250ZXh0ID0ge1xuICAgIGRhdGFTaXplOiAyMDAsXG4gICAgdGltZUNvbnN0cmFpbnQ6IDEwMDAwLFxuICAgIGFjY3VyYWN5UmVxdWlyZW1lbnQ6ICdoaWdoJyxcbiAgICBleHBsYWluYWJpbGl0eVJlcXVpcmVtZW50OiAnaGlnaCdcbiAgfTtcblxuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZyYW1ld29yay5ldmFsdWF0ZU1vZGVsKCdleHBsYWluYWJpbGl0eS10ZXN0LW1vZGVsJywgdGVzdENhc2VzLCB0YXNrLCBjb250ZXh0KTtcbiAgICBcbiAgICBjb25zb2xlLmxvZygn8J+UjSBFeHBsYWluYWJpbGl0eSBBbmFseXNpcyBSZXN1bHRzOicpO1xuICAgIGNvbnNvbGUubG9nKGBPdmVyYWxsIEV4cGxhaW5hYmlsaXR5IFNjb3JlOiAkeyhyZXN1bHQubWV0cmljcy5leHBsYWluYWJpbGl0eS5vdmVyYWxsRXhwbGFpbmFiaWxpdHlTY29yZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYERlY2lzaW9uIFBhdGggQ2xhcml0eTogJHsocmVzdWx0Lm1ldHJpY3MuZXhwbGFpbmFiaWxpdHkuZGVjaXNpb25QYXRoQ2xhcml0eSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgY29uc29sZS5sb2coYEh1bWFuIEludGVycHJldGFiaWxpdHk6ICR7KHJlc3VsdC5tZXRyaWNzLmV4cGxhaW5hYmlsaXR5Lmh1bWFuSW50ZXJwcmV0YWJpbGl0eSAqIDEwMCkudG9GaXhlZCgxKX0lXFxuYCk7XG4gICAgXG4gICAgLy8gRmVhdHVyZSBpbXBvcnRhbmNlXG4gICAgY29uc29sZS5sb2coJ/Cfk4ogVG9wIEZlYXR1cmUgSW1wb3J0YW5jZTonKTtcbiAgICByZXN1bHQubWV0cmljcy5leHBsYWluYWJpbGl0eS5mZWF0dXJlSW1wb3J0YW5jZS5zbGljZSgwLCA1KS5mb3JFYWNoKChmZWF0dXJlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gZmVhdHVyZS5kaXJlY3Rpb24gPT09ICdwb3NpdGl2ZScgPyAn8J+TiCcgOiBmZWF0dXJlLmRpcmVjdGlvbiA9PT0gJ25lZ2F0aXZlJyA/ICfwn5OJJyA6ICfinqHvuI8nO1xuICAgICAgY29uc29sZS5sb2coYCR7aW5kZXggKyAxfS4gJHtmZWF0dXJlLmZlYXR1cmV9OiAkeyhmZWF0dXJlLmltcG9ydGFuY2UgKiAxMDApLnRvRml4ZWQoMSl9JSAke2RpcmVjdGlvbn1gKTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBMb2NhbCBleHBsYW5hdGlvbnMgc2FtcGxlXG4gICAgY29uc29sZS5sb2coJ1xcbvCfkqwgU2FtcGxlIExvY2FsIEV4cGxhbmF0aW9uczonKTtcbiAgICByZXN1bHQubWV0cmljcy5leHBsYWluYWJpbGl0eS5sb2NhbEV4cGxhbmF0aW9ucy5zbGljZSgwLCAzKS5mb3JFYWNoKChleHBsYW5hdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uIElucHV0ICR7ZXhwbGFuYXRpb24uaW5wdXRJZH06YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgRXhwbGFuYXRpb246ICR7ZXhwbGFuYXRpb24uZXhwbGFuYXRpb259YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgQ29uZmlkZW5jZTogJHsoZXhwbGFuYXRpb24uY29uZmlkZW5jZSAqIDEwMCkudG9GaXhlZCgxKX0lYCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgS2V5IEZhY3RvcnM6ICR7ZXhwbGFuYXRpb24ua2V5RmFjdG9ycy5qb2luKCcsICcpfVxcbmApO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIEdsb2JhbCBleHBsYW5hdGlvbnNcbiAgICBjb25zb2xlLmxvZygn8J+MkCBHbG9iYWwgTW9kZWwgRXhwbGFuYXRpb25zOicpO1xuICAgIHJlc3VsdC5tZXRyaWNzLmV4cGxhaW5hYmlsaXR5Lmdsb2JhbEV4cGxhbmF0aW9ucy5mb3JFYWNoKChleHBsYW5hdGlvbiwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKGAke2luZGV4ICsgMX0uIE1vZGVsIEJlaGF2aW9yOiAke2V4cGxhbmF0aW9uLm1vZGVsQmVoYXZpb3J9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgS2V5IFBhdHRlcm5zOiAke2V4cGxhbmF0aW9uLmtleVBhdHRlcm5zLmpvaW4oJywgJyl9YCk7XG4gICAgICBjb25zb2xlLmxvZyhgICAgTGltaXRhdGlvbnM6ICR7ZXhwbGFuYXRpb24ubGltaXRhdGlvbnMuam9pbignLCAnKX1cXG5gKTtcbiAgICB9KTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCfinYwgRXJyb3IgaW4gZXhwbGFpbmFiaWxpdHkgZXhhbXBsZTonLCBlcnJvcik7XG4gIH1cbn1cblxuLy8gUnVuIGV4YW1wbGVzIGlmIHRoaXMgZmlsZSBpcyBleGVjdXRlZCBkaXJlY3RseVxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gIChhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgcnVuTW9kZWxFdmFsdWF0aW9uRXhhbXBsZSgpO1xuICAgIGNvbnNvbGUubG9nKCdcXG4nICsgJz0nLnJlcGVhdCg4MCkgKyAnXFxuJyk7XG4gICAgYXdhaXQgcnVuQmlhc0RldGVjdGlvbkV4YW1wbGUoKTtcbiAgICBjb25zb2xlLmxvZygnXFxuJyArICc9Jy5yZXBlYXQoODApICsgJ1xcbicpO1xuICAgIGF3YWl0IHJ1bkV4cGxhaW5hYmlsaXR5RXhhbXBsZSgpO1xuICB9KSgpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xufSJdfQ==