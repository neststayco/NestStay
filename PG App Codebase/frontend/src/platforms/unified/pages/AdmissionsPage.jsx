import { useState, useEffect, useCallback } from 'react'
import { getAllAdmissions, decideAdmission, revokeAdmission } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  admitted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

function ReviewModal({ app, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function handleDecide(decision) {
    setLoading(true)
    try {
      await decideAdmission(app._id, decision)
      toast(`Guest ${decision}`, 'success')
      onUpdated(app._id, decision)
      onClose()
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error')
      setLoading(false)
    }
  }

  async function handleRevoke() {
    setLoading(true)
    try {
      await revokeAdmission(app._id)
      toast('Admission revoked', 'success')
      onUpdated(app._id, 'rejected')
      onClose()
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Review Admission Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Applicant</p>
            <p className="text-sm font-semibold text-gray-800">{app.userId?.name || '—'}</p>
            <p className="text-sm text-gray-500">{app.userId?.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">PG</p>
            <p className="text-sm font-semibold text-gray-800">{app.pgId?.name || app.pgSnapshot?.name || '—'}</p>
            <p className="text-sm text-gray-500">{app.pgId?.location?.area}, {app.pgId?.location?.city}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Move-in Note</p>
            <p className="text-sm text-gray-700">{app.moveInNote || <span className="text-gray-400 italic">None provided</span>}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
                {app.status}
              </span>
              {app.escalatedAt && app.status === 'pending' && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                  Escalated — team notified
                </span>
              )}
            </div>
          </div>
          {app.processedBy?.role && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Processed by</p>
              <p className="text-sm text-gray-600 capitalize">{app.processedBy.role === 'admin' ? 'Platform Admin' : 'PG Owner'}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Applied</p>
            <p className="text-sm text-gray-600">{new Date(app.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-[10px] border border-[#e0e0e0] text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          {app.status === 'pending' && (
            <>
              <button onClick={() => handleDecide('rejected')} disabled={loading}
                className="px-4 py-2 text-sm rounded-[10px] bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Saving…' : 'Reject'}
              </button>
              <button onClick={() => handleDecide('admitted')} disabled={loading}
                className="px-4 py-2 text-sm rounded-[10px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Saving…' : 'Admit'}
              </button>
            </>
          )}
          {app.status === 'admitted' && (
            <button onClick={handleRevoke} disabled={loading}
              className="px-4 py-2 text-sm rounded-[10px] bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
              {loading ? 'Revoking…' : 'Revoke Admission'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1,2,3,4,5,6].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
      ))}
    </tr>
  )
}

const TABS = ['', 'pending', 'admitted', 'rejected']

export default function AdmissionsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [escalatedCount, setEscalatedCount] = useState(0)

  const fetchApps = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (escalatedOnly) params.escalated = 'true'

      const [res, escalatedRes] = await Promise.all([
        getAllAdmissions(params),
        getAllAdmissions({ escalated: 'true', limit: 1 }),
      ])
      setApps(res.data)
      setPagination(res.pagination)
      setEscalatedCount(escalatedRes.pagination?.totalItems ?? 0)
    } catch {
      setError('Failed to load admission requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, escalatedOnly, page])

  useEffect(() => { fetchApps() }, [fetchApps])

  function handleUpdated(id, newStatus) {
    setApps(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a))
  }

  function handleFilterChange(value) {
    setStatusFilter(value)
    setEscalatedOnly(false)
    setPage(1)
  }

  function handleEscalatedFilter() {
    setEscalatedOnly(true)
    setStatusFilter('')
    setPage(1)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admission Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage guest admission requests across all PGs</p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {escalatedCount > 0 && (
          <button onClick={handleEscalatedFilter}
            className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors flex items-center gap-1.5 ${
              escalatedOnly ? 'bg-action text-white' : 'bg-action-50 border border-action-100 text-action hover:bg-action-100'
            }`}
          >
            ⚠ Escalated
            <span className="bg-action text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
              {escalatedCount}
            </span>
          </button>
        )}
        {TABS.map(s => (
          <button key={s} onClick={() => handleFilterChange(s)}
            className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
              statusFilter === s && !escalatedOnly
                ? 'bg-[#222121] text-white'
                : 'bg-white border border-[#e0e0e0] text-[#6c757d] hover:border-[#027fff]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Applicant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">PG</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Via</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Applied</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
              : apps.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {escalatedOnly ? 'No escalated admissions' : 'No admission requests found'}
                  </td>
                </tr>
              )
              : apps.map(app => (
                <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {app.userId?.name || '—'}
                      {app.escalatedAt && app.status === 'pending' && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded" title="Owner hasn't responded — team notified">
                          {escalatedOnly
                            ? `Escalated ${Math.floor((Date.now() - new Date(app.escalatedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago`
                            : 'Escalated'}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{app.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <p>{app.pgId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{app.pgId?.location?.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    {app.processedBy?.role ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${app.processedBy.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-action-50 text-action'}`}>
                        {app.processedBy.role === 'admin' ? 'Via admin' : 'Via owner'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(app)}
                      className="text-sm text-action hover:text-action-light font-medium">
                      {app.status === 'pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}

      {selected && (
        <ReviewModal app={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  )
}
