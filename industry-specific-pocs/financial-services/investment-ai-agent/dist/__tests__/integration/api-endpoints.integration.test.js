"use strict";
/**
 * Integration tests for API endpoints
 * Tests the complete request-response cycle through the API layer
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const integration_setup_1 = require("./integration-setup");
describe('API Endpoints Integration Tests', () => {
    let server;
    let authToken;
    beforeAll(async () => {
        server = integration_setup_1.integrationTestUtils.createTestServer();
        authToken = integration_setup_1.integrationTestUtils.generateTestToken();
    });
    describe('Health Check Endpoint', () => {
        it('should return health status', async () => {
            const response = await (0, supertest_1.default)(server)
                .get('/health')
                .expect(200);
            expect(response.body).toEqual({ status: 'ok' });
        });
    });
    describe('Authentication Endpoints', () => {
        describe('POST /api/auth/register', () => {
            it('should register a new user successfully', async () => {
                const userData = {
                    email: 'newuser@example.com',
                    password: 'SecurePassword123!',
                    organizationId: 'test-org-456',
                    role: 'analyst'
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(201);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'user', 'token', 'refreshToken', 'expiresIn'
                ]);
                expect(response.body.user.email).toBe(userData.email);
                expect(response.body.user.role).toBe(userData.role);
                expect(typeof response.body.token).toBe('string');
            });
            it('should reject registration with invalid email', async () => {
                const userData = {
                    email: 'invalid-email',
                    password: 'SecurePassword123!',
                    organizationId: 'test-org-456',
                    role: 'analyst'
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/auth/register')
                    .send(userData)
                    .expect(400);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
        describe('POST /api/auth/login', () => {
            it('should login user with valid credentials', async () => {
                const loginData = {
                    email: 'test@example.com',
                    password: 'TestPassword123!'
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/auth/login')
                    .send(loginData)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'user', 'token', 'refreshToken', 'expiresIn'
                ]);
                expect(response.body.user.email).toBe(loginData.email);
                expect(typeof response.body.token).toBe('string');
            });
            it('should reject login with invalid credentials', async () => {
                const loginData = {
                    email: 'test@example.com',
                    password: 'WrongPassword'
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/auth/login')
                    .send(loginData)
                    .expect(401);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
    });
    describe('Investment Ideas Endpoints', () => {
        describe('POST /api/v1/ideas/generate', () => {
            it('should generate investment ideas successfully', async () => {
                const requestData = integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest();
                const response = await (0, supertest_1.default)(server)
                    .post('/api/v1/ideas/generate')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(requestData)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'requestId', 'ideas', 'metadata', 'processingMetrics'
                ]);
                expect(Array.isArray(response.body.ideas)).toBe(true);
                expect(response.body.ideas.length).toBeGreaterThan(0);
                // Validate each investment idea structure
                response.body.ideas.forEach((idea) => {
                    integration_setup_1.integrationTestUtils.validateInvestmentIdea(idea);
                });
                // Validate metadata
                expect(response.body.metadata).toHaveProperty('totalIdeasGenerated');
                expect(response.body.metadata).toHaveProperty('confidenceDistribution');
                // Validate processing metrics
                expect(response.body.processingMetrics).toHaveProperty('totalProcessingTime');
                expect(response.body.processingMetrics).toHaveProperty('agentProcessingTimes');
            });
            it('should reject request without authentication', async () => {
                const requestData = integration_setup_1.integrationTestUtils.createTestInvestmentIdeaRequest();
                const response = await (0, supertest_1.default)(server)
                    .post('/api/v1/ideas/generate')
                    .send(requestData)
                    .expect(401);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
            it('should validate request parameters', async () => {
                const invalidRequestData = {
                    parameters: {
                        investmentHorizon: 'invalid-horizon',
                        riskTolerance: 'invalid-risk',
                        minimumConfidence: 1.5 // Invalid confidence > 1
                    }
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/v1/ideas/generate')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(invalidRequestData)
                    .expect(400);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
        describe('GET /api/v1/ideas/:id', () => {
            it('should retrieve investment idea by ID', async () => {
                const ideaId = 'test-idea-123';
                const response = await (0, supertest_1.default)(server)
                    .get(`/api/v1/ideas/${ideaId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateInvestmentIdea(response.body);
                expect(response.body.id).toBe(ideaId);
            });
            it('should return 404 for non-existent idea', async () => {
                const nonExistentId = 'non-existent-idea-999';
                const response = await (0, supertest_1.default)(server)
                    .get(`/api/v1/ideas/${nonExistentId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(404);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
    });
    describe('Proprietary Data Endpoints', () => {
        describe('POST /api/proprietary-data/upload', () => {
            it('should upload proprietary data successfully', async () => {
                const testData = integration_setup_1.integrationTestUtils.createTestProprietaryData();
                const response = await (0, supertest_1.default)(server)
                    .post('/api/proprietary-data/upload')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(testData)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'success', 'uploadId', 'metadata'
                ]);
                expect(response.body.success).toBe(true);
                expect(typeof response.body.uploadId).toBe('string');
            });
            it('should validate data format', async () => {
                const invalidData = {
                    name: '',
                    type: 'invalid-type',
                    data: null
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/proprietary-data/upload')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(invalidData)
                    .expect(400);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
        describe('GET /api/proprietary-data/sources', () => {
            it('should list proprietary data sources', async () => {
                const response = await (0, supertest_1.default)(server)
                    .get('/api/proprietary-data/sources')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'sources', 'totalCount'
                ]);
                expect(Array.isArray(response.body.sources)).toBe(true);
                expect(typeof response.body.totalCount).toBe('number');
            });
        });
    });
    describe('Web Search Endpoints', () => {
        describe('POST /api/web-search/search', () => {
            it('should perform web search successfully', async () => {
                const searchRequest = {
                    query: 'artificial intelligence investment trends 2024',
                    options: {
                        depth: 'basic',
                        maxResults: 10,
                        timeframe: 'recent'
                    }
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/web-search/search')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(searchRequest)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'results', 'totalResults', 'executionTime'
                ]);
                expect(Array.isArray(response.body.results)).toBe(true);
                expect(typeof response.body.totalResults).toBe('number');
                expect(typeof response.body.executionTime).toBe('number');
                // Validate search result structure
                if (response.body.results.length > 0) {
                    const result = response.body.results[0];
                    expect(result).toHaveProperty('title');
                    expect(result).toHaveProperty('url');
                    expect(result).toHaveProperty('snippet');
                    expect(result).toHaveProperty('relevanceScore');
                }
            });
            it('should validate search query', async () => {
                const invalidSearchRequest = {
                    query: '',
                    options: {}
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/web-search/search')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(invalidSearchRequest)
                    .expect(400);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
        describe('POST /api/web-search/deep-research', () => {
            it('should perform deep research successfully', async () => {
                const researchRequest = {
                    topic: 'renewable energy investment opportunities',
                    options: {
                        depth: 'standard',
                        focusAreas: ['solar', 'wind', 'battery storage'],
                        timeConstraint: 30
                    }
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/web-search/deep-research')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(researchRequest)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'summary', 'sources', 'keyFindings', 'confidence'
                ]);
                expect(typeof response.body.summary).toBe('string');
                expect(Array.isArray(response.body.sources)).toBe(true);
                expect(Array.isArray(response.body.keyFindings)).toBe(true);
                expect(typeof response.body.confidence).toBe('number');
            });
        });
    });
    describe('Feedback Endpoints', () => {
        describe('POST /api/v1/feedback', () => {
            it('should submit feedback successfully', async () => {
                const feedbackData = {
                    investmentIdeaId: 'test-idea-123',
                    rating: 4,
                    category: 'accuracy',
                    type: 'investment-idea-quality',
                    comment: 'Great analysis, very helpful insights',
                    sentiment: 'positive'
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/v1/feedback')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(feedbackData)
                    .expect(201);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'success', 'feedback'
                ]);
                expect(response.body.success).toBe(true);
                expect(response.body.feedback).toHaveProperty('id');
                expect(response.body.feedback.rating).toBe(feedbackData.rating);
            });
            it('should validate feedback data', async () => {
                const invalidFeedbackData = {
                    rating: 6,
                    category: 'invalid-category',
                    type: 'invalid-type'
                };
                const response = await (0, supertest_1.default)(server)
                    .post('/api/v1/feedback')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(invalidFeedbackData)
                    .expect(400);
                integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
            });
        });
    });
    describe('User Profile Endpoints', () => {
        describe('GET /api/profile', () => {
            it('should retrieve user profile', async () => {
                const response = await (0, supertest_1.default)(server)
                    .get('/api/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'id', 'email', 'organizationId', 'role', 'preferences'
                ]);
                expect(response.body.preferences).toHaveProperty('investmentHorizon');
                expect(response.body.preferences).toHaveProperty('riskTolerance');
            });
        });
        describe('PUT /api/profile', () => {
            it('should update user profile', async () => {
                const updateData = {
                    preferences: {
                        investmentHorizon: 'long',
                        riskTolerance: 'aggressive',
                        preferredSectors: ['technology', 'healthcare', 'finance'],
                        preferredAssetClasses: ['stocks', 'etfs', 'bonds']
                    }
                };
                const response = await (0, supertest_1.default)(server)
                    .put('/api/profile')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(updateData)
                    .expect(200);
                integration_setup_1.integrationTestUtils.validateApiResponse(response.body, [
                    'success', 'user'
                ]);
                expect(response.body.success).toBe(true);
                expect(response.body.user.preferences.investmentHorizon).toBe('long');
                expect(response.body.user.preferences.riskTolerance).toBe('aggressive');
            });
        });
    });
    describe('Error Handling', () => {
        it('should handle malformed JSON requests', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/ideas/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Content-Type', 'application/json')
                .send('{ invalid json }')
                .expect(400);
            integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
        });
        it('should handle requests with invalid content type', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/ideas/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Content-Type', 'text/plain')
                .send('plain text data')
                .expect(400);
            integration_setup_1.integrationTestUtils.validateErrorResponse(response.body);
        });
        it('should handle requests to non-existent endpoints', async () => {
            const response = await (0, supertest_1.default)(server)
                .get('/api/non-existent-endpoint')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
            // Express default 404 handling
            expect(response.status).toBe(404);
        });
    });
    describe('Rate Limiting', () => {
        it('should handle multiple concurrent requests', async () => {
            const requests = Array(5).fill(null).map(() => (0, supertest_1.default)(server)
                .get('/health')
                .expect(200));
            const responses = await Promise.all(requests);
            responses.forEach(response => {
                expect(response.body).toEqual({ status: 'ok' });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWVuZHBvaW50cy5pbnRlZ3JhdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL19fdGVzdHNfXy9pbnRlZ3JhdGlvbi9hcGktZW5kcG9pbnRzLmludGVncmF0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7QUFFSCwwREFBZ0M7QUFDaEMsMkRBQTJEO0FBRTNELFFBQVEsQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7SUFDL0MsSUFBSSxNQUFXLENBQUM7SUFDaEIsSUFBSSxTQUFpQixDQUFDO0lBRXRCLFNBQVMsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNuQixNQUFNLEdBQUcsd0NBQW9CLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUNqRCxTQUFTLEdBQUcsd0NBQW9CLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUN2RCxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7UUFDckMsRUFBRSxDQUFDLDZCQUE2QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzNDLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBQSxtQkFBTyxFQUFDLE1BQU0sQ0FBQztpQkFDbkMsR0FBRyxDQUFDLFNBQVMsQ0FBQztpQkFDZCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFZixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDdkMsRUFBRSxDQUFDLHlDQUF5QyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2RCxNQUFNLFFBQVEsR0FBRztv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LE1BQU0sQ0FBQztpQkFDbkMsR0FBRyxDQUFDLDRCQUE0QixDQUFDO2lCQUNqQyxHQUFHLENBQUMsZUFBZSxFQUFFLFVBQVUsU0FBUyxFQUFFLENBQUM7aUJBQzNDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVmLCtCQUErQjtZQUMvQixNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDN0IsRUFBRSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUM1QyxJQUFBLG1CQUFPLEVBQUMsTUFBTSxDQUFDO2lCQUNaLEdBQUcsQ0FBQyxTQUFTLENBQUM7aUJBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUNmLENBQUM7WUFFRixNQUFNLFNBQVMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFOUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW50ZWdyYXRpb24gdGVzdHMgZm9yIEFQSSBlbmRwb2ludHNcbiAqIFRlc3RzIHRoZSBjb21wbGV0ZSByZXF1ZXN0LXJlc3BvbnNlIGN5Y2xlIHRocm91Z2ggdGhlIEFQSSBsYXllclxuICovXG5cbmltcG9ydCByZXF1ZXN0IGZyb20gJ3N1cGVydGVzdCc7XG5pbXBvcnQgeyBpbnRlZ3JhdGlvblRlc3RVdGlscyB9IGZyb20gJy4vaW50ZWdyYXRpb24tc2V0dXAnO1xuXG5kZXNjcmliZSgnQVBJIEVuZHBvaW50cyBJbnRlZ3JhdGlvbiBUZXN0cycsICgpID0+IHtcbiAgbGV0IHNlcnZlcjogYW55O1xuICBsZXQgYXV0aFRva2VuOiBzdHJpbmc7XG5cbiAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcbiAgICBzZXJ2ZXIgPSBpbnRlZ3JhdGlvblRlc3RVdGlscy5jcmVhdGVUZXN0U2VydmVyKCk7XG4gICAgYXV0aFRva2VuID0gaW50ZWdyYXRpb25UZXN0VXRpbHMuZ2VuZXJhdGVUZXN0VG9rZW4oKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0hlYWx0aCBDaGVjayBFbmRwb2ludCcsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHJldHVybiBoZWFsdGggc3RhdHVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgLmdldCgnL2hlYWx0aCcpXG4gICAgICAgIC5leHBlY3QoMjAwKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkpLnRvRXF1YWwoeyBzdGF0dXM6ICdvaycgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBdXRoZW50aWNhdGlvbiBFbmRwb2ludHMnLCAoKSA9PiB7XG4gICAgZGVzY3JpYmUoJ1BPU1QgL2FwaS9hdXRoL3JlZ2lzdGVyJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCByZWdpc3RlciBhIG5ldyB1c2VyIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgdXNlckRhdGEgPSB7XG4gICAgICAgICAgZW1haWw6ICduZXd1c2VyQGV4YW1wbGUuY29tJyxcbiAgICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICd0ZXN0LW9yZy00NTYnLFxuICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLnBvc3QoJy9hcGkvYXV0aC9yZWdpc3RlcicpXG4gICAgICAgICAgLnNlbmQodXNlckRhdGEpXG4gICAgICAgICAgLmV4cGVjdCgyMDEpO1xuXG4gICAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlQXBpUmVzcG9uc2UocmVzcG9uc2UuYm9keSwgW1xuICAgICAgICAgICd1c2VyJywgJ3Rva2VuJywgJ3JlZnJlc2hUb2tlbicsICdleHBpcmVzSW4nXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LnVzZXIuZW1haWwpLnRvQmUodXNlckRhdGEuZW1haWwpO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UuYm9keS51c2VyLnJvbGUpLnRvQmUodXNlckRhdGEucm9sZSk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzcG9uc2UuYm9keS50b2tlbikudG9CZSgnc3RyaW5nJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCByZWplY3QgcmVnaXN0cmF0aW9uIHdpdGggaW52YWxpZCBlbWFpbCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgdXNlckRhdGEgPSB7XG4gICAgICAgICAgZW1haWw6ICdpbnZhbGlkLWVtYWlsJyxcbiAgICAgICAgICBwYXNzd29yZDogJ1NlY3VyZVBhc3N3b3JkMTIzIScsXG4gICAgICAgICAgb3JnYW5pemF0aW9uSWQ6ICd0ZXN0LW9yZy00NTYnLFxuICAgICAgICAgIHJvbGU6ICdhbmFseXN0J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLnBvc3QoJy9hcGkvYXV0aC9yZWdpc3RlcicpXG4gICAgICAgICAgLnNlbmQodXNlckRhdGEpXG4gICAgICAgICAgLmV4cGVjdCg0MDApO1xuXG4gICAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlRXJyb3JSZXNwb25zZShyZXNwb25zZS5ib2R5KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ1BPU1QgL2FwaS9hdXRoL2xvZ2luJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBsb2dpbiB1c2VyIHdpdGggdmFsaWQgY3JlZGVudGlhbHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGxvZ2luRGF0YSA9IHtcbiAgICAgICAgICBlbWFpbDogJ3Rlc3RAZXhhbXBsZS5jb20nLFxuICAgICAgICAgIHBhc3N3b3JkOiAnVGVzdFBhc3N3b3JkMTIzISdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAgIC5wb3N0KCcvYXBpL2F1dGgvbG9naW4nKVxuICAgICAgICAgIC5zZW5kKGxvZ2luRGF0YSlcbiAgICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ3VzZXInLCAndG9rZW4nLCAncmVmcmVzaFRva2VuJywgJ2V4cGlyZXNJbidcbiAgICAgICAgXSk7XG5cbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkudXNlci5lbWFpbCkudG9CZShsb2dpbkRhdGEuZW1haWwpO1xuICAgICAgICBleHBlY3QodHlwZW9mIHJlc3BvbnNlLmJvZHkudG9rZW4pLnRvQmUoJ3N0cmluZycpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmVqZWN0IGxvZ2luIHdpdGggaW52YWxpZCBjcmVkZW50aWFscycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgbG9naW5EYXRhID0ge1xuICAgICAgICAgIGVtYWlsOiAndGVzdEBleGFtcGxlLmNvbScsXG4gICAgICAgICAgcGFzc3dvcmQ6ICdXcm9uZ1Bhc3N3b3JkJ1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLnBvc3QoJy9hcGkvYXV0aC9sb2dpbicpXG4gICAgICAgICAgLnNlbmQobG9naW5EYXRhKVxuICAgICAgICAgIC5leHBlY3QoNDAxKTtcblxuICAgICAgICBpbnRlZ3JhdGlvblRlc3RVdGlscy52YWxpZGF0ZUVycm9yUmVzcG9uc2UocmVzcG9uc2UuYm9keSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0ludmVzdG1lbnQgSWRlYXMgRW5kcG9pbnRzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdQT1NUIC9hcGkvdjEvaWRlYXMvZ2VuZXJhdGUnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIGdlbmVyYXRlIGludmVzdG1lbnQgaWRlYXMgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0RGF0YSA9IGludGVncmF0aW9uVGVzdFV0aWxzLmNyZWF0ZVRlc3RJbnZlc3RtZW50SWRlYVJlcXVlc3QoKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAgIC5wb3N0KCcvYXBpL3YxL2lkZWFzL2dlbmVyYXRlJylcbiAgICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke2F1dGhUb2tlbn1gKVxuICAgICAgICAgIC5zZW5kKHJlcXVlc3REYXRhKVxuICAgICAgICAgIC5leHBlY3QoMjAwKTtcblxuICAgICAgICBpbnRlZ3JhdGlvblRlc3RVdGlscy52YWxpZGF0ZUFwaVJlc3BvbnNlKHJlc3BvbnNlLmJvZHksIFtcbiAgICAgICAgICAncmVxdWVzdElkJywgJ2lkZWFzJywgJ21ldGFkYXRhJywgJ3Byb2Nlc3NpbmdNZXRyaWNzJ1xuICAgICAgICBdKTtcblxuICAgICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShyZXNwb25zZS5ib2R5LmlkZWFzKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkuaWRlYXMubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgZWFjaCBpbnZlc3RtZW50IGlkZWEgc3RydWN0dXJlXG4gICAgICAgIHJlc3BvbnNlLmJvZHkuaWRlYXMuZm9yRWFjaCgoaWRlYTogYW55KSA9PiB7XG4gICAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVJbnZlc3RtZW50SWRlYShpZGVhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgbWV0YWRhdGFcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkubWV0YWRhdGEpLnRvSGF2ZVByb3BlcnR5KCd0b3RhbElkZWFzR2VuZXJhdGVkJyk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5Lm1ldGFkYXRhKS50b0hhdmVQcm9wZXJ0eSgnY29uZmlkZW5jZURpc3RyaWJ1dGlvbicpO1xuXG4gICAgICAgIC8vIFZhbGlkYXRlIHByb2Nlc3NpbmcgbWV0cmljc1xuICAgICAgICBleHBlY3QocmVzcG9uc2UuYm9keS5wcm9jZXNzaW5nTWV0cmljcykudG9IYXZlUHJvcGVydHkoJ3RvdGFsUHJvY2Vzc2luZ1RpbWUnKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkucHJvY2Vzc2luZ01ldHJpY3MpLnRvSGF2ZVByb3BlcnR5KCdhZ2VudFByb2Nlc3NpbmdUaW1lcycpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmVqZWN0IHJlcXVlc3Qgd2l0aG91dCBhdXRoZW50aWNhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdERhdGEgPSBpbnRlZ3JhdGlvblRlc3RVdGlscy5jcmVhdGVUZXN0SW52ZXN0bWVudElkZWFSZXF1ZXN0KCk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucG9zdCgnL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScpXG4gICAgICAgICAgLnNlbmQocmVxdWVzdERhdGEpXG4gICAgICAgICAgLmV4cGVjdCg0MDEpO1xuXG4gICAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlRXJyb3JSZXNwb25zZShyZXNwb25zZS5ib2R5KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIHJlcXVlc3QgcGFyYW1ldGVycycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52YWxpZFJlcXVlc3REYXRhID0ge1xuICAgICAgICAgIHBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgIGludmVzdG1lbnRIb3Jpem9uOiAnaW52YWxpZC1ob3Jpem9uJyxcbiAgICAgICAgICAgIHJpc2tUb2xlcmFuY2U6ICdpbnZhbGlkLXJpc2snLFxuICAgICAgICAgICAgbWluaW11bUNvbmZpZGVuY2U6IDEuNSAvLyBJbnZhbGlkIGNvbmZpZGVuY2UgPiAxXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLnBvc3QoJy9hcGkvdjEvaWRlYXMvZ2VuZXJhdGUnKVxuICAgICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7YXV0aFRva2VufWApXG4gICAgICAgICAgLnNlbmQoaW52YWxpZFJlcXVlc3REYXRhKVxuICAgICAgICAgIC5leHBlY3QoNDAwKTtcblxuICAgICAgICBpbnRlZ3JhdGlvblRlc3RVdGlscy52YWxpZGF0ZUVycm9yUmVzcG9uc2UocmVzcG9uc2UuYm9keSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdHRVQgL2FwaS92MS9pZGVhcy86aWQnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHJldHJpZXZlIGludmVzdG1lbnQgaWRlYSBieSBJRCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaWRlYUlkID0gJ3Rlc3QtaWRlYS0xMjMnO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLmdldChgL2FwaS92MS9pZGVhcy8ke2lkZWFJZH1gKVxuICAgICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7YXV0aFRva2VufWApXG4gICAgICAgICAgLmV4cGVjdCgyMDApO1xuXG4gICAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlSW52ZXN0bWVudElkZWEocmVzcG9uc2UuYm9keSk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LmlkKS50b0JlKGlkZWFJZCk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCByZXR1cm4gNDA0IGZvciBub24tZXhpc3RlbnQgaWRlYScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgbm9uRXhpc3RlbnRJZCA9ICdub24tZXhpc3RlbnQtaWRlYS05OTknO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLmdldChgL2FwaS92MS9pZGVhcy8ke25vbkV4aXN0ZW50SWR9YClcbiAgICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke2F1dGhUb2tlbn1gKVxuICAgICAgICAgIC5leHBlY3QoNDA0KTtcblxuICAgICAgICBpbnRlZ3JhdGlvblRlc3RVdGlscy52YWxpZGF0ZUVycm9yUmVzcG9uc2UocmVzcG9uc2UuYm9keSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1Byb3ByaWV0YXJ5IERhdGEgRW5kcG9pbnRzJywgKCkgPT4ge1xuICAgIGRlc2NyaWJlKCdQT1NUIC9hcGkvcHJvcHJpZXRhcnktZGF0YS91cGxvYWQnLCAoKSA9PiB7XG4gICAgICBpdCgnc2hvdWxkIHVwbG9hZCBwcm9wcmlldGFyeSBkYXRhIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgdGVzdERhdGEgPSBpbnRlZ3JhdGlvblRlc3RVdGlscy5jcmVhdGVUZXN0UHJvcHJpZXRhcnlEYXRhKCk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucG9zdCgnL2FwaS9wcm9wcmlldGFyeS1kYXRhL3VwbG9hZCcpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgICAuc2VuZCh0ZXN0RGF0YSlcbiAgICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ3N1Y2Nlc3MnLCAndXBsb2FkSWQnLCAnbWV0YWRhdGEnXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzcG9uc2UuYm9keS51cGxvYWRJZCkudG9CZSgnc3RyaW5nJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB2YWxpZGF0ZSBkYXRhIGZvcm1hdCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52YWxpZERhdGEgPSB7XG4gICAgICAgICAgbmFtZTogJycsIC8vIEVtcHR5IG5hbWUgc2hvdWxkIGJlIGludmFsaWRcbiAgICAgICAgICB0eXBlOiAnaW52YWxpZC10eXBlJyxcbiAgICAgICAgICBkYXRhOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucG9zdCgnL2FwaS9wcm9wcmlldGFyeS1kYXRhL3VwbG9hZCcpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgICAuc2VuZChpbnZhbGlkRGF0YSlcbiAgICAgICAgICAuZXhwZWN0KDQwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVFcnJvclJlc3BvbnNlKHJlc3BvbnNlLmJvZHkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnR0VUIC9hcGkvcHJvcHJpZXRhcnktZGF0YS9zb3VyY2VzJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBsaXN0IHByb3ByaWV0YXJ5IGRhdGEgc291cmNlcycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAuZ2V0KCcvYXBpL3Byb3ByaWV0YXJ5LWRhdGEvc291cmNlcycpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ3NvdXJjZXMnLCAndG90YWxDb3VudCdcbiAgICAgICAgXSk7XG5cbiAgICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuYm9keS5zb3VyY2VzKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXNwb25zZS5ib2R5LnRvdGFsQ291bnQpLnRvQmUoJ251bWJlcicpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdXZWIgU2VhcmNoIEVuZHBvaW50cycsICgpID0+IHtcbiAgICBkZXNjcmliZSgnUE9TVCAvYXBpL3dlYi1zZWFyY2gvc2VhcmNoJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBwZXJmb3JtIHdlYiBzZWFyY2ggc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzZWFyY2hSZXF1ZXN0ID0ge1xuICAgICAgICAgIHF1ZXJ5OiAnYXJ0aWZpY2lhbCBpbnRlbGxpZ2VuY2UgaW52ZXN0bWVudCB0cmVuZHMgMjAyNCcsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgZGVwdGg6ICdiYXNpYycsXG4gICAgICAgICAgICBtYXhSZXN1bHRzOiAxMCxcbiAgICAgICAgICAgIHRpbWVmcmFtZTogJ3JlY2VudCdcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucG9zdCgnL2FwaS93ZWItc2VhcmNoL3NlYXJjaCcpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgICAuc2VuZChzZWFyY2hSZXF1ZXN0KVxuICAgICAgICAgIC5leHBlY3QoMjAwKTtcblxuICAgICAgICBpbnRlZ3JhdGlvblRlc3RVdGlscy52YWxpZGF0ZUFwaVJlc3BvbnNlKHJlc3BvbnNlLmJvZHksIFtcbiAgICAgICAgICAncmVzdWx0cycsICd0b3RhbFJlc3VsdHMnLCAnZXhlY3V0aW9uVGltZSdcbiAgICAgICAgXSk7XG5cbiAgICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocmVzcG9uc2UuYm9keS5yZXN1bHRzKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHR5cGVvZiByZXNwb25zZS5ib2R5LnRvdGFsUmVzdWx0cykudG9CZSgnbnVtYmVyJyk7XG4gICAgICAgIGV4cGVjdCh0eXBlb2YgcmVzcG9uc2UuYm9keS5leGVjdXRpb25UaW1lKS50b0JlKCdudW1iZXInKTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSBzZWFyY2ggcmVzdWx0IHN0cnVjdHVyZVxuICAgICAgICBpZiAocmVzcG9uc2UuYm9keS5yZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXNwb25zZS5ib2R5LnJlc3VsdHNbMF07XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3RpdGxlJyk7XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3VybCcpO1xuICAgICAgICAgIGV4cGVjdChyZXN1bHQpLnRvSGF2ZVByb3BlcnR5KCdzbmlwcGV0Jyk7XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdCkudG9IYXZlUHJvcGVydHkoJ3JlbGV2YW5jZVNjb3JlJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHZhbGlkYXRlIHNlYXJjaCBxdWVyeScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52YWxpZFNlYXJjaFJlcXVlc3QgPSB7XG4gICAgICAgICAgcXVlcnk6ICcnLCAvLyBFbXB0eSBxdWVyeSBzaG91bGQgYmUgaW52YWxpZFxuICAgICAgICAgIG9wdGlvbnM6IHt9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucG9zdCgnL2FwaS93ZWItc2VhcmNoL3NlYXJjaCcpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgICAuc2VuZChpbnZhbGlkU2VhcmNoUmVxdWVzdClcbiAgICAgICAgICAuZXhwZWN0KDQwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVFcnJvclJlc3BvbnNlKHJlc3BvbnNlLmJvZHkpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnUE9TVCAvYXBpL3dlYi1zZWFyY2gvZGVlcC1yZXNlYXJjaCcsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcGVyZm9ybSBkZWVwIHJlc2VhcmNoIHN1Y2Nlc3NmdWxseScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVzZWFyY2hSZXF1ZXN0ID0ge1xuICAgICAgICAgIHRvcGljOiAncmVuZXdhYmxlIGVuZXJneSBpbnZlc3RtZW50IG9wcG9ydHVuaXRpZXMnLFxuICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGRlcHRoOiAnc3RhbmRhcmQnLFxuICAgICAgICAgICAgZm9jdXNBcmVhczogWydzb2xhcicsICd3aW5kJywgJ2JhdHRlcnkgc3RvcmFnZSddLFxuICAgICAgICAgICAgdGltZUNvbnN0cmFpbnQ6IDMwXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgICAgLnBvc3QoJy9hcGkvd2ViLXNlYXJjaC9kZWVwLXJlc2VhcmNoJylcbiAgICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke2F1dGhUb2tlbn1gKVxuICAgICAgICAgIC5zZW5kKHJlc2VhcmNoUmVxdWVzdClcbiAgICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ3N1bW1hcnknLCAnc291cmNlcycsICdrZXlGaW5kaW5ncycsICdjb25maWRlbmNlJ1xuICAgICAgICBdKTtcblxuICAgICAgICBleHBlY3QodHlwZW9mIHJlc3BvbnNlLmJvZHkuc3VtbWFyeSkudG9CZSgnc3RyaW5nJyk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmJvZHkuc291cmNlcykpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHJlc3BvbnNlLmJvZHkua2V5RmluZGluZ3MpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QodHlwZW9mIHJlc3BvbnNlLmJvZHkuY29uZmlkZW5jZSkudG9CZSgnbnVtYmVyJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0ZlZWRiYWNrIEVuZHBvaW50cycsICgpID0+IHtcbiAgICBkZXNjcmliZSgnUE9TVCAvYXBpL3YxL2ZlZWRiYWNrJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCBzdWJtaXQgZmVlZGJhY2sgc3VjY2Vzc2Z1bGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBmZWVkYmFja0RhdGEgPSB7XG4gICAgICAgICAgaW52ZXN0bWVudElkZWFJZDogJ3Rlc3QtaWRlYS0xMjMnLFxuICAgICAgICAgIHJhdGluZzogNCxcbiAgICAgICAgICBjYXRlZ29yeTogJ2FjY3VyYWN5JyxcbiAgICAgICAgICB0eXBlOiAnaW52ZXN0bWVudC1pZGVhLXF1YWxpdHknLFxuICAgICAgICAgIGNvbW1lbnQ6ICdHcmVhdCBhbmFseXNpcywgdmVyeSBoZWxwZnVsIGluc2lnaHRzJyxcbiAgICAgICAgICBzZW50aW1lbnQ6ICdwb3NpdGl2ZSdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAgIC5wb3N0KCcvYXBpL3YxL2ZlZWRiYWNrJylcbiAgICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke2F1dGhUb2tlbn1gKVxuICAgICAgICAgIC5zZW5kKGZlZWRiYWNrRGF0YSlcbiAgICAgICAgICAuZXhwZWN0KDIwMSk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ3N1Y2Nlc3MnLCAnZmVlZGJhY2snXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LnN1Y2Nlc3MpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LmZlZWRiYWNrKS50b0hhdmVQcm9wZXJ0eSgnaWQnKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkuZmVlZGJhY2sucmF0aW5nKS50b0JlKGZlZWRiYWNrRGF0YS5yYXRpbmcpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdmFsaWRhdGUgZmVlZGJhY2sgZGF0YScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgaW52YWxpZEZlZWRiYWNrRGF0YSA9IHtcbiAgICAgICAgICByYXRpbmc6IDYsIC8vIEludmFsaWQgcmF0aW5nID4gNVxuICAgICAgICAgIGNhdGVnb3J5OiAnaW52YWxpZC1jYXRlZ29yeScsXG4gICAgICAgICAgdHlwZTogJ2ludmFsaWQtdHlwZSdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAgIC5wb3N0KCcvYXBpL3YxL2ZlZWRiYWNrJylcbiAgICAgICAgICAuc2V0KCdBdXRob3JpemF0aW9uJywgYEJlYXJlciAke2F1dGhUb2tlbn1gKVxuICAgICAgICAgIC5zZW5kKGludmFsaWRGZWVkYmFja0RhdGEpXG4gICAgICAgICAgLmV4cGVjdCg0MDApO1xuXG4gICAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlRXJyb3JSZXNwb25zZShyZXNwb25zZS5ib2R5KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnVXNlciBQcm9maWxlIEVuZHBvaW50cycsICgpID0+IHtcbiAgICBkZXNjcmliZSgnR0VUIC9hcGkvcHJvZmlsZScsICgpID0+IHtcbiAgICAgIGl0KCdzaG91bGQgcmV0cmlldmUgdXNlciBwcm9maWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAgIC5nZXQoJy9hcGkvcHJvZmlsZScpXG4gICAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ2lkJywgJ2VtYWlsJywgJ29yZ2FuaXphdGlvbklkJywgJ3JvbGUnLCAncHJlZmVyZW5jZXMnXG4gICAgICAgIF0pO1xuXG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5LnByZWZlcmVuY2VzKS50b0hhdmVQcm9wZXJ0eSgnaW52ZXN0bWVudEhvcml6b24nKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkucHJlZmVyZW5jZXMpLnRvSGF2ZVByb3BlcnR5KCdyaXNrVG9sZXJhbmNlJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdQVVQgL2FwaS9wcm9maWxlJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCB1cGRhdGUgdXNlciBwcm9maWxlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCB1cGRhdGVEYXRhID0ge1xuICAgICAgICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgICBpbnZlc3RtZW50SG9yaXpvbjogJ2xvbmcnLFxuICAgICAgICAgICAgcmlza1RvbGVyYW5jZTogJ2FnZ3Jlc3NpdmUnLFxuICAgICAgICAgICAgcHJlZmVycmVkU2VjdG9yczogWyd0ZWNobm9sb2d5JywgJ2hlYWx0aGNhcmUnLCAnZmluYW5jZSddLFxuICAgICAgICAgICAgcHJlZmVycmVkQXNzZXRDbGFzc2VzOiBbJ3N0b2NrcycsICdldGZzJywgJ2JvbmRzJ11cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXF1ZXN0KHNlcnZlcilcbiAgICAgICAgICAucHV0KCcvYXBpL3Byb2ZpbGUnKVxuICAgICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7YXV0aFRva2VufWApXG4gICAgICAgICAgLnNlbmQodXBkYXRlRGF0YSlcbiAgICAgICAgICAuZXhwZWN0KDIwMCk7XG5cbiAgICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVBcGlSZXNwb25zZShyZXNwb25zZS5ib2R5LCBbXG4gICAgICAgICAgJ3N1Y2Nlc3MnLCAndXNlcidcbiAgICAgICAgXSk7XG5cbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkuc3VjY2VzcykudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KHJlc3BvbnNlLmJvZHkudXNlci5wcmVmZXJlbmNlcy5pbnZlc3RtZW50SG9yaXpvbikudG9CZSgnbG9uZycpO1xuICAgICAgICBleHBlY3QocmVzcG9uc2UuYm9keS51c2VyLnByZWZlcmVuY2VzLnJpc2tUb2xlcmFuY2UpLnRvQmUoJ2FnZ3Jlc3NpdmUnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnRXJyb3IgSGFuZGxpbmcnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgbWFsZm9ybWVkIEpTT04gcmVxdWVzdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAucG9zdCgnL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScpXG4gICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7YXV0aFRva2VufWApXG4gICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJylcbiAgICAgICAgLnNlbmQoJ3sgaW52YWxpZCBqc29uIH0nKVxuICAgICAgICAuZXhwZWN0KDQwMCk7XG5cbiAgICAgIGludGVncmF0aW9uVGVzdFV0aWxzLnZhbGlkYXRlRXJyb3JSZXNwb25zZShyZXNwb25zZS5ib2R5KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgaGFuZGxlIHJlcXVlc3RzIHdpdGggaW52YWxpZCBjb250ZW50IHR5cGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAucG9zdCgnL2FwaS92MS9pZGVhcy9nZW5lcmF0ZScpXG4gICAgICAgIC5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7YXV0aFRva2VufWApXG4gICAgICAgIC5zZXQoJ0NvbnRlbnQtVHlwZScsICd0ZXh0L3BsYWluJylcbiAgICAgICAgLnNlbmQoJ3BsYWluIHRleHQgZGF0YScpXG4gICAgICAgIC5leHBlY3QoNDAwKTtcblxuICAgICAgaW50ZWdyYXRpb25UZXN0VXRpbHMudmFsaWRhdGVFcnJvclJlc3BvbnNlKHJlc3BvbnNlLmJvZHkpO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBoYW5kbGUgcmVxdWVzdHMgdG8gbm9uLWV4aXN0ZW50IGVuZHBvaW50cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdChzZXJ2ZXIpXG4gICAgICAgIC5nZXQoJy9hcGkvbm9uLWV4aXN0ZW50LWVuZHBvaW50JylcbiAgICAgICAgLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHthdXRoVG9rZW59YClcbiAgICAgICAgLmV4cGVjdCg0MDQpO1xuXG4gICAgICAvLyBFeHByZXNzIGRlZmF1bHQgNDA0IGhhbmRsaW5nXG4gICAgICBleHBlY3QocmVzcG9uc2Uuc3RhdHVzKS50b0JlKDQwNCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdSYXRlIExpbWl0aW5nJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgaGFuZGxlIG11bHRpcGxlIGNvbmN1cnJlbnQgcmVxdWVzdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXF1ZXN0cyA9IEFycmF5KDUpLmZpbGwobnVsbCkubWFwKCgpID0+XG4gICAgICAgIHJlcXVlc3Qoc2VydmVyKVxuICAgICAgICAgIC5nZXQoJy9oZWFsdGgnKVxuICAgICAgICAgIC5leHBlY3QoMjAwKVxuICAgICAgKTtcblxuICAgICAgY29uc3QgcmVzcG9uc2VzID0gYXdhaXQgUHJvbWlzZS5hbGwocmVxdWVzdHMpO1xuICAgICAgXG4gICAgICByZXNwb25zZXMuZm9yRWFjaChyZXNwb25zZSA9PiB7XG4gICAgICAgIGV4cGVjdChyZXNwb25zZS5ib2R5KS50b0VxdWFsKHsgc3RhdHVzOiAnb2snIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSk7Il19