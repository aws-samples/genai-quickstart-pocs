// Shared setup for diagnostics-debug-on/off.test.js. DEBUG_MODE is read once
// when server.js loads, so each setting lives in its own test file (vitest
// runs each file in a separate process with pool: 'forks').
import { createRequire } from 'module';
import { vi } from 'vitest';

const require = createRequire(import.meta.url);
const jwt = require('jsonwebtoken');

export const ARN = 'arn:aws:bedrock-agentcore:us-west-2:123456789012:runtime/test-agent';
const CLIENT = 'test-app-client';
const claims = (extra) => ({ sub: 'user-1', token_use: 'id', aud: CLIENT, ...extra });
const TOKENS = {
  admin: claims({ 'cognito:groups': ['admins'] }),
  user: claims({}),
  otherGroup: claims({ 'cognito:groups': ['readers'] }),
};

// Loads server.js with token verification on and jsonwebtoken.verify mocked
// (no JWKS fetch). Fake static env credentials let the default provider chain
// resolve locally; nothing here makes an AWS or network call.
export async function loadServer({ debug }) {
  delete process.env.AUTH_ENABLED;
  delete process.env.ADMIN_GROUP_NAME;
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = 'us-east-1_testpool';
  process.env.COGNITO_APP_CLIENT_ID = CLIENT;
  process.env.AGENTCORE_AGENT_ARN = ARN;
  process.env.AWS_ACCESS_KEY_ID = 'AKIDEXAMPLETEST';
  process.env.AWS_SECRET_ACCESS_KEY = 'not-a-real-secret';
  if (debug) {
    process.env.DEBUG_MODE = 'true';
  } else {
    // server.js turns debug on whenever NODE_ENV is not 'production'.
    process.env.DEBUG_MODE = 'false';
    process.env.NODE_ENV = 'production';
  }
  vi.spyOn(jwt, 'verify').mockImplementation((token, getKey, opts, cb) => {
    if (TOKENS[token]) cb(null, TOKENS[token]);
    else cb(new Error('invalid signature'));
  });
  const mod = await import('./server.js');
  return mod.default || mod;
}
