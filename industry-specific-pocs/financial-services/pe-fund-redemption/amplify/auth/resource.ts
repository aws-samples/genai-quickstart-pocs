import { defineAuth } from '@aws-amplify/backend';
import { userSignupNotification } from '../functions/user-signup-notification/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome! Verify your email',
    },
  },
  userAttributes: {
    fullname: {
      required: true,
    },
  },
  triggers: {
    postConfirmation: userSignupNotification,
    preSignUp: userSignupNotification,
  },
});
