// Feedback routes for the Investment AI Agent API

import { Router } from 'express';
import { feedbackController } from '../controllers/feedback-controller';
import { authenticateUser } from '../middleware/auth';
import { validationMiddleware } from '../middleware/validation';

const router = Router();

// Feedback submission validation schema
const feedbackSubmissionSchema = {
  type: 'object',
  required: ['feedbackType', 'category', 'title', 'description', 'rating'],
  properties: {
    investmentIdeaId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    analysisId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    requestId: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    feedbackType: {
      type: 'string',
      enum: [
        'investment-idea-quality',
        'analysis-accuracy',
        'system-performance',
        'user-experience',
        'feature-request',
        'bug-report',
        'general'
      ]
    },
    category: {
      type: 'string',
      enum: [
        'accuracy',
        'relevance',
        'completeness',
        'timeliness',
        'usability',
        'performance',
        'compliance',
        'other'
      ]
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200
    },
    description: {
      type: 'string',
      minLength: 1,
      maxLength: 2000
    },
    rating: {
      type: 'integer',
      minimum: 1,
      maximum: 5
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
        maxLength: 50
      },
      maxItems: 10
    },
    metadata: {
      type: 'object',
      properties: {
        contextData: {
          type: 'object'
        },
        relatedFeedback: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    }
  },
  additionalProperties: false
};

// Status update validation schema
const statusUpdateSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['submitted', 'under-review', 'in-progress', 'resolved', 'dismissed', 'archived']
    },
    resolution: {
      type: 'string',
      minLength: 1,
      maxLength: 1000
    }
  },
  additionalProperties: false
};

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * @route POST /api/v1/feedback
 * @desc Submit new feedback
 * @access Private
 */
router.post(
  '/',
  validationMiddleware({ body: feedbackSubmissionSchema }),
  feedbackController.submitFeedback.bind(feedbackController)
);

/**
 * @route GET /api/v1/feedback/search
 * @desc Search feedback with filters
 * @access Private (Admin for all feedback, users for their own)
 * @query {string} q - Search query
 * @query {string} userId - Filter by user ID
 * @query {string} investmentIdeaId - Filter by investment idea ID
 * @query {string} analysisId - Filter by analysis ID
 * @query {string|string[]} feedbackType - Filter by feedback type
 * @query {string|string[]} category - Filter by category
 * @query {string|string[]} status - Filter by status
 * @query {string|string[]} sentiment - Filter by sentiment
 * @query {string|string[]} priority - Filter by priority
 * @query {number} minRating - Minimum rating filter
 * @query {number} maxRating - Maximum rating filter
 * @query {string} startDate - Start date filter (ISO string)
 * @query {string} endDate - End date filter (ISO string)
 * @query {string|string[]} tags - Filter by tags
 * @query {string} sortBy - Sort field (createdAt, updatedAt, rating, priority)
 * @query {string} sortOrder - Sort order (asc, desc)
 * @query {number} limit - Results limit
 * @query {number} offset - Results offset
 */
router.get(
  '/search',
  feedbackController.searchFeedback.bind(feedbackController)
);

/**
 * @route GET /api/v1/feedback/summary
 * @desc Get feedback summary statistics
 * @access Admin only
 * @query {string} startDate - Start date (ISO string)
 * @query {string} endDate - End date (ISO string)
 * @query {string} userId - Filter by user ID
 * @query {string|string[]} feedbackType - Filter by feedback type
 */
router.get(
  '/summary',
  feedbackController.getFeedbackSummary.bind(feedbackController)
);

/**
 * @route GET /api/v1/feedback/analytics
 * @desc Get feedback analytics and insights
 * @access Admin only
 * @query {string} startDate - Start date (ISO string)
 * @query {string} endDate - End date (ISO string)
 */
router.get(
  '/analytics',
  feedbackController.getFeedbackAnalytics.bind(feedbackController)
);

/**
 * @route GET /api/v1/feedback/investment-idea/:id
 * @desc Get feedback for a specific investment idea
 * @access Private
 */
router.get(
  '/investment-idea/:id',
  feedbackController.getFeedbackForInvestmentIdea.bind(feedbackController)
);

/**
 * @route GET /api/v1/feedback/user/:userId
 * @desc Get feedback for a specific user
 * @access Private (users can only access their own feedback unless admin)
 */
router.get(
  '/user/:userId',
  feedbackController.getFeedbackForUser.bind(feedbackController)
);

/**
 * @route GET /api/v1/feedback/:id
 * @desc Get feedback by ID
 * @access Private (users can only access their own feedback unless admin)
 */
router.get(
  '/:id',
  feedbackController.getFeedback.bind(feedbackController)
);

/**
 * @route PUT /api/v1/feedback/:id/status
 * @desc Update feedback status
 * @access Admin only
 */
router.put(
  '/:id/status',
  validationMiddleware({ body: statusUpdateSchema }),
  feedbackController.updateFeedbackStatus.bind(feedbackController)
);

export default router;