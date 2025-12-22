/**
 * Integration test setup and utilities
 */

import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import app from '../../api/server';

// Integration test environment setup
beforeAll(async () => {
  // Set integration test environment variables
  process.env.NODE_ENV = 'integration-test';
  process.env.AWS_REGION = 'us-east-1';
  process.env.JWT_SECRET = 'integration-test-jwt-secret';
  process.env.BEDROCK_REGION = 'us-east-1';
  
  // Mock AWS services for integration tests
  // Note: AWS SDK mocks are already set up in the main setup.ts file
});

// Integration test utilities
export const integrationTestUtils = {
  // Create test server instance
  createTestServer: () => app,
  
  // Create authenticated request
  createAuthenticatedRequest: (server: express.Application, token?: string) => {
    const req = request(server);
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    return req;
  },
  
  // Generate test JWT token
  generateTestToken: (payload: any = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({
      userId: 'test-user-123',
      organizationId: 'test-org-456',
      role: 'analyst',
      permissions: ['idea:read', 'idea:write', 'data:upload'],
      ...payload
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // Create test user data
  createTestUser: () => ({
    id: 'test-user-123',
    email: 'test@example.com',
    organizationId: 'test-org-456',
    role: 'analyst',
    preferences: {
      investmentHorizon: 'medium',
      riskTolerance: 'moderate',
      preferredSectors: ['technology', 'healthcare'],
      preferredAssetClasses: ['stocks', 'etfs']
    }
  }),
  
  // Create test investment idea request
  createTestInvestmentIdeaRequest: () => ({
    parameters: {
      investmentHorizon: 'medium',
      riskTolerance: 'moderate',
      sectors: ['technology'],
      assetClasses: ['stocks'],
      minimumConfidence: 0.7,
      maximumIdeas: 5
    },
    context: {
      userPreferences: {
        excludedInvestments: [],
        focusAreas: ['AI', 'cloud computing']
      }
    }
  }),
  
  // Create test proprietary data
  createTestProprietaryData: () => ({
    name: 'Test Market Analysis',
    description: 'Test proprietary market analysis data',
    type: 'financial',
    format: 'json',
    data: {
      companies: [
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          marketCap: 3000000000000,
          revenue: 394000000000,
          peRatio: 28.5
        }
      ],
      marketTrends: [
        {
          trend: 'AI adoption increasing',
          confidence: 0.9,
          timeframe: '2024-2025'
        }
      ]
    }
  }),
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Validate API response structure
  validateApiResponse: (response: any, expectedFields: string[]) => {
    expectedFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
  },
  
  // Validate investment idea structure
  validateInvestmentIdea: (idea: any) => {
    expect(idea).toHaveProperty('id');
    expect(idea).toHaveProperty('title');
    expect(idea).toHaveProperty('description');
    expect(idea).toHaveProperty('rationale');
    expect(idea).toHaveProperty('confidenceScore');
    expect(idea).toHaveProperty('timeHorizon');
    expect(idea).toHaveProperty('potentialReturn');
    expect(idea).toHaveProperty('riskFactors');
    expect(idea).toHaveProperty('supportingData');
    expect(idea).toHaveProperty('complianceConsiderations');
    
    expect(typeof idea.confidenceScore).toBe('number');
    expect(idea.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(idea.confidenceScore).toBeLessThanOrEqual(1);
    
    expect(Array.isArray(idea.riskFactors)).toBe(true);
    expect(Array.isArray(idea.supportingData)).toBe(true);
    expect(Array.isArray(idea.complianceConsiderations)).toBe(true);
  },
  
  // Validate error response structure
  validateErrorResponse: (response: any) => {
    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('message');
    expect(typeof response.error).toBe('string');
    expect(typeof response.message).toBe('string');
  }
};

// Global integration test cleanup
afterAll(async () => {
  // Clean up any resources created during integration tests
  await integrationTestUtils.wait(100);
});

export default integrationTestUtils;