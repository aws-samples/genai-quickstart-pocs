import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

// Function to get the Lambda function URL from Amplify outputs
export const getLambdaFunctionUrl = (): string => {
  const config = Amplify.getConfig();
  const functionUrl = (config as any).custom?.bedrockAgentStreamUrl;
  
  if (!functionUrl) {
    console.error('bedrockAgentStreamUrl not found in custom config');
    return '';
  }
  
  return functionUrl;
};

// Function to make authenticated requests to Lambda Function URL
export const makeAuthenticatedRequest = async (payload: any): Promise<Response> => {
  const functionUrl = getLambdaFunctionUrl();
  
  if (!functionUrl) {
    throw new Error('Lambda function URL not available. Please check your deployment.');
  }

  // Get AWS credentials from Cognito
  const session = await fetchAuthSession();
  const credentials = session.credentials;
  
  if (!credentials) {
    throw new Error('No credentials available. User must be authenticated.');
  }

  console.log('Making authenticated request to:', functionUrl);

  // Import AWS SDK signing utilities
  const { SignatureV4 } = await import('@aws-sdk/signature-v4');
  const { Sha256 } = await import('@aws-crypto/sha256-js');
  
  const url = new URL(functionUrl);
  const body = JSON.stringify(payload);
  
  const sigv4 = new SignatureV4({
    service: 'lambda',
    region: 'us-east-1',
    credentials: {
      accessKeyId: credentials.accessKeyId!,
      secretAccessKey: credentials.secretAccessKey!,
      sessionToken: credentials.sessionToken,
    },
    sha256: Sha256,
  });

  const request = {
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname,
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json',
      'host': url.hostname,
    },
    body,
  };

  const signedRequest = await sigv4.sign(request);
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: signedRequest.headers,
    body: signedRequest.body,
  });

  return response;
};
