/**
 * Tests for Request Tracking Service
 */

import { RequestTrackingService } from '../request-tracking-service';
import { RequestStatus, ProcessingStep } from '../../models/investment-idea-request';

describe('RequestTrackingService', () => {
  let service: RequestTrackingService;

  beforeEach(() => {
    service = new RequestTrackingService();
  });

  describe('startTracking', () => {
    it('should start tracking a new request', async () => {
      await service.startTracking('test-request-1', 'user-123');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status).toBeDefined();
      expect(status?.requestId).toBe('test-request-1');
      expect(status?.userId).toBe('user-123');
      expect(status?.status).toBe('submitted');
      expect(status?.progress.percentage).toBe(0);
      expect(status?.progress.currentPhase).toBe('validation');
      expect(status?.currentStep).toBe('parameter-validation');
    });

    it('should initialize processing history', async () => {
      await service.startTracking('test-request-1', 'user-123');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.processingHistory).toHaveLength(1);
      expect(status?.processingHistory[0]).toMatchObject({
        step: 'parameter-validation',
        status: 'started'
      });
    });
  });

  describe('updateStatus', () => {
    beforeEach(async () => {
      await service.startTracking('test-request-1', 'user-123');
    });

    it('should update request status to validated', async () => {
      await service.updateStatus('test-request-1', 'validated');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.status).toBe('validated');
      expect(status?.progress.percentage).toBe(10);
      expect(status?.progress.currentPhase).toBe('planning');
    });

    it('should update request status to queued', async () => {
      await service.updateStatus('test-request-1', 'queued');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.status).toBe('queued');
      expect(status?.progress.percentage).toBe(15);
    });

    it('should update request status to processing', async () => {
      await service.updateStatus('test-request-1', 'processing');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.status).toBe('processing');
      expect(status?.progress.percentage).toBe(20);
      expect(status?.progress.currentPhase).toBe('research');
    });

    it('should update request status to completed', async () => {
      await service.updateStatus('test-request-1', 'completed');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.status).toBe('completed');
      expect(status?.progress.percentage).toBe(100);
      expect(status?.progress.currentPhase).toBe('finalization');
      expect(status?.progress.estimatedEndTime).toBeDefined();
    });

    it('should throw error for non-existent request', async () => {
      await expect(service.updateStatus('non-existent', 'completed'))
        .rejects.toThrow('Request tracking not found: non-existent');
    });
  });

  describe('updateStep', () => {
    beforeEach(async () => {
      await service.startTracking('test-request-1', 'user-123');
    });

    it('should update processing step', async () => {
      await service.updateStep('test-request-1', 'data-collection', 'started', 'Starting data collection');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.currentStep).toBe('data-collection');
      expect(status?.processingHistory).toHaveLength(2);
      expect(status?.processingHistory[1]).toMatchObject({
        step: 'data-collection',
        status: 'started',
        details: 'Starting data collection'
      });
    });

    it('should calculate duration when completing a step', async () => {
      await service.updateStep('test-request-1', 'data-collection', 'started');
      
      // Wait a small amount to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await service.updateStep('test-request-1', 'data-collection', 'completed');

      const status = await service.getRequestStatus('test-request-1', 'user-123');
      const completedEntry = status?.processingHistory.find(
        entry => entry.step === 'data-collection' && entry.status === 'completed'
      );

      expect(completedEntry?.duration).toBeGreaterThan(0);
    });

    it('should update progress based on completed steps', async () => {
      await service.updateStep('test-request-1', 'parameter-validation', 'completed');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.progress.percentage).toBe(10);
      expect(status?.progress.currentPhase).toBe('validation');
      expect(status?.progress.completedSteps).toContain('parameter-validation');
    });

    it('should update progress for market analysis step', async () => {
      await service.updateStep('test-request-1', 'market-analysis', 'completed');

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.progress.percentage).toBe(50);
      expect(status?.progress.currentPhase).toBe('analysis');
    });

    it('should include agent and model information', async () => {
      await service.updateStep(
        'test-request-1', 
        'idea-generation', 
        'completed',
        'Generated 5 investment ideas',
        'analysis-agent',
        'claude-sonnet-3.7'
      );

      const status = await service.getRequestStatus('test-request-1', 'user-123');
      const entry = status?.processingHistory.find(
        entry => entry.step === 'idea-generation' && entry.status === 'completed'
      );

      expect(entry?.agentId).toBe('analysis-agent');
      expect(entry?.modelUsed).toBe('claude-sonnet-3.7');
    });
  });

  describe('addError', () => {
    beforeEach(async () => {
      await service.startTracking('test-request-1', 'user-123');
    });

    it('should add error to tracking', async () => {
      await service.addError('test-request-1', {
        code: 'DATA_FETCH_ERROR',
        message: 'Failed to fetch market data',
        severity: 'medium',
        step: 'data-collection',
        recoverable: true
      });

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.errors).toHaveLength(1);
      expect(status?.errors?.[0]).toMatchObject({
        code: 'DATA_FETCH_ERROR',
        message: 'Failed to fetch market data',
        severity: 'medium',
        step: 'data-collection',
        recoverable: true
      });
      expect(status?.errors?.[0].timestamp).toBeDefined();
    });

    it('should mark request as failed for critical errors', async () => {
      await service.addError('test-request-1', {
        code: 'CRITICAL_ERROR',
        message: 'System failure',
        severity: 'critical',
        step: 'idea-generation',
        recoverable: false
      });

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.status).toBe('failed');
    });

    it('should not change status for non-critical errors', async () => {
      await service.updateStatus('test-request-1', 'processing');
      
      await service.addError('test-request-1', {
        code: 'WARNING_ERROR',
        message: 'Minor issue',
        severity: 'low',
        step: 'data-collection',
        recoverable: true
      });

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.status).toBe('processing');
    });
  });

  describe('addWarning', () => {
    beforeEach(async () => {
      await service.startTracking('test-request-1', 'user-123');
    });

    it('should add warning to tracking', async () => {
      await service.addWarning('test-request-1', {
        code: 'DATA_QUALITY_WARNING',
        message: 'Some data sources are stale',
        step: 'data-collection',
        recommendation: 'Consider using alternative data sources'
      });

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.warnings).toHaveLength(1);
      expect(status?.warnings?.[0]).toMatchObject({
        code: 'DATA_QUALITY_WARNING',
        message: 'Some data sources are stale',
        step: 'data-collection',
        recommendation: 'Consider using alternative data sources'
      });
      expect(status?.warnings?.[0].timestamp).toBeDefined();
    });
  });

  describe('getRequestStatus', () => {
    beforeEach(async () => {
      await service.startTracking('test-request-1', 'user-123');
    });

    it('should return status for valid request and user', async () => {
      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status).toBeDefined();
      expect(status?.requestId).toBe('test-request-1');
      expect(status?.userId).toBe('user-123');
    });

    it('should return null for non-existent request', async () => {
      const status = await service.getRequestStatus('non-existent', 'user-123');

      expect(status).toBeNull();
    });

    it('should return null for wrong user', async () => {
      const status = await service.getRequestStatus('test-request-1', 'different-user');

      expect(status).toBeNull();
    });

    it('should calculate estimated time remaining for processing requests', async () => {
      await service.updateStatus('test-request-1', 'processing');
      
      // Simulate some progress
      await service.updateStep('test-request-1', 'data-collection', 'completed');
      
      const status = await service.getRequestStatus('test-request-1', 'user-123');

      if (status && status.progress.percentage > 0) {
        expect(status.progress.estimatedEndTime).toBeDefined();
      }
    });
  });

  describe('setResults', () => {
    beforeEach(async () => {
      await service.startTracking('test-request-1', 'user-123');
    });

    it('should set results for request', async () => {
      const mockResults = {
        investmentIdeas: [],
        processingMetrics: {},
        qualityScore: 85
      };

      await service.setResults('test-request-1', mockResults);

      const status = await service.getRequestStatus('test-request-1', 'user-123');

      expect(status?.results).toEqual(mockResults);
    });
  });

  describe('getActiveRequests', () => {
    it('should return active requests only', async () => {
      await service.startTracking('request-1', 'user-123');
      await service.startTracking('request-2', 'user-456');
      await service.startTracking('request-3', 'user-789');

      await service.updateStatus('request-1', 'processing');
      await service.updateStatus('request-2', 'completed');
      await service.updateStatus('request-3', 'failed');

      const activeRequests = await service.getActiveRequests();

      expect(activeRequests).toHaveLength(1);
      expect(activeRequests[0].requestId).toBe('request-1');
      expect(activeRequests[0].status).toBe('processing');
    });
  });

  describe('getRequestStatistics', () => {
    beforeEach(async () => {
      // Create test requests with different statuses
      await service.startTracking('request-1', 'user-123');
      await service.startTracking('request-2', 'user-123');
      await service.startTracking('request-3', 'user-123');
      await service.startTracking('request-4', 'user-123');

      await service.updateStatus('request-1', 'completed');
      await service.updateStatus('request-2', 'failed');
      await service.updateStatus('request-3', 'cancelled');
      await service.updateStatus('request-4', 'processing');
    });

    it('should return request statistics', async () => {
      const stats = await service.getRequestStatistics('day');

      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.errorRate).toBe(25); // 1 failed out of 4 total
    });

    it('should calculate average processing time for completed requests', async () => {
      // Mock completion times
      const request1Status = await service.getRequestStatus('request-1', 'user-123');
      if (request1Status) {
        request1Status.progress.estimatedEndTime = new Date(
          request1Status.progress.startTime.getTime() + 30000
        );
      }

      const stats = await service.getRequestStatistics('day');

      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should remove old tracking data', async () => {
      await service.startTracking('old-request', 'user-123');
      
      // Manually set old timestamp (simulate old data)
      const status = await service.getRequestStatus('old-request', 'user-123');
      if (status) {
        status.lastUpdated = new Date(Date.now() - 73 * 60 * 60 * 1000); // 73 hours ago
      }

      await service.cleanup();

      const statusAfterCleanup = await service.getRequestStatus('old-request', 'user-123');
      expect(statusAfterCleanup).toBeNull();
    });

    it('should keep recent tracking data', async () => {
      await service.startTracking('recent-request', 'user-123');

      await service.cleanup();

      const status = await service.getRequestStatus('recent-request', 'user-123');
      expect(status).toBeDefined();
    });
  });
});