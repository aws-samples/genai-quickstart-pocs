"use strict";
// Feedback service for collecting, storing, and analyzing user feedback
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedbackService = exports.FeedbackService = void 0;
const feedback_1 = require("../models/feedback");
class FeedbackService {
    constructor() {
        this.feedbackStore = new Map();
        this.feedbackIndex = new Map(); // For efficient searching
        this.initializeIndexes();
    }
    initializeIndexes() {
        // Initialize search indexes
        this.feedbackIndex.set('userId', new Set());
        this.feedbackIndex.set('investmentIdeaId', new Set());
        this.feedbackIndex.set('analysisId', new Set());
        this.feedbackIndex.set('feedbackType', new Set());
        this.feedbackIndex.set('category', new Set());
        this.feedbackIndex.set('status', new Set());
        this.feedbackIndex.set('sentiment', new Set());
    }
    /**
     * Submit new feedback
     */
    async submitFeedback(feedbackData) {
        try {
            // Validate feedback data
            const validation = (0, feedback_1.validateFeedback)(feedbackData);
            if (!validation.valid) {
                return { success: false, errors: validation.errors };
            }
            // Create feedback object
            const feedback = {
                id: (0, feedback_1.createFeedbackId)(),
                userId: feedbackData.userId,
                investmentIdeaId: feedbackData.investmentIdeaId,
                analysisId: feedbackData.analysisId,
                requestId: feedbackData.requestId,
                feedbackType: feedbackData.feedbackType,
                rating: feedbackData.rating,
                category: feedbackData.category,
                title: feedbackData.title,
                description: feedbackData.description,
                tags: feedbackData.tags || [],
                sentiment: (0, feedback_1.determineFeedbackSentiment)(feedbackData.rating, feedbackData.description),
                priority: 'medium',
                status: 'submitted',
                metadata: {
                    source: feedbackData.metadata?.source || 'web',
                    userAgent: feedbackData.metadata?.userAgent,
                    sessionId: feedbackData.metadata?.sessionId,
                    contextData: feedbackData.metadata?.contextData,
                    attachments: feedbackData.metadata?.attachments || [],
                    relatedFeedback: feedbackData.metadata?.relatedFeedback || []
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            // Calculate priority
            feedback.priority = (0, feedback_1.calculateFeedbackPriority)(feedback);
            // Store feedback
            this.feedbackStore.set(feedback.id, feedback);
            this.updateIndexes(feedback);
            // Process feedback asynchronously
            this.processFeedbackAsync(feedback);
            return { success: true, feedback };
        }
        catch (error) {
            console.error('Error submitting feedback:', error);
            return { success: false, errors: ['Failed to submit feedback'] };
        }
    }
    /**
     * Get feedback by ID
     */
    async getFeedback(id) {
        return this.feedbackStore.get(id) || null;
    }
    /**
     * Search feedback with filters and options
     */
    async searchFeedback(options = {}) {
        try {
            let feedbackList = Array.from(this.feedbackStore.values());
            // Apply filters
            if (options.filters) {
                feedbackList = this.applyFilters(feedbackList, options.filters);
            }
            // Apply text search
            if (options.query) {
                feedbackList = this.applyTextSearch(feedbackList, options.query);
            }
            // Sort results
            feedbackList = this.sortFeedback(feedbackList, options.sortBy, options.sortOrder);
            // Calculate aggregations
            const aggregations = this.calculateAggregations(feedbackList);
            // Apply pagination
            const totalCount = feedbackList.length;
            const offset = options.offset || 0;
            const limit = options.limit || 50;
            const paginatedFeedback = feedbackList.slice(offset, offset + limit);
            return {
                feedback: paginatedFeedback,
                totalCount,
                hasMore: offset + limit < totalCount,
                aggregations
            };
        }
        catch (error) {
            console.error('Error searching feedback:', error);
            return {
                feedback: [],
                totalCount: 0,
                hasMore: false
            };
        }
    }
    /**
     * Update feedback status
     */
    async updateFeedbackStatus(id, status, resolvedBy, resolution) {
        try {
            const feedback = this.feedbackStore.get(id);
            if (!feedback)
                return false;
            feedback.status = status;
            feedback.updatedAt = new Date();
            if (status === 'resolved') {
                feedback.resolvedAt = new Date();
                feedback.resolvedBy = resolvedBy;
                feedback.resolution = resolution;
            }
            this.feedbackStore.set(id, feedback);
            this.updateIndexes(feedback);
            return true;
        }
        catch (error) {
            console.error('Error updating feedback status:', error);
            return false;
        }
    }
    /**
     * Get feedback summary for a time period
     */
    async getFeedbackSummary(startDate, endDate, filters) {
        try {
            let feedbackList = Array.from(this.feedbackStore.values())
                .filter(f => f.createdAt >= startDate && f.createdAt <= endDate);
            if (filters) {
                feedbackList = this.applyFilters(feedbackList, filters);
            }
            const totalCount = feedbackList.length;
            const averageRating = totalCount > 0
                ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalCount
                : 0;
            // Rating distribution
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            feedbackList.forEach(f => ratingDistribution[f.rating]++);
            // Category breakdown
            const categoryBreakdown = {
                accuracy: 0, relevance: 0, completeness: 0, timeliness: 0,
                usability: 0, performance: 0, compliance: 0, other: 0
            };
            feedbackList.forEach(f => categoryBreakdown[f.category]++);
            // Type breakdown
            const typeBreakdown = {
                'investment-idea-quality': 0, 'analysis-accuracy': 0, 'system-performance': 0,
                'user-experience': 0, 'feature-request': 0, 'bug-report': 0, 'general': 0
            };
            feedbackList.forEach(f => typeBreakdown[f.feedbackType]++);
            // Sentiment breakdown
            const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
            feedbackList.forEach(f => sentimentBreakdown[f.sentiment]++);
            // Status breakdown
            const statusBreakdown = {
                submitted: 0, 'under-review': 0, 'in-progress': 0,
                resolved: 0, dismissed: 0, archived: 0
            };
            feedbackList.forEach(f => statusBreakdown[f.status]++);
            return {
                totalCount,
                averageRating,
                ratingDistribution,
                categoryBreakdown,
                typeBreakdown,
                sentimentBreakdown,
                statusBreakdown,
                timeRange: { start: startDate, end: endDate }
            };
        }
        catch (error) {
            console.error('Error generating feedback summary:', error);
            throw error;
        }
    }
    /**
     * Generate feedback analytics and insights
     */
    async generateFeedbackAnalytics(timeRange) {
        try {
            const feedbackList = Array.from(this.feedbackStore.values())
                .filter(f => f.createdAt >= timeRange.start && f.createdAt <= timeRange.end);
            const trends = this.calculateTrends(feedbackList, timeRange);
            const insights = this.generateInsights(feedbackList);
            const recommendations = this.generateRecommendations(feedbackList);
            const correlations = this.calculateCorrelations(feedbackList);
            return {
                trends,
                insights,
                recommendations,
                correlations
            };
        }
        catch (error) {
            console.error('Error generating feedback analytics:', error);
            throw error;
        }
    }
    /**
     * Get feedback for a specific investment idea
     */
    async getFeedbackForInvestmentIdea(investmentIdeaId) {
        return Array.from(this.feedbackStore.values())
            .filter(f => f.investmentIdeaId === investmentIdeaId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * Get feedback for a specific user
     */
    async getFeedbackForUser(userId) {
        return Array.from(this.feedbackStore.values())
            .filter(f => f.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    // Private helper methods
    updateIndexes(feedback) {
        // Update search indexes for efficient querying
        this.feedbackIndex.get('userId')?.add(`${feedback.userId}:${feedback.id}`);
        if (feedback.investmentIdeaId) {
            this.feedbackIndex.get('investmentIdeaId')?.add(`${feedback.investmentIdeaId}:${feedback.id}`);
        }
        if (feedback.analysisId) {
            this.feedbackIndex.get('analysisId')?.add(`${feedback.analysisId}:${feedback.id}`);
        }
        this.feedbackIndex.get('feedbackType')?.add(`${feedback.feedbackType}:${feedback.id}`);
        this.feedbackIndex.get('category')?.add(`${feedback.category}:${feedback.id}`);
        this.feedbackIndex.get('status')?.add(`${feedback.status}:${feedback.id}`);
        this.feedbackIndex.get('sentiment')?.add(`${feedback.sentiment}:${feedback.id}`);
    }
    applyFilters(feedbackList, filters) {
        return feedbackList.filter(feedback => {
            if (filters.userId && feedback.userId !== filters.userId)
                return false;
            if (filters.investmentIdeaId && feedback.investmentIdeaId !== filters.investmentIdeaId)
                return false;
            if (filters.analysisId && feedback.analysisId !== filters.analysisId)
                return false;
            if (filters.feedbackType && !filters.feedbackType.includes(feedback.feedbackType))
                return false;
            if (filters.category && !filters.category.includes(feedback.category))
                return false;
            if (filters.sentiment && !filters.sentiment.includes(feedback.sentiment))
                return false;
            if (filters.status && !filters.status.includes(feedback.status))
                return false;
            if (filters.priority && !filters.priority.includes(feedback.priority))
                return false;
            if (filters.rating) {
                if (filters.rating.min && feedback.rating < filters.rating.min)
                    return false;
                if (filters.rating.max && feedback.rating > filters.rating.max)
                    return false;
            }
            if (filters.dateRange) {
                if (feedback.createdAt < filters.dateRange.start || feedback.createdAt > filters.dateRange.end)
                    return false;
            }
            if (filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(tag => feedback.tags.includes(tag));
                if (!hasMatchingTag)
                    return false;
            }
            return true;
        });
    }
    applyTextSearch(feedbackList, query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        return feedbackList.filter(feedback => {
            const searchableText = [
                feedback.title,
                feedback.description,
                ...feedback.tags
            ].join(' ').toLowerCase();
            return searchTerms.every(term => searchableText.includes(term));
        });
    }
    sortFeedback(feedbackList, sortBy, sortOrder) {
        const order = sortOrder === 'asc' ? 1 : -1;
        return feedbackList.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'rating':
                    comparison = a.rating - b.rating;
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
                    break;
                case 'updatedAt':
                    comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
                    break;
                case 'createdAt':
                default:
                    comparison = a.createdAt.getTime() - b.createdAt.getTime();
                    break;
            }
            return comparison * order;
        });
    }
    calculateAggregations(feedbackList) {
        const totalCount = feedbackList.length;
        if (totalCount === 0)
            return undefined;
        const averageRating = feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalCount;
        const categoryBreakdown = {
            accuracy: 0, relevance: 0, completeness: 0, timeliness: 0,
            usability: 0, performance: 0, compliance: 0, other: 0
        };
        feedbackList.forEach(f => categoryBreakdown[f.category]++);
        const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
        feedbackList.forEach(f => sentimentBreakdown[f.sentiment]++);
        return {
            averageRating,
            categoryBreakdown,
            sentimentBreakdown
        };
    }
    calculateTrends(feedbackList, timeRange) {
        // Calculate daily trends for rating and volume
        const dailyData = new Map();
        feedbackList.forEach(feedback => {
            const dateKey = feedback.createdAt.toISOString().split('T')[0];
            const existing = dailyData.get(dateKey) || { count: 0, totalRating: 0 };
            dailyData.set(dateKey, {
                count: existing.count + 1,
                totalRating: existing.totalRating + feedback.rating
            });
        });
        const volumeTrend = {
            metric: 'volume',
            period: 'daily',
            data: Array.from(dailyData.entries()).map(([date, data]) => ({
                date: new Date(date),
                value: data.count
            }))
        };
        const ratingTrend = {
            metric: 'average_rating',
            period: 'daily',
            data: Array.from(dailyData.entries()).map(([date, data]) => ({
                date: new Date(date),
                value: data.count > 0 ? data.totalRating / data.count : 0
            }))
        };
        return [volumeTrend, ratingTrend];
    }
    generateInsights(feedbackList) {
        const insights = [];
        // Low rating insight
        const lowRatingFeedback = feedbackList.filter(f => f.rating <= 2);
        if (lowRatingFeedback.length > feedbackList.length * 0.2) {
            insights.push({
                id: `insight_${Date.now()}_low_rating`,
                type: 'issue',
                title: 'High Volume of Low Ratings',
                description: `${lowRatingFeedback.length} out of ${feedbackList.length} feedback entries have ratings of 2 or below`,
                impact: 'high',
                confidence: 0.9,
                supportingData: lowRatingFeedback,
                generatedAt: new Date()
            });
        }
        // Category-specific insights
        const categoryGroups = feedbackList.reduce((groups, feedback) => {
            if (!groups[feedback.category])
                groups[feedback.category] = [];
            groups[feedback.category].push(feedback);
            return groups;
        }, {});
        Object.entries(categoryGroups).forEach(([category, categoryFeedback]) => {
            const avgRating = categoryFeedback.reduce((sum, f) => sum + f.rating, 0) / categoryFeedback.length;
            if (avgRating < 3 && categoryFeedback.length >= 3) {
                insights.push({
                    id: `insight_${Date.now()}_${category}`,
                    type: 'issue',
                    title: `${category} Category Needs Attention`,
                    description: `Average rating for ${category} is ${avgRating.toFixed(1)} based on ${categoryFeedback.length} feedback entries`,
                    impact: 'medium',
                    confidence: 0.8,
                    supportingData: categoryFeedback,
                    generatedAt: new Date()
                });
            }
        });
        return insights;
    }
    generateRecommendations(feedbackList) {
        const recommendations = [];
        // Analyze common issues
        const bugReports = feedbackList.filter(f => f.feedbackType === 'bug-report');
        if (bugReports.length > 0) {
            recommendations.push({
                id: `rec_${Date.now()}_bug_fixes`,
                title: 'Address Reported Bugs',
                description: `${bugReports.length} bug reports need attention`,
                priority: 'high',
                effort: 'medium',
                impact: 'high',
                category: 'bug-fixes',
                actionItems: [
                    'Review and prioritize bug reports',
                    'Assign bugs to development team',
                    'Implement fixes and test thoroughly',
                    'Follow up with users who reported bugs'
                ],
                estimatedTimeframe: '2-4 weeks'
            });
        }
        // Performance issues
        const performanceFeedback = feedbackList.filter(f => f.category === 'performance' && f.rating <= 3);
        if (performanceFeedback.length > 0) {
            recommendations.push({
                id: `rec_${Date.now()}_performance`,
                title: 'Improve System Performance',
                description: `${performanceFeedback.length} users reported performance issues`,
                priority: 'medium',
                effort: 'high',
                impact: 'high',
                category: 'performance',
                actionItems: [
                    'Analyze system performance metrics',
                    'Identify bottlenecks and optimization opportunities',
                    'Implement performance improvements',
                    'Monitor performance after changes'
                ],
                estimatedTimeframe: '4-8 weeks'
            });
        }
        return recommendations;
    }
    calculateCorrelations(feedbackList) {
        // Simple correlation analysis between rating and other factors
        // This is a simplified implementation - in production, you'd use proper statistical methods
        return [];
    }
    async processFeedbackAsync(feedback) {
        // Asynchronous processing of feedback
        try {
            // Auto-categorize high-priority feedback
            if (feedback.priority === 'high') {
                await this.updateFeedbackStatus(feedback.id, 'under-review');
            }
            // Send notifications for critical feedback
            if (feedback.rating <= 2 && feedback.feedbackType === 'bug-report') {
                console.log(`Critical feedback received: ${feedback.id}`);
                // In production, this would send notifications to relevant teams
            }
            // Update related feedback
            if (feedback.metadata.relatedFeedback && feedback.metadata.relatedFeedback.length > 0) {
                // Link related feedback entries
                console.log(`Linking related feedback for: ${feedback.id}`);
            }
        }
        catch (error) {
            console.error('Error processing feedback asynchronously:', error);
        }
    }
}
exports.FeedbackService = FeedbackService;
// Export singleton instance
exports.feedbackService = new FeedbackService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2stc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXJ2aWNlcy9mZWVkYmFjay1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx3RUFBd0U7OztBQUV4RSxpREFpQjRCO0FBRTVCLE1BQWEsZUFBZTtJQUkxQjtRQUhRLGtCQUFhLEdBQTBCLElBQUksR0FBRyxFQUFFLENBQUM7UUFDakQsa0JBQWEsR0FBNkIsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQjtRQUdyRixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRU8saUJBQWlCO1FBQ3ZCLDRCQUE0QjtRQUM1QixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RCxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxZQUErQjtRQUNsRCxJ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QyxDQUFDO1NBQ0o7UUFFRCxPQUFPLGVBQWUsQ0FBQztJQUN6QixDQUFDO0lBRU8scUJBQXFCLENBQUMsWUFBd0I7UUFDcEQsK0RBQStEO1FBQy9ELDRGQUE0RjtRQUM1RixPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsUUFBa0I7UUFDbkQsc0NBQXNDO1FBQ3RDLElBQUk7WUFDRix5Q0FBeUM7WUFDekMsSUFBSSxRQUFRLENBQUMsUUFBUSxLQUFLLE1BQU0sRUFBRTtnQkFDaEMsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQzthQUM5RDtZQUVELDJDQUEyQztZQUMzQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxZQUFZLEtBQUssWUFBWSxFQUFFO2dCQUNsRSxPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDMUQsaUVBQWlFO2FBQ2xFO1lBRUQsMEJBQTBCO1lBQzFCLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxlQUFlLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDckYsZ0NBQWdDO2dCQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUM3RDtTQUNGO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25FO0lBQ0gsQ0FBQztDQUNGO0FBM2dCRCwwQ0EyZ0JDO0FBRUQsNEJBQTRCO0FBQ2YsUUFBQSxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEZlZWRiYWNrIHNlcnZpY2UgZm9yIGNvbGxlY3RpbmcsIHN0b3JpbmcsIGFuZCBhbmFseXppbmcgdXNlciBmZWVkYmFja1xuXG5pbXBvcnQge1xuICBGZWVkYmFjayxcbiAgRmVlZGJhY2tUeXBlLFxuICBGZWVkYmFja0NhdGVnb3J5LFxuICBGZWVkYmFja1N0YXR1cyxcbiAgRmVlZGJhY2tTdW1tYXJ5LFxuICBGZWVkYmFja0FuYWx5dGljcyxcbiAgRmVlZGJhY2tGaWx0ZXIsXG4gIEZlZWRiYWNrU2VhcmNoT3B0aW9ucyxcbiAgRmVlZGJhY2tTZWFyY2hSZXN1bHQsXG4gIEZlZWRiYWNrVHJlbmQsXG4gIEZlZWRiYWNrSW5zaWdodCxcbiAgRmVlZGJhY2tSZWNvbW1lbmRhdGlvbixcbiAgdmFsaWRhdGVGZWVkYmFjayxcbiAgY3JlYXRlRmVlZGJhY2tJZCxcbiAgZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQsXG4gIGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHlcbn0gZnJvbSAnLi4vbW9kZWxzL2ZlZWRiYWNrJztcblxuZXhwb3J0IGNsYXNzIEZlZWRiYWNrU2VydmljZSB7XG4gIHByaXZhdGUgZmVlZGJhY2tTdG9yZTogTWFwPHN0cmluZywgRmVlZGJhY2s+ID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIGZlZWRiYWNrSW5kZXg6IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PiA9IG5ldyBNYXAoKTsgLy8gRm9yIGVmZmljaWVudCBzZWFyY2hpbmdcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmluaXRpYWxpemVJbmRleGVzKCk7XG4gIH1cblxuICBwcml2YXRlIGluaXRpYWxpemVJbmRleGVzKCk6IHZvaWQge1xuICAgIC8vIEluaXRpYWxpemUgc2VhcmNoIGluZGV4ZXNcbiAgICB0aGlzLmZlZWRiYWNrSW5kZXguc2V0KCd1c2VySWQnLCBuZXcgU2V0KCkpO1xuICAgIHRoaXMuZmVlZGJhY2tJbmRleC5zZXQoJ2ludmVzdG1lbnRJZGVhSWQnLCBuZXcgU2V0KCkpO1xuICAgIHRoaXMuZmVlZGJhY2tJbmRleC5zZXQoJ2FuYWx5c2lzSWQnLCBuZXcgU2V0KCkpO1xuICAgIHRoaXMuZmVlZGJhY2tJbmRleC5zZXQoJ2ZlZWRiYWNrVHlwZScsIG5ldyBTZXQoKSk7XG4gICAgdGhpcy5mZWVkYmFja0luZGV4LnNldCgnY2F0ZWdvcnknLCBuZXcgU2V0KCkpO1xuICAgIHRoaXMuZmVlZGJhY2tJbmRleC5zZXQoJ3N0YXR1cycsIG5ldyBTZXQoKSk7XG4gICAgdGhpcy5mZWVkYmFja0luZGV4LnNldCgnc2VudGltZW50JywgbmV3IFNldCgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJtaXQgbmV3IGZlZWRiYWNrXG4gICAqL1xuICBhc3luYyBzdWJtaXRGZWVkYmFjayhmZWVkYmFja0RhdGE6IFBhcnRpYWw8RmVlZGJhY2s+KTogUHJvbWlzZTx7IHN1Y2Nlc3M6IGJvb2xlYW47IGZlZWRiYWNrPzogRmVlZGJhY2s7IGVycm9ycz86IHN0cmluZ1tdIH0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gVmFsaWRhdGUgZmVlZGJhY2sgZGF0YVxuICAgICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRmVlZGJhY2soZmVlZGJhY2tEYXRhKTtcbiAgICAgIGlmICghdmFsaWRhdGlvbi52YWxpZCkge1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgZXJyb3JzOiB2YWxpZGF0aW9uLmVycm9ycyB9O1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgZmVlZGJhY2sgb2JqZWN0XG4gICAgICBjb25zdCBmZWVkYmFjazogRmVlZGJhY2sgPSB7XG4gICAgICAgIGlkOiBjcmVhdGVGZWVkYmFja0lkKCksXG4gICAgICAgIHVzZXJJZDogZmVlZGJhY2tEYXRhLnVzZXJJZCEsXG4gICAgICAgIGludmVzdG1lbnRJZGVhSWQ6IGZlZWRiYWNrRGF0YS5pbnZlc3RtZW50SWRlYUlkLFxuICAgICAgICBhbmFseXNpc0lkOiBmZWVkYmFja0RhdGEuYW5hbHlzaXNJZCxcbiAgICAgICAgcmVxdWVzdElkOiBmZWVkYmFja0RhdGEucmVxdWVzdElkLFxuICAgICAgICBmZWVkYmFja1R5cGU6IGZlZWRiYWNrRGF0YS5mZWVkYmFja1R5cGUhLFxuICAgICAgICByYXRpbmc6IGZlZWRiYWNrRGF0YS5yYXRpbmchLFxuICAgICAgICBjYXRlZ29yeTogZmVlZGJhY2tEYXRhLmNhdGVnb3J5ISxcbiAgICAgICAgdGl0bGU6IGZlZWRiYWNrRGF0YS50aXRsZSEsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBmZWVkYmFja0RhdGEuZGVzY3JpcHRpb24hLFxuICAgICAgICB0YWdzOiBmZWVkYmFja0RhdGEudGFncyB8fCBbXSxcbiAgICAgICAgc2VudGltZW50OiBkZXRlcm1pbmVGZWVkYmFja1NlbnRpbWVudChmZWVkYmFja0RhdGEucmF0aW5nISwgZmVlZGJhY2tEYXRhLmRlc2NyaXB0aW9uISksXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJywgLy8gV2lsbCBiZSBjYWxjdWxhdGVkIGJlbG93XG4gICAgICAgIHN0YXR1czogJ3N1Ym1pdHRlZCcsXG4gICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgc291cmNlOiBmZWVkYmFja0RhdGEubWV0YWRhdGE/LnNvdXJjZSB8fCAnd2ViJyxcbiAgICAgICAgICB1c2VyQWdlbnQ6IGZlZWRiYWNrRGF0YS5tZXRhZGF0YT8udXNlckFnZW50LFxuICAgICAgICAgIHNlc3Npb25JZDogZmVlZGJhY2tEYXRhLm1ldGFkYXRhPy5zZXNzaW9uSWQsXG4gICAgICAgICAgY29udGV4dERhdGE6IGZlZWRiYWNrRGF0YS5tZXRhZGF0YT8uY29udGV4dERhdGEsXG4gICAgICAgICAgYXR0YWNobWVudHM6IGZlZWRiYWNrRGF0YS5tZXRhZGF0YT8uYXR0YWNobWVudHMgfHwgW10sXG4gICAgICAgICAgcmVsYXRlZEZlZWRiYWNrOiBmZWVkYmFja0RhdGEubWV0YWRhdGE/LnJlbGF0ZWRGZWVkYmFjayB8fCBbXVxuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKVxuICAgICAgfTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIHByaW9yaXR5XG4gICAgICBmZWVkYmFjay5wcmlvcml0eSA9IGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHkoZmVlZGJhY2spO1xuXG4gICAgICAvLyBTdG9yZSBmZWVkYmFja1xuICAgICAgdGhpcy5mZWVkYmFja1N0b3JlLnNldChmZWVkYmFjay5pZCwgZmVlZGJhY2spO1xuICAgICAgdGhpcy51cGRhdGVJbmRleGVzKGZlZWRiYWNrKTtcblxuICAgICAgLy8gUHJvY2VzcyBmZWVkYmFjayBhc3luY2hyb25vdXNseVxuICAgICAgdGhpcy5wcm9jZXNzRmVlZGJhY2tBc3luYyhmZWVkYmFjayk7XG5cbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGZlZWRiYWNrIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN1Ym1pdHRpbmcgZmVlZGJhY2s6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIGVycm9yczogWydGYWlsZWQgdG8gc3VibWl0IGZlZWRiYWNrJ10gfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZlZWRiYWNrIGJ5IElEXG4gICAqL1xuICBhc3luYyBnZXRGZWVkYmFjayhpZDogc3RyaW5nKTogUHJvbWlzZTxGZWVkYmFjayB8IG51bGw+IHtcbiAgICByZXR1cm4gdGhpcy5mZWVkYmFja1N0b3JlLmdldChpZCkgfHwgbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggZmVlZGJhY2sgd2l0aCBmaWx0ZXJzIGFuZCBvcHRpb25zXG4gICAqL1xuICBhc3luYyBzZWFyY2hGZWVkYmFjayhvcHRpb25zOiBGZWVkYmFja1NlYXJjaE9wdGlvbnMgPSB7fSk6IFByb21pc2U8RmVlZGJhY2tTZWFyY2hSZXN1bHQ+IHtcbiAgICB0cnkge1xuICAgICAgbGV0IGZlZWRiYWNrTGlzdCA9IEFycmF5LmZyb20odGhpcy5mZWVkYmFja1N0b3JlLnZhbHVlcygpKTtcblxuICAgICAgLy8gQXBwbHkgZmlsdGVyc1xuICAgICAgaWYgKG9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICBmZWVkYmFja0xpc3QgPSB0aGlzLmFwcGx5RmlsdGVycyhmZWVkYmFja0xpc3QsIG9wdGlvbnMuZmlsdGVycyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFwcGx5IHRleHQgc2VhcmNoXG4gICAgICBpZiAob3B0aW9ucy5xdWVyeSkge1xuICAgICAgICBmZWVkYmFja0xpc3QgPSB0aGlzLmFwcGx5VGV4dFNlYXJjaChmZWVkYmFja0xpc3QsIG9wdGlvbnMucXVlcnkpO1xuICAgICAgfVxuXG4gICAgICAvLyBTb3J0IHJlc3VsdHNcbiAgICAgIGZlZWRiYWNrTGlzdCA9IHRoaXMuc29ydEZlZWRiYWNrKGZlZWRiYWNrTGlzdCwgb3B0aW9ucy5zb3J0QnksIG9wdGlvbnMuc29ydE9yZGVyKTtcblxuICAgICAgLy8gQ2FsY3VsYXRlIGFnZ3JlZ2F0aW9uc1xuICAgICAgY29uc3QgYWdncmVnYXRpb25zID0gdGhpcy5jYWxjdWxhdGVBZ2dyZWdhdGlvbnMoZmVlZGJhY2tMaXN0KTtcblxuICAgICAgLy8gQXBwbHkgcGFnaW5hdGlvblxuICAgICAgY29uc3QgdG90YWxDb3VudCA9IGZlZWRiYWNrTGlzdC5sZW5ndGg7XG4gICAgICBjb25zdCBvZmZzZXQgPSBvcHRpb25zLm9mZnNldCB8fCAwO1xuICAgICAgY29uc3QgbGltaXQgPSBvcHRpb25zLmxpbWl0IHx8IDUwO1xuICAgICAgY29uc3QgcGFnaW5hdGVkRmVlZGJhY2sgPSBmZWVkYmFja0xpc3Quc2xpY2Uob2Zmc2V0LCBvZmZzZXQgKyBsaW1pdCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZlZWRiYWNrOiBwYWdpbmF0ZWRGZWVkYmFjayxcbiAgICAgICAgdG90YWxDb3VudCxcbiAgICAgICAgaGFzTW9yZTogb2Zmc2V0ICsgbGltaXQgPCB0b3RhbENvdW50LFxuICAgICAgICBhZ2dyZWdhdGlvbnNcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlYXJjaGluZyBmZWVkYmFjazonLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBmZWVkYmFjazogW10sXG4gICAgICAgIHRvdGFsQ291bnQ6IDAsXG4gICAgICAgIGhhc01vcmU6IGZhbHNlXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgZmVlZGJhY2sgc3RhdHVzXG4gICAqL1xuICBhc3luYyB1cGRhdGVGZWVkYmFja1N0YXR1cyhpZDogc3RyaW5nLCBzdGF0dXM6IEZlZWRiYWNrU3RhdHVzLCByZXNvbHZlZEJ5Pzogc3RyaW5nLCByZXNvbHV0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZlZWRiYWNrID0gdGhpcy5mZWVkYmFja1N0b3JlLmdldChpZCk7XG4gICAgICBpZiAoIWZlZWRiYWNrKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGZlZWRiYWNrLnN0YXR1cyA9IHN0YXR1cztcbiAgICAgIGZlZWRiYWNrLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cbiAgICAgIGlmIChzdGF0dXMgPT09ICdyZXNvbHZlZCcpIHtcbiAgICAgICAgZmVlZGJhY2sucmVzb2x2ZWRBdCA9IG5ldyBEYXRlKCk7XG4gICAgICAgIGZlZWRiYWNrLnJlc29sdmVkQnkgPSByZXNvbHZlZEJ5O1xuICAgICAgICBmZWVkYmFjay5yZXNvbHV0aW9uID0gcmVzb2x1dGlvbjtcbiAgICAgIH1cblxuICAgICAgdGhpcy5mZWVkYmFja1N0b3JlLnNldChpZCwgZmVlZGJhY2spO1xuICAgICAgdGhpcy51cGRhdGVJbmRleGVzKGZlZWRiYWNrKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHVwZGF0aW5nIGZlZWRiYWNrIHN0YXR1czonLCBlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBmZWVkYmFjayBzdW1tYXJ5IGZvciBhIHRpbWUgcGVyaW9kXG4gICAqL1xuICBhc3luYyBnZXRGZWVkYmFja1N1bW1hcnkoc3RhcnREYXRlOiBEYXRlLCBlbmREYXRlOiBEYXRlLCBmaWx0ZXJzPzogRmVlZGJhY2tGaWx0ZXIpOiBQcm9taXNlPEZlZWRiYWNrU3VtbWFyeT4ge1xuICAgIHRyeSB7XG4gICAgICBsZXQgZmVlZGJhY2tMaXN0ID0gQXJyYXkuZnJvbSh0aGlzLmZlZWRiYWNrU3RvcmUudmFsdWVzKCkpXG4gICAgICAgIC5maWx0ZXIoZiA9PiBmLmNyZWF0ZWRBdCA+PSBzdGFydERhdGUgJiYgZi5jcmVhdGVkQXQgPD0gZW5kRGF0ZSk7XG5cbiAgICAgIGlmIChmaWx0ZXJzKSB7XG4gICAgICAgIGZlZWRiYWNrTGlzdCA9IHRoaXMuYXBwbHlGaWx0ZXJzKGZlZWRiYWNrTGlzdCwgZmlsdGVycyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSBmZWVkYmFja0xpc3QubGVuZ3RoO1xuICAgICAgY29uc3QgYXZlcmFnZVJhdGluZyA9IHRvdGFsQ291bnQgPiAwIFxuICAgICAgICA/IGZlZWRiYWNrTGlzdC5yZWR1Y2UoKHN1bSwgZikgPT4gc3VtICsgZi5yYXRpbmcsIDApIC8gdG90YWxDb3VudCBcbiAgICAgICAgOiAwO1xuXG4gICAgICAvLyBSYXRpbmcgZGlzdHJpYnV0aW9uXG4gICAgICBjb25zdCByYXRpbmdEaXN0cmlidXRpb246IFJlY29yZDxudW1iZXIsIG51bWJlcj4gPSB7IDE6IDAsIDI6IDAsIDM6IDAsIDQ6IDAsIDU6IDAgfTtcbiAgICAgIGZlZWRiYWNrTGlzdC5mb3JFYWNoKGYgPT4gcmF0aW5nRGlzdHJpYnV0aW9uW2YucmF0aW5nXSsrKTtcblxuICAgICAgLy8gQ2F0ZWdvcnkgYnJlYWtkb3duXG4gICAgICBjb25zdCBjYXRlZ29yeUJyZWFrZG93bjogUmVjb3JkPEZlZWRiYWNrQ2F0ZWdvcnksIG51bWJlcj4gPSB7XG4gICAgICAgIGFjY3VyYWN5OiAwLCByZWxldmFuY2U6IDAsIGNvbXBsZXRlbmVzczogMCwgdGltZWxpbmVzczogMCxcbiAgICAgICAgdXNhYmlsaXR5OiAwLCBwZXJmb3JtYW5jZTogMCwgY29tcGxpYW5jZTogMCwgb3RoZXI6IDBcbiAgICAgIH07XG4gICAgICBmZWVkYmFja0xpc3QuZm9yRWFjaChmID0+IGNhdGVnb3J5QnJlYWtkb3duW2YuY2F0ZWdvcnldKyspO1xuXG4gICAgICAvLyBUeXBlIGJyZWFrZG93blxuICAgICAgY29uc3QgdHlwZUJyZWFrZG93bjogUmVjb3JkPEZlZWRiYWNrVHlwZSwgbnVtYmVyPiA9IHtcbiAgICAgICAgJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JzogMCwgJ2FuYWx5c2lzLWFjY3VyYWN5JzogMCwgJ3N5c3RlbS1wZXJmb3JtYW5jZSc6IDAsXG4gICAgICAgICd1c2VyLWV4cGVyaWVuY2UnOiAwLCAnZmVhdHVyZS1yZXF1ZXN0JzogMCwgJ2J1Zy1yZXBvcnQnOiAwLCAnZ2VuZXJhbCc6IDBcbiAgICAgIH07XG4gICAgICBmZWVkYmFja0xpc3QuZm9yRWFjaChmID0+IHR5cGVCcmVha2Rvd25bZi5mZWVkYmFja1R5cGVdKyspO1xuXG4gICAgICAvLyBTZW50aW1lbnQgYnJlYWtkb3duXG4gICAgICBjb25zdCBzZW50aW1lbnRCcmVha2Rvd246IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IHBvc2l0aXZlOiAwLCBuZXV0cmFsOiAwLCBuZWdhdGl2ZTogMCB9O1xuICAgICAgZmVlZGJhY2tMaXN0LmZvckVhY2goZiA9PiBzZW50aW1lbnRCcmVha2Rvd25bZi5zZW50aW1lbnRdKyspO1xuXG4gICAgICAvLyBTdGF0dXMgYnJlYWtkb3duXG4gICAgICBjb25zdCBzdGF0dXNCcmVha2Rvd246IFJlY29yZDxGZWVkYmFja1N0YXR1cywgbnVtYmVyPiA9IHtcbiAgICAgICAgc3VibWl0dGVkOiAwLCAndW5kZXItcmV2aWV3JzogMCwgJ2luLXByb2dyZXNzJzogMCxcbiAgICAgICAgcmVzb2x2ZWQ6IDAsIGRpc21pc3NlZDogMCwgYXJjaGl2ZWQ6IDBcbiAgICAgIH07XG4gICAgICBmZWVkYmFja0xpc3QuZm9yRWFjaChmID0+IHN0YXR1c0JyZWFrZG93bltmLnN0YXR1c10rKyk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRvdGFsQ291bnQsXG4gICAgICAgIGF2ZXJhZ2VSYXRpbmcsXG4gICAgICAgIHJhdGluZ0Rpc3RyaWJ1dGlvbixcbiAgICAgICAgY2F0ZWdvcnlCcmVha2Rvd24sXG4gICAgICAgIHR5cGVCcmVha2Rvd24sXG4gICAgICAgIHNlbnRpbWVudEJyZWFrZG93bixcbiAgICAgICAgc3RhdHVzQnJlYWtkb3duLFxuICAgICAgICB0aW1lUmFuZ2U6IHsgc3RhcnQ6IHN0YXJ0RGF0ZSwgZW5kOiBlbmREYXRlIH1cbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgZmVlZGJhY2sgc3VtbWFyeTonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgZmVlZGJhY2sgYW5hbHl0aWNzIGFuZCBpbnNpZ2h0c1xuICAgKi9cbiAgYXN5bmMgZ2VuZXJhdGVGZWVkYmFja0FuYWx5dGljcyh0aW1lUmFuZ2U6IHsgc3RhcnQ6IERhdGU7IGVuZDogRGF0ZSB9KTogUHJvbWlzZTxGZWVkYmFja0FuYWx5dGljcz4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmZWVkYmFja0xpc3QgPSBBcnJheS5mcm9tKHRoaXMuZmVlZGJhY2tTdG9yZS52YWx1ZXMoKSlcbiAgICAgICAgLmZpbHRlcihmID0+IGYuY3JlYXRlZEF0ID49IHRpbWVSYW5nZS5zdGFydCAmJiBmLmNyZWF0ZWRBdCA8PSB0aW1lUmFuZ2UuZW5kKTtcblxuICAgICAgY29uc3QgdHJlbmRzID0gdGhpcy5jYWxjdWxhdGVUcmVuZHMoZmVlZGJhY2tMaXN0LCB0aW1lUmFuZ2UpO1xuICAgICAgY29uc3QgaW5zaWdodHMgPSB0aGlzLmdlbmVyYXRlSW5zaWdodHMoZmVlZGJhY2tMaXN0KTtcbiAgICAgIGNvbnN0IHJlY29tbWVuZGF0aW9ucyA9IHRoaXMuZ2VuZXJhdGVSZWNvbW1lbmRhdGlvbnMoZmVlZGJhY2tMaXN0KTtcbiAgICAgIGNvbnN0IGNvcnJlbGF0aW9ucyA9IHRoaXMuY2FsY3VsYXRlQ29ycmVsYXRpb25zKGZlZWRiYWNrTGlzdCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRyZW5kcyxcbiAgICAgICAgaW5zaWdodHMsXG4gICAgICAgIHJlY29tbWVuZGF0aW9ucyxcbiAgICAgICAgY29ycmVsYXRpb25zXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIGZlZWRiYWNrIGFuYWx5dGljczonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZlZWRiYWNrIGZvciBhIHNwZWNpZmljIGludmVzdG1lbnQgaWRlYVxuICAgKi9cbiAgYXN5bmMgZ2V0RmVlZGJhY2tGb3JJbnZlc3RtZW50SWRlYShpbnZlc3RtZW50SWRlYUlkOiBzdHJpbmcpOiBQcm9taXNlPEZlZWRiYWNrW10+IHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmZlZWRiYWNrU3RvcmUudmFsdWVzKCkpXG4gICAgICAuZmlsdGVyKGYgPT4gZi5pbnZlc3RtZW50SWRlYUlkID09PSBpbnZlc3RtZW50SWRlYUlkKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGIuY3JlYXRlZEF0LmdldFRpbWUoKSAtIGEuY3JlYXRlZEF0LmdldFRpbWUoKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZlZWRiYWNrIGZvciBhIHNwZWNpZmljIHVzZXJcbiAgICovXG4gIGFzeW5jIGdldEZlZWRiYWNrRm9yVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8RmVlZGJhY2tbXT4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZmVlZGJhY2tTdG9yZS52YWx1ZXMoKSlcbiAgICAgIC5maWx0ZXIoZiA9PiBmLnVzZXJJZCA9PT0gdXNlcklkKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IGIuY3JlYXRlZEF0LmdldFRpbWUoKSAtIGEuY3JlYXRlZEF0LmdldFRpbWUoKSk7XG4gIH1cblxuICAvLyBQcml2YXRlIGhlbHBlciBtZXRob2RzXG5cbiAgcHJpdmF0ZSB1cGRhdGVJbmRleGVzKGZlZWRiYWNrOiBGZWVkYmFjayk6IHZvaWQge1xuICAgIC8vIFVwZGF0ZSBzZWFyY2ggaW5kZXhlcyBmb3IgZWZmaWNpZW50IHF1ZXJ5aW5nXG4gICAgdGhpcy5mZWVkYmFja0luZGV4LmdldCgndXNlcklkJyk/LmFkZChgJHtmZWVkYmFjay51c2VySWR9OiR7ZmVlZGJhY2suaWR9YCk7XG4gICAgaWYgKGZlZWRiYWNrLmludmVzdG1lbnRJZGVhSWQpIHtcbiAgICAgIHRoaXMuZmVlZGJhY2tJbmRleC5nZXQoJ2ludmVzdG1lbnRJZGVhSWQnKT8uYWRkKGAke2ZlZWRiYWNrLmludmVzdG1lbnRJZGVhSWR9OiR7ZmVlZGJhY2suaWR9YCk7XG4gICAgfVxuICAgIGlmIChmZWVkYmFjay5hbmFseXNpc0lkKSB7XG4gICAgICB0aGlzLmZlZWRiYWNrSW5kZXguZ2V0KCdhbmFseXNpc0lkJyk/LmFkZChgJHtmZWVkYmFjay5hbmFseXNpc0lkfToke2ZlZWRiYWNrLmlkfWApO1xuICAgIH1cbiAgICB0aGlzLmZlZWRiYWNrSW5kZXguZ2V0KCdmZWVkYmFja1R5cGUnKT8uYWRkKGAke2ZlZWRiYWNrLmZlZWRiYWNrVHlwZX06JHtmZWVkYmFjay5pZH1gKTtcbiAgICB0aGlzLmZlZWRiYWNrSW5kZXguZ2V0KCdjYXRlZ29yeScpPy5hZGQoYCR7ZmVlZGJhY2suY2F0ZWdvcnl9OiR7ZmVlZGJhY2suaWR9YCk7XG4gICAgdGhpcy5mZWVkYmFja0luZGV4LmdldCgnc3RhdHVzJyk/LmFkZChgJHtmZWVkYmFjay5zdGF0dXN9OiR7ZmVlZGJhY2suaWR9YCk7XG4gICAgdGhpcy5mZWVkYmFja0luZGV4LmdldCgnc2VudGltZW50Jyk/LmFkZChgJHtmZWVkYmFjay5zZW50aW1lbnR9OiR7ZmVlZGJhY2suaWR9YCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5RmlsdGVycyhmZWVkYmFja0xpc3Q6IEZlZWRiYWNrW10sIGZpbHRlcnM6IEZlZWRiYWNrRmlsdGVyKTogRmVlZGJhY2tbXSB7XG4gICAgcmV0dXJuIGZlZWRiYWNrTGlzdC5maWx0ZXIoZmVlZGJhY2sgPT4ge1xuICAgICAgaWYgKGZpbHRlcnMudXNlcklkICYmIGZlZWRiYWNrLnVzZXJJZCAhPT0gZmlsdGVycy51c2VySWQpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChmaWx0ZXJzLmludmVzdG1lbnRJZGVhSWQgJiYgZmVlZGJhY2suaW52ZXN0bWVudElkZWFJZCAhPT0gZmlsdGVycy5pbnZlc3RtZW50SWRlYUlkKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoZmlsdGVycy5hbmFseXNpc0lkICYmIGZlZWRiYWNrLmFuYWx5c2lzSWQgIT09IGZpbHRlcnMuYW5hbHlzaXNJZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGZpbHRlcnMuZmVlZGJhY2tUeXBlICYmICFmaWx0ZXJzLmZlZWRiYWNrVHlwZS5pbmNsdWRlcyhmZWVkYmFjay5mZWVkYmFja1R5cGUpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoZmlsdGVycy5jYXRlZ29yeSAmJiAhZmlsdGVycy5jYXRlZ29yeS5pbmNsdWRlcyhmZWVkYmFjay5jYXRlZ29yeSkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChmaWx0ZXJzLnNlbnRpbWVudCAmJiAhZmlsdGVycy5zZW50aW1lbnQuaW5jbHVkZXMoZmVlZGJhY2suc2VudGltZW50KSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGZpbHRlcnMuc3RhdHVzICYmICFmaWx0ZXJzLnN0YXR1cy5pbmNsdWRlcyhmZWVkYmFjay5zdGF0dXMpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoZmlsdGVycy5wcmlvcml0eSAmJiAhZmlsdGVycy5wcmlvcml0eS5pbmNsdWRlcyhmZWVkYmFjay5wcmlvcml0eSkpIHJldHVybiBmYWxzZTtcbiAgICAgIFxuICAgICAgaWYgKGZpbHRlcnMucmF0aW5nKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnJhdGluZy5taW4gJiYgZmVlZGJhY2sucmF0aW5nIDwgZmlsdGVycy5yYXRpbmcubWluKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmIChmaWx0ZXJzLnJhdGluZy5tYXggJiYgZmVlZGJhY2sucmF0aW5nID4gZmlsdGVycy5yYXRpbmcubWF4KSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChmaWx0ZXJzLmRhdGVSYW5nZSkge1xuICAgICAgICBpZiAoZmVlZGJhY2suY3JlYXRlZEF0IDwgZmlsdGVycy5kYXRlUmFuZ2Uuc3RhcnQgfHwgZmVlZGJhY2suY3JlYXRlZEF0ID4gZmlsdGVycy5kYXRlUmFuZ2UuZW5kKSByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmIChmaWx0ZXJzLnRhZ3MgJiYgZmlsdGVycy50YWdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgaGFzTWF0Y2hpbmdUYWcgPSBmaWx0ZXJzLnRhZ3Muc29tZSh0YWcgPT4gZmVlZGJhY2sudGFncy5pbmNsdWRlcyh0YWcpKTtcbiAgICAgICAgaWYgKCFoYXNNYXRjaGluZ1RhZykgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlUZXh0U2VhcmNoKGZlZWRiYWNrTGlzdDogRmVlZGJhY2tbXSwgcXVlcnk6IHN0cmluZyk6IEZlZWRiYWNrW10ge1xuICAgIGNvbnN0IHNlYXJjaFRlcm1zID0gcXVlcnkudG9Mb3dlckNhc2UoKS5zcGxpdCgnICcpLmZpbHRlcih0ZXJtID0+IHRlcm0ubGVuZ3RoID4gMCk7XG4gICAgXG4gICAgcmV0dXJuIGZlZWRiYWNrTGlzdC5maWx0ZXIoZmVlZGJhY2sgPT4ge1xuICAgICAgY29uc3Qgc2VhcmNoYWJsZVRleHQgPSBbXG4gICAgICAgIGZlZWRiYWNrLnRpdGxlLFxuICAgICAgICBmZWVkYmFjay5kZXNjcmlwdGlvbixcbiAgICAgICAgLi4uZmVlZGJhY2sudGFnc1xuICAgICAgXS5qb2luKCcgJykudG9Mb3dlckNhc2UoKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHNlYXJjaFRlcm1zLmV2ZXJ5KHRlcm0gPT4gc2VhcmNoYWJsZVRleHQuaW5jbHVkZXModGVybSkpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBzb3J0RmVlZGJhY2soZmVlZGJhY2tMaXN0OiBGZWVkYmFja1tdLCBzb3J0Qnk/OiBzdHJpbmcsIHNvcnRPcmRlcj86IHN0cmluZyk6IEZlZWRiYWNrW10ge1xuICAgIGNvbnN0IG9yZGVyID0gc29ydE9yZGVyID09PSAnYXNjJyA/IDEgOiAtMTtcbiAgICBcbiAgICByZXR1cm4gZmVlZGJhY2tMaXN0LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGxldCBjb21wYXJpc29uID0gMDtcbiAgICAgIFxuICAgICAgc3dpdGNoIChzb3J0QnkpIHtcbiAgICAgICAgY2FzZSAncmF0aW5nJzpcbiAgICAgICAgICBjb21wYXJpc29uID0gYS5yYXRpbmcgLSBiLnJhdGluZztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncHJpb3JpdHknOlxuICAgICAgICAgIGNvbnN0IHByaW9yaXR5T3JkZXIgPSB7IGhpZ2g6IDMsIG1lZGl1bTogMiwgbG93OiAxIH07XG4gICAgICAgICAgY29tcGFyaXNvbiA9IHByaW9yaXR5T3JkZXJbYS5wcmlvcml0eV0gLSBwcmlvcml0eU9yZGVyW2IucHJpb3JpdHldO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd1cGRhdGVkQXQnOlxuICAgICAgICAgIGNvbXBhcmlzb24gPSBhLnVwZGF0ZWRBdC5nZXRUaW1lKCkgLSBiLnVwZGF0ZWRBdC5nZXRUaW1lKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NyZWF0ZWRBdCc6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29tcGFyaXNvbiA9IGEuY3JlYXRlZEF0LmdldFRpbWUoKSAtIGIuY3JlYXRlZEF0LmdldFRpbWUoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIGNvbXBhcmlzb24gKiBvcmRlcjtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlQWdncmVnYXRpb25zKGZlZWRiYWNrTGlzdDogRmVlZGJhY2tbXSkge1xuICAgIGNvbnN0IHRvdGFsQ291bnQgPSBmZWVkYmFja0xpc3QubGVuZ3RoO1xuICAgIGlmICh0b3RhbENvdW50ID09PSAwKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgY29uc3QgYXZlcmFnZVJhdGluZyA9IGZlZWRiYWNrTGlzdC5yZWR1Y2UoKHN1bSwgZikgPT4gc3VtICsgZi5yYXRpbmcsIDApIC8gdG90YWxDb3VudDtcbiAgICBcbiAgICBjb25zdCBjYXRlZ29yeUJyZWFrZG93bjogUmVjb3JkPEZlZWRiYWNrQ2F0ZWdvcnksIG51bWJlcj4gPSB7XG4gICAgICBhY2N1cmFjeTogMCwgcmVsZXZhbmNlOiAwLCBjb21wbGV0ZW5lc3M6IDAsIHRpbWVsaW5lc3M6IDAsXG4gICAgICB1c2FiaWxpdHk6IDAsIHBlcmZvcm1hbmNlOiAwLCBjb21wbGlhbmNlOiAwLCBvdGhlcjogMFxuICAgIH07XG4gICAgZmVlZGJhY2tMaXN0LmZvckVhY2goZiA9PiBjYXRlZ29yeUJyZWFrZG93bltmLmNhdGVnb3J5XSsrKTtcbiAgICBcbiAgICBjb25zdCBzZW50aW1lbnRCcmVha2Rvd246IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7IHBvc2l0aXZlOiAwLCBuZXV0cmFsOiAwLCBuZWdhdGl2ZTogMCB9O1xuICAgIGZlZWRiYWNrTGlzdC5mb3JFYWNoKGYgPT4gc2VudGltZW50QnJlYWtkb3duW2Yuc2VudGltZW50XSsrKTtcblxuICAgIHJldHVybiB7XG4gICAgICBhdmVyYWdlUmF0aW5nLFxuICAgICAgY2F0ZWdvcnlCcmVha2Rvd24sXG4gICAgICBzZW50aW1lbnRCcmVha2Rvd25cbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVUcmVuZHMoZmVlZGJhY2tMaXN0OiBGZWVkYmFja1tdLCB0aW1lUmFuZ2U6IHsgc3RhcnQ6IERhdGU7IGVuZDogRGF0ZSB9KTogRmVlZGJhY2tUcmVuZFtdIHtcbiAgICAvLyBDYWxjdWxhdGUgZGFpbHkgdHJlbmRzIGZvciByYXRpbmcgYW5kIHZvbHVtZVxuICAgIGNvbnN0IGRhaWx5RGF0YSA9IG5ldyBNYXA8c3RyaW5nLCB7IGNvdW50OiBudW1iZXI7IHRvdGFsUmF0aW5nOiBudW1iZXIgfT4oKTtcbiAgICBcbiAgICBmZWVkYmFja0xpc3QuZm9yRWFjaChmZWVkYmFjayA9PiB7XG4gICAgICBjb25zdCBkYXRlS2V5ID0gZmVlZGJhY2suY3JlYXRlZEF0LnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gZGFpbHlEYXRhLmdldChkYXRlS2V5KSB8fCB7IGNvdW50OiAwLCB0b3RhbFJhdGluZzogMCB9O1xuICAgICAgZGFpbHlEYXRhLnNldChkYXRlS2V5LCB7XG4gICAgICAgIGNvdW50OiBleGlzdGluZy5jb3VudCArIDEsXG4gICAgICAgIHRvdGFsUmF0aW5nOiBleGlzdGluZy50b3RhbFJhdGluZyArIGZlZWRiYWNrLnJhdGluZ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2b2x1bWVUcmVuZDogRmVlZGJhY2tUcmVuZCA9IHtcbiAgICAgIG1ldHJpYzogJ3ZvbHVtZScsXG4gICAgICBwZXJpb2Q6ICdkYWlseScsXG4gICAgICBkYXRhOiBBcnJheS5mcm9tKGRhaWx5RGF0YS5lbnRyaWVzKCkpLm1hcCgoW2RhdGUsIGRhdGFdKSA9PiAoe1xuICAgICAgICBkYXRlOiBuZXcgRGF0ZShkYXRlKSxcbiAgICAgICAgdmFsdWU6IGRhdGEuY291bnRcbiAgICAgIH0pKVxuICAgIH07XG5cbiAgICBjb25zdCByYXRpbmdUcmVuZDogRmVlZGJhY2tUcmVuZCA9IHtcbiAgICAgIG1ldHJpYzogJ2F2ZXJhZ2VfcmF0aW5nJyxcbiAgICAgIHBlcmlvZDogJ2RhaWx5JyxcbiAgICAgIGRhdGE6IEFycmF5LmZyb20oZGFpbHlEYXRhLmVudHJpZXMoKSkubWFwKChbZGF0ZSwgZGF0YV0pID0+ICh7XG4gICAgICAgIGRhdGU6IG5ldyBEYXRlKGRhdGUpLFxuICAgICAgICB2YWx1ZTogZGF0YS5jb3VudCA+IDAgPyBkYXRhLnRvdGFsUmF0aW5nIC8gZGF0YS5jb3VudCA6IDBcbiAgICAgIH0pKVxuICAgIH07XG5cbiAgICByZXR1cm4gW3ZvbHVtZVRyZW5kLCByYXRpbmdUcmVuZF07XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlSW5zaWdodHMoZmVlZGJhY2tMaXN0OiBGZWVkYmFja1tdKTogRmVlZGJhY2tJbnNpZ2h0W10ge1xuICAgIGNvbnN0IGluc2lnaHRzOiBGZWVkYmFja0luc2lnaHRbXSA9IFtdO1xuXG4gICAgLy8gTG93IHJhdGluZyBpbnNpZ2h0XG4gICAgY29uc3QgbG93UmF0aW5nRmVlZGJhY2sgPSBmZWVkYmFja0xpc3QuZmlsdGVyKGYgPT4gZi5yYXRpbmcgPD0gMik7XG4gICAgaWYgKGxvd1JhdGluZ0ZlZWRiYWNrLmxlbmd0aCA+IGZlZWRiYWNrTGlzdC5sZW5ndGggKiAwLjIpIHtcbiAgICAgIGluc2lnaHRzLnB1c2goe1xuICAgICAgICBpZDogYGluc2lnaHRfJHtEYXRlLm5vdygpfV9sb3dfcmF0aW5nYCxcbiAgICAgICAgdHlwZTogJ2lzc3VlJyxcbiAgICAgICAgdGl0bGU6ICdIaWdoIFZvbHVtZSBvZiBMb3cgUmF0aW5ncycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgJHtsb3dSYXRpbmdGZWVkYmFjay5sZW5ndGh9IG91dCBvZiAke2ZlZWRiYWNrTGlzdC5sZW5ndGh9IGZlZWRiYWNrIGVudHJpZXMgaGF2ZSByYXRpbmdzIG9mIDIgb3IgYmVsb3dgLFxuICAgICAgICBpbXBhY3Q6ICdoaWdoJyxcbiAgICAgICAgY29uZmlkZW5jZTogMC45LFxuICAgICAgICBzdXBwb3J0aW5nRGF0YTogbG93UmF0aW5nRmVlZGJhY2ssXG4gICAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDYXRlZ29yeS1zcGVjaWZpYyBpbnNpZ2h0c1xuICAgIGNvbnN0IGNhdGVnb3J5R3JvdXBzID0gZmVlZGJhY2tMaXN0LnJlZHVjZSgoZ3JvdXBzLCBmZWVkYmFjaykgPT4ge1xuICAgICAgaWYgKCFncm91cHNbZmVlZGJhY2suY2F0ZWdvcnldKSBncm91cHNbZmVlZGJhY2suY2F0ZWdvcnldID0gW107XG4gICAgICBncm91cHNbZmVlZGJhY2suY2F0ZWdvcnldLnB1c2goZmVlZGJhY2spO1xuICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICB9LCB7fSBhcyBSZWNvcmQ8RmVlZGJhY2tDYXRlZ29yeSwgRmVlZGJhY2tbXT4pO1xuXG4gICAgT2JqZWN0LmVudHJpZXMoY2F0ZWdvcnlHcm91cHMpLmZvckVhY2goKFtjYXRlZ29yeSwgY2F0ZWdvcnlGZWVkYmFja10pID0+IHtcbiAgICAgIGNvbnN0IGF2Z1JhdGluZyA9IGNhdGVnb3J5RmVlZGJhY2sucmVkdWNlKChzdW0sIGYpID0+IHN1bSArIGYucmF0aW5nLCAwKSAvIGNhdGVnb3J5RmVlZGJhY2subGVuZ3RoO1xuICAgICAgaWYgKGF2Z1JhdGluZyA8IDMgJiYgY2F0ZWdvcnlGZWVkYmFjay5sZW5ndGggPj0gMykge1xuICAgICAgICBpbnNpZ2h0cy5wdXNoKHtcbiAgICAgICAgICBpZDogYGluc2lnaHRfJHtEYXRlLm5vdygpfV8ke2NhdGVnb3J5fWAsXG4gICAgICAgICAgdHlwZTogJ2lzc3VlJyxcbiAgICAgICAgICB0aXRsZTogYCR7Y2F0ZWdvcnl9IENhdGVnb3J5IE5lZWRzIEF0dGVudGlvbmAsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGBBdmVyYWdlIHJhdGluZyBmb3IgJHtjYXRlZ29yeX0gaXMgJHthdmdSYXRpbmcudG9GaXhlZCgxKX0gYmFzZWQgb24gJHtjYXRlZ29yeUZlZWRiYWNrLmxlbmd0aH0gZmVlZGJhY2sgZW50cmllc2AsXG4gICAgICAgICAgaW1wYWN0OiAnbWVkaXVtJyxcbiAgICAgICAgICBjb25maWRlbmNlOiAwLjgsXG4gICAgICAgICAgc3VwcG9ydGluZ0RhdGE6IGNhdGVnb3J5RmVlZGJhY2ssXG4gICAgICAgICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKClcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gaW5zaWdodHM7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlUmVjb21tZW5kYXRpb25zKGZlZWRiYWNrTGlzdDogRmVlZGJhY2tbXSk6IEZlZWRiYWNrUmVjb21tZW5kYXRpb25bXSB7XG4gICAgY29uc3QgcmVjb21tZW5kYXRpb25zOiBGZWVkYmFja1JlY29tbWVuZGF0aW9uW10gPSBbXTtcblxuICAgIC8vIEFuYWx5emUgY29tbW9uIGlzc3Vlc1xuICAgIGNvbnN0IGJ1Z1JlcG9ydHMgPSBmZWVkYmFja0xpc3QuZmlsdGVyKGYgPT4gZi5mZWVkYmFja1R5cGUgPT09ICdidWctcmVwb3J0Jyk7XG4gICAgaWYgKGJ1Z1JlcG9ydHMubGVuZ3RoID4gMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICBpZDogYHJlY18ke0RhdGUubm93KCl9X2J1Z19maXhlc2AsXG4gICAgICAgIHRpdGxlOiAnQWRkcmVzcyBSZXBvcnRlZCBCdWdzJyxcbiAgICAgICAgZGVzY3JpcHRpb246IGAke2J1Z1JlcG9ydHMubGVuZ3RofSBidWcgcmVwb3J0cyBuZWVkIGF0dGVudGlvbmAsXG4gICAgICAgIHByaW9yaXR5OiAnaGlnaCcsXG4gICAgICAgIGVmZm9ydDogJ21lZGl1bScsXG4gICAgICAgIGltcGFjdDogJ2hpZ2gnLFxuICAgICAgICBjYXRlZ29yeTogJ2J1Zy1maXhlcycsXG4gICAgICAgIGFjdGlvbkl0ZW1zOiBbXG4gICAgICAgICAgJ1JldmlldyBhbmQgcHJpb3JpdGl6ZSBidWcgcmVwb3J0cycsXG4gICAgICAgICAgJ0Fzc2lnbiBidWdzIHRvIGRldmVsb3BtZW50IHRlYW0nLFxuICAgICAgICAgICdJbXBsZW1lbnQgZml4ZXMgYW5kIHRlc3QgdGhvcm91Z2hseScsXG4gICAgICAgICAgJ0ZvbGxvdyB1cCB3aXRoIHVzZXJzIHdobyByZXBvcnRlZCBidWdzJ1xuICAgICAgICBdLFxuICAgICAgICBlc3RpbWF0ZWRUaW1lZnJhbWU6ICcyLTQgd2Vla3MnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtYW5jZSBpc3N1ZXNcbiAgICBjb25zdCBwZXJmb3JtYW5jZUZlZWRiYWNrID0gZmVlZGJhY2tMaXN0LmZpbHRlcihmID0+IGYuY2F0ZWdvcnkgPT09ICdwZXJmb3JtYW5jZScgJiYgZi5yYXRpbmcgPD0gMyk7XG4gICAgaWYgKHBlcmZvcm1hbmNlRmVlZGJhY2subGVuZ3RoID4gMCkge1xuICAgICAgcmVjb21tZW5kYXRpb25zLnB1c2goe1xuICAgICAgICBpZDogYHJlY18ke0RhdGUubm93KCl9X3BlcmZvcm1hbmNlYCxcbiAgICAgICAgdGl0bGU6ICdJbXByb3ZlIFN5c3RlbSBQZXJmb3JtYW5jZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgJHtwZXJmb3JtYW5jZUZlZWRiYWNrLmxlbmd0aH0gdXNlcnMgcmVwb3J0ZWQgcGVyZm9ybWFuY2UgaXNzdWVzYCxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLFxuICAgICAgICBlZmZvcnQ6ICdoaWdoJyxcbiAgICAgICAgaW1wYWN0OiAnaGlnaCcsXG4gICAgICAgIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnLFxuICAgICAgICBhY3Rpb25JdGVtczogW1xuICAgICAgICAgICdBbmFseXplIHN5c3RlbSBwZXJmb3JtYW5jZSBtZXRyaWNzJyxcbiAgICAgICAgICAnSWRlbnRpZnkgYm90dGxlbmVja3MgYW5kIG9wdGltaXphdGlvbiBvcHBvcnR1bml0aWVzJyxcbiAgICAgICAgICAnSW1wbGVtZW50IHBlcmZvcm1hbmNlIGltcHJvdmVtZW50cycsXG4gICAgICAgICAgJ01vbml0b3IgcGVyZm9ybWFuY2UgYWZ0ZXIgY2hhbmdlcydcbiAgICAgICAgXSxcbiAgICAgICAgZXN0aW1hdGVkVGltZWZyYW1lOiAnNC04IHdlZWtzJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlY29tbWVuZGF0aW9ucztcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlQ29ycmVsYXRpb25zKGZlZWRiYWNrTGlzdDogRmVlZGJhY2tbXSk6IGFueVtdIHtcbiAgICAvLyBTaW1wbGUgY29ycmVsYXRpb24gYW5hbHlzaXMgYmV0d2VlbiByYXRpbmcgYW5kIG90aGVyIGZhY3RvcnNcbiAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiAtIGluIHByb2R1Y3Rpb24sIHlvdSdkIHVzZSBwcm9wZXIgc3RhdGlzdGljYWwgbWV0aG9kc1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcHJvY2Vzc0ZlZWRiYWNrQXN5bmMoZmVlZGJhY2s6IEZlZWRiYWNrKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gQXN5bmNocm9ub3VzIHByb2Nlc3Npbmcgb2YgZmVlZGJhY2tcbiAgICB0cnkge1xuICAgICAgLy8gQXV0by1jYXRlZ29yaXplIGhpZ2gtcHJpb3JpdHkgZmVlZGJhY2tcbiAgICAgIGlmIChmZWVkYmFjay5wcmlvcml0eSA9PT0gJ2hpZ2gnKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRmVlZGJhY2tTdGF0dXMoZmVlZGJhY2suaWQsICd1bmRlci1yZXZpZXcnKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2VuZCBub3RpZmljYXRpb25zIGZvciBjcml0aWNhbCBmZWVkYmFja1xuICAgICAgaWYgKGZlZWRiYWNrLnJhdGluZyA8PSAyICYmIGZlZWRiYWNrLmZlZWRiYWNrVHlwZSA9PT0gJ2J1Zy1yZXBvcnQnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBDcml0aWNhbCBmZWVkYmFjayByZWNlaXZlZDogJHtmZWVkYmFjay5pZH1gKTtcbiAgICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgdGhpcyB3b3VsZCBzZW5kIG5vdGlmaWNhdGlvbnMgdG8gcmVsZXZhbnQgdGVhbXNcbiAgICAgIH1cblxuICAgICAgLy8gVXBkYXRlIHJlbGF0ZWQgZmVlZGJhY2tcbiAgICAgIGlmIChmZWVkYmFjay5tZXRhZGF0YS5yZWxhdGVkRmVlZGJhY2sgJiYgZmVlZGJhY2subWV0YWRhdGEucmVsYXRlZEZlZWRiYWNrLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gTGluayByZWxhdGVkIGZlZWRiYWNrIGVudHJpZXNcbiAgICAgICAgY29uc29sZS5sb2coYExpbmtpbmcgcmVsYXRlZCBmZWVkYmFjayBmb3I6ICR7ZmVlZGJhY2suaWR9YCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgZmVlZGJhY2sgYXN5bmNocm9ub3VzbHk6JywgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vLyBFeHBvcnQgc2luZ2xldG9uIGluc3RhbmNlXG5leHBvcnQgY29uc3QgZmVlZGJhY2tTZXJ2aWNlID0gbmV3IEZlZWRiYWNrU2VydmljZSgpOyJdfQ==