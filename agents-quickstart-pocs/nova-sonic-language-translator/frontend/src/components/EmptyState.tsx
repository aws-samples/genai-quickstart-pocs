import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'Waiting for audio input',
  subtitle = 'Speak to begin translation',
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="text-gray-400 mb-4">
        {icon || (
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
};
