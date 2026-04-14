import React from 'react';
import type { TranscriptMessage as TranscriptMessageType } from '../types';
import type { LanguageLocale } from '../types';
import { getLanguageFlag } from '../config/languages';

interface TranscriptMessageProps {
  message: TranscriptMessageType;
}

export const TranscriptMessage: React.FC<TranscriptMessageProps> = ({ message }) => {
  const isOriginal = message.role === 'user';
  const languageFlag = message.language === 'auto' ? '🌐' : getLanguageFlag(message.language as LanguageLocale);
  const roleLabel = isOriginal ? 'ORIGINAL' : 'TRANSLATION';

  return (
    <div
      className={`p-4 rounded-lg mb-3 border ${
        isOriginal
          ? 'bg-white border-gray-300'
          : 'bg-green-50 border-green-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded ${
            isOriginal
              ? 'bg-gray-200 text-gray-700'
              : 'bg-green-200 text-green-800'
          }`}
        >
          {roleLabel}
        </span>
        <span className="text-lg">{languageFlag}</span>
        <span className="text-sm text-gray-600">{message.userId}</span>
      </div>
      <p className="text-gray-900">{message.text}</p>
    </div>
  );
};
