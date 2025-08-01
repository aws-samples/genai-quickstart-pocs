/**
 * Tests for Investment Idea Service
 */

import { InvestmentIdeaService } from '../investment-idea-service';
import {
  CreateInvestmentIdeaRequest,
  UpdateInvestmentIdeaRequest,
  IdeaStatus
} from '../../models/investment-idea';
import { Investment } from '../../models/investment';

describe('InvestmentIdeaService', () => {
  let service: InvestmentIdeaService;

  const mockInvestment: Investment = {
    id: 'inv_1',
    type: 'stock',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    description: 'Technology company',
    historicalPerformance: [],
    riskMetrics: {
      volatility: 0.25,
      beta: 1.2,
      sharpeRatio: 1.5,
      drawdown: 0.15,
      var: 0.05,
      correlations: {}
    },
    relatedInvestments: []
  };

  const validCreateRequest: CreateInvestmentIdeaRequest = {
    title: 'Apple Growth Strategy',
    description: 'Long-term growth investment in Apple Inc. based on strong fundamentals and market position.',
    investments: [mockInvestment],
    rationale: 'Apple has strong fundamentals, growing services revenue, and innovative product pipeline that should drive long-term growth.',
    strategy: 'buy',
    timeHorizon: 'long',
    confidenceScore: 0.8,
    potentialOutcomes: [
      {
        scenario: 'best',
        probability: 0.2,
        returnEstimate: 0.25,
        timeToRealization: 365,
        description: 'Best case scenario with strong product launches',
        conditions: ['Successful product launches', 'Market expansion'],
        keyRisks: ['Competition'],
        catalysts: ['iPhone sales growth']
      },
      {
        scenario: 'expected',
        probability: 0.6,
        returnEstimate: 0.15,
        timeToRealization: 365,
        description: 'Expected scenario with steady growth',
        conditions: ['Market stability'],
        keyRisks: ['Market volatility'],
        catalysts: ['Services growth']
      },
      {
        scenario: 'worst',
        probability: 0.2,
        returnEstimate: -0.05,
        timeToRealization: 365,
        description: 'Worst case with market downturn',
        conditions: ['Market downturn'],
        keyRisks: ['Economic recession'],
        catalysts: ['Regulatory changes']
      }
    ],
    supportingData: [],
    counterArguments: [
      {
        description: 'High valuation risk',
        strength: 'moderate',
        impact: 'medium',
        probability: 0.3
      }
    ],
    tags: ['technology', 'growth'],
    category: 'equity',
    riskLevel: 'moderate',
    targetAudience: ['retail', 'institutional'],
    createdBy: 'claude-sonnet-3.7'
  };

  beforeEach(() => {
    service = new InvestmentIdeaService();
  });

  describe('createInvestmentIdea', () => {
    it('should create a valid investment idea', async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      
      expect(result.idea).toBeDefined();
      expect(result.idea.id).toBeDefined();
      expect(result.idea.version).toBe(1);
      expect(result.idea.title).toBe(validCreateRequest.title);
      expect(result.idea.description).toBe(validCreateRequest.description);
      expect(result.idea.strategy).toBe(validCreateRequest.strategy);
      expect(result.idea.timeHorizon).toBe(validCreateRequest.timeHorizon);
      expect(result.idea.confidenceScore).toBe(validCreateRequest.confidenceScore);
      expect(result.idea.createdBy).toBe(validCreateRequest.createdBy);
      expect(result.idea.trackingInfo.status).toBe('active');
      expect(result.idea.trackingInfo.views).toBe(0);
      expect(result.idea.trackingInfo.implementations).toBe(0);
      expect(result.validation.isValid).toBe(true);
    });

    it('should generate unique IDs for different ideas', async () => {
      const result1 = await service.createInvestmentIdea(validCreateRequest);
      const result2 = await service.createInvestmentIdea(validCreateRequest);
      
      expect(result1.idea.id).not.toBe(result2.idea.id);
    });

    it('should initialize tracking info correctly', async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      
      expect(result.idea.trackingInfo.views).toBe(0);
      expect(result.idea.trackingInfo.implementations).toBe(0);
      expect(result.idea.trackingInfo.feedback).toHaveLength(0);
      expect(result.idea.trackingInfo.performance).toHaveLength(0);
      expect(result.idea.trackingInfo.status).toBe('active');
      expect(result.idea.trackingInfo.statusHistory).toHaveLength(1);
      expect(result.idea.trackingInfo.statusHistory[0].status).toBe('active');
    });

    it('should initialize version history', async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      const versionHistory = await service.getVersionHistory(result.idea.id);
      
      expect(versionHistory).toHaveLength(1);
      expect(versionHistory[0].version).toBe(1);
      expect(versionHistory[0].changes).toHaveLength(1);
      expect(versionHistory[0].changes[0].changeType).toBe('added');
      expect(versionHistory[0].changedBy).toBe(validCreateRequest.createdBy);
    });

    it('should throw error for invalid request', async () => {
      const invalidRequest = { ...validCreateRequest, title: '' };
      
      await expect(service.createInvestmentIdea(invalidRequest))
        .rejects.toThrow('Validation failed');
    });

    it('should calculate quality score', async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      
      expect(result.idea.metadata.qualityScore).toBeGreaterThan(0);
      expect(result.idea.metadata.qualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('updateInvestmentIdea', () => {
    let createdIdea: any;

    beforeEach(async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      createdIdea = result.idea;
    });

    it('should update an existing investment idea', async () => {
      const updateRequest: UpdateInvestmentIdeaRequest = {
        id: createdIdea.id,
        title: 'Updated Apple Strategy',
        confidenceScore: 0.9,
        updatedBy: 'claude-sonnet-3.7'
      };

      const result = await service.updateInvestmentIdea(updateRequest);
      
      expect(result.idea.title).toBe('Updated Apple Strategy');
      expect(result.idea.confidenceScore).toBe(0.9);
      expect(result.idea.version).toBe(2);
      expect(result.changes).toHaveLength(2); // title and confidenceScore
      expect(result.validation.isValid).toBe(true);
    });

    it('should track changes correctly', async () => {
      const updateRequest: UpdateInvestmentIdeaRequest = {
        id: createdIdea.id,
        title: 'Updated Title',
        description: 'Updated Description',
        updatedBy: 'claude-sonnet-3.7',
        reason: 'Improving clarity'
      };

      const result = await service.updateInvestmentIdea(updateRequest);
      
      expect(result.changes).toHaveLength(2);
      expect(result.changes[0].field).toBe('title');
      expect(result.changes[0].oldValue).toBe(createdIdea.title);
      expect(result.changes[0].newValue).toBe('Updated Title');
      expect(result.changes[0].changeType).toBe('modified');
    });

    it('should update version history', async () => {
      const updateRequest: UpdateInvestmentIdeaRequest = {
        id: createdIdea.id,
        title: 'Updated Title',
        updatedBy: 'claude-sonnet-3.7',
        reason: 'Test update'
      };

      await service.updateInvestmentIdea(updateRequest);
      const versionHistory = await service.getVersionHistory(createdIdea.id);
      
      expect(versionHistory).toHaveLength(2);
      expect(versionHistory[1].version).toBe(2);
      expect(versionHistory[1].reason).toBe('Test update');
      expect(versionHistory[1].changedBy).toBe('claude-sonnet-3.7');
    });

    it('should throw error for non-existent idea', async () => {
      const updateRequest: UpdateInvestmentIdeaRequest = {
        id: 'non-existent',
        title: 'Updated Title',
        updatedBy: 'claude-sonnet-3.7'
      };

      await expect(service.updateInvestmentIdea(updateRequest))
        .rejects.toThrow('Investment idea with ID non-existent not found');
    });

    it('should throw error for invalid update', async () => {
      const updateRequest: UpdateInvestmentIdeaRequest = {
        id: createdIdea.id,
        confidenceScore: 2.0, // Invalid score
        updatedBy: 'claude-sonnet-3.7'
      };

      await expect(service.updateInvestmentIdea(updateRequest))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('getInvestmentIdea', () => {
    let createdIdea: any;

    beforeEach(async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      createdIdea = result.idea;
    });

    it('should retrieve an existing investment idea', async () => {
      const idea = await service.getInvestmentIdea(createdIdea.id);
      
      expect(idea).toBeDefined();
      expect(idea!.id).toBe(createdIdea.id);
      expect(idea!.title).toBe(createdIdea.title);
    });

    it('should increment view count', async () => {
      const initialViews = createdIdea.trackingInfo.views;
      
      await service.getInvestmentIdea(createdIdea.id);
      const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
      
      expect(updatedIdea!.trackingInfo.views).toBe(initialViews + 2);
    });

    it('should return null for non-existent idea', async () => {
      const idea = await service.getInvestmentIdea('non-existent');
      
      expect(idea).toBeNull();
    });
  });

  describe('addFeedback', () => {
    let createdIdea: any;

    beforeEach(async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      createdIdea = result.idea;
    });

    it('should add feedback to an investment idea', async () => {
      const feedback = {
        userId: 'user123',
        rating: 4,
        comment: 'Great analysis',
        feedbackType: 'quality' as const
      };

      await service.addFeedback(createdIdea.id, feedback);
      const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
      
      expect(updatedIdea!.trackingInfo.feedback).toHaveLength(1);
      expect(updatedIdea!.trackingInfo.feedback[0].userId).toBe('user123');
      expect(updatedIdea!.trackingInfo.feedback[0].rating).toBe(4);
      expect(updatedIdea!.trackingInfo.feedback[0].comment).toBe('Great analysis');
      expect(updatedIdea!.trackingInfo.feedback[0].id).toBeDefined();
      expect(updatedIdea!.trackingInfo.feedback[0].timestamp).toBeDefined();
    });

    it('should throw error for non-existent idea', async () => {
      const feedback = {
        userId: 'user123',
        rating: 4,
        feedbackType: 'quality' as const
      };

      await expect(service.addFeedback('non-existent', feedback))
        .rejects.toThrow('Investment idea with ID non-existent not found');
    });
  });

  describe('addPerformanceTracking', () => {
    let createdIdea: any;

    beforeEach(async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      createdIdea = result.idea;
    });

    it('should add performance tracking data', async () => {
      const performance = {
        date: new Date(),
        actualReturn: 0.12,
        expectedReturn: 0.15,
        variance: -0.03,
        notes: 'Slightly underperformed'
      };

      await service.addPerformanceTracking(createdIdea.id, performance);
      const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
      
      expect(updatedIdea!.trackingInfo.performance).toHaveLength(1);
      expect(updatedIdea!.trackingInfo.performance[0].actualReturn).toBe(0.12);
      expect(updatedIdea!.trackingInfo.performance[0].expectedReturn).toBe(0.15);
      expect(updatedIdea!.trackingInfo.performance[0].variance).toBe(-0.03);
    });
  });

  describe('updateStatus', () => {
    let createdIdea: any;

    beforeEach(async () => {
      const result = await service.createInvestmentIdea(validCreateRequest);
      createdIdea = result.idea;
    });

    it('should update the status of an investment idea', async () => {
      await service.updateStatus(createdIdea.id, 'implemented', 'user123', 'Successfully implemented');
      const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
      
      expect(updatedIdea!.trackingInfo.status).toBe('implemented');
      expect(updatedIdea!.trackingInfo.statusHistory).toHaveLength(2);
      expect(updatedIdea!.trackingInfo.statusHistory[1].status).toBe('implemented');
      expect(updatedIdea!.trackingInfo.statusHistory[1].changedBy).toBe('user123');
      expect(updatedIdea!.trackingInfo.statusHistory[1].reason).toBe('Successfully implemented');
    });
  });

  describe('searchInvestmentIdeas', () => {
    beforeEach(async () => {
      // Create multiple ideas for testing
      await service.createInvestmentIdea({
        ...validCreateRequest,
        title: 'Tech Growth',
        category: 'equity',
        riskLevel: 'high',
        tags: ['technology', 'growth']
      });

      await service.createInvestmentIdea({
        ...validCreateRequest,
        title: 'Bond Investment',
        category: 'fixed-income',
        riskLevel: 'low',
        tags: ['bonds', 'income']
      });

      await service.createInvestmentIdea({
        ...validCreateRequest,
        title: 'Commodity Play',
        category: 'commodity',
        riskLevel: 'moderate',
        tags: ['commodities', 'inflation-hedge']
      });
    });

    it('should search by category', async () => {
      const results = await service.searchInvestmentIdeas({
        category: ['equity']
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('equity');
    });

    it('should search by risk level', async () => {
      const results = await service.searchInvestmentIdeas({
        riskLevel: ['low', 'moderate']
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => ['low', 'moderate'].includes(r.riskLevel))).toBe(true);
    });

    it('should search by tags', async () => {
      const results = await service.searchInvestmentIdeas({
        tags: ['technology']
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('technology');
    });

    it('should search by minimum confidence', async () => {
      const results = await service.searchInvestmentIdeas({
        minConfidence: 0.7
      });
      
      expect(results.every(r => r.confidenceScore >= 0.7)).toBe(true);
    });

    it('should search by created by', async () => {
      const results = await service.searchInvestmentIdeas({
        createdBy: 'claude-sonnet-3.7'
      });
      
      expect(results.every(r => r.createdBy === 'claude-sonnet-3.7')).toBe(true);
    });

    it('should combine multiple criteria', async () => {
      const results = await service.searchInvestmentIdeas({
        category: ['equity', 'commodity'],
        riskLevel: ['moderate', 'high']
      });
      
      expect(results).toHaveLength(2);
      expect(results.every(r => 
        ['equity', 'commodity'].includes(r.category) &&
        ['moderate', 'high'].includes(r.riskLevel)
      )).toBe(true);
    });
  });

  describe('getExpiringIdeas', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const farFutureDate = new Date();
      farFutureDate.setDate(farFutureDate.getDate() + 10);

      // Create idea expiring soon
      await service.createInvestmentIdea({
        ...validCreateRequest,
        title: 'Expiring Soon',
        expiresAt: futureDate
      });

      // Create idea expiring later
      await service.createInvestmentIdea({
        ...validCreateRequest,
        title: 'Expiring Later',
        expiresAt: farFutureDate
      });

      // Create idea without expiration
      await service.createInvestmentIdea({
        ...validCreateRequest,
        title: 'No Expiration'
      });
    });

    it('should return ideas expiring within specified days', async () => {
      const results = await service.getExpiringIdeas(7);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Expiring Soon');
    });

    it('should return empty array if no ideas are expiring', async () => {
      const results = await service.getExpiringIdeas(1);
      
      expect(results).toHaveLength(0);
    });
  });
});