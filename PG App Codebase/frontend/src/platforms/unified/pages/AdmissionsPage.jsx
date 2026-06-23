import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllAdmissions, decideAdmission } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'
import { SkeletonTable } from '@shared/components/Skeleton'

const STATUS_COLORS = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  approved:  'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-600 border border-red-200',
  withdrawn: 'bg-[#f6f3f2] text-[#73787a] border border-[#E5E7EB]',
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
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1b1c1c]">Admission Request</h2>
          <button onClick={onClose} className="text-[#73787a] hover:text-[#1b1c1c] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f6f3f2] rounded-xl p-3">
              <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wider mb-1">Applicant</p>
              <p className="text-sm font-semibold text-[#1b1c1c]">{app.userId?.name || '—'}</p>
              <p className="text-xs text-[#73787a]">{app.userId?.email || '—'}</p>
            </div>
            <div className="bg-[#f6f3f2] rounded-xl p-3">
              <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wider mb-1">PG</p>
              <p className="text-sm font-semibold text-[#1b1c1c]">{app.pgId?.name || '—'}</p>
              <p className="text-xs text-[#73787a]">{app.pgId?.location?.area}, {app.pgId?.location?.city}</p>
            </div>
          </div>

          {app.moveInNote && (
            <div className="bg-[#f6f3f2] rounded-xl p-3">
              <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wider mb-1">Move-in Note</p>
              <p className="text-sm text-[#434849]">{app.moveInNote}</p>
            </div>
          )}

          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[app.status] || 'bg-[#f6f3f2] text-[#73787a]'}`}>
              {app.status}
            </span>
          </div>

          {app.processedBy?.role && (
            <div>
              <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wider mb-1">Processed by</p>
              <p className="text-sm text-[#434849]">{app.processedBy.role === 'admin' ? 'Platform Admin' : 'PG Owner'}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-[#73787a] font-semibold uppercase tracking-wider mb-1">Applied</p>
            <p className="text-sm text-[#434849]">{new Date(app.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#f0f0f0] flex justify-end gap-3">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] transition-colors">
            Cancel
          </button>
          {app.status === 'pending' && (
            <>
              <button onClick={() => handleDecide('rejected')} disabled={loading}
                className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Saving…' : 'Reject'}
              </button>
              <button onClick={() => handleDecide('approved')} disabled={loading}
                className="px-4 py-2 text-sm rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
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
    <div className="p-5 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-[#1b1c1c]">Admission Requests</h1>
        <p className="text-[#73787a] text-sm mt-1">Review and manage guest admissions across all PGs</p>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s ? { status: s } : {})}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#1b1c1c] text-white'
                : 'bg-white border border-[#E5E7EB] text-[#73787a] hover:border-[#e98a76] hover:text-[#1b1c1c]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        {pagination.totalItems !== undefined && (
          <span className="ml-auto text-xs text-[#73787a] bg-[#f6f3f2] px-3 py-1.5 rounded-full font-medium">{pagination.totalItems} total</span>
        )}
      </div>

      <div className="relative mb-5 max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b0b0b0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#fbf9f8] focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] text-[#1b1c1c] placeholder-[#9ca3af] transition-all duration-150"
        />
        {search && (
          <button onClick={() => handleSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#434849] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-[#e0e0e0] overflow-hidden shadow-card">
        <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[#f6f3f2] border-b border-[#e5e5e5]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Applicant</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">PG</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Via</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Applied</th>
              <th className="w-[76px] px-4 py-2" />
            </tr>
          </thead>
          {loading
            ? <SkeletonTable rows={6} cols={6} />
            : <tbody className="divide-y divide-[#e5e5e5]">
                {apps.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">📋</span>
                          <p className="text-sm font-medium text-[#1b1c1c]">No admission requests found</p>
                          <p className="text-xs text-[#73787a]">New admissions will appear here once students apply</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : apps.map(app => (
                <tr key={app._id} className="hover:bg-[#fbf9f8] transition-colors duration-150">
                  <td className="px-4 py-2">
                    <p className="font-semibold text-[#1b1c1c]">{app.userId?.name || '—'}</p>
                    <p className="text-xs text-[#73787a] mt-0.5">{app.userId?.email}</p>
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[#434849]">{app.pgId?.name || '—'}</p>
                    <p className="text-xs text-[#73787a]">{app.pgId?.location?.city}</p>
                  </td>
                  <td className="px-4 py-2">
                    {app.processedBy?.role ? (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        app.processedBy.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-[#fff3ee] text-[#c0431e] border border-[#ffdbd0]'
                      }`}>
                        {app.processedBy.role === 'admin' ? 'Via admin' : 'Via owner'}
                      </span>
                    ) : (
                      <span className="text-xs text-[#73787a]">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[app.status] || 'bg-[#f6f3f2] text-[#73787a]'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#73787a] text-xs">
                    {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2 w-[76px] text-right">
                    <button
                      onClick={() => setSelected(app)}
                      className={`min-w-[52px] text-center text-xs font-semibold transition-colors ${app.status === 'pending' ? 'text-[#e98a76] hover:text-[#c0431e]' : 'text-[#73787a] hover:text-[#1b1c1c]'}`}
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
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-full bg-white hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← Previous
          </button>
          <span className="text-sm text-[#73787a] font-medium">Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages}
            className="px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-full bg-white hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Next →
          </button>
        </div>
      )}

      {selected && (
        <ReviewModal app={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  )
}
