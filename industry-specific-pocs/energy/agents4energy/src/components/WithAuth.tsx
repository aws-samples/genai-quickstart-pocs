import React, { useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { redirect } from 'next/navigation';

export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthProtected(props: P) {
    const { authStatus } = useAuthenticator(context => [context.authStatus]);

    useEffect(() => {
      if (authStatus === 'unauthenticated') {
        redirect('/login')
      }
    }, [authStatus]);

    if (authStatus === 'authenticated') {
      return <Component {...props} />;
    }

    return null;
  };
}
