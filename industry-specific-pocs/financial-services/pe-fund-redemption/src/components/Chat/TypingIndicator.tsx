import React from 'react';
import { Box } from '@mui/material';

const TypingIndicator: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 0.5, 
      alignItems: 'center',
      mt: 1
    }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            bgcolor: '#64748b',
            borderRadius: '50%',
            animation: 'typing 1.4s infinite ease-in-out',
            animationDelay: `${index * 0.16}s`,
            '@keyframes typing': {
              '0%, 80%, 100%': {
                transform: 'scale(0.8)',
                opacity: 0.5,
              },
              '40%': {
                transform: 'scale(1)',
                opacity: 1,
              },
            },
          }}
        />
      ))}
    </Box>
  );
};

export default TypingIndicator;
