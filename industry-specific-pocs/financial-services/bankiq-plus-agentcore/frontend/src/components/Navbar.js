import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountBalance } from '@mui/icons-material';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <AccountBalance sx={{ mr: 2, fontSize: '2rem' }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            fontSize: '1.3rem'
          }}
        >
          🏦 Banking Peer Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/')}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              background: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                background: 'rgba(255,255,255,0.15)'
              }
            }}
          >
            🏠 Home
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/peer-analytics')}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              background: location.pathname === '/peer-analytics' ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                background: 'rgba(255,255,255,0.15)'
              }
            }}
          >
            📊 Peer Analytics
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/financial-reports')}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              background: location.pathname === '/financial-reports' ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                background: 'rgba(255,255,255,0.15)'
              }
            }}
          >
            📄 SEC Reports
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;