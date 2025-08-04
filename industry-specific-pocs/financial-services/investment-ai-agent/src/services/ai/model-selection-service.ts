/**
 * Model Selection Service
 * 
 * This service implements intelligent model selection based on task requirements,
 * performance monitoring, and fallback mechanisms for model failures.
 */

import {
  Task,
  ModelContext,
  SelectedModel,
  ModelDefinition,
  PerformanceMetrics,
  RegistrationResult,
  ModelSelectionService
} from '../../models/services';

export interface ModelSelectionConfig {
  defaultModel: string;
  performanceThresholds: {
    accuracy: number;
    latency: number;
    errorRate: number;
  };
  fallbackChain: string[];
  evaluationInterval: number; // in milliseconds
  maxRetries: number;
}

export interface ModelPerformanceHistory {
  modelId: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
  taskType: string;
  success: boolean;
}

export interface ModelCapabilityMatrix {
  [modelId: string]: {
    taskTypes: string[];
    domains: string[];
    complexityLevels: string[];
    agentRoles: string[];
    strengths: string[];
    weaknesses: string[];
  };
}

export class ModelSelectionServiceImpl implements ModelSelectionService {
  private config: ModelSelectionConfig;
  private performanceHistory: ModelPerformanceHistory[] = [];
  private registeredModels: Map<string, ModelDefinition> = new Map();
  private capabilityMatrix: ModelCapabilityMatrix;

  constructor(config?: Partial<ModelSelectionConfig>) {
    this.config = {
      defaultModel: 'claude-sonnet-3.7',
      performanceThresholds: {
        accuracy: 0.85,
        latency: 5000, // 5 seconds
        errorRate: 0.05
      },
      fallbackChain: ['claude-sonnet-3.7', 'claude-haiku-3.5', 'amazon-nova-pro'],
      evaluationInterval: 300000, // 5 minutes
      maxRetries: 3,
      ...config
    };

    this.initializeCapabilityMatrix();
    this.initializeDefaultModels();
  }

  /**
   * Select the most appropriate model for a given task and context
   */
  async selectModel(task: Task, context: ModelContext): Promise<SelectedModel> {
    try {
      // Step 1: Get candidate models based on task requirements
      const candidates = this.getCandidateModels(task);
      
      // Step 2: Score candidates based on context and performance history
      const scoredCandidates = await this.scoreCandidates(candidates, task, context);
      
      // Step 3: Select the best model
      const selectedModelId = this.selectBestModel(scoredCandidates);
      
      // Step 4: Get model configuration
      const selectedModel = this.getModelConfiguration(selectedModelId, task, context);
      
      console.log(`Selected model ${selectedModel.name} for task type ${task.type} with agent role ${task.agentRole}`);
      
      return selectedModel;
    } catch (error) {
      console.error('Error in model selection:', error);
      // Fallback to default model
      return this.getModelConfiguration(this.config.defaultModel, task, context);
    }
  }

  /**
   * Evaluate model performance for a specific task
   */
  async evaluateModelPerformance(modelId: string, task: Task): Promise<PerformanceMetrics> {
    const recentHistory = this.getRecentPerformanceHistory(modelId, task.type);
    
    if (recentHistory.length === 0) {
      // Return default metrics if no history available
      return this.getDefaultMetrics(modelId);
    }

    // Calculate aggregate metrics from recent history
    const metrics = this.calculateAggregateMetrics(recentHistory);
    
    return metrics;
  }

  /**
   * Register a custom model
   */
  async registerCustomModel(model: ModelDefinition): Promise<RegistrationResult> {
    try {
      // Validate model definition
      this.validateModelDefinition(model);
      
      // Register the model
      this.registeredModels.set(model.id, model);
      
      // Update capability matrix
      this.updateCapabilityMatrix(model);
      
      console.log(`Successfully registered custom model: ${model.name}`);
      
      return {
        success: true,
        modelId: model.id
      };
    } catch (error) {
      console.error('Error registering custom model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Record performance metrics for a model execution
   */
  recordPerformance(
    modelId: string,
    task: Task,
    metrics: PerformanceMetrics,
    success: boolean
  ): void {
    const record: ModelPerformanceHistory = {
      modelId,
      timestamp: new Date(),
      metrics,
      taskType: task.type,
      success
    };

    this.performanceHistory.push(record);
    
    // Keep only recent history (last 1000 records)
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory = this.performanceHistory.slice(-1000);
    }
  }

  /**
   * Get fallback model for a failed model
   */
  getFallbackModel(failedModelId: string, task: Task, context: ModelContext): SelectedModel {
    const fallbackChain = this.config.fallbackChain.filter(id => id !== failedModelId);
    
    for (const modelId of fallbackChain) {
      const capabilities = this.capabilityMatrix[modelId];
      if (capabilities && this.isModelSuitableForTask(capabilities, task)) {
        console.log(`Using fallback model ${modelId} for failed model ${failedModelId}`);
        return this.getModelConfiguration(modelId, task, context);
      }
    }
    
    // If no suitable fallback found in chain, try any available model that can handle the task
    for (const [modelId, capabilities] of Object.entries(this.capabilityMatrix)) {
      if (modelId !== failedModelId && this.isModelSuitableForTask(capabilities, task)) {
        console.log(`Using alternative model ${modelId} for failed model ${failedModelId}`);
        return this.getModelConfiguration(modelId, task, context);
      }
    }
    
    // Last resort: return default model (but not the failed one)
    let defaultModel = this.config.defaultModel !== failedModelId 
      ? this.config.defaultModel 
      : this.config.fallbackChain.find(id => id !== failedModelId) || 'claude-haiku-3.5';
    
    // Ensure the default model exists in our registered models
    if (!this.registeredModels.has(defaultModel)) {
      defaultModel = Array.from(this.registeredModels.keys()).find(id => id !== failedModelId) || 'claude-sonnet-3.7';
    }
    
    console.warn(`No suitable fallback found, using default model ${defaultModel} for task ${task.type}`);
    return this.getModelConfiguration(defaultModel, task, context);
  }

  /**
   * Get model health status
   */
  getModelHealth(modelId: string): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: PerformanceMetrics;
    issues: string[];
  } {
    const recentHistory = this.performanceHistory
      .filter(h => h.modelId === modelId)
      .slice(-50); // Last 50 executions

    if (recentHistory.length === 0) {
      return {
        status: 'healthy',
        metrics: this.getDefaultMetrics(modelId),
        issues: []
      };
    }

    const metrics = this.calculateAggregateMetrics(recentHistory);
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check against thresholds - prioritize degraded over unhealthy for single issues
    let issueCount = 0;
    
    if (metrics.accuracy < this.config.performanceThresholds.accuracy) {
      issues.push(`Low accuracy: ${metrics.accuracy.toFixed(3)}`);
      issueCount++;
    }

    if (metrics.latency > this.config.performanceThresholds.latency) {
      issues.push(`High latency: ${metrics.latency}ms`);
      issueCount++;
    }

    if (metrics.errorRate > this.config.performanceThresholds.errorRate) {
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      issueCount++;
    }
    
    // Determine status based on number and severity of issues
    if (issueCount === 0) {
      status = 'healthy';
    } else if (issueCount === 1 || (issueCount === 2 && metrics.errorRate <= this.config.performanceThresholds.errorRate)) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, metrics, issues };
  }

  private initializeCapabilityMatrix(): void {
    this.capabilityMatrix = {
      'claude-sonnet-3.7': {
        taskTypes: ['text-generation', 'classification', 'sentiment-analysis', 'entity-extraction'],
        domains: ['general', 'financial', 'regulatory', 'market'],
        complexityLevels: ['medium', 'complex'],
        agentRoles: ['supervisor', 'planning', 'synthesis'],
        strengths: ['complex reasoning', 'nuanced understanding', 'comprehensive analysis'],
        weaknesses: ['higher latency', 'higher cost']
      },
      'claude-haiku-3.5': {
        taskTypes: ['text-generation', 'classification', 'sentiment-analysis', 'entity-extraction'],
        domains: ['general', 'financial', 'regulatory'],
        complexityLevels: ['simple', 'medium'],
        agentRoles: ['research', 'compliance'],
        strengths: ['fast processing', 'cost-effective', 'efficient'],
        weaknesses: ['limited complex reasoning', 'shorter context window']
      },
      'amazon-nova-pro': {
        taskTypes: ['time-series-analysis', 'classification', 'text-generation'],
        domains: ['financial', 'market'],
        complexityLevels: ['medium', 'complex'],
        agentRoles: ['analysis'],
        strengths: ['financial analysis', 'quantitative tasks', 'pattern recognition'],
        weaknesses: ['limited general knowledge', 'specialized domain']
      }
    };
  }

  private initializeDefaultModels(): void {
    const defaultModels: ModelDefinition[] = [
      {
        id: 'claude-sonnet-3.7',
        name: 'Claude Sonnet 3.7',
        version: '3.7',
        provider: 'Anthropic',
        capabilities: ['text-generation', 'analysis', 'reasoning'],
        limitations: ['token-limit', 'cost'],
        configurationSchema: {
          maxTokens: { type: 'number', default: 4096 },
          temperature: { type: 'number', default: 0.7 },
          topP: { type: 'number', default: 0.9 }
        }
      },
      {
        id: 'claude-haiku-3.5',
        name: 'Claude Haiku 3.5',
        version: '3.5',
        provider: 'Anthropic',
        capabilities: ['text-generation', 'classification', 'efficiency'],
        limitations: ['complexity-limit', 'context-window'],
        configurationSchema: {
          maxTokens: { type: 'number', default: 2048 },
          temperature: { type: 'number', default: 0.5 },
          topP: { type: 'number', default: 0.8 }
        }
      },
      {
        id: 'amazon-nova-pro',
        name: 'Amazon Nova Pro',
        version: '1.0',
        provider: 'Amazon',
        capabilities: ['financial-analysis', 'quantitative-analysis', 'time-series'],
        limitations: ['domain-specific', 'general-knowledge'],
        configurationSchema: {
          maxTokens: { type: 'number', default: 3072 },
          temperature: { type: 'number', default: 0.3 },
          analysisDepth: { type: 'string', default: 'comprehensive' }
        }
      }
    ];

    defaultModels.forEach(model => {
      this.registeredModels.set(model.id, model);
    });
  }

  private getCandidateModels(task: Task): string[] {
    const candidates: string[] = [];
    
    for (const [modelId, capabilities] of Object.entries(this.capabilityMatrix)) {
      if (this.isModelSuitableForTask(capabilities, task)) {
        candidates.push(modelId);
      }
    }
    
    return candidates.length > 0 ? candidates : [this.config.defaultModel];
  }

  private isModelSuitableForTask(capabilities: ModelCapabilityMatrix[string], task: Task): boolean {
    return (
      capabilities.taskTypes.includes(task.type) &&
      capabilities.domains.includes(task.domain) &&
      capabilities.complexityLevels.includes(task.complexity) &&
      capabilities.agentRoles.includes(task.agentRole)
    );
  }

  private async scoreCandidates(
    candidates: string[],
    task: Task,
    context: ModelContext
  ): Promise<Array<{ modelId: string; score: number }>> {
    const scored = await Promise.all(
      candidates.map(async (modelId) => {
        const score = await this.calculateModelScore(modelId, task, context);
        return { modelId, score };
      })
    );
    
    return scored.sort((a, b) => b.score - a.score);
  }

  private async calculateModelScore(
    modelId: string,
    task: Task,
    context: ModelContext
  ): Promise<number> {
    let score = 0;
    
    // Base capability score
    const capabilities = this.capabilityMatrix[modelId];
    if (capabilities) {
      score += this.calculateCapabilityScore(capabilities, task);
    }
    
    // Performance history score
    const performanceMetrics = await this.evaluateModelPerformance(modelId, task);
    score += this.calculatePerformanceScore(performanceMetrics, context);
    
    // Context suitability score
    score += this.calculateContextScore(modelId, context);
    
    // Health penalty
    const health = this.getModelHealth(modelId);
    if (health.status === 'degraded') score *= 0.8;
    if (health.status === 'unhealthy') score *= 0.5;
    
    return score;
  }

  private calculateCapabilityScore(
    capabilities: ModelCapabilityMatrix[string],
    task: Task
  ): number {
    let score = 0;
    
    // Perfect matches get higher scores
    if (capabilities.taskTypes.includes(task.type)) score += 30;
    if (capabilities.domains.includes(task.domain)) score += 25;
    if (capabilities.complexityLevels.includes(task.complexity)) score += 20;
    if (capabilities.agentRoles.includes(task.agentRole)) score += 25;
    
    return score;
  }

  private calculatePerformanceScore(
    metrics: PerformanceMetrics,
    context: ModelContext
  ): number {
    let score = 0;
    
    // Accuracy score (0-30 points)
    score += metrics.accuracy * 30;
    
    // Latency score (0-20 points, inverse relationship)
    const latencyScore = Math.max(0, 20 - (metrics.latency / context.timeConstraint) * 20);
    score += latencyScore;
    
    // Error rate penalty
    score -= metrics.errorRate * 50;
    
    // Throughput bonus
    score += Math.min(10, metrics.throughput / 10);
    
    return Math.max(0, score);
  }

  private calculateContextScore(modelId: string, context: ModelContext): number {
    let score = 0;
    
    // Data size considerations
    if (context.dataSize > 10000 && modelId === 'claude-haiku-3.5') {
      score -= 10; // Haiku might struggle with large datasets
    }
    
    // Time constraint considerations
    if (context.timeConstraint < 5000 && modelId === 'claude-sonnet-3.7') {
      score -= 5; // Sonnet is slower
    }
    
    // Accuracy requirement matching
    if (context.accuracyRequirement === 'high' && modelId === 'claude-sonnet-3.7') {
      score += 10;
    }
    
    // Explainability requirement matching
    if (context.explainabilityRequirement === 'high' && modelId !== 'amazon-nova-pro') {
      score += 5;
    }
    
    return score;
  }

  private selectBestModel(scoredCandidates: Array<{ modelId: string; score: number }>): string {
    if (scoredCandidates.length === 0) {
      return this.config.defaultModel;
    }
    
    return scoredCandidates[0].modelId;
  }

  private getModelConfiguration(
    modelId: string,
    task: Task,
    context: ModelContext
  ): SelectedModel {
    const modelDef = this.registeredModels.get(modelId);
    if (!modelDef) {
      throw new Error(`Model ${modelId} not found`);
    }

    const config = this.generateModelConfiguration(modelId, task, context);
    
    return {
      id: modelId,
      name: modelDef.name as any,
      version: modelDef.version,
      capabilities: modelDef.capabilities,
      limitations: modelDef.limitations,
      configurationParameters: config
    };
  }

  private generateModelConfiguration(
    modelId: string,
    task: Task,
    context: ModelContext
  ): Record<string, any> {
    const baseConfig: Record<string, any> = {};
    
    // Adjust temperature based on task requirements
    if (task.type === 'classification' || context.accuracyRequirement === 'high') {
      baseConfig.temperature = 0.1;
    } else if (task.type === 'text-generation') {
      baseConfig.temperature = 0.7;
    }
    
    // Adjust max tokens based on complexity and data size
    if (task.complexity === 'complex' || context.dataSize > 5000) {
      baseConfig.maxTokens = 4096;
    } else {
      baseConfig.maxTokens = 2048;
    }
    
    // Model-specific configurations
    if (modelId === 'amazon-nova-pro') {
      baseConfig.analysisDepth = task.complexity === 'complex' ? 'comprehensive' : 'standard';
      baseConfig.financialFocus = task.domain === 'financial';
    }
    
    return baseConfig;
  }

  private getRecentPerformanceHistory(
    modelId: string,
    taskType: string,
    limit: number = 20
  ): ModelPerformanceHistory[] {
    return this.performanceHistory
      .filter(h => h.modelId === modelId && h.taskType === taskType)
      .slice(-limit);
  }

  private calculateAggregateMetrics(history: ModelPerformanceHistory[]): PerformanceMetrics {
    if (history.length === 0) {
      return this.getDefaultMetrics('unknown');
    }

    const successfulRuns = history.filter(h => h.success);
    const totalRuns = history.length;
    
    const avgAccuracy = successfulRuns.reduce((sum, h) => sum + h.metrics.accuracy, 0) / Math.max(1, successfulRuns.length);
    const avgLatency = history.reduce((sum, h) => sum + h.metrics.latency, 0) / totalRuns;
    const avgThroughput = history.reduce((sum, h) => sum + h.metrics.throughput, 0) / totalRuns;
    const avgCost = history.reduce((sum, h) => sum + h.metrics.costPerRequest, 0) / totalRuns;
    const errorRate = (totalRuns - successfulRuns.length) / totalRuns;

    return {
      accuracy: avgAccuracy,
      latency: avgLatency,
      throughput: avgThroughput,
      costPerRequest: avgCost,
      errorRate,
      customMetrics: {}
    };
  }

  private getDefaultMetrics(modelId: string): PerformanceMetrics {
    // Default metrics based on model characteristics
    const defaults: Record<string, PerformanceMetrics> = {
      'claude-sonnet-3.7': {
        accuracy: 0.90,
        latency: 3000,
        throughput: 20,
        costPerRequest: 0.015,
        errorRate: 0.02,
        customMetrics: {}
      },
      'claude-haiku-3.5': {
        accuracy: 0.85,
        latency: 1000,
        throughput: 50,
        costPerRequest: 0.005,
        errorRate: 0.03,
        customMetrics: {}
      },
      'amazon-nova-pro': {
        accuracy: 0.88,
        latency: 2000,
        throughput: 30,
        costPerRequest: 0.010,
        errorRate: 0.025,
        customMetrics: {}
      }
    };

    return defaults[modelId] || defaults['claude-sonnet-3.7'];
  }

  private validateModelDefinition(model: ModelDefinition): void {
    if (!model.id || !model.name || !model.version || !model.provider) {
      throw new Error('Model definition missing required fields');
    }
    
    if (this.registeredModels.has(model.id)) {
      throw new Error(`Model with ID ${model.id} already exists`);
    }
  }

  private updateCapabilityMatrix(model: ModelDefinition): void {
    // For custom models, we'll need to infer capabilities from the definition
    // This is a simplified implementation
    this.capabilityMatrix[model.id] = {
      taskTypes: model.capabilities.includes('text-generation') ? ['text-generation'] : ['classification'],
      domains: ['general'],
      complexityLevels: ['simple', 'medium'],
      agentRoles: ['research'],
      strengths: model.capabilities,
      weaknesses: model.limitations
    };
  }
}

/**
 * Factory function to create a model selection service instance
 */
export function createModelSelectionService(
  config?: Partial<ModelSelectionConfig>
): ModelSelectionServiceImpl {
  return new ModelSelectionServiceImpl(config);
}

/**
 * Singleton instance for global use
 */
let globalModelSelectionService: ModelSelectionServiceImpl | null = null;

export function getModelSelectionService(): ModelSelectionServiceImpl {
  if (!globalModelSelectionService) {
    globalModelSelectionService = createModelSelectionService();
  }
  return globalModelSelectionService;
}