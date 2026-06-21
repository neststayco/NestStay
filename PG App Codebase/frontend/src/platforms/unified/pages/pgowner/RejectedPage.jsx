import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'
import client from '@shared/api/client'

export default function RejectedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPG() {
      setLoading(true)
      setError('')
      try {
        const res = await client.get('/onboarding/my-pg')
        setRejectionReason(res.data?.pg?.rejectionReason || res.data?.rejectionReason || '')
      } catch {
        setError('Failed to load rejection details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchPG()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Greeting */}
        {user?.name && (
          <p className="text-sm font-medium text-[#73787a] mb-1 text-center">
            Hi, {user.name}
          </p>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#1b1c1c] mb-3 tracking-tight text-center">
          Listing Requires Changes
        </h1>

        {/* Status badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Submission rejected
          </span>
        </div>

        {/* Rejection reason */}
        {loading ? (
          <div className="bg-[#f6f3f2] border border-[#E5E7EB] rounded-lg p-4 mb-6 animate-pulse">
            <div className="h-3 bg-[#E5E7EB] rounded w-1/3 mb-2" />
            <div className="h-3 bg-[#E5E7EB] rounded w-full mb-1" />
            <div className="h-3 bg-[#E5E7EB] rounded w-4/5" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-500 mb-1.5">
              Reason for rejection
            </p>
            <p className="text-sm leading-relaxed">
              {rejectionReason || 'No specific reason provided. Please review your listing details and resubmit.'}
            </p>
          </div>
        )}

        {/* Helper text */}
        <p className="text-[#73787a] text-sm leading-relaxed mb-6 text-center">
          Please address the feedback above and resubmit your listing for another review.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/pgowner/onboarding')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm mb-4"
        >
          Edit &amp; Resubmit
        </button>

        {/* Divider */}
        <div className="border-t border-[#f0f0f0] pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="mailto:support@neststay.in"
            className="text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
          >
            Contact Support
          </a>

          <button
            onClick={logout}
            className="text-sm font-medium text-[#73787a] hover:text-[#1b1c1c] transition-colors px-4 py-2 rounded-lg border border-[#E5E7EB] hover:bg-[#f6f3f2]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
