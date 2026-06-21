import { useState, useEffect, useCallback } from 'react'
import client from '@shared/api/client'
import { useToast } from '@shared/components/Toast'

const inputCls =
  'w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white text-[#1b1c1c] placeholder-[#9ca3af] transition-colors'

function RejectModal({ pg, onClose, onRejected }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()

  async function handleSubmit() {
    if (reason.trim().length < 5) {
      setError('Please provide a reason (at least 5 characters)')
      return
    }
    setError('')
    setLoading(true)
    try {
      await client.patch(`/admin/pending-pgs/${pg._id}/reject`, { reason: reason.trim() })
      toast('PG listing rejected', 'success')
      onRejected(pg._id)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1b1c1c]">Reject Listing</h2>
          <button onClick={onClose} className="text-[#73787a] hover:text-[#1b1c1c] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-[#434849]">
            You are rejecting <strong>{pg.name}</strong>. Please provide a reason that will be shared with the owner.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-[#73787a] uppercase tracking-widest mb-1.5">
              Rejection Reason
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Incomplete information, blurry photos, location mismatch…"
            />
            <p className="text-xs text-[#73787a] mt-1">
              {reason.trim().length} / 5 characters minimum
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#f0f0f0] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
          >
            {loading ? 'Rejecting…' : 'Reject Listing'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PGCard({ pg, onApprove, onReject, approving }) {
  const amenities = pg.amenities?.slice(0, 5) || []
  const extraAmenities = (pg.amenities?.length || 0) - amenities.length
  const photoCount = pg.images?.length || 0
  const ownerName = pg.ownerId?.name || 'Unknown'
  const ownerEmail = pg.ownerId?.email || ''
  const city = pg.location?.city || ''
  const area = pg.location?.area || ''
  const locationStr = [area, city].filter(Boolean).join(', ')
  const rent = pg.pricing?.rent
  const totalCapacity = pg.accommodation?.totalCapacity

  return (
    <div
      className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden flex flex-col"
      style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px, rgba(0,0,0,0.02) 0px 0px 1px' }}
    >
      {/* Photo strip */}
      {photoCount > 0 ? (
        <div className="relative h-40 bg-[#f6f3f2] flex-shrink-0">
          <img
            src={pg.images[0].url}
            alt={pg.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
          {photoCount > 1 && (
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded-md">
              +{photoCount - 1} more
            </span>
          )}
        </div>
      ) : (
        <div className="h-40 bg-[#f6f3f2] flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 text-[#c5c8c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        {/* Name + status badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-[#1b1c1c] text-base leading-tight">{pg.name}</h3>
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 whitespace-nowrap flex-shrink-0">
            Pending
          </span>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg className="w-3.5 h-3.5 text-[#73787a] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs text-[#434849] font-medium truncate">{ownerName}</span>
          {ownerEmail && (
            <span className="text-xs text-[#73787a] truncate">&middot; {ownerEmail}</span>
          )}
        </div>

        {/* Location */}
        {locationStr && (
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-[#73787a] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-[#73787a] truncate">{locationStr}</span>
          </div>
        )}

        {/* Rent / capacity / photos */}
        <div className="flex items-center gap-4 mb-3">
          {rent != null && (
            <div>
              <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-widest">Rent</p>
              <p className="text-sm font-semibold text-[#1b1c1c]">&#8377;{rent.toLocaleString()}/mo</p>
            </div>
          )}
          {totalCapacity != null && (
            <div>
              <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-widest">Capacity</p>
              <p className="text-sm font-semibold text-[#1b1c1c]">{totalCapacity} beds</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-widest">Photos</p>
            <p className="text-sm font-semibold text-[#1b1c1c]">{photoCount}</p>
          </div>
        </div>

        {/* Amenity pills */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {amenities.map(a => (
              <span
                key={a}
                className="text-xs bg-[#f6f3f2] text-[#73787a] px-2 py-0.5 rounded-md font-medium capitalize"
              >
                {a}
              </span>
            ))}
            {extraAmenities > 0 && (
              <span className="text-xs text-[#b0b0b0] py-0.5">+{extraAmenities} more</span>
            )}
          </div>
        )}

        {/* Description */}
        {pg.description && (
          <p className="text-xs text-[#73787a] line-clamp-2 mb-3">{pg.description}</p>
        )}

        {/* Spacer pushes buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 pt-3 border-t border-[#f0f0f0]">
          <button
            onClick={() => onReject(pg)}
            disabled={approving === pg._id}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-[10px] transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(pg._id)}
            disabled={approving === pg._id}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-[10px] transition-colors"
          >
            {approving === pg._id ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonPGCard() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 bg-[#f6f3f2]" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-2">
          <div className="h-4 bg-[#f0f0f0] rounded w-3/5" />
          <div className="h-5 bg-[#f0f0f0] rounded-full w-16" />
        </div>
        <div className="h-3 bg-[#f0f0f0] rounded w-2/3" />
        <div className="h-3 bg-[#f0f0f0] rounded w-1/2" />
        <div className="flex gap-3">
          <div className="h-8 bg-[#f0f0f0] rounded w-16" />
          <div className="h-8 bg-[#f0f0f0] rounded w-16" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-[#f0f0f0] rounded-md w-14" />
          <div className="h-5 bg-[#f0f0f0] rounded-md w-16" />
          <div className="h-5 bg-[#f0f0f0] rounded-md w-12" />
        </div>
        <div className="h-3 bg-[#f0f0f0] rounded w-full" />
        <div className="h-3 bg-[#f0f0f0] rounded w-4/5" />
        <div className="flex gap-2 pt-1">
          <div className="h-8 bg-[#f0f0f0] rounded-[10px] flex-1" />
          <div className="h-8 bg-[#f0f0f0] rounded-[10px] flex-1" />
        </div>
      </div>
    </div>
  )
}

export default function AdminOnboardingReviewPage() {
  const [pgs, setPgs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [approving, setApproving] = useState(null)
  const toast = useToast()

  const fetchPGs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get('/admin/pending-pgs', { params: { page } })
      setPgs(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load pending listings')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchPGs() }, [fetchPGs])

  async function handleApprove(id) {
    setApproving(id)
    try {
      await client.patch(`/admin/pending-pgs/${id}/approve`)
      toast('PG listing approved', 'success')
      setPgs(prev => prev.filter(pg => pg._id !== id))
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to approve listing', 'error')
    } finally {
      setApproving(null)
    }
  }

  function handleRejected(id) {
    setPgs(prev => prev.filter(pg => pg._id !== id))
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1b1c1c]">PG Onboarding Review</h1>
        <p className="text-[#73787a] text-sm mt-0.5">
          Review and approve new PG listings submitted by self-onboarded owners
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={fetchPGs}
            className="text-sm font-semibold underline underline-offset-2 whitespace-nowrap hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonPGCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && pgs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-[#f6f3f2] rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#c5c8c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-[#73787a] text-base font-semibold">No pending listings</p>
          <p className="text-[#b0b0b0] text-sm mt-1">All PG submissions have been reviewed</p>
        </div>
      )}

      {/* Card grid */}
      {!loading && pgs.length > 0 && (
        <>
          {pagination && (
            <p className="text-sm text-[#73787a] mb-4">
              {pagination.totalItems} pending {pagination.totalItems === 1 ? 'listing' : 'listings'}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pgs.map(pg => (
              <PGCard
                key={pg._id}
                pg={pg}
                onApprove={handleApprove}
                onReject={target => setRejectTarget(target)}
                approving={approving}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#f0f0f0]">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-4 py-2 border border-[#E5E7EB] rounded-[10px] hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 transition-colors"
              >
                &larr; Previous
              </button>
              <span className="text-sm text-[#73787a]">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="text-sm px-4 py-2 border border-[#E5E7EB] rounded-[10px] hover:bg-[#f6f3f2] text-[#434849] disabled:opacity-40 transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          pg={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={handleRejected}
        />
      )}
    </div>
  )
}
