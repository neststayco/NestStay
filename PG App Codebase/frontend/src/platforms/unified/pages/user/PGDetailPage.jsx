import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import OfflineBanner from '@shared/components/OfflineBanner'
import { getPGDetails, togglePGLike } from '@shared/api/pgs'
import { getPublicTestimonials, createTestimonial } from '@shared/api/testimonials'
import { createVisit } from '@shared/api/visits'
import { recordView } from '@shared/api/leads'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import { SkeletonPGDetail } from '@shared/components/Skeleton'

function BookmarkIcon({ filled }) {
  return filled ? (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
    </svg>
  ) : (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z" />
    </svg>
  )
}

const PLACEHOLDER = 'https://placehold.co/800x400/f6f3f2/73787a?text=No+Image'

const AMENITY_ICONS = {
  wifi:            'wifi',
  food:            'restaurant',
  ac:              'ac_unit',
  laundry:         'local_laundry_service',
  gym:             'fitness_center',
  cctv:            'videocam',
  parking:         'local_parking',
  'power backup':  'power',
  'water purifier':'water_drop',
  housekeeping:    'cleaning_services',
  'study room':    'menu_book',
}

const FOOD_LABELS = {
  veg:      'Veg only',
  'non-veg':'Non-veg',
  both:     'Veg & Non-veg',
}

function AmenityTag({ name }) {
  const icon = AMENITY_ICONS[name.toLowerCase()] || 'check_circle'
  return (
    <span className="inline-flex items-center gap-1.5 text-sm bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-[10px] px-3 py-1.5 capitalize hover:bg-[#fff3ee] hover:border-[#ffdbd0] hover:text-[#1b1c1c] transition-all duration-150 cursor-default select-none">
      <span
        className="material-symbols-outlined text-[#e98a76]"
        style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}
      >{icon}</span>
      {name}
    </span>
  )
}

function StarRating({ rating, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={`${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <svg className={`w-5 h-5 ${s <= (hovered || rating) ? 'text-amber-400' : 'text-gray-200'} transition-colors`} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function TestimonialCard({ t }) {
  const name = t.createdBy?.name || 'Resident'
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['bg-[#e98a76]','bg-[#027fff]','bg-green-500','bg-purple-500','bg-amber-500']
  const avatarColor = colors[name.charCodeAt(0) % colors.length]

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-4 space-y-3 transition-all hover:border-[#d4cfc9] hover:-translate-y-0.5"
      style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor}`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#1b1c1c] leading-tight">{name}</p>
              {t.isVerifiedResident && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5 mt-0.5">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                  </svg>
                  Verified resident
                </span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <StarRating rating={t.rating} />
              <p className="text-[11px] text-[#9ca3af] mt-0.5">
                {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-sm text-[#434849] leading-relaxed pl-12 border-l-2 border-[#f0eded] ml-4.5">
        &ldquo;{t.content}&rdquo;
      </p>
    </div>
  )
}

function ChevronIcon({ dir }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

export default function PGDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmitted, savedPGIds, toggleSave } = useAuth()
  const toast = useToast()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [liking, setLiking] = useState(false)

  const [testimonials, setTestimonials] = useState([])
  const [testimonialRating, setTestimonialRating] = useState(0)
  const [testimonialContent, setTestimonialContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [visitModalOpen, setVisitModalOpen] = useState(false)
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [visitLoading, setVisitLoading] = useState(false)
  const [visitSubmitted, setVisitSubmitted] = useState(false)

  async function handleLike() {
    if (liking) return
    setLiking(true)
    try {
      const res = await togglePGLike(id)
      setLiked(res.liked)
      setLikesCount(res.likesCount)
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to update like', 'error')
    } finally {
      setLiking(false)
    }
  }

  async function handleScheduleVisit(e) {
    e.preventDefault()
    if (!visitDate || !visitTime) return
    setVisitLoading(true)
    try {
      await createVisit({ pgId: id, visitDate, visitTime })
      setVisitSubmitted(true)
      toast('Visit request submitted!', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit visit request', 'error')
    } finally {
      setVisitLoading(false)
    }
  }

  useEffect(() => {
    getPublicTestimonials(id).then(res => setTestimonials(res.data || [])).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!user) return
    const timer = setTimeout(() => { recordView(id).catch(() => {}) }, 5000)
    return () => clearTimeout(timer)
  }, [id, user])

  async function handleSubmitTestimonial(e) {
    e.preventDefault()
    if (!testimonialRating) { toast('Please select a rating', 'error'); return }
    setSubmitting(true)
    try {
      await createTestimonial({ pgId: id, content: testimonialContent, rating: testimonialRating })
      setSubmitted(true)
      toast('Testimonial submitted — it will appear once the owner approves it', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit testimonial', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await getPGDetails(id)
        setData(res)
        setLiked(res.pg?.isLiked || false)
        setLikesCount(res.pg?.likesCount || 0)
      } catch (err) {
        const status = err.response?.status
        if (status === 404) setError('PG not found or no longer active.')
        else if (status === 400) setError('Invalid PG identifier.')
        else setError('Failed to load PG details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    const is404 = error.includes('not found') || error.includes('404')
    const is400 = error.includes('Invalid')
    return (
      <div className="min-h-screen bg-[#fbf9f8]">
        <OfflineBanner />
        <UserNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-8 inline-block e2">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${is404 || is400 ? 'bg-[#f6f3f2]' : 'bg-red-50'}`}>
              <svg className={`w-7 h-7 ${is404 || is400 ? 'text-[#73787a]' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-bold text-[#1b1c1c] text-lg mb-1">
              {is404 ? 'PG not found' : is400 ? 'Invalid request' : 'Something went wrong'}
            </p>
            <p className="text-sm text-[#73787a] mb-5">{error}</p>
            <Link to="/user" className="inline-flex items-center gap-1.5 text-sm text-[#e98a76] font-semibold hover:underline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to listings
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const pg = data?.pg
  const userContext = data?.userContext
  const remainingCapacity = data?.remainingCapacity
  const images = pg?.images?.length > 0 ? pg.images.map(img => img?.url || img) : [PLACEHOLDER]

  function prevImage() { setActiveImage(i => (i - 1 + images.length) % images.length) }
  function nextImage() { setActiveImage(i => (i + 1) % images.length) }

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <OfflineBanner />
      <UserNavbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? <SkeletonPGDetail /> : <>
        <Link to="/user" className="inline-flex items-center gap-1.5 text-sm text-[#73787a] hover:text-[#e98a76] font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All PGs
        </Link>

        {/* Gallery */}
        <div className="bg-white border border-[#E5E7EB] rounded-[24px] overflow-hidden"
          style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 8px 30px' }}>
          <div className="relative h-72 sm:h-80 lg:h-96 bg-[#f6f3f2] overflow-hidden">
            <img
              key={activeImage}
              src={images[activeImage]}
              alt={pg.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => { e.target.src = PLACEHOLDER }}
            />
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

            {/* Verified badge */}
            {pg.isVerified && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-green-700 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                Verified PG
              </span>
            )}

            {/* Photo counter */}
            {images.length > 1 && (
              <span className="absolute top-4 right-4 text-xs text-white font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                {activeImage + 1} / {images.length}
              </span>
            )}

            {/* Gallery arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1b1c1c] hover:bg-white hover:scale-110 transition-all duration-150"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}
                  aria-label="Previous image"
                >
                  <ChevronIcon dir="left" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#1b1c1c] hover:bg-white hover:scale-110 transition-all duration-150"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}
                  aria-label="Next image"
                >
                  <ChevronIcon dir="right" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === activeImage ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-[#fbf9f8] border-t border-[#f0eded] hide-scrollbar">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-16 h-11 rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                    i === activeImage
                      ? 'border-[#e98a76] scale-105'
                      : 'border-transparent opacity-60 hover:opacity-90 hover:border-[#d4cfc9]'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = PLACEHOLDER }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Video */}
        {pg.video?.url && (
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden"
            style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
            <video
              src={pg.video.url}
              controls
              className="w-full max-h-72 object-cover"
              preload="metadata"
            />
          </div>
        )}

        {/* PG Info */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 space-y-5"
          style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 4px 16px' }}>

          {/* Name row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-[#1b1c1c] leading-snug">{pg.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-[#73787a] text-sm">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-[#9ca3af]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {[pg.location?.area, pg.location?.city, pg.location?.state].filter(Boolean).join(', ')}
                </div>
                {pg.location?.coordinates?.lat && (
                  <a
                    href={`https://www.google.com/maps?q=${pg.location.coordinates.lat},${pg.location.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#e98a76] hover:underline font-semibold flex-shrink-0"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    View on map
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {pg.likesEnabled && (
                <button
                  onClick={handleLike}
                  disabled={liking}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 transition-all duration-200 ${
                    liked
                      ? 'bg-[#fff3ee] border-[#e98a76] text-[#e98a76]'
                      : 'border-[#E5E7EB] text-[#9ca3af] hover:border-[#e98a76] hover:text-[#e98a76]'
                  }`}
                  title={liked ? 'Unlike' : 'Like'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {likesCount > 0 && <span className="text-xs font-semibold">{likesCount}</span>}
                </button>
              )}
              <button
                onClick={() => toggleSave(pg._id)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 btn-glow ${
                  savedPGIds.has(pg._id)
                    ? 'bg-[#fff3ee] border-[#e98a76] text-[#e98a76] scale-110'
                    : 'border-[#E5E7EB] text-[#9ca3af] hover:border-[#e98a76] hover:text-[#e98a76] hover:scale-110'
                }`}
                title={savedPGIds.has(pg._id) ? 'Unsave' : 'Save'}
              >
                <BookmarkIcon filled={savedPGIds.has(pg._id)} />
              </button>
              {pg.accommodation?.gender && (
                <span className="text-xs border border-[#E5E7EB] bg-[#f6f3f2] text-[#434849] rounded-full px-3 py-1 capitalize font-medium flex-shrink-0">
                  {pg.accommodation.gender}
                </span>
              )}
            </div>
          </div>

          {/* Pricing stat blocks */}
          {(pg.pricing?.rent || pg.pricing?.deposit || pg.pricing?.maintenance) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {pg.pricing?.rent && (
                <div className="bg-[#fff3ee] border border-[#ffdbd0] rounded-[14px] p-3">
                  <p className="text-[10px] font-bold text-[#e98a76] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>payments</span>
                    Monthly Rent
                  </p>
                  <p className="text-xl font-bold text-[#1b1c1c] tracking-tight">
                    &#8377;{pg.pricing.rent.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {pg.pricing?.deposit && (
                <div className="bg-[#f6f3f2] border border-[#E5E7EB] rounded-[14px] p-3">
                  <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                    Deposit
                  </p>
                  <p className="text-lg font-bold text-[#434849]">
                    &#8377;{pg.pricing.deposit.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {pg.pricing?.maintenance && (
                <div className="bg-[#f6f3f2] border border-[#E5E7EB] rounded-[14px] p-3">
                  <p className="text-[10px] font-bold text-[#73787a] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>build</span>
                    Maintenance
                  </p>
                  <p className="text-lg font-bold text-[#434849]">
                    &#8377;{pg.pricing.maintenance.toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Accommodation quick stats */}
          {(pg.accommodation?.roomTypes?.length > 0 || pg.accommodation?.totalCapacity || pg.foodType || remainingCapacity != null) && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-[#f6f3f2]">
              {pg.accommodation?.roomTypes?.length > 0 && pg.accommodation.roomTypes.map(rt => (
                <span key={rt} className="inline-flex items-center gap-1 text-xs bg-[#f6f3f2] border border-[#E5E7EB] text-[#434849] rounded-full px-3 py-1 font-medium capitalize">
                  <span className="material-symbols-outlined text-[#73787a]" style={{ fontSize: '13px' }}>bed</span>
                  {rt}
                </span>
              ))}
              {pg.accommodation?.totalCapacity && (
                <span className="inline-flex items-center gap-1 text-xs bg-[#f6f3f2] border border-[#E5E7EB] text-[#434849] rounded-full px-3 py-1 font-medium">
                  <span className="material-symbols-outlined text-[#73787a]" style={{ fontSize: '13px' }}>groups</span>
                  {pg.accommodation.totalCapacity} beds total
                </span>
              )}
              {remainingCapacity != null && (
                <span className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 font-semibold border ${
                  remainingCapacity === 0
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : remainingCapacity <= 2
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>
                    {remainingCapacity === 0 ? 'block' : 'check_circle'}
                  </span>
                  {remainingCapacity === 0 ? 'Fully booked' : `${remainingCapacity} bed${remainingCapacity !== 1 ? 's' : ''} available`}
                </span>
              )}
              {pg.foodType && (
                <span className={`inline-flex items-center gap-1 text-xs rounded-full px-3 py-1 font-medium border ${
                  pg.foodType === 'veg'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : pg.foodType === 'non-veg'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  {FOOD_LABELS[pg.foodType]}
                </span>
              )}
              {pg.separateKitchenAvailable && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1 font-medium">
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>kitchen</span>
                  Separate kitchen
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {pg.description && (
            <div className="pt-1 border-t border-[#f6f3f2]">
              <p className="text-sm text-[#434849] leading-relaxed">{pg.description}</p>
            </div>
          )}
        </div>

        {/* Amenities */}
        {pg.amenities?.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5"
            style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
            <h2 className="text-xs font-bold text-[#e98a76] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>verified</span>
              Amenities
            </h2>
            <div className="flex flex-wrap gap-2">
              {pg.amenities.map((a) => <AmenityTag key={a} name={a} />)}
            </div>
          </div>
        )}

        {/* Action card */}
        <div className="rounded-[20px] overflow-hidden"
          style={{ boxShadow: 'rgba(0,0,0,0.05) 0px 4px 16px' }}>

          {userContext?.isAdmitted ? (
            <div className="bg-white border border-[#E5E7EB] p-5 space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                Verified Resident
              </span>
              <div className="bg-[#f6f3f2] border border-[#E5E7EB] rounded-[14px] p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1b1c1c]">Raise a Complaint</p>
                  <p className="text-xs text-[#73787a] mt-0.5 leading-relaxed">Your complaint will be marked as from a verified resident.</p>
                </div>
                <Link
                  to={`/user/pgs/${id}/complaint`}
                  className="flex-shrink-0 bg-[#e98a76] hover:opacity-90 active:scale-[0.97] text-white text-sm font-semibold px-4 py-2 rounded-[10px] transition-all btn-glow"
                >
                  Raise
                </Link>
              </div>
            </div>
          ) : userContext?.hasActiveAdmissionElsewhere ? (
            <div className="bg-amber-50 border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-600" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>info</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Already admitted elsewhere</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">You are admitted to another PG. Leave that PG first to apply here.</p>
                </div>
              </div>
            </div>
          ) : userContext?.admissionStatus === 'pending' ? (
            <div className="bg-white border border-[#E5E7EB] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#1b1c1c]">Application Under Review</p>
                  <p className="text-xs text-[#73787a] mt-0.5">Awaiting owner decision — you&apos;ll be notified of any update.</p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-[10px]">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" />
                  Pending
                </span>
              </div>
            </div>
          ) : (
            /* Primary CTA — Apply for admission */
            <div className="relative overflow-hidden p-5"
              style={{ background: 'linear-gradient(135deg, #e98a76 0%, #d4715e 100%)' }}>
              {/* Decorative glows */}
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-black/05 rounded-full blur-lg pointer-events-none" />

              <div className="relative">
                <h2 className="text-white font-bold text-base mb-0.5 leading-tight">Connect to PG</h2>
                <p className="text-white/70 text-xs mb-4 leading-relaxed">Submit a request — the owner will review and respond.</p>
                <Link
                  to={`/user/pgs/${id}/apply`}
                  className="inline-flex items-center gap-2 bg-white text-[#c0431e] text-sm font-bold px-6 py-2.5 rounded-[12px] hover:bg-[#fff3ee] active:scale-[0.97] transition-all"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
                >
                  Connect to PG
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Schedule Visit */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5"
          style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1b1c1c]">Schedule a Visit</p>
              <p className="text-xs text-[#73787a] mt-0.5">Request an in-person visit to this PG.</p>
            </div>
            <button
              onClick={() => { setVisitModalOpen(true); setVisitSubmitted(false) }}
              className="flex-shrink-0 bg-[#f6f3f2] hover:bg-[#eae8e7] text-[#434849] text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors border border-[#E5E7EB]"
            >
              Schedule Visit
            </button>
          </div>
        </div>

        {/* Visit modal */}
        {visitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1b1c1c]">Schedule a Visit</h3>
                <button onClick={() => setVisitModalOpen(false)} className="text-[#73787a] hover:text-[#1b1c1c] p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {visitSubmitted ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Visit request sent! The owner will be in touch.
                </div>
              ) : (
                <form onSubmit={handleScheduleVisit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#73787a] uppercase tracking-widest mb-1.5">Preferred Date</label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={e => setVisitDate(e.target.value)}
                      min={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()}
                      required
                      className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#73787a] uppercase tracking-widest mb-1.5">Preferred Time</label>
                    <input
                      type="time"
                      value={visitTime}
                      onChange={e => setVisitTime(e.target.value)}
                      required
                      className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setVisitModalOpen(false)}
                      className="flex-1 border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] text-sm font-medium py-2.5 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={visitLoading || !visitDate || !visitTime}
                      className="flex-1 bg-[#e98a76] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                      {visitLoading ? 'Submitting…' : 'Send Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 space-y-4"
          style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#e98a76] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>reviews</span>
              Resident Reviews
              {testimonials.length > 0 && (
                <span className="text-[#9ca3af] font-normal normal-case ml-1">({testimonials.length})</span>
              )}
            </h2>
            {testimonials.length > 0 && (() => {
              const avg = testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length
              return (
                <div className="flex items-center gap-1.5 bg-[#fff3ee] border border-[#ffdbd0] rounded-full px-3 py-1">
                  <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-xs font-bold text-[#1b1c1c]">{avg.toFixed(1)}</span>
                </div>
              )
            })()}
          </div>

          {testimonials.length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#fff3ee] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '22px' }}>forum</span>
              </div>
              <p className="text-sm font-semibold text-[#434849]">No reviews yet</p>
              <p className="text-xs text-[#73787a] mt-1 max-w-xs mx-auto leading-relaxed">Be the first verified resident to share your experience about this PG.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map(t => <TestimonialCard key={t._id} t={t} />)}
            </div>
          )}

          {isAdmitted && (
            <div className="border-t border-[#f6f3f2] pt-4">
              {submitted ? (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-[12px] px-4 py-3">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Review submitted — pending owner approval.
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#1b1c1c] mb-3">Write a Review</p>
                  <form onSubmit={handleSubmitTestimonial} className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-[#73787a] uppercase tracking-wider mb-1.5">Rating</p>
                      <StarRating rating={testimonialRating} onChange={setTestimonialRating} />
                    </div>
                    <div className="relative">
                      <textarea
                        value={testimonialContent}
                        onChange={e => setTestimonialContent(e.target.value)}
                        placeholder="Share your experience living here…"
                        rows={3}
                        required
                        minLength={10}
                        maxLength={1000}
                        className="w-full border border-[#E5E7EB] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76] focus:border-[#e98a76] bg-[#f6f3f2] resize-none transition-colors"
                      />
                      {testimonialContent.length >= 750 && (
                        <p className={`text-xs mt-1 text-right ${testimonialContent.length >= 950 ? 'text-red-500' : 'text-[#9ca3af]'}`}>
                          {testimonialContent.length}/1000
                        </p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !testimonialRating || !testimonialContent.trim()}
                      className="bg-[#e98a76] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-[10px] transition-all active:scale-[0.97] btn-glow"
                    >
                      {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
        </>}
      </main>
    </div>
  )
}
