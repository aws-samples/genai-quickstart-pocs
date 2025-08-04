"use strict";
/**
 * Model Selection Service
 *
 * This service implements intelligent model selection based on task requirements,
 * performance monitoring, and fallback mechanisms for model failures.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModelSelectionService = exports.createModelSelectionService = exports.ModelSelectionServiceImpl = void 0;
class ModelSelectionServiceImpl {
    constructor(config) {
        this.performanceHistory = [];
        this.registeredModels = new Map();
        this.config = {
            defaultModel: 'claude-sonnet-3.7',
            performanceThresholds: {
                accuracy: 0.85,
                latency: 5000,
                errorRate: 0.05
            },
            fallbackChain: ['claude-sonnet-3.7', 'claude-haiku-3.5', 'amazon-nova-pro'],
            evaluationInterval: 300000,
            maxRetries: 3,
            ...config
        };
        this.initializeCapabilityMatrix();
        this.initializeDefaultModels();
    }
    /**
     * Select the most appropriate model for a given task and context
     */
    async selectModel(task, context) {
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
        }
        catch (error) {
            console.error('Error in model selection:', error);
            // Fallback to default model
            return this.getModelConfiguration(this.config.defaultModel, task, context);
        }
    }
    /**
     * Evaluate model performance for a specific task
     */
    async evaluateModelPerformance(modelId, task) {
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
    async registerCustomModel(model) {
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
        }
        catch (error) {
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
    recordPerformance(modelId, task, metrics, success) {
        const record = {
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
    getFallbackModel(failedModelId, task, context) {
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
    getModelHealth(modelId) {
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
        const issues = [];
        let status = 'healthy';
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
        }
        else if (issueCount === 1 || (issueCount === 2 && metrics.errorRate <= this.config.performanceThresholds.errorRate)) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return { status, metrics, issues };
    }
    initializeCapabilityMatrix() {
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
    initializeDefaultModels() {
        const defaultModels = [
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
    getCandidateModels(task) {
        const candidates = [];
        for (const [modelId, capabilities] of Object.entries(this.capabilityMatrix)) {
            if (this.isModelSuitableForTask(capabilities, task)) {
                candidates.push(modelId);
            }
        }
        return candidates.length > 0 ? candidates : [this.config.defaultModel];
    }
    isModelSuitableForTask(capabilities, task) {
        return (capabilities.taskTypes.includes(task.type) &&
            capabilities.domains.includes(task.domain) &&
            capabilities.complexityLevels.includes(task.complexity) &&
            capabilities.agentRoles.includes(task.agentRole));
    }
    async scoreCandidates(candidates, task, context) {
        const scored = await Promise.all(candidates.map(async (modelId) => {
            const score = await this.calculateModelScore(modelId, task, context);
            return { modelId, score };
        }));
        return scored.sort((a, b) => b.score - a.score);
    }
    async calculateModelScore(modelId, task, context) {
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
        if (health.status === 'degraded')
            score *= 0.8;
        if (health.status === 'unhealthy')
            score *= 0.5;
        return score;
    }
    calculateCapabilityScore(capabilities, task) {
        let score = 0;
        // Perfect matches get higher scores
        if (capabilities.taskTypes.includes(task.type))
            score += 30;
        if (capabilities.domains.includes(task.domain))
            score += 25;
        if (capabilities.complexityLevels.includes(task.complexity))
            score += 20;
        if (capabilities.agentRoles.includes(task.agentRole))
            score += 25;
        return score;
    }
    calculatePerformanceScore(metrics, context) {
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
    calculateContextScore(modelId, context) {
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
    selectBestModel(scoredCandidates) {
        if (scoredCandidates.length === 0) {
            return this.config.defaultModel;
        }
        return scoredCandidates[0].modelId;
    }
    getModelConfiguration(modelId, task, context) {
        const modelDef = this.registeredModels.get(modelId);
        if (!modelDef) {
            throw new Error(`Model ${modelId} not found`);
        }
        const config = this.generateModelConfiguration(modelId, task, context);
        return {
            id: modelId,
            name: modelDef.name,
            version: modelDef.version,
            capabilities: modelDef.capabilities,
            limitations: modelDef.limitations,
            configurationParameters: config
        };
    }
    generateModelConfiguration(modelId, task, context) {
        const baseConfig = {};
        // Adjust temperature based on task requirements
        if (task.type === 'classification' || context.accuracyRequirement === 'high') {
            baseConfig.temperature = 0.1;
        }
        else if (task.type === 'text-generation') {
            baseConfig.temperature = 0.7;
        }
        // Adjust max tokens based on complexity and data size
        if (task.complexity === 'complex' || context.dataSize > 5000) {
            baseConfig.maxTokens = 4096;
        }
        else {
            baseConfig.maxTokens = 2048;
        }
        // Model-specific configurations
        if (modelId === 'amazon-nova-pro') {
            baseConfig.analysisDepth = task.complexity === 'complex' ? 'comprehensive' : 'standard';
            baseConfig.financialFocus = task.domain === 'financial';
        }
        return baseConfig;
    }
    getRecentPerformanceHistory(modelId, taskType, limit = 20) {
        return this.performanceHistory
            .filter(h => h.modelId === modelId && h.taskType === taskType)
            .slice(-limit);
    }
    calculateAggregateMetrics(history) {
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
    getDefaultMetrics(modelId) {
        // Default metrics based on model characteristics
        const defaults = {
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
    validateModelDefinition(model) {
        if (!model.id || !model.name || !model.version || !model.provider) {
            throw new Error('Model definition missing required fields');
        }
        if (this.registeredModels.has(model.id)) {
            throw new Error(`Model with ID ${model.id} already exists`);
        }
    }
    updateCapabilityMatrix(model) {
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
exports.ModelSelectionServiceImpl = ModelSelectionServiceImpl;
/**
 * Factory function to create a model selection service instance
 */
function createModelSelectionService(config) {
    return new ModelSelectionServiceImpl(config);
}
exports.createModelSelectionService = createModelSelectionService;
/**
 * Singleton instance for global use
 */
let globalModelSelectionService = null;
function getModelSelectionService() {
    if (!globalModelSelectionService) {
        globalModelSelectionService = createModelSelectionService();
    }
    return globalModelSelectionService;
}
exports.getModelSelectionService = getModelSelectionService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwtc2VsZWN0aW9uLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvYWkvbW9kZWwtc2VsZWN0aW9uLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7OztHQUtHOzs7QUEyQ0gsTUFBYSx5QkFBeUI7SUFNcEMsWUFBWSxNQUFzQztRQUoxQyx1QkFBa0IsR0FBOEIsRUFBRSxDQUFDO1FBQ25ELHFCQUFnQixHQUFpQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBSWpFLElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDWixZQUFZLEVBQUUsbUJBQW1CO1lBQ2pDLHFCQUFxQixFQUFFO2dCQUNyQixRQUFRLEVBQUUsSUFBSTtnQkFDZCxPQUFPLEVBQUUsSUFBSTtnQkFDYixTQUFTLEVBQUUsSUFBSTthQUNoQjtZQUNELGFBQWEsRUFBRSxDQUFDLG1CQUFtQixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDO1lBQzNFLGtCQUFrQixFQUFFLE1BQU07WUFDMUIsVUFBVSxFQUFFLENBQUM7WUFDYixHQUFHLE1BQU07U0FDVixDQUFDO1FBRUYsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7UUFDbEMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFVLEVBQUUsT0FBcUI7UUFDakQsSUFBSTtZQUNGLDBEQUEwRDtZQUMxRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFakQsb0VBQW9FO1lBQ3BFLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFL0UsZ0NBQWdDO1lBQ2hDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdC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LENBQUM7QUFKRCxrRUFJQztBQUVEOztHQUVHO0FBQ0gsSUFBSSwyQkFBMkIsR0FBcUMsSUFBSSxDQUFDO0FBRXpFLFNBQWdCLHdCQUF3QjtJQUN0QyxJQUFJLENBQUMsMkJBQTJCLEVBQUU7UUFDaEMsMkJBQTJCLEdBQUcsMkJBQTJCLEVBQUUsQ0FBQztLQUM3RDtJQUNELE9BQU8sMkJBQTJCLENBQUM7QUFDckMsQ0FBQztBQUxELDREQUtDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNb2RlbCBTZWxlY3Rpb24gU2VydmljZVxuICogXG4gKiBUaGlzIHNlcnZpY2UgaW1wbGVtZW50cyBpbnRlbGxpZ2VudCBtb2RlbCBzZWxlY3Rpb24gYmFzZWQgb24gdGFzayByZXF1aXJlbWVudHMsXG4gKiBwZXJmb3JtYW5jZSBtb25pdG9yaW5nLCBhbmQgZmFsbGJhY2sgbWVjaGFuaXNtcyBmb3IgbW9kZWwgZmFpbHVyZXMuXG4gKi9cblxuaW1wb3J0IHtcbiAgVGFzayxcbiAgTW9kZWxDb250ZXh0LFxuICBTZWxlY3RlZE1vZGVsLFxuICBNb2RlbERlZmluaXRpb24sXG4gIFBlcmZvcm1hbmNlTWV0cmljcyxcbiAgUmVnaXN0cmF0aW9uUmVzdWx0LFxuICBNb2RlbFNlbGVjdGlvblNlcnZpY2Vcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL3NlcnZpY2VzJztcblxuZXhwb3J0IGludGVyZmFjZSBNb2RlbFNlbGVjdGlvbkNvbmZpZyB7XG4gIGRlZmF1bHRNb2RlbDogc3RyaW5nO1xuICBwZXJmb3JtYW5jZVRocmVzaG9sZHM6IHtcbiAgICBhY2N1cmFjeTogbnVtYmVyO1xuICAgIGxhdGVuY3k6IG51bWJlcjtcbiAgICBlcnJvclJhdGU6IG51bWJlcjtcbiAgfTtcbiAgZmFsbGJhY2tDaGFpbjogc3RyaW5nW107XG4gIGV2YWx1YXRpb25JbnRlcnZhbDogbnVtYmVyOyAvLyBpbiBtaWxsaXNlY29uZHNcbiAgbWF4UmV0cmllczogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vZGVsUGVyZm9ybWFuY2VIaXN0b3J5IHtcbiAgbW9kZWxJZDogc3RyaW5nO1xuICB0aW1lc3RhbXA6IERhdGU7XG4gIG1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcztcbiAgdGFza1R5cGU6IHN0cmluZztcbiAgc3VjY2VzczogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2RlbENhcGFiaWxpdHlNYXRyaXgge1xuICBbbW9kZWxJZDogc3RyaW5nXToge1xuICAgIHRhc2tUeXBlczogc3RyaW5nW107XG4gICAgZG9tYWluczogc3RyaW5nW107XG4gICAgY29tcGxleGl0eUxldmVsczogc3RyaW5nW107XG4gICAgYWdlbnRSb2xlczogc3RyaW5nW107XG4gICAgc3RyZW5ndGhzOiBzdHJpbmdbXTtcbiAgICB3ZWFrbmVzc2VzOiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuZXhwb3J0IGNsYXNzIE1vZGVsU2VsZWN0aW9uU2VydmljZUltcGwgaW1wbGVtZW50cyBNb2RlbFNlbGVjdGlvblNlcnZpY2Uge1xuICBwcml2YXRlIGNvbmZpZzogTW9kZWxTZWxlY3Rpb25Db25maWc7XG4gIHByaXZhdGUgcGVyZm9ybWFuY2VIaXN0b3J5OiBNb2RlbFBlcmZvcm1hbmNlSGlzdG9yeVtdID0gW107XG4gIHByaXZhdGUgcmVnaXN0ZXJlZE1vZGVsczogTWFwPHN0cmluZywgTW9kZWxEZWZpbml0aW9uPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBjYXBhYmlsaXR5TWF0cml4OiBNb2RlbENhcGFiaWxpdHlNYXRyaXg7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnPzogUGFydGlhbDxNb2RlbFNlbGVjdGlvbkNvbmZpZz4pIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIGRlZmF1bHRNb2RlbDogJ2NsYXVkZS1zb25uZXQtMy43JyxcbiAgICAgIHBlcmZvcm1hbmNlVGhyZXNob2xkczoge1xuICAgICAgICBhY2N1cmFjeTogMC44NSxcbiAgICAgICAgbGF0ZW5jeTogNTAwMCwgLy8gNSBzZWNvbmRzXG4gICAgICAgIGVycm9yUmF0ZTogMC4wNVxuICAgICAgfSxcbiAgICAgIGZhbGxiYWNrQ2hhaW46IFsnY2xhdWRlLXNvbm5ldC0zLjcnLCAnY2xhdWRlLWhhaWt1LTMuNScsICdhbWF6b24tbm92YS1wcm8nXSxcbiAgICAgIGV2YWx1YXRpb25JbnRlcnZhbDogMzAwMDAwLCAvLyA1IG1pbnV0ZXNcbiAgICAgIG1heFJldHJpZXM6IDMsXG4gICAgICAuLi5jb25maWdcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0aWFsaXplQ2FwYWJpbGl0eU1hdHJpeCgpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZURlZmF1bHRNb2RlbHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWxlY3QgdGhlIG1vc3QgYXBwcm9wcmlhdGUgbW9kZWwgZm9yIGEgZ2l2ZW4gdGFzayBhbmQgY29udGV4dFxuICAgKi9cbiAgYXN5bmMgc2VsZWN0TW9kZWwodGFzazogVGFzaywgY29udGV4dDogTW9kZWxDb250ZXh0KTogUHJvbWlzZTxTZWxlY3RlZE1vZGVsPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFN0ZXAgMTogR2V0IGNhbmRpZGF0ZSBtb2RlbHMgYmFzZWQgb24gdGFzayByZXF1aXJlbWVudHNcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSB0aGlzLmdldENhbmRpZGF0ZU1vZGVscyh0YXNrKTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCAyOiBTY29yZSBjYW5kaWRhdGVzIGJhc2VkIG9uIGNvbnRleHQgYW5kIHBlcmZvcm1hbmNlIGhpc3RvcnlcbiAgICAgIGNvbnN0IHNjb3JlZENhbmRpZGF0ZXMgPSBhd2FpdCB0aGlzLnNjb3JlQ2FuZGlkYXRlcyhjYW5kaWRhdGVzLCB0YXNrLCBjb250ZXh0KTtcbiAgICAgIFxuICAgICAgLy8gU3RlcCAzOiBTZWxlY3QgdGhlIGJlc3QgbW9kZWxcbiAgICAgIGNvbnN0IHNlbGVjdGVkTW9kZWxJZCA9IHRoaXMuc2VsZWN0QmVzdE1vZGVsKHNjb3JlZENhbmRpZGF0ZXMpO1xuICAgICAgXG4gICAgICAvLyBTdGVwIDQ6IEdldCBtb2RlbCBjb25maWd1cmF0aW9uXG4gICAgICBjb25zdCBzZWxlY3RlZE1vZGVsID0gdGhpcy5nZXRNb2RlbENvbmZpZ3VyYXRpb24oc2VsZWN0ZWRNb2RlbElkLCB0YXNrLCBjb250ZXh0KTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYFNlbGVjdGVkIG1vZGVsICR7c2VsZWN0ZWRNb2RlbC5uYW1lfSBmb3IgdGFzayB0eXBlICR7dGFzay50eXBlfSB3aXRoIGFnZW50IHJvbGUgJHt0YXNrLmFnZW50Um9sZX1gKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHNlbGVjdGVkTW9kZWw7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIG1vZGVsIHNlbGVjdGlvbjonLCBlcnJvcik7XG4gICAgICAvLyBGYWxsYmFjayB0byBkZWZhdWx0IG1vZGVsXG4gICAgICByZXR1cm4gdGhpcy5nZXRNb2RlbENvbmZpZ3VyYXRpb24odGhpcy5jb25maWcuZGVmYXVsdE1vZGVsLCB0YXNrLCBjb250ZXh0KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXZhbHVhdGUgbW9kZWwgcGVyZm9ybWFuY2UgZm9yIGEgc3BlY2lmaWMgdGFza1xuICAgKi9cbiAgYXN5bmMgZXZhbHVhdGVNb2RlbFBlcmZvcm1hbmNlKG1vZGVsSWQ6IHN0cmluZywgdGFzazogVGFzayk6IFByb21pc2U8UGVyZm9ybWFuY2VNZXRyaWNzPiB7XG4gICAgY29uc3QgcmVjZW50SGlzdG9yeSA9IHRoaXMuZ2V0UmVjZW50UGVyZm9ybWFuY2VIaXN0b3J5KG1vZGVsSWQsIHRhc2sudHlwZSk7XG4gICAgXG4gICAgaWYgKHJlY2VudEhpc3RvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBSZXR1cm4gZGVmYXVsdCBtZXRyaWNzIGlmIG5vIGhpc3RvcnkgYXZhaWxhYmxlXG4gICAgICByZXR1cm4gdGhpcy5nZXREZWZhdWx0TWV0cmljcyhtb2RlbElkKTtcbiAgICB9XG5cbiAgICAvLyBDYWxjdWxhdGUgYWdncmVnYXRlIG1ldHJpY3MgZnJvbSByZWNlbnQgaGlzdG9yeVxuICAgIGNvbnN0IG1ldHJpY3MgPSB0aGlzLmNhbGN1bGF0ZUFnZ3JlZ2F0ZU1ldHJpY3MocmVjZW50SGlzdG9yeSk7XG4gICAgXG4gICAgcmV0dXJuIG1ldHJpY3M7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBjdXN0b20gbW9kZWxcbiAgICovXG4gIGFzeW5jIHJlZ2lzdGVyQ3VzdG9tTW9kZWwobW9kZWw6IE1vZGVsRGVmaW5pdGlvbik6IFByb21pc2U8UmVnaXN0cmF0aW9uUmVzdWx0PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIG1vZGVsIGRlZmluaXRpb25cbiAgICAgIHRoaXMudmFsaWRhdGVNb2RlbERlZmluaXRpb24obW9kZWwpO1xuICAgICAgXG4gICAgICAvLyBSZWdpc3RlciB0aGUgbW9kZWxcbiAgICAgIHRoaXMucmVnaXN0ZXJlZE1vZGVscy5zZXQobW9kZWwuaWQsIG1vZGVsKTtcbiAgICAgIFxuICAgICAgLy8gVXBkYXRlIGNhcGFiaWxpdHkgbWF0cml4XG4gICAgICB0aGlzLnVwZGF0ZUNhcGFiaWxpdHlNYXRyaXgobW9kZWwpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhgU3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWQgY3VzdG9tIG1vZGVsOiAke21vZGVsLm5hbWV9YCk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIG1vZGVsSWQ6IG1vZGVsLmlkXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZWdpc3RlcmluZyBjdXN0b20gbW9kZWw6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVjb3JkIHBlcmZvcm1hbmNlIG1ldHJpY3MgZm9yIGEgbW9kZWwgZXhlY3V0aW9uXG4gICAqL1xuICByZWNvcmRQZXJmb3JtYW5jZShcbiAgICBtb2RlbElkOiBzdHJpbmcsXG4gICAgdGFzazogVGFzayxcbiAgICBtZXRyaWNzOiBQZXJmb3JtYW5jZU1ldHJpY3MsXG4gICAgc3VjY2VzczogYm9vbGVhblxuICApOiB2b2lkIHtcbiAgICBjb25zdCByZWNvcmQ6IE1vZGVsUGVyZm9ybWFuY2VIaXN0b3J5ID0ge1xuICAgICAgbW9kZWxJZCxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgIG1ldHJpY3MsXG4gICAgICB0YXNrVHlwZTogdGFzay50eXBlLFxuICAgICAgc3VjY2Vzc1xuICAgIH07XG5cbiAgICB0aGlzLnBlcmZvcm1hbmNlSGlzdG9yeS5wdXNoKHJlY29yZCk7XG4gICAgXG4gICAgLy8gS2VlcCBvbmx5IHJlY2VudCBoaXN0b3J5IChsYXN0IDEwMDAgcmVjb3JkcylcbiAgICBpZiAodGhpcy5wZXJmb3JtYW5jZUhpc3RvcnkubGVuZ3RoID4gMTAwMCkge1xuICAgICAgdGhpcy5wZXJmb3JtYW5jZUhpc3RvcnkgPSB0aGlzLnBlcmZvcm1hbmNlSGlzdG9yeS5zbGljZSgtMTAwMCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBmYWxsYmFjayBtb2RlbCBmb3IgYSBmYWlsZWQgbW9kZWxcbiAgICovXG4gIGdldEZhbGxiYWNrTW9kZWwoZmFpbGVkTW9kZWxJZDogc3RyaW5nLCB0YXNrOiBUYXNrLCBjb250ZXh0OiBNb2RlbENvbnRleHQpOiBTZWxlY3RlZE1vZGVsIHtcbiAgICBjb25zdCBmYWxsYmFja0NoYWluID0gdGhpcy5jb25maWcuZmFsbGJhY2tDaGFpbi5maWx0ZXIoaWQgPT4gaWQgIT09IGZhaWxlZE1vZGVsSWQpO1xuICAgIFxuICAgIGZvciAoY29uc3QgbW9kZWxJZCBvZiBmYWxsYmFja0NoYWluKSB7XG4gICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSB0aGlzLmNhcGFiaWxpdHlNYXRyaXhbbW9kZWxJZF07XG4gICAgICBpZiAoY2FwYWJpbGl0aWVzICYmIHRoaXMuaXNNb2RlbFN1aXRhYmxlRm9yVGFzayhjYXBhYmlsaXRpZXMsIHRhc2spKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBVc2luZyBmYWxsYmFjayBtb2RlbCAke21vZGVsSWR9IGZvciBmYWlsZWQgbW9kZWwgJHtmYWlsZWRNb2RlbElkfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRNb2RlbENvbmZpZ3VyYXRpb24obW9kZWxJZCwgdGFzaywgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIElmIG5vIHN1aXRhYmxlIGZhbGxiYWNrIGZvdW5kIGluIGNoYWluLCB0cnkgYW55IGF2YWlsYWJsZSBtb2RlbCB0aGF0IGNhbiBoYW5kbGUgdGhlIHRhc2tcbiAgICBmb3IgKGNvbnN0IFttb2RlbElkLCBjYXBhYmlsaXRpZXNdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuY2FwYWJpbGl0eU1hdHJpeCkpIHtcbiAgICAgIGlmIChtb2RlbElkICE9PSBmYWlsZWRNb2RlbElkICYmIHRoaXMuaXNNb2RlbFN1aXRhYmxlRm9yVGFzayhjYXBhYmlsaXRpZXMsIHRhc2spKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBVc2luZyBhbHRlcm5hdGl2ZSBtb2RlbCAke21vZGVsSWR9IGZvciBmYWlsZWQgbW9kZWwgJHtmYWlsZWRNb2RlbElkfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRNb2RlbENvbmZpZ3VyYXRpb24obW9kZWxJZCwgdGFzaywgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIExhc3QgcmVzb3J0OiByZXR1cm4gZGVmYXVsdCBtb2RlbCAoYnV0IG5vdCB0aGUgZmFpbGVkIG9uZSlcbiAgICBsZXQgZGVmYXVsdE1vZGVsID0gdGhpcy5jb25maWcuZGVmYXVsdE1vZGVsICE9PSBmYWlsZWRNb2RlbElkIFxuICAgICAgPyB0aGlzLmNvbmZpZy5kZWZhdWx0TW9kZWwgXG4gICAgICA6IHRoaXMuY29uZmlnLmZhbGxiYWNrQ2hhaW4uZmluZChpZCA9PiBpZCAhPT0gZmFpbGVkTW9kZWxJZCkgfHwgJ2NsYXVkZS1oYWlrdS0zLjUnO1xuICAgIFxuICAgIC8vIEVuc3VyZSB0aGUgZGVmYXVsdCBtb2RlbCBleGlzdHMgaW4gb3VyIHJlZ2lzdGVyZWQgbW9kZWxzXG4gICAgaWYgKCF0aGlzLnJlZ2lzdGVyZWRNb2RlbHMuaGFzKGRlZmF1bHRNb2RlbCkpIHtcbiAgICAgIGRlZmF1bHRNb2RlbCA9IEFycmF5LmZyb20odGhpcy5yZWdpc3RlcmVkTW9kZWxzLmtleXMoKSkuZmluZChpZCA9PiBpZCAhPT0gZmFpbGVkTW9kZWxJZCkgfHwgJ2NsYXVkZS1zb25uZXQtMy43JztcbiAgICB9XG4gICAgXG4gICAgY29uc29sZS53YXJuKGBObyBzdWl0YWJsZSBmYWxsYmFjayBmb3VuZCwgdXNpbmcgZGVmYXVsdCBtb2RlbCAke2RlZmF1bHRNb2RlbH0gZm9yIHRhc2sgJHt0YXNrLnR5cGV9YCk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TW9kZWxDb25maWd1cmF0aW9uKGRlZmF1bHRNb2RlbCwgdGFzaywgY29udGV4dCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1vZGVsIGhlYWx0aCBzdGF0dXNcbiAgICovXG4gIGdldE1vZGVsSGVhbHRoKG1vZGVsSWQ6IHN0cmluZyk6IHtcbiAgICBzdGF0dXM6ICdoZWFsdGh5JyB8ICdkZWdyYWRlZCcgfCAndW5oZWFsdGh5JztcbiAgICBtZXRyaWNzOiBQZXJmb3JtYW5jZU1ldHJpY3M7XG4gICAgaXNzdWVzOiBzdHJpbmdbXTtcbiAgfSB7XG4gICAgY29uc3QgcmVjZW50SGlzdG9yeSA9IHRoaXMucGVyZm9ybWFuY2VIaXN0b3J5XG4gICAgICAuZmlsdGVyKGggPT4gaC5tb2RlbElkID09PSBtb2RlbElkKVxuICAgICAgLnNsaWNlKC01MCk7IC8vIExhc3QgNTAgZXhlY3V0aW9uc1xuXG4gICAgaWYgKHJlY2VudEhpc3RvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXM6ICdoZWFsdGh5JyxcbiAgICAgICAgbWV0cmljczogdGhpcy5nZXREZWZhdWx0TWV0cmljcyhtb2RlbElkKSxcbiAgICAgICAgaXNzdWVzOiBbXVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXRyaWNzID0gdGhpcy5jYWxjdWxhdGVBZ2dyZWdhdGVNZXRyaWNzKHJlY2VudEhpc3RvcnkpO1xuICAgIGNvbnN0IGlzc3Vlczogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgc3RhdHVzOiAnaGVhbHRoeScgfCAnZGVncmFkZWQnIHwgJ3VuaGVhbHRoeScgPSAnaGVhbHRoeSc7XG5cbiAgICAvLyBDaGVjayBhZ2FpbnN0IHRocmVzaG9sZHMgLSBwcmlvcml0aXplIGRlZ3JhZGVkIG92ZXIgdW5oZWFsdGh5IGZvciBzaW5nbGUgaXNzdWVzXG4gICAgbGV0IGlzc3VlQ291bnQgPSAwO1xuICAgIFxuICAgIGlmIChtZXRyaWNzLmFjY3VyYWN5IDwgdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLmFjY3VyYWN5KSB7XG4gICAgICBpc3N1ZXMucHVzaChgTG93IGFjY3VyYWN5OiAke21ldHJpY3MuYWNjdXJhY3kudG9GaXhlZCgzKX1gKTtcbiAgICAgIGlzc3VlQ291bnQrKztcbiAgICB9XG5cbiAgICBpZiAobWV0cmljcy5sYXRlbmN5ID4gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLmxhdGVuY3kpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBIaWdoIGxhdGVuY3k6ICR7bWV0cmljcy5sYXRlbmN5fW1zYCk7XG4gICAgICBpc3N1ZUNvdW50Kys7XG4gICAgfVxuXG4gICAgaWYgKG1ldHJpY3MuZXJyb3JSYXRlID4gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLmVycm9yUmF0ZSkge1xuICAgICAgaXNzdWVzLnB1c2goYEhpZ2ggZXJyb3IgcmF0ZTogJHsobWV0cmljcy5lcnJvclJhdGUgKiAxMDApLnRvRml4ZWQoMSl9JWApO1xuICAgICAgaXNzdWVDb3VudCsrO1xuICAgIH1cbiAgICBcbiAgICAvLyBEZXRlcm1pbmUgc3RhdHVzIGJhc2VkIG9uIG51bWJlciBhbmQgc2V2ZXJpdHkgb2YgaXNzdWVzXG4gICAgaWYgKGlzc3VlQ291bnQgPT09IDApIHtcbiAgICAgIHN0YXR1cyA9ICdoZWFsdGh5JztcbiAgICB9IGVsc2UgaWYgKGlzc3VlQ291bnQgPT09IDEgfHwgKGlzc3VlQ291bnQgPT09IDIgJiYgbWV0cmljcy5lcnJvclJhdGUgPD0gdGhpcy5jb25maWcucGVyZm9ybWFuY2VUaHJlc2hvbGRzLmVycm9yUmF0ZSkpIHtcbiAgICAgIHN0YXR1cyA9ICdkZWdyYWRlZCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXR1cyA9ICd1bmhlYWx0aHknO1xuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXR1cywgbWV0cmljcywgaXNzdWVzIH07XG4gIH1cblxuICBwcml2YXRlIGluaXRpYWxpemVDYXBhYmlsaXR5TWF0cml4KCk6IHZvaWQge1xuICAgIHRoaXMuY2FwYWJpbGl0eU1hdHJpeCA9IHtcbiAgICAgICdjbGF1ZGUtc29ubmV0LTMuNyc6IHtcbiAgICAgICAgdGFza1R5cGVzOiBbJ3RleHQtZ2VuZXJhdGlvbicsICdjbGFzc2lmaWNhdGlvbicsICdzZW50aW1lbnQtYW5hbHlzaXMnLCAnZW50aXR5LWV4dHJhY3Rpb24nXSxcbiAgICAgICAgZG9tYWluczogWydnZW5lcmFsJywgJ2ZpbmFuY2lhbCcsICdyZWd1bGF0b3J5JywgJ21hcmtldCddLFxuICAgICAgICBjb21wbGV4aXR5TGV2ZWxzOiBbJ21lZGl1bScsICdjb21wbGV4J10sXG4gICAgICAgIGFnZW50Um9sZXM6IFsnc3VwZXJ2aXNvcicsICdwbGFubmluZycsICdzeW50aGVzaXMnXSxcbiAgICAgICAgc3RyZW5ndGhzOiBbJ2NvbXBsZXggcmVhc29uaW5nJywgJ251YW5jZWQgdW5kZXJzdGFuZGluZycsICdjb21wcmVoZW5zaXZlIGFuYWx5c2lzJ10sXG4gICAgICAgIHdlYWtuZXNzZXM6IFsnaGlnaGVyIGxhdGVuY3knLCAnaGlnaGVyIGNvc3QnXVxuICAgICAgfSxcbiAgICAgICdjbGF1ZGUtaGFpa3UtMy41Jzoge1xuICAgICAgICB0YXNrVHlwZXM6IFsndGV4dC1nZW5lcmF0aW9uJywgJ2NsYXNzaWZpY2F0aW9uJywgJ3NlbnRpbWVudC1hbmFseXNpcycsICdlbnRpdHktZXh0cmFjdGlvbiddLFxuICAgICAgICBkb21haW5zOiBbJ2dlbmVyYWwnLCAnZmluYW5jaWFsJywgJ3JlZ3VsYXRvcnknXSxcbiAgICAgICAgY29tcGxleGl0eUxldmVsczogWydzaW1wbGUnLCAnbWVkaXVtJ10sXG4gICAgICAgIGFnZW50Um9sZXM6IFsncmVzZWFyY2gnLCAnY29tcGxpYW5jZSddLFxuICAgICAgICBzdHJlbmd0aHM6IFsnZmFzdCBwcm9jZXNzaW5nJywgJ2Nvc3QtZWZmZWN0aXZlJywgJ2VmZmljaWVudCddLFxuICAgICAgICB3ZWFrbmVzc2VzOiBbJ2xpbWl0ZWQgY29tcGxleCByZWFzb25pbmcnLCAnc2hvcnRlciBjb250ZXh0IHdpbmRvdyddXG4gICAgICB9LFxuICAgICAgJ2FtYXpvbi1ub3ZhLXBybyc6IHtcbiAgICAgICAgdGFza1R5cGVzOiBbJ3RpbWUtc2VyaWVzLWFuYWx5c2lzJywgJ2NsYXNzaWZpY2F0aW9uJywgJ3RleHQtZ2VuZXJhdGlvbiddLFxuICAgICAgICBkb21haW5zOiBbJ2ZpbmFuY2lhbCcsICdtYXJrZXQnXSxcbiAgICAgICAgY29tcGxleGl0eUxldmVsczogWydtZWRpdW0nLCAnY29tcGxleCddLFxuICAgICAgICBhZ2VudFJvbGVzOiBbJ2FuYWx5c2lzJ10sXG4gICAgICAgIHN0cmVuZ3RoczogWydmaW5hbmNpYWwgYW5hbHlzaXMnLCAncXVhbnRpdGF0aXZlIHRhc2tzJywgJ3BhdHRlcm4gcmVjb2duaXRpb24nXSxcbiAgICAgICAgd2Vha25lc3NlczogWydsaW1pdGVkIGdlbmVyYWwga25vd2xlZGdlJywgJ3NwZWNpYWxpemVkIGRvbWFpbiddXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZURlZmF1bHRNb2RlbHMoKTogdm9pZCB7XG4gICAgY29uc3QgZGVmYXVsdE1vZGVsczogTW9kZWxEZWZpbml0aW9uW10gPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgICAgICBuYW1lOiAnQ2xhdWRlIFNvbm5ldCAzLjcnLFxuICAgICAgICB2ZXJzaW9uOiAnMy43JyxcbiAgICAgICAgcHJvdmlkZXI6ICdBbnRocm9waWMnLFxuICAgICAgICBjYXBhYmlsaXRpZXM6IFsndGV4dC1nZW5lcmF0aW9uJywgJ2FuYWx5c2lzJywgJ3JlYXNvbmluZyddLFxuICAgICAgICBsaW1pdGF0aW9uczogWyd0b2tlbi1saW1pdCcsICdjb3N0J10sXG4gICAgICAgIGNvbmZpZ3VyYXRpb25TY2hlbWE6IHtcbiAgICAgICAgICBtYXhUb2tlbnM6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDQwOTYgfSxcbiAgICAgICAgICB0ZW1wZXJhdHVyZTogeyB0eXBlOiAnbnVtYmVyJywgZGVmYXVsdDogMC43IH0sXG4gICAgICAgICAgdG9wUDogeyB0eXBlOiAnbnVtYmVyJywgZGVmYXVsdDogMC45IH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICdjbGF1ZGUtaGFpa3UtMy41JyxcbiAgICAgICAgbmFtZTogJ0NsYXVkZSBIYWlrdSAzLjUnLFxuICAgICAgICB2ZXJzaW9uOiAnMy41JyxcbiAgICAgICAgcHJvdmlkZXI6ICdBbnRocm9waWMnLFxuICAgICAgICBjYXBhYmlsaXRpZXM6IFsndGV4dC1nZW5lcmF0aW9uJywgJ2NsYXNzaWZpY2F0aW9uJywgJ2VmZmljaWVuY3knXSxcbiAgICAgICAgbGltaXRhdGlvbnM6IFsnY29tcGxleGl0eS1saW1pdCcsICdjb250ZXh0LXdpbmRvdyddLFxuICAgICAgICBjb25maWd1cmF0aW9uU2NoZW1hOiB7XG4gICAgICAgICAgbWF4VG9rZW5zOiB7IHR5cGU6ICdudW1iZXInLCBkZWZhdWx0OiAyMDQ4IH0sXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDAuNSB9LFxuICAgICAgICAgIHRvcFA6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDAuOCB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiAnYW1hem9uLW5vdmEtcHJvJyxcbiAgICAgICAgbmFtZTogJ0FtYXpvbiBOb3ZhIFBybycsXG4gICAgICAgIHZlcnNpb246ICcxLjAnLFxuICAgICAgICBwcm92aWRlcjogJ0FtYXpvbicsXG4gICAgICAgIGNhcGFiaWxpdGllczogWydmaW5hbmNpYWwtYW5hbHlzaXMnLCAncXVhbnRpdGF0aXZlLWFuYWx5c2lzJywgJ3RpbWUtc2VyaWVzJ10sXG4gICAgICAgIGxpbWl0YXRpb25zOiBbJ2RvbWFpbi1zcGVjaWZpYycsICdnZW5lcmFsLWtub3dsZWRnZSddLFxuICAgICAgICBjb25maWd1cmF0aW9uU2NoZW1hOiB7XG4gICAgICAgICAgbWF4VG9rZW5zOiB7IHR5cGU6ICdudW1iZXInLCBkZWZhdWx0OiAzMDcyIH0sXG4gICAgICAgICAgdGVtcGVyYXR1cmU6IHsgdHlwZTogJ251bWJlcicsIGRlZmF1bHQ6IDAuMyB9LFxuICAgICAgICAgIGFuYWx5c2lzRGVwdGg6IHsgdHlwZTogJ3N0cmluZycsIGRlZmF1bHQ6ICdjb21wcmVoZW5zaXZlJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdO1xuXG4gICAgZGVmYXVsdE1vZGVscy5mb3JFYWNoKG1vZGVsID0+IHtcbiAgICAgIHRoaXMucmVnaXN0ZXJlZE1vZGVscy5zZXQobW9kZWwuaWQsIG1vZGVsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q2FuZGlkYXRlTW9kZWxzKHRhc2s6IFRhc2spOiBzdHJpbmdbXSB7XG4gICAgY29uc3QgY2FuZGlkYXRlczogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IFttb2RlbElkLCBjYXBhYmlsaXRpZXNdIG9mIE9iamVjdC5lbnRyaWVzKHRoaXMuY2FwYWJpbGl0eU1hdHJpeCkpIHtcbiAgICAgIGlmICh0aGlzLmlzTW9kZWxTdWl0YWJsZUZvclRhc2soY2FwYWJpbGl0aWVzLCB0YXNrKSkge1xuICAgICAgICBjYW5kaWRhdGVzLnB1c2gobW9kZWxJZCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjYW5kaWRhdGVzLmxlbmd0aCA+IDAgPyBjYW5kaWRhdGVzIDogW3RoaXMuY29uZmlnLmRlZmF1bHRNb2RlbF07XG4gIH1cblxuICBwcml2YXRlIGlzTW9kZWxTdWl0YWJsZUZvclRhc2soY2FwYWJpbGl0aWVzOiBNb2RlbENhcGFiaWxpdHlNYXRyaXhbc3RyaW5nXSwgdGFzazogVGFzayk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoXG4gICAgICBjYXBhYmlsaXRpZXMudGFza1R5cGVzLmluY2x1ZGVzKHRhc2sudHlwZSkgJiZcbiAgICAgIGNhcGFiaWxpdGllcy5kb21haW5zLmluY2x1ZGVzKHRhc2suZG9tYWluKSAmJlxuICAgICAgY2FwYWJpbGl0aWVzLmNvbXBsZXhpdHlMZXZlbHMuaW5jbHVkZXModGFzay5jb21wbGV4aXR5KSAmJlxuICAgICAgY2FwYWJpbGl0aWVzLmFnZW50Um9sZXMuaW5jbHVkZXModGFzay5hZ2VudFJvbGUpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2NvcmVDYW5kaWRhdGVzKFxuICAgIGNhbmRpZGF0ZXM6IHN0cmluZ1tdLFxuICAgIHRhc2s6IFRhc2ssXG4gICAgY29udGV4dDogTW9kZWxDb250ZXh0XG4gICk6IFByb21pc2U8QXJyYXk8eyBtb2RlbElkOiBzdHJpbmc7IHNjb3JlOiBudW1iZXIgfT4+IHtcbiAgICBjb25zdCBzY29yZWQgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIGNhbmRpZGF0ZXMubWFwKGFzeW5jIChtb2RlbElkKSA9PiB7XG4gICAgICAgIGNvbnN0IHNjb3JlID0gYXdhaXQgdGhpcy5jYWxjdWxhdGVNb2RlbFNjb3JlKG1vZGVsSWQsIHRhc2ssIGNvbnRleHQpO1xuICAgICAgICByZXR1cm4geyBtb2RlbElkLCBzY29yZSB9O1xuICAgICAgfSlcbiAgICApO1xuICAgIFxuICAgIHJldHVybiBzY29yZWQuc29ydCgoYSwgYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWxjdWxhdGVNb2RlbFNjb3JlKFxuICAgIG1vZGVsSWQ6IHN0cmluZyxcbiAgICB0YXNrOiBUYXNrLFxuICAgIGNvbnRleHQ6IE1vZGVsQ29udGV4dFxuICApOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCBzY29yZSA9IDA7XG4gICAgXG4gICAgLy8gQmFzZSBjYXBhYmlsaXR5IHNjb3JlXG4gICAgY29uc3QgY2FwYWJpbGl0aWVzID0gdGhpcy5jYXBhYmlsaXR5TWF0cml4W21vZGVsSWRdO1xuICAgIGlmIChjYXBhYmlsaXRpZXMpIHtcbiAgICAgIHNjb3JlICs9IHRoaXMuY2FsY3VsYXRlQ2FwYWJpbGl0eVNjb3JlKGNhcGFiaWxpdGllcywgdGFzayk7XG4gICAgfVxuICAgIFxuICAgIC8vIFBlcmZvcm1hbmNlIGhpc3Rvcnkgc2NvcmVcbiAgICBjb25zdCBwZXJmb3JtYW5jZU1ldHJpY3MgPSBhd2FpdCB0aGlzLmV2YWx1YXRlTW9kZWxQZXJmb3JtYW5jZShtb2RlbElkLCB0YXNrKTtcbiAgICBzY29yZSArPSB0aGlzLmNhbGN1bGF0ZVBlcmZvcm1hbmNlU2NvcmUocGVyZm9ybWFuY2VNZXRyaWNzLCBjb250ZXh0KTtcbiAgICBcbiAgICAvLyBDb250ZXh0IHN1aXRhYmlsaXR5IHNjb3JlXG4gICAgc2NvcmUgKz0gdGhpcy5jYWxjdWxhdGVDb250ZXh0U2NvcmUobW9kZWxJZCwgY29udGV4dCk7XG4gICAgXG4gICAgLy8gSGVhbHRoIHBlbmFsdHlcbiAgICBjb25zdCBoZWFsdGggPSB0aGlzLmdldE1vZGVsSGVhbHRoKG1vZGVsSWQpO1xuICAgIGlmIChoZWFsdGguc3RhdHVzID09PSAnZGVncmFkZWQnKSBzY29yZSAqPSAwLjg7XG4gICAgaWYgKGhlYWx0aC5zdGF0dXMgPT09ICd1bmhlYWx0aHknKSBzY29yZSAqPSAwLjU7XG4gICAgXG4gICAgcmV0dXJuIHNjb3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVDYXBhYmlsaXR5U2NvcmUoXG4gICAgY2FwYWJpbGl0aWVzOiBNb2RlbENhcGFiaWxpdHlNYXRyaXhbc3RyaW5nXSxcbiAgICB0YXNrOiBUYXNrXG4gICk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMDtcbiAgICBcbiAgICAvLyBQZXJmZWN0IG1hdGNoZXMgZ2V0IGhpZ2hlciBzY29yZXNcbiAgICBpZiAoY2FwYWJpbGl0aWVzLnRhc2tUeXBlcy5pbmNsdWRlcyh0YXNrLnR5cGUpKSBzY29yZSArPSAzMDtcbiAgICBpZiAoY2FwYWJpbGl0aWVzLmRvbWFpbnMuaW5jbHVkZXModGFzay5kb21haW4pKSBzY29yZSArPSAyNTtcbiAgICBpZiAoY2FwYWJpbGl0aWVzLmNvbXBsZXhpdHlMZXZlbHMuaW5jbHVkZXModGFzay5jb21wbGV4aXR5KSkgc2NvcmUgKz0gMjA7XG4gICAgaWYgKGNhcGFiaWxpdGllcy5hZ2VudFJvbGVzLmluY2x1ZGVzKHRhc2suYWdlbnRSb2xlKSkgc2NvcmUgKz0gMjU7XG4gICAgXG4gICAgcmV0dXJuIHNjb3JlO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVQZXJmb3JtYW5jZVNjb3JlKFxuICAgIG1ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcyxcbiAgICBjb250ZXh0OiBNb2RlbENvbnRleHRcbiAgKTogbnVtYmVyIHtcbiAgICBsZXQgc2NvcmUgPSAwO1xuICAgIFxuICAgIC8vIEFjY3VyYWN5IHNjb3JlICgwLTMwIHBvaW50cylcbiAgICBzY29yZSArPSBtZXRyaWNzLmFjY3VyYWN5ICogMzA7XG4gICAgXG4gICAgLy8gTGF0ZW5jeSBzY29yZSAoMC0yMCBwb2ludHMsIGludmVyc2UgcmVsYXRpb25zaGlwKVxuICAgIGNvbnN0IGxhdGVuY3lTY29yZSA9IE1hdGgubWF4KDAsIDIwIC0gKG1ldHJpY3MubGF0ZW5jeSAvIGNvbnRleHQudGltZUNvbnN0cmFpbnQpICogMjApO1xuICAgIHNjb3JlICs9IGxhdGVuY3lTY29yZTtcbiAgICBcbiAgICAvLyBFcnJvciByYXRlIHBlbmFsdHlcbiAgICBzY29yZSAtPSBtZXRyaWNzLmVycm9yUmF0ZSAqIDUwO1xuICAgIFxuICAgIC8vIFRocm91Z2hwdXQgYm9udXNcbiAgICBzY29yZSArPSBNYXRoLm1pbigxMCwgbWV0cmljcy50aHJvdWdocHV0IC8gMTApO1xuICAgIFxuICAgIHJldHVybiBNYXRoLm1heCgwLCBzY29yZSk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUNvbnRleHRTY29yZShtb2RlbElkOiBzdHJpbmcsIGNvbnRleHQ6IE1vZGVsQ29udGV4dCk6IG51bWJlciB7XG4gICAgbGV0IHNjb3JlID0gMDtcbiAgICBcbiAgICAvLyBEYXRhIHNpemUgY29uc2lkZXJhdGlvbnNcbiAgICBpZiAoY29udGV4dC5kYXRhU2l6ZSA+IDEwMDAwICYmIG1vZGVsSWQgPT09ICdjbGF1ZGUtaGFpa3UtMy41Jykge1xuICAgICAgc2NvcmUgLT0gMTA7IC8vIEhhaWt1IG1pZ2h0IHN0cnVnZ2xlIHdpdGggbGFyZ2UgZGF0YXNldHNcbiAgICB9XG4gICAgXG4gICAgLy8gVGltZSBjb25zdHJhaW50IGNvbnNpZGVyYXRpb25zXG4gICAgaWYgKGNvbnRleHQudGltZUNvbnN0cmFpbnQgPCA1MDAwICYmIG1vZGVsSWQgPT09ICdjbGF1ZGUtc29ubmV0LTMuNycpIHtcbiAgICAgIHNjb3JlIC09IDU7IC8vIFNvbm5ldCBpcyBzbG93ZXJcbiAgICB9XG4gICAgXG4gICAgLy8gQWNjdXJhY3kgcmVxdWlyZW1lbnQgbWF0Y2hpbmdcbiAgICBpZiAoY29udGV4dC5hY2N1cmFjeVJlcXVpcmVtZW50ID09PSAnaGlnaCcgJiYgbW9kZWxJZCA9PT0gJ2NsYXVkZS1zb25uZXQtMy43Jykge1xuICAgICAgc2NvcmUgKz0gMTA7XG4gICAgfVxuICAgIFxuICAgIC8vIEV4cGxhaW5hYmlsaXR5IHJlcXVpcmVtZW50IG1hdGNoaW5nXG4gICAgaWYgKGNvbnRleHQuZXhwbGFpbmFiaWxpdHlSZXF1aXJlbWVudCA9PT0gJ2hpZ2gnICYmIG1vZGVsSWQgIT09ICdhbWF6b24tbm92YS1wcm8nKSB7XG4gICAgICBzY29yZSArPSA1O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc2NvcmU7XG4gIH1cblxuICBwcml2YXRlIHNlbGVjdEJlc3RNb2RlbChzY29yZWRDYW5kaWRhdGVzOiBBcnJheTx7IG1vZGVsSWQ6IHN0cmluZzsgc2NvcmU6IG51bWJlciB9Pik6IHN0cmluZyB7XG4gICAgaWYgKHNjb3JlZENhbmRpZGF0ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maWcuZGVmYXVsdE1vZGVsO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc2NvcmVkQ2FuZGlkYXRlc1swXS5tb2RlbElkO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRNb2RlbENvbmZpZ3VyYXRpb24oXG4gICAgbW9kZWxJZDogc3RyaW5nLFxuICAgIHRhc2s6IFRhc2ssXG4gICAgY29udGV4dDogTW9kZWxDb250ZXh0XG4gICk6IFNlbGVjdGVkTW9kZWwge1xuICAgIGNvbnN0IG1vZGVsRGVmID0gdGhpcy5yZWdpc3RlcmVkTW9kZWxzLmdldChtb2RlbElkKTtcbiAgICBpZiAoIW1vZGVsRGVmKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYE1vZGVsICR7bW9kZWxJZH0gbm90IGZvdW5kYCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5nZW5lcmF0ZU1vZGVsQ29uZmlndXJhdGlvbihtb2RlbElkLCB0YXNrLCBjb250ZXh0KTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IG1vZGVsSWQsXG4gICAgICBuYW1lOiBtb2RlbERlZi5uYW1lIGFzIGFueSxcbiAgICAgIHZlcnNpb246IG1vZGVsRGVmLnZlcnNpb24sXG4gICAgICBjYXBhYmlsaXRpZXM6IG1vZGVsRGVmLmNhcGFiaWxpdGllcyxcbiAgICAgIGxpbWl0YXRpb25zOiBtb2RlbERlZi5saW1pdGF0aW9ucyxcbiAgICAgIGNvbmZpZ3VyYXRpb25QYXJhbWV0ZXJzOiBjb25maWdcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZU1vZGVsQ29uZmlndXJhdGlvbihcbiAgICBtb2RlbElkOiBzdHJpbmcsXG4gICAgdGFzazogVGFzayxcbiAgICBjb250ZXh0OiBNb2RlbENvbnRleHRcbiAgKTogUmVjb3JkPHN0cmluZywgYW55PiB7XG4gICAgY29uc3QgYmFzZUNvbmZpZzogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgIFxuICAgIC8vIEFkanVzdCB0ZW1wZXJhdHVyZSBiYXNlZCBvbiB0YXNrIHJlcXVpcmVtZW50c1xuICAgIGlmICh0YXNrLnR5cGUgPT09ICdjbGFzc2lmaWNhdGlvbicgfHwgY29udGV4dC5hY2N1cmFjeVJlcXVpcmVtZW50ID09PSAnaGlnaCcpIHtcbiAgICAgIGJhc2VDb25maWcudGVtcGVyYXR1cmUgPSAwLjE7XG4gICAgfSBlbHNlIGlmICh0YXNrLnR5cGUgPT09ICd0ZXh0LWdlbmVyYXRpb24nKSB7XG4gICAgICBiYXNlQ29uZmlnLnRlbXBlcmF0dXJlID0gMC43O1xuICAgIH1cbiAgICBcbiAgICAvLyBBZGp1c3QgbWF4IHRva2VucyBiYXNlZCBvbiBjb21wbGV4aXR5IGFuZCBkYXRhIHNpemVcbiAgICBpZiAodGFzay5jb21wbGV4aXR5ID09PSAnY29tcGxleCcgfHwgY29udGV4dC5kYXRhU2l6ZSA+IDUwMDApIHtcbiAgICAgIGJhc2VDb25maWcubWF4VG9rZW5zID0gNDA5NjtcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZUNvbmZpZy5tYXhUb2tlbnMgPSAyMDQ4O1xuICAgIH1cbiAgICBcbiAgICAvLyBNb2RlbC1zcGVjaWZpYyBjb25maWd1cmF0aW9uc1xuICAgIGlmIChtb2RlbElkID09PSAnYW1hem9uLW5vdmEtcHJvJykge1xuICAgICAgYmFzZUNvbmZpZy5hbmFseXNpc0RlcHRoID0gdGFzay5jb21wbGV4aXR5ID09PSAnY29tcGxleCcgPyAnY29tcHJlaGVuc2l2ZScgOiAnc3RhbmRhcmQnO1xuICAgICAgYmFzZUNvbmZpZy5maW5hbmNpYWxGb2N1cyA9IHRhc2suZG9tYWluID09PSAnZmluYW5jaWFsJztcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGJhc2VDb25maWc7XG4gIH1cblxuICBwcml2YXRlIGdldFJlY2VudFBlcmZvcm1hbmNlSGlzdG9yeShcbiAgICBtb2RlbElkOiBzdHJpbmcsXG4gICAgdGFza1R5cGU6IHN0cmluZyxcbiAgICBsaW1pdDogbnVtYmVyID0gMjBcbiAgKTogTW9kZWxQZXJmb3JtYW5jZUhpc3RvcnlbXSB7XG4gICAgcmV0dXJuIHRoaXMucGVyZm9ybWFuY2VIaXN0b3J5XG4gICAgICAuZmlsdGVyKGggPT4gaC5tb2RlbElkID09PSBtb2RlbElkICYmIGgudGFza1R5cGUgPT09IHRhc2tUeXBlKVxuICAgICAgLnNsaWNlKC1saW1pdCk7XG4gIH1cblxuICBwcml2YXRlIGNhbGN1bGF0ZUFnZ3JlZ2F0ZU1ldHJpY3MoaGlzdG9yeTogTW9kZWxQZXJmb3JtYW5jZUhpc3RvcnlbXSk6IFBlcmZvcm1hbmNlTWV0cmljcyB7XG4gICAgaWYgKGhpc3RvcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXREZWZhdWx0TWV0cmljcygndW5rbm93bicpO1xuICAgIH1cblxuICAgIGNvbnN0IHN1Y2Nlc3NmdWxSdW5zID0gaGlzdG9yeS5maWx0ZXIoaCA9PiBoLnN1Y2Nlc3MpO1xuICAgIGNvbnN0IHRvdGFsUnVucyA9IGhpc3RvcnkubGVuZ3RoO1xuICAgIFxuICAgIGNvbnN0IGF2Z0FjY3VyYWN5ID0gc3VjY2Vzc2Z1bFJ1bnMucmVkdWNlKChzdW0sIGgpID0+IHN1bSArIGgubWV0cmljcy5hY2N1cmFjeSwgMCkgLyBNYXRoLm1heCgxLCBzdWNjZXNzZnVsUnVucy5sZW5ndGgpO1xuICAgIGNvbnN0IGF2Z0xhdGVuY3kgPSBoaXN0b3J5LnJlZHVjZSgoc3VtLCBoKSA9PiBzdW0gKyBoLm1ldHJpY3MubGF0ZW5jeSwgMCkgLyB0b3RhbFJ1bnM7XG4gICAgY29uc3QgYXZnVGhyb3VnaHB1dCA9IGhpc3RvcnkucmVkdWNlKChzdW0sIGgpID0+IHN1bSArIGgubWV0cmljcy50aHJvdWdocHV0LCAwKSAvIHRvdGFsUnVucztcbiAgICBjb25zdCBhdmdDb3N0ID0gaGlzdG9yeS5yZWR1Y2UoKHN1bSwgaCkgPT4gc3VtICsgaC5tZXRyaWNzLmNvc3RQZXJSZXF1ZXN0LCAwKSAvIHRvdGFsUnVucztcbiAgICBjb25zdCBlcnJvclJhdGUgPSAodG90YWxSdW5zIC0gc3VjY2Vzc2Z1bFJ1bnMubGVuZ3RoKSAvIHRvdGFsUnVucztcblxuICAgIHJldHVybiB7XG4gICAgICBhY2N1cmFjeTogYXZnQWNjdXJhY3ksXG4gICAgICBsYXRlbmN5OiBhdmdMYXRlbmN5LFxuICAgICAgdGhyb3VnaHB1dDogYXZnVGhyb3VnaHB1dCxcbiAgICAgIGNvc3RQZXJSZXF1ZXN0OiBhdmdDb3N0LFxuICAgICAgZXJyb3JSYXRlLFxuICAgICAgY3VzdG9tTWV0cmljczoge31cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0TWV0cmljcyhtb2RlbElkOiBzdHJpbmcpOiBQZXJmb3JtYW5jZU1ldHJpY3Mge1xuICAgIC8vIERlZmF1bHQgbWV0cmljcyBiYXNlZCBvbiBtb2RlbCBjaGFyYWN0ZXJpc3RpY3NcbiAgICBjb25zdCBkZWZhdWx0czogUmVjb3JkPHN0cmluZywgUGVyZm9ybWFuY2VNZXRyaWNzPiA9IHtcbiAgICAgICdjbGF1ZGUtc29ubmV0LTMuNyc6IHtcbiAgICAgICAgYWNjdXJhY3k6IDAuOTAsXG4gICAgICAgIGxhdGVuY3k6IDMwMDAsXG4gICAgICAgIHRocm91Z2hwdXQ6IDIwLFxuICAgICAgICBjb3N0UGVyUmVxdWVzdDogMC4wMTUsXG4gICAgICAgIGVycm9yUmF0ZTogMC4wMixcbiAgICAgICAgY3VzdG9tTWV0cmljczoge31cbiAgICAgIH0sXG4gICAgICAnY2xhdWRlLWhhaWt1LTMuNSc6IHtcbiAgICAgICAgYWNjdXJhY3k6IDAuODUsXG4gICAgICAgIGxhdGVuY3k6IDEwMDAsXG4gICAgICAgIHRocm91Z2hwdXQ6IDUwLFxuICAgICAgICBjb3N0UGVyUmVxdWVzdDogMC4wMDUsXG4gICAgICAgIGVycm9yUmF0ZTogMC4wMyxcbiAgICAgICAgY3VzdG9tTWV0cmljczoge31cbiAgICAgIH0sXG4gICAgICAnYW1hem9uLW5vdmEtcHJvJzoge1xuICAgICAgICBhY2N1cmFjeTogMC44OCxcbiAgICAgICAgbGF0ZW5jeTogMjAwMCxcbiAgICAgICAgdGhyb3VnaHB1dDogMzAsXG4gICAgICAgIGNvc3RQZXJSZXF1ZXN0OiAwLjAxMCxcbiAgICAgICAgZXJyb3JSYXRlOiAwLjAyNSxcbiAgICAgICAgY3VzdG9tTWV0cmljczoge31cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmF1bHRzW21vZGVsSWRdIHx8IGRlZmF1bHRzWydjbGF1ZGUtc29ubmV0LTMuNyddO1xuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZU1vZGVsRGVmaW5pdGlvbihtb2RlbDogTW9kZWxEZWZpbml0aW9uKTogdm9pZCB7XG4gICAgaWYgKCFtb2RlbC5pZCB8fCAhbW9kZWwubmFtZSB8fCAhbW9kZWwudmVyc2lvbiB8fCAhbW9kZWwucHJvdmlkZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTW9kZWwgZGVmaW5pdGlvbiBtaXNzaW5nIHJlcXVpcmVkIGZpZWxkcycpO1xuICAgIH1cbiAgICBcbiAgICBpZiAodGhpcy5yZWdpc3RlcmVkTW9kZWxzLmhhcyhtb2RlbC5pZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTW9kZWwgd2l0aCBJRCAke21vZGVsLmlkfSBhbHJlYWR5IGV4aXN0c2ApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQ2FwYWJpbGl0eU1hdHJpeChtb2RlbDogTW9kZWxEZWZpbml0aW9uKTogdm9pZCB7XG4gICAgLy8gRm9yIGN1c3RvbSBtb2RlbHMsIHdlJ2xsIG5lZWQgdG8gaW5mZXIgY2FwYWJpbGl0aWVzIGZyb20gdGhlIGRlZmluaXRpb25cbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvblxuICAgIHRoaXMuY2FwYWJpbGl0eU1hdHJpeFttb2RlbC5pZF0gPSB7XG4gICAgICB0YXNrVHlwZXM6IG1vZGVsLmNhcGFiaWxpdGllcy5pbmNsdWRlcygndGV4dC1nZW5lcmF0aW9uJykgPyBbJ3RleHQtZ2VuZXJhdGlvbiddIDogWydjbGFzc2lmaWNhdGlvbiddLFxuICAgICAgZG9tYWluczogWydnZW5lcmFsJ10sXG4gICAgICBjb21wbGV4aXR5TGV2ZWxzOiBbJ3NpbXBsZScsICdtZWRpdW0nXSxcbiAgICAgIGFnZW50Um9sZXM6IFsncmVzZWFyY2gnXSxcbiAgICAgIHN0cmVuZ3RoczogbW9kZWwuY2FwYWJpbGl0aWVzLFxuICAgICAgd2Vha25lc3NlczogbW9kZWwubGltaXRhdGlvbnNcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogRmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgYSBtb2RlbCBzZWxlY3Rpb24gc2VydmljZSBpbnN0YW5jZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKFxuICBjb25maWc/OiBQYXJ0aWFsPE1vZGVsU2VsZWN0aW9uQ29uZmlnPlxuKTogTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCB7XG4gIHJldHVybiBuZXcgTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbChjb25maWcpO1xufVxuXG4vKipcbiAqIFNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgZ2xvYmFsIHVzZVxuICovXG5sZXQgZ2xvYmFsTW9kZWxTZWxlY3Rpb25TZXJ2aWNlOiBNb2RlbFNlbGVjdGlvblNlcnZpY2VJbXBsIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNb2RlbFNlbGVjdGlvblNlcnZpY2UoKTogTW9kZWxTZWxlY3Rpb25TZXJ2aWNlSW1wbCB7XG4gIGlmICghZ2xvYmFsTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKSB7XG4gICAgZ2xvYmFsTW9kZWxTZWxlY3Rpb25TZXJ2aWNlID0gY3JlYXRlTW9kZWxTZWxlY3Rpb25TZXJ2aWNlKCk7XG4gIH1cbiAgcmV0dXJuIGdsb2JhbE1vZGVsU2VsZWN0aW9uU2VydmljZTtcbn0iXX0=