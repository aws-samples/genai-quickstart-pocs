import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Tabs, Tab, AppBar, Toolbar, Typography, Container, IconButton, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signOut, signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { cognitoConfig } from './config';
import Home from './components/Home';
import PeerAnalytics from './components/PeerAnalytics';
import FinancialReports from './components/FinancialReports';
import Login from './components/Login';

// Configure Amplify v6
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: cognitoConfig.userPoolId,
      userPoolClientId: cognitoConfig.userPoolWebClientId,
      loginWith: {
        oauth: {
          domain: cognitoConfig.oauth.domain,
          scopes: cognitoConfig.oauth.scope,
          redirectSignIn: [cognitoConfig.oauth.redirectSignIn],
          redirectSignOut: [cognitoConfig.oauth.redirectSignOut],
          responseType: cognitoConfig.oauth.responseType
        }
      }
    }
  }
}, {
  ssr: false
});
console.log('[Auth] Amplify configured');

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#A020F0',
    },
    secondary: {
      main: '#8B1A9B',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
    },
  },
});

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a code in the URL (OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('[Auth] OAuth error:', error, urlParams.get('error_description'));
      setLoading(false);
      return;
    }
    
    if (code) {
      console.log('[Auth] OAuth code detected, waiting for token exchange...');
      // Give Amplify time to exchange the code for tokens
      setTimeout(() => {
        checkAuth();
      }, 3000);
    } else {
      checkAuth();
    }
    
    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      console.log('[Auth] Hub event:', payload.event, payload);
      if (payload.event === 'signInWithRedirect' || payload.event === 'signedIn') {
        setTimeout(() => checkAuth(), 1000);
      } else if (payload.event === 'signInWithRedirect_failure') {
        console.error('[Auth] Sign in failed:', payload.data);
        if (payload.data?.error) {
          console.error('[Auth] Error details:', payload.data.error.message, payload.data.error.stack);
        }
        setLoading(false);
      }
    });
    
    return () => hubListener();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await fetchAuthSession();
      console.log('[Auth] Session check:', session);
      
      if (session.tokens?.idToken) {
        console.log('[Auth] User authenticated via Cognito');
        setIsAuthenticated(true);
        
        // Clean up OAuth code from URL after successful auth
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        console.log('[Auth] No valid tokens found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('[Auth] Session check failed:', error.message);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const handleCognitoLogin = () => {
    // Redirect to Cognito Hosted UI
    signInWithRedirect();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('[Auth] Signed out from Cognito');
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
    setIsAuthenticated(false);
    setTabValue(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onCognitoLogin={handleCognitoLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0} sx={{ background: 'linear-gradient(135deg, #A020F0 0%, #8B1A9B 100%)' }}>
          <Toolbar>
            <AccountBalanceIcon sx={{ mr: 2 }} />
            <Typography variant="h4" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              BankIQ+
            </Typography>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Toolbar>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ 
              backgroundColor: '#1e3a8a',
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.8)' },
              '& .Mui-selected': { color: 'white !important' },
              '& .MuiTabs-indicator': { backgroundColor: 'white' }
            }}
          >
            <Tab icon={<AccountBalanceIcon />} label="Home" />
            <Tab icon={<AnalyticsIcon />} label="Peer Analytics" />
            <Tab icon={<AssessmentIcon />} label="Financial Reports" />
          </Tabs>
        </AppBar>
        
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <Home />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <PeerAnalytics />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <FinancialReports />
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;