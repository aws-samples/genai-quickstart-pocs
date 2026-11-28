// Placeholder values (committed). src/config.js is generated and gitignored:
//  - cfn/scripts/phase4-frontend.sh (via generate-frontend-config.sh) writes it with
//    your deployment's CloudFront URL and Cognito settings;
//  - if it is missing, scripts/ensure-config.js copies this file to src/config.js so
//    `npm run build`, `npm start` and `npm test` work from a fresh clone. A build made
//    from the placeholders cannot sign anyone in.
export const API_URL = 'https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net';
export const ENVIRONMENT = 'production';
export const CLOUDFRONT_URL = 'https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net';

export const cognitoConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_XXXXXXXXX',
  userPoolWebClientId: 'YOUR_COGNITO_APP_CLIENT_ID',
  oauth: {
    domain: 'YOUR_COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net',
    redirectSignOut: 'https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net',
    responseType: 'code'
  }
};
