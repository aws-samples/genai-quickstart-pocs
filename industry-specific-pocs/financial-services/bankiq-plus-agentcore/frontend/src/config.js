// Auto-generated - CloudFront + ECS Backend + Cognito Auth
export const API_URL = 'https://d3ips4uebwo7az.cloudfront.net';
export const ENVIRONMENT = 'production';
export const CLOUDFRONT_URL = 'https://d3ips4uebwo7az.cloudfront.net';

export const cognitoConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_Yg5k3NMAR',
  userPoolWebClientId: '768po13m24fsbhvi03tffjkmkf',
  oauth: {
    domain: 'bankiq-auth-164543933824.auth.us-east-1.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d3ips4uebwo7az.cloudfront.net',
    redirectSignOut: 'https://d3ips4uebwo7az.cloudfront.net',
    responseType: 'code'
  }
};
