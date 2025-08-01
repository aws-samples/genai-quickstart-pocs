/**
 * Model Selection Service Example
 * 
 * This example demonstrates how to use the Model Selection Service
 * to intelligently choose the best AI model for different investment analysis tasks.
 */

import {
  getModelSelectionService,
  ModelSelectionServiceImpl
} from '../services/ai/model-selection-service';
import {
  Task,
  ModelContext,
  PerformanceMetrics
} from '../models/services';

async function demonstrateModelSelection() {
  console.log('🤖 Investment AI Agent - Model Selection Service Demo\n');

  // Get the model selection service instance
  const modelService = getModelSelectionService();

  // Example 1: Supervisor Agent Task (Complex reasoning)
  console.log('📋 Example 1: Supervisor Agent Task');
  const supervisorTask: Task = {
    type: 'text-generation',
    complexity: 'complex',
    domain: 'financial',
    priority: 'high',
    agentRole: 'supervisor'
  };

  const supervisorContext: ModelContext = {
    dataSize: 10000,
    timeConstraint: 15000, // 15 seconds
    accuracyRequirement: 'high',
    explainabilityRequirement: 'high'
  };

  const supervisorModel = await modelService.selectModel(supervisorTask, supervisorContext);
  console.log(`Selected Model: ${supervisorModel.name}`);
  console.log(`Capabilities: ${supervisorModel.capabilities.join(', ')}`);
  console.log(`Configuration: ${JSON.stringify(supervisorModel.configurationParameters, null, 2)}\n`);

  // Example 2: Research Agent Task (Fast processing)
  console.log('🔍 Example 2: Research Agent Task');
  const researchTask: Task = {
    type: 'classification',
    complexity: 'simple',
    domain: 'general',
    priority: 'medium',
    agentRole: 'research'
  };

  const researchContext: ModelContext = {
    dataSize: 2000,
    timeConstraint: 3000, // 3 seconds
    accuracyRequirement: 'medium',
    explainabilityRequirement: 'low'
  };

  const researchModel = await modelService.selectModel(researchTask, researchContext);
  console.log(`Selected Model: ${researchModel.name}`);
  console.log(`Capabilities: ${researchModel.capabilities.join(', ')}`);
  console.log(`Configuration: ${JSON.stringify(researchModel.configurationParameters, null, 2)}\n`);

  // Example 3: Analysis Agent Task (Quantitative analysis)
  console.log('📊 Example 3: Analysis Agent Task');
  const analysisTask: Task = {
    type: 'time-series-analysis',
    complexity: 'complex',
    domain: 'financial',
    priority: 'high',
    agentRole: 'analysis'
  };

  const analysisContext: ModelContext = {
    dataSize: 15000,
    timeConstraint: 20000, // 20 seconds
    accuracyRequirement: 'high',
    explainabilityRequirement: 'medium'
  };

  const analysisModel = await modelService.selectModel(analysisTask, analysisContext);
  console.log(`Selected Model: ${analysisModel.name}`);
  console.log(`Capabilities: ${analysisModel.capabilities.join(', ')}`);
  console.log(`Configuration: ${JSON.stringify(analysisModel.configurationParameters, null, 2)}\n`);

  // Example 4: Performance Monitoring
  console.log('📈 Example 4: Performance Monitoring');
  
  // Simulate recording performance metrics
  const mockMetrics: PerformanceMetrics = {
    accuracy: 0.92,
    latency: 2500,
    throughput: 25,
    costPerRequest: 0.012,
    errorRate: 0.02,
    customMetrics: {
      'financial_accuracy': 0.95,
      'explanation_quality': 0.88
    }
  };

  modelService.recordPerformance('claude-sonnet-3.7', supervisorTask, mockMetrics, true);
  
  const performanceMetrics = await modelService.evaluateModelPerformance('claude-sonnet-3.7', supervisorTask);
  console.log('Claude Sonnet 3.7 Performance:');
  console.log(`- Accuracy: ${(performanceMetrics.accuracy * 100).toFixed(1)}%`);
  console.log(`- Latency: ${performanceMetrics.latency}ms`);
  console.log(`- Error Rate: ${(performanceMetrics.errorRate * 100).toFixed(1)}%`);
  console.log(`- Cost per Request: $${performanceMetrics.costPerRequest.toFixed(4)}\n`);

  // Example 5: Model Health Monitoring
  console.log('🏥 Example 5: Model Health Monitoring');
  const health = modelService.getModelHealth('claude-sonnet-3.7');
  console.log(`Health Status: ${health.status.toUpperCase()}`);
  if (health.issues.length > 0) {
    console.log('Issues:');
    health.issues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('No issues detected');
  }
  console.log();

  // Example 6: Fallback Mechanism
  console.log('🔄 Example 6: Fallback Mechanism');
  const fallbackModel = modelService.getFallbackModel('claude-sonnet-3.7', supervisorTask, supervisorContext);
  console.log(`Fallback Model: ${fallbackModel.name}`);
  console.log(`Fallback ID: ${fallbackModel.id}\n`);

  // Example 7: Custom Model Registration
  console.log('🔧 Example 7: Custom Model Registration');
  const customModel = {
    id: 'custom-financial-model',
    name: 'Custom Financial Analysis Model',
    version: '1.0',
    provider: 'InvestmentAI',
    capabilities: ['financial-analysis', 'risk-assessment', 'portfolio-optimization'],
    limitations: ['domain-specific', 'requires-financial-data'],
    configurationSchema: {
      temperature: { type: 'number', default: 0.3 },
      maxTokens: { type: 'number', default: 3072 },
      financialFocus: { type: 'boolean', default: true }
    }
  };

  const registrationResult = await modelService.registerCustomModel(customModel);
  if (registrationResult.success) {
    console.log(`✅ Successfully registered custom model: ${customModel.name}`);
    console.log(`Model ID: ${registrationResult.modelId}`);
  } else {
    console.log(`❌ Failed to register custom model: ${registrationResult.error}`);
  }
  console.log();

  // Example 8: Multi-Agent Workflow Simulation
  console.log('🤝 Example 8: Multi-Agent Workflow Simulation');
  console.log('Simulating a complete investment analysis workflow...\n');

  const agents = [
    { role: 'supervisor', task: 'text-generation', complexity: 'complex' as const },
    { role: 'planning', task: 'text-generation', complexity: 'medium' as const },
    { role: 'research', task: 'classification', complexity: 'simple' as const },
    { role: 'analysis', task: 'time-series-analysis', complexity: 'complex' as const },
    { role: 'compliance', task: 'classification', complexity: 'medium' as const },
    { role: 'synthesis', task: 'text-generation', complexity: 'complex' as const }
  ];

  for (const agent of agents) {
    const agentTask: Task = {
      type: agent.task as any,
      complexity: agent.complexity,
      domain: 'financial',
      priority: 'high',
      agentRole: agent.role as any
    };

    const agentContext: ModelContext = {
      dataSize: 5000,
      timeConstraint: 10000,
      accuracyRequirement: 'high',
      explainabilityRequirement: 'high'
    };

    const selectedModel = await modelService.selectModel(agentTask, agentContext);
    console.log(`${agent.role.toUpperCase()} Agent → ${selectedModel.name}`);
  }

  console.log('\n✨ Model Selection Service Demo Complete!');
}

// Run the demonstration
if (require.main === module) {
  demonstrateModelSelection().catch(console.error);
}

export { demonstrateModelSelection };