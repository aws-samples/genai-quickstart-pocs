import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { fetchUserAttributes } from 'aws-amplify/auth';
import Navigation from '../Navigation/Navigation';
import ChatContainer from '../Chat/ChatContainer';

interface AuthenticatedAppProps {
  signOut: () => void;
}

const AuthenticatedApp: React.FC<AuthenticatedAppProps> = ({ signOut }) => {
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const name = attributes.name || attributes.email || 'User';
        setUserName(name);
      } catch (error) {
        console.error('Error fetching user attributes:', error);
        setUserName('User');
      }
    };
    fetchUserData();
  }, []);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation userName={userName} signOut={signOut} />
      <Box sx={{ flex: 1, pt: '64px' }}>
        <ChatContainer userName={userName} />
      </Box>
    </Box>
  );
};

export default AuthenticatedApp;
