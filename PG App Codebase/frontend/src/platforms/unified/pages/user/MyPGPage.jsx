import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import { useAuth } from '@shared/context/AuthContext'
import { getPGDetails } from '@shared/api/pgs'
import { getMyComplaints } from '@shared/api/complaints'
import { getMyTestimonials, createTestimonial } from '@shared/api/testimonials'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'
import { useToast } from '@shared/components/Toast'
import { SkeletonBase } from '@shared/components/Skeleton'

const COMPLAINT_STATUS = {
  pending:  { label: 'Under review', cls: 'bg-amber-50 text-amber-700 border border-amber-200', bar: 'bg-amber-400' },
  approved: { label: 'Verified', cls: 'bg-green-50 text-green-700 border border-green-200', bar: 'bg-green-500' },
  rejected: { label: 'Not approved', cls: 'bg-red-50 text-red-600 border border-red-200', bar: 'bg-red-400' },
}

const COMPLAINT_TYPE_ICONS = {
  food: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><line x1="7" y1="2" x2="7" y2="11"/><path d="M21 15V2s-5 2-5 11v2h5z"/>
    </svg>
  ),
  cleanliness: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 015 5v3a5 5 0 01-10 0V7a5 5 0 015-5z"/><path d="M19.07 10.93a8 8 0 11-14.14 0"/>
    </svg>
  ),
  security: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
    </svg>
  ),
  management: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  other: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  ),
}

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' }

const TESTIMONIAL_STATUS = {
  pending:  { label: 'Pending review', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border border-green-200' },
  rejected: { label: 'Not approved', cls: 'bg-red-50 text-red-600 border border-red-200' },
}

const COMPLAINT_TYPE_LABELS = {
  food: 'Food quality / hygiene',
  cleanliness: 'Cleanliness',
  security: 'Security concerns',
  management: 'Management / behaviour',
  other: 'Other',
}

const PLACEHOLDER_IMG = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image'

const CONTENT_MIN = 10
const CONTENT_MAX = 500

function StarDisplay({ rating, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`${sz} ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded transition-transform hover:scale-110 active:scale-95 flex-shrink-0"
        >
          <svg
            className={`w-8 h-8 transition-colors ${(hovered || value) >= s ? 'text-amber-400' : 'text-gray-200'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        <SkeletonBase className="h-[380px] rounded-[20px]" />
        <div className="space-y-4">
          <SkeletonBase className="h-52 rounded-[20px]" />
          <SkeletonBase className="h-36 rounded-[20px]" />
        </div>
      </div>
      <SkeletonBase className="h-52 rounded-[20px]" />
      <SkeletonBase className="h-72 rounded-[20px]" />
    </div>
  )
}

export default function MyPGPage() {
  const { currentAdmission, isAdmitted } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [pg, setPg] = useState(null)
  const [myComplaints, setMyComplaints] = useState([])
  const [myTestimonials, setMyTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Testimonial form
  const [formRating, setFormRating] = useState(5)
  const [formContent, setFormContent] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [activeTab, setActiveTab] = useState('complaints')

  const pgId = currentAdmission?.pgId

  useEffect(() => {
    if (!isAdmitted || !pgId) {
      navigate('/user', { replace: true })
      return
    }
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [pgRes, complaintsRes, testimonialsRes] = await Promise.all([
          getPGDetails(pgId),
          getMyComplaints(),
          getMyTestimonials(),
        ])
        setPg(pgRes.pg)
        setMyComplaints(complaintsRes.data || [])
        setMyTestimonials(testimonialsRes.data || [])
      } catch {
        setError('Failed to load your PG details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pgId, isAdmitted, navigate])

  async function handleSubmitTestimonial(e) {
    e.preventDefault()
    setFormError('')
    if (!formContent.trim() || formContent.trim().length < CONTENT_MIN) {
      setFormError(`Review must be at least ${CONTENT_MIN} characters.`)
      return
    }
    setSubmitting(true)
    try {
      const res = await createTestimonial({ pgId, content: formContent.trim(), rating: formRating })
      setMyTestimonials(prev => [...prev, res.data])
      setFormContent('')
      setFormRating(5)
      toast('Review submitted for owner approval.', 'success')
    } catch (err) {
      if (err.response?.status === 409) {
        setFormError('You have already submitted a review for this PG.')
      } else if (err.response?.status === 403) {
        setFormError('Only verified residents can submit a review.')
      } else {
        setFormError(err.response?.data?.message || 'Failed to submit review.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const myComplaintsAtThisPG = myComplaints.filter(c => {
    const cPgId = c.pgId?._id || c.pgId
    return String(cPgId) === String(pgId)
  })

  const admittedDate = currentAdmission?.updatedAt || currentAdmission?.createdAt
  const processedByLabel = currentAdmission?.processedBy?.role === 'owner' ? 'PG Owner' : 'Platform Admin'
  const hasReviewedThisPG = myTestimonials.some(t => String(t.pgId?._id || t.pgId) === String(pgId))

  if (!loading && (error || !pg)) {
    return (
      <div className="min-h-screen bg-[#fbf9f8]">
        <UserNavbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[#1b1c1c] font-semibold mb-1">{error || 'PG not found'}</p>
          <button onClick={() => navigate('/user')} className="text-sm text-[#e98a76] hover:underline mt-2">
            ← Back to listings
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbf9f8]">
      <UserNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {loading ? <PageSkeleton /> : (
          <>
            {/* ── Top 2-column grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start animate-fade-up" style={{ animationDelay: '0ms' }}>

              {/* Left — Premium PG card */}
              <div
                className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden transition-all duration-200"
                style={{ boxShadow: 'rgba(0,0,0,0.07) 0px 8px 30px' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.10) 0px 12px 40px'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.07) 0px 8px 30px'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Cover image */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={pg.images?.[0]?.url || pg.images?.[0] || PLACEHOLDER_IMG}
                    alt={pg.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.src = PLACEHOLDER_IMG }}
                  />
                  {/* Bottom gradient for legibility */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                  {/* Active resident badge */}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-green-700 border border-green-100 rounded-full px-3 py-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Currently Living Here
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">
                  {/* Primary identity */}
                  <h1 className="text-xl font-bold text-[#1b1c1c] leading-tight">{pg.name}</h1>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 text-[#73787a] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <p className="text-sm text-[#73787a]">
                      {[pg.location?.area, pg.location?.city].filter(Boolean).join(', ')}
                    </p>
                  </div>

                  {/* Secondary info — amenities + rent on surface-low strip */}
                  {(pg.amenities?.length > 0 || pg.pricing?.rent) && (
                    <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
                      {pg.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {pg.amenities.map(a => (
                            <span key={a} className="text-xs bg-[#f6f3f2] text-[#73787a] rounded-md px-2.5 py-1 capitalize font-medium">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      {pg.pricing?.rent && (
                        <p className="text-lg font-bold text-[#e98a76]">
                          ₹{pg.pricing.rent.toLocaleString('en-IN')}
                          <span className="text-xs font-normal text-[#73787a] ml-1">/month</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer — verified resident */}
                  <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      Verified Resident
                    </div>
                    <p className="text-xs text-[#73787a]" title={absoluteDate(admittedDate)}>
                      Admitted {relativeTime(admittedDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">

                {/* Residency details card — L1 */}
                <div
                  className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden"
                  style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 4px 20px' }}
                >
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4 border-b border-[#f0f0f0]">
                    <span className="text-[10px] font-bold text-[#73787a] uppercase tracking-widest block mb-1">Your Residency</span>
                    <h2 className="text-sm font-bold text-[#1b1c1c]">Residency Details</h2>
                  </div>

                  {/* Data rows — grouped on surface-low */}
                  <div className="px-5 py-4">
                    <div className="bg-[#fbf9f8] rounded-2xl border border-[#f0f0f0] divide-y divide-[#f0f0f0] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-[11px] text-[#73787a] font-semibold uppercase tracking-wide">Status</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Active
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-[11px] text-[#73787a] font-semibold uppercase tracking-wide">Admitted on</span>
                        <span className="text-xs font-bold text-[#1b1c1c]">
                          {new Date(admittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-[11px] text-[#73787a] font-semibold uppercase tracking-wide">Approved by</span>
                        <span className="text-xs font-bold text-[#1b1c1c]">{processedByLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Verified resident block */}
                  <div className="px-5 pb-5">
                    <div className="bg-[#f6f3f2] rounded-2xl p-3 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-green-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1b1c1c]">Verified Resident</p>
                        <p className="text-[11px] text-[#73787a] mt-0.5 leading-relaxed">
                          As a verified resident, your complaints are given higher priority.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complaint CTA card — Level 2 warm surface */}
                <div
                  className="rounded-[20px] border border-[#f0ddd5] overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #fff8f5 0%, #fff3ee 100%)', boxShadow: 'rgba(233,138,118,0.16) 0px 6px 24px, rgba(0,0,0,0.03) 0px 1px 4px' }}
                >
                  {/* Info area */}
                  <div className="p-5 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(233,138,118,0.15)', border: '1px solid rgba(233,138,118,0.25)' }}>
                      <svg style={{ width: 18, height: 18, color: '#e98a76' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1b1c1c]">Have an issue?</p>
                      <p className="text-xs text-[#434849] mt-0.5 leading-relaxed">
                        As a verified resident, your reports receive priority review.
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mx-5 border-t border-[#f0ddd5]" />

                  {/* CTA area */}
                  <div className="p-5">
                    <Link
                      to={`/user/pgs/${pgId}/complaint`}
                      state={{ from: '/user/my-pg' }}
                      className="flex items-center justify-center gap-2 w-full text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #e98a76 0%, #d4725f 100%)', boxShadow: 'rgba(233,138,118,0.35) 0px 4px 14px' }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Raise a Complaint
                    </Link>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Tabbed bottom card (Complaints | Review) ── */}
            <div
              className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden animate-fade-up"
              style={{ boxShadow: 'rgba(0,0,0,0.07) 0px 8px 30px', animationDelay: '120ms' }}
            >
              {/* Tab bar — warm surface bg */}
              <div className="px-5 border-b border-[#E5E7EB] flex items-center justify-between gap-3 bg-[#fbf9f8]">
                <div className="flex min-w-0 flex-1">
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className={`relative py-3.5 px-1 mr-5 text-sm font-semibold transition-colors ${
                      activeTab === 'complaints'
                        ? 'text-[#1b1c1c]'
                        : 'text-[#6c757d] hover:text-[#1b1c1c]'
                    }`}
                  >
                    Complaints
                    {myComplaintsAtThisPG.length > 0 && (
                      <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === 'complaints' ? 'bg-[#1b1c1c] text-white' : 'bg-[#f0f0f0] text-[#6c757d]'
                      }`}>
                        {myComplaintsAtThisPG.length}
                      </span>
                    )}
                    {activeTab === 'complaints' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1b1c1c] rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('review')}
                    className={`relative py-3.5 px-1 text-sm font-semibold transition-colors ${
                      activeTab === 'review'
                        ? 'text-[#1b1c1c]'
                        : 'text-[#6c757d] hover:text-[#1b1c1c]'
                    }`}
                  >
                    My Review
                    {hasReviewedThisPG && (
                      <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                        activeTab === 'review' ? 'bg-[#1b1c1c] text-white' : 'bg-[#f0f0f0] text-[#6c757d]'
                      }`}>
                        1
                      </span>
                    )}
                    {activeTab === 'review' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1b1c1c] rounded-full" />
                    )}
                  </button>
                </div>

                {activeTab === 'complaints' && (
                  <Link
                    to={`/user/pgs/${pgId}/complaint`}
                    state={{ from: '/user/my-pg' }}
                    className="text-xs font-semibold text-[#e98a76] hover:underline flex-shrink-0 whitespace-nowrap"
                  >
                    + New
                  </Link>
                )}
              </div>

              {/* Complaints tab panel */}
              {activeTab === 'complaints' && (
                <div className="animate-slide-in">
                  {myComplaintsAtThisPG.length === 0 ? (
                    <div className="py-14 text-center px-6">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                        <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-[#1b1c1c]">All clear!</p>
                      <p className="text-xs text-[#6c757d] mt-1.5 max-w-xs mx-auto leading-relaxed">
                        No issues reported at this PG. If something comes up, you can raise a complaint anytime.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {myComplaintsAtThisPG.map((c, i) => {
                        const status = COMPLAINT_STATUS[c.status] || { label: c.status, cls: 'bg-gray-100 text-gray-600 border border-gray-200', bar: 'bg-gray-300' }
                        const typeIcon = COMPLAINT_TYPE_ICONS[c.type]
                        return (
                          <div
                            key={c._id}
                            className="flex gap-0 rounded-2xl border border-[#e8e8e8] overflow-hidden transition-shadow hover:shadow-md"
                            style={{ boxShadow: 'rgba(0,0,0,0.04) 0px 2px 8px', animationDelay: `${i * 40}ms` }}
                          >
                            <div className={`w-1 flex-shrink-0 ${status.bar}`} />
                            <div className="flex-1 px-4 py-3.5 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[#6c757d] flex-shrink-0">{typeIcon}</span>
                                  <p className="text-sm font-semibold text-[#1b1c1c] truncate">
                                    {COMPLAINT_TYPE_LABELS[c.type] || c.type}
                                  </p>
                                </div>
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${status.cls}`}>
                                  {status.label}
                                </span>
                              </div>
                              {c.description && (
                                <p className="text-xs text-[#6c757d] mt-1.5 line-clamp-2 leading-relaxed">
                                  {c.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] text-[#6c757d]" title={absoluteDate(c.createdAt)}>
                                  {relativeTime(c.createdAt)}
                                </span>
                                {c.isAnonymous && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#6c757d] font-medium">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                    Anonymous
                                  </span>
                                )}
                                {(c.evidence || c.images?.length > 0) && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-[#6c757d] font-medium">
                                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                    Evidence
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Review tab panel */}
              {activeTab === 'review' && (
                <div className="animate-slide-in">
                  {!hasReviewedThisPG && (
                    <div className="p-5 border-b border-[#f0f0f0]">
                      <form onSubmit={handleSubmitTestimonial} className="space-y-5">
                        <div className="bg-[#f6f3f2] border border-[#f0f0f0] rounded-2xl px-4 py-4">
                          <p className="text-xs font-semibold text-[#6c757d] uppercase tracking-wide mb-3">Overall rating</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <StarPicker value={formRating} onChange={setFormRating} />
                            <span className="text-sm font-bold text-[#1b1c1c]">{RATING_LABELS[formRating]}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#6c757d] uppercase tracking-wide mb-2">Your experience</p>
                          <textarea
                            value={formContent}
                            onChange={e => { setFormContent(e.target.value); if (formError) setFormError('') }}
                            placeholder="Describe the food, cleanliness, management, and overall vibe…"
                            rows={4}
                            maxLength={CONTENT_MAX}
                            className={`w-full border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 bg-white transition-colors leading-relaxed ${
                              formError
                                ? 'border-red-300 focus:ring-red-200 text-red-600 placeholder-red-300'
                                : 'border-[#E5E7EB] focus:border-[#e98a76] placeholder-gray-400'
                            }`}
                            aria-label="Review content"
                          />
                          <div className="flex items-start justify-between mt-1.5 gap-2">
                            <p className={`text-xs ${formError ? 'text-red-600' : 'text-[#6c757d]'}`}>
                              {formError || `Minimum ${CONTENT_MIN} characters`}
                            </p>
                            <span className={`text-xs font-medium flex-shrink-0 ${formContent.length >= CONTENT_MAX ? 'text-red-500' : 'text-[#6c757d]'}`}>
                              {formContent.length}/{CONTENT_MAX}
                            </span>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={submitting || formContent.trim().length < CONTENT_MIN}
                          className="bg-[#e98a76] hover:opacity-90 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          {submitting ? 'Submitting…' : 'Submit review'}
                        </button>
                      </form>
                    </div>
                  )}

                  {myTestimonials.length === 0 && (
                    <div className="py-12 text-center px-6">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#f6f3f2] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#6c757d]" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-[#1b1c1c]">No review yet</p>
                      <p className="text-xs text-[#6c757d] mt-1">Submit the form above to share your experience.</p>
                    </div>
                  )}

                  {myTestimonials.map(t => {
                    const statusInfo = TESTIMONIAL_STATUS[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-600 border border-gray-200' }
                    return (
                      <div key={t._id} className="p-5">
                        <div className="relative bg-[#f6f3f2] border border-[#f0f0f0] rounded-2xl px-5 pt-5 pb-4">
                          <div className="absolute top-3 right-4 text-5xl leading-none text-[#e8e8e8] font-serif select-none" aria-hidden="true">"</div>
                          <div className="flex items-center gap-2 mb-3">
                            <StarDisplay rating={t.rating} size="lg" />
                            <span className="text-sm font-bold text-[#1b1c1c]">{RATING_LABELS[t.rating]}</span>
                          </div>
                          <p className="text-sm text-[#1b1c1c] leading-relaxed">{t.content}</p>
                          <p className="text-[11px] text-[#6c757d] mt-3" title={absoluteDate(t.createdAt)}>
                            Submitted {relativeTime(t.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 px-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.cls}`}>
                            {t.status === 'pending' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                            )}
                            {t.status === 'approved' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                            {t.status === 'rejected' && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            )}
                            {statusInfo.label}
                          </span>
                          {t.status === 'approved' && (
                            <span className={`text-xs font-medium ${t.isVisible ? 'text-green-600' : 'text-[#6c757d]'}`}>
                              {t.isVisible ? '● Live on PG page' : 'Hidden by owner'}
                            </span>
                          )}
                          {t.status === 'pending' && (
                            <span className="text-xs text-[#6c757d]">Awaiting owner approval</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </>
        )}
      </main>
    </div>
  )
}
