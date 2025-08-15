export interface Feedback {
    id: string;
    userId: string;
    investmentIdeaId?: string;
    analysisId?: string;
    requestId?: string;
    feedbackType: FeedbackType;
    rating: number;
    category: FeedbackCategory;
    title: string;
    description: string;
    tags: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    priority: 'low' | 'medium' | 'high';
    status: FeedbackStatus;
    metadata: FeedbackMetadata;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolution?: string;
}
export type FeedbackType = 'investment-idea-quality' | 'analysis-accuracy' | 'system-performance' | 'user-experience' | 'feature-request' | 'bug-report' | 'general';
export type FeedbackCategory = 'accuracy' | 'relevance' | 'completeness' | 'timeliness' | 'usability' | 'performance' | 'compliance' | 'other';
export type FeedbackStatus = 'submitted' | 'under-review' | 'in-progress' | 'resolved' | 'dismissed' | 'archived';
export interface FeedbackMetadata {
    source: 'web' | 'api' | 'mobile' | 'system';
    userAgent?: string;
    sessionId?: string;
    contextData?: Record<string, any>;
    attachments?: FeedbackAttachment[];
    relatedFeedback?: string[];
}
export interface FeedbackAttachment {
    id: string;
    filename: string;
    contentType: string;
    size: number;
    url: string;
    uploadedAt: Date;
}
export interface FeedbackSummary {
    totalCount: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    categoryBreakdown: Record<FeedbackCategory, number>;
    typeBreakdown: Record<FeedbackType, number>;
    sentimentBreakdown: Record<string, number>;
    statusBreakdown: Record<FeedbackStatus, number>;
    timeRange: {
        start: Date;
        end: Date;
    };
}
export interface FeedbackAnalytics {
    trends: FeedbackTrend[];
    insights: FeedbackInsight[];
    recommendations: FeedbackRecommendation[];
    correlations: FeedbackCorrelation[];
}
export interface FeedbackTrend {
    metric: string;
    period: 'daily' | 'weekly' | 'monthly';
    data: Array<{
        date: Date;
        value: number;
        change?: number;
    }>;
}
export interface FeedbackInsight {
    id: string;
    type: 'improvement' | 'issue' | 'opportunity';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    confidence: number;
    supportingData: any[];
    generatedAt: Date;
}
export interface FeedbackRecommendation {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    category: string;
    actionItems: string[];
    estimatedTimeframe: string;
}
export interface FeedbackCorrelation {
    metric1: string;
    metric2: string;
    correlation: number;
    significance: number;
    description: string;
}
export interface FeedbackFilter {
    userId?: string;
    investmentIdeaId?: string;
    analysisId?: string;
    feedbackType?: FeedbackType[];
    category?: FeedbackCategory[];
    rating?: {
        min?: number;
        max?: number;
    };
    sentiment?: ('positive' | 'neutral' | 'negative')[];
    status?: FeedbackStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    tags?: string[];
    priority?: ('low' | 'medium' | 'high')[];
}
export interface FeedbackSearchOptions {
    query?: string;
    filters?: FeedbackFilter;
    sortBy?: 'createdAt' | 'updatedAt' | 'rating' | 'priority';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}
export interface FeedbackSearchResult {
    feedback: Feedback[];
    totalCount: number;
    hasMore: boolean;
    aggregations?: {
        averageRating: number;
        categoryBreakdown: Record<FeedbackCategory, number>;
        sentimentBreakdown: Record<string, number>;
    };
}
export declare const validateFeedback: (feedback: any) => {
    valid: boolean;
    errors: string[];
};
export declare const createFeedbackId: () => string;
export declare const determineFeedbackSentiment: (rating: number, description: string) => 'positive' | 'neutral' | 'negative';
export declare const calculateFeedbackPriority: (feedback: Feedback) => 'low' | 'medium' | 'high';
