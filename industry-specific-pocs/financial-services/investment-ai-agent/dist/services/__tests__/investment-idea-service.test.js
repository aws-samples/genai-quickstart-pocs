"use strict";
/**
 * Tests for Investment Idea Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const investment_idea_service_1 = require("../investment-idea-service");
describe('InvestmentIdeaService', () => {
    let service;
    const mockInvestment = {
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
    const validCreateRequest = {
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
        service = new investment_idea_service_1.InvestmentIdeaService();
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
        let createdIdea;
        beforeEach(async () => {
            const result = await service.createInvestmentIdea(validCreateRequest);
            createdIdea = result.idea;
        });
        it('should update an existing investment idea', async () => {
            const updateRequest = {
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
            const updateRequest = {
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
            const updateRequest = {
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
            const updateRequest = {
                id: 'non-existent',
                title: 'Updated Title',
                updatedBy: 'claude-sonnet-3.7'
            };
            await expect(service.updateInvestmentIdea(updateRequest))
                .rejects.toThrow('Investment idea with ID non-existent not found');
        });
        it('should throw error for invalid update', async () => {
            const updateRequest = {
                id: createdIdea.id,
                confidenceScore: 2.0,
                updatedBy: 'claude-sonnet-3.7'
            };
            await expect(service.updateInvestmentIdea(updateRequest))
                .rejects.toThrow('Validation failed');
        });
    });
    describe('getInvestmentIdea', () => {
        let createdIdea;
        beforeEach(async () => {
            const result = await service.createInvestmentIdea(validCreateRequest);
            createdIdea = result.idea;
        });
        it('should retrieve an existing investment idea', async () => {
            const idea = await service.getInvestmentIdea(createdIdea.id);
            expect(idea).toBeDefined();
            expect(idea.id).toBe(createdIdea.id);
            expect(idea.title).toBe(createdIdea.title);
        });
        it('should increment view count', async () => {
            const initialViews = createdIdea.trackingInfo.views;
            await service.getInvestmentIdea(createdIdea.id);
            const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
            expect(updatedIdea.trackingInfo.views).toBe(initialViews + 2);
        });
        it('should return null for non-existent idea', async () => {
            const idea = await service.getInvestmentIdea('non-existent');
            expect(idea).toBeNull();
        });
    });
    describe('addFeedback', () => {
        let createdIdea;
        beforeEach(async () => {
            const result = await service.createInvestmentIdea(validCreateRequest);
            createdIdea = result.idea;
        });
        it('should add feedback to an investment idea', async () => {
            const feedback = {
                userId: 'user123',
                rating: 4,
                comment: 'Great analysis',
                feedbackType: 'quality'
            };
            await service.addFeedback(createdIdea.id, feedback);
            const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
            expect(updatedIdea.trackingInfo.feedback).toHaveLength(1);
            expect(updatedIdea.trackingInfo.feedback[0].userId).toBe('user123');
            expect(updatedIdea.trackingInfo.feedback[0].rating).toBe(4);
            expect(updatedIdea.trackingInfo.feedback[0].comment).toBe('Great analysis');
            expect(updatedIdea.trackingInfo.feedback[0].id).toBeDefined();
            expect(updatedIdea.trackingInfo.feedback[0].timestamp).toBeDefined();
        });
        it('should throw error for non-existent idea', async () => {
            const feedback = {
                userId: 'user123',
                rating: 4,
                feedbackType: 'quality'
            };
            await expect(service.addFeedback('non-existent', feedback))
                .rejects.toThrow('Investment idea with ID non-existent not found');
        });
    });
    describe('addPerformanceTracking', () => {
        let createdIdea;
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
            expect(updatedIdea.trackingInfo.performance).toHaveLength(1);
            expect(updatedIdea.trackingInfo.performance[0].actualReturn).toBe(0.12);
            expect(updatedIdea.trackingInfo.performance[0].expectedReturn).toBe(0.15);
            expect(updatedIdea.trackingInfo.performance[0].variance).toBe(-0.03);
        });
    });
    describe('updateStatus', () => {
        let createdIdea;
        beforeEach(async () => {
            const result = await service.createInvestmentIdea(validCreateRequest);
            createdIdea = result.idea;
        });
        it('should update the status of an investment idea', async () => {
            await service.updateStatus(createdIdea.id, 'implemented', 'user123', 'Successfully implemented');
            const updatedIdea = await service.getInvestmentIdea(createdIdea.id);
            expect(updatedIdea.trackingInfo.status).toBe('implemented');
            expect(updatedIdea.trackingInfo.statusHistory).toHaveLength(2);
            expect(updatedIdea.trackingInfo.statusHistory[1].status).toBe('implemented');
            expect(updatedIdea.trackingInfo.statusHistory[1].changedBy).toBe('user123');
            expect(updatedIdea.trackingInfo.statusHistory[1].reason).toBe('Successfully implemented');
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
            expect(results.every(r => ['equity', 'commodity'].includes(r.category) &&
                ['moderate', 'high'].includes(r.riskLevel))).toBe(true);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZXN0bWVudC1pZGVhLXNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2aWNlcy9fX3Rlc3RzX18vaW52ZXN0bWVudC1pZGVhLXNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsd0VBQW1FO0FBUW5FLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7SUFDckMsSUFBSSxPQUE4QixDQUFDO0lBRW5DLE1BQU0sY0FBYyxHQUFlO1FBQ2pDLEVBQUUsRUFBRSxPQUFPO1FBQ1gsSUFBSSxFQUFFLE9BQU87UUFDYixJQUFJLEVBQUUsWUFBWTtRQUNsQixNQUFNLEVBQUUsTUFBTTtRQUNkLFdBQVcsRUFBRSxvQkFBb0I7UUFDakMscUJBQXFCLEVBQUUsRUFBRTtRQUN6QixXQUFXLEVBQUU7WUFDWCxVQUFVLEVBQUUsSUFBSTtZQUNoQixJQUFJLEVBQUUsR0FBRztZQUNULFdBQVcsRUFBRSxHQUFHO1lBQ2hCLFFBQVEsRUFBRSxJQUFJO1lBQ2QsR0FBRyxFQUFFLElBQUk7WUFDVCxZQUFZLEVBQUUsRUFBRTtTQUNqQjtRQUNELGtCQUFrQixFQUFFLEVBQUU7S0FDdkIsQ0FBQztJQUVGLE1BQU0sa0JBQWtCLEdBQWdDO1FBQ3RELEtBQUssRUFBRSx1QkFBdUI7UUFDOUIsV0FBVyxFQUFFLDZGQUE2RjtRQUMxRyxXQUFXLEVBQUUsQ0FBQyxjQUFjLENBQUM7UUFDN0IsU0FBUyxFQUFFLDhIQUE4SDtRQUN6SSxRQUFRLEVBQUUsS0FBSztRQUNmLFdBQVcsRUFBRSxNQUFNO1FBQ25CLGVBQWUsRUFBRSxHQUFHO1FBQ3BCLGlCQUFpQixFQUFFO1lBQ2pCO2dCQUNFLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixXQUFXLEVBQUUsR0FBRztnQkFDaEIsY0FBYyxFQUFFLElBQUk7Z0JBQ3BCLGlCQUFpQixFQUFFLEdBQUc7Z0JBQ3RCLFdBQVcsRUFBRSxpREFB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QUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRlc3RzIGZvciBJbnZlc3RtZW50IElkZWEgU2VydmljZVxuICovXG5cbmltcG9ydCB7IEludmVzdG1lbnRJZGVhU2VydmljZSB9IGZyb20gJy4uL2ludmVzdG1lbnQtaWRlYS1zZXJ2aWNlJztcbmltcG9ydCB7XG4gIENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCxcbiAgVXBkYXRlSW52ZXN0bWVudElkZWFSZXF1ZXN0LFxuICBJZGVhU3RhdHVzXG59IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50LWlkZWEnO1xuaW1wb3J0IHsgSW52ZXN0bWVudCB9IGZyb20gJy4uLy4uL21vZGVscy9pbnZlc3RtZW50JztcblxuZGVzY3JpYmUoJ0ludmVzdG1lbnRJZGVhU2VydmljZScsICgpID0+IHtcbiAgbGV0IHNlcnZpY2U6IEludmVzdG1lbnRJZGVhU2VydmljZTtcblxuICBjb25zdCBtb2NrSW52ZXN0bWVudDogSW52ZXN0bWVudCA9IHtcbiAgICBpZDogJ2ludl8xJyxcbiAgICB0eXBlOiAnc3RvY2snLFxuICAgIG5hbWU6ICdBcHBsZSBJbmMuJyxcbiAgICB0aWNrZXI6ICdBQVBMJyxcbiAgICBkZXNjcmlwdGlvbjogJ1RlY2hub2xvZ3kgY29tcGFueScsXG4gICAgaGlzdG9yaWNhbFBlcmZvcm1hbmNlOiBbXSxcbiAgICByaXNrTWV0cmljczoge1xuICAgICAgdm9sYXRpbGl0eTogMC4yNSxcbiAgICAgIGJldGE6IDEuMixcbiAgICAgIHNoYXJwZVJhdGlvOiAxLjUsXG4gICAgICBkcmF3ZG93bjogMC4xNSxcbiAgICAgIHZhcjogMC4wNSxcbiAgICAgIGNvcnJlbGF0aW9uczoge31cbiAgICB9LFxuICAgIHJlbGF0ZWRJbnZlc3RtZW50czogW11cbiAgfTtcblxuICBjb25zdCB2YWxpZENyZWF0ZVJlcXVlc3Q6IENyZWF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCA9IHtcbiAgICB0aXRsZTogJ0FwcGxlIEdyb3d0aCBTdHJhdGVneScsXG4gICAgZGVzY3JpcHRpb246ICdMb25nLXRlcm0gZ3Jvd3RoIGludmVzdG1lbnQgaW4gQXBwbGUgSW5jLiBiYXNlZCBvbiBzdHJvbmcgZnVuZGFtZW50YWxzIGFuZCBtYXJrZXQgcG9zaXRpb24uJyxcbiAgICBpbnZlc3RtZW50czogW21vY2tJbnZlc3RtZW50XSxcbiAgICByYXRpb25hbGU6ICdBcHBsZSBoYXMgc3Ryb25nIGZ1bmRhbWVudGFscywgZ3Jvd2luZyBzZXJ2aWNlcyByZXZlbnVlLCBhbmQgaW5ub3ZhdGl2ZSBwcm9kdWN0IHBpcGVsaW5lIHRoYXQgc2hvdWxkIGRyaXZlIGxvbmctdGVybSBncm93dGguJyxcbiAgICBzdHJhdGVneTogJ2J1eScsXG4gICAgdGltZUhvcml6b246ICdsb25nJyxcbiAgICBjb25maWRlbmNlU2NvcmU6IDAuOCxcbiAgICBwb3RlbnRpYWxPdXRjb21lczogW1xuICAgICAge1xuICAgICAgICBzY2VuYXJpbzogJ2Jlc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yLFxuICAgICAgICByZXR1cm5Fc3RpbWF0ZTogMC4yNSxcbiAgICAgICAgdGltZVRvUmVhbGl6YXRpb246IDM2NSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdCZXN0IGNhc2Ugc2NlbmFyaW8gd2l0aCBzdHJvbmcgcHJvZHVjdCBsYXVuY2hlcycsXG4gICAgICAgIGNvbmRpdGlvbnM6IFsnU3VjY2Vzc2Z1bCBwcm9kdWN0IGxhdW5jaGVzJywgJ01hcmtldCBleHBhbnNpb24nXSxcbiAgICAgICAga2V5Umlza3M6IFsnQ29tcGV0aXRpb24nXSxcbiAgICAgICAgY2F0YWx5c3RzOiBbJ2lQaG9uZSBzYWxlcyBncm93dGgnXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2NlbmFyaW86ICdleHBlY3RlZCcsXG4gICAgICAgIHByb2JhYmlsaXR5OiAwLjYsXG4gICAgICAgIHJldHVybkVzdGltYXRlOiAwLjE1LFxuICAgICAgICB0aW1lVG9SZWFsaXphdGlvbjogMzY1LFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0V4cGVjdGVkIHNjZW5hcmlvIHdpdGggc3RlYWR5IGdyb3d0aCcsXG4gICAgICAgIGNvbmRpdGlvbnM6IFsnTWFya2V0IHN0YWJpbGl0eSddLFxuICAgICAgICBrZXlSaXNrczogWydNYXJrZXQgdm9sYXRpbGl0eSddLFxuICAgICAgICBjYXRhbHlzdHM6IFsnU2VydmljZXMgZ3Jvd3RoJ11cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHNjZW5hcmlvOiAnd29yc3QnLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4yLFxuICAgICAgICByZXR1cm5Fc3RpbWF0ZTogLTAuMDUsXG4gICAgICAgIHRpbWVUb1JlYWxpemF0aW9uOiAzNjUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV29yc3QgY2FzZSB3aXRoIG1hcmtldCBkb3dudHVybicsXG4gICAgICAgIGNvbmRpdGlvbnM6IFsnTWFya2V0IGRvd250dXJuJ10sXG4gICAgICAgIGtleVJpc2tzOiBbJ0Vjb25vbWljIHJlY2Vzc2lvbiddLFxuICAgICAgICBjYXRhbHlzdHM6IFsnUmVndWxhdG9yeSBjaGFuZ2VzJ11cbiAgICAgIH1cbiAgICBdLFxuICAgIHN1cHBvcnRpbmdEYXRhOiBbXSxcbiAgICBjb3VudGVyQXJndW1lbnRzOiBbXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSGlnaCB2YWx1YXRpb24gcmlzaycsXG4gICAgICAgIHN0cmVuZ3RoOiAnbW9kZXJhdGUnLFxuICAgICAgICBpbXBhY3Q6ICdtZWRpdW0nLFxuICAgICAgICBwcm9iYWJpbGl0eTogMC4zXG4gICAgICB9XG4gICAgXSxcbiAgICB0YWdzOiBbJ3RlY2hub2xvZ3knLCAnZ3Jvd3RoJ10sXG4gICAgY2F0ZWdvcnk6ICdlcXVpdHknLFxuICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICB0YXJnZXRBdWRpZW5jZTogWydyZXRhaWwnLCAnaW5zdGl0dXRpb25hbCddLFxuICAgIGNyZWF0ZWRCeTogJ2NsYXVkZS1zb25uZXQtMy43J1xuICB9O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHNlcnZpY2UgPSBuZXcgSW52ZXN0bWVudElkZWFTZXJ2aWNlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdjcmVhdGVJbnZlc3RtZW50SWRlYScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSBhIHZhbGlkIGludmVzdG1lbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEodmFsaWRDcmVhdGVSZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLmlkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLnZlcnNpb24pLnRvQmUoMSk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudGl0bGUpLnRvQmUodmFsaWRDcmVhdGVSZXF1ZXN0LnRpdGxlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYS5kZXNjcmlwdGlvbikudG9CZSh2YWxpZENyZWF0ZVJlcXVlc3QuZGVzY3JpcHRpb24pO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLnN0cmF0ZWd5KS50b0JlKHZhbGlkQ3JlYXRlUmVxdWVzdC5zdHJhdGVneSk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudGltZUhvcml6b24pLnRvQmUodmFsaWRDcmVhdGVSZXF1ZXN0LnRpbWVIb3Jpem9uKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYS5jb25maWRlbmNlU2NvcmUpLnRvQmUodmFsaWRDcmVhdGVSZXF1ZXN0LmNvbmZpZGVuY2VTY29yZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEuY3JlYXRlZEJ5KS50b0JlKHZhbGlkQ3JlYXRlUmVxdWVzdC5jcmVhdGVkQnkpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLnRyYWNraW5nSW5mby5zdGF0dXMpLnRvQmUoJ2FjdGl2ZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLnRyYWNraW5nSW5mby52aWV3cykudG9CZSgwKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYS50cmFja2luZ0luZm8uaW1wbGVtZW50YXRpb25zKS50b0JlKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZGF0aW9uLmlzVmFsaWQpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpZmZlcmVudCBpZGVhcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdDEgPSBhd2FpdCBzZXJ2aWNlLmNyZWF0ZUludmVzdG1lbnRJZGVhKHZhbGlkQ3JlYXRlUmVxdWVzdCk7XG4gICAgICBjb25zdCByZXN1bHQyID0gYXdhaXQgc2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSh2YWxpZENyZWF0ZVJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0MS5pZGVhLmlkKS5ub3QudG9CZShyZXN1bHQyLmlkZWEuaWQpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbml0aWFsaXplIHRyYWNraW5nIGluZm8gY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSh2YWxpZENyZWF0ZVJlcXVlc3QpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudHJhY2tpbmdJbmZvLnZpZXdzKS50b0JlKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLnRyYWNraW5nSW5mby5pbXBsZW1lbnRhdGlvbnMpLnRvQmUoMCk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudHJhY2tpbmdJbmZvLmZlZWRiYWNrKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudHJhY2tpbmdJbmZvLnBlcmZvcm1hbmNlKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudHJhY2tpbmdJbmZvLnN0YXR1cykudG9CZSgnYWN0aXZlJyk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudHJhY2tpbmdJbmZvLnN0YXR1c0hpc3RvcnkpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaWRlYS50cmFja2luZ0luZm8uc3RhdHVzSGlzdG9yeVswXS5zdGF0dXMpLnRvQmUoJ2FjdGl2ZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBpbml0aWFsaXplIHZlcnNpb24gaGlzdG9yeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEodmFsaWRDcmVhdGVSZXF1ZXN0KTtcbiAgICAgIGNvbnN0IHZlcnNpb25IaXN0b3J5ID0gYXdhaXQgc2VydmljZS5nZXRWZXJzaW9uSGlzdG9yeShyZXN1bHQuaWRlYS5pZCk7XG4gICAgICBcbiAgICAgIGV4cGVjdCh2ZXJzaW9uSGlzdG9yeSkudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHZlcnNpb25IaXN0b3J5WzBdLnZlcnNpb24pLnRvQmUoMSk7XG4gICAgICBleHBlY3QodmVyc2lvbkhpc3RvcnlbMF0uY2hhbmdlcykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHZlcnNpb25IaXN0b3J5WzBdLmNoYW5nZXNbMF0uY2hhbmdlVHlwZSkudG9CZSgnYWRkZWQnKTtcbiAgICAgIGV4cGVjdCh2ZXJzaW9uSGlzdG9yeVswXS5jaGFuZ2VkQnkpLnRvQmUodmFsaWRDcmVhdGVSZXF1ZXN0LmNyZWF0ZWRCeSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBpbnZhbGlkIHJlcXVlc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpbnZhbGlkUmVxdWVzdCA9IHsgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LCB0aXRsZTogJycgfTtcbiAgICAgIFxuICAgICAgYXdhaXQgZXhwZWN0KHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEoaW52YWxpZFJlcXVlc3QpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdWYWxpZGF0aW9uIGZhaWxlZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgcXVhbGl0eSBzY29yZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEodmFsaWRDcmVhdGVSZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLm1ldGFkYXRhLnF1YWxpdHlTY29yZSkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLm1ldGFkYXRhLnF1YWxpdHlTY29yZSkudG9CZUxlc3NUaGFuT3JFcXVhbCgxMDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndXBkYXRlSW52ZXN0bWVudElkZWEnLCAoKSA9PiB7XG4gICAgbGV0IGNyZWF0ZWRJZGVhOiBhbnk7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEodmFsaWRDcmVhdGVSZXF1ZXN0KTtcbiAgICAgIGNyZWF0ZWRJZGVhID0gcmVzdWx0LmlkZWE7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSBhbiBleGlzdGluZyBpbnZlc3RtZW50IGlkZWEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVSZXF1ZXN0OiBVcGRhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiBjcmVhdGVkSWRlYS5pZCxcbiAgICAgICAgdGl0bGU6ICdVcGRhdGVkIEFwcGxlIFN0cmF0ZWd5JyxcbiAgICAgICAgY29uZmlkZW5jZVNjb3JlOiAwLjksXG4gICAgICAgIHVwZGF0ZWRCeTogJ2NsYXVkZS1zb25uZXQtMy43J1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS51cGRhdGVJbnZlc3RtZW50SWRlYSh1cGRhdGVSZXF1ZXN0KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdC5pZGVhLnRpdGxlKS50b0JlKCdVcGRhdGVkIEFwcGxlIFN0cmF0ZWd5Jyk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEuY29uZmlkZW5jZVNjb3JlKS50b0JlKDAuOSk7XG4gICAgICBleHBlY3QocmVzdWx0LmlkZWEudmVyc2lvbikudG9CZSgyKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY2hhbmdlcykudG9IYXZlTGVuZ3RoKDIpOyAvLyB0aXRsZSBhbmQgY29uZmlkZW5jZVNjb3JlXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkYXRpb24uaXNWYWxpZCkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdHJhY2sgY2hhbmdlcyBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVSZXF1ZXN0OiBVcGRhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiBjcmVhdGVkSWRlYS5pZCxcbiAgICAgICAgdGl0bGU6ICdVcGRhdGVkIFRpdGxlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdVcGRhdGVkIERlc2NyaXB0aW9uJyxcbiAgICAgICAgdXBkYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgICAgICByZWFzb246ICdJbXByb3ZpbmcgY2xhcml0eSdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UudXBkYXRlSW52ZXN0bWVudElkZWEodXBkYXRlUmVxdWVzdCk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHQuY2hhbmdlcykudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jaGFuZ2VzWzBdLmZpZWxkKS50b0JlKCd0aXRsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jaGFuZ2VzWzBdLm9sZFZhbHVlKS50b0JlKGNyZWF0ZWRJZGVhLnRpdGxlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuY2hhbmdlc1swXS5uZXdWYWx1ZSkudG9CZSgnVXBkYXRlZCBUaXRsZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5jaGFuZ2VzWzBdLmNoYW5nZVR5cGUpLnRvQmUoJ21vZGlmaWVkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHVwZGF0ZSB2ZXJzaW9uIGhpc3RvcnknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB1cGRhdGVSZXF1ZXN0OiBVcGRhdGVJbnZlc3RtZW50SWRlYVJlcXVlc3QgPSB7XG4gICAgICAgIGlkOiBjcmVhdGVkSWRlYS5pZCxcbiAgICAgICAgdGl0bGU6ICdVcGRhdGVkIFRpdGxlJyxcbiAgICAgICAgdXBkYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnLFxuICAgICAgICByZWFzb246ICdUZXN0IHVwZGF0ZSdcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHNlcnZpY2UudXBkYXRlSW52ZXN0bWVudElkZWEodXBkYXRlUmVxdWVzdCk7XG4gICAgICBjb25zdCB2ZXJzaW9uSGlzdG9yeSA9IGF3YWl0IHNlcnZpY2UuZ2V0VmVyc2lvbkhpc3RvcnkoY3JlYXRlZElkZWEuaWQpO1xuICAgICAgXG4gICAgICBleHBlY3QodmVyc2lvbkhpc3RvcnkpLnRvSGF2ZUxlbmd0aCgyKTtcbiAgICAgIGV4cGVjdCh2ZXJzaW9uSGlzdG9yeVsxXS52ZXJzaW9uKS50b0JlKDIpO1xuICAgICAgZXhwZWN0KHZlcnNpb25IaXN0b3J5WzFdLnJlYXNvbikudG9CZSgnVGVzdCB1cGRhdGUnKTtcbiAgICAgIGV4cGVjdCh2ZXJzaW9uSGlzdG9yeVsxXS5jaGFuZ2VkQnkpLnRvQmUoJ2NsYXVkZS1zb25uZXQtMy43Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBub24tZXhpc3RlbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZVJlcXVlc3Q6IFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6ICdub24tZXhpc3RlbnQnLFxuICAgICAgICB0aXRsZTogJ1VwZGF0ZWQgVGl0bGUnLFxuICAgICAgICB1cGRhdGVkQnk6ICdjbGF1ZGUtc29ubmV0LTMuNydcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChzZXJ2aWNlLnVwZGF0ZUludmVzdG1lbnRJZGVhKHVwZGF0ZVJlcXVlc3QpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdJbnZlc3RtZW50IGlkZWEgd2l0aCBJRCBub24tZXhpc3RlbnQgbm90IGZvdW5kJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRocm93IGVycm9yIGZvciBpbnZhbGlkIHVwZGF0ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHVwZGF0ZVJlcXVlc3Q6IFVwZGF0ZUludmVzdG1lbnRJZGVhUmVxdWVzdCA9IHtcbiAgICAgICAgaWQ6IGNyZWF0ZWRJZGVhLmlkLFxuICAgICAgICBjb25maWRlbmNlU2NvcmU6IDIuMCwgLy8gSW52YWxpZCBzY29yZVxuICAgICAgICB1cGRhdGVkQnk6ICdjbGF1ZGUtc29ubmV0LTMuNydcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChzZXJ2aWNlLnVwZGF0ZUludmVzdG1lbnRJZGVhKHVwZGF0ZVJlcXVlc3QpKVxuICAgICAgICAucmVqZWN0cy50b1Rocm93KCdWYWxpZGF0aW9uIGZhaWxlZCcpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0SW52ZXN0bWVudElkZWEnLCAoKSA9PiB7XG4gICAgbGV0IGNyZWF0ZWRJZGVhOiBhbnk7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEodmFsaWRDcmVhdGVSZXF1ZXN0KTtcbiAgICAgIGNyZWF0ZWRJZGVhID0gcmVzdWx0LmlkZWE7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHJpZXZlIGFuIGV4aXN0aW5nIGludmVzdG1lbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGlkZWEgPSBhd2FpdCBzZXJ2aWNlLmdldEludmVzdG1lbnRJZGVhKGNyZWF0ZWRJZGVhLmlkKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGlkZWEpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoaWRlYSEuaWQpLnRvQmUoY3JlYXRlZElkZWEuaWQpO1xuICAgICAgZXhwZWN0KGlkZWEhLnRpdGxlKS50b0JlKGNyZWF0ZWRJZGVhLnRpdGxlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaW5jcmVtZW50IHZpZXcgY291bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBpbml0aWFsVmlld3MgPSBjcmVhdGVkSWRlYS50cmFja2luZ0luZm8udmlld3M7XG4gICAgICBcbiAgICAgIGF3YWl0IHNlcnZpY2UuZ2V0SW52ZXN0bWVudElkZWEoY3JlYXRlZElkZWEuaWQpO1xuICAgICAgY29uc3QgdXBkYXRlZElkZWEgPSBhd2FpdCBzZXJ2aWNlLmdldEludmVzdG1lbnRJZGVhKGNyZWF0ZWRJZGVhLmlkKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8udmlld3MpLnRvQmUoaW5pdGlhbFZpZXdzICsgMik7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBudWxsIGZvciBub24tZXhpc3RlbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGlkZWEgPSBhd2FpdCBzZXJ2aWNlLmdldEludmVzdG1lbnRJZGVhKCdub24tZXhpc3RlbnQnKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KGlkZWEpLnRvQmVOdWxsKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdhZGRGZWVkYmFjaycsICgpID0+IHtcbiAgICBsZXQgY3JlYXRlZElkZWE6IGFueTtcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSh2YWxpZENyZWF0ZVJlcXVlc3QpO1xuICAgICAgY3JlYXRlZElkZWEgPSByZXN1bHQuaWRlYTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgYWRkIGZlZWRiYWNrIHRvIGFuIGludmVzdG1lbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZlZWRiYWNrID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgcmF0aW5nOiA0LFxuICAgICAgICBjb21tZW50OiAnR3JlYXQgYW5hbHlzaXMnLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdxdWFsaXR5JyBhcyBjb25zdFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgc2VydmljZS5hZGRGZWVkYmFjayhjcmVhdGVkSWRlYS5pZCwgZmVlZGJhY2spO1xuICAgICAgY29uc3QgdXBkYXRlZElkZWEgPSBhd2FpdCBzZXJ2aWNlLmdldEludmVzdG1lbnRJZGVhKGNyZWF0ZWRJZGVhLmlkKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8uZmVlZGJhY2spLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdCh1cGRhdGVkSWRlYSEudHJhY2tpbmdJbmZvLmZlZWRiYWNrWzBdLnVzZXJJZCkudG9CZSgndXNlcjEyMycpO1xuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8uZmVlZGJhY2tbMF0ucmF0aW5nKS50b0JlKDQpO1xuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8uZmVlZGJhY2tbMF0uY29tbWVudCkudG9CZSgnR3JlYXQgYW5hbHlzaXMnKTtcbiAgICAgIGV4cGVjdCh1cGRhdGVkSWRlYSEudHJhY2tpbmdJbmZvLmZlZWRiYWNrWzBdLmlkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8uZmVlZGJhY2tbMF0udGltZXN0YW1wKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0aHJvdyBlcnJvciBmb3Igbm9uLWV4aXN0ZW50IGlkZWEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmZWVkYmFjayA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIHJhdGluZzogNCxcbiAgICAgICAgZmVlZGJhY2tUeXBlOiAncXVhbGl0eScgYXMgY29uc3RcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IGV4cGVjdChzZXJ2aWNlLmFkZEZlZWRiYWNrKCdub24tZXhpc3RlbnQnLCBmZWVkYmFjaykpXG4gICAgICAgIC5yZWplY3RzLnRvVGhyb3coJ0ludmVzdG1lbnQgaWRlYSB3aXRoIElEIG5vbi1leGlzdGVudCBub3QgZm91bmQnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2FkZFBlcmZvcm1hbmNlVHJhY2tpbmcnLCAoKSA9PiB7XG4gICAgbGV0IGNyZWF0ZWRJZGVhOiBhbnk7XG5cbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEodmFsaWRDcmVhdGVSZXF1ZXN0KTtcbiAgICAgIGNyZWF0ZWRJZGVhID0gcmVzdWx0LmlkZWE7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFkZCBwZXJmb3JtYW5jZSB0cmFja2luZyBkYXRhJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcGVyZm9ybWFuY2UgPSB7XG4gICAgICAgIGRhdGU6IG5ldyBEYXRlKCksXG4gICAgICAgIGFjdHVhbFJldHVybjogMC4xMixcbiAgICAgICAgZXhwZWN0ZWRSZXR1cm46IDAuMTUsXG4gICAgICAgIHZhcmlhbmNlOiAtMC4wMyxcbiAgICAgICAgbm90ZXM6ICdTbGlnaHRseSB1bmRlcnBlcmZvcm1lZCdcbiAgICAgIH07XG5cbiAgICAgIGF3YWl0IHNlcnZpY2UuYWRkUGVyZm9ybWFuY2VUcmFja2luZyhjcmVhdGVkSWRlYS5pZCwgcGVyZm9ybWFuY2UpO1xuICAgICAgY29uc3QgdXBkYXRlZElkZWEgPSBhd2FpdCBzZXJ2aWNlLmdldEludmVzdG1lbnRJZGVhKGNyZWF0ZWRJZGVhLmlkKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8ucGVyZm9ybWFuY2UpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdCh1cGRhdGVkSWRlYSEudHJhY2tpbmdJbmZvLnBlcmZvcm1hbmNlWzBdLmFjdHVhbFJldHVybikudG9CZSgwLjEyKTtcbiAgICAgIGV4cGVjdCh1cGRhdGVkSWRlYSEudHJhY2tpbmdJbmZvLnBlcmZvcm1hbmNlWzBdLmV4cGVjdGVkUmV0dXJuKS50b0JlKDAuMTUpO1xuICAgICAgZXhwZWN0KHVwZGF0ZWRJZGVhIS50cmFja2luZ0luZm8ucGVyZm9ybWFuY2VbMF0udmFyaWFuY2UpLnRvQmUoLTAuMDMpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndXBkYXRlU3RhdHVzJywgKCkgPT4ge1xuICAgIGxldCBjcmVhdGVkSWRlYTogYW55O1xuXG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZXJ2aWNlLmNyZWF0ZUludmVzdG1lbnRJZGVhKHZhbGlkQ3JlYXRlUmVxdWVzdCk7XG4gICAgICBjcmVhdGVkSWRlYSA9IHJlc3VsdC5pZGVhO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB1cGRhdGUgdGhlIHN0YXR1cyBvZiBhbiBpbnZlc3RtZW50IGlkZWEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzZXJ2aWNlLnVwZGF0ZVN0YXR1cyhjcmVhdGVkSWRlYS5pZCwgJ2ltcGxlbWVudGVkJywgJ3VzZXIxMjMnLCAnU3VjY2Vzc2Z1bGx5IGltcGxlbWVudGVkJyk7XG4gICAgICBjb25zdCB1cGRhdGVkSWRlYSA9IGF3YWl0IHNlcnZpY2UuZ2V0SW52ZXN0bWVudElkZWEoY3JlYXRlZElkZWEuaWQpO1xuICAgICAgXG4gICAgICBleHBlY3QodXBkYXRlZElkZWEhLnRyYWNraW5nSW5mby5zdGF0dXMpLnRvQmUoJ2ltcGxlbWVudGVkJyk7XG4gICAgICBleHBlY3QodXBkYXRlZElkZWEhLnRyYWNraW5nSW5mby5zdGF0dXNIaXN0b3J5KS50b0hhdmVMZW5ndGgoMik7XG4gICAgICBleHBlY3QodXBkYXRlZElkZWEhLnRyYWNraW5nSW5mby5zdGF0dXNIaXN0b3J5WzFdLnN0YXR1cykudG9CZSgnaW1wbGVtZW50ZWQnKTtcbiAgICAgIGV4cGVjdCh1cGRhdGVkSWRlYSEudHJhY2tpbmdJbmZvLnN0YXR1c0hpc3RvcnlbMV0uY2hhbmdlZEJ5KS50b0JlKCd1c2VyMTIzJyk7XG4gICAgICBleHBlY3QodXBkYXRlZElkZWEhLnRyYWNraW5nSW5mby5zdGF0dXNIaXN0b3J5WzFdLnJlYXNvbikudG9CZSgnU3VjY2Vzc2Z1bGx5IGltcGxlbWVudGVkJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdzZWFyY2hJbnZlc3RtZW50SWRlYXMnLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICAvLyBDcmVhdGUgbXVsdGlwbGUgaWRlYXMgZm9yIHRlc3RpbmdcbiAgICAgIGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEoe1xuICAgICAgICAuLi52YWxpZENyZWF0ZVJlcXVlc3QsXG4gICAgICAgIHRpdGxlOiAnVGVjaCBHcm93dGgnLFxuICAgICAgICBjYXRlZ29yeTogJ2VxdWl0eScsXG4gICAgICAgIHJpc2tMZXZlbDogJ2hpZ2gnLFxuICAgICAgICB0YWdzOiBbJ3RlY2hub2xvZ3knLCAnZ3Jvd3RoJ11cbiAgICAgIH0pO1xuXG4gICAgICBhd2FpdCBzZXJ2aWNlLmNyZWF0ZUludmVzdG1lbnRJZGVhKHtcbiAgICAgICAgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LFxuICAgICAgICB0aXRsZTogJ0JvbmQgSW52ZXN0bWVudCcsXG4gICAgICAgIGNhdGVnb3J5OiAnZml4ZWQtaW5jb21lJyxcbiAgICAgICAgcmlza0xldmVsOiAnbG93JyxcbiAgICAgICAgdGFnczogWydib25kcycsICdpbmNvbWUnXVxuICAgICAgfSk7XG5cbiAgICAgIGF3YWl0IHNlcnZpY2UuY3JlYXRlSW52ZXN0bWVudElkZWEoe1xuICAgICAgICAuLi52YWxpZENyZWF0ZVJlcXVlc3QsXG4gICAgICAgIHRpdGxlOiAnQ29tbW9kaXR5IFBsYXknLFxuICAgICAgICBjYXRlZ29yeTogJ2NvbW1vZGl0eScsXG4gICAgICAgIHJpc2tMZXZlbDogJ21vZGVyYXRlJyxcbiAgICAgICAgdGFnczogWydjb21tb2RpdGllcycsICdpbmZsYXRpb24taGVkZ2UnXVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNlYXJjaCBieSBjYXRlZ29yeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBzZXJ2aWNlLnNlYXJjaEludmVzdG1lbnRJZGVhcyh7XG4gICAgICAgIGNhdGVnb3J5OiBbJ2VxdWl0eSddXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdHMpLnRvSGF2ZUxlbmd0aCgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHRzWzBdLmNhdGVnb3J5KS50b0JlKCdlcXVpdHknKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2VhcmNoIGJ5IHJpc2sgbGV2ZWwnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2VydmljZS5zZWFyY2hJbnZlc3RtZW50SWRlYXMoe1xuICAgICAgICByaXNrTGV2ZWw6IFsnbG93JywgJ21vZGVyYXRlJ11cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0cykudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KHJlc3VsdHMuZXZlcnkociA9PiBbJ2xvdycsICdtb2RlcmF0ZSddLmluY2x1ZGVzKHIucmlza0xldmVsKSkpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNlYXJjaCBieSB0YWdzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNlcnZpY2Uuc2VhcmNoSW52ZXN0bWVudElkZWFzKHtcbiAgICAgICAgdGFnczogWyd0ZWNobm9sb2d5J11cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMF0udGFncykudG9Db250YWluKCd0ZWNobm9sb2d5Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNlYXJjaCBieSBtaW5pbXVtIGNvbmZpZGVuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2VydmljZS5zZWFyY2hJbnZlc3RtZW50SWRlYXMoe1xuICAgICAgICBtaW5Db25maWRlbmNlOiAwLjdcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0cy5ldmVyeShyID0+IHIuY29uZmlkZW5jZVNjb3JlID49IDAuNykpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHNlYXJjaCBieSBjcmVhdGVkIGJ5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNlcnZpY2Uuc2VhcmNoSW52ZXN0bWVudElkZWFzKHtcbiAgICAgICAgY3JlYXRlZEJ5OiAnY2xhdWRlLXNvbm5ldC0zLjcnXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHJlc3VsdHMuZXZlcnkociA9PiByLmNyZWF0ZWRCeSA9PT0gJ2NsYXVkZS1zb25uZXQtMy43JykpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNvbWJpbmUgbXVsdGlwbGUgY3JpdGVyaWEnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2VydmljZS5zZWFyY2hJbnZlc3RtZW50SWRlYXMoe1xuICAgICAgICBjYXRlZ29yeTogWydlcXVpdHknLCAnY29tbW9kaXR5J10sXG4gICAgICAgIHJpc2tMZXZlbDogWydtb2RlcmF0ZScsICdoaWdoJ11cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0cykudG9IYXZlTGVuZ3RoKDIpO1xuICAgICAgZXhwZWN0KHJlc3VsdHMuZXZlcnkociA9PiBcbiAgICAgICAgWydlcXVpdHknLCAnY29tbW9kaXR5J10uaW5jbHVkZXMoci5jYXRlZ29yeSkgJiZcbiAgICAgICAgWydtb2RlcmF0ZScsICdoaWdoJ10uaW5jbHVkZXMoci5yaXNrTGV2ZWwpXG4gICAgICApKS50b0JlKHRydWUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0RXhwaXJpbmdJZGVhcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZ1dHVyZURhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgZnV0dXJlRGF0ZS5zZXREYXRlKGZ1dHVyZURhdGUuZ2V0RGF0ZSgpICsgNSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGZhckZ1dHVyZURhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgZmFyRnV0dXJlRGF0ZS5zZXREYXRlKGZhckZ1dHVyZURhdGUuZ2V0RGF0ZSgpICsgMTApO1xuXG4gICAgICAvLyBDcmVhdGUgaWRlYSBleHBpcmluZyBzb29uXG4gICAgICBhd2FpdCBzZXJ2aWNlLmNyZWF0ZUludmVzdG1lbnRJZGVhKHtcbiAgICAgICAgLi4udmFsaWRDcmVhdGVSZXF1ZXN0LFxuICAgICAgICB0aXRsZTogJ0V4cGlyaW5nIFNvb24nLFxuICAgICAgICBleHBpcmVzQXQ6IGZ1dHVyZURhdGVcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDcmVhdGUgaWRlYSBleHBpcmluZyBsYXRlclxuICAgICAgYXdhaXQgc2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSh7XG4gICAgICAgIC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCxcbiAgICAgICAgdGl0bGU6ICdFeHBpcmluZyBMYXRlcicsXG4gICAgICAgIGV4cGlyZXNBdDogZmFyRnV0dXJlRGF0ZVxuICAgICAgfSk7XG5cbiAgICAgIC8vIENyZWF0ZSBpZGVhIHdpdGhvdXQgZXhwaXJhdGlvblxuICAgICAgYXdhaXQgc2VydmljZS5jcmVhdGVJbnZlc3RtZW50SWRlYSh7XG4gICAgICAgIC4uLnZhbGlkQ3JlYXRlUmVxdWVzdCxcbiAgICAgICAgdGl0bGU6ICdObyBFeHBpcmF0aW9uJ1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBpZGVhcyBleHBpcmluZyB3aXRoaW4gc3BlY2lmaWVkIGRheXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2VydmljZS5nZXRFeHBpcmluZ0lkZWFzKDcpO1xuICAgICAgXG4gICAgICBleHBlY3QocmVzdWx0cykudG9IYXZlTGVuZ3RoKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdHNbMF0udGl0bGUpLnRvQmUoJ0V4cGlyaW5nIFNvb24nKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGVtcHR5IGFycmF5IGlmIG5vIGlkZWFzIGFyZSBleHBpcmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBzZXJ2aWNlLmdldEV4cGlyaW5nSWRlYXMoMSk7XG4gICAgICBcbiAgICAgIGV4cGVjdChyZXN1bHRzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19