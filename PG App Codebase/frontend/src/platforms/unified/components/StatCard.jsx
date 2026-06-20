const SHADOW_CARD = 'rgba(0,0,0,0.08) 0px 4px 10px 0px'

export default function StatCard({ label, value, sub, icon, colorClass, compact, accent }) {
  if (compact) {
    return (
      <div
        className={`rounded-2xl p-4 border ${accent ? 'bg-[#ffdbd0] border-[#f5c5b4]' : 'bg-[#f6f3f2] border-[#E5E7EB]'}`}
        style={{ boxShadow: SHADOW_CARD }}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${accent ? 'text-[#3a0b00]' : 'text-[#73787a]'}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold ${accent ? 'text-[#3a0b00]' : 'text-[#1b1c1c]'}`}>
          {value ?? '—'}
        </p>
        {sub && <p className={`text-xs mt-1 ${accent ? 'text-[#3a0b00]/60' : 'text-[#73787a]'}`}>{sub}</p>}
      </div>
    )
  }

  return (
    <div
      className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col gap-3"
      style={{ boxShadow: SHADOW_CARD }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wider">{label}</p>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass || 'bg-[#f6f3f2] text-[#73787a]'}`}
            style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 2px 6px' }}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-[#1b1c1c] leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-[#73787a] mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}
