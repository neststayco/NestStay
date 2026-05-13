import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import PGCard from '@shared/components/PGCard'
import { getPGList } from '@shared/api/pgs'

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const FOOD_OPTIONS = [
  { value: '', label: 'Any food' },
  { value: 'veg', label: 'Veg only' },
  { value: 'non-veg', label: 'Non-veg' },
  { value: 'both', label: 'Veg & Non-veg' },
]

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
  const [city, setCity] = useState('')
  const [area, setArea] = useState('')
  const [gender, setGender] = useState('')
  const [foodType, setFoodType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)

  const [pgs, setPgs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPGs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPGList({ city, area, gender, foodType, minPrice, maxPrice, sortBy, page, limit: 12 })
      setPgs(res.data)
      setPagination(res.pagination)
    } catch {
      setError('Failed to load PGs. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [city, area, gender, foodType, minPrice, maxPrice, sortBy, page])

  useEffect(() => { fetchPGs() }, [fetchPGs])

  function applyFilters(e) {
    e.preventDefault()
    setPage(1)
    fetchPGs()
  }

  function clearFilters() {
    setCity('')
    setArea('')
    setGender('')
    setFoodType('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('')
    setPage(1)
  }

  const hasFilters = city || area || gender || foodType || minPrice || maxPrice || sortBy

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Find a PG</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Discover verified PGs with transparent complaint records
          </p>
        </div>

        <form onSubmit={applyFilters} className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input type="text" placeholder="City" value={city}
              onChange={(e) => setCity(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50" />
            <input type="text" placeholder="Area / Locality" value={area}
              onChange={(e) => setArea(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50" />
            <select value={gender} onChange={(e) => setGender(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50">
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} title={o.title}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
            <input type="number" placeholder="Min rent (&#8377;)" value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50" />
            <input type="number" placeholder="Max rent (&#8377;)" value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50" />
            <select value={foodType} onChange={(e) => setFoodType(e.target.value)}
              className="border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50">
              {FOOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 bg-brand hover:bg-brand-light text-black text-sm font-semibold py-2 px-4 rounded-[10px] transition-colors">
                Search
              </button>
              {hasFilters && (
                <button type="button" onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-800 underline px-2">
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : pgs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🏠</div>
            <p className="font-medium text-gray-600">No PGs found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">
              {pagination?.totalItems ?? pgs.length} PG{pgs.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pgs.map((pg) => (
                <PGCard key={pg._id} pg={pg} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  &larr; Prev
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-[#e0e0e0] rounded-[10px] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
