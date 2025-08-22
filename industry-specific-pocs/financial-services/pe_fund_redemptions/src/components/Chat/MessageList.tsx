import React from 'react';
import { Box } from '@mui/material';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Message } from '../../types/message';

interface MessageListProps {
  messages: Message[];
  streamingResponse: string;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  streamingResponse, 
  isLoading, 
  messagesEndRef 
}) => {
  return (
    <Box sx={{ 
      flex: 1, 
      overflow: 'auto',
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      '&::-webkit-scrollbar': {
        width: 6,
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 3,
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(0, 0, 0, 0.2)',
      },
    }}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {streamingResponse && (
        <>
          {console.log('Rendering streaming response:', streamingResponse)}
          <MessageBubble 
            message={{
              id: 'streaming',
              text: streamingResponse,
              isUser: false,
              timestamp: new Date()
            }}
            isStreaming
          />
        </>
      )}
      
      {isLoading && !streamingResponse && (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Box sx={{ 
            width: 36, 
            height: 36, 
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 18,
            flexShrink: 0
          }}>
            🤖
          </Box>
          <Box sx={{ 
            flex: 1,
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{
              p: 2,
              borderRadius: 2.25,
              borderBottomLeftRadius: 0.75,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}>
              <TypingIndicator />
            </Box>
          </Box>
        </Box>
      )}
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
