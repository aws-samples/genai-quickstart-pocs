// https://docs.amplify.aws/react/build-a-backend/functions/examples/email-domain-filtering/

import { defineAuth } from '@aws-amplify/backend';
import { preSignUp } from '../functions/preSignUp/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  // // Currently there is a circular dependency issue whith this trigger Caused By: Deployment failed: Error [ValidationError]: Circular dependency between resources: [storage0EC3F24A, auth179371D7, data7552DF31, customStackD2225651, function1351588B]
  // // Possibly related to this issue: https://github.com/aws-amplify/amplify-backend/issues/1850
  // triggers: {   
  //   preSignUp
  // }
});
