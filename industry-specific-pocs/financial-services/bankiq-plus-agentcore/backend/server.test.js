import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// server.js exports the Express `app` (it only calls app.listen when run
// directly). AUTH_ENABLED defaults off, so protected routes are reachable.
// These tests lock the behavior of the routes that need NO live AWS call:
// health, diagnostics gating, request validation, job 404s, and cache admin.

let app;

beforeAll(async () => {
  process.env.AUTH_ENABLED = 'false';
  // AWS SDK is configured at import time but never invoked by these routes.
  const mod = await import('./server.js');
  app = mod.default || mod;
});

describe('health endpoints', () => {
  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'healthy', service: 'BankIQ+ Backend' });
  });

  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'healthy', service: 'BankIQ+ Backend' });
  });
});

describe('request validation', () => {
  it('POST /api/chat returns 400 when message is missing', async () => {
    const res = await request(app).post('/api/chat').send({ sessionId: 'x' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing message' });
  });
});

describe('async job lookups', () => {
  it('GET /api/jobs/:jobId returns 404 for an unknown job', async () => {
    const res = await request(app).get('/api/jobs/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Job not found' });
  });

  it('GET /api/jobs/:jobId/result returns 404 for an unknown job', async () => {
    const res = await request(app).get('/api/jobs/does-not-exist/result');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Job not found' });
  });
});

describe('cache admin endpoints', () => {
  it('GET /api/admin/cache-stats returns per-cache metric blocks', async () => {
    const res = await request(app).get('/api/admin/cache-stats');
    expect(res.status).toBe(200);
    for (const key of ['sec', 'fdic', 'search']) {
      expect(res.body).toHaveProperty(key);
      expect(res.body[key]).toHaveProperty('hitRate');
      expect(res.body[key]).toHaveProperty('hits');
      expect(res.body[key]).toHaveProperty('misses');
    }
  });

  it('POST /api/admin/clear-cache rejects an invalid cache type with 400', async () => {
    const res = await request(app).post('/api/admin/clear-cache').send({ type: 'bogus' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Invalid cache type. Use: sec, fdic, search, or all',
    });
  });

  it('POST /api/admin/clear-cache clears a valid cache type', async () => {
    const res = await request(app).post('/api/admin/clear-cache').send({ type: 'all' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'all cache cleared successfully',
    });
  });
});
