import { useState, useEffect, useCallback } from 'react'
import { getComplaints, updateComplaintStatus } from '@shared/api/complaints'
import { useToast } from '@shared/components/Toast'

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

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
      ))}
    </tr>
  )
}

const TABS = ['', 'pending', 'approved', 'rejected']

export default function OwnerComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [acting, setActing] = useState(null)
  const toast = useToast()

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getComplaints({
        status: statusFilter || undefined,
        verifiedOnly: verifiedOnly ? 'true' : undefined,
        page,
        limit: 15,
      })
      setComplaints(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, verifiedOnly, page])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  async function handleAction(id, status) {
    setActing(id + status)
    try {
      await updateComplaintStatus(id, { status })
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c))
      toast(status === 'approved' ? 'Complaint acknowledged' : 'Complaint dismissed', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <p className="text-gray-500 text-sm mt-1">Complaints about your PG. Dismiss ones that have been resolved or are invalid.</p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {TABS.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-[#222121] text-white' : 'bg-white border border-[#e0e0e0] text-[#6c757d] hover:border-[#027fff]'
            }`}
          >
            {s === '' ? 'All' : STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-2 cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={e => { setVerifiedOnly(e.target.checked); setPage(1) }}
            className="w-4 h-4 accent-action"
          />
          <span className="text-sm text-gray-600">Verified residents only</span>
        </label>
        {pagination.totalItems !== undefined && (
          <span className="ml-auto text-sm text-gray-400">{pagination.totalItems} total</span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Flags</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
              : complaints.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No complaints found</td>
                </tr>
              )
              : complaints.map(c => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 capitalize font-medium text-gray-800">{c.type}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[220px]">
                    <p className="truncate">{c.description}</p>
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
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleAction(c._id, 'approved')}
                          disabled={!!acting}
                          className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-[10px] disabled:opacity-50"
                        >
                          {acting === c._id + 'approved' ? '…' : 'Acknowledge'}
                        </button>
                        <button
                          onClick={() => handleAction(c._id, 'rejected')}
                          disabled={!!acting}
                          className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-[10px] disabled:opacity-50"
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

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50"
          >
            &larr; Prev
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  )
}
