import { Feedback, FeedbackStatus, FeedbackSummary, FeedbackAnalytics, FeedbackFilter, FeedbackSearchOptions, FeedbackSearchResult } from '../models/feedback';
export declare class FeedbackService {
    private feedbackStore;
    private feedbackIndex;
    constructor();
    private initializeIndexes;
    /**
     * Submit new feedback
     */
    submitFeedback(feedbackData: Partial<Feedback>): Promise<{
        success: boolean;
        feedback?: Feedback;
        errors?: string[];
    }>;
    /**
     * Get feedback by ID
     */
    getFeedback(id: string): Promise<Feedback | null>;
    /**
     * Search feedback with filters and options
     */
    searchFeedback(options?: FeedbackSearchOptions): Promise<FeedbackSearchResult>;
    /**
     * Update feedback status
     */
    updateFeedbackStatus(id: string, status: FeedbackStatus, resolvedBy?: string, resolution?: string): Promise<boolean>;
    /**
     * Get feedback summary for a time period
     */
    getFeedbackSummary(startDate: Date, endDate: Date, filters?: FeedbackFilter): Promise<FeedbackSummary>;
    /**
     * Generate feedback analytics and insights
     */
    generateFeedbackAnalytics(timeRange: {
        start: Date;
        end: Date;
    }): Promise<FeedbackAnalytics>;
    /**
     * Get feedback for a specific investment idea
     */
    getFeedbackForInvestmentIdea(investmentIdeaId: string): Promise<Feedback[]>;
    /**
     * Get feedback for a specific user
     */
    getFeedbackForUser(userId: string): Promise<Feedback[]>;
    private updateIndexes;
    private applyFilters;
    private applyTextSearch;
    private sortFeedback;
    private calculateAggregations;
    private calculateTrends;
    private generateInsights;
    private generateRecommendations;
    private calculateCorrelations;
    private processFeedbackAsync;
}
export declare const feedbackService: FeedbackService;
