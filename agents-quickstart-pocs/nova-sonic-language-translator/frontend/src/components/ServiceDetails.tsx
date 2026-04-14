interface ServiceDetailsProps {
  model?: string;
  region?: string;
  languages?: string;
  latency?: string;
  sampleRate?: string;
}

export function ServiceDetails({
  model = 'Nova Sonic 2',
  region = 'us-east-1',
  languages = 'EN ↔ ES',
  latency = '<500ms',
  sampleRate = '16kHz / 24kHz',
}: ServiceDetailsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Model</span>
          <span className="text-sm font-medium text-gray-900">{model}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Region</span>
          <span className="text-sm font-medium text-gray-900">{region}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Languages</span>
          <span className="text-sm font-medium text-gray-900">{languages}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Latency</span>
          <span className="text-sm font-medium text-gray-900">{latency}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Sample Rate</span>
          <span className="text-sm font-medium text-gray-900">{sampleRate}</span>
        </div>
      </div>
    </div>
  );
}
