interface HeaderProps {
  region?: string;
  showPreviewBadge?: boolean;
}

export function Header({ region = 'us-east-1', showPreviewBadge = true }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-[#232f3e] to-[#131921] text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-10 h-10 bg-[#ff9900] rounded flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>

          {/* Service Name */}
          <div>
            <h1 className="text-xl font-semibold"></h1>
            <p className="text-sm text-gray-300">Real-Time Translator</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Region Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-gray-300">{region}</span>
          </div>

          {/* Preview Badge */}
          {showPreviewBadge && (
            <span className="px-3 py-1 bg-[#ff9900] text-white text-xs font-semibold rounded">
              PREVIEW
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
