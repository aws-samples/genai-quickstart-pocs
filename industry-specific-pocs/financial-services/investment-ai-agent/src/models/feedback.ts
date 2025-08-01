// Feedback models and interfaces

export interface Feedback {
  id: string;
  userId: string;
  investmentIdeaId?: string;
  analysisId?: string;
  requestId?: string;
  feedbackType: FeedbackType;
  rating: number; // 1-5 scale
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

export type FeedbackType = 
  | 'investment-idea-quality'
  | 'analysis-accuracy'
  | 'system-performance'
  | 'user-experience'
  | 'feature-request'
  | 'bug-report'
  | 'general';

export type FeedbackCategory = 
  | 'accuracy'
  | 'relevance'
  | 'completeness'
  | 'timeliness'
  | 'usability'
  | 'performance'
  | 'compliance'
  | 'other';

export type FeedbackStatus = 
  | 'submitted'
  | 'under-review'
  | 'in-progress'
  | 'resolved'
  | 'dismissed'
  | 'archived';

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

// Validation functions
export const validateFeedback = (feedback: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!feedback.userId) errors.push('User ID is required');
  if (!feedback.feedbackType) errors.push('Feedback type is required');
  if (!feedback.category) errors.push('Category is required');
  if (!feedback.title) errors.push('Title is required');
  if (!feedback.description) errors.push('Description is required');

  // Rating validation
  if (feedback.rating === undefined || feedback.rating === null) {
    errors.push('Rating is required');
  } else if (!Number.isInteger(feedback.rating) || feedback.rating < 1 || feedback.rating > 5) {
    errors.push('Rating must be an integer between 1 and 5');
  }

  // Type validations
  const validFeedbackTypes: FeedbackType[] = [
    'investment-idea-quality',
    'analysis-accuracy',
    'system-performance',
    'user-experience',
    'feature-request',
    'bug-report',
    'general'
  ];

  if (feedback.feedbackType && !validFeedbackTypes.includes(feedback.feedbackType)) {
    errors.push('Invalid feedback type');
  }

  const validCategories: FeedbackCategory[] = [
    'accuracy',
    'relevance',
    'completeness',
    'timeliness',
    'usability',
    'performance',
    'compliance',
    'other'
  ];

  if (feedback.category && !validCategories.includes(feedback.category)) {
    errors.push('Invalid category');
  }

  // String length validations
  if (feedback.title && feedback.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (feedback.description && feedback.description.length > 2000) {
    errors.push('Description must be 2000 characters or less');
  }

  // Array validations
  if (feedback.tags && !Array.isArray(feedback.tags)) {
    errors.push('Tags must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const createFeedbackId = (): string => {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const determineFeedbackSentiment = (rating: number, description: string): 'positive' | 'neutral' | 'negative' => {
  // Simple sentiment analysis based on rating and keywords
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  
  // For neutral ratings (3), analyze description for sentiment keywords
  const positiveKeywords = ['good', 'great', 'excellent', 'helpful', 'useful', 'accurate', 'fast'];
  const negativeKeywords = ['bad', 'poor', 'terrible', 'slow', 'inaccurate', 'confusing', 'broken'];
  
  const lowerDescription = description.toLowerCase();
  const positiveCount = positiveKeywords.filter(word => lowerDescription.includes(word)).length;
  const negativeCount = negativeKeywords.filter(word => lowerDescription.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  
  return 'neutral';
};

export const calculateFeedbackPriority = (feedback: Feedback): 'low' | 'medium' | 'high' => {
  // Priority calculation based on multiple factors
  let score = 0;
  
  // Rating impact
  if (feedback.rating <= 2) score += 3;
  else if (feedback.rating === 3) score += 1;
  
  // Type impact
  if (feedback.feedbackType === 'bug-report') score += 2;
  if (feedback.feedbackType === 'system-performance') score += 2;
  if (feedback.feedbackType === 'analysis-accuracy') score += 2;
  
  // Category impact
  if (feedback.category === 'accuracy') score += 2;
  if (feedback.category === 'compliance') score += 3;
  if (feedback.category === 'performance') score += 1;
  
  // Sentiment impact
  if (feedback.sentiment === 'negative') score += 1;
  
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
};