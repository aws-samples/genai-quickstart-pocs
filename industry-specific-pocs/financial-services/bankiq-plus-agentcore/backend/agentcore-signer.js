// SigV4 signing for Bedrock AgentCore runtime invocations (AWS SDK v3).
// Credentials come from the default provider chain (the ECS task role when
// deployed); the provider caches and refreshes them.
const { SignatureV4 } = require('@smithy/signature-v4');
const { Sha256 } = require('@aws-crypto/sha256-js');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

const credentials = defaultProvider();

// Returns the headers for a signed POST https://<host><path>, including
// Authorization, X-Amz-Date and X-Amz-Security-Token (when the credentials
// have a session token).
async function signAgentCoreRequest({ region, host, path, headers, body }, creds = credentials) {
  const signer = new SignatureV4({
    service: 'bedrock-agentcore',
    region,
    credentials: creds,
    sha256: Sha256,
  });
  const signed = await signer.sign({
    method: 'POST',
    protocol: 'https:',
    hostname: host,
    path,
    headers: { host, ...headers },
    body,
  });
  return signed.headers;
}

module.exports = { signAgentCoreRequest, credentials };
