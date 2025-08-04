"use strict";
/**
 * Tests for Feedback model and related types
 */
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_1 = require("../feedback");
describe('Feedback Model', () => {
    const mockFeedback = {
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
            const result = (0, feedback_1.validateFeedback)(mockFeedback);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should return errors for missing required fields', () => {
            const invalidFeedback = { ...mockFeedback };
            delete invalidFeedback.userId;
            const result = (0, feedback_1.validateFeedback)(invalidFeedback);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('User ID is required');
        });
        it('should return error for invalid rating', () => {
            const invalidRatingFeedback = { ...mockFeedback, rating: 6 };
            const result = (0, feedback_1.validateFeedback)(invalidRatingFeedback);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Rating must be an integer between 1 and 5');
        });
        it('should return error for invalid feedback type', () => {
            const invalidTypeFeedback = { ...mockFeedback, feedbackType: 'invalid' };
            const result = (0, feedback_1.validateFeedback)(invalidTypeFeedback);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid feedback type');
        });
        it('should return error for invalid category', () => {
            const invalidCategoryFeedback = { ...mockFeedback, category: 'invalid' };
            const result = (0, feedback_1.validateFeedback)(invalidCategoryFeedback);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Invalid category');
        });
    });
    describe('createFeedbackId', () => {
        it('should generate unique feedback IDs', () => {
            const id1 = (0, feedback_1.createFeedbackId)();
            const id2 = (0, feedback_1.createFeedbackId)();
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^feedback_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^feedback_\d+_[a-z0-9]+$/);
        });
        it('should generate IDs with correct format', () => {
            const id = (0, feedback_1.createFeedbackId)();
            expect(id).toMatch(/^feedback_/);
        });
    });
    describe('determineFeedbackSentiment', () => {
        it('should return positive sentiment for high ratings', () => {
            const sentiment = (0, feedback_1.determineFeedbackSentiment)(5, 'Great analysis!');
            expect(sentiment).toBe('positive');
        });
        it('should return negative sentiment for low ratings', () => {
            const sentiment = (0, feedback_1.determineFeedbackSentiment)(1, 'Poor quality analysis');
            expect(sentiment).toBe('negative');
        });
        it('should analyze description for neutral ratings', () => {
            const positiveSentiment = (0, feedback_1.determineFeedbackSentiment)(3, 'This is good and helpful');
            expect(positiveSentiment).toBe('positive');
            const negativeSentiment = (0, feedback_1.determineFeedbackSentiment)(3, 'This is bad and confusing');
            expect(negativeSentiment).toBe('negative');
            const neutralSentiment = (0, feedback_1.determineFeedbackSentiment)(3, 'This is okay');
            expect(neutralSentiment).toBe('neutral');
        });
    });
    describe('calculateFeedbackPriority', () => {
        it('should calculate high priority for low ratings', () => {
            const highPriorityFeedback = {
                ...mockFeedback,
                rating: 1,
                feedbackType: 'bug-report',
                category: 'compliance',
                sentiment: 'negative'
            };
            const priority = (0, feedback_1.calculateFeedbackPriority)(highPriorityFeedback);
            expect(priority).toBe('high');
        });
        it('should calculate medium priority for moderate issues', () => {
            const mediumPriorityFeedback = {
                ...mockFeedback,
                rating: 3,
                feedbackType: 'system-performance',
                category: 'accuracy',
                sentiment: 'neutral'
            };
            const priority = (0, feedback_1.calculateFeedbackPriority)(mediumPriorityFeedback);
            expect(priority).toBe('high');
        });
        it('should calculate low priority for minor issues', () => {
            const lowPriorityFeedback = {
                ...mockFeedback,
                rating: 5,
                feedbackType: 'general',
                category: 'other',
                sentiment: 'positive'
            };
            const priority = (0, feedback_1.calculateFeedbackPriority)(lowPriorityFeedback);
            expect(priority).toBe('low');
        });
    });
    describe('Type definitions', () => {
        it('should support all feedback types', () => {
            const types = [
                'investment-idea-quality',
                'analysis-accuracy',
                'system-performance',
                'user-experience',
                'feature-request',
                'bug-report',
                'general'
            ];
            types.forEach(type => {
                const feedback = { feedbackType: type };
                expect(feedback.feedbackType).toBe(type);
            });
        });
        it('should support all feedback categories', () => {
            const categories = [
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
                const feedback = { category };
                expect(feedback.category).toBe(category);
            });
        });
        it('should support all feedback statuses', () => {
            const statuses = [
                'submitted',
                'under-review',
                'in-progress',
                'resolved',
                'dismissed',
                'archived'
            ];
            statuses.forEach(status => {
                const feedback = { status };
                expect(feedback.status).toBe(status);
            });
        });
    });
    describe('FeedbackSearchOptions interface', () => {
        it('should create valid search options', () => {
            const searchOptions = {
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
            const minimalOptions = {};
            expect(minimalOptions).toBeDefined();
        });
    });
    describe('FeedbackMetadata interface', () => {
        it('should create valid metadata', () => {
            const metadata = {
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
            const apiMetadata = { source: 'api' };
            const mobileMetadata = { source: 'mobile' };
            const systemMetadata = { source: 'system' };
            expect(apiMetadata.source).toBe('api');
            expect(mobileMetadata.source).toBe('mobile');
            expect(systemMetadata.source).toBe('system');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2sudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2RlbHMvX190ZXN0c19fL2ZlZWRiYWNrLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILDBDQWNxQjtBQUVyQixRQUFRLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO0lBQzlCLE1BQU0sWUFBWSxHQUFhO1FBQzdCLEVBQUUsRUFBRSxjQUFjO1FBQ2xCLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLGdCQUFnQixFQUFFLFVBQVU7UUFDNUIsWUFBWSxFQUFFLHlCQUF5QjtRQUN2QyxNQUFNLEVBQUUsQ0FBQztRQUNULFFBQVEsRUFBRSxVQUFVO1FBQ3BCLEtBQUssRUFBRSxlQUFlO1FBQ3RCLFdBQVcsRUFBRSxtREFBbUQ7UUFDaEUsSUFBSSxFQUFFLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQztRQUMxQixTQUFTLEVBQUUsVUFBVTtRQUNyQixRQUFRLEVBQUUsUUFBUTtRQUNsQixNQUFNLEVBQUUsV0FBVztRQUNuQixRQUFRLEVBQUU7WUFDUixNQUFNLEVBQUUsS0FBSztZQUNiLFNBQVMsRUFBRSxhQUFhO1lBQ3hCLFNBQVMsRUFBRSxnQkFBZ0I7U0FDNUI7UUFDRCxTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQ2pDLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7S0FDbEMsQ0FBQztJQUVGLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtZQUMvQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMs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QyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUU7WUFDMUMsTUFBTSxXQUFXLEdBQXFCLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ3hELE1BQU0sY0FBYyxHQUFxQixFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUM5RCxNQUFNLGNBQWMsR0FBcUIsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUM7WUFFOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDL0MsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUZXN0cyBmb3IgRmVlZGJhY2sgbW9kZWwgYW5kIHJlbGF0ZWQgdHlwZXNcbiAqL1xuXG5pbXBvcnQge1xuICBGZWVkYmFjayxcbiAgRmVlZGJhY2tUeXBlLFxuICBGZWVkYmFja0NhdGVnb3J5LFxuICBGZWVkYmFja1N0YXR1cyxcbiAgRmVlZGJhY2tNZXRhZGF0YSxcbiAgRmVlZGJhY2tTZWFyY2hPcHRpb25zLFxuICBGZWVkYmFja1NlYXJjaFJlc3VsdCxcbiAgRmVlZGJhY2tBbmFseXRpY3MsXG4gIEZlZWRiYWNrU3VtbWFyeSxcbiAgdmFsaWRhdGVGZWVkYmFjayxcbiAgY3JlYXRlRmVlZGJhY2tJZCxcbiAgZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQsXG4gIGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHlcbn0gZnJvbSAnLi4vZmVlZGJhY2snO1xuXG5kZXNjcmliZSgnRmVlZGJhY2sgTW9kZWwnLCAoKSA9PiB7XG4gIGNvbnN0IG1vY2tGZWVkYmFjazogRmVlZGJhY2sgPSB7XG4gICAgaWQ6ICdmZWVkYmFjay0xMjMnLFxuICAgIHVzZXJJZDogJ3VzZXItNDU2JyxcbiAgICBpbnZlc3RtZW50SWRlYUlkOiAnaWRlYS03ODknLFxuICAgIGZlZWRiYWNrVHlwZTogJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyxcbiAgICByYXRpbmc6IDQsXG4gICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgdGl0bGU6ICdHb29kIEFuYWx5c2lzJyxcbiAgICBkZXNjcmlwdGlvbjogJ0dvb2QgYW5hbHlzaXMsIGJ1dCBjb3VsZCB1c2UgbW9yZSByaXNrIGFzc2Vzc21lbnQnLFxuICAgIHRhZ3M6IFsnYW5hbHlzaXMnLCAncmlzayddLFxuICAgIHNlbnRpbWVudDogJ3Bvc2l0aXZlJyxcbiAgICBwcmlvcml0eTogJ21lZGl1bScsXG4gICAgc3RhdHVzOiAnc3VibWl0dGVkJyxcbiAgICBtZXRhZGF0YToge1xuICAgICAgc291cmNlOiAnd2ViJyxcbiAgICAgIHNlc3Npb25JZDogJ3Nlc3Npb24tMTIzJyxcbiAgICAgIHVzZXJBZ2VudDogJ01vemlsbGEvNS4wLi4uJ1xuICAgIH0sXG4gICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgnMjAyMy0wNi0wMScpLFxuICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoJzIwMjMtMDYtMDEnKVxuICB9O1xuXG4gIGRlc2NyaWJlKCdGZWVkYmFjayBpbnRlcmZhY2UnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjcmVhdGUgYSB2YWxpZCBmZWVkYmFjayBvYmplY3QnLCAoKSA9PiB7XG4gICAgICBleHBlY3QobW9ja0ZlZWRiYWNrKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG1vY2tGZWVkYmFjay5pZCkudG9CZSgnZmVlZGJhY2stMTIzJyk7XG4gICAgICBleHBlY3QobW9ja0ZlZWRiYWNrLnVzZXJJZCkudG9CZSgndXNlci00NTYnKTtcbiAgICAgIGV4cGVjdChtb2NrRmVlZGJhY2suZmVlZGJhY2tUeXBlKS50b0JlKCdpbnZlc3RtZW50LWlkZWEtcXVhbGl0eScpO1xuICAgICAgZXhwZWN0KG1vY2tGZWVkYmFjay5yYXRpbmcpLnRvQmUoNCk7XG4gICAgICBleHBlY3QobW9ja0ZlZWRiYWNrLmNhdGVnb3J5KS50b0JlKCdhY2N1cmFjeScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgndmFsaWRhdGVGZWVkYmFjaycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIGEgdmFsaWQgZmVlZGJhY2sgb2JqZWN0JywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGZWVkYmFjayhtb2NrRmVlZGJhY2spO1xuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0hhdmVMZW5ndGgoMCk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJldHVybiBlcnJvcnMgZm9yIG1pc3NpbmcgcmVxdWlyZWQgZmllbGRzJywgKCkgPT4ge1xuICAgICAgY29uc3QgaW52YWxpZEZlZWRiYWNrID0geyAuLi5tb2NrRmVlZGJhY2sgfTtcbiAgICAgIGRlbGV0ZSAoaW52YWxpZEZlZWRiYWNrIGFzIGFueSkudXNlcklkO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZlZWRiYWNrKGludmFsaWRGZWVkYmFjayk7XG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW4oJ1VzZXIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIGVycm9yIGZvciBpbnZhbGlkIHJhdGluZycsICgpID0+IHtcbiAgICAgIGNvbnN0IGludmFsaWRSYXRpbmdGZWVkYmFjayA9IHsgLi4ubW9ja0ZlZWRiYWNrLCByYXRpbmc6IDYgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IHZhbGlkYXRlRmVlZGJhY2soaW52YWxpZFJhdGluZ0ZlZWRiYWNrKTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC52YWxpZCkudG9CZShmYWxzZSk7XG4gICAgICBleHBlY3QocmVzdWx0LmVycm9ycykudG9Db250YWluKCdSYXRpbmcgbXVzdCBiZSBhbiBpbnRlZ2VyIGJldHdlZW4gMSBhbmQgNScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3IgZm9yIGludmFsaWQgZmVlZGJhY2sgdHlwZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGludmFsaWRUeXBlRmVlZGJhY2sgPSB7IC4uLm1vY2tGZWVkYmFjaywgZmVlZGJhY2tUeXBlOiAnaW52YWxpZCcgYXMgYW55IH07XG4gICAgICBjb25zdCByZXN1bHQgPSB2YWxpZGF0ZUZlZWRiYWNrKGludmFsaWRUeXBlRmVlZGJhY2spO1xuXG4gICAgICBleHBlY3QocmVzdWx0LnZhbGlkKS50b0JlKGZhbHNlKTtcbiAgICAgIGV4cGVjdChyZXN1bHQuZXJyb3JzKS50b0NvbnRhaW4oJ0ludmFsaWQgZmVlZGJhY2sgdHlwZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gZXJyb3IgZm9yIGludmFsaWQgY2F0ZWdvcnknLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbnZhbGlkQ2F0ZWdvcnlGZWVkYmFjayA9IHsgLi4ubW9ja0ZlZWRiYWNrLCBjYXRlZ29yeTogJ2ludmFsaWQnIGFzIGFueSB9O1xuICAgICAgY29uc3QgcmVzdWx0ID0gdmFsaWRhdGVGZWVkYmFjayhpbnZhbGlkQ2F0ZWdvcnlGZWVkYmFjayk7XG5cbiAgICAgIGV4cGVjdChyZXN1bHQudmFsaWQpLnRvQmUoZmFsc2UpO1xuICAgICAgZXhwZWN0KHJlc3VsdC5lcnJvcnMpLnRvQ29udGFpbignSW52YWxpZCBjYXRlZ29yeScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnY3JlYXRlRmVlZGJhY2tJZCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIHVuaXF1ZSBmZWVkYmFjayBJRHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBpZDEgPSBjcmVhdGVGZWVkYmFja0lkKCk7XG4gICAgICBjb25zdCBpZDIgPSBjcmVhdGVGZWVkYmFja0lkKCk7XG5cbiAgICAgIGV4cGVjdChpZDEpLm5vdC50b0JlKGlkMik7XG4gICAgICBleHBlY3QoaWQxKS50b01hdGNoKC9eZmVlZGJhY2tfXFxkK19bYS16MC05XSskLyk7XG4gICAgICBleHBlY3QoaWQyKS50b01hdGNoKC9eZmVlZGJhY2tfXFxkK19bYS16MC05XSskLyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIElEcyB3aXRoIGNvcnJlY3QgZm9ybWF0JywgKCkgPT4ge1xuICAgICAgY29uc3QgaWQgPSBjcmVhdGVGZWVkYmFja0lkKCk7XG4gICAgICBleHBlY3QoaWQpLnRvTWF0Y2goL15mZWVkYmFja18vKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2RldGVybWluZUZlZWRiYWNrU2VudGltZW50JywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgcmV0dXJuIHBvc2l0aXZlIHNlbnRpbWVudCBmb3IgaGlnaCByYXRpbmdzJywgKCkgPT4ge1xuICAgICAgY29uc3Qgc2VudGltZW50ID0gZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQoNSwgJ0dyZWF0IGFuYWx5c2lzIScpO1xuICAgICAgZXhwZWN0KHNlbnRpbWVudCkudG9CZSgncG9zaXRpdmUnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgcmV0dXJuIG5lZ2F0aXZlIHNlbnRpbWVudCBmb3IgbG93IHJhdGluZ3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzZW50aW1lbnQgPSBkZXRlcm1pbmVGZWVkYmFja1NlbnRpbWVudCgxLCAnUG9vciBxdWFsaXR5IGFuYWx5c2lzJyk7XG4gICAgICBleHBlY3Qoc2VudGltZW50KS50b0JlKCduZWdhdGl2ZScpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBhbmFseXplIGRlc2NyaXB0aW9uIGZvciBuZXV0cmFsIHJhdGluZ3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBwb3NpdGl2ZVNlbnRpbWVudCA9IGRldGVybWluZUZlZWRiYWNrU2VudGltZW50KDMsICdUaGlzIGlzIGdvb2QgYW5kIGhlbHBmdWwnKTtcbiAgICAgIGV4cGVjdChwb3NpdGl2ZVNlbnRpbWVudCkudG9CZSgncG9zaXRpdmUnKTtcblxuICAgICAgY29uc3QgbmVnYXRpdmVTZW50aW1lbnQgPSBkZXRlcm1pbmVGZWVkYmFja1NlbnRpbWVudCgzLCAnVGhpcyBpcyBiYWQgYW5kIGNvbmZ1c2luZycpO1xuICAgICAgZXhwZWN0KG5lZ2F0aXZlU2VudGltZW50KS50b0JlKCduZWdhdGl2ZScpO1xuXG4gICAgICBjb25zdCBuZXV0cmFsU2VudGltZW50ID0gZGV0ZXJtaW5lRmVlZGJhY2tTZW50aW1lbnQoMywgJ1RoaXMgaXMgb2theScpO1xuICAgICAgZXhwZWN0KG5ldXRyYWxTZW50aW1lbnQpLnRvQmUoJ25ldXRyYWwnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2NhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjYWxjdWxhdGUgaGlnaCBwcmlvcml0eSBmb3IgbG93IHJhdGluZ3MnLCAoKSA9PiB7XG4gICAgICBjb25zdCBoaWdoUHJpb3JpdHlGZWVkYmFjazogRmVlZGJhY2sgPSB7XG4gICAgICAgIC4uLm1vY2tGZWVkYmFjayxcbiAgICAgICAgcmF0aW5nOiAxLFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdidWctcmVwb3J0JyxcbiAgICAgICAgY2F0ZWdvcnk6ICdjb21wbGlhbmNlJyxcbiAgICAgICAgc2VudGltZW50OiAnbmVnYXRpdmUnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBwcmlvcml0eSA9IGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHkoaGlnaFByaW9yaXR5RmVlZGJhY2spO1xuICAgICAgZXhwZWN0KHByaW9yaXR5KS50b0JlKCdoaWdoJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGNhbGN1bGF0ZSBtZWRpdW0gcHJpb3JpdHkgZm9yIG1vZGVyYXRlIGlzc3VlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IG1lZGl1bVByaW9yaXR5RmVlZGJhY2s6IEZlZWRiYWNrID0ge1xuICAgICAgICAuLi5tb2NrRmVlZGJhY2ssXG4gICAgICAgIHJhdGluZzogMyxcbiAgICAgICAgZmVlZGJhY2tUeXBlOiAnc3lzdGVtLXBlcmZvcm1hbmNlJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdhY2N1cmFjeScsXG4gICAgICAgIHNlbnRpbWVudDogJ25ldXRyYWwnXG4gICAgICB9O1xuXG4gICAgICBjb25zdCBwcmlvcml0eSA9IGNhbGN1bGF0ZUZlZWRiYWNrUHJpb3JpdHkobWVkaXVtUHJpb3JpdHlGZWVkYmFjayk7XG4gICAgICBleHBlY3QocHJpb3JpdHkpLnRvQmUoJ2hpZ2gnKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FsY3VsYXRlIGxvdyBwcmlvcml0eSBmb3IgbWlub3IgaXNzdWVzJywgKCkgPT4ge1xuICAgICAgY29uc3QgbG93UHJpb3JpdHlGZWVkYmFjazogRmVlZGJhY2sgPSB7XG4gICAgICAgIC4uLm1vY2tGZWVkYmFjayxcbiAgICAgICAgcmF0aW5nOiA1LFxuICAgICAgICBmZWVkYmFja1R5cGU6ICdnZW5lcmFsJyxcbiAgICAgICAgY2F0ZWdvcnk6ICdvdGhlcicsXG4gICAgICAgIHNlbnRpbWVudDogJ3Bvc2l0aXZlJ1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcHJpb3JpdHkgPSBjYWxjdWxhdGVGZWVkYmFja1ByaW9yaXR5KGxvd1ByaW9yaXR5RmVlZGJhY2spO1xuICAgICAgZXhwZWN0KHByaW9yaXR5KS50b0JlKCdsb3cnKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1R5cGUgZGVmaW5pdGlvbnMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBzdXBwb3J0IGFsbCBmZWVkYmFjayB0eXBlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHR5cGVzOiBGZWVkYmFja1R5cGVbXSA9IFtcbiAgICAgICAgJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5JyxcbiAgICAgICAgJ2FuYWx5c2lzLWFjY3VyYWN5JyxcbiAgICAgICAgJ3N5c3RlbS1wZXJmb3JtYW5jZScsXG4gICAgICAgICd1c2VyLWV4cGVyaWVuY2UnLFxuICAgICAgICAnZmVhdHVyZS1yZXF1ZXN0JyxcbiAgICAgICAgJ2J1Zy1yZXBvcnQnLFxuICAgICAgICAnZ2VuZXJhbCdcbiAgICAgIF07XG5cbiAgICAgIHR5cGVzLmZvckVhY2godHlwZSA9PiB7XG4gICAgICAgIGNvbnN0IGZlZWRiYWNrOiBQYXJ0aWFsPEZlZWRiYWNrPiA9IHsgZmVlZGJhY2tUeXBlOiB0eXBlIH07XG4gICAgICAgIGV4cGVjdChmZWVkYmFjay5mZWVkYmFja1R5cGUpLnRvQmUodHlwZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc3VwcG9ydCBhbGwgZmVlZGJhY2sgY2F0ZWdvcmllcycsICgpID0+IHtcbiAgICAgIGNvbnN0IGNhdGVnb3JpZXM6IEZlZWRiYWNrQ2F0ZWdvcnlbXSA9IFtcbiAgICAgICAgJ2FjY3VyYWN5JyxcbiAgICAgICAgJ3JlbGV2YW5jZScsXG4gICAgICAgICdjb21wbGV0ZW5lc3MnLFxuICAgICAgICAndGltZWxpbmVzcycsXG4gICAgICAgICd1c2FiaWxpdHknLFxuICAgICAgICAncGVyZm9ybWFuY2UnLFxuICAgICAgICAnY29tcGxpYW5jZScsXG4gICAgICAgICdvdGhlcidcbiAgICAgIF07XG5cbiAgICAgIGNhdGVnb3JpZXMuZm9yRWFjaChjYXRlZ29yeSA9PiB7XG4gICAgICAgIGNvbnN0IGZlZWRiYWNrOiBQYXJ0aWFsPEZlZWRiYWNrPiA9IHsgY2F0ZWdvcnkgfTtcbiAgICAgICAgZXhwZWN0KGZlZWRiYWNrLmNhdGVnb3J5KS50b0JlKGNhdGVnb3J5KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzdXBwb3J0IGFsbCBmZWVkYmFjayBzdGF0dXNlcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXR1c2VzOiBGZWVkYmFja1N0YXR1c1tdID0gW1xuICAgICAgICAnc3VibWl0dGVkJyxcbiAgICAgICAgJ3VuZGVyLXJldmlldycsXG4gICAgICAgICdpbi1wcm9ncmVzcycsXG4gICAgICAgICdyZXNvbHZlZCcsXG4gICAgICAgICdkaXNtaXNzZWQnLFxuICAgICAgICAnYXJjaGl2ZWQnXG4gICAgICBdO1xuXG4gICAgICBzdGF0dXNlcy5mb3JFYWNoKHN0YXR1cyA9PiB7XG4gICAgICAgIGNvbnN0IGZlZWRiYWNrOiBQYXJ0aWFsPEZlZWRiYWNrPiA9IHsgc3RhdHVzIH07XG4gICAgICAgIGV4cGVjdChmZWVkYmFjay5zdGF0dXMpLnRvQmUoc3RhdHVzKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRmVlZGJhY2tTZWFyY2hPcHRpb25zIGludGVyZmFjZScsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGNyZWF0ZSB2YWxpZCBzZWFyY2ggb3B0aW9ucycsICgpID0+IHtcbiAgICAgIGNvbnN0IHNlYXJjaE9wdGlvbnM6IEZlZWRiYWNrU2VhcmNoT3B0aW9ucyA9IHtcbiAgICAgICAgcXVlcnk6ICdhbmFseXNpcyBxdWFsaXR5JyxcbiAgICAgICAgZmlsdGVyczoge1xuICAgICAgICAgIGZlZWRiYWNrVHlwZTogWydpbnZlc3RtZW50LWlkZWEtcXVhbGl0eSddLFxuICAgICAgICAgIGNhdGVnb3J5OiBbJ2FjY3VyYWN5J10sXG4gICAgICAgICAgcmF0aW5nOiB7IG1pbjogMywgbWF4OiA1IH1cbiAgICAgICAgfSxcbiAgICAgICAgc29ydEJ5OiAnY3JlYXRlZEF0JyxcbiAgICAgICAgc29ydE9yZGVyOiAnZGVzYycsXG4gICAgICAgIGxpbWl0OiA1MCxcbiAgICAgICAgb2Zmc2V0OiAwXG4gICAgICB9O1xuXG4gICAgICBleHBlY3Qoc2VhcmNoT3B0aW9ucy5xdWVyeSkudG9CZSgnYW5hbHlzaXMgcXVhbGl0eScpO1xuICAgICAgZXhwZWN0KHNlYXJjaE9wdGlvbnMuZmlsdGVycz8uZmVlZGJhY2tUeXBlKS50b0NvbnRhaW4oJ2ludmVzdG1lbnQtaWRlYS1xdWFsaXR5Jyk7XG4gICAgICBleHBlY3Qoc2VhcmNoT3B0aW9ucy5zb3J0QnkpLnRvQmUoJ2NyZWF0ZWRBdCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBzdXBwb3J0IG9wdGlvbmFsIGZpZWxkcycsICgpID0+IHtcbiAgICAgIGNvbnN0IG1pbmltYWxPcHRpb25zOiBGZWVkYmFja1NlYXJjaE9wdGlvbnMgPSB7fTtcbiAgICAgIGV4cGVjdChtaW5pbWFsT3B0aW9ucykudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0ZlZWRiYWNrTWV0YWRhdGEgaW50ZXJmYWNlJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY3JlYXRlIHZhbGlkIG1ldGFkYXRhJywgKCkgPT4ge1xuICAgICAgY29uc3QgbWV0YWRhdGE6IEZlZWRiYWNrTWV0YWRhdGEgPSB7XG4gICAgICAgIHNvdXJjZTogJ3dlYicsXG4gICAgICAgIHVzZXJBZ2VudDogJ01vemlsbGEvNS4wLi4uJyxcbiAgICAgICAgc2Vzc2lvbklkOiAnc2Vzc2lvbi0xMjMnLFxuICAgICAgICBjb250ZXh0RGF0YTogeyBwYWdlOiAnaW52ZXN0bWVudC1pZGVhcycgfVxuICAgICAgfTtcblxuICAgICAgZXhwZWN0KG1ldGFkYXRhLnNvdXJjZSkudG9CZSgnd2ViJyk7XG4gICAgICBleHBlY3QobWV0YWRhdGEudXNlckFnZW50KS50b0JlKCdNb3ppbGxhLzUuMC4uLicpO1xuICAgICAgZXhwZWN0KG1ldGFkYXRhLmNvbnRleHREYXRhPy5wYWdlKS50b0JlKCdpbnZlc3RtZW50LWlkZWFzJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHN1cHBvcnQgZGlmZmVyZW50IHNvdXJjZXMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBhcGlNZXRhZGF0YTogRmVlZGJhY2tNZXRhZGF0YSA9IHsgc291cmNlOiAnYXBpJyB9O1xuICAgICAgY29uc3QgbW9iaWxlTWV0YWRhdGE6IEZlZWRiYWNrTWV0YWRhdGEgPSB7IHNvdXJjZTogJ21vYmlsZScgfTtcbiAgICAgIGNvbnN0IHN5c3RlbU1ldGFkYXRhOiBGZWVkYmFja01ldGFkYXRhID0geyBzb3VyY2U6ICdzeXN0ZW0nIH07XG5cbiAgICAgIGV4cGVjdChhcGlNZXRhZGF0YS5zb3VyY2UpLnRvQmUoJ2FwaScpO1xuICAgICAgZXhwZWN0KG1vYmlsZU1ldGFkYXRhLnNvdXJjZSkudG9CZSgnbW9iaWxlJyk7XG4gICAgICBleHBlY3Qoc3lzdGVtTWV0YWRhdGEuc291cmNlKS50b0JlKCdzeXN0ZW0nKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=