/**
 * Tests for Investment Idea Request Service
 */

import { InvestmentIdeaRequestService } from '../investment-idea-request-service';
import { RequestTrackingService } from '../request-tracking-service';
import { InvestmentIdeaOrchestrationService } from '../investment-idea-orchestration';
import { 
  InvestmentIdeaGenerationRequest,
  RequestHistoryFilter
} from '../../models/investment-idea-request';

// Mock dependencies
jest.mock('../request-tracking-service');
jest.mock('../investment-idea-orchestration');

describe('InvestmentIdeaRequestService', () => {
  let service: InvestmentIdeaRequestService;
  let mockTrackingService: jest.Mocked<RequestTrackingService>;
  let mockOrchestrationService: Partial<InvestmentIdeaOrchestrationService>;

  beforeEach(() => {
    mockTrackingService = new RequestTrackingService() as jest.Mocked<RequestTrackingService>;
    mockOrchestrationService = {
      generateInvestmentIdeas: jest.fn(),
      getActiveRequestStatus: jest.fn(),
      cancelRequest: jest.fn(),
      getProcessingStatistics: jest.fn()
    };
    
    service = new InvestmentIdeaRequestService(mockTrackingService, mockOrchestrationService as InvestmentIdeaOrchestrationService);

    // Setup default mocks
    mockTrackingService.updateStatus = jest.fn().mockResolvedValue(undefined);
    mockTrackingService.updateStep = jest.fn().mockResolvedValue(undefined);
    mockTrackingService.setResults = jest.fn().mockResolvedValue(undefined);
    mockTrackingService.addError = jest.fn().mockResolvedValue(undefined);
    
    (mockOrchestrationService.generateInvestmentIdeas as jest.Mock).mockResolvedValue({
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
    
    (mockOrchestrationService.getActiveRequestStatus as jest.Mock).mockReturnValue(undefined);
    (mockOrchestrationService.cancelRequest as jest.Mock).mockReturnValue(true);
    (mockOrchestrationService.getProcessingStatistics as jest.Mock).mockReturnValue({
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
      const request: InvestmentIdeaGenerationRequest = {
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
      const basicRequest: InvestmentIdeaGenerationRequest = {
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

      const comprehensiveRequest: InvestmentIdeaGenerationRequest = {
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
      const urgentRequest: InvestmentIdeaGenerationRequest = {
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

      const lowRequest: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
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
        status: 'completed' as const,
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
          generationMethod: 'multi-agent' as const,
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
      const request: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
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
      const requests: InvestmentIdeaGenerationRequest[] = [
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
      expect(result.requests[0].submittedAt.getTime()).toBeGreaterThan(
        result.requests[1].submittedAt.getTime()
      );
    });

    it('should filter by status', async () => {
      const filters: RequestHistoryFilter = { status: 'completed' };
      const result = await service.getRequestHistory('user-123', 1, 10, filters);

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].status).toBe('completed');
    });

    it('should filter by date range', async () => {
      const filters: RequestHistoryFilter = {
        dateFrom: new Date('2024-01-02'),
        dateTo: new Date('2024-01-03')
      };
      const result = await service.getRequestHistory('user-123', 1, 10, filters);

      expect(result.requests).toHaveLength(2);
      expect(result.requests.every(r => 
        r.submittedAt >= filters.dateFrom! && r.submittedAt <= filters.dateTo!
      )).toBe(true);
    });

    it('should filter by priority', async () => {
      const filters: RequestHistoryFilter = { priority: 'high' };
      const result = await service.getRequestHistory('user-123', 1, 10, filters);

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].priority).toBe('high');
    });

    it('should filter by investment horizon', async () => {
      const filters: RequestHistoryFilter = { investmentHorizon: 'medium-term' };
      const result = await service.getRequestHistory('user-123', 1, 10, filters);

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].parameters.investmentHorizon).toBe('medium-term');
    });

    it('should filter by risk tolerance', async () => {
      const filters: RequestHistoryFilter = { riskTolerance: 'aggressive' };
      const result = await service.getRequestHistory('user-123', 1, 10, filters);

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].parameters.riskTolerance).toBe('aggressive');
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback for valid request', async () => {
      const request: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
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
      const request: InvestmentIdeaGenerationRequest = {
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