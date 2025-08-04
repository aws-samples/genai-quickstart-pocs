// Feedback service for collecting, storing, and analyzing user feedback

import {
  Feedback,
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackSummary,
  FeedbackAnalytics,
  FeedbackFilter,
  FeedbackSearchOptions,
  FeedbackSearchResult,
  FeedbackTrend,
  FeedbackInsight,
  FeedbackRecommendation,
  validateFeedback,
  createFeedbackId,
  determineFeedbackSentiment,
  calculateFeedbackPriority
} from '../models/feedback';

export class FeedbackService {
  private feedbackStore: Map<string, Feedback> = new Map();
  private feedbackIndex: Map<string, Set<string>> = new Map(); // For efficient searching

  constructor() {
    this.initializeIndexes();
  }

  private initializeIndexes(): void {
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
  async submitFeedback(feedbackData: Partial<Feedback>): Promise<{ success: boolean; feedback?: Feedback; errors?: string[] }> {
    try {
      // Validate feedback data
      const validation = validateFeedback(feedbackData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // Create feedback object
      const feedback: Feedback = {
        id: createFeedbackId(),
        userId: feedbackData.userId!,
        investmentIdeaId: feedbackData.investmentIdeaId,
        analysisId: feedbackData.analysisId,
        requestId: feedbackData.requestId,
        feedbackType: feedbackData.feedbackType!,
        rating: feedbackData.rating!,
        category: feedbackData.category!,
        title: feedbackData.title!,
        description: feedbackData.description!,
        tags: feedbackData.tags || [],
        sentiment: determineFeedbackSentiment(feedbackData.rating!, feedbackData.description!),
        priority: 'medium', // Will be calculated below
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
      feedback.priority = calculateFeedbackPriority(feedback);

      // Store feedback
      this.feedbackStore.set(feedback.id, feedback);
      this.updateIndexes(feedback);

      // Process feedback asynchronously
      this.processFeedbackAsync(feedback);

      return { success: true, feedback };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, errors: ['Failed to submit feedback'] };
    }
  }

  /**
   * Get feedback by ID
   */
  async getFeedback(id: string): Promise<Feedback | null> {
    return this.feedbackStore.get(id) || null;
  }

  /**
   * Search feedback with filters and options
   */
  async searchFeedback(options: FeedbackSearchOptions = {}): Promise<FeedbackSearchResult> {
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
    } catch (error) {
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
  async updateFeedbackStatus(id: string, status: FeedbackStatus, resolvedBy?: string, resolution?: string): Promise<boolean> {
    try {
      const feedback = this.feedbackStore.get(id);
      if (!feedback) return false;

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
    } catch (error) {
      console.error('Error updating feedback status:', error);
      return false;
    }
  }

  /**
   * Get feedback summary for a time period
   */
  async getFeedbackSummary(startDate: Date, endDate: Date, filters?: FeedbackFilter): Promise<FeedbackSummary> {
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
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbackList.forEach(f => ratingDistribution[f.rating]++);

      // Category breakdown
      const categoryBreakdown: Record<FeedbackCategory, number> = {
        accuracy: 0, relevance: 0, completeness: 0, timeliness: 0,
        usability: 0, performance: 0, compliance: 0, other: 0
      };
      feedbackList.forEach(f => categoryBreakdown[f.category]++);

      // Type breakdown
      const typeBreakdown: Record<FeedbackType, number> = {
        'investment-idea-quality': 0, 'analysis-accuracy': 0, 'system-performance': 0,
        'user-experience': 0, 'feature-request': 0, 'bug-report': 0, 'general': 0
      };
      feedbackList.forEach(f => typeBreakdown[f.feedbackType]++);

      // Sentiment breakdown
      const sentimentBreakdown: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
      feedbackList.forEach(f => sentimentBreakdown[f.sentiment]++);

      // Status breakdown
      const statusBreakdown: Record<FeedbackStatus, number> = {
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
    } catch (error) {
      console.error('Error generating feedback summary:', error);
      throw error;
    }
  }

  /**
   * Generate feedback analytics and insights
   */
  async generateFeedbackAnalytics(timeRange: { start: Date; end: Date }): Promise<FeedbackAnalytics> {
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
    } catch (error) {
      console.error('Error generating feedback analytics:', error);
      throw error;
    }
  }

  /**
   * Get feedback for a specific investment idea
   */
  async getFeedbackForInvestmentIdea(investmentIdeaId: string): Promise<Feedback[]> {
    return Array.from(this.feedbackStore.values())
      .filter(f => f.investmentIdeaId === investmentIdeaId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get feedback for a specific user
   */
  async getFeedbackForUser(userId: string): Promise<Feedback[]> {
    return Array.from(this.feedbackStore.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Private helper methods

  private updateIndexes(feedback: Feedback): void {
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

  private applyFilters(feedbackList: Feedback[], filters: FeedbackFilter): Feedback[] {
    return feedbackList.filter(feedback => {
      if (filters.userId && feedback.userId !== filters.userId) return false;
      if (filters.investmentIdeaId && feedback.investmentIdeaId !== filters.investmentIdeaId) return false;
      if (filters.analysisId && feedback.analysisId !== filters.analysisId) return false;
      if (filters.feedbackType && !filters.feedbackType.includes(feedback.feedbackType)) return false;
      if (filters.category && !filters.category.includes(feedback.category)) return false;
      if (filters.sentiment && !filters.sentiment.includes(feedback.sentiment)) return false;
      if (filters.status && !filters.status.includes(feedback.status)) return false;
      if (filters.priority && !filters.priority.includes(feedback.priority)) return false;
      
      if (filters.rating) {
        if (filters.rating.min && feedback.rating < filters.rating.min) return false;
        if (filters.rating.max && feedback.rating > filters.rating.max) return false;
      }
      
      if (filters.dateRange) {
        if (feedback.createdAt < filters.dateRange.start || feedback.createdAt > filters.dateRange.end) return false;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => feedback.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  }

  private applyTextSearch(feedbackList: Feedback[], query: string): Feedback[] {
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

  private sortFeedback(feedbackList: Feedback[], sortBy?: string, sortOrder?: string): Feedback[] {
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

  private calculateAggregations(feedbackList: Feedback[]) {
    const totalCount = feedbackList.length;
    if (totalCount === 0) return undefined;

    const averageRating = feedbackList.reduce((sum, f) => sum + f.rating, 0) / totalCount;
    
    const categoryBreakdown: Record<FeedbackCategory, number> = {
      accuracy: 0, relevance: 0, completeness: 0, timeliness: 0,
      usability: 0, performance: 0, compliance: 0, other: 0
    };
    feedbackList.forEach(f => categoryBreakdown[f.category]++);
    
    const sentimentBreakdown: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
    feedbackList.forEach(f => sentimentBreakdown[f.sentiment]++);

    return {
      averageRating,
      categoryBreakdown,
      sentimentBreakdown
    };
  }

  private calculateTrends(feedbackList: Feedback[], timeRange: { start: Date; end: Date }): FeedbackTrend[] {
    // Calculate daily trends for rating and volume
    const dailyData = new Map<string, { count: number; totalRating: number }>();
    
    feedbackList.forEach(feedback => {
      const dateKey = feedback.createdAt.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { count: 0, totalRating: 0 };
      dailyData.set(dateKey, {
        count: existing.count + 1,
        totalRating: existing.totalRating + feedback.rating
      });
    });

    const volumeTrend: FeedbackTrend = {
      metric: 'volume',
      period: 'daily',
      data: Array.from(dailyData.entries()).map(([date, data]) => ({
        date: new Date(date),
        value: data.count
      }))
    };

    const ratingTrend: FeedbackTrend = {
      metric: 'average_rating',
      period: 'daily',
      data: Array.from(dailyData.entries()).map(([date, data]) => ({
        date: new Date(date),
        value: data.count > 0 ? data.totalRating / data.count : 0
      }))
    };

    return [volumeTrend, ratingTrend];
  }

  private generateInsights(feedbackList: Feedback[]): FeedbackInsight[] {
    const insights: FeedbackInsight[] = [];

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
      if (!groups[feedback.category]) groups[feedback.category] = [];
      groups[feedback.category].push(feedback);
      return groups;
    }, {} as Record<FeedbackCategory, Feedback[]>);

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

  private generateRecommendations(feedbackList: Feedback[]): FeedbackRecommendation[] {
    const recommendations: FeedbackRecommendation[] = [];

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

  private calculateCorrelations(feedbackList: Feedback[]): any[] {
    // Simple correlation analysis between rating and other factors
    // This is a simplified implementation - in production, you'd use proper statistical methods
    return [];
  }

  private async processFeedbackAsync(feedback: Feedback): Promise<void> {
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
    } catch (error) {
      console.error('Error processing feedback asynchronously:', error);
    }
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();