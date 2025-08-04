/**
 * Investment Idea Request Controller
 * Handles investment idea generation requests, validation, and tracking
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { InvestmentIdeaRequestService } from '../../services/investment-idea-request-service';
import { RequestValidationService } from '../../services/request-validation-service';
import { RequestTrackingService } from '../../services/request-tracking-service';
import { 
  InvestmentIdeaGenerationRequest, 
  InvestmentIdeaRequestParameters,
  RequestStatus 
} from '../../models/investment-idea-request';
import { ValidationResult } from '../../models/investment-idea';
import { logger } from '../../services/logging/logger';
import { auditService } from '../../services/logging/audit-service';
import { AuditableRequest } from '../middleware/audit-logging';

export class InvestmentIdeaController {
  private requestService: InvestmentIdeaRequestService;
  private validationService: RequestValidationService;
  private trackingService: RequestTrackingService;

  constructor(
    requestService: InvestmentIdeaRequestService,
    validationService: RequestValidationService,
    trackingService: RequestTrackingService
  ) {
    this.requestService = requestService;
    this.validationService = validationService;
    this.trackingService = trackingService;
  }

  /**
   * Submit a new investment idea generation request
   */
  public async submitRequest(req: AuditableRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = req.auditContext?.requestId || uuidv4();
    
    try {
      const userId = req.user?.userId;
      if (!userId) {
        await logger.warn('InvestmentIdeaController', 'submitRequest', 'Unauthorized request attempt', {
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
      await logger.info('InvestmentIdeaController', 'submitRequest', 'Investment idea generation request started', {
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
      await auditService.recordAuditEvent({
        userId,
        userRole: req.auditContext?.userRole || 'user',
        organizationId: req.auditContext?.organizationId || 'default',
        eventType: 'investment_idea_generation',
        resource: 'investment_ideas',
        action: 'POST /api/v1/ideas/generate',
        outcome: 'success', // Will be updated if there's an error
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
      const requestData: InvestmentIdeaGenerationRequest = {
        id: uuidv4(),
        userId,
        parameters: req.body.parameters,
        priority: req.body.priority || 'medium',
        timestamp: new Date(),
        status: 'submitted',
        callback: req.body.callback
      };

      // Validate request parameters
      const validationResult: ValidationResult = await this.validationService.validateRequest(requestData);
      
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

    } catch (error) {
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
  public async getRequestStatus(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
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
  public async getRequestResults(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
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
  public async cancelRequest(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
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
  public async getRequestHistory(req: Request, res: Response): Promise<void> {
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
        status: status as RequestStatus,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      const history = await this.requestService.getRequestHistory(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.json({
        requests: history.requests,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: history.total,
          totalPages: Math.ceil(history.total / parseInt(limit as string))
        }
      });

    } catch (error) {
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
  public async submitFeedback(req: Request, res: Response): Promise<void> {
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

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to submit feedback'
      });
    }
  }
}