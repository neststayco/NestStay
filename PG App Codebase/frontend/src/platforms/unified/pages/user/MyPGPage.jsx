import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import { useAuth } from '@shared/context/AuthContext'
import { getPGDetails } from '@shared/api/pgs'
import { getMyComplaints } from '@shared/api/complaints'
import { getMyTestimonials, createTestimonial } from '@shared/api/testimonials'
import { relativeTime, absoluteDate } from '@shared/utils/relativeTime'
import { useToast } from '@shared/components/Toast'

const STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const TESTIMONIAL_STATUS_LABELS = {
  pending:  { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'Not approved', cls: 'bg-red-100 text-red-700' },
}

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-6 bg-gray-200 rounded w-1/2" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}
      </div>
    </div>
  )
}

const CONTENT_MIN = 10
const CONTENT_MAX = 500

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
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
          className="p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          <svg
            className={`w-7 h-7 transition-colors ${(hovered || value) >= s ? 'text-amber-400' : 'text-gray-200'}`}
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

export default function MyPGPage() {
  const { currentAdmission, isAdmitted } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [pg, setPg] = useState(null)
  const [myComplaints, setMyComplaints] = useState([])
  const [myTestimonials, setMyTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Testimonial form state
  const [formRating, setFormRating] = useState(5)
  const [formContent, setFormContent] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8"><Skeleton /></main>
      </div>
    )
  }

  if (error || !pg) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600 mb-4">{error || 'PG not found'}</p>
          <button onClick={() => navigate('/user')} className="text-sm text-action underline">
            &larr; Back to listings
          </button>
        </main>
      </div>
    )
  }

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
      const msg = err.response?.data?.message || 'Failed to submit review.'
      if (err.response?.status === 409) {
        setFormError('You have already submitted a review for this PG.')
      } else if (err.response?.status === 403) {
        setFormError('Only verified residents can submit a review.')
      } else {
        setFormError(msg)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {pg.images?.length > 0 && (
          <div className="h-48 rounded-xl overflow-hidden">
            <img
              src={pg.images[0]?.url || pg.images[0]}
              alt={pg.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image' }}
            />
          </div>
        )}

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{pg.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {[pg.location?.area, pg.location?.city].filter(Boolean).join(', ')}
              </p>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0">
              You live here
            </span>
          </div>
          <div
            className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400"
            title={absoluteDate(admittedDate)}
          >
            Admitted {relativeTime(admittedDate)} &middot; via {processedByLabel}
          </div>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card p-5 flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800">Have an issue?</p>
            <p className="text-xs text-gray-400 mt-0.5">Your complaint will carry verified-resident weight.</p>
          </div>
          <Link
            to={`/user/pgs/${pgId}/complaint`}
            state={{ from: '/user/my-pg' }}
            className="bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors"
          >
            Raise a Complaint
          </Link>
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Complaints</h2>
          </div>
          {myComplaintsAtThisPG.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              You haven&apos;t raised any complaints at this PG yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myComplaintsAtThisPG.map(c => (
                <div key={c._id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{c.type}</p>
                    <p
                      className="text-xs text-gray-400 mt-0.5"
                      title={absoluteDate(c.createdAt)}
                    >
                      {relativeTime(c.createdAt)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#e0e0e0] rounded-[20px] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Reviews</h2>
          </div>

          {/* Submission form — only shown when user has no review for this PG yet */}
          {!myTestimonials.some(t => String(t.pgId?._id || t.pgId) === String(pgId)) && (
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-3">Share your experience</p>
              <form onSubmit={handleSubmitTestimonial} className="space-y-3">
                <div className="flex items-center gap-2">
                  <StarPicker value={formRating} onChange={setFormRating} />
                  <span className="text-xs text-gray-400">{formRating} / 5</span>
                </div>
                <div>
                  <textarea
                    value={formContent}
                    onChange={e => { setFormContent(e.target.value); if (formError) setFormError('') }}
                    placeholder={`Write your review (min. ${CONTENT_MIN} characters)…`}
                    rows={3}
                    maxLength={CONTENT_MAX}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 bg-white transition-colors ${
                      formError ? 'border-red-400 focus:ring-red-300/50' : 'border-[#e0e0e0] focus:ring-[#e98a76]/40 focus:border-[#e98a76]'
                    }`}
                    aria-label="Review content"
                  />
                  <div className="flex items-center justify-between mt-1">
                    {formError
                      ? <p className="text-xs text-red-600">{formError}</p>
                      : <span />
                    }
                    <span className={`text-xs ml-auto ${formContent.length >= CONTENT_MAX ? 'text-red-500' : 'text-gray-400'}`}>
                      {formContent.length}/{CONTENT_MAX}
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand hover:bg-brand-light text-black text-sm font-semibold px-4 py-2 rounded-[10px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            </div>
          )}

          {/* Existing testimonials list */}
          {myTestimonials.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              You haven&apos;t written a review for this PG yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {myTestimonials.map(t => {
                const statusInfo = TESTIMONIAL_STATUS_LABELS[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={t._id} className="px-5 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <StarDisplay rating={t.rating} />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {t.status === 'approved' && t.isVisible && (
                          <span className="text-xs text-green-600 font-medium">Live</span>
                        )}
                        {t.status === 'approved' && !t.isVisible && (
                          <span className="text-xs text-gray-400">Hidden by owner</span>
                        )}
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{t.content}</p>
                    <p className="text-xs text-gray-400" title={absoluteDate(t.createdAt)}>
                      {relativeTime(t.createdAt)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
