"use strict";
// Feedback routes for the Investment AI Agent API
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_1 = require("../controllers/feedback-controller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
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
router.use(auth_1.authenticateUser);
/**
 * @route POST /api/v1/feedback
 * @desc Submit new feedback
 * @access Private
 */
router.post('/', (0, validation_1.validationMiddleware)({ body: feedbackSubmissionSchema }), feedback_controller_1.feedbackController.submitFeedback.bind(feedback_controller_1.feedbackController));
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
router.get('/search', feedback_controller_1.feedbackController.searchFeedback.bind(feedback_controller_1.feedbackController));
/**
 * @route GET /api/v1/feedback/summary
 * @desc Get feedback summary statistics
 * @access Admin only
 * @query {string} startDate - Start date (ISO string)
 * @query {string} endDate - End date (ISO string)
 * @query {string} userId - Filter by user ID
 * @query {string|string[]} feedbackType - Filter by feedback type
 */
router.get('/summary', feedback_controller_1.feedbackController.getFeedbackSummary.bind(feedback_controller_1.feedbackController));
/**
 * @route GET /api/v1/feedback/analytics
 * @desc Get feedback analytics and insights
 * @access Admin only
 * @query {string} startDate - Start date (ISO string)
 * @query {string} endDate - End date (ISO string)
 */
router.get('/analytics', feedback_controller_1.feedbackController.getFeedbackAnalytics.bind(feedback_controller_1.feedbackController));
/**
 * @route GET /api/v1/feedback/investment-idea/:id
 * @desc Get feedback for a specific investment idea
 * @access Private
 */
router.get('/investment-idea/:id', feedback_controller_1.feedbackController.getFeedbackForInvestmentIdea.bind(feedback_controller_1.feedbackController));
/**
 * @route GET /api/v1/feedback/user/:userId
 * @desc Get feedback for a specific user
 * @access Private (users can only access their own feedback unless admin)
 */
router.get('/user/:userId', feedback_controller_1.feedbackController.getFeedbackForUser.bind(feedback_controller_1.feedbackController));
/**
 * @route GET /api/v1/feedback/:id
 * @desc Get feedback by ID
 * @access Private (users can only access their own feedback unless admin)
 */
router.get('/:id', feedback_controller_1.feedbackController.getFeedback.bind(feedback_controller_1.feedbackController));
/**
 * @route PUT /api/v1/feedback/:id/status
 * @desc Update feedback status
 * @access Admin only
 */
router.put('/:id/status', (0, validation_1.validationMiddleware)({ body: statusUpdateSchema }), feedback_controller_1.feedbackController.updateFeedbackStatus.bind(feedback_controller_1.feedbackController));
exports.default = router;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2stcm91dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS9yb3V0ZXMvZmVlZGJhY2stcm91dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrREFBa0Q7O0FBRWxELHFDQUFpQztBQUNqQyw0RUFBd0U7QUFDeEUsNkNBQXNEO0FBQ3RELHlEQUFnRTtBQUVoRSxNQUFNLE1BQU0sR0FBRyxJQUFBLGdCQUFNLEdBQUUsQ0FBQztBQUV4Qix3Q0FBd0M7QUFDeEMsTUFBTSx3QkFBd0IsR0FBRztJQUMvQixJQUFJLEVBQUUsUUFBUTtJQUNkLFFBQVEsRUFBRSxDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUM7SUFDeEUsVUFBVSxFQUFFO1FBQ1YsZ0JBQWdCLEVBQUU7WUFDaEIsSUFBSSxFQUFFLFFBQVE7WUFDZCxTQUFTLEVBQUUsQ0FBQztZQUNaLFNBQVMsRUFBRSxHQUFHO1NBQ2Y7UUFDRCxVQUFVLEVBQUU7WUFDVixJQUFJLEVBQUUsUUFBUTtZQUNkLFNBQVMsRUFBRSxDQUFDO1lBQ1osU0FBUyxFQUFFLEdBQUc7U0FDZjtRQUNELFNBQVMsRUFBRTtZQUNULElBQUksRUFBRSxRQUFRO1lBQ2QsU0FBUyxFQUFFLENBQUM7WUFDWixTQUFTLEVBQUUsR0FBRztTQUNmO1FBQ0QsWUFBWSxFQUFFO1lBQ1osSUFBSSxFQUFFLFFBQVE7WUFDZCxJQUFJLEVBQUU7Z0JBQ0oseUJBQXlCO2dCQUN6QixtQkFBbUI7Z0JBQ25CLG9CQUFvQjtnQkFDcEIsaUJBQWlCO2dCQUNqQixpQkFBaUI7Z0JBQ2pCLFlBQVk7Z0JBQ1osU0FBUzthQUNWO1NBQ0Y7UUFDRCxRQUFRLEVBQUU7WUFDUixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRTtnQkFDSixVQUFVO2dCQUNWLFdBQVc7Z0JBQ1gsY0FBYztnQkFDZCxZQUFZO2dCQUNaLFdBQVc7Z0JBQ1gsYUFBYTtn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QWtCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyx3Q0FBa0IsQ0FBQyxDQUN4RCxDQUFDO0FBRUY7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxHQUFHLENBQ1IsYUFBYSxFQUNiLElBQUEsaUNBQW9CLEVBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxFQUNsRCx3Q0FBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsd0NBQWtCLENBQUMsQ0FDakUsQ0FBQztBQUVGLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEZlZWRiYWNrIHJvdXRlcyBmb3IgdGhlIEludmVzdG1lbnQgQUkgQWdlbnQgQVBJXG5cbmltcG9ydCB7IFJvdXRlciB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgZmVlZGJhY2tDb250cm9sbGVyIH0gZnJvbSAnLi4vY29udHJvbGxlcnMvZmVlZGJhY2stY29udHJvbGxlcic7XG5pbXBvcnQgeyBhdXRoZW50aWNhdGVVc2VyIH0gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoJztcbmltcG9ydCB7IHZhbGlkYXRpb25NaWRkbGV3YXJlIH0gZnJvbSAnLi4vbWlkZGxld2FyZS92YWxpZGF0aW9uJztcblxuY29uc3Qgcm91dGVyID0gUm91dGVyKCk7XG5cbi8vIEZlZWRiYWNrIHN1Ym1pc3Npb24gdmFsaWRhdGlvbiBzY2hlbWFcbmNvbnN0IGZlZWRiYWNrU3VibWlzc2lvblNjaGVtYSA9IHtcbiAgdHlwZTogJ29iamVjdCcsXG4gIHJlcXVpcmVkOiBbJ2ZlZWRiYWNrVHlwZScsICdjYXRlZ29yeScsICd0aXRsZScsICdkZXNjcmlwdGlvbicsICdyYXRpbmcnXSxcbiAgcHJvcGVydGllczoge1xuICAgIGludmVzdG1lbnRJZGVhSWQ6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgbWF4TGVuZ3RoOiAxMDBcbiAgICB9LFxuICAgIGFuYWx5c2lzSWQ6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgbWF4TGVuZ3RoOiAxMDBcbiAgICB9LFxuICAgIHJlcXVlc3RJZDoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBtaW5MZW5ndGg6IDEsXG4gICAgICBtYXhMZW5ndGg6IDEwMFxuICAgIH0sXG4gICAgZmVlZGJhY2tUeXBlOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGVudW06IFtcbiAgICAgICAgJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyxcbiAgICAgICAgJ2FuYWx5c2lzLWFjY3VyYWN5JyxcbiAgICAgICAgJ3N5c3RlbS1wZXJmb3JtYW5jZScsXG4gICAgICAgICd1c2VyLWV4cGVyaWVuY2UnLFxuICAgICAgICAnZmVhdHVyZS1yZXF1ZXN0JyxcbiAgICAgICAgJ2J1Zy1yZXBvcnQnLFxuICAgICAgICAnZ2VuZXJhbCdcbiAgICAgIF1cbiAgICB9LFxuICAgIGNhdGVnb3J5OiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIGVudW06IFtcbiAgICAgICAgJ2FjY3VyYWN5JyxcbiAgICAgICAgJ3JlbGV2YW5jZScsXG4gICAgICAgICdjb21wbGV0ZW5lc3MnLFxuICAgICAgICAndGltZWxpbmVzcycsXG4gICAgICAgICd1c2FiaWxpdHknLFxuICAgICAgICAncGVyZm9ybWFuY2UnLFxuICAgICAgICAnY29tcGxpYW5jZScsXG4gICAgICAgICdvdGhlcidcbiAgICAgIF1cbiAgICB9LFxuICAgIHRpdGxlOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIG1pbkxlbmd0aDogMSxcbiAgICAgIG1heExlbmd0aDogMjAwXG4gICAgfSxcbiAgICBkZXNjcmlwdGlvbjoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBtaW5MZW5ndGg6IDEsXG4gICAgICBtYXhMZW5ndGg6IDIwMDBcbiAgICB9LFxuICAgIHJhdGluZzoge1xuICAgICAgdHlwZTogJ2ludGVnZXInLFxuICAgICAgbWluaW11bTogMSxcbiAgICAgIG1heGltdW06IDVcbiAgICB9LFxuICAgIHRhZ3M6IHtcbiAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICBpdGVtczoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgICBtYXhMZW5ndGg6IDUwXG4gICAgICB9LFxuICAgICAgbWF4SXRlbXM6IDEwXG4gICAgfSxcbiAgICBtZXRhZGF0YToge1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNvbnRleHREYXRhOiB7XG4gICAgICAgICAgdHlwZTogJ29iamVjdCdcbiAgICAgICAgfSxcbiAgICAgICAgcmVsYXRlZEZlZWRiYWNrOiB7XG4gICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICBpdGVtczoge1xuICAgICAgICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZVxufTtcblxuLy8gU3RhdHVzIHVwZGF0ZSB2YWxpZGF0aW9uIHNjaGVtYVxuY29uc3Qgc3RhdHVzVXBkYXRlU2NoZW1hID0ge1xuICB0eXBlOiAnb2JqZWN0JyxcbiAgcmVxdWlyZWQ6IFsnc3RhdHVzJ10sXG4gIHByb3BlcnRpZXM6IHtcbiAgICBzdGF0dXM6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZW51bTogWydzdWJtaXR0ZWQnLCAndW5kZXItcmV2aWV3JywgJ2luLXByb2dyZXNzJywgJ3Jlc29sdmVkJywgJ2Rpc21pc3NlZCcsICdhcmNoaXZlZCddXG4gICAgfSxcbiAgICByZXNvbHV0aW9uOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIG1pbkxlbmd0aDogMSxcbiAgICAgIG1heExlbmd0aDogMTAwMFxuICAgIH1cbiAgfSxcbiAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlXG59O1xuXG4vLyBBcHBseSBhdXRoZW50aWNhdGlvbiBtaWRkbGV3YXJlIHRvIGFsbCByb3V0ZXNcbnJvdXRlci51c2UoYXV0aGVudGljYXRlVXNlcik7XG5cbi8qKlxuICogQHJvdXRlIFBPU1QgL2FwaS92MS9mZWVkYmFja1xuICogQGRlc2MgU3VibWl0IG5ldyBmZWVkYmFja1xuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5wb3N0KFxuICAnLycsXG4gIHZhbGlkYXRpb25NaWRkbGV3YXJlKHsgYm9keTogZmVlZGJhY2tTdWJtaXNzaW9uU2NoZW1hIH0pLFxuICBmZWVkYmFja0NvbnRyb2xsZXIuc3VibWl0RmVlZGJhY2suYmluZChmZWVkYmFja0NvbnRyb2xsZXIpXG4pO1xuXG4vKipcbiAqIEByb3V0ZSBHRVQgL2FwaS92MS9mZWVkYmFjay9zZWFyY2hcbiAqIEBkZXNjIFNlYXJjaCBmZWVkYmFjayB3aXRoIGZpbHRlcnNcbiAqIEBhY2Nlc3MgUHJpdmF0ZSAoQWRtaW4gZm9yIGFsbCBmZWVkYmFjaywgdXNlcnMgZm9yIHRoZWlyIG93bilcbiAqIEBxdWVyeSB7c3RyaW5nfSBxIC0gU2VhcmNoIHF1ZXJ5XG4gKiBAcXVlcnkge3N0cmluZ30gdXNlcklkIC0gRmlsdGVyIGJ5IHVzZXIgSURcbiAqIEBxdWVyeSB7c3RyaW5nfSBpbnZlc3RtZW50SWRlYUlkIC0gRmlsdGVyIGJ5IGludmVzdG1lbnQgaWRlYSBJRFxuICogQHF1ZXJ5IHtzdHJpbmd9IGFuYWx5c2lzSWQgLSBGaWx0ZXIgYnkgYW5hbHlzaXMgSURcbiAqIEBxdWVyeSB7c3RyaW5nfHN0cmluZ1tdfSBmZWVkYmFja1R5cGUgLSBGaWx0ZXIgYnkgZmVlZGJhY2sgdHlwZVxuICogQHF1ZXJ5IHtzdHJpbmd8c3RyaW5nW119IGNhdGVnb3J5IC0gRmlsdGVyIGJ5IGNhdGVnb3J5XG4gKiBAcXVlcnkge3N0cmluZ3xzdHJpbmdbXX0gc3RhdHVzIC0gRmlsdGVyIGJ5IHN0YXR1c1xuICogQHF1ZXJ5IHtzdHJpbmd8c3RyaW5nW119IHNlbnRpbWVudCAtIEZpbHRlciBieSBzZW50aW1lbnRcbiAqIEBxdWVyeSB7c3RyaW5nfHN0cmluZ1tdfSBwcmlvcml0eSAtIEZpbHRlciBieSBwcmlvcml0eVxuICogQHF1ZXJ5IHtudW1iZXJ9IG1pblJhdGluZyAtIE1pbmltdW0gcmF0aW5nIGZpbHRlclxuICogQHF1ZXJ5IHtudW1iZXJ9IG1heFJhdGluZyAtIE1heGltdW0gcmF0aW5nIGZpbHRlclxuICogQHF1ZXJ5IHtzdHJpbmd9IHN0YXJ0RGF0ZSAtIFN0YXJ0IGRhdGUgZmlsdGVyIChJU08gc3RyaW5nKVxuICogQHF1ZXJ5IHtzdHJpbmd9IGVuZERhdGUgLSBFbmQgZGF0ZSBmaWx0ZXIgKElTTyBzdHJpbmcpXG4gKiBAcXVlcnkge3N0cmluZ3xzdHJpbmdbXX0gdGFncyAtIEZpbHRlciBieSB0YWdzXG4gKiBAcXVlcnkge3N0cmluZ30gc29ydEJ5IC0gU29ydCBmaWVsZCAoY3JlYXRlZEF0LCB1cGRhdGVkQXQsIHJhdGluZywgcHJpb3JpdHkpXG4gKiBAcXVlcnkge3N0cmluZ30gc29ydE9yZGVyIC0gU29ydCBvcmRlciAoYXNjLCBkZXNjKVxuICogQHF1ZXJ5IHtudW1iZXJ9IGxpbWl0IC0gUmVzdWx0cyBsaW1pdFxuICogQHF1ZXJ5IHtudW1iZXJ9IG9mZnNldCAtIFJlc3VsdHMgb2Zmc2V0XG4gKi9cbnJvdXRlci5nZXQoXG4gICcvc2VhcmNoJyxcbiAgZmVlZGJhY2tDb250cm9sbGVyLnNlYXJjaEZlZWRiYWNrLmJpbmQoZmVlZGJhY2tDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvZmVlZGJhY2svc3VtbWFyeVxuICogQGRlc2MgR2V0IGZlZWRiYWNrIHN1bW1hcnkgc3RhdGlzdGljc1xuICogQGFjY2VzcyBBZG1pbiBvbmx5XG4gKiBAcXVlcnkge3N0cmluZ30gc3RhcnREYXRlIC0gU3RhcnQgZGF0ZSAoSVNPIHN0cmluZylcbiAqIEBxdWVyeSB7c3RyaW5nfSBlbmREYXRlIC0gRW5kIGRhdGUgKElTTyBzdHJpbmcpXG4gKiBAcXVlcnkge3N0cmluZ30gdXNlcklkIC0gRmlsdGVyIGJ5IHVzZXIgSURcbiAqIEBxdWVyeSB7c3RyaW5nfHN0cmluZ1tdfSBmZWVkYmFja1R5cGUgLSBGaWx0ZXIgYnkgZmVlZGJhY2sgdHlwZVxuICovXG5yb3V0ZXIuZ2V0KFxuICAnL3N1bW1hcnknLFxuICBmZWVkYmFja0NvbnRyb2xsZXIuZ2V0RmVlZGJhY2tTdW1tYXJ5LmJpbmQoZmVlZGJhY2tDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvZmVlZGJhY2svYW5hbHl0aWNzXG4gKiBAZGVzYyBHZXQgZmVlZGJhY2sgYW5hbHl0aWNzIGFuZCBpbnNpZ2h0c1xuICogQGFjY2VzcyBBZG1pbiBvbmx5XG4gKiBAcXVlcnkge3N0cmluZ30gc3RhcnREYXRlIC0gU3RhcnQgZGF0ZSAoSVNPIHN0cmluZylcbiAqIEBxdWVyeSB7c3RyaW5nfSBlbmREYXRlIC0gRW5kIGRhdGUgKElTTyBzdHJpbmcpXG4gKi9cbnJvdXRlci5nZXQoXG4gICcvYW5hbHl0aWNzJyxcbiAgZmVlZGJhY2tDb250cm9sbGVyLmdldEZlZWRiYWNrQW5hbHl0aWNzLmJpbmQoZmVlZGJhY2tDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvZmVlZGJhY2svaW52ZXN0bWVudC1pZGVhLzppZFxuICogQGRlc2MgR2V0IGZlZWRiYWNrIGZvciBhIHNwZWNpZmljIGludmVzdG1lbnQgaWRlYVxuICogQGFjY2VzcyBQcml2YXRlXG4gKi9cbnJvdXRlci5nZXQoXG4gICcvaW52ZXN0bWVudC1pZGVhLzppZCcsXG4gIGZlZWRiYWNrQ29udHJvbGxlci5nZXRGZWVkYmFja0ZvckludmVzdG1lbnRJZGVhLmJpbmQoZmVlZGJhY2tDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvZmVlZGJhY2svdXNlci86dXNlcklkXG4gKiBAZGVzYyBHZXQgZmVlZGJhY2sgZm9yIGEgc3BlY2lmaWMgdXNlclxuICogQGFjY2VzcyBQcml2YXRlICh1c2VycyBjYW4gb25seSBhY2Nlc3MgdGhlaXIgb3duIGZlZWRiYWNrIHVubGVzcyBhZG1pbilcbiAqL1xucm91dGVyLmdldChcbiAgJy91c2VyLzp1c2VySWQnLFxuICBmZWVkYmFja0NvbnRyb2xsZXIuZ2V0RmVlZGJhY2tGb3JVc2VyLmJpbmQoZmVlZGJhY2tDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgR0VUIC9hcGkvdjEvZmVlZGJhY2svOmlkXG4gKiBAZGVzYyBHZXQgZmVlZGJhY2sgYnkgSURcbiAqIEBhY2Nlc3MgUHJpdmF0ZSAodXNlcnMgY2FuIG9ubHkgYWNjZXNzIHRoZWlyIG93biBmZWVkYmFjayB1bmxlc3MgYWRtaW4pXG4gKi9cbnJvdXRlci5nZXQoXG4gICcvOmlkJyxcbiAgZmVlZGJhY2tDb250cm9sbGVyLmdldEZlZWRiYWNrLmJpbmQoZmVlZGJhY2tDb250cm9sbGVyKVxuKTtcblxuLyoqXG4gKiBAcm91dGUgUFVUIC9hcGkvdjEvZmVlZGJhY2svOmlkL3N0YXR1c1xuICogQGRlc2MgVXBkYXRlIGZlZWRiYWNrIHN0YXR1c1xuICogQGFjY2VzcyBBZG1pbiBvbmx5XG4gKi9cbnJvdXRlci5wdXQoXG4gICcvOmlkL3N0YXR1cycsXG4gIHZhbGlkYXRpb25NaWRkbGV3YXJlKHsgYm9keTogc3RhdHVzVXBkYXRlU2NoZW1hIH0pLFxuICBmZWVkYmFja0NvbnRyb2xsZXIudXBkYXRlRmVlZGJhY2tTdGF0dXMuYmluZChmZWVkYmFja0NvbnRyb2xsZXIpXG4pO1xuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXI7Il19