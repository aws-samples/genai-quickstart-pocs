import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// server.js exports the Express `app` (it only calls app.listen when run
// directly). These tests opt out of token verification with
// AUTH_ENABLED=false (auth-routes.test.js covers the token gate itself).
// They lock the behavior of the routes that need NO live AWS call:
// health, diagnostics gating, request validation, job 404s, and the admin
// routes staying closed without a verified token.

let app;

beforeAll(async () => {
  process.env.AUTH_ENABLED = 'false';
  // The S3 client is created at import time but never invoked by these routes.
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

describe('cache admin endpoints with auth disabled', () => {
  // No verified token means no admin group, so the admin routes stay closed
  // even in local development. Their behavior for admins is covered in
  // admin-routes.test.js.
  it.each([
    ['get', '/api/admin/cache-stats'],
    ['post', '/api/admin/clear-cache'],
  ])('%s %s returns 403', async (method, path) => {
    const res = await request(app)[method](path).send({ type: 'all' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });
});
