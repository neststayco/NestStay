import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import OwnerSidebar from './OwnerSidebar'
import { useAuth } from '@shared/context/AuthContext'
import { getPGAdmissions } from '@shared/api/admissions'
import { getPGDetails } from '@shared/api/pgs'
import { usePWAInstall } from '@shared/hooks/usePWAInstall'

export default function OwnerLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pgName, setPgName] = useState(null)
  const { canInstall, promptInstall, showIOSBanner, dismissIOSBanner } = usePWAInstall()

  useEffect(() => {
    getPGAdmissions({ status: 'pending', limit: 1 })
      .then(res => setPendingCount(res.pagination?.totalItems ?? 0))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user?.pgId) return
    getPGDetails(user.pgId)
      .then(res => setPgName(res.pg?.name ?? null))
      .catch(() => {})
  }, [user?.pgId])

  return (
    <div className="flex h-screen bg-[#fbf9f8] overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 md:relative md:flex md:flex-shrink-0
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <OwnerSidebar
          onClose={() => setSidebarOpen(false)}
          pendingCount={pendingCount}
          pgName={pgName}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB]"
          style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(251,249,248,0.92)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#73787a] hover:bg-[#f6f3f2] transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img src="/logo2.png" alt="Nest Stay" className="h-9 w-auto" />
          <span className="text-sm font-semibold text-[#1b1c1c] truncate flex-1">
            {pgName || 'Owner Portal'}
          </span>
          {canInstall && (
            <button
              onClick={promptInstall}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FF5A1F] text-white hover:bg-[#e04e18] transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M8 12l4 4 4-4" /><path d="M4 20h16" />
              </svg>
              Install
            </button>
          )}
          {showIOSBanner && (
            <button
              onClick={dismissIOSBanner}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FF5A1F] text-white hover:bg-[#e04e18] transition-colors"
              title="Tap Share ↑ then Add to Home Screen"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v13M8 12l4 4 4-4" /><path d="M5 20h14" />
              </svg>
              Install
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {canInstall && (
            <div className="hidden md:flex items-center justify-between gap-3 px-6 py-2.5 bg-[#fff3ee] border-b border-[#ffdbd0]">
              <div className="flex items-center gap-2 text-sm text-[#c0431e]">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" />
                </svg>
                <span className="font-medium">Install Nest Stay on your device for faster access</span>
              </div>
              <button
                onClick={promptInstall}
                className="flex-shrink-0 text-xs font-semibold px-4 py-1.5 rounded-full bg-[#FF5A1F] text-white hover:bg-[#e04e18] transition-colors"
              >
                Install App
              </button>
            </div>
          )}
          {showIOSBanner && (
            <div className="flex items-center justify-between gap-3 px-6 py-2.5 bg-[#fff3ee] border-b border-[#ffdbd0]">
              <div className="flex items-center gap-2 text-sm text-[#c0431e]">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v13M8 12l4 4 4-4" /><path d="M5 20h14" />
                </svg>
                <span className="font-medium">
                  Install: tap <span className="font-bold">Share</span> ↑ in Safari → <span className="font-bold">Add to Home Screen</span>
                </span>
              </div>
              <button
                onClick={dismissIOSBanner}
                className="flex-shrink-0 text-[#73787a] hover:text-[#1b1c1c] transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </div>
  )
}
