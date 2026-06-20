import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllAdmissions, decideAdmission } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'
import { SkeletonTable } from '@shared/components/Skeleton'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Admission Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Applicant</p>
              <p className="text-sm font-semibold text-gray-800">{app.userId?.name || '—'}</p>
              <p className="text-xs text-gray-400">{app.userId?.email || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">PG</p>
              <p className="text-sm font-semibold text-gray-800">{app.pgId?.name || '—'}</p>
              <p className="text-xs text-gray-400">{app.pgId?.location?.area}, {app.pgId?.location?.city}</p>
            </div>
          </div>

          {app.moveInNote && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Move-in Note</p>
              <p className="text-sm text-gray-700">{app.moveInNote}</p>
            </div>
          )}

          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
              {app.status}
            </span>
          </div>

          {app.processedBy?.role && (
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Processed by</p>
              <p className="text-sm text-gray-600">{app.processedBy.role === 'admin' ? 'Platform Admin' : 'PG Owner'}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Applied</p>
            <p className="text-sm text-gray-600">{new Date(app.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-[10px] border border-[#e0e0e0] text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          {app.status === 'pending' && (
            <>
              <button onClick={() => handleDecide('rejected')} disabled={loading}
                className="px-4 py-2 text-sm rounded-[10px] bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Saving…' : 'Reject'}
              </button>
              <button onClick={() => handleDecide('approved')} disabled={loading}
                className="px-4 py-2 text-sm rounded-[10px] bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Saving…' : 'Approve'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_TABS = ['', 'pending', 'approved', 'rejected', 'withdrawn']

export default function AdmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get('status') || ''
  const page         = parseInt(searchParams.get('page') || '1', 10)

  const [apps, setApps]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [pagination, setPagination] = useState({})
  const [search, setSearch]         = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const toast = useToast()
  const searchTimer = useRef(null)

  function handleSearchChange(val) {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('page')
        return next
      }, { replace: false })
    }, 350)
  }

  const fetchApps = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()

      const res = await getAllAdmissions(params)
      setApps(res.data ?? [])
      setPagination(res.pagination ?? {})
    } catch {
      setError('Failed to load admission requests')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch, page])

  useEffect(() => { fetchApps() }, [fetchApps])

  function handleUpdated(id, newStatus) {
    setApps(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a))
  }

  function setFilter(updates) {
    setSearchParams(() => {
      const next = new URLSearchParams()
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, String(v))
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admission Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage guest admissions across all PGs</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s ? { status: s } : {})}
            className={`px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${
              statusFilter === s
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

      <div className="relative mb-5 max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-[#e0e0e0] rounded-[10px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {search && (
          <button onClick={() => handleSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
          {loading
            ? <SkeletonTable rows={6} cols={6} />
            : <tbody className="divide-y divide-gray-100">
                {apps.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        No admission requests found
                      </td>
                    </tr>
                  )
                  : apps.map(app => (
                <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{app.userId?.name || '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{app.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <p>{app.pgId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{app.pgId?.location?.city}</p>
                  </td>
                  <td className="px-4 py-3">
                    {app.processedBy?.role ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        app.processedBy.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-action-50 text-action'
                      }`}>
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
                    <button
                      onClick={() => setSelected(app)}
                      className="text-sm font-medium text-action hover:text-action-light transition-colors"
                    >
                      {app.status === 'pending' ? 'Review' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            }
              </tbody>
          }
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50">
            Previous
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50">
            Next
          </button>
        </div>
      )}

      {selected && (
        <ReviewModal app={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  )
}
