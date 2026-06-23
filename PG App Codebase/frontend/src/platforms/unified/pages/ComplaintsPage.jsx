import { useState, useEffect, useCallback, memo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getComplaints, updateComplaintStatus, deleteComplaint } from '@shared/api/complaints'
import { useToast } from '@shared/components/Toast'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'
import { SkeletonLine } from '@shared/components/Skeleton'

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100  text-green-800  border-green-200',
  rejected: 'bg-red-100    text-red-800    border-red-200',
}

const TYPE_LABELS = {
  food:        'Food',
  cleanliness: 'Cleanliness',
  security:    'Security',
  management:  'Management',
  other:       'Other',
}

const TYPE_COLORS = {
  food:        'bg-orange-100 text-orange-700',
  cleanliness: 'bg-blue-100 text-blue-700',
  security:    'bg-red-100 text-red-700',
  management:  'bg-purple-100 text-purple-700',
  other:       'bg-[#f6f3f2] text-[#73787a]',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status] || 'bg-[#f6f3f2] text-[#434849] border-[#E5E7EB]'}`}>
      {status}
    </span>
  )
}

function TypeChip({ type }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${TYPE_COLORS[type] || 'bg-[#f6f3f2] text-[#434849]'}`}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

const DetailPanel = memo(function DetailPanel({ complaint, onAction, acting, onDelete, deleting }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const pgName = complaint.pgId?.name || complaint.pgSnapshot?.name || 'Unknown PG'
  const submitter = complaint.isAnonymous ? 'Anonymous' : (complaint.createdBy?.name || 'Unknown')

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-[#1b1c1c] text-sm">{pgName}</h2>
            <p className="text-xs text-[#73787a] mt-0.5">ID: {complaint._id}</p>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f6f3f2] rounded-xl p-3">
            <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wide mb-1">Type</p>
            <TypeChip type={complaint.type} />
          </div>
          <div className="bg-[#f6f3f2] rounded-xl p-3">
            <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wide mb-1">Filed</p>
            <p className="text-xs font-medium text-[#434849]" title={absoluteDate(complaint.createdAt)}>
              {relativeTime(complaint.createdAt)}
            </p>
          </div>
          <div className="bg-[#f6f3f2] rounded-xl p-3">
            <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wide mb-1">Submitted by</p>
            <p className="text-xs font-medium text-[#434849]">{submitter}</p>
            {!complaint.isAnonymous && complaint.createdBy?.email && (
              <p className="text-xs text-[#73787a] mt-0.5 truncate">{complaint.createdBy.email}</p>
            )}
          </div>
          <div className="bg-[#f6f3f2] rounded-xl p-3">
            <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wide mb-1">Flags</p>
            <div className="space-y-1">
              {complaint.isAnonymous && <p className="text-xs text-[#73787a]">Anonymous</p>}
              {complaint.isVerifiedResident && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                  Verified resident
                </span>
              )}
              {!complaint.isAnonymous && !complaint.isVerifiedResident && <p className="text-xs text-[#73787a]">—</p>}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-[#1b1c1c] leading-relaxed bg-[#f6f3f2] rounded-xl p-4">
            {complaint.description}
          </p>
        </div>

        {complaint.image && (
          <div>
            <p className="text-xs font-semibold text-[#73787a] uppercase tracking-wide mb-2">Attachment</p>
            <img
              src={complaint.image}
              alt="Complaint attachment"
              className="w-full rounded-xl object-cover max-h-48"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[#f0f0f0] flex-shrink-0">
        {complaint.status === 'pending' && (
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => onAction(complaint._id, 'rejected')}
              disabled={acting}
              className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {acting === 'rejected' ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              onClick={() => onAction(complaint._id, 'approved')}
              disabled={acting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors"
            >
              {acting === 'approved' ? 'Approving…' : 'Approve'}
            </button>
          </div>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[#434849] flex-1">Delete permanently?</p>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-[#f6f3f2] text-[#434849] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(complaint._id)}
              disabled={deleting}
              className="text-sm px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold rounded-xl transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-sm font-medium py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Delete complaint
          </button>
        )}
      </div>
    </div>
  )
})

function EmptyDetail() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-12 h-12 bg-[#f6f3f2] rounded-2xl flex items-center justify-center mb-3">
        <span className="material-symbols-outlined text-[#b0b0b0]" style={{ fontSize: '22px' }}>report</span>
      </div>
      <p className="text-sm font-medium text-[#73787a]">Select a complaint</p>
      <p className="text-xs text-[#b0b0b0] mt-1">Click any row to view details and take action</p>
    </div>
  )
}

function MobileModal({ complaint, onClose, onAction, acting, onDelete, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <h2 className="font-bold text-[#1b1c1c]">Complaint Detail</h2>
          <button onClick={onClose} className="text-[#73787a] hover:text-[#1b1c1c] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DetailPanel complaint={complaint} onAction={onAction} acting={acting} onDelete={onDelete} deleting={deleting} />
        </div>
      </div>
    </div>
  )
}

export default function ComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') || ''
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
  const page         = parseInt(searchParams.get('page') || '1', 10)

  const [complaints, setComplaints] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [acting, setActing]         = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const toast = useToast()

  const selected = complaints.find(c => c._id === selectedId) ?? null

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 20 }
      if (statusFilter) params.status = statusFilter
      if (verifiedOnly) params.verifiedOnly = 'true'
      const res = await getComplaints(params)
      setComplaints(res.data)
      setPagination(res.pagination)
      setSelectedId(id => {
        const stillExists = res.data.some(c => c._id === id)
        return stillExists ? id : null
      })
    } catch {
      setError('Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, verifiedOnly])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  async function handleAction(id, status) {
    setActing(status)
    try {
      await updateComplaintStatus(id, { status })
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c))
      toast(`Complaint ${status}`, 'success')
      if (statusFilter && statusFilter !== status) {
        setComplaints(prev => prev.filter(c => c._id !== id))
        setSelectedId(null)
        setMobileOpen(false)
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error')
    } finally {
      setActing(null)
    }
  }

  async function handleDelete(id) {
    setDeleting(true)
    try {
      await deleteComplaint(id)
      setComplaints(prev => prev.filter(c => c._id !== id))
      setSelectedId(null)
      setMobileOpen(false)
      toast('Complaint deleted', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

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

  const pendingCount = complaints.filter(c => c.status === 'pending').length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#f0f0f0] bg-white flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1b1c1c]">Complaint Resolution</h1>
            <p className="text-[#73787a] text-xs mt-0.5">Review and action complaints from guests</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-yellow-50 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-200 whitespace-nowrap">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => updateParams({ status: e.target.value })}
            className="border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white text-[#434849]"
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
              onChange={e => updateParams({ verifiedOnly: e.target.checked ? 'true' : '' })}
              className="w-4 h-4 accent-[#e98a76]"
            />
            <span className="text-sm text-[#434849]">Verified residents only</span>
          </label>

          {(statusFilter || verifiedOnly) && (
            <button onClick={() => setSearchParams({})} className="text-xs font-semibold text-[#e98a76] hover:text-[#c0431e] transition-colors">
              Clear
            </button>
          )}

          {pagination && (
            <span className="ml-auto text-xs text-[#73787a]">
              {pagination.totalItems === 0 ? 'No results' : `${pagination.totalItems} complaints`}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={fetchComplaints} className="text-sm font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {/* Split panel */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: complaint list */}
        <div className="w-full md:w-2/5 border-r border-[#f0f0f0] overflow-y-auto flex-shrink-0">
          {loading
            ? (
              <div className="animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="px-4 py-2 border-b border-[#e5e5e5]">
                    <SkeletonLine width="w-3/4" height="h-3" className="mb-2" />
                    <SkeletonLine width="w-1/2" height="h-3" />
                  </div>
                ))}
              </div>
            )
            : complaints.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6 gap-2">
                <span className="text-2xl">📭</span>
                <p className="text-sm font-medium text-[#1b1c1c]">No complaints found</p>
                <p className="text-xs text-[#73787a]">
                  {statusFilter || verifiedOnly ? 'Try clearing your filters' : 'All quiet — no complaints submitted'}
                </p>
              </div>
            )
            : complaints.map(c => {
              const pgName = c.pgId?.name || c.pgSnapshot?.name || '—'
              const isSelected = selectedId === c._id
              return (
                <button
                  key={c._id}
                  onClick={() => {
                    setSelectedId(c._id)
                    setMobileOpen(true)
                  }}
                  className={`w-full text-left px-4 py-2 border-b border-[#e5e5e5] transition-colors duration-150 ${
                    isSelected ? 'bg-[#fff3ee] border-l-2 border-l-[#e98a76]' : 'hover:bg-[#fbf9f8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-[#1b1c1c] truncate">{pgName}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <TypeChip type={c.type} />
                    {c.isVerifiedResident && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-green-700 font-medium">
                        <span className="material-symbols-outlined" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Resident
                      </span>
                    )}
                    {c.isAnonymous && (
                      <span className="text-xs text-[#73787a]">Anon</span>
                    )}
                    <span className="text-xs text-[#73787a] ml-auto whitespace-nowrap" title={absoluteDate(c.createdAt)}>
                      {relativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#73787a] mt-1.5 line-clamp-1">{c.description}</p>
                </button>
              )
            })
          }

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="text-xs px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 transition-colors">
                ← Prev
              </button>
              <span className="text-xs text-[#73787a]">Page {pagination.currentPage}/{pagination.totalPages}</span>
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
                className="text-xs px-3 py-1.5 border border-[#E5E7EB] rounded-xl hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Right: detail panel (desktop only) */}
        <div className="hidden md:flex flex-1 min-w-0 bg-white">
          {selected ? (
            <DetailPanel
              complaint={selected}
              onAction={(id, status) => handleAction(id, status)}
              acting={acting}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>

      {/* Mobile modal */}
      {mobileOpen && selected && (
        <div className="md:hidden">
          <MobileModal
            complaint={selected}
            onClose={() => setMobileOpen(false)}
            onAction={(id, status) => handleAction(id, status)}
            acting={acting}
            onDelete={handleDelete}
            deleting={deleting}
          />
        </div>
      )}
    </div>
  )
}
