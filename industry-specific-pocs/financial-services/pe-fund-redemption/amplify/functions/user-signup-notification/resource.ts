import { defineFunction } from '@aws-amplify/backend';

export const userSignupNotification = defineFunction({
  name: 'user-signup-notification',
  entry: './handler.mjs',
  runtime: 20,
  timeoutSeconds: 30,
  // no env here; we set it from backend.ts on the lambda construct
});
