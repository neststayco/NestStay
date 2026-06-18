import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import { createComplaint } from '@shared/api/complaints'
import { getPGDetails } from '@shared/api/pgs'
import { useAuth } from '@shared/context/AuthContext'
import ImageUploadField from '@shared/components/ImageUploadField'

const COMPLAINT_TYPES = [
  { value: '', label: 'Select complaint type…' },
  { value: 'food', label: 'Food quality / hygiene' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'security', label: 'Security concerns' },
  { value: 'management', label: 'Management / behaviour' },
  { value: 'other', label: 'Other' },
]

function SuccessState({ pgName, backPath }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Complaint submitted</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
        Your complaint has been submitted and is now visible on the PG's profile.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to={backPath}
          className="bg-brand hover:bg-brand-light text-black text-sm font-semibold px-5 py-2.5 rounded-[10px] transition-colors"
        >
          Back to {pgName || 'PG'}
        </Link>
        <Link
          to="/user"
          className="border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-[10px] transition-colors"
        >
          Browse PGs
        </Link>
      </div>
    </div>
  )
}

export default function ComplaintFormPage() {
  const { id: pgId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmitted, admissionLoaded, currentAdmission } = useAuth()

  const backPath = location.state?.from || `/user/pgs/${pgId}`

  const isResidentOfThisPG = isAdmitted && currentAdmission?.pgId === pgId

  const [pgName, setPgName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getPGDetails(pgId)
      .then((res) => setPgName(res.pg?.name || ''))
      .catch(() => {})
  }, [pgId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!type) { setError('Please select a complaint type.'); return }
    if (description.trim().length < 5) { setError('Description must be at least 5 characters.'); return }

    setLoading(true)
    try {
      await createComplaint({ pgId, type, description: description.trim(), image: image.trim() || undefined, isAnonymous })
      setSubmitted(true)
    } catch (err) {
      if (err.response?.status === 429) {
        setError('You already submitted a complaint for this PG recently. Please wait 15 minutes.')
        return
      }
      setError(err.response?.data?.message || 'Failed to submit complaint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-xl mx-auto px-4 py-6">
        <Link
          to={backPath}
          className="text-sm text-action hover:underline inline-flex items-center gap-1 mb-5"
        >
          &larr; Back to PG
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-6 py-4">
            <h1 className="text-lg font-bold text-gray-900">Raise a Complaint</h1>
            {pgName && (
              <p className="text-sm text-gray-500 mt-0.5">
                For <span className="font-medium text-gray-700">{pgName}</span>
              </p>
            )}
          </div>

          {!admissionLoaded ? (
            <div className="p-6 text-center text-sm text-gray-400">Checking residency…</div>
          ) : !isResidentOfThisPG ? (
            <div className="p-6 text-center py-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 mb-4">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Verified residents only</h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-5">
                Only current residents of this PG with an approved admission can submit complaints.
              </p>
              <Link
                to={backPath}
                className="border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-[10px] transition-colors"
              >
                Back to PG
              </Link>
            </div>
          ) : submitted ? (
            <SuccessState pgName={pgName} backPath={backPath} />
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complaint type <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action bg-gray-50"
                >
                  {COMPLAINT_TYPES.map((t) => (
                    <option key={t.value} value={t.value} disabled={t.value === ''}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe the issue in detail…"
                  className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action resize-none"
                />
                <p className={`text-xs mt-1 ${description.length < 5 && description.length > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {description.length} chars (min 5)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence photo <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <ImageUploadField
                  value={image}
                  onChange={setImage}
                  disabled={loading}
                  folder="/complaint-evidence"
                  filePrefix="complaint"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-[10px] border border-[#e0e0e0]">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAnonymous}
                  onClick={() => setIsAnonymous((v) => !v)}
                  className={`relative flex-shrink-0 w-10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-action mt-0.5 ${isAnonymous ? 'bg-action' : 'bg-gray-300'}`}
                  style={{ height: '22px' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: isAnonymous ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-800">Submit anonymously</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your name won&apos;t be visible to the PG owner.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(backPath)}
                  className="flex-1 border border-[#e0e0e0] text-gray-700 hover:bg-gray-50 text-sm font-medium py-2.5 rounded-[10px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium py-2.5 rounded-[10px] transition-colors"
                >
                  {loading ? 'Submitting…' : 'Submit complaint'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
