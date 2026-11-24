import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createRequire } from 'module';
import { EventEmitter } from 'events';
import request from 'supertest';

// Every /api route except the health checks must reject a request without a
// valid Cognito token and reach its handler with one. The token verifier
// (jsonwebtoken.verify), S3 and the PyPDF2 extractor are mocked, so these
// tests make no network or AWS calls. AGENTCORE_AGENT_ARN is left unset, so
// agent-backed handlers fail fast before any AgentCore call.
const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');
const { S3Client } = require('@aws-sdk/client-s3');
const childProcess = require('child_process');

const VALID = 'valid-test-token';
const POOL = 'us-east-1_testpool';

function fakeExtractor() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = {
    write: () => {},
    end: () => {
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from(JSON.stringify({ success: true, bank_name: 'Test Bank', form_type: '10-K', year: 2025 })));
        child.emit('close', 0);
      });
    },
  };
  return child;
}

const pdf = Buffer.from('%PDF-1.4 fake');
const file = { name: 'r.pdf', size: pdf.length, content: pdf.toString('base64') };

// [method, path, body, status the handler returns once past the gate]
const PROTECTED = [
  ['get', '/api/diagnostics', undefined, 500], // AGENTCORE_AGENT_ARN unset -> handler's own 500
  ['post', '/api/chat', {}, 400],
  ['post', '/api/invoke-agent', {}, 400],
  ['post', '/api/store-csv-data', { data: [{ a: 1 }], filename: 'a.csv' }, 200],
  ['post', '/api/analyze-local-data', { data: [], baseBank: 'A', peerBanks: ['B'], metric: 'ROA' }, 500],
  ['post', '/api/upload-pdf', { files: [file] }, 200],
  ['post', '/api/upload-pdf-agent', { files: [] }, 400],
  ['post', '/api/get-sec-filings', { bankName: 'X', cik: 'abc' }, 400],
  ['post', '/api/search-banks', { query: 'JPM' }, 200],
  ['post', '/api/jobs/submit', { inputText: 'hello' }, 200],
  ['get', '/api/jobs/unknown-job', undefined, 404],
  ['get', '/api/jobs/unknown-job/result', undefined, 404],
  ['get', '/api/admin/cache-stats', undefined, 200],
  ['post', '/api/admin/clear-cache', { type: 'all' }, 200],
];

let app;
let verifySpy;
let sendSpy;

beforeAll(async () => {
  delete process.env.AUTH_ENABLED; // default must enforce the token
  delete process.env.AGENTCORE_AGENT_ARN;
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = POOL;
  process.env.UPLOADED_DOCS_BUCKET = 'test-bucket';
  verifySpy = vi.spyOn(jwt, 'verify').mockImplementation((token, getKey, opts, cb) => {
    if (token === VALID) cb(null, { sub: 'user-1', email: 'u@example.com' });
    else cb(new Error('invalid signature'));
  });
  vi.spyOn(childProcess, 'spawn').mockImplementation(fakeExtractor);
  sendSpy = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({});
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

describe('health checks stay open', () => {
  it.each(['/health', '/api/health'])('GET %s returns 200 without a token', async (p) => {
    const res = await request(app).get(p);
    expect(res.status).toBe(200);
  });
});

describe.each(PROTECTED)('%s %s', (method, path, body, okStatus) => {
  it('returns 401 without a token', async () => {
    const res = await call(method, path, body);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'No authentication token provided' });
  });

  it('returns 401 with an invalid token', async () => {
    const res = await call(method, path, body, 'forged');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('reaches the handler with a valid token', async () => {
    const res = await call(method, path, body, VALID);
    expect(res.status).not.toBe(401);
    expect(res.status).toBe(okStatus);
  });
});

describe('token verification', () => {
  it('verifies RS256 tokens against the Cognito user pool issuer', () => {
    const opts = verifySpy.mock.calls.find((c) => c[0] === VALID)[2];
    expect(opts).toEqual({
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.us-east-1.amazonaws.com/${POOL}`,
    });
  });

  it('only writes to S3 for an authenticated upload', () => {
    // One upload-pdf call carried a valid token; the 401 calls never reached S3.
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown /api path without a token', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(401);
  });
});
