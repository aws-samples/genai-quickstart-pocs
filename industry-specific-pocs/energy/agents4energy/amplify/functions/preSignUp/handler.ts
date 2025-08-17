import type { PreSignUpTriggerHandler } from 'aws-lambda';
import { env } from '$amplify/env/preSignUp';

export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = event.request.userAttributes['email'];

  const allowedEmailSuffixes = (env.ALLOWED_EMAIL_SUFFIXES).split(",")

  for (const domainSuffix of allowedEmailSuffixes) {
    if (email.endsWith(domainSuffix)) {
      return event;
    }
  }
  
  throw new Error(`Invalid email domain. Email address ${event.request.userAttributes['email']} does not end with an allowed suffix: ${allowedEmailSuffixes}`);
};