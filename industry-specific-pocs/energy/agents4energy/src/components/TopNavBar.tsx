"use client"
import React from 'react';
import { useState, useEffect } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserAttributes } from '@/components/UserAttributesProvider';
import {
  TopNavigation,
  Toggle
} from "@cloudscape-design/components";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import logoSmallTopNavigation from '@/a4e-logo.png';

const TopNavBar = () => {
  // const { signOut, authStatus } = useAuthenticator(context => [context.user, context.authStatus]);
  const { signOut, authStatus } = useAuthenticator(context => [context.user, context.authStatus]);
  // const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const { userAttributes } = useUserAttributes();

  // To support dark mode
  const [useDarkMode, setUseDarkMode] = useState(false);

  useEffect(() => {
    applyMode(useDarkMode ? Mode.Dark : Mode.Light);
  }, [useDarkMode]);

  return (
    <>
      <TopNavigation
        identity={{
          href: "/",
          title: "Agents4Energy - Sample",
          logo: {
            src: logoSmallTopNavigation.src,
            alt: "A4E"
          }
        }}
        utilities={[
          ...(authStatus === 'authenticated' ? [{
            type: "menu-dropdown" as const,
            text: userAttributes?.email || "Customer Name",
            // description: userAttributes?.email || "email@example.com",
            iconName: "user-profile" as const,
            onItemClick: (item: { detail: { id: string } }) => {
              if (item.detail.id === 'signout') signOut()
            },
            items: [
              { id: "signout", text: "Sign out"}
            ]
          }] : [])
        ]}
      />
      <div className='dark-mode-toggle'>
        <Toggle
          onChange={({ detail }) => setUseDarkMode(detail.checked)}
          checked={useDarkMode}
        >
          Dark Mode
        </Toggle>
      </div>
    </>
  );
};

export default TopNavBar;