import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

// The signer runs fully offline: static credentials are passed in, so the
// default provider chain is never consulted and nothing leaves the process.
const require = createRequire(import.meta.url);
const { signAgentCoreRequest } = require('./agentcore-signer.js');

const STATIC = { accessKeyId: 'AKIDEXAMPLETEST', secretAccessKey: 'not-a-real-secret', sessionToken: 'session-token-test' };
const host = 'bedrock-agentcore.us-west-2.amazonaws.com';
const path = `/runtimes/${encodeURIComponent('arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/test')}/invocations`;

describe('signAgentCoreRequest', () => {
  it('adds SigV4 Authorization, X-Amz-Date and session token headers for bedrock-agentcore', async () => {
    const headers = await signAgentCoreRequest({
      region: 'us-west-2',
      host,
      path,
      headers: { 'Content-Type': 'application/json', 'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': 's'.repeat(40) },
      body: JSON.stringify({ prompt: 'hi' }),
    }, async () => STATIC);

    expect(headers['x-amz-date']).toMatch(/^\d{8}T\d{6}Z$/);
    const day = headers['x-amz-date'].slice(0, 8);
    expect(headers.authorization).toMatch(
      new RegExp(`^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLETEST/${day}/us-west-2/bedrock-agentcore/aws4_request, SignedHeaders=[^,]+, Signature=[0-9a-f]{64}$`)
    );
    const signedHeaders = headers.authorization.match(/SignedHeaders=([^,]+)/)[1].split(';');
    expect(signedHeaders).toEqual(expect.arrayContaining(['host', 'content-type', 'x-amz-date', 'x-amzn-bedrock-agentcore-runtime-session-id']));
    expect(headers['x-amz-security-token']).toBe('session-token-test');
    expect(headers['x-amz-content-sha256']).toMatch(/^[0-9a-f]{64}$/);
    expect(headers.host).toBe(host);
  });
});
