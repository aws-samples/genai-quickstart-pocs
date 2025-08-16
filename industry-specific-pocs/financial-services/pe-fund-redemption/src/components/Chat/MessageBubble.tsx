import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { Person } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types/message';
import { formatTime } from '../../utils/sessionUtils';
import TypingIndicator from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isStreaming }) => {
  const MarkdownMessage = ({ content }: { content: string }) => {
    // Process thinking sections
    const processThinkingSections = (text: string) => {
      // Replace <thinking>...</thinking> with special formatting
      return text.replace(
        /<thinking>([\s\S]*?)<\/thinking>/g,
        (match, thinkingContent) => {
          return `\n\n---\n**🤔 Thinking Process:**\n\n*${thinkingContent.trim()}*\n\n---\n\n`;
        }
      );
    };

    const processedContent = processThinkingSections(content);

    return (
      <ReactMarkdown
        components={{
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return !isInline ? (
              <Box
                component="pre"
                sx={{
                  background: '#1e293b',
                  color: '#e2e8f0',
                  p: 2,
                  borderRadius: 1,
                  my: 1.5,
                  overflow: 'auto',
                  fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                  fontSize: 14,
                  lineHeight: 1.5,
                  border: '1px solid #334155',
                }}
              >
                <code className={className} {...props}>
                  {children}
                </code>
              </Box>
            ) : (
              <Box
                component="code"
                sx={{
                  background: '#f1f5f9',
                  color: '#e11d48',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                  fontSize: '0.9em',
                  border: '1px solid #e2e8f0',
                }}
                {...props}
              >
                {children}
              </Box>
            );
          },
          blockquote: ({ children }) => (
            <Box
              sx={{
                my: 2,
                p: 1.5,
                background: '#f1f5f9',
                borderLeft: '4px solid #059669',
                borderRadius: '0 8px 8px 0',
                fontStyle: 'italic',
                color: '#475569',
              }}
            >
              {children}
            </Box>
          ),
          hr: () => (
            <Box
              sx={{
                my: 2,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #d1d5db, transparent)',
                border: 'none',
              }}
            />
          ),
          em: ({ children }) => (
            <Box
              component="em"
              sx={{
                fontStyle: 'italic',
                color: '#6b7280',
                background: '#f9fafb',
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                border: '1px solid #e5e7eb',
              }}
            >
              {children}
            </Box>
          ),
          ul: ({ children }) => (
            <Box component="ul" sx={{ my: 1.5, pl: 2.5 }}>
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box component="ol" sx={{ my: 1.5, pl: 2.5 }}>
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Box component="li" sx={{ my: 0.5, lineHeight: 1.5 }}>
              {children}
            </Box>
          ),
          h1: ({ children }) => (
            <Typography variant="h4" sx={{ my: 2, fontWeight: 600, color: '#1e293b' }}>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h5" sx={{ my: 1.5, fontWeight: 600, color: '#1e293b' }}>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="h6" sx={{ my: 1, fontWeight: 600, color: '#1e293b' }}>
              {children}
            </Typography>
          ),
          a: ({ href, children }) => (
            <Box
              component="a"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#059669',
                textDecoration: 'none',
                fontWeight: 500,
                borderBottom: '1px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderBottomColor: '#059669',
                  background: 'rgba(5, 150, 105, 0.05)',
                  px: 0.5,
                  py: 0.25,
                  mx: -0.5,
                  my: -0.25,
                  borderRadius: 0.5,
                },
              }}
            >
              {children}
            </Box>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 1.5,
      flexDirection: message.isUser ? 'row-reverse' : 'row',
      animation: 'messageSlideIn 0.3s ease-out',
      '@keyframes messageSlideIn': {
        from: {
          opacity: 0,
          transform: 'translateY(20px)',
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
    }}>
      <Avatar sx={{ 
        width: 36, 
        height: 36,
        background: message.isUser 
          ? '#08aae3'
          : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        flexShrink: 0
      }}>
        {message.isUser ? <Person /> : '🤖'}
      </Avatar>
      
      <Box sx={{ 
        flex: 1,
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: message.isUser ? 'flex-end' : 'flex-start'
      }}>
        <Box sx={{
          p: 2,
          borderRadius: 2.25,
          borderBottomRightRadius: message.isUser ? 0.75 : 2.25,
          borderBottomLeftRadius: message.isUser ? 2.25 : 0.75,
          background: message.isUser 
            ? '#08aae3'
            : '#f8fafc',
          color: message.isUser ? 'white' : '#1e293b',
          border: message.isUser ? 'none' : '1px solid #e2e8f0',
          wordWrap: 'break-word',
          lineHeight: 1.4,
          ...(isStreaming && {
            borderBottom: '2px solid #059669',
          }),
        }}>
          {message.isUser ? (
            <Typography sx={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>
              {message.text}
            </Typography>
          ) : (
            <MarkdownMessage content={message.text} />
          )}
          {isStreaming && <TypingIndicator />}
        </Box>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#64748b',
            mt: 0.5,
            px: 0.5,
            textAlign: message.isUser ? 'right' : 'left'
          }}
        >
          {formatTime(message.timestamp)}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageBubble;
