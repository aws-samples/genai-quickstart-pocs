import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import * as awsServerlessExpress from 'aws-serverless-express';
import app from './server';

// Create the server
const server = awsServerlessExpress.createServer(app);

/**
 * Lambda handler for API Gateway events
 */
export const handler = (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log the incoming request
  console.log(`API Gateway event: ${JSON.stringify(event)}`);
  
  // Handle the request
  return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};