"use strict";
/**
 * Tests for Investment Idea Controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
const investment_idea_controller_1 = require("../investment-idea-controller");
const investment_idea_service_1 = require("../../../services/investment-idea-service");
const investment_idea_orchestration_1 = require("../../../services/investment-idea-orchestration");
const mock_data_1 = require("../../../__tests__/mock-data");
// Mock the services
jest.mock('../../../services/investment-idea-service');
jest.mock('../../../services/investment-idea-orchestration');
const mockInvestmentIdeaService = investment_idea_service_1.InvestmentIdeaService;
const mockOrchestrationService = investment_idea_orchestration_1.InvestmentIdeaOrchestrationService;
describe('Investment Idea Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
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
            const mockRequest = (0, mock_data_1.createMockInvestmentRequest)();
            const mockIdeas = [(0, mock_data_1.createMockInvestmentIdea)()];
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
            };
            await (0, investment_idea_controller_1.generateInvestmentIdeas)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    requestId: mockRequest.id,
                    investmentIdeas: mockIdeas
                })
            }));
        });
        it('should handle validation errors', async () => {
            const req = {
                ...mockRequest,
                body: {
                    investmentHorizon: 'invalid',
                    riskTolerance: 'moderate'
                }
            };
            await (0, investment_idea_controller_1.generateInvestmentIdeas)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: expect.stringContaining('validation')
                })
            }));
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
            };
            await (0, investment_idea_controller_1.generateInvestmentIdeas)(req, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });
    describe('getInvestmentIdea', () => {
        it('should retrieve investment idea successfully', async () => {
            const mockIdea = (0, mock_data_1.createMockInvestmentIdea)();
            mockInvestmentIdeaService.prototype.getInvestmentIdea = jest.fn()
                .mockResolvedValue(mockIdea);
            const req = {
                ...mockRequest,
                params: { id: 'idea-123' }
            };
            await (0, investment_idea_controller_1.getInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockIdea
            }));
        });
        it('should handle not found errors', async () => {
            mockInvestmentIdeaService.prototype.getInvestmentIdea = jest.fn()
                .mockResolvedValue(null);
            const req = {
                ...mockRequest,
                params: { id: 'nonexistent-idea' }
            };
            await (0, investment_idea_controller_1.getInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Investment idea not found'
                })
            }));
        });
        it('should handle permission errors', async () => {
            const req = {
                ...mockRequest,
                user: {
                    ...mockRequest.user,
                    permissions: [] // No permissions
                },
                params: { id: 'idea-123' }
            };
            await (0, investment_idea_controller_1.getInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Insufficient permissions'
                })
            }));
        });
    });
    describe('listInvestmentIdeas', () => {
        it('should list investment ideas with pagination', async () => {
            const mockIdeas = [(0, mock_data_1.createMockInvestmentIdea)(), (0, mock_data_1.createMockInvestmentIdea)()];
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
            };
            await (0, investment_idea_controller_1.listInvestmentIdeas)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
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
            }));
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
            };
            await (0, investment_idea_controller_1.listInvestmentIdeas)(req, mockResponse, mockNext);
            expect(mockInvestmentIdeaService.prototype.listInvestmentIdeas)
                .toHaveBeenCalledWith(expect.objectContaining({
                filters: expect.objectContaining({
                    strategy: 'buy',
                    timeHorizon: 'medium',
                    minConfidence: 0.8,
                    sectors: ['technology', 'healthcare']
                })
            }));
        });
    });
    describe('updateInvestmentIdea', () => {
        it('should update investment idea successfully', async () => {
            const mockIdea = (0, mock_data_1.createMockInvestmentIdea)();
            mockInvestmentIdeaService.prototype.updateInvestmentIdea = jest.fn()
                .mockResolvedValue(mockIdea);
            const req = {
                ...mockRequest,
                params: { id: 'idea-123' },
                body: {
                    title: 'Updated Investment Idea',
                    description: 'Updated description'
                }
            };
            await (0, investment_idea_controller_1.updateInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockIdea
            }));
        });
        it('should handle validation errors for updates', async () => {
            const req = {
                ...mockRequest,
                params: { id: 'idea-123' },
                body: {
                    confidenceScore: 1.5 // Invalid confidence score
                }
            };
            await (0, investment_idea_controller_1.updateInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: expect.stringContaining('validation')
                })
            }));
        });
    });
    describe('deleteInvestmentIdea', () => {
        it('should delete investment idea successfully', async () => {
            mockInvestmentIdeaService.prototype.deleteInvestmentIdea = jest.fn()
                .mockResolvedValue(true);
            const req = {
                ...mockRequest,
                params: { id: 'idea-123' }
            };
            await (0, investment_idea_controller_1.deleteInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Investment idea deleted successfully'
            }));
        });
        it('should handle permission errors for deletion', async () => {
            const req = {
                ...mockRequest,
                user: {
                    ...mockRequest.user,
                    permissions: ['idea:read'] // No delete permission
                },
                params: { id: 'idea-123' }
            };
            await (0, investment_idea_controller_1.deleteInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Insufficient permissions'
                })
            }));
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
            };
            await (0, investment_idea_controller_1.getInvestmentIdeaAnalysis)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockAnalysis
            }));
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
            };
            const mockResponseWithHeaders = {
                ...mockResponse,
                setHeader: jest.fn(),
                end: jest.fn()
            };
            await (0, investment_idea_controller_1.exportInvestmentIdea)(req, mockResponseWithHeaders, mockNext);
            expect(mockResponseWithHeaders.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(mockResponseWithHeaders.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="investment-idea-idea-123.pdf"');
            expect(mockResponseWithHeaders.end).toHaveBeenCalledWith(mockPdfBuffer);
        });
        it('should export investment idea as JSON', async () => {
            const mockIdea = (0, mock_data_1.createMockInvestmentIdea)();
            mockInvestmentIdeaService.prototype.getInvestmentIdea = jest.fn()
                .mockResolvedValue(mockIdea);
            const req = {
                ...mockRequest,
                params: { id: 'idea-123' },
                query: { format: 'json' }
            };
            await (0, investment_idea_controller_1.exportInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockIdea
            }));
        });
        it('should handle unsupported export formats', async () => {
            const req = {
                ...mockRequest,
                params: { id: 'idea-123' },
                query: { format: 'unsupported' }
            };
            await (0, investment_idea_controller_1.exportInvestmentIdea)(req, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({
                    message: 'Unsupported export format'
                })
            }));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLWNvbnRyb2xsZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcGkvY29udHJvbGxlcnMvX190ZXN0c19fL2ludmVzdG1lbnQtaWRlYS1jb250cm9sbGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUdILDhFQVF1QztBQUN2Qyx1RkFBa0Y7QUFDbEYsbUdBQXFHO0FBQ3JHLDREQUFxRztBQUVyRyxvQkFBb0I7QUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO0FBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsaURBQWlELENBQUMsQ0FBQztBQUU3RCxNQUFNLHlCQUF5QixHQUFHLCtDQUF1RSxDQUFDO0FBQzFHLE1BQU0sd0JBQXdCLEdBQUcsa0VBQWlHLENBQUM7QUFFbkksUUFBUSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtJQUMxQyxJQUFJLFdBQTZCLENBQUM7SUFDbEMsSUFBSSxZQUErQixDQUFDO0lBQ3BDLElBQUksUUFBbUIsQ0FBQztJQUV4QixVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsV0FBVyxHQUFHO1lBQ1osSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRSxVQUFVO2dCQUNsQixjQUFjLEVBQUUsU0FBUztnQkFDekIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLFlBQVksQ0FBQzthQUN6QztZQUNELE1BQU0sRUFBRSxFQUFFO1lBQ1YsS0FBSyxFQUFFLEVBQUU7WUFDVCxJQUFJLEVBQUUsRUFBRTtTQUNULENBQUM7UUFFRixZQUFZLEdBQUc7WUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRTtZQUNsQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLGNBQWMsRUFBRTtZQUNoQyxJQUFJLEVBQUUsSUFBSSxD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RSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7b0JBQzdCLE9BQU8sRUFBRSwyQkFBMkI7aUJBQ3JDLENBQUM7YUFDSCxDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGVzdHMgZm9yIEludmVzdG1lbnQgSWRlYSBDb250cm9sbGVyXG4gKi9cblxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7XG4gIGdlbmVyYXRlSW52ZXN0bWVudElkZWFzLFxuICBnZXRJbnZlc3RtZW50SWRlYSxcbiAgbGlzdEludmVzdG1lbnRJZGVhcyxcbiAgdXBkYXRlSW52ZXN0bWVudElkZWEsXG4gIGRlbGV0ZUludmVzdG1lbnRJZGVhLFxuICBnZXRJbnZlc3RtZW50SWRlYUFuYWx5c2lzLFxuICBleHBvcnRJbnZlc3RtZW50SWRlYVxufSBmcm9tICcuLi9pbnZlc3RtZW50LWlkZWEtY29udHJvbGxlcic7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYVNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9zZXJ2aWNlcy9pbnZlc3RtZW50LWlkZWEtc2VydmljZSc7XG5pbXBvcnQgeyBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vc2VydmljZXMvaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24nO1xuaW1wb3J0IHsgY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhLCBjcmVhdGVNb2NrSW52ZXN0bWVudFJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi9fX3Rlc3RzX18vbW9jay1kYXRhJztcblxuLy8gTW9jayB0aGUgc2VydmljZXNcbmplc3QubW9jaygnLi4vLi4vLi4vc2VydmljZXMvaW52ZXN0bWVudC1pZGVhLXNlcnZpY2UnKTtcbmplc3QubW9jaygnLi4vLi4vLi4vc2VydmljZXMvaW52ZXN0bWVudC1pZGVhLW9yY2hlc3RyYXRpb24nKTtcblxuY29uc3QgbW9ja0ludmVzdG1lbnRJZGVhU2VydmljZSA9IEludmVzdG1lbnRJZGVhU2VydmljZSBhcyBqZXN0Lk1vY2tlZENsYXNzPHR5cGVvZiBJbnZlc3RtZW50SWRlYVNlcnZpY2U+O1xuY29uc3QgbW9ja09yY2hlc3RyYXRpb25TZXJ2aWNlID0gSW52ZXN0bWVudElkZWFPcmNoZXN0cmF0aW9uU2VydmljZSBhcyBqZXN0Lk1vY2tlZENsYXNzPHR5cGVvZiBJbnZlc3RtZW50SWRlYU9yY2hlc3RyYXRpb25TZXJ2aWNlPjtcblxuZGVzY3JpYmUoJ0ludmVzdG1lbnQgSWRlYSBDb250cm9sbGVyJywgKCkgPT4ge1xuICBsZXQgbW9ja1JlcXVlc3Q6IFBhcnRpYWw8UmVxdWVzdD47XG4gIGxldCBtb2NrUmVzcG9uc2U6IFBhcnRpYWw8UmVzcG9uc2U+O1xuICBsZXQgbW9ja05leHQ6IGplc3QuTW9jaztcblxuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrUmVxdWVzdCA9IHtcbiAgICAgIHVzZXI6IHtcbiAgICAgICAgdXNlcklkOiAndXNlci0xMjMnLFxuICAgICAgICBvcmdhbml6YXRpb25JZDogJ29yZy00NTYnLFxuICAgICAgICByb2xlOiAnYW5hbHlzdCcsXG4gICAgICAgIHBlcm1pc3Npb25zOiBbJ2lkZWE6cmVhZCcsICdpZGVhOndyaXRlJ11cbiAgICAgIH0sXG4gICAgICBwYXJhbXM6IHt9LFxuICAgICAgcXVlcnk6IHt9LFxuICAgICAgYm9keToge31cbiAgICB9O1xuXG4gICAgbW9ja1Jlc3BvbnNlID0ge1xuICAgICAgc3RhdHVzOiBqZXN0LmZuKCkubW9ja1JldHVyblRoaXMoKSxcbiAgICAgIGpzb246IGplc3QuZm4oKS5tb2NrUmV0dXJuVGhpcygpLFxuICAgICAgc2VuZDogamVzdC5mbigpLm1vY2tSZXR1cm5UaGlzKClcbiAgICB9O1xuXG4gICAgbW9ja05leHQgPSBqZXN0LmZuKCk7XG5cbiAgICBqZXN0LmNsZWFyQWxsTW9ja3MoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dlbmVyYXRlSW52ZXN0bWVudElkZWFzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZ2VuZXJhdGUgaW52ZXN0bWVudCBpZGVhcyBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrUmVxdWVzdCA9IGNyZWF0ZU1vY2tJbnZlc3RtZW50UmVxdWVzdCgpO1xuICAgICAgY29uc3QgbW9ja0lkZWFzID0gW2NyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYSgpXTtcblxuICAgICAgbW9ja09yY2hlc3RyYXRpb25TZXJ2aWNlLnByb3RvdHlwZS5wcm9jZXNzSW52ZXN0bWVudElkZWFSZXF1ZXN0ID0gamVzdC5mbigpXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgICAgcmVxdWVzdElkOiBtb2NrUmVxdWVzdC5pZCxcbiAgICAgICAgICBpbnZlc3RtZW50SWRlYXM6IG1vY2tJZGVhcyxcbiAgICAgICAgICBwcm9jZXNzaW5nVGltZTogNTAwMCxcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgbW9kZWxVc2VkOiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgICAgICAgICAgZGF0YVNvdXJjZXNVc2VkOiBbJ21hcmtldC1kYXRhJ10sXG4gICAgICAgICAgICBwcm9jZXNzaW5nU3RlcHM6IFsncGxhbm5pbmcnLCAncmVzZWFyY2gnLCAnYW5hbHlzaXMnXVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHJlcSA9IHtcbiAgICAgICAgLi4ubW9ja1JlcXVlc3QsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJyxcbiAgICAgICAgICBzZWN0b3JzOiBbJ3RlY2hub2xvZ3knXSxcbiAgICAgICAgICBhc3NldENsYXNzZXM6IFsnc3RvY2tzJ10sXG4gICAgICAgICAgbWluaW11bUNvbmZpZGVuY2U6IDAuNyxcbiAgICAgICAgICBtYXhpbXVtSWRlYXM6IDVcbiAgICAgICAgfVxuICAgICAgfSBhcyBSZXF1ZXN0O1xuXG4gICAgICBhd2FpdCBnZW5lcmF0ZUludmVzdG1lbnRJZGVhcyhyZXEsIG1vY2tSZXNwb25zZSBhcyBSZXNwb25zZSwgbW9ja05leHQpO1xuXG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLnN0YXR1cykudG9IYXZlQmVlbkNhbGxlZFdpdGgoMjAwKTtcbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2UuanNvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGRhdGE6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIHJlcXVlc3RJZDogbW9ja1JlcXVlc3QuaWQsXG4gICAgICAgICAgICBpbnZlc3RtZW50SWRlYXM6IG1vY2tJZGVhc1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgdmFsaWRhdGlvbiBlcnJvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdpbnZhbGlkJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnXG4gICAgICAgIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgZ2VuZXJhdGVJbnZlc3RtZW50SWRlYXMocmVxLCBtb2NrUmVzcG9uc2UgYXMgUmVzcG9uc2UsIG1vY2tOZXh0KTtcblxuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5zdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDQwMCk7XG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLmpzb24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCd2YWxpZGF0aW9uJylcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHNlcnZpY2UgZXJyb3JzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgbW9ja09yY2hlc3RyYXRpb25TZXJ2aWNlLnByb3RvdHlwZS5wcm9jZXNzSW52ZXN0bWVudElkZWFSZXF1ZXN0ID0gamVzdC5mbigpXG4gICAgICAgIC5tb2NrUmVqZWN0ZWRWYWx1ZShuZXcgRXJyb3IoJ1NlcnZpY2UgdW5hdmFpbGFibGUnKSk7XG5cbiAgICAgIGNvbnN0IHJlcSA9IHtcbiAgICAgICAgLi4ubW9ja1JlcXVlc3QsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ21vZGVyYXRlJ1xuICAgICAgICB9XG4gICAgICB9IGFzIFJlcXVlc3Q7XG5cbiAgICAgIGF3YWl0IGdlbmVyYXRlSW52ZXN0bWVudElkZWFzKHJlcSwgbW9ja1Jlc3BvbnNlIGFzIFJlc3BvbnNlLCBtb2NrTmV4dCk7XG5cbiAgICAgIGV4cGVjdChtb2NrTmV4dCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoZXhwZWN0LmFueShFcnJvcikpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0SW52ZXN0bWVudElkZWEnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXRyaWV2ZSBpbnZlc3RtZW50IGlkZWEgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0lkZWEgPSBjcmVhdGVNb2NrSW52ZXN0bWVudElkZWEoKTtcbiAgICAgIFxuICAgICAgbW9ja0ludmVzdG1lbnRJZGVhU2VydmljZS5wcm90b3R5cGUuZ2V0SW52ZXN0bWVudElkZWEgPSBqZXN0LmZuKClcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tJZGVhKTtcblxuICAgICAgY29uc3QgcmVxID0ge1xuICAgICAgICAuLi5tb2NrUmVxdWVzdCxcbiAgICAgICAgcGFyYW1zOiB7IGlkOiAnaWRlYS0xMjMnIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgZ2V0SW52ZXN0bWVudElkZWEocmVxLCBtb2NrUmVzcG9uc2UgYXMgUmVzcG9uc2UsIG1vY2tOZXh0KTtcblxuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5zdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDIwMCk7XG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLmpzb24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICBkYXRhOiBtb2NrSWRlYVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIG5vdCBmb3VuZCBlcnJvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrSW52ZXN0bWVudElkZWFTZXJ2aWNlLnByb3RvdHlwZS5nZXRJbnZlc3RtZW50SWRlYSA9IGplc3QuZm4oKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWUobnVsbCk7XG5cbiAgICAgIGNvbnN0IHJlcSA9IHtcbiAgICAgICAgLi4ubW9ja1JlcXVlc3QsXG4gICAgICAgIHBhcmFtczogeyBpZDogJ25vbmV4aXN0ZW50LWlkZWEnIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgZ2V0SW52ZXN0bWVudElkZWEocmVxLCBtb2NrUmVzcG9uc2UgYXMgUmVzcG9uc2UsIG1vY2tOZXh0KTtcblxuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5zdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDQwNCk7XG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLmpzb24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZlc3RtZW50IGlkZWEgbm90IGZvdW5kJ1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgcGVybWlzc2lvbiBlcnJvcnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgLi4ubW9ja1JlcXVlc3QudXNlcixcbiAgICAgICAgICBwZXJtaXNzaW9uczogW10gLy8gTm8gcGVybWlzc2lvbnNcbiAgICAgICAgfSxcbiAgICAgICAgcGFyYW1zOiB7IGlkOiAnaWRlYS0xMjMnIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgZ2V0SW52ZXN0bWVudElkZWEocmVxLCBtb2NrUmVzcG9uc2UgYXMgUmVzcG9uc2UsIG1vY2tOZXh0KTtcblxuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5zdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDQwMyk7XG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLmpzb24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnN1ZmZpY2llbnQgcGVybWlzc2lvbnMnXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdsaXN0SW52ZXN0bWVudElkZWFzJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgbGlzdCBpbnZlc3RtZW50IGlkZWFzIHdpdGggcGFnaW5hdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tJZGVhcyA9IFtjcmVhdGVNb2NrSW52ZXN0bWVudElkZWEoKSwgY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhKCldO1xuICAgICAgXG4gICAgICBtb2NrSW52ZXN0bWVudElkZWFTZXJ2aWNlLnByb3RvdHlwZS5saXN0SW52ZXN0bWVudElkZWFzID0gamVzdC5mbigpXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZSh7XG4gICAgICAgICAgaWRlYXM6IG1vY2tJZGVhcyxcbiAgICAgICAgICB0b3RhbDogMixcbiAgICAgICAgICBwYWdlOiAxLFxuICAgICAgICAgIGxpbWl0OiAxMCxcbiAgICAgICAgICB0b3RhbFBhZ2VzOiAxXG4gICAgICAgIH0pO1xuXG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICBxdWVyeToge1xuICAgICAgICAgIHBhZ2U6ICcxJyxcbiAgICAgICAgICBsaW1pdDogJzEwJyxcbiAgICAgICAgICBzb3J0Qnk6ICdjcmVhdGVkQXQnLFxuICAgICAgICAgIHNvcnRPcmRlcjogJ2Rlc2MnXG4gICAgICAgIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgbGlzdEludmVzdG1lbnRJZGVhcyhyZXEsIG1vY2tSZXNwb25zZSBhcyBSZXNwb25zZSwgbW9ja05leHQpO1xuXG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLnN0YXR1cykudG9IYXZlQmVlbkNhbGxlZFdpdGgoMjAwKTtcbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2UuanNvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGRhdGE6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIGlkZWFzOiBtb2NrSWRlYXMsXG4gICAgICAgICAgICBwYWdpbmF0aW9uOiBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgICAgIHRvdGFsOiAyLFxuICAgICAgICAgICAgICBwYWdlOiAxLFxuICAgICAgICAgICAgICBsaW1pdDogMTAsXG4gICAgICAgICAgICAgIHRvdGFsUGFnZXM6IDFcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBmaWx0ZXJpbmcgcGFyYW1ldGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgIG1vY2tJbnZlc3RtZW50SWRlYVNlcnZpY2UucHJvdG90eXBlLmxpc3RJbnZlc3RtZW50SWRlYXMgPSBqZXN0LmZuKClcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlKHtcbiAgICAgICAgICBpZGVhczogW10sXG4gICAgICAgICAgdG90YWw6IDAsXG4gICAgICAgICAgcGFnZTogMSxcbiAgICAgICAgICBsaW1pdDogMTAsXG4gICAgICAgICAgdG90YWxQYWdlczogMFxuICAgICAgICB9KTtcblxuICAgICAgY29uc3QgcmVxID0ge1xuICAgICAgICAuLi5tb2NrUmVxdWVzdCxcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBzdHJhdGVneTogJ2J1eScsXG4gICAgICAgICAgdGltZUhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIG1pbkNvbmZpZGVuY2U6ICcwLjgnLFxuICAgICAgICAgIHNlY3RvcnM6ICd0ZWNobm9sb2d5LGhlYWx0aGNhcmUnXG4gICAgICAgIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgbGlzdEludmVzdG1lbnRJZGVhcyhyZXEsIG1vY2tSZXNwb25zZSBhcyBSZXNwb25zZSwgbW9ja05leHQpO1xuXG4gICAgICBleHBlY3QobW9ja0ludmVzdG1lbnRJZGVhU2VydmljZS5wcm90b3R5cGUubGlzdEludmVzdG1lbnRJZGVhcylcbiAgICAgICAgLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIGZpbHRlcnM6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgICAgc3RyYXRlZ3k6ICdidXknLFxuICAgICAgICAgICAgICB0aW1lSG9yaXpvbjogJ21lZGl1bScsXG4gICAgICAgICAgICAgIG1pbkNvbmZpZGVuY2U6IDAuOCxcbiAgICAgICAgICAgICAgc2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnXVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndXBkYXRlSW52ZXN0bWVudElkZWEnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgaW52ZXN0bWVudCBpZGVhIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tJZGVhID0gY3JlYXRlTW9ja0ludmVzdG1lbnRJZGVhKCk7XG4gICAgICBcbiAgICAgIG1vY2tJbnZlc3RtZW50SWRlYVNlcnZpY2UucHJvdG90eXBlLnVwZGF0ZUludmVzdG1lbnRJZGVhID0gamVzdC5mbigpXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZShtb2NrSWRlYSk7XG5cbiAgICAgIGNvbnN0IHJlcSA9IHtcbiAgICAgICAgLi4ubW9ja1JlcXVlc3QsXG4gICAgICAgIHBhcmFtczogeyBpZDogJ2lkZWEtMTIzJyB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdGl0bGU6ICdVcGRhdGVkIEludmVzdG1lbnQgSWRlYScsXG4gICAgICAgICAgZGVzY3JpcHRpb246ICdVcGRhdGVkIGRlc2NyaXB0aW9uJ1xuICAgICAgICB9XG4gICAgICB9IGFzIFJlcXVlc3Q7XG5cbiAgICAgIGF3YWl0IHVwZGF0ZUludmVzdG1lbnRJZGVhKHJlcSwgbW9ja1Jlc3BvbnNlIGFzIFJlc3BvbnNlLCBtb2NrTmV4dCk7XG5cbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2Uuc3RhdHVzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgyMDApO1xuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5qc29uKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgZGF0YTogbW9ja0lkZWFcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSB2YWxpZGF0aW9uIGVycm9ycyBmb3IgdXBkYXRlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcSA9IHtcbiAgICAgICAgLi4ubW9ja1JlcXVlc3QsXG4gICAgICAgIHBhcmFtczogeyBpZDogJ2lkZWEtMTIzJyB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgY29uZmlkZW5jZVNjb3JlOiAxLjUgLy8gSW52YWxpZCBjb25maWRlbmNlIHNjb3JlXG4gICAgICAgIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgdXBkYXRlSW52ZXN0bWVudElkZWEocmVxLCBtb2NrUmVzcG9uc2UgYXMgUmVzcG9uc2UsIG1vY2tOZXh0KTtcblxuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5zdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDQwMCk7XG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLmpzb24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGV4cGVjdC5zdHJpbmdDb250YWluaW5nKCd2YWxpZGF0aW9uJylcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2RlbGV0ZUludmVzdG1lbnRJZGVhJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZGVsZXRlIGludmVzdG1lbnQgaWRlYSBzdWNjZXNzZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBtb2NrSW52ZXN0bWVudElkZWFTZXJ2aWNlLnByb3RvdHlwZS5kZWxldGVJbnZlc3RtZW50SWRlYSA9IGplc3QuZm4oKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWUodHJ1ZSk7XG5cbiAgICAgIGNvbnN0IHJlcSA9IHtcbiAgICAgICAgLi4ubW9ja1JlcXVlc3QsXG4gICAgICAgIHBhcmFtczogeyBpZDogJ2lkZWEtMTIzJyB9XG4gICAgICB9IGFzIFJlcXVlc3Q7XG5cbiAgICAgIGF3YWl0IGRlbGV0ZUludmVzdG1lbnRJZGVhKHJlcSwgbW9ja1Jlc3BvbnNlIGFzIFJlc3BvbnNlLCBtb2NrTmV4dCk7XG5cbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2Uuc3RhdHVzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgyMDApO1xuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5qc29uKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogJ0ludmVzdG1lbnQgaWRlYSBkZWxldGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBwZXJtaXNzaW9uIGVycm9ycyBmb3IgZGVsZXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgLi4ubW9ja1JlcXVlc3QudXNlcixcbiAgICAgICAgICBwZXJtaXNzaW9uczogWydpZGVhOnJlYWQnXSAvLyBObyBkZWxldGUgcGVybWlzc2lvblxuICAgICAgICB9LFxuICAgICAgICBwYXJhbXM6IHsgaWQ6ICdpZGVhLTEyMycgfVxuICAgICAgfSBhcyBSZXF1ZXN0O1xuXG4gICAgICBhd2FpdCBkZWxldGVJbnZlc3RtZW50SWRlYShyZXEsIG1vY2tSZXNwb25zZSBhcyBSZXNwb25zZSwgbW9ja05leHQpO1xuXG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLnN0YXR1cykudG9IYXZlQmVlbkNhbGxlZFdpdGgoNDAzKTtcbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2UuanNvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICBlcnJvcjogZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgICAgbWVzc2FnZTogJ0luc3VmZmljaWVudCBwZXJtaXNzaW9ucydcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldEludmVzdG1lbnRJZGVhQW5hbHlzaXMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXRyaWV2ZSBpbnZlc3RtZW50IGlkZWEgYW5hbHlzaXMgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbW9ja0FuYWx5c2lzID0ge1xuICAgICAgICByaXNrQW5hbHlzaXM6IHtcbiAgICAgICAgICBvdmVyYWxsUmlzazogJ21lZGl1bScsXG4gICAgICAgICAgcmlza0ZhY3RvcnM6IFsnbWFya2V0IHZvbGF0aWxpdHknLCAnc2VjdG9yIGNvbmNlbnRyYXRpb24nXSxcbiAgICAgICAgICByaXNrU2NvcmU6IDAuNlxuICAgICAgICB9LFxuICAgICAgICBwZXJmb3JtYW5jZVByb2plY3Rpb246IHtcbiAgICAgICAgICBleHBlY3RlZFJldHVybjogMC4xNSxcbiAgICAgICAgICB2b2xhdGlsaXR5OiAwLjI1LFxuICAgICAgICAgIHNoYXJwZVJhdGlvOiAwLjZcbiAgICAgICAgfSxcbiAgICAgICAgY29tcGxpYW5jZUNoZWNrOiB7XG4gICAgICAgICAgY29tcGxpYW50OiB0cnVlLFxuICAgICAgICAgIGlzc3VlczogW10sXG4gICAgICAgICAgcmVndWxhdGlvbnNDaGVja2VkOiBbJ1NFQy1SVUxFLTEnXVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBtb2NrSW52ZXN0bWVudElkZWFTZXJ2aWNlLnByb3RvdHlwZS5nZXRJbnZlc3RtZW50SWRlYUFuYWx5c2lzID0gamVzdC5mbigpXG4gICAgICAgIC5tb2NrUmVzb2x2ZWRWYWx1ZShtb2NrQW5hbHlzaXMpO1xuXG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICBwYXJhbXM6IHsgaWQ6ICdpZGVhLTEyMycgfVxuICAgICAgfSBhcyBSZXF1ZXN0O1xuXG4gICAgICBhd2FpdCBnZXRJbnZlc3RtZW50SWRlYUFuYWx5c2lzKHJlcSwgbW9ja1Jlc3BvbnNlIGFzIFJlc3BvbnNlLCBtb2NrTmV4dCk7XG5cbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2Uuc3RhdHVzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgyMDApO1xuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5qc29uKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZXhwZWN0Lm9iamVjdENvbnRhaW5pbmcoe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgZGF0YTogbW9ja0FuYWx5c2lzXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZXhwb3J0SW52ZXN0bWVudElkZWEnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBleHBvcnQgaW52ZXN0bWVudCBpZGVhIGFzIFBERicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tQZGZCdWZmZXIgPSBCdWZmZXIuZnJvbSgnUERGIGNvbnRlbnQnKTtcbiAgICAgIFxuICAgICAgbW9ja0ludmVzdG1lbnRJZGVhU2VydmljZS5wcm90b3R5cGUuZXhwb3J0SW52ZXN0bWVudElkZWEgPSBqZXN0LmZuKClcbiAgICAgICAgLm1vY2tSZXNvbHZlZFZhbHVlKG1vY2tQZGZCdWZmZXIpO1xuXG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICBwYXJhbXM6IHsgaWQ6ICdpZGVhLTEyMycgfSxcbiAgICAgICAgcXVlcnk6IHsgZm9ybWF0OiAncGRmJyB9XG4gICAgICB9IGFzIFJlcXVlc3Q7XG5cbiAgICAgIGNvbnN0IG1vY2tSZXNwb25zZVdpdGhIZWFkZXJzID0ge1xuICAgICAgICAuLi5tb2NrUmVzcG9uc2UsXG4gICAgICAgIHNldEhlYWRlcjogamVzdC5mbigpLFxuICAgICAgICBlbmQ6IGplc3QuZm4oKVxuICAgICAgfTtcblxuICAgICAgYXdhaXQgZXhwb3J0SW52ZXN0bWVudElkZWEocmVxLCBtb2NrUmVzcG9uc2VXaXRoSGVhZGVycyBhcyBSZXNwb25zZSwgbW9ja05leHQpO1xuXG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlV2l0aEhlYWRlcnMuc2V0SGVhZGVyKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3BkZicpO1xuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZVdpdGhIZWFkZXJzLnNldEhlYWRlcikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICdDb250ZW50LURpc3Bvc2l0aW9uJyxcbiAgICAgICAgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiaW52ZXN0bWVudC1pZGVhLWlkZWEtMTIzLnBkZlwiJ1xuICAgICAgKTtcbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2VXaXRoSGVhZGVycy5lbmQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG1vY2tQZGZCdWZmZXIpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBleHBvcnQgaW52ZXN0bWVudCBpZGVhIGFzIEpTT04nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrSWRlYSA9IGNyZWF0ZU1vY2tJbnZlc3RtZW50SWRlYSgpO1xuICAgICAgXG4gICAgICBtb2NrSW52ZXN0bWVudElkZWFTZXJ2aWNlLnByb3RvdHlwZS5nZXRJbnZlc3RtZW50SWRlYSA9IGplc3QuZm4oKVxuICAgICAgICAubW9ja1Jlc29sdmVkVmFsdWUobW9ja0lkZWEpO1xuXG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICBwYXJhbXM6IHsgaWQ6ICdpZGVhLTEyMycgfSxcbiAgICAgICAgcXVlcnk6IHsgZm9ybWF0OiAnanNvbicgfVxuICAgICAgfSBhcyBSZXF1ZXN0O1xuXG4gICAgICBhd2FpdCBleHBvcnRJbnZlc3RtZW50SWRlYShyZXEsIG1vY2tSZXNwb25zZSBhcyBSZXNwb25zZSwgbW9ja05leHQpO1xuXG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLnN0YXR1cykudG9IYXZlQmVlbkNhbGxlZFdpdGgoMjAwKTtcbiAgICAgIGV4cGVjdChtb2NrUmVzcG9uc2UuanNvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIGRhdGE6IG1vY2tJZGVhXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgdW5zdXBwb3J0ZWQgZXhwb3J0IGZvcm1hdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXEgPSB7XG4gICAgICAgIC4uLm1vY2tSZXF1ZXN0LFxuICAgICAgICBwYXJhbXM6IHsgaWQ6ICdpZGVhLTEyMycgfSxcbiAgICAgICAgcXVlcnk6IHsgZm9ybWF0OiAndW5zdXBwb3J0ZWQnIH1cbiAgICAgIH0gYXMgUmVxdWVzdDtcblxuICAgICAgYXdhaXQgZXhwb3J0SW52ZXN0bWVudElkZWEocmVxLCBtb2NrUmVzcG9uc2UgYXMgUmVzcG9uc2UsIG1vY2tOZXh0KTtcblxuICAgICAgZXhwZWN0KG1vY2tSZXNwb25zZS5zdGF0dXMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDQwMCk7XG4gICAgICBleHBlY3QobW9ja1Jlc3BvbnNlLmpzb24pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICBleHBlY3Qub2JqZWN0Q29udGFpbmluZyh7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgZXJyb3I6IGV4cGVjdC5vYmplY3RDb250YWluaW5nKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdVbnN1cHBvcnRlZCBleHBvcnQgZm9ybWF0J1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==