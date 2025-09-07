/**
 * Investment Idea Request Service
 * Handles the submission, processing, and management of investment idea requests
 */
import { InvestmentIdeaGenerationRequest, InvestmentIdeaRequestResult, RequestHistoryFilter, RequestHistoryResponse, RequestFeedback } from '../models/investment-idea-request';
import { RequestTrackingService } from './request-tracking-service';
import { InvestmentIdeaOrchestrationService } from './investment-idea-orchestration';
export declare class InvestmentIdeaRequestService {
    private requestStore;
    private resultStore;
    private feedbackStore;
    private trackingService;
    private orchestrationService;
    constructor(trackingService: RequestTrackingService, orchestrationService: InvestmentIdeaOrchestrationService);
    /**
     * Submit a new investment idea generation request
     */
    submitRequest(request: InvestmentIdeaGenerationRequest): Promise<InvestmentIdeaGenerationRequest>;
    /**
     * Get request results
     */
    getRequestResults(requestId: string, userId: string): Promise<InvestmentIdeaRequestResult | null>;
    /**
     * Cancel a pending request
     */
    cancelRequest(requestId: string, userId: string): Promise<boolean>;
    /**
     * Get request history for a user
     */
    getRequestHistory(userId: string, page?: number, limit?: number, filters?: RequestHistoryFilter): Promise<RequestHistoryResponse>;
    /**
     * Submit feedback for a request
     */
    submitFeedback(requestId: string, userId: string, feedback: Omit<RequestFeedback, 'id' | 'requestId' | 'userId'>): Promise<RequestFeedback | null>;
    /**
     * Get request by ID (internal use)
     */
    getRequest(requestId: string): Promise<InvestmentIdeaGenerationRequest | null>;
    /**
     * Store request results (internal use)
     */
    storeResults(requestId: string, result: InvestmentIdeaRequestResult): Promise<void>;
    /**
     * Mark request as failed (internal use)
     */
    markRequestFailed(requestId: string, error: string): Promise<void>;
    /**
     * Estimate processing time based on request parameters
     */
    private estimateProcessingTime;
    /**
     * Queue request for processing
     */
    private queueForProcessing;
    /**
     * Process the investment idea request
     */
    private processRequest;
    /**
     * Calculate estimated cost for request processing
     */
    private calculateEstimatedCost;
    /**
     * Send callback notification
     */
    private sendCallback;
}
