/**
 * Investment Idea Service with versioning and tracking capabilities
 */

import {
  InvestmentIdea,
  CreateInvestmentIdeaRequest,
  UpdateInvestmentIdeaRequest,
  ValidationResult,
  InvestmentIdeaVersion,
  VersionChange,
  FeedbackEntry,
  PerformanceTracking,
  StatusHistoryEntry,
  IdeaStatus,
  TrackingInfo,
  InvestmentIdeaMetadata
} from '../models/investment-idea';
import { InvestmentIdeaValidator } from '../utils/investment-idea-validation';

export class InvestmentIdeaService {
  private ideas: Map<string, InvestmentIdea> = new Map();
  private versions: Map<string, InvestmentIdeaVersion[]> = new Map();

  /**
   * Creates a new investment idea
   */
  async createInvestmentIdea(request: CreateInvestmentIdeaRequest): Promise<{
    idea: InvestmentIdea;
    validation: ValidationResult;
  }> {
    // Validate the request
    const validation = InvestmentIdeaValidator.validateCreateRequest(request);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Generate unique ID
    const id = this.generateId();
    const now = new Date();

    // Create metadata
    const metadata: InvestmentIdeaMetadata = {
      sourceModels: [request.createdBy],
      processingTime: 0, // Will be set by the calling service
      dataSourcesUsed: this.extractDataSources(request.supportingData || []),
      researchDepth: 'standard', // Default value
      qualityScore: this.calculateQualityScore(request),
      noveltyScore: this.calculateNoveltyScore(request),
      marketConditionsAtGeneration: {
        volatilityIndex: 0, // Will be populated by market data service
        marketTrend: 'sideways', // Default value
        economicIndicators: {},
        geopoliticalRisk: 'medium'
      }
    };

    // Create tracking info
    const trackingInfo: TrackingInfo = {
      views: 0,
      implementations: 0,
      feedback: [],
      performance: [],
      status: 'active',
      statusHistory: [{
        status: 'active',
        timestamp: now,
        changedBy: request.createdBy
      }]
    };

    // Create the investment idea
    const idea: InvestmentIdea = {
      id,
      version: 1,
      title: request.title,
      description: request.description,
      investments: request.investments,
      rationale: request.rationale,
      strategy: request.strategy,
      timeHorizon: request.timeHorizon,
      confidenceScore: request.confidenceScore,
      generatedAt: now,
      expiresAt: request.expiresAt,
      lastUpdatedAt: now,
      potentialOutcomes: request.potentialOutcomes,
      supportingData: request.supportingData || [],
      counterArguments: request.counterArguments || [],
      complianceStatus: {
        compliant: true, // Will be updated by compliance service
        issues: [],
        regulationsChecked: [],
        timestamp: now
      },
      createdBy: request.createdBy,
      tags: request.tags || [],
      category: request.category,
      riskLevel: request.riskLevel,
      targetAudience: request.targetAudience,
      metadata,
      trackingInfo
    };

    // Validate the complete idea
    const ideaValidation = InvestmentIdeaValidator.validateInvestmentIdea(idea);
    
    // Store the idea
    this.ideas.set(id, idea);
    
    // Initialize version history
    this.versions.set(id, [{
      version: 1,
      timestamp: now,
      changes: [{
        field: 'created',
        oldValue: null,
        newValue: idea,
        changeType: 'added'
      }],
      changedBy: request.createdBy,
      reason: 'Initial creation'
    }]);

    return {
      idea,
      validation: ideaValidation
    };
  }

  /**
   * Updates an existing investment idea
   */
  async updateInvestmentIdea(request: UpdateInvestmentIdeaRequest): Promise<{
    idea: InvestmentIdea;
    validation: ValidationResult;
    changes: VersionChange[];
  }> {
    // Validate the request
    const validation = InvestmentIdeaValidator.validateUpdateRequest(request);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Get existing idea
    const existingIdea = this.ideas.get(request.id);
    if (!existingIdea) {
      throw new Error(`Investment idea with ID ${request.id} not found`);
    }

    // Track changes
    const changes: VersionChange[] = [];
    const now = new Date();

    // Create updated idea
    const updatedIdea: InvestmentIdea = { ...existingIdea };
    updatedIdea.version += 1;
    updatedIdea.lastUpdatedAt = now;

    // Apply updates and track changes
    if (request.title !== undefined && request.title !== existingIdea.title) {
      changes.push({
        field: 'title',
        oldValue: existingIdea.title,
        newValue: request.title,
        changeType: 'modified'
      });
      updatedIdea.title = request.title;
    }

    if (request.description !== undefined && request.description !== existingIdea.description) {
      changes.push({
        field: 'description',
        oldValue: existingIdea.description,
        newValue: request.description,
        changeType: 'modified'
      });
      updatedIdea.description = request.description;
    }

    if (request.rationale !== undefined && request.rationale !== existingIdea.rationale) {
      changes.push({
        field: 'rationale',
        oldValue: existingIdea.rationale,
        newValue: request.rationale,
        changeType: 'modified'
      });
      updatedIdea.rationale = request.rationale;
    }

    if (request.confidenceScore !== undefined && request.confidenceScore !== existingIdea.confidenceScore) {
      changes.push({
        field: 'confidenceScore',
        oldValue: existingIdea.confidenceScore,
        newValue: request.confidenceScore,
        changeType: 'modified'
      });
      updatedIdea.confidenceScore = request.confidenceScore;
    }

    if (request.expiresAt !== undefined && request.expiresAt !== existingIdea.expiresAt) {
      changes.push({
        field: 'expiresAt',
        oldValue: existingIdea.expiresAt,
        newValue: request.expiresAt,
        changeType: 'modified'
      });
      updatedIdea.expiresAt = request.expiresAt;
    }

    if (request.potentialOutcomes !== undefined) {
      changes.push({
        field: 'potentialOutcomes',
        oldValue: existingIdea.potentialOutcomes,
        newValue: request.potentialOutcomes,
        changeType: 'modified'
      });
      updatedIdea.potentialOutcomes = request.potentialOutcomes;
    }

    if (request.counterArguments !== undefined) {
      changes.push({
        field: 'counterArguments',
        oldValue: existingIdea.counterArguments,
        newValue: request.counterArguments,
        changeType: 'modified'
      });
      updatedIdea.counterArguments = request.counterArguments;
    }

    if (request.tags !== undefined) {
      changes.push({
        field: 'tags',
        oldValue: existingIdea.tags,
        newValue: request.tags,
        changeType: 'modified'
      });
      updatedIdea.tags = request.tags;
    }

    if (request.riskLevel !== undefined && request.riskLevel !== existingIdea.riskLevel) {
      changes.push({
        field: 'riskLevel',
        oldValue: existingIdea.riskLevel,
        newValue: request.riskLevel,
        changeType: 'modified'
      });
      updatedIdea.riskLevel = request.riskLevel;
    }

    if (request.targetAudience !== undefined) {
      changes.push({
        field: 'targetAudience',
        oldValue: existingIdea.targetAudience,
        newValue: request.targetAudience,
        changeType: 'modified'
      });
      updatedIdea.targetAudience = request.targetAudience;
    }

    // Validate the updated idea
    const ideaValidation = InvestmentIdeaValidator.validateInvestmentIdea(updatedIdea);
    
    if (!ideaValidation.isValid) {
      throw new Error(`Updated idea validation failed: ${ideaValidation.errors.map(e => e.message).join(', ')}`);
    }

    // Store the updated idea
    this.ideas.set(request.id, updatedIdea);
    
    // Add version history
    const existingVersions = this.versions.get(request.id) || [];
    existingVersions.push({
      version: updatedIdea.version,
      timestamp: now,
      changes,
      changedBy: request.updatedBy,
      reason: request.reason
    });
    this.versions.set(request.id, existingVersions);

    return {
      idea: updatedIdea,
      validation: ideaValidation,
      changes
    };
  }

  /**
   * Gets an investment idea by ID
   */
  async getInvestmentIdea(id: string): Promise<InvestmentIdea | null> {
    const idea = this.ideas.get(id);
    if (idea) {
      // Increment view count
      idea.trackingInfo.views += 1;
    }
    return idea || null;
  }

  /**
   * Gets version history for an investment idea
   */
  async getVersionHistory(id: string): Promise<InvestmentIdeaVersion[]> {
    return this.versions.get(id) || [];
  }

  /**
   * Adds feedback to an investment idea
   */
  async addFeedback(id: string, feedback: Omit<FeedbackEntry, 'id' | 'timestamp'>): Promise<void> {
    const idea = this.ideas.get(id);
    if (!idea) {
      throw new Error(`Investment idea with ID ${id} not found`);
    }

    const feedbackEntry: FeedbackEntry = {
      id: this.generateId(),
      ...feedback,
      timestamp: new Date()
    };

    idea.trackingInfo.feedback.push(feedbackEntry);
  }

  /**
   * Adds performance tracking data
   */
  async addPerformanceTracking(id: string, performance: PerformanceTracking): Promise<void> {
    const idea = this.ideas.get(id);
    if (!idea) {
      throw new Error(`Investment idea with ID ${id} not found`);
    }

    idea.trackingInfo.performance.push(performance);
  }

  /**
   * Updates the status of an investment idea
   */
  async updateStatus(id: string, status: IdeaStatus, changedBy: string, reason?: string): Promise<void> {
    const idea = this.ideas.get(id);
    if (!idea) {
      throw new Error(`Investment idea with ID ${id} not found`);
    }

    const statusEntry: StatusHistoryEntry = {
      status,
      timestamp: new Date(),
      reason,
      changedBy
    };

    idea.trackingInfo.status = status;
    idea.trackingInfo.statusHistory.push(statusEntry);
  }

  /**
   * Searches investment ideas based on criteria
   */
  async searchInvestmentIdeas(criteria: {
    status?: IdeaStatus[];
    category?: string[];
    riskLevel?: string[];
    timeHorizon?: string[];
    tags?: string[];
    createdBy?: string;
    minConfidence?: number;
    maxAge?: number; // in days
  }): Promise<InvestmentIdea[]> {
    const results: InvestmentIdea[] = [];
    const now = new Date();

    for (const idea of this.ideas.values()) {
      let matches = true;

      if (criteria.status && !criteria.status.includes(idea.trackingInfo.status)) {
        matches = false;
      }

      if (criteria.category && !criteria.category.includes(idea.category)) {
        matches = false;
      }

      if (criteria.riskLevel && !criteria.riskLevel.includes(idea.riskLevel)) {
        matches = false;
      }

      if (criteria.timeHorizon && !criteria.timeHorizon.includes(idea.timeHorizon)) {
        matches = false;
      }

      if (criteria.tags && !criteria.tags.some(tag => idea.tags.includes(tag))) {
        matches = false;
      }

      if (criteria.createdBy && idea.createdBy !== criteria.createdBy) {
        matches = false;
      }

      if (criteria.minConfidence && idea.confidenceScore < criteria.minConfidence) {
        matches = false;
      }

      if (criteria.maxAge) {
        const ageInDays = (now.getTime() - idea.generatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > criteria.maxAge) {
          matches = false;
        }
      }

      if (matches) {
        results.push(idea);
      }
    }

    return results;
  }

  /**
   * Gets investment ideas that are expiring soon
   */
  async getExpiringIdeas(daysAhead: number = 7): Promise<InvestmentIdea[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

    return Array.from(this.ideas.values()).filter(idea => 
      idea.expiresAt && 
      idea.expiresAt <= cutoffDate && 
      idea.trackingInfo.status === 'active'
    );
  }

  private generateId(): string {
    return `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractDataSources(supportingData: any[]): string[] {
    return [...new Set(supportingData.map(data => data.source).filter(Boolean))];
  }

  private calculateQualityScore(request: CreateInvestmentIdeaRequest): number {
    let score = 50; // Base score

    // Add points for completeness
    if (request.description && request.description.length > 100) score += 10;
    if (request.rationale && request.rationale.length > 200) score += 10;
    if (request.potentialOutcomes && request.potentialOutcomes.length >= 3) score += 10;
    if (request.counterArguments && request.counterArguments.length > 0) score += 10;
    if (request.supportingData && request.supportingData.length > 0) score += 10;

    return Math.min(100, score);
  }

  private calculateNoveltyScore(request: CreateInvestmentIdeaRequest): number {
    // This would typically involve comparing against existing ideas
    // For now, return a default score
    return 50;
  }
}