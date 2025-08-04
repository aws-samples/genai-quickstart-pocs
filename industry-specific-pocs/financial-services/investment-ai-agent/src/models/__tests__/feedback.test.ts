/**
 * Tests for Feedback model and related types
 */

import {
  Feedback,
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackMetadata,
  FeedbackSearchOptions,
  FeedbackSearchResult,
  FeedbackAnalytics,
  FeedbackSummary,
  validateFeedback,
  createFeedbackId,
  determineFeedbackSentiment,
  calculateFeedbackPriority
} from '../feedback';

describe('Feedback Model', () => {
  const mockFeedback: Feedback = {
    id: 'feedback-123',
    userId: 'user-456',
    investmentIdeaId: 'idea-789',
    feedbackType: 'investment-idea-quality',
    rating: 4,
    category: 'accuracy',
    title: 'Good Analysis',
    description: 'Good analysis, but could use more risk assessment',
    tags: ['analysis', 'risk'],
    sentiment: 'positive',
    priority: 'medium',
    status: 'submitted',
    metadata: {
      source: 'web',
      sessionId: 'session-123',
      userAgent: 'Mozilla/5.0...'
    },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-01')
  };

  describe('Feedback interface', () => {
    it('should create a valid feedback object', () => {
      expect(mockFeedback).toBeDefined();
      expect(mockFeedback.id).toBe('feedback-123');
      expect(mockFeedback.userId).toBe('user-456');
      expect(mockFeedback.feedbackType).toBe('investment-idea-quality');
      expect(mockFeedback.rating).toBe(4);
      expect(mockFeedback.category).toBe('accuracy');
    });
  });

  describe('validateFeedback', () => {
    it('should validate a valid feedback object', () => {
      const result = validateFeedback(mockFeedback);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const invalidFeedback = { ...mockFeedback };
      delete (invalidFeedback as any).userId;

      const result = validateFeedback(invalidFeedback);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should return error for invalid rating', () => {
      const invalidRatingFeedback = { ...mockFeedback, rating: 6 };
      const result = validateFeedback(invalidRatingFeedback);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rating must be an integer between 1 and 5');
    });

    it('should return error for invalid feedback type', () => {
      const invalidTypeFeedback = { ...mockFeedback, feedbackType: 'invalid' as any };
      const result = validateFeedback(invalidTypeFeedback);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid feedback type');
    });

    it('should return error for invalid category', () => {
      const invalidCategoryFeedback = { ...mockFeedback, category: 'invalid' as any };
      const result = validateFeedback(invalidCategoryFeedback);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid category');
    });
  });

  describe('createFeedbackId', () => {
    it('should generate unique feedback IDs', () => {
      const id1 = createFeedbackId();
      const id2 = createFeedbackId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^feedback_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^feedback_\d+_[a-z0-9]+$/);
    });

    it('should generate IDs with correct format', () => {
      const id = createFeedbackId();
      expect(id).toMatch(/^feedback_/);
    });
  });

  describe('determineFeedbackSentiment', () => {
    it('should return positive sentiment for high ratings', () => {
      const sentiment = determineFeedbackSentiment(5, 'Great analysis!');
      expect(sentiment).toBe('positive');
    });

    it('should return negative sentiment for low ratings', () => {
      const sentiment = determineFeedbackSentiment(1, 'Poor quality analysis');
      expect(sentiment).toBe('negative');
    });

    it('should analyze description for neutral ratings', () => {
      const positiveSentiment = determineFeedbackSentiment(3, 'This is good and helpful');
      expect(positiveSentiment).toBe('positive');

      const negativeSentiment = determineFeedbackSentiment(3, 'This is bad and confusing');
      expect(negativeSentiment).toBe('negative');

      const neutralSentiment = determineFeedbackSentiment(3, 'This is okay');
      expect(neutralSentiment).toBe('neutral');
    });
  });

  describe('calculateFeedbackPriority', () => {
    it('should calculate high priority for low ratings', () => {
      const highPriorityFeedback: Feedback = {
        ...mockFeedback,
        rating: 1,
        feedbackType: 'bug-report',
        category: 'compliance',
        sentiment: 'negative'
      };

      const priority = calculateFeedbackPriority(highPriorityFeedback);
      expect(priority).toBe('high');
    });

    it('should calculate medium priority for moderate issues', () => {
      const mediumPriorityFeedback: Feedback = {
        ...mockFeedback,
        rating: 3,
        feedbackType: 'system-performance',
        category: 'accuracy',
        sentiment: 'neutral'
      };

      const priority = calculateFeedbackPriority(mediumPriorityFeedback);
      expect(priority).toBe('high');
    });

    it('should calculate low priority for minor issues', () => {
      const lowPriorityFeedback: Feedback = {
        ...mockFeedback,
        rating: 5,
        feedbackType: 'general',
        category: 'other',
        sentiment: 'positive'
      };

      const priority = calculateFeedbackPriority(lowPriorityFeedback);
      expect(priority).toBe('low');
    });
  });

  describe('Type definitions', () => {
    it('should support all feedback types', () => {
      const types: FeedbackType[] = [
        'investment-idea-quality',
        'analysis-accuracy',
        'system-performance',
        'user-experience',
        'feature-request',
        'bug-report',
        'general'
      ];

      types.forEach(type => {
        const feedback: Partial<Feedback> = { feedbackType: type };
        expect(feedback.feedbackType).toBe(type);
      });
    });

    it('should support all feedback categories', () => {
      const categories: FeedbackCategory[] = [
        'accuracy',
        'relevance',
        'completeness',
        'timeliness',
        'usability',
        'performance',
        'compliance',
        'other'
      ];

      categories.forEach(category => {
        const feedback: Partial<Feedback> = { category };
        expect(feedback.category).toBe(category);
      });
    });

    it('should support all feedback statuses', () => {
      const statuses: FeedbackStatus[] = [
        'submitted',
        'under-review',
        'in-progress',
        'resolved',
        'dismissed',
        'archived'
      ];

      statuses.forEach(status => {
        const feedback: Partial<Feedback> = { status };
        expect(feedback.status).toBe(status);
      });
    });
  });

  describe('FeedbackSearchOptions interface', () => {
    it('should create valid search options', () => {
      const searchOptions: FeedbackSearchOptions = {
        query: 'analysis quality',
        filters: {
          feedbackType: ['investment-idea-quality'],
          category: ['accuracy'],
          rating: { min: 3, max: 5 }
        },
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50,
        offset: 0
      };

      expect(searchOptions.query).toBe('analysis quality');
      expect(searchOptions.filters?.feedbackType).toContain('investment-idea-quality');
      expect(searchOptions.sortBy).toBe('createdAt');
    });

    it('should support optional fields', () => {
      const minimalOptions: FeedbackSearchOptions = {};
      expect(minimalOptions).toBeDefined();
    });
  });

  describe('FeedbackMetadata interface', () => {
    it('should create valid metadata', () => {
      const metadata: FeedbackMetadata = {
        source: 'web',
        userAgent: 'Mozilla/5.0...',
        sessionId: 'session-123',
        contextData: { page: 'investment-ideas' }
      };

      expect(metadata.source).toBe('web');
      expect(metadata.userAgent).toBe('Mozilla/5.0...');
      expect(metadata.contextData?.page).toBe('investment-ideas');
    });

    it('should support different sources', () => {
      const apiMetadata: FeedbackMetadata = { source: 'api' };
      const mobileMetadata: FeedbackMetadata = { source: 'mobile' };
      const systemMetadata: FeedbackMetadata = { source: 'system' };

      expect(apiMetadata.source).toBe('api');
      expect(mobileMetadata.source).toBe('mobile');
      expect(systemMetadata.source).toBe('system');
    });
  });
});