const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-1';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
// Fail closed: token verification is on unless AUTH_ENABLED is explicitly
// 'false' (local development without Cognito only).
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false';

// JWKS client to get Cognito public keys
const client = jwksClient({
  jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  });
}

// Refuse to serve without token checks on anything but loopback, so a
// deployment can never run with AUTH_ENABLED=false.
function assertAuthConfig(host) {
  if (!AUTH_ENABLED && host !== '127.0.0.1') {
    throw new Error(`AUTH_ENABLED=false is only allowed when HOST is 127.0.0.1 (got HOST=${host})`);
  }
}

const verifyToken = (req, res, next) => {
  // If auth is disabled, skip verification
  if (!AUTH_ENABLED) {
    console.log('[Auth] Authentication disabled (AUTH_ENABLED=false) - skipping token verification');
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No token provided');
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, {
    algorithms: ['RS256'],
    issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`
  }, (err, decoded) => {
    if (err) {
      console.log('[Auth] Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.log('[Auth] Token verified for user:', decoded.email || decoded.sub);
    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken, assertAuthConfig };
