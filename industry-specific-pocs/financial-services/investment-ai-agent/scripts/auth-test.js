#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-west-2' });

const cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = 'us-west-2_5qOe1Cfz5';
const CLIENT_ID = 'p762ogjhlaubi8vl4tac8blsc';
const USERNAME = 'testuser';
const PASSWORD = 'TestPass123!';

async function authenticateUser() {
  try {
    console.log('🔐 Authenticating user...');
    
    const params = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: USERNAME,
        PASSWORD: PASSWORD
      }
    };

    const result = await cognito.adminInitiateAuth(params).promise();
    
    if (result.AuthenticationResult) {
      const accessToken = result.AuthenticationResult.AccessToken;
      const idToken = result.AuthenticationResult.IdToken;
      
      console.log('✅ Authentication successful!');
      console.log('\n📋 Tokens:');
      console.log('Access Token:', accessToken.substring(0, 50) + '...');
      console.log('ID Token:', idToken.substring(0, 50) + '...');
      
      console.log('\n🧪 Testing API with authentication...');
      await testApiWithAuth(idToken, accessToken);
      
    } else {
      console.log('❌ Authentication failed - no tokens received');
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
    if (error.code === 'NotAuthorizedException') {
      console.log('\n💡 Try resetting the user password:');
      console.log(`aws cognito-idp admin-set-user-password --user-pool-id ${USER_POOL_ID} --username ${USERNAME} --password ${PASSWORD} --permanent`);
    }
  }
}

async function testApiWithAuth(idToken, accessToken) {
  const https = require('https');
  const url = require('url');
  
  console.log('\n🧪 Testing health endpoint (no auth required)...');
  await makeApiRequest('', 'No Auth', '/api/v1/health');
  
  console.log('\n🧪 Testing protected endpoint with ID Token...');
  await makeApiRequest(`Bearer ${idToken}`, 'ID Token', '/api/v1/ideas');
  
  console.log('\n🧪 Testing protected endpoint with Access Token...');
  await makeApiRequest(`Bearer ${accessToken}`, 'Access Token', '/api/v1/ideas');
}

async function makeApiRequest(token, tokenType, endpoint = '/api/v1/health') {
  const https = require('https');
  const url = require('url');
  
  const apiUrl = `https://fflo4lgd6d.execute-api.us-west-2.amazonaws.com/v1${endpoint}`;
  const parsedUrl = url.parse(apiUrl);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = token;
  }
  
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'GET',
    headers: headers
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 ${tokenType} Response (${res.statusCode}):`, data);
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ ${tokenType} API request error:`, error.message);
      reject(error);
    });
    
    req.end();
  });
}

// Run the authentication test
authenticateUser();