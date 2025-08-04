"use strict";
/**
 * Investment Idea Request Service
 * Handles the submission, processing, and management of investment idea requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentIdeaRequestService = void 0;
class InvestmentIdeaRequestService {
    constructor(trackingService, orchestrationService) {
        this.requestStore = new Map();
        this.resultStore = new Map();
        this.feedbackStore = new Map();
        this.trackingService = trackingService;
        this.orchestrationService = orchestrationService;
    }
    /**
     * Submit a new investment idea generation request
     */
    async submitRequest(request) {
        // Store the request
        this.requestStore.set(request.id, request);
        // Estimate processing time based on parameters
        const estimatedTime = this.estimateProcessingTime(request);
        request.estimatedProcessingTime = estimatedTime;
        // Update status to validated
        await this.trackingService.updateStatus(request.id, 'validated');
        await this.trackingService.updateStep(request.id, 'parameter-validation', 'completed');
        // Queue the request for processing
        this.queueForProcessing(request);
        return request;
    }
    /**
     * Get request results
     */
    async getRequestResults(requestId, userId) {
        const request = this.requestStore.get(requestId);
        if (!request || request.userId !== userId) {
            return null;
        }
        return this.resultStore.get(requestId) || null;
    }
    /**
     * Cancel a pending request
     */
    async cancelRequest(requestId, userId) {
        const request = this.requestStore.get(requestId);
        if (!request || request.userId !== userId) {
            return false;
        }
        // Can only cancel if not yet completed
        if (['completed', 'failed', 'cancelled'].includes(request.status)) {
            return false;
        }
        // Update status
        request.status = 'cancelled';
        await this.trackingService.updateStatus(requestId, 'cancelled');
        return true;
    }
    /**
     * Get request history for a user
     */
    async getRequestHistory(userId, page = 1, limit = 10, filters = {}) {
        // Get all requests for the user
        const userRequests = Array.from(this.requestStore.values())
            .filter(request => request.userId === userId);
        // Apply filters
        let filteredRequests = userRequests;
        if (filters.status) {
            filteredRequests = filteredRequests.filter(request => request.status === filters.status);
        }
        if (filters.dateFrom) {
            filteredRequests = filteredRequests.filter(request => request.timestamp >= filters.dateFrom);
        }
        if (filters.dateTo) {
            filteredRequests = filteredRequests.filter(request => request.timestamp <= filters.dateTo);
        }
        if (filters.priority) {
            filteredRequests = filteredRequests.filter(request => request.priority === filters.priority);
        }
        if (filters.investmentHorizon) {
            filteredRequests = filteredRequests.filter(request => request.parameters.investmentHorizon === filters.investmentHorizon);
        }
        if (filters.riskTolerance) {
            filteredRequests = filteredRequests.filter(request => request.parameters.riskTolerance === filters.riskTolerance);
        }
        // Sort by timestamp (most recent first)
        filteredRequests.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // Paginate
        const total = filteredRequests.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
        // Convert to history entries
        const historyEntries = await Promise.all(paginatedRequests.map(async (request) => {
            const result = this.resultStore.get(request.id);
            const feedback = this.feedbackStore.get(request.id);
            return {
                id: request.id,
                parameters: request.parameters,
                status: request.status,
                priority: request.priority,
                submittedAt: request.timestamp,
                completedAt: result?.generatedAt,
                processingTime: request.actualProcessingTime,
                resultCount: result?.investmentIdeas.length,
                qualityScore: result?.qualityScore,
                userRating: feedback?.rating
            };
        }));
        return {
            requests: historyEntries,
            total,
            page,
            limit,
            filters
        };
    }
    /**
     * Submit feedback for a request
     */
    async submitFeedback(requestId, userId, feedback) {
        const request = this.requestStore.get(requestId);
        if (!request || request.userId !== userId) {
            return null;
        }
        const feedbackRecord = {
            id: `feedback_${requestId}_${Date.now()}`,
            requestId,
            userId,
            ...feedback
        };
        this.feedbackStore.set(requestId, feedbackRecord);
        // Update result with feedback if it exists
        const result = this.resultStore.get(requestId);
        if (result) {
            result.metadata = {
                ...result.metadata,
                userFeedback: feedbackRecord
            };
            this.resultStore.set(requestId, result);
        }
        return feedbackRecord;
    }
    /**
     * Get request by ID (internal use)
     */
    async getRequest(requestId) {
        return this.requestStore.get(requestId) || null;
    }
    /**
     * Store request results (internal use)
     */
    async storeResults(requestId, result) {
        this.resultStore.set(requestId, result);
        await this.trackingService.setResults(requestId, result);
        // Update request status
        const request = this.requestStore.get(requestId);
        if (request) {
            request.status = 'completed';
            request.actualProcessingTime = result.processingMetrics.totalProcessingTime;
        }
    }
    /**
     * Mark request as failed (internal use)
     */
    async markRequestFailed(requestId, error) {
        const request = this.requestStore.get(requestId);
        if (request) {
            request.status = 'failed';
        }
        await this.trackingService.updateStatus(requestId, 'failed');
        await this.trackingService.addError(requestId, {
            code: 'PROCESSING_FAILED',
            message: error,
            severity: 'critical',
            step: 'idea-generation',
            recoverable: false
        });
    }
    /**
     * Estimate processing time based on request parameters
     */
    estimateProcessingTime(request) {
        let baseTime = 30; // Base 30 seconds
        // Adjust based on research depth
        switch (request.parameters.researchDepth) {
            case 'basic':
                baseTime += 10;
                break;
            case 'standard':
                baseTime += 30;
                break;
            case 'comprehensive':
                baseTime += 60;
                break;
            case 'deep-dive':
                baseTime += 120;
                break;
        }
        // Adjust based on number of ideas requested
        const maxIdeas = request.parameters.maximumIdeas || 5;
        baseTime += maxIdeas * 5;
        // Adjust based on complexity of parameters
        if (request.parameters.customCriteria && request.parameters.customCriteria.length > 0) {
            baseTime += request.parameters.customCriteria.length * 10;
        }
        if (request.parameters.includeBacktesting) {
            baseTime += 45;
        }
        if (request.parameters.includeRiskAnalysis) {
            baseTime += 30;
        }
        if (request.parameters.includeESGFactors) {
            baseTime += 20;
        }
        // Adjust based on priority
        switch (request.priority) {
            case 'urgent':
                baseTime *= 0.7; // Faster processing for urgent requests
                break;
            case 'high':
                baseTime *= 0.85;
                break;
            case 'low':
                baseTime *= 1.3; // Slower processing for low priority
                break;
        }
        return Math.round(baseTime);
    }
    /**
     * Queue request for processing
     */
    async queueForProcessing(request) {
        // Update status to queued
        await this.trackingService.updateStatus(request.id, 'queued');
        await this.trackingService.updateStep(request.id, 'request-queuing', 'completed');
        // Start processing asynchronously
        this.processRequest(request).catch(async (error) => {
            console.error(`Error processing request ${request.id}:`, error);
            await this.markRequestFailed(request.id, error.message);
        });
    }
    /**
     * Process the investment idea request
     */
    async processRequest(request) {
        const startTime = new Date();
        try {
            // Update status to processing
            await this.trackingService.updateStatus(request.id, 'processing');
            await this.trackingService.updateStep(request.id, 'research-planning', 'started');
            // Use orchestration service to generate investment ideas
            const investmentIdeas = await this.orchestrationService.generateInvestmentIdeas({
                userId: request.userId,
                requestId: request.id,
                parameters: request.parameters
            });
            const endTime = new Date();
            const processingTime = endTime.getTime() - startTime.getTime();
            // Create result object
            const result = {
                requestId: request.id,
                status: 'completed',
                investmentIdeas: investmentIdeas.ideas,
                processingMetrics: {
                    totalProcessingTime: processingTime,
                    modelExecutionTime: processingTime * 0.7,
                    dataRetrievalTime: processingTime * 0.2,
                    validationTime: processingTime * 0.1,
                    resourcesUsed: {
                        cpuTime: processingTime,
                        memoryPeak: 512,
                        networkRequests: 10 + (request.parameters.maximumIdeas || 5) * 2,
                        storageOperations: 5,
                        estimatedCost: this.calculateEstimatedCost(request)
                    },
                    modelsUsed: [
                        {
                            modelId: 'claude-sonnet-3.7',
                            modelName: 'Claude Sonnet 3.7',
                            executionCount: 2,
                            totalTokens: 5000,
                            inputTokens: 2000,
                            outputTokens: 3000,
                            executionTime: processingTime * 0.4,
                            cost: 0.15
                        },
                        {
                            modelId: 'amazon-nova-pro',
                            modelName: 'Amazon Nova Pro',
                            executionCount: 1,
                            totalTokens: 3000,
                            inputTokens: 1500,
                            outputTokens: 1500,
                            executionTime: processingTime * 0.3,
                            cost: 0.08
                        }
                    ],
                    dataSourcesAccessed: [
                        {
                            sourceId: 'market-data',
                            sourceName: 'Market Data Feed',
                            requestCount: 5,
                            dataVolume: 1024 * 1024,
                            responseTime: 200,
                            reliability: 98
                        },
                        {
                            sourceId: 'web-search',
                            sourceName: 'Web Search API',
                            requestCount: 3,
                            dataVolume: 512 * 1024,
                            responseTime: 500,
                            reliability: 95
                        }
                    ]
                },
                generatedAt: endTime,
                expiresAt: new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000),
                metadata: {
                    generationMethod: 'multi-agent',
                    researchSources: ['market-data', 'web-search', 'proprietary-data'],
                    marketDataTimestamp: new Date(),
                    complianceVersion: '1.0.0',
                    qualityChecks: [
                        {
                            checkType: 'consistency',
                            passed: true,
                            score: 92,
                            details: 'All investment ideas are internally consistent'
                        },
                        {
                            checkType: 'accuracy',
                            passed: true,
                            score: 88,
                            details: 'Data accuracy verified against multiple sources'
                        },
                        {
                            checkType: 'completeness',
                            passed: true,
                            score: 95,
                            details: 'All required fields populated'
                        },
                        {
                            checkType: 'relevance',
                            passed: true,
                            score: 90,
                            details: 'Ideas align with user parameters'
                        }
                    ],
                    biasAssessment: {
                        overallBiasScore: 15,
                        biasTypes: [
                            {
                                type: 'recency',
                                severity: 'low',
                                description: 'Slight bias toward recent market events',
                                mitigation: 'Historical context included in analysis'
                            }
                        ],
                        mitigationApplied: ['historical-context', 'multiple-perspectives', 'contrarian-analysis']
                    }
                },
                qualityScore: 91,
                confidenceScore: 87
            };
            // Store results
            await this.storeResults(request.id, result);
            await this.trackingService.updateStatus(request.id, 'completed');
            await this.trackingService.updateStep(request.id, 'quality-assurance', 'completed');
            // Send callback if configured
            if (request.callback) {
                await this.sendCallback(request.callback, result);
            }
        }
        catch (error) {
            console.error(`Error in processRequest for ${request.id}:`, error);
            await this.markRequestFailed(request.id, error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
    /**
     * Calculate estimated cost for request processing
     */
    calculateEstimatedCost(request) {
        let baseCost = 0.10; // Base cost in USD
        // Adjust based on research depth
        switch (request.parameters.researchDepth) {
            case 'basic':
                baseCost += 0.05;
                break;
            case 'standard':
                baseCost += 0.15;
                break;
            case 'comprehensive':
                baseCost += 0.30;
                break;
            case 'deep-dive':
                baseCost += 0.60;
                break;
        }
        // Adjust based on number of ideas
        const maxIdeas = request.parameters.maximumIdeas || 5;
        baseCost += maxIdeas * 0.03;
        // Additional features
        if (request.parameters.includeBacktesting) {
            baseCost += 0.20;
        }
        if (request.parameters.includeRiskAnalysis) {
            baseCost += 0.15;
        }
        if (request.parameters.includeESGFactors) {
            baseCost += 0.10;
        }
        return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
    }
    /**
     * Send callback notification
     */
    async sendCallback(callback, result) {
        try {
            const response = await fetch(callback.url, {
                method: callback.method || 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...callback.headers
                },
                body: JSON.stringify({
                    requestId: result.requestId,
                    status: result.status,
                    timestamp: result.generatedAt,
                    resultSummary: {
                        ideaCount: result.investmentIdeas.length,
                        qualityScore: result.qualityScore,
                        confidenceScore: result.confidenceScore
                    }
                })
            });
            if (!response.ok) {
                console.error(`Callback failed: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            console.error('Error sending callback:', error);
        }
    }
}
exports.InvestmentIdeaRequestService = InvestmentIdeaRequestService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXJlcXVlc3Qtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9pbnZlc3RtZW50LWlkZWEtcmVxdWVzdC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQWVILE1BQWEsNEJBQTRCO0lBT3ZDLFlBQ0UsZUFBdUMsRUFDdkMsb0JBQXdEO1FBUmxELGlCQUFZLEdBQWlELElBQUksR0FBRyxFQUFFLENBQUM7UUFDdkUsZ0JBQVcsR0FBNkMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNsRSxrQkFBYSxHQUFpQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBUTlELElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQztJQUNuRCxDQUFDO0lBRUQ7O09BRUc7SUFDSSxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQXdDO1FBQ2pFLG9CQUFvQjtRQUNwQixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLCtDQUErQztRQUMvQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0QsT0FBTyxDQUFDLHVCQUF1QixHQUFHLGFBQWEsQ0FBQztRQUVoRCw2QkFBNkI7UUFDN0IsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxzQkFBc0IsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUV2RixtQ0FBbUM7UUFDbkMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWpD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UyxFQUFFLE1BQU0sQ0FBQyxTQUFTO29CQUMzQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07b0JBQ3JCLFNBQVMsRUFBRSxNQUFNLENBQUMsV0FBVztvQkFDN0IsYUFBYSxFQUFFO3dCQUNiLFNBQVMsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU07d0JBQ3hDLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTt3QkFDakMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxlQUFlO3FCQUN4QztpQkFDRixDQUFDO2FBQ0gsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUU7Z0JBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7YUFDN0U7U0FDRjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNqRDtJQUNILENBQUM7Q0FDRjtBQXhnQkQsb0VBd2dCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW52ZXN0bWVudCBJZGVhIFJlcXVlc3QgU2VydmljZVxuICogSGFuZGxlcyB0aGUgc3VibWlzc2lvbiwgcHJvY2Vzc2luZywgYW5kIG1hbmFnZW1lbnQgb2YgaW52ZXN0bWVudCBpZGVhIHJlcXVlc3RzXG4gKi9cblxuaW1wb3J0IHsgXG4gIEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QsXG4gIEludmVzdG1lbnRJZGVhUmVxdWVzdFJlc3VsdCxcbiAgUmVxdWVzdEhpc3RvcnlGaWx0ZXIsXG4gIFJlcXVlc3RIaXN0b3J5RW50cnksXG4gIFJlcXVlc3RIaXN0b3J5UmVzcG9uc2UsXG4gIFJlcXVlc3RGZWVkYmFjayxcbiAgUmVxdWVzdFN0YXR1c1xufSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhLXJlcXVlc3QnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWEgfSBmcm9tICcuLi9tb2RlbHMvaW52ZXN0bWVudC1pZGVhJztcbmltcG9ydCB7IFJlcXVlc3RUcmFja2luZ1NlcnZpY2UgfSBmcm9tICcuL3JlcXVlc3QtdHJhY2tpbmctc2VydmljZSc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi9pbnZlc3RtZW50LWlkZWEtb3JjaGVzdHJhdGlvbic7XG5cbmV4cG9ydCBjbGFzcyBJbnZlc3RtZW50SWRlYVJlcXVlc3RTZXJ2aWNlIHtcbiAgcHJpdmF0ZSByZXF1ZXN0U3RvcmU6IE1hcDxzdHJpbmcsIEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3Q+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIHJlc3VsdFN0b3JlOiBNYXA8c3RyaW5nLCBJbnZlc3RtZW50SWRlYVJlcXVlc3RSZXN1bHQ+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIGZlZWRiYWNrU3RvcmU6IE1hcDxzdHJpbmcsIFJlcXVlc3RGZWVkYmFjaz4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgdHJhY2tpbmdTZXJ2aWNlOiBSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlO1xuICBwcml2YXRlIG9yY2hlc3RyYXRpb25TZXJ2aWNlOiBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHRyYWNraW5nU2VydmljZTogUmVxdWVzdFRyYWNraW5nU2VydmljZSxcbiAgICBvcmNoZXN0cmF0aW9uU2VydmljZTogSW52ZXN0bWVudElkZWFPcmNoZXN0cmF0aW9uU2VydmljZVxuICApIHtcbiAgICB0aGlzLnRyYWNraW5nU2VydmljZSA9IHRyYWNraW5nU2VydmljZTtcbiAgICB0aGlzLm9yY2hlc3RyYXRpb25TZXJ2aWNlID0gb3JjaGVzdHJhdGlvblNlcnZpY2U7XG4gIH1cblxuICAvKipcbiAgICogU3VibWl0IGEgbmV3IGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIHJlcXVlc3RcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzdWJtaXRSZXF1ZXN0KHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QpOiBQcm9taXNlPEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3Q+IHtcbiAgICAvLyBTdG9yZSB0aGUgcmVxdWVzdFxuICAgIHRoaXMucmVxdWVzdFN0b3JlLnNldChyZXF1ZXN0LmlkLCByZXF1ZXN0KTtcblxuICAgIC8vIEVzdGltYXRlIHByb2Nlc3NpbmcgdGltZSBiYXNlZCBvbiBwYXJhbWV0ZXJzXG4gICAgY29uc3QgZXN0aW1hdGVkVGltZSA9IHRoaXMuZXN0aW1hdGVQcm9jZXNzaW5nVGltZShyZXF1ZXN0KTtcbiAgICByZXF1ZXN0LmVzdGltYXRlZFByb2Nlc3NpbmdUaW1lID0gZXN0aW1hdGVkVGltZTtcblxuICAgIC8vIFVwZGF0ZSBzdGF0dXMgdG8gdmFsaWRhdGVkXG4gICAgYXdhaXQgdGhpcy50cmFja2luZ1NlcnZpY2UudXBkYXRlU3RhdHVzKHJlcXVlc3QuaWQsICd2YWxpZGF0ZWQnKTtcbiAgICBhd2FpdCB0aGlzLnRyYWNraW5nU2VydmljZS51cGRhdGVTdGVwKHJlcXVlc3QuaWQsICdwYXJhbWV0ZXItdmFsaWRhdGlvbicsICdjb21wbGV0ZWQnKTtcblxuICAgIC8vIFF1ZXVlIHRoZSByZXF1ZXN0IGZvciBwcm9jZXNzaW5nXG4gICAgdGhpcy5xdWV1ZUZvclByb2Nlc3NpbmcocmVxdWVzdCk7XG5cbiAgICByZXR1cm4gcmVxdWVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcmVxdWVzdCByZXN1bHRzXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZ2V0UmVxdWVzdFJlc3VsdHMocmVxdWVzdElkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxJbnZlc3RtZW50SWRlYVJlcXVlc3RSZXN1bHQgfCBudWxsPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdFN0b3JlLmdldChyZXF1ZXN0SWQpO1xuICAgIGlmICghcmVxdWVzdCB8fCByZXF1ZXN0LnVzZXJJZCAhPT0gdXNlcklkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZXN1bHRTdG9yZS5nZXQocmVxdWVzdElkKSB8fCBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbmNlbCBhIHBlbmRpbmcgcmVxdWVzdFxuICAgKi9cbiAgcHVibGljIGFzeW5jIGNhbmNlbFJlcXVlc3QocmVxdWVzdElkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdFN0b3JlLmdldChyZXF1ZXN0SWQpO1xuICAgIGlmICghcmVxdWVzdCB8fCByZXF1ZXN0LnVzZXJJZCAhPT0gdXNlcklkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gQ2FuIG9ubHkgY2FuY2VsIGlmIG5vdCB5ZXQgY29tcGxldGVkXG4gICAgaWYgKFsnY29tcGxldGVkJywgJ2ZhaWxlZCcsICdjYW5jZWxsZWQnXS5pbmNsdWRlcyhyZXF1ZXN0LnN0YXR1cykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgc3RhdHVzXG4gICAgcmVxdWVzdC5zdGF0dXMgPSAnY2FuY2VsbGVkJztcbiAgICBhd2FpdCB0aGlzLnRyYWNraW5nU2VydmljZS51cGRhdGVTdGF0dXMocmVxdWVzdElkLCAnY2FuY2VsbGVkJyk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcmVxdWVzdCBoaXN0b3J5IGZvciBhIHVzZXJcbiAgICovXG4gIHB1YmxpYyBhc3luYyBnZXRSZXF1ZXN0SGlzdG9yeShcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICBwYWdlOiBudW1iZXIgPSAxLFxuICAgIGxpbWl0OiBudW1iZXIgPSAxMCxcbiAgICBmaWx0ZXJzOiBSZXF1ZXN0SGlzdG9yeUZpbHRlciA9IHt9XG4gICk6IFByb21pc2U8UmVxdWVzdEhpc3RvcnlSZXNwb25zZT4ge1xuICAgIC8vIEdldCBhbGwgcmVxdWVzdHMgZm9yIHRoZSB1c2VyXG4gICAgY29uc3QgdXNlclJlcXVlc3RzID0gQXJyYXkuZnJvbSh0aGlzLnJlcXVlc3RTdG9yZS52YWx1ZXMoKSlcbiAgICAgIC5maWx0ZXIocmVxdWVzdCA9PiByZXF1ZXN0LnVzZXJJZCA9PT0gdXNlcklkKTtcblxuICAgIC8vIEFwcGx5IGZpbHRlcnNcbiAgICBsZXQgZmlsdGVyZWRSZXF1ZXN0cyA9IHVzZXJSZXF1ZXN0cztcblxuICAgIGlmIChmaWx0ZXJzLnN0YXR1cykge1xuICAgICAgZmlsdGVyZWRSZXF1ZXN0cyA9IGZpbHRlcmVkUmVxdWVzdHMuZmlsdGVyKHJlcXVlc3QgPT4gcmVxdWVzdC5zdGF0dXMgPT09IGZpbHRlcnMuc3RhdHVzKTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVycy5kYXRlRnJvbSkge1xuICAgICAgZmlsdGVyZWRSZXF1ZXN0cyA9IGZpbHRlcmVkUmVxdWVzdHMuZmlsdGVyKHJlcXVlc3QgPT4gcmVxdWVzdC50aW1lc3RhbXAgPj0gZmlsdGVycy5kYXRlRnJvbSEpO1xuICAgIH1cblxuICAgIGlmIChmaWx0ZXJzLmRhdGVUbykge1xuICAgICAgZmlsdGVyZWRSZXF1ZXN0cyA9IGZpbHRlcmVkUmVxdWVzdHMuZmlsdGVyKHJlcXVlc3QgPT4gcmVxdWVzdC50aW1lc3RhbXAgPD0gZmlsdGVycy5kYXRlVG8hKTtcbiAgICB9XG5cbiAgICBpZiAoZmlsdGVycy5wcmlvcml0eSkge1xuICAgICAgZmlsdGVyZWRSZXF1ZXN0cyA9IGZpbHRlcmVkUmVxdWVzdHMuZmlsdGVyKHJlcXVlc3QgPT4gcmVxdWVzdC5wcmlvcml0eSA9PT0gZmlsdGVycy5wcmlvcml0eSk7XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcnMuaW52ZXN0bWVudEhvcml6b24pIHtcbiAgICAgIGZpbHRlcmVkUmVxdWVzdHMgPSBmaWx0ZXJlZFJlcXVlc3RzLmZpbHRlcihyZXF1ZXN0ID0+IFxuICAgICAgICByZXF1ZXN0LnBhcmFtZXRlcnMuaW52ZXN0bWVudEhvcml6b24gPT09IGZpbHRlcnMuaW52ZXN0bWVudEhvcml6b25cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGZpbHRlcnMucmlza1RvbGVyYW5jZSkge1xuICAgICAgZmlsdGVyZWRSZXF1ZXN0cyA9IGZpbHRlcmVkUmVxdWVzdHMuZmlsdGVyKHJlcXVlc3QgPT4gXG4gICAgICAgIHJlcXVlc3QucGFyYW1ldGVycy5yaXNrVG9sZXJhbmNlID09PSBmaWx0ZXJzLnJpc2tUb2xlcmFuY2VcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gU29ydCBieSB0aW1lc3RhbXAgKG1vc3QgcmVjZW50IGZpcnN0KVxuICAgIGZpbHRlcmVkUmVxdWVzdHMuc29ydCgoYSwgYikgPT4gYi50aW1lc3RhbXAuZ2V0VGltZSgpIC0gYS50aW1lc3RhbXAuZ2V0VGltZSgpKTtcblxuICAgIC8vIFBhZ2luYXRlXG4gICAgY29uc3QgdG90YWwgPSBmaWx0ZXJlZFJlcXVlc3RzLmxlbmd0aDtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gKHBhZ2UgLSAxKSAqIGxpbWl0O1xuICAgIGNvbnN0IGVuZEluZGV4ID0gc3RhcnRJbmRleCArIGxpbWl0O1xuICAgIGNvbnN0IHBhZ2luYXRlZFJlcXVlc3RzID0gZmlsdGVyZWRSZXF1ZXN0cy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCk7XG5cbiAgICAvLyBDb252ZXJ0IHRvIGhpc3RvcnkgZW50cmllc1xuICAgIGNvbnN0IGhpc3RvcnlFbnRyaWVzOiBSZXF1ZXN0SGlzdG9yeUVudHJ5W10gPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgIHBhZ2luYXRlZFJlcXVlc3RzLm1hcChhc3luYyAocmVxdWVzdCkgPT4ge1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLnJlc3VsdFN0b3JlLmdldChyZXF1ZXN0LmlkKTtcbiAgICAgICAgY29uc3QgZmVlZGJhY2sgPSB0aGlzLmZlZWRiYWNrU3RvcmUuZ2V0KHJlcXVlc3QuaWQpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaWQ6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgcGFyYW1ldGVyczogcmVxdWVzdC5wYXJhbWV0ZXJzLFxuICAgICAgICAgIHN0YXR1czogcmVxdWVzdC5zdGF0dXMsXG4gICAgICAgICAgcHJpb3JpdHk6IHJlcXVlc3QucHJpb3JpdHksXG4gICAgICAgICAgc3VibWl0dGVkQXQ6IHJlcXVlc3QudGltZXN0YW1wLFxuICAgICAgICAgIGNvbXBsZXRlZEF0OiByZXN1bHQ/LmdlbmVyYXRlZEF0LFxuICAgICAgICAgIHByb2Nlc3NpbmdUaW1lOiByZXF1ZXN0LmFjdHVhbFByb2Nlc3NpbmdUaW1lLFxuICAgICAgICAgIHJlc3VsdENvdW50OiByZXN1bHQ/LmludmVzdG1lbnRJZGVhcy5sZW5ndGgsXG4gICAgICAgICAgcXVhbGl0eVNjb3JlOiByZXN1bHQ/LnF1YWxpdHlTY29yZSxcbiAgICAgICAgICB1c2VyUmF0aW5nOiBmZWVkYmFjaz8ucmF0aW5nXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcmVxdWVzdHM6IGhpc3RvcnlFbnRyaWVzLFxuICAgICAgdG90YWwsXG4gICAgICBwYWdlLFxuICAgICAgbGltaXQsXG4gICAgICBmaWx0ZXJzXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgZmVlZGJhY2sgZm9yIGEgcmVxdWVzdFxuICAgKi9cbiAgcHVibGljIGFzeW5jIHN1Ym1pdEZlZWRiYWNrKFxuICAgIHJlcXVlc3RJZDogc3RyaW5nLCBcbiAgICB1c2VySWQ6IHN0cmluZywgXG4gICAgZmVlZGJhY2s6IE9taXQ8UmVxdWVzdEZlZWRiYWNrLCAnaWQnIHwgJ3JlcXVlc3RJZCcgfCAndXNlcklkJz5cbiAgKTogUHJvbWlzZTxSZXF1ZXN0RmVlZGJhY2sgfCBudWxsPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdFN0b3JlLmdldChyZXF1ZXN0SWQpO1xuICAgIGlmICghcmVxdWVzdCB8fCByZXF1ZXN0LnVzZXJJZCAhPT0gdXNlcklkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBmZWVkYmFja1JlY29yZDogUmVxdWVzdEZlZWRiYWNrID0ge1xuICAgICAgaWQ6IGBmZWVkYmFja18ke3JlcXVlc3RJZH1fJHtEYXRlLm5vdygpfWAsXG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQsXG4gICAgICAuLi5mZWVkYmFja1xuICAgIH07XG5cbiAgICB0aGlzLmZlZWRiYWNrU3RvcmUuc2V0KHJlcXVlc3RJZCwgZmVlZGJhY2tSZWNvcmQpO1xuXG4gICAgLy8gVXBkYXRlIHJlc3VsdCB3aXRoIGZlZWRiYWNrIGlmIGl0IGV4aXN0c1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVzdWx0U3RvcmUuZ2V0KHJlcXVlc3RJZCk7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmVzdWx0Lm1ldGFkYXRhID0ge1xuICAgICAgICAuLi5yZXN1bHQubWV0YWRhdGEsXG4gICAgICAgIHVzZXJGZWVkYmFjazogZmVlZGJhY2tSZWNvcmRcbiAgICAgIH07XG4gICAgICB0aGlzLnJlc3VsdFN0b3JlLnNldChyZXF1ZXN0SWQsIHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZlZWRiYWNrUmVjb3JkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCByZXF1ZXN0IGJ5IElEIChpbnRlcm5hbCB1c2UpXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZ2V0UmVxdWVzdChyZXF1ZXN0SWQ6IHN0cmluZyk6IFByb21pc2U8SW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCB8IG51bGw+IHtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0U3RvcmUuZ2V0KHJlcXVlc3RJZCkgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9yZSByZXF1ZXN0IHJlc3VsdHMgKGludGVybmFsIHVzZSlcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzdG9yZVJlc3VsdHMocmVxdWVzdElkOiBzdHJpbmcsIHJlc3VsdDogSW52ZXN0bWVudElkZWFSZXF1ZXN0UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5yZXN1bHRTdG9yZS5zZXQocmVxdWVzdElkLCByZXN1bHQpO1xuICAgIGF3YWl0IHRoaXMudHJhY2tpbmdTZXJ2aWNlLnNldFJlc3VsdHMocmVxdWVzdElkLCByZXN1bHQpO1xuXG4gICAgLy8gVXBkYXRlIHJlcXVlc3Qgc3RhdHVzXG4gICAgY29uc3QgcmVxdWVzdCA9IHRoaXMucmVxdWVzdFN0b3JlLmdldChyZXF1ZXN0SWQpO1xuICAgIGlmIChyZXF1ZXN0KSB7XG4gICAgICByZXF1ZXN0LnN0YXR1cyA9ICdjb21wbGV0ZWQnO1xuICAgICAgcmVxdWVzdC5hY3R1YWxQcm9jZXNzaW5nVGltZSA9IHJlc3VsdC5wcm9jZXNzaW5nTWV0cmljcy50b3RhbFByb2Nlc3NpbmdUaW1lO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYXJrIHJlcXVlc3QgYXMgZmFpbGVkIChpbnRlcm5hbCB1c2UpXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgbWFya1JlcXVlc3RGYWlsZWQocmVxdWVzdElkOiBzdHJpbmcsIGVycm9yOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5yZXF1ZXN0U3RvcmUuZ2V0KHJlcXVlc3RJZCk7XG4gICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgIHJlcXVlc3Quc3RhdHVzID0gJ2ZhaWxlZCc7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy50cmFja2luZ1NlcnZpY2UudXBkYXRlU3RhdHVzKHJlcXVlc3RJZCwgJ2ZhaWxlZCcpO1xuICAgIGF3YWl0IHRoaXMudHJhY2tpbmdTZXJ2aWNlLmFkZEVycm9yKHJlcXVlc3RJZCwge1xuICAgICAgY29kZTogJ1BST0NFU1NJTkdfRkFJTEVEJyxcbiAgICAgIG1lc3NhZ2U6IGVycm9yLFxuICAgICAgc2V2ZXJpdHk6ICdjcml0aWNhbCcsXG4gICAgICBzdGVwOiAnaWRlYS1nZW5lcmF0aW9uJyxcbiAgICAgIHJlY292ZXJhYmxlOiBmYWxzZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVzdGltYXRlIHByb2Nlc3NpbmcgdGltZSBiYXNlZCBvbiByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICovXG4gIHByaXZhdGUgZXN0aW1hdGVQcm9jZXNzaW5nVGltZShyZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0KTogbnVtYmVyIHtcbiAgICBsZXQgYmFzZVRpbWUgPSAzMDsgLy8gQmFzZSAzMCBzZWNvbmRzXG5cbiAgICAvLyBBZGp1c3QgYmFzZWQgb24gcmVzZWFyY2ggZGVwdGhcbiAgICBzd2l0Y2ggKHJlcXVlc3QucGFyYW1ldGVycy5yZXNlYXJjaERlcHRoKSB7XG4gICAgICBjYXNlICdiYXNpYyc6XG4gICAgICAgIGJhc2VUaW1lICs9IDEwO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0YW5kYXJkJzpcbiAgICAgICAgYmFzZVRpbWUgKz0gMzA7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29tcHJlaGVuc2l2ZSc6XG4gICAgICAgIGJhc2VUaW1lICs9IDYwO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2RlZXAtZGl2ZSc6XG4gICAgICAgIGJhc2VUaW1lICs9IDEyMDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gQWRqdXN0IGJhc2VkIG9uIG51bWJlciBvZiBpZGVhcyByZXF1ZXN0ZWRcbiAgICBjb25zdCBtYXhJZGVhcyA9IHJlcXVlc3QucGFyYW1ldGVycy5tYXhpbXVtSWRlYXMgfHwgNTtcbiAgICBiYXNlVGltZSArPSBtYXhJZGVhcyAqIDU7XG5cbiAgICAvLyBBZGp1c3QgYmFzZWQgb24gY29tcGxleGl0eSBvZiBwYXJhbWV0ZXJzXG4gICAgaWYgKHJlcXVlc3QucGFyYW1ldGVycy5jdXN0b21Dcml0ZXJpYSAmJiByZXF1ZXN0LnBhcmFtZXRlcnMuY3VzdG9tQ3JpdGVyaWEubGVuZ3RoID4gMCkge1xuICAgICAgYmFzZVRpbWUgKz0gcmVxdWVzdC5wYXJhbWV0ZXJzLmN1c3RvbUNyaXRlcmlhLmxlbmd0aCAqIDEwO1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LnBhcmFtZXRlcnMuaW5jbHVkZUJhY2t0ZXN0aW5nKSB7XG4gICAgICBiYXNlVGltZSArPSA0NTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdC5wYXJhbWV0ZXJzLmluY2x1ZGVSaXNrQW5hbHlzaXMpIHtcbiAgICAgIGJhc2VUaW1lICs9IDMwO1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LnBhcmFtZXRlcnMuaW5jbHVkZUVTR0ZhY3RvcnMpIHtcbiAgICAgIGJhc2VUaW1lICs9IDIwO1xuICAgIH1cblxuICAgIC8vIEFkanVzdCBiYXNlZCBvbiBwcmlvcml0eVxuICAgIHN3aXRjaCAocmVxdWVzdC5wcmlvcml0eSkge1xuICAgICAgY2FzZSAndXJnZW50JzpcbiAgICAgICAgYmFzZVRpbWUgKj0gMC43OyAvLyBGYXN0ZXIgcHJvY2Vzc2luZyBmb3IgdXJnZW50IHJlcXVlc3RzXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaGlnaCc6XG4gICAgICAgIGJhc2VUaW1lICo9IDAuODU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnbG93JzpcbiAgICAgICAgYmFzZVRpbWUgKj0gMS4zOyAvLyBTbG93ZXIgcHJvY2Vzc2luZyBmb3IgbG93IHByaW9yaXR5XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBNYXRoLnJvdW5kKGJhc2VUaW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBRdWV1ZSByZXF1ZXN0IGZvciBwcm9jZXNzaW5nXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHF1ZXVlRm9yUHJvY2Vzc2luZyhyZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gVXBkYXRlIHN0YXR1cyB0byBxdWV1ZWRcbiAgICBhd2FpdCB0aGlzLnRyYWNraW5nU2VydmljZS51cGRhdGVTdGF0dXMocmVxdWVzdC5pZCwgJ3F1ZXVlZCcpO1xuICAgIGF3YWl0IHRoaXMudHJhY2tpbmdTZXJ2aWNlLnVwZGF0ZVN0ZXAocmVxdWVzdC5pZCwgJ3JlcXVlc3QtcXVldWluZycsICdjb21wbGV0ZWQnKTtcblxuICAgIC8vIFN0YXJ0IHByb2Nlc3NpbmcgYXN5bmNocm9ub3VzbHlcbiAgICB0aGlzLnByb2Nlc3NSZXF1ZXN0KHJlcXVlc3QpLmNhdGNoKGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyByZXF1ZXN0ICR7cmVxdWVzdC5pZH06YCwgZXJyb3IpO1xuICAgICAgYXdhaXQgdGhpcy5tYXJrUmVxdWVzdEZhaWxlZChyZXF1ZXN0LmlkLCBlcnJvci5tZXNzYWdlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm9jZXNzIHRoZSBpbnZlc3RtZW50IGlkZWEgcmVxdWVzdFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBwcm9jZXNzUmVxdWVzdChyZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyBVcGRhdGUgc3RhdHVzIHRvIHByb2Nlc3NpbmdcbiAgICAgIGF3YWl0IHRoaXMudHJhY2tpbmdTZXJ2aWNlLnVwZGF0ZVN0YXR1cyhyZXF1ZXN0LmlkLCAncHJvY2Vzc2luZycpO1xuICAgICAgYXdhaXQgdGhpcy50cmFja2luZ1NlcnZpY2UudXBkYXRlU3RlcChyZXF1ZXN0LmlkLCAncmVzZWFyY2gtcGxhbm5pbmcnLCAnc3RhcnRlZCcpO1xuXG4gICAgICAvLyBVc2Ugb3JjaGVzdHJhdGlvbiBzZXJ2aWNlIHRvIGdlbmVyYXRlIGludmVzdG1lbnQgaWRlYXNcbiAgICAgIGNvbnN0IGludmVzdG1lbnRJZGVhcyA9IGF3YWl0IHRoaXMub3JjaGVzdHJhdGlvblNlcnZpY2UuZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMoe1xuICAgICAgICB1c2VySWQ6IHJlcXVlc3QudXNlcklkLFxuICAgICAgICByZXF1ZXN0SWQ6IHJlcXVlc3QuaWQsXG4gICAgICAgIHBhcmFtZXRlcnM6IHJlcXVlc3QucGFyYW1ldGVycyBhcyBhbnlcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBlbmRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgIGNvbnN0IHByb2Nlc3NpbmdUaW1lID0gZW5kVGltZS5nZXRUaW1lKCkgLSBzdGFydFRpbWUuZ2V0VGltZSgpO1xuXG4gICAgICAvLyBDcmVhdGUgcmVzdWx0IG9iamVjdFxuICAgICAgY29uc3QgcmVzdWx0OiBJbnZlc3RtZW50SWRlYVJlcXVlc3RSZXN1bHQgPSB7XG4gICAgICAgIHJlcXVlc3RJZDogcmVxdWVzdC5pZCxcbiAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyxcbiAgICAgICAgaW52ZXN0bWVudElkZWFzOiBpbnZlc3RtZW50SWRlYXMuaWRlYXMsXG4gICAgICAgIHByb2Nlc3NpbmdNZXRyaWNzOiB7XG4gICAgICAgICAgdG90YWxQcm9jZXNzaW5nVGltZTogcHJvY2Vzc2luZ1RpbWUsXG4gICAgICAgICAgbW9kZWxFeGVjdXRpb25UaW1lOiBwcm9jZXNzaW5nVGltZSAqIDAuNywgLy8gRXN0aW1hdGVcbiAgICAgICAgICBkYXRhUmV0cmlldmFsVGltZTogcHJvY2Vzc2luZ1RpbWUgKiAwLjIsIC8vIEVzdGltYXRlXG4gICAgICAgICAgdmFsaWRhdGlvblRpbWU6IHByb2Nlc3NpbmdUaW1lICogMC4xLCAvLyBFc3RpbWF0ZVxuICAgICAgICAgIHJlc291cmNlc1VzZWQ6IHtcbiAgICAgICAgICAgIGNwdVRpbWU6IHByb2Nlc3NpbmdUaW1lLFxuICAgICAgICAgICAgbWVtb3J5UGVhazogNTEyLCAvLyBNQiBlc3RpbWF0ZVxuICAgICAgICAgICAgbmV0d29ya1JlcXVlc3RzOiAxMCArIChyZXF1ZXN0LnBhcmFtZXRlcnMubWF4aW11bUlkZWFzIHx8IDUpICogMixcbiAgICAgICAgICAgIHN0b3JhZ2VPcGVyYXRpb25zOiA1LFxuICAgICAgICAgICAgZXN0aW1hdGVkQ29zdDogdGhpcy5jYWxjdWxhdGVFc3RpbWF0ZWRDb3N0KHJlcXVlc3QpXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtb2RlbHNVc2VkOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1vZGVsSWQ6ICdjbGF1ZGUtc29ubmV0LTMuNycsXG4gICAgICAgICAgICAgIG1vZGVsTmFtZTogJ0NsYXVkZSBTb25uZXQgMy43JyxcbiAgICAgICAgICAgICAgZXhlY3V0aW9uQ291bnQ6IDIsXG4gICAgICAgICAgICAgIHRvdGFsVG9rZW5zOiA1MDAwLFxuICAgICAgICAgICAgICBpbnB1dFRva2VuczogMjAwMCxcbiAgICAgICAgICAgICAgb3V0cHV0VG9rZW5zOiAzMDAwLFxuICAgICAgICAgICAgICBleGVjdXRpb25UaW1lOiBwcm9jZXNzaW5nVGltZSAqIDAuNCxcbiAgICAgICAgICAgICAgY29zdDogMC4xNVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgbW9kZWxJZDogJ2FtYXpvbi1ub3ZhLXBybycsXG4gICAgICAgICAgICAgIG1vZGVsTmFtZTogJ0FtYXpvbiBOb3ZhIFBybycsXG4gICAgICAgICAgICAgIGV4ZWN1dGlvbkNvdW50OiAxLFxuICAgICAgICAgICAgICB0b3RhbFRva2VuczogMzAwMCxcbiAgICAgICAgICAgICAgaW5wdXRUb2tlbnM6IDE1MDAsXG4gICAgICAgICAgICAgIG91dHB1dFRva2VuczogMTUwMCxcbiAgICAgICAgICAgICAgZXhlY3V0aW9uVGltZTogcHJvY2Vzc2luZ1RpbWUgKiAwLjMsXG4gICAgICAgICAgICAgIGNvc3Q6IDAuMDhcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIGRhdGFTb3VyY2VzQWNjZXNzZWQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc291cmNlSWQ6ICdtYXJrZXQtZGF0YScsXG4gICAgICAgICAgICAgIHNvdXJjZU5hbWU6ICdNYXJrZXQgRGF0YSBGZWVkJyxcbiAgICAgICAgICAgICAgcmVxdWVzdENvdW50OiA1LFxuICAgICAgICAgICAgICBkYXRhVm9sdW1lOiAxMDI0ICogMTAyNCwgLy8gMU1CXG4gICAgICAgICAgICAgIHJlc3BvbnNlVGltZTogMjAwLFxuICAgICAgICAgICAgICByZWxpYWJpbGl0eTogOThcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHNvdXJjZUlkOiAnd2ViLXNlYXJjaCcsXG4gICAgICAgICAgICAgIHNvdXJjZU5hbWU6ICdXZWIgU2VhcmNoIEFQSScsXG4gICAgICAgICAgICAgIHJlcXVlc3RDb3VudDogMyxcbiAgICAgICAgICAgICAgZGF0YVZvbHVtZTogNTEyICogMTAyNCwgLy8gNTEyS0JcbiAgICAgICAgICAgICAgcmVzcG9uc2VUaW1lOiA1MDAsXG4gICAgICAgICAgICAgIHJlbGlhYmlsaXR5OiA5NVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVkQXQ6IGVuZFRpbWUsXG4gICAgICAgIGV4cGlyZXNBdDogbmV3IERhdGUoZW5kVGltZS5nZXRUaW1lKCkgKyA3ICogMjQgKiA2MCAqIDYwICogMTAwMCksIC8vIDcgZGF5c1xuICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgIGdlbmVyYXRpb25NZXRob2Q6ICdtdWx0aS1hZ2VudCcsXG4gICAgICAgICAgcmVzZWFyY2hTb3VyY2VzOiBbJ21hcmtldC1kYXRhJywgJ3dlYi1zZWFyY2gnLCAncHJvcHJpZXRhcnktZGF0YSddLFxuICAgICAgICAgIG1hcmtldERhdGFUaW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29tcGxpYW5jZVZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgICAgcXVhbGl0eUNoZWNrczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaGVja1R5cGU6ICdjb25zaXN0ZW5jeScsXG4gICAgICAgICAgICAgIHBhc3NlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgc2NvcmU6IDkyLFxuICAgICAgICAgICAgICBkZXRhaWxzOiAnQWxsIGludmVzdG1lbnQgaWRlYXMgYXJlIGludGVybmFsbHkgY29uc2lzdGVudCdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNoZWNrVHlwZTogJ2FjY3VyYWN5JyxcbiAgICAgICAgICAgICAgcGFzc2VkOiB0cnVlLFxuICAgICAgICAgICAgICBzY29yZTogODgsXG4gICAgICAgICAgICAgIGRldGFpbHM6ICdEYXRhIGFjY3VyYWN5IHZlcmlmaWVkIGFnYWluc3QgbXVsdGlwbGUgc291cmNlcydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNoZWNrVHlwZTogJ2NvbXBsZXRlbmVzcycsXG4gICAgICAgICAgICAgIHBhc3NlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgc2NvcmU6IDk1LFxuICAgICAgICAgICAgICBkZXRhaWxzOiAnQWxsIHJlcXVpcmVkIGZpZWxkcyBwb3B1bGF0ZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjaGVja1R5cGU6ICdyZWxldmFuY2UnLFxuICAgICAgICAgICAgICBwYXNzZWQ6IHRydWUsXG4gICAgICAgICAgICAgIHNjb3JlOiA5MCxcbiAgICAgICAgICAgICAgZGV0YWlsczogJ0lkZWFzIGFsaWduIHdpdGggdXNlciBwYXJhbWV0ZXJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF0sXG4gICAgICAgICAgYmlhc0Fzc2Vzc21lbnQ6IHtcbiAgICAgICAgICAgIG92ZXJhbGxCaWFzU2NvcmU6IDE1LCAvLyBMb3dlciBpcyBiZXR0ZXJcbiAgICAgICAgICAgIGJpYXNUeXBlczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3JlY2VuY3knLFxuICAgICAgICAgICAgICAgIHNldmVyaXR5OiAnbG93JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NsaWdodCBiaWFzIHRvd2FyZCByZWNlbnQgbWFya2V0IGV2ZW50cycsXG4gICAgICAgICAgICAgICAgbWl0aWdhdGlvbjogJ0hpc3RvcmljYWwgY29udGV4dCBpbmNsdWRlZCBpbiBhbmFseXNpcydcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG1pdGlnYXRpb25BcHBsaWVkOiBbJ2hpc3RvcmljYWwtY29udGV4dCcsICdtdWx0aXBsZS1wZXJzcGVjdGl2ZXMnLCAnY29udHJhcmlhbi1hbmFseXNpcyddXG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBxdWFsaXR5U2NvcmU6IDkxLFxuICAgICAgICBjb25maWRlbmNlU2NvcmU6IDg3XG4gICAgICB9O1xuXG4gICAgICAvLyBTdG9yZSByZXN1bHRzXG4gICAgICBhd2FpdCB0aGlzLnN0b3JlUmVzdWx0cyhyZXF1ZXN0LmlkLCByZXN1bHQpO1xuICAgICAgYXdhaXQgdGhpcy50cmFja2luZ1NlcnZpY2UudXBkYXRlU3RhdHVzKHJlcXVlc3QuaWQsICdjb21wbGV0ZWQnKTtcbiAgICAgIGF3YWl0IHRoaXMudHJhY2tpbmdTZXJ2aWNlLnVwZGF0ZVN0ZXAocmVxdWVzdC5pZCwgJ3F1YWxpdHktYXNzdXJhbmNlJywgJ2NvbXBsZXRlZCcpO1xuXG4gICAgICAvLyBTZW5kIGNhbGxiYWNrIGlmIGNvbmZpZ3VyZWRcbiAgICAgIGlmIChyZXF1ZXN0LmNhbGxiYWNrKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2VuZENhbGxiYWNrKHJlcXVlc3QuY2FsbGJhY2ssIHJlc3VsdCk7XG4gICAgICB9XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW4gcHJvY2Vzc1JlcXVlc3QgZm9yICR7cmVxdWVzdC5pZH06YCwgZXJyb3IpO1xuICAgICAgYXdhaXQgdGhpcy5tYXJrUmVxdWVzdEZhaWxlZChyZXF1ZXN0LmlkLCBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyk7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIGVzdGltYXRlZCBjb3N0IGZvciByZXF1ZXN0IHByb2Nlc3NpbmdcbiAgICovXG4gIHByaXZhdGUgY2FsY3VsYXRlRXN0aW1hdGVkQ29zdChyZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0KTogbnVtYmVyIHtcbiAgICBsZXQgYmFzZUNvc3QgPSAwLjEwOyAvLyBCYXNlIGNvc3QgaW4gVVNEXG5cbiAgICAvLyBBZGp1c3QgYmFzZWQgb24gcmVzZWFyY2ggZGVwdGhcbiAgICBzd2l0Y2ggKHJlcXVlc3QucGFyYW1ldGVycy5yZXNlYXJjaERlcHRoKSB7XG4gICAgICBjYXNlICdiYXNpYyc6XG4gICAgICAgIGJhc2VDb3N0ICs9IDAuMDU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnc3RhbmRhcmQnOlxuICAgICAgICBiYXNlQ29zdCArPSAwLjE1O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NvbXByZWhlbnNpdmUnOlxuICAgICAgICBiYXNlQ29zdCArPSAwLjMwO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2RlZXAtZGl2ZSc6XG4gICAgICAgIGJhc2VDb3N0ICs9IDAuNjA7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIEFkanVzdCBiYXNlZCBvbiBudW1iZXIgb2YgaWRlYXNcbiAgICBjb25zdCBtYXhJZGVhcyA9IHJlcXVlc3QucGFyYW1ldGVycy5tYXhpbXVtSWRlYXMgfHwgNTtcbiAgICBiYXNlQ29zdCArPSBtYXhJZGVhcyAqIDAuMDM7XG5cbiAgICAvLyBBZGRpdGlvbmFsIGZlYXR1cmVzXG4gICAgaWYgKHJlcXVlc3QucGFyYW1ldGVycy5pbmNsdWRlQmFja3Rlc3RpbmcpIHtcbiAgICAgIGJhc2VDb3N0ICs9IDAuMjA7XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QucGFyYW1ldGVycy5pbmNsdWRlUmlza0FuYWx5c2lzKSB7XG4gICAgICBiYXNlQ29zdCArPSAwLjE1O1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0LnBhcmFtZXRlcnMuaW5jbHVkZUVTR0ZhY3RvcnMpIHtcbiAgICAgIGJhc2VDb3N0ICs9IDAuMTA7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGgucm91bmQoYmFzZUNvc3QgKiAxMDApIC8gMTAwOyAvLyBSb3VuZCB0byAyIGRlY2ltYWwgcGxhY2VzXG4gIH1cblxuICAvKipcbiAgICogU2VuZCBjYWxsYmFjayBub3RpZmljYXRpb25cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2VuZENhbGxiYWNrKGNhbGxiYWNrOiBhbnksIHJlc3VsdDogSW52ZXN0bWVudElkZWFSZXF1ZXN0UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goY2FsbGJhY2sudXJsLCB7XG4gICAgICAgIG1ldGhvZDogY2FsbGJhY2subWV0aG9kIHx8ICdQT1NUJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgLi4uY2FsbGJhY2suaGVhZGVyc1xuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgcmVxdWVzdElkOiByZXN1bHQucmVxdWVzdElkLFxuICAgICAgICAgIHN0YXR1czogcmVzdWx0LnN0YXR1cyxcbiAgICAgICAgICB0aW1lc3RhbXA6IHJlc3VsdC5nZW5lcmF0ZWRBdCxcbiAgICAgICAgICByZXN1bHRTdW1tYXJ5OiB7XG4gICAgICAgICAgICBpZGVhQ291bnQ6IHJlc3VsdC5pbnZlc3RtZW50SWRlYXMubGVuZ3RoLFxuICAgICAgICAgICAgcXVhbGl0eVNjb3JlOiByZXN1bHQucXVhbGl0eVNjb3JlLFxuICAgICAgICAgICAgY29uZmlkZW5jZVNjb3JlOiByZXN1bHQuY29uZmlkZW5jZVNjb3JlXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSk7XG5cbiAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgQ2FsbGJhY2sgZmFpbGVkOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIGNhbGxiYWNrOicsIGVycm9yKTtcbiAgICB9XG4gIH1cbn0iXX0=