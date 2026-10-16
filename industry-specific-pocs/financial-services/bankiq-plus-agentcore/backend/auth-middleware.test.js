import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// auth-middleware reads AUTH_ENABLED and the jwks config at module-load time,
// so we re-import it per scenario after setting env. We lock the three
// pre-jwt control-flow branches that need no token verification:
//   - auth disabled -> next() with no checks
//   - missing Authorization header -> 401
//   - non-Bearer Authorization header -> 401
// The jwt.verify success/failure branches are thin wrappers over the
// `jsonwebtoken` library and are intentionally not tested here (testing them
// would exercise the library's crypto, not our code).

function makeRes() {
  const res = {};
  res.statusCode = 200;
  res.status = vi.fn((code) => { res.statusCode = code; return res; });
  res.json = vi.fn((body) => { res.body = body; return res; });
  return res;
}

describe('verifyToken middleware', () => {
  const ORIG_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIG_ENV };
  });

  it('calls next() without checking a token when AUTH_ENABLED is not "true"', async () => {
    process.env.AUTH_ENABLED = 'false';
    const { verifyToken } = await import('./auth-middleware.js');
    const req = { headers: {} };
    const res = makeRes();
    const next = vi.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header is present (auth enabled)', async () => {
    process.env.AUTH_ENABLED = 'true';
    process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
    const { verifyToken } = await import('./auth-middleware.js');
    const req = { headers: {} };
    const res = makeRes();
    const next = vi.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'No authentication token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the Authorization header is not a Bearer token', async () => {
    process.env.AUTH_ENABLED = 'true';
    process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
    const { verifyToken } = await import('./auth-middleware.js');
    const req = { headers: { authorization: 'Basic abc123' } };
    const res = makeRes();
    const next = vi.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toEqual({ error: 'No authentication token provided' });
    expect(next).not.toHaveBeenCalled();
  });
});
