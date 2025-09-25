import React from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';

interface MessageInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  prompt, 
  setPrompt, 
  onSubmit, 
  isLoading 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box sx={{ 
      p: 3, 
      borderTop: '1px solid #e2e8f0',
      background: 'white'
    }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-end',
          background: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: 3,
          p: 1,
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)',
          },
        }}
      >
        <TextField
          multiline
          maxRows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message here..."
          disabled={isLoading}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: 15,
              lineHeight: 1.4,
              color: '#1e293b',
              '& .MuiInputBase-input': {
                padding: '8px 12px',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#64748b',
                opacity: 1,
              },
            },
          }}
          sx={{
            flex: 1,
            '& .MuiInput-root': {
              background: 'transparent',
            },
          }}
        />
        
        <IconButton
          type="submit"
          disabled={isLoading || !prompt.trim()}
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            '&:disabled': {
              opacity: 0.5,
              transform: 'none',
            },
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? (
            <CircularProgress size={16} sx={{ color: 'white' }} />
          ) : (
            <Send sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MessageInput;
