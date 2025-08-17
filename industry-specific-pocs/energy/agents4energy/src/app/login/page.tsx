'use client';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { redirect } from 'next/navigation';
import React, { useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';

function CustomAuthenticator() {
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (user) {
      redirect('/');
    }
  }, [user]);
  return <Authenticator/>;
  // return <Authenticator components={components} />;
}

// https://docs.amplify.aws/nextjs/build-a-backend/server-side-rendering/nextjs-app-router-server-components/#add-server-authentication-routes
export default function Login() {
  useEffect(() => {
    // Ensure sign-in is completed
    // https://docs.amplify.aws/nextjs/build-a-backend/auth/concepts/external-identity-providers/#required-for-multi-page-applications-complete-external-sign-in-after-redirect
    // Note: We can only use this in client components
    const hubListenerCancel = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signInWithRedirect':
          {
          const user = await getCurrentUser();
          const userAttributes = await fetchUserAttributes();
          console.log('Login (signInWithRedirect): ', {user, userAttributes});
          break;
          }
        case 'signInWithRedirect_failure':
          // handle sign in failure
          console.log('Login (signInWithRedirect_failure): ', payload.data);
          break;
        case 'customOAuthState':
          const state = payload.data; // this will be customState provided on signInWithRedirect function
          console.log('Login (customOAuthState): ', state);
          break;
        case 'signedIn':
          const user = await getCurrentUser();
          const userAttributes = await fetchUserAttributes();
          console.log('Login (signedIn): ', {user, userAttributes});
          break;
        default:
          console.error('Login unhandled auth event:', payload.event);
      }
    });
    return hubListenerCancel;
  })
  return (
    <CustomAuthenticator />
  );
}