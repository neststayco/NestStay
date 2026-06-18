import { useState, useEffect, useCallback } from 'react'
import { getPGAdmissions, revokeAdmission, ownerAddResident } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'
import Pagination from '../../components/Pagination'

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
      ))}
    </tr>
  )
}

function AddGuestModal({ onClose, onAdded }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)
    try {
      const res = await ownerAddResident(email.trim())
      toast('Guest added successfully', 'success')
      onAdded(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add guest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[20px] shadow-card w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Add Guest Directly</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">
            Enter the guest's registered email to admit them directly without needing a request.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-[10px] text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#222121] mb-2">
              Guest email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="guest@example.com"
              className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action focus:border-action bg-white"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold py-2.5 rounded-[10px] transition-colors"
            >
              {loading ? 'Adding…' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OwnerGuestsPage() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [revoking, setRevoking] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const toast = useToast()

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPGAdmissions({ status: 'admitted', page, limit: 15 })
      setGuests(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load guests')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchGuests() }, [fetchGuests])

  async function handleRevoke(adm) {
    setRevoking(adm._id)
    try {
      await revokeAdmission(adm._id)
      setGuests(prev => prev.filter(g => g._id !== adm._id))
      toast('Guest removed', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to remove', 'error')
    } finally {
      setRevoking(null)
    }
  }

  function handleAdded(admission) {
    setGuests(prev => [admission, ...prev])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Current Guests</h1>
          <p className="text-gray-500 text-sm mt-0.5">All currently admitted guests at your PG</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2.5 rounded-[10px] transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Guest
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Guest</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Admitted</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Added By</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
              : guests.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    No admitted guests yet. Use &ldquo;Add Guest&rdquo; to admit someone directly.
                  </td>
                </tr>
              )
              : guests.map(g => (
                <tr key={g._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{g.userId?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{g.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(g.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                      g.processedBy?.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-action-50 text-action'
                    }`}>
                      {g.processedBy?.role === 'admin' ? 'Platform Admin' : 'Owner'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(g)}
                      disabled={revoking === g._id}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-[10px] disabled:opacity-50 transition-colors"
                    >
                      {revoking === g._id ? 'Removing…' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />

      {showAddModal && (
        <AddGuestModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  )
}
