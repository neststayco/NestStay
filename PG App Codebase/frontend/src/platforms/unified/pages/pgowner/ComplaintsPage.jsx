import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getComplaints, updateComplaintStatus } from '@shared/api/complaints'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS = {
  pending:  'New',
  approved: 'Acknowledged',
  rejected: 'Dismissed',
}

const TYPE_LABELS = {
  food:        'Food',
  cleanliness: 'Cleanliness',
  security:    'Security',
  management:  'Management',
  other:       'Other',
}

function RelativeTime({ isoString }) {
  return (
    <span title={absoluteDate(isoString)} className="text-xs text-gray-400 whitespace-nowrap">
      {relativeTime(isoString)}
    </span>
  )
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
      ))}
    </tr>
  )
}

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'New' },
  { value: 'approved', label: 'Acknowledged' },
  { value: 'rejected', label: 'Dismissed' },
]

export default function OwnerComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const statusFilter = searchParams.get('status') || ''
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
  const page         = parseInt(searchParams.get('page') || '1', 10)

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [pagination, setPagination] = useState({})
  const [acting, setActing]         = useState(null)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getComplaints({
        status:      statusFilter || undefined,
        verifiedOnly: verifiedOnly ? 'true' : undefined,
        page,
        limit: 15,
      })
      setComplaints(res.data)
      setPagination(res.pagination || {})
    } catch {
      setError('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, verifiedOnly, page])

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

  async function handleAction(id, status) {
    const prev = complaints
    setActing(id + status)
    // Optimistic update
    setComplaints(list => list.map(c => c._id === id ? { ...c, status } : c))
    try {
      await updateComplaintStatus(id, { status })
      toast(status === 'approved' ? 'Complaint acknowledged' : 'Complaint dismissed', 'success')
    } catch (err) {
      // Roll back on failure
      setComplaints(prev)
      toast(err.response?.data?.message || 'Action failed — please try again', 'error')
    } finally {
      setActing(null)
    }
  }

  const showingFrom = pagination.totalItems
    ? ((pagination.currentPage - 1) * (pagination.limit || 15)) + 1 : 0
  const showingTo = pagination.totalItems
    ? Math.min(pagination.currentPage * (pagination.limit || 15), pagination.totalItems) : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <OfflineBanner />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <p className="text-gray-500 text-sm mt-1">Complaints about your PG. Acknowledge resolved ones or dismiss invalid ones.</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => updateParams({ status: tab.value })}
            className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-[#222121] text-white'
                : 'bg-white border border-[#e0e0e0] text-[#6c757d] hover:border-[#027fff]'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <label className="flex items-center gap-2 ml-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={e => updateParams({ verifiedOnly: e.target.checked ? 'true' : '' })}
            className="w-4 h-4 accent-action"
          />
          <span className="text-sm text-gray-600">Verified residents only</span>
        </label>

        {pagination.totalItems !== undefined && (
          <span className="ml-auto text-sm text-gray-400">
            {pagination.totalItems} total
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={fetchComplaints} className="text-sm font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {pagination.totalItems > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          Showing {showingFrom}–{showingTo} of {pagination.totalItems} complaints
        </p>
      )}

      <div className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Flags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Filed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
                : complaints.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-gray-400 text-sm font-medium">No complaints found</p>
                      <p className="text-gray-300 text-xs mt-1">
                        {statusFilter || verifiedOnly ? 'Try a different filter' : 'No complaints filed for your PG yet'}
                      </p>
                    </td>
                  </tr>
                )
                : complaints.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 capitalize whitespace-nowrap">
                      {TYPE_LABELS[c.type] || c.type}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[240px]">
                      <p className="truncate" title={c.description}>{c.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.isVerifiedResident && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Verified</span>
                        )}
                        {c.isAnonymous && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Anon</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RelativeTime isoString={c.createdAt} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleAction(c._id, 'approved')}
                            disabled={!!acting}
                            className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-[10px] disabled:opacity-50 transition-colors"
                          >
                            {acting === c._id + 'approved' ? '…' : 'Acknowledge'}
                          </button>
                          <button
                            onClick={() => handleAction(c._id, 'rejected')}
                            disabled={!!acting}
                            className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-[10px] disabled:opacity-50 transition-colors"
                          >
                            {acting === c._id + 'rejected' ? '…' : 'Dismiss'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
