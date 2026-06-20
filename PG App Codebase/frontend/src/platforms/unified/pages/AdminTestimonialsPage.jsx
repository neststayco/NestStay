import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminTestimonials, updateTestimonial } from '@shared/api/testimonials'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import { SkeletonTable } from '@shared/components/Skeleton'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

const TABS = ['', 'pending', 'approved', 'rejected']

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function AdminTestimonialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const statusFilter = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({})
  const [acting, setActing] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const fetchTestimonials = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminTestimonials({
        status: statusFilter || undefined,
        page,
        limit: 20,
      })
      setTestimonials(res.data)
      setPagination(res.pagination || {})
    } catch {
      setError('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => { fetchTestimonials() }, [fetchTestimonials])

  function updateParams(updates) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('page')
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) next.set(k, String(v))
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

  async function handleUpdate(id, patch) {
    const prev = testimonials
    setActing(id)
    setTestimonials(list => list.map(t => t._id === id ? { ...t, ...patch } : t))
    try {
      const res = await updateTestimonial(id, patch)
      setTestimonials(list => list.map(t => t._id === id ? { ...t, ...res.data } : t))
      toast('Testimonial updated', 'success')
    } catch (err) {
      setTestimonials(prev)
      toast(err.response?.data?.message || 'Action failed — please try again', 'error')
    } finally {
      setActing(null)
    }
  }

  const showingFrom = pagination.totalItems
    ? ((pagination.currentPage - 1) * (pagination.limit || 20)) + 1
    : 0
  const showingTo = pagination.totalItems
    ? Math.min(pagination.currentPage * (pagination.limit || 20), pagination.totalItems)
    : 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <OfflineBanner />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
        <p className="text-gray-500 text-sm mt-1">
          All testimonials across all PGs. Approve, reject, or control visibility.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {TABS.map(s => (
          <button
            key={s}
            onClick={() => updateParams({ status: s })}
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[10px] text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={fetchTestimonials} className="text-sm font-medium underline shrink-0">
            Retry
          </button>
        </div>
      )}

      {pagination.totalItems > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          Showing {showingFrom}–{showingTo} of {pagination.totalItems} testimonials
        </p>
      )}

      <div className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">PG</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Resident</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Review</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Visible</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            {loading
              ? <SkeletonTable rows={10} cols={8} />
              : <tbody className="divide-y divide-gray-100">
                  {testimonials.length === 0
                    ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <p className="text-gray-400 text-sm font-medium">No testimonials found</p>
                          <p className="text-gray-300 text-xs mt-1">
                            {statusFilter
                              ? 'Try a different status filter'
                              : 'No testimonials submitted yet across any PG'}
                          </p>
                    </td>
                  </tr>
                )
                : testimonials.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{t.pgId?.name || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-gray-800">{t.createdBy?.name || '—'}</p>
                      {t.isVerifiedResident && (
                        <span className="text-xs text-purple-600 font-medium">✓ Verified</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StarRating rating={t.rating} />
                      <span className="text-xs text-gray-400 mt-0.5 block">{t.rating}/5</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <p className={`text-sm text-gray-700 ${expanded === t._id ? '' : 'line-clamp-2'}`}>
                        {t.content}
                      </p>
                      {t.content?.length > 80 && (
                        <button
                          onClick={() => setExpanded(expanded === t._id ? null : t._id)}
                          className="text-xs text-action mt-0.5 hover:underline"
                        >
                          {expanded === t._id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {t.status === 'approved' ? (
                        <button
                          onClick={() => handleUpdate(t._id, { isVisible: !t.isVisible })}
                          disabled={acting === t._id}
                          title={t.isVisible ? 'Hide from public' : 'Show on public page'}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${t.isVisible ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${t.isVisible ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        title={absoluteDate(t.createdAt)}
                        className="text-xs text-gray-400 whitespace-nowrap"
                      >
                        {relativeTime(t.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {t.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdate(t._id, { status: 'rejected' })}
                            disabled={acting === t._id}
                            className="text-xs px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-[10px] disabled:opacity-50 whitespace-nowrap transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleUpdate(t._id, { status: 'approved', isVisible: true })}
                            disabled={acting === t._id}
                            className="text-xs px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-[10px] disabled:opacity-50 whitespace-nowrap transition-colors"
                          >
                            {acting === t._id ? '…' : 'Approve & Show'}
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
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Prev
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-[#e0e0e0] rounded-[10px] disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
