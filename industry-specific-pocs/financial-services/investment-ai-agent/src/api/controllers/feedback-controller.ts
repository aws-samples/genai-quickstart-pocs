// Feedback controller for handling feedback-related API requests

import { Request, Response } from 'express';
import { feedbackService } from '../../services/feedback-service';
import {
  Feedback,
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackFilter,
  FeedbackSearchOptions
} from '../../models/feedback';

export class FeedbackController {
  /**
   * Submit new feedback
   * POST /api/v1/feedback
   */
  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const feedbackData = req.body;
      
      // Add user ID from authenticated session
      if (req.user) {
        feedbackData.userId = req.user.userId;
      }

      // Add metadata from request
      feedbackData.metadata = {
        ...feedbackData.metadata,
        source: 'web',
        userAgent: req.get('User-Agent'),
        sessionId: (req as any).sessionID || 'unknown'
      };

      const result = await feedbackService.submitFeedback(feedbackData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Feedback submitted successfully',
          data: result.feedback
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to submit feedback',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Error in submitFeedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feedback by ID
   * GET /api/v1/feedback/:id
   */
  async getFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const feedback = await feedbackService.getFeedback(id);

      if (feedback) {
        // Check if user has permission to view this feedback
        if (req.user && (req.user.userId === feedback.userId || req.user.role === 'administrator')) {
          res.json({
            success: true,
            data: feedback
          });
        } else {
          res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      } else {
        res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }
    } catch (error) {
      console.error('Error in getFeedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search feedback with filters
   * GET /api/v1/feedback/search
   */
  async searchFeedback(req: Request, res: Response): Promise<void> {
    try {
      const options: FeedbackSearchOptions = {
        query: req.query.q as string,
        sortBy: req.query.sortBy as 'createdAt' | 'updatedAt' | 'rating' | 'priority' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      // Build filters from query parameters
      const filters: FeedbackFilter = {};
      
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.investmentIdeaId) filters.investmentIdeaId = req.query.investmentIdeaId as string;
      if (req.query.analysisId) filters.analysisId = req.query.analysisId as string;
      if (req.query.feedbackType) {
        filters.feedbackType = Array.isArray(req.query.feedbackType) 
          ? req.query.feedbackType as FeedbackType[]
          : [req.query.feedbackType as FeedbackType];
      }
      if (req.query.category) {
        filters.category = Array.isArray(req.query.category)
          ? req.query.category as FeedbackCategory[]
          : [req.query.category as FeedbackCategory];
      }
      if (req.query.status) {
        filters.status = Array.isArray(req.query.status)
          ? req.query.status as FeedbackStatus[]
          : [req.query.status as FeedbackStatus];
      }
      if (req.query.sentiment) {
        filters.sentiment = Array.isArray(req.query.sentiment)
          ? req.query.sentiment as ('positive' | 'neutral' | 'negative')[]
          : [req.query.sentiment as ('positive' | 'neutral' | 'negative')];
      }
      if (req.query.priority) {
        filters.priority = Array.isArray(req.query.priority)
          ? req.query.priority as ('low' | 'medium' | 'high')[]
          : [req.query.priority as ('low' | 'medium' | 'high')];
      }

      // Rating range
      if (req.query.minRating || req.query.maxRating) {
        filters.rating = {
          min: req.query.minRating ? parseInt(req.query.minRating as string) : undefined,
          max: req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined
        };
      }

      // Date range
      if (req.query.startDate || req.query.endDate) {
        filters.dateRange = {
          start: req.query.startDate ? new Date(req.query.startDate as string) : new Date(0),
          end: req.query.endDate ? new Date(req.query.endDate as string) : new Date()
        };
      }

      // Tags
      if (req.query.tags) {
        filters.tags = Array.isArray(req.query.tags)
          ? req.query.tags as string[]
          : [req.query.tags as string];
      }

      options.filters = filters;

      // For non-admin users, filter to only their feedback
      if (req.user && req.user.role !== 'administrator') {
        options.filters.userId = req.user.userId;
      }

      const result = await feedbackService.searchFeedback(options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error in searchFeedback:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update feedback status (admin only)
   * PUT /api/v1/feedback/:id/status
   */
  async updateFeedbackStatus(req: Request, res: Response): Promise<void> {
    try {
      // Check admin permissions
      if (!req.user || req.user.role !== 'administrator') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const { id } = req.params;
      const { status, resolution } = req.body;

      const success = await feedbackService.updateFeedbackStatus(
        id,
        status,
        req.user.userId,
        resolution
      );

      if (success) {
        res.json({
          success: true,
          message: 'Feedback status updated successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }
    } catch (error) {
      console.error('Error in updateFeedbackStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feedback summary
   * GET /api/v1/feedback/summary
   */
  async getFeedbackSummary(req: Request, res: Response): Promise<void> {
    try {
      // Check admin permissions
      if (!req.user || req.user.role !== 'administrator') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      // Build filters if provided
      const filters: FeedbackFilter = {};
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.feedbackType) {
        filters.feedbackType = Array.isArray(req.query.feedbackType)
          ? req.query.feedbackType as FeedbackType[]
          : [req.query.feedbackType as FeedbackType];
      }

      const summary = await feedbackService.getFeedbackSummary(startDate, endDate, filters);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getFeedbackSummary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feedback analytics
   * GET /api/v1/feedback/analytics
   */
  async getFeedbackAnalytics(req: Request, res: Response): Promise<void> {
    try {
      // Check admin permissions
      if (!req.user || req.user.role !== 'administrator') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const analytics = await feedbackService.generateFeedbackAnalytics({
        start: startDate,
        end: endDate
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error in getFeedbackAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feedback for investment idea
   * GET /api/v1/feedback/investment-idea/:id
   */
  async getFeedbackForInvestmentIdea(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const feedback = await feedbackService.getFeedbackForInvestmentIdea(id);

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Error in getFeedbackForInvestmentIdea:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user's feedback
   * GET /api/v1/feedback/user/:userId
   */
  async getFeedbackForUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Check permissions - users can only see their own feedback unless admin
      if (req.user && (req.user.userId === userId || req.user.role === 'administrator')) {
        const feedback = await feedbackService.getFeedbackForUser(userId);

        res.json({
          success: true,
          data: feedback
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } catch (error) {
      console.error('Error in getFeedbackForUser:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const feedbackController = new FeedbackController();