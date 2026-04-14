// Language locale type with all 10 supported locales
export type LanguageLocale = 
  | 'en-US' 
  | 'en-GB' 
  | 'en-AU' 
  | 'en-IN' 
  | 'es-US' 
  | 'fr-FR' 
  | 'it-IT' 
  | 'de-DE' 
  | 'pt-BR' 
  | 'hi-IN';

// Language option for dropdowns
export interface LanguageOption {
  code: LanguageLocale;
  name: string;
  flag: string;
}

// Legacy language type (kept for backward compatibility)
export type Language = 'en' | 'es';

// Message role types
export type MessageRole = 'user' | 'assistant';

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Session configuration
export interface SessionConfig {
  callId: string;
  userId: string;
  targetLanguage: LanguageLocale;
}

// Transcript message
export interface TranscriptMessage {
  role: MessageRole;
  language: string;
  userId: string;
  text: string;
  timestamp: number;
}

// WebSocket message types (discriminated union)
export type WebSocketMessage =
  | { type: 'join'; callId: string; userId: string; targetLanguage: LanguageLocale }
  | { type: 'joined'; callId: string; participantCount: number; targetLanguage: LanguageLocale }
  | { type: 'language_detected'; language: LanguageLocale }
  | { type: 'audio'; audioData: string }
  | { type: 'transcript'; role: MessageRole; language: string; userId: string; text: string }
  | { type: 'participant_left'; userId: string }
  | { type: 'leave' }
  | { type: 'interrupted' }
  | { type: 'error'; message: string };
