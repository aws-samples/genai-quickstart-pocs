"use strict";
/**
 * Tests for Request Tracking Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const request_tracking_service_1 = require("../request-tracking-service");
describe('RequestTrackingService', () => {
    let service;
    beforeEach(() => {
        service = new request_tracking_service_1.RequestTrackingService();
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
            const completedEntry = status?.processingHistory.find(entry => entry.step === 'data-collection' && entry.status === 'completed');
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
            await service.updateStep('test-request-1', 'idea-generation', 'completed', 'Generated 5 investment ideas', 'analysis-agent', 'claude-sonnet-3.7');
            const status = await service.getRequestStatus('test-request-1', 'user-123');
            const entry = status?.processingHistory.find(entry => entry.step === 'idea-generation' && entry.status === 'completed');
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
                request1Status.progress.estimatedEndTime = new Date(request1Status.progress.startTime.getTime() + 30000);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdC10cmFja2luZy1zZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvX190ZXN0c19fL3JlcXVlc3QtdHJhY2tpbmctc2VydmljZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwwRUFBcUU7QUFHckUsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtJQUN0QyxJQUFJLE9BQStCLENBQUM7SUFFcEMsVUFBVSxDQUFDLEdBQUcsRUFBRTtRQUNkLE9BQU8sR0FBRyxJQUFJLGlEQUFzQixFQUFFLENBQUM7SUFDekMsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUM3QixFQUFFLENBQUMscUNBQXFDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkQsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTFELE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNwRCxNQUFNLE9BQU8sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFMUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFNUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO2dCQUNqRCxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixNQUFNLEVBQUUsU0FBUzthQUNsQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFDNUIsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ3BCLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6RCxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFMUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFNUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RCxNQUFNLE9BQU8sQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdkQsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFNUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFELE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUUzRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU1RSxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLE1BQU0sRUFBRSxRQUFRLENB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YSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV2RCxpREFBaUQ7WUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3pFLElBQUksTUFBTSxFQUFFO2dCQUNWLE1BQU0sQ0FBQyxXQUFXLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZTthQUNqRjtZQUVELE1BQU0sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXhCLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3JGLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGtDQUFrQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hELE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUUxRCxNQUFNLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUV4QixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgUmVxdWVzdCBUcmFja2luZyBTZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgUmVxdWVzdFRyYWNraW5nU2VydmljZSB9IGZyb20gJy4uL3JlcXVlc3QtdHJhY2tpbmctc2VydmljZSc7XG5pbXBvcnQgeyBSZXF1ZXN0U3RhdHVzLCBQcm9jZXNzaW5nU3RlcCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEtcmVxdWVzdCc7XG5cbmRlc2NyaWJlKCdSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlJywgKCkgPT4ge1xuICBsZXQgc2VydmljZTogUmVxdWVzdFRyYWNraW5nU2VydmljZTtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBzZXJ2aWNlID0gbmV3IFJlcXVlc3RUcmFja2luZ1NlcnZpY2UoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3N0YXJ0VHJhY2tpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzdGFydCB0cmFja2luZyBhIG5ldyByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5zdGFydFRyYWNraW5nKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGV4cGVjdChzdGF0dXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5yZXF1ZXN0SWQpLnRvQmUoJ3Rlc3QtcmVxdWVzdC0xJyk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy51c2VySWQpLnRvQmUoJ3VzZXItMTIzJyk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5zdGF0dXMpLnRvQmUoJ3N1Ym1pdHRlZCcpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvZ3Jlc3MucGVyY2VudGFnZSkudG9CZSgwKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2dyZXNzLmN1cnJlbnRQaGFzZSkudG9CZSgndmFsaWRhdGlvbicpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8uY3VycmVudFN0ZXApLnRvQmUoJ3BhcmFtZXRlci12YWxpZGF0aW9uJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGluaXRpYWxpemUgcHJvY2Vzc2luZyBoaXN0b3J5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5zdGFydFRyYWNraW5nKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2Nlc3NpbmdIaXN0b3J5KS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5wcm9jZXNzaW5nSGlzdG9yeVswXSkudG9NYXRjaE9iamVjdCh7XG4gICAgICAgIHN0ZXA6ICdwYXJhbWV0ZXItdmFsaWRhdGlvbicsXG4gICAgICAgIHN0YXR1czogJ3N0YXJ0ZWQnXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3VwZGF0ZVN0YXR1cycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3RhcnRUcmFja2luZygndGVzdC1yZXF1ZXN0LTEnLCAndXNlci0xMjMnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHJlcXVlc3Qgc3RhdHVzIHRvIHZhbGlkYXRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd2YWxpZGF0ZWQnKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5zdGF0dXMpLnRvQmUoJ3ZhbGlkYXRlZCcpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvZ3Jlc3MucGVyY2VudGFnZSkudG9CZSgxMCk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5wcm9ncmVzcy5jdXJyZW50UGhhc2UpLnRvQmUoJ3BsYW5uaW5nJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSByZXF1ZXN0IHN0YXR1cyB0byBxdWV1ZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnVwZGF0ZVN0YXR1cygndGVzdC1yZXF1ZXN0LTEnLCAncXVldWVkJyk7XG5cbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cygndGVzdC1yZXF1ZXN0LTEnLCAndXNlci0xMjMnKTtcblxuICAgICAgZXhwZWN0KHN0YXR1cz8uc3RhdHVzKS50b0JlKCdxdWV1ZWQnKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2dyZXNzLnBlcmNlbnRhZ2UpLnRvQmUoMTUpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgcmVxdWVzdCBzdGF0dXMgdG8gcHJvY2Vzc2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICdwcm9jZXNzaW5nJyk7XG5cbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cygndGVzdC1yZXF1ZXN0LTEnLCAndXNlci0xMjMnKTtcblxuICAgICAgZXhwZWN0KHN0YXR1cz8uc3RhdHVzKS50b0JlKCdwcm9jZXNzaW5nJyk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5wcm9ncmVzcy5wZXJjZW50YWdlKS50b0JlKDIwKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2dyZXNzLmN1cnJlbnRQaGFzZSkudG9CZSgncmVzZWFyY2gnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHJlcXVlc3Qgc3RhdHVzIHRvIGNvbXBsZXRlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICdjb21wbGV0ZWQnKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5zdGF0dXMpLnRvQmUoJ2NvbXBsZXRlZCcpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvZ3Jlc3MucGVyY2VudGFnZSkudG9CZSgxMDApO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvZ3Jlc3MuY3VycmVudFBoYXNlKS50b0JlKCdmaW5hbGl6YXRpb24nKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2dyZXNzLmVzdGltYXRlZEVuZFRpbWUpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBub24tZXhpc3RlbnQgcmVxdWVzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IGV4cGVjdChzZXJ2aWNlLnVwZGF0ZVN0YXR1cygnbm9uLWV4aXN0ZW50JywgJ2NvbXBsZXRlZCcpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdSZXF1ZXN0IHRyYWNraW5nIG5vdCBmb3VuZDogbm9uLWV4aXN0ZW50Jyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCd1cGRhdGVTdGVwJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5zdGFydFRyYWNraW5nKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgcHJvY2Vzc2luZyBzdGVwJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS51cGRhdGVTdGVwKCd0ZXN0LXJlcXVlc3QtMScsICdkYXRhLWNvbGxlY3Rpb24nLCAnc3RhcnRlZCcsICdTdGFydGluZyBkYXRhIGNvbGxlY3Rpb24nKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5jdXJyZW50U3RlcCkudG9CZSgnZGF0YS1jb2xsZWN0aW9uJyk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5wcm9jZXNzaW5nSGlzdG9yeSkudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvY2Vzc2luZ0hpc3RvcnlbMV0pLnRvTWF0Y2hPYmplY3Qoe1xuICAgICAgICBzdGVwOiAnZGF0YS1jb2xsZWN0aW9uJyxcbiAgICAgICAgc3RhdHVzOiAnc3RhcnRlZCcsXG4gICAgICAgIGRldGFpbHM6ICdTdGFydGluZyBkYXRhIGNvbGxlY3Rpb24nXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGR1cmF0aW9uIHdoZW4gY29tcGxldGluZyBhIHN0ZXAnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnVwZGF0ZVN0ZXAoJ3Rlc3QtcmVxdWVzdC0xJywgJ2RhdGEtY29sbGVjdGlvbicsICdzdGFydGVkJyk7XG4gICAgICBcbiAgICAgIC8vIFdhaXQgYSBzbWFsbCBhbW91bnQgdG8gZW5zdXJlIHRpbWUgZGlmZmVyZW5jZVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwKSk7XG4gICAgICBcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RlcCgndGVzdC1yZXF1ZXN0LTEnLCAnZGF0YS1jb2xsZWN0aW9uJywgJ2NvbXBsZXRlZCcpO1xuXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG4gICAgICBjb25zdCBjb21wbGV0ZWRFbnRyeSA9IHN0YXR1cz8ucHJvY2Vzc2luZ0hpc3RvcnkuZmluZChcbiAgICAgICAgZW50cnkgPT4gZW50cnkuc3RlcCA9PT0gJ2RhdGEtY29sbGVjdGlvbicgJiYgZW50cnkuc3RhdHVzID09PSAnY29tcGxldGVkJ1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KGNvbXBsZXRlZEVudHJ5Py5kdXJhdGlvbikudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgcHJvZ3Jlc3MgYmFzZWQgb24gY29tcGxldGVkIHN0ZXBzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS51cGRhdGVTdGVwKCd0ZXN0LXJlcXVlc3QtMScsICdwYXJhbWV0ZXItdmFsaWRhdGlvbicsICdjb21wbGV0ZWQnKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5wcm9ncmVzcy5wZXJjZW50YWdlKS50b0JlKDEwKTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2dyZXNzLmN1cnJlbnRQaGFzZSkudG9CZSgndmFsaWRhdGlvbicpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvZ3Jlc3MuY29tcGxldGVkU3RlcHMpLnRvQ29udGFpbigncGFyYW1ldGVyLXZhbGlkYXRpb24nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdXBkYXRlIHByb2dyZXNzIGZvciBtYXJrZXQgYW5hbHlzaXMgc3RlcCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RlcCgndGVzdC1yZXF1ZXN0LTEnLCAnbWFya2V0LWFuYWx5c2lzJywgJ2NvbXBsZXRlZCcpO1xuXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGV4cGVjdChzdGF0dXM/LnByb2dyZXNzLnBlcmNlbnRhZ2UpLnRvQmUoNTApO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucHJvZ3Jlc3MuY3VycmVudFBoYXNlKS50b0JlKCdhbmFseXNpcycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbmNsdWRlIGFnZW50IGFuZCBtb2RlbCBpbmZvcm1hdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RlcChcbiAgICAgICAgJ3Rlc3QtcmVxdWVzdC0xJywgXG4gICAgICAgICdpZGVhLWdlbmVyYXRpb24nLCBcbiAgICAgICAgJ2NvbXBsZXRlZCcsXG4gICAgICAgICdHZW5lcmF0ZWQgNSBpbnZlc3RtZW50IGlkZWFzJyxcbiAgICAgICAgJ2FuYWx5c2lzLWFnZW50JyxcbiAgICAgICAgJ2NsYXVkZS1zb25uZXQtMy43J1xuICAgICAgKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuICAgICAgY29uc3QgZW50cnkgPSBzdGF0dXM/LnByb2Nlc3NpbmdIaXN0b3J5LmZpbmQoXG4gICAgICAgIGVudHJ5ID0+IGVudHJ5LnN0ZXAgPT09ICdpZGVhLWdlbmVyYXRpb24nICYmIGVudHJ5LnN0YXR1cyA9PT0gJ2NvbXBsZXRlZCdcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChlbnRyeT8uYWdlbnRJZCkudG9CZSgnYW5hbHlzaXMtYWdlbnQnKTtcbiAgICAgIGV4cGVjdChlbnRyeT8ubW9kZWxVc2VkKS50b0JlKCdjbGF1ZGUtc29ubmV0LTMuNycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnYWRkRXJyb3InLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBlcnJvciB0byB0cmFja2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UuYWRkRXJyb3IoJ3Rlc3QtcmVxdWVzdC0xJywge1xuICAgICAgICBjb2RlOiAnREFUQV9GRVRDSF9FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZmV0Y2ggbWFya2V0IGRhdGEnLFxuICAgICAgICBzZXZlcml0eTogJ21lZGl1bScsXG4gICAgICAgIHN0ZXA6ICdkYXRhLWNvbGxlY3Rpb24nLFxuICAgICAgICByZWNvdmVyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cygndGVzdC1yZXF1ZXN0LTEnLCAndXNlci0xMjMnKTtcblxuICAgICAgZXhwZWN0KHN0YXR1cz8uZXJyb3JzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy5lcnJvcnM/LlswXSkudG9NYXRjaE9iamVjdCh7XG4gICAgICAgIGNvZGU6ICdEQVRBX0ZFVENIX0VSUk9SJyxcbiAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBmZXRjaCBtYXJrZXQgZGF0YScsXG4gICAgICAgIHNldmVyaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgc3RlcDogJ2RhdGEtY29sbGVjdGlvbicsXG4gICAgICAgIHJlY292ZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChzdGF0dXM/LmVycm9ycz8uWzBdLnRpbWVzdGFtcCkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbWFyayByZXF1ZXN0IGFzIGZhaWxlZCBmb3IgY3JpdGljYWwgZXJyb3JzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5hZGRFcnJvcigndGVzdC1yZXF1ZXN0LTEnLCB7XG4gICAgICAgIGNvZGU6ICdDUklUSUNBTF9FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICdTeXN0ZW0gZmFpbHVyZScsXG4gICAgICAgIHNldmVyaXR5OiAnY3JpdGljYWwnLFxuICAgICAgICBzdGVwOiAnaWRlYS1nZW5lcmF0aW9uJyxcbiAgICAgICAgcmVjb3ZlcmFibGU6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5zdGF0dXMpLnRvQmUoJ2ZhaWxlZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBub3QgY2hhbmdlIHN0YXR1cyBmb3Igbm9uLWNyaXRpY2FsIGVycm9ycycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICdwcm9jZXNzaW5nJyk7XG4gICAgICBcbiAgICAgIGF3YWl0IHNlcnZpY2UuYWRkRXJyb3IoJ3Rlc3QtcmVxdWVzdC0xJywge1xuICAgICAgICBjb2RlOiAnV0FSTklOR19FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICdNaW5vciBpc3N1ZScsXG4gICAgICAgIHNldmVyaXR5OiAnbG93JyxcbiAgICAgICAgc3RlcDogJ2RhdGEtY29sbGVjdGlvbicsXG4gICAgICAgIHJlY292ZXJhYmxlOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5zdGF0dXMpLnRvQmUoJ3Byb2Nlc3NpbmcnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2FkZFdhcm5pbmcnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCB3YXJuaW5nIHRvIHRyYWNraW5nJywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5hZGRXYXJuaW5nKCd0ZXN0LXJlcXVlc3QtMScsIHtcbiAgICAgICAgY29kZTogJ0RBVEFfUVVBTElUWV9XQVJOSU5HJyxcbiAgICAgICAgbWVzc2FnZTogJ1NvbWUgZGF0YSBzb3VyY2VzIGFyZSBzdGFsZScsXG4gICAgICAgIHN0ZXA6ICdkYXRhLWNvbGxlY3Rpb24nLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIHVzaW5nIGFsdGVybmF0aXZlIGRhdGEgc291cmNlcydcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGV4cGVjdChzdGF0dXM/Lndhcm5pbmdzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3Qoc3RhdHVzPy53YXJuaW5ncz8uWzBdKS50b01hdGNoT2JqZWN0KHtcbiAgICAgICAgY29kZTogJ0RBVEFfUVVBTElUWV9XQVJOSU5HJyxcbiAgICAgICAgbWVzc2FnZTogJ1NvbWUgZGF0YSBzb3VyY2VzIGFyZSBzdGFsZScsXG4gICAgICAgIHN0ZXA6ICdkYXRhLWNvbGxlY3Rpb24nLFxuICAgICAgICByZWNvbW1lbmRhdGlvbjogJ0NvbnNpZGVyIHVzaW5nIGFsdGVybmF0aXZlIGRhdGEgc291cmNlcydcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ud2FybmluZ3M/LlswXS50aW1lc3RhbXApLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRSZXF1ZXN0U3RhdHVzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5zdGFydFRyYWNraW5nKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gc3RhdHVzIGZvciB2YWxpZCByZXF1ZXN0IGFuZCB1c2VyJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8ucmVxdWVzdElkKS50b0JlKCd0ZXN0LXJlcXVlc3QtMScpO1xuICAgICAgZXhwZWN0KHN0YXR1cz8udXNlcklkKS50b0JlKCd1c2VyLTEyMycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCBmb3Igbm9uLWV4aXN0ZW50IHJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ25vbi1leGlzdGVudCcsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzKS50b0JlTnVsbCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCBmb3Igd3JvbmcgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cygndGVzdC1yZXF1ZXN0LTEnLCAnZGlmZmVyZW50LXVzZXInKTtcblxuICAgICAgZXhwZWN0KHN0YXR1cykudG9CZU51bGwoKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGVzdGltYXRlZCB0aW1lIHJlbWFpbmluZyBmb3IgcHJvY2Vzc2luZyByZXF1ZXN0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICdwcm9jZXNzaW5nJyk7XG4gICAgICBcbiAgICAgIC8vIFNpbXVsYXRlIHNvbWUgcHJvZ3Jlc3NcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RlcCgndGVzdC1yZXF1ZXN0LTEnLCAnZGF0YS1jb2xsZWN0aW9uJywgJ2NvbXBsZXRlZCcpO1xuICAgICAgXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGlmIChzdGF0dXMgJiYgc3RhdHVzLnByb2dyZXNzLnBlcmNlbnRhZ2UgPiAwKSB7XG4gICAgICAgIGV4cGVjdChzdGF0dXMucHJvZ3Jlc3MuZXN0aW1hdGVkRW5kVGltZSkudG9CZURlZmluZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NldFJlc3VsdHMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNldCByZXN1bHRzIGZvciByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja1Jlc3VsdHMgPSB7XG4gICAgICAgIGludmVzdG1lbnRJZGVhczogW10sXG4gICAgICAgIHByb2Nlc3NpbmdNZXRyaWNzOiB7fSxcbiAgICAgICAgcXVhbGl0eVNjb3JlOiA4NVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgc2VydmljZS5zZXRSZXN1bHRzKCd0ZXN0LXJlcXVlc3QtMScsIG1vY2tSZXN1bHRzKTtcblxuICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3Qoc3RhdHVzPy5yZXN1bHRzKS50b0VxdWFsKG1vY2tSZXN1bHRzKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldEFjdGl2ZVJlcXVlc3RzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIGFjdGl2ZSByZXF1ZXN0cyBvbmx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgc2VydmljZS5zdGFydFRyYWNraW5nKCdyZXF1ZXN0LTEnLCAndXNlci0xMjMnKTtcbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3RhcnRUcmFja2luZygncmVxdWVzdC0yJywgJ3VzZXItNDU2Jyk7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ3JlcXVlc3QtMycsICd1c2VyLTc4OScpO1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLnVwZGF0ZVN0YXR1cygncmVxdWVzdC0xJywgJ3Byb2Nlc3NpbmcnKTtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCdyZXF1ZXN0LTInLCAnY29tcGxldGVkJyk7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnVwZGF0ZVN0YXR1cygncmVxdWVzdC0zJywgJ2ZhaWxlZCcpO1xuXG4gICAgICBjb25zdCBhY3RpdmVSZXF1ZXN0cyA9IGF3YWl0IHNlcnZpY2UuZ2V0QWN0aXZlUmVxdWVzdHMoKTtcblxuICAgICAgZXhwZWN0KGFjdGl2ZVJlcXVlc3RzKS50b0hhdmVMZW5ndGgoMSk7XG4gICAgICBleHBlY3QoYWN0aXZlUmVxdWVzdHNbMF0ucmVxdWVzdElkKS50b0JlKCdyZXF1ZXN0LTEnKTtcbiAgICAgIGV4cGVjdChhY3RpdmVSZXF1ZXN0c1swXS5zdGF0dXMpLnRvQmUoJ3Byb2Nlc3NpbmcnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldFJlcXVlc3RTdGF0aXN0aWNzJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQ3JlYXRlIHRlc3QgcmVxdWVzdHMgd2l0aCBkaWZmZXJlbnQgc3RhdHVzZXNcbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3RhcnRUcmFja2luZygncmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ3JlcXVlc3QtMicsICd1c2VyLTEyMycpO1xuICAgICAgYXdhaXQgc2VydmljZS5zdGFydFRyYWNraW5nKCdyZXF1ZXN0LTMnLCAndXNlci0xMjMnKTtcbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3RhcnRUcmFja2luZygncmVxdWVzdC00JywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCdyZXF1ZXN0LTEnLCAnY29tcGxldGVkJyk7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnVwZGF0ZVN0YXR1cygncmVxdWVzdC0yJywgJ2ZhaWxlZCcpO1xuICAgICAgYXdhaXQgc2VydmljZS51cGRhdGVTdGF0dXMoJ3JlcXVlc3QtMycsICdjYW5jZWxsZWQnKTtcbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlU3RhdHVzKCdyZXF1ZXN0LTQnLCAncHJvY2Vzc2luZycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcmVxdWVzdCBzdGF0aXN0aWNzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0aXN0aWNzKCdkYXknKTtcblxuICAgICAgZXhwZWN0KHN0YXRzLnRvdGFsKS50b0JlKDQpO1xuICAgICAgZXhwZWN0KHN0YXRzLmNvbXBsZXRlZCkudG9CZSgxKTtcbiAgICAgIGV4cGVjdChzdGF0cy5mYWlsZWQpLnRvQmUoMSk7XG4gICAgICBleHBlY3Qoc3RhdHMuY2FuY2VsbGVkKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHN0YXRzLnByb2Nlc3NpbmcpLnRvQmUoMSk7XG4gICAgICBleHBlY3Qoc3RhdHMuZXJyb3JSYXRlKS50b0JlKDI1KTsgLy8gMSBmYWlsZWQgb3V0IG9mIDQgdG90YWxcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGF2ZXJhZ2UgcHJvY2Vzc2luZyB0aW1lIGZvciBjb21wbGV0ZWQgcmVxdWVzdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBNb2NrIGNvbXBsZXRpb24gdGltZXNcbiAgICAgIGNvbnN0IHJlcXVlc3QxU3RhdHVzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdHVzKCdyZXF1ZXN0LTEnLCAndXNlci0xMjMnKTtcbiAgICAgIGlmIChyZXF1ZXN0MVN0YXR1cykge1xuICAgICAgICByZXF1ZXN0MVN0YXR1cy5wcm9ncmVzcy5lc3RpbWF0ZWRFbmRUaW1lID0gbmV3IERhdGUoXG4gICAgICAgICAgcmVxdWVzdDFTdGF0dXMucHJvZ3Jlc3Muc3RhcnRUaW1lLmdldFRpbWUoKSArIDMwMDAwXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0U3RhdGlzdGljcygnZGF5Jyk7XG5cbiAgICAgIGV4cGVjdChzdGF0cy5hdmVyYWdlUHJvY2Vzc2luZ1RpbWUpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NsZWFudXAnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZW1vdmUgb2xkIHRyYWNraW5nIGRhdGEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ29sZC1yZXF1ZXN0JywgJ3VzZXItMTIzJyk7XG4gICAgICBcbiAgICAgIC8vIE1hbnVhbGx5IHNldCBvbGQgdGltZXN0YW1wIChzaW11bGF0ZSBvbGQgZGF0YSlcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cygnb2xkLXJlcXVlc3QnLCAndXNlci0xMjMnKTtcbiAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgc3RhdHVzLmxhc3RVcGRhdGVkID0gbmV3IERhdGUoRGF0ZS5ub3coKSAtIDczICogNjAgKiA2MCAqIDEwMDApOyAvLyA3MyBob3VycyBhZ29cbiAgICAgIH1cblxuICAgICAgYXdhaXQgc2VydmljZS5jbGVhbnVwKCk7XG5cbiAgICAgIGNvbnN0IHN0YXR1c0FmdGVyQ2xlYW51cCA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cygnb2xkLXJlcXVlc3QnLCAndXNlci0xMjMnKTtcbiAgICAgIGV4cGVjdChzdGF0dXNBZnRlckNsZWFudXApLnRvQmVOdWxsKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGtlZXAgcmVjZW50IHRyYWNraW5nIGRhdGEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnN0YXJ0VHJhY2tpbmcoJ3JlY2VudC1yZXF1ZXN0JywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGF3YWl0IHNlcnZpY2UuY2xlYW51cCgpO1xuXG4gICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RTdGF0dXMoJ3JlY2VudC1yZXF1ZXN0JywgJ3VzZXItMTIzJyk7XG4gICAgICBleHBlY3Qoc3RhdHVzKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==