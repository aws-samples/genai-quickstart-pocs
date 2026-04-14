interface SecurityInfoProps {
  message?: string;
}

const defaultMessage =
  'All audio data is encrypted in transit and processed in compliance with AWS security standards.';

export function SecurityInfo({ message = defaultMessage }: SecurityInfoProps) {
  return (
    <div className="bg-[#232f3e] rounded-lg border border-[#ff9900] p-6">
      <div className="flex items-start gap-3">
        {/* Security Shield Icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-[#ff9900]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Security & Compliance</h3>
          <p className="text-xs text-gray-300 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
