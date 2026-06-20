export default function ModalShell({ title, subtitle, onClose, children, maxWidth = 'max-w-sm' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className={`bg-white rounded-2xl shadow-ambient w-full ${maxWidth}`}>
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-[#f0f0f0]">
            <div>
              {title && <h3 className="font-bold text-[#1b1c1c] text-sm leading-snug">{title}</h3>}
              {subtitle && <p className="text-xs text-[#73787a] mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-[#73787a] hover:text-[#1b1c1c] p-1 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
