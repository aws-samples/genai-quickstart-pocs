// Unit tests for FeedbackService

import { FeedbackService } from '../feedback-service';
import {
  Feedback,
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
  validateFeedback,
  createFeedbackId,
  determineFeedbackSentiment,
  calculateFeedbackPriority
} from '../../models/feedback';

describe('FeedbackService', () => {
  let feedbackService: FeedbackService;

  beforeEach(() => {
    feedbackService = new FeedbackService();
  });

  describe('submitFeedback', () => {
    it('should successfully submit valid feedback', async () => {
      const feedbackData = {
        userId: 'user123',
        feedbackType: 'investment-idea-quality' as FeedbackType,
        category: 'accuracy' as FeedbackCategory,
        title: 'Great investment idea',
        description: 'The AI provided excellent analysis with detailed reasoning.',
        rating: 5,
        tags: ['helpful', 'accurate']
      };

      const result = await feedbackService.submitFeedback(feedbackData);

      expect(result.success).toBe(true);
      expect(result.feedback).toBeDefined();
      expect(result.feedback!.id).toBeDefined();
      expect(result.feedback!.userId).toBe('user123');
      expect(result.feedback!.sentiment).toBe('positive');
      expect(result.feedback!.status).toBe('submitted');
    });

    it('should reject feedback with missing required fields', async () => {
      const feedbackData = {
        userId: 'user123',
        // Missing required fields
      };

      const result = await feedbackService.submitFeedback(feedbackData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should reject feedback with invalid rating', async () => {
      const feedbackData = {
        userId: 'user123',
        feedbackType: 'investment-idea-quality' as FeedbackType,
        category: 'accuracy' as FeedbackCategory,
        title: 'Test feedback',
        description: 'Test description',
        rating: 6 // Invalid rating
      };

      const result = await feedbackService.submitFeedback(feedbackData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Rating must be an integer between 1 and 5');
    });

    it('should automatically calculate sentiment and priority', async () => {
      const feedbackData = {
        userId: 'user123',
        feedbackType: 'bug-report' as FeedbackType,
        category: 'performance' as FeedbackCategory,
        title: 'System is very slow',
        description: 'The system is performing poorly and causing delays.',
        rating: 2
      };

      const result = await feedbackService.submitFeedback(feedbackData);

      expect(result.success).toBe(true);
      expect(result.feedback!.sentiment).toBe('negative');
      expect(result.feedback!.priority).toBe('high');
    });
  });

  describe('searchFeedback', () => {
    beforeEach(async () => {
      // Add some test feedback
      await feedbackService.submitFeedback({
        userId: 'user1',
        feedbackType: 'investment-idea-quality' as FeedbackType,
        category: 'accuracy' as FeedbackCategory,
        title: 'Good analysis',
        description: 'The investment analysis was accurate and helpful.',
        rating: 4,
        tags: ['accurate', 'helpful']
      });

      await feedbackService.submitFeedback({
        userId: 'user2',
        feedbackType: 'system-performance' as FeedbackType,
        category: 'performance' as FeedbackCategory,
        title: 'Slow response',
        description: 'The system took too long to respond.',
        rating: 2,
        tags: ['slow', 'performance']
      });
    });

    it('should return all feedback when no filters applied', async () => {
      const result = await feedbackService.searchFeedback();

      expect(result.feedback.length).toBe(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should filter feedback by user ID', async () => {
      const result = await feedbackService.searchFeedback({
        filters: { userId: 'user1' }
      });

      expect(result.feedback.length).toBe(1);
      expect(result.feedback[0].userId).toBe('user1');
    });

    it('should filter feedback by feedback type', async () => {
      const result = await feedbackService.searchFeedback({
        filters: { feedbackType: ['system-performance'] }
      });

      expect(result.feedback.length).toBe(1);
      expect(result.feedback[0].feedbackType).toBe('system-performance');
    });

    it('should filter feedback by rating range', async () => {
      const result = await feedbackService.searchFeedback({
        filters: { rating: { min: 4, max: 5 } }
      });

      expect(result.feedback.length).toBe(1);
      expect(result.feedback[0].rating).toBe(4);
    });

    it('should search feedback by text query', async () => {
      const result = await feedbackService.searchFeedback({
        query: 'analysis'
      });

      expect(result.feedback.length).toBe(1);
      expect(result.feedback[0].title).toContain('analysis');
    });

    it('should sort feedback by rating', async () => {
      const result = await feedbackService.searchFeedback({
        sortBy: 'rating',
        sortOrder: 'desc'
      });

      expect(result.feedback[0].rating).toBe(4);
      expect(result.feedback[1].rating).toBe(2);
    });

    it('should paginate results', async () => {
      const result = await feedbackService.searchFeedback({
        limit: 1,
        offset: 0
      });

      expect(result.feedback.length).toBe(1);
      expect(result.hasMore).toBe(true);
    });

    it('should calculate aggregations', async () => {
      const result = await feedbackService.searchFeedback();

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations!.averageRating).toBe(3); // (4 + 2) / 2
      expect(result.aggregations!.categoryBreakdown.accuracy).toBe(1);
      expect(result.aggregations!.categoryBreakdown.performance).toBe(1);
    });
  });

  describe('updateFeedbackStatus', () => {
    let feedbackId: string;

    beforeEach(async () => {
      const result = await feedbackService.submitFeedback({
        userId: 'user123',
        feedbackType: 'investment-idea-quality' as FeedbackType,
        category: 'accuracy' as FeedbackCategory,
        title: 'Test feedback',
        description: 'Test description',
        rating: 4
      });
      feedbackId = result.feedback!.id;
    });

    it('should successfully update feedback status', async () => {
      const success = await feedbackService.updateFeedbackStatus(
        feedbackId,
        'resolved',
        'admin123',
        'Issue has been addressed'
      );

      expect(success).toBe(true);

      const feedback = await feedbackService.getFeedback(feedbackId);
      expect(feedback!.status).toBe('resolved');
      expect(feedback!.resolvedBy).toBe('admin123');
      expect(feedback!.resolution).toBe('Issue has been addressed');
      expect(feedback!.resolvedAt).toBeDefined();
    });

    it('should return false for non-existent feedback', async () => {
      const success = await feedbackService.updateFeedbackStatus(
        'non-existent-id',
        'resolved'
      );

      expect(success).toBe(false);
    });
  });

  describe('getFeedbackSummary', () => {
    beforeEach(async () => {
      // Add test feedback with different characteristics
      const feedbackData = [
        {
          userId: 'user1',
          feedbackType: 'investment-idea-quality' as FeedbackType,
          category: 'accuracy' as FeedbackCategory,
          title: 'Excellent analysis',
          description: 'Very good investment recommendations.',
          rating: 5
        },
        {
          userId: 'user2',
          feedbackType: 'system-performance' as FeedbackType,
          category: 'performance' as FeedbackCategory,
          title: 'Slow system',
          description: 'System is too slow.',
          rating: 2
        },
        {
          userId: 'user3',
          feedbackType: 'user-experience' as FeedbackType,
          category: 'usability' as FeedbackCategory,
          title: 'Good interface',
          description: 'Interface is user-friendly.',
          rating: 4
        }
      ];

      for (const data of feedbackData) {
        await feedbackService.submitFeedback(data);
      }
    });

    it('should generate comprehensive feedback summary', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const endDate = new Date();

      const summary = await feedbackService.getFeedbackSummary(startDate, endDate);

      expect(summary.totalCount).toBe(3);
      expect(summary.averageRating).toBeCloseTo(3.67, 1); // (5 + 2 + 4) / 3
      
      expect(summary.ratingDistribution[5]).toBe(1);
      expect(summary.ratingDistribution[4]).toBe(1);
      expect(summary.ratingDistribution[2]).toBe(1);
      
      expect(summary.categoryBreakdown.accuracy).toBe(1);
      expect(summary.categoryBreakdown.performance).toBe(1);
      expect(summary.categoryBreakdown.usability).toBe(1);
      
      expect(summary.typeBreakdown['investment-idea-quality']).toBe(1);
      expect(summary.typeBreakdown['system-performance']).toBe(1);
      expect(summary.typeBreakdown['user-experience']).toBe(1);
      
      expect(summary.sentimentBreakdown.positive).toBe(2);
      expect(summary.sentimentBreakdown.negative).toBe(1);
    });

    it('should filter summary by date range', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const summary = await feedbackService.getFeedbackSummary(futureDate, futureDate);

      expect(summary.totalCount).toBe(0);
    });
  });

  describe('generateFeedbackAnalytics', () => {
    beforeEach(async () => {
      // Add feedback with different ratings and types
      const feedbackData = [
        { rating: 1, feedbackType: 'bug-report' as FeedbackType, category: 'performance' as FeedbackCategory },
        { rating: 2, feedbackType: 'bug-report' as FeedbackType, category: 'performance' as FeedbackCategory },
        { rating: 5, feedbackType: 'investment-idea-quality' as FeedbackType, category: 'accuracy' as FeedbackCategory },
        { rating: 4, feedbackType: 'user-experience' as FeedbackType, category: 'usability' as FeedbackCategory }
      ];

      for (const data of feedbackData) {
        await feedbackService.submitFeedback({
          userId: 'user123',
          title: 'Test feedback',
          description: 'Test description',
          ...data
        });
      }
    });

    it('should generate analytics with trends and insights', async () => {
      const timeRange = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date()
      };

      const analytics = await feedbackService.generateFeedbackAnalytics(timeRange);

      expect(analytics.trends).toBeDefined();
      expect(analytics.insights).toBeDefined();
      expect(analytics.recommendations).toBeDefined();
      expect(analytics.correlations).toBeDefined();

      // Check for low rating insight
      const lowRatingInsight = analytics.insights.find(
        insight => insight.type === 'issue' && insight.title.includes('Low Ratings')
      );
      expect(lowRatingInsight).toBeDefined();

      // Check for bug report recommendation
      const bugRecommendation = analytics.recommendations.find(
        rec => rec.category === 'bug-fixes'
      );
      expect(bugRecommendation).toBeDefined();
    });
  });
});

describe('Feedback Model Functions', () => {
  describe('validateFeedback', () => {
    it('should validate correct feedback data', () => {
      const feedback = {
        userId: 'user123',
        feedbackType: 'investment-idea-quality',
        category: 'accuracy',
        title: 'Good analysis',
        description: 'The analysis was very helpful.',
        rating: 4,
        tags: ['helpful', 'accurate']
      };

      const result = validateFeedback(feedback);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject feedback with missing required fields', () => {
      const feedback = {
        userId: 'user123'
        // Missing other required fields
      };

      const result = validateFeedback(feedback);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feedback with invalid rating', () => {
      const feedback = {
        userId: 'user123',
        feedbackType: 'investment-idea-quality',
        category: 'accuracy',
        title: 'Test',
        description: 'Test description',
        rating: 6 // Invalid
      };

      const result = validateFeedback(feedback);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rating must be an integer between 1 and 5');
    });

    it('should reject feedback with invalid feedback type', () => {
      const feedback = {
        userId: 'user123',
        feedbackType: 'invalid-type',
        category: 'accuracy',
        title: 'Test',
        description: 'Test description',
        rating: 4
      };

      const result = validateFeedback(feedback);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid feedback type');
    });

    it('should reject feedback with too long title or description', () => {
      const feedback = {
        userId: 'user123',
        feedbackType: 'investment-idea-quality',
        category: 'accuracy',
        title: 'a'.repeat(201), // Too long
        description: 'b'.repeat(2001), // Too long
        rating: 4
      };

      const result = validateFeedback(feedback);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be 200 characters or less');
      expect(result.errors).toContain('Description must be 2000 characters or less');
    });
  });

  describe('createFeedbackId', () => {
    it('should create unique feedback IDs', () => {
      const id1 = createFeedbackId();
      const id2 = createFeedbackId();

      expect(id1).toMatch(/^feedback_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^feedback_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('determineFeedbackSentiment', () => {
    it('should determine positive sentiment for high ratings', () => {
      const sentiment = determineFeedbackSentiment(5, 'Great service!');
      expect(sentiment).toBe('positive');
    });

    it('should determine negative sentiment for low ratings', () => {
      const sentiment = determineFeedbackSentiment(1, 'Terrible experience');
      expect(sentiment).toBe('negative');
    });

    it('should analyze description for neutral ratings', () => {
      const positiveSentiment = determineFeedbackSentiment(3, 'Good analysis and helpful insights');
      expect(positiveSentiment).toBe('positive');

      const negativeSentiment = determineFeedbackSentiment(3, 'Poor performance and confusing interface');
      expect(negativeSentiment).toBe('negative');

      const neutralSentiment = determineFeedbackSentiment(3, 'Average experience overall');
      expect(neutralSentiment).toBe('neutral');
    });
  });

  describe('calculateFeedbackPriority', () => {
    it('should assign high priority to critical feedback', () => {
      const feedback: Feedback = {
        id: 'test',
        userId: 'user123',
        feedbackType: 'bug-report',
        rating: 1,
        category: 'compliance',
        title: 'Critical bug',
        description: 'System is broken',
        tags: [],
        sentiment: 'negative',
        priority: 'medium', // Will be recalculated
        status: 'submitted',
        metadata: { source: 'web' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const priority = calculateFeedbackPriority(feedback);
      expect(priority).toBe('high');
    });

    it('should assign low priority to positive feedback', () => {
      const feedback: Feedback = {
        id: 'test',
        userId: 'user123',
        feedbackType: 'general',
        rating: 5,
        category: 'other',
        title: 'Great job',
        description: 'Everything works well',
        tags: [],
        sentiment: 'positive',
        priority: 'medium', // Will be recalculated
        status: 'submitted',
        metadata: { source: 'web' },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const priority = calculateFeedbackPriority(feedback);
      expect(priority).toBe('low');
    });
  });
});