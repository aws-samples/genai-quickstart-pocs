/**
 * Request Tracking Service
 * Tracks investment idea generation requests and their progress
 */
import { RequestTracking, ProcessingStep, RequestError, RequestWarning, RequestStatus } from '../models/investment-idea-request';
export declare class RequestTrackingService {
    private trackingData;
    private readonly TRACKING_RETENTION_HOURS;
    /**
     * Start tracking a new request
     */
    startTracking(requestId: string, userId?: string): Promise<void>;
    /**
     * Update request status
     */
    updateStatus(requestId: string, status: RequestStatus): Promise<void>;
    /**
     * Update current processing step
     */
    updateStep(requestId: string, step: ProcessingStep, status: 'started' | 'completed' | 'failed' | 'skipped', details?: string, agentId?: string, modelUsed?: string): Promise<void>;
    /**
     * Add error to tracking
     */
    addError(requestId: string, error: Omit<RequestError, 'timestamp'>): Promise<void>;
    /**
     * Add warning to tracking
     */
    addWarning(requestId: string, warning: Omit<RequestWarning, 'timestamp'>): Promise<void>;
    /**
     * Get request status for a user
     */
    getRequestStatus(requestId: string, userId: string): Promise<RequestTracking | null>;
    /**
     * Set request results
     */
    setResults(requestId: string, results: any): Promise<void>;
    /**
     * Get all active requests for monitoring
     */
    getActiveRequests(): Promise<RequestTracking[]>;
    /**
     * Get request statistics
     */
    getRequestStatistics(timeframe?: 'hour' | 'day' | 'week'): Promise<{
        total: number;
        completed: number;
        failed: number;
        cancelled: number;
        processing: number;
        averageProcessingTime: number;
        errorRate: number;
    }>;
    /**
     * Clean up old tracking data
     */
    cleanup(): Promise<void>;
    /**
     * Update progress based on current step
     */
    private updateProgressFromStep;
    /**
     * Schedule cleanup for a specific request
     */
    private scheduleCleanup;
}
