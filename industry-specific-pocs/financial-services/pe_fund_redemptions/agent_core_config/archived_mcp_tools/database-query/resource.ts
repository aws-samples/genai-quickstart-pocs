import { defineFunction } from '@aws-amplify/backend';

export const databaseQuery = defineFunction({
  name: 'database-query',
  entry: './handler.py',
  runtime: 'python3.11',
  timeoutSeconds: 120,
  environment: {
    MYSQL_LAMBDA_FUNCTION: 'MSSqlConnect'
  }
});
