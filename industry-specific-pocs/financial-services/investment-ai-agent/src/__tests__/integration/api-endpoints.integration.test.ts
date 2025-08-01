/**
 * Integration tests for API endpoints
 * Tests the complete request-response cycle through the API layer
 */

import request from 'supertest';
import { integrationTestUtils } from './integration-setup';

describe('API Endpoints Integration Tests', () => {
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    server = integrationTestUtils.createTestServer();
    authToken = integrationTestUtils.generateTestToken();
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      const response = await request(server)
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

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        integrationTestUtils.validateApiResponse(response.body, [
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

        const response = await request(server)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        integrationTestUtils.validateErrorResponse(response.body);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login user with valid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'TestPassword123!'
        };

        const response = await request(server)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
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

        const response = await request(server)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        integrationTestUtils.validateErrorResponse(response.body);
      });
    });
  });

  describe('Investment Ideas Endpoints', () => {
    describe('POST /api/v1/ideas/generate', () => {
      it('should generate investment ideas successfully', async () => {
        const requestData = integrationTestUtils.createTestInvestmentIdeaRequest();

        const response = await request(server)
          .post('/api/v1/ideas/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestData)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
          'requestId', 'ideas', 'metadata', 'processingMetrics'
        ]);

        expect(Array.isArray(response.body.ideas)).toBe(true);
        expect(response.body.ideas.length).toBeGreaterThan(0);

        // Validate each investment idea structure
        response.body.ideas.forEach((idea: any) => {
          integrationTestUtils.validateInvestmentIdea(idea);
        });

        // Validate metadata
        expect(response.body.metadata).toHaveProperty('totalIdeasGenerated');
        expect(response.body.metadata).toHaveProperty('confidenceDistribution');

        // Validate processing metrics
        expect(response.body.processingMetrics).toHaveProperty('totalProcessingTime');
        expect(response.body.processingMetrics).toHaveProperty('agentProcessingTimes');
      });

      it('should reject request without authentication', async () => {
        const requestData = integrationTestUtils.createTestInvestmentIdeaRequest();

        const response = await request(server)
          .post('/api/v1/ideas/generate')
          .send(requestData)
          .expect(401);

        integrationTestUtils.validateErrorResponse(response.body);
      });

      it('should validate request parameters', async () => {
        const invalidRequestData = {
          parameters: {
            investmentHorizon: 'invalid-horizon',
            riskTolerance: 'invalid-risk',
            minimumConfidence: 1.5 // Invalid confidence > 1
          }
        };

        const response = await request(server)
          .post('/api/v1/ideas/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidRequestData)
          .expect(400);

        integrationTestUtils.validateErrorResponse(response.body);
      });
    });

    describe('GET /api/v1/ideas/:id', () => {
      it('should retrieve investment idea by ID', async () => {
        const ideaId = 'test-idea-123';

        const response = await request(server)
          .get(`/api/v1/ideas/${ideaId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        integrationTestUtils.validateInvestmentIdea(response.body);
        expect(response.body.id).toBe(ideaId);
      });

      it('should return 404 for non-existent idea', async () => {
        const nonExistentId = 'non-existent-idea-999';

        const response = await request(server)
          .get(`/api/v1/ideas/${nonExistentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        integrationTestUtils.validateErrorResponse(response.body);
      });
    });
  });

  describe('Proprietary Data Endpoints', () => {
    describe('POST /api/proprietary-data/upload', () => {
      it('should upload proprietary data successfully', async () => {
        const testData = integrationTestUtils.createTestProprietaryData();

        const response = await request(server)
          .post('/api/proprietary-data/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testData)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
          'success', 'uploadId', 'metadata'
        ]);

        expect(response.body.success).toBe(true);
        expect(typeof response.body.uploadId).toBe('string');
      });

      it('should validate data format', async () => {
        const invalidData = {
          name: '', // Empty name should be invalid
          type: 'invalid-type',
          data: null
        };

        const response = await request(server)
          .post('/api/proprietary-data/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        integrationTestUtils.validateErrorResponse(response.body);
      });
    });

    describe('GET /api/proprietary-data/sources', () => {
      it('should list proprietary data sources', async () => {
        const response = await request(server)
          .get('/api/proprietary-data/sources')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
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

        const response = await request(server)
          .post('/api/web-search/search')
          .set('Authorization', `Bearer ${authToken}`)
          .send(searchRequest)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
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
          query: '', // Empty query should be invalid
          options: {}
        };

        const response = await request(server)
          .post('/api/web-search/search')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidSearchRequest)
          .expect(400);

        integrationTestUtils.validateErrorResponse(response.body);
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

        const response = await request(server)
          .post('/api/web-search/deep-research')
          .set('Authorization', `Bearer ${authToken}`)
          .send(researchRequest)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
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

        const response = await request(server)
          .post('/api/v1/feedback')
          .set('Authorization', `Bearer ${authToken}`)
          .send(feedbackData)
          .expect(201);

        integrationTestUtils.validateApiResponse(response.body, [
          'success', 'feedback'
        ]);

        expect(response.body.success).toBe(true);
        expect(response.body.feedback).toHaveProperty('id');
        expect(response.body.feedback.rating).toBe(feedbackData.rating);
      });

      it('should validate feedback data', async () => {
        const invalidFeedbackData = {
          rating: 6, // Invalid rating > 5
          category: 'invalid-category',
          type: 'invalid-type'
        };

        const response = await request(server)
          .post('/api/v1/feedback')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidFeedbackData)
          .expect(400);

        integrationTestUtils.validateErrorResponse(response.body);
      });
    });
  });

  describe('User Profile Endpoints', () => {
    describe('GET /api/profile', () => {
      it('should retrieve user profile', async () => {
        const response = await request(server)
          .get('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
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

        const response = await request(server)
          .put('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        integrationTestUtils.validateApiResponse(response.body, [
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
      const response = await request(server)
        .post('/api/v1/ideas/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      integrationTestUtils.validateErrorResponse(response.body);
    });

    it('should handle requests with invalid content type', async () => {
      const response = await request(server)
        .post('/api/v1/ideas/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(400);

      integrationTestUtils.validateErrorResponse(response.body);
    });

    it('should handle requests to non-existent endpoints', async () => {
      const response = await request(server)
        .get('/api/non-existent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Express default 404 handling
      expect(response.status).toBe(404);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(server)
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body).toEqual({ status: 'ok' });
      });
    });
  });
});