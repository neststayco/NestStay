import { useState, useEffect, useCallback, useRef } from 'react'
import { getAllUsers, deactivateUser } from '@shared/api/admin'
import { useToast } from '@shared/components/Toast'
import RelativeTime from '@shared/components/RelativeTime'
import { SkeletonTable } from '@shared/components/Skeleton'

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
          <h2 className="text-lg font-semibold text-[#1b1c1c]">Deactivate User</h2>
          <button onClick={onClose} className="text-[#73787a] hover:text-[#434849] transition-colors duration-150">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-[#434849]">
            Deactivate <strong>{user.name}</strong> ({user.email})?
          </p>
          <p className="text-xs text-[#73787a]">
            Their account will be disabled and they will be logged out immediately.
            {user.role === 'pg_owner' && (
              <span className="block mt-1 text-amber-700 font-medium">
                This owner's PG listing will also be deactivated and hidden from students.
              </span>
            )}
          </p>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] text-sm font-medium py-2.5 rounded-xl transition-colors duration-200">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors duration-200"
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
  const [roleFilter, setRoleFilter] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const toast = useToast()
  const searchTimer = useRef(null)

  const load = useCallback(async (searchVal, pageVal, roleVal) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: pageVal, limit: 20, search: searchVal }
      if (roleVal) params.role = roleVal
      const res = await getAllUsers(params)
      setUsers(res.data)
      setPagination(res.pagination)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(search, page, roleFilter) }, [load, page, roleFilter])

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      load(val, 1, roleFilter)
    }, 400)
  }

  function handleRoleFilter(val) {
    setRoleFilter(val)
    setPage(1)
  }

  function handleDeactivated(userId) {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: false } : u))
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1b1c1c]">Users</h1>
          <p className="text-[#73787a] text-sm mt-0.5">
            {loading ? 'Loading…' : `${pagination.totalItems} registered account${pagination.totalItems !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or email…"
          className="max-w-sm border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-[#fbf9f8] transition-all duration-150"
        />
        <div className="flex items-center gap-1 bg-[#f6f3f2] rounded-xl p-1">
          {[['', 'All'], ['user', 'Users'], ['pg_owner', 'PG Owners']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => handleRoleFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === val
                  ? 'bg-white text-[#1b1c1c] shadow-sm'
                  : 'text-[#73787a] hover:text-[#434849]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={() => load(search, page, roleFilter)} className="text-xs font-semibold underline underline-offset-2 hover:no-underline">Retry</button>
        </div>
      )}

      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#f6f3f2]">
              <tr className="border-b border-[#e5e5e5]">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">User</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Role</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[#73787a] uppercase tracking-widest">Joined</th>
                <th className="w-[110px] px-4 py-3" />
              </tr>
            </thead>
            {loading
              ? <SkeletonTable rows={8} cols={5} />
              : <tbody className="divide-y divide-[#e5e5e5]">
                  {users.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl">👥</span>
                            <p className="text-sm font-medium text-[#1b1c1c]">
                              {search ? 'No users match your search' : 'No users registered yet'}
                            </p>
                            <p className="text-xs text-[#73787a]">
                              {search ? 'Try a different name or email' : 'Users will appear here after registration'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                    : users.map(user => (
                      <tr key={user._id} className="hover:bg-[#fbf9f8] transition-colors duration-150">
                        <td className="px-4 py-2">
                          <div className="font-medium text-[#1b1c1c]">{user.name}</div>
                          <div className="text-xs text-[#73787a] mt-0.5">{user.email}</div>
                        </td>
                        <td className="px-4 py-2">
                          {user.role === 'pg_owner'
                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">PG Owner</span>
                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">User</span>
                          }
                        </td>
                        <td className="px-4 py-2">
                          {user.isActive
                            ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                            : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">Deactivated</span>
                          }
                        </td>
                        <td className="px-4 py-2 text-[#73787a] text-xs">
                          {user.createdAt ? <RelativeTime timestamp={user.createdAt} /> : '—'}
                        </td>
                        <td className="px-4 py-2 w-[110px] text-right">
                          <button
                            onClick={() => setDeactivateTarget(user)}
                            disabled={!user.isActive}
                            className={`min-w-[88px] text-xs font-medium px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors duration-150 ${!user.isActive ? 'invisible pointer-events-none' : ''}`}
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
            }
          </table>
        </div>

        {!loading && pagination.totalPages > 1 && (
          <div className="px-4 py-2 border-t border-[#f0f0f0] flex items-center justify-between text-sm">
            <span className="text-[#73787a] text-xs">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-[#E5E7EB] rounded-xl text-[#434849] hover:bg-[#f6f3f2] disabled:opacity-40 text-xs font-medium transition-colors duration-150"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 border border-[#E5E7EB] rounded-xl text-[#434849] hover:bg-[#f6f3f2] disabled:opacity-40 text-xs font-medium transition-colors duration-150"
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
