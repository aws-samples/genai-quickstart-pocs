import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Makes an authenticated request to a Lambda function URL using AWS IAM signing
 * This is a simplified version - in production you'd want proper AWS SigV4 signing
 */
export async function invokeLambdaFunctionUrl(functionUrl: string, payload: any) {
  try {
    const session = await fetchAuthSession();
    const credentials = session.credentials;
    
    if (!credentials) {
      throw new Error('No credentials available. User must be authenticated.');
    }

    // For Lambda Function URLs with AWS_IAM auth, we need to sign the request
    // This is a simplified approach - in production, use proper AWS SigV4 signing
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}`,
        'X-Amz-Security-Token': credentials.sessionToken || '',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
    
  } catch (error) {
    console.error('Error invoking Lambda function URL:', error);
    throw error;
  }
}

/**
 * Alternative: Simple fetch for testing (when auth is temporarily disabled)
 */
export async function invokeLambdaFunctionUrlSimple(functionUrl: string, payload: any) {
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
    
  } catch (error) {
    console.error('Error invoking Lambda function URL:', error);
    throw error;
  }
}
