"use strict";
// Feedback controller for handling feedback-related API requests
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackController = exports.FeedbackController = void 0;
const feedback_service_1 = require("../../services/feedback-service");
class FeedbackController {
    /**
     * Submit new feedback
     * POST /api/v1/feedback
     */
    async submitFeedback(req, res) {
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
                sessionId: req.sessionID || 'unknown'
            };
            const result = await feedback_service_1.feedbackService.submitFeedback(feedbackData);
            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Feedback submitted successfully',
                    data: result.feedback
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: 'Failed to submit feedback',
                    errors: result.errors
                });
            }
        }
        catch (error) {
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
    async getFeedback(req, res) {
        try {
            const { id } = req.params;
            const feedback = await feedback_service_1.feedbackService.getFeedback(id);
            if (feedback) {
                // Check if user has permission to view this feedback
                if (req.user && (req.user.userId === feedback.userId || req.user.role === 'administrator')) {
                    res.json({
                        success: true,
                        data: feedback
                    });
                }
                else {
                    res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    });
                }
            }
            else {
                res.status(404).json({
                    success: false,
                    message: 'Feedback not found'
                });
            }
        }
        catch (error) {
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
    async searchFeedback(req, res) {
        try {
            const options = {
                query: req.query.q,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                offset: req.query.offset ? parseInt(req.query.offset) : undefined
            };
            // Build filters from query parameters
            const filters = {};
            if (req.query.userId)
                filters.userId = req.query.userId;
            if (req.query.investmentIdeaId)
                filters.investmentIdeaId = req.query.investmentIdeaId;
            if (req.query.analysisId)
                filters.analysisId = req.query.analysisId;
            if (req.query.feedbackType) {
                filters.feedbackType = Array.isArray(req.query.feedbackType)
                    ? req.query.feedbackType
                    : [req.query.feedbackType];
            }
            if (req.query.category) {
                filters.category = Array.isArray(req.query.category)
                    ? req.query.category
                    : [req.query.category];
            }
            if (req.query.status) {
                filters.status = Array.isArray(req.query.status)
                    ? req.query.status
                    : [req.query.status];
            }
            if (req.query.sentiment) {
                filters.sentiment = Array.isArray(req.query.sentiment)
                    ? req.query.sentiment
                    : [req.query.sentiment];
            }
            if (req.query.priority) {
                filters.priority = Array.isArray(req.query.priority)
                    ? req.query.priority
                    : [req.query.priority];
            }
            // Rating range
            if (req.query.minRating || req.query.maxRating) {
                filters.rating = {
                    min: req.query.minRating ? parseInt(req.query.minRating) : undefined,
                    max: req.query.maxRating ? parseInt(req.query.maxRating) : undefined
                };
            }
            // Date range
            if (req.query.startDate || req.query.endDate) {
                filters.dateRange = {
                    start: req.query.startDate ? new Date(req.query.startDate) : new Date(0),
                    end: req.query.endDate ? new Date(req.query.endDate) : new Date()
                };
            }
            // Tags
            if (req.query.tags) {
                filters.tags = Array.isArray(req.query.tags)
                    ? req.query.tags
                    : [req.query.tags];
            }
            options.filters = filters;
            // For non-admin users, filter to only their feedback
            if (req.user && req.user.role !== 'administrator') {
                options.filters.userId = req.user.userId;
            }
            const result = await feedback_service_1.feedbackService.searchFeedback(options);
            res.json({
                success: true,
                data: result
            });
        }
        catch (error) {
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
    async updateFeedbackStatus(req, res) {
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
            const success = await feedback_service_1.feedbackService.updateFeedbackStatus(id, status, req.user.userId, resolution);
            if (success) {
                res.json({
                    success: true,
                    message: 'Feedback status updated successfully'
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    message: 'Feedback not found'
                });
            }
        }
        catch (error) {
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
    async getFeedbackSummary(req, res) {
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
                ? new Date(req.query.startDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date();
            // Build filters if provided
            const filters = {};
            if (req.query.userId)
                filters.userId = req.query.userId;
            if (req.query.feedbackType) {
                filters.feedbackType = Array.isArray(req.query.feedbackType)
                    ? req.query.feedbackType
                    : [req.query.feedbackType];
            }
            const summary = await feedback_service_1.feedbackService.getFeedbackSummary(startDate, endDate, filters);
            res.json({
                success: true,
                data: summary
            });
        }
        catch (error) {
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
    async getFeedbackAnalytics(req, res) {
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
                ? new Date(req.query.startDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date();
            const analytics = await feedback_service_1.feedbackService.generateFeedbackAnalytics({
                start: startDate,
                end: endDate
            });
            res.json({
                success: true,
                data: analytics
            });
        }
        catch (error) {
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
    async getFeedbackForInvestmentIdea(req, res) {
        try {
            const { id } = req.params;
            const feedback = await feedback_service_1.feedbackService.getFeedbackForInvestmentIdea(id);
            res.json({
                success: true,
                data: feedback
            });
        }
        catch (error) {
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
    async getFeedbackForUser(req, res) {
        try {
            const { userId } = req.params;
            // Check permissions - users can only see their own feedback unless admin
            if (req.user && (req.user.userId === userId || req.user.role === 'administrator')) {
                const feedback = await feedback_service_1.feedbackService.getFeedbackForUser(userId);
                res.json({
                    success: true,
                    data: feedback
                });
            }
            else {
                res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
        }
        catch (error) {
            console.error('Error in getFeedbackForUser:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.FeedbackController = FeedbackController;
exports.feedbackController = new FeedbackController();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2stY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hcGkvY29udHJvbGxlcnMvZmVlZGJhY2stY29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsaUVBQWlFOzs7QUFHakUsc0VBQWtFO0FBVWxFLE1BQWEsa0JBQWtCO0lBQzdCOzs7T0FHRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBWSxFQUFFLEdBQWE7UUFDOUMsSUFBSTtZQUNGLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFFOUIseUNBQXlDO1lBQ3pDLElBQUksR0FBRyxDQUFDLElBQUksRUFBRTtnQkFDWixZQUFZLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO2FBQ3ZDO1lBRUQsNEJBQTRCO1lBQzVCLFlBQVksQ0FBQyxRQUFRLEdBQUc7Z0JBQ3RCLEdBQUcsWUFBWSxDQUFDLFFBQVE7Z0JBQ3hCLE1BQU0sRUFBRSxLQUFLO2dCQUNiLFNBQVMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztnQkFDaEMsU0FBUyxFQUFHLEdBQVcsQ0FBQyxTQUFTLElBQUksU0FBUzthQUMvQyxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsTUFBTSxrQ0FBZSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVsRSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7Z0JBQ2xCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNuQixPQUFPLEVBQUUsSUFBSTtvQkFDYixPQUFPLEVBQUUsaUNBQWlDO29CQUMxQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFFBQVE7aUJBQ3RCLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNuQixP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QkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGZWVkYmFjayBjb250cm9sbGVyIGZvciBoYW5kbGluZyBmZWVkYmFjay1yZWxhdGVkIEFQSSByZXF1ZXN0c1xuXG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xuaW1wb3J0IHsgZmVlZGJhY2tTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvZmVlZGJhY2stc2VydmljZSc7XG5pbXBvcnQge1xuICBGZWVkYmFjayxcbiAgRmVlZGJhY2tUeXBlLFxuICBGZWVkYmFja0NhdGVnb3J5LFxuICBGZWVkYmFja1N0YXR1cyxcbiAgRmVlZGJhY2tGaWx0ZXIsXG4gIEZlZWRiYWNrU2VhcmNoT3B0aW9uc1xufSBmcm9tICcuLi8uLi9tb2RlbHMvZmVlZGJhY2snO1xuXG5leHBvcnQgY2xhc3MgRmVlZGJhY2tDb250cm9sbGVyIHtcbiAgLyoqXG4gICAqIFN1Ym1pdCBuZXcgZmVlZGJhY2tcbiAgICogUE9TVCAvYXBpL3YxL2ZlZWRiYWNrXG4gICAqL1xuICBhc3luYyBzdWJtaXRGZWVkYmFjayhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmVlZGJhY2tEYXRhID0gcmVxLmJvZHk7XG4gICAgICBcbiAgICAgIC8vIEFkZCB1c2VyIElEIGZyb20gYXV0aGVudGljYXRlZCBzZXNzaW9uXG4gICAgICBpZiAocmVxLnVzZXIpIHtcbiAgICAgICAgZmVlZGJhY2tEYXRhLnVzZXJJZCA9IHJlcS51c2VyLnVzZXJJZDtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIG1ldGFkYXRhIGZyb20gcmVxdWVzdFxuICAgICAgZmVlZGJhY2tEYXRhLm1ldGFkYXRhID0ge1xuICAgICAgICAuLi5mZWVkYmFja0RhdGEubWV0YWRhdGEsXG4gICAgICAgIHNvdXJjZTogJ3dlYicsXG4gICAgICAgIHVzZXJBZ2VudDogcmVxLmdldCgnVXNlci1BZ2VudCcpLFxuICAgICAgICBzZXNzaW9uSWQ6IChyZXEgYXMgYW55KS5zZXNzaW9uSUQgfHwgJ3Vua25vd24nXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2soZmVlZGJhY2tEYXRhKTtcblxuICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6ICdGZWVkYmFjayBzdWJtaXR0ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICBkYXRhOiByZXN1bHQuZmVlZGJhY2tcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzdWJtaXQgZmVlZGJhY2snLFxuICAgICAgICAgIGVycm9yczogcmVzdWx0LmVycm9yc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gc3VibWl0RmVlZGJhY2s6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBmZWVkYmFjayBieSBJRFxuICAgKiBHRVQgL2FwaS92MS9mZWVkYmFjay86aWRcbiAgICovXG4gIGFzeW5jIGdldEZlZWRiYWNrKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGlkIH0gPSByZXEucGFyYW1zO1xuICAgICAgY29uc3QgZmVlZGJhY2sgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UuZ2V0RmVlZGJhY2soaWQpO1xuXG4gICAgICBpZiAoZmVlZGJhY2spIHtcbiAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciBoYXMgcGVybWlzc2lvbiB0byB2aWV3IHRoaXMgZmVlZGJhY2tcbiAgICAgICAgaWYgKHJlcS51c2VyICYmIChyZXEudXNlci51c2VySWQgPT09IGZlZWRiYWNrLnVzZXJJZCB8fCByZXEudXNlci5yb2xlID09PSAnYWRtaW5pc3RyYXRvcicpKSB7XG4gICAgICAgICAgcmVzLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IGZlZWRiYWNrXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnQWNjZXNzIGRlbmllZCdcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6ICdGZWVkYmFjayBub3QgZm91bmQnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBnZXRGZWVkYmFjazonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIGZlZWRiYWNrIHdpdGggZmlsdGVyc1xuICAgKiBHRVQgL2FwaS92MS9mZWVkYmFjay9zZWFyY2hcbiAgICovXG4gIGFzeW5jIHNlYXJjaEZlZWRiYWNrKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBvcHRpb25zOiBGZWVkYmFja1NlYXJjaE9wdGlvbnMgPSB7XG4gICAgICAgIHF1ZXJ5OiByZXEucXVlcnkucSBhcyBzdHJpbmcsXG4gICAgICAgIHNvcnRCeTogcmVxLnF1ZXJ5LnNvcnRCeSBhcyAnY3JlYXRlZEF0JyB8ICd1cGRhdGVkQXQnIHwgJ3JhdGluZycgfCAncHJpb3JpdHknIHwgdW5kZWZpbmVkLFxuICAgICAgICBzb3J0T3JkZXI6IHJlcS5xdWVyeS5zb3J0T3JkZXIgYXMgJ2FzYycgfCAnZGVzYycsXG4gICAgICAgIGxpbWl0OiByZXEucXVlcnkubGltaXQgPyBwYXJzZUludChyZXEucXVlcnkubGltaXQgYXMgc3RyaW5nKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgb2Zmc2V0OiByZXEucXVlcnkub2Zmc2V0ID8gcGFyc2VJbnQocmVxLnF1ZXJ5Lm9mZnNldCBhcyBzdHJpbmcpIDogdW5kZWZpbmVkXG4gICAgICB9O1xuXG4gICAgICAvLyBCdWlsZCBmaWx0ZXJzIGZyb20gcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgY29uc3QgZmlsdGVyczogRmVlZGJhY2tGaWx0ZXIgPSB7fTtcbiAgICAgIFxuICAgICAgaWYgKHJlcS5xdWVyeS51c2VySWQpIGZpbHRlcnMudXNlcklkID0gcmVxLnF1ZXJ5LnVzZXJJZCBhcyBzdHJpbmc7XG4gICAgICBpZiAocmVxLnF1ZXJ5LmludmVzdG1lbnRJZGVhSWQpIGZpbHRlcnMuaW52ZXN0bWVudElkZWFJZCA9IHJlcS5xdWVyeS5pbnZlc3RtZW50SWRlYUlkIGFzIHN0cmluZztcbiAgICAgIGlmIChyZXEucXVlcnkuYW5hbHlzaXNJZCkgZmlsdGVycy5hbmFseXNpc0lkID0gcmVxLnF1ZXJ5LmFuYWx5c2lzSWQgYXMgc3RyaW5nO1xuICAgICAgaWYgKHJlcS5xdWVyeS5mZWVkYmFja1R5cGUpIHtcbiAgICAgICAgZmlsdGVycy5mZWVkYmFja1R5cGUgPSBBcnJheS5pc0FycmF5KHJlcS5xdWVyeS5mZWVkYmFja1R5cGUpIFxuICAgICAgICAgID8gcmVxLnF1ZXJ5LmZlZWRiYWNrVHlwZSBhcyBGZWVkYmFja1R5cGVbXVxuICAgICAgICAgIDogW3JlcS5xdWVyeS5mZWVkYmFja1R5cGUgYXMgRmVlZGJhY2tUeXBlXTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXEucXVlcnkuY2F0ZWdvcnkpIHtcbiAgICAgICAgZmlsdGVycy5jYXRlZ29yeSA9IEFycmF5LmlzQXJyYXkocmVxLnF1ZXJ5LmNhdGVnb3J5KVxuICAgICAgICAgID8gcmVxLnF1ZXJ5LmNhdGVnb3J5IGFzIEZlZWRiYWNrQ2F0ZWdvcnlbXVxuICAgICAgICAgIDogW3JlcS5xdWVyeS5jYXRlZ29yeSBhcyBGZWVkYmFja0NhdGVnb3J5XTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXEucXVlcnkuc3RhdHVzKSB7XG4gICAgICAgIGZpbHRlcnMuc3RhdHVzID0gQXJyYXkuaXNBcnJheShyZXEucXVlcnkuc3RhdHVzKVxuICAgICAgICAgID8gcmVxLnF1ZXJ5LnN0YXR1cyBhcyBGZWVkYmFja1N0YXR1c1tdXG4gICAgICAgICAgOiBbcmVxLnF1ZXJ5LnN0YXR1cyBhcyBGZWVkYmFja1N0YXR1c107XG4gICAgICB9XG4gICAgICBpZiAocmVxLnF1ZXJ5LnNlbnRpbWVudCkge1xuICAgICAgICBmaWx0ZXJzLnNlbnRpbWVudCA9IEFycmF5LmlzQXJyYXkocmVxLnF1ZXJ5LnNlbnRpbWVudClcbiAgICAgICAgICA/IHJlcS5xdWVyeS5zZW50aW1lbnQgYXMgKCdwb3NpdGl2ZScgfCAnbmV1dHJhbCcgfCAnbmVnYXRpdmUnKVtdXG4gICAgICAgICAgOiBbcmVxLnF1ZXJ5LnNlbnRpbWVudCBhcyAoJ3Bvc2l0aXZlJyB8ICduZXV0cmFsJyB8ICduZWdhdGl2ZScpXTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXEucXVlcnkucHJpb3JpdHkpIHtcbiAgICAgICAgZmlsdGVycy5wcmlvcml0eSA9IEFycmF5LmlzQXJyYXkocmVxLnF1ZXJ5LnByaW9yaXR5KVxuICAgICAgICAgID8gcmVxLnF1ZXJ5LnByaW9yaXR5IGFzICgnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnKVtdXG4gICAgICAgICAgOiBbcmVxLnF1ZXJ5LnByaW9yaXR5IGFzICgnbG93JyB8ICdtZWRpdW0nIHwgJ2hpZ2gnKV07XG4gICAgICB9XG5cbiAgICAgIC8vIFJhdGluZyByYW5nZVxuICAgICAgaWYgKHJlcS5xdWVyeS5taW5SYXRpbmcgfHwgcmVxLnF1ZXJ5Lm1heFJhdGluZykge1xuICAgICAgICBmaWx0ZXJzLnJhdGluZyA9IHtcbiAgICAgICAgICBtaW46IHJlcS5xdWVyeS5taW5SYXRpbmcgPyBwYXJzZUludChyZXEucXVlcnkubWluUmF0aW5nIGFzIHN0cmluZykgOiB1bmRlZmluZWQsXG4gICAgICAgICAgbWF4OiByZXEucXVlcnkubWF4UmF0aW5nID8gcGFyc2VJbnQocmVxLnF1ZXJ5Lm1heFJhdGluZyBhcyBzdHJpbmcpIDogdW5kZWZpbmVkXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIERhdGUgcmFuZ2VcbiAgICAgIGlmIChyZXEucXVlcnkuc3RhcnREYXRlIHx8IHJlcS5xdWVyeS5lbmREYXRlKSB7XG4gICAgICAgIGZpbHRlcnMuZGF0ZVJhbmdlID0ge1xuICAgICAgICAgIHN0YXJ0OiByZXEucXVlcnkuc3RhcnREYXRlID8gbmV3IERhdGUocmVxLnF1ZXJ5LnN0YXJ0RGF0ZSBhcyBzdHJpbmcpIDogbmV3IERhdGUoMCksXG4gICAgICAgICAgZW5kOiByZXEucXVlcnkuZW5kRGF0ZSA/IG5ldyBEYXRlKHJlcS5xdWVyeS5lbmREYXRlIGFzIHN0cmluZykgOiBuZXcgRGF0ZSgpXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIC8vIFRhZ3NcbiAgICAgIGlmIChyZXEucXVlcnkudGFncykge1xuICAgICAgICBmaWx0ZXJzLnRhZ3MgPSBBcnJheS5pc0FycmF5KHJlcS5xdWVyeS50YWdzKVxuICAgICAgICAgID8gcmVxLnF1ZXJ5LnRhZ3MgYXMgc3RyaW5nW11cbiAgICAgICAgICA6IFtyZXEucXVlcnkudGFncyBhcyBzdHJpbmddO1xuICAgICAgfVxuXG4gICAgICBvcHRpb25zLmZpbHRlcnMgPSBmaWx0ZXJzO1xuXG4gICAgICAvLyBGb3Igbm9uLWFkbWluIHVzZXJzLCBmaWx0ZXIgdG8gb25seSB0aGVpciBmZWVkYmFja1xuICAgICAgaWYgKHJlcS51c2VyICYmIHJlcS51c2VyLnJvbGUgIT09ICdhZG1pbmlzdHJhdG9yJykge1xuICAgICAgICBvcHRpb25zLmZpbHRlcnMudXNlcklkID0gcmVxLnVzZXIudXNlcklkO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2Uuc2VhcmNoRmVlZGJhY2sob3B0aW9ucyk7XG5cbiAgICAgIHJlcy5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YTogcmVzdWx0XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gc2VhcmNoRmVlZGJhY2s6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBmZWVkYmFjayBzdGF0dXMgKGFkbWluIG9ubHkpXG4gICAqIFBVVCAvYXBpL3YxL2ZlZWRiYWNrLzppZC9zdGF0dXNcbiAgICovXG4gIGFzeW5jIHVwZGF0ZUZlZWRiYWNrU3RhdHVzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBhZG1pbiBwZXJtaXNzaW9uc1xuICAgICAgaWYgKCFyZXEudXNlciB8fCByZXEudXNlci5yb2xlICE9PSAnYWRtaW5pc3RyYXRvcicpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6ICdBZG1pbiBhY2Nlc3MgcmVxdWlyZWQnXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgICBjb25zdCB7IHN0YXR1cywgcmVzb2x1dGlvbiB9ID0gcmVxLmJvZHk7XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UudXBkYXRlRmVlZGJhY2tTdGF0dXMoXG4gICAgICAgIGlkLFxuICAgICAgICBzdGF0dXMsXG4gICAgICAgIHJlcS51c2VyLnVzZXJJZCxcbiAgICAgICAgcmVzb2x1dGlvblxuICAgICAgKTtcblxuICAgICAgaWYgKHN1Y2Nlc3MpIHtcbiAgICAgICAgcmVzLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogJ0ZlZWRiYWNrIHN0YXR1cyB1cGRhdGVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogJ0ZlZWRiYWNrIG5vdCBmb3VuZCdcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIHVwZGF0ZUZlZWRiYWNrU3RhdHVzOicsIGVycm9yKTtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcidcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZmVlZGJhY2sgc3VtbWFyeVxuICAgKiBHRVQgL2FwaS92MS9mZWVkYmFjay9zdW1tYXJ5XG4gICAqL1xuICBhc3luYyBnZXRGZWVkYmFja1N1bW1hcnkocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENoZWNrIGFkbWluIHBlcm1pc3Npb25zXG4gICAgICBpZiAoIXJlcS51c2VyIHx8IHJlcS51c2VyLnJvbGUgIT09ICdhZG1pbmlzdHJhdG9yJykge1xuICAgICAgICByZXMuc3RhdHVzKDQwMykuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogJ0FkbWluIGFjY2VzcyByZXF1aXJlZCdcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3RhcnREYXRlID0gcmVxLnF1ZXJ5LnN0YXJ0RGF0ZSBcbiAgICAgICAgPyBuZXcgRGF0ZShyZXEucXVlcnkuc3RhcnREYXRlIGFzIHN0cmluZylcbiAgICAgICAgOiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMzAgKiAyNCAqIDYwICogNjAgKiAxMDAwKTsgLy8gRGVmYXVsdDogbGFzdCAzMCBkYXlzXG5cbiAgICAgIGNvbnN0IGVuZERhdGUgPSByZXEucXVlcnkuZW5kRGF0ZVxuICAgICAgICA/IG5ldyBEYXRlKHJlcS5xdWVyeS5lbmREYXRlIGFzIHN0cmluZylcbiAgICAgICAgOiBuZXcgRGF0ZSgpO1xuXG4gICAgICAvLyBCdWlsZCBmaWx0ZXJzIGlmIHByb3ZpZGVkXG4gICAgICBjb25zdCBmaWx0ZXJzOiBGZWVkYmFja0ZpbHRlciA9IHt9O1xuICAgICAgaWYgKHJlcS5xdWVyeS51c2VySWQpIGZpbHRlcnMudXNlcklkID0gcmVxLnF1ZXJ5LnVzZXJJZCBhcyBzdHJpbmc7XG4gICAgICBpZiAocmVxLnF1ZXJ5LmZlZWRiYWNrVHlwZSkge1xuICAgICAgICBmaWx0ZXJzLmZlZWRiYWNrVHlwZSA9IEFycmF5LmlzQXJyYXkocmVxLnF1ZXJ5LmZlZWRiYWNrVHlwZSlcbiAgICAgICAgICA/IHJlcS5xdWVyeS5mZWVkYmFja1R5cGUgYXMgRmVlZGJhY2tUeXBlW11cbiAgICAgICAgICA6IFtyZXEucXVlcnkuZmVlZGJhY2tUeXBlIGFzIEZlZWRiYWNrVHlwZV07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN1bW1hcnkgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UuZ2V0RmVlZGJhY2tTdW1tYXJ5KHN0YXJ0RGF0ZSwgZW5kRGF0ZSwgZmlsdGVycyk7XG5cbiAgICAgIHJlcy5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YTogc3VtbWFyeVxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGdldEZlZWRiYWNrU3VtbWFyeTonLCBlcnJvcik7XG4gICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZlZWRiYWNrIGFuYWx5dGljc1xuICAgKiBHRVQgL2FwaS92MS9mZWVkYmFjay9hbmFseXRpY3NcbiAgICovXG4gIGFzeW5jIGdldEZlZWRiYWNrQW5hbHl0aWNzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBDaGVjayBhZG1pbiBwZXJtaXNzaW9uc1xuICAgICAgaWYgKCFyZXEudXNlciB8fCByZXEudXNlci5yb2xlICE9PSAnYWRtaW5pc3RyYXRvcicpIHtcbiAgICAgICAgcmVzLnN0YXR1cyg0MDMpLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIG1lc3NhZ2U6ICdBZG1pbiBhY2Nlc3MgcmVxdWlyZWQnXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IHJlcS5xdWVyeS5zdGFydERhdGVcbiAgICAgICAgPyBuZXcgRGF0ZShyZXEucXVlcnkuc3RhcnREYXRlIGFzIHN0cmluZylcbiAgICAgICAgOiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMzAgKiAyNCAqIDYwICogNjAgKiAxMDAwKTsgLy8gRGVmYXVsdDogbGFzdCAzMCBkYXlzXG5cbiAgICAgIGNvbnN0IGVuZERhdGUgPSByZXEucXVlcnkuZW5kRGF0ZVxuICAgICAgICA/IG5ldyBEYXRlKHJlcS5xdWVyeS5lbmREYXRlIGFzIHN0cmluZylcbiAgICAgICAgOiBuZXcgRGF0ZSgpO1xuXG4gICAgICBjb25zdCBhbmFseXRpY3MgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UuZ2VuZXJhdGVGZWVkYmFja0FuYWx5dGljcyh7XG4gICAgICAgIHN0YXJ0OiBzdGFydERhdGUsXG4gICAgICAgIGVuZDogZW5kRGF0ZVxuICAgICAgfSk7XG5cbiAgICAgIHJlcy5qc29uKHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YTogYW5hbHl0aWNzXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gZ2V0RmVlZGJhY2tBbmFseXRpY3M6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBmZWVkYmFjayBmb3IgaW52ZXN0bWVudCBpZGVhXG4gICAqIEdFVCAvYXBpL3YxL2ZlZWRiYWNrL2ludmVzdG1lbnQtaWRlYS86aWRcbiAgICovXG4gIGFzeW5jIGdldEZlZWRiYWNrRm9ySW52ZXN0bWVudElkZWEocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XG4gICAgICBjb25zdCBmZWVkYmFjayA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5nZXRGZWVkYmFja0ZvckludmVzdG1lbnRJZGVhKGlkKTtcblxuICAgICAgcmVzLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICBkYXRhOiBmZWVkYmFja1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGdldEZlZWRiYWNrRm9ySW52ZXN0bWVudElkZWE6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3MgZmVlZGJhY2tcbiAgICogR0VUIC9hcGkvdjEvZmVlZGJhY2svdXNlci86dXNlcklkXG4gICAqL1xuICBhc3luYyBnZXRGZWVkYmFja0ZvclVzZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgdXNlcklkIH0gPSByZXEucGFyYW1zO1xuXG4gICAgICAvLyBDaGVjayBwZXJtaXNzaW9ucyAtIHVzZXJzIGNhbiBvbmx5IHNlZSB0aGVpciBvd24gZmVlZGJhY2sgdW5sZXNzIGFkbWluXG4gICAgICBpZiAocmVxLnVzZXIgJiYgKHJlcS51c2VyLnVzZXJJZCA9PT0gdXNlcklkIHx8IHJlcS51c2VyLnJvbGUgPT09ICdhZG1pbmlzdHJhdG9yJykpIHtcbiAgICAgICAgY29uc3QgZmVlZGJhY2sgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UuZ2V0RmVlZGJhY2tGb3JVc2VyKHVzZXJJZCk7XG5cbiAgICAgICAgcmVzLmpzb24oe1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgZGF0YTogZmVlZGJhY2tcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXMuc3RhdHVzKDQwMykuanNvbih7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgbWVzc2FnZTogJ0FjY2VzcyBkZW5pZWQnXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBnZXRGZWVkYmFja0ZvclVzZXI6JywgZXJyb3IpO1xuICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBmZWVkYmFja0NvbnRyb2xsZXIgPSBuZXcgRmVlZGJhY2tDb250cm9sbGVyKCk7Il19