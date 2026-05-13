import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import UserNavbar from '../../components/UserNavbar'
import { getPGDetails } from '@shared/api/pgs'
import { createAdmissionRequest } from '@shared/api/admissions'
import { useAuth } from '@shared/context/AuthContext'
import { useToast } from '@shared/components/Toast'

export default function AdmissionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setCurrentAdmission } = useAuth()
  const toast = useToast()

  const [pgName, setPgName] = useState('')
  const [moveInNote, setMoveInNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loadingPG, setLoadingPG] = useState(true)

  useEffect(() => {
    getPGDetails(id)
      .then(res => setPgName(res.pg?.name || ''))
      .catch(() => {})
      .finally(() => setLoadingPG(false))
  }, [id])

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await createAdmissionRequest({ pgId: id, moveInNote })
      setCurrentAdmission(res.data)
      setSubmitted(true)
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to submit request. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your admission request has been sent to the PG owner. You&apos;ll be notified once they review it.
              If no response in 5 days, our team will step in.
            </p>
            <Link to="/user" className="text-sm text-action hover:underline">
              &larr; Back to listings
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Link to={`/user/pgs/${id}`} className="text-sm text-action hover:underline inline-flex items-center gap-1 mb-6">
          &larr; Back to PG
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Apply for Admission</h1>
          {!loadingPG && pgName && (
            <p className="text-sm text-gray-500 mb-5">{pgName}</p>
          )}

          <div className="bg-action-50 border border-action-100 rounded-[10px] p-4 mb-5 text-sm text-[#222121]">
            The PG owner will review your request and admit or reject you. Once admitted, your complaints will carry verified-resident credibility.
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Move-in note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={moveInNote}
                onChange={(e) => setMoveInNote(e.target.value)}
                rows={3}
                placeholder="Briefly describe when you moved in or any relevant context…"
                className="w-full border border-[#e0e0e0] rounded-[10px] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-light disabled:opacity-60 text-black font-semibold py-2.5 rounded-[10px] transition-colors text-sm h-[42px]"
            >
              {loading ? 'Submitting…' : 'Submit Admission Request'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
