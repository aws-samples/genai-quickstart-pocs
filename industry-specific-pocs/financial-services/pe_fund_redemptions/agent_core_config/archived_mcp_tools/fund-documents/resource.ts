import { defineFunction } from '@aws-amplify/backend';

export const fundDocuments = defineFunction({
  name: 'fund-documents',
  entry: './handler.py',
  runtime: 'python3.11',
  timeoutSeconds: 120,
  environment: {
    S3_BUCKET: 'tonytrev-ab2'
  }
});
