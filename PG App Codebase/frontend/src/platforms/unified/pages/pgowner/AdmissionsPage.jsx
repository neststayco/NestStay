import { useState, useEffect, useCallback, useRef } from 'react'
import { getPGAdmissions, decideAdmission } from '@shared/api/admissions'
import { useToast } from '@shared/components/Toast'
import Pagination from '../../components/Pagination'
import TabFilter from '../../components/TabFilter'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import PageContainer from '../../components/PageContainer'
import TableWrapper from '../../components/TableWrapper'
import { SkeletonTable } from '@shared/components/Skeleton'

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export default function OwnerAdmissionsPage() {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})
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

  const fetchAdmissions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      const res = await getPGAdmissions(params)
      setAdmissions(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedSearch, page])

  useEffect(() => { fetchAdmissions() }, [fetchAdmissions])

  async function handleDecide(id, decision) {
    setAdmissions(prev => prev.map(a => a._id === id ? { ...a, _deciding: true } : a))
    try {
      await decideAdmission(id, decision)
      setAdmissions(prev => prev.map(a =>
        a._id === id ? { ...a, status: decision, residentStatus: decision === 'approved' ? 'active' : null, _deciding: false } : a
      ))
      toast(`Guest ${decision}`, 'success')
    } catch (err) {
      setAdmissions(prev => prev.map(a => a._id === id ? { ...a, _deciding: false } : a))
      toast(err.response?.data?.message || 'Action failed', 'error')
    }
  }

  return (
    <PageContainer size="xl">
      <PageHeader title="Admissions" subtitle="Review guest requests for your PG" />

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <TabFilter tabs={TABS} value={statusFilter} onChange={s => { setStatusFilter(s); setPage(1) }} />
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAdmissions} className="text-sm font-medium underline shrink-0 ml-3">Retry</button>
        </div>
      )}

      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="border-b border-[#f0f0f0]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Guest</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Move-in note</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Applied</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Status</th>
              <th className="px-4 py-3 bg-[#f6f3f2]" />
            </tr>
          </thead>
          {loading
            ? <SkeletonTable rows={6} cols={5} />
            : <tbody className="divide-y divide-[#f6f6f6]">
                {admissions.length === 0
                  ? (
                    <tr><td colSpan={5}>
                      <EmptyState
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>}
                    title="No admissions found"
                    description={statusFilter ? 'Try a different filter' : 'No requests for your PG yet'}
                  />
                </td></tr>
              )
              : admissions.map(adm => (
                <tr key={adm._id} className="hover:bg-[#fbf9f8] transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#1b1c1c] text-sm">
                      {adm.userId?.name || '—'}
                    </p>
                    <p className="text-xs text-[#73787a] mt-0.5">{adm.userId?.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[#73787a] max-w-[180px]">
                    <p className="truncate text-sm">{adm.moveInNote || <span className="italic text-[#b0b0b0]">—</span>}</p>
                  </td>
                  <td className="px-4 py-3.5 text-[#73787a] text-xs whitespace-nowrap">
                    {new Date(adm.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={adm.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {adm.status === 'pending' && (
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleDecide(adm._id, 'rejected')}
                          disabled={adm._deciding}
                          className="text-xs px-3 py-1.5 border border-[#E5E7EB] hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-[#73787a] rounded-lg font-medium disabled:opacity-40 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDecide(adm._id, 'approved')}
                          disabled={adm._deciding}
                          className="text-xs px-3 py-1.5 bg-[#e98a76] hover:opacity-90 text-white rounded-lg font-semibold disabled:opacity-40 transition-all"
                        >
                          {adm._deciding ? '…' : 'Approve'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            }
              </tbody>
          }
        </table>
      </TableWrapper>

      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
    </PageContainer>
  )
}
