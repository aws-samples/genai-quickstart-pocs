import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { loadServer } from './diagnostics-test-helpers.js';

// DEBUG_MODE=false (the deployed template): diagnostics stay disabled even for
// admins, and non-admins get the admin 403 rather than the debug-mode one, so
// they cannot tell whether debug mode is on.
let app;

beforeAll(async () => {
  app = await loadServer({ debug: false });
});

afterAll(() => {
  vi.restoreAllMocks();
});

const get = (token) => {
  const req = request(app).get('/api/diagnostics');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('GET /api/diagnostics with DEBUG_MODE off', () => {
  it('returns 401 without a token', async () => {
    expect((await get()).status).toBe(401);
  });

  it.each(['user', 'otherGroup'])('returns the admin 403 for a signed-in non-admin (%s)', async (token) => {
    const res = await get(token);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('returns the debug-mode 403 for an admin', async () => {
    const res = await get('admin');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Diagnostics only available in debug mode' });
  });
});
