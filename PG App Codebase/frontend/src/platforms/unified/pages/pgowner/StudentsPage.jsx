import { useState, useEffect, useCallback, useRef } from 'react'
import { getPGAdmissions, removeResident, ownerAddResident } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'
import Pagination from '../../components/Pagination'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import PageContainer from '../../components/PageContainer'
import TableWrapper from '../../components/TableWrapper'
import TabFilter from '../../components/TabFilter'
import ModalShell from '../../components/ModalShell'
import { SkeletonTable } from '@shared/components/Skeleton'

const TABS = [
  { value: 'active', label: 'Current Residents' },
  { value: 'removed', label: 'Past Residents' },
]

const inputCls =
  'w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-[#fbf9f8]'

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
    <ModalShell title="Add guest directly" subtitle="Admit without needing a request" onClose={onClose}>
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-[#434849] mb-2">
            Guest email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="guest@example.com"
            className={inputCls}
            autoFocus
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] text-sm font-medium py-2.5 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#e98a76] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
            {loading ? 'Adding…' : 'Add Guest'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

export default function OwnerResidentsPage() {
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [removing, setRemoving] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const toast = useToast()
  const searchTimer = useRef(null)

  function handleSearchChange(val) {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(1)
    }, 350)
  }

  const fetchResidents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { residentStatus: tab, page, limit: 15 }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      const res = await getPGAdmissions(params)
      setResidents(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load residents')
    } finally {
      setLoading(false)
    }
  }, [tab, debouncedSearch, page])

  useEffect(() => { fetchResidents() }, [fetchResidents])

  async function handleRemove(admission) {
    setRemoving(admission._id)
    try {
      await removeResident(admission._id)
      setResidents(prev => prev.filter(r => r._id !== admission._id))
      toast('Resident removed', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to remove', 'error')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <PageContainer size="xl">
      <PageHeader
        title="Residents"
        subtitle="Manage current and past residents at your PG"
        action={
          tab === 'active' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-[#e98a76] hover:opacity-90 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Guest
            </button>
          )
        }
      />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <TabFilter tabs={TABS} value={tab} onChange={t => { setTab(t); setPage(1) }} />
        {pagination.totalItems !== undefined && (
          <span className="text-xs text-[#73787a] font-medium bg-[#f6f3f2] px-3 py-1.5 rounded-full">
            {pagination.totalItems} total
          </span>
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
          className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#fbf9f8] focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76]"
        />
        {search && (
          <button onClick={() => handleSearchChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#434849]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[#f6f3f2] border-b border-[#f0f0f0]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Resident</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">
                {tab === 'active' ? 'Admitted' : 'Removed on'}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Added by</th>
              {tab === 'active' && <th className="px-4 py-3 bg-[#f6f3f2]" />}
            </tr>
          </thead>
          {loading
            ? <SkeletonTable rows={6} cols={tab === 'active' ? 4 : 3} />
            : <tbody className="divide-y divide-[#f6f6f6]">
                {residents.length === 0
                  ? (
                    <tr><td colSpan={tab === 'active' ? 4 : 3}>
                      <EmptyState
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857" /></svg>}
                        title={tab === 'active' ? 'No current residents' : 'No past residents'}
                        description={tab === 'active' ? 'Use "Add Guest" to admit someone directly' : 'Removed residents will appear here'}
                      />
                    </td></tr>
                  )
                  : residents.map(r => (
                    <tr key={r._id} className="hover:bg-[#f6f3f2] transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#1b1c1c] text-sm">{r.userId?.name || '—'}</p>
                        <p className="text-xs text-[#73787a] mt-0.5">{r.userId?.email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[#73787a] text-xs whitespace-nowrap">
                        {tab === 'active'
                          ? new Date(r.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : r.residentRemovedAt
                            ? new Date(r.residentRemovedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                          r.processedBy?.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {r.processedBy?.role === 'admin' ? 'Platform Admin' : 'Owner'}
                        </span>
                      </td>
                      {tab === 'active' && (
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleRemove(r)}
                            disabled={removing === r._id}
                            className="text-xs px-3 py-1.5 bg-[#f6f3f2] hover:bg-red-50 text-[#73787a] hover:text-red-600 rounded-lg font-medium disabled:opacity-50 transition-colors"
                          >
                            {removing === r._id ? 'Removing…' : 'Remove Resident'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                }
              </tbody>
          }
        </table>
      </TableWrapper>

      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />

      {showAddModal && (
        <AddGuestModal onClose={() => setShowAddModal(false)} onAdded={r => setResidents(prev => [r, ...prev])} />
      )}
    </PageContainer>
  )
}
