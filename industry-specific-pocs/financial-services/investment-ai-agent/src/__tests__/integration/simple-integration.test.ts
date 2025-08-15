/**
 * Simple Integration Test
 * Basic integration test to verify the test framework works
 */

import request from 'supertest';
import express from 'express';

describe('Simple Integration Test', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create a simple test app
    app = express();
    app.use(express.json());
    
    // Add basic routes
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.post('/echo', (req, res) => {
      res.status(200).json({ 
        message: 'Echo response',
        body: req.body,
        timestamp: new Date().toISOString()
      });
    });

    app.get('/error', (req, res) => {
      res.status(500).json({ error: 'Test error', message: 'This is a test error' });
    });
  });

  describe('Basic HTTP Operations', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.timestamp).toBe('string');
    });

    it('should echo POST data', async () => {
      const testData = {
        message: 'Hello, World!',
        number: 42,
        array: [1, 2, 3]
      };

      const response = await request(app)
        .post('/echo')
        .send(testData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Echo response');
      expect(response.body).toHaveProperty('body');
      expect(response.body.body).toEqual(testData);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle error responses', async () => {
      const response = await request(app)
        .get('/error')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Test error');
      expect(response.body).toHaveProperty('message', 'This is a test error');
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      // Express default 404 handling
      expect(response.status).toBe(404);
    });
  });

  describe('Request Validation', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express will return 400 for malformed JSON
      expect(response.status).toBe(400);
    });

    it('should handle different content types', async () => {
      const response = await request(app)
        .post('/echo')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ test: 'data' }))
        .expect(200);

      expect(response.body.body).toEqual({ test: 'data' });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const requestCount = 5;
      const requests = Array(requestCount).fill(null).map((_, index) =>
        request(app)
          .get('/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    it('should handle concurrent POST requests', async () => {
      const requestCount = 3;
      const requests = Array(requestCount).fill(null).map((_, index) =>
        request(app)
          .post('/echo')
          .send({ index, message: `Request ${index}` })
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(requestCount);
      responses.forEach((response, index) => {
        expect(response.body.body.index).toBe(index);
        expect(response.body.body.message).toBe(`Request ${index}`);
      });
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.status).toBe('ok');
    });

    it('should handle rapid sequential requests', async () => {
      const requestCount = 10;
      const startTime = Date.now();

      for (let i = 0; i < requestCount; i++) {
        const response = await request(app)
          .get('/health')
          .expect(200);
        
        expect(response.body.status).toBe('ok');
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / requestCount;

      expect(averageTime).toBeLessThan(100); // Average response time < 100ms
    });
  });

  describe('Integration Test Utilities', () => {
    it('should validate test environment', () => {
      expect(process.env.NODE_ENV).toBe('integration-test');
      expect(process.env.AWS_REGION).toBe('us-east-1');
      expect(process.env.JWT_SECRET).toBe('integration-test-jwt-secret');
    });

    it('should have access to global test utilities', () => {
      expect(global.testUtils).toBeDefined();
      expect(typeof global.testUtils.wait).toBe('function');
      expect(typeof global.testUtils.mockDate).toBe('function');
      expect(typeof global.testUtils.generateTestId).toBe('function');
    });

    it('should generate unique test IDs', () => {
      const id1 = global.testUtils.generateTestId();
      const id2 = global.testUtils.generateTestId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test-\d+-[a-z0-9]+$/);
    });

    it('should support async wait utility', async () => {
      const startTime = Date.now();
      await global.testUtils.wait(100);
      const endTime = Date.now();
      
      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
      expect(elapsed).toBeLessThan(200);
    });
  });
});