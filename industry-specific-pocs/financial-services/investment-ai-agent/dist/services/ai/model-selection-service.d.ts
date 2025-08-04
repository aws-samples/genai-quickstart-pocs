/**
 * Model Selection Service
 *
 * This service implements intelligent model selection based on task requirements,
 * performance monitoring, and fallback mechanisms for model failures.
 */
import { Task, ModelContext, SelectedModel, ModelDefinition, PerformanceMetrics, RegistrationResult, ModelSelectionService } from '../../models/services';
export interface ModelSelectionConfig {
    defaultModel: string;
    performanceThresholds: {
        accuracy: number;
        latency: number;
        errorRate: number;
    };
    fallbackChain: string[];
    evaluationInterval: number;
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
export declare class ModelSelectionServiceImpl implements ModelSelectionService {
    private config;
    private performanceHistory;
    private registeredModels;
    private capabilityMatrix;
    constructor(config?: Partial<ModelSelectionConfig>);
    /**
     * Select the most appropriate model for a given task and context
     */
    selectModel(task: Task, context: ModelContext): Promise<SelectedModel>;
    /**
     * Evaluate model performance for a specific task
     */
    evaluateModelPerformance(modelId: string, task: Task): Promise<PerformanceMetrics>;
    /**
     * Register a custom model
     */
    registerCustomModel(model: ModelDefinition): Promise<RegistrationResult>;
    /**
     * Record performance metrics for a model execution
     */
    recordPerformance(modelId: string, task: Task, metrics: PerformanceMetrics, success: boolean): void;
    /**
     * Get fallback model for a failed model
     */
    getFallbackModel(failedModelId: string, task: Task, context: ModelContext): SelectedModel;
    /**
     * Get model health status
     */
    getModelHealth(modelId: string): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: PerformanceMetrics;
        issues: string[];
    };
    private initializeCapabilityMatrix;
    private initializeDefaultModels;
    private getCandidateModels;
    private isModelSuitableForTask;
    private scoreCandidates;
    private calculateModelScore;
    private calculateCapabilityScore;
    private calculatePerformanceScore;
    private calculateContextScore;
    private selectBestModel;
    private getModelConfiguration;
    private generateModelConfiguration;
    private getRecentPerformanceHistory;
    private calculateAggregateMetrics;
    private getDefaultMetrics;
    private validateModelDefinition;
    private updateCapabilityMatrix;
}
/**
 * Factory function to create a model selection service instance
 */
export declare function createModelSelectionService(config?: Partial<ModelSelectionConfig>): ModelSelectionServiceImpl;
export declare function getModelSelectionService(): ModelSelectionServiceImpl;
