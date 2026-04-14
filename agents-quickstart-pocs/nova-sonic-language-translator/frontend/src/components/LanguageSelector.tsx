import React from 'react';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onSelect: (language: Language) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Select Your Role
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* English Loan Officer Button */}
        <button
          type="button"
          onClick={() => onSelect('en')}
          disabled={disabled}
          className={`
            relative flex items-center justify-between p-4 border-2 rounded-lg
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              selectedLanguage === 'en'
                ? 'border-aws-blue bg-blue-50 ring-2 ring-aws-blue ring-opacity-50'
                : 'border-gray-300 bg-white hover:border-aws-blue hover:bg-blue-50'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`
              flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${
                selectedLanguage === 'en'
                  ? 'border-aws-blue bg-aws-blue'
                  : 'border-gray-300 bg-white'
              }
            `}
            >
              {selectedLanguage === 'en' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>🇺🇸</span>
                <span>English Loan Officer</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Speak in English</div>
            </div>
          </div>
        </button>

        {/* Spanish Customer Button */}
        <button
          type="button"
          onClick={() => onSelect('es')}
          disabled={disabled}
          className={`
            relative flex items-center justify-between p-4 border-2 rounded-lg
            transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${
              selectedLanguage === 'es'
                ? 'border-amazon-orange bg-orange-50 ring-2 ring-amazon-orange ring-opacity-50'
                : 'border-gray-300 bg-white hover:border-amazon-orange hover:bg-orange-50'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`
              flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${
                selectedLanguage === 'es'
                  ? 'border-amazon-orange bg-amazon-orange'
                  : 'border-gray-300 bg-white'
              }
            `}
            >
              {selectedLanguage === 'es' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>🇪🇸</span>
                <span>Spanish Customer</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Hablar en español</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
