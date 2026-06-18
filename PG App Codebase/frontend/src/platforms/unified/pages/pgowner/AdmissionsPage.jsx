import { useState, useEffect, useCallback } from 'react'
import { getPGAdmissions, decideAdmission, revokeAdmission } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'
import Pagination from '../../components/Pagination'
import TabFilter from '../../components/TabFilter'

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  admitted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'rejected', label: 'Rejected' },
]

function RowSkeleton() {
  return (
    <tr className="animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>
      ))}
    </tr>
  )
}

function ConfirmRevokeDialog({ guest, onCancel, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[20px] shadow-card p-6 w-full max-w-sm text-center">
        <h3 className="font-bold text-gray-900 mb-2">Revoke Admission?</h3>
        <p className="text-sm text-gray-500 mb-5">
          <strong>{guest?.userId?.name}</strong> will lose resident status and will no longer be able to submit complaints.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2 rounded-[10px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium py-2 rounded-[10px]"
          >
            {loading ? 'Revoking…' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OwnerAdmissionsPage() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking, setRevoking] = useState(false)
  const toast = useToast()

  const fetchAdmissions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPGAdmissions({ status: statusFilter || undefined, page, limit: 15 })
      setAdmissions(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => { fetchAdmissions() }, [fetchAdmissions])

  async function handleDecide(id, decision) {
    setAdmissions(prev => prev.map(a => a._id === id ? { ...a, _deciding: true } : a))
    try {
      await decideAdmission(id, decision)
      setAdmissions(prev => prev.map(a =>
        a._id === id ? { ...a, status: decision, _deciding: false } : a
      ))
      toast(`Guest ${decision}`, 'success')
    } catch (err) {
      setAdmissions(prev => prev.map(a => a._id === id ? { ...a, _deciding: false } : a))
      toast(err.response?.data?.message || 'Action failed', 'error')
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeAdmission(revokeTarget._id)
      setAdmissions(prev => prev.map(a =>
        a._id === revokeTarget._id ? { ...a, status: 'rejected' } : a
      ))
      toast('Admission revoked', 'success')
      setRevokeTarget(null)
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to revoke', 'error')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
        <p className="text-gray-500 text-sm mt-0.5">Review admission requests from guests for your PG</p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <TabFilter
          tabs={TABS}
          value={statusFilter}
          onChange={s => { setStatusFilter(s); setPage(1) }}
        />
        {pagination.totalItems !== undefined && (
          <span className="text-sm text-gray-400">{pagination.totalItems} total</span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Guest</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Move-in Note</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Applied</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)
              : admissions.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No admission requests found
                  </td>
                </tr>
              )
              : admissions.map(adm => (
                <tr key={adm._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {adm.userId?.name || '—'}
                      {adm.escalatedAt && adm.status === 'pending' && (
                        <span
                          className="ml-2 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full"
                          title="Our team has been notified and will review this."
                        >
                          Escalated
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{adm.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px]">
                    <p className="truncate">{adm.moveInNote || <span className="text-gray-300 italic">—</span>}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(adm.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[adm.status] || 'bg-gray-100 text-gray-600'}`}>
                      {adm.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {adm.status === 'pending' && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleDecide(adm._id, 'rejected')}
                          disabled={adm._deciding}
                          className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-[10px] disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDecide(adm._id, 'admitted')}
                          disabled={adm._deciding}
                          className="text-xs px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-[10px] disabled:opacity-50"
                        >
                          {adm._deciding ? '…' : 'Admit'}
                        </button>
                      </div>
                    )}
                    {adm.status === 'admitted' && (
                      <button
                        onClick={() => setRevokeTarget(adm)}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-[10px]"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />

      {revokeTarget && (
        <ConfirmRevokeDialog
          guest={revokeTarget}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={handleRevoke}
          loading={revoking}
        />
      )}
    </div>
  )
}
