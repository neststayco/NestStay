import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getOwnerTestimonials, updateTestimonial } from '@shared/api/testimonials'
import { useToast } from '@shared/components/Toast'
import OfflineBanner from '@shared/components/OfflineBanner'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'
import Pagination from '../../components/Pagination'
import TabFilter from '../../components/TabFilter'
import PageHeader from '../../components/PageHeader'
import EmptyState from '../../components/EmptyState'
import PageContainer from '../../components/PageContainer'
import { SkeletonBase } from '@shared/components/Skeleton'

const STATUS_STYLES = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-[#f6f3f2] text-[#73787a] border-[#E5E7EB]',
}

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-[#e98a76]' : 'text-[#E5E7EB]'}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ t, acting, onUpdate }) {
  const initials = t.createdBy?.name
    ? t.createdBy.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col gap-4 hover:shadow-card transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#f6f3f2] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#434849]">{initials}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1b1c1c] leading-snug">{t.createdBy?.name || '—'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-[#73787a]">{t.createdBy?.email}</p>
              {t.isVerifiedResident && (
                <span className="text-[10px] text-purple-600 font-semibold">• Verified</span>
              )}
            </div>
          </div>
        </div>
        <span title={absoluteDate(t.createdAt)} className="text-xs text-[#73787a] whitespace-nowrap flex-shrink-0">
          {relativeTime(t.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarRating rating={t.rating} />
          <span className="text-xs font-semibold text-[#73787a]">{t.rating}/5</span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_STYLES[t.status] || 'bg-[#f6f3f2] text-[#73787a] border-[#E5E7EB]'}`}>
          {t.status}
        </span>
      </div>

      <p className="text-sm text-[#434849] leading-relaxed">{t.content}</p>

      <div className="flex items-center justify-between pt-1 border-t border-[#f6f6f6]">
        <div className="flex items-center gap-2">
          {t.status === 'approved' ? (
            <>
              <button
                onClick={() => onUpdate(t._id, { isVisible: !t.isVisible })}
                disabled={acting === t._id}
                title={t.isVisible ? 'Hide from public page' : 'Show on public page'}
                className={`relative inline-flex items-center rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${t.isVisible ? 'bg-[#e98a76]' : 'bg-[#E5E7EB]'}`}
                style={{ height: '1.125rem', width: '2rem' }}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${t.isVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-[#73787a]">{t.isVisible ? 'Visible' : 'Hidden'}</span>
            </>
          ) : (
            <span className="text-xs text-[#b0b0b0]">Approve to publish</span>
          )}
        </div>

        {t.status === 'pending' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdate(t._id, { status: 'rejected' })}
              disabled={acting === t._id}
              className="text-xs px-3 py-1.5 border border-[#E5E7EB] hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-[#73787a] rounded-lg font-medium disabled:opacity-40 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onUpdate(t._id, { status: 'approved', isVisible: true })}
              disabled={acting === t._id}
              className="text-xs px-3 py-1.5 bg-[#e98a76] hover:opacity-90 text-white rounded-lg font-semibold disabled:opacity-40 transition-all whitespace-nowrap"
            >
              {acting === t._id ? '…' : 'Approve & Show'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OwnerTestimonialsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const statusFilter = searchParams.get('status') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({})
  const [acting, setActing] = useState(null)

  const fetchTestimonials = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getOwnerTestimonials({ status: statusFilter || undefined, page, limit: 15 })
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

  const pendingCount = testimonials.filter(t => t.status === 'pending').length

  return (
    <PageContainer size="lg">
      <OfflineBanner />
      <PageHeader
        title="Testimonials"
        subtitle="Reviews from your verified residents — approve to publish publicly"
      />

      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <TabFilter
          tabs={TABS}
          value={statusFilter}
          onChange={s => updateParams({ status: s })}
          badge={{ tabValue: 'pending', count: pendingCount }}
        />
        {pagination.totalItems !== undefined && (
          <span className="text-xs text-[#73787a] font-medium bg-[#f6f3f2] px-3 py-1.5 rounded-full">
            {pagination.totalItems} total
          </span>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={fetchTestimonials} className="text-sm font-medium underline shrink-0">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <SkeletonBase className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonBase className="h-3.5 w-28" />
                  <SkeletonBase className="h-3 w-36" />
                </div>
              </div>
              <SkeletonBase className="h-3 w-20" />
              <div className="space-y-1.5">
                <SkeletonBase className="h-3 w-full" />
                <SkeletonBase className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB]">
          <EmptyState
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
            title="No testimonials found"
            description={statusFilter ? 'Try a different filter' : 'No reviews submitted yet'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testimonials.map(t => (
            <TestimonialCard key={t._id} t={t} acting={acting} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
    </PageContainer>
  )
}
