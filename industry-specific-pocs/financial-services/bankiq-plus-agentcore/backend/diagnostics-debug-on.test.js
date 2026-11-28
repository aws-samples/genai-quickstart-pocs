import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { loadServer } from './diagnostics-test-helpers.js';

// DEBUG_MODE=true: only members of the admins group get the diagnostics
// payload; everyone else gets the same 403 as with debug mode off.
let app;

beforeAll(async () => {
  app = await loadServer({ debug: true });
});

afterAll(() => {
  vi.restoreAllMocks();
});

const get = (token) => {
  const req = request(app).get('/api/diagnostics');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('GET /api/diagnostics with DEBUG_MODE on', () => {
  it('returns 401 without a token', async () => {
    expect((await get()).status).toBe(401);
  });

  it.each(['user', 'otherGroup'])('returns 403 for a signed-in non-admin (%s)', async (token) => {
    const res = await get(token);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('returns the diagnostics payload for an admin', async () => {
    const res = await get('admin');
    expect(res.status).toBe(200);
    expect(res.body.environment.DEBUG_MODE).toBe(true);
    expect(res.body.agent.region).toBe('us-west-2');
    // Credentials come from the SDK v3 default provider chain (env step here).
    expect(res.body.aws.hasCredentials).toBe(true);
  });
});
