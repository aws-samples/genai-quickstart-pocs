"use strict";
/**
 * Tests for Investment Idea Request Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const investment_idea_request_service_1 = require("../investment-idea-request-service");
const request_tracking_service_1 = require("../request-tracking-service");
// Mock dependencies
jest.mock('../request-tracking-service');
jest.mock('../investment-idea-orchestration');
describe('InvestmentIdeaRequestService', () => {
    let service;
    let mockTrackingService;
    let mockOrchestrationService;
    beforeEach(() => {
        mockTrackingService = new request_tracking_service_1.RequestTrackingService();
        mockOrchestrationService = {
            generateInvestmentIdeas: jest.fn(),
            getActiveRequestStatus: jest.fn(),
            cancelRequest: jest.fn(),
            getProcessingStatistics: jest.fn()
        };
        service = new investment_idea_request_service_1.InvestmentIdeaRequestService(mockTrackingService, mockOrchestrationService);
        // Setup default mocks
        mockTrackingService.updateStatus = jest.fn().mockResolvedValue(undefined);
        mockTrackingService.updateStep = jest.fn().mockResolvedValue(undefined);
        mockTrackingService.setResults = jest.fn().mockResolvedValue(undefined);
        mockTrackingService.addError = jest.fn().mockResolvedValue(undefined);
        mockOrchestrationService.generateInvestmentIdeas.mockResolvedValue({
            requestId: 'test-request',
            ideas: [],
            metadata: {
                totalIdeasGenerated: 0,
                totalIdeasFiltered: 0,
                filteringCriteria: [],
                confidenceDistribution: { high: 0, medium: 0, low: 0, average: 0 },
                processingSteps: []
            },
            processingMetrics: {
                totalProcessingTime: 1000,
                agentProcessingTimes: {},
                dataSourcesAccessed: [],
                modelsUsed: [],
                resourceUtilization: {}
            }
        });
        mockOrchestrationService.getActiveRequestStatus.mockReturnValue(undefined);
        mockOrchestrationService.cancelRequest.mockReturnValue(true);
        mockOrchestrationService.getProcessingStatistics.mockReturnValue({
            activeRequests: 0,
            totalProcessed: 0,
            averageProcessingTime: 0
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('submitRequest', () => {
        it('should submit a valid request successfully', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate',
                    maximumIdeas: 5
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const result = await service.submitRequest(request);
            expect(result).toBeDefined();
            expect(result.id).toBe('test-request-1');
            expect(result.estimatedProcessingTime).toBeGreaterThan(0);
            expect(mockTrackingService.updateStatus).toHaveBeenCalledWith('test-request-1', 'validated');
            expect(mockTrackingService.updateStep).toHaveBeenCalledWith('test-request-1', 'parameter-validation', 'completed');
        });
        it('should estimate processing time correctly based on parameters', async () => {
            const basicRequest = {
                id: 'basic-request',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'short-term',
                    riskTolerance: 'conservative',
                    researchDepth: 'basic',
                    maximumIdeas: 3
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const comprehensiveRequest = {
                id: 'comprehensive-request',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'long-term',
                    riskTolerance: 'aggressive',
                    researchDepth: 'comprehensive',
                    maximumIdeas: 10,
                    includeBacktesting: true,
                    includeRiskAnalysis: true,
                    includeESGFactors: true
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            const basicResult = await service.submitRequest(basicRequest);
            const comprehensiveResult = await service.submitRequest(comprehensiveRequest);
            expect(comprehensiveResult.estimatedProcessingTime || 0).toBeGreaterThan(basicResult.estimatedProcessingTime || 0);
        });
        it('should adjust processing time based on priority', async () => {
            const urgentRequest = {
                id: 'urgent-request',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate',
                    researchDepth: 'standard'
                },
                priority: 'urgent',
                timestamp: new Date(),
                status: 'submitted'
            };
            const lowRequest = {
                id: 'low-request',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate',
                    researchDepth: 'standard'
                },
                priority: 'low',
                timestamp: new Date(),
                status: 'submitted'
            };
            const urgentResult = await service.submitRequest(urgentRequest);
            const lowResult = await service.submitRequest(lowRequest);
            expect(urgentResult.estimatedProcessingTime || 0).toBeLessThan(lowResult.estimatedProcessingTime || 0);
        });
    });
    describe('getRequestResults', () => {
        it('should return results for valid request and user', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'completed'
            };
            await service.submitRequest(request);
            // Mock result storage
            const mockResult = {
                requestId: 'test-request-1',
                status: 'completed',
                investmentIdeas: [],
                processingMetrics: {
                    totalProcessingTime: 30000,
                    modelExecutionTime: 21000,
                    dataRetrievalTime: 6000,
                    validationTime: 3000,
                    resourcesUsed: {
                        cpuTime: 30000,
                        memoryPeak: 512,
                        networkRequests: 15,
                        storageOperations: 5,
                        estimatedCost: 0.25
                    },
                    modelsUsed: [],
                    dataSourcesAccessed: []
                },
                generatedAt: new Date(),
                metadata: {
                    generationMethod: 'multi-agent',
                    researchSources: [],
                    marketDataTimestamp: new Date(),
                    complianceVersion: '1.0.0',
                    qualityChecks: [],
                    biasAssessment: {
                        overallBiasScore: 15,
                        biasTypes: [],
                        mitigationApplied: []
                    }
                },
                qualityScore: 85,
                confidenceScore: 80
            };
            await service.storeResults('test-request-1', mockResult);
            const result = await service.getRequestResults('test-request-1', 'user-123');
            expect(result).toBeDefined();
            expect(result?.requestId).toBe('test-request-1');
            expect(result?.status).toBe('completed');
        });
        it('should return null for non-existent request', async () => {
            const result = await service.getRequestResults('non-existent', 'user-123');
            expect(result).toBeNull();
        });
        it('should return null for request belonging to different user', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'submitted'
            };
            await service.submitRequest(request);
            const result = await service.getRequestResults('test-request-1', 'different-user');
            expect(result).toBeNull();
        });
    });
    describe('cancelRequest', () => {
        it('should cancel a pending request successfully', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'queued'
            };
            await service.submitRequest(request);
            const cancelled = await service.cancelRequest('test-request-1', 'user-123');
            expect(cancelled).toBe(true);
            expect(mockTrackingService.updateStatus).toHaveBeenCalledWith('test-request-1', 'cancelled');
        });
        it('should not cancel a completed request', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'completed'
            };
            await service.submitRequest(request);
            const cancelled = await service.cancelRequest('test-request-1', 'user-123');
            expect(cancelled).toBe(false);
        });
        it('should not cancel request for different user', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'queued'
            };
            await service.submitRequest(request);
            const cancelled = await service.cancelRequest('test-request-1', 'different-user');
            expect(cancelled).toBe(false);
        });
    });
    describe('getRequestHistory', () => {
        beforeEach(async () => {
            // Create test requests
            const requests = [
                {
                    id: 'request-1',
                    userId: 'user-123',
                    parameters: {
                        investmentHorizon: 'short-term',
                        riskTolerance: 'conservative'
                    },
                    priority: 'high',
                    timestamp: new Date('2024-01-01'),
                    status: 'completed'
                },
                {
                    id: 'request-2',
                    userId: 'user-123',
                    parameters: {
                        investmentHorizon: 'medium-term',
                        riskTolerance: 'moderate'
                    },
                    priority: 'medium',
                    timestamp: new Date('2024-01-02'),
                    status: 'processing'
                },
                {
                    id: 'request-3',
                    userId: 'user-123',
                    parameters: {
                        investmentHorizon: 'long-term',
                        riskTolerance: 'aggressive'
                    },
                    priority: 'low',
                    timestamp: new Date('2024-01-03'),
                    status: 'failed'
                },
                {
                    id: 'request-4',
                    userId: 'different-user',
                    parameters: {
                        investmentHorizon: 'medium-term',
                        riskTolerance: 'moderate'
                    },
                    priority: 'medium',
                    timestamp: new Date('2024-01-04'),
                    status: 'completed'
                }
            ];
            for (const request of requests) {
                await service.submitRequest(request);
            }
        });
        it('should return user requests with pagination', async () => {
            const result = await service.getRequestHistory('user-123', 1, 2);
            expect(result.requests).toHaveLength(2);
            expect(result.total).toBe(3); // Only user-123 requests
            expect(result.page).toBe(1);
            expect(result.limit).toBe(2);
            // Should be sorted by timestamp descending
            expect(result.requests[0].submittedAt.getTime()).toBeGreaterThan(result.requests[1].submittedAt.getTime());
        });
        it('should filter by status', async () => {
            const filters = { status: 'completed' };
            const result = await service.getRequestHistory('user-123', 1, 10, filters);
            expect(result.requests).toHaveLength(1);
            expect(result.requests[0].status).toBe('completed');
        });
        it('should filter by date range', async () => {
            const filters = {
                dateFrom: new Date('2024-01-02'),
                dateTo: new Date('2024-01-03')
            };
            const result = await service.getRequestHistory('user-123', 1, 10, filters);
            expect(result.requests).toHaveLength(2);
            expect(result.requests.every(r => r.submittedAt >= filters.dateFrom && r.submittedAt <= filters.dateTo)).toBe(true);
        });
        it('should filter by priority', async () => {
            const filters = { priority: 'high' };
            const result = await service.getRequestHistory('user-123', 1, 10, filters);
            expect(result.requests).toHaveLength(1);
            expect(result.requests[0].priority).toBe('high');
        });
        it('should filter by investment horizon', async () => {
            const filters = { investmentHorizon: 'medium-term' };
            const result = await service.getRequestHistory('user-123', 1, 10, filters);
            expect(result.requests).toHaveLength(1);
            expect(result.requests[0].parameters.investmentHorizon).toBe('medium-term');
        });
        it('should filter by risk tolerance', async () => {
            const filters = { riskTolerance: 'aggressive' };
            const result = await service.getRequestHistory('user-123', 1, 10, filters);
            expect(result.requests).toHaveLength(1);
            expect(result.requests[0].parameters.riskTolerance).toBe('aggressive');
        });
    });
    describe('submitFeedback', () => {
        it('should submit feedback for valid request', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'completed'
            };
            await service.submitRequest(request);
            const feedback = await service.submitFeedback('test-request-1', 'user-123', {
                rating: 4,
                comments: 'Great investment ideas!',
                usefulnessScore: 5,
                accuracyScore: 4,
                insightScore: 4,
                actionTaken: 'implemented',
                timestamp: new Date()
            });
            expect(feedback).toBeDefined();
            expect(feedback?.rating).toBe(4);
            expect(feedback?.comments).toBe('Great investment ideas!');
            expect(feedback?.requestId).toBe('test-request-1');
            expect(feedback?.userId).toBe('user-123');
        });
        it('should return null for non-existent request', async () => {
            const feedback = await service.submitFeedback('non-existent', 'user-123', {
                rating: 4,
                timestamp: new Date()
            });
            expect(feedback).toBeNull();
        });
        it('should return null for request belonging to different user', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'completed'
            };
            await service.submitRequest(request);
            const feedback = await service.submitFeedback('test-request-1', 'different-user', {
                rating: 4,
                timestamp: new Date()
            });
            expect(feedback).toBeNull();
        });
    });
    describe('markRequestFailed', () => {
        it('should mark request as failed and add error', async () => {
            const request = {
                id: 'test-request-1',
                userId: 'user-123',
                parameters: {
                    investmentHorizon: 'medium-term',
                    riskTolerance: 'moderate'
                },
                priority: 'medium',
                timestamp: new Date(),
                status: 'processing'
            };
            await service.submitRequest(request);
            await service.markRequestFailed('test-request-1', 'Processing timeout');
            expect(mockTrackingService.updateStatus).toHaveBeenCalledWith('test-request-1', 'failed');
            expect(mockTrackingService.addError).toHaveBeenCalledWith('test-request-1', {
                code: 'PROCESSING_FAILED',
                message: 'Processing timeout',
                severity: 'critical',
                step: 'idea-generation',
                recoverable: false
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXJlcXVlc3Qtc2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9pbnZlc3RtZW50LWlkZWEtcmVxdWVzdC1zZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILHdGQUFrRjtBQUNsRiwwRUFBcUU7QUFPckUsb0JBQW9CO0FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztBQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLENBQUM7QUFFOUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtJQUM1QyxJQUFJLE9BQXFDLENBQUM7SUFDMUMsSUFBSSxtQkFBd0QsQ0FBQztJQUM3RCxJQUFJLHdCQUFxRSxDQUFDO0lBRTFFLFVBQVUsQ0FBQyxHQUFHLEVBQUU7UUFDZCxtQkFBbUIsR0FBRyxJQUFJLGlEQUFzQixFQUF5QyxDQUFDO1FBQzFGLHdCQUF3QixHQUFHO1lBQ3pCLHVCQUF1QixFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDbEMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUNqQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUN4Qix1QkFBdUIsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO1NBQ25DLENBQUM7UUFFRixPQUFPLEdBQUcsSUFBSSw4REFBNEIsQ0FBQyxtQkFBbUIsRUFBRSx3QkFBOEQsQ0FBQyxDQUFDO1FBRWhJLHNCQUFzQjtRQUN0QixtQkFBbUIsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFFLG1CQUFtQixDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEUsbUJBQW1CLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4RSxtQkFBbUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXJFLHdCQUF3QixDQUFDLHVCQUFxQyxDQUFDLGlCQUFpQixDQUFDO1lBQ2hGLFNBQVMsRUFBRSxjQUFjO1lBQ3pCLEtBQUssRUFBRSxFQUFFO1lBQ1QsUUFBUSxFQUFFO2dCQUNSLG1CQUFtQixFQUFFLENBQUM7Z0JBQ3RCLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3JCLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLHNCQUFzQixFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRTtnQkFDbEUsZUFBZSxFQUFFLEVBQUU7YUFDcEI7WUFDRCxpQkFBaUIsRUFBRTtnQkFDakIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsb0JBQW9CLEVBQUUsRUFBRTtnQkFDeEIsbUJBQW1CLEVBQUUsRUFBRTtnQkFDdkIsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsbUJBQW1CLEVBQUUsRUFBRTthQUN4QjtTQUNGLENBQUMsQ0FBQztRQUVGLHdCQUF3QixDQUFDLHNCQUFvQyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6Rix3QkFBd0IsQ0FBQyxhQUEyQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRSx3QkFBd0IsQ0FBQyx1QkFBcUMsQ0FBQyxlQUFlLENBQUM7WUFDOUUsY0FBYyxFQUFFLENBQUM7WUFDakIsY0FBYyxFQUFFLENBQUM7WUFDakIscUJBQXFCLEVBQUUsQ0FBQztTQUN6QixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7SUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUM3QixFQUFFLENBQUMsNENBQTRDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUQsTUFBTSxPQUFPLEdBQW9DO2dCQUMvQyxFQUFFLEVBQUUsZ0JBQWdCO2dCQUNwQixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsVUFBVSxFQUFFO29CQUNWLGlCQUFpQixFQUFFLGFBQWE7b0JBQ2hDLGFBQWEsRUFBRSxVQUFVO29CQUN6QixZQUFZLEVBQUUsQ0FBQztpQkFDaEI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVwRCxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUN6QyxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUM3RixNQUFNLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDckgsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsK0RBQStELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0UsTUFBTSxZQUFZLEdBQW9DO2dCQUNwRCxFQUFFLEVBQUUsZUFBZTtnQkFDbkIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxZQUFZO29CQUMvQixhQUFhLEVBQUUsY0FBYztvQkFDN0IsYUFBYSxFQUFFLE9BQU87b0JBQ3RCLFlBQVksRUFBRSxDQUFDO2lCQUNoQjtnQkFDRCxRQUFRLEVBQUUsUUFBUTtnQkFDbEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUNyQixNQUFNLEVBQUUsV0FBVzthQUNwQixDQUFDO1lBRUYsTUFBTSxvQkFBb0IsR0FBb0M7Z0JBQzVELEVBQUUsRUFBRSx1QkFBdUI7Z0JBQzNCLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixVQUFVLEVBQUU7b0JBQ1YsaUJBQWlCLEVBQUUsV0FBVztvQkFDOUIsYUFBYSxFQUFFLFlBQVk7b0JBQzNCLGFBQWEsRUFBRSxlQUFlO29CQUM5QixZQUFZLEVBQUUsRUFBRTtvQkFDaEIsa0JBQWtCLEVBQUUsSUFBSTtvQkFDeEIsbUJBQW1CLEVBQUUsSUFBSTtvQkFDekIsaUJBQWlCLEVBQUUsSUFBSTtpQkFDeEI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsQ0FBQztZQUVGLE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM5RCxNQUFNLG1CQUFtQixHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRTlFLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLHVCQUF1QixJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3JILENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQy9ELE1BQU0sYUFBYSxHQUFvQztnQkFDckQsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtvQkFDekIsYUFBYSxFQUFFLFVBQVU7aUJBQzFCO2dCQUNELFFBQVEsRUFBRSxRQUFRO2dCQUNsQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLE1BQU0sRUFBRSxXQUFXO2FBQ3BCLENBQUM7WUFFRixNQUFNLFVBQVUsR0FBb0M7Z0JBQ2xELEVBQUUsRUFBRSxhQUFhO2dCQUNqQixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsVUFBVSxFQUFFO29CQUNWLGlCQUFpQixFQUFFLGFBQWE7b0JBQ2hDLGFBQWEsRUFBRSxVQUFVO29CQUN6QixhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUNyQixNQUFNLEVBQUUsV0FBVzthQUNwQixDQUFDO1lBRUYsTUFBTSxZQUFZLEdBQUcsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sU0FBUyxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUxRCxNQUFNLENBQUMsWUFBWSxDQUFDLHVCQUF1QixJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsdUJBQXVCLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDekcsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsRUFBRSxDQUFDLGtEQUFrRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2hFLE1BQU0sT0FBTyxHQUFvQztnQkFDL0MsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyQyxzQkFBc0I7WUFDdEIsTUFBTSxVQUFVLEdBQUc7Z0JBQ2pCLFNBQVMsRUFBRSxnQkFBZ0I7Z0JBQzNCLE1BQU0sRUFBRSxXQUFvQjtnQkFDNUIsZUFBZSxFQUFFLEVBQUU7Z0JBQ25CLGlCQUFpQixFQUFFO29CQUNqQixtQkFBbUIsRUFBRSxLQUFLO29CQUMxQixrQkFBa0IsRUFBRSxLQUFLO29CQUN6QixpQkFBaUIsRUFBRSxJQUFJO29CQUN2QixjQUFjLEVBQUUsSUFBSTtvQkFDcEIsYUFBYSxFQUFFO3dCQUNiLE9BQU8sRUFBRSxLQUFLO3dCQUNkLFVBQVUsRUFBRSxHQUFHO3dCQUNmLGVBQWUsRUFBRSxFQUFFO3dCQUNuQixpQkFBaUIsRUFBRSxDQUFDO3dCQUNwQixhQUFhLEVBQUUsSUFBSTtxQkFDcEI7b0JBQ0QsVUFBVSxFQUFFLEVBQUU7b0JBQ2QsbUJBQW1CLEVBQUUsRUFBRTtpQkFDeEI7Z0JBQ0QsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUN2QixRQUFRLEVBQUU7b0JBQ1IsZ0JBQWdCLEVBQUUsYUFBc0I7b0JBQ3hDLGVBQWUsRUFBRSxFQUFFO29CQUNuQixtQkFBbUIsRUFBRSxJQUFJLElBQUksRUFBRTtvQkFDL0IsaUJBQWlCLEVBQUUsT0FBTztvQkFDMUIsYUFBYSxFQUFFLEVBQUU7b0JBQ2pCLGNBQWMsRUFBRTt3QkFDZCxnQkFBZ0IsRUFBRSxFQUFFO3dCQUNwQixTQUFTLEVBQUUsRUFBRTt3QkFDYixpQkFBaUIsRUFBRSxFQUFFO3FCQUN0QjtpQkFDRjtnQkFDRCxZQUFZLEVBQUUsRUFBRTtnQkFDaEIsZUFBZSxFQUFFLEVBQUU7YUFDcEIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV6RCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU3RSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNqRCxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMzRCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDM0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDREQUE0RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFFLE1BQU0sT0FBTyxHQUFvQztnQkFDL0MsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyQyxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ25GLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM1QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDN0IsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELE1BQU0sT0FBTyxHQUFvQztnQkFDL0MsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFFBQVE7YUFDakIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyQyxNQUFNLFNBQVMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFNUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QixNQUFNLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDL0YsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDckQsTUFBTSxPQUFPLEdBQW9DO2dCQUMvQyxFQUFFLEVBQUUsZ0JBQWdCO2dCQUNwQixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsVUFBVSxFQUFFO29CQUNWLGlCQUFpQixFQUFFLGFBQWE7b0JBQ2hDLGFBQWEsRUFBRSxVQUFVO2lCQUMxQjtnQkFDRCxRQUFRLEVBQUUsUUFBUTtnQkFDbEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUNyQixNQUFNLEVBQUUsV0FBVzthQUNwQixDQUFDO1lBRUYsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJDLE1BQU0sU0FBUyxHQUFHLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU1RSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELE1BQU0sT0FBTyxHQUFvQztnQkFDL0MsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFFBQVE7YUFDakIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyQyxNQUFNLFNBQVMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUVsRixNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNwQix1QkFBdUI7WUFDdkIsTUFBTSxRQUFRLEdBQXNDO2dCQUNsRDtvQkFDRSxFQUFFLEVBQUUsV0FBVztvQkFDZixNQUFNLEVBQUUsVUFBVTtvQkFDbEIsVUFBVSxFQUFFO3dCQUNWLGlCQUFpQixFQUFFLFlBQVk7d0JBQy9CLGFBQWEsRUFBRSxjQUFjO3FCQUM5QjtvQkFDRCxRQUFRLEVBQUUsTUFBTTtvQkFDaEIsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztvQkFDakMsTUFBTSxFQUFFLFdBQVc7aUJBQ3BCO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxXQUFXO29CQUNmLE1BQU0sRUFBRSxVQUFVO29CQUNsQixVQUFVLEVBQUU7d0JBQ1YsaUJBQWlCLEVBQUUsYUFBYTt3QkFDaEMsYUFBYSxFQUFFLFVBQVU7cUJBQzFCO29CQUNELFFBQVEsRUFBRSxRQUFRO29CQUNsQixTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO29CQUNqQyxNQUFNLEVBQUUsWUFBWTtpQkFDckI7Z0JBQ0Q7b0JBQ0UsRUFBRSxFQUFFLFdBQVc7b0JBQ2YsTUFBTSxFQUFFLFVBQVU7b0JBQ2xCLFVBQVUsRUFBRTt3QkFDVixpQkFBaUIsRUFBRSxXQUFXO3dCQUM5QixhQUFhLEVBQUUsWUFBWTtxQkFDNUI7b0JBQ0QsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztvQkFDakMsTUFBTSxFQUFFLFFBQVE7aUJBQ2pCO2dCQUNEO29CQUNFLEVBQUUsRUFBRSxXQUFXO29CQUNmLE1BQU0sRUFBRSxnQkFBZ0I7b0JBQ3hCLFVBQVUsRUFBRTt3QkFDVixpQkFBaUIsRUFBRSxhQUFhO3dCQUNoQyxhQUFhLEVBQUUsVUFBVTtxQkFDMUI7b0JBQ0QsUUFBUSxFQUFFLFFBQVE7b0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7b0JBQ2pDLE1BQU0sRUFBRSxXQUFXO2lCQUNwQjthQUNGLENBQUM7WUFFRixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtnQkFDOUIsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3RDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVqRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHlCQUF5QjtZQUN2RCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUU3QiwyQ0FBMkM7WUFDM0MsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsZUFBZSxDQUM5RCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FDekMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHlCQUF5QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3ZDLE1BQU0sT0FBTyxHQUF5QixFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUM5RCxNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUUzRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEQsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsNkJBQTZCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0MsTUFBTSxPQUFPLEdBQXlCO2dCQUNwQyxRQUFRLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUNoQyxNQUFNLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO2FBQy9CLENBQUM7WUFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUUzRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDL0IsQ0FBQyxDQUFDLFdBQVcsSUFBSSxPQUFPLENBQUMsUUFBUyxJQUFJLENBQUMsQ0FBQyxXQUFXLElBQUksT0FBTyxDQUFDLE1BQU8sQ0FDdkUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywyQkFBMkIsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN6QyxNQUFNLE9BQU8sR0FBeUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUM7WUFDM0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFM0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELE1BQU0sT0FBTyxHQUF5QixFQUFFLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxDQUFDO1lBQzNFLE1BQU0sTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5RSxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUMvQyxNQUFNLE9BQU8sR0FBeUIsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDdEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxPQUFPLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFM0UsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN6RSxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM5QixFQUFFLENBQUMsMENBQTBDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDeEQsTUFBTSxPQUFPLEdBQW9DO2dCQUMvQyxFQUFFLEVBQUUsZ0JBQWdCO2dCQUNwQixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsVUFBVSxFQUFFO29CQUNWLGlCQUFpQixFQUFFLGFBQWE7b0JBQ2hDLGFBQWEsRUFBRSxVQUFVO2lCQUMxQjtnQkFDRCxRQUFRLEVBQUUsUUFBUTtnQkFDbEIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFO2dCQUNyQixNQUFNLEVBQUUsV0FBVzthQUNwQixDQUFDO1lBRUYsTUFBTSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXJDLE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUU7Z0JBQzFFLE1BQU0sRUFBRSxDQUFDO2dCQUNULFFBQVEsRUFBRSx5QkFBeUI7Z0JBQ25DLGVBQWUsRUFBRSxDQUFDO2dCQUNsQixhQUFhLEVBQUUsQ0FBQztnQkFDaEIsWUFBWSxFQUFFLENBQUM7Z0JBQ2YsV0FBVyxFQUFFLGFBQWE7Z0JBQzFCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTthQUN0QixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0IsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsTUFBTSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztZQUMzRCxNQUFNLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNELE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsVUFBVSxFQUFFO2dCQUN4RSxNQUFNLEVBQUUsQ0FBQztnQkFDVCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUU7YUFDdEIsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDREQUE0RCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFFLE1BQU0sT0FBTyxHQUFvQztnQkFDL0MsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFdBQVc7YUFDcEIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyQyxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUU7Z0JBQ2hGLE1BQU0sRUFBRSxDQUFDO2dCQUNULFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTthQUN0QixDQUFDLENBQUM7WUFFSCxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDakMsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNELE1BQU0sT0FBTyxHQUFvQztnQkFDL0MsRUFBRSxFQUFFLGdCQUFnQjtnQkFDcEIsTUFBTSxFQUFFLFVBQVU7Z0JBQ2xCLFVBQVUsRUFBRTtvQkFDVixpQkFBaUIsRUFBRSxhQUFhO29CQUNoQyxhQUFhLEVBQUUsVUFBVTtpQkFDMUI7Z0JBQ0QsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRTtnQkFDckIsTUFBTSxFQUFFLFlBQVk7YUFDckIsQ0FBQztZQUVGLE1BQU0sT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyQyxNQUFNLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxRixNQUFNLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQzFFLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLE9BQU8sRUFBRSxvQkFBb0I7Z0JBQzdCLFFBQVEsRUFBRSxVQUFVO2dCQUNwQixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixXQUFXLEVBQUUsS0FBSzthQUNuQixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciBJbnZlc3RtZW50IElkZWEgUmVxdWVzdCBTZXJ2aWNlXG4gKi9cblxuaW1wb3J0IHsgSW52ZXN0bWVudElkZWFSZXF1ZXN0U2VydmljZSB9IGZyb20gJy4uL2ludmVzdG1lbnQtaWRlYS1yZXF1ZXN0LXNlcnZpY2UnO1xuaW1wb3J0IHsgUmVxdWVzdFRyYWNraW5nU2VydmljZSB9IGZyb20gJy4uL3JlcXVlc3QtdHJhY2tpbmctc2VydmljZSc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24nO1xuaW1wb3J0IHsgXG4gIEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QsXG4gIFJlcXVlc3RIaXN0b3J5RmlsdGVyXG59IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEtcmVxdWVzdCc7XG5cbi8vIE1vY2sgZGVwZW5kZW5jaWVzXG5qZXN0Lm1vY2soJy4uL3JlcXVlc3QtdHJhY2tpbmctc2VydmljZScpO1xuamVzdC5tb2NrKCcuLi9pbnZlc3RtZW50LWlkZWEtb3JjaGVzdHJhdGlvbicpO1xuXG5kZXNjcmliZSgnSW52ZXN0bWVudElkZWFSZXF1ZXN0U2VydmljZScsICgpID0+IHtcbiAgbGV0IHNlcnZpY2U6IEludmVzdG1lbnRJZGVhUmVxdWVzdFNlcnZpY2U7XG4gIGxldCBtb2NrVHJhY2tpbmdTZXJ2aWNlOiBqZXN0Lk1vY2tlZDxSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlPjtcbiAgbGV0IG1vY2tPcmNoZXN0cmF0aW9uU2VydmljZTogUGFydGlhbDxJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlPjtcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrVHJhY2tpbmdTZXJ2aWNlID0gbmV3IFJlcXVlc3RUcmFja2luZ1NlcnZpY2UoKSBhcyBqZXN0Lk1vY2tlZDxSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlPjtcbiAgICBtb2NrT3JjaGVzdHJhdGlvblNlcnZpY2UgPSB7XG4gICAgICBnZW5lcmF0ZUludmVzdG1lbnRJZGVhczogamVzdC5mbigpLFxuICAgICAgZ2V0QWN0aXZlUmVxdWVzdFN0YXR1czogamVzdC5mbigpLFxuICAgICAgY2FuY2VsUmVxdWVzdDogamVzdC5mbigpLFxuICAgICAgZ2V0UHJvY2Vzc2luZ1N0YXRpc3RpY3M6IGplc3QuZm4oKVxuICAgIH07XG4gICAgXG4gICAgc2VydmljZSA9IG5ldyBJbnZlc3RtZW50SWRlYVJlcXVlc3RTZXJ2aWNlKG1vY2tUcmFja2luZ1NlcnZpY2UsIG1vY2tPcmNoZXN0cmF0aW9uU2VydmljZSBhcyBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlKTtcblxuICAgIC8vIFNldHVwIGRlZmF1bHQgbW9ja3NcbiAgICBtb2NrVHJhY2tpbmdTZXJ2aWNlLnVwZGF0ZVN0YXR1cyA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgIG1vY2tUcmFja2luZ1NlcnZpY2UudXBkYXRlU3RlcCA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgIG1vY2tUcmFja2luZ1NlcnZpY2Uuc2V0UmVzdWx0cyA9IGplc3QuZm4oKS5tb2NrUmVzb2x2ZWRWYWx1ZSh1bmRlZmluZWQpO1xuICAgIG1vY2tUcmFja2luZ1NlcnZpY2UuYWRkRXJyb3IgPSBqZXN0LmZuKCkubW9ja1Jlc29sdmVkVmFsdWUodW5kZWZpbmVkKTtcbiAgICBcbiAgICAobW9ja09yY2hlc3RyYXRpb25TZXJ2aWNlLmdlbmVyYXRlSW52ZXN0bWVudElkZWFzIGFzIGplc3QuTW9jaykubW9ja1Jlc29sdmVkVmFsdWUoe1xuICAgICAgcmVxdWVzdElkOiAndGVzdC1yZXF1ZXN0JyxcbiAgICAgIGlkZWFzOiBbXSxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIHRvdGFsSWRlYXNHZW5lcmF0ZWQ6IDAsXG4gICAgICAgIHRvdGFsSWRlYXNGaWx0ZXJlZDogMCxcbiAgICAgICAgZmlsdGVyaW5nQ3JpdGVyaWE6IFtdLFxuICAgICAgICBjb25maWRlbmNlRGlzdHJpYnV0aW9uOiB7IGhpZ2g6IDAsIG1lZGl1bTogMCwgbG93OiAwLCBhdmVyYWdlOiAwIH0sXG4gICAgICAgIHByb2Nlc3NpbmdTdGVwczogW11cbiAgICAgIH0sXG4gICAgICBwcm9jZXNzaW5nTWV0cmljczoge1xuICAgICAgICB0b3RhbFByb2Nlc3NpbmdUaW1lOiAxMDAwLFxuICAgICAgICBhZ2VudFByb2Nlc3NpbmdUaW1lczoge30sXG4gICAgICAgIGRhdGFTb3VyY2VzQWNjZXNzZWQ6IFtdLFxuICAgICAgICBtb2RlbHNVc2VkOiBbXSxcbiAgICAgICAgcmVzb3VyY2VVdGlsaXphdGlvbjoge31cbiAgICAgIH1cbiAgICB9KTtcbiAgICBcbiAgICAobW9ja09yY2hlc3RyYXRpb25TZXJ2aWNlLmdldEFjdGl2ZVJlcXVlc3RTdGF0dXMgYXMgamVzdC5Nb2NrKS5tb2NrUmV0dXJuVmFsdWUodW5kZWZpbmVkKTtcbiAgICAobW9ja09yY2hlc3RyYXRpb25TZXJ2aWNlLmNhbmNlbFJlcXVlc3QgYXMgamVzdC5Nb2NrKS5tb2NrUmV0dXJuVmFsdWUodHJ1ZSk7XG4gICAgKG1vY2tPcmNoZXN0cmF0aW9uU2VydmljZS5nZXRQcm9jZXNzaW5nU3RhdGlzdGljcyBhcyBqZXN0Lk1vY2spLm1vY2tSZXR1cm5WYWx1ZSh7XG4gICAgICBhY3RpdmVSZXF1ZXN0czogMCxcbiAgICAgIHRvdGFsUHJvY2Vzc2VkOiAwLFxuICAgICAgYXZlcmFnZVByb2Nlc3NpbmdUaW1lOiAwXG4gICAgfSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgamVzdC5jbGVhckFsbE1vY2tzKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzdWJtaXRSZXF1ZXN0JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc3VibWl0IGEgdmFsaWQgcmVxdWVzdCBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0tdGVybScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWQpLnRvQmUoJ3Rlc3QtcmVxdWVzdC0xJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmVzdGltYXRlZFByb2Nlc3NpbmdUaW1lKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBleHBlY3QobW9ja1RyYWNraW5nU2VydmljZS51cGRhdGVTdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCd0ZXN0LXJlcXVlc3QtMScsICd2YWxpZGF0ZWQnKTtcbiAgICAgIGV4cGVjdChtb2NrVHJhY2tpbmdTZXJ2aWNlLnVwZGF0ZVN0ZXApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCd0ZXN0LXJlcXVlc3QtMScsICdwYXJhbWV0ZXItdmFsaWRhdGlvbicsICdjb21wbGV0ZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZXN0aW1hdGUgcHJvY2Vzc2luZyB0aW1lIGNvcnJlY3RseSBiYXNlZCBvbiBwYXJhbWV0ZXJzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYmFzaWNSZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ2Jhc2ljLXJlcXVlc3QnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ3Nob3J0LXRlcm0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdjb25zZXJ2YXRpdmUnLFxuICAgICAgICAgIHJlc2VhcmNoRGVwdGg6ICdiYXNpYycsXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiAzXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBjb21wcmVoZW5zaXZlUmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICdjb21wcmVoZW5zaXZlLXJlcXVlc3QnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmctdGVybScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICAgIHJlc2VhcmNoRGVwdGg6ICdjb21wcmVoZW5zaXZlJyxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDEwLFxuICAgICAgICAgIGluY2x1ZGVCYWNrdGVzdGluZzogdHJ1ZSxcbiAgICAgICAgICBpbmNsdWRlUmlza0FuYWx5c2lzOiB0cnVlLFxuICAgICAgICAgIGluY2x1ZGVFU0dGYWN0b3JzOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBiYXNpY1Jlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChiYXNpY1JlcXVlc3QpO1xuICAgICAgY29uc3QgY29tcHJlaGVuc2l2ZVJlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChjb21wcmVoZW5zaXZlUmVxdWVzdCk7XG5cbiAgICAgIGV4cGVjdChjb21wcmVoZW5zaXZlUmVzdWx0LmVzdGltYXRlZFByb2Nlc3NpbmdUaW1lIHx8IDApLnRvQmVHcmVhdGVyVGhhbihiYXNpY1Jlc3VsdC5lc3RpbWF0ZWRQcm9jZXNzaW5nVGltZSB8fCAwKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRqdXN0IHByb2Nlc3NpbmcgdGltZSBiYXNlZCBvbiBwcmlvcml0eScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVyZ2VudFJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndXJnZW50LXJlcXVlc3QnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIHJlc2VhcmNoRGVwdGg6ICdzdGFuZGFyZCdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICd1cmdlbnQnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGxvd1JlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAnbG93LXJlcXVlc3QnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIHJlc2VhcmNoRGVwdGg6ICdzdGFuZGFyZCdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdsb3cnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHVyZ2VudFJlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdCh1cmdlbnRSZXF1ZXN0KTtcbiAgICAgIGNvbnN0IGxvd1Jlc3VsdCA9IGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChsb3dSZXF1ZXN0KTtcblxuICAgICAgZXhwZWN0KHVyZ2VudFJlc3VsdC5lc3RpbWF0ZWRQcm9jZXNzaW5nVGltZSB8fCAwKS50b0JlTGVzc1RoYW4obG93UmVzdWx0LmVzdGltYXRlZFByb2Nlc3NpbmdUaW1lIHx8IDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0UmVxdWVzdFJlc3VsdHMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gcmVzdWx0cyBmb3IgdmFsaWQgcmVxdWVzdCBhbmQgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLnN1Ym1pdFJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIC8vIE1vY2sgcmVzdWx0IHN0b3JhZ2VcbiAgICAgIGNvbnN0IG1vY2tSZXN1bHQgPSB7XG4gICAgICAgIHJlcXVlc3RJZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgc3RhdHVzOiAnY29tcGxldGVkJyBhcyBjb25zdCxcbiAgICAgICAgaW52ZXN0bWVudElkZWFzOiBbXSxcbiAgICAgICAgcHJvY2Vzc2luZ01ldHJpY3M6IHtcbiAgICAgICAgICB0b3RhbFByb2Nlc3NpbmdUaW1lOiAzMDAwMCxcbiAgICAgICAgICBtb2RlbEV4ZWN1dGlvblRpbWU6IDIxMDAwLFxuICAgICAgICAgIGRhdGFSZXRyaWV2YWxUaW1lOiA2MDAwLFxuICAgICAgICAgIHZhbGlkYXRpb25UaW1lOiAzMDAwLFxuICAgICAgICAgIHJlc291cmNlc1VzZWQ6IHtcbiAgICAgICAgICAgIGNwdVRpbWU6IDMwMDAwLFxuICAgICAgICAgICAgbWVtb3J5UGVhazogNTEyLFxuICAgICAgICAgICAgbmV0d29ya1JlcXVlc3RzOiAxNSxcbiAgICAgICAgICAgIHN0b3JhZ2VPcGVyYXRpb25zOiA1LFxuICAgICAgICAgICAgZXN0aW1hdGVkQ29zdDogMC4yNVxuICAgICAgICAgIH0sXG4gICAgICAgICAgbW9kZWxzVXNlZDogW10sXG4gICAgICAgICAgZGF0YVNvdXJjZXNBY2Nlc3NlZDogW11cbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgZ2VuZXJhdGlvbk1ldGhvZDogJ211bHRpLWFnZW50JyBhcyBjb25zdCxcbiAgICAgICAgICByZXNlYXJjaFNvdXJjZXM6IFtdLFxuICAgICAgICAgIG1hcmtldERhdGFUaW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgICAgY29tcGxpYW5jZVZlcnNpb246ICcxLjAuMCcsXG4gICAgICAgICAgcXVhbGl0eUNoZWNrczogW10sXG4gICAgICAgICAgYmlhc0Fzc2Vzc21lbnQ6IHtcbiAgICAgICAgICAgIG92ZXJhbGxCaWFzU2NvcmU6IDE1LFxuICAgICAgICAgICAgYmlhc1R5cGVzOiBbXSxcbiAgICAgICAgICAgIG1pdGlnYXRpb25BcHBsaWVkOiBbXVxuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcXVhbGl0eVNjb3JlOiA4NSxcbiAgICAgICAgY29uZmlkZW5jZVNjb3JlOiA4MFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgc2VydmljZS5zdG9yZVJlc3VsdHMoJ3Rlc3QtcmVxdWVzdC0xJywgbW9ja1Jlc3VsdCk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFJlc3VsdHMoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0Py5yZXF1ZXN0SWQpLnRvQmUoJ3Rlc3QtcmVxdWVzdC0xJyk7XG4gICAgICBleHBlY3QocmVzdWx0Py5zdGF0dXMpLnRvQmUoJ2NvbXBsZXRlZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCBmb3Igbm9uLWV4aXN0ZW50IHJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RSZXN1bHRzKCdub24tZXhpc3RlbnQnLCAndXNlci0xMjMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQpLnRvQmVOdWxsKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIGZvciByZXF1ZXN0IGJlbG9uZ2luZyB0byBkaWZmZXJlbnQgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLnN1Ym1pdFJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdFJlc3VsdHMoJ3Rlc3QtcmVxdWVzdC0xJywgJ2RpZmZlcmVudC11c2VyJyk7XG4gICAgICBleHBlY3QocmVzdWx0KS50b0JlTnVsbCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY2FuY2VsUmVxdWVzdCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNhbmNlbCBhIHBlbmRpbmcgcmVxdWVzdCBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0tdGVybScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAncXVldWVkJ1xuICAgICAgfTtcblxuICAgICAgYXdhaXQgc2VydmljZS5zdWJtaXRSZXF1ZXN0KHJlcXVlc3QpO1xuXG4gICAgICBjb25zdCBjYW5jZWxsZWQgPSBhd2FpdCBzZXJ2aWNlLmNhbmNlbFJlcXVlc3QoJ3Rlc3QtcmVxdWVzdC0xJywgJ3VzZXItMTIzJyk7XG5cbiAgICAgIGV4cGVjdChjYW5jZWxsZWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QobW9ja1RyYWNraW5nU2VydmljZS51cGRhdGVTdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCd0ZXN0LXJlcXVlc3QtMScsICdjYW5jZWxsZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbm90IGNhbmNlbCBhIGNvbXBsZXRlZCByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtLXRlcm0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCdcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgY29uc3QgY2FuY2VsbGVkID0gYXdhaXQgc2VydmljZS5jYW5jZWxSZXF1ZXN0KCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycpO1xuXG4gICAgICBleHBlY3QoY2FuY2VsbGVkKS50b0JlKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbm90IGNhbmNlbCByZXF1ZXN0IGZvciBkaWZmZXJlbnQgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdxdWV1ZWQnXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLnN1Ym1pdFJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGNvbnN0IGNhbmNlbGxlZCA9IGF3YWl0IHNlcnZpY2UuY2FuY2VsUmVxdWVzdCgndGVzdC1yZXF1ZXN0LTEnLCAnZGlmZmVyZW50LXVzZXInKTtcblxuICAgICAgZXhwZWN0KGNhbmNlbGxlZCkudG9CZShmYWxzZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRSZXF1ZXN0SGlzdG9yeScsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIC8vIENyZWF0ZSB0ZXN0IHJlcXVlc3RzXG4gICAgICBjb25zdCByZXF1ZXN0czogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdFtdID0gW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdyZXF1ZXN0LTEnLFxuICAgICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ3Nob3J0LXRlcm0nLFxuICAgICAgICAgICAgcmlza1RvbGVyYW5jZTogJ2NvbnNlcnZhdGl2ZSdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMScpLFxuICAgICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAncmVxdWVzdC0yJyxcbiAgICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0tdGVybScsXG4gICAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgnMjAyNC0wMS0wMicpLFxuICAgICAgICAgIHN0YXR1czogJ3Byb2Nlc3NpbmcnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3JlcXVlc3QtMycsXG4gICAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbG9uZy10ZXJtJyxcbiAgICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdhZ2dyZXNzaXZlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJpb3JpdHk6ICdsb3cnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjQtMDEtMDMnKSxcbiAgICAgICAgICBzdGF0dXM6ICdmYWlsZWQnXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ3JlcXVlc3QtNCcsXG4gICAgICAgICAgdXNlcklkOiAnZGlmZmVyZW50LXVzZXInLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtLXRlcm0nLFxuICAgICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoJzIwMjQtMDEtMDQnKSxcbiAgICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnXG4gICAgICAgIH1cbiAgICAgIF07XG5cbiAgICAgIGZvciAoY29uc3QgcmVxdWVzdCBvZiByZXF1ZXN0cykge1xuICAgICAgICBhd2FpdCBzZXJ2aWNlLnN1Ym1pdFJlcXVlc3QocmVxdWVzdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiB1c2VyIHJlcXVlc3RzIHdpdGggcGFnaW5hdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdEhpc3RvcnkoJ3VzZXItMTIzJywgMSwgMik7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQucmVxdWVzdHMpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudG90YWwpLnRvQmUoMyk7IC8vIE9ubHkgdXNlci0xMjMgcmVxdWVzdHNcbiAgICAgIGV4cGVjdChyZXN1bHQucGFnZSkudG9CZSgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQubGltaXQpLnRvQmUoMik7XG4gICAgICBcbiAgICAgIC8vIFNob3VsZCBiZSBzb3J0ZWQgYnkgdGltZXN0YW1wIGRlc2NlbmRpbmdcbiAgICAgIGV4cGVjdChyZXN1bHQucmVxdWVzdHNbMF0uc3VibWl0dGVkQXQuZ2V0VGltZSgpKS50b0JlR3JlYXRlclRoYW4oXG4gICAgICAgIHJlc3VsdC5yZXF1ZXN0c1sxXS5zdWJtaXR0ZWRBdC5nZXRUaW1lKClcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZpbHRlciBieSBzdGF0dXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWx0ZXJzOiBSZXF1ZXN0SGlzdG9yeUZpbHRlciA9IHsgc3RhdHVzOiAnY29tcGxldGVkJyB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5nZXRSZXF1ZXN0SGlzdG9yeSgndXNlci0xMjMnLCAxLCAxMCwgZmlsdGVycyk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQucmVxdWVzdHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQucmVxdWVzdHNbMF0uc3RhdHVzKS50b0JlKCdjb21wbGV0ZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgZmlsdGVyIGJ5IGRhdGUgcmFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWx0ZXJzOiBSZXF1ZXN0SGlzdG9yeUZpbHRlciA9IHtcbiAgICAgICAgZGF0ZUZyb206IG5ldyBEYXRlKCcyMDI0LTAxLTAyJyksXG4gICAgICAgIGRhdGVUbzogbmV3IERhdGUoJzIwMjQtMDEtMDMnKVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuZ2V0UmVxdWVzdEhpc3RvcnkoJ3VzZXItMTIzJywgMSwgMTAsIGZpbHRlcnMpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnJlcXVlc3RzKS50b0hhdmVMZW5ndGgoMik7XG4gICAgICBleHBlY3QocmVzdWx0LnJlcXVlc3RzLmV2ZXJ5KHIgPT4gXG4gICAgICAgIHIuc3VibWl0dGVkQXQgPj0gZmlsdGVycy5kYXRlRnJvbSEgJiYgci5zdWJtaXR0ZWRBdCA8PSBmaWx0ZXJzLmRhdGVUbyFcbiAgICAgICkpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZpbHRlciBieSBwcmlvcml0eScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZpbHRlcnM6IFJlcXVlc3RIaXN0b3J5RmlsdGVyID0geyBwcmlvcml0eTogJ2hpZ2gnIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RIaXN0b3J5KCd1c2VyLTEyMycsIDEsIDEwLCBmaWx0ZXJzKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5yZXF1ZXN0cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZXF1ZXN0c1swXS5wcmlvcml0eSkudG9CZSgnaGlnaCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmaWx0ZXIgYnkgaW52ZXN0bWVudCBob3Jpem9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsdGVyczogUmVxdWVzdEhpc3RvcnlGaWx0ZXIgPSB7IGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtLXRlcm0nIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RIaXN0b3J5KCd1c2VyLTEyMycsIDEsIDEwLCBmaWx0ZXJzKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5yZXF1ZXN0cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZXF1ZXN0c1swXS5wYXJhbWV0ZXJzLmludmVzdG1lbnRIb3Jpem9uKS50b0JlKCdtZWRpdW0tdGVybScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmaWx0ZXIgYnkgcmlzayB0b2xlcmFuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmaWx0ZXJzOiBSZXF1ZXN0SGlzdG9yeUZpbHRlciA9IHsgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnIH07XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLmdldFJlcXVlc3RIaXN0b3J5KCd1c2VyLTEyMycsIDEsIDEwLCBmaWx0ZXJzKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5yZXF1ZXN0cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5yZXF1ZXN0c1swXS5wYXJhbWV0ZXJzLnJpc2tUb2xlcmFuY2UpLnRvQmUoJ2FnZ3Jlc3NpdmUnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3N1Ym1pdEZlZWRiYWNrJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc3VibWl0IGZlZWRiYWNrIGZvciB2YWxpZCByZXF1ZXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdDogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0LXJlcXVlc3QtMScsXG4gICAgICAgIHVzZXJJZDogJ3VzZXItMTIzJyxcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtLXRlcm0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZSdcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCdcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgY29uc3QgZmVlZGJhY2sgPSBhd2FpdCBzZXJ2aWNlLnN1Ym1pdEZlZWRiYWNrKCd0ZXN0LXJlcXVlc3QtMScsICd1c2VyLTEyMycsIHtcbiAgICAgICAgcmF0aW5nOiA0LFxuICAgICAgICBjb21tZW50czogJ0dyZWF0IGludmVzdG1lbnQgaWRlYXMhJyxcbiAgICAgICAgdXNlZnVsbmVzc1Njb3JlOiA1LFxuICAgICAgICBhY2N1cmFjeVNjb3JlOiA0LFxuICAgICAgICBpbnNpZ2h0U2NvcmU6IDQsXG4gICAgICAgIGFjdGlvblRha2VuOiAnaW1wbGVtZW50ZWQnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QoZmVlZGJhY2spLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZmVlZGJhY2s/LnJhdGluZykudG9CZSg0KTtcbiAgICAgIGV4cGVjdChmZWVkYmFjaz8uY29tbWVudHMpLnRvQmUoJ0dyZWF0IGludmVzdG1lbnQgaWRlYXMhJyk7XG4gICAgICBleHBlY3QoZmVlZGJhY2s/LnJlcXVlc3RJZCkudG9CZSgndGVzdC1yZXF1ZXN0LTEnKTtcbiAgICAgIGV4cGVjdChmZWVkYmFjaz8udXNlcklkKS50b0JlKCd1c2VyLTEyMycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCBmb3Igbm9uLWV4aXN0ZW50IHJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmZWVkYmFjayA9IGF3YWl0IHNlcnZpY2Uuc3VibWl0RmVlZGJhY2soJ25vbi1leGlzdGVudCcsICd1c2VyLTEyMycsIHtcbiAgICAgICAgcmF0aW5nOiA0LFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QoZmVlZGJhY2spLnRvQmVOdWxsKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIGZvciByZXF1ZXN0IGJlbG9uZ2luZyB0byBkaWZmZXJlbnQgdXNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVlc3Q6IEludmVzdG1lbnRJZGVhR2VuZXJhdGlvblJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiAndGVzdC1yZXF1ZXN0LTEnLFxuICAgICAgICB1c2VySWQ6ICd1c2VyLTEyMycsXG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bS10ZXJtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgIH0sXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdjb21wbGV0ZWQnXG4gICAgICB9O1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLnN1Ym1pdFJlcXVlc3QocmVxdWVzdCk7XG5cbiAgICAgIGNvbnN0IGZlZWRiYWNrID0gYXdhaXQgc2VydmljZS5zdWJtaXRGZWVkYmFjaygndGVzdC1yZXF1ZXN0LTEnLCAnZGlmZmVyZW50LXVzZXInLCB7XG4gICAgICAgIHJhdGluZzogNCxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KGZlZWRiYWNrKS50b0JlTnVsbCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnbWFya1JlcXVlc3RGYWlsZWQnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBtYXJrIHJlcXVlc3QgYXMgZmFpbGVkIGFuZCBhZGQgZXJyb3InLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0OiBJbnZlc3RtZW50SWRlYUdlbmVyYXRpb25SZXF1ZXN0ID0ge1xuICAgICAgICBpZDogJ3Rlc3QtcmVxdWVzdC0xJyxcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0tdGVybScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgICB9LFxuICAgICAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc3RhdHVzOiAncHJvY2Vzc2luZydcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHNlcnZpY2Uuc3VibWl0UmVxdWVzdChyZXF1ZXN0KTtcblxuICAgICAgYXdhaXQgc2VydmljZS5tYXJrUmVxdWVzdEZhaWxlZCgndGVzdC1yZXF1ZXN0LTEnLCAnUHJvY2Vzc2luZyB0aW1lb3V0Jyk7XG5cbiAgICAgIGV4cGVjdChtb2NrVHJhY2tpbmdTZXJ2aWNlLnVwZGF0ZVN0YXR1cykudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ3Rlc3QtcmVxdWVzdC0xJywgJ2ZhaWxlZCcpO1xuICAgICAgZXhwZWN0KG1vY2tUcmFja2luZ1NlcnZpY2UuYWRkRXJyb3IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCd0ZXN0LXJlcXVlc3QtMScsIHtcbiAgICAgICAgY29kZTogJ1BST0NFU1NJTkdfRkFJTEVEJyxcbiAgICAgICAgbWVzc2FnZTogJ1Byb2Nlc3NpbmcgdGltZW91dCcsXG4gICAgICAgIHNldmVyaXR5OiAnY3JpdGljYWwnLFxuICAgICAgICBzdGVwOiAnaWRlYS1nZW5lcmF0aW9uJyxcbiAgICAgICAgcmVjb3ZlcmFibGU6IGZhbHNlXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=