import React, { useEffect, useRef } from 'react';
import type { TranscriptMessage as TranscriptMessageType } from '../types';
import { EmptyState } from './EmptyState';
import { TranscriptMessage } from './TranscriptMessage';

interface TranscriptBoxProps {
  messages: TranscriptMessageType[];
  onClear: () => void;
}

export const TranscriptBox: React.FC<TranscriptBoxProps> = ({ messages, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 bg-white rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="text-sm text-aws-blue hover:text-amazon-orange transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message, index) => (
            <TranscriptMessage key={`${message.timestamp}-${index}`} message={message} />
          ))
        )}
      </div>
    </div>
  );
};
