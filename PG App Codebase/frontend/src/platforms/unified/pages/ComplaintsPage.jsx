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
  other:       'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

function TypeChip({ type }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${TYPE_COLORS[type] || 'bg-gray-100 text-gray-600'}`}>
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
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">{pgName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">ID: {complaint._id}</p>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Type</p>
            <TypeChip type={complaint.type} />
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Filed</p>
            <p className="text-xs font-medium text-gray-700" title={absoluteDate(complaint.createdAt)}>
              {relativeTime(complaint.createdAt)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Submitted by</p>
            <p className="text-xs font-medium text-gray-700">{submitter}</p>
            {!complaint.isAnonymous && complaint.createdBy?.email && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{complaint.createdBy.email}</p>
            )}
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Flags</p>
            <div className="space-y-1">
              {complaint.isAnonymous && <p className="text-xs text-gray-500">Anonymous</p>}
              {complaint.isVerifiedResident && <p className="text-xs text-purple-600 font-medium">✓ Verified resident</p>}
              {!complaint.isAnonymous && !complaint.isVerifiedResident && <p className="text-xs text-gray-400">—</p>}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-4">
            {complaint.description}
          </p>
        </div>

        {complaint.image && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachment</p>
            <img
              src={complaint.image}
              alt="Complaint attachment"
              className="w-full rounded-xl object-cover max-h-48"
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
        {complaint.status === 'pending' && (
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => onAction(complaint._id, 'rejected')}
              disabled={acting}
              className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold py-2.5 rounded-[10px] disabled:opacity-50 transition-colors"
            >
              {acting === 'rejected' ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              onClick={() => onAction(complaint._id, 'approved')}
              disabled={acting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-[10px] disabled:opacity-50 transition-colors"
            >
              {acting === 'approved' ? 'Approving…' : 'Approve'}
            </button>
          </div>
        )}
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600 flex-1">Delete permanently?</p>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 text-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(complaint._id)}
              disabled={deleting}
              className="text-sm px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold rounded-[10px] transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-sm font-medium py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-[10px] transition-colors"
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
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-400">Select a complaint</p>
      <p className="text-xs text-gray-300 mt-1">Click any row to view details and take action</p>
    </div>
  )
}

function MobileModal({ complaint, onClose, onAction, acting, onDelete, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900">Complaint Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
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
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Complaint Resolution</h1>
            <p className="text-gray-500 text-xs mt-0.5">Review and action complaints from guests</p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-yellow-200 whitespace-nowrap">
              {pendingCount} pending
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => updateParams({ status: e.target.value })}
            className="border border-[#e0e0e0] rounded-[10px] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-white"
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
              className="w-4 h-4 accent-action"
            />
            <span className="text-sm text-gray-700">Verified residents only</span>
          </label>

          {(statusFilter || verifiedOnly) && (
            <button onClick={() => setSearchParams({})} className="text-sm text-gray-400 hover:text-gray-700 underline">
              Clear
            </button>
          )}

          {pagination && (
            <span className="ml-auto text-xs text-gray-400">
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
        <div className="w-full md:w-2/5 border-r border-gray-100 overflow-y-auto flex-shrink-0">
          {loading
            ? (
              <div className="animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="px-4 py-3.5 border-b border-gray-100">
                    <SkeletonLine width="w-3/4" height="h-3" className="mb-2" />
                    <SkeletonLine width="w-1/2" height="h-3" />
                  </div>
                ))}
              </div>
            )
            : complaints.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <p className="text-gray-400 text-sm font-medium">No complaints found</p>
                <p className="text-gray-300 text-xs mt-1">
                  {statusFilter || verifiedOnly ? 'Try clearing your filters' : 'All quiet'}
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
                  className={`w-full text-left px-4 py-3.5 border-b border-gray-100 transition-colors ${
                    isSelected ? 'bg-action-50 border-l-2 border-l-action' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{pgName}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <TypeChip type={c.type} />
                    {c.isVerifiedResident && (
                      <span className="text-xs text-purple-600 font-medium">✓ Resident</span>
                    )}
                    {c.isAnonymous && (
                      <span className="text-xs text-gray-400">Anon</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto whitespace-nowrap" title={absoluteDate(c.createdAt)}>
                      {relativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{c.description}</p>
                </button>
              )
            })
          }

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="text-xs px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40">
                ← Prev
              </button>
              <span className="text-xs text-gray-400">Page {pagination.currentPage}/{pagination.totalPages}</span>
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
                className="text-xs px-3 py-1.5 border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40">
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
