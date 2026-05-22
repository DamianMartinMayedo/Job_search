export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="flex border-b border-slate-200" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value
        const activeClass = isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.value)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${activeClass}`}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
