/**
 * Investment Idea Request Controller
 * Handles investment idea generation requests, validation, and tracking
 */
import { Request, Response } from 'express';
import { InvestmentIdeaRequestService } from '../../services/investment-idea-request-service';
import { RequestValidationService } from '../../services/request-validation-service';
import { RequestTrackingService } from '../../services/request-tracking-service';
import { AuditableRequest } from '../middleware/audit-logging';
export declare class InvestmentIdeaController {
    private requestService;
    private validationService;
    private trackingService;
    constructor(requestService: InvestmentIdeaRequestService, validationService: RequestValidationService, trackingService: RequestTrackingService);
    /**
     * Submit a new investment idea generation request
     */
    submitRequest(req: AuditableRequest, res: Response): Promise<void>;
    /**
     * Get request status and progress
     */
    getRequestStatus(req: Request, res: Response): Promise<void>;
    /**
     * Get request results
     */
    getRequestResults(req: Request, res: Response): Promise<void>;
    /**
     * Cancel a pending request
     */
    cancelRequest(req: Request, res: Response): Promise<void>;
    /**
     * Get user's request history
     */
    getRequestHistory(req: Request, res: Response): Promise<void>;
    /**
     * Submit feedback for a completed request
     */
    submitFeedback(req: Request, res: Response): Promise<void>;
}
