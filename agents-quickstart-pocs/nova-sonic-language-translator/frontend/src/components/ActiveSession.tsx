import React from 'react';
import type { Language, LanguageLocale, TranscriptMessage } from '../types';
import { TranscriptBox } from './TranscriptBox';
import { getLanguageName, getLanguageFlag } from '../config/languages';

interface ActiveSessionProps {
  sessionId: string;
  userId: string;
  language: Language;
  targetLanguage: LanguageLocale;
  detectedLanguage: LanguageLocale | null;
  participantCount: number;
  messages: TranscriptMessage[];
  onLeave: () => void;
  onClearTranscript: () => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({
  sessionId,
  userId: _userId,
  language,
  targetLanguage,
  detectedLanguage,
  participantCount,
  messages,
  onLeave,
  onClearTranscript,
}) => {
  const isEnglish = language === 'en';
  const avatarBgColor = isEnglish ? 'bg-blue-100' : 'bg-orange-100';

  // Get target language info
  const targetLangName = getLanguageName(targetLanguage);
  const targetFlag = getLanguageFlag(targetLanguage);

  // Build language direction display
  const languageDirection = detectedLanguage 
    ? `${getLanguageName(detectedLanguage)} → ${targetLangName}`
    : 'Waiting for speech...';

  return (
    <div>
      {/* Session Status Banner */}
      <div className="px-6 py-3 bg-green-50 border-b border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full live-dot"></div>
            <span className="text-sm font-medium text-green-800">Session Active</span>
            <span className="text-sm text-green-700">
              ID: <code className="bg-green-100 px-1.5 py-0.5 rounded text-xs">{sessionId}</code>
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {/* Detected Language Indicator */}
            {detectedLanguage && (
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                🎤 Detected: {getLanguageFlag(detectedLanguage)} {getLanguageName(detectedLanguage)}
              </span>
            )}
            <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
              {participantCount}/2 participants
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current User Info */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${avatarBgColor}`}>
              {targetFlag}
            </div>
            <div>
              <div className="font-medium text-gray-900">Translating to {targetLangName}</div>
              <div className="text-xs text-gray-500">{languageDirection}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="audio-wave h-6 w-20 rounded opacity-80"></div>
            <span className="text-xs font-medium text-amazon-orange bg-orange-50 px-2 py-1 rounded border border-amazon-orange/20">
              ● REC
            </span>
          </div>
        </div>

        {/* Transcript */}
        <div className="mb-6">
          <TranscriptBox messages={messages} onClear={onClearTranscript} />
        </div>

        {/* End Session Button */}
        <button
          onClick={onLeave}
          className="w-full py-2.5 bg-gray-100 text-gray-700 font-medium rounded text-sm hover:bg-gray-200 transition-colors border border-gray-300"
        >
          End Session
        </button>
      </div>
    </div>
  );
};
