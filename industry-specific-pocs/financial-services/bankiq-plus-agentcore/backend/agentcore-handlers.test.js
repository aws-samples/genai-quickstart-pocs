import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createRequire } from 'module';
import { EventEmitter } from 'events';
import request from 'supertest';

// The AgentCore-backed handlers used aws-sdk v2 globals (AWS.config,
// AWS.Signers.V4) after the SDK v3 move and threw ReferenceError. These tests
// drive each handler through the real v3 signer with fake static env
// credentials, and stub https.request so nothing reaches the network.
const require = createRequire(import.meta.url);
const https = require('https');

const ARN = 'arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/test-agent';
let app;
let requestSpy;

function fakeAgentCore(body) {
  return (options, onResponse) => {
    const req = new EventEmitter();
    req.write = () => {};
    req.end = () => {
      setImmediate(() => {
        const res = new EventEmitter();
        res.statusCode = 200;
        res.headers = {};
        onResponse(res);
        res.emit('data', JSON.stringify(body));
        res.emit('end');
      });
    };
    return req;
  };
}

beforeAll(async () => {
  process.env.AUTH_ENABLED = 'false';
  process.env.AGENTCORE_AGENT_ARN = ARN;
  // Fake credentials for the env step of the default provider chain.
  process.env.AWS_ACCESS_KEY_ID = 'AKIDEXAMPLETEST';
  process.env.AWS_SECRET_ACCESS_KEY = 'not-a-real-secret';
  requestSpy = vi.spyOn(https, 'request');
  const mod = await import('./server.js');
  app = mod.default || mod;
});

beforeEach(() => {
  requestSpy.mockReset();
  requestSpy.mockImplementation(fakeAgentCore({ content: [{ text: 'agent says hi' }] }));
});

afterAll(() => {
  vi.restoreAllMocks();
});

function expectSignedCall() {
  expect(requestSpy).toHaveBeenCalledTimes(1);
  const options = requestSpy.mock.calls[0][0];
  expect(options.hostname).toBe('bedrock-agentcore.us-west-2.amazonaws.com');
  expect(options.method).toBe('POST');
  expect(options.path).toBe(`/runtimes/${encodeURIComponent(ARN)}/invocations`);
  expect(options.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLETEST\/\d{8}\/us-west-2\/bedrock-agentcore\/aws4_request/);
  expect(options.headers['x-amz-date']).toMatch(/^\d{8}T\d{6}Z$/);
}

describe('AgentCore handlers sign with SDK v3', () => {
  it('POST /api/invoke-agent returns the agent output', async () => {
    const res = await request(app).post('/api/invoke-agent').send({ inputText: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.output).toBe('agent says hi');
    expectSignedCall();
  });

  it('POST /api/analyze-local-data returns the analysis', async () => {
    const res = await request(app).post('/api/analyze-local-data')
      .send({ data: [{ Bank: 'A', Quarter: '2024-Q1', Value: '1.2' }], baseBank: 'A', peerBanks: ['B'], metric: 'ROA' });
    expect(res.status).toBe(200);
    expect(res.body.analysis).toBe('agent says hi');
    expectSignedCall();
  });

  it('POST /api/jobs/submit completes the job via processJob', async () => {
    const submit = await request(app).post('/api/jobs/submit').send({ inputText: 'hello' });
    expect(submit.status).toBe(200);
    let result;
    for (let i = 0; i < 50; i++) {
      result = await request(app).get(`/api/jobs/${submit.body.jobId}/result`);
      if (result.body.status !== 'pending' && result.body.status !== 'processing') break;
      await new Promise((r) => setTimeout(r, 20));
    }
    expect(result.status).toBe(200);
    expect(result.body.status).toBe('completed');
    expect(result.body.result).toBe('agent says hi');
    expectSignedCall();
  });

  // /api/diagnostics is admin-only, and with AUTH_ENABLED=false there is no
  // verified token, so it is closed here. Its credential reporting through the
  // v3 provider chain is covered with an admin token in
  // diagnostics-debug-on.test.js.
  it('GET /api/diagnostics returns 403 without a verified admin token', async () => {
    const res = await request(app).get('/api/diagnostics');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });
});
