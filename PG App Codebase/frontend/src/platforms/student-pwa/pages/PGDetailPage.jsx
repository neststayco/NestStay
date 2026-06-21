import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getPGDetails } from '@shared/api/pgs'
import { getPublicTestimonials, createTestimonial } from '@shared/api/testimonials'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'
import { SkeletonPGDetail } from '@shared/components/Skeleton'

const PLACEHOLDER = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image'

const AMENITY_ICONS = {
  wifi: 'wifi', food: 'restaurant', ac: 'ac_unit',
  laundry: 'local_laundry_service', gym: 'fitness_center',
  cctv: 'videocam', parking: 'local_parking',
  'power backup': 'power', 'water purifier': 'water_drop',
  housekeeping: 'cleaning_services', 'study room': 'menu_book',
}

const AVATAR_COLORS = ['bg-[#ffdbd0] text-[#c0431e]', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700']

function AmenityTag({ name }) {
  const icon = AMENITY_ICONS[name.toLowerCase()]
  return (
    <span className="inline-flex items-center gap-1.5 text-sm bg-white border border-[#E5E7EB] hover:bg-[#fff3ee] hover:border-[#ffdbd0] text-[#434849] rounded-[10px] px-3 py-1.5 capitalize transition-colors">
      {icon && (
        <span className="material-symbols-outlined text-[#e98a76]"
          style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      )}
      {name}
    </span>
  )
}

function StarRating({ rating, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
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
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colorCls = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colorCls}`}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1b1c1c]">{name}</p>
            {t.isVerifiedResident && (
              <span className="inline-flex items-center gap-1 text-[11px] text-green-700 font-medium">
                <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                Verified resident
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <StarRating rating={t.rating} />
          <p className="text-[11px] text-[#73787a] mt-0.5">
            {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <p className="text-sm text-[#434849] leading-relaxed border-l-2 border-[#ffdbd0] pl-3">{t.content}</p>
    </div>
  )
}

export default function PGDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  const [testimonials, setTestimonials] = useState([])
  const [testimonialRating, setTestimonialRating] = useState(0)
  const [testimonialContent, setTestimonialContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getPublicTestimonials(id).then(res => setTestimonials(res.data || [])).catch(() => {})
  }, [id])

  async function handleSubmitTestimonial(e) {
    e.preventDefault()
    if (!testimonialRating) { toast('Please select a rating', 'error'); return }
    setSubmitting(true)
    try {
      await createTestimonial({ pgId: id, content: testimonialContent, rating: testimonialRating })
      setSubmitted(true)
      toast('Review submitted — it will appear once the owner approves it', 'success')
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit review', 'error')
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
      } catch (err) {
        setError(err.response?.status === 404 ? 'PG not found.' : 'Failed to load PG details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbf9f8]">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400" style={{ fontSize: '24px' }}>error</span>
          </div>
          <p className="text-[#1b1c1c] font-semibold mb-1">{error}</p>
          <button onClick={() => navigate('/')} className="text-sm text-[#e98a76] font-medium hover:underline mt-2 inline-block">
            &larr; Back to listings
          </button>
        </main>
      </div>
    )
  }

  const pg = data?.pg
  const userContext = data?.userContext
  const remainingCapacity = data?.remainingCapacity
  const images = pg?.images?.length > 0 ? pg.images.map(img => img?.url || img) : [PLACEHOLDER]

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((s, t) => s + (t.rating || 0), 0) / testimonials.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {loading ? <SkeletonPGDetail /> : <>

        <Link to="/" className="inline-flex items-center gap-1 text-sm text-[#73787a] hover:text-[#e98a76] transition-colors font-medium">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          All PGs
        </Link>

        {/* Gallery */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden"
          style={{ boxShadow: 'rgba(0,0,0,0.06) 0px 4px 16px' }}>
          <div className="relative h-56 sm:h-72 bg-[#f6f3f2]">
            <img
              src={images[activeImage]}
              alt={pg.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = PLACEHOLDER }}
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            {pg.isVerified && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-green-700 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                <span className="material-symbols-outlined text-green-600" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>verified</span>
                Verified PG
              </span>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                >
                  <span className="material-symbols-outlined text-[#1b1c1c]" style={{ fontSize: '18px' }}>chevron_left</span>
                </button>
                <button
                  onClick={() => setActiveImage(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                >
                  <span className="material-symbols-outlined text-[#1b1c1c]" style={{ fontSize: '18px' }}>chevron_right</span>
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}
                      className={`rounded-full transition-all ${i === activeImage ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-thin">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-14 h-10 rounded-[8px] overflow-hidden border-2 transition-all ${i === activeImage ? 'border-[#e98a76] opacity-100' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = PLACEHOLDER }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 space-y-4"
          style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#1b1c1c] leading-tight">{pg.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-[#73787a] text-sm">
                  {[pg.location?.area, pg.location?.city, pg.location?.state].filter(Boolean).join(', ')}
                </p>
                {pg.location?.coordinates?.lat && (
                  <a
                    href={`https://www.google.com/maps?q=${pg.location.coordinates.lat},${pg.location.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#e98a76] hover:text-[#c0431e] font-medium flex-shrink-0 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    View on map
                  </a>
                )}
              </div>
            </div>
            {pg.accommodation?.gender && (
              <span className="text-xs border border-[#E5E7EB] text-[#73787a] rounded-full px-3 py-1 capitalize flex-shrink-0 font-medium bg-[#fafafa]">
                {pg.accommodation.gender}
              </span>
            )}
          </div>

          {/* Pricing stat blocks */}
          <div className="grid grid-cols-3 gap-2 border-t border-[#f6f3f2] pt-4">
            {pg.pricing?.rent && (
              <div className="rounded-[12px] p-3 bg-[#fff3ee]">
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>home</span>
                  <p className="text-[10px] text-[#73787a] uppercase tracking-wide font-semibold">Rent</p>
                </div>
                <p className="text-[18px] font-bold text-[#1b1c1c] tracking-tight">
                  ₹{pg.pricing.rent.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-[#73787a]">/month</p>
              </div>
            )}
            {pg.pricing?.deposit && (
              <div className="rounded-[12px] p-3 bg-[#f6f3f2]">
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[#73787a]" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>savings</span>
                  <p className="text-[10px] text-[#73787a] uppercase tracking-wide font-semibold">Deposit</p>
                </div>
                <p className="text-[18px] font-bold text-[#1b1c1c] tracking-tight">
                  ₹{pg.pricing.deposit.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            {pg.pricing?.maintenance && (
              <div className="rounded-[12px] p-3 bg-[#f6f3f2]">
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[#73787a]" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>build</span>
                  <p className="text-[10px] text-[#73787a] uppercase tracking-wide font-semibold">Maint.</p>
                </div>
                <p className="text-[18px] font-bold text-[#1b1c1c] tracking-tight">
                  ₹{pg.pricing.maintenance.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>

          {/* Accommodation chips */}
          {(pg.accommodation?.roomTypes?.length > 0 || pg.accommodation?.totalCapacity || pg.foodType || remainingCapacity != null) && (
            <div className="flex flex-wrap gap-2 border-t border-[#f6f3f2] pt-3">
              {pg.accommodation?.roomTypes?.length > 0 && pg.accommodation.roomTypes.map(rt => (
                <span key={rt} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-1 font-medium capitalize">
                  <span className="material-symbols-outlined" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>bed</span>
                  {rt}
                </span>
              ))}
              {pg.accommodation?.totalCapacity && (
                <span className="text-xs bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-full px-2.5 py-1 font-medium">
                  {pg.accommodation.totalCapacity} beds total
                </span>
              )}
              {remainingCapacity != null && (
                <span className={`text-xs rounded-full px-2.5 py-1 font-medium border ${
                  remainingCapacity === 0
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : remainingCapacity <= 2
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {remainingCapacity === 0 ? 'Full' : `${remainingCapacity} available`}
                </span>
              )}
              {pg.foodType && (
                <span className="inline-flex items-center gap-1 text-xs bg-[#f6f3f2] text-[#434849] border border-[#E5E7EB] rounded-full px-2.5 py-1 font-medium">
                  <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '11px', fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  {pg.foodType === 'non-veg' ? 'Non-veg' : pg.foodType === 'both' ? 'Veg & Non-veg' : 'Veg only'}
                </span>
              )}
            </div>
          )}

          {pg.description && (
            <div className="border-t border-[#f6f3f2] pt-4">
              <p className="text-sm text-[#434849] leading-relaxed">{pg.description}</p>
            </div>
          )}
        </div>

        {/* Amenities */}
        {pg.amenities?.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5"
            style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
            <h2 className="text-xs font-bold text-[#73787a] uppercase tracking-widest mb-3">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {pg.amenities.map((a) => <AmenityTag key={a} name={a} />)}
            </div>
          </div>
        )}

        {/* Apply / Actions CTA */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden"
          style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>

          {!token ? (
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fff3ee] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#e98a76]" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>login</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1b1c1c] mb-0.5">Sign in to apply</p>
                <p className="text-xs text-[#73787a]">Create an account to apply for admission or raise a complaint.</p>
              </div>
              <div className="flex gap-3 justify-center pt-1">
                <Link
                  to={`/login?next=${encodeURIComponent(`/pgs/${id}/apply`)}`}
                  className="text-sm font-bold px-5 py-2.5 rounded-[12px] text-white transition-all active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, #e98a76 0%, #d4715e 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium px-5 py-2.5 rounded-[12px] border border-[#E5E7EB] text-[#434849] hover:bg-[#f6f3f2] transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          ) : userContext?.isAdmitted ? (
            <div className="p-5 space-y-3">
              <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>home</span>
                You live here
              </span>
              <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-[14px] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#1b1c1c]">Raise a Complaint</p>
                  <p className="text-xs text-[#73787a] mt-0.5">Your complaint is marked as from a verified resident.</p>
                </div>
                <Link
                  to={`/pgs/${id}/complaint`}
                  className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
                >
                  Raise
                </Link>
              </div>
            </div>
          ) : userContext?.hasActiveAdmissionElsewhere ? (
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4 text-sm text-amber-800">
                You are admitted to another PG. Leave that PG first to apply here.
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden p-5"
              style={{ background: 'linear-gradient(135deg, #e98a76 0%, #d4715e 100%)' }}>
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative">
                <h2 className="text-white font-bold text-base mb-0.5">Apply for Admission</h2>
                {userContext?.admissionStatus === 'pending' ? (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse-dot" />
                    <span className="text-white/90 text-sm font-medium">Application pending owner review</span>
                  </div>
                ) : (
                  <>
                    <p className="text-white/70 text-xs mb-4">Submit a request — the owner will review and respond.</p>
                    <Link
                      to={`/pgs/${id}/apply`}
                      className="inline-flex items-center gap-2 bg-white text-[#c0431e] text-sm font-bold px-6 py-2.5 rounded-[12px] hover:bg-[#fff3ee] active:scale-[0.97] transition-all"
                      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
                    >
                      Apply Now
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Testimonials */}
        <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5 space-y-4"
          style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#73787a] uppercase tracking-widest">
              Resident Reviews
            </h2>
            {avgRating && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-bold text-[#1b1c1c]">{avgRating}</span>
                <span className="text-xs text-[#73787a]">({testimonials.length})</span>
              </div>
            )}
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-[#E5E7EB]" style={{ fontSize: '32px' }}>rate_review</span>
              <p className="text-sm text-[#73787a] mt-2">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testimonials.map(t => <TestimonialCard key={t._id} t={t} />)}
            </div>
          )}

          {token && userContext?.isAdmitted && (
            <div className="border-t border-[#f6f3f2] pt-4">
              {submitted ? (
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50 border border-green-200 rounded-[12px] px-4 py-3">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Review submitted — pending owner approval.
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#1b1c1c] mb-3">Write a Review</p>
                  <form onSubmit={handleSubmitTestimonial} className="space-y-3">
                    <div>
                      <p className="text-xs text-[#73787a] mb-1.5 font-medium">Your rating</p>
                      <StarRating rating={testimonialRating} onChange={setTestimonialRating} />
                    </div>
                    <textarea
                      value={testimonialContent}
                      onChange={e => setTestimonialContent(e.target.value)}
                      placeholder="Share your experience living here…"
                      rows={3}
                      required
                      minLength={10}
                      className="w-full border border-[#E5E7EB] rounded-[12px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e98a76]/40 focus:border-[#e98a76] bg-white text-[#1b1c1c] placeholder-[#9ca3af] resize-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !testimonialRating || !testimonialContent.trim()}
                      className="text-sm font-bold px-5 py-2.5 rounded-[12px] text-white disabled:opacity-50 transition-all active:scale-[0.97]"
                      style={{ background: 'linear-gradient(135deg, #e98a76 0%, #d4715e 100%)' }}
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
