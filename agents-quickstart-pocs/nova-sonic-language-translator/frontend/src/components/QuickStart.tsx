interface QuickStartProps {
  steps?: string[];
}

const defaultSteps = [
  'Open this page in two browser windows',
  'Use the same session ID in both windows',
  'Select different language roles (one English, one Spanish)',
  'Click "Connect to Session" and start speaking',
];

export function QuickStart({ steps = defaultSteps }: QuickStartProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-[#0073bb] text-white text-xs font-semibold rounded-full flex items-center justify-center">
              {index + 1}
            </span>
            <p className="text-sm text-gray-700 leading-6">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
