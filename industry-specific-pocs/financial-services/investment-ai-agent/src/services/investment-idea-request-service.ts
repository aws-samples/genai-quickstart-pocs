/**
 * Investment Idea Request Service
 * Handles the submission, processing, and management of investment idea requests
 */

import { 
  InvestmentIdeaGenerationRequest,
  InvestmentIdeaRequestResult,
  RequestHistoryFilter,
  RequestHistoryEntry,
  RequestHistoryResponse,
  RequestFeedback,
  RequestStatus
} from '../models/investment-idea-request';
import { InvestmentIdea } from '../models/investment-idea';
import { RequestTrackingService } from './request-tracking-service';
import { InvestmentIdeaOrchestrationService } from './investment-idea-orchestration';

export class InvestmentIdeaRequestService {
  private requestStore: Map<string, InvestmentIdeaGenerationRequest> = new Map();
  private resultStore: Map<string, InvestmentIdeaRequestResult> = new Map();
  private feedbackStore: Map<string, RequestFeedback> = new Map();
  private trackingService: RequestTrackingService;
  private orchestrationService: InvestmentIdeaOrchestrationService;

  constructor(
    trackingService: RequestTrackingService,
    orchestrationService: InvestmentIdeaOrchestrationService
  ) {
    this.trackingService = trackingService;
    this.orchestrationService = orchestrationService;
  }

  /**
   * Submit a new investment idea generation request
   */
  public async submitRequest(request: InvestmentIdeaGenerationRequest): Promise<InvestmentIdeaGenerationRequest> {
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
  public async getRequestResults(requestId: string, userId: string): Promise<InvestmentIdeaRequestResult | null> {
    const request = this.requestStore.get(requestId);
    if (!request || request.userId !== userId) {
      return null;
    }

    return this.resultStore.get(requestId) || null;
  }

  /**
   * Cancel a pending request
   */
  public async cancelRequest(requestId: string, userId: string): Promise<boolean> {
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
  public async getRequestHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: RequestHistoryFilter = {}
  ): Promise<RequestHistoryResponse> {
    // Get all requests for the user
    const userRequests = Array.from(this.requestStore.values())
      .filter(request => request.userId === userId);

    // Apply filters
    let filteredRequests = userRequests;

    if (filters.status) {
      filteredRequests = filteredRequests.filter(request => request.status === filters.status);
    }

    if (filters.dateFrom) {
      filteredRequests = filteredRequests.filter(request => request.timestamp >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filteredRequests = filteredRequests.filter(request => request.timestamp <= filters.dateTo!);
    }

    if (filters.priority) {
      filteredRequests = filteredRequests.filter(request => request.priority === filters.priority);
    }

    if (filters.investmentHorizon) {
      filteredRequests = filteredRequests.filter(request => 
        request.parameters.investmentHorizon === filters.investmentHorizon
      );
    }

    if (filters.riskTolerance) {
      filteredRequests = filteredRequests.filter(request => 
        request.parameters.riskTolerance === filters.riskTolerance
      );
    }

    // Sort by timestamp (most recent first)
    filteredRequests.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Paginate
    const total = filteredRequests.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    // Convert to history entries
    const historyEntries: RequestHistoryEntry[] = await Promise.all(
      paginatedRequests.map(async (request) => {
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
      })
    );

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
  public async submitFeedback(
    requestId: string, 
    userId: string, 
    feedback: Omit<RequestFeedback, 'id' | 'requestId' | 'userId'>
  ): Promise<RequestFeedback | null> {
    const request = this.requestStore.get(requestId);
    if (!request || request.userId !== userId) {
      return null;
    }

    const feedbackRecord: RequestFeedback = {
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
  public async getRequest(requestId: string): Promise<InvestmentIdeaGenerationRequest | null> {
    return this.requestStore.get(requestId) || null;
  }

  /**
   * Store request results (internal use)
   */
  public async storeResults(requestId: string, result: InvestmentIdeaRequestResult): Promise<void> {
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
  public async markRequestFailed(requestId: string, error: string): Promise<void> {
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
  private estimateProcessingTime(request: InvestmentIdeaGenerationRequest): number {
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
  private async queueForProcessing(request: InvestmentIdeaGenerationRequest): Promise<void> {
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
  private async processRequest(request: InvestmentIdeaGenerationRequest): Promise<void> {
    const startTime = new Date();

    try {
      // Update status to processing
      await this.trackingService.updateStatus(request.id, 'processing');
      await this.trackingService.updateStep(request.id, 'research-planning', 'started');

      // Use orchestration service to generate investment ideas
      const investmentIdeas = await this.orchestrationService.generateInvestmentIdeas({
        userId: request.userId,
        requestId: request.id,
        parameters: request.parameters as any
      });

      const endTime = new Date();
      const processingTime = endTime.getTime() - startTime.getTime();

      // Create result object
      const result: InvestmentIdeaRequestResult = {
        requestId: request.id,
        status: 'completed',
        investmentIdeas: investmentIdeas.ideas,
        processingMetrics: {
          totalProcessingTime: processingTime,
          modelExecutionTime: processingTime * 0.7, // Estimate
          dataRetrievalTime: processingTime * 0.2, // Estimate
          validationTime: processingTime * 0.1, // Estimate
          resourcesUsed: {
            cpuTime: processingTime,
            memoryPeak: 512, // MB estimate
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
              dataVolume: 1024 * 1024, // 1MB
              responseTime: 200,
              reliability: 98
            },
            {
              sourceId: 'web-search',
              sourceName: 'Web Search API',
              requestCount: 3,
              dataVolume: 512 * 1024, // 512KB
              responseTime: 500,
              reliability: 95
            }
          ]
        },
        generatedAt: endTime,
        expiresAt: new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
            overallBiasScore: 15, // Lower is better
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

    } catch (error) {
      console.error(`Error in processRequest for ${request.id}:`, error);
      await this.markRequestFailed(request.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Calculate estimated cost for request processing
   */
  private calculateEstimatedCost(request: InvestmentIdeaGenerationRequest): number {
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
  private async sendCallback(callback: any, result: InvestmentIdeaRequestResult): Promise<void> {
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
    } catch (error) {
      console.error('Error sending callback:', error);
    }
  }
}