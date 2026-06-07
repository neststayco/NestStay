import { useState, useEffect, useCallback, useRef } from 'react'
import { getAllUsers, deactivateUser } from '@shared/api/admin'
import { useToast } from '@shared/components/Toast'
import RelativeTime from '@shared/components/RelativeTime'

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <td key={i} className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded" /></td>
      ))}
    </tr>
  )
}

function DeactivateModal({ user, onClose, onDeactivated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await deactivateUser(user._id)
      toast('User deactivated', 'success')
      onDeactivated(user._id)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Deactivate User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-gray-700">
            Deactivate <strong>{user.name}</strong> ({user.email})?
          </p>
          <p className="text-xs text-gray-400">
            Their account will be disabled and they will be logged out immediately. This can be reversed by re-activating via the database.
          </p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px]">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-[10px]"
          >
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ totalItems: 0, currentPage: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const toast = useToast()
  const searchTimer = useRef(null)

  const load = useCallback(async (searchVal, pageVal) => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllUsers({ page: pageVal, limit: 20, search: searchVal, role: 'user' })
      setUsers(res.data)
      setPagination(res.pagination)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(search, page) }, [load, page])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    setPage(1)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => load(val, 1), 400)
  }

  function handleDeactivated(userId) {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: false } : u))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Loading…' : `${pagination.totalItems} registered user${pagination.totalItems !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or email…"
          className="w-full max-w-sm border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-gray-50"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={() => load(search, page)} className="text-xs font-semibold underline underline-offset-2 hover:no-underline">Retry</button>
        </div>
      )}

      <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
                : users.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <p className="text-gray-400 text-sm font-medium">
                        {search ? 'No users match your search' : 'No users registered yet'}
                      </p>
                    </td>
                  </tr>
                )
                : users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.isActive
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Deactivated</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {user.createdAt ? <RelativeTime timestamp={user.createdAt} /> : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {user.isActive && (
                        <button
                          onClick={() => setDeactivateTarget(user)}
                          className="text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-3.5 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-400 text-xs">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-[#e0e0e0] rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs font-medium"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 border border-[#e0e0e0] rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {deactivateTarget && (
        <DeactivateModal
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onDeactivated={handleDeactivated}
        />
      )}
    </div>
  )
}
