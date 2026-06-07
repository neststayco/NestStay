import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PGCard from '@shared/components/PGCard'
import OfflineBanner from '@shared/components/OfflineBanner'
import { getPGList } from '@shared/api/pgs'

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'trustScore', label: 'Highest trust score' },
  { value: 'complaints', label: 'Fewest complaints' },
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
  'border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50'

function Skeleton() {
  return (
    <div className="bg-white rounded-[20px] border border-[#e0e0e0] shadow-card overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  )
}

export default function PGListPage() {
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
    <div className="min-h-screen bg-gray-50">
      <OfflineBanner />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Find a PG</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Discover verified PGs with transparent complaint records
          </p>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-4 mb-6 space-y-3">
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Filters active</p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-800 underline"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : pgs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🏠</div>
            <p className="font-medium text-gray-600">No PGs found</p>
            <p className="text-sm mt-1">
              {hasFilters ? 'Try adjusting or clearing your filters' : 'No active PG listings yet'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-action underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {pagination?.totalItems ?? pgs.length} PG{(pagination?.totalItems ?? pgs.length) !== 1 ? 's' : ''} found
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
                  className="px-3 py-1.5 text-sm border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
