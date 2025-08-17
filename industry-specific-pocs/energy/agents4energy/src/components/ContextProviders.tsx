'use client';
import { Authenticator } from '@aws-amplify/ui-react';
import { UserAttributesProvider } from '@/components/UserAttributesProvider';

/** @see https://nextui.org/docs/frameworks/nextjs#setup-provider */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      <UserAttributesProvider>
        {/* <NextUIProvider>
        <I18nProvider locale="en" messages={[enMessages]}> */}
        {children}
        {/* </I18nProvider>
      </NextUIProvider> */}
      </UserAttributesProvider>
    </Authenticator.Provider>
  )
}