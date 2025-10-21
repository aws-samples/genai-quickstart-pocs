/**
 * Request Tracking Service
 * Tracks investment idea generation requests and their progress
 */

import { 
  RequestTracking, 
  RequestProgress, 
  ProcessingStep, 
  ProcessingPhase,
  ProcessingHistoryEntry,
  RequestError,
  RequestWarning,
  RequestStatus
} from '../models/investment-idea-request';

export class RequestTrackingService {
  private trackingData: Map<string, RequestTracking> = new Map();
  private readonly TRACKING_RETENTION_HOURS = 72; // Keep tracking data for 72 hours

  /**
   * Start tracking a new request
   */
  public async startTracking(requestId: string, userId?: string): Promise<void> {
    const tracking: RequestTracking = {
      requestId,
      userId: userId || '',
      status: 'submitted',
      progress: {
        percentage: 0,
        currentPhase: 'validation',
        completedSteps: [],
        totalSteps: 12, // Total number of processing steps
        startTime: new Date()
      },
      currentStep: 'parameter-validation',
      results: undefined,
      errors: [],
      warnings: [],
      lastUpdated: new Date(),
      processingHistory: [{
        step: 'parameter-validation',
        status: 'started',
        timestamp: new Date()
      }]
    };

    this.trackingData.set(requestId, tracking);
    
    // Schedule cleanup
    this.scheduleCleanup(requestId);
  }

  /**
   * Update request status
   */
  public async updateStatus(requestId: string, status: RequestStatus): Promise<void> {
    const tracking = this.trackingData.get(requestId);
    if (!tracking) {
      throw new Error(`Request tracking not found: ${requestId}`);
    }

    tracking.status = status;
    tracking.lastUpdated = new Date();

    // Update progress based on status
    switch (status) {
      case 'validated':
        tracking.progress.percentage = 10;
        tracking.progress.currentPhase = 'planning';
        break;
      case 'queued':
        tracking.progress.percentage = 15;
        break;
      case 'processing':
        tracking.progress.percentage = 20;
        tracking.progress.currentPhase = 'research';
        break;
      case 'completed':
        tracking.progress.percentage = 100;
        tracking.progress.currentPhase = 'finalization';
        tracking.progress.estimatedEndTime = new Date();
        break;
      case 'failed':
        tracking.progress.currentPhase = 'finalization';
        break;
      case 'cancelled':
        tracking.progress.currentPhase = 'finalization';
        break;
    }

    this.trackingData.set(requestId, tracking);
  }

  /**
   * Update current processing step
   */
  public async updateStep(
    requestId: string, 
    step: ProcessingStep, 
    status: 'started' | 'completed' | 'failed' | 'skipped',
    details?: string,
    agentId?: string,
    modelUsed?: string
  ): Promise<void> {
    const tracking = this.trackingData.get(requestId);
    if (!tracking) {
      throw new Error(`Request tracking not found: ${requestId}`);
    }

    const historyEntry: ProcessingHistoryEntry = {
      step,
      status,
      timestamp: new Date(),
      details,
      agentId,
      modelUsed
    };

    // Calculate duration if completing a step
    if (status === 'completed' || status === 'failed') {
      const startEntry = tracking.processingHistory
        .reverse()
        .find(entry => entry.step === step && entry.status === 'started');
      
      if (startEntry) {
        historyEntry.duration = new Date().getTime() - startEntry.timestamp.getTime();
      }
      
      tracking.processingHistory.reverse(); // Restore original order
    }

    tracking.processingHistory.push(historyEntry);
    tracking.currentStep = step;
    tracking.lastUpdated = new Date();

    // Update progress percentage and phase
    this.updateProgressFromStep(tracking, step, status);

    // Mark step as completed if successful
    if (status === 'completed' && !tracking.progress.completedSteps.includes(step)) {
      tracking.progress.completedSteps.push(step);
    }

    this.trackingData.set(requestId, tracking);
  }

  /**
   * Add error to tracking
   */
  public async addError(
    requestId: string, 
    error: Omit<RequestError, 'timestamp'>
  ): Promise<void> {
    const tracking = this.trackingData.get(requestId);
    if (!tracking) {
      throw new Error(`Request tracking not found: ${requestId}`);
    }

    const errorWithTimestamp: RequestError = {
      ...error,
      timestamp: new Date()
    };

    tracking.errors = tracking.errors || [];
    tracking.errors.push(errorWithTimestamp);
    tracking.lastUpdated = new Date();

    // Update status to failed if critical error
    if (error.severity === 'critical') {
      tracking.status = 'failed';
    }

    this.trackingData.set(requestId, tracking);
  }

  /**
   * Add warning to tracking
   */
  public async addWarning(
    requestId: string, 
    warning: Omit<RequestWarning, 'timestamp'>
  ): Promise<void> {
    const tracking = this.trackingData.get(requestId);
    if (!tracking) {
      throw new Error(`Request tracking not found: ${requestId}`);
    }

    const warningWithTimestamp: RequestWarning = {
      ...warning,
      timestamp: new Date()
    };

    tracking.warnings = tracking.warnings || [];
    tracking.warnings.push(warningWithTimestamp);
    tracking.lastUpdated = new Date();

    this.trackingData.set(requestId, tracking);
  }

  /**
   * Get request status for a user
   */
  public async getRequestStatus(requestId: string, userId: string): Promise<RequestTracking | null> {
    const tracking = this.trackingData.get(requestId);
    
    if (!tracking) {
      return null;
    }

    // Verify user has access to this request
    if (tracking.userId && tracking.userId !== userId) {
      return null;
    }

    // Calculate estimated time remaining
    if (tracking.status === 'processing' && tracking.progress.percentage > 0) {
      const elapsed = new Date().getTime() - tracking.progress.startTime.getTime();
      const estimatedTotal = (elapsed / tracking.progress.percentage) * 100;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      
      tracking.progress.estimatedEndTime = new Date(Date.now() + remaining);
    }

    return tracking;
  }

  /**
   * Set request results
   */
  public async setResults(requestId: string, results: any): Promise<void> {
    const tracking = this.trackingData.get(requestId);
    if (!tracking) {
      throw new Error(`Request tracking not found: ${requestId}`);
    }

    tracking.results = results;
    tracking.lastUpdated = new Date();
    
    this.trackingData.set(requestId, tracking);
  }

  /**
   * Get all active requests for monitoring
   */
  public async getActiveRequests(): Promise<RequestTracking[]> {
    const activeStatuses: RequestStatus[] = ['submitted', 'validated', 'queued', 'processing'];
    
    return Array.from(this.trackingData.values())
      .filter(tracking => activeStatuses.includes(tracking.status));
  }

  /**
   * Get request statistics
   */
  public async getRequestStatistics(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    processing: number;
    averageProcessingTime: number;
    errorRate: number;
  }> {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeframe) {
      case 'hour':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentRequests = Array.from(this.trackingData.values())
      .filter(tracking => tracking.progress.startTime >= cutoffTime);

    const total = recentRequests.length;
    const completed = recentRequests.filter(r => r.status === 'completed').length;
    const failed = recentRequests.filter(r => r.status === 'failed').length;
    const cancelled = recentRequests.filter(r => r.status === 'cancelled').length;
    const processing = recentRequests.filter(r => r.status === 'processing').length;

    // Calculate average processing time for completed requests
    const completedRequests = recentRequests.filter(r => 
      r.status === 'completed' && r.progress.estimatedEndTime
    );
    
    const totalProcessingTime = completedRequests.reduce((sum, request) => {
      const processingTime = request.progress.estimatedEndTime!.getTime() - 
                           request.progress.startTime.getTime();
      return sum + processingTime;
    }, 0);

    const averageProcessingTime = completedRequests.length > 0 
      ? totalProcessingTime / completedRequests.length 
      : 0;

    const errorRate = total > 0 ? (failed / total) * 100 : 0;

    return {
      total,
      completed,
      failed,
      cancelled,
      processing,
      averageProcessingTime,
      errorRate
    };
  }

  /**
   * Clean up old tracking data
   */
  public async cleanup(): Promise<void> {
    const cutoffTime = new Date(Date.now() - this.TRACKING_RETENTION_HOURS * 60 * 60 * 1000);
    
    for (const [requestId, tracking] of this.trackingData.entries()) {
      if (tracking.lastUpdated < cutoffTime) {
        this.trackingData.delete(requestId);
      }
    }
  }

  /**
   * Update progress based on current step
   */
  private updateProgressFromStep(
    tracking: RequestTracking, 
    step: ProcessingStep, 
    status: 'started' | 'completed' | 'failed' | 'skipped'
  ): void {
    if (status !== 'completed') return;

    const stepProgressMap: Record<ProcessingStep, { percentage: number; phase: ProcessingPhase }> = {
      'parameter-validation': { percentage: 10, phase: 'validation' },
      'user-authentication': { percentage: 15, phase: 'validation' },
      'request-queuing': { percentage: 20, phase: 'planning' },
      'research-planning': { percentage: 25, phase: 'planning' },
      'data-collection': { percentage: 35, phase: 'research' },
      'market-analysis': { percentage: 50, phase: 'analysis' },
      'idea-generation': { percentage: 65, phase: 'analysis' },
      'compliance-check': { percentage: 75, phase: 'compliance' },
      'risk-assessment': { percentage: 80, phase: 'compliance' },
      'result-synthesis': { percentage: 90, phase: 'synthesis' },
      'output-formatting': { percentage: 95, phase: 'synthesis' },
      'quality-assurance': { percentage: 100, phase: 'finalization' }
    };

    const stepInfo = stepProgressMap[step];
    if (stepInfo) {
      tracking.progress.percentage = stepInfo.percentage;
      tracking.progress.currentPhase = stepInfo.phase;
    }
  }

  /**
   * Schedule cleanup for a specific request
   */
  private scheduleCleanup(requestId: string): void {
    setTimeout(() => {
      const tracking = this.trackingData.get(requestId);
      if (tracking && ['completed', 'failed', 'cancelled'].includes(tracking.status)) {
        this.trackingData.delete(requestId);
      }
    }, this.TRACKING_RETENTION_HOURS * 60 * 60 * 1000);
  }
}