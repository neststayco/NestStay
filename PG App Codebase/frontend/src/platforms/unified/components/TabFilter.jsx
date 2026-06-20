export default function TabFilter({ tabs, value, onChange, badge }) {
  return (
    <div className="inline-flex items-center bg-[#f6f3f2] rounded-full p-1 gap-0.5">
      {tabs.map(tab => {
        const isActive = value === tab.value
        const hasBadge = badge && badge.tabValue === tab.value && badge.count > 0
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-[#1b1c1c] shadow-sm'
                : 'text-[#73787a] hover:text-[#1b1c1c]'
            }`}
          >
            {tab.label}
            {hasBadge && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center leading-none ${
                isActive ? 'bg-amber-100 text-amber-700' : 'bg-amber-400 text-white'
              }`}>
                {badge.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
