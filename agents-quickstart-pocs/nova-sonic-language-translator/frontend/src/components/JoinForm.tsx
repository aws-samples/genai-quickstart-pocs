import React, { useState } from 'react';
import { SessionConfig, LanguageLocale } from '../types';
import { SUPPORTED_LANGUAGES } from '../config/languages';

interface JoinFormProps {
  onJoin: (config: SessionConfig) => void;
  isConnecting?: boolean;
}

export const JoinForm: React.FC<JoinFormProps> = ({
  onJoin,
  isConnecting = false,
}) => {
  const [callId, setCallId] = useState('');
  const [userName, setUserName] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<LanguageLocale | null>(null);

  const isFormValid = callId.trim() !== '' && userName.trim() !== '' && targetLanguage !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFormValid && targetLanguage) {
      onJoin({
        callId: callId.trim(),
        userId: userName.trim(),
        targetLanguage: targetLanguage,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Join Translation Session
          </h2>
          <p className="text-sm text-gray-600">
            Connect with another participant for real-time translation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session ID Input */}
          <div>
            <label
              htmlFor="session-id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Session ID
            </label>
            <input
              id="session-id"
              type="text"
              value={callId}
              onChange={(e) => setCallId(e.target.value)}
              disabled={isConnecting}
              placeholder="Enter session ID"
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-aws-blue focus:border-aws-blue
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            />
            <p className="mt-2 text-xs text-gray-500">
              💡 Both participants must use the same session ID to connect
            </p>
          </div>

          {/* Display Name Input */}
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isConnecting}
              placeholder="Enter your name"
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-aws-blue focus:border-aws-blue
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            />
          </div>

          {/* Target Language Selection */}
          <div>
            <label
              htmlFor="target-language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Target Language
            </label>
            <select
              id="target-language"
              value={targetLanguage || ''}
              onChange={(e) => setTargetLanguage(e.target.value as LanguageLocale)}
              disabled={isConnecting}
              className="
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-aws-blue focus:border-aws-blue
                disabled:bg-gray-100 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              <option value="">Select target language</option>
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              🎤 Your speech will be auto-detected and translated to this language
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isConnecting}
              className="
                w-full px-6 py-3 bg-amazon-orange text-white font-semibold rounded-lg
                hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-amazon-orange focus:ring-offset-2
                disabled:bg-gray-300 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {isConnecting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect to Session</span>
              )}
            </button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-aws-blue flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-700 mb-1">How it works:</p>
              <ul className="space-y-1 text-xs">
                <li>• Share the same session ID with your conversation partner</li>
                <li>• Select the language you want to receive translations in</li>
                <li>• Speak naturally - your language will be auto-detected</li>
                <li>• Translation happens in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
