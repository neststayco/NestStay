import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import OwnerSidebar from './OwnerSidebar'
import { useAuth } from '@shared/context/AuthContext'
import { getPGAdmissions } from '@shared/api/admissions'
import { getPGDetails } from '@shared/api/pgs'

export default function OwnerLayout() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pgName, setPgName] = useState(null)

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
          <img src="/logo.png" alt="Nest Stay" className="h-9 w-auto" />
          <span className="text-sm font-semibold text-[#1b1c1c] truncate">
            {pgName || 'Owner Portal'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
