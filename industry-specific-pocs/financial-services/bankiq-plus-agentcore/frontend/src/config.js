// Placeholder values. cfn/scripts/phase4-frontend.sh overwrites this file with
// your deployment's CloudFront URL and Cognito settings before it builds the
// frontend, so you do not need to edit it for a scripted deployment.
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
