export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        ← Prev
      </button>
      <span>Page {page} of {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50 transition-colors"
      >
        Next →
      </button>
    </div>
  )
}
