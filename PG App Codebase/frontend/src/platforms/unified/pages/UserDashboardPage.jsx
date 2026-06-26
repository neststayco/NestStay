import { useState, useEffect, useRef } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import UserNavbar from '../components/UserNavbar'
import PGCard from '@shared/components/PGCard'
import OfflineBanner from '@shared/components/OfflineBanner'
import { getPGList } from '@shared/api/pgs'
import { withdrawAdmission, getMyAdmission } from '@shared/api/admissions'
import { useAuth } from '@shared/context/AuthContext'
import { normalizeAdmission } from '@shared/utils/normalizeAdmission'
import { useToast } from '@shared/components/Toast'
import { SkeletonBase } from '@shared/components/Skeleton'
import { usePWAInstall } from '@shared/hooks/usePWAInstall'

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'price', label: 'Price: low to high' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const FOOD_OPTIONS = [
  { value: '', label: 'Any food' },
  { value: 'veg', label: 'Veg only' },
  { value: 'non-veg', label: 'Non-veg' },
  { value: 'both', label: 'Veg & Non-veg' },
]

const AMENITY_OPTIONS = [
  'wifi', 'food', 'ac', 'laundry', 'gym', 'cctv',
  'parking', 'power backup', 'water purifier', 'housekeeping', 'study room',
]


export default function UserDashboardPage() {
  const { isAdmitted, admissionLoaded, currentAdmission, setCurrentAdmission, savedPGIds, toggleSave } = useAuth()
  const toast = useToast()
  const { canInstall, promptInstall, showIOSBanner, dismissIOSBanner } = usePWAInstall()
  const [withdrawing, setWithdrawing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || '')
  const [localCity, setLocalCity] = useState(searchParams.get('city') || '')
  const [localArea, setLocalArea] = useState(searchParams.get('area') || '')
  const [localMinPrice, setLocalMinPrice] = useState(searchParams.get('minPrice') || '')
  const [localMaxPrice, setLocalMaxPrice] = useState(searchParams.get('maxPrice') || '')

  // Debounce refs — one per debounced input
  const debounceRefs = useRef({})
  const [openFilter, setOpenFilter] = useState(null)
  const filterBarRef = useRef(null)

  // Derive all filter values from URL (source of truth for fetching)
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

  // Close filter popovers on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Re-sync admission status on every dashboard visit (catches owner rejection)
  useEffect(() => {
    getMyAdmission()
      .then(res => setCurrentAdmission(normalizeAdmission(res.data)))
      .catch(() => setCurrentAdmission(null))
  }, [])

  // Fetch whenever URL params change
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
      next.delete('page') // reset to page 1 on filter change
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

  function toggleAmenity(val) {
    const next = selectedAmenities.includes(val)
      ? selectedAmenities.filter(a => a !== val)
      : [...selectedAmenities, val]
    updateParams({ amenities: next.join(',') })
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
    Object.values(debounceRefs.current).forEach(clearTimeout)
    setSearchParams({}, { replace: false })
  }

  const hasFilters = search || city || area || gender || foodType || minPrice || maxPrice || amenities || sortBy

  function formatK(n) {
    const num = Number(n)
    return num >= 1000 ? `${Math.round(num / 1000)}k` : String(num)
  }

  const budgetLabel = (() => {
    if (minPrice && maxPrice) return `₹${formatK(minPrice)}–₹${formatK(maxPrice)}`
    if (minPrice) return `₹${formatK(minPrice)}+`
    if (maxPrice) return `Up to ₹${formatK(maxPrice)}`
    return 'Budget'
  })()

  const locationLabel = (() => {
    if (city && area) return `${area}, ${city}`
    return city || area || 'Location'
  })()

  const selectedAmenities = amenities
    ? amenities.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const amenitiesLabel = (() => {
    if (!selectedAmenities.length) return 'Amenities'
    if (selectedAmenities.length === 1) return selectedAmenities[0]
    return `${selectedAmenities[0]} +${selectedAmenities.length - 1}`
  })()

  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'
  const genderLabel = GENDER_OPTIONS.find(o => o.value === gender)?.label || 'Gender'
  const foodLabel = FOOD_OPTIONS.find(o => o.value === foodType)?.label || 'Food'

  const chipCls = (active) =>
    `flex items-center gap-1.5 h-10 px-3.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap focus:outline-none ${
      active
        ? 'bg-[#e98a76] border-[#e98a76] text-white shadow-sm'
        : 'bg-white border-[#E5E7EB] text-[#434849] hover:border-[#c8c2bc] hover:bg-[#fbf9f8]'
    }`

  const popoverCls = 'absolute top-full left-0 mt-2 bg-white rounded-2xl border border-[#E5E7EB] p-4 z-20 min-w-[200px] animate-slide-in'
  const popoverShadow = { boxShadow: 'rgba(0,0,0,0.10) 0px 12px 40px, rgba(0,0,0,0.04) 0px 2px 8px' }

  const popoverInput = 'w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] bg-white'
  const popoverLabel = 'text-[10px] font-bold text-[#6c757d] uppercase tracking-widest mb-1.5 block'

  function ChevronDown() {
    return (
      <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  function ClearX({ onClick }) {
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={e => e.key === 'Enter' && onClick(e)}
        className="w-4 h-4 rounded-full bg-white/30 hover:bg-white/50 flex items-center justify-center text-[10px] font-bold transition-colors"
        aria-label="Clear filter"
      >
        ✕
      </span>
    )
  }

  if (admissionLoaded && isAdmitted) {
    return <Navigate to="/user/my-pg" replace />
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <OfflineBanner />
      <UserNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero */}
        <div
          className="rounded-[24px] overflow-hidden mb-5 border border-[#ffdbd0]"
          style={{
            background: 'linear-gradient(135deg, #fff3ee 0%, #fbf9f8 55%, #ffffff 100%)',
            boxShadow: 'rgba(233,138,118,0.12) 0px 8px 32px, rgba(0,0,0,0.04) 0px 2px 8px',
          }}
        >
          <div className="px-6 py-8 lg:py-10 flex items-center justify-between gap-8">
            {/* Copy */}
            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-bold text-[#e98a76] uppercase tracking-widest mb-3">
                Verified PG Listings
              </span>
              <h1 className="text-2xl lg:text-[28px] font-bold text-[#1b1c1c] leading-tight mb-2">
                Find Your Safe Home<br className="hidden sm:block" /> Away From Home
              </h1>
              <p className="text-sm text-[#73787a] mb-5 max-w-sm leading-relaxed">
                Browse verified PG listings across Pune — no hidden surprises.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Verified Listings', icon: 'verified_user', delay: '0ms' },
                  { label: 'Easy Applications', icon: 'assignment', delay: '80ms' },
                  { label: 'Resident Reviews', icon: 'reviews', delay: '160ms' },
                ].map(({ label, icon, delay }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c0431e] bg-white border border-[#ffdbd0] rounded-full px-3 py-1.5 animate-slide-in"
                    style={{ boxShadow: 'rgba(233,138,118,0.10) 0px 2px 8px', animationDelay: delay, animationFillMode: 'both' }}
                  >
                    <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Illustration — warm palette */}
            <div className="hidden lg:flex flex-shrink-0 items-center justify-center w-[180px] h-[150px]">
              <svg width="180" height="150" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <ellipse cx="90" cy="92" rx="76" ry="50" fill="#ffdbd0" fillOpacity="0.5" />
                {/* Left building */}
                <rect x="14" y="74" width="28" height="56" rx="3" fill="#ffdbd0" />
                <rect x="19" y="80" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.5" />
                <rect x="31" y="80" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.4" />
                <rect x="19" y="93" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.3" />
                <rect x="31" y="93" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.5" />
                {/* Right building */}
                <rect x="138" y="84" width="28" height="46" rx="3" fill="#ffdbd0" />
                <rect x="143" y="90" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.3" />
                <rect x="155" y="90" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.5" />
                <rect x="143" y="103" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.5" />
                <rect x="155" y="103" width="8" height="7" rx="1.5" fill="#e98a76" fillOpacity="0.3" />
                {/* Main building */}
                <rect x="48" y="46" width="84" height="84" rx="5" fill="white" stroke="#ffdbd0" strokeWidth="2" />
                {/* Roof */}
                <path d="M40 48L90 14L140 48Z" fill="#e98a76" fillOpacity="0.10" />
                <path d="M40 48L90 14L140 48" stroke="#e98a76" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />
                {/* Windows */}
                <rect x="59" y="59" width="16" height="13" rx="2" fill="#e98a76" fillOpacity="0.20" />
                <rect x="82" y="59" width="16" height="13" rx="2" fill="#e98a76" fillOpacity="0.35" />
                <rect x="105" y="59" width="16" height="13" rx="2" fill="#e98a76" fillOpacity="0.20" />
                <rect x="59" y="80" width="16" height="13" rx="2" fill="#e98a76" fillOpacity="0.35" />
                <rect x="82" y="80" width="16" height="13" rx="2" fill="#e98a76" fillOpacity="0.15" />
                <rect x="105" y="80" width="16" height="13" rx="2" fill="#e98a76" fillOpacity="0.35" />
                {/* Door */}
                <rect x="79" y="103" width="22" height="27" rx="3" fill="#e98a76" fillOpacity="0.18" />
                <circle cx="98" cy="117" r="2" fill="#e98a76" fillOpacity="0.5" />
                {/* Shield badge */}
                <circle cx="90" cy="31" r="13" fill="#e98a76" />
                <path d="M90 24.5L85 27v4.5c0 3.5 2.5 6.5 5 7.5 2.5-1 5-4 5-7.5V27L90 24.5z" fill="white" fillOpacity="0.9" />
                <path d="M87.5 31.5L89.5 33.5L93 30" stroke="#e98a76" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Ground */}
                <line x1="10" y1="130" x2="170" y2="130" stroke="#ffdbd0" strokeWidth="2" strokeLinecap="round" />
                <circle cx="20" cy="42" r="3" fill="#e98a76" fillOpacity="0.20" />
                <circle cx="160" cy="56" r="4" fill="#e98a76" fillOpacity="0.12" />
              </svg>
            </div>
          </div>
        </div>

        {canInstall && (
          <div className="flex items-center justify-between gap-3 bg-[#fff3ee] border border-[#ffdbd0] rounded-2xl px-5 py-3.5 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4M8 12l4 4 4-4" /><path d="M4 20h16" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1b1c1c]">Install Nest Stay</p>
                <p className="text-xs text-[#73787a]">Add to your home screen for quick access</p>
              </div>
            </div>
            <button
              onClick={promptInstall}
              className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full bg-[#FF5A1F] text-white hover:bg-[#e04e18] transition-colors"
            >
              Install
            </button>
          </div>
        )}

        {showIOSBanner && (
          <div className="flex items-start justify-between gap-3 bg-[#fff3ee] border border-[#ffdbd0] rounded-2xl px-5 py-3.5 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#FF5A1F] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v13M8 12l4 4 4-4" /><path d="M5 20h14" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1b1c1c]">Install Nest Stay</p>
                <p className="text-xs text-[#73787a] mt-0.5 leading-relaxed">
                  Tap <span className="font-medium text-[#FF5A1F]">Share</span> <span className="inline-block">↑</span> in Safari, then <span className="font-medium text-[#FF5A1F]">Add to Home Screen</span>
                </p>
              </div>
            </div>
            <button
              onClick={dismissIOSBanner}
              className="flex-shrink-0 text-[#73787a] hover:text-[#1b1c1c] transition-colors mt-0.5"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {currentAdmission && currentAdmission.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Application pending review</p>
                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                  Awaiting owner decision. You cannot apply to another PG until this is resolved.
                </p>
              </div>
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
                className="text-xs font-semibold px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-xl disabled:opacity-50 transition-colors"
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
                className="text-xs font-semibold px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl disabled:opacity-50 transition-colors"
              >
                {withdrawing ? 'Withdrawing…' : 'Withdraw'}
              </button>
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#6c757d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, area, or amenity…"
            value={localSearch}
            onChange={e => debounceParam('search', e.target.value, setLocalSearch)}
            className="w-full h-12 pl-11 pr-10 border border-[#E5E7EB] rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] transition-shadow"
            style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 4px 20px' }}
          />
          {localSearch && (
            <button
              className="absolute inset-y-0 right-3 flex items-center text-[#6c757d] hover:text-[#333]"
              onClick={() => debounceParam('search', '', setLocalSearch)}
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div ref={filterBarRef} className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 hide-scrollbar">

          {/* Location */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter(openFilter === 'location' ? null : 'location')}
              className={chipCls(city || area)}
            >
              {locationLabel}
              {(city || area)
                ? <ClearX onClick={e => { e.stopPropagation(); updateParams({ city: '', area: '' }); setLocalCity(''); setLocalArea('') }} />
                : <ChevronDown />}
            </button>
            {openFilter === 'location' && (
              <div className={popoverCls} style={popoverShadow}>
                <label className={popoverLabel}>City</label>
                <input
                  className={`${popoverInput} mb-3`}
                  placeholder="e.g. Pune"
                  value={localCity}
                  onChange={e => debounceParam('city', e.target.value, setLocalCity)}
                  autoFocus
                />
                <label className={popoverLabel}>Area / Locality</label>
                <input
                  className={popoverInput}
                  placeholder="e.g. Koregaon Park"
                  value={localArea}
                  onChange={e => debounceParam('area', e.target.value, setLocalArea)}
                />
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter(openFilter === 'budget' ? null : 'budget')}
              className={chipCls(minPrice || maxPrice)}
            >
              {budgetLabel}
              {(minPrice || maxPrice)
                ? <ClearX onClick={e => { e.stopPropagation(); updateParams({ minPrice: '', maxPrice: '' }); setLocalMinPrice(''); setLocalMaxPrice('') }} />
                : <ChevronDown />}
            </button>
            {openFilter === 'budget' && (
              <div className={popoverCls} style={{ ...popoverShadow, minWidth: '240px' }}>
                <label className={popoverLabel}>Monthly Rent (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className={popoverInput}
                    placeholder="Min"
                    value={localMinPrice}
                    onChange={e => debounceParam('minPrice', e.target.value, setLocalMinPrice)}
                  />
                  <span className="text-[#6c757d] font-medium">–</span>
                  <input
                    type="number"
                    className={popoverInput}
                    placeholder="Max"
                    value={localMaxPrice}
                    onChange={e => debounceParam('maxPrice', e.target.value, setLocalMaxPrice)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter(openFilter === 'gender' ? null : 'gender')}
              className={chipCls(gender)}
            >
              {genderLabel}
              {gender
                ? <ClearX onClick={e => { e.stopPropagation(); updateParams({ gender: '' }) }} />
                : <ChevronDown />}
            </button>
            {openFilter === 'gender' && (
              <div className={popoverCls} style={popoverShadow}>
                <label className={popoverLabel}>Gender</label>
                <div className="space-y-0.5">
                  {GENDER_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => { updateParams({ gender: o.value }); setOpenFilter(null) }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                        gender === o.value ? 'bg-[#fff3ee] text-[#e98a76] font-semibold' : 'text-[#333] hover:bg-gray-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Food */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter(openFilter === 'food' ? null : 'food')}
              className={chipCls(foodType)}
            >
              {foodLabel}
              {foodType
                ? <ClearX onClick={e => { e.stopPropagation(); updateParams({ foodType: '' }) }} />
                : <ChevronDown />}
            </button>
            {openFilter === 'food' && (
              <div className={popoverCls} style={popoverShadow}>
                <label className={popoverLabel}>Food preference</label>
                <div className="space-y-0.5">
                  {FOOD_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => { updateParams({ foodType: o.value }); setOpenFilter(null) }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                        foodType === o.value ? 'bg-[#fff3ee] text-[#e98a76] font-semibold' : 'text-[#333] hover:bg-gray-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter(openFilter === 'amenities' ? null : 'amenities')}
              className={chipCls(selectedAmenities.length > 0)}
            >
              {amenitiesLabel}
              {selectedAmenities.length > 0
                ? <ClearX onClick={e => { e.stopPropagation(); updateParams({ amenities: '' }) }} />
                : <ChevronDown />}
            </button>
            {openFilter === 'amenities' && (
              <div className={popoverCls} style={{ ...popoverShadow, minWidth: '260px' }}>
                <label className={popoverLabel}>Amenities</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {AMENITY_OPTIONS.map(opt => {
                    const active = selectedAmenities.includes(opt)
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleAmenity(opt)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                          active
                            ? 'bg-[#e98a76] border-[#e98a76] text-white'
                            : 'bg-white border-[#E5E7EB] text-[#434849] hover:border-[#c8c2bc]'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {selectedAmenities.length > 0 && (
                  <button
                    onClick={() => updateParams({ amenities: '' })}
                    className="mt-2.5 text-[10px] text-[#6c757d] hover:text-[#333] underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenFilter(openFilter === 'sort' ? null : 'sort')}
              className={chipCls(sortBy)}
            >
              {sortLabel}
              {sortBy
                ? <ClearX onClick={e => { e.stopPropagation(); updateParams({ sortBy: '' }) }} />
                : <ChevronDown />}
            </button>
            {openFilter === 'sort' && (
              <div className={popoverCls} style={{ ...popoverShadow, left: 'auto', right: 0 }}>
                <label className={popoverLabel}>Sort by</label>
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => { updateParams({ sortBy: o.value }); setOpenFilter(null) }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                        sortBy === o.value ? 'bg-[#fff3ee] text-[#e98a76] font-semibold' : 'text-[#333] hover:bg-gray-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear all */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 h-9 px-3.5 text-xs font-semibold text-[#6c757d] hover:text-[#333] border border-[#E5E7EB] rounded-full bg-white hover:bg-gray-50 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => updateParams({})}
              className="text-sm font-medium underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden" style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 4px 20px' }}>
                <SkeletonBase className="w-full h-56 rounded-none" />
                <div className="p-4 space-y-3">
                  <SkeletonBase className="h-4 w-3/4" />
                  <SkeletonBase className="h-3 w-1/2" />
                  <SkeletonBase className="h-5 w-1/3" />
                  <div className="flex gap-1.5">
                    <SkeletonBase className="h-5 w-12 rounded-md" />
                    <SkeletonBase className="h-5 w-10 rounded-md" />
                    <SkeletonBase className="h-5 w-14 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pgs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f6f3f2] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#6c757d]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="font-bold text-[#1b1c1c] text-base mb-1">No PGs found</p>
            <p className="text-sm text-[#6c757d] max-w-xs mx-auto">
              {hasFilters
                ? 'No listings match your current filters. Try broadening your search.'
                : 'No verified PG listings available yet. Check back soon.'}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#e98a76] border border-[#ffdbd0] bg-[#fff3ee] hover:bg-[#ffdbd0] px-4 py-2 rounded-full transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Result count */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#6c757d]">
                Showing{' '}
                <span className="font-bold text-[#1b1c1c]">
                  {(pagination?.totalItems ?? pgs.length).toLocaleString('en-IN')}
                </span>{' '}
                verified PG{(pagination?.totalItems ?? pgs.length) !== 1 ? 's' : ''}
                {(city || area) && (
                  <> in <span className="font-bold text-[#1b1c1c]">{[area, city].filter(Boolean).join(', ')}</span></>
                )}
              </p>
              {pagination && pagination.totalPages > 1 && (
                <span className="text-xs text-[#6c757d]">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
              )}
            </div>

            {/* PG grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up">
              {pgs.map(pg => (
                <PGCard
                  key={pg._id}
                  pg={pg}
                  basePath="/user/pgs"
                  isSaved={savedPGIds.has(pg._id)}
                  onSave={toggleSave}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-full bg-white hover:bg-gray-50 hover:border-[#c0c0c0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - page) <= 1
                    )
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '…' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-sm text-[#6c757d]">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                            p === page
                              ? 'bg-[#e98a76] text-white shadow-sm'
                              : 'text-[#444] hover:bg-gray-100'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-[#E5E7EB] rounded-full bg-white hover:bg-gray-50 hover:border-[#c0c0c0] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
