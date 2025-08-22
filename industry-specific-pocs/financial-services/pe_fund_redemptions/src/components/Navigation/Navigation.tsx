import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import {
  GitHub,
  Language,
  Logout,
  Psychology,
} from '@mui/icons-material';

interface NavigationProps {
  userName: string;
  signOut: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ userName, signOut }) => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: '#000000',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <Toolbar>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ 
            background: 'linear-gradient(135deg, #ff9500 0%, #ff6b00 100%)',
            width: 36, 
            height: 36,
            boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)',
          }}>
            <Psychology sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 700,
              fontSize: '1.1rem',
              lineHeight: 1.2,
              color: '#f8fafc'
            }}>
              McWade Capital GenAI Fund Redemption Tool
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 500
            }}>
              powered by strands-agents and Amazon Bedrock AgentCore
            </Typography>
          </Box>
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* External Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            href="https://github.com/altanalytics/strands-agentcore-react"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: '#e2e8f0',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-1px)',
                color: '#f8fafc',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <GitHub />
          </IconButton>

          <IconButton
            color="inherit"
            href="https://www.altanalyticsllc.com"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ 
              color: '#e2e8f0',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-1px)',
                color: '#f8fafc',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <Language />
          </IconButton>

          {/* User Info */}
          <Chip
            label={userName}
            variant="outlined"
            sx={{ 
              color: '#f8fafc',
              borderColor: 'rgba(255, 255, 255, 0.4)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              ml: 2,
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
              }
            }}
          />

          {/* Sign Out Button */}
          <Button
            variant="contained"
            color="error"
            startIcon={<Logout />}
            onClick={signOut}
            sx={{ 
              ml: 1,
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
