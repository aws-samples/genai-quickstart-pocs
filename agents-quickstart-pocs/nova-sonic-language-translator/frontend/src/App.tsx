import { useState } from 'react';
import {
  Header,
  Navigation,
  Breadcrumb,
  Footer,
  JoinForm,
  ActiveSession,
  ServiceDetails,
  QuickStart,
  SecurityInfo,
} from './components';
import { useWebSocket, useAudioCapture, useAudioPlayback } from './hooks';
import type { SessionConfig, TranscriptMessage, LanguageLocale } from './types';
import { DEFAULT_LANGUAGE } from './config/languages';

function App() {
  // Sub-task 12.1: Application state management
  // Manage session state (joined/not joined)
  const [isJoined, setIsJoined] = useState(false);
  
  // Store session config
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  
  // Store messages
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  
  // Store participant count
  const [participantCount, setParticipantCount] = useState(0);

  // Store detected language from auto-detection
  const [detectedLanguage, setDetectedLanguage] = useState<LanguageLocale | null>(null);

  // Sub-task 12.2: Integrate hooks
  // Get WebSocket URL - use relative path for CloudFront deployment
  // CloudFront will route /ws to the ALB backend
  const getWebSocketUrl = () => {
    // For local development, use environment variable if provided
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    // For production (CloudFront), use relative path with dynamic protocol
    // This ensures all requests go through the same domain (no CORS)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  };
  const wsUrl = getWebSocketUrl();

  // Initialize useWebSocket with callbacks
  const { status, join, sendAudio, leave } = useWebSocket({
    url: wsUrl,
    onJoined: (data) => {
      console.log('Joined session:', data);
      setParticipantCount(data.participantCount);
    },
    onTranscript: (message) => {
      console.log('Received transcript:', message);
      setMessages((prev) => [...prev, message]);
    },
    onAudio: (audioData) => {
      console.log('Received audio data');
      playAudio(audioData);
    },
    onLanguageDetected: (language: LanguageLocale) => {
      console.log('Language detected:', language);
      setDetectedLanguage(language);
    },
    onParticipantLeft: (userId) => {
      console.log('Participant left:', userId);
      setParticipantCount((prev) => Math.max(0, prev - 1));
    },
    onError: (message) => {
      console.error('WebSocket error:', message);
      alert(`Error: ${message}`);
    },
  });

  // Initialize useAudioPlayback
  const { queueAudio: playAudio, stopPlayback } = useAudioPlayback();

  // Initialize useAudioCapture with WebSocket
  useAudioCapture({
    enabled: isJoined,
    onAudioData: (audioData) => {
      sendAudio(audioData);
    },
    sampleRate: 16000,
  });

  // Sub-task 12.3: Implement session flow
  // Handle join → establish connection → start audio capture
  const handleJoin = (config: SessionConfig) => {
    console.log('Joining session:', config);
    
    // Store session config
    setSessionConfig(config);
    
    // Send join message through WebSocket with targetLanguage
    join(config.callId, config.userId, config.targetLanguage);
    
    // Update joined state (audio capture will start automatically via useAudioCapture hook)
    setIsJoined(true);
  };

  // Handle leave → cleanup → return to JoinForm
  const handleLeave = () => {
    console.log('Leaving session');
    
    // Send leave message and close WebSocket
    leave();
    
    // Stop audio playback
    stopPlayback();
    
    // Reset state
    setIsJoined(false);
    setSessionConfig(null);
    setMessages([]);
    setParticipantCount(0);
    setDetectedLanguage(null);
  };

  // Handle clear transcript
  const handleClearTranscript = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header region="us-east-1" showPreviewBadge={true} />
      <Navigation
        activeTab="translator"
        tabs={[
          { id: 'translator', label: 'Real-Time Translator', href: '#' },
          { id: 'analytics', label: 'Analytics', href: '#' },
          { id: 'settings', label: 'Settings', href: '#' },
        ]}
      />
      <Breadcrumb
        items={[
          { label: 'Amazon Nova Sonic AI Translator', href: '#' },
          { label: 'Real-Time Translator' },
        ]}
      />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {!isJoined ? (
              <JoinForm 
                onJoin={handleJoin} 
                isConnecting={status === 'connecting'} 
              />
            ) : (
              <ActiveSession
                sessionId={sessionConfig?.callId || ''}
                userId={sessionConfig?.userId || ''}
                language={'en'}
                targetLanguage={sessionConfig?.targetLanguage || DEFAULT_LANGUAGE}
                detectedLanguage={detectedLanguage}
                participantCount={participantCount}
                messages={messages}
                onLeave={handleLeave}
                onClearTranscript={handleClearTranscript}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <ServiceDetails
              model="Nova Sonic 2"
              region="us-east-1"
              languages="EN ↔ ES"
              latency="<500ms"
              sampleRate="16kHz / 24kHz"
            />
            <QuickStart
              steps={[
                'Open this page in two browser windows',
                'Use the same session ID in both windows',
                'Select different language roles',
                'Start speaking to begin translation',
              ]}
            />
            <SecurityInfo message="All audio is encrypted in transit and processed in real-time. No data is stored permanently." />
          </div>
        </div>
      </main>

      <Footer showLinks={true} />
    </div>
  );
}

export default App;
