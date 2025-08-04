"use strict";
/**
 * End-to-End Integration Tests
 * Tests complete user workflows from start to finish
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const integration_setup_1 = require("./integration-setup");
describe('End-to-End Integration Tests', () => {
    let server;
    let userToken;
    let userId;
    beforeAll(async () => {
        server = integration_setup_1.integrationTestUtils.createTestServer();
    });
    describe('Complete User Journey', () => {
        it('should complete full user registration to investment idea generation workflow', async () => {
            // Step 1: User Registration
            console.log('🔐 Testing user registration...');
            const registrationData = {
                email: 'e2e-test@example.com',
                password: 'SecurePassword123!',
                organizationId: 'e2e-test-org',
                role: 'analyst'
            };
            const registrationResponse = await (0, supertest_1.default)(server)
                .post('/api/auth/register')
                .send(registrationData)
                .expect(201);
            expect(registrationResponse.body).toHaveProperty('user');
            expect(registrationResponse.body).toHaveProperty('token');
            userToken = registrationResponse.body.token;
            userId = registrationResponse.body.user.id;
            // Step 2: User Profile Setup
            console.log('👤 Testing profile setup...');
            const profileData = {
                preferences: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate',
                    preferredSectors: ['technology', 'healthcare'],
                    preferredAssetClasses: ['stocks', 'etfs'],
                    excludedInvestments: ['tobacco', 'weapons']
                }
            };
            const profileResponse = await (0, supertest_1.default)(server)
                .put('/api/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(profileData)
                .expect(200);
            expect(profileResponse.body.success).toBe(true);
            expect(profileResponse.body.user.preferences.investmentHorizon).toBe('medium');
            // Step 3: Upload Proprietary Data
            console.log('📊 Testing proprietary data upload...');
            const proprietaryData = {
                name: 'E2E Test Market Analysis',
                description: 'End-to-end test proprietary data',
                type: 'financial',
                format: 'json',
                data: {
                    companies: [
                        {
                            symbol: 'NVDA',
                            name: 'NVIDIA Corporation',
                            sector: 'Technology',
                            marketCap: 1800000000000,
                            revenue: 60900000000,
                            peRatio: 65.2,
                            growthRate: 0.58
                        }
                    ],
                    marketTrends: [
                        {
                            trend: 'AI chip demand surge',
                            confidence: 0.95,
                            timeframe: '2024-2025',
                            impact: 'positive'
                        }
                    ]
                }
            };
            const uploadResponse = await (0, supertest_1.default)(server)
                .post('/api/proprietary-data/upload')
                .set('Authorization', `Bearer ${userToken}`)
                .send(proprietaryData)
                .expect(200);
            expect(uploadResponse.body.success).toBe(true);
            expect(uploadResponse.body).toHaveProperty('uploadId');
            // Step 4: Perform Web Search Research
            console.log('🔍 Testing web search functionality...');
            const searchRequest = {
                query: 'NVIDIA AI chip market analysis 2024',
                options: {
                    depth: 'comprehensive',
                    maxResults: 15,
                    timeframe: 'recent',
                    sources: ['financial-news', 'analyst-reports']
                }
            };
            const searchResponse = await (0, supertest_1.default)(server)
                .post('/api/web-search/search')
                .set('Authorization', `Bearer ${userToken}`)
                .send(searchRequest)
                .expect(200);
            expect(searchResponse.body).toHaveProperty('results');
            expect(Array.isArray(searchResponse.body.results)).toBe(true);
            expect(searchResponse.body.totalResults).toBeGreaterThan(0);
            // Step 5: Generate Investment Ideas
            console.log('💡 Testing investment idea generation...');
            const ideaRequest = {
                parameters: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate',
                    sectors: ['technology'],
                    assetClasses: ['stocks'],
                    minimumConfidence: 0.7,
                    maximumIdeas: 3
                },
                context: {
                    userPreferences: profileData.preferences,
                    proprietaryDataSources: [uploadResponse.body.uploadId],
                    researchContext: {
                        focusAreas: ['AI', 'semiconductors', 'data centers'],
                        timeHorizon: '12-18 months'
                    }
                }
            };
            const ideaResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/ideas/generate')
                .set('Authorization', `Bearer ${userToken}`)
                .send(ideaRequest)
                .expect(200);
            expect(ideaResponse.body).toHaveProperty('requestId');
            expect(ideaResponse.body).toHaveProperty('ideas');
            expect(Array.isArray(ideaResponse.body.ideas)).toBe(true);
            expect(ideaResponse.body.ideas.length).toBeGreaterThan(0);
            // Validate investment idea structure
            const firstIdea = ideaResponse.body.ideas[0];
            integration_setup_1.integrationTestUtils.validateInvestmentIdea(firstIdea);
            // Step 6: Retrieve Specific Investment Idea
            console.log('📋 Testing investment idea retrieval...');
            const ideaDetailResponse = await (0, supertest_1.default)(server)
                .get(`/api/v1/ideas/${firstIdea.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            integration_setup_1.integrationTestUtils.validateInvestmentIdea(ideaDetailResponse.body);
            expect(ideaDetailResponse.body.id).toBe(firstIdea.id);
            // Step 7: Submit Feedback
            console.log('📝 Testing feedback submission...');
            const feedbackData = {
                investmentIdeaId: firstIdea.id,
                rating: 5,
                category: 'accuracy',
                type: 'investment-idea-quality',
                comment: 'Excellent analysis with comprehensive data integration. The AI chip trend analysis was particularly insightful.',
                sentiment: 'positive',
                specificFeedback: {
                    strengths: ['thorough research', 'clear rationale', 'good risk assessment'],
                    improvements: ['more detailed timeline', 'additional exit strategies']
                }
            };
            const feedbackResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/feedback')
                .set('Authorization', `Bearer ${userToken}`)
                .send(feedbackData)
                .expect(201);
            expect(feedbackResponse.body.success).toBe(true);
            expect(feedbackResponse.body.feedback).toHaveProperty('id');
            expect(feedbackResponse.body.feedback.rating).toBe(5);
            // Step 8: Verify Complete Workflow
            console.log('✅ Verifying complete workflow...');
            // Check that all data is properly linked
            expect(ideaResponse.body.metadata).toHaveProperty('totalIdeasGenerated');
            expect(ideaResponse.body.processingMetrics).toHaveProperty('totalProcessingTime');
            expect(ideaResponse.body.processingMetrics.totalProcessingTime).toBeGreaterThan(0);
            // Verify idea quality
            expect(firstIdea.confidenceScore).toBeGreaterThanOrEqual(0.7);
            expect(firstIdea.supportingData.length).toBeGreaterThan(0);
            expect(firstIdea.complianceConsiderations).toBeDefined();
            console.log('🎉 Complete user journey test passed!');
        }, 120000); // 2 minute timeout for complete workflow
        it('should handle multiple concurrent user workflows', async () => {
            console.log('🔄 Testing concurrent user workflows...');
            const concurrentUsers = 3;
            const userWorkflows = [];
            for (let i = 0; i < concurrentUsers; i++) {
                const workflow = async () => {
                    // Register user
                    const registrationData = {
                        email: `concurrent-user-${i}@example.com`,
                        password: 'SecurePassword123!',
                        organizationId: `concurrent-org-${i}`,
                        role: 'analyst'
                    };
                    const regResponse = await (0, supertest_1.default)(server)
                        .post('/api/auth/register')
                        .send(registrationData)
                        .expect(201);
                    const token = regResponse.body.token;
                    // Generate investment idea
                    const ideaRequest = {
                        parameters: {
                            investmentHorizon: 'short',
                            riskTolerance: 'conservative',
                            sectors: ['healthcare'],
                            assetClasses: ['stocks'],
                            minimumConfidence: 0.6,
                            maximumIdeas: 2
                        }
                    };
                    const ideaResponse = await (0, supertest_1.default)(server)
                        .post('/api/v1/ideas/generate')
                        .set('Authorization', `Bearer ${token}`)
                        .send(ideaRequest)
                        .expect(200);
                    return {
                        userId: regResponse.body.user.id,
                        ideas: ideaResponse.body.ideas,
                        processingTime: ideaResponse.body.processingMetrics.totalProcessingTime
                    };
                };
                userWorkflows.push(workflow());
            }
            const results = await Promise.all(userWorkflows);
            // Verify all workflows completed successfully
            expect(results).toHaveLength(concurrentUsers);
            results.forEach((result, index) => {
                expect(result.userId).toBeDefined();
                expect(Array.isArray(result.ideas)).toBe(true);
                expect(result.ideas.length).toBeGreaterThan(0);
                expect(result.processingTime).toBeGreaterThan(0);
                console.log(`✅ User ${index + 1} workflow completed in ${result.processingTime}ms`);
            });
            console.log('🎉 Concurrent workflows test passed!');
        }, 180000); // 3 minute timeout for concurrent workflows
    });
    describe('Error Recovery Workflows', () => {
        it('should handle and recover from service failures gracefully', async () => {
            console.log('🛠️ Testing error recovery workflows...');
            // Create authenticated user
            const token = integration_setup_1.integrationTestUtils.generateTestToken();
            // Test 1: Invalid investment idea request
            const invalidRequest = {
                parameters: {
                    investmentHorizon: 'invalid-horizon',
                    riskTolerance: 'invalid-risk',
                    sectors: [],
                    minimumConfidence: 2.0 // Invalid confidence > 1
                }
            };
            const errorResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/ideas/generate')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidRequest)
                .expect(400);
            integration_setup_1.integrationTestUtils.validateErrorResponse(errorResponse.body);
            expect(errorResponse.body.message).toContain('validation');
            // Test 2: Recovery with valid request
            const validRequest = {
                parameters: {
                    investmentHorizon: 'medium',
                    riskTolerance: 'moderate',
                    sectors: ['technology'],
                    assetClasses: ['stocks'],
                    minimumConfidence: 0.7,
                    maximumIdeas: 2
                }
            };
            const successResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/ideas/generate')
                .set('Authorization', `Bearer ${token}`)
                .send(validRequest)
                .expect(200);
            expect(successResponse.body).toHaveProperty('ideas');
            expect(successResponse.body.ideas.length).toBeGreaterThan(0);
            console.log('✅ Error recovery test passed!');
        });
        it('should handle authentication failures and recovery', async () => {
            console.log('🔐 Testing authentication error recovery...');
            // Test 1: Request without authentication
            const unauthenticatedResponse = await (0, supertest_1.default)(server)
                .get('/api/profile')
                .expect(401);
            integration_setup_1.integrationTestUtils.validateErrorResponse(unauthenticatedResponse.body);
            // Test 2: Request with invalid token
            const invalidTokenResponse = await (0, supertest_1.default)(server)
                .get('/api/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            integration_setup_1.integrationTestUtils.validateErrorResponse(invalidTokenResponse.body);
            // Test 3: Recovery with valid authentication
            const validToken = integration_setup_1.integrationTestUtils.generateTestToken();
            const authenticatedResponse = await (0, supertest_1.default)(server)
                .get('/api/profile')
                .set('Authorization', `Bearer ${validToken}`)
                .expect(200);
            expect(authenticatedResponse.body).toHaveProperty('id');
            expect(authenticatedResponse.body).toHaveProperty('email');
            console.log('✅ Authentication recovery test passed!');
        });
    });
    describe('Performance and Load Testing', () => {
        it('should handle high-frequency requests within acceptable time limits', async () => {
            console.log('⚡ Testing performance under load...');
            const token = integration_setup_1.integrationTestUtils.generateTestToken();
            const requestCount = 10;
            const maxAcceptableTime = 5000; // 5 seconds for all requests
            const startTime = Date.now();
            // Create multiple concurrent requests
            const requests = Array(requestCount).fill(null).map((_, index) => (0, supertest_1.default)(server)
                .post('/api/web-search/search')
                .set('Authorization', `Bearer ${token}`)
                .send({
                query: `performance test query ${index}`,
                options: { depth: 'basic', maxResults: 5 }
            })
                .expect(200));
            const responses = await Promise.all(requests);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            // Verify performance
            expect(totalTime).toBeLessThan(maxAcceptableTime);
            expect(responses).toHaveLength(requestCount);
            responses.forEach((response, index) => {
                expect(response.body).toHaveProperty('results');
                expect(response.body.executionTime).toBeLessThan(2000); // Individual request < 2s
            });
            console.log(`✅ Performance test passed: ${requestCount} requests in ${totalTime}ms`);
        });
        it('should maintain data consistency under concurrent operations', async () => {
            console.log('🔄 Testing data consistency under concurrent operations...');
            const token = integration_setup_1.integrationTestUtils.generateTestToken();
            const concurrentOperations = 5;
            // Perform concurrent data uploads
            const uploadPromises = Array(concurrentOperations).fill(null).map((_, index) => (0, supertest_1.default)(server)
                .post('/api/proprietary-data/upload')
                .set('Authorization', `Bearer ${token}`)
                .send({
                name: `Concurrent Test Data ${index}`,
                description: `Test data for concurrency test ${index}`,
                type: 'financial',
                format: 'json',
                data: { testIndex: index, timestamp: Date.now() }
            })
                .expect(200));
            const uploadResults = await Promise.all(uploadPromises);
            // Verify all uploads succeeded and have unique IDs
            const uploadIds = uploadResults.map(result => result.body.uploadId);
            const uniqueIds = new Set(uploadIds);
            expect(uniqueIds.size).toBe(concurrentOperations);
            expect(uploadResults).toHaveLength(concurrentOperations);
            // Verify data sources list includes all uploads
            const sourcesResponse = await (0, supertest_1.default)(server)
                .get('/api/proprietary-data/sources')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            expect(sourcesResponse.body.totalCount).toBeGreaterThanOrEqual(concurrentOperations);
            console.log('✅ Data consistency test passed!');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kLXRvLWVuZC5pbnRlZ3JhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL19fdGVzdHNfXy9pbnRlZ3JhdGlvbi9lbmQtdG8tZW5kLmludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7QUFFSCwwREFBZ0M7QUFDaEMsMkRBQTJEO0FBRTNELFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSxHQUFHLEVBQUU7SUFDNUMsSUFBSSxNQUFXLENBQUM7SUFDaEIsSUFBSSxTQUFpQixDQUFDO0lBQ3RCLElBQUksTUFBYyxDQUFDO0lBRW5CLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLEdBQUcsd0NBQW9CLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNuRCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsRUFBRSxDQUFDLCtFQUErRSxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzdGLDRCQUE0QjtZQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxnQkFBZ0IsR0FBRztnQkFDdkIsS0FBSyxFQUFFLHNCQUFzQjtnQkFDN0IsUUFBUSxFQUFFLG9CQUFvQjtnQkFDOUIsY0FBYyxFQUFFLGNBQWM7Z0JBQzlCLElBQUksRUFBRSxTQUFTO2FBQ2hCLENBQUM7WUFFRixNQUFNLG9CQUFvQixHQUFHLE1BQU0sSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQztpQkFDL0MsSUFBSSxDQUFDLG9CQUFvQixDQUFDO2lCQUMxQixJQUFJLENBQUMsZ0JBQWdCLENBQUM7aUJBQ3RCLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVmLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFD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QUFHLE1BQU0sSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQztpQkFDMUMsR0FBRyxDQUFDLCtCQUErQixDQUFDO2lCQUNwQyxHQUFHLENBQUMsZUFBZSxFQUFFLFVBQVUsS0FBSyxFQUFFLENBQUM7aUJBQ3ZDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVmLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFFckYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRW5kLXRvLUVuZCBJbnRlZ3JhdGlvbiBUZXN0c1xuICogVGVzdHMgY29tcGxldGUgdXNlciB3b3JrZmxvd3MgZnJvbSBzdGFydCB0byBmaW5pc2hcbiAqL1xuXG5pbXBvcnQgcmVxdWVzdCBmcm9tICdzdXBlcnRlc3QnO1xuaW1wb3J0IHsgaW50ZWdyYXRpb25UZXN0VXRpbHMgfSBmcm9tICcuL2ludGVncmF0aW9uLXNldHVwJztcblxuZGVzY3JpYmUoJ0VuZC10by1FbmQgSW50ZWdyYXRpb24gVGVzdHMnLCAoKSA9PiB7XG4gIGxldCBzZXJ2ZXI6IGFueTtcbiAgbGV0IHVzZXJUb2tlbjogc3RyaW5nO1xuICBsZXQgdXNlcklkOiBzdHJpbmc7XG5cbiAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgICBzZXJ2ZXIgPSBpbnRlZ3JhdGlvblRlc3RVdGlscy5jcmVhdGVUZXN0U2VydmVyKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdDb21wbGV0ZSBVc2VyIEpvdXJuZXknLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBjb21wbGV0ZSBmdWxsIHVzZXIgcmVnaXN0cmF0aW9uIHRvIGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uIHdvcmtmbG93JywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gU3RlcCAxOiBVc2VyIFJlZ2lzdHJhdGlvblxuICAgICAgY29uc29sZS5sb2coJ/CflJAgVGVzdGluZyB1c2VyIHJlZ2lzdHJhdGlvbi4uLicpO1xuICAgICAgY29uc3QgcmVnaXN0cmF0aW9uRGF0YSA9IHtcbiAgICAgICAgZW1haWw6ICdlMmUtdGVzdEBleGFtcGxlLmNvbScsXG4gICAgICAgIHBhc3N3b3JkOiAnU2VjdXJlUGFzc3dvcmQxMjMhJyxcbiAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICdlMmUtdGVzdC1vcmcnLFxuICAgICAgICByb2xlOiAnYW5hbHlzdCdcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvblJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgIC5wb3N0KCcvYXBpL2F1dGgvcmVnaXN0ZXInKVxuICAgICAgICAuc2VuZChyZWdpc3RyYXRpb25EYXRhKVxuICAgICAgICAuZXhwZWN0KDIwMSk7XG5cbiAgICAgIGV4cGVjdChyZWdpc3RyYXRpb25SZXNwb25zZS5ib2R5KS50b0hhdmVQcm9wZXJ0eSgndXNlcicpO1xuICAgICAgZXhwZWN0KHJlZ2lzdHJhdGlvblJlc3BvbnNlLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCd0b2tlbicpO1xuICAgICAgdXNlclRva2VuID0gcmVnaXN0cmF0aW9uUmVzcG9uc2UuYm9keS50b2tlbjtcbiAgICAgIHVzZXJJZCA9IHJlZ2lzdHJhdGlvblJlc3BvbnNlLmJvZHkudXNlci5pZDtcblxuICAgICAgLy8gU3RlcCAyOiBVc2VyIFByb2ZpbGUgU2V0dXBcbiAgICAgIGNvbnNvbGUubG9nKCfwn5GkIFRlc3RpbmcgcHJvZmlsZSBzZXR1cC4uLicpO1xuICAgICAgY29uc3QgcHJvZmlsZURhdGEgPSB7XG4gICAgICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgcHJlZmVycmVkU2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnXSxcbiAgICAgICAgICBwcmVmZXJyZWRBc3NldENsYXNzZXM6IFsnc3RvY2tzJywgJ2V0ZnMnXSxcbiAgICAgICAgICBleGNsdWRlZEludmVzdG1lbnRzOiBbJ3RvYmFjY28nLCAnd2VhcG9ucyddXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHByb2ZpbGVSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAucHV0KCcvYXBpL3Byb2ZpbGUnKVxuICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3VzZXJUb2tlbn1gKVxuICAgICAgICAuc2VuZChwcm9maWxlRGF0YSlcbiAgICAgICAgLmV4cGVjdCgyMDApO1xuXG4gICAgICBleHBlY3QocHJvZmlsZVJlc3BvbnNlLmJvZHkuc3VjY2VzcykudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChwcm9maWxlUmVzcG9uc2UuYm9keS51c2VyLnByZWZlcmVuY2VzLmludmVzdG1lbnRIb3Jpem9uKS50b0JlKCdtZWRpdW0nKTtcblxuICAgICAgLy8gU3RlcCAzOiBVcGxvYWQgUHJvcHJpZXRhcnkgRGF0YVxuICAgICAgY29uc29sZS5sb2coJ/Cfk4ogVGVzdGluZyBwcm9wcmlldGFyeSBkYXRhIHVwbG9hZC4uLicpO1xuICAgICAgY29uc3QgcHJvcHJpZXRhcnlEYXRhID0ge1xuICAgICAgICBuYW1lOiAnRTJFIFRlc3QgTWFya2V0IEFuYWx5c2lzJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdFbmQtdG8tZW5kIHRlc3QgcHJvcHJpZXRhcnkgZGF0YScsXG4gICAgICAgIHR5cGU6ICdmaW5hbmNpYWwnLFxuICAgICAgICBmb3JtYXQ6ICdqc29uJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGNvbXBhbmllczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzeW1ib2w6ICdOVkRBJyxcbiAgICAgICAgICAgICAgbmFtZTogJ05WSURJQSBDb3Jwb3JhdGlvbicsXG4gICAgICAgICAgICAgIHNlY3RvcjogJ1RlY2hub2xvZ3knLFxuICAgICAgICAgICAgICBtYXJrZXRDYXA6IDE4MDAwMDAwMDAwMDAsXG4gICAgICAgICAgICAgIHJldmVudWU6IDYwOTAwMDAwMDAwLFxuICAgICAgICAgICAgICBwZVJhdGlvOiA2NS4yLFxuICAgICAgICAgICAgICBncm93dGhSYXRlOiAwLjU4XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICBtYXJrZXRUcmVuZHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHJlbmQ6ICdBSSBjaGlwIGRlbWFuZCBzdXJnZScsXG4gICAgICAgICAgICAgIGNvbmZpZGVuY2U6IDAuOTUsXG4gICAgICAgICAgICAgIHRpbWVmcmFtZTogJzIwMjQtMjAyNScsXG4gICAgICAgICAgICAgIGltcGFjdDogJ3Bvc2l0aXZlJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgdXBsb2FkUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgLnBvc3QoJy9hcGkvcHJvcHJpZXRhcnktZGF0YS91cGxvYWQnKVxuICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3VzZXJUb2tlbn1gKVxuICAgICAgICAuc2VuZChwcm9wcmlldGFyeURhdGEpXG4gICAgICAgIC5leHBlY3QoMjAwKTtcblxuICAgICAgZXhwZWN0KHVwbG9hZFJlc3BvbnNlLmJvZHkuc3VjY2VzcykudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdCh1cGxvYWRSZXNwb25zZS5ib2R5KS50b0hhdmVQcm9wZXJ0eSgndXBsb2FkSWQnKTtcblxuICAgICAgLy8gU3RlcCA0OiBQZXJmb3JtIFdlYiBTZWFyY2ggUmVzZWFyY2hcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SNIFRlc3Rpbmcgd2ViIHNlYXJjaCBmdW5jdGlvbmFsaXR5Li4uJyk7XG4gICAgICBjb25zdCBzZWFyY2hSZXF1ZXN0ID0ge1xuICAgICAgICBxdWVyeTogJ05WSURJQSBBSSBjaGlwIG1hcmtldCBhbmFseXNpcyAyMDI0JyxcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIGRlcHRoOiAnY29tcHJlaGVuc2l2ZScsXG4gICAgICAgICAgbWF4UmVzdWx0czogMTUsXG4gICAgICAgICAgdGltZWZyYW1lOiAncmVjZW50JyxcbiAgICAgICAgICBzb3VyY2VzOiBbJ2ZpbmFuY2lhbC1uZXdzJywgJ2FuYWx5c3QtcmVwb3J0cyddXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHNlYXJjaFJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgIC5wb3N0KCcvYXBpL3dlYi1zZWFyY2gvc2VhcmNoJylcbiAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt1c2VyVG9rZW59YClcbiAgICAgICAgLnNlbmQoc2VhcmNoUmVxdWVzdClcbiAgICAgICAgLmV4cGVjdCgyMDApO1xuXG4gICAgICBleHBlY3Qoc2VhcmNoUmVzcG9uc2UuYm9keSkudG9IYXZlUHJvcGVydHkoJ3Jlc3VsdHMnKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHNlYXJjaFJlc3BvbnNlLmJvZHkucmVzdWx0cykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3Qoc2VhcmNoUmVzcG9uc2UuYm9keS50b3RhbFJlc3VsdHMpLnRvQmVHcmVhdGVyVGhhbigwKTtcblxuICAgICAgLy8gU3RlcCA1OiBHZW5lcmF0ZSBJbnZlc3RtZW50IElkZWFzXG4gICAgICBjb25zb2xlLmxvZygn8J+SoSBUZXN0aW5nIGludmVzdG1lbnQgaWRlYSBnZW5lcmF0aW9uLi4uJyk7XG4gICAgICBjb25zdCBpZGVhUmVxdWVzdCA9IHtcbiAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnbWVkaXVtJyxcbiAgICAgICAgICByaXNrVG9sZXJhbmNlOiAnbW9kZXJhdGUnLFxuICAgICAgICAgIHNlY3RvcnM6IFsndGVjaG5vbG9neSddLFxuICAgICAgICAgIGFzc2V0Q2xhc3NlczogWydzdG9ja3MnXSxcbiAgICAgICAgICBtaW5pbXVtQ29uZmlkZW5jZTogMC43LFxuICAgICAgICAgIG1heGltdW1JZGVhczogM1xuICAgICAgICB9LFxuICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgdXNlclByZWZlcmVuY2VzOiBwcm9maWxlRGF0YS5wcmVmZXJlbmNlcyxcbiAgICAgICAgICBwcm9wcmlldGFyeURhdGFTb3VyY2VzOiBbdXBsb2FkUmVzcG9uc2UuYm9keS51cGxvYWRJZF0sXG4gICAgICAgICAgcmVzZWFyY2hDb250ZXh0OiB7XG4gICAgICAgICAgICBmb2N1c0FyZWFzOiBbJ0FJJywgJ3NlbWljb25kdWN0b3JzJywgJ2RhdGEgY2VudGVycyddLFxuICAgICAgICAgICAgdGltZUhvcml6b246ICcxMi0xOCBtb250aHMnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBpZGVhUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgLnBvc3QoJy9hcGkvdjEvaWRlYXMvZ2VuZXJhdGUnKVxuICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3VzZXJUb2tlbn1gKVxuICAgICAgICAuc2VuZChpZGVhUmVxdWVzdClcbiAgICAgICAgLmV4cGVjdCgyMDApO1xuXG4gICAgICBleHBlY3QoaWRlYVJlc3BvbnNlLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCdyZXF1ZXN0SWQnKTtcbiAgICAgIGV4cGVjdChpZGVhUmVzcG9uc2UuYm9keSkudG9IYXZlUHJvcGVydHkoJ2lkZWFzJyk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShpZGVhUmVzcG9uc2UuYm9keS5pZGVhcykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoaWRlYVJlc3BvbnNlLmJvZHkuaWRlYXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgIC8vIFZhbGlkYXRlIGludmVzdG1lbnQgaWRlYSBzdHJ1Y3R1cmVcbiAgICAgIGNvbnN0IGZpcnN0SWRlYSA9IGlkZWFSZXNwb25zZS5ib2R5LmlkZWFzWzBdO1xuICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVJbnZlc3RtZW50SWRlYShmaXJzdElkZWEpO1xuXG4gICAgICAvLyBTdGVwIDY6IFJldHJpZXZlIFNwZWNpZmljIEludmVzdG1lbnQgSWRlYVxuICAgICAgY29uc29sZS5sb2coJ/Cfk4sgVGVzdGluZyBpbnZlc3RtZW50IGlkZWEgcmV0cmlldmFsLi4uJyk7XG4gICAgICBjb25zdCBpZGVhRGV0YWlsUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgLmdldChgL2FwaS92MS9pZGVhcy8ke2ZpcnN0SWRlYS5pZH1gKVxuICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3VzZXJUb2tlbn1gKVxuICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlSW52ZXN0bWVudElkZWEoaWRlYURldGFpbFJlc3BvbnNlLmJvZHkpO1xuICAgICAgZXhwZWN0KGlkZWFEZXRhaWxSZXNwb25zZS5ib2R5LmlkKS50b0JlKGZpcnN0SWRlYS5pZCk7XG5cbiAgICAgIC8vIFN0ZXAgNzogU3VibWl0IEZlZWRiYWNrXG4gICAgICBjb25zb2xlLmxvZygn8J+TnSBUZXN0aW5nIGZlZWRiYWNrIHN1Ym1pc3Npb24uLi4nKTtcbiAgICAgIGNvbnN0IGZlZWRiYWNrRGF0YSA9IHtcbiAgICAgICAgaW52ZXN0bWVudElkZWFJZDogZmlyc3RJZGVhLmlkLFxuICAgICAgICByYXRpbmc6IDUsXG4gICAgICAgIGNhdGVnb3J5OiAnYWNjdXJhY3knLFxuICAgICAgICB0eXBlOiAnaW52ZXN0bWVudC1pZGVhLXF1YWxpdHknLFxuICAgICAgICBjb21tZW50OiAnRXhjZWxsZW50IGFuYWx5c2lzIHdpdGggY29tcHJlaGVuc2l2ZSBkYXRhIGludGVncmF0aW9uLiBUaGUgQUkgY2hpcCB0cmVuZCBhbmFseXNpcyB3YXMgcGFydGljdWxhcmx5IGluc2lnaHRmdWwuJyxcbiAgICAgICAgc2VudGltZW50OiAncG9zaXRpdmUnLFxuICAgICAgICBzcGVjaWZpY0ZlZWRiYWNrOiB7XG4gICAgICAgICAgc3RyZW5ndGhzOiBbJ3Rob3JvdWdoIHJlc2VhcmNoJywgJ2NsZWFyIHJhdGlvbmFsZScsICdnb29kIHJpc2sgYXNzZXNzbWVudCddLFxuICAgICAgICAgIGltcHJvdmVtZW50czogWydtb3JlIGRldGFpbGVkIHRpbWVsaW5lJywgJ2FkZGl0aW9uYWwgZXhpdCBzdHJhdGVnaWVzJ11cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgZmVlZGJhY2tSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAucG9zdCgnL2FwaS92MS9mZWVkYmFjaycpXG4gICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dXNlclRva2VufWApXG4gICAgICAgIC5zZW5kKGZlZWRiYWNrRGF0YSlcbiAgICAgICAgLmV4cGVjdCgyMDEpO1xuXG4gICAgICBleHBlY3QoZmVlZGJhY2tSZXNwb25zZS5ib2R5LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoZmVlZGJhY2tSZXNwb25zZS5ib2R5LmZlZWRiYWNrKS50b0hhdmVQcm9wZXJ0eSgnaWQnKTtcbiAgICAgIGV4cGVjdChmZWVkYmFja1Jlc3BvbnNlLmJvZHkuZmVlZGJhY2sucmF0aW5nKS50b0JlKDUpO1xuXG4gICAgICAvLyBTdGVwIDg6IFZlcmlmeSBDb21wbGV0ZSBXb3JrZmxvd1xuICAgICAgY29uc29sZS5sb2coJ+KchSBWZXJpZnlpbmcgY29tcGxldGUgd29ya2Zsb3cuLi4nKTtcbiAgICAgIFxuICAgICAgLy8gQ2hlY2sgdGhhdCBhbGwgZGF0YSBpcyBwcm9wZXJseSBsaW5rZWRcbiAgICAgIGV4cGVjdChpZGVhUmVzcG9uc2UuYm9keS5tZXRhZGF0YSkudG9IYXZlUHJvcGVydHkoJ3RvdGFsSWRlYXNHZW5lcmF0ZWQnKTtcbiAgICAgIGV4cGVjdChpZGVhUmVzcG9uc2UuYm9keS5wcm9jZXNzaW5nTWV0cmljcykudG9IYXZlUHJvcGVydHkoJ3RvdGFsUHJvY2Vzc2luZ1RpbWUnKTtcbiAgICAgIGV4cGVjdChpZGVhUmVzcG9uc2UuYm9keS5wcm9jZXNzaW5nTWV0cmljcy50b3RhbFByb2Nlc3NpbmdUaW1lKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgIC8vIFZlcmlmeSBpZGVhIHF1YWxpdHlcbiAgICAgIGV4cGVjdChmaXJzdElkZWEuY29uZmlkZW5jZVNjb3JlKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDAuNyk7XG4gICAgICBleHBlY3QoZmlyc3RJZGVhLnN1cHBvcnRpbmdEYXRhLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgZXhwZWN0KGZpcnN0SWRlYS5jb21wbGlhbmNlQ29uc2lkZXJhdGlvbnMpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfwn46JIENvbXBsZXRlIHVzZXIgam91cm5leSB0ZXN0IHBhc3NlZCEnKTtcbiAgICB9LCAxMjAwMDApOyAvLyAyIG1pbnV0ZSB0aW1lb3V0IGZvciBjb21wbGV0ZSB3b3JrZmxvd1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgbXVsdGlwbGUgY29uY3VycmVudCB1c2VyIHdvcmtmbG93cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCfwn5SEIFRlc3RpbmcgY29uY3VycmVudCB1c2VyIHdvcmtmbG93cy4uLicpO1xuXG4gICAgICBjb25zdCBjb25jdXJyZW50VXNlcnMgPSAzO1xuICAgICAgY29uc3QgdXNlcldvcmtmbG93cyA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbmN1cnJlbnRVc2VyczsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHdvcmtmbG93ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIC8vIFJlZ2lzdGVyIHVzZXJcbiAgICAgICAgICBjb25zdCByZWdpc3RyYXRpb25EYXRhID0ge1xuICAgICAgICAgICAgZW1haWw6IGBjb25jdXJyZW50LXVzZXItJHtpfUBleGFtcGxlLmNvbWAsXG4gICAgICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICAgICAgICBvcmdhbml6YXRpb25JZDogYGNvbmN1cnJlbnQtb3JnLSR7aX1gLFxuICAgICAgICAgICAgcm9sZTogJ2FuYWx5c3QnXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNvbnN0IHJlZ1Jlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgICAucG9zdCgnL2FwaS9hdXRoL3JlZ2lzdGVyJylcbiAgICAgICAgICAgIC5zZW5kKHJlZ2lzdHJhdGlvbkRhdGEpXG4gICAgICAgICAgICAuZXhwZWN0KDIwMSk7XG5cbiAgICAgICAgICBjb25zdCB0b2tlbiA9IHJlZ1Jlc3BvbnNlLmJvZHkudG9rZW47XG5cbiAgICAgICAgICAvLyBHZW5lcmF0ZSBpbnZlc3RtZW50IGlkZWFcbiAgICAgICAgICBjb25zdCBpZGVhUmVxdWVzdCA9IHtcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdzaG9ydCcsXG4gICAgICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdjb25zZXJ2YXRpdmUnLFxuICAgICAgICAgICAgICBzZWN0b3JzOiBbJ2hlYWx0aGNhcmUnXSxcbiAgICAgICAgICAgICAgYXNzZXRDbGFzc2VzOiBbJ3N0b2NrcyddLFxuICAgICAgICAgICAgICBtaW5pbXVtQ29uZmlkZW5jZTogMC42LFxuICAgICAgICAgICAgICBtYXhpbXVtSWRlYXM6IDJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgaWRlYVJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgICAucG9zdCgnL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScpXG4gICAgICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3Rva2VufWApXG4gICAgICAgICAgICAuc2VuZChpZGVhUmVxdWVzdClcbiAgICAgICAgICAgIC5leHBlY3QoMjAwKTtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB1c2VySWQ6IHJlZ1Jlc3BvbnNlLmJvZHkudXNlci5pZCxcbiAgICAgICAgICAgIGlkZWFzOiBpZGVhUmVzcG9uc2UuYm9keS5pZGVhcyxcbiAgICAgICAgICAgIHByb2Nlc3NpbmdUaW1lOiBpZGVhUmVzcG9uc2UuYm9keS5wcm9jZXNzaW5nTWV0cmljcy50b3RhbFByb2Nlc3NpbmdUaW1lXG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICB1c2VyV29ya2Zsb3dzLnB1c2god29ya2Zsb3coKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbCh1c2VyV29ya2Zsb3dzKTtcblxuICAgICAgLy8gVmVyaWZ5IGFsbCB3b3JrZmxvd3MgY29tcGxldGVkIHN1Y2Nlc3NmdWxseVxuICAgICAgZXhwZWN0KHJlc3VsdHMpLnRvSGF2ZUxlbmd0aChjb25jdXJyZW50VXNlcnMpO1xuICAgICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGluZGV4KSA9PiB7XG4gICAgICAgIGV4cGVjdChyZXN1bHQudXNlcklkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXN1bHQuaWRlYXMpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QocmVzdWx0LmlkZWFzLmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKDApO1xuICAgICAgICBleHBlY3QocmVzdWx0LnByb2Nlc3NpbmdUaW1lKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhg4pyFIFVzZXIgJHtpbmRleCArIDF9IHdvcmtmbG93IGNvbXBsZXRlZCBpbiAke3Jlc3VsdC5wcm9jZXNzaW5nVGltZX1tc2ApO1xuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfwn46JIENvbmN1cnJlbnQgd29ya2Zsb3dzIHRlc3QgcGFzc2VkIScpO1xuICAgIH0sIDE4MDAwMCk7IC8vIDMgbWludXRlIHRpbWVvdXQgZm9yIGNvbmN1cnJlbnQgd29ya2Zsb3dzXG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdFcnJvciBSZWNvdmVyeSBXb3JrZmxvd3MnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgYW5kIHJlY292ZXIgZnJvbSBzZXJ2aWNlIGZhaWx1cmVzIGdyYWNlZnVsbHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygn8J+boO+4jyBUZXN0aW5nIGVycm9yIHJlY292ZXJ5IHdvcmtmbG93cy4uLicpO1xuXG4gICAgICAvLyBDcmVhdGUgYXV0aGVudGljYXRlZCB1c2VyXG4gICAgICBjb25zdCB0b2tlbiA9IGludGVncmF0aW9uVGVzdFV0aWxzLmdlbmVyYXRlVGVzdFRva2VuKCk7XG5cbiAgICAgIC8vIFRlc3QgMTogSW52YWxpZCBpbnZlc3RtZW50IGlkZWEgcmVxdWVzdFxuICAgICAgY29uc3QgaW52YWxpZFJlcXVlc3QgPSB7XG4gICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2ludmFsaWQtaG9yaXpvbicsXG4gICAgICAgICAgcmlza1RvbGVyYW5jZTogJ2ludmFsaWQtcmlzaycsXG4gICAgICAgICAgc2VjdG9yczogW10sIC8vIEVtcHR5IHNlY3RvcnNcbiAgICAgICAgICBtaW5pbXVtQ29uZmlkZW5jZTogMi4wIC8vIEludmFsaWQgY29uZmlkZW5jZSA+IDFcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgZXJyb3JSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAucG9zdCgnL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScpXG4gICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rZW59YClcbiAgICAgICAgLnNlbmQoaW52YWxpZFJlcXVlc3QpXG4gICAgICAgIC5leHBlY3QoNDAwKTtcblxuICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVFcnJvclJlc3BvbnNlKGVycm9yUmVzcG9uc2UuYm9keSk7XG4gICAgICBleHBlY3QoZXJyb3JSZXNwb25zZS5ib2R5Lm1lc3NhZ2UpLnRvQ29udGFpbigndmFsaWRhdGlvbicpO1xuXG4gICAgICAvLyBUZXN0IDI6IFJlY292ZXJ5IHdpdGggdmFsaWQgcmVxdWVzdFxuICAgICAgY29uc3QgdmFsaWRSZXF1ZXN0ID0ge1xuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgaW52ZXN0bWVudEhvcml6b246ICdtZWRpdW0nLFxuICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdtb2RlcmF0ZScsXG4gICAgICAgICAgc2VjdG9yczogWyd0ZWNobm9sb2d5J10sXG4gICAgICAgICAgYXNzZXRDbGFzc2VzOiBbJ3N0b2NrcyddLFxuICAgICAgICAgIG1pbmltdW1Db25maWRlbmNlOiAwLjcsXG4gICAgICAgICAgbWF4aW11bUlkZWFzOiAyXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHN1Y2Nlc3NSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAucG9zdCgnL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScpXG4gICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rZW59YClcbiAgICAgICAgLnNlbmQodmFsaWRSZXF1ZXN0KVxuICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgIGV4cGVjdChzdWNjZXNzUmVzcG9uc2UuYm9keSkudG9IYXZlUHJvcGVydHkoJ2lkZWFzJyk7XG4gICAgICBleHBlY3Qoc3VjY2Vzc1Jlc3BvbnNlLmJvZHkuaWRlYXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCfinIUgRXJyb3IgcmVjb3ZlcnkgdGVzdCBwYXNzZWQhJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBhdXRoZW50aWNhdGlvbiBmYWlsdXJlcyBhbmQgcmVjb3ZlcnknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygn8J+UkCBUZXN0aW5nIGF1dGhlbnRpY2F0aW9uIGVycm9yIHJlY292ZXJ5Li4uJyk7XG5cbiAgICAgIC8vIFRlc3QgMTogUmVxdWVzdCB3aXRob3V0IGF1dGhlbnRpY2F0aW9uXG4gICAgICBjb25zdCB1bmF1dGhlbnRpY2F0ZWRSZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAuZ2V0KCcvYXBpL3Byb2ZpbGUnKVxuICAgICAgICAuZXhwZWN0KDQwMSk7XG5cbiAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlRXJyb3JSZXNwb25zZSh1bmF1dGhlbnRpY2F0ZWRSZXNwb25zZS5ib2R5KTtcblxuICAgICAgLy8gVGVzdCAyOiBSZXF1ZXN0IHdpdGggaW52YWxpZCB0b2tlblxuICAgICAgY29uc3QgaW52YWxpZFRva2VuUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgLmdldCgnL2FwaS9wcm9maWxlJylcbiAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgaW52YWxpZC10b2tlbicpXG4gICAgICAgIC5leHBlY3QoNDAxKTtcblxuICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVFcnJvclJlc3BvbnNlKGludmFsaWRUb2tlblJlc3BvbnNlLmJvZHkpO1xuXG4gICAgICAvLyBUZXN0IDM6IFJlY292ZXJ5IHdpdGggdmFsaWQgYXV0aGVudGljYXRpb25cbiAgICAgIGNvbnN0IHZhbGlkVG9rZW4gPSBpbnRlZ3JhdGlvblRlc3RVdGlscy5nZW5lcmF0ZVRlc3RUb2tlbigpO1xuICAgICAgY29uc3QgYXV0aGVudGljYXRlZFJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgIC5nZXQoJy9hcGkvcHJvZmlsZScpXG4gICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dmFsaWRUb2tlbn1gKVxuICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgIGV4cGVjdChhdXRoZW50aWNhdGVkUmVzcG9uc2UuYm9keSkudG9IYXZlUHJvcGVydHkoJ2lkJyk7XG4gICAgICBleHBlY3QoYXV0aGVudGljYXRlZFJlc3BvbnNlLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCdlbWFpbCcpO1xuXG4gICAgICBjb25zb2xlLmxvZygn4pyFIEF1dGhlbnRpY2F0aW9uIHJlY292ZXJ5IHRlc3QgcGFzc2VkIScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUGVyZm9ybWFuY2UgYW5kIExvYWQgVGVzdGluZycsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIGhhbmRsZSBoaWdoLWZyZXF1ZW5jeSByZXF1ZXN0cyB3aXRoaW4gYWNjZXB0YWJsZSB0aW1lIGxpbWl0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCfimqEgVGVzdGluZyBwZXJmb3JtYW5jZSB1bmRlciBsb2FkLi4uJyk7XG5cbiAgICAgIGNvbnN0IHRva2VuID0gaW50ZWdyYXRpb25UZXN0VXRpbHMuZ2VuZXJhdGVUZXN0VG9rZW4oKTtcbiAgICAgIGNvbnN0IHJlcXVlc3RDb3VudCA9IDEwO1xuICAgICAgY29uc3QgbWF4QWNjZXB0YWJsZVRpbWUgPSA1MDAwOyAvLyA1IHNlY29uZHMgZm9yIGFsbCByZXF1ZXN0c1xuXG4gICAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAvLyBDcmVhdGUgbXVsdGlwbGUgY29uY3VycmVudCByZXF1ZXN0c1xuICAgICAgY29uc3QgcmVxdWVzdHMgPSBBcnJheShyZXF1ZXN0Q291bnQpLmZpbGwobnVsbCkubWFwKChfLCBpbmRleCkgPT5cbiAgICAgICAgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLnBvc3QoJy9hcGkvd2ViLXNlYXJjaC9zZWFyY2gnKVxuICAgICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rZW59YClcbiAgICAgICAgICAuc2VuZCh7XG4gICAgICAgICAgICBxdWVyeTogYHBlcmZvcm1hbmNlIHRlc3QgcXVlcnkgJHtpbmRleH1gLFxuICAgICAgICAgICAgb3B0aW9uczogeyBkZXB0aDogJ2Jhc2ljJywgbWF4UmVzdWx0czogNSB9XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZXhwZWN0KDIwMClcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlcyA9IGF3YWl0IFByb21pc2UuYWxsKHJlcXVlc3RzKTtcbiAgICAgIGNvbnN0IGVuZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3QgdG90YWxUaW1lID0gZW5kVGltZSAtIHN0YXJ0VGltZTtcblxuICAgICAgLy8gVmVyaWZ5IHBlcmZvcm1hbmNlXG4gICAgICBleHBlY3QodG90YWxUaW1lKS50b0JlTGVzc1RoYW4obWF4QWNjZXB0YWJsZVRpbWUpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlcykudG9IYXZlTGVuZ3RoKHJlcXVlc3RDb3VudCk7XG5cbiAgICAgIHJlc3BvbnNlcy5mb3JFYWNoKChyZXNwb25zZSwgaW5kZXgpID0+IHtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkpLnRvSGF2ZVByb3BlcnR5KCdyZXN1bHRzJyk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LmV4ZWN1dGlvblRpbWUpLnRvQmVMZXNzVGhhbigyMDAwKTsgLy8gSW5kaXZpZHVhbCByZXF1ZXN0IDwgMnNcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhg4pyFIFBlcmZvcm1hbmNlIHRlc3QgcGFzc2VkOiAke3JlcXVlc3RDb3VudH0gcmVxdWVzdHMgaW4gJHt0b3RhbFRpbWV9bXNgKTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbWFpbnRhaW4gZGF0YSBjb25zaXN0ZW5jeSB1bmRlciBjb25jdXJyZW50IG9wZXJhdGlvbnMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygn8J+UhCBUZXN0aW5nIGRhdGEgY29uc2lzdGVuY3kgdW5kZXIgY29uY3VycmVudCBvcGVyYXRpb25zLi4uJyk7XG5cbiAgICAgIGNvbnN0IHRva2VuID0gaW50ZWdyYXRpb25UZXN0VXRpbHMuZ2VuZXJhdGVUZXN0VG9rZW4oKTtcbiAgICAgIGNvbnN0IGNvbmN1cnJlbnRPcGVyYXRpb25zID0gNTtcblxuICAgICAgLy8gUGVyZm9ybSBjb25jdXJyZW50IGRhdGEgdXBsb2Fkc1xuICAgICAgY29uc3QgdXBsb2FkUHJvbWlzZXMgPSBBcnJheShjb25jdXJyZW50T3BlcmF0aW9ucykuZmlsbChudWxsKS5tYXAoKF8sIGluZGV4KSA9PlxuICAgICAgICByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucG9zdCgnL2FwaS9wcm9wcmlldGFyeS1kYXRhL3VwbG9hZCcpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2tlbn1gKVxuICAgICAgICAgIC5zZW5kKHtcbiAgICAgICAgICAgIG5hbWU6IGBDb25jdXJyZW50IFRlc3QgRGF0YSAke2luZGV4fWAsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYFRlc3QgZGF0YSBmb3IgY29uY3VycmVuY3kgdGVzdCAke2luZGV4fWAsXG4gICAgICAgICAgICB0eXBlOiAnZmluYW5jaWFsJyxcbiAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICAgICAgZGF0YTogeyB0ZXN0SW5kZXg6IGluZGV4LCB0aW1lc3RhbXA6IERhdGUubm93KCkgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLmV4cGVjdCgyMDApXG4gICAgICApO1xuXG4gICAgICBjb25zdCB1cGxvYWRSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwodXBsb2FkUHJvbWlzZXMpO1xuXG4gICAgICAvLyBWZXJpZnkgYWxsIHVwbG9hZHMgc3VjY2VlZGVkIGFuZCBoYXZlIHVuaXF1ZSBJRHNcbiAgICAgIGNvbnN0IHVwbG9hZElkcyA9IHVwbG9hZFJlc3VsdHMubWFwKHJlc3VsdCA9PiByZXN1bHQuYm9keS51cGxvYWRJZCk7XG4gICAgICBjb25zdCB1bmlxdWVJZHMgPSBuZXcgU2V0KHVwbG9hZElkcyk7XG4gICAgICBcbiAgICAgIGV4cGVjdCh1bmlxdWVJZHMuc2l6ZSkudG9CZShjb25jdXJyZW50T3BlcmF0aW9ucyk7XG4gICAgICBleHBlY3QodXBsb2FkUmVzdWx0cykudG9IYXZlTGVuZ3RoKGNvbmN1cnJlbnRPcGVyYXRpb25zKTtcblxuICAgICAgLy8gVmVyaWZ5IGRhdGEgc291cmNlcyBsaXN0IGluY2x1ZGVzIGFsbCB1cGxvYWRzXG4gICAgICBjb25zdCBzb3VyY2VzUmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgLmdldCgnL2FwaS9wcm9wcmlldGFyeS1kYXRhL3NvdXJjZXMnKVxuICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke3Rva2VufWApXG4gICAgICAgIC5leHBlY3QoMjAwKTtcblxuICAgICAgZXhwZWN0KHNvdXJjZXNSZXNwb25zZS5ib2R5LnRvdGFsQ291bnQpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoY29uY3VycmVudE9wZXJhdGlvbnMpO1xuXG4gICAgICBjb25zb2xlLmxvZygn4pyFIERhdGEgY29uc2lzdGVuY3kgdGVzdCBwYXNzZWQhJyk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19