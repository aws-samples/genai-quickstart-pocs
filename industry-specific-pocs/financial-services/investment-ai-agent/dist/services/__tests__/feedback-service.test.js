"use strict";
// Unit tests for FeedbackService
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_service_1 = require("../feedback-service");
const feedback_1 = require("../../models/feedback");
describe('FeedbackService', () => {
    let feedbackService;
    beforeEach(() => {
        feedbackService = new feedback_service_1.FeedbackService();
    });
    describe('submitFeedback', () => {
        it('should successfully submit valid feedback', async () => {
            const feedbackData = {
                userId: 'user123',
                feedbackType: 'investment-idea-quality',
                category: 'accuracy',
                title: 'Great investment idea',
                description: 'The AI provided excellent analysis with detailed reasoning.',
                rating: 5,
                tags: ['helpful', 'accurate']
            };
            const result = await feedbackService.submitFeedback(feedbackData);
            expect(result.success).toBe(true);
            expect(result.feedback).toBeDefined();
            expect(result.feedback.id).toBeDefined();
            expect(result.feedback.userId).toBe('user123');
            expect(result.feedback.sentiment).toBe('positive');
            expect(result.feedback.status).toBe('submitted');
        });
        it('should reject feedback with missing required fields', async () => {
            const feedbackData = {
                userId: 'user123',
                // Missing required fields
            };
            const result = await feedbackService.submitFeedback(feedbackData);
            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });
        it('should reject feedback with invalid rating', async () => {
            const feedbackData = {
                userId: 'user123',
                feedbackType: 'investment-idea-quality',
                category: 'accuracy',
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
                feedbackType: 'bug-report',
                category: 'performance',
                title: 'System is very slow',
                description: 'The system is performing poorly and causing delays.',
                rating: 2
            };
            const result = await feedbackService.submitFeedback(feedbackData);
            expect(result.success).toBe(true);
            expect(result.feedback.sentiment).toBe('negative');
            expect(result.feedback.priority).toBe('high');
        });
    });
    describe('searchFeedback', () => {
        beforeEach(async () => {
            // Add some test feedback
            await feedbackService.submitFeedback({
                userId: 'user1',
                feedbackType: 'investment-idea-quality',
                category: 'accuracy',
                title: 'Good analysis',
                description: 'The investment analysis was accurate and helpful.',
                rating: 4,
                tags: ['accurate', 'helpful']
            });
            await feedbackService.submitFeedback({
                userId: 'user2',
                feedbackType: 'system-performance',
                category: 'performance',
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
            expect(result.aggregations.averageRating).toBe(3); // (4 + 2) / 2
            expect(result.aggregations.categoryBreakdown.accuracy).toBe(1);
            expect(result.aggregations.categoryBreakdown.performance).toBe(1);
        });
    });
    describe('updateFeedbackStatus', () => {
        let feedbackId;
        beforeEach(async () => {
            const result = await feedbackService.submitFeedback({
                userId: 'user123',
                feedbackType: 'investment-idea-quality',
                category: 'accuracy',
                title: 'Test feedback',
                description: 'Test description',
                rating: 4
            });
            feedbackId = result.feedback.id;
        });
        it('should successfully update feedback status', async () => {
            const success = await feedbackService.updateFeedbackStatus(feedbackId, 'resolved', 'admin123', 'Issue has been addressed');
            expect(success).toBe(true);
            const feedback = await feedbackService.getFeedback(feedbackId);
            expect(feedback.status).toBe('resolved');
            expect(feedback.resolvedBy).toBe('admin123');
            expect(feedback.resolution).toBe('Issue has been addressed');
            expect(feedback.resolvedAt).toBeDefined();
        });
        it('should return false for non-existent feedback', async () => {
            const success = await feedbackService.updateFeedbackStatus('non-existent-id', 'resolved');
            expect(success).toBe(false);
        });
    });
    describe('getFeedbackSummary', () => {
        beforeEach(async () => {
            // Add test feedback with different characteristics
            const feedbackData = [
                {
                    userId: 'user1',
                    feedbackType: 'investment-idea-quality',
                    category: 'accuracy',
                    title: 'Excellent analysis',
                    description: 'Very good investment recommendations.',
                    rating: 5
                },
                {
                    userId: 'user2',
                    feedbackType: 'system-performance',
                    category: 'performance',
                    title: 'Slow system',
                    description: 'System is too slow.',
                    rating: 2
                },
                {
                    userId: 'user3',
                    feedbackType: 'user-experience',
                    category: 'usability',
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
                { rating: 1, feedbackType: 'bug-report', category: 'performance' },
                { rating: 2, feedbackType: 'bug-report', category: 'performance' },
                { rating: 5, feedbackType: 'investment-idea-quality', category: 'accuracy' },
                { rating: 4, feedbackType: 'user-experience', category: 'usability' }
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
            const lowRatingInsight = analytics.insights.find(insight => insight.type === 'issue' && insight.title.includes('Low Ratings'));
            expect(lowRatingInsight).toBeDefined();
            // Check for bug report recommendation
            const bugRecommendation = analytics.recommendations.find(rec => rec.category === 'bug-fixes');
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
            const result = (0, feedback_1.validateFeedback)(feedback);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject feedback with missing required fields', () => {
            const feedback = {
                userId: 'user123'
                // Missing other required fields
            };
            const result = (0, feedback_1.validateFeedback)(feedback);
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
            const result = (0, feedback_1.validateFeedback)(feedback);
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
            const result = (0, feedback_1.validateFeedback)(feedback);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid feedback type');
        });
        it('should reject feedback with too long title or description', () => {
            const feedback = {
                userId: 'user123',
                feedbackType: 'investment-idea-quality',
                category: 'accuracy',
                title: 'a'.repeat(201),
                description: 'b'.repeat(2001),
                rating: 4
            };
            const result = (0, feedback_1.validateFeedback)(feedback);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Title must be 200 characters or less');
            expect(result.errors).toContain('Description must be 2000 characters or less');
        });
    });
    describe('createFeedbackId', () => {
        it('should create unique feedback IDs', () => {
            const id1 = (0, feedback_1.createFeedbackId)();
            const id2 = (0, feedback_1.createFeedbackId)();
            expect(id1).toMatch(/^feedback_\d+_[a-z0-9]{9}$/);
            expect(id2).toMatch(/^feedback_\d+_[a-z0-9]{9}$/);
            expect(id1).not.toBe(id2);
        });
    });
    describe('determineFeedbackSentiment', () => {
        it('should determine positive sentiment for high ratings', () => {
            const sentiment = (0, feedback_1.determineFeedbackSentiment)(5, 'Great service!');
            expect(sentiment).toBe('positive');
        });
        it('should determine negative sentiment for low ratings', () => {
            const sentiment = (0, feedback_1.determineFeedbackSentiment)(1, 'Terrible experience');
            expect(sentiment).toBe('negative');
        });
        it('should analyze description for neutral ratings', () => {
            const positiveSentiment = (0, feedback_1.determineFeedbackSentiment)(3, 'Good analysis and helpful insights');
            expect(positiveSentiment).toBe('positive');
            const negativeSentiment = (0, feedback_1.determineFeedbackSentiment)(3, 'Poor performance and confusing interface');
            expect(negativeSentiment).toBe('negative');
            const neutralSentiment = (0, feedback_1.determineFeedbackSentiment)(3, 'Average experience overall');
            expect(neutralSentiment).toBe('neutral');
        });
    });
    describe('calculateFeedbackPriority', () => {
        it('should assign high priority to critical feedback', () => {
            const feedback = {
                id: 'test',
                userId: 'user123',
                feedbackType: 'bug-report',
                rating: 1,
                category: 'compliance',
                title: 'Critical bug',
                description: 'System is broken',
                tags: [],
                sentiment: 'negative',
                priority: 'medium',
                status: 'submitted',
                metadata: { source: 'web' },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const priority = (0, feedback_1.calculateFeedbackPriority)(feedback);
            expect(priority).toBe('high');
        });
        it('should assign low priority to positive feedback', () => {
            const feedback = {
                id: 'test',
                userId: 'user123',
                feedbackType: 'general',
                rating: 5,
                category: 'other',
                title: 'Great job',
                description: 'Everything works well',
                tags: [],
                sentiment: 'positive',
                priority: 'medium',
                status: 'submitted',
                metadata: { source: 'web' },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const priority = (0, feedback_1.calculateFeedbackPriority)(feedback);
            expect(priority).toBe('low');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2stc2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3NlcnZpY2VzL19fdGVzdHNfXy9mZWVkYmFjay1zZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlDQUFpQzs7QUFFakMsMERBQXNEO0FBQ3RELG9EQVMrQjtBQUUvQixRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO0lBQy9CLElBQUksZUFBZ0MsQ0FBQztJQUVyQyxVQUFVLENBQUMsR0FBRyxFQUFFO1FBQ2QsZUFBZSxHQUFHLElBQUksa0NBQWUsRUFBRSxDQUFDO0lBQzFDLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUM5QixFQUFFLENBQUMsMkNBQTJDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekQsTUFBTSxZQUFZLEdBQUc7Z0JBQ25CLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixZQUFZLEVBQUUseUJBQXlDO2dCQUN2RCxRQUFRLEVBQUUsVUFBOEI7Z0JBQ3hDLEtBQUssRUFBRSx1QkFBdUI7Z0JBQzlCLFdBQVcsRUFBRSw2REFBNkQ7Z0JBQzFFLE1BQU0sRUFBRSxDQUFDO2dCQUNULElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUM7YUFDOUIsQ0FBQztZQUVGLE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVsRSxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxNQUFN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QUM7WUFDckQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBVbml0IHRlc3RzIGZvciBGZWVkYmFja1NlcnZpY2VcblxuaW1wb3J0IHsgRmVlZGJhY2tTZXJ2aWNlIH0gZnJvbSAnLi4vZmVlZGJhY2stc2VydmljZSc7XG5pbXBvcnQge1xuICBGZWVkYmFjayxcbiAgRmVlZGJhY2tUeXBlLFxuICBGZWVkYmFja0NhdGVnb3J5LFxuICBGZWVkYmFja1N0YXR1cyxcbiAgdmFsaWRhdGVGZWVkYmFjayxcbiAgY3JlYXRlRmVlZGJhY2tJZCxcbiAgZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQsXG4gIGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHlcbn0gZnJvbSAnLi4vLi4vbW9kZWxzL2ZlZWRiYWNrJztcblxuZGVzY3JpYmUoJ0ZlZWRiYWNrU2VydmljZScsICgpID0+IHtcbiAgbGV0IGZlZWRiYWNrU2VydmljZTogRmVlZGJhY2tTZXJ2aWNlO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIGZlZWRiYWNrU2VydmljZSA9IG5ldyBGZWVkYmFja1NlcnZpY2UoKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3N1Ym1pdEZlZWRiYWNrJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgc3VjY2Vzc2Z1bGx5IHN1Ym1pdCB2YWxpZCBmZWVkYmFjaycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGZlZWRiYWNrRGF0YSA9IHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIGZlZWRiYWNrVHlwZTogJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyBhcyBGZWVkYmFja1R5cGUsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjdXJhY3knIGFzIEZlZWRiYWNrQ2F0ZWdvcnksXG4gICAgICAgIHRpdGxlOiAnR3JlYXQgaW52ZXN0bWVudCBpZGVhJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgQUkgcHJvdmlkZWQgZXhjZWxsZW50IGFuYWx5c2lzIHdpdGggZGV0YWlsZWQgcmVhc29uaW5nLicsXG4gICAgICAgIHJhdGluZzogNSxcbiAgICAgICAgdGFnczogWydoZWxwZnVsJywgJ2FjY3VyYXRlJ11cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5zdWJtaXRGZWVkYmFjayhmZWVkYmFja0RhdGEpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmZlZWRiYWNrKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFjayEuaWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmZlZWRiYWNrIS51c2VySWQpLnRvQmUoJ3VzZXIxMjMnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZmVlZGJhY2shLnNlbnRpbWVudCkudG9CZSgncG9zaXRpdmUnKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZmVlZGJhY2shLnN0YXR1cykudG9CZSgnc3VibWl0dGVkJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBmZWVkYmFjayB3aXRoIG1pc3NpbmcgcmVxdWlyZWQgZmllbGRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmVlZGJhY2tEYXRhID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgLy8gTWlzc2luZyByZXF1aXJlZCBmaWVsZHNcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5zdWJtaXRGZWVkYmFjayhmZWVkYmFja0RhdGEpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnN1Y2Nlc3MpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycyEubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBmZWVkYmFjayB3aXRoIGludmFsaWQgcmF0aW5nJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmVlZGJhY2tEYXRhID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgZmVlZGJhY2tUeXBlOiAnaW52ZXN0bWVudC1pZGVhLXF1YWxpdHknIGFzIEZlZWRiYWNrVHlwZSxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScgYXMgRmVlZGJhY2tDYXRlZ29yeSxcbiAgICAgICAgdGl0bGU6ICdUZXN0IGZlZWRiYWNrJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUZXN0IGRlc2NyaXB0aW9uJyxcbiAgICAgICAgcmF0aW5nOiA2IC8vIEludmFsaWQgcmF0aW5nXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2soZmVlZGJhY2tEYXRhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW4oJ1JhdGluZyBtdXN0IGJlIGFuIGludGVnZXIgYmV0d2VlbiAxIGFuZCA1Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGF1dG9tYXRpY2FsbHkgY2FsY3VsYXRlIHNlbnRpbWVudCBhbmQgcHJpb3JpdHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBmZWVkYmFja0RhdGEgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdidWctcmVwb3J0JyBhcyBGZWVkYmFja1R5cGUsXG4gICAgICAgIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnIGFzIEZlZWRiYWNrQ2F0ZWdvcnksXG4gICAgICAgIHRpdGxlOiAnU3lzdGVtIGlzIHZlcnkgc2xvdycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHN5c3RlbSBpcyBwZXJmb3JtaW5nIHBvb3JseSBhbmQgY2F1c2luZyBkZWxheXMuJyxcbiAgICAgICAgcmF0aW5nOiAyXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2soZmVlZGJhY2tEYXRhKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5zdWNjZXNzKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFjayEuc2VudGltZW50KS50b0JlKCduZWdhdGl2ZScpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFjayEucHJpb3JpdHkpLnRvQmUoJ2hpZ2gnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3NlYXJjaEZlZWRiYWNrJywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gQWRkIHNvbWUgdGVzdCBmZWVkYmFja1xuICAgICAgYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnN1Ym1pdEZlZWRiYWNrKHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEnLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScgYXMgRmVlZGJhY2tUeXBlLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY3VyYWN5JyBhcyBGZWVkYmFja0NhdGVnb3J5LFxuICAgICAgICB0aXRsZTogJ0dvb2QgYW5hbHlzaXMnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBpbnZlc3RtZW50IGFuYWx5c2lzIHdhcyBhY2N1cmF0ZSBhbmQgaGVscGZ1bC4nLFxuICAgICAgICByYXRpbmc6IDQsXG4gICAgICAgIHRhZ3M6IFsnYWNjdXJhdGUnLCAnaGVscGZ1bCddXG4gICAgICB9KTtcblxuICAgICAgYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnN1Ym1pdEZlZWRiYWNrKHtcbiAgICAgICAgdXNlcklkOiAndXNlcjInLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdzeXN0ZW0tcGVyZm9ybWFuY2UnIGFzIEZlZWRiYWNrVHlwZSxcbiAgICAgICAgY2F0ZWdvcnk6ICdwZXJmb3JtYW5jZScgYXMgRmVlZGJhY2tDYXRlZ29yeSxcbiAgICAgICAgdGl0bGU6ICdTbG93IHJlc3BvbnNlJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgc3lzdGVtIHRvb2sgdG9vIGxvbmcgdG8gcmVzcG9uZC4nLFxuICAgICAgICByYXRpbmc6IDIsXG4gICAgICAgIHRhZ3M6IFsnc2xvdycsICdwZXJmb3JtYW5jZSddXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGFsbCBmZWVkYmFjayB3aGVuIG5vIGZpbHRlcnMgYXBwbGllZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5zZWFyY2hGZWVkYmFjaygpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmZlZWRiYWNrLmxlbmd0aCkudG9CZSgyKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudG90YWxDb3VudCkudG9CZSgyKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzTW9yZSkudG9CZShmYWxzZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZpbHRlciBmZWVkYmFjayBieSB1c2VyIElEJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnNlYXJjaEZlZWRiYWNrKHtcbiAgICAgICAgZmlsdGVyczogeyB1c2VySWQ6ICd1c2VyMScgfVxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZmVlZGJhY2subGVuZ3RoKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFja1swXS51c2VySWQpLnRvQmUoJ3VzZXIxJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGZpbHRlciBmZWVkYmFjayBieSBmZWVkYmFjayB0eXBlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnNlYXJjaEZlZWRiYWNrKHtcbiAgICAgICAgZmlsdGVyczogeyBmZWVkYmFja1R5cGU6IFsnc3lzdGVtLXBlcmZvcm1hbmNlJ10gfVxuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZmVlZGJhY2subGVuZ3RoKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFja1swXS5mZWVkYmFja1R5cGUpLnRvQmUoJ3N5c3RlbS1wZXJmb3JtYW5jZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmaWx0ZXIgZmVlZGJhY2sgYnkgcmF0aW5nIHJhbmdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnNlYXJjaEZlZWRiYWNrKHtcbiAgICAgICAgZmlsdGVyczogeyByYXRpbmc6IHsgbWluOiA0LCBtYXg6IDUgfSB9XG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFjay5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICBleHBlY3QocmVzdWx0LmZlZWRiYWNrWzBdLnJhdGluZykudG9CZSg0KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2VhcmNoIGZlZWRiYWNrIGJ5IHRleHQgcXVlcnknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2Uuc2VhcmNoRmVlZGJhY2soe1xuICAgICAgICBxdWVyeTogJ2FuYWx5c2lzJ1xuICAgICAgfSk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQuZmVlZGJhY2subGVuZ3RoKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFja1swXS50aXRsZSkudG9Db250YWluKCdhbmFseXNpcycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzb3J0IGZlZWRiYWNrIGJ5IHJhdGluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5zZWFyY2hGZWVkYmFjayh7XG4gICAgICAgIHNvcnRCeTogJ3JhdGluZycsXG4gICAgICAgIHNvcnRPcmRlcjogJ2Rlc2MnXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5mZWVkYmFja1swXS5yYXRpbmcpLnRvQmUoNCk7XG4gICAgICBleHBlY3QocmVzdWx0LmZlZWRiYWNrWzFdLnJhdGluZykudG9CZSgyKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcGFnaW5hdGUgcmVzdWx0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5zZWFyY2hGZWVkYmFjayh7XG4gICAgICAgIGxpbWl0OiAxLFxuICAgICAgICBvZmZzZXQ6IDBcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmZlZWRiYWNrLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuaGFzTW9yZSkudG9CZSh0cnVlKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGFnZ3JlZ2F0aW9ucycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5zZWFyY2hGZWVkYmFjaygpO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmFnZ3JlZ2F0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuYWdncmVnYXRpb25zIS5hdmVyYWdlUmF0aW5nKS50b0JlKDMpOyAvLyAoNCArIDIpIC8gMlxuICAgICAgZXhwZWN0KHJlc3VsdC5hZ2dyZWdhdGlvbnMhLmNhdGVnb3J5QnJlYWtkb3duLmFjY3VyYWN5KS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5hZ2dyZWdhdGlvbnMhLmNhdGVnb3J5QnJlYWtkb3duLnBlcmZvcm1hbmNlKS50b0JlKDEpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndXBkYXRlRmVlZGJhY2tTdGF0dXMnLCAoKSA9PiB7XG4gICAgbGV0IGZlZWRiYWNrSWQ6IHN0cmluZztcblxuICAgIGJlZm9yZUVhY2goYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnN1Ym1pdEZlZWRiYWNrKHtcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIGZlZWRiYWNrVHlwZTogJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyBhcyBGZWVkYmFja1R5cGUsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjdXJhY3knIGFzIEZlZWRiYWNrQ2F0ZWdvcnksXG4gICAgICAgIHRpdGxlOiAnVGVzdCBmZWVkYmFjaycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBkZXNjcmlwdGlvbicsXG4gICAgICAgIHJhdGluZzogNFxuICAgICAgfSk7XG4gICAgICBmZWVkYmFja0lkID0gcmVzdWx0LmZlZWRiYWNrIS5pZDtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc3VjY2Vzc2Z1bGx5IHVwZGF0ZSBmZWVkYmFjayBzdGF0dXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLnVwZGF0ZUZlZWRiYWNrU3RhdHVzKFxuICAgICAgICBmZWVkYmFja0lkLFxuICAgICAgICAncmVzb2x2ZWQnLFxuICAgICAgICAnYWRtaW4xMjMnLFxuICAgICAgICAnSXNzdWUgaGFzIGJlZW4gYWRkcmVzc2VkJ1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG5cbiAgICAgIGNvbnN0IGZlZWRiYWNrID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLmdldEZlZWRiYWNrKGZlZWRiYWNrSWQpO1xuICAgICAgZXhwZWN0KGZlZWRiYWNrIS5zdGF0dXMpLnRvQmUoJ3Jlc29sdmVkJyk7XG4gICAgICBleHBlY3QoZmVlZGJhY2shLnJlc29sdmVkQnkpLnRvQmUoJ2FkbWluMTIzJyk7XG4gICAgICBleHBlY3QoZmVlZGJhY2shLnJlc29sdXRpb24pLnRvQmUoJ0lzc3VlIGhhcyBiZWVuIGFkZHJlc3NlZCcpO1xuICAgICAgZXhwZWN0KGZlZWRiYWNrIS5yZXNvbHZlZEF0KS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZmFsc2UgZm9yIG5vbi1leGlzdGVudCBmZWVkYmFjaycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UudXBkYXRlRmVlZGJhY2tTdGF0dXMoXG4gICAgICAgICdub24tZXhpc3RlbnQtaWQnLFxuICAgICAgICAncmVzb2x2ZWQnXG4gICAgICApO1xuXG4gICAgICBleHBlY3Qoc3VjY2VzcykudG9CZShmYWxzZSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXRGZWVkYmFja1N1bW1hcnknLCAoKSA9PiB7XG4gICAgYmVmb3JlRWFjaChhc3luYyAoKSA9PiB7XG4gICAgICAvLyBBZGQgdGVzdCBmZWVkYmFjayB3aXRoIGRpZmZlcmVudCBjaGFyYWN0ZXJpc3RpY3NcbiAgICAgIGNvbnN0IGZlZWRiYWNrRGF0YSA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHVzZXJJZDogJ3VzZXIxJyxcbiAgICAgICAgICBmZWVkYmFja1R5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScgYXMgRmVlZGJhY2tUeXBlLFxuICAgICAgICAgIGNhdGVnb3J5OiAnYWNjdXJhY3knIGFzIEZlZWRiYWNrQ2F0ZWdvcnksXG4gICAgICAgICAgdGl0bGU6ICdFeGNlbGxlbnQgYW5hbHlzaXMnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmVyeSBnb29kIGludmVzdG1lbnQgcmVjb21tZW5kYXRpb25zLicsXG4gICAgICAgICAgcmF0aW5nOiA1XG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB1c2VySWQ6ICd1c2VyMicsXG4gICAgICAgICAgZmVlZGJhY2tUeXBlOiAnc3lzdGVtLXBlcmZvcm1hbmNlJyBhcyBGZWVkYmFja1R5cGUsXG4gICAgICAgICAgY2F0ZWdvcnk6ICdwZXJmb3JtYW5jZScgYXMgRmVlZGJhY2tDYXRlZ29yeSxcbiAgICAgICAgICB0aXRsZTogJ1Nsb3cgc3lzdGVtJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1N5c3RlbSBpcyB0b28gc2xvdy4nLFxuICAgICAgICAgIHJhdGluZzogMlxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdXNlcklkOiAndXNlcjMnLFxuICAgICAgICAgIGZlZWRiYWNrVHlwZTogJ3VzZXItZXhwZXJpZW5jZScgYXMgRmVlZGJhY2tUeXBlLFxuICAgICAgICAgIGNhdGVnb3J5OiAndXNhYmlsaXR5JyBhcyBGZWVkYmFja0NhdGVnb3J5LFxuICAgICAgICAgIHRpdGxlOiAnR29vZCBpbnRlcmZhY2UnLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW50ZXJmYWNlIGlzIHVzZXItZnJpZW5kbHkuJyxcbiAgICAgICAgICByYXRpbmc6IDRcbiAgICAgICAgfVxuICAgICAgXTtcblxuICAgICAgZm9yIChjb25zdCBkYXRhIG9mIGZlZWRiYWNrRGF0YSkge1xuICAgICAgICBhd2FpdCBmZWVkYmFja1NlcnZpY2Uuc3VibWl0RmVlZGJhY2soZGF0YSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGNvbXByZWhlbnNpdmUgZmVlZGJhY2sgc3VtbWFyeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKERhdGUubm93KCkgLSAyNCAqIDYwICogNjAgKiAxMDAwKTsgLy8gMSBkYXkgYWdvXG4gICAgICBjb25zdCBlbmREYXRlID0gbmV3IERhdGUoKTtcblxuICAgICAgY29uc3Qgc3VtbWFyeSA9IGF3YWl0IGZlZWRiYWNrU2VydmljZS5nZXRGZWVkYmFja1N1bW1hcnkoc3RhcnREYXRlLCBlbmREYXRlKTtcblxuICAgICAgZXhwZWN0KHN1bW1hcnkudG90YWxDb3VudCkudG9CZSgzKTtcbiAgICAgIGV4cGVjdChzdW1tYXJ5LmF2ZXJhZ2VSYXRpbmcpLnRvQmVDbG9zZVRvKDMuNjcsIDEpOyAvLyAoNSArIDIgKyA0KSAvIDNcbiAgICAgIFxuICAgICAgZXhwZWN0KHN1bW1hcnkucmF0aW5nRGlzdHJpYnV0aW9uWzVdKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHN1bW1hcnkucmF0aW5nRGlzdHJpYnV0aW9uWzRdKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHN1bW1hcnkucmF0aW5nRGlzdHJpYnV0aW9uWzJdKS50b0JlKDEpO1xuICAgICAgXG4gICAgICBleHBlY3Qoc3VtbWFyeS5jYXRlZ29yeUJyZWFrZG93bi5hY2N1cmFjeSkudG9CZSgxKTtcbiAgICAgIGV4cGVjdChzdW1tYXJ5LmNhdGVnb3J5QnJlYWtkb3duLnBlcmZvcm1hbmNlKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHN1bW1hcnkuY2F0ZWdvcnlCcmVha2Rvd24udXNhYmlsaXR5KS50b0JlKDEpO1xuICAgICAgXG4gICAgICBleHBlY3Qoc3VtbWFyeS50eXBlQnJlYWtkb3duWydpbnZlc3RtZW50LWlkZWEtcXVhbGl0eSddKS50b0JlKDEpO1xuICAgICAgZXhwZWN0KHN1bW1hcnkudHlwZUJyZWFrZG93blsnc3lzdGVtLXBlcmZvcm1hbmNlJ10pLnRvQmUoMSk7XG4gICAgICBleHBlY3Qoc3VtbWFyeS50eXBlQnJlYWtkb3duWyd1c2VyLWV4cGVyaWVuY2UnXSkudG9CZSgxKTtcbiAgICAgIFxuICAgICAgZXhwZWN0KHN1bW1hcnkuc2VudGltZW50QnJlYWtkb3duLnBvc2l0aXZlKS50b0JlKDIpO1xuICAgICAgZXhwZWN0KHN1bW1hcnkuc2VudGltZW50QnJlYWtkb3duLm5lZ2F0aXZlKS50b0JlKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBmaWx0ZXIgc3VtbWFyeSBieSBkYXRlIHJhbmdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZnV0dXJlRGF0ZSA9IG5ldyBEYXRlKERhdGUubm93KCkgKyAyNCAqIDYwICogNjAgKiAxMDAwKTtcbiAgICAgIGNvbnN0IHN1bW1hcnkgPSBhd2FpdCBmZWVkYmFja1NlcnZpY2UuZ2V0RmVlZGJhY2tTdW1tYXJ5KGZ1dHVyZURhdGUsIGZ1dHVyZURhdGUpO1xuXG4gICAgICBleHBlY3Qoc3VtbWFyeS50b3RhbENvdW50KS50b0JlKDApO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2VuZXJhdGVGZWVkYmFja0FuYWx5dGljcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKGFzeW5jICgpID0+IHtcbiAgICAgIC8vIEFkZCBmZWVkYmFjayB3aXRoIGRpZmZlcmVudCByYXRpbmdzIGFuZCB0eXBlc1xuICAgICAgY29uc3QgZmVlZGJhY2tEYXRhID0gW1xuICAgICAgICB7IHJhdGluZzogMSwgZmVlZGJhY2tUeXBlOiAnYnVnLXJlcG9ydCcgYXMgRmVlZGJhY2tUeXBlLCBjYXRlZ29yeTogJ3BlcmZvcm1hbmNlJyBhcyBGZWVkYmFja0NhdGVnb3J5IH0sXG4gICAgICAgIHsgcmF0aW5nOiAyLCBmZWVkYmFja1R5cGU6ICdidWctcmVwb3J0JyBhcyBGZWVkYmFja1R5cGUsIGNhdGVnb3J5OiAncGVyZm9ybWFuY2UnIGFzIEZlZWRiYWNrQ2F0ZWdvcnkgfSxcbiAgICAgICAgeyByYXRpbmc6IDUsIGZlZWRiYWNrVHlwZTogJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyBhcyBGZWVkYmFja1R5cGUsIGNhdGVnb3J5OiAnYWNjdXJhY3knIGFzIEZlZWRiYWNrQ2F0ZWdvcnkgfSxcbiAgICAgICAgeyByYXRpbmc6IDQsIGZlZWRiYWNrVHlwZTogJ3VzZXItZXhwZXJpZW5jZScgYXMgRmVlZGJhY2tUeXBlLCBjYXRlZ29yeTogJ3VzYWJpbGl0eScgYXMgRmVlZGJhY2tDYXRlZ29yeSB9XG4gICAgICBdO1xuXG4gICAgICBmb3IgKGNvbnN0IGRhdGEgb2YgZmVlZGJhY2tEYXRhKSB7XG4gICAgICAgIGF3YWl0IGZlZWRiYWNrU2VydmljZS5zdWJtaXRGZWVkYmFjayh7XG4gICAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgICAgdGl0bGU6ICdUZXN0IGZlZWRiYWNrJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3QgZGVzY3JpcHRpb24nLFxuICAgICAgICAgIC4uLmRhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGFuYWx5dGljcyB3aXRoIHRyZW5kcyBhbmQgaW5zaWdodHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB0aW1lUmFuZ2UgPSB7XG4gICAgICAgIHN0YXJ0OiBuZXcgRGF0ZShEYXRlLm5vdygpIC0gMjQgKiA2MCAqIDYwICogMTAwMCksXG4gICAgICAgIGVuZDogbmV3IERhdGUoKVxuICAgICAgfTtcblxuICAgICAgY29uc3QgYW5hbHl0aWNzID0gYXdhaXQgZmVlZGJhY2tTZXJ2aWNlLmdlbmVyYXRlRmVlZGJhY2tBbmFseXRpY3ModGltZVJhbmdlKTtcblxuICAgICAgZXhwZWN0KGFuYWx5dGljcy50cmVuZHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoYW5hbHl0aWNzLmluc2lnaHRzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGFuYWx5dGljcy5yZWNvbW1lbmRhdGlvbnMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoYW5hbHl0aWNzLmNvcnJlbGF0aW9ucykudG9CZURlZmluZWQoKTtcblxuICAgICAgLy8gQ2hlY2sgZm9yIGxvdyByYXRpbmcgaW5zaWdodFxuICAgICAgY29uc3QgbG93UmF0aW5nSW5zaWdodCA9IGFuYWx5dGljcy5pbnNpZ2h0cy5maW5kKFxuICAgICAgICBpbnNpZ2h0ID0+IGluc2lnaHQudHlwZSA9PT0gJ2lzc3VlJyAmJiBpbnNpZ2h0LnRpdGxlLmluY2x1ZGVzKCdMb3cgUmF0aW5ncycpXG4gICAgICApO1xuICAgICAgZXhwZWN0KGxvd1JhdGluZ0luc2lnaHQpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIC8vIENoZWNrIGZvciBidWcgcmVwb3J0IHJlY29tbWVuZGF0aW9uXG4gICAgICBjb25zdCBidWdSZWNvbW1lbmRhdGlvbiA9IGFuYWx5dGljcy5yZWNvbW1lbmRhdGlvbnMuZmluZChcbiAgICAgICAgcmVjID0+IHJlYy5jYXRlZ29yeSA9PT0gJ2J1Zy1maXhlcydcbiAgICAgICk7XG4gICAgICBleHBlY3QoYnVnUmVjb21tZW5kYXRpb24pLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbmRlc2NyaWJlKCdGZWVkYmFjayBNb2RlbCBGdW5jdGlvbnMnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCd2YWxpZGF0ZUZlZWRiYWNrJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgY29ycmVjdCBmZWVkYmFjayBkYXRhJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmVlZGJhY2sgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjdXJhY3knLFxuICAgICAgICB0aXRsZTogJ0dvb2QgYW5hbHlzaXMnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1RoZSBhbmFseXNpcyB3YXMgdmVyeSBoZWxwZnVsLicsXG4gICAgICAgIHJhdGluZzogNCxcbiAgICAgICAgdGFnczogWydoZWxwZnVsJywgJ2FjY3VyYXRlJ11cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRmVlZGJhY2soZmVlZGJhY2spO1xuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBmZWVkYmFjayB3aXRoIG1pc3NpbmcgcmVxdWlyZWQgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmVlZGJhY2sgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnXG4gICAgICAgIC8vIE1pc3Npbmcgb3RoZXIgcmVxdWlyZWQgZmllbGRzXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZlZWRiYWNrKGZlZWRiYWNrKTtcbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBmZWVkYmFjayB3aXRoIGludmFsaWQgcmF0aW5nJywgKCkgPT4ge1xuICAgICAgY29uc3QgZmVlZGJhY2sgPSB7XG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjdXJhY3knLFxuICAgICAgICB0aXRsZTogJ1Rlc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1Rlc3QgZGVzY3JpcHRpb24nLFxuICAgICAgICByYXRpbmc6IDYgLy8gSW52YWxpZFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGZWVkYmFjayhmZWVkYmFjayk7XG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW4oJ1JhdGluZyBtdXN0IGJlIGFuIGludGVnZXIgYmV0d2VlbiAxIGFuZCA1Jyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlamVjdCBmZWVkYmFjayB3aXRoIGludmFsaWQgZmVlZGJhY2sgdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGZlZWRiYWNrID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgZmVlZGJhY2tUeXBlOiAnaW52YWxpZC10eXBlJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgICAgIHRpdGxlOiAnVGVzdCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnVGVzdCBkZXNjcmlwdGlvbicsXG4gICAgICAgIHJhdGluZzogNFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGZWVkYmFjayhmZWVkYmFjayk7XG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW4oJ0ludmFsaWQgZmVlZGJhY2sgdHlwZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZWplY3QgZmVlZGJhY2sgd2l0aCB0b28gbG9uZyB0aXRsZSBvciBkZXNjcmlwdGlvbicsICgpID0+IHtcbiAgICAgIGNvbnN0IGZlZWRiYWNrID0ge1xuICAgICAgICB1c2VySWQ6ICd1c2VyMTIzJyxcbiAgICAgICAgZmVlZGJhY2tUeXBlOiAnaW52ZXN0bWVudC1pZGVhLXF1YWxpdHknLFxuICAgICAgICBjYXRlZ29yeTogJ2FjY3VyYWN5JyxcbiAgICAgICAgdGl0bGU6ICdhJy5yZXBlYXQoMjAxKSwgLy8gVG9vIGxvbmdcbiAgICAgICAgZGVzY3JpcHRpb246ICdiJy5yZXBlYXQoMjAwMSksIC8vIFRvbyBsb25nXG4gICAgICAgIHJhdGluZzogNFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGZWVkYmFjayhmZWVkYmFjayk7XG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW4oJ1RpdGxlIG11c3QgYmUgMjAwIGNoYXJhY3RlcnMgb3IgbGVzcycpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbignRGVzY3JpcHRpb24gbXVzdCBiZSAyMDAwIGNoYXJhY3RlcnMgb3IgbGVzcycpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY3JlYXRlRmVlZGJhY2tJZCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSB1bmlxdWUgZmVlZGJhY2sgSURzJywgKCkgPT4ge1xuICAgICAgY29uc3QgaWQxID0gY3JlYXRlRmVlZGJhY2tJZCgpO1xuICAgICAgY29uc3QgaWQyID0gY3JlYXRlRmVlZGJhY2tJZCgpO1xuXG4gICAgICBleHBlY3QoaWQxKS50b01hdGNoKC9eZmVlZGJhY2tfXFxkK19bYS16MC05XXs5fSQvKTtcbiAgICAgIGV4cGVjdChpZDIpLnRvTWF0Y2goL15mZWVkYmFja19cXGQrX1thLXowLTldezl9JC8pO1xuICAgICAgZXhwZWN0KGlkMSkubm90LnRvQmUoaWQyKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2RldGVybWluZUZlZWRiYWNrU2VudGltZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgZGV0ZXJtaW5lIHBvc2l0aXZlIHNlbnRpbWVudCBmb3IgaGlnaCByYXRpbmdzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VudGltZW50ID0gZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQoNSwgJ0dyZWF0IHNlcnZpY2UhJyk7XG4gICAgICBleHBlY3Qoc2VudGltZW50KS50b0JlKCdwb3NpdGl2ZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBkZXRlcm1pbmUgbmVnYXRpdmUgc2VudGltZW50IGZvciBsb3cgcmF0aW5ncycsICgpID0+IHtcbiAgICAgIGNvbnN0IHNlbnRpbWVudCA9IGRldGVybWluZUZlZWRiYWNrU2VudGltZW50KDEsICdUZXJyaWJsZSBleHBlcmllbmNlJyk7XG4gICAgICBleHBlY3Qoc2VudGltZW50KS50b0JlKCduZWdhdGl2ZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbmFseXplIGRlc2NyaXB0aW9uIGZvciBuZXV0cmFsIHJhdGluZ3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwb3NpdGl2ZVNlbnRpbWVudCA9IGRldGVybWluZUZlZWRiYWNrU2VudGltZW50KDMsICdHb29kIGFuYWx5c2lzIGFuZCBoZWxwZnVsIGluc2lnaHRzJyk7XG4gICAgICBleHBlY3QocG9zaXRpdmVTZW50aW1lbnQpLnRvQmUoJ3Bvc2l0aXZlJyk7XG5cbiAgICAgIGNvbnN0IG5lZ2F0aXZlU2VudGltZW50ID0gZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQoMywgJ1Bvb3IgcGVyZm9ybWFuY2UgYW5kIGNvbmZ1c2luZyBpbnRlcmZhY2UnKTtcbiAgICAgIGV4cGVjdChuZWdhdGl2ZVNlbnRpbWVudCkudG9CZSgnbmVnYXRpdmUnKTtcblxuICAgICAgY29uc3QgbmV1dHJhbFNlbnRpbWVudCA9IGRldGVybWluZUZlZWRiYWNrU2VudGltZW50KDMsICdBdmVyYWdlIGV4cGVyaWVuY2Ugb3ZlcmFsbCcpO1xuICAgICAgZXhwZWN0KG5ldXRyYWxTZW50aW1lbnQpLnRvQmUoJ25ldXRyYWwnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBhc3NpZ24gaGlnaCBwcmlvcml0eSB0byBjcml0aWNhbCBmZWVkYmFjaycsICgpID0+IHtcbiAgICAgIGNvbnN0IGZlZWRiYWNrOiBGZWVkYmFjayA9IHtcbiAgICAgICAgaWQ6ICd0ZXN0JyxcbiAgICAgICAgdXNlcklkOiAndXNlcjEyMycsXG4gICAgICAgIGZlZWRiYWNrVHlwZTogJ2J1Zy1yZXBvcnQnLFxuICAgICAgICByYXRpbmc6IDEsXG4gICAgICAgIGNhdGVnb3J5OiAnY29tcGxpYW5jZScsXG4gICAgICAgIHRpdGxlOiAnQ3JpdGljYWwgYnVnJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTeXN0ZW0gaXMgYnJva2VuJyxcbiAgICAgICAgdGFnczogW10sXG4gICAgICAgIHNlbnRpbWVudDogJ25lZ2F0aXZlJyxcbiAgICAgICAgcHJpb3JpdHk6ICdtZWRpdW0nLCAvLyBXaWxsIGJlIHJlY2FsY3VsYXRlZFxuICAgICAgICBzdGF0dXM6ICdzdWJtaXR0ZWQnLFxuICAgICAgICBtZXRhZGF0YTogeyBzb3VyY2U6ICd3ZWInIH0sXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZSgpXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBwcmlvcml0eSA9IGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHkoZmVlZGJhY2spO1xuICAgICAgZXhwZWN0KHByaW9yaXR5KS50b0JlKCdoaWdoJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGFzc2lnbiBsb3cgcHJpb3JpdHkgdG8gcG9zaXRpdmUgZmVlZGJhY2snLCAoKSA9PiB7XG4gICAgICBjb25zdCBmZWVkYmFjazogRmVlZGJhY2sgPSB7XG4gICAgICAgIGlkOiAndGVzdCcsXG4gICAgICAgIHVzZXJJZDogJ3VzZXIxMjMnLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdnZW5lcmFsJyxcbiAgICAgICAgcmF0aW5nOiA1LFxuICAgICAgICBjYXRlZ29yeTogJ290aGVyJyxcbiAgICAgICAgdGl0bGU6ICdHcmVhdCBqb2InLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0V2ZXJ5dGhpbmcgd29ya3Mgd2VsbCcsXG4gICAgICAgIHRhZ3M6IFtdLFxuICAgICAgICBzZW50aW1lbnQ6ICdwb3NpdGl2ZScsXG4gICAgICAgIHByaW9yaXR5OiAnbWVkaXVtJywgLy8gV2lsbCBiZSByZWNhbGN1bGF0ZWRcbiAgICAgICAgc3RhdHVzOiAnc3VibWl0dGVkJyxcbiAgICAgICAgbWV0YWRhdGE6IHsgc291cmNlOiAnd2ViJyB9LFxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKVxuICAgICAgfTtcblxuICAgICAgY29uc3QgcHJpb3JpdHkgPSBjYWxjdWxhdGVGZWVkYmFja1ByaW9yaXR5KGZlZWRiYWNrKTtcbiAgICAgIGV4cGVjdChwcmlvcml0eSkudG9CZSgnbG93Jyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19