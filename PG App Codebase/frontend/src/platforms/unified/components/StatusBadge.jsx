const STATUS_STYLES = {
  pending:   'bg-yellow-50 border border-yellow-200 text-yellow-700',
  approved:  'bg-green-50 border border-green-200 text-green-700',
  rejected:  'bg-red-50 border border-red-200 text-red-600',
  withdrawn: 'bg-gray-50 border border-gray-200 text-gray-500',
  new:       'bg-blue-50 border border-blue-200 text-blue-600',
  verified:  'bg-green-50 border border-green-200 text-green-700',
  published: 'bg-green-50 border border-green-200 text-green-700',
}

export function StatusPill({ status, label }) {
  const s = status?.toLowerCase() ?? 'new'
  return (
    <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[s] ?? STATUS_STYLES.new}`}>
      {label || status}
    </span>
  )
}

export default StatusPill
