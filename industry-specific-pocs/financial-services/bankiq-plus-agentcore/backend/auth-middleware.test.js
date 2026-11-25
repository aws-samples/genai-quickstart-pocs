import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';
import { generateKeyPairSync } from 'crypto';

// auth-middleware reads AUTH_ENABLED and the Cognito config at module-load
// time, so we re-import it per scenario after setting env. Covered:
//   - auth disabled -> next() with no checks
//   - missing / non-Bearer Authorization header -> 401
//   - startup guard (assertAuthConfig)
//   - claim checks with the real jsonwebtoken and a local key: only an ID
//     token issued to COGNITO_APP_CLIENT_ID passes

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

  it('calls next() without checking a token when AUTH_ENABLED is "false"', async () => {
    process.env.AUTH_ENABLED = 'false';
    const { verifyToken } = await import('./auth-middleware.js');
    const req = { headers: {} };
    const res = makeRes();
    const next = vi.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('enforces the token when AUTH_ENABLED is unset (fail closed)', async () => {
    delete process.env.AUTH_ENABLED;
    process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
    const { verifyToken } = await import('./auth-middleware.js');
    const req = { headers: {} };
    const res = makeRes();
    const next = vi.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
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

describe('assertAuthConfig (startup guard)', () => {
  const ORIG_ENV = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...ORIG_ENV };
  });

  it('refuses AUTH_ENABLED=false on a non-loopback host', async () => {
    process.env.AUTH_ENABLED = 'false';
    const { assertAuthConfig } = await import('./auth-middleware.js');
    expect(() => assertAuthConfig('0.0.0.0')).toThrow(/only allowed when HOST is 127.0.0.1/);
  });

  it('allows AUTH_ENABLED=false on 127.0.0.1', async () => {
    process.env.AUTH_ENABLED = 'false';
    const { assertAuthConfig } = await import('./auth-middleware.js');
    expect(() => assertAuthConfig('127.0.0.1')).not.toThrow();
  });

  it('allows any host when auth is enabled with pool and client configured', async () => {
    delete process.env.AUTH_ENABLED;
    process.env.COGNITO_USER_POOL_ID = 'us-east-1_test';
    process.env.COGNITO_APP_CLIENT_ID = 'client-a';
    const { assertAuthConfig } = await import('./auth-middleware.js');
    expect(() => assertAuthConfig('0.0.0.0')).not.toThrow();
  });

  it.each([
    ['pool ID', { COGNITO_APP_CLIENT_ID: 'client-a' }],
    ['app client ID', { COGNITO_USER_POOL_ID: 'us-east-1_test' }],
  ])('refuses to start with auth on and no %s', async (_name, env) => {
    delete process.env.AUTH_ENABLED;
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_APP_CLIENT_ID;
    Object.assign(process.env, env);
    const { assertAuthConfig } = await import('./auth-middleware.js');
    expect(() => assertAuthConfig('0.0.0.0')).toThrow(/COGNITO_USER_POOL_ID or COGNITO_APP_CLIENT_ID is not set/);
  });
});

// Real jsonwebtoken verification against a local RSA key standing in for the
// pool's JWKS (no network): only an ID token issued to our app client passes.
describe('verifyToken claim checks (real jsonwebtoken, local key)', () => {
  const ORIG_ENV = { ...process.env };
  const require = createRequire(import.meta.url);
  const jwt = require('jsonwebtoken');
  const realVerify = jwt.verify;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const POOL = 'us-east-1_testpool';
  const ISS = `https://cognito-idp.us-east-1.amazonaws.com/${POOL}`;
  const sign = (claims) => jwt.sign({ sub: 'user-1', ...claims }, privateKey, { algorithm: 'RS256', issuer: ISS, expiresIn: 300, keyid: 'k1' });

  let verifyToken;

  beforeEach(async () => {
    vi.resetModules();
    delete process.env.AUTH_ENABLED;
    process.env.COGNITO_REGION = 'us-east-1';
    process.env.COGNITO_USER_POOL_ID = POOL;
    process.env.COGNITO_APP_CLIENT_ID = 'client-a';
    // Same verify call, with the local public key in place of the JWKS lookup.
    vi.spyOn(jwt, 'verify').mockImplementation((token, _getKey, opts, cb) => realVerify(token, publicKey, opts, cb));
    ({ verifyToken } = await import('./auth-middleware.js'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...ORIG_ENV };
  });

  async function run(token) {
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    await new Promise((resolve) => {
      res.next = vi.fn(resolve);
      res.json = vi.fn((body) => { res.body = body; resolve(); return res; });
      verifyToken(req, res, res.next);
    });
    return { req, res };
  }

  it('accepts an ID token for the app client and reaches the handler', async () => {
    const { req, res } = await run(sign({ token_use: 'id', aud: 'client-a' }));
    expect(res.next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user.sub).toBe('user-1');
  });

  it('rejects an access token (token_use access, client_id, no aud)', async () => {
    const { res } = await run(sign({ token_use: 'access', client_id: 'client-a' }));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.next).not.toHaveBeenCalled();
  });

  it('rejects an ID token issued to another app client', async () => {
    const { res } = await run(sign({ token_use: 'id', aud: 'client-b' }));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.next).not.toHaveBeenCalled();
  });

  it('rejects a token with the right aud but token_use access', async () => {
    const { res } = await run(sign({ token_use: 'access', aud: 'client-a' }));
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.next).not.toHaveBeenCalled();
  });
});
