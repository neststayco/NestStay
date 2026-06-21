import { useAuth } from '@shared/context/AuthContext'

export default function WaitingApprovalPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4 text-center">
        {/* Illustration */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Greeting */}
        {user?.name && (
          <p className="text-sm font-medium text-[#73787a] mb-1">
            Hi, {user.name}
          </p>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#1b1c1c] mb-3 tracking-tight">
          Under Review
        </h1>

        {/* Status badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending admin approval
        </span>

        {/* Subtitle */}
        <p className="text-[#73787a] text-sm leading-relaxed mb-8">
          Your PG listing has been submitted for admin review. We'll notify you
          once it's approved — usually within 24 hours.
        </p>

        {/* Divider */}
        <div className="border-t border-[#f0f0f0] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
