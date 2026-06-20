import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PGCard from '@shared/components/PGCard'
import OfflineBanner from '@shared/components/OfflineBanner'
import { getPGList } from '@shared/api/pgs'
import { getMyAdmission, withdrawAdmission } from '@shared/api/admissions'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import { normalizeAdmission } from '@shared/utils/normalizeAdmission'
import { SkeletonBase } from '@shared/components/Skeleton'

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'mixed', label: 'Mixed' },
]

const FOOD_OPTIONS = [
  { value: '', label: 'Any food' },
  { value: 'veg', label: 'Veg only' },
  { value: 'non-veg', label: 'Non-veg' },
  { value: 'both', label: 'Veg & Non-veg' },
]

const inputCls =
  'border border-[#E5E7EB] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white text-[#1b1c1c] placeholder-[#9ca3af] transition-colors'

export default function PGListPage() {
  const { currentAdmission, setCurrentAdmission } = useAuth()
  const toast = useToast()
  const [withdrawing, setWithdrawing] = useState(false)
  const [checking, setChecking] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()

  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '')
  const [localCity, setLocalCity] = useState(searchParams.get('city') || '')
  const [localArea, setLocalArea] = useState(searchParams.get('area') || '')
  const [localMinPrice, setLocalMinPrice] = useState(searchParams.get('minPrice') || '')
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [localAmenities, setLocalAmenities] = useState(searchParams.get('amenities') || '')

  const debounceRefs = useRef({})

  const search = searchParams.get('search') || ''
  const city = searchParams.get('city') || ''
  const area = searchParams.get('area') || ''
  const gender = searchParams.get('gender') || ''
  const foodType = searchParams.get('foodType') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const amenities = searchParams.get('amenities') || ''
  const sortBy = searchParams.get('sortBy') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [pgs, setPgs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getPGList({ search, city, area, gender, foodType, minPrice, maxPrice, amenities, sortBy, page, limit: 12 })
      .then(res => {
        if (!cancelled) {
          setPgs(res.data)
          setPagination(res.pagination)
        }
      })
      .catch(() => { if (!cancelled) setError('Failed to load PGs. Please try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, city, area, gender, foodType, minPrice, maxPrice, amenities, sortBy, page])

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

  function debounceParam(key, value, localSetter) {
    localSetter(value)
    clearTimeout(debounceRefs.current[key])
    debounceRefs.current[key] = setTimeout(() => {
      updateParams({ [key]: value })
    }, 300)
  }

  function setPage(p) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (p > 1) next.set('page', String(p))
      else next.delete('page')
      return next
    }, { replace: false })
  }

  function clearFilters() {
    setLocalSearch('')
    setLocalCity('')
    setLocalArea('')
    setLocalMinPrice('')
    setLocalMaxPrice('')
    setLocalAmenities('')
    Object.values(debounceRefs.current).forEach(clearTimeout)
    setSearchParams({}, { replace: false })
  }

  const hasFilters = search || city || area || gender || foodType || minPrice || maxPrice || amenities || sortBy

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <OfflineBanner />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentAdmission?.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-4 py-3.5 mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-800">Application pending</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Your admission request is awaiting owner review. You cannot apply to another PG until this is resolved.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={async () => {
                  setChecking(true)
                  try {
                    const res = await getMyAdmission()
                    setCurrentAdmission(normalizeAdmission(res.data))
                    if (res.data?.residentStatus === 'active') toast('You have been admitted!', 'success')
                    else if (!res.data || res.data.status === 'rejected') toast('Application was not approved.', 'info')
                    else toast('Still pending — check back later.', 'info')
                  } catch { /* ignore */ } finally {
                    setChecking(false)
                  }
                }}
                disabled={checking}
                className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-lg disabled:opacity-50"
              >
                {checking ? 'Checking…' : 'Check Status'}
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('Withdraw your pending application?')) return
                  setWithdrawing(true)
                  try {
                    await withdrawAdmission(currentAdmission._id)
                    setCurrentAdmission(null)
                    toast('Application withdrawn', 'success')
                  } catch (err) {
                    toast(err.response?.data?.message || 'Failed to withdraw', 'error')
                  } finally {
                    setWithdrawing(false)
                  }
                }}
                disabled={withdrawing}
                className="text-xs font-semibold px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg disabled:opacity-50"
              >
                {withdrawing ? 'Withdrawing…' : 'Withdraw'}
              </button>
            </div>
          </div>
        )}

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-[#1b1c1c]">Find a PG</h1>
          <p className="text-[#73787a] text-sm mt-0.5">
            Discover verified PGs across your city
          </p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-4 mb-6 space-y-3"
          style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 4px 20px' }}>
          <input
            type="text"
            placeholder="Search by name, area, or amenity…"
            value={localSearch}
            onChange={e => debounceParam('search', e.target.value, setLocalSearch)}
            className={`${inputCls} w-full`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="City"
              value={localCity}
              onChange={e => debounceParam('city', e.target.value, setLocalCity)}
              className={inputCls}
            />
            <input
              type="text"
              placeholder="Area / Locality"
              value={localArea}
              onChange={e => debounceParam('area', e.target.value, setLocalArea)}
              className={inputCls}
            />
            <select
              value={gender}
              onChange={e => updateParams({ gender: e.target.value })}
              className={inputCls}
            >
              {GENDER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => updateParams({ sortBy: e.target.value })}
              className={inputCls}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
            <input
              type="number"
              placeholder="Min rent (₹)"
              value={localMinPrice}
              onChange={e => debounceParam('minPrice', e.target.value, setLocalMinPrice)}
              className={inputCls}
            />
            <input
              type="number"
              placeholder="Max rent (₹)"
              value={localMaxPrice}
              onChange={e => debounceParam('maxPrice', e.target.value, setLocalMaxPrice)}
              className={inputCls}
            />
            <select
              value={foodType}
              onChange={e => updateParams({ foodType: e.target.value })}
              className={inputCls}
            >
              {FOOD_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Amenities (wifi, ac, …)"
              value={localAmenities}
              onChange={e => debounceParam('amenities', e.target.value, setLocalAmenities)}
              className={inputCls}
              title="Comma-separated — all must match"
            />
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between pt-1 border-t border-[#f6f3f2]">
              <p className="text-xs text-[#73787a] font-medium">Filters active</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#e98a76] hover:text-[#c0431e] transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => updateParams({})} className="text-sm font-medium underline shrink-0">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden">
                <SkeletonBase className="w-full h-44 rounded-none" />
                <div className="p-4 space-y-3">
                  <SkeletonBase className="h-4 w-3/4" />
                  <SkeletonBase className="h-3 w-1/2" />
                  <SkeletonBase className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : pgs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#fff3ee] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '28px' }}>search_off</span>
            </div>
            <p className="font-bold text-[#1b1c1c] text-base mb-1">No PGs found</p>
            <p className="text-sm text-[#73787a] max-w-xs mx-auto">
              {hasFilters ? 'Try adjusting or clearing your filters.' : 'No active PG listings yet — check back soon.'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold text-[#e98a76] border border-[#ffdbd0] bg-[#fff3ee] hover:bg-[#ffdbd0] px-4 py-2 rounded-full transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-[#73787a] mb-4 font-medium">
              <span className="text-[#1b1c1c] font-bold">{pagination?.totalItems ?? pgs.length}</span>{' '}
              PG{(pagination?.totalItems ?? pgs.length) !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pgs.map(pg => (
                <PGCard key={pg._id} pg={pg} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-full bg-white hover:bg-[#f6f3f2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-[#73787a] px-2 font-medium">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-full bg-white hover:bg-[#f6f3f2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
