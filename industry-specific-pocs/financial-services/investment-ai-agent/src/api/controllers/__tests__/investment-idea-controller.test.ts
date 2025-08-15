/**
 * Tests for Investment Idea Controller
 */

import { Request, Response } from 'express';
import {
  generateInvestmentIdeas,
  getInvestmentIdea,
  listInvestmentIdeas,
  updateInvestmentIdea,
  deleteInvestmentIdea,
  getInvestmentIdeaAnalysis,
  exportInvestmentIdea
} from '../investment-idea-controller';
import { InvestmentIdeaService } from '../../../services/investment-idea-service';
import { InvestmentIdeaOrchestrationService } from '../../../services/investment-idea-orchestration';
import { createMockInvestmentIdea, createMockInvestmentRequest } from '../../../__tests__/mock-data';

// Mock the services
jest.mock('../../../services/investment-idea-service');
jest.mock('../../../services/investment-idea-orchestration');

const mockInvestmentIdeaService = InvestmentIdeaService as jest.MockedClass<typeof InvestmentIdeaService>;
const mockOrchestrationService = InvestmentIdeaOrchestrationService as jest.MockedClass<typeof InvestmentIdeaOrchestrationService>;

describe('Investment Idea Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'user-123',
        organizationId: 'org-456',
        role: 'analyst',
        permissions: ['idea:read', 'idea:write']
      },
      params: {},
      query: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('generateInvestmentIdeas', () => {
    it('should generate investment ideas successfully', async () => {
      const mockRequest = createMockInvestmentRequest();
      const mockIdeas = [createMockInvestmentIdea()];

      mockOrchestrationService.prototype.processInvestmentIdeaRequest = jest.fn()
        .mockResolvedValue({
          requestId: mockRequest.id,
          investmentIdeas: mockIdeas,
          processingTime: 5000,
          metadata: {
            modelUsed: 'claude-sonnet-3.7',
            dataSourcesUsed: ['market-data'],
            processingSteps: ['planning', 'research', 'analysis']
          }
        });

      const req = {
        ...mockRequest,
        body: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate',
          sectors: ['technology'],
          assetClasses: ['stocks'],
          minimumConfidence: 0.7,
          maximumIdeas: 5
        }
      } as Request;

      await generateInvestmentIdeas(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            requestId: mockRequest.id,
            investmentIdeas: mockIdeas
          })
        })
      );
    });

    it('should handle validation errors', async () => {
      const req = {
        ...mockRequest,
        body: {
          investmentHorizon: 'invalid',
          riskTolerance: 'moderate'
        }
      } as Request;

      await generateInvestmentIdeas(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('validation')
          })
        })
      );
    });

    it('should handle service errors', async () => {
      mockOrchestrationService.prototype.processInvestmentIdeaRequest = jest.fn()
        .mockRejectedValue(new Error('Service unavailable'));

      const req = {
        ...mockRequest,
        body: {
          investmentHorizon: 'medium',
          riskTolerance: 'moderate'
        }
      } as Request;

      await generateInvestmentIdeas(req, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getInvestmentIdea', () => {
    it('should retrieve investment idea successfully', async () => {
      const mockIdea = createMockInvestmentIdea();
      
      mockInvestmentIdeaService.prototype.getInvestmentIdea = jest.fn()
        .mockResolvedValue(mockIdea);

      const req = {
        ...mockRequest,
        params: { id: 'idea-123' }
      } as Request;

      await getInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockIdea
        })
      );
    });

    it('should handle not found errors', async () => {
      mockInvestmentIdeaService.prototype.getInvestmentIdea = jest.fn()
        .mockResolvedValue(null);

      const req = {
        ...mockRequest,
        params: { id: 'nonexistent-idea' }
      } as Request;

      await getInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Investment idea not found'
          })
        })
      );
    });

    it('should handle permission errors', async () => {
      const req = {
        ...mockRequest,
        user: {
          ...mockRequest.user,
          permissions: [] // No permissions
        },
        params: { id: 'idea-123' }
      } as Request;

      await getInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Insufficient permissions'
          })
        })
      );
    });
  });

  describe('listInvestmentIdeas', () => {
    it('should list investment ideas with pagination', async () => {
      const mockIdeas = [createMockInvestmentIdea(), createMockInvestmentIdea()];
      
      mockInvestmentIdeaService.prototype.listInvestmentIdeas = jest.fn()
        .mockResolvedValue({
          ideas: mockIdeas,
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        });

      const req = {
        ...mockRequest,
        query: {
          page: '1',
          limit: '10',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      } as Request;

      await listInvestmentIdeas(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            ideas: mockIdeas,
            pagination: expect.objectContaining({
              total: 2,
              page: 1,
              limit: 10,
              totalPages: 1
            })
          })
        })
      );
    });

    it('should handle filtering parameters', async () => {
      mockInvestmentIdeaService.prototype.listInvestmentIdeas = jest.fn()
        .mockResolvedValue({
          ideas: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        });

      const req = {
        ...mockRequest,
        query: {
          strategy: 'buy',
          timeHorizon: 'medium',
          minConfidence: '0.8',
          sectors: 'technology,healthcare'
        }
      } as Request;

      await listInvestmentIdeas(req, mockResponse as Response, mockNext);

      expect(mockInvestmentIdeaService.prototype.listInvestmentIdeas)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            filters: expect.objectContaining({
              strategy: 'buy',
              timeHorizon: 'medium',
              minConfidence: 0.8,
              sectors: ['technology', 'healthcare']
            })
          })
        );
    });
  });

  describe('updateInvestmentIdea', () => {
    it('should update investment idea successfully', async () => {
      const mockIdea = createMockInvestmentIdea();
      
      mockInvestmentIdeaService.prototype.updateInvestmentIdea = jest.fn()
        .mockResolvedValue(mockIdea);

      const req = {
        ...mockRequest,
        params: { id: 'idea-123' },
        body: {
          title: 'Updated Investment Idea',
          description: 'Updated description'
        }
      } as Request;

      await updateInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockIdea
        })
      );
    });

    it('should handle validation errors for updates', async () => {
      const req = {
        ...mockRequest,
        params: { id: 'idea-123' },
        body: {
          confidenceScore: 1.5 // Invalid confidence score
        }
      } as Request;

      await updateInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('validation')
          })
        })
      );
    });
  });

  describe('deleteInvestmentIdea', () => {
    it('should delete investment idea successfully', async () => {
      mockInvestmentIdeaService.prototype.deleteInvestmentIdea = jest.fn()
        .mockResolvedValue(true);

      const req = {
        ...mockRequest,
        params: { id: 'idea-123' }
      } as Request;

      await deleteInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Investment idea deleted successfully'
        })
      );
    });

    it('should handle permission errors for deletion', async () => {
      const req = {
        ...mockRequest,
        user: {
          ...mockRequest.user,
          permissions: ['idea:read'] // No delete permission
        },
        params: { id: 'idea-123' }
      } as Request;

      await deleteInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Insufficient permissions'
          })
        })
      );
    });
  });

  describe('getInvestmentIdeaAnalysis', () => {
    it('should retrieve investment idea analysis successfully', async () => {
      const mockAnalysis = {
        riskAnalysis: {
          overallRisk: 'medium',
          riskFactors: ['market volatility', 'sector concentration'],
          riskScore: 0.6
        },
        performanceProjection: {
          expectedReturn: 0.15,
          volatility: 0.25,
          sharpeRatio: 0.6
        },
        complianceCheck: {
          compliant: true,
          issues: [],
          regulationsChecked: ['SEC-RULE-1']
        }
      };

      mockInvestmentIdeaService.prototype.getInvestmentIdeaAnalysis = jest.fn()
        .mockResolvedValue(mockAnalysis);

      const req = {
        ...mockRequest,
        params: { id: 'idea-123' }
      } as Request;

      await getInvestmentIdeaAnalysis(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockAnalysis
        })
      );
    });
  });

  describe('exportInvestmentIdea', () => {
    it('should export investment idea as PDF', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');
      
      mockInvestmentIdeaService.prototype.exportInvestmentIdea = jest.fn()
        .mockResolvedValue(mockPdfBuffer);

      const req = {
        ...mockRequest,
        params: { id: 'idea-123' },
        query: { format: 'pdf' }
      } as Request;

      const mockResponseWithHeaders = {
        ...mockResponse,
        setHeader: jest.fn(),
        end: jest.fn()
      };

      await exportInvestmentIdea(req, mockResponseWithHeaders as Response, mockNext);

      expect(mockResponseWithHeaders.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponseWithHeaders.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="investment-idea-idea-123.pdf"'
      );
      expect(mockResponseWithHeaders.end).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should export investment idea as JSON', async () => {
      const mockIdea = createMockInvestmentIdea();
      
      mockInvestmentIdeaService.prototype.getInvestmentIdea = jest.fn()
        .mockResolvedValue(mockIdea);

      const req = {
        ...mockRequest,
        params: { id: 'idea-123' },
        query: { format: 'json' }
      } as Request;

      await exportInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockIdea
        })
      );
    });

    it('should handle unsupported export formats', async () => {
      const req = {
        ...mockRequest,
        params: { id: 'idea-123' },
        query: { format: 'unsupported' }
      } as Request;

      await exportInvestmentIdea(req, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Unsupported export format'
          })
        })
      );
    });
  });
});