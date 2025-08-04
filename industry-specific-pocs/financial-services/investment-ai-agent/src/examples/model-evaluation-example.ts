/**
 * Model Evaluation Framework Example
 * 
 * This example demonstrates how to use the AI Model Evaluation Framework
 * to assess model performance, detect bias, and evaluate explainability.
 */

import {
  ModelEvaluationFramework,
  createModelEvaluationFramework,
  TestCase,
  EvaluationConfig,
  EvaluationResult
} from '../services/ai/model-evaluation-framework';
import { Task, ModelContext } from '../models/services';

/**
 * Example: Comprehensive Model Evaluation
 */
export async function runModelEvaluationExample(): Promise<void> {
  console.log('🔍 Starting Model Evaluation Framework Example...\n');

  // Create evaluation framework with custom configuration
  const evaluationConfig: Partial<EvaluationConfig> = {
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

  const evaluationFramework = createModelEvaluationFramework(evaluationConfig);

  // Create test cases for evaluation
  const testCases = createTestCases();

  // Define task and context
  const task: Task = {
    type: 'classification',
    complexity: 'medium',
    domain: 'financial',
    priority: 'high',
    agentRole: 'analysis'
  };

  const context: ModelContext = {
    dataSize: 1000,
    timeConstraint: 5000,
    accuracyRequirement: 'high',
    explainabilityRequirement: 'high'
  };

  try {
    // Evaluate multiple models
    const modelsToEvaluate = ['claude-sonnet-3.7', 'claude-haiku-3.5', 'amazon-nova-pro'];
    const evaluationResults: Record<string, EvaluationResult> = {};

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

  } catch (error) {
    console.error('❌ Error during model evaluation:', error);
  }
}

/**
 * Create sample test cases for evaluation
 */
function createTestCases(): TestCase[] {
  const testCases: TestCase[] = [];

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
      const testCase: TestCase = {
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
function generateModelOutput(expectedOutput: string, variation: number): any {
  const accuracy = 0.8; // 80% accuracy simulation
  
  if (Math.random() < accuracy) {
    // Correct prediction
    return {
      prediction: expectedOutput,
      confidence: 0.7 + Math.random() * 0.3,
      reasoning: `Based on financial analysis, recommending ${expectedOutput}`
    };
  } else {
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
async function displayEvaluationResults(results: Record<string, EvaluationResult>): Promise<void> {
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
function displayModelComparison(comparison: Record<string, EvaluationResult | null>): void {
  console.log('🏆 Model Comparison Summary:\n');
  
  const validResults = Object.entries(comparison)
    .filter(([_, result]) => result !== null)
    .map(([modelId, result]) => ({ modelId, result: result! }))
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
    
    console.log(
      modelId.padEnd(20) +
      overall.padEnd(10) +
      accuracy.padEnd(10) +
      bias.padEnd(8) +
      explain.padEnd(10) +
      reliable.padEnd(10) +
      status
    );
  });
  
  console.log('');
}

/**
 * Example: Bias Detection Focus
 */
export async function runBiasDetectionExample(): Promise<void> {
  console.log('⚖️ Starting Bias Detection Example...\n');

  const framework = createModelEvaluationFramework();
  
  // Create biased test cases
  const biasedTestCases = createBiasedTestCases();
  
  const task: Task = {
    type: 'classification',
    complexity: 'medium',
    domain: 'financial',
    priority: 'high',
    agentRole: 'analysis'
  };

  const context: ModelContext = {
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
    
  } catch (error) {
    console.error('❌ Error in bias detection example:', error);
  }
}

/**
 * Create test cases with intentional bias for demonstration
 */
function createBiasedTestCases(): TestCase[] {
  const testCases: TestCase[] = [];
  
  // Create cases where tech stocks always get 'buy' recommendations (bias)
  const techStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'];
  const energyStocks = ['XOM', 'CVX', 'COP', 'EOG', 'SLB'];
  
  // Tech stocks - biased towards 'buy'
  techStocks.forEach((symbol, index) => {
    for (let i = 0; i < 10; i++) {
      testCases.push({
        id: `tech_${symbol}_${i}`,
        input: { symbol, sector: 'technology', price: 100 + Math.random() * 200 },
        expectedOutput: Math.random() > 0.3 ? 'buy' : 'hold', // Mixed expected
        actualOutput: 'buy', // Always buy (bias)
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
        expectedOutput: Math.random() > 0.3 ? 'hold' : 'buy', // Mixed expected
        actualOutput: 'sell', // Always sell (bias)
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
export async function runExplainabilityExample(): Promise<void> {
  console.log('🔍 Starting Explainability Example...\n');

  const framework = createModelEvaluationFramework({
    explainabilityRequirements: {
      minimumScore: 0.85,
      requireLocalExplanations: true,
      requireGlobalExplanations: true,
      requireCounterfactuals: true
    }
  });
  
  const testCases = createTestCases().slice(0, 20); // Smaller set for detailed analysis
  
  const task: Task = {
    type: 'text-generation',
    complexity: 'complex',
    domain: 'financial',
    priority: 'high',
    agentRole: 'synthesis'
  };

  const context: ModelContext = {
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
    
  } catch (error) {
    console.error('❌ Error in explainability example:', error);
  }
}

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