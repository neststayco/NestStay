export default function DataCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white border border-[#e0e0e0] rounded-2xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-3.5 border-b border-[#f0f0f0] bg-[#fafafa]">
          <p className="text-xs font-bold text-[#73787a] uppercase tracking-wider">{title}</p>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
