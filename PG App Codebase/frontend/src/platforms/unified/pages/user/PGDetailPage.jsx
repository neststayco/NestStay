import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import { getPGDetails } from '@shared/api/pgs'
import { getPublicTestimonials, createTestimonial } from '@shared/api/testimonials'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'

const PLACEHOLDER = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image'

function AmenityTag({ name }) {
  return (
    <span className="inline-flex items-center text-sm bg-gray-100 text-gray-700 border border-[#e0e0e0] rounded-[10px] px-3 py-1 capitalize">
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
  return (
    <div className="bg-gray-50 rounded-[10px] p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t.createdBy?.name || 'Resident'}</p>
          {t.isVerifiedResident && (
            <span className="text-xs text-purple-600 font-medium">✓ Verified resident</span>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <StarRating rating={t.rating} />
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(t.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{t.content}</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-56 bg-gray-200 rounded-xl" />
      <div className="h-6 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}

export default function PGDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmitted } = useAuth()
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
      } catch (err) {
        setError(err.response?.status === 404 ? 'PG not found.' : 'Failed to load PG details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8"><Skeleton /></main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/user')} className="text-sm text-action underline">
            &larr; Back to listings
          </button>
        </main>
      </div>
    )
  }

  const { pg, userContext, remainingCapacity } = data
  const images = pg.images?.length > 0 ? pg.images : [PLACEHOLDER]

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Link to="/user" className="text-sm text-action hover:underline inline-flex items-center gap-1">
          &larr; All PGs
        </Link>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
          <div className="relative h-56 sm:h-72 bg-gray-100">
            <img
              src={images[activeImage]}
              alt={pg.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = PLACEHOLDER }}
            />
            {pg.isVerified && (
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                Verified PG
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-action' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = PLACEHOLDER }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pg.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-gray-500 text-sm">
                  {[pg.location?.area, pg.location?.city, pg.location?.state].filter(Boolean).join(', ')}
                </p>
                {pg.location?.coordinates?.lat && (
                  <a
                    href={`https://www.google.com/maps?q=${pg.location.coordinates.lat},${pg.location.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#027fff] hover:underline flex-shrink-0"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    View on map
                  </a>
                )}
              </div>
            </div>
            {pg.accommodation?.gender && (
              <span className="text-sm border border-[#e0e0e0] text-gray-600 rounded-full px-3 py-1 capitalize flex-shrink-0">
                {pg.accommodation.gender}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4">
            {pg.pricing?.rent && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Monthly Rent</p>
                <p className="text-lg font-bold text-[#222121]">
                  &#8377;{pg.pricing.rent.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            {pg.pricing?.deposit && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Deposit</p>
                <p className="text-lg font-semibold text-gray-700">
                  &#8377;{pg.pricing.deposit.toLocaleString('en-IN')}
                </p>
              </div>
            )}
            {pg.pricing?.maintenance && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Maintenance</p>
                <p className="text-lg font-semibold text-gray-700">
                  &#8377;{pg.pricing.maintenance.toLocaleString('en-IN')}
                </p>
              </div>
            )}
          </div>

          {(pg.accommodation?.roomTypes?.length > 0 || pg.accommodation?.totalCapacity || pg.foodType || remainingCapacity != null) && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t border-gray-100 pt-3">
              {pg.accommodation?.roomTypes?.length > 0 && (
                <span>Room types: <strong>{pg.accommodation.roomTypes.join(', ')}</strong></span>
              )}
              {pg.accommodation?.totalCapacity && (
                <span>Total capacity: <strong>{pg.accommodation.totalCapacity} beds</strong></span>
              )}
              {remainingCapacity != null && (
                <span className={remainingCapacity === 0 ? 'text-red-600 font-semibold' : ''}>
                  Available: <strong>{remainingCapacity === 0 ? 'Full' : `${remainingCapacity} beds`}</strong>
                </span>
              )}
              {pg.foodType && (
                <span>Food: <strong>{pg.foodType === 'non-veg' ? 'Non-veg' : pg.foodType === 'both' ? 'Veg & Non-veg' : 'Veg only'}</strong></span>
              )}
            </div>
          )}

          {pg.description && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-600 leading-relaxed">{pg.description}</p>
            </div>
          )}
        </div>

        {pg.amenities?.length > 0 && (
          <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {pg.amenities.map((a) => <AmenityTag key={a} name={a} />)}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Your Actions</h2>

          {userContext?.isAdmitted ? (
            <div className="space-y-3">
              <span className="inline-flex items-center bg-green-100 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full">
                You live here
              </span>
              <div className="flex items-start justify-between gap-4 border border-gray-100 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">Raise a Complaint</p>
                  <p className="text-xs text-gray-400 mt-0.5">Your complaint will be marked as from a verified resident.</p>
                </div>
                <Link
                  to={`/user/pgs/${id}/complaint`}
                  className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                  Raise
                </Link>
              </div>
            </div>
          ) : userContext?.hasActiveAdmissionElsewhere ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              You are admitted to another PG. Leave that PG first to apply here.
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 border border-gray-100 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Apply for Admission</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {userContext?.admissionStatus === 'pending'
                    ? 'Your application is pending owner review.'
                    : 'Submit a request to be admitted as a resident.'}
                </p>
              </div>
              {userContext?.admissionStatus === 'pending' ? (
                <span className="flex-shrink-0 bg-yellow-100 text-yellow-700 text-sm font-medium px-4 py-2 rounded-md">
                  Pending
                </span>
              ) : (
                <Link
                  to={`/user/pgs/${id}/apply`}
                  className="flex-shrink-0 bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
                >
                  Apply
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Testimonials */}
        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
            Resident Reviews {testimonials.length > 0 && <span className="text-gray-400 font-normal normal-case">({testimonials.length})</span>}
          </h2>

          {testimonials.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {testimonials.map(t => <TestimonialCard key={t._id} t={t} />)}
            </div>
          )}

          {isAdmitted && (
            <div className="border-t border-gray-100 pt-4">
              {submitted ? (
                <p className="text-sm text-green-600 font-medium">Your review has been submitted and is pending owner approval.</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-800 mb-3">Write a Review</p>
                  <form onSubmit={handleSubmitTestimonial} className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Rating</p>
                      <StarRating rating={testimonialRating} onChange={setTestimonialRating} />
                    </div>
                    <textarea
                      value={testimonialContent}
                      onChange={e => setTestimonialContent(e.target.value)}
                      placeholder="Share your experience living here…"
                      rows={3}
                      required
                      minLength={10}
                      className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50 resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting || !testimonialRating || !testimonialContent.trim()}
                      className="bg-brand hover:bg-brand-light disabled:opacity-50 text-black text-sm font-semibold px-5 py-2 rounded-[10px] transition-colors"
                    >
                      {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
