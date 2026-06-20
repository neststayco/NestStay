export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-[#e98a76] flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-[#1b1c1c] tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[#73787a] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
