/**
 * End-to-End Integration Tests
 * Tests complete user workflows from start to finish
 */

import request from 'supertest';
import { integrationTestUtils } from './integration-setup';

describe('End-to-End Integration Tests', () => {
  let server: any;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    server = integrationTestUtils.createTestServer();
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

      const registrationResponse = await request(server)
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

      const profileResponse = await request(server)
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

      const uploadResponse = await request(server)
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

      const searchResponse = await request(server)
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

      const ideaResponse = await request(server)
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
      integrationTestUtils.validateInvestmentIdea(firstIdea);

      // Step 6: Retrieve Specific Investment Idea
      console.log('📋 Testing investment idea retrieval...');
      const ideaDetailResponse = await request(server)
        .get(`/api/v1/ideas/${firstIdea.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      integrationTestUtils.validateInvestmentIdea(ideaDetailResponse.body);
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

      const feedbackResponse = await request(server)
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

          const regResponse = await request(server)
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

          const ideaResponse = await request(server)
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
      const token = integrationTestUtils.generateTestToken();

      // Test 1: Invalid investment idea request
      const invalidRequest = {
        parameters: {
          investmentHorizon: 'invalid-horizon',
          riskTolerance: 'invalid-risk',
          sectors: [], // Empty sectors
          minimumConfidence: 2.0 // Invalid confidence > 1
        }
      };

      const errorResponse = await request(server)
        .post('/api/v1/ideas/generate')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidRequest)
        .expect(400);

      integrationTestUtils.validateErrorResponse(errorResponse.body);
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

      const successResponse = await request(server)
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
      const unauthenticatedResponse = await request(server)
        .get('/api/profile')
        .expect(401);

      integrationTestUtils.validateErrorResponse(unauthenticatedResponse.body);

      // Test 2: Request with invalid token
      const invalidTokenResponse = await request(server)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      integrationTestUtils.validateErrorResponse(invalidTokenResponse.body);

      // Test 3: Recovery with valid authentication
      const validToken = integrationTestUtils.generateTestToken();
      const authenticatedResponse = await request(server)
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

      const token = integrationTestUtils.generateTestToken();
      const requestCount = 10;
      const maxAcceptableTime = 5000; // 5 seconds for all requests

      const startTime = Date.now();

      // Create multiple concurrent requests
      const requests = Array(requestCount).fill(null).map((_, index) =>
        request(server)
          .post('/api/web-search/search')
          .set('Authorization', `Bearer ${token}`)
          .send({
            query: `performance test query ${index}`,
            options: { depth: 'basic', maxResults: 5 }
          })
          .expect(200)
      );

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

      const token = integrationTestUtils.generateTestToken();
      const concurrentOperations = 5;

      // Perform concurrent data uploads
      const uploadPromises = Array(concurrentOperations).fill(null).map((_, index) =>
        request(server)
          .post('/api/proprietary-data/upload')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: `Concurrent Test Data ${index}`,
            description: `Test data for concurrency test ${index}`,
            type: 'financial',
            format: 'json',
            data: { testIndex: index, timestamp: Date.now() }
          })
          .expect(200)
      );

      const uploadResults = await Promise.all(uploadPromises);

      // Verify all uploads succeeded and have unique IDs
      const uploadIds = uploadResults.map(result => result.body.uploadId);
      const uniqueIds = new Set(uploadIds);
      
      expect(uniqueIds.size).toBe(concurrentOperations);
      expect(uploadResults).toHaveLength(concurrentOperations);

      // Verify data sources list includes all uploads
      const sourcesResponse = await request(server)
        .get('/api/proprietary-data/sources')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sourcesResponse.body.totalCount).toBeGreaterThanOrEqual(concurrentOperations);

      console.log('✅ Data consistency test passed!');
    });
  });
});