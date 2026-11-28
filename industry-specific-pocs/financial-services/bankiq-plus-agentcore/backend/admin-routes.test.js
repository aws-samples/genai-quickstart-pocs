import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'module';
import request from 'supertest';

// /api/admin/* needs a valid Cognito ID token AND membership in the admins
// group (cognito:groups claim). jsonwebtoken.verify is mocked the same way as
// in auth-routes.test.js, so these tests make no network or AWS calls.
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

const CLIENT = 'test-app-client';
const claims = (extra) => ({ sub: 'user-1', token_use: 'id', aud: CLIENT, ...extra });
const TOKENS = {
  admin: claims({ 'cognito:groups': ['admins'] }),
  adminAndOther: claims({ 'cognito:groups': ['readers', 'admins'] }),
  noGroups: claims({}),
  otherGroup: claims({ 'cognito:groups': ['readers'] }),
  emptyGroups: claims({ 'cognito:groups': [] }),
  stringGroup: claims({ 'cognito:groups': 'admins' }), // not an array: rejected
  caseMismatch: claims({ 'cognito:groups': ['Admins'] }),
};

const ADMIN_ROUTES = [
  ['get', '/api/admin/cache-stats', undefined],
  ['post', '/api/admin/clear-cache', { type: 'all' }],
];

let app;

beforeAll(async () => {
  delete process.env.AUTH_ENABLED;
  delete process.env.ADMIN_GROUP_NAME;
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = 'us-east-1_testpool';
  process.env.COGNITO_APP_CLIENT_ID = CLIENT;
  vi.spyOn(jwt, 'verify').mockImplementation((token, getKey, opts, cb) => {
    if (TOKENS[token]) cb(null, TOKENS[token]);
    else cb(new Error('invalid signature'));
  });
  const mod = await import('./server.js');
  app = mod.default || mod;
});

afterAll(() => {
  vi.restoreAllMocks();
});

function call(method, path, body, token) {
  let req = request(app)[method](path);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
}

describe.each(ADMIN_ROUTES)('%s %s', (method, path, body) => {
  it('returns 401 without a token', async () => {
    const res = await call(method, path, body);
    expect(res.status).toBe(401);
  });

  it.each(['noGroups', 'otherGroup', 'emptyGroups', 'stringGroup', 'caseMismatch'])(
    'returns 403 for a valid token with %s',
    async (token) => {
      const res = await call(method, path, body, token);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Admin access required' });
    }
  );

  it.each(['admin', 'adminAndOther'])('returns 200 for a member of admins (%s)', async (token) => {
    const res = await call(method, path, body, token);
    expect(res.status).toBe(200);
  });
});

describe('admin route behavior for admins', () => {
  it('GET /api/admin/cache-stats returns per-cache metric blocks', async () => {
    const res = await call('get', '/api/admin/cache-stats', undefined, 'admin');
    expect(res.status).toBe(200);
    for (const key of ['sec', 'fdic', 'search']) {
      expect(res.body[key]).toHaveProperty('hitRate');
      expect(res.body[key]).toHaveProperty('hits');
      expect(res.body[key]).toHaveProperty('misses');
    }
  });

  it('POST /api/admin/clear-cache rejects an invalid cache type with 400', async () => {
    const res = await call('post', '/api/admin/clear-cache', { type: 'bogus' }, 'admin');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid cache type. Use: sec, fdic, search, or all' });
  });

  it('POST /api/admin/clear-cache clears a valid cache type', async () => {
    const res = await call('post', '/api/admin/clear-cache', { type: 'all' }, 'admin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'all cache cleared successfully' });
  });
});

describe('non-admins keep access to normal /api routes', () => {
  it('POST /api/search-banks returns 200 for a user with no groups', async () => {
    const res = await call('post', '/api/search-banks', { query: 'JPM' }, 'noGroups');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/jobs/:jobId reaches the handler (404) for a user in another group', async () => {
    const res = await call('get', '/api/jobs/unknown-job', undefined, 'otherGroup');
    expect(res.status).toBe(404);
  });
});

// requireAdmin on its own: the group name comes from ADMIN_GROUP_NAME, and an
// empty value falls back to 'admins' rather than allowing everyone.
describe('requireAdmin configuration', () => {
  const ORIG_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIG_ENV };
  });

  function run(requireAdmin, user) {
    const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
    const next = vi.fn();
    requireAdmin({ user }, res, next);
    return { res, next };
  }

  it.each(['', '   '])('treats ADMIN_GROUP_NAME=%j as "admins", never as allow-all', async (value) => {
    process.env.ADMIN_GROUP_NAME = value;
    const { requireAdmin } = await import('./auth-middleware.js');
    expect(run(requireAdmin, claims({})).res.status).toHaveBeenCalledWith(403);
    expect(run(requireAdmin, claims({ 'cognito:groups': [''] })).res.status).toHaveBeenCalledWith(403);
    expect(run(requireAdmin, claims({ 'cognito:groups': ['admins'] })).next).toHaveBeenCalledTimes(1);
  });

  it('uses a custom ADMIN_GROUP_NAME', async () => {
    process.env.ADMIN_GROUP_NAME = 'ops';
    const { requireAdmin } = await import('./auth-middleware.js');
    expect(run(requireAdmin, claims({ 'cognito:groups': ['ops'] })).next).toHaveBeenCalledTimes(1);
    expect(run(requireAdmin, claims({ 'cognito:groups': ['admins'] })).res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when there is no verified payload', async () => {
    const { requireAdmin } = await import('./auth-middleware.js');
    const { res, next } = run(requireAdmin, undefined);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
