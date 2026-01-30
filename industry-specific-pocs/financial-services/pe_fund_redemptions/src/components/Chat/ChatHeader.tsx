import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Avatar, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import { Add, Settings, ExpandMore, ExpandLess, SmartToy, Psychology } from '@mui/icons-material';
import { MODEL_OPTIONS, PERSONALITY_OPTIONS, ModelOption, PersonalityOption } from '../../config/agentConfig';

interface ChatHeaderProps {
  onNewChat: () => void;
  isLoading: boolean;
  selectedModel: string;
  selectedPersonality: string;
  onModelChange: (model: string) => void;
  onPersonalityChange: (personality: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  onNewChat, 
  isLoading,
  selectedModel,
  selectedPersonality,
  onModelChange,
  onPersonalityChange
}) => {
  const [expanded, setExpanded] = useState(false);
  const selectedModelOption = MODEL_OPTIONS.find(m => m.id === selectedModel);
  const selectedPersonalityOption = PERSONALITY_OPTIONS.find(p => p.id === selectedPersonality);

  return (
    <Box sx={{ 
      background: '#ff9900',
      color: 'white',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      {/* Main Header */}
      <Box sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ 
              background: '#ffffff',
              width: 48, 
              height: 48,
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            }}>
              <Settings sx={{ fontSize: 24, color: '#000000' }} />
            </Avatar>
            <Box sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              bgcolor: '#10b981',
              borderRadius: '50%',
              border: '2px solid white',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.1)', opacity: 0.7 },
                '100%': { transform: 'scale(1)', opacity: 1 },
              }
            }} />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', color: '#000000' }} onClick={() => setExpanded(!expanded)}>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                lineHeight: 1.2,
                color: '#000000'
              }}>
                Agent Configuration
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  icon={<SmartToy />}
                  label={selectedModelOption?.name || 'Unknown Model'}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem', 
                    height: 24,
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip
                  icon={<Psychology />}
                  label={selectedPersonalityOption?.name || 'Unknown Personality'}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontSize: '0.75rem', 
                    height: 24,
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </Box>
            </Box>
            <IconButton size="small" sx={{ color: '#000000', ml: 1 }}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={onNewChat}
          disabled={isLoading}
          sx={{
            color: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            fontWeight: 600,
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.6)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
            },
            '&:disabled': {
              opacity: 0.5,
            },
            transition: 'all 0.2s ease',
          }}
        >
          New Chat
        </Button>
      </Box>

      {/* Expandable Settings */}
      <Collapse in={expanded}>
        <Box sx={{ 
          px: 3, 
          pb: 3, 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)'
        }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            {/* Model Selection */}
            <FormControl sx={{ minWidth: 200, flex: 1 }} disabled={isLoading}>
              <InputLabel 
                id="model-select-label"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-focused': { color: 'white' }
                }}
              >
                AI Model
              </InputLabel>
              <Select
                labelId="model-select-label"
                value={selectedModel}
                label="AI Model"
                onChange={(e) => onModelChange(e.target.value)}
                size="small"
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    }
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#1e293b',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(139, 92, 246, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(139, 92, 246, 0.4)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {MODEL_OPTIONS.map((model: ModelOption) => (
                  <MenuItem key={model.id} value={model.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                        {model.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {model.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Personality Selection */}
            <FormControl sx={{ minWidth: 200, flex: 1 }} disabled={isLoading}>
              <InputLabel 
                id="personality-select-label"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  '&.Mui-focused': { color: 'white' }
                }}
              >
                Personality
              </InputLabel>
              <Select
                labelId="personality-select-label"
                value={selectedPersonality}
                label="Personality"
                onChange={(e) => onPersonalityChange(e.target.value)}
                size="small"
                sx={{ 
                  color: 'white',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.6)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    }
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'white',
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: '#1e293b',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      '& .MuiMenuItem-root': {
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(139, 92, 246, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(139, 92, 246, 0.4)',
                          }
                        }
                      }
                    }
                  }
                }}
              >
                {PERSONALITY_OPTIONS.map((personality: PersonalityOption) => (
                  <MenuItem key={personality.id} value={personality.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'white' }}>
                        {personality.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {personality.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ChatHeader;
