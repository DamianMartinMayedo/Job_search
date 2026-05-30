export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="flex border-b border-[#EAEAEA]" role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value
        const activeClass = isActive
          ? 'border-[#111111] text-[#111111]'
          : 'border-transparent text-[#787774] hover:text-[#111111] hover:border-[#EAEAEA]'

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
