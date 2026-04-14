import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import type {
  LanguageLocale,
  ConnectionStatus,
  TranscriptMessage,
  WebSocketMessage,
} from '../types';

interface UseWebSocketConfig {
  url: string;
  onJoined?: (data: { callId: string; participantCount: number }) => void;
  onTranscript?: (message: TranscriptMessage) => void;
  onAudio?: (audioData: string) => void;
  onLanguageDetected?: (language: LanguageLocale) => void;
  onParticipantLeft?: (userId: string) => void;
  onError?: (message: string) => void;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  participantCount: number;
  sessionId: string | null;
  join: (callId: string, userId: string, targetLanguage: LanguageLocale) => void;
  sendAudio: (audioData: string) => void;
  leave: () => void;
}

export function useWebSocket(config: UseWebSocketConfig): UseWebSocketReturn {
  const {
    url,
    onJoined,
    onTranscript,
    onAudio,
    onLanguageDetected,
    onParticipantLeft,
    onError,
  } = config;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false); // Prevent double connection in React Strict Mode

  // Establish WebSocket connection
  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (isConnectingRef.current) {
      return;
    }
    isConnectingRef.current = true;

    // Get auth token and create WebSocket connection
    const connectWebSocket = async () => {
      try {
        // Get current auth session
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        if (!token) {
          console.error('No auth token available');
          setStatus('error');
          if (onError) {
            onError('Authentication required');
          }
          return;
        }

        // Create WebSocket connection with auth token in URL
        setStatus('connecting');
        const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Handle connection open
        ws.onopen = () => {
          console.log('WebSocket connected');
          setStatus('connected');
        };

        // Handle connection close
        ws.onclose = (event) => {
          console.log('WebSocket closed', event.code, event.reason);
          setStatus('disconnected');
          setSessionId(null);
          setParticipantCount(0);
          wsRef.current = null;
        };

        // Handle connection error
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setStatus('error');
          if (onError) {
            onError('WebSocket connection error');
          }
        };

        // Handle incoming messages (will be implemented in next subtask)
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            if (onError) {
              onError('Failed to parse message');
            }
          }
        };
      } catch (error) {
        console.error('Failed to get auth session:', error);
        setStatus('error');
        if (onError) {
          onError('Authentication failed');
        }
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
  }, [url]);

  // Message handler - parse and route incoming messages
  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'joined':
          // Update session ID and participant count
          setSessionId(message.callId);
          setParticipantCount(message.participantCount);
          if (onJoined) {
            onJoined({
              callId: message.callId,
              participantCount: message.participantCount,
            });
          }
          break;

        case 'language_detected':
          // Route language detection to callback
          if (onLanguageDetected) {
            onLanguageDetected(message.language);
          }
          break;

        case 'transcript':
          // Route transcript message to callback
          if (onTranscript) {
            const transcriptMessage: TranscriptMessage = {
              role: message.role,
              language: message.language,
              userId: message.userId,
              text: message.text,
              timestamp: Date.now(),
            };
            onTranscript(transcriptMessage);
          }
          break;

        case 'audio':
          // Route audio data to callback
          if (onAudio) {
            onAudio(message.audioData);
          }
          break;

        case 'interrupted':
          // Handle barge-in interruption - clear audio queue
          console.log('🛑 Barge-in detected - clearing audio queue');
          // The audio playback hook will handle clearing its queue
          // We just need to notify it via a special callback
          if (onAudio) {
            onAudio('__CLEAR_QUEUE__');
          }
          break;

        case 'participant_left':
          // Update participant count and notify
          setParticipantCount((prev) => Math.max(0, prev - 1));
          if (onParticipantLeft) {
            onParticipantLeft(message.userId);
          }
          break;

        case 'error':
          // Route error message to callback
          setStatus('error');
          if (onError) {
            onError(message.message);
          }
          break;

        default:
          console.warn('Unknown message type:', message);
      }
    },
    [onJoined, onLanguageDetected, onTranscript, onAudio, onParticipantLeft, onError]
  );

  // Send join message
  const join = useCallback(
    (callId: string, userId: string, targetLanguage: LanguageLocale) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        if (onError) {
          onError('Cannot join: WebSocket is not connected');
        }
        return;
      }

      const message: WebSocketMessage = {
        type: 'join',
        callId,
        userId,
        targetLanguage,
      };

      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('Sent join message:', message);
      } catch (error) {
        console.error('Failed to send join message:', error);
        if (onError) {
          onError('Failed to send join message');
        }
      }
    },
    [onError]
  );

  // Send audio data
  const sendAudio = useCallback(
    (audioData: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('WebSocket is not connected');
        return;
      }

      const message: WebSocketMessage = {
        type: 'audio',
        audioData,
      };

      try {
        wsRef.current.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send audio data:', error);
        if (onError) {
          onError('Failed to send audio data');
        }
      }
    },
    [onError]
  );

  // Send leave message and close connection
  const leave = useCallback(() => {
    if (!wsRef.current) {
      return;
    }

    if (wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'leave',
      };

      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('Sent leave message');
      } catch (error) {
        console.error('Failed to send leave message:', error);
      }

      // Close the connection
      wsRef.current.close();
    }

    // Reset state
    setSessionId(null);
    setParticipantCount(0);
    setStatus('disconnected');
  }, []);

  return {
    status,
    participantCount,
    sessionId,
    join,
    sendAudio,
    leave,
  };
}
