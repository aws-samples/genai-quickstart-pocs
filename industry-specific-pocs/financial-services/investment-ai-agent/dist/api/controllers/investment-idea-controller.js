"use strict";
/**
 * Investment Idea Request Controller
 * Handles investment idea generation requests, validation, and tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentIdeaController = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../../services/logging/logger");
const audit_service_1 = require("../../services/logging/audit-service");
class InvestmentIdeaController {
    constructor(requestService, validationService, trackingService) {
        this.requestService = requestService;
        this.validationService = validationService;
        this.trackingService = trackingService;
    }
    /**
     * Submit a new investment idea generation request
     */
    async submitRequest(req, res) {
        const startTime = Date.now();
        const requestId = req.auditContext?.requestId || (0, uuid_1.v4)();
        try {
            const userId = req.user?.userId;
            if (!userId) {
                await logger_1.logger.warn('InvestmentIdeaController', 'submitRequest', 'Unauthorized request attempt', {
                    ipAddress: req.auditContext?.ipAddress,
                    userAgent: req.auditContext?.userAgent
                }, req.auditContext);
                res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            // Log the request start
            await logger_1.logger.info('InvestmentIdeaController', 'submitRequest', 'Investment idea generation request started', {
                userId,
                requestId,
                requestBody: {
                    investmentHorizon: req.body.investmentHorizon,
                    riskTolerance: req.body.riskTolerance,
                    sectors: req.body.sectors?.length || 0,
                    assetClasses: req.body.assetClasses?.length || 0
                }
            }, req.auditContext);
            // Record audit event for investment idea generation
            await audit_service_1.auditService.recordAuditEvent({
                userId,
                userRole: req.auditContext?.userRole || 'user',
                organizationId: req.auditContext?.organizationId || 'default',
                eventType: 'investment_idea_generation',
                resource: 'investment_ideas',
                action: 'POST /api/v1/ideas/generate',
                outcome: 'success',
                details: {
                    requestId,
                    parameters: {
                        investmentHorizon: req.body.investmentHorizon,
                        riskTolerance: req.body.riskTolerance,
                        sectorsCount: req.body.sectors?.length || 0,
                        assetClassesCount: req.body.assetClasses?.length || 0
                    },
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.auditContext?.ipAddress,
                userAgent: req.auditContext?.userAgent,
                sessionId: req.auditContext?.sessionId,
                requestId: req.auditContext?.requestId,
                riskLevel: 'medium',
                dataClassification: 'confidential'
            });
            // Create request object
            const requestData = {
                id: (0, uuid_1.v4)(),
                userId,
                parameters: req.body.parameters,
                priority: req.body.priority || 'medium',
                timestamp: new Date(),
                status: 'submitted',
                callback: req.body.callback
            };
            // Validate request parameters
            const validationResult = await this.validationService.validateRequest(requestData);
            if (!validationResult.isValid) {
                res.status(400).json({
                    error: 'Invalid request parameters',
                    code: 'VALIDATION_FAILED',
                    details: {
                        errors: validationResult.errors,
                        warnings: validationResult.warnings
                    }
                });
                return;
            }
            // Submit request for processing
            const submittedRequest = await this.requestService.submitRequest(requestData);
            // Start tracking
            await this.trackingService.startTracking(submittedRequest.id);
            res.status(202).json({
                message: 'Investment idea request submitted successfully',
                requestId: submittedRequest.id,
                status: submittedRequest.status,
                estimatedProcessingTime: submittedRequest.estimatedProcessingTime,
                trackingUrl: `/api/v1/ideas/requests/${submittedRequest.id}/status`
            });
        }
        catch (error) {
            console.error('Error submitting investment idea request:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: 'Failed to submit investment idea request'
            });
        }
    }
    /**
     * Get request status and progress
     */
    async getRequestStatus(req, res) {
        try {
            const { requestId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            const requestStatus = await this.trackingService.getRequestStatus(requestId, userId);
            if (!requestStatus) {
                res.status(404).json({
                    error: 'Request not found',
                    code: 'REQUEST_NOT_FOUND'
                });
                return;
            }
            res.json({
                requestId,
                status: requestStatus.status,
                progress: requestStatus.progress,
                estimatedTimeRemaining: requestStatus.estimatedTimeRemaining,
                currentStep: requestStatus.currentStep,
                results: requestStatus.results,
                errors: requestStatus.errors,
                lastUpdated: requestStatus.lastUpdated
            });
        }
        catch (error) {
            console.error('Error getting request status:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get request status'
            });
        }
    }
    /**
     * Get request results
     */
    async getRequestResults(req, res) {
        try {
            const { requestId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            const results = await this.requestService.getRequestResults(requestId, userId);
            if (!results) {
                res.status(404).json({
                    error: 'Request results not found',
                    code: 'RESULTS_NOT_FOUND'
                });
                return;
            }
            if (results.status !== 'completed') {
                res.status(202).json({
                    message: 'Request still processing',
                    status: results.status,
                    requestId
                });
                return;
            }
            res.json({
                requestId,
                status: results.status,
                investmentIdeas: results.investmentIdeas,
                processingMetrics: results.processingMetrics,
                generatedAt: results.generatedAt,
                metadata: results.metadata
            });
        }
        catch (error) {
            console.error('Error getting request results:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get request results'
            });
        }
    }
    /**
     * Cancel a pending request
     */
    async cancelRequest(req, res) {
        try {
            const { requestId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            const cancelled = await this.requestService.cancelRequest(requestId, userId);
            if (!cancelled) {
                res.status(404).json({
                    error: 'Request not found or cannot be cancelled',
                    code: 'CANCELLATION_FAILED'
                });
                return;
            }
            res.json({
                message: 'Request cancelled successfully',
                requestId,
                status: 'cancelled'
            });
        }
        catch (error) {
            console.error('Error cancelling request:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: 'Failed to cancel request'
            });
        }
    }
    /**
     * Get user's request history
     */
    async getRequestHistory(req, res) {
        try {
            const userId = req.user?.userId;
            const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
            if (!userId) {
                res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            const filters = {
                status: status,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined
            };
            const history = await this.requestService.getRequestHistory(userId, parseInt(page), parseInt(limit), filters);
            res.json({
                requests: history.requests,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: history.total,
                    totalPages: Math.ceil(history.total / parseInt(limit))
                }
            });
        }
        catch (error) {
            console.error('Error getting request history:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: 'Failed to get request history'
            });
        }
    }
    /**
     * Submit feedback for a completed request
     */
    async submitFeedback(req, res) {
        try {
            const { requestId } = req.params;
            const userId = req.user?.userId;
            const { rating, comments, usefulnessScore, accuracyScore, insightScore, actionTaken } = req.body;
            if (!userId) {
                res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
                return;
            }
            const feedback = await this.requestService.submitFeedback(requestId, userId, {
                rating,
                comments,
                usefulnessScore,
                accuracyScore,
                insightScore,
                actionTaken,
                timestamp: new Date()
            });
            if (!feedback) {
                res.status(404).json({
                    error: 'Request not found',
                    code: 'REQUEST_NOT_FOUND'
                });
                return;
            }
            res.json({
                message: 'Feedback submitted successfully',
                requestId,
                feedbackId: feedback.id
            });
        }
        catch (error) {
            console.error('Error submitting feedback:', error);
            res.status(500).json({
                error: 'Internal server error',
                code: 'INTERNAL_ERROR',
                message: 'Failed to submit feedback'
            });
        }
    }
}
exports.InvestmentIdeaController = InvestmentIdeaController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLWNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL2NvbnRyb2xsZXJzL2ludmVzdG1lbnQtaWRlYS1jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7OztBQUdILCtCQUFvQztBQVVwQywwREFBdUQ7QUFDdkQsd0VBQW9FO0FBR3BFLE1BQWEsd0JBQXdCO0lBS25DLFlBQ0UsY0FBNEMsRUFDNUMsaUJBQTJDLEVBQzNDLGVBQXVDO1FBRXZDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztRQUMzQyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztJQUN6QyxDQUFDO0lBRUQ7O09BRUc7SUFDSSxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQXFCLEVBQUUsR0FBYTtRQUM3RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFlBQVksRUFBRSxTQUFTLElBQUksSUFBQSxTQUFNLEdBQUUsQ0FBQztRQUUxRCxJQUFJO1lBQ0YsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUM7WUFDaEMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDWCxNQUFNLGVBQU0sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsZUFBZSxFQUFFLDhCQUE4QixFQUFFO29CQUM3RixTQUFTLEVBQUUsR0FBRyxDQUFDLFlBQVksRUFBRSxTQUFTO29CQUN0QyxTQUFTLEVBQUUsR0FBRyxDQUFDLFlBQVksRUFBRSxTQUFTO2lCQUN2QyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFFckIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ25C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ICogSGFuZGxlcyBpbnZlc3RtZW50IGlkZWEgZ2VuZXJhdGlvbiByZXF1ZXN0cywgdmFsaWRhdGlvbiwgYW5kIHRyYWNraW5nXG4gKi9cblxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcbmltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuaW1wb3J0IHsgSW52ZXN0bWVudElkZWFSZXF1ZXN0U2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL2ludmVzdG1lbnQtaWRlYS1yZXF1ZXN0LXNlcnZpY2UnO1xuaW1wb3J0IHsgUmVxdWVzdFZhbGlkYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvcmVxdWVzdC12YWxpZGF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgUmVxdWVzdFRyYWNraW5nU2VydmljZSB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3JlcXVlc3QtdHJhY2tpbmctc2VydmljZSc7XG5pbXBvcnQgeyBcbiAgSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCwgXG4gIEludmVzdG1lbnRJZGVhUmVxdWVzdFBhcmFtZXRlcnMsXG4gIFJlcXVlc3RTdGF0dXMgXG59IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEtcmVxdWVzdCc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uUmVzdWx0IH0gZnJvbSAnLi4vLi4vbW9kZWxzL2ludmVzdG1lbnQtaWRlYSc7XG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9sb2dnaW5nL2xvZ2dlcic7XG5pbXBvcnQgeyBhdWRpdFNlcnZpY2UgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9sb2dnaW5nL2F1ZGl0LXNlcnZpY2UnO1xuaW1wb3J0IHsgQXVkaXRhYmxlUmVxdWVzdCB9IGZyb20gJy4uL21pZGRsZXdhcmUvYXVkaXQtbG9nZ2luZyc7XG5cbmV4cG9ydCBjbGFzcyBJbnZlc3RtZW50SWRlYUNvbnRyb2xsZXIge1xuICBwcml2YXRlIHJlcXVlc3RTZXJ2aWNlOiBJbnZlc3RtZW50SWRlYVJlcXVlc3RTZXJ2aWNlO1xuICBwcml2YXRlIHZhbGlkYXRpb25TZXJ2aWNlOiBSZXF1ZXN0VmFsaWRhdGlvblNlcnZpY2U7XG4gIHByaXZhdGUgdHJhY2tpbmdTZXJ2aWNlOiBSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHJlcXVlc3RTZXJ2aWNlOiBJbnZlc3RtZW50SWRlYVJlcXVlc3RTZXJ2aWNlLFxuICAgIHZhbGlkYXRpb25TZXJ2aWNlOiBSZXF1ZXN0VmFsaWRhdGlvblNlcnZpY2UsXG4gICAgdHJhY2tpbmdTZXJ2aWNlOiBSZXF1ZXN0VHJhY2tpbmdTZXJ2aWNlXG4gICkge1xuICAgIHRoaXMucmVxdWVzdFNlcnZpY2UgPSByZXF1ZXN0U2VydmljZTtcbiAgICB0aGlzLnZhbGlkYXRpb25TZXJ2aWNlID0gdmFsaWRhdGlvblNlcnZpY2U7XG4gICAgdGhpcy50cmFja2luZ1NlcnZpY2UgPSB0cmFja2luZ1NlcnZpY2U7XG4gIH1cblxuICAvKipcbiAgICogU3VibWl0IGEgbmV3IGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIHJlcXVlc3RcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzdWJtaXRSZXF1ZXN0KHJlcTogQXVkaXRhYmxlUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgY29uc3QgcmVxdWVzdElkID0gcmVxLmF1ZGl0Q29udGV4dD8ucmVxdWVzdElkIHx8IHV1aWR2NCgpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkO1xuICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgYXdhaXQgbG9nZ2VyLndhcm4oJ0ludmVzdG1lbnRJZGVhQ29udHJvbGxlcicsICdzdWJtaXRSZXF1ZXN0JywgJ1VuYXV0aG9yaXplZCByZXF1ZXN0IGF0dGVtcHQnLCB7XG4gICAgICAgICAgaXBBZGRyZXNzOiByZXEuYXVkaXRDb250ZXh0Py5pcEFkZHJlc3MsXG4gICAgICAgICAgdXNlckFnZW50OiByZXEuYXVkaXRDb250ZXh0Py51c2VyQWdlbnRcbiAgICAgICAgfSwgcmVxLmF1ZGl0Q29udGV4dCk7XG5cbiAgICAgICAgcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xuICAgICAgICAgIGVycm9yOiAnQXV0aGVudGljYXRpb24gcmVxdWlyZWQnLFxuICAgICAgICAgIGNvZGU6ICdBVVRIX1JFUVVJUkVEJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBMb2cgdGhlIHJlcXVlc3Qgc3RhcnRcbiAgICAgIGF3YWl0IGxvZ2dlci5pbmZvKCdJbnZlc3RtZW50SWRlYUNvbnRyb2xsZXInLCAnc3VibWl0UmVxdWVzdCcsICdJbnZlc3RtZW50IGlkZWEgZ2VuZXJhdGlvbiByZXF1ZXN0IHN0YXJ0ZWQnLCB7XG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICByZXF1ZXN0Qm9keToge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiByZXEuYm9keS5pbnZlc3RtZW50SG9yaXpvbixcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiByZXEuYm9keS5yaXNrVG9sZXJhbmNlLFxuICAgICAgICAgIHNlY3RvcnM6IHJlcS5ib2R5LnNlY3RvcnM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgIGFzc2V0Q2xhc3NlczogcmVxLmJvZHkuYXNzZXRDbGFzc2VzPy5sZW5ndGggfHwgMFxuICAgICAgICB9XG4gICAgICB9LCByZXEuYXVkaXRDb250ZXh0KTtcblxuICAgICAgLy8gUmVjb3JkIGF1ZGl0IGV2ZW50IGZvciBpbnZlc3RtZW50IGlkZWEgZ2VuZXJhdGlvblxuICAgICAgYXdhaXQgYXVkaXRTZXJ2aWNlLnJlY29yZEF1ZGl0RXZlbnQoe1xuICAgICAgICB1c2VySWQsXG4gICAgICAgIHVzZXJSb2xlOiByZXEuYXVkaXRDb250ZXh0Py51c2VyUm9sZSB8fCAndXNlcicsXG4gICAgICAgIG9yZ2FuaXphdGlvbklkOiByZXEuYXVkaXRDb250ZXh0Py5vcmdhbml6YXRpb25JZCB8fCAnZGVmYXVsdCcsXG4gICAgICAgIGV2ZW50VHlwZTogJ2ludmVzdG1lbnRfaWRlYV9nZW5lcmF0aW9uJyxcbiAgICAgICAgcmVzb3VyY2U6ICdpbnZlc3RtZW50X2lkZWFzJyxcbiAgICAgICAgYWN0aW9uOiAnUE9TVCAvYXBpL3YxL2lkZWFzL2dlbmVyYXRlJyxcbiAgICAgICAgb3V0Y29tZTogJ3N1Y2Nlc3MnLCAvLyBXaWxsIGJlIHVwZGF0ZWQgaWYgdGhlcmUncyBhbiBlcnJvclxuICAgICAgICBkZXRhaWxzOiB7XG4gICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiByZXEuYm9keS5pbnZlc3RtZW50SG9yaXpvbixcbiAgICAgICAgICAgIHJpc2tUb2xlcmFuY2U6IHJlcS5ib2R5LnJpc2tUb2xlcmFuY2UsXG4gICAgICAgICAgICBzZWN0b3JzQ291bnQ6IHJlcS5ib2R5LnNlY3RvcnM/Lmxlbmd0aCB8fCAwLFxuICAgICAgICAgICAgYXNzZXRDbGFzc2VzQ291bnQ6IHJlcS5ib2R5LmFzc2V0Q2xhc3Nlcz8ubGVuZ3RoIHx8IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgIH0sXG4gICAgICAgIGlwQWRkcmVzczogcmVxLmF1ZGl0Q29udGV4dD8uaXBBZGRyZXNzLFxuICAgICAgICB1c2VyQWdlbnQ6IHJlcS5hdWRpdENvbnRleHQ/LnVzZXJBZ2VudCxcbiAgICAgICAgc2Vzc2lvbklkOiByZXEuYXVkaXRDb250ZXh0Py5zZXNzaW9uSWQsXG4gICAgICAgIHJlcXVlc3RJZDogcmVxLmF1ZGl0Q29udGV4dD8ucmVxdWVzdElkLFxuICAgICAgICByaXNrTGV2ZWw6ICdtZWRpdW0nLFxuICAgICAgICBkYXRhQ2xhc3NpZmljYXRpb246ICdjb25maWRlbnRpYWwnXG4gICAgICB9KTtcblxuICAgICAgLy8gQ3JlYXRlIHJlcXVlc3Qgb2JqZWN0XG4gICAgICBjb25zdCByZXF1ZXN0RGF0YTogSW52ZXN0bWVudElkZWFHZW5lcmF0aW9uUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6IHV1aWR2NCgpLFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIHBhcmFtZXRlcnM6IHJlcS5ib2R5LnBhcmFtZXRlcnMsXG4gICAgICAgIHByaW9yaXR5OiByZXEuYm9keS5wcmlvcml0eSB8fCAnbWVkaXVtJyxcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnLFxuICAgICAgICBjYWxsYmFjazogcmVxLmJvZHkuY2FsbGJhY2tcbiAgICAgIH07XG5cbiAgICAgIC8vIFZhbGlkYXRlIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdDogVmFsaWRhdGlvblJlc3VsdCA9IGF3YWl0IHRoaXMudmFsaWRhdGlvblNlcnZpY2UudmFsaWRhdGVSZXF1ZXN0KHJlcXVlc3REYXRhKTtcbiAgICAgIFxuICAgICAgaWYgKCF2YWxpZGF0aW9uUmVzdWx0LmlzVmFsaWQpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xuICAgICAgICAgIGVycm9yOiAnSW52YWxpZCByZXF1ZXN0IHBhcmFtZXRlcnMnLFxuICAgICAgICAgIGNvZGU6ICdWQUxJREFUSU9OX0ZBSUxFRCcsXG4gICAgICAgICAgZGV0YWlsczoge1xuICAgICAgICAgICAgZXJyb3JzOiB2YWxpZGF0aW9uUmVzdWx0LmVycm9ycyxcbiAgICAgICAgICAgIHdhcm5pbmdzOiB2YWxpZGF0aW9uUmVzdWx0Lndhcm5pbmdzXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBTdWJtaXQgcmVxdWVzdCBmb3IgcHJvY2Vzc2luZ1xuICAgICAgY29uc3Qgc3VibWl0dGVkUmVxdWVzdCA9IGF3YWl0IHRoaXMucmVxdWVzdFNlcnZpY2Uuc3VibWl0UmVxdWVzdChyZXF1ZXN0RGF0YSk7XG5cbiAgICAgIC8vIFN0YXJ0IHRyYWNraW5nXG4gICAgICBhd2FpdCB0aGlzLnRyYWNraW5nU2VydmljZS5zdGFydFRyYWNraW5nKHN1Ym1pdHRlZFJlcXVlc3QuaWQpO1xuXG4gICAgICByZXMuc3RhdHVzKDIwMikuanNvbih7XG4gICAgICAgIG1lc3NhZ2U6ICdJbnZlc3RtZW50IGlkZWEgcmVxdWVzdCBzdWJtaXR0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgcmVxdWVzdElkOiBzdWJtaXR0ZWRSZXF1ZXN0LmlkLFxuICAgICAgICBzdGF0dXM6IHN1Ym1pdHRlZFJlcXVlc3Quc3RhdHVzLFxuICAgICAgICBlc3RpbWF0ZWRQcm9jZXNzaW5nVGltZTogc3VibWl0dGVkUmVxdWVzdC5lc3RpbWF0ZWRQcm9jZXNzaW5nVGltZSxcbiAgICAgICAgdHJhY2tpbmdVcmw6IGAvYXBpL3YxL2lkZWFzL3JlcXVlc3RzLyR7c3VibWl0dGVkUmVxdWVzdC5pZH0vc3RhdHVzYFxuICAgICAgfSk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3VibWl0dGluZyBpbnZlc3RtZW50IGlkZWEgcmVxdWVzdDonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgY29kZTogJ0lOVEVSTkFMX0VSUk9SJyxcbiAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzdWJtaXQgaW52ZXN0bWVudCBpZGVhIHJlcXVlc3QnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHJlcXVlc3Qgc3RhdHVzIGFuZCBwcm9ncmVzc1xuICAgKi9cbiAgcHVibGljIGFzeW5jIGdldFJlcXVlc3RTdGF0dXMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgcmVxdWVzdElkIH0gPSByZXEucGFyYW1zO1xuICAgICAgY29uc3QgdXNlcklkID0gcmVxLnVzZXI/LnVzZXJJZDtcblxuICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDEpLmpzb24oe1xuICAgICAgICAgIGVycm9yOiAnQXV0aGVudGljYXRpb24gcmVxdWlyZWQnLFxuICAgICAgICAgIGNvZGU6ICdBVVRIX1JFUVVJUkVEJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXF1ZXN0U3RhdHVzID0gYXdhaXQgdGhpcy50cmFja2luZ1NlcnZpY2UuZ2V0UmVxdWVzdFN0YXR1cyhyZXF1ZXN0SWQsIHVzZXJJZCk7XG5cbiAgICAgIGlmICghcmVxdWVzdFN0YXR1cykge1xuICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgICAgZXJyb3I6ICdSZXF1ZXN0IG5vdCBmb3VuZCcsXG4gICAgICAgICAgY29kZTogJ1JFUVVFU1RfTk9UX0ZPVU5EJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXMuanNvbih7XG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgc3RhdHVzOiByZXF1ZXN0U3RhdHVzLnN0YXR1cyxcbiAgICAgICAgcHJvZ3Jlc3M6IHJlcXVlc3RTdGF0dXMucHJvZ3Jlc3MsXG4gICAgICAgIGVzdGltYXRlZFRpbWVSZW1haW5pbmc6IHJlcXVlc3RTdGF0dXMuZXN0aW1hdGVkVGltZVJlbWFpbmluZyxcbiAgICAgICAgY3VycmVudFN0ZXA6IHJlcXVlc3RTdGF0dXMuY3VycmVudFN0ZXAsXG4gICAgICAgIHJlc3VsdHM6IHJlcXVlc3RTdGF0dXMucmVzdWx0cyxcbiAgICAgICAgZXJyb3JzOiByZXF1ZXN0U3RhdHVzLmVycm9ycyxcbiAgICAgICAgbGFzdFVwZGF0ZWQ6IHJlcXVlc3RTdGF0dXMubGFzdFVwZGF0ZWRcbiAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgcmVxdWVzdCBzdGF0dXM6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGNvZGU6ICdJTlRFUk5BTF9FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZ2V0IHJlcXVlc3Qgc3RhdHVzJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCByZXF1ZXN0IHJlc3VsdHNcbiAgICovXG4gIHB1YmxpYyBhc3luYyBnZXRSZXF1ZXN0UmVzdWx0cyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyByZXF1ZXN0SWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkO1xuXG4gICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICByZXMuc3RhdHVzKDQwMSkuanNvbih7XG4gICAgICAgICAgZXJyb3I6ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcsXG4gICAgICAgICAgY29kZTogJ0FVVEhfUkVRVUlSRUQnXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnJlcXVlc3RTZXJ2aWNlLmdldFJlcXVlc3RSZXN1bHRzKHJlcXVlc3RJZCwgdXNlcklkKTtcblxuICAgICAgaWYgKCFyZXN1bHRzKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgICBlcnJvcjogJ1JlcXVlc3QgcmVzdWx0cyBub3QgZm91bmQnLFxuICAgICAgICAgIGNvZGU6ICdSRVNVTFRTX05PVF9GT1VORCdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdHMuc3RhdHVzICE9PSAnY29tcGxldGVkJykge1xuICAgICAgICByZXMuc3RhdHVzKDIwMikuanNvbih7XG4gICAgICAgICAgbWVzc2FnZTogJ1JlcXVlc3Qgc3RpbGwgcHJvY2Vzc2luZycsXG4gICAgICAgICAgc3RhdHVzOiByZXN1bHRzLnN0YXR1cyxcbiAgICAgICAgICByZXF1ZXN0SWRcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzLmpzb24oe1xuICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgIHN0YXR1czogcmVzdWx0cy5zdGF0dXMsXG4gICAgICAgIGludmVzdG1lbnRJZGVhczogcmVzdWx0cy5pbnZlc3RtZW50SWRlYXMsXG4gICAgICAgIHByb2Nlc3NpbmdNZXRyaWNzOiByZXN1bHRzLnByb2Nlc3NpbmdNZXRyaWNzLFxuICAgICAgICBnZW5lcmF0ZWRBdDogcmVzdWx0cy5nZW5lcmF0ZWRBdCxcbiAgICAgICAgbWV0YWRhdGE6IHJlc3VsdHMubWV0YWRhdGFcbiAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgcmVxdWVzdCByZXN1bHRzOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICBjb2RlOiAnSU5URVJOQUxfRVJST1InLFxuICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdldCByZXF1ZXN0IHJlc3VsdHMnXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FuY2VsIGEgcGVuZGluZyByZXF1ZXN0XG4gICAqL1xuICBwdWJsaWMgYXN5bmMgY2FuY2VsUmVxdWVzdChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyByZXF1ZXN0SWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkO1xuXG4gICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICByZXMuc3RhdHVzKDQwMSkuanNvbih7XG4gICAgICAgICAgZXJyb3I6ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcsXG4gICAgICAgICAgY29kZTogJ0FVVEhfUkVRVUlSRUQnXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNhbmNlbGxlZCA9IGF3YWl0IHRoaXMucmVxdWVzdFNlcnZpY2UuY2FuY2VsUmVxdWVzdChyZXF1ZXN0SWQsIHVzZXJJZCk7XG5cbiAgICAgIGlmICghY2FuY2VsbGVkKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHtcbiAgICAgICAgICBlcnJvcjogJ1JlcXVlc3Qgbm90IGZvdW5kIG9yIGNhbm5vdCBiZSBjYW5jZWxsZWQnLFxuICAgICAgICAgIGNvZGU6ICdDQU5DRUxMQVRJT05fRkFJTEVEJ1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXMuanNvbih7XG4gICAgICAgIG1lc3NhZ2U6ICdSZXF1ZXN0IGNhbmNlbGxlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgIHN0YXR1czogJ2NhbmNlbGxlZCdcbiAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNhbmNlbGxpbmcgcmVxdWVzdDonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgY29kZTogJ0lOVEVSTkFMX0VSUk9SJyxcbiAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBjYW5jZWwgcmVxdWVzdCdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlcidzIHJlcXVlc3QgaGlzdG9yeVxuICAgKi9cbiAgcHVibGljIGFzeW5jIGdldFJlcXVlc3RIaXN0b3J5KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkO1xuICAgICAgY29uc3QgeyBwYWdlID0gMSwgbGltaXQgPSAxMCwgc3RhdHVzLCBkYXRlRnJvbSwgZGF0ZVRvIH0gPSByZXEucXVlcnk7XG5cbiAgICAgIGlmICghdXNlcklkKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoNDAxKS5qc29uKHtcbiAgICAgICAgICBlcnJvcjogJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyxcbiAgICAgICAgICBjb2RlOiAnQVVUSF9SRVFVSVJFRCdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsdGVycyA9IHtcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMgYXMgUmVxdWVzdFN0YXR1cyxcbiAgICAgICAgZGF0ZUZyb206IGRhdGVGcm9tID8gbmV3IERhdGUoZGF0ZUZyb20gYXMgc3RyaW5nKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgZGF0ZVRvOiBkYXRlVG8gPyBuZXcgRGF0ZShkYXRlVG8gYXMgc3RyaW5nKSA6IHVuZGVmaW5lZFxuICAgICAgfTtcblxuICAgICAgY29uc3QgaGlzdG9yeSA9IGF3YWl0IHRoaXMucmVxdWVzdFNlcnZpY2UuZ2V0UmVxdWVzdEhpc3RvcnkoXG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgcGFyc2VJbnQocGFnZSBhcyBzdHJpbmcpLFxuICAgICAgICBwYXJzZUludChsaW1pdCBhcyBzdHJpbmcpLFxuICAgICAgICBmaWx0ZXJzXG4gICAgICApO1xuXG4gICAgICByZXMuanNvbih7XG4gICAgICAgIHJlcXVlc3RzOiBoaXN0b3J5LnJlcXVlc3RzLFxuICAgICAgICBwYWdpbmF0aW9uOiB7XG4gICAgICAgICAgcGFnZTogcGFyc2VJbnQocGFnZSBhcyBzdHJpbmcpLFxuICAgICAgICAgIGxpbWl0OiBwYXJzZUludChsaW1pdCBhcyBzdHJpbmcpLFxuICAgICAgICAgIHRvdGFsOiBoaXN0b3J5LnRvdGFsLFxuICAgICAgICAgIHRvdGFsUGFnZXM6IE1hdGguY2VpbChoaXN0b3J5LnRvdGFsIC8gcGFyc2VJbnQobGltaXQgYXMgc3RyaW5nKSlcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyByZXF1ZXN0IGhpc3Rvcnk6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGNvZGU6ICdJTlRFUk5BTF9FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gZ2V0IHJlcXVlc3QgaGlzdG9yeSdcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgZmVlZGJhY2sgZm9yIGEgY29tcGxldGVkIHJlcXVlc3RcbiAgICovXG4gIHB1YmxpYyBhc3luYyBzdWJtaXRGZWVkYmFjayhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyByZXF1ZXN0SWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgICBjb25zdCB1c2VySWQgPSByZXEudXNlcj8udXNlcklkO1xuICAgICAgY29uc3QgeyByYXRpbmcsIGNvbW1lbnRzLCB1c2VmdWxuZXNzU2NvcmUsIGFjY3VyYWN5U2NvcmUsIGluc2lnaHRTY29yZSwgYWN0aW9uVGFrZW4gfSA9IHJlcS5ib2R5O1xuXG4gICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICByZXMuc3RhdHVzKDQwMSkuanNvbih7XG4gICAgICAgICAgZXJyb3I6ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcsXG4gICAgICAgICAgY29kZTogJ0FVVEhfUkVRVUlSRUQnXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZlZWRiYWNrID0gYXdhaXQgdGhpcy5yZXF1ZXN0U2VydmljZS5zdWJtaXRGZWVkYmFjayhyZXF1ZXN0SWQsIHVzZXJJZCwge1xuICAgICAgICByYXRpbmcsXG4gICAgICAgIGNvbW1lbnRzLFxuICAgICAgICB1c2VmdWxuZXNzU2NvcmUsXG4gICAgICAgIGFjY3VyYWN5U2NvcmUsXG4gICAgICAgIGluc2lnaHRTY29yZSxcbiAgICAgICAgYWN0aW9uVGFrZW4sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgfSk7XG5cbiAgICAgIGlmICghZmVlZGJhY2spIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICAgIGVycm9yOiAnUmVxdWVzdCBub3QgZm91bmQnLFxuICAgICAgICAgIGNvZGU6ICdSRVFVRVNUX05PVF9GT1VORCdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzLmpzb24oe1xuICAgICAgICBtZXNzYWdlOiAnRmVlZGJhY2sgc3VibWl0dGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgZmVlZGJhY2tJZDogZmVlZGJhY2suaWRcbiAgICAgIH0pO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN1Ym1pdHRpbmcgZmVlZGJhY2s6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGNvZGU6ICdJTlRFUk5BTF9FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gc3VibWl0IGZlZWRiYWNrJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59Il19