export default function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#f6f3f2] flex items-center justify-center mb-4 text-[#73787a]">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-[#1b1c1c] mb-1">{title}</p>
      {description && <p className="text-xs text-[#73787a] max-w-xs">{description}</p>}
    </div>
  )
}
