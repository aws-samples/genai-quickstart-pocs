import { Request, Response } from 'express';
export declare class FeedbackController {
    /**
     * Submit new feedback
     * POST /api/v1/feedback
     */
    submitFeedback(req: Request, res: Response): Promise<void>;
    /**
     * Get feedback by ID
     * GET /api/v1/feedback/:id
     */
    getFeedback(req: Request, res: Response): Promise<void>;
    /**
     * Search feedback with filters
     * GET /api/v1/feedback/search
     */
    searchFeedback(req: Request, res: Response): Promise<void>;
    /**
     * Update feedback status (admin only)
     * PUT /api/v1/feedback/:id/status
     */
    updateFeedbackStatus(req: Request, res: Response): Promise<void>;
    /**
     * Get feedback summary
     * GET /api/v1/feedback/summary
     */
    getFeedbackSummary(req: Request, res: Response): Promise<void>;
    /**
     * Get feedback analytics
     * GET /api/v1/feedback/analytics
     */
    getFeedbackAnalytics(req: Request, res: Response): Promise<void>;
    /**
     * Get feedback for investment idea
     * GET /api/v1/feedback/investment-idea/:id
     */
    getFeedbackForInvestmentIdea(req: Request, res: Response): Promise<void>;
    /**
     * Get user's feedback
     * GET /api/v1/feedback/user/:userId
     */
    getFeedbackForUser(req: Request, res: Response): Promise<void>;
}
export declare const feedbackController: FeedbackController;
