import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PublicNavbar from '../components/PublicNavbar'
import { getPGList } from '@shared/api/pgs'
import { SkeletonBase } from '@shared/components/Skeleton'

const AREAS = ['Hinjewadi', 'Baner', 'Kharadi', 'Wakad', 'Kalyani Nagar', 'Viman Nagar', 'Pimpri-Chinchwad', 'Hadapsar']

const SELECT_ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2373787a' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")"

function buildApiParams(sp, pageNum) {
  const params = { limit: 12 }
  const collegeVal = sp.get('college')
  const areaVal = sp.get('area')
  const budgetVal = sp.get('budget')
  const genderVal = sp.get('gender')
  if (collegeVal) params.search = collegeVal
  if (areaVal) params.area = areaVal
  if (budgetVal) {
    const num = parseInt(String(budgetVal).replace(/[^0-9]/g, ''))
    if (!isNaN(num) && num > 0) params.maxPrice = num
  }
  if (genderVal) params.gender = genderVal
  if (pageNum > 1) params.page = pageNum
  return params
}

function PublicPGCard({ pg }) {
  const [imgError, setImgError] = useState(false)
  const image = (!imgError && pg.images?.[0]) ? (pg.images[0]?.url || pg.images[0]) : null
  const area = pg.location?.area
  const city = pg.location?.city
  const locationStr = [area, city].filter(Boolean).join(', ') || '—'
  const rent = pg.pricing?.rent

  return (
    <Link
      to={`/properties/${pg._id}`}
      className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden group hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
    >
      <div className="relative h-48 overflow-hidden bg-[#f6f3f2] flex items-center justify-center flex-shrink-0">
        {image ? (
          <img
            src={image}
            alt={pg.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[48px] text-[#d1d5db]">apartment</span>
            <span className="text-xs text-[#9ca3af]">{area || 'Pune'}</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-[#e98a76] text-white px-3 py-1 rounded-full text-xs font-semibold">
          VERIFIED
        </span>
        {pg.accommodation?.gender && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-[#434849] capitalize">
            {pg.accommodation.gender}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-[#1b1c1c] mb-1 line-clamp-1">{pg.name}</h3>
        <div className="flex items-center gap-1 text-[#73787a] text-sm mb-3">
          <span className="material-symbols-outlined text-[16px]">location_on</span>
          <span className="line-clamp-1">{locationStr}</span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="text-xl font-bold text-[#e98a76]">
            {rent
              ? <span>&#8377;{rent.toLocaleString('en-IN')}<span className="text-xs font-normal text-[#73787a]">/mo</span></span>
              : <span className="text-sm font-medium text-[#73787a]">Contact for price</span>}
          </div>
          <span className="text-xs text-[#e98a76] font-semibold flex items-center gap-0.5">
            View <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="col-span-full flex flex-col items-center py-20 text-center">
      <div className="w-16 h-16 bg-[#fef3f0] rounded-2xl flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-[#e98a76]">search_off</span>
      </div>
      <p className="text-lg font-semibold text-[#1b1c1c] mb-2">
        {hasFilters ? 'No properties match your filters' : 'No properties available yet'}
      </p>
      <p className="text-sm text-[#73787a] mb-6 max-w-xs">
        {hasFilters
          ? 'Try broadening your search or removing some filters.'
          : 'We\'re adding verified PGs soon. Check back shortly.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="bg-[#e98a76] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
        >
          Clear All Filters
        </button>
      )}
      <Link to="/" className="mt-4 text-sm text-[#73787a] hover:text-[#1b1c1c] underline transition-colors">
        Back to Home
      </Link>
    </div>
  )
}

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [college, setCollege] = useState(searchParams.get('college') || '')
  const [area, setArea] = useState(searchParams.get('area') || '')
  const [budget, setBudget] = useState(searchParams.get('budget') || '')
  const [gender, setGender] = useState(searchParams.get('gender') || '')

  const [pgs, setPgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)

  // Sync local inputs when URL changes (back/forward navigation)
  useEffect(() => {
    setCollege(searchParams.get('college') || '')
    setArea(searchParams.get('area') || '')
    setBudget(searchParams.get('budget') || '')
    setGender(searchParams.get('gender') || '')
    setPage(1)
    fetchProperties(searchParams, 1, false)
  }, [searchParams.toString()])  // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProperties(sp, pageNum, append) {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await getPGList(buildApiParams(sp, pageNum))
      const items = res.data || []
      setPgs(prev => append ? [...prev, ...items] : items)
      setPagination(res.pagination || null)
    } catch {
      if (pageNum === 1) setPgs([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function applyFilters() {
    const next = {}
    const c = college.trim()
    const b = budget.trim().replace(/[^0-9]/g, '')
    if (c) next.college = c
    if (area) next.area = area
    if (b) next.budget = b
    if (gender) next.gender = gender
    setSearchParams(next)
  }

  function removeFilter(key) {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    setSearchParams(next)
    if (key === 'college') setCollege('')
    if (key === 'area') setArea('')
    if (key === 'budget') setBudget('')
    if (key === 'gender') setGender('')
  }

  function clearAll() {
    setCollege(''); setArea(''); setBudget(''); setGender('')
    setSearchParams({})
  }

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchProperties(searchParams, nextPage, true)
  }

  const activeFilters = []
  if (searchParams.get('college')) activeFilters.push({ key: 'college', label: `"${searchParams.get('college')}"` })
  if (searchParams.get('area')) activeFilters.push({ key: 'area', label: searchParams.get('area') })
  if (searchParams.get('budget')) {
    const b = parseInt(searchParams.get('budget'))
    if (!isNaN(b)) activeFilters.push({ key: 'budget', label: `Under ₹${b.toLocaleString('en-IN')}` })
  }
  if (searchParams.get('gender')) {
    const g = searchParams.get('gender')
    activeFilters.push({ key: 'gender', label: g === 'male' ? 'Male PG' : g === 'female' ? 'Female PG' : 'Other PG' })
  }

  const totalCount = pagination?.total ?? pgs.length
  const hasMore = pagination ? page < pagination.pages : false

  return (
    <div className="min-h-screen bg-[#fbf9f8] text-[#1b1c1c]">
      <PublicNavbar />

      {/* Sticky filter bar */}
      <div className="sticky top-14 z-40 bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-16 py-3">
          <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
            <input
              type="text"
              value={college}
              onChange={e => setCollege(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="College name"
              className="h-[40px] px-3 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] bg-white transition-colors"
            />
            <select
              value={area}
              onChange={e => setArea(e.target.value)}
              className="h-[40px] px-3 pr-8 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] bg-white text-[#434849] appearance-none transition-colors"
              style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="">All Areas</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <input
              type="text"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="Max budget (₹)"
              className="h-[40px] px-3 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] bg-white transition-colors"
            />
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="h-[40px] px-3 pr-8 border border-[#d1d5db] rounded-xl text-sm outline-none focus:border-[#e98a76] bg-white text-[#434849] appearance-none transition-colors"
              style={{ backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={applyFilters}
              className="col-span-2 lg:col-span-1 h-[40px] bg-[#e98a76] text-white px-5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              Search
            </button>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[11px] font-medium text-[#73787a]">Active:</span>
              {activeFilters.map(f => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 bg-[#fef3f0] text-[#c0431e] border border-[#f4c4b5] px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {f.label}
                  <button
                    onClick={() => removeFilter(f.key)}
                    className="hover:text-[#e98a76] transition-colors leading-none ml-0.5"
                    aria-label={`Remove ${f.key} filter`}
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              ))}
              <button
                onClick={clearAll}
                className="text-[11px] text-[#73787a] hover:text-[#1b1c1c] underline transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <main className="max-w-[1280px] mx-auto px-4 lg:px-16 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#73787a]">
            {loading
              ? 'Searching...'
              : `${totalCount} ${totalCount === 1 ? 'property' : 'properties'} found`}
          </p>
          <Link to="/" className="text-sm text-[#e98a76] font-semibold hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">home</span>
            Home
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <SkeletonBase className="w-full h-48 rounded-none" />
                <div className="p-5 space-y-3">
                  <SkeletonBase className="h-5 w-2/3" />
                  <SkeletonBase className="h-4 w-1/2" />
                  <div className="flex gap-2 mt-4">
                    <SkeletonBase className="h-4 w-1/3" />
                    <SkeletonBase className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pgs.length > 0
              ? pgs.map(pg => <PublicPGCard key={pg._id} pg={pg} />)
              : <EmptyState hasFilters={activeFilters.length > 0} onClear={clearAll} />}
          </div>
        )}

        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 border border-[#d1d5db] rounded-xl text-sm font-semibold text-[#1b1c1c] hover:bg-[#f3f4f6] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loadingMore
                ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Loading...</>
                : 'Load more properties'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
