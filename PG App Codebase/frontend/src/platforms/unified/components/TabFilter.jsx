export default function TabFilter({ tabs, value, onChange, badge }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
            value === tab.value
              ? 'bg-action text-white'
              : 'bg-white border border-[#e0e0e0] text-[#6c757d] hover:border-action'
          }`}
        >
          {tab.label}
          {badge && badge.tabValue === tab.value && badge.count > 0 && (
            <span className="ml-1.5 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
              {badge.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
