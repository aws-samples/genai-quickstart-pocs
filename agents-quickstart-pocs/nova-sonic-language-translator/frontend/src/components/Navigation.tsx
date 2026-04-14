interface NavigationTab {
  id: string;
  label: string;
  href: string;
}

interface NavigationProps {
  activeTab?: string;
  tabs?: NavigationTab[];
}

const defaultTabs: NavigationTab[] = [
  { id: 'translator', label: 'Real-Time Translator', href: '#translator' },
  { id: 'sessions', label: 'Sessions', href: '#sessions' },
  { id: 'analytics', label: 'Analytics', href: '#analytics' },
];

export function Navigation({ activeTab = 'translator', tabs = defaultTabs }: NavigationProps) {
  return (
    <nav className="bg-[#232f3e] border-b border-gray-700">
      <div className="px-6">
        <ul className="flex gap-6">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <a
                href={tab.href}
                className={`inline-block px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-[#ff9900]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
