import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getComplaints, updateComplaintStatus } from '@shared/api/complaints'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'
import Pagination from '../../components/Pagination'
import TabFilter from '../../components/TabFilter'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import PageContainer from '../../components/PageContainer'
import TableWrapper from '../../components/TableWrapper'
import { SkeletonTable } from '@shared/components/Skeleton'

const STATUS_STYLES = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-[#f6f3f2] text-[#73787a] border-[#E5E7EB]',
}

const STATUS_LABELS = {
  pending:  'New',
  approved: 'Acknowledged',
  rejected: 'Dismissed',
}

const TYPE_LABELS = {
  food:        'Food',
  cleanliness: 'Cleanliness',
  security:    'Security',
  management:  'Management',
  other:       'Other',
}

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'New' },
  { value: 'approved', label: 'Acknowledged' },
  { value: 'rejected', label: 'Dismissed' },
]

export default function OwnerComplaintsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const statusFilter = searchParams.get('status') || ''
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
  const page         = parseInt(searchParams.get('page') || '1', 10)

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [pagination, setPagination] = useState({})
  const [acting, setActing]         = useState(null)

  const fetchComplaints = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getComplaints({
        status:       statusFilter || undefined,
        verifiedOnly: verifiedOnly ? 'true' : undefined,
        page,
        limit: 15,
      })
      setComplaints(res.data)
      setPagination(res.pagination || {})
    } catch {
      setError('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, verifiedOnly, page])

  useEffect(() => { fetchComplaints() }, [fetchComplaints])

  function updateParams(updates) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== '' && v !== false && v !== null && v !== undefined) next.set(k, String(v))
        else next.delete(k)
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

  async function handleAction(id, status) {
    const prev = complaints
    setActing(id + status)
    setComplaints(list => list.map(c => c._id === id ? { ...c, status } : c))
    try {
      await updateComplaintStatus(id, { status })
      toast(status === 'approved' ? 'Complaint acknowledged' : 'Complaint dismissed', 'success')
    } catch (err) {
      setComplaints(prev)
      toast(err.response?.data?.message || 'Action failed — please try again', 'error')
    } finally {
      setActing(null)
    }
  }

  return (
    <PageContainer size="xl">
      <OfflineBanner />
      <PageHeader title="Complaints" subtitle="Acknowledge resolved issues or dismiss invalid ones" />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <TabFilter tabs={TABS} value={statusFilter} onChange={s => updateParams({ status: s })} />

        <label className="flex items-center gap-2 ml-1 cursor-pointer select-none">
          <div
            onClick={() => updateParams({ verifiedOnly: !verifiedOnly ? 'true' : '' })}
            className={`relative rounded-full transition-colors cursor-pointer flex-shrink-0 ${verifiedOnly ? 'bg-[#e98a76]' : 'bg-[#E5E7EB]'}`}
            style={{ width: '2rem', height: '1.125rem' }}
          >
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${verifiedOnly ? 'translate-x-3.5' : ''}`} />
          </div>
          <span className="text-sm text-[#434849]">Verified residents only</span>
        </label>

        {pagination.totalItems !== undefined && (
          <span className="ml-auto text-xs text-[#73787a] font-medium bg-[#f6f3f2] px-3 py-1.5 rounded-full">
            {pagination.totalItems} total
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={fetchComplaints} className="text-sm font-medium underline shrink-0">Retry</button>
        </div>
      )}

      <TableWrapper>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[#f6f3f2] border-b border-[#f0f0f0]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Type</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Description</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Flags</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold text-[#73787a] uppercase tracking-wider bg-[#f6f3f2]">Filed</th>
              <th className="px-4 py-3 bg-[#f6f3f2]" />
            </tr>
          </thead>
          {loading
            ? <SkeletonTable rows={8} cols={6} />
            : <tbody className="divide-y divide-[#f6f6f6]">
                {complaints.length === 0
                  ? (
                    <tr><td colSpan={6}>
                      <EmptyState
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    title="No complaints found"
                    description={statusFilter || verifiedOnly ? 'Try a different filter' : 'No complaints filed for your PG yet'}
                  />
                </td></tr>
              )
              : complaints.map(c => (
                <tr key={c._id} className="hover:bg-[#fbf9f8] transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-[#1b1c1c] capitalize whitespace-nowrap text-sm">
                    {TYPE_LABELS[c.type] || c.type}
                  </td>
                  <td className="px-4 py-3.5 text-[#73787a] max-w-[220px]">
                    <p className="truncate text-sm" title={c.description}>{c.description}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {c.isVerifiedResident && (
                        <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-semibold">Verified</span>
                      )}
                      {c.isAnonymous && (
                        <span className="text-[10px] bg-[#f6f3f2] text-[#73787a] border border-[#E5E7EB] px-1.5 py-0.5 rounded-full font-semibold">Anon</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[c.status] || 'bg-[#f6f3f2] text-[#73787a] border-[#E5E7EB]'}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span title={absoluteDate(c.createdAt)} className="text-xs text-[#73787a] whitespace-nowrap">
                      {relativeTime(c.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {c.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleAction(c._id, 'approved')}
                          disabled={!!acting}
                          className="text-xs px-3 py-1.5 bg-[#e98a76] hover:opacity-90 text-white rounded-lg font-semibold disabled:opacity-40 transition-all whitespace-nowrap"
                        >
                          {acting === c._id + 'approved' ? '…' : 'Acknowledge'}
                        </button>
                        <button
                          onClick={() => handleAction(c._id, 'rejected')}
                          disabled={!!acting}
                          className="text-xs px-3 py-1.5 border border-[#E5E7EB] hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-[#73787a] rounded-lg font-medium disabled:opacity-40 transition-colors"
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
          }
        </table>
      </TableWrapper>

      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
    </PageContainer>
  )
}
