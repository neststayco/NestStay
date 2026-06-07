import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getComplaints } from '@shared/api/complaints'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100  text-green-800  border-green-200',
  rejected: 'bg-red-100    text-red-800    border-red-200',
}

const TYPE_LABELS = {
  food:        '🍽️  Food',
  cleanliness: '🧹  Cleanliness',
  security:    '🔒  Security',
  management:  '👤  Management',
  other:       '📋  Other',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function RelativeTime({ isoString }) {
  return (
    <span title={absoluteDate(isoString)} className="text-xs text-gray-400 whitespace-nowrap">
      {relativeTime(isoString)}
    </span>
  )
}

function ViewModal({ complaint, onClose }) {
  const pgName = complaint.pgId?.name || complaint.pgSnapshot?.name || 'Unknown PG'
  const submitter = complaint.isAnonymous ? 'Anonymous' : (complaint.createdBy?.name || 'Unknown')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Complaint Detail</h2>
            <p className="text-xs text-gray-400 mt-0.5">ID: {complaint._id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">PG</p>
              <p className="text-sm font-semibold text-gray-900">{pgName}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Type</p>
              <p className="text-sm font-semibold text-gray-900">{TYPE_LABELS[complaint.type] || complaint.type}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Submitted by</p>
              <p className="text-sm font-semibold text-gray-900">{submitter}</p>
              {!complaint.isAnonymous && complaint.createdBy?.email && (
                <p className="text-xs text-gray-400">{complaint.createdBy.email}</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Filed</p>
              <p className="text-sm font-semibold text-gray-900">
                <RelativeTime isoString={complaint.createdAt} />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={complaint.status} />
            {complaint.isAnonymous && (
              <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full font-medium">
                🕵️ Anonymous
              </span>
            )}
            {complaint.isVerifiedResident && (
              <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-medium">
                ✓ Verified resident
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-4">
              {complaint.description}
            </p>
          </div>

          {complaint.image && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attached Image</p>
              <img
                src={complaint.image}
                alt="Complaint attachment"
                className="w-full rounded-xl object-cover max-h-48 mb-2"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <a href={complaint.image} target="_blank" rel="noopener noreferrer"
                className="text-sm text-action hover:underline break-all">
                {complaint.image}
              </a>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

export default function ComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const statusFilter  = searchParams.get('status') || ''
  const verifiedOnly  = searchParams.get('verifiedOnly') === 'true'
  const page          = parseInt(searchParams.get('page') || '1', 10)

  const [complaints, setComplaints] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selected, setSelected]     = useState(null)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (verifiedOnly) params.verifiedOnly = 'true'
      const res = await getComplaints(params)
      setComplaints(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, verifiedOnly])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  function updateParams(updates) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== '' && v !== false && v !== null && v !== undefined) next.set(k, String(v))
        else next.delete(k)
      })
      return next
    }, { replace: false })
  }

  function setPage(p) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (p > 1) next.set('page', String(p))
      else next.delete('page')
      return next
    }, { replace: false })
  }

  function clearFilters() {
    setSearchParams({}, { replace: false })
  }

  const pendingCount = complaints.filter((c) => c.status === 'pending').length

  const showingFrom = pagination ? ((pagination.currentPage - 1) * pagination.limit) + 1 : 0
  const showingTo   = pagination ? Math.min(pagination.currentPage * pagination.limit, pagination.totalItems) : 0

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
          <p className="text-gray-500 text-sm mt-0.5">View complaints submitted by verified guests — read only</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1.5 rounded-full border border-yellow-200">
            {pendingCount} pending
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-white"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => updateParams({ verifiedOnly: e.target.checked ? 'true' : '' })}
            className="w-4 h-4 accent-action"
          />
          <span className="text-sm text-gray-700">Verified residents only</span>
        </label>

        {(statusFilter || verifiedOnly) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-gray-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={fetchComplaints} className="text-sm font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {pagination && (
        <p className="text-xs text-gray-400 mb-3">
          {pagination.totalItems === 0
            ? 'No complaints found'
            : `Showing ${showingFrom}–${showingTo} of ${pagination.totalItems} complaints`}
        </p>
      )}

      <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">PG</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Flags</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Filed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => <RowSkeleton key={i} />)
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <p className="text-gray-400 text-sm font-medium">No complaints found</p>
                    <p className="text-gray-300 text-xs mt-1">
                      {statusFilter || verifiedOnly ? 'Try clearing your filters' : 'All quiet — no complaints yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const pgName = c.pgId?.name || c.pgSnapshot?.name || '—'
                  return (
                    <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-gray-900 max-w-[140px]">
                        <span className="block truncate" title={pgName}>{pgName}</span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap capitalize">{c.type}</td>
                      <td className="px-4 py-3.5 text-gray-600 max-w-[220px]">
                        <span className="block truncate" title={c.description}>{c.description}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          {c.isAnonymous && <span className="text-xs text-gray-500">🕵️ Anon</span>}
                          {c.isVerifiedResident && <span className="text-xs text-purple-600 font-medium">✓ Resident</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3.5">
                        <RelativeTime isoString={c.createdAt} />
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelected(c)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-[10px] transition-colors whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="text-sm px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
                className="text-sm px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <ViewModal
          complaint={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
